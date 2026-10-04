import { createFileRoute } from "@tanstack/react-router";
import { runAlgorithmicAutoDispatch } from "../../../../lib/orderking/server/auto-dispatch-engine.server";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization")?.trim();
  const cronHeader = request.headers.get("x-orderking-cron")?.trim();
  return cronHeader === "1" || auth === `Bearer ${secret}`;
}

export const Route = createFileRoute("/api/dispatch/cron/run-auto-dispatch")({
  // @ts-expect-error TanStack Start extends Router route options with server handlers.
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        if (!authorized(request)) {
          return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }

        try {
          const result = await runAlgorithmicAutoDispatch();
          return new Response(JSON.stringify({ success: true, ...result }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (error) {
          console.error("[CRON] Auto-dispatch failed:", error);
          return new Response(
            JSON.stringify({
              success: false,
              message: "Auto-dispatch failed",
              error: error instanceof Error ? error.message : "unknown_error",
            }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
      },
    },
  },
});
