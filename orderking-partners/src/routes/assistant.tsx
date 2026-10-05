import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { VendorShell } from "@/components/vendor-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { useT } from "@/components/use-t";
import { useVendor } from "@/components/use-vendor";
import { askAssistant } from "@/lib/server/api-more";

export const Route = createFileRoute("/assistant")({ component: AssistantPage });

function AssistantPage() {
  const t = useT();
  const vendor = useVendor();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const examples = t("assistant.examples").split("|");
  const connected = vendor.adapters?.ai.connected;

  async function send(text: string) {
    if (!text.trim()) return;
    setBusy(true);
    setLog((l) => [...l, { role: "user", text }]);
    try {
      const res = await askAssistant({ data: { restaurantId: vendor.restaurantId, question: text } });
      const reply = typeof res === "object" && res && "text" in res ? String(res.text) : t("assistant.unavailable");
      setLog((l) => [...l, { role: "assistant", text: reply }]);
    } catch (e) {
      setLog((l) => [
        ...l,
        { role: "assistant", text: e instanceof Error ? e.message : t("assistant.unavailable") },
      ]);
    } finally {
      setBusy(false);
      setQ("");
    }
  }

  return (
    <VendorShell title={t("nav.assistant")} dataLabel={vendor.dataLabel}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">{t("assistant.disclaimer")}</p>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>AI Kitchen Assistant Online</span>
        </div>
      </div>

      {/* ⚖️ Statutory Government & Regulatory Direct Links (Zero Legal Headache) */}
      <div className="rounded-[var(--radius-2xl)] border border-amber-500/30 bg-gradient-to-br from-black via-amber-950/20 to-amber-500/10 p-4 space-y-2 shadow-[0_0_15px_rgba(245,158,11,0.15)] backdrop-blur-md">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <span className="text-lg">⚖️</span>
          <h2 className="text-sm font-black tracking-tight drop-shadow-[0_0_5px_rgba(245,158,11,0.3)]">STATUTORY MERCHANT HELPLINES & OMBUDSMAN</h2>
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          Direct escalation to official Indian statutory departments and regulatory desks. Ensures compliance under FSSAI, GST &amp; DPIIT rules.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <a
            href="https://foscos.fssai.gov.in"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg border border-leaf-soft bg-white/5 p-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20/50 transition-colors"
          >
            <span>📜</span>
            <div>
              <div>FSSAI FoSCoS</div>
              <div className="text-[10px] font-normal text-zinc-400">foscos.fssai.gov.in</div>
            </div>
          </a>
          <a
            href="https://www.gst.gov.in"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2.5 text-xs font-bold text-white hover:bg-white/10 transition-colors"
          >
            <span>🏛️</span>
            <div>
              <div>GST Seva Kendra</div>
              <div className="text-[10px] font-normal text-zinc-400">1800-103-4786</div>
            </div>
          </a>
          <a
            href="https://samadhaan.msme.gov.in"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2.5 text-xs font-bold text-white hover:bg-white/10 transition-colors"
          >
            <span>🛡️</span>
            <div>
              <div>MSME Samadhaan</div>
              <div className="text-[10px] font-normal text-zinc-400">Delayed Payments</div>
            </div>
          </a>
          <a
            href="https://odrcountry.in"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2.5 text-xs font-bold text-white hover:bg-white/10 transition-colors"
          >
            <span>⚖️</span>
            <div>
              <div>DPIIT ODR</div>
              <div className="text-[10px] font-normal text-zinc-400">Dispute Resolution</div>
            </div>
          </a>
          <a
            href="mailto:merchant.care@orderking.in"
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2.5 text-xs font-bold text-white hover:bg-white/10 transition-colors"
          >
            <span>📩</span>
            <div>
              <div>Merchant Ombudsman</div>
              <div className="text-[10px] font-normal text-zinc-400">Statutory Desk</div>
            </div>
          </a>
          <a
            href="https://wa.me/919223166166?text=RESTAURANT%20PARTNER%20PRIORITY%20SUPPORT:%20Need%20immediate%20kitchen%20settlement%20assistance"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg bg-[#25D366]/10 p-2.5 text-xs font-bold text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
          >
            <span>💬</span>
            <div>
              <div>WhatsApp VIP Care</div>
              <div className="text-[10px] font-normal text-zinc-400">24x7 Priority Desk</div>
            </div>
          </a>
        </div>
      </div>

      {/* 🚀 Mandatory Growth & Advertisement Block */}
      <div className="rounded-[var(--radius-2xl)] border border-fuchsia-500/40 bg-gradient-to-r from-black via-fuchsia-950/40 to-black p-5 shadow-[0_0_20px_rgba(217,70,239,0.2)] backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl animate-bounce">🚀</span>
          <h2 className="text-lg font-black text-fuchsia-400 tracking-wide drop-shadow-[0_0_8px_rgba(217,70,239,0.4)]">MANDATORY RESTAURANT GROWTH</h2>
        </div>
        <p className="text-sm text-zinc-300 mb-4 font-medium">
          To sustain maximum footfall and zero-commission delivery offers, you must aggressively promote your OrderKing listing! Share your restaurant link to every WhatsApp group and social media channel right now.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href={`https://wa.me/?text=Order%20delicious%20food%20from%20my%20restaurant%20on%20OrderKing!%20Tap%20here:%20https://orderking.in/r/${vendor.restaurantId}`} target="_blank" rel="noreferrer" className="flex-1 min-w-[140px] text-center rounded-[var(--radius-lg)] bg-[#25D366]/20 border border-[#25D366]/40 py-2.5 text-sm font-bold text-[#25D366] hover:bg-[#25D366]/30 transition-all">
            WhatsApp Broadcast
          </a>
          <a href="#" className="flex-1 min-w-[140px] text-center rounded-[var(--radius-lg)] bg-pink-500/20 border border-pink-500/40 py-2.5 text-sm font-bold text-pink-400 hover:bg-pink-500/30 transition-all">
            Share on Instagram
          </a>
          <a href="#" className="flex-1 min-w-[140px] text-center rounded-[var(--radius-lg)] bg-blue-500/20 border border-blue-500/40 py-2.5 text-sm font-bold text-blue-400 hover:bg-blue-500/30 transition-all">
            Post on Facebook
          </a>
        </div>
      </div>

      {/* Quick Prompt Chips */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => void send("How do I use 1-click AI auto-setup to connect, configure and test my thermal printers and POS?")}>
          🛠️ 1-Click AI Auto-Connect Hardware &amp; POS
        </Button>
        <Button variant="outline" size="sm" onClick={() => void send("How do I test print dual KOT tickets for Kitchen food and Bar beverages?")}>
          🧾 Test Print Kitchen KOT &amp; Bar Tickets
        </Button>
        <Button variant="outline" size="sm" onClick={() => void send("How do I connect my 80mm ESC/POS thermal printer via Network IP or Bluetooth?")}>
          🖨️ Thermal Printer &amp; KOT Setup
        </Button>
        <Button variant="outline" size="sm" onClick={() => void send("How do I configure bidirectional sync with Petpooja or UrbanPiper POS?")}>
          🏬 Petpooja &amp; UrbanPiper POS Sync
        </Button>
        <Button variant="outline" size="sm" onClick={() => void send("How are my kitchen sales and orders today?")}>
          📊 Today&apos;s Sales &amp; Orders
        </Button>
        <Button variant="outline" size="sm" onClick={() => void send("Explain my Wednesday payout breakdown with 12% commission, GST, TCS and TDS deductions.")}>
          💳 Wednesday Payout &amp; Tax Breakdown
        </Button>
        <Button variant="outline" size="sm" onClick={() => void send("How do I claim 100% food value reimbursement for a customer-cancelled order?")}>
          🛡️ Cancelled Order Reimbursement
        </Button>
        <Button variant="outline" size="sm" onClick={() => void send("What are my top selling dishes today?")}>
          🍲 Top Selling Dishes
        </Button>
        <Button variant="outline" size="sm" onClick={() => void send("Which items are currently out of stock?")}>
          ⚠️ Check Out-of-Stock Items
        </Button>
        <Button variant="outline" size="sm" onClick={() => void send("How do I activate Rush Hour prep time?")}>
          🔥 Rush Hour &amp; Prep Buffers
        </Button>
      </div>
      <div className="space-y-2">
        {log.map((m, i) => (
          <div key={i} className={cn("p-4 rounded-[var(--radius-xl)] border backdrop-blur-md", m.role === "user" ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-50 shadow-[0_0_10px_rgba(6,182,212,0.1)] ml-8" : "bg-white/5 border-white/10 text-white mr-8")}>
            <p className="whitespace-pre-wrap text-sm">{m.text}</p>
          </div>
        ))}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(q);
        }}
      >
        <Textarea
          className="min-h-14"
          placeholder={t("assistant.placeholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button type="submit" disabled={busy}>
          {t("assistant.send")}
        </Button>
      </form>
    </VendorShell>
  );
}
