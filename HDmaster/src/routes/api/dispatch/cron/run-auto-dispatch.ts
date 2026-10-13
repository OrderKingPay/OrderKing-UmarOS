import { createAPIFileRoute } from "@/lib/createAPIFileRoute";
import { getSessionUser } from "@/lib/auth/verify.server";
import { getSql } from "@/lib/db";
import { runAlgorithmicAutoDispatch } from '../../../../lib/orderking/server/auto-dispatch-engine.server';

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'FOUNDER', 'ADMIN']);

async function isAuthorizedCronOrAdmin(request: Request): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET?.trim() ?? '';
  const authHeader = request.headers.get('authorization') ?? '';

  if (cronSecret.length >= 16 && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  const sessionUser = await getSessionUser();
  if (!sessionUser?.id) {
    return false;
  }

  const sql = await getSql();
  const rows = await sql<{ role: string }>`
    SELECT role FROM users WHERE id = ${sessionUser.id} LIMIT 1
  `;
  const role = String(rows[0]?.role ?? '').toUpperCase();
  return ADMIN_ROLES.has(role);
}

/**
 * AUTOMATED DISPATCH CRON ENDPOINT
 * Triggered on schedule (* * * * *) or by an authenticated administrator.
 */
export const APIRoute = createAPIFileRoute('/api/dispatch/cron/run-auto-dispatch')({
  GET: async ({ request }: any) => {
    try {
      const authorized = await isAuthorizedCronOrAdmin(request);
      if (!authorized) {
        return new Response(
          JSON.stringify({ success: false, message: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      console.log("[CRON] Initiating Haversine Dispatch Engine...");
      
      const result = await runAlgorithmicAutoDispatch();
      
      if (result.assignedOrders > 0) {
        console.log(`[CRON SUCCESS] Assigned ${result.assignedOrders} orders. Matching matrix:`, result.matchedPairs);
      }
      
      return new Response(JSON.stringify({ success: true, ...result }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error: any) {
      console.error("[CRON FATAL] Dispatch Engine error:", error);
      return new Response(JSON.stringify({ success: false, message: 'CRON Error', error: error?.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});


