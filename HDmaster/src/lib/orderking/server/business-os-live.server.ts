// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";
import { requireUserId } from "@/lib/auth/verify.server";
import { ensureWorkspace } from "@/lib/orderking/server/workspace.server";
import { getSql } from "@/lib/db";

export interface LiveBusinessSnapshot {
  status: "LIVE" | "DATABASE_NOT_CONFIGURED" | "QUERY_FAILED";
  measuredAt: string;
  financial: {
    period: string;
    grossMerchandiseValueInr: number;
    paidOrderCount: number;
    verifiedPlatformRevenueInr: number;
    pendingPaymentValueInr: number;
    operatingExpensesInr: number | null;
    netFounderProfitInr: number | null;
    costDataStatus: "MEASURED" | "NOT_CONFIGURED";
  };
  operations: {
    activeRestaurants: number;
    ordersLast24h: number;
    deliveredLast24h: number;
    cancelledLast24h: number;
    activeRiders: number;
  };
  workforce: {
    humanStaffCount: number;
    activeHumanStaffCount: number;
    aiTaskCount: number;
    aiRunningTaskCount: number;
  };
  leads: Array<{
    id: string;
    businessName: string;
    category: string | null;
    location: string | null;
    projectBudgetInr: number | null;
    status: string | null;
  }>;
  verification: {
    source: "POSTGRES";
    note: string;
  };
}

const unavailable = (status: "DATABASE_NOT_CONFIGURED" | "QUERY_FAILED", note: string): LiveBusinessSnapshot => ({
  status,
  measuredAt: new Date().toISOString(),
  financial: {
    period: "Unavailable",
    grossMerchandiseValueInr: 0,
    paidOrderCount: 0,
    verifiedPlatformRevenueInr: 0,
    pendingPaymentValueInr: 0,
    operatingExpensesInr: null,
    netFounderProfitInr: null,
    costDataStatus: "NOT_CONFIGURED",
  },
  operations: { activeRestaurants: 0, ordersLast24h: 0, deliveredLast24h: 0, cancelledLast24h: 0, activeRiders: 0 },
  workforce: { humanStaffCount: 0, activeHumanStaffCount: 0, aiTaskCount: 0, aiRunningTaskCount: 0 },
  leads: [],
  verification: { source: "POSTGRES", note },
});

export const getLiveBusinessSnapshot = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await requireUserId();
  const workspace = await ensureWorkspace(userId);
  if (!workspace.ctx.permissions.includes("view_analytics") && !workspace.ctx.permissions.includes("access_AI")) {
    throw new Error("ANALYTICS_PERMISSION_REQUIRED");
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return unavailable(
      "DATABASE_NOT_CONFIGURED",
      "DATABASE_URL is not configured on this deployment; no embedded or fixture database is substituted."
    );
  }

  try {
    const sql = await getSql();

    const [financial, ops, staff, tasks, leads] = await Promise.all([
      sql.query<{
        gmv: number;
        paid_orders: number;
        platform_revenue: number;
        pending: number;
      }>(
        `SELECT
          COALESCE(SUM(total_paise) FILTER (
            WHERE status = 'DELIVERED' AND placed_at >= NOW() - INTERVAL '30 days'
          ), 0) AS gmv,
          COALESCE(COUNT(*) FILTER (
            WHERE payment_status IN ('paid','PAID','PAID_WALLET','wallet_paid','captured')
              AND placed_at >= NOW() - INTERVAL '30 days'
          ), 0) AS paid_orders,
          COALESCE(SUM(amount_paise) FILTER (
            WHERE party = 'PLATFORM' AND kind = 'CREDIT' AND created_at >= NOW() - INTERVAL '30 days'
          ), 0) AS platform_revenue,
          COALESCE(SUM(total_paise) FILTER (
            WHERE payment_status IN ('pending','PENDING','pending_collection')
              AND placed_at >= NOW() - INTERVAL '30 days'
          ), 0) AS pending
        FROM orders
        LEFT JOIN ledger_entries ON ledger_entries.order_id = orders.id`,
      ),
      sql.query<{
        active_restaurants: number;
        orders_24h: number;
        delivered_24h: number;
        cancelled_24h: number;
        active_riders: number;
      }>(
        `SELECT
          (SELECT COUNT(*) FROM restaurants WHERE active = true) AS active_restaurants,
          (SELECT COUNT(*) FROM orders WHERE placed_at >= NOW() - INTERVAL '24 hours') AS orders_24h,
          (SELECT COUNT(*) FROM orders WHERE placed_at >= NOW() - INTERVAL '24 hours' AND status = 'DELIVERED') AS delivered_24h,
          (SELECT COUNT(*) FROM orders WHERE placed_at >= NOW() - INTERVAL '24 hours' AND status = 'CANCELLED') AS cancelled_24h,
          (SELECT COUNT(*) FROM riders WHERE status IN ('ONLINE','ACTIVE','available')) AS active_riders`,
      ),
      sql.query<{ human_staff: number; active_human_staff: number }>(
        `SELECT
          COUNT(*) AS human_staff,
          COUNT(*) FILTER (WHERE status IN ('ONLINE','ACTIVE','ON_DUTY')) AS active_human_staff
        FROM employees`,
      ),
      sql.query<{ total_tasks: number; running_tasks: number }>(
        `SELECT
          COUNT(*) AS total_tasks,
          COUNT(*) FILTER (WHERE state IN ('RUNNING','QUEUED')) AS running_tasks
        FROM autonomous_tasks`,
      ),
      sql.query<{
        id: string;
        business_name: string;
        category: string | null;
        location: string | null;
        project_budget: number | null;
        status: string | null;
      }>(
        `SELECT id, business_name, category, location, project_budget, status
         FROM founder_client_leads
         LIMIT 50`,
      ),
    ]);

    const f = financial[0] ?? {};
    const o = ops[0] ?? {};
    const s = staff[0] ?? {};
    const t = tasks[0] ?? {};

    return {
      status: "LIVE",
      measuredAt: new Date().toISOString(),
      financial: {
        period: "Trailing 30 days",
        grossMerchandiseValueInr: Number(f.gmv || 0) / 100,
        paidOrderCount: Number(f.paid_orders || 0),
        verifiedPlatformRevenueInr: Number(f.platform_revenue || 0) / 100,
        pendingPaymentValueInr: Number(f.pending || 0) / 100,
        operatingExpensesInr: null,
        netFounderProfitInr: null,
        costDataStatus: "NOT_CONFIGURED",
      },
      operations: {
        activeRestaurants: Number(o.active_restaurants || 0),
        ordersLast24h: Number(o.orders_24h || 0),
        deliveredLast24h: Number(o.delivered_24h || 0),
        cancelledLast24h: Number(o.cancelled_24h || 0),
        activeRiders: Number(o.active_riders || 0),
      },
      workforce: {
        humanStaffCount: Number(s.human_staff || 0),
        activeHumanStaffCount: Number(s.active_human_staff || 0),
        aiTaskCount: Number(t.total_tasks || 0),
        aiRunningTaskCount: Number(t.running_tasks || 0),
      },
      leads: (leads || []).map((lead) => ({
        id: lead.id,
        businessName: lead.business_name,
        category: lead.category,
        location: lead.location,
        projectBudgetInr: lead.project_budget == null ? null : Number(lead.project_budget),
        status: lead.status,
      })),
      verification: {
        source: "POSTGRES",
        note: "Values are read from the live production database. Expense and profit values stay unset until measured cost data is connected.",
      },
    } satisfies LiveBusinessSnapshot;
  } catch (error) {
    console.error("[live-business-snapshot]", error);
    return unavailable("QUERY_FAILED", "Live Postgres query failed; no fixture fallback was used.");
  }
});
