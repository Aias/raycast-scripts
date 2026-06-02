# Audio Transcriber

Raycast script package for transcribing audio files using AssemblyAI with speaker diarization and AI-powered summarization.

## TP-7 Device Access

The Teenage Engineering TP-7 uses MTP (Media Transfer Protocol), not USB Mass Storage. macOS has no native MTP support.

**Accessing recordings:**

- Requires Field Kit app to be open (acts as MTP bridge)
- Files sync to: `~/Library/Containers/engineering.teenage.fieldkit/Data/Documents/TP-7 MTP Device-{SERIAL}/recordings/`
- When Field Kit closes, the folder becomes stale/inaccessible

**File format:**

- WAV files, naming pattern: `YYYY-MM-DD_HHMMSS_000.wav`
- High quality uncompressed audio (large files)

**Alternative MTP clients:** Android File Transfer, MacDroid, Commander One

## Pipeline Overview

1. **Transcription** (`transcription.ts`) - AssemblyAI with speaker diarization and Speaker Identification (`speech_understanding`), which infers real names from the conversation audio
2. **Speaker Identification** (`speaker-identification.ts`) - Reconciles AssemblyAI's audio-based `label → name` mapping with the known-speaker roster (`knownSpeakers` in config) via a GPT-5.5 pass that applies address-context reasoning, normalizes spellings, and rejects names mentioned but not present. Falls back to AssemblyAI's raw mapping on error.
3. **Cleaning** (`cleaning.ts`) - Formats and cleans raw transcript
4. **Summarization** (`summarization.ts`) - AI-generated summary

## Configuration

Local config in `transcription.config.local.ts` - `customSpellings`, `keyTerms`, and `knownSpeakers` (the recurring-participant roster used as hints during speaker reconciliation).
