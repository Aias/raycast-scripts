#!/bin/zsh -l

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Extract Tweet Media
# @raycast.mode fullOutput
# @raycast.packageName Tweet Tools

# Optional parameters:
# @raycast.icon 🐦
# @raycast.argument1 { "type": "text", "placeholder": "Tweet URL" }

# Documentation:
# @raycast.description Downloads all media from a tweet to a timestamped folder
# @raycast.author Nick Trombley
# @raycast.authorURL https://github.com/Aias

# Load zsh environment (includes homebrew, python, etc)
source ~/.zshrc

# Run the actual script
exec "$HOME/Code/scripts/extract-tweet-media/extract-tweet-media.sh" "$@"