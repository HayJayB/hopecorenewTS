import fs from "fs/promises";
import path from "path";
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
export function adjustedSentiment(
  text: string,
  negativeKeywords: string[]
): number {
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
    const filePath = path.resolve(filename);
    const data = await fs.readFile(filePath, "utf-8");
    return data
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);
  } catch {
    // File doesn't exist, return empty list
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
  const filePath = path.resolve(filename);
  const data = list.join("\n") + "\n";
  await fs.writeFile(filePath, data, "utf-8");
}
