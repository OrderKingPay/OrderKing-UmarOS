import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import {
  formatPaise,
  generateUpiDepositIntent,
  generateUpiQrUrl,
  COD_DEFAULT_TREASURY_VPA,
} from "@/lib/rider/money";
import { getHomeFn, depositFloatingCashFn } from "@/lib/server/rider-fns";
import { newIdempotencyKey } from "@/lib/client/errors";
import {
  ArrowLeft,
  Copy,
  QrCode,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRiderCustomization } from "@/lib/rider/use-rider-customization";

export const Route = createFileRoute("/wallet")({ component: WalletPage });

type HomeData = Awaited<ReturnType<typeof getHomeFn>>;

export function WalletPage() {
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
      toast.success(`Deposit of ₹${amountRupees} confirmed. In-hand cash cleared.`);
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
      toast.success("UPI VPA copied to clipboard");
    }
  }

  return (
    <AppShell>
      <div className="space-y-4 max-w-md mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Link
              to="/"
              className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-card hover:bg-muted transition"
              aria-label="Back to Duty"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <h1 className="font-display text-2xl font-bold">Pocket</h1>
              <p className="text-xs text-muted-foreground">In-hand cash from cash on delivery orders</p>
            </div>
          </div>
          <Link
            to="/earnings"
            className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold hover:bg-muted transition"
          >
            Earnings
          </Link>
        </div>

        {/* Pocket Balance Card */}
        <Card className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                In-Hand Cash
              </span>
              <p className={`text-3xl font-black font-mono tracking-tight mt-0.5 ${isBlocked ? "text-amber-600" : "text-foreground"}`}>
                {formatPaise(unreconciledPaise)}
              </p>
            </div>
            <Badge tone={isBlocked ? "busy" : isSoftWarning ? "busy" : "online"} className="text-xs">
              {isBlocked ? "Limit Reached" : isSoftWarning ? "Near Limit" : "Limit Available"}
            </Badge>
          </div>

          <div className="space-y-1.5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full transition-all duration-300 ${isBlocked ? "bg-amber-600" : isSoftWarning ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(100, utilizationPct)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Limit: ₹{(limitPaise / 100).toLocaleString("en-IN")}</span>
              <span>Available: {formatPaise(remainingPaise)}</span>
            </div>
          </div>

          {isBlocked ? (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-950 dark:text-amber-200">
              <p className="font-bold">Cash limit reached</p>
              <p className="text-[11px] mt-0.5 text-muted-foreground">Deposit cash to continue receiving cash on delivery orders.</p>
            </div>
          ) : null}
        </Card>

        {/* Deposit Cash Card */}
        <Card className="space-y-3.5 p-5">
          <CardTitle className="text-base font-bold">Deposit Cash</CardTitle>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium">Select Amount</label>
            <div className="grid grid-cols-4 gap-2">
              {[500, 1000, 1500, Math.max(100, Math.ceil(unreconciledPaise / 100))].map((amt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setQuickAmountRupees(amt)}
                  className={`rounded-xl border py-2 text-xs font-mono font-bold transition ${quickAmountRupees === amt
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-xs"
                      : "border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  ₹{amt}
                  {idx === 3 && unreconciledPaise > 0 ? " (Full)" : ""}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <a
              href={upiIntentUri}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 text-xs shadow-xs transition"
            >
              <Zap className="size-4" />
              <span>Pay ₹{quickAmountRupees} via UPI</span>
            </a>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setShowQrModal(true)}
              className="shrink-0 rounded-xl px-3"
              title="Show QR Code"
            >
              <QrCode className="size-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            disabled={depositingQuick}
            onClick={() => void handleQuickDeposit(quickAmountRupees)}
            className="w-full text-xs text-muted-foreground hover:text-foreground"
          >
            {depositingQuick ? "Confirming..." : `Tap here if already paid ₹${quickAmountRupees} to confirm`}
          </Button>

          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1 pt-1 border-t border-border">
            <span>UPI VPA: <strong className="font-mono text-foreground">{treasuryVpa}</strong></span>
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
        </Card>

        <p className="text-center text-[11px] text-muted-foreground">
          In-hand cash is automatically adjusted in your weekly Wednesday payout.
        </p>

        {/* QR Code Modal */}
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4 text-center">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-display text-base font-bold text-foreground">
                  Scan QR to Deposit Cash
                </h3>
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
                >
                  <X className="size-4" />
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
                <p className="mt-3 text-sm font-bold text-foreground">
                  ₹{quickAmountRupees}.00
                </p>
                <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                  {treasuryVpa}
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
                  {depositingQuick ? "Confirming..." : "I Have Paid"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
