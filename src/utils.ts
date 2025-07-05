import fs from "fs/promises";

/**
 * Normalize title by lowercasing and removing punctuation and whitespace
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]|_/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Adjusted sentiment: calculate polarity and penalize presence of negative keywords
 */
export function adjustedSentiment(
  text: string,
  negativeKeywords: string[]
): number {
  const Sentiment = (await import("sentiment")).default;
  const sentiment = new Sentiment();
  const result = sentiment.analyze(text);
  let score = result.score;

  for (const neg of negativeKeywords) {
    if (text.toLowerCase().includes(neg)) {
      score -= 2; // penalty per negative keyword
    }
  }

  return score;
}

/**
 * Load lines from a file, ignoring empty lines
 */
export async function loadListFromFile(filename: string): Promise<string[]> {
  try {
    console.log(`Loading file: ${filename}`);
    const data = await fs.readFile(filename, "utf-8");
    return data
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);
  } catch (err) {
    console.warn(`File not found or could not be read: ${filename}`);
    return [];
  }
}

/**
 * Save list of strings to a file (one per line)
 */
export async function saveListToFile(
  list: string[],
  filename: string
): Promise<void> {
  try {
    console.log(`Saving to file: ${filename}`);
    const data = list.join("\n") + "\n";
    await fs.writeFile(filename, data, "utf-8");
  } catch (err) {
    console.error(`Failed to write file: ${filename}`, err);
  }
}
