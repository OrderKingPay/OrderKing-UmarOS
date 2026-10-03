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
          <span className={connected ? "h-2 w-2 rounded-full bg-leaf animate-pulse" : "h-2 w-2 rounded-full bg-muted"} />
          <span>{connected ? "AI provider connected" : "AI provider unavailable"}</span>
        </div>
      </div>

      <Card className="border-line bg-surface-2 p-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚖️</span>
          <h2 className="text-sm font-bold tracking-tight">Official business resources</h2>
        </div>
        <p className="mt-1 text-xs text-muted">
          Use official government portals for food licensing, tax, and MSME services. OrderKing does not present third-party contacts as statutory desks.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href="https://foscos.fssai.gov.in" target="_blank" rel="noreferrer" className="rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold hover:bg-accent">
            FSSAI FoSCoS
          </a>
          <a href="https://www.gst.gov.in" target="_blank" rel="noreferrer" className="rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold hover:bg-accent">
            GST Portal
          </a>
          <a href="https://www.my.msme.gov.in/MyMsme/Reg/home.aspx" target="_blank" rel="noreferrer" className="rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold hover:bg-accent">
            MSME / Samadhaan
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
        <Button variant="secondary" size="sm" onClick={() => void send("Explain my actual settlement and tax deductions using only the authorized data available to you.")}>
          💳 Wednesday Payout &amp; Tax Breakdown
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void send("What is the documented process for a customer-cancelled order and any reimbursement that the actual platform policy supports?")}>
          🛡️ Cancellation & reimbursement policy
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
