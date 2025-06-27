#!/bin/zsh -l

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Directory Concat
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 📄
# @raycast.argument1 { "type": "text", "placeholder": "Directory path" }
# @raycast.argument2 { "type": "text", "placeholder": "Non-recursive (true/false)", "optional": true }
# @raycast.packageName Raycast Scripts

# Documentation:
# @raycast.description Concatenate all files in a directory into a single output
# @raycast.author Nick Trombley
# @raycast.authorURL https://github.com/Aias

# Load shell configuration
source "$(dirname "$0")/scripts/common.sh"
load_shell_config

# Get the directory where this script is located
set_script_dir "$0"

# Run the actual script
exec "$SCRIPT_DIR/scripts/python/directory-concat/directory-concat.sh" "$@"
