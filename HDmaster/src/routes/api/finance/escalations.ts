import { createAPIFileRoute } from '@tanstack/react-start/api';
import { getSql } from '../../../../lib/db';

export const APIRoute = createAPIFileRoute('/api/finance/escalations')({
  GET: async ({ request }) => {
    try {
      const sql = await getSql();
      
      // Fetch all settlement batches that were escalated by the AI Engine.
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
