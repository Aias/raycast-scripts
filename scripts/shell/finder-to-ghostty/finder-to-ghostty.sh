#!/bin/bash

if [ -z "$FINDER_PATH" ]; then
  echo "Error: FINDER_PATH environment variable is not set." >&2
  exit 1
fi

if ! open -a Ghostty "$FINDER_PATH"; then
  echo "Failed to open Ghostty. Ensure Ghostty is installed and accessible." >&2
  exit 1
fi
