#!/bin/zsh -l

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Clipboard to PDF
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 📄
# @raycast.argument1 { "type": "text", "placeholder": "Output filename" }

# Documentation:
# @raycast.description Converts clipboard content (markdown or plain text) to a PDF output in the current active Finder window.
# @raycast.author Nick Trombley
# @raycast.authorURL https://github.com/Aias

# Load shell configuration
source "$(dirname "$0")/scripts/common.sh"
load_shell_config

# Get the directory where this script is located
set_script_dir "$0"

# Run the Node.js script
cd "$SCRIPT_DIR/packages/clipboard-to-pdf" && node clipboard-to-pdf.js "$@"
