import { createAPIFileRoute } from "@/lib/createAPIFileRoute";
import { getSql } from "@/lib/db";
import { ensureWorkspace } from "@/lib/orderking/server/workspace.server";

export const APIRoute = createAPIFileRoute("/api/v1/loyalty")({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const customerRef = url.searchParams.get("customerRef");
      if (!customerRef) {
        return new Response(JSON.stringify({ error: "customerRef required" }), { status: 400 });
      }

      // We use service token or similar to authorize
      const authorization = request.headers.get("authorization")?.trim();
      const token = process.env.ORDERKING_SERVICE_TOKEN?.trim();
      const userId = process.env.ORDERKING_SERVICE_USER_ID?.trim();
      if (!token || !userId || authorization !== `Bearer ${token}`) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
      }

      const ws = await ensureWorkspace(userId);
      const sql = await getSql();

      const customerRows = await sql<{ 
        id: string; 
        king_coins: number; 
        current_streak: number; 
        highest_streak: number; 
        last_streak_at: string | null 
      }>`
        SELECT id, king_coins, current_streak, highest_streak, last_streak_at::text 
        FROM customers 
        WHERE org_id = ${ws.ctx.orgId} AND display_ref = ${customerRef} 
        LIMIT 1
      `;

      const customer = customerRows[0];
      if (!customer) {
        return new Response(JSON.stringify({ error: "Customer not found" }), { status: 404 });
      }

      const ledgerRows = await sql<{ 
        id: string; 
        amount: number; 
        reason: string; 
        created_at: string 
      }>`
        SELECT id, amount, reason, created_at::text 
        FROM king_coins_ledger 
        WHERE org_id = ${ws.ctx.orgId} AND customer_id = ${customer.id} 
        ORDER BY created_at DESC 
        LIMIT 20
      `;

      return new Response(JSON.stringify({ 
        data: {
          profile: {
            kingCoins: customer.king_coins,
            currentStreak: customer.current_streak,
            highestStreak: customer.highest_streak,
            lastStreakAt: customer.last_streak_at
          },
          history: ledgerRows.map(r => ({
            id: r.id,
            amount: r.amount,
            reason: r.reason,
            createdAt: r.created_at
          }))
        }
      }), {
        status: 200,
        headers: { "content-type": "application/json; charset=utf-8" }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      return new Response(JSON.stringify({ error: message }), { status: 500 });
    }
  }
});
