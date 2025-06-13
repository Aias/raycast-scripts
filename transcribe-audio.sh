#!/bin/zsh -l

# @raycast.schemaVersion 1
# @raycast.title Transcribe Audio
# @raycast.mode fullOutput
# @raycast.argument1 { "type": "text", "placeholder": "Audio file path" }
# @raycast.icon 🎙
# @raycast.packageName AI Utilities
# @raycast.author Nick Trombley
# @raycast.description Transcribe and summarize audio files using Deepgram and OpenAI

# Load zsh environment (includes environment variables)
source ~/.zshrc

# Get the directory where this script is located
SCRIPT_DIR="${0:a:h}"

# Run the Bun/TypeScript transcriber
bun "$SCRIPT_DIR/audio-transcriber/index.ts" "$@"
