import { createFileRoute } from '@tanstack/react-router';
import { runAlgorithmicAutoDispatch } from '../../../../lib/orderking/server/auto-dispatch-engine.server';

export const Route = createFileRoute('/api/dispatch/cron/run-auto-dispatch')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const authHeader = request.headers.get('authorization');
          const secret = process.env.CRON_SECRET;
          if (!secret || authHeader !== `Bearer ${secret}`) {
            return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), { status: 401 });
          }

          const result = await runAlgorithmicAutoDispatch();

          return new Response(JSON.stringify({ success: true, ...result }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'CRON error';
          console.error('[CRON FATAL] Auto-dispatch failed:', error);
          return new Response(JSON.stringify({ success: false, message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      },
    },
  },
});
