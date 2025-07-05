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
} from "./config";

interface Article {
  title?: string;
  url?: string;
  publishedAt?: string;
  description?: string;
  urlToImage?: string;
}

async function fetchRecentProgressiveHeadlines(): Promise<
  { entry: Article; keywords: string[] }[]
> {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) {
    throw new Error("NEWSAPI_KEY is not set in .env");
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - MAX_DAYS_OLD);

  const CHUNK_SIZE = 20;
  const foundArticlesMap = new Map<string, { entry: Article; keywords: string[] }>();

  for (const keywordGroup of ALL_KEYWORD_GROUPS) {
    for (let i = 0; i < keywordGroup.length; i += CHUNK_SIZE) {
      const chunk = keywordGroup.slice(i, i + CHUNK_SIZE);
      const query = chunk.map((k) => `"${k}"`).join(" OR ");

      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
        query
      )}&language=en&sortBy=publishedAt&pageSize=100&apiKey=${apiKey}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `NewsAPI request failed: ${response.statusText} for query: ${query}`
        );
      }

      const data = await response.json();
      const articles: Article[] = data.articles;

      const titles = articles
        .filter((entry) => entry.title)
        .map((entry) => entry.title!);

      const sentiments = await Promise.all(
        titles.map((title) => analyzeSentiment(title))
      );

      articles.forEach((entry, idx) => {
        const sentiment = sentiments[idx];
        if (
          !entry.title ||
          !entry.url ||
          !entry.publishedAt ||
          new Date(entry.publishedAt) < cutoffDate
        )
          return;

        if (
          sentiment.label !== "POSITIVE" &&
          sentiment.label !== "LABEL_1"
        )
          return;

        if (sentiment.score < POSITIVE_THRESHOLD) return;

        const keywordsInTitle = chunk.filter((k) =>
          entry.title!.toLowerCase().includes(k.toLowerCase())
        );
        if (keywordsInTitle.length === 0) return;

        const normalizedTitle = normalizeTitle(entry.title);
        if (!foundArticlesMap.has(normalizedTitle)) {
          foundArticlesMap.set(normalizedTitle, {
            entry,
            keywords: keywordsInTitle,
          });
        }
      });
    }
  }

  return Array.from(foundArticlesMap.values());
}

async function uploadImageAsBlob(
  agent: BskyAgent,
  imageUrl: string
): Promise<BlobRef> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch image for blob upload: ${response.statusText}`
    );
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
  const postedLinks = await loadListFromFile("posted_links.txt");
  const recentKeywords = await loadListFromFile("recent_keywords.txt");

  const progressiveArticles = await fetchRecentProgressiveHeadlines();

  const candidates = progressiveArticles.filter(({ entry, keywords }) => {
    const normalizedTitle = normalizeTitle(entry.title!);
    if (postedLinks.includes(normalizedTitle)) return false;

    for (const kw of keywords) {
      if (recentKeywords.includes(kw)) return false;
    }

    return true;
  });

  if (candidates.length === 0) {
    console.log("No new progressive articles found to post.");
    return;
  }

  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  const title =
    chosen.entry.title!.length > 256
      ? chosen.entry.title!.slice(0, 253) + "..."
      : chosen.entry.title!;

  const url = chosen.entry.url!;
  const imageUrl = chosen.entry.urlToImage;

  try {
    await postToBluesky(title, url, imageUrl, chosen.entry.description);

    postedLinks.push(normalizeTitle(chosen.entry.title!));
    await saveListToFile(postedLinks.slice(-MAX_POSTED_LINKS), "posted_links.txt");

    recentKeywords.push(...chosen.keywords);
    await saveListToFile(recentKeywords.slice(-4), "recent_keywords.txt");

    console.log("Successfully posted:", title);
  } catch (err) {
    console.error("Failed to post:", err);
  }
}

main().catch(console.error);
