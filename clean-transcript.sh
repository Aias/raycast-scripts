#!/bin/zsh -l

# @raycast.schemaVersion 1
# @raycast.title Clean Transcript
# @raycast.mode fullOutput
# @raycast.argument1 { "type": "text", "placeholder": "Transcript file path (.md)" }
# @raycast.icon 🧹
# @raycast.packageName AI Utilities
# @raycast.author Nick Trombley
# @raycast.description Clean an existing transcript using OpenAI to remove filler words and fix grammar

# Load zsh environment (includes environment variables)
source ~/.zshrc

# Get the directory where this script is located
SCRIPT_DIR="${0:a:h}"

# Run the Bun/TypeScript cleaner
bun "$SCRIPT_DIR/audio-transcriber/clean-transcript.ts" "$@"