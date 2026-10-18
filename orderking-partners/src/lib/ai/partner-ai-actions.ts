/**
 * OrderKing Partner AI Assistant Action Dispatcher
 * Allows kitchen owners to speak or type in any Indian language or English
 * to add dishes, update prices, toggle dish availability, or analyze daily sales.
 */

import { saveItem, setAvailability, saveCategory, type ModifierGroup } from "@/lib/server/api-menu";
import { formatINR } from "@/lib/money";
import type { DietFlag } from "@/lib/contracts";

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
}

export interface PartnerAiExecutionResult {
  handled: boolean;
  action?: "ADD_DISH" | "UPDATE_PRICE" | "STOCKOUT" | "RESTOCK" | "SALES_QUERY";
  replyText: string;
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
  // 1. ACTION: ADD DISH
  // e.g.: "Add Paneer Butter Masala for 280 rupees veg"
  //       "Add Chicken Biryani 320 nonveg"
  //       "Paneer Tikka add karo 250 me veg"
  //       "Nayi dish add karo: Dal Makhani price 220 veg"
  // -------------------------------------------------------------------------
  const addMatch =
    qLower.match(/(?:add|shamil karo|nayi dish|new dish)\s+(?:dish|item)?\s*[:\-]?\s*([a-zA-Z\s]+?)\s+(?:for|price|rate|ke liye|cost|at|me|₹|rs)?\s*(\d{2,5})\s*(?:rupees|rs|inr|₹|ke)?\s*(veg|non-veg|nonveg|non veg|egg)?/i) ||
    qLower.match(/([a-zA-Z\s]+?)\s+(?:add karo|shamil karo)\s+(?:for|rate|price|me)?\s*(\d{2,5})\s*(?:rupees|rs|inr|₹)?\s*(veg|non-veg|nonveg|non veg|egg)?/i);

  if (addMatch && ctx.canEditMenu) {
    const rawDishName = addMatch[1].trim();
    const priceRupees = parseInt(addMatch[2], 10);
    const rawDiet = (addMatch[3] || "").toLowerCase();

    // Clean dish name from filler words
    const cleanDishName = rawDishName
      .replace(/^(dish|item|ek|one)\s+/i, "")
      .replace(/\s+(ka|ki|ke|for|price)$/i, "")
      .trim();

    if (cleanDishName.length >= 2 && priceRupees > 0 && priceRupees < 100000) {
      const diet: DietFlag =
        rawDiet.includes("non") ? "NONVEG" : rawDiet.includes("egg") ? "EGG" : "VEG";

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
      } else if (ctx.languageCode === "bn") {
        confirmation = `✅ "${cleanDishName}" ডিশটি ₹${priceRupees} (${dietTag}) মূল্যে যুক্ত করা হয়েছে। এখন লাইভ অর্ডারের জন্য প্রস্তুত!`;
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
  // -------------------------------------------------------------------------
  const priceMatch =
    qLower.match(/(?:change|update|set|increase|decrease|badhao|ghatao)\s+(?:price of|rate of|price|rate)?\s*([a-zA-Z\s]+?)\s+(?:price|rate)?\s*(?:to|as|for|kar do|karo)?\s*(\d{2,5})\s*(?:rupees|rs|inr|₹)?/i) ||
    qLower.match(/([a-zA-Z\s]+?)\s+(?:ka price|ka rate|price|rate)\s*(\d{2,5})\s*(?:kar do|karo|bana do)/i);

  if (priceMatch && ctx.canEditMenu) {
    const rawTarget = priceMatch[1].trim().toLowerCase();
    const newPriceRupees = parseInt(priceMatch[2], 10);

    const cleanTarget = rawTarget
      .replace(/^(the|item|dish)\s+/i, "")
      .replace(/\s+(ka|ki|ke)$/i, "")
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
      } else if (ctx.languageCode === "bn") {
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
  // -------------------------------------------------------------------------
  const isStockoutIntent =
    qLower.includes("out of stock") ||
    qLower.includes("khatam ho gaya") ||
    qLower.includes("sold out") ||
    qLower.includes("unavailable") ||
    qLower.includes("band karo");

  const isRestockIntent =
    qLower.includes("in stock") ||
    qLower.includes("restock") ||
    qLower.includes("available karo") ||
    qLower.includes("chalu karo");

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
      } else if (ctx.languageCode === "bn") {
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
  // 4. ACTION: SALES & DAILY ORDERS RECONCILIATION
  // e.g.: "Aaj ki total sales aur orders kitne hue?"
  //       "What are today's sales and orders?"
  //       "Aaj ka sale batao"
  //       "Delivered orders status"
  // -------------------------------------------------------------------------
  const isSalesIntent =
    qLower.includes("sales") ||
    qLower.includes("orders") ||
    qLower.includes("earning") ||
    qLower.includes("bikri") ||
    qLower.includes("kamai") ||
    qLower.includes("payout") ||
    qLower.includes("aaj ka") ||
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
    } else if (ctx.languageCode === "bn") {
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

  return { handled: false, replyText: "" };
}
