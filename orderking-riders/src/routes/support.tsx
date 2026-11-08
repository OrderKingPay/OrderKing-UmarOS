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
    title: "Kitchen Delay",
    icon: "🏬",
    topic: "RESTAURANT_ISSUE",
    shortDesc: "Wait pay starts after 6 minutes at restaurant",
    presets: [
      "Waiting over 10 minutes at the restaurant counter for order preparation.",
      "Restaurant is closed or item is out of stock.",
      "Food parcel not ready or leaking at the counter.",
    ],
  },
  {
    id: "CUSTOMER_UNREACHABLE",
    title: "Customer Unreachable",
    icon: "📵",
    topic: "CUSTOMER_UNAVAILABLE",
    shortDesc: "3-call attempts and doorstep wait protection",
    presets: [
      "Customer phone unreachable / not answering after 3 attempts.",
      "Incorrect delivery address or gated entry locked.",
      "Customer refused to accept order at doorstep.",
    ],
  },
  {
    id: "COD_CASH_MISMATCH",
    title: "Cash / COD Issue",
    icon: "💵",
    topic: "CASH_DISPUTE",
    shortDesc: "Reconcile cash collected or customer payment dispute",
    presets: [
      "Customer paid directly via merchant UPI QR.",
      "Customer is offering less than invoice cash amount.",
      "Cash deposit UTR confirmation request.",
    ],
  },
  {
    id: "PAYOUT_AUDIT",
    title: "Payout & Earnings",
    icon: "📊",
    topic: "PAYMENT_ISSUE",
    shortDesc: "Check trip distance, tips, or bank transfer",
    presets: [
      "Trip route was longer than estimated map distance.",
      "Weekly bank transfer enquiry.",
      "Daily milestone bonus enquiry.",
    ],
  },
  {
    id: "APP_GPS_ISSUE",
    title: "GPS & Location",
    icon: "📍",
    topic: "APP_ISSUE",
    shortDesc: "Geofence pin offset or network issues",
    presets: [
      "Standing at customer location but map pin is offset.",
      "Network drop prevented OTP verification.",
      "App state not syncing after delivery.",
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

  const activeOrder = home?.active ?? null;

  async function submitGuidedWorkflow() {
    if (!workflowNote.trim()) return;
    setWorkflowSubmitting(true);
    setError(null);
    setSuccessBanner(null);
    try {
      const created = await createTicketFn({
        data: {
          topic: activeWorkflow.topic,
          message: workflowNote.trim(),
          deliveryId: activeOrder?.id ?? null,
          idempotencyKey: newIdempotencyKey(),
        },
      });
      setSuccessBanner(
        `Ticket #${created.id.slice(0, 8)} registered under ${activeWorkflow.topic.replaceAll("_", " ")}.`,
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
          message: message.trim(),
          deliveryId: activeOrder?.id ?? null,
          idempotencyKey: newIdempotencyKey(),
        },
      });
      setMessage("");
      setSuccessBanner(`Ticket #${created.id.slice(0, 8)} registered.`);
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
            "Support is temporarily unavailable. Please select your issue from the options above.",
          ),
        );
      }
    } finally {
      setAiPending(false);
    }
  }

  function cleanTicketMessage(raw: string): string {
    if (raw.startsWith("[FLEET_AUTO_AUDIT") || raw.startsWith("[UMAR_AUTO_AUDIT")) {
      const closeIdx = raw.indexOf("]");
      if (closeIdx !== -1) {
        return raw.slice(closeIdx + 1).trim();
      }
    }
    return raw;
  }

  return (
    <AppShell>
      <div className="space-y-4 max-w-md mx-auto">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="font-display text-2xl font-bold">{t("support")}</h1>
            <p className="text-xs text-muted-foreground">
              Partner assistance, order issues &amp; payouts
            </p>
          </div>
          <Badge tone="online">24x7 Help</Badge>
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

        {/* 1. Quick Issue Selector */}
        <Card className="space-y-3.5 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">Select Your Issue</h2>
            {activeOrder ? (
              <span className="font-mono text-xs text-primary font-bold">
                Order #{activeOrder.orderCode}
              </span>
            ) : null}
          </div>

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
                      ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                      : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <span className="text-base">{wf.icon}</span>
                  <span className="text-xs font-semibold leading-tight text-foreground">{wf.title}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-2 pt-1 border-t border-border">
            <p className="text-xs text-muted-foreground">{activeWorkflow.shortDesc}</p>
            <div className="flex flex-wrap gap-1.5">
              {activeWorkflow.presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setWorkflowNote(preset)}
                  className={`rounded-lg border px-2.5 py-1 text-xs text-left transition ${
                    workflowNote === preset
                      ? "border-primary bg-primary/10 font-medium text-primary"
                      : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <Input
              value={workflowNote}
              onChange={(e) => setWorkflowNote(e.target.value)}
              placeholder="Add details about your issue..."
              className="text-xs h-9 mt-1"
            />
          </div>

          <Button
            type="button"
            className="w-full text-xs font-semibold"
            disabled={workflowSubmitting || !workflowNote.trim()}
            onClick={() => void submitGuidedWorkflow()}
          >
            {workflowSubmitting ? "Submitting..." : `Submit ${activeWorkflow.title} Ticket`}
          </Button>
        </Card>

        {/* 2. Emergency Helplines */}
        <Card className="p-3.5 space-y-2 border-border bg-card">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Emergency Contacts
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <a
              href="tel:112"
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs font-bold text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
            >
              <span>🚨</span>
              <div>
                <div>112 Emergency</div>
                <div className="text-[10px] font-normal text-muted-foreground">Police &amp; SOS</div>
              </div>
            </a>
            <a
              href="tel:108"
              className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-2 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300"
            >
              <span>🚑</span>
              <div>
                <div>108 Ambulance</div>
                <div className="text-[10px] font-normal text-muted-foreground">Medical Response</div>
              </div>
            </a>
          </div>
        </Card>

        {/* 3. My Tickets */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            My Support Tickets ({tickets.length})
          </h2>
          {tickets.length === 0 ? (
            <Card className="p-4 text-center text-xs text-muted-foreground">
              No support tickets logged.
            </Card>
          ) : (
            <ul className="space-y-2">
              {tickets.map((ticket) => {
                const text = cleanTicketMessage(ticket.message);
                return (
                  <li key={ticket.id}>
                    <Card className="space-y-1.5 p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xs font-mono font-bold">
                            #{ticket.id.slice(0, 8)}
                          </CardTitle>
                          <Badge tone="muted">{ticket.topic.replaceAll("_", " ")}</Badge>
                        </div>
                        <Badge tone={ticket.status === "OPEN" ? "busy" : "online"}>
                          {ticket.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-foreground leading-relaxed">{text}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {new Date(ticket.createdAt).toLocaleString()}
                        {ticket.deliveryId ? ` · Order Delivery #${ticket.deliveryId.slice(0, 8)}` : ""}
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
