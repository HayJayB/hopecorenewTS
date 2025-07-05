import * as dotenv from "dotenv";
dotenv.config();

import Parser from "rss-parser";
import fetch from "node-fetch";
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

const parser = new Parser({
  headers: { "User-Agent": "Mozilla/5.0 (compatible; HopeCoreBot/1.0)" },
});

interface FeedEntry {
  title?: string;
  link?: string;
  pubDate?: string;
  enclosure?: { url?: string };
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

async function uploadImageAsBlob(agent: BskyAgent, imageUrl: string): Promise<string> {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
  const buffer = await res.arrayBuffer();

  // Guess mimeType based on extension
  let mimeType = "image/jpeg";
  if (imageUrl.endsWith(".png")) mimeType = "image/png";
  else if (imageUrl.endsWith(".gif")) mimeType = "image/gif";

  // agent.api.uploadBlob expects Uint8Array or Buffer
  const uint8Buffer = Buffer.from(buffer);

  const blobRef = await agent.api.uploadBlob(uint8Buffer, {
    encoding: mimeType,
    mimeType,
  });
  return blobRef.data.blob;
}

async function postToBluesky(
  title: string,
  url: string,
  imageUrl?: string
): Promise<void> {
  const handle = process.env.BLUESKY_HANDLE;
  const appPassword = process.env.BLUESKY_APP_PASSWORD;

  if (!handle || !appPassword) {
    throw new Error("BLUESKY_HANDLE or BLUESKY_APP_PASSWORD are not set");
  }

  const agent = new BskyAgent({ service: "https://bsky.social" });
  await agent.login({ identifier: handle, password: appPassword });

  let embed;

  if (imageUrl) {
    try {
      const thumbBlobRef = await uploadImageAsBlob(agent, imageUrl);
      embed = {
        $type: "app.bsky.embed.external",
        external: {
          uri: url,
          title,
          description: "",
          thumb: thumbBlobRef,
        },
      };
    } catch (e) {
      console.warn("Failed to upload thumbnail blob:", e);
    }
  }

  const postInput: Parameters<typeof agent.post>[0] = {
    text: title,
    createdAt: new Date().toISOString(),
  };

  if (embed) {
    // Attach embed if available
    (postInput as any).embed = embed;
  } else {
    // Fallback: append URL in text
    postInput.text += `\n\n${url}`;
  }

  await agent.post(postInput);

  console.log("Posted to Bluesky successfully:", title);
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

  // Attempt to get image from enclosure.url or other common fields
  let imageUrl: string | undefined;
  if (chosen.entry.enclosure && chosen.entry.enclosure.url) {
    imageUrl = chosen.entry.enclosure.url;
  } else if (chosen.entry["media:thumbnail"]?.url) {
    imageUrl = chosen.entry["media:thumbnail"].url;
  }

  try {
    await postToBluesky(title, chosen.entry.link!, imageUrl);

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
