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
      const msg = `*${town}র ${area}ত অর্ডার কিং ডেলিভারি চালু অইছে।*\n\nলাইভ অর্ডার ট্র্যাকিং সহ অনলাইন ফুড ডেলিভারি।\n\nএখান থাকি অর্ডার করইন: ${url}`;
      return {
        title: `${area}, ${town}ত অর্ডার কিং ডেলিভারি`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    bn: (ctx, url) => {
      const town = ctx.townName || "করিমগঞ্জ";
      const area = ctx.areaName || "লোকাল এরিয়া";
      const msg = `*${town}-এর ${area}-তে অর্ডার কিং ডেলিভারি চালু হয়েছে।*\n\nলাইভ অর্ডার ট্র্যাকিং সহ অনলাইন ফুড ডেলিভারি।\n\nঅর্ডার করতে দেখুন: ${url}`;
      return {
        title: `${area}, ${town}-এ খাবার ডেলিভারি`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    as: (ctx, url) => {
      const town = ctx.townName || "গুৱাহাটী";
      const area = ctx.areaName || "পল্টন বজাৰ";
      const msg = `*${town}ৰ ${area}ত অৰ্ডাৰ কিং ডেলিভাৰী এতিয়া উপলব্ধ।*\n\nলাইভ অৰ্ডাৰ ট্ৰেকিং সহ অনলাইন খাদ্য ডেলিভাৰী।\n\nএতিয়া অৰ্ডাৰ কৰক: ${url}`;
      return {
        title: `${area}, ${town}ত অৰ্ডাৰ কিং খাদ্য ডেলিভাৰী`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    hi: (ctx, url) => {
      const town = ctx.townName || "करीमगंज";
      const area = ctx.areaName || "लोकल एरिया";
      const msg = `*${town} के ${area} में ऑर्डर किंग डिलीवरी उपलब्ध है।*\n\nलाइव ऑर्डर ट्रैकिंग के साथ ऑनलाइन फूड डिलीवरी।\n\nयहाँ से ऑर्डर करें: ${url}`;
      return {
        title: `${area}, ${town} में फूड डिलीवरी`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    en: (ctx, url) => {
      const town = ctx.townName || "Karimganj";
      const area = ctx.areaName || "Local Area";
      const msg = `*Food Delivery in ${area}, ${town} on OrderKing*\n\nOrder food online with itemized billing and live order tracking.\n\nBrowse restaurants: ${url}`;
      return {
        title: `Food Delivery in ${area}, ${town} - OrderKing`,
        text: msg,
        whatsappMessage: msg,
      };
    },
  },

  // 2. Specific Restaurant Viral Share
  restaurant_share: {
    syl: (ctx, url) => {
      const rest = ctx.restaurantName || "স্থানীয় রেস্টুরেন্ট";
      const cuisine = ctx.cuisine ? ` (${ctx.cuisine})` : "";
      const msg = `*${rest}*${cuisine}র খাওন অখন অর্ডার কিং-এ উপলব্ধ।\n\nঅনলাইন অর্ডার এবং লাইভ ট্র্যাকিং: ${url}`;
      return {
        title: `${rest} - অর্ডার কিং`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    bn: (ctx, url) => {
      const rest = ctx.restaurantName || "রেস্তোরাঁ";
      const cuisine = ctx.cuisine ? ` (${ctx.cuisine})` : "";
      const msg = `*${rest}*${cuisine}-এর খাবার অর্ডার করুন অর্ডার কিং-এ।\n\nঅনলাইন হোম ডেলিভারি ও লাইভ ট্র্যাকিং: ${url}`;
      return {
        title: `${rest} থেকে অর্ডার করুন - অর্ডার কিং`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    as: (ctx, url) => {
      const rest = ctx.restaurantName || "প্ৰিয় ৰেস্তোৰাঁ";
      const cuisine = ctx.cuisine ? ` (${ctx.cuisine})` : "";
      const msg = `*${rest}*${cuisine}ৰ খাদ্য এতিয়া অৰ্ডাৰ কিঙত উপলব্ধ।\n\nঅনলাইন ডেলিভাৰী আৰু লাইভ ট্ৰেকিং: ${url}`;
      return {
        title: `${rest} - অৰ্ডাৰ কিং অসম`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    hi: (ctx, url) => {
      const rest = ctx.restaurantName || "रेस्टोरेंट";
      const cuisine = ctx.cuisine ? ` (${ctx.cuisine})` : "";
      const msg = `*${rest}*${cuisine} का खाना अब ऑर्डर किंग पर उपलब्ध है।\n\nऑनलाइन डिलीवरी और लाइव ट्रैकिंग: ${url}`;
      return {
        title: `${rest} on OrderKing`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    en: (ctx, url) => {
      const rest = ctx.restaurantName || "Local Restaurant";
      const cuisine = ctx.cuisine ? ` (${ctx.cuisine})` : "";
      const msg = `Order from *${rest}*${cuisine} on OrderKing.\n\nOnline delivery with live order tracking: ${url}`;
      return {
        title: `Order from ${rest} on OrderKing`,
        text: msg,
        whatsappMessage: msg,
      };
    },
  },

  // 3. Loyalty & Rewards Share
  gold_reward_share: {
    syl: (_, url) => {
      const msg = `*অর্ডার কিং এবং কিং-পে দিয়া প্রতি যোগ্য অর্ডারে লয়্যালটি রিওয়ার্ডস অর্জন করইন।*\n\nবিস্তারিত দেখইন: ${url}`;
      return {
        title: `অর্ডার কিং ও কিং-পে রিওয়ার্ডস`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    bn: (_, url) => {
      const msg = `*অর্ডার কিং এবং কিং-পে ব্যবহার করে যোগ্য অর্ডারে লয়্যালটি রিওয়ার্ডস পান।*\n\nবিস্তারিত দেখুন: ${url}`;
      return {
        title: `অর্ডার কিং ও কিং-পে রিওয়ার্ডস`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    as: (_, url) => {
      const msg = `*অৰ্ডাৰ কিং আৰু কিং-পে ব্যৱহাৰ কৰি যোগ্য অৰ্ডাৰত লয়্যালিটি পুৰস্কাৰ লাভ কৰক।*\n\nবিস্তাৰিত চাওক: ${url}`;
      return {
        title: `অৰ্ডাৰ কিং আৰু কিং-পে পুৰস্কাৰ`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    hi: (_, url) => {
      const msg = `*ऑर्डर किंग और किंग-पे के साथ योग्य ऑर्डर पर लॉयल्टी रिवॉर्ड्स पाएँ।*\n\nविवरण देखें: ${url}`;
      return {
        title: `ऑर्डर किंग और किंग-पे रिवॉर्ड्स`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    en: (_, url) => {
      const msg = `*Earn loyalty rewards on qualifying OrderKing meals and KingPay transactions.*\n\nLearn more: ${url}`;
      return {
        title: `OrderKing & KingPay Rewards`,
        text: msg,
        whatsappMessage: msg,
      };
    },
  },

  // 4. Post-Checkout Share
  order_placed_share: {
    syl: (ctx, url) => {
      const total = ctx.orderTotalRupees || 0;
      const amountText = total > 0 ? `₹${total}র ` : "";
      const msg = `*আমি অর্ডার কিং দিয়া ${amountText}অর্ডার করছি।*\n\nলাইভ অর্ডার ট্র্যাকিং সহ ডেলিভারি: ${url}`;
      return {
        title: `অর্ডার কিং-এ খাবার অর্ডার`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    bn: (ctx, url) => {
      const total = ctx.orderTotalRupees || 0;
      const amountText = total > 0 ? `₹${total}-এর ` : "";
      const msg = `*আমি অর্ডার কিং-এ ${amountText}খাবার অর্ডার করেছি।*\n\nলাইভ অর্ডার ট্র্যাকিং সহ হোম ডেলিভারি: ${url}`;
      return {
        title: `অর্ডার কিং খাবার ডেলিভারি`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    as: (ctx, url) => {
      const total = ctx.orderTotalRupees || 0;
      const amountText = total > 0 ? `₹${total} মূল্যৰ ` : "";
      const msg = `*মই অৰ্ডাৰ কিঙত ${amountText}আহাৰ অৰ্ডাৰ কৰিলোঁ।*\n\nলাইভ অৰ্ডাৰ ট্ৰেকিং সহ ডেলিভাৰী: ${url}`;
      return {
        title: `অৰ্ডাৰ কিং খাদ্য ডেলিভাৰী`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    hi: (ctx, url) => {
      const total = ctx.orderTotalRupees || 0;
      const amountText = total > 0 ? `₹${total} का ` : "";
      const msg = `*मैंने ऑर्डर किंग से ${amountText}खाना ऑर्डर किया है।*\n\nलाइव ऑर्डर ट्रैकिंग के साथ डिलीवरी: ${url}`;
      return {
        title: `ऑर्डर किंग से खाना ऑर्डर`,
        text: msg,
        whatsappMessage: msg,
      };
    },
    en: (ctx, url) => {
      const total = ctx.orderTotalRupees || 0;
      const amountText = total > 0 ? ` worth ₹${total}` : "";
      const msg = `*I just placed an order${amountText} on OrderKing.*\n\nOrder online with live order tracking: ${url}`;
      return {
        title: `Live Order on OrderKing`,
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
  const origin = typeof window !== "undefined" ? window.location.origin : "https://orderkingpay.com";
  const refSuffix = ctx.referralCode ? `?ref=${encodeURIComponent(ctx.referralCode)}` : "";

  if (ctx.restaurantSlug) {
    return `${origin}/r/${ctx.restaurantSlug}${refSuffix}`;
  }
  if (ctx.townName && ctx.areaName) {
    const tSlug = ctx.townName.toLowerCase().replace(/\s+/g, "-");
    const aSlug = ctx.areaName.toLowerCase().replace(/\s+/g, "-");
    return `${origin}/delivery/${tSlug}/${aSlug}${refSuffix}`;
  }
  return `${origin}/earn${refSuffix}`;
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
  const encoded = encodeURIComponent(String(whatsappMessage ?? ""));
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
