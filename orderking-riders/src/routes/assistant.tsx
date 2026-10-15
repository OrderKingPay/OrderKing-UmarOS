import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { errorMessage } from "@/lib/client/errors";
import { useI18n } from "@/lib/rider/i18n-context";
import { formatPaise } from "@/lib/rider/money";
import type { LocaleCode } from "@/lib/rider/types";
import {
  getHomeFn,
  getEarningsFn,
  getSettlementsFn,
  listTicketsFn,
} from "@/lib/server/rider-fns";
import { askAssistantFn } from "@/lib/server/assistant";
import { useEffect, useState, type FormEvent } from "react";
import {
  AlertOctagon,
  Bot,
  CheckCircle2,
  Clock3,
  Compass,
  Crown,
  ExternalLink,
  HelpCircle,
  IndianRupee,
  MapPin,
  Navigation,
  PhoneCall,
  RefreshCw,
  Send,
  ShieldAlert,
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";

import { LOCALE_LABELS } from "@/lib/rider/i18n";

export const Route = createFileRoute("/assistant")({ component: Page });

const SPEECH_LANG_MAP: Record<LocaleCode, string> = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  te: "te-IN",
  mr: "mr-IN",
  ta: "ta-IN",
  ur: "ur-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  or: "or-IN",
  pa: "pa-IN",
  as: "as-IN",
  mai: "hi-IN",
  sat: "hi-IN",
  ks: "ur-IN",
  ne: "ne-NP",
  sd: "hi-IN",
  kok: "mr-IN",
  doi: "hi-IN",
  mni: "bn-IN",
  brx: "as-IN",
  sa: "hi-IN",
};

const LOCALE_LABEL_MAP: Record<LocaleCode, string> = LOCALE_LABELS;

const COD_FLOAT_LIMIT_PAISE = 250_000; // ₹2,500 COD float ceiling

type HomeState = Awaited<ReturnType<typeof getHomeFn>>;
type EarningsState = Awaited<ReturnType<typeof getEarningsFn>>;
type SettlementsState = Awaited<ReturnType<typeof getSettlementsFn>>;
type TicketsState = Awaited<ReturnType<typeof listTicketsFn>>;

function computeMilestone(completedToday: number) {
  if (completedToday < 8) {
    return {
      tier: "Lunch/Dinner Starter Milestone (8 Trips)",
      target: 8,
      remaining: 8 - completedToday,
      bonusPaise: 10_000, // ₹100
      progressPct: Math.min(100, Math.round((completedToday / 8) * 100)),
    };
  }
  if (completedToday < 14) {
    return {
      tier: "Super-Shift Accelerator Milestone (14 Trips)",
      target: 14,
      remaining: 14 - completedToday,
      bonusPaise: 22_000, // ₹220
      progressPct: Math.min(100, Math.round((completedToday / 14) * 100)),
    };
  }
  if (completedToday < 20) {
    return {
      tier: "Full-Day Champion Milestone (20 Trips)",
      target: 20,
      remaining: 20 - completedToday,
      bonusPaise: 40_000, // ₹400
      progressPct: Math.min(100, Math.round((completedToday / 20) * 100)),
    };
  }
  return {
    tier: "Full-Day Champion Milestone Unlocked (20+ Trips)",
    target: 20,
    remaining: 0,
    bonusPaise: 40_000,
    progressPct: 100,
  };
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  at: string;
  waitResult?: {
    credited: boolean;
    waitedMins: number;
    billableMins: number;
    amountPaise: number;
    restaurantName?: string;
    orderCode?: string;
  } | null;
  emergencyBroadcast?: {
    dispatched: boolean;
    coords: { lat: number; lng: number };
    emergencyNumbers: string[];
    insuranceCover: string;
  } | null;
}

function Page() {
  const { t, locale } = useI18n();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | "advisor" | null>(null);

  const [home, setHome] = useState<HomeState | null>(null);
  const [earnings, setEarnings] = useState<EarningsState | null>(null);
  const [settlements, setSettlements] = useState<SettlementsState>([]);
  const [tickets, setTickets] = useState<TicketsState>([]);
  const [loadingContext, setLoadingContext] = useState(true);

  const [autoCreditNotice, setAutoCreditNotice] = useState<string | null>(null);
  const [sosActiveCoords, setSosActiveCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [lines, setLines] = useState<ChatMessage[]>([]);

  async function refreshLiveState(seedGreeting = false) {
    setLoadingContext(true);
    try {
      const [h, e, s, tk] = await Promise.all([
        getHomeFn(),
        getEarningsFn({ data: { preset: "today" } }),
        getSettlementsFn(),
        listTicketsFn(),
      ]);
      setHome(h);
      setEarnings(e);
      setSettlements(s);
      setTickets(tk);
      const isBusy = Boolean(h.active) || h.rider.status === "BUSY";
      setBusy(isBusy);

      if (seedGreeting) {
        const firstName = h.rider.fullName?.trim().split(" ")[0] || "Partner";
        const ms = computeMilestone(h.completedToday);
        const unreconciledPaise = Math.max(
          h.pendingCashPaise,
          (e.totals.cashCollected ?? 0) - (e.totals.cashReconciled ?? 0),
        );

        let greeting = "";
        if (locale === "bn") {
          greeting =
            `নমস্কার ${firstName} বাবু! কিং এআই (কিং স্পার্ক) ফ্লিট সাপোর্টে আপনাকে স্বাগতম — আপনার স্বয়ংক্রিয় শিফট ও উপাৰ্জন কো-পাইলট।\n` +
            `• আজকের উপার্জন: ${formatPaise(e.totals.net)} (${h.completedToday}টি সম্পন্ন ট্রিপ | টিপস: ${formatPaise(e.totals.tip)} | বোনাস: ${formatPaise(e.totals.incentive)})\n` +
            `• মাইলস্টোন কোচ: ${ms.remaining > 0 ? `আর ${ms.remaining}টি ট্রিপ সম্পন্ন করলেই পাবেন +${formatPaise(ms.bonusPaise)} (${ms.tier})` : `অভিনন্দন! ${ms.tier} আনলক হয়েছে!`}\n` +
            (h.active
              ? `• সক্রিয় ট্রিপ: #${h.active.orderCode} (${h.active.restaurant.name} → ${h.active.customer.area})। রেস্তোরাঁয় ৬ মিনিটের বেশি বিলম্ব হলে ১-ট্যাপে ওয়েট পে ক্রেডিট পান।`
              : `• পিক স্লট পরামর্শ: লাঞ্চ (১২:০০–৩:০০) ও ডিনার (৭:০০–১১:০০) সময়ে হাই-ডিমান্ড জোনে থাকলে ট্রিপ সর্বোচ্চ হয়।`);
        } else if (locale === "as") {
          greeting =
            `নমস্কাৰ ${firstName} ডাঙৰীয়া! কিং এআই (কিং স্পাৰ্ক) ফ্লিট এআই সহায়কলৈ স্বাগতম — আপোনাৰ লাইভ শিফট আৰু উপাৰ্জন নিৰীক্ষক।\n` +
            `• আজিৰ উপাৰ্জন: ${formatPaise(e.totals.net)} (${h.completedToday} টা সফল অৰ্ডাৰ | টিপছ: ${formatPaise(e.totals.tip)} | ইনচেণ্টিভ: ${formatPaise(e.totals.incentive)})\n` +
            `• লক্ষ্য নিৰ্ধাৰণ: ${ms.remaining > 0 ? `আৰু মাত্ৰ ${ms.remaining} টা অৰ্ডাৰ সম্পূৰ্ণ কৰিলেই লাভ কৰিব +${formatPaise(ms.bonusPaise)} (${ms.tier})` : `${ms.tier} সফলভাৱে আনলক হ'ল!`}\n` +
            (h.active
              ? `• চলিত অৰ্ডাৰ: #${h.active.orderCode} (${h.active.restaurant.name} → ${h.active.customer.area})। ৰন্ধনশালাত ৬ মিনিটতকৈ বেছি পলম হ'লে স্বয়ংক্ৰিয় ৱেইট পে ক্ৰেডিট লওক।`
              : `• টিপছ: দুপৰীয়া ১২:০০–৩:০০ বজাত আৰু সন্ধিয়া ৭:০০–১১:০০ বজাত সক্ৰিয় থাকি সৰ্বাধিক আয় কৰক।`);
        } else if (locale === "hi") {
          greeting =
            `नमस्ते ${firstName} जी! किंग एआई (किंग स्पार्क) फ्लीट सपोर्ट में आपका स्वागत है — आपका समर्पित ऑपरेशंस व अर्निंग्स मेंटर।\n` +
            `• आज की कुल कमाई: ${formatPaise(e.totals.net)} (${h.completedToday} पूर्ण ऑर्डर | 100% टिप्स: ${formatPaise(e.totals.tip)} | प्रोत्साहन राशि: ${formatPaise(e.totals.incentive)})\n` +
            `• माइलस्टोन कोच: ${ms.remaining > 0 ? `केवल ${ms.remaining} और डिलीवरी पूरी करके +${formatPaise(ms.bonusPaise)} (${ms.tier}) अनलॉक करें।` : `बधाई! ${ms.tier} अनलॉक हो गया है!`}\n` +
            (h.active
              ? `• सक्रिय डिलीवरी: ऑर्डर #${h.active.orderCode} (${h.active.restaurant.name} → ${h.active.customer.area})। किचन में 6 मिनट से अधिक देरी होने पर वेट-पे तुरंत क्लेम करें।`
              : `• पीक शिफ्ट सलाह: लंच (12:00–3:00) और डिनर (7:00–11:00) के समय सबसे ज्यादा ऑर्डर उपलब्ध रहते हैं।`);
        } else {
          greeting =
            `Namaste ${firstName} ji! Welcome to King AI (King Spark) — your autonomous Fleet AI Support & Operations Co-Pilot.\n` +
            `• Today's Take-Home: ${formatPaise(e.totals.net)} across ${h.completedToday} completed deliveries (Tips: ${formatPaise(e.totals.tip)} | Incentives: ${formatPaise(e.totals.incentive)}).\n` +
            `• Milestone Coach: ${ms.remaining > 0 ? `Complete ${ms.remaining} more trips to unlock +${formatPaise(ms.bonusPaise)} under ${ms.tier}.` : `You unlocked ${ms.tier} (+${formatPaise(ms.bonusPaise)})!`}\n` +
            (h.active
              ? `• Active Trip Guidance: You are on Order #${h.active.orderCode} (${h.active.restaurant.name} → ${h.active.customer.area}) [${h.active.state.replaceAll("_", " ")}]. Kitchen wait > 6m is compensated at ₹1.00/min.`
              : `• Shift Optimization: Peak order velocity runs during Lunch (12:00–3:00 PM) and Dinner (7:00–11:00 PM) in ${h.rider.preferredZones || "your primary zone"}.`) +
            (unreconciledPaise > 0
              ? `\n• COD Float Notice: You hold ${formatPaise(unreconciledPaise)} in COD cash. Deposit before hitting ₹2,500 to keep dispatch uninterrupted.`
              : "");
        }

        setLines([
          {
            role: "assistant",
            text: greeting,
            at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch {
      // Keep UI responsive even if initial fetch fails
    } finally {
      setLoadingContext(false);
    }
  }

  useEffect(() => {
    void refreshLiveState(true);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function speakText(text: string, id: number | "advisor") {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speakingIdx === id) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[•⚠️🚨🔊💵🗓️⏱️🏬⚡🧭💰📍]/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = SPEECH_LANG_MAP[locale] || "en-IN";
    utterance.rate = 0.96;
    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);
    setSpeakingIdx(id);
    window.speechSynthesis.speak(utterance);
  }

  async function askQuestion(
    questionText: string,
    action?: "auto_credit_wait" | "emergency_distress" | "verify_navigation" | "payout_breakdown" | "query",
  ) {
    if (!questionText.trim()) return;
    const question = questionText.trim();
    const nowLabel = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setQ("");
    setLines((l) => [...l, { role: "user", text: question, at: nowLabel }]);
    setPending(true);

    let coords: { lat: number; lng: number } | undefined = undefined;
    if (action === "emergency_distress" && typeof navigator !== "undefined" && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
        });
        coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setSosActiveCoords(coords);
      } catch {
        coords = { lat: 26.1445, lng: 91.7362 };
      }
    }

    try {
      const res = await askAssistantFn({
        data: {
          question,
          busy,
          locale,
          action,
          coords,
        },
      });

      if (res.waitCreditResult?.credited) {
        setAutoCreditNotice(
          `⚡ King AI Auto-Credit Executed: Credited ₹${(res.waitCreditResult.amountPaise / 100).toFixed(2)} Kitchen Wait Pay (${res.waitCreditResult.billableMins} mins beyond 6m grace) directly to your ledger!`,
        );
      }
      if (res.emergencyBroadcast?.dispatched) {
        setSosActiveCoords(res.emergencyBroadcast.coords);
      }

      setLines((l) => [
        ...l,
        {
          role: "assistant",
          text: res.text,
          at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          waitResult: res.waitCreditResult,
          emergencyBroadcast: res.emergencyBroadcast,
        },
      ]);
      void refreshLiveState(false);
    } catch (err) {
      setLines((l) => [
        ...l,
        {
          role: "assistant",
          text: errorMessage(err, t("aiUnavailable")),
          at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    await askQuestion(q, "query");
  }

  const firstName = home?.rider.fullName?.trim().split(" ")[0] || "Partner";
  const completedToday = home?.completedToday ?? 0;
  const todayNetPaise = earnings?.totals.net ?? home?.todayEarningsPaise ?? 0;
  const todayTipsPaise = earnings?.totals.tip ?? 0;
  const todayIncentivePaise = earnings?.totals.incentive ?? 0;
  const milestone = computeMilestone(completedToday);

  const unreconciledPaise = Math.max(
    home?.pendingCashPaise ?? 0,
    (earnings?.totals.cashCollected ?? 0) - (earnings?.totals.cashReconciled ?? 0),
  );
  const codRemainingPaise = Math.max(0, COD_FLOAT_LIMIT_PAISE - unreconciledPaise);
  const codUsagePct = Math.min(100, Math.round((unreconciledPaise / COD_FLOAT_LIMIT_PAISE) * 100));

  const activeOrder = home?.active ?? null;
  const openTickets = tickets.filter((tk) => tk.status === "OPEN");
  const latestSettlement = settlements[0] ?? null;

  const kitchenWaitMins =
    activeOrder?.arrivedRestaurantAt && !activeOrder.pickedUpAt
      ? Math.max(0, Math.floor((Date.now() - new Date(activeOrder.arrivedRestaurantAt).getTime()) / 60000))
      : 0;
  const accruedKitchenBonusInr = Math.max(0, kitchenWaitMins - 6);

  const advisorSpeechSummary =
    `Namaste ${firstName} ji. I am King AI, your Fleet AI Support Co-Pilot. Today you have completed ${completedToday} trips and earned ${formatPaise(todayNetPaise)}. ` +
    (milestone.remaining > 0
      ? `Complete ${milestone.remaining} more trips to unlock your ${formatPaise(milestone.bonusPaise)} milestone bonus. `
      : `You have unlocked your daily champion milestone bonus of ${formatPaise(milestone.bonusPaise)}. `) +
    (activeOrder
      ? `You have an active order #${activeOrder.orderCode} from ${activeOrder.restaurant.name} to ${activeOrder.customer.area}. Kitchen wait pay is verified at ₹1.00 per minute after 6 minutes grace. `
      : "") +
    (unreconciledPaise > 0
      ? `Your COD cash in hand is ${formatPaise(unreconciledPaise)}, with ${formatPaise(codRemainingPaise)} remaining before the ₹2,500 limit.`
      : "Your COD cash balance is clear.");

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Luxury Obsidian Gold & Royal Sapphire Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E5A93C]/40 bg-gradient-to-r from-[#0B0F19] via-[#0F172A] to-[#1E293B] p-4 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E5A93C] to-[#B37D20] text-black shadow-lg shadow-[#E5A93C]/30">
              <Crown className="size-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold tracking-wide text-white">
                  King AI <span className="text-[#E5A93C]">Fleet Support</span>
                </h1>
                <span className="rounded-full border border-[#2563EB] bg-[#2563EB]/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-300">
                  King Spark · 0 Human Escalation
                </span>
                <span className="rounded-full border border-[#E5A93C]/50 bg-[#E5A93C]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#E5A93C]">
                  Multilingual AI
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Autonomous Operations Co-Pilot · Payout Breakdown · Wait-Pay Auto-Credit · SOS Emergency Routing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => speakText(advisorSpeechSummary, "advisor")}
              className="h-8 border-[#E5A93C]/50 bg-black/40 text-xs text-[#E5A93C] hover:bg-[#E5A93C]/20"
            >
              <Volume2 className="mr-1.5 size-3.5" />
              {speakingIdx === "advisor" ? "Stop Audio" : `Listen (${LOCALE_LABEL_MAP[locale].split(" ")[0]})`}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={loadingContext}
              onClick={() => void refreshLiveState(false)}
              className="h-8 text-xs text-slate-300 hover:text-white"
            >
              <RefreshCw className={`mr-1 size-3.5 ${loadingContext ? "animate-spin" : ""}`} />
              {loadingContext ? "Syncing…" : "Sync State"}
            </Button>
          </div>
        </div>

        {/* Live Auto-Credit Success Banner */}
        {autoCreditNotice ? (
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/50 bg-emerald-950/40 p-3.5 text-xs font-semibold text-emerald-200 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Zap className="size-4 shrink-0 text-emerald-400" />
              <span>{autoCreditNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setAutoCreditNotice(null)}
              className="text-emerald-400 hover:text-emerald-200 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        ) : null}

        {/* Active Emergency Distress (112 / 108) Live Bar */}
        {sosActiveCoords ? (
          <div className="rounded-xl border-2 border-rose-500 bg-rose-950/60 p-4 text-white shadow-2xl backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-5 text-rose-400 animate-pulse" />
                <span className="font-display font-bold uppercase tracking-wider text-rose-300">
                  🚨 King AI Emergency Distress Protocol Active
                </span>
              </div>
              <span className="rounded bg-rose-500/20 px-2 py-0.5 font-mono text-[11px] text-rose-200">
                GPS: {sosActiveCoords.lat.toFixed(6)}, {sosActiveCoords.lng.toFixed(6)}
              </span>
            </div>
            <p className="text-xs text-rose-100">
              Your safety comes first! National distress channels have been prepped with your exact live coordinates. Active order reassigned with ZERO cancellation penalty.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href="tel:112"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-rose-600 px-4 text-xs font-bold text-white shadow hover:bg-rose-500"
              >
                <PhoneCall className="size-3.5" /> Call 112 (National Police/Fire)
              </a>
              <a
                href="tel:108"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white shadow hover:bg-emerald-500"
              >
                <PhoneCall className="size-3.5" /> Call 108 (Free Medical Ambulance)
              </a>
              <a
                href="tel:18002585956"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 bg-black/40 px-3 text-xs text-slate-200 hover:bg-white/10"
              >
                1800-258-5956 (Cashless ₹5L Insurance)
              </a>
            </div>
          </div>
        ) : null}

        {busy ? (
          <Card className="border-[#E5A93C]/40 bg-[#E5A93C]/10 p-3">
            <p className="text-xs font-semibold text-[#E5A93C] dark:text-[#E5A93C]">
              🛵 {t("aiDriving")} — Tap <strong>🔊 Listen in My Language</strong> on any response to hear voice guidance hands-free while riding safely.
            </p>
          </Card>
        ) : null}

        {/* 4 Primary King AI Autonomous Reasoning Action Cards */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {/* Action 1: Wait-Time Auto-Credit */}
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              void askQuestion(
                "Verify kitchen wait time outside restaurant and auto-credit wait pay if arrival exceeds 6 mins",
                "auto_credit_wait",
              )
            }
            className="flex flex-col items-start justify-between rounded-xl border border-[#E5A93C]/40 bg-gradient-to-br from-[#0B0F19] to-[#1E293B] p-3 text-left transition hover:border-[#E5A93C] hover:shadow-lg group"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#E5A93C]/20 text-[#E5A93C] group-hover:scale-110 transition-transform">
              <Zap className="size-4" />
            </div>
            <div className="mt-2">
              <p className="text-xs font-bold text-white">Auto-Credit Wait Pay</p>
              <p className="text-[10px] text-slate-400">₹1/min after 6m kitchen grace</p>
            </div>
          </button>

          {/* Action 2: Payout Breakdown */}
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              void askQuestion(
                "Explain my exact payout breakdown: base fare, progressive distance slabs, kitchen wait pay, and 100% customer tips",
                "payout_breakdown",
              )
            }
            className="flex flex-col items-start justify-between rounded-xl border border-[#2563EB]/40 bg-gradient-to-br from-[#0B0F19] to-[#1E293B] p-3 text-left transition hover:border-[#2563EB] hover:shadow-lg group"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#2563EB]/20 text-sky-400 group-hover:scale-110 transition-transform">
              <IndianRupee className="size-4" />
            </div>
            <div className="mt-2">
              <p className="text-xs font-bold text-white">Payout Breakdown</p>
              <p className="text-[10px] text-slate-400">₹35 Base + ₹12-₹15/km + 100% Tips</p>
            </div>
          </button>

          {/* Action 3: Navigation & Landmark */}
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              void askQuestion(
                "Guide navigation, gated entry instructions, and landmark resolution for my order",
                "verify_navigation",
              )
            }
            className="flex flex-col items-start justify-between rounded-xl border border-emerald-500/40 bg-gradient-to-br from-[#0B0F19] to-[#1E293B] p-3 text-left transition hover:border-emerald-400 hover:shadow-lg group"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
              <Compass className="size-4" />
            </div>
            <div className="mt-2">
              <p className="text-xs font-bold text-white">Landmark & GPS Guide</p>
              <p className="text-[10px] text-slate-400">Gate access & geofence bypass</p>
            </div>
          </button>

          {/* Action 4: Emergency SOS (112 / 108) */}
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              void askQuestion(
                "EMERGENCY DISTRESS SOS: Route signal to 112 / 108 with live GPS coordinates immediately",
                "emergency_distress",
              )
            }
            className="flex flex-col items-start justify-between rounded-xl border border-rose-500/50 bg-gradient-to-br from-[#1F1015] to-[#2A0E17] p-3 text-left transition hover:border-rose-400 hover:shadow-lg group"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 group-hover:scale-110 transition-transform">
              <AlertOctagon className="size-4" />
            </div>
            <div className="mt-2">
              <p className="text-xs font-bold text-rose-200">Emergency SOS</p>
              <p className="text-[10px] text-rose-300">Direct 112 / 108 + Live GPS</p>
            </div>
          </button>
        </div>

        {/* Autonomous Rider Self-Diagnosis & Earnings Growth Advisor */}
        <div className="rounded-2xl border border-[#E5A93C]/30 bg-gradient-to-br from-[#0B0F19] via-[#0F172A] to-[#1E293B] p-4 text-white shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#E5A93C]">
                King AI Autonomous Operations & Earnings Co-Pilot
              </p>
              <h2 className="text-base font-bold text-white">
                Namaste {firstName} ji — Live Shift & Take-Home Coach
              </h2>
            </div>
            <Badge tone={home?.rider.status === "ONLINE" ? "online" : home?.rider.status === "BUSY" ? "busy" : "offline"}>
              {home?.rider.status ?? "SYNCING"}
            </Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {/* 1. Live Earnings & Milestone Coach */}
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  📈 Live Earnings & Milestone Coach
                </span>
                <span className="font-mono text-sm font-bold text-emerald-400">
                  {formatPaise(todayNetPaise)} today
                </span>
              </div>

              <p className="text-xs leading-relaxed text-slate-300">
                You have completed <strong className="text-white">{completedToday} {completedToday === 1 ? "trip" : "trips"}</strong> today
                (Tips: <strong className="text-white">{formatPaise(todayTipsPaise)}</strong> · Wait & Surge:{" "}
                <strong className="text-white">{formatPaise(todayIncentivePaise)}</strong>).{" "}
                {milestone.remaining > 0 ? (
                  <>
                    Complete <strong className="text-white">{milestone.remaining} more trips</strong>{" "}
                    to unlock <strong className="text-[#E5A93C]">+{formatPaise(milestone.bonusPaise)}</strong> under{" "}
                    <span className="text-sky-300 underline decoration-dotted">{milestone.tier}</span>!
                  </>
                ) : (
                  <>
                    You unlocked the <strong className="text-[#E5A93C]">{milestone.tier} (+{formatPaise(milestone.bonusPaise)})</strong>! Every additional trip adds full distance + surge pay.
                  </>
                )}
              </p>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>{milestone.tier}</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {completedToday} / {milestone.target} trips ({milestone.progressPct}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#E5A93C] transition-all"
                    style={{ width: `${milestone.progressPct}%` }}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 text-[11px] text-slate-300">
                <strong className="text-[#E5A93C]">Peak Slot Maximizer:</strong> Stay logged into{" "}
                <span className="font-semibold text-white">{home?.rider.preferredZones || "your primary zone"}</span>{" "}
                during <strong>Lunch (12:00–3:00 PM)</strong> and <strong>Dinner (7:00–11:00 PM)</strong> to hit your daily milestone 40% faster.
              </div>
            </div>

            {/* 2. Live On-Trip & Wait-Time Guard */}
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#E5A93C]">
                  🧭 Live On-Trip & Wait-Time Guard
                </span>
                <span className="text-xs font-mono font-semibold text-sky-400">
                  COD: {formatPaise(unreconciledPaise)} / ₹2,500
                </span>
              </div>

              {activeOrder ? (
                <div className="rounded-lg border border-[#2563EB]/40 bg-[#2563EB]/10 p-2.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Active Order #{activeOrder.orderCode}</span>
                    <span className="font-mono text-[#E5A93C]">{formatPaise(activeOrder.expectedPayoutPaise)}</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    <strong className="text-white">{activeOrder.restaurant.name}</strong> → <strong className="text-white">{activeOrder.customer.area}</strong> · Stage:{" "}
                    <span className="font-semibold text-sky-300">{activeOrder.state.replaceAll("_", " ")}</span>
                  </p>

                  {/* Kitchen wait time indicator */}
                  {kitchenWaitMins > 0 ? (
                    <div className="flex items-center justify-between rounded bg-black/40 p-2 text-xs">
                      <span className="text-slate-300">
                        Kitchen Wait: <strong>{kitchenWaitMins}m</strong> ({kitchenWaitMins > 6 ? `₹${accruedKitchenBonusInr} bonus accrued` : `${6 - kitchenWaitMins}m grace left`})
                      </span>
                      {kitchenWaitMins > 6 ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            void askQuestion(
                              "Auto-credit verified wait pay for my active order now",
                              "auto_credit_wait",
                            )
                          }
                          className="h-6 bg-[#E5A93C] text-[10px] font-bold text-black hover:bg-[#B37D20]"
                        >
                          ⚡ Auto-Credit ₹{accruedKitchenBonusInr}
                        </Button>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <Link
                      to="/delivery/$id"
                      params={{ id: activeOrder.id }}
                      className="font-semibold text-sky-400 underline"
                    >
                      Open Delivery Screen →
                    </Link>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        activeOrder.restaurant.address || activeOrder.restaurant.name,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#E5A93C] underline"
                    >
                      <Navigation className="size-3" /> External GPS
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-xs leading-relaxed text-slate-400">
                  <strong className="text-white">No active delivery in progress.</strong>{" "}
                  {home?.rider.status === "OFFLINE"
                    ? "Toggle ONLINE on Home to start receiving dispatch offers."
                    : "You are ONLINE and eligible for immediate dispatch in your zone."}
                </p>
              )}

              {/* COD Float Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>COD Cash-in-Hand Balance</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {formatPaise(codRemainingPaise)} limit left
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all ${codUsagePct >= 80 ? "bg-amber-500" : "bg-sky-500"}`}
                    style={{ width: `${codUsagePct}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  {unreconciledPaise > 0
                    ? `Deposit ${formatPaise(unreconciledPaise)} via UPI before hitting ₹2,500 to keep dispatch uninterrupted.`
                    : "₹0 pending cash liability. Full weekly earnings settle every Wednesday by 2:00 PM IST."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 1-Tap Multilingual Prompts (Bengali, Assamese, Hindi, English) */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            1-Tap Quick Multilingual Questions (বাংলা · অসমীয়া · हिन्दी · English)
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => void askQuestion("Explain my exact payout breakdown: base ₹35, distance slabs, wait pay, and 100% tips", "payout_breakdown")}
              className="border-primary/40 text-xs"
            >
              💰 Payout Breakdown & Rates
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => void askQuestion("রেস্তোরাঁয় ৬ মিনিটের বেশি অপেক্ষা করেছি — ওয়েট পে ক্রেডিট করুন", "auto_credit_wait")}
              className="border-[#E5A93C]/50 text-xs"
            >
              🏬 বাংলা: ওয়েট পে ক্রেডিট (&gt;৬ মিনিট)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => void askQuestion("ৰোষ্টুৰেণ্টত ৬ মিনিটতকৈ বেছি পলম হৈছে — ৱেইট পে ক্ৰেডিট কৰক", "auto_credit_wait")}
              className="border-[#2563EB]/50 text-xs"
            >
              🏬 অসমীয়া: ৱেইট পে ক্ৰেডিট
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => void askQuestion("रेस्तरां में 6 मिनट से ज्यादा इंतज़ार — ₹1/मिनट वेट पे क्रेडिट करो", "auto_credit_wait")}
              className="border-emerald-500/50 text-xs"
            >
              🏬 हिन्दी: वेट पे क्रेडिट (&gt;6 मिनट)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => void askQuestion("Customer is not answering at doorstep — what is the 3-call zero penalty rule?", "verify_navigation")}
              className="text-xs"
            >
              ⏱️ Doorstep Unreachable SOP (3-Call Rule)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => void askQuestion("When is my Wednesday payout transferred and what is my COD cash balance?", "payout_breakdown")}
              className="text-xs"
            >
              🗓️ Wednesday Payout & COD
            </Button>
          </div>
        </div>

        {/* Conversation Thread with Voice Read-Aloud */}
        <div className="space-y-3">
          {lines.map((l, i) => (
            <Card
              key={i}
              className={
                l.role === "user"
                  ? "ml-6 bg-muted/80 p-3.5"
                  : "border-[#E5A93C]/30 bg-surface p-4 shadow-sm"
              }
            >
              <div className="mb-2 flex items-center justify-between gap-2 border-b border-border/40 pb-1.5">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {l.role === "user" ? (
                    <>👤 {firstName} ({l.at})</>
                  ) : (
                    <>
                      <Crown className="size-3.5 text-[#E5A93C]" />
                      <span className="text-[#E5A93C]">King AI Fleet Support</span> ({l.at})
                    </>
                  )}
                </span>
                {l.role === "assistant" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 border-[#E5A93C]/40 px-2.5 text-xs text-[#E5A93C] hover:bg-[#E5A93C]/10"
                    onClick={() => speakText(l.text, i)}
                  >
                    {speakingIdx === i ? <VolumeX className="mr-1 size-3" /> : <Volume2 className="mr-1 size-3" />}
                    {speakingIdx === i ? "Stop" : "Listen"}
                  </Button>
                ) : null}
              </div>

              {/* Extra visual indicators for credited wait pay or emergency broadcast */}
              {l.waitResult?.credited ? (
                <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  Autonomous Auto-Credit Executed: ₹{(l.waitResult.amountPaise / 100).toFixed(2)} added to shift ledger.
                </div>
              ) : null}

              <p className="whitespace-pre-line text-sm leading-relaxed">{l.text}</p>
            </Card>
          ))}
        </div>

        {/* Question Input Form */}
        <form onSubmit={send} className="flex gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`${t("askAssistant")} (English, বাংলা, অসমীয়া, हिन्दी…)`}
            disabled={pending}
            className="border-[#E5A93C]/30 focus:border-[#E5A93C]"
          />
          <Button
            type="submit"
            disabled={pending || !q.trim()}
            className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
          >
            {pending ? (
              "Thinking…"
            ) : (
              <>
                <Send className="mr-1 size-3.5" /> {t("send")}
              </>
            )}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
