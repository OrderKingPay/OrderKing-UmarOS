import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardMeta, CardTitle } from "@/components/ui/card";
import { FloatingCashCard } from "@/components/rider/floating-cash-card";
import {
  formatPaise,
  OPERATIONAL_TIERS,
  getOperationalTier,
  generateUpiDepositIntent,
  generateUpiQrUrl,
  COD_DEFAULT_TREASURY_VPA,
  computeNextWednesdaySettlementIst,
  COD_FLOATING_CASH_LIMIT_INR,
  type OperationalTier,
} from "@/lib/rider/money";
import { getHomeFn, depositFloatingCashFn } from "@/lib/server/rider-fns";
import { newIdempotencyKey } from "@/lib/client/errors";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Crown,
  HelpCircle,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useRiderCustomization } from "@/lib/rider/use-rider-customization";

export const Route = createFileRoute("/wallet")({ component: WalletPage });

type HomeData = Awaited<ReturnType<typeof getHomeFn>>;

function WalletPage() {
  const { cod } = useRiderCustomization();
  const [home, setHome] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickAmountRupees, setQuickAmountRupees] = useState<number>(500);
  const [depositingQuick, setDepositingQuick] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const data = await getHomeFn();
      setHome(data);
    } catch {
      /* fallback on error */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const unreconciledPaise = home?.pocketBalance?.pocketBalancePaise ?? home?.pendingCashPaise ?? 0;
  const limitPaise = home?.disciplineConfig?.floatingCashLimitInr
    ? home.disciplineConfig.floatingCashLimitInr * 100
    : home?.pocketBalance?.limitPaise ?? cod.hardLockPaise;
  const isBlocked = home?.pocketBalance?.isCodBlocked ?? (unreconciledPaise >= limitPaise);
  const isSoftWarning =
    !isBlocked &&
    (unreconciledPaise >= cod.softWarningPaise ||
      (unreconciledPaise / Math.max(1, limitPaise)) * 100 >= cod.warningThresholdPct);
  const utilizationPct =
    home?.pocketBalance?.utilizationPct ??
    Math.min(100, Math.round((unreconciledPaise / Math.max(1, limitPaise)) * 100));
  const remainingPaise = Math.max(0, limitPaise - unreconciledPaise);

  const lifetimeTrips = home?.rider?.lifetimeDeliveries ?? home?.completedToday ?? 0;
  const currentTier = getOperationalTier(lifetimeTrips);
  const nextSettlement = useMemo(() => computeNextWednesdaySettlementIst(), []);

  const treasuryVpa = home?.disciplineConfig?.upiDepositVpa || COD_DEFAULT_TREASURY_VPA;
  const upiIntentUri = generateUpiDepositIntent(quickAmountRupees, treasuryVpa, "FloatDeposit");
  const upiQrCodeUrl = generateUpiQrUrl(quickAmountRupees, treasuryVpa, "FloatDeposit", 220);

  async function handleQuickDeposit(amountRupees: number) {
    if (amountRupees <= 0) {
      toast.error("Please enter a valid deposit amount.");
      return;
    }
    setDepositingQuick(true);
    try {
      const amountPaise = amountRupees * 100;
      await depositFloatingCashFn({
        data: {
          amountPaise,
          method: "UPI_QR",
          reference: `UPI-1TAP-${Date.now().toString(36).toUpperCase()}`,
          idempotencyKey: newIdempotencyKey(),
        },
      });
      toast.success(`✓ Instant UPI deposit of ₹${amountRupees} verified! Floating cash cleared.`);
      setShowQrModal(false);
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Deposit verification failed";
      toast.error(msg);
    } finally {
      setDepositingQuick(false);
    }
  }

  function copyVpa() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(treasuryVpa).catch(() => undefined);
      toast.success("Treasury UPI VPA copied to clipboard!");
    }
  }

  return (
    <AppShell>
      <div className="space-y-6 font-sans">
        {/* Header */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Link
                to="/"
                className="inline-flex size-9 items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground hover:bg-muted transition"
                title="Back to Dashboard"
              >
                <ArrowLeft className="size-4" />
              </Link>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="size-3.5" />
                    Tier-1 Discipline Architecture
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    COD Pocket Balance &amp; Treasury
                  </span>
                </div>
                <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-foreground">
                  Partner Wallet &amp; Floating Cash
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link to="/settlements">
                <Button variant="outline" size="sm">
                  Settlements Ledger
                </Button>
              </Link>
              <Link to="/earnings">
                <Button variant="outline" size="sm">
                  Earnings Breakdown
                </Button>
              </Link>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Manage your in-hand physical cash collected from Cash-on-Delivery (COD) orders.
            OrderKing fleet architecture enforces a strict <strong>₹{(limitPaise / 100).toLocaleString("en-IN")} hard lock</strong> (Soft warning at ₹{(cod.softWarningPaise / 100).toLocaleString("en-IN")}).
            If your balance reaches ₹{(limitPaise / 100).toLocaleString("en-IN")}, new COD dispatch offers are paused until settled via
            1-tap instant UPI QR or weekly automated Wednesday settlement offset.
          </p>
        </div>

        {/* Floating Cash / Pocket Balance Card with Dynamic UPI QR & Intent */}
        <FloatingCashCard
          pocketBalance={
            home?.pocketBalance ?? {
              collectedPaise: unreconciledPaise,
              reconciledPaise: 0,
              pocketBalancePaise: unreconciledPaise,
              limitPaise,
              isCodBlocked: isBlocked,
              canAcceptCod: !isBlocked,
              utilizationPct,
            }
          }
          disciplineConfig={home?.disciplineConfig}
          onRefresh={loadData}
          lifetimeDeliveries={lifetimeTrips}
          riderName={home?.rider?.fullName}
        />

        {/* 3 Overview Metric Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 space-y-1.5 border-border">
            <span className="text-xs font-semibold text-muted-foreground">Current In-Hand Cash</span>
            <div className="text-2xl font-extrabold font-mono text-foreground">
              {formatPaise(unreconciledPaise)}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Physically collected from completed COD orders
            </p>
          </Card>

          <Card className="p-4 space-y-1.5 border-border">
            <span className="text-xs font-semibold text-muted-foreground">COD Float Ceiling</span>
            <div className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              ₹{(limitPaise / 100).toLocaleString("en-IN")}.00
            </div>
            <p className="text-[11px] text-muted-foreground">
              Hard lock: ₹{(limitPaise / 100).toLocaleString("en-IN")} · Soft warning: ₹{(cod.softWarningPaise / 100).toLocaleString("en-IN")}
            </p>
          </Card>

          <Card className="p-4 space-y-1.5 border-border">
            <span className="text-xs font-semibold text-muted-foreground">Remaining COD Headroom</span>
            <div className={`text-2xl font-extrabold font-mono ${isBlocked ? "text-rose-600" : "text-foreground"}`}>
              {formatPaise(remainingPaise)}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {isBlocked ? "Threshold exceeded! Deposit via UPI to unblock." : "Available capacity for cash orders"}
            </p>
          </Card>
        </div>

        {/* 1-Tap Instant UPI QR Deposit Hub */}
        <Card className="p-5 border-border space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <QrCode className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  1-Tap Instant UPI Float Clearing
                  <Badge tone="online" className="text-[10px]">Instant Real-Time</Badge>
                </CardTitle>
                <CardMeta>
                  Scan dynamic QR or open directly in PhonePe / GPay / Paytm / BHIM to clear float balance
                </CardMeta>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowQrModal(true)}
              className="inline-flex items-center gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
            >
              <QrCode className="size-3.5" />
              <span>Show Dynamic UPI QR</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 items-center">
            {/* Quick Amount Selector */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-foreground block">
                Quick Deposit Presets (₹):
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  500,
                  1000,
                  1500,
                  Math.max(100, Math.ceil(unreconciledPaise / 100)),
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQuickAmountRupees(preset)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-mono font-bold transition ${
                      quickAmountRupees === preset
                        ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-xs"
                        : "border-border bg-card hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    ₹{preset.toLocaleString("en-IN")}
                    {preset === Math.ceil(unreconciledPaise / 100) && unreconciledPaise > 0 ? " (Full Float)" : ""}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <span>VPA: <strong className="font-mono text-foreground">{treasuryVpa}</strong></span>
                <button
                  type="button"
                  onClick={copyVpa}
                  className="text-primary hover:underline ml-1 inline-flex items-center gap-0.5"
                  title="Copy UPI VPA"
                >
                  <Copy className="size-3" />
                  <span>Copy</span>
                </button>
              </p>
            </div>

            {/* 1-Tap Trigger Action */}
            <div className="flex flex-col gap-2">
              <a
                href={upiIntentUri}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 text-xs shadow-xs transition"
              >
                <Zap className="size-4" />
                <span>1-Tap Open UPI App (₹{quickAmountRupees})</span>
              </a>
              <Button
                variant="outline"
                size="sm"
                disabled={depositingQuick}
                onClick={() => void handleQuickDeposit(quickAmountRupees)}
                className="w-full text-xs font-semibold"
              >
                {depositingQuick ? "Verifying Deposit..." : `Confirm Paid ₹${quickAmountRupees}`}
              </Button>
            </div>
          </div>
        </Card>

        {/* Clean Operational Tiers: Bronze, Silver, Gold, Diamond */}
        <Card className="p-5 border-border space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Crown className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  Courier Operational Tiers
                  <Badge tone="online" className="text-[10px]">
                    Current: {currentTier.title}
                  </Badge>
                </CardTitle>
                <CardMeta>
                  Clean operational tier hierarchy: Bronze, Silver, Gold, Diamond (Standard logistics model)
                </CardMeta>
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="font-semibold text-foreground">Verified Deliveries: </span>
              <span className="font-mono font-bold text-primary">{lifetimeTrips} Trips</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {(Object.keys(OPERATIONAL_TIERS) as OperationalTier[]).map((tierKey) => {
              const info = OPERATIONAL_TIERS[tierKey];
              const isCurrent = currentTier.tier === tierKey;
              return (
                <div
                  key={tierKey}
                  className={`rounded-xl border p-4 space-y-2.5 transition ${
                    isCurrent
                      ? "border-emerald-500/80 bg-emerald-500/5 shadow-xs ring-1 ring-emerald-500/30"
                      : "border-border bg-card/60 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold uppercase tracking-wider ${isCurrent ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                      {info.title}
                    </span>
                    {isCurrent && (
                      <Badge tone="online" className="text-[10px]">
                        Active Tier
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min Trips:</span>
                      <span className="font-bold font-mono text-foreground">{info.minTripsLifetime}+</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">COD Float Cap:</span>
                      <span className="font-bold font-mono text-foreground">₹{(info.floatingCashLimitPaise / 100).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Surge Multiplier:</span>
                      <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{info.surgeMultiplier}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fuel Discount:</span>
                      <span className="font-bold font-mono text-foreground">{info.fuelCashbackPct}%</span>
                    </div>
                  </div>

                  <ul className="text-[11px] space-y-1 pt-1 border-t border-border/60 list-disc pl-3 text-muted-foreground">
                    {info.perks.slice(0, 2).map((perk) => (
                      <li key={perk}>{perk}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Weekly Wednesday Settlement Architecture */}
        <Card className="p-5 space-y-3 border-border">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            Weekly Wednesday Settlement Cycle
          </CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground leading-relaxed">
            <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-1.5">
              <strong className="text-foreground block font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-600" />
                1. Mon 00:00:00 to Sun 23:59:59 Window
              </strong>
              <span>
                All orders completed between Monday 00:00:00 and Sunday 23:59:59 are finalized into
                the weekly cycle. Net earnings are settled automatically every <strong>Wednesday afternoon at 14:00 IST</strong> via
                automated NEFT/IMPS directly to your verified bank account or UPI mandate.
              </span>
            </div>
            <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-1.5">
              <strong className="text-foreground block font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-600" />
                2. Automatic Floating Cash Offset
              </strong>
              <span>
                Any physical COD cash in hand at cycle close is automatically offset against your
                delivery earnings, incentives, and 100% tips. Next scheduled settlement:{" "}
                <strong className="text-foreground">{nextSettlement.formattedDate} at 14:00 IST</strong>.
              </span>
            </div>
          </div>
        </Card>

        {/* QR Code Modal */}
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4 text-center">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-display text-base font-bold text-foreground">
                  Scan UPI QR to Clear Float
                </h3>
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col items-center justify-center p-2">
                <div className="size-48 rounded-xl border-2 border-primary/20 bg-white p-2 shadow-xs">
                  <img
                    src={upiQrCodeUrl}
                    alt="Scan UPI QR"
                    className="size-full object-contain"
                  />
                </div>
                <p className="mt-3 text-xs font-semibold text-foreground">
                  Amount: ₹{quickAmountRupees}.00
                </p>
                <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                  VPA: {treasuryVpa}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setShowQrModal(false)}
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  disabled={depositingQuick}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  onClick={() => void handleQuickDeposit(quickAmountRupees)}
                >
                  {depositingQuick ? "Verifying..." : "I Have Paid"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
