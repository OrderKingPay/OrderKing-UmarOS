/**
 * Supreme Multilingual Indian Dish Autocorrect & Predictive Matcher
 * Supports phonetically typed and regional language variations of popular Indian dishes
 * across English, Hindi (हिन्दी), Bengali (বাংলা), and Assamese (অসমীয়া).
 */

export interface DishVariationGroup {
  id: string;
  canonicalName: string;
  hindiName: string;
  bengaliName: string;
  assameseName: string;
  cuisine: string;
  tags: string[];
  variations: string[];
}

export interface MultilingualMatchResult {
  matched: boolean;
  dishGroupId: string | null;
  canonicalName: string | null;
  matchedVariation: string | null;
  language: "en" | "hi" | "bn" | "as" | "phonetic" | null;
  confidence: number; // 0.0 to 1.0
  suggestedQueries: string[];
}

/**
 * Registry of popular Indian dishes with cross-lingual and phonetic variants.
 */
export const MULTILINGUAL_DISH_REGISTRY: DishVariationGroup[] = [
  {
    id: "biryani",
    canonicalName: "Biryani",
    hindiName: "बिरयानी",
    bengaliName: "বিরিয়ানি",
    assameseName: "বিৰিয়ানি",
    cuisine: "Biryani",
    tags: ["dum biryani", "murgh biryani", "hyderabadi", "chicken biryani", "rice"],
    variations: [
      "biryani",
      "biriyani",
      "briyani",
      "biryany",
      "biriani",
      "बिरयानी",
      "बिरियानी",
      "বিরিয়ানি",
      "বিৰিয়ানি",
      "dum biryani",
      "murgh biryani",
      "chicken biryani",
      "veg biryani",
      "dum biriyani",
      "মটন বিরিয়ানি",
      "চিকেন বিরিয়ানি",
    ],
  },
  {
    id: "momos",
    canonicalName: "Momos",
    hindiName: "मोमोज",
    bengaliName: "মোমো",
    assameseName: "মোমো",
    cuisine: "Momos",
    tags: ["dumplings", "steamed momo", "fried momo", "dim sum", "tibetan"],
    variations: [
      "momos",
      "momo",
      "momoz",
      "मोमोज",
      "मोमो",
      "মোমো",
      "মমো",
      "dumplings",
      "steamed momo",
      "fried momos",
      "chilli momos",
      "paneer momo",
      "chicken momo",
      "স্টিমড মোমো",
      "ডাম্পলিং",
    ],
  },
  {
    id: "thali",
    canonicalName: "Thali",
    hindiName: "थाली",
    bengaliName: "থালি",
    assameseName: "থালি",
    cuisine: "North Indian",
    tags: ["special thali", "deluxe thali", "bengali thali", "south indian thali", "meal"],
    variations: [
      "thali",
      "thaali",
      "थाली",
      "থালি",
      "দক্ষিণ ভারতীয় থালি",
      "special thali",
      "deluxe thali",
      "rajdhani thali",
      "veg thali",
      "bengali thali",
      "assamese thali",
      "স্পেশাল থালি",
      "দাল মাখানি থালি",
    ],
  },
  {
    id: "rolls",
    canonicalName: "Rolls",
    hindiName: "रोल",
    bengaliName: "কাঠি রোল",
    assameseName: "কাঠি ৰোল",
    cuisine: "Rolls",
    tags: ["kathi roll", "chicken roll", "paneer roll", "frankie", "wrap"],
    variations: [
      "roll",
      "rolls",
      "kathi roll",
      "kathi rolls",
      "रोल",
      "काठी रोल",
      "কাঠি রোল",
      "কাঠি ৰোল",
      "chicken roll",
      "paneer roll",
      "egg roll",
      "চিকেন রোল",
      "পনির রোল",
      "চিকেন কাঠি রোল",
    ],
  },
  {
    id: "dosa",
    canonicalName: "Dosa",
    hindiName: "दोसा",
    bengaliName: "দোসা",
    assameseName: "দোসা",
    cuisine: "South Indian",
    tags: ["masala dosa", "crispy dosa", "ghee roast", "dhosa", "south indian"],
    variations: [
      "dosa",
      "dhosa",
      "dosai",
      "dhoshai",
      "दोसा",
      "ढोसा",
      "দোসা",
      "ধোসা",
      "masala dosa",
      "masala dhosa",
      "crispy masala dosa",
      "mysore masala dosa",
      "মসলা দোসা",
      "মচমচে দোসা",
    ],
  },
  {
    id: "chaat",
    canonicalName: "Chaat",
    hindiName: "चाट",
    bengaliName: "চাট",
    assameseName: "চাট",
    cuisine: "Street Food",
    tags: ["golgappa", "fuchka", "phuchka", "pani puri", "puchka", "street bites"],
    variations: [
      "chaat",
      "chat",
      "चाट",
      "চাট",
      "golgappa",
      "gol gappa",
      "गोलगप्पा",
      "fuchka",
      "phuchka",
      "ফুচকা",
      "phuchka",
      "পানি পুৰী",
      "pani puri",
      "panipuri",
      "पानी पूरी",
      "dahi puri",
      "sev puri",
      "দহি ফুচকা",
    ],
  },
  {
    id: "pizza",
    canonicalName: "Pizza",
    hindiName: "पिज़्ज़ा",
    bengaliName: "পিজ্জা",
    assameseName: "পিজা",
    cuisine: "Pizza",
    tags: ["margherita", "sourdough", "cheese", "italian"],
    variations: [
      "pizza",
      "pizzas",
      "पिज़्ज़ा",
      "पिज़्ज़ा",
      "পিজ্জা",
      "পিজা",
      "margherita",
      "margherita pizza",
    ],
  },
  {
    id: "burger",
    canonicalName: "Burgers",
    hindiName: "बर्गर",
    bengaliName: "বার্গার",
    assameseName: "বাৰ্গাৰ",
    cuisine: "Burgers",
    tags: ["burger", "smash burger", "fries", "american"],
    variations: [
      "burger",
      "burgers",
      "बर्गर",
      "বার্গার",
      "বাৰ্গাৰ",
      "smash burger",
      "double smash",
    ],
  },
  {
    id: "coffee",
    canonicalName: "Cafe & Shakes",
    hindiName: "कॉफ़ी",
    bengaliName: "কফি",
    assameseName: "কফি",
    cuisine: "Cafe",
    tags: ["cold coffee", "shake", "frappe", "beverage"],
    variations: [
      "coffee",
      "cold coffee",
      "कॉफ़ी",
      "कॉफी",
      "কফি",
      "কোল্ড কফি",
      "shakes",
      "shake",
    ],
  },
  {
    id: "paneer",
    canonicalName: "Paneer Butter Masala",
    hindiName: "पनीर बटर मसाला",
    bengaliName: "পনির বাটার মসলা",
    assameseName: "পনীৰ বাটাৰ মচলা",
    cuisine: "North Indian",
    tags: ["paneer", "cottage cheese", "curry"],
    variations: [
      "paneer",
      "paneer butter masala",
      "पनीर",
      "पनीर बटर मसाला",
      "পনির",
      "পনির বাটার মসলা",
      "পনীৰ",
      "cottage cheese",
    ],
  },
  {
    id: "butter-chicken",
    canonicalName: "Butter Chicken",
    hindiName: "बटर चिकन",
    bengaliName: "বাটার চিকেন",
    assameseName: "বাটাৰ চিকেন",
    cuisine: "North Indian",
    tags: ["murgh makhani", "chicken makhani", "butter chicken", "tandoori chicken", "gravy", "curry"],
    variations: [
      "butter chicken",
      "butterchicken",
      "murgh makhani",
      "chicken makhani",
      "murg makhani",
      "बटर चिकन",
      "मुर्ग मखानी",
      "मुरग मखनी",
      "বাটার চিকেন",
      "মুরগ মাখানি",
      "বাটাৰ চিকেন",
      "মুৰ্গ মাখানি",
      "boneless butter chicken",
    ],
  },
];

/**
 * Detect writing script/language of the input query.
 */
export function detectQueryScript(text: string): "hi" | "bn" | "as" | "en" {
  if (!text) return "en";

  // Devanagari script range: \u0900-\u097F
  if (/[\u0900-\u097F]/.test(text)) {
    return "hi";
  }

  // Bengali / Assamese script range: \u0980-\u09FF
  // Assamese specific characters: ৰ (\u09F0), ৱ (\u09F1)
  if (/[\u09F0\u09F1]/.test(text)) {
    return "as";
  }
  if (/[\u0980-\u09FF]/.test(text)) {
    return "bn";
  }

  return "en";
}

/**
 * Normalize text for resilient matching across Indian scripts.
 * Strips zero-width characters, symbols, trims whitespace, and normalizes casing.
 */
export function normalizeMultilingualQuery(query: string): string {
  if (!query) return "";
  return query
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // Zero-width spaces and joiners
    .replace(/[\s\-_]+/g, " ") // Collapse whitespace and hyphens
    .trim();
}

/**
 * Simple Levenshtein distance for typo tolerance.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1, // deletion
        dp[i]![j - 1]! + 1, // insertion
        dp[i - 1]![j - 1]! + cost, // substitution
      );
    }
  }

  return dp[m]![n]!;
}

/**
 * Core multilingual match engine.
 * Matches any input query against the canonical registry with high confidence.
 */
export function matchMultilingualDish(rawQuery: string): MultilingualMatchResult {
  const query = normalizeMultilingualQuery(rawQuery);
  if (!query) {
    return {
      matched: false,
      dishGroupId: null,
      canonicalName: null,
      matchedVariation: null,
      language: null,
      confidence: 0,
      suggestedQueries: [],
    };
  }

  const script = detectQueryScript(rawQuery);

  // 1. Exact or Substring match against registered variations
  for (const group of MULTILINGUAL_DISH_REGISTRY) {
    for (const v of group.variations) {
      const normV = normalizeMultilingualQuery(v);
      if (normV === query) {
        return {
          matched: true,
          dishGroupId: group.id,
          canonicalName: group.canonicalName,
          matchedVariation: v,
          language: script === "en" ? "phonetic" : script,
          confidence: 1.0,
          suggestedQueries: [group.canonicalName, group.hindiName, group.bengaliName],
        };
      }

      // Substring match: query is contained inside variation or variation inside query
      if (
        (query.length >= 3 && normV.includes(query)) ||
        (normV.length >= 3 && query.includes(normV))
      ) {
        return {
          matched: true,
          dishGroupId: group.id,
          canonicalName: group.canonicalName,
          matchedVariation: v,
          language: script === "en" ? "phonetic" : script,
          confidence: 0.9,
          suggestedQueries: [group.canonicalName, group.hindiName, group.bengaliName],
        };
      }
    }
  }

  // 2. Fuzzy / Typo match (max distance 1 for short queries, 2 for longer)
  let bestMatch: {
    group: DishVariationGroup;
    variation: string;
    distance: number;
  } | null = null;

  for (const group of MULTILINGUAL_DISH_REGISTRY) {
    for (const v of group.variations) {
      const normV = normalizeMultilingualQuery(v);
      const dist = levenshteinDistance(query, normV);
      const maxAllowed = query.length <= 4 ? 1 : 2;

      if (dist <= maxAllowed) {
        if (!bestMatch || dist < bestMatch.distance) {
          bestMatch = { group, variation: v, distance: dist };
        }
      }
    }
  }

  if (bestMatch) {
    const confidence = Math.max(0.6, 1 - bestMatch.distance / Math.max(query.length, 5));
    return {
      matched: true,
      dishGroupId: bestMatch.group.id,
      canonicalName: bestMatch.group.canonicalName,
      matchedVariation: bestMatch.variation,
      language: script === "en" ? "phonetic" : script,
      confidence,
      suggestedQueries: [
        bestMatch.group.canonicalName,
        bestMatch.group.hindiName,
        bestMatch.group.bengaliName,
      ],
    };
  }

  return {
    matched: false,
    dishGroupId: null,
    canonicalName: null,
    matchedVariation: null,
    language: null,
    confidence: 0,
    suggestedQueries: [],
  };
}

/**
 * Checks whether a given dish item matches the query, incorporating
 * direct name/desc/cuisine match + multilingual Indian dish aliases.
 */
export function isMultilingualDishMatch(
  dish: {
    name: string;
    description?: string;
    cuisine?: string;
  },
  rawQuery: string,
): boolean {
  const q = normalizeMultilingualQuery(rawQuery);
  if (!q) return true;

  const dishNameNorm = normalizeMultilingualQuery(dish.name);
  const dishDescNorm = normalizeMultilingualQuery(dish.description || "");
  const dishCuisineNorm = normalizeMultilingualQuery(dish.cuisine || "");

  // Direct English / standard substring match
  if (
    dishNameNorm.includes(q) ||
    dishDescNorm.includes(q) ||
    dishCuisineNorm.includes(q)
  ) {
    return true;
  }

  // Cross-lingual match
  const matchResult = matchMultilingualDish(rawQuery);
  if (matchResult.matched && matchResult.canonicalName) {
    const canonicalNorm = normalizeMultilingualQuery(matchResult.canonicalName);
    const group = MULTILINGUAL_DISH_REGISTRY.find((g) => g.id === matchResult.dishGroupId);

    if (dishNameNorm.includes(canonicalNorm) || dishCuisineNorm.includes(canonicalNorm)) {
      return true;
    }

    if (group) {
      // Check tags or variations matching dish
      for (const tag of group.tags) {
        if (dishNameNorm.includes(tag) || dishDescNorm.includes(tag)) {
          return true;
        }
      }
      if (dishCuisineNorm.toLowerCase() === group.cuisine.toLowerCase()) {
        return true;
      }
    }
  }

  return false;
}
