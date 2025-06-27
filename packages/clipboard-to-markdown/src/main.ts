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

import clipboard from 'clipboardy';
import TurndownService from 'turndown';
import { execSync } from 'child_process';

// Create an instance of the Turndown service
const turndownService = new TurndownService();

function hasHtmlInClipboard(): boolean {
	try {
		const info = execSync("osascript -e 'clipboard info'", { encoding: 'utf8' });
		if (info.toLowerCase().includes('html')) {
			return true;
		}
	} catch {
		// ignore and fall back to pbpaste
	}
	try {
		const html = execSync('pbpaste -Prefer html', { encoding: 'utf8' }).trim();
		return html.length > 0;
	} catch {
		return false;
	}
}

async function convertClipboardHtmlToMarkdown(): Promise<string | null> {
	try {
		let clipboardContent: string | null = null;

		if (hasHtmlInClipboard()) {
			try {
				clipboardContent = execSync('pbpaste -Prefer html', {
					encoding: 'utf8',
				});
			} catch {
				clipboardContent = await clipboard.read();
			}
		} else {
			console.log('No HTML content found in clipboard. Converting plain text.');
			clipboardContent = await clipboard.read();
		}

		if (!clipboardContent || clipboardContent.trim() === '') {
			console.log('Clipboard is empty. Nothing to convert.');
			return null;
		}

		const markdown: string = turndownService.turndown(clipboardContent);

		console.log(markdown);
		await clipboard.write(markdown);

		return markdown;
	} catch (error) {
		console.error('Failed to convert:', error);
		return null;
	}
}

// Run the conversion function
convertClipboardHtmlToMarkdown();
