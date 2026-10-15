import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardMeta, CardTitle } from "@/components/ui/card";
import { FloatingCashCard } from "@/components/rider/floating-cash-card";
import { formatPaise } from "@/lib/rider/money";
import { bootstrapRiderFn, getHomeFn } from "@/lib/server/rider-fns";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Clock,
  HelpCircle,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/wallet")({ component: WalletPage });

type HomeData = Awaited<ReturnType<typeof getHomeFn>>;

function WalletPage() {
  const [home, setHome] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

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
  const limitPaise = home?.pocketBalance?.limitPaise ?? 200000;
  const isBlocked = home?.pocketBalance?.isCodBlocked ?? (unreconciledPaise >= limitPaise);
  const utilizationPct = home?.pocketBalance?.utilizationPct ?? Math.min(100, Math.round((unreconciledPaise / limitPaise) * 100));
  const remainingPaise = Math.max(0, limitPaise - unreconciledPaise);

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
                    Zomato Discipline Architecture
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
            OrderKing fleet architecture enforces a strict <strong>₹2,000 threshold</strong>.
            If your balance exceeds ₹2,000, new COD dispatch offers are paused until settled via
            instant UPI QR or payment gateway deposit.
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
            <span className="text-xs font-semibold text-muted-foreground">COD Limit Ceiling</span>
            <div className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              ₹2,000.00
            </div>
            <p className="text-[11px] text-muted-foreground">
              Maximum cash threshold before COD dispatch pause
            </p>
          </Card>

          <Card className="p-4 space-y-1.5 border-border">
            <span className="text-xs font-semibold text-muted-foreground">Remaining COD Headroom</span>
            <div className={`text-2xl font-extrabold font-mono ${isBlocked ? "text-rose-600" : "text-foreground"}`}>
              {formatPaise(remainingPaise)}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {isBlocked ? "Limit reached! Deposit to unblock." : "Available capacity for cash orders"}
            </p>
          </Card>
        </div>

        {/* How Settlement & Deposits Work */}
        <Card className="p-5 space-y-3 border-border">
          <CardTitle className="text-base flex items-center gap-2">
            <HelpCircle className="size-4 text-primary" />
            How Floating Cash &amp; Payout Offset Works
          </CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground leading-relaxed">
            <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-1.5">
              <strong className="text-foreground block font-semibold">
                1. Automatic Wednesday Payout Offset
              </strong>
              <span>
                Any physical COD cash in hand at the end of the week is automatically offset against
                your delivery earnings, incentives, and tips in the Wednesday 06:00 AM IST payout cycle.
              </span>
            </div>
            <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-1.5">
              <strong className="text-foreground block font-semibold">
                2. Instant Mid-Shift UPI QR Deposit
              </strong>
              <span>
                If you approach or cross ₹2,000 during your shift, tap &quot;Deposit via UPI / Gateway&quot; to scan
                a dynamic UPI QR or trigger UPI Intent on PhonePe/GPay. The deposit verifies in real time,
                instantly unblocking incoming cash orders.
              </span>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
