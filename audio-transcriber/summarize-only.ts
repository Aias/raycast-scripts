#!/usr/bin/env bun

import fs from "node:fs";
import path from "node:path";
import { validateEnvironment } from "./utils.js";
import { runSummarizationOnly } from "./pipeline.js";

// Check for required environment variables
validateEnvironment();

// Get transcript path from command line
const transcriptPath = path.resolve(process.argv[2] ?? "");
if (!fs.existsSync(transcriptPath)) {
  console.error(`⛔ File not found: ${transcriptPath}`);
  process.exit(1);
}

// Validate it's a markdown file
if (!transcriptPath.endsWith(".md")) {
  console.error(`⛔ Expected a markdown transcript file, got: ${transcriptPath}`);
  process.exit(1);
}

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
