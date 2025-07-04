import * as dotenv from "dotenv";
dotenv.config();

import Parser from "rss-parser";
import { MAX_DAYS_OLD, POSITIVE_THRESHOLD, POSITIVE_KEYWORDS, NEGATIVE_KEYWORDS, RSS_FEEDS, POSTED_LINKS_FILE, RECENT_KEYWORDS_FILE } from "./config";
import { normalizeTitle, adjustedSentiment, loadListFromFile, saveListToFile } from "./utils";
import axios from "axios";

const parser = new Parser();

interface FeedEntry {
  title: string;
  link: string;
  pubDate?: string;
  [key: string]: any;
}

async function fetchRecentPositiveHeadlines(): Promise<{ entry: FeedEntry; keywords: string[] }[]> {
  const allEntries: FeedEntry[] = [];

  for (const feedUrl of RSS_FEEDS) {
    try {
      const feed = await parser.parseURL(feedUrl);
      allEntries.push(...feed.items);
    } catch (err) {
      console.error(`Failed to fetch RSS feed ${feedUrl}:`, err);
    }
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - MAX_DAYS_OLD);

  // Filter and score entries
  const filtered = allEntries.filter(entry => {
    if (!entry.pubDate) return false;
    const pubDate = new Date(entry.pubDate);
    if (pubDate < cutoffDate) return false;

    const sentimentScore = adjustedSentiment(entry.title, NEGATIVE_KEYWORDS);
    if (sentimentScore < POSITIVE_THRESHOLD) return false;

    const keywordsInTitle = POSITIVE_KEYWORDS.filter(k => entry.title.toLowerCase().includes(k));
    if (keywordsInTitle.length === 0) return false;

    return true;
  });

  return filtered.map(entry => ({
    entry,
    keywords: POSITIVE_KEYWORDS.filter(k => entry.title.toLowerCase().includes(k)),
  }));
}

async function postToBluesky(title: string, url: string): Promise<void> {
  const handle = process.env.BLUESKY_HANDLE;
  const appPassword = process.env.BLUESKY_APP_PASSWORD;

  if (!handle || !appPassword) {
    throw new Error("BLUESKY_HANDLE or BLUESKY_APP_PASSWORD environment variables not set");
  }

  // TODO: Use official atproto client if available, else custom axios calls to Bluesky API

  // Example placeholder logic:
  console.log(`Posting to Bluesky: ${title} - ${url}`);
  // Here you would authenticate and post with the Bluesky API client.
}

async function main() {
  const postedLinks = await loadListFromFile(POSTED_LINKS_FILE);
  const recentKeywords = await loadListFromFile(RECENT_KEYWORDS_FILE);

  const positiveArticles = await fetchRecentPositiveHeadlines();

  // Filter out duplicates and recently posted keywords
  const candidates = positiveArticles.filter(({ entry, keywords }) => {
    const normalizedTitle = normalizeTitle(entry.title);
    if (postedLinks.includes(normalizedTitle)) return false;

    for (const kw of keywords) {
      if (recentKeywords.includes(kw)) return false;
    }

    return true;
  });

  if (candidates.length === 0) {
    console.log("No new positive articles found to post.");
    return;
  }

  // Pick one at random
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  const title = chosen.entry.title.length > 256 ? chosen.entry.title.slice(0, 253) + "..." : chosen.entry.title;
  const url = chosen.entry.link;

  try {
    await postToBluesky(title, url);

    // Update tracking files
    postedLinks.push(normalizeTitle(chosen.entry.title));
    await saveListToFile(postedLinks.slice(-MAX_POSTED_LINKS), POSTED_LINKS_FILE);

    // Add new keywords to recent keywords list (keep last 20 for example)
    recentKeywords.push(...chosen.keywords);
    await saveListToFile(recentKeywords.slice(-20), RECENT_KEYWORDS_FILE);

    console.log("Successfully posted to Bluesky:", title);
  } catch (err) {
    console.error("Failed to post to Bluesky:", err);
  }
}

main().catch(console.error);
