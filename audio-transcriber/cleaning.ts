import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface TranscriptLine {
  timestamp: string;
  speaker: string;
  text: string;
}

const makeCleaningPrompt = (
  text: string,
) => `You are a professional transcription editor. Make only the minimum changes needed for clarity and correctness.

Rules — follow every item:

1. Delete non-lexical fillers: "um," "uh," "er," "you know," "so" (when meaningless), "kinda," "sort of," "stuff," "maybe," and "like" when it is filler.  
   • A “filler like” is one that precedes a noun/verb phrase and can be removed without altering meaning.  
   • Keep “like” when it introduces a comparison (“like a sports car”) or means “such as.”

2. Remove immediate word repetitions that add no meaning ("I—I think," "the the").

3. Fix grammar, capitalization, and punctuation.  
   • Expand casual contractions (“cause” → “because,” “gonna” → “going to”).  
   • Repair fragments/run-ons. Split or join sentences as needed.  
   • When “like” introduces reported speech, replace it with “said” and put the quote in double quotes.

4. Correct obvious mis-recognitions. Replace nonsense words with the most plausible term, or append “[sic]” if unsure.

5. Keep existing line breaks; if a single speaker’s block exceeds three sentences, insert an extra blank line at a natural pause.

6. Do **not** add, delete, or reorder substantive content beyond these rules.

7. Output only the cleaned transcript—no commentary, no explanation.

Transcript to clean:
\`\`\`
${text}
\`\`\``;

export function parseTranscriptLine(line: string): TranscriptLine | null {
  // Match pattern: [timestamp] **Speaker X**: text
  const match = line.match(/^\[([^\]]+)\]\s*\*\*Speaker\s*([^*]+)\*\*:\s*(.*)$/);
  if (!match) return null;

  return {
    timestamp: match[1],
    speaker: match[2],
    text: match[3],
  };
}

async function cleanText(text: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: makeCleaningPrompt(text),
        },
      ],
    });

    const cleaned = response.choices[0].message.content?.trim() ?? text;
    // Remove any backticks that might be in the response
    return cleaned
      .replace(/^```\n?/, "")
      .replace(/\n?```$/, "")
      .trim();
  } catch (error) {
    console.error("Error cleaning text:", error);
    return text; // Return original text if cleaning fails
  }
}

export async function cleanTranscript(transcript: string): Promise<string> {
  console.log("🧹 Cleaning transcript with AI...");

  // Split transcript into lines
  const lines = transcript.split("\n\n").filter((line) => line.trim());

  // Parse lines into structured data
  const parsedLines = lines.map((line) => ({
    original: line,
    parsed: parseTranscriptLine(line),
  }));

  // Process in batches for parallel execution
  const BATCH_SIZE = 20;
  const cleanedLines: string[] = [];

  for (let i = 0; i < parsedLines.length; i += BATCH_SIZE) {
    const batch = parsedLines.slice(i, i + BATCH_SIZE);
    console.log(
      `  Cleaning batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(parsedLines.length / BATCH_SIZE)}...`,
    );

    // Process batch in parallel
    const cleanedBatch = await Promise.all(
      batch.map(async ({ original, parsed }) => {
        if (!parsed) return original; // Return original if parsing failed

        // Clean the text content
        const cleanedText = await cleanText(parsed.text);

        // Reassemble the line with original metadata
        return `[${parsed.timestamp}] **Speaker ${parsed.speaker}**: ${cleanedText}`;
      }),
    );

    cleanedLines.push(...cleanedBatch);
  }

  return cleanedLines.join("\n\n");
}
