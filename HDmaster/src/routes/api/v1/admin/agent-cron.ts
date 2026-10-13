import { createAPIFileRoute } from "@/lib/createAPIFileRoute";
import { AgentExecutorEngine } from "@/lib/orderking/ai/agent-executor.server";
import { getSessionUser } from "@/lib/auth/verify.server";
import { getSql } from "@/lib/db";

/**
 * 👑 AI Workforce Cron Endpoint
 * Authorizes strictly via process.env.CRON_SECRET Bearer token or verified Founder/Admin session.
 */
export const APIRoute = createAPIFileRoute('/api/v1/admin/agent-cron')({
  GET: async ({ request }: any) => {
    try {
      const authHeader = request.headers.get('authorization');
      const cronSecret = process.env.CRON_SECRET?.trim();
      const hasValidCronSecret = Boolean(cronSecret && cronSecret.length >= 16 && authHeader === `Bearer ${cronSecret}`);

      let isVerifiedFounder = false;
      if (!hasValidCronSecret) {
        const session = await getSessionUser();
        if (session?.id) {
          const sql = await getSql();
          const rows = await sql`SELECT role FROM users WHERE id = ${session.id} LIMIT 1`;
          const role = rows.length > 0 ? String((rows[0] as any).role || "").toUpperCase() : "";
          isVerifiedFounder = ["SUPER_ADMIN", "FOUNDER", "ADMIN"].includes(role);
        }
      }

      if (!hasValidCronSecret && !isVerifiedFounder) {
        return new Response(
          JSON.stringify({ success: false, message: 'Unauthorized. Valid CRON_SECRET or verified Founder session required.' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
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
