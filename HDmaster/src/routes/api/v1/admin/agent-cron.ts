import { createAPIFileRoute } from "@/lib/createAPIFileRoute";
import { AgentExecutorEngine } from "@/lib/orderking/ai/agent-executor.server";

/**
 * 👑 AI Workforce Cron Endpoint
 * Hit by Vercel/Cloudflare CRON trigger to awaken the multi-agent engine.
 * Authorizes via CRON_SECRET, x-vercel-cron header, or Founder session.
 */
export const APIRoute = createAPIFileRoute('/api/v1/admin/agent-cron')({
  GET: async ({ request }: any) => {
    try {
      const authHeader = request.headers.get('authorization');
      const isVercelCron = request.headers.get('x-vercel-cron') === '1';
      const cookieHeader = request.headers.get('cookie') || '';
      
      // Basic check for Founder session (can be expanded based on actual session architecture)
      const isFounder = cookieHeader.includes('founder_session') || cookieHeader.includes('admin_token');

      // 4. Authorize request before triggering queue
      if (!isVercelCron && authHeader !== `Bearer ${process.env.CRON_SECRET}` && !isFounder) {
        return new Response(JSON.stringify({ success: false, message: 'Unauthorized. Valid CRON secret or Founder session required.' }), { status: 401 });
      }

      console.log("[CRON] Awaking AgentExecutorEngine for queue processing...");
      
      const engine = new AgentExecutorEngine();
      let processedCount = 0;
      let hasMore = true;
      
      // We process a finite batch to prevent serverless function timeouts.
      // E.g., Vercel hobby limits to 10s or 60s, Pro limits to 5m.
      const MAX_TASKS_PER_CRON = 20;

      while (hasMore && processedCount < MAX_TASKS_PER_CRON) {
        hasMore = await engine.processNextPendingTask();
        if (hasMore) {
          processedCount++;
        }
      }

      console.log(`[CRON SUCCESS] Agent executor processed ${processedCount} tasks.`);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Agent queue processed successfully', 
        processedCount,
        hasMorePending: hasMore
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error: any) {
      console.error("[CRON FATAL] AgentExecutorEngine crashed during processing:", error);
      return new Response(JSON.stringify({ success: false, message: 'CRON Error', error: error?.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});
