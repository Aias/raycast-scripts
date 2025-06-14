import OpenAI from 'openai';
import type { Transcript } from 'assemblyai';
import { formatTimestamp } from './utils.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const makeCleaningPrompt = (
	text: string,
) => `You are a professional transcription editor. Make only the minimum changes needed for clarity and correctness.

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

function splitIntoSentences(text: string): string[] {
	// Split by sentence endings, but keep the punctuation with the sentence
	const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
	return sentences.map((s) => s.trim());
}

function chunkBySentenceCount(sentences: string[], maxSentences: number = 10): string[] {
	const chunks: string[] = [];

	for (let i = 0; i < sentences.length; i += maxSentences) {
		const chunk = sentences.slice(i, i + maxSentences).join(' ');
		chunks.push(chunk);
	}

	return chunks;
}

async function cleanText(text: string): Promise<string> {
	console.log(`    Cleaning text of length: ${text.length}`);

	// Split into sentences and chunk if needed
	const sentences = splitIntoSentences(text);
	console.log(`    Found ${sentences.length} sentences`);

	// If the text has more than 10 sentences, process in chunks
	if (sentences.length > 10) {
		console.log(`    Text has ${sentences.length} sentences, will process in chunks`);
		const chunks = chunkBySentenceCount(sentences, 10);
		const cleanedChunks: string[] = [];

		for (const chunk of chunks) {
			try {
				console.log(`      Calling OpenAI API for chunk...`);
				const response = await openai.chat.completions.create({
					model: 'gpt-4.1-mini',
					temperature: 0.1,
					messages: [
						{
							role: 'user',
							content: makeCleaningPrompt(chunk),
						},
					],
				});

				const cleaned = response.choices[0].message.content?.trim() ?? chunk;
				console.log(`      API returned ${cleaned.length} characters`);
				// Remove any backticks that might be in the response
				const cleanedChunk = cleaned
					.replace(/^```\n?/, '')
					.replace(/\n?```$/, '')
					.trim();

				cleanedChunks.push(cleanedChunk);
			} catch (error) {
				console.error('Error cleaning chunk:', error);
				cleanedChunks.push(chunk); // Return original chunk if cleaning fails
			}
		}

		// Join chunks with a space
		return cleanedChunks.join(' ');
	}

	// For shorter texts, process as before
	try {
		const response = await openai.chat.completions.create({
			model: 'gpt-4.1-mini',
			temperature: 0.1,
			messages: [
				{
					role: 'user',
					content: makeCleaningPrompt(text),
				},
			],
		});

		const cleaned = response.choices[0].message.content?.trim() ?? text;
		// Remove any backticks that might be in the response
		return cleaned
			.replace(/^```\n?/, '')
			.replace(/\n?```$/, '')
			.trim();
	} catch (error) {
		console.error('Error cleaning text:', error);
		return text; // Return original text if cleaning fails
	}
}

export async function cleanTranscript(transcript: Transcript): Promise<string> {
	console.log('🧹 Cleaning transcript with AI...');

	// Check if we have utterances to work with
	if (!transcript.utterances || transcript.utterances.length === 0) {
		console.log('  No utterances found in transcript');
		return transcript.text || 'No transcript available';
	}

	console.log(`  Found ${transcript.utterances.length} utterances to clean`);

	// Process in batches for parallel execution
	const BATCH_SIZE = 20;
	const cleanedLines: string[] = [];
	let totalSentenceChunks = 0;

	for (let i = 0; i < transcript.utterances.length; i += BATCH_SIZE) {
		const batch = transcript.utterances.slice(i, i + BATCH_SIZE);
		console.log(
			`  Cleaning batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(transcript.utterances.length / BATCH_SIZE)}...`,
		);

		// Process batch in parallel
		const cleanedBatch = await Promise.all(
			batch.map(async (utterance) => {
				console.log(`    Processing utterance from Speaker ${utterance.speaker}`);

				// Check if this utterance needs sentence-based chunking
				const sentenceCount = splitIntoSentences(utterance.text).length;
				if (sentenceCount > 10) {
					totalSentenceChunks++;
					console.log(`    → Splitting utterance with ${sentenceCount} sentences into chunks`);
				}

				// Clean the text content
				const cleanedText = await cleanText(utterance.text);

				// Format the cleaned utterance
				return `[${formatTimestamp(utterance.start)}] **Speaker ${utterance.speaker}**: ${cleanedText}`;
			}),
		);

		cleanedLines.push(...cleanedBatch);
	}

	if (totalSentenceChunks > 0) {
		console.log(`  ✂️  Split ${totalSentenceChunks} long utterances into sentence chunks`);
	}

	return cleanedLines.join('\n\n');
}
