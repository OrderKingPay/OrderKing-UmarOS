import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { errorMessage } from "@/lib/client/errors";
import { useI18n } from "@/lib/rider/i18n-context";
import { getHomeFn } from "@/lib/server/rider-fns";
import { askAssistantFn } from "@/lib/server/assistant";
import { useEffect, useState, type FormEvent } from "react";

export const Route = createFileRoute("/assistant")({ component: Page });

function Page() {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);
  const [lines, setLines] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);

  useEffect(() => {
    void getHomeFn()
      .then((h) => setBusy(Boolean(h.active) || h.rider.status === "BUSY"))
      .catch(() => undefined);
  }, []);

  async function askQuestion(questionText: string) {
    if (!questionText.trim()) return;
    const question = questionText.trim();
    setQ("");
    setLines((l) => [...l, { role: "user", text: question }]);
    setPending(true);
    try {
      const res = await askAssistantFn({ data: { question, busy } });
      setLines((l) => [...l, { role: "assistant", text: res.text }]);
    } catch (err) {
      setLines((l) => [...l, { role: "assistant", text: errorMessage(err, t("aiUnavailable")) }]);
    } finally {
      setPending(false);
    }
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    await askQuestion(q);
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl">{t("assistant")}</h1>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            AI Rider Co-Pilot
          </span>
        </div>
        {busy ? <p className="text-sm text-busy">{t("aiDriving")}</p> : null}

        {/* 1-Tap Quick Rider Help Chips (Zomato-Style) */}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => void askQuestion("How much are today's net earnings and tips?")}
          >
            💵 Today&apos;s Net Earnings & Tips
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => void askQuestion("When is Wednesday payout transferred?")}
          >
            🗓️ Wednesday Payout Schedule
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => void askQuestion("Customer is not answering the phone")}
          >
            ⏱️ Customer Not Answering
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => void askQuestion("Restaurant food is taking too long")}
          >
            🏬 Restaurant Taking Too Long
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => void askQuestion("Vehicle breakdown or emergency protocol")}
          >
            🚨 Breakdown & Emergency
          </Button>
        </div>

        <div className="space-y-2">
          {lines.map((l, i) => (
            <Card key={i} className={l.role === "user" ? "bg-muted" : "border-primary/20"}>
              <p className="text-sm leading-relaxed">{l.text}</p>
            </Card>
          ))}
        </div>
        <form onSubmit={send} className="flex gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("askAssistant")}
            disabled={pending}
          />
          <Button type="submit" disabled={pending}>
            {t("send")}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
