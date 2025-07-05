import path from "path";

const rootDir = process.cwd();

export const MAX_POSTED_LINKS = 63;
export const MAX_DAYS_OLD = 14;
export const POSITIVE_THRESHOLD = 0.75;

// File paths for storing posted and recent keywords
export const POSTED_LINKS_FILE = path.join(rootDir, "posted_links.txt");
export const RECENT_KEYWORDS_FILE = path.join(rootDir, "recent_keywords.txt");

// Keyword groups split by topic for finer control
export const SOCIAL_JUSTICE_KEYWORDS = [
  "progressive", "progressivism", "socialism", "socialist", "left wing", "left-wing", "leftist",
  "social justice", "equity", "fair wages", "income inequality", "income redistribution", "wealth inequality",
  "wealth tax", "progressive taxation", "anti-capitalism", "corporate accountability", "campaign finance reform",
  "campaign finance transparency", "corporate greed", "corporate profiteering", "billionaire tax", "tax the rich",
  "economic democracy", "solidarity economy", "economic justice", "community wealth building",
  "community land trust", "public ownership", "public investment"
];

export const LABOR_HOUSING_KEYWORDS = [
  "labor rights", "union", "unionization", "right to strike", "collective bargaining", "worker rights",
  "workers' rights", "workers bill of rights", "labor movement", "gig economy", "living wage", "living wage jobs",
  "minimum wage", "tenant union", "tenant rights", "tenant protections", "good cause eviction", "cancel rent",
  "rent control", "universal rent control", "affordable housing", "affordable housing for all", "housing affordability",
  "housing guarantee", "housing justice", "housing as a human right", "housing for all", "public housing",
  "build public housing", "community control", "NYCHA funding", "stop gentrification", "social housing",
  "cancel student debt", "abolish student debt", "student debt", "tuition free college", "free public college",
  "public education", "universal pre-k", "public broadband", "childcare", "universal childcare", "paid family leave",
  "paid sick leave", "right to strike"
];

export const ECONOMIC_POLICIES_KEYWORDS = [
  // Economic policies keywords can be added here if needed,
  // as you had no separate list for them in this snippet,
  // or merge relevant ones from others if applicable.
];

export const CLIMATE_ENVIRONMENT_KEYWORDS = [
  "climate justice", "environmental justice", "climate action", "green new deal", "green jobs", "climate jobs",
  "climate resilience", "pollution reduction", "fossil fuel divestment", "renewable energy", "green infrastructure",
  "decarbonization", "net zero emissions", "decarbonize economy", "zero emissions", "green transition",
  "environmental racism", "youth climate movement"
];

export const CIVIL_RIGHTS_KEYWORDS = [
  "black lives matter", "lgbtq rights", "trans rights", "transgender", "gender equality", "gay", "civil rights",
  "gender pay gap", "inclusivity", "racial disparities", "racial justice", "racial equity", "racial wealth gap",
  "racial solidarity", "racial justice organizing", "prison reform", "mass incarceration", "end mass incarceration",
  "decarceration", "abolish prisons", "prisoner rights", "prisoner's rights", "police accountability",
  "police abolition", "defund the police", "abolish ice", "immigrant rights", "immigrant defense", "sanctuary cities",
  "reproductive rights"
];

export const PUBLIC_SERVICES_KEYWORDS = [
  "public transit access", "public transportation", "transportation", "public option", "healthcare access",
  "universal healthcare", "medicare for all", "medicare expansion", "expanding medicare", "single payer healthcare",
  "medicare", "dignity in retirement", "free public college", "tuition free college", "public broadband",
  "childcare", "universal childcare", "paid family leave", "paid sick leave", "public housing", "public education",
  "universal pre-k"
];

export const PERSONALITIES_KEYWORDS = [
  "bernie sanders", "aoc", "alexandria ocasio-cortez", "zohran mamdani", "zohran", "mamdani", "dsa"
];

// Collect all keyword groups to iterate over in bot.ts
export const ALL_KEYWORD_GROUPS = [
  SOCIAL_JUSTICE_KEYWORDS,
  LABOR_HOUSING_KEYWORDS,
  CIVIL_RIGHTS_KEYWORDS,
  PUBLIC_SERVICES_KEYWORDS,
  CLIMATE_ENVIRONMENT_KEYWORDS,
  PERSONALITIES_KEYWORDS,
];
