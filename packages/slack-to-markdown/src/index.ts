interface Message {
	name: string;
	time: string;
	messages: string[];
}

const emojiMap: Record<string, string> = {
	':eyes:': '👀',
	':smile:': '😊',
	':thumbsup:': '👍',
	':thumbsdown:': '👎',
	':heart:': '❤️',
	':fire:': '🔥',
	':rocket:': '🚀',
	':thinking:': '🤔',
	':joy:': '😂',
	':sob:': '😭',
	':pray:': '🙏',
	':clap:': '👏',
	':wave:': '👋',
	':ok_hand:': '👌',
	':+1:': '👍',
	':-1:': '👎',
};

function replaceEmojis(text: string): string {
	let result = text;
	for (const [code, emoji] of Object.entries(emojiMap)) {
		result = result.replace(new RegExp(code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), emoji);
	}
	return result;
}

function parseSlackText(text: string): Message[] {
	const lines = text
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line);
	const messages: Message[] = [];
	let i = 0;
	const orphanedLines: string[] = [];

	// Collect any initial lines that don't have a proper name/timestamp format
	while (i < lines.length) {
		if (i + 1 >= lines.length) {
			orphanedLines.push(lines[i]);
			i++;
			continue;
		}

		const nextLine = lines[i + 1];
		const hasTimestamp = nextLine.match(/^(:?\w+:?\s+)?\[?\d{1,2}:\d{2}\s*(?:AM|PM)/i);

		if (hasTimestamp) {
			break; // Found a proper message start
		}

		orphanedLines.push(lines[i]);
		i++;
	}

	// If we have orphaned lines, add them as a message without name/time
	if (orphanedLines.length > 0) {
		messages.push({
			name: '',
			time: '',
			messages: orphanedLines,
		});
	}

	while (i < lines.length) {
		const nameLine = lines[i];
		if (!nameLine || i + 1 >= lines.length) {
			i++;
			continue;
		}

		// Check if this could be a name line followed by a time
		const nextLine = lines[i + 1];
		let timeMatch = nextLine.match(/^:?\w+:?\s+(\d{1,2}:\d{2}\s*(?:AM|PM))/i);

		if (!timeMatch) {
			// Try standard time format
			timeMatch = nextLine.match(/^\[?(\d{1,2}:\d{2}\s*(?:AM|PM))\]?/i);
		}

		if (!timeMatch) {
			i++;
			continue;
		}

		const name = replaceEmojis(nameLine).trim();
		const time = timeMatch[1].trim();
		const messageLines: string[] = [];

		i += 2;

		while (i < lines.length) {
			const nextLine = lines[i];

			if (i + 1 < lines.length) {
				const nextNextLine = lines[i + 1];
				// Check for both standard time format and emoji:time format
				const isNextMessageStart = nextNextLine.match(
					/^(:?\w+:?\s+)?\[?\d{1,2}:\d{2}\s*(?:AM|PM)/i,
				);

				if (isNextMessageStart && !nextLine.includes(':')) {
					break;
				}
			}

			// Skip standalone timestamps and other noise
			if (nextLine.match(/^\d{1,2}:\d{2}$/)) {
				i++;
				continue;
			}

			if (nextLine !== 'New' && !nextLine.match(/^\(edited\)$/i)) {
				// Handle image attachments by wrapping in markdown image syntax
				if (nextLine.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
					messageLines.push(`![${nextLine}](${nextLine})`);
				} else {
					messageLines.push(nextLine);
				}
			}
			i++;
		}

		if (messageLines.length > 0) {
			const lastMessage = messages[messages.length - 1];
			if (lastMessage && lastMessage.name === name && lastMessage.time === time) {
				lastMessage.messages.push(...messageLines);
			} else {
				messages.push({
					name,
					time,
					messages: messageLines,
				});
			}
		}
	}

	return messages;
}

function convertToMarkdown(messages: Message[]): string {
	return messages
		.map(({ name, time, messages }) => {
			if (!name && !time) {
				// For orphaned messages, just output the content
				return messages.join('\n\n');
			}
			const header = `[${time}] **${name}**`;
			const content = messages.join('\n\n');
			return `${header}\n${content}`;
		})
		.join('\n\n');
}

async function getStdinContent(): Promise<string> {
	const chunks: Buffer[] = [];

	for await (const chunk of process.stdin) {
		chunks.push(chunk as Buffer);
	}

	return Buffer.concat(chunks).toString('utf-8');
}

async function main() {
	const inputContent = await getStdinContent();

	if (!inputContent.trim()) {
		console.error('No input provided.');
		process.exit(1);
	}

	const messages = parseSlackText(inputContent);

	if (messages.length === 0) {
		console.error('No valid Slack messages found in input.');
		process.exit(1);
	}

	const markdown = convertToMarkdown(messages);

	// Output the markdown to stdout
	console.log(markdown);
}

void main();
