import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { errorMessage, newIdempotencyKey } from "@/lib/client/errors";
import { useI18n } from "@/lib/rider/i18n-context";
import { formatPaise } from "@/lib/rider/money";
import {
  createTicketFn,
  listTicketsFn,
  riderAiSupportFn,
  getHomeFn,
  getEarningsFn,
  getSettlementsFn,
} from "@/lib/server/rider-fns";
import { askAssistantFn } from "@/lib/server/assistant";
import type { TicketTopic } from "@/lib/rider/types";
import { useEffect, useState, type FormEvent } from "react";

export const Route = createFileRoute("/support")({ component: Page });

const TOPICS: TicketTopic[] = [
  "ORDER_ISSUE",
  "RESTAURANT_ISSUE",
  "CUSTOMER_UNAVAILABLE",
  "CASH_DISPUTE",
  "PAYMENT_ISSUE",
  "APP_ISSUE",
  "VEHICLE_PROBLEM",
  "SAFETY_ISSUE",
  "OTHER",
];

type WorkflowId =
  | "KITCHEN_WAIT_DELAY"
  | "CUSTOMER_UNREACHABLE"
  | "COD_CASH_MISMATCH"
  | "PAYOUT_AUDIT"
  | "APP_GPS_ISSUE";

interface GuidedWorkflowSpec {
  id: WorkflowId;
  title: string;
  icon: string;
  topic: TicketTopic;
  shortDesc: string;
  presets: string[];
}

const GUIDED_WORKFLOWS: GuidedWorkflowSpec[] = [
  {
    id: "KITCHEN_WAIT_DELAY",
    title: "Kitchen Wait Delay",
    icon: "🏬",
    topic: "RESTAURANT_ISSUE",
    shortDesc: "Verify ₹1/min wait bonus (>10m) or request penalty-free reassignment if kitchen delay >20m",
    presets: [
      "Waiting >15 mins at counter; please verify ₹1/min kitchen wait compensation.",
      "Restaurant kitchen closed / item out of stock; request zero-penalty order reassignment.",
      "Order parcel not sealed properly at counter; awaiting repackaging.",
    ],
  },
  {
    id: "CUSTOMER_UNREACHABLE",
    title: "Customer Unreachable",
    icon: "📵",
    topic: "CUSTOMER_UNAVAILABLE",
    shortDesc: "Audit 3-call attempts & 10-min doorstep wait for 100% payout protection on undeliverable order",
    presets: [
      "Completed 3 calls and 10m doorstep wait; customer phone switched off / not answering.",
      "Customer provided incomplete address / wrong building pin and is not responding.",
      "Customer refused delivery at doorstep; requesting return authorization with full distance pay.",
    ],
  },
  {
    id: "COD_CASH_MISMATCH",
    title: "COD Cash Mismatch",
    icon: "💵",
    topic: "CASH_DISPUTE",
    shortDesc: "Reconcile UPI COD deposit UTR, customer short-cash dispute, or cancelled COD float offset",
    presets: [
      "Deposited collected COD cash via UPI; requesting immediate float limit reset.",
      "Customer insists on paying less than invoice COD amount at doorstep.",
      "COD order cancelled after pickup; please clear COD liability from my float ledger.",
    ],
  },
  {
    id: "PAYOUT_AUDIT",
    title: "Payout Audit",
    icon: "📊",
    topic: "PAYMENT_ISSUE",
    shortDesc: "Audit statutory ₹35 base + ₹8/km distance pay, tips, milestone bonus, or Wednesday NEFT settlement",
    presets: [
      "Actual route distance exceeded estimated km due to road diversion; request distance pay audit.",
      "Wednesday weekly settlement pending; please verify NEFT/IMPS transfer to my registered UPI/Bank.",
      "Daily milestone trip count / kitchen wait bonus missing from today's ledger.",
    ],
  },
  {
    id: "APP_GPS_ISSUE",
    title: "App / GPS Issue",
    icon: "📍",
    topic: "APP_ISSUE",
    shortDesc: "Resolve restaurant/customer geofence pin mismatch, arrival button lock, or status sync issue",
    presets: [
      "Physically standing at restaurant/customer gate but GPS pin is >300m away.",
      "Network drop prevented OTP / POD photo upload at customer doorstep.",
      "Duty status stuck on BUSY after completing trip; request state sync.",
    ],
  },
];

type HomeState = Awaited<ReturnType<typeof getHomeFn>>;
type EarningsState = Awaited<ReturnType<typeof getEarningsFn>>;
type SettlementsState = Awaited<ReturnType<typeof getSettlementsFn>>;

function Page() {
  const { t, locale } = useI18n();
  const [topic, setTopic] = useState<TicketTopic>("ORDER_ISSUE");
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState<Awaited<ReturnType<typeof listTicketsFn>>>([]);
  const [home, setHome] = useState<HomeState | null>(null);
  const [earnings, setEarnings] = useState<EarningsState | null>(null);
  const [settlements, setSettlements] = useState<SettlementsState>([]);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Guided Self-Resolution Workflow state
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<WorkflowId>("KITCHEN_WAIT_DELAY");
  const [workflowNote, setWorkflowNote] = useState(GUIDED_WORKFLOWS[0].presets[0]);
  const [workflowSubmitting, setWorkflowSubmitting] = useState(false);

  // AI Support Co-Pilot state
  const [aiResolution, setAiResolution] = useState<string>("");
  const [aiMessage, setAiMessage] = useState("");
  const [aiPending, setAiPending] = useState(false);

  async function load() {
    try {
      const [tk, h, e, s] = await Promise.all([
        listTicketsFn(),
        getHomeFn(),
        getEarningsFn({ data: { preset: "today" } }),
        getSettlementsFn(),
      ]);
      setTickets(tk);
      setHome(h);
      setEarnings(e);
      setSettlements(s);
    } catch (e) {
      setError(errorMessage(e, t("connectionLostBody")));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const activeWorkflow =
    GUIDED_WORKFLOWS.find((w) => w.id === selectedWorkflowId) ?? GUIDED_WORKFLOWS[0];

  function selectWorkflow(wf: GuidedWorkflowSpec) {
    setSelectedWorkflowId(wf.id);
    setWorkflowNote(wf.presets[0] ?? "");
    setTopic(wf.topic);
    setSuccessBanner(null);
    setError(null);
  }

  // Real-time account telemetry for structured UMAR OS self-resolution
  const activeOrder = home?.active ?? null;
  const riderId = home?.rider.id ?? "UNSYNCED";
  const unreconciledPaise = Math.max(
    home?.pendingCashPaise ?? 0,
    (earnings?.totals.cashCollected ?? 0) - (earnings?.totals.cashReconciled ?? 0),
  );
  const kitchenWaitMins =
    activeOrder?.arrivedRestaurantAt && !activeOrder.pickedUpAt
      ? Math.max(
          0,
          Math.floor((Date.now() - new Date(activeOrder.arrivedRestaurantAt).getTime()) / 60000),
        )
      : 0;
  const accruedKitchenBonusInr = Math.max(0, kitchenWaitMins - 6);
  const customerWaitMins = activeOrder?.waitStartedAt
    ? Math.max(
        0,
        Math.floor((Date.now() - new Date(activeOrder.waitStartedAt).getTime()) / 60000),
      )
    : 0;
  const latestSettlement = settlements[0] ?? null;

  function buildAutoAuditMetadata(wfId: WorkflowId): {
    summaryLines: string[];
    resolutionAdvice: string;
    auditHeader: string;
  } {
    const orderCode = activeOrder?.orderCode ?? "NONE";
    if (wfId === "KITCHEN_WAIT_DELAY") {
      return {
        summaryLines: [
          `Active Order: ${activeOrder ? `#${activeOrder.orderCode} (${activeOrder.restaurant.name})` : "No active order"}`,
          `Stage: ${activeOrder ? activeOrder.state.replaceAll("_", " ") : "IDLE"}`,
          `Verified Kitchen Wait: ${kitchenWaitMins} min(s) · Accrued Bonus: ₹${accruedKitchenBonusInr} (₹1/min after 10m)`,
        ],
        resolutionAdvice: activeOrder
          ? kitchenWaitMins >= 10
            ? `✅ You have passed the 10-minute grace window (${kitchenWaitMins}m elapsed). +₹${accruedKitchenBonusInr} wait compensation is accruing automatically. Submit below to lock your audit timestamp or request penalty-free reassignment if wait >20m.`
            : `⏱️ Wait timer is at ${kitchenWaitMins}m. Ensure you have tapped 'Arrived at Restaurant' & 'Restaurant Not Ready'. Automatic ₹1/min compensation begins at 10 minutes.`
          : "ℹ️ You have no active pickup right now. You can still submit a kitchen delay audit for a recent order below.",
        auditHeader: `[FLEET_AUTO_AUDIT | WORKFLOW=KITCHEN_WAIT_DELAY | RIDER=${riderId.slice(0, 8)} | ORDER=${orderCode} | RESTAURANT=${activeOrder?.restaurant.name ?? "NA"} | WAIT_MINS=${kitchenWaitMins} | BONUS_INR=${accruedKitchenBonusInr}]`,
      };
    }

    if (wfId === "CUSTOMER_UNREACHABLE") {
      const attempts = activeOrder?.contactAttempts ?? 0;
      const eligibleForFreeReturn = attempts >= 3 && customerWaitMins >= 10;
      return {
        summaryLines: [
          `Active Order: ${activeOrder ? `#${activeOrder.orderCode} → ${activeOrder.customer.area}` : "No active order"}`,
          `Logged Call Attempts: ${attempts} / 3 required`,
          `Doorstep Wait Timer: ${customerWaitMins} / 10 min(s) required`,
        ],
        resolutionAdvice: activeOrder
          ? eligibleForFreeReturn
            ? "✅ 3 call attempts and 10+ minutes doorstep wait verified! You qualify for 100% Base + Distance payout under standard cancellation policy exception. Log this Order King audit and tap 'Customer Unavailable' on the delivery screen."
            : `⚠️ Policy requires ${Math.max(0, 3 - attempts)} more call attempt(s) and ${Math.max(0, 10 - customerWaitMins)} more wait minute(s) at the drop pin to unlock automatic zero-penalty return.`
          : "ℹ️ No active customer drop in progress. Log an audit ticket below if you are disputing a past unreachable-customer trip.",
        auditHeader: `[FLEET_AUTO_AUDIT | WORKFLOW=CUSTOMER_UNREACHABLE | RIDER=${riderId.slice(0, 8)} | ORDER=${orderCode} | DROP=${activeOrder?.customer.area ?? "NA"} | CALLS=${attempts}/3 | WAIT_MINS=${customerWaitMins}]`,
      };
    }

    if (wfId === "COD_CASH_MISMATCH") {
      return {
        summaryLines: [
          `Unreconciled COD Float in Hand: ${formatPaise(unreconciledPaise)} / ₹2,500 ceiling`,
          `Today's COD Collected: ${formatPaise(earnings?.totals.cashCollected ?? 0)} · Reconciled: ${formatPaise(earnings?.totals.cashReconciled ?? 0)}`,
          `Active Order COD: ${activeOrder?.cod ? formatPaise(activeOrder.codAmountPaise) : "₹0 (Prepaid / None)"}`,
        ],
        resolutionAdvice:
          unreconciledPaise > 0
            ? `💵 Your ledger shows ${formatPaise(unreconciledPaise)} in pending COD cash. Attach your UPI deposit UTR or describe the customer short-cash amount below so Order King reconciles your float limit automatically.`
            : "✅ Your COD float balance is ₹0 (100% reconciled). Use the form below if you need to report a customer cash dispute on an active order.",
        auditHeader: `[FLEET_AUTO_AUDIT | WORKFLOW=COD_CASH_MISMATCH | RIDER=${riderId.slice(0, 8)} | ORDER=${orderCode} | UNRECONCILED_INR=${(unreconciledPaise / 100).toFixed(2)} | ACTIVE_COD_INR=${((activeOrder?.codAmountPaise ?? 0) / 100).toFixed(2)}]`,
      };
    }

    if (wfId === "PAYOUT_AUDIT") {
      const payoutDest = home?.rider.payoutUpi
        ? `UPI:${home.rider.payoutUpi}`
        : home?.rider.payoutBankLast4
          ? `BANK:XXXX-${home.rider.payoutBankLast4}`
          : "UNSET";
      return {
        summaryLines: [
          `Today's Net Earnings: ${formatPaise(earnings?.totals.net ?? 0)} (${home?.completedToday ?? 0} completed trips)`,
          `Delivery Pay: ${formatPaise(earnings?.totals.payout ?? 0)} · Tips: ${formatPaise(earnings?.totals.tip ?? 0)} · Incentives: ${formatPaise(earnings?.totals.incentive ?? 0)}`,
          `Latest Settlement: ${latestSettlement ? `${formatPaise(latestSettlement.amountPaise)} [${latestSettlement.status}]` : "Scheduled Wednesday 2:00 PM IST"} · Dest: ${payoutDest}`,
        ],
        resolutionAdvice:
          "📊 Statutory floor guarantees ₹35 base (up to 2 km) + ₹8/km beyond 2 km + ₹1/min kitchen wait (>10m) + 100% customer tips. Submit below to trigger an automated Order King route-distance & payout ledger audit.",
        auditHeader: `[FLEET_AUTO_AUDIT | WORKFLOW=PAYOUT_AUDIT | RIDER=${riderId.slice(0, 8)} | TRIPS_TODAY=${home?.completedToday ?? 0} | NET_INR=${((earnings?.totals.net ?? 0) / 100).toFixed(2)} | SETTLEMENT=${latestSettlement?.status ?? "NONE"} | DEST=${payoutDest}]`,
      };
    }

    // APP_GPS_ISSUE
    return {
      summaryLines: [
        `Duty Status: ${home?.rider.status ?? "UNKNOWN"} · KYC Status: ${home?.rider.kycStatus ?? "UNKNOWN"}`,
        `Active Order: ${activeOrder ? `#${activeOrder.orderCode} (${activeOrder.state})` : "NONE"}`,
        `Preferred Zone: ${home?.rider.preferredZones || "Default City Zone"}`,
      ],
      resolutionAdvice:
        "📍 If a building gate or mall entrance is offset from the restaurant/customer map pin, log this telemetry snapshot so Order King authorizes geofence arrival and protects your on-time score.",
      auditHeader: `[FLEET_AUTO_AUDIT | WORKFLOW=APP_GPS_ISSUE | RIDER=${riderId.slice(0, 8)} | STATUS=${home?.rider.status ?? "NA"} | ORDER=${orderCode} | STAGE=${activeOrder?.state ?? "IDLE"}]`,
    };
  }

  const currentDiagnosis = buildAutoAuditMetadata(activeWorkflow.id);

  async function submitGuidedWorkflow() {
    if (!workflowNote.trim()) return;
    setWorkflowSubmitting(true);
    setError(null);
    setSuccessBanner(null);
    try {
      const structuredMessage = `${currentDiagnosis.auditHeader} ${workflowNote.trim()}`;
      const created = await createTicketFn({
        data: {
          topic: activeWorkflow.topic,
          message: structuredMessage,
          deliveryId: activeOrder?.id ?? null,
          idempotencyKey: newIdempotencyKey(),
        },
      });
      setSuccessBanner(
        `✅ Order King Auto-Audit Ticket #${created.id.slice(0, 8)} logged under ${activeWorkflow.topic.replaceAll("_", " ")} with live account telemetry attached.`,
      );
      await load();
    } catch (err) {
      setError(errorMessage(err, t("actionNotConfirmed")));
    } finally {
      setWorkflowSubmitting(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSuccessBanner(null);
    try {
      const created = await createTicketFn({
        data: {
          topic,
          message,
          deliveryId: activeOrder?.id ?? null,
          idempotencyKey: newIdempotencyKey(),
        },
      });
      setMessage("");
      setSuccessBanner(`✅ Support Ticket #${created.id.slice(0, 8)} registered.`);
      await load();
    } catch (err) {
      setError(errorMessage(err, t("actionNotConfirmed")));
    } finally {
      setPending(false);
    }
  }

  async function askRiderAi() {
    if (!aiMessage.trim()) return;
    setAiPending(true);
    setAiResolution("");
    setError(null);
    try {
      const result = await riderAiSupportFn({
        data: {
          message: aiMessage,
          locale,
          deliveryId: activeOrder?.id ?? null,
        },
      });
      setAiResolution(result.text);
    } catch {
      try {
        const fallback = await askAssistantFn({
          data: {
            question: aiMessage,
            busy: Boolean(activeOrder) || home?.rider.status === "BUSY",
            locale,
          },
        });
        setAiResolution(fallback.text);
      } catch (innerErr) {
        setError(
          errorMessage(
            innerErr,
            "AI support is temporarily unavailable. Use the 1-Tap Guided Self-Resolution Workflows above.",
          ),
        );
      }
    } finally {
      setAiPending(false);
    }
  }

  function parseTicketMessage(raw: string): { auditMeta: string | null; body: string } {
    if (raw.startsWith("[FLEET_AUTO_AUDIT") || raw.startsWith("[UMAR_AUTO_AUDIT")) {
      const closeIdx = raw.indexOf("]");
      if (closeIdx !== -1) {
        return {
          auditMeta: raw.slice(1, closeIdx),
          body: raw.slice(closeIdx + 1).trim(),
        };
      }
    }
    return { auditMeta: null, body: raw };
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="font-display text-3xl">{t("support")}</h1>
            <p className="text-xs text-muted-foreground">
              Autonomous OrderKing Fleet AI Resolution Desk · Live Account Telemetry Bound
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>24x7 Autonomous Fleet AI Active</span>
          </div>
        </div>

        {successBanner ? (
          <Card className="border-emerald-500/40 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            {successBanner}
          </Card>
        ) : null}

        {error ? (
          <Card className="border-red-500/40 bg-red-500/10 p-3 text-xs font-semibold text-red-700 dark:text-red-300">
            {error}
          </Card>
        ) : null}

        {/* 1. 1-Tap Guided Self-Resolution Workflows (Autonomous Employee-Less Support) */}
        <Card className="space-y-4 border-primary/30 bg-primary/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Zero-Wait Autonomous Resolution Engine
              </p>
              <h2 className="text-base font-bold">
                ⚡ 1-Tap Guided Self-Resolution Workflows
              </h2>
            </div>
            <Badge tone="online">AUTO-DIAGNOSIS</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Select your issue below. OrderKing Fleet AI automatically inspects your live order, wait timers, COD float, and earnings ledger to resolve your issue or attach verified audit telemetry without waiting for human call-center staff.
          </p>

          {/* Workflow Selector Pills */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {GUIDED_WORKFLOWS.map((wf) => {
              const active = wf.id === activeWorkflow.id;
              return (
                <button
                  key={wf.id}
                  type="button"
                  onClick={() => selectWorkflow(wf)}
                  className={`flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition ${
                    active
                      ? "border-primary bg-surface shadow-sm ring-1 ring-primary"
                      : "border-border bg-surface/60 hover:bg-surface"
                  }`}
                >
                  <span className="text-lg">{wf.icon}</span>
                  <span className="text-xs font-bold leading-tight">{wf.title}</span>
                </button>
              );
            })}
          </div>

          {/* Live Account Diagnosis & Structured Resolution Panel */}
          <div className="rounded-xl border border-border bg-surface p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{activeWorkflow.icon}</span>
                <div>
                  <h3 className="text-sm font-bold">{activeWorkflow.title} — Live Account Diagnosis</h3>
                  <p className="text-[11px] text-muted-foreground">{activeWorkflow.shortDesc}</p>
                </div>
              </div>
              <Badge tone="muted">{activeWorkflow.topic.replaceAll("_", " ")}</Badge>
            </div>

            {/* Real-time Telemetry Snapshot */}
            <div className="rounded-lg border border-border bg-muted/50 p-2.5 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Live Verified Account Telemetry (Attached Automatically)
              </p>
              {currentDiagnosis.summaryLines.map((line, idx) => (
                <p key={idx} className="font-mono text-xs text-foreground">
                  • {line}
                </p>
              ))}
            </div>

            {/* Actionable Self-Resolution Guidance */}
            <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-2.5 text-xs leading-relaxed text-foreground">
              {currentDiagnosis.resolutionAdvice}
            </div>

            {/* 1-Tap Preset Issue Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs">Select 1-Tap Issue Statement or Customize:</Label>
              <div className="flex flex-wrap gap-1.5">
                {activeWorkflow.presets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setWorkflowNote(preset)}
                    className={`rounded-lg border px-2.5 py-1 text-left text-[11px] transition ${
                      workflowNote === preset
                        ? "border-primary bg-primary/10 font-semibold text-primary"
                        : "border-border bg-surface text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <Input
                value={workflowNote}
                onChange={(e) => setWorkflowNote(e.target.value)}
                placeholder="Describe specific details for automated Fleet AI audit…"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              {activeOrder ? (
                <Link
                  to="/delivery/$id"
                  params={{ id: activeOrder.id }}
                  className="text-xs font-semibold text-primary underline"
                >
                  Open Active Order #{activeOrder.orderCode} →
                </Link>
              ) : (
                <span className="text-[11px] text-muted-foreground">
                  Telemetry header: <code className="font-mono">{currentDiagnosis.auditHeader.slice(0, 48)}…</code>
                </span>
              )}
              <Button
                type="button"
                disabled={workflowSubmitting || !workflowNote.trim()}
                onClick={() => void submitGuidedWorkflow()}
              >
                {workflowSubmitting
                  ? "Submitting Fleet Audit…"
                  : `⚡ Log Verified ${activeWorkflow.title} Audit`}
              </Button>
            </div>
          </div>
        </Card>

        {/* 2. Comprehensive Statutory Gig-Worker Helplines & Emergency Escalation (Single Consolidated Card) */}
        <Card className="border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <span className="text-lg">⚖️</span>
            <h2 className="text-sm font-bold tracking-tight">
              STATUTORY GIG-WORKER HELPLINES, SOS & OMBUDSMAN
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Direct 1-tap escalation to Indian emergency responders and statutory authorities under the Code on Social Security, 2020 (MoLE) & IT Act, 2000.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <a
              href="tel:112"
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs font-bold text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
            >
              <span>🚨</span>
              <div>
                <div>112 Emergency SOS</div>
                <div className="text-[10px] font-normal text-red-600 dark:text-red-400">National Police & SOS</div>
              </div>
            </a>
            <a
              href="tel:108"
              className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300"
            >
              <span>🚑</span>
              <div>
                <div>108 Free Ambulance</div>
                <div className="text-[10px] font-normal text-blue-600 dark:text-blue-400">Road Accident Response</div>
              </div>
            </a>
            <a
              href="https://eshram.gov.in"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              <span>🛡️</span>
              <div>
                <div>MoLE e-Shram</div>
                <div className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400">eshram.gov.in Portal</div>
              </div>
            </a>
            <a
              href="tel:18002585956"
              className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 p-2.5 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-300"
            >
              <span>🏥</span>
              <div>
                <div>1800-258-5956</div>
                <div className="text-[10px] font-normal text-purple-600 dark:text-purple-400">Accident Insurance TPA</div>
              </div>
            </a>
            <a
              href="tel:1930"
              className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs font-bold text-amber-700 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
            >
              <span>💳</span>
              <div>
                <div>1930 Cyber Fraud</div>
                <div className="text-[10px] font-normal text-amber-600 dark:text-amber-400">UPI / Payment Fraud</div>
              </div>
            </a>
            <a
              href="mailto:rider.grievance@orderking.in"
              className="flex items-center gap-2 rounded-lg border border-border bg-surface p-2.5 text-xs font-bold text-foreground hover:bg-accent"
            >
              <span>📩</span>
              <div>
                <div>Rider Grievance</div>
                <div className="text-[10px] font-normal text-muted-foreground">Statutory Nodal Officer</div>
              </div>
            </a>
          </div>
        </Card>

        {/* 3. Interactive AI Support Co-Pilot */}
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">🤖 Rider AI Support & Policy Advisor</h2>
            <span className="text-[11px] text-muted-foreground">Live Database Verified · Zero Hallucination</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Describe any delivery, payment, vehicle, app, or safety question. AI inspects your real account snapshot and explains the exact verified step.
          </p>
          <div className="flex gap-2">
            <Input
              value={aiMessage}
              onChange={(e) => setAiMessage(e.target.value)}
              placeholder="What problem are you facing right now?"
            />
            <Button
              type="button"
              disabled={aiPending || !aiMessage.trim()}
              onClick={() => void askRiderAi()}
            >
              {aiPending ? "Diagnosing…" : "Ask AI"}
            </Button>
          </div>
          {aiResolution ? (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm whitespace-pre-wrap leading-relaxed">
              {aiResolution}
            </div>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              setTopic(activeWorkflow.topic);
              setMessage(
                aiMessage
                  ? `${currentDiagnosis.auditHeader} ${aiMessage}`
                  : `${currentDiagnosis.auditHeader} `,
              );
              document.getElementById("rider-support-ticket")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Prefill Custom Support Ticket with Live Telemetry ↓
          </Button>
        </Card>

        {/* 4. Custom Ticket Logging Form */}
        <Card id="rider-support-ticket" className="p-4">
          <form onSubmit={submit} className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold">{t("createTicket")} (Custom / General)</Label>
              {activeOrder ? (
                <Badge tone="busy">Bound to Order #{activeOrder.orderCode}</Badge>
              ) : null}
            </div>
            <select
              className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm"
              value={topic}
              onChange={(e) => setTopic(e.target.value as TicketTopic)}
            >
              {TOPICS.map((x) => (
                <option key={x} value={x}>
                  {x.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <Input
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("message")}
            />
            <Button size="lg" className="w-full" disabled={pending || !message.trim()} type="submit">
              {pending ? "Submitting…" : t("createTicket")}
            </Button>
          </form>
        </Card>

        {/* 5. Ticket Audit Ledger */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Registered Support & Auto-Audit Tickets ({tickets.length})
            </h2>
          </div>
          {tickets.length === 0 ? (
            <Card className="p-4 text-center text-xs text-muted-foreground">
              No open or past support tickets on your account.
            </Card>
          ) : (
            <ul className="space-y-2">
              {tickets.map((ticket) => {
                const parsed = parseTicketMessage(ticket.message);
                return (
                  <li key={ticket.id}>
                    <Card className="space-y-2 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm font-mono">
                            {t("ticketRef")} #{ticket.id.slice(0, 8)}
                          </CardTitle>
                          <Badge tone="muted">{ticket.topic.replaceAll("_", " ")}</Badge>
                          {parsed.auditMeta ? (
                            <Badge tone="online">FLEET AUTO-AUDIT</Badge>
                          ) : null}
                        </div>
                        <Badge tone={ticket.status === "OPEN" ? "busy" : "online"}>
                          {ticket.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground">{parsed.body}</p>
                      {parsed.auditMeta ? (
                        <p className="rounded bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground">
                          {parsed.auditMeta}
                        </p>
                      ) : null}
                      <p className="text-[11px] text-muted-foreground">
                        Logged: {new Date(ticket.createdAt).toLocaleString()}
                        {ticket.deliveryId ? ` · Delivery ID: ${ticket.deliveryId.slice(0, 8)}` : ""}
                      </p>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}

