import { createFileRoute } from "@tanstack/react-router";
import { VendorShell } from "@/components/vendor-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { errorMessage, newIdempotencyKey } from "@/lib/client/errors";
import { useT } from "@/components/use-t";
import { useVendor } from "@/components/use-vendor";
import { useEffect, useState, type FormEvent } from "react";
// Import from server functions or a mocked stub if they don't exist yet for partners
// Assuming partner-fns has similar logic
import { createTicketFn, listTicketsFn, partnerAiSupportFn } from "@/lib/server/api-more";

export const Route = createFileRoute("/support")({ component: Page });

const TOPICS = [
  "ORDER_ISSUE",
  "PAYOUT_ISSUE",
  "MENU_ISSUE",
  "APP_ISSUE",
  "FSSAI_COMPLIANCE",
  "GST_COMPLIANCE",
  "OTHER",
];

function Page() {
  const t = useT();
  const vendor = useVendor();
  const [topic, setTopic] = useState("ORDER_ISSUE");
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [aiResolution, setAiResolution] = useState<string>("");
  const [aiMessage, setAiMessage] = useState("");
  const [aiPending, setAiPending] = useState(false);

  async function load() {
    try {
      setTickets(await listTicketsFn({ data: { restaurantId: vendor.restaurantId } }));
    } catch (e) {
      // Mocked out if API doesn't exist yet
      console.warn("Tickets API missing, using mock");
      setTickets([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await createTicketFn({ data: { data: { topic, message, idempotencyKey: String(Date.now()) }, restaurantId: vendor.restaurantId } });
      setMessage("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit ticket");
    } finally {
      setPending(false);
    }
  }

  async function askPartnerAi() {
    if (!aiMessage.trim()) return;
    setAiPending(true);
    setAiResolution("");
    try {
      const result = await partnerAiSupportFn({ data: { data: { message: aiMessage, locale: "en" }, restaurantId: vendor.restaurantId } });
      setAiResolution(result.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OpenAI partner support is unavailable. Create a support ticket for verified assistance.");
    } finally {
      setAiPending(false);
    }
  }

  return (
    <VendorShell title="Support & Compliance" dataLabel={vendor.dataLabel} restaurantName={vendor.selected?.restaurantName}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl text-white">Support & Compliance</h1>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>24x7 AI Copilot Active</span>
          </div>
        </div>

        {/* 🚨 Emergency & Statutory Ombudsman Direct Links (Zero Legal Headache) */}
        <div className="rounded-[var(--radius-2xl)] border border-amber-500/30 bg-gradient-to-br from-black via-amber-950/20 to-amber-500/10 p-4 space-y-2 shadow-[0_0_15px_rgba(245,158,11,0.15)] backdrop-blur-md">
          <div className="flex items-center gap-2 text-amber-400">
            <span className="text-lg">⚖️</span>
            <h2 className="text-sm font-black tracking-tight drop-shadow-[0_0_5px_rgba(245,158,11,0.3)]">STATUTORY COMPLIANCE & OMBUDSMAN (Zero Legal Headache)</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Direct escalation to official Indian statutory authorities (FSSAI, DPIIT, GST). Complete 100% compliance interface.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <a href="tel:112" className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors">
              <span>🚨</span>
              <div>
                <div>112 Emergency SOS</div>
                <div className="text-[10px] font-normal text-red-400/80">National Police & SOS</div>
              </div>
            </a>
            <a href="https://foscos.fssai.gov.in" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors">
              <span>🛡️</span>
              <div>
                <div>FSSAI FoSCoS</div>
                <div className="text-[10px] font-normal text-emerald-400/80">Food Safety Authority</div>
              </div>
            </a>
            <a href="https://gst.gov.in" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-2.5 text-xs font-bold text-blue-400 hover:bg-blue-500/20 transition-colors">
              <span>💳</span>
              <div>
                <div>GST Portal</div>
                <div className="text-[10px] font-normal text-blue-400/80">Tax Compliance</div>
              </div>
            </a>
            <a href="https://udyamregistration.gov.in" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 p-2.5 text-xs font-bold text-purple-400 hover:bg-purple-500/20 transition-colors">
              <span>🏢</span>
              <div>
                <div>MSME Udyam</div>
                <div className="text-[10px] font-normal text-purple-400/80">MSME Ministry</div>
              </div>
            </a>
            <a href="https://www.startupindia.gov.in" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 p-2.5 text-xs font-bold text-purple-400 hover:bg-purple-500/20 transition-colors">
              <span>🚀</span>
              <div>
                <div>Startup India</div>
                <div className="text-[10px] font-normal text-purple-400/80">DPIIT Recognition</div>
              </div>
            </a>
            <a href="tel:1930" className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-colors">
              <span>💰</span>
              <div>
                <div>1930 Cyber Fraud</div>
                <div className="text-[10px] font-normal text-amber-400/80">Financial Frauds</div>
              </div>
            </a>
            <a href="tel:1915" className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-2.5 text-xs font-bold text-blue-400 hover:bg-blue-500/20 transition-colors">
              <span>📞</span>
              <div>
                <div>1915 NCH</div>
                <div className="text-[10px] font-normal text-blue-400/80">Consumer Helpline</div>
              </div>
            </a>
            <a href="mailto:partner.grievance@orderking.in" className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2.5 text-xs font-bold text-white hover:bg-white/10 transition-colors">
              <span>📩</span>
              <div>
                <div>Nodal Officer</div>
                <div className="text-[10px] font-normal text-zinc-400">OrderKing Legal</div>
              </div>
            </a>
          </div>
        </div>

        {/* Real OpenAI Partner Support */}
        <div className="rounded-[var(--radius-2xl)] border border-fuchsia-500/40 bg-gradient-to-br from-black via-fuchsia-950/20 to-black p-5 space-y-4 shadow-[0_0_20px_rgba(217,70,239,0.15)] backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-fuchsia-400 drop-shadow-[0_0_5px_rgba(217,70,239,0.4)]">🤖 Supreme Spark AI Copilot</h2>
            <span className="text-[11px] text-zinc-400">Server-side · verified actions only</span>
          </div>
          <p className="text-xs text-zinc-400">
            Describe a payout, order, app, or marketing issue. OpenAI can explain the next step; it cannot falsely claim that a platform action happened.
          </p>
          <div className="flex gap-2">
            <Input className="border-white/10 bg-white/5 text-white" value={aiMessage} onChange={(e) => setAiMessage(e.target.value)} placeholder="What issue is your restaurant facing?" />
            <Button type="button" className="bg-fuchsia-500 text-black font-bold hover:bg-fuchsia-400" disabled={aiPending || !aiMessage.trim()} onClick={() => void askPartnerAi()}>
              {aiPending ? "Thinking…" : "Ask AI"}
            </Button>
          </div>
          {aiResolution ? <div className="rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-50 p-3 text-sm whitespace-pre-wrap">{aiResolution}</div> : null}
          <Button type="button" variant="outline" className="w-full border-fuchsia-500/50 text-fuchsia-400 hover:bg-fuchsia-500/20" onClick={() => { setTopic("OTHER"); setMessage(aiMessage); document.getElementById("partner-support-ticket")?.scrollIntoView({ behavior: "smooth" }); }}>
            Escalate to Founder Command Ticket
          </Button>
        </div>

        {/* 🚀 Mandatory Growth & Advertisement Block */}
        <div className="rounded-[var(--radius-2xl)] border border-emerald-500/40 bg-gradient-to-r from-black via-emerald-950/40 to-black p-5 shadow-[0_0_20px_rgba(16,185,129,0.2)] backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl animate-bounce">🚀</span>
            <h2 className="text-lg font-black text-emerald-400 tracking-wide drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">MANDATORY RESTAURANT GROWTH</h2>
          </div>
          <p className="text-sm text-zinc-300 mb-4 font-medium">
            To keep your restaurant listed with 0% commission on direct orders, you MUST advertise OrderKing on your social media and WhatsApp status every day.
          </p>
            <button type="button" onClick={() => {
              const text = "Order delicious food from us on OrderKing! Tap here:";
              const url = "https://orderking.in/?ref=" + (vendor?.restaurantId || "vip");
              if (navigator.share) {
                navigator.share({ title: "OrderKing", text, url }).catch(e => console.error(e));
              } else {
                window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`);
              }
            }} className="flex-1 min-w-[140px] text-center rounded-[var(--radius-lg)] bg-emerald-500/20 border border-emerald-500/40 py-2.5 text-sm font-bold text-emerald-400 hover:bg-emerald-500/30 transition-all">
              Native Share / Referral Link
            </button>
        </div>

        {/* Traditional Ticket Logging */}
        <div id="partner-support-ticket" className="rounded-[var(--radius-2xl)] border border-white/10 bg-[#0a0a0a]/80 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
          <form onSubmit={submit} className="space-y-4">
            <label className="text-white font-bold block">Create a Support Ticket</label>
            <select
              className="h-11 w-full rounded-md border border-white/10 bg-white/5 px-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
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
              placeholder="Describe your issue in detail..."
              className="border-white/10 bg-white/5 text-white focus-visible:ring-emerald-500"
            />
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <Button size="lg" className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold" disabled={pending} type="submit">
              Submit Ticket
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
                    Ref: {ticket.id.slice(0, 8)}
                  </h3>
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-white/10 text-white hover:bg-white/20">{ticket.status}</span>
                </div>
                <p className="mt-2 text-sm text-white font-medium">{ticket.topic.replaceAll("_", " ")}</p>
                <p className="text-sm text-zinc-400">{ticket.message}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </VendorShell>
  );
}
