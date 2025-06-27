#!/bin/zsh -l

# @raycast.schemaVersion 1
# @raycast.title Transcribe Audio (Only)
# @raycast.mode fullOutput
# @raycast.argument1 { "type": "text", "placeholder": "Audio file path", "optional": true }
# @raycast.argument2 { "type": "text", "placeholder": "Number of speakers", "optional": true }
# @raycast.icon 🎤
# @raycast.packageName AI Utilities
# @raycast.author Nick Trombley
# @raycast.description Transcribe audio files using AssemblyAI (no cleaning or summarization)

# Load shell configuration (includes environment variables)
source "$(dirname "$0")/scripts/common.sh"
load_shell_config

# Get the directory where this script is located
set_script_dir "$0"

# If no file path provided, try to get from Finder selection
if [ -z "$1" ]; then
    selected_file=$(get_finder_selection)
    if [ -z "$selected_file" ]; then
        echo "Error: No file selected in Finder and no file path provided"
        exit 1
    fi
    # Use the first selected file if multiple are selected
    file_path=$(echo "$selected_file" | head -n 1)
    
    # Run with the Finder-selected file
    if [ -n "$2" ]; then
        bun "$SCRIPT_DIR/packages/audio-transcriber/transcribe-only.ts" "$file_path" "$2"
    else
        bun "$SCRIPT_DIR/packages/audio-transcriber/transcribe-only.ts" "$file_path"
    fi
else
    # Run with provided arguments
    bun "$SCRIPT_DIR/packages/audio-transcriber/transcribe-only.ts" "$@"
fi
