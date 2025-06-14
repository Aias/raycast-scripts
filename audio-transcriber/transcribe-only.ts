#!/usr/bin/env bun

import { parseCommandLineArgs } from "./utils.js";
import { runTranscriptionOnly } from "./pipeline.js";

// Parse and validate command line arguments
const args = parseCommandLineArgs();

// Run transcription only
try {
  console.log("🎙️ Starting transcription-only pipeline...");
  const { outputDir, transcriptPath } = await runTranscriptionOnly(args);

  console.log("\n✅ Transcription complete!");
  console.log(`📁 Output folder: ${outputDir}`);
  console.log(`📄 Transcript: ${transcriptPath}`);
} catch (error) {
  console.error("Transcription failed:", error);
  process.exit(1);
}
