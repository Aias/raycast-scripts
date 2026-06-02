import {
	AssemblyAI,
	type ParagraphsResponse,
	type SentencesResponse,
	type Transcript,
	type TranscribeParams,
} from 'assemblyai';
import { formatTimestamp } from './utils.js';
import {
	getCustomSpellings,
	getKeyTerms,
	getTranscriptionOptions,
} from './transcription.config.loader.js';

const assemblyai = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY! });

function formatElapsed(ms: number): string {
	const seconds = Math.floor(ms / 1000);
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes}m ${remainingSeconds}s`;
}

export interface TranscriptionResult {
	transcript: Transcript;
	sentences: SentencesResponse;
	paragraphs: ParagraphsResponse;
}

export async function transcribe(
	audioPath: string,
	speakersExpected?: number,
): Promise<TranscriptionResult> {
	console.log('🎙️ Transcribing with AssemblyAI...');
	if (speakersExpected) {
		console.log(`   Expected speakers: ${speakersExpected}`);
	}

	// Load config values
	const [customSpellings, keyTerms, transcriptionOptions] = await Promise.all([
		getCustomSpellings(),
		getKeyTerms(),
		getTranscriptionOptions(),
	]);

	// Start a progress timer that logs every 5 seconds
	const startTime = Date.now();
	const progressInterval = setInterval(() => {
		console.log(`   Transcription in progress... (${formatElapsed(Date.now() - startTime)})`);
	}, 5000);

	const params: TranscribeParams = {
		...transcriptionOptions,
		audio: audioPath,
		speakers_expected: speakersExpected,
	};
	// Only send enrichment fields when populated. Empty arrays add nothing, and
	// AssemblyAI rejects keyterms_prompt_options without a keyterms_prompt.
	if (customSpellings.length > 0) {
		params.custom_spelling = customSpellings;
	}
	if (keyTerms.length > 0) {
		params.keyterms_prompt = keyTerms;
	} else {
		delete params.keyterms_prompt_options;
	}

	let transcript: Transcript;
	try {
		transcript = await assemblyai.transcripts.transcribe(params);
	} finally {
		clearInterval(progressInterval);
	}

	const elapsed = formatElapsed(Date.now() - startTime);
	console.log(`   ✅ Transcription complete (${elapsed})`);

	// Check for errors
	if (transcript.error) {
		console.error(`❌ Transcription error: ${transcript.error}`);
		throw new Error(transcript.error);
	}

	// Fetch sentences and paragraphs
	console.log('📝 Fetching sentences and paragraphs...');
	const [sentences, paragraphs] = await Promise.all([
		getSentences(transcript.id),
		getParagraphs(transcript.id),
	]);

	return { transcript, sentences, paragraphs };
}

export async function getSentences(transcriptId: string) {
	const sentences = await assemblyai.transcripts.sentences(transcriptId);
	return sentences;
}

export async function getParagraphs(transcriptId: string) {
	const paragraphs = await assemblyai.transcripts.paragraphs(transcriptId);
	return paragraphs;
}

export function formatTranscript(transcript: Transcript): string {
	console.log('📝 Building transcript...');

	// Build transcript from utterances if available, otherwise use full text
	if (transcript.utterances && transcript.utterances.length > 0) {
		const lines = transcript.utterances.map(
			(u) => `[${formatTimestamp(u.start)}] **Speaker ${u.speaker}**: ${u.text}`,
		);
		return lines.join('\n\n');
	} else {
		// Fallback to full text if no utterances
		return transcript.text || 'No transcript available';
	}
}
