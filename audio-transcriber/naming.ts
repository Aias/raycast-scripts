import OpenAI from "openai";
import path from "node:path";
import fs from "node:fs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const TITLE_PROMPT = `Based on this summary, generate a 3-5 word descriptive title for the meeting/call.

Rules:
- Use lowercase with hyphens between words
- Focus on the main topic or purpose
- Avoid generic terms like "meeting", "call", "discussion"
- Be specific about the subject matter
- Output ONLY the title, no explanation

Summary:
{summary}`;

export async function generateTitle(summary: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: TITLE_PROMPT.replace("{summary}", summary),
        },
      ],
    });

    const title = response.choices[0].message.content?.trim() ?? "untitled";
    // Ensure it's lowercase and hyphenated
    return title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  } catch (error) {
    console.error("Error generating title:", error);
    return "untitled";
  }
}

export function extractDateFromFilename(filename: string): string | null {
  // Try to extract date from filename patterns like:
  // 2025-06-04_140234_000.wav
  // 2025-06-04-recording.mp3
  // 20250604_meeting.wav

  const basename = path.basename(filename);

  // Pattern 1: YYYY-MM-DD
  const match1 = basename.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match1) {
    return `${match1[1]}-${match1[2]}-${match1[3]}`;
  }

  // Pattern 2: YYYYMMDD
  const match2 = basename.match(/(\d{4})(\d{2})(\d{2})/);
  if (match2) {
    return `${match2[1]}-${match2[2]}-${match2[3]}`;
  }

  return null;
}

export function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function renameOutputFolder(
  currentPath: string,
  summary: string,
  originalFilename: string,
): Promise<string> {
  // Get date from filename or use current date
  const date = extractDateFromFilename(originalFilename) ?? getCurrentDate();

  // Generate descriptive title
  console.log("🏷️  Generating descriptive title...");
  const title = await generateTitle(summary);

  // Create new folder name
  const newFolderName = `${date}-${title}`;
  const parentDir = path.dirname(currentPath);
  const newPath = path.join(parentDir, newFolderName);

  // Rename the folder
  if (currentPath !== newPath) {
    fs.renameSync(currentPath, newPath);
    console.log(`📁 Renamed output folder to: ${newFolderName}`);
  }

  return newPath;
}

export function getOutputFilenames(folderName: string): {
  raw: string;
  cleaned: string;
  final: string;
} {
  return {
    raw: `${folderName}-transcript-raw.md`,
    cleaned: `${folderName}-transcript-cleaned.md`,
    final: `${folderName}-transcript.md`,
  };
}
