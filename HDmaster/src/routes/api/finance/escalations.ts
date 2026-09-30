// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/finance/escalations")({
  // @ts-expect-error
  server: {
    handlers: {
      GET: async () => {
        try {
          const { requireUserId } = await import("@/lib/auth/verify.server");
          const { ensureWorkspace } = await import("@/lib/orderking/server/workspace.server");
          const { getSql } = await import("@/lib/db");
          const userId = await requireUserId();
          const ws = await ensureWorkspace(userId);
          if (!ws.ctx.permissions.includes("view_finance")) return Response.json({ error: "FORBIDDEN" }, { status: 403 });

          const sql = await getSql();
          const escalated = await sql`
            SELECT batch_id, entity_id, entity_type, gross_amount_paise, deductions_paise,
                   commission_paise, net_payout_paise, state, notes, created_at
            FROM settlement_batches
            WHERE state LIKE 'ESCALATED_%'
            ORDER BY created_at DESC
            LIMIT 50
          `;
          return Response.json(escalated);
        } catch (error: any) {
          console.error("[ESCALATION API]:", error);
          return Response.json({ error: "Failed to load escalation queue." }, { status: 500 });
        }
      },
    },
  },
});
