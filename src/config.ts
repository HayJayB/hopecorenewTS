import path from "path";

const rootDir = process.cwd();

export const MAX_POSTED_LINKS = 63;
export const MAX_DAYS_OLD = 14;
export const POSITIVE_THRESHOLD = 0.75;

export const POSTED_LINKS_FILE = path.join(rootDir, "posted_links.txt");
export const RECENT_KEYWORDS_FILE = path.join(rootDir, "recent_keywords.txt");

export const PROGRESSIVE_KEYWORDS_SOCIAL_1 = [
  "progressive", "progressivism", "socialism", "socialist", "left wing",
  "left-wing", "leftist", "social justice", "equity", "fair wages",
  "income inequality", "income redistribution", "wealth inequality",
  "wealth tax", "progressive taxation", "anti-capitalism", "corporate accountability",
  "campaign finance reform", "campaign finance transparency", "corporate greed",
  "corporate profiteering", "billionaire tax"
];

export const PROGRESSIVE_KEYWORDS_SOCIAL_2 = [
  "corporate profiteering", "billionaire tax", "tax the rich", "economic democracy",
  "solidarity economy", "economic justice", "community wealth building",
  "community land trust", "public ownership", "public investment",
  "progressive", "social justice", "wealth inequality", "wealth tax", "fair wages",
  "anti-capitalism", "campaign finance reform", "corporate greed",
  "equity", "income inequality", "socialism", "left-wing"
];

export const PROGRESSIVE_KEYWORDS_LABOR_1 = [
  "labor rights", "unionization", "right to strike", "collective bargaining",
  "worker rights", "workers' rights", "workers bill of rights", "labor movement",
  "gig economy", "living wage", "living wage jobs", "minimum wage", "tenant union",
  "tenant rights", "tenant protections", "good cause eviction", "cancel rent",
  "rent control", "universal rent control", "fair wages", "public housing",
  "affordable housing"
];

export const PROGRESSIVE_KEYWORDS_LABOR_2 = [
  "affordable housing", "affordable housing for all", "housing affordability",
  "housing guarantee", "housing justice", "human right", "housing for all",
  "public housing", "build public housing", "community control", "NYCHA funding",
  "stop gentrification", "social housing", "cancel student debt", "abolish student debt",
  "student debt", "tuition free college", "free public college", "public education",
  "universal pre-k", "rent control", "tenant protections"
];

export const PROGRESSIVE_KEYWORDS_LABOR_3 = [
  "public broadband", "childcare", "universal childcare", "paid family leave",
  "paid sick leave", "right to strike", "living wage", "minimum wage", "unionization",
  "labor rights", "worker rights", "workers' rights", "collective bargaining",
  "fair wages", "affordable housing", "tuition free college", "free public college",
  "public education", "universal pre-k", "public housing", "cancel rent",
  "rent control"
];

export const PROGRESSIVE_KEYWORDS_ENVIRONMENT_1 = [
  "climate justice", "environmental justice", "climate action", "green new deal",
  "green jobs", "climate jobs", "climate resilience", "pollution reduction",
  "fossil fuel divestment", "renewable energy", "green infrastructure",
  "decarbonization", "net zero emissions", "decarbonize economy",
  "zero emissions", "green transition", "environmental racism",
  "youth climate movement", "public investment", "solidarity economy",
  "pollution control", "sustainability"
];

export const PROGRESSIVE_KEYWORDS_CIVIL_RIGHTS_1 = [
  "black lives matter", "lgbtq rights", "trans rights", "transgender", "gender equality",
  "gay", "civil rights", "gender pay gap", "inclusivity", "racial disparities",
  "racial justice", "racial equity", "racial wealth gap", "racial solidarity",
  "racial justice organizing", "prison reform", "mass incarceration",
  "end mass incarceration", "decarceration", "abolish prisons",
  "prisoner rights", "police accountability"
];

export const PROGRESSIVE_KEYWORDS_CIVIL_RIGHTS_2 = [
  "prisoner rights", "prisoner's rights", "police accountability", "police abolition",
  "defund the police", "abolish ice", "immigrant rights", "immigrant defense",
  "sanctuary cities", "reproductive rights", "civil rights", "black lives matter",
  "inclusivity", "racial justice", "racial equity", "racial disparities",
  "gender equality", "trans rights", "mass incarceration", "end mass incarceration",
  "decarceration", "abolish prisons"
];

export const PROGRESSIVE_KEYWORDS_PUBLIC_SERVICES_1 = [
  "public transit access", "public transportation", "transportation", "public option",
  "healthcare access", "universal healthcare", "medicare for all", "medicare expansion",
  "expanding medicare", "single payer healthcare", "medicare", "medicaid",
  "dignity in retirement", "free public college", "tuition free college",
  "public broadband", "childcare", "universal childcare", "paid family leave",
  "paid sick leave", "public housing", "public education"
];

export const PROGRESSIVE_KEYWORDS_PUBLIC_SERVICES_2 = [
  "public education", "universal pre-k", "free public college", "tuition free college",
  "public broadband", "universal childcare", "childcare", "paid family leave",
  "paid sick leave", "public housing", "public option", "healthcare access",
  "medicare for all", "medicare", "medicaid", "universal healthcare",
  "medicare expansion", "expanding medicare", "single payer healthcare",
  "public transportation", "public transit access", "transportation"
];

export const PROGRESSIVE_KEYWORDS_PERSONALITIES = [
  "bernie sanders", "aoc", "alexandria ocasio-cortez", "zohran mamdani",
  "zohran", "mamdani", "elizabeth warren", "ilhan omar", "rashida tlaib",
  "cori bush", "pramila jayapal", "ayanna pressley", "nina turner",
  "jamaal bowman", "summer lee", "katie porter", "barbara lee",
  "john fetterman", "ed markey", "ro khanna", "mark pocan", "mondaire jones"
];

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
  PROGRESSIVE_KEYWORDS_PERSONALITIES
];
