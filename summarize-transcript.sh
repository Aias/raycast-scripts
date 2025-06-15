#!/bin/zsh -l

# @raycast.schemaVersion 1
# @raycast.title Summarize Transcript
# @raycast.mode fullOutput
# @raycast.argument1 { "type": "text", "placeholder": "Transcript file path (.md)" }
# @raycast.icon 📝
# @raycast.packageName AI Utilities
# @raycast.author Nick Trombley
# @raycast.description Summarize an existing transcript using OpenAI

# Load shell configuration (includes environment variables)
source "$(dirname "$0")/scripts/common.sh"
load_shell_config

# Get the directory where this script is located
set_script_dir "$0"

# Run the Bun/TypeScript summarizer
bun "$SCRIPT_DIR/audio-transcriber/summarize-only.ts" "$@"
