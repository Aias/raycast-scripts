#!/bin/zsh -l

# @raycast.schemaVersion 1
# @raycast.title Summarize Transcript
# @raycast.mode fullOutput
# @raycast.argument1 { "type": "text", "placeholder": "Transcript file path (.md)" }
# @raycast.icon 📝
# @raycast.packageName AI Utilities
# @raycast.author Nick Trombley
# @raycast.description Summarize an existing transcript using OpenAI

# Load zsh environment (includes environment variables)
source ~/.zshrc

# Get the directory where this script is located
SCRIPT_DIR="${0:a:h}"

# Run the Bun/TypeScript summarizer
bun "$SCRIPT_DIR/audio-transcriber/summarize-only.ts" "$@"
