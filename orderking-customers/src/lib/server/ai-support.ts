import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { newId } from "@/lib/ids";

export type SupportIssueType =
  | "where_order"
  | "cancel_order"
  | "missing_item"
  | "food_spilled"
  | "food_cold"
  | "payment_issue"
  | "general_inquiry";

export type ResolutionResult = {
  ok: boolean;
  orderId: string;
  issueType: SupportIssueType;
  actionTaken: "STATUS_REPORT" | "REQUEST_RECORDED";
  title: string;
  explanation: string;
  compensationPaise?: number;
  ticketId?: string;
};

export const diagnoseAndResolveOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { orderId: string; issueType: SupportIssueType; details?: string }) => d)
  .handler(async ({ context, data }: any): Promise<ResolutionResult> => {
    if (!context?.userId) throw new Error("Please sign in to report an order issue.");
    const allowed = ["where_order", "cancel_order", "missing_item", "food_spilled", "food_cold", "payment_issue", "general_inquiry"];
    if (!allowed.includes(data?.issueType)) throw new Error("Invalid support issue type.");
    if (typeof data.orderId !== "string" || !data.orderId.trim()) throw new Error("An order is required.");
    if (data.details != null && (typeof data.details !== "string" || data.details.length > 2000)) {
      throw new Error("Keep support details within 2,000 characters.");
    }
    const sql = await getSql();
    const rows = await sql<{ id: string; public_id: string; status: string }>`
      select id, public_id, status from orders where id = ${data.orderId} and user_id = ${context.userId}
    `;
    const order = rows[0];
    if (!order) throw new Error("Order not found or access denied.");

    if (data.issueType === "where_order") {
      const statusText =
        order.status === "placed"
          ? "placed and awaiting restaurant confirmation"
          : order.status === "confirmed"
            ? "confirmed and currently being prepared by the kitchen"
            : order.status === "cooking"
              ? "in the kitchen being freshly cooked"
              : order.status === "ready"
                ? "packed and ready for delivery partner pickup"
                : order.status === "dispatched"
                  ? "out for delivery with our delivery partner"
                  : order.status === "delivered"
                    ? "successfully delivered"
                    : order.status;

      return {
        ok: true,
        orderId: order.id,
        issueType: data.issueType,
        actionTaken: "STATUS_REPORT",
        title: "Order Status",
        explanation: `Order #${order.public_id} is ${statusText}. Track live updates on the order page.`,
      };
    }

    const ticketId = newId("tkt");
    const detailMsg = data.details?.trim() || "Order support request";
    await sql`
      insert into support_tickets (id, user_id, order_id, topic, message, status)
      values (${ticketId}, ${context.userId}, ${order.id}, ${data.issueType}, ${detailMsg}, 'open')
    `;

    try {
      await sql`
        insert into tickets (
          id, org_id, queue, category, status, priority, subject,
          customer_id, order_id, sla_minutes, opened_at, data_mode
        ) values (
          ${ticketId}, 'org_orderking', 'customer', ${data.issueType},
          'OPEN', ${data.issueType === 'cancel_order' || data.issueType === 'food_spilled' || data.issueType === 'missing_item' ? 'HIGH' : 'NORMAL'},
          ${`Customer report: ${data.issueType} on order #${order.public_id}`},
          ${context.userId}, ${order.id}, 30, now(), 'ACTUAL'
        )
        on conflict (id) do nothing
      `;
      await sql`
        insert into ticket_messages (
          id, ticket_id, org_id, visibility, author_type, author_employee_id, body, created_at
        ) values (
          ${newId("tm")}, ${ticketId}, 'org_orderking', 'public', 'customer', null, ${detailMsg}, now()
        )
        on conflict (id) do nothing
      `;
    } catch (syncErr) {
      console.warn("[customer ticket central sync warning]:", syncErr);
    }

    return {
      ok: true,
      orderId: order.id,
      issueType: data.issueType,
      actionTaken: "REQUEST_RECORDED",
      title: data.issueType === "cancel_order" ? "Cancellation Request Received" : "Support Ticket Created",
      explanation: `Ticket #${ticketId} has been created for order #${order.public_id}. Our team is reviewing it and will notify you shortly.`,
      ticketId,
    };
  });

export type TicketMessageView = {
  id: string;
  ticketId: string;
  authorType: "customer" | "employee" | "system";
  authorName: string;
  body: string;
  createdAt: string;
};

export const listTicketMessages = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((d: { ticketId: string }) => d)
  .handler(async ({ context, data }: any): Promise<{ ticketId: string; messages: TicketMessageView[] }> => {
    if (!context?.userId) throw new Error("Please sign in to view support messages.");
    if (!data?.ticketId || typeof data.ticketId !== "string") throw new Error("Ticket ID required.");
    const sql = await getSql();

    const ticket = await sql<{ id: string }>`
      select id from support_tickets where id = ${data.ticketId} and user_id = ${context.userId}
      union
      select id from tickets where id = ${data.ticketId} and customer_id = ${context.userId}
      limit 1
    `;
    if (!ticket[0]) throw new Error("Ticket not found or access denied.");

    const rows = await sql<{
      id: string;
      ticket_id: string;
      author_type: string;
      author_employee_id: string | null;
      body: string;
      created_at: string;
    }>`
      select id, ticket_id, author_type, author_employee_id, body, created_at::text as created_at
      from ticket_messages
      where ticket_id = ${data.ticketId} and visibility = 'public'
      order by created_at asc
    `;

    return {
      ticketId: data.ticketId,
      messages: rows.map((r) => ({
        id: r.id,
        ticketId: r.ticket_id,
        authorType: (r.author_type === "employee" ? "employee" : r.author_type === "system" ? "system" : "customer") as any,
        authorName: r.author_type === "employee" ? "OrderKing Support (Founder)" : "You",
        body: r.body,
        createdAt: r.created_at,
      })),
    };
  });

export const sendCustomerTicketReply = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { ticketId: string; message: string }) => d)
  .handler(async ({ context, data }: any): Promise<{ ok: true; messageId: string }> => {
    if (!context?.userId) throw new Error("Please sign in to send a support message.");
    if (!data?.ticketId || typeof data.ticketId !== "string") throw new Error("Ticket ID required.");
    const body = (data?.message || "").trim();
    if (!body || body.length > 2000) throw new Error("Message must be between 1 and 2,000 characters.");
    const sql = await getSql();

    const ticket = await sql<{ id: string; status: string }>`
      select id, status from support_tickets where id = ${data.ticketId} and user_id = ${context.userId}
      union
      select id, status from tickets where id = ${data.ticketId} and customer_id = ${context.userId}
      limit 1
    `;
    if (!ticket[0]) throw new Error("Ticket not found or access denied.");

    const messageId = newId("tm");
    await sql`
      insert into ticket_messages (
        id, ticket_id, org_id, visibility, author_type, author_employee_id, body, created_at
      ) values (
        ${messageId}, ${data.ticketId}, 'org_orderking', 'public', 'customer', null, ${body}, now()
      )
    `;

    try {
      await sql`
        update tickets set status = 'WAITING', updated_at = now() where id = ${data.ticketId}
      `;
      await sql`
        update support_tickets set status = 'in_progress', updated_at = now() where id = ${data.ticketId}
      `;
    } catch (_) {}

    return { ok: true, messageId };
  });

export type AiChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  links?: { title: string; url: string; phone?: string; badge?: string }[];
  actionChip?: { label: string; issueType: SupportIssueType };
};

export const askAiSupportAssistant = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { query: string; orderId?: string }) => d)
  .handler(async ({ context, data }: any): Promise<{ reply: string; links?: { title: string; url: string; phone?: string; badge?: string }[]; actionChip?: { label: string; issueType: SupportIssueType } }> => {
    if (!context?.userId) throw new Error("Please sign in to ask about your account.");
    if (typeof data?.query !== "string" || !data.query.trim() || data.query.length > 1200) {
      throw new Error("Enter a question within 1,200 characters.");
    }
    const q = data.query.toLowerCase().trim();
    const sql = await getSql();

    let orderInfo = "";
    if (data.orderId) {
      const rows = await sql<{ public_id: string; status: string; placed_at: string }>`
        select public_id, status, placed_at::text as placed_at from orders where id = ${data.orderId} and user_id = ${context.userId}
      `;
      if (rows[0]) {
        const min = Math.max(0, Math.floor((Date.now() - new Date(rows[0].placed_at).getTime()) / 60000));
        orderInfo = `Order #${rows[0].public_id} is currently ${rows[0].status} (${min}m ago).`;
      }
    }

    try {
      const { GoogleGeminiProvider } = await import("@/lib/ai/providers/gemini-provider");
      const gemini = new GoogleGeminiProvider();
      
      if (gemini.isConfigured) {
        const schema = {
           type: "object",
           properties: {
             issueType: { type: "string", enum: ["where_order", "cancel_order", "missing_item", "food_spilled", "food_cold", "payment_issue", "general_inquiry"] },
             reply: { type: "string", description: "Helpful, polite, and concise customer support reply (1-3 sentences) in the tone of top delivery apps (Zomato/Swiggy)." },
             actionLabel: { type: "string", description: "Short action button label, e.g. 'Track Order' or 'Report Issue'" },
             needsAction: { type: "boolean" },
           },
           required: ["issueType", "reply", "needsAction"]
        };
        
        const prompt = `You are OrderKing Customer Support. Respond to the customer with warm, efficient, and concise support.
Customer: "${data.query}".
${orderInfo ? 'Context: ' + orderInfo : ''}
Instruction:
1. Reply in the exact same language as the customer (English, Hindi, Bengali, etc.).
2. Keep your response under 3 sentences. Be polite, direct, and helpful.
3. If asking about an order status, guide them cleanly. If reporting missing or damaged food, reassure them that our support team is on it.`;
        
        const res = await gemini.generateStructuredOutput<any>({ prompt, schema });
        
        return {
          reply: res.reply,
          links: undefined,
          actionChip: res.needsAction && ["where_order", "cancel_order", "missing_item", "food_spilled", "food_cold", "payment_issue", "general_inquiry"].includes(res.issueType) ? { label: res.actionLabel || "View Details", issueType: res.issueType as SupportIssueType } : undefined
        };
      }
    } catch {
      // Clean fallback
    }

    // 1. Where / Delay / Status
    if (q.includes("where") || q.includes("delay") || q.includes("late") || q.includes("status") || q.includes("track")) {
      return {
        reply: orderInfo ? `${orderInfo} Track live location and updates on the order screen.` : "Select your active order to view live preparation and delivery status.",
        actionChip: { label: "Track Live Order", issueType: "where_order" },
      };
    }

    // 2. Cancel / Refund
    if (q.includes("cancel") || q.includes("refund") || q.includes("return") || q.includes("money back")) {
      return {
        reply: "Orders can be cancelled before the kitchen starts preparation. For delivered orders with missing or damaged items, report the issue below for a resolution.",
        actionChip: { label: "Cancel Order / Request Refund", issueType: "cancel_order" },
      };
    }

    // 3. Spilled / Cold / Quality
    if (q.includes("spill") || q.includes("cold") || q.includes("quality") || q.includes("stale") || q.includes("missing")) {
      return {
        reply: "We are sorry about the issue with your meal. Please select the affected item below so we can resolve this right away.",
        actionChip: { label: "Report Damaged or Missing Item", issueType: "food_spilled" },
      };
    }

    // 4. KingPay / Wallet
    if (q.includes("kingpay") || q.includes("king pay") || q.includes("wallet") || q.includes("balance") || q.includes("upi")) {
      return {
        reply: "You can view your KingPay balance, recharge history, and payment methods in the KingPay section.",
        links: [
          { title: "Open KingPay", url: "/king-pay", badge: "Wallet & Payments" },
        ],
      };
    }

    // General fallback
    return {
      reply: "Hello! How can we assist you today? You can track an order, report a damaged or missing item, or get help with your payment.",
      links: [
        { title: "My Orders", url: "/orders" },
        { title: "WhatsApp Support", url: "https://wa.me/919395065587?text=Hi%20OrderKing%20Support" },
      ],
    };
  });
