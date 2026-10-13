/**
 * UMAR OS - Universal Configuration Registry
 * Authority: HDmaster Principal Systems Architect & Universal Configuration Authority
 *
 * Operational Settings Covered:
 * 1. Brand themes & typography
 * 2. Individual restaurant commission rates & merchant policies
 * 3. Dynamic delivery fee & rider incentives
 * 4. Geographic polygons and active service schedules
 * 5. Dynamic surge pricing and order throttle limits
 * 6. Cancellation and refund rules
 * 7. AI model routing and plugin connector activations
 * 8. Emergency kill-switches and system freeze
 *
 * Architectural Features:
 * - Schema validation for every setting via Zod
 * - Strict sequential versioning (every change increments version number)
 * - Immutable, tamper-evident audit log (who, when, old, new, reason)
 * - Atomic rollback to any previous configuration version
 * - Cross-app propagation payload export (Customer, Partner, Rider, Admin) with SHA-256 integrity checks
 */

import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";

// ============================================================================
// 1. BRAND THEMES & TYPOGRAPHY SCHEMA
// ============================================================================

export const BrandColorsSchema = z.object({
  primary: z.string().min(1),
  primaryForeground: z.string().min(1),
  background: z.string().min(1),
  foreground: z.string().min(1),
  accent: z.string().min(1),
  muted: z.string().min(1),
  border: z.string().min(1),
  card: z.string().min(1),
});

export const TypographyConfigSchema = z.object({
  fontDisplay: z.string().min(1),
  fontBody: z.string().min(1),
  fontMono: z.string().min(1),
  baseFontSizePx: z.number().positive(),
  headingFontWeight: z.number().int().min(100).max(900),
  bodyFontWeight: z.number().int().min(100).max(900),
});

export const BrandThemesSchema = z.object({
  appName: z.string().min(1),
  tagline: z.string(),
  logoSvg: z.string().nullable(),
  faviconSvg: z.string().nullable(),
  colors: BrandColorsSchema,
  typography: TypographyConfigSchema,
  domain: z.string(),
  appStoreName: z.string(),
  notificationSender: z.string(),
  invoiceBranding: z.string(),
  customerBranding: z.string(),
  restaurantBranding: z.string(),
  riderBranding: z.string(),
  adminBranding: z.string(),
  legalCompanyName: z.string(),
  supportEmail: z.string().email(),
  supportPhone: z.string(),
});

export type BrandColors = z.infer<typeof BrandColorsSchema>;
export type TypographyConfig = z.infer<typeof TypographyConfigSchema>;
export type BrandThemesConfig = z.infer<typeof BrandThemesSchema>;

// ============================================================================
// 2. RESTAURANT COMMISSION RATES & MERCHANT POLICIES SCHEMA
// ============================================================================

export const RestaurantPolicyOverrideSchema = z.object({
  restaurantId: z.string().min(1),
  customCommissionBps: z.number().int().min(0).max(10000).optional(),
  fixedCommissionPerOrderPaise: z.number().int().min(0).optional(),
  packagingFeeMaxPaise: z.number().int().min(0).optional(),
  allowSelfDelivery: z.boolean().optional(),
  instantPayoutEnabled: z.boolean().optional(),
  merchantExclusive: z.boolean().optional(),
  maxInflightOrders: z.number().int().positive().optional(),
  specialPolicies: z.record(z.string(), z.unknown()).optional(),
  notes: z.string().optional(),
});

export const MerchantPoliciesSchema = z.object({
  defaultCommissionBps: z.number().int().min(0).max(10000), // e.g. 2200 = 22%
  defaultTownCommissionBps: z.number().int().min(0).max(10000),
  defaultLongDistanceCommissionBps: z.number().int().min(0).max(10000),
  paymentFeeBps: z.number().int().min(0).max(10000),
  payoutCycle: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"]),
  minPayoutPaise: z.number().int().min(0),
  onboardingFeePaise: z.number().int().min(0),
  gstApplicable: z.boolean(),
  tdsRateBps: z.number().int().min(0).max(10000),
  autoAcceptOrders: z.boolean(),
  defaultPrepTimeMinutes: z.number().int().positive(),
  restaurantOverrides: z.record(z.string(), RestaurantPolicyOverrideSchema),
});

export type RestaurantPolicyOverride = z.infer<typeof RestaurantPolicyOverrideSchema>;
export type MerchantPoliciesConfig = z.infer<typeof MerchantPoliciesSchema>;

// ============================================================================
// 3. DYNAMIC DELIVERY FEE & RIDER INCENTIVES SCHEMA
// ============================================================================

export const DeliveryFeeRulesSchema = z.object({
  customerBaseFeePaise: z.number().int().min(0),
  customerPerKmFeePaise: z.number().int().min(0),
  freeDeliveryThresholdPaise: z.number().int().min(0).nullable(),
  serviceFeePaise: z.number().int().min(0),
  smallOrderFeePaise: z.number().int().min(0),
  smallOrderThresholdPaise: z.number().int().min(0),
});

export const RiderIncentivesSchema = z.object({
  riderBasePaise: z.number().int().min(0),
  riderDistancePaisePerKm: z.number().int().min(0),
  riderLongDistanceThresholdKm: z.number().positive(),
  riderLongDistanceBonusPaise: z.number().int().min(0),
  nightBonusPaise: z.number().int().min(0),
  rainBonusPaise: z.number().int().min(0),
  peakHourBonusPaise: z.number().int().min(0),
  bountyEscalationPaise: z.number().int().min(0),
  fuelAllowancePerKmPaise: z.number().int().min(0),
  minGuaranteedHourlyPaise: z.number().int().min(0),
});

export const DeliveryAndRiderIncentivesSchema = z.object({
  deliveryFees: DeliveryFeeRulesSchema,
  riderIncentives: RiderIncentivesSchema,
});

export type DeliveryFeeRules = z.infer<typeof DeliveryFeeRulesSchema>;
export type RiderIncentives = z.infer<typeof RiderIncentivesSchema>;
export type DeliveryAndRiderIncentivesConfig = z.infer<typeof DeliveryAndRiderIncentivesSchema>;

// ============================================================================
// 4. GEOGRAPHIC POLYGONS & ACTIVE SERVICE SCHEDULES SCHEMA
// ============================================================================

export const LatLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const ServiceZonePolygonSchema = z.object({
  zoneId: z.string().min(1),
  zoneName: z.string().min(1),
  cityId: z.string().min(1),
  coordinates: z.array(LatLngSchema).min(3),
  serviceType: z.enum(["STANDARD", "HIGHWAY_EXPRESS", "SUBURBAN", "RESTRICTED", "PILOT"]),
  maxDeliveryRadiusKm: z.number().positive(),
  active: z.boolean(),
  movPaise: z.number().int().min(0),
});

export const OperatingWindowSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6), // 0 = Sunday
  openTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

export const ServiceSchedulesSchema = z.object({
  timezone: z.string().min(1),
  dayModeStartHour: z.number().int().min(0).max(23),
  eveningModeStartHour: z.number().int().min(0).max(23),
  nightModeStartHour: z.number().int().min(0).max(23),
  nightModeEndHour: z.number().int().min(0).max(23),
  activeDaysOfWeek: z.array(z.number().int().min(0).max(6)),
  operatingWindows: z.array(OperatingWindowSchema),
});

export const GeoAndSchedulesSchema = z.object({
  zones: z.array(ServiceZonePolygonSchema),
  schedules: ServiceSchedulesSchema,
});

export type LatLng = z.infer<typeof LatLngSchema>;
export type ServiceZonePolygon = z.infer<typeof ServiceZonePolygonSchema>;
export type OperatingWindow = z.infer<typeof OperatingWindowSchema>;
export type ServiceSchedules = z.infer<typeof ServiceSchedulesSchema>;
export type GeoAndSchedulesConfig = z.infer<typeof GeoAndSchedulesSchema>;

// ============================================================================
// 5. DYNAMIC SURGE PRICING & ORDER THROTTLE LIMITS SCHEMA
// ============================================================================

export const SurgePricingSchema = z.object({
  mode: z.enum(["OFF", "MANUAL", "AUTO_ALGORITHMIC"]),
  multiplier: z.number().min(1.0).max(5.0),
  rainSurgePaise: z.number().int().min(0),
  nightSurgePaise: z.number().int().min(0),
  festivalSurgePaise: z.number().int().min(0),
  maxSurgeMultiplier: z.number().min(1.0).max(5.0),
  triggerDemandOrdersPerMin: z.number().int().positive(),
});

export const OrderThrottleLimitsSchema = z.object({
  maxConcurrentActiveOrders: z.number().int().positive(),
  maxOrdersPerMinute: z.number().int().positive(),
  maxOrdersPerMerchantInflight: z.number().int().positive(),
  rateLimitWindowSeconds: z.number().int().positive(),
  queueOrdersWhenThrottled: z.boolean(),
  throttleAction: z.enum(["REJECT_NEW", "QUEUE", "SURGE_DISINCENTIVIZE"]),
});

export const SurgeAndThrottleSchema = z.object({
  surgePricing: SurgePricingSchema,
  throttleLimits: OrderThrottleLimitsSchema,
});

export type SurgePricing = z.infer<typeof SurgePricingSchema>;
export type OrderThrottleLimits = z.infer<typeof OrderThrottleLimitsSchema>;
export type SurgeAndThrottleConfig = z.infer<typeof SurgeAndThrottleSchema>;

// ============================================================================
// 6. CANCELLATION & REFUND RULES SCHEMA
// ============================================================================

export const CancellationRulesSchema = z.object({
  cancellationWindowMinutes: z.number().int().min(0),
  allowCustomerCancelBeforePrep: z.boolean(),
  customerCancelPenaltyPaise: z.number().int().min(0),
  merchantPrepCancellationPenaltyPct: z.number().min(0).max(100),
  riderAssignedCancellationPenaltyPct: z.number().min(0).max(100),
});

export const RefundRulesSchema = z.object({
  refundLimitPaise: z.number().int().min(0),
  autoRefundApprovalLimitPaise: z.number().int().min(0),
  requireReceiptProof: z.boolean(),
  allowPartialRefunds: z.boolean(),
  slaResolutionMinutes: z.number().int().positive(),
  refundDeductionAccount: z.enum(["ESCROW", "MERCHANT_FLOAT", "PLATFORM_RESERVE"]),
});

export const CancellationAndRefundSchema = z.object({
  cancellation: CancellationRulesSchema,
  refund: RefundRulesSchema,
});

export type CancellationRules = z.infer<typeof CancellationRulesSchema>;
export type RefundRules = z.infer<typeof RefundRulesSchema>;
export type CancellationAndRefundConfig = z.infer<typeof CancellationAndRefundSchema>;

// ============================================================================
// 7. AI MODEL ROUTING & PLUGIN CONNECTOR ACTIVATIONS SCHEMA
// ============================================================================

export const ModelRoutingSchema = z.object({
  masterExecutiveModel: z.string().min(1),
  fastDispatchModel: z.string().min(1),
  visionValidationModel: z.string().min(1),
  cognitiveEngineModel: z.string().min(1),
  fallbackModel: z.string().min(1),
  temperature: z.number().min(0).max(2.0),
  maxTokens: z.number().int().positive(),
  enableAutonomousActions: z.boolean(),
});

export const PluginConnectorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum([
    "PAYMENT_GATEWAY",
    "SMS_PROVIDER",
    "WHATSAPP_BOT",
    "MAPS_PROVIDER",
    "WEATHER_API",
    "ERP_CONNECTOR",
    "CUSTOM",
  ]),
  enabled: z.boolean(),
  endpoint: z.string().url().optional(),
  config: z.record(z.string(), z.unknown()),
  timeoutMs: z.number().int().positive(),
});

export const AiRoutingAndPluginsSchema = z.object({
  modelRouting: ModelRoutingSchema,
  pluginConnectors: z.array(PluginConnectorSchema),
});

export type ModelRouting = z.infer<typeof ModelRoutingSchema>;
export type PluginConnector = z.infer<typeof PluginConnectorSchema>;
export type AiRoutingAndPluginsConfig = z.infer<typeof AiRoutingAndPluginsSchema>;

// ============================================================================
// 8. EMERGENCY KILL-SWITCHES & SYSTEM FREEZE SCHEMA
// ============================================================================

export const SystemFreezeSchema = z.object({
  frozen: z.boolean(),
  freezeReason: z.string().nullable(),
  freezeTimestamp: z.string().nullable(),
  frozenBy: z.string().nullable(),
  allowInflightOrderCompletion: z.boolean(),
});

export const KillSwitchesSchema = z.object({
  disableCustomerCheckout: z.boolean(),
  disableRiderDispatch: z.boolean(),
  disableMerchantOrderAcceptance: z.boolean(),
  disableOnlinePayments: z.boolean(),
  disableCod: z.boolean(),
  disableAiAutonomousActions: z.boolean(),
  disableExternalWebhooks: z.boolean(),
  disableMarketingPromotions: z.boolean(),
});

export const KillSwitchesAndFreezeSchema = z.object({
  systemFreeze: SystemFreezeSchema,
  killSwitches: KillSwitchesSchema,
});

export type SystemFreeze = z.infer<typeof SystemFreezeSchema>;
export type KillSwitches = z.infer<typeof KillSwitchesSchema>;
export type KillSwitchesAndFreezeConfig = z.infer<typeof KillSwitchesAndFreezeSchema>;

// ============================================================================
// UNIVERSAL CONFIG ROOT SCHEMA
// ============================================================================

export const UniversalConfigSchema = z.object({
  brandThemes: BrandThemesSchema,
  merchantPolicies: MerchantPoliciesSchema,
  deliveryAndRiderIncentives: DeliveryAndRiderIncentivesSchema,
  geoAndSchedules: GeoAndSchedulesSchema,
  surgeAndThrottle: SurgeAndThrottleSchema,
  cancellationAndRefund: CancellationAndRefundSchema,
  aiRoutingAndPlugins: AiRoutingAndPluginsSchema,
  killSwitchesAndFreeze: KillSwitchesAndFreezeSchema,
});

export type UniversalConfig = z.infer<typeof UniversalConfigSchema>;
export type ConfigSectionKey = keyof UniversalConfig;

// ============================================================================
// AUDIT LOG & SNAPSHOT DEFINITIONS
// ============================================================================

export interface AuditActor {
  userId: string;
  employeeId?: string;
  roleKey?: string;
  ipAddress?: string;
}

export interface AuditLogEntry {
  id: string;
  version: number;
  timestamp: string;
  actor: AuditActor;
  section: ConfigSectionKey | "ROOT" | "ROLLBACK";
  path: string;
  oldValue: unknown;
  newValue: unknown;
  reason: string;
  metadata?: Record<string, unknown>;
}

export interface ConfigVersionSnapshot {
  version: number;
  timestamp: string;
  actor: AuditActor;
  reason: string;
  config: UniversalConfig;
  snapshotHash: string;
}

export interface AuditLogQueryOptions {
  section?: ConfigSectionKey | "ROOT" | "ROLLBACK";
  actorUserId?: string;
  minVersion?: number;
  maxVersion?: number;
  sinceTimestamp?: string;
  limit?: number;
}

// ============================================================================
// CROSS-APP PROPAGATION CONTRACTS
// ============================================================================

export type DownstreamTarget = "customer" | "partner" | "rider" | "all";

export interface PropagationContext {
  restaurantId?: string;
  cityId?: string;
  zoneId?: string;
}

export interface CustomerPropagationData {
  appName: string;
  tagline: string;
  branding: {
    colors: BrandColors;
    typography: TypographyConfig;
    logoSvg: string | null;
  };
  deliveryPricing: {
    customerBaseFeePaise: number;
    customerPerKmFeePaise: number;
    freeDeliveryThresholdPaise: number | null;
    serviceFeePaise: number;
    smallOrderFeePaise: number;
    smallOrderThresholdPaise: number;
  };
  surge: {
    mode: "OFF" | "MANUAL" | "AUTO_ALGORITHMIC";
    multiplier: number;
    rainSurgePaise: number;
    festivalSurgePaise: number;
  };
  schedules: {
    timezone: string;
    operatingWindows: OperatingWindow[];
  };
  cancellation: {
    cancellationWindowMinutes: number;
    allowCustomerCancelBeforePrep: boolean;
    customerCancelPenaltyPaise: number;
  };
  killSwitches: {
    checkoutDisabled: boolean;
    onlinePaymentsDisabled: boolean;
    codDisabled: boolean;
    isSystemFrozen: boolean;
  };
}

export interface PartnerPropagationData {
  restaurantBranding: string;
  supportPhone: string;
  supportEmail: string;
  merchantPolicy: {
    commissionBps: number;
    payoutCycle: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";
    autoAcceptOrders: boolean;
    defaultPrepTimeMinutes: number;
    maxInflightOrders: number;
  };
  throttle: {
    maxOrdersPerMerchantInflight: number;
    rateLimitWindowSeconds: number;
  };
  cancellation: {
    merchantPrepCancellationPenaltyPct: number;
  };
  killSwitches: {
    orderAcceptanceDisabled: boolean;
    isSystemFrozen: boolean;
  };
}

export interface RiderPropagationData {
  riderBranding: string;
  incentives: {
    riderBasePaise: number;
    riderDistancePaisePerKm: number;
    riderLongDistanceThresholdKm: number;
    riderLongDistanceBonusPaise: number;
    nightBonusPaise: number;
    rainBonusPaise: number;
    peakHourBonusPaise: number;
    bountyEscalationPaise: number;
    fuelAllowancePerKmPaise: number;
  };
  schedules: {
    nightModeStartHour: number;
    nightModeEndHour: number;
  };
  surge: {
    multiplier: number;
    rainSurgePaise: number;
  };
  killSwitches: {
    riderDispatchDisabled: boolean;
    isSystemFrozen: boolean;
  };
}

export interface PropagationPayload<T = unknown> {
  payloadHash: string;
  configVersion: number;
  generatedAt: string;
  target: DownstreamTarget;
  systemFreeze: boolean;
  data: T;
}

// ============================================================================
// SYSTEM ERRORS
// ============================================================================

export class ConfigurationValidationError extends Error {
  readonly code = "CONFIG_VALIDATION_FAILED";
  readonly issues: z.ZodIssue[];

  constructor(message: string, issues: z.ZodIssue[]) {
    super(message);
    this.name = "ConfigurationValidationError";
    this.issues = issues;
  }
}

export class ConfigurationRollbackError extends Error {
  readonly code = "CONFIG_ROLLBACK_FAILED";
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationRollbackError";
  }
}

export class ConfigurationFreezeError extends Error {
  readonly code = "SYSTEM_FREEZE_VIOLATION";
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationFreezeError";
  }
}

// ============================================================================
// DEFAULT CANONICAL CONFIGURATION (KARIMGANJ / ASSAM HUB)
// ============================================================================

export const DEFAULT_UNIVERSAL_CONFIG: UniversalConfig = {
  brandThemes: {
    appName: "Order King",
    tagline: "Order like a King.",
    logoSvg: null,
    faviconSvg: null,
    colors: {
      primary: "#e8e4dc",
      primaryForeground: "#0c0d0c",
      background: "#0c0d0c",
      foreground: "#f2f0ea",
      accent: "#c8ccd4",
      muted: "#27272a",
      border: "#3f3f46",
      card: "#18181b",
    },
    typography: {
      fontDisplay: "Newsreader",
      fontBody: "IBM Plex Sans",
      fontMono: "JetBrains Mono",
      baseFontSizePx: 16,
      headingFontWeight: 700,
      bodyFontWeight: 400,
    },
    domain: "orderking.in",
    appStoreName: "Order King",
    notificationSender: "Order King",
    invoiceBranding: "Order King Foods",
    customerBranding: "Order King",
    restaurantBranding: "Order King Partner",
    riderBranding: "Order King Rider",
    adminBranding: "Order King Command",
    legalCompanyName: "Order King Foods Private Limited",
    supportEmail: "support@orderking.in",
    supportPhone: "+91 3843 260000",
  },
  merchantPolicies: {
    defaultCommissionBps: 2200, // 22%
    defaultTownCommissionBps: 2200,
    defaultLongDistanceCommissionBps: 2800, // 28%
    paymentFeeBps: 180, // 1.8%
    payoutCycle: "WEEKLY",
    minPayoutPaise: 10000, // ₹100
    onboardingFeePaise: 0,
    gstApplicable: true,
    tdsRateBps: 100, // 1%
    autoAcceptOrders: false,
    defaultPrepTimeMinutes: 20,
    restaurantOverrides: {},
  },
  deliveryAndRiderIncentives: {
    deliveryFees: {
      customerBaseFeePaise: 2500, // ₹25
      customerPerKmFeePaise: 800, // ₹8/km
      freeDeliveryThresholdPaise: 49900, // ₹499
      serviceFeePaise: 750, // ₹7.50
      smallOrderFeePaise: 1500, // ₹15
      smallOrderThresholdPaise: 14900, // ₹149
    },
    riderIncentives: {
      riderBasePaise: 2500, // ₹25
      riderDistancePaisePerKm: 800, // ₹8/km
      riderLongDistanceThresholdKm: 6.0,
      riderLongDistanceBonusPaise: 6000, // ₹60
      nightBonusPaise: 1500, // ₹15
      rainBonusPaise: 2000, // ₹20
      peakHourBonusPaise: 1000, // ₹10
      bountyEscalationPaise: 1000, // ₹10/10min unassigned
      fuelAllowancePerKmPaise: 300, // ₹3/km
      minGuaranteedHourlyPaise: 8000, // ₹80/hr
    },
  },
  geoAndSchedules: {
    zones: [
      {
        zoneId: "zone_karimganj_core",
        zoneName: "Karimganj Core Town",
        cityId: "city_karimganj",
        coordinates: [
          { lat: 24.863, lng: 92.355 },
          { lat: 24.875, lng: 92.368 },
          { lat: 24.868, lng: 92.38 },
          { lat: 24.855, lng: 92.365 },
        ],
        serviceType: "STANDARD",
        maxDeliveryRadiusKm: 8.0,
        active: true,
        movPaise: 9900, // ₹99
      },
      {
        zoneId: "zone_highway_express",
        zoneName: "NH-37 Corridor & Suburban Express",
        cityId: "city_karimganj",
        coordinates: [
          { lat: 24.85, lng: 92.34 },
          { lat: 24.89, lng: 92.34 },
          { lat: 24.89, lng: 92.42 },
          { lat: 24.85, lng: 92.42 },
        ],
        serviceType: "HIGHWAY_EXPRESS",
        maxDeliveryRadiusKm: 25.0,
        active: true,
        movPaise: 49900, // ₹499
      },
    ],
    schedules: {
      timezone: "Asia/Kolkata",
      dayModeStartHour: 4,
      eveningModeStartHour: 18,
      nightModeStartHour: 23,
      nightModeEndHour: 4,
      activeDaysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      operatingWindows: [
        { dayOfWeek: 0, openTime: "04:00", closeTime: "23:59" },
        { dayOfWeek: 1, openTime: "04:00", closeTime: "23:59" },
        { dayOfWeek: 2, openTime: "04:00", closeTime: "23:59" },
        { dayOfWeek: 3, openTime: "04:00", closeTime: "23:59" },
        { dayOfWeek: 4, openTime: "04:00", closeTime: "23:59" },
        { dayOfWeek: 5, openTime: "04:00", closeTime: "23:59" },
        { dayOfWeek: 6, openTime: "04:00", closeTime: "23:59" },
      ],
    },
  },
  surgeAndThrottle: {
    surgePricing: {
      mode: "AUTO_ALGORITHMIC",
      multiplier: 1.0,
      rainSurgePaise: 2000,
      nightSurgePaise: 1500,
      festivalSurgePaise: 2500,
      maxSurgeMultiplier: 3.0,
      triggerDemandOrdersPerMin: 15,
    },
    throttleLimits: {
      maxConcurrentActiveOrders: 500,
      maxOrdersPerMinute: 60,
      maxOrdersPerMerchantInflight: 25,
      rateLimitWindowSeconds: 60,
      queueOrdersWhenThrottled: true,
      throttleAction: "QUEUE",
    },
  },
  cancellationAndRefund: {
    cancellation: {
      cancellationWindowMinutes: 8,
      allowCustomerCancelBeforePrep: true,
      customerCancelPenaltyPaise: 0,
      merchantPrepCancellationPenaltyPct: 50,
      riderAssignedCancellationPenaltyPct: 80,
    },
    refund: {
      refundLimitPaise: 50000, // ₹500
      autoRefundApprovalLimitPaise: 10000, // ₹100
      requireReceiptProof: false,
      allowPartialRefunds: true,
      slaResolutionMinutes: 30,
      refundDeductionAccount: "ESCROW",
    },
  },
  aiRoutingAndPlugins: {
    modelRouting: {
      masterExecutiveModel: "gemini-2.5-pro",
      fastDispatchModel: "gemini-2.5-flash",
      visionValidationModel: "gemini-2.5-flash",
      cognitiveEngineModel: "gemini-2.5-pro",
      fallbackModel: "claude-3-7-sonnet",
      temperature: 0.2,
      maxTokens: 4096,
      enableAutonomousActions: true,
    },
    pluginConnectors: [
      {
        id: "conn_razorpay",
        name: "Razorpay Payment Gateway",
        type: "PAYMENT_GATEWAY",
        enabled: true,
        endpoint: "https://api.razorpay.com/v1",
        config: { environment: "production", webhookEvents: ["payment.captured", "refund.processed"] },
        timeoutMs: 5000,
      },
      {
        id: "conn_maps",
        name: "Google Maps Platform",
        type: "MAPS_PROVIDER",
        enabled: true,
        endpoint: "https://maps.googleapis.com",
        config: { distanceMatrixTier: "standard", geocodingEnabled: true },
        timeoutMs: 3000,
      },
    ],
  },
  killSwitchesAndFreeze: {
    systemFreeze: {
      frozen: false,
      freezeReason: null,
      freezeTimestamp: null,
      frozenBy: null,
      allowInflightOrderCompletion: true,
    },
    killSwitches: {
      disableCustomerCheckout: false,
      disableRiderDispatch: false,
      disableMerchantOrderAcceptance: false,
      disableOnlinePayments: false,
      disableCod: false,
      disableAiAutonomousActions: false,
      disableExternalWebhooks: false,
      disableMarketingPromotions: false,
    },
  },
};

// ============================================================================
// HELPERS
// ============================================================================

function deepClone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val)) as T;
}

function canonicalizeJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map((item) => canonicalizeJson(item)).join(",") + "]";
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const pairs = keys.map((key) => {
    return JSON.stringify(key) + ":" + canonicalizeJson(obj[key]);
  });
  return "{" + pairs.join(",") + "}";
}

function calculateSha256(content: unknown): string {
  const json = canonicalizeJson(content);
  return createHash("sha256").update(json).digest("hex");
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? T[P]
    : T[P] extends ReadonlyArray<infer U>
      ? T[P]
      : T[P] extends object
        ? DeepPartial<T[P]>
        : T[P];
};

function deepMerge<T extends Record<string, unknown>>(target: T, source: Record<string, unknown>): T {
  const output = { ...target };
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = output[key];

    if (key === "restaurantOverrides" && srcVal !== undefined) {
      (output as Record<string, unknown>)[key] = deepClone(srcVal);
      continue;
    }

    if (
      srcVal !== undefined &&
      typeof srcVal === "object" &&
      srcVal !== null &&
      !Array.isArray(srcVal) &&
      tgtVal !== undefined &&
      typeof tgtVal === "object" &&
      tgtVal !== null &&
      !Array.isArray(tgtVal)
    ) {
      (output as Record<string, unknown>)[key] = deepMerge(
        tgtVal as Record<string, unknown>,
        srcVal as Record<string, unknown>,
      );
    } else if (srcVal !== undefined) {
      (output as Record<string, unknown>)[key] = deepClone(srcVal);
    }
  }
  return output;
}

function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let curr: any = obj;
  for (const part of parts) {
    if (curr === null || curr === undefined || typeof curr !== "object") return undefined;
    curr = curr[part];
  }
  return curr;
}

function setNestedValue<T extends Record<string, unknown>>(obj: T, path: string, value: unknown): T {
  const clone = deepClone(obj);
  const parts = path.split(".");
  let curr: any = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (curr[part] === undefined || curr[part] === null || typeof curr[part] !== "object") {
      curr[part] = {};
    }
    curr = curr[part];
  }
  curr[parts[parts.length - 1]] = deepClone(value);
  return clone;
}

// ============================================================================
// UNIVERSAL CONFIGURATION REGISTRY CLASS
// ============================================================================

export class UniversalConfigRegistry {
  private currentConfig: UniversalConfig;
  private currentVersion: number;
  private readonly auditLog: AuditLogEntry[] = [];
  private readonly versionHistory: ConfigVersionSnapshot[] = [];

  constructor(
    initialConfig: DeepPartial<UniversalConfig> = {},
    initialActor: AuditActor = { userId: "system_bootstrap", roleKey: "SUPER_ADMIN" },
  ) {
    const merged = deepMerge(
      DEFAULT_UNIVERSAL_CONFIG as unknown as Record<string, unknown>,
      initialConfig as unknown as Record<string, unknown>,
    );

    const parseResult = UniversalConfigSchema.safeParse(merged);
    if (!parseResult.success) {
      throw new ConfigurationValidationError(
        "Initial configuration fails schema validation",
        parseResult.error.issues,
      );
    }

    this.currentConfig = parseResult.data;
    this.currentVersion = 1;

    const initialSnapshot: ConfigVersionSnapshot = {
      version: 1,
      timestamp: new Date().toISOString(),
      actor: initialActor,
      reason: "Initial baseline configuration created",
      config: deepClone(this.currentConfig),
      snapshotHash: calculateSha256(this.currentConfig),
    };

    this.versionHistory.push(initialSnapshot);
    this.auditLog.push({
      id: randomUUID(),
      version: 1,
      timestamp: initialSnapshot.timestamp,
      actor: initialActor,
      section: "ROOT",
      path: "*",
      oldValue: null,
      newValue: deepClone(this.currentConfig),
      reason: "Initial baseline configuration initialized",
    });
  }

  /**
   * Retrieves the current immutable snapshot of the active Universal Configuration.
   */
  public getConfig(): Readonly<UniversalConfig> {
    return deepClone(this.currentConfig);
  }

  /**
   * Retrieves a specific section from the current configuration.
   */
  public getSection<K extends ConfigSectionKey>(key: K): Readonly<UniversalConfig[K]> {
    return deepClone(this.currentConfig[key]);
  }

  /**
   * Returns current configuration version number.
   */
  public getCurrentVersion(): number {
    return this.currentVersion;
  }

  /**
   * Indicates whether the entire platform is currently in a state of system freeze.
   */
  public isSystemFrozen(): boolean {
    return this.currentConfig.killSwitchesAndFreeze.systemFreeze.frozen;
  }

  /**
   * Validates an entire or partial configuration against the schema.
   */
  public validateConfig(config: unknown): { valid: boolean; issues?: z.ZodIssue[] } {
    const result = UniversalConfigSchema.safeParse(config);
    if (result.success) {
      return { valid: true };
    }
    return { valid: false, issues: result.error.issues };
  }

  /**
   * Updates an entire section with schema validation, version incrementing, and audit logging.
   */
  public updateSection<K extends ConfigSectionKey>(
    sectionKey: K,
    patch: DeepPartial<UniversalConfig[K]> | UniversalConfig[K],
    actor: AuditActor,
    reason: string,
  ): UniversalConfig {
    if (!reason || reason.trim().length === 0) {
      throw new Error("Audit reason is required for any configuration update");
    }

    // Merge into section
    const currentSection = this.currentConfig[sectionKey];
    const updatedSectionRaw = deepMerge(
      currentSection as unknown as Record<string, unknown>,
      patch as unknown as Record<string, unknown>,
    );

    // Schema validation for the specific section
    const sectionSchemaMap: Record<ConfigSectionKey, z.ZodTypeAny> = {
      brandThemes: BrandThemesSchema,
      merchantPolicies: MerchantPoliciesSchema,
      deliveryAndRiderIncentives: DeliveryAndRiderIncentivesSchema,
      geoAndSchedules: GeoAndSchedulesSchema,
      surgeAndThrottle: SurgeAndThrottleSchema,
      cancellationAndRefund: CancellationAndRefundSchema,
      aiRoutingAndPlugins: AiRoutingAndPluginsSchema,
      killSwitchesAndFreeze: KillSwitchesAndFreezeSchema,
    };

    const sectionSchema = sectionSchemaMap[sectionKey];
    const validation = sectionSchema.safeParse(updatedSectionRaw);
    if (!validation.success) {
      throw new ConfigurationValidationError(
        `Validation failed for configuration section '${sectionKey}'`,
        validation.error.issues,
      );
    }

    const previousConfig = deepClone(this.currentConfig);
    const oldSectionValue = deepClone(currentSection);
    const newSectionValue = validation.data as UniversalConfig[K];

    // Build candidate full config
    const candidateConfig: UniversalConfig = {
      ...this.currentConfig,
      [sectionKey]: newSectionValue,
    };

    // Full schema check
    const fullValidation = UniversalConfigSchema.safeParse(candidateConfig);
    if (!fullValidation.success) {
      throw new ConfigurationValidationError(
        `Full configuration validation failed when updating section '${sectionKey}'`,
        fullValidation.error.issues,
      );
    }

    // Increment version & apply
    const nextVersion = this.currentVersion + 1;
    const timestamp = new Date().toISOString();
    this.currentConfig = candidateConfig;
    this.currentVersion = nextVersion;

    // Record audit entry
    this.auditLog.push({
      id: randomUUID(),
      version: nextVersion,
      timestamp,
      actor,
      section: sectionKey,
      path: sectionKey,
      oldValue: oldSectionValue,
      newValue: deepClone(newSectionValue),
      reason,
    });

    // Record version snapshot
    this.versionHistory.push({
      version: nextVersion,
      timestamp,
      actor,
      reason,
      config: deepClone(this.currentConfig),
      snapshotHash: calculateSha256(this.currentConfig),
    });

    return this.getConfig();
  }

  /**
   * Sets a specific nested setting path with validation, version bump, and audit logging.
   * Example path: "merchantPolicies.restaurantOverrides.rest_01" or "surgeAndThrottle.surgePricing.multiplier"
   */
  public setSetting<K extends ConfigSectionKey>(
    sectionKey: K,
    pathInsideSection: string,
    value: unknown,
    actor: AuditActor,
    reason: string,
  ): UniversalConfig {
    if (!reason || reason.trim().length === 0) {
      throw new Error("Audit reason is required for any configuration update");
    }

    const currentSection = this.currentConfig[sectionKey];
    const oldValue = getNestedValue(currentSection, pathInsideSection);

    const updatedSection = setNestedValue(
      currentSection as unknown as Record<string, unknown>,
      pathInsideSection,
      value,
    );

    return this.updateSection(
      sectionKey,
      updatedSection as DeepPartial<UniversalConfig[K]>,
      actor,
      `[${pathInsideSection}] ${reason} (old: ${JSON.stringify(oldValue)} -> new: ${JSON.stringify(value)})`,
    );
  }

  /**
   * Atomic rollback to any previous version in version history.
   * Rollback increments the version number and records an immutable audit entry.
   */
  public rollbackToVersion(targetVersion: number, actor: AuditActor, reason: string): UniversalConfig {
    if (!reason || reason.trim().length === 0) {
      throw new Error("Audit reason is required for a configuration rollback");
    }

    if (targetVersion === this.currentVersion) {
      throw new ConfigurationRollbackError(
        `Cannot rollback to target version ${targetVersion}: already at this version.`,
      );
    }

    const targetSnapshot = this.versionHistory.find((v) => v.version === targetVersion);
    if (!targetSnapshot) {
      throw new ConfigurationRollbackError(
        `Target version ${targetVersion} was not found in version history.`,
      );
    }

    // Verify target config validates against current schema
    const validation = UniversalConfigSchema.safeParse(targetSnapshot.config);
    if (!validation.success) {
      throw new ConfigurationRollbackError(
        `Target version ${targetVersion} does not satisfy current schema constraints: ${validation.error.message}`,
      );
    }

    const previousConfig = deepClone(this.currentConfig);
    const rolledBackConfig = deepClone(validation.data);
    const nextVersion = this.currentVersion + 1;
    const timestamp = new Date().toISOString();

    this.currentConfig = rolledBackConfig;
    this.currentVersion = nextVersion;

    const auditEntry: AuditLogEntry = {
      id: randomUUID(),
      version: nextVersion,
      timestamp,
      actor,
      section: "ROLLBACK",
      path: "*",
      oldValue: previousConfig,
      newValue: rolledBackConfig,
      reason: `Rollback from v${this.currentVersion - 1} to v${targetVersion}: ${reason}`,
      metadata: {
        rolledBackFromVersion: nextVersion - 1,
        rolledBackToVersion: targetVersion,
        targetSnapshotHash: targetSnapshot.snapshotHash,
      },
    };

    this.auditLog.push(auditEntry);

    this.versionHistory.push({
      version: nextVersion,
      timestamp,
      actor,
      reason: `Rollback to v${targetVersion}: ${reason}`,
      config: deepClone(this.currentConfig),
      snapshotHash: calculateSha256(this.currentConfig),
    });

    return this.getConfig();
  }

  /**
   * Activates emergency system freeze immediately.
   */
  public triggerSystemFreeze(
    actor: AuditActor,
    reason: string,
    allowInflightOrderCompletion = true,
  ): UniversalConfig {
    return this.updateSection(
      "killSwitchesAndFreeze",
      {
        systemFreeze: {
          frozen: true,
          freezeReason: reason,
          freezeTimestamp: new Date().toISOString(),
          frozenBy: actor.userId,
          allowInflightOrderCompletion,
        },
      },
      actor,
      `EMERGENCY SYSTEM FREEZE: ${reason}`,
    );
  }

  /**
   * Lifts emergency system freeze.
   */
  public liftSystemFreeze(actor: AuditActor, reason: string): UniversalConfig {
    return this.updateSection(
      "killSwitchesAndFreeze",
      {
        systemFreeze: {
          frozen: false,
          freezeReason: null,
          freezeTimestamp: null,
          frozenBy: null,
          allowInflightOrderCompletion: true,
        },
      },
      actor,
      `SYSTEM FREEZE LIFTED: ${reason}`,
    );
  }

  /**
   * Toggles an individual emergency kill switch.
   */
  public toggleKillSwitch(
    switchKey: keyof KillSwitches,
    enabled: boolean,
    actor: AuditActor,
    reason: string,
  ): UniversalConfig {
    const currentKillSwitches = this.currentConfig.killSwitchesAndFreeze.killSwitches;
    return this.updateSection(
      "killSwitchesAndFreeze",
      {
        killSwitches: {
          ...currentKillSwitches,
          [switchKey]: enabled,
        },
      },
      actor,
      `Kill switch '${switchKey}' set to ${enabled}: ${reason}`,
    );
  }

  /**
   * Sets individual restaurant commission override and policy.
   */
  public setRestaurantPolicyOverride(
    override: RestaurantPolicyOverride,
    actor: AuditActor,
    reason: string,
  ): UniversalConfig {
    const currentOverrides = this.currentConfig.merchantPolicies.restaurantOverrides;
    return this.updateSection(
      "merchantPolicies",
      {
        restaurantOverrides: {
          ...currentOverrides,
          [override.restaurantId]: override,
        },
      },
      actor,
      `Restaurant override updated for ${override.restaurantId}: ${reason}`,
    );
  }

  /**
   * Removes individual restaurant commission override.
   */
  public removeRestaurantPolicyOverride(
    restaurantId: string,
    actor: AuditActor,
    reason: string,
  ): UniversalConfig {
    const overrides = { ...this.currentConfig.merchantPolicies.restaurantOverrides };
    delete overrides[restaurantId];
    return this.updateSection(
      "merchantPolicies",
      {
        restaurantOverrides: overrides,
      },
      actor,
      `Removed restaurant override for ${restaurantId}: ${reason}`,
    );
  }

  /**
   * Returns immutable audit log queryable by options.
   */
  public getAuditLog(options?: AuditLogQueryOptions): ReadonlyArray<AuditLogEntry> {
    let result = [...this.auditLog];

    if (options) {
      if (options.section) {
        result = result.filter((entry) => entry.section === options.section);
      }
      if (options.actorUserId) {
        result = result.filter((entry) => entry.actor.userId === options.actorUserId);
      }
      if (options.minVersion !== undefined) {
        result = result.filter((entry) => entry.version >= options.minVersion!);
      }
      if (options.maxVersion !== undefined) {
        result = result.filter((entry) => entry.version <= options.maxVersion!);
      }
      if (options.sinceTimestamp) {
        result = result.filter((entry) => entry.timestamp >= options.sinceTimestamp!);
      }
      if (options.limit !== undefined && options.limit > 0) {
        result = result.slice(-options.limit);
      }
    }

    return Object.freeze(result.map((e) => deepClone(e)));
  }

  /**
   * Returns complete history of version snapshots.
   */
  public getVersionHistory(): ReadonlyArray<ConfigVersionSnapshot> {
    return Object.freeze(this.versionHistory.map((s) => deepClone(s)));
  }

  /**
   * Exports sanitized, cross-app propagation payload tailored for downstream apps.
   * Generates a cryptographic SHA-256 payloadHash for client verification.
   */
  public exportPropagationPayload(
    target: DownstreamTarget = "all",
    context: PropagationContext = {},
  ): PropagationPayload {
    const generatedAt = new Date().toISOString();
    const systemFreeze = this.isSystemFrozen();
    const config = this.currentConfig;

    let payloadData: unknown;

    if (target === "customer") {
      const customerData: CustomerPropagationData = {
        appName: config.brandThemes.appName,
        tagline: config.brandThemes.tagline,
        branding: {
          colors: config.brandThemes.colors,
          typography: config.brandThemes.typography,
          logoSvg: config.brandThemes.logoSvg,
        },
        deliveryPricing: {
          customerBaseFeePaise: config.deliveryAndRiderIncentives.deliveryFees.customerBaseFeePaise,
          customerPerKmFeePaise: config.deliveryAndRiderIncentives.deliveryFees.customerPerKmFeePaise,
          freeDeliveryThresholdPaise:
            config.deliveryAndRiderIncentives.deliveryFees.freeDeliveryThresholdPaise,
          serviceFeePaise: config.deliveryAndRiderIncentives.deliveryFees.serviceFeePaise,
          smallOrderFeePaise: config.deliveryAndRiderIncentives.deliveryFees.smallOrderFeePaise,
          smallOrderThresholdPaise:
            config.deliveryAndRiderIncentives.deliveryFees.smallOrderThresholdPaise,
        },
        surge: {
          mode: config.surgeAndThrottle.surgePricing.mode,
          multiplier: config.surgeAndThrottle.surgePricing.multiplier,
          rainSurgePaise: config.surgeAndThrottle.surgePricing.rainSurgePaise,
          festivalSurgePaise: config.surgeAndThrottle.surgePricing.festivalSurgePaise,
        },
        schedules: {
          timezone: config.geoAndSchedules.schedules.timezone,
          operatingWindows: config.geoAndSchedules.schedules.operatingWindows,
        },
        cancellation: {
          cancellationWindowMinutes: config.cancellationAndRefund.cancellation.cancellationWindowMinutes,
          allowCustomerCancelBeforePrep:
            config.cancellationAndRefund.cancellation.allowCustomerCancelBeforePrep,
          customerCancelPenaltyPaise:
            config.cancellationAndRefund.cancellation.customerCancelPenaltyPaise,
        },
        killSwitches: {
          checkoutDisabled: config.killSwitchesAndFreeze.killSwitches.disableCustomerCheckout,
          onlinePaymentsDisabled: config.killSwitchesAndFreeze.killSwitches.disableOnlinePayments,
          codDisabled: config.killSwitchesAndFreeze.killSwitches.disableCod,
          isSystemFrozen: systemFreeze,
        },
      };
      payloadData = customerData;
    } else if (target === "partner") {
      const restOverride = context.restaurantId
        ? config.merchantPolicies.restaurantOverrides[context.restaurantId]
        : undefined;

      const effectiveCommission =
        restOverride?.customCommissionBps ?? config.merchantPolicies.defaultCommissionBps;

      const partnerData: PartnerPropagationData = {
        restaurantBranding: config.brandThemes.restaurantBranding,
        supportPhone: config.brandThemes.supportPhone,
        supportEmail: config.brandThemes.supportEmail,
        merchantPolicy: {
          commissionBps: effectiveCommission,
          payoutCycle: config.merchantPolicies.payoutCycle,
          autoAcceptOrders: config.merchantPolicies.autoAcceptOrders,
          defaultPrepTimeMinutes: config.merchantPolicies.defaultPrepTimeMinutes,
          maxInflightOrders:
            restOverride?.maxInflightOrders ??
            config.surgeAndThrottle.throttleLimits.maxOrdersPerMerchantInflight,
        },
        throttle: {
          maxOrdersPerMerchantInflight:
            config.surgeAndThrottle.throttleLimits.maxOrdersPerMerchantInflight,
          rateLimitWindowSeconds: config.surgeAndThrottle.throttleLimits.rateLimitWindowSeconds,
        },
        cancellation: {
          merchantPrepCancellationPenaltyPct:
            config.cancellationAndRefund.cancellation.merchantPrepCancellationPenaltyPct,
        },
        killSwitches: {
          orderAcceptanceDisabled:
            config.killSwitchesAndFreeze.killSwitches.disableMerchantOrderAcceptance,
          isSystemFrozen: systemFreeze,
        },
      };
      payloadData = partnerData;
    } else if (target === "rider") {
      const riderData: RiderPropagationData = {
        riderBranding: config.brandThemes.riderBranding,
        incentives: {
          riderBasePaise: config.deliveryAndRiderIncentives.riderIncentives.riderBasePaise,
          riderDistancePaisePerKm:
            config.deliveryAndRiderIncentives.riderIncentives.riderDistancePaisePerKm,
          riderLongDistanceThresholdKm:
            config.deliveryAndRiderIncentives.riderIncentives.riderLongDistanceThresholdKm,
          riderLongDistanceBonusPaise:
            config.deliveryAndRiderIncentives.riderIncentives.riderLongDistanceBonusPaise,
          nightBonusPaise: config.deliveryAndRiderIncentives.riderIncentives.nightBonusPaise,
          rainBonusPaise: config.deliveryAndRiderIncentives.riderIncentives.rainBonusPaise,
          peakHourBonusPaise: config.deliveryAndRiderIncentives.riderIncentives.peakHourBonusPaise,
          bountyEscalationPaise:
            config.deliveryAndRiderIncentives.riderIncentives.bountyEscalationPaise,
          fuelAllowancePerKmPaise:
            config.deliveryAndRiderIncentives.riderIncentives.fuelAllowancePerKmPaise,
        },
        schedules: {
          nightModeStartHour: config.geoAndSchedules.schedules.nightModeStartHour,
          nightModeEndHour: config.geoAndSchedules.schedules.nightModeEndHour,
        },
        surge: {
          multiplier: config.surgeAndThrottle.surgePricing.multiplier,
          rainSurgePaise: config.surgeAndThrottle.surgePricing.rainSurgePaise,
        },
        killSwitches: {
          riderDispatchDisabled: config.killSwitchesAndFreeze.killSwitches.disableRiderDispatch,
          isSystemFrozen: systemFreeze,
        },
      };
      payloadData = riderData;
    } else {
      // "all" - Complete validated configuration payload
      payloadData = deepClone(config);
    }

    const payloadHash = calculateSha256(payloadData);

    return {
      payloadHash,
      configVersion: this.currentVersion,
      generatedAt,
      target,
      systemFreeze,
      data: payloadData,
    };
  }

  /**
   * Validates whether a propagation payload's hash matches its internal data.
   */
  public static validatePayloadIntegrity(payload: PropagationPayload): boolean {
    if (!payload || !payload.payloadHash || payload.data === undefined) {
      return false;
    }
    const calculated = calculateSha256(payload.data);
    return calculated === payload.payloadHash;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const universalConfigRegistry = new UniversalConfigRegistry();
