import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardMeta, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorMessage, newIdempotencyKey } from "@/lib/client/errors";
import {
  formatPaise,
  STATUTORY_BASE_DISTANCE_KM,
  STATUTORY_BASE_FARE_PAISE,
  STATUTORY_DISTANCE_RATE_PER_KM_PAISE,
  getOperationalTier,
} from "@/lib/rider/money";
import { useI18n } from "@/lib/rider/i18n-context";
import { createTicketFn, getEarningsFn, getSettlementsFn, getHomeFn } from "@/lib/server/rider-fns";
import type { EarningLine } from "@/lib/rider/types";
import { Download, FileQuestion, Printer } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  STANDARD_DAILY_MILESTONES,
  calculateDailyMilestoneProgress,
} from "@/lib/rider/gig-engine";
import { VipAmbassadorPass } from "@/components/rider/vip-ambassador-pass";
import { useRiderCustomization } from "@/lib/rider/use-rider-customization";

export const Route = createFileRoute("/earnings")({ component: Page });

type Preset = "today" | "yesterday" | "week" | "month";
type LineFilter = "ALL" | EarningLine["kind"];

const MILESTONES = STANDARD_DAILY_MILESTONES;

function Page() {
  const { t } = useI18n();
  const { payout, surge, weather } = useRiderCustomization();
  const [preset, setPreset] = useState<Preset>("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [usingCustomRange, setUsingCustomRange] = useState(false);

  const [data, setData] = useState<Awaited<ReturnType<typeof getEarningsFn>> | null>(null);
  const [settlements, setSettlements] = useState<Awaited<ReturnType<typeof getSettlementsFn>>>([]);
  const [rider, setRider] = useState<Awaited<ReturnType<typeof getHomeFn>>["rider"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [instantPayoutNotice, setInstantPayoutNotice] = useState<string | null>(null);

  const [lineFilter, setLineFilter] = useState<LineFilter>("ALL");
  const [disputeLine, setDisputeLine] = useState<EarningLine | null>(null);
  const [disputeMessage, setDisputeMessage] = useState("");
  const [disputeBusy, setDisputeBusy] = useState(false);
  const [disputeRef, setDisputeRef] = useState<string | null>(null);

  const handleInstantCashoutRequest = () => {
    setInstantPayoutNotice(
      "Instant IMPS payout gateway is not active for this cycle. Your net payable balance will settle in the scheduled weekly batch.",
    );
  };

  const loadEarnings = useCallback(
    async (opts?: { useCustom?: boolean }) => {
      try {
        const useCustom = opts?.useCustom ?? usingCustomRange;
        const payload =
          useCustom && customFrom && customTo
            ? {
                preset,
                from: new Date(`${customFrom}T00:00:00.000Z`).toISOString(),
                to: new Date(`${customTo}T23:59:59.999Z`).toISOString(),
              }
            : { preset };
        const res = await getEarningsFn({ data: payload });
        setData(res);
        setError(null);
      } catch (e: unknown) {
        setError(errorMessage(e, t("connectionLostBody")));
      }
    },
    [preset, usingCustomRange, customFrom, customTo, t],
  );

  useEffect(() => {
    void loadEarnings();
    void getSettlementsFn().then(setSettlements).catch(() => undefined);
    void getHomeFn().then((h) => setRider(h.rider)).catch(() => undefined);
  }, [loadEarnings]);

  const uniqueTripCodes = new Set(
    data?.lines
      .filter(
        (l) =>
          (l.kind as string) === "DELIVERY_PAYOUT" ||
          (l.kind as string) === "DELIVERY" ||
          Boolean(l.orderCode),
      )
      .map((l) => l.orderCode || `${l.kind}_${l.at}`) ?? [],
  );
  const completedTrips = uniqueTripCodes.size;
  const milestoneProgress = calculateDailyMilestoneProgress(completedTrips, MILESTONES);
  const nextMilestone = milestoneProgress.nextMilestone;

  const filteredLines =
    data?.lines.filter((l) => (lineFilter === "ALL" ? true : l.kind === lineFilter)) ?? [];

  function exportCsvStatement() {
    if (!data) return;
    const headers = ["Timestamp (ISO)", "Order Code", "Category", "Description", "Amount (Paise)", "Amount (INR)"];
    const rows = data.lines.map((l) => [
      l.at,
      l.orderCode ?? "",
      l.kind,
      `"${(l.note ?? "").replaceAll('"', '""')}"`,
      String(l.amountPaise),
      (l.amountPaise / 100).toFixed(2),
    ]);
    rows.push([]);
    rows.push(["SUMMARY", "", "Net Payable", "", String(data.totals.netPayable), (data.totals.netPayable / 100).toFixed(2)]);
    rows.push(["SUMMARY", "", "Delivery Payout", "", String(data.totals.payout), (data.totals.payout / 100).toFixed(2)]);
    rows.push(["SUMMARY", "", "Incentives", "", String(data.totals.incentive), (data.totals.incentive / 100).toFixed(2)]);
    rows.push(["SUMMARY", "", "Ambassador Royalties", "", String(data.totals.referral ?? 0), ((data.totals.referral ?? 0) / 100).toFixed(2)]);
    rows.push(["SUMMARY", "", "Customer Tips", "", String(data.totals.tip ?? 0), ((data.totals.tip ?? 0) / 100).toFixed(2)]);
    rows.push(["SUMMARY", "", "Cash Collected", "", String(data.totals.cashCollected), (data.totals.cashCollected / 100).toFixed(2)]);
    rows.push(["SUMMARY", "", "Cash Reconciled", "", String(data.totals.cashReconciled), (data.totals.cashReconciled / 100).toFixed(2)]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orderking-rider-ledger-${usingCustomRange && customFrom ? `${customFrom}-to-${customTo}` : preset}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function submitPayoutDispute() {
    if (!disputeLine && !disputeMessage.trim()) return;
    setDisputeBusy(true);
    try {
      const prefix = disputeLine
        ? `[Ledger Line Query · Order: ${disputeLine.orderCode ?? "N/A"} · Kind: ${disputeLine.kind} · Amount: ${formatPaise(disputeLine.amountPaise)}] `
        : "[Payout Ledger Query] ";
      const ticket = await createTicketFn({
        data: {
          topic: "PAYMENT_ISSUE",
          message: `${prefix}${disputeMessage.trim() || "Please verify this ledger entry calculation."}`,
          deliveryId: disputeLine?.deliveryId ?? null,
          idempotencyKey: newIdempotencyKey(),
        },
      });
      setDisputeRef(ticket.id.slice(0, 8));
      setDisputeLine(null);
      setDisputeMessage("");
    } catch (e: unknown) {
      setError(errorMessage(e, t("actionNotConfirmed")));
    } finally {
      setDisputeBusy(false);
    }
  }

  const unreconciledCodPaise = data
    ? Math.max(0, data.totals.cashCollected - data.totals.cashReconciled)
    : 0;

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="font-display text-3xl">{t("earnings")}</h1>
            <p className="text-xs text-muted-foreground">
              Exact integer-paise partner ledger · 100% transparent per-order accounting
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!data}
              onClick={exportCsvStatement}
            >
              <Download className="size-3.5" />
              CSV Statement
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (typeof window !== "undefined") window.print();
              }}
            >
              <Printer className="size-3.5" />
              Print / PDF
            </Button>
          </div>
        </div>

        {/* Tier-1 Algorithmic Rate Card Summary */}
        <div className="rounded-xl border border-border bg-card p-4 text-sm shadow-xs space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-foreground">
                {payout.labels.rateCardTitle}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Exact Indian delivery matrix · SafeInteger paise arithmetic (100 paise = 1 INR)
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              100% Tips Pass-Through (₹0 Platform Cut)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 text-xs border-t border-border">
            <div className="rounded-lg bg-muted/40 p-2.5 space-y-0.5">
              <span className="font-semibold text-foreground block">Base Order Pay</span>
              <span className="text-muted-foreground">{payout.labels.baseFareText}</span>
            </div>
            <div className="rounded-lg bg-muted/40 p-2.5 space-y-0.5">
              <span className="font-semibold text-foreground block">Progressive Distance</span>
              <span className="text-muted-foreground">
                {payout.formattedDistanceRate}/km · Slabs up to ₹{payout.slabs.slab4RatePerKmPaise / 100}/km + ₹{payout.slabs.ldoBonusPaise / 100} LDO Bonus
              </span>
            </div>
            <div className="rounded-lg bg-muted/40 p-2.5 space-y-0.5">
              <span className="font-semibold text-foreground block">Wait-Time Pay</span>
              <span className="text-muted-foreground">₹1.00/min (&gt;6 mins wait at kitchen, cap ₹30)</span>
            </div>
            <div className="rounded-lg bg-muted/40 p-2.5 space-y-0.5">
              <span className="font-semibold text-foreground block">Surge &amp; Weather</span>
              <span className="text-muted-foreground">
                {surge.badges.monsoonText} · {surge.badges.peakDinnerText}
                {surge.isWeatherAllowanceActive ? ` · ${surge.badges.weatherAllowanceText}` : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Daily Incentive Milestones (OrderKing Partner Fleet Model) */}
        {preset === "today" && !usingCustomRange ? (
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Daily Target Incentives</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {nextMilestone
                    ? `Complete ${nextMilestone.orders - completedTrips} more trip${
                        nextMilestone.orders - completedTrips > 1 ? "s" : ""
                      } to unlock ${nextMilestone.label} bonus`
                    : "All daily milestone bonuses unlocked (₹400 total slab)"}
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
                      (completedTrips /
                        (nextMilestone
                          ? nextMilestone.orders
                          : MILESTONES[MILESTONES.length - 1]?.orders || 16)) *
                        100,
                    ),
                  )}%`,
                }}
              />
            </div>

            {/* Milestone Steps */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {MILESTONES.map((m) => {
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

        {/* OrderKing VIP Ambassador Pass & Micro-Royalty Protocol */}
        <VipAmbassadorPass
          riderName={rider?.fullName}
          riderId={rider?.id}
          phone={rider?.phone}
          onCommissionCredited={() => void loadEarnings()}
        />

        {/* Period Presets & Custom Date Range Filter */}
        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {(["today", "yesterday", "week", "month"] as const).map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={!usingCustomRange && preset === p ? "default" : "outline"}
                  onClick={() => {
                    setUsingCustomRange(false);
                    setPreset(p);
                  }}
                >
                  {p === "today"
                    ? t("today")
                    : p === "yesterday"
                      ? t("yesterday")
                      : p === "week"
                        ? t("thisWeek")
                        : t("thisMonth")}
                </Button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {usingCustomRange && customFrom && customTo
                ? `Custom: ${customFrom} → ${customTo}`
                : `Active View: ${preset.toUpperCase()}`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-border items-end">
            <div>
              <Label className="text-xs">From Date</Label>
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">To Date</Label>
              <Input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={!customFrom || !customTo}
              onClick={() => {
                setUsingCustomRange(true);
                void loadEarnings({ useCustom: true });
              }}
            >
              Apply Custom Range
            </Button>
          </div>
        </Card>

        {error ? <p className="text-sm text-offline">{error}</p> : null}

        {data ? (
          <Card>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {t("netPayable")}
                </p>
                <p className="font-display text-4xl tabular-nums">
                  {formatPaise(data.totals.netPayable)}
                </p>
              </div>
              <Badge tone="online">{completedTrips} Completed Orders</Badge>
            </div>
            <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-sm">
              <Row k={t("payout")} v={formatPaise(data.totals.payout)} />
              <Row k={t("incentive")} v={formatPaise(data.totals.incentive)} />
              <Row k="Ambassador Royalties" v={formatPaise(data.totals.referral ?? 0)} />
              <Row k={t("customerTip")} v={formatPaise(data.totals.tip ?? 0)} />
              <Row k={t("adjustment")} v={formatPaise(data.totals.adjustment)} />
              <Row k={t("deduction")} v={formatPaise(data.totals.deduction)} />
              <Row k={t("cashCollectedLabel")} v={formatPaise(data.totals.cashCollected)} />
              <Row k={t("cashReconciled")} v={formatPaise(data.totals.cashReconciled)} />
              <Row k="Unreconciled COD" v={formatPaise(unreconciledCodPaise)} />
            </dl>
          </Card>
        ) : null}

        {/* Settlement & Payout Schedule Card */}
        <Card className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Settlement &amp; Payout Schedule</CardTitle>
                <Badge tone="online">Wednesday NEFT/IMPS</Badge>
              </div>
              <CardMeta>
                Weekly Wednesday Settlement: Orders from Monday 00:00:00 to Sunday 23:59:59 are settled automatically every Wednesday afternoon at 14:00 IST via automated NEFT/IMPS to your verified bank account or UPI ID registered during KYC onboarding.
              </CardMeta>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleInstantCashoutRequest}
              className="shrink-0"
            >
              Request Instant IMPS Cashout
            </Button>
          </div>

          {instantPayoutNotice ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-900 dark:text-amber-200">
              {instantPayoutNotice}
            </div>
          ) : null}

          <div className="border-t border-border pt-2.5 text-xs text-muted-foreground space-y-1">
            <p>
              <strong className="text-foreground">Payout Formula:</strong> Delivery Base &amp; Distance Pay + Milestone Incentives + Ambassador Royalties &amp; Bonuses + Kitchen Wait Pay + 100% Customer Tips − Unreconciled COD Cash − Statutory TDS (1% u/s 194-O of Income Tax Act, where applicable).
            </p>
            <p className="text-[11px]">
              Compliant with the Code on Social Security, 2020 · Independent Delivery Partner Ledger
            </p>
          </div>
        </Card>

        {/* Itemized Statement with Category Filter & Self-Service Dispute Logger */}
        <Card className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle>{t("statement")}</CardTitle>
              <p className="text-xs text-muted-foreground">
                Filter entries by category or click &ldquo;Query&rdquo; on any line to log a payout audit ticket
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["ALL", "DELIVERY_PAYOUT", "INCENTIVE", "REFERRAL_COMMISSION", "TIP", "ADJUSTMENT", "DEDUCTION"] as const).map(
                (kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setLineFilter(kind)}
                    className={`rounded-md border px-2 py-1 text-[11px] font-medium transition ${
                      lineFilter === kind
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border bg-muted/30 text-muted-foreground"
                    }`}
                  >
                    {kind === "REFERRAL_COMMISSION" ? "VIP AMBASSADOR" : kind.replaceAll("_", " ")}
                  </button>
                ),
              )}
            </div>
          </div>

          {disputeRef ? (
            <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
              Payout audit query logged (#{disputeRef}). Track status under{" "}
              <Link to="/support" className="underline font-semibold">
                Support Tickets
              </Link>
              .
            </div>
          ) : null}

          {disputeLine ? (
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">
                  Raise Payout Query: {disputeLine.orderCode ?? disputeLine.kind} (
                  {formatPaise(disputeLine.amountPaise)})
                </span>
                <button
                  type="button"
                  onClick={() => setDisputeLine(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
              <Input
                value={disputeMessage}
                onChange={(e) => setDisputeMessage(e.target.value)}
                placeholder="Describe the distance, wait-time, or payout discrepancy..."
                className="text-xs"
              />
              <Button
                size="sm"
                disabled={disputeBusy}
                onClick={() => void submitPayoutDispute()}
              >
                {disputeBusy ? "Submitting..." : "Submit Payout Audit Ticket"}
              </Button>
            </div>
          ) : null}

          <ul className="divide-y divide-border">
            {filteredLines.map((l) => (
              <li
                key={l.id}
                className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {l.orderCode ? `Order #${l.orderCode}` : l.kind.replaceAll("_", " ")}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${
                        l.kind === "REFERRAL_COMMISSION"
                          ? "border border-amber-500/40 bg-amber-500/15 font-semibold text-amber-500"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {l.kind === "REFERRAL_COMMISSION" ? "VIP AMBASSADOR" : l.kind}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {l.note} · {new Date(l.at).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <span className="font-mono font-semibold tabular-nums">
                    {formatPaise(l.amountPaise)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDisputeLine(l);
                      setDisputeRef(null);
                    }}
                  >
                    <FileQuestion className="size-3.5" />
                    Query
                  </Button>
                </div>
              </li>
            ))}
            {data && filteredLines.length === 0 ? (
              <li className="py-3 text-sm text-muted-foreground">{t("noHistory")}</li>
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
          <div className="mt-3 flex items-center gap-3 text-sm">
            <Link to="/history" className="underline">
              {t("history")}
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/support" className="underline">
              Raise General Payment Ticket
            </Link>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2.5 border border-border/50">
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="mt-0.5 font-mono font-semibold tabular-nums">{v}</dd>
    </div>
  );
}

