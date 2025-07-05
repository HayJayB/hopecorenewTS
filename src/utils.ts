import fs from "fs/promises";
import Sentiment from "sentiment";

const sentiment = new Sentiment();

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
export function adjustedSentiment(text: string, negativeKeywords: string[]): number {
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
      .map(line => line.trim())
      .filter(line => line.length > 0);
  } catch (err) {
    console.warn(`File not found or unreadable: ${filename}`);
    return [];
  }
}

/**
 * Save list of strings to a file (one per line)
 */
export async function saveListToFile(list: string[], filename: string): Promise<void> {
  try {
    console.log(`Saving to file: ${filename}`);
    await fs.writeFile(filename, list.join("\n") + "\n", "utf-8");
  } catch (err) {
    console.error(`Failed to write file: ${filename}`, err);
  }
}
