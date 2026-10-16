/**
 * UMAR OS - Universal Intelligent Search & Multilingual Control Center
 * Authority: Supreme Founder Control Plane & Universal Systems Architect
 *
 * Core Capabilities:
 * 1. Indexes all 12 platform domains (UmarOS, Customer App, Partner App, Rider App,
 *    KingPay, API & Integrations, Affiliate & Referral, Marketing & CRM, Umar AI,
 *    Finance & BizOps, Geo Management, Infra & Security).
 * 2. Indexes settings, feature switches, routes, business parameters, and text dictionary keys.
 * 3. Native multilingual support for English, Hindi (हिन्दी), Bengali (বাংলা), and Assamese (অসমীয়া).
 * 4. Multi-directional cross-lingual synonyms dictionary, phonetic normalization (Indic + Roman),
 *    and typo-tolerant fuzzy matching (e.g. 'payout' matches 'settlement', 'भुगतान', 'পেমেন্ট', 'উপাৰ্জন').
 * 5. Grouped categorical search results with direct navigation action links and deep-links.
 */

import { z } from "zod";

// ============================================================================
// 1. DOMAINS, CATEGORIES & LOCALES SCHEMAS & TYPES
// ============================================================================

export const SupportedLocaleSchema = z.enum(["en", "hi", "bn", "as"]);
export type SupportedLocale = z.infer<typeof SupportedLocaleSchema>;

export const PlatformDomainIdSchema = z.enum([
  "umaros",
  "customer_app",
  "partner_app",
  "rider_app",
  "kingpay",
  "api_integrations",
  "affiliate_referral",
  "marketing_crm",
  "umar_ai",
  "finance_bizops",
  "geo_management",
  "infra_security",
]);
export type PlatformDomainId = z.infer<typeof PlatformDomainIdSchema>;

export const SearchResultCategorySchema = z.enum([
  "domain",
  "setting",
  "feature_switch",
  "route",
  "business_parameter",
  "dictionary_key",
  "action",
]);
export type SearchResultCategory = z.infer<typeof SearchResultCategorySchema>;

export const ActionTypeSchema = z.enum([
  "NAVIGATE",
  "OPEN_DRAWER",
  "TRIGGER_COMMAND",
  "INSPECT_PARAMETER",
  "TOGGLE_SWITCH",
]);
export type ActionType = z.infer<typeof ActionTypeSchema>;

export interface LocalizedText {
  en: string;
  hi?: string;
  bn?: string;
  as?: string;
}

export interface LocalizedKeywords {
  en: string[];
  hi?: string[];
  bn?: string[];
  as?: string[];
}

export interface NavigationActionLink {
  targetDomain: PlatformDomainId;
  targetApp: string;
  route: string;
  deepLink: string;
  actionType: ActionType;
  commandId?: string;
  parameters?: Record<string, unknown>;
}

export interface SearchIndexItem {
  id: string;
  domain: PlatformDomainId;
  category: SearchResultCategory;
  title: LocalizedText;
  description: LocalizedText;
  keywords: LocalizedKeywords;
  route?: string;
  deepLink?: string;
  actionType?: ActionType;
  commandId?: string;
  status?: "ACTIVE" | "BETA" | "DEPRECATED" | "CRITICAL";
  priority?: number; // 1 (highest) to 100 (lowest), default: 50
  metadata?: Record<string, unknown>;
}

export interface SearchResultItem {
  id: string;
  domain: PlatformDomainId;
  category: SearchResultCategory;
  title: string;
  description: string;
  localizedTitles: LocalizedText;
  localizedDescriptions: LocalizedText;
  actionLink: NavigationActionLink;
  score: number;
  matchReasons: string[];
  matchedTokens: string[];
  status: string;
  metadata?: Record<string, unknown>;
}

export interface GroupedSearchResult {
  query: string;
  normalizedQuery: string;
  detectedLocale: SupportedLocale;
  totalMatches: number;
  executionTimeMs: number;
  topResults: SearchResultItem[];
  resultsByDomain: Record<PlatformDomainId, SearchResultItem[]>;
  resultsByCategory: Record<SearchResultCategory, SearchResultItem[]>;
  matchedSynonyms: string[];
  suggestedCorrection?: string;
}

export interface MultilingualSearchOptions {
  domain?: PlatformDomainId | PlatformDomainId[];
  category?: SearchResultCategory | SearchResultCategory[];
  preferredLocale?: SupportedLocale;
  limit?: number;
  minScoreThreshold?: number;
  fuzzyThreshold?: number;
  enableSynonyms?: boolean;
  enablePhonetics?: boolean;
}

export interface AutocompleteSuggestion {
  text: string;
  targetId: string;
  domain: PlatformDomainId;
  category: SearchResultCategory;
  locale: SupportedLocale;
  actionLink: NavigationActionLink;
}

export interface IndexStats {
  totalItems: number;
  itemsByDomain: Record<PlatformDomainId, number>;
  itemsByCategory: Record<SearchResultCategory, number>;
  totalSynonymClusters: number;
  supportedLocales: SupportedLocale[];
}

// ============================================================================
// 2. 12 PLATFORM DOMAINS METADATA REGISTRY
// ============================================================================

export interface PlatformDomainDefinition {
  id: PlatformDomainId;
  name: LocalizedText;
  description: LocalizedText;
  targetApp: string;
  defaultRoute: string;
  deepLink: string;
}

export const PLATFORM_DOMAINS: readonly PlatformDomainDefinition[] = [
  {
    id: "umaros",
    name: {
      en: "UmarOS Core",
      hi: "उमर ओएस कोर",
      bn: "উমৰ ওএস কোর",
      as: "উমৰ ওএছ কোৰ",
    },
    description: {
      en: "Executive Operating System, workspace windowing, master dock, and founder control hub.",
      hi: "कार्यकारी ऑपरेटिंग सिस्टम, कार्यक्षेत्र विंडोज़, मास्टर डॉक और संस्थापक नियंत्रण हब।",
      bn: "এক্সিকিউটিভ অপারেটিং সিস্টেম, ওয়ার্কস্পেস উইন্ডোয়িং, মাস্টার ডক ও প্রতিষ্ঠাতা নিয়ন্ত্রণ হাব।",
      as: "কাৰ্যবাহী অপাৰেটিং চিষ্টেম, ৱৰ্কস্পেচ উইণ্ডোয়িং, মাষ্টাৰ ডক আৰু প্ৰতিষ্ঠাপক নিয়ন্ত্ৰণ কেন্দ্ৰ।",
    },
    targetApp: "umaros",
    defaultRoute: "/admin/workspace/overview",
    deepLink: "umaros://system/dashboard",
  },
  {
    id: "customer_app",
    name: {
      en: "Customer App",
      hi: "कस्टमर ऐप",
      bn: "গ্রাহক অ্যাপ",
      as: "গ্ৰাহক এপ",
    },
    description: {
      en: "Customer food ordering, grocery marketplace, real-time tracking, checkout, and ratings.",
      hi: "ग्राहक भोजन ऑर्डर, किराना बाज़ार, रीयल-टाइम ट्रैकिंग, चेकआउट और समीक्षाएं।",
      bn: "গ্রাহক খাবার অর্ডার, মুদি বাজার, রিয়েল-টাইম ট্র্যাকিং, চেকআউট এবং রেটিং।",
      as: "গ্ৰাহক খাদ্য অৰ্ডাৰ, গেলামাল বজাৰ, বাস্তৱ-সময়ৰ ট্ৰেকিং, চেকআউট আৰু ৰেটিং।",
    },
    targetApp: "customer",
    defaultRoute: "/apps/customer/feed",
    deepLink: "customer://home/feed",
  },
  {
    id: "partner_app",
    name: {
      en: "Partner App",
      hi: "पार्टनर ऐप (रेस्तरां)",
      bn: "পার্টনার অ্যাপ (রেস্তোরাঁ)",
      as: "পাৰ্টনাৰ এপ (ৰেস্তোৰাঁ)",
    },
    description: {
      en: "Merchant kitchen display system (KDS), menu manager, catalog inventory, and store dispatch.",
      hi: "मर्चेंट किचन डिस्प्ले सिस्टम (KDS), मेनू प्रबंधक, कैटलॉग इन्वेंट्री और स्टोर प्रेषण।",
      bn: "মার্চেন্ট কিচেন ডিসপ্লে সিস্টেম (KDS), মেনু ম্যানেজার, ক্যাটালগ ইনভেন্টরি ও দোকান প্রেরণ।",
      as: "ব্যৱসায়ী পাকঘৰ প্ৰদৰ্শন ব্যৱস্থা (KDS), মেনু ব্যৱস্থাপক, তালিকা মজুত আৰু দোকান প্ৰেৰণ।",
    },
    targetApp: "partner",
    defaultRoute: "/apps/partner/kds",
    deepLink: "partner://merchant/orders",
  },
  {
    id: "rider_app",
    name: {
      en: "Rider App",
      hi: "राइडर ऐप (डिलीवरी पार्टनर)",
      bn: "রাইডার অ্যাপ (ডেলিভারি পার্টনার)",
      as: "ৰাইডাৰ এপ (বিতৰক সংগী)",
    },
    description: {
      en: "Delivery partner dispatch, turn-by-turn navigation, instant payout wallet, and battery swap.",
      hi: "डिलीवरी पार्टनर प्रेषण, नेविगेशन, त्वरित भुगतान वॉलेट और बैटरी स्वैप।",
      bn: "ডেলিভারি পার্টনার প্রেরণ, নেভিগেশন, তাত্ক্ষণিক পেমেন্ট ওয়ালেট এবং ব্যাটারি অদলবদল।",
      as: "বিতৰণ সংগী প্ৰেৰণ, পথ নিৰ্দেশনা, তাৎক্ষণিক উপাৰ্জন ৱালেট আৰু বেটাৰী বিনিময়।",
    },
    targetApp: "rider",
    defaultRoute: "/apps/rider/fleet",
    deepLink: "rider://partner/dispatch",
  },
  {
    id: "kingpay",
    name: {
      en: "KingPay Financial",
      hi: "किंगपे भुगतान",
      bn: "কিংপে পেমেন্ট",
      as: "কিংপে পৰিশোধ",
    },
    description: {
      en: "UPI payment gateway, multilingual soundbox audio engine, split payouts, and automated settlement.",
      hi: "यूपीआई भुगतान गेटवे, बहुभाषी साउंडबॉक्स ऑडियो इंजन, विभाजित भुगतान और स्वचालित निपटान।",
      bn: "ইউপিআই পেমেন্ট গেটওয়ে, বহুভাষিক সাউন্ডবক্স অডিও ইঞ্জিন, বিভক্ত পেমেন্ট ও স্বয়ংক্রিয় নিষ্পত্তি।",
      as: "ইউপিআই পৰিশোধ গেটৱে, বহুভাষিক চাউণ্ডবক্স অডিঅ' ইঞ্জিন, বিভক্ত পৰিশোধ আৰু স্বয়ংক্ৰিয় নিষ্পত্তি।",
    },
    targetApp: "kingpay",
    defaultRoute: "/admin/kingpay/reconciliation",
    deepLink: "kingpay://settlements/overview",
  },
  {
    id: "api_integrations",
    name: {
      en: "API & Integrations",
      hi: "एपीआई और एकीकरण",
      bn: "এপিআই এবং ইন্টিগ্রেশন",
      as: "এপিআই আৰু সংহতি",
    },
    description: {
      en: "Webhooks, Model Context Protocol (MCP) servers, third-party POS connectors, and OAuth2.",
      hi: "वेबहुक, मॉडल संदर्भ प्रोटोकॉल (MCP) सर्वर, तृतीय-पक्ष POS कनेक्टर और OAuth2।",
      bn: "ওয়েবহুক, মডেল কনটেক্সট প্রোটোকল (MCP) সার্ভার, পিওএস সংযোগকারী ও OAuth2।",
      as: "ৱেবহুক, মডেল কনটেক্সট প্ৰট'কল (MCP) চাৰ্ভাৰ, পিঅ'এছ সংযোগী আৰু OAuth2।",
    },
    targetApp: "api",
    defaultRoute: "/admin/integrations/mcp",
    deepLink: "api://connectors/mcp-runtime",
  },
  {
    id: "affiliate_referral",
    name: {
      en: "Affiliate & Referral",
      hi: "एफिलिएट और रेफरल",
      bn: "অ্যাফিলিয়েট এবং রেফারেল",
      as: "এফিলিয়েট আৰু ৰেফাৰেল",
    },
    description: {
      en: "Influencer tracking, referral trees, viral growth incentives, and multi-tier commission ledger.",
      hi: "इन्फ्लुएंसर ट्रैकिंग, रेफरल ट्री, वायरल विकास प्रोत्साहन और बहुस्तरीय कमीशन बहीखाता।",
      bn: "ইনফ্লুয়েন্সার ট্র্যাকিং, রেফারেল ট্রি, ভাইরাল বৃদ্ধির প্রণোদনা ও বহু-স্তরীয় কমিশন খতিয়ান।",
      as: "ইনফ্লুৱেনচাৰ ট্ৰেকিং, ৰেফাৰেল বৃক্ষ, ভাইৰেল বৃদ্ধি উৎসাহ আৰু বহু-স্তৰীয় কমিচন খতিয়ান।",
    },
    targetApp: "affiliate",
    defaultRoute: "/admin/growth/referrals",
    deepLink: "affiliate://growth/commission-tree",
  },
  {
    id: "marketing_crm",
    name: {
      en: "Marketing & CRM",
      hi: "मार्केटिंग और सीआरएम",
      bn: "মার্কেটিং এবং সিআরএম",
      as: "মার্কেটিং আৰু চিআৰএম",
    },
    description: {
      en: "Targeted push notifications, WhatsApp/SMS broadcast, promo discount coupons, and loyalty tiers.",
      hi: "लक्षित पुश सूचनाएं, व्हाट्सएप/एसएमएस प्रसारण, प्रोमो डिस्काउंट कूपन और लॉयल्टी स्तर।",
      bn: "টার্গেটেড পুশ নোটিফিকেশন, হোয়াটসঅ্যাপ/এসএমএস সম্প্রচার, প্রোমো কুপন ও আনুগত্য স্তর।",
      as: "লক্ষ্যভিত্তিক পুশ জাননী, হোৱাটছএপ/এছএমএছ সম্প্ৰচাৰ, ৰেহাই কুপন আৰু আনুগত্য স্তৰ।",
    },
    targetApp: "marketing",
    defaultRoute: "/admin/marketing/campaigns",
    deepLink: "marketing://campaigns/vouchers",
  },
  {
    id: "umar_ai",
    name: {
      en: "Umar AI Hub",
      hi: "उमर एआई हब",
      bn: "উমর এআই হাব",
      as: "উমৰ এআই কেন্দ্ৰ",
    },
    description: {
      en: "Autonomous foundation model routing, prompt matrix studio, voice agent DSP, and visual recognition.",
      hi: "स्वायत्त फाउंडेशन मॉडल रूटिंग, प्रॉम्प्ट मैट्रिक्स स्टूडियो, वॉयस एजेंट डीएसपी और विज़न।",
      bn: "স্বায়ত্তশাসিত ফাউন্ডেশন মডেল রাউটিং, প্রম্পট ম্যাট্রিক্স স্টুডিও, ভয়েস এজেন্ট ও ভিশন।",
      as: "স্বায়ত্তশাসিত ফাউণ্ডেশ্যন মডেল ৰাউটিং, প্ৰম্পট ষ্টুডিঅ', মাত এজেণ্ট আৰু চিনাক্তকৰণ।",
    },
    targetApp: "umar_ai",
    defaultRoute: "/admin/ai/prompt-matrix",
    deepLink: "umar_ai://models/router",
  },
  {
    id: "finance_bizops",
    name: {
      en: "Finance & BizOps",
      hi: "वित्त और व्यापार संचालन",
      bn: "অর্থ ও বিজঅপস",
      as: "বিত্ত আৰু বিজঅপচ",
    },
    description: {
      en: "Double-entry accounting ledger, statutory GST & TDS, automated reconciliation, and merchant contracts.",
      hi: "डबल-एंट्री अकाउंटिंग लेज़र, वैधानिक जीएसटी व टीडीएस, स्वचालित मिलान और मर्चेंट अनुबंध।",
      bn: "ডাবল-এন্ট্রি অ্যাকাউন্টিং খতিয়ান, সংবিধিবদ্ধ জিএসটি ও টিডিএস, স্বয়ংক্রিয় সমন্বয় ও চুক্তি।",
      as: "দ্বৈত-নথিভুক্ত হিচাপ খতিয়ান, জিএছটি আৰু টিডিএছ, স্বয়ংক্ৰিয় সমন্বয় আৰু চুক্তি।",
    },
    targetApp: "finance",
    defaultRoute: "/admin/finance/ledger",
    deepLink: "finance://ledger/double-entry",
  },
  {
    id: "geo_management",
    name: {
      en: "Geo Management",
      hi: "भू-प्रबंधन और ज़ोन",
      bn: "জিও ম্যানেজমেন্ট ও জোন",
      as: "ভৌগোলিক ব্যৱস্থাপনা আৰু এলেকা",
    },
    description: {
      en: "Geofencing polygons, dynamic surge pricing clusters, OSRM road routing, and fleet density heatmaps.",
      hi: "जियोफेंसिंग बहुभुज, गतिशील सर्ज मूल्य निर्धारण क्लस्टर, ओएसआरएम रूटिंग और बेड़े का नक्शा।",
      bn: "জিওফেন্সিং বহুভুজ, গতিশীল মূল্য বৃদ্ধি ক্লাস্টার, ওএসআরএম রুট এবং ফ্লিট হিটম্যাপ।",
      as: "জিওফেন্সিং বহুভুজ, গতিশীল অতিৰিক্ত মাচুল এলেকা, ওএছআৰএম বাট আৰু ঘনত্ব মানচিত্ৰ।",
    },
    targetApp: "geo",
    defaultRoute: "/admin/geo/polygons",
    deepLink: "geo://polygons/surge-zones",
  },
  {
    id: "infra_security",
    name: {
      en: "Infra & Security",
      hi: "इन्फ्रा और सुरक्षा",
      bn: "ইনফ্রা ও নিরাপত্তা",
      as: "ইনফ্ৰা আৰু সুৰক্ষা",
    },
    description: {
      en: "Cloudflare edge caches, Redis clusters, RBAC permission gate, WAF firewalls, and killswitches.",
      hi: "क्लाउडफ्लेयर एज कैश, रेडिस क्लस्टर, आरबीएसी अनुमति गेट, डब्ल्यूएएफ फ़ायरवॉल और किल-स्विच।",
      bn: "ক্লাউডফ্লেয়ার এজ ক্যাশ, রেডিস ক্লাস্টার, আরবিএসি অনুমতি গেট, ফায়ারওয়াল এবং কিলসুইচ।",
      as: "ক্লাউডফ্লেয়াৰ কেচ, ৰেডিচ ক্লাষ্টাৰ, আৰবিএচি প্ৰৱেশাধিকাৰ, নিৰাপত্তা বেষ্টনী আৰু জৰুৰী চুইচ।",
    },
    targetApp: "infra",
    defaultRoute: "/admin/security/audit",
    deepLink: "infra://security/killswitches",
  },
];

// ============================================================================
// 3. SCRIPT DETECTION & PHONETIC NORMALIZATION (INDIC & ROMAN)
// ============================================================================

/**
 * Detects whether a string is written in Devanagari, Bengali, Assamese, or English/Latin.
 */
export function detectLocale(text: string): SupportedLocale {
  if (!text) return "en";

  // Check for Assamese-specific characters: ৰ (09F0) and ৱ (09F1)
  if (/[\u09F0\u09F1]/.test(text)) {
    return "as";
  }

  // Check for Bengali / Eastern Nagari block (0980-09FF)
  if (/[\u0980-\u09FF]/.test(text)) {
    return "bn";
  }

  // Check for Devanagari block (0900-097F)
  if (/[\u0900-\u097F]/.test(text)) {
    return "hi";
  }

  // Check common transliterated words to detect intent
  const lower = text.toLowerCase();
  if (
    lower.includes("bhugtan") ||
    lower.includes("aapatkal") ||
    lower.includes("shulk") ||
    lower.includes("niptan") ||
    lower.includes("chalak")
  ) {
    return "hi";
  }
  if (
    lower.includes("pement") ||
    lower.includes("nishpotti") ||
    lower.includes("uttolon") ||
    lower.includes("joruri") ||
    lower.includes("taka") ||
    lower.includes("dokandar")
  ) {
    return "bn";
  }
  if (
    lower.includes("uparjan") ||
    lower.includes("bitoron") ||
    lower.includes("porishodh") ||
    lower.includes("rehai") ||
    lower.includes("toka")
  ) {
    return "as";
  }

  return "en";
}

/**
 * Transliterates Indic scripts (Devanagari, Bengali, Assamese) into simplified Roman phonetics.
 */
export function indicToRomanPhonetic(input: string): string {
  if (!input) return "";

  // Devanagari mapping
  const devanagariMap: Record<string, string> = {
    // Vowels
    अ: "a",
    आ: "a",
    इ: "i",
    ई: "i",
    उ: "u",
    ऊ: "u",
    ऋ: "ri",
    ए: "e",
    ऐ: "ai",
    ओ: "o",
    औ: "au",
    // Matras
    "ा": "a",
    "ि": "i",
    "ी": "i",
    "ु": "u",
    "ू": "u",
    "ृ": "ri",
    "े": "e",
    "ै": "ai",
    "ो": "o",
    "ौ": "au",
    // Anusvara, Visarga, Virama
    "ं": "n",
    "ः": "h",
    "्": "",
    "ँ": "n",
    // Consonants
    क: "k",
    ख: "kh",
    ग: "g",
    घ: "gh",
    ङ: "ng",
    च: "ch",
    छ: "chh",
    ज: "j",
    झ: "jh",
    ञ: "ny",
    ट: "t",
    ठ: "th",
    ड: "d",
    ढ: "dh",
    ण: "n",
    त: "t",
    थ: "th",
    द: "d",
    ध: "dh",
    न: "n",
    प: "p",
    फ: "ph",
    ब: "b",
    भ: "bh",
    म: "m",
    य: "y",
    र: "r",
    ल: "l",
    व: "v",
    श: "sh",
    ष: "sh",
    स: "s",
    ह: "h",
    ड़: "r",
    ढ़: "rh",
    फ़: "f",
    ज़: "z",
  };

  // Bengali / Assamese mapping
  const bengaliAssameseMap: Record<string, string> = {
    // Vowels
    অ: "o",
    আ: "a",
    ই: "i",
    ঈ: "i",
    উ: "u",
    ঊ: "u",
    ঋ: "ri",
    এ: "e",
    ঐ: "oi",
    ও: "o",
    ঔ: "ou",
    // Matras
    "া": "a",
    "ি": "i",
    "ী": "i",
    "ু": "u",
    "ূ": "u",
    "ৃ": "ri",
    "ে": "e",
    "ৈ": "oi",
    "ো": "o",
    "ৌ": "ou",
    // Signs
    "্": "",
    "ং": "ng",
    "ঃ": "h",
    "ঁ": "n",
    // Consonants
    ক: "k",
    খ: "kh",
    গ: "g",
    ঘ: "gh",
    ঙ: "ng",
    চ: "ch",
    ছ: "chh",
    জ: "j",
    ঝ: "jh",
    ঞ: "ny",
    ট: "t",
    ঠ: "th",
    ড: "d",
    ঢ: "dh",
    ণ: "n",
    ত: "t",
    থ: "th",
    দ: "d",
    ধ: "dh",
    ন: "n",
    প: "p",
    ফ: "ph",
    ব: "b",
    ভ: "bh",
    ম: "m",
    য: "j",
    য়: "y",
    র: "r",
    ল: "l",
    শ: "sh",
    ষ: "sh",
    স: "s",
    হ: "h",
    ড়: "r",
    ঢ়: "rh",
    ৎ: "t",
    // Assamese specific
    ৰ: "r",
    ৱ: "w",
  };

  let out = "";
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (devanagariMap[char] !== undefined) {
      out += devanagariMap[char];
    } else if (bengaliAssameseMap[char] !== undefined) {
      out += bengaliAssameseMap[char];
    } else {
      out += char;
    }
  }
  return out;
}

/**
 * Phonetic normalizer: compresses double characters, standardizes sibilants and labials,
 * maps aspirated consonants, and produces canonical sound representations.
 */
export function phoneticNormalize(text: string): string {
  if (!text) return "";

  // First convert any Indic characters to Roman phonetics
  let s = indicToRomanPhonetic(text.toLowerCase().trim());

  // Replace punctuation and symbols with spaces
  s = s.replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();

  // Common phonetic reductions
  s = s
    .replace(/ph/g, "f")
    .replace(/kh/g, "k")
    .replace(/gh/g, "g")
    .replace(/chh/g, "ch")
    .replace(/jh/g, "j")
    .replace(/th/g, "t")
    .replace(/dh/g, "d")
    .replace(/bh/g, "b")
    .replace(/sh/g, "s")
    .replace(/sch/g, "s")
    .replace(/ee/g, "i")
    .replace(/oo/g, "u")
    .replace(/v/g, "w")
    .replace(/z/g, "j")
    .replace(/c(?=[eiy])/g, "s")
    .replace(/c/g, "k")
    .replace(/(.)\1+/g, "$1"); // remove duplicate consecutive letters

  return s;
}

// ============================================================================
// 4. FUZZY MATCHING (LEVENSHTEIN & DAMERAU)
// ============================================================================

/**
 * Computes Levenshtein edit distance between two strings with early exit.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const alen = a.length;
  const blen = b.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= alen; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= blen; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= alen; i++) {
    for (let j = 1; j <= blen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let min = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );

      // Damerau transposition check
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        min = Math.min(min, matrix[i - 2][j - 2] + 1);
      }

      matrix[i][j] = min;
    }
  }

  return matrix[alen][blen];
}

/**
 * Calculates string similarity score between 0.0 and 1.0.
 */
export function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(a, b);
  return Math.max(0, 1 - dist / maxLen);
}

// ============================================================================
// 5. CROSS-LINGUAL MULTI-DIRECTIONAL SYNONYMS THESAURUS
// ============================================================================

export interface SynonymCluster {
  canonical: string;
  terms: string[];
}

/**
 * Authoritative cross-lingual synonym clusters spanning English, Hindi, Bengali,
 * and Assamese, plus common phonetic transliterations.
 */
export const CORE_SYNONYM_CLUSTERS: readonly SynonymCluster[] = [
  {
    canonical: "payout",
    terms: [
      "payout",
      "payouts",
      "settlement",
      "settlements",
      "disbursement",
      "withdrawal",
      "cashout",
      "transfer",
      "payout_engine",
      // Hindi
      "भुगतान",
      "निपटान",
      "निकासी",
      "वेतन",
      "रुपया",
      "पैसा",
      "bhugtan",
      "niptan",
      "nikasi",
      // Bengali
      "পেমেন্ট",
      "নিষ্পত্তি",
      "উত্তোলন",
      "টাকা",
      "পরিশোধ",
      "তহবিল",
      "pement",
      "nishpotti",
      "uttolon",
      "porishodh",
      "taka",
      // Assamese
      "উপাৰ্জন",
      "পৰিশোধ",
      "নিষ্কাষণ",
      "টকা",
      "ধন",
      "uparjan",
      "nishkaxon",
      "toka",
      "dhon",
    ],
  },
  {
    canonical: "order",
    terms: [
      "order",
      "orders",
      "booking",
      "bookings",
      "delivery",
      "cart",
      "checkout",
      "basket",
      // Hindi
      "ऑर्डर",
      "बुकिंग",
      "डिलीवरी",
      "खरीद",
      // Bengali
      "অর্ডার",
      "বুকিং",
      "ডেলিভারি",
      "ক্রয়",
      // Assamese
      "অৰ্ডাৰ",
      "বুকিং",
      "বিতৰণ",
      "ক্ৰয়",
      "ordar",
      "bitoron",
    ],
  },
  {
    canonical: "refund",
    terms: [
      "refund",
      "refunds",
      "reversal",
      "return",
      "chargeback",
      "cancellation_fee",
      // Hindi
      "वापसी",
      "रिफंड",
      "धन वापसी",
      "wapsi",
      // Bengali
      "রিফান্ড",
      "ফেরত",
      "টাকা ফেরত",
      "ferot",
      // Assamese
      "ওভতনি",
      "ধন ঘূৰাই দিয়া",
      "প্ৰতিদান",
      "obhotoni",
    ],
  },
  {
    canonical: "discount",
    terms: [
      "discount",
      "discounts",
      "coupon",
      "coupons",
      "voucher",
      "vouchers",
      "promo",
      "promotion",
      "cashback",
      "offer",
      // Hindi
      "छूट",
      "कूपन",
      "ऑफर",
      "रियायत",
      "chhoot",
      "kupon",
      // Bengali
      "ছাড়",
      "কুপন",
      "অফার",
      "রিয়াত",
      "chhar",
      // Assamese
      "ৰেহাই",
      "কুপন",
      "উপহাৰ",
      "সুবিধা",
      "rehai",
    ],
  },
  {
    canonical: "commission",
    terms: [
      "commission",
      "fee",
      "fees",
      "cut",
      "take_rate",
      "charges",
      "charge",
      "margin",
      // Hindi
      "कमीशन",
      "शुल्क",
      "दर",
      "फीस",
      "shulk",
      // Bengali
      "কমিশন",
      "ফি",
      "মাশুল",
      "হার",
      "mashul",
      // Assamese
      "কমিচন",
      "মাচুল",
      "দৰ",
      "শুল্ক",
      "komison",
      "masul",
    ],
  },
  {
    canonical: "rider",
    terms: [
      "rider",
      "riders",
      "driver",
      "drivers",
      "fleet",
      "courier",
      "delivery_partner",
      "agent",
      // Hindi
      "राइडर",
      "चालक",
      "डिलीवरी पार्टनर",
      "सवार",
      "chalak",
      // Bengali
      "রাইডার",
      "চালক",
      "ডেলিভারি বয়",
      "কুরিয়ার",
      // Assamese
      "ৰাইডাৰ",
      "চালক",
      "বিতৰক সংগী",
      "বাহন চালক",
      "raidar",
      "salok",
    ],
  },
  {
    canonical: "merchant",
    terms: [
      "merchant",
      "merchants",
      "partner",
      "partners",
      "restaurant",
      "restaurants",
      "store",
      "stores",
      "vendor",
      "shop",
      "kds",
      "kitchen",
      // Hindi
      "व्यापारी",
      "दुकानदार",
      "रेस्तरां",
      "रसोई",
      "दुकान",
      "vyapari",
      "dokandar",
      "rasoi",
      // Bengali
      "ব্যবসায়ী",
      "দোকানদার",
      "রেস্তোরাঁ",
      "রান্নাঘর",
      "দোকান",
      "byabosayi",
      "restora",
      "rannaghor",
      // Assamese
      "ব্যৱসায়ী",
      "দোকানদাৰ",
      "ৰেস্তোৰাঁ",
      "পাকঘৰ",
      "দোকান",
      "byawosayi",
      "pakghor",
    ],
  },
  {
    canonical: "emergency",
    terms: [
      "emergency",
      "killswitch",
      "kill_switch",
      "freeze",
      "lockdown",
      "shutdown",
      "halt",
      "freeze_system",
      // Hindi
      "आपातकाल",
      "आपातकालीन",
      "रोक",
      "बंद",
      "लॉकडाउन",
      "aapatkal",
      "bandh",
      // Bengali
      "জরুরী",
      "জরুরি",
      "স্থগিত",
      "লকডাউন",
      "বন্ধ",
      "joruri",
      "sthogit",
      // Assamese
      "জৰুৰী",
      "জৰুৰীকালীন",
      "বন্ধ",
      "স্থগিত",
      "নিষেধাজ্ঞা",
      "bondho",
    ],
  },
  {
    canonical: "soundbox",
    terms: [
      "soundbox",
      "audio",
      "speaker",
      "voice",
      "sound",
      "prompt",
      "announcement",
      "dsp",
      // Hindi
      "साउंडबॉक्स",
      "ध्वनि",
      "आवाज",
      "स्पीकर",
      "aawaz",
      "dhwani",
      // Bengali
      "সাউন্ডবক্স",
      "শব্দ",
      "ভয়েস",
      "স্পিকার",
      "shobdo",
      // Assamese
      "চাউণ্ডবক্স",
      "শব্দ",
      "মাত",
      "ধ্বনি",
      "স্পীকাৰ",
      "mat",
    ],
  },
  {
    canonical: "wallet",
    terms: [
      "wallet",
      "balance",
      "funds",
      "money",
      "credits",
      "deposit",
      // Hindi
      "वॉलेट",
      "बटुआ",
      "शेष",
      "पूंजी",
      "रकम",
      "batua",
      "shesh",
      // Bengali
      "ওয়ালেট",
      "মানিবেগ",
      "ব্যালেন্স",
      "টাকা",
      "জমা",
      "manibag",
      // Assamese
      "ৱালেট",
      "মানিবেগ",
      "ধন",
      "টকা",
      "মজুত",
    ],
  },
  {
    canonical: "surge",
    terms: [
      "surge",
      "peak",
      "demand",
      "multiplier",
      "hike",
      "dynamic_pricing",
      // Hindi
      "सर्ज",
      "मांग",
      "वृद्धि",
      "तेजी",
      // Bengali
      "সর্জ",
      "মূল্য বৃদ্ধি",
      "চাহিদা",
      // Assamese
      "অতিৰিক্ত মাচুল",
      "চাহিদা",
      "মূল্য বৃদ্ধি",
      "otirikto masul",
    ],
  },
  {
    canonical: "geofence",
    terms: [
      "geofence",
      "geofencing",
      "zone",
      "zones",
      "polygon",
      "polygons",
      "boundary",
      "map",
      "gps",
      "cluster",
      // Hindi
      "जियोफेंस",
      "क्षेत्र",
      "सीमा",
      "नक्शा",
      "दायरा",
      "kshetra",
      "seema",
      "naksha",
      // Bengali
      "জিওফেন্স",
      "এলাকা",
      "সীমানা",
      "মানচিত্র",
      "জোন",
      "elaka",
      "simana",
      "manchitra",
      // Assamese
      "জিওফেন্স",
      "এলেকা",
      "সীমা",
      "মানচিত্ৰ",
      "পৰিসীমা",
      "eleka",
      "porisima",
    ],
  },
  {
    canonical: "security",
    terms: [
      "security",
      "firewall",
      "rbac",
      "auth",
      "authorization",
      "permission",
      "permissions",
      "token",
      "audit",
      // Hindi
      "सुरक्षा",
      "फ़ायरवॉल",
      "अनुमति",
      "प्रमाणीकरण",
      "सुरक्षा नियम",
      "suraksha",
      // Bengali
      "নিরাপত্তা",
      "ফায়ারওয়াল",
      "অনুমতি",
      "প্রমাণীকরণ",
      "নিরীক্ষা",
      "nirapotta",
      // Assamese
      "সুৰক্ষা",
      "প্ৰৱেশাধিকাৰ",
      "নিৰাপত্তা",
      "অনুমতি",
      "পৰীক্ষণ",
      "surokkha",
    ],
  },
  {
    canonical: "customer",
    terms: [
      "customer",
      "customers",
      "user",
      "users",
      "buyer",
      "consumer",
      "client",
      // Hindi
      "ग्राहक",
      "उपभोक्ता",
      "यूज़र",
      "खरीदार",
      "grahak",
      // Bengali
      "গ্রাহক",
      "ক্রেতা",
      "ভোক্তা",
      "kreta",
      // Assamese
      "গ্ৰাহক",
      "ক্ৰেতা",
      "উপভোক্তা",
    ],
  },
  {
    canonical: "referral",
    terms: [
      "referral",
      "affiliate",
      "invite",
      "invitation",
      "bonus",
      "advocate",
      // Hindi
      "रेफरल",
      "एफिलिएट",
      "आमंत्रण",
      "इनाम",
      // Bengali
      "রেফারেল",
      "অ্যাফিলিয়েট",
      "আমন্ত্রণ",
      "পুরস্কার",
      // Assamese
      "ৰেফাৰেল",
      "এফিলিয়েট",
      "নিমন্ত্ৰণ",
      "পুৰস্কাৰ",
    ],
  },
  {
    canonical: "ai",
    terms: [
      "ai",
      "artificial_intelligence",
      "llm",
      "model",
      "prompt",
      "gemini",
      "deepseek",
      "claude",
      "voice_agent",
      // Hindi
      "एआई",
      "कृत्रिम बुद्धिमत्ता",
      "मॉडल",
      "प्रॉम्प्ट",
      // Bengali
      "এআই",
      "মডেল",
      "প্রম্পট",
      // Assamese
      "এআই",
      "মডেল",
      "প্ৰম্পট",
    ],
  },
  {
    canonical: "settings",
    terms: [
      "settings",
      "setting",
      "configuration",
      "config",
      "parameter",
      "preferences",
      "switch",
      "toggle",
      // Hindi
      "सेटिंग्स",
      "विन्यास",
      "कॉन्फ़िगरेशन",
      "विकल्प",
      // Bengali
      "সেটিংস",
      "কনফিগারেশন",
      "পছন্দসমূহ",
      // Assamese
      "ছেটিংছ",
      "কনফিগাৰেশ্বন",
      "পছন্দ",
    ],
  },
];

// ============================================================================
// 6. DEFAULT COMPREHENSIVE SEED CATALOG (ALL 12 DOMAINS & ALL CATEGORIES)
// ============================================================================

export const DEFAULT_INDEX_ITEMS: readonly SearchIndexItem[] = [
  // --------------------------------------------------------------------------
  // 1. UMAROS (Platform Domain 1)
  // --------------------------------------------------------------------------
  {
    id: "domain:umaros",
    domain: "umaros",
    category: "domain",
    title: {
      en: "UmarOS Central Command",
      hi: "उमर ओएस केंद्रीय कमान",
      bn: "উমৰ ওএস কেন্দ্রীয় কমান্ড",
      as: "উমৰ ওএছ কেন্দ্ৰীয় কমাণ্ড",
    },
    description: {
      en: "Master dashboard, workspace window manager, and founder control shell.",
      hi: "मास्टर डैशबोर्ड, वर्कस्पेस विंडो मैनेजर और संस्थापक नियंत्रण शेल।",
      bn: "মাস্টার ড্যাশবোর্ড, ওয়ার্কস্পেস উইন্ডো ম্যানেজার এবং প্রতিষ্ঠাতা নিয়ন্ত্রণ শেল।",
      as: "মাষ্টাৰ ডেচবৰ্ড, ৱৰ্কস্পেচ উইণ্ডো ব্যৱস্থাপক আৰু প্ৰতিষ্ঠাপক নিয়ন্ত্ৰণ শ্বেল।",
    },
    keywords: {
      en: ["umaros", "os", "shell", "workspace", "dock", "desktop", "core"],
      hi: ["उमर ओएस", "कमान", "कार्यक्षेत्र", "डॉक"],
      bn: ["উমৰ ওএস", "কমান্ড", "ডক"],
      as: ["উমৰ ওএছ", "কমাণ্ড", "ডক"],
    },
    route: "/admin/workspace/overview",
    deepLink: "umaros://system/dashboard",
    actionType: "NAVIGATE",
    priority: 10,
  },
  {
    id: "setting:umaros:dock_alignment",
    domain: "umaros",
    category: "setting",
    title: {
      en: "Dock Position and Window Behavior",
      hi: "डॉक स्थिति और विंडो व्यवहार",
      bn: "ডক অবস্থান এবং উইন্ডো আচরণ",
      as: "ডক অৱস্থান আৰু উইণ্ডো ব্যৱহাৰ",
    },
    description: {
      en: "Configure UmarOS master dock pin location (bottom/left) and auto-hide latency.",
      hi: "उमर ओएस मास्टर डॉक पिन स्थान (नीचे/बाएं) और ऑटो-हाइड विलंबता कॉन्फ़िगर करें।",
      bn: "উমৰ ওএস মাস্টার ডক পিন অবস্থান (নিচে/বামে) এবং অটো-হাইড কনফিগার করুন।",
      as: "উমৰ ওএছ মাষ্টাৰ ডক পিন অৱস্থান (তলত/বাওঁফালে) আৰু স্বয়ংক্ৰিয় লুকোৱা বিন্যাস কৰক।",
    },
    keywords: {
      en: ["dock", "window", "display", "appearance", "layout", "theme"],
      hi: ["डॉक", "विंडो", "लेआउट", "थीम"],
      bn: ["ডক", "উইন্ডো", "লেআউট", "থিম"],
      as: ["ডক", "উইণ্ডো", "বিন্যাস"],
    },
    route: "/admin/settings/appearance",
    deepLink: "umaros://settings/dock",
    actionType: "OPEN_DRAWER",
    priority: 30,
  },
  {
    id: "switch:umaros:multi_window_pro",
    domain: "umaros",
    category: "feature_switch",
    title: {
      en: "Multi-Window Pro Workspace Mode",
      hi: "मल्टी-विंडो प्रो वर्कस्पेस मोड",
      bn: "মাল্টি-উইন্ডো প্রো ওয়ার্কস্পেস মোড",
      as: "মাল্টি-উইণ্ডো প্ৰ' ৱৰ্কস্পেচ ম'ড",
    },
    description: {
      en: "Enable simultaneous tiled multi-window management across multiple monitors.",
      hi: "एकाधिक मॉनिटरों में एक साथ टाइल वाले मल्टी-विंडो प्रबंधन को सक्षम करें।",
      bn: "একাধিক মনিটরে একসাথে টাইলযুক্ত মাল্টি-উইন্ডো ম্যানেজমেন্ট সক্ষম করুন।",
      as: "একাধিক মনিটৰত একেলগে টাইলযুক্ত মাল্টি-উইণ্ডো ব্যৱস্থাপনা সক্ৰিয় কৰক।",
    },
    keywords: {
      en: ["multi window", "tiles", "workspace", "screens", "switch"],
      hi: ["मल्टी विंडो", "स्क्रीन", "स्विच"],
      bn: ["মাল্টি উইন্ডো", "স্ক্রিন", "সুইচ"],
      as: ["মাল্টি উইণ্ডো", "পৰ্দা", "চুইচ"],
    },
    route: "/admin/settings/workspace",
    deepLink: "umaros://switches/multi-window",
    actionType: "TOGGLE_SWITCH",
    status: "ACTIVE",
    priority: 40,
  },
  {
    id: "action:umaros:open_command_palette",
    domain: "umaros",
    category: "action",
    title: {
      en: "Open Founder Universal Command Palette",
      hi: "संस्थापक यूनिवर्सल कमांड पैलेट खोलें",
      bn: "প্রতিষ্ঠাতা ইউনিভার্সাল কমান্ড প্যালেট খুলুন",
      as: "প্ৰতিষ্ঠাপক সৰ্বজনীন কমাণ্ড পেলেট খোলক",
    },
    description: {
      en: "Instantly launch keyboard shortcut launcher (Cmd+K) across all screens.",
      hi: "सभी स्क्रीन पर तुरंत कीबोर्ड शॉर्टकट लॉन्चर (Cmd+K) लॉन्च करें।",
      bn: "সমস্ত স্ক্রিনে তাত্ক্ষণিকভাবে কীবোর্ড শর্টকাট লঞ্চার (Cmd+K) চালু করুন।",
      as: "সকলো পৰ্দাত তাৎক্ষণিকভাৱে কীবৰ্ড চৰ্টকাট লঞ্চাৰ (Cmd+K) আৰম্ভ কৰক।",
    },
    keywords: {
      en: ["command palette", "shortcut", "cmd k", "quick launch", "founder"],
      hi: ["कमांड पैलेट", "शॉर्टकट", "लॉन्चर"],
      bn: ["কমান্ড প্যালেট", "শর্টকাট"],
      as: ["কমাণ্ড পেলেট", "চৰ্টকাট"],
    },
    route: "/admin/workspace",
    deepLink: "umaros://actions/palette",
    actionType: "TRIGGER_COMMAND",
    commandId: "action:open_command_palette",
    priority: 15,
  },

  // --------------------------------------------------------------------------
  // 2. CUSTOMER APP (Platform Domain 2)
  // --------------------------------------------------------------------------
  {
    id: "domain:customer_app",
    domain: "customer_app",
    category: "domain",
    title: {
      en: "Customer App Marketplace",
      hi: "कस्टमर ऐप बाज़ार",
      bn: "গ্রাহক অ্যাপ মার্কেটপ্লেস",
      as: "গ্ৰাহক এপ বজাৰ",
    },
    description: {
      en: "Food ordering, grocery catalog, real-time checkout, and delivery tracking.",
      hi: "भोजन ऑर्डर, किराना कैटलॉग, रीयल-टाइम चेकआउट और डिलीवरी ट्रैकिंग।",
      bn: "খাবার অর্ডার, মুদি ক্যাটালগ, রিয়েল-টাইম চেকআউট এবং ডেলিভারি ট্র্যাকিং।",
      as: "খাদ্য অৰ্ডাৰ, গেলামাল তালিকা, বাস্তৱ সময়ৰ চেকআউট আৰু বিতৰণ ট্ৰেকিং।",
    },
    keywords: {
      en: ["customer", "food", "grocery", "ordering", "cart", "checkout", "tracking"],
      hi: ["ग्राहक", "खाना", "किराना", "ऑर्डर", "कार्ट", "चेकआउट"],
      bn: ["গ্রাহক", "খাবার", "মুদি", "অর্ডার", "কার্ট"],
      as: ["গ্ৰাহক", "খাদ্য", "গেলামাল", "অৰ্ডাৰ"],
    },
    route: "/apps/customer/feed",
    deepLink: "customer://home",
    actionType: "NAVIGATE",
    priority: 10,
  },
  {
    id: "param:customer:min_basket_value",
    domain: "customer_app",
    category: "business_parameter",
    title: {
      en: "Minimum Order Basket Value (Paise)",
      hi: "न्यूनतम ऑर्डर बास्केट मूल्य (पैसे)",
      bn: "সর্বনিম্ন অর্ডার বাস্কেট মূল্য (পয়সা)",
      as: "নূন্যতম অৰ্ডাৰ মূল্য (পইচা)",
    },
    description: {
      en: "Threshold basket size required before customer can checkout (e.g. 9900 = ₹99).",
      hi: "ग्राहक चेकआउट करने से पहले आवश्यक न्यूनतम बास्केट आकार (जैसे 9900 = ₹99)।",
      bn: "গ্রাহক চেকআউট করার আগে প্রয়োজনীয় সর্বনিম্ন বাস্কেট সাইজ (যেমন 9900 = ₹99)।",
      as: "গ্ৰাহক চেকআউট কৰাৰ পূৰ্বে প্ৰয়োজনীয় নূন্যতম বাস্কেট মূল্য (যেনে 9900 = ₹99)।",
    },
    keywords: {
      en: ["minimum order", "basket", "threshold", "order value", "paise"],
      hi: ["न्यूनतम ऑर्डर", "बास्केट", "सीमा", "मूल्य"],
      bn: ["সর্বনিম্ন অর্ডার", "বাস্কেট", "মূল্য"],
      as: ["নূন্যতম অৰ্ডাৰ", "মূল্য", "টকা"],
    },
    route: "/admin/customer/parameters",
    deepLink: "customer://parameters/min-basket",
    actionType: "INSPECT_PARAMETER",
    priority: 25,
  },
  {
    id: "dict:customer:checkout_cta",
    domain: "customer_app",
    category: "dictionary_key",
    title: {
      en: "Checkout Pay Now Button Text (checkout.pay_now_cta)",
      hi: "चेकआउट भुगतान बटन टेक्स्ट (checkout.pay_now_cta)",
      bn: "চেকআউট পেমেন্ট বাটন টেক্সট (checkout.pay_now_cta)",
      as: "চেকআউট পৰিশোধ বুটাম পাঠ (checkout.pay_now_cta)",
    },
    description: {
      en: "Localized primary call to action text shown on checkout screen bottom sheet.",
      hi: "चेकआउट स्क्रीन पर दिखाया जाने वाला प्राथमिक कॉल टू एक्शन टेक्स्ट।",
      bn: "চেকআউট স্ক্রিনে প্রদর্শিত প্রাথমিক কল টু অ্যাকশন টেক্সট।",
      as: "চেকআউট পৰ্দাত প্ৰদৰ্শিত প্ৰাথমিক কাৰ্য বুটামৰ পাঠ।",
    },
    keywords: {
      en: ["pay now", "checkout button", "cta", "i18n", "text key", "payout", "settlement"],
      hi: ["भुगतान करें", "चेकआउट बटन", "टेक्स्ट"],
      bn: ["পেমেন্ট করুন", "চেকআউট বাটন"],
      as: ["এতিয়াই পৰিশোধ কৰক", "বুটাম"],
    },
    route: "/admin/customization/text-editor?key=checkout.pay_now_cta",
    deepLink: "customer://i18n/checkout.pay_now_cta",
    actionType: "NAVIGATE",
    priority: 35,
  },

  // --------------------------------------------------------------------------
  // 3. PARTNER APP (Platform Domain 3)
  // --------------------------------------------------------------------------
  {
    id: "domain:partner_app",
    domain: "partner_app",
    category: "domain",
    title: {
      en: "Partner App (Merchant Hub)",
      hi: "पार्टनर ऐप (मर्चेंट हब)",
      bn: "পার্টনার অ্যাপ (মার্চেন্ট হাব)",
      as: "পাৰ্টনাৰ এপ (ব্যৱসায়ী কেন্দ্ৰ)",
    },
    description: {
      en: "Merchant kitchen order display, menu builder, store operating hours, and dispatch.",
      hi: "मर्चेंट किचन ऑर्डर डिस्प्ले, मेनू निर्माता, स्टोर के खुलने का समय और प्रेषण।",
      bn: "মার্চেন্ট কিচেন অর্ডার ডিসপ্লে, মেনু নির্মাতা, দোকান খোলার সময় ও প্রেরণ।",
      as: "ব্যৱসায়ী পাকঘৰ অৰ্ডাৰ প্ৰদৰ্শন, মেনু নিৰ্মাতা, দোকান খোলাৰ সময় আৰু প্ৰেৰণ।",
    },
    keywords: {
      en: ["partner", "merchant", "restaurant", "store", "kds", "kitchen", "menu"],
      hi: ["पार्टनर", "मर्चेंट", "रेस्तरां", "दुकान", "रसोई", "मेनू"],
      bn: ["পার্টনার", "মার্চেন্ট", "রেস্তোরাঁ", "রান্নাঘর", "দোকানদার"],
      as: ["পাৰ্টনাৰ", "ব্যৱসায়ী", "ৰেস্তোৰাঁ", "পাকঘৰ", "দোকানদাৰ"],
    },
    route: "/apps/partner/kds",
    deepLink: "partner://dashboard",
    actionType: "NAVIGATE",
    priority: 10,
  },
  {
    id: "setting:partner:weekly_payout",
    domain: "partner_app",
    category: "setting",
    title: {
      en: "Merchant Weekly Payout & Settlement Cycle",
      hi: "मर्चेंट साप्ताहिक भुगतान और निपटान चक्र",
      bn: "মার্চেন্ট সাপ্তাহিক পেমেন্ট ও নিষ্পত্তি চক্র",
      as: "ব্যৱসায়ী সাপ্তাহিক উপাৰ্জন আৰু নিষ্পত্তি চক্ৰ",
    },
    description: {
      en: "Configure automatic bank account payout disbursement schedule for restaurant partners.",
      hi: "रेस्तरां पार्टनरों के लिए स्वचालित बैंक खाता भुगतान वितरण अनुसूची कॉन्फ़िगर करें।",
      bn: "রেস্তোরাঁ অংশীদারদের জন্য স্বয়ংক্রিয় ব্যাংক একাউন্ট পেমেন্ট নিষ্পত্তি সময়সূচী নির্ধারণ করুন।",
      as: "ৰেস্তোৰাঁ সংগীসকলৰ বাবে স্বয়ংক্ৰিয় বেংক একাউণ্ট উপাৰ্জন নিষ্পত্তি সময়সূচী নিৰ্ধাৰণ কৰক।",
    },
    keywords: {
      en: ["payout", "settlement", "disbursement", "weekly payout", "bank transfer", "merchant settlement"],
      hi: ["भुगतान", "निपटान", "साप्ताहिक भुगतान", "बैंक ट्रांसफर", "मर्चेंट"],
      bn: ["পেমেন্ট", "নিষ্পত্তি", "সাপ্তাহিক পেমেন্ট", "ব্যাংক", "টাকা"],
      as: ["উপাৰ্জন", "পৰিশোধ", "নিষ্কাষণ", "সাপ্তাহিক উপাৰ্জন", "টকা"],
    },
    route: "/admin/finance/merchant-payouts",
    deepLink: "partner://finance/settlements",
    actionType: "NAVIGATE",
    priority: 12,
  },
  {
    id: "action:partner:emergency_snooze",
    domain: "partner_app",
    category: "action",
    title: {
      en: "Emergency Snooze Restaurant Orders",
      hi: "आपातकालीन रेस्तरां ऑर्डर स्नूज़",
      bn: "জরুরী রেস্তোরাঁ অর্ডার সাময়িক বন্ধ",
      as: "জৰুৰী ৰেস্তোৰাঁ অৰ্ডাৰ স্থগিত কৰক",
    },
    description: {
      en: "Temporarily freeze incoming order flow during peak kitchen backlog.",
      hi: "रसोई के पीक समय में आने वाले ऑर्डर प्रवाह को अस्थायी रूप से रोकें।",
      bn: "রান্নাঘরের পিক সময়ে নতুন অর্ডারের চাপ সাময়িকভাবে স্থগিত করুন।",
      as: "পাকঘৰৰ ব্যস্ত সময়ত নতুন অৰ্ডাৰৰ প্ৰবাহ সাময়িকভাৱে বন্ধ কৰক।",
    },
    keywords: {
      en: ["snooze", "freeze", "pause orders", "emergency", "kitchen overflow"],
      hi: ["स्नूज़", "रोकें", "आपातकालीन", "ऑर्डर बंद"],
      bn: ["স্থগিত", "জরুরী", "অর্ডার বন্ধ"],
      as: ["স্থগিত", "জৰুৰী", "অৰ্ডাৰ বন্ধ"],
    },
    route: "/apps/partner/operations",
    deepLink: "partner://actions/snooze",
    actionType: "TRIGGER_COMMAND",
    commandId: "action:partner_snooze_orders",
    priority: 20,
  },

  // --------------------------------------------------------------------------
  // 4. RIDER APP (Platform Domain 4)
  // --------------------------------------------------------------------------
  {
    id: "domain:rider_app",
    domain: "rider_app",
    category: "domain",
    title: {
      en: "Rider App (Fleet Control)",
      hi: "राइडर ऐप (बेड़ा नियंत्रण)",
      bn: "রাইডার অ্যাপ (ফ্লিট কন্ট্রোল)",
      as: "ৰাইডাৰ এপ (যান-সংগী নিয়ন্ত্ৰণ)",
    },
    description: {
      en: "Delivery partner dispatch, fleet GPS monitoring, instant cashout, and shifts.",
      hi: "डिलीवरी पार्टनर प्रेषण, बेड़ा जीपीएस निगरानी, त्वरित निकासी और शिफ्ट।",
      bn: "ডেলিভারি পার্টনার প্রেরণ, ফ্লিট জিপিএস মনিটরিং, তাত্ক্ষণিক টাকা তোলা ও শিফট।",
      as: "বিতৰণ সংগী প্ৰেৰণ, বাহন জিপিএছ নিৰীক্ষণ, তাৎক্ষণিক ধন উলিওৱা আৰু কামৰ পাল।",
    },
    keywords: {
      en: ["rider", "fleet", "delivery partner", "driver", "dispatch", "gps", "payout"],
      hi: ["राइडर", "चालक", "बेड़ा", "डिलीवरी पार्टनर", "भुगतान"],
      bn: ["রাইডার", "চালক", "ফ্লিট", "ডেলিভারি পার্টনার", "পেমেন্ট"],
      as: ["ৰাইডাৰ", "চালক", "বিতৰক", "উপাৰ্জন"],
    },
    route: "/apps/rider/fleet",
    deepLink: "rider://dispatch",
    actionType: "NAVIGATE",
    priority: 10,
  },
  {
    id: "setting:rider:instant_payout",
    domain: "rider_app",
    category: "setting",
    title: {
      en: "Rider Instant Earnings UPI Payout",
      hi: "राइडर त्वरित कमाई यूपीआई भुगतान",
      bn: "রাইডার তাত্ক্ষণিক উপার্জন ইউপিআই পেমেন্ট",
      as: "ৰাইডাৰ তাৎক্ষণিক উপাৰ্জন ইউপিআই পৰিশোধ",
    },
    description: {
      en: "Allow delivery riders to disburse daily earned delivery fees immediately to their UPI ID.",
      hi: "डिलीवरी सवारों को अपनी दैनिक कमाई सीधे यूपीआई आईडी में तुरंत निकालने की अनुमति दें।",
      bn: "ডেলিভারি রাইডারদের প্রতিদিনের উপার্জিত অর্থ তাত্ক্ষণিকভাবে তাদের ইউপিআইতে পাঠানোর অনুমতি দিন।",
      as: "বিতৰক ৰাইডাৰসকলক দৈনিক উপাৰ্জিত ধন তাৎক্ষণিকভাৱে নিজৰ ইউপিআইলৈ স্থানান্তৰ কৰিবলৈ দিয়ক।",
    },
    keywords: {
      en: ["payout", "settlement", "instant payout", "earnings", "cashout", "rider pay", "upi"],
      hi: ["भुगतान", "निपटान", "कमाई", "निकासी", "तुरंत भुगतान", "यूपीआई"],
      bn: ["পেমেন্ট", "নিষ্পত্তি", "উপার্জন", "উত্তোলন", "টাকা", "তাত্ক্ষণিক পেমেন্ট"],
      as: ["উপাৰ্জন", "পৰিশোধ", "নিষ্কাষণ", "টকা", "তাৎক্ষণিক উপাৰ্জন"],
    },
    route: "/admin/rider/earnings-policy",
    deepLink: "rider://earnings/instant-cashout",
    actionType: "NAVIGATE",
    priority: 15,
  },
  {
    id: "switch:rider:surge_multiplier_override",
    domain: "rider_app",
    category: "feature_switch",
    title: {
      en: "Rain and High-Demand Rider Incentive Multiplier",
      hi: "बारिश और उच्च मांग राइडर प्रोत्साहन गुणक",
      bn: "বৃষ্টি ও উচ্চ চাহিদা রাইডার ইনসেনটিভ মাল্টিপ্লায়ার",
      as: "বৰষুণ আৰু অধিক চাহিদা ৰাইডাৰ উৎসাহ মাচুল",
    },
    description: {
      en: "Activate up to 1.8x bonus per completed delivery during monsoon and peak periods.",
      hi: "मानसून और पीक समय में प्रति डिलीवरी 1.8x तक बोनस प्रोत्साहन सक्रिय करें।",
      bn: "বর্ষাকালে এবং পিক সময়ে প্রতি ডেলিভারিতে ১.৮ গুণ পর্যন্ত বোনাস ইনসেনটিভ সক্রিয় করুন।",
      as: "বাৰিষা আৰু ব্যস্ত সময়ত প্ৰতিটো বিতৰণত ১.৮ গুণ পৰ্যন্ত অতিৰিক্ত পুৰস্কাৰ সক্ৰিয় কৰক।",
    },
    keywords: {
      en: ["surge", "rider incentive", "rain bonus", "multiplier", "bonus pay"],
      hi: ["सर्ज", "बोनस", "बारिश प्रोत्साहन", "प्रोत्साहन"],
      bn: ["সর্জ", "বোনাস", "বৃষ্টি", "ইনসেনটিভ"],
      as: ["অতিৰিক্ত মাচুল", "বোনাস", "বৰষুণ"],
    },
    route: "/admin/rider/incentives",
    deepLink: "rider://incentives/surge-switch",
    actionType: "TOGGLE_SWITCH",
    status: "ACTIVE",
    priority: 25,
  },

  // --------------------------------------------------------------------------
  // 5. KINGPAY (Platform Domain 5)
  // --------------------------------------------------------------------------
  {
    id: "domain:kingpay",
    domain: "kingpay",
    category: "domain",
    title: {
      en: "KingPay Payments & Financial Engine",
      hi: "किंगपे भुगतान और वित्तीय इंजन",
      bn: "কিংপে পেমেন্ট ও আর্থিক ইঞ্জিন",
      as: "কিংপে পৰিশোধ আৰু বিত্তীয় ব্যৱস্থা",
    },
    description: {
      en: "UPI gateway, dynamic split settlements, automated merchant payouts, and soundbox.",
      hi: "यूपीआई गेटवे, गतिशील विभाजन निपटान, स्वचालित मर्चेंट भुगतान और साउंडबॉक्स।",
      bn: "ইউপিআই গেটওয়ে, ডায়নামিক স্প্লিট নিষ্পত্তি, স্বয়ংক্রিয় মার্চেন্ট পেমেন্ট ও সাউন্ডবক্স।",
      as: "ইউপিআই গেটৱে, গতিশীল বিভক্ত নিষ্পত্তি, স্বয়ংক্ৰিয় ব্যৱসায়ী পৰিশোধ আৰু চাউণ্ডবক্স।",
    },
    keywords: {
      en: ["kingpay", "payout", "settlement", "upi", "payments", "soundbox", "gateway", "disbursement"],
      hi: ["किंगपे", "भुगतान", "निपटान", "यूपीआई", "साउंडबॉक्स", "निकासी"],
      bn: ["কিংপে", "পেমেন্ট", "নিষ্পত্তি", "ইউপিআই", "সাউন্ডবক্স", "টাকা"],
      as: ["কিংপে", "উপাৰ্জন", "পৰিশোধ", "ইউপিআই", "চাউণ্ডবক্স", "টকা"],
    },
    route: "/admin/kingpay/reconciliation",
    deepLink: "kingpay://overview",
    actionType: "NAVIGATE",
    priority: 10,
  },
  {
    id: "setting:kingpay:payout_settlement_rules",
    domain: "kingpay",
    category: "setting",
    title: {
      en: "KingPay Merchant Automated Payout & Settlement Rules",
      hi: "किंगपे मर्चेंट स्वचालित भुगतान और निपटान नियम",
      bn: "কিংপে মার্চেন্ট স্বয়ংক্রিয় পেমেন্ট ও নিষ্পত্তি নিয়মাবলী",
      as: "কিংপে ব্যৱসায়ী স্বয়ংক্ৰিয় উপাৰ্জন আৰু নিষ্পত্তি নিয়ম",
    },
    description: {
      en: "Configure automated T+1/T+0 batch settlement, minimum payout threshold, and bank routing.",
      hi: "स्वचालित T+1/T+0 बैच निपटान, न्यूनतम भुगतान सीमा और बैंक रूटिंग कॉन्फ़िगर करें।",
      bn: "স্বয়ংক্রিয় T+1/T+0 ব্যাচ নিষ্পত্তি, সর্বনিম্ন পেমেন্ট সীমা এবং ব্যাংক রাউটিং কনফিগার করুন।",
      as: "স্বয়ংক্ৰিয় T+1/T+0 বেচ নিষ্পত্তি, নূন্যতম উপাৰ্জন সীমা আৰু বেংক স্থানান্তৰ বিন্যাস কৰক।",
    },
    keywords: {
      en: ["payout", "settlement", "merchant payout", "disbursement", "razorpayx", "bank transfer"],
      hi: ["भुगतान", "निपटान", "मर्चेंट भुगतान", "निकासी", "बैंक"],
      bn: ["পেমেন্ট", "নিষ্পত্তি", "মার্চেন্ট পেমেন্ট", "টাকা", "উত্তোলন"],
      as: ["উপাৰ্জন", "পৰিশোধ", "নিষ্কাষণ", "টকা", "বেংক"],
    },
    route: "/admin/kingpay/settlement-rules",
    deepLink: "kingpay://settlements/rules",
    actionType: "NAVIGATE",
    priority: 10,
  },
  {
    id: "setting:kingpay:soundbox_multilingual_voice",
    domain: "kingpay",
    category: "setting",
    title: {
      en: "UPI Soundbox Multilingual Voice Engine (Hindi/Bengali/Assamese)",
      hi: "यूपीआई साउंडबॉक्स बहुभाषी वॉयस इंजन (हिंदी/बंगाली/असमिया)",
      bn: "ইউপিআই সাউন্ডবক্স বহুভাষিক ভয়েস ইঞ্জিন (হিন্দি/বাংলা/অসমীয়া)",
      as: "ইউপিআই চাউণ্ডবক্স বহুভাষিক মাত ইঞ্জিন (হিন্দী/বাংলা/অসমীয়া)",
    },
    description: {
      en: "Configure audio speaker DSP soundbox announcements in English, Hindi, Bengali, or Assamese.",
      hi: "अंग्रेजी, हिंदी, बंगाली या असमिया में ऑडियो स्पीकर साउंडबॉक्स घोषणाओं को कॉन्फ़िगर करें।",
      bn: "ইংরেজি, হিন্দি, বাংলা বা অসমীয়া ভাষায় অডিও স্পিকার সাউন্ডবক্স ঘোষণা কনফিগার করুন।",
      as: "ইংৰাজী, হিন্দী, বাংলা বা অসমীয়া ভাষাত অডিঅ' স্পীকাৰ চাউণ্ডবক্স ঘোষণা নিৰ্ধাৰণ কৰক।",
    },
    keywords: {
      en: ["soundbox", "audio", "speaker", "voice alert", "upi payment confirmation", "dsp"],
      hi: ["साउंडबॉक्स", "आवाज", "ध्वनि", "वॉयस", "स्पीकर"],
      bn: ["সাউন্ডবক্স", "শব্দ", "ভয়েস", "স্পিকার"],
      as: ["চাউণ্ডবক্স", "শব্দ", "মাত", "ধ্বনি"],
    },
    route: "/admin/kingpay/soundbox-config",
    deepLink: "kingpay://terminals/soundbox",
    actionType: "NAVIGATE",
    priority: 18,
  },
  {
    id: "action:kingpay:trigger_batch_settlement",
    domain: "kingpay",
    category: "action",
    title: {
      en: "Trigger Instant Merchant Batch Settlement Disbursal",
      hi: "त्वरित मर्चेंट बैच निपटान भुगतान तुरंत शुरू करें",
      bn: "তাত্ক্ষণিক মার্চেন্ট ব্যাচ নিষ্পত্তি পেমেন্ট প্রেরণ শুরু করুন",
      as: "তাৎক্ষণিক ব্যৱসায়ী বেচ নিষ্পত্তি উপাৰ্জন প্ৰেৰণ আৰম্ভ কৰক",
    },
    description: {
      en: "Immediately disburse all queued net payable balances to merchant partner bank accounts.",
      hi: "मर्चेंट पार्टनर के बैंक खातों में कतारबद्ध सभी देय शेष राशि का तुरंत वितरण करें।",
      bn: "মার্চেন্ট অংশীদারদের ব্যাংক একাউন্টে সমস্ত অনুমোদিত বকেয়া অর্থ তাত্ক্ষণিকভাবে প্রদান করুন।",
      as: "ব্যৱসায়ী সংগীসকলৰ বেংক একাউণ্টলৈ জমা থকা ধন তাৎক্ষণিকভাৱে প্ৰেৰণ কৰক।",
    },
    keywords: {
      en: ["payout", "settlement", "disbursement", "trigger payout", "instant settlement", "batch payout"],
      hi: ["भुगतान", "निपटान", "निकासी शुरू करें", "तुरंत निपटान"],
      bn: ["পেমেন্ট", "নিষ্পত্তি", "পেমেন্ট প্রেরণ", "তাত্ক্ষণিক নিষ্পত্তি"],
      as: ["উপাৰ্জন", "পৰিশোধ", "নিষ্কাষণ", "তাৎক্ষণিক নিষ্পত্তি"],
    },
    route: "/admin/kingpay/reconciliation",
    deepLink: "kingpay://actions/disburse-now",
    actionType: "TRIGGER_COMMAND",
    commandId: "action:kingpay_disburse_batch",
    priority: 15,
  },

  // --------------------------------------------------------------------------
  // 6. API & INTEGRATIONS (Platform Domain 6)
  // --------------------------------------------------------------------------
  {
    id: "domain:api_integrations",
    domain: "api_integrations",
    category: "domain",
    title: {
      en: "API & Integrations Hub",
      hi: "एपीआई और एकीकरण हब",
      bn: "এপিআই এবং ইন্টিগ্রেশন হাব",
      as: "এপিআই আৰু সংহতি কেন্দ্ৰ",
    },
    description: {
      en: "Webhooks management, Model Context Protocol (MCP) tool runtime, and POS integrations.",
      hi: "वेबहुक प्रबंधन, मॉडल संदर्भ प्रोटोकॉल (MCP) टूल रनटाइम और पीओएस एकीकरण।",
      bn: "ওয়েবহুক ম্যানেজমেন্ট, মডেল কনটেক্সট প্রোটোকল (MCP) রানটাইম ও পিওএস ইন্টিগ্রেশন।",
      as: "ৱেবহুক ব্যৱস্থাপনা, মডেল কনটেক্সট প্ৰট'কল (MCP) কাৰ্যব্যৱস্থা আৰু পিঅ'এছ সংহতি।",
    },
    keywords: {
      en: ["api", "integrations", "webhooks", "mcp", "oauth2", "pos", "connectors"],
      hi: ["एपीआई", "एकीकरण", "वेबहुक", "एमसीपी"],
      bn: ["এপিআই", "ইন্টিগ্রেশন", "ওয়েবহুক", "এমসিপি"],
      as: ["এপিআই", "সংহতি", "ৱেবহুক"],
    },
    route: "/admin/integrations/mcp",
    deepLink: "api://overview",
    actionType: "NAVIGATE",
    priority: 10,
  },
  {
    id: "setting:api:webhook_retry_policy",
    domain: "api_integrations",
    category: "setting",
    title: {
      en: "Outgoing Webhook Exponential Backoff Retries",
      hi: "आउटगोइंग वेबहुक एक्सपोनेन्शियल बैकऑफ पुनः प्रयास",
      bn: "আউটগোয়িং ওয়েবহুক এক্সপোনেনশিয়াল ব্যাকঅফ পুনরায় চেষ্টা",
      as: "বহিৰ্গামী ৱেবহুক পুনৰ চেষ্টা নীতি",
    },
    description: {
      en: "Specify retry attempts (default: 5) and dead-letter queue routing for failed webhook pings.",
      hi: "विफल वेबहुक पिंग के लिए पुनः प्रयास (डिफ़ॉल्ट: 5) और डेड-लेटर कतार रूटिंग निर्दिष्ट करें।",
      bn: "ব্যর্থ ওয়েবহুক পিংয়ের জন্য পুনরায় চেষ্টা (ডিফল্ট: ৫) এবং ডেড-লেটার কিউ নির্ধারণ করুন।",
      as: "ব্যৰ্থ ৱেবহুক পিঙৰ বাবে পুনৰ চেষ্টা সংখ্যা (ডিফল্ট: ৫) আৰু ডেড-লেটাৰ নিৰ্ধাৰণ কৰক।",
    },
    keywords: {
      en: ["webhook", "retry", "backoff", "dead letter", "failure", "api"],
      hi: ["वेबहुक", "पुनः प्रयास", "विफलता"],
      bn: ["ওয়েবহুক", "পুনরায় চেষ্টা"],
      as: ["ৱেবহুক", "পুনৰ চেষ্টা"],
    },
    route: "/admin/integrations/webhooks/policy",
    deepLink: "api://webhooks/policy",
    actionType: "OPEN_DRAWER",
    priority: 30,
  },

  // --------------------------------------------------------------------------
  // 7. AFFILIATE & REFERRAL (Platform Domain 7)
  // --------------------------------------------------------------------------
  {
    id: "domain:affiliate_referral",
    domain: "affiliate_referral",
    category: "domain",
    title: {
      en: "Affiliate & Multi-Tier Referral Engine",
      hi: "एफिलिएट और बहुस्तरीय रेफरल इंजन",
      bn: "অ্যাফিলিয়েট এবং বহু-স্তরীয় রেফারেল ইঞ্জিন",
      as: "এফিলিয়েট আৰু বহু-স্তৰীয় ৰেফাৰেল ব্যৱস্থা",
    },
    description: {
      en: "Influencer link generator, viral referral tree, UTM attribution, and creator earnings.",
      hi: "इन्फ्लुएंसर लिंक निर्माता, वायरल रेफरल ट्री, यूटीएम एट्रिब्यूशन और क्रिएटर कमाई।",
      bn: "ইনফ্লুয়েন্সার লিঙ্ক জেনারেটর, ভাইরাল রেফারেল ট্রি, ইউটিএম অ্যাট্রিবিউশন ও উপার্জন।",
      as: "ইনফ্লুৱেনচাৰ লিংক নিৰ্মাতা, ভাইৰেল ৰেফাৰেল বৃক্ষ, ইউটিএম বৈশিষ্ট্য আৰু উপাৰ্জন।",
    },
    keywords: {
      en: ["affiliate", "referral", "invite", "commission", "creator", "influencer", "tree"],
      hi: ["रेफरल", "एफिलिएट", "कमीशन", "कमाई", "इनाम"],
      bn: ["রেফারেল", "অ্যাফিলিয়েট", "কমিশন", "উপার্জন", "পুরস্কার"],
      as: ["ৰেফাৰেল", "এফিলিয়েট", "কমিচন", "উপাৰ্জন", "পুৰস্কাৰ"],
    },
    route: "/admin/growth/referrals",
    deepLink: "affiliate://dashboard",
    actionType: "NAVIGATE",
    priority: 10,
  },
  {
    id: "param:affiliate:tier1_commission_pct",
    domain: "affiliate_referral",
    category: "business_parameter",
    title: {
      en: "Direct Tier 1 Referral Commission Percentage",
      hi: "प्रत्यक्ष टियर 1 रेफरल कमीशन प्रतिशत",
      bn: "সরাসরি টিয়ার ১ রেফারেল কমিশন শতাংশ",
      as: "প্ৰত্যক্ষ স্তৰ ১ ৰেফাৰেল কমিচন শতাংশ",
    },
    description: {
      en: "Percentage of first order basket value credited to referring influencer (e.g. 15%).",
      hi: "रेफर करने वाले इन्फ्लुएंसर को दिए जाने वाले पहले ऑर्डर मूल्य का प्रतिशत (उदा. 15%)।",
      bn: "রেফারকারী ইনফ্লুয়েন্সারকে প্রদত্ত প্রথম অর্ডারের মূল্যের শতাংশ (যেমন ১৫%)।",
      as: "ৰেফাৰ কৰা ইনফ্লুৱেনচাৰক দিয়া প্ৰথম অৰ্ডাৰ মূল্যৰ শতাংশ (যেনে ১৫%)।",
    },
    keywords: {
      en: ["referral commission", "tier 1", "percentage", "affiliate bonus", "commission rate"],
      hi: ["रेफरल कमीशन", "प्रतिशत", "कमीशन दर"],
      bn: ["রেফারেল কমিশন", "শতাংশ", "কমিশন হার"],
      as: ["ৰেফাৰেল কমিচন", "শতাংশ", "কমিচন দৰ"],
    },
    route: "/admin/growth/commission-rates",
    deepLink: "affiliate://parameters/tier1-pct",
    actionType: "INSPECT_PARAMETER",
    priority: 25,
  },

  // --------------------------------------------------------------------------
  // 8. MARKETING & CRM (Platform Domain 8)
  // --------------------------------------------------------------------------
  {
    id: "domain:marketing_crm",
    domain: "marketing_crm",
    category: "domain",
    title: {
      en: "Marketing Campaigns & CRM Automations",
      hi: "मार्केटिंग अभियान और सीआरएम स्वचालन",
      bn: "মার্কেটিং ক্যাম্পেইন এবং সিআরএম অটোমেশন",
      as: "মার্কেটিং অভিযান আৰু চিআৰএম স্বয়ংক্ৰিয়তা",
    },
    description: {
      en: "Push notifications, promo discount coupons, SMS/WhatsApp broadcast, and loyalty tiers.",
      hi: "पुश सूचनाएं, प्रोमो छूट कूपन, एसएमएस/व्हाट्सएप प्रसारण और लॉयल्टी स्तर।",
      bn: "পুশ নোটিফিকেশন, প্রোমো ডিসকাউন্ট কুপন, এসএমএস/হোয়াটসঅ্যাপ প্রচার ও লয়ালটি।",
      as: "পুশ জাননী, ৰেহাই কুপন, এছএমএছ/হোৱাটছএপ সম্প্ৰচাৰ আৰু আনুগত্য স্তৰ।",
    },
    keywords: {
      en: ["marketing", "crm", "campaigns", "coupon", "discount", "voucher", "push", "broadcast"],
      hi: ["मार्केटिंग", "कूपन", "छूट", "प्रसारण", "पुश सूचना"],
      bn: ["মার্কেটিং", "কুপন", "ছাড়", "প্রচার", "পুশ নোটিফিকেশন"],
      as: ["মার্কেটিং", "কুপন", "ৰেহাই", "সম্প্ৰচাৰ", "জাননী"],
    },
    route: "/admin/marketing/campaigns",
    deepLink: "marketing://dashboard",
    actionType: "NAVIGATE",
    priority: 10,
  },
  {
    id: "setting:marketing:max_daily_push",
    domain: "marketing_crm",
    category: "setting",
    title: {
      en: "Maximum Daily Promotional Push Notification Frequency",
      hi: "अधिकतम दैनिक प्रचार संबंधी पुश सूचना आवृत्ति",
      bn: "দৈনিক সর্বাধিক প্রচারমূলক পুশ নোটিফিকেশন সংখ্যা",
      as: "দৈনিক সৰ্বাধিক প্ৰচাৰমূলক পুশ জাননীৰ সংখ্যা",
    },
    description: {
      en: "Limit user fatigue by capping promotional push notifications per customer per day.",
      hi: "प्रति ग्राहक प्रति दिन प्रचार संबंधी पुश सूचनाओं को सीमित करके ग्राहकों को बचाएं।",
      bn: "প্রতিদিন গ্রাহক প্রতি প্রচারমূলক পুশ নোটিফিকেশন সীমাবদ্ধ করে বিরক্তি কমান।",
      as: "প্ৰতি গ্ৰাহকৰ বাবে দৈনিক প্ৰচাৰমূলক পুশ জাননী সীমিত কৰি বিৰক্তি ৰোধ কৰক।",
    },
    keywords: {
      en: ["push notification", "frequency cap", "fatigue limit", "notifications", "marketing limits"],
      hi: ["पुश सूचना", "आवृत्ति सीमा", "दैनिक सीमा"],
      bn: ["পুশ নোটিফিকেশন", "দৈনিক সীমা"],
      as: ["পুশ জাননী", "দৈনিক সীমা"],
    },
    route: "/admin/marketing/settings",
    deepLink: "marketing://settings/push-limits",
    actionType: "OPEN_DRAWER",
    priority: 30,
  },

  // --------------------------------------------------------------------------
  // 9. UMAR AI (Platform Domain 9)
  // --------------------------------------------------------------------------
  {
    id: "domain:umar_ai",
    domain: "umar_ai",
    category: "domain",
    title: {
      en: "Umar AI Foundation Models & Prompt Studio",
      hi: "उमर एआई फाउंडेशन मॉडल और प्रॉम्प्ट स्टूडियो",
      bn: "উমর এআই ফাউন্ডেশন মডেল এবং প্রম্পট স্টুডিও",
      as: "উমৰ এআই ফাউণ্ডেশ্যন মডেল আৰু প্ৰম্পট ষ্টুডিঅ'",
    },
    description: {
      en: "Autonomous multi-model routing (Gemini/DeepSeek/Claude), voice DSP, and vision parser.",
      hi: "स्वायत्त मल्टी-मॉडल रूटिंग (जेमिनी/डीपसीक/क्लॉड), वॉयस डीएसपी और विज़न पार्सर।",
      bn: "মাল্টি-মডেল রাউটিং (জেমিনি/ডিপসিক/ক্লড), ভয়েস ডিএসপি এবং ভিশন পার্সার।",
      as: "মাল্টি-মডেল ৰাউটিং (জেমিনি/ডিপছিক/ক্লড), মাত ডিএছপি আৰু চিনাক্তকৰণ।",
    },
    keywords: {
      en: ["umar ai", "ai", "llm", "models", "gemini", "deepseek", "claude", "prompt", "voice agent"],
      hi: ["उमर एआई", "एआई", "मॉडल", "जेमिनी", "प्रॉम्प्ट", "वॉयस"],
      bn: ["উমর এআই", "এআই", "মডেল", "জেমিনি", "প্রম্পট"],
      as: ["উমৰ এআই", "এআই", "মডেল", "প্ৰম্পট"],
    },
    route: "/admin/ai/prompt-matrix",
    deepLink: "umar_ai://overview",
    actionType: "NAVIGATE",
    priority: 10,
  },
  {
    id: "setting:umar_ai:primary_foundation_model",
    domain: "umar_ai",
    category: "setting",
    title: {
      en: "Primary AI Foundation Model Routing Selection",
      hi: "प्राथमिक एआई फाउंडेशन मॉडल रूटिंग चयन",
      bn: "প্রাথমিক এআই ফাউন্ডেশন মডেল রাউটিং নির্বাচন",
      as: "প্ৰাথমিক এআই ফাউণ্ডেশ্যন মডেল বাছনি",
    },
    description: {
      en: "Choose the default model provider (Google Gemini 2.0 Flash, DeepSeek V3, Claude 3.5 Sonnet).",
      hi: "डिफ़ॉल्ट मॉडल प्रदाता चुनें (Google Gemini 2.0 Flash, DeepSeek V3, Claude 3.5 Sonnet)।",
      bn: "ডিফল্ট মডেল নির্বাচন করুন (Google Gemini 2.0 Flash, DeepSeek V3, Claude 3.5 Sonnet)।",
      as: "ডিফল্ট মডেল নিৰ্বাচন কৰক (Google Gemini 2.0 Flash, DeepSeek V3, Claude 3.5 Sonnet)।",
    },
    keywords: {
      en: ["model selection", "primary model", "gemini", "deepseek", "claude", "router", "ai settings"],
      hi: ["मॉडल चयन", "जेमिनी", "डीपसीक", "रूटिंग"],
      bn: ["মডেল নির্বাচন", "জেমিনি", "ডিপসিক"],
      as: ["মডেল বাছনি", "জেমিনি"],
    },
    route: "/admin/ai/model-routing",
    deepLink: "umar_ai://settings/model-routing",
    actionType: "OPEN_DRAWER",
    priority: 15,
  },

  // --------------------------------------------------------------------------
  // 10. FINANCE & BIZOPS (Platform Domain 10)
  // --------------------------------------------------------------------------
  {
    id: "domain:finance_bizops",
    domain: "finance_bizops",
    category: "domain",
    title: {
      en: "Finance & BizOps Double-Entry Ledger",
      hi: "वित्त और व्यापार संचालन डबल-एंट्री बहीखाता",
      bn: "অর্থ ও বিজঅপস ডাবল-এন্ট্রি খতিয়ান",
      as: "বিত্ত আৰু বিজঅপচ দ্বৈত-নথিভুক্ত খতিয়ান",
    },
    description: {
      en: "Statutory GST & TDS compliance, merchant contract ledger, P&L audit, and reconciliation.",
      hi: "वैधानिक जीएसटी और टीडीएस अनुपालन, मर्चेंट अनुबंध बहीखाता, लाभ-हानि ऑडिट और मिलान।",
      bn: "সংবিধিবদ্ধ জিএসটি ও টিডিএস সম্মতি, মার্চেন্ট চুক্তি খতিয়ান, লাভ-ক্ষতি অডিট এবং নিষ্পত্তি।",
      as: "জিএছটি আৰু টিডিএছ নিয়ম পালন, ব্যৱসায়ী চুক্তি খতিয়ান, লাভ-লোকচান আৰু নিষ্পত্তি।",
    },
    keywords: {
      en: ["finance", "ledger", "bizops", "gst", "tds", "settlement", "payout", "accounting", "pnl"],
      hi: ["वित्त", "बहीखाता", "जीएसटी", "टीडीएस", "निपटान", "भुगतान", "लेखा"],
      bn: ["অর্থ", "খতিয়ান", "জিএসটি", "টিডিএস", "নিষ্পত্তি", "পেমেন্ট", "টাকা"],
      as: ["বিত্ত", "খতিয়ান", "জিএছটি", "টিডিএছ", "নিষ্কাষণ", "উপাৰ্জন", "টকা"],
    },
    route: "/admin/finance/ledger",
    deepLink: "finance://dashboard",
    actionType: "NAVIGATE",
    priority: 10,
  },
  {
    id: "param:finance:statutory_gst_rate",
    domain: "finance_bizops",
    category: "business_parameter",
    title: {
      en: "Indian Statutory Restaurant Food GST Rate Basis Points",
      hi: "भारतीय वैधानिक रेस्तरां भोजन जीएसटी दर (बेसिस पॉइंट्स)",
      bn: "ভারতীয় রেস্তোরাঁ খাদ্য জিএসটি হার বেসিস পয়েন্টস",
      as: "ভাৰতীয় ৰেস্তোৰাঁ খাদ্য জিএছটি হাৰ বেচিচ পইণ্টচ",
    },
    description: {
      en: "Standard GST percentage charged on standalone restaurant orders without ITC (500 bps = 5%).",
      hi: "आईटीसी के बिना स्टैंडअलोन रेस्तरां ऑर्डर पर लिया जाने वाला मानक जीएसटी (500 bps = 5%)।",
      bn: "আইটিসি ছাড়া রেস্তোরাঁ অর্ডারে ধার্যকৃত স্ট্যান্ডার্ড জিএসটি হার (৫০০ bps = ৫%)।",
      as: "আইটিচি অবিহনে ৰেস্তোৰাঁ অৰ্ডাৰত সংগ্ৰহ কৰা নিয়মীয়া জিএছটি (৫০০ bps = ৫%)।",
    },
    keywords: {
      en: ["gst rate", "tax", "statutory tax", "basis points", "bps", "finance tax"],
      hi: ["जीएसटी दर", "कर", "टैक्स", "वैधानिक कर"],
      bn: ["জিএসটি হার", "কর", "ট্যাক্স"],
      as: ["জিএছটি হাৰ", "কৰ", "ট্যাক্স"],
    },
    route: "/admin/finance/tax-rules",
    deepLink: "finance://parameters/gst-rate",
    actionType: "INSPECT_PARAMETER",
    priority: 25,
  },

  // --------------------------------------------------------------------------
  // 11. GEO MANAGEMENT (Platform Domain 11)
  // --------------------------------------------------------------------------
  {
    id: "domain:geo_management",
    domain: "geo_management",
    category: "domain",
    title: {
      en: "Geo Management & Polygon Dispatch",
      hi: "भू-प्रबंधन और बहुभुज प्रेषण",
      bn: "জিও ম্যানেজমেন্ট ও বহুভুজ প্রেরণ",
      as: "ভৌগোলিক ব্যৱস্থাপনা আৰু এলেকা প্ৰেৰণ",
    },
    description: {
      en: "Geofencing polygons, dynamic surge clusters, OSRM road routing, and delivery bounds.",
      hi: "जियोफेंसिंग बहुभुज, गतिशील सर्ज क्लस्टर, ओएसआरएम रूटिंग और डिलीवरी सीमाएं।",
      bn: "জিওফেন্সিং বহুভুজ, গতিশীল মূল্য বৃদ্ধি ক্লাস্টার, ওএসআরএম রুট ও ডেলিভারি সীমানা।",
      as: "জিওফেন্সিং বহুভুজ, গতিশীল অতিৰিক্ত মাচুল এলেকা, ওএছআৰএম বাট আৰু বিতৰণ সীমা।",
    },
    keywords: {
      en: ["geo", "geofence", "polygon", "surge", "zones", "osrm", "routing", "map"],
      hi: ["जियो", "जियोफेंस", "क्षेत्र", "सीमा", "सर्ज", "नक्शा"],
      bn: ["জিও", "জিওফেন্স", "এলাকা", "সীমানা", "সর্জ", "মানচিত্র"],
      as: ["ভৌগোলিক", "জিওফেন্স", "এলেকা", "সীমা", "অতিৰিক্ত মাচুল", "মানচিত্ৰ"],
    },
    route: "/admin/geo/polygons",
    deepLink: "geo://dashboard",
    actionType: "NAVIGATE",
    priority: 10,
  },
  {
    id: "param:geo:max_surge_multiplier",
    domain: "geo_management",
    category: "business_parameter",
    title: {
      en: "Dynamic Surge Price Multiplier Hard Cap",
      hi: "गतिशील सर्ज मूल्य गुणक अधिकतम सीमा (हार्ड कैप)",
      bn: "গতিশীল মূল্য বৃদ্ধি মাল্টিপ্লায়ার সর্বোচ্চ সীমা",
      as: "গতিশীল অতিৰিক্ত মাচুল সৰ্বোচ্চ সীমা",
    },
    description: {
      en: "Maximum multiplier permitted for automated demand surge pricing during rain/festivals (e.g. 2.5x).",
      hi: "बारिश/त्योहारों के दौरान स्वचालित मांग सर्ज मूल्य निर्धारण के लिए अनुमत अधिकतम गुणक (उदा. 2.5x)।",
      bn: "বৃষ্টি বা উৎসবের সময় স্বয়ংক্রিয় চাহিদা বৃদ্ধির জন্য অনুমোদিত সর্বোচ্চ গুণক (যেমন ২.৫x)।",
      as: "বৰষুণ বা উৎসৱৰ সময়ত স্বয়ংক্ৰিয় চাহিদা বৃদ্ধিৰ বাবে অনুমোদিত সৰ্বোচ্চ গুণক (যেনে ২.৫x)।",
    },
    keywords: {
      en: ["surge cap", "surge multiplier", "max surge", "demand pricing", "price ceiling"],
      hi: ["सर्ज सीमा", "सर्ज गुणक", "अधिकतम सर्ज"],
      bn: ["সর্জ সীমা", "মূল্য বৃদ্ধি গুণক"],
      as: ["অতিৰিক্ত মাচুল সীমা", "সৰ্বোচ্চ মাচুল"],
    },
    route: "/admin/geo/surge-policy",
    deepLink: "geo://parameters/max-surge",
    actionType: "INSPECT_PARAMETER",
    priority: 20,
  },

  // --------------------------------------------------------------------------
  // 12. INFRA & SECURITY (Platform Domain 12)
  // --------------------------------------------------------------------------
  {
    id: "domain:infra_security",
    domain: "infra_security",
    category: "domain",
    title: {
      en: "Infrastructure & Platform Security Gate",
      hi: "इन्फ्रास्ट्रक्चर और प्लेटफ़ॉर्म सुरक्षा गेट",
      bn: "ইনফ্রাস্ট্রাকচার ও প্ল্যাটফর্ম সুরক্ষা গেট",
      as: "আন্তঃগাঁথনি আৰু সুৰক্ষা নিয়ন্ত্ৰণ কেন্দ্ৰ",
    },
    description: {
      en: "Cloudflare edge CDN, Redis cache cluster, RBAC permissions, WAF rules, and killswitches.",
      hi: "क्लाउडफ्लेयर एज सीडीएन, रेडिस कैश, आरबीएसी अनुमतियां, डब्ल्यूएएफ और किल-स्विच।",
      bn: "ক্লাউডফ্লেয়ার এজ সিডিএন, রেডিস ক্যাশ, আরবিএসি অনুমতি, ফায়ারওয়াল ও কিলসুইচ।",
      as: "ক্লাউডফ্লেয়াৰ কেচ, ৰেডিচ, আৰবিএচি প্ৰৱেশাধিকাৰ, সুৰক্ষা বেষ্টনী আৰু জৰুৰী চুইচ।",
    },
    keywords: {
      en: ["infra", "security", "cloudflare", "redis", "rbac", "waf", "killswitch", "firewall"],
      hi: ["इन्फ्रा", "सुरक्षा", "फ़ायरवॉल", "किल-स्विच", "अनुमति"],
      bn: ["ইনফ্রা", "নিরাপত্তা", "ফায়ারওয়াল", "কিলসুইচ"],
      as: ["ইনফ্ৰা", "সুৰক্ষা", "নিৰাপত্তা", "জৰুৰী চুইচ"],
    },
    route: "/admin/security/audit",
    deepLink: "infra://dashboard",
    actionType: "NAVIGATE",
    priority: 10,
  },
  {
    id: "switch:infra:global_emergency_freeze",
    domain: "infra_security",
    category: "feature_switch",
    title: {
      en: "Global Emergency Operational & Financial Killswitch Freeze",
      hi: "वैश्विक आपातकालीन परिचालन और वित्तीय किल-स्विच फ्रीज",
      bn: "গ্লোবাল জরুরী পরিচালনা ও আর্থিক কিলসুইচ ফ্রিজ",
      as: "গোলকীয় জৰুৰী বিত্তীয় আৰু কাৰ্য্যকৰী চুইচ বন্ধ",
    },
    description: {
      en: "Founder-level killswitch: instantly halts all payment disbursements and incoming customer orders.",
      hi: "संस्थापक-स्तरीय किल-स्विच: सभी भुगतान वितरण और आने वाले ग्राहक ऑर्डर को तुरंत रोक देता है।",
      bn: "প্রতিষ্ঠাতা-স্তরের কিলসুইচ: সমস্ত পেমেন্ট বিতরণ এবং আগত গ্রাহক অর্ডার তাত্ক্ষণিকভাবে স্থগিত করে।",
      as: "প্ৰতিষ্ঠাপক-স্তৰৰ জৰুৰী চুইচ: সকলো উপাৰ্জন পৰিশোধ আৰু গ্ৰাহক অৰ্ডাৰ তৎক্ষণাৎ বন্ধ কৰে।",
    },
    keywords: {
      en: ["killswitch", "freeze", "emergency", "lockdown", "halt", "shutdown", "security freeze"],
      hi: ["आपातकाल", "आपातकालीन", "रोक", "बंद", "किल-स्विच", "सुरक्षा"],
      bn: ["জরুরী", "জরুরি", "স্থগিত", "বন্ধ", "কিলসুইচ", "নিরাপত্তা"],
      as: ["জৰুৰী", "জৰুৰীকালীন", "বন্ধ", "স্থগিত", "সুৰক্ষা"],
    },
    route: "/admin/security/killswitches",
    deepLink: "infra://switches/global-freeze",
    actionType: "TOGGLE_SWITCH",
    status: "CRITICAL",
    priority: 1,
  },
  {
    id: "action:infra:flush_edge_cache",
    domain: "infra_security",
    category: "action",
    title: {
      en: "Purge Global Cloudflare Edge CDN Cache",
      hi: "वैश्विक क्लाउडफ्लेयर एज सीडीएन कैश साफ़ करें",
      bn: "গ্লোবাল ক্লাউডফ্লেয়ার এজ সিডিএন ক্যাশ মুছে ফেলুন",
      as: "গোলকীয় ক্লাউডফ্লেয়াৰ কেচ পৰিষ্কাৰ কৰক",
    },
    description: {
      en: "Instantly invalidate all cached HTML, assets, and restaurant menu responses across worldwide edge nodes.",
      hi: "दुनिया भर के एज नोड्स में सभी कैश्ड मेनू और संपत्तियों को तुरंत अमान्य करें।",
      bn: "বিশ্বব্যাপী এজ নোড জুড়ে সমস্ত ক্যাশ করা মেনু এবং ফাইল তাত্ক্ষণিকভাবে রিফ্রেশ করুন।",
      as: "বিশ্বজুৰি থকা সকলো এজ ন'ডৰ মেনু আৰু ফাইল তৎক্ষণাৎ নৱীকৰণ কৰক।",
    },
    keywords: {
      en: ["flush cache", "purge cdn", "cloudflare", "edge cache", "invalidate"],
      hi: ["कैश साफ़ करें", "क्लाउडफ्लेयर", "कैश"],
      bn: ["ক্যাশ মুছুন", "ক্লাউডফ্লেয়ার"],
      as: ["কেচ পৰিষ্কাৰ", "ক্লাউডফ্লেয়াৰ"],
    },
    route: "/admin/security/edge",
    deepLink: "infra://actions/flush-cache",
    actionType: "TRIGGER_COMMAND",
    commandId: "action:infra_flush_cdn_cache",
    priority: 18,
  },
];

// ============================================================================
// 7. UNIVERSAL INTELLIGENT SEARCH ENGINE IMPLEMENTATION
// ============================================================================

export class MultilingualUniversalSearchEngine {
  private itemsMap: Map<string, SearchIndexItem> = new Map();
  private synonymIndex: Map<string, Set<string>> = new Map();
  private canonicalMap: Map<string, string> = new Map();

  constructor(initialItems: readonly SearchIndexItem[] = DEFAULT_INDEX_ITEMS) {
    this.initializeSynonyms();
    this.addItems(initialItems);
  }

  /**
   * Builds the bidirectional multi-language synonym inverted map.
   */
  private initializeSynonyms(): void {
    this.synonymIndex.clear();
    this.canonicalMap.clear();

    for (const cluster of CORE_SYNONYM_CLUSTERS) {
      this.registerSynonymCluster(cluster.canonical, cluster.terms);
    }
  }

  /**
   * Registers a list of equivalent terms into the synonym dictionary.
   */
  public registerSynonymCluster(canonical: string, terms: string[]): void {
    const cleanTerms = Array.from(
      new Set([canonical.toLowerCase(), ...terms.map((t) => t.toLowerCase().trim())])
    ).filter((t) => t.length > 0);

    const termSet = new Set(cleanTerms);

    for (const term of cleanTerms) {
      this.canonicalMap.set(term, canonical);

      if (!this.synonymIndex.has(term)) {
        this.synonymIndex.set(term, new Set());
      }
      const existing = this.synonymIndex.get(term)!;
      for (const sibling of cleanTerms) {
        if (sibling !== term) {
          existing.add(sibling);
        }
      }
    }
  }

  /**
   * Adds custom synonyms for a given word.
   */
  public registerSynonym(word: string, synonyms: string[]): void {
    const w = word.toLowerCase().trim();
    this.registerSynonymCluster(w, synonyms);
  }

  /**
   * Retrieves all synonymous terms for a given query word.
   */
  public getSynonyms(word: string): string[] {
    const lower = word.toLowerCase().trim();
    const result = new Set<string>();

    if (this.synonymIndex.has(lower)) {
      for (const syn of this.synonymIndex.get(lower)!) {
        result.add(syn);
      }
    }

    // Also check phonetic transliteration of the word
    const phonetic = phoneticNormalize(lower);
    for (const [term, syns] of this.synonymIndex.entries()) {
      if (phoneticNormalize(term) === phonetic) {
        result.add(term);
        for (const s of syns) result.add(s);
      }
    }

    return Array.from(result);
  }

  /**
   * Adds or updates a single search item in the index.
   */
  public addItem(item: SearchIndexItem): void {
    this.itemsMap.set(item.id, item);
  }

  /**
   * Batch adds items to the search engine index.
   */
  public addItems(items: readonly SearchIndexItem[]): void {
    for (const item of items) {
      this.addItem(item);
    }
  }

  /**
   * Partially updates an existing indexed item.
   */
  public updateItem(id: string, patch: Partial<SearchIndexItem>): boolean {
    const existing = this.itemsMap.get(id);
    if (!existing) return false;
    this.itemsMap.set(id, { ...existing, ...patch });
    return true;
  }

  /**
   * Removes an item by its unique ID.
   */
  public removeItem(id: string): boolean {
    return this.itemsMap.delete(id);
  }

  /**
   * Retrieves an item by ID.
   */
  public getItem(id: string): SearchIndexItem | undefined {
    return this.itemsMap.get(id);
  }

  /**
   * Returns all indexed items.
   */
  public getAllItems(): SearchIndexItem[] {
    return Array.from(this.itemsMap.values());
  }

  /**
   * Clears the index entirely.
   */
  public clear(): void {
    this.itemsMap.clear();
  }

  /**
   * Resets the index to the default seed catalog.
   */
  public resetToDefault(): void {
    this.clear();
    this.initializeSynonyms();
    this.addItems(DEFAULT_INDEX_ITEMS);
  }

  /**
   * Generates navigation action link for an item with robust fallbacks.
   */
  private buildActionLink(item: SearchIndexItem): NavigationActionLink {
    const domainMeta = PLATFORM_DOMAINS.find((d) => d.id === item.domain);
    const targetApp = domainMeta ? domainMeta.targetApp : item.domain;
    const defaultRoute = domainMeta ? domainMeta.defaultRoute : `/${item.domain}`;
    const defaultDeepLink = domainMeta ? domainMeta.deepLink : `${item.domain}://home`;

    return {
      targetDomain: item.domain,
      targetApp,
      route: item.route || defaultRoute,
      deepLink: item.deepLink || defaultDeepLink,
      actionType: item.actionType || "NAVIGATE",
      commandId: item.commandId,
      parameters: item.metadata,
    };
  }

  /**
   * Tokenizes text into search tokens, removing non-word characters while preserving Indic scripts.
   */
  public tokenize(text: string): string[] {
    if (!text) return [];
    return text
      .toLowerCase()
      .split(/[\s,.;:!?'"()\[\]{}\/\\|\-_]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }

  /**
   * Core scoring engine: tests a query token against an item's multilingual fields.
   */
  private scoreItemAgainstToken(
    queryToken: string,
    queryPhonetic: string,
    querySynonyms: string[],
    item: SearchIndexItem,
    detectedLocale: SupportedLocale
  ): { score: number; matchReasons: string[]; matchedTokens: string[] } {
    let score = 0;
    const matchReasons: string[] = [];
    const matchedTokens: string[] = [];

    // Collect all candidate strings for this item
    const localizedTitles = [
      item.title.en,
      item.title.hi,
      item.title.bn,
      item.title.as,
    ].filter((t): t is string => Boolean(t));

    const localizedDescriptions = [
      item.description.en,
      item.description.hi,
      item.description.bn,
      item.description.as,
    ].filter((d): d is string => Boolean(d));

    const allKeywords = [
      ...(item.keywords.en || []),
      ...(item.keywords.hi || []),
      ...(item.keywords.bn || []),
      ...(item.keywords.as || []),
    ];

    // Priority boost multiplier (1 to 100, where 1 gives maximum boost)
    const priorityMultiplier = 1 + Math.max(0, 100 - (item.priority || 50)) / 200;

    // 1. Exact or prefix match in ID or Domain name
    if (item.id.toLowerCase() === queryToken || item.domain.toLowerCase() === queryToken) {
      score += 100;
      matchReasons.push(`Exact domain/id match (${queryToken})`);
      matchedTokens.push(queryToken);
    }

    // 2. Exact match in localized titles
    for (const title of localizedTitles) {
      const titleTokens = this.tokenize(title);
      for (const tToken of titleTokens) {
        if (tToken === queryToken) {
          score += 60;
          matchReasons.push(`Title exact match (${tToken})`);
          matchedTokens.push(tToken);
          break;
        } else if (tToken.startsWith(queryToken) && queryToken.length >= 3) {
          score += 35;
          matchReasons.push(`Title prefix match (${tToken})`);
          matchedTokens.push(tToken);
          break;
        }
      }
    }

    // 3. Exact match in keywords
    for (const kw of allKeywords) {
      const lowerKw = kw.toLowerCase().trim();
      if (lowerKw === queryToken) {
        score += 50;
        matchReasons.push(`Keyword match (${lowerKw})`);
        matchedTokens.push(lowerKw);
      } else if (lowerKw.startsWith(queryToken) && queryToken.length >= 3) {
        score += 25;
        matchReasons.push(`Keyword prefix match (${lowerKw})`);
        matchedTokens.push(lowerKw);
      }
    }

    // 4. Match in descriptions
    for (const desc of localizedDescriptions) {
      const descTokens = this.tokenize(desc);
      for (const dToken of descTokens) {
        if (dToken === queryToken) {
          score += 20;
          matchReasons.push(`Description match (${dToken})`);
          matchedTokens.push(dToken);
          break;
        }
      }
    }

    // 5. Cross-lingual Synonym matching
    // Check if any synonym of queryToken matches item titles or keywords
    if (querySynonyms.length > 0) {
      for (const syn of querySynonyms) {
        let synMatched = false;

        // Check keywords
        for (const kw of allKeywords) {
          if (kw.toLowerCase().trim() === syn) {
            score += 45;
            matchReasons.push(`Synonym match (${queryToken} -> ${syn})`);
            matchedTokens.push(syn);
            synMatched = true;
            break;
          }
        }

        // Check titles
        if (!synMatched) {
          for (const title of localizedTitles) {
            const tTokens = this.tokenize(title);
            if (tTokens.includes(syn)) {
              score += 40;
              matchReasons.push(`Synonym title match (${queryToken} -> ${syn})`);
              matchedTokens.push(syn);
              synMatched = true;
              break;
            }
          }
        }

        // Check descriptions
        if (!synMatched) {
          for (const desc of localizedDescriptions) {
            const dTokens = this.tokenize(desc);
            if (dTokens.includes(syn)) {
              score += 20;
              matchReasons.push(`Synonym description match (${queryToken} -> ${syn})`);
              matchedTokens.push(syn);
              break;
            }
          }
        }
      }
    }

    // 6. Phonetic Normalization matching (Transliteration bridge)
    if (queryPhonetic.length >= 3) {
      // Check titles phonetically
      for (const title of localizedTitles) {
        const titleTokens = this.tokenize(title);
        for (const tToken of titleTokens) {
          const tPhonetic = phoneticNormalize(tToken);
          if (tPhonetic === queryPhonetic) {
            score += 35;
            matchReasons.push(`Phonetic match (${queryToken} ~ ${tToken})`);
            matchedTokens.push(tToken);
            break;
          }
        }
      }

      // Check keywords phonetically
      for (const kw of allKeywords) {
        const kwPhonetic = phoneticNormalize(kw);
        if (kwPhonetic === queryPhonetic) {
          score += 30;
          matchReasons.push(`Phonetic keyword match (${queryToken} ~ ${kw})`);
          matchedTokens.push(kw);
          break;
        }
      }
    }

    // 7. Fuzzy typo matching (Levenshtein distance <= 2 for words with length >= 4)
    if (queryToken.length >= 4) {
      for (const kw of allKeywords) {
        const lowerKw = kw.toLowerCase().trim();
        if (Math.abs(lowerKw.length - queryToken.length) <= 2) {
          const dist = levenshteinDistance(queryToken, lowerKw);
          const maxAllowed = queryToken.length <= 5 ? 1 : 2;
          if (dist > 0 && dist <= maxAllowed) {
            const fuzzyScore = Math.max(10, 30 - dist * 10);
            score += fuzzyScore;
            matchReasons.push(`Fuzzy match [edit-dist:${dist}] (${queryToken} ~ ${lowerKw})`);
            matchedTokens.push(lowerKw);
            break;
          }
        }
      }
    }

    return {
      score: score * priorityMultiplier,
      matchReasons: Array.from(new Set(matchReasons)),
      matchedTokens: Array.from(new Set(matchedTokens)),
    };
  }

  /**
   * Main Search API: searches the multi-lingual index with categorical grouping.
   */
  public search(query: string, options: MultilingualSearchOptions = {}): GroupedSearchResult {
    const startTime = performance.now();
    const rawQuery = (query || "").trim();
    const detectedLocale = options.preferredLocale || detectLocale(rawQuery);
    const queryTokens = this.tokenize(rawQuery);
    const minScore = options.minScoreThreshold ?? 10;
    const limit = options.limit ?? 50;

    // Filter by domain or category if requested
    const targetDomains = options.domain
      ? Array.isArray(options.domain)
        ? options.domain
        : [options.domain]
      : undefined;

    const targetCategories = options.category
      ? Array.isArray(options.category)
        ? options.category
        : [options.category]
      : undefined;

    const matchedSynonymsSet = new Set<string>();
    const scoredResults: SearchResultItem[] = [];

    // Pre-calculate query token phonetics and synonyms
    const tokenMetadata = queryTokens.map((token) => {
      const phonetic = options.enablePhonetics !== false ? phoneticNormalize(token) : "";
      const synonyms = options.enableSynonyms !== false ? this.getSynonyms(token) : [];
      synonyms.forEach((s) => matchedSynonymsSet.add(s));
      return { token, phonetic, synonyms };
    });

    for (const item of this.itemsMap.values()) {
      if (targetDomains && !targetDomains.includes(item.domain)) {
        continue;
      }
      if (targetCategories && !targetCategories.includes(item.category)) {
        continue;
      }

      let itemTotalScore = 0;
      const allReasons: string[] = [];
      const allMatchedTokens: string[] = [];

      // Check full query phrase exact substring in title/description
      const fullQueryLower = rawQuery.toLowerCase();
      const localizedTitles = [
        item.title.en,
        item.title.hi,
        item.title.bn,
        item.title.as,
      ].filter((t): t is string => Boolean(t));

      for (const title of localizedTitles) {
        if (title.toLowerCase().includes(fullQueryLower)) {
          itemTotalScore += 80;
          allReasons.push(`Exact phrase match in title: "${title}"`);
        }
      }

      // Check token by token
      for (const { token, phonetic, synonyms } of tokenMetadata) {
        const { score, matchReasons, matchedTokens } = this.scoreItemAgainstToken(
          token,
          phonetic,
          synonyms,
          item,
          detectedLocale
        );

        itemTotalScore += score;
        allReasons.push(...matchReasons);
        allMatchedTokens.push(...matchedTokens);
      }

      if (itemTotalScore >= minScore) {
        // Pick best localized title/description for current display
        const displayTitle =
          item.title[detectedLocale as keyof LocalizedText] || item.title.en || Object.values(item.title)[0] || "";
        const displayDescription =
          item.description[detectedLocale as keyof LocalizedText] ||
          item.description.en ||
          Object.values(item.description)[0] ||
          "";

        scoredResults.push({
          id: item.id,
          domain: item.domain,
          category: item.category,
          title: displayTitle,
          description: displayDescription,
          localizedTitles: item.title,
          localizedDescriptions: item.description,
          actionLink: this.buildActionLink(item),
          score: Math.round(itemTotalScore),
          matchReasons: Array.from(new Set(allReasons)),
          matchedTokens: Array.from(new Set(allMatchedTokens)),
          status: item.status || "ACTIVE",
          metadata: item.metadata,
        });
      }
    }

    // Sort descending by score
    scoredResults.sort((a, b) => b.score - a.score);

    // Build categorical grouping
    const resultsByDomain: Record<PlatformDomainId, SearchResultItem[]> = {
      umaros: [],
      customer_app: [],
      partner_app: [],
      rider_app: [],
      kingpay: [],
      api_integrations: [],
      affiliate_referral: [],
      marketing_crm: [],
      umar_ai: [],
      finance_bizops: [],
      geo_management: [],
      infra_security: [],
    };

    const resultsByCategory: Record<SearchResultCategory, SearchResultItem[]> = {
      domain: [],
      setting: [],
      feature_switch: [],
      route: [],
      business_parameter: [],
      dictionary_key: [],
      action: [],
    };

    for (const res of scoredResults) {
      if (resultsByDomain[res.domain]) {
        resultsByDomain[res.domain].push(res);
      }
      if (resultsByCategory[res.category]) {
        resultsByCategory[res.category].push(res);
      }
    }

    const endTime = performance.now();

    return {
      query: rawQuery,
      normalizedQuery: queryTokens.join(" "),
      detectedLocale,
      totalMatches: scoredResults.length,
      executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
      topResults: scoredResults.slice(0, limit),
      resultsByDomain,
      resultsByCategory,
      matchedSynonyms: Array.from(matchedSynonymsSet),
    };
  }

  /**
   * Fast autocomplete suggestions for typeahead search bars.
   */
  public autocomplete(prefix: string, limit = 8): AutocompleteSuggestion[] {
    const raw = (prefix || "").toLowerCase().trim();
    if (!raw) return [];

    const suggestions: AutocompleteSuggestion[] = [];
    const detectedLocale = detectLocale(raw);

    for (const item of this.itemsMap.values()) {
      const title =
        item.title[detectedLocale as keyof LocalizedText] || item.title.en || Object.values(item.title)[0] || "";

      if (title.toLowerCase().includes(raw) || item.id.toLowerCase().includes(raw)) {
        suggestions.push({
          text: title,
          targetId: item.id,
          domain: item.domain,
          category: item.category,
          locale: detectedLocale,
          actionLink: this.buildActionLink(item),
        });
        if (suggestions.length >= limit) break;
      }
    }

    return suggestions;
  }

  /**
   * Returns items in a specific domain.
   */
  public getDomainCatalog(domainId: PlatformDomainId): SearchIndexItem[] {
    return Array.from(this.itemsMap.values()).filter((item) => item.domain === domainId);
  }

  /**
   * Returns items in a specific category.
   */
  public getCategoryCatalog(category: SearchResultCategory): SearchIndexItem[] {
    return Array.from(this.itemsMap.values()).filter((item) => item.category === category);
  }

  /**
   * Returns index statistics.
   */
  public getStats(): IndexStats {
    const itemsByDomain: Record<PlatformDomainId, number> = {
      umaros: 0,
      customer_app: 0,
      partner_app: 0,
      rider_app: 0,
      kingpay: 0,
      api_integrations: 0,
      affiliate_referral: 0,
      marketing_crm: 0,
      umar_ai: 0,
      finance_bizops: 0,
      geo_management: 0,
      infra_security: 0,
    };

    const itemsByCategory: Record<SearchResultCategory, number> = {
      domain: 0,
      setting: 0,
      feature_switch: 0,
      route: 0,
      business_parameter: 0,
      dictionary_key: 0,
      action: 0,
    };

    for (const item of this.itemsMap.values()) {
      if (itemsByDomain[item.domain] !== undefined) {
        itemsByDomain[item.domain]++;
      }
      if (itemsByCategory[item.category] !== undefined) {
        itemsByCategory[item.category]++;
      }
    }

    return {
      totalItems: this.itemsMap.size,
      itemsByDomain,
      itemsByCategory,
      totalSynonymClusters: CORE_SYNONYM_CLUSTERS.length,
      supportedLocales: ["en", "hi", "bn", "as"],
    };
  }
}

// ============================================================================
// 8. FACTORY & SINGLETON EXPORT
// ============================================================================

export function createMultilingualSearchEngine(
  items?: readonly SearchIndexItem[]
): MultilingualUniversalSearchEngine {
  return new MultilingualUniversalSearchEngine(items);
}

export const universalSearchEngine = new MultilingualUniversalSearchEngine();
