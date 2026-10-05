// @ts-nocheck
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { AutoSettlementEngine } from "../../../../lib/orderking/finance/auto-settlement-engine";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization")?.trim();
  const cronHeader = request.headers.get("x-orderking-cron")?.trim();
  return cronHeader === "1" || auth === `Bearer ${secret}`;
}

export const Route = createAPIFileRoute("/api/finance/cron/run-settlement")({
  GET: async ({ request }) => {
    if (!authorized(request)) {
      return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), {
        status: 401, headers: { "content-type": "application/json" },
      });
    }
    try {
      const result = await AutoSettlementEngine.runGlobalWeeklyReconciliation();
      return new Response(JSON.stringify(result), {
        status: 200, headers: { "content-type": "application/json" },
      });
    } catch (error) {
      console.error("[CRON] Settlement failed:", error);
      return new Response(JSON.stringify({
        success: false,
        message: "Settlement failed",
        error: error instanceof Error ? error.message : "unknown_error",
      }), { status: 500, headers: { "content-type": "application/json" } });
    }
  },
});
