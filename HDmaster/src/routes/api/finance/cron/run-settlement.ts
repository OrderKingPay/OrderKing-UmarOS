import { createAPIFileRoute } from '@tanstack/react-start/api';
import { AutoSettlementEngine } from '../../../../lib/orderking/finance/auto-settlement-engine';

/**
 * 👑 AI ZOMATO-STYLE SETTLEMENT CRON ENDPOINT
 * Scheduled execution must be provided by an authorized Cloudflare Worker/cron caller.
 */
export const APIRoute = createAPIFileRoute('/api/finance/cron/run-settlement')({
  GET: async ({ request }) => {
    try {
      // Cloudflare Worker/cron or an authorized internal caller must provide the shared secret.
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
