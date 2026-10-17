import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { depositFloatingCashFn } from "@/lib/server/rider-fns";
import { newIdempotencyKey } from "@/lib/client/errors";
import type { PocketBalanceInfo, RiderDisciplineConfig } from "@/lib/rider/types";
import { useRiderCustomization } from "@/lib/rider/use-rider-customization";
import {
  getTrustTier,
  getTrustTierProgression,
  getPoliteFloatingCashMessage,
} from "@/lib/rider/affiliate-ecosystem";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Coffee,
  Copy,
  CreditCard,
  Crown,
  ExternalLink,
  QrCode,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";

export interface FloatingCashCardProps {
  pocketBalance: PocketBalanceInfo;
  disciplineConfig?: RiderDisciplineConfig;
  onRefresh?: () => void;
  externalModalOpen?: boolean;
  onExternalModalClose?: () => void;
  lifetimeDeliveries?: number;
  riderName?: string;
  trustTier?: string;
}

export function FloatingCashCard({
  pocketBalance,
  disciplineConfig,
  onRefresh,
  externalModalOpen,
  onExternalModalClose,
  lifetimeDeliveries = 0,
  riderName,
  trustTier,
}: FloatingCashCardProps) {
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

  const { cod } = useRiderCustomization();
  const vpa = disciplineConfig?.upiDepositVpa || "orderking.treasury@okaxis";

  // Dynamic Trust Tier Resolution
  const tierConfig = getTrustTier(lifetimeDeliveries);
  const tierProgression = getTrustTierProgression(lifetimeDeliveries);

  // Effective Limit based on dynamic trust tier or discipline override
  const effectiveLimitPaise = disciplineConfig?.floatingCashLimitInr
    ? disciplineConfig.floatingCashLimitInr * 100
    : Math.max(tierConfig.floatingCashLimitPaise, pocketBalance.limitPaise || cod.hardLockPaise);
  const limitInr = Math.round(effectiveLimitPaise / 100);

  const balancePaise = pocketBalance.pocketBalancePaise;
  const balanceInr = Math.round(balancePaise / 100);

  // Polite human-style message computation
  const politeMsg = getPoliteFloatingCashMessage({
    currentBalancePaise: balancePaise,
    lifetimeDeliveries,
    disciplineConfigLimitInr: disciplineConfig?.floatingCashLimitInr,
    riderName,
    vpa,
  });

  const isBlocked = politeMsg.tone === "LIMIT_REACHED";
  const isWarning = politeMsg.tone === "SOFT_WARNING" || politeMsg.tone === "APPROACHING_LIMIT";
  const utilizationPct = politeMsg.utilizationPct;
  const headroomInr = politeMsg.headroomInr;

  const [depositAmountRupees, setDepositAmountRupees] = useState<number>(() =>
    Math.max(100, politeMsg.recommendedDepositInr || balanceInr),
  );
  const [method, setMethod] = useState<"UPI_QR" | "RAZORPAY">("UPI_QR");
  const [depositing, setDepositing] = useState(false);

  // Generate standard NPCI UPI Intent URI for 1-tap app launch
  const upiIntent = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=OrderKing%20Treasury&am=${depositAmountRupees}&cu=INR&tn=FloatDeposit_${tierConfig.tier}_${Date.now().toString(36)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiIntent)}`;

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
      toast.success(
        `Floating cash deposit of ₹${depositAmountRupees.toLocaleString("en-IN")} verified! Cash delivery requests active.`,
      );
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
    toast.success("OrderKing Treasury UPI VPA copied to clipboard!");
  }

  function launchUpiApp() {
    window.location.href = upiIntent;
  }

  return (
    <>
      <Card
        className={`border p-4 transition-all ${
          isBlocked
            ? "border-amber-400/80 bg-amber-50/70 dark:border-amber-800/60 dark:bg-amber-950/20"
            : isWarning
              ? "border-amber-300 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/15"
              : "border-border bg-card"
        }`}
      >
        {/* Card Header & Dynamic Trust Tier */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex size-10 items-center justify-center rounded-xl shadow-xs transition-colors ${
                isBlocked
                  ? "bg-amber-600 text-white"
                  : isWarning
                    ? "bg-amber-500 text-white"
                    : "bg-primary text-primary-foreground"
              }`}
            >
              {isBlocked ? <Coffee className="size-5" /> : <Wallet className="size-5" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <CardTitle className="text-sm font-bold tracking-tight">
                  {cod.labels.limitTitle || "Pocket Balance (Cash on Delivery)"}
                </CardTitle>

                {/* Trust Tier Badge */}
                <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10.5px] font-bold text-primary">
                  <Crown className="size-3 text-amber-500" />
                  {tierConfig.title}
                </span>

                {/* Polite Status Badge */}
                <Badge tone={politeMsg.badgeTone} className="text-[10px] font-semibold">
                  {politeMsg.badgeLabel}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground mt-0.5">
                Dynamic Trust Limit: ₹{limitInr.toLocaleString("en-IN")} · Reconciled every Wednesday or via UPI
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="font-mono text-lg font-extrabold text-foreground">
              ₹{balanceInr.toLocaleString("en-IN")}
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
                  ? "bg-amber-600"
                  : isWarning
                    ? "bg-amber-500"
                    : "bg-emerald-600"
              }`}
              style={{ width: `${Math.min(100, utilizationPct)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10.5px] text-muted-foreground">
            <span>{utilizationPct}% holding capacity</span>
            <span>
              {isBlocked
                ? "Safe cap reached · Relax for 2 mins & clear via UPI"
                : `₹${headroomInr.toLocaleString("en-IN")} headroom remaining`}
            </span>
          </div>
        </div>

        {/* Next Tier Progression Teaser */}
        {tierProgression.nextTier && (
          <div className="mt-2.5 flex items-center justify-between rounded-lg bg-muted/40 px-2.5 py-1.5 text-[11px] text-muted-foreground border border-border/50">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <Sparkles className="size-3.5 text-amber-500" />
              <span>Next: {tierProgression.nextTier.title}</span>
            </span>
            <span>
              Complete <strong className="text-primary font-bold">{tierProgression.deliveriesNeededForNextTier}</strong> more trips to unlock ₹{tierProgression.nextTier.floatingCashLimitInr.toLocaleString("en-IN")} limit
            </span>
          </div>
        )}

        {/* Polite Human-Style Empathic Alert Notice */}
        {isBlocked ? (
          <div className="mt-3 rounded-xl border border-amber-300 bg-amber-100/70 p-3 text-xs text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100 space-y-1.5">
            <div className="flex items-start gap-2">
              <Coffee className="size-4 shrink-0 text-amber-700 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900 dark:text-amber-200">
                  {politeMsg.headline}
                </p>
                <p className="mt-0.5 leading-relaxed text-amber-900/90 dark:text-amber-200/90">
                  {politeMsg.greetingAndStatus} {politeMsg.suggestedAction}
                </p>
              </div>
            </div>
            <div className="border-t border-amber-300/60 pt-1.5 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
              <span>{politeMsg.prepaidOrdersUninterruptedNotice}</span>
              <span className="font-semibold">{politeMsg.chaiBreakEncouragement}</span>
            </div>
          </div>
        ) : isWarning ? (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-2.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold">{politeMsg.headline}</p>
              <p className="text-muted-foreground leading-relaxed">
                {politeMsg.suggestedAction} (Prepaid deliveries continue uninterrupted).
              </p>
            </div>
          </div>
        ) : null}

        {/* Action Row */}
        <div className="mt-3 pt-2.5 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">
            Offsets in Wednesday payout · Zero penalty
          </span>
          <div className="flex items-center gap-2">
            {balanceInr > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={launchUpiApp}
                className="text-xs font-semibold"
                title="Launch installed UPI App directly on mobile"
              >
                <ExternalLink className="mr-1 size-3.5" />
                1-Tap UPI
              </Button>
            )}
            <Button
              size="sm"
              variant={isBlocked ? "default" : "outline"}
              className={
                isBlocked
                  ? "bg-amber-600 hover:bg-amber-700 text-white font-bold"
                  : "font-semibold"
              }
              onClick={() => setModalOpen(true)}
            >
              <QrCode className="mr-1.5 size-3.5" />
              Scan QR / Deposit
            </Button>
          </div>
        </div>
      </Card>

      {/* Instant Floating Cash Deposit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Wallet className="size-4" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">
                    Instant Float Clearing (UPI / Gateway)
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {tierConfig.title} · Current Balance: ₹{balanceInr.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted transition"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Deposit COD cash collected from customers directly to OrderKing Treasury via instant UPI QR or Gateway. Your floating balance clears in real-time.
            </p>

            {/* Quick Amount Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Deposit Amount (₹)</label>
              <Input
                type="number"
                min={10}
                value={depositAmountRupees}
                onChange={(e) => setDepositAmountRupees(Math.max(0, Number(e.target.value)))}
                className="font-mono text-base font-bold"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {[500, 1000, 1500, balanceInr].map(
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
                        ₹{preset.toLocaleString("en-IN")}
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
                <span>Cards / Gateway</span>
              </button>
            </div>

            {/* Method Details */}
            {method === "UPI_QR" ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                {/* 1-Tap UPI Launch Button on Mobile */}
                <Button
                  size="sm"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                  onClick={launchUpiApp}
                >
                  <ExternalLink className="mr-1.5 size-4" />
                  Pay ₹{depositAmountRupees.toLocaleString("en-IN")} via PhonePe / GPay / Paytm
                </Button>

                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>— OR scan QR below with any UPI App —</span>
                </div>

                <div className="size-44 rounded-xl border-2 border-primary/20 bg-white p-2 shadow-xs">
                  <img
                    src={qrCodeUrl}
                    alt="Scan OrderKing Treasury UPI QR"
                    className="size-full object-contain"
                  />
                </div>

                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-muted-foreground">
                    <span>VPA: {vpa}</span>
                    <button
                      type="button"
                      onClick={copyUpiVpa}
                      className="text-primary hover:underline"
                      title="Copy UPI VPA"
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
                  Deposit through Netbanking, UPI, Debit Card, or Corporate VPA. Receipts are logged instantly in your Settlement Ledger.
                </p>
              </div>
            )}

            {/* Confirm Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button variant="ghost" size="sm" onClick={closeModal}>
                Close
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
                    Verify Deposit of ₹{depositAmountRupees.toLocaleString("en-IN")}
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
