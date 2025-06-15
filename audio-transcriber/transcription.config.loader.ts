// Configuration loader that merges defaults with optional local config

import type { TranscriptionConfig } from './transcription.config.types.js';
import { defaultConfig } from './transcription.config.defaults.js';

async function loadLocalConfig(): Promise<TranscriptionConfig | null> {
	try {
		// Dynamically import the optional local config file
		const localPath = './transcription.config.local.js';
		const mod = (await import(localPath).catch(() => null)) as unknown;
		if (!mod) return null;
		const cfg = (mod as { default?: TranscriptionConfig }).default ?? mod;
		return cfg as TranscriptionConfig;
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
