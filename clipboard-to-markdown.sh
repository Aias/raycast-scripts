#!/bin/zsh -l

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Clipboard to Markdown
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 📝

# Documentation:
# @raycast.description Convert HTML in clipboard to Markdown
# @raycast.author Nick Trombley
# @raycast.authorURL https://github.com/Aias

# Load shell configuration
source "$(dirname "$0")/scripts/common.sh"
load_shell_config

# Get the directory where this script is located
set_script_dir "$0"

# Run the TypeScript script
cd "$SCRIPT_DIR/packages/clipboard-to-markdown" && yarn start
