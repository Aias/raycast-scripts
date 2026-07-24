import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import type { Transcript } from 'assemblyai';
import type { SpeakerProfile } from './transcription.config.types.js';
import { MODELS, openai } from './openai.js';

export type SpeakerMap = Map<string, string>;

/**
 * Drop the suffix AssemblyAI appends when one person lands in more than one
 * diarization cluster ("Nick Trombley - 1", "Nick Trombley - 2"). Both labels
 * describe the same speaker and should render under the same name.
 */
function normalizeSpeakerName(name: string): string {
	return name
		.replace(/^Speaker\s+/i, '')
		.replace(/\s+-\s+\d+$/, '')
		.trim();
}

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
		const cleanedName = normalizeSpeakerName(name ?? '');
		if (cleanedName && cleanedName !== normalizedId) {
			speakerMap.set(normalizedId, cleanedName);
		}
	}

	return speakerMap;
}

const ReconciliationSchema = z.object({
	speakers: z.array(
		z.object({
			label: z.string().describe('The diarization label, e.g. "A"'),
			name: z
				.string()
				.nullable()
				.describe('The identified real name, or null if it cannot be determined'),
			reasoning: z.string().describe('Brief evidence for the decision'),
		}),
	),
});

const formatRoster = (knownSpeakers: SpeakerProfile[]) =>
	knownSpeakers.length
		? knownSpeakers
				.map((s) => (s.description ? `   • ${s.name} — ${s.description}` : `   • ${s.name}`))
				.join('\n')
		: '   (none provided)';

const makeReconciliationPrompt = (knownSpeakers: SpeakerProfile[], audioMapping: string) =>
	`You are reconciling speaker identities in a diarized meeting transcript. Each line is labeled with a diarization label (Speaker A, Speaker B, ...). Decide the real name behind each label.

You have two aids:

1. AssemblyAI's audio-based identification (a strong prior — it distinguishes voices and can tell apart two people who share a first name):
${audioMapping}

2. A roster of recurring participants (a HINT, not a whitelist — you may identify people not on it when the evidence is clear). Some carry a description of their role or usual subject matter:
${formatRoster(knownSpeakers)}

Rules — follow every item:

1. Treat the audio mapping as correct unless the transcript clearly contradicts it. It reflects who actually spoke, which the text alone cannot.
2. Evidence for a name, strongest first:
   • A self-introduction ("I'm Dana", "this is Dana") identifies the CURRENT speaker.
   • Direct address ("thanks, Dana", "what do you think, Dana?") identifies a DIFFERENT speaker — the person being spoken to, not the one talking.
   • Role or subject matter consistent with a roster description, sustained across many turns. This is the weakest signal: use it only when one roster member fits and the others plainly do not, and never to override the two above.
3. Reject names that are merely mentioned. A name discussed in conversation may belong to someone NOT on the call, or to a product, brand, or fictional person. If a candidate name appears only once or twice and has no self-introduction or direct-address support, return null for that speaker rather than guessing — this is the most common error to avoid.
4. Diarization sometimes merges two people into one labeled turn. When a turn addresses someone by name and a reply to that address follows inside the SAME turn, the reply belongs to the addressed person, not to the label. Use the reply's content to work out which other label that person holds, and say so in your reasoning.
5. One person can land in more than one diarization cluster, in which case the audio mapping distinguishes them with a numeric suffix ("Dana - 1", "Dana - 2"). Both labels are that person: return the plain name, with no suffix, for each of them.
6. When a spoken name matches a roster member phonetically, use the roster's canonical spelling (e.g. transcribed "Jared" → "Jarrod" if Jarrod is on the roster).
7. Return every diarization label present in the transcript. Use null when uncertain. A null is always better than a wrong name.`;

/**
 * Reconcile speaker identities by combining AssemblyAI's audio-based mapping, a
 * roster of known participants, and an LLM pass over the transcript. Returns a
 * refined `label → name` map. Falls back to AssemblyAI's raw mapping on error.
 */
export async function refineSpeakerIdentification(
	transcript: Transcript,
	knownSpeakers: SpeakerProfile[] = [],
): Promise<SpeakerMap> {
	const utterances = transcript.utterances;
	if (!utterances || utterances.length === 0) return new Map();

	const seed = createSpeakerMap(transcript);

	// utterance.speaker holds AssemblyAI's resolved value (a name when identified,
	// else the bare diarization label). Recover the stable label for each line.
	const valueToLabel = new Map<string, string>();
	const mapping = transcript.speech_understanding?.response?.speaker_identification?.mapping ?? {};
	for (const [label, value] of Object.entries(mapping)) {
		// Two labels resolving to the same name would otherwise collapse onto one
		// another; keeping the first is at least stable.
		if (!valueToLabel.has(value)) valueToLabel.set(value, label);
	}

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

	console.log('🔍 Reconciling speaker identities...');
	try {
		const response = await openai.chat.completions.parse({
			model: MODELS.judgment,
			reasoning_effort: 'medium',
			messages: [
				{ role: 'system', content: makeReconciliationPrompt(knownSpeakers, audioMapping) },
				{ role: 'user', content: transcriptText },
			],
			response_format: zodResponseFormat(ReconciliationSchema, 'speaker_reconciliation'),
		});

		const parsed = response.choices[0].message.parsed;
		if (!parsed) return seed;

		const speakerMap = new Map<string, string>();
		for (const s of parsed.speakers) {
			if (s.name) {
				speakerMap.set(s.label.replace(/^Speaker\s+/i, ''), normalizeSpeakerName(s.name));
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
