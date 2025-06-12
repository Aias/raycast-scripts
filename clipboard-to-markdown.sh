#!/bin/zsh -l

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Clipboard to Markdown
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 📝

# Documentation:
# @raycast.description Convert HTML in clipboard to Markdown
# @raycast.author Nick Trombley
# @raycast.authorURL https://github.com/Aias

# Load zsh environment
source ~/.zshrc

# Load nvm if needed for Node.js
export NVM_DIR="$HOME/.nvm"
[[ -s "$NVM_DIR/nvm.sh" ]] && source "$NVM_DIR/nvm.sh"

# Run the TypeScript script
cd "$HOME/Code/personal/raycast-scripts/clipboard-to-markdown" && yarn start