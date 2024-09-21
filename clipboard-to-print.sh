#!/usr/bin/env zsh

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Print Clipboard
# @raycast.mode compact
# Optional parameters:
# @raycast.icon 🖨️
# @raycast.packageName Print Clipboard
# @raycast.description Print the contents of the clipboard using the notetaker endpoint

# Source Zsh configuration
source ~/.zshrc

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Run the Node.js script
node "$SCRIPT_DIR/node-scripts/clipboard-to-print.js" "$1"