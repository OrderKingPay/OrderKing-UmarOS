
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
    if (!context?.userId) throw new Error("Sign in to view or report an order.");
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
      return {
        ok: true, orderId: order.id, issueType: data.issueType, actionTaken: "STATUS_REPORT",
        title: "Recorded order status",
        explanation: `Order #${order.public_id} is recorded as ${order.status}. This status does not confirm a live rider location or arrival time. No refund or credit has been issued.`,
      };
    }

    // A complaint records a request. Only the authoritative order/payment workflow
    // may cancel an order, approve compensation, or confirm a provider refund.
    const ticketId = newId("tkt");
    await sql`
      insert into support_tickets (id, user_id, order_id, topic, message, status)
      values (${ticketId}, ${context.userId}, ${order.id}, ${data.issueType}, ${data.details?.trim() || "Order support request"}, 'open')
    `;
    return {
      ok: true, orderId: order.id, issueType: data.issueType, actionTaken: "REQUEST_RECORDED",
      title: data.issueType === "cancel_order" ? "Cancellation request recorded" : "Support request recorded",
      explanation: `Request #${ticketId} has been saved for order #${order.public_id}. It is awaiting review. Your order status is unchanged, and no refund or credit has been issued. Response time is not yet confirmed.`,
      ticketId,
    };
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
    if (!context?.userId) throw new Error("Sign in to ask about your account.");
    if (typeof data?.query !== "string" || !data.query.trim() || data.query.length > 1200) throw new Error("Enter a question within 1,200 characters.");
    const q = data.query.toLowerCase().trim();
    const sql = await getSql();

    let orderInfo = "";
    if (data.orderId) {
      const rows = await sql<{ public_id: string; status: string; placed_at: string }>`
        select public_id, status, placed_at::text as placed_at from orders where id = ${data.orderId} and user_id = ${context.userId}
      `;
      if (rows[0]) {
        const min = Math.max(0, Math.floor((Date.now() - new Date(rows[0].placed_at).getTime()) / 60000));
        orderInfo = `For your order #${rows[0].public_id}, the status is currently "${rows[0].status}" (${min} mins elapsed).`;
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
             reply: { type: "string", description: "Professional, helpful, and concise customer support reply (max 3 sentences) in the tone of OrderKing Support." },
             actionLabel: { type: "string", description: "A short label for an action button if the issue is actionable, e.g. 'Cancel Order' or 'Track Order'" },
             needsAction: { type: "boolean" },
             links: { type: "array", items: { type: "object", properties: { title: {type: "string"}, url: {type: "string"}, badge: {type: "string"} } } }
           },
           required: ["issueType", "reply", "needsAction"]
        };
        
        const prompt = `[APEX DIRECTIVE V3.0 OMNILINGUAL AI ENGAGED]
Customer message: "${data.query}".
${orderInfo ? 'Order context: ' + orderInfo : 'No specific order context provided.'}
INSTRUCTION: 
1. You must respond flawlessly in the EXACT NATIVE LANGUAGE the customer used (e.g., if they speak Bengali, respond in perfect Bengali; if Hindi, respond in perfect Hindi). 
2. Be High_Performance more accurate and helpful than dominant legacy aggregators. 
3. Keep it to max 3 sentences. Tone is elite, polite OrderKing Support. 
4. You are read-only. Never claim a refund, credit, cancellation, rider assignment, booking, ticket, or escalation occurred. Only quote the supplied recorded order status. Do not promise compensation, service availability, legal compliance, response times, or payment products. If unknown, say so. Action buttons only record support requests. Return no external links.`;
        
        const res = await gemini.generateStructuredOutput<any>({ prompt, schema });
        
        return {
          reply: res.reply,
          links: undefined,
          actionChip: res.needsAction && ["where_order", "cancel_order", "missing_item", "food_spilled", "food_cold", "payment_issue", "general_inquiry"].includes(res.issueType) ? { label: res.issueType === "where_order" ? "Check recorded status" : "Record support request", issueType: res.issueType as SupportIssueType } : undefined
        };
      }
    } catch (e) {
      console.error("AI Support failed, using heuristic fallback", e);
    }

    // 1. Check if user is asking about an order
    if (q.includes("where") || q.includes("delay") || q.includes("late") || q.includes("status") || q.includes("track")) {
      return {
        reply: `${orderInfo || "Select an order to see its recorded status."} Live rider location and arrival time are not confirmed here. A delay check does not issue compensation.`,
        actionChip: { label: "Check recorded order status", issueType: "where_order" },
      };
    }

    // 2. Check if asking about KingPay or KingPay Later
    if (q.includes("kingpay") || q.includes("king pay") || q.includes("wallet") || q.includes("pay later") || q.includes("credit") || q.includes("interest")) {
      return {
        reply: `King Pay includes financial planning tools. Live payments, wallet balances and credit products require verified providers and account records. This assistant cannot confirm a credit limit, safeguard funds, or move money.`,
        links: [
          { title: "Open KingPay Hub", url: "/king-pay", badge: "Fintech Hub" },
          { title: "RBI Banking Ombudsman (CMS)", url: "https://cms.rbi.org.in", badge: "Govt Portal" },
        ],
      };
    }

    // 3. Check if asking about Recharges, LPG gas, or Bill payments
    if (q.includes("recharge") || q.includes("cylinder") || q.includes("lpg") || q.includes("gas") || q.includes("electricity") || q.includes("apdcl") || q.includes("fastag")) {
      return {
        reply: `Live recharges, bill payments and LPG bookings are not confirmed here. Check the provider availability shown in King Pay before proceeding. No booking, cashback or payment reversal is created by this chat.`,
        links: [
          { title: "Check King Pay availability", url: "/king-pay", badge: "Availability" },
          { title: "NPCI UPI Dispute Redressal", url: "https://www.npci.org.in/what-we-do/upi/dispute-redressal-mechanism", badge: "Official" },
        ],
      };
    }

    // 4. Check if asking about Cancel / Refund
    if (q.includes("cancel") || q.includes("refund") || q.includes("return") || q.includes("money back")) {
      return {
        reply: `Cancellation eligibility depends on the recorded order state. You can save a cancellation or refund request, but this chat does not cancel orders or initiate refunds. A refund is confirmed only after the payment provider records it.`,
        actionChip: { label: "Record cancellation request", issueType: "cancel_order" },
      };
    }

    // 5. Check if asking about Hygiene, Food Quality, or FSSAI
    if (q.includes("fssai") || q.includes("hygiene") || q.includes("cold") || q.includes("spill") || q.includes("quality") || q.includes("stale")) {
      return {
        reply: `You can report a missing, spilled or poor-quality item against your order. Your report is saved for review; it does not automatically award credits or a refund. For a food safety complaint, consult the official FSSAI website.`,
        actionChip: { label: "🍜 Report Spilled / Poor Quality Item", issueType: "food_spilled" },
        links: [
          { title: "FSSAI National Food Safety Grievance", url: "https://foscos.fssai.gov.in", badge: "FSSAI Portal" },
        ],
      };
    }

    // 6. Check if asking about Government Ombudsman or Consumer Rights
    if (q.includes("government") || q.includes("ombudsman") || q.includes("consumer") || q.includes("court") || q.includes("rbi") || q.includes("police") || q.includes("fraud") || q.includes("cyber")) {
      return {
        reply: `These official websites explain complaint procedures and eligibility. This chat does not file complaints with a bank, regulator or government agency.`,
        links: [
          { title: "National Consumer Helpline (NCH)", url: "https://consumerhelpline.gov.in", phone: "1915", badge: "Ministry of Consumer Affairs" },
          { title: "RBI Banking Ombudsman (CMS)", url: "https://cms.rbi.org.in", badge: "Reserve Bank of India" },
          { title: "National Cyber Crime Reporting", url: "https://cybercrime.gov.in", phone: "1930", badge: "Ministry of Home Affairs" },
          { title: "FSSAI Food Safety Portal", url: "https://foscos.fssai.gov.in", badge: "Food Authority" },
        ],
      };
    }

    // General fallback
    return {
      reply: `I can explain how to check a recorded order status, save a support request and find official complaint information. Live AI may be unavailable; this guidance does not perform payments, refunds or bookings. What would you like help with?`,
      links: [
        { title: "National Consumer Helpline", url: "https://consumerhelpline.gov.in", phone: "1915" },
        { title: "RBI Banking Ombudsman", url: "https://cms.rbi.org.in" },
      ],
    };
  });

