import OpenAI from 'openai';

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/**
 * Model assignments by the kind of work, not by call site. Mechanical rewriting
 * (cleaning, titling) runs on the cheapest tier with reasoning off — extra
 * reasoning buys nothing on a constrained edit and correlates with more
 * invention. Judgment calls (speaker reconciliation, summarization) run on the
 * flagship.
 */
export const MODELS = {
	mechanical: 'gpt-5.6-luna',
	judgment: 'gpt-5.6-sol',
} as const;
