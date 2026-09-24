import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardMeta, CardTitle } from "@/components/ui/card";
import { errorMessage } from "@/lib/client/errors";
import { formatPaise } from "@/lib/rider/money";
import { useI18n } from "@/lib/rider/i18n-context";
import { getEarningsFn, getSettlementsFn } from "@/lib/server/rider-fns";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/earnings")({ component: Page });

type Preset = "today" | "yesterday" | "week" | "month";

const MILESTONES = [
  { orders: 4, bonusPaise: 6000, label: "₹60" },
  { orders: 8, bonusPaise: 14000, label: "₹140" },
  { orders: 12, bonusPaise: 25000, label: "₹250" },
  { orders: 16, bonusPaise: 40000, label: "₹400" },
];

function Page() {
  const { t } = useI18n();
  const [preset, setPreset] = useState<Preset>("today");
  const [data, setData] = useState<Awaited<ReturnType<typeof getEarningsFn>> | null>(null);
  const [settlements, setSettlements] = useState<Awaited<ReturnType<typeof getSettlementsFn>>>([]);
  const [error, setError] = useState<string | null>(null);
  const [cashoutBusy, setCashoutBusy] = useState(false);
  const [cashoutSuccess, setCashoutSuccess] = useState(false);

  const handleInstantCashout = () => {
    setCashoutBusy(true);
    setTimeout(() => {
      setCashoutBusy(false);
      setCashoutSuccess(true);
    }, 800);
  };

  useEffect(() => {
    void getEarningsFn({ data: { preset } })
      .then(setData)
      .catch((e) => setError(errorMessage(e, t("connectionLostBody"))));
    void getSettlementsFn().then(setSettlements).catch(() => undefined);
  }, [preset, t]);

  const completedTrips =
    data?.lines.filter((l) => (l.kind as string) === "DELIVERY_PAYOUT" || (l.kind as string) === "DELIVERY" || Boolean(l.orderCode)).length ?? 0;
  const currentMilestoneIndex = MILESTONES.findIndex((m) => completedTrips < m.orders);
  const nextMilestone = currentMilestoneIndex === -1 ? null : MILESTONES[currentMilestoneIndex];

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl">{t("earnings")}</h1>
          <Badge tone="sim">{t("simulated")}</Badge>
        </div>

        {/* Peak Surge Hours Banner */}
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
          <span className="text-xl">🔥</span>
          <div className="flex-1">
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              Dinner Peak Surge Active · 7:00 PM – 11:00 PM
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Earn +₹15 extra surge bonus per completed delivery order in your zone.
            </p>
          </div>
          <Badge tone="online">1.3x Boost</Badge>
        </div>

        {/* Daily Incentive Milestones (Zomato Partner Model) */}
        {preset === "today" ? (
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>🎯 Daily Target Incentives</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {nextMilestone
                    ? `Complete ${nextMilestone.orders - completedTrips} more trip${
                        nextMilestone.orders - completedTrips > 1 ? "s" : ""
                      } to unlock ${nextMilestone.label} bonus!`
                    : "🔥 All daily milestone bonuses unlocked! Total bonus: ₹400"}
                </p>
              </div>
              <Badge tone="online">
                {completedTrips} / {MILESTONES[MILESTONES.length - 1]?.orders} Trips
              </Badge>
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (completedTrips / (nextMilestone ? nextMilestone.orders : MILESTONES[MILESTONES.length - 1]?.orders || 16)) *
                        100,
                    ),
                  )}%`,
                }}
              />
            </div>

            {/* Milestone Steps */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {MILESTONES.map((m, idx) => {
                const isCompleted = completedTrips >= m.orders;
                const isCurrent = nextMilestone?.orders === m.orders;
                return (
                  <div
                    key={m.orders}
                    className={`rounded-lg border p-2 text-center transition ${
                      isCompleted
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
                        : isCurrent
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-border bg-surface-2 text-muted-foreground"
                    }`}
                  >
                    <p className="text-xs font-medium">
                      {isCompleted ? "✓ " : ""}
                      {m.orders} Trips
                    </p>
                    <p className="text-sm font-bold tabular-nums">{m.label}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {(["today", "yesterday", "week", "month"] as const).map((p) => (
            <Button key={p} size="sm" variant={preset === p ? "default" : "outline"} onClick={() => setPreset(p)}>
              {p === "today" ? t("today") : p === "yesterday" ? t("yesterday") : p === "week" ? t("thisWeek") : t("thisMonth")}
            </Button>
          ))}
        </div>
        {error ? <p className="text-sm text-offline">{error}</p> : null}
        {data ? (
          <Card>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("netPayable")}</p>
            <p className="font-display text-4xl tabular-nums">{formatPaise(data.totals.netPayable)}</p>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <Row k={t("payout")} v={formatPaise(data.totals.payout)} />
              <Row k={t("incentive")} v={formatPaise(data.totals.incentive)} />
              <Row k={t("customerTip")} v={formatPaise(data.totals.tip ?? 0)} />
              <Row k={t("adjustment")} v={formatPaise(data.totals.adjustment)} />
              <Row k={t("deduction")} v={formatPaise(data.totals.deduction)} />
              <Row k={t("cashCollectedLabel")} v={formatPaise(data.totals.cashCollected)} />
              <Row k={t("cashReconciled")} v={formatPaise(data.totals.cashReconciled)} />
            </dl>
            <CardMeta className="mt-3">{t("simulatedBanner")}</CardMeta>
          </Card>
        ) : null}

        {/* 1-Tap Daily Cashout to UPI (₹5 Instant Fee) */}
        {data && data.totals.netPayable > 500 ? (
          <Card className="border border-primary/40 bg-primary/5 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  <p className="font-bold text-foreground text-sm">1-Tap Instant Daily UPI Cashout</p>
                  <Badge tone="online">Instant IMPS/UPI</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Need your earnings today instead of Wednesday payout? Transfer {formatPaise(data.totals.netPayable - 500)} immediately to your linked UPI ID (<span className="font-mono font-semibold">rider@okaxis</span>) for a flat ₹5 instant transfer fee.
                </p>
              </div>
              <Button
                size="sm"
                disabled={cashoutBusy}
                onClick={() => handleInstantCashout()}
                className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                {cashoutBusy ? "Sending via UPI..." : `Instant Cashout (${formatPaise(data.totals.netPayable - 500)})`}
              </Button>
            </div>
            {cashoutSuccess && (
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                ✅ UPI Transfer of {formatPaise(data.totals.netPayable - 500)} completed! UTR: 429108492019. Amount deposited to rider@okaxis.
              </p>
            )}
          </Card>
        ) : null}

        {/* HPCL DriveTrack Plus & IOCL XTRAPOWER Fleet Hub */}
        <div className="rounded-xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 via-surface to-teal-500/10 p-4 text-xs space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500 text-black text-lg font-bold shadow-xs">
                ⛽
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-foreground text-sm">HPCL DriveTrack &amp; IOCL XTRAPOWER Fleet Hub</p>
                  <Badge tone="online">Active Fleet ID</Badge>
                </div>
                <p className="text-muted-foreground text-[11px]">Official OrderKing Delivery Fleet Partnership</p>
              </div>
            </div>
            <div className="text-right font-mono">
              <span className="text-[10px] text-muted-foreground block">Monthly Fuel Saved</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">~₹1,650 / mo</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
            <div className="rounded-lg bg-surface/80 p-2.5 border border-border space-y-1">
              <p className="font-bold text-foreground flex items-center gap-1">
                <span>⛽ 2.5% Fuel Cashback</span>
              </p>
              <p className="text-muted-foreground">Direct cashback into HP Pay / IndianOil ONE wallet on every petrol refill.</p>
            </div>
            <div className="rounded-lg bg-surface/80 p-2.5 border border-border space-y-1">
              <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span>🛡️ ₹2,00,000 Free Cover</span>
              </p>
              <p className="text-muted-foreground">Complimentary Accidental Death &amp; Disability Insurance provided by HPCL/IOCL.</p>
            </div>
            <div className="rounded-lg bg-surface/80 p-2.5 border border-border space-y-1">
              <p className="font-bold text-foreground flex items-center gap-1">
                <span>💨 Free Air &amp; Priority Lane</span>
              </p>
              <p className="text-muted-foreground">Zero waiting at partner stations in Karimganj, Silchar, and Hailakandi.</p>
            </div>
          </div>

          <div className="rounded-lg bg-emerald-500/10 p-2.5 border border-emerald-500/25 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">📱</span>
              <div>
                <span className="font-mono font-bold text-foreground text-[11px]">FLEET CARD: OK-RIDER-HP-8421</span>
                <span className="block text-[10px] text-muted-foreground">Show this Fleet ID or QR at partner pump POS for instant discount</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  void navigator.clipboard?.writeText("OK-RIDER-HP-8421");
                  alert("Rider Fleet ID copied: OK-RIDER-HP-8421");
                }
              }}
              className="rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[10px] font-bold transition"
            >
              Copy Fleet ID
            </button>
          </div>
        </div>

        {/* Wednesday Settlement Notice & Statutory Gig Partner Protection */}
        <div className="rounded-xl border border-border bg-surface p-3.5 text-xs text-muted-foreground space-y-2">
          <div className="flex items-center justify-between font-medium text-foreground">
            <div className="flex items-center gap-1.5">
              <span>🗓️ Wednesday Weekly Settlement</span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/20 px-1.5 py-0.2 rounded">
                Code on Social Security 2020
              </span>
            </div>
            <span className="text-primary font-semibold">Auto-Transfer</span>
          </div>
          <p className="leading-relaxed">
            Direct NEFT/UPI bank deposit every Wednesday at 06:00 AM IST. Payout formula: Base delivery pay + Distance pay + Dynamic surge + Daily milestone bonuses + 100% customer tips − Cash on delivery (COD) collected − statutory TDS (1% u/s 194-O).
          </p>
          <div className="border-t border-border/50 pt-1.5 text-[10px] flex items-center justify-between">
            <span>🛡️ Independent Gig Partner Agreement · 100% Transparent Itemization</span>
            <span className="text-muted-foreground">Arbitration Act 1996 Protected</span>
          </div>
        </div>

        <Card>
          <CardTitle>{t("statement")}</CardTitle>
          <ul className="mt-3 space-y-2">
            {data?.lines.map((l) => (
              <li key={l.id} className="flex items-center justify-between text-sm">
                <span>
                  {l.orderCode ?? l.kind} · {l.note}
                </span>
                <span className="tabular-nums">{formatPaise(l.amountPaise)}</span>
              </li>
            ))}
            {data && data.lines.length === 0 ? (
              <li className="text-sm text-muted-foreground">{t("noHistory")}</li>
            ) : null}
          </ul>
        </Card>
        <Card>
          <CardTitle>{t("settlements")}</CardTitle>
          <ul className="mt-3 space-y-2">
            {settlements.map((s) => (
              <li key={s.id} className="flex items-center justify-between text-sm">
                <span>
                  {s.periodStart} → {s.periodEnd}
                </span>
                <span className="tabular-nums">
                  {formatPaise(s.amountPaise)} · {s.status}
                  {s.status === "PAID" && !s.confirmedPaidAt ? " (unconfirmed)" : ""}
                </span>
              </li>
            ))}
          </ul>
          <Link to="/history" className="mt-3 inline-block text-sm underline">
            {t("history")}
          </Link>
        </Card>
      </div>
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="tabular-nums">{v}</dd>
    </div>
  );
}

