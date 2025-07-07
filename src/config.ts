import path from "path";

const rootDir = process.cwd();

export const MAX_POSTED_LINKS = 63;
export const MAX_DAYS_OLD = 21;
export const POSITIVE_THRESHOLD = 0.75;

export const POSTED_LINKS_FILE = path.join(rootDir, "posted_links.txt");
export const RECENT_KEYWORDS_FILE = path.join(rootDir, "recent_keywords.txt");

export const PROGRESSIVE_KEYWORDS_SOCIAL_1 = [
  "progressive", "progressivism", "socialism", "socialist", "left wing",
  "left-wing", "leftist", "social justice", "inclusion", "fair wages",
  "income inequality", "income redistribution", "wealth inequality",
  "wealth tax", "progressive taxation", "anti-capitalism", "corporate accountability",
  "campaign finance reform", "campaign finance transparency", "corporate greed",
  "equality", "equal opportunity"
];

export const PROGRESSIVE_KEYWORDS_SOCIAL_2 = [
  "corporate profiteering", "billionaire tax", "tax the rich", "economic democracy",
  "solidarity economy", "economic justice", "community wealth building",
  "community land trust", "public ownership", "public investment",
  "fair treatment", "accessibility", "social justice", "progressive taxation",
  "wealth tax", "anti-capitalism", "corporate accountability", "campaign finance reform",
  "campaign finance transparency", "corporate greed", "solidarity economy", "economic democracy"
];

export const PROGRESSIVE_KEYWORDS_LABOR_1 = [
  "labor rights", "unionization", "right to strike", "collective bargaining",
  "worker rights", "workers' rights", "workers bill of rights", "labor movement",
  "gig economy", "living wage", "living wage jobs", "minimum wage", "tenant union",
  "tenant rights", "tenant protections", "good cause eviction", "cancel rent",
  "rent control", "universal rent control", "fair treatment", "equal opportunity", "accessibility"
];

export const PROGRESSIVE_KEYWORDS_LABOR_2 = [
  "affordable housing", "affordable housing for all", "housing affordability",
  "housing guarantee", "housing justice", "human right", "housing for all",
  "public housing", "build public housing", "community control", "NYCHA funding",
  "stop gentrification", "social housing", "cancel student debt", "abolish student debt",
  "student debt", "tuition free college", "free public college", "public education",
  "universal pre-k", "fair treatment", "inclusion", "equal opportunity"
];

export const PROGRESSIVE_KEYWORDS_LABOR_3 = [
  "public broadband", "childcare", "universal childcare", "paid family leave",
  "paid sick leave", "right to strike", "living wage", "fair treatment",
  "accessibility", "equal opportunity", "inclusion", "housing justice",
  "tenant protections", "cancel rent", "rent control", "public education",
  "universal pre-k", "affordable housing", "housing affordability", "public housing",
  "cancel student debt", "abolish student debt"
];

export const PROGRESSIVE_KEYWORDS_ENVIRONMENT_1 = [
  "climate justice", "environmental justice", "climate action", "green new deal",
  "green jobs", "climate jobs", "climate resilience", "pollution reduction",
  "fossil fuel divestment", "renewable energy", "green infrastructure", "decarbonization",
  "net zero emissions", "decarbonize economy", "zero emissions", "green transition",
  "environmental racism", "youth climate movement", "inclusion", "equality",
  "accessibility", "fair treatment"
];

export const PROGRESSIVE_KEYWORDS_CIVIL_RIGHTS_1 = [
  "black lives matter", "lgbtq rights", "trans rights", "transgender", "gender equality",
  "gay", "civil rights", "gender pay gap", "inclusivity", "racial disparities",
  "racial justice", "racial equity", "racial wealth gap", "racial solidarity",
  "racial justice organizing", "prison reform", "mass incarceration", "end mass incarceration",
  "decarceration", "abolish prisons", "inclusion", "equal opportunity"
];

export const PROGRESSIVE_KEYWORDS_CIVIL_RIGHTS_2 = [
  "prisoner rights", "prisoner's rights", "police accountability", "police abolition",
  "defund the police", "abolish ice", "immigrant rights", "immigrant defense",
  "sanctuary cities", "reproductive rights", "fair treatment", "accessibility",
  "racial justice", "mass incarceration", "prison reform", "civil rights",
  "lgbtq rights", "trans rights", "gender equality", "black lives matter",
  "racial equity", "inclusion"
];

export const PROGRESSIVE_KEYWORDS_PUBLIC_SERVICES_1 = [
  "public transit access", "public transportation", "transportation", "public option",
  "healthcare access", "universal healthcare", "medicare for all", "medicare expansion",
  "expanding medicare", "single payer healthcare", "medicare", "medicaid", "dignity in retirement",
  "free public college", "tuition free college", "public broadband", "childcare",
  "universal childcare", "paid family leave", "paid sick leave", "public housing", "fair treatment"
];

export const PROGRESSIVE_KEYWORDS_PUBLIC_SERVICES_2 = [
  "public education", "universal pre-k", "inclusion", "equal opportunity", "accessibility",
  "healthcare access", "medicare for all", "tuition free college", "paid family leave",
  "childcare", "public broadband", "medicaid", "medicare", "public housing",
  "free public college", "single payer healthcare", "universal childcare",
  "public transit access", "public transportation", "public option", "dignity in retirement", "fair treatment"
];

export const PROGRESSIVE_KEYWORDS_PERSONALITIES = [
  "bernie sanders", "jasmine crockett", "alexandria ocasio-cortez", "zohran mamdani", "elizabeth warren",
  "rashida tlaib", "ilhan omar", "ayanna pressley", "cori bush", "pramila jayapal",
  "jamal bowman", "ro khanna", "maxine waters", "stacey abrams", "kristen gillibrand"
];

// Aggregate all keyword groups for looping in bot.ts
export const ALL_KEYWORD_GROUPS = [
  PROGRESSIVE_KEYWORDS_SOCIAL_1,
  PROGRESSIVE_KEYWORDS_SOCIAL_2,
  PROGRESSIVE_KEYWORDS_LABOR_1,
  PROGRESSIVE_KEYWORDS_LABOR_2,
  PROGRESSIVE_KEYWORDS_LABOR_3,
  PROGRESSIVE_KEYWORDS_ENVIRONMENT_1,
  PROGRESSIVE_KEYWORDS_CIVIL_RIGHTS_1,
  PROGRESSIVE_KEYWORDS_CIVIL_RIGHTS_2,
  PROGRESSIVE_KEYWORDS_PUBLIC_SERVICES_1,
  PROGRESSIVE_KEYWORDS_PUBLIC_SERVICES_2,
  PROGRESSIVE_KEYWORDS_PERSONALITIES,
];
