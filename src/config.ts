import path from "path";

const rootDir = process.cwd();

export const MAX_POSTED_LINKS = 63;
export const MAX_DAYS_OLD = 21;
export const POSITIVE_THRESHOLD = 0.80;

export const POSTED_LINKS_FILE = path.join(rootDir, "posted_links.txt");
export const RECENT_KEYWORDS_FILE = path.join(rootDir, "recent_keywords.txt");

export const PROGRESSIVE_KEYWORDS_SOCIAL_1 = [
  "progressive", "progressivism", "socialism", "socialist", "left wing",
  "left-wing", "leftist", "social justice", "inclusion", "fair wages",
  "income", "redistribution", "inequality", "wealth tax", "progressive taxation", 
  "anti-capitalism", "accountability", "reform", "campaign", 
  "corporate", "greed", "equality", "oversight", "government"
];

export const PROGRESSIVE_KEYWORDS_SOCIAL_2 = [
  "corporate profiteering", "billionaire", "economic democracy",
  "solidarity", "working class", "economic justice", "community", "education",
  "public sector", "fair treatment", "accessibility", "social justice", "progressive taxation",
  "wealth tax", "anti-capitalism", "corporate accountability", "campaign finance reform",
  "corporate greed", "solidarity", "middle class", "democracy"
];

export const PROGRESSIVE_KEYWORDS_LABOR_1 = [
  "labor rights", "unionization", "right to strike", "collective bargaining",
  "worker", "bill of rights", "labor movement", "middle class", "living wage", 
  "living wage jobs", "minimum wage", "tenant",  "union", "rights", 
  "protections", "rent", "rent control", "universal programs", "fair treatment", "equal opportunity", "accessibility"
];

export const PROGRESSIVE_KEYWORDS_LABOR_2 = [
  "affordable", "housing", "guarantee", "human right", "DemSoc",
  "public housing", "working class", "build back better", "community control", "funding",
  "gentrification", "social housing", "student loan", "abolish",
  "student debt", "tuition", "free college", "forgiveness", "public education",
  "universal healthcare", "pre-k", "fair treatment", "inclusion", "equal opportunity"
];

export const PROGRESSIVE_KEYWORDS_LABOR_3 = [
  "kindergarten", "childcare", "paid family", "paid sick", "right to strike", "living wage", 
  "fair treatment", "accessibility", "equal opportunity", "inclusion",
  "tenant protections", "cancel rent", "rent control", "public education",
  "affordable housing", "housing affordability", "public housing",
  "cancel student debt", "abolish student debt"
];

export const PROGRESSIVE_KEYWORDS_ENVIRONMENT_1 = [
  "climate", "environment", "action", "accessibility", "fair treatment",
  "green jobs", "climate jobs", "climate resilience", "pollution reduction",
  "divestment", "renewable energy", "infrastructure", "decarbonization",
  "net zero emissions", "decarbonize economy", "zero emissions", "transition",
  "environmental racism", "youth climate movement", "inclusion", "equality", "racism"
];

export const PROGRESSIVE_KEYWORDS_CIVIL_RIGHTS_1 = [
  "black lives matter", "lgbtq", "trans rights", "transgender", "gender equality",
  "gay", "civil rights", "wage gap", "inclusivity", "racial", "disparities",
  "racial equity", "pay gap", "racial solidarity", "prisoners",
  "racial justice", "organizing", "prison reform", "mass incarceration",
  "decarceration", "abolish prisons", "inclusion", "equal opportunity"
];

export const PROGRESSIVE_KEYWORDS_CIVIL_RIGHTS_2 = [
  "prisoner rights", "prisoner's rights", "police accountability", "police abolition",
  "defund the police", "abolish ice", "immigrant rights", "immigrant defense",
  "sanctuary cities", "pro choice", "fair treatment", "accessibility",
  "racial justice", "mass incarceration", "prison reform", "civil rights",
  "lgbtq rights", "trans rights", "gender equality", "black lives matter",
  "racial equity", "inclusion"
];

export const PROGRESSIVE_KEYWORDS_PUBLIC_SERVICES_1 = [
  "public transit", "service access", "public sector", "transportation", "public option",
  "healthcare", "labor movement", "medicare", "expansion", "expand", "bodily autonomy",
  "single payer", "medicare", "medicaid", "dignity", "retirement",
  "tuition", "free college", "indigenous", "childcare", "abortion rights",
  "universal childcare", "public housing", "fair treatment"
];

export const PROGRESSIVE_KEYWORDS_PUBLIC_SERVICES_2 = [
  "public education", "ethics", "pre-k", "inclusion", "equal opportunity", "accessibility",
  "healthcare access", "free college", "paid family leave", "low cost",
  "childcare", "public broadband", "medicaid", "medicare", "public housing",
  "free public college", "single payer", "healthcare", "public transit access", 
  "public transportation", "equal"
];

export const PROGRESSIVE_KEYWORDS_PERSONALITIES = [
  "bernie sanders", "jasmine crockett", "alexandria ocasio-cortez", "zohran mamdani", "elizabeth warren",
  "rashida tlaib", "ilhan omar", "ayanna pressley", "cori bush", "pramila jayapal", "greg casar",
  "jamal bowman", "ro khanna", "maxine waters", "stacey abrams", "kristen gillibrand", "robert garcia"
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
