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

export function KitchenDisplayStation() {
  const [activeStationFilter, setActiveStationFilter] = useState<string>("ALL");
  const [tickets, setTickets] = useState<KotTicket[]>([
    {
      id: "kot-1",
      ticketNumber: "KOT-401",
      orderType: "DELIVERY",
      tableOrOrderId: "Order #OK-94281",
      elapsedSeconds: 420, // 7 mins
      status: "PREPARING",
      items: [
        { id: "ki-1", name: "Murgh Tikka Kebab (8 pcs)", quantity: 1, station: "TANDOOR", instructions: "Extra spicy, well charred", completed: true },
        { id: "ki-2", name: "Butter Naan (Crisp)", quantity: 2, station: "TANDOOR", completed: false },
        { id: "ki-3", name: "Chicken Dum Biryani", quantity: 1, station: "CURRY", instructions: "Double raita", completed: false },
      ],
    },
    {
      id: "kot-2",
      ticketNumber: "KOT-402",
      orderType: "DINE_IN",
      tableOrOrderId: "Table T-04",
      elapsedSeconds: 840, // 14 mins (Rush)
      status: "PREPARING",
      items: [
        { id: "ki-4", name: "Paneer Malai Tikka", quantity: 1, station: "TANDOOR", instructions: "Mild spice, Jain prep (no garlic)", completed: true },
        { id: "ki-5", name: "Dal Makhani", quantity: 1, station: "CURRY", completed: true },
        { id: "ki-6", name: "Garlic Kulcha", quantity: 3, station: "TANDOOR", completed: false },
      ],
    },
    {
      id: "kot-3",
      ticketNumber: "KOT-403",
      orderType: "DELIVERY",
      tableOrOrderId: "Order #OK-94282",
      elapsedSeconds: 960, // 16 mins (Delayed / Red)
      status: "PREPARING",
      items: [
        { id: "ki-7", name: "Crispy Corn Pepper Salt", quantity: 1, station: "FRYER", completed: false },
        { id: "ki-8", name: "Hakka Noodles", quantity: 1, station: "CURRY", completed: false },
      ],
    },
  ]);

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {tickets.map((t) => {
          const isDelayed = t.elapsedSeconds >= 900; // >15 mins
          const isRush = t.elapsedSeconds >= 600 && !isDelayed; // 10-15 mins

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
    </div>
  );
}
