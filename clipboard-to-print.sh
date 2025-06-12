#!/bin/zsh -l

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Print Clipboard
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 🖨️
# @raycast.packageName Print Clipboard

# Documentation:
# @raycast.description Print the contents of the clipboard using the notetaker endpoint
# @raycast.author Nick Trombley
# @raycast.authorURL https://github.com/Aias

# Load zsh environment
source ~/.zshrc

# Get the directory where this script is located
SCRIPT_DIR="${0:a:h}"

# Run the Node.js script
cd "$SCRIPT_DIR/clipboard-to-print" && node clipboard-to-print.js "$@"
