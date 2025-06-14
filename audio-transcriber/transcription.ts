import { AssemblyAI, type Transcript } from "assemblyai";
import { formatTimestamp } from "./utils.js";

export type { Transcript };

const assemblyai = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY! });

type CustomSpelling = {
  from: string[];
  to: string;
};

const customSpellings: CustomSpelling[] = [
  { from: ["Jared"], to: "Jarrod" },
  { from: ["remark"], to: "Remark" },
];

export async function transcribe(
  audioPath: string,
  speakersExpected?: number,
): Promise<Transcript> {
  console.log("🎙️ Transcribing with AssemblyAI...");
  if (speakersExpected) {
    console.log(`   Expected speakers: ${speakersExpected}`);
  }

  const transcript = await assemblyai.transcripts.transcribe({
    speech_model: "slam-1",
    audio: audioPath,
    speaker_labels: true,
    speakers_expected: speakersExpected,
    format_text: true,
    punctuate: true,
    disfluencies: false,
    language_code: "en_us",
    custom_spelling: customSpellings,
    // entity_detection: true,
    // summarization: true,
    // summary_model: "informative",
    // summary_type: "paragraph",
    // auto_chapters: true,
  });

  // Check for errors
  if (transcript.error) {
    console.error(`❌ Transcription error: ${transcript.error}`);
    throw new Error(transcript.error);
  }

  return transcript;
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
