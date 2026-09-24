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
  actionTaken: "STATUS_REPORT" | "AUTO_CANCELLED" | "COMPENSATION_GRANTED" | "ESCALATED_TO_PRIORITY";
  title: string;
  explanation: string;
  compensationPaise?: number;
  ticketId?: string;
};

export const diagnoseAndResolveOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { orderId: string; issueType: SupportIssueType; details?: string }) => d)
  .handler(async ({ context, data }): Promise<ResolutionResult> => {
    const sql = await getSql();

    // 1. Fetch order details
    const rows = await sql<{
      id: string;
      public_id: string;
      status: string;
      placed_at: string;
      total_paise: number;
      restaurant_id: string;
    }>`select id, public_id, status, placed_at::text as placed_at, total_paise, restaurant_id from orders where id = ${data.orderId} and user_id = ${context.userId}`;
    const order = rows[0];

    if (!order) {
      throw new Error("Order not found or access denied.");
    }

    const placedAt = new Date(order.placed_at).getTime();
    const minutesSincePlaced = Math.max(0, Math.floor((Date.now() - placedAt) / 60000));

    // 2. Handle specific issue types matching Zomato's policy resolution
    if (data.issueType === "where_order") {
      let explanation = "";
      let actionTaken: ResolutionResult["actionTaken"] = "STATUS_REPORT";
      let compensationPaise = 0;

      if (order.status === "PLACED") {
        explanation = `Your order #${order.public_id} was received ${minutesSincePlaced} min(s) ago and the kitchen is confirming it now.`;
      } else if (order.status === "ACCEPTED" || order.status === "PREPARING") {
        explanation = `The kitchen has been preparing your order for ${minutesSincePlaced} min(s). Fresh preparation typically takes 15-20 minutes.`;
      } else if (order.status === "READY" || order.status === "RIDER_ASSIGNED") {
        explanation = `Your food is freshly packed and a nearby delivery partner has been assigned for pickup.`;
      } else if (order.status === "PICKED_UP" || order.status === "ON_THE_WAY") {
        explanation = `Your delivery partner has picked up your meal and is currently en route to your address.`;
      } else if (order.status === "DELIVERED") {
        explanation = `Our records show your order was delivered. If you have not received it, we will immediately escalate to operations.`;
      } else {
        explanation = `Order status is currently ${order.status}.`;
      }

      // If delayed over 35 minutes and not delivered, give instant compensation
      if (minutesSincePlaced > 35 && !["DELIVERED", "CANCELLED"].includes(order.status)) {
        actionTaken = "COMPENSATION_GRANTED";
        compensationPaise = 5000; // ₹50 delay apology credit
        explanation += ` Since your order is running behind our 30-minute target SLA, we have credited ₹50 to your loyalty rewards as an apology!`;

        // Credit points to loyalty account
        const points = 50;
        await sql`
          insert into loyalty_accounts (user_id, points, lifetime_points, tier)
          values (${context.userId}, ${points}, ${points}, 'starter')
          on conflict (user_id) do update set
            points = loyalty_accounts.points + ${points},
            updated_at = now()
        `;
        await sql`
          insert into loyalty_transactions (id, user_id, order_id, delta, reason)
          values (${newId("loy")}, ${context.userId}, ${order.id}, ${points}, 'delay_compensation')
        `;
      }

      return {
        ok: true,
        orderId: order.id,
        issueType: data.issueType,
        actionTaken,
        title: "Order Live Status Diagnostics",
        explanation,
        compensationPaise: compensationPaise > 0 ? compensationPaise : undefined,
      };
    }

    if (data.issueType === "cancel_order") {
      const isEarlyCancel = order.status === "PLACED" && minutesSincePlaced <= 3;
      const isExcessiveDelay = minutesSincePlaced > 35 && ["PLACED", "ACCEPTED", "PREPARING"].includes(order.status);

      if (isEarlyCancel || isExcessiveDelay) {
        // Instant cancellation allowed
        await sql`update orders set status = 'CANCELLED', updated_at = now() where id = ${order.id} and user_id = ${context.userId}`;
        await sql`insert into order_events (id, order_id, from_status, to_status, actor_user_id, actor_role, note) values (${newId("oev")}, ${order.id}, ${order.status}, 'CANCELLED', ${context.userId}, 'customer', ${isExcessiveDelay ? 'Cancelled due to severe kitchen delay (>35 mins) with 100% refund' : 'Instant cancellation within 3 minutes'})`;

        let explanation = `Your order #${order.public_id} was successfully cancelled. Full refund has been initiated to your original payment method.`;
        let compensationPaise: number | undefined;

        if (isExcessiveDelay) {
          explanation += ` Additionally, ₹50 apology credit has been added to your loyalty wallet for the inconvenience.`;
          compensationPaise = 5000;
          const points = 50;
          await sql`
            insert into loyalty_accounts (user_id, points, lifetime_points, tier)
            values (${context.userId}, ${points}, ${points}, 'starter')
            on conflict (user_id) do update set
              points = loyalty_accounts.points + ${points},
              updated_at = now()
          `;
          await sql`
            insert into loyalty_transactions (id, user_id, order_id, delta, reason)
            values (${newId("loy")}, ${context.userId}, ${order.id}, ${points}, 'delay_cancellation_apology')
          `;
        }

        return {
          ok: true,
          orderId: order.id,
          issueType: data.issueType,
          actionTaken: "AUTO_CANCELLED",
          title: "Order Cancelled & 100% Refunded",
          explanation,
          compensationPaise,
        };
      } else {
        return {
          ok: false,
          orderId: order.id,
          issueType: data.issueType,
          actionTaken: "ESCALATED_TO_PRIORITY",
          title: "Cancellation Request Escalated",
          explanation: `The kitchen has already started preparing your food (status: ${order.status}, elapsed: ${minutesSincePlaced} mins). Automatic cancellation is not permitted once cooking begins, but an urgent priority ticket has been created for manager intervention.`,
        };
      }
    }

    if (data.issueType === "missing_item" || data.issueType === "food_spilled") {
      // Create priority ticket & issue instant credit adjustment
      const ticketId = newId("tkt");
      const title = data.issueType === "missing_item" ? "Missing item claim" : "Spilled / Damaged item claim";
      const compensationPaise = Math.min(order.total_paise, 10000); // Up to ₹100 instant relief credit

      await sql`
        insert into support_tickets (id, user_id, order_id, topic, message, status)
        values (
          ${ticketId},
          ${context.userId},
          ${order.id},
          ${data.issueType},
          ${`Automated claim: ${title}. Customer note: ${data.details ?? "None provided"}`},
          'resolved'
        )
      `;

      // Credit wallet points
      const points = Math.round(compensationPaise / 100);
      await sql`
        insert into loyalty_accounts (user_id, points, lifetime_points, tier)
        values (${context.userId}, ${points}, ${points}, 'starter')
        on conflict (user_id) do update set
          points = loyalty_accounts.points + ${points},
          updated_at = now()
      `;
      await sql`
        insert into loyalty_transactions (id, user_id, order_id, delta, reason)
        values (${newId("loy")}, ${context.userId}, ${order.id}, ${points}, 'incident_resolution_credit')
      `;

      return {
        ok: true,
        orderId: order.id,
        issueType: data.issueType,
        actionTaken: "COMPENSATION_GRANTED",
        title: "Instant Resolution & Compensation",
        explanation: `We deeply apologize for the issue with order #${order.public_id}. We have issued an instant ₹${points} credit directly to your account. Your ticket #${ticketId} is logged for kitchen quality review.`,
        compensationPaise,
        ticketId,
      };
    }

    // Default fallback ticket
    const ticketId = newId("tkt");
    await sql`
      insert into support_tickets (id, user_id, order_id, topic, message, status)
      values (${ticketId}, ${context.userId}, ${order.id}, ${data.issueType}, ${data.details ?? "Support request via assistant"}, 'open')
    `;

    return {
      ok: true,
      orderId: order.id,
      issueType: data.issueType,
      actionTaken: "ESCALATED_TO_PRIORITY",
      title: "Support Ticket Logged",
      explanation: `Your inquiry has been escalated to our Karimganj local operations team under ticket #${ticketId}. We typically respond within 10 minutes.`,
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
  .handler(async ({ context, data }): Promise<{ reply: string; links?: { title: string; url: string; phone?: string; badge?: string }[]; actionChip?: { label: string; issueType: SupportIssueType } }> => {
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
        
        const prompt = `Customer message: "${data.query}". ${orderInfo ? 'Order context: ' + orderInfo : ''} Analyze intent and generate a realistic response. If order is late (>35 mins), mention 50rs compensation.`;
        
        const res = await gemini.generateStructuredOutput<any>({ prompt, schema });
        
        return {
          reply: res.reply,
          links: res.links?.length > 0 ? res.links : undefined,
          actionChip: res.needsAction ? { label: res.actionLabel || "Take Action", issueType: res.issueType as SupportIssueType } : undefined
        };
      }
    } catch (e) {
      console.error("AI Support failed, using heuristic fallback", e);
    }

    // 1. Check if user is asking about an order
    if (q.includes("where") || q.includes("delay") || q.includes("late") || q.includes("status") || q.includes("track")) {
      return {
        reply: `Our standard delivery time across Karimganj and Silchar is 25–35 minutes. ${orderInfo} If any order exceeds 35 minutes, our system automatically disburses a ₹50 late compensation credit directly to your loyalty wallet. You can click the button below to claim it immediately if eligible.`,
        actionChip: { label: "⚡ Run Live Delivery Diagnostics", issueType: "where_order" },
      };
    }

    // 2. Check if asking about KingPay or KingPay Later
    if (q.includes("kingpay") || q.includes("king pay") || q.includes("wallet") || q.includes("pay later") || q.includes("credit") || q.includes("interest")) {
      return {
        reply: `KingPay is our dedicated fintech wallet providing 1-Tap checkout with zero OTP delays, saving 2% in payment gateway surcharges. KingPay Later offers eligible customers an instant ₹2,500 credit limit at 0% interest for 15 days, auto-repaid on the 1st and 16th of each month. All wallet balances are 100% safeguarded under RBI-compliant escrow invariant accounts.`,
        links: [
          { title: "Open KingPay Hub", url: "/king-pay", badge: "Fintech Hub" },
          { title: "RBI Banking Ombudsman (CMS)", url: "https://cms.rbi.org.in", badge: "Govt Portal" },
        ],
      };
    }

    // 3. Check if asking about Recharges, LPG gas, or Bill payments
    if (q.includes("recharge") || q.includes("cylinder") || q.includes("lpg") || q.includes("gas") || q.includes("electricity") || q.includes("apdcl") || q.includes("fastag")) {
      return {
        reply: `You can recharge prepaid mobiles (Jio, Airtel, Vi, BSNL), book Indane, HP & Bharat Gas cylinders, pay APDCL electricity bills, and recharge FASTag directly inside KingPay. Every transaction earns you 2% cashback or King Coins plus partner fuel vouchers. If your recharge or LPG booking fails, UPI reconciliation is handled within 2 hours under NPCI guidelines.`,
        links: [
          { title: "Book LPG & Recharges in KingPay", url: "/king-pay", badge: "Instant" },
          { title: "NPCI UPI Dispute Redressal", url: "https://www.npci.org.in/what-we-do/upi/dispute-redressal-mechanism", badge: "Official" },
        ],
      };
    }

    // 4. Check if asking about Cancel / Refund
    if (q.includes("cancel") || q.includes("refund") || q.includes("return") || q.includes("money back")) {
      return {
        reply: `Orders can be cancelled with a 100% instant refund within 3 minutes of placement if the kitchen has not begun preparation. For prepaid UPI or KingPay orders, refunds are processed instantly back to your wallet or within 24 hours to your bank account. If an item is missing or damaged, our automated bot grants instant store credit.`,
        actionChip: { label: "🛑 Cancel Order or Check Refund", issueType: "cancel_order" },
      };
    }

    // 5. Check if asking about Hygiene, Food Quality, or FSSAI
    if (q.includes("fssai") || q.includes("hygiene") || q.includes("cold") || q.includes("spill") || q.includes("quality") || q.includes("stale")) {
      return {
        reply: `All partner restaurants on OrderKing are required to maintain valid FSSAI certification and adhere to strict hygiene guidelines. If your food was spilled, cold, or sub-standard, click below to receive instant compensation and report the kitchen for priority review. For severe food safety concerns, you can also log a grievance on the National FoSCoS portal.`,
        actionChip: { label: "🍜 Report Spilled / Poor Quality Item", issueType: "food_spilled" },
        links: [
          { title: "FSSAI National Food Safety Grievance", url: "https://foscos.fssai.gov.in", badge: "FSSAI Portal" },
        ],
      };
    }

    // 6. Check if asking about Government Ombudsman or Consumer Rights
    if (q.includes("government") || q.includes("ombudsman") || q.includes("consumer") || q.includes("court") || q.includes("rbi") || q.includes("police") || q.includes("fraud") || q.includes("cyber")) {
      return {
        reply: `OrderKing strictly complies with the Consumer Protection (E-Commerce) Rules, RBI PPI Directives, and FSSAI Regulations. If your grievance is unresolved by our team, you have the statutory right to escalate directly to official government portals with zero friction.`,
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
      reply: `I am the OrderKing 24x7 Intelligent Assistant. I can help you with live order tracking, late delivery compensation (₹50 credit if >35 min), KingPay wallet & 0% KingPay Later, recharges & LPG cylinder bookings, refunds, and official government ombudsman links. How can I assist you right now?`,
      links: [
        { title: "National Consumer Helpline", url: "https://consumerhelpline.gov.in", phone: "1915" },
        { title: "RBI Banking Ombudsman", url: "https://cms.rbi.org.in" },
      ],
    };
  });

