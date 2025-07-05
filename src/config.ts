import path from "path";

const rootDir = process.cwd();

export const MAX_POSTED_LINKS = 63;
export const MAX_DAYS_OLD = 14;
export const POSITIVE_THRESHOLD = 0.85;

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
//];

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

export const PROGRESSIVE_KEYWORDS = [
  "progressive", "progressivism", "socialism", "socialist", "left wing", "left-wing",
  "leftist", "social justice", "income inequality", "bernie sanders", "aoc",
  "alexandria ocasio-cortez", "labor rights", "minimum wage", "universal healthcare",
  "medicare for all", "climate justice", "environmental justice", "black lives matter",
  "racial justice", "lgbtq rights", "worker rights", "union", "wealth tax",
  "student debt", "public education", "housing justice", "anti-capitalism", "equity",
  "green new deal", "fair wages", "collective bargaining", "food justice", "trans rights",
  "gender equality", "prison reform", "mass incarceration", "living wage", "civil rights",
  "income redistribution", "corporate accountability", "campaign finance reform",
  "progressive taxation", "universal basic income", "wealth inequality", "workers' rights",
  "climate action", "pollution reduction", "fossil fuel divestment", "renewable energy",
  "transportation", "childcare", "tenant protections", "good cause eviction",
  "cancel rent", "housing as a human right", "homes guarantee", "public housing",
  "build public housing", "NYCHA funding", "stop gentrification", "community control",
  "decarceration", "end mass incarceration", "end cash bail", "universal rent control",
  "sanctuary cities", "immigrant defense", "abolish ice", "free public college",
  "cancel student debt", "tuition free college", "medicare expansion",
  "single payer healthcare", "dignity in retirement", "climate jobs",
  "green infrastructure", "public broadband", "billionaire tax", "corporate profiteering",
  "workers bill of rights", "fair housing", "community organizing", "solidarity",
  "grassroots campaign", "mutual aid", "reproductive rights", "paid family leave",
  "gig economy", "labor movement", "tenant rights", "affordable housing",
  "criminal justice reform", "immigrant rights", "racial equity", "housing affordability",
  "public option", "expanding medicare", "gay", "campaign finance transparency",
  "corporate greed", "racial disparities", "police accountability", "police abolition",
  "abolish prisons", "housing for all", "guaranteed jobs", "public transit access",
  "decarbonization", "net zero emissions", "environmental racism",
  "youth climate movement", "green jobs", "climate resilience", "paid sick leave",
  "tax the rich", "universal childcare", "transgender", "community land trust",
  "rent control", "healthcare access", "racial wealth gap", "gender pay gap",
  "inclusivity", "public transportation", "economic democracy",
  "solidarity economy", "just transition", "anti-racism", "racial solidarity",
  "abolish student debt", "zohran mamdani", "zohran", "mamdani", "dsa",
  "housing guarantee", "medicare", "unionization", "right to strike",
  "affordable housing for all", "defund the police", "living wage jobs",
  "universal pre-k", "workers cooperative", "public ownership",
  "economic justice", "racial justice organizing", "housing justice movement",
  "tenant union", "democratic socialism", "social housing", "community wealth building",
  "public investment", "decarbonize economy", "zero emissions", "green transition"
];

export const POSTED_LINKS_FILE = path.join(rootDir, "posted_links.txt");
export const RECENT_KEYWORDS_FILE = path.join(rootDir, "recent_keywords.txt");
