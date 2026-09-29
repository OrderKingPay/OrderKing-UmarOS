import { createAPIFileRoute } from "@tanstack/react-start/api";
import { runAlgorithmicAutoDispatch } from "@/lib/orderking/server/auto-dispatch-engine.server.ts";

export const APIRoute = createAPIFileRoute("/api/zomato-killer-cron")({
  POST: async ({ request }) => {
    try {
      // Basic security check (e.g. cron secret in production)
      const authHeader = request.headers.get("Authorization");
      if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
});
