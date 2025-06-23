#!/usr/bin/env bun

import { parseCommandLineArgs } from './utils.js';
import { runFullPipeline } from './pipeline.js';

// Parse and validate command line arguments
const args = parseCommandLineArgs();

// Run the full pipeline
try {
	await runFullPipeline(args);
} catch (error) {
	console.error('Pipeline failed:', error);
	process.exit(1);
}
