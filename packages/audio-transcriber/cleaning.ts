import { formatTimestamp } from './utils.js';
import { type TranscriptionResult } from './transcription.js';
import {
	getCustomSpellings,
	getKeyTerms,
	getKnownSpeakers,
} from './transcription.config.loader.js';
import { formatSpeakerName, type SpeakerMap } from './speaker-identification.js';
import { processWithPool } from './concurrency.js';
import { MODELS, openai } from './openai.js';

// Sentences per request. Large enough that a meeting is tens of requests rather
// than hundreds; small enough that a failure costs one passage, not the file.
const SENTENCES_PER_GROUP = 40;
const CONCURRENCY = 10;

// Trailing characters of the preceding group carried in as context, so a passage
// that opens mid-thought still resolves.
const CONTEXT_CHARS = 500;

// Groups the cache prefix by task so repeated runs land on the same machine.
const CACHE_KEY = 'audio-transcriber:cleaning';

/**
 * Everything static across a run goes in the system message so it forms a
 * cacheable prefix; only the passage and its context vary per request.
 */
const makeSystemPrompt = (vocabulary: string[]) =>
	`You are a transcription editor working on speech-to-text output. You cannot hear the audio, so you must never guess at what was said.

Apply exactly these edits:

1. Delete non-lexical fillers: "um", "uh", "er", "mm", and "like", "you know", "I mean" where they carry no meaning. Keep "like" when it introduces a comparison ("like a sports car") or means "such as".
2. Delete stutters, false starts, and immediate repetitions that carry no meaning ("I— I think", "the the").
3. Add or correct punctuation, capitalization, and sentence boundaries.
4. Correct a word only when it is a misrecognition of a term on the vocabulary list below. Leave every other word exactly as transcribed, even where it reads oddly — an odd transcription is evidence, a plausible substitute is invention.
5. Preserve the wording otherwise. Do not expand contractions, repair grammar, reorder clauses, paraphrase, summarize, add content, or drop content.
6. Split a passage into paragraphs at natural pauses when it runs longer than about three sentences.

Return only the edited passage. No commentary, no code fences.

Vocabulary — the correct spelling of every term below must be preserved exactly:
${vocabulary.join(', ')}`;

const makeUserPrompt = (context: string, text: string) =>
	context
		? `Preceding passage, for context only — do not edit or return it:
"""
…${context}
"""

Passage to edit:
"""
${text}
"""`
		: `Passage to edit:
"""
${text}
"""`;

export interface CleanedGroup {
	speaker: string;
	start: number;
	text: string;
}

function groupSentences(
	sentences: { speaker: string | null; start: number; text: string }[],
	maxSentences: number,
): CleanedGroup[] {
	if (sentences.length === 0) return [];

	const groups: CleanedGroup[] = [];
	let speaker = sentences[0].speaker ?? 'A';
	let start = sentences[0].start;
	let chunk: string[] = [];

	const flush = () => {
		if (chunk.length > 0) {
			groups.push({ speaker, start, text: chunk.join(' ') });
			chunk = [];
		}
	};

	for (const sentence of sentences) {
		// A sentence with no speaker continues the current one.
		const sentenceSpeaker = sentence.speaker ?? speaker;

		if (sentenceSpeaker !== speaker || chunk.length >= maxSentences) {
			flush();
			speaker = sentenceSpeaker;
			start = sentence.start;
		}

		chunk.push(sentence.text.trim());
	}
	flush();

	return groups;
}

async function cleanGroup(
	group: CleanedGroup,
	context: string,
	systemPrompt: string,
): Promise<CleanedGroup> {
	const response = await openai.chat.completions.create({
		model: MODELS.mechanical,
		reasoning_effort: 'none',
		prompt_cache_key: CACHE_KEY,
		messages: [
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: makeUserPrompt(context, group.text) },
		],
	});

	const cleaned = response.choices[0].message.content?.trim();
	if (!cleaned) return group;

	return {
		...group,
		text: cleaned
			.replace(/^"""\n?/, '')
			.replace(/\n?"""$/, '')
			.trim(),
	};
}

/**
 * Edit the transcript passage by passage. Speaker names are applied later by
 * `renderTranscript`, so this runs without waiting on speaker identification.
 */
export async function cleanTranscript(
	transcriptionResult: TranscriptionResult,
): Promise<CleanedGroup[]> {
	console.log('🧹 Cleaning transcript with AI...');
	const sentences = transcriptionResult.sentences?.sentences;

	if (!sentences || sentences.length === 0) {
		console.log('  No sentence data found');
		const text = transcriptionResult.transcript.text;
		return text ? [{ speaker: 'A', start: 0, text }] : [];
	}

	console.log(`  Found ${sentences.length} sentences to clean`);

	const [customSpellings, keyTerms, knownSpeakers] = await Promise.all([
		getCustomSpellings(),
		getKeyTerms(),
		getKnownSpeakers(),
	]);

	const vocabulary = new Set<string>(knownSpeakers.map((s) => s.name));
	for (const spelling of customSpellings) {
		vocabulary.add(spelling.to);
	}
	keyTerms.forEach((term) => vocabulary.add(term));

	const systemPrompt = makeSystemPrompt(Array.from(vocabulary));
	const groups = groupSentences(sentences, SENTENCES_PER_GROUP);
	console.log(
		`  Created ${groups.length} groups for cleaning (parallel, concurrency=${CONCURRENCY})`,
	);

	return processWithPool(
		groups,
		async (group, index) => {
			const previous = groups[index - 1];
			const context = previous ? previous.text.slice(-CONTEXT_CHARS) : '';
			return cleanGroup(group, context, systemPrompt);
		},
		{
			concurrency: CONCURRENCY,
			fallback: (group) => group,
			onProgress: (completed, total) => {
				if (completed % 10 === 0 || completed === total) {
					console.log(`    Cleaned ${completed}/${total} groups`);
				}
			},
		},
	);
}

export function renderTranscript(groups: CleanedGroup[], speakerMap: SpeakerMap): string {
	// Distinct diarization labels can resolve to one person, so adjacent blocks
	// are joined under a single heading rather than repeating the name.
	const blocks: { speaker: string; start: number; text: string }[] = [];
	for (const group of groups) {
		const speaker = formatSpeakerName(group.speaker, speakerMap);
		const previous = blocks.at(-1);
		if (previous?.speaker === speaker) {
			previous.text += ` ${group.text}`;
		} else {
			blocks.push({ speaker, start: group.start, text: group.text });
		}
	}

	return blocks
		.map((block) => `[${formatTimestamp(block.start)}] **${block.speaker}**: ${block.text}`)
		.join('\n\n');
}
