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
2. **Speaker Identification** (`speaker-identification.ts`) - Reconciles AssemblyAI's audio-based `label → name` mapping with the known-speaker roster (`knownSpeakers` in config) via an LLM pass that applies address-context reasoning, normalizes spellings, and rejects names mentioned but not present. Falls back to AssemblyAI's raw mapping on error.
3. **Cleaning** (`cleaning.ts`) - Edits the transcript passage by passage to clean verbatim. Runs concurrently with step 2: speaker names are applied by `renderTranscript` once both finish.
4. **Summarization** (`summarization.ts`) - AI-generated summary in a single pass

Model assignments live in `openai.ts`, keyed by the kind of work rather than by call site.

## Fidelity

The cleaning pass has no access to the audio, so it may not guess at what was said. Editing is restricted to deletions (fillers, stutters, repetitions), punctuation, and corrections to terms on the configured vocabulary list. Instructing a model to replace unclear words with a plausible substitute is a documented hallucination vector — general LLMs fabricate 3-12% of words when correcting ASR output without a grounding constraint. `transcript-raw.json` is the fidelity artifact; the cleaned markdown is the readable one.

The API accepts any `speech_models` string without validating it, so a retired model name degrades transcription silently rather than erroring. `transcribe` warns when the `speech_model_used` it reports back is not what was requested.

## Configuration

Local config in `transcription.config.local.ts` - `customSpellings`, `keyTerms`, and `knownSpeakers`. The roster feeds all three identification layers: AssemblyAI's audio-based pass (as `speakers`), the reconciliation prompt, and the protected vocabulary during cleaning.
