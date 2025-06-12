#!/bin/zsh -l

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Sort OPML
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 🔤
# @raycast.argument1 { "type": "text", "placeholder": "OPML file path" }

# Documentation:
# @raycast.description Sort OPML files alphabetically
# @raycast.author Nick Trombley
# @raycast.authorURL https://github.com/Aias

# Load zsh environment
source ~/.zshrc

# Get the directory where this script is located
SCRIPT_DIR="${0:a:h}"

# Run the Python script using uv
cd "$SCRIPT_DIR/sort_opml" && uv run python sort_opml.py "$@"
