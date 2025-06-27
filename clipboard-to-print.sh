#!/bin/zsh -l

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Print Clipboard
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 🖨️
# @raycast.packageName Print Clipboard

# Documentation:
# @raycast.description Print the contents of the clipboard using the notetaker endpoint
# @raycast.author Nick Trombley
# @raycast.authorURL https://github.com/Aias

# Load shell configuration
source "$(dirname "$0")/scripts/common.sh"
load_shell_config

# Get the directory where this script is located
set_script_dir "$0"

# Run the Node.js script
cd "$SCRIPT_DIR/packages/clipboard-to-print" && node clipboard-to-print.js "$@"
