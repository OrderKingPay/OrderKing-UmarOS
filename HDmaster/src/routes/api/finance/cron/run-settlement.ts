// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/finance/cron/run-settlement")({
  // @ts-expect-error
  server: {
    handlers: {
      GET: async ({ request }: any) => {
        const cronSecret = process.env.CRON_SECRET?.trim();
        const authHeader = request.headers.get("authorization");
        const isCron = request.headers.get("x-vercel-cron") === "1";
        if (!cronSecret || (!isCron && authHeader !== `Bearer ${cronSecret}`)) {
          return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        try {
          const { AutoSettlementEngine } = await import("@/lib/orderking/finance/auto-settlement-engine");
          const result = await AutoSettlementEngine.runGlobalWeeklyReconciliation();
          return Response.json(result);
        } catch (error: any) {
          console.error("[CRON settlement]:", error);
          return Response.json({ success: false, message: "CRON error" }, { status: 500 });
        }
      },
    },
  },
});
