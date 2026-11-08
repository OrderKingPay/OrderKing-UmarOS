import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { asInt, asIso, newId } from "@/lib/utils";
import { formatINR } from "@/lib/money";
import {
  notificationChannelStatus,
  dispatchKingAiWhatsappShiftReport,
  dispatchKingAiSmsEmergency,
  dispatchKingAiEmailTaxDocument,
  dispatchUmarOsWhatsappShiftReport,
  dispatchUmarOsSmsEmergency,
  dispatchUmarOsEmailTaxDocument,
} from "@/lib/adapters/notifications";
import { withVendor, writeAudit } from "./helpers";
import { isRestaurantRole, type RestaurantRole } from "@/lib/rbac";
import { platformConfig } from "@/lib/platform-config";

export const getReviews = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((d: { restaurantId?: string }) => d).handler(async ({ context, data }) => {
  return withVendor(context.userId, data.restaurantId, "reviews.view", async (sql, ctx) => {
    const rows = await sql<{ id: string; rating: number; body: string; created_at: string; order_id: string | null; data_label: string; response_body: string | null }>`
      select r.id, r.rating, r.body, r.created_at::text as created_at, r.order_id, r.data_label, rr.body as response_body
      from reviews r left join review_responses rr on rr.review_id = r.id where r.restaurant_id = ${ctx.restaurantId} order by r.created_at desc limit 100`;
    return { dataLabel: ctx.dataLabel, canRespond: ctx.role === "OWNER" || ctx.role === "MANAGER" || ctx.role === "MULTI_OUTLET_MANAGER", reviews: rows.map((r) => ({ id: r.id, rating: asInt(r.rating), body: r.body, createdAt: asIso(r.created_at), orderId: r.order_id, dataLabel: r.data_label, response: r.response_body })) };
  });
});

export const respondToReview = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d: { restaurantId?: string; reviewId: string; body: string }) => d).handler(async ({ context, data }) => {
  return withVendor(context.userId, data.restaurantId, "reviews.respond", async (sql, ctx) => {
    const body = data.body.trim(); if (!body) throw new Error("Reply cannot be empty");
    const owned = await sql<{ id: string }>`select id from reviews where id = ${data.reviewId} and restaurant_id = ${ctx.restaurantId}`;
    if (!owned[0]) throw new Error("Review not found");
    await sql`insert into review_responses (id, review_id, restaurant_id, author_user_id, body) values (${newId("rrp")}, ${data.reviewId}, ${ctx.restaurantId}, ${context.userId}, ${body}) on conflict (review_id) do update set body = excluded.body`;
    return { ok: true as const };
  });
});

export const getNotifications = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((d: { restaurantId?: string }) => d).handler(async ({ context, data }) => {
  return withVendor(context.userId, data.restaurantId, "notifications.view", async (sql, ctx) => {
    const rows = await sql<{ id: string; type: string; title: string; body: string; is_read: boolean; created_at: string }>`select id, type, title, body, is_read, created_at::text as created_at from notifications where restaurant_id = ${ctx.restaurantId} order by created_at desc limit 50`;
    return { channels: notificationChannelStatus(), notifications: rows.map((n) => ({ ...n, isRead: n.is_read === true || (n.is_read as unknown) === "t", createdAt: asIso(n.created_at) })) };
  });
});

export const markNotificationsRead = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d: { restaurantId?: string }) => d).handler(async ({ context, data }) => {
  return withVendor(context.userId, data.restaurantId, "notifications.view", async (sql, ctx) => { await sql`update notifications set is_read = true where restaurant_id = ${ctx.restaurantId}`; return { ok: true as const }; });
});

export const listStaff = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((d: { restaurantId?: string }) => d).handler(async ({ context, data }) => {
  return withVendor(context.userId, data.restaurantId, "settings.staff", async (sql, ctx) => {
    const rows = await sql<{ id: string; user_id: string; role: string; is_active: boolean; email: string | null; name: string | null }>`select s.id, s.user_id, s.role, s.is_active, u.email, u.name from restaurant_staff s left join "user" u on u.id = s.user_id where s.restaurant_id = ${ctx.restaurantId} order by s.created_at`;
    return { staff: rows, role: ctx.role };
  });
});

export const addStaff = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d: { restaurantId?: string; email: string; role: RestaurantRole }) => d).handler(async ({ context, data }) => {
  return withVendor(context.userId, data.restaurantId, "settings.staff", async (sql, ctx) => {
    if (!isRestaurantRole(data.role) || data.role === "OWNER") throw new Error("Invalid role");
    const users = await sql<{ id: string }>`select id from "user" where email = ${data.email.trim().toLowerCase()} limit 1`;
    const user = users[0]; if (!user) throw new Error("No account exists with that email yet. They must sign up first.");
    await sql`insert into restaurant_staff (id, restaurant_id, user_id, role) values (${newId("stf")}, ${ctx.restaurantId}, ${user.id}, ${data.role}) on conflict (restaurant_id, user_id) do update set role = excluded.role, is_active = true`;
    await writeAudit(sql, { restaurantId: ctx.restaurantId, actorUserId: context.userId, action: "staff_add", entityType: "staff", entityId: user.id, detail: data.role });
    return { ok: true as const };
  });
});

type SqlAdvisorSnapshot = {
  dataLabel: string;
  restaurantName: string;
  verificationStatus: string;
  fssaiNumber: string | null;
  prepMinutes: number;
  peakPrepMinutes: number;
  emergencyClosed: boolean;
  catalogStats: {
    totalItems: number;
    missingPhotos: number;
    missingDescriptions: number;
  };
  today: {
    orders: number;
    delivered: number;
    pending: number;
    cancelled: number;
    rejected: number;
    sales_paise: number;
    payable_paise: number;
    restaurant_discount_paise: number;
    platform_discount_paise: number;
    commission_paise: number;
  };
  topItemsToday: { name: string; qty: number }[];
  unavailableItems: { name: string; status: string }[];
  busyHoursLast7Days: { hour: number; c: number }[];
};

function buildVerifiedSqlAdvisorReply(question: string, snap: SqlAdvisorSnapshot): string {
  const q = question.toLowerCase().trim();

  // Language script detection
  const isBengaliOrAssamese = /[\u0980-\u09FF]/.test(question);
  const isHindiOrDevanagari = /[\u0900-\u097F]/.test(question);

  // Natural greeting handler
  if (/^(hi|hello|hey|good\s*morning|good\s*evening|নমস্কার|হ্যালো|नमस्ते|কেমন\s*আছেন|হাই|হায়|নমস্কাৰ|ভালনে|প্রণাম)$/i.test(q)) {
    if (isBengaliOrAssamese) {
      return `নমস্কার! আমি কিং এআই (King AI), আপনার অর্ডারকিং রেস্তোরাঁ সহযোগী। আপনার রান্নাঘরের অর্ডার, মেনু স্টক, রান্নার প্রস্তুতি সময় বা দৈনিক ব্যাংক সেটেলমেন্ট সংক্রান্ত বিষয়ে আমি কীভাবে সহায়তা করতে পারি?`;
    }
    if (isHindiOrDevanagari) {
      return `नमस्ते! मैं किंग एआई (King AI) हूँ, आपका ऑर्डरकिंग रेस्टोरेंट पार्टनर सहायक। आज आपके किचन ऑर्डर्स, मेनू स्टॉक, प्रेप टाइमिंग या दैनिक बैंक सेटलमेंट में मैं आपकी क्या सहायता कर सकता हूँ?`;
    }
    return `Hello! I am King AI, your OrderKing restaurant partner assistant. How can I help you today with your kitchen orders, menu items, prep timing, or daily bank settlements?`;
  }

  const topSummary =
    snap.topItemsToday.length > 0
      ? snap.topItemsToday.map((i) => `${i.name} (${i.qty}×)`).join(", ")
      : "No delivered orders recorded yet today.";
  const unavailSummary =
    snap.unavailableItems.length > 0
      ? snap.unavailableItems.map((i) => i.name).join(", ")
      : "All dishes are currently in stock.";

  // Storefront Status & "Why No Orders" Check
  const isStorefrontCheck =
    q.includes("why am i not receiving orders") ||
    q.includes("why no orders") ||
    q.includes("not receiving orders") ||
    q.includes("check my storefront") ||
    q.includes("storefront status") ||
    q.includes("store status") ||
    q.includes("outlet status") ||
    q.includes("order kyu nahi") ||
    q.includes("order kyu nhi") ||
    q.includes("order nahi aa raha") ||
    q.includes("অর্ডার আসছে না") ||
    q.includes("অর্ডার পাচ্ছি না") ||
    q.includes("অর্ডার কেন আসছে না");

  if (isStorefrontCheck) {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const istTime = new Date(utc + 3600000 * 5.5);
    const istHours = istTime.getHours();
    const istMinutes = istTime.getMinutes();
    const istFormatted = `${String(istHours % 12 || 12).padStart(2, "0")}:${String(istMinutes).padStart(2, "0")} ${istHours >= 12 ? "PM" : "AM"} IST`;

    let timeContext = "";
    if (istHours >= 0 && istHours < 9) {
      timeContext = "Early Morning / Quiet Hours. Customer delivery demand across residential zones is minimal during late night and early mornings. Demand picks up around 09:00 AM (Breakfast) and peaks between 12:00 PM – 03:30 PM (Lunch).";
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

    if (isBengaliOrAssamese) {
      return (
        `🏪 ${snap.restaurantName} এর স্টোরফ্রন্ট স্থিতি নিরীক্ষা:\n` +
        `• স্টোর অবস্থা: ${snap.emergencyClosed ? "🔴 সাময়িক বন্ধ (পজ করা)" : "🟢 অনলাইন (লাইভ অর্ডার গ্রহণের জন্য প্রস্তুত)"}\n` +
        `• বর্তমান সময়: ${istFormatted} (${istHours < 9 ? "ভোরবেলা / শান্ত সময়। রেস্তোরাঁ ডেলিভারি সাধারণত সকাল ৯টা থেকে এবং দুপুর ১২টা–৩টায় সর্বোচ্চ থাকে।" : "সক্রিয় ডেলিভারি সময়।"})\n` +
        `• মেনু স্টক: ${snap.catalogStats.totalItems} টি সক্রিয় খাবার (${snap.unavailableItems.length > 0 ? `${snap.unavailableItems.length} টি স্টক আউট` : "সব খাবার স্টকে আছে"})\n` +
        `• FSSAI ও ভেরিফিকেশন: ${snap.fssaiNumber ? `ভেরিফাইড (${snap.fssaiNumber})` : "অপেক্ষমাণ"}\n\n` +
        (snap.emergencyClosed
          ? "পরামর্শ: আপনার স্টোর বর্তমানে পজ করা আছে। লাইভ অর্ডার পেতে স্টোর চালু (Online) করুন।"
          : "আপনার কিচেন অনলাইন ও সম্পূর্ণ প্রস্তুত। আশেপাশের গ্রাহকদের অর্ডার আসতেই স্ক্রিনে ভেসে উঠবে।")
      );
    }

    if (isHindiOrDevanagari) {
      return (
        `🏪 ${snap.restaurantName} की स्टोर स्थिति जांच:\n` +
        `• स्टोर स्थिति: ${snap.emergencyClosed ? "🔴 पॉज्ड (दुकान रुकी हुई है)" : "🟢 ऑनलाइन (ऑर्डर स्वीकार करने के लिए तैयार)"}\n` +
        `• वर्तमान समय: ${istFormatted} (${istHours < 9 ? "प्रातःकाल / शांत समय। ग्राहकों के ऑर्डर सुबह 9 बजे से और दोपहर 12 से 3 बजे के बीच तेजी पकड़ते हैं।" : "सक्रिय समय।"})\n` +
        `• मेनू सूची: ${snap.catalogStats.totalItems} सक्रिय व्यंजन (${snap.unavailableItems.length > 0 ? `${snap.unavailableItems.length} आउट ऑफ स्टॉक` : "सभी उपलब्ध हैं"})\n` +
        `• FSSAI एवं सत्यापन: ${snap.fssaiNumber ? `सत्यापित (${snap.fssaiNumber})` : "लंबित"}\n\n` +
        (snap.emergencyClosed
          ? "सुझाव: आपकी दुकान वर्तमान में पॉज है। ऑर्डर प्राप्त करने के लिए कृपया स्टोर चालू (Online) करें।"
          : "आपकी दुकान पूरी तरह तैयार और ऑनलाइन है। जैसे ही आपके क्षेत्र के ग्राहक ऑर्डर करेंगे, वे आपकी स्क्रीन पर लाइव प्राप्त होंगे।")
      );
    }

    return (
      `Storefront Status Check for ${snap.restaurantName}:\n` +
      `• Outlet State: ${snap.emergencyClosed ? "🔴 PAUSED (Emergency Closed)" : "🟢 ONLINE & ACCEPTING ORDERS"}\n` +
      `• Current Time: ${istFormatted} (${timeContext})\n` +
      `• Menu Catalog: ${snap.catalogStats.totalItems} active dish(es) (${snap.unavailableItems.length > 0 ? `${snap.unavailableItems.length} marked Out of Stock` : "all items in stock"})\n` +
      `• Compliance: FSSAI ${snap.fssaiNumber ? `Verified (${snap.fssaiNumber})` : "Pending Registration"} · KYC: ${snap.verificationStatus}\n\n` +
      (snap.emergencyClosed
        ? "Action: Your store is currently paused. Please resume outlet in the top controls to start receiving live orders."
        : "Action: Your kitchen is online and ready. Orders from nearby customers within your delivery radius will be dispatched directly to your live kitchen screen.")
    );
  }

  // Sales & Orders
  if (q.includes("sales") || q.includes("revenue") || q.includes("order") || q.includes("আজকের বিক্রি") || q.includes("আজকে কত") || q.includes("बिक्री") || q.includes("कमाई") || q.includes("ऑर्डर")) {
    if (isBengaliOrAssamese) {
      return `📊 ${snap.restaurantName} এর আজকের লাইভ সারাংশ:\n• মোট অর্ডার: ${snap.today.orders} টি (${snap.today.delivered} ডেলিভার্ড, ${snap.today.pending} অপেক্ষমাণ)\n• গ্রস সেলস: ${formatINR(snap.today.sales_paise)}\n• নেট পেআউট (জমা হবে): ${formatINR(snap.today.payable_paise)}\n• সেরা বিক্রিত খাবার: ${topSummary}\n• স্টোরফ্রন্ট স্ট্যাটাস: ${snap.emergencyClosed ? "🔴 সাময়িক বন্ধ" : "🟢 লাইভ অর্ডার গ্রহণ করছে"}`;
    }
    if (isHindiOrDevanagari) {
      return `📊 ${snap.restaurantName} की आज की लाइव रिपोर्ट:\n• कुल ऑर्डर्स: ${snap.today.orders} प्राप्त (${snap.today.delivered} डिलीवर, ${snap.today.pending} पेंडिंग)\n• कुल बिक्री (GMV): ${formatINR(snap.today.sales_paise)}\n• शुद्ध पेआउट (T+1 बैंक ट्रांसफर): ${formatINR(snap.today.payable_paise)}\n• टॉप सेलिंग डिशेस: ${topSummary}\n• स्टोर स्थिति: ${snap.emergencyClosed ? "🔴 पॉज्ड" : "🟢 ऑनलाइन और लाइव"}`;
    }
    return `Today's Summary for ${snap.restaurantName}:\n• Orders: ${snap.today.orders} placed (${snap.today.delivered} delivered, ${snap.today.pending} pending acceptance)\n• Gross Sales: ${formatINR(snap.today.sales_paise)}\n• Net Payout Accrued: ${formatINR(snap.today.payable_paise)}\n• Top Sellers: ${topSummary}\n• Storefront: ${snap.emergencyClosed ? "PAUSED" : "ONLINE & RECEIVING ORDERS"}`;
  }

  // Payout, Settlement & Bank Transfers
  if (q.includes("payout") || q.includes("settlement") || q.includes("bank") || q.includes("payment") || q.includes("টাকা") || q.includes("পেমেন্ট") || q.includes("पेआउट") || q.includes("खाता") || q.includes("बैंक") || q.includes("टैक्स") || q.includes("gst")) {
    if (isBengaliOrAssamese) {
      return `💳 ${snap.restaurantName} এর দৈনিক ব্যাংক সেটেলমেন্ট:\n• পেআউট শিডিউল: স্বয়ংক্রিয় T+1 দৈনিক সেটেলমেন্ট সরাসরি আপনার ভেরিফাইড ব্যাংক অ্যাকাউন্টে জমা হবে।\n• নেট প্রাপ্য ব্যালেন্স: ${formatINR(snap.today.payable_paise)} (${snap.today.delivered} টি সম্পন্ন অর্ডারের জন্য)।\n• কর ও আইনি সুবিধা: সেকশন ৯(৫) CGST (৫% ফুড জিএসটি) প্ল্যাটফর্মের মাধ্যমে স্বয়ংক্রিয়ভাবে জমা হয়। ০% ডাইন-ইন এবং স্বচ্ছ ডেলিভারি কমিশন। বিস্তারিত লেজার Settlement ট্যাবে দেখুন।`;
    }
    if (isHindiOrDevanagari) {
      return `💳 ${snap.restaurantName} का दैनिक बैंक सेटलमेंट:\n• पेआउट शेड्यूल: स्वचालित T+1 दैनिक बैंक सेटलमेंट सीधे आपके सत्यापित बैंक खाते में क्रेडिट किया जाता है।\n• शुद्ध देय राशि: ${formatINR(snap.today.payable_paise)} (${snap.today.delivered} डिलीवर ऑर्डर्स के लिए)।\n• वैधानिक कटौती एवं कर: धारा 9(5) CGST के तहत 5% रेस्टोरेंट GST प्लेटफॉर्म द्वारा सीधे जमा किया जाता है। 0% डाइन-इन कमीशन। पूर्ण खाता Settlement टैब में उपलब्ध है।`;
    }
    return `Daily Settlement for ${snap.restaurantName}:\n• Payout Schedule: Automatic T+1 daily settlement deposited directly into your verified bank account.\n• Accrued Net Payable: ${formatINR(snap.today.payable_paise)} for ${snap.today.delivered} delivered order(s).\n• Statutory Deductions: Accounted under Section 9(5) CGST (5% restaurant GST remitted by OrderKing) and Section 194-O TDS. Full itemized ledgers are available in the Settlement tab.`;
  }

  // Menu, Stock & Items
  if (q.includes("menu") || q.includes("stock") || q.includes("item") || q.includes("dish") || q.includes("খাবার") || q.includes("মেনু") || q.includes("मेनू") || q.includes("आइटम") || q.includes("स्टॉक") || q.includes("खत्म")) {
    if (isBengaliOrAssamese) {
      return `🍲 ${snap.restaurantName} এর মেনু ও স্টক বিশদ:\n• সক্রিয় খাবার সংখ্যা: ${snap.catalogStats.totalItems} টি\n• স্টক শেষ (Out of Stock): ${snap.unavailableItems.length > 0 ? unavailSummary : "কোনোটিই নয় (সব খাবার স্টকে আছে)"}\n• ছবি ছাড়া ডিশ: ${snap.catalogStats.missingPhotos} টি\n• বিবরণ ছাড়া ডিশ: ${snap.catalogStats.missingDescriptions} টি\nআপনি যেকোনো সময় মেনু ট্যাবে নতুন ডিশ যুক্ত করতে বা দাম ও স্টক পরিবর্তন করতে পারেন।`;
    }
    if (isHindiOrDevanagari) {
      return `🍲 ${snap.restaurantName} का मेनू और स्टॉक ओवरव्यू:\n• सक्रिय डिशेस: ${snap.catalogStats.totalItems}\n• आउट ऑफ स्टॉक: ${snap.unavailableItems.length > 0 ? unavailSummary : "कोई नहीं (सभी डिशेस उपलब्ध हैं)"}\n• बिना फोटो वाली डिशेस: ${snap.catalogStats.missingPhotos}\n• विवरण के बिना डिशेस: ${snap.catalogStats.missingDescriptions}\nआप मेनू टैब में कभी भी फोटो, मूल्य या स्टॉक टॉगल अपडेट कर सकते हैं।`;
    }
    return `Menu Overview for ${snap.restaurantName}:\n• Active Dishes: ${snap.catalogStats.totalItems}\n• Out of Stock: ${snap.unavailableItems.length > 0 ? unavailSummary : "None (all active dishes are available)"}\n• Photos & Details: ${snap.catalogStats.missingPhotos} dish(es) without photos, ${snap.catalogStats.missingDescriptions} without descriptions. You can update photos, prices, and stock toggles anytime in the Menu tab.`;
  }

  // Storefront & Prep Time SLA
  if (q.includes("open") || q.includes("close") || q.includes("pause") || q.includes("resume") || q.includes("prep") || q.includes("rush") || q.includes("समय") || q.includes("टाइम") || q.includes("রশ") || q.includes("পাউজ")) {
    const statusText = snap.emergencyClosed ? "PAUSED / CLOSED" : "OPEN & ACCEPTING LIVE ORDERS";
    return `⏱️ Kitchen Readiness & Timing for ${snap.restaurantName}:\n• Storefront: ${statusText}\n• Baseline Prep Buffer: ${snap.prepMinutes} minutes\n• Peak Rush Buffer: ${snap.peakPrepMinutes} minutes\n• FSSAI License: ${snap.fssaiNumber ? `Verified (${snap.fssaiNumber})` : "Pending Registration"}\nYou can toggle rush mode or pause orders anytime using the fast throttle controls.`;
  }

  // Disputes & Cancellations
  if (q.includes("dispute") || q.includes("refund") || q.includes("spill") || q.includes("missing") || q.includes("cancel") || q.includes("ক্যান্সেল") || q.includes("ক্ষতিপূরণ") || q.includes("कैंसिल") || q.includes("विवाद")) {
    return `Order Dispute & Reimbursement Policy for ${snap.restaurantName}:\n• Delivery Spills / Transit Damage: Assigned 100% to logistics fault; your restaurant earnings are fully protected with ₹0 deduction.\n• Customer Cancellations After Kitchen Prep: 100% food value reimbursed to merchant.\n• Missing Items: Deduction is strictly limited to the value of the missing item with zero penalty.\n• All active dispute claims can be reviewed in the Guest Reviews & Disputes section.`;
  }

  // Busy Hours & Demand
  if (q.includes("busy") || q.includes("rush hour") || q.includes("demand") || q.includes("peak") || q.includes("সময়") || q.includes("ভিড়")) {
    const peakHours = snap.busyHoursLast7Days.map((h) => `${h.hour}:00 (${h.c} orders)`).join(", ");
    return `Peak Order Hours (Past 7 Days) for ${snap.restaurantName}:\n• Top Demand Windows: ${peakHours || "Evenly distributed throughout the day"}\n• Recommended Kitchen Strategy: Keep high-frequency signature dishes prepped ahead during lunch (12:00–15:00) and dinner (19:00–22:00) peak hours.`;
  }

  return `Hello! Here is your kitchen operational snapshot for ${snap.restaurantName}:\n• Storefront: ${snap.emergencyClosed ? "PAUSED" : "OPEN & ACCEPTING ORDERS"}\n• Today's Orders: ${snap.today.orders} placed (${snap.today.delivered} delivered), ${formatINR(snap.today.sales_paise)} gross sales\n• Kitchen Prep Buffer: ${snap.prepMinutes} mins (Peak: ${snap.peakPrepMinutes} mins)\n• Active Menu Catalog: ${snap.catalogStats.totalItems} dishes (${snap.unavailableItems.length} out of stock)\n• Daily Accrued Payout: ${formatINR(snap.today.payable_paise)} (T+1 Direct Bank Deposit)\n\nFeel free to ask any question or command me to update dish prices, toggle stock, or activate kitchen rush mode.`;
}

export const askAssistant = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { restaurantId?: string; question?: string; imageBase64?: string; mimeType?: string }) => d)
  .handler(async ({ context, data }) => {
    return withVendor(context.userId, data.restaurantId, "assistant.use", async (sql, ctx) => {
      if (!platformConfig.featureFlags.restaurant_ai) {
        return { ok: false as const, error: "NOT_CONNECTED", text: "Restaurant AI is disabled." };
      }

      const rawQuestion = (data.question || "").trim().slice(0, 2000);
      if (!rawQuestion && !data.imageBase64) throw new Error("Ask a question or attach an image");
      const question = rawQuestion || "Analyze this attached menu/dish image.";

      const today = await sql<{
        orders: number;
        delivered: number;
        pending: number;
        cancelled: number;
        rejected: number;
        sales_paise: number;
        payable_paise: number;
        restaurant_discount_paise: number;
        platform_discount_paise: number;
        commission_paise: number;
      }>`
        select count(*)::int as orders,
               count(*) filter (where state = 'DELIVERED')::int as delivered,
               count(*) filter (where state = 'PLACED')::int as pending,
               count(*) filter (where state = 'CANCELLED')::int as cancelled,
               count(*) filter (where state = 'REJECTED')::int as rejected,
               coalesce(sum(customer_total_paise) filter (where state = 'DELIVERED'),0)::int as sales_paise,
               coalesce(sum(restaurant_payable_paise) filter (where state = 'DELIVERED'),0)::int as payable_paise,
               coalesce(sum(restaurant_discount_paise),0)::int as restaurant_discount_paise,
               coalesce(sum(platform_funded_discount_paise),0)::int as platform_discount_paise,
               coalesce(sum(commission_paise) filter (where state = 'DELIVERED'),0)::int as commission_paise
        from orders
        where restaurant_id = ${ctx.restaurantId}
          and placed_at >= date_trunc('day', now())
      `;
      const items = await sql<{ name: string; qty: number }>`
        select oi.item_name as name, sum(oi.quantity)::int as qty
        from order_items oi
        join orders o on o.id = oi.order_id
        where o.restaurant_id = ${ctx.restaurantId}
          and o.placed_at >= date_trunc('day', now())
        group by oi.item_name
        order by qty desc
        limit 8
      `;
      const unavailable = await sql<{ name: string; status: string }>`
        select i.name, a.status
        from item_availability a
        join items i on i.id = a.item_id
        where a.restaurant_id = ${ctx.restaurantId}
          and a.status <> 'available'
      `;
      const hours = await sql<{ hour: number; c: number }>`
        select extract(hour from placed_at at time zone 'Asia/Kolkata')::int as hour,
               count(*)::int as c
        from orders
        where restaurant_id = ${ctx.restaurantId}
          and placed_at >= now() - interval '7 days'
        group by 1
        order by c desc
        limit 5
      `;
      const restRow = await sql<{
        fssai_number: string | null;
        prep_minutes: number | null;
        peak_prep_minutes: number | null;
        emergency_closed: boolean | null;
      }>`
        select fssai_number, prep_minutes, peak_prep_minutes, emergency_closed
        from restaurants
        where id = ${ctx.restaurantId}
        limit 1
      `;
      const catalogRow = await sql<{
        total_items: number;
        missing_photos: number;
        missing_descriptions: number;
      }>`
        select count(*)::int as total_items,
               count(*) filter (where image_url is null or btrim(image_url) = '')::int as missing_photos,
               count(*) filter (where description is null or btrim(description) = '')::int as missing_descriptions
        from items
        where restaurant_id = ${ctx.restaurantId}
          and is_active = true
      `;

      const snapshot: SqlAdvisorSnapshot = {
        dataLabel: ctx.dataLabel,
        restaurantName: ctx.restaurantName,
        verificationStatus: ctx.verificationStatus,
        fssaiNumber: restRow[0]?.fssai_number ?? null,
        prepMinutes: asInt(restRow[0]?.prep_minutes, 20),
        peakPrepMinutes: asInt(restRow[0]?.peak_prep_minutes, 30),
        emergencyClosed: restRow[0]?.emergency_closed === true || (restRow[0]?.emergency_closed as unknown) === "t",
        catalogStats: {
          totalItems: asInt(catalogRow[0]?.total_items, 0),
          missingPhotos: asInt(catalogRow[0]?.missing_photos, 0),
          missingDescriptions: asInt(catalogRow[0]?.missing_descriptions, 0),
        },
        today: today[0] ?? {
          orders: 0,
          delivered: 0,
          pending: 0,
          cancelled: 0,
          rejected: 0,
          sales_paise: 0,
          payable_paise: 0,
          restaurant_discount_paise: 0,
          platform_discount_paise: 0,
          commission_paise: 0,
        },
        topItemsToday: items,
        unavailableItems: unavailable,
        busyHoursLast7Days: hours,
      };

      await sql`insert into assistant_messages (id, restaurant_id, user_id, role, content) values (${newId("aim")}, ${ctx.restaurantId}, ${context.userId}, 'user', ${question})`;

      const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      const openaiKey = process.env.OPENAI_API_KEY;

      const systemPrompt =
        "You are King AI (OrderKing Partner Assistant), the authentic autonomous assistant for restaurant partners on OrderKing (OrderKingPay). You are deeply knowledgeable about commercial Indian restaurant kitchen operations, FSSAI regulations, 5% Section 9(5) CGST dual-bucket compliance (GSTIN: 18AFXPH9838M1Z9, Assam - 788710), double-entry paise accounting, T+1 bank payouts, prep buffers, and menu engineering.\n\n" +
        "CRITICAL INSTRUCTIONS:\n" +
        "1. Answer in the EXACT language used by the restaurant partner (Hindi, Bengali, Assamese, Gujarati, Marathi, Tamil, Telugu, Kannada, Malayalam, Punjabi, or English). If the user asks in Bengali, reply completely in Bengali. If in Hindi, reply in Hindi. If in English, reply in English.\n" +
        "2. Provide exact facts and figures from the snapshot. Never fabricate imaginary order numbers, revenues, or policies.\n" +
        "3. Maintain a respectful, encouraging, direct human tone. Never use dead marketing slogans or filler text.\n" +
        "4. If an image or menu photo is attached, analyze and transcribe all dish names, categories, dietary tags (VEG, NONVEG, EGG), and prices in INR accurately.";

      // 1. Google Gemini 2.5 Flash / 1.5 Flash via official REST API
      if (geminiKey && geminiKey.trim().length > 10 && !geminiKey.includes("dummy")) {
        try {
          const userParts: any[] = [];
          if (data.imageBase64) {
            const cleanBase64 = data.imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, "");
            userParts.push({
              inlineData: {
                mimeType: data.mimeType || "image/jpeg",
                data: cleanBase64,
              },
            });
          }
          userParts.push({
            text: `Authorized restaurant snapshot:\n${JSON.stringify(snapshot, null, 2)}\n\nMerchant question:\n${question}`,
          });

          for (const model of ["gemini-2.5-flash", "gemini-1.5-flash"]) {
            try {
              const geminiRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey.trim()}`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    contents: [{ role: "user", parts: userParts }],
                    generationConfig: {
                      temperature: 0.25,
                      maxOutputTokens: 1024,
                    },
                  }),
                }
              );

              if (geminiRes.ok) {
                const body = (await geminiRes.json()) as any;
                const aiText = body.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
                if (aiText) {
                  await sql`insert into assistant_messages (id, restaurant_id, user_id, role, content) values (${newId("aim")}, ${ctx.restaurantId}, ${context.userId}, 'assistant', ${aiText})`;
                  return { ok: true as const, text: aiText, snapshot };
                }
              }
            } catch {
              // try next model
            }
          }
        } catch {
          // fall through
        }
      }

      // 2. OpenAI GPT-4o-mini via standard Chat Completions API
      if (openaiKey && openaiKey.trim().length > 10 && !openaiKey.includes("dummy")) {
        try {
          const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey.trim()}` },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                { role: "system", content: systemPrompt },
                {
                  role: "user",
                  content: `Authorized restaurant snapshot:\n${JSON.stringify(snapshot)}\n\nRestaurant question:\n${question}`,
                },
              ],
              max_tokens: 1024,
              temperature: 0.3,
            }),
          });

          if (response.ok) {
            const body = (await response.json()) as any;
            const aiText = body.choices?.[0]?.message?.content?.trim();
            if (aiText) {
              await sql`insert into assistant_messages (id, restaurant_id, user_id, role, content) values (${newId("aim")}, ${ctx.restaurantId}, ${context.userId}, 'assistant', ${aiText})`;
              return { ok: true as const, text: aiText, snapshot };
            }
          }
        } catch {
          // Fall through to SQL-verified deterministic consultation reply
        }
      }

      const text = buildVerifiedSqlAdvisorReply(question, snapshot);
      await sql`insert into assistant_messages (id, restaurant_id, user_id, role, content) values (${newId("aim")}, ${ctx.restaurantId}, ${context.userId}, 'assistant', ${text})`;
      return { ok: true as const, text, snapshot };
    });
  });

export type KingAiNotificationSettings = {
  whatsappShiftReport: {
    enabled: boolean;
    consent: boolean;
    destinationPhone: string;
    dailyPl: boolean;
    gst95Remitted: boolean;
    netPayout: boolean;
    orderCount: boolean;
  };
  smsKitchenEmergency: {
    enabled: boolean;
    consent: boolean;
    destinationPhone: string;
    throttleAlert: boolean;
    criticalStockout: boolean;
  };
  emailTaxDocuments: {
    enabled: boolean;
    consent: boolean;
    destinationEmail: string;
    taxInvoices: boolean;
    form16AStatements: boolean;
  };
};

export type UmarOsNotificationSettings = KingAiNotificationSettings;

export const getKingAiNotificationConfig = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((d: { restaurantId?: string }) => d)
  .handler(async ({ context, data }) => {
    return withVendor(context.userId, data.restaurantId, "notifications.view", async (sql, ctx) => {
      const key = `notif_config:${ctx.restaurantId}`;
      const rows = await sql<{ key: string; value_json: string }>`
        select key, value_json from platform_settings where key = ${key} limit 1
      `;
      const rest = await sql<{ phone: string; email: string; display_name: string }>`
        select phone, email, display_name from restaurants where id = ${ctx.restaurantId} limit 1
      `;
      const fallbackPhone = rest[0]?.phone ?? "";
      const fallbackEmail = rest[0]?.email ?? "";

      let saved: Partial<KingAiNotificationSettings> = {};
      if (rows[0]?.value_json) {
        try {
          saved = JSON.parse(rows[0].value_json);
        } catch {
          // ignore
        }
      }

      const config: KingAiNotificationSettings = {
        whatsappShiftReport: {
          enabled: saved.whatsappShiftReport?.enabled ?? true,
          consent: saved.whatsappShiftReport?.consent ?? true,
          destinationPhone: saved.whatsappShiftReport?.destinationPhone || fallbackPhone,
          dailyPl: saved.whatsappShiftReport?.dailyPl ?? true,
          gst95Remitted: saved.whatsappShiftReport?.gst95Remitted ?? true,
          netPayout: saved.whatsappShiftReport?.netPayout ?? true,
          orderCount: saved.whatsappShiftReport?.orderCount ?? true,
        },
        smsKitchenEmergency: {
          enabled: saved.smsKitchenEmergency?.enabled ?? true,
          consent: saved.smsKitchenEmergency?.consent ?? true,
          destinationPhone: saved.smsKitchenEmergency?.destinationPhone || fallbackPhone,
          throttleAlert: saved.smsKitchenEmergency?.throttleAlert ?? true,
          criticalStockout: saved.smsKitchenEmergency?.criticalStockout ?? true,
        },
        emailTaxDocuments: {
          enabled: saved.emailTaxDocuments?.enabled ?? true,
          consent: saved.emailTaxDocuments?.consent ?? true,
          destinationEmail: saved.emailTaxDocuments?.destinationEmail || fallbackEmail,
          taxInvoices: saved.emailTaxDocuments?.taxInvoices ?? true,
          form16AStatements: saved.emailTaxDocuments?.form16AStatements ?? true,
        },
      };

      return {
        config,
        channels: notificationChannelStatus(),
        restaurantName: rest[0]?.display_name ?? ctx.restaurantName,
      };
    });
  });

export const getUmarOsNotificationConfig = getKingAiNotificationConfig;

export const updateKingAiNotificationConfig = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { restaurantId?: string; config: KingAiNotificationSettings }) => d)
  .handler(async ({ context, data }) => {
    return withVendor(context.userId, data.restaurantId, "settings.view", async (sql, ctx) => {
      const key = `notif_config:${ctx.restaurantId}`;
      const json = JSON.stringify(data.config);
      await sql`
        insert into platform_settings (key, value_json, updated_at)
        values (${key}, ${json}, now())
        on conflict (key) do update set value_json = excluded.value_json, updated_at = now()
      `;
      await writeAudit(sql, {
        restaurantId: ctx.restaurantId,
        actorUserId: context.userId,
        action: "update_kingai_notifications",
        entityType: "notification_config",
        entityId: ctx.restaurantId,
        detail: `King AI channels: WhatsApp(${data.config.whatsappShiftReport.enabled}), SMS(${data.config.smsKitchenEmergency.enabled}), Email(${data.config.emailTaxDocuments.enabled})`,
      });
      return { ok: true as const };
    });
  });

export const updateUmarOsNotificationConfig = updateKingAiNotificationConfig;

export const sendKingAiTestNotification = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: {
    restaurantId?: string;
    channel: "whatsapp" | "sms" | "email";
    destination: string;
  }) => d)
  .handler(async ({ context, data }) => {
    return withVendor(context.userId, data.restaurantId, "notifications.view", async (sql, ctx) => {
      const destination = data.destination.trim();
      if (!destination) {
        throw new Error("Destination address (phone or email) is required");
      }

      const stats = await sql<{
        orders: number;
        delivered: number;
        sales_paise: number;
        payable_paise: number;
        commission_paise: number;
      }>`
        select count(*)::int as orders,
               count(*) filter (where state = 'DELIVERED')::int as delivered,
               coalesce(sum(customer_total_paise) filter (where state = 'DELIVERED'), 0)::int as sales_paise,
               coalesce(sum(restaurant_payable_paise) filter (where state = 'DELIVERED'), 0)::int as payable_paise,
               coalesce(sum(commission_paise) filter (where state = 'DELIVERED'), 0)::int as commission_paise
        from orders
        where restaurant_id = ${ctx.restaurantId}
          and placed_at >= date_trunc('day', now())
      `;
      const s = stats[0] ?? { orders: 0, delivered: 0, sales_paise: 0, payable_paise: 0, commission_paise: 0 };
      const rest = await sql<{ gstin: string; pan: string }>`
        select gstin, pan from restaurants where id = ${ctx.restaurantId} limit 1
      `;

      let messageSummary = "";
      if (data.channel === "whatsapp") {
        const payload = {
          restaurantId: ctx.restaurantId,
          restaurantName: ctx.restaurantName,
          destinationPhone: destination,
          date: new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
          orderCount: s.delivered > 0 ? s.delivered : 14,
          grossSalesPaise: s.sales_paise > 0 ? s.sales_paise : 845000,
          netPayoutPaise: s.payable_paise > 0 ? s.payable_paise : 802750,
          gst95Paise: Math.round((s.sales_paise > 0 ? s.sales_paise : 845000) * 0.05),
          commissionPaise: s.commission_paise,
        };
        const res = await dispatchKingAiWhatsappShiftReport(payload);
        messageSummary = res.summary;
      } else if (data.channel === "sms") {
        const payload = {
          restaurantId: ctx.restaurantId,
          restaurantName: ctx.restaurantName,
          destinationPhone: destination,
          alertType: "KITCHEN_THROTTLE" as const,
          details: "Kitchen surge throttle alert active: SLA adjusted to 35m due to high live order volume.",
        };
        const res = await dispatchKingAiSmsEmergency(payload);
        messageSummary = res.summary;
      } else if (data.channel === "email") {
        const payload = {
          restaurantId: ctx.restaurantId,
          restaurantName: ctx.restaurantName,
          destinationEmail: destination,
          documentType: "TAX_INVOICE" as const,
          period: new Date().toLocaleString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" }),
          gstin: rest[0]?.gstin?.trim() || undefined,
          pan: rest[0]?.pan?.trim() || undefined,
          totalGrossPaise: s.sales_paise > 0 ? s.sales_paise : 845000,
          netPayablePaise: s.payable_paise > 0 ? s.payable_paise : 802750,
          tdsPaise: Math.round((s.sales_paise > 0 ? s.sales_paise : 845000) * 0.01),
          tcsPaise: Math.round((s.sales_paise > 0 ? s.sales_paise : 845000) * 0.005),
        };
        const res = await dispatchKingAiEmailTaxDocument(payload);
        messageSummary = res.summary;
      }

      await sql`
        insert into notifications (id, restaurant_id, type, title, body)
        values (
          ${newId("ntf")},
          ${ctx.restaurantId},
          ${`kingai_${data.channel}`},
          ${`King AI ${data.channel.toUpperCase()} Dispatch Verified`},
          ${messageSummary}
        )
      `;

      await writeAudit(sql, {
        restaurantId: ctx.restaurantId,
        actorUserId: context.userId,
        action: `dispatch_test_${data.channel}`,
        entityType: "notification_test",
        entityId: ctx.restaurantId,
        detail: `Sent to ${destination}: ${messageSummary}`,
      });

      return {
        ok: true as const,
        channel: data.channel,
        destination,
        message: messageSummary,
      };
    });
  });

export const sendUmarOsTestNotification = sendKingAiTestNotification;

// ============================================================================
// DINING TABLE RESERVATIONS DATABASE PERSISTENCE ENGINE
// Hyperlocal Multi-Device Real-Time Seating Orchestration & 0% Merchant Commission
// ============================================================================

async function ensureDiningTablesSchema(sql: any) {
  await sql`
    create table if not exists dining_tables (
      id text primary key,
      restaurant_id text not null references restaurants(id) on delete cascade,
      table_number text not null,
      zone text not null,
      capacity_tag text not null default '4-Seater',
      max_guests integer not null default 4,
      status text not null default 'AVAILABLE',
      current_booking_ref text,
      guest_name text,
      seated_since text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (restaurant_id, table_number)
    );
  `;
  await sql`
    create index if not exists dining_tables_restaurant_idx on dining_tables (restaurant_id);
  `;
  await sql`
    create table if not exists dining_reservations (
      id text primary key,
      restaurant_id text not null references restaurants(id) on delete cascade,
      booking_ref text not null,
      guest_name text not null,
      phone text not null,
      guests_count integer not null default 2,
      time_slot text not null,
      date text not null default 'Today',
      area_preference text not null,
      occasion text,
      status text not null default 'PENDING',
      assigned_table text,
      deposit_amount integer not null default 0,
      platform_fee_percent numeric(5,2) not null default 5.00,
      platform_fee_amount integer not null default 0,
      net_restaurant_payable integer not null default 0,
      merchant_commission_percent numeric(5,2) not null default 0.00,
      seated_at text,
      completed_at text,
      bill_amount integer,
      notes text,
      is_walk_in boolean not null default false,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `;
  await sql`
    create index if not exists dining_reservations_restaurant_idx on dining_reservations (restaurant_id, status);
  `;
}

const DEFAULT_SEED_TABLES = [
  // AC Indoor Main Hall
  { tableNumber: "T-01", zone: "AC Indoor Main Hall", capacityTag: "2-Seater", maxGuests: 2, status: "AVAILABLE" },
  { tableNumber: "T-02", zone: "AC Indoor Main Hall", capacityTag: "4-Seater", maxGuests: 4, status: "AVAILABLE" },
  { tableNumber: "T-03", zone: "AC Indoor Main Hall", capacityTag: "4-Seater", maxGuests: 4, status: "AVAILABLE" },
  { tableNumber: "T-04", zone: "AC Indoor Main Hall", capacityTag: "6-Seater Family", maxGuests: 6, status: "AVAILABLE" },
  { tableNumber: "T-05", zone: "AC Indoor Main Hall", capacityTag: "10-Seater Banquet", maxGuests: 10, status: "AVAILABLE" },

  // Rooftop Open Air
  { tableNumber: "R-01", zone: "Rooftop Open Air", capacityTag: "2-Seater", maxGuests: 2, status: "AVAILABLE" },
  { tableNumber: "R-02", zone: "Rooftop Open Air", capacityTag: "4-Seater", maxGuests: 4, status: "AVAILABLE" },
  { tableNumber: "R-03", zone: "Rooftop Open Air", capacityTag: "4-Seater", maxGuests: 4, status: "AVAILABLE" },
  { tableNumber: "R-04", zone: "Rooftop Open Air", capacityTag: "6-Seater Family", maxGuests: 6, status: "AVAILABLE" },

  // Outdoor Patio
  { tableNumber: "P-01", zone: "Outdoor Patio", capacityTag: "2-Seater", maxGuests: 2, status: "AVAILABLE" },
  { tableNumber: "P-02", zone: "Outdoor Patio", capacityTag: "4-Seater", maxGuests: 4, status: "AVAILABLE" },
  { tableNumber: "P-03", zone: "Outdoor Patio", capacityTag: "6-Seater Family", maxGuests: 6, status: "AVAILABLE" },

  // Private Cabana / VIP Lounge
  { tableNumber: "V-01", zone: "Private Cabana / VIP Lounge", capacityTag: "6-Seater Family", maxGuests: 6, status: "AVAILABLE" },
  { tableNumber: "V-02", zone: "Private Cabana / VIP Lounge", capacityTag: "10-Seater Banquet", maxGuests: 10, status: "AVAILABLE" },
];

export const getDiningReservationsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((d: { restaurantId?: string }) => d)
  .handler(async ({ context, data }) => {
    return withVendor(context.userId, data.restaurantId, "orders.view", async (sql, ctx) => {
      await ensureDiningTablesSchema(sql);

      // Check if tables are already seeded for this restaurant
      const existingTablesCount = await sql<{ count: number }>`
        select count(*)::int as count from dining_tables where restaurant_id = ${ctx.restaurantId}
      `;

      if ((existingTablesCount[0]?.count ?? 0) === 0) {
        // Auto-seed default floor tables
        for (const tbl of DEFAULT_SEED_TABLES) {
          await sql`
            insert into dining_tables (
              id, restaurant_id, table_number, zone, capacity_tag, max_guests, status,
              current_booking_ref, guest_name, seated_since
            ) values (
              ${newId("dtbl")}, ${ctx.restaurantId}, ${tbl.tableNumber}, ${tbl.zone},
              ${tbl.capacityTag}, ${tbl.maxGuests}, ${tbl.status},
              ${null}, ${null}, ${null}
            ) on conflict (restaurant_id, table_number) do nothing
          `;
        }
      }

      const tablesRows = await sql<{
        id: string;
        tableNumber: string;
        zone: string;
        capacityTag: string;
        maxGuests: number;
        status: string;
        currentBookingRef: string | null;
        guestName: string | null;
        seatedSince: string | null;
      }>`
        select id, table_number as "tableNumber", zone, capacity_tag as "capacityTag",
               max_guests as "maxGuests", status, current_booking_ref as "currentBookingRef",
               guest_name as "guestName", seated_since as "seatedSince"
        from dining_tables
        where restaurant_id = ${ctx.restaurantId}
        order by table_number asc
      `;

      const reservationsRows = await sql<{
        id: string;
        bookingRef: string;
        guestName: string;
        phone: string;
        guestsCount: number;
        timeSlot: string;
        date: string;
        areaPreference: string;
        occasion: string | null;
        status: string;
        assignedTable: string | null;
        depositAmount: number;
        platformFeePercent: number;
        platformFeeAmount: number;
        netRestaurantPayable: number;
        merchantCommissionPercent: number;
        seatedAt: string | null;
        completedAt: string | null;
        billAmount: number | null;
        notes: string | null;
        isWalkIn: boolean;
        createdAt: string;
      }>`
        select id, booking_ref as "bookingRef", guest_name as "guestName", phone,
               guests_count as "guestsCount", time_slot as "timeSlot", date,
               area_preference as "areaPreference", occasion, status,
               assigned_table as "assignedTable", deposit_amount as "depositAmount",
               platform_fee_percent as "platformFeePercent",
               platform_fee_amount as "platformFeeAmount",
               net_restaurant_payable as "netRestaurantPayable",
               merchant_commission_percent as "merchantCommissionPercent",
               seated_at as "seatedAt", completed_at as "completedAt",
               bill_amount as "billAmount", notes, is_walk_in as "isWalkIn",
               created_at::text as "createdAt"
        from dining_reservations
        where restaurant_id = ${ctx.restaurantId}
        order by created_at desc
      `;

      // Helper to compute human-readable relative time
      const computeCreatedAgo = (createdAtIso: string) => {
        const msDiff = Date.now() - new Date(createdAtIso).getTime();
        const mins = Math.max(1, Math.floor(msDiff / 60000));
        if (mins < 60) return `${mins} mins ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
        return `${Math.floor(hours / 24)}d ago`;
      };

      const reservations = reservationsRows.map((r) => ({
        id: r.id,
        bookingRef: r.bookingRef,
        guestName: r.guestName,
        phone: r.phone,
        guestsCount: r.guestsCount,
        timeSlot: r.timeSlot,
        date: r.date,
        areaPreference: r.areaPreference as any,
        occasion: r.occasion ?? undefined,
        status: r.status as any,
        assignedTable: r.assignedTable ?? undefined,
        createdAgo: computeCreatedAgo(r.createdAt),
        depositAmount: Number(r.depositAmount),
        platformFeePercent: Number(r.platformFeePercent),
        platformFeeAmount: Number(r.platformFeeAmount),
        netRestaurantPayable: Number(r.netRestaurantPayable),
        merchantCommissionPercent: Number(r.merchantCommissionPercent || 0),
        seatedAt: r.seatedAt ?? undefined,
        completedAt: r.completedAt ?? undefined,
        billAmount: r.billAmount != null ? Number(r.billAmount) : undefined,
        notes: r.notes ?? undefined,
        isWalkIn: Boolean(r.isWalkIn),
      }));

      const tables = tablesRows.map((t) => ({
        id: t.id,
        tableNumber: t.tableNumber,
        zone: t.zone as any,
        capacityTag: t.capacityTag as any,
        maxGuests: t.maxGuests,
        status: t.status as any,
        currentBookingRef: t.currentBookingRef ?? undefined,
        guestName: t.guestName ?? undefined,
        seatedSince: t.seatedSince ?? undefined,
      }));

      return {
        ok: true as const,
        tables,
        reservations,
      };
    });
  });

export const createDiningReservationFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: {
    restaurantId?: string;
    guestName: string;
    phone: string;
    guestsCount: number;
    timeSlot?: string;
    date?: string;
    areaPreference: string;
    occasion?: string;
    tableNumber?: string;
    depositAmount?: number;
    isWalkIn?: boolean;
  }) => d)
  .handler(async ({ context, data }) => {
    return withVendor(context.userId, data.restaurantId, "orders.view", async (sql, ctx) => {
      await ensureDiningTablesSchema(sql);

      const reservationId = newId("dres");
      const prefix = data.isWalkIn ? "WI-" : "TB-";
      const bookingRef = prefix + Math.floor(10000 + Math.random() * 90000);

      const depositRupees = data.depositAmount ?? (data.isWalkIn ? 0 : 500);
      const depositPaise = Math.round(depositRupees * 100);
      const platformFeePaise = Math.round((depositPaise * 500) / 10000); // 5.00%
      const netRestaurantPayablePaise = depositPaise - platformFeePaise;
      const platformFeeAmount = Math.round(platformFeePaise / 100);
      const netRestaurantPayable = Math.round(netRestaurantPayablePaise / 100);

      const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const initialStatus = data.isWalkIn ? "SEATED" : data.tableNumber ? "CONFIRMED" : "PENDING";

      await sql`
        insert into dining_reservations (
          id, restaurant_id, booking_ref, guest_name, phone, guests_count, time_slot,
          date, area_preference, occasion, status, assigned_table, deposit_amount,
          platform_fee_percent, platform_fee_amount, net_restaurant_payable,
          merchant_commission_percent, seated_at, is_walk_in
        ) values (
          ${reservationId}, ${ctx.restaurantId}, ${bookingRef}, ${data.guestName.trim()},
          ${data.phone.trim()}, ${data.guestsCount}, ${data.timeSlot || timeNow},
          ${data.date || "Today"}, ${data.areaPreference}, ${data.occasion || (data.isWalkIn ? "Walk-In Dining" : null)},
          ${initialStatus}, ${data.tableNumber || null}, ${depositRupees},
          5.00, ${platformFeeAmount}, ${netRestaurantPayable},
          0.00, ${data.isWalkIn ? timeNow : null}, ${Boolean(data.isWalkIn)}
        )
      `;

      // Update table status if table assigned
      if (data.tableNumber) {
        const tableStatus = data.isWalkIn ? "OCCUPIED" : "RESERVED";
        await sql`
          update dining_tables
          set status = ${tableStatus},
              current_booking_ref = ${bookingRef},
              guest_name = ${data.guestName.trim()},
              seated_since = ${data.isWalkIn ? timeNow : null},
              updated_at = now()
          where restaurant_id = ${ctx.restaurantId}
            and table_number = ${data.tableNumber}
        `;
      }

      await writeAudit(sql, {
        restaurantId: ctx.restaurantId,
        actorUserId: context.userId,
        action: data.isWalkIn ? "walk_in_seated" : "reservation_created",
        entityType: "dining_reservation",
        entityId: reservationId,
        detail: `Ref ${bookingRef} for ${data.guestName} (${data.guestsCount} pax) at ${data.tableNumber || "unassigned table"}`,
      });

      return {
        ok: true as const,
        id: reservationId,
        bookingRef,
      };
    });
  });

export const updateTableStatusFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: {
    restaurantId?: string;
    tableId?: string;
    tableNumber?: string;
    status: "AVAILABLE" | "RESERVED" | "OCCUPIED" | "BLOCKED";
  }) => d)
  .handler(async ({ context, data }) => {
    return withVendor(context.userId, data.restaurantId, "orders.view", async (sql, ctx) => {
      await ensureDiningTablesSchema(sql);

      const clearOccupancy = ["AVAILABLE", "BLOCKED"].includes(data.status);

      if (clearOccupancy) {
        await sql`
          update dining_tables
          set status = ${data.status},
              current_booking_ref = null,
              guest_name = null,
              seated_since = null,
              updated_at = now()
          where restaurant_id = ${ctx.restaurantId}
            and (id = ${data.tableId ?? null} or table_number = ${data.tableNumber ?? null})
        `;
      } else {
        await sql`
          update dining_tables
          set status = ${data.status},
              updated_at = now()
          where restaurant_id = ${ctx.restaurantId}
            and (id = ${data.tableId ?? null} or table_number = ${data.tableNumber ?? null})
        `;
      }

      await writeAudit(sql, {
        restaurantId: ctx.restaurantId,
        actorUserId: context.userId,
        action: "dining_table_status_change",
        entityType: "dining_table",
        entityId: data.tableId || data.tableNumber || ctx.restaurantId,
        detail: `Table status changed to ${data.status}`,
      });

      return { ok: true as const };
    });
  });

export const updateDiningReservationStatusFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: {
    restaurantId?: string;
    reservationId: string;
    status: "PENDING" | "CONFIRMED" | "SEATED" | "COMPLETED" | "CANCELLED";
    assignedTable?: string;
    seatedAt?: string;
    completedAt?: string;
    billAmount?: number;
    notes?: string;
  }) => d)
  .handler(async ({ context, data }) => {
    return withVendor(context.userId, data.restaurantId, "orders.view", async (sql, ctx) => {
      await ensureDiningTablesSchema(sql);

      const existing = await sql<{
        id: string;
        booking_ref: string;
        guest_name: string;
        assigned_table: string | null;
      }>`
        select id, booking_ref, guest_name, assigned_table
        from dining_reservations
        where id = ${data.reservationId} and restaurant_id = ${ctx.restaurantId}
        limit 1
      `;

      const res = existing[0];
      if (!res) throw new Error("Reservation not found");

      const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const tableToUse = data.assignedTable || res.assigned_table;

      await sql`
        update dining_reservations
        set status = ${data.status},
            assigned_table = ${tableToUse ?? null},
            seated_at = coalesce(${data.seatedAt ?? null}, (case when ${data.status} = 'SEATED' then ${timeNow} else seated_at end)),
            completed_at = coalesce(${data.completedAt ?? null}, (case when ${data.status} = 'COMPLETED' then ${timeNow} else completed_at end)),
            bill_amount = coalesce(${data.billAmount ?? null}, bill_amount),
            notes = coalesce(${data.notes ?? null}, notes),
            updated_at = now()
        where id = ${data.reservationId} and restaurant_id = ${ctx.restaurantId}
      `;

      // Synchronize associated table in dining_tables
      if (tableToUse) {
        if (data.status === "CONFIRMED") {
          await sql`
            update dining_tables
            set status = 'RESERVED',
                current_booking_ref = ${res.booking_ref},
                guest_name = ${res.guest_name},
                updated_at = now()
            where restaurant_id = ${ctx.restaurantId}
              and table_number = ${tableToUse}
          `;
        } else if (data.status === "SEATED") {
          await sql`
            update dining_tables
            set status = 'OCCUPIED',
                current_booking_ref = ${res.booking_ref},
                guest_name = ${res.guest_name},
                seated_since = coalesce(${data.seatedAt ?? null}, ${timeNow}),
                updated_at = now()
            where restaurant_id = ${ctx.restaurantId}
              and table_number = ${tableToUse}
          `;
        } else if (["COMPLETED", "CANCELLED"].includes(data.status)) {
          await sql`
            update dining_tables
            set status = 'AVAILABLE',
                current_booking_ref = null,
                guest_name = null,
                seated_since = null,
                updated_at = now()
            where restaurant_id = ${ctx.restaurantId}
              and table_number = ${tableToUse}
          `;
        }
      }

      await writeAudit(sql, {
        restaurantId: ctx.restaurantId,
        actorUserId: context.userId,
        action: `reservation_${data.status.toLowerCase()}`,
        entityType: "dining_reservation",
        entityId: data.reservationId,
        detail: `Status -> ${data.status} on table ${tableToUse || "N/A"}`,
      });

      return { ok: true as const };
    });
  });

