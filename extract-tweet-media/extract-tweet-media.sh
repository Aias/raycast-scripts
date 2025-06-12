#!/bin/bash

set -e

# Parse tweet URL
TWEET_URL="$1"

# Validate URL
if [[ ! "$TWEET_URL" =~ ^https://(twitter\.com|x\.com)/[^/]+/status/[0-9]+$ ]]; then
    echo "Error: Invalid tweet URL. Expected format: https://x.com/username/status/1234567890"
    exit 1
fi

# Extract username and tweet ID from URL
USERNAME=$(echo "$TWEET_URL" | sed -E 's|https://(twitter\.com\|x\.com)/([^/]+)/status/[0-9]+|\2|')
TWEET_ID=$(echo "$TWEET_URL" | sed -E 's|https://(twitter\.com\|x\.com)/[^/]+/status/([0-9]+)|\2|')

# Get current date for filename
DATE_PREFIX=$(date +"%Y-%m-%d")

echo "Extracting media from tweet..."
echo "Username: $USERNAME"
echo "Tweet ID: $TWEET_ID"

# Check if yt-dlp is installed
if ! command -v yt-dlp &> /dev/null; then
    echo "Error: yt-dlp is not installed. Install it with: brew install yt-dlp"
    exit 1
fi

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is not installed. Install it with: brew install ffmpeg"
    exit 1
fi

# Check if gallery-dl is installed (for image fallback)
HAS_GALLERY_DL=false
if command -v gallery-dl &> /dev/null; then
    HAS_GALLERY_DL=true
fi

# Create temporary file for tweet metadata
TEMP_FILE=$(mktemp)

# Get tweet metadata (including text) using yt-dlp
echo "Fetching tweet metadata..."
if ! yt-dlp --skip-download --print "%(title)s" "$TWEET_URL" > "$TEMP_FILE" 2>&1; then
    echo "Warning: Could not fetch tweet metadata with yt-dlp"
    echo "yt-dlp output:"
    cat "$TEMP_FILE"
    # Don't exit - continue anyway with a default text
    echo "Tweet" > "$TEMP_FILE"
fi

# Read tweet text
TWEET_TEXT=$(cat "$TEMP_FILE")
rm -f "$TEMP_FILE"

# Clean up tweet text for folder name (first 30 chars, alphanumeric only)
TWEET_TEXT_CLEAN=$(echo "$TWEET_TEXT" | sed 's/[^a-zA-Z0-9 ]//g' | tr '[:upper:]' '[:lower:]' | tr -s ' ' '-' | cut -c1-30 | sed 's/-$//')

# Create timestamp
TIMESTAMP=$(date +"%Y-%m-%d-%H%M%S")

# Create folder name
FOLDER_NAME="$TIMESTAMP-$USERNAME-$TWEET_TEXT_CLEAN"
DOWNLOAD_PATH="$HOME/Downloads/$FOLDER_NAME"

# Create directory
mkdir -p "$DOWNLOAD_PATH"
echo "Created folder: $DOWNLOAD_PATH"

# Download media using yt-dlp
echo "Downloading media..."
cd "$DOWNLOAD_PATH"

# Create a custom filename cleaning function
clean_filename() {
    echo "$1" | \
        sed 's/[^a-zA-Z0-9 ]//g' | \
        tr '[:upper:]' '[:lower:]' | \
        tr -s ' ' '-' | \
        sed 's/^-//;s/-$//' | \
        cut -c1-72
}

# Try yt-dlp first (for videos)
echo ""
echo "Step 1: Attempting to download videos with yt-dlp..."
YTDLP_SUCCESS=false
if yt-dlp \
    --write-info-json \
    --write-description \
    --no-playlist \
    -o "tweet-%(id)s-video-%(autonumber)s.%(ext)s" \
    "$TWEET_URL" 2>&1 | tee download.log; then
    YTDLP_SUCCESS=true
    echo "✓ Video download completed"
else
    # Check if it failed because there's no video
    if grep -q "No video could be found in this tweet" download.log; then
        echo "→ No videos found in this tweet (this is normal for image-only tweets)"
    else
        echo "→ yt-dlp encountered an error (check download.log for details)"
    fi
fi

# Count videos downloaded
VIDEO_COUNT=$(find . -name "*.mp4" -o -name "*.webm" 2>/dev/null | wc -l | tr -d ' ')
echo "→ Videos downloaded: $VIDEO_COUNT"

# Try to get tweet text from info.json if it exists
TWEET_TEXT_FROM_JSON="$TWEET_TEXT"
INFO_FILE=$(find . -name "*${TWEET_ID}*.info.json" 2>/dev/null | head -1)
if [ -n "$INFO_FILE" ] && [ -f "$INFO_FILE" ]; then
    # Extract description (tweet text) from JSON, which doesn't include author name
    TWEET_TEXT_FROM_JSON=$(python3 -c "
import json
import re
with open('$INFO_FILE', 'r') as f:
    data = json.load(f)
    # Get description which is the actual tweet text
    text = data.get('description', '')
    # If description is empty, try to extract from title by removing author part
    if not text and 'title' in data:
        title = data.get('title', '')
        # Remove 'Display Name (@username) on X: ' pattern
        text = re.sub(r'^[^:]+:\s*', '', title)
    print(text)
" 2>/dev/null || echo "")
fi

# Always try gallery-dl if available (for images)
if [ "$HAS_GALLERY_DL" = true ]; then
    echo ""
    echo "Step 2: Attempting to download images with gallery-dl..."
    
    # Count images before
    IMAGES_BEFORE=$(find . -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" \) 2>/dev/null | wc -l | tr -d ' ')
    
    # Use gallery-dl with appropriate settings
    echo "→ Running gallery-dl..."
    gallery-dl \
        --directory . \
        --filename "tweet-${TWEET_ID}-image-{num}.{extension}" \
        "$TWEET_URL" 2>&1 | tee -a download.log || true
    
    # gallery-dl might create subdirectories, let's flatten the structure
    echo "→ Checking for nested directories..."
    NESTED_FILES=$(find . -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" \) -mindepth 2 2>/dev/null | wc -l | tr -d ' ')
    if [ "$NESTED_FILES" -gt "0" ]; then
        echo "→ Moving $NESTED_FILES files from subdirectories..."
        find . -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" \) -mindepth 2 2>/dev/null | while read -r file; do
            basename=$(basename "$file")
            mv "$file" "./" 2>/dev/null || true
        done
        
        # Clean up empty directories
        find . -type d -mindepth 1 -empty -delete 2>/dev/null || true
    fi
    
    # Count images after
    IMAGES_AFTER=$(find . -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" \) 2>/dev/null | wc -l | tr -d ' ')
    IMAGES_DOWNLOADED=$((IMAGES_AFTER - IMAGES_BEFORE))
    
    echo "→ Images downloaded: $IMAGES_DOWNLOADED"
    echo "✓ Image download completed"
else
    echo ""
    echo "Step 2: Skipping image download (gallery-dl not installed)"
    echo "To download images, install gallery-dl:"
    echo "  brew install gallery-dl"
fi

# Check total media count after both attempts
TOTAL_MEDIA_COUNT=$(find . -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" -o -name "*.mp4" -o -name "*.webm" \) 2>/dev/null | wc -l | tr -d ' ')

echo ""
echo "Step 3: Processing results..."
echo "→ Total media files found: $TOTAL_MEDIA_COUNT"

if [ "$TOTAL_MEDIA_COUNT" -gt "0" ]; then
    
    # Clean up filenames of downloaded media files with new format
    echo ""
    echo "Step 4: Renaming files..."
    
    # Add counter to make filenames unique
    FILE_NUM=1
    find . -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" -o -name "*.mp4" -o -name "*.webm" \) | sort | while read -r file; do
        dir=$(dirname "$file")
        filename=$(basename "$file")
        extension="${filename##*.}"
        
        echo "→ Processing: $filename"
        
        # Clean the tweet text for filename
        clean_text=$(clean_filename "$TWEET_TEXT_FROM_JSON")
        
        # Build new filename with counter: YYYY-MM-DD-username-text-id-N
        new_filename="${DATE_PREFIX}-${USERNAME}-${clean_text}-${TWEET_ID}-${FILE_NUM}.${extension}"
        
        # Ensure total filename doesn't exceed 72 chars (plus extension)
        if [ ${#new_filename} -gt 76 ]; then  # 72 + 4 for extension
            # Calculate how much to trim from the text part
            prefix_length=$((${#DATE_PREFIX} + 1 + ${#USERNAME} + 1))  # date-username-
            suffix_length=$((1 + ${#TWEET_ID} + 1 + ${#FILE_NUM} + 1 + ${#extension}))    # -id-N.ext
            max_text_length=$((72 - prefix_length - suffix_length))
            
            if [ $max_text_length -gt 0 ]; then
                clean_text=$(echo "$clean_text" | cut -c1-$max_text_length)
                new_filename="${DATE_PREFIX}-${USERNAME}-${clean_text}-${TWEET_ID}-${FILE_NUM}.${extension}"
            fi
        fi
        
        # Always rename to ensure unique names
        echo "  → Renaming to: $new_filename"
        if mv "$file" "$dir/$new_filename" 2>/dev/null; then
            echo "  → Success"
            FILE_NUM=$((FILE_NUM + 1))
        else
            echo "  → Failed to rename"
        fi
    done
    
    # Recount all media files after renaming
    FINAL_MEDIA_COUNT=$(find . -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" -o -name "*.mp4" -o -name "*.webm" \) | wc -l | tr -d ' ')
    
    if [ "$FINAL_MEDIA_COUNT" -eq "0" ]; then
        echo ""
        echo "❌ No media files found in this tweet."
        # Clean up empty folder
        cd ..
        rmdir "$FOLDER_NAME" 2>/dev/null || true
    else
        echo ""
        echo "✅ Successfully downloaded $FINAL_MEDIA_COUNT media file(s)"
        
        # Convert MP4 files to GIF
        MP4_COUNT=$(find . -name "*.mp4" | wc -l | tr -d ' ')
        if [ "$MP4_COUNT" -gt "0" ]; then
            echo ""
            echo "Converting $MP4_COUNT MP4 file(s) to GIF for better web preview support..."
            
            # Process each MP4 file
            find . -name "*.mp4" | while read -r mp4file; do
                # Get filename without extension
                basename_no_ext="${mp4file%.mp4}"
                giffile="${basename_no_ext}.gif"
                
                echo "Converting: $(basename "$mp4file") → $(basename "$giffile")"
                
                # Convert MP4 to GIF
                # -vf "fps=15,scale=480:-1:flags=lanczos" sets framerate to 15fps and width to 480px
                # -loop 0 makes it loop forever
                if ffmpeg -i "$mp4file" \
                    -vf "fps=15,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \
                    -loop 0 \
                    "$giffile" \
                    -y -loglevel warning 2>&1; then
                    echo "✓ Converted successfully"
                else
                    echo "✗ Failed to convert $(basename "$mp4file")"
                fi
            done
            
            echo ""
        fi
        
        # Final count of all media
        FINAL_TOTAL=$(find . -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" -o -name "*.mp4" -o -name "*.webm" \) | wc -l | tr -d ' ')
        echo "Total files: $FINAL_TOTAL"
        echo "Location: $DOWNLOAD_PATH"
        
        # Open folder in Finder
        open "$DOWNLOAD_PATH"
    fi
else
    echo ""
    echo "❌ No media could be downloaded from this tweet."
    # Clean up empty folder
    if [ -z "$(ls -A "$DOWNLOAD_PATH")" ]; then
        cd ..
        rmdir "$FOLDER_NAME" 2>/dev/null || true
    fi
fi