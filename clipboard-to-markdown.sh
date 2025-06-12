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

# Get the directory where this script is located
SCRIPT_DIR="${0:a:h}"

# Run the TypeScript script
cd "$SCRIPT_DIR/clipboard-to-markdown" && yarn start
