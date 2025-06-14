#!/bin/zsh -l

# @raycast.schemaVersion 1
# @raycast.title Transcribe Audio (Only)
# @raycast.mode fullOutput
# @raycast.argument1 { "type": "text", "placeholder": "Audio file path" }
# @raycast.argument2 { "type": "text", "placeholder": "Number of speakers", "optional": true }
# @raycast.icon 🎤
# @raycast.packageName AI Utilities
# @raycast.author Nick Trombley
# @raycast.description Transcribe audio files using AssemblyAI (no cleaning or summarization)

# Load zsh environment (includes environment variables)
source ~/.zshrc

# Get the directory where this script is located
SCRIPT_DIR="${0:a:h}"

# Run the Bun/TypeScript transcriber
bun "$SCRIPT_DIR/audio-transcriber/transcribe-only.ts" "$@"