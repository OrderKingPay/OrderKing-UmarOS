// @ts-nocheck
import { createFileRoute } from '@tanstack/react-router';
import { AutoSettlementEngine } from '../../../../lib/orderking/finance/auto-settlement-engine';

/**
 * Weekly settlement cron endpoint. The hosting scheduler is configured outside
 * this route; the route itself is provider-neutral and Cloudflare-compatible.
 */
export const Route = createFileRoute('/api/finance/cron/run-settlement')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
    try {
      const authHeader = request.headers.get('authorization');
      const cronSecret = process.env.CRON_SECRET?.trim();
      if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
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
    }
  }
});
