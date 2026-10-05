import { createFileRoute } from '@tanstack/react-router';
import { getSql } from '../../../../lib/db';

export const Route = createFileRoute('/api/finance/escalations')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env.CRON_SECRET;
        if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        try {
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

          return Response.json({ success: true, data: escalated });
        } catch (error) {
          console.error('[ESCALATION API FATAL]:', error);
          return Response.json({ success: false, message: 'Internal server error' }, { status: 500 });
        }
      },
    },
  },
});
