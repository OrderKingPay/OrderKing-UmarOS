import { createFileRoute } from "@tanstack/react-router";
import { runAlgorithmicAutoDispatch } from "../../../../lib/orderking/server/auto-dispatch-engine.server";

export const Route = createFileRoute("/api/dispatch/cron/run-auto-dispatch")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        const internalSecret = process.env.CRON_SECRET?.trim();
        if (!internalSecret || authHeader !== `Bearer ${internalSecret}`) {
          return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        try {
          const result = await runAlgorithmicAutoDispatch();
          return Response.json({ success: true, ...result });
        } catch (error) {
          console.error("[CRON][DISPATCH] failed:", error);
          return Response.json({ success: false, message: "Auto-dispatch failed." }, { status: 500 });
        }
      },
    },
  },
});
