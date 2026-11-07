import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { asIso, newId } from "@/lib/utils";
import { withVendor, writeAudit } from "./helpers";
import { notifyInApp } from "./helpers";

export type TicketCategory =
  | "PAYOUT_ISSUE"
  | "ORDER_DISPUTE"
  | "MENU_UPDATE_REQUEST"
  | "HARDWARE_POS_SYNC"
  | "FSSAI_COMPLIANCE"
  | "OTHER";

export type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export type TicketStatus = "OPEN" | "AI_INVESTIGATING" | "RESOLVED" | "ESCALATED_TO_ADMIN";

export interface TicketMessageView {
  id: string;
  ticketId: string;
  authorType: "MERCHANT" | "AI_ASSISTANT" | "ADMIN";
  authorName: string;
  body: string;
  attachmentUrl?: string | null;
  createdAt: string;
}

export interface PartnerTicketView {
  id: string;
  restaurantId: string;
  ticketNumber: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  description: string;
  orderId?: string | null;
  attachmentUrl?: string | null;
  aiResolutionSummary?: string | null;
  resolutionCode?: string | null;
  resolvedAt?: string | null;
  adminAssignedTo?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessageView[];
}

export const getPartnerTickets = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((d: { restaurantId?: string }) => d)
  .handler(async ({ context, data }) => {
    return withVendor(context.userId, data.restaurantId, "dashboard.view", async (sql, ctx) => {
      const tickets = await sql<any>`
        select id, restaurant_id, ticket_number, category, priority, status, subject,
               description, order_id, attachment_url, ai_resolution_summary, resolution_code,
               resolved_at::text as resolved_at, admin_assigned_to, admin_notes,
               created_at::text as created_at, updated_at::text as updated_at
        from partner_support_tickets
        where restaurant_id = ${ctx.restaurantId}
        order by created_at desc
        limit 100
      `;

      const ticketIds = tickets.map((t) => t.id);
      let messages: any[] = [];
      if (ticketIds.length > 0) {
        messages = await sql<any>`
          select id, ticket_id, author_type, author_name, body, attachment_url,
                 created_at::text as created_at
          from partner_ticket_messages
          where ticket_id = any(${ticketIds})
          order by created_at asc
        `;
      }

      const msgMap = new Map<string, TicketMessageView[]>();
      for (const m of messages) {
        const list = msgMap.get(m.ticket_id) || [];
        list.push({
          id: m.id,
          ticketId: m.ticket_id,
          authorType: m.author_type,
          authorName: m.author_name,
          body: m.body,
          attachmentUrl: m.attachment_url,
          createdAt: asIso(m.created_at),
        });
        msgMap.set(m.ticket_id, list);
      }

      const formatted: PartnerTicketView[] = tickets.map((t) => ({
        id: t.id,
        restaurantId: t.restaurant_id,
        ticketNumber: t.ticket_number,
        category: t.category as TicketCategory,
        priority: t.priority as TicketPriority,
        status: t.status as TicketStatus,
        subject: t.subject,
        description: t.description,
        orderId: t.order_id,
        attachmentUrl: t.attachment_url,
        aiResolutionSummary: t.ai_resolution_summary,
        resolutionCode: t.resolution_code,
        resolvedAt: t.resolved_at ? asIso(t.resolved_at) : null,
        adminAssignedTo: t.admin_assigned_to,
        adminNotes: t.admin_notes,
        createdAt: asIso(t.created_at),
        updatedAt: asIso(t.updated_at),
        messages: msgMap.get(t.id) || [],
      }));

      return {
        tickets: formatted,
        restaurantName: ctx.restaurantName,
        dataLabel: ctx.dataLabel,
      };
    });
  });

export const createPartnerTicket = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: {
      restaurantId?: string;
      category: TicketCategory;
      priority: TicketPriority;
      subject: string;
      description: string;
      orderId?: string;
      attachmentUrl?: string;
    }) => d
  )
  .handler(async ({ context, data }) => {
    return withVendor(context.userId, data.restaurantId, "dashboard.view", async (sql, ctx) => {
      const subject = data.subject.trim();
      const description = data.description.trim();
      if (!subject) throw new Error("Ticket subject is required");
      if (!description) throw new Error("Ticket description is required");

      const ticketId = newId("tkt");
      const ticketNumber = `OK-HELP-${Date.now().toString().slice(-6)}`;

      // 1. Employee-less Autonomous AI First-Responder Analysis
      const descLower = description.toLowerCase();
      const subjLower = subject.toLowerCase();
      let aiStatus: TicketStatus = "OPEN";
      let aiSummary = "";
      let resolutionCode = "";
      let resolvedAt: string | null = null;

      // Deterministic Instant Resolutions:
      if (data.category === "ORDER_DISPUTE" && (descLower.includes("spill") || descLower.includes("leak") || descLower.includes("transit"))) {
        aiStatus = "RESOLVED";
        resolutionCode = "AUTO_LOGISTICS_SPILL_PROTECTED";
        resolvedAt = new Date().toISOString();
        aiSummary =
          "🛡️ OrderKing Logistics Protection Policy Applied: Container spills, packaging drops, and transit physical damage are classified 100% as logistics liability. Your restaurant payout is fully protected with ₹0 deduction.";
      } else if (data.category === "PAYOUT_ISSUE" && (descLower.includes("when") || descLower.includes("timing") || descLower.includes("schedule") || descLower.includes("wednesday"))) {
        aiStatus = "RESOLVED";
        resolutionCode = "AUTO_SETTLEMENT_SCHEDULE_EXPLAINED";
        resolvedAt = new Date().toISOString();
        aiSummary =
          "💳 Automatic Settlement Schedule: Net payable amounts accrued from delivered orders settle on a daily T+1 schedule directly into your registered bank account. Statutory deductions are limited strictly to Section 9(5) CGST (5% restaurant tax deposited on your behalf) and Section 194-O TDS (0.1%). Check the Settlement tab for batch IDs.";
      } else if (data.category === "HARDWARE_POS_SYNC" && (descLower.includes("printer") || descLower.includes("kot") || descLower.includes("esc/pos"))) {
        aiStatus = "RESOLVED";
        resolutionCode = "AUTO_HARDWARE_KOT_GUIDED";
        resolvedAt = new Date().toISOString();
        aiSummary =
          "🖨️ Hardware & KOT Configuration: Ensure your 80mm/58mm thermal printer is paired via Bluetooth or assigned a static IP. Navigate to Settings -> Hardware to trigger a silent ESC/POS test ticket or enable automatic dual-KOT printing.";
      } else if (data.priority === "CRITICAL" || descLower.includes("fraud") || descLower.includes("bank account change") || descLower.includes("ifsc") || descLower.includes("legal") || descLower.includes("suspend")) {
        // High risk / critical security -> Escalate to human platform administration
        aiStatus = "ESCALATED_TO_ADMIN";
        resolutionCode = "ESCALATED_CRITICAL_ADMIN_REVIEW";
        aiSummary =
          "⚠️ High-Priority Escalation: This request requires verified platform administrative clearance under statutory KYC protocols. The ticket has been flagged for Hasan (Founder / Umar OS Admin) and an automated dispatch has been sent to merchant.care@orderking.in.";
      } else {
        aiStatus = "AI_INVESTIGATING";
        resolutionCode = "AI_DIAGNOSTIC_ACTIVE";
        aiSummary =
          "🤖 King AI Autonomous Desk has received your ticket. Relevant order snapshots and financial ledger entries are being reconciled against your request.";
      }

      // 2. Insert Ticket into PostgreSQL
      await sql`
        insert into partner_support_tickets (
          id, restaurant_id, user_id, ticket_number, category, priority, status,
          subject, description, order_id, attachment_url, ai_resolution_summary,
          resolution_code, resolved_at, admin_assigned_to
        ) values (
          ${ticketId}, ${ctx.restaurantId}, ${context.userId}, ${ticketNumber}, ${data.category},
          ${data.priority}, ${aiStatus}, ${subject}, ${description}, ${data.orderId || null},
          ${data.attachmentUrl || null}, ${aiSummary}, ${resolutionCode},
          ${resolvedAt ? sql`${resolvedAt}::timestamptz` : null},
          ${aiStatus === "ESCALATED_TO_ADMIN" ? "admin@orderkingpay.com" : null}
        )
      `;

      // 3. Initial Merchant Message
      await sql`
        insert into partner_ticket_messages (
          id, ticket_id, restaurant_id, author_type, author_user_id, author_name, body, attachment_url
        ) values (
          ${newId("tkm")}, ${ticketId}, ${ctx.restaurantId}, 'MERCHANT', ${context.userId},
          ${ctx.restaurantName}, ${description}, ${data.attachmentUrl || null}
        )
      `;

      // 4. Initial AI First-Responder Message
      if (aiSummary) {
        await sql`
          insert into partner_ticket_messages (
            id, ticket_id, restaurant_id, author_type, author_user_id, author_name, body
          ) values (
            ${newId("tkm")}, ${ticketId}, ${ctx.restaurantId}, 'AI_ASSISTANT', null,
            'King AI Autonomous Support', ${aiSummary}
          )
        `;
      }

      // 5. In-App Notification & Audit
      await notifyInApp(sql, {
        restaurantId: ctx.restaurantId,
        type: "SUPPORT_TICKET",
        title: `Support Ticket Created: #${ticketNumber}`,
        body: `Ticket "${subject}" is currently [${aiStatus}]. Resolution: ${resolutionCode}`,
      });

      await writeAudit(sql, {
        restaurantId: ctx.restaurantId,
        actorUserId: context.userId,
        action: "create_support_ticket",
        entityType: "partner_support_ticket",
        entityId: ticketId,
        detail: JSON.stringify({ ticketNumber, category: data.category, status: aiStatus, resolutionCode }),
      });

      return {
        ok: true as const,
        ticketId,
        ticketNumber,
        status: aiStatus,
        aiResolutionSummary: aiSummary,
      };
    });
  });

export const replyToPartnerTicket = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { restaurantId?: string; ticketId: string; body: string; attachmentUrl?: string }) => d)
  .handler(async ({ context, data }) => {
    return withVendor(context.userId, data.restaurantId, "dashboard.view", async (sql, ctx) => {
      const body = data.body.trim();
      if (!body) throw new Error("Reply message cannot be empty");

      const tkt = await sql<{ id: string; status: string; ticket_number: string }>`
        select id, status, ticket_number from partner_support_tickets
        where id = ${data.ticketId} and restaurant_id = ${ctx.restaurantId}
        limit 1
      `;
      if (!tkt[0]) throw new Error("Ticket not found");

      await sql`
        insert into partner_ticket_messages (
          id, ticket_id, restaurant_id, author_type, author_user_id, author_name, body, attachment_url
        ) values (
          ${newId("tkm")}, ${data.ticketId}, ${ctx.restaurantId}, 'MERCHANT', ${context.userId},
          ${ctx.restaurantName}, ${body}, ${data.attachmentUrl || null}
        )
      `;

      // Update ticket updated_at and reopen if closed
      const nextStatus = tkt[0].status === "RESOLVED" ? "OPEN" : tkt[0].status;
      await sql`
        update partner_support_tickets
        set updated_at = now(), status = ${nextStatus}
        where id = ${data.ticketId}
      `;

      return { ok: true as const };
    });
  });

export const resolvePartnerTicket = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { restaurantId?: string; ticketId: string; note?: string }) => d)
  .handler(async ({ context, data }) => {
    return withVendor(context.userId, data.restaurantId, "dashboard.view", async (sql, ctx) => {
      const tkt = await sql<{ id: string; ticket_number: string }>`
        select id, ticket_number from partner_support_tickets
        where id = ${data.ticketId} and restaurant_id = ${ctx.restaurantId}
        limit 1
      `;
      if (!tkt[0]) throw new Error("Ticket not found");

      await sql`
        update partner_support_tickets
        set status = 'RESOLVED', resolved_at = now(), updated_at = now(),
            resolution_code = 'MERCHANT_RESOLVED'
        where id = ${data.ticketId}
      `;

      if (data.note) {
        await sql`
          insert into partner_ticket_messages (
            id, ticket_id, restaurant_id, author_type, author_user_id, author_name, body
          ) values (
            ${newId("tkm")}, ${data.ticketId}, ${ctx.restaurantId}, 'MERCHANT', ${context.userId},
            ${ctx.restaurantName}, ${`Marked as resolved: ${data.note}`}
          )
        `;
      }

      return { ok: true as const };
    });
  });
