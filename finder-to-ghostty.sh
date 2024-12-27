#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Finder -> Ghostty
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 👻

# Documentation:
# @raycast.description Opens the currently selected Finder window in the Ghostty terminal emulator.
# @raycast.author Aias
# @raycast.authorURL https://raycast.com/Aias

open -a Ghostty "$FINDER_PATH"