import OpenAI from 'openai';
import { z } from 'zod';
import type { Transcript } from 'assemblyai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export type SpeakerMap = Map<string, string>;

/**
 * Build a `label → name` map directly from AssemblyAI's Speaker Identification
 * result. Labels left unresolved (mapped back to their diarization letter) are
 * skipped so callers fall back to "Speaker A". Used as the seed for — and
 * fallback from — the GPT reconciliation pass.
 */
export function createSpeakerMap(transcript: Transcript): SpeakerMap {
	const speakerMap = new Map<string, string>();
	const mapping = transcript.speech_understanding?.response?.speaker_identification?.mapping;
	if (!mapping) return speakerMap;

	for (const [label, name] of Object.entries(mapping)) {
		const normalizedId = label.replace(/^Speaker\s+/i, '');
		const cleanedName = name?.replace(/^Speaker\s+/i, '').trim();
		if (cleanedName && cleanedName !== normalizedId) {
			speakerMap.set(normalizedId, name.trim());
		}
	}

	return speakerMap;
}

const ReconciliationSchema = z.object({
	speakers: z.array(
		z.object({
			label: z.string(),
			name: z.string().nullable(),
			reasoning: z.string(),
		}),
	),
});

const jsonSchema = {
	name: 'speaker_reconciliation',
	strict: true,
	schema: {
		type: 'object',
		properties: {
			speakers: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						label: { type: 'string', description: 'The diarization label, e.g. "A"' },
						name: {
							type: ['string', 'null'],
							description: 'The identified real name, or null if it cannot be determined',
						},
						reasoning: { type: 'string', description: 'Brief evidence for the decision' },
					},
					required: ['label', 'name', 'reasoning'],
					additionalProperties: false,
				},
			},
		},
		required: ['speakers'],
		additionalProperties: false,
	},
};

const makeReconciliationPrompt = (knownSpeakers: string[], audioMapping: string) =>
	`You are reconciling speaker identities in a diarized meeting transcript. Each line is labeled with a diarization label (Speaker A, Speaker B, ...). Decide the real name behind each label.

You have two aids:

1. AssemblyAI's audio-based identification (a strong prior — it distinguishes voices and can tell apart two people who share a first name):
${audioMapping}

2. A roster of recurring participants (a HINT, not a whitelist — you may identify people not on it when the evidence is clear):
${knownSpeakers.length ? knownSpeakers.join(', ') : '(none provided)'}

Rules — follow every item:

1. Treat the audio mapping as correct unless the transcript clearly contradicts it. It reflects who actually spoke, which the text alone cannot.
2. Evidence for a name:
   • A self-introduction ("I'm Dana", "this is Dana") identifies the CURRENT speaker.
   • Direct address ("thanks, Dana", "what do you think, Dana?") identifies a DIFFERENT speaker — the person being spoken to, not the one talking.
3. Reject names that are merely mentioned. A name discussed in conversation may belong to someone NOT on the call. If a candidate name appears only once or twice and has no self-introduction or direct-address support, return null for that speaker rather than guessing — this is the most common error to avoid.
4. When a spoken name matches a roster member phonetically, use the roster's canonical spelling (e.g. transcribed "Jared" → "Jarrod" if Jarrod is on the roster).
5. Return every diarization label present in the transcript. Use null when uncertain. A null is always better than a wrong name.`;

/**
 * Reconcile speaker identities by combining AssemblyAI's audio-based mapping, a
 * roster of known participants, and a GPT-5.5 pass over the transcript. Returns
 * a refined `label → name` map. Falls back to AssemblyAI's raw mapping on error.
 */
export async function refineSpeakerIdentification(
	transcript: Transcript,
	knownSpeakers: string[] = [],
): Promise<SpeakerMap> {
	const utterances = transcript.utterances;
	if (!utterances || utterances.length === 0) return new Map();

	const seed = createSpeakerMap(transcript);

	// utterance.speaker holds AssemblyAI's resolved value (a name when identified,
	// else the bare diarization label). Recover the stable label for each line.
	const valueToLabel = new Map<string, string>();
	const mapping = transcript.speech_understanding?.response?.speaker_identification?.mapping ?? {};
	for (const [label, value] of Object.entries(mapping)) valueToLabel.set(value, label);

	const transcriptText = utterances
		.map((u) => {
			const label = valueToLabel.get(u.speaker) ?? u.speaker;
			const text = u.text.replace(/\[Speaker:[^\]]*\]\s*/gi, '').trim();
			return `[Speaker ${label}]: ${text}`;
		})
		.join('\n');

	const audioMapping = seed.size
		? [...seed].map(([label, name]) => `   Speaker ${label} → ${name}`).join('\n')
		: '   (no speakers identified from audio)';

	console.log('🔍 Reconciling speaker identities with GPT-5.5...');
	try {
		const response = await openai.chat.completions.create({
			model: 'gpt-5.5',
			reasoning_effort: 'medium',
			messages: [
				{ role: 'system', content: makeReconciliationPrompt(knownSpeakers, audioMapping) },
				{ role: 'user', content: transcriptText },
			],
			response_format: { type: 'json_schema', json_schema: jsonSchema },
		});

		const content = response.choices[0].message.content;
		if (!content) return seed;

		const parsed = ReconciliationSchema.parse(JSON.parse(content));
		const speakerMap = new Map<string, string>();
		for (const s of parsed.speakers) {
			if (s.name) {
				speakerMap.set(s.label.replace(/^Speaker\s+/i, ''), s.name.trim());
			}
		}
		return speakerMap;
	} catch (error) {
		console.log(
			'⚠️  Speaker reconciliation failed, using AssemblyAI mapping:',
			error instanceof Error ? error.message : String(error),
		);
		return seed;
	}
}

export function logSpeakerIdentification(speakerMap: SpeakerMap): void {
	if (speakerMap.size === 0) {
		console.log('   No speakers identified');
		return;
	}

	console.log('   Identified speakers:');
	for (const [id, name] of speakerMap) {
		console.log(`     Speaker ${id} → ${name}`);
	}
}

export function formatSpeakerName(speakerId: string, speakerMap: SpeakerMap): string {
	const name = speakerMap.get(speakerId);
	return name ?? `Speaker ${speakerId}`;
}
