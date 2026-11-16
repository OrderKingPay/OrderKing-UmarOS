import { createAPIFileRoute } from "@/lib/createAPIFileRoute";
import { getSessionUser } from "@/lib/auth/verify.server";
import { getSql } from '@/lib/db';

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'FOUNDER', 'ADMIN']);

export const APIRoute = createAPIFileRoute('/api/finance/escalations')({
  GET: async () => {
    try {
      const sessionUser = await getSessionUser();
      if (!sessionUser?.id) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const { isAuthorizedAdmin } = await import("@/lib/orderking/server/workspace.server");
      if (!(await isAuthorizedAdmin(sessionUser.id, sessionUser.email))) {
        return new Response(JSON.stringify({ error: 'Forbidden: Admin or Founder role required' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Fetch all settlement batches that were escalated during reconciliation.
      const sql = await getSql();
      const escalated = await sql`
        SELECT 
          batch_id, entity_id, entity_type, 
          gross_amount_paise, deductions_paise, commission_paise, 
          net_payout_paise, state, notes, created_at
        FROM settlement_batches
        WHERE state LIKE 'ESCALATED_%'
        ORDER BY created_at DESC
        LIMIT 50
      `;
      
      return new Response(JSON.stringify(escalated), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error: any) {
      console.error("[ESCALATION API FATAL]:", error);
      return new Response(JSON.stringify([]), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});


