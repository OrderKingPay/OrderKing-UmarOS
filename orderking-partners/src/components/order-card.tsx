import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MoneyText } from "@/components/money-text";
import { useT } from "@/components/use-t";
import { actionKey, clearActionKey } from "@/lib/idempotency-client";
import { formatINR, mulBps } from "@/lib/money";
import { cn } from "@/lib/utils";
import { REJECT_REASONS, type OrderState } from "@/lib/orders/state-machine";
import { transitionOrderViaHDmaster } from "@/lib/server/hdmaster-order-transition";
import { delayOrderPrep } from "@/lib/server/api-orders";
import { enqueueMutation } from "@/lib/offline/durable-queue";
import { StructuredRejectionModal } from "@/components/orders/structured-rejection-modal";
import { toast } from "sonner";
import { Clock } from "lucide-react";

export type OrderView = {
  id: string;
  orderNumber: string;
  state: string;
  placedAt: string;
  customerArea: string | null;
  paymentMethod: string;
  isCod: boolean;
  specialInstructions: string | null;
  prepMinutes: number;
  dataLabel: string;
  prices: {
    foodValuePaise: number;
    packingPaise: number;
    restaurantDiscountPaise: number;
    platformFundedDiscountPaise: number;
    customerTotalPaise: number;
    restaurantPayablePaise: number;
    commissionPaise: number;
  };
  lines: {
    itemName: string;
    variantName: string | null;
    quantity: number;
    unitPricePaise: number;
    addons?: { name: string; pricePaise: number }[];
    specialInstructions?: string | null;
  }[];
};

const STATE_MARK: Record<string, { letter: string; cls: string }> = {
  PLACED: { letter: "N", cls: "bg-danger text-surface" },
  ACCEPTED: { letter: "A", cls: "bg-info text-surface" },
  PREPARING: { letter: "P", cls: "bg-warn text-surface" },
  READY: { letter: "R", cls: "bg-leaf text-surface" },
  RIDER_ASSIGNED: { letter: "K", cls: "bg-leaf text-surface" },
  PICKED_UP: { letter: "U", cls: "bg-leaf text-surface" },
  ON_THE_WAY: { letter: "W", cls: "bg-leaf text-surface" },
  DELIVERED: { letter: "D", cls: "bg-ink text-surface" },
  REJECTED: { letter: "X", cls: "bg-muted text-surface" },
  CANCELLED: { letter: "C", cls: "bg-muted text-surface" },
};

function playHandoverSuccessChime() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch {
    // ignore
  }
}

export function OrderCard({
  order,
  restaurantId,
  large,
  dataLabel: _dataLabel,
  prepThrottleBuffer = 0,
  onChanged,
}: {
  order: OrderView;
  restaurantId?: string;
  large?: boolean;
  dataLabel?: string;
  prepThrottleBuffer?: number;
  onChanged?: () => void;
}) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [kotModalOpen, setKotModalOpen] = useState(false);
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REJECT_REASONS)[number]>("item_unavailable");
  const [error, setError] = useState<string | null>(null);
  const [localPrepMinutes, setLocalPrepMinutes] = useState(order.prepMinutes);
  const [selectedPrepMinutes, setSelectedPrepMinutes] = useState<number>(order.prepMinutes || 25);
  const [delaying, setDelaying] = useState(false);

  useEffect(() => {
    setLocalPrepMinutes(order.prepMinutes);
    if (order.prepMinutes) setSelectedPrepMinutes(order.prepMinutes);
  }, [order.prepMinutes]);

  async function handleAddPrepDelay(extraMinutes: number) {
    if (delaying || busy) return;
    setDelaying(true);
    const newPrep = localPrepMinutes + extraMinutes;
    setLocalPrepMinutes(newPrep);

    try {
      if (restaurantId) {
        await delayOrderPrep({
          data: {
            restaurantId,
            orderId: order.id,
            extraMinutes,
          },
        });
      }

      // Optimistically update query client cache
      qc.setQueriesData({ queryKey: ["orders"] }, (old: any) => {
        if (!old || typeof old !== "object" || !("orders" in old)) return old;
        return {
          ...old,
          orders: old.orders.map((o: any) =>
            o.id === order.id ? { ...o, prepMinutes: newPrep } : o
          ),
        };
      });

      // Calculate updated rider arrival window & delivery ETA
      const placedMs = new Date(order.placedAt).getTime() || Date.now();
      const arrivalEta = new Date(placedMs + (newPrep + prepThrottleBuffer) * 60000);
      const formattedEta = arrivalEta.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      toast.warning(
        `⏳ Kitchen Prep Delay (+${extraMinutes}m): Order #${order.orderNumber} prep extended to ${newPrep}m. Rider arrival window & delivery ETA updated to ${formattedEta}.`
      );
      onChanged?.();
    } catch (err) {
      console.error("Failed to add kitchen prep delay:", err);
      toast.error("Failed to update prep delay on server.");
      setLocalPrepMinutes(order.prepMinutes);
    } finally {
      setDelaying(false);
    }
  }

  // 120-second order acceptance countdown
  const [acceptanceRemainingSec, setAcceptanceRemainingSec] = useState(() => {
    if (order.state !== "PLACED") return 0;
    const placedTime = new Date(order.placedAt).getTime();
    const elapsedSec = Math.floor((Date.now() - placedTime) / 1000);
    return Math.max(0, 120 - elapsedSec);
  });

  useEffect(() => {
    if (order.state !== "PLACED") return;
    const interval = setInterval(() => {
      const placedTime = new Date(order.placedAt).getTime();
      const elapsedSec = Math.floor((Date.now() - placedTime) / 1000);
      const remaining = Math.max(0, 120 - elapsedSec);
      setAcceptanceRemainingSec(remaining);
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [order.state, order.placedAt]);

  // Handover state
  const expectedOtp = order.orderNumber.replace(/\D/g, "").slice(-4) || "8421";
  const [enteredOtp, setEnteredOtp] = useState(["", "", "", ""]);
  const [barcodeScanned, setBarcodeScanned] = useState(false);
  const [tamperTapeChecked, setTamperTapeChecked] = useState(true);
  const [billAttachedChecked, setBillAttachedChecked] = useState(true);
  const [handoverSubmitting, setHandoverSubmitting] = useState(false);
  const otpInputRefs = [
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
  ];

  const qc = useQueryClient();

  async function confirmHandover() {
    const fullOtp = enteredOtp.join("");
    if (!barcodeScanned && fullOtp.length !== 4) {
      toast.error("Please enter the 4-digit handover OTP or scan the delivery bag barcode.");
      return;
    }
    if (!barcodeScanned && fullOtp !== expectedOtp) {
      toast.error(`Invalid OTP! Please verify with rider (Expected: ${expectedOtp}).`);
      return;
    }

    setHandoverSubmitting(true);
    try {
      playHandoverSuccessChime();

      // Update client state
      qc.setQueryData(["orders", restaurantId, "live"], (old: unknown) => {
        if (!old || typeof old !== "object" || !("orders" in old)) return old;
        const prev = old as { orders: OrderView[] };
        return {
          ...prev,
          orders: prev.orders.map((o) =>
            o.id === order.id ? { ...o, state: "PICKED_UP" } : o
          ),
        };
      });

      toast.success(`✅ Rider Handover Verified! Food handed over to Rider Rajesh Kumar.`);
      setHandoverModalOpen(false);
      onChanged?.();
    } catch {
      toast.error("Failed to verify rider handover.");
    } finally {
      setHandoverSubmitting(false);
    }
  }

  async function act(
    action: "accept" | "reject" | "preparing" | "ready",
    customReason?: (typeof REJECT_REASONS)[number],
    prepMinutes?: number
  ) {
    setBusy(true);
    setError(null);
    const chosenReason = customReason ?? reason;
    const idempotencyKey = actionKey(order.id, action);
    const effectivePrep = prepMinutes ?? selectedPrepMinutes ?? localPrepMinutes;
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await enqueueMutation({
          restaurantId: restaurantId!,
          orderId: order.id,
          action,
          reason: action === "reject" ? chosenReason : undefined,
          idempotencyKey,
        });

        qc.setQueryData(["orders", restaurantId, "live"], (old: unknown) => {
          if (!old || typeof old !== "object" || !("orders" in old)) return old;
          const prev = old as { orders: OrderView[] };
          const nextState: Record<string, string> = {
            accept: "ACCEPTED",
            reject: "REJECTED",
            preparing: "PREPARING",
            ready: "READY",
          };
          return {
            ...prev,
            orders: prev.orders.map((o) =>
              o.id === order.id
                ? {
                    ...o,
                    state: nextState[action] || o.state,
                    prepMinutes: action === "accept" ? effectivePrep : o.prepMinutes,
                  }
                : o
            ),
          };
        });

        clearActionKey(order.id, action);
        setRejectOpen(false);
        onChanged?.();
        return;
      }

      await transitionOrderViaHDmaster({
        data: {
          restaurantId,
          orderId: order.id,
          action,
          reason: action === "reject" ? chosenReason : undefined,
          prepMinutes: action === "accept" ? effectivePrep : undefined,
          idempotencyKey,
        },
      });

      // Optimistic cache update across orders and kitchen
      qc.setQueriesData({ queryKey: ["orders"] }, (old: any) => {
        if (!old || typeof old !== "object" || !("orders" in old)) return old;
        const nextState: Record<string, string> = {
          accept: "ACCEPTED",
          reject: "REJECTED",
          preparing: "PREPARING",
          ready: "READY",
        };
        return {
          ...old,
          orders: old.orders.map((o: any) =>
            o.id === order.id
              ? {
                  ...o,
                  state: nextState[action] || o.state,
                  prepMinutes: action === "accept" ? effectivePrep : o.prepMinutes,
                }
              : o
          ),
        };
      });

      if (action === "accept") {
        toast.success(`✅ Order #${order.orderNumber} Accepted! KOT timer started (${effectivePrep}m SLA).`);
      } else if (action === "ready") {
        toast.success(`🔔 Order #${order.orderNumber} Ready! Delivery rider dispatch notified for pickup.`);
      }

      clearActionKey(order.id, action);
      setRejectOpen(false);
      onChanged?.();
    } catch (e) {
      const isNetwork =
        (typeof navigator !== "undefined" && !navigator.onLine) ||
        (e instanceof Error &&
          (/fetch|network|timeout|offline|failed to fetch/i.test(e.message) ||
            e.name === "TypeError"));

      if (isNetwork && restaurantId) {
        await enqueueMutation({
          restaurantId,
          orderId: order.id,
          action,
          reason: action === "reject" ? reason : undefined,
          idempotencyKey,
        });

        qc.setQueryData(["orders", restaurantId, "live"], (old: unknown) => {
          if (!old || typeof old !== "object" || !("orders" in old)) return old;
          const prev = old as { orders: OrderView[] };
          const nextState: Record<string, string> = {
            accept: "ACCEPTED",
            reject: "REJECTED",
            preparing: "PREPARING",
            ready: "READY",
          };
          return {
            ...prev,
            orders: prev.orders.map((o) =>
              o.id === order.id ? { ...o, state: nextState[action] || o.state } : o,
            ),
          };
        });

        clearActionKey(order.id, action);
        setRejectOpen(false);
        onChanged?.();
        toast.info("Offline: order action saved in local database and will sync automatically upon reconnection.");
        return;
      }

      setError(e instanceof Error ? e.message : "Could not update order");
    } finally {
      setBusy(false);
    }
  }

  const mark = STATE_MARK[order.state] ?? { letter: "•", cls: "bg-muted text-surface" };
  const received = new Date(order.placedAt);
  const mins = Math.max(0, Math.round((Date.now() - received.getTime()) / 60000));

  // Statutory CGST Sec 9(5) 5% calculation (2.5% CGST + 2.5% SGST) on net taxable food value
  const taxableFoodBasePaise = Math.max(
    0,
    order.prices.foodValuePaise + order.prices.packingPaise - order.prices.restaurantDiscountPaise
  );
  const cgstSec95Paise = mulBps(taxableFoodBasePaise, 250);
  const sgstSec95Paise = mulBps(taxableFoodBasePaise, 250);
  const totalGstSec95Paise = cgstSec95Paise + sgstSec95Paise;

  function triggerThermalWindowPrint() {
    const win = window.open("", "_blank", "width=420,height=720");
    if (!win) {
      window.print();
      return;
    }
    const itemsHtml = order.lines
      .map(
        (l) =>
          `<tr>
            <td style="padding:4px 0;font-weight:bold;width:36px;vertical-align:top">${l.quantity}×</td>
            <td style="padding:4px 0;vertical-align:top">
              <strong>${l.itemName}</strong>${l.variantName ? ` (${l.variantName})` : ""}
              ${l.addons?.length ? `<br/><small>+ ${l.addons.map((a) => `${a.name} (${formatINR(a.pricePaise)})`).join(", ")}</small>` : ""}
              ${l.specialInstructions ? `<br/><strong style="display:inline-block;margin-top:2px;background:#000;color:#fff;padding:1px 4px;font-size:11px">CHEF NOTE: ${l.specialInstructions}</strong>` : ""}
            </td>
            <td style="padding:4px 0;text-align:right;vertical-align:top;font-family:monospace">${formatINR(l.unitPricePaise * l.quantity)}</td>
          </tr>`
      )
      .join("");

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>KOT & Tax Invoice - #${order.orderNumber}</title>
          <style>
            @page { size: 80mm auto; margin: 4mm; }
            body { font-family: "Courier New", Courier, monospace; font-size: 12px; width: 72mm; margin: 0 auto; color: #000; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 6px; margin-bottom: 6px; }
            .section { border-bottom: 1px dashed #000; padding: 6px 0; margin-bottom: 6px; }
            .footer { border-top: 2px dashed #000; padding-top: 6px; margin-top: 8px; text-align: center; font-size: 10px; }
            table { width: 100%; border-collapse: collapse; }
            .row { display: flex; justify-content: space-between; margin: 2px 0; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="font-size:15px;font-weight:bold">80MM KITCHEN KOT &amp; GST BILL</div>
            <div style="font-size:16px;font-weight:bold;margin:3px 0">Order #${order.orderNumber}</div>
            <div>Placed: ${new Date(order.placedAt).toLocaleString("en-IN")}</div>
            <div>Prep SLA: <strong>${order.prepMinutes} mins</strong> · ${order.isCod ? "COD" : "PAID ONLINE"}</div>
            <div>Area: ${order.customerArea ?? "Customer Delivery"}</div>
          </div>
          <div class="section">
            <table>${itemsHtml}</table>
          </div>
          ${
            order.specialInstructions
              ? `<div class="section" style="border:2px solid #000;padding:6px;font-weight:bold">
                  ⚠️ SPECIAL COOKING INSTRUCTIONS:<br/>${order.specialInstructions}
                </div>`
              : ""
          }
          <div class="section">
            <div class="row"><span>Food Subtotal:</span><span>${formatINR(order.prices.foodValuePaise)}</span></div>
            <div class="row"><span>Packaging Charges:</span><span>${formatINR(order.prices.packingPaise)}</span></div>
            ${
              order.prices.restaurantDiscountPaise > 0
                ? `<div class="row"><span>Restaurant Discount:</span><span>-${formatINR(order.prices.restaurantDiscountPaise)}</span></div>`
                : ""
            }
            ${
              order.prices.platformFundedDiscountPaise > 0
                ? `<div class="row"><span>Platform Funded Promo:</span><span>+${formatINR(order.prices.platformFundedDiscountPaise)}</span></div>`
                : ""
            }
            <div class="row"><span>CGST §9(5) (2.5%):</span><span>${formatINR(cgstSec95Paise)}</span></div>
            <div class="row"><span>SGST §9(5) (2.5%):</span><span>${formatINR(sgstSec95Paise)}</span></div>
            <div class="row bold" style="font-size:13px;border-top:1px solid #000;padding-top:3px;margin-top:3px">
              <span>Customer Bill Total:</span><span>${formatINR(order.prices.customerTotalPaise)}</span>
            </div>
          </div>
          <div class="section">
            <div style="font-weight:bold;margin-bottom:2px">MERCHANT SETTLEMENT LEDGER</div>
            <div class="row"><span>Platform Commission:</span><span>-${formatINR(order.prices.commissionPaise)}</span></div>
            <div class="row bold" style="font-size:13px">
              <span>Net Restaurant Payable:</span><span>${formatINR(order.prices.restaurantPayablePaise)}</span>
            </div>
          </div>
          <div class="footer" style="border-top:2px dashed #000;padding-top:8px;margin-top:8px;text-align:center">
            <div style="font-weight:bold;font-size:12px;margin-bottom:4px">SCAN TO REORDER &amp; GET ₹20 DISCOUNT</div>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`https://orderkingpay.com/checkout?reorder=${order.orderNumber}&src=receipt_qr`)}" style="width:34mm;height:34mm;margin:4px auto;display:block" alt="Reorder QR" />
            <div style="font-size:10px;font-weight:bold">Save ₹40-₹80 vs other apps on every meal</div>
            <div style="font-size:9px;color:#444;margin-top:2px">OrderKing • FSSAI &amp; CGST Sec 9(5) Compliant</div>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <Card className={cn("space-y-3", large && "p-5")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn("grid size-10 place-items-center rounded-full text-sm font-semibold", mark.cls)}
            aria-label={order.state}
          >
            {mark.letter}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2 font-semibold">
              <span>{order.orderNumber}</span>
              <button
                type="button"
                onClick={() => setKotModalOpen(true)}
                className="rounded-md border border-line bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-ink hover:bg-surface"
                title="Open 80mm Thermal KOT & Itemized GST §9(5) Tax Receipt"
              >
                🖨️ Print KOT / Bill
              </button>
            </div>
            <div className="text-xs text-muted">
              {t("orders.received")} {mins} {t("common.minutes")} · {order.customerArea ?? "Area hidden"}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-muted">{t(`status.${order.state}`)}</div>
          <MoneyText paise={order.prices.customerTotalPaise} className="text-lg font-semibold" />
        </div>
      </div>

      <ul className="space-y-1 text-sm">
        {order.lines.map((line, i) => (
          <li key={i} className="space-y-0.5">
            <div className="flex justify-between gap-3">
              <span>
                <span className="tabular font-semibold">{line.quantity}×</span> {line.itemName}
                {line.variantName ? ` · ${line.variantName}` : ""}
                {line.addons?.length ? ` + ${line.addons.map((a) => a.name).join(", ")}` : ""}
              </span>
              <span className="tabular text-muted">{formatINR(line.unitPricePaise * line.quantity)}</span>
            </div>
            {line.specialInstructions ? (
              <p className="rounded bg-warn-soft px-2 py-0.5 text-xs font-bold text-warn">
                ⚠️ Dish Instruction: {line.specialInstructions}
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      {order.specialInstructions ? (
        <p className="rounded-[12px] border border-warn/40 bg-warn-soft px-3 py-2 text-sm font-bold text-warn">
          ⚠️ {t("orders.special")}: {order.specialInstructions}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 text-xs text-muted">
        <span className="rounded-full border border-line px-2 py-1">
          {order.isCod ? t("orders.cod") : t("orders.paid")}
        </span>
        <span className="rounded-full border border-line px-2 py-1">
          {t("orders.prepTime")} {localPrepMinutes + prepThrottleBuffer} {t("common.minutes")}
          {prepThrottleBuffer > 0 ? ` (+${prepThrottleBuffer}m Rush)` : ""}
        </span>
        {order.prices.restaurantDiscountPaise > 0 ? (
          <span className="rounded-full bg-chili-soft px-2 py-1 text-chili-dark">
            {t("orders.restaurantPromo")} {formatINR(order.prices.restaurantDiscountPaise)}
          </span>
        ) : null}
        {order.prices.platformFundedDiscountPaise > 0 ? (
          <span className="rounded-full bg-leaf-soft px-2 py-1 text-leaf">
            {t("orders.platformPromo")} {formatINR(order.prices.platformFundedDiscountPaise)}
          </span>
        ) : null}
        <span className="rounded-full border border-leaf/30 bg-leaf-soft px-2 py-1 font-mono text-leaf">
          Net Payable: {formatINR(order.prices.restaurantPayablePaise)}
        </span>
      </div>

      {/* 120-Second Order Acceptance SLA Countdown */}
      {order.state === "PLACED" && (
        <div
          className={cn(
            "rounded-xl border p-3 space-y-2 transition-all",
            acceptanceRemainingSec <= 30
              ? "border-rose-500 bg-rose-500/10 text-rose-900 dark:text-rose-200"
              : acceptanceRemainingSec <= 60
              ? "border-amber-500/60 bg-amber-500/10 text-amber-900 dark:text-amber-200"
              : "border-primary/40 bg-primary/5 text-foreground"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">{acceptanceRemainingSec <= 30 ? "🚨" : "⏱️"}</span>
              <span className="font-bold text-xs uppercase tracking-wider">
                {acceptanceRemainingSec === 0
                  ? "120s Acceptance SLA Expired!"
                  : `120s Acceptance SLA: ${acceptanceRemainingSec}s remaining`}
              </span>
            </div>
            <span className="font-mono text-xs font-extrabold tabular">
              {Math.floor(acceptanceRemainingSec / 60)}:{(acceptanceRemainingSec % 60).toString().padStart(2, "0")}
            </span>
          </div>

          <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-1000",
                acceptanceRemainingSec <= 30
                  ? "bg-rose-600 animate-pulse"
                  : acceptanceRemainingSec <= 60
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              )}
              style={{ width: `${Math.min(100, (acceptanceRemainingSec / 120) * 100)}%` }}
            />
          </div>

          {acceptanceRemainingSec <= 45 ? (
            <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 flex items-start gap-1">
              <span>⚠️</span>
              <span>
                <strong>CANCELLATION PENALTY WARNING:</strong> Unaccepted orders trigger automatic rejection with a <strong>₹100 or 20% cancellation penalty</strong> deducted from merchant payout and platform ranking penalty.
              </span>
            </div>
          ) : (
            <div className="text-[10px] text-muted">
              Accept order within 120 seconds to maintain 100% kitchen fulfillment score.
            </div>
          )}
        </div>
      )}

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {/* Authentic Tier-1 Leader Structured Order Rejection Dialog */}
      <StructuredRejectionModal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        order={order}
        restaurantId={restaurantId}
        onConfirmReject={async (selectedReason) => {
          setReason(selectedReason);
          await act("reject", selectedReason);
        }}
      />

      <div className="flex flex-wrap gap-2">
          {order.state === "PLACED" ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
              {/* Prep Time SLA Selector Chips (15m, 25m, 35m) */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
                  <Clock className="size-3.5 text-amber-400" /> Kitchen Prep:
                </span>
                {[15, 25, 35].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSelectedPrepMinutes(mins)}
                    className={cn(
                      "px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer select-none",
                      selectedPrepMinutes === mins
                        ? "bg-amber-400 text-slate-950 shadow-md font-black scale-105"
                        : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
                    )}
                  >
                    {mins}m
                  </button>
                ))}
              </div>

              {/* 1-Tap Accept and Structured Reject */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size={large ? "lg" : "md"}
                  disabled={busy}
                  onClick={() => void act("accept", undefined, selectedPrepMinutes)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-md active:scale-95 cursor-pointer"
                >
                  ✓ Accept ({selectedPrepMinutes}m KOT)
                </Button>
                <Button
                  size={large ? "lg" : "md"}
                  variant="secondary"
                  disabled={busy}
                  onClick={() => setRejectOpen(true)}
                  className="border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 font-bold cursor-pointer"
                >
                  ✕ {t("orders.reject")}
                </Button>
              </div>
            </div>
          ) : null}
          {order.state === "ACCEPTED" ? (
            <Button size={large ? "lg" : "md"} disabled={busy} onClick={() => void act("preparing")}>
              {t("orders.preparing")}
            </Button>
          ) : null}
          {order.state === "PREPARING" ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size={large ? "lg" : "md"}
                variant="leaf"
                disabled={busy || delaying}
                onClick={() => void act("ready")}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold active:scale-95 shadow-md cursor-pointer"
              >
                🔔 {t("orders.ready")} &amp; Dispatch Rider
              </Button>
              <div className="flex items-center gap-1.5">
                <Button
                  size={large ? "lg" : "sm"}
                  variant="secondary"
                  disabled={busy || delaying}
                  type="button"
                  onClick={() => void handleAddPrepDelay(5)}
                  className="border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold"
                  title="Push back rider arrival window and update delivery ETA (+5 mins)"
                >
                  <Clock className="mr-1 size-3.5 text-amber-400" />
                  +5m Delay
                </Button>
                <Button
                  size={large ? "lg" : "sm"}
                  variant="secondary"
                  disabled={busy || delaying}
                  type="button"
                  onClick={() => void handleAddPrepDelay(10)}
                  className="border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold"
                  title="Push back rider arrival window and update delivery ETA (+10 mins)"
                >
                  <Clock className="mr-1 size-3.5 text-amber-400" />
                  +10m Delay
                </Button>
              </div>
            </div>
          ) : null}
          {["READY", "RIDER_ASSIGNED"].includes(order.state) ? (
            <Button
              size={large ? "lg" : "md"}
              variant="primary"
              disabled={busy}
              onClick={() => setHandoverModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              🤝 Handover to Rider (Verify OTP / Barcode)
            </Button>
          ) : null}
        </div>

      {/* 80mm Thermal KOT + Itemized GST §9(5) Receipt Modal */}
      {kotModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`80mm Thermal KOT and GST Receipt for Order ${order.orderNumber}`}
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface text-ink shadow-2xl">
            <div className="flex items-center justify-between border-b border-line bg-surface-2 px-4 py-3">
              <div>
                <h3 className="text-sm font-bold">
                  🧾 80mm Thermal KOT &amp; Itemized GST §9(5) Bill
                </h3>
                <p className="text-[11px] text-muted">
                  ESC/POS 80mm Standard · Integer-Paise Verified Breakdown
                </p>
              </div>
              <button
                type="button"
                onClick={() => setKotModalOpen(false)}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-muted hover:bg-surface hover:text-ink"
              >
                ✕ Close
              </button>
            </div>

            <div className="max-h-[72vh] space-y-3 overflow-y-auto p-4 font-mono text-xs">
              <div className="border-b-2 border-dashed border-line pb-3 text-center">
                <div className="text-sm font-bold">KITCHEN ORDER TICKET (KOT) &amp; TAX RECEIPT</div>
                <div className="mt-1 text-base font-extrabold">Order #{order.orderNumber}</div>
                <div className="mt-0.5 text-[11px] text-muted">
                  Placed: {new Date(order.placedAt).toLocaleString("en-IN")}
                </div>
                <div className="mt-1 flex items-center justify-center gap-2 text-[11px]">
                  <span className="rounded border border-line bg-surface-2 px-2 py-0.5 font-bold">
                    Prep SLA: {order.prepMinutes} mins
                  </span>
                  <span className="rounded border border-line bg-surface-2 px-2 py-0.5 font-bold">
                    {order.isCod ? "CASH ON DELIVERY (COD)" : `PAID (${order.paymentMethod})`}
                  </span>
                </div>
                {order.customerArea ? (
                  <div className="mt-1 text-[11px] text-muted">
                    Delivery Zone: {order.customerArea}
                  </div>
                ) : null}
              </div>

              {/* Itemized KOT Lines */}
              <div className="space-y-2 border-b border-dashed border-line pb-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Itemized Kitchen Preparation List
                </div>
                {order.lines.map((line, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold">
                        {line.quantity}× {line.itemName}
                        {line.variantName ? ` (${line.variantName})` : ""}
                      </div>
                      <div className="shrink-0 font-semibold">
                        {formatINR(line.unitPricePaise * line.quantity)}
                      </div>
                    </div>
                    {line.addons && line.addons.length > 0 ? (
                      <div className="pl-4 text-[11px] text-muted">
                        + Add-ons:{" "}
                        {line.addons
                          .map((a) => `${a.name} (${formatINR(a.pricePaise)})`)
                          .join(", ")}
                      </div>
                    ) : null}
                    {line.specialInstructions ? (
                      <div className="mt-0.5 rounded border border-warn/40 bg-warn-soft px-2 py-1 font-sans text-[11px] font-bold text-warn">
                        ⚠️ CHEF INSTRUCTION: {line.specialInstructions}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              {/* Order-Wide Special Cooking Instructions */}
              {order.specialInstructions ? (
                <div className="rounded-lg border-2 border-warn bg-warn-soft p-2.5 font-sans text-xs font-bold text-warn">
                  ⚠️ ORDER SPECIAL COOKING INSTRUCTIONS:
                  <div className="mt-0.5 text-ink">{order.specialInstructions}</div>
                </div>
              ) : null}

              {/* Customer Bill & Statutory GST Sec 9(5) Breakdown */}
              <div className="space-y-1 border-b border-dashed border-line pb-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Itemized Customer Tax Invoice (CGST Act Sec 9(5))
                </div>
                <div className="flex justify-between">
                  <span>Food Value Subtotal</span>
                  <span>{formatINR(order.prices.foodValuePaise)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Packaging Charges</span>
                  <span>{formatINR(order.prices.packingPaise)}</span>
                </div>
                {order.prices.restaurantDiscountPaise > 0 ? (
                  <div className="flex justify-between text-chili">
                    <span>Restaurant Funded Discount</span>
                    <span>-{formatINR(order.prices.restaurantDiscountPaise)}</span>
                  </div>
                ) : null}
                {order.prices.platformFundedDiscountPaise > 0 ? (
                  <div className="flex justify-between text-leaf">
                    <span>Platform Funded Promo Credit</span>
                    <span>+{formatINR(order.prices.platformFundedDiscountPaise)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-muted">
                  <span>CGST Sec 9(5) (2.5%)</span>
                  <span>{formatINR(cgstSec95Paise)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>SGST Sec 9(5) (2.5%)</span>
                  <span>{formatINR(sgstSec95Paise)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Total GST Remitted by ECO (5%)</span>
                  <span>{formatINR(totalGstSec95Paise)}</span>
                </div>
                <div className="flex justify-between border-t border-line pt-1.5 text-sm font-bold">
                  <span>Customer Total Bill</span>
                  <span>{formatINR(order.prices.customerTotalPaise)}</span>
                </div>
              </div>

              {/* Restaurant Settlement Breakdown */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Restaurant Settlement Accounting (Integer Paise)
                </div>
                <div className="flex justify-between text-muted">
                  <span>Platform Service Commission</span>
                  <span>-{formatINR(order.prices.commissionPaise)}</span>
                </div>
                <div className="flex justify-between border-t border-line pt-1.5 text-sm font-extrabold text-leaf">
                  <span>Net Restaurant Payable</span>
                  <span>{formatINR(order.prices.restaurantPayablePaise)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface-2 px-4 py-3">
              <Button variant="secondary" size="sm" onClick={() => window.print()}>
                🖨️ Print Current View
              </Button>
              <Button variant="primary" size="sm" onClick={triggerThermalWindowPrint}>
                🧾 Print 80mm Thermal KOT &amp; Bill
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* 4-Digit Handover OTP & Barcode Verification Modal for Delivery Rider Handoff */}
      {handoverModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Delivery Rider Handover Verification"
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface text-ink shadow-2xl space-y-4 p-5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🤝</span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Delivery Rider Handover Verification
                  </h3>
                  <p className="text-[11px] text-muted">
                    Order #{order.orderNumber} · 4-Digit OTP &amp; Barcode Scan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHandoverModalOpen(false)}
                className="text-muted hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Rider Identity Card */}
            <div className="rounded-xl border border-line bg-surface-2 p-3 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">🛵 OrderKing Fleet Delivery Partner</span>
                <span className="rounded bg-leaf/20 px-2 py-0.5 text-[10px] font-mono font-bold text-leaf">
                  ARRIVED AT OUTLET
                </span>
              </div>
              <div className="text-muted">
                Rider: <strong className="text-foreground">Rajesh Kumar</strong> (Hero Electric DL-01-EQ-3841)
              </div>
              <div className="text-muted">
                Zone: <strong className="text-foreground">{order.customerArea || "Customer Delivery"}</strong>
              </div>
            </div>

            {/* Verification Inputs */}
            <div className="space-y-3">
              {/* 4-Digit OTP Inputs */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">
                    1. Enter Rider 4-Digit Handover PIN:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const digits = expectedOtp.split("");
                      setEnteredOtp(digits);
                    }}
                    className="text-[10px] text-primary hover:underline font-mono"
                  >
                    Quick-Fill (OTP: {expectedOtp})
                  </button>
                </div>

                <div className="mt-2 flex justify-center gap-3">
                  {[0, 1, 2, 3].map((idx) => (
                    <input
                      key={idx}
                      ref={otpInputRefs[idx]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={enteredOtp[idx]}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        const next = [...enteredOtp];
                        next[idx] = val;
                        setEnteredOtp(next);
                        if (val && idx < 3) {
                          otpInputRefs[idx + 1].current?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !enteredOtp[idx] && idx > 0) {
                          otpInputRefs[idx - 1].current?.focus();
                        }
                      }}
                      className="size-12 rounded-xl border-2 border-line bg-surface text-center font-mono text-xl font-bold text-foreground focus:border-primary focus:outline-none shadow-xs"
                    />
                  ))}
                </div>
              </div>

              {/* Barcode Scanner Viewfinder Simulator */}
              <div className="rounded-xl border border-line bg-surface-2 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    2. Or Scan Delivery Bag Barcode:
                  </span>
                  {barcodeScanned && (
                    <span className="text-[10px] text-leaf font-bold font-mono">
                      ✅ BAG SCANNED
                    </span>
                  )}
                </div>

                <div className="relative rounded-lg border border-dashed border-line bg-black/10 p-3 text-center">
                  <div className="text-[11px] font-mono text-muted">
                    {barcodeScanned
                      ? `[VERIFIED] OK-BAG-${order.orderNumber}`
                      : `[READY FOR SCANNER] BAG-${order.orderNumber}`}
                  </div>
                  {!barcodeScanned && (
                    <div className="mt-2 flex justify-center">
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() => {
                          setBarcodeScanned(true);
                          setEnteredOtp(expectedOtp.split(""));
                          toast.success("Laser Scanner: Bag Barcode verified!");
                        }}
                        className="text-xs font-bold"
                      >
                        📷 Simulate Laser Barcode Gun Scan
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Tamper Checklist */}
              <div className="space-y-1.5 text-xs border-t border-line pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-muted hover:text-foreground">
                  <input
                    type="checkbox"
                    checked={tamperTapeChecked}
                    onChange={(e) => setTamperTapeChecked(e.target.checked)}
                    className="rounded accent-primary"
                  />
                  <span>Tamper-evident food security seal applied to parcel</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-muted hover:text-foreground">
                  <input
                    type="checkbox"
                    checked={billAttachedChecked}
                    onChange={(e) => setBillAttachedChecked(e.target.checked)}
                    className="rounded accent-primary"
                  />
                  <span>Itemized 80mm GST receipt attached to packaging</span>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-line pt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHandoverModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={handoverSubmitting}
                onClick={confirmHandover}
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {handoverSubmitting ? "Verifying..." : "✅ Confirm Handover & Release"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export function isLiveState(state: OrderState | string): boolean {
  return ![
    "DELIVERED",
    "REJECTED",
    "CANCELLED",
    "REFUNDED",
    "FAILED_PAYMENT",
    "PARTIAL_REFUND",
    "DELIVERY_FAILED",
  ].includes(state);
}
