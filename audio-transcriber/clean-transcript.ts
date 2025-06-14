#!/usr/bin/env bun

import { parseTranscriptArgs } from "./utils.js";
import { runCleaningOnly } from "./pipeline.js";

// Parse and validate command line arguments
const { transcriptPath } = parseTranscriptArgs();

// Run cleaning only
try {
  console.log("🧹 Starting transcript cleaning...");
  const { cleanedPath } = await runCleaningOnly({
    transcriptPath,
  });

  console.log("\n✅ Cleaning complete!");
  console.log(`📄 Cleaned transcript: ${cleanedPath}`);
} catch (error) {
  console.error("Cleaning failed:", error);
  process.exit(1);
}
