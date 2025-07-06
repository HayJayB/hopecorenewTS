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

async function fetchRecentProgressiveHeadlines(): Promise<
  { entry: Article; keywords: string[] }[]
> {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) {
    throw new Error("NEWSAPI_KEY is not set in .env");
  }

  let combinedArticles: { entry: Article; keywords: string[] }[] = [];

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - MAX_DAYS_OLD);

  for (const keywordGroup of ALL_KEYWORD_GROUPS) {
    const query = keywordGroup.join(" OR ");
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
      query
    )}&language=en&sortBy=publishedAt&pageSize=100&apiKey=${apiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(
          `NewsAPI request failed for keywords: ${query} - ${response.statusText}`
        );
        continue;
      }

      const data = await response.json();
      const articles: Article[] = data.articles;

      const filtered = articles
        .filter(
          (a) =>
            a.title &&
            a.url &&
            a.publishedAt &&
            new Date(a.publishedAt) >= cutoffDate
        )
        .map((a) => ({
          entry: a,
          keywords: keywordGroup.filter((k) =>
            a.title!.toLowerCase().includes(k)
          ),
        }))
        .filter(({ keywords }) => keywords.length > 0);

      combinedArticles.push(...filtered);
    } catch (error) {
      console.warn(`Error fetching articles for keywords: ${query}`, error);
      continue;
    }
  }

  const uniqueArticlesMap = new Map<string, { entry: Article; keywords: string[] }>();
  for (const item of combinedArticles) {
    const normTitle = normalizeTitle(item.entry.title!);
    if (!uniqueArticlesMap.has(normTitle)) {
      uniqueArticlesMap.set(normTitle, item);
    }
  }
  const uniqueArticles = Array.from(uniqueArticlesMap.values());

  const sentiments = await Promise.all(
    uniqueArticles.map(({ entry }) => analyzeSentiment(entry.title!))
  );

  const positiveArticles = uniqueArticles
    .map(({ entry, keywords }, i) => ({ entry, keywords, sentiment: sentiments[i] }))
    .filter(
      ({ sentiment }) =>
        (sentiment.label === "POSITIVE" || sentiment.label === "LABEL_1") &&
        sentiment.score >= POSITIVE_THRESHOLD
    );

  return positiveArticles;
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
  const postedLinks = await loadListFromFile(POSTED_LINKS_FILE);
  const recentKeywords = await loadListFromFile(RECENT_KEYWORDS_FILE);

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
    await saveListToFile(postedLinks.slice(-MAX_POSTED_LINKS), POSTED_LINKS_FILE);

    recentKeywords.push(...chosen.keywords);
    await saveListToFile(recentKeywords.slice(-4), RECENT_KEYWORDS_FILE);

    console.log("Successfully posted:", title);
  } catch (err) {
    console.error("Failed to post:", err);
  }
}

main().catch(console.error);
