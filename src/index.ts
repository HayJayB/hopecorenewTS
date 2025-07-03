import * as fs from "fs";
import * as path from "path";
import fetch from "node-fetch";
import FeedParser from "feedparser-promised";
import Sentiment from "sentiment";
import { BskyAgent } from "@atproto/api";

const MAX_DAYS_OLD = 7;
const POSITIVE_THRESHOLD = 1; // sentiment > 1
const NEGATIVE_PENALTY_PER_KEYWORD = 1;
const MAX_TEXT_LENGTH = 300;
const RECENT_KEYWORDS_LIMIT = 4;
const MAX_POSTED_LINKS = 50;

const BLUESKY_HANDLE = process.env.BLUESKY_HANDLE!;
const BLUESKY_APP_PASSWORD = process.env.BLUESKY_APP_PASSWORD!;

const POSTED_LINKS_FILE = "posted_links.json";
const RECENT_KEYWORDS_FILE = "recent_keywords.json";

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
  "https://www.leftvoice.org/feed/"
];

const POSITIVE_KEYWORDS = [
  "win","victory","gains","success","growth","solidarity","organize","strike",
  "socialist","left wing","union","responsibility","mobilize","charity",
  "outreach","resistance","community","truth","celebrate","local","save",
  "future","knock","knocks","healing","hope","love","progressive","champion",
  "leader","ceasefire"
];

const NEGATIVE_KEYWORDS = [
  "death","deadly","killed","kill","killing","violence","attack","crisis",
  "disaster","scandal","accident","injured","tragedy","fraud","collapse",
  "bomb","shooting","war","loser","awful","horrible","terrible","tragic",
  "destroy","raiding","raid","gut","fear","broken","destruction"
];

function loadJson(filename: string): string[] {
  if (fs.existsSync(filename)) {
    return JSON.parse(fs.readFileSync(filename, "utf8"));
  }
  return [];
}

function saveJson(filename: string, data: string[]) {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2), "utf8");
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^\w\s]/g, "").trim();
}

function adjustedSentiment(text: string, sentimentAnalyzer: Sentiment): number {
  const baseScore = sentimentAnalyzer.analyze(text).score;
  const penalties = NEGATIVE_KEYWORDS.reduce(
    (acc, word) => (text.toLowerCase().includes(word) ? acc + NEGATIVE_PENALTY_PER_KEYWORD : acc),
    0
  );
  return baseScore - penalties;
}

async function main() {
  const sentiment = new Sentiment();
  const postedLinks = loadJson(POSTED_LINKS_FILE);
  const recentKeywords = loadJson(RECENT_KEYWORDS_FILE);
  const postedTitlesNormalized = postedLinks.map(normalizeTitle);

  const entries = await Promise.all(
    FEEDS.map(feed => FeedParser.parse({ uri: feed }).catch(() => []))
  ).then(results => results.flat());

  const cutoff = Date.now() - MAX_DAYS_OLD * 86400 * 1000;

  const candidates = entries.filter(e => {
    const date = new Date(e.pubDate || e.date || e.pubdate || e.updated || "");
    if (isNaN(date.getTime()) || date.getTime() < cutoff) return false;

    const sentimentScore = adjustedSentiment(e.title, sentiment);
    if (sentimentScore < POSITIVE_THRESHOLD) return false;

    const titleLower = e.title.toLowerCase();
    const keywords = POSITIVE_KEYWORDS.filter(k => titleLower.includes(k));
    if (keywords.length === 0) return false;
    if (recentKeywords.some(k => keywords.includes(k))) return false;

    const normalized = normalizeTitle(e.title);
    if (postedTitlesNormalized.includes(normalized)) return false;

    return true;
  });

  if (!candidates.length) {
    console.log("No suitable articles found.");
    return;
  }

  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  const chosenKeywords = POSITIVE_KEYWORDS.filter(k => chosen.title.toLowerCase().includes(k));

  const text = chosen.title.slice(0, MAX_TEXT_LENGTH);
  const imageUrl = (chosen.image && chosen.image.url) || undefined;

  const agent = new BskyAgent({ service: "https://bsky.social" });
  await agent.login({ identifier: BLUESKY_HANDLE, password: BLUESKY_APP_PASSWORD });

  await agent.post({
    text,
    embed: {
      $type: "app.bsky.embed.external",
      external: {
        uri: chosen.link,
        title: chosen.title,
        description: "Positive news story",
        thumb: imageUrl || undefined
      }
    }
  });

  console.log(`Posted: ${chosen.title}`);

  postedLinks.push(chosen.link);
  if (postedLinks.length > MAX_POSTED_LINKS) {
    postedLinks.splice(0, postedLinks.length - MAX_POSTED_LINKS);
  }
  saveJson(POSTED_LINKS_FILE, postedLinks);

  recentKeywords.push(...chosenKeywords);
  if (recentKeywords.length > RECENT_KEYWORDS_LIMIT) {
    recentKeywords.splice(0, recentKeywords.length - RECENT_KEYWORDS_LIMIT);
  }
  saveJson(RECENT_KEYWORDS_FILE, recentKeywords);
}

main().catch(err => {
  console.error("Error in main:", err);
  process.exit(1);
});
