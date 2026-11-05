import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { VendorShell } from "@/components/vendor-shell";
import { OrderCard, type OrderView } from "@/components/order-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useT } from "@/components/use-t";
import { useVendor } from "@/components/use-vendor";
import { useClientState } from "@/lib/client-state";
import { listOrders } from "@/lib/server/api-orders";
import { formatINR } from "@/lib/money";
import { isFeatureEnabled } from "@/lib/platform-config";
import { supabaseCloud } from "@/lib/db-cloud";
import { isAutoPrintEnabled } from "@/lib/hardware/thermal-printer";
import { kotHardware } from "@/lib/printer/persistent-kot-printer";
import { BellOff, FileSpreadsheet, Flame, Search, Volume2, VolumeX } from "lucide-react";
import { useKitchenRushStore, calculateOrderRushEta } from "@/lib/orders/kitchen-rush";

export const Route = createFileRoute("/orders")({ component: OrdersPage });

type StateFilter = "ALL" | "NEEDS_ACTION" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED";

const STATE_PILLS: { id: StateFilter; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "NEEDS_ACTION", label: "Placed (Needs Action)" },
  { id: "PREPARING", label: "Preparing" },
  { id: "READY", label: "Ready" },
  { id: "DELIVERED", label: "Delivered" },
  { id: "CANCELLED", label: "Rejected / Cancelled" },
];

function startContinuousAlarm() {
  kotHardware.startIncomingOrderSiren();
}

function stopContinuousAlarm() {
  kotHardware.stopIncomingOrderSiren();
}

function matchesStateFilter(state: string, filter: StateFilter): boolean {
  if (filter === "ALL") return true;
  if (filter === "NEEDS_ACTION") return ["PLACED", "PENDING"].includes(state);
  if (filter === "PREPARING") return ["ACCEPTED", "CONFIRMED", "PREPARING"].includes(state);
  if (filter === "READY") return ["READY", "RIDER_ASSIGNED", "PICKED_UP", "ON_THE_WAY"].includes(state);
  if (filter === "DELIVERED") return state === "DELIVERED";
  if (filter === "CANCELLED") return ["REJECTED", "RESTAURANT_REJECTED", "CANCELLED"].includes(state);
  return true;
}

function OrdersPage() {
  const t = useT();
  const vendor = useVendor();
  const qc = useQueryClient();
  const soundOn = useClientState((s) => s.soundOn);
  const setSoundOn = useClientState((s) => s.setSoundOn);
  const [scope, setScope] = useState<"live" | "history" | "all">("live");
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<StateFilter>("ALL");

  const rush = useKitchenRushStore();
  const rushActive = rush.isActive;
  const rushBuffer = rush.bufferMinutes;

  const q = useQuery({
    queryKey: ["orders", vendor.restaurantId, scope],
    queryFn: () => listOrders({ data: { restaurantId: vendor.restaurantId, scope } }),
    enabled: Boolean(vendor.restaurantId),
    refetchInterval: scope === "live" ? 3000 : false,
  });

  const rawOrders = q.data?.orders ?? [];
  const pending = rawOrders.filter((o: any) => ["PLACED", "PENDING"].includes(String(o.state))).length;
  const prev = useRef(pending);

  useEffect(() => {
    if (scope === "live" && isFeatureEnabled("new_order_sound") && soundOn && pending > 0) {
      startContinuousAlarm();
    } else {
      stopContinuousAlarm();
    }
    prev.current = pending;

    return () => stopContinuousAlarm();
  }, [pending, soundOn, scope]);

  // Supabase Realtime WebSocket for live order changes and silent KOT thermal auto-print
  useEffect(() => {
    if (!vendor.restaurantId) return;

    const channel = supabaseCloud
      .channel(`partner-orders-live-${vendor.restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${vendor.restaurantId}`,
        },
        async (payload) => {
          console.log("[Realtime:Orders] Order change detected:", payload.eventType);
          void qc.invalidateQueries({ queryKey: ["orders"] });
          void qc.invalidateQueries({ queryKey: ["dashboard"] });

          const newOrder = payload.new as any;
          if (!newOrder) return;

          const isAccepted = newOrder.state === "ACCEPTED" || newOrder.state === "CONFIRMED";
          const isNewArrival = payload.eventType === "INSERT";
          const autoPrint = isAutoPrintEnabled();

          // Trigger automatic dispatch of ESC/POS binary bytes to paired printer
          // when an order transitions to ACCEPTED or arrives with auto-print enabled
          if (isAccepted || (isNewArrival && autoPrint)) {
            try {
              await kotHardware.autoPrintEscPos(newOrder, {
                restaurantName: vendor.selected?.restaurantName,
              });
            } catch (err) {
              console.error("[Realtime:Orders] Silent KOT auto-print error:", err);
            }
          }

          // Trigger kitchen siren on live incoming order arrival
          if (isNewArrival && isFeatureEnabled("new_order_sound") && soundOn) {
            kotHardware.startIncomingOrderSiren();
          }
        }
      )
      .subscribe();

    return () => {
      void supabaseCloud.removeChannel(channel);
    };
  }, [vendor.restaurantId, vendor.selected?.restaurantName, qc]);

  if (!vendor.restaurantId && !vendor.isPending) {
    return (
      <VendorShell title={t("nav.orders")}>
        <Card className="space-y-3">
          <p>{t("onboarding.title")}</p>
          <Button asChild>
            <Link to="/onboarding">{t("common.next")}</Link>
          </Button>
        </Card>
      </VendorShell>
    );
  }

  const filteredOrders = rawOrders.filter((o: any) => {
    if (!matchesStateFilter(String(o.state), stateFilter)) return false;
    const term = searchQuery.trim().toLowerCase();
    if (!term) return true;
    const numMatch = String(o.orderNumber ?? "").toLowerCase().includes(term);
    const areaMatch = String(o.customerArea ?? "").toLowerCase().includes(term);
    const itemMatch = Array.isArray(o.lines)
      ? o.lines.some((l: any) => String(l.itemName ?? "").toLowerCase().includes(term))
      : false;
    return numMatch || areaMatch || itemMatch;
  });

  function exportOrdersCsv() {
    const header = [
      "order_number",
      "placed_at",
      "state",
      "payment_method",
      "customer_area",
      "food_value_paise",
      "packing_paise",
      "restaurant_discount_paise",
      "platform_funded_discount_paise",
      "tax_paise",
      "commission_paise",
      "refund_adjustment_paise",
      "restaurant_payable_paise",
    ].join(",");

    const rows = filteredOrders.map((o: any) =>
      [
        `"${String(o.orderNumber ?? "").replace(/"/g, '""')}"`,
        `"${String(o.placedAt ?? "")}"`,
        `"${String(o.state ?? "")}"`,
        `"${String(o.paymentMethod ?? "")}"`,
        `"${String(o.customerArea ?? "").replace(/"/g, '""')}"`,
        o.prices?.foodValuePaise ?? 0,
        o.prices?.packingPaise ?? 0,
        o.prices?.restaurantDiscountPaise ?? 0,
        o.prices?.platformFundedDiscountPaise ?? 0,
        o.prices?.taxPaise ?? 0,
        o.prices?.commissionPaise ?? 0,
        o.prices?.refundAdjustmentPaise ?? 0,
        o.prices?.restaurantPayablePaise ?? 0,
      ].join(","),
    );

    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `orderking-orders-${scope}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const totalNetPayablePaise = filteredOrders.reduce(
    (sum: number, o: any) => sum + (o.prices?.restaurantPayablePaise ?? 0),
    0,
  );

  return (
    <VendorShell
      title={t("nav.orders")}
      dataLabel={q.data?.dataLabel ?? vendor.dataLabel}
      stale={q.isError}
      restaurantName={vendor.selected?.restaurantName}
    >
      {/* Kitchen Rush / Overload Buffer Mode - Prominent Amber/Red Status Banner */}
      {rushActive ? (
        <div className="rounded-2xl border-2 border-rose-500 bg-rose-950/40 p-4 shadow-xl text-rose-100 space-y-3 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="relative flex size-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-3 bg-rose-500" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <Flame className="size-5 text-rose-400 animate-bounce" />
                  <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-white font-mono">
                    KITCHEN RUSH OVERLOAD BUFFER ACTIVE (+{rushBuffer} MINS)
                  </h2>
                </div>
                <p className="text-xs text-rose-200/90 mt-0.5">
                  Prep SLA dynamically buffered by +{rushBuffer}m across all active incoming orders · Rider pickup arrival window pushed back to prevent premature courier idle wait.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-xl bg-slate-900/90 border border-slate-700 p-1 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => rush.activate(10)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    rushBuffer === 10
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  +10 Mins
                </button>
                <button
                  type="button"
                  onClick={() => rush.activate(15)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    rushBuffer === 15
                      ? "bg-rose-600 text-white shadow-sm"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  +15 Mins
                </button>
              </div>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => rush.deactivate()}
                className="text-xs font-bold border-rose-500/60 bg-rose-900/50 hover:bg-rose-900 text-white cursor-pointer"
              >
                Turn Off Rush Mode
              </Button>
            </div>
          </div>

          {/* Active Heavy Rush Customer Badge & Rider Delay Window Notice */}
          <div className="rounded-xl border border-rose-500/30 bg-black/40 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-300 uppercase font-mono tracking-wider text-[11px]">
                Waiting Customers Badge:
              </span>
              <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-amber-200 font-semibold">
                Kitchen is experiencing heavy rush · +{rushBuffer}m prep buffer
              </span>
            </div>
            <span className="text-[11px] font-mono text-rose-300 bg-rose-950/60 border border-rose-800/60 px-2.5 py-0.5 rounded">
              🛵 Dynamic Rider Arrival Window: +{rushBuffer}m Dispatch Delay Applied
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Flame className="size-4 text-amber-400" />
            <div>
              <span className="font-bold text-slate-200">Kitchen Rush / Overload Buffer Mode:</span>
              <span className="text-slate-400 ml-1.5">
                Experiencing high ticket surge? Add a prep buffer and dynamically push back rider arrival windows.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <button
              type="button"
              onClick={() => rush.activate(10)}
              className="px-3 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-500/60 text-amber-300 font-bold text-xs transition cursor-pointer"
            >
              +10m Rush
            </button>
            <button
              type="button"
              onClick={() => rush.activate(15)}
              className="px-3 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 text-rose-300 font-bold text-xs transition cursor-pointer"
            >
              +15m Rush (Surge)
            </button>
          </div>
        </div>
      )}

      {/* Scope & Export Controls */}
      <Card className="border-slate-800 bg-slate-900/80 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={scope === "live" ? "primary" : "secondary"}
              onClick={() => setScope("live")}
            >
              {t("orders.live")}
            </Button>
            <Button
              size="sm"
              variant={scope === "history" ? "primary" : "secondary"}
              onClick={() => setScope("history")}
            >
              {t("orders.history")}
            </Button>
            <Button
              size="sm"
              variant={scope === "all" ? "primary" : "secondary"}
              onClick={() => setScope("all")}
            >
              All Orders
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => exportOrdersCsv()}
              disabled={filteredOrders.length === 0}
              className="text-xs border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100"
            >
              <FileSpreadsheet className="mr-1.5 size-3.5 text-emerald-400" />
              Export Orders CSV ({filteredOrders.length})
            </Button>
            {scope === "live" && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => stopContinuousAlarm()}
                  className="text-xs border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
                >
                  <BellOff className="mr-1 size-3.5 text-amber-400" />
                  Silence
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label={soundOn ? t("kitchen.soundOn") : t("kitchen.soundOff")}
                  onClick={() => setSoundOn(!soundOn)}
                >
                  {soundOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Order Search & State Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 pt-2 border-t border-slate-800">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order # (e.g. 1042), Customer Locality, or Dish Name..."
              className="pl-9 h-9 text-xs bg-slate-950 border-slate-800 text-slate-100"
            />
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono self-center">
            <span>Showing: <strong className="text-white">{filteredOrders.length}</strong></span>
            <span>Net Payable: <strong className="text-emerald-400">{formatINR(totalNetPayablePaise)}</strong></span>
          </div>
        </div>

        {/* State Filter Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {STATE_PILLS.map((pill) => {
            const count = rawOrders.filter((o: any) =>
              matchesStateFilter(String(o.state), pill.id),
            ).length;
            const active = stateFilter === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setStateFilter(pill.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  active
                    ? "bg-emerald-600 text-white"
                    : "border border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700"
                }`}
              >
                {pill.label} ({count})
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-3">
        {filteredOrders.length === 0 ? (
          <Card className="text-sm text-muted">{t("orders.empty")}</Card>
        ) : (
          filteredOrders.map((o: any) => {
            const isLiveActive = ["PLACED", "PENDING", "ACCEPTED", "CONFIRMED", "PREPARING"].includes(
              String(o.state),
            );
            const rushAdj = rushActive && isLiveActive ? calculateOrderRushEta(o, rushBuffer) : null;

            return (
              <div key={o.id} className="space-y-1.5">
                {rushAdj && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-rose-200 font-sans shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-rose-400 animate-ping" />
                      <span className="font-bold text-white">Kitchen is experiencing heavy rush</span>
                      <span className="text-[11px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                        +{rushBuffer}m prep buffer
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-slate-300">
                      <span>
                        Effective Prep: <strong className="text-white">{rushAdj.bufferedPrepMinutes}m</strong>
                      </span>
                      <span>
                        Rider Pickup Window:{" "}
                        <strong className="text-amber-300">
                          {new Date(rushAdj.adjustedRiderArrivalAt).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </strong>{" "}
                        (delayed +{rushBuffer}m)
                      </span>
                    </div>
                  </div>
                )}
                <OrderCard
                  order={o as unknown as OrderView}
                  restaurantId={vendor.restaurantId}
                  dataLabel={q.data?.dataLabel}
                  prepThrottleBuffer={rushActive && isLiveActive ? rushBuffer : 0}
                  onChanged={() => {
                    void qc.invalidateQueries({ queryKey: ["orders"] });
                    void qc.invalidateQueries({ queryKey: ["dashboard"] });
                  }}
                />
              </div>
            );
          })
        )}
      </div>
    </VendorShell>
  );
}

export { StructuredRejectionModal } from "@/components/orders/structured-rejection-modal";
