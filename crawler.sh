#!/bin/zsh -l

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Web Crawler
# @raycast.mode fullOutput

# Optional parameters:
# @raycast.icon 🕷️

# Documentation:
# @raycast.description Web crawler utility using crawl4ai
# @raycast.author Nick Trombley
# @raycast.authorURL https://github.com/Aias

# Load zsh environment
source ~/.zshrc

# Run the Python script using uv
cd "$HOME/Code/personal/raycast-scripts/crawler" && uv run python crawler.py "$@"