#!/usr/bin/env bun

import fs from "node:fs";
import path from "node:path";
import { validateEnvironment } from "./utils.js";
import { runCleaningOnly } from "./pipeline.js";

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
