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
  Clock3,
  Flame,
  Sparkles,
  Tag,
  PauseCircle,
  PlayCircle,
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
        <div className="mx-auto max-w-2xl space-y-4 py-8">
          <Card className="border-gray-200 bg-white p-8 space-y-5 rounded-3xl shadow-lg text-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E23744]">
                <Store className="size-4" />
                OrderKing Partner
              </div>
              <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-[#E23744]">
                SELF-SERVICE REGISTRATION
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-gray-900">
              Register Your Restaurant &amp; Complete Details
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Your partner account is ready. Complete your restaurant profile, FSSAI food license, and bank account to start receiving online customer orders.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <div className="text-[10px] uppercase font-bold text-gray-500">Food Safety</div>
                <div className="text-sm font-bold text-gray-900 mt-0.5">14-Digit FSSAI License</div>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <div className="text-[10px] uppercase font-bold text-gray-500">Legal Proof</div>
                <div className="text-sm font-bold text-gray-900 mt-0.5">PAN &amp; Outlet Address</div>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <div className="text-[10px] uppercase font-bold text-gray-500">Payouts</div>
                <div className="text-sm font-bold text-emerald-700 mt-0.5">Daily T+1 Bank Payout</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-3">
              <Button asChild size="lg" className="bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold h-12 px-8 rounded-xl shadow-md shadow-red-500/20">
                <Link to="/onboarding">Complete Restaurant Registration →</Link>
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
  const liveOrders = liveOrdersQ.data?.orders ?? [];
  const rawTitle = d?.restaurantName || vendor.selected?.restaurantName;
  const headerTitle =
    rawTitle && rawTitle.trim().length >= 3 && rawTitle.trim() !== "II"
      ? rawTitle.trim()
      : "Restaurant Partner Dashboard";

  return (
    <VendorShell
      title={headerTitle}
      dataLabel={d?.dataLabel ?? vendor.dataLabel}
      stale={stale}
      restaurantName={headerTitle}
    >
      <div className="space-y-6">
        {/* Food Safety Regulatory Compliance Banner */}
        <FssaiExpiryBanner fssaiNumber={d?.fssaiNumber} />

        {/* Outlet Live Status & Kitchen Rush Controls */}
        <Card className="border-gray-200 bg-white p-6 rounded-3xl shadow-xs space-y-4 text-gray-900">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wide",
                    isOpen
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200",
                  )}
                >
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      isOpen ? "bg-emerald-600 animate-pulse" : "bg-rose-600",
                    )}
                  />
                  {isOpen ? "ONLINE — ACCEPTING ORDERS" : "OFFLINE / CLOSED"}
                </span>
                <span className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-mono text-gray-700 font-semibold">
                  Status: {d?.verificationStatus ?? vendor.selected?.verificationStatus ?? "ACTIVE"}
                </span>
                {d?.fssaiNumber ? (
                  <span className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-mono text-gray-600">
                    FSSAI: {d.fssaiNumber}
                  </span>
                ) : null}
              </div>
              <h2 className="text-2xl font-black text-gray-900 pt-1">
                {d?.restaurantName ?? vendor.selected?.restaurantName ?? "Restaurant Partner Dashboard"}
              </h2>
              <p className="text-xs text-gray-500">
                Live orders, kitchen preparation timings, and daily settlements.
              </p>
            </div>

            {/* 1-Tap Kitchen Mode Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={throttleBusy !== null || !vendor.restaurantId}
                onClick={() => void handleThrottle("NORMAL")}
                className="border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold h-10 px-4 rounded-xl"
              >
                <Clock className="mr-1.5 size-3.5 text-emerald-600" />
                {throttleBusy === "NORMAL" ? "Updating..." : "Standard Prep (20m)"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={throttleBusy !== null || !vendor.restaurantId}
                onClick={() => void handleThrottle("RUSH")}
                className="border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold h-10 px-4 rounded-xl"
              >
                <Flame className="mr-1.5 size-3.5 text-amber-600" />
                {throttleBusy === "RUSH" ? "Updating..." : "Peak Rush Mode (35m)"}
              </Button>
              <Button
                size="sm"
                disabled={throttleBusy !== null || !vendor.restaurantId}
                onClick={() => void handleThrottle(isOpen ? "PAUSE" : "RESUME")}
                className={cn(
                  "text-xs font-bold h-10 px-4 rounded-xl shadow-xs",
                  isOpen
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white",
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
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs text-gray-800 flex items-center justify-between">
              <span>{throttleMsg}</span>
              <button
                type="button"
                onClick={() => setThrottleMsg(null)}
                className="text-[11px] font-bold text-gray-500 hover:text-gray-900"
              >
                Dismiss
              </button>
            </div>
          ) : null}

          {/* Actionable Attention Banner if Pending Orders > 0 */}
          {pendingCount > 0 ? (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <AlertTriangle className="size-5 text-amber-600 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-amber-900">
                    {pendingCount} Pending {pendingCount === 1 ? "Order" : "Orders"} Awaiting Kitchen Acceptance
                  </div>
                  <div className="text-xs text-amber-700">
                    Accept orders below or in the Order Queue to maintain SLA and dispatch riders on time.
                  </div>
                </div>
              </div>
              <Button asChild size="sm" className="bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold shrink-0 h-10 px-5 rounded-xl shadow-xs">
                <Link to="/orders">
                  Open Order Queue <ArrowUpRight className="ml-1 size-4" />
                </Link>
              </Button>
            </div>
          ) : null}
        </Card>

        {/* Direct Live Kitchen Action Queue right on Dashboard */}
        {liveOrders.length > 0 ? (
          <Card className="border-gray-200 bg-white p-6 rounded-3xl shadow-xs space-y-4 text-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <ChefHat className="size-5 text-[#E23744]" />
                <h3 className="font-display text-base font-black text-gray-900">
                  Live Kitchen Queue ({liveOrders.length})
                </h3>
              </div>
              <Link to="/orders" className="text-xs font-bold text-[#E23744] hover:underline">
                Manage All Orders →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveOrders.slice(0, 6).map((ord: any) => {
                const st = String(ord.state ?? "");
                return (
                  <div
                    key={ord.id}
                    className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 flex flex-col justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-gray-900">#{ord.orderNumber}</span>
                          <span className="rounded-md border border-gray-300 bg-white px-2 py-0.5 text-[10px] font-mono font-bold text-[#E23744]">
                            {st}
                          </span>
                          {ord.isCod ? (
                            <span className="rounded-md border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-mono font-bold text-amber-800">
                              COD
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-gray-700 mt-1.5 font-medium">
                          {ord.lines?.length
                            ? ord.lines.map((l: any) => `${l.quantity}× ${l.itemName}`).join(", ")
                            : "Standard Kitchen Order"}
                        </div>
                        {ord.specialInstructions ? (
                          <div className="text-[11px] text-amber-800 bg-amber-50 rounded px-2 py-0.5 mt-1">
                            Note: {ord.specialInstructions}
                          </div>
                        ) : null}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-base font-black text-gray-900 tabular">
                          {formatINR(ord.prices?.restaurantPayablePaise ?? ord.prices?.foodValuePaise ?? 0)}
                        </div>
                        <div className="text-[10px] text-gray-500 font-semibold">Net Payable</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-gray-200">
                      {(st === "PENDING" || st === "PLACED") && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={orderActionBusy !== null}
                            onClick={() => void handleQuickOrderAction(ord.id, "REJECT")}
                            className="h-9 text-xs border-red-200 bg-red-50 text-red-700 hover:bg-red-100 font-semibold rounded-lg"
                          >
                            <XCircle className="mr-1 size-3.5" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            disabled={orderActionBusy !== null}
                            onClick={() => void handleQuickOrderAction(ord.id, "ACCEPT")}
                            className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs"
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
                          className="h-9 text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg"
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
                          className="h-9 text-xs bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold rounded-lg"
                        >
                          <CheckCircle2 className="mr-1 size-3.5" />
                          Mark Food Ready for Rider
                        </Button>
                      )}
                      <Link
                        to="/orders"
                        className="text-[11px] font-semibold text-gray-500 hover:text-gray-900 px-2"
                      >
                        Details →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ) : null}

        {/* Daily Business Summary & Settlement Ledger */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-gray-200 bg-white p-5 rounded-2xl shadow-xs flex flex-col justify-between text-gray-900">
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
              <span className="uppercase tracking-wider">Pending Orders</span>
              <ClipboardList className={cn("size-4", pendingCount > 0 ? "text-amber-600" : "text-gray-400")} />
            </div>
            <div className="my-3">
              <div className={cn("font-display text-3xl font-black tabular", pendingCount > 0 ? "text-amber-600" : "text-gray-900")}>
                {pendingCount}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {pendingCount > 0 ? "Action required in order queue" : "All incoming orders acknowledged"}
              </div>
            </div>
            <Link
              to="/orders"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#E23744] hover:underline pt-3 border-t border-gray-100"
            >
              Open Live Orders <ArrowUpRight className="size-3.5" />
            </Link>
          </Card>

          <Card className="border-gray-200 bg-white p-5 rounded-2xl shadow-xs flex flex-col justify-between text-gray-900">
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
              <span className="uppercase tracking-wider">Today&apos;s Orders</span>
              <ChefHat className="size-4 text-[#E23744]" />
            </div>
            <div className="my-3">
              <div className="font-display text-3xl font-black text-gray-900 tabular">
                {d?.today.orders ?? 0}
              </div>
              <div className="text-xs text-gray-500 mt-1 tabular">
                <span className="text-emerald-700 font-bold">{d?.today.accepted ?? 0} accepted</span>
                {" · "}
                <span className="text-rose-600 font-bold">{d?.today.cancelled ?? 0} cancelled</span>
              </div>
            </div>
            <Link
              to="/kitchen"
              className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-gray-900 pt-3 border-t border-gray-100"
            >
              Kitchen Display (KDS) <ArrowUpRight className="size-3.5" />
            </Link>
          </Card>

          <Card className="border-gray-200 bg-white p-5 rounded-2xl shadow-xs flex flex-col justify-between text-gray-900">
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
              <span className="uppercase tracking-wider">Today&apos;s Gross Sales</span>
              <TrendingUp className="size-4 text-[#E23744]" />
            </div>
            <div className="my-3">
              <div className="font-display text-3xl font-black text-gray-900 tabular">
                {formatINR(d?.today.salesPaise ?? 0)}
              </div>
              <div className="text-xs text-gray-500 mt-1 tabular">
                AOV: <span className="text-gray-800 font-bold">{formatINR(d?.today.aovPaise ?? 0)}</span>
              </div>
            </div>
            <Link
              to="/analytics"
              className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-gray-900 pt-3 border-t border-gray-100"
            >
              Sales Analytics <ArrowUpRight className="size-3.5" />
            </Link>
          </Card>

          <Card className="border-gray-200 bg-white p-5 rounded-2xl shadow-xs flex flex-col justify-between text-gray-900">
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
              <span className="uppercase tracking-wider">Estimated Net Payout</span>
              <Banknote className="size-4 text-emerald-600" />
            </div>
            <div className="my-3">
              <div className="font-display text-3xl font-black text-emerald-700 tabular">
                {formatINR(d?.today.settlementPaise ?? 0)}
              </div>
              <div className="text-xs text-gray-500 mt-1 tabular">
                Adjustments: {formatINR(d?.today.refundsPaise ?? 0)}
              </div>
            </div>
            <Link
              to="/settlements"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline pt-3 border-t border-gray-100"
            >
              Settlement Ledger <ArrowUpRight className="size-3.5" />
            </Link>
          </Card>
        </div>

        {/* Secondary Operational Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-gray-200 bg-white p-5 rounded-2xl shadow-xs flex flex-col justify-between text-gray-900">
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
              <span className="uppercase tracking-wider">Out-of-Stock Dishes</span>
              <UtensilsCrossed className={cn("size-4", unavailableCount > 0 ? "text-rose-600" : "text-emerald-600")} />
            </div>
            <div className="my-3">
              <div className={cn("font-display text-2xl font-black tabular", unavailableCount > 0 ? "text-rose-600" : "text-gray-900")}>
                {unavailableCount} unavailable
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Keep item availability accurate to prevent cancellations during peak hours.
              </p>
            </div>
            <Link
              to="/menu"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#E23744] hover:underline pt-3 border-t border-gray-100"
            >
              1-Tap Stock Manager <ArrowUpRight className="size-3.5" />
            </Link>
          </Card>

          <Card className="border-gray-200 bg-white p-5 rounded-2xl shadow-xs flex flex-col justify-between text-gray-900">
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
              <span className="uppercase tracking-wider">Customer Rating</span>
              <Star className="size-4 text-amber-500" />
            </div>
            <div className="my-3">
              <div className="font-display text-2xl font-black text-gray-900 tabular">
                {d?.today.rating ? `${d.today.rating} ★ (${d.today.ratingCount})` : "No ratings yet"}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Repeat customers:{" "}
                <span className="font-bold text-gray-800">
                  {d?.today.repeatPct != null ? `${d.today.repeatPct}%` : "—"}
                </span>
              </p>
            </div>
            <Link
              to="/reviews"
              className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-gray-900 pt-3 border-t border-gray-100"
            >
              Customer Reviews <ArrowUpRight className="size-3.5" />
            </Link>
          </Card>

          <Card className="border-gray-200 bg-white p-5 rounded-2xl shadow-xs flex flex-col justify-between text-gray-900">
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
              <span className="uppercase tracking-wider">Operational Health</span>
              <ShieldCheck className="size-4 text-emerald-600" />
            </div>
            <div className="my-3 space-y-1.5">
              {(d?.attention?.length ?? 0) === 0 ? (
                <p className="text-xs text-emerald-700 font-semibold">
                  All statutory checks and kitchen queues are healthy.
                </p>
              ) : (
                d?.attention.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-lg px-2.5 py-1.5 text-xs flex items-center justify-between",
                      item.tone === "danger"
                        ? "bg-rose-50 text-rose-800 border border-rose-200"
                        : item.tone === "warn"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-gray-100 text-gray-800 border border-gray-200",
                    )}
                  >
                    <span>{t(item.key, { n: item.n ?? 0, status: item.status ?? "" })}</span>
                  </div>
                ))
              )}
            </div>
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-gray-900 pt-3 border-t border-gray-100"
            >
              Outlet Profile &amp; KYC <ArrowUpRight className="size-3.5" />
            </Link>
          </Card>
        </div>

        {/* 9 Core Management Navigation Modules */}
        <Card className="border-gray-200 bg-white p-6 rounded-3xl shadow-xs space-y-4 text-gray-900">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-display text-sm font-black uppercase tracking-wider text-gray-900">
              Restaurant Management Console
            </h3>
            <span className="text-xs font-mono text-gray-500 font-semibold">
              Role: {d?.role ?? vendor.role ?? "PARTNER"}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link
              to="/orders"
              className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 hover:border-red-300 hover:bg-red-50/30 transition flex items-start justify-between gap-2 group"
            >
              <div>
                <div className="text-xs font-bold text-gray-900 group-hover:text-[#E23744] transition-colors">
                  Live Orders
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Live queue, KOT printing &amp; order history
                </div>
              </div>
              <ClipboardList className="size-4 text-[#E23744] shrink-0" />
            </Link>

            <Link
              to="/kitchen"
              className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 hover:border-red-300 hover:bg-red-50/30 transition flex items-start justify-between gap-2 group"
            >
              <div>
                <div className="text-xs font-bold text-gray-900 group-hover:text-[#E23744] transition-colors">
                  Kitchen KDS
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Full-screen prep display with audio siren
                </div>
              </div>
              <ChefHat className="size-4 text-[#E23744] shrink-0" />
            </Link>

            <Link
              to="/menu"
              className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 hover:border-red-300 hover:bg-red-50/30 transition flex items-start justify-between gap-2 group"
            >
              <div>
                <div className="text-xs font-bold text-gray-900 group-hover:text-[#E23744] transition-colors">
                  Menu &amp; Stock
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  1-tap item stockout toggles &amp; pricing
                </div>
              </div>
              <UtensilsCrossed className="size-4 text-[#E23744] shrink-0" />
            </Link>

            <Link
              to="/settlements"
              className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 hover:border-red-300 hover:bg-red-50/30 transition flex items-start justify-between gap-2 group"
            >
              <div>
                <div className="text-xs font-bold text-gray-900 group-hover:text-[#E23744] transition-colors">
                  Settlements &amp; Payouts
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Daily T+1 bank transfer ledger &amp; tax invoices
                </div>
              </div>
              <Banknote className="size-4 text-emerald-600 shrink-0" />
            </Link>

            <Link
              to="/onboarding"
              className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 hover:border-red-300 hover:bg-red-50/30 transition flex items-start justify-between gap-2 group"
            >
              <div>
                <div className="text-xs font-bold text-gray-900 group-hover:text-[#E23744] transition-colors">
                  Restaurant Profile &amp; KYC
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  14-digit FSSAI, GSTIN, bank account proof
                </div>
              </div>
              <Store className="size-4 text-[#E23744] shrink-0" />
            </Link>

            <Link
              to="/assistant"
              className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 hover:border-amber-400 hover:bg-amber-100/50 transition flex items-start justify-between gap-2 group"
            >
              <div>
                <div className="text-xs font-bold text-amber-900 group-hover:text-amber-800 transition-colors">
                  King AI Co-Pilot
                </div>
                <div className="text-[11px] text-amber-700 mt-0.5">
                  Menu photo digitizer &amp; culinary photo studio
                </div>
              </div>
              <Sparkles className="size-4 text-amber-600 shrink-0 animate-pulse" />
            </Link>

            <Link
              to="/promotions"
              className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 hover:border-red-300 hover:bg-red-50/30 transition flex items-start justify-between gap-2 group"
            >
              <div>
                <div className="text-xs font-bold text-gray-900 group-hover:text-[#E23744] transition-colors">
                  Discounts &amp; Offers
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Configure flat ₹ or % customer discounts
                </div>
              </div>
              <Tag className="size-4 text-[#E23744] shrink-0" />
            </Link>

            <Link
              to="/reviews"
              className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 hover:border-red-300 hover:bg-red-50/30 transition flex items-start justify-between gap-2 group"
            >
              <div>
                <div className="text-xs font-bold text-gray-900 group-hover:text-[#E23744] transition-colors">
                  Customer Reviews
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Verified customer ratings &amp; instant replies
                </div>
              </div>
              <Star className="size-4 text-amber-500 shrink-0" />
            </Link>

            <Link
              to="/hours"
              className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 hover:border-red-300 hover:bg-red-50/30 transition flex items-start justify-between gap-2 group"
            >
              <div>
                <div className="text-xs font-bold text-gray-900 group-hover:text-[#E23744] transition-colors">
                  Operating Hours
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Kitchen open/close shifts &amp; weekly holidays
                </div>
              </div>
              <Clock3 className="size-4 text-[#E23744] shrink-0" />
            </Link>
          </div>
        </Card>
      </div>
    </VendorShell>
  );
}
