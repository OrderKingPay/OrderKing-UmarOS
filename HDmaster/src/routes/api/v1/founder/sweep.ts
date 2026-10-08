import { createFileRoute } from "@tanstack/react-router";
import { checkRateLimit } from "@/lib/orderking/security/rate-limiter";
import { getSql } from "@/lib/db";

export const Route = createFileRoute("/api/v1/founder/sweep")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const ip = request?.headers?.get('x-forwarded-for') || '127.0.0.1';
          const rl = checkRateLimit(ip, 100, 60000);
          if (!rl.allowed) {
            return new Response('Too Many Requests', { status: 429 });
          }

          const sql = await getSql();
          const result = await sql`
            SELECT COALESCE(SUM(restaurant_payable_paise), 0) as payable_paise
            FROM orders
            WHERE status = 'DELIVERED'
          `;
          const payablePaise = Number(result[0]?.payable_paise || 0);

          return new Response(
            JSON.stringify({
              success: false,
              status: "PROVIDER_REQUIRED",
              payablePaise,
              message:
                "No funds are reported as transferred. A real payout provider, verified destination, authorization and settlement evidence are required before a founder sweep can execute.",
            }),
            {
              status: 409,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            },
          );
        } catch (error) {
          console.error("Failed to inspect founder sweep eligibility:", error);
          return new Response(
            JSON.stringify({ success: false, error: "Failed to inspect sweep eligibility" }),
            { status: 500 },
          );
        }
      }
    }
  }
});
