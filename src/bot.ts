import * as dotenv from "dotenv";
dotenv.config();

import Parser from "rss-parser";
import fetch from "node-fetch"; // npm install node-fetch@2
import {
  loadListFromFile,
  saveListToFile,
  normalizeTitle,
  adjustedSentiment,
} from "./utils";

import { BskyAgent } from "@atproto/api";
import type { AppBskyFeedPost } from "@atproto/api";
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

// Helper: strip HTML tags & decode entities
function cleanHtmlToText(html: string): string {
  // Remove tags
  let text = html.replace(/<\/?[^>]+(>|$)/g, "");
  // Decode common HTML entities (basic)
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  return text.trim();
}

const parser = new Parser();

interface FeedEntry {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  enclosure?: { url?: string };
  description?: string;
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

async function uploadImageAsBlob(agent: BskyAgent, imageUrl: string) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image for blob upload: ${response.statusText}`);
  }
  const buffer = await response.buffer();

  // Determine mime type based on file extension or fallback to jpeg
  let mimeType = "image/jpeg";
  if (imageUrl.match(/\.(png)$/i)) mimeType = "image/png";
  else if (imageUrl.match(/\.(gif)$/i)) mimeType = "image/gif";

  const blobRef = await agent.api.uploadBlob(buffer, {
    encoding: mimeType,
    mimeType,
  });

  return blobRef.ref; // Access the string ref property here
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

  let blobRef: string | undefined;
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

  // Extract and clean description
  let description = "";
  if (chosen.entry.contentSnippet) {
    description = cleanHtmlToText(chosen.entry.contentSnippet);
  } else if (chosen.entry.description) {
    description = cleanHtmlToText(chosen.entry.description);
  } else if (chosen.entry.content) {
    description = cleanHtmlToText(chosen.entry.content);
  }

  // Limit description length to ~250 characters for neatness
  if (description.length > 250) {
    description = description.slice(0, 247) + "...";
  }

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
