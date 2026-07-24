# Audio Transcriber

A TypeScript-based audio transcription and summarization tool using AssemblyAI for speech-to-text and OpenAI for intelligent summarization. Built with Bun for fast execution.

## Features

- Converts audio files to 16kHz mono FLAC, the signal AssemblyAI transcribes from
- Speaker diarization with name identification — AssemblyAI infers speaker names from the audio, reconciled by an LLM pass against a known-speaker roster
- Clean-verbatim editing: fillers, stutters, and repetitions come out; wording stays as spoken
- Outputs markdown file with summary and full transcript
- Written in TypeScript for better type safety
- Uses Bun runtime for fast performance

## Prerequisites

- Bun (latest version)
- AssemblyAI API key
- OpenAI API key

## Installation

```bash
bun install
```

## Usage

```bash
# Set required environment variables
export ASSEMBLYAI_API_KEY="your-assemblyai-api-key"
export OPENAI_API_KEY="your-openai-api-key"

# Run the transcriber
bun run index.ts /path/to/audio/file.mp3

# Or use the npm script
bun start /path/to/audio/file.mp3

# Development mode with file watching
bun dev /path/to/audio/file.mp3
```

## Supported Formats

Works with any audio format supported by ffmpeg (wav, mp3, m4a, etc.)

## Output

Creates a `.transcript.md` file in the same directory as the input audio file containing:

- Executive summary
- Full diarized transcript with timestamps and speaker labels

## API Notes

- Uses AssemblyAI for high-quality transcription with speaker diarization and speaker identification (real names inferred from the conversation)
- Uses OpenAI for cleaning and summarization; model assignments live in `openai.ts`
