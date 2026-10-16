/**
 * UMAR OS - Universal Customization & Configuration Operating Engine
 * Authority: Supreme Universal Systems Architect & Founder Command Plane
 *
 * Mandate:
 * Complete, centralized, intelligent, founder-controlled universal customization
 * for every technically feasible element across UmarOS, Customer App, Partner App,
 * Rider App, and KingPay.
 *
 * Covers:
 * 1. Every Word and Text (Translations, fonts, sizes, weights, visibility)
 * 2. Every Color and Visual Property (HEX, RGB, HSL, contrast validation, states)
 * 3. Every Position, Size and Layout (Server-Driven UI section reordering, grid/flex)
 * 4. Every Design and Media Asset (Logos, banners, icons, scheduling)
 * 5. Every Setting, Switch and Workflow (Feature flags, checkout steps, rules)
 * 6. Cryptographic Audit Log & Instant Rollback
 */

import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";

// ============================================================================
// 1. SUPPORTED PLATFORMS & LOCALES
// ============================================================================

export const SupportedPlatformSchema = z.enum([
  "umaros",
  "customer_app",
  "partner_app",
  "rider_app",
  "kingpay",
  "marketing",
  "finance",
  "api_platform",
]);
export type SupportedPlatform = z.infer<typeof SupportedPlatformSchema>;

export const SupportedLocaleSchema = z.enum(["en", "hi", "bn", "as"]);
export type SupportedLocale = z.infer<typeof SupportedLocaleSchema>;

// ============================================================================
// 2. TEXT & CONTENT CUSTOMIZATION SCHEMA
// ============================================================================

export const TextElementOverrideSchema = z.object({
  elementId: z.string().min(1),
  platform: SupportedPlatformSchema,
  route: z.string().min(1),
  translations: z.object({
    en: z.string(),
    hi: z.string().optional(),
    bn: z.string().optional(),
    as: z.string().optional(),
  }),
  typography: z
    .object({
      fontFamily: z.string().optional(),
      fontSizePx: z.number().positive().optional(),
      fontWeight: z.number().int().min(100).max(900).optional(),
      letterSpacingEm: z.number().optional(),
      lineHeight: z.number().positive().optional(),
      alignment: z.enum(["left", "center", "right", "justify"]).optional(),
      textTransform: z.enum(["none", "uppercase", "lowercase", "capitalize"]).optional(),
    })
    .optional(),
  color: z.string().optional(),
  visibility: z.enum(["visible", "hidden", "collapsed"]).default("visible"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type TextElementOverride = z.infer<typeof TextElementOverrideSchema>;
export type TextElementOverrideInput = z.input<typeof TextElementOverrideSchema>;

// ============================================================================
// 3. COLOR SCIENCE & DESIGN TOKENS SCHEMA
// ============================================================================

export const ColorStateSchema = z.object({
  default: z.string().min(1),
  hover: z.string().optional(),
  focus: z.string().optional(),
  active: z.string().optional(),
  disabled: z.string().optional(),
  loading: z.string().optional(),
});
export type ColorState = z.infer<typeof ColorStateSchema>;

export const DesignTokensSchema = z.object({
  palette: z.object({
    primary: z.string().min(1),
    primaryForeground: z.string().min(1),
    background: z.string().min(1),
    surface: z.string().min(1),
    surfaceElevated: z.string().min(1),
    foreground: z.string().min(1),
    muted: z.string().min(1),
    subtle: z.string().min(1),
    accent: z.string().min(1),
    border: z.string().min(1),
    borderStrong: z.string().min(1),
    danger: z.string().min(1),
    success: z.string().min(1),
    warn: z.string().min(1),
    card: z.string().min(1),
  }),
  radius: z.object({
    xsPx: z.number().int().min(0),
    smPx: z.number().int().min(0),
    mdPx: z.number().int().min(0),
    lgPx: z.number().int().min(0),
    xlPx: z.number().int().min(0),
    full: z.boolean().default(false),
  }),
  shadows: z.object({
    sm: z.string(),
    md: z.string(),
    lg: z.string(),
  }),
  elementOverrides: z.record(z.string(), ColorStateSchema).default({}),
});
export type DesignTokens = z.infer<typeof DesignTokensSchema>;

// ============================================================================
// 4. SERVER-DRIVEN UI (SDUI) LAYOUT & POSITIONING SCHEMA
// ============================================================================

export const LayoutSectionSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1), // e.g. "search_bar", "hero_banner", "category_grid", "restaurant_list"
  title: z.string().optional(),
  order: z.number().int(),
  visible: z.boolean().default(true),
  width: z.string().default("100%"),
  minHeightPx: z.number().int().positive().optional(),
  margin: z
    .object({
      topPx: z.number().int().default(0),
      bottomPx: z.number().int().default(0),
      leftPx: z.number().int().default(0),
      rightPx: z.number().int().default(0),
    })
    .default({ topPx: 0, bottomPx: 0, leftPx: 0, rightPx: 0 }),
  padding: z
    .object({
      topPx: z.number().int().default(0),
      bottomPx: z.number().int().default(0),
      leftPx: z.number().int().default(0),
      rightPx: z.number().int().default(0),
    })
    .default({ topPx: 0, bottomPx: 0, leftPx: 0, rightPx: 0 }),
  responsive: z
    .object({
      hideOnMobile: z.boolean().default(false),
      hideOnTablet: z.boolean().default(false),
      hideOnDesktop: z.boolean().default(false),
    })
    .default({ hideOnMobile: false, hideOnTablet: false, hideOnDesktop: false }),
  props: z.record(z.string(), z.unknown()).default({}),
});
export type LayoutSection = z.infer<typeof LayoutSectionSchema>;

export const PageLayoutSchema = z.object({
  pageId: z.string().min(1),
  platform: SupportedPlatformSchema,
  route: z.string().min(1),
  sections: z.array(LayoutSectionSchema),
  updatedAt: z.string(),
});
export type PageLayout = z.infer<typeof PageLayoutSchema>;

// ============================================================================
// 5. DESIGN & MEDIA ASSET SCHEMA
// ============================================================================

export const MediaAssetSchema = z.object({
  assetId: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(["logo", "favicon", "banner", "icon", "badge", "illustration"]),
  platform: SupportedPlatformSchema,
  url: z.string().url().or(z.string().startsWith("/")),
  altText: z.string(),
  aspectRatio: z.string().default("16/9"),
  dimensions: z
    .object({
      width: z.number().positive(),
      height: z.number().positive(),
    })
    .optional(),
  schedule: z
    .object({
      activeFrom: z.string().nullable().default(null),
      activeUntil: z.string().nullable().default(null),
    })
    .optional(),
  status: z.enum(["draft", "published", "archived"]).default("published"),
});
export type MediaAsset = z.infer<typeof MediaAssetSchema>;

// ============================================================================
// 6. WORKFLOW & PROCESS SCHEMA
// ============================================================================

export const CheckoutWorkflowSchema = z.object({
  steps: z.array(
    z.object({
      stepId: z.string().min(1),
      title: z.string().min(1),
      order: z.number().int(),
      required: z.boolean(),
      autoSkipIfSatisfied: z.boolean(),
    })
  ),
  allowGuestCheckout: z.boolean().default(false),
  requirePhoneOtp: z.boolean().default(true),
  tippingOptionsPaise: z.array(z.number().int()).default([1000, 2000, 3000, 5000]),
  cancellationGraceMinutes: z.number().int().min(0).default(8),
  autoRefundThresholdPaise: z.number().int().min(0).default(100000), // Max auto-approved refund (₹1000)
});
export type CheckoutWorkflow = z.infer<typeof CheckoutWorkflowSchema>;

// ============================================================================
// 7. OPERATING MODE & GRANULAR PARAMETER SCHEMAS
// ============================================================================

export const OperatingModeSchema = z.enum(["MANUAL_OVERRIDE", "SELF_TUNING_ALGORITHM"]);
export type OperatingMode = z.infer<typeof OperatingModeSchema>;

export const LogisticsParametersSchema = z.object({
  riderBasePayRupees: z.number().min(15).max(35).default(30),
  firstMileRatePerKm: z.number().min(0).max(30).default(6),
  lastMileBand1RatePerKm: z.number().min(0).max(30).default(8), // Band 1: 0-2 km
  lastMileBand2RatePerKm: z.number().min(0).max(35).default(10), // Band 2: 2-5 km
  lastMileBand3RatePerKm: z.number().min(0).max(40).default(12), // Band 3: 5-8 km
  lastMileBand4RatePerKm: z.number().min(0).max(50).default(15), // Band 4: >8 km
  kitchenWaitRatePerMinRupees: z.number().min(0).max(10).default(1.5),
  kitchenWaitGraceMinutes: z.number().min(0).max(30).default(6),
  weatherBonusDrizzleRupees: z.number().min(0).max(50).default(10),
  weatherBonusHeavyRainRupees: z.number().min(0).max(100).default(25),
  weatherBonusWaterloggedRupees: z.number().min(0).max(150).default(45),
  nightSurgeAllowanceRupees: z.number().min(0).max(80).default(20),
});
export type LogisticsParameters = z.infer<typeof LogisticsParametersSchema>;

export const CustomerPricingParametersSchema = z.object({
  baseDeliveryFeeRupees: z.number().min(0).max(100).default(35),
  platformFeeRupees: z.number().min(4).max(10).default(6),
  smallOrderFeeRupees: z.number().min(0).max(50).default(15),
  smallOrderThresholdRupees: z.number().min(50).max(500).default(149),
  freeDeliveryCartThresholdRupees: z.number().min(100).max(1500).default(299),
});
export type CustomerPricingParameters = z.infer<typeof CustomerPricingParametersSchema>;

export const MerchantEconomicsParametersSchema = z.object({
  commissionTierStarterPercent: z.number().min(16).max(28).default(18),
  commissionTierStandardPercent: z.number().min(16).max(28).default(22),
  commissionTierPremiumPercent: z.number().min(16).max(28).default(26),
  commissionRatePercent: z.number().min(16).max(28).default(22),
  packagingFeeCapRupees: z.number().min(0).max(100).default(35),
  discountCoFundingMerchantPercent: z.number().min(0).max(100).default(50),
});
export type MerchantEconomicsParameters = z.infer<typeof MerchantEconomicsParametersSchema>;

export const FleetAndCashControlsSchema = z.object({
  codFloatingCashLimitRupees: z.number().min(1000).max(3000).default(1500),
  dispatchPreAllocationLeadTimeMinutes: z.number().min(1).max(20).default(5),
  kitchenDelayVoiceAlertThresholdMinutes: z.number().min(2).max(30).default(10),
  codWarningPercent: z.number().min(50).max(95).default(80),
});
export type FleetAndCashControls = z.infer<typeof FleetAndCashControlsSchema>;

// ============================================================================
// 8. COMPREHENSIVE CUSTOMIZATION STATE
// ============================================================================

export const UniversalCustomizationStateSchema = z.object({
  version: z.number().int().positive(),
  updatedAt: z.string(),
  designTokens: DesignTokensSchema,
  textOverrides: z.record(z.string(), TextElementOverrideSchema),
  pageLayouts: z.record(z.string(), PageLayoutSchema),
  mediaAssets: z.record(z.string(), MediaAssetSchema),
  checkoutWorkflow: CheckoutWorkflowSchema,
  featureSwitches: z.record(z.string(), z.boolean()),
  operatingMode: OperatingModeSchema.default("MANUAL_OVERRIDE"),
  logistics: LogisticsParametersSchema.default(() => LogisticsParametersSchema.parse({})),
  customerPricing: CustomerPricingParametersSchema.default(() => CustomerPricingParametersSchema.parse({})),
  merchantEconomics: MerchantEconomicsParametersSchema.default(() => MerchantEconomicsParametersSchema.parse({})),
  fleetAndCash: FleetAndCashControlsSchema.default(() => FleetAndCashControlsSchema.parse({})),
});
export type UniversalCustomizationState = z.infer<typeof UniversalCustomizationStateSchema>;

// ============================================================================
// 8. AUDIT & REVISION CONTROL
// ============================================================================

export interface CustomizationAuditEntry {
  id: string;
  version: number;
  timestamp: string;
  actor: {
    userId: string;
    role: string;
    name?: string;
  };
  actionType: "UPDATE_TEXT" | "UPDATE_COLOR" | "UPDATE_LAYOUT" | "UPDATE_MEDIA" | "UPDATE_WORKFLOW" | "ROLLBACK" | (string & {});
  platform: SupportedPlatform | "all";
  targetKey: string;
  previousValue: unknown;
  newValue: unknown;
  reason: string;
  snapshotHash: string;
}

export interface CustomizationSnapshot {
  version: number;
  timestamp: string;
  state: UniversalCustomizationState;
  stateHash: string;
  actor: {
    userId: string;
    role: string;
    name?: string;
  };
  reason: string;
}

export interface CustomizationCommitEvent {
  version: number;
  timestamp: string;
  actionType: string;
  actor: {
    userId: string;
    role: string;
    name?: string;
  };
  reason: string;
  state: Readonly<UniversalCustomizationState>;
  auditEntry?: CustomizationAuditEntry;
}

export type CustomizationCommitListener = (event: CustomizationCommitEvent) => void;

// ============================================================================
// 9. COLOR SCIENCE & ACCESSIBILITY CONTRAST UTILITIES
// ============================================================================

export class ColorScience {
  /**
   * Converts HEX (#RRGGBB) to [R, G, B] in range 0..255
   */
  static hexToRgb(hex: string): [number, number, number] {
    const clean = hex.replace("#", "").trim();
    if (clean.length === 3) {
      const r = parseInt(clean[0] + clean[0], 16);
      const g = parseInt(clean[1] + clean[1], 16);
      const b = parseInt(clean[2] + clean[2], 16);
      return [r, g, b];
    }
    if (clean.length === 6 || clean.length === 8) {
      const r = parseInt(clean.substring(0, 2), 16);
      const g = parseInt(clean.substring(2, 4), 16);
      const b = parseInt(clean.substring(4, 6), 16);
      return [r, g, b];
    }
    throw new Error(`Invalid HEX color format: "${hex}"`);
  }

  /**
   * Calculates WCAG 2.1 relative luminance
   */
  static getLuminance(hex: string): number {
    const [r, g, b] = this.hexToRgb(hex).map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Calculates WCAG 2.1 contrast ratio between two colors
   * Returns a value between 1.0 and 21.0
   */
  static getContrastRatio(foregroundHex: string, backgroundHex: string): number {
    const l1 = this.getLuminance(foregroundHex);
    const l2 = this.getLuminance(backgroundHex);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    const ratio = (lighter + 0.05) / (darker + 0.05);
    return Math.round(ratio * 100) / 100;
  }

  /**
   * Validates WCAG AA and AAA accessibility
   */
  static validateAccessibility(
    foregroundHex: string,
    backgroundHex: string,
    isLargeText = false
  ): {
    contrastRatio: number;
    passesAA: boolean;
    passesAAA: boolean;
  } {
    const ratio = this.getContrastRatio(foregroundHex, backgroundHex);
    const aaThreshold = isLargeText ? 3.0 : 4.5;
    const aaaThreshold = isLargeText ? 4.5 : 7.0;

    return {
      contrastRatio: ratio,
      passesAA: ratio >= aaThreshold,
      passesAAA: ratio >= aaaThreshold,
    };
  }
}

// ============================================================================
// 10. DEFAULT CANONICAL CUSTOMIZATION STATE
// ============================================================================

export const DEFAULT_UNIVERSAL_CUSTOMIZATION: UniversalCustomizationState = {
  version: 1,
  updatedAt: new Date().toISOString(),
  designTokens: {
    palette: {
      primary: "#E23744", // OrderKing Signature Crimson
      primaryForeground: "#FFFFFF",
      background: "#FCFAF7",
      surface: "#FCFAF7",
      surfaceElevated: "#FFFFFF",
      foreground: "#1C1C1C",
      muted: "#6B7280",
      subtle: "#9CA3AF",
      accent: "#E23744",
      border: "#E5E7EB",
      borderStrong: "#D1D5DB",
      danger: "#EF4444",
      success: "#24963F",
      warn: "#F59E0B",
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
      platform: "customer_app",
      route: "/",
      translations: {
        en: "Order Food & Essentials In Minutes",
        hi: "मिनटों में खाना और आवश्यक वस्तुएं ऑर्डर करें",
        bn: "কয়েক মিনিটের মধ্যে খাবার এবং প্রয়োজনীয় জিনিস অর্ডার করুন",
        as: "কেইমিনিটমানতে খাদ্য আৰু প্ৰয়োজনীয় বস্তু অৰ্ডাৰ কৰক",
      },
      typography: {
        fontSizePx: 32,
        fontWeight: 800,
        alignment: "center",
      },
      visibility: "visible",
    },
    "customer.checkout.pay_button": {
      elementId: "customer.checkout.pay_button",
      platform: "customer_app",
      route: "/checkout",
      translations: {
        en: "Place Order Now",
        hi: "এখনই অর্ডার করুন",
        bn: "এখন অর্ডার করুন",
        as: "এতিয়া অৰ্ডাৰ কৰক",
      },
      typography: {
        fontSizePx: 16,
        fontWeight: 700,
        alignment: "center",
      },
      visibility: "visible",
    },
  },
  pageLayouts: {
    customer_home: {
      pageId: "customer_home",
      platform: "customer_app",
      route: "/",
      updatedAt: new Date().toISOString(),
      sections: [
        {
          id: "header_location",
          type: "location_picker",
          title: "Deliver To",
          order: 1,
          visible: true,
          width: "100%",
          margin: { topPx: 0, bottomPx: 8, leftPx: 0, rightPx: 0 },
          padding: { topPx: 12, bottomPx: 12, leftPx: 16, rightPx: 16 },
          responsive: { hideOnMobile: false, hideOnTablet: false, hideOnDesktop: false },
          props: {},
        },
        {
          id: "search_bar",
          type: "search_input",
          title: "Search Dishes & Restaurants",
          order: 2,
          visible: true,
          width: "100%",
          margin: { topPx: 0, bottomPx: 16, leftPx: 0, rightPx: 0 },
          padding: { topPx: 0, bottomPx: 0, leftPx: 16, rightPx: 16 },
          responsive: { hideOnMobile: false, hideOnTablet: false, hideOnDesktop: false },
          props: { placeholder: "Search 'Biryani', 'Pizza', 'Momos'..." },
        },
        {
          id: "promo_carousel",
          type: "banner_carousel",
          title: "Special Offers",
          order: 3,
          visible: true,
          width: "100%",
          margin: { topPx: 0, bottomPx: 20, leftPx: 0, rightPx: 0 },
          padding: { topPx: 0, bottomPx: 0, leftPx: 0, rightPx: 0 },
          responsive: { hideOnMobile: false, hideOnTablet: false, hideOnDesktop: false },
          props: { autoplay: true, intervalMs: 4000 },
        },
        {
          id: "top_categories",
          type: "category_grid",
          title: "What's on your mind?",
          order: 4,
          visible: true,
          width: "100%",
          margin: { topPx: 0, bottomPx: 24, leftPx: 0, rightPx: 0 },
          padding: { topPx: 0, bottomPx: 0, leftPx: 16, rightPx: 16 },
          responsive: { hideOnMobile: false, hideOnTablet: false, hideOnDesktop: false },
          props: {},
        },
        {
          id: "restaurant_feed",
          type: "restaurant_list",
          title: "Restaurants Delivering to You",
          order: 5,
          visible: true,
          width: "100%",
          margin: { topPx: 0, bottomPx: 32, leftPx: 0, rightPx: 0 },
          padding: { topPx: 0, bottomPx: 0, leftPx: 16, rightPx: 16 },
          responsive: { hideOnMobile: false, hideOnTablet: false, hideOnDesktop: false },
          props: {},
        },
      ],
    },
  },
  mediaAssets: {
    app_logo: {
      assetId: "app_logo",
      name: "OrderKing Primary Logo",
      category: "logo",
      platform: "customer_app",
      url: "/icon.png",
      altText: "OrderKing Food Delivery",
      aspectRatio: "1/1",
      status: "published",
    },
  },
  checkoutWorkflow: {
    steps: [
      { stepId: "cart_review", title: "Review Order", order: 1, required: true, autoSkipIfSatisfied: false },
      { stepId: "address_select", title: "Delivery Address", order: 2, required: true, autoSkipIfSatisfied: true },
      { stepId: "tip_rider", title: "Tip Delivery Partner", order: 3, required: false, autoSkipIfSatisfied: false },
      { stepId: "payment_select", title: "Pay & Order", order: 4, required: true, autoSkipIfSatisfied: false },
    ],
    allowGuestCheckout: false,
    requirePhoneOtp: true,
    tippingOptionsPaise: [1000, 2000, 3000, 5000],
    cancellationGraceMinutes: 8,
    autoRefundThresholdPaise: 100000,
  },
  featureSwitches: {
    enableUpiAutoPay: true,
    enableRiderTipping: true,
    enableVoiceOrdering: true,
    enableRealtimeTracking: true,
    enableMultiRestaurantCart: false,
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
// 11. UNIVERSAL CUSTOMIZATION ENGINE CLASS
// ============================================================================

export class UniversalCustomizationEngine {
  private state: UniversalCustomizationState;
  private auditLog: CustomizationAuditEntry[] = [];
  private history: CustomizationSnapshot[] = [];

  private commitListeners: Set<CustomizationCommitListener> = new Set();

  constructor(initialState?: UniversalCustomizationState) {
    this.state = initialState
      ? UniversalCustomizationStateSchema.parse(initialState)
      : JSON.parse(JSON.stringify(DEFAULT_UNIVERSAL_CUSTOMIZATION));

    this.recordSnapshot(
      {
        userId: "system_init",
        role: "INITIAL_LOAD",
      },
      "Universal Customization Engine Bootstrap"
    );
  }

  // --------------------------------------------------------------------------
  // HASHING & INTEGRITY
  // --------------------------------------------------------------------------

  private calculateHash(obj: unknown): string {
    return createHash("sha256").update(JSON.stringify(obj)).digest("hex");
  }

  private recordSnapshot(actor: { userId: string; role: string; name?: string }, reason = "Config Update"): void {
    const stateHash = this.calculateHash(this.state);
    this.history.push({
      version: this.state.version,
      timestamp: new Date().toISOString(),
      state: JSON.parse(JSON.stringify(this.state)),
      stateHash,
      actor,
      reason,
    });
    const latestAudit = this.auditLog[this.auditLog.length - 1];
    this.notifyCommit(latestAudit);
  }

  public subscribe(listener: CustomizationCommitListener): () => void {
    this.commitListeners.add(listener);
    return () => {
      this.commitListeners.delete(listener);
    };
  }

  public onCommit(listener: CustomizationCommitListener): () => void {
    return this.subscribe(listener);
  }

  public getSubscriberCount(): number {
    return this.commitListeners.size;
  }

  private notifyCommit(auditEntry?: CustomizationAuditEntry): void {
    if (this.commitListeners.size === 0) return;
    const event: CustomizationCommitEvent = {
      version: this.state.version,
      timestamp: this.state.updatedAt,
      actionType: auditEntry?.actionType ?? "COMMIT",
      actor: auditEntry?.actor ?? { userId: "system", role: "SYSTEM" },
      reason: auditEntry?.reason ?? "Configuration Update",
      state: this.state,
      auditEntry,
    };
    for (const listener of this.commitListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error("[UniversalCustomizationEngine] Listener error:", err);
      }
    }
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  public getState(): Readonly<UniversalCustomizationState> {
    return this.state;
  }

  public getVersion(): number {
    return this.state.version;
  }

  public getAuditTrail(): ReadonlyArray<CustomizationAuditEntry> {
    return this.auditLog;
  }

  public getSnapshots(): ReadonlyArray<CustomizationSnapshot> {
    return this.history;
  }

  // --------------------------------------------------------------------------
  // TEXT & WORD CUSTOMIZATION
  // --------------------------------------------------------------------------

  public setTextOverride(
    override: TextElementOverrideInput,
    actor: { userId: string; role: string; name?: string },
    reason: string
  ): { success: boolean; version: number } {
    const validated = TextElementOverrideSchema.parse(override);
    const prev = this.state.textOverrides[validated.elementId] ?? null;

    this.state.textOverrides[validated.elementId] = validated;
    this.state.version += 1;
    this.state.updatedAt = new Date().toISOString();

    const snapshotHash = this.calculateHash(this.state);
    this.auditLog.push({
      id: randomUUID(),
      version: this.state.version,
      timestamp: this.state.updatedAt,
      actor,
      actionType: "UPDATE_TEXT",
      platform: validated.platform,
      targetKey: validated.elementId,
      previousValue: prev,
      newValue: validated,
      reason,
      snapshotHash,
    });

    this.recordSnapshot(actor, reason);
    return { success: true, version: this.state.version };
  }

  public getText(elementId: string, locale: SupportedLocale = "en"): string | null {
    const override = this.state.textOverrides[elementId];
    if (!override) return null;
    return override.translations[locale] ?? override.translations.en;
  }

  // --------------------------------------------------------------------------
  // COLOR & PALETTE CUSTOMIZATION
  // --------------------------------------------------------------------------

  public updatePaletteColor(
    colorKey: keyof DesignTokens["palette"],
    newHex: string,
    actor: { userId: string; role: string; name?: string },
    reason: string
  ): { success: boolean; version: number; accessibility: ReturnType<typeof ColorScience.validateAccessibility> } {
    // Validate color format
    ColorScience.hexToRgb(newHex);

    const prev = this.state.designTokens.palette[colorKey];
    this.state.designTokens.palette[colorKey] = newHex;

    // Contrast check with background or foreground
    const isFg = colorKey.includes("Foreground") || colorKey === "foreground";
    const bg = this.state.designTokens.palette.background;
    const a11y = ColorScience.validateAccessibility(isFg ? newHex : this.state.designTokens.palette.foreground, bg);

    this.state.version += 1;
    this.state.updatedAt = new Date().toISOString();

    const snapshotHash = this.calculateHash(this.state);
    this.auditLog.push({
      id: randomUUID(),
      version: this.state.version,
      timestamp: this.state.updatedAt,
      actor,
      actionType: "UPDATE_COLOR",
      platform: "all",
      targetKey: `palette.${colorKey}`,
      previousValue: prev,
      newValue: newHex,
      reason,
      snapshotHash,
    });

    this.recordSnapshot(actor, reason);
    return { success: true, version: this.state.version, accessibility: a11y };
  }

  public setElementColorOverride(
    elementKey: string,
    colorState: ColorState,
    actor: { userId: string; role: string; name?: string },
    reason: string
  ): { success: boolean; version: number } {
    const validated = ColorStateSchema.parse(colorState);
    const prev = this.state.designTokens.elementOverrides[elementKey] ?? null;

    this.state.designTokens.elementOverrides[elementKey] = validated;
    this.state.version += 1;
    this.state.updatedAt = new Date().toISOString();

    const snapshotHash = this.calculateHash(this.state);
    this.auditLog.push({
      id: randomUUID(),
      version: this.state.version,
      timestamp: this.state.updatedAt,
      actor,
      actionType: "UPDATE_COLOR",
      platform: "all",
      targetKey: `elementOverrides.${elementKey}`,
      previousValue: prev,
      newValue: validated,
      reason,
      snapshotHash,
    });

    this.recordSnapshot(actor, reason);
    return { success: true, version: this.state.version };
  }

  // --------------------------------------------------------------------------
  // LAYOUT & POSITIONING CUSTOMIZATION
  // --------------------------------------------------------------------------

  public setPageLayout(
    layout: PageLayout,
    actor: { userId: string; role: string; name?: string },
    reason: string
  ): { success: boolean; version: number } {
    const validated = PageLayoutSchema.parse(layout);
    const prev = this.state.pageLayouts[validated.pageId] ?? null;

    this.state.pageLayouts[validated.pageId] = validated;
    this.state.version += 1;
    this.state.updatedAt = new Date().toISOString();

    const snapshotHash = this.calculateHash(this.state);
    this.auditLog.push({
      id: randomUUID(),
      version: this.state.version,
      timestamp: this.state.updatedAt,
      actor,
      actionType: "UPDATE_LAYOUT",
      platform: validated.platform,
      targetKey: validated.pageId,
      previousValue: prev,
      newValue: validated,
      reason,
      snapshotHash,
    });

    this.recordSnapshot(actor, reason);
    return { success: true, version: this.state.version };
  }

  public reorderSections(
    pageId: string,
    sectionIdsInOrder: string[],
    actor: { userId: string; role: string; name?: string },
    reason: string
  ): { success: boolean; version: number } {
    const page = this.state.pageLayouts[pageId];
    if (!page) {
      throw new Error(`Page with ID "${pageId}" not found in layouts`);
    }

    const sectionMap = new Map(page.sections.map((s) => [s.id, s]));
    const reordered: LayoutSection[] = [];

    sectionIdsInOrder.forEach((id, index) => {
      const section = sectionMap.get(id);
      if (section) {
        section.order = index + 1;
        reordered.push(section);
      }
    });

    page.sections = reordered;
    page.updatedAt = new Date().toISOString();

    return this.setPageLayout(page, actor, reason);
  }

  // --------------------------------------------------------------------------
  // ROLLBACK ENGINE
  // --------------------------------------------------------------------------

  public rollbackToVersion(
    targetVersion: number,
    actor: { userId: string; role: string; name?: string },
    reason: string
  ): { success: boolean; restoredVersion: number; newActiveVersion: number } {
    const snapshot = this.history.find((h) => h.version === targetVersion);
    if (!snapshot) {
      throw new Error(`Cannot rollback: Version ${targetVersion} does not exist in snapshot history.`);
    }

    const currentHash = this.calculateHash(this.state);
    // Clone snapshot state
    this.state = JSON.parse(JSON.stringify(snapshot.state));
    // Increment to a new sequential version representing the rollback event
    this.state.version = Math.max(...this.history.map((h) => h.version)) + 1;
    this.state.updatedAt = new Date().toISOString();

    const newSnapshotHash = this.calculateHash(this.state);
    this.auditLog.push({
      id: randomUUID(),
      version: this.state.version,
      timestamp: this.state.updatedAt,
      actor,
      actionType: "ROLLBACK",
      platform: "all",
      targetKey: `version_${targetVersion}`,
      previousValue: currentHash,
      newValue: newSnapshotHash,
      reason: `Rollback to version ${targetVersion}: ${reason}`,
      snapshotHash: newSnapshotHash,
    });

    this.recordSnapshot(actor, `Restored state of version ${targetVersion}`);
    return {
      success: true,
      restoredVersion: targetVersion,
      newActiveVersion: this.state.version,
    };
  }

  // --------------------------------------------------------------------------
  // CROSS-PLATFORM PROPAGATION EXPORT
  // --------------------------------------------------------------------------

  /**
   * Generates dynamic CSS variables string for injection into child apps
   */
  public generateCssVariables(): string {
    const p = this.state.designTokens.palette;
    const r = this.state.designTokens.radius;
    return `
      :root {
        --color-primary: ${p.primary};
        --color-primary-fg: ${p.primaryForeground};
        --color-bg: ${p.background};
        --color-surface: ${p.surface};
        --color-surface-2: ${p.surfaceElevated};
        --color-fg: ${p.foreground};
        --color-muted: ${p.muted};
        --color-subtle: ${p.subtle};
        --color-accent: ${p.accent};
        --color-border: ${p.border};
        --color-border-strong: ${p.borderStrong};
        --color-danger: ${p.danger};
        --color-success: ${p.success};
        --color-warn: ${p.warn};
        --radius-xs: ${r.xsPx}px;
        --radius-sm: ${r.smPx}px;
        --radius-md: ${r.mdPx}px;
        --radius-lg: ${r.lgPx}px;
        --radius-xl: ${r.xlPx}px;
      }
    `.trim();
  }

  // --------------------------------------------------------------------------
  // DUAL-MODE & GRANULAR PARAMETER CONTROLS
  // --------------------------------------------------------------------------

  public setOperatingMode(
    mode: OperatingMode,
    actor: { userId: string; role: string; name?: string },
    reason: string
  ): { success: boolean; version: number } {
    const validated = OperatingModeSchema.parse(mode);
    const prev = this.state.operatingMode;
    this.state.operatingMode = validated;
    this.state.version += 1;
    this.state.updatedAt = new Date().toISOString();

    const snapshotHash = this.calculateHash(this.state);
    this.auditLog.push({
      id: randomUUID(),
      version: this.state.version,
      timestamp: this.state.updatedAt,
      actor,
      actionType: "UPDATE_WORKFLOW",
      platform: "all",
      targetKey: "operatingMode",
      previousValue: prev,
      newValue: validated,
      reason,
      snapshotHash,
    });

    this.recordSnapshot(actor, reason);
    return { success: true, version: this.state.version };
  }

  public updateLogistics(
    params: Partial<LogisticsParameters>,
    actor: { userId: string; role: string; name?: string },
    reason: string
  ): { success: boolean; version: number } {
    const merged = { ...this.state.logistics, ...params };
    const validated = LogisticsParametersSchema.parse(merged);
    const prev = this.state.logistics;
    this.state.logistics = validated;
    this.state.version += 1;
    this.state.updatedAt = new Date().toISOString();

    const snapshotHash = this.calculateHash(this.state);
    this.auditLog.push({
      id: randomUUID(),
      version: this.state.version,
      timestamp: this.state.updatedAt,
      actor,
      actionType: "UPDATE_WORKFLOW",
      platform: "rider_app",
      targetKey: "logistics",
      previousValue: prev,
      newValue: validated,
      reason,
      snapshotHash,
    });

    this.recordSnapshot(actor, reason);
    return { success: true, version: this.state.version };
  }

  public updateCustomerPricing(
    params: Partial<CustomerPricingParameters>,
    actor: { userId: string; role: string; name?: string },
    reason: string
  ): { success: boolean; version: number } {
    const merged = { ...this.state.customerPricing, ...params };
    const validated = CustomerPricingParametersSchema.parse(merged);
    const prev = this.state.customerPricing;
    this.state.customerPricing = validated;
    this.state.version += 1;
    this.state.updatedAt = new Date().toISOString();

    const snapshotHash = this.calculateHash(this.state);
    this.auditLog.push({
      id: randomUUID(),
      version: this.state.version,
      timestamp: this.state.updatedAt,
      actor,
      actionType: "UPDATE_WORKFLOW",
      platform: "customer_app",
      targetKey: "customerPricing",
      previousValue: prev,
      newValue: validated,
      reason,
      snapshotHash,
    });

    this.recordSnapshot(actor, reason);
    return { success: true, version: this.state.version };
  }

  public updateMerchantEconomics(
    params: Partial<MerchantEconomicsParameters>,
    actor: { userId: string; role: string; name?: string },
    reason: string
  ): { success: boolean; version: number } {
    const merged = { ...this.state.merchantEconomics, ...params };
    const validated = MerchantEconomicsParametersSchema.parse(merged);
    const prev = this.state.merchantEconomics;
    this.state.merchantEconomics = validated;
    this.state.version += 1;
    this.state.updatedAt = new Date().toISOString();

    const snapshotHash = this.calculateHash(this.state);
    this.auditLog.push({
      id: randomUUID(),
      version: this.state.version,
      timestamp: this.state.updatedAt,
      actor,
      actionType: "UPDATE_WORKFLOW",
      platform: "partner_app",
      targetKey: "merchantEconomics",
      previousValue: prev,
      newValue: validated,
      reason,
      snapshotHash,
    });

    this.recordSnapshot(actor, reason);
    return { success: true, version: this.state.version };
  }

  public updateFleetAndCash(
    params: Partial<FleetAndCashControls>,
    actor: { userId: string; role: string; name?: string },
    reason: string
  ): { success: boolean; version: number } {
    const merged = { ...this.state.fleetAndCash, ...params };
    const validated = FleetAndCashControlsSchema.parse(merged);
    const prev = this.state.fleetAndCash;
    this.state.fleetAndCash = validated;
    this.state.version += 1;
    this.state.updatedAt = new Date().toISOString();

    const snapshotHash = this.calculateHash(this.state);
    this.auditLog.push({
      id: randomUUID(),
      version: this.state.version,
      timestamp: this.state.updatedAt,
      actor,
      actionType: "UPDATE_WORKFLOW",
      platform: "all",
      targetKey: "fleetAndCash",
      previousValue: prev,
      newValue: validated,
      reason,
      snapshotHash,
    });

    this.recordSnapshot(actor, reason);
    return { success: true, version: this.state.version };
  }

  // --------------------------------------------------------------------------
  // CROSS-PLATFORM PROPAGATION EXPORT
  // --------------------------------------------------------------------------

  /**
   * Generates downstream payload for Customer App
   */
  public exportCustomerPayload(): {
    version: number;
    cssVariables: string;
    textOverrides: Record<string, TextElementOverride>;
    homeLayout: PageLayout | null;
    checkoutWorkflow: CheckoutWorkflow;
    featureSwitches: Record<string, boolean>;
    customerPricing: CustomerPricingParameters;
    operatingMode: OperatingMode;
    sha256: string;
  } {
    const payload = {
      version: this.state.version,
      cssVariables: this.generateCssVariables(),
      textOverrides: Object.fromEntries(
        Object.entries(this.state.textOverrides).filter(([_, v]) => v.platform === "customer_app")
      ),
      homeLayout: this.state.pageLayouts["customer_home"] ?? null,
      checkoutWorkflow: this.state.checkoutWorkflow,
      featureSwitches: this.state.featureSwitches,
      customerPricing: this.state.customerPricing,
      operatingMode: this.state.operatingMode,
    };

    return {
      ...payload,
      sha256: this.calculateHash(payload),
    };
  }

  /**
   * Generates downstream payload for Partner App
   */
  public exportPartnerPayload(): {
    version: number;
    cssVariables: string;
    merchantEconomics: MerchantEconomicsParameters;
    kitchenDelayVoiceAlertThresholdMinutes: number;
    operatingMode: OperatingMode;
    featureSwitches: Record<string, boolean>;
    sha256: string;
  } {
    const payload = {
      version: this.state.version,
      cssVariables: this.generateCssVariables(),
      merchantEconomics: this.state.merchantEconomics,
      kitchenDelayVoiceAlertThresholdMinutes: this.state.fleetAndCash.kitchenDelayVoiceAlertThresholdMinutes,
      operatingMode: this.state.operatingMode,
      featureSwitches: this.state.featureSwitches,
    };

    return {
      ...payload,
      sha256: this.calculateHash(payload),
    };
  }

  /**
   * Generates downstream payload for Rider App
   */
  public exportRiderPayload(): {
    version: number;
    cssVariables: string;
    logistics: LogisticsParameters;
    fleetAndCash: FleetAndCashControls;
    payoutPolicy: {
      baseFareRupees: number;
      firstMileRatePerKm: number;
      distanceBands: {
        band1_0_to_2km: number;
        band2_2_to_5km: number;
        band3_5_to_8km: number;
        band4_above_8km: number;
      };
      kitchenWait: {
        ratePerMinRupees: number;
        graceMinutes: number;
      };
      weatherBonuses: {
        drizzleRupees: number;
        heavyRainRupees: number;
        waterloggedRupees: number;
      };
      nightSurgeAllowanceRupees: number;
      codFloatingCashLimitRupees: number;
      codWarningPercent: number;
      dispatchLeadTimeMinutes: number;
    };
    operatingMode: OperatingMode;
    featureSwitches: Record<string, boolean>;
    sha256: string;
  } {
    const log = this.state.logistics;
    const fleet = this.state.fleetAndCash;
    const payload = {
      version: this.state.version,
      cssVariables: this.generateCssVariables(),
      logistics: log,
      fleetAndCash: fleet,
      payoutPolicy: {
        baseFareRupees: log.riderBasePayRupees,
        firstMileRatePerKm: log.firstMileRatePerKm,
        distanceBands: {
          band1_0_to_2km: log.lastMileBand1RatePerKm,
          band2_2_to_5km: log.lastMileBand2RatePerKm,
          band3_5_to_8km: log.lastMileBand3RatePerKm,
          band4_above_8km: log.lastMileBand4RatePerKm,
        },
        kitchenWait: {
          ratePerMinRupees: log.kitchenWaitRatePerMinRupees,
          graceMinutes: log.kitchenWaitGraceMinutes,
        },
        weatherBonuses: {
          drizzleRupees: log.weatherBonusDrizzleRupees,
          heavyRainRupees: log.weatherBonusHeavyRainRupees,
          waterloggedRupees: log.weatherBonusWaterloggedRupees,
        },
        nightSurgeAllowanceRupees: log.nightSurgeAllowanceRupees,
        codFloatingCashLimitRupees: fleet.codFloatingCashLimitRupees,
        codWarningPercent: fleet.codWarningPercent,
        dispatchLeadTimeMinutes: fleet.dispatchPreAllocationLeadTimeMinutes,
      },
      operatingMode: this.state.operatingMode,
      featureSwitches: this.state.featureSwitches,
    };

    return {
      ...payload,
      sha256: this.calculateHash(payload),
    };
  }

  /**
   * Commits arbitrary customization state updates with full audit tracking and subscriber broadcast
   */
  public commit(
    actor: { userId: string; role: string; name?: string },
    reason: string,
    actionType: CustomizationAuditEntry["actionType"] = "BATCH_UPDATE",
    platform: SupportedPlatform | "all" = "all",
    targetKey = "root",
    mutator?: (draft: UniversalCustomizationState) => void
  ): { success: boolean; version: number } {
    const prev = JSON.parse(JSON.stringify(this.state));
    if (mutator) {
      mutator(this.state);
      this.state = UniversalCustomizationStateSchema.parse(this.state);
    }
    this.state.version += 1;
    this.state.updatedAt = new Date().toISOString();

    const snapshotHash = this.calculateHash(this.state);
    const auditEntry: CustomizationAuditEntry = {
      id: randomUUID(),
      version: this.state.version,
      timestamp: this.state.updatedAt,
      actor,
      actionType,
      platform,
      targetKey,
      previousValue: prev,
      newValue: this.state,
      reason,
      snapshotHash,
    };
    this.auditLog.push(auditEntry);
    this.recordSnapshot(actor, reason);

    return { success: true, version: this.state.version };
  }
}

// ============================================================================
// 12. SINGLETON ACCESS & INSTANCE REGISTRY
// ============================================================================

let globalUniversalCustomizationEngineInstance: UniversalCustomizationEngine | null = null;

export function getUniversalCustomizationEngine(): UniversalCustomizationEngine {
  if (!globalUniversalCustomizationEngineInstance) {
    globalUniversalCustomizationEngineInstance = new UniversalCustomizationEngine();
  }
  return globalUniversalCustomizationEngineInstance;
}

export function setUniversalCustomizationEngine(engine: UniversalCustomizationEngine | null): void {
  globalUniversalCustomizationEngineInstance = engine;
}

