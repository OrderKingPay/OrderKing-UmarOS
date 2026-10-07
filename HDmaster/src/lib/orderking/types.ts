export type DataMode = "SIMULATED" | "PRODUCTION";
export type MetricLabel = "ACTUAL" | "ESTIMATE" | "FORECAST" | "MODEL" | "SIMULATED";

export type Metric<T = number> = {
  value: T;
  label: MetricLabel;
};

export type AlertSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATION";

export const DEFAULT_ORG_ID = "org_orderking";
export const DEFAULT_CITY_ID = "city_karimganj";
export const DEFAULT_CITY_NAME = "Karimganj";

export type PlatformSettings = {
  commissionBps: number;
  townCommissionBps: number;
  longDistanceCommissionBps: number;
  paymentFeeBps: number;
  serviceFeePaise: number;
  riderBasePaise: number;
  riderDistancePaise: number;
  riderLongDistanceBonusPaise: number;
  dayModeRadiusKm: number;
  eveningModeRadiusKm: number;
  nightModeRadiusKm: number;
  dayModeStartHour: number;
  eveningModeStartHour: number;
  nightModeStartHour: number;
  nightModeEndHour: number;
  longDistanceMovPaise: number;
  highwayExpressMovPaise: number;
  offerTimeoutSeconds: number;
  otpRequired: boolean;
  codEnabled: boolean;
  cancellationWindowMinutes: number;
  refundLimitPaise: number;
  supportSlaMinutes: number;
  languages: string[];
  defaultLanguage: string;
  dynamicAlgorithmMode?: "AUTO" | "FORCE_OFF_PEAK" | "FORCE_PEAK" | "OFF";
  offPeakBudgetCeilingPaise?: number;
  strategicDispatchRadiusKm?: number;
  bountyEscalationPaise?: number;
  sampleCatalogueBanner?: boolean;
  launchMode?: "development" | "pilot" | "live";
};

export const DEFAULT_SETTINGS: PlatformSettings = {
  commissionBps: 2200, // 22% standard Zomato-matching
  townCommissionBps: 2200, // 22% town
  longDistanceCommissionBps: 2800, // 28% long distance (Nilambazar/Fakirabazar/Highway)
  paymentFeeBps: 180,
  serviceFeePaise: 750, // ₹7.50 platform convenience fee
  riderBasePaise: 2500, // ₹25
  riderDistancePaise: 800, // ₹8/km
  riderLongDistanceBonusPaise: 6000, // ₹60 bonus for trips > 6km
  dayModeRadiusKm: 25.0, // up to 25.0 km until 6:00 PM
  eveningModeRadiusKm: 8.0, // 7 to 8.0 km from 6:00 PM till 11:00 PM
  nightModeRadiusKm: 4.0, // 3 to 4.0 km from 11:00 PM until 4:00 AM
  dayModeStartHour: 4, // 04:00 AM
  eveningModeStartHour: 18, // 06:00 PM
  nightModeStartHour: 23, // 11:00 PM
  nightModeEndHour: 4, // 04:00 AM
  longDistanceMovPaise: 49900, // ₹499 MOV for 5-12 km
  highwayExpressMovPaise: 99900, // ₹999 MOV for 12-25 km
  offerTimeoutSeconds: 30,
  otpRequired: true,
  codEnabled: true,
  cancellationWindowMinutes: 8,
  refundLimitPaise: 50000,
  supportSlaMinutes: 30,
  languages: ["en", "bn"],
  defaultLanguage: "en",
  dynamicAlgorithmMode: "AUTO",
  offPeakBudgetCeilingPaise: 14900,
  strategicDispatchRadiusKm: 8.0,
  bountyEscalationPaise: 1000,
  sampleCatalogueBanner: false,
  launchMode: "live",
};

export type BrandingConfig = {
  appName: string;
  logoSvg: string | null;
  faviconSvg: string | null;
  colorBg: string;
  colorFg: string;
  colorPrimary: string;
  colorPrimaryFg: string;
  colorAccent: string;
  fontDisplay: string | null;
  fontBody: string | null;
  domain: string | null;
  tagline: string;
  appStoreName: string;
  notificationSender: string;
  invoiceBranding: string;
  customerBranding: string;
  restaurantBranding: string;
  riderBranding: string;
  adminBranding: string;
  legalCompanyName: string;
  supportEmail: string;
  supportPhone: string;
};

export const DEFAULT_BRANDING: BrandingConfig = {
  appName: "Order King",
  logoSvg: null,
  faviconSvg: null,
  colorBg: "#0c0d0c",
  colorFg: "#f2f0ea",
  colorPrimary: "#e8e4dc",
  colorPrimaryFg: "#0c0d0c",
  colorAccent: "#c8ccd4",
  fontDisplay: "Newsreader",
  fontBody: "IBM Plex Sans",
  domain: "orderking.in",
  tagline: "Order like a King.",
  appStoreName: "Order King",
  notificationSender: "Order King",
  invoiceBranding: "Order King Foods",
  customerBranding: "Order King",
  restaurantBranding: "Order King Partner",
  riderBranding: "Order King Rider",
  adminBranding: "Order King Command",
  legalCompanyName: "Order King Foods Private Limited",
  supportEmail: "support@orderking.in",
  supportPhone: "+91 38xxx xxxxx",
};

export const FEATURE_FLAG_KEYS = [
  "customer_ai",
  "restaurant_ai",
  "rider_ai",
  "live_tracking",
  "cod",
  "delivery_otp",
  "pod_photo",
  "qr_pickup",
  "multi_order",
  "loyalty",
  "referrals",
  "subscriptions",
  "advertising",
  "advanced_dispatch",
  "whatsapp",
  "sms",
  "push",
  "restaurant_premium",
  "corporate_orders",
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];
export type FlagState = "ON" | "OFF" | "ROLLOUT_PERCENTAGE";
