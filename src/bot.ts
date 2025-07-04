// src/bot.ts

import * as dotenv from "dotenv";
dotenv.config();

import Parser from "rss-parser";
import {
  loadListFromFile,
  saveListToFile,
  normalizeTitle,
  adjustedSentiment,
} from "./utils";

import { AtpAgent } from "@atproto/api";

const parser = new Parser();

const MAX_DAYS_OLD = 14;
const POSITIVE_THRESHOLD = 0.1;
const MAX_POSTED_LINKS = 50;

const POSITIVE_KEYWORDS = [
  "win",
  "victory",
  "gains",
  "success",
  "growth",
  "solidarity",
  "organize",
  "strike",
  "socialist",
  "left wing",
  "union",
  "responsibility",
  "mobilize",
  "charity",
  "outreach",
  "resistance",
  "community",
  "truth",
  "celebrate",
  "local",
  "save",
  "future",
  "knock",
  "knocks",
  "healing",
  "hope",
  "love",
  "progressive",
  "champion",
  "leader",
  "ceasefire",
];

const NEGATIVE_KEYWORDS = [
  "death",
  "deadly",
  "killed",
  "kill",
  "killing",
  "violence",
  "attack",
  "crisis",
  "disaster",
  "scandal",
  "accident",
  "injured",
  "tragedy",
  "fraud",
  "collapse",
  "bomb",
  "shooting",
  "war",
  "loser",
  "awful",
  "horrible",
  "terrible",
  "tragic",
  "destroy",
  "raiding",
  "raid",
  "gut",
  "fear",
  "broken",
  "destruction",
];

const RSS_FEEDS = [
  "https://jacobin.com/feed",
  "https://www.dsausa.org/feed/",
  "https://www.thenation.com/feed/?post_type=article",
  "https://inthesetimes.com/rss/articles",
  "https://www.commondreams.org/rss-feed",
  "https://truthout.org/feed/",
  "https://progressive.org/feed/",
  "https://theintercept.com/feed/",
  "https://commonwealthclub.org/feed/podcast",
  "https://www.theguardian.com/us-news/us-politics/rss",
  "https://www.truthdig.com/feed/",
  "https://www.counterpunch.org/feed/",
  "https://www.democracynow.org/democracynow.rss",
  "https://therealnews.com/feed/",
  "https://labornotes.org/rss.xml",
  "https://shadowproof.com/feed/",
  "https://popularresistance.org/feed/",
  "https://wagingnonviolence.org/feed/",
  "https://www.leftvoice.org/feed/",
];

const POSTED_LINKS_FILE = "data/posted_links.txt";
const RECENT_KEYWORDS_FILE = "data/recent_keywords.txt";

interface FeedEntry {
  title: string;
  link: string;
  pubDate?: string;
  [key: string]: any;
}

async function fetchRecentPositiveHeadlines(): Promise<
  { entry: FeedEntry; keywords: string[] }[]
> {
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
  const filtered = allEntries.filter((entry) => {
    if (!entry.pubDate) return false;
    const pubDate = new Date(entry.pubDate);
    if (pubDate < cutoffDate) return false;

    const sentimentScore = adjustedSentiment(entry.title, NEGATIVE_KEYWORDS);
    if (sentimentScore < POSITIVE_THRESHOLD) return false;

    const keywordsInTitle = POSITIVE_KEYWORDS.filter((k) =>
      entry.title.toLowerCase().includes(k)
    );
    if (keywordsInTitle.length === 0) return false;

    return true;
  });

  return filtered.map((entry) => ({
    entry,
    keywords: POSITIVE_KEYWORDS.filter((k) =>
      entry.title.toLowerCase().includes(k)
    ),
  }));
}

async function postToBluesky(title: string, url: string): Promise<void> {
  const handle = process.env.BLUESKY_HANDLE;
  const appPassword = process.env.BLUESKY_APP_PASSWORD;

  if (!handle || !appPassword) {
    throw new Error(
      "BLUESKY_HANDLE or BLUESKY_APP_PASSWORD environment variables not set"
    );
  }

  const agent = new AtpAgent({ service: "https://bsky.social" });

  try {
    // Authenticate
    await agent.login({ identifier: handle, password: appPassword });

    // Compose post content
    const content = `${title}\n\n${url}`;

    // Post to Bluesky
    await agent.post({ text: content });

    console.log("Posted to Bluesky successfully:", title);
  } catch (err) {
    console.error("Error posting to Bluesky:", err);
    throw err;
  }
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
  const title =
    chosen.entry.title.length > 256
      ? chosen.entry.title.slice(0, 253) + "..."
      : chosen.entry.title;
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
