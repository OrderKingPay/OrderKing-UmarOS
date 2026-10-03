import { createAPIFileRoute } from '@tanstack/react-start/api';
import { runAlgorithmicAutoDispatch } from '../../../../lib/orderking/server/auto-dispatch-engine.server';

/**
 * 🚀 AI STARLINK-LEVEL DISPATCH CRON ENDPOINT
 * Scheduled execution must be provided by an authorized Cloudflare Worker/cron caller.
 */
export const APIRoute = createAPIFileRoute('/api/dispatch/cron/run-auto-dispatch')({
  GET: async ({ request }) => {
    try {
      // Cloudflare Worker/cron or an authorized internal caller must provide the shared secret.
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
});
