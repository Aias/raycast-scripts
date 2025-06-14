// Default configuration for audio transcription
// This file provides the base configuration that is always loaded.
// Users can extend this by creating a transcription.config.local.ts file.

import type { TranscriptionConfig } from "./transcription.config.types.js";

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
 *     speech_model: "best",
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
    speech_model: "slam-1", // Options: "slam-1" (best quality), "conformer-2", "nano" (fastest)
    language_code: "en_us",

    // Feature toggles - these are the recommended defaults
    speaker_labels: true, // Identify different speakers
    format_text: true, // Format text with proper capitalization and punctuation
    punctuate: true, // Must be true if speaker_labels is true
    disfluencies: false, // Remove "um", "uh" etc. (Note: slam-1 doesn't support this)
    entity_detection: true, // Detect entities like names, locations, etc.
    auto_chapters: true, // Automatically create chapters
    auto_highlights: true, // Automatically highlight important sections

    // Summarization (disabled by default as it conflicts with auto_chapters)
    summarization: false,
    // summary_model: "informative",
    // summary_type: "paragraph",
  },
};
