import type { Branding, DynamicPricingConfig, FeatureFlags, PlatformConfig, ProgressiveDistanceSlabs, RiderDisciplineConfig } from "./types.ts";

export const DEFAULT_BRANDING: Branding = {
  appName: "OrderKing Partner",
  riderFacingBrand: "OrderKing Partner",
  tagline: "Deliver like a King. 100% Payout Transparency.",
  logoUrl: "/brand/logo.svg",
  faviconUrl: "/favicon.svg",
  colors: {
    primary: "#E5A93C",
    background: "#08090C",
    foreground: "#F8FAFC",
  },
  domain: "partner.orderking.in",
  notificationSender: "OrderKing Partner",
  legalCompanyName: "Order King Foods Private Limited",
  appStoreName: "OrderKing Partner",
  invoiceBrand: "OrderKing Partner",
};

export const DEFAULT_FLAGS: FeatureFlags = {
  rider_ai: true,
  live_tracking: true,
  cod: true,
  delivery_otp: true,
  pod_photo: true,
  qr_pickup: true,
  multi_order: false,
  incentives: true,
  safety_tools: true,
  whatsapp: false,
  sms: false,
  push_notifications: false,
  offline_mode: true,
  advanced_dispatch: false,
};

export const DEFAULT_DISCIPLINE_CONFIG: RiderDisciplineConfig = {
  enabled: true,
  floatingCashLimitInr: 2000,
  cancellationPenaltyBeforePickupInr: 25,
  cancellationPenaltyPostPickupType: "FULL_ORDER",
  cancellationPenaltyPostPickupCustomInr: 150,
  coolingOffConsecutiveRejections: 3,
  coolingOffAcceptanceRateThresholdPct: 70,
  coolingOffDurationMinutes: 15,
  upiDepositVpa: "orderking.treasury@okaxis",
};

export const DEFAULT_DISTANCE_SLABS: ProgressiveDistanceSlabs = {
  slab1RatePerKmPaise: 1200, // ₹12/km
  slab2RatePerKmPaise: 1400, // ₹14/km
  slab3RatePerKmPaise: 1600, // ₹16/km
  ldoBonusPaise: 2000, // ₹20 LDO bonus
};

export const DEFAULT_DYNAMIC_PRICING_CONFIG: DynamicPricingConfig = {
  cityTier: "TIER_1",
  tier1BaseFloorPaise: 3500, // ₹35
  tier2BaseFloorPaise: 3000, // ₹30
  tier3BaseFloorPaise: 2500, // ₹25
  pickupFeePaise: 2000,
  dropFeePaise: 1500,
  basePayPaise: 3500,
  defaultRatePerKmPaise: 1200,
  distanceSlabs: DEFAULT_DISTANCE_SLABS,
  waitGraceMinutes: 6,
  waitRatePerMinPaise: 100, // ₹1/min
  waitCapPaise: 3000, // ₹30
  floatingCashLimitInr: 2000,
  coolingOffDurationMinutes: 15,
  payoutCycleDay: "Wednesday",
  kingAiAutonomousResolution: true,
};

export const DEFAULT_CONFIG: PlatformConfig = {
  branding: DEFAULT_BRANDING,
  flags: DEFAULT_FLAGS,
  offerTimeoutSeconds: 45,
  locationUpdateIntervalSeconds: 20,
  maxDeliveryRadiusKm: 12,
  travelFactor: 1.35,
  etaBufferMinutes: 3,
  otpMaxAttempts: 5,
  otpSuspiciousThreshold: 3,
  podMaxBytes: 180_000,
  payoutFrequency: "weekly",
  supportedLocales: ["en", "hi", "bn", "as", "ta", "te", "ml", "kn", "mr", "gu"],
  defaultLocale: "en",
  pickupVerification: "ORDER_CODE",
  podMethods: ["OTP", "PHOTO"],
  dataMode: "LIVE",
  supportPhone: "+91-3843-000000",
  emergencyPhone: "112",
  locationRetentionHours: 24,
  gpsHistoryMaxPings: 40,
  volunteerEnabled: false,
  discipline: DEFAULT_DISCIPLINE_CONFIG,
  pricing: DEFAULT_DYNAMIC_PRICING_CONFIG,
  payoutCycleDay: "Wednesday",
  kingAiAutonomousResolution: true,
};

export const ALLOWED_OFFER_TIMEOUTS = [30, 45, 60, 90] as const;

export function resolveOfferTimeout(seconds: number): number {
  if (ALLOWED_OFFER_TIMEOUTS.includes(seconds as (typeof ALLOWED_OFFER_TIMEOUTS)[number])) {
    return seconds;
  }
  if (seconds >= 20 && seconds <= 180) return Math.round(seconds);
  return DEFAULT_CONFIG.offerTimeoutSeconds;
}
