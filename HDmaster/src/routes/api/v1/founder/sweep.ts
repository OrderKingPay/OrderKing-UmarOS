import { createAPIFileRoute } from "@tanstack/react-start/api";

import { getSql } from "@/lib/db";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const APIRoute = createAPIFileRoute("/api/v1/founder/sweep")({
  POST: async () => {
    try {
      const providerEnabled = process.env.FOUNDER_PAYOUT_PROVIDER_ENABLED === "true";
      const providerConfigured =
        Boolean(process.env.FOUNDER_PAYOUT_PROVIDER) &&
        Boolean(process.env.FOUNDER_PAYOUT_ACCOUNT_ID);

      if (!providerEnabled || !providerConfigured) {
        return json(
          {
            success: false,
            status: "PENDING_EXTERNAL_PROVIDER",
            message:
              "Founder payout is not enabled. Configure and verify a real payout provider and destination before funds can be transferred.",
          },
          503,
        );
      }

      // Provider execution is deliberately not inferred from ledger totals.
      // Until the real provider adapter is wired, never mark orders settled
      // and never claim money reached a bank account.
      const sql = await getSql();
      const result = await sql<{ platform_revenue: number }>`
        SELECT COALESCE(SUM(total_paise), 0) AS platform_revenue
        FROM orders
        WHERE status = "DELIVERED"
      `;

      const revenuePaise = Number(result[0]?.platform_revenue ?? 0);
      return json(
        {
          success: false,
          status: "PENDING_EXTERNAL_PROVIDER",
          availablePaise: revenuePaise,
          message:
            "A real founder payout provider is required before any transfer or settlement state change can occur.",
        },
        503,
      );
    } catch (error) {
      console.error("Founder payout preflight failed:", error);
      return json({ success: false, error: "Founder payout preflight failed" }, 500);
    }
  },
});
