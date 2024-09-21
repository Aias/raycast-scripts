#!/usr/bin/env zsh

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Clipboard to PDF
# @raycast.mode compact
# Optional parameters:
# @raycast.icon 🤖
# @raycast.argument1 { "type": "text", "placeholder": "Output filename" }
# Documentation:
# @raycast.description Converts clipboard content (markdown or plain text) to a PDF output in the current active Finder window.
# @raycast.author Nick Trombley
# @raycast.authorURL https://raycast.com/Aias

# Source Zsh configuration
source ~/.zshrc

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Run the Node.js script
node "$SCRIPT_DIR/node-scripts/clipboard-to-pdf.js" "$1"