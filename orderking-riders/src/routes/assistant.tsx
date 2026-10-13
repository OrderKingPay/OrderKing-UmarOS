import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { errorMessage } from "@/lib/client/errors";
import { useI18n } from "@/lib/rider/i18n-context";
import { formatPaise } from "@/lib/rider/money";
import type { LocaleCode } from "@/lib/rider/types";
import {
  getHomeFn,
  getEarningsFn,
  getSettlementsFn,
  listTicketsFn,
} from "@/lib/server/rider-fns";
import { askAssistantFn } from "@/lib/server/assistant";
import { useEffect, useState, type FormEvent } from "react";

import { LOCALE_LABELS } from "@/lib/rider/i18n";

export const Route = createFileRoute("/assistant")({ component: Page });

const SPEECH_LANG_MAP: Record<LocaleCode, string> = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  te: "te-IN",
  mr: "mr-IN",
  ta: "ta-IN",
  ur: "ur-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  or: "or-IN",
  pa: "pa-IN",
  as: "as-IN",
  mai: "hi-IN",
  sat: "hi-IN",
  ks: "ur-IN",
  ne: "ne-NP",
  sd: "hi-IN",
  kok: "mr-IN",
  doi: "hi-IN",
  mni: "bn-IN",
  brx: "as-IN",
  sa: "hi-IN",
};

const LOCALE_LABEL_MAP: Record<LocaleCode, string> = LOCALE_LABELS;

const COD_FLOAT_LIMIT_PAISE = 250_000; // ₹2,500 COD float ceiling

type HomeState = Awaited<ReturnType<typeof getHomeFn>>;
type EarningsState = Awaited<ReturnType<typeof getEarningsFn>>;
type SettlementsState = Awaited<ReturnType<typeof getSettlementsFn>>;
type TicketsState = Awaited<ReturnType<typeof listTicketsFn>>;

function computeMilestone(completedToday: number) {
  if (completedToday < 8) {
    return {
      tier: "Lunch/Dinner Starter Milestone (8 Trips)",
      target: 8,
      remaining: 8 - completedToday,
      bonusPaise: 10_000, // ₹100
      progressPct: Math.min(100, Math.round((completedToday / 8) * 100)),
    };
  }
  if (completedToday < 14) {
    return {
      tier: "Super-Shift Accelerator Milestone (14 Trips)",
      target: 14,
      remaining: 14 - completedToday,
      bonusPaise: 22_000, // ₹220
      progressPct: Math.min(100, Math.round((completedToday / 14) * 100)),
    };
  }
  if (completedToday < 20) {
    return {
      tier: "Full-Day Champion Milestone (20 Trips)",
      target: 20,
      remaining: 20 - completedToday,
      bonusPaise: 40_000, // ₹400
      progressPct: Math.min(100, Math.round((completedToday / 20) * 100)),
    };
  }
  return {
    tier: "Full-Day Champion Milestone Unlocked (20+ Trips)",
    target: 20,
    remaining: 0,
    bonusPaise: 40_000,
    progressPct: 100,
  };
}

function Page() {
  const { t, locale } = useI18n();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | "advisor" | null>(null);

  const [home, setHome] = useState<HomeState | null>(null);
  const [earnings, setEarnings] = useState<EarningsState | null>(null);
  const [settlements, setSettlements] = useState<SettlementsState>([]);
  const [tickets, setTickets] = useState<TicketsState>([]);
  const [loadingContext, setLoadingContext] = useState(true);

  const [lines, setLines] = useState<Array<{ role: "user" | "assistant"; text: string; at: string }>>([]);

  async function refreshLiveState(seedGreeting = false) {
    setLoadingContext(true);
    try {
      const [h, e, s, tk] = await Promise.all([
        getHomeFn(),
        getEarningsFn({ data: { preset: "today" } }),
        getSettlementsFn(),
        listTicketsFn(),
      ]);
      setHome(h);
      setEarnings(e);
      setSettlements(s);
      setTickets(tk);
      const isBusy = Boolean(h.active) || h.rider.status === "BUSY";
      setBusy(isBusy);

      if (seedGreeting) {
        const firstName = h.rider.fullName?.trim().split(" ")[0] || "Partner";
        const ms = computeMilestone(h.completedToday);
        const unreconciledPaise = Math.max(
          h.pendingCashPaise,
          (e.totals.cashCollected ?? 0) - (e.totals.cashReconciled ?? 0),
        );
        const greeting =
          `Namaste ${firstName} ji! Welcome to Rider Spark AI — your personal Fleet Mentor & Operations Co-Pilot.\n` +
          `• Today's Take-Home: ${formatPaise(e.totals.net)} across ${h.completedToday} completed ${h.completedToday === 1 ? "trip" : "trips"} (Tips: ${formatPaise(e.totals.tip)}, Incentives: ${formatPaise(e.totals.incentive)}).\n` +
          `• Milestone Coach: ${ms.remaining > 0 ? `Complete ${ms.remaining} more ${ms.remaining === 1 ? "trip" : "trips"} today to unlock +${formatPaise(ms.bonusPaise)} (${ms.tier}).` : `You unlocked ${ms.tier} (+${formatPaise(ms.bonusPaise)})!`}\n` +
          (h.active
            ? `• Active Trip Guidance: You are on Order #${h.active.orderCode} (${h.active.restaurant.name} → ${h.active.customer.area}) [${h.active.state.replaceAll("_", " ")}].`
            : `• Shift Advice: Peak order velocity runs during Lunch (12:00–3:00 PM) and Dinner (7:00–11:00 PM) in ${h.rider.preferredZones || "your primary zone"}.`) +
          (unreconciledPaise > 0
            ? `\n• COD Float Notice: You hold ${formatPaise(unreconciledPaise)} in COD cash. Reconcile before reaching ₹2,500 to keep dispatch uninterrupted.`
            : "");

        setLines([
          {
            role: "assistant",
            text: greeting,
            at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch {
      // Keep UI responsive even if initial fetch fails
    } finally {
      setLoadingContext(false);
    }
  }

  useEffect(() => {
    void refreshLiveState(true);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function speakText(text: string, id: number | "advisor") {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speakingIdx === id) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[•⚠️🚨🔊💵🗓️⏱️🏬]/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = SPEECH_LANG_MAP[locale] || "en-IN";
    utterance.rate = 0.96;
    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);
    setSpeakingIdx(id);
    window.speechSynthesis.speak(utterance);
  }

  async function askQuestion(questionText: string) {
    if (!questionText.trim()) return;
    const question = questionText.trim();
    const nowLabel = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setQ("");
    setLines((l) => [...l, { role: "user", text: question, at: nowLabel }]);
    setPending(true);
    try {
      const res = await askAssistantFn({ data: { question, busy, locale } });
      setLines((l) => [
        ...l,
        {
          role: "assistant",
          text: res.text,
          at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      void refreshLiveState(false);
    } catch (err) {
      setLines((l) => [
        ...l,
        {
          role: "assistant",
          text: errorMessage(err, t("aiUnavailable")),
          at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    await askQuestion(q);
  }

  const firstName = home?.rider.fullName?.trim().split(" ")[0] || "Partner";
  const completedToday = home?.completedToday ?? 0;
  const todayNetPaise = earnings?.totals.net ?? home?.todayEarningsPaise ?? 0;
  const todayTipsPaise = earnings?.totals.tip ?? 0;
  const todayIncentivePaise = earnings?.totals.incentive ?? 0;
  const milestone = computeMilestone(completedToday);

  const unreconciledPaise = Math.max(
    home?.pendingCashPaise ?? 0,
    (earnings?.totals.cashCollected ?? 0) - (earnings?.totals.cashReconciled ?? 0),
  );
  const codRemainingPaise = Math.max(0, COD_FLOAT_LIMIT_PAISE - unreconciledPaise);
  const codUsagePct = Math.min(100, Math.round((unreconciledPaise / COD_FLOAT_LIMIT_PAISE) * 100));

  const activeOrder = home?.active ?? null;
  const openTickets = tickets.filter((tk) => tk.status === "OPEN");
  const latestSettlement = settlements[0] ?? null;

  const kitchenWaitMins =
    activeOrder?.arrivedRestaurantAt && !activeOrder.pickedUpAt
      ? Math.max(0, Math.floor((Date.now() - new Date(activeOrder.arrivedRestaurantAt).getTime()) / 60000))
      : 0;
  const accruedKitchenBonusInr = Math.max(0, kitchenWaitMins - 10);

  const advisorSpeechSummary =
    `Namaste ${firstName} ji. Today you have completed ${completedToday} trips and earned ${formatPaise(todayNetPaise)}. ` +
    (milestone.remaining > 0
      ? `Complete ${milestone.remaining} more trips to unlock your ${formatPaise(milestone.bonusPaise)} milestone bonus. Work the Lunch 12 to 3 PM and Dinner 7 to 11 PM peak slots to maximize earnings. `
      : `You have unlocked your daily champion milestone bonus of ${formatPaise(milestone.bonusPaise)}. `) +
    (activeOrder
      ? `You have an active order ${activeOrder.orderCode} from ${activeOrder.restaurant.name} to ${activeOrder.customer.area}. `
      : "") +
    (unreconciledPaise > 0
      ? `Your COD cash in hand is ${formatPaise(unreconciledPaise)}, with ${formatPaise(codRemainingPaise)} remaining before the 2500 rupee limit.`
      : "Your COD cash balance is clear at zero rupees.");

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl">{t("assistant")}</h1>
              <Badge tone="online">RIDER SPARK AI</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Human-Style Fleet Mentor & Autonomous Operations Co-Pilot · Voice Enabled ({LOCALE_LABEL_MAP[locale]})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => speakText(advisorSpeechSummary, "advisor")}
            >
              {speakingIdx === "advisor" ? "⏹️ Stop Audio" : `🔊 Listen in ${LOCALE_LABEL_MAP[locale].split(" ")[0]}`}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={loadingContext}
              onClick={() => void refreshLiveState(false)}
            >
              {loadingContext ? "Syncing…" : "↻ Sync State"}
            </Button>
          </div>
        </div>

        {busy ? (
          <Card className="border-amber-500/40 bg-amber-500/10 p-3">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              🛵 {t("aiDriving")} — Tap <strong>🔊 Listen in My Language</strong> on any card to hear voice guidance hands-free.
            </p>
          </Card>
        ) : null}

        {/* Autonomous Rider Self-Diagnosis & Earnings Growth Advisor */}
        <Card className="space-y-4 border-primary/30 bg-primary/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Autonomous Self-Diagnosis & Earnings Growth Advisor
              </p>
              <h2 className="text-base font-bold">
                Namaste {firstName} ji — Live Shift & Take-Home Coach
              </h2>
            </div>
            <Badge tone={home?.rider.status === "ONLINE" ? "online" : home?.rider.status === "BUSY" ? "busy" : "offline"}>
              {home?.rider.status ?? "SYNCING"}
            </Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {/* 1. Live Earnings & Milestone Coach */}
            <div className="rounded-xl border border-border bg-surface p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  📈 Live Earnings & Milestone Coach
                </span>
                <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {formatPaise(todayNetPaise)} today
                </span>
              </div>

              <p className="text-xs leading-relaxed text-foreground">
                You have completed <strong>{completedToday} {completedToday === 1 ? "trip" : "trips"}</strong> today
                (Tips: <strong>{formatPaise(todayTipsPaise)}</strong> · Wait/Surge Incentives:{" "}
                <strong>{formatPaise(todayIncentivePaise)}</strong>).{" "}
                {milestone.remaining > 0 ? (
                  <>
                    Complete <strong>{milestone.remaining} more {milestone.remaining === 1 ? "trip" : "trips"}</strong>{" "}
                    to unlock <strong>+{formatPaise(milestone.bonusPaise)}</strong> under{" "}
                    <span className="underline decoration-dotted">{milestone.tier}</span>!
                  </>
                ) : (
                  <>
                    You unlocked the <strong>{milestone.tier} (+{formatPaise(milestone.bonusPaise)})</strong>! Every additional trip adds full statutory distance + surge pay.
                  </>
                )}
              </p>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{milestone.tier}</span>
                  <span className="font-mono font-semibold">
                    {completedToday} / {milestone.target} trips ({milestone.progressPct}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${milestone.progressPct}%` }}
                  />
                </div>
              </div>

              {/* Peak Shift Advisor */}
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 text-[11px] text-muted-foreground">
                <strong className="text-foreground">Peak Slot Maximizer:</strong> Stay logged into{" "}
                <span className="font-semibold text-foreground">{home?.rider.preferredZones || "your primary zone"}</span>{" "}
                during <strong>Lunch (12:00–3:00 PM)</strong> and <strong>Dinner (7:00–11:00 PM)</strong> to capture back-to-back orders and hit your {milestone.target}-trip target 40% faster.
              </div>
            </div>

            {/* 2. Live On-Trip & COD Float Resolver */}
            <div className="rounded-xl border border-border bg-surface p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  🧭 Live On-Trip & COD Float Resolver
                </span>
                <Badge tone={unreconciledPaise >= 200_000 ? "busy" : "muted"}>
                  COD: {formatPaise(unreconciledPaise)} / ₹2,500
                </Badge>
              </div>

              {activeOrder ? (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Active Order #{activeOrder.orderCode}</span>
                    <span className="font-mono text-primary">{formatPaise(activeOrder.expectedPayoutPaise)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <strong>{activeOrder.restaurant.name}</strong> → <strong>{activeOrder.customer.area}</strong> · Stage:{" "}
                    <span className="font-semibold text-foreground">{activeOrder.state.replaceAll("_", " ")}</span>
                  </p>
                  <p className="text-[11px] leading-relaxed text-foreground">
                    {activeOrder.state === "ARRIVED_AT_RESTAURANT" || activeOrder.state === "ACCEPTED" || activeOrder.state === "ARRIVING_AT_RESTAURANT" ? (
                      <>
                        <strong>Next Step:</strong> Verify 4-digit Pickup Code at counter.{" "}
                        {kitchenWaitMins > 0
                          ? `You have waited ${kitchenWaitMins}m (${accruedKitchenBonusInr > 0 ? `+₹${accruedKitchenBonusInr} wait pay accrued` : `₹1/min wait compensation starts after 10m`}).`
                          : "If food is not ready, tap 'Restaurant Not Ready' — ₹1/min wait bonus starts automatically after 10m."}
                      </>
                    ) : (
                      <>
                        <strong>Next Step:</strong>{" "}
                        {activeOrder.cod
                          ? `Collect ${formatPaise(activeOrder.codAmountPaise)} COD cash FIRST, then verify Customer Handover PIN.`
                          : "Verify Customer Handover PIN at doorstep."}{" "}
                        If unreachable, log <strong>3 call attempts</strong> ({activeOrder.contactAttempts}/3 logged) and wait 10 mins for penalty-free return.
                      </>
                    )}
                  </p>
                  <Link
                    to="/delivery/$id"
                    params={{ id: activeOrder.id }}
                    className="inline-block text-xs font-semibold text-primary underline"
                  >
                    Open Active Delivery Workstation →
                  </Link>
                </div>
              ) : (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  <strong className="text-foreground">No active order in progress.</strong>{" "}
                  {home?.rider.status === "OFFLINE"
                    ? "Switch your status to ONLINE on the Home screen to receive live orders."
                    : "You are ONLINE and eligible for dispatch. Stay near high-density restaurant clusters."}
                </p>
              )}

              {/* COD Float Bar & Settlement Info */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Unreconciled COD Cash-in-Hand</span>
                  <span className="font-mono font-semibold">
                    {formatPaise(codRemainingPaise)} headroom left
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${codUsagePct >= 80 ? "bg-amber-500" : "bg-sky-500"}`}
                    style={{ width: `${codUsagePct}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {unreconciledPaise > 0
                    ? `Deposit ${formatPaise(unreconciledPaise)} via UPI before hitting ₹2,500 so COD dispatch stays active.`
                    : "₹0 pending COD cash. Full earnings will settle every Wednesday by 2:00 PM IST."}
                  {latestSettlement
                    ? ` · Latest Settlement: ${formatPaise(latestSettlement.amountPaise)} (${latestSettlement.status})`
                    : ""}
                  {openTickets.length > 0 ? ` · ${openTickets.length} Open Ticket(s)` : ""}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* 1-Tap Human-Style Quick Mentor Prompts */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            1-Tap Ask Your Fleet Mentor
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => void askQuestion("How much are today's net earnings, tips, and my next milestone bonus?")}
            >
              💵 Today&apos;s Earnings & Milestone
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => void askQuestion("When is my Wednesday payout transferred and what is my COD cash balance?")}
            >
              🗓️ Wednesday Payout & COD Balance
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => void askQuestion("Restaurant food is taking too long — how does kitchen wait pay work?")}
            >
              🏬 Kitchen Wait &gt; 10m Pay Rule
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => void askQuestion("Customer is not answering the phone at drop location — what should I do?")}
            >
              ⏱️ Customer Unreachable (3-Call Rule)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => void askQuestion("What is my current active order status and next step?")}
            >
              🛵 My Active Order Status
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => void askQuestion("Vehicle breakdown or road emergency protocol")}
            >
              🚨 Breakdown & Emergency Protocol
            </Button>
          </div>
        </div>

        {/* Conversation Thread with 1-Tap Voice Read-Aloud */}
        <div className="space-y-3">
          {lines.map((l, i) => (
            <Card
              key={i}
              className={
                l.role === "user"
                  ? "ml-6 bg-muted/80 p-3.5"
                  : "border-primary/25 bg-surface p-4 shadow-sm"
              }
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {l.role === "user" ? `👤 ${firstName} (${l.at})` : `🤖 Rider Spark Mentor (${l.at})`}
                </span>
                {l.role === "assistant" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    onClick={() => speakText(l.text, i)}
                  >
                    {speakingIdx === i ? "⏹️ Stop" : "🔊 Listen in My Language"}
                  </Button>
                ) : null}
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed">{l.text}</p>
            </Card>
          ))}
        </div>

        {/* Question Input Form */}
        <form onSubmit={send} className="flex gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`${t("askAssistant")} (English, हिन्दी, বাংলা, অসমীয়া…)`}
            disabled={pending}
          />
          <Button type="submit" disabled={pending || !q.trim()}>
            {pending ? "Thinking…" : t("send")}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}

