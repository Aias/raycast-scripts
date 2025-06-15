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

# Load zsh environment
source ~/.zshrc

# Get the directory where this script is located
SCRIPT_DIR="${0:a:h}"

# Run the Python script using uv
cd "$SCRIPT_DIR/crawler" && uv run python crawler.py "$@"
