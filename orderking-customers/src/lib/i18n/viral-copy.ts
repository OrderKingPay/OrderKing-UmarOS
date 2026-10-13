/**
 * OrderKing Hyperlocal Multi-Dialect Viral Engine
 * Covers: Sylheti (ছিলটী), Bengali (বাংলা), Assamese (অসমীয়া), Hindi (हिन्दी), and English (en).
 */

export type DialectCode = "syl" | "bn" | "as" | "hi" | "en";

export type ViralShareHook =
  | "area_delivery_share"
  | "restaurant_share"
  | "gold_reward_share"
  | "order_placed_share";

export interface ViralShareContext {
  townName?: string;
  areaName?: string;
  restaurantName?: string;
  restaurantSlug?: string;
  cuisine?: string;
  orderTotalRupees?: number;
  referralCode?: string;
  restaurantCount?: number;
}

export interface DialectShareCopy {
  title: string;
  text: string;
  whatsappMessage: string;
}

// ============================================================================
// Multi-Dialect Copy Matrix
// ============================================================================

export const VIRAL_COPY_MATRIX: Record<
  ViralShareHook,
  Record<DialectCode, (ctx: ViralShareContext, shareUrl: string) => DialectShareCopy>
> = {
  // 1. Hyperlocal Area Delivery Share (Neighborhood WhatsApp Groups)
  area_delivery_share: {
    syl: (ctx, url) => {
      const town = ctx.townName || "করিমগঞ্জ";
      const area = ctx.areaName || "স্টেশন রোড";
      const msg = `👑 *${town}র ${area}ত অখন অর্ডার কিং আইয়া গেছে!* 🔥\n\nরেস্টুরেন্টের আসল দামে গরম বিরিয়ানি ও খাওন ঘরের দরজাত মাত্র ২৫ মিনিটে! কোনো বাড়টি চার্জ নাই।\n\nআমার লিংক দিয়া অর্ডার করইন আর ফার্স্ট অর্ডারে ৫০০ টেকা বোনাস ক্যাশ পাউবা: ${url}\n\nজলদি করইন, অফার সীমিত সময়ের লাগি! 🍔🍕`;
      return {
        title: `${area}, ${town}ত অর্ডার কিং ডেলিভারি`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    bn: (ctx, url) => {
      const town = ctx.townName || "করিমগঞ্জ";
      const area = ctx.areaName || "লোকাল এরিয়া";
      const msg = `👑 *${town}-এর ${area}-তে এবার অর্ডার কিং ডেলিভারি চালু!* 🚀\n\nরেস্তোরাঁর আসল দামে গরম বিরিয়ানি ও খাবার মাত্র ২৫ মিনিটে ডেলিভারি। কোনো অতিরিক্ত মেন্যু চার্জ নেই।\n\nআমার লিংক দিয়ে অর্ডার করে পেয়ে যান ₹৫০০ ওয়েলকাম ক্যাশ ও ২৪ ক্যারেট ডিজিটাল গোল্ড: ${url}\n\nআপনার বন্ধুদেরও শেয়ার করুন! 🍲`;
      return {
        title: `${area}, ${town}-এ সেরা খাবার ডেলিভারি`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    as: (ctx, url) => {
      const town = ctx.townName || "গুৱাহাটী";
      const area = ctx.areaName || "পল্টন বজাৰ";
      const msg = `👑 *${town}ৰ ${area}ত এতিয়া অৰ্ডাৰ কিং লাইভ!* ⚡\n\nআপোনাৰ প্ৰিয় ৰেস্তোৰাঁৰ পৰা গৰম খাদ্য মাত্ৰ ২৫ মিনিটত ঘৰৰ দুৱাৰমুখত। কোনো অতিৰিক্ত দাম বা চাৰ্জ নাই।\n\nমোৰ লিংক ব্যৱহাৰ কৰি প্ৰথম অৰ্ডাৰত লাভ কৰক ₹৫০০ খাদ্য বোনাস আৰু ডিজিটেল সোণ: ${url}\n\nএতিয়াই অৰ্ডাৰ কৰক! 🍛`;
      return {
        title: `${area}, ${town}ত অৰ্ডাৰ কিং ছুপাৰফাষ্ট খাদ্য ডেলিভাৰী`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    hi: (ctx, url) => {
      const town = ctx.townName || "करीमगंज";
      const area = ctx.areaName || "लोकल एरिया";
      const msg = `👑 *${town} के ${area} में अब ऑर्डर किंग की फास्ट डिलीवरी!* 🚀\n\nअसली रेस्टोरेंट रेट पर गरमा-गरम खाना सिर्फ 25 मिनट में आपके घर। 0% मेन्यू मार्कअप!\n\nमेरे वीआईपी लिंक से ऑर्डर करें और पहले ऑर्डर पर पाएं फ्लैट ₹500 वेलकम कैश: ${url}\n\nअभी ऑर्डर करें और 24K डिजिटल गोल्ड जीतें! 🍔🍕`;
      return {
        title: `${area}, ${town} में बेस्ट फूड डिलीवरी`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    en: (ctx, url) => {
      const town = ctx.townName || "Karimganj";
      const area = ctx.areaName || "Local Area";
      const msg = `👑 *Food Delivery in ${area}, ${town} is LIVE on OrderKing!* ⚡\n\nOrder piping hot meals in 25 mins with ZERO menu markups. Direct kitchen pricing.\n\nClaim your flat ₹500 Food Welcome Bonus on your first meal: ${url}\n\nGuaranteed 24K Digital Gold rewards on every order! 🍔🍕`;
      return {
        title: `Best Food Delivery in ${area}, ${town} - OrderKing`,
        text: msg,
        whatsappMessage: msg,
      };
    },
  },

  // 2. Specific Restaurant Viral Share
  restaurant_share: {
    syl: (ctx, url) => {
      const rest = ctx.restaurantName || "আমড়ার প্রিয় রেস্টুরেন্ট";
      const cuisine = ctx.cuisine ? ` (${ctx.cuisine})` : "";
      const msg = `🔥 *${rest}*${cuisine}র অসাধারণ খাওন অখন অর্ডার কিং-এ!\n\nরেস্টুরেন্টের আসল দামে অর্ডার করইন, ২৫ মিনিটে দরজাত পাইবা। আমার লিংক দিয়া পাইবা ৫০০ টেকার ছাড়: ${url}\n\nখাওয়ার টেবিলে মিলিয়া খাওক! 👑`;
      return {
        title: `${rest} - অর্ডার কিং`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    bn: (ctx, url) => {
      const rest = ctx.restaurantName || "সেরা রেস্তোরাঁ";
      const cuisine = ctx.cuisine ? ` (${ctx.cuisine})` : "";
      const msg = `🔥 *${rest}*${cuisine}-এর খাঁটি খাবার অর্ডার করুন অর্ডার কিং-এ!\n\nসরাসরি রেস্তোরাঁর দামে ২৫ মিনিটে হোম ডেলিভারি। আমার ভিআইপি লিংকে পাবেন ₹৫০০ খাদ্য বোনাস: ${url}\n\nদারুণ স্বাদ, শূন্য অতিরিক্ত চার্জ! 🚀`;
      return {
        title: `${rest} থেকে অর্ডার করুন - অর্ডার কিং`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    as: (ctx, url) => {
      const rest = ctx.restaurantName || "প্ৰিয় ৰেস্তোৰাঁ";
      const cuisine = ctx.cuisine ? ` (${ctx.cuisine})` : "";
      const msg = `🔥 *${rest}*${cuisine}ৰ সোৱাদ এতিয়া পোনে পোনে আপোনাৰ ঘৰত!\n\nঅৰ্ডাৰ কিং এপৰ জৰিয়তে ২৫ মিনিটত ডেলিভাৰী। মোৰ লিংকৰে অৰ্ডাৰ কৰক আৰু লাভ কৰক ₹৫০০ বোনাস: ${url}\n\nকোনো অতিৰিক্ত মাচুল নাই! 👑`;
      return {
        title: `${rest} - অৰ্ডাৰ কিং অসম`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    hi: (ctx, url) => {
      const rest = ctx.restaurantName || "बेस्ट रेस्टोरेंट";
      const cuisine = ctx.cuisine ? ` (${ctx.cuisine})` : "";
      const msg = `🔥 *${rest}*${cuisine} का लाजवाब खाना अब ऑर्डर किंग पर!\n\n0% मेन्यू मार्कअप और 25 मिनट में सुपरफास्ट डिलीवरी। मेरे इनवाइट लिंक से पाएं ₹500 वेलकम बोनस: ${url}\n\nअसली स्वाद, असली रेट! 👑`;
      return {
        title: `${rest} ऑन ऑर्डर किंग`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    en: (ctx, url) => {
      const rest = ctx.restaurantName || "Favorite Kitchen";
      const cuisine = ctx.cuisine ? ` (${ctx.cuisine})` : "";
      const msg = `🔥 Check out *${rest}*${cuisine} on OrderKing!\n\nPiping hot delivery in 25 mins with ZERO menu markup. Use my VIP invite link to get flat ₹500 Food Cash: ${url}\n\nAuthentic food, direct kitchen prices! 👑`;
      return {
        title: `Order from ${rest} on OrderKing`,
        text: msg,
        whatsappMessage: msg,
      };
    },
  },

  // 3. 24K Gold Reward & Jackpot Gamified Loop
  gold_reward_share: {
    syl: (_, url) => {
      const msg = `🪙 *অর্ডার কিং-এ প্রতি অর্ডারে খাঁটি ২৪ ক্যারেট ডিজিটাল গোল্ড ফ্রিতে দেওয়ানি অর!* 👑\n\nখাওন খাউক্কা আর সোনা জমাইক্কা! আমার রেফারাল দিয়া সাইন আপ করলেই ৫০০ টেকা ফুড ক্যাশ নিশ্চিত: ${url}\n\nদেরি না করিয়া অখনই ক্লেইম করইন! ✨`;
      return {
        title: `২৪ ক্যারেট ডিজিটাল সোনা জিতইন - অর্ডার কিং`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    bn: (_, url) => {
      const msg = `🪙 *অর্ডার কিং-এ খাবার অর্ডারে ফ্রি ২৪ ক্যারেট ডিজিটাল গোল্ড রিওয়ার্ড!* 👑\n\nখাবার খাওয়ার সাথে সাথে নিশ্চিত সোনা জেতার সুযোগ। আমার লিংকে সাইন-আপ করলেই পাবেন ₹৫০০ বোনাস ক্যাশ: ${url}\n\nঅফার শেষ হওয়ার আগেই ক্লেইম করুন! ✨`;
      return {
        title: `খাবারের সাথে ডিজিটাল সোনা জিতুন`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    as: (_, url) => {
      const msg = `🪙 *অৰ্ডাৰ কিঙত প্ৰতিটো খাদ্য অৰ্ডাৰৰ সৈতে নিশ্চিত ২৪ কেৰেট ডিজিটেল সোণ লাভ কৰক!* 👑\n\nসুস্বাদু খাদ্যৰ সৈতে সঞ্চয় কৰক সোণ। মোৰ ইনভাইট লিংকৰ জৰিয়তে এতিয়াই লাভ কৰক ₹৫০০ ফ্ৰী খাদ্য ক্ৰেডিট: ${url}\n\nপলম নকৰিব! ✨`;
      return {
        title: `ডিজিটেল সোণ আৰু ₹৫০০ খাদ্য বোনাস`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    hi: (_, url) => {
      const msg = `🪙 *ऑर्डर किंग पर हर मील के साथ फ्री 24K डिजिटल गोल्ड रिवॉर्ड!* 👑\n\nखाना भी खाइए और डिजिटल गोल्ड भी बनाइए। मेरे इनवाइट लिंक से अभी साइन अप करके पाएं ₹500 का फूड वेलकम कैश: ${url}\n\nलिमिटेड टाइम ऑफर, तुरंत क्लेम करें! ✨`;
      return {
        title: `फ्री 24K डिजिटल गोल्ड - ऑर्डर किंग`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    en: (_, url) => {
      const msg = `🪙 *Win pure 24K Digital Gold rewards on every OrderKing meal!* 👑\n\nEat delicious food and grow your gold savings with zero surge fees. Claim your ₹500 Welcome Bonus now: ${url}\n\nDownload and order today! ✨`;
      return {
        title: `Claim 24K Gold & ₹500 Bonus on OrderKing`,
        text: msg,
        whatsappMessage: msg,
      };
    },
  },

  // 4. Post-Checkout Brag Share Loop
  order_placed_share: {
    syl: (ctx, url) => {
      const total = ctx.orderTotalRupees || 350;
      const msg = `🍔 *আমি মাত্ৰ ${total} টেকার গরম বিরিয়ানি অর্ডার দিলাম অর্ডার কিং দিয়া!* 🚀\n\nমাত্র ২৫ মিনিটে আইবো। তোমরাও আমার লিংক দিয়া অর্ডার করিয়া ৫০০ টেকা ছাড় পাও: ${url}\n\nকোনো বাড়তি দাম নাই, রেস্টুরেন্টের আসল রেট! 👑`;
      return {
        title: `অর্ডার কিং-এ দারুণ খাবার অর্ডার করলাম`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    bn: (ctx, url) => {
      const total = ctx.orderTotalRupees || 350;
      const msg = `🍔 *আমি এইমাত্র ₹${total}-এর দুর্দান্ত খাবার অর্ডার করলাম অর্ডার কিং-এ!* 🚀\n\n২৫ মিনিটে আমার ঘরে পৌঁছাবে। আপনারাও আমার লিংকে গিয়ে ₹৫০০ ফ্রি ফুড ক্যাশ নিয়ে অর্ডার করুন: ${url}\n\nআসল রেস্তোরাঁ দামে অর্ডার করুন! 👑`;
      return {
        title: `অর্ডার কিং খাবার ডেলিভারি`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    as: (ctx, url) => {
      const total = ctx.orderTotalRupees || 350;
      const msg = `🍔 *মই এইমাত্ৰ ₹${total} মূল্যৰ সুস্বাদু আহাৰ অৰ্ডাৰ কৰিলোঁ অৰ্ডাৰ কিঙত!* 🚀\n\n২৫ মিনিটত খাদ্য মোৰ ওচৰ পাব। আপোনালোকেও মোৰ লিংকৰ জৰিয়তে ₹৫০০ ফ্ৰী ক্ৰেডিট লৈ অৰ্ডাৰ কৰক: ${url}\n\nকোনো অতিৰিক্ত মাচুল নাই! 👑`;
      return {
        title: `অৰ্ডাৰ কিং ছুপাৰফাষ্ট খাদ্য`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    hi: (ctx, url) => {
      const total = ctx.orderTotalRupees || 350;
      const msg = `🍔 *मैंने अभी ऑर्डर किंग से ₹${total} का गरमा-गरम खाना ऑर्डर किया!* 🚀\n\nसिर्फ 25 मिनट में डिलीवरी! आप भी मेरे लिंक से ₹500 का वेलकम बोनस लेकर अपना फेवरेट खाना मंगवाएं: ${url}\n\n0% मेन्यू मार्कअप! 👑`;
      return {
        title: `ऑर्डर किंग से खाना ऑर्डर हुआ`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    en: (ctx, url) => {
      const total = ctx.orderTotalRupees || 350;
      const msg = `🍔 *I just ordered a delicious meal worth ₹${total} on OrderKing!* 🚀\n\nTracking live with 25-min delivery. Use my invite link to get an instant ₹500 welcome credit for your meal: ${url}\n\nZero markups, genuine local kitchens! 👑`;
      return {
        title: `Piped hot food on the way via OrderKing`,
        text: msg,
        whatsappMessage: msg,
      };
    },
  },
};

// ============================================================================
// Viral Dispatch Engine (Web Share API + WhatsApp Direct)
// ============================================================================

export function buildTargetShareUrl(ctx: ViralShareContext): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://orderking.in";
  const ref = ctx.referralCode || "KING500";

  if (ctx.restaurantSlug) {
    return `${origin}/r/${ctx.restaurantSlug}?ref=${ref}`;
  }
  if (ctx.townName && ctx.areaName) {
    const tSlug = ctx.townName.toLowerCase().replace(/\s+/g, "-");
    const aSlug = ctx.areaName.toLowerCase().replace(/\s+/g, "-");
    return `${origin}/delivery/${tSlug}/${aSlug}?ref=${ref}`;
  }
  return `${origin}/earn?ref=${ref}`;
}

export function getViralSharePayload(
  hook: ViralShareHook,
  dialect: DialectCode,
  ctx: ViralShareContext
): DialectShareCopy & { url: string } {
  const url = buildTargetShareUrl(ctx);
  const generator = VIRAL_COPY_MATRIX[hook]?.[dialect] || VIRAL_COPY_MATRIX[hook]?.["en"];
  const copy = generator(ctx, url);
  return { ...copy, url };
}

/**
 * Triggers direct WhatsApp transmission via wa.me / api.whatsapp.com
 */
export function openWhatsAppDirect(whatsappMessage: string): void {
  if (typeof window === "undefined") return;
  const encoded = encodeURIComponent(whatsappMessage);
  const waUrl = `https://api.whatsapp.com/send?text=${encoded}`;
  window.open(waUrl, "_blank", "noopener,noreferrer");
}

/**
 * Seamless Web Share API execution with fallback to WhatsApp
 */
export async function shareViaWebShare(payload: {
  title: string;
  text: string;
  url: string;
  whatsappMessage?: string;
}): Promise<boolean> {
  const textToSend = payload.whatsappMessage || payload.text;

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: payload.title,
        text: textToSend,
        url: payload.url,
      });
      return true;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return false; // User dismissed native share sheet
      }
      // On OS level permission failure, fallback to WhatsApp
      openWhatsAppDirect(textToSend);
      return true;
    }
  }

  // Desktop or browsers without navigator.share
  openWhatsAppDirect(textToSend);
  return true;
}
