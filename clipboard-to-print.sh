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

# Use NVM to run the correct version of Node
if [ -s "$NVM_DIR/nvm.sh" ]; then
    . "$NVM_DIR/nvm.sh"
    NODE_PATH=$(nvm which current)
else
    # Fallback to system Node if NVM is not available
    NODE_PATH=$(which node)
fi

# Run the Node.js script
"$NODE_PATH" "$SCRIPT_DIR/node-scripts/clipboard-to-print.js" "$1"