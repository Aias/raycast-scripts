import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { MODELS, openai } from './openai.js';

const SUMMARY_SYSTEM_PROMPT = `You are an executive-level summarizer.

Summarize the transcript the user provides.
Format strictly:
Paragraph 1 (≤60 words): overall purpose and key themes.
Paragraph 2 (≤60 words): main conclusions or insights.
If actions/decisions are present, add a blank line and list them as bullet points.
Quote exact product and feature names as they appear.
Do not introduce new information or interpretations.`;

/**
 * Summarize in a single pass. Even a day-long recording fits the context window,
 * and map-reduce over segments loses the cross-segment threads a summary is for.
 */
export async function summarize(transcript: string): Promise<string> {
	console.log('🤖 Summarizing with AI...');

	const messages: ChatCompletionMessageParam[] = [
		{ role: 'system', content: SUMMARY_SYSTEM_PROMPT },
		{ role: 'user', content: transcript },
	];

	const response = await openai.chat.completions.create({
		model: MODELS.judgment,
		reasoning_effort: 'medium',
		messages,
	});

	return response.choices[0].message.content?.trim() ?? '';
}
