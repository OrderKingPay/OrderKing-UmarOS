import { createFileRoute } from '@tanstack/react-router';
import { AutoSettlementEngine } from '../../../../lib/orderking/finance/auto-settlement-engine';

export const Route = createFileRoute('/api/finance/cron/run-settlement')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env.CRON_SECRET;
        if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        try {
          const result = await AutoSettlementEngine.runGlobalWeeklyReconciliation();
          return Response.json({ success: true, result });
        } catch (error: unknown) {
          console.error('[Auto-settlement] failed:', error);
          return Response.json(
            { success: false, message: error instanceof Error ? error.message : 'Auto-settlement failed' },
            { status: 500 },
          );
        }
      },
    },
  },
});
