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


function Page() {
  const { t } = useI18n();
  const [preset, setPreset] = useState<Preset>("today");
  const [data, setData] = useState<Awaited<ReturnType<typeof getEarningsFn>> | null>(null);
  const [settlements, setSettlements] = useState<Awaited<ReturnType<typeof getSettlementsFn>>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getEarningsFn({ data: { preset } })
      .then(setData)
      .catch((e: any) => setError(errorMessage(e, t("connectionLostBody"))));
    void getSettlementsFn().then(setSettlements).catch(() => undefined);
  }, [preset, t]);

  const completedTrips =
    data?.lines.filter((l: any) => (l.kind as string) === "DELIVERY_PAYOUT" || (l.kind as string) === "DELIVERY" || Boolean(l.orderCode)).length ?? 0;
  const currentMilestoneIndex = MILESTONES.findIndex((m) => completedTrips < m.orders);
  const nextMilestone = currentMilestoneIndex === -1 ? null : MILESTONES[currentMilestoneIndex];

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl">{t("earnings")}</h1>
          
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
            <CardMeta className="mt-3">{data.dataMode === "LIVE" ? "Live totals are read from confirmed rider ledger records; payout transfer status is shown separately." : "Simulation data is clearly marked and is not used for live payouts."}</CardMeta>
          </Card>
        ) : null}

        <Card>
          <CardTitle>{t("statement")}</CardTitle>
          <ul className="mt-3 space-y-2">
            {data?.lines.map((l: any) => (
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

