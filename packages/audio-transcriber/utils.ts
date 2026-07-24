import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '.env') });

export function validateEnvironment(): void {
	if (!process.env.ASSEMBLYAI_API_KEY) {
		console.error('⛔ Missing ASSEMBLYAI_API_KEY environment variable');
		process.exit(1);
	}
	if (!process.env.OPENAI_API_KEY) {
		console.error('⛔ Missing OPENAI_API_KEY environment variable');
		process.exit(1);
	}
}

export function formatTimestamp(ms: number): string {
	return new Date(ms).toISOString().slice(11, 19);
}

export function createOutputFolder(inputPath: string): string {
	const dir = path.dirname(inputPath);
	const baseName = path.basename(inputPath, path.extname(inputPath));
	const outputDir = path.join(dir, baseName);

	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	return outputDir;
}

/**
 * How many speakers to expect. An exact count is a hard constraint that hurts
 * diarization when it is wrong; a range is the safer hint when the count is
 * uncertain.
 */
export interface SpeakerHint {
	exact?: number;
	min?: number;
	max?: number;
}

export interface ParsedArguments {
	inputPath: string;
	speakers?: SpeakerHint;
}

export function parseAndValidateFile(
	filePath: string | undefined,
	errorMessage: string,
	extensions?: string[],
): string {
	if (!filePath) {
		console.error(errorMessage);
		process.exit(1);
	}

	const resolvedPath = path.resolve(filePath);
	if (!fs.existsSync(resolvedPath)) {
		console.error(`⛔ File not found: ${resolvedPath}`);
		process.exit(1);
	}

	if (extensions && extensions.length > 0) {
		const hasValidExtension = extensions.some((ext) => resolvedPath.endsWith(ext));
		if (!hasValidExtension) {
			console.error(
				`⛔ Expected file with extension ${extensions.join(' or ')}, got: ${resolvedPath}`,
			);
			process.exit(1);
		}
	}

	return resolvedPath;
}

/** Accepts an exact count ("3") or a range ("2-5"). */
export function parseSpeakersArg(arg: string | undefined): SpeakerHint | undefined {
	if (!arg) return undefined;

	const range = arg.match(/^(\d+)\s*-\s*(\d+)$/);
	if (range) {
		const min = Number(range[1]);
		const max = Number(range[2]);
		if (min < 1 || max < min) {
			console.error(`⛔ Invalid speaker range: ${arg}`);
			process.exit(1);
		}
		return { min, max };
	}

	const exact = Number(arg);
	if (!Number.isInteger(exact) || exact < 1) {
		console.error(`⛔ Invalid number of speakers: ${arg}`);
		process.exit(1);
	}

	return { exact };
}

export function parseCommandLineArgs(): ParsedArguments {
	// Validate environment first
	validateEnvironment();

	// Parse input path (required)
	const inputPath = parseAndValidateFile(process.argv[2], '⛔ Please provide an input file path');

	// Parse optional speakers count
	const speakers = parseSpeakersArg(process.argv[3]);

	return { inputPath, speakers };
}

export function parseTranscriptArgs(): { transcriptPath: string } {
	// Validate environment first
	validateEnvironment();

	// Parse transcript path (required, must be JSON)
	const transcriptPath = parseAndValidateFile(
		process.argv[2],
		'⛔ Please provide a transcript JSON file path',
		['.json'],
	);

	return { transcriptPath };
}
