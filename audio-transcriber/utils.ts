import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, ".env") });

export function validateEnvironment(): void {
  if (!process.env.ASSEMBLYAI_API_KEY) {
    console.error("⛔ Missing ASSEMBLYAI_API_KEY environment variable");
    process.exit(1);
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error("⛔ Missing OPENAI_API_KEY environment variable");
    process.exit(1);
  }
}

export function formatTimestamp(ms: number): string {
  return new Date(ms).toISOString().slice(11, 19);
}

export function createOutputFolder(inputPath: string): string {
  const dir = path.dirname(inputPath);
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outputDir = path.join(dir, baseName);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  return outputDir;
}
