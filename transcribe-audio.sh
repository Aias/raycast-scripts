#!/bin/zsh -l

# @raycast.schemaVersion 1
# @raycast.title Transcribe Audio
# @raycast.mode fullOutput
# @raycast.argument1 { "type": "text", "placeholder": "Audio file path" }
# @raycast.argument2 { "type": "text", "placeholder": "Number of speakers", "optional": true }
# @raycast.icon 🎙
# @raycast.packageName AI Utilities
# @raycast.author Nick Trombley
# @raycast.description Transcribe and summarize audio files using Deepgram and OpenAI

# Load shell configuration (includes environment variables)
source "$(dirname "$0")/scripts/common.sh"
load_shell_config

# Get the directory where this script is located
set_script_dir "$0"

# Run the Bun/TypeScript transcriber
bun "$SCRIPT_DIR/audio-transcriber/index.ts" "$@"
