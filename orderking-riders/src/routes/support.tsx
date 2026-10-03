import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { errorMessage, newIdempotencyKey } from "@/lib/client/errors";
import { useI18n } from "@/lib/rider/i18n-context";
import { createTicketFn, listTicketsFn, riderAiSupportFn } from "@/lib/server/rider-fns";
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
  const [aiResolution, setAiResolution] = useState<string>("");
  const [aiMessage, setAiMessage] = useState("");
  const [aiPending, setAiPending] = useState(false);

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

  async function askRiderAi() {
    if (!aiMessage.trim()) return;
    setAiPending(true);
    setAiResolution("");
    try {
      const result = await riderAiSupportFn({ data: { message: aiMessage, locale: "en" } });
      setAiResolution(result.text);
    } catch (err) {
      setError(errorMessage(err, "OpenAI rider support is unavailable. Create a support ticket for verified assistance."));
    } finally {
      setAiPending(false);
    }
  }


  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl">{t("support")}</h1>
          <Badge tone="muted">AI support</Badge>
        </div>

        <Card className="border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <span className="text-lg">🛡️</span>
            <h2 className="text-sm font-bold tracking-tight">Emergency & verified escalation</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Use emergency services for immediate danger. Use OrderKing support for delivery, cash, account and operational issues.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a href="tel:112" className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs font-bold text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">🚨 112 Emergency SOS</a>
            <a href="tel:1930" className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs font-bold text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">💳 1930 Cyber Fraud</a>
          </div>
        </Card>

        {/* Rider AI Support */}
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">🤖 OpenAI Rider Support</h2>
            <span className="text-[11px] text-muted-foreground">Server-side · verified actions only</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Describe a delivery, payment, vehicle, app, or safety issue. OpenAI can explain the next step; it cannot falsely claim that a platform action happened.
          </p>
          <div className="flex gap-2">
            <Input value={aiMessage} onChange={(e) => setAiMessage(e.target.value)} placeholder="What problem are you facing right now?" />
            <Button type="button" disabled={aiPending || !aiMessage.trim()} onClick={() => void askRiderAi()}>{aiPending ? "Thinking…" : "Ask AI"}</Button>
          </div>
          {aiResolution ? <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm whitespace-pre-wrap">{aiResolution}</div> : null}
          <Button type="button" variant="outline" className="w-full" onClick={() => { setTopic("OTHER"); setMessage(aiMessage); document.getElementById("rider-support-ticket")?.scrollIntoView({ behavior: "smooth" }); }}>
            Create verified support ticket
          </Button>
        </Card>

        {/* Traditional Ticket Logging */}
        <Card id="rider-support-ticket">
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
