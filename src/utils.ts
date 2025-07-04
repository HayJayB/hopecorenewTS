import fs from "fs-extra";
import path from "path";
import Sentiment from "sentiment";

const sentiment = new Sentiment();

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .trim();
}

export function adjustedSentiment(text: string, negativeKeywords: string[]): number {
  let result = sentiment.analyze(text);
  let score = result.comparative;

  for (const negWord of negativeKeywords) {
    if (text.toLowerCase().includes(negWord)) {
      score -= 0.1; // penalty for negative keywords
    }
  }

  return score;
}

export async function loadListFromFile(filename: string): Promise<string[]> {
  try {
    const exists = await fs.pathExists(filename);
    if (!exists) return [];
    const data = await fs.readFile(filename, "utf8");
    return data.split("\n").map(line => line.trim()).filter(line => line.length > 0);
  } catch (err) {
    console.error(`Error reading file ${filename}:`, err);
    return [];
  }
}

export async function saveListToFile(lst: string[], filename: string): Promise<void> {
  try {
    await fs.ensureFile(filename);
    await fs.writeFile(filename, lst.join("\n"), "utf8");
  } catch (err) {
    console.error(`Error writing file ${filename}:`, err);
  }
}
