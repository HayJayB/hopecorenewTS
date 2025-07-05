import path from "path";

const rootDir = process.cwd();

export const MAX_POSTED_LINKS = 63;
export const MAX_DAYS_OLD = 14;
export const POSITIVE_THRESHOLD = 0.1;

 //export const RSS_FEEDS = [
  //"https://jacobin.com/feed",
  //"https://www.dsausa.org/feed/",
  //"https://www.thenation.com/feed/?post_type=article",
  //"https://inthesetimes.com/rss",
  //"https://www.commondreams.org/rss.xml",
  //"https://truthout.org/feed/",
  //"https://progressive.org/feed/",
  //"https://theintercept.com/feed/",
  //"https://commonwealthclub.org/feed/podcast",
  //"https://www.theguardian.com/us-news/us-politics/rss",
  //"https://www.truthdig.com/feed/",
  //"https://www.counterpunch.org/feed/",
  //"https://www.democracynow.org/democracynow.rss",
  //"https://therealnews.com/feed/",
  //"https://labornotes.org/rss.xml",
  //"https://shadowproof.com/feed/",
  //"https://popularresistance.org/feed/",
  //"https://wagingnonviolence.org/feed/",
  //"https://www.leftvoice.org/feed/",
];

export const POSITIVE_KEYWORDS = [
  "win", "victory", "gains", "success", "growth", "solidarity", "organize", "strike",
  "socialist", "left wing", "union", "responsibility", "mobilize", "charity",
  "outreach", "resistance", "community", "truth", "celebrate", "local", "save",
  "future", "knock", "knocks", "healing", "hope", "love", "progressive", "champion",
  "leader", "empower", "support", "uplift", "transform", "advances", "improves", "breakthrough"
];

export const NEGATIVE_KEYWORDS = [
  "death", "deadly", "killed", "kill", "killing", "violence", "attack", "crisis",
  "disaster", "scandal", "accident", "injured", "tragedy", "fraud", "collapse",
  "bomb", "shooting", "war", "loser", "awful", "horrible", "terrible", "tragic",
  "destroy", "raiding", "raid", "gut", "fear", "broken", "destruction",
  "conflict", "lawsuit", "charges", "indicted", "pleads guilty"
];

export const POSTED_LINKS_FILE = path.join(rootDir, "posted_links.txt");
export const RECENT_KEYWORDS_FILE = path.join(rootDir, "recent_keywords.txt");
