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

# Load nvm if needed for Node.js
export NVM_DIR="$HOME/.nvm"
[[ -s "$NVM_DIR/nvm.sh" ]] && source "$NVM_DIR/nvm.sh"

# Run the Node.js script
cd "$HOME/Code/personal/raycast-scripts/clipboard-to-print" && node clipboard-to-print.js "$@"