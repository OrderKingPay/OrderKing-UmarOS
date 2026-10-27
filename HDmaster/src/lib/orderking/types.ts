export type DataMode = "executeD" | "PRODUCTION";
export type MetricLabel = "ACTUAL" | "ESTIMATE" | "FORECAST" | "MODEL" | "executeD";

export type Metric<T = number> = {
  value: T;
  label: MetricLabel;
};

export type AlertSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATION";

export type ThreatZonePolygon = {
  id: string;
  name: string;
  severity: "HIGH" | "CRITICAL" | "BLOCKED";
  reason: string;
  polygon: [number, number][]; // [lat, lng]
  active: boolean;
  createdAt: string;
  updatedAt?: string;
};

export const DEFAULT_THREAT_ZONES: ThreatZonePolygon[] = [
  {
    id: "threat_nh37_unlit",
    name: "NH-37 Forest Border Corridor",
    severity: "CRITICAL",
    reason: "Zero street lighting, reported late-night ambushes and zero police coverage.",
    polygon: [
      [24.8900, 92.3100],
      [24.9100, 92.3300],
      [24.9050, 92.3600],
      [24.8750, 92.3350],
    ],
    active: true,
    createdAt: "2026-10-27T00:00:00.000Z",
  },
  {
    id: "threat_canal_isolated",
    name: "Old Canal Embankment Route",
    severity: "HIGH",
    reason: "Unpaved single-lane terrain with high monsoon waterlogging and poor cellular reception.",
    polygon: [
      [24.8400, 92.3400],
      [24.8550, 92.3650],
      [24.8450, 92.3800],
      [24.8300, 92.3550],
    ],
    active: true,
    createdAt: "2026-10-27T00:00:00.000Z",
  },
];

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
  riderDiscipline?: RiderDisciplineSettings;
  rainSurgeActive?: boolean;
  rainSurgePaise?: number;
  nightSurchargeActive?: boolean;
  nightSurchargePaise?: number;
  demandSurgeMultiplier?: number;
  modules?: PlatformModulesConfig;
  pricingDeliveryRules?: PricingDeliveryRulesConfig;
    dynamicBranding?: DynamicBrandingConfig;
  lateNightCodSafetyLockout?: boolean;
  lateNightCodCutoffTime?: string;
  threatZones?: ThreatZonePolygon[];
};

export type PlatformModulesConfig = {
  travel: boolean;
  utilities: boolean;
  aiTutor: boolean;
  jobs: boolean;
  courier: boolean;
  foodDelivery: boolean;
};

export type PricingDeliveryRulesConfig = {
  courierBaseFareInr: number;
  courierPerKmRateInr: number;
  courierBasePaise?: number;
  courierPerKmPaise?: number;
  nightFeeInr: number;
  nightFeePaise?: number;
  nightFeeActive: boolean;
  platformCommissionBps: number;
  townCommissionBps?: number;
  longDistanceCommissionBps?: number;
};

export type AnnouncementBannerConfig = {
  enabled: boolean;
  text: string;
  linkUrl?: string;
  bgGradient?: string;
  badgeText?: string;
};

export type FeaturedCityHub = {
  id: string;
  name: string;
  state?: string;
  active: boolean;
  tier?: string;
};

export type DynamicBrandingConfig = {
  customAccentColor: string;
  announcementBanner: AnnouncementBannerConfig;
  featuredCityHubs: FeaturedCityHub[];
};

export const DEFAULT_PLATFORM_MODULES: PlatformModulesConfig = {
  travel: true,
  utilities: true,
  aiTutor: true,
  jobs: true,
  courier: true,
  foodDelivery: true,
};

export const DEFAULT_PRICING_DELIVERY_RULES: PricingDeliveryRulesConfig = {
  courierBaseFareInr: 30, // ₹30 default
  courierPerKmRateInr: 10, // ₹10/km default
  courierBasePaise: 3000,
  courierPerKmPaise: 1000,
  nightFeeInr: 15,
  nightFeePaise: 1500,
  nightFeeActive: false,
  platformCommissionBps: 1800,
  townCommissionBps: 2200,
  longDistanceCommissionBps: 2800,
};

export const DEFAULT_FEATURED_CITY_HUBS: FeaturedCityHub[] = [
  { id: "city_cp", name: "Connaught Place, New Delhi", state: "Delhi", active: true, tier: "TIER_1" },
  { id: "city_karimganj", name: "Karimganj Core Hub", state: "Assam", active: true, tier: "TIER_3" },
  { id: "city_silchar", name: "Silchar Valley Hub", state: "Assam", active: true, tier: "TIER_2" },
  { id: "city_guwahati", name: "Guwahati Gateway", state: "Assam", active: true, tier: "TIER_2" },
  { id: "city_bengaluru", name: "Bengaluru Tech Corridor", state: "Karnataka", active: true, tier: "TIER_1" },
  { id: "city_mumbai", name: "Mumbai Metropolitan", state: "Maharashtra", active: true, tier: "TIER_1" },
  { id: "city_kolkata", name: "Kolkata Cultural Hub", state: "West Bengal", active: true, tier: "TIER_1" },
];

export const DEFAULT_DYNAMIC_BRANDING: DynamicBrandingConfig = {
  customAccentColor: "#D97706",
  announcementBanner: {
    enabled: false,
    text: "",
    linkUrl: "",
    bgGradient: "from-amber-600 via-orange-600 to-amber-700",
    badgeText: "",
  },
  featuredCityHubs: DEFAULT_FEATURED_CITY_HUBS,
};

export type RiderDisciplineSettings = {
  enabled: boolean;
  floating_cash_limit_inr: number;
  cancellation_penalty_before_pickup_inr: number;
  cancellation_penalty_post_pickup_type: "FULL_ORDER" | "CUSTOM_FLAT" | "NONE";
  cancellation_penalty_post_pickup_custom_inr: number;
  cooling_off_consecutive_rejections: number;
  cooling_off_acceptance_rate_threshold_pct: number;
  cooling_off_duration_minutes: number;
  upi_deposit_vpa: string;
  enable_instant_deposit_qr: boolean;
  emergency_override_enabled: boolean;
};

export const DEFAULT_RIDER_DISCIPLINE_SETTINGS: RiderDisciplineSettings = {
  enabled: true,
  floating_cash_limit_inr: 2000,
  cancellation_penalty_before_pickup_inr: 25,
  cancellation_penalty_post_pickup_type: "FULL_ORDER",
  cancellation_penalty_post_pickup_custom_inr: 150,
  cooling_off_consecutive_rejections: 3,
  cooling_off_acceptance_rate_threshold_pct: 70,
  cooling_off_duration_minutes: 15,
  upi_deposit_vpa: "9395065587@ybl",
  enable_instant_deposit_qr: true,
  emergency_override_enabled: true,
};

export const DEFAULT_SETTINGS: PlatformSettings = {
  commissionBps: 2200, // 22% standard Dominant Legacy Aggregator matching
  townCommissionBps: 2200, // 22% town
  longDistanceCommissionBps: 2800, // 28% long distance (Nilambazar/Fakirabazar/Highway)
  paymentFeeBps: 180,
  serviceFeePaise: 750, // ₹7.50 platform convenience fee
  riderBasePaise: 2500, // ₹25
  riderDistancePaise: 800, // ₹8/km
  riderLongDistanceBonusPaise: 6000, // ₹60 bonus for trips > 6km
  dayModeRadiusKm: 12.0, // 12.0 km Day radius (approved by founder) // up to 25.0 km until 6:00 PM
  eveningModeRadiusKm: 7.5, // Contracted evening delivery radius (7.5 km) from 6:00 PM till 11:00 PM
  nightModeRadiusKm: 3.5, // 3.5 km Late-Night Security radius (approved by founder) // 3 to 4.0 km from 11:00 PM until 4:00 AM
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
  riderDiscipline: DEFAULT_RIDER_DISCIPLINE_SETTINGS,
  rainSurgeActive: false,
  rainSurgePaise: 2500,
  nightSurchargeActive: false,
  nightSurchargePaise: 1500,
  demandSurgeMultiplier: 1.0,
  modules: DEFAULT_PLATFORM_MODULES,
  pricingDeliveryRules: DEFAULT_PRICING_DELIVERY_RULES,
    dynamicBranding: DEFAULT_DYNAMIC_BRANDING,
  lateNightCodSafetyLockout: true,
  lateNightCodCutoffTime: "22:30",
  threatZones: DEFAULT_THREAT_ZONES,
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
