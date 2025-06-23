# clipboard-to-markdown

Converts HTML in your clipboard into Markdown. The script now checks if the
clipboard actually contains `text/html` data using macOS clipboard commands.
If no HTML is detected, the plain text from the clipboard is converted instead
and a message is shown.
