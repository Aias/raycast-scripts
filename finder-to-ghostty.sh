#!/bin/zsh -l

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Finder -> Ghostty
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 👻

# Documentation:
# @raycast.description Opens the currently selected Finder window in the Ghostty terminal emulator
# @raycast.author Nick Trombley
# @raycast.authorURL https://github.com/Aias

# Load zsh environment
source ~/.zshrc

# Get the directory where this script is located
SCRIPT_DIR="${0:a:h}"

# Run the actual script
exec "$SCRIPT_DIR/finder-to-ghostty/finder-to-ghostty.sh" "$@"
