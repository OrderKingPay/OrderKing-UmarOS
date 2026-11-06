import { createFileRoute } from "@tanstack/react-router";
import { getSessionUser } from "@/lib/auth/verify.server";
import { getSql } from "@/lib/db";
import { TPlus1NodalPayoutProcessor } from "@/lib/orderking/finance/tplus1-nodal-payout-processor";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "FOUNDER", "ADMIN"]);

async function isAuthorizedCronOrAdmin(request: Request): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET?.trim() ?? "";
  const authHeader = request.headers.get("authorization") ?? "";

  if (cronSecret.length >= 16 && authHeader === `Bearer ${cronSecret}`) {
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

export const Route = createFileRoute("/api/payouts/t-plus-1-cron")({
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const authorized = await isAuthorizedCronOrAdmin(request);
          if (!authorized) {
            return new Response(
              JSON.stringify({ error: "Unauthorized" }),
              { status: 401, headers: { "Content-Type": "application/json" } }
            );
          }

          const url = new URL(request.url);
          const autoDisburseParam = url.searchParams.get("autoDisburse");
          const autoDisburse = autoDisburseParam !== "false";

          const summary = await TPlus1NodalPayoutProcessor.runTPlus1NodalPayoutProcessor({
            autoDisburse,
          });

          return new Response(
            JSON.stringify({
              success: true,
              summary,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (error: any) {
          console.error("[T+1 Cron] Execution failed:", error);
          return new Response(
            JSON.stringify({
              success: false,
              error: error?.message || "Internal server error during T+1 payout cron",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
      GET: async ({ request }: any) => {
        try {
          const authorized = await isAuthorizedCronOrAdmin(request);
          if (!authorized) {
            return new Response(
              JSON.stringify({ error: "Unauthorized" }),
              { status: 401, headers: { "Content-Type": "application/json" } }
            );
          }

          // Dry run preview of T+1 payouts without disbursement
          const summary = await TPlus1NodalPayoutProcessor.runTPlus1NodalPayoutProcessor({
            autoDisburse: false,
          });

          return new Response(
            JSON.stringify({
              success: true,
              dryRun: true,
              summary,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (error: any) {
          return new Response(
            JSON.stringify({
              success: false,
              error: error?.message || "Internal error fetching T+1 payout summary",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
