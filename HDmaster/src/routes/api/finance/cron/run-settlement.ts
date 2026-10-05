// @ts-nocheck
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { AutoSettlementEngine } from '../../../../lib/orderking/finance/auto-settlement-engine';

/**
 * Cloudflare-safe internal settlement job endpoint.
 * A Cloudflare Worker Cron Trigger calls this route with CRON_SECRET.
 */
export const APIRoute = createAPIFileRoute('/api/finance/cron/run-settlement')({
  GET: async ({ request }: { request: Request }) => {
    try {
      // Basic security to ensure this is triggered by Cloudflare Cron or Admin
      const authHeader = request.headers.get('authorization');
// Cloudflare Cron injects this
      
      if (!authHeader || !process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), { status: 401 });
      }

      console.log("[CRON] Initiating AI Zomato-Style Auto-Settlement Engine...");
      
      const result = await AutoSettlementEngine.runGlobalWeeklyReconciliation();
      
      console.log(`[CRON SUCCESS] Cycle: ${result.cycle}. Processed: ${result.processed}. Escalated: ${result.escalated}.`);
      
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error: any) {
      console.error("[CRON FATAL] Auto-Settlement Engine crashed:", error);
      return new Response(JSON.stringify({ success: false, message: 'CRON Error', error: error?.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});
