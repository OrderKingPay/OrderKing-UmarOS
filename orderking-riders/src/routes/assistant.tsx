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
import { askAssistantFn, type ResolutionAction } from "@/lib/server/assistant";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  AlertOctagon,
  Camera,
  FileText,
  Image as ImageIcon,
  Paperclip,
  X,
  Bot,
  CheckCircle2,
  Clock3,
  Compass,
  Crown,
  ExternalLink,
  HelpCircle,
  IndianRupee,
  Languages,
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

const LOCALE_LABEL_MAP: Record<LocaleCode, string> = LOCALE_LABELS;

const COD_FLOAT_LIMIT_PAISE = 250_000; // ₹2,500 COD float ceiling

type HomeState = Awaited<ReturnType<typeof getHomeFn>>;
type EarningsState = Awaited<ReturnType<typeof getEarningsFn>>;
type SettlementsState = Awaited<ReturnType<typeof getSettlementsFn>>;
type TicketsState = Awaited<ReturnType<typeof listTicketsFn>>;

function computeMilestone(completedToday: number) {
  if (completedToday < 8) {
    return {
      tier: "Daily Target - Slab 1 (8 Orders)",
      target: 8,
      remaining: 8 - completedToday,
      bonusPaise: 10_000, // ₹100
      progressPct: Math.min(100, Math.round((completedToday / 8) * 100)),
    };
  }
  if (completedToday < 14) {
    return {
      tier: "Daily Target - Slab 2 (14 Orders)",
      target: 14,
      remaining: 14 - completedToday,
      bonusPaise: 22_000, // ₹220
      progressPct: Math.min(100, Math.round((completedToday / 14) * 100)),
    };
  }
  if (completedToday < 20) {
    return {
      tier: "Daily Target - Slab 3 (20 Orders)",
      target: 20,
      remaining: 20 - completedToday,
      bonusPaise: 40_000, // ₹400
      progressPct: Math.min(100, Math.round((completedToday / 20) * 100)),
    };
  }
  return {
    tier: "Daily Target - Slab 3 Completed (20+ Orders)",
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
  attachment?: {
    name: string;
    type: string;
    dataUrl: string;
    previewUrl?: string;
  } | null;
  resolutionAction?: ResolutionAction | null;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachment, setAttachment] = useState<{
    name: string;
    type: string;
    size: number;
    dataUrl: string;
    previewUrl?: string;
  } | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setAttachment({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl,
        previewUrl: file.type.startsWith("image/") ? dataUrl : undefined,
      });
      toast.success(`Attached "${file.name}"`);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

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
            `নমস্কার ${firstName} বাবু! কিং এআই ফ্লিট সাপোর্টে আপনাকে স্বাগতম — আপনার সহকারী কো-পাইলট।\n` +
            `• আজকের উপার্জন: ${formatPaise(e.totals.net)} (${h.completedToday}টি সম্পন্ন ট্রিপ | টিপস: ${formatPaise(e.totals.tip)} | বোনাস: ${formatPaise(e.totals.incentive)})\n` +
            `• মাইলস্টোন কোচ: ${ms.remaining > 0 ? `আর ${ms.remaining}টি ট্রিপ সম্পন্ন করলেই পাবেন +${formatPaise(ms.bonusPaise)} (${ms.tier})` : `অভিনন্দন! ${ms.tier} আনলক হয়েছে!`}\n` +
            (h.active
              ? `• সক্রিয় ট্রিপ: #${h.active.orderCode} (${h.active.restaurant.name} → ${h.active.customer.area})। রেস্তোরাঁয় ৬ মিনিটের বেশি বিলম্ব হলে ১-ট্যাপে ওয়েট পে ক্রেডিট পান।`
              : `• পিক স্লট পরামর্শ: লাঞ্চ (১২:০০–৩:০০) ও ডিনার (৭:০০–১১:০০) সময়ে হাই-ডিমান্ড জোনে থাকলে ট্রিপ সর্বোচ্চ হয়।`);
        } else if (locale === "hi") {
          greeting =
            `नमस्ते ${firstName} जी! किंग एआई फ्लीट सपोर्ट में आपका स्वागत है — आपका राइडर पार्टनर साथी।\n` +
            `• आज की कुल कमाई: ${formatPaise(e.totals.net)} (${h.completedToday} पूर्ण ऑर्डर | 100% टिप्स: ${formatPaise(e.totals.tip)} | प्रोत्साहन राशि: ${formatPaise(e.totals.incentive)})\n` +
            `• माइलस्टोन कोच: ${ms.remaining > 0 ? `केवल ${ms.remaining} और डिलीवरी पूरी करके +${formatPaise(ms.bonusPaise)} (${ms.tier}) अनलॉक करें।` : `बधाई! ${ms.tier} अनलॉक हो गया है!`}\n` +
            (h.active
              ? `• सक्रिय डिलीवरी: ऑर्डर #${h.active.orderCode} (${h.active.restaurant.name} → ${h.active.customer.area})। किचन में 6 मिनट से अधिक देरी होने पर वेट-पे तुरंत क्लेम करें।`
              : `• पीक शिफ्ट सलाह: लंच (12:00–3:00) और डिनर (7:00–11:00) के समय सबसे ज्यादा ऑर्डर उपलब्ध रहते हैं।`);
        } else {
          greeting =
            `Hello ${firstName} ji! Welcome to King AI Fleet Support — your delivery partner co-pilot.\n` +
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
    action?:
      | "auto_credit_wait"
      | "emergency_distress"
      | "verify_navigation"
      | "payout_breakdown"
      | "customer_unreachable"
      | "restaurant_issue"
      | "cash_dispute"
      | "query",
  ) {
    if (!questionText.trim() && !attachment) return;
    const question = questionText.trim() || (attachment ? `Attached proof: ${attachment.name}` : "");
    const nowLabel = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const currentAttachment = attachment;
    setQ("");
    setAttachment(null);
    setLines((l) => [
      ...l,
      {
        role: "user",
        text: question,
        at: nowLabel,
        attachment: currentAttachment,
      },
    ]);
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
          attachment: currentAttachment
            ? {
                name: currentAttachment.name,
                type: currentAttachment.type,
                size: currentAttachment.size,
                dataUrl: currentAttachment.dataUrl,
              }
            : undefined,
        },
      });

      if (res.waitCreditResult?.credited) {
        setAutoCreditNotice(
          `⚡ Kitchen Wait Pay Credited: ₹${(res.waitCreditResult.amountPaise / 100).toFixed(2)} added directly to your shift ledger!`,
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
          resolutionAction: res.resolutionAction,
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
    `Hello ${firstName} ji. I am King AI, your Fleet AI Support Co-Pilot. Today you have completed ${completedToday} trips and earned ${formatPaise(todayNetPaise)}. ` +
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
        {/* Partner Support Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/40 bg-white border border-gray-200 p-4 text-gray-900 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-red-50 border border-red-200 text-[#E23744] shadow-xs">
              <Crown className="size-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold tracking-wide text-gray-900">
                  King AI <span className="text-primary">Fleet Support</span>
                </h1>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                  King AI · 24x7 Support
                </span>
                <span className="rounded-full border border-primary/50 bg-[#E23744]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  Multilingual AI (10 Regional Languages · हिन्दी · தமிழ் · বাংলা · EN)
                </span>
              </div>
              <p className="text-xs text-gray-600">
                Autonomous Fleet Co-Pilot · Payout Breakdown · Wait-Pay Auto-Credit · SOS Emergency Routing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => speakText(advisorSpeechSummary, "advisor")}
              className="h-8 border-primary/50 bg-gray-50 border border-gray-200 text-xs text-primary hover:bg-[#E23744]/20"
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
              className="h-8 text-xs text-gray-600 hover:text-gray-900"
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
          <div className="rounded-xl border-2 border-rose-500 bg-rose-950/60 p-4 text-gray-900 shadow-2xl backdrop-blur-md space-y-3">
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
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-rose-600 px-4 text-xs font-bold text-gray-900 shadow hover:bg-rose-500"
              >
                <PhoneCall className="size-3.5" /> Call 112 (National Police/Fire)
              </a>
              <a
                href="tel:108"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-gray-900 shadow hover:bg-emerald-500"
              >
                <PhoneCall className="size-3.5" /> Call 108 (Free Medical Ambulance)
              </a>
              <a
                href="tel:18002585956"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 bg-gray-50 border border-gray-200 px-3 text-xs text-slate-200 hover:bg-white/10"
              >
                1800-258-5956 (Cashless ₹5L Insurance)
              </a>
            </div>
          </div>
        ) : null}

        {busy ? (
          <Card className="border-primary/40 bg-[#E23744]/10 p-3">
            <p className="text-xs font-semibold text-primary dark:text-primary">
              🛵 {t("aiDriving")} — Tap <strong>🔊 Listen</strong> on any response to hear voice guidance hands-free while riding safely.
            </p>
          </Card>
        ) : null}

        {/* 5 Primary King AI Autonomous Reasoning Action Cards */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
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
            className="flex flex-col items-start justify-between rounded-xl border border-primary/40 bg-gradient-to-br from-[#0B0F19] to-[#1E293B] p-3 text-left transition hover:border-primary hover:shadow-lg group"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#E23744]/20 text-primary group-hover:scale-110 transition-transform">
              <Zap className="size-4" />
            </div>
            <div className="mt-2">
              <p className="text-xs font-bold text-gray-900">Auto-Credit Wait Pay</p>
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
            className="flex flex-col items-start justify-between rounded-xl border border-blue-200/40 bg-gradient-to-br from-[#0B0F19] to-[#1E293B] p-3 text-left transition hover:border-blue-200 hover:shadow-lg group"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-sky-400 group-hover:scale-110 transition-transform">
              <IndianRupee className="size-4" />
            </div>
            <div className="mt-2">
              <p className="text-xs font-bold text-gray-900">Payout Breakdown</p>
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
              <p className="text-xs font-bold text-gray-900">Landmark & GPS Guide</p>
              <p className="text-[10px] text-slate-400">Gate access & geofence bypass</p>
            </div>
          </button>

          {/* Action 4: Customer Phone Reachability (3-Call Rule) */}
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              void askQuestion(
                "Customer is not answering at doorstep — what is the 3-call zero penalty rule?",
                "customer_unreachable",
              )
            }
            className="flex flex-col items-start justify-between rounded-xl border border-amber-500/40 bg-gradient-to-br from-[#0B0F19] to-[#1E293B] p-3 text-left transition hover:border-amber-400 hover:shadow-lg group"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
              <PhoneCall className="size-4" />
            </div>
            <div className="mt-2">
              <p className="text-xs font-bold text-gray-900">Doorstep Unreachable</p>
              <p className="text-[10px] text-slate-400">3-Call SOP & 100% Protected Pay</p>
            </div>
          </button>

          {/* Action 5: Emergency SOS (112 / 108) */}
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              void askQuestion(
                "EMERGENCY DISTRESS SOS: Route signal to 112 / 108 with live GPS coordinates immediately",
                "emergency_distress",
              )
            }
            className="flex flex-col items-start justify-between rounded-xl border border-rose-500/50 bg-gradient-to-br from-[#1F1015] to-[#2A0E17] p-3 text-left transition hover:border-rose-400 hover:shadow-lg group col-span-2 sm:col-span-1"
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
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-[#0B0F19] via-[#0F172A] to-[#1E293B] p-4 text-gray-900 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                King AI Autonomous Operations & Earnings Co-Pilot
              </p>
              <h2 className="text-base font-bold text-gray-900">
                Hello {firstName} ji — Live Shift & Take-Home Coach
              </h2>
            </div>
            <Badge tone={home?.rider.status === "ONLINE" ? "online" : home?.rider.status === "BUSY" ? "busy" : "offline"}>
              {home?.rider.status ?? "SYNCING"}
            </Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {/* 1. Live Earnings & Milestone Coach */}
            <div className="rounded-xl border border-white/10 bg-gray-50 border border-gray-200 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  📈 Live Earnings & Milestone Coach
                </span>
                <span className="font-mono text-sm font-bold text-emerald-400">
                  {formatPaise(todayNetPaise)} today
                </span>
              </div>

              <p className="text-xs leading-relaxed text-gray-600">
                You have completed <strong className="text-gray-900">{completedToday} {completedToday === 1 ? "trip" : "trips"}</strong> today
                (Tips: <strong className="text-gray-900">{formatPaise(todayTipsPaise)}</strong> · Wait & Surge:{" "}
                <strong className="text-gray-900">{formatPaise(todayIncentivePaise)}</strong>).{" "}
                {milestone.remaining > 0 ? (
                  <>
                    Complete <strong className="text-gray-900">{milestone.remaining} more trips</strong>{" "}
                    to unlock <strong className="text-primary">+{formatPaise(milestone.bonusPaise)}</strong> under{" "}
                    <span className="text-blue-700 underline decoration-dotted">{milestone.tier}</span>!
                  </>
                ) : (
                  <>
                    You unlocked the <strong className="text-primary">{milestone.tier} (+{formatPaise(milestone.bonusPaise)})</strong>! Every additional trip adds full distance + surge pay.
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
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#E23744] transition-all"
                    style={{ width: `${milestone.progressPct}%` }}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 text-[11px] text-gray-600">
                <strong className="text-primary">Peak Slot Maximizer:</strong> Stay logged into{" "}
                <span className="font-semibold text-gray-900">{home?.rider.preferredZones || "your primary zone"}</span>{" "}
                during <strong>Lunch (12:00–3:00 PM)</strong> and <strong>Dinner (7:00–11:00 PM)</strong> to hit your daily milestone 40% faster.
              </div>
            </div>

            {/* 2. Live On-Trip & Wait-Time Guard */}
            <div className="rounded-xl border border-white/10 bg-gray-50 border border-gray-200 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  🧭 Live On-Trip & Wait-Time Guard
                </span>
                <span className="text-xs font-mono font-semibold text-sky-400">
                  COD: {formatPaise(unreconciledPaise)} / ₹2,500
                </span>
              </div>

              {activeOrder ? (
                <div className="rounded-lg border border-blue-200/40 bg-[#2563EB]/10 p-2.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Active Order #{activeOrder.orderCode}</span>
                    <span className="font-mono text-primary">{formatPaise(activeOrder.expectedPayoutPaise)}</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    <strong className="text-gray-900">{activeOrder.restaurant.name}</strong> → <strong className="text-gray-900">{activeOrder.customer.area}</strong> · Stage:{" "}
                    <span className="font-semibold text-blue-700">{activeOrder.state.replaceAll("_", " ")}</span>
                  </p>

                  {/* Kitchen wait time indicator */}
                  {kitchenWaitMins > 0 ? (
                    <div className="flex items-center justify-between rounded bg-gray-50 border border-gray-200 p-2 text-xs">
                      <span className="text-gray-600">
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
                          className="h-6 bg-[#E23744] text-[10px] font-bold text-black hover:bg-[#B37D20]"
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
                        activeOrder.restaurant.address || activeOrder.restaurant.name || ""
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-primary underline"
                    >
                      <Navigation className="size-3" /> External GPS
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-xs leading-relaxed text-slate-400">
                  <strong className="text-gray-900">No active delivery in progress.</strong>{" "}
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

        {/* 1-Tap Multilingual Prompts (Bengali, Tamil, Hindi, English) */}
        <div className="space-y-2 rounded-2xl border border-white/10 bg-card/80 p-3.5 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Quick Prompts (বাংলা · हिन्दी · தமிழ் · English)
            </p>
            <span className="text-[11px] font-semibold text-primary">Official Partner Co-Pilot</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Bengali Prompts */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => void askQuestion("রেস্তোরাঁয় ৬ মিনিটের বেশি অপেক্ষা করেছি — ওয়েট পে ক্রেডিট করুন", "auto_credit_wait")}
              className="border-primary/50 bg-gray-50 border border-gray-200 text-xs text-primary hover:bg-[#E23744]/20"
            >
              🏬 বাংলা: ওয়েট পে ক্রেডিট (&gt;৬ মিনিট)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => void askQuestion("আমার পেআউট হিসাব বুঝিয়ে দিন: ₹৩৫ বেস, দূরত্ব স্ল্যাব ও টিপস", "payout_breakdown")}
              className="border-blue-200/50 bg-gray-50 border border-gray-200 text-xs text-blue-700 hover:bg-blue-50"
            >
              💰 বাংলা: পেআউট ও দূরত্বের হিসাব
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => void askQuestion("কাস্টমার ফোন ধরছে না — ৩-কল এসওপি নিয়ম কি?", "customer_unreachable")}
              className="border-amber-500/40 bg-gray-50 border border-gray-200 text-xs text-amber-300 hover:bg-amber-500/20"
            >
              ⏱️ বাংলা: ৩-কল কাস্টমার এসওপি
            </Button>

            {/* Tamil Prompts */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => void askQuestion("உணவகத்தில் 6 நிமிடங்களுக்கு மேல் காத்திருப்பு — வெயிட் பே கிரெடிட் செய்யவும்", "auto_credit_wait")}
              className="border-primary/50 bg-gray-50 border border-gray-200 text-xs text-primary hover:bg-[#E23744]/20"
            >
              🏬 தமிழ்: வெயிட் பே கிரெடிட் (&gt;6 நிமிடம்)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => void askQuestion("எனது பேஅவுட் விவரங்களை விளக்குங்கள்: ₹35 அடிப்படை, தூர அடுக்குகள் மற்றும் 100% டிப்ஸ்", "payout_breakdown")}
              className="border-blue-200/50 bg-gray-50 border border-gray-200 text-xs text-blue-700 hover:bg-blue-50"
            >
              💰 தமிழ்: பேஅவுட் விவரங்கள்
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => void askQuestion("வாடிக்கையாளர் போன் எடுக்கவில்லை — 3-அழைப்பு பாதுகாப்பு விதி என்ன?", "customer_unreachable")}
              className="border-amber-500/40 bg-gray-50 border border-gray-200 text-xs text-amber-300 hover:bg-amber-500/20"
            >
              ⏱️ தமிழ்: 3-அழைப்பு வாடிக்கையாளர் விதி
            </Button>

            {/* Hindi Prompts */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => void askQuestion("रेस्तरां में 6 मिनट से ज्यादा इंतज़ार — ₹1/मिनट वेट पे क्रेडिट करो", "auto_credit_wait")}
              className="border-emerald-500/50 bg-gray-50 border border-gray-200 text-xs text-emerald-300 hover:bg-emerald-500/20"
            >
              🏬 हिन्दी: वेट पे क्रेडिट (&gt;6 मिनट)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => void askQuestion("मेरी पूरी कमाई और पेआउट स्लैब समझाओ: ₹35 बेस, दूरी दर और 100% टिप्स", "payout_breakdown")}
              className="border-blue-200/50 bg-gray-50 border border-gray-200 text-xs text-blue-700 hover:bg-blue-50"
            >
              💰 हिन्दी: पेआउट ब्रेकडाउन
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => void askQuestion("ग्राहक फोन नहीं उठा रहा — 3-कॉल शून्य जुर्माना नियम", "customer_unreachable")}
              className="border-amber-500/40 bg-gray-50 border border-gray-200 text-xs text-amber-300 hover:bg-amber-500/20"
            >
              ⏱️ हिन्दी: 3-कॉल ग्राहक नियम
            </Button>

            {/* English Prompts */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => void askQuestion("Explain my exact payout breakdown: base ₹35 floor, distance slabs, wait pay, and 100% tips", "payout_breakdown")}
              className="border-blue-200/40 bg-gray-50 border border-gray-200 text-xs text-gray-900 hover:bg-blue-50"
            >
              💰 English: Payout Breakdown & Slabs
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => void askQuestion("Guide navigation, gated entry instructions, and landmark resolution", "verify_navigation")}
              className="border-emerald-500/40 bg-gray-50 border border-gray-200 text-xs text-gray-900 hover:bg-emerald-500/20"
            >
              🧭 English: Landmark & Gated Entry
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => void askQuestion("When is my Wednesday payout transferred and what is my COD cash balance?", "payout_breakdown")}
              className="border-slate-700 bg-gray-50 border border-gray-200 text-xs text-gray-600 hover:bg-white/10"
            >
              🗓️ English: Wednesday Payout & COD
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
                  ? "ml-6 border border-primary/20 bg-muted/30 p-3.5 text-foreground shadow-xs"
                  : "border border-border/70 bg-card p-4 text-foreground shadow-sm"
              }
            >
              <div className="mb-2 flex items-center justify-between gap-2 border-b border-border/50 pb-1.5">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {l.role === "user" ? (
                    <>👤 {firstName} ({l.at})</>
                  ) : (
                    <>
                      <Crown className="size-3.5 text-primary" />
                      <span className="text-primary font-bold">King AI Support</span> ({l.at})
                    </>
                  )}
                </span>
                {l.role === "assistant" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 border-border px-2.5 text-xs hover:bg-muted"
                    onClick={() => speakText(l.text, i)}
                  >
                    {speakingIdx === i ? <VolumeX className="mr-1 size-3" /> : <Volume2 className="mr-1 size-3" />}
                    {speakingIdx === i ? "Stop" : "Listen"}
                  </Button>
                ) : null}
              </div>

              {/* User Attachment Display */}
              {l.attachment ? (
                <div className="mb-2.5">
                  {l.attachment.previewUrl ? (
                    <img
                      src={l.attachment.previewUrl}
                      alt={l.attachment.name}
                      className="max-h-48 rounded-lg border border-border object-cover shadow-xs"
                    />
                  ) : (
                    <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground">
                      <FileText className="size-3.5 text-primary" />
                      <span className="font-mono text-[11px] truncate max-w-[200px]">{l.attachment.name}</span>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Autonomous Resolution Action Card */}
              {l.resolutionAction ? (
                <div className="mb-3 rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      <span>{l.resolutionAction.title}</span>
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {l.resolutionAction.ticketId ? (
                        <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                          #{l.resolutionAction.ticketId.slice(0, 8)}
                        </span>
                      ) : null}
                      {l.resolutionAction.amountPaise ? (
                        <span className="font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                          +₹{(l.resolutionAction.amountPaise / 100).toFixed(2)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {l.resolutionAction.details}
                  </p>
                </div>
              ) : null}

              {/* Extra visual indicators for credited wait pay or emergency broadcast */}
              {l.waitResult?.credited ? (
                <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                  Auto-Credit Verified: ₹{(l.waitResult.amountPaise / 100).toFixed(2)} added to shift ledger.
                </div>
              ) : null}

              {l.emergencyBroadcast?.dispatched ? (
                <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-lg border border-rose-500/50 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-300">
                  <AlertOctagon className="size-3.5 text-rose-500" />
                  Emergency SOS Protocol Dispatched (GPS: {l.emergencyBroadcast.coords.lat.toFixed(4)}, {l.emergencyBroadcast.coords.lng.toFixed(4)})
                </div>
              ) : null}

              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{l.text}</p>
            </Card>
          ))}
        </div>

        {/* Question Input Form with Camera & Attachment */}
        <div className="space-y-2">
          {attachment ? (
            <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-muted/40 p-2.5 shadow-xs">
              {attachment.previewUrl ? (
                <img
                  src={attachment.previewUrl}
                  alt={attachment.name}
                  className="size-11 rounded-lg object-cover border border-border shrink-0"
                />
              ) : (
                <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <FileText className="size-5" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate text-foreground">{attachment.name}</p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {(attachment.size / 1024).toFixed(1)} KB · Photo Proof Ready
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAttachment(null)}
                className="size-7 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : null}

          <form onSubmit={send} className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*,.pdf"
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={pending}
              onClick={() => fileInputRef.current?.click()}
              title="Attach Photo Proof (Restaurant Counter / Doorstep / Payment)"
              className="size-10 shrink-0 border-border hover:bg-muted"
            >
              <Camera className="size-4 text-muted-foreground" />
            </Button>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={attachment ? "Add details about this photo..." : `${t("askAssistant")} (English, हिन्दी, தமிழ், বাংলা…)`}
              disabled={pending}
              className="border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <Button
              type="submit"
              disabled={pending || (!q.trim() && !attachment)}
              className="bg-primary text-primary-foreground font-semibold shadow-xs hover:bg-primary/90"
            >
              {pending ? (
                "Thinking…"
              ) : (
                <>
                  <Send className="mr-1.5 size-3.5" /> {t("send")}
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
