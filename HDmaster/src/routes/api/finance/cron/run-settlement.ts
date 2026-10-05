import { createFileRoute } from '@tanstack/react-router';
import { AutoSettlementEngine } from '../../../../lib/orderking/finance/auto-settlement-engine';

export const Route = createFileRoute('/api/finance/cron/run-settlement')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const authHeader = request.headers.get('authorization');
          const secret = process.env.CRON_SECRET;
          if (!secret || authHeader !== `Bearer ${secret}`) {
            return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), { status: 401 });
          }

          const result = await AutoSettlementEngine.runGlobalWeeklyReconciliation();

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'CRON error';
          console.error('[CRON FATAL] Auto-settlement failed:', error);
          return new Response(JSON.stringify({ success: false, message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      },
    },
  },
});
