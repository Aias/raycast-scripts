import path from 'node:path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

// Initialize ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath as string);

export async function convertToWav(inputPath: string, outputDir: string): Promise<string> {
	console.log('🎵 Converting audio to 16kHz mono WAV...');
	const baseName = path.basename(inputPath, path.extname(inputPath));
	const wavPath = path.join(outputDir, `${baseName}.16k.wav`);

	await new Promise<void>((resolve, reject) =>
		ffmpeg(inputPath)
			.audioFrequency(16_000)
			.audioChannels(1)
			.format('wav')
			.on('error', reject)
			.on('end', () => resolve())
			.save(wavPath),
	);

	return wavPath;
}
