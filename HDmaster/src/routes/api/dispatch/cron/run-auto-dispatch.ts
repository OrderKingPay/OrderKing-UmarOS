import { createFileRoute } from "@tanstack/react-router";
import { runAlgorithmicAutoDispatch } from "../../../../lib/orderking/server/auto-dispatch-engine.server";

export const Route = createFileRoute("/api/dispatch/cron/run-auto-dispatch")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const authHeader = request.headers.get("authorization");
          const isCron = request.headers.get("x-cloudflare-cron") === "1";
          if (!isCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
          }

          const result = await runAlgorithmicAutoDispatch();

          return Response.json({ success: true, ...result });
        } catch (error) {
          console.error("[CRON FATAL] Auto Dispatch Engine failed:", error);
          return Response.json(
            { success: false, message: "CRON Error", error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 },
          );
        }
      },
    },
  },
});
