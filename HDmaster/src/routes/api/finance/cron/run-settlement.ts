import { createFileRoute } from "@tanstack/react-router";
import { AutoSettlementEngine } from '../../../../lib/orderking/finance/auto-settlement-engine';

/**
 * 👑 AI ZOMATO-STYLE SETTLEMENT CRON ENDPOINT
 * Triggered automatically by Vercel every Monday at 2:00 AM (0 2 * * 1).
 */
// @ts-expect-error TanStack regenerates routeTree.gen.ts during the Vite build; direct tsc runs before that refresh.
export const Route = createFileRoute("/api/finance/cron/run-settlement")({
  GET: async ({ request }: { request: Request }) => {
    try {
      // Basic security to ensure this is triggered by Vercel Cron or Admin
      const authHeader = request.headers.get('authorization');
      const isCron = request.headers.get('x-vercel-cron') === '1'; // Vercel Cron injects this
      
      if (!isCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
