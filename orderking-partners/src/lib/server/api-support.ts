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
          "Logistics Protection Applied: Container spillage and transit damage are logistics liability. Your restaurant payout is protected with ₹0 deduction.";
      } else if (data.category === "PAYOUT_ISSUE" && (descLower.includes("when") || descLower.includes("timing") || descLower.includes("schedule") || descLower.includes("wednesday"))) {
        aiStatus = "RESOLVED";
        resolutionCode = "AUTO_SETTLEMENT_SCHEDULE_EXPLAINED";
        resolvedAt = new Date().toISOString();
        aiSummary =
          "Settlement Schedule: Net payable amounts accrued from delivered orders settle on a daily T+1 schedule directly into your registered bank account. Statutory deductions are limited to Section 9(5) CGST (5% restaurant tax deposited on your behalf) and Section 194-O TDS (0.1%). Check the Settlements tab for batch details.";
      } else if (data.category === "HARDWARE_POS_SYNC" && (descLower.includes("printer") || descLower.includes("kot") || descLower.includes("esc/pos"))) {
        aiStatus = "RESOLVED";
        resolutionCode = "AUTO_HARDWARE_KOT_GUIDED";
        resolvedAt = new Date().toISOString();
        aiSummary =
          "Hardware & KOT Configuration: Ensure your 80mm/58mm thermal printer is paired via Bluetooth or assigned a static IP. Navigate to Settings -> Hardware to trigger a test ticket or enable automatic KOT printing.";
      } else if (data.priority === "CRITICAL" || descLower.includes("fraud") || descLower.includes("bank account change") || descLower.includes("ifsc") || descLower.includes("legal") || descLower.includes("suspend")) {
        // High risk / critical security -> Escalate to platform operations
        aiStatus = "ESCALATED_TO_ADMIN";
        resolutionCode = "ESCALATED_CRITICAL_ADMIN_REVIEW";
        aiSummary =
          "Priority Escalation: This request requires verified platform administrative review under statutory KYC protocols. The ticket has been routed to merchant operations desk with Priority SLA.";
      } else {
        aiStatus = "OPEN";
        resolutionCode = "DIAGNOSTIC_ACTIVE";
        aiSummary =
          "Ticket received. Relevant order snapshots and financial ledger entries are being reconciled against your request.";
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
          ${aiStatus === "ESCALATED_TO_ADMIN" ? "support@orderkingpay.com" : null}
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

      // 4. Initial First-Responder Message
      if (aiSummary) {
        await sql`
          insert into partner_ticket_messages (
            id, ticket_id, restaurant_id, author_type, author_user_id, author_name, body
          ) values (
            ${newId("tkm")}, ${ticketId}, ${ctx.restaurantId}, 'AI_ASSISTANT', null,
            'Partner Support Desk', ${aiSummary}
          )
        `;
      }

      // 5. In-App Notification & Audit
      await notifyInApp(sql, {
        restaurantId: ctx.restaurantId,
        type: "SUPPORT_TICKET",
        title: `Support Ticket Created: #${ticketNumber}`,
        body: `Ticket "${subject}" has been logged [${aiStatus}].`,
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

export interface StoreDiagnosticsResult {
  restaurantId: string;
  restaurantName: string;
  currentTimeIst: string;
  isOnline: boolean;
  isEmergencyClosed: boolean;
  isOpenByHours: boolean;
  currentShiftLabel: string;
  totalItems: number;
  outOfStockCount: number;
  fssaiNumber: string | null;
  todayOrdersCount: number;
  lastOrderAt: string | null;
  city: string;
  address: string;
}

export const getStoreDiagnostics = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((d: { restaurantId?: string }) => d)
  .handler(async ({ context, data }) => {
    return withVendor(context.userId, data.restaurantId, "dashboard.view", async (sql, ctx) => {
      // 1. Restaurant Status
      const rest = await sql<{
        id: string;
        name: string;
        display_name: string | null;
        emergency_closed: boolean;
        vacation_mode: boolean;
        prep_minutes: number;
        fssai_number: string | null;
        city: string | null;
        address: string | null;
      }>`
        select id, name, display_name, emergency_closed, vacation_mode, prep_minutes, fssai_number, city, address
        from restaurants
        where id = ${ctx.restaurantId}
        limit 1
      `;
      const restaurant = rest[0];

      // 2. Items & Stock
      const itemsCount = await sql<{ total: number; active: number }>`
        select count(*)::int as total,
               count(*) filter (where is_active = true)::int as active
        from items
        where restaurant_id = ${ctx.restaurantId}
      `;
      const unavailCount = await sql<{ count: number }>`
        select count(*)::int as count
        from item_availability a
        join items i on i.id = a.item_id
        where a.restaurant_id = ${ctx.restaurantId}
          and a.status <> 'available'
      `;

      // 3. Operating Hours & Current Shift Check
      const hours = await sql<{ weekday: number; open_minutes: number; close_minutes: number }>`
        select weekday, open_minutes, close_minutes
        from restaurant_hours
        where restaurant_id = ${ctx.restaurantId}
        order by weekday, open_minutes
      `;

      // Calculate IST time (UTC + 5:30)
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const istTime = new Date(utc + 3600000 * 5.5);
      const istDay = istTime.getDay();
      const istMinutes = istTime.getHours() * 60 + istTime.getMinutes();
      const istTimeFormatted = `${String(istTime.getHours() % 12 || 12).padStart(2, "0")}:${String(istTime.getMinutes()).padStart(2, "0")} ${istTime.getHours() >= 12 ? "PM" : "AM"} IST`;

      const todayShifts = hours.filter((h) => h.weekday === istDay);
      let isOpenByHours = todayShifts.length === 0;
      let currentShiftLabel = "24×7 Active";

      if (todayShifts.length > 0) {
        isOpenByHours = todayShifts.some(
          (s) => istMinutes >= s.open_minutes && istMinutes <= s.close_minutes
        );
        const shiftStrings = todayShifts.map((s) => {
          const openH = Math.floor(s.open_minutes / 60);
          const openM = s.open_minutes % 60;
          const closeH = Math.floor(s.close_minutes / 60);
          const closeM = s.close_minutes % 60;
          const formatTime = (h: number, m: number) =>
            `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
          return `${formatTime(openH, openM)} – ${formatTime(closeH, closeM)}`;
        });
        currentShiftLabel = shiftStrings.join(", ");
      }

      // Today's orders
      const todayOrders = await sql<{ count: number; last_order_at: string | null }>`
        select count(*)::int as count,
               max(placed_at)::text as last_order_at
        from orders
        where restaurant_id = ${ctx.restaurantId}
          and placed_at >= date_trunc('day', now())
      `;

      const isEmergencyClosed = Boolean(restaurant?.emergency_closed || restaurant?.vacation_mode);
      const isOnline = !isEmergencyClosed && isOpenByHours;

      return {
        restaurantId: ctx.restaurantId,
        restaurantName: restaurant?.display_name || restaurant?.name || "Restaurant Partner",
        currentTimeIst: istTimeFormatted,
        isOnline,
        isEmergencyClosed,
        isOpenByHours,
        currentShiftLabel,
        totalItems: itemsCount[0]?.active ?? 0,
        outOfStockCount: unavailCount[0]?.count ?? 0,
        fssaiNumber: restaurant?.fssai_number ?? null,
        todayOrdersCount: todayOrders[0]?.count ?? 0,
        lastOrderAt: todayOrders[0]?.last_order_at ?? null,
        city: restaurant?.city || "Assam",
        address: restaurant?.address || "",
      };
    });
  });
