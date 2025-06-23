#!/usr/bin/env bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Slack to Markdown
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 💬
# @raycast.packageName Scripts
# @raycast.description Convert Slack-copied text to markdown transcript format
# @raycast.argument1 { "type": "dropdown", "placeholder": "Output", "optional": true, "default": "paste", "data": [{"title": "Paste to Input", "value": "paste"}, {"title": "Copy to Clipboard", "value": "copy"}] }

# Documentation:
# @raycast.author Nick Trombley

set -e  # Exit on error

script_dir="$(dirname "$0")"
cd "$script_dir/packages/slack-to-markdown" || exit 1

# Get clipboard content and convert it
clipboard_content=$(pbpaste)
output=$(echo "$clipboard_content" | /Users/nicktrombley/.bun/bin/bun run src/index.ts 2>&1)
exit_code=$?

# Check if the conversion was successful
if [ $exit_code -ne 0 ]; then
    echo "Error running conversion (exit code: $exit_code)"
    echo "Output: $output"
    echo "Clipboard content length: ${#clipboard_content}"
    exit 1
fi

# Handle output based on the argument
if [ "${1:-paste}" = "copy" ]; then
    # Copy back to clipboard
    echo "$output" | pbcopy
    echo "Converted text copied to clipboard"
else
    # Paste directly to current input (default)
    # Check the output length
    output_length=${#output}
    
    if [ $output_length -gt 5000 ]; then
        # For long text, copy to clipboard and notify user
        echo "$output" | pbcopy
        echo "✓ Text is too long to paste directly (${output_length} chars)"
        echo "The formatted text has been copied to your clipboard."
        echo "Please paste it manually with Cmd+V"
    else
        # For shorter text, paste directly
        # Use a temporary file to avoid escaping issues
        temp_file=$(mktemp)
        echo "$output" > "$temp_file"
        
        # Set clipboard from file and paste
        pbcopy < "$temp_file"
        
        # Small delay to ensure clipboard is set
        sleep 0.1
        
        # Paste using System Events
        osascript -e 'tell application "System Events" to keystroke "v" using command down'
        
        # Clean up
        rm -f "$temp_file"
        
        echo "✓ Pasted formatted text (${output_length} chars)"
    fi
fi