// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { VendorShell } from "@/components/vendor-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Clock, Printer, PackageCheck, Volume2, XCircle, Search, PlusCircle, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/kds")({
  component: PartnerKdsOrdersPage,
});

interface OrderCustomization {
  groupName: string;
  selection: string;
  pricePaise: number;
}

interface PartnerOrderLine {
  itemId: string;
  name: string;
  qty: number;
  baseUnitPricePaise: number; // Historical price snapshot protected against menu edits
  customizations: OrderCustomization[];
  lineTotalPaise: number;
}

interface PartnerOrder {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  lines: PartnerOrderLine[];
  foodSubtotalPaise: number;
  packagingPaise: number;
  cgstPaise: number; // 2.5% Sec 9(5)
  sgstPaise: number; // 2.5% Sec 9(5)
  totalPaise: number;
  prepMins: 10 | 15 | 25 | 35;
  pickupPin: string;
  doorstepOtp: string;
  status: "PLACED" | "ACCEPTED" | "READY_FOR_PICKUP" | "RIDER_ASSIGNED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "REJECTED";
  rejectionReason?: string;
  station: "ALL" | "MAIN_KITCHEN" | "TANDOOR_GRILL" | "PACKAGING";
  createdAt: string;
}

const STORAGE_KEY = "orderking_partner_live_orders_v2";

const INITIAL_SEED_ORDERS: PartnerOrder[] = [
  {
    id: "ord_live_901",
    code: "OK-9014",
    customerName: "Tariqul Islam",
    customerPhone: "+91 98640 22190",
    lines: [
      {
        itemId: "d1",
        name: "Special Chicken Dum Biryani",
        qty: 2,
        baseUnitPricePaise: 18000,
        customizations: [
          { groupName: "Size", selection: "Full (750ml)", pricePaise: 6000 },
          { groupName: "Spice Level", selection: "Medium Assam Spice", pricePaise: 0 },
        ],
        lineTotalPaise: 48000,
      },
      {
        itemId: "d3",
        name: "Butter Garlic Naan",
        qty: 2,
        baseUnitPricePaise: 4500,
        customizations: [{ groupName: "Crust", selection: "Crisp Tandoor", pricePaise: 0 }],
        lineTotalPaise: 9000,
      },
    ],
    foodSubtotalPaise: 57000,
    packagingPaise: 2000,
    cgstPaise: 1475,
    sgstPaise: 1475,
    totalPaise: 61950,
    prepMins: 15,
    pickupPin: "4821",
    doorstepOtp: "7391",
    status: "PLACED",
    station: "MAIN_KITCHEN",
    createdAt: new Date().toISOString(),
  },
];

function playKitchenAudioAlert() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    }
  } catch {}
}

function PartnerKdsOrdersPage() {
  const [orders, setOrders] = useState<PartnerOrder[]>(INITIAL_SEED_ORDERS);
  const [tab, setTab] = useState<"ALL" | "PLACED" | "ACCEPTED" | "READY_FOR_PICKUP" | "OUT_FOR_DELIVERY" | "DELIVERED" | "REJECTED">("ALL");
  const [selectedTimers, setSelectedTimers] = useState<Record<string, 10 | 15 | 25 | 35>>({});
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState<string>("");
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) setOrders(parsed);
      } else {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_ORDERS));
      }
    } catch {}
  }, []);

  function saveOrders(next: PartnerOrder[]) {
    setOrders(next);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
    }
  }

  function handleAcceptOrder(orderId: string) {
    const timer: 10 | 15 | 25 | 35 = selectedTimers[orderId] || 15;
    playKitchenAudioAlert();
    const next = orders.map((o) =>
      o.id === orderId ? { ...o, status: "ACCEPTED" as const, prepMins: timer } : o
    );
    saveOrders(next);
    setStatusNotice(`Order accepted with ${timer}m preparation timer. Customer & Rider Fleet notified.`);
  }

  function handleConfirmReject(orderId: string) {
    const clean = rejectReasonInput.trim();
    if (clean.length < 5) {
      setRejectError("Mandatory rejection reason required (minimum 5 characters, e.g., 'Main ingredient out of stock').");
      return;
    }
    const next = orders.map((o) =>
      o.id === orderId ? { ...o, status: "REJECTED" as const, rejectionReason: clean } : o
    );
    saveOrders(next);
    setRejectingOrderId(null);
    setRejectReasonInput("");
    setRejectError(null);
    setStatusNotice(`Order rejected with logged reason: "${clean}". Instant customer refund initiated.`);
  }

  function handleTransitionStatus(orderId: string, nextStatus: PartnerOrder["status"]) {
    const next = orders.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o));
    saveOrders(next);
    setStatusNotice(`Order status updated to ${nextStatus}.`);
  }

  function handleSimulateIncomingOrder() {
    playKitchenAudioAlert();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const pickupPin = String(Math.floor(1000 + Math.random() * 9000));
    const doorstepOtp = String(Math.floor(1000 + Math.random() * 9000));
    const newOrder: PartnerOrder = {
      id: "ord_" + Date.now(),
      code: "OK-" + randomNum,
      customerName: "Ananya Borah",
      customerPhone: "+91 94350 88120",
      lines: [
        {
          itemId: "d2",
          name: "Smoked Chicken Bhut Jolokia Pizza",
          qty: 1,
          baseUnitPricePaise: 34900,
          customizations: [
            { groupName: "Size", selection: "Medium (10 inch)", pricePaise: 10000 },
            { groupName: "Crust", selection: "Cheese Burst", pricePaise: 7500 },
            { groupName: "Spice Level", selection: "Fiery Naga", pricePaise: 0 },
          ],
          lineTotalPaise: 52400,
        },
      ],
      foodSubtotalPaise: 52400,
      packagingPaise: 2500,
      cgstPaise: 1373,
      sgstPaise: 1373,
      totalPaise: 57646,
      prepMins: 15,
      pickupPin,
      doorstepOtp,
      status: "PLACED",
      station: "TANDOOR_GRILL",
      createdAt: new Date().toISOString(),
    };
    saveOrders([newOrder, ...orders]);
    setStatusNotice(`New live order #${newOrder.code} received with audio alert!`);
  }

  const formatPaise = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

  const filtered = orders.filter((o) => {
    if (tab !== "ALL" && o.status !== tab) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        o.code.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.lines.some((l) => l.name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <VendorShell title="Kitchen Display System (KDS)">
      <div className="mx-auto max-w-6xl py-4 space-y-4 text-slate-100">
        {/* Top Controls & Audio Test Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {(["ALL", "PLACED", "ACCEPTED", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED", "REJECTED"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  tab === t
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {t.replace(/_/g, " ")} ({t === "ALL" ? orders.length : orders.filter((o) => o.status === t).length})
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={playKitchenAudioAlert}
              variant="outline"
              className="h-9 px-3 border-slate-700 bg-slate-950 text-slate-200 text-xs rounded-xl flex items-center gap-1.5"
            >
              <Volume2 className="size-3.5 text-emerald-400" />
              <span>Test KDS Siren</span>
            </Button>
            <Button
              type="button"
              onClick={handleSimulateIncomingOrder}
              className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <PlusCircle className="size-3.5" />
              <span>Receive Test Order</span>
            </Button>
          </div>
        </div>

        {statusNotice && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs text-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
              <span>{statusNotice}</span>
            </div>
            <button type="button" onClick={() => setStatusNotice(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        <div className="relative">
          <Search className="size-4 text-slate-400 absolute left-3.5 top-3" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order ID (#OK-9014), customer name, or dish..."
            className="pl-10 h-10 bg-slate-900 border-slate-800 text-white text-xs rounded-xl"
          />
        </div>

        <div className="space-y-4">
          {filtered.map((o) => {
            const chosenTimer = selectedTimers[o.id] || o.prepMins || 15;
            return (
              <div key={o.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-base font-bold text-white">#{o.code}</span>
                    <span className="rounded-md bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/30">
                      {o.status.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-slate-300">
                      Customer: <strong>{o.customerName}</strong> ({o.customerPhone})
                    </span>
                    <span className="text-xs bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300">
                      Rider Pickup PIN: <strong className="font-mono text-emerald-400">{o.pickupPin}</strong>
                    </span>
                    <span className="text-xs bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300">
                      Doorstep OTP: <strong className="font-mono text-amber-400">{o.doorstepOtp}</strong>
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <ShieldCheck className="size-4 text-emerald-400" />
                    <span>FSSAI: 10324001000492 · GSTIN: 18AFXPH9838M1Z9</span>
                  </div>
                </div>

                {/* Snapshot-Protected Order Line Items & Customizations */}
                <div className="space-y-2">
                  {o.lines.map((line, idx) => (
                    <div key={idx} className="rounded-xl bg-slate-950/90 border border-slate-800 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="text-sm font-bold text-white">
                          {line.qty}x {line.name}
                          <span className="ml-2 text-[11px] font-normal text-slate-400">
                            (Snapshot Base: {formatPaise(line.baseUnitPricePaise)})
                          </span>
                        </div>
                        {line.customizations.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {line.customizations.map((c, cIdx) => (
                              <span key={cIdx} className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                {c.groupName}: {c.selection} {c.pricePaise > 0 ? `(+${formatPaise(c.pricePaise)})` : ""}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="font-mono text-sm font-bold text-white">
                        {formatPaise(line.lineTotalPaise)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Integer-Paise Bill & Statutory Tax Summary */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800 text-xs text-slate-300">
                  <div className="flex flex-wrap gap-4">
                    <span>Food Subtotal: <strong className="text-white font-mono">{formatPaise(o.foodSubtotalPaise)}</strong></span>
                    <span>Packaging: <strong className="text-white font-mono">{formatPaise(o.packagingPaise)}</strong></span>
                    <span>Sec 9(5) CGST (2.5%): <strong className="text-white font-mono">{formatPaise(o.cgstPaise)}</strong></span>
                    <span>Sec 9(5) SGST (2.5%): <strong className="text-white font-mono">{formatPaise(o.sgstPaise)}</strong></span>
                    <span>Total Paid: <strong className="text-emerald-400 font-mono text-sm">{formatPaise(o.totalPaise)}</strong></span>
                  </div>

                  {/* KDS Action Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => typeof window !== "undefined" && window.print()}
                      className="h-9 px-3 border-slate-700 bg-slate-950 text-slate-200 text-xs rounded-xl flex items-center gap-1.5"
                    >
                      <Printer className="size-3.5" />
                      <span>Print 80mm KOT</span>
                    </Button>

                    {o.status === "PLACED" && (
                      <>
                        {/* Configurable Prep Timer: 10m, 15m, 25m, 35m */}
                        <div className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-950 p-1">
                          {([10, 15, 25, 35] as const).map((mins) => (
                            <button
                              key={mins}
                              type="button"
                              onClick={() => setSelectedTimers({ ...selectedTimers, [o.id]: mins })}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                                chosenTimer === mins
                                  ? "bg-emerald-600 text-white"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              {mins}m
                            </button>
                          ))}
                        </div>

                        <Button
                          type="button"
                          onClick={() => handleAcceptOrder(o.id)}
                          className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
                        >
                          1-Tap Accept ({chosenTimer}m)
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setRejectingOrderId(o.id);
                            setRejectError(null);
                          }}
                          className="h-9 px-3 border-rose-500/40 bg-rose-950/30 text-rose-300 hover:bg-rose-900/50 text-xs font-bold rounded-xl flex items-center gap-1"
                        >
                          <XCircle className="size-3.5" />
                          <span>Reject</span>
                        </Button>
                      </>
                    )}

                    {o.status === "ACCEPTED" && (
                      <Button
                        type="button"
                        onClick={() => handleTransitionStatus(o.id, "READY_FOR_PICKUP")}
                        className="h-9 px-4 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl"
                      >
                        Mark Food Prepared &amp; Ready ({o.prepMins}m SLA)
                      </Button>
                    )}

                    {o.status === "READY_FOR_PICKUP" && (
                      <Button
                        type="button"
                        onClick={() => handleTransitionStatus(o.id, "OUT_FOR_DELIVERY")}
                        className="h-9 px-4 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                      >
                        <PackageCheck className="size-3.5" />
                        <span>Handover to Rider (PIN {o.pickupPin})</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Mandatory Rejection Reason Logging Modal/Drawer */}
                {rejectingOrderId === o.id && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-4 space-y-3">
                    <div className="text-xs font-bold text-rose-300">
                      Mandatory Rejection Reason (Logged to Immutable Audit Trail)
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Item out of stock for current shift",
                        "Kitchen tandoor/equipment maintenance",
                        "Closing time reached / staff unavailable",
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setRejectReasonInput(preset)}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        value={rejectReasonInput}
                        onChange={(e) => setRejectReasonInput(e.target.value)}
                        placeholder="Enter exact reason for rejecting this order..."
                        className="h-9 bg-slate-950 border-slate-700 text-white text-xs"
                      />
                      <Button
                        type="button"
                        onClick={() => handleConfirmReject(o.id)}
                        className="h-9 px-4 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shrink-0"
                      >
                        Confirm Reject &amp; Log
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setRejectingOrderId(null)}
                        className="h-9 px-3 border-slate-700 bg-slate-900 text-slate-300 text-xs rounded-xl shrink-0"
                      >
                        Cancel
                      </Button>
                    </div>
                    {rejectError && <div className="text-xs text-rose-400 font-semibold">{rejectError}</div>}
                  </div>
                )}

                {o.status === "REJECTED" && o.rejectionReason && (
                  <div className="text-xs text-rose-300 bg-rose-950/30 border border-rose-500/30 rounded-lg px-3 py-2">
                    Logged Rejection Reason: <strong>{o.rejectionReason}</strong>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </VendorShell>
  );
}
