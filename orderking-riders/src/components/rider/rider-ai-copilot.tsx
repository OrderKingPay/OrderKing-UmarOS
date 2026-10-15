import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { errorMessage } from "@/lib/client/errors";
import { useI18n } from "@/lib/rider/i18n-context";
import {
  formatPaise,
  STATUTORY_BASE_DISTANCE_KM,
  STATUTORY_BASE_FARE_PAISE,
  STATUTORY_DISTANCE_RATE_PER_KM_PAISE,
} from "@/lib/rider/money";
import type { LocaleCode } from "@/lib/rider/types";
import { askAssistantFn } from "@/lib/server/assistant";
import {
  getEarningsFn,
  getHomeFn,
  getSettlementsFn,
  riderAiSupportFn,
} from "@/lib/server/rider-fns";
import {
  AlertTriangle,
  Banknote,
  Bot,
  Clock3,
  PhoneCall,
  RefreshCw,
  Send,
  Volume2,
  VolumeX,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

const formatINR = formatPaise;
const COD_FLOAT_LIMIT_PAISE = 250_000; // ₹2,500 statutory COD hand-float limit

const SPEECH_LANG_MAP: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  mr: "mr-IN",
  pa: "pa-IN",
  ta: "ta-IN",
  te: "te-IN",
};

export const FIELD_SUPPORT_CHIPS = [
  "Customer not answering phone/doorbell",
  "Long kitchen wait time (>15 mins)",
  "How is my Wednesday bank payout calculated?",
  "How to deposit collected COD cash?",
  "Vehicle breakdown / emergency protocol",
] as const;

export type FieldSupportChipPrompt = (typeof FIELD_SUPPORT_CHIPS)[number];

export async function askRiderAiFn(input: {
  question: string;
  busy?: boolean;
  locale?: LocaleCode;
  deliveryId?: string | null;
}): Promise<{ text: string }> {
  try {
    const res = await askAssistantFn({
      data: {
        question: input.question,
        busy: Boolean(input.busy),
        locale: input.locale,
      },
    });
    return { text: res.text };
  } catch (primaryErr) {
    try {
      const fallback = await riderAiSupportFn({
        data: {
          message: input.question,
          locale: input.locale,
          deliveryId: input.deliveryId ?? null,
        },
      });
      return { text: fallback.text };
    } catch {
      throw primaryErr;
    }
  }
}

export interface RiderAiCopilotProps {
  deliveryId?: string | null;
  activeOrderCode?: string | null;
  busy?: boolean;
  riderName?: string | null;
  locale?: LocaleCode;
  compact?: boolean;
  className?: string;
}

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  at: string;
};

type HomeSnapshot = Awaited<ReturnType<typeof getHomeFn>>;
type EarningsSnapshot = Awaited<ReturnType<typeof getEarningsFn>>;
type SettlementsSnapshot = Awaited<ReturnType<typeof getSettlementsFn>>;

export function RiderAiCopilot({
  deliveryId = null,
  activeOrderCode = null,
  busy: busyProp,
  riderName: riderNameProp,
  locale: localeProp,
  compact = false,
  className = "",
}: RiderAiCopilotProps = {}) {
  const { t, locale: contextLocale } = useI18n();
  const activeLocale = localeProp ?? contextLocale;

  const [home, setHome] = useState<HomeSnapshot | null>(null);
  const [earnings, setEarnings] = useState<EarningsSnapshot | null>(null);
  const [settlements, setSettlements] = useState<SettlementsSnapshot>([]);
  const [loadingContext, setLoadingContext] = useState(true);

  const [questionInput, setQuestionInput] = useState("");
  const [pending, setPending] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const syncCompanionContext = useCallback(
    async (seedWelcome = false) => {
      setLoadingContext(true);
      try {
        const [h, e, s] = await Promise.all([
          getHomeFn(),
          getEarningsFn({ data: { preset: "today" } }),
          getSettlementsFn(),
        ]);
        setHome(h);
        setEarnings(e);
        setSettlements(s);

        if (seedWelcome) {
          const fullName = riderNameProp || h.rider.fullName || "Partner";
          const firstName = fullName.trim().split(" ")[0] || "Partner";
          const unreconciledPaise = Math.max(
            h.pendingCashPaise,
            (e.totals.cashCollected ?? 0) - (e.totals.cashReconciled ?? 0),
          );
          const welcomeLines = [
            `Namaste ${firstName} ji! I am your OrderKing Rider Partner Companion (Spark AI).`,
            `• Today's Verified Earnings: ${formatINR(e.totals.net)} across ${h.completedToday} completed ${h.completedToday === 1 ? "trip" : "trips"} (Base ₹${STATUTORY_BASE_FARE_PAISE / 100} first ${STATUTORY_BASE_DISTANCE_KM} km + ₹${STATUTORY_DISTANCE_RATE_PER_KM_PAISE / 100}/km · Tips: ${formatINR(e.totals.tip)}).`,
            h.active
              ? `• Active Trip: Order #${h.active.orderCode} (${h.active.restaurant.name} → ${h.active.customer.area}) [${h.active.state.replaceAll("_", " ")}].`
              : `• Duty Status: ${h.rider.status}. Tap any field support topic below for step-by-step assistance.`,
            unreconciledPaise > 0
              ? `• COD Hand-Float: ${formatINR(unreconciledPaise)} collected (${formatINR(Math.max(0, COD_FLOAT_LIMIT_PAISE - unreconciledPaise))} remaining before the ₹2,500 limit).`
              : `• COD Hand-Float: ₹0.00 pending cash.`,
          ];

          setMessages([
            {
              id: "welcome",
              role: "assistant",
              text: welcomeLines.join("\n"),
              at: new Date().toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ]);
        }
      } catch {
        if (seedWelcome) {
          const firstName = (riderNameProp || "Partner").trim().split(" ")[0] || "Partner";
          setMessages([
            {
              id: "welcome-fallback",
              role: "assistant",
              text: `Namaste ${firstName} ji! I am your OrderKing Rider Partner Companion (Spark AI). Tap any 1-tap field support chip below or ask a question about an active order, kitchen wait time, COD deposit, or Wednesday bank payout.`,
              at: new Date().toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ]);
        }
      } finally {
        setLoadingContext(false);
      }
    },
    [riderNameProp],
  );

  useEffect(() => {
    void syncCompanionContext(true);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [syncCompanionContext]);

  const isBusy =
    busyProp ?? (Boolean(home?.active) || home?.rider.status === "BUSY");
  const resolvedDeliveryId = deliveryId ?? home?.active?.id ?? null;
  const resolvedOrderCode = activeOrderCode ?? home?.active?.orderCode ?? null;
  const firstName =
    (riderNameProp || home?.rider.fullName || "Partner").trim().split(" ")[0] ||
    "Partner";

  const todayNetPaise = earnings?.totals.net ?? home?.todayEarningsPaise ?? 0;
  const unreconciledCodPaise = Math.max(
    home?.pendingCashPaise ?? 0,
    (earnings?.totals.cashCollected ?? 0) - (earnings?.totals.cashReconciled ?? 0),
  );
  const latestSettlement = settlements[0] ?? null;

  function toggleSpeech(text: string, id: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[•⚠️🚨🔊]/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = SPEECH_LANG_MAP[activeLocale] || "en-IN";
    utterance.rate = 0.96;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  }

  async function handleAsk(promptText: string) {
    const trimmed = promptText.trim();
    if (!trimmed || pending) return;
    const nowTime = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const userMsgId = `user-${Date.now()}`;
    setQuestionInput("");
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", text: trimmed, at: nowTime },
    ]);
    setPending(true);

    try {
      const response = await askRiderAiFn({
        question: trimmed,
        busy: isBusy,
        locale: activeLocale,
        deliveryId: resolvedDeliveryId,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: "assistant",
          text: response.text,
          at: new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
      void syncCompanionContext(false);
    } catch (err: unknown) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          text: errorMessage(err, t("aiUnavailable")),
          at: new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await handleAsk(questionInput);
  }

  function chipIcon(chip: FieldSupportChipPrompt) {
    switch (chip) {
      case "Customer not answering phone/doorbell":
        return <PhoneCall className="size-3.5 text-primary" />;
      case "Long kitchen wait time (>15 mins)":
        return <Clock3 className="size-3.5 text-amber-600" />;
      case "How is my Wednesday bank payout calculated?":
        return <Banknote className="size-3.5 text-emerald-600" />;
      case "How to deposit collected COD cash?":
        return <Wallet className="size-3.5 text-sky-600" />;
      case "Vehicle breakdown / emergency protocol":
        return <AlertTriangle className="size-3.5 text-rose-600" />;
    }
  }

  return (
    <Card className={`space-y-4 border-primary/25 p-4 ${className}`.trim()}>
      {/* Companion Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Bot className="size-4" />
            </span>
            <CardTitle className="text-base font-bold">
              OrderKing Rider Partner Companion (Spark AI)
            </CardTitle>
            <Badge tone={isBusy ? "busy" : "online"}>
              {isBusy ? "ON TRIP SUPPORT" : "FIELD COMPANION"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Practical field support for pickup delays, unreachable customers, COD cash reconciliation, and weekly bank settlements
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loadingContext}
          onClick={() => void syncCompanionContext(false)}
        >
          <RefreshCw className={`size-3.5 ${loadingContext ? "animate-spin" : ""}`} />
          <span>{loadingContext ? "Syncing..." : "Sync Shift"}</span>
        </Button>
      </div>

      {/* Live Shift Snapshot Bar */}
      {!compact ? (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 text-xs">
          <div className="rounded-lg border border-border bg-muted/25 p-2.5">
            <p className="text-[11px] text-muted-foreground">Today&apos;s Partner Earnings</p>
            <p className="mt-0.5 font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {formatINR(todayNetPaise)} ({home?.completedToday ?? 0} trips)
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/25 p-2.5">
            <p className="text-[11px] text-muted-foreground">COD Cash Hand-Float</p>
            <p className="mt-0.5 font-mono text-sm font-bold text-foreground">
              {formatINR(unreconciledCodPaise)} / {formatINR(COD_FLOAT_LIMIT_PAISE)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/25 p-2.5">
            <p className="text-[11px] text-muted-foreground">
              {resolvedOrderCode ? `Active Order #${resolvedOrderCode}` : "Wednesday Settlement"}
            </p>
            <p className="mt-0.5 font-mono text-sm font-bold text-foreground">
              {home?.active
                ? `${home.active.state.replaceAll("_", " ")} (${formatINR(home.active.expectedPayoutPaise)})`
                : latestSettlement
                  ? `${formatINR(latestSettlement.amountPaise)} (${latestSettlement.status})`
                  : "Wednesday NEFT Cycle"}
            </p>
          </div>
        </div>
      ) : null}

      {/* 1-Tap Practical Field Support Chips */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          1-Tap Field Support Prompts
        </p>
        <div className="flex flex-wrap gap-2">
          {FIELD_SUPPORT_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={pending}
              onClick={() => void handleAsk(chip)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-left text-xs font-medium text-foreground transition hover:border-primary/50 hover:bg-primary/10 disabled:opacity-50"
            >
              {chipIcon(chip)}
              <span>{chip}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="max-h-96 space-y-2.5 overflow-y-auto pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={
              msg.role === "user"
                ? "ml-6 rounded-xl border border-border bg-muted/60 p-3 text-xs"
                : "rounded-xl border border-primary/20 bg-surface p-3.5 text-xs shadow-xs"
            }
          >
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="font-bold text-muted-foreground">
                {msg.role === "user"
                  ? `${firstName} · ${msg.at}`
                  : `Spark AI Companion · ${msg.at}`}
              </span>
              {msg.role === "assistant" ? (
                <button
                  type="button"
                  onClick={() => toggleSpeech(msg.text, msg.id)}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-muted"
                >
                  {speakingId === msg.id ? (
                    <>
                      <VolumeX className="size-3 text-rose-600" />
                      <span>Stop Audio</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="size-3 text-primary" />
                      <span>Listen</span>
                    </>
                  )}
                </button>
              ) : null}
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
              {msg.text}
            </p>
          </div>
        ))}
      </div>

      {/* Direct Question Input */}
      <form onSubmit={onSubmit} className="flex gap-2">
        <Input
          value={questionInput}
          onChange={(e) => setQuestionInput(e.target.value)}
          placeholder="Ask about kitchen wait pay, customer unreachable SOP, COD deposit, or payouts..."
          disabled={pending}
          className="text-xs"
        />
        <Button type="submit" size="sm" disabled={pending || !questionInput.trim()}>
          <Send className="size-3.5" />
          <span>{pending ? "Asking..." : t("send")}</span>
        </Button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5 text-[11px] text-muted-foreground">
        <span>
          Grounded on your live OrderKing partner ledger · Statutory floor {formatINR(STATUTORY_BASE_FARE_PAISE)} first {STATUTORY_BASE_DISTANCE_KM} km
        </span>
        <div className="flex items-center gap-3">
          <Link to="/support" className="font-medium text-primary hover:underline">
            Support Tickets →
          </Link>
          <Link to="/safety" className="font-medium text-rose-600 hover:underline">
            Emergency &amp; SOS →
          </Link>
        </div>
      </div>
    </Card>
  );
}

export default RiderAiCopilot;
