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

export const PROGRESSIVE_KEYWORDS_SOCIAL = [
  "progressive", "progressivism", "socialism", "socialist", "left wing", "left-wing", "leftist",
  "social justice", "equity", "fair wages", "income inequality", "income redistribution", "wealth inequality",
  "wealth tax", "progressive taxation", "anti-capitalism", "corporate accountability", "campaign finance reform",
  "campaign finance transparency", "corporate greed", "corporate profiteering", "billionaire tax", "tax the rich",
  "economic democracy", "solidarity economy", "economic justice", "community wealth building",
  "community land trust", "public ownership", "public investment"
];

export const PROGRESSIVE_KEYWORDS_LABOR = [
  "labor rights", "union", "unionization", "right to strike", "collective bargaining", "worker rights",
  "workers' rights", "workers bill of rights", "labor movement", "gig economy", "living wage", "living wage jobs",
  "minimum wage", "tenant union", "tenant rights", "tenant protections", "good cause eviction", "cancel rent",
  "rent control", "universal rent control", "affordable housing", "affordable housing for all", "housing affordability",
  "housing guarantee", "housing justice", "housing as a human right", "housing for all", "public housing",
  "build public housing", "community control", "NYCHA funding", "stop gentrification", "social housing",
  "cancel student debt", "abolish student debt", "student debt", "tuition free college", "free public college",
  "public education", "universal pre-k", "public broadband", "childcare", "universal childcare", "paid family leave",
  "paid sick leave", "living wage", "right to strike"
];

export const PROGRESSIVE_KEYWORDS_ENVIRONMENT = [
  "climate justice", "environmental justice", "climate action", "green new deal", "green jobs", "climate jobs",
  "climate resilience", "pollution reduction", "fossil fuel divestment", "renewable energy", "green infrastructure",
  "decarbonization", "net zero emissions", "decarbonize economy", "zero emissions", "green transition",
  "environmental racism", "youth climate movement"
];

export const PROGRESSIVE_KEYWORDS_CIVIL_RIGHTS = [
  "black lives matter", "lgbtq rights", "trans rights", "transgender", "gender equality", "gay", "civil rights",
  "gender pay gap", "inclusivity", "racial disparities", "racial justice", "racial equity", "racial wealth gap",
  "racial solidarity", "racial justice organizing", "prison reform", "mass incarceration", "end mass incarceration",
  "decarceration", "abolish prisons", "prisoner rights", "prisoner's rights", "police accountability",
  "police abolition", "defund the police", "abolish ice", "immigrant rights", "immigrant defense", "sanctuary cities",
  "reproductive rights"
];

export const PROGRESSIVE_KEYWORDS_PUBLIC_SERVICES = [
  "public transit access", "public transportation", "transportation", "public option", "healthcare access",
  "universal healthcare", "medicare for all", "medicare expansion", "expanding medicare", "single payer healthcare",
  "medicare", "dignity in retirement", "free public college", "tuition free college", "public broadband",
  "childcare", "universal childcare", "paid family leave", "paid sick leave", "public housing", "public education",
  "universal pre-k"
];

export const PROGRESSIVE_KEYWORDS_PERSONALITIES = [
  "bernie sanders", "aoc", "alexandria ocasio-cortez", "zohran mamdani", "zohran", "mamdani", "dsa"
];

export const POSTED_LINKS_FILE = path.join(rootDir, "posted_links.txt");
export const RECENT_KEYWORDS_FILE = path.join(rootDir, "recent_keywords.txt");
