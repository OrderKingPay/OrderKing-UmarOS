import { createFileRoute } from '@tanstack/react-router';
import { runAlgorithmicAutoDispatch } from '../../../../lib/orderking/server/auto-dispatch-engine.server';

/**
 * Dispatch cron endpoint. Cloudflare should invoke this route through its
 * configured scheduler/Worker trigger; no Vercel-specific headers are used.
 */
export const Route = createFileRoute('/api/dispatch/cron/run-auto-dispatch')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
    try {
      const authHeader = request.headers.get('authorization');
      const cronSecret = process.env.CRON_SECRET?.trim();
      if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), { status: 401 });
      }

      console.log("[CRON] Initiating AI Haversine Dispatch Engine...");
      
      const result = await runAlgorithmicAutoDispatch();
      
      if (result.assignedOrders > 0) {
        console.log(`[CRON SUCCESS] AI Auto-Assigned ${result.assignedOrders} orders. Matching matrix:`, result.matchedPairs);
      }
      
      return new Response(JSON.stringify({ success: true, ...result }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error: any) {
      console.error("[CRON FATAL] AI Dispatch Engine crashed:", error);
      return new Response(JSON.stringify({ success: false, message: 'CRON Error', error: error?.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
      }
    }
  }
});
