import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";

// @ts-ignore: Router tree is generated during build
export const Route = createFileRoute("/api/v1/founder/sweep")({
  server: {
    handlers: {
      POST: async () => {
        const enabled = process.env.FOUNDER_PAYOUT_PROVIDER_ENABLED === "true";
        const configured = Boolean(process.env.FOUNDER_PAYOUT_PROVIDER) && Boolean(process.env.FOUNDER_PAYOUT_ACCOUNT_ID);
        if (!enabled || !configured) {
          return Response.json({
            success: false,
            status: "PENDING_EXTERNAL_PROVIDER",
            message: "Founder payout is disabled until a verified payout provider and destination are configured.",
          }, { status: 503 });
        }
        const sql = await getSql();
        const result = await sql<{ platform_revenue: number }>`
          SELECT COALESCE(SUM(total_paise), 0) AS platform_revenue
          FROM orders WHERE status = 'DELIVERED'
        `;
        return Response.json({
          success: false,
          status: "PENDING_PROVIDER_ADAPTER",
          availablePaise: Number(result[0]?.platform_revenue ?? 0),
          message: "Provider adapter is not connected; no funds were moved and no order state changed.",
        }, { status: 503 });
      },
    },
  },
});
