import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatPaise } from "@/lib/rider/money";
import { depositFloatingCashFn } from "@/lib/server/rider-fns";
import { newIdempotencyKey } from "@/lib/client/errors";
import type { PocketBalanceInfo, RiderDisciplineConfig } from "@/lib/rider/types";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Copy,
  CreditCard,
  QrCode,
  ShieldAlert,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";

export function FloatingCashCard({
  pocketBalance,
  disciplineConfig,
  onRefresh,
  externalModalOpen,
  onExternalModalClose,
}: {
  pocketBalance: PocketBalanceInfo;
  disciplineConfig?: RiderDisciplineConfig;
  onRefresh?: () => void;
  externalModalOpen?: boolean;
  onExternalModalClose?: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (externalModalOpen) {
      setModalOpen(true);
    }
  }, [externalModalOpen]);

  const closeModal = () => {
    setModalOpen(false);
    onExternalModalClose?.();
  };
  const [depositAmountRupees, setDepositAmountRupees] = useState<number>(() =>
    Math.max(100, Math.ceil(pocketBalance.pocketBalancePaise / 100)),
  );
  const [method, setMethod] = useState<"UPI_QR" | "RAZORPAY">("UPI_QR");
  const [depositing, setDepositing] = useState(false);

  const vpa = disciplineConfig?.upiDepositVpa || "orderking.treasury@okaxis";
  const limitInr = Math.round(pocketBalance.limitPaise / 100);
  const balanceInr = (pocketBalance.pocketBalancePaise / 100).toFixed(2);
  const isBlocked = pocketBalance.isCodBlocked;

  // Generate standard NPCI UPI Intent URI
  const upiIntent = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=OrderKing%20Treasury&am=${depositAmountRupees}&cu=INR&tn=FloatDeposit_${Date.now().toString(36)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiIntent)}`;

  async function handleConfirmDeposit() {
    if (depositAmountRupees <= 0) {
      toast.error("Please enter a valid deposit amount.");
      return;
    }
    setDepositing(true);
    try {
      const amountPaise = depositAmountRupees * 100;
      await depositFloatingCashFn({
        data: {
          amountPaise,
          method,
          reference: `${method}-${Date.now().toString(36).toUpperCase()}`,
          idempotencyKey: newIdempotencyKey(),
        },
      });
      toast.success(`Floating cash deposit of ₹${depositAmountRupees} verified! COD orders active.`);
      closeModal();
      onRefresh?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Deposit verification failed";
      toast.error(msg);
    } finally {
      setDepositing(false);
    }
  }

  function copyUpiVpa() {
    navigator.clipboard?.writeText(vpa);
    toast.success("UPI VPA copied to clipboard!");
  }

  return (
    <>
      <Card
        className={`border p-4 transition-all ${
          isBlocked
            ? "border-rose-400 bg-rose-50/70 dark:border-rose-900/60 dark:bg-rose-950/20"
            : pocketBalance.utilizationPct >= 75
              ? "border-amber-400 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20"
              : "border-border bg-card"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex size-10 items-center justify-center rounded-xl shadow-xs ${
                isBlocked
                  ? "bg-rose-600 text-white"
                  : pocketBalance.utilizationPct >= 75
                    ? "bg-amber-500 text-white"
                    : "bg-primary text-primary-foreground"
              }`}
            >
              <Wallet className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold tracking-tight">
                  Floating Cash (Pocket Balance)
                </CardTitle>
                {isBlocked ? (
                  <Badge tone="busy" className="bg-rose-600 text-white font-semibold">
                    COD Blocked
                  </Badge>
                ) : (
                  <Badge tone="online" className="text-[10px]">
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Partner COD Cash Holding Limit: ₹{limitInr.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="font-mono text-lg font-extrabold text-foreground">
              ₹{balanceInr}
            </span>
            <p className="text-[11px] text-muted-foreground font-mono">
              / ₹{limitInr.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Utilization Progress Bar */}
        <div className="mt-3 space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all duration-500 ${
                isBlocked
                  ? "bg-rose-600"
                  : pocketBalance.utilizationPct >= 75
                    ? "bg-amber-500"
                    : "bg-emerald-600"
              }`}
              style={{ width: `${Math.min(100, pocketBalance.utilizationPct)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{pocketBalance.utilizationPct}% limit utilized</span>
            <span>
              {isBlocked
                ? "Cap exceeded! Deposit cash to receive COD orders."
                : `₹${((pocketBalance.limitPaise - pocketBalance.pocketBalancePaise) / 100).toFixed(0)} remaining headroom`}
            </span>
          </div>
        </div>

        {/* Warning Alert if Blocked or Near Limit */}
        {isBlocked ? (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-100/80 p-2.5 text-xs text-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
            <ShieldAlert className="size-4 shrink-0 text-rose-600" />
            <span>
              <strong>COD Orders Paused:</strong> Your physical cash balance reached ₹{balanceInr}.
              Deposit floating cash to instantly unblock cash deliveries.
            </span>
          </div>
        ) : pocketBalance.utilizationPct >= 75 ? (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-100/80 p-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertTriangle className="size-4 shrink-0 text-amber-600" />
            <span>
              Approaching floating limit. Deposit cash soon to avoid COD order disruption.
            </span>
          </div>
        ) : null}

        {/* Quick Deposit Action Button */}
        <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            Offset in Wednesday payout or deposit anytime
          </span>
          <Button
            size="sm"
            variant={isBlocked ? "default" : "outline"}
            className={isBlocked ? "bg-rose-600 hover:bg-rose-700 text-white font-bold" : ""}
            onClick={() => setModalOpen(true)}
          >
            <QrCode className="mr-1.5 size-3.5" />
            Deposit via UPI / Gateway
          </Button>
        </div>
      </Card>

      {/* Floating Cash Deposit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="size-5 text-primary" />
                <h3 className="font-display text-base font-bold text-foreground">
                  Deposit Floating Cash (Pocket Balance)
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Deposit COD cash collected from customers directly to OrderKing Treasury via dynamic
              UPI QR or Gateway. Your floating balance clears in real-time.
            </p>

            {/* Quick Amount Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Deposit Amount (₹)</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={10}
                  value={depositAmountRupees}
                  onChange={(e) => setDepositAmountRupees(Math.max(0, Number(e.target.value)))}
                  className="font-mono text-base font-bold"
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {[500, 1000, 1500, Math.ceil(pocketBalance.pocketBalancePaise / 100)].map(
                  (preset) =>
                    preset > 0 && (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setDepositAmountRupees(preset)}
                        className={`rounded-md border px-2.5 py-1 text-xs font-mono font-medium transition ${
                          depositAmountRupees === preset
                            ? "border-primary bg-primary/10 text-primary font-bold"
                            : "border-border hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        ₹{preset}
                      </button>
                    ),
                )}
              </div>
            </div>

            {/* Payment Method Switcher */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMethod("UPI_QR")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition ${
                  method === "UPI_QR"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <QrCode className="size-4" />
                <span>Instant UPI QR</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod("RAZORPAY")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition ${
                  method === "RAZORPAY"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <CreditCard className="size-4" />
                <span>Razorpay / Cards</span>
              </button>
            </div>

            {/* UPI QR Display View */}
            {method === "UPI_QR" ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <div className="size-44 rounded-xl border-2 border-primary/20 bg-white p-2 shadow-xs">
                  <img
                    src={qrCodeUrl}
                    alt="Scan UPI QR"
                    className="size-full object-contain"
                  />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs font-semibold text-foreground">
                    Scan with PhonePe, GPay, Paytm, or BHIM
                  </p>
                  <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-muted-foreground">
                    <span>VPA: {vpa}</span>
                    <button
                      type="button"
                      onClick={copyUpiVpa}
                      className="text-primary hover:underline"
                    >
                      <Copy className="size-3 inline" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Razorpay / KingPay Gateway Deposit</p>
                <p>
                  Deposit through Netbanking, UPI, Debit Card, or Corporate VPA. Receipts are logged
                  instantly in your Settlement Ledger.
                </p>
              </div>
            )}

            {/* Confirm Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                disabled={depositing || depositAmountRupees <= 0}
                onClick={handleConfirmDeposit}
              >
                {depositing ? (
                  "Verifying..."
                ) : (
                  <>
                    <CheckCircle2 className="mr-1.5 size-4" />
                    Confirm Deposit of ₹{depositAmountRupees}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
