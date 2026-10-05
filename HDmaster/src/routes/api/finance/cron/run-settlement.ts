import { createFileRoute } from "@tanstack/react-router";
import { AutoSettlementEngine } from "../../../../lib/orderking/finance/auto-settlement-engine";

// @ts-ignore: Router tree is generated during build
export const Route = createFileRoute("/api/finance/cron/run-settlement")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        const isCloudflareCron = request.headers.get("x-cloudflare-cron") === "1";
        if (!isCloudflareCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
          return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }
        try {
          const result = await AutoSettlementEngine.runGlobalWeeklyReconciliation();
          return Response.json(result);
        } catch (error) {
          console.error("[CRON] Settlement failed", error);
          return Response.json({ success: false, message: "CRON Error" }, { status: 500 });
        }
      },
    },
  },
});
