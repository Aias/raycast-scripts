import { AssemblyAI, type Transcript } from "assemblyai";
import { formatTimestamp } from "./utils.js";

const assemblyai = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY! });

export async function transcribe(audioPath: string): Promise<Transcript> {
  console.log("🎙️ Transcribing with AssemblyAI...");
  const transcript = await assemblyai.transcripts.transcribe({
    audio: audioPath,
    speaker_labels: true,
    format_text: true,
    punctuate: true,
    disfluencies: false, // Remove filler words like "um", "uh", "like"
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
