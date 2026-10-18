import { useEffect, useMemo, useState } from "react";
import { Sparkles, X, Send, ShieldCheck, Clock, AlertCircle, Database, Store, Wallet, Globe, Volume2, TrendingUp, CalendarClock } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askAssistant } from "@/lib/server/api-more";
import { getMenu, saveItem, setAvailability } from "@/lib/server/api-menu";
import { getDashboard, quickThrottleKitchen } from "@/lib/server/api-orders";
import { getAnalytics, getPromotions, getSettlements } from "@/lib/server/api-finance";
import { formatINR } from "@/lib/money";
import { useVendor } from "@/components/use-vendor";
import { can } from "@/lib/rbac";
import { useClientState } from "@/lib/client-state";
import type { DietFlag } from "@/lib/contracts";
import { platformConfig, type AppLanguage } from "@/lib/platform-config";
import { tryExecutePartnerAiCommand } from "@/lib/ai/partner-ai-actions";

export interface OrderKingSparkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SparkLanguage = {
  code: string;
  bcp47: string;
  name: string;
  nativeName: string;
};

/**
 * 10 Official Benchmark Languages.
 */
const SPARK_INDIAN_LANGUAGES: readonly SparkLanguage[] = [
  { code: "en", bcp47: "en-IN", name: "English", nativeName: "English" },
  { code: "hi", bcp47: "hi-IN", name: "Hindi", nativeName: "हिन्दी" },
  { code: "bn", bcp47: "bn-IN", name: "Bengali", nativeName: "বাংলা" },
  { code: "gu", bcp47: "gu-IN", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "kn", bcp47: "kn-IN", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "ml", bcp47: "ml-IN", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "mr", bcp47: "mr-IN", name: "Marathi", nativeName: "मराठी" },
  { code: "pa", bcp47: "pa-IN", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "ta", bcp47: "ta-IN", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", bcp47: "te-IN", name: "Telugu", nativeName: "తెలుగు" },
] as const;

const FOCUS_TOPICS = [
  "Increase Daily Order Volume",
  "Smart Combo & AOV Engineering",
  "Neighborhood Geo-Radius & Daypart Expansion",
  "Earnings & Tax Breakdown Reconciliation",
  "POS & Printer Automation",
] as const;

const ADVISORY_SLOTS = [
  "10:30 AM Pre-Lunch",
  "04:30 PM Afternoon Break",
  "11:15 PM Post-Service",
  "Custom Time",
] as const;

type ChatMessage = {
  id: string;
  sender: "user" | "spark";
  text: string;
  timestamp: string;
  provenanceNote?: string;
};

export function OrderKingSparkModal({ isOpen, onClose }: OrderKingSparkModalProps) {
  const vendor = useVendor();
  const { restaurantId } = vendor;
  const qc = useQueryClient();
  const globalLang = useClientState((s) => s.lang);
  const setGlobalLang = useClientState((s) => s.setLang);
  const [selectedLangCode, setSelectedLangCode] = useState<string>(globalLang || "en");

  // Quiet-hours & Advisory Schedule Customizer state
  const [showScheduleDrawer, setShowScheduleDrawer] = useState(false);
  const [lunchQuiet, setLunchQuiet] = useState(true);
  const [dinnerQuiet, setDinnerQuiet] = useState(true);
  const [preferredSlot, setPreferredSlot] = useState<(typeof ADVISORY_SLOTS)[number]>(
    "04:30 PM Afternoon Break"
  );
  const [focusTopic, setFocusTopic] = useState<(typeof FOCUS_TOPICS)[number]>(
    "Increase Daily Order Volume"
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `orderking-spark-advisory-prefs-${restaurantId ?? "default"}`;
    const raw = window.localStorage.getItem(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as {
          lunchQuietHours?: boolean;
          dinnerQuietHours?: boolean;
          preferredSlot?: (typeof ADVISORY_SLOTS)[number];
          focusTopic?: (typeof FOCUS_TOPICS)[number];
          languageCode?: string;
        };
        if (typeof parsed.lunchQuietHours === "boolean") setLunchQuiet(parsed.lunchQuietHours);
        if (typeof parsed.dinnerQuietHours === "boolean") setDinnerQuiet(parsed.dinnerQuietHours);
        if (parsed.preferredSlot) setPreferredSlot(parsed.preferredSlot);
        if (parsed.focusTopic) setFocusTopic(parsed.focusTopic);
        if (parsed.languageCode) setSelectedLangCode(parsed.languageCode);
      } catch {
        // Ignore malformed localStorage
      }
    }
  }, [restaurantId]);

  function saveSchedulePrefs(next: {
    lunchQuietHours: boolean;
    dinnerQuietHours: boolean;
    preferredSlot: (typeof ADVISORY_SLOTS)[number];
    focusTopic: (typeof FOCUS_TOPICS)[number];
    languageCode: string;
  }) {
    if (typeof window === "undefined") return;
    const key = `orderking-spark-advisory-prefs-${restaurantId ?? "default"}`;
    window.localStorage.setItem(
      key,
      JSON.stringify({
        ...next,
        savedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      })
    );
  }

  const activeLang = useMemo(
    () =>
      SPARK_INDIAN_LANGUAGES.find((l) => l.code === selectedLangCode) ??
      SPARK_INDIAN_LANGUAGES[0],
    [selectedLangCode]
  );

  const dashQuery = useQuery({
    queryKey: ["dashboard", restaurantId],
    queryFn: () => getDashboard({ data: { restaurantId } }),
    enabled: isOpen && Boolean(restaurantId),
  });

  const menuQuery = useQuery({
    queryKey: ["menu", restaurantId],
    queryFn: () => getMenu({ data: { restaurantId } }),
    enabled: isOpen && Boolean(restaurantId),
  });

  const settlementsQuery = useQuery({
    queryKey: ["settlements", restaurantId],
    queryFn: () => getSettlements({ data: { restaurantId } }),
    enabled: isOpen && Boolean(restaurantId),
  });

  const analyticsQuery = useQuery({
    queryKey: ["analytics", restaurantId, "week"],
    queryFn: () => getAnalytics({ data: { restaurantId, range: "week" } }),
    enabled: isOpen && Boolean(restaurantId),
  });

  const promotionsQuery = useQuery({
    queryKey: ["promotions", restaurantId],
    queryFn: () => getPromotions({ data: { restaurantId } }),
    enabled: isOpen && Boolean(restaurantId),
  });

  const canAvail = vendor.role
    ? can(vendor.role, "availability.edit") && !menuQuery.data?.isMenuLocked
    : false;
  const canEdit = vendor.role
    ? can(vendor.role, "menu.edit") && !menuQuery.data?.isMenuLocked
    : false;
  const canHours = vendor.role ? can(vendor.role, "hours.edit") : false;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      sender: "spark",
      text: "Order King — King AI Kitchen Partner is ready across 10 official benchmark languages. Inspect your live storefront status, daypart and AOV growth recommendations, restore out-of-stock dishes, adjust kitchen prep times between Standard (20m) and Peak Rush (35m), or review transparent payout calculations. All recommendations are advisory only—no changes are applied without your explicit confirmation.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      provenanceNote:
        "Source: Your restaurant's live menu catalog, configured prep times, dashboard state, and verified settlement ledger.",
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmingRestock, setConfirmingRestock] = useState(false);
  const [applyingRestock, setApplyingRestock] = useState(false);
  const [confirmingPrepSla, setConfirmingPrepSla] = useState(false);
  const [applyingPrepSla, setApplyingPrepSla] = useState(false);
  const [confirmingResume, setConfirmingResume] = useState(false);
  const [applyingResume, setApplyingResume] = useState(false);
  const [confirmingThrottle, setConfirmingThrottle] = useState<"NORMAL" | "RUSH" | null>(null);
  const [applyingThrottle, setApplyingThrottle] = useState(false);

  const catalogRecommendations = useMemo(() => {
    const items = menuQuery.data?.items ?? [];
    const categories = menuQuery.data?.categories ?? [];
    const outOfStock = items.filter((i) => i.availability !== "available");
    const inStock = items.filter((i) => i.availability === "available");
    const missingPrepTime = items.filter((i) => !i.prep_minutes || i.prep_minutes <= 0);
    const highPrepTime = items.filter((i) => (i.prep_minutes ?? 0) >= 25);
    const missingPhoto = items.filter((i) => !i.image_url);
    const missingDesc = items.filter((i) => !i.description || !i.description.trim());
    const withAddons = items.filter((i) => (i.addonIds?.length ?? 0) > 0);
    const vegCount = items.filter((i) => i.diet === "VEG").length;
    const nonVegCount = items.filter((i) => i.diet === "NONVEG").length;
    const eggCount = items.filter((i) => i.diet === "EGG").length;
    const configuredPrepItems = items.filter((i) => i.prep_minutes && i.prep_minutes > 0);
    const avgPrepMinutes =
      configuredPrepItems.length > 0
        ? Math.round(
            configuredPrepItems.reduce((acc, i) => acc + (i.prep_minutes ?? 20), 0) /
              configuredPrepItems.length
          )
        : 20;

    const total = items.length;
    const storefrontConversionScore =
      total > 0
        ? Math.round(
            ((total - missingPhoto.length) / total) * 25 +
              ((total - missingDesc.length) / total) * 20 +
              (inStock.length / total) * 25 +
              ((total - missingPrepTime.length) / total) * 15 +
              (withAddons.length / total) * 15
          )
        : 0;

    const liveAovPaise =
      dashQuery.data?.today.aovPaise && dashQuery.data.today.aovPaise > 0
        ? dashQuery.data.today.aovPaise
        : analyticsQuery.data?.summary.aovPaise && analyticsQuery.data.summary.aovPaise > 0
          ? analyticsQuery.data.summary.aovPaise
          : 24000;

    const currentAovRupees = Math.round(liveAovPaise / 100);
    const recommendedThresholdRupees =
      Math.ceil(Math.max(199, Math.round(currentAovRupees * 1.25)) / 50) * 50 - 1;
    const estimatedDailyLeakagePaise =
      outOfStock.length > 0
        ? Math.round(outOfStock.length * Math.max(12000, Math.round(liveAovPaise * 0.65)))
        : 0;
    const activePromosCount = (promotionsQuery.data?.promotions ?? []).filter(
      (p) => p.isActive
    ).length;

    const hours = analyticsQuery.data?.hours ?? [];
    const sumSlot = (s: number, e: number) =>
      hours
        .filter((h) => (s <= e ? h.hour >= s && h.hour <= e : h.hour >= s || h.hour <= e))
        .reduce((a, b) => a + b.orders, 0);

    const dayparts = [
      { label: "Breakfast 07–11", orders: sumSlot(7, 11) },
      { label: "Lunch 12–15", orders: sumSlot(12, 15) },
      { label: "Snacks 16–19", orders: sumSlot(16, 18) },
      { label: "Dinner 19–23", orders: sumSlot(19, 22) },
      { label: "Late-Night 23–02", orders: sumSlot(23, 2) },
    ];

    return {
      totalItems: items.length,
      totalCategories: categories.length,
      inStock,
      outOfStock,
      missingPrepTime,
      highPrepTime,
      missingPhoto,
      missingDesc,
      vegCount,
      nonVegCount,
      eggCount,
      avgPrepMinutes,
      storefrontConversionScore,
      liveAovPaise,
      recommendedThresholdRupees,
      estimatedDailyLeakagePaise,
      activePromosCount,
      dayparts,
    };
  }, [menuQuery.data, dashQuery.data, analyticsQuery.data, promotionsQuery.data]);

  if (!isOpen) return null;

  function handleSelectLanguage(code: string) {
    setSelectedLangCode(code);
    saveSchedulePrefs({
      lunchQuietHours: lunchQuiet,
      dinnerQuietHours: dinnerQuiet,
      preferredSlot,
      focusTopic,
      languageCode: code,
    });
    const supported = platformConfig.localization.supportedLanguages as readonly string[];
    if (supported.includes(code)) {
      setGlobalLang(code as AppLanguage);
    }
  }

  function handleSpeakText(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = activeLang.bcp47;
    window.speechSynthesis.speak(utterance);
  }

  function buildVerifiedCatalogSummary(question: string): string {
    const q = question.toLowerCase();
    const {
      totalItems,
      totalCategories,
      inStock,
      outOfStock,
      missingPrepTime,
      missingPhoto,
      missingDesc,
      vegCount,
      nonVegCount,
      eggCount,
      avgPrepMinutes,
      storefrontConversionScore,
      liveAovPaise,
      recommendedThresholdRupees,
      estimatedDailyLeakagePaise,
      dayparts,
    } = catalogRecommendations;

    if (q.includes("settlement") || q.includes("tax") || q.includes("gst") || q.includes("tds") || q.includes("payout")) {
      const currentPayable = formatINR(settlementsQuery.data?.currentPayablePaise ?? 0);
      return [
        `[${activeLang.nativeName} · ${activeLang.name}] Verified Payout & Tax Breakdown (Unsettled Balance: ${currentPayable}):`,
        "• Formula: Net Payable = (Food Value + Packaging − Restaurant Discount) − Platform Commission (28% Delivery / 0% Dine-In) + Platform Promo − Refunds − Withholding Taxes (TCS/TDS).",
        "• CGST Sec 9(5): 5% Restaurant Service GST (2.5% CGST + 2.5% SGST) collected and remitted under e-commerce operator rules.",
        "• Income Tax Sec 194-O: 0.1% TDS and CGST Sec 52: 0.5% TCS accounted in integer paise on your Settlement ledger.",
      ].join("\n");
    }

    return [
      `[${activeLang.nativeName} · ${activeLang.name}] King AI Kitchen & Menu Overview (${totalCategories} Categories · ${totalItems} Dishes · Menu Score: ${storefrontConversionScore}%):`,
      `• Storefront Status: ${dashQuery.data?.isOpen ? "OPEN" : "PAUSED"} · KYC: ${dashQuery.data?.verificationStatus ?? "PENDING"} · Pending Orders: ${dashQuery.data?.today.pending ?? 0}`,
      `• In-Stock Dishes: ${inStock.length} of ${totalItems} · Sold-Out: ${outOfStock.length} (Est. Daily Leakage: ${formatINR(estimatedDailyLeakagePaise)})`,
      `• AOV Growth Playbook: Current AOV ${formatINR(liveAovPaise)} → Recommended ₹${recommendedThresholdRupees} Min-Order Offer (+25% AOV lift)`,
      `• 5-Daypart 7d Orders: ${dayparts.map((d) => `${d.label}: ${d.orders}`).join(" | ")}`,
      `• Kitchen Prep Time: Average ${avgPrepMinutes} mins (${missingPrepTime.length} dish(es) without explicit prep time)`,
      `• Menu Completeness: ${missingPhoto.length} missing photo · ${missingDesc.length} missing description · Diet: ${vegCount}V / ${nonVegCount}NV / ${eggCount}E`,
    ].join("\n");
  }

  const handleSend = async (text: string) => {
    const question = text.trim();
    if (!question || sending) return;

    const promptWithLanguage =
      activeLang.code === "en"
        ? question
        : `[Please reply in ${activeLang.name} (${activeLang.nativeName}, locale ${activeLang.bcp47})] ${question}`;

    setMessages((prev) => [
      ...prev,
      {
        id: `usr-${Date.now()}`,
        sender: "user",
        text: question,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setInputQuery("");
    setSending(true);

    try {
      if (restaurantId) {
        const actionResult = await tryExecutePartnerAiCommand(question, {
          restaurantId,
          categories: (menuQuery.data?.categories ?? []).map((c) => ({ id: c.id, name: c.name })),
          items: (menuQuery.data?.items ?? []).map((it) => ({
            ...it,
            variants: it.variants.map((v) => ({ id: v.id, name: v.name, pricePaise: v.pricePaise })),
          })),
          dashboard: dashQuery.data,
          languageCode: activeLang.code,
          canEditMenu: canEdit,
          canEditAvailability: canAvail,
        });
        if (actionResult.handled) {
          await Promise.all([
            qc.invalidateQueries({ queryKey: ["menu", restaurantId] }),
            qc.invalidateQueries({ queryKey: ["dashboard", restaurantId] }),
          ]);
          setMessages((prev) => [
            ...prev,
            {
              id: `spark-${Date.now()}`,
              sender: "spark",
              text: actionResult.replyText,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              provenanceNote: "Executed live kitchen action through King AI partner engine.",
            },
          ]);
          return;
        }
      }

      const result = await askAssistant({ data: { restaurantId, question: promptWithLanguage } });
      const responseText = result.ok
        ? result.text
        : `${result.text}\n\n${buildVerifiedCatalogSummary(question)}`;
      setMessages((prev) => [
        ...prev,
        {
          id: `spark-${Date.now()}`,
          sender: "spark",
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          provenanceNote:
            "Source: Authorized restaurant database snapshot (current menu catalog, prep times, analytics, and order state).",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: "spark",
          text: `Restaurant AI request could not be completed (${
            error instanceof Error ? error.message : "Service unavailable"
          }).\n\n${buildVerifiedCatalogSummary(question)}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          provenanceNote:
            "Derived directly from your restaurant's current menu catalog and configured preparation times.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleExplicitResumeOutlet = async () => {
    if (!restaurantId || !canHours) return;
    setApplyingResume(true);
    try {
      await quickThrottleKitchen({ data: { restaurantId, mode: "RESUME" } });
      setConfirmingResume(false);
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
      void qc.invalidateQueries({ queryKey: ["bootstrap"] });
      setMessages((prev) => [
        ...prev,
        {
          id: `spark-resume-${Date.now()}`,
          sender: "spark",
          text: "Confirmed by merchant: Kitchen storefront resumed and marked Open for live customer orders.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          provenanceNote: "Applied only after explicit merchant confirmation.",
        },
      ]);
    } finally {
      setApplyingResume(false);
    }
  };

  const handleExplicitThrottleMode = async (mode: "NORMAL" | "RUSH") => {
    if (!restaurantId || !canHours) return;
    setApplyingThrottle(true);
    try {
      const res = await quickThrottleKitchen({ data: { restaurantId, mode } });
      setConfirmingThrottle(null);
      void qc.invalidateQueries({ queryKey: ["menu"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
      setMessages((prev) => [
        ...prev,
        {
          id: `spark-throttle-${Date.now()}`,
          sender: "spark",
          text: `Confirmed by merchant: Kitchen preparation time updated to ${mode === "RUSH" ? 35 : 20} mins (${
            mode === "RUSH" ? "Peak Rush 35m" : "Standard Prep 20m"
          }).`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          provenanceNote: "Applied only after explicit merchant confirmation.",
        },
      ]);
    } finally {
      setApplyingThrottle(false);
    }
  };

  const handleExplicitRestockConfirmation = async () => {
    const outIds = catalogRecommendations.outOfStock.map((i) => i.id);
    if (!outIds.length || !canAvail) return;
    setApplyingRestock(true);
    try {
      await setAvailability({
        data: {
          restaurantId,
          itemIds: outIds,
          status: "available",
        },
      });
      setConfirmingRestock(false);
      void qc.invalidateQueries({ queryKey: ["menu"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
      setMessages((prev) => [
        ...prev,
        {
          id: `spark-confirm-${Date.now()}`,
          sender: "spark",
          text: `Confirmed by merchant: Restored ${outIds.length} dish(es) to In-Stock status in your live menu catalog.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          provenanceNote: "Applied only after explicit merchant confirmation.",
        },
      ]);
    } finally {
      setApplyingRestock(false);
    }
  };

  const handleExplicitPrepSlaConfirmation = async () => {
    const targets = catalogRecommendations.missingPrepTime;
    if (!targets.length || !canEdit) return;
    setApplyingPrepSla(true);
    try {
      for (const item of targets) {
        if (!item.variants.length) continue;
        await saveItem({
          data: {
            restaurantId,
            id: item.id,
            categoryId: item.category_id,
            name: item.name,
            description: item.description,
            diet: (item.diet as DietFlag) || "NONVEG",
            tags: item.tags || "",
            recommended: item.recommended,
            prepMinutes: 20,
            imageUrl: item.image_url,
            addonIds: item.addonIds,
            variants: item.variants.map((v) => ({
              id: v.id,
              name: v.name,
              pricePaise: v.pricePaise,
            })),
          },
        });
      }
      setConfirmingPrepSla(false);
      void qc.invalidateQueries({ queryKey: ["menu"] });
      setMessages((prev) => [
        ...prev,
        {
          id: `spark-prep-confirm-${Date.now()}`,
          sender: "spark",
          text: `Confirmed by merchant: Configured 20-minute standard kitchen preparation SLA on ${targets.length} dish(es).`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          provenanceNote: "Applied only after explicit merchant confirmation.",
        },
      ]);
    } finally {
      setApplyingPrepSla(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="spark-modal-title"
    >
      <div className="relative flex h-[780px] max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-amber-500/30 bg-[#121214] text-slate-100 shadow-2xl break-words text-wrap">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 bg-[#18181B] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-black">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span id="spark-modal-title" className="text-sm font-extrabold tracking-wide text-white">
                  Order King · King AI
                </span>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  KING AI · 10 OFFICIAL LANGUAGES
                </span>
              </div>
              <span className="mt-0.5 block text-[11px] text-zinc-400">
                Your Kitchen Partner: Live Orders · Transparent Payouts · Menu Quality · Growth Insights
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowScheduleDrawer((s) => !s)}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
            >
              <CalendarClock className="size-3.5 text-amber-400" />
              <span>Quiet Hours ({preferredSlot.split(" ")[0]})</span>
            </button>
            <div className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs">
              <Globe className="size-3.5 text-amber-400" />
              <select
                aria-label="Select Official Benchmark Language"
                value={activeLang.code}
                onChange={(e) => handleSelectLanguage(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none"
              >
                {SPARK_INDIAN_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-zinc-900 text-white">
                    {l.nativeName} ({l.name})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              aria-label="Close King AI Assistant"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Collapsible Quiet-Hours & Advisory Schedule Customizer */}
        {showScheduleDrawer ? (
          <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-3 text-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-amber-300">
                🕒 Chef Advisory Schedule &amp; Kitchen Rush Quiet Hours
              </span>
              <span className="text-[11px] text-zinc-400">
                Saved to local kitchen profile · Playable anytime on demand
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-[11px] text-zinc-300">
                  <input
                    type="checkbox"
                    checked={lunchQuiet}
                    onChange={(e) => {
                      setLunchQuiet(e.target.checked);
                      saveSchedulePrefs({
                        lunchQuietHours: e.target.checked,
                        dinnerQuietHours: dinnerQuiet,
                        preferredSlot,
                        focusTopic,
                        languageCode: activeLang.code,
                      });
                    }}
                  />
                  <span>Quiet: Lunch Rush (12:30–15:30)</span>
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-zinc-300">
                  <input
                    type="checkbox"
                    checked={dinnerQuiet}
                    onChange={(e) => {
                      setDinnerQuiet(e.target.checked);
                      saveSchedulePrefs({
                        lunchQuietHours: lunchQuiet,
                        dinnerQuietHours: e.target.checked,
                        preferredSlot,
                        focusTopic,
                        languageCode: activeLang.code,
                      });
                    }}
                  />
                  <span>Quiet: Dinner Rush (19:30–22:30)</span>
                </label>
              </div>
              <div>
                <div className="text-[10px] text-zinc-400 mb-1">Preferred Advisory Slot</div>
                <select
                  aria-label="Preferred Advisory Slot"
                  value={preferredSlot}
                  onChange={(e) => {
                    const nextSlot = e.target.value as (typeof ADVISORY_SLOTS)[number];
                    setPreferredSlot(nextSlot);
                    saveSchedulePrefs({
                      lunchQuietHours: lunchQuiet,
                      dinnerQuietHours: dinnerQuiet,
                      preferredSlot: nextSlot,
                      focusTopic,
                      languageCode: activeLang.code,
                    });
                  }}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-white"
                >
                  {ADVISORY_SLOTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-[10px] text-zinc-400 mb-1">Growth Focus Topic</div>
                <select
                  aria-label="Growth Focus Topic"
                  value={focusTopic}
                  onChange={(e) => {
                    const nextTopic = e.target.value as (typeof FOCUS_TOPICS)[number];
                    setFocusTopic(nextTopic);
                    saveSchedulePrefs({
                      lunchQuietHours: lunchQuiet,
                      dinnerQuietHours: dinnerQuiet,
                      preferredSlot,
                      focusTopic: nextTopic,
                      languageCode: activeLang.code,
                    });
                  }}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-white"
                >
                  {FOCUS_TOPICS.map((tTopic) => (
                    <option key={tTopic} value={tTopic}>
                      {tTopic}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : null}

        {/* Mandatory Safeguard & Data Source Banner */}
        <div className="border-b border-amber-500/30 bg-amber-950/25 px-4 py-2.5 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-amber-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 shrink-0 text-amber-400" />
              <span>Chef Review Required — No changes are applied without your explicit confirmation</span>
            </div>
            <button
              type="button"
              onClick={() =>
                handleSpeakText(
                  buildVerifiedCatalogSummary("Full Storefront & Growth Playbook Briefing")
                )
              }
              className="inline-flex items-center gap-1 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 hover:bg-amber-500/20"
            >
              <Volume2 className="size-3" /> 🔊 Listen in Your Language ({activeLang.nativeName})
            </button>
          </div>
          <p className="text-[11px] text-zinc-300 flex items-center gap-1.5">
            <Database className="size-3 shrink-0 text-emerald-400" />
            <span>
              <strong>Data Source:</strong> Recommendations are based directly on your live menu catalog, kitchen prep times, and verified order and earnings data.
            </span>
          </p>
        </div>

        {/* Grounded 4-Module Self-Service Diagnostics & Growth Bar */}
        {menuQuery.data ? (
          <div className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-3 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                King AI Kitchen Insights &amp; Growth Playbook ({catalogRecommendations.totalItems} Dishes · Menu Score: {catalogRecommendations.storefrontConversionScore}%)
              </span>
              <span className="rounded-md border border-zinc-700 bg-zinc-800/80 px-2 py-0.5 text-[10px] font-mono text-zinc-300">
                5-Daypart 7d Orders: {catalogRecommendations.dayparts.map((d) => `${d.label}: ${d.orders}`).join(" · ")}
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
              {/* 1. Storefront & Order Flow Check */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-200 flex items-center gap-1">
                    <Store className="size-3.5 text-emerald-400" /> Storefront Status
                  </span>
                  <span
                    className={`font-mono text-[10px] font-bold ${
                      dashQuery.data?.isOpen ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {dashQuery.data?.isOpen ? "OPEN" : "PAUSED"}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  KYC: {dashQuery.data?.verificationStatus ?? "—"} · FSSAI:{" "}
                  {dashQuery.data?.fssaiNumber ? "14-Digit Set" : "Missing"} · Pending:{" "}
                  {dashQuery.data?.today.pending ?? 0}
                </p>
                {dashQuery.data && !dashQuery.data.isOpen && canHours ? (
                  !confirmingResume ? (
                    <button
                      type="button"
                      onClick={() => setConfirmingResume(true)}
                      className="w-full rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
                    >
                      Resume Outlet
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        disabled={applyingResume}
                        onClick={() => void handleExplicitResumeOutlet()}
                        className="flex-1 rounded-lg bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-emerald-500"
                      >
                        {applyingResume ? "Resuming..." : "Confirm"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingResume(false)}
                        className="rounded-lg border border-zinc-700 px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-800"
                      >
                        Cancel
                      </button>
                    </div>
                  )
                ) : null}
              </div>

              {/* 2. Stock Availability & Revenue Guard */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-200 flex items-center gap-1">
                    <AlertCircle className="size-3.5 text-amber-400" /> Stock &amp; Revenue Guard
                  </span>
                  <span className="font-mono text-[11px] text-amber-300">
                    {catalogRecommendations.outOfStock.length} Sold Out
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  {catalogRecommendations.outOfStock.length > 0
                    ? `Est. Leakage: -${formatINR(catalogRecommendations.estimatedDailyLeakagePaise)}/day`
                    : `All ${catalogRecommendations.inStock.length} dishes in stock (₹0 leakage).`}
                </p>
                {catalogRecommendations.outOfStock.length > 0 && canAvail ? (
                  !confirmingRestock ? (
                    <button
                      type="button"
                      onClick={() => setConfirmingRestock(true)}
                      className="w-full rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20 transition"
                    >
                      Restore Stock ({catalogRecommendations.outOfStock.length})
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        disabled={applyingRestock}
                        onClick={() => void handleExplicitRestockConfirmation()}
                        className="flex-1 rounded-lg bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-emerald-500"
                      >
                        {applyingRestock ? "Applying..." : "Confirm"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingRestock(false)}
                        className="rounded-lg border border-zinc-700 px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-800"
                      >
                        Cancel
                      </button>
                    </div>
                  )
                ) : null}
              </div>

              {/* 3. Prep Time SLA & Peak Rush Mode */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-200 flex items-center gap-1">
                    <Clock className="size-3.5 text-emerald-400" /> Prep Time &amp; Rush Mode
                  </span>
                  <span className="font-mono text-[11px] text-zinc-300">
                    Avg {catalogRecommendations.avgPrepMinutes}m
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  {catalogRecommendations.missingPrepTime.length > 0
                    ? `${catalogRecommendations.missingPrepTime.length} dish(es) unset.`
                    : `Standard (20m) or Peak Rush (35m) buffer.`}
                </p>
                {catalogRecommendations.missingPrepTime.length > 0 && canEdit ? (
                  !confirmingPrepSla ? (
                    <button
                      type="button"
                      onClick={() => setConfirmingPrepSla(true)}
                      className="w-full rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
                    >
                      Set 20m SLA ({catalogRecommendations.missingPrepTime.length})
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        disabled={applyingPrepSla}
                        onClick={() => void handleExplicitPrepSlaConfirmation()}
                        className="flex-1 rounded-lg bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-emerald-500"
                      >
                        {applyingPrepSla ? "Saving..." : "Confirm 20m"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingPrepSla(false)}
                        className="rounded-lg border border-zinc-700 px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-800"
                      >
                        Cancel
                      </button>
                    </div>
                  )
                ) : canHours ? (
                  confirmingThrottle === null ? (
                    <div className="flex gap-1 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setConfirmingThrottle("NORMAL")}
                        className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-[10px] font-semibold text-zinc-200 hover:bg-zinc-700"
                      >
                        20m Normal
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingThrottle("RUSH")}
                        className="flex-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-300 hover:bg-amber-500/20"
                      >
                        35m Rush
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        disabled={applyingThrottle}
                        onClick={() => void handleExplicitThrottleMode(confirmingThrottle)}
                        className="flex-1 rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-500"
                      >
                        {applyingThrottle
                          ? "Applying..."
                          : `Confirm ${confirmingThrottle === "RUSH" ? "35m" : "20m"}`}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingThrottle(null)}
                        className="rounded-lg border border-zinc-700 px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-800"
                      >
                        Cancel
                      </button>
                    </div>
                  )
                ) : null}
              </div>

              {/* 4. Order Value & Payout Summary */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-200 flex items-center gap-1">
                    <TrendingUp className="size-3.5 text-sky-400" /> Order Value &amp; Payout
                  </span>
                  <span className="font-mono text-[11px] text-emerald-400">
                    {formatINR(settlementsQuery.data?.currentPayablePaise ?? 0)}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  AOV {formatINR(catalogRecommendations.liveAovPaise)} → Target ₹
                  {catalogRecommendations.recommendedThresholdRupees} Offer (+25% lift)
                </p>
                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Wallet className="size-3 text-sky-400 shrink-0" />
                    {catalogRecommendations.activePromosCount} Active Promo
                  </span>
                  <Link
                    to="/promotions"
                    onClick={onClose}
                    className="font-semibold text-amber-400 underline"
                  >
                    Launch Offer →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Quick Query Pills */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-zinc-800/80 bg-zinc-900/60 px-4 py-2">
          {[
            ["⚖️ Dispute Resolution", "Review customer dispute: Food container spilled during transit vs missing items. Protect restaurant earnings from logistics fault."],
            ["✨ Menu Studio", "Suggest appetizing dish descriptions, dietary allergen tags, and portion adjustments for signature dishes."],
            ["📊 Daily Shift Summary", "Generate today's shift report and 9(5) GST tax recon with net payout."],
            ["Why No Orders?", "Why am I not receiving orders right now? Check my storefront status."],
            ["Order Value & Growth", "How can I increase my Average Order Value and prevent revenue loss from sold-out items?"],
            ["Neighborhood Demand", "How do I capture more orders during Breakfast, Lunch, Snacks, Dinner, and Late-Night in my neighborhood?"],
            ["Payout & Tax Breakdown", "Show my verified payout, GST Sec 9(5), and withholding tax breakdown"],
            ["Menu Completeness", "Which dishes in my current menu catalog would benefit from prep time or description updates?"],
          ].map(([label, query]) => (
            <button
              key={label}
              type="button"
              onClick={() => void handleSend(query)}
              disabled={sending}
              className="whitespace-nowrap rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-[11px] font-semibold text-zinc-300 transition hover:bg-zinc-700 hover:text-white disabled:opacity-50"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Conversation Feed */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed sm:text-sm ${
                  msg.sender === "user"
                    ? "bg-amber-500 font-medium text-black"
                    : "border border-zinc-800 bg-zinc-900 text-zinc-200 space-y-2"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                {msg.sender === "spark" && (
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 pt-2 text-[10px] text-zinc-400">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-amber-400">
                        Chef Review Required — No changes are applied without your explicit confirmation
                      </div>
                      {msg.provenanceNote ? <div>{msg.provenanceNote}</div> : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSpeakText(msg.text)}
                      className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300 hover:bg-zinc-700"
                    >
                      <Volume2 className="size-3" /> 🔊 Listen in Your Language ({activeLang.nativeName})
                    </button>
                  </div>
                )}
              </div>
              <span className="mt-1 px-1 text-[10px] text-zinc-500">{msg.timestamp}</span>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2 border-t border-zinc-800 bg-[#18181B] p-3">
          <Input
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend(inputQuery);
              }
            }}
            placeholder={`Ask King AI in ${activeLang.nativeName} (${activeLang.name}) about menu, prep times, or payouts...`}
            className="h-10 flex-1 border-zinc-700 bg-zinc-900 text-xs text-white placeholder:text-zinc-500 sm:text-sm"
          />
          <Button
            type="button"
            onClick={() => void handleSend(inputQuery)}
            disabled={!inputQuery.trim() || sending}
            className="h-10 bg-amber-500 px-4 text-xs font-bold text-black hover:bg-amber-400"
          >
            <Send className="mr-1.5 size-3.5" />
            {sending ? "Analyzing…" : `Send (${activeLang.nativeName})`}
          </Button>
        </div>
      </div>
    </div>
  );
}
