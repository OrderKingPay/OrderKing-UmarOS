import { useEffect, useState, useMemo } from "react";
import { CheckCircle2, Clock, AlertCircle, ShieldAlert, Sparkles, ChefHat, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  calculateGraceTimeRemaining,
  calculateRefundDetails,
  GRACE_WINDOW_SECONDS,
} from "@/lib/orders/cancellation";
import { formatPaise } from "@/lib/money";

interface CancellationGraceWindowProps {
  placedAt: string | Date | number;
  orderId: string;
  orderPublicId?: string;
  status: string;
  paymentMethod: string;
  totalPaise: number;
  locale?: string;
  isCancelling?: boolean;
  onCancel: () => void;
  onWindowExpire?: () => void;
  className?: string;
}

export function CancellationGraceWindow({
  placedAt,
  orderId,
  orderPublicId,
  status,
  paymentMethod,
  totalPaise,
  locale = "en-IN",
  isCancelling = false,
  onCancel,
  onWindowExpire,
  className = "",
}: CancellationGraceWindowProps) {
  const [now, setNow] = useState(Date.now());
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const countdown = useMemo(
    () => calculateGraceTimeRemaining(placedAt, now, GRACE_WINDOW_SECONDS),
    [placedAt, now]
  );

  const refundDetails = useMemo(
    () => calculateRefundDetails({ totalPaise, paymentMethod }, countdown.isWithinGraceWindow),
    [totalPaise, paymentMethod, countdown.isWithinGraceWindow]
  );

  useEffect(() => {
    if (countdown.secondsRemaining === 0 && onWindowExpire && (status === "PLACED" || status === "AUTO_ACCEPTED")) {
      onWindowExpire();
    }
  }, [countdown.secondsRemaining, onWindowExpire, status]);

  // SVG circular properties
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (countdown.percentRemaining / 100) * circumference;

  const isCancelled = status === "CANCELLED_BY_CUSTOMER" || status === "CANCELLED";

  // If order was cancelled
  if (isCancelled) {
    return (
      <div
        className={`rounded-3xl border-2 border-rose-300 bg-gradient-to-br from-rose-50 via-white to-amber-50/30 p-5 shadow-lg ${className}`}
        data-testid="cancelled-refund-banner"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/30 text-2xl">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-black text-rose-950">
                Order Cancelled · 100% Refund Issued
              </h3>
              <span className="rounded-full bg-rose-100 border border-rose-300 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-800">
                Zero Dispute
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-0.5">
              {paymentMethod === "COD"
                ? "Cancelled before kitchen confirmation. No collection required."
                : `₹${(totalPaise / 100).toFixed(2)} refunded instantly to your KingPay Wallet/UPI.`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If 60s has expired
  if (!countdown.isWithinGraceWindow || (status !== "PLACED" && status !== "AUTO_ACCEPTED")) {
    return (
      <div
        className={`rounded-3xl border border-emerald-400/60 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 p-4 shadow-sm animate-in fade-in transition-all ${className}`}
        data-testid="order-confirmed-kitchen"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-500/20 text-lg">
              <ChefHat className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-sm font-black text-emerald-950">
                  Order Confirmed by Kitchen
                </h3>
                <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800">
                  Accepted
                </span>
              </div>
              <p className="text-[11px] text-stone-600 mt-0.5">
                The restaurant kitchen is preparing your dishes with fresh ingredients.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-black text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
            Cooking 🍳
          </span>
        </div>
      </div>
    );
  }

  // Active 60-Second Grace Window
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border-2 border-amber-400/80 bg-gradient-to-br from-amber-500/15 via-white to-orange-500/10 p-5 shadow-[0_10px_35px_rgba(245,158,11,0.15)] ${className}`}
      data-testid="cancellation-grace-window"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Animated Circular Countdown Timer */}
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex size-20 shrink-0 items-center justify-center">
            <svg className="size-20 -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="stroke-amber-200/80 fill-none"
                strokeWidth="5"
              />
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="fill-none stroke-amber-500 transition-all duration-500 ease-linear"
                strokeWidth="5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span
                className="font-mono text-xl font-black tabular-nums text-stone-900 leading-none"
                data-testid="grace-seconds-remaining"
              >
                {countdown.secondsRemaining}s
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 mt-0.5">
                Grace
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-950 uppercase tracking-wide">
                <span>⏱️</span>
                <span>60-Second Order Cancellation Grace Window</span>
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-1 max-w-md">
              Changed your mind or placed by mistake? Cancel within the grace window for an
              <span className="font-extrabold text-stone-900"> instant 100% refund</span>. standard fees, zero kitchen dispute.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="w-full sm:w-auto shrink-0">
          <Button
            type="button"
            variant="danger"
            size="md"
            disabled={isCancelling}
            onClick={() => setShowConfirmModal(true)}
            data-testid="cancel-order-grace-button"
            className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-rose-500 via-red-600 to-rose-600 hover:from-rose-600 hover:to-red-700 text-white font-black px-5 py-3 shadow-md shadow-rose-500/25 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 border border-rose-400"
          >
            {isCancelling ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                <span>Processing 100% Refund...</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>Cancel Order (100% Refund)</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border-2 border-rose-300 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 text-2xl">
                ⚠️
              </div>
              <div>
                <h3 className="font-display text-lg font-black text-stone-900">
                  Cancel Order with 100% Refund?
                </h3>
                <p className="text-xs text-stone-600">
                  {countdown.secondsRemaining}s remaining in grace window
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-950 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <span>🛡️</span>
                <span>OrderKing Cancellation Protection</span>
              </p>
              <p className="text-stone-700">
                100% of {formatPaise(totalPaise, { locale })} will be credited back instantly without
                human intervention or restaurant disputes.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl font-bold"
                onClick={() => setShowConfirmModal(false)}
                disabled={isCancelling}
              >
                Keep Order
              </Button>
              <Button
                type="button"
                variant="danger"
                className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-black"
                disabled={isCancelling}
                onClick={() => {
                  setShowConfirmModal(false);
                  onCancel();
                }}
              >
                {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
