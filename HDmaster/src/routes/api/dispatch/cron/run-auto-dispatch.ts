import { createFileRoute } from '@tanstack/react-router';
import { runAlgorithmicAutoDispatch } from '../../../../lib/orderking/server/auto-dispatch-engine.server';

export const Route = createFileRoute('/api/dispatch/cron/run-auto-dispatch')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env.CRON_SECRET;
        if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        try {
          const result = await runAlgorithmicAutoDispatch();
          return Response.json({ success: true, ...result });
        } catch (error: unknown) {
          console.error('[Auto-dispatch] failed:', error);
          return Response.json(
            { success: false, message: error instanceof Error ? error.message : 'Auto-dispatch failed' },
            { status: 500 },
          );
        }
      },
    },
  },
});
