import * as fs from "fs/promises";
import * as path from "path";
import * as FeedParser from "feedparser";
import fetch from "node-fetch";
import { pipeline as pipelineCallback, Readable } from "stream";
import { promisify } from "util";
import { AtpAgent } from "@atproto/api";

const pipeline = promisify(pipelineCallback);

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

if (!BLUESKY_HANDLE || !BLUESKY_APP_PASSWORD) {
  throw new Error("BLUESKY_HANDLE and BLUESKY_APP_PASSWORD must be set in environment variables.");
}

const FEEDS: string[] = [
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

const POSITIVE_KEYWORDS: string[] = [
  "win", "victory", "gains", "success", "growth", "solidarity", "organize", "strike",
  "socialist", "left wing", "union", "responsibility", "mobilize", "charity",
  "outreach", "resistance", "community", "truth", "celebrate", "local", "save",
  "future", "knock", "knocks", "healing", "hope", "love", "progressive", "champion",
  "leader", "ceasefire"
];

const NEGATIVE_KEYWORDS: string[] = [
  "death", "deadly", "killed", "kill", "killing", "violence", "attack", "crisis",
  "disaster", "scandal", "accident", "injured", "tragedy", "fraud", "collapse",
  "bomb", "shooting", "war", "loser", "awful", "horrible", "terrible", "tragic",
  "destroy", "raiding", "raid", "gut", "fear", "broken", "destruction"
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

interface FeedItem {
  title?: string;
  link?: string;
  pubDate?: Date;
  date?: Date;
  enclosures?: { url?: string; type?: string }[];
  image?: { url?: string };
}

async function fetchFeedEntries(url: string): Promise<FeedItem[]> {
  const entries: FeedItem[] = [];
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}`);

  if (!response.body) throw new Error("No response body");

  const feedparser = new FeedParser();

  const feedDone = new Promise<void>((resolve, reject) => {
    feedparser.on("error", reject);
    feedparser.on("readable", function () {
      let item;
      while ((item = this.read())) {
        entries.push(item);
      }
    });
    feedparser.on("end", resolve);
  });

  await pipeline(Readable.from(response.body), feedparser);
  await feedDone;

  return entries;
}

function extractImageUrl(entry: FeedItem): string | undefined {
  if (entry.image?.url) return entry.image.url;
  if (entry.enclosures) {
    for (const enc of entry.enclosures) {
      if (enc.type?.startsWith("image/")) {
        return enc.url;
      }
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
        const pubDate = e.pubDate ?? e.date;
        if (!pubDate) continue;
        if (pubDate.getTime() < cutoff) continue;

        const sentiment = adjustedSentiment(e.title ?? "");
        if (sentiment < POSITIVE_THRESHOLD) continue;

        const titleLower = (e.title ?? "").toLowerCase();
        const keywordsInTitle = POSITIVE_KEYWORDS.filter((k) =>
          titleLower.includes(k)
        );
        if (keywordsInTitle.length === 0) continue;

        if (recentKeywords.some((rk) => keywordsInTitle.includes(rk))) continue;

        if (postedTitlesNormalized.has(normalizeTitle(e.title ?? ""))) continue;

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
  const client = new AtpAgent({ service: "https://bsky.social" });

  const loginResponse = await client.login({
    identifier: BLUESKY_HANDLE,
    password: BLUESKY_APP_PASSWORD,
  });
  console.log("Login success. Session info:", loginResponse);

  const payload = {
    repo: loginResponse.data.did,
    collection: "app.bsky.feed.post",
    record: {
      text,
      createdAt: new Date().toISOString(),
      embed: {
        $type: "app.bsky.embed.external",
        external: {
          uri: link,
          title: title ?? "Read more",
          description: description ?? "",
          thumb: thumbnail ?? undefined,
        },
      },
    },
  };

  console.log("Posting payload:", JSON.stringify(payload, null, 2));

  try {
    const response = await client.api.com.atproto.repo.createRecord(payload);
    console.log("Post created successfully:", response);
  } catch (err) {
    console.error("Error posting to Bluesky:", err);
  }
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
  console.log(`Found ${candidates.length} candidate(s).`);

  const unposted = candidates.filter(({ entry }) => !postedLinks.includes(entry.link!));
  if (unposted.length === 0) {
    console.info("All recent articles already posted.");
    return;
  }
  console.log(`Found ${unposted.length} unposted candidate(s).`);

  const { entry, keywords } = unposted[Math.floor(Math.random() * unposted.length)];
  console.log("Selected entry:", entry);

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
