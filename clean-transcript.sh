#!/bin/zsh -l

# @raycast.schemaVersion 1
# @raycast.title Clean Transcript
# @raycast.mode fullOutput
# @raycast.argument1 { "type": "text", "placeholder": "Transcript file path (.md)" }
# @raycast.icon 🧹
# @raycast.packageName AI Utilities
# @raycast.author Nick Trombley
# @raycast.description Clean an existing transcript using OpenAI to remove filler words and fix grammar

# Load shell configuration (includes environment variables)
source "$(dirname "$0")/scripts/common.sh"
load_shell_config

# Get the directory where this script is located
set_script_dir "$0"

# Run the Bun/TypeScript cleaner
bun "$SCRIPT_DIR/audio-transcriber/clean-transcript.ts" "$@"
