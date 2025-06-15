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

# Load shell configuration (includes homebrew, python, etc)
source "$(dirname "$0")/scripts/common.sh"
load_shell_config

# Get the directory where this script is located
set_script_dir "$0"

# Run the actual script
exec "$SCRIPT_DIR/extract-tweet-media/extract-tweet-media.sh" "$@"
