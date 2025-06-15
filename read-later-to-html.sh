#!/bin/zsh -l

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Read Later to HTML
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 📚
# @raycast.argument1 { "type": "text", "placeholder": "JSON file path" }

# Documentation:
# @raycast.description Converts JSON file exported by Reeder's Read Later feature to HTML for Raindrop import
# @raycast.author Nick Trombley
# @raycast.authorURL https://github.com/Aias

# Load shell configuration
source "$(dirname "$0")/scripts/common.sh"
load_shell_config

# Get the directory where this script is located
set_script_dir "$0"

# Run the Python script using uv
cd "$SCRIPT_DIR/read-later-to-html" && uv run python read-later-to-html.py "$@"
