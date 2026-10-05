import { createFileRoute } from "@tanstack/react-router";
import { AutoSettlementEngine } from "../../../../lib/orderking/finance/auto-settlement-engine";

export const Route = createFileRoute("/api/finance/cron/run-settlement")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const authHeader = request.headers.get("authorization");
          const isCron = request.headers.get("x-cloudflare-cron") === "1";
          if (!isCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
          }

          const result = await AutoSettlementEngine.runGlobalWeeklyReconciliation();

          return Response.json(result);
        } catch (error) {
          console.error("[CRON FATAL] Auto Settlement Engine failed:", error);
          return Response.json(
            { success: false, message: "CRON Error", error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 },
          );
        }
      },
    },
  },
});
