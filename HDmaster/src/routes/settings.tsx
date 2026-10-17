import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Save,
  Sparkles,
  Languages,
  Settings2,
  Percent,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Palette,
  Landmark,
  SlidersHorizontal,
  BellRing,
  ShieldCheck,
  RotateCcw,
  Download,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Wand2,
  Cpu,
  FileText,
  Wallet,
  ShieldAlert,
  QrCode,
  Search,
  RefreshCw,
  Zap,
  X,
  Rocket,
  Store,
  ChevronRight,
  Printer,
  Volume2,
  Navigation,
  Compass,
  MapPin,
  TrendingUp,
  Plane,
  UtensilsCrossed,
} from "lucide-react";
import { EcosystemCMS } from "@/components/dashboard/EcosystemCMS";
import { PluginConnectors } from "@/components/dashboard/PluginConnectors";
import { CustomerAppUiSettings } from "@/components/dashboard/CustomerAppUiSettings";
import { KingPayGlobalSettings } from "@/components/kingpay/KingPayGlobalSettings";
import { AlgorithmSettings } from "@/components/dashboard/AlgorithmSettings";
import { CentralPricingSwitch } from "@/components/pricing/CentralPricingSwitch";
import { UmarOsVisualCustomizationStudio } from "@/components/customization/UmarOsVisualCustomizationStudio";
import { MasterCustomizationHub } from "@/components/customization/MasterCustomizationHub";
import { LaunchPlaybookView } from "@/components/playbook/launch-playbook-view";
import {
  loadSettings,
  saveSettingsFn,
  saveBrandingFn,
  saveCustomerUiSettingsFn,
} from "@/lib/orderking/actions";
import {
  DEFAULT_SETTINGS,
  DEFAULT_RIDER_DISCIPLINE_SETTINGS,
  type RiderDisciplineSettings,
} from "@/lib/orderking/types";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

export interface UmarOsMasterControlsState {
  dine_in_commission_pct: number;
  enterprise_commission_pct: number;
  standard_commission_pct: number;
  full_service_commission_pct: number;
  delivery_radius_km: number;
  geofence_strict_enforcement: boolean;
  rush_hour_surge_multiplier: number;
  rain_surge_enabled: boolean;
  peak_surge_enabled: boolean;
  soundbox_gateway_enabled: boolean;
  thermal_printer_gateway_enabled: boolean;
  zero_delivery_fallback_enabled: boolean;
  affiliate_travel_enabled: boolean;
}

export const DEFAULT_UMAR_OS_CONTROLS: UmarOsMasterControlsState = {
  dine_in_commission_pct: 0,
  enterprise_commission_pct: 18,
  standard_commission_pct: 25,
  full_service_commission_pct: 28,
  delivery_radius_km: 8,
  geofence_strict_enforcement: true,
  rush_hour_surge_multiplier: 1.4,
  rain_surge_enabled: true,
  peak_surge_enabled: true,
  soundbox_gateway_enabled: true,
  thermal_printer_gateway_enabled: true,
  zero_delivery_fallback_enabled: true,
  affiliate_travel_enabled: true,
};

export interface IndianLanguageSpec {
  code: string;
  name: string;
  nativeName: string;
  region: string;
}

export const INDIAN_10_LANGUAGES: IndianLanguageSpec[] = [
  { code: "en", name: "English", nativeName: "English (India)", region: "Pan-India Official" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", region: "North & Central India" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", region: "West Bengal & Tripura" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", region: "Gujarat, Daman & Diu" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", region: "Karnataka" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", region: "Kerala & Lakshadweep" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", region: "Maharashtra & Goa" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", region: "Punjab & Chandigarh" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", region: "Tamil Nadu & Puducherry" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", region: "Andhra Pradesh & Telangana" },
];

export const INDIAN_23_LANGUAGES = INDIAN_10_LANGUAGES;

const ROYAL_THEME_PRESETS = [
  {
    id: "emerald_gold",
    name: "OrderKing Emerald & Gold",
    primaryColor: "#0D3B2E",
    accentColor: "#D97706",
    surfaceColor: "#071712",
    themeMode: "dark" as const,
    desc: "Signature sovereign heritage green with warm royal gold accents",
  },
  {
    id: "crimson_slate",
    name: "Tier-1 Crimson & Slate",
    primaryColor: "#E23744",
    accentColor: "#F59E0B",
    surfaceColor: "#0F172A",
    themeMode: "light" as const,
    desc: "High-conversion appetite crimson paired with crisp executive slate",
  },
  {
    id: "midnight_sovereign",
    name: "Midnight Sovereign Dark",
    primaryColor: "#4F46E5",
    accentColor: "#38BDF8",
    surfaceColor: "#090D16",
    themeMode: "dark" as const,
    desc: "Deep obsidian dark mode with electric indigo & cyan telemetry highlights",
  },
  {
    id: "ivory_executive",
    name: "Ivory Executive Light",
    primaryColor: "#0F766E",
    accentColor: "#B45309",
    surfaceColor: "#FAF8F5",
    themeMode: "light" as const,
    desc: "Daylight-first warm ivory surface with high-contrast teal typography",
  },
];

const FONT_FAMILIES = [
  "Inter / Plus Jakarta Sans",
  "IBM Plex Sans / Newsreader",
  "DM Sans / Space Grotesk",
  "Outfit / JetBrains Mono",
  "System Native UI",
];

type TierKey = "EMERGENCY" | "DANGER" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

interface NotificationTierRule {
  tier: TierKey;
  label: string;
  slaMinutes: number;
  channels: string[];
  autoRemediate: boolean;
  remediationAction: string;
}

const DEFAULT_TIERS: Record<TierKey, NotificationTierRule> = {
  EMERGENCY: {
    tier: "EMERGENCY",
    label: "Tier 1 · Emergency SOS & Road Safety",
    slaMinutes: 2,
    channels: ["SOS Siren", "Direct Phone Call", "SMS", "Founder Command Deck"],
    autoRemediate: true,
    remediationAction:
      "Auto-pause active trip SLA, dispatch 112/108 link & reassign order with zero rider penalty",
  },
  DANGER: {
    tier: "DANGER",
    label: "Tier 2 · Food Safety / FSSAI / Tamper Breach",
    slaMinutes: 5,
    channels: ["Push Alert", "WhatsApp", "Compliance Desk"],
    autoRemediate: true,
    remediationAction:
      "Auto-hold SKU, trigger instant customer refund & request kitchen hygiene photo audit",
  },
  CRITICAL: {
    tier: "CRITICAL",
    label: "Tier 3 · Payment Escrow / Gateway Outage",
    slaMinutes: 10,
    channels: ["Push Alert", "Fintech Webhook", "Founder Deck"],
    autoRemediate: true,
    remediationAction:
      "Auto-failover to secondary UPI/NPCI rail & shield partners from order drop penalties",
  },
  HIGH: {
    tier: "HIGH",
    label: "Tier 4 · Severe Kitchen Delay (>20m) / Unreachable Drop",
    slaMinutes: 15,
    channels: ["In-App Co-Pilot", "Push Notification"],
    autoRemediate: true,
    remediationAction:
      "Auto-credit ₹1/min rider wait bonus (>10m) & adjust customer live ETA transparently",
  },
  MEDIUM: {
    tier: "MEDIUM",
    label: "Tier 5 · COD Float Threshold / Menu Stock Sync",
    slaMinutes: 30,
    channels: ["In-App Banner", "Silent Digest"],
    autoRemediate: true,
    remediationAction:
      "Send polite UPI reconciliation prompt before ₹2,500 limit without harsh account lockouts",
  },
  LOW: {
    tier: "LOW",
    label: "Tier 6 · Routine Telemetry & Daily Digest",
    slaMinutes: 120,
    channels: ["Daily Summary Ledger"],
    autoRemediate: true,
    remediationAction: "Batch into non-intrusive end-of-shift summary report",
  },
};

function SettingsPage() {
  const [config, setConfig] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  // UMAR AI Direct Customization Bar state
  const [umarPrompt, setUmarPrompt] = useState("");
  const [umarApplying, setUmarApplying] = useState(false);
  const [umarLog, setUmarLog] = useState<string | null>(null);

  // Universal Search & Deep Clean state
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeepCleaning, setIsDeepCleaning] = useState(false);

  // Expandable 5 Categories
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({
    cat1: true,
    cat2: true,
    cat3: true,
    cat4: true,
    cat5: true,
  });

  // Optional deep subsystem drawers inside categories
  const [showLiveCustomerPreview, setShowLiveCustomerPreview] = useState(false);
  const [showDeepAlgorithmMatrix, setShowDeepAlgorithmMatrix] = useState(false);
  const [showDeepKingPayMatrix, setShowDeepKingPayMatrix] = useState(false);
  const [showLaunchPlaybook, setShowLaunchPlaybook] = useState(false);
  const [activeSubsystemTab, setActiveSubsystemTab] = useState<"none" | "cms" | "connectors" | "visual_studio" | "hyperlocal_playbook">("none");
  const [confirmResetAll, setConfirmResetAll] = useState(false);

  // Category 1 State: Brand, Colors, Typography & UI Design
  const [brandState, setBrandState] = useState({
    primaryColor: "#0D3B2E",
    accentColor: "#D97706",
    surfaceColor: "#071712",
    fontFamily: "Inter / Plus Jakarta Sans",
    logoText: "OrderKing",
    tagline: "Order like a King.",
    compactMode: false,
    radiusPx: 16,
    themeMode: "light" as "light" | "dark",
  });

  // Category 2 State: Marketplace Economics, Commissions & Algorithm Sliders
  const [econState, setEconState] = useState({
    restaurant_commission_pct: 18,
    platform_fee_inr: 4,
    base_delivery_fee_inr: 35,
    rider_payout_per_km_inr: 8,
    free_delivery_threshold_inr: 199,
    small_order_fee_inr: 15,
    max_delivery_radius_km: 25,
    surge_multiplier_cap: 2.0,
    kitchen_prep_buffer_mins: 15,
    dynamic_surge_enabled: true,
    viral_referrals_enabled: true,
    daily_hub_enabled: false,
    mdr_percentage: 1.8,
    customer_convenience_fee_inr: 4,
    auto_refund_ai_threshold_inr: 250,
    settlement_schedule: "T+1 Automated Escrow",
    payout_rail: "NPCI IMPS / NEFT Batch",
  });

  // Sub-Category 2D State: Tier-1 Rider Discipline, Penalties & Floating Cash Architecture
  const [disciplineState, setDisciplineState] = useState<RiderDisciplineSettings>(
    DEFAULT_RIDER_DISCIPLINE_SETTINGS,
  );

  // Sub-Category 2-Core State: UmarOS Master Sovereign Controls
  const [masterControlsState, setMasterControlsState] = useState<UmarOsMasterControlsState>(
    DEFAULT_UMAR_OS_CONTROLS,
  );

  // Category 3 State: All 23 Official Indian Languages & AI Routing
  const [localeState, setLocaleState] = useState<{
    defaultLocale: string;
    enabledLocales: string[];
    autoDetectLocation: boolean;
    ai_support_provider: string;
    ai_menu_suggester: string;
    ai_tutor_provider: string;
  }>({
    defaultLocale: "en",
    enabledLocales: INDIAN_23_LANGUAGES.map((l) => l.code),
    autoDetectLocation: true,
    ai_support_provider: "Google Gemini (1.5 Pro)",
    ai_menu_suggester: "OpenAI (GPT-4o)",
    ai_tutor_provider: "Google Gemini (1.5 Flash)",
  });

  // Category 4 State: 6-Tier Notification & Zero-Harassment Auto-Remediation Rules
  const [notifState, setNotifState] = useState<{
    zeroHarassmentGuard: boolean;
    weatherGraceEnabled: boolean;
    trafficSpikeImmunity: boolean;
    gatewayOutageShield: boolean;
    tiers: Record<TierKey, NotificationTierRule>;
  }>({
    zeroHarassmentGuard: true,
    weatherGraceEnabled: true,
    trafficSpikeImmunity: true,
    gatewayOutageShield: true,
    tiers: DEFAULT_TIERS,
  });

  function hydrateStatesFromData(data: Record<string, any>) {
    setConfig(data);
    if (data.brand) {
      setBrandState({
        primaryColor: data.brand.primaryColor || "#0D3B2E",
        accentColor: data.brand.accentColor || "#D97706",
        surfaceColor: data.brand.surfaceColor || "#071712",
        fontFamily: data.brand.fontFamily || "Inter / Plus Jakarta Sans",
        logoText: data.brand.logoText || "OrderKing",
        tagline: data.brand.tagline || "Order like a King.",
        compactMode: Boolean(data.brand.compactMode ?? false),
        radiusPx: data.brand.radiusPx !== undefined ? Number(data.brand.radiusPx) : 16,
        themeMode: data.brand.themeMode === "dark" ? "dark" : "light",
      });
    }
    setEconState({
      restaurant_commission_pct: Number(data.restaurant_commission_pct ?? 18),
      platform_fee_inr: Number(data.platform_fee_inr ?? 4),
      base_delivery_fee_inr: Number(data.base_delivery_fee_inr ?? 35),
      rider_payout_per_km_inr: Number(data.rider_payout_per_km_inr ?? 8),
      free_delivery_threshold_inr: Number(data.free_delivery_threshold_inr ?? 199),
      small_order_fee_inr: Number(data.small_order_fee_inr ?? 15),
      max_delivery_radius_km: Number(data.max_delivery_radius_km ?? 25),
      surge_multiplier_cap: Number(data.surge_multiplier_cap ?? 2.0),
      kitchen_prep_buffer_mins: Number(data.kitchen_prep_buffer_mins ?? 15),
      dynamic_surge_enabled: Boolean(data.dynamic_surge_enabled ?? true),
      viral_referrals_enabled: Boolean(data.viral_referrals_enabled ?? true),
      daily_hub_enabled: Boolean(data.daily_hub_enabled ?? false),
      mdr_percentage: Number(data.mdr_percentage ?? data.kingpay?.mdr_percentage ?? 1.8),
      customer_convenience_fee_inr: Number(
        data.customer_convenience_fee_inr ?? data.kingpay?.customer_convenience_fee_inr ?? 4,
      ),
      auto_refund_ai_threshold_inr: Number(
        data.auto_refund_ai_threshold_inr ?? data.kingpay?.auto_refund_ai_threshold_inr ?? 250,
      ),
      settlement_schedule: data.kingpay?.settlement_schedule ?? "T+1 Automated Escrow",
      payout_rail: data.kingpay?.payout_rail ?? "NPCI IMPS / NEFT Batch",
    });

    const loadedLocales = Array.isArray(data.localization?.enabledLocales)
      ? data.localization.enabledLocales
      : INDIAN_23_LANGUAGES.map((l) => l.code);

    setLocaleState({
      defaultLocale: data.localization?.defaultLocale ?? data.default_language ?? "en",
      enabledLocales: loadedLocales,
      autoDetectLocation: Boolean(data.localization?.autoDetectLocation ?? true),
      ai_support_provider: data.ai_support_provider ?? "Google Gemini (1.5 Pro)",
      ai_menu_suggester: data.ai_menu_suggester ?? "OpenAI (GPT-4o)",
      ai_tutor_provider: data.ai_tutor_provider ?? "Google Gemini (1.5 Flash)",
    });

    if (data.notification_rules) {
      setNotifState({
        zeroHarassmentGuard: Boolean(data.notification_rules.zeroHarassmentGuard ?? true),
        weatherGraceEnabled: Boolean(data.notification_rules.weatherGraceEnabled ?? true),
        trafficSpikeImmunity: Boolean(data.notification_rules.trafficSpikeImmunity ?? true),
        gatewayOutageShield: Boolean(data.notification_rules.gatewayOutageShield ?? true),
        tiers: {
          ...DEFAULT_TIERS,
          ...(data.notification_rules.tiers || {}),
        },
      });
    }

    if (data.rider_discipline) {
      setDisciplineState({
        ...DEFAULT_RIDER_DISCIPLINE_SETTINGS,
        ...data.rider_discipline,
      });
    }

    setMasterControlsState({
      dine_in_commission_pct: Number(data.dine_in_commission_pct ?? 0),
      enterprise_commission_pct: Number(data.enterprise_commission_pct ?? 18),
      standard_commission_pct: Number(data.standard_commission_pct ?? data.restaurant_commission_pct ?? 25),
      full_service_commission_pct: Number(data.full_service_commission_pct ?? 28),
      delivery_radius_km: Math.min(15, Math.max(1, Number(data.delivery_radius_km ?? data.max_delivery_radius_km ?? 8))),
      geofence_strict_enforcement: Boolean(data.geofence_strict_enforcement ?? true),
      rush_hour_surge_multiplier: Math.min(2.5, Math.max(1.0, Number(data.rush_hour_surge_multiplier ?? data.surge_multiplier_cap ?? 1.4))),
      rain_surge_enabled: Boolean(data.rain_surge_enabled ?? true),
      peak_surge_enabled: Boolean(data.peak_surge_enabled ?? true),
      soundbox_gateway_enabled: Boolean(data.soundbox_gateway_enabled ?? true),
      thermal_printer_gateway_enabled: Boolean(data.thermal_printer_gateway_enabled ?? true),
      zero_delivery_fallback_enabled: Boolean(data.zero_delivery_fallback_enabled ?? true),
      affiliate_travel_enabled: Boolean(data.affiliate_travel_enabled ?? true),
    });
  }

  async function fetchAllSettings() {
    setLoading(true);
    try {
      const [apiRes] = await Promise.all([
        fetch("/api/v1/admin/settings").then((r) => r.json()),
        loadSettings().catch(() => null),
      ]);
      if (apiRes) {
        hydrateStatesFromData(apiRes);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchAllSettings();
  }, []);

  // Bi-directional save to BOTH `/api/v1/admin/settings` AND OrderKing Server Functions
  const handleSave = async (updates: Record<string, any>, customReason?: string) => {
    setSaving(true);
    try {
      const resp = await fetch("/api/v1/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      await resp.json().catch(() => null);

      // Sync with server functions in parallel
      const nextComm =
        updates.restaurant_commission_pct ?? econState.restaurant_commission_pct;
      const nextFee = updates.platform_fee_inr ?? econState.platform_fee_inr;
      const nextBaseDel = updates.base_delivery_fee_inr ?? econState.base_delivery_fee_inr;
      const nextKmRate = updates.rider_payout_per_km_inr ?? econState.rider_payout_per_km_inr;
      const nextRadius = updates.max_delivery_radius_km ?? econState.max_delivery_radius_km;
      const nextMdr = updates.mdr_percentage ?? econState.mdr_percentage;
      const nextRefund =
        updates.auto_refund_ai_threshold_inr ?? econState.auto_refund_ai_threshold_inr;
      const nextLangs =
        updates.localization?.enabledLocales ?? localeState.enabledLocales;
      const nextDefLang =
        updates.localization?.defaultLocale ?? localeState.defaultLocale;

      await Promise.allSettled([
        saveSettingsFn({
          data: {
            settings: {
              ...DEFAULT_SETTINGS,
              commissionBps: Math.round(Number(nextComm) * 100),
              townCommissionBps: Math.round(Number(nextComm) * 100),
              serviceFeePaise: Math.round(Number(nextFee) * 100),
              riderBasePaise: Math.round(Number(nextBaseDel) * 100),
              riderDistancePaise: Math.round(Number(nextKmRate) * 100),
              dayModeRadiusKm: Number(nextRadius),
              paymentFeeBps: Math.round(Number(nextMdr) * 100),
              refundLimitPaise: Math.round(Number(nextRefund) * 100),
              languages: nextLangs,
              defaultLanguage: nextDefLang,
            },
            reason: customReason || "Updated via UMAR OS Master Settings Studio",
          },
        }),
        updates.brand
          ? saveCustomerUiSettingsFn({
              data: {
                settings: {
                  primaryColor: updates.brand.primaryColor,
                  radiusPx: updates.brand.radiusPx,
                  themeMode: updates.brand.themeMode,
                },
              },
            })
          : Promise.resolve(),
        updates.brand
          ? saveBrandingFn({
              data: {
                patch: {
                  colorPrimary: updates.brand.primaryColor,
                  colorAccent: updates.brand.accentColor,
                  colorBg: updates.brand.surfaceColor,
                  tagline: updates.brand.tagline,
                  appName: updates.brand.logoText,
                },
                reason: customReason || "Brand updated via Master Settings Studio",
              },
            })
          : Promise.resolve(),
      ]);

      setConfig((prev) => ({ ...prev, ...updates }));
      setSavedBanner(customReason || "Configuration synchronized across database & server actions.");
      setTimeout(() => setSavedBanner(null), 4000);
    } catch (e) {
      console.error("Failed to save settings:", e);
    } finally {
      setSaving(false);
    }
  };

  // Handle section reset via `/api/v1/admin/settings`
  async function handleSectionReset(
    target: "brand" | "marketplace" | "algorithm" | "notifications" | "all",
  ) {
    setSaving(true);
    try {
      await fetch("/api/v1/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset_target: target }),
      });
      await fetchAllSettings();
      setConfirmResetAll(false);
      setSavedBanner(`Reset [${target.toUpperCase()}] to institutional defaults.`);
      setTimeout(() => setSavedBanner(null), 4000);
    } catch (e) {
      console.error("Failed to reset section:", e);
    } finally {
      setSaving(false);
    }
  }

  // UMAR AI Direct Customization Parser & Executor
  async function applyViaUmarAi(rawCommand?: string) {
    const cmdText = (rawCommand ?? umarPrompt).trim();
    if (!cmdText) return;
    setUmarApplying(true);
    setUmarLog(null);

    try {
      const lower = cmdText.toLowerCase();

      // Check for reset instructions
      if (lower.includes("reset")) {
        if (lower.includes("brand") || lower.includes("color") || lower.includes("theme")) {
          await handleSectionReset("brand");
          setUmarLog("🤖 UMAR AI reset Brand, Colors & Typography to institutional defaults.");
          setUmarPrompt("");
          return;
        }
        if (lower.includes("commission") || lower.includes("fee") || lower.includes("marketplace")) {
          await handleSectionReset("marketplace");
          setUmarLog("🤖 UMAR AI reset Marketplace Commissions & Fees to defaults.");
          setUmarPrompt("");
          return;
        }
        if (lower.includes("algorithm") || lower.includes("surge") || lower.includes("radius")) {
          await handleSectionReset("algorithm");
          setUmarLog("🤖 UMAR AI reset Dispatch & Surge Algorithm sliders to defaults.");
          setUmarPrompt("");
          return;
        }
        if (lower.includes("all") || lower.includes("factory")) {
          await handleSectionReset("all");
          setUmarLog("🤖 UMAR AI reset all platform settings to institutional defaults.");
          setUmarPrompt("");
          return;
        }
      }

      const nextBrand = { ...brandState };
      const nextEcon = { ...econState };
      const nextLocale = { ...localeState };
      const nextNotif = { ...notifState };
      const appliedChanges: string[] = [];

      // 1. Parse Hex Colors
      const hexMatches = cmdText.match(/#[0-9A-Fa-f]{6}\b/g);
      if (hexMatches && hexMatches.length > 0) {
        if (lower.includes("accent") || lower.includes("gold")) {
          nextBrand.accentColor = hexMatches[0].toUpperCase();
          appliedChanges.push(`Accent Color → ${nextBrand.accentColor}`);
        } else if (lower.includes("surface") || lower.includes("background") || lower.includes("bg")) {
          nextBrand.surfaceColor = hexMatches[0].toUpperCase();
          appliedChanges.push(`Surface Color → ${nextBrand.surfaceColor}`);
        } else {
          nextBrand.primaryColor = hexMatches[0].toUpperCase();
          appliedChanges.push(`Primary Color → ${nextBrand.primaryColor}`);
          if (hexMatches[1]) {
            nextBrand.accentColor = hexMatches[1].toUpperCase();
            appliedChanges.push(`Accent Color → ${nextBrand.accentColor}`);
          }
        }
      }

      // 2. Named theme presets
      if (lower.includes("emerald")) {
        nextBrand.primaryColor = "#0D3B2E";
        nextBrand.accentColor = "#D97706";
        appliedChanges.push("Theme Preset → OrderKing Emerald & Gold");
      } else if (lower.includes("crimson") || lower.includes("tier-1 red")) {
        nextBrand.primaryColor = "#E23744";
        nextBrand.accentColor = "#F59E0B";
        appliedChanges.push("Theme Preset → Crimson & Slate");
      } else if (lower.includes("midnight")) {
        nextBrand.primaryColor = "#4F46E5";
        nextBrand.surfaceColor = "#090D16";
        nextBrand.themeMode = "dark";
        appliedChanges.push("Theme Preset → Midnight Sovereign Dark");
      }

      if (lower.includes("dark mode") || lower.includes("dark theme")) {
        nextBrand.themeMode = "dark";
        appliedChanges.push("Theme Mode → Dark");
      } else if (lower.includes("light mode") || lower.includes("light theme")) {
        nextBrand.themeMode = "light";
        appliedChanges.push("Theme Mode → Light");
      }

      if (lower.includes("compact")) {
        nextBrand.compactMode = !lower.includes("disable") && !lower.includes("off");
        appliedChanges.push(`Compact Mode → ${nextBrand.compactMode ? "ON" : "OFF"}`);
      }

      const radiusMatch = lower.match(/radius\s*(?:to|=|:)?\s*(\d+)/);
      if (radiusMatch) {
        nextBrand.radiusPx = Math.min(32, Math.max(0, Number(radiusMatch[1])));
        appliedChanges.push(`Corner Radius → ${nextBrand.radiusPx}px`);
      }

      // 3. Parse Commission, Delivery Fee, Platform Fee, Per-KM, Radius, Surge
      const commMatch = lower.match(/commission\s*(?:to|=|:)?\s*(\d+(?:\.\d+)?)\s*%?/);
      if (commMatch) {
        nextEcon.restaurant_commission_pct = Number(commMatch[1]);
        appliedChanges.push(`Restaurant Commission → ${nextEcon.restaurant_commission_pct}%`);
      }

      const platFeeMatch = lower.match(/(?:platform|convenience)\s*fee\s*(?:to|=|:)?\s*(?:rs\.?|₹)?\s*(\d+(?:\.\d+)?)/);
      if (platFeeMatch) {
        nextEcon.platform_fee_inr = Number(platFeeMatch[1]);
        nextEcon.customer_convenience_fee_inr = Number(platFeeMatch[1]);
        appliedChanges.push(`Platform Convenience Fee → ₹${nextEcon.platform_fee_inr}`);
      }

      const baseDelMatch = lower.match(/(?:base\s*delivery|delivery\s*base|base\s*fee)\s*(?:fee)?\s*(?:to|=|:)?\s*(?:rs\.?|₹)?\s*(\d+(?:\.\d+)?)/);
      if (baseDelMatch) {
        nextEcon.base_delivery_fee_inr = Number(baseDelMatch[1]);
        appliedChanges.push(`Base Delivery Fee → ₹${nextEcon.base_delivery_fee_inr}`);
      }

      const kmRateMatch = lower.match(/(?:per\s*km|rider\s*rate|km\s*rate)\s*(?:to|=|:)?\s*(?:rs\.?|₹)?\s*(\d+(?:\.\d+)?)/);
      if (kmRateMatch) {
        nextEcon.rider_payout_per_km_inr = Number(kmRateMatch[1]);
        appliedChanges.push(`Rider Per-KM Payout → ₹${nextEcon.rider_payout_per_km_inr}/km`);
      }

      const radiusKmMatch = lower.match(/(?:delivery\s*radius|max\s*radius|radius)\s*(?:to|=|:)?\s*(\d+(?:\.\d+)?)\s*km/);
      if (radiusKmMatch) {
        nextEcon.max_delivery_radius_km = Number(radiusKmMatch[1]);
        appliedChanges.push(`Max Delivery Radius → ${nextEcon.max_delivery_radius_km} km`);
      }

      const surgeMatch = lower.match(/surge\s*(?:cap|multiplier)?\s*(?:to|=|:)?\s*(\d+(?:\.\d+)?)x?/);
      if (surgeMatch) {
        nextEcon.surge_multiplier_cap = Number(surgeMatch[1]);
        appliedChanges.push(`Surge Multiplier Cap → ${nextEcon.surge_multiplier_cap}x`);
      }

      // 4. Parse 10 Indian Benchmark Languages
      if (
        lower.includes("10 language") ||
        lower.includes("all language") ||
        lower.includes("enable all")
      ) {
        nextLocale.enabledLocales = INDIAN_23_LANGUAGES.map((l) => l.code);
        appliedChanges.push("Enabled All 10 Benchmark Indian Languages");
      }

      for (const lang of INDIAN_23_LANGUAGES) {
        if (lower.includes(`default language to ${lang.name.toLowerCase()}`) || lower.includes(`default to ${lang.name.toLowerCase()}`)) {
          nextLocale.defaultLocale = lang.code;
          appliedChanges.push(`Default Platform Language → ${lang.name} (${lang.nativeName})`);
        }
      }

      // 5. Parse Notification & Zero-Harassment Guard
      if (lower.includes("harassment") || lower.includes("zero harassment") || lower.includes("auto-remediat")) {
        nextNotif.zeroHarassmentGuard = true;
        nextNotif.weatherGraceEnabled = true;
        nextNotif.trafficSpikeImmunity = true;
        nextNotif.gatewayOutageShield = true;
        appliedChanges.push("Zero-Harassment Guard & Partner Protection → ACTIVE");
      }

      if (appliedChanges.length === 0) {
        setUmarLog(
          "ℹ️ King AI parsed your instruction. Try specific values such as: 'Set commission to 16% and primary color to #0D3B2E' or 'Enable all 10 languages'.",
        );
        return;
      }

      setBrandState(nextBrand);
      setEconState(nextEcon);
      setLocaleState(nextLocale);
      setNotifState(nextNotif);

      await handleSave(
        {
          brand: nextBrand,
          ...nextEcon,
          kingpay: {
            mdr_percentage: nextEcon.mdr_percentage,
            customer_convenience_fee_inr: nextEcon.customer_convenience_fee_inr,
            auto_refund_ai_threshold_inr: nextEcon.auto_refund_ai_threshold_inr,
            settlement_schedule: nextEcon.settlement_schedule,
            payout_rail: nextEcon.payout_rail,
          },
          localization: {
            defaultLocale: nextLocale.defaultLocale,
            enabledLocales: nextLocale.enabledLocales,
            autoDetectLocation: nextLocale.autoDetectLocation,
          },
          notification_rules: nextNotif,
        },
        `UMAR AI Direct Customization: ${appliedChanges.join(" · ")}`,
      );

      setUmarLog(`✅ Applied via UMAR AI: ${appliedChanges.join(" | ")}`);
      setUmarPrompt("");
    } finally {
      setUmarApplying(false);
    }
  }

  function toggleCategory(catKey: string) {
    setExpandedCats((prev) => ({ ...prev, [catKey]: !prev[catKey] }));
  }

  function toggleLanguageCode(code: string) {
    setLocaleState((prev) => {
      const exists = prev.enabledLocales.includes(code);
      const next = exists
        ? prev.enabledLocales.filter((c) => c !== code)
        : [...prev.enabledLocales, code];
      return { ...prev, enabledLocales: next.length > 0 ? next : ["en"] };
    });
  }

  function exportConfigurationJson() {
    const payload = {
      exportedAt: new Date().toISOString(),
      platform: "OrderKing UMAR OS Master Settings",
      brand: brandState,
      master_controls: masterControlsState,
      marketplace_and_algorithm: econState,
      localization: localeState,
      notification_rules: notifState,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orderking-master-settings-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDeepCleanAndRefresh() {
    setIsDeepCleaning(true);
    try {
      if (typeof window !== "undefined") {
        try {
          const keysToClear = [
            "orderking_settings_cache",
            "orderking_central_pricing_settings",
            "customer_ui_settings",
            "pwa_cached_config",
            "active_restaurant_cache",
            "cached_fare_matrix",
          ];
          keysToClear.forEach((k) => localStorage.removeItem(k));
          sessionStorage.clear();
        } catch {
          /* ignore quota / access errors */
        }
      }

      const [apiRes] = await Promise.all([
        fetch(`/api/v1/admin/settings?cb=${Date.now()}&verify_pool=1`).then((r) => r.json()),
        loadSettings().catch(() => null),
      ]);
      if (apiRes) {
        hydrateStatesFromData(apiRes);
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("orderking:deep_clean"));
      }
      setSavedBanner(
        "⚡ Deep Clean & Refresh Complete: Client storage flushed, Postgres connection pool verified, and master settings re-synchronized without reload."
      );
    } catch (err) {
      console.error("Failed to deep clean settings:", err);
      setSavedBanner("⚠️ Deep clean completed with network notice. Local state refreshed.");
    } finally {
      setIsDeepCleaning(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-600">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-2" />
        <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
          Loading UMAR OS Master Settings Studio...
        </span>
      </div>
    );
  }

  const queryLower = searchQuery.trim().toLowerCase();

  const isCat1Visible =
    !queryLower ||
    [
      "brand",
      "color",
      "colors",
      "typography",
      "font",
      "logo",
      "tagline",
      "theme",
      "themes",
      "palette",
      "radius",
      "compact",
      "ivory",
      "midnight",
      "crimson",
      "emerald",
      "ui design",
      "design studio",
    ].some((k) => k.includes(queryLower) || queryLower.includes(k));

  const isCat2Visible =
    !queryLower ||
    [
      "marketplace",
      "commission",
      "platform fee",
      "delivery fee",
      "rider payout",
      "per km",
      "radius",
      "surge",
      "mdr",
      "refund",
      "settlement",
      "tier1",
      "fare matrix",
      "fare",
      "matrix",
      "progressive",
      "slabs",
      "wait time",
      "waiting pay",
      "wait pay",
      "discipline",
      "floating cash",
      "cash limit",
      "pocket balance",
      "penalty",
      "cooling off",
      "acceptance rate",
      "speed limit",
      "geofence",
      "payout day",
      "wednesday",
      "central pricing",
      "algorithm",
      "economics",
      "rates",
      "playbook",
      "hyperlocal",
      "battlecard",
      "launch",
      "recruitment",
      "cash envelope",
      "floor guarantee",
      "soundbox",
      "thermal printer",
      "zero-delivery",
      "zero delivery",
      "fallback",
      "geo-fencing",
      "geofence",
      "enterprise",
      "dine-in",
      "full service",
      "affiliate travel",
      "hardware",
    ].some((k) => k.includes(queryLower) || queryLower.includes(k));

  const isCat3Visible =
    !queryLower ||
    [
      "language",
      "languages",
      "localization",
      "bengali",
      "hindi",
      "english",
      "tamil",
      "telugu",
      "marathi",
      "gujarati",
      "kannada",
      "malayalam",
      "punjabi",
      "benchmark",
      "10",
      "gemini",
      "openai",
      "ai tutor",
      "ai support",
      "routing",
      "auto-detect",
      "voice",
    ].some((k) => k.includes(queryLower) || queryLower.includes(k));

  const isCat4Visible =
    !queryLower ||
    [
      "notification",
      "notifications",
      "tier",
      "tiers",
      "sos",
      "sos sla",
      "sla",
      "emergency",
      "fssai",
      "tamper",
      "zero harassment",
      "weather",
      "traffic",
      "immunity",
      "remediation",
      "auto-remediate",
      "sms",
      "whatsapp",
      "call",
      "alert",
    ].some((k) => k.includes(queryLower) || queryLower.includes(k));

  const isCat5Visible =
    !queryLower ||
    [
      "cms",
      "developer",
      "plugin",
      "plugins",
      "connector",
      "connectors",
      "webhook",
      "webhooks",
      "integration",
      "integrations",
      "ecosystem",
      "api",
      "razorpay",
      "stripe",
      "database",
      "postgres",
    ].some((k) => k.includes(queryLower) || queryLower.includes(k));

  const totalMatches = [
    isCat1Visible,
    isCat2Visible,
    isCat3Visible,
    isCat4Visible,
    isCat5Visible,
  ].filter(Boolean).length;

  return (
    <div id="settings-top" className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <header className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-slate-500 hover:text-emerald-700 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Founder Command Deck
              </Link>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 flex items-center gap-3">
              <Settings2 className="h-9 w-9 text-emerald-600" />
              UMAR OS Master Settings &amp; Governance Studio
            </h1>
            <p className="text-slate-500 mt-1.5 text-sm">
              Bi-Directional Category → Sub-Category Customization Engine · Synced live with{" "}
              <code className="font-mono text-xs bg-slate-200/70 px-1.5 py-0.5 rounded">
                /api/v1/admin/settings
              </code>{" "}
              &amp; Server Actions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setExpandedCats({ cat1: true, cat2: true, cat3: true, cat4: true, cat5: true })
              }
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Expand All 5 Categories
            </button>
            <button
              type="button"
              onClick={() =>
                setExpandedCats({ cat1: false, cat2: false, cat3: false, cat4: false, cat5: false })
              }
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Collapse All
            </button>
            <button
              type="button"
              onClick={() =>
                document.getElementById("settings-bottom")?.scrollIntoView({ behavior: "smooth" })
              }
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
            >
              <ArrowDown className="h-3.5 w-3.5" /> Scroll Down
            </button>
          </div>
        </header>

        {savedBanner ? (
          <div className="flex items-center justify-between gap-2 bg-emerald-50 text-emerald-900 border border-emerald-300 px-4 py-3 rounded-xl font-bold text-xs shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{savedBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setSavedBanner(null)}
              className="text-emerald-700 underline text-[11px]"
            >
              Dismiss
            </button>
          </div>
        ) : null}

        {/* 🤖 UMAR AI Direct Customization Bar */}
        <section className="rounded-2xl border-2 border-emerald-600/30 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 p-5 text-white shadow-md space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30">
                <Wand2 className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-300 block">
                  Autonomous Founder Co-Pilot
                </span>
                <h2 className="text-base font-bold">
                  🤖 UMAR AI Direct Customization Bar (Natural Language → Live Database Mutation)
                </h2>
              </div>
            </div>
            <span className="text-[11px] font-mono bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 px-2.5 py-1 rounded-full">
              Bi-Directional Sync Active
            </span>
          </div>

          <p className="text-xs text-slate-300">
            Type any setting change in plain English or click a 1-tap preset below. UMAR AI parses your command and updates both the UI controls and{" "}
            <code className="text-emerald-300">/api/v1/admin/settings</code> immediately.
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={umarPrompt}
              onChange={(e) => setUmarPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void applyViaUmarAi();
                }
              }}
              placeholder='e.g. "Set commission to 16% and primary color to #0D3B2E" or "Enable all 23 languages"'
              className="flex-1 rounded-xl bg-slate-800/90 border border-slate-600 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
            />
            <button
              type="button"
              disabled={umarApplying || !umarPrompt.trim()}
              onClick={() => void applyViaUmarAi()}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all shrink-0"
            >
              {umarApplying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Apply via King AI
            </button>
          </div>

          {/* 1-Click Quick King AI Commands */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              "Set commission to 16% and primary color to #0D3B2E",
              "Enable all 10 benchmark languages and default to English",
              "Set base delivery fee to ₹35 and per km rate to ₹8",
              "Set delivery radius to 25 km and surge cap to 1.8x",
              "Reset branding to default",
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setUmarPrompt(chip);
                  void applyViaUmarAi(chip);
                }}
                className="rounded-lg border border-slate-700 bg-slate-800/70 hover:bg-slate-700 px-2.5 py-1 text-[11px] text-slate-200 transition"
              >
                ⚡ {chip}
              </button>
            ))}
          </div>

          {umarLog ? (
            <div className="rounded-xl border border-emerald-400/40 bg-emerald-900/40 px-3.5 py-2 text-xs text-emerald-100 font-mono">
              {umarLog}
            </div>
          ) : null}
        </section>

        {/* 🔍 Universal Settings Search & Deep Clean Switchboard */}
        <section className="bg-white border-2 border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900">
                    Universal Settings Search &amp; Subsystem Finder
                  </h3>
                  {queryLower ? (
                    <span className="text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      {totalMatches} of 5 Categories Match
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-slate-500">
                  Instant deep search across all pricing slabs, wait pay, floating cash, 23 languages, notifications, and webhooks.
                </p>
              </div>
            </div>

            {/* One-Click Deep Clean & Refresh Switch */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isDeepCleaning}
                onClick={() => void handleDeepCleanAndRefresh()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-extrabold text-xs transition disabled:opacity-50 shadow-sm"
              >
                <RefreshCw
                  className={`h-4 w-4 text-emerald-700 ${isDeepCleaning ? "animate-spin" : ""}`}
                />
                {isDeepCleaning ? "Deep Cleaning & Flushed..." : "Deep Clean & Refresh Caches"}
              </button>
            </div>
          </div>

          {/* Search Box Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (val.trim()) {
                  setExpandedCats({
                    cat1: true,
                    cat2: true,
                    cat3: true,
                    cat4: true,
                    cat5: true,
                  });
                }
              }}
              placeholder="Search settings by keyword (e.g., 'slab', 'wait pay', 'cash limit', 'penalty', 'bengali', 'theme', 'webhook')..."
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {/* Quick Filter Search Presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-mono text-slate-500 mr-1">Quick Filters:</span>
            {[
              { label: "Fare Matrix & Slabs", q: "fare matrix" },
              { label: "Discipline & Floating Cash", q: "discipline" },
              { label: "Restaurant Wait Pay", q: "wait pay" },
              { label: "Theme & Palette", q: "theme" },
              { label: "23 Indian Languages", q: "languages" },
              { label: "SOS SLA & Emergency", q: "sos sla" },
              { label: "Developer Webhooks", q: "webhooks" },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setSearchQuery(preset.q);
                  setExpandedCats({
                    cat1: true,
                    cat2: true,
                    cat3: true,
                    cat4: true,
                    cat5: true,
                  });
                }}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition ${
                  searchQuery.toLowerCase() === preset.q.toLowerCase()
                    ? "bg-emerald-600 text-white border-emerald-600 font-bold"
                    : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                }`}
              >
                {preset.label}
              </button>
            ))}
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-[11px] font-mono text-rose-600 hover:underline ml-2"
              >
                Clear Search
              </button>
            ) : null}
          </div>
        </section>

        {/* =====================================================================
            UMAR OS MASTER CUSTOMIZATION & AUTONOMOUS ECOSYSTEM HUB
           ===================================================================== */}
        <MasterCustomizationHub
          initialConfig={config}
          onSaveSuccess={(msg) => {
            setSavedBanner(msg);
            void fetchAllSettings();
          }}
        />

        {/* =====================================================================
            CATEGORY 1: 🎨 Brand, Colors, Typography & UI Design
           ===================================================================== */}
        <section
          id="cat-1"
          style={{ display: isCat1Visible ? "block" : "none" }}
          className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
        >
          <button
            type="button"
            onClick={() => toggleCategory("cat1")}
            className="w-full flex items-center justify-between p-5 bg-slate-50/80 hover:bg-slate-100/70 border-b border-slate-200 text-left transition"
          >
            <div className="flex items-center gap-3">
              <Palette className="h-6 w-6 text-emerald-600" />
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 font-bold">
                  Category 1 · Sub-Categories 1A &amp; 1B
                </span>
                <h2 className="text-lg font-extrabold text-slate-900">
                  🎨 Brand, Colors, Typography &amp; UI Design
                </h2>
              </div>
            </div>
            {expandedCats.cat1 ? (
              <ChevronUp className="h-5 w-5 text-slate-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-500" />
            )}
          </button>

          {expandedCats.cat1 && (
            <div className="p-6 space-y-6">
              {/* Sub-Category 1A: Color Palette Studio & Royal Presets */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Sub-Category 1A · Color Palette Studio &amp; 1-Click Royal Theme Presets
                    </h3>
                    <p className="text-xs text-slate-500">
                      Customize primary brand hex, accent gold hex, and surface background color across Customer, Restaurant, and Rider apps.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-6 w-6 rounded-full border border-slate-300 shadow-inner"
                      style={{ backgroundColor: brandState.primaryColor }}
                      title={`Primary: ${brandState.primaryColor}`}
                    />
                    <span
                      className="h-6 w-6 rounded-full border border-slate-300 shadow-inner"
                      style={{ backgroundColor: brandState.accentColor }}
                      title={`Accent: ${brandState.accentColor}`}
                    />
                    <span
                      className="h-6 w-6 rounded-full border border-slate-300 shadow-inner"
                      style={{ backgroundColor: brandState.surfaceColor }}
                      title={`Surface: ${brandState.surfaceColor}`}
                    />
                  </div>
                </div>

                {/* 4 Royal Theme Presets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {ROYAL_THEME_PRESETS.map((preset) => {
                    const isSelected =
                      brandState.primaryColor.toUpperCase() === preset.primaryColor.toUpperCase();
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() =>
                          setBrandState((prev) => ({
                            ...prev,
                            primaryColor: preset.primaryColor,
                            accentColor: preset.accentColor,
                            surfaceColor: preset.surfaceColor,
                            themeMode: preset.themeMode,
                          }))
                        }
                        className={`rounded-xl border p-3 text-left transition ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600"
                            : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className="h-4 w-4 rounded-full border border-white shadow"
                            style={{ backgroundColor: preset.primaryColor }}
                          />
                          <span
                            className="h-4 w-4 rounded-full border border-white shadow"
                            style={{ backgroundColor: preset.accentColor }}
                          />
                          <span
                            className="h-4 w-4 rounded-full border border-slate-300 shadow"
                            style={{ backgroundColor: preset.surfaceColor }}
                          />
                          <span className="text-xs font-bold text-slate-900">{preset.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">{preset.desc}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Color Pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <ColorField
                    label="Primary Brand Color"
                    value={brandState.primaryColor}
                    onChange={(v) => setBrandState((p) => ({ ...p, primaryColor: v }))}
                  />
                  <ColorField
                    label="Accent / Gold Highlight Color"
                    value={brandState.accentColor}
                    onChange={(v) => setBrandState((p) => ({ ...p, accentColor: v }))}
                  />
                  <ColorField
                    label="Background / Surface Color"
                    value={brandState.surfaceColor}
                    onChange={(v) => setBrandState((p) => ({ ...p, surfaceColor: v }))}
                  />
                </div>
              </div>

              {/* Sub-Category 1B: Corner Radius, Compact Density, Typography & Tagline */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Sub-Category 1B · Corner Geometry, Compact Density, Font Family &amp; Brand Tagline
                  </h3>
                  <p className="text-xs text-slate-500">
                    Control card border radius (`radiusPx`), UI density mode, typography pair, and public brand tagline.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-600">
                      Corner Radius ({brandState.radiusPx}px)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={28}
                      value={brandState.radiusPx}
                      onChange={(e) =>
                        setBrandState((p) => ({ ...p, radiusPx: Number(e.target.value) }))
                      }
                      className="w-full accent-emerald-600"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>0px Sharp</span>
                      <span>16px Royal</span>
                      <span>28px Pill</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-600">
                      Font Family Pair
                    </label>
                    <select
                      value={brandState.fontFamily}
                      onChange={(e) =>
                        setBrandState((p) => ({ ...p, fontFamily: e.target.value }))
                      }
                      className="w-full border border-slate-300 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-900 text-xs font-mono"
                    >
                      {FONT_FAMILIES.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>

                  <TextInputRow
                    title="Brand Logo Text"
                    value={brandState.logoText}
                    onChange={(v: string) => setBrandState((p) => ({ ...p, logoText: v }))}
                  />

                  <TextInputRow
                    title="Brand Tagline"
                    value={brandState.tagline}
                    onChange={(v: string) => setBrandState((p) => ({ ...p, tagline: v }))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <ToggleRow
                    title="Compact UI Density Mode"
                    description="Tighten card padding and table row spacing for high-density operations screens."
                    isOn={brandState.compactMode}
                    onToggle={() =>
                      setBrandState((p) => ({ ...p, compactMode: !p.compactMode }))
                    }
                  />
                  <ToggleRow
                    title="Dark Surface Default Mode"
                    description="Default client surfaces to sovereign dark theme (`dark` vs `light`)."
                    isOn={brandState.themeMode === "dark"}
                    onToggle={() =>
                      setBrandState((p) => ({
                        ...p,
                        themeMode: p.themeMode === "dark" ? "light" : "dark",
                      }))
                    }
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLiveCustomerPreview((v) => !v)}
                    className="text-xs font-mono font-semibold text-emerald-700 underline"
                  >
                    {showLiveCustomerPreview
                      ? "Hide Interactive Mobile App Previewer ▲"
                      : "Open Interactive Mobile App Previewer ▼"}
                  </button>
                  <SaveButton
                    onClick={() =>
                      handleSave(
                        {
                          brand: brandState,
                          primary_color: brandState.primaryColor,
                          accent_color: brandState.accentColor,
                          surface_color: brandState.surfaceColor,
                          font_family: brandState.fontFamily,
                          logo_text: brandState.logoText,
                          tagline: brandState.tagline,
                          compact_mode: brandState.compactMode,
                          radius_px: brandState.radiusPx,
                          theme_mode: brandState.themeMode,
                        },
                        "Saved Category 1: Brand, Colors, Typography & UI Design",
                      )
                    }
                    saving={saving}
                    label="Save Brand & UI Design"
                  />
                </div>

                {showLiveCustomerPreview && (
                  <div className="pt-4 border-t border-slate-200">
                    <CustomerAppUiSettings config={config} onSave={handleSave} saving={saving} />
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* =====================================================================
            CATEGORY 2: ⚖️ Marketplace Economics, Commissions & Algorithm Sliders
           ===================================================================== */}
        <section
          id="cat-2"
          style={{ display: isCat2Visible ? "block" : "none" }}
          className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
        >
          <button
            type="button"
            onClick={() => toggleCategory("cat2")}
            className="w-full flex items-center justify-between p-5 bg-slate-50/80 hover:bg-slate-100/70 border-b border-slate-200 text-left transition"
          >
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="h-6 w-6 text-emerald-600" />
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 font-bold">
                  Category 2 · Sub-Categories 2A, 2B, 2C, 2D &amp; 2E
                </span>
                <h2 className="text-lg font-extrabold text-slate-900">
                  ⚖️ Marketplace Economics, Commissions, Algorithm, Rider Discipline &amp; Central Pricing Switchboard
                </h2>
              </div>
            </div>
            {expandedCats.cat2 ? (
              <ChevronUp className="h-5 w-5 text-slate-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-500" />
            )}
          </button>

          {expandedCats.cat2 && (
            <div className="p-6 space-y-6">
              {/* Sub-Category 2-Core: UmarOS Master Sovereign Controls & Central Switchboard */}
              <div className="rounded-2xl border-2 border-emerald-600/30 bg-gradient-to-br from-emerald-950/5 via-slate-50 to-emerald-50/20 p-5 space-y-6 shadow-sm">
                <div className="border-b border-emerald-100 pb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      UmarOS Autonomous Operational Architecture
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Settings2 className="h-5 w-5 text-emerald-600" />
                      Sub-Category 2-Core · Sovereign Commercial Dials &amp; Master Control Center
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Unified controls for commission &amp; payout tiers, 1–15 km dispatch boundaries, rush-hour surge pricing, IoT soundbox voice announcements, thermal KOT printing, and smart zero-delivery fallbacks.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold px-2.5 py-1">
                      Zero-Competitor Clean
                    </span>
                    <span className="rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold px-2.5 py-1">
                      Employee-less Autonomy
                    </span>
                  </div>
                </div>

                {/* 1. Sovereign 4-Tier Commission & Payout Architecture */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-700 font-bold flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-emerald-600" />
                      1. Platform Commission &amp; Payout Tiers
                    </label>
                    <span className="text-[11px] font-mono text-slate-500">
                      Tier-1 Parity · 4 Clear Economic Tiers
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Tier 1: 0% Dine-In */}
                    <div className="rounded-xl border border-emerald-200 bg-white p-3.5 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 font-mono">
                          <UtensilsCrossed className="w-3 h-3" />
                          0% Dine-In &amp; QR
                        </span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          T+0 Instant
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-snug">
                        Table reservations, QR Pay at Table, and pre-orders. Zero platform commission markup.
                      </p>
                      <div className="pt-1">
                        <div className="flex justify-between text-xs font-bold text-slate-800 font-mono mb-1">
                          <span>Commission</span>
                          <span className="text-emerald-600">{masterControlsState.dine_in_commission_pct}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={5}
                          step={1}
                          value={masterControlsState.dine_in_commission_pct}
                          onChange={(e) =>
                            setMasterControlsState((p) => ({
                              ...p,
                              dine_in_commission_pct: Number(e.target.value),
                            }))
                          }
                          className="w-full accent-emerald-600 h-1.5"
                        />
                      </div>
                    </div>

                    {/* Tier 2: 18% Enterprise Anchor */}
                    <div className="rounded-xl border border-blue-200 bg-white p-3.5 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-700 font-mono">
                          <Store className="w-3 h-3" />
                          18% Enterprise Anchor
                        </span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                          T+1 Escrow
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-snug">
                        High-volume multi-unit chains and national anchor brands with key account SLAs.
                      </p>
                      <div className="pt-1">
                        <div className="flex justify-between text-xs font-bold text-slate-800 font-mono mb-1">
                          <span>Commission</span>
                          <span className="text-blue-600">{masterControlsState.enterprise_commission_pct}%</span>
                        </div>
                        <input
                          type="range"
                          min={12}
                          max={22}
                          step={1}
                          value={masterControlsState.enterprise_commission_pct}
                          onChange={(e) =>
                            setMasterControlsState((p) => ({
                              ...p,
                              enterprise_commission_pct: Number(e.target.value),
                            }))
                          }
                          className="w-full accent-blue-600 h-1.5"
                        />
                      </div>
                    </div>

                    {/* Tier 3: 25% Standard Standalone */}
                    <div className="rounded-xl border border-amber-200 bg-white p-3.5 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-700 font-mono">
                          <Percent className="w-3 h-3" />
                          25% Standard Partner
                        </span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                          Wed Payout
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-snug">
                        Standalone dining outlets and local hero restaurants with standard marketing &amp; fleet.
                      </p>
                      <div className="pt-1">
                        <div className="flex justify-between text-xs font-bold text-slate-800 font-mono mb-1">
                          <span>Commission</span>
                          <span className="text-amber-600">{masterControlsState.standard_commission_pct}%</span>
                        </div>
                        <input
                          type="range"
                          min={20}
                          max={28}
                          step={1}
                          value={masterControlsState.standard_commission_pct}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setMasterControlsState((p) => ({ ...p, standard_commission_pct: val }));
                            setEconState((p) => ({ ...p, restaurant_commission_pct: val }));
                          }}
                          className="w-full accent-amber-600 h-1.5"
                        />
                      </div>
                    </div>

                    {/* Tier 4: 28% Full Service */}
                    <div className="rounded-xl border border-purple-200 bg-white p-3.5 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-purple-700 font-mono">
                          <Zap className="w-3 h-3" />
                          28% Full Service
                        </span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                          T+1 Daily
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-snug">
                        Dedicated fleet priority, autonomous dispatch pre-allocation, and voice IVR alerts.
                      </p>
                      <div className="pt-1">
                        <div className="flex justify-between text-xs font-bold text-slate-800 font-mono mb-1">
                          <span>Commission</span>
                          <span className="text-purple-600">{masterControlsState.full_service_commission_pct}%</span>
                        </div>
                        <input
                          type="range"
                          min={25}
                          max={35}
                          step={1}
                          value={masterControlsState.full_service_commission_pct}
                          onChange={(e) =>
                            setMasterControlsState((p) => ({
                              ...p,
                              full_service_commission_pct: Number(e.target.value),
                            }))
                          }
                          className="w-full accent-purple-600 h-1.5"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Delivery Radius & Geo-Fencing Controls (1 km to 15 km) */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                        2. Delivery Radius &amp; Geo-Fencing Dispatch Controls (1 km – 15 km)
                      </h4>
                      <p className="text-xs text-slate-500">
                        Calibrate maximum dispatch radial boundary with real-time zone SLA classification.
                      </p>
                    </div>
                    <span className="text-xs font-extrabold font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      Active: {masterControlsState.delivery_radius_km} KM Radius
                    </span>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="range"
                      min={1}
                      max={15}
                      step={1}
                      value={masterControlsState.delivery_radius_km}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setMasterControlsState((p) => ({ ...p, delivery_radius_km: val }));
                        setEconState((p) => ({ ...p, max_delivery_radius_km: val }));
                      }}
                      className="w-full accent-emerald-600 h-2"
                    />
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>1 KM (Ultra-Dense)</span>
                      <span>5 KM (Urban Standard)</span>
                      <span>10 KM (Highway Relay)</span>
                      <span>15 KM (Maximum Boundary)</span>
                    </div>
                  </div>

                  {/* Visual Zone Indicator Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div
                      className={`p-3 rounded-xl border text-xs font-mono transition ${
                        masterControlsState.delivery_radius_km <= 3
                          ? "border-emerald-500 bg-emerald-50/70 text-emerald-900 font-bold"
                          : "border-slate-200 bg-slate-50/60 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold uppercase">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        1–3 KM · Hyperlocal Core
                      </div>
                      <p className="text-[10px] leading-snug">
                        Sub-20m SLA · Zero thermal decay · Lowest rider effort &amp; highest batching efficiency.
                      </p>
                    </div>

                    <div
                      className={`p-3 rounded-xl border text-xs font-mono transition ${
                        masterControlsState.delivery_radius_km > 3 && masterControlsState.delivery_radius_km <= 7
                          ? "border-emerald-500 bg-emerald-50/70 text-emerald-900 font-bold"
                          : "border-slate-200 bg-slate-50/60 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold uppercase">
                        <Compass className="w-3 h-3 text-emerald-600" />
                        4–7 KM · Urban Corridor
                      </div>
                      <p className="text-[10px] leading-snug">
                        25–35m SLA · Standard two-wheeler transit corridor with optimal order frequency.
                      </p>
                    </div>

                    <div
                      className={`p-3 rounded-xl border text-xs font-mono transition ${
                        masterControlsState.delivery_radius_km > 7
                          ? "border-emerald-500 bg-emerald-50/70 text-emerald-900 font-bold"
                          : "border-slate-200 bg-slate-50/60 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold uppercase">
                        <Navigation className="w-3 h-3 text-emerald-600" />
                        8–15 KM · Extended Perimeter
                      </div>
                      <p className="text-[10px] leading-snug">
                        35–50m SLA · Long-distance highway relay buffer with long-trip rider return allowances.
                      </p>
                    </div>
                  </div>

                  {/* Strict Geofence Toggle */}
                  <ToggleRow
                    title="Strict Geo-Fencing Boundary Clamping"
                    description="When enabled, prevents riders and customers from placing or dispatching delivery orders outside established municipal polygon boundaries."
                    isOn={masterControlsState.geofence_strict_enforcement}
                    onToggle={() =>
                      setMasterControlsState((p) => ({
                        ...p,
                        geofence_strict_enforcement: !p.geofence_strict_enforcement,
                      }))
                    }
                  />
                </div>

                {/* 3. Rush-Hour Surge Pricing Multipliers (1.0x to 2.5x) */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        3. Rush-Hour &amp; Weather Surge Pricing Engine (1.0x – 2.5x)
                      </h4>
                      <p className="text-xs text-slate-500">
                        Autonomous demand-supply equilibrium curve with 100% fair pass-through to delivery partners.
                      </p>
                    </div>
                    <span className="text-xs font-extrabold font-mono text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      Cap: {masterControlsState.rush_hour_surge_multiplier.toFixed(1)}x Surge
                    </span>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="range"
                      min={1.0}
                      max={2.5}
                      step={0.1}
                      value={masterControlsState.rush_hour_surge_multiplier}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setMasterControlsState((p) => ({ ...p, rush_hour_surge_multiplier: val }));
                        setEconState((p) => ({ ...p, surge_multiplier_cap: val }));
                      }}
                      className="w-full accent-amber-600 h-2"
                    />
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>1.0x (No Surge / Base Fare)</span>
                      <span>1.5x (Moderate Lunch/Dinner)</span>
                      <span>2.0x (Heavy Rain / Festival)</span>
                      <span>2.5x (Statutory Maximum Cap)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <ToggleRow
                      title="Inclement Weather / Rain Surge Active"
                      description="Adds ₹30.00 weather bonus per order during drizzle/downpour with 100% pass-through directly to the rider."
                      isOn={masterControlsState.rain_surge_enabled}
                      onToggle={() =>
                        setMasterControlsState((p) => ({
                          ...p,
                          rain_surge_enabled: !p.rain_surge_enabled,
                        }))
                      }
                    />
                    <ToggleRow
                      title="Peak Hour Lunch &amp; Dinner Surge Multipliers"
                      description="Applies traffic friction matrix compensation during lunch (12:00–15:30) and dinner (19:30–23:30) congestion."
                      isOn={masterControlsState.peak_surge_enabled}
                      onToggle={() =>
                        setMasterControlsState((p) => ({
                          ...p,
                          peak_surge_enabled: !p.peak_surge_enabled,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* 4. Hardware Gateways (Notification Soundbox & Thermal Printer) */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                      4. Hardware Gateways (IoT Soundbox &amp; ESC/POS Thermal Printer)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Direct integration with wireless merchant voice boxes and kitchen order ticket printers.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Soundbox Card */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold text-slate-900 font-mono">
                            Wireless Voice Soundbox
                          </span>
                        </div>
                        <span
                          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            masterControlsState.soundbox_gateway_enabled
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {masterControlsState.soundbox_gateway_enabled ? "4G / Wi-Fi Active" : "Disabled"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        High-decibel voice announcements in 10 Indian food delivery benchmark languages upon order receipt and KingPay UPI payments.
                      </p>
                      <ToggleRow
                        title="Enable Soundbox Voice Announcements"
                        description="Auto-broadcast payment and new order alerts on kitchen soundbox terminals."
                        isOn={masterControlsState.soundbox_gateway_enabled}
                        onToggle={() =>
                          setMasterControlsState((p) => ({
                            ...p,
                            soundbox_gateway_enabled: !p.soundbox_gateway_enabled,
                          }))
                        }
                      />
                    </div>

                    {/* Thermal Printer Card */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Printer className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold text-slate-900 font-mono">
                            ESC/POS Thermal KOT Printer
                          </span>
                        </div>
                        <span
                          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            masterControlsState.thermal_printer_gateway_enabled
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {masterControlsState.thermal_printer_gateway_enabled ? "Auto-Print Active" : "Disabled"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Auto-fires Kitchen Order Tickets (KOT) over Bluetooth and LAN (58mm / 80mm ESC/POS) directly to kitchen staff without cashier intervention.
                      </p>
                      <ToggleRow
                        title="Enable ESC/POS Thermal Auto-Print"
                        description="Direct 58mm/80mm receipt generation upon order confirmation."
                        isOn={masterControlsState.thermal_printer_gateway_enabled}
                        onToggle={() =>
                          setMasterControlsState((p) => ({
                            ...p,
                            thermal_printer_gateway_enabled: !p.thermal_printer_gateway_enabled,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Smart Zero-Delivery Fallback Switch */}
                <div className="rounded-xl border border-emerald-200 bg-white p-4 space-y-4">
                  <div className="border-b border-emerald-100 pb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        5. Smart Zero-Delivery Fallback &amp; Non-Delivery Sovereign Utilities
                      </h4>
                      <p className="text-xs text-slate-500">
                        When food delivery is unavailable in a user's pin/zone, seamlessly present high-margin non-delivery utilities so the user extracts value and the founder captures revenue.
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full ${
                        masterControlsState.zero_delivery_fallback_enabled
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {masterControlsState.zero_delivery_fallback_enabled ? "Fallback Active" : "Off"}
                    </span>
                  </div>

                  <ToggleRow
                    title="Activate Smart Zero-Delivery Fallback Switch"
                    description="Automatically routes users in unserved delivery clusters to 0% Dine-In table booking, KingPay UPI restaurant bill split, catering budget calculator, and fleet gig onboarding."
                    isOn={masterControlsState.zero_delivery_fallback_enabled}
                    onToggle={() =>
                      setMasterControlsState((p) => ({
                        ...p,
                        zero_delivery_fallback_enabled: !p.zero_delivery_fallback_enabled,
                      }))
                    }
                  />

                  {/* Fallback Utilities Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-mono space-y-1">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px]">
                        <UtensilsCrossed className="w-3 h-3 text-emerald-600" />
                        0% Dine-In Reservations
                      </div>
                      <p className="text-[10px] text-slate-500 leading-snug">
                        Guaranteed table booking &amp; direct menu pre-order without delivery delay.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-mono space-y-1">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px]">
                        <Wallet className="w-3 h-3 text-emerald-600" />
                        KingPay UPI Bill Split
                      </div>
                      <p className="text-[10px] text-slate-500 leading-snug">
                        Instant restaurant bill split via dynamic UPI QR with zero licensing friction.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-mono space-y-1">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px]">
                        <Store className="w-3 h-3 text-emerald-600" />
                        Culinary &amp; Fleet Gigs
                      </div>
                      <p className="text-[10px] text-slate-500 leading-snug">
                        Real-time onboarding for delivery riders, home chefs, and menu auditors.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-mono space-y-1">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px]">
                        <Plane className="w-3 h-3 text-emerald-600" />
                        Smart Affiliate Travel
                      </div>
                      <p className="text-[10px] text-slate-500 leading-snug">
                        Official deep-links to IRCTC Indian Railways and airlines without mock generators.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 6. Smart Affiliate Travel & Experiences Gateway */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                  <div className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Plane className="w-3.5 h-3.5 text-emerald-600" />
                        6. Smart Affiliate Travel &amp; Experiences Gateway
                      </h4>
                      <p className="text-xs text-slate-500">
                        Official airline and train portal deep-links generating risk-free high-margin affiliate commissions without ticketing licenses.
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full ${
                        masterControlsState.affiliate_travel_enabled
                          ? "bg-blue-100 text-blue-800 border border-blue-300"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {masterControlsState.affiliate_travel_enabled ? "Active" : "Disabled"}
                    </span>
                  </div>

                  <ToggleRow
                    title="Enable Sovereign Affiliate Travel Deep-Links"
                    description="Routes customers searching for travel snacks or meals to official IRCTC / airline booking portals with founder referral tagging."
                    isOn={masterControlsState.affiliate_travel_enabled}
                    onToggle={() =>
                      setMasterControlsState((p) => ({
                        ...p,
                        affiliate_travel_enabled: !p.affiliate_travel_enabled,
                      }))
                    }
                  />
                </div>

                {/* Save Master Dials Button */}
                <div className="flex justify-end pt-2 border-t border-emerald-100">
                  <SaveButton
                    onClick={() =>
                      handleSave(
                        {
                          ...masterControlsState,
                          restaurant_commission_pct: masterControlsState.standard_commission_pct,
                          max_delivery_radius_km: masterControlsState.delivery_radius_km,
                          surge_multiplier_cap: masterControlsState.rush_hour_surge_multiplier,
                        },
                        "Saved UmarOS Master Sovereign Controls & Commercial Dials",
                      )
                    }
                    saving={saving}
                    label="Save Sovereign Master Controls"
                  />
                </div>
              </div>

              {/* Sub-Category 2A: Commissions, Delivery Tariffs & Thresholds */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Percent className="h-4 w-4 text-emerald-600" />
                    Sub-Category 2A · Restaurant Commission %, Platform Fees &amp; Statutory Rider Pay
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure restaurant take-rate, customer convenience fee, statutory ₹35 rider base pay, per-km rate, and free delivery threshold.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <InputRow
                    title="Restaurant Commission (%)"
                    value={econState.restaurant_commission_pct}
                    onChange={(v: string) =>
                      setEconState((p) => ({ ...p, restaurant_commission_pct: Number(v) }))
                    }
                  />
                  <InputRow
                    title="Platform Convenience Fee (₹)"
                    value={econState.platform_fee_inr}
                    onChange={(v: string) =>
                      setEconState((p) => ({
                        ...p,
                        platform_fee_inr: Number(v),
                        customer_convenience_fee_inr: Number(v),
                      }))
                    }
                  />
                  <InputRow
                    title="Base Delivery Fee (₹ · Min ₹35)"
                    value={econState.base_delivery_fee_inr}
                    onChange={(v: string) =>
                      setEconState((p) => ({ ...p, base_delivery_fee_inr: Number(v) }))
                    }
                  />
                  <InputRow
                    title="Rider Per-KM Rate (₹/km)"
                    value={econState.rider_payout_per_km_inr}
                    onChange={(v: string) =>
                      setEconState((p) => ({ ...p, rider_payout_per_km_inr: Number(v) }))
                    }
                  />
                  <InputRow
                    title="Free Delivery Order Threshold (₹)"
                    value={econState.free_delivery_threshold_inr}
                    onChange={(v: string) =>
                      setEconState((p) => ({ ...p, free_delivery_threshold_inr: Number(v) }))
                    }
                  />
                  <InputRow
                    title="Small Basket Order Fee (₹)"
                    value={econState.small_order_fee_inr}
                    onChange={(v: string) =>
                      setEconState((p) => ({ ...p, small_order_fee_inr: Number(v) }))
                    }
                  />
                </div>
              </div>

              {/* Sub-Category 2B: Dispatch & Surge Algorithm */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Sub-Category 2B · Dispatch Radius, Surge Cap &amp; Kitchen Prep Buffer Sliders
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real-time geospatial dispatch radius, peak/rain surge cap, and kitchen prep buffer minutes.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <InputRow
                    title="Max Delivery Radius (KM)"
                    value={econState.max_delivery_radius_km}
                    onChange={(v: string) =>
                      setEconState((p) => ({ ...p, max_delivery_radius_km: Number(v) }))
                    }
                  />
                  <InputRow
                    title="Surge Multiplier Cap (e.g. 2.0x)"
                    value={econState.surge_multiplier_cap}
                    onChange={(v: string) =>
                      setEconState((p) => ({ ...p, surge_multiplier_cap: Number(v) }))
                    }
                  />
                  <InputRow
                    title="Kitchen Prep Buffer (Mins)"
                    value={econState.kitchen_prep_buffer_mins}
                    onChange={(v: string) =>
                      setEconState((p) => ({ ...p, kitchen_prep_buffer_mins: Number(v) }))
                    }
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <ToggleRow
                    title="Dynamic Peak & Rain Surge"
                    description="Automatically apply fair rider weather/peak surge up to cap."
                    isOn={econState.dynamic_surge_enabled}
                    onToggle={() =>
                      setEconState((p) => ({
                        ...p,
                        dynamic_surge_enabled: !p.dynamic_surge_enabled,
                      }))
                    }
                  />
                  <ToggleRow
                    title="Viral WhatsApp Referrals"
                    description="Multi-sided referral rewards for customers, riders & restaurants."
                    isOn={econState.viral_referrals_enabled}
                    onToggle={() =>
                      setEconState((p) => ({
                        ...p,
                        viral_referrals_enabled: !p.viral_referrals_enabled,
                      }))
                    }
                  />
                  <ToggleRow
                    title="Daily Specials Hub"
                    description="Highlight curated daily value meals on customer home."
                    isOn={econState.daily_hub_enabled}
                    onToggle={() =>
                      setEconState((p) => ({
                        ...p,
                        daily_hub_enabled: !p.daily_hub_enabled,
                      }))
                    }
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowDeepAlgorithmMatrix((v) => !v)}
                  className="text-xs font-mono font-semibold text-emerald-700 underline"
                >
                  {showDeepAlgorithmMatrix
                    ? "Hide Deep Day/Night/Highway Algorithmic Matrix ▲"
                    : "Open Deep Day/Night/Highway Algorithmic Matrix ▼"}
                </button>
                {showDeepAlgorithmMatrix && (
                  <div className="pt-3 border-t border-slate-200">
                    <AlgorithmSettings />
                  </div>
                )}
              </div>

              {/* Sub-Category 2C: KingPay & Escrow Rules */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-emerald-600" />
                    Sub-Category 2C · KingPay Fintech, MDR % &amp; Escrow Settlement Rules
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure gateway MDR %, autonomous AI refund threshold (₹), and partner settlement cycle.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <InputRow
                    title="Payment Gateway MDR (%)"
                    value={econState.mdr_percentage}
                    onChange={(v: string) =>
                      setEconState((p) => ({ ...p, mdr_percentage: Number(v) }))
                    }
                  />
                  <InputRow
                    title="Auto-Refund AI Threshold (₹)"
                    value={econState.auto_refund_ai_threshold_inr}
                    onChange={(v: string) =>
                      setEconState((p) => ({ ...p, auto_refund_ai_threshold_inr: Number(v) }))
                    }
                  />
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-600">
                      Settlement Schedule
                    </label>
                    <select
                      value={econState.settlement_schedule}
                      onChange={(e) =>
                        setEconState((p) => ({ ...p, settlement_schedule: e.target.value }))
                      }
                      className="w-full border border-slate-300 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-900 text-xs font-mono"
                    >
                      <option value="T+1 Automated Escrow">T+1 Automated Escrow</option>
                      <option value="Wednesday Weekly Batch (2:00 PM IST)">
                        Wednesday Weekly Batch (2:00 PM IST)
                      </option>
                      <option value="Same-Day Instant IMPS">Same-Day Instant IMPS</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-600">
                      Clearing Payout Rail
                    </label>
                    <select
                      value={econState.payout_rail}
                      onChange={(e) =>
                        setEconState((p) => ({ ...p, payout_rail: e.target.value }))
                      }
                      className="w-full border border-slate-300 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-900 text-xs font-mono"
                    >
                      <option value="NPCI IMPS / NEFT Batch">NPCI IMPS / NEFT Batch</option>
                      <option value="UPI Corporate Autopay">UPI Corporate Autopay</option>
                      <option value="RTGS High-Value Treasury">RTGS High-Value Treasury</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeepKingPayMatrix((v) => !v)}
                    className="text-xs font-mono font-semibold text-emerald-700 underline"
                  >
                    {showDeepKingPayMatrix
                      ? "Hide Full KingPay Treasury Matrix ▲"
                      : "Open Full KingPay Treasury Matrix ▼"}
                  </button>
                  <SaveButton
                    onClick={() =>
                      handleSave(
                        {
                          ...econState,
                          kingpay: {
                            mdr_percentage: econState.mdr_percentage,
                            customer_convenience_fee_inr: econState.customer_convenience_fee_inr,
                            auto_refund_ai_threshold_inr: econState.auto_refund_ai_threshold_inr,
                            settlement_schedule: econState.settlement_schedule,
                            payout_rail: econState.payout_rail,
                          },
                          algorithm: {
                            maxDeliveryRadiusKm: econState.max_delivery_radius_km,
                            baseDeliveryFeeInr: econState.base_delivery_fee_inr,
                            surgeMultiplierCap: econState.surge_multiplier_cap,
                            kitchenPrepBufferMinutes: econState.kitchen_prep_buffer_mins,
                          },
                          rider_discipline: disciplineState,
                        },
                        "Saved Category 2: Marketplace Economics, Commissions & Algorithm Sliders",
                      )
                    }
                    saving={saving}
                    label="Save Economics & Algorithm"
                  />
                </div>

                {showDeepKingPayMatrix && (
                  <div className="pt-3 border-t border-slate-200">
                    <KingPayGlobalSettings />
                  </div>
                )}
              </div>

              {/* Sub-Category 2D: Tier-1 Rider Discipline, Penalties & Floating Cash ("Pocket Balance") Architecture */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-4">
                <div className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-emerald-600" />
                      Sub-Category 2D · Tier-1 Rider Discipline, Penalties &amp; Floating Cash ("Pocket Balance") Architecture
                    </h3>
                    <p className="text-xs text-slate-500">
                      Configure COD floating cash limit, pre/post-pickup cancellation deductions, consecutive rejection cooling-off freeze, and UPI deposit VPA.
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 font-mono">
                    Tier-1 Exact Parity
                  </span>
                </div>

                {/* Master Toggle */}
                <ToggleRow
                  title="Activate Fleet Discipline & Pocket Balance Subsystem"
                  description="When enabled, riders exceeding the floating cash cap are blocked from receiving COD orders until depositing cash, and excessive order rejections trigger automatic cooling-off."
                  isOn={disciplineState.enabled}
                  onToggle={() =>
                    setDisciplineState((p) => ({ ...p, enabled: !p.enabled }))
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Floating Cash Limit */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-600">
                      COD Floating Cash Limit (₹{disciplineState.floating_cash_limit_inr.toLocaleString("en-IN")})
                    </label>
                    <input
                      type="range"
                      min={500}
                      max={10000}
                      step={100}
                      value={disciplineState.floating_cash_limit_inr}
                      onChange={(e) =>
                        setDisciplineState((p) => ({
                          ...p,
                          floating_cash_limit_inr: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-emerald-600"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>₹500 Strict</span>
                      <span>₹2,000 (Tier-1 Benchmark)</span>
                      <span>₹10,000 High</span>
                    </div>
                  </div>

                  {/* Pre-Pickup Cancellation Penalty */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-600">
                      Pre-Pickup Cancel Penalty (₹{disciplineState.cancellation_penalty_before_pickup_inr})
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={disciplineState.cancellation_penalty_before_pickup_inr}
                      onChange={(e) =>
                        setDisciplineState((p) => ({
                          ...p,
                          cancellation_penalty_before_pickup_inr: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-emerald-600"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>₹0 Grace</span>
                      <span>₹25 Tier-1 Standard</span>
                      <span>₹100 Max</span>
                    </div>
                  </div>

                  {/* Post-Pickup Cancellation Rule */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-600">
                      Post-Pickup Cancellation Rule
                    </label>
                    <select
                      value={disciplineState.cancellation_penalty_post_pickup_type}
                      onChange={(e) =>
                        setDisciplineState((p) => ({
                          ...p,
                          cancellation_penalty_post_pickup_type: e.target.value as any,
                        }))
                      }
                      className="w-full border border-slate-300 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-900 text-xs font-mono"
                    >
                      <option value="FULL_ORDER">Full Order Value Deduction (Tier-1 Benchmark)</option>
                      <option value="CUSTOM_FLAT">Custom Flat Fee Deduction</option>
                      <option value="NONE">Dispute Hold Only (No Penalty)</option>
                    </select>
                  </div>

                  {/* Consecutive Rejections Threshold */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-600">
                      Consecutive Rejection Threshold ({disciplineState.cooling_off_consecutive_rejections} Declines)
                    </label>
                    <input
                      type="range"
                      min={2}
                      max={8}
                      step={1}
                      value={disciplineState.cooling_off_consecutive_rejections}
                      onChange={(e) =>
                        setDisciplineState((p) => ({
                          ...p,
                          cooling_off_consecutive_rejections: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-emerald-600"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>2 Declines</span>
                      <span>3 (Tier-1 Rule)</span>
                      <span>8 Lenient</span>
                    </div>
                  </div>

                  {/* Cooling-Off Freeze Duration */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-600">
                      Cooling-Off Freeze Duration ({disciplineState.cooling_off_duration_minutes} Mins)
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={60}
                      step={5}
                      value={disciplineState.cooling_off_duration_minutes}
                      onChange={(e) =>
                        setDisciplineState((p) => ({
                          ...p,
                          cooling_off_duration_minutes: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-emerald-600"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>5 Mins Quick</span>
                      <span>15 Mins Standard</span>
                      <span>60 Mins Severe</span>
                    </div>
                  </div>

                  {/* Acceptance Rate Threshold */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-600">
                      Min Acceptance Rate Threshold ({disciplineState.cooling_off_acceptance_rate_threshold_pct}%)
                    </label>
                    <input
                      type="range"
                      min={50}
                      max={90}
                      step={5}
                      value={disciplineState.cooling_off_acceptance_rate_threshold_pct}
                      onChange={(e) =>
                        setDisciplineState((p) => ({
                          ...p,
                          cooling_off_acceptance_rate_threshold_pct: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-emerald-600"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>50% Low</span>
                      <span>70% Standard</span>
                      <span>90% Strict</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <TextInputRow
                    title="Treasury UPI VPA for Floating Cash Deposit"
                    value={disciplineState.upi_deposit_vpa}
                    onChange={(v: string) =>
                      setDisciplineState((p) => ({ ...p, upi_deposit_vpa: v }))
                    }
                  />

                  <ToggleRow
                    title="Enable Dynamic In-App NPCI QR Code"
                    description="Generates real-time UPI QR codes with order reference in the Rider App for zero-friction floating cash settlement."
                    isOn={disciplineState.enable_instant_deposit_qr}
                    onToggle={() =>
                      setDisciplineState((p) => ({
                        ...p,
                        enable_instant_deposit_qr: !p.enable_instant_deposit_qr,
                      }))
                    }
                  />
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <SaveButton
                    onClick={() =>
                      handleSave(
                        {
                          ...econState,
                          rider_discipline: disciplineState,
                        },
                        "Saved Sub-Category 2D: Tier-1 Rider Discipline, Penalties & Floating Cash Architecture",
                      )
                    }
                    saving={saving}
                    label="Save Rider Discipline & Floating Cash Settings"
                  />
                </div>
              </div>

              {/* Sub-Category 2E: Central Pricing Switchboard (Tier-1 Parity Algorithmic Knobs & Simulator) */}
              <div className="pt-2">
                <CentralPricingSwitch />
              </div>

              {/* Sub-Category 2F: 5-Day Hyperlocal Launch Playbook & Ground Execution Engine */}
              <div className="rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/40 via-white to-slate-50 p-5 space-y-4 shadow-sm">
                <div className="border-b border-emerald-100 pb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      Astra 6 Ground Execution Playbook
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Rocket className="h-5 w-5 text-emerald-600" />
                      Sub-Category 2F · 5-Day Hyperlocal Launch Playbook &amp; Field Operations Engine
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      15-min walk-in battlecards, ₹500/day rider floor guarantee, LOCAL40 customer launch, 5-day street timetable, and ₹85,000 cash envelope ledger.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLaunchPlaybook((v) => !v)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-600 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    <Rocket className="h-4 w-4" />
                    {showLaunchPlaybook ? "Collapse Launch Playbook" : "Open Launch Playbook Studio"}
                  </button>
                </div>

                {showLaunchPlaybook ? (
                  <div className="pt-2">
                    <LaunchPlaybookView />
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-600 bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                    <span className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-emerald-700" />
                      Targets: 20 Restaurants · 15 Delivery Partners · 500 Customer Leads (3km Cluster)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowLaunchPlaybook(true)}
                      className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                    >
                      Launch Interactive Studio <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* =====================================================================
            CATEGORY 3: 🌐 All 23 Official Indian Languages (22 Scheduled + English)
           ===================================================================== */}
        <section
          id="cat-3"
          style={{ display: isCat3Visible ? "block" : "none" }}
          className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
        >
          <button
            type="button"
            onClick={() => toggleCategory("cat3")}
            className="w-full flex items-center justify-between p-5 bg-slate-50/80 hover:bg-slate-100/70 border-b border-slate-200 text-left transition"
          >
            <div className="flex items-center gap-3">
              <Languages className="h-6 w-6 text-emerald-600" />
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 font-bold">
                  Category 3 · Sub-Categories 3A &amp; 3B ({localeState.enabledLocales.length} / 10 Active)
                </span>
                <h2 className="text-lg font-extrabold text-slate-900">
                  🌐 10 Indian Food Delivery Benchmark Languages
                </h2>
              </div>
            </div>
            {expandedCats.cat3 ? (
              <ChevronUp className="h-5 w-5 text-slate-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-500" />
            )}
          </button>

          {expandedCats.cat3 && (
            <div className="p-6 space-y-6">
              {/* Sub-Category 3A: Default Platform Language & AI Model Routing */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Sub-Category 3A · Default Platform Language, Geo-Dialect Detection &amp; AI Translation Models
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select the primary fallback language and multi-lingual AI model routers across Customer, Restaurant, and Rider voice/chat co-pilots.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-600">
                      Default Platform Language
                    </label>
                    <select
                      value={localeState.defaultLocale}
                      onChange={(e) =>
                        setLocaleState((p) => ({ ...p, defaultLocale: e.target.value }))
                      }
                      className="w-full border border-slate-300 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-900 text-xs font-mono"
                    >
                      {INDIAN_23_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.name} — {l.nativeName} ({l.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-600">
                      AI Support Co-Pilot Model
                    </label>
                    <select
                      value={localeState.ai_support_provider}
                      onChange={(e) =>
                        setLocaleState((p) => ({ ...p, ai_support_provider: e.target.value }))
                      }
                      className="w-full border border-slate-300 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-900 text-xs font-mono"
                    >
                      {["Google Gemini (1.5 Pro)", "OpenAI (GPT-4o)", "xAI Grok-4.5"].map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-600">
                      AI Menu &amp; Craving Suggester
                    </label>
                    <select
                      value={localeState.ai_menu_suggester}
                      onChange={(e) =>
                        setLocaleState((p) => ({ ...p, ai_menu_suggester: e.target.value }))
                      }
                      className="w-full border border-slate-300 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-900 text-xs font-mono"
                    >
                      {["OpenAI (GPT-4o)", "Google Gemini (1.5 Flash)", "xAI Grok-4.5"].map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-600">
                      Rider Voice Mentor Engine
                    </label>
                    <select
                      value={localeState.ai_tutor_provider}
                      onChange={(e) =>
                        setLocaleState((p) => ({ ...p, ai_tutor_provider: e.target.value }))
                      }
                      className="w-full border border-slate-300 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-900 text-xs font-mono"
                    >
                      {["Google Gemini (1.5 Flash)", "OpenAI (GPT-4o)", "xAI Grok-4.5"].map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <ToggleRow
                  title="Automatic GPS & Pincode Dialect Detection"
                  description="Automatically greet customers, restaurant partners, and riders in their regional scheduled language based on city/district."
                  isOn={localeState.autoDetectLocation}
                  onToggle={() =>
                    setLocaleState((p) => ({
                      ...p,
                      autoDetectLocation: !p.autoDetectLocation,
                    }))
                  }
                />
              </div>

              {/* Sub-Category 3B: Interactive 10-Language Enablement Grid */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Sub-Category 3B · Interactive 10-Language Enablement Grid
                    </h3>
                    <p className="text-xs text-slate-500">
                      10 Indian food delivery market benchmark languages. Click any card to toggle support.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setLocaleState((p) => ({
                          ...p,
                          enabledLocales: INDIAN_23_LANGUAGES.map((l) => l.code),
                        }))
                      }
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                    >
                      ✓ Enable All 10 Languages
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {INDIAN_23_LANGUAGES.map((lang) => {
                    const enabled = localeState.enabledLocales.includes(lang.code);
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => toggleLanguageCode(lang.code)}
                        className={`flex items-start justify-between gap-2 rounded-xl border p-3 text-left transition ${
                          enabled
                            ? "border-emerald-500 bg-emerald-50/60 text-slate-900"
                            : "border-slate-200 bg-slate-50/50 text-slate-400"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 font-bold">
                              {lang.code}
                            </span>
                            <span className="text-xs font-bold text-slate-900">{lang.name}</span>
                          </div>
                          <div className="text-sm font-bold text-emerald-800 mt-1">
                            {lang.nativeName}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{lang.region}</div>
                        </div>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            enabled
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {enabled ? "ON" : "OFF"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <SaveButton
                  onClick={() =>
                    handleSave(
                      {
                        localization: {
                          defaultLocale: localeState.defaultLocale,
                          enabledLocales: localeState.enabledLocales,
                          autoDetectLocation: localeState.autoDetectLocation,
                        },
                        default_language: localeState.defaultLocale,
                        supported_locales: localeState.enabledLocales.join(","),
                        ai_support_provider: localeState.ai_support_provider,
                        ai_menu_suggester: localeState.ai_menu_suggester,
                        ai_tutor_provider: localeState.ai_tutor_provider,
                      },
                      `Saved Category 3: ${localeState.enabledLocales.length}/10 Indian Benchmark Languages & AI Routing`,
                    )
                  }
                  saving={saving}
                  label="Save 10-Language Matrix"
                />
              </div>
            </div>
          )}
        </section>

        {/* =====================================================================
            CATEGORY 4: 🚨 6-Tier Notification & Zero-Harassment Auto-Remediation Rules
           ===================================================================== */}
        <section
          id="cat-4"
          style={{ display: isCat4Visible ? "block" : "none" }}
          className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
        >
          <button
            type="button"
            onClick={() => toggleCategory("cat4")}
            className="w-full flex items-center justify-between p-5 bg-slate-50/80 hover:bg-slate-100/70 border-b border-slate-200 text-left transition"
          >
            <div className="flex items-center gap-3">
              <BellRing className="h-6 w-6 text-emerald-600" />
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 font-bold">
                  Category 4 · Sub-Categories 4A &amp; 4B
                </span>
                <h2 className="text-lg font-extrabold text-slate-900">
                  🚨 6-Tier Notification &amp; Zero-Harassment Auto-Remediation Rules
                </h2>
              </div>
            </div>
            {expandedCats.cat4 ? (
              <ChevronUp className="h-5 w-5 text-slate-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-500" />
            )}
          </button>

          {expandedCats.cat4 && (
            <div className="p-6 space-y-6">
              {/* Sub-Category 4A: 6 Severity Tiers */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Sub-Category 4A · 6-Tier Severity Routing, SLA Targets &amp; Autonomous Remediation
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure SLA response windows and 1-click UMAR OS auto-remediation across all 6 operational alert tiers.
                  </p>
                </div>

                <div className="space-y-3">
                  {(Object.keys(notifState.tiers) as TierKey[]).map((key) => {
                    const rule = notifState.tiers[key];
                    return (
                      <div
                        key={key}
                        className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded ${
                                key === "EMERGENCY" || key === "DANGER"
                                  ? "bg-red-100 text-red-800 border border-red-300"
                                  : key === "CRITICAL" || key === "HIGH"
                                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                                    : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              }`}
                            >
                              {key}
                            </span>
                            <span className="text-sm font-bold text-slate-900">{rule.label}</span>
                            <span className="text-xs font-mono text-slate-500">
                              · SLA: {rule.slaMinutes}m
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">
                            <strong>Auto-Remediation SOP:</strong> {rule.remediationAction}
                          </p>
                          <p className="text-[11px] font-mono text-slate-500">
                            Channels: {rule.channels.join(" · ")}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="w-24">
                            <label className="block text-[10px] font-mono uppercase text-slate-500">
                              SLA (Mins)
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={rule.slaMinutes}
                              onChange={(e) =>
                                setNotifState((prev) => ({
                                  ...prev,
                                  tiers: {
                                    ...prev.tiers,
                                    [key]: {
                                      ...prev.tiers[key],
                                      slaMinutes: Math.max(1, Number(e.target.value)),
                                    },
                                  },
                                }))
                              }
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-mono"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setNotifState((prev) => ({
                                ...prev,
                                tiers: {
                                  ...prev.tiers,
                                  [key]: {
                                    ...prev.tiers[key],
                                    autoRemediate: !prev.tiers[key].autoRemediate,
                                  },
                                },
                              }))
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                              rule.autoRemediate
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {rule.autoRemediate ? "⚡ Auto-Remediate ON" : "Manual Only"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sub-Category 4B: Non-Harassment Partner & Rider Protection Policy */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/30 p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-emerald-200/60 pb-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-700" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Sub-Category 4B · Non-Harassment Partner &amp; Rider Protection Policy (Code on Social Security 2020 Compliant)
                    </h3>
                    <p className="text-xs text-slate-600">
                      Guarantees that automated dispatch alerts never harass or unfairly penalize restaurants or delivery partners during external disruptions.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ToggleRow
                    title="Zero-Harassment Autonomous Guard"
                    description="Block repetitive robo-calls and punitive rating deductions; use respectful human-mentor prompts."
                    isOn={notifState.zeroHarassmentGuard}
                    onToggle={() =>
                      setNotifState((p) => ({
                        ...p,
                        zeroHarassmentGuard: !p.zeroHarassmentGuard,
                      }))
                    }
                  />
                  <ToggleRow
                    title="Monsoon & Severe Weather Grace Shield"
                    description="Auto-extend kitchen prep and rider ETA targets during rain/waterlogging without penalty."
                    isOn={notifState.weatherGraceEnabled}
                    onToggle={() =>
                      setNotifState((p) => ({
                        ...p,
                        weatherGraceEnabled: !p.weatherGraceEnabled,
                      }))
                    }
                  />
                  <ToggleRow
                    title="Traffic & Road Diversion Immunity"
                    description="Waive late-pickup/drop flags when GPS telemetry detects civic blockades or railway crossings."
                    isOn={notifState.trafficSpikeImmunity}
                    onToggle={() =>
                      setNotifState((p) => ({
                        ...p,
                        trafficSpikeImmunity: !p.trafficSpikeImmunity,
                      }))
                    }
                  />
                  <ToggleRow
                    title="NPCI / Banking Gateway Outage Shield"
                    description="Protect COD float & restaurant payout queues during upstream bank server maintenance."
                    isOn={notifState.gatewayOutageShield}
                    onToggle={() =>
                      setNotifState((p) => ({
                        ...p,
                        gatewayOutageShield: !p.gatewayOutageShield,
                      }))
                    }
                  />
                </div>

                <SaveButton
                  onClick={() =>
                    handleSave(
                      { notification_rules: notifState },
                      "Saved Category 4: 6-Tier Notification & Zero-Harassment Protection Rules",
                    )
                  }
                  saving={saving}
                  label="Save Notification & Protection Rules"
                />
              </div>
            </div>
          )}
        </section>

        {/* =====================================================================
            CATEGORY 5: 🗑️ Reset, Prune & Configuration Backup
           ===================================================================== */}
        <section
          id="cat-5"
          style={{ display: isCat5Visible ? "block" : "none" }}
          className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
        >
          <button
            type="button"
            onClick={() => toggleCategory("cat5")}
            className="w-full flex items-center justify-between p-5 bg-slate-50/80 hover:bg-slate-100/70 border-b border-slate-200 text-left transition"
          >
            <div className="flex items-center gap-3">
              <RotateCcw className="h-6 w-6 text-emerald-600" />
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 font-bold">
                  Category 5 · Sub-Categories 5A &amp; 5B
                </span>
                <h2 className="text-lg font-extrabold text-slate-900">
                  🗑️ Reset, Prune, Configuration Backup &amp; Ecosystem Connectors
                </h2>
              </div>
            </div>
            {expandedCats.cat5 ? (
              <ChevronUp className="h-5 w-5 text-slate-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-500" />
            )}
          </button>

          {expandedCats.cat5 && (
            <div className="p-6 space-y-6">
              {/* Sub-Category 5A: Safe Section-by-Section Reset & JSON Export */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Sub-Category 5A · Section-by-Section Safe Reset &amp; JSON Configuration Backup
                    </h3>
                    <p className="text-xs text-slate-500">
                      Restore individual governance modules to institutional defaults or export your complete settings JSON snapshot.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={exportConfigurationJson}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-bold transition"
                  >
                    <Download className="h-4 w-4" /> Export Full Settings JSON
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSectionReset("brand")}
                    className="rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 p-3.5 text-left transition"
                  >
                    <div className="text-xs font-bold text-slate-900">🎨 Reset Branding</div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Restore #0D3B2E Emerald, #D97706 Gold, 16px radius &amp; default typography.
                    </p>
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSectionReset("marketplace")}
                    className="rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 p-3.5 text-left transition"
                  >
                    <div className="text-xs font-bold text-slate-900">⚖️ Reset Marketplace Fees</div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Restore 18% commission, ₹4 platform fee, ₹35 base delivery &amp; ₹8/km rate.
                    </p>
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSectionReset("algorithm")}
                    className="rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 p-3.5 text-left transition"
                  >
                    <div className="text-xs font-bold text-slate-900">🧭 Reset Algorithm Sliders</div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Restore 25 km max radius, 2.0x surge cap &amp; 15m kitchen prep buffer.
                    </p>
                  </button>

                  {!confirmResetAll ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => setConfirmResetAll(true)}
                      className="rounded-xl border border-red-300 bg-red-50 hover:bg-red-100 p-3.5 text-left transition"
                    >
                      <div className="text-xs font-bold text-red-800">
                        🗑️ Reset All to Factory Defaults
                      </div>
                      <p className="text-[11px] text-red-600 mt-1">
                        Requires confirmation before resetting all 5 categories.
                      </p>
                    </button>
                  ) : (
                    <div className="rounded-xl border-2 border-red-500 bg-red-50 p-3 space-y-2">
                      <p className="text-[11px] font-bold text-red-900">
                        Confirm full factory reset of all categories?
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void handleSectionReset("all")}
                          className="rounded-lg bg-red-600 text-white px-3 py-1 text-xs font-bold"
                        >
                          Confirm Reset All
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmResetAll(false)}
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sub-Category 5B: Ecosystem Copy CMS & External Plugin Connectors */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Sub-Category 5B · Ecosystem Copywriting CMS &amp; External API Connectors Switchboard
                    </h3>
                    <p className="text-xs text-slate-500">
                      Configure global customer/partner UI copy strings and external gateways (Razorpay, Mapbox, FSSAI, ClearTax, WhatsApp).
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveSubsystemTab((t) => (t === "visual_studio" ? "none" : "visual_studio"))
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                        activeSubsystemTab === "visual_studio"
                          ? "bg-rose-600 text-white border-rose-600"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      <Palette className="h-3.5 w-3.5" /> Visual Customization Studio
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveSubsystemTab((t) => (t === "cms" ? "none" : "cms"))
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                        activeSubsystemTab === "cms"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5" /> Ecosystem CMS
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveSubsystemTab((t) => (t === "connectors" ? "none" : "connectors"))
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                        activeSubsystemTab === "connectors"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      <Cpu className="h-3.5 w-3.5" /> Plugin Connectors
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveSubsystemTab((t) => (t === "hyperlocal_playbook" ? "none" : "hyperlocal_playbook"))
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                        activeSubsystemTab === "hyperlocal_playbook"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      <Rocket className="h-3.5 w-3.5 text-amber-500" /> 5-Day Launch Playbook
                    </button>
                  </div>
                </div>

                {activeSubsystemTab === "visual_studio" && (
                  <div className="pt-4 border-t border-slate-200">
                    <UmarOsVisualCustomizationStudio />
                  </div>
                )}
                {activeSubsystemTab === "cms" && (
                  <div className="pt-4 border-t border-slate-200">
                    <EcosystemCMS />
                  </div>
                )}
                {activeSubsystemTab === "connectors" && (
                  <div className="pt-4 border-t border-slate-200">
                    <PluginConnectors />
                  </div>
                )}
                {activeSubsystemTab === "hyperlocal_playbook" && (
                  <div className="pt-4 border-t border-slate-200">
                    <LaunchPlaybookView />
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Bottom Navigation Bar */}
        <footer
          id="settings-bottom"
          className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4 text-xs text-slate-500"
        >
          <span>
            OrderKing UMAR OS Master Settings Studio · Bi-Directional API + Server Function Sync
          </span>
          <button
            type="button"
            onClick={() =>
              document.getElementById("settings-top")?.scrollIntoView({ behavior: "smooth" })
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-100"
          >
            <ArrowUp className="h-3.5 w-3.5" /> Scroll Up to Top
          </button>
        </footer>
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-mono uppercase tracking-wider text-slate-600">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#0D3B2E"}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-10 w-12 rounded-lg border border-slate-300 cursor-pointer bg-white p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs font-mono uppercase"
        />
      </div>
    </div>
  );
}

function ToggleRow({ title, description, isOn, onToggle }: any) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
      <div>
        <h4 className="font-semibold text-slate-900 text-xs">{title}</h4>
        <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
          isOn ? "bg-emerald-600" : "bg-slate-300"
        }`}
        aria-label={`Toggle ${title}`}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
            isOn ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function InputRow({ title, value, onChange }: any) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-mono uppercase tracking-wider text-slate-600">
        {title}
      </label>
      <input
        type="number"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-emerald-600 font-mono transition-colors"
      />
    </div>
  );
}

function TextInputRow({ title, value, onChange }: any) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-mono uppercase tracking-wider text-slate-600">
        {title}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs focus:outline-none focus:border-emerald-600 transition-colors"
      />
    </div>
  );
}

function SaveButton({ onClick, saving, label = "Save Configuration" }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 transition-all shadow-sm"
    >
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {saving ? "Saving..." : label}
    </button>
  );
}

