/**
 * Central platform configuration for Order King.
 * Business identity, theme, fees, flags and legal copy live here — not in
 * scattered components. Window 4 may overlay these values via `platform_settings`.
 * Secrets never belong in this file.
 */

export const DELIVERY_COMMISSION_TIERS = {
  DINE_IN: 0,
  ENTERPRISE: 1800,
  GROWTH: 2200,
  STANDARD: 2500,
  FULL_SERVICE: 2800,
} as const;

export type DeliveryCommissionTierKey = keyof typeof DELIVERY_COMMISSION_TIERS;

export const DEFAULT_DELIVERY_COMMISSION_BPS = DELIVERY_COMMISSION_TIERS.FULL_SERVICE; // 2800 bps (28%)
export const STANDARD_DELIVERY_COMMISSION_BPS = 2800; // 28% standard delivery take-rate
export const DINE_IN_TABLE_QR_COMMISSION_BPS = 0; // 0% dine-in commission on Table QR orders
export const MIN_DELIVERY_COMMISSION_BPS = 1800; // 18% enterprise take-rate floor
export const MAX_DELIVERY_COMMISSION_BPS = 2800; // 28% standard take-rate ceiling
export const PAYMENT_GATEWAY_FEE_BPS = 184; // 184 bps = 1.84% base gateway fee
export const PAYMENT_GATEWAY_GST_BPS = 1800; // 1800 bps = 18.00% GST on payment gateway fee

export function validateCommissionTakeRate(bps: number, isDineIn = false): number {
  if (isDineIn) {
    if (bps !== DINE_IN_TABLE_QR_COMMISSION_BPS) {
      throw new Error(`Dine-in / Table QR commission must be strictly 0% (0 bps). Received: ${bps}`);
    }
    return DINE_IN_TABLE_QR_COMMISSION_BPS;
  }
  if (!Number.isInteger(bps) || bps < MIN_DELIVERY_COMMISSION_BPS || bps > MAX_DELIVERY_COMMISSION_BPS) {
    throw new Error(
      `Delivery take-rate must be an integer between ${MIN_DELIVERY_COMMISSION_BPS} and ${MAX_DELIVERY_COMMISSION_BPS} bps (18% to 28%). Received: ${bps}`
    );
  }
  return bps;
}

export const COMMISSION_OPTIONS_BPS = [
  DELIVERY_COMMISSION_TIERS.DINE_IN,
  DELIVERY_COMMISSION_TIERS.ENTERPRISE,
  DELIVERY_COMMISSION_TIERS.GROWTH,
  DELIVERY_COMMISSION_TIERS.STANDARD,
  DELIVERY_COMMISSION_TIERS.FULL_SERVICE,
] as const;

export interface DeliveryCommissionTierMeta {
  key: DeliveryCommissionTierKey;
  bps: number;
  percentage: number;
  label: string;
  description: string;
}

export const DELIVERY_COMMISSION_TIER_LIST: readonly DeliveryCommissionTierMeta[] = [
  {
    key: "DINE_IN",
    bps: DELIVERY_COMMISSION_TIERS.DINE_IN,
    percentage: 0,
    label: "0% Dine-In Sovereign",
    description: "0% commission for dine-in & customer pickup (self-fulfillment)",
  },
  {
    key: "ENTERPRISE",
    bps: DELIVERY_COMMISSION_TIERS.ENTERPRISE,
    percentage: 18,
    label: "18% Enterprise Tier",
    description: "18% negotiated high-volume brand commission",
  },
  {
    key: "GROWTH",
    bps: DELIVERY_COMMISSION_TIERS.GROWTH,
    percentage: 22,
    label: "22% Growth Partner",
    description: "22% multi-outlet growth partner commission",
  },
  {
    key: "STANDARD",
    bps: DELIVERY_COMMISSION_TIERS.STANDARD,
    percentage: 25,
    label: "25% Standard Delivery",
    description: "25% standard marketplace delivery commission",
  },
  {
    key: "FULL_SERVICE",
    bps: DELIVERY_COMMISSION_TIERS.FULL_SERVICE,
    percentage: 28,
    label: "28% Full Service (Default)",
    description: "28% standard industry full-service delivery with dedicated rider fleet",
  },
] as const;

export type FeatureFlagName =
  | "restaurant_ai"
  | "restaurant_analytics"
  | "promotions"
  | "advanced_inventory"
  | "multi_outlet"
  | "whatsapp_notifications"
  | "sms_notifications"
  | "pwa"
  | "offline_mode"
  | "new_order_sound";

export const platformConfig = {
  brand: {
    name: "Order King",
    appName: "Order King Partner",
    shortAppName: "Order King",
    aiBrandName: "King AI",
    aiAssistantName: "King AI",
    tagline: "Your kitchen. Your orders. Your settlement.",
    restaurantFacingBrandName: "Order King Partner",
    customerFacingBrand: "Order King",
    adminFacingBrand: "Order King Command",
    legalCompanyName: "Order King Foods Private Limited",
    domain: "orderking.in",
    notificationSenderName: "Order King",
    invoiceFooter: "Thank you for cooking with Order King.",
    logo: "/brand/logo.svg",
    darkLogo: "/brand/logo-dark.svg",
    lightLogo: "/brand/logo-light.svg",
    favicon: "/favicon.svg",
    appIcon: "/brand/app-icon.svg",
    restaurantFacingLogo: "/brand/logo.svg",
  },
  ai: {
    brandName: "King AI",
    assistantName: "King AI",
    engineName: "King AI Engine",
    description: "Autonomous kitchen intelligence and culinary analytics",
  },
  theme: {
    primary: "#B33A1B",
    secondary: "#2F5D50",
    accent: "#B33A1B",
    background: "#F4EFE6",
    surface: "#FFFDF8",
    text: "#1C1714",
    textMuted: "#6F645B",
    border: "#E4D8C8",
    danger: "#9B1D1D",
    warning: "#8A5A12",
    success: "#2F5D50",
    typography: {
      display: '"Fraunces", "Noto Serif Bengali", serif',
      body: '"Figtree", "Hind Siliguri", system-ui, sans-serif',
    },
  },
  localization: {
    defaultLanguage: "en" as const,
    supportedLanguages: [
      "en",
      "hi",
      "bn",
      "gu",
      "kn",
      "ml",
      "mr",
      "pa",
      "ta",
      "te",
    ] as const,
    futureLanguages: [] as const,
  },
  restaurantSettings: {
    defaultPrepMinutes: 20,
    defaultPeakPrepMinutes: 30,
    defaultCommissionBps: 2800,
    orderPollMs: 4000,
    kitchenPollMs: 3000,
    maxUploadBytes: 512 * 1024,
    allowedDocumentTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
    allowedImageTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  fees: { currency: "INR", currencySymbol: "₹", moneyUnit: "paise", defaultPackingPaise: 0 },
  commission: {
    targetBps: 2800,
    defaultBps: 2800,
    defaultDeliveryCommissionBps: 2800,
    defaultDineInCommissionBps: 0,
    allowedBps: COMMISSION_OPTIONS_BPS,
    tiers: DELIVERY_COMMISSION_TIERS,
    tierList: DELIVERY_COMMISSION_TIER_LIST,
    allowCustom: true,
  },
  notifications: { smsProvider: "NOT_CONNECTED", whatsappProvider: "NOT_CONNECTED", pushProvider: "NOT_CONNECTED", smsSender: "", whatsappSender: "" },
  legal: { gstInformation: "", fssaiInformation: "", supportPhone: "", supportEmail: "partners@orderking.in", socialLinks: { instagram: "", facebook: "", x: "" } },
  support: { phone: "", email: "partners@orderking.in", helpCenter: "" },
  featureFlags: {
    restaurant_ai: true,
    restaurant_analytics: true,
    promotions: true,
    advanced_inventory: false,
    multi_outlet: true,
    whatsapp_notifications: false,
    sms_notifications: false,
    pwa: true,
    offline_mode: true,
    new_order_sound: true,
  } satisfies Record<FeatureFlagName, boolean>,
  dataLabels: ["SIMULATED", "REAL", "VERIFIED"] as const,
} as const;

export type PlatformConfig = typeof platformConfig;
export type DataLabel = (typeof platformConfig.dataLabels)[number];
export type AppLanguage = (typeof platformConfig.localization.supportedLanguages)[number];

export function isFeatureEnabled(flag: FeatureFlagName): boolean {
  return platformConfig.featureFlags[flag];
}
