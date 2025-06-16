# Common utility functions for Raycast wrappers

# Load either ~/.zshrc or ~/.bashrc so that environment variables are available
load_shell_config() {
    if [ -f "$HOME/.zshrc" ]; then
        # shellcheck source=/dev/null
        . "$HOME/.zshrc"
    elif [ -f "$HOME/.bashrc" ]; then
        # shellcheck source=/dev/null
        . "$HOME/.bashrc"
    else
        echo "Warning: No shell configuration file found (expected ~/.zshrc or ~/.bashrc)" >&2
    fi
}

# Set SCRIPT_DIR to the absolute directory of the provided script path
# $1 - path to the calling script (usually "$0")
set_script_dir() {
    local script_path="$1"
    SCRIPT_DIR="$(dirname "$(realpath "$script_path")")"
}

# Get the currently selected file(s) in Finder
# Returns the paths of selected files, one per line
# If no files are selected, returns empty
get_finder_selection() {
    osascript -e 'tell application "Finder"
        set selectedItems to selection
        if (count of selectedItems) > 0 then
            set pathList to ""
            repeat with anItem in selectedItems
                set pathList to pathList & POSIX path of (anItem as alias) & linefeed
            end repeat
            return text 1 thru -2 of pathList
        else
            return ""
        end if
    end tell' 2>/dev/null
}

