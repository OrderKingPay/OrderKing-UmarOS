import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { asInt, asIso, newId } from "@/lib/utils";
import { formatINR } from "@/lib/money";
import { notificationChannelStatus } from "@/lib/adapters/notifications";
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
  const q = question.toLowerCase();
  const topSummary =
    snap.topItemsToday.length > 0
      ? snap.topItemsToday.map((i) => `${i.name} (${i.qty}×)`).join(", ")
      : "No delivered items recorded yet today";
  const unavailSummary =
    snap.unavailableItems.length > 0
      ? snap.unavailableItems.map((i) => `${i.name} [${i.status}]`).join(", ")
      : "0 items out of stock (all active dishes are available)";
  const peakHoursSummary =
    snap.busyHoursLast7Days.length > 0
      ? snap.busyHoursLast7Days.map((h) => `${String(h.hour).padStart(2, "0")}:00 (${h.c} orders)`).join(", ")
      : "Building 7-day order hour baseline";

  const lines: string[] = [
    `Namaste ${snap.restaurantName} Team — Here is your live, SQL-verified consultation from your kitchen ledger:`,
    ``,
  ];

  if (q.includes("payout") || q.includes("settlement") || q.includes("tax") || q.includes("gst") || q.includes("tds") || q.includes("tcs") || q.includes("wednesday")) {
    lines.push(
      `1. Live Settlement & Statutory Tax Breakdown (Today):`,
      `   • Delivered Gross Sales: ${formatINR(snap.today.sales_paise)} across ${snap.today.delivered} delivered order(s) (${snap.today.orders} total placed).`,
      `   • Net Restaurant Payable Accrued Today: ${formatINR(snap.today.payable_paise)}`,
      `   • Platform Commission Accrued: ${formatINR(snap.today.commission_paise)}`,
      `   • Restaurant Discount Funded: ${formatINR(snap.today.restaurant_discount_paise)} · Platform Promo Credit: ${formatINR(snap.today.platform_discount_paise)}`,
      `   • Statutory Deductions: CGST Sec 9(5) (5% food GST remitted by platform), CGST Sec 52 TCS (0.5%), and Income Tax Sec 194-O TDS (0.1%) are accounted in exact integer paise.`
    );
  } else if (q.includes("printer") || q.includes("kot") || q.includes("pos") || q.includes("petpooja") || q.includes("urbanpiper") || q.includes("hardware")) {
    lines.push(
      `1. 80mm ESC/POS Thermal KOT & POS Sync Guide for ${snap.restaurantName}:`,
      `   • Every order card in your KDS (/orders) has a 1-tap "🖨️ Print KOT / Bill" button that renders an 80mm thermal receipt with itemized dishes, variants, add-ons, bold chef instructions, and CGST Sec 9(5) tax math.`,
      `   • For LAN/Wi-Fi or Bluetooth thermal printers and Petpooja/UrbanPiper webhook sync, open the Devices & POS tab (/devices) to pair directly without waiting for human support.`
    );
  } else if (q.includes("stock") || q.includes("unavailable") || q.includes("menu") || q.includes("photo") || q.includes("top") || q.includes("dish")) {
    lines.push(
      `1. Live Menu & Catalog Health for ${snap.restaurantName}:`,
      `   • Active Catalog Size: ${snap.catalogStats.totalItems} active dish(es).`,
      `   • Currently Out-of-Stock (${snap.unavailableItems.length}): ${unavailSummary}.`,
      `   • Catalog Conversion Audit: ${snap.catalogStats.missingPhotos} dish(es) missing photos · ${snap.catalogStats.missingDescriptions} dish(es) missing descriptions.`,
      `   • Top Selling Dishes Today: ${topSummary}.`,
      `   • Consultant Tip: Uploading real 4:3 studio photos in Dish Studio (/menu) and restoring out-of-stock dishes immediately improves storefront conversion.`
    );
  } else {
    lines.push(
      `1. Live Storefront & Order Snapshot (${snap.restaurantName}):`,
      `   • Storefront Status: ${snap.emergencyClosed ? "PAUSED (Emergency Closed)" : "OPEN"} · KYC: ${snap.verificationStatus} · FSSAI: ${snap.fssaiNumber ?? "Not configured"}`,
      `   • Prep SLA Buffers: Standard ${snap.prepMinutes} mins · Peak Rush ${snap.peakPrepMinutes} mins`,
      `   • Today's Orders: ${snap.today.orders} placed · ${snap.today.delivered} delivered · ${snap.today.pending} pending acceptance · ${snap.today.cancelled} cancelled · ${snap.today.rejected} rejected`,
      `   • Today's Financials: Gross Sales ${formatINR(snap.today.sales_paise)} · Net Payable ${formatINR(snap.today.payable_paise)}`,
      `   • Top Dishes Today: ${topSummary}`,
      `   • Out-of-Stock Items (${snap.unavailableItems.length}): ${unavailSummary}`,
      `   • 7-Day Peak Order Hours (IST): ${peakHoursSummary}`
    );
  }

  return lines.join("\n");
}

export const askAssistant = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { restaurantId?: string; question: string }) => d)
  .handler(async ({ context, data }) => {
    return withVendor(context.userId, data.restaurantId, "assistant.use", async (sql, ctx) => {
      if (!platformConfig.featureFlags.restaurant_ai) {
        return { ok: false as const, error: "NOT_CONNECTED", text: "Restaurant AI is disabled." };
      }

      const question = data.question.trim().slice(0, 1000);
      if (!question) throw new Error("Ask a question");

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

      const apiKey = process.env.OPENAI_API_KEY;
      if (apiKey) {
        try {
          const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              input: [
                {
                  role: "system",
                  content:
                    "You are OrderKing Restaurant AI. Answer only from the authorized restaurant snapshot supplied by the server. Never invent metrics, prices, policies, integrations, refunds, payouts, or actions. You may recommend actions, but do not claim an action was executed unless the platform confirms it. Protect other restaurants and customer privacy. Amounts ending in _paise are integer paise; convert to INR only when useful. **CRITICAL:** Output exact, precise, and respectful local languages flawlessly. If the restaurant asks in Hindi, Assamese, Bengali, or any Indian constitutional language, reply perfectly and completely in that exact language.",
                },
                {
                  role: "user",
                  content: `Authorized restaurant snapshot:\n${JSON.stringify(snapshot)}\n\nRestaurant question:\n${question}`,
                },
              ],
              max_output_tokens: 700,
            }),
          });

          if (response.ok) {
            const body = (await response.json()) as { output_text?: string };
            const aiText = body.output_text?.trim();
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
