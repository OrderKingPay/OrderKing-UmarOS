import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { VendorShell } from "@/components/vendor-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/use-t";
import { useVendor } from "@/components/use-vendor";
import {
  acceptOrder,
  getDashboard,
  listOrders,
  markPreparing,
  markReady,
  quickThrottleKitchen,
  rejectOrder,
} from "@/lib/server/api-orders";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useKitchenRushStore } from "@/lib/orders/kitchen-rush";
import { FssaiExpiryBanner } from "@/components/fssai-expiry-banner";
import { DailyPerformanceLedgerCard } from "@/components/dashboard/daily-performance-ledger-card";
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  ChefHat,
  ClipboardList,
  Clock,
  Cpu,
  Flame,
  PauseCircle,
  PlayCircle,
  Settings,
  ShieldCheck,
  Star,
  Store,
  TrendingUp,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const t = useT();
  const vendor = useVendor();
  const qc = useQueryClient();
  const [throttleBusy, setThrottleBusy] = useState<string | null>(null);
  const [throttleMsg, setThrottleMsg] = useState<string | null>(null);
  const [orderActionBusy, setOrderActionBusy] = useState<string | null>(null);

  const dash = useQuery({
    queryKey: ["dashboard", vendor.restaurantId],
    queryFn: () => getDashboard({ data: { restaurantId: vendor.restaurantId } }),
    enabled: Boolean(vendor.restaurantId),
    refetchInterval: 8000,
  });

  const liveOrdersQ = useQuery({
    queryKey: ["orders", vendor.restaurantId, "live"],
    queryFn: () => listOrders({ data: { restaurantId: vendor.restaurantId, scope: "live" } }),
    enabled: Boolean(vendor.restaurantId),
    refetchInterval: 8000,
  });

  async function handleThrottle(mode: "NORMAL" | "RUSH" | "PAUSE" | "RESUME") {
    if (!vendor.restaurantId) return;
    setThrottleBusy(mode);
    setThrottleMsg(null);
    try {
      await quickThrottleKitchen({
        data: { restaurantId: vendor.restaurantId, mode },
      });
      if (mode === "RUSH") {
        useKitchenRushStore.getState().activate(15);
        if (typeof window !== "undefined") {
          localStorage.setItem("ok_kitchen_paused", "false");
        }
      } else if (mode === "NORMAL") {
        useKitchenRushStore.getState().deactivate();
        if (typeof window !== "undefined") {
          localStorage.setItem("ok_kitchen_paused", "false");
        }
      } else if (mode === "PAUSE") {
        if (typeof window !== "undefined") {
          localStorage.setItem("ok_kitchen_paused", "true");
        }
      } else if (mode === "RESUME") {
        if (typeof window !== "undefined") {
          localStorage.setItem("ok_kitchen_paused", "false");
        }
      }
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      const labels: Record<typeof mode, string> = {
        NORMAL: "Standard kitchen prep time (20 mins) applied.",
        RUSH: "Peak rush prep time (35 mins) applied.",
        PAUSE: "Outlet paused. New incoming orders are temporarily halted.",
        RESUME: "Outlet resumed and accepting customer orders.",
      };
      setThrottleMsg(labels[mode]);
    } catch (err) {
      setThrottleMsg(err instanceof Error ? err.message : "Failed to update kitchen status");
    } finally {
      setThrottleBusy(null);
    }
  }

  async function handleQuickOrderAction(
    orderId: string,
    action: "ACCEPT" | "PREPARING" | "READY" | "REJECT",
  ) {
    if (!vendor.restaurantId) return;
    setOrderActionBusy(`${orderId}:${action}`);
    try {
      if (action === "ACCEPT") {
        await acceptOrder({ data: { restaurantId: vendor.restaurantId, orderId } });
      } else if (action === "PREPARING") {
        await markPreparing({ data: { restaurantId: vendor.restaurantId, orderId } });
      } else if (action === "READY") {
        await markReady({ data: { restaurantId: vendor.restaurantId, orderId } });
      } else if (action === "REJECT") {
        await rejectOrder({
          data: {
            restaurantId: vendor.restaurantId,
            orderId,
            reason: "Item unavailable / Kitchen capacity reached",
          },
        });
      }
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["orders"] }),
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    } catch (err) {
      setThrottleMsg(err instanceof Error ? err.message : "Could not update order state");
    } finally {
      setOrderActionBusy(null);
    }
  }

  if (!vendor.isPending && vendor.memberships.length === 0) {
    return (
      <VendorShell title="Restaurant Partner Onboarding">
        <div className="mx-auto max-w-2xl space-y-4 py-4">
          <Card className="border-slate-800 bg-slate-900/90 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400">
                <Store className="size-4" />
                OrderKing Restaurant Partner
              </div>
              <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-emerald-400">
                SELF-SERVICE ONBOARDING
              </span>
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-100">
              Register Your Restaurant &amp; Complete Statutory KYC
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Your partner account is ready. Complete your restaurant profile, 14-digit FSSAI registration, GSTIN/PAN credentials, and settlement bank details to start receiving customer orders.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] uppercase font-mono text-slate-400">Food Safety Compliance</div>
                <div className="text-sm font-semibold text-slate-100 mt-0.5">14-Digit FSSAI Mandatory</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] uppercase font-mono text-slate-400">Tax &amp; Accounting</div>
                <div className="text-sm font-semibold text-slate-100 mt-0.5">CGST §9(5) &amp; TDS §194-O</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] uppercase font-mono text-slate-400">Payout Ledger</div>
                <div className="text-sm font-semibold text-emerald-400 mt-0.5">Integer-Paise NEFT/IMPS</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
                <Link to="/onboarding">Complete Restaurant Onboarding</Link>
              </Button>
            </div>
          </Card>
        </div>
      </VendorShell>
    );
  }

  const d = dash.data;
  const stale = dash.isError;
  const isOpen = Boolean(d?.isOpen);
  const pendingCount = d?.today.pending ?? 0;
  const unavailableCount = d?.today.unavailableItems ?? 0;
  const aovPaise = d?.today.aovPaise ?? 0;
  const recommendedPromoMinPaise = aovPaise > 0 ? Math.round((aovPaise * 1.15) / 1000) * 1000 : 25000;
  const liveOrders = liveOrdersQ.data?.orders ?? [];

  return (
    <VendorShell
      title={d?.restaurantName ?? t("nav.home")}
      dataLabel={d?.dataLabel ?? vendor.dataLabel}
      stale={stale}
      restaurantName={d?.restaurantName}
    >
      <div className="space-y-5">
        {/* FSSAI Statutory Food Safety Regulatory Compliance Banner */}
        <FssaiExpiryBanner fssaiNumber={d?.fssaiNumber} />

        {/* Outlet Live Status & Kitchen Rush Controls */}
        <Card className="border-slate-800 bg-slate-900/90 p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wide",
                    isOpen
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "bg-rose-500/15 text-rose-300 border border-rose-500/30",
                  )}
                >
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      isOpen ? "bg-emerald-400 animate-pulse" : "bg-rose-400",
                    )}
                  />
                  {isOpen ? "ONLINE — ACCEPTING ORDERS" : "OFFLINE / CLOSED"}
                </span>
                <span className="rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-mono text-slate-300">
                  KYC: {d?.verificationStatus ?? vendor.selected?.verificationStatus ?? "DRAFT"}
                </span>
                {d?.fssaiNumber ? (
                  <span className="rounded-md border border-slate-800 bg-slate-950/70 px-2.5 py-1 text-[11px] font-mono text-slate-400">
                    FSSAI: {d.fssaiNumber}
                  </span>
                ) : null}
              </div>
              <h2 className="font-display text-xl font-bold text-white pt-1">
                {d?.restaurantName ?? vendor.selected?.restaurantName ?? "Restaurant Operations Center"}
              </h2>
              <p className="text-xs text-slate-400">
                Self-service kitchen dispatch, 1-tap prep-time throttling, and statutory integer-paise sales telemetry.
              </p>
            </div>

            {/* 1-Tap Kitchen Mode Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={throttleBusy !== null || !vendor.restaurantId}
                onClick={() => void handleThrottle("NORMAL")}
                className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs"
              >
                <Clock className="mr-1.5 size-3.5 text-emerald-400" />
                {throttleBusy === "NORMAL" ? "Updating..." : "Standard Prep (20m)"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={throttleBusy !== null || !vendor.restaurantId}
                onClick={() => void handleThrottle("RUSH")}
                className="border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs"
              >
                <Flame className="mr-1.5 size-3.5 text-amber-400" />
                {throttleBusy === "RUSH" ? "Updating..." : "Peak Rush Mode (35m)"}
              </Button>
              <Button
                size="sm"
                disabled={throttleBusy !== null || !vendor.restaurantId}
                onClick={() => void handleThrottle(isOpen ? "PAUSE" : "RESUME")}
                className={cn(
                  "text-xs font-semibold",
                  isOpen
                    ? "bg-rose-600 hover:bg-rose-500 text-white"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white",
                )}
              >
                {isOpen ? (
                  <>
                    <PauseCircle className="mr-1.5 size-3.5" />
                    {throttleBusy === "PAUSE" ? "Pausing..." : "Pause Outlet"}
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-1.5 size-3.5" />
                    {throttleBusy === "RESUME" ? "Resuming..." : "Resume Outlet"}
                  </>
                )}
              </Button>
            </div>
          </div>

          {throttleMsg ? (
            <div className="rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-200 flex items-center justify-between">
              <span>{throttleMsg}</span>
              <button
                type="button"
                onClick={() => setThrottleMsg(null)}
                className="text-[11px] text-slate-400 hover:text-white"
              >
                Dismiss
              </button>
            </div>
          ) : null}

          {/* Actionable Attention Banner if Pending Orders > 0 */}
          {pendingCount > 0 ? (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="size-5 text-amber-400 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-amber-200">
                    {pendingCount} Pending {pendingCount === 1 ? "Order" : "Orders"} Awaiting Kitchen Acceptance
                  </div>
                  <div className="text-xs text-amber-300/80">
                    Accept orders below or in the Order Queue to maintain SLA and prevent customer cancellation.
                  </div>
                </div>
              </div>
              <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shrink-0">
                <Link to="/orders">
                  Open Full Order Queue <ArrowUpRight className="ml-1 size-4" />
                </Link>
              </Button>
            </div>
          ) : null}
        </Card>

        {/* Direct Live Kitchen Action Queue right on Dashboard */}
        {liveOrders.length > 0 ? (
          <Card className="border-slate-800 bg-slate-900/80 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ChefHat className="size-4 text-emerald-400" />
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                  Active Kitchen Queue ({liveOrders.length}) — Instant 1-Tap Control
                </h3>
              </div>
              <Link to="/orders" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">
                Manage All Orders →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {liveOrders.slice(0, 6).map((ord: any) => {
                const st = String(ord.state ?? "");
                return (
                  <div
                    key={ord.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-white">#{ord.orderNumber}</span>
                          <span className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                            {st}
                          </span>
                          {ord.isCod ? (
                            <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-mono text-amber-300">
                              COD
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-slate-300 mt-1">
                          {ord.lines?.length
                            ? ord.lines.map((l: any) => `${l.quantity}× ${l.itemName}`).join(", ")
                            : "Standard Kitchen Order"}
                        </div>
                        {ord.specialInstructions ? (
                          <div className="text-[11px] text-amber-300 mt-1">
                            Note: {ord.specialInstructions}
                          </div>
                        ) : null}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-sm font-bold text-emerald-400 tabular">
                          {formatINR(ord.prices?.restaurantPayablePaise ?? ord.prices?.foodValuePaise ?? 0)}
                        </div>
                        <div className="text-[10px] text-slate-500">Net Payable</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                      {(st === "PENDING" || st === "PLACED") && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={orderActionBusy !== null}
                            onClick={() => void handleQuickOrderAction(ord.id, "REJECT")}
                            className="h-8 text-xs border-rose-500/30 bg-rose-950/30 text-rose-300 hover:bg-rose-900/40"
                          >
                            <XCircle className="mr-1 size-3.5" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            disabled={orderActionBusy !== null}
                            onClick={() => void handleQuickOrderAction(ord.id, "ACCEPT")}
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            <CheckCircle2 className="mr-1 size-3.5" />
                            Accept Order
                          </Button>
                        </>
                      )}
                      {(st === "CONFIRMED" || st === "ACCEPTED") && (
                        <Button
                          size="sm"
                          disabled={orderActionBusy !== null}
                          onClick={() => void handleQuickOrderAction(ord.id, "PREPARING")}
                          className="h-8 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
                        >
                          <Flame className="mr-1 size-3.5" />
                          Mark Preparing
                        </Button>
                      )}
                      {st === "PREPARING" && (
                        <Button
                          size="sm"
                          disabled={orderActionBusy !== null}
                          onClick={() => void handleQuickOrderAction(ord.id, "READY")}
                          className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                        >
                          <CheckCircle2 className="mr-1 size-3.5" />
                          Mark Food Ready for Rider
                        </Button>
                      )}
                      <Link
                        to="/orders"
                        className="text-[11px] font-medium text-slate-400 hover:text-white px-2"
                      >
                        KOT Details →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ) : null}

        {/* Real-World Tier-1 Leader Owner Daily Business Summary & Settlement Ledger */}
        <DailyPerformanceLedgerCard
          customSummary={
            d?.today
              ? {
                  deliveredOrdersCount: (d.today as any).delivered ?? d.today.accepted ?? d.today.orders ?? 0,
                  grossGmvPaise: d.today.salesPaise ?? 0,
                  netEstimatedPayoutPaise: d.today.settlementPaise ?? 0,
                }
              : undefined
          }
        />

        {/* Real Today's Performance KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Card className="border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono uppercase tracking-wider">Pending Orders</span>
              <ClipboardList className={cn("size-4", pendingCount > 0 ? "text-amber-400" : "text-slate-500")} />
            </div>
            <div className="my-2">
              <div className={cn("font-display text-3xl font-bold tabular", pendingCount > 0 ? "text-amber-400" : "text-slate-100")}>
                {pendingCount}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {pendingCount > 0 ? "Action required in order queue" : "All incoming orders acknowledged"}
              </div>
            </div>
            <Link
              to="/orders"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 pt-2 border-t border-slate-800/80"
            >
              Open Live Orders <ArrowUpRight className="size-3.5" />
            </Link>
          </Card>

          <Card className="border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono uppercase tracking-wider">Today&apos;s Orders</span>
              <ChefHat className="size-4 text-emerald-400" />
            </div>
            <div className="my-2">
              <div className="font-display text-3xl font-bold text-slate-100 tabular">
                {d?.today.orders ?? 0}
              </div>
              <div className="text-xs text-slate-400 mt-0.5 tabular">
                <span className="text-emerald-400 font-medium">{d?.today.accepted ?? 0} accepted</span>
                {" · "}
                <span className="text-rose-400 font-medium">{d?.today.cancelled ?? 0} cancelled</span>
              </div>
            </div>
            <Link
              to="/kitchen"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white pt-2 border-t border-slate-800/80"
            >
              Kitchen Display System (KDS) <ArrowUpRight className="size-3.5" />
            </Link>
          </Card>

          <Card className="border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono uppercase tracking-wider">Today&apos;s Gross Sales</span>
              <TrendingUp className="size-4 text-emerald-400" />
            </div>
            <div className="my-2">
              <div className="font-display text-3xl font-bold text-emerald-400 tabular">
                {formatINR(d?.today.salesPaise ?? 0)}
              </div>
              <div className="text-xs text-slate-400 mt-0.5 tabular">
                Avg Order Value (AOV): <span className="text-slate-200 font-semibold">{formatINR(d?.today.aovPaise ?? 0)}</span>
              </div>
            </div>
            <Link
              to="/analytics"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white pt-2 border-t border-slate-800/80"
            >
              View Sales Analytics <ArrowUpRight className="size-3.5" />
            </Link>
          </Card>

          <Card className="border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono uppercase tracking-wider">Estimated Net Payout</span>
              <Banknote className="size-4 text-emerald-400" />
            </div>
            <div className="my-2">
              <div className="font-display text-3xl font-bold text-slate-100 tabular">
                {formatINR(d?.today.settlementPaise ?? 0)}
              </div>
              <div className="text-xs text-slate-400 mt-0.5 tabular">
                Refund adjustments: {formatINR(d?.today.refundsPaise ?? 0)}
              </div>
            </div>
            <Link
              to="/settlements"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 pt-2 border-t border-slate-800/80"
            >
              Settlement Ledger <ArrowUpRight className="size-3.5" />
            </Link>
          </Card>
        </div>

        {/* Operational Growth & Kitchen Efficiency Advisor */}
        <Card className="border-slate-800 bg-slate-900/80 p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Cpu className="size-5 text-emerald-400" />
              <div>
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                  Operational Growth &amp; Kitchen Efficiency Advisor
                </h3>
                <p className="text-xs text-slate-400">
                  Deterministic recommendations calculated from your live kitchen queue, menu availability, and basket AOV.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded self-start sm:self-center">
              OPERATIONAL INTELLIGENCE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 flex flex-col justify-between gap-2">
              <div>
                <div className="text-[10px] font-mono uppercase text-emerald-400">1. Prep Time &amp; Rider Handover</div>
                <div className="font-semibold text-white mt-1">
                  {liveOrders.length >= 4
                    ? `High Active Queue (${liveOrders.length} orders) — Enable 35m Rush Mode`
                    : "Queue Load Normal — Maintain 20m Standard Prep"}
                </div>
                <p className="text-slate-400 mt-1">
                  {liveOrders.length >= 4
                    ? "Increasing prep SLA to 35m prevents rider wait-time penalties and improves customer ETA accuracy."
                    : "20m standard prep SLA maximizes search conversion and ranking in customer feed."}
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void handleThrottle(liveOrders.length >= 4 ? "RUSH" : "NORMAL")}
                className="w-full text-xs mt-1"
              >
                {liveOrders.length >= 4 ? "Apply 35m Peak Rush Mode" : "Confirm 20m Standard SLA"}
              </Button>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 flex flex-col justify-between gap-2">
              <div>
                <div className="text-[10px] font-mono uppercase text-emerald-400">2. Menu Availability &amp; Stock</div>
                <div className="font-semibold text-white mt-1">
                  {unavailableCount > 0
                    ? `${unavailableCount} Dishes Currently Marked Out-of-Stock`
                    : "100% Active Menu Availability"}
                </div>
                <p className="text-slate-400 mt-1">
                  {unavailableCount > 0
                    ? "Restoring stock on popular dishes before dinner peak directly recovers lost order conversion."
                    : "All active dishes are available for ordering. Keep stock accurate to maintain 0% rejection rate."}
                </p>
              </div>
              <Button asChild size="sm" variant="secondary" className="w-full text-xs mt-1">
                <Link to="/menu">Review Menu Stock Toggles →</Link>
              </Button>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 flex flex-col justify-between gap-2">
              <div>
                <div className="text-[10px] font-mono uppercase text-emerald-400">3. Basket AOV Expansion</div>
                <div className="font-semibold text-white mt-1">
                  Target Minimum Order: {formatINR(recommendedPromoMinPaise)}
                </div>
                <p className="text-slate-400 mt-1">
                  Based on your current AOV ({formatINR(aovPaise)}), setting a promotion threshold at{" "}
                  {formatINR(recommendedPromoMinPaise)} lifts basket size by ~15% while protecting net take-home margin.
                </p>
              </div>
              <Button asChild size="sm" variant="secondary" className="w-full text-xs mt-1">
                <Link to="/promotions">Calculate in Margin Calculator →</Link>
              </Button>
            </div>
          </div>
        </Card>

        {/* Secondary Operational Metrics: Stock, Ratings, Repeat Rate, Attention Alerts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <Card className="border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono uppercase tracking-wider">Out-of-Stock Dishes</span>
              <UtensilsCrossed className={cn("size-4", unavailableCount > 0 ? "text-rose-400" : "text-emerald-400")} />
            </div>
            <div className="my-2">
              <div className={cn("font-display text-2xl font-bold tabular", unavailableCount > 0 ? "text-rose-400" : "text-slate-100")}>
                {unavailableCount} unavailable
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Keep item availability accurate to prevent order rejections during peak hours.
              </p>
            </div>
            <Link
              to="/menu"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 pt-2 border-t border-slate-800/80"
            >
              1-Tap Menu &amp; Stock Manager <ArrowUpRight className="size-3.5" />
            </Link>
          </Card>

          <Card className="border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono uppercase tracking-wider">Customer Rating &amp; Repeat Rate</span>
              <Star className="size-4 text-amber-400" />
            </div>
            <div className="my-2">
              <div className="font-display text-2xl font-bold text-slate-100 tabular">
                {d?.today.rating ? `${d.today.rating} ★ (${d.today.ratingCount})` : "No ratings yet"}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Repeat customer share:{" "}
                <span className="font-semibold text-slate-200">
                  {d?.today.repeatPct != null ? `${d.today.repeatPct}%` : "—"}
                </span>
              </p>
            </div>
            <Link
              to="/reviews"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white pt-2 border-t border-slate-800/80"
            >
              Read &amp; Reply to Customer Reviews <ArrowUpRight className="size-3.5" />
            </Link>
          </Card>

          <Card className="border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono uppercase tracking-wider">Operational Alerts</span>
              <ShieldCheck className="size-4 text-emerald-400" />
            </div>
            <div className="my-2 space-y-1.5">
              {(d?.attention?.length ?? 0) === 0 ? (
                <p className="text-xs text-emerald-400 font-medium">
                  All statutory checks and kitchen queues are healthy.
                </p>
              ) : (
                d?.attention.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-lg px-2.5 py-1.5 text-xs flex items-center justify-between",
                      item.tone === "danger"
                        ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                        : item.tone === "warn"
                          ? "bg-amber-500/15 text-amber-200 border border-amber-500/30"
                          : "bg-slate-800 text-slate-300 border border-slate-700",
                    )}
                  >
                    <span>{t(item.key, { n: item.n ?? 0, status: item.status ?? "" })}</span>
                  </div>
                ))
              )}
            </div>
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white pt-2 border-t border-slate-800/80"
            >
              Self-Service KYC &amp; Bank Profile <ArrowUpRight className="size-3.5" />
            </Link>
          </Card>
        </div>

        {/* Quick Operations Navigation */}
        <Card className="border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-300">
              Self-Service Partner Control Center
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              Role: {d?.role ?? vendor.role ?? "PARTNER"}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link
              to="/orders"
              className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 hover:border-slate-700 transition flex items-start justify-between gap-2"
            >
              <div>
                <div className="text-xs font-semibold text-white">Live Kitchen Orders</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Accept, prepare, print KOT, and mark orders ready</div>
              </div>
              <ClipboardList className="size-4 text-emerald-400 shrink-0" />
            </Link>

            <Link
              to="/menu"
              className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 hover:border-slate-700 transition flex items-start justify-between gap-2"
            >
              <div>
                <div className="text-xs font-semibold text-white">Menu &amp; Stock Manager</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Edit prices, GST slabs, variants, addons &amp; stock</div>
              </div>
              <UtensilsCrossed className="size-4 text-emerald-400 shrink-0" />
            </Link>

            <Link
              to="/settlements"
              className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 hover:border-slate-700 transition flex items-start justify-between gap-2"
            >
              <div>
                <div className="text-xs font-semibold text-white">Settlement &amp; Tax Ledger</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Download CSV/JSON statements, TDS/GST summary &amp; bank KYC</div>
              </div>
              <Banknote className="size-4 text-emerald-400 shrink-0" />
            </Link>

            <Link
              to="/settings"
              className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 hover:border-slate-700 transition flex items-start justify-between gap-2"
            >
              <div>
                <div className="text-xs font-semibold text-white">Outlet Config &amp; Legal Center</div>
                <div className="text-[11px] text-slate-400 mt-0.5">13 Indian languages, self-healing SLA, POS printer &amp; policies</div>
              </div>
              <Settings className="size-4 text-emerald-400 shrink-0" />
            </Link>
          </div>
        </Card>
      </div>
    </VendorShell>
  );
}
