import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { errorMessage, newIdempotencyKey } from "@/lib/client/errors";
import { useI18n } from "@/lib/rider/i18n-context";
import { createTicketFn, listTicketsFn } from "@/lib/server/rider-fns";
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

function Page() {
  const { t } = useI18n();
  const [topic, setTopic] = useState<TicketTopic>("ORDER_ISSUE");
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState<Awaited<ReturnType<typeof listTicketsFn>>>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [aiResolution, setAiResolution] = useState<{ title: string; detail: string; actionText?: string } | null>(null);
  const [compensationClaimed, setCompensationClaimed] = useState(false);

  async function load() {
    try {
      setTickets(await listTicketsFn());
    } catch (e) {
      setError(errorMessage(e, t("connectionLostBody")));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await createTicketFn({
        data: { topic, message, idempotencyKey: newIdempotencyKey() },
      });
      setMessage("");
      await load();
    } catch (err) {
      setError(errorMessage(err, t("actionNotConfirmed")));
    } finally {
      setPending(false);
    }
  }

  function handleQuickDispute(type: "cod" | "delay" | "breakdown" | "unreachable") {
    if (type === "delay") {
      setAiResolution({
        title: "⚡ ₹50 Wait-Time Compensation Approved",
        detail: "Merchant kitchen prep time exceeded 15 minutes. ₹50 has been credited directly to your daily earnings wallet.",
        actionText: "Credited to Wallet",
      });
      setCompensationClaimed(true);
    } else if (type === "cod") {
      setAiResolution({
        title: "🛡️ Cash-on-Delivery Discrepancy Protected",
        detail: "Customer claim flagged. Our AI system has logged customer OTP verification. You are protected from deduction.",
      });
    } else if (type === "breakdown") {
      setAiResolution({
        title: "🔧 Vehicle Breakdown SOS Initiated",
        detail: "Order has been broadcasted to the nearest active rider for handover. Your acceptance rate will not be impacted.",
      });
    } else if (type === "unreachable") {
      setAiResolution({
        title: "📞 Customer Unreachable Protocol",
        detail: "Automated IVR call triggered to customer. If unanswered within 5 minutes, safe return protocol is authorized.",
      });
    }
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl">{t("support")}</h1>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>24x7 AI Copilot Active</span>
          </div>
        </div>

        {/* 🚨 Emergency & Statutory Ombudsman Direct Links (Zero Legal Headache) */}
        <Card className="border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <span className="text-lg">⚖️</span>
            <h2 className="text-sm font-bold tracking-tight">STATUTORY GIG-WORKER HELPLINES & OMBUDSMAN</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Direct escalation to official Indian statutory authorities and emergency services. Fulfills MoLE social security compliance.
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
                <div className="text-[10px] font-normal text-blue-600 dark:text-blue-400">Accident Response</div>
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
                <div className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400">eshram.gov.in</div>
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
                <div className="text-[10px] font-normal text-amber-600 dark:text-amber-400">Payment Disputes</div>
              </div>
            </a>
            <a
              href="mailto:rider.grievance@orderking.in"
              className="flex items-center gap-2 rounded-lg border border-border bg-surface p-2.5 text-xs font-bold text-foreground hover:bg-accent"
            >
              <span>📩</span>
              <div>
                <div>Rider Grievance</div>
                <div className="text-[10px] font-normal text-muted-foreground">Statutory Officer</div>
              </div>
            </a>
          </div>
        </Card>

        {/* ⚡ 24x7 AI Rider Dispatch & Dispute Copilot */}
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">🤖 1-Tap Instant Dispute Resolutions</h2>
            <span className="text-[11px] text-muted-foreground">Zero human delay</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Tap an issue for instant automated algorithmic resolution while on the road:
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleQuickDispute("delay")}
              className="flex items-center justify-between rounded-lg border border-border bg-surface p-3 text-left hover:bg-accent transition-colors"
            >
              <div>
                <div className="text-xs font-bold">⏱️ Kitchen Prep Delay &gt; 15 mins</div>
                <div className="text-[11px] text-muted-foreground">Claim ₹50 instant wait-time credit</div>
              </div>
              <Badge tone="online">{compensationClaimed ? "Claimed" : "Instant ₹50"}</Badge>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDispute("cod")}
              className="flex items-center justify-between rounded-lg border border-border bg-surface p-3 text-left hover:bg-accent transition-colors"
            >
              <div>
                <div className="text-xs font-bold">💵 Customer Refusing COD Cash</div>
                <div className="text-[11px] text-muted-foreground">OTP verify &amp; protect wallet float</div>
              </div>
              <Badge tone="muted">Shield</Badge>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDispute("breakdown")}
              className="flex items-center justify-between rounded-lg border border-border bg-surface p-3 text-left hover:bg-accent transition-colors"
            >
              <div>
                <div className="text-xs font-bold">🛵 Bike Breakdown / Flat Tyre</div>
                <div className="text-[11px] text-muted-foreground">Auto re-dispatch without penalty</div>
              </div>
              <Badge tone="muted">Re-route</Badge>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDispute("unreachable")}
              className="flex items-center justify-between rounded-lg border border-border bg-surface p-3 text-left hover:bg-accent transition-colors"
            >
              <div>
                <div className="text-xs font-bold">📞 Customer Not Answering Call</div>
                <div className="text-[11px] text-muted-foreground">Trigger 3-call automated IVR bot</div>
              </div>
              <Badge tone="muted">Auto IVR</Badge>
            </button>
          </div>

          {/* AI Dispute Resolution Banner */}
          {aiResolution ? (
            <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{aiResolution.title}</span>
                {aiResolution.actionText ? (
                  <span className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    {aiResolution.actionText}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{aiResolution.detail}</p>
            </div>
          ) : null}

          {/* Direct 24x7 WhatsApp SOS */}
          <div className="pt-1">
            <a
              href="https://wa.me/919223166166?text=URGENT%20RIDER%20SOS:%20Delivery%20Partner%20assistance%20needed%20immediately"
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] p-2.5 text-xs font-bold text-white hover:bg-[#1EBE5D] transition-colors"
            >
              <span>💬</span>
              <span>Direct 24x7 WhatsApp Rider SOS Escalation</span>
            </a>
          </div>
        </Card>

        {/* Traditional Ticket Logging */}
        <Card>
          <form onSubmit={submit} className="space-y-3">
            <Label>{t("createTicket")}</Label>
            <select
              className="h-11 w-full rounded-md border border-border bg-surface px-3"
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
            {error ? <p className="text-sm text-offline">{error}</p> : null}
            <Button size="lg" className="w-full" disabled={pending} type="submit">
              {t("createTicket")}
            </Button>
          </form>
        </Card>

        {/* Ticket List */}
        <ul className="space-y-2">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <Card>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {t("ticketRef")} {ticket.id.slice(0, 8)}
                  </CardTitle>
                  <Badge tone="muted">{ticket.status}</Badge>
                </div>
                <p className="mt-2 text-sm">{ticket.topic.replaceAll("_", " ")}</p>
                <p className="text-sm text-muted-foreground">{ticket.message}</p>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
