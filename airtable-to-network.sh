#!/bin/zsh -l

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Airtable to Network
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 🕸️
# @raycast.argument1 { "type": "text", "placeholder": "Path to CSV file" }

# Documentation:
# @raycast.description Convert CSV from Airtable to Gephi-compatible format
# @raycast.author Nick Trombley
# @raycast.authorURL https://github.com/Aias

# Load zsh environment
source ~/.zshrc

# Get the directory where this script is located
SCRIPT_DIR="${0:a:h}"

# Run the Python script using uv
cd "$SCRIPT_DIR/airtable-to-network" && uv run python airtable-to-network.py "$@"
