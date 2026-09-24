import type { Branding, FeatureFlags, PlatformConfig } from "./types.ts";

export const DEFAULT_BRANDING: Branding = {
  appName: "Order King Rider",
  riderFacingBrand: "Order King Rider",
  tagline: "Deliver like a King. Get paid clearly.",
  logoUrl: "/brand/logo.svg",
  faviconUrl: "/favicon.svg",
  colors: {
    primary: "#1F4A43",
    background: "#F1EEE8",
    foreground: "#171614",
  },
  domain: "rider.orderking.in",
  notificationSender: "Order King",
  legalCompanyName: "Order King Foods Private Limited",
  appStoreName: "Order King Rider",
  invoiceBrand: "Order King",
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
  supportedLocales: ["en", "bn", "as", "hi"],
  defaultLocale: "en",
  pickupVerification: "ORDER_CODE",
  podMethods: ["OTP", "PHOTO"],
  dataMode: "LIVE",
  supportPhone: "+91-3843-000000",
  emergencyPhone: "112",
  locationRetentionHours: 24,
  gpsHistoryMaxPings: 40,
  volunteerEnabled: false,
};

export const ALLOWED_OFFER_TIMEOUTS = [30, 45, 60, 90] as const;

export function resolveOfferTimeout(seconds: number): number {
  if (ALLOWED_OFFER_TIMEOUTS.includes(seconds as (typeof ALLOWED_OFFER_TIMEOUTS)[number])) {
    return seconds;
  }
  if (seconds >= 20 && seconds <= 180) return Math.round(seconds);
  return DEFAULT_CONFIG.offerTimeoutSeconds;
}
