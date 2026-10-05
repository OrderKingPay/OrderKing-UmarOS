import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";

const json = (body: unknown, status = 200) =>
  Response.json(body, { status });

export const Route = createFileRoute("/api/v1/founder/sweep")({
  server: {
    handlers: {
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
                  "Founder payout is not enabled. Configure and verify a real payout provider and destination before any transfer.",
              },
              503,
            );
          }

          const sql = await getSql();
          const result = await sql<{ platform_revenue: number }>`
            SELECT COALESCE(SUM(total_paise), 0) AS platform_revenue
            FROM orders
            WHERE status = 'DELIVERED'
          `;

          const availablePaise = Number(result[0]?.platform_revenue ?? 0);
          return json(
            {
              success: false,
              status: "PENDING_EXTERNAL_PROVIDER",
              availablePaise,
              message:
                "Provider adapter execution is not connected; no transfer or settlement state change occurred.",
            },
            503,
          );
        } catch (error) {
          console.error("Founder payout preflight failed:", error);
          return json({ success: false, error: "Founder payout preflight failed" }, 500);
        }
      },
    },
  },
});
