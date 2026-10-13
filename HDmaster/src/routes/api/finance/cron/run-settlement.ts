import { createAPIFileRoute } from "@/lib/createAPIFileRoute";
import { getSessionUser } from "@/lib/auth/verify.server";
import { getSql } from "@/lib/db";
import { AutoSettlementEngine } from '../../../../lib/orderking/finance/auto-settlement-engine';

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
 * AUTOMATED WEEKLY SETTLEMENT CRON ENDPOINT
 * Triggered on schedule every Monday at 2:00 AM (0 2 * * 1) or by an authenticated administrator.
 */
export const APIRoute = createAPIFileRoute('/api/finance/cron/run-settlement')({
  GET: async ({ request }: any) => {
    try {
      const authorized = await isAuthorizedCronOrAdmin(request);
      if (!authorized) {
        return new Response(
          JSON.stringify({ success: false, message: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      console.log("[CRON] Initiating Weekly Auto-Settlement Reconciliation Engine...");
      
      const result = await AutoSettlementEngine.runGlobalWeeklyReconciliation();
      
      console.log(`[CRON SUCCESS] Cycle: ${result.cycle}. Processed: ${result.processed}. Escalated: ${result.escalated}.`);
      
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error: any) {
      console.error("[CRON FATAL] Auto-Settlement Engine error:", error);
      return new Response(JSON.stringify({ success: false, message: 'CRON Error', error: error?.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});


