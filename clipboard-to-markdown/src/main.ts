#!/usr/bin/env node

// Required parameters:
// @raycast.schemaVersion 1
// @raycast.title Clipboard to Markdown
// @raycast.mode compact

// Optional parameters:
// @raycast.icon 🤖

// Documentation:
// @raycast.description Convert text that exists in the clipboard to markdown-formatted text
// @raycast.author Aias
// @raycast.authorURL https://raycast.com/Aias

import clipboard from "clipboardy";
import TurndownService from "turndown";

// Create an instance of the Turndown service
const turndownService = new TurndownService();

async function convertClipboardHtmlToMarkdown(): Promise<string | null> {
  try {
    // Read text from clipboard
    const clipboardContent: string = await clipboard.read();

    // Convert HTML to Markdown
    const markdown: string = turndownService.turndown(clipboardContent);

    // Output the Markdown content or copy it back to the clipboard
    console.log(markdown);
    await clipboard.write(markdown);

    return markdown;
  } catch (error) {
    console.error("Failed to convert:", error);
    return null;
  }
}

// Run the conversion function
convertClipboardHtmlToMarkdown();
