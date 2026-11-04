/**
 * 🎙️ ORDERKING / KINGPAY AI VOICE ACTION CONCIERGE ENGINE
 * orderking-customers/src/lib/ai/voice-action-concierge.ts
 *
 * Council Directive & Statutory Invariants:
 * 1. Max 1-2 sentence brevity across English, Hindi, Bengali, and Assamese/Sylheti.
 * 2. Dynamic language detection with automatic voice mirroring.
 * 3. Intent-to-action parsing:
 *    - CHECKOUT_POPUP (dish, quantity, integer paise, 5% Sec 9(5) CGST, CCPA packaging cap).
 *    - KINGPAY_POPUP (scan QR, bills, wallet, VPA routing).
 * 4. Founder Profit Defense: Zero discount leak when users request coupons/discounts.
 * 5. Single clarifying question behavior on ambiguous inputs.
 * 6. 100% integer paise precision with zero floating-point math leaks.
 */

import { MULTILINGUAL_DISH_REGISTRY } from "../search/multilingual-dish-matcher.ts";

export type VoiceConciergeLanguage = "en" | "hi" | "bn" | "syl_as";
export type VoiceLocale = "en-IN" | "hi-IN" | "bn-IN" | "as-IN";

export type VoiceConciergeActionType =
  | "CHECKOUT_POPUP"
  | "KINGPAY_POPUP"
  | "CLARIFICATION"
  | "GENERAL_ASSIST";

export interface CheckoutPopupPayload {
  action: "CHECKOUT_POPUP";
  dish: string;
  quantity: number;
  unitPricePaise: number;
  packagingPaise: number;
  foodGstPaise: number;
  totalPricePaise: number;
  currency: "INR";
  discountPaise: 0; // Strictly 0: Founder profit defense!
}

export interface KingPayPopupPayload {
  action: "KINGPAY_POPUP";
  subAction: "SCAN_QR" | "PAY_BILL" | "ADD_MONEY" | "PASSBOOK";
  amountPaise?: number;
  routingVpa: "orderking@ybl" | "9395065587@ybl";
  description: string;
}

export interface ClarificationPayload {
  action: "CLARIFICATION";
  context: "FOOD_SELECTION" | "PAYMENT_METHOD";
}

export interface VoiceConciergeResponse {
  text: string;
  language: VoiceConciergeLanguage;
  voiceLocale: VoiceLocale;
  action: VoiceConciergeActionType;
  payload?: CheckoutPopupPayload | KingPayPopupPayload | ClarificationPayload;
  sentenceCount: number;
  profitDefended: boolean;
}

// Default standard prices in SafeInteger paise
const DEFAULT_DISH_PRICES_PAISE: Record<string, { canonical: string; pricePaise: number }> = {
  biryani: { canonical: "Royal Chicken Dum Biryani", pricePaise: 28000 },
  mutton_biryani: { canonical: "Royal Mutton Dum Biryani", pricePaise: 38000 },
  momos: { canonical: "Steamed Chicken Momos (8 Pcs)", pricePaise: 14000 },
  burger: { canonical: "Crispy Chicken Tower Burger", pricePaise: 16000 },
  pizza: { canonical: "Farmhouse Fresh Pizza", pricePaise: 32000 },
  dosa: { canonical: "Mysore Masala Dosa", pricePaise: 12000 },
  roll: { canonical: "Double Egg Chicken Roll", pricePaise: 11000 },
  chai: { canonical: "Kadak Masala Chai (2 Cups)", pricePaise: 6000 },
  thali: { canonical: "Assamese Fish Thali", pricePaise: 26000 },
};

/**
 * Counts sentences in a response text.
 * Splits on standard punctuation and Indic danda (।).
 */
export function countSentences(text: string): number {
  if (!text || !text.trim()) return 0;
  // Match terminal sentence punctuation: ., !, ?, ।, |
  const rawParts = text
    .trim()
    .split(/[.!?।|]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return Math.max(1, rawParts.length);
}

/**
 * Detects user language and matching TTS voice locale across 4 key regional markets.
 */
export function detectConciergeLanguage(text: string): {
  language: VoiceConciergeLanguage;
  voiceLocale: VoiceLocale;
} {
  const clean = text.trim().toLowerCase();

  // 1. Sylheti / Assamese distinctive phonetic markers
  const sylhetiAssameseMarkers = [
    /কিতা খবর/i,
    /খবর কিতা/i,
    /দেরি অইতাছে/i,
    /দেরি অয়/i,
    /কনে/i,
    /খাবার কনে/i,
    /আইল না/i,
    /ট্যাকা/i,
    /লাগে/i,
    /খাম/i,
    /খাইমু/i,
    /দিয়ক/i,
    /আহিছে/i,
    /নমস্কাৰ/i,
    /অসমীয়া/i,
    /ভাঙতি/i,
    /\bkita khobor\b/i,
    /\bkone\b/i,
    /\btaka\b/i,
    /\bkhabam\b/i,
    /\bkhamu\b/i,
  ];

  for (const marker of sylhetiAssameseMarkers) {
    if (marker.test(clean)) {
      return { language: "syl_as", voiceLocale: "as-IN" };
    }
  }

  // 2. Devanagari script: Hindi
  if (/[\u0900-\u097F]/.test(clean)) {
    return { language: "hi", voiceLocale: "hi-IN" };
  }

  // 3. Bengali script
  if (/[\u0980-\u09FF]/.test(clean)) {
    return { language: "bn", voiceLocale: "bn-IN" };
  }

  // 4. Romanized Hindi keywords
  if (
    /\b(chahiye|karo|batao|kya|kaise|khana|khao|paise|bhejo|mujhe|dena|kardo|bhai|ek|do|teen)\b/i.test(
      clean
    )
  ) {
    return { language: "hi", voiceLocale: "hi-IN" };
  }

  // 5. Romanized Bengali keywords
  if (
    /\b(duto|kothay|khabo|amake|kemon|achen|debe|khabar|debo|bhalo|kichu)\b/i.test(
      clean
    )
  ) {
    return { language: "bn", voiceLocale: "bn-IN" };
  }

  // Default to Indian English
  return { language: "en", voiceLocale: "en-IN" };
}

/**
 * Extracts numeric quantity from text with multilingual number word matching.
 */
function extractQuantity(text: string): number {
  // Devanagari numerals
  if (/२/.test(text)) return 2;
  if (/३/.test(text)) return 3;
  if (/४/.test(text)) return 4;
  if (/५/.test(text)) return 5;
  if (/१/.test(text)) return 1;

  // Bengali numerals: ১, ২, ৩, ৪, ৫
  if (/২/.test(text)) return 2;
  if (/৩/.test(text)) return 3;
  if (/৪/.test(text)) return 4;
  if (/৫/.test(text)) return 5;
  if (/১/.test(text)) return 1;

  // Standard ASCII digits
  const numMatch = text.match(/\b([1-9]|10)\b/);
  if (numMatch) return parseInt(numMatch[1], 10);

  // Words across English, Hindi, Bengali, Assamese
  if (/\b(two|do|duto)\b|দুই|দুটো|দুটি|दो|দুটা/.test(text)) return 2;
  if (/\b(three|teen|tin)\b|তিন|তিনটি|तीन|তিনিটা/.test(text)) return 3;
  if (/\b(four|char)\b|চার|চারটি|चार|চাৰিটা/.test(text)) return 4;
  if (/\b(five|paanch)\b|পাঁচ|পাঁচটি|पाँच|पांच|পাঁচটা/.test(text)) return 5;
  if (/\b(one|ek|ekta)\b|এক|একটি|एक|এটা/.test(text)) return 1;

  return 1;
}

/**
 * Matches requested dish to authentic menu item.
 */
function matchDish(text: string): { canonical: string; pricePaise: number } {
  const clean = text.toLowerCase();

  if (/mutton.*biryani|মটন.*বিরিয়ানি|मटन.*बिरयानी/i.test(clean)) {
    return DEFAULT_DISH_PRICES_PAISE.mutton_biryani;
  }
  if (/biryani|বিরিয়ানি|बिरयानी|বিৰিয়ানি|biriyani/i.test(clean)) {
    return DEFAULT_DISH_PRICES_PAISE.biryani;
  }
  if (/momo|মোমো|मोमो/i.test(clean)) {
    return DEFAULT_DISH_PRICES_PAISE.momos;
  }
  if (/burger|বার্গার|बर्गर/i.test(clean)) {
    return DEFAULT_DISH_PRICES_PAISE.burger;
  }
  if (/pizza|পিজ্জা|पिज़्ज़ा/i.test(clean)) {
    return DEFAULT_DISH_PRICES_PAISE.pizza;
  }
  if (/dosa|দোসা|डोसा/i.test(clean)) {
    return DEFAULT_DISH_PRICES_PAISE.dosa;
  }
  if (/roll|রোল|रोल/i.test(clean)) {
    return DEFAULT_DISH_PRICES_PAISE.roll;
  }
  if (/chai|tea|চা|चाय/i.test(clean)) {
    return DEFAULT_DISH_PRICES_PAISE.chai;
  }
  if (/thali|থালি|थाली/i.test(clean)) {
    return DEFAULT_DISH_PRICES_PAISE.thali;
  }

  // Cross-reference registry
  for (const group of MULTILINGUAL_DISH_REGISTRY) {
    for (const v of group.variations) {
      if (clean.includes(v.toLowerCase())) {
        return { canonical: `Royal ${group.canonicalName}`, pricePaise: 24000 };
      }
    }
  }

  return DEFAULT_DISH_PRICES_PAISE.biryani;
}

/**
 * Primary AI Voice Action Concierge Processor.
 * Evaluates spoken transcripts and text commands, returning localized speech
 * responses (strictly 1–2 sentences) and immediate UI popup triggers.
 */
export function processVoiceActionConcierge(input: string): VoiceConciergeResponse {
  const raw = input.trim();
  const clean = raw.toLowerCase();
  const { language, voiceLocale } = detectConciergeLanguage(raw);

  // =========================================================================
  // 1. FOUNDER PROFIT DEFENSE GATE (Zero Discount Leak)
  // =========================================================================
  const discountKeywords = [
    "discount",
    "coupon",
    "promo",
    "voucher",
    "sasta",
    "kam karo",
    "chhoot",
    "offer",
    "free",
    "diskaunt",
    "डिस्काउंट",
    "कूपन",
    "छूट",
    "कम करो",
    "छাড়",
    "ডিসকাউন্ট",
    "কুপন",
    "কম করো",
    "ফ্রি",
    "কমিশন",
    "সস্তা",
  ];

  const hasDiscountInquiry = discountKeywords.some((kw) => clean.includes(kw));
  if (hasDiscountInquiry) {
    let reply = "";
    switch (language) {
      case "hi":
        reply = "ऑर्डरकिंग पर सभी कीमतें सीधे रेस्टोरेंट की असली नेट दरें हैं जिनमें कोई अतिरिक्त छुपा हुआ मार्जिन नहीं है। आप सीधे सुरक्षित चेकआउट कर सकते हैं।";
        break;
      case "bn":
        reply = "অর্ডারকিংয়ের সমস্ত খাবার সরাসরি রান্নাঘরের আসল মূল্যে তালিকাভুক্ত এবং কোনও গোপন ফি নেই। আপনি সরাসরি নিশ্চিন্তে অর্ডার করতে পারেন।";
        break;
      case "syl_as":
        reply = "অৰ্ডাৰকিংৰ সকলো দাম ৰেষ্টুৰেণ্টৰ পোনপটীয়া দাম, কোনো অতিৰিক্ত চাৰ্জ নাই। আপুনি এতিয়াই পোনপটীয়াকৈ অৰ্ডাৰ কৰিব পাৰে।";
        break;
      case "en":
      default:
        reply = "OrderKing dishes are priced at direct restaurant kitchen net rates with zero aggregator markups. You are already getting the authentic lowest price.";
        break;
    }

    return {
      text: reply,
      language,
      voiceLocale,
      action: "GENERAL_ASSIST",
      sentenceCount: countSentences(reply),
      profitDefended: true,
    };
  }

  // =========================================================================
  // 2. CHECKOUT POPUP INTENT (Direct Food Ordering)
  // =========================================================================
  const orderKeywords = [
    "order",
    "pack",
    "chahiye",
    "khana",
    "lao",
    "bhejo",
    "khabo",
    "khao",
    "অর্ডার",
    "খাবো",
    "দেও",
    "দাও",
    "পাঠাও",
    "অৰ্ডাৰ",
    "লাগে",
    "আনক",
    "চাই",
    "প্যাক",
    "প্লেট",
    "বানাও",
    "মোমো",
    "ম'ম'",
    "বিরিয়ানি",
    "বিৰিয়ানি",
    "बिरयानी",
    "मोमो",
    "खाना",
    "चाहिए",
    "भेजो",
    "लाओ",
    "पैक",
    "प्लेट",
    "biryani",
    "momo",
    "burger",
    "pizza",
    "dosa",
    "roll",
    "thali",
  ];

  const hasOrderIntent = orderKeywords.some((kw) => clean.includes(kw));
  const isAmbiguousFood =
    clean === "food" ||
    clean === "hungry" ||
    clean === "khana" ||
    clean === "kuch khana hai" ||
    clean === "khabar" ||
    clean === "khabar lagbe" ||
    clean === "bhookh lagi hai" ||
    clean === "order food";

  // Single Clarifying Question for Ambiguous Inputs
  if (isAmbiguousFood) {
    let clarifyText = "";
    switch (language) {
      case "hi":
        clarifyText = "क्या आप लज़ीज़ दम बिरयानी, कुरकुरे मोमो या ताज़ा पिज़्ज़ा खाना पसंद करेंगे?";
        break;
      case "bn":
        clarifyText = "আপনি কি সুস্বাদু দম বিরিয়ানি, মোমো নাকি পিজ্জা খেতে পছন্দ করবেন?";
        break;
      case "syl_as":
        clarifyText = "আপুনি সোৱাদযুক্ত দম বিৰিয়ানি, ম'ম' নে পিইজ্জা খাব বিচাৰে?";
        break;
      case "en":
      default:
        clarifyText = "Would you prefer authentic Dum Biryani, steamed Momos, or fresh Pizza today?";
        break;
    }

    return {
      text: clarifyText,
      language,
      voiceLocale,
      action: "CLARIFICATION",
      payload: { action: "CLARIFICATION", context: "FOOD_SELECTION" },
      sentenceCount: countSentences(clarifyText),
      profitDefended: false,
    };
  }

  if (hasOrderIntent) {
    const qty = extractQuantity(raw);
    const dish = matchDish(raw);

    // Exact SafeInteger Paise Arithmetic
    const unitPricePaise = Math.floor(dish.pricePaise);
    const packagingPaise = 3000; // ₹30.00 standard packaging cap
    const foodSubtotalPaise = unitPricePaise * qty;
    // Section 9(5) CGST: 5% on food + packaging
    const taxablePaise = foodSubtotalPaise + packagingPaise;
    const foodGstPaise = Math.round((taxablePaise * 500) / 10000);
    const totalPricePaise = taxablePaise + foodGstPaise;

    let confirmText = "";
    switch (language) {
      case "hi":
        confirmText = `मैंने ${qty} ${dish.canonical} का चेकआउट तैयार कर दिया है। कुल राशि ₹${(totalPricePaise / 100).toFixed(0)} है।`;
        break;
      case "bn":
        confirmText = `আমি আপনার জন্য ${qty}টি ${dish.canonical} চেকআউটে যুক্ত করেছি। মোট মূল্য ₹${(totalPricePaise / 100).toFixed(0)}।`;
        break;
      case "syl_as":
        confirmText = `মই আপোনাৰ বাবে ${qty}টা ${dish.canonical} অৰ্ডাৰৰ বাবে সাজু কৰিছোঁ। মুঠ মূল্য ₹${(totalPricePaise / 100).toFixed(0)}।`;
        break;
      case "en":
      default:
        confirmText = `I have queued ${qty}x ${dish.canonical} for instant checkout. The total amount is ₹${(totalPricePaise / 100).toFixed(0)}.`;
        break;
    }

    return {
      text: confirmText,
      language,
      voiceLocale,
      action: "CHECKOUT_POPUP",
      payload: {
        action: "CHECKOUT_POPUP",
        dish: dish.canonical,
        quantity: qty,
        unitPricePaise,
        packagingPaise,
        foodGstPaise,
        totalPricePaise,
        currency: "INR",
        discountPaise: 0,
      },
      sentenceCount: countSentences(confirmText),
      profitDefended: false,
    };
  }

  // =========================================================================
  // 3. KINGPAY POPUP INTENT (Fintech, QR, Utility Bills)
  // =========================================================================
  const paymentKeywords = [
    "pay",
    "kingpay",
    "upi",
    "qr",
    "scan",
    "bill",
    "wallet",
    "bijli",
    "बिजली",
    "बिल",
    "भुगतान",
    "पे",
    "क्यूआर",
    "वॉलेट",
    "বিদ্যুৎ",
    "টাকা",
    "স্ক্যান",
    "পেমেন্ট",
    "পেই",
    "বিল",
    "ইউপিআই",
    "কিউআৰ",
    "পৰিশোধ",
  ];

  const hasPaymentIntent = paymentKeywords.some((kw) => clean.includes(kw));
  if (hasPaymentIntent) {
    let subAction: KingPayPopupPayload["subAction"] = "SCAN_QR";
    let amountPaise: number | undefined;

    // Check for amount e.g. ₹500 or 500
    const amtMatch = clean.match(/(?:rs\.?|inr|₹|\b)\s*(\d{2,6})\b/i);
    if (amtMatch) {
      const parsedRupees = parseInt(amtMatch[1], 10);
      if (parsedRupees > 0) {
        amountPaise = parsedRupees * 100;
      }
    }

    if (/bill|bijli|बिजली|बिल|বিদ্যুৎ/i.test(clean)) {
      subAction = "PAY_BILL";
    } else if (/add.*money|wallet|वॉलेट/i.test(clean)) {
      subAction = "ADD_MONEY";
    } else if (/passbook|history|statement/i.test(clean)) {
      subAction = "PASSBOOK";
    }

    let confirmText = "";
    switch (language) {
      case "hi":
        confirmText = amountPaise
          ? `किंगपे यूपीআই পেমেন্ট উইন্ডো খোলা হয়েছে। ₹${amountPaise / 100} টাকা সরাসরি পরিশোধ করুন।`
          : "किंगपे क्यूआर स्कैनर और बिल पेमेंट डेस्क खोल दिया गया है। आप सीधे सुरक्षित भुगतान कर सकते हैं।";
        break;
      case "bn":
        confirmText = amountPaise
          ? `কিংপে ইউপিআই পেমেন্ট উইন্ডো খোলা হয়েছে। ₹${amountPaise / 100} টাকা সরাসরি পরিশোধ করুন।`
          : "কিংপে কিউআর স্ক্যানার ও বিল পেমেন্ট ডেস্ক খোলা হয়েছে। আপনি নিরাপদে পেমেন্ট করতে পারেন।";
        break;
      case "syl_as":
        confirmText = amountPaise
          ? `কিংপেত ₹${amountPaise / 100} টকাৰ ইউপিআই পেমেন্ট স্ক্ৰিন মুকলি কৰা হৈছে। পোনপটীয়া পৰিশোধ কৰক।`
          : "কিংপে কিউআৰ স্ক্যানাৰ আৰু বিল পৰিশোধ কেন্দ্ৰ মুকলি কৰা হৈছে। পোনপটীয়াকৈ পৰিশোধ কৰক।";
        break;
      case "en":
      default:
        confirmText = amountPaise
          ? `Opening KingPay for direct UPI payment of ₹${amountPaise / 100}. Please complete the transaction.`
          : "Opening KingPay QR scanner and utility bill desk. You can proceed with secure payment.";
        break;
    }

    return {
      text: confirmText,
      language,
      voiceLocale,
      action: "KINGPAY_POPUP",
      payload: {
        action: "KINGPAY_POPUP",
        subAction,
        amountPaise,
        routingVpa: "orderking@ybl",
        description: `Direct KingPay ${subAction}`,
      },
      sentenceCount: countSentences(confirmText),
      profitDefended: false,
    };
  }

  // =========================================================================
  // 4. GENERAL ASSISTANT DEFAULT (Brevity: 1 Sentence)
  // =========================================================================
  let defaultReply = "";
  switch (language) {
    case "hi":
      defaultReply = "नमस्ते! मैं आपकी ऑर्डरकिंग वॉइस असिस्टेंट हूँ, आप खाना ऑर्डर करने या किंगपे भुगतान के लिए पूछ सकते हैं।";
      break;
    case "bn":
      defaultReply = "নমস্কার! আমি আপনার অর্ডারকিং ভয়েস অ্যাসিস্ট্যান্ট, খাবার অর্ডার বা কিংপে পেমেন্টের জন্য বলুন।";
      break;
    case "syl_as":
      defaultReply = "নমস্কাৰ! মই আপোনাৰ অৰ্ডাৰকিং ভইচ সহকাৰী, খাদ্য বা কিংপে সম্পৰ্কে কওক।";
      break;
    case "en":
    default:
      defaultReply = "Greetings! I am your OrderKing Voice Concierge, ready to help you order meals or pay via KingPay.";
      break;
  }

  return {
    text: defaultReply,
    language,
    voiceLocale,
    action: "GENERAL_ASSIST",
    sentenceCount: countSentences(defaultReply),
    profitDefended: false,
  };
}
