#!/bin/zsh -l

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Web Crawler
# @raycast.mode fullOutput

# Optional parameters:
# @raycast.icon 🕷️
# @raycast.argument1 { "type": "text", "placeholder": "Starting URL" }

# Documentation:
# @raycast.description Web crawler utility using crawl4ai
# @raycast.author Nick Trombley
# @raycast.authorURL https://github.com/Aias

# Load shell configuration
source "$(dirname "$0")/scripts/common.sh"
load_shell_config

# Get the directory where this script is located
set_script_dir "$0"

# Run the Python script using uv
cd "$SCRIPT_DIR/crawler" && uv run python crawler.py "$@"
