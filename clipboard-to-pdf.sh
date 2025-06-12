#!/bin/zsh -l

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Clipboard to PDF
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 📄
# @raycast.argument1 { "type": "text", "placeholder": "Output filename" }

# Documentation:
# @raycast.description Converts clipboard content (markdown or plain text) to a PDF output in the current active Finder window.
# @raycast.author Nick Trombley
# @raycast.authorURL https://github.com/Aias

# Load zsh environment
source ~/.zshrc

# Load nvm if needed for Node.js
export NVM_DIR="$HOME/.nvm"
[[ -s "$NVM_DIR/nvm.sh" ]] && source "$NVM_DIR/nvm.sh"

# Run the Node.js script
cd "$HOME/Code/personal/raycast-scripts/clipboard-to-pdf" && node clipboard-to-pdf.js "$@"