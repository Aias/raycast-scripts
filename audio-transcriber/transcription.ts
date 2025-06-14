import {
  AssemblyAI,
  type ParagraphsResponse,
  type SentencesResponse,
  type Transcript,
} from "assemblyai";
import { formatTimestamp } from "./utils.js";
import {
  getCustomSpellings,
  getKeyTerms,
  getTranscriptionOptions,
} from "./transcription.config.loader.js";

const assemblyai = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY! });

export interface TranscriptionResult {
  transcript: Transcript;
  sentences: SentencesResponse;
  paragraphs: ParagraphsResponse;
}

export async function transcribe(
  audioPath: string,
  speakersExpected?: number,
): Promise<TranscriptionResult> {
  console.log("🎙️ Transcribing with AssemblyAI...");
  if (speakersExpected) {
    console.log(`   Expected speakers: ${speakersExpected}`);
  }

  // Load config values
  const [customSpellings, keyTerms, transcriptionOptions] = await Promise.all([
    getCustomSpellings(),
    getKeyTerms(),
    getTranscriptionOptions(),
  ]);

  const transcript = await assemblyai.transcripts.transcribe({
    // Spread the config options first
    ...transcriptionOptions,

    // Then add the required fields and any overrides
    audio: audioPath,
    speakers_expected: speakersExpected,
    custom_spelling: customSpellings,
    keyterms_prompt: keyTerms,
  });

  // Check for errors
  if (transcript.error) {
    console.error(`❌ Transcription error: ${transcript.error}`);
    throw new Error(transcript.error);
  }

  // Fetch sentences and paragraphs
  console.log("📝 Fetching sentences and paragraphs...");
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
  console.log("📝 Building transcript...");

  // Build transcript from utterances if available, otherwise use full text
  if (transcript.utterances && transcript.utterances.length > 0) {
    // TODO: Future enhancement - infer speaker names from conversation content
    // e.g., "Hi, I'm John" → replace "Speaker A" with "John" throughout
    const lines = transcript.utterances.map(
      (u) => `[${formatTimestamp(u.start)}] **Speaker ${u.speaker}**: ${u.text}`,
    );
    return lines.join("\n\n");
  } else {
    // Fallback to full text if no utterances
    return transcript.text || "No transcript available";
  }
}
