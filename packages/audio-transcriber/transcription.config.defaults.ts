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
 *   // People you record with. A description gives both identification passes a
 *   // role to match against, which is the only way to name a speaker who is
 *   // never addressed by name in the audio. Make it discriminating.
 *   knownSpeakers: [
 *     "Dana",
 *     { name: "Jarrod", description: "backend, owns the ingest pipeline" },
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
 *     speech_models: ["universal-2"],
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
	knownSpeakers: [],

	// Default transcription options
	transcriptionOptions: {
		// Model and language
		// The API accepts any string here without validating it, so a retired model
		// name degrades transcription silently. `transcribe` asserts on the
		// `speech_model_used` the API reports back.
		speech_models: ['universal-3-5-pro'], // Options: "universal-3-5-pro" (best quality), "universal-2" (cheapest, 99 languages)
		language_code: 'en_us',
		temperature: 0, // 0 = most deterministic, 1 = most creative

		// Key terms matching (only applies when keyTerms are provided)
		keyterms_prompt_options: { keyterms_match_strength: 'high' },

		// Feature toggles - these are the recommended defaults
		speaker_labels: true, // Identify different speakers
		// Resolve diarized speakers (A, B, C) to real names inferred from the
		// conversation itself (self-introductions, direct address). Requires
		// speaker_labels. `transcribe` supplies the roster from knownSpeakers.
		// Medium effort is the level documented for conference-room audio,
		// crosstalk, and recordings past ten minutes; it costs more per hour.
		speech_understanding: {
			request: {
				speaker_identification: { speaker_type: 'name', effort: 'medium' },
			},
		},
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
