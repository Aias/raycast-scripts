#!/bin/zsh

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Markdown to PDF
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 🤖
# @raycast.argument1 { "type": "text", "placeholder": "Output filename" }

# Documentation:
# @raycast.description Converts markdown content from the clipboard to a PDF output in the current active Finder window or /output folder.
# @raycast.author Nick Trombley
# @raycast.authorURL https://raycast.com/Aias

# Source Zsh configuration
source ~/.zshrc

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Use NVM to run the correct version of Node
if [ -s "$NVM_DIR/nvm.sh" ]; then
    . "$NVM_DIR/nvm.sh"
    NODE_PATH=$(nvm which current)
else
    # Fallback to system Node if NVM is not available
    NODE_PATH=$(which node)
fi

# Run the Node.js script
"$NODE_PATH" "$SCRIPT_DIR/index.js" "$1"