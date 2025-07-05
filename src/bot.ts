import * as dotenv from "dotenv";
dotenv.config();

import Parser from "rss-parser";
import fetch from "node-fetch"; // node-fetch v2
import {
  loadListFromFile,
  saveListToFile,
  normalizeTitle,
  adjustedSentiment,
} from "./utils";

import { BskyAgent, type BlobRef } from "@atproto/api";
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
  content?: string;
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

async function uploadImageAsBlob(agent: BskyAgent, imageUrl: string): Promise<BlobRef> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image for blob upload: ${response.statusText}`);
  }
  const buffer: Buffer = await response.buffer();

  // Use 'encoding' option expected by uploadBlob
  let encoding = "image/jpeg";
  if (imageUrl.match(/\.(png)$/i)) encoding = "image/png";
  else if (imageUrl.match(/\.(gif)$/i)) encoding = "image/gif";

  const blobRef = await agent.api.uploadBlob(buffer, { encoding });

  return blobRef;
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

  let blobRef: BlobRef | undefined;
  if (imageUrl) {
    try {
      blobRef = await uploadImageAsBlob(agent, imageUrl);
    } catch (err) {
      console.warn("Image blob upload failed, posting without thumbnail:", err);
    }
  }

  const postInput: any = {
    text: title,
    createdAt: new Date().toISOString(),
  };

  if (blobRef) {
    postInput.embed = {
      $type: "app.bsky.embed.external",
      external: {
        uri: url,
        title,
        description: description || "",
        thumb: blobRef,
      },
    };
  } else {
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

  const url = chosen.entry.link!;

  // Try to get image URL from RSS item: either 'enclosure.url' or 'content' with <img> tag
  let imageUrl: string | undefined = undefined;
  if (chosen.entry.enclosure && chosen.entry.enclosure.url) {
    imageUrl = chosen.entry.enclosure.url;
  } else if (chosen.entry.content) {
    const imgMatch = chosen.entry.content.match(/<img[^>]+src="([^">]+)"/i);
    if (imgMatch) imageUrl = imgMatch[1];
  }

  try {
    await postToBluesky(title, url, imageUrl);

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
