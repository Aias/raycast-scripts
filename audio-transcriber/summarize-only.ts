#!/usr/bin/env bun

import { parseTranscriptArgs } from "./utils.js";
import { runSummarizationOnly } from "./pipeline.js";

// Parse and validate command line arguments
const { transcriptPath } = parseTranscriptArgs();

// Run summarization only
try {
  console.log("📝 Starting transcript summarization...");
  const { summaryPath } = await runSummarizationOnly({
    transcriptPath,
    renameFolder: false, // Don't rename folder for standalone summarization
  });

  console.log("\n✅ Summarization complete!");
  console.log(`📄 Summary: ${summaryPath}`);
} catch (error) {
  console.error("Summarization failed:", error);
  process.exit(1);
}
