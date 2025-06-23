import OpenAI from 'openai';
import { formatTimestamp } from './utils.js';
import { type TranscriptionResult } from './transcription.js';
import { getCustomSpellings, getKeyTerms } from './transcription.config.loader.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const makeCleaningPrompt = (
	text: string,
	context: string,
	vocabulary: string[],
) => `You are a professional transcription editor. Make only the minimum changes needed for clarity and correctness.

The conversation context may help resolve uncertain words:
${context}

Important words and names to preserve exactly: ${vocabulary.join(', ')}

Rules — follow every item:

1. Delete non-lexical fillers: "um," "uh," "er," "you know," "so" (when meaningless), "kinda," "sort of," "stuff," "maybe," and "like" when it is filler.  
   • A “filler like” is one that precedes a noun/verb phrase and can be removed without altering meaning.  
   • Keep “like” when it introduces a comparison (“like a sports car”) or means “such as.”

2. Remove immediate word repetitions that add no meaning ("I—I think," "the the").

3. Fix grammar, capitalization, and punctuation.  
   • Expand casual contractions (“cause” → “because,” “gonna” → “going to”).  
   • Repair fragments/run-ons. Split or join sentences as needed.  
   • When “like” introduces reported speech, replace it with “said” and put the quote in double quotes.

4. Correct obvious mis-recognitions. Replace nonsense words with the most plausible term, or append “[sic]” if unsure.

5. Keep existing line breaks; if a single speaker’s block exceeds three sentences, insert an extra blank line at a natural pause.

6. Do **not** add, delete, or reorder substantive content beyond these rules.

7. Output only the cleaned transcript—no commentary, no explanation.

Transcript to clean:
\`\`\`
${text}
\`\`\``;

interface SentenceGroup {
	speaker: string;
	start: number;
	text: string;
}

function groupSentences(
	sentences: { speaker: string | null; start: number; text: string }[],
	maxSentences = 10,
): SentenceGroup[] {
	const groups: SentenceGroup[] = [];
	if (sentences.length === 0) return groups;

	let currentSpeaker = sentences[0].speaker ?? 'A';
	let start = sentences[0].start;
	let chunk: string[] = [];

	for (const sentence of sentences) {
		const speaker = sentence.speaker ?? currentSpeaker;

		if (speaker !== currentSpeaker || chunk.length >= maxSentences) {
			if (chunk.length > 0) {
				groups.push({ speaker: currentSpeaker, start, text: chunk.join(' ') });
			}
			currentSpeaker = speaker;
			start = sentence.start;
			chunk = [];
		}

		chunk.push(sentence.text.trim());

		if (chunk.length >= maxSentences) {
			groups.push({ speaker: currentSpeaker, start, text: chunk.join(' ') });
			start = sentence.start;
			chunk = [];
		}
	}

	if (chunk.length > 0) {
		groups.push({ speaker: currentSpeaker, start, text: chunk.join(' ') });
	}

	return groups;
}

async function cleanText(text: string, context: string, vocabulary: string[]): Promise<string> {
	console.log(`    Cleaning text of length: ${text.length}`);
	try {
		const response = await openai.chat.completions.create({
			model: 'gpt-4.1-mini',
			temperature: 0.1,
			messages: [
				{
					role: 'user',
					content: makeCleaningPrompt(text, context, vocabulary),
				},
			],
		});

		const cleaned = response.choices[0].message.content?.trim() ?? text;
		return cleaned
			.replace(/^```\n?/, '')
			.replace(/\n?```$/, '')
			.trim();
	} catch (error) {
		console.error('Error cleaning text:', error);
		return text; // Return original text if cleaning fails
	}
}

export async function cleanTranscript(transcriptionResult: TranscriptionResult): Promise<string> {
	console.log('🧹 Cleaning transcript with AI...');
	const transcript = transcriptionResult.transcript;
	const sentences = transcriptionResult.sentences?.sentences;

	if (!sentences || sentences.length === 0) {
		console.log('  No sentence data found');
		return transcript.text || 'No transcript available';
	}

	console.log(`  Found ${sentences.length} sentences to clean`);

	const [customSpellings, keyTerms] = await Promise.all([getCustomSpellings(), getKeyTerms()]);

	const vocabularySet = new Set<string>();
	for (const s of customSpellings) {
		vocabularySet.add(s.to);
		s.from.forEach((w) => vocabularySet.add(w));
	}
	keyTerms.forEach((t) => vocabularySet.add(t));
	const vocabulary = Array.from(vocabularySet);

	const groups = groupSentences(sentences, 10);
	console.log(`  Created ${groups.length} groups for cleaning`);

	const cleanedLines: string[] = [];

	for (let i = 0; i < groups.length; i++) {
		const group = groups[i];
		const contextGroups = groups
			.slice(Math.max(0, i - 2), i)
			.map((g) => `Speaker ${g.speaker}: ${g.text}`)
			.join('\n');

		const cleanedText = await cleanText(group.text, contextGroups, vocabulary);
		cleanedLines.push(
			`[${formatTimestamp(group.start)}] **Speaker ${group.speaker}**: ${cleanedText}`,
		);
	}

	return cleanedLines.join('\n\n');
}
