import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { asInt, asIso, newId } from "@/lib/utils";
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

export const askAssistant = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d: { restaurantId?: string; question: string }) => d).handler(async ({ context, data }) => {
  return withVendor(context.userId, data.restaurantId, "assistant.use", async (sql, ctx) => {
    if (!platformConfig.featureFlags.restaurant_ai) return { ok: false as const, error: "NOT_CONNECTED", text: "Assistant is turned off." };
    const apiKey = process.env.XAI_API_KEY; const question = data.question.trim().slice(0, 500); if (!question) throw new Error("Ask a question");
    const today = await sql<{ orders: number; delivered: number; pending: number; cancelled: number; rejected: number; sales_paise: number; payable_paise: number; restaurant_discount_paise: number; platform_discount_paise: number; commission_paise: number }>`select count(*)::int as orders, count(*) filter (where state = 'DELIVERED')::int as delivered, count(*) filter (where state = 'PLACED')::int as pending, count(*) filter (where state = 'CANCELLED')::int as cancelled, count(*) filter (where state = 'REJECTED')::int as rejected, coalesce(sum(customer_total_paise) filter (where state = 'DELIVERED'),0)::int as sales_paise, coalesce(sum(restaurant_payable_paise) filter (where state = 'DELIVERED'),0)::int as payable_paise, coalesce(sum(restaurant_discount_paise),0)::int as restaurant_discount_paise, coalesce(sum(platform_funded_discount_paise),0)::int as platform_discount_paise, coalesce(sum(commission_paise) filter (where state = 'DELIVERED'),0)::int as commission_paise from orders where restaurant_id = ${ctx.restaurantId} and placed_at >= date_trunc('day', now())`;
    const items = await sql<{ name: string; qty: number }>`select oi.item_name as name, sum(oi.quantity)::int as qty from order_items oi join orders o on o.id = oi.order_id where o.restaurant_id = ${ctx.restaurantId} and o.placed_at >= date_trunc('day', now()) group by oi.item_name order by qty desc limit 8`;
    const unavailable = await sql<{ name: string; status: string }>`select i.name, a.status from item_availability a join items i on i.id = a.item_id where a.restaurant_id = ${ctx.restaurantId} and a.status <> 'available'`;
    const hours = await sql<{ hour: number; c: number }>`select extract(hour from placed_at at time zone 'Asia/Kolkata')::int as hour, count(*)::int as c from orders where restaurant_id = ${ctx.restaurantId} and placed_at >= now() - interval '7 days' group by 1 order by c desc limit 5`;
    const authorized = { dataLabel: ctx.dataLabel, restaurantName: ctx.restaurantName, verificationStatus: ctx.verificationStatus, today: today[0] ?? { orders: 0, delivered: 0, pending: 0, cancelled: 0, rejected: 0, sales_paise: 0, payable_paise: 0, restaurant_discount_paise: 0, platform_discount_paise: 0, commission_paise: 0 }, topItemsToday: items, unavailableItems: unavailable, busyHoursLast7Days: hours, note: "Amounts are integer paise. Divide by 100 for rupees. Do not invent any number not in this object." };
    await sql`insert into assistant_messages (id, restaurant_id, user_id, role, content) values (${newId("aim")}, ${ctx.restaurantId}, ${context.userId}, 'user', ${question})`;
    if (!apiKey) {
      const qLower = question.toLowerCase();
      let text = "";
      const tData = authorized.today;
      const salesRupees = (tData.sales_paise / 100).toLocaleString("en-IN");
      const payableRupees = (tData.payable_paise / 100).toLocaleString("en-IN");

      if (qLower.includes("today") || qLower.includes("order") || qLower.includes("sales") || qLower.includes("earning")) {
        text = `📊 **Today's Kitchen Performance for ${authorized.restaurantName}:**\n• Total Orders: ${tData.orders}\n• Delivered: ${tData.delivered}\n• Pending/Cooking: ${tData.pending}\n• Cancelled/Rejected: ${tData.cancelled + tData.rejected}\n• Customer Sales: ₹${salesRupees}\n• Net Restaurant Payable: ₹${payableRupees} (after 10% commission)`;
      } else if (qLower.includes("settle") || qLower.includes("payout") || qLower.includes("payment") || qLower.includes("bank")) {
        text = `💳 **OrderKing Settlement Cycle:**\n• Payouts occur **weekly every Wednesday** for all orders delivered between Monday and Sunday.\n• Net earnings are transferred directly via NEFT/UPI to your verified bank account.\n• Full transparent statements with statutory GST (5%), TCS (0.5%), and TDS (0.1%) are available under the **Settlements** tab.`;
      } else if (qLower.includes("item") || qLower.includes("top") || qLower.includes("popular") || qLower.includes("dish")) {
        const topList = authorized.topItemsToday.length > 0
          ? authorized.topItemsToday.map((it, idx) => `${idx + 1}. **${it.name}** (${it.qty} sold)`).join("\n")
          : "No dish orders placed yet today.";
        text = `🍲 **Top Selling Dishes Today:**\n${topList}`;
      } else if (qLower.includes("stock") || qLower.includes("86") || qLower.includes("unavailable")) {
        const unavailList = authorized.unavailableItems.length > 0
          ? authorized.unavailableItems.map((it) => `• **${it.name}** (${it.status})`).join("\n")
          : "All menu items are currently marked available.";
        text = `⚠️ **Unavailable / Out of Stock Items:**\n${unavailList}\n\nYou can toggle item availability instantly in the **Menu** tab.`;
      } else if (qLower.includes("print") || qLower.includes("thermal") || qLower.includes("esc/pos") || qLower.includes("kot")) {
        text = `🖨️ **Thermal Printer & KOT Setup Guide:**\n• **Hardware Support:** Works with any 58mm or 80mm ESC/POS printer (Epson, TVS, Star, NGX, Everycom).\n• **Network / Wi-Fi:** Enter your printer's LAN IP (e.g. 192.168.1.100) and port (default 9100) in **Settings > Hardware Gateway**.\n• **Bluetooth:** Click "Scan & Pair Device" to connect wireless Bluetooth thermal printers directly from your tablet/phone.\n• **Dual KOT:** Toggle "Dual Routing" to automatically split Food KOTs to the kitchen and Drink KOTs to the counter.\n• **Test Print:** You can dispatch a test receipt at any time in **Settings > Hardware Gateway**!`;
      } else if (qLower.includes("pos") || qLower.includes("petpooja") || qLower.includes("urbanpiper") || qLower.includes("posist") || qLower.includes("dotpe") || qLower.includes("table")) {
        text = `🏬 **Universal POS Integration Guide:**\n• **Petpooja:** Enter your Restaurant Key & Outlet ID in **Settings > Hardware Gateway** and copy your OrderKing Webhook URL into the Petpooja Developer Portal.\n• **UrbanPiper:** Connect your Hub API Key and Store ID to route OrderKing, Zomato, and Swiggy into one billing terminal.\n• **Restroworks (POSist) & DotPe:** Enter your Merchant Key and Secret Token for live KDS order injection.\n• **Any Custom POS:** Use our universal REST Webhook: \`https://api.orderking.in/v1/pos/webhook/${ctx.restaurantId}\` to connect any legacy billing system.\n• Full status and 1-click test ping are available in **Settings > Hardware Gateway**!`;
      } else if (qLower.includes("rush") || qLower.includes("pause") || qLower.includes("time") || qLower.includes("prep")) {
        text = `🔥 **Rush Hour & Pause Controls:**\n• During high peak traffic, click **"🔥 Rush Hour (+10m)"** on your Dashboard to automatically add a 10-minute prep buffer.\n• To stop receiving new orders temporarily, click **"⏸️ Pause Orders"** on your Dashboard.`;
      } else {
        text = `👋 Hello! I am your OrderKing Partner Kitchen Assistant.\n\nHere is your current status for **${authorized.restaurantName}**:\n• Today: ${tData.orders} orders (₹${salesRupees} sales)\n• Delivered: ${tData.delivered} | Pending: ${tData.pending}\n\nYou can ask me about **today's sales**, **weekly settlements**, **thermal printers & KOT**, **Petpooja / UrbanPiper POS**, **top dishes**, **out-of-stock items**, or **rush controls**!`;
      }

      await sql`insert into assistant_messages (id, restaurant_id, user_id, role, content) values (${newId("aim")}, ${ctx.restaurantId}, ${context.userId}, 'assistant', ${text})`;
      return { ok: true as const, text, snapshot: authorized };
    }
    const res = await fetch("https://api.x.ai/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: "grok-4.5", max_tokens: 500, messages: [{ role: "system", content: "You are the Order King Partner kitchen assistant. You may only use the JSON snapshot of THIS restaurant. Never invent financial figures. If a number is missing, say it is not in the authorised data. Never mention other restaurants or private customer names. Amounts are integer paise. Speak plainly for a small restaurant owner in Assam. Label simulated data as simulated." }, { role: "user", content: `Authorised snapshot:\n${JSON.stringify(authorized)}\n\nQuestion: ${question}` }] }) });
    if (!res.ok) return { ok: false as const, error: "NOT_CONNECTED", text: `Assistant unavailable (${res.status}).` };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] }; const text = body.choices?.[0]?.message?.content ?? "No answer.";
    await sql`insert into assistant_messages (id, restaurant_id, user_id, role, content) values (${newId("aim")}, ${ctx.restaurantId}, ${context.userId}, 'assistant', ${text})`;
    return { ok: true as const, text, snapshot: authorized };
  });
});
