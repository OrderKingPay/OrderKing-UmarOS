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
              Your partner account is ready. Complete your restaurant profile, FSSAI registration, and bank details to start receiving customer orders.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] uppercase font-mono text-slate-400">Food Safety Compliance</div>
                <div className="text-sm font-semibold text-slate-100 mt-0.5">14-Digit FSSAI Food Safety</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] uppercase font-mono text-slate-400">Tax &amp; Accounting</div>
                <div className="text-sm font-semibold text-slate-100 mt-0.5">CGST §9(5) &amp; TDS §194-O</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] uppercase font-mono text-slate-400">Payout Ledger</div>
                <div className="text-sm font-semibold text-emerald-400 mt-0.5">Direct Bank Settlement</div>
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

        {/* Outlet Live Status & Kitchen Controls */}
        <Card className="border-slate-800 bg-slate-900/90 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide",
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
                  {isOpen ? "Online" : "Paused"}
                </span>
                <span className="rounded border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[11px] font-mono text-slate-300">
                  {d?.restaurantName ?? vendor.selected?.restaurantName ?? "E2E Tandoor Bistro"}
                </span>
              </div>
            </div>

            {/* 1-Tap Kitchen Mode Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={throttleBusy !== null || !vendor.restaurantId}
                onClick={() => void handleThrottle("NORMAL")}
                className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs h-8"
              >
                <Clock className="mr-1.5 size-3.5 text-emerald-400" />
                {throttleBusy === "NORMAL" ? "Updating..." : "Prep: 20m"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={throttleBusy !== null || !vendor.restaurantId}
                onClick={() => void handleThrottle("RUSH")}
                className="border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs h-8"
              >
                <Flame className="mr-1.5 size-3.5 text-amber-400" />
                {throttleBusy === "RUSH" ? "Updating..." : "Rush Mode (35m)"}
              </Button>
              <Button
                size="sm"
                disabled={throttleBusy !== null || !vendor.restaurantId}
                onClick={() => void handleThrottle(isOpen ? "PAUSE" : "RESUME")}
                className={cn(
                  "text-xs font-semibold h-8",
                  isOpen
                    ? "bg-rose-600 hover:bg-rose-500 text-white"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white",
                )}
              >
                {isOpen ? (
                  <>
                    <PauseCircle className="mr-1.5 size-3.5" />
                    {throttleBusy === "PAUSE" ? "Pausing..." : "Pause"}
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-1.5 size-3.5" />
                    {throttleBusy === "RESUME" ? "Resuming..." : "Resume"}
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
                <h3 className="font-display text-sm font-bold text-white">
                  Live Orders ({liveOrders.length})
                </h3>
              </div>
              <Link to="/orders" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">
                All Orders →
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
        ) : (
          <Card className="border-slate-800 bg-slate-900/40 p-6 text-center space-y-2">
            <ChefHat className="size-8 text-slate-600 mx-auto" />
            <h3 className="font-display text-sm font-semibold text-slate-300">
              No Active Kitchen Orders
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Outlet is ${isOpen ? "online" : "offline"}. Incoming customer orders will ring here with instant 1-tap accept controls.
            </p>
          </Card>
        )}

        {/* Today's Overview: Orders, Gross Sales, Net Payout */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <Card className="border-slate-800 bg-slate-900/70 p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono uppercase tracking-wider">Today's Orders</span>
              <ChefHat className="size-4 text-emerald-400" />
            </div>
            <div className="font-display text-3xl font-bold text-slate-100 tabular pt-1">
              {d?.today.orders ?? 0}
            </div>
            <div className="text-xs text-slate-400">
              <span className="text-emerald-400 font-medium">{d?.today.accepted ?? 0} accepted</span>
              {" · "}
              <span className="text-slate-500 font-medium">{d?.today.cancelled ?? 0} cancelled</span>
            </div>
          </Card>

          <Card className="border-slate-800 bg-slate-900/70 p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono uppercase tracking-wider">Today's Sales</span>
              <TrendingUp className="size-4 text-emerald-400" />
            </div>
            <div className="font-display text-3xl font-bold text-emerald-400 tabular pt-1">
              {formatINR(d?.today.salesPaise ?? 0)}
            </div>
            <div className="text-xs text-slate-400">
              Avg Basket: {formatINR(d?.today.aovPaise ?? 0)}
            </div>
          </Card>

          <Card className="border-slate-800 bg-slate-900/70 p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono uppercase tracking-wider">Estimated Net Payout</span>
              <Banknote className="size-4 text-emerald-400" />
            </div>
            <div className="font-display text-3xl font-bold text-slate-100 tabular pt-1">
              {formatINR(d?.today.settlementPaise ?? 0)}
            </div>
            <div className="text-xs text-slate-400">
              T+1 Direct Bank Settlement
            </div>
          </Card>
        </div>

        {/* Quick Operations Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/orders"
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 hover:border-slate-700 hover:bg-slate-900/90 transition flex flex-col justify-between gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Live Orders</span>
              <ClipboardList className="size-4 text-emerald-400" />
            </div>
            <span className="text-[11px] text-slate-400">KDS &amp; KOT dispatch</span>
          </Link>

          <Link
            to="/menu"
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 hover:border-slate-700 hover:bg-slate-900/90 transition flex flex-col justify-between gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Menu &amp; Stock</span>
              <UtensilsCrossed className="size-4 text-emerald-400" />
            </div>
            <span className="text-[11px] text-slate-400">1-tap item availability</span>
          </Link>

          <Link
            to="/settlements"
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 hover:border-slate-700 hover:bg-slate-900/90 transition flex flex-col justify-between gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Settlements</span>
              <Banknote className="size-4 text-emerald-400" />
            </div>
            <span className="text-[11px] text-slate-400">T+1 payout statements</span>
          </Link>

          <Link
            to="/settings"
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 hover:border-slate-700 hover:bg-slate-900/90 transition flex flex-col justify-between gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Outlet Settings</span>
              <Settings className="size-4 text-emerald-400" />
            </div>
            <span className="text-[11px] text-slate-400">Hours, printers &amp; KYC</span>
          </Link>
        </div>
      </div>
    </VendorShell>
  );
}
