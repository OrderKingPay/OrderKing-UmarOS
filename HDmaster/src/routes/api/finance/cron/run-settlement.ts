import { createFileRoute } from "@tanstack/react-router";
import { AutoSettlementEngine } from "../../../../lib/orderking/finance/auto-settlement-engine";

export const Route = createFileRoute("/api/finance/cron/run-settlement")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        const internalSecret = process.env.CRON_SECRET?.trim();
        if (!internalSecret || authHeader !== `Bearer ${internalSecret}`) {
          return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        try {
          const result = await AutoSettlementEngine.runGlobalWeeklyReconciliation();
          return Response.json(result);
        } catch (error) {
          console.error("[CRON][SETTLEMENT] failed:", error);
          return Response.json({ success: false, message: "Settlement reconciliation failed." }, { status: 500 });
        }
      },
    },
  },
});
