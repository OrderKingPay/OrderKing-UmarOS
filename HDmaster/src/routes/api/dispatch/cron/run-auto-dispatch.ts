// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/dispatch/cron/run-auto-dispatch")({
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
          const { runAlgorithmicAutoDispatch } = await import("@/lib/orderking/server/auto-dispatch-engine.server");
          const result = await runAlgorithmicAutoDispatch();
          return Response.json({ success: true, ...result });
        } catch (error: any) {
          console.error("[CRON auto-dispatch]:", error);
          return Response.json({ success: false, message: "CRON error" }, { status: 500 });
        }
      },
    },
  },
});
