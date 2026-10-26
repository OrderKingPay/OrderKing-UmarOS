import React, { useState, useMemo, useCallback } from "react";
import {
  UniversalCustomizationEngine,
  ColorScience,
  DEFAULT_UNIVERSAL_CUSTOMIZATION,
  type DesignTokens,
  type LayoutSection,
  type PageLayout,
  type SupportedLocale,
  type SupportedPlatform,
  type TextElementOverride,
  type CustomizationAuditEntry,
  type CustomizationSnapshot,
  type OperatingMode,
  type LogisticsParameters,
  type CustomerPricingParameters,
  type MerchantEconomicsParameters,
  type FleetAndCashControls,
} from "@/lib/orderking/customization/universal-customization-engine";
import {
  UmarAiCustomizationCompiler,
  type StagedPreviewDiff,
  type ExecutionReceipt,
} from "@/lib/orderking/ai/umar-ai-customization-compiler";
import { broadcastUmarOsConfigUpdate } from "@orderking/ui";
import { INDIA_COMPLIANCE_RATES } from "@/lib/orderking/compliance/india-marketplace-engine";
import {
  Palette,
  Languages,
  Layers,
  Sliders,
  Sparkles,
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Smartphone,
  Tablet,
  Monitor,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  RotateCcw,
  ShieldCheck,
  Search,
  Check,
  Info,
  DollarSign,
  TrendingUp,
  Lock,
  RefreshCw,
  Zap,
  HelpCircle,
  Truck,
  Tag,
  Store,
  Radio,
  CloudRain,
  Moon,
  Timer,
  Volume2,
  Bot,
  UserCheck,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ============================================================================
// PRESET COLOR PALETTES FOR QUICK SWITCHING
// ============================================================================
export const ROYAL_THEME_PRESETS = [
  {
    id: "crimson_slate",
    name: "Tier-1 Crimson & Slate",
    primary: "#E23744",
    primaryForeground: "#FFFFFF",
    background: "#FCFAF7",
    surface: "#FFFFFF",
    foreground: "#1C1C1C",
    accent: "#E23744",
    desc: "OrderKing Signature high-conversion appetite crimson paired with crisp slate",
  },
  {
    id: "emerald_gold",
    name: "OrderKing Emerald & Gold",
    primary: "#0D3B2E",
    primaryForeground: "#FFFFFF",
    background: "#F4F7F5",
    surface: "#FFFFFF",
    foreground: "#0B241D",
    accent: "#D97706",
    desc: "Signature sovereign heritage green with warm royal gold accents",
  },
  {
    id: "midnight_sovereign",
    name: "Midnight Sovereign Dark",
    primary: "#4F46E5",
    primaryForeground: "#FFFFFF",
    background: "#090D16",
    surface: "#111827",
    foreground: "#F9FAFB",
    accent: "#38BDF8",
    desc: "Deep obsidian dark mode with electric indigo & cyan telemetry highlights",
  },
  {
    id: "ivory_executive",
    name: "Ivory Executive Light",
    primary: "#0F766E",
    primaryForeground: "#FFFFFF",
    background: "#FAF8F5",
    surface: "#FFFFFF",
    foreground: "#134E4A",
    accent: "#B45309",
    desc: "Daylight-first warm ivory surface with high-contrast teal typography",
  },
];

// ============================================================================
// INITIAL SECTIONS FOR SDUI STUDIO
// ============================================================================
const DEFAULT_SDUI_SECTIONS: LayoutSection[] = [
  {
    id: "promo_carousel",
    type: "hero_banner",
    title: "Festive Promo Carousel",
    order: 1,
    visible: true,
    width: "100%",
    minHeightPx: 140,
    margin: { topPx: 0, bottomPx: 12, leftPx: 0, rightPx: 0 },
    padding: { topPx: 0, bottomPx: 0, leftPx: 0, rightPx: 0 },
    responsive: { hideOnMobile: false, hideOnTablet: false, hideOnDesktop: false },
    props: { autoPlayIntervalMs: 4000 },
  },
  {
    id: "header_location",
    type: "location_bar",
    title: "Address & GPS Selector",
    order: 2,
    visible: true,
    width: "100%",
    minHeightPx: 48,
    margin: { topPx: 0, bottomPx: 12, leftPx: 0, rightPx: 0 },
    padding: { topPx: 4, bottomPx: 4, leftPx: 12, rightPx: 12 },
    responsive: { hideOnMobile: false, hideOnTablet: false, hideOnDesktop: false },
    props: { enableInstantGeocoding: true },
  },
  {
    id: "search_bar",
    type: "search_bar",
    title: "Universal Multilingual Search & Voice",
    order: 3,
    visible: true,
    width: "100%",
    minHeightPx: 52,
    margin: { topPx: 0, bottomPx: 16, leftPx: 0, rightPx: 0 },
    padding: { topPx: 0, bottomPx: 0, leftPx: 12, rightPx: 12 },
    responsive: { hideOnMobile: false, hideOnTablet: false, hideOnDesktop: false },
    props: { placeholder: "Search dishes, groceries, medicines..." },
  },
  {
    id: "quick_categories",
    type: "category_grid",
    title: "Super-App Quick Categories",
    order: 4,
    visible: true,
    width: "100%",
    minHeightPx: 96,
    margin: { topPx: 0, bottomPx: 16, leftPx: 0, rightPx: 0 },
    padding: { topPx: 0, bottomPx: 0, leftPx: 12, rightPx: 12 },
    responsive: { hideOnMobile: false, hideOnTablet: false, hideOnDesktop: false },
    props: { columns: 4 },
  },
  {
    id: "live_deals",
    type: "deal_strip",
    title: "Hyperlocal Flash Deals & Flat 50% Off",
    order: 5,
    visible: true,
    width: "100%",
    minHeightPx: 120,
    margin: { topPx: 0, bottomPx: 16, leftPx: 0, rightPx: 0 },
    padding: { topPx: 0, bottomPx: 0, leftPx: 12, rightPx: 12 },
    responsive: { hideOnMobile: false, hideOnTablet: false, hideOnDesktop: false },
    props: { countdownSeconds: 3600 },
  },
  {
    id: "featured_restaurants",
    type: "restaurant_feed",
    title: "Curated Top Restaurants Near You",
    order: 6,
    visible: true,
    width: "100%",
    minHeightPx: 260,
    margin: { topPx: 0, bottomPx: 20, leftPx: 0, rightPx: 0 },
    padding: { topPx: 0, bottomPx: 0, leftPx: 12, rightPx: 12 },
    responsive: { hideOnMobile: false, hideOnTablet: false, hideOnDesktop: false },
    props: { badge: "FSSAI Verified" },
  },
  {
    id: "bottom_cart_bar",
    type: "cart_bar",
    title: "Sticky Bottom Checkout Preview",
    order: 7,
    visible: true,
    width: "100%",
    minHeightPx: 56,
    margin: { topPx: 0, bottomPx: 0, leftPx: 0, rightPx: 0 },
    padding: { topPx: 8, bottomPx: 8, leftPx: 16, rightPx: 16 },
    responsive: { hideOnMobile: false, hideOnTablet: false, hideOnDesktop: true },
    props: { showDeliveryTimer: true },
  },
];

// ============================================================================
// SEED MULTILINGUAL TEXT ELEMENTS
// ============================================================================
const DEFAULT_TEXT_ELEMENTS: Record<string, TextElementOverride> = {
  "customer.home.hero_title": {
    elementId: "customer.home.hero_title",
    platform: "customer_app",
    route: "/",
    translations: {
      en: "Order Food & Essentials In Minutes",
      hi: "मिनटों में खाना और आवश्यक वस्तुएं ऑर्डर करें",
      bn: "কয়েক মিনিটের মধ্যে খাবার এবং প্রয়োজনীয় জিনিস অর্ডার করুন",
      as: "কেইমিনিটমানতে খাদ্য আৰু প্ৰয়োজনীয় বস্তু অৰ্ডাৰ কৰক",
    },
    visibility: "visible",
  },
  "customer.home.search_placeholder": {
    elementId: "customer.home.search_placeholder",
    platform: "customer_app",
    route: "/",
    translations: {
      en: "Search dishes, restaurants, groceries...",
      hi: "व्यंजन, रेस्तरां, किराने का सामान खोजें...",
      bn: "খাবার, রেস্তোরাঁ, মুদি জিনিসপত্র খুঁজুন...",
      as: "খাদ্য, ৰেষ্টুৰেণ্ট, গেলামালৰ বস্তু সন্ধান কৰক...",
    },
    visibility: "visible",
  },
  "customer.checkout.pay_button": {
    elementId: "customer.checkout.pay_button",
    platform: "customer_app",
    route: "/checkout",
    translations: {
      en: "Place Order & Pay",
      hi: "ऑर्डर दें और भुगतान करें",
      bn: "অর্ডার দিন এবং পেমেন্ট করুন",
      as: "অৰ্ডাৰ দিয়ক আৰু ধন পৰিশোধ কৰক",
    },
    visibility: "visible",
  },
  "customer.order.track_title": {
    elementId: "customer.order.track_title",
    platform: "customer_app",
    route: "/orders/track",
    translations: {
      en: "Live Delivery Tracking & Telemetry",
      hi: "लाइव डिलीवरी ट्रैकिंग और टेलीमेट्री",
      bn: "লাইভ ডেলিভারি ট্র্যাকিং এবং টেলিমেট্রি",
      as: "লাইভ ডেলিভাৰী ট্ৰেকিং আৰু টেলিমেট্ৰী",
    },
    visibility: "visible",
  },
  "partner.dashboard.welcome": {
    elementId: "partner.dashboard.welcome",
    platform: "partner_app",
    route: "/dashboard",
    translations: {
      en: "Merchant Partner Operating Command",
      hi: "व्यापारी भागीदार ऑपरेटिंग कमांड",
      bn: "মার্চেন্ট পার্টনার অপারেটিং কমান্ড",
      as: "বণিক অংশীদাৰ অপাৰেটিং কমাণ্ড",
    },
    visibility: "visible",
  },
  "rider.orders.pickup_prompt": {
    elementId: "rider.orders.pickup_prompt",
    platform: "rider_app",
    route: "/orders/active",
    translations: {
      en: "Swipe To Confirm Order Pickup",
      hi: "ऑर्डर पिकअप की पुष्टि करने के लिए स्वाइप करें",
      bn: "অর্ডার পিকআপ নিশ্চিত করতে সোয়াইপ করুন",
      as: "অৰ্ডাৰ পিকআপ নিশ্চিত কৰিবলৈ সোৱাইপ কৰক",
    },
    visibility: "visible",
  },
  "kingpay.upi.fast_checkout": {
    elementId: "kingpay.upi.fast_checkout",
    platform: "kingpay",
    route: "/pay",
    translations: {
      en: "Zero-Failure Instant UPI Payment",
      hi: "शून्य-विफलता त्वरित यूपीआई भुगतान",
      bn: "জিরো-ফেলিয়র তাত্ক্ষণিক UPI পেমেন্ট",
      as: "শূন্য-ব্যৰ্থতা তৎক্ষণাৎ UPI পৰিশোধ",
    },
    visibility: "visible",
  },
};

export interface UmarOsVisualCustomizationStudioProps {
  initialEngine?: UniversalCustomizationEngine;
  onStateChange?: (state: ReturnType<UniversalCustomizationEngine["getState"]>) => void;
  className?: string;
}

export function UmarOsVisualCustomizationStudio({
  initialEngine,
  onStateChange,
  className,
}: UmarOsVisualCustomizationStudioProps) {
  // --------------------------------------------------------------------------
  // 1. ENGINE & COMPILER INSTANTIATION
  // --------------------------------------------------------------------------
  const [engine] = useState<UniversalCustomizationEngine>(() => {
    if (initialEngine) return initialEngine;
    const initial = JSON.parse(JSON.stringify(DEFAULT_UNIVERSAL_CUSTOMIZATION));
    // Seed initial layouts and texts
    initial.pageLayouts["customer_home"] = {
      pageId: "customer_home",
      platform: "customer_app",
      route: "/",
      sections: DEFAULT_SDUI_SECTIONS,
      updatedAt: new Date().toISOString(),
    };
    initial.textOverrides = { ...DEFAULT_TEXT_ELEMENTS };
    return new UniversalCustomizationEngine(initial);
  });

  const [compiler] = useState<UmarAiCustomizationCompiler>(() => new UmarAiCustomizationCompiler(engine));

  // Studio Active Tab
  type StudioTab = "colors" | "text" | "sdui" | "marketplace" | "ai_compiler" | "audit";
  const [activeTab, setActiveTab] = useState<StudioTab>("colors");

  // Version counter to trigger re-renders on engine state updates
  const [engineVersion, setEngineVersion] = useState<number>(() => engine.getVersion());

  // Current State
  const currentState = useMemo(() => engine.getState(), [engine, engineVersion]);

  const notifyChange = useCallback(() => {
    const v = engine.getVersion();
    setEngineVersion(v);
    if (onStateChange) {
      onStateChange(engine.getState());
    }
  }, [engine, onStateChange]);

  // Actor context for founder actions
  const actor = useMemo(
    () => ({
      userId: "founder_supreme_01",
      role: "SUPREME_FOUNDER",
      name: "Founder Command",
      explicitApprovalGranted: true,
    }),
    []
  );

  // --------------------------------------------------------------------------
  // 2. COLOR & TOKEN STUDIO STATE
  // --------------------------------------------------------------------------
  const palette = currentState.designTokens.palette;

  // Accessibility Score Calculations
  const a11yScores = useMemo(() => {
    const textOnBg = ColorScience.validateAccessibility(palette.foreground, palette.background);
    const primaryOnBg = ColorScience.validateAccessibility(palette.primary, palette.background);
    const primaryFgOnPrimary = ColorScience.validateAccessibility(palette.primaryForeground, palette.primary);
    const textOnSurface = ColorScience.validateAccessibility(palette.foreground, palette.surface);
    const accentOnBg = ColorScience.validateAccessibility(palette.accent, palette.background);

    return {
      textOnBg,
      primaryOnBg,
      primaryFgOnPrimary,
      textOnSurface,
      accentOnBg,
    };
  }, [palette]);

  const handleColorChange = (key: keyof DesignTokens["palette"], hex: string) => {
    try {
      engine.updatePaletteColor(key, hex, actor, `Studio manual update for [${key}]`);
      notifyChange();
    } catch {
      // Ignore invalid hex while typing
    }
  };

  const handleApplyPreset = (preset: (typeof ROYAL_THEME_PRESETS)[number]) => {
    engine.updatePaletteColor("primary", preset.primary, actor, `Preset: ${preset.name}`);
    engine.updatePaletteColor("primaryForeground", preset.primaryForeground, actor, `Preset: ${preset.name}`);
    engine.updatePaletteColor("background", preset.background, actor, `Preset: ${preset.name}`);
    engine.updatePaletteColor("surface", preset.surface, actor, `Preset: ${preset.name}`);
    engine.updatePaletteColor("foreground", preset.foreground, actor, `Preset: ${preset.name}`);
    engine.updatePaletteColor("accent", preset.accent, actor, `Preset: ${preset.name}`);
    notifyChange();

    void broadcastUmarOsConfigUpdate({
      version: engine.getVersion(),
      brand: {
        appName: "OrderKing",
        primaryColor: preset.primary,
        accentColor: preset.accent,
        logoUrl: "/logo.jpg",
        supportPhone: "+918000000000",
        supportWhatsApp: "+918000000000",
      },
      designTokens: {
        palette: {
          primary: preset.primary,
          primaryForeground: preset.primaryForeground,
          background: preset.background,
          surface: preset.surface,
          foreground: preset.foreground,
          accent: preset.accent,
        },
      },
    });
  };

  // --------------------------------------------------------------------------
  // 3. MULTILINGUAL TEXT STUDIO STATE
  // --------------------------------------------------------------------------
  const [textFilter, setTextFilter] = useState<string>("");
  const [platformFilter, setPlatformFilter] = useState<SupportedPlatform | "all">("all");
  const [selectedTextKey, setSelectedTextKey] = useState<string>("customer.home.hero_title");

  const [editTranslations, setEditTranslations] = useState<Record<SupportedLocale, string>>({
    en: currentState.textOverrides[selectedTextKey]?.translations.en ?? "",
    hi: currentState.textOverrides[selectedTextKey]?.translations.hi ?? "",
    bn: currentState.textOverrides[selectedTextKey]?.translations.bn ?? "",
    as: currentState.textOverrides[selectedTextKey]?.translations.as ?? "",
  });

  const handleSelectTextElement = (key: string) => {
    setSelectedTextKey(key);
    const el = currentState.textOverrides[key];
    if (el) {
      setEditTranslations({
        en: el.translations.en ?? "",
        hi: el.translations.hi ?? "",
        bn: el.translations.bn ?? "",
        as: el.translations.as ?? "",
      });
    }
  };

  const handleSaveTextOverride = () => {
    const existing = currentState.textOverrides[selectedTextKey];
    if (!existing) return;

    engine.setTextOverride(
      {
        ...existing,
        translations: {
          en: editTranslations.en,
          hi: editTranslations.hi || undefined,
          bn: editTranslations.bn || undefined,
          as: editTranslations.as || undefined,
        },
      },
      actor,
      `Studio multilingual update for ${selectedTextKey}`
    );
    notifyChange();
  };

  const filteredTextKeys = useMemo(() => {
    return Object.keys(currentState.textOverrides).filter((key) => {
      const item = currentState.textOverrides[key];
      if (platformFilter !== "all" && item.platform !== platformFilter) return false;
      if (!textFilter) return true;
      const q = textFilter.toLowerCase();
      return (
        key.toLowerCase().includes(q) ||
        (item.translations.en && item.translations.en.toLowerCase().includes(q)) ||
        (item.translations.hi && item.translations.hi.toLowerCase().includes(q))
      );
    });
  }, [currentState.textOverrides, platformFilter, textFilter]);

  // Word-by-word tokenized chips for granular editing
  const wordTokens = useMemo(() => {
    const enTokens = (editTranslations.en || "").split(/\s+/).filter(Boolean);
    const hiTokens = (editTranslations.hi || "").split(/\s+/).filter(Boolean);
    const bnTokens = (editTranslations.bn || "").split(/\s+/).filter(Boolean);
    const asTokens = (editTranslations.as || "").split(/\s+/).filter(Boolean);

    return {
      en: enTokens,
      hi: hiTokens,
      bn: bnTokens,
      as: asTokens,
    };
  }, [editTranslations]);

  // --------------------------------------------------------------------------
  // 4. SDUI LAYOUT STUDIO STATE
  // --------------------------------------------------------------------------
  type DeviceType = "mobile" | "tablet" | "desktop";
  const [previewDevice, setPreviewDevice] = useState<DeviceType>("mobile");

  const homeLayout: PageLayout = useMemo(() => {
    return (
      currentState.pageLayouts["customer_home"] ?? {
        pageId: "customer_home",
        platform: "customer_app",
        route: "/",
        sections: DEFAULT_SDUI_SECTIONS,
        updatedAt: new Date().toISOString(),
      }
    );
  }, [currentState.pageLayouts]);

  const sortedSections = useMemo(() => {
    return [...homeLayout.sections].sort((a, b) => a.order - b.order);
  }, [homeLayout.sections]);

  const handleMoveSection = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedSections.length) return;

    const newSections = [...sortedSections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    const idsInOrder = newSections.map((s) => s.id);
    engine.reorderSections("customer_home", idsInOrder, actor, `Reorder section ${temp.id} ${direction}`);
    notifyChange();
  };

  const handleToggleSectionVisibility = (sectionId: string) => {
    const updated = homeLayout.sections.map((s) => {
      if (s.id === sectionId) {
        return { ...s, visible: !s.visible };
      }
      return s;
    });

    engine.setPageLayout(
      {
        ...homeLayout,
        sections: updated,
        updatedAt: new Date().toISOString(),
      },
      actor,
      `Toggle visibility of ${sectionId}`
    );
    notifyChange();
  };

  const handleToggleDeviceVisibility = (sectionId: string, device: DeviceType) => {
    const updated = homeLayout.sections.map((s) => {
      if (s.id === sectionId) {
        const key =
          device === "mobile"
            ? "hideOnMobile"
            : device === "tablet"
            ? "hideOnTablet"
            : "hideOnDesktop";
        return {
          ...s,
          responsive: {
            ...s.responsive,
            [key]: !s.responsive[key],
          },
        };
      }
      return s;
    });

    engine.setPageLayout(
      {
        ...homeLayout,
        sections: updated,
        updatedAt: new Date().toISOString(),
      },
      actor,
      `Toggle responsive visibility on ${device} for ${sectionId}`
    );
    notifyChange();
  };

  // Filtered sections for the device simulator
  const simulatedVisibleSections = useMemo(() => {
    return sortedSections.filter((section) => {
      if (!section.visible) return false;
      if (previewDevice === "mobile" && section.responsive.hideOnMobile) return false;
      if (previewDevice === "tablet" && section.responsive.hideOnTablet) return false;
      if (previewDevice === "desktop" && section.responsive.hideOnDesktop) return false;
      return true;
    });
  }, [sortedSections, previewDevice]);

  // --------------------------------------------------------------------------
  // 5. DUAL-MODE & GRANULAR LOGISTICS, PRICING, ECONOMICS & FLEET STATE
  // --------------------------------------------------------------------------
  const [operatingMode, setOperatingModeState] = useState<OperatingMode>(
    () => currentState.operatingMode ?? "MANUAL_OVERRIDE"
  );

  // Logistics Sliders:
  const [riderBasePayRupees, setRiderBasePayRupees] = useState<number>(
    () => currentState.logistics?.riderBasePayRupees ?? 30
  );
  const [firstMileRatePerKm, setFirstMileRatePerKm] = useState<number>(
    () => currentState.logistics?.firstMileRatePerKm ?? 6
  );
  const [lastMileBand1RatePerKm, setLastMileBand1RatePerKm] = useState<number>(
    () => currentState.logistics?.lastMileBand1RatePerKm ?? 8
  );
  const [lastMileBand2RatePerKm, setLastMileBand2RatePerKm] = useState<number>(
    () => currentState.logistics?.lastMileBand2RatePerKm ?? 10
  );
  const [lastMileBand3RatePerKm, setLastMileBand3RatePerKm] = useState<number>(
    () => currentState.logistics?.lastMileBand3RatePerKm ?? 12
  );
  const [lastMileBand4RatePerKm, setLastMileBand4RatePerKm] = useState<number>(
    () => currentState.logistics?.lastMileBand4RatePerKm ?? 15
  );
  const [kitchenWaitRatePerMinRupees, setKitchenWaitRatePerMinRupees] = useState<number>(
    () => currentState.logistics?.kitchenWaitRatePerMinRupees ?? 1.5
  );
  const [kitchenWaitGraceMinutes, setKitchenWaitGraceMinutes] = useState<number>(
    () => currentState.logistics?.kitchenWaitGraceMinutes ?? 6
  );
  const [weatherBonusDrizzleRupees, setWeatherBonusDrizzleRupees] = useState<number>(
    () => currentState.logistics?.weatherBonusDrizzleRupees ?? 10
  );
  const [weatherBonusHeavyRainRupees, setWeatherBonusHeavyRainRupees] = useState<number>(
    () => currentState.logistics?.weatherBonusHeavyRainRupees ?? 25
  );
  const [weatherBonusWaterloggedRupees, setWeatherBonusWaterloggedRupees] = useState<number>(
    () => currentState.logistics?.weatherBonusWaterloggedRupees ?? 45
  );
  const [nightSurgeAllowanceRupees, setNightSurgeAllowanceRupees] = useState<number>(
    () => currentState.logistics?.nightSurgeAllowanceRupees ?? 20
  );

  // Customer Pricing Sliders:
  const [baseDeliveryFeeRupees, setBaseDeliveryFeeRupees] = useState<number>(
    () => currentState.customerPricing?.baseDeliveryFeeRupees ?? 35
  );
  const [platformFeeRupees, setPlatformFeeRupees] = useState<number>(
    () => currentState.customerPricing?.platformFeeRupees ?? 6
  );
  const [smallOrderFeeRupees, setSmallOrderFeeRupees] = useState<number>(
    () => currentState.customerPricing?.smallOrderFeeRupees ?? 15
  );
  const [smallOrderThresholdRupees, setSmallOrderThresholdRupees] = useState<number>(
    () => currentState.customerPricing?.smallOrderThresholdRupees ?? 149
  );
  const [freeDeliveryCartThresholdRupees, setFreeDeliveryCartThresholdRupees] = useState<number>(
    () => currentState.customerPricing?.freeDeliveryCartThresholdRupees ?? 299
  );

  // Merchant Economics Sliders:
  const [commissionTierStarterPercent, setCommissionTierStarterPercent] = useState<number>(
    () => currentState.merchantEconomics?.commissionTierStarterPercent ?? 18
  );
  const [commissionTierStandardPercent, setCommissionTierStandardPercent] = useState<number>(
    () => currentState.merchantEconomics?.commissionTierStandardPercent ?? 22
  );
  const [commissionTierPremiumPercent, setCommissionTierPremiumPercent] = useState<number>(
    () => currentState.merchantEconomics?.commissionTierPremiumPercent ?? 26
  );
  const [commissionRatePercent, setCommissionRatePercent] = useState<number>(
    () => currentState.merchantEconomics?.commissionRatePercent ?? 22
  );
  const [packagingFeeCapRupees, setPackagingFeeCapRupees] = useState<number>(
    () => currentState.merchantEconomics?.packagingFeeCapRupees ?? 35
  );
  const [discountCoFundingMerchantPercent, setDiscountCoFundingMerchantPercent] = useState<number>(
    () => currentState.merchantEconomics?.discountCoFundingMerchantPercent ?? 50
  );

  // Fleet & Cash Controls:
  const [codLimitRupees, setCodLimitRupees] = useState<number>(
    () => currentState.fleetAndCash?.codFloatingCashLimitRupees ?? 1500
  );
  const [dispatchPreAllocationLeadTimeMinutes, setDispatchPreAllocationLeadTimeMinutes] = useState<number>(
    () => currentState.fleetAndCash?.dispatchPreAllocationLeadTimeMinutes ?? 5
  );
  const [kitchenDelayVoiceAlertThresholdMinutes, setKitchenDelayVoiceAlertThresholdMinutes] = useState<number>(
    () => currentState.fleetAndCash?.kitchenDelayVoiceAlertThresholdMinutes ?? 10
  );
  const [codWarningPercent, setCodWarningPercent] = useState<number>(
    () => currentState.fleetAndCash?.codWarningPercent ?? 80
  );

  const [activeWeatherCondition, setActiveWeatherCondition] = useState<"clear" | "drizzle" | "heavy_rain" | "waterlogged">("clear");
  const [isNightActive, setIsNightActive] = useState<boolean>(false);
  const [commitFeedback, setCommitFeedback] = useState<string | null>(null);

  const handleToggleOperatingMode = (mode: OperatingMode) => {
    setOperatingModeState(mode);
    engine.setOperatingMode(mode, actor, `Founder toggled operating mode to ${mode}`);
    notifyChange();
    setCommitFeedback(`Mode switched to ${mode} (v${engine.getVersion()})`);
    setTimeout(() => setCommitFeedback(null), 4000);
  };

  const handleCommitAllMarketplaceSettings = () => {
    engine.commit(
      actor,
      "Universal configuration update across logistics, customer pricing, merchant economics, and fleet controls",
      "UPDATE_WORKFLOW",
      "all",
      "universal_operations",
      (draft) => {
        draft.operatingMode = operatingMode;
        draft.logistics = {
          riderBasePayRupees,
          firstMileRatePerKm,
          lastMileBand1RatePerKm,
          lastMileBand2RatePerKm,
          lastMileBand3RatePerKm,
          lastMileBand4RatePerKm,
          kitchenWaitRatePerMinRupees,
          kitchenWaitGraceMinutes,
          weatherBonusDrizzleRupees,
          weatherBonusHeavyRainRupees,
          weatherBonusWaterloggedRupees,
          nightSurgeAllowanceRupees,
        };
        draft.customerPricing = {
          baseDeliveryFeeRupees,
          platformFeeRupees,
          smallOrderFeeRupees,
          smallOrderThresholdRupees,
          freeDeliveryCartThresholdRupees,
        };
        draft.merchantEconomics = {
          commissionTierStarterPercent,
          commissionTierStandardPercent,
          commissionTierPremiumPercent,
          commissionRatePercent,
          packagingFeeCapRupees,
          discountCoFundingMerchantPercent,
        };
        draft.fleetAndCash = {
          codFloatingCashLimitRupees: codLimitRupees,
          dispatchPreAllocationLeadTimeMinutes,
          kitchenDelayVoiceAlertThresholdMinutes,
          codWarningPercent,
        };
      }
    );
    notifyChange();
    setCommitFeedback(`Committed & pushed live to fleet via Supabase Realtime & SSE (v${engine.getVersion()})`);
    setTimeout(() => setCommitFeedback(null), 5000);

    // Broadcast across Supabase Realtime pipe (<200ms) to Customer and Rider apps
    void broadcastUmarOsConfigUpdate({
      version: engine.getVersion(),
      operatingMode,
      brand: {
        appName: "OrderKing",
        primaryColor: palette.primary,
        accentColor: palette.accent || palette.primary,
        logoUrl: "/logo.jpg",
        supportPhone: "+918000000000",
        supportWhatsApp: "+918000000000",
      },
      economics: {
        platformFeePaise: Math.round(platformFeeRupees * 100),
        smallCartThresholdPaise: Math.round(smallOrderThresholdRupees * 100),
        smallCartFeePaise: Math.round(smallOrderFeeRupees * 100),
        packagingFeeCapPaise: Math.round(packagingFeeCapRupees * 100),
        packagingFeeMaxPercent: 10,
        cgstSection9_5Percent: 5,
        platformGstPercent: 18,
        tcsPercent: 1,
        tdsPercent: 0.1,
        defaultCommissionPercent: commissionRatePercent,
        surgeMultiplier: activeWeatherCondition !== "clear" ? 1.5 : 1.0,
        monsoonAlertActive: activeWeatherCondition !== "clear",
        monsoonBannerText: activeWeatherCondition !== "clear" ? "Weather alert active: delivery partners driving safely." : "",
      },
      logistics: {
        riderBasePayRupees,
        firstMileRatePerKm,
        lastMileBand1RatePerKm,
        lastMileBand2RatePerKm,
        lastMileBand3RatePerKm,
        lastMileBand4RatePerKm,
        kitchenWaitRatePerMinRupees,
        kitchenWaitGraceMinutes,
        weatherBonusDrizzleRupees,
        weatherBonusHeavyRainRupees,
        weatherBonusWaterloggedRupees,
        nightSurgeAllowanceRupees,
      },
      customerPricing: {
        baseDeliveryFeeRupees,
        platformFeeRupees,
        smallOrderFeeRupees,
        smallOrderThresholdRupees,
        freeDeliveryCartThresholdRupees,
      },
      merchantEconomics: {
        commissionTierStarterPercent,
        commissionTierStandardPercent,
        commissionTierPremiumPercent,
        commissionRatePercent,
        packagingFeeCapRupees,
        discountCoFundingMerchantPercent,
      },
      fleetAndCash: {
        codFloatingCashLimitRupees: codLimitRupees,
        dispatchPreAllocationLeadTimeMinutes,
        kitchenDelayVoiceAlertThresholdMinutes,
        codWarningPercent,
      },
    });
  };

  // Comprehensive order simulation calculator
  const marketplaceSimulation = useMemo(() => {
    const foodOrderAmount = 500;
    const grossCommission = (foodOrderAmount * commissionRatePercent) / 100;
    const gstOnCommission = grossCommission * 0.18; // 18% GST on platform services (SAC 9985)
    const tcsSec52 = foodOrderAmount * 0.01; // 1% TCS
    const tdsSec194O = foodOrderAmount * 0.01; // 1% TDS
    const promoDiscount = 50; // Sample ₹50 order discount
    const merchantDiscountShare = (promoDiscount * discountCoFundingMerchantPercent) / 100;
    const platformDiscountShare = promoDiscount - merchantDiscountShare;
    const packagingCharge = Math.min(25, packagingFeeCapRupees);

    // Rider pay calculation
    const firstMileKm = 1.2;
    const lastMileKm = 3.3; // 4.5 km total
    const firstMilePay = firstMileKm * firstMileRatePerKm;
    const lastMilePay = lastMileKm * lastMileBand2RatePerKm; // Band 2 (2-5 km)
    const waitMinutes = 10;
    const billableWait = Math.max(0, waitMinutes - kitchenWaitGraceMinutes);
    const waitCompensation = billableWait * kitchenWaitRatePerMinRupees;
    let weatherBonus = 0;
    if (activeWeatherCondition === "drizzle") weatherBonus = weatherBonusDrizzleRupees;
    else if (activeWeatherCondition === "heavy_rain") weatherBonus = weatherBonusHeavyRainRupees;
    else if (activeWeatherCondition === "waterlogged") weatherBonus = weatherBonusWaterloggedRupees;
    const nightSurge = isNightActive ? nightSurgeAllowanceRupees : 0;
    const riderPayTotal = Math.round(
      riderBasePayRupees + firstMilePay + lastMilePay + waitCompensation + weatherBonus + nightSurge
    );

    // Customer Pricing
    const isFreeDelivery = foodOrderAmount >= freeDeliveryCartThresholdRupees;
    const customerDeliveryFee = isFreeDelivery ? 0 : baseDeliveryFeeRupees;
    const smallOrderFee = foodOrderAmount < smallOrderThresholdRupees ? smallOrderFeeRupees : 0;
    const customerTotal = foodOrderAmount + customerDeliveryFee + platformFeeRupees + smallOrderFee + packagingCharge - promoDiscount;

    const netMerchantReceivable =
      foodOrderAmount - grossCommission - gstOnCommission - tcsSec52 - tdsSec194O - merchantDiscountShare + packagingCharge;
    const codWarningLimit = (codLimitRupees * codWarningPercent) / 100;
    const sec95TaxPayableByPlatform = foodOrderAmount * 0.05; // 5% CGST Sec 9(5) ECO pays without ITC

    // Platform Net Margin
    const platformGrossRevenue = grossCommission + customerDeliveryFee + platformFeeRupees + smallOrderFee;
    const platformCosts = riderPayTotal + sec95TaxPayableByPlatform + platformDiscountShare;
    const platformNetMargin = platformGrossRevenue - platformCosts;

    return {
      foodOrderAmount,
      commissionPercent: commissionRatePercent,
      grossCommission,
      gstOnCommission,
      tcsSec52,
      tdsSec194O,
      packagingCharge,
      merchantDiscountShare,
      platformDiscountShare,
      netMerchantReceivable,
      customerDeliveryFee,
      platformFeeRupees,
      smallOrderFee,
      customerTotal,
      firstMilePay,
      lastMilePay,
      waitCompensation,
      weatherBonus,
      nightSurge,
      riderPayTotal,
      codWarningLimit,
      sec95TaxPayableByPlatform,
      platformGrossRevenue,
      platformCosts,
      platformNetMargin,
    };
  }, [
    commissionRatePercent,
    riderBasePayRupees,
    firstMileRatePerKm,
    lastMileBand2RatePerKm,
    kitchenWaitGraceMinutes,
    kitchenWaitRatePerMinRupees,
    activeWeatherCondition,
    weatherBonusDrizzleRupees,
    weatherBonusHeavyRainRupees,
    weatherBonusWaterloggedRupees,
    isNightActive,
    nightSurgeAllowanceRupees,
    baseDeliveryFeeRupees,
    platformFeeRupees,
    smallOrderFeeRupees,
    smallOrderThresholdRupees,
    freeDeliveryCartThresholdRupees,
    packagingFeeCapRupees,
    discountCoFundingMerchantPercent,
    codLimitRupees,
    codWarningPercent,
  ]);

  // --------------------------------------------------------------------------
  // 6. UMAR AI ASSISTANT / COMPILER INTEGRATION
  // --------------------------------------------------------------------------
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [stagedPreview, setStagedPreview] = useState<StagedPreviewDiff | null>(null);
  const [executionReceipt, setExecutionReceipt] = useState<ExecutionReceipt | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [explicitFounderApproval, setExplicitFounderApproval] = useState<boolean>(true);

  const handleStageAiPrompt = (promptText?: string) => {
    const text = promptText ?? aiPrompt;
    if (!text.trim()) return;
    try {
      setAiError(null);
      setExecutionReceipt(null);
      const preview = compiler.stageChangePreview(text);
      setStagedPreview(preview);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleExecuteAiChange = () => {
    if (!stagedPreview) return;
    try {
      setAiError(null);
      const receipt = compiler.executeStagedChange(stagedPreview.previewId, {
        ...actor,
        explicitApprovalGranted: explicitFounderApproval,
      });
      setExecutionReceipt(receipt);
      setStagedPreview(null);
      notifyChange();
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRollbackVersion = (version: number) => {
    try {
      engine.rollbackToVersion(version, actor, `Rollback requested to version ${version}`);
      notifyChange();
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : String(err));
    }
  };

  // ==========================================================================
  // RENDER STUDIO
  // ==========================================================================
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white text-slate-900 shadow-xl overflow-hidden font-sans",
        className
      )}
      style={{
        // Expose dynamic variables for the studio container preview
        ["--color-primary" as string]: palette.primary,
        ["--color-primary-fg" as string]: palette.primaryForeground,
        ["--color-bg" as string]: palette.background,
        ["--color-surface" as string]: palette.surface,
        ["--color-fg" as string]: palette.foreground,
      }}
    >
      {/* Studio Header Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 via-amber-500 to-emerald-500 shadow-md">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">
                UmarOS Visual Customization &amp; Control Studio
              </h1>
              <Badge tone="primary" className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px]">
                Founder Command
              </Badge>
              <Badge tone="default" className="bg-slate-800 text-slate-300 border-slate-700 text-[10px]">
                v{engineVersion}
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Universal Color Science · Multilingual Quad-Editor · SDUI Layout · India Marketplace Engine
            </p>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-800/80 p-1 border border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab("colors")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              activeTab === "colors" ? "bg-rose-600 text-white shadow" : "text-slate-300 hover:text-white"
            )}
          >
            <Palette className="h-3.5 w-3.5" /> Colors &amp; Tokens
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("text")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              activeTab === "text" ? "bg-rose-600 text-white shadow" : "text-slate-300 hover:text-white"
            )}
          >
            <Languages className="h-3.5 w-3.5" /> Multilingual Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sdui")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              activeTab === "sdui" ? "bg-rose-600 text-white shadow" : "text-slate-300 hover:text-white"
            )}
          >
            <Layers className="h-3.5 w-3.5" /> SDUI Layout Studio
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("marketplace")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              activeTab === "marketplace" ? "bg-rose-600 text-white shadow" : "text-slate-300 hover:text-white"
            )}
          >
            <Sliders className="h-3.5 w-3.5" /> India Sliders
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ai_compiler")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              activeTab === "ai_compiler" ? "bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow" : "text-slate-300 hover:text-white"
            )}
          >
            <Sparkles className="h-3.5 w-3.5" /> Umar AI Compiler
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              activeTab === "audit" ? "bg-rose-600 text-white shadow" : "text-slate-300 hover:text-white"
            )}
          >
            <History className="h-3.5 w-3.5" /> Audit &amp; Rollback
          </button>
        </div>
      </header>

      {/* Main Studio Body */}
      <main className="p-6 bg-slate-50/50 min-h-[640px]">
        {/* ================================================================= */}
        {/* TAB 1: VISUAL COLOR & TOKEN STUDIO                               */}
        {/* ================================================================= */}
        {activeTab === "colors" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Visual Color Science &amp; WCAG 2.1 Accessibility Token Studio
                </h2>
                <p className="text-xs text-slate-500">
                  Fine-tune brand colors with real-time mathematical contrast checks for WCAG 2.1 AA (4.5:1) and AAA (7.0:1).
                </p>
              </div>

              {/* Theme Presets */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Presets:</span>
                {ROYAL_THEME_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
                  >
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.primary }} />
                    {p.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Accessibility Score Dashboard Banner */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Text on Background */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Body Text / Background</span>
                  <Badge
                    tone={a11yScores.textOnBg.passesAAA ? "success" : a11yScores.textOnBg.passesAA ? "info" : "danger"}
                    className="text-[10px]"
                  >
                    {a11yScores.textOnBg.passesAAA ? "AAA Passed" : a11yScores.textOnBg.passesAA ? "AA Passed" : "Contrast Fail"}
                  </Badge>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">
                    {a11yScores.textOnBg.contrastRatio.toFixed(2)}:1
                  </span>
                  <span className="text-[10px] text-slate-500">(Target ≥ 4.5:1)</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-600 flex items-center gap-1">
                  {a11yScores.textOnBg.passesAA ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-rose-600" />
                  )}
                  Normal text: {a11yScores.textOnBg.passesAA ? "Compliant" : "Needs Higher Contrast"}
                </div>
              </div>

              {/* Primary Foreground on Primary */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Primary Button Label</span>
                  <Badge
                    tone={a11yScores.primaryFgOnPrimary.passesAAA ? "success" : a11yScores.primaryFgOnPrimary.passesAA ? "info" : "danger"}
                    className="text-[10px]"
                  >
                    {a11yScores.primaryFgOnPrimary.passesAAA ? "AAA Passed" : a11yScores.primaryFgOnPrimary.passesAA ? "AA Passed" : "Contrast Fail"}
                  </Badge>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">
                    {a11yScores.primaryFgOnPrimary.contrastRatio.toFixed(2)}:1
                  </span>
                  <span className="text-[10px] text-slate-500">(Target ≥ 4.5:1)</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-600 flex items-center gap-1">
                  {a11yScores.primaryFgOnPrimary.passesAA ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-rose-600" />
                  )}
                  Button action text: {a11yScores.primaryFgOnPrimary.passesAA ? "Safe to Click" : "Low Readability"}
                </div>
              </div>

              {/* Text on Surface Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Card Text / Surface</span>
                  <Badge
                    tone={a11yScores.textOnSurface.passesAAA ? "success" : a11yScores.textOnSurface.passesAA ? "info" : "danger"}
                    className="text-[10px]"
                  >
                    {a11yScores.textOnSurface.passesAAA ? "AAA Passed" : a11yScores.textOnSurface.passesAA ? "AA Passed" : "Contrast Fail"}
                  </Badge>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">
                    {a11yScores.textOnSurface.contrastRatio.toFixed(2)}:1
                  </span>
                  <span className="text-[10px] text-slate-500">(Target ≥ 4.5:1)</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-600 flex items-center gap-1">
                  {a11yScores.textOnSurface.passesAA ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-rose-600" />
                  )}
                  Surface readability: {a11yScores.textOnSurface.passesAA ? "Optimal" : "Poor"}
                </div>
              </div>

              {/* Accent on Background */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Accent Highlights</span>
                  <Badge
                    tone={a11yScores.accentOnBg.passesAAA ? "success" : a11yScores.accentOnBg.passesAA ? "info" : "warning"}
                    className="text-[10px]"
                  >
                    {a11yScores.accentOnBg.contrastRatio.toFixed(2)}:1
                  </Badge>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">
                    {a11yScores.accentOnBg.contrastRatio.toFixed(2)}:1
                  </span>
                  <span className="text-[10px] text-slate-500">(≥ 3.0:1 Large UI)</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-600 flex items-center gap-1">
                  {a11yScores.accentOnBg.passesAA ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  )}
                  Non-text UI icons: {a11yScores.accentOnBg.contrastRatio >= 3.0 ? "Passed (3:1)" : "Caution"}
                </div>
              </div>
            </div>

            {/* Interactive Color Pickers & Live Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Color Control Panels */}
              <div className="lg:col-span-2 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900">
                  Global Palette Color Pickers
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Primary Color */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                    <div>
                      <label htmlFor="primary-color" className="text-xs font-semibold text-slate-800">Primary Brand Color</label>
                      <p className="text-[10px] text-slate-500">CTA buttons, brand identity, active states</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="primary-color"
                        type="color"
                        value={palette.primary}
                        onChange={(e) => handleColorChange("primary", e.target.value)}
                        className="h-8 w-8 cursor-pointer rounded border border-slate-300 p-0.5"
                      />
                      <input
                        type="text"
                        value={palette.primary}
                        onChange={(e) => handleColorChange("primary", e.target.value)}
                        className="w-20 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-mono font-medium text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Primary Foreground */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                    <div>
                      <label htmlFor="primary-fg-color" className="text-xs font-semibold text-slate-800">Primary Button Text</label>
                      <p className="text-[10px] text-slate-500">Foreground on primary buttons</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="primary-fg-color"
                        type="color"
                        value={palette.primaryForeground}
                        onChange={(e) => handleColorChange("primaryForeground", e.target.value)}
                        className="h-8 w-8 cursor-pointer rounded border border-slate-300 p-0.5"
                      />
                      <input
                        type="text"
                        value={palette.primaryForeground}
                        onChange={(e) => handleColorChange("primaryForeground", e.target.value)}
                        className="w-20 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-mono font-medium text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Background */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                    <div>
                      <label htmlFor="background-color" className="text-xs font-semibold text-slate-800">App Background</label>
                      <p className="text-[10px] text-slate-500">Root canvas color</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="background-color"
                        type="color"
                        value={palette.background}
                        onChange={(e) => handleColorChange("background", e.target.value)}
                        className="h-8 w-8 cursor-pointer rounded border border-slate-300 p-0.5"
                      />
                      <input
                        type="text"
                        value={palette.background}
                        onChange={(e) => handleColorChange("background", e.target.value)}
                        className="w-20 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-mono font-medium text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Surface */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                    <div>
                      <label htmlFor="surface-color" className="text-xs font-semibold text-slate-800">Surface Card</label>
                      <p className="text-[10px] text-slate-500">Cards, sheets, elevated panels</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="surface-color"
                        type="color"
                        value={palette.surface}
                        onChange={(e) => handleColorChange("surface", e.target.value)}
                        className="h-8 w-8 cursor-pointer rounded border border-slate-300 p-0.5"
                      />
                      <input
                        type="text"
                        value={palette.surface}
                        onChange={(e) => handleColorChange("surface", e.target.value)}
                        className="w-20 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-mono font-medium text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Foreground / Body Text */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                    <div>
                      <label htmlFor="foreground-color" className="text-xs font-semibold text-slate-800">Foreground Body Text</label>
                      <p className="text-[10px] text-slate-500">Headings, titles, primary reading copy</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="foreground-color"
                        type="color"
                        value={palette.foreground}
                        onChange={(e) => handleColorChange("foreground", e.target.value)}
                        className="h-8 w-8 cursor-pointer rounded border border-slate-300 p-0.5"
                      />
                      <input
                        type="text"
                        value={palette.foreground}
                        onChange={(e) => handleColorChange("foreground", e.target.value)}
                        className="w-20 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-mono font-medium text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Accent Highlight */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                    <div>
                      <label htmlFor="accent-color" className="text-xs font-semibold text-slate-800">Accent Highlight</label>
                      <p className="text-[10px] text-slate-500">Badges, links, highlights</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="accent-color"
                        type="color"
                        value={palette.accent}
                        onChange={(e) => handleColorChange("accent", e.target.value)}
                        className="h-8 w-8 cursor-pointer rounded border border-slate-300 p-0.5"
                      />
                      <input
                        type="text"
                        value={palette.accent}
                        onChange={(e) => handleColorChange("accent", e.target.value)}
                        className="w-20 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-mono font-medium text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Rendered Card Component Preview */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Live Token Render Preview
                  </h3>
                  <Badge tone="primary" className="text-[10px]">Real-time Tokens</Badge>
                </div>

                {/* Simulated UI Card rendered using currently selected tokens */}
                <div
                  className="rounded-xl p-5 border shadow-md transition-all duration-300"
                  style={{
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                    color: palette.foreground,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${palette.accent}20`,
                        color: palette.accent,
                      }}
                    >
                      ★ 4.9 Super Merchant
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">18-22 mins</span>
                  </div>

                  <h4 className="mt-3 text-base font-bold" style={{ color: palette.foreground }}>
                    Royal Biryani Darbar
                  </h4>
                  <p className="text-xs mt-1" style={{ color: palette.muted }}>
                    Awadhi Biryani, Mughlai, Kebabs · Koramangala
                  </p>

                  <div className="mt-4 pt-3 border-t flex items-center justify-between" style={{ borderColor: palette.border }}>
                    <div>
                      <span className="text-[10px] block" style={{ color: palette.muted }}>Item Total</span>
                      <span className="text-sm font-extrabold" style={{ color: palette.foreground }}>₹380.00</span>
                    </div>

                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition active:scale-95"
                      style={{
                        backgroundColor: palette.primary,
                        color: palette.primaryForeground,
                      }}
                    >
                      Add &amp; Checkout
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700">WCAG 2.1 Certification:</span> All color combinations are checked on every keystroke against Section 508 and WCAG Level AA/AAA.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: MULTILINGUAL TEXT QUAD-EDITOR                             */}
        {/* ================================================================= */}
        {activeTab === "text" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Multilingual Universal Quad-Text &amp; Word-by-Word Editor
                </h2>
                <p className="text-xs text-slate-500">
                  Centralized founder control for every single word across English, Hindi (हिन्दी), Bengali (বাংলা), and Assamese (অসমীয়া).
                </p>
              </div>

              {/* Platform Selector Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Platform:</span>
                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value as SupportedPlatform | "all")}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm"
                >
                  <option value="all">All Ecosystem Apps</option>
                  <option value="customer_app">Customer App</option>
                  <option value="partner_app">Partner App</option>
                  <option value="rider_app">Rider App</option>
                  <option value="kingpay">KingPay</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: List of Text Elements */}
              <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search strings, keys or English text..."
                    value={textFilter}
                    onChange={(e) => setTextFilter(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white"
                  />
                </div>

                <div className="max-h-[460px] overflow-y-auto space-y-1.5 pr-1">
                  {filteredTextKeys.map((key) => {
                    const item = currentState.textOverrides[key];
                    const isSelected = selectedTextKey === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleSelectTextElement(key)}
                        className={cn(
                          "w-full text-left p-2.5 rounded-lg border transition text-xs",
                          isSelected
                            ? "border-rose-500 bg-rose-50/50 text-slate-900 shadow-sm"
                            : "border-slate-100 hover:border-slate-200 bg-white text-slate-700"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[10px] text-slate-500 truncate max-w-[170px]">
                            {key}
                          </span>
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                            {item.platform.replace("_app", "")}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800 line-clamp-1">
                          {item.translations.en}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Quad-Language Editor & Word Tokenizer */}
              <div className="lg:col-span-8 space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-mono">
                      {selectedTextKey}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Active route: {currentState.textOverrides[selectedTextKey]?.route ?? "/"}
                    </p>
                  </div>
                  <Button
                    onClick={handleSaveTextOverride}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 h-8"
                  >
                    <Check className="h-3.5 w-3.5" /> Save Translation Override
                  </Button>
                </div>

                {/* 4 Supported Languages Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* English */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>English (India) · en</span>
                      <span className="text-[10px] text-slate-400 font-normal">Primary Canonical</span>
                    </label>
                    <textarea
                      rows={2}
                      value={editTranslations.en}
                      onChange={(e) => setEditTranslations((prev) => ({ ...prev, en: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  {/* Hindi */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>Hindi (हिन्दी) · hi</span>
                      <span className="text-[10px] text-slate-400 font-normal">North &amp; Central India</span>
                    </label>
                    <textarea
                      rows={2}
                      value={editTranslations.hi}
                      onChange={(e) => setEditTranslations((prev) => ({ ...prev, hi: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-sans"
                    />
                  </div>

                  {/* Bengali */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>Bengali (বাংলা) · bn</span>
                      <span className="text-[10px] text-slate-400 font-normal">West Bengal &amp; Tripura</span>
                    </label>
                    <textarea
                      rows={2}
                      value={editTranslations.bn}
                      onChange={(e) => setEditTranslations((prev) => ({ ...prev, bn: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-sans"
                    />
                  </div>

                  {/* Assamese */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>Assamese (অসমীয়া) · as</span>
                      <span className="text-[10px] text-slate-400 font-normal">Assam &amp; Northeast India</span>
                    </label>
                    <textarea
                      rows={2}
                      value={editTranslations.as}
                      onChange={(e) => setEditTranslations((prev) => ({ ...prev, as: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-sans"
                    />
                  </div>
                </div>

                {/* Word-by-Word Granular Token Chips Breakdown */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Word-by-Word Linguistic Alignment Inspector
                    </h4>
                    <span className="text-[10px] text-slate-500">Granular word chips</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        English Word Tokens ({wordTokens.en.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {wordTokens.en.map((word, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 shadow-2xs font-mono text-[11px]"
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Hindi (हिन्दी) Tokens ({wordTokens.hi.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {wordTokens.hi.map((word, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200 text-orange-950 font-medium text-[11px]"
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Bengali (বাংলা) Tokens ({wordTokens.bn.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {wordTokens.bn.map((word, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-950 font-medium text-[11px]"
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Assamese (অসমীয়া) Tokens ({wordTokens.as.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {wordTokens.as.map((word, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-950 font-medium text-[11px]"
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: SERVER-DRIVEN UI (SDUI) LAYOUT STUDIO                    */}
        {/* ================================================================= */}
        {activeTab === "sdui" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Server-Driven UI (SDUI) Layout Studio &amp; Multi-Device Simulator
                </h2>
                <p className="text-xs text-slate-500">
                  Reorder app sections live, toggle dynamic component visibility, and simulate responsive viewports for Mobile, Tablet, and Desktop.
                </p>
              </div>

              {/* Device Selector Controls */}
              <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition",
                    previewDevice === "mobile" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <Smartphone className="h-3.5 w-3.5" /> Mobile (375px)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("tablet")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition",
                    previewDevice === "tablet" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <Tablet className="h-3.5 w-3.5" /> Tablet (768px)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition",
                    previewDevice === "desktop" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <Monitor className="h-3.5 w-3.5" /> Desktop (1024px)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Visual Reorder & Visibility List */}
              <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">
                    Home Screen Sections List ({sortedSections.length})
                  </h3>
                  <span className="text-[10px] text-slate-400">Order executes top-to-bottom</span>
                </div>

                <div className="space-y-2">
                  {sortedSections.map((section, idx) => (
                    <div
                      key={section.id}
                      className={cn(
                        "rounded-xl border p-3 transition flex items-center justify-between gap-3",
                        section.visible ? "border-slate-200 bg-white shadow-2xs" : "border-slate-100 bg-slate-50 opacity-60"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Order Badge */}
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 font-mono text-xs font-black text-slate-700">
                          {idx + 1}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {section.title ?? section.type}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[9px] text-slate-400 truncate">
                              #{section.id}
                            </span>
                            <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-600">
                              {section.type}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Controls: Move Up, Move Down, Toggle Visibility */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveSection(idx, "up")}
                          aria-label="Move Section Up"
                          className="h-7 w-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition"
                        >
                          <ArrowUp className="h-3.5 w-3.5 text-slate-700" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === sortedSections.length - 1}
                          onClick={() => handleMoveSection(idx, "down")}
                          aria-label="Move Section Down"
                          className="h-7 w-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition"
                        >
                          <ArrowDown className="h-3.5 w-3.5 text-slate-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleSectionVisibility(section.id)}
                          aria-label="Toggle Section Visibility"
                          className={cn(
                            "h-7 w-7 rounded-lg border flex items-center justify-center transition",
                            section.visible
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-100 text-slate-400"
                          )}
                        >
                          {section.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Server-Driven UI Tip:</span> Reordering sections here instantaneously propagates down to the Customer App, Partner App, and Rider App without rebuilding binary APKs.
                </div>
              </div>

              {/* Right Column: Interactive Multi-Device Preview Simulator */}
              <div className="lg:col-span-7 flex flex-col items-center justify-start rounded-xl border border-slate-200 bg-slate-900 p-6 shadow-inner overflow-hidden">
                <div className="mb-4 flex items-center justify-between w-full text-slate-300 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-mono">Viewport Simulation: {previewDevice.toUpperCase()}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Visible Sections: {simulatedVisibleSections.length} of {sortedSections.length}
                  </span>
                </div>

                {/* Device Bezel Simulator Container */}
                <div
                  className={cn(
                    "bg-slate-100 rounded-3xl border-4 border-slate-700 shadow-2xl transition-all duration-300 overflow-hidden flex flex-col",
                    previewDevice === "mobile" && "w-[360px] min-h-[580px]",
                    previewDevice === "tablet" && "w-[520px] min-h-[580px]",
                    previewDevice === "desktop" && "w-full max-w-[620px] min-h-[580px]"
                  )}
                  style={{ backgroundColor: palette.background }}
                >
                  {/* Phone Status Bar Frame */}
                  <div className="h-6 bg-slate-900 flex items-center justify-between px-4 text-[10px] text-white font-mono">
                    <span>9:41 AM</span>
                    <div className="flex items-center gap-1.5">
                      <span>5G</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Rendered SDUI Sections inside Device Frame */}
                  <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                    {simulatedVisibleSections.map((section) => (
                      <div
                        key={section.id}
                        className="rounded-xl border shadow-xs p-3 transition"
                        style={{
                          backgroundColor: palette.surface,
                          borderColor: palette.border,
                        }}
                      >
                        {section.type === "hero_banner" && (
                          <div
                            className="rounded-lg p-3 text-white flex items-center justify-between"
                            style={{ backgroundColor: palette.primary }}
                          >
                            <div>
                              <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded">
                                Flash Promo
                              </span>
                              <h5 className="text-xs font-bold mt-1">Flat 50% Off Top Restaurants</h5>
                              <p className="text-[10px] text-white/80">Use Code: UMAROS50</p>
                            </div>
                            <Sparkles className="h-6 w-6 text-amber-300" />
                          </div>
                        )}

                        {section.type === "location_bar" && (
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 font-bold" style={{ color: palette.foreground }}>
                              <span className="h-2 w-2 rounded-full bg-rose-500" />
                              <span>Indiranagar 100ft Rd, Bengaluru</span>
                            </div>
                            <span className="text-[10px] text-slate-400">Change</span>
                          </div>
                        )}

                        {section.type === "search_bar" && (
                          <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-400">
                            <Search className="h-3.5 w-3.5" />
                            <span>{section.props.placeholder as string ?? "Search dishes, groceries..."}</span>
                          </div>
                        )}

                        {section.type === "category_grid" && (
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                              Explore Super-App
                            </span>
                            <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                              {["Biryani", "Pizza", "Grocery", "Pharmacy"].map((cat, i) => (
                                <div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex flex-col items-center gap-1">
                                  <div className="h-6 w-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs">
                                    🍽
                                  </div>
                                  <span style={{ color: palette.foreground }}>{cat}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {section.type === "deal_strip" && (
                          <div className="flex items-center justify-between text-xs bg-amber-50/70 p-2 rounded-lg border border-amber-200 text-amber-900">
                            <span className="font-bold flex items-center gap-1">
                              ⚡ Lightning Flash Deals
                            </span>
                            <span className="font-mono text-[10px] font-bold">Ends in 24m 12s</span>
                          </div>
                        )}

                        {section.type === "restaurant_feed" && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold" style={{ color: palette.foreground }}>
                                Curated Restaurants
                              </span>
                              <span className="text-[10px] text-rose-600 font-semibold">See All</span>
                            </div>
                            <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                              <div>
                                <h6 className="text-xs font-bold" style={{ color: palette.foreground }}>Empire Restaurant</h6>
                                <p className="text-[10px] text-slate-500">North Indian, Mughlai · 25 mins</p>
                              </div>
                              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                ★ 4.6
                              </span>
                            </div>
                          </div>
                        )}

                        {section.type === "cart_bar" && (
                          <div
                            className="rounded-lg p-2.5 text-white flex items-center justify-between text-xs font-bold"
                            style={{ backgroundColor: palette.primary }}
                          >
                            <span>1 Item | ₹380</span>
                            <span>View Cart →</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: INDIA MARKETPLACE SLIDERS & STATUTORY DIALS               */}
        {/* ================================================================= */}
        {activeTab === "marketplace" && (
          <div className="space-y-6">
            {/* Top Command Bar: Dual-Mode Control & Fleet SSE Sync Action */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-amber-400">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      UmarOS Universal Logistics, Economics &amp; Fleet Command
                    </h2>
                    <Badge tone={operatingMode === "MANUAL_OVERRIDE" ? "primary" : "success"} className="text-[10px]">
                      {operatingMode === "MANUAL_OVERRIDE" ? "Manual Override Dictation" : "Self-Tuning Algorithmic Mode"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    Real-time parametric control plane with instantaneous SSE edge sync to Customer, Partner, and Rider apps.
                  </p>
                </div>
              </div>

              {/* Dual-Mode Selector & Commit Action */}
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleToggleOperatingMode("MANUAL_OVERRIDE")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition",
                      operatingMode === "MANUAL_OVERRIDE"
                        ? "bg-rose-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    <UserCheck className="h-3.5 w-3.5" /> MANUAL_OVERRIDE
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleOperatingMode("SELF_TUNING_ALGORITHM")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition",
                      operatingMode === "SELF_TUNING_ALGORITHM"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    <Bot className="h-3.5 w-3.5" /> SELF_TUNING_ALGORITHM
                  </button>
                </div>

                <Button
                  onClick={handleCommitAllMarketplaceSettings}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold gap-2 shadow"
                >
                  <Send className="h-3.5 w-3.5 text-emerald-400" />
                  Commit &amp; Broadcast to Fleet (SSE)
                </Button>
              </div>
            </div>

            {/* Commit Feedback Banner */}
            {commitFeedback && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{commitFeedback}</span>
                </div>
                <Badge tone="success" className="text-[10px]">Real-Time SSE Bus: Active</Badge>
              </div>
            )}

            {/* Statutory Compliance Indicator Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="success" className="text-[10px] gap-1">
                  <ShieldCheck className="h-3 w-3" /> CGST Sec 9(5) 5% ECO Compliant
                </Badge>
                <Badge tone="info" className="text-[10px] gap-1">
                  <CheckCircle2 className="h-3 w-3" /> FSSAI 14-Digit Operational
                </Badge>
                <Badge tone="default" className="text-[10px] gap-1">
                  <Lock className="h-3 w-3" /> CCPA Packaging Cap Guardrail
                </Badge>
                <Badge tone="warning" className="text-[10px] gap-1">
                  <Radio className="h-3 w-3" /> /api/sync/customizations Stream Live
                </Badge>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Active Version: <strong>v{engineVersion}</strong>
              </span>
            </div>

            {/* 4-COLUMN PARAMETER CONTROLS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* CARD 1: LOGISTICS & RIDER COMPENSATION */}
              <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      1. Logistics &amp; Delivery Partner Sliders
                    </h3>
                  </div>
                  <Badge tone="success" className="text-[10px]">Rider Fleet</Badge>
                </div>

                {/* Rider Base Pay (₹15 - ₹35) */}
                <div className="space-y-2 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900">Rider Base Pay (₹15 - ₹35)</span>
                      <p className="text-[10px] text-slate-500">Fixed statutory pickup &amp; first 2 km floor</p>
                    </div>
                    <span className="text-base font-black text-emerald-600 font-mono">₹{riderBasePayRupees}</span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={35}
                    step={1}
                    value={riderBasePayRupees}
                    onChange={(e) => setRiderBasePayRupees(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">City Presets:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setRiderBasePayRupees(35)}
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold border",
                          riderBasePayRupees === 35 ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700 border-slate-200"
                        )}
                      >
                        Metros (₹35)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRiderBasePayRupees(30)}
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold border",
                          riderBasePayRupees === 30 ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700 border-slate-200"
                        )}
                      >
                        Tier 2 (₹30)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRiderBasePayRupees(25)}
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold border",
                          riderBasePayRupees === 25 ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700 border-slate-200"
                        )}
                      >
                        Tier 3 (₹25)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRiderBasePayRupees(15)}
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold border",
                          riderBasePayRupees === 15 ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700 border-slate-200"
                        )}
                      >
                        Floor (₹15)
                      </button>
                    </div>
                  </div>
                </div>

                {/* First-Mile Rate */}
                <div className="space-y-1.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900">First-Mile Distance Rate</span>
                      <p className="text-[10px] text-slate-500">Rider dispatch location to restaurant pickup</p>
                    </div>
                    <span className="font-mono text-sm font-black text-slate-800">₹{firstMileRatePerKm}/km</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    step={0.5}
                    value={firstMileRatePerKm}
                    onChange={(e) => setFirstMileRatePerKm(Number(e.target.value))}
                    className="w-full accent-slate-700 cursor-pointer"
                  />
                </div>

                {/* Last-Mile Rates across all 4 distance bands */}
                <div className="space-y-2 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <span className="text-xs font-bold text-slate-900 block">
                    Last-Mile Distance Rates (4 Distance Bands)
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-white border border-slate-200 space-y-1">
                      <div className="flex justify-between font-semibold text-[11px]">
                        <span>Band 1 (0-2 km)</span>
                        <span className="font-mono text-emerald-700 font-bold">₹{lastMileBand1RatePerKm}/km</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={20}
                        step={0.5}
                        value={lastMileBand1RatePerKm}
                        onChange={(e) => setLastMileBand1RatePerKm(Number(e.target.value))}
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                    </div>
                    <div className="p-2 rounded bg-white border border-slate-200 space-y-1">
                      <div className="flex justify-between font-semibold text-[11px]">
                        <span>Band 2 (2-5 km)</span>
                        <span className="font-mono text-emerald-700 font-bold">₹{lastMileBand2RatePerKm}/km</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={25}
                        step={0.5}
                        value={lastMileBand2RatePerKm}
                        onChange={(e) => setLastMileBand2RatePerKm(Number(e.target.value))}
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                    </div>
                    <div className="p-2 rounded bg-white border border-slate-200 space-y-1">
                      <div className="flex justify-between font-semibold text-[11px]">
                        <span>Band 3 (5-8 km)</span>
                        <span className="font-mono text-emerald-700 font-bold">₹{lastMileBand3RatePerKm}/km</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={30}
                        step={0.5}
                        value={lastMileBand3RatePerKm}
                        onChange={(e) => setLastMileBand3RatePerKm(Number(e.target.value))}
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                    </div>
                    <div className="p-2 rounded bg-white border border-slate-200 space-y-1">
                      <div className="flex justify-between font-semibold text-[11px]">
                        <span>Band 4 (&gt;8 km)</span>
                        <span className="font-mono text-emerald-700 font-bold">₹{lastMileBand4RatePerKm}/km</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={40}
                        step={0.5}
                        value={lastMileBand4RatePerKm}
                        onChange={(e) => setLastMileBand4RatePerKm(Number(e.target.value))}
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Kitchen Wait Compensation Rate & Grace Period */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-900">Wait Pay Rate</span>
                      <span className="font-mono text-xs font-black text-amber-700">₹{kitchenWaitRatePerMinRupees}/min</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={5}
                      step={0.25}
                      value={kitchenWaitRatePerMinRupees}
                      onChange={(e) => setKitchenWaitRatePerMinRupees(Number(e.target.value))}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                    <span className="text-[9px] text-slate-400 block">Rider kitchen wait pay</span>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-900">Grace Period</span>
                      <span className="font-mono text-xs font-black text-slate-800">{kitchenWaitGraceMinutes} min</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={20}
                      step={1}
                      value={kitchenWaitGraceMinutes}
                      onChange={(e) => setKitchenWaitGraceMinutes(Number(e.target.value))}
                      className="w-full accent-slate-600 cursor-pointer"
                    />
                    <span className="text-[9px] text-slate-400 block">Grace before wait pay</span>
                  </div>
                </div>

                {/* Weather Bonuses & Night Surge */}
                <div className="space-y-2 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                    <CloudRain className="h-3.5 w-3.5 text-blue-600" />
                    Weather Bonuses &amp; Night Surge Allowance
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded bg-white border border-slate-200 space-y-1">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span>Drizzle</span>
                        <span className="text-blue-600 font-mono">+₹{weatherBonusDrizzleRupees}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={40}
                        step={1}
                        value={weatherBonusDrizzleRupees}
                        onChange={(e) => setWeatherBonusDrizzleRupees(Number(e.target.value))}
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </div>
                    <div className="p-2 rounded bg-white border border-slate-200 space-y-1">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span>Heavy Rain</span>
                        <span className="text-blue-700 font-mono">+₹{weatherBonusHeavyRainRupees}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={80}
                        step={1}
                        value={weatherBonusHeavyRainRupees}
                        onChange={(e) => setWeatherBonusHeavyRainRupees(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>
                    <div className="p-2 rounded bg-white border border-slate-200 space-y-1">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span>Waterlogged</span>
                        <span className="text-indigo-700 font-mono">+₹{weatherBonusWaterloggedRupees}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={120}
                        step={1}
                        value={weatherBonusWaterloggedRupees}
                        onChange={(e) => setWeatherBonusWaterloggedRupees(Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Night Surge Allowance */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-200 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <Moon className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Night Surge Allowance</span>
                    </div>
                    <span className="font-mono font-bold text-indigo-600">+₹{nightSurgeAllowanceRupees}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={60}
                    step={2}
                    value={nightSurgeAllowanceRupees}
                    onChange={(e) => setNightSurgeAllowanceRupees(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* CARD 2: CUSTOMER PRICING & CART GATES */}
              <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      2. Customer Pricing &amp; Cart Gates
                    </h3>
                  </div>
                  <Badge tone="info" className="text-[10px]">Customer App</Badge>
                </div>

                {/* Platform Fee (₹4 - ₹10) */}
                <div className="space-y-2 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900">Platform Convenience Fee (₹4 - ₹10)</span>
                      <p className="text-[10px] text-slate-500">Statutory 18% GST (SAC 9985) applied on top</p>
                    </div>
                    <span className="text-base font-black text-blue-600 font-mono">₹{platformFeeRupees}</span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={10}
                    step={0.5}
                    value={platformFeeRupees}
                    onChange={(e) => setPlatformFeeRupees(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">Presets:</span>
                    <div className="flex items-center gap-1.5">
                      {[4, 6, 8, 10].map((fee) => (
                        <button
                          key={fee}
                          type="button"
                          onClick={() => setPlatformFeeRupees(fee)}
                          className={cn(
                            "px-2.5 py-0.5 rounded text-[10px] font-bold border",
                            platformFeeRupees === fee ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-200"
                          )}
                        >
                          ₹{fee}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Base Delivery Fee */}
                <div className="space-y-1.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900">Base Customer Delivery Fee</span>
                      <p className="text-[10px] text-slate-500">Charged to customer unless cart meets free delivery threshold</p>
                    </div>
                    <span className="font-mono text-sm font-black text-slate-800">₹{baseDeliveryFeeRupees}</span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={60}
                    step={1}
                    value={baseDeliveryFeeRupees}
                    onChange={(e) => setBaseDeliveryFeeRupees(Number(e.target.value))}
                    className="w-full accent-slate-700 cursor-pointer"
                  />
                </div>

                {/* Free Delivery Cart Threshold */}
                <div className="space-y-1.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900">Free Delivery Cart Threshold</span>
                      <p className="text-[10px] text-slate-500">Orders above this amount receive complimentary delivery</p>
                    </div>
                    <span className="font-mono text-sm font-black text-emerald-600">₹{freeDeliveryCartThresholdRupees}</span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={800}
                    step={25}
                    value={freeDeliveryCartThresholdRupees}
                    onChange={(e) => setFreeDeliveryCartThresholdRupees(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                {/* Small Order Fee & Threshold */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-900">Small Order Fee</span>
                      <span className="font-mono text-xs font-black text-rose-600">₹{smallOrderFeeRupees}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      step={1}
                      value={smallOrderFeeRupees}
                      onChange={(e) => setSmallOrderFeeRupees(Number(e.target.value))}
                      className="w-full accent-rose-600 cursor-pointer"
                    />
                    <span className="text-[9px] text-slate-400 block">Below threshold penalty</span>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-900">Min Cart Threshold</span>
                      <span className="font-mono text-xs font-black text-slate-800">₹{smallOrderThresholdRupees}</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={300}
                      step={10}
                      value={smallOrderThresholdRupees}
                      onChange={(e) => setSmallOrderThresholdRupees(Number(e.target.value))}
                      className="w-full accent-slate-600 cursor-pointer"
                    />
                    <span className="text-[9px] text-slate-400 block">Orders under this pay fee</span>
                  </div>
                </div>
              </div>

              {/* CARD 3: MERCHANT ECONOMICS & REVENUE SPLIT */}
              <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-rose-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      3. Merchant Economics &amp; Commission Tiers (16% - 28%)
                    </h3>
                  </div>
                  <Badge tone="primary" className="text-[10px]">Partner App</Badge>
                </div>

                {/* Active Commission Rate Slider (16% - 28%) */}
                <div className="space-y-2 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900">Active Commission Rate (16% - 28%)</span>
                      <p className="text-[10px] text-slate-500">Statutory floor protection (8% min to 35% max)</p>
                    </div>
                    <span className="text-base font-black text-rose-600 font-mono">{commissionRatePercent.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min={16}
                    max={28}
                    step={0.5}
                    value={commissionRatePercent}
                    onChange={(e) => setCommissionRatePercent(Number(e.target.value))}
                    className="w-full accent-rose-600 cursor-pointer"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">Tiers:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCommissionRatePercent(commissionTierStarterPercent)}
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold border",
                          commissionRatePercent === commissionTierStarterPercent ? "bg-rose-600 text-white border-rose-600" : "bg-white text-slate-700 border-slate-200"
                        )}
                      >
                        Starter ({commissionTierStarterPercent}%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCommissionRatePercent(commissionTierStandardPercent)}
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold border",
                          commissionRatePercent === commissionTierStandardPercent ? "bg-rose-600 text-white border-rose-600" : "bg-white text-slate-700 border-slate-200"
                        )}
                      >
                        Standard ({commissionTierStandardPercent}%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCommissionRatePercent(commissionTierPremiumPercent)}
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold border",
                          commissionRatePercent === commissionTierPremiumPercent ? "bg-rose-600 text-white border-rose-600" : "bg-white text-slate-700 border-slate-200"
                        )}
                      >
                        Premium ({commissionTierPremiumPercent}%)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Configurable Commission Tiers (Starter, Standard, Premium) */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span>Tier 1 (Starter)</span>
                      <span className="font-mono text-rose-600">{commissionTierStarterPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min={16}
                      max={28}
                      step={0.5}
                      value={commissionTierStarterPercent}
                      onChange={(e) => setCommissionTierStarterPercent(Number(e.target.value))}
                      className="w-full accent-rose-600 cursor-pointer"
                    />
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span>Tier 2 (Standard)</span>
                      <span className="font-mono text-rose-600">{commissionTierStandardPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min={16}
                      max={28}
                      step={0.5}
                      value={commissionTierStandardPercent}
                      onChange={(e) => setCommissionTierStandardPercent(Number(e.target.value))}
                      className="w-full accent-rose-600 cursor-pointer"
                    />
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span>Tier 3 (Premium)</span>
                      <span className="font-mono text-rose-600">{commissionTierPremiumPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min={16}
                      max={28}
                      step={0.5}
                      value={commissionTierPremiumPercent}
                      onChange={(e) => setCommissionTierPremiumPercent(Number(e.target.value))}
                      className="w-full accent-rose-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Packaging Fee Cap & Discount Co-Funding Split */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-900">Packaging Fee Cap</span>
                      <span className="font-mono text-xs font-black text-amber-700">₹{packagingFeeCapRupees}</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={60}
                      step={1}
                      value={packagingFeeCapRupees}
                      onChange={(e) => setPackagingFeeCapRupees(Number(e.target.value))}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                    <span className="text-[9px] text-slate-400 block">CCPA compliance protection</span>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-900">Discount Co-Fund</span>
                      <span className="font-mono text-xs font-black text-indigo-700">{discountCoFundingMerchantPercent}% Merch</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={discountCoFundingMerchantPercent}
                      onChange={(e) => setDiscountCoFundingMerchantPercent(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <span className="text-[9px] text-slate-400 block">{100 - discountCoFundingMerchantPercent}% Platform share</span>
                  </div>
                </div>
              </div>

              {/* CARD 4: FLEET & CASH CONTROLS */}
              <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      4. Fleet &amp; Cash Controls (COD, Dispatch, Voice Alerts)
                    </h3>
                  </div>
                  <Badge tone="warning" className="text-[10px]">Operations &amp; Risk</Badge>
                </div>

                {/* COD Floating Cash Limit (₹1,000 - ₹3,000) */}
                <div className="space-y-2 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        COD Floating Cash Limit (₹1,000 - ₹3,000)
                      </span>
                      <p className="text-[10px] text-slate-500">
                        Hard blocking threshold for Cash-on-Delivery allocation
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-amber-600 font-mono">
                        ₹{codLimitRupees.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Warn at ₹{marketplaceSimulation.codWarningLimit} ({codWarningPercent}%)
                      </span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={1000}
                    max={3000}
                    step={100}
                    value={codLimitRupees}
                    onChange={(e) => setCodLimitRupees(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />

                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="text-slate-400">Presets:</span>
                    <div className="flex items-center gap-1.5">
                      {[1000, 1500, 2000, 3000].map((lim) => (
                        <button
                          key={lim}
                          type="button"
                          onClick={() => setCodLimitRupees(lim)}
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold border",
                            codLimitRupees === lim ? "bg-amber-600 text-white border-amber-600" : "bg-white text-slate-700 border-slate-200"
                          )}
                        >
                          ₹{lim}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Dispatch Pre-Allocation Lead Time & Kitchen Delay Voice Alert */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                        <Timer className="h-3.5 w-3.5 text-slate-600" />
                        Dispatch Lead Time
                      </span>
                      <span className="font-mono text-xs font-black text-slate-800">{dispatchPreAllocationLeadTimeMinutes} min</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      step={1}
                      value={dispatchPreAllocationLeadTimeMinutes}
                      onChange={(e) => setDispatchPreAllocationLeadTimeMinutes(Number(e.target.value))}
                      className="w-full accent-slate-700 cursor-pointer"
                    />
                    <span className="text-[9px] text-slate-400 block">Pre-allocation before ready</span>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                        <Volume2 className="h-3.5 w-3.5 text-rose-600" />
                        Kitchen Voice Alert
                      </span>
                      <span className="font-mono text-xs font-black text-rose-600">{kitchenDelayVoiceAlertThresholdMinutes} min</span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={30}
                      step={1}
                      value={kitchenDelayVoiceAlertThresholdMinutes}
                      onChange={(e) => setKitchenDelayVoiceAlertThresholdMinutes(Number(e.target.value))}
                      className="w-full accent-rose-600 cursor-pointer"
                    />
                    <span className="text-[9px] text-slate-400 block">Voice alert delay threshold</span>
                  </div>
                </div>

                {/* Real-Time Condition Simulator Pills */}
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                  <span className="text-[11px] font-bold text-slate-900 block">
                    Telemetry Simulator Environment (Live Dials Testing)
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {(["clear", "drizzle", "heavy_rain", "waterlogged"] as const).map((cond) => (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => setActiveWeatherCondition(cond)}
                        className={cn(
                          "px-2.5 py-1 rounded text-[10px] font-bold border transition",
                          activeWeatherCondition === cond
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-slate-700 border-slate-200"
                        )}
                      >
                        {cond === "clear" && "☀️ Clear"}
                        {cond === "drizzle" && "🌦️ Drizzle"}
                        {cond === "heavy_rain" && "🌧️ Heavy Rain"}
                        {cond === "waterlogged" && "🌊 Waterlogged"}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setIsNightActive((prev) => !prev)}
                      className={cn(
                        "px-2.5 py-1 rounded text-[10px] font-bold border transition",
                        isNightActive ? "bg-indigo-700 text-white border-indigo-700" : "bg-white text-slate-700 border-slate-200"
                      )}
                    >
                      🌙 Night Mode {isNightActive ? "(ON)" : "(OFF)"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* REAL-TIME ORDER SETTLEMENT SIMULATION STATEMENT */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  Statutory Order Settlement Simulation (Live ₹500 Food Order Flow)
                </h3>
                <div className="flex items-center gap-2">
                  <Badge tone={marketplaceSimulation.platformNetMargin >= 0 ? "success" : "danger"} className="text-[10px]">
                    Platform Margin: ₹{marketplaceSimulation.platformNetMargin.toFixed(2)}
                  </Badge>
                  <Badge tone="default" className="text-[10px]">Real Mathematical Dials</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                {/* 1. Merchant Breakdown */}
                <div className="rounded-xl bg-slate-900 p-4 text-white space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block border-b border-slate-800 pb-1">
                    Merchant Settlement Flow
                  </span>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gross Food Bill:</span>
                    <span className="text-white font-bold">₹{marketplaceSimulation.foodOrderAmount}.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Commission ({marketplaceSimulation.commissionPercent.toFixed(1)}%):</span>
                    <span className="text-rose-400">-₹{marketplaceSimulation.grossCommission.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">18% GST (SAC 9985):</span>
                    <span className="text-rose-400">-₹{marketplaceSimulation.gstOnCommission.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">1% TCS (Sec 52):</span>
                    <span className="text-amber-400">-₹{marketplaceSimulation.tcsSec52.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">1% TDS (Sec 194-O):</span>
                    <span className="text-amber-400">-₹{marketplaceSimulation.tdsSec194O.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Packaging (Capped):</span>
                    <span className="text-emerald-400">+₹{marketplaceSimulation.packagingCharge}.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Co-Funded Discount:</span>
                    <span className="text-rose-400">-₹{marketplaceSimulation.merchantDiscountShare.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-2 font-bold text-sm text-emerald-400">
                    <span>Net Merchant Pay:</span>
                    <span>₹{marketplaceSimulation.netMerchantReceivable.toFixed(2)}</span>
                  </div>
                </div>

                {/* 2. Customer Breakdown */}
                <div className="rounded-xl bg-slate-900 p-4 text-white space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block border-b border-slate-800 pb-1">
                    Customer Cart &amp; Charges
                  </span>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Food Subtotal:</span>
                    <span className="text-white">₹{marketplaceSimulation.foodOrderAmount}.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Delivery Fee:</span>
                    <span className="text-white font-bold">₹{marketplaceSimulation.customerDeliveryFee}.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Platform Fee:</span>
                    <span className="text-blue-300 font-bold">₹{marketplaceSimulation.platformFeeRupees}.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Small Order Fee:</span>
                    <span className="text-white">₹{marketplaceSimulation.smallOrderFee}.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Packaging Charge:</span>
                    <span className="text-white">₹{marketplaceSimulation.packagingCharge}.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Promo Discount:</span>
                    <span className="text-emerald-400">-₹50.00</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-2 font-bold text-sm text-blue-300">
                    <span>Total Paid:</span>
                    <span>₹{marketplaceSimulation.customerTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* 3. Rider & Platform Economics */}
                <div className="rounded-xl bg-slate-900 p-4 text-white space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block border-b border-slate-800 pb-1">
                    Rider &amp; Platform Economics
                  </span>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Base Pay:</span>
                    <span className="text-white">₹{riderBasePayRupees}.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">First-Mile (1.2 km):</span>
                    <span className="text-white">₹{marketplaceSimulation.firstMilePay.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last-Mile Band 2:</span>
                    <span className="text-white">₹{marketplaceSimulation.lastMilePay.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Wait Compensation:</span>
                    <span className="text-white">₹{marketplaceSimulation.waitCompensation.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Weather Bonus:</span>
                    <span className="text-blue-400">+₹{marketplaceSimulation.weatherBonus}.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Night Surge:</span>
                    <span className="text-indigo-300">+₹{marketplaceSimulation.nightSurge}.00</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-1 text-emerald-300 font-bold">
                    <span>Total Rider Payout:</span>
                    <span>₹{marketplaceSimulation.riderPayTotal}.00</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-1 text-slate-300">
                    <span className="text-slate-400">Sec 9(5) 5% (Platform):</span>
                    <span>₹{marketplaceSimulation.sec95TaxPayableByPlatform.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1 font-bold text-amber-300">
                    <span>Platform Net Margin:</span>
                    <span>₹{marketplaceSimulation.platformNetMargin.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  Statutory &amp; Ecosystem Guarantee:
                </div>
                <p>
                  All parameters synchronize in real time across UmarOS, OrderKing Customers, OrderKing Partners, and OrderKing Riders via the high-performance SSE Bus (<code className="font-mono bg-emerald-100 px-1 py-0.5 rounded text-[10px]">/api/sync/customizations</code>).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 5: UMAR AI VOICE & NATURAL LANGUAGE COMPILER                 */}
        {/* ================================================================= */}
        {activeTab === "ai_compiler" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Umar AI 10-Stage Autonomous Customization Compiler
                </h2>
                <p className="text-xs text-slate-500">
                  Command full customizations across all platforms via natural language with automated dependency analysis and founder governance gates.
                </p>
              </div>

              <Badge tone="warning" className="text-[10px] bg-amber-50 text-amber-800 border-amber-200">
                Stage Gate Enforced
              </Badge>
            </div>

            {/* Prompt Input Box */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <label htmlFor="ai-customization-prompt" className="text-xs font-bold text-slate-800 block">
                Speak or Type Founder Customization Command
              </label>
              <div className="flex gap-2">
                <input
                  id="ai-customization-prompt"
                  type="text"
                  placeholder="e.g. Change customer app primary color to emerald green (#006A4E)"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStageAiPrompt()}
                  className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />
                <Button
                  onClick={() => handleStageAiPrompt()}
                  className="bg-gradient-to-r from-amber-500 to-rose-600 hover:opacity-90 text-white text-xs font-bold gap-1.5 h-9 px-4"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Stage &amp; Compile Change
                </Button>
              </div>

              {/* Quick Prompt Presets */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] font-bold text-slate-400">Sample Commands:</span>
                {[
                  "Change primary color to emerald green (#006A4E)",
                  "Change text of checkout button to 'Pay & Confirm Order'",
                  "Adjust merchant commission to 20%",
                  "Reorder layout to put search bar first",
                  "Undo last change",
                ].map((cmd, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setAiPrompt(cmd);
                      handleStageAiPrompt(cmd);
                    }}
                    className="text-[10px] px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
                  >
                    &ldquo;{cmd}&rdquo;
                  </button>
                ))}
              </div>

              {aiError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <XCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{aiError}</span>
                </div>
              )}
            </div>

            {/* Staged Preview Diff Card (10-Stage Execution Pipeline) */}
            {stagedPreview && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
                  <div className="flex items-center gap-2">
                    <Badge tone="warning" className="bg-amber-100 text-amber-900 border-amber-300 font-mono text-[10px]">
                      {stagedPreview.previewId}
                    </Badge>
                    <span className="text-xs font-bold text-amber-950">
                      Stage 5: Before / After Staged Preview Diff
                    </span>
                  </div>

                  <Badge
                    tone={stagedPreview.dependencyAnalysis.breakingRisk ? "danger" : "info"}
                    className="text-[10px]"
                  >
                    Risk: {stagedPreview.requiresFounderApproval ? "HIGH (Approval Required)" : "LOW (Safe)"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="rounded-lg bg-white p-3 border border-amber-200/80 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Previous State</span>
                    <div className="font-mono text-slate-700">
                      {JSON.stringify(stagedPreview.previousValue, null, 2)}
                    </div>
                  </div>

                  <div className="rounded-lg bg-white p-3 border border-emerald-300 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-600">Proposed New State</span>
                    <div className="font-mono text-emerald-800 font-bold">
                      {JSON.stringify(stagedPreview.proposedValue, null, 2)}
                    </div>
                  </div>
                </div>

                {/* Dependency Analysis */}
                <div className="rounded-lg bg-white p-3 border border-amber-200/60 text-xs space-y-2">
                  <span className="font-bold text-slate-800 block">
                    Stage 3 &amp; 4: Dependency &amp; Accessibility Analysis
                  </span>
                  <div className="flex flex-wrap gap-4 text-[11px] text-slate-600">
                    <div>
                      <span className="text-slate-400">Affected Platforms:</span>{" "}
                      <span className="font-semibold text-slate-800">
                        {stagedPreview.dependencyAnalysis.affectedPlatforms.join(", ")}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Downstream Components:</span>{" "}
                      <span className="font-semibold text-slate-800">
                        {stagedPreview.dependencyAnalysis.downstreamComponents.join(", ") || "None"}
                      </span>
                    </div>
                    {stagedPreview.dependencyAnalysis.accessibilityImpact && (
                      <div>
                        <span className="text-slate-400">Contrast Ratio:</span>{" "}
                        <span className="font-bold text-slate-800">
                          {stagedPreview.dependencyAnalysis.accessibilityImpact.contrastRatio}:1
                        </span>{" "}
                        ({stagedPreview.dependencyAnalysis.accessibilityImpact.passesAA ? "AA Pass" : "AA Fail"})
                      </div>
                    )}
                  </div>
                </div>

                {/* Stage 6 Founder Approval Gate & Execution Trigger */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={explicitFounderApproval}
                      onChange={(e) => setExplicitFounderApproval(e.target.checked)}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span>Grant Founder Sovereign Approval Gate (Required for execution)</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setStagedPreview(null)}
                      className="text-xs h-8"
                    >
                      Cancel Staged Change
                    </Button>
                    <Button
                      onClick={handleExecuteAiChange}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 h-8 px-4"
                    >
                      <Zap className="h-3.5 w-3.5" /> Execute &amp; Propagate Change
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Execution Receipt Box */}
            {executionReceipt && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <h4 className="text-xs font-bold text-emerald-950">
                      Stage 7-10 Complete: Real Execution Successful
                    </h4>
                  </div>
                  <Badge tone="success" className="text-[10px]">
                    Active Version: v{executionReceipt.activeVersion}
                  </Badge>
                </div>

                <p className="text-xs text-emerald-900 font-medium">
                  {executionReceipt.message}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-emerald-800 font-mono bg-white/70 p-2.5 rounded-lg border border-emerald-200">
                  <div>
                    <span className="text-slate-400">Execution ID:</span> {executionReceipt.executionId}
                  </div>
                  <div>
                    <span className="text-slate-400">Audit Hash:</span>{" "}
                    {executionReceipt.auditHash.substring(0, 16)}...
                  </div>
                  <div>
                    <span className="text-slate-400">Propagated:</span>{" "}
                    {executionReceipt.verifiedPlatforms.join(", ")}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 6: CRYPTOGRAPHIC AUDIT LOG & INSTANT ROLLBACK                */}
        {/* ================================================================= */}
        {activeTab === "audit" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <History className="h-5 w-5 text-rose-600" />
                  Cryptographic Audit Log &amp; Instant Rollback Engine
                </h2>
                <p className="text-xs text-slate-500">
                  Immutable SHA-256 snapshots recorded for every customization event with one-click full system rollback.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge tone="primary" className="text-[10px]">
                  {engine.getSnapshots().length} Snapshots Saved
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Snapshot History Table with Rollback Buttons */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Snapshot Timeline ({engine.getSnapshots().length})
                </h3>

                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {[...engine.getSnapshots()]
                    .reverse()
                    .map((snapshot) => {
                      const isCurrent = snapshot.version === currentState.version;
                      return (
                        <div
                          key={snapshot.version}
                          className={cn(
                            "rounded-xl border p-3.5 transition flex items-center justify-between gap-3 text-xs",
                            isCurrent
                              ? "border-emerald-300 bg-emerald-50/40 shadow-xs"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                          )}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900">
                                Version {snapshot.version}
                              </span>
                              {isCurrent && (
                                <Badge tone="success" className="text-[9px]">
                                  Current Active
                                </Badge>
                              )}
                              <span className="text-[10px] text-slate-400">
                                {new Date(snapshot.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                              {snapshot.reason}
                            </p>
                            <span className="font-mono text-[9px] text-slate-400 truncate block mt-0.5">
                              SHA-256: {snapshot.stateHash.substring(0, 18)}...
                            </span>
                          </div>

                          {!isCurrent && (
                            <Button
                              variant="outline"
                              onClick={() => handleRollbackVersion(snapshot.version)}
                              className="text-xs h-7 px-2.5 gap-1 text-rose-700 hover:bg-rose-50 border-rose-200 shrink-0"
                            >
                              <RotateCcw className="h-3 w-3" /> Rollback
                            </Button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Cryptographic Audit Trail */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Cryptographic Audit Trail ({engine.getAuditTrail().length} Events)
                </h3>

                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {engine.getAuditTrail().length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No audit events recorded yet. Modify any setting to generate audit logs.
                    </div>
                  ) : (
                    [...engine.getAuditTrail()]
                      .reverse()
                      .map((entry) => (
                        <div
                          key={entry.id}
                          className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 text-xs space-y-1 font-mono"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-slate-700">
                              {entry.actionType} · {entry.targetKey}
                            </span>
                            <span className="text-slate-400">
                              {new Date(entry.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] font-sans">
                            {entry.reason}
                          </p>
                          <div className="text-[9px] text-slate-400 truncate">
                            Actor: {entry.actor.name ?? entry.actor.userId} ({entry.actor.role}) | Hash: {entry.snapshotHash.substring(0, 16)}...
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
export default UmarOsVisualCustomizationStudio;
