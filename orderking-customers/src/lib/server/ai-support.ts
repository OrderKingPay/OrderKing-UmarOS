import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { newId } from "@/lib/ids";
import { OpenAIProvider } from "@/lib/ai/providers/openai-provider";

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
  actionTaken: "STATUS_REPORT" | "AUTO_CANCELLED" | "ESCALATED_TO_PRIORITY";
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

    const rows = await sql<{
      id: string;
      public_id: string;
      status: string;
      placed_at: string;
      total_paise: number;
    }>`
      SELECT id, public_id, status, placed_at::text AS placed_at, total_paise
      FROM orders
      WHERE id = ${data.orderId}
        AND user_id = ${context.userId}
      LIMIT 1
    `;

    const order = rows[0];
    if (!order) throw new Error("Order not found or access denied.");

    const minutesSincePlaced = Math.max(
      0,
      Math.floor((Date.now() - new Date(order.placed_at).getTime()) / 60000),
    );

    if (data.issueType === "where_order") {
      const title = "Order Live Status";
      let explanation = `Order #${order.public_id} is currently ${order.status.replaceAll("_", " ").toLowerCase()}.`;

      if (minutesSincePlaced > 35 && !["DELIVERED", "CANCELLED"].includes(order.status)) {
        explanation +=
          " The order is beyond the configured 35-minute support threshold and has been flagged for priority review.";
      }

      return {
        ok: true,
        orderId: order.id,
        issueType: data.issueType,
        actionTaken: "STATUS_REPORT",
        title,
        explanation,
      };
    }

    if (data.issueType === "cancel_order") {
      const cancellable = order.status === "PLACED" && minutesSincePlaced <= 3;
      const delayedCancellation =
        minutesSincePlaced > 35 && ["PLACED", "ACCEPTED", "PREPARING"].includes(order.status);

      if (!cancellable && !delayedCancellation) {
        const ticketId = newId("tkt");
        await sql`
          INSERT INTO support_tickets (id, user_id, order_id, topic, message, status)
          VALUET (
            ${ticketId},
            ${context.userId},
            ${order.id},
            'cancel_order',
            ${data.details ?? "Customer requested cancellation after preparation started."},
            'open'
          )
        `;

        return {
          ok: true,
          orderId: order.id,
          issueType: data.issueType,
          actionTaken: "ESCALATED_TO_PRIORITY",
          title: "Cancellation Request Escalated",
          explanation:
            "The order is already beyond the automatic-cancellation window. A priority cancellation review was created; no refund or balance change is claimed until the payment provider confirms the outcome.",
          ticketId,
        };
      }

      const ticketId = newId("tkt");
      await sql.transaction(async (tx) => {
        await tx`
          UPDATE orders
          SET status = 'CANCELLED', updated_at = now()
          WHERE id = ${order.id}
            AND user_id = ${context.userId}
            AND status = ${order.status}
        `;
        await tx`
          INSERT INTO order_events
            (id, order_id, from_status, to_status, actor_user_id, actor_role, note)
          VALUES
            (${newId("oev")}, ${order.id}, ${order.status}, 'CANCELLED', ${context.userId}, 'customer',
             ${delayedCancellation ? "Cancelled after severe delay; payment refund requires provider confirmation." : "Cancelled within automatic cancellation window."})
        `;
        await tx`
          INSERT INTO support_tickets (id, user_id, order_id, topic, message, status)
          VALUES (
            ${ticketId},
            ${context.userId},
            ${order.id},
            'refund_review',
            'Cancellation accepted; provider refund/reconciliation remains pending verification.',
            'open'
          )
        `;
      });

      return {
        ok: true,
        orderId: order.id,
        issueType: data.issueType,
        actionTaken: "AUTO_CANCELLED",
        title: "Order Cancelled",
        explanation:
          "The order has been marked cancelled. Any payment reversal is handled as a separate provider reconciliation and is not reported as completed until confirmed.",
        ticketId,
      };
    }

    if (data.issueType === "missing_item" || data.issueType === "food_spilled" || data.issueType === "food_cold") {
      const ticketId = newId("tkt");
      await sql`
        INSERT INTO support_tickets (id, user_id, order_id, topic, message, status)
        VALUES (
          ${ticketId},
          ${context.userId},
          ${order.id},
          ${data.issueType},
          ${data.details ?? "Customer reported a post-delivery food issue."},
          'open'
        )
      `;

      return {
        ok: true,
        orderId: order.id,
        issueType: data.issueType,
        actionTaken: "ESCALATED_TO_PRIORITY",
        title: "Priority Support Ticket Created",
        explanation:
          "Your issue is recorded with the order and routed for priority review. No compensation is promised until the case and applicable policy are verified.",
        ticketId,
      };
    }

    const ticketId = newId("tkt");
    await sql`
      INSERT INTO support_tickets (id, user_id, order_id, topic, message, status)
      VALUES (
        ${ticketId},
        ${context.userId},
        ${order.id},
        ${data.issueType},
        ${data.details ?? "Customer support request via assistant."},
        'open'
      )
    `;

    return {
      ok: true,
      orderId: order.id,
      issueType: data.issueType,
      actionTaken: "ESCALATED_TO_PRIORITY",
      title: "Priority Support Ticket Created",
      explanation: "Your request is recorded against the order and routed for review.",
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

type AiIntentResponse = {
  issueType: SupportIssueType;
  reply: string;
  needsAction: boolean;
  actionLabel?: string;
  links?: { title: string; url: string; badge?: string; phone?: string }[];
};

export const askAiSupportAssistant = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { query: string; orderId?: string }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const query = data.query.trim().slice(0, 1000);
    if (!query) throw new Error("Ask a question.");

    let orderContext: Record<string, unknown> | null = null;

    if (data.orderId) {
      const rows = await sql<{
        public_id: string;
        status: string;
        placed_at: string;
      }>`
        SELECT public_id, status, placed_at::text AS placed_at
        FROM orders
        WHERE id = ${data.orderId}
          AND user_id = ${context.userId}
        LIMIT 1
      `;

      if (rows[0]) {
        orderContext = {
          publicId: rows[0].public_id,
          status: rows[0].status,
          minutesSincePlaced: Math.max(
            0,
            Math.floor({Date.now() - new Date(rows[0].placed_at).getTime()) / 60000),
          ),
        };
      }
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        reply: "Customer AI support is not configured on this deployment. No simulated answer will be shown.",
      };
    }

    const provider = new OpenAIProvider(apiKey);
    const response = await provider.chat"{
      model: process.env.OPENAI_CUSTOMER_MODEL || "gpt-5.6-luna",
      responseFormat: "json_object",
      temperature: 0.15,
      maxTokens: 500,
      systemPrompt: `
You are OrderKing Customer Support AI.
Use only the authorized order context and the user's message.
Never invent delivery times, refunds, compensation, wallet balances, regulatory compliance, bank status, provider status, promotions, prices, or product terms.
Never claim an action was executed unless the platform has actually executed it.
When an issue requires a state change, return needsAction=true and choose one of the supported issue types so the user interface can invoke the verified server action.
When information is missing, say that it is unavailable and ask the user to use the appropriate support action.
Return valid JSON with:
{
  "issueType": "where_order|cancel_order|missing_item|food_spilled|food_cold|payment_issue|general_inquiry",
  "reply": "brief helpful answer",
  "needsAction": true|false,
  "actionLabel": "optional short action label",
  "links": []
}
Authorized order context:
${JSON.stringify(orderContext)}
      `.trim(),
      messages: [{ role: "user", content: query }],
    });

    if (!response.text.trim()) {
      return { reply: "Customer AI support returned no answer. Please use the available support action." };
    }

    let parsed: AiIntentResponse;
    try {
      parsed = JSON.parse(response.text) as AiIntentResponse;
    } catch {
      return {
        reply: "Customer AI support returned an invalid response. Please use the available support action.",
      };
    }

    const allowedIssues: SupportIssueType[] = [
      "where_order",
      "cancel_order",
      "missing_item",
      "food_spilled",
      "food_cold",
      "payment_issue",
      "general_inquiry",
    ];

    const issueType = allowedIssues.includes(parsed.issueType)
      ? parsed.issueType
      : "general_inquiry";

    return {
      reply: parsed.reply?.trim() || "I could not safely determine the answer from the available information.",
      links: Array.isArray(parsed.links) ? parsed.links.slice(0, 5) : undefined,
      actionChip:
        parsed.needsAction && parsed.actionLabel
          ? { label: parsed.actionLabel.slice(0, 60), issueType }
          : undefined,
    };
  });
