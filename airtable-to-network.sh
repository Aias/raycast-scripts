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

# Load shell configuration
source "$(dirname "$0")/scripts/common.sh"
load_shell_config

# Get the directory where this script is located
set_script_dir "$0"

# Run the Python script using uv
cd "$SCRIPT_DIR/scripts/python/airtable-to-network" && uv run python airtable-to-network.py "$@"
