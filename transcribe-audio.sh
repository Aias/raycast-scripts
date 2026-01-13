#!/bin/zsh -l

# @raycast.schemaVersion 1
# @raycast.title Transcribe Audio
# @raycast.mode fullOutput
# @raycast.argument1 { "type": "dropdown", "placeholder": "Mode", "data": [{"title": "Full Pipeline", "value": "full"}, {"title": "Transcribe Only", "value": "transcribe"}] }
# @raycast.argument2 { "type": "text", "placeholder": "Audio file path", "optional": true }
# @raycast.argument3 { "type": "text", "placeholder": "Number of speakers", "optional": true }
# @raycast.icon 🎙
# @raycast.packageName AI Utilities
# @raycast.author Nick Trombley
# @raycast.description Transcribe audio files using AssemblyAI, optionally with cleaning and summarization

# Load shell configuration (includes environment variables)
source "$(dirname "$0")/scripts/common.sh"
load_shell_config

# Get the directory where this script is located
set_script_dir "$0"

mode="$1"
file_path="$2"
num_speakers="$3"

# Select the appropriate TypeScript entry point based on mode
if [ "$mode" = "full" ]; then
    ts_file="index.ts"
else
    ts_file="transcribe-only.ts"
fi

# If no file path provided, try to get from Finder selection
if [ -z "$file_path" ]; then
    selected_file=$(get_finder_selection)
    if [ -z "$selected_file" ]; then
        echo "Error: No file selected in Finder and no file path provided"
        exit 1
    fi
    # Use the first selected file if multiple are selected
    file_path=$(echo "$selected_file" | head -n 1)
fi

# Run the script with appropriate arguments
if [ -n "$num_speakers" ]; then
    bun "$SCRIPT_DIR/packages/audio-transcriber/$ts_file" "$file_path" "$num_speakers"
else
    bun "$SCRIPT_DIR/packages/audio-transcriber/$ts_file" "$file_path"
fi
