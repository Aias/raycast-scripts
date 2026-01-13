import OpenAI from 'openai';
import { z } from 'zod';
import type { Transcript } from 'assemblyai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Schema for speaker identification results
export const SpeakerIdentificationSchema = z.object({
	speakers: z.array(
		z.object({
			id: z.string(),
			name: z.string().nullable(),
			confidence: z.enum(['high', 'medium', 'low']),
			evidence: z.string(),
		}),
	),
});

export type SpeakerIdentification = z.infer<typeof SpeakerIdentificationSchema>;
export type SpeakerMap = Map<string, string>;

// JSON Schema for OpenAI structured outputs
const jsonSchema = {
	name: 'speaker_identification',
	strict: true,
	schema: {
		type: 'object',
		properties: {
			speakers: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						id: {
							type: 'string',
							description: 'The speaker identifier (e.g., "A", "B", "C")',
						},
						name: {
							type: ['string', 'null'],
							description: 'The inferred name, or null if cannot be determined',
						},
						confidence: {
							type: 'string',
							enum: ['high', 'medium', 'low'],
							description: 'Confidence level in the identification',
						},
						evidence: {
							type: 'string',
							description: 'Quote or context that supports this identification',
						},
					},
					required: ['id', 'name', 'confidence', 'evidence'],
					additionalProperties: false,
				},
			},
		},
		required: ['speakers'],
		additionalProperties: false,
	},
};

const IDENTIFICATION_PROMPT = `Analyze this meeting transcript and identify the real names of each speaker.

Instructions:
1. Look for explicit self-introductions ("Hi, I'm [Name]", "This is [Name]")
2. Look for others directly addressing a speaker by name while they're speaking ("Thanks [Name]", "What do you think, [Name]?")
3. Be VERY conservative - only mark "high" confidence when you have clear, unambiguous evidence
4. Names mentioned in discussion may refer to people NOT on the call - do not assume they are speakers
5. If someone says "Thanks [Name]" at the end, verify [Name] was actually the previous speaker
6. It's better to return null than to guess wrong

Return identifications for ALL speakers in the transcript, even if their name is unknown (use null for name).`;

export async function identifySpeakers(transcript: Transcript): Promise<SpeakerIdentification> {
	const utterances = transcript.utterances;
	if (!utterances || utterances.length === 0) {
		return { speakers: [] };
	}

	// Format transcript for the AI
	const transcriptText = utterances.map((u) => `[Speaker ${u.speaker}]: ${u.text}`).join('\n\n');

	console.log('🔍 Identifying speakers...');

	const response = await openai.chat.completions.create({
		model: 'gpt-5.2',
		temperature: 0.1,
		messages: [
			{ role: 'system', content: IDENTIFICATION_PROMPT },
			{ role: 'user', content: transcriptText },
		],
		response_format: { type: 'json_schema', json_schema: jsonSchema },
	});

	const content = response.choices[0].message.content;
	if (!content) {
		console.log('   No speaker identification results');
		return { speakers: [] };
	}

	const parsed = JSON.parse(content);
	return SpeakerIdentificationSchema.parse(parsed);
}

export function createSpeakerMap(
	identification: SpeakerIdentification,
	minConfidence: 'high' | 'medium' | 'low' = 'high',
): SpeakerMap {
	const confidenceLevels = { high: 3, medium: 2, low: 1 };
	const minLevel = confidenceLevels[minConfidence];

	const speakerMap = new Map<string, string>();

	for (const speaker of identification.speakers) {
		if (speaker.name && confidenceLevels[speaker.confidence] >= minLevel) {
			// Normalize speaker ID - strip "Speaker " prefix if present
			const normalizedId = speaker.id.replace(/^Speaker\s+/i, '');
			speakerMap.set(normalizedId, speaker.name);
		}
	}

	return speakerMap;
}

export function logSpeakerIdentification(identification: SpeakerIdentification): void {
	const identified = identification.speakers.filter((s) => s.name !== null);
	const unknown = identification.speakers.filter((s) => s.name === null);

	if (identified.length > 0) {
		console.log('   Identified speakers:');
		for (const s of identified) {
			console.log(`     Speaker ${s.id} → ${s.name} (${s.confidence})`);
		}
	}

	if (unknown.length > 0) {
		console.log(`   Unknown speakers: ${unknown.map((s) => s.id).join(', ')}`);
	}
}

export function formatSpeakerName(speakerId: string, speakerMap: SpeakerMap): string {
	const name = speakerMap.get(speakerId);
	return name ?? `Speaker ${speakerId}`;
}
