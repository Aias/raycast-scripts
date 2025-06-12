#!/bin/zsh -l

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Directory Concat
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 📄
# @raycast.argument1 { "type": "text", "placeholder": "Directory path" }
# @raycast.argument2 { "type": "text", "placeholder": "Non-recursive (true/false)", "optional": true }
# @raycast.packageName Raycast Scripts

# Documentation:
# @raycast.description Concatenate all files in a directory into a single output
# @raycast.author Nick Trombley
# @raycast.authorURL https://github.com/Aias

# Load zsh environment
source ~/.zshrc

# Get the directory where this script is located
SCRIPT_DIR="${0:a:h}"

# Run the actual script
exec "$SCRIPT_DIR/directory-concat/directory-concat.sh" "$@"
