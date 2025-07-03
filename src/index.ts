// src/index.ts
import fetch from "node-fetch";
import * as fs from "fs/promises";
import * as path from "path";
import { createRequire } from "module";
import * as stream from "stream";
import { promisify } from "util";
import { BskyAgent } from "@atproto/api";

const require = createRequire(import.meta.url);
const FeedParser = require("feedparser");

const pipeline = promisify(stream.pipeline);

import type { FeedItem } from "feedparser";

// ... your constants (MAX_POSTED_LINKS, etc.) stay unchanged ...

const MAX_POSTED_LINKS = 50;
const MAX_DAYS_OLD = 7;
const POSITIVE_THRESHOLD = 0.1;
const NEGATIVE_PENALTY_PER_KEYWORD = 0.1;
const MAX_TEXT_LENGTH = 300;
const RECENT_KEYWORDS_LIMIT = 4;

const POSTED_LINKS_FILE = path.resolve("./posted_links.txt");
const RECENT_KEYWORDS_FILE = path.resolve("./recent_keywords.txt");

const BLUESKY_HANDLE = process.env.BLUESKY_HANDLE || "";
const BLUESKY_APP_PASSWORD = process.env.BLUESKY_APP_PASSWORD || "";

const FEEDS = [
  // ... your feeds here ...
];

const POSITIVE_KEYWORDS = [
  // ... your positive keywords here ...
];

const NEGATIVE_KEYWORDS = [
  // ... your negative keywords here ...
];

// normalizeTitle etc. helpers stay unchanged
function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^\w\s]/g, "").trim();
}

function adjustedSentiment(text: string): number {
  let baseScore = 0;
  for (const word of POSITIVE_KEYWORDS) {
    if (text.toLowerCase().includes(word)) baseScore += 0.1;
  }
  for (const word of NEGATIVE_KEYWORDS) {
    if (text.toLowerCase().includes(word)) baseScore -= NEGATIVE_PENALTY_PER_KEYWORD;
  }
  return baseScore;
}

async function loadListFromFile(filename: string): Promise<string[]> {
  try {
    const data = await fs.readFile(filename, "utf-8");
    return data.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

async function saveListToFile(list: string[], filename: string): Promise<void> {
  await fs.writeFile(filename, list.join("\n"));
}

// 🟢 Simplify fetchFeedEntries
async function fetchFeedEntries(url: string): Promise<FeedItem[]> {
  const entries: FeedItem[] = [];
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}`);

  const feedparser = new FeedParser();

  const done = new Promise<void>((resolve, reject) => {
    feedparser.on("error", reject);
    feedparser.on("readable", function () {
      let item: FeedItem | null;
      while ((item = this.read())) {
        entries.push(item);
      }
    });
    feedparser.on("end", resolve);
  });

  // Use simple pipe instead of pipeline
  response.body.pipe(feedparser);
  await done;

  return entries;
}

function extractImageUrl(entry: FeedItem): string | undefined {
  if (entry.image && entry.image.url) return entry.image.url;
  if (entry.enclosures) {
    for (const enc of entry.enclosures) {
      if (enc.type?.startsWith("image/")) return enc.url;
    }
  }
  return undefined;
}

async function fetchRecentPositiveHeadlines(
  maxDays: number,
  recentKeywords: string[],
  postedTitlesNormalized: Set<string>
) {
  const now = Date.now();
  const cutoff = now - maxDays * 24 * 60 * 60 * 1000;
  const allEntries: { entry: FeedItem; keywords: string[] }[] = [];

  for (const feedUrl of FEEDS) {
    try {
      const entries = await fetchFeedEntries(feedUrl);
      for (const e of entries) {
        const pubDate = e.pubDate ?? e.date ?? null;
        if (!pubDate) continue;
        if (pubDate.getTime() < cutoff) continue;

        const sentiment = adjustedSentiment(e.title || "");
        if (sentiment < POSITIVE_THRESHOLD) continue;

        const titleLower = (e.title ?? "").toLowerCase();
        const keywordsInTitle = POSITIVE_KEYWORDS.filter((k) =>
          titleLower.includes(k)
        );
        if (keywordsInTitle.length === 0) continue;
        if (recentKeywords.some((rk) => keywordsInTitle.includes(rk))) continue;
        if (postedTitlesNormalized.has(normalizeTitle(e.title || ""))) continue;

        allEntries.push({ entry: e, keywords: keywordsInTitle });
      }
    } catch (err) {
      console.warn(`Failed to fetch or parse feed ${feedUrl}: ${err}`);
    }
  }

  return allEntries;
}

async function postToBluesky(
  text: string,
  link: string,
  title?: string,
  description?: string,
  thumbnail?: string
) {
  const agent = new BskyAgent({ service: "https://bsky.social" });
  await agent.login({ identifier: BLUESKY_HANDLE, password: BLUESKY_APP_PASSWORD });

  await agent.post({
    text,
    embed: {
      $type: "app.bsky.embed.external",
      external: {
        uri: link,
        title: title ?? "Read more",
        description: description ?? "",
        thumb: thumbnail,
      },
    },
  });
}

async function main() {
  const postedLinks = await loadListFromFile(POSTED_LINKS_FILE);
  const recentKeywords = await loadListFromFile(RECENT_KEYWORDS_FILE);
  const postedTitlesNormalized = new Set(postedLinks.map(normalizeTitle));

  const candidates = await fetchRecentPositiveHeadlines(
    MAX_DAYS_OLD,
    recentKeywords,
    postedTitlesNormalized
  );

  if (candidates.length === 0) {
    console.info("No recent positive articles found.");
    return;
  }

  const unposted = candidates.filter(({ entry }) => !postedLinks.includes(entry.link ?? ""));
  if (unposted.length === 0) {
    console.info("All recent articles already posted.");
    return;
  }

  const { entry, keywords } = unposted[Math.floor(Math.random() * unposted.length)];

  let text = entry.title ?? "Positive news";
  if (text.length > MAX_TEXT_LENGTH) text = text.slice(0, MAX_TEXT_LENGTH - 1);

  const imageUrl = extractImageUrl(entry);

  await postToBluesky(text, entry.link ?? "", entry.title, "Positive news story", imageUrl);

  postedLinks.push(entry.link ?? "");
  if (postedLinks.length > MAX_POSTED_LINKS)
    postedLinks.splice(0, postedLinks.length - MAX_POSTED_LINKS);
  await saveListToFile(postedLinks, POSTED_LINKS_FILE);

  recentKeywords.push(...keywords);
  if (recentKeywords.length > RECENT_KEYWORDS_LIMIT)
    recentKeywords.splice(0, recentKeywords.length - RECENT_KEYWORDS_LIMIT);
  await saveListToFile(recentKeywords, RECENT_KEYWORDS_FILE);

  console.info(`Posted: ${entry.title}`);
}

main().catch(console.error);
