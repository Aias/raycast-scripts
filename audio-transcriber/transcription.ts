import { AssemblyAI, type Transcript } from "assemblyai";
import { formatTimestamp } from "./utils.js";
import { customSpellings, keyTerms } from "./transcription.config.js";

const assemblyai = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY! });

export async function transcribe(
  audioPath: string,
  speakersExpected?: number,
): Promise<Transcript> {
  console.log("🎙️ Transcribing with AssemblyAI...");
  if (speakersExpected) {
    console.log(`   Expected speakers: ${speakersExpected}`);
  }

  const transcript = await assemblyai.transcripts.transcribe({
    audio: audioPath,
    speech_model: "slam-1",
    speaker_labels: true,
    speakers_expected: speakersExpected,
    format_text: true,
    punctuate: true, // Must be true if speaker_labels is true
    disfluencies: false, // Slam-1 doesn't support disfluencies
    language_code: "en_us",
    custom_spelling: customSpellings,
    keyterms_prompt: keyTerms,
    entity_detection: true,
    // summarization: true, // Only summarization or auto_chapters can be true, not both
    // summary_model: "informative",
    // summary_type: "paragraph",
    auto_chapters: true,
    auto_highlights: true,
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
