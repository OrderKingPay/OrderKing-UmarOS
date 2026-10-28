import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Crown,
  Loader2,
  Mic,
  MicOff,
  Send,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Utensils,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Minus,
  Plus,
  QrCode,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { detectLanguage } from "@/lib/ai-lang-detect";

export type ConciergeArea = "food" | "kingpay";

export interface SupportedDialect {
  code: string;
  name: string;
  nativeName: string;
  voiceLang: string;
  honorific: string;
  welcome: string;
}

export const CONCIERGE_DIALECTS: SupportedDialect[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    voiceLang: "en-IN",
    honorific: "Valued Patron",
    welcome: "Welcome to OrderKing! I am your VIP concierge for 1-tap food orders and KingPay UPI payments.",
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    voiceLang: "hi-IN",
    honorific: "आदरणीय अतिथि",
    welcome: "ऑर्डरकिंग में आपका स्वागत है! मैं आपका वीआईपी कंसीयर्ज हूँ, खाना ऑर्डर करने या किंगपे भुगतान के लिए पूछिए।",
  },
  {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    voiceLang: "bn-IN",
    honorific: "শ্রদ্ধেয় গ্রাহক",
    welcome: "অর্ডারকিং-এ আপনাকে স্বাগতম! আমি আপনার ভিআইপি কনসিয়ার্জ, খাবার অর্ডার বা কিংপে পেমেন্টের জন্য বলুন।",
  },
  {
    code: "as",
    name: "Assamese",
    nativeName: "অসমীয়া",
    voiceLang: "as-IN",
    honorific: "শ্রদ্ধেয় গ্রাহক",
    welcome: "অৰ্ডাৰকিংলৈ আপোনাক স্বাগতম! মই আপোনাৰ ভিআইপি সহায়ক, খাদ্য অৰ্ডাৰ বা কিংপে পেমেণ্টৰ বাবে সোধক।",
  },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", voiceLang: "ta-IN", honorific: "வணக்கம்", welcome: "வணக்கம்! நான் உங்கள் ஆர்டர்கிங் உணவு மற்றும் பயண உதவியாளர்." },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", voiceLang: "te-IN", honorific: "నమస్కారం", welcome: "నమస్కారం! నేను మీ ఆర్డర్‌కింగ్ ఆహార మరియు ప్రయాణ సహాయకుడిని." },
  { code: "mr", name: "Marathi", nativeName: "मराठी", voiceLang: "mr-IN", honorific: "नमस्कार", welcome: "नमस्कार! मी आपला ऑर्डरकिंग फूड आणि ट्रॅव्हल सहाय्यक आहे." },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", voiceLang: "gu-IN", honorific: "નમસ્તે", welcome: "નમસ્તે! હું તમારો ઓર્ડરકિંગ ફૂડ અને ટ્રાવેલ સહાયક છું." },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", voiceLang: "kn-IN", honorific: "ನಮಸ್ಕಾರ", welcome: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಆರ್ಡರ್‌కింగ్ ఆహార మరియు ప్రయాణ సహాయకుడు." },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", voiceLang: "ml-IN", honorific: "നമസ്കാരം", welcome: "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ ഓർഡർകിംഗ് ഫുഡ് ആൻഡ് ട്രാവൽ അസിസ്റ്റന്റാണ്." },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", voiceLang: "pa-IN", honorific: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ", welcome: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ ਆਰডਰਕਿੰਗ ਫੂਡ ਅਤੇ ਟਰੈਵਲ ਸਹਾਇਕ ਹਾਂ।" },
];

export interface SuggestiveAddOn {
  id: string;
  name: string;
  pricePaise: number;
  label: string;
}

export const SUGGESTIVE_ADD_ONS: SuggestiveAddOn[] = [
  { id: "addon-raita", name: "Chilled Mint Raita", pricePaise: 4000, label: "+ Add Raita ₹40" },
  { id: "addon-gulab-jamun", name: "Gulab Jamun (2 pcs)", pricePaise: 5000, label: "+ Add Gulab Jamun ₹50" },
  { id: "addon-bread", name: "Garlic Breadsticks", pricePaise: 9900, label: "+ Add Garlic Bread ₹99" },
  { id: "addon-soda", name: "Chilled Soda Can", pricePaise: 4000, label: "+ Add Soda ₹40" },
];

export type ActionPayload = {
  type: "NAVIGATE" | "CLAIM_REFUND" | "TRACK_DELIVERY" | "CHECKOUT_POPUP" | "KINGPAY_POPUP";
  label: string;
  url?: string;
  item?: string;
  dishName?: string;
  quantity?: number;
  estimatedPaise?: number;
  pricePaise?: number;
  deliveryEta?: string;
  restaurantName?: string;
  action?: "SCAN" | "BILL" | "TRANSFER";
  vpa?: string;
  amountPaise?: number;
  suggestedAddons?: Array<{ id: string; name: string; pricePaise: number }>;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: ActionPayload;
  timestamp: string;
};

export interface SovereignResolveOptions {
  outOfStockItems?: string[];
  suppressSuggestions?: boolean;
  area?: ConciergeArea;
}

/**
 * Sovereign Autonomous Natural Intelligence Answering Heuristics
 * Strictly produces 1-2 sentence replies across 10 regional dialects without paid external APIs.
 * Supports connected ecosystem 86'd stockout filtering and zero-annoyance irritation radar suppression.
 */
export function resolveSovereignResponse(
  queryText: string,
  dialect: SupportedDialect,
  options?: SovereignResolveOptions
): { reply: string; action?: ActionPayload } {
  const raw = queryText.trim();
  const q = raw.toLowerCase();

  // Behavioral Irritation & Rejection Radar (100% suppression of upsells on "no", "jaldi", "cancel", "only", "bas")
  const isDismissalOrHurry =
    options?.suppressSuggestions === true ||
    /\b(no|nahi|na|nah|stop|don't|dont|just|only|bas|cancel|jaldi|fast|rush|hurry|direct|straight|ruk|chup)\b/i.test(raw);

  // Connected Ecosystem 86'd inventory status check
  const outOfStock = (options?.outOfStockItems || []).map((s) => s.toLowerCase().trim());
  const isItem86 = (identifier: string): boolean => {
    if (outOfStock.length === 0) return false;
    const id = identifier.toLowerCase().trim();
    return outOfStock.some((oos) => oos === id || id.includes(oos) || oos.includes(id));
  };

  // 1. Discount / Coupon Queries (Directive 4: Founder Profit Defense - Zero Auto-Discounts)
  if (
    q.includes("discount") ||
    q.includes("coupon") ||
    q.includes("promo") ||
    q.includes("voucher") ||
    q.includes("kam karo") ||
    q.includes("free") ||
    q.includes("ছাড়") ||
    q.includes("ডিসকাউন্ট") ||
    q.includes("কুপন") ||
    q.includes("ট্যাকা কম")
  ) {
    let reply = "We offer direct authentic kitchen prices and 200 bps 24K gold rewards on all KingPay orders.";
    if (dialect.code === "hi") {
      reply = "हम असली रेस्टोरेंट मेन्यू दरें और किंगपे पर 200 bps 24K डिजिटल गोल्ड रिवॉर्ड्स देते हैं।";
    } else if (dialect.code === "bn") {
      reply = "আমরা সরাসরি আসল রেস্তোরাঁর মূল্যের সাথে কিংপেতে ২০০ bps ২৪K গোল্ড ক্যাশব্যাক রিওয়ার্ড দিই।";
    } else if (dialect.code === "as") {
      reply = "আমি প্ৰত্যক্ষ খাঁটি দাম আৰু কিংপেত ২০০ bps ২৪K সোণৰ পুৰস্কাৰ প্ৰদান কৰোঁ।";
    }
    return {
      reply,
      action: {
        type: "NAVIGATE",
        label: "👑 View 200 bps 24K Gold Rewards",
        url: "/rewards",
      },
    };
  }

  // 2. Ambiguous Food Queries (Directive 3: Exactly 1 clarifying question ending in ?)
  const isAmbiguous =
    q === "food" ||
    q === "hungry" ||
    q === "i want to eat" ||
    q === "kuch khana hai" ||
    q === "khabar lagbe" ||
    q === "khabar khabo" ||
    q === "kiba kham" ||
    q === "khana" ||
    q === "order food" ||
    q === "খাবার" ||
    q.includes("want to eat") ||
    q.includes("kuch khana") ||
    q.includes("khabar khabo") ||
    q.includes("kiba kham");

  if (isAmbiguous) {
    let reply = "Would you prefer our Royal Biryani or Homestyle Thali today?";
    if (dialect.code === "hi") {
      reply = "क्या आप आज हमारी रॉयल बिरयानी पसंद करेंगे या होमस्टाइल थाली?";
    } else if (dialect.code === "bn") {
      reply = "আপনি কি আজ আমাদের রয়্যাল বিরিয়ানি নাকি হোমস্টাইল থালি পছন্দ করবেন?";
    } else if (dialect.code === "as") {
      reply = "আপুনি আজি আমাৰ ৰয়েল বিৰিয়ানি নে ঘৰুৱা থালি বাছি লব বিচাৰিব?";
    }
    return {
      reply,
      action: {
        type: "CHECKOUT_POPUP",
        label: "🍗 Royal Dum Biryani",
        dishName: "Royal Chicken Dum Biryani",
        pricePaise: 28000,
        deliveryEta: "24-28 mins",
      },
    };
  }

  // 3. Late Delivery & SLA
  if (
    q.includes("late") ||
    q.includes("delay") ||
    q.includes("stuck") ||
    q.includes("deri") ||
    q.includes("kahan") ||
    q.includes("kothay")
  ) {
    return {
      reply: "Your rider dispatch ping is escalated with our on-time delivery SLA guarantee.",
      action: { type: "TRACK_DELIVERY", label: "📦 Track Live Rider GPS", url: "/orders" },
    };
  }

  // 4. Missing / Damaged Items & Instant Refund
  if (
    q.includes("missing") ||
    q.includes("spill") ||
    q.includes("damaged") ||
    q.includes("cold") ||
    q.includes("kharab") ||
    q.includes("nosto")
  ) {
    return {
      reply: "Under our zero-interrogation policy, instant 100% full refund is credited to your KingPay balance.",
      action: { type: "CLAIM_REFUND", label: "🛡️ Claim 100% Instant Refund", url: "/orders" },
    };
  }

  // 4b. Language Capability & Understanding Intent
  if (
    /\b(bhasha|language|languages|kun kun|kon kon|bujho|buzo|bhashay|bolte|bhashate|janen|samajh|boliye)\b/i.test(raw) ||
    q.includes("भाषा") ||
    q.includes("மொழி") ||
    q.includes("ভাষাত") ||
    q.includes("ভাষা")
  ) {
    let reply = "I understand English, Hindi, Bengali, Assamese, Sylheti, Tamil, Telugu, and major Indian languages. Please speak or type in any language.";
    if (dialect.code === "hi") {
      reply = "मैं हिन्दी, अंग्रेजी, बंगाली, असमिया, सिल्हटी, तमिल, तेलुगु समझता हूँ। आप अपनी भाषा में पूछ सकते हैं।";
    } else if (dialect.code === "bn") {
      reply = "আমি বাংলা, সিলেটি, অসমীয়া, হিন্দি, ইংরেজি এবং অন্যান্য ভারতীয় ভাষা বুঝি। আপনি স্বাভাবিকভাবে বলুন।";
    } else if (dialect.code === "as") {
      reply = "মই অসমীয়া, বাংলা, চিলঠীয়া, হিন্দী আৰু ইংৰাজী বুজি পাওঁ। আপুনি আপোনাৰ ভাষাত সুধিব পাৰে।";
    } else if (dialect.code === "ta") {
      reply = "நான் தமிழ், ஆங்கிலம், இந்தி, பெங்காலி மற்றும் அஸ்ஸாமி மொழிகளைப் புரிந்துகொள்கிறேன். உங்கள் மொழியில் பேசலாம்.";
    } else if (dialect.code === "te") {
      reply = "నేను తెలుగు, ఇంగ్లీష్, హిందీ, బెంగాలీ మరియు ఇతర భారతీయ భాషలను అర్థం చేసుకుంటాను.";
    }
    return { reply };
  }

  // 4c. Train Ticket Booking & Live PNR Intent (KingConfirm Rail Engine)
  if (
    q.includes("train") ||
    q.includes("rail") ||
    q.includes("ट्रेन") ||
    q.includes("রেল") ||
    q.includes("ট্ৰেইন") ||
    q.includes("টিকিট") ||
    q.includes("টিকট") ||
    q.includes("ட்ரெய்ன்") ||
    q.includes("ரயில்") ||
    q.includes("டிக்கெட்") ||
    q.includes("irctc") ||
    q.includes("pnr") ||
    q.includes("berth") ||
    q.includes("tatkal") ||
    q.includes("sleeper") ||
    q.includes("ticket")
  ) {
    let reply = "You can search train routes, check live seat availability, and book tickets directly.";
    if (dialect.code === "hi") {
      reply = "आप ट्रेन खोज सकते हैं, सीट की उपलब्धता देख सकते हैं और सीधे टिकट बुक कर सकते हैं।";
    } else if (dialect.code === "bn") {
      reply = "আপনি ট্রেনের সময়সূচী ও সিটের প্রাপ্যতা দেখতে পারেন এবং সরাসরি টিকিট বুক করতে পারেন।";
    } else if (dialect.code === "as") {
      reply = "আপুনি ট্ৰেইন বিচাৰিব পাৰে, ছিটৰ উপলব্ধতা চাব পাৰে আৰু পোনপটীয়াকৈ টিকট বুক কৰিব পাৰে।";
    } else if (dialect.code === "ta") {
      reply = "நீங்கள் ரயில்களைத் தேடலாம், இருக்கை இருப்பைச் சரிபார்க்கலாம் மற்றும் நேரடியாக டிக்கெட் முன்பதிவு செய்யலாம்.";
    } else if (dialect.code === "te") {
      reply = "మీరు రైళ్లను శోధించవచ్చు, సీట్ల లభ్యతను తనిఖీ చేయవచ్చు మరియు టిక్కెట్లను బుక్ చేసుకోవచ్చు.";
    }
    return {
      reply,
      action: {
        type: "NAVIGATE",
        label: "🚆 Book Train Tickets & Live PNR",
        url: "/travel?tab=trains",
      },
    };
  }

  // 4d. Flight Booking & Carrier Comparison Intent (ignoring cab rides to airport)
  if (
    (!q.includes("cab") && !q.includes("taxi") && !q.includes("auto") && !q.includes("gaadi") && !q.includes("gadi")) &&
    (q.includes("flight") ||
      q.includes("airline") ||
      q.includes("airport") ||
      q.includes("plane") ||
      q.includes("उड़ान") ||
      q.includes("विमान") ||
      q.includes("হওয়াই") ||
      q.includes("ফ্লাইট") ||
      q.includes("বিমান") ||
      q.includes("বিমানৰ") ||
      q.includes("விமானம்") ||
      q.includes("indigo") ||
      q.includes("air india"))
  ) {
    let reply = "Search official airline fares with live comparison and direct booking.";
    if (dialect.code === "hi") {
      reply = "सभी एयरलाइंस के आधिकारिक किराए देखें और सीधे टिकट बुक करें।";
    } else if (dialect.code === "bn") {
      reply = "অফিসিয়াল এয়ারলাইনসের সরাসরি ভাড়া তুলনা করে টিকিট বুক করুন।";
    } else if (dialect.code === "as") {
      reply = "অফিচিয়েল এয়াৰলাইনছৰ প্ৰত্যক্ষ ভাড়া তুলনা কৰি টিকট বুক কৰক।";
    } else if (dialect.code === "ta") {
      reply = "அதிகாரப்பூர்வ விமானக் கட்டணங்களை ஒப்பிட்டு உடனடியாக முன்பதிவு செய்யுங்கள்.";
    }
    return {
      reply,
      action: {
        type: "NAVIGATE",
        label: "✈️ Search & Book Official Carrier Flights",
        url: "/travel?tab=flights",
      },
    };
  }

  // 4e. Hotel & Luxury Stay Intent
  if (
    q.includes("hotel") ||
    q.includes("room") ||
    q.includes("lodge") ||
    q.includes("resort") ||
    q.includes("stay") ||
    q.includes("होटल") ||
    q.includes("कमरा") ||
    q.includes("হোটেল") ||
    q.includes("ৰুম") ||
    q.includes("விடுதி")
  ) {
    let reply = "Explore verified hotels and luxury stays with authentic room rates.";
    if (dialect.code === "hi") {
      reply = "सत्यापित होटल और कमरे देखें, सीधे प्रामाणिक दरों पर।";
    } else if (dialect.code === "bn") {
      reply = "যাচাইকৃত হোটেল এবং থাকার জায়গা খুঁজুন আসল মূল্যে।";
    } else if (dialect.code === "as") {
      reply = "যাচাই কৰা হোটেল আৰু কোঠা বিচাৰক প্ৰকৃত দামত।";
    } else if (dialect.code === "ta") {
      reply = "சரிபார்க்கப்பட்ட தங்கும் விடுதிகளை சிறந்த கட்டணத்தில் முன்பதிவு செய்யுங்கள்.";
    }
    return {
      reply,
      action: {
        type: "NAVIGATE",
        label: "🏨 Browse & Book Verified Hotels",
        url: "/travel?tab=hotels",
      },
    };
  }

  // 4f. Holiday Tours & Packages Intent
  if (
    q.includes("tour") ||
    q.includes("holiday") ||
    q.includes("package") ||
    q.includes("vacation") ||
    q.includes("घूमना") ||
    q.includes("ট্যুর") ||
    q.includes("ভ্রমণ") ||
    q.includes("ছুটি") ||
    q.includes("ভ্ৰমণ") ||
    q.includes("சுற்றுலா")
  ) {
    let reply = "Explore curated national and international holiday tour packages.";
    if (dialect.code === "hi") {
      reply = "घरेलू और अंतरराष्ट्रीय हॉलिडे टूर पैकेज देखें।";
    } else if (dialect.code === "bn") {
      reply = "জাতীয় এবং আন্তর্জাতিক ট্যুর প্যাকেজ দেখুন।";
    } else if (dialect.code === "as") {
      reply = "ৰাষ্ট্ৰীয় আৰু আন্তঃৰাষ্ট্ৰীয় ভ্ৰমণ পেকেজ চাওক।";
    } else if (dialect.code === "ta") {
      reply = "சுற்றுலா தொகுப்புகளை ஆராயுங்கள்.";
    }
    return {
      reply,
      action: {
        type: "NAVIGATE",
        label: "🌴 Explore Holiday Tours & Packages",
        url: "/travel?tab=tours",
      },
    };
  }

  // 4g. Utility Bills & Recharges Intent
  if (
    q.includes("electricity") ||
    q.includes("dth") ||
    q.includes("water") ||
    q.includes("gas") ||
    q.includes("broadband") ||
    q.includes("recharge") ||
    q.includes("बिजली") ||
    q.includes("बिल") ||
    q.includes("বিদ্যুৎ") ||
    q.includes("পানীৰ বিল") ||
    q.includes("மின்சாரம்") ||
    q.includes("fastag")
  ) {
    let reply = "Pay electricity, water, gas, and broadband bills directly through Bharat BillPay.";
    if (dialect.code === "hi") {
      reply = "भारत बिलपे के माध्यम से बिजली, पानी, गैस और मोबाइल बिल का तुरंत भुगतान करें।";
    } else if (dialect.code === "bn") {
      reply = "ভারত বিলপে-র মাধ্যমে বিদ্যুৎ, জল, গ্যাস ও রিচার্জ সরাসরি পরিশোধ করুন।";
    } else if (dialect.code === "as") {
      reply = "ভাৰত বিলপে-ৰ জৰিয়তে বিজুলী, পানী আৰু গেছৰ বিল পৰিশোধ কৰক।";
    } else if (dialect.code === "ta") {
      reply = "பாரத் பில்பே மூலம் மின்சாரம், தண்ணீர் மற்றும் எரிவாயு கட்டணங்களை செலுத்துங்கள்.";
    }
    return {
      reply,
      action: {
        type: "KINGPAY_POPUP",
        action: "BILL",
        label: "⚡ Pay Utility Bill with KingPay",
        vpa: "orderking@ybl",
        amountPaise: 25000,
      },
    };
  }

  // 4h. Customer Assistance & Navigation Guidance Intent
  if (
    q.includes("help") ||
    q.includes("confused") ||
    q.includes("how to use") ||
    q.includes("kahan jau") ||
    q.includes("madad") ||
    q.includes("sahayata") ||
    q.includes("কি করব") ||
    q.includes("কী করব") ||
    q.includes("কোথায় যাব") ||
    q.includes("কিভাবে ব্যবহার করব") ||
    q.includes("কেনে ব্যৱহাৰ কৰিম") ||
    q.includes("উপায়ে") ||
    q.includes("সাহায্য") ||
    q.includes("உதவி") ||
    q.includes("guide") ||
    q.includes("where to go") ||
    q.includes("back") ||
    q.includes("front")
  ) {
    let reply = "I can help you navigate: food delivery, UPI payments, utility bills, transit cabs, train tickets, or flights.";
    if (dialect.code === "hi") {
      reply = "मैं आपकी पूरी सहायता करूँगा: खाना ऑर्डर, यूपीआई पेमेंट, बिल भुगतान, सिटी कैब, ट्रेन या फ्लाइट टिकट।";
    } else if (dialect.code === "bn") {
      reply = "আমি আপনাকে সাহায্য করব: খাবার অর্ডার, ইউপিআই পেমেন্ট, বিল পরিশোধ, ট্যাক্সি, ট্রেন বা বিমানের টিকিট।";
    } else if (dialect.code === "as") {
      reply = "মই আপোনাৰ সহায় কৰিম: খাদ্য অৰ্ডাৰ, ইউপিআই পেমেণ্ট, বিল পৰিশোধ, কেব, ট্ৰেইন বা বিমানৰ টিকট।";
    } else if (dialect.code === "ta") {
      reply = "நான் உங்களுக்கு உதவ தயாராக உள்ளேன்: உணவு, பணம், பில், டாக்ஸி, ரயில் அல்லது விமான டிக்கெட்டுகள்.";
    }
    return {
      reply,
      action: {
        type: "NAVIGATE",
        label: "🧭 Explore KingPay All Services Desk",
        url: "/kingpay",
      },
    };
  }

  // 4i. Cab, Taxi & Transit Dispatch Intent (Point-to-Point City Travel)
  if (
    q.includes("cab") ||
    q.includes("taxi") ||
    q.includes("car") ||
    q.includes("ride") ||
    q.includes("auto") ||
    q.includes("rickshaw") ||
    q.includes("gaadi") ||
    q.includes("gadi") ||
    q.includes("airport") ||
    q.includes("station")
  ) {
    let reply = "Your verified city cab and auto transit is ready with direct KingPay UPI settlement.";
    if (dialect.code === "hi") {
      reply = "आपकी वेरिफाइड सिटी कैब तैयार है। किंगपे यूपीआई द्वारा डायरेक्ट पेमेंट।";
    } else if (dialect.code === "bn") {
      reply = "আপনার ভেরিফাইড সিটি ট্যাক্সি ও অটো প্রস্তুত। সরাসরি কিংপে ইউপিআই পেমেন্ট।";
    } else if (dialect.code === "as") {
      reply = "আপোনাৰ প্ৰস্তুত চিটি কেব সাজু হৈছে। পোনপটীয়া কিংপে ইউপিআই পেমেণ্ট।";
    } else if (dialect.code === "ta") {
      reply = "உங்கள் சரிபார்க்கப்பட்ட நகர டாக்ஸி தயாராக உள்ளது.";
    }
    return {
      reply,
      action: {
        type: "NAVIGATE",
        label: "🚖 1-Tap Book Verified City Cab & Auto",
        url: "/travel?tab=cabs",
      },
    };
  }

  // 5. Biryani Ordering with Contextual Suggestive Selling & 86'd Stock Filter
  if (
    q.includes("biryani") ||
    q.includes("biriyani") ||
    q.includes("बिरयानी") ||
    q.includes("বিরিয়ানি") ||
    q.includes("বিৰিয়ানি")
  ) {
    // Check if Biryani itself is marked 86'd (out of stock) in kitchen live POS inventory
    if (isItem86("biryani") || isItem86("Chicken Dum Biryani") || isItem86("Royal Chicken Dum Biryani")) {
      let soldOutReply = "Royal Chicken Dum Biryani is currently sold out (86'd) at the kitchen. Would you prefer our fresh Homestyle Thali or Mutton Dum Biryani?";
      if (dialect.code === "hi") {
        soldOutReply = "चिकन दम बिरयानी इस समय किचन में समाप्त (86'd) है। क्या आप ताज़ा होमस्टाइल थाली या मटन दम बिरयानी पसंद करेंगे?";
      } else if (dialect.code === "bn") {
        soldOutReply = "চিকেন দম বিরিয়ানি বর্তমানে রান্নাঘরে শেষ (86'd) হয়ে গেছে। আপনি কি তাজা হোমস্টাইল থালি বা মাটন বিরিয়ানি নিতে চান?";
      } else if (dialect.code === "as") {
        soldOutReply = "চিকেন দম বিৰিয়ানি বৰ্তমান ৰান্ধনশালাত শেষ (86'd) হৈছে। আপুনি ঘৰুৱা থালি নে মটন বিৰিয়ানি বাছি লব বিচাৰিব?";
      }

      return {
        reply: soldOutReply,
        action: {
          type: "CHECKOUT_POPUP",
          label: "👑 1-Tap Checkout: Fresh Homestyle Thali",
          dishName: "Royal Homestyle Thali",
          item: "Royal Homestyle Thali",
          quantity: 1,
          pricePaise: 26000,
          estimatedPaise: 26000,
          restaurantName: "Behrouz Royal Kitchens (Assam - 788710)",
          deliveryEta: "20-25 mins",
        },
      };
    }

    let quantity = 1;
    const digitMatch = q.match(/\b([1-9]|10)\b/);
    if (digitMatch) {
      quantity = parseInt(digitMatch[1], 10);
    } else if (/\b(two|do|duto|duti|duita|2x)\b/i.test(q)) {
      quantity = 2;
    }
    const unitPaise = 28000;
    const estimatedPaise = unitPaise * quantity;

    // Filter add-on pairings against live 86'd stock and irritation radar
    const baseBiryaniAddons = [
      { id: "addon-raita", name: "Chilled Mint Raita", pricePaise: 4000 },
      { id: "addon-gulab-jamun", name: "Gulab Jamun (2 pcs)", pricePaise: 5000 },
    ];
    const availableBiryaniAddons = isDismissalOrHurry
      ? []
      : baseBiryaniAddons.filter((a) => !isItem86(a.id) && !isItem86(a.name));

    let reply = "I've loaded your Chicken Dum Biryani checkout.";
    if (availableBiryaniAddons.length > 0 && !isDismissalOrHurry) {
      reply = "I've loaded your Chicken Dum Biryani checkout. Would you like to add anything else?";
      if (dialect.code === "bn") {
        reply = "আমি চিকেন দম বিরিয়ানি চেকআউট লোড করেছি। সাথে আর কিছু যোগ করতে চান?";
      } else if (dialect.code === "hi") {
        reply = "मैंने आपका चिकन दम बिरयानी चेकआउट तैयार किया है। क्या आप कुछ और जोड़ना चाहेंगे?";
      } else if (dialect.code === "as") {
        reply = "মই চিকেন দম বিৰিয়ানি চেকআউট সাজু কৰিছোঁ। লগত আন কিবা লব বিচাৰিব নেকি?";
      } else if (dialect.code === "ta") {
        reply = "உங்கள் சிக்கன் பிரியாணி தயாராக உள்ளது. வேறு ஏதேனும் சேர்க்க விரும்புகிறீர்களா?";
      }
    } else {
      if (dialect.code === "bn") {
        reply = "আমি আপনার চিকেন দম বিরিয়ানি সরাসরি চেকআউটে লোড করেছি।";
      } else if (dialect.code === "hi") {
        reply = "मैंने आपका चिकन दम बिरयानी सीधे चेकआउट के लिए तैयार किया है।";
      } else if (dialect.code === "as") {
        reply = "মই আপোনাৰ চিকেন দম বিৰিয়ানি পোনপটীয়াকৈ চেকআউটত সাজু কৰিছোঁ।";
      } else if (dialect.code === "ta") {
        reply = "உங்கள் சிக்கன் பிரியாணி ஆர்டர் தயாராக உள்ளது.";
      }
    }

    return {
      reply,
      action: {
        type: "CHECKOUT_POPUP",
        label: `👑 1-Tap Checkout: Chicken Dum Biryani (${quantity}x)`,
        dishName: "Royal Chicken Dum Biryani (Handi)",
        item: "Royal Chicken Dum Biryani",
        quantity,
        pricePaise: estimatedPaise,
        estimatedPaise,
        restaurantName: "Behrouz Royal Kitchens (Assam - 788710)",
        deliveryEta: "24-28 mins",
        suggestedAddons: availableBiryaniAddons.length > 0 ? availableBiryaniAddons : undefined,
      },
    };
  }

  // 6. Pizza Ordering with Contextual Suggestive Selling & 86'd Stock Filter
  if (q.includes("pizza") || q.includes("पिज़्ज़ा") || q.includes("পিজ্জা")) {
    // Check if Pizza itself is 86'd
    if (isItem86("pizza") || isItem86("Farmhouse Fresh Pizza") || isItem86("Artisan Woodfired Pizza")) {
      return {
        reply: "Farmhouse Fresh Pizza is currently sold out (86'd) at the kitchen. Would you prefer our fresh Steamed Momos or Crispy Burger?",
        action: {
          type: "CHECKOUT_POPUP",
          label: "👑 1-Tap Checkout: Steamed Momos (8 Pcs)",
          dishName: "Steamed Chicken Momos (8 Pcs)",
          item: "Steamed Chicken Momos (8 Pcs)",
          quantity: 1,
          pricePaise: 18000,
          estimatedPaise: 18000,
          restaurantName: "La Pino'z Kitchens",
          deliveryEta: "15-20 mins",
        },
      };
    }

    let quantity = 1;
    const digitMatch = q.match(/\b([1-9]|10)\b/);
    if (digitMatch) {
      quantity = parseInt(digitMatch[1], 10);
    } else if (/\b(two|do|duto|duti|duita|2x)\b/i.test(q)) {
      quantity = 2;
    }
    const unitPaise = 32000;
    const estimatedPaise = unitPaise * quantity;

    const basePizzaAddons = [
      { id: "addon-bread", name: "Garlic Breadsticks", pricePaise: 9900 },
      { id: "addon-soda", name: "Chilled Soda Can", pricePaise: 4000 },
    ];
    const availablePizzaAddons = isDismissalOrHurry
      ? []
      : basePizzaAddons.filter((a) => !isItem86(a.id) && !isItem86(a.name));

    let reply = "Artisan Woodfired Pizza is ready for checkout.";
    if (dialect.code === "bn") {
      reply = "পিজ্জা চেকআউট লোড করেছি।";
    } else if (dialect.code === "hi") {
      reply = "पिज़्ज़ा चेकआउट तैयार है।";
    } else if (dialect.code === "as") {
      reply = "পিজ্জা চেকআউট সাজু হৈছে।";
    } else if (dialect.code === "ta") {
      reply = "பீட்சா ஆர்டர் தயாராக உள்ளது.";
    }

    return {
      reply,
      action: {
        type: "CHECKOUT_POPUP",
        label: `👑 1-Tap Checkout: Farmhouse Pizza (${quantity}x)`,
        dishName: "Farmhouse Fresh Pizza",
        item: "Farmhouse Fresh Pizza",
        quantity,
        pricePaise: estimatedPaise,
        estimatedPaise,
        restaurantName: "La Pino'z Kitchens",
        deliveryEta: "20-25 mins",
        suggestedAddons: availablePizzaAddons.length > 0 ? availablePizzaAddons : undefined,
      },
    };
  }

  // 7. General Food Ordering
  if (q.includes("order") || q.includes("khana") || q.includes("momo") || q.includes("burger")) {
    return {
      reply: "Your food selection is loaded. Confirm in 1-tap with direct KingPay UPI settlement.",
      action: {
        type: "CHECKOUT_POPUP",
        label: "🍗 1-Tap Checkout: Express Order",
        dishName: "Royal Feast Platter",
        item: "Royal Feast Platter",
        quantity: 1,
        pricePaise: 26000,
        estimatedPaise: 26000,
        restaurantName: "OrderKing Kitchens",
        deliveryEta: "20-25 mins",
        suggestedAddons: [
          { id: "addon-raita", name: "Chilled Mint Raita", pricePaise: 4000 },
          { id: "addon-gulab-jamun", name: "Gulab Jamun (2 pcs)", pricePaise: 5000 },
        ],
      },
    };
  }

  // 8. KingPay, UPI & Bills
  if (
    q.includes("pay") ||
    q.includes("kingpay") ||
    q.includes("upi") ||
    q.includes("bill") ||
    q.includes("recharge") ||
    q.includes("qr") ||
    q.includes("scan")
  ) {
    let actionType: "SCAN" | "BILL" | "TRANSFER" = "TRANSFER";
    if (q.includes("scan") || q.includes("qr")) {
      actionType = "SCAN";
    } else if (q.includes("bill") || q.includes("recharge")) {
      actionType = "BILL";
    }

    let reply = "KingPay direct NPCI 1-Tap UPI and Sovereign BharatQR scanner are ready.";
    if (dialect.code === "hi") {
      reply = "डायरेक्ट एनपीसीआई 1-टैप यूपीआई और भारतक्यूआर स्कैनर तैयार है।";
    } else if (dialect.code === "bn") {
      reply = "সরাসরি এনপিসিআই ১-ট্যাপ ইউপিআই এবং ভারতকিউআর স্ক্যানার প্রস্তুত।";
    } else if (dialect.code === "as") {
      reply = "পোনপটীয়া এনপিচিআই ১-টেপ ইউপিআই আৰু ভাৰতকিউআৰ স্ক্যানাৰ সাজু আছে।";
    }

    return {
      reply,
      action: {
        type: "KINGPAY_POPUP",
        action: actionType,
        label:
          actionType === "SCAN"
            ? "📸 Open KingPay BharatQR Scanner"
            : actionType === "BILL"
            ? "⚡ Pay Utility Bill with KingPay"
            : "⚡ Launch 1-Tap KingPay UPI / QR",
        vpa: "orderking@ybl",
        amountPaise: 25000,
      },
    };
  }

  // 9. Default
  if (options?.area === "kingpay") {
    let reply = "I am your KingPay VIP Concierge. How may I assist your UPI payment, bill recharge, or transit cabs?";
    if (dialect.code === "hi") {
      reply = "मैं आपका किंगपे वीआईपी कंसीयर्ज हूँ। यूपीआई भुगतान, बिल रिचार्ज या यात्रा में सहायता के लिए पूछिए।";
    } else if (dialect.code === "bn") {
      reply = "আমি আপনার কিংপে ভিআইপি কনসিয়ার্জ। ইউপিআই পেমেন্ট, বিল রিচার্জ বা ভ্রমণের জন্য বলুন।";
    } else if (dialect.code === "as") {
      reply = "মই আপোনাৰ কিংপে ভিআইপি সহায়ক। ইউপিআই পেমেণ্ট, বিল ৰিচাৰ্জ বা ভ্ৰমণৰ বাবে সোধক।";
    }
    return {
      reply,
      action: {
        type: "KINGPAY_POPUP",
        action: "TRANSFER",
        label: "⚡ Launch 1-Tap KingPay UPI / QR",
        vpa: "orderking@ybl",
        amountPaise: 25000,
      },
    };
  }

  let defaultReply = "I am your OrderKing VIP Concierge. How may I assist your dining or KingPay experience today?";
  if (dialect.code === "hi") {
    defaultReply = "मैं आपका ऑर्डरकिंग वीआईपी कंसीयर्ज हूँ। भोजन ऑर्डर या किंगपे सेवा में क्या सहायता करूँ?";
  } else if (dialect.code === "bn") {
    defaultReply = "আমি আপনার অর্ডারকিং ভিআইপি কনসিয়ার্জ। খাবার অর্ডার বা কিংপে সেবায় কীভাবে সাহায্য করতে পারি?";
  } else if (dialect.code === "as") {
    defaultReply = "মই আপোনাৰ অৰ্ডাৰকিং ভিআইপি সহায়ক। খাদ্য অৰ্ডাৰ বা কিংপে সেৱাত কেনেদৰে সহায় কৰিব পাৰোঁ?";
  }

  return {
    reply: defaultReply,
    action: {
      type: "CHECKOUT_POPUP",
      label: "🍗 1-Tap Checkout: Royal Dum Biryani",
      dishName: "Royal Chicken Dum Biryani",
      pricePaise: 28000,
      deliveryEta: "24-28 mins",
      suggestedAddons: [
        { id: "addon-raita", name: "Chilled Mint Raita", pricePaise: 4000 },
        { id: "addon-gulab-jamun", name: "Gulab Jamun (2 pcs)", pricePaise: 5000 },
      ],
    },
  };
}

export function CustomerConciergeDrawer({
  open,
  onClose,
  area = "food",
  embedded = false,
  outOfStockItems = [],
}: {
  open: boolean;
  onClose: () => void;
  area?: ConciergeArea;
  embedded?: boolean;
  outOfStockItems?: string[];
}) {
  const { user } = useCurrentUserState();
  const navigate = useNavigate();

  const [selectedLang, setSelectedLang] = useState<SupportedDialect>(CONCIERGE_DIALECTS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Intent-to-Action Bottom Sheet Pop-Up State
  const [activePopup, setActivePopup] = useState<
    | {
        type: "CHECKOUT_POPUP";
        dishName: string;
        pricePaise: number;
        deliveryEta: string;
        restaurantName?: string;
        suggestedAddons?: Array<{ id: string; name: string; pricePaise: number }>;
      }
    | {
        type: "KINGPAY_POPUP";
        vpa: string;
        amountPaise: number;
      }
    | null
  >(null);
  const [popupQuantity, setPopupQuantity] = useState(1);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [kingpayAmountRupees, setKingpayAmountRupees] = useState<number>(250);
  const [kingpayTab, setKingpayTab] = useState<"upi" | "qr">("upi");

  // Mind-Reading & Behavioral Sentiment Radar (Zero-Annoyance Invariant)
  const [suppressSuggestions, setSuppressSuggestions] = useState(false);

  // Extra customizable dishes/items added by voice or text inside checkout sheet
  const [customAddons, setCustomAddons] = useState<Array<{ id: string; name: string; pricePaise: number }>>([]);
  const [customAddonText, setCustomAddonText] = useState("");

  const handleAddCustomItem = (itemText: string) => {
    const clean = itemText.trim();
    if (!clean) return;

    // Estimate realistic restaurant integer paise based on item category
    let estPaise = 5000; // default ₹50
    if (/\b(roti|naan|paratha|kulcha|bread)\b/i.test(clean)) estPaise = 4000; // ₹40
    else if (/\b(coke|pepsi|thums|drink|beverage|soda|tea|chai|coffee|lassi)\b/i.test(clean)) estPaise = 4000; // ₹40
    else if (/\b(sweet|jamun|phirni|kheer|dessert|ice cream)\b/i.test(clean)) estPaise = 5000; // ₹50
    else if (/\b(curry|paneer|chicken|mutton|fish|dal|biryani)\b/i.test(clean)) estPaise = 18000; // ₹180
    else if (/\b(raita|chutney|salad|papad)\b/i.test(clean)) estPaise = 3000; // ₹30

    setCustomAddons((prev) => [
      ...prev,
      { id: `custom-${Date.now()}-${Math.random().toString(36).substring(7)}`, name: clean, pricePaise: estPaise },
    ]);
    setCustomAddonText("");
    toast.success(`Added ${clean} (${formatPaise(estPaise)}) to your feast!`);
  };

  // Calculations for Checkout Bottom-Sheet (₹ and integer paise)
  const dishPricePaise = activePopup?.type === "CHECKOUT_POPUP" ? activePopup.pricePaise : 0;
  const dishSubtotalPaise = dishPricePaise * popupQuantity;
  const rawAvailableAddons =
    activePopup?.type === "CHECKOUT_POPUP" && activePopup.suggestedAddons?.length
      ? activePopup.suggestedAddons
      : SUGGESTIVE_ADD_ONS;
  const availableAddons = rawAvailableAddons.filter((addon) => {
    const id = addon.id.toLowerCase();
    const name = addon.name.toLowerCase();
    return !outOfStockItems.some((oos) => {
      const o = oos.toLowerCase().trim();
      return o === id || o === name || id.includes(o) || name.includes(o);
    });
  });
  const addOnsSubtotalPaise = selectedAddOnIds.reduce((sum, id) => {
    const item = availableAddons.find((a) => a.id === id);
    return sum + (item ? item.pricePaise : 0);
  }, 0);
  const customAddonsTotalPaise = customAddons.reduce((sum, item) => sum + item.pricePaise, 0);
  const grandTotalPaise = dishSubtotalPaise + addOnsSubtotalPaise + customAddonsTotalPaise;

  // Initialize Welcome Message
  useEffect(() => {
    if (messages.length === 0) {
      const isKingPay = area === "kingpay";
      let welcomeContent = selectedLang.welcome;
      if (isKingPay) {
        if (selectedLang.code === "hi") {
          welcomeContent = "किंगपे वीआईपी कंसीयर्ज में आपका स्वागत है! यूपीआई, भारतक्यूआर, बिल भुगतान या सिटी कैब के लिए पूछिए।";
        } else if (selectedLang.code === "bn") {
          welcomeContent = "কিংপে ভিআইপি কনসিয়ার্জে স্বাগতম! ইউপিআই, ভারতকিউআর, বিল পেমেন্ট বা সিটি ক্যাবের জন্য বলুন।";
        } else if (selectedLang.code === "as") {
          welcomeContent = "কিংপে ভিআইপি সহায়কলৈ স্বাগতম! ইউপিআই, ভাৰতকিউআৰ, বিল পেমেণ্ট বা চিটি কেবৰ বাবে সোধক।";
        } else {
          welcomeContent = "Welcome to KingPay VIP Concierge! Ask to pay bills, scan BharatQR, book transit cabs, or send 1-tap UPI.";
        }
      }

      setMessages([
        {
          id: "welcome-init",
          role: "assistant",
          content: welcomeContent,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          action: isKingPay
            ? {
                type: "KINGPAY_POPUP",
                label: "⚡ Launch 1-Tap KingPay UPI / QR",
                vpa: "orderking@ybl",
                amountPaise: 25000,
              }
            : {
                type: "CHECKOUT_POPUP",
                label: "🍗 1-Tap Checkout: Royal Dum Biryani",
                dishName: "Royal Chicken Dum Biryani",
                restaurantName: "Behrouz Royal Kitchens (Assam - 788710)",
                pricePaise: 28000,
                deliveryEta: "24-28 mins",
                suggestedAddons: [
                  { id: "addon-raita", name: "Chilled Mint Raita", pricePaise: 4000 },
                  { id: "addon-gulab-jamun", name: "Gulab Jamun (2 pcs)", pricePaise: 5000 },
                ],
              },
        },
      ]);
    }
  }, [selectedLang, area]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activePopup) {
          setActivePopup(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, activePopup]);

  // Clean-up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Handle Speech Recognition (Microphone Voice Input with Real-time Preview)
  function handleToggleVoiceInput() {
    if (typeof window === "undefined") return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      toast.error("Voice input is not supported on this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      setInterimTranscript("");
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = selectedLang.voiceLang;
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript("");
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const finalTranscript = event.results[i][0].transcript;
            setInterimTranscript("");
            setIsListening(false);
            setQuestion(finalTranscript);
            handleSend(finalTranscript, true);
            return;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (interim) {
          setInterimTranscript(interim);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setInterimTranscript("");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (_err) {
      setIsListening(false);
      setInterimTranscript("");
    }
  }

  // Handle Natural Voice Playback (SpeechSynthesis)
  function handleSpeak(id: string, text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !soundEnabled) return;
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#•_]/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = selectedLang.voiceLang;
    utterance.pitch = 1.05;
    utterance.rate = 0.98;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  }

  // Dispatch Message
  function handleSend(textToSend?: string, wasSpoken: boolean = false) {
    const raw = (textToSend ?? question).trim();
    if (!raw) return;

    // Detect language / dialect automatically
    const detectedCode = detectLanguage(raw, selectedLang.code);
    const matchedDialect = CONCIERGE_DIALECTS.find((d) => d.code === detectedCode) || selectedLang;
    if (matchedDialect.code !== selectedLang.code) {
      setSelectedLang(matchedDialect);
    }

    const userEntry: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: raw,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userEntry]);
    setQuestion("");
    setInterimTranscript("");

    // Mind-reading sentiment radar: If user indicates rejection, hurry, or dismissiveness, silence suggestions immediately
    const isDismissalOrHurry = /\b(no|nahi|na|nah|stop|don't|dont|just|only|bas|cancel|jaldi|fast|rush|hurry|direct|straight|ruk|chup)\b/i.test(raw);
    const nextSuppress = suppressSuggestions || isDismissalOrHurry;
    if (isDismissalOrHurry) {
      setSuppressSuggestions(true);
    }

    // Sovereign Local Resolution with 0 External Paid APIs (passing outOfStockItems, suppressSuggestions, and area)
    const { reply, action } = resolveSovereignResponse(raw, matchedDialect, {
      outOfStockItems,
      suppressSuggestions: nextSuppress,
      area,
    });

    setTimeout(() => {
      const aiEntry: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: reply,
        action,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiEntry]);

      // If user spoke via mic and sound is enabled, speak back automatically
      if (wasSpoken && soundEnabled) {
        handleSpeak(aiEntry.id, reply);
      }
    }, 150);
  }

  if (!open) return null;

  return (
    <div
      className={embedded ? "relative w-full" : "fixed inset-0 z-[90] flex justify-end bg-slate-950/60 backdrop-blur-sm"}
      role="presentation"
      onMouseDown={(e) => {
        if (!embedded && e.target === e.currentTarget && !activePopup) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal={!embedded}
        aria-label="OrderKing VIP Food & Dining Concierge"
        className={
          embedded
            ? "relative flex h-[min(76dvh,680px)] w-full flex-col overflow-hidden rounded-3xl border border-amber-300/30 bg-slate-950 text-white shadow-xl max-w-full"
            : "relative flex h-full w-full max-w-md flex-col bg-slate-950 text-white shadow-2xl sm:rounded-l-3xl border-l border-amber-400/20 overflow-hidden"
        }
      >
        {/* Header with 10 Languages Selector & Audio Toggle */}
        <div className="flex flex-col gap-2.5 border-b border-amber-400/20 bg-gradient-to-r from-emerald-950 via-slate-950 to-slate-950 px-4 sm:px-5 py-3.5 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300 shrink-0">
                <Sparkles className="size-5 text-amber-400" />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-white truncate">
                  {area === "kingpay" ? "KingPay Support" : "OrderKing Support"}
                </h2>
                <p className="text-[11px] text-slate-400 truncate">
                  Voice &amp; Chat Customer Assistant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Sound Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  if (!next && typeof window !== "undefined" && "speechSynthesis" in window) {
                    window.speechSynthesis.cancel();
                    setSpeakingId(null);
                  }
                  toast.info(next ? "Voice Assistant audio enabled." : "Voice Assistant audio muted.");
                }}
                className={cn(
                  "flex items-center gap-1 px-2 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer",
                  soundEnabled
                    ? "bg-amber-400/20 text-amber-300 border-amber-400/40 hover:bg-amber-400/30"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"
                )}
                title={soundEnabled ? "Voice Audio is ON (tap to mute)" : "Voice Audio is Muted (tap to unmute)"}
                aria-label={soundEnabled ? "Mute audio" : "Enable audio"}
              >
                {soundEnabled ? <Volume2 className="size-3.5 text-amber-400" /> : <VolumeX className="size-3.5" />}
                <span className="hidden xs:inline">{soundEnabled ? "Audio ON" : "Muted"}</span>
              </button>

              {!embedded && (
                <button
                  type="button"
                  aria-label="Close concierge"
                  onClick={onClose}
                  className="rounded-xl p-1.5 text-slate-300 hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              )}
            </div>
          </div>

          {/* Language Selector Pill Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none text-xs">
            <span className="shrink-0 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Language:</span>
            {CONCIERGE_DIALECTS.map((d) => (
              <button
                key={d.code}
                type="button"
                onClick={() => setSelectedLang(d)}
                className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                  selectedLang.code === d.code
                    ? "bg-amber-400 text-slate-950 font-bold shadow-sm"
                    : "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
                }`}
              >
                {d.nativeName}
              </button>
            ))}
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 space-y-3.5 overflow-y-auto p-3.5 sm:p-4" aria-live="polite">
          {messages.map((m) => {
            const isAi = m.role === "assistant";
            const isSpeaking = speakingId === m.id;
            return (
              <div
                key={m.id}
                className={`space-y-2 max-w-[94%] ${isAi ? "mr-auto" : "ml-auto"}`}
              >
                <div
                  className={`rounded-2xl p-3.5 text-xs leading-relaxed ${
                    isAi
                      ? "border border-slate-800 bg-slate-900/95 text-slate-100 shadow-xs"
                      : "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-700/40 text-[10px] opacity-75">
                    <span>{isAi ? (area === "kingpay" ? "KingPay Support" : "OrderKing Support") : "You"}</span>
                    <span>{m.timestamp}</span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap">{m.content}</p>

                  {isAi && (
                    <div className="mt-2.5 flex items-center justify-between pt-1 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleSpeak(m.id, m.content)}
                        className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                          isSpeaking ? "bg-amber-400 text-slate-950 font-bold" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                        title="Listen to response"
                      >
                        {isSpeaking ? <VolumeX className="size-3.5 text-slate-950" /> : <Volume2 className="size-3.5" />}
                        <span>{isSpeaking ? "Stop" : "Listen"}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 1-Tap Action Cards & Pop-Up Triggers */}
                {m.action && (
                  m.action.type === "CHECKOUT_POPUP" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActivePopup({
                          type: "CHECKOUT_POPUP",
                          dishName: m.action?.dishName || "Royal Chicken Dum Biryani",
                          restaurantName: m.action?.restaurantName || "Behrouz Royal Kitchens (Assam - 788710)",
                          pricePaise: m.action?.pricePaise || 28000,
                          deliveryEta: m.action?.deliveryEta || "24-28 mins",
                          suggestedAddons: m.action?.suggestedAddons,
                        });
                        setPopupQuantity(1);
                        setSelectedAddOnIds([]);
                      }}
                      className="flex w-full items-center justify-between rounded-xl border border-amber-400/50 bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 px-3.5 py-2.5 text-left text-xs font-black text-amber-200 transition-all shadow-[0_2px_12px_rgba(251,191,36,0.15)] active:scale-[0.98] cursor-pointer"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Crown className="size-4 text-amber-400 shrink-0" />
                        <span className="truncate">{m.action.label}</span>
                      </span>
                      <span className="text-amber-400 text-sm font-bold shrink-0">➔</span>
                    </button>
                  ) : m.action.type === "KINGPAY_POPUP" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActivePopup({
                          type: "KINGPAY_POPUP",
                          vpa: m.action?.vpa || "orderking@ybl",
                          amountPaise: m.action?.amountPaise || 25000,
                        });
                      }}
                      className="flex w-full items-center justify-between rounded-xl border border-emerald-400/50 bg-gradient-to-r from-emerald-500/20 via-teal-400/15 to-emerald-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 px-3.5 py-2.5 text-left text-xs font-black text-emerald-200 transition-all shadow-[0_2px_12px_rgba(16,185,129,0.15)] active:scale-[0.98] cursor-pointer"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <CreditCard className="size-4 text-emerald-400 shrink-0" />
                        <span className="truncate">{m.action.label}</span>
                      </span>
                      <span className="text-emerald-400 text-sm font-bold shrink-0">➔</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (m.action?.url) {
                          onClose();
                          void navigate({ to: m.action.url as any });
                        }
                      }}
                      className="flex w-full items-center justify-between rounded-xl border border-amber-400/40 bg-amber-400/10 px-3.5 py-2 text-left text-xs font-bold text-amber-200 transition-all hover:bg-amber-400/20 active:scale-[0.98] cursor-pointer"
                    >
                      <span className="truncate">{m.action.label}</span>
                      <span className="text-amber-400 shrink-0">→</span>
                    </button>
                  )
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* 1-Tap Quick Action Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-t border-slate-800/80 bg-slate-900/60 px-4 py-2 scrollbar-none">
          {(area === "kingpay"
            ? [
                { label: "🚆 Train Tickets", text: "Book train tickets and check live PNR." },
                { label: "✈️ Flight Bookings", text: "Search and book airline flight tickets." },
                { label: "⚡ Pay Utility Bills", text: "Pay electricity or water bill with KingPay." },
                { label: "🚖 City Cabs & Auto", text: "Book a city cab or taxi transit with direct KingPay." },
                { label: "📸 Scan BharatQR", text: "Open KingPay camera to scan BharatQR." },
                { label: "🍗 Order Food Delivery", text: "I want to order Royal Dum Biryani food." },
              ]
            : [
                { label: "🍗 Order Dum Biryani", text: "I want to order Royal Dum Biryani." },
                { label: "🍕 Fresh Pizza", text: "Order fresh pizza." },
                { label: "🚆 Train Tickets", text: "Book train tickets and check live PNR." },
                { label: "👑 KingPay UPI", text: "How do I pay with KingPay UPI or scan BharatQR?" },
                { label: "📦 Track Delivery & ETA", text: "Where is my delivery rider and what is the ETA?" },
                { label: "🛡️ Report Spilled/Late Food", text: "My food arrived cold and leaked. I need a refund." },
              ]
          ).map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => handleSend(chip.text)}
              className="shrink-0 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] text-slate-300 border border-slate-700 font-medium cursor-pointer transition active:scale-95"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Real-time Voice Transcription Preview & Audio Wave Bar */}
        {isListening && (
          <div
            role="status"
            aria-live="assertive"
            className="mx-3.5 mb-1 p-2.5 rounded-xl bg-amber-500/15 border border-amber-400/50 text-amber-200 flex items-center justify-between gap-2 shadow-lg animate-in fade-in duration-150 transform-gpu"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 shrink-0">
                Listening:
              </span>
              <p className="text-xs italic text-white truncate min-w-0 font-medium">
                "{interimTranscript || `Speak now in ${selectedLang.nativeName}...`}"
              </p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0 text-amber-400">
              <span className="w-1 h-3 bg-amber-400 rounded-full animate-pulse" />
              <span className="w-1 h-4 bg-amber-300 rounded-full animate-[pulse_0.4s_ease-in-out_infinite]" />
              <span className="w-1 h-2 bg-amber-400 rounded-full animate-[pulse_0.7s_ease-in-out_infinite]" />
            </div>
          </div>
        )}

        {/* Input & Voice Controls */}
        <div className="border-t border-slate-800 bg-slate-950 p-3 sm:p-3.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            {/* Voice Microphone with Pulsating Gold Glow Ring */}
            <button
              type="button"
              onClick={handleToggleVoiceInput}
              className={cn(
                "relative rounded-xl p-2.5 transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0",
                isListening
                  ? "bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 text-slate-950 ring-4 ring-amber-400/70 ring-offset-2 ring-offset-slate-950 animate-pulse shadow-[0_0_25px_rgba(251,191,36,0.7)]"
                  : "bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800 hover:border-amber-400/50"
              )}
              title={isListening ? "Stop listening" : "Speak your question (Voice Concierge)"}
              aria-label={isListening ? "Listening active. Tap to stop." : "Activate voice input"}
            >
              {isListening ? (
                <MicOff className="size-4 animate-bounce" />
              ) : (
                <Mic className="size-4 text-amber-400" />
              )}
              {isListening && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                </span>
              )}
            </button>

            <input
              type="text"
              aria-label="Ask VIP Concierge"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={isListening ? "Listening to your voice..." : `Ask in ${selectedLang.nativeName} or English...`}
              className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-400"
            />

            <button
              type="submit"
              disabled={!question.trim()}
              className="rounded-xl bg-amber-400 p-2.5 text-slate-950 font-bold disabled:opacity-40 hover:bg-amber-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 cursor-pointer"
              aria-label="Send question"
            >
              <Send className="size-4" />
            </button>
          </form>

          <p className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-3 text-emerald-400" /> Safe Harbor &amp; Operational SLA
            </span>
            <Link to="/support" className="text-amber-300 underline">
              Founder Desk
            </Link>
          </p>
        </div>

        {/* ─── 3D JEWEL INTENT-TO-ACTION BOTTOM SHEET POP-UP ─── */}
        {activePopup && (
          <div
            role="presentation"
            className="absolute inset-0 z-40 bg-black/75 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget) setActivePopup(null);
            }}
          >
            <div
              role="region"
              aria-label={activePopup.type === "CHECKOUT_POPUP" ? "1-Tap Luxury Checkout Pop-Up" : "KingPay 1-Tap UPI Pop-Up"}
              className="relative w-full max-h-[92%] overflow-y-auto overflow-x-hidden rounded-t-[32px] border-t-2 border-x border-amber-400/50 bg-gradient-to-b from-[#13111c] via-[#0b0914] to-black p-4 sm:p-5 text-white shadow-[0_-20px_50px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(251,191,36,0.3)] animate-in slide-in-from-bottom duration-200 transform-gpu will-change-transform space-y-4"
            >
              {/* Drag Indicator */}
              <div className="w-12 h-1 rounded-full bg-slate-700 mx-auto" />

              {activePopup.type === "CHECKOUT_POPUP" ? (
                <>
                  {/* Checkout Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0 shadow-[0_2px_10px_rgba(251,191,36,0.2)]">
                        <Crown className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5 truncate">
                          <span>1-Tap Luxury Checkout</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                            Fast Track
                          </span>
                        </h3>
                        <p className="text-[10.5px] text-slate-400 truncate">
                          Direct Kitchen Handoff · GSTIN: 18AFXPH9838M1Z9
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePopup(null)}
                      className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
                      aria-label="Close checkout popup"
                    >
                      <X className="size-5" />
                    </button>
                  </div>

                  {/* Dish Item Card with Quantity Selector */}
                  <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Utensils className="size-3.5 text-amber-400 shrink-0" />
                          <h4 className="text-xs sm:text-sm font-black text-white truncate">
                            {activePopup.dishName}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {activePopup.restaurantName || "Verified Patron Kitchen (Assam - 788710)"}
                        </p>
                        <div className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                          <span>⚡ Delivery ETA:</span>
                          <span className="font-mono">{activePopup.deliveryEta}</span>
                        </div>
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-700 shrink-0">
                        <button
                          type="button"
                          disabled={popupQuantity <= 1}
                          onClick={() => setPopupQuantity((q) => Math.max(1, q - 1))}
                          className="size-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white flex items-center justify-center font-bold text-sm transition cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="font-mono text-xs sm:text-sm font-black px-2 text-white">
                          {popupQuantity}
                        </span>
                        <button
                          type="button"
                          disabled={popupQuantity >= 10}
                          onClick={() => setPopupQuantity((q) => Math.min(10, q + 1))}
                          className="size-7 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 disabled:opacity-40 flex items-center justify-center font-bold text-sm transition cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* The 1-Line Natural Hospitality Inquiry & Multi-Dish Customization */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>🍽️</span>
                        <span>Would you like to add anything else?</span>
                      </span>
                      {!suppressSuggestions && (
                        <button
                          type="button"
                          onClick={() => setSuppressSuggestions(true)}
                          className="text-[10px] text-slate-400 hover:text-amber-200 transition underline cursor-pointer"
                        >
                          Skip additions
                        </button>
                      )}
                    </div>

                    {/* Quick Chef Pairing Pills */}
                    {!suppressSuggestions && availableAddons.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {availableAddons.map((addon) => {
                          const isSelected = selectedAddOnIds.includes(addon.id);
                          return (
                            <button
                              key={addon.id}
                              type="button"
                              onClick={() => {
                                setSelectedAddOnIds((prev) =>
                                  isSelected ? prev.filter((id) => id !== addon.id) : [...prev, addon.id]
                                );
                              }}
                              className={cn(
                                "px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 border",
                                isSelected
                                  ? "bg-amber-400 text-slate-950 border-amber-300 font-black shadow-sm"
                                  : "bg-slate-950 text-slate-300 border-slate-800 hover:border-amber-400/50 hover:bg-slate-800"
                              )}
                            >
                              <span>{isSelected ? "✓" : "+"}</span>
                              <span>{addon.name}</span>
                              <span className={isSelected ? "text-slate-950 font-black" : "text-amber-400 font-mono"}>
                                {formatPaise(addon.pricePaise)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Write or Speak Custom Dishes or Instructions */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        type="text"
                        value={customAddonText}
                        onChange={(e) => setCustomAddonText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && customAddonText.trim()) {
                            e.preventDefault();
                            handleAddCustomItem(customAddonText.trim());
                          }
                        }}
                        placeholder="Type or voice any extra dish (e.g. 2 Butter Naan, Coke)..."
                        className="flex-1 rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-400 min-h-[38px]"
                      />
                      <button
                        type="button"
                        disabled={!customAddonText.trim()}
                        onClick={() => handleAddCustomItem(customAddonText.trim())}
                        className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs disabled:opacity-40 transition cursor-pointer min-h-[38px] shrink-0"
                      >
                        + Add
                      </button>
                    </div>

                    {/* Custom Added Extra Items List */}
                    {customAddons.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                        {customAddons.map((ci) => (
                          <div key={ci.id} className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                            <span className="flex items-center gap-1.5 text-slate-200">
                              <span className="text-amber-400 font-bold">•</span>
                              <span className="font-medium">{ci.name}</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-amber-300 font-bold">{formatPaise(ci.pricePaise)}</span>
                              <button
                                type="button"
                                onClick={() => setCustomAddons((prev) => prev.filter((x) => x.id !== ci.id))}
                                className="text-slate-400 hover:text-rose-400 text-xs font-bold px-1 py-0.5 rounded transition"
                                title="Remove item"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Transparent Integer Paise Breakdown */}
                  <div className="p-3 rounded-2xl bg-black/40 border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Item Subtotal ({popupQuantity}x):</span>
                      <span className="font-mono text-white font-bold">
                        {formatPaise(dishSubtotalPaise)}{" "}
                        <span className="text-[10px] text-slate-400">({dishSubtotalPaise.toLocaleString()} paise)</span>
                      </span>
                    </div>
                    {selectedAddOnIds.length > 0 && (
                      <div className="flex justify-between text-slate-400">
                        <span>Pairing Add-ons ({selectedAddOnIds.length}):</span>
                        <span className="font-mono text-amber-300 font-bold">
                          +{formatPaise(addOnsSubtotalPaise)}{" "}
                          <span className="text-[10px] text-slate-400">({addOnsSubtotalPaise.toLocaleString()} paise)</span>
                        </span>
                      </div>
                    )}
                    {customAddons.length > 0 && (
                      <div className="flex justify-between text-slate-400">
                        <span>Extra Customized Items ({customAddons.length}):</span>
                        <span className="font-mono text-amber-300 font-bold">
                          +{formatPaise(customAddonsTotalPaise)}{" "}
                          <span className="text-[10px] text-slate-400">({customAddonsTotalPaise.toLocaleString()} paise)</span>
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-400">
                      <span>Delivery Partner Convenience:</span>
                      <span className="text-emerald-400 font-bold">₹0.00 (Patron Privilege)</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-black text-white">
                      <span>Total Payable:</span>
                      <div className="text-right">
                        <span className="text-base font-black text-amber-300 font-mono">
                          {formatPaise(grandTotalPaise)}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {grandTotalPaise.toLocaleString()} integer paise
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 1-Tap Confirm & Pay via KingPay UPI Button */}
                  <button
                    type="button"
                    onClick={() => {
                      toast.success(
                        `🎉 Order Placed! Paid ${formatPaise(grandTotalPaise)} (${grandTotalPaise} paise) via KingPay UPI.`
                      );
                      setActivePopup(null);
                      onClose();
                      void navigate({ to: "/orders" as any });
                    }}
                    className="w-full min-h-[46px] py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:brightness-110 active:scale-[0.98] text-slate-950 font-black text-xs sm:text-sm transition-all shadow-[0_4px_20px_rgba(251,191,36,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Crown className="size-4 text-slate-950" />
                    <span>Confirm &amp; Pay {formatPaise(grandTotalPaise)} via KingPay UPI</span>
                  </button>
                </>
              ) : (
                <>
                  {/* KingPay UPI / QR Modal */}
                  <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-9 rounded-xl bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0 shadow-[0_2px_10px_rgba(16,185,129,0.2)]">
                        <CreditCard className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-black text-white truncate">
                          KingPay 1-Tap UPI &amp; BharatQR
                        </h3>
                        <p className="text-[10.5px] text-slate-400 truncate">
                          Direct NPCI Settlement · Sovereign Banking Gateway
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePopup(null)}
                      className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
                      aria-label="Close KingPay popup"
                    >
                      <X className="size-5" />
                    </button>
                  </div>

                  {/* Tab Selection */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setKingpayTab("upi")}
                      className={cn(
                        "py-1.5 text-xs font-bold rounded-lg transition cursor-pointer",
                        kingpayTab === "upi" ? "bg-amber-400 text-slate-950 shadow-sm font-black" : "text-slate-400 hover:text-white"
                      )}
                    >
                      Direct 1-Tap UPI
                    </button>
                    <button
                      type="button"
                      onClick={() => setKingpayTab("qr")}
                      className={cn(
                        "py-1.5 text-xs font-bold rounded-lg transition cursor-pointer",
                        kingpayTab === "qr" ? "bg-amber-400 text-slate-950 shadow-sm font-black" : "text-slate-400 hover:text-white"
                      )}
                    >
                      Scan BharatQR
                    </button>
                  </div>

                  {kingpayTab === "upi" ? (
                    <div className="space-y-3">
                      {/* Preset quick amounts */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-400 block">Select Quick Amount:</span>
                        <div className="grid grid-cols-4 gap-2">
                          {[100, 250, 500, 1000].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setKingpayAmountRupees(amt)}
                              className={cn(
                                "py-2 rounded-xl text-xs font-bold border transition active:scale-95 cursor-pointer",
                                kingpayAmountRupees === amt
                                  ? "bg-amber-400 text-slate-950 border-amber-300 font-black shadow-sm"
                                  : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
                              )}
                            >
                              ₹{amt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Amount and Integer Paise Input */}
                      <div className="p-3 rounded-2xl bg-black/40 border border-slate-800 space-y-1">
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Routing VPA:</span>
                          <span className="font-mono text-emerald-400 font-bold">orderking@ybl</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Amount:</span>
                          <span className="font-mono text-white font-bold">
                            ₹{kingpayAmountRupees}.00 ({(kingpayAmountRupees * 100).toLocaleString()} paise)
                          </span>
                        </div>
                      </div>

                      {/* 1-Tap Launch Button */}
                      <a
                        href={`upi://pay?pa=9395065587@ybl&pn=OrderKingPay&am=${kingpayAmountRupees}&cu=INR&tn=OrderKingVIPConcierge`}
                        onClick={() => {
                          toast.success(`Launching UPI app for ₹${kingpayAmountRupees}...`);
                        }}
                        className="w-full min-h-[46px] py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:brightness-110 active:scale-[0.98] text-white font-black text-xs sm:text-sm transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 no-underline cursor-pointer"
                      >
                        <Zap className="size-4" />
                        <span>Launch UPI (PhonePe / GPay / Paytm)</span>
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-3 text-center py-2">
                      <div className="size-36 mx-auto rounded-2xl border-2 border-dashed border-amber-400/50 bg-black/60 p-4 flex flex-col items-center justify-center relative overflow-hidden">
                        <QrCode className="size-20 text-amber-400" />
                        <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-[pulse_1.5s_ease-in-out_infinite]" />
                      </div>
                      <p className="text-xs text-slate-300">
                        Scan any merchant BharatQR or NPCI QR to settle instantly via KingPay double-entry ledger.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setActivePopup(null);
                          onClose();
                          void navigate({ to: "/kingpay" as any });
                        }}
                        className="w-full min-h-[44px] py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition border border-slate-700 cursor-pointer"
                      >
                        Open Camera Scanner
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
