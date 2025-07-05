import * as dotenv from "dotenv";
dotenv.config();

import fetch from "node-fetch";
import {
  loadListFromFile,
  saveListToFile,
  normalizeTitle,
  analyzeSentiment,
} from "./utils";

import { BskyAgent } from "@atproto/api";
import type { BlobRef } from "@atproto/api";

import {
  MAX_DAYS_OLD,
  MAX_POSTED_LINKS,
  POSITIVE_THRESHOLD,
  ALL_KEYWORD_GROUPS,
  POSTED_LINKS_FILE,
  RECENT_KEYWORDS_FILE,
} from "./config";

interface Article {
  title?: string;
  url?: string;
  publishedAt?: string;
  description?: string;
  urlToImage?: string;
}

/**
 * Fetch recent headlines from NewsAPI using multiple keyword groups sequentially,
 * then merges and filters results by sentiment and keywords.
 */
async function fetchRecentProgressiveHeadlines(): Promise<
  { entry: Article; keywords: string[] }[]
> {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) throw new Error("NEWSAPI_KEY is not set in .env");

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - MAX_DAYS_OLD);

  const foundArticlesMap = new Map<string, { entry: Article; keywords: string[] }>();

  for (const keywordGroup of ALL_KEYWORD_GROUPS) {
    if (keywordGroup.length === 0) continue;

    // Build OR query from keywords in this group
    const query = keywordGroup.map(k => `"${k}"`).join(" OR ");

    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
      query
    )}&language=en&sortBy=publishedAt&pageSize=100&apiKey=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`NewsAPI request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const articles: Article[] = data.articles;

    // For each article, analyze sentiment and filter by date & sentiment
    const titles = articles
      .filter((a) => a.title && a.publishedAt)
      .map((a) => a.title!);

    const sentiments = await Promise.all(titles.map((title) => analyzeSentiment(title)));

    for (let i = 0; i < articles.length; i++) {
      const entry = articles[i];
      const sentiment = sentiments[i];

      if (!entry.title || !entry.url || !entry.publishedAt) continue;

      const pubDate = new Date(entry.publishedAt);
      if (pubDate < cutoffDate) continue;

      // Accept either "POSITIVE" or "LABEL_1" as positive sentiment labels
      if (sentiment.label !== "POSITIVE" && sentiment.label !== "LABEL_1") continue;

      if (sentiment.score < POSITIVE_THRESHOLD) continue;

      // Check which keywords from this group appear in title (case-insensitive)
      const titleLower = entry.title.toLowerCase();
      const matchedKeywords = keywordGroup.filter((k) => titleLower.includes(k.toLowerCase()));

      if (matchedKeywords.length === 0) continue;

      // Use normalized title as unique key to avoid duplicates
      const normalized = normalizeTitle(entry.title);

      // Store if not already added
      if (!foundArticlesMap.has(normalized)) {
        foundArticlesMap.set(normalized, { entry, keywords: matchedKeywords });
      }
    }
  }

  // Return all unique articles found across keyword groups
  return Array.from(foundArticlesMap.values());
}

async function uploadImageAsBlob(
  agent: BskyAgent,
  imageUrl: string
): Promise<BlobRef> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image for blob upload: ${response.statusText}`);
  }
  const buffer: Buffer = await response.buffer();

  let encoding = "image/jpeg";
  if (imageUrl.match(/\.(png)$/i)) encoding = "image/png";
  else if (imageUrl.match(/\.(gif)$/i)) encoding = "image/gif";

  const uploadResult = await agent.api.uploadBlob(buffer, { encoding });
  return uploadResult.data.blob;
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

  const progressiveArticles = await fetchRecentProgressiveHeadlines();

  // Filter articles to exclude already posted titles and recently used keywords
  const candidates = progressiveArticles.filter(({ entry, keywords }) => {
    const normalizedTitle = normalizeTitle(entry.title!);
    if (postedLinks.includes(normalizedTitle)) return false;

    // Skip articles if any matched keyword was used recently
    for (const kw of keywords) {
      if (recentKeywords.includes(kw.toLowerCase())) return false;
    }

    return true;
  });

  if (candidates.length === 0) {
    console.log("No new progressive articles found to post.");
    return;
  }

  // Pick a random article to post
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];

  // Truncate title if necessary (limit 256 chars)
  const title =
    chosen.entry.title!.length > 256
      ? chosen.entry.title!.slice(0, 253) + "..."
      : chosen.entry.title!;

  const url = chosen.entry.url!;
  const imageUrl = chosen.entry.urlToImage;

  try {
    await postToBluesky(title, url, imageUrl, chosen.entry.description);

    // Save posted link (normalized title)
    postedLinks.push(normalizeTitle(chosen.entry.title!));
    await saveListToFile(postedLinks.slice(-MAX_POSTED_LINKS), POSTED_LINKS_FILE);

    // Save recently used keywords (lowercased)
    recentKeywords.push(...chosen.keywords.map(k => k.toLowerCase()));
    await saveListToFile(recentKeywords.slice(-4), RECENT_KEYWORDS_FILE);

    console.log("Successfully posted:", title);
  } catch (err) {
    console.error("Failed to post:", err);
  }
}

main().catch(console.error);
