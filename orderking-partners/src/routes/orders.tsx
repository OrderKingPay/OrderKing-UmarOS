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
import { BellOff, FileSpreadsheet, Search, Volume2, VolumeX } from "lucide-react";

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

// Global continuous alarm state
let alarmAudioCtx: AudioContext | null = null;
let alarmOscillator: OscillatorNode | null = null;
let alarmGain: GainNode | null = null;
let isAlarmPlaying = false;

function startContinuousAlarm() {
  if (isAlarmPlaying) return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!alarmAudioCtx) {
      alarmAudioCtx = new AudioContextClass();
    }

    if (alarmAudioCtx.state === "suspended") {
      void alarmAudioCtx.resume();
    }

    alarmOscillator = alarmAudioCtx.createOscillator();
    alarmGain = alarmAudioCtx.createGain();

    alarmOscillator.type = "square";
    const lfo = alarmAudioCtx.createOscillator();
    lfo.type = "square";
    lfo.frequency.value = 2;

    const lfoGain = alarmAudioCtx.createGain();
    lfoGain.gain.value = 800;

    lfo.connect(lfoGain);
    lfoGain.connect(alarmOscillator.frequency);

    alarmOscillator.frequency.value = 800;
    alarmGain.gain.value = 0.05;

    alarmOscillator.connect(alarmGain);
    alarmGain.connect(alarmAudioCtx.destination);

    alarmOscillator.start();
    lfo.start();

    isAlarmPlaying = true;
  } catch (e) {
    console.error("Failed to start continuous alarm", e);
  }
}

function stopContinuousAlarm() {
  if (!isAlarmPlaying) return;
  try {
    if (alarmOscillator) {
      alarmOscillator.stop();
      alarmOscillator.disconnect();
      alarmOscillator = null;
    }
    if (alarmGain) {
      alarmGain.disconnect();
      alarmGain = null;
    }
    isAlarmPlaying = false;
  } catch (e) {
    console.error("Failed to stop alarm", e);
  }
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
          filteredOrders.map((o: any) => (
            <OrderCard
              key={o.id}
              order={o as unknown as OrderView}
              restaurantId={vendor.restaurantId}
              dataLabel={q.data?.dataLabel}
              onChanged={() => {
                void qc.invalidateQueries({ queryKey: ["orders"] });
                void qc.invalidateQueries({ queryKey: ["dashboard"] });
              }}
            />
          ))
        )}
      </div>
    </VendorShell>
  );
}
