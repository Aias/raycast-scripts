// Shared types for transcription configuration

import type { TranscribeParams } from 'assemblyai';

export interface CustomSpelling {
	from: string[];
	to: string;
}

// Extract only the options we want to make configurable
// Omit audio, custom_spelling, and keyterms_prompt as those are handled separately
export type ConfigurableTranscriptionOptions = Omit<
	TranscribeParams,
	'audio' | 'custom_spelling' | 'keyterms_prompt'
>;

export interface TranscriptionConfig {
	customSpellings: CustomSpelling[];
	keyTerms: string[];
	// Recurring participants used as hints (not a hard filter) when reconciling
	// speaker identities. Helps normalize spellings and reject names that were
	// only mentioned in passing. Open-set: speakers off this list can still be
	// identified from context.
	knownSpeakers?: string[];
	transcriptionOptions: Partial<ConfigurableTranscriptionOptions>;
}
