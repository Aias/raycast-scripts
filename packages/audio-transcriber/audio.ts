import path from 'node:path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

// Initialize ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath as string);

/**
 * Downmix to the 16 kHz mono signal AssemblyAI resamples to internally, encoded
 * as FLAC. Lossless, so the model sees the same audio it would from an
 * equivalent WAV, at roughly half the bytes — and upload, not processing,
 * dominates turnaround.
 */
export async function convertToFlac(inputPath: string, outputDir: string): Promise<string> {
	console.log('🎵 Converting audio to 16kHz mono FLAC...');
	const baseName = path.basename(inputPath, path.extname(inputPath));
	const flacPath = path.join(outputDir, `${baseName}.16k.flac`);

	await new Promise<void>((resolve, reject) =>
		ffmpeg(inputPath)
			.audioFrequency(16_000)
			.audioChannels(1)
			// FLAC otherwise inherits the source's bit depth, which for a 24-bit
			// field recording is larger than the 16-bit WAV it replaces.
			.outputOptions(['-sample_fmt', 's16'])
			.format('flac')
			.on('error', reject)
			.on('end', () => resolve())
			.save(flacPath),
	);

	return flacPath;
}
