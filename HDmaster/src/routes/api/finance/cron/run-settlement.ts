import { createAPIFileRoute } from "@/lib/createAPIFileRoute";
import { getSessionUser } from "@/lib/auth/verify.server";
import { getSql } from "@/lib/db";
import { AutoSettlementEngine } from "../../../../lib/orderking/finance/auto-settlement-engine";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "FOUNDER", "ADMIN"]);

async function isAuthorizedCronOrAdmin(request: Request): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET?.trim() ?? "";
  const authHeader = request.headers.get("authorization") ?? "";

  if (cronSecret.length >= 16 && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Also support Umar OS master key
  const umarKey = process.env.UMAR_OS_MASTER_KEY?.trim() ?? "";
  if (umarKey && authHeader === `Bearer ${umarKey}`) {
    return true;
  }

  const sessionUser = await getSessionUser();
  if (!sessionUser?.id) {
    return false;
  }

  const sql = await getSql();
  const rows = await sql<{ role: string }>`
    SELECT role FROM users WHERE id = ${sessionUser.id} LIMIT 1
  `;
  const role = String(rows[0]?.role ?? "").toUpperCase();
  return ADMIN_ROLES.has(role);
}

async function handleRunSettlement(request: Request) {
  const authorized = await isAuthorizedCronOrAdmin(request);
  if (!authorized) {
    return new Response(
      JSON.stringify({ success: false, message: "Unauthorized. Valid CRON_SECRET, UMAR_OS_MASTER_KEY or Admin session required." }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") || "daily_t1";

  console.log(`[UMAR OS CRON] Initiating ${mode.toUpperCase()} Auto-Settlement & RazorpayX Disbursement Engine...`);

  let result: any;
  if (mode === "weekly") {
    result = await AutoSettlementEngine.runGlobalWeeklyReconciliation();
  } else {
    // Standard T+1 Daily Automated Payouts with automatic RazorpayX disbursement
    result = await AutoSettlementEngine.runGlobalDailyTPlus1Settlement(new Date(), true);
  }

  console.log(`[UMAR OS CRON SUCCESS] Cycle: ${result.cycle}. Processed: ${result.processed}. Disbursed: ₹${((result.totalDisbursedPaise || 0) / 100).toFixed(2)}.`);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * 👑 AUTOMATED T+1 DAILY SETTLEMENT & DISBURSEMENT CRON ENDPOINT
 * Triggered automatically by Umar OS scheduler every morning (0 10 * * *)
 * or 1-tap by authenticated Founder/Admin.
 */
export const APIRoute = createAPIFileRoute("/api/finance/cron/run-settlement")({
  GET: async ({ request }: any) => {
    try {
      return await handleRunSettlement(request);
    } catch (error: any) {
      console.error("[CRON FATAL] Auto-Settlement Engine error:", error);
      return new Response(JSON.stringify({ success: false, message: "CRON Error", error: error?.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
  POST: async ({ request }: any) => {
    try {
      return await handleRunSettlement(request);
    } catch (error: any) {
      console.error("[CRON FATAL] Auto-Settlement Engine error:", error);
      return new Response(JSON.stringify({ success: false, message: "CRON Error", error: error?.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});
