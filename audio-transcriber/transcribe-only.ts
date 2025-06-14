#!/usr/bin/env bun

import fs from "node:fs";
import path from "node:path";
import { validateEnvironment } from "./utils.js";
import { runTranscriptionOnly } from "./pipeline.js";

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

// Run transcription only
try {
  console.log("🎙️ Starting transcription-only pipeline...");
  const { outputDir, transcriptPath } = await runTranscriptionOnly({
    inputPath,
    speakersExpected,
  });

  console.log("\n✅ Transcription complete!");
  console.log(`📁 Output folder: ${outputDir}`);
  console.log(`📄 Transcript: ${transcriptPath}`);
} catch (error) {
  console.error("Transcription failed:", error);
  process.exit(1);
}
