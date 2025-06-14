// Configuration loader that merges defaults with optional local config

import type { TranscriptionConfig } from "./transcription.config.types.js";
import { defaultConfig } from "./transcription.config.defaults.js";

async function loadLocalConfig(): Promise<TranscriptionConfig | null> {
  try {
    // Try to dynamically import the local config file
    const localConfig = await import("./transcription.config.local.js");
    return localConfig.default || localConfig;
  } catch {
    // If the file doesn't exist or has errors, that's OK
    // We'll just use defaults
    return null;
  }
}

export async function loadConfig(): Promise<TranscriptionConfig> {
  const localConfig = await loadLocalConfig();

  if (!localConfig) {
    // No local config, use defaults only
    return defaultConfig;
  }

  // Merge local config with defaults
  // Local config takes precedence
  return {
    customSpellings: [...defaultConfig.customSpellings, ...localConfig.customSpellings],
    keyTerms: [...defaultConfig.keyTerms, ...localConfig.keyTerms],
    transcriptionOptions: {
      ...defaultConfig.transcriptionOptions,
      ...localConfig.transcriptionOptions,
    },
  };
}

// Export individual getters for backward compatibility
export async function getCustomSpellings() {
  const config = await loadConfig();
  return config.customSpellings;
}

export async function getKeyTerms() {
  const config = await loadConfig();
  return config.keyTerms;
}

export async function getTranscriptionOptions() {
  const config = await loadConfig();
  return config.transcriptionOptions;
}
