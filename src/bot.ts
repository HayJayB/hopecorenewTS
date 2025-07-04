import * as dotenv from "dotenv";
dotenv.config();

import Parser from "rss-parser";
import {
  loadListFromFile,
  saveListToFile,
  normalizeTitle,
  adjustedSentiment,
} from "./utils";

import { BskyAgent } from "@atproto/api";
import {
  MAX_DAYS_OLD,
  MAX_POSTED_LINKS,
  POSITIVE_THRESHOLD,
  POSITIVE_KEYWORDS,
  NEGATIVE_KEYWORDS,
  RSS_FEEDS,
  POSTED_LINKS_FILE,
  RECENT_KEYWORDS_FILE,
} from "./config";

const parser = new Parser();

interface FeedEntry {
  title?: string;
  link?: string;
  pubDate?: string;
  contentSnippet?: string;
  enclosure?: { url?: string }; // some feeds use enclosure for images
  "media:thumbnail"?: { url?: string }; // some use media:thumbnail
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

  const filtered = allEntries.filter((entry) => {
    if (!entry.title || !entry.link || !entry.pubDate) return false;

    const pubDate = new Date(entry.pubDate);
    if (pubDate < cutoffDate) return false;

    const sentimentScore = adjustedSentiment(entry.title, NEGATIVE_KEYWORDS);
    if (sentimentScore < POSITIVE_THRESHOLD) return false;

    const keywordsInTitle = POSITIVE_KEYWORDS.filter((k) =>
      entry.title!.toLowerCase().includes(k)
    );
    if (keywordsInTitle.length === 0) return false;

    return true;
  });

  return filtered.map((entry) => ({
    entry,
    keywords: POSITIVE_KEYWORDS.filter((k) =>
      entry.title!.toLowerCase().includes(k)
    ),
  }));
}

function extractThumbnail(entry: FeedEntry): string | undefined {
  // Try common thumbnail locations in RSS feed item
  if (entry.enclosure?.url) return entry.enclosure.url;
  if (entry["media:thumbnail"]?.url) return entry["media:thumbnail"].url;
  if (entry["media:content"]?.url) return entry["media:content"].url;
  // Some feeds put images inside content or contentSnippet (you could add more parsing here)
  return undefined;
}

async function postToBluesky(
  title: string,
  url: string,
  imageUrl?: string,
  description?: string
): Promise<void> {
  const handle = process.env.BLUESKY_HANDLE;
  const appPassword = process.env.BLUESKY_APP_PASSWORD;

  if (!handle || !appPassword) {
    throw new Error("BLUESKY_HANDLE or BLUESKY_APP_PASSWORD are not set");
  }

  const agent = new BskyAgent({ service: "https://bsky.social" });

  await agent.login({ identifier: handle, password: appPassword });

  const postInput = {
    text: title,
    createdAt: new Date().toISOString(),
    embed: {
      $type: "app.bsky.embed.external",
      external: {
        uri: url,
        title,
        description: description || "",
        thumb: imageUrl || "",
      },
    },
  };

  await agent.post(postInput);

  console.log("Posted card to Bluesky successfully:", title);
}

async function main() {
  const postedLinks = await loadListFromFile(POSTED_LINKS_FILE);
  const recentKeywords = await loadListFromFile(RECENT_KEYWORDS_FILE);

  const positiveArticles = await fetchRecentPositiveHeadlines();

  const candidates = positiveArticles.filter(({ entry, keywords }) => {
    const normalizedTitle = normalizeTitle(entry.title!);
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

  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  const title =
    chosen.entry.title!.length > 256
      ? chosen.entry.title!.slice(0, 253) + "..."
      : chosen.entry.title!;
  const url = chosen.entry.link!;
  const imageUrl = extractThumbnail(chosen.entry);
  const description = chosen.entry.contentSnippet || "";

  try {
    await postToBluesky(title, url, imageUrl, description);

    postedLinks.push(normalizeTitle(chosen.entry.title!));
    await saveListToFile(postedLinks.slice(-MAX_POSTED_LINKS), POSTED_LINKS_FILE);

    recentKeywords.push(...chosen.keywords);
    await saveListToFile(recentKeywords.slice(-20), RECENT_KEYWORDS_FILE);

    console.log("Successfully posted:", title);
  } catch (err) {
    console.error("Failed to post:", err);
  }
}

main().catch(console.error);
