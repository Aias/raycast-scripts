#!/bin/bash

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
# @raycast.author Aias
# @raycast.authorURL https://raycast.com/Aias

# Function to get file extension
get_file_extension() {
    local filename="$1"
    local extension="${filename##*.}"
    if [ "$extension" != "$filename" ]; then
        echo "$extension"
    else
        echo "txt"  # Default to txt if no extension
    fi
}

# Function to process files
process_files() {
    local dir="$1"
    local base_dir="$2"
    
    for file in "$dir"/*; do
        if [ -f "$file" ]; then
            relative_path="${file#$base_dir/}"
            file_extension=$(get_file_extension "$file")
            echo "**$relative_path**" >> "$output_file"
            echo '```'"$file_extension" >> "$output_file"
            cat "$file" >> "$output_file"
            echo '```' >> "$output_file"
            echo "" >> "$output_file"
        elif [ -d "$file" ] && [ "$recursive" = true ]; then
            process_files "$file" "$base_dir"
        fi
    done
}

# Main script
directory_path="$1"
non_recursive="${2:-false}"

# Set recursive to true by default, unless explicitly set to non-recursive
if [ "$non_recursive" = "true" ]; then
    recursive=false
else
    recursive=true
fi

if [ ! -d "$directory_path" ]; then
    echo "Error: The specified directory does not exist."
    exit 1
fi

output_file="${directory_path%/}_concat.md"

# Clear or create the output file
> "$output_file"

process_files "$directory_path" "$directory_path"

echo "Files concatenated successfully. Output file: $output_file"
