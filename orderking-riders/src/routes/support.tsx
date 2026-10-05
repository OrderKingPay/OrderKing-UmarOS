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
          <h1 className="font-display text-3xl text-white">{t("support")}</h1>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>24x7 AI Copilot Active</span>
          </div>
        </div>

        {/* 🚨 Emergency & Statutory Ombudsman Direct Links (Zero Legal Headache) */}
        <div className="rounded-[var(--radius-2xl)] border border-amber-500/30 bg-gradient-to-br from-black via-amber-950/20 to-amber-500/10 p-4 space-y-2 shadow-[0_0_15px_rgba(245,158,11,0.15)] backdrop-blur-md">
          <div className="flex items-center gap-2 text-amber-400">
            <span className="text-lg">⚖️</span>
            <h2 className="text-sm font-black tracking-tight drop-shadow-[0_0_5px_rgba(245,158,11,0.3)]">STATUTORY GIG-WORKER HELPLINES & OMBUDSMAN</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Direct escalation to official Indian statutory authorities and emergency services. Fulfills MoLE social security compliance.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <a href="tel:112" className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors">
              <span>🚨</span>
              <div>
                <div>112 Emergency SOS</div>
                <div className="text-[10px] font-normal text-red-400/80">National Police & SOS</div>
              </div>
            </a>
            <a href="tel:108" className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-2.5 text-xs font-bold text-blue-400 hover:bg-blue-500/20 transition-colors">
              <span>🚑</span>
              <div>
                <div>108 Free Ambulance</div>
                <div className="text-[10px] font-normal text-blue-400/80">Accident Response</div>
              </div>
            </a>
            <a href="https://eshram.gov.in" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors">
              <span>🛡️</span>
              <div>
                <div>MoLE e-Shram</div>
                <div className="text-[10px] font-normal text-emerald-400/80">eshram.gov.in</div>
              </div>
            </a>
            <a href="tel:18002585956" className="flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 p-2.5 text-xs font-bold text-purple-400 hover:bg-purple-500/20 transition-colors">
              <span>🏥</span>
              <div>
                <div>1800-258-5956</div>
                <div className="text-[10px] font-normal text-purple-400/80">Accident Insurance TPA</div>
              </div>
            </a>
            <a href="tel:1930" className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-colors">
              <span>💳</span>
              <div>
                <div>1930 Cyber Fraud</div>
                <div className="text-[10px] font-normal text-amber-400/80">Payment Disputes</div>
              </div>
            </a>
            <a href="mailto:rider.grievance@orderking.in" className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2.5 text-xs font-bold text-white hover:bg-white/10 transition-colors">
              <span>📩</span>
              <div>
                <div>Rider Grievance</div>
                <div className="text-[10px] font-normal text-zinc-400">Statutory Officer</div>
              </div>
            </a>
          </div>
        </div>

        {/* Real OpenAI Rider Support */}
        <div className="rounded-[var(--radius-2xl)] border border-fuchsia-500/40 bg-gradient-to-br from-black via-fuchsia-950/20 to-black p-5 space-y-4 shadow-[0_0_20px_rgba(217,70,239,0.15)] backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-fuchsia-400 drop-shadow-[0_0_5px_rgba(217,70,239,0.4)]">🤖 Supreme Spark AI Copilot</h2>
            <span className="text-[11px] text-zinc-400">Server-side · verified actions only</span>
          </div>
          <p className="text-xs text-zinc-400">
            Describe a delivery, payment, vehicle, app, or safety issue. OpenAI can explain the next step; it cannot falsely claim that a platform action happened.
          </p>
          <div className="flex gap-2">
            <Input className="border-white/10 bg-white/5 text-white" value={aiMessage} onChange={(e) => setAiMessage(e.target.value)} placeholder="What problem are you facing right now?" />
            <Button type="button" className="bg-fuchsia-500 text-black font-bold hover:bg-fuchsia-400" disabled={aiPending || !aiMessage.trim()} onClick={() => void askRiderAi()}>
              {aiPending ? "Thinking…" : "Ask AI"}
            </Button>
          </div>
          {aiResolution ? <div className="rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-50 p-3 text-sm whitespace-pre-wrap">{aiResolution}</div> : null}
          <Button type="button" variant="outline" className="w-full border-fuchsia-500/50 text-fuchsia-400 hover:bg-fuchsia-500/20" onClick={() => { setTopic("OTHER"); setMessage(aiMessage); document.getElementById("rider-support-ticket")?.scrollIntoView({ behavior: "smooth" }); }}>
            Escalate to Founder Command Ticket
          </Button>
        </div>

        {/* 🚀 Mandatory Growth & Advertisement Block */}
        <div className="rounded-[var(--radius-2xl)] border border-emerald-500/40 bg-gradient-to-r from-black via-emerald-950/40 to-black p-5 shadow-[0_0_20px_rgba(16,185,129,0.2)] backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl animate-bounce">🚀</span>
            <h2 className="text-lg font-black text-emerald-400 tracking-wide drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">MANDATORY RIDER GROWTH</h2>
          </div>
          <p className="text-sm text-zinc-300 mb-4 font-medium">
            To keep your VIP delivery status and high payouts, you must maximize your advertisement daily. Share the OrderKing app with customers, friends, and family!
          </p>
          <div className="flex flex-wrap gap-3">
            {user && (
              <a 
                href={`https://wa.me/?text=${encodeURIComponent(`Order delicious food from OrderKing! Get ₹50 OFF your first order using my VIP code: KING${user.id.replace(/[^a-zA-Z0-9]/g, "").slice(-5).toUpperCase() || "VIP26"}! Tap here: https://orderking.in/?ref=KING${user.id.replace(/[^a-zA-Z0-9]/g, "").slice(-5).toUpperCase() || "VIP26"}`)}`}
                target="_blank" 
                rel="noreferrer" 
                className="flex-1 min-w-[140px] text-center rounded-[var(--radius-lg)] bg-[#25D366]/20 border border-[#25D366]/40 py-2.5 text-sm font-bold text-[#25D366] hover:bg-[#25D366]/30 transition-all"
              >
                Share on WhatsApp
              </a>
            )}
            <a href="#" className="flex-1 min-w-[140px] text-center rounded-[var(--radius-lg)] bg-pink-500/20 border border-pink-500/40 py-2.5 text-sm font-bold text-pink-400 hover:bg-pink-500/30 transition-all">
              Post on Instagram
            </a>
            <a href="#" className="flex-1 min-w-[140px] text-center rounded-[var(--radius-lg)] bg-blue-500/20 border border-blue-500/40 py-2.5 text-sm font-bold text-blue-400 hover:bg-blue-500/30 transition-all">
              Share on Facebook
            </a>
          </div>
        </div>

        {/* Traditional Ticket Logging */}
        <div id="rider-support-ticket" className="rounded-[var(--radius-2xl)] border border-white/10 bg-[#0a0a0a]/80 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
          <form onSubmit={submit} className="space-y-4">
            <Label className="text-white font-bold">{t("createTicket")}</Label>
            <select
              className="h-11 w-full rounded-md border border-white/10 bg-white/5 px-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              value={topic}
              onChange={(e) => setTopic(e.target.value as TicketTopic)}
            >
              {TOPICS.map((x) => (
                <option key={x} value={x} className="bg-black text-white">
                  {x.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <Input
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("message")}
              className="border-white/10 bg-white/5 text-white focus-visible:ring-emerald-500"
            />
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <Button size="lg" className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold" disabled={pending} type="submit">
              {t("createTicket")}
            </Button>
          </form>
        </div>

        {/* Ticket List */}
        <ul className="space-y-3">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <div className="rounded-[var(--radius-xl)] border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-emerald-400">
                    {t("ticketRef")} {ticket.id.slice(0, 8)}
                  </h3>
                  <Badge className="bg-white/10 text-white hover:bg-white/20">{ticket.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-white font-medium">{ticket.topic.replaceAll("_", " ")}</p>
                <p className="text-sm text-zinc-400">{ticket.message}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
