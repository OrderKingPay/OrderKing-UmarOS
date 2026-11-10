/**
 * OrderKing Partner AI Assistant Action Dispatcher
 * Allows kitchen owners to speak or type in any Indian language or English
 * to add dishes, update prices, toggle dish availability, or analyze daily sales.
 */

import { saveItem, setAvailability, saveCategory, type ModifierGroup } from "@/lib/server/api-menu";
import { quickThrottleKitchen } from "@/lib/server/api-orders";
import { savePromotion } from "@/lib/server/api-finance";
import { formatINR } from "@/lib/money";
import type { DietFlag } from "@/lib/contracts";
import { digitizeMenuFromOcr, type DigitizedMenuCatalog } from "@/lib/server/autonomous-onboarding";
import { createPartnerTicket, type TicketCategory } from "@/lib/server/api-support";

export interface PartnerAiCommandContext {
  restaurantId?: string;
  categories: Array<{ id: string; name: string }>;
  items: Array<{
    id: string;
    name: string;
    category_id: string;
    diet: string;
    description?: string;
    tags?: string;
    prep_minutes?: number | null;
    image_url?: string | null;
    modifierGroups?: ModifierGroup[];
    variants: Array<{ id: string; name: string; pricePaise: number }>;
  }>;
  dashboard?: {
    isOpen?: boolean;
    today?: {
      orders?: number;
      delivered?: number;
      pending?: number;
      salesPaise?: number;
      settlementPaise?: number;
    };
  };
  languageCode: string;
  canEditMenu: boolean;
  canEditAvailability: boolean;
  canEditHours?: boolean;
  canEditPromotions?: boolean;
}

export interface PartnerAiExecutionResult {
  handled: boolean;
  action?:
    | "ADD_DISH"
    | "UPDATE_PRICE"
    | "STOCKOUT"
    | "RESTOCK"
    | "SALES_QUERY"
    | "THROTTLE_KITCHEN"
    | "CREATE_PROMOTION"
    | "DIGITIZE_MENU"
    | "CREATE_SUPPORT_TICKET"
    | "STOREFRONT_STATUS";
  replyText: string;
  digitizedMenu?: DigitizedMenuCatalog;
  createdTicketId?: string;
}

export async function tryExecutePartnerAiCommand(
  rawQuery: string,
  ctx: PartnerAiCommandContext
): Promise<PartnerAiExecutionResult> {
  const query = rawQuery.trim();
  const qLower = query.toLowerCase();

  if (!ctx.restaurantId) {
    return { handled: false, replyText: "" };
  }

  // -------------------------------------------------------------------------
  // 0. ACTION: BULK MENU OCR / TEXT DIGITIZER
  // If the query contains multiple lines with prices or items, run digitizer
  // -------------------------------------------------------------------------
  const lines = query.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const priceLineCount = lines.filter((l) => /(?:₹|Rs\.?|\bINR\b|\/-|\b[0-9]{2,4}\b)/i.test(l)).length;
  if (lines.length >= 2 && priceLineCount >= 2 && ctx.canEditMenu) {
    const catalog = digitizeMenuFromOcr(query);
    if (catalog.totalDishesCount > 0) {
      let preview = `📋 Digitized ${catalog.totalDishesCount} Dish(es) from your input:\n`;
      for (const cat of catalog.categories) {
        if (cat.items.length === 0) continue;
        preview += `\n• [${cat.name}]\n`;
        for (const item of cat.items) {
          const dietEmoji = item.diet === "VEG" ? "🌱" : item.diet === "EGG" ? "🥚" : "🍗";
          preview += `  - ${item.name} (${dietEmoji}): ₹${Math.round(item.pricePaise / 100)}\n`;
        }
      }
      preview += `\nReady for 1-tap import to live store menu.`;
      return {
        handled: true,
        action: "DIGITIZE_MENU",
        replyText: preview,
        digitizedMenu: catalog,
      };
    }
  }

  // -------------------------------------------------------------------------
  // 1. ACTION: ADD DISH
  // e.g.: "Add Paneer Butter Masala for 280 rupees veg"
  //       "Add Chicken Biryani 320 nonveg"
  //       "Paneer Tikka add karo 250 me veg"
  //       "Nayi dish add karo: Dal Makhani price 220 veg"
  //       "চিকেন রোল ১২০ টাকা ননভেজ যোগ করো"
  // -------------------------------------------------------------------------
  const addMatch =
    qLower.match(/(?:add|shamil karo|nayi dish|new dish|যোগ করো|যুক্ত করো|যোগ কৰক)\s+(?:dish|item|ডিশ)?\s*[:\-]?\s*([a-zA-Z\u0980-\u09FF\u0900-\u097F\s]+?)\s+(?:for|price|rate|ke liye|cost|at|me|₹|rs|দাম|টাকা|টকা)?\s*(\d{2,5})\s*(?:rupees|rs|inr|₹|ke|টাকা|টকা|रुपये)?\s*(veg|non-veg|nonveg|non veg|egg|ভেজ|ননভেজ)?/i) ||
    qLower.match(/([a-zA-Z\u0980-\u09FF\u0900-\u097F\s]+?)\s+(?:add karo|shamil karo|যোগ করো|যুক্ত করো|যোগ কৰক)\s+(?:for|rate|price|me|দাম)?\s*(\d{2,5})\s*(?:rupees|rs|inr|₹|টাকা|টকা|रुपये)?\s*(veg|non-veg|nonveg|non veg|egg|ভেজ|ননভেজ)?/i);

  if (addMatch && ctx.canEditMenu) {
    const rawDishName = addMatch[1].trim();
    const priceRupees = parseInt(addMatch[2], 10);
    const rawDiet = (addMatch[3] || "").toLowerCase();

    // Clean dish name from filler words
    const cleanDishName = rawDishName
      .replace(/^(dish|item|ek|one|ডিশ|খাবার)\s+/i, "")
      .replace(/\s+(ka|ki|ke|for|price|er|দাম)$/i, "")
      .trim();

    if (cleanDishName.length >= 2 && priceRupees > 0 && priceRupees < 100000) {
      const diet: DietFlag =
        rawDiet.includes("non") || rawDiet.includes("নন") ? "NONVEG" : rawDiet.includes("egg") ? "EGG" : "VEG";

      // Select default category or first available category
      let targetCategoryId = ctx.categories[0]?.id;
      if (!targetCategoryId) {
        const catRes = await saveCategory({
          data: { restaurantId: ctx.restaurantId, name: "Main Course", sortOrder: 1 },
        });
        targetCategoryId = catRes.id;
      }

      await saveItem({
        data: {
          restaurantId: ctx.restaurantId,
          categoryId: targetCategoryId,
          name: cleanDishName,
          diet,
          description: `Freshly prepared ${cleanDishName} made with authentic ingredients.`,
          recommended: true,
          prepMinutes: 20,
          variants: [
            {
              name: "Standard",
              pricePaise: priceRupees * 100,
            },
          ],
        },
      });

      const dietTag = diet === "VEG" ? "Pure Veg 🌱" : diet === "EGG" ? "Egg 🥚" : "Non-Veg 🍗";
      let confirmation = `✅ Dish "${cleanDishName}" added successfully at ₹${priceRupees} (${dietTag}). It is now In-Stock and live for customer orders!`;

      if (ctx.languageCode === "hi") {
        confirmation = `✅ डिश "${cleanDishName}" को ₹${priceRupees} (${dietTag}) में मेनू में जोड़ दिया गया है। ग्राहक अब इसे ऑर्डर कर सकते हैं!`;
      } else if (ctx.languageCode === "bn" || ctx.languageCode === "as") {
        confirmation = `✅ "${cleanDishName}" ডিশটি ₹${priceRupees} (${dietTag}) মূল্যে মেনুতে যুক্ত করা হয়েছে। এখন লাইভ অর্ডারের জন্য প্রস্তুত!`;
      }

      return {
        handled: true,
        action: "ADD_DISH",
        replyText: confirmation,
      };
    }
  }

  // -------------------------------------------------------------------------
  // 2. ACTION: UPDATE PRICE
  // e.g.: "Update Chicken Biryani price to 350"
  //       "Change price of Butter Naan to 60"
  //       "Chicken Biryani ka price 320 kar do"
  //       "চিকেন বিরিয়ানির দাম ২৮০ টাকা করো"
  // -------------------------------------------------------------------------
  const priceMatch =
    qLower.match(/(?:change|update|set|increase|decrease|badhao|ghatao|badha|ghata)\s+(?:price of|rate of|price|rate|দাম)?\s*([a-zA-Z\u0980-\u09FF\u0900-\u097F\s]+?)\s+(?:price|rate|to|as|for|kar do|karo|kardo|bana do|করো|কৰক|হবে)?\s*(?:₹|rs\.?|inr)?\s*(\d{2,5})\s*(?:rupees|rs|inr|₹|টাকা|টকা|रुपये)?/i) ||
    qLower.match(/([a-zA-Z\u0980-\u09FF\u0900-\u097F\s]+?)\s+(?:ka price|ka rate|price|rate|er dam|dam|দাম|মূল্য|র দাম)\s*(?:to|as|for|kar do|karo|হবে|করো|কৰক)?\s*(\d{2,5})\s*(?:rupees|rs|inr|₹|টাকা|টকা|रुपये)?/i);

  if (priceMatch && ctx.canEditMenu) {
    const rawTarget = priceMatch[1].trim().toLowerCase();
    const newPriceRupees = parseInt(priceMatch[2], 10);

    const cleanTarget = rawTarget
      .replace(/^(the|item|dish|ডিশ|খাবার|আউটলেট)\s+/i, "")
      .replace(/\s+(ka|ki|ke|er|r|এর|ৰ|দাম|price|rate)$/i, "")
      .trim();

    const matchedItem = ctx.items.find(
      (it) =>
        it.name.toLowerCase() === cleanTarget ||
        it.name.toLowerCase().includes(cleanTarget) ||
        cleanTarget.includes(it.name.toLowerCase())
    );

    if (matchedItem && newPriceRupees > 0 && newPriceRupees < 100000) {
      const updatedVariants = matchedItem.variants.map((v, idx) =>
        idx === 0
          ? { id: v.id, name: v.name, pricePaise: newPriceRupees * 100 }
          : { id: v.id, name: v.name, pricePaise: v.pricePaise }
      );

      await saveItem({
        data: {
          restaurantId: ctx.restaurantId,
          id: matchedItem.id,
          categoryId: matchedItem.category_id,
          name: matchedItem.name,
          diet: (matchedItem.diet as DietFlag) || "NONVEG",
          description: matchedItem.description,
          tags: matchedItem.tags,
          prepMinutes: matchedItem.prep_minutes,
          imageUrl: matchedItem.image_url,
          variants: updatedVariants,
          modifierGroups: matchedItem.modifierGroups,
        },
      });

      let confirmation = `✅ Price for "${matchedItem.name}" updated to ₹${newPriceRupees}. Instant live sync to customer storefront complete!`;

      if (ctx.languageCode === "hi") {
        confirmation = `✅ "${matchedItem.name}" का मूल्य बदलकर ₹${newPriceRupees} कर दिया गया है। नया मूल्य ग्राहकों को तुरंत दिख रहा है!`;
      } else if (ctx.languageCode === "bn" || ctx.languageCode === "as") {
        confirmation = `✅ "${matchedItem.name}" এর নতুন মূল্য ₹${newPriceRupees} নির্ধারণ করা হয়েছে। গ্রাহকদের জন্য সরাসরি আপডেট সম্পন্ন!`;
      }

      return {
        handled: true,
        action: "UPDATE_PRICE",
        replyText: confirmation,
      };
    }
  }

  // -------------------------------------------------------------------------
  // 3. ACTION: TOGGLE STOCKOUT / RESTOCK
  // e.g.: "Mark Butter Naan out of stock"
  //       "Mutton Biryani khatam ho gaya"
  //       "Restock Paneer Tikka"
  //       "Butter Naan in stock karo"
  //       "পনীর বাটার মশলা শেষ"
  //       "চিকেন রোল স্টকে আছে"
  // -------------------------------------------------------------------------
  const isStockoutIntent =
    qLower.includes("out of stock") ||
    qLower.includes("khatam ho gaya") ||
    qLower.includes("khatam") ||
    qLower.includes("sold out") ||
    qLower.includes("unavailable") ||
    qLower.includes("band karo") ||
    qLower.includes("শেষ") ||
    qLower.includes("নেই") ||
    qLower.includes("ষ্টক শেষ");

  const isRestockIntent =
    qLower.includes("in stock") ||
    qLower.includes("restock") ||
    qLower.includes("available karo") ||
    qLower.includes("chalu karo") ||
    qLower.includes("स्टॉक में") ||
    qLower.includes("स्टॉक आ गया") ||
    qLower.includes("স্টকে আছে") ||
    qLower.includes("ষ্টকত আছে") ||
    qLower.includes("উপলব্ধ");

  if ((isStockoutIntent || isRestockIntent) && ctx.canEditAvailability) {
    // Find matching item in catalog
    const matchedItem = ctx.items.find((it) => {
      const itName = it.name.toLowerCase();
      return qLower.includes(itName) || itName.split(/\s+/).some((word) => word.length > 3 && qLower.includes(word));
    });

    if (matchedItem) {
      const targetStatus = isStockoutIntent ? "sold_out" : "available";
      await setAvailability({
        data: {
          restaurantId: ctx.restaurantId,
          itemIds: [matchedItem.id],
          status: targetStatus,
          nextAvailableAt: null,
        },
      });

      const label = targetStatus === "sold_out" ? "Out of Stock (Sold Out)" : "In-Stock (Available)";
      let confirmation = `✅ "${matchedItem.name}" is now marked ${label}. Propagated to customer app and ecosystem catalog instantly!`;

      if (ctx.languageCode === "hi") {
        confirmation = `✅ "${matchedItem.name}" को ${targetStatus === "sold_out" ? "आउट ऑफ स्टॉक (समाप्त)" : "इन-स्टॉक (उपलब्ध)"} मार्क कर दिया गया है। तुरंत लाइव लागू!`;
      } else if (ctx.languageCode === "bn" || ctx.languageCode === "as") {
        confirmation = `✅ "${matchedItem.name}" এখন ${targetStatus === "sold_out" ? "স্টক শেষ (Sold Out)" : "উপলব্ধ (In-Stock)"} হিসেবে চিহ্নিত করা হয়েছে।`;
      }

      return {
        handled: true,
        action: isStockoutIntent ? "STOCKOUT" : "RESTOCK",
        replyText: confirmation,
      };
    }
  }

  // -------------------------------------------------------------------------
  // 7. ACTION: CREATE SUPPORT TICKET / DESK ISSUE
  // Matches requests like:
  // - "Create a support ticket about delayed payout"
  // - "Raise ticket for order spill on order ORD-123"
  // - "Open support ticket: POS printer not printing"
  // - "Help with payout dispute, raise support ticket"
  // - "অভিযোগ জানাতে চাই / সাপোর্ট টিকিট খুলুন"
  // - "सपोर्ट टिकट बनाएं / शिकायत दर्ज करें"
  // -------------------------------------------------------------------------
  const isTicketIntent =
    qLower.includes("ticket") ||
    qLower.includes("টিকিট") ||
    qLower.includes("support ticket") ||
    qLower.includes("সাপোর্ট টিকিট") ||
    qLower.includes("सपोर्ट टिकट") ||
    qLower.includes("raise ticket") ||
    qLower.includes("open ticket") ||
    qLower.includes("create ticket") ||
    qLower.includes("शिकायत दर्ज") ||
    qLower.includes("help desk") ||
    qLower.includes("raise issue") ||
    qLower.includes("support desk");

  if (isTicketIntent) {
    let category: TicketCategory = "OTHER";
    if (
      qLower.includes("payout") ||
      qLower.includes("settlement") ||
      qLower.includes("bank") ||
      qLower.includes("payment") ||
      qLower.includes("টাকা") ||
      qLower.includes("পেমেন্ট") ||
      qLower.includes("সেটেলমেন্ট") ||
      qLower.includes("भुगतान") ||
      qLower.includes("पैसे")
    ) {
      category = "PAYOUT_ISSUE";
    } else if (
      qLower.includes("spill") ||
      qLower.includes("leak") ||
      qLower.includes("transit") ||
      qLower.includes("damaged") ||
      qLower.includes("পড়ে গেছে") ||
      qLower.includes("নষ্ট") ||
      qLower.includes("ক্ষতি") ||
      qLower.includes("खराब") ||
      qLower.includes("dispute")
    ) {
      category = "ORDER_DISPUTE";
    } else if (
      qLower.includes("printer") ||
      qLower.includes("kot") ||
      qLower.includes("pos") ||
      qLower.includes("hardware") ||
      qLower.includes("bluetooth") ||
      qLower.includes("প্রিন্টার") ||
      qLower.includes("प्रिंटर")
    ) {
      category = "HARDWARE_POS_SYNC";
    } else if (
      qLower.includes("fssai") ||
      qLower.includes("gst") ||
      qLower.includes("pan") ||
      qLower.includes("license") ||
      qLower.includes("compliance") ||
      qLower.includes("লাইসেন্স")
    ) {
      category = "FSSAI_COMPLIANCE";
    } else if (
      qLower.includes("menu") ||
      qLower.includes("dish") ||
      qLower.includes("item") ||
      qLower.includes("মেনু") ||
      qLower.includes("দাম")
    ) {
      category = "MENU_UPDATE_REQUEST";
    }

    const orderMatch = query.match(/(?:order\s*(?:#|id)?|ord_)\s*([A-Za-z0-9_-]{4,36})/i);
    const orderId = orderMatch ? orderMatch[1] : undefined;

    let subject = query.slice(0, 100);
    subject = subject
      .replace(/^(?:please\s+)?(?:create|raise|open)\s+(?:a\s+)?(?:support\s+)?ticket\s*(?:about|for|regarding|on|:)?\s*/i, "")
      .replace(/^(?:सपोर्ट टिकट बनाएं|शिकायत दर्ज करें|সাপোর্ট টিকিট খুলুন)\s*(?::|সম্পর্কে)?\s*/i, "")
      .trim();
    if (!subject) {
      subject = `${category.replace(/_/g, " ")} inquiry`;
    }

    try {
      const ticketRes = await createPartnerTicket({
        data: {
          restaurantId: ctx.restaurantId,
          category,
          subject,
          description: query,
          orderId,
          priority:
            category === "PAYOUT_ISSUE" || category === "ORDER_DISPUTE"
              ? "HIGH"
              : "NORMAL",
        },
      });

      let confirmation = `🎫 Support Ticket Created: #${ticketRes.ticketNumber}\n• Category: ${category}\n• Subject: "${subject}"\n• Status: ${ticketRes.status}\n\n`;
      if (ticketRes.aiResolutionSummary) {
        confirmation += `🤖 Instant AI Resolution:\n${ticketRes.aiResolutionSummary}\n\n`;
      }
      confirmation += `Track this ticket or message partner care anytime under Help Center & Support (/support).`;

      if (ctx.languageCode === "hi") {
        confirmation = `🎫 सपोर्ट टिकट दर्ज किया गया: #${ticketRes.ticketNumber}\n• श्रेणी: ${category}\n• विषय: "${subject}"\n• स्थिति: ${ticketRes.status}\n\n`;
        if (ticketRes.aiResolutionSummary) {
          confirmation += `🤖 त्वरित समाधान:\n${ticketRes.aiResolutionSummary}\n\n`;
        }
        confirmation += `आप हेल्प सेंटर (/support) पर इस टिकट की स्थिति देख सकते हैं।`;
      } else if (ctx.languageCode === "bn" || ctx.languageCode === "as") {
        confirmation = `🎫 সাপোর্ট টিকিট খোলা হয়েছে: #${ticketRes.ticketNumber}\n• বিভাগ: ${category}\n• বিষয়: "${subject}"\n• অবস্থা: ${ticketRes.status}\n\n`;
        if (ticketRes.aiResolutionSummary) {
          confirmation += `🤖 তাৎক্ষণিক সমাধান:\n${ticketRes.aiResolutionSummary}\n\n`;
        }
        confirmation += `আপনি হেল্প সেন্টার ও সাপোর্ট ডেস্কে (/support) এই টিকিটের ট্র্যাক ও উত্তর দিতে পারবেন।`;
      }

      return {
        handled: true,
        action: "CREATE_SUPPORT_TICKET",
        replyText: confirmation,
        createdTicketId: ticketRes.ticketId,
      };
    } catch (err) {
      console.error("[PartnerAiActions] Failed to create support ticket:", err);
    }
  }

  // -------------------------------------------------------------------------
  // 3b. ACTION: STOREFRONT STATUS & "WHY NO ORDERS" DIAGNOSIS
  // -------------------------------------------------------------------------
  const isStorefrontIntent =
    qLower.includes("why am i not receiving orders") ||
    qLower.includes("why no orders") ||
    qLower.includes("storefront status") ||
    qLower.includes("not receiving orders") ||
    qLower.includes("check my storefront") ||
    qLower.includes("store status") ||
    qLower.includes("outlet status") ||
    qLower.includes("order kyu nahi") ||
    qLower.includes("order kyu nhi") ||
    qLower.includes("order nahi aa raha") ||
    qLower.includes("অর্ডার আসছে না") ||
    qLower.includes("অর্ডার পাচ্ছি না") ||
    qLower.includes("অর্ডার কেন আসছে না");

  if (isStorefrontIntent) {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const istTime = new Date(utc + 3600000 * 5.5);
    const istHours = istTime.getHours();
    const istMinutes = istTime.getMinutes();
    const istFormatted = `${String(istHours % 12 || 12).padStart(2, "0")}:${String(istMinutes).padStart(2, "0")} ${istHours >= 12 ? "PM" : "AM"} IST`;

    let timeContext = "";
    if (istHours >= 0 && istHours < 9) {
      timeContext = "Early Morning / Quiet Hours. Customer food ordering in residential zones is minimal during late night and early mornings. Demand picks up around 09:00 AM (Breakfast) and peaks between 12:00 PM – 03:30 PM (Lunch).";
    } else if (istHours >= 9 && istHours < 12) {
      timeContext = "Morning / Breakfast Window. Customer search volume is building up towards lunch.";
    } else if (istHours >= 12 && istHours < 16) {
      timeContext = "Lunch Peak Window. High customer order activity.";
    } else if (istHours >= 16 && istHours < 19) {
      timeContext = "Afternoon Snacks Window. Moderate customer order activity.";
    } else if (istHours >= 19 && istHours < 23) {
      timeContext = "Dinner Peak Window. Maximum evening ordering activity.";
    } else {
      timeContext = "Late Night Window. Order volume gradually tapers down.";
    }

    const isOpen = ctx.dashboard?.isOpen ?? true;
    const totalItems = ctx.items.length;

    let reply = [
      `🏪 Storefront Status Check:`,
      `• Outlet State: ${isOpen ? "🟢 ONLINE & ACCEPTING ORDERS" : "🔴 PAUSED (Emergency Closed)"}`,
      `• Current Time: ${istFormatted} (${timeContext})`,
      `• Menu Catalog: ${totalItems} active dish(es) listed`,
      isOpen
        ? `Your kitchen is online and ready. Orders from nearby customers within your delivery radius will be dispatched directly to your live kitchen screen.`
        : `Your kitchen is currently paused. Please resume outlet in the top controls to start receiving live orders.`,
    ].join("\n");

    if (ctx.languageCode === "hi") {
      reply = [
        `🏪 स्टोर स्थिति जांच:`,
        `• स्टोर स्थिति: ${isOpen ? "🟢 ऑनलाइन (ऑर्डर स्वीकार करने के लिए तैयार)" : "🔴 पॉज्ड (दुकान रुकी हुई है)"}`,
        `• वर्तमान समय: ${istFormatted} (${istHours < 9 ? "प्रातःकाल / शांत समय। ग्राहकों के ऑर्डर सुबह 9 बजे के बाद और दोपहर 12 से 3 बजे के बीच तेजी पकड़ते हैं।" : "सक्रिय समय।"})`,
        `• मेनू सूची: ${totalItems} सक्रिय व्यंजन`,
        isOpen
          ? `आपकी दुकान पूरी तरह तैयार और ऑनलाइन है। जैसे ही आपके क्षेत्र के ग्राहक ऑर्डर करेंगे, वे आपकी स्क्रीन पर लाइव प्राप्त होंगे।`
          : `आपकी दुकान वर्तमान में पॉज है। ऑर्डर पाने के लिए कृपया स्टोर चालू (Online) करें।`,
      ].join("\n");
    } else if (ctx.languageCode === "bn" || ctx.languageCode === "as") {
      reply = [
        `🏪 স্টোরফ্রন্ট স্থিতি নিরীক্ষা:`,
        `• স্টোর অবস্থা: ${isOpen ? "🟢 অনলাইন (লাইভ অর্ডার গ্রহণের জন্য প্রস্তুত)" : "🔴 সাময়িক বন্ধ (পজ করা)"}`,
        `• বর্তমান সময়: ${istFormatted} (${istHours < 9 ? "ভোরবেলা / শান্ত সময়। রেস্তোরাঁ ডেলিভারি সাধারণত সকাল ৯টা থেকে এবং দুপুর ১২টা–৩টায় সর্বোচ্চ থাকে।" : "সক্রিয় ডেলিভারি সময়।"})`,
        `• মেনু তালিকা: ${totalItems} টি সক্রিয় খাবার`,
        isOpen
          ? `আপনার কিচেন অনলাইন ও সম্পূর্ণ প্রস্তুত। আশেপাশের গ্রাহকদের অর্ডার আসতেই স্ক্রিনে ভেসে উঠবে।`
          : `আপনার স্টোর বর্তমানে পজ করা আছে। লাইভ অর্ডার পেতে স্টোর চালু করুন।`,
      ].join("\n");
    }

    return {
      handled: true,
      action: "STOREFRONT_STATUS",
      replyText: reply,
    };
  }

  // -------------------------------------------------------------------------
  // 4. ACTION: SALES & DAILY ORDERS RECONCILIATION
  // -------------------------------------------------------------------------
  const isSalesIntent =
    qLower.includes("sales") ||
    qLower.includes("orders") ||
    qLower.includes("earning") ||
    qLower.includes("bikri") ||
    qLower.includes("kamai") ||
    qLower.includes("payout") ||
    qLower.includes("aaj ka") ||
    qLower.includes("আজকের") ||
    qLower.includes("বিক্রি") ||
    qLower.includes("আজকে কত") ||
    qLower.includes("बिक्री") ||
    qLower.includes("आज") ||
    qLower.includes("कमाई") ||
    qLower.includes("today");

  if (isSalesIntent && ctx.dashboard) {
    const t = ctx.dashboard.today || {};
    const delivered = (t as any).delivered ?? t.orders ?? 0;
    const pending = t.pending ?? 0;
    const grossSalesPaise = t.salesPaise ?? 0;
    const netPayoutPaise = t.settlementPaise ?? Math.round(grossSalesPaise * 0.72);

    let report = [
      `📊 Today's Real-Time Kitchen Performance:`,
      `• Gross Sales GMV: ${formatINR(grossSalesPaise)}`,
      `• Delivered Orders: ${delivered} orders fulfilled`,
      `• Pending Orders: ${pending} order(s) awaiting kitchen action`,
      `• Estimated Net T+1 Payout: ${formatINR(netPayoutPaise)} (Direct Bank Transfer)`,
      `• Storefront Status: ${ctx.dashboard.isOpen ? "🟢 OPEN (Accepting Live Orders)" : "🔴 PAUSED"}`,
    ].join("\n");

    if (ctx.languageCode === "hi") {
      report = [
        `📊 आज का लाइव किचन प्रदर्शन रिपोर्ट:`,
        `• कुल बिक्री (GMV): ${formatINR(grossSalesPaise)}`,
        `• डिलीवर हुए ऑर्डर्स: ${delivered} ऑर्डर्स पूरे हुए`,
        `• पेंडिंग ऑर्डर्स: ${pending} ऑर्डर्स किचन में प्रक्रियाधीन`,
        `• अनुमानित नेट T+1 पेआउट: ${formatINR(netPayoutPaise)} (सीधे बैंक खाते में)`,
        `• किचन स्थिति: ${ctx.dashboard.isOpen ? "🟢 खुला (ऑर्डर आ रहे हैं)" : "🔴 रुका हुआ"}`,
      ].join("\n");
    } else if (ctx.languageCode === "bn" || ctx.languageCode === "as") {
      report = [
        `📊 আজকের লাইভ কিচেন পারফরম্যান্স রিপোর্ট:`,
        `• মোট বিক্রয় (GMV): ${formatINR(grossSalesPaise)}`,
        `• সফল ডেলিভারি: ${delivered} টি অর্ডার সম্পন্ন`,
        `• অপেক্ষমাণ অর্ডার: ${pending} টি`,
        `• আনুমানিক নেট T+1 পেআউট: ${formatINR(netPayoutPaise)} (সরাসরি ব্যাংক ডিপোজিট)`,
        `• স্টোরের স্থিতি: ${ctx.dashboard.isOpen ? "🟢 খোলা" : "🔴 সাময়িক বন্ধ"}`,
      ].join("\n");
    }

    return {
      handled: true,
      action: "SALES_QUERY",
      replyText: report,
    };
  }

  // -------------------------------------------------------------------------
  // 5. ACTION: KITCHEN RUSH & PREPARATION THROTTLING
  // -------------------------------------------------------------------------
  const isRushIntent =
    qLower.includes("rush mode") ||
    qLower.includes("bheed hai") ||
    qLower.includes("overload") ||
    qLower.includes("prep buffer") ||
    qLower.includes("rush lagao") ||
    qLower.includes("রশ মোড") ||
    qLower.includes("ৰাশ্ব মোড") ||
    qLower.includes("too busy");

  const isNormalModeIntent =
    qLower.includes("normal mode") ||
    qLower.includes("rush band") ||
    qLower.includes("rush off") ||
    qLower.includes("standard prep") ||
    qLower.includes("নরমাল মোড");

  const isPauseKitchenIntent =
    qLower.includes("pause kitchen") ||
    qLower.includes("emergency close") ||
    qLower.includes("orders roko") ||
    qLower.includes("kitchen band karo") ||
    qLower.includes("পাউজ") ||
    qLower.includes("বন্ধ করো");

  const isResumeKitchenIntent =
    qLower.includes("resume kitchen") ||
    qLower.includes("open kitchen") ||
    qLower.includes("orders chalu") ||
    qLower.includes("kitchen chalu karo") ||
    qLower.includes("রেজিউম") ||
    qLower.includes("চালু করো");

  if (isRushIntent && (ctx.canEditHours ?? true)) {
    await quickThrottleKitchen({
      data: { restaurantId: ctx.restaurantId, mode: "RUSH" },
    });
    let confirmation =
      "🚨 Kitchen Rush Mode Activated (+15 mins buffer added). All incoming orders buffered to 35m prep SLA. Rider dispatch pacing dynamically delayed to prevent kitchen crowding!";
    if (ctx.languageCode === "hi") {
      confirmation =
        "🚨 किचन रश मोड सक्रिय (+15 मिनट बफर जोड़ा गया)। नए ऑर्डर्स के लिए तैयारी समय 35 मिनट निर्धारित किया गया है और राइडर्स को देर से भेजा जाएगा ताकि भीड़ न लगे!";
    } else if (ctx.languageCode === "bn" || ctx.languageCode === "as") {
      confirmation =
        "🚨 কিচেন রাশ মোড সক্রিয় (+১৫ মিনিট বাফার যোগ করা হয়েছে)। নতুন অর্ডারের প্রস্তুতির সময় ৩৫ মিনিট নির্ধারণ করা হয়েছে!";
    }
    return {
      handled: true,
      action: "THROTTLE_KITCHEN",
      replyText: confirmation,
    };
  }

  if (isNormalModeIntent && (ctx.canEditHours ?? true)) {
    await quickThrottleKitchen({
      data: { restaurantId: ctx.restaurantId, mode: "NORMAL" },
    });
    let confirmation =
      "✅ Kitchen Normal Mode Restored (20 mins baseline SLA). Rider dispatch pacing reset to standard timing.";
    if (ctx.languageCode === "hi") {
      confirmation =
        "✅ सामान्य किचन मोड बहाल (20 मिनट मानक SLA)। राइडर डिस्पैच सामान्य समय पर पुनः सेट कर दिया गया है।";
    } else if (ctx.languageCode === "bn" || ctx.languageCode === "as") {
      confirmation =
        "✅ স্বাভাবিক কিচেন মোড পুনর্বহাল (২০ মিনিট মানদণ্ড SLA)।";
    }
    return {
      handled: true,
      action: "THROTTLE_KITCHEN",
      replyText: confirmation,
    };
  }

  if (isPauseKitchenIntent && (ctx.canEditHours ?? true)) {
    await quickThrottleKitchen({
      data: { restaurantId: ctx.restaurantId, mode: "PAUSE" },
    });
    let confirmation =
      "⏸️ Kitchen Emergency Pause Activated. Storefront paused from accepting new incoming orders. Active in-progress orders can still be prepared and handed over.";
    if (ctx.languageCode === "hi") {
      confirmation =
        "⏸️ इमरजेंसी किचन पॉज सक्रिय। नए ऑर्डर आना रोक दिया गया है। चालू ऑर्डर्स को तैयार करके राइडर को सौंपा जा सकता है।";
    } else if (ctx.languageCode === "bn" || ctx.languageCode === "as") {
      confirmation =
        "⏸️ জরুরি কিচেন পজ সক্রিয়। নতুন অর্ডার গ্রহণ সাময়িক স্থগিত করা হয়েছে।";
    }
    return {
      handled: true,
      action: "THROTTLE_KITCHEN",
      replyText: confirmation,
    };
  }

  if (isResumeKitchenIntent && (ctx.canEditHours ?? true)) {
    await quickThrottleKitchen({
      data: { restaurantId: ctx.restaurantId, mode: "RESUME" },
    });
    let confirmation =
      "🟢 Kitchen Resumed & Storefront Live. Your restaurant is actively accepting new customer orders!";
    if (ctx.languageCode === "hi") {
      confirmation =
        "🟢 किचन पुनः चालू हो गया है और लाइव है। आपकी रसोई अब नए ग्राहक ऑर्डर स्वीकार कर रही है!";
    } else if (ctx.languageCode === "bn" || ctx.languageCode === "as") {
      confirmation =
        "🟢 কিচেন পুনরায় চালু এবং স্টোর লাইভ। আপনার রেস্তোরাঁ এখন সক্রিয়ভাবে নতুন অর্ডার গ্রহণ করছে!";
    }
    return {
      handled: true,
      action: "THROTTLE_KITCHEN",
      replyText: confirmation,
    };
  }

  // -------------------------------------------------------------------------
  // 6. ACTION: CREATE PROMOTION / DYNAMIC DISCOUNT
  // -------------------------------------------------------------------------
  const promoMatch =
    qLower.match(/(?:create|launch|offer|lagao|banao|অফার|ছাড়)\s+(?:a\s+)?(\d{1,2})%\s*(?:discount|off|promo|chhoot|ছাড়)/i) ||
    qLower.match(/(\d{1,2})%\s*(?:discount|off|promo|chhoot|ছাড়)\s+(?:lagao|karo|create|দাও|করো)/i);

  if (promoMatch && (ctx.canEditPromotions ?? true)) {
    const percent = parseInt(promoMatch[1], 10);
    if (percent >= 5 && percent <= 60) {
      const promoName = `Chef Special ${percent}% OFF`;
      await savePromotion({
        data: {
          restaurantId: ctx.restaurantId,
          name: promoName,
          funder: "RESTAURANT",
          kind: "percent",
          percentOff: percent,
          minOrderPaise: 29900, // ₹299 min order
          maxDiscountPaise: 10000, // ₹100 max cap
          isActive: true,
        },
      });

      let confirmation = `Promotion "${promoName}" Created & Live! Customers get ${percent}% off on orders above ₹299 (capped at ₹100). Live across OrderKing storefront!`;
      if (ctx.languageCode === "hi") {
        confirmation = `प्रमोशन "${promoName}" सफलतापूर्वक लाइव कर दिया गया है! ग्राहकों को ₹299 से अधिक के ऑर्डर पर ${percent}% छूट मिलेगी (अधिकतम ₹100)।`;
      } else if (ctx.languageCode === "bn" || ctx.languageCode === "as") {
        confirmation = `অফার "${promoName}" সফলভাবে লাইভ করা হয়েছে! ₹২৯৯ এর উপরের অর্ডারে ${percent}% ছাড় (সর্বোচ্চ ₹১০০ পর্যন্ত)।`;
      }

      return {
        handled: true,
        action: "CREATE_PROMOTION",
        replyText: confirmation,
      };
    }
  }

  return { handled: false, replyText: "" };
}
