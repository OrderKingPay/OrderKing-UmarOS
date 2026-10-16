import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { cn } from "./utils";

// ============================================================================
// 1. CLIENT CUSTOMIZATION TYPES & INTERFACES
// ============================================================================

export type SupportedLocale = "en" | "hi" | "bn" | "as" | string;

export interface DynamicPalette {
  primary: string;
  primaryForeground?: string;
  primaryFg?: string;
  background: string;
  bg?: string;
  surface: string;
  surfaceElevated?: string;
  surface2?: string;
  foreground: string;
  fg?: string;
  muted?: string;
  subtle?: string;
  accent?: string;
  border?: string;
  borderStrong?: string;
  danger?: string;
  success?: string;
  warn?: string;
  warning?: string;
  card?: string;
  [key: string]: string | undefined;
}

export interface DynamicRadius {
  xsPx?: number;
  smPx?: number;
  mdPx?: number;
  lgPx?: number;
  xlPx?: number;
  full?: boolean;
  xs?: string | number;
  sm?: string | number;
  md?: string | number;
  lg?: string | number;
  xl?: string | number;
  [key: string]: string | number | boolean | undefined;
}

export interface DynamicShadows {
  sm?: string;
  md?: string;
  lg?: string;
  [key: string]: string | undefined;
}

export interface DesignTokens {
  palette: DynamicPalette;
  radius: DynamicRadius;
  shadows?: DynamicShadows;
  elementOverrides?: Record<string, Record<string, string>>;
}

export interface TextElementOverride {
  elementId: string;
  platform?: string;
  route?: string;
  translations: Record<string, string>;
  typography?: {
    fontFamily?: string;
    fontSizePx?: number;
    fontWeight?: number;
    letterSpacingEm?: number;
    lineHeight?: number;
    alignment?: "left" | "center" | "right" | "justify";
    textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  };
  color?: string;
  visibility?: "visible" | "hidden" | "collapsed";
  metadata?: Record<string, any>;
}

export interface LayoutSection {
  id: string;
  type: string;
  title?: string;
  order: number;
  visible?: boolean;
  width?: string;
  minHeightPx?: number;
  margin?: {
    topPx?: number;
    bottomPx?: number;
    leftPx?: number;
    rightPx?: number;
  };
  padding?: {
    topPx?: number;
    bottomPx?: number;
    leftPx?: number;
    rightPx?: number;
  };
  responsive?: {
    hideOnMobile?: boolean;
    hideOnTablet?: boolean;
    hideOnDesktop?: boolean;
  };
  props?: Record<string, any>;
}

export interface PageLayout {
  pageId: string;
  platform?: string;
  route?: string;
  sections: LayoutSection[];
  updatedAt?: string;
}

export interface MediaAsset {
  assetId: string;
  name: string;
  category?: string;
  platform?: string;
  url: string;
  altText: string;
  aspectRatio?: string;
  dimensions?: { width: number; height: number };
  status?: string;
  [key: string]: any;
}

export interface CommissionTierToken {
  key: string;
  bps: number;
  percentage: number;
  label: string;
  description: string;
}

export interface CommissionCustomizationTokens {
  standardDeliveryBps: number;
  dineInBps: number;
  minDeliveryBps: number;
  maxDeliveryBps: number;
  defaultBps: number;
  tiers: CommissionTierToken[];
}

export interface MerchantBrandingTokens {
  appName: string;
  shortAppName: string;
  restaurantFacingBrandName: string;
  tagline: string;
  logo: string;
  darkLogo?: string;
  lightLogo?: string;
  primaryColor: string;
  accentColor: string;
  supportEmail: string;
}

export interface DistanceSlabsPolicy {
  slab1MaxKm: number;
  slab2MaxKm: number;
  slab2RatePerKmPaise: number;
  slab3MaxKm: number;
  slab3RatePerKmPaise: number;
  slab4RatePerKmPaise: number;
  ldoBonusPaise: number;
  ldoThresholdKm: number;
}

export interface PayoutPolicyConfig {
  cityTier?: "TIER_1" | "TIER_2" | "TIER_3" | string;
  baseFarePaise?: number;
  baseDistanceKm?: number;
  distanceRatePerKmPaise?: number;
  distanceSlabs?: Partial<DistanceSlabsPolicy>;
  monsoonSurgePaise?: number;
  peakDinnerSurgePaise?: number;
  rainSurgeBonusPaise?: number;
  weatherAllowancePaise?: number;
  surgeMultiplier?: number;
  floatingCashLimitPaise?: number;
  floatingCashLimitInr?: number;
  floatingCashHardLockPaise?: number;
  floatingCashHardLockInr?: number;
  floatingCashSoftWarningPaise?: number;
  floatingCashSoftWarningInr?: number;
  floatingCashWarningThresholdPct?: number;
  waitRatePerMinPaise?: number;
  waitGraceMinutes?: number;
  waitCapPaise?: number;
  payoutSettlementSchedule?: string;
  [key: string]: any;
}

export type OperatingMode = "MANUAL_OVERRIDE" | "SELF_TUNING_ALGORITHM";

export interface LogisticsParameters {
  riderBasePayRupees: number;
  firstMileRatePerKm: number;
  lastMileBand1RatePerKm: number; // Band 1: 0-2 km
  lastMileBand2RatePerKm: number; // Band 2: 2-5 km
  lastMileBand3RatePerKm: number; // Band 3: 5-8 km
  lastMileBand4RatePerKm: number; // Band 4: >8 km
  kitchenWaitRatePerMinRupees: number;
  kitchenWaitGraceMinutes: number;
  weatherBonusDrizzleRupees: number;
  weatherBonusHeavyRainRupees: number;
  weatherBonusWaterloggedRupees: number;
  nightSurgeAllowanceRupees: number;
  [key: string]: any;
}

export interface CustomerPricingParameters {
  baseDeliveryFeeRupees: number;
  platformFeeRupees: number;
  smallOrderFeeRupees: number;
  smallOrderThresholdRupees: number;
  freeDeliveryCartThresholdRupees: number;
  [key: string]: any;
}

export interface MerchantEconomicsParameters {
  commissionTierStarterPercent: number;
  commissionTierStandardPercent: number;
  commissionTierPremiumPercent: number;
  commissionRatePercent: number;
  packagingFeeCapRupees: number;
  discountCoFundingMerchantPercent: number;
  [key: string]: any;
}

export interface FleetAndCashControls {
  codFloatingCashLimitRupees: number;
  dispatchPreAllocationLeadTimeMinutes: number;
  kitchenDelayVoiceAlertThresholdMinutes: number;
  codWarningPercent: number;
  [key: string]: any;
}

export interface DynamicCustomizationState {
  version: number;
  updatedAt?: string;
  designTokens: DesignTokens;
  textOverrides: Record<string, TextElementOverride | string>;
  pageLayouts?: Record<string, PageLayout>;
  homeLayout?: PageLayout | null;
  cssVariables?: string;
  mediaAssets?: Record<string, MediaAsset>;
  checkoutWorkflow?: Record<string, any>;
  featureSwitches?: Record<string, boolean>;
  commissionConfig?: CommissionCustomizationTokens;
  merchantBranding?: MerchantBrandingTokens;
  payoutPolicy?: PayoutPolicyConfig;
  operatingMode?: OperatingMode;
  logistics?: LogisticsParameters;
  customerPricing?: CustomerPricingParameters;
  merchantEconomics?: MerchantEconomicsParameters;
  fleetAndCash?: FleetAndCashControls;
  [key: string]: any;
}

// ============================================================================
// 2. CANONICAL DEFAULT CUSTOMIZATION STATE
// ============================================================================

export const DEFAULT_CUSTOMIZATION_STATE: DynamicCustomizationState = {
  version: 1,
  updatedAt: "2026-10-15T00:00:00.000Z",
  designTokens: {
    palette: {
      primary: "#E23744", // OrderKing Signature Crimson
      primaryForeground: "#FFFFFF",
      primaryFg: "#FFFFFF",
      background: "#FCFAF7",
      bg: "#FCFAF7",
      surface: "#FCFAF7",
      surfaceElevated: "#FFFFFF",
      surface2: "#FFFFFF",
      foreground: "#1C1C1C",
      fg: "#1C1C1C",
      muted: "#6B7280",
      subtle: "#9CA3AF",
      accent: "#E23744",
      border: "#E5E7EB",
      borderStrong: "#D1D5DB",
      danger: "#EF4444",
      success: "#24963F",
      warn: "#F59E0B",
      warning: "#F59E0B",
      card: "#FFFFFF",
    },
    radius: {
      xsPx: 4,
      smPx: 8,
      mdPx: 12,
      lgPx: 16,
      xlPx: 20,
      full: false,
    },
    shadows: {
      sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    },
    elementOverrides: {
      checkout_pay_button: {
        default: "#E23744",
        hover: "#D12A37",
        active: "#B8202D",
        disabled: "#9CA3AF",
      },
    },
  },
  textOverrides: {
    "customer.home.hero_title": {
      elementId: "customer.home.hero_title",
      translations: {
        en: "Order Food & Essentials In Minutes",
        hi: "मिनटों में खाना और आवश्यक वस्तुएं ऑर्डर करें",
        bn: "কয়েক মিনিটের মধ্যে খাবার এবং প্রয়োজনীয় জিনিস অর্ডার করুন",
        as: "কেইমিনিটমানতে খাদ্য আৰু প্ৰয়োজনীয় বস্তু অৰ্ডাৰ কৰক",
      },
    },
    "customer.checkout.pay_button": {
      elementId: "customer.checkout.pay_button",
      translations: {
        en: "Place Order Now",
        hi: "अभी ऑर्डर करें",
        bn: "এখন অর্ডার করুন",
        as: "এতিয়া অৰ্ডাৰ কৰক",
      },
    },
  },
  pageLayouts: {
    customer_home: {
      pageId: "customer_home",
      sections: [
        {
          id: "header_location",
          type: "location_picker",
          title: "Deliver To",
          order: 1,
          visible: true,
          width: "100%",
        },
        {
          id: "search_bar",
          type: "search_input",
          title: "Search Dishes & Restaurants",
          order: 2,
          visible: true,
          width: "100%",
          props: { placeholder: "Search 'Biryani', 'Pizza', 'Momos'..." },
        },
        {
          id: "promo_carousel",
          type: "banner_carousel",
          title: "Special Offers",
          order: 3,
          visible: true,
          width: "100%",
          props: { autoplay: true, intervalMs: 4000 },
        },
        {
          id: "top_categories",
          type: "category_grid",
          title: "What's on your mind?",
          order: 4,
          visible: true,
          width: "100%",
        },
        {
          id: "restaurant_feed",
          type: "restaurant_list",
          title: "Restaurants Delivering to You",
          order: 5,
          visible: true,
          width: "100%",
        },
      ],
    },
  },
  featureSwitches: {
    enableUpiAutoPay: true,
    enableRiderTipping: true,
    enableVoiceOrdering: true,
    enableRealtimeTracking: true,
  },
  commissionConfig: {
    standardDeliveryBps: 2800,
    dineInBps: 0,
    minDeliveryBps: 1800,
    maxDeliveryBps: 3500,
    defaultBps: 2800,
    tiers: [
      {
        key: "DINE_IN",
        bps: 0,
        percentage: 0,
        label: "0% Dine-In Sovereign",
        description: "0% commission for dine-in & customer pickup (self-fulfillment)",
      },
      {
        key: "ENTERPRISE",
        bps: 1800,
        percentage: 18,
        label: "18% Enterprise Tier",
        description: "18% negotiated high-volume brand commission",
      },
      {
        key: "GROWTH",
        bps: 2200,
        percentage: 22,
        label: "22% Growth Partner",
        description: "22% multi-outlet growth partner commission",
      },
      {
        key: "STANDARD",
        bps: 2500,
        percentage: 25,
        label: "25% Standard Delivery",
        description: "25% standard marketplace delivery commission",
      },
      {
        key: "FULL_SERVICE",
        bps: 2800,
        percentage: 28,
        label: "28% Full Service (Default)",
        description: "28% standard industry full-service delivery with dedicated rider fleet",
      },
    ],
  },
  merchantBranding: {
    appName: "Order King Partner",
    shortAppName: "Order King",
    restaurantFacingBrandName: "Order King Partner",
    tagline: "Your kitchen. Your orders. Your settlement.",
    logo: "/brand/logo.svg",
    darkLogo: "/brand/logo-dark.svg",
    lightLogo: "/brand/logo-light.svg",
    primaryColor: "#B33A1B",
    accentColor: "#B33A1B",
    supportEmail: "partners@orderking.in",
  },
  operatingMode: "MANUAL_OVERRIDE",
  logistics: {
    riderBasePayRupees: 30,
    firstMileRatePerKm: 6,
    lastMileBand1RatePerKm: 8,
    lastMileBand2RatePerKm: 10,
    lastMileBand3RatePerKm: 12,
    lastMileBand4RatePerKm: 15,
    kitchenWaitRatePerMinRupees: 1.5,
    kitchenWaitGraceMinutes: 6,
    weatherBonusDrizzleRupees: 10,
    weatherBonusHeavyRainRupees: 25,
    weatherBonusWaterloggedRupees: 45,
    nightSurgeAllowanceRupees: 20,
  },
  customerPricing: {
    baseDeliveryFeeRupees: 35,
    platformFeeRupees: 6,
    smallOrderFeeRupees: 15,
    smallOrderThresholdRupees: 149,
    freeDeliveryCartThresholdRupees: 299,
  },
  merchantEconomics: {
    commissionTierStarterPercent: 18,
    commissionTierStandardPercent: 22,
    commissionTierPremiumPercent: 26,
    commissionRatePercent: 22,
    packagingFeeCapRupees: 35,
    discountCoFundingMerchantPercent: 50,
  },
  fleetAndCash: {
    codFloatingCashLimitRupees: 1500,
    dispatchPreAllocationLeadTimeMinutes: 5,
    kitchenDelayVoiceAlertThresholdMinutes: 10,
    codWarningPercent: 80,
  },
};

export const DEFAULT_RIDER_CUSTOMIZATION_STATE: DynamicCustomizationState = {
  version: 1,
  updatedAt: "2026-10-16T00:00:00.000Z",
  designTokens: {
    palette: {
      primary: "#E5A93C", // OrderKing Partner Obsidian Gold
      primaryForeground: "#000000",
      primaryFg: "#000000",
      background: "#08090C",
      bg: "#08090C",
      surface: "#121723",
      surfaceElevated: "#1A2234",
      surface2: "#1A2234",
      foreground: "#F8FAFC",
      fg: "#F8FAFC",
      muted: "#94A3B8",
      subtle: "#64748B",
      accent: "#E5A93C",
      border: "#1E293B",
      borderStrong: "#334155",
      danger: "#EF4444",
      success: "#10B981",
      warn: "#F59E0B",
      warning: "#F59E0B",
      card: "#121723",
    },
    radius: {
      xsPx: 4,
      smPx: 8,
      mdPx: 12,
      lgPx: 16,
      xlPx: 20,
      full: false,
    },
    shadows: {
      sm: "0 1px 2px 0 rgba(0, 0, 0, 0.4)",
      md: "0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)",
      lg: "0 10px 15px -3px rgba(0, 0, 0, 0.6), 0 4px 6px -2px rgba(0, 0, 0, 0.4)",
    },
    elementOverrides: {
      surge_badge: {
        default: "#E5A93C",
        hover: "#F59E0B",
        active: "#D97706",
      },
      cod_blocked_card: {
        default: "#EF4444",
      },
      cod_warning_card: {
        default: "#F59E0B",
      },
    },
  },
  textOverrides: {
    // 1. Distance-band payouts
    "rider.payout.base_fare": {
      elementId: "rider.payout.base_fare",
      platform: "rider_app",
      route: "/",
      translations: {
        en: "Base ₹35 (up to 2 km)",
        hi: "मूल किराया ₹35 (2 किमी तक)",
        bn: "মূল ভাড়া ₹35 (২ কিমি পর্যন্ত)",
        as: "মূল ভাড়া ₹35 (২ কিমি পৰ্যন্ত)",
      },
    },
    "rider.payout.distance_rate": {
      elementId: "rider.payout.distance_rate",
      platform: "rider_app",
      route: "/",
      translations: {
        en: "₹12/km distance pay · 100% customer tips",
        hi: "₹12/किमी दूरी भुगतान · 100% ग्राहक टिप्स",
        bn: "₹12/কিমি দূরত্ব ফি · 100% গ্রাহক টিপস",
        as: "₹12/কিমি দূৰত্ব মাচুল · 100% গ্ৰাহক টিপছ",
      },
    },
    "rider.payout.rate_card_title": {
      elementId: "rider.payout.rate_card_title",
      platform: "rider_app",
      route: "/earnings",
      translations: {
        en: "Tier-1 Algorithmic Payout Rate Card",
        hi: "टियर-1 एल्गोरिथम भुगतान दर कार्ड",
        bn: "টায়ার-১ অ্যালগরিদমিক পেআউট রেট কার্ড",
        as: "টায়াৰ-১ এলগৰিথমিক পেআউট ৰেট কাৰ্ড",
      },
    },
    "rider.payout.guaranteed_earnings": {
      elementId: "rider.payout.guaranteed_earnings",
      platform: "rider_app",
      route: "/",
      translations: {
        en: "★ Guaranteed Partner Earnings",
        hi: "★ गारंटीकृत पार्टनर कमाई",
        bn: "★ গ্যারান্টিযুক্ত পার্টনার উপার্জন",
        as: "★ নিশ্চিত পাৰ্টনাৰ উপাৰ্জন",
      },
    },
    // 2. Surge badges
    "rider.surge.monsoon_badge": {
      elementId: "rider.surge.monsoon_badge",
      platform: "rider_app",
      route: "/",
      translations: {
        en: "Monsoon Surge (+₹30)",
        hi: "मानसून सर्ज (+₹30)",
        bn: "বর্ষা বৃদ্ধি বোনাস (+₹30)",
        as: "বৰষুণ বৃদ্ধি বোনাচ (+₹30)",
      },
    },
    "rider.surge.peak_dinner_badge": {
      elementId: "rider.surge.peak_dinner_badge",
      platform: "rider_app",
      route: "/",
      translations: {
        en: "Peak Dinner Surge (+₹20)",
        hi: "पीक डिनर सर्ज (+₹20)",
        bn: "পিক ডিনার বৃদ্ধি (+₹20)",
        as: "পিক ডিনাৰ বৃদ্ধি (+₹20)",
      },
    },
    "rider.surge.rain_badge": {
      elementId: "rider.surge.rain_badge",
      platform: "rider_app",
      route: "/",
      translations: {
        en: "Rain Surge Active",
        hi: "बारिश सर्ज सक्रिय",
        bn: "বৃষ্টির সার্জ সক্রিয়",
        as: "বৰষুণ ছাৰ্জ সক্ৰিয়",
      },
    },
    "rider.surge.weather_allowance_badge": {
      elementId: "rider.surge.weather_allowance_badge",
      platform: "rider_app",
      route: "/",
      translations: {
        en: "Weather Allowance (+₹30)",
        hi: "मौसम भत्ता (+₹30)",
        bn: "আবহাওয়া ভাতা (+₹30)",
        as: "বতৰ ভাট্টা (+₹30)",
      },
    },
    "rider.surge.weather_allowance_desc": {
      elementId: "rider.surge.weather_allowance_desc",
      platform: "rider_app",
      route: "/",
      translations: {
        en: "Adverse weather & monsoon allowance paid directly to delivery partners.",
        hi: "खराब मौसम और मानसून भत्ता सीधे डिलीवरी पार्टनर्स को दिया जाता है।",
        bn: "প্রতিকূল আবহাওয়া ও বর্ষা ভাতা সরাসরি ডেলিভারি পার্টনারদের প্রদান করা হয়।",
        as: "প্ৰতিকূল বতৰ আৰু বাৰিষাৰ ভাট্টা পোনপটীয়াকৈ ডেলিভাৰী পাৰ্টনাৰক প্ৰদান কৰা হয়।",
      },
    },
    "rider.surge.multiplier_badge": {
      elementId: "rider.surge.multiplier_badge",
      platform: "rider_app",
      route: "/",
      translations: {
        en: "Surge Multiplier Active",
        hi: "सर्ज मल्टीप्लायर सक्रिय",
        bn: "সার্জ মাল্টিপ্লায়ার সক্রিয়",
        as: "ছাৰ্জ মাল্টিপ্লায়াৰ সক্ৰিয়",
      },
    },
    // 3. COD cash-in-hand limit alerts (₹1,500 hard lock, ₹1,200 soft warning)
    "rider.cod.limit_title": {
      elementId: "rider.cod.limit_title",
      platform: "rider_app",
      route: "/",
      translations: {
        en: "Floating Cash (Pocket Balance)",
        hi: "फ्लोटिंग कैश (पॉकेट बैलेंस)",
        bn: "ভাসমান নগদ (পকেট ব্যালেন্স)",
        as: "ফ্ল'টিং কেছ (পকেট বেলেঞ্চ)",
      },
    },
    "rider.cod.holding_limit_desc": {
      elementId: "rider.cod.holding_limit_desc",
      platform: "rider_app",
      route: "/",
      translations: {
        en: "Partner COD Cash Holding Limit: ₹{limit} (Soft Warning: ₹{warning})",
        hi: "पार्टनर सीओडी नकद रखने की सीमा: ₹{limit} (सॉफ्ट चेतावनी: ₹{warning})",
        bn: "পার্টনার সিওডি নগদ রাখার সীমা: ₹{limit} (সতর্কবার্তা: ₹{warning})",
        as: "পাৰ্টনাৰ চিওডি নগদ ৰখাৰ সীমা: ₹{limit} (সতর্কবাণী: ₹{warning})",
      },
    },
    "rider.cod.blocked_badge": {
      elementId: "rider.cod.blocked_badge",
      platform: "rider_app",
      route: "/",
      translations: {
        en: "COD Blocked (₹{limit} Hard Lock)",
        hi: "सीओडी ब्लॉक (₹{limit} हार्ड लॉक)",
        bn: "সিওডি ব্লক (₹{limit} হার্ড লক)",
        as: "চিওডি অৱৰোধ (₹{limit} হাৰ্ড লক)",
      },
    },
    "rider.cod.soft_warning_badge": {
      elementId: "rider.cod.soft_warning_badge",
      platform: "rider_app",
      route: "/",
      translations: {
        en: "Soft Warning (₹{warning}+)",
        hi: "सॉफ्ट चेतावनी (₹{warning}+)",
        bn: "সতর্কবার্তা (₹{warning}+)",
        as: "সতর্কবাণী (₹{warning}+)",
      },
    },
    "rider.cod.active_badge": {
      elementId: "rider.cod.active_badge",
      platform: "rider_app",
      route: "/",
      translations: {
        en: "Active",
        hi: "सक्रिय",
        bn: "সক্রিয়",
        as: "সক্ৰিয়",
      },
    },
    "rider.cod.blocked_alert": {
      elementId: "rider.cod.blocked_alert",
      platform: "rider_app",
      route: "/",
      translations: {
        en: "COD Orders Paused (₹{limit} Hard Lock Reached): Your physical cash balance reached ₹{balance}. Deposit floating cash to instantly unblock cash deliveries.",
        hi: "सीओडी ऑर्डर रोके गए (₹{limit} हार्ड लॉक): आपका भौतिक नकद शेष ₹{balance} तक पहुंच गया है। तुरंत अनब्लॉक करने के लिए फ्लोटिंग कैश जमा करें।",
        bn: "সিওডি অর্ডার স্থগিত (₹{limit} হার্ড লক): আপনার শারীরিক নগদ ব্যালেন্স ₹{balance} পৌঁছেছে। অবিলম্বে আনব্লক করতে ভাসমান নগদ জমা দিন।",
        as: "চিওডি অৰ্ডাৰ স্থগিত (₹{limit} হাৰ্ড লক): আপোনাৰ নগদ ধনৰ পৰিমাণ ₹{balance} পালেগৈ। তৎক্ষণাত মুকলি কৰিবলৈ ফ্ল'টিং কেছ জমা দিয়ক।",
      },
    },
    "rider.cod.warning_alert": {
      elementId: "rider.cod.warning_alert",
      platform: "rider_app",
      route: "/",
      translations: {
        en: "Approaching ₹{limit} hard lock (₹{warning}+ in-hand). Deposit cash soon to avoid COD order disruption.",
        hi: "₹{limit} हार्ड लॉक के करीब (हाथ में ₹{warning}+)। सीओडी ऑर्डर में व्यवधान से बचने के लिए जल्द नकद जमा करें।",
        bn: "₹{limit} হার্ড লকের কাছাকাছি (হাতে ₹{warning}+)। সিওডি অর্ডারে বাধা এড়াতে শীঘ্রই নগদ জমা দিন।",
        as: "₹{limit} হাৰ্ড লকৰ ওচৰ চাপিছে (হাতত ₹{warning}+)। চিওডি অৰ্ডাৰৰ ব্যাঘাত পৰিহাৰ কৰিবলৈ সোনকালে নগদ ধন জমা দিয়ক।",
      },
    },
  },
  pageLayouts: {
    rider_home: {
      pageId: "rider_home",
      sections: [
        { id: "readiness_check", type: "readiness_check", title: "Pre-Shift Readiness", order: 1, visible: true },
        { id: "active_delivery", type: "active_delivery", title: "Active Delivery Task", order: 2, visible: true },
        { id: "dispatch_offers", type: "dispatch_offers", title: "Live Dispatch Offers", order: 3, visible: true },
        { id: "floating_cash_card", type: "floating_cash_card", title: "Floating Cash & COD Limit", order: 4, visible: true },
        { id: "daily_milestones", type: "daily_milestones", title: "Daily Target Milestones", order: 5, visible: true },
        { id: "payout_calculator", type: "payout_calculator", title: "Payout Calculator", order: 6, visible: true },
        { id: "shift_slots", type: "shift_slots", title: "Operational Shift Slots", order: 7, visible: true },
        { id: "vip_ambassador", type: "vip_ambassador", title: "VIP Ambassador Pass", order: 8, visible: true },
      ],
    },
  },
  featureSwitches: {
    enableMonsoonSurge: true,
    enablePeakDinnerSurge: true,
    enableProgressiveDistancePay: true,
    enableCodFloatingLimit: true,
    enableInstantUpiDeposit: true,
    enableRiderAiCopilot: true,
    enableEmergencySos: true,
    enableWeatherAllowance: true,
  },
  payoutPolicy: {
    cityTier: "TIER_1",
    baseFarePaise: 3500,
    baseDistanceKm: 2.0,
    distanceRatePerKmPaise: 1200,
    distanceSlabs: {
      slab1MaxKm: 2.0,
      slab2MaxKm: 5.0,
      slab2RatePerKmPaise: 1200,
      slab3MaxKm: 8.0,
      slab3RatePerKmPaise: 1400,
      slab4RatePerKmPaise: 1600,
      ldoBonusPaise: 2000,
      ldoThresholdKm: 8.0,
    },
    monsoonSurgePaise: 3000,
    peakDinnerSurgePaise: 2000,
    rainSurgeBonusPaise: 3000,
    weatherAllowancePaise: 3000,
    surgeMultiplier: 1.25,
    floatingCashLimitPaise: 150000,
    floatingCashLimitInr: 1500,
    floatingCashHardLockPaise: 150000,
    floatingCashHardLockInr: 1500,
    floatingCashSoftWarningPaise: 120000,
    floatingCashSoftWarningInr: 1200,
    floatingCashWarningThresholdPct: 80,
    waitRatePerMinPaise: 100,
    waitGraceMinutes: 6,
    waitCapPaise: 3000,
    payoutSettlementSchedule: "Wednesday 2:00 PM IST",
  },
  operatingMode: "MANUAL_OVERRIDE",
  logistics: {
    riderBasePayRupees: 30,
    firstMileRatePerKm: 6,
    lastMileBand1RatePerKm: 8,
    lastMileBand2RatePerKm: 10,
    lastMileBand3RatePerKm: 12,
    lastMileBand4RatePerKm: 15,
    kitchenWaitRatePerMinRupees: 1.5,
    kitchenWaitGraceMinutes: 6,
    weatherBonusDrizzleRupees: 10,
    weatherBonusHeavyRainRupees: 25,
    weatherBonusWaterloggedRupees: 45,
    nightSurgeAllowanceRupees: 20,
  },
  customerPricing: {
    baseDeliveryFeeRupees: 35,
    platformFeeRupees: 6,
    smallOrderFeeRupees: 15,
    smallOrderThresholdRupees: 149,
    freeDeliveryCartThresholdRupees: 299,
  },
  merchantEconomics: {
    commissionTierStarterPercent: 18,
    commissionTierStandardPercent: 22,
    commissionTierPremiumPercent: 26,
    commissionRatePercent: 22,
    packagingFeeCapRupees: 35,
    discountCoFundingMerchantPercent: 50,
  },
  fleetAndCash: {
    codFloatingCashLimitRupees: 1500,
    dispatchPreAllocationLeadTimeMinutes: 5,
    kitchenDelayVoiceAlertThresholdMinutes: 10,
    codWarningPercent: 80,
  },
};

// ============================================================================
// 3. CSS TOKEN INJECTION UTILITY
// ============================================================================

export interface StyleSettableElement {
  style: {
    setProperty: (name: string, value: string) => void;
    removeProperty?: (name: string) => string;
  };
}

/**
 * Extracts all CSS custom properties from customization state or tokens
 * and injects them directly into target.style (defaults to document.documentElement).
 *
 * Guaranteed to inject:
 * - Palette: `--color-primary`, `--color-bg`, `--color-surface`, `--color-fg`, `--color-muted`,
 *            `--color-subtle`, `--color-accent`, `--color-border`, `--color-danger`, `--color-success`, `--color-warn`
 * - Shorthand aliases: `--primary`, `--bg`, `--surface`, `--fg`, `--muted`, `--border`, etc.
 * - Radii: `--radius-xs`, `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius`
 * - Shadows: `--shadow-sm`, `--shadow-md`, `--shadow-lg`
 */
export function injectCssVariables(
  customization?: Partial<DynamicCustomizationState> | Partial<DesignTokens> | null,
  targetElement?: StyleSettableElement | null
): Record<string, string> {
  const vars: Record<string, string> = {};

  // Extract tokens either from state.designTokens or directly if DesignTokens passed
  const tokens: Partial<DesignTokens> | undefined =
    customization && "palette" in customization
      ? (customization as Partial<DesignTokens>)
      : customization && "designTokens" in customization
        ? customization.designTokens
        : undefined;

  const palette: Partial<DynamicPalette> = tokens?.palette ?? DEFAULT_CUSTOMIZATION_STATE.designTokens.palette;
  const radius: Partial<DynamicRadius> = tokens?.radius ?? DEFAULT_CUSTOMIZATION_STATE.designTokens.radius;
  const shadows: Partial<DynamicShadows> = tokens?.shadows ?? DEFAULT_CUSTOMIZATION_STATE.designTokens.shadows ?? {};

  // 1. Palette mapping
  if (palette.primary) {
    vars["--color-primary"] = palette.primary;
    vars["--primary"] = palette.primary;
  }
  const pFg = palette.primaryForeground ?? palette.primaryFg;
  if (pFg) {
    vars["--color-primary-fg"] = pFg;
    vars["--primary-fg"] = pFg;
  }
  const bg = palette.background ?? palette.bg;
  if (bg) {
    vars["--color-bg"] = bg;
    vars["--bg"] = bg;
    vars["--background"] = bg;
  }
  if (palette.surface) {
    vars["--color-surface"] = palette.surface;
    vars["--surface"] = palette.surface;
  }
  const surface2 = palette.surfaceElevated ?? palette.surface2;
  if (surface2) {
    vars["--color-surface-2"] = surface2;
    vars["--color-surface-elevated"] = surface2;
    vars["--surface-elevated"] = surface2;
    vars["--color-elevated"] = surface2;
  }
  const fg = palette.foreground ?? palette.fg;
  if (fg) {
    vars["--color-fg"] = fg;
    vars["--fg"] = fg;
    vars["--foreground"] = fg;
  }
  if (palette.muted) {
    vars["--color-muted"] = palette.muted;
    vars["--muted"] = palette.muted;
  }
  if (palette.subtle) {
    vars["--color-subtle"] = palette.subtle;
    vars["--subtle"] = palette.subtle;
  }
  if (palette.accent) {
    vars["--color-accent"] = palette.accent;
    vars["--accent"] = palette.accent;
  }
  if (palette.border) {
    vars["--color-border"] = palette.border;
    vars["--border"] = palette.border;
  }
  if (palette.borderStrong) {
    vars["--color-border-strong"] = palette.borderStrong;
    vars["--border-strong"] = palette.borderStrong;
  }
  if (palette.danger) {
    vars["--color-danger"] = palette.danger;
    vars["--danger"] = palette.danger;
  }
  if (palette.success) {
    vars["--color-success"] = palette.success;
    vars["--success"] = palette.success;
  }
  const warn = palette.warn ?? palette.warning;
  if (warn) {
    vars["--color-warn"] = warn;
    vars["--color-warning"] = warn;
    vars["--warning"] = warn;
  }
  if (palette.card) {
    vars["--color-card"] = palette.card;
    vars["--card"] = palette.card;
  }

  // 2. Radius mapping (numbers to px, strings as-is)
  const formatPx = (val: unknown, fallback: number): string => {
    if (typeof val === "number") return `${val}px`;
    if (typeof val === "string" && val.length > 0) return val.endsWith("px") ? val : `${val}px`;
    return `${fallback}px`;
  };

  vars["--radius-xs"] = formatPx(radius.xsPx ?? radius.xs, 4);
  vars["--radius-sm"] = formatPx(radius.smPx ?? radius.sm, 8);
  vars["--radius-md"] = formatPx(radius.mdPx ?? radius.md, 12);
  vars["--radius-lg"] = formatPx(radius.lgPx ?? radius.lg, 16);
  vars["--radius-xl"] = formatPx(radius.xlPx ?? radius.xl, 20);
  vars["--radius-full"] = radius.full ? "9999px" : "0px";
  vars["--radius"] = vars["--radius-md"];

  // 3. Shadows mapping
  if (shadows.sm) vars["--shadow-sm"] = shadows.sm;
  if (shadows.md) vars["--shadow-md"] = shadows.md;
  if (shadows.lg) vars["--shadow-lg"] = shadows.lg;

  // 4. Element overrides if provided
  if (tokens?.elementOverrides) {
    for (const [elKey, states] of Object.entries(tokens.elementOverrides)) {
      if (states && typeof states === "object") {
        for (const [stateKey, colorVal] of Object.entries(states)) {
          if (typeof colorVal === "string") {
            vars[`--element-${elKey}-${stateKey}`] = colorVal;
          }
        }
      }
    }
  }

  // 5. Parse any raw cssVariables block if provided in dynamic payload
  const rawCss = customization && "cssVariables" in customization ? customization.cssVariables : undefined;
  if (typeof rawCss === "string" && rawCss.includes("--")) {
    const regex = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(rawCss)) !== null) {
      if (match[1] && match[2]) {
        vars[match[1].trim()] = match[2].trim();
      }
    }
  }

  // 6. Injection into targetElement (or document.documentElement in browser)
  const resolvedTarget =
    targetElement ??
    (typeof document !== "undefined" && document.documentElement ? document.documentElement : null);

  if (resolvedTarget && resolvedTarget.style && typeof resolvedTarget.style.setProperty === "function") {
    for (const [key, val] of Object.entries(vars)) {
      resolvedTarget.style.setProperty(key, val);
    }
  }

  return vars;
}

// ============================================================================
// 4. CONTEXT & VALUE DEFINITION
// ============================================================================

export interface CustomizationContextValue {
  state: DynamicCustomizationState;
  version: number;
  locale: string;
  setLocale: (locale: string) => void;
  updateCustomization: (
    updater:
      | Partial<DynamicCustomizationState>
      | ((prev: DynamicCustomizationState) => DynamicCustomizationState)
  ) => void;
  getText: (elementId: string, defaultText?: string, locale?: string) => string;
  getTextOverride: (elementId: string) => TextElementOverride | null;
  getSectionList: (pageId?: string) => LayoutSection[];
  getAsset: (assetId: string) => MediaAsset | null;
  isFeatureEnabled: (flagKey: string, defaultValue?: boolean) => boolean;
  designTokens: DesignTokens;
  commissionTokens?: CommissionCustomizationTokens;
  merchantBranding?: MerchantBrandingTokens;
  payoutPolicy?: PayoutPolicyConfig;
  operatingMode: OperatingMode;
  logistics: LogisticsParameters;
  customerPricing: CustomerPricingParameters;
  merchantEconomics: MerchantEconomicsParameters;
  fleetAndCash: FleetAndCashControls;
  setOperatingMode: (mode: OperatingMode) => void;
  updateLogistics: (params: Partial<LogisticsParameters>) => void;
  updateCustomerPricing: (params: Partial<CustomerPricingParameters>) => void;
  updateMerchantEconomics: (params: Partial<MerchantEconomicsParameters>) => void;
  updateFleetAndCash: (params: Partial<FleetAndCashControls>) => void;
  cssVariables: Record<string, string>;
}

export const CustomizationContext = createContext<CustomizationContextValue | null>(null);

// SSR-safe layout effect
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export interface CustomizationProviderProps {
  state?: Partial<DynamicCustomizationState> | null;
  customization?: Partial<DynamicCustomizationState> | null;
  initialState?: Partial<DynamicCustomizationState> | null;
  locale?: string;
  targetElement?: StyleSettableElement | null;
  disableCssInjection?: boolean;
  children?: ReactNode;
}

/**
 * React Context provider `CustomizationProvider` that accepts dynamic customization state from UmarOS.
 * Injects CSS custom properties (`--color-primary`, `--color-bg`, `--radius-md`, etc.) into
 * document.documentElement.style so any button, badge, or card instantly reacts to live updates.
 */
export function CustomizationProvider({
  state,
  customization,
  initialState,
  locale: initialLocale = "en",
  targetElement,
  disableCssInjection = false,
  children,
}: CustomizationProviderProps) {
  // Merge incoming state with defaults
  const inputState = state ?? customization ?? initialState;

  const [activeState, setActiveState] = useState<DynamicCustomizationState>(() => {
    if (!inputState) return DEFAULT_CUSTOMIZATION_STATE;
    return {
      ...DEFAULT_CUSTOMIZATION_STATE,
      ...inputState,
      designTokens: {
        ...DEFAULT_CUSTOMIZATION_STATE.designTokens,
        ...(inputState.designTokens ?? {}),
        palette: {
          ...DEFAULT_CUSTOMIZATION_STATE.designTokens.palette,
          ...(inputState.designTokens?.palette ?? {}),
        },
        radius: {
          ...DEFAULT_CUSTOMIZATION_STATE.designTokens.radius,
          ...(inputState.designTokens?.radius ?? {}),
        },
        shadows: {
          ...DEFAULT_CUSTOMIZATION_STATE.designTokens.shadows,
          ...(inputState.designTokens?.shadows ?? {}),
        },
      },
      textOverrides: {
        ...DEFAULT_CUSTOMIZATION_STATE.textOverrides,
        ...(inputState.textOverrides ?? {}),
      },
      pageLayouts: {
        ...DEFAULT_CUSTOMIZATION_STATE.pageLayouts,
        ...(inputState.pageLayouts ?? {}),
        ...(inputState.homeLayout ? { customer_home: inputState.homeLayout } : {}),
      },
      featureSwitches: {
        ...DEFAULT_CUSTOMIZATION_STATE.featureSwitches,
        ...(inputState.featureSwitches ?? {}),
      },
      commissionConfig: {
        ...DEFAULT_CUSTOMIZATION_STATE.commissionConfig!,
        ...(inputState.commissionConfig ?? {}),
      },
      merchantBranding: {
        ...DEFAULT_CUSTOMIZATION_STATE.merchantBranding!,
        ...(inputState.merchantBranding ?? {}),
      },
      payoutPolicy: {
        ...(DEFAULT_RIDER_CUSTOMIZATION_STATE.payoutPolicy ?? {}),
        ...(inputState.payoutPolicy ?? {}),
      },
      operatingMode: inputState.operatingMode ?? DEFAULT_CUSTOMIZATION_STATE.operatingMode ?? "MANUAL_OVERRIDE",
      logistics: {
        ...(DEFAULT_CUSTOMIZATION_STATE.logistics!),
        ...(inputState.logistics ?? {}),
      },
      customerPricing: {
        ...(DEFAULT_CUSTOMIZATION_STATE.customerPricing!),
        ...(inputState.customerPricing ?? {}),
      },
      merchantEconomics: {
        ...(DEFAULT_CUSTOMIZATION_STATE.merchantEconomics!),
        ...(inputState.merchantEconomics ?? {}),
      },
      fleetAndCash: {
        ...(DEFAULT_CUSTOMIZATION_STATE.fleetAndCash!),
        ...(inputState.fleetAndCash ?? {}),
      },
    };
  });

  const [activeLocale, setActiveLocale] = useState<string>(initialLocale);

  // Sync state if prop changes from parent
  useEffect(() => {
    if (!inputState) return;
    setActiveState((prev) => ({
      ...prev,
      ...inputState,
      designTokens: {
        ...prev.designTokens,
        ...(inputState.designTokens ?? {}),
        palette: {
          ...prev.designTokens.palette,
          ...(inputState.designTokens?.palette ?? {}),
        },
        radius: {
          ...prev.designTokens.radius,
          ...(inputState.designTokens?.radius ?? {}),
        },
        shadows: {
          ...prev.designTokens.shadows,
          ...(inputState.designTokens?.shadows ?? {}),
        },
      },
      textOverrides: {
        ...prev.textOverrides,
        ...(inputState.textOverrides ?? {}),
      },
      pageLayouts: {
        ...prev.pageLayouts,
        ...(inputState.pageLayouts ?? {}),
        ...(inputState.homeLayout ? { customer_home: inputState.homeLayout } : {}),
      },
      featureSwitches: {
        ...prev.featureSwitches,
        ...(inputState.featureSwitches ?? {}),
      },
      commissionConfig: {
        ...(prev.commissionConfig ?? DEFAULT_CUSTOMIZATION_STATE.commissionConfig!),
        ...(inputState.commissionConfig ?? {}),
      },
      merchantBranding: {
        ...(prev.merchantBranding ?? DEFAULT_CUSTOMIZATION_STATE.merchantBranding!),
        ...(inputState.merchantBranding ?? {}),
      },
      payoutPolicy: {
        ...(prev.payoutPolicy ?? DEFAULT_RIDER_CUSTOMIZATION_STATE.payoutPolicy ?? {}),
        ...(inputState.payoutPolicy ?? {}),
      },
      operatingMode: inputState.operatingMode ?? prev.operatingMode ?? "MANUAL_OVERRIDE",
      logistics: {
        ...(prev.logistics ?? DEFAULT_CUSTOMIZATION_STATE.logistics!),
        ...(inputState.logistics ?? {}),
      },
      customerPricing: {
        ...(prev.customerPricing ?? DEFAULT_CUSTOMIZATION_STATE.customerPricing!),
        ...(inputState.customerPricing ?? {}),
      },
      merchantEconomics: {
        ...(prev.merchantEconomics ?? DEFAULT_CUSTOMIZATION_STATE.merchantEconomics!),
        ...(inputState.merchantEconomics ?? {}),
      },
      fleetAndCash: {
        ...(prev.fleetAndCash ?? DEFAULT_CUSTOMIZATION_STATE.fleetAndCash!),
        ...(inputState.fleetAndCash ?? {}),
      },
    }));
  }, [inputState]);

  // Sync locale prop
  useEffect(() => {
    if (initialLocale) {
      setActiveLocale(initialLocale);
    }
  }, [initialLocale]);

  // Live CSS token injection
  const injectedVars = useMemo(() => {
    return injectCssVariables(
      activeState,
      disableCssInjection ? null : targetElement
    );
  }, [activeState, targetElement, disableCssInjection]);

  // Hook layout effect for live injection in client/DOM
  useIsomorphicLayoutEffect(() => {
    if (disableCssInjection) return;
    injectCssVariables(activeState, targetElement);
  }, [activeState, targetElement, disableCssInjection]);

  // Customization updater function
  const updateCustomization = useCallback(
    (
      updater:
        | Partial<DynamicCustomizationState>
        | ((prev: DynamicCustomizationState) => DynamicCustomizationState)
    ) => {
      setActiveState((prev) => {
        const nextPartial = typeof updater === "function" ? updater(prev) : updater;
        return {
          ...prev,
          ...nextPartial,
          version: (prev.version ?? 1) + 1,
          updatedAt: new Date().toISOString(),
          designTokens: {
            ...prev.designTokens,
            ...(nextPartial.designTokens ?? {}),
            palette: {
              ...prev.designTokens.palette,
              ...(nextPartial.designTokens?.palette ?? {}),
            },
            radius: {
              ...prev.designTokens.radius,
              ...(nextPartial.designTokens?.radius ?? {}),
            },
          },
          textOverrides: {
            ...prev.textOverrides,
            ...(nextPartial.textOverrides ?? {}),
          },
        };
      });
    },
    []
  );

  // Text resolver helper
  const getText = useCallback(
    (elementId: string, defaultText?: string, locale?: string): string => {
      const targetLoc = locale || activeLocale || "en";
      const override = activeState.textOverrides[elementId];

      if (!override) {
        return defaultText ?? elementId;
      }

      if (typeof override === "string") {
        return override;
      }

      if (override.translations) {
        // 1. Exact locale match
        const exact = override.translations[targetLoc];
        if (exact && typeof exact === "string" && exact.trim().length > 0) {
          return exact;
        }
        // 2. English fallback
        const english = override.translations.en;
        if (english && typeof english === "string" && english.trim().length > 0) {
          return english;
        }
        // 3. First non-empty translation
        const first = Object.values(override.translations).find(
          (t) => typeof t === "string" && t.trim().length > 0
        );
        if (first) return first;
      }

      return defaultText ?? elementId;
    },
    [activeState.textOverrides, activeLocale]
  );

  const getTextOverride = useCallback(
    (elementId: string): TextElementOverride | null => {
      const override = activeState.textOverrides[elementId];
      if (!override || typeof override === "string") return null;
      return override;
    },
    [activeState.textOverrides]
  );

  // Section list resolver helper
  const getSectionList = useCallback(
    (pageId?: string): LayoutSection[] => {
      const targetPageId = pageId || "customer_home";
      const layout =
        targetPageId === "customer_home" && activeState.homeLayout
          ? activeState.homeLayout
          : (activeState.pageLayouts?.[targetPageId] ??
             activeState.homeLayout ??
             (Object.values(activeState.pageLayouts ?? {})[0] || null));

      if (!layout?.sections) return [];
      return [...layout.sections]
        .filter((sec) => sec.visible !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    },
    [activeState.pageLayouts, activeState.homeLayout]
  );

  const getAsset = useCallback(
    (assetId: string): MediaAsset | null => {
      return activeState.mediaAssets?.[assetId] ?? null;
    },
    [activeState.mediaAssets]
  );

  const isFeatureEnabled = useCallback(
    (flagKey: string, defaultValue = false): boolean => {
      if (activeState.featureSwitches && flagKey in activeState.featureSwitches) {
        return Boolean(activeState.featureSwitches[flagKey]);
      }
      return defaultValue;
    },
    [activeState.featureSwitches]
  );

  const setOperatingMode = useCallback((mode: OperatingMode) => {
    setActiveState((prev) => ({
      ...prev,
      operatingMode: mode,
      version: (prev.version ?? 1) + 1,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const updateLogistics = useCallback((params: Partial<LogisticsParameters>) => {
    setActiveState((prev) => ({
      ...prev,
      logistics: {
        ...(prev.logistics ?? DEFAULT_CUSTOMIZATION_STATE.logistics!),
        ...params,
      },
      version: (prev.version ?? 1) + 1,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const updateCustomerPricing = useCallback((params: Partial<CustomerPricingParameters>) => {
    setActiveState((prev) => ({
      ...prev,
      customerPricing: {
        ...(prev.customerPricing ?? DEFAULT_CUSTOMIZATION_STATE.customerPricing!),
        ...params,
      },
      version: (prev.version ?? 1) + 1,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const updateMerchantEconomics = useCallback((params: Partial<MerchantEconomicsParameters>) => {
    setActiveState((prev) => ({
      ...prev,
      merchantEconomics: {
        ...(prev.merchantEconomics ?? DEFAULT_CUSTOMIZATION_STATE.merchantEconomics!),
        ...params,
      },
      version: (prev.version ?? 1) + 1,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const updateFleetAndCash = useCallback((params: Partial<FleetAndCashControls>) => {
    setActiveState((prev) => ({
      ...prev,
      fleetAndCash: {
        ...(prev.fleetAndCash ?? DEFAULT_CUSTOMIZATION_STATE.fleetAndCash!),
        ...params,
      },
      version: (prev.version ?? 1) + 1,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const contextValue = useMemo<CustomizationContextValue>(
    () => ({
      state: activeState,
      version: activeState.version,
      locale: activeLocale,
      setLocale: setActiveLocale,
      updateCustomization,
      getText,
      getTextOverride,
      getSectionList,
      getAsset,
      isFeatureEnabled,
      designTokens: activeState.designTokens,
      commissionTokens: activeState.commissionConfig ?? DEFAULT_CUSTOMIZATION_STATE.commissionConfig!,
      merchantBranding: activeState.merchantBranding ?? DEFAULT_CUSTOMIZATION_STATE.merchantBranding!,
      payoutPolicy: activeState.payoutPolicy ?? DEFAULT_RIDER_CUSTOMIZATION_STATE.payoutPolicy,
      operatingMode: activeState.operatingMode ?? DEFAULT_CUSTOMIZATION_STATE.operatingMode ?? "MANUAL_OVERRIDE",
      logistics: activeState.logistics ?? DEFAULT_CUSTOMIZATION_STATE.logistics!,
      customerPricing: activeState.customerPricing ?? DEFAULT_CUSTOMIZATION_STATE.customerPricing!,
      merchantEconomics: activeState.merchantEconomics ?? DEFAULT_CUSTOMIZATION_STATE.merchantEconomics!,
      fleetAndCash: activeState.fleetAndCash ?? DEFAULT_CUSTOMIZATION_STATE.fleetAndCash!,
      setOperatingMode,
      updateLogistics,
      updateCustomerPricing,
      updateMerchantEconomics,
      updateFleetAndCash,
      cssVariables: injectedVars,
    }),
    [
      activeState,
      activeLocale,
      updateCustomization,
      getText,
      getTextOverride,
      getSectionList,
      getAsset,
      isFeatureEnabled,
      setOperatingMode,
      updateLogistics,
      updateCustomerPricing,
      updateMerchantEconomics,
      updateFleetAndCash,
      injectedVars,
    ]
  );

  return (
    <CustomizationContext.Provider value={contextValue}>
      {children}
    </CustomizationContext.Provider>
  );
}

// ============================================================================
// 5. HOOKS: useCustomization & useText
// ============================================================================

const FALLBACK_CONTEXT_VALUE: CustomizationContextValue = {
  state: DEFAULT_CUSTOMIZATION_STATE,
  version: 1,
  locale: "en",
  setLocale: () => {},
  updateCustomization: () => {},
  getText: (elementId: string, defaultText?: string) => defaultText ?? elementId,
  getTextOverride: () => null,
  getSectionList: () =>
    DEFAULT_CUSTOMIZATION_STATE.pageLayouts?.customer_home?.sections || [],
  getAsset: () => null,
  isFeatureEnabled: () => false,
  designTokens: DEFAULT_CUSTOMIZATION_STATE.designTokens,
  commissionTokens: DEFAULT_CUSTOMIZATION_STATE.commissionConfig!,
  merchantBranding: DEFAULT_CUSTOMIZATION_STATE.merchantBranding!,
  payoutPolicy: DEFAULT_RIDER_CUSTOMIZATION_STATE.payoutPolicy,
  operatingMode: DEFAULT_CUSTOMIZATION_STATE.operatingMode ?? "MANUAL_OVERRIDE",
  logistics: DEFAULT_CUSTOMIZATION_STATE.logistics!,
  customerPricing: DEFAULT_CUSTOMIZATION_STATE.customerPricing!,
  merchantEconomics: DEFAULT_CUSTOMIZATION_STATE.merchantEconomics!,
  fleetAndCash: DEFAULT_CUSTOMIZATION_STATE.fleetAndCash!,
  setOperatingMode: () => {},
  updateLogistics: () => {},
  updateCustomerPricing: () => {},
  updateMerchantEconomics: () => {},
  updateFleetAndCash: () => {},
  cssVariables: {},
};

/**
 * Hook to access the dynamic UmarOS customization state, active design tokens,
 * locale, and helper methods.
 */
export function useCustomization(): CustomizationContextValue {
  const context = useContext(CustomizationContext);
  if (!context) {
    return FALLBACK_CONTEXT_VALUE;
  }
  return context;
}

/**
 * Hook to resolve localized text for any UI element given its elementId.
 * Falls back to active locale -> English -> defaultText -> elementId.
 *
 * @param elementId ID of the element (e.g. "customer.home.hero_title")
 * @param defaultText Optional default fallback string
 * @param locale Optional explicit locale override ("en", "hi", "bn", "as")
 */
export function useText(
  elementId: string,
  defaultText?: string,
  locale?: string
): string {
  const { getText } = useCustomization();
  return getText(elementId, defaultText, locale);
}

/**
 * Hook to retrieve sorted, visible Server-Driven UI sections for a page.
 */
export function useSectionLayout(pageId?: string): LayoutSection[] {
  const { getSectionList } = useCustomization();
  return getSectionList(pageId);
}

/**
 * Hook to access dynamic UmarOS commission customization tokens.
 */
export function useCommissionTokens(): CommissionCustomizationTokens {
  const { commissionTokens } = useCustomization();
  return commissionTokens ?? DEFAULT_CUSTOMIZATION_STATE.commissionConfig!;
}

/**
 * Hook to access dynamic UmarOS merchant branding tokens.
 */
export function useMerchantBranding(): MerchantBrandingTokens {
  const { merchantBranding } = useCustomization();
  return merchantBranding ?? DEFAULT_CUSTOMIZATION_STATE.merchantBranding!;
}

/**
 * Hook to access and toggle the active UmarOS operating mode
 * (MANUAL_OVERRIDE vs SELF_TUNING_ALGORITHM).
 */
export function useOperatingMode(): [OperatingMode, (mode: OperatingMode) => void] {
  const { operatingMode, setOperatingMode } = useCustomization();
  return [operatingMode, setOperatingMode];
}

/**
 * Hook to access and update real-time logistics parameters.
 */
export function useLogisticsParameters(): {
  logistics: LogisticsParameters;
  updateLogistics: (params: Partial<LogisticsParameters>) => void;
} {
  const { logistics, updateLogistics } = useCustomization();
  return { logistics, updateLogistics };
}

/**
 * Hook to access and update customer pricing parameters.
 */
export function useCustomerPricing(): {
  customerPricing: CustomerPricingParameters;
  updateCustomerPricing: (params: Partial<CustomerPricingParameters>) => void;
} {
  const { customerPricing, updateCustomerPricing } = useCustomization();
  return { customerPricing, updateCustomerPricing };
}

/**
 * Hook to access and update merchant economics parameters.
 */
export function useMerchantEconomics(): {
  merchantEconomics: MerchantEconomicsParameters;
  updateMerchantEconomics: (params: Partial<MerchantEconomicsParameters>) => void;
} {
  const { merchantEconomics, updateMerchantEconomics } = useCustomization();
  return { merchantEconomics, updateMerchantEconomics };
}

/**
 * Hook to access and update fleet & cash controls.
 */
export function useFleetAndCashControls(): {
  fleetAndCash: FleetAndCashControls;
  updateFleetAndCash: (params: Partial<FleetAndCashControls>) => void;
} {
  const { fleetAndCash, updateFleetAndCash } = useCustomization();
  return { fleetAndCash, updateFleetAndCash };
}

// ============================================================================
// 6. SERVER-DRIVEN UI: DynamicSectionRenderer
// ============================================================================

export interface DynamicSectionRendererProps {
  /** Page ID to retrieve layout sections from UmarOS (e.g. "customer_home") */
  pageId?: string;
  /** Explicit sections override */
  sections?: LayoutSection[];
  /** Component registry mapping section.type to React Component */
  registry: Record<string, ComponentType<any> | ((props: any) => any) | any>;
  /** Fallback component when section.type is not found in registry */
  fallback?: ComponentType<{ section: LayoutSection }>;
  /** Outer container class */
  className?: string;
  /** Individual section wrapper class */
  sectionWrapperClassName?: string;
  /** Optional extra props forwarded to every section component */
  extraProps?: Record<string, any>;
  /** Callback fired before rendering each section */
  onSectionRender?: (section: LayoutSection, index: number) => void;
}

/**
 * Server-Driven UI component: `DynamicSectionRenderer`
 * Renders layout sections in their exact configured order as dictated by UmarOS.
 * Applies margin, padding, responsive visibility rules, and passes section props.
 */
export function DynamicSectionRenderer({
  pageId,
  sections: explicitSections,
  registry,
  fallback: FallbackComponent,
  className,
  sectionWrapperClassName,
  extraProps,
  onSectionRender,
}: DynamicSectionRendererProps) {
  const { getSectionList } = useCustomization();

  // Resolve and sort sections
  const resolvedSections = useMemo(() => {
    const list = explicitSections ?? getSectionList(pageId);
    return [...list]
      .filter((section) => section && section.visible !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [explicitSections, getSectionList, pageId]);

  if (resolvedSections.length === 0) {
    return null;
  }

  return (
    <div className={cn("sdui-container flex flex-col w-full", className)}>
      {resolvedSections.map((section, index) => {
        onSectionRender?.(section, index);
        const Component = registry[section.type];

        const wrapperStyle: React.CSSProperties = {
          width: section.width ?? "100%",
          minHeight: section.minHeightPx ? `${section.minHeightPx}px` : undefined,
          marginTop: section.margin?.topPx ? `${section.margin.topPx}px` : undefined,
          marginBottom: section.margin?.bottomPx ? `${section.margin.bottomPx}px` : undefined,
          marginLeft: section.margin?.leftPx ? `${section.margin.leftPx}px` : undefined,
          marginRight: section.margin?.rightPx ? `${section.margin.rightPx}px` : undefined,
          paddingTop: section.padding?.topPx ? `${section.padding.topPx}px` : undefined,
          paddingBottom: section.padding?.bottomPx ? `${section.padding.bottomPx}px` : undefined,
          paddingLeft: section.padding?.leftPx ? `${section.padding.leftPx}px` : undefined,
          paddingRight: section.padding?.rightPx ? `${section.padding.rightPx}px` : undefined,
        };

        const responsiveClass = cn(
          section.responsive?.hideOnMobile && "max-sm:hidden",
          section.responsive?.hideOnTablet && "sm:max-md:hidden",
          section.responsive?.hideOnDesktop && "md:hidden"
        );

        if (!Component) {
          if (FallbackComponent) {
            return (
              <div
                key={section.id}
                data-section-id={section.id}
                data-section-type={section.type}
                data-section-order={section.order}
                style={wrapperStyle}
                className={cn("sdui-section-wrapper", responsiveClass, sectionWrapperClassName)}
              >
                <FallbackComponent section={section} />
              </div>
            );
          }
          return null;
        }

        return (
          <div
            key={section.id}
            data-section-id={section.id}
            data-section-type={section.type}
            data-section-order={section.order}
            style={wrapperStyle}
            className={cn("sdui-section-wrapper", responsiveClass, sectionWrapperClassName)}
          >
            <Component {...(section.props ?? {})} {...(extraProps ?? {})} section={section} />
          </div>
        );
      })}
    </div>
  );
}
