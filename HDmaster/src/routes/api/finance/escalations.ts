import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";

// @ts-ignore: Router tree is generated during build
export const Route = createFileRoute("/api/finance/escalations")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const sql = await getSql();
          const rows = await sql`
            SELECT batch_id, entity_id, entity_type, gross_amount_paise, deductions_paise,
                   commission_paise, net_payout_paise, state, notes, created_at
            FROM settlement_batches
            WHERE state LIKE 'ESCALATED_%'
            ORDER BY created_at DESC LIMIT 50
          `;
          return Response.json(rows);
        } catch (error) {
          console.error("[ESCALATIONS] lookup failed", error);
          return Response.json({ error: "Failed to load settlement escalations" }, { status: 500 });
        }
      },
    },
  },
});
