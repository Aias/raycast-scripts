import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { processWithPool } from './concurrency.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const TOKENS_PER_CHAR = 0.25; // coarse rule of thumb
const MAX_INPUT_TOKENS = 100_000; // leave headroom in context window
const CHARS_PER_CHUNK = Math.floor(MAX_INPUT_TOKENS / TOKENS_PER_CHAR);

export function chunkBySpeaker(text: string, maxCharsPerChunk: number = CHARS_PER_CHUNK): string[] {
	// Split into individual speaker utterances
	const lines = text.split('\n').filter((line) => line.trim());
	const chunks: string[] = [];
	let currentChunk: string[] = [];
	let currentChunkSize = 0;

	for (const line of lines) {
		const lineLength = line.length + 2; // +2 for double newline

		// If adding this line would exceed the limit
		if (currentChunkSize + lineLength > maxCharsPerChunk && currentChunk.length > 0) {
			// Save the current chunk and start a new one
			chunks.push(currentChunk.join('\n\n'));
			currentChunk = [line];
			currentChunkSize = lineLength;
		} else {
			// Add line to current chunk
			currentChunk.push(line);
			currentChunkSize += lineLength;
		}
	}

	// Don't forget the last chunk
	if (currentChunk.length > 0) {
		chunks.push(currentChunk.join('\n\n'));
	}

	return chunks.length > 0 ? chunks : [text]; // Fallback to full text if no chunks
}

const CHUNK_SYSTEM_PROMPT = `You are a meeting summarizer.

Task: Write a SHORT structured summary of the transcript segment the user provides.
Constraints:
• Length: ≤60 words total.
• Format:
  1) One sentence ("Summary: …").
  2) If the segment contains decisions OR action items, add a bulleted list headed "• Actions/Decisions:".
• Quote exact product / feature names when mentioned.
• Do NOT mention earlier or later segments or speculate about context.
• Do NOT add phrases like "technical call"—infer nothing about meeting type.`;

const REDUCE_SYSTEM_PROMPT = `You are an executive-level summarizer.

Combine the segment summaries into ONE crisp output.
Format strictly:
Paragraph 1 (≤60 words): overall purpose and key themes.
Paragraph 2 (≤60 words): main conclusions or insights.
If actions/decisions are present, add a blank line and list them as bullet points.
Do not introduce new information or interpretations.`;

async function summariseChunk(part: string, idx: number, total: number): Promise<string> {
	const messages: ChatCompletionMessageParam[] = [
		{
			role: 'system',
			content: CHUNK_SYSTEM_PROMPT,
		},
		{ role: 'user', content: `Segment ${idx}/${total}\n\n${part}` },
	];

	const resp = await openai.chat.completions.create({
		model: 'gpt-5.1',
		temperature: 0.1,
		messages,
	});
	return resp.choices[0].message.content?.trim() ?? '';
}

// Estimate token count (rough approximation)
function estimateTokens(text: string): number {
	return Math.ceil(text.length / 4);
}

export async function summarizeChunks(chunks: string[]): Promise<string> {
	console.log('🤖 Summarizing with AI...');

	// Check if we can skip chunking entirely
	const fullText = chunks.join('\n\n');
	const estimatedTokens = estimateTokens(fullText);

	// If under ~100k tokens, send the whole thing at once
	if (estimatedTokens < 100000 && chunks.length === 1) {
		console.log('📝 Summarizing entire transcript in one pass...');
		const messages: ChatCompletionMessageParam[] = [
			{
				role: 'system',
				content: REDUCE_SYSTEM_PROMPT,
			},
			{ role: 'user', content: fullText },
		];

		const resp = await openai.chat.completions.create({
			model: 'gpt-5.2',
			temperature: 0,
			messages,
		});

		return resp.choices[0].message.content?.trim() ?? '';
	}

	// Otherwise, proceed with chunking in parallel
	console.log(`📝 Summarizing ${chunks.length} chunks (parallel, concurrency=10)...`);

	const partSummaries = await processWithPool(
		chunks,
		async (chunk, index) => summariseChunk(chunk, index + 1, chunks.length),
		{
			concurrency: 10,
			fallback: () => '', // Skip failed chunks in final summary
			onProgress: (completed, total) => {
				console.log(`    Summarized ${completed}/${total} chunks`);
			},
		},
	);

	/* Final "reduce" pass */
	const validSummaries = partSummaries.filter((s) => s.length > 0);
	const finalMessages: ChatCompletionMessageParam[] = [
		{
			role: 'system',
			content: REDUCE_SYSTEM_PROMPT,
		},
		{ role: 'user', content: validSummaries.join('\n') },
	];

	const finalSummaryResp = await openai.chat.completions.create({
		model: 'gpt-5.2',
		temperature: 0,
		messages: finalMessages,
	});

	return finalSummaryResp.choices[0].message.content?.trim() ?? '';
}
