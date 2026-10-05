import { createFileRoute } from "@tanstack/react-router";
import { runAlgorithmicAutoDispatch } from "../../../../lib/orderking/server/auto-dispatch-engine.server";

export const Route = createFileRoute("/api/dispatch/cron/run-auto-dispatch")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        const isCloudflareCron = request.headers.get("x-cloudflare-cron") === "1";
        if (!isCloudflareCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
          return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }
        try {
          const result = await runAlgorithmicAutoDispatch();
          return Response.json({ success: true, ...result });
        } catch (error) {
          console.error("[CRON] Auto dispatch failed", error);
          return Response.json({ success: false, message: "CRON Error" }, { status: 500 });
        }
      },
    },
  },
});
