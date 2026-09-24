import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
        <p className="text-sm text-muted">{t("assistant.disclaimer")}</p>
        <div className="flex items-center gap-1.5 rounded-full bg-leaf-soft px-3 py-1 text-xs font-semibold text-leaf">
          <span className="h-2 w-2 rounded-full bg-leaf animate-pulse" />
          <span>AI Kitchen Assistant Online</span>
        </div>
      </div>

      {/* ⚖️ Statutory Government & Regulatory Direct Links (Zero Legal Headache) */}
      <Card className="border-amber-500/30 bg-amber-500/5 p-4">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <span className="text-lg">⚖️</span>
          <h2 className="text-sm font-bold tracking-tight">STATUTORY MERCHANT HELPLINES & OMBUDSMAN</h2>
        </div>
        <p className="mt-1 text-xs text-muted">
          Direct escalation to official Indian statutory departments and regulatory desks. Ensures compliance under FSSAI, GST &amp; DPIIT rules.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <a
            href="https://foscos.fssai.gov.in"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg border border-leaf-soft bg-surface p-2.5 text-xs font-bold text-leaf hover:bg-leaf-soft/50 transition-colors"
          >
            <span>📜</span>
            <div>
              <div>FSSAI FoSCoS</div>
              <div className="text-[10px] font-normal text-muted">foscos.fssai.gov.in</div>
            </div>
          </a>
          <a
            href="https://www.gst.gov.in"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg border border-line bg-surface p-2.5 text-xs font-bold text-foreground hover:bg-accent transition-colors"
          >
            <span>🏛️</span>
            <div>
              <div>GST Seva Kendra</div>
              <div className="text-[10px] font-normal text-muted">1800-103-4786</div>
            </div>
          </a>
          <a
            href="https://samadhaan.msme.gov.in"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg border border-line bg-surface p-2.5 text-xs font-bold text-foreground hover:bg-accent transition-colors"
          >
            <span>🛡️</span>
            <div>
              <div>MSME Samadhaan</div>
              <div className="text-[10px] font-normal text-muted">Delayed Payments</div>
            </div>
          </a>
          <a
            href="https://odrcountry.in"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg border border-line bg-surface p-2.5 text-xs font-bold text-foreground hover:bg-accent transition-colors"
          >
            <span>⚖️</span>
            <div>
              <div>DPIIT ODR</div>
              <div className="text-[10px] font-normal text-muted">Dispute Resolution</div>
            </div>
          </a>
          <a
            href="mailto:merchant.care@orderking.in"
            className="flex items-center gap-2 rounded-lg border border-line bg-surface p-2.5 text-xs font-bold text-foreground hover:bg-accent transition-colors"
          >
            <span>📩</span>
            <div>
              <div>Merchant Ombudsman</div>
              <div className="text-[10px] font-normal text-muted">Statutory Desk</div>
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
              <div className="text-[10px] font-normal text-muted">24x7 Priority Desk</div>
            </div>
          </a>
        </div>
      </Card>

      {/* Quick Prompt Chips */}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={() => void send("How do I use 1-click AI auto-setup to connect, configure and test my thermal printers and POS?")}>
          🛠️ 1-Click AI Auto-Connect Hardware &amp; POS
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void send("How do I test print dual KOT tickets for Kitchen food and Bar beverages?")}>
          🧾 Test Print Kitchen KOT &amp; Bar Tickets
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void send("How do I connect my 80mm ESC/POS thermal printer via Network IP or Bluetooth?")}>
          🖨️ Thermal Printer &amp; KOT Setup
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void send("How do I configure bidirectional sync with Petpooja or UrbanPiper POS?")}>
          🏬 Petpooja &amp; UrbanPiper POS Sync
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void send("How are my kitchen sales and orders today?")}>
          📊 Today&apos;s Sales &amp; Orders
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void send("Explain my Wednesday payout breakdown with 12% commission, GST, TCS and TDS deductions.")}>
          💳 Wednesday Payout &amp; Tax Breakdown
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void send("How do I claim 100% food value reimbursement for a customer-cancelled order?")}>
          🛡️ Cancelled Order Reimbursement
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void send("What are my top selling dishes today?")}>
          🍲 Top Selling Dishes
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void send("Which items are currently out of stock?")}>
          ⚠️ Check Out-of-Stock Items
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void send("How do I activate Rush Hour prep time?")}>
          🔥 Rush Hour &amp; Prep Buffers
        </Button>
      </div>
      <div className="space-y-2">
        {log.map((m, i) => (
          <Card key={i} className={m.role === "user" ? "bg-chili-soft" : ""}>
            <p className="whitespace-pre-wrap text-sm">{m.text}</p>
          </Card>
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
