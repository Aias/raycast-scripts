// Default configuration for audio transcription
// This file provides the base configuration that is always loaded.
// Users can extend this by creating a transcription.config.local.ts file.

import type { TranscriptionConfig } from './transcription.config.types.js';

/**
 * Default configuration with sensible defaults for AssemblyAI transcription.
 *
 * Users should create a transcription.config.local.ts file with their custom settings.
 * That file will be merged with these defaults.
 *
 * Example local config:
 *
 * const config: TranscriptionConfig = {
 *   customSpellings: [
 *     // Name corrections
 *     { from: ["John", "Jon"], to: "Jon" },
 *
 *     // Company/product names
 *     { from: ["github", "git hub"], to: "GitHub" },
 *
 *     // Technical terms
 *     { from: ["api", "API", "a p i"], to: "API" },
 *   ],
 *
 *   keyTerms: [
 *     // Technical terms
 *     "API", "SDK", "GraphQL",
 *
 *     // Product names
 *     "GitHub", "OpenAI",
 *
 *     // Domain specific
 *     "microservices", "deployment",
 *   ],
 *
 *   transcriptionOptions: {
 *     // Use a different speech model
 *     speech_models: ["universal-3-pro"],
 *
 *     // Disable features you don't need
 *     entity_detection: false,
 *     auto_highlights: false,
 *   },
 * };
 */
export const defaultConfig: TranscriptionConfig = {
	customSpellings: [],
	keyTerms: [],

	// Default transcription options
	transcriptionOptions: {
		// Model and language
		speech_models: ['universal-3-pro'], // Options: "universal-3-pro" (best quality), "conformer-2", "universal-2" (fastest)
		language_code: 'en_us',
		temperature: 0, // 0 = most deterministic, 1 = most creative

		// Key terms matching (only applies when keyTerms are provided)
		keyterms_prompt_options: { keyterms_match_strength: 'high' },

		// Feature toggles - these are the recommended defaults
		speaker_labels: true, // Identify different speakers
		punctuate: true, // Must be true if speaker_labels is true
		format_text: true, // Format text with proper capitalization and punctuation
		disfluencies: false, // Remove "um", "uh" etc.
		entity_detection: false, // Detect entities like names, locations, etc.
		auto_chapters: false, // Automatically create chapters
		auto_highlights: false, // Automatically highlight important sections

		// Summarization (disabled by default as it conflicts with auto_chapters)
		summarization: false,
		// summary_model: "informative",
		// summary_type: "paragraph",
	},
};
