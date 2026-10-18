import { useState, useEffect } from "react";
import { Clock, ChefHat, CheckSquare, Square, AlertTriangle, ArrowRight, Flame, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface KotItem {
  id: string;
  name: string;
  quantity: number;
  station: "GRILL" | "TANDOOR" | "FRYER" | "CURRY" | "PACKING";
  instructions?: string;
  completed: boolean;
}

export interface KotTicket {
  id: string;
  ticketNumber: string;
  orderType: "DELIVERY" | "DINE_IN" | "TAKEAWAY";
  tableOrOrderId: string;
  elapsedSeconds: number;
  items: KotItem[];
  status: "PREPARING" | "READY" | "BUMPED";
}

import type { OrderView } from "@/components/order-card";

function inferStation(name: string): "GRILL" | "TANDOOR" | "FRYER" | "CURRY" | "PACKING" {
  const lower = name.toLowerCase();
  if (lower.includes("tikka") || lower.includes("tandoor") || lower.includes("naan") || lower.includes("roti") || lower.includes("kebab") || lower.includes("kulcha")) return "TANDOOR";
  if (lower.includes("fry") || lower.includes("crisp") || lower.includes("chips") || lower.includes("pakoda") || lower.includes("corn")) return "FRYER";
  if (lower.includes("grill") || lower.includes("sandwich") || lower.includes("burger")) return "GRILL";
  if (lower.includes("curry") || lower.includes("dal") || lower.includes("biryani") || lower.includes("paneer") || lower.includes("gravy") || lower.includes("noodles") || lower.includes("rice")) return "CURRY";
  return "PACKING";
}

function mapOrdersToKotTickets(orders?: OrderView[]): KotTicket[] {
  if (!orders || orders.length === 0) return [];
  return orders
    .filter((o) => ["PLACED", "ACCEPTED", "CONFIRMED", "PREPARING"].includes(o.state))
    .map((o) => {
      const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(o.placedAt).getTime()) / 1000));
      const items: KotItem[] = o.lines.map((l, idx) => ({
        id: `${o.id}_item_${idx}`,
        name: l.variantName ? `${l.itemName} (${l.variantName})` : l.itemName,
        quantity: l.quantity,
        station: inferStation(l.itemName),
        instructions: l.specialInstructions || undefined,
        completed: false,
      }));
      return {
        id: o.id,
        ticketNumber: `KOT-${o.orderNumber.length >= 4 ? o.orderNumber.slice(-4) : o.orderNumber}`,
        orderType: "DELIVERY",
        tableOrOrderId: `Order #${o.orderNumber}`,
        elapsedSeconds,
        status: "PREPARING",
        items,
      };
    });
}

export function KitchenDisplayStation({
  orders,
  prepThrottleBuffer = 0,
}: {
  orders?: OrderView[];
  prepThrottleBuffer?: number;
}) {
  const [activeStationFilter, setActiveStationFilter] = useState<string>("ALL");
  const [tickets, setTickets] = useState<KotTicket[]>(() => mapOrdersToKotTickets(orders));

  // Sync tickets when orders update from live Supabase / server queries
  useEffect(() => {
    if (orders) {
      setTickets((prev) => {
        const fresh = mapOrdersToKotTickets(orders);
        if (fresh.length === 0 && prev.length === 0) return prev;
        // Preserve completed item checklist state across sync ticks
        const prevCompletedMap = new Map<string, boolean>();
        for (const t of prev) {
          for (const item of t.items) {
            prevCompletedMap.set(item.id, item.completed);
          }
        }
        return fresh.map((t) => ({
          ...t,
          items: t.items.map((i) => ({
            ...i,
            completed: prevCompletedMap.get(i.id) ?? false,
          })),
        }));
      });
    }
  }, [orders]);

  // Tick timers every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTickets((prev) =>
        prev.map((t) => ({ ...t, elapsedSeconds: t.elapsedSeconds + 1 }))
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleItemDone = (ticketId: string, itemId: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        const updatedItems = t.items.map((i) =>
          i.id === itemId ? { ...i, completed: !i.completed } : i
        );
        const allDone = updatedItems.every((i) => i.completed);
        return {
          ...t,
          items: updatedItems,
          status: allDone ? "READY" : "PREPARING",
        };
      })
    );
  };

  const bumpTicket = (ticketId: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
  };

  const STATIONS = ["ALL", "TANDOOR", "CURRY", "FRYER", "GRILL", "PACKING"];

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s < 10 ? "0" : ""}${s}s`;
  };

  return (
    <div className="space-y-4">
      {/* Header & Station Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h2 className="text-base font-bold text-fg flex items-center gap-2">
            <span>🧑‍🍳</span> Kitchen Display System (KDS Station)
          </h2>
          <p className="text-xs text-muted">
            Live digital kitchen tickets with prep timers and station strike-offs.
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {STATIONS.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setActiveStationFilter(st)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                activeStationFilter === st
                  ? "bg-primary text-primary-fg shadow-xs"
                  : "bg-surface-2 text-muted hover:text-fg"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket Columns */}
      {tickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-2 col-span-full bg-surface-2/40">
          <div className="text-3xl">🧑‍🍳</div>
          <h3 className="text-sm font-bold text-fg">No Active Station Cook Tickets</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Live customer orders in Placed, Accepted, or Preparing state will automatically materialize on this station screen.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {tickets.map((t) => {
            const delayedThreshold = 900 + prepThrottleBuffer * 60; // 15 mins + rush buffer
            const rushThreshold = 600 + prepThrottleBuffer * 60; // 10 mins + rush buffer
            const isDelayed = t.elapsedSeconds >= delayedThreshold;
            const isRush = t.elapsedSeconds >= rushThreshold && !isDelayed;

            const visibleItems =
              activeStationFilter === "ALL"
                ? t.items
                : t.items.filter((i) => i.station === activeStationFilter);

            if (visibleItems.length === 0 && activeStationFilter !== "ALL") return null;

            return (
              <div
                key={t.id}
                className={`rounded-2xl border flex flex-col justify-between overflow-hidden shadow-xs transition ${
                  isDelayed
                    ? "border-rose-500/50 bg-rose-500/5"
                    : isRush
                    ? "border-amber-500/50 bg-amber-500/5"
                    : "border-border bg-surface"
                }`}
              >
                {/* Ticket Header */}
                <div
                  className={`p-3 border-b flex items-center justify-between ${
                    isDelayed
                      ? "bg-rose-500/20 border-rose-500/30"
                      : isRush
                      ? "bg-amber-500/20 border-amber-500/30"
                      : "bg-surface-2 border-border"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-fg">{t.ticketNumber}</span>
                      <span className="rounded bg-surface px-1.5 py-0.2 text-[10px] font-bold text-primary">
                        {t.orderType}
                      </span>
                    </div>
                    <p className="text-xs text-muted font-medium mt-0.5">{t.tableOrOrderId}</p>
                  </div>
                  <div
                    className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-mono font-bold ${
                      isDelayed
                        ? "bg-rose-600 text-white animate-pulse"
                        : isRush
                        ? "bg-amber-600 text-white"
                        : "bg-surface text-fg border border-border"
                    }`}
                  >
                    <Clock className="size-3" />
                    <span>{formatElapsed(t.elapsedSeconds)}</span>
                  </div>
                </div>

                {/* Items List */}
                <div className="p-3 space-y-2 flex-1">
                  {visibleItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleItemDone(t.id, item.id)}
                      className={`w-full rounded-xl p-2.5 text-left border transition flex items-start justify-between gap-2 ${
                        item.completed
                          ? "bg-emerald-500/10 border-emerald-500/30 text-muted line-through"
                          : "bg-surface border-border/80 text-fg hover:border-primary/50"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-primary">{item.quantity}x</span>
                          <span className="font-semibold text-xs truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                          <span className="rounded bg-surface-2 px-1 text-muted">
                            {item.station}
                          </span>
                          {item.instructions && (
                            <span className="text-amber-700 dark:text-amber-400 font-medium truncate">
                              ⚠️ {item.instructions}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 mt-0.5">
                        {item.completed ? (
                          <CheckSquare className="size-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Square className="size-4 text-muted" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Bump Ticket Footer */}
                <div className="p-3 border-t border-border/50 bg-surface/50 flex items-center justify-between">
                  <span className="text-[11px] text-muted">
                    {t.items.filter((i) => i.completed).length} / {t.items.length} Ready
                  </span>
                  <Button
                    size="sm"
                    onClick={() => bumpTicket(t.id)}
                    className={`text-xs gap-1 ${
                      t.status === "READY"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : ""
                    }`}
                  >
                    <span>{t.status === "READY" ? "Ready & Bump Ticket" : "Bump KOT"}</span>
                    <ArrowRight className="size-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
