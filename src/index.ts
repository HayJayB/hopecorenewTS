import fetch from "node-fetch";
import * as fs from "fs/promises";
import * as path from "path";
import * as FeedParser from "feedparser";
import * as stream from "stream";
import { promisify } from "util";
import { BskyAgent, RichText } from "@atproto/api";

const pipeline = promisify(stream.pipeline);

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

const POSITIVE_KEYWORDS = [
  "win", "victory", "gains", "success", "growth", "solidarity",
  "organize", "strike", "socialist", "left wing", "union",
  "responsibility", "mobilize", "charity", "outreach", "resistance",
  "community", "truth", "celebrate", "local", "save", "future",
  "knock", "knocks", "healing", "hope", "love", "progressive",
  "champion", "leader", "ceasefire"
];

const NEGATIVE_KEYWORDS = [
  "death", "deadly", "killed", "kill", "killing", "violence", "attack",
  "crisis", "disaster", "scandal", "accident", "injured", "tragedy",
  "fraud", "collapse", "bomb", "shooting", "war", "loser", "awful",
  "horrible", "terrible", "tragic", "destroy", "raiding", "raid",
  "gut", "fear", "broken", "destruction"
];

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

async function fetchFeedEntries(url: string): Promise<FeedParser.Item[]> {
  const entries: FeedParser.Item[] = [];
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}`);

  const feedparser = new FeedParser();
  const streamBody = response.body;
  if (!streamBody) throw new Error("No response body");

  const entryPromise = new Promise<void>((resolve, reject) => {
    feedparser.on("error", reject);
    feedparser.on("readable", function (this: FeedParser) {
  let item: FeedParser.Item | null;
  while ((item = this.read())) {
    entries.push(item);
  }
});

  await pipeline(streamBody, feedparser);
  await entryPromise;

  return entries;
}

function extractImageUrl(entry: FeedParser.Item): string | undefined {
  if (entry.image?.url) return entry.image.url;
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
  const cutoff = Date.now() - maxDays * 24 * 60 * 60 * 1000;
  const results: { entry: FeedParser.Item; keywords: string[] }[] = [];

  for (const feedUrl of FEEDS) {
    try {
      const entries = await fetchFeedEntries(feedUrl);
      for (const e of entries) {
        const pubDate = e.pubDate ?? e.date;
        if (!pubDate || pubDate.getTime() < cutoff) continue;

        const sentiment = adjustedSentiment(e.title || "");
        if (sentiment < POSITIVE_THRESHOLD) continue;

        const titleLower = e.title?.toLowerCase() || "";
        const keywordsInTitle = POSITIVE_KEYWORDS.filter((k) => titleLower.includes(k));
        if (keywordsInTitle.length === 0) continue;
        if (recentKeywords.some((k) => keywordsInTitle.includes(k))) continue;
        if (postedTitlesNormalized.has(normalizeTitle(e.title || ""))) continue;

        results.push({ entry: e, keywords: keywordsInTitle });
      }
    } catch (err) {
      console.warn(`Failed to fetch or parse ${feedUrl}: ${err}`);
    }
  }
  return results;
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

  const richText = new RichText({ text });
  await richText.detectFacets(agent);

  await agent.post({
    text,
    facets: richText.facets,
    embed: {
      $type: "app.bsky.embed.external",
      external: {
        uri: link,
        title: title ?? "Read more",
        description: description ?? "",
        thumb: thumbnail
      }
    }
  });
}

async function main() {
  const postedLinks = await loadListFromFile(POSTED_LINKS_FILE);
  const recentKeywords = await loadListFromFile(RECENT_KEYWORDS_FILE);
  const postedTitlesNormalized = new Set(postedLinks.map(normalizeTitle));

  const candidates = await fetchRecentPositiveHeadlines(MAX_DAYS_OLD, recentKeywords, postedTitlesNormalized);

  if (candidates.length === 0) {
    console.info("No recent positive articles found.");
    return;
  }

  const unposted = candidates.filter(({ entry }) => !postedLinks.includes(entry.link!));
  if (unposted.length === 0) {
    console.info("All recent articles already posted.");
    return;
  }

  const { entry, keywords } = unposted[Math.floor(Math.random() * unposted.length)];

  let text = entry.title ?? "Positive news";
  if (text.length > MAX_TEXT_LENGTH) text = text.slice(0, MAX_TEXT_LENGTH - 1);

  const imageUrl = extractImageUrl(entry);

  await postToBluesky(text, entry.link!, entry.title, "Positive news story", imageUrl);

  postedLinks.push(entry.link!);
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
