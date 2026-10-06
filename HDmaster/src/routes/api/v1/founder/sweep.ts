// @ts-nocheck
import { createAPIFileRoute } from "@tanstack/react-start/api";

import { getSql } from "@/lib/db";

export const APIRoute = createAPIFileRoute("/api/v1/founder/sweep")({
  POST: async () => {
    try {
      const sql = await getSql();
      const result = await sql`
        SELECT COALESCE(SUM(restaurant_payable_paise), 0) as payable_paise
        FROM orders
        WHERE status = "DELIVERED"
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
  },
});
