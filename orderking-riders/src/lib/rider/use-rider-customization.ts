/**
 * UMAR OS - Rider App Customization & Dynamic Payout Policy Ingestion Hook
 *
 * Bridges the centralized UmarOS Customization Engine & @orderking/ui CustomizationProvider
 * into the OrderKing Delivery Fleet Rider App.
 *
 * Exposes dynamic tokens for:
 * 1. Distance-Band Payout Displays (base fare, progressive km slabs, milestone subtexts, rate cards)
 * 2. Dynamic Surge Badges (Monsoon surge, Peak Dinner surge, Rain surge, Multipliers)
 * 3. COD Cash-in-Hand Floating Limit Alerts (holding limits, blocked alerts, warnings, color science)
 * 4. Server-Driven UI (SDUI) section reordering for the Rider Home view
 */

import { useMemo } from "react";
import {
  useCustomization,
  useSectionLayout,
  DEFAULT_RIDER_CUSTOMIZATION_STATE,
  type LayoutSection,
  type DesignTokens,
  type PayoutPolicyConfig,
} from "@orderking/ui";
import {
  formatPaise,
  STATUTORY_BASE_DISTANCE_KM,
  STATUTORY_BASE_FARE_PAISE,
  STATUTORY_DISTANCE_RATE_PER_KM_PAISE,
  SLAB_1_MAX_KM,
  SLAB_2_MAX_KM,
  SLAB_3_MAX_KM,
  SLAB_2_RATE_PER_KM_PAISE,
  SLAB_3_RATE_PER_KM_PAISE,
  SLAB_4_RATE_PER_KM_PAISE,
  LDO_RETURN_BONUS_PAISE,
  LDO_THRESHOLD_KM,
  DEFAULT_MONSOON_SURGE_PAISE,
  DEFAULT_PEAK_DINNER_SURGE_PAISE,
  DEFAULT_RAIN_SURGE_BONUS_PAISE,
  COD_FLOATING_CASH_LIMIT_PAISE,
} from "./money";

export interface RiderCustomizationTokens {
  // --- Raw Customization State ---
  version: number;
  locale: string;
  designTokens: DesignTokens;
  payoutPolicy: PayoutPolicyConfig;

  // --- 1. Distance-Band Payout Policy Tokens ---
  payout: {
    baseFarePaise: number;
    baseDistanceKm: number;
    distanceRatePerKmPaise: number;
    formattedBaseFare: string;
    formattedDistanceRate: string;
    slabs: {
      slab1MaxKm: number;
      slab2MaxKm: number;
      slab2RatePerKmPaise: number;
      slab3MaxKm: number;
      slab3RatePerKmPaise: number;
      slab4RatePerKmPaise: number;
      ldoBonusPaise: number;
      ldoThresholdKm: number;
    };
    labels: {
      baseFareText: string;
      distanceRateText: string;
      milestoneSubtext: string;
      rateCardTitle: string;
      guaranteedEarningsTitle: string;
    };
  };

  // --- 2. Dynamic Surge Badges Tokens ---
  surge: {
    isMonsoonActive: boolean;
    isPeakDinnerActive: boolean;
    isRainActive: boolean;
    isWeatherAllowanceActive: boolean;
    monsoonBonusPaise: number;
    peakDinnerBonusPaise: number;
    rainBonusPaise: number;
    weatherAllowancePaise: number;
    defaultMultiplier: number;
    badges: {
      monsoonText: string;
      peakDinnerText: string;
      rainText: string;
      weatherAllowanceText: string;
      multiplierText: string;
    };
    color: string;
  };

  // --- 2b. Dynamic Weather Allowances ---
  weather: {
    isActive: boolean;
    allowancePaise: number;
    allowanceInr: number;
    formattedAllowance: string;
    badgeText: string;
    description: string;
  };

  // --- 3. COD Cash-in-Hand Floating Limit Alert Tokens (₹1,500 hard lock, ₹1,200 soft warning) ---
  cod: {
    floatingCashLimitPaise: number;
    floatingCashLimitInr: number;
    hardLockPaise: number;
    hardLockInr: number;
    softWarningPaise: number;
    softWarningInr: number;
    warningThresholdPct: number;
    labels: {
      limitTitle: string;
      holdingLimitDesc: string;
      blockedBadgeText: string;
      softWarningBadgeText: string;
      activeBadgeText: string;
      formatBlockedAlert: (balanceInr: string) => string;
      formatWarningAlert: (balanceInr: string) => string;
      warningAlertText: string;
    };
    tones: {
      dangerColor: string;
      warningColor: string;
      successColor: string;
    };
  };

  // --- 4. Server-Driven UI (SDUI) Sections ---
  sdui: {
    sections: LayoutSection[];
    isSectionVisible: (sectionId: string) => boolean;
  };

  // --- Helper Methods ---
  getText: (elementId: string, defaultText?: string, locale?: string) => string;
  isFeatureEnabled: (flagKey: string, defaultValue?: boolean) => boolean;
}

/**
 * Hook to access dynamic UmarOS tokens for rider payout policy,
 * surge badges, weather allowances, COD limits, and SDUI layouts.
 */
export function useRiderCustomization(): RiderCustomizationTokens {
  const customization = useCustomization();
  const { state, designTokens, getText, isFeatureEnabled, locale } = customization;
  const sections = useSectionLayout("rider_home");

  const policy = (state.payoutPolicy ||
    DEFAULT_RIDER_CUSTOMIZATION_STATE.payoutPolicy ||
    {}) as PayoutPolicyConfig;

  // 1. Distance-Band Payout Resolution
  const baseFarePaise = policy.baseFarePaise ?? STATUTORY_BASE_FARE_PAISE;
  const baseDistanceKm = policy.baseDistanceKm ?? STATUTORY_BASE_DISTANCE_KM;
  const distanceRatePerKmPaise = policy.distanceRatePerKmPaise ?? STATUTORY_DISTANCE_RATE_PER_KM_PAISE;

  const slab1MaxKm = policy.distanceSlabs?.slab1MaxKm ?? SLAB_1_MAX_KM;
  const slab2MaxKm = policy.distanceSlabs?.slab2MaxKm ?? SLAB_2_MAX_KM;
  const slab2RatePerKmPaise = policy.distanceSlabs?.slab2RatePerKmPaise ?? SLAB_2_RATE_PER_KM_PAISE;
  const slab3MaxKm = policy.distanceSlabs?.slab3MaxKm ?? SLAB_3_MAX_KM;
  const slab3RatePerKmPaise = policy.distanceSlabs?.slab3RatePerKmPaise ?? SLAB_3_RATE_PER_KM_PAISE;
  const slab4RatePerKmPaise = policy.distanceSlabs?.slab4RatePerKmPaise ?? SLAB_4_RATE_PER_KM_PAISE;
  const ldoBonusPaise = policy.distanceSlabs?.ldoBonusPaise ?? LDO_RETURN_BONUS_PAISE;
  const ldoThresholdKm = policy.distanceSlabs?.ldoThresholdKm ?? LDO_THRESHOLD_KM;

  const baseFareText = getText(
    "rider.payout.base_fare",
    `Base ${formatPaise(baseFarePaise)} (up to ${baseDistanceKm} km)`
  );
  const distanceRateText = getText(
    "rider.payout.distance_rate",
    `${formatPaise(distanceRatePerKmPaise)}/km distance pay · 100% customer tips`
  );
  const rateCardTitle = getText(
    "rider.payout.rate_card_title",
    "Tier-1 Algorithmic Payout Rate Card"
  );
  const guaranteedEarningsTitle = getText(
    "rider.payout.guaranteed_earnings",
    "★ Guaranteed Partner Earnings"
  );
  const milestoneSubtext = `${baseFareText} + ${distanceRateText}`;

  // 2. Dynamic Surge & Weather Allowance Resolution
  const isMonsoonActive = isFeatureEnabled("enableMonsoonSurge", true);
  const isPeakDinnerActive = isFeatureEnabled("enablePeakDinnerSurge", true);
  const isRainActive = isFeatureEnabled("enableRainSurge", true);
  const isWeatherAllowanceActive = isFeatureEnabled("enableWeatherAllowance", true);

  const monsoonBonusPaise = policy.monsoonSurgePaise ?? DEFAULT_MONSOON_SURGE_PAISE;
  const peakDinnerBonusPaise = policy.peakDinnerSurgePaise ?? DEFAULT_PEAK_DINNER_SURGE_PAISE;
  const rainBonusPaise = policy.rainSurgeBonusPaise ?? DEFAULT_RAIN_SURGE_BONUS_PAISE;
  const weatherAllowancePaise = policy.weatherAllowancePaise ?? 3000;
  const defaultMultiplier = policy.surgeMultiplier ?? 1.25;

  const monsoonText = getText(
    "rider.surge.monsoon_badge",
    `Monsoon Surge (+₹${Math.round(monsoonBonusPaise / 100)})`
  );
  const peakDinnerText = getText(
    "rider.surge.peak_dinner_badge",
    `Peak Dinner Surge (+₹${Math.round(peakDinnerBonusPaise / 100)})`
  );
  const rainText = getText("rider.surge.rain_badge", "Rain Surge Active");
  const weatherAllowanceText = getText(
    "rider.surge.weather_allowance_badge",
    `Weather Allowance (+₹${Math.round(weatherAllowancePaise / 100)})`
  );
  const weatherAllowanceDesc = getText(
    "rider.surge.weather_allowance_desc",
    "Adverse weather & monsoon allowance paid directly to delivery partners."
  );
  const multiplierText = getText(
    "rider.surge.multiplier_badge",
    `${defaultMultiplier}x Surge Active`
  );

  const surgeColor =
    designTokens.elementOverrides?.surge_badge?.default ??
    designTokens.palette.warn ??
    "#E5A93C";

  // 3. COD Cash-in-Hand Floating Limit Resolution (₹1,500 Hard Lock, ₹1,200 Soft Warning)
  const hardLockPaise =
    policy.floatingCashHardLockPaise ?? policy.floatingCashLimitPaise ?? 150000;
  const hardLockInr =
    policy.floatingCashHardLockInr ?? policy.floatingCashLimitInr ?? Math.round(hardLockPaise / 100);
  const softWarningPaise = policy.floatingCashSoftWarningPaise ?? 120000;
  const softWarningInr =
    policy.floatingCashSoftWarningInr ?? Math.round(softWarningPaise / 100);
  const warningThresholdPct =
    policy.floatingCashWarningThresholdPct ?? Math.round((softWarningPaise / hardLockPaise) * 100); // 80%

  const floatingCashLimitPaise = hardLockPaise;
  const floatingCashLimitInr = hardLockInr;

  const limitTitle = getText(
    "rider.cod.limit_title",
    "Floating Cash (Pocket Balance)"
  );
  const holdingLimitDescRaw = getText(
    "rider.cod.holding_limit_desc",
    `Partner COD Cash Holding Limit: ₹${floatingCashLimitInr.toLocaleString("en-IN")} (Soft Warning: ₹${softWarningInr.toLocaleString("en-IN")})`
  );
  const holdingLimitDesc = holdingLimitDescRaw
    .replace("{limit}", floatingCashLimitInr.toLocaleString("en-IN"))
    .replace("{warning}", softWarningInr.toLocaleString("en-IN"));

  const blockedBadgeText = getText(
    "rider.cod.blocked_badge",
    `COD Blocked (₹${floatingCashLimitInr.toLocaleString("en-IN")} Hard Lock)`
  ).replace("{limit}", floatingCashLimitInr.toLocaleString("en-IN"));

  const softWarningBadgeText = getText(
    "rider.cod.soft_warning_badge",
    `Soft Warning (₹${softWarningInr.toLocaleString("en-IN")}+)`
  ).replace("{warning}", softWarningInr.toLocaleString("en-IN"));

  const activeBadgeText = getText("rider.cod.active_badge", "Active");

  const formatBlockedAlert = (balanceInr: string): string => {
    const raw = getText(
      "rider.cod.blocked_alert",
      `COD Orders Paused (₹${floatingCashLimitInr.toLocaleString("en-IN")} Hard Lock Reached): Your physical cash balance reached ₹${balanceInr}. Deposit floating cash to instantly unblock cash deliveries.`
    );
    return raw
      .replace("{balance}", balanceInr)
      .replace("{limit}", floatingCashLimitInr.toLocaleString("en-IN"));
  };

  const formatWarningAlert = (balanceInr: string): string => {
    const raw = getText(
      "rider.cod.warning_alert",
      `Approaching ₹${floatingCashLimitInr.toLocaleString("en-IN")} hard lock (₹${softWarningInr.toLocaleString("en-IN")}+ in-hand). Deposit cash soon to avoid COD order disruption.`
    );
    return raw
      .replace("{balance}", balanceInr)
      .replace("{limit}", floatingCashLimitInr.toLocaleString("en-IN"))
      .replace("{warning}", softWarningInr.toLocaleString("en-IN"));
  };

  const warningAlertText = formatWarningAlert(softWarningInr.toLocaleString("en-IN"));

  // 4. SDUI Helpers
  const visibleSectionIds = useMemo(() => {
    return new Set(sections.filter((s) => s.visible !== false).map((s) => s.id));
  }, [sections]);

  const isSectionVisible = (sectionId: string): boolean => {
    if (sections.length === 0) return true; // Default to visible if no SDUI layout defined
    return visibleSectionIds.has(sectionId);
  };

  return {
    version: state.version ?? 1,
    locale,
    designTokens,
    payoutPolicy: policy,
    payout: {
      baseFarePaise,
      baseDistanceKm,
      distanceRatePerKmPaise,
      formattedBaseFare: formatPaise(baseFarePaise),
      formattedDistanceRate: formatPaise(distanceRatePerKmPaise),
      slabs: {
        slab1MaxKm,
        slab2MaxKm,
        slab2RatePerKmPaise,
        slab3MaxKm,
        slab3RatePerKmPaise,
        slab4RatePerKmPaise,
        ldoBonusPaise,
        ldoThresholdKm,
      },
      labels: {
        baseFareText,
        distanceRateText,
        milestoneSubtext,
        rateCardTitle,
        guaranteedEarningsTitle,
      },
    },
    surge: {
      isMonsoonActive,
      isPeakDinnerActive,
      isRainActive,
      isWeatherAllowanceActive,
      monsoonBonusPaise,
      peakDinnerBonusPaise,
      rainBonusPaise,
      weatherAllowancePaise,
      defaultMultiplier,
      badges: {
        monsoonText,
        peakDinnerText,
        rainText,
        weatherAllowanceText,
        multiplierText,
      },
      color: surgeColor,
    },
    weather: {
      isActive: isWeatherAllowanceActive || isRainActive,
      allowancePaise: weatherAllowancePaise,
      allowanceInr: Math.round(weatherAllowancePaise / 100),
      formattedAllowance: formatPaise(weatherAllowancePaise),
      badgeText: weatherAllowanceText,
      description: weatherAllowanceDesc,
    },
    cod: {
      floatingCashLimitPaise,
      floatingCashLimitInr,
      hardLockPaise,
      hardLockInr,
      softWarningPaise,
      softWarningInr,
      warningThresholdPct,
      labels: {
        limitTitle,
        holdingLimitDesc,
        blockedBadgeText,
        softWarningBadgeText,
        activeBadgeText,
        formatBlockedAlert,
        formatWarningAlert,
        warningAlertText,
      },
      tones: {
        dangerColor: designTokens.palette.danger ?? "#EF4444",
        warningColor: designTokens.palette.warn ?? "#F59E0B",
        successColor: designTokens.palette.success ?? "#10B981",
      },
    },
    sdui: {
      sections,
      isSectionVisible,
    },
    getText,
    isFeatureEnabled,
  };
}
