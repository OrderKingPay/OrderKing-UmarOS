// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { runAlgorithmicAutoDispatch } from "@/lib/orderking/server/auto-dispatch-engine.server";

// @ts-ignore: Router tree is generated during build
export const Route = createFileRoute("/api/zomato-killer-cron")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new Response("Unauthorized", { status: 401 });
          }

          const result = await runAlgorithmicAutoDispatch();
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err: any) {
          console.error("Zomato Killer Cron Error:", err);
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
