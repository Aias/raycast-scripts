import clipboardy from "clipboardy";
import markdownpdf from "markdown-pdf";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputFilename = process.argv[2] || "Clipboard Content";

function getCurrentFinderPath() {
  try {
    const script =
      'tell application "Finder" to POSIX path of (insertion location as alias)';
    return execSync(`osascript -e '${script}'`).toString().trim();
  } catch (error) {
    return null;
  }
}

function getOutputPath() {
  const finderPath = getCurrentFinderPath();
  if (finderPath) {
    return path.join(finderPath, `${outputFilename}.pdf`);
  }
  const outputDir = path.join(__dirname, "output");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  return path.join(outputDir, `${outputFilename}.pdf`);
}

async function main() {
  try {
    const clipboardContent = clipboardy.readSync();

    if (!clipboardContent || clipboardContent.trim() === "") {
      throw new Error("Clipboard is empty or contains invalid content.");
    }

    const outputPath = getOutputPath();

    await new Promise((resolve, reject) => {
      markdownpdf()
        .from.string(clipboardContent)
        .to(outputPath, (err) => {
          if (err) reject(err);
          else resolve();
        });
    });

    console.log(`PDF created successfully: ${outputPath}`);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
