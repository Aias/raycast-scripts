import fs from "node:fs";
import path from "node:path";
import type { Transcript } from "assemblyai";
import { z } from "zod";
import { createOutputFolder } from "./utils.js";
import { convertToWav } from "./audio.js";
import { transcribe } from "./transcription.js";
import { chunkBySpeaker, summarizeChunks } from "./summarization.js";
import { cleanTranscript } from "./cleaning.js";
import { renameOutputFolder, getOutputFilenames } from "./naming.js";

export interface TranscriptionOptions {
  inputPath: string;
  speakersExpected?: number;
  outputDir?: string;
}

export interface CleaningOptions {
  transcriptPath: string;
  outputPath?: string;
  transcriptData?: Transcript;
}

export interface SummarizationOptions {
  transcriptPath: string;
  outputDir?: string;
  renameFolder?: boolean;
  originalFilename?: string;
}

/**
 * Run only the transcription step
 */
export async function runTranscriptionOnly(options: TranscriptionOptions): Promise<{
  outputDir: string;
  transcript: Transcript;
  transcriptPath: string;
}> {
  const { inputPath, speakersExpected } = options;

  // Create output folder if not provided
  const outputDir = options.outputDir || createOutputFolder(inputPath);
  console.log(`📁 Output folder: ${outputDir}`);

  // Convert audio to WAV
  const wavPath = await convertToWav(inputPath, outputDir);

  // Transcribe and get sentences/paragraphs
  const result = await transcribe(wavPath, speakersExpected);

  // Save the complete output to JSON
  const jsonPath = path.join(outputDir, "transcript-raw.json");
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));
  console.log(`✅ Raw transcript saved → ${jsonPath}`);

  return { outputDir, transcript: result.transcript, transcriptPath: jsonPath };
}

// Schema for the complete transcription output
const TranscriptionOutputSchema = z.object({
  transcript: z
    .object({
      text: z.string().nullable(),
      utterances: z
        .array(
          z.object({
            start: z.number(),
            end: z.number(),
            text: z.string(),
            speaker: z.string(),
          }),
        )
        .nullable(),
    })
    .passthrough(), // Allow additional fields from AssemblyAI
  sentences: z.any(), // We'll refine this once we see the structure
  paragraphs: z.any(), // We'll refine this once we see the structure
});

/**
 * Run only the cleaning step on an existing transcript
 */
export async function runCleaningOnly(options: CleaningOptions): Promise<{
  cleanedPath: string;
  cleanedText: string;
}> {
  const { transcriptPath } = options;
  let transcript: Transcript;

  // Check if we have transcript data provided or need to load it
  if (options.transcriptData) {
    transcript = options.transcriptData;
  } else {
    // Load transcript from JSON file
    console.log(`📖 Reading transcript JSON from ${transcriptPath}...`);
    const jsonContent = fs.readFileSync(transcriptPath, "utf-8");

    try {
      const parsed = JSON.parse(jsonContent) as unknown;
      // Validate the parsed JSON has the required structure
      const validated = TranscriptionOutputSchema.parse(parsed);
      transcript = validated.transcript as Transcript;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("❌ Invalid transcript JSON structure:", error.message);
        throw new Error(`Invalid transcript file: ${transcriptPath}`);
      }
      throw error;
    }
  }

  // Clean transcript
  const cleanedText = await cleanTranscript(transcript);

  // Determine output path
  const outputPath = options.outputPath || transcriptPath.replace(/\.json$/, "-cleaned.md");

  console.log("💾 Saving cleaned transcript...");
  fs.writeFileSync(outputPath, `## Transcript\n\n${cleanedText}\n`);
  console.log(`✅ Cleaned transcript saved → ${outputPath}`);

  return { cleanedPath: outputPath, cleanedText };
}

/**
 * Run only the summarization step on an existing transcript
 */
export async function runSummarizationOnly(options: SummarizationOptions): Promise<{
  summaryPath: string;
  summary: string;
  outputDir: string;
}> {
  const { transcriptPath } = options;

  // Read transcript
  console.log(`📖 Reading transcript from ${transcriptPath}...`);
  const content = fs.readFileSync(transcriptPath, "utf-8");

  // Extract just the transcript part
  const transcriptMatch = content.match(/## Transcript\n\n([\s\S]+?)(?:\n\n---|\n\n##|$)/);
  const transcriptText = transcriptMatch ? transcriptMatch[1] : content;

  // Get or create output directory
  let outputDir = options.outputDir || path.dirname(transcriptPath);

  // Chunk and summarize
  const chunks = chunkBySpeaker(transcriptText);
  const summary = await summarizeChunks(chunks);

  // Write summary
  const summaryPath = path.join(outputDir, "summary.md");
  console.log("💾 Writing summary...");
  fs.writeFileSync(
    summaryPath,
    `## Summary\n\n${summary}\n\n---\n\n## Transcript\n\n${transcriptText}\n`,
  );

  // Optionally rename folder based on summary
  if (options.renameFolder && options.originalFilename) {
    outputDir = await renameOutputFolder(outputDir, summary, options.originalFilename);

    // Update paths after rename
    const folderName = path.basename(outputDir);
    const filenames = getOutputFilenames(folderName);
    const newSummaryPath = path.join(outputDir, filenames.final);

    // Rename the summary file
    const currentSummaryPath = path.join(outputDir, path.basename(summaryPath));
    fs.renameSync(currentSummaryPath, newSummaryPath);

    console.log(`✅ Summary saved → ${newSummaryPath}`);
    return { summaryPath: newSummaryPath, summary, outputDir };
  }

  console.log(`✅ Summary saved → ${summaryPath}`);
  return { summaryPath, summary, outputDir };
}

/**
 * Run the full pipeline (backward compatibility)
 */
export async function runFullPipeline(options: TranscriptionOptions): Promise<void> {
  const { inputPath, speakersExpected } = options;

  // Step 1: Transcribe
  const { outputDir, transcript, transcriptPath } = await runTranscriptionOnly({
    inputPath,
    speakersExpected,
  });

  // Step 2: Clean
  const { cleanedPath, cleanedText } = await runCleaningOnly({
    transcriptPath,
    transcriptData: transcript,
  });

  // Step 3: Summarize with folder renaming
  try {
    const { summaryPath, summary } = await runSummarizationOnly({
      transcriptPath: cleanedPath,
      outputDir,
      renameFolder: true,
      originalFilename: inputPath,
    });

    // Rename transcript files to match folder name
    const folderName = path.basename(path.dirname(summaryPath));
    const filenames = getOutputFilenames(folderName);

    // Update file paths after folder rename
    const finalOutputDir = path.dirname(summaryPath);
    const currentRawPath = path.join(finalOutputDir, path.basename(transcriptPath));
    const currentCleanedPath = path.join(finalOutputDir, path.basename(cleanedPath));

    const newRawPath = path.join(finalOutputDir, filenames.raw);
    const newCleanedPath = path.join(finalOutputDir, filenames.cleaned);

    if (fs.existsSync(currentRawPath)) {
      fs.renameSync(currentRawPath, newRawPath);
    }
    if (fs.existsSync(currentCleanedPath)) {
      fs.renameSync(currentCleanedPath, newCleanedPath);
    }

    // Print results
    console.log(`\n📄 Raw transcript saved → ${newRawPath}`);
    console.log(`🧹 Cleaned transcript saved → ${newCleanedPath}`);
    console.log("\n---\n");
    console.log("## Summary\n\n" + summary + "\n");
    console.log("---\n");
    console.log(cleanedText);
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
    }

    console.log(`\n📄 Raw transcript saved → ${transcriptPath}`);
    console.log(`🧹 Cleaned transcript saved → ${cleanedPath}`);
    console.log("\n---\n");
    console.log("## Transcript\n");
    console.log(cleanedText);
  }
}
