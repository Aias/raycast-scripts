#!/usr/bin/env bun

import fs from "node:fs";
import path from "node:path";
import { validateEnvironment, createOutputFolder } from "./utils.js";
import { convertToWav } from "./audio.js";
import { transcribe, formatTranscript } from "./transcription.js";
import { chunkBySpeaker, summarizeChunks } from "./summarization.js";
import { cleanTranscript } from "./cleaning.js";
import { renameOutputFolder, getOutputFilenames } from "./naming.js";

// Check for required environment variables
validateEnvironment();

// Get input path from command line
const inputPath = path.resolve(process.argv[2] ?? "");
if (!fs.existsSync(inputPath)) {
  console.error(`⛔ File not found: ${inputPath}`);
  process.exit(1);
}

// Get optional number of speakers from command line
const speakersArg = process.argv[3];
const speakersExpected = speakersArg ? parseInt(speakersArg, 10) : undefined;
if (speakersExpected !== undefined && (isNaN(speakersExpected) || speakersExpected < 1)) {
  console.error(`⛔ Invalid number of speakers: ${speakersArg}`);
  process.exit(1);
}

// Create temporary output folder (will be renamed later)
let outputDir = createOutputFolder(inputPath);
console.log(`📁 Temporary output folder: ${outputDir}`);

/* ---------- 1. Normalise audio to 16 kHz mono WAV ---------- */
const wavPath = await convertToWav(inputPath, outputDir);

/* ---------- 2. Transcribe with AssemblyAI ---------- */
let transcript;
try {
  transcript = await transcribe(wavPath, speakersExpected);
} catch (error) {
  console.error("Transcription failed:", error);
  process.exit(1);
}

/* ---------- 3. Build cleaned transcript ---------- */
const transcriptText = formatTranscript(transcript);

/* ---------- 3.5. Save raw transcript ---------- */
const rawTranscriptPath = path.join(outputDir, "transcript-raw.md");

console.log("💾 Saving raw transcript...");
fs.writeFileSync(rawTranscriptPath, `## Transcript\n\n${transcriptText}\n`);
console.log(`✅ Raw transcript saved → ${rawTranscriptPath}`);

/* ---------- 3.6. Clean transcript ---------- */
const cleanedTranscript = await cleanTranscript(transcriptText);

/* ---------- 3.7. Save cleaned transcript ---------- */
const cleanedTranscriptPath = path.join(outputDir, "transcript-cleaned.md");

console.log("💾 Saving cleaned transcript...");
fs.writeFileSync(cleanedTranscriptPath, `## Transcript\n\n${cleanedTranscript}\n`);
console.log(`✅ Cleaned transcript saved → ${cleanedTranscriptPath}`);

/* ---------- 4. Chunk-wise summarisation ---------- */
// Use cleaned transcript for summarization
const transcriptForSummary = cleanedTranscript;

let summary = "";
try {
  const chunks = chunkBySpeaker(transcriptForSummary);
  summary = await summarizeChunks(chunks);

  /* ---------- 5. Write Markdown next to source ---------- */
  const summaryPath = path.join(outputDir, "summary.md");

  console.log("💾 Writing summary and final transcript...");
  fs.writeFileSync(
    summaryPath,
    `## Summary\n\n${summary}\n\n---\n\n## Transcript\n\n${transcriptForSummary}\n`,
  );

  /* ---------- 6. Rename folder and files ---------- */
  outputDir = await renameOutputFolder(outputDir, summary, inputPath);
  const folderName = path.basename(outputDir);
  const filenames = getOutputFilenames(folderName);

  // Update paths after folder rename
  const currentRawPath = path.join(outputDir, path.basename(rawTranscriptPath));
  const currentCleanedPath = path.join(outputDir, path.basename(cleanedTranscriptPath));
  const currentSummaryPath = path.join(outputDir, path.basename(summaryPath));

  // Rename files to match new naming convention
  const newRawPath = path.join(outputDir, filenames.raw);
  const newCleanedPath = path.join(outputDir, filenames.cleaned);
  const newFinalPath = path.join(outputDir, filenames.final);

  fs.renameSync(currentRawPath, newRawPath);
  fs.renameSync(currentCleanedPath, newCleanedPath);
  fs.renameSync(currentSummaryPath, newFinalPath);

  /* ---------- 7. Print results ---------- */
  console.log(`\n✅ Summary saved → ${newFinalPath}`);
  console.log(`📄 Raw transcript saved → ${newRawPath}`);
  console.log(`🧹 Cleaned transcript saved → ${newCleanedPath}`);
  console.log("\n---\n");
  console.log("## Summary\n\n" + summary + "\n");
  console.log("---\n");
  console.log(transcriptForSummary);
} catch (error) {
  console.error(
    "\n⚠️  Summarization failed:",
    error instanceof Error ? error.message : String(error),
  );

  // Still rename folder with basic naming if summary failed
  const { extractDateFromFilename, getCurrentDate } = await import("./naming.js");
  const date = extractDateFromFilename(inputPath) ?? getCurrentDate();
  const newFolderName = `${date}-untitled`;
  const newPath = path.join(path.dirname(outputDir), newFolderName);

  if (outputDir !== newPath && fs.existsSync(outputDir)) {
    fs.renameSync(outputDir, newPath);
    outputDir = newPath;
  }

  console.log(`\n📄 Raw transcript saved → ${rawTranscriptPath}`);
  console.log(`🧹 Cleaned transcript saved → ${cleanedTranscriptPath}`);
  console.log("\n---\n");
  console.log("## Transcript\n");
  console.log(transcriptForSummary);
}
