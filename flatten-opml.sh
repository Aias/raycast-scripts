#!/bin/zsh -l

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Flatten OPML
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 📋
# @raycast.argument1 { "type": "text", "placeholder": "OPML file path" }

# Documentation:
# @raycast.description Flatten OPML files to a single level
# @raycast.author Nick Trombley
# @raycast.authorURL https://github.com/Aias

# Load shell configuration
source "$(dirname "$0")/scripts/common.sh"
load_shell_config

# Get the directory where this script is located
set_script_dir "$0"

# Run the Python script using uv
cd "$SCRIPT_DIR/scripts/python/flatten_opml" && uv run python flatten_opml.py "$@"
