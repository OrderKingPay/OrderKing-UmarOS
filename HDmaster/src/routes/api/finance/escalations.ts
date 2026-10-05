// @ts-nocheck
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { getSql } from "../../../lib/db";

export const Route = createAPIFileRoute("/api/finance/escalations")({
  GET: async ({ request }) => {
    const secret = process.env.CRON_SECRET?.trim();
    const auth = request.headers.get("authorization")?.trim();
    if (!secret || auth !== `Bearer ${secret}`) {
      return new Response(JSON.stringify([]), {
        status: 401, headers: { "content-type": "application/json" },
      });
    }
    try {
      const sql = await getSql();
      const escalated = await sql`
        SELECT batch_id, entity_id, entity_type,
               gross_amount_paise, deductions_paise, commission_paise,
               net_payout_paise, state, notes, created_at
        FROM settlement_batches
        WHERE state LIKE 'ESCALATED_%'
        ORDER BY created_at DESC
        LIMIT 50
      `;
      return new Response(JSON.stringify(escalated), {
        status: 200, headers: { "content-type": "application/json" },
      });
    } catch (error) {
      console.error("[ESCALATION API] failed:", error);
      return new Response(JSON.stringify([]), {
        status: 500, headers: { "content-type": "application/json" },
      });
    }
  },
});
