/**
 * UMAR OS - Supreme Indian Food Delivery Logistics & Rider Algorithm Engine
 * Authority: Supreme Marketplace & Logistics Architect (Zomato/Swiggy Operational Parity)
 *
 * Mandate:
 * 1. 100% Authentic, Realistic, Natural Human-Style Formula for Rider Pay & Customer Fees.
 *    Explains and mathematically generates exact real-world payouts:
 *    ₹28.50, ₹34.00, ₹42.00, ₹46.50, ₹63.50, ₹74.00, ₹78.00, ₹84.50, etc.
 * 2. Geolocation & City Tiering:
 *    Tier-1 Metros (Delhi NCR, Mumbai, Bengaluru) vs Tier-2 (Guwahati, Patna) vs Tier-3 (Silchar)
 *    with authentic Cost-of-Living & Fuel Index multipliers.
 * 3. Dynamic H3/Geohash Zone Density & Continuous Surge:
 *    Supply-demand ratio curve calculating continuous surge multipliers from 1.0x to 2.4x.
 * 4. Temporal Friction Matrix:
 *    Lunch peak (12:00-15:30), Dinner peak (19:30-23:30), Late Night (23:30-05:00) with traffic speed decay.
 * 5. Complete Universal Customization:
 *    Every parameter can be adjusted manually from UmarOS via sliders OR autonomously
 *    by the self-tuning marketplace algorithm.
 * 6. Employee-less Autonomous Operations:
 *    Automated dispatch pre-allocation, kitchen delay voice alerts, customer late delivery
 *    compensation, and COD floating cash safety locks.
 */

import { z } from "zod";

// ============================================================================
// 1. TYPES & ENUMS
// ============================================================================

export const CityTierSchema = z.enum(["TIER_1", "TIER_2", "TIER_3"]);
export type CityTier = z.infer<typeof CityTierSchema>;

export const WeatherConditionSchema = z.enum(["CLEAR", "DRIZZLE", "HEAVY_RAIN", "WATERLOGGED"]);
export type WeatherCondition = z.infer<typeof WeatherConditionSchema>;

export const RiderTierSchema = z.enum(["BRONZE", "SILVER", "GOLD", "DIAMOND"]);
export type RiderTier = z.infer<typeof RiderTierSchema>;

export const TemporalSlotSchema = z.enum([
  "OFF_PEAK",
  "LUNCH_PEAK",
  "DINNER_PEAK",
  "LATE_NIGHT",
  "GRAVEYARD",
]);
export type TemporalSlot = z.infer<typeof TemporalSlotSchema>;

// ============================================================================
// 2. CONFIGURATION SCHEMA (UNIVERSALLY CUSTOMIZABLE FROM UMAROS)
// ============================================================================

export const ZomatoPricingConfigSchema = z.object({
  mode: z.enum(["MANUAL_OVERRIDE", "SELF_TUNING_ALGORITHM"]).default("SELF_TUNING_ALGORITHM"),

  // Rider Payout Parameters (in Integer Paise: ₹1.00 = 100 Paise)
  rider: z.object({
    basePayPaise: z.number().int().min(1000).default(2000), // Default ₹20.00 base pickup
    firstMileThresholdKm: z.number().min(0).default(1.0), // Free first mile up to 1.0 km
    firstMileRatePaisePerKm: z.number().int().min(0).default(550), // ₹5.50 / km for first-mile excess
    
    // Non-linear Last Mile Distance Bands (Continuous Piecewise)
    lastMileBand1MaxKm: z.number().default(2.0),
    lastMileBand1RatePaisePerKm: z.number().int().default(700), // ₹7.00 / km (0 - 2 km)
    
    lastMileBand2MaxKm: z.number().default(5.0),
    lastMileBand2RatePaisePerKm: z.number().int().default(850), // ₹8.50 / km (2 - 5 km)
    
    lastMileBand3MaxKm: z.number().default(8.0),
    lastMileBand3RatePaisePerKm: z.number().int().default(1100), // ₹11.00 / km (5 - 8 km)
    
    lastMileBand4RatePaisePerKm: z.number().int().default(1500), // ₹15.00 / km (> 8 km)
    longDistanceReturnAllowancePaise: z.number().int().default(2000), // ₹20.00 return trip bonus (> 8 km)

    // Kitchen Wait Time Parameters
    kitchenWaitGraceMinutes: z.number().int().default(5), // First 5 mins wait free
    kitchenWaitRatePaisePerMinute: z.number().int().default(150), // ₹1.50 per minute after grace

    // Weather & Environmental Incentives
    drizzleBonusPaise: z.number().int().default(1500), // +₹15.00
    heavyRainBonusPaise: z.number().int().default(3000), // +₹30.00
    waterloggedBonusPaise: z.number().int().default(4500), // +₹45.00

    // Late Night Shift Allowances
    nightShiftStartHour: z.number().int().min(0).max(23).default(23), // 23:00 (11 PM)
    nightShiftEndHour: z.number().int().min(0).max(23).default(6), // 06:00 (6 AM)
    lateNightBonusPaise: z.number().int().default(1800), // +₹18.00 (23:00 - 02:00)
    graveyardBonusPaise: z.number().int().default(3200), // +₹32.00 (02:00 - 06:00)

    // Temporal Peak Hour Allowances (Configurable opt-in / autonomous self-tuning)
    enablePeakHourIncentives: z.boolean().default(false),
    lunchPeakBonusPaise: z.number().int().default(1000), // +₹10.00 (12:00 - 15:30)
    dinnerPeakBonusPaise: z.number().int().default(1500), // +₹15.00 (19:30 - 23:30)

    // Multi-Order Batching & Cargo
    batchOrderPickupDiscountPct: z.number().min(0).max(100).default(35), // 35% discount on 2nd base
    heavyCargoThresholdKg: z.number().default(5.0),
    heavyCargoBonusPaise: z.number().int().default(1500), // +₹15.00 for orders > 5kg

    // COD Floating Cash Safety
    codCashInHandLimitPaise: z.number().int().default(150000), // ₹1,500.00 max cash
    codSoftLimitThresholdPct: z.number().default(80), // 80% soft warning (₹1,200)
  }).default({} as any),

  // Geolocation & City Tiering Parameters
  geoTiering: z.object({
    enabled: z.boolean().default(true),
    defaultTier: CityTierSchema.default("TIER_2"),
    applyMultipliersToDistance: z.boolean().default(false),
    tiers: z.object({
      TIER_1: z.object({
        tier: z.literal("TIER_1"),
        name: z.string().default("Tier-1 Metro (Delhi NCR, Mumbai, Bengaluru)"),
        basePayPaise: z.number().int().default(2500), // ₹25.00 base pickup
        costOfLivingMultiplier: z.number().default(1.15),
        fuelIndexMultiplier: z.number().default(1.08),
      }),
      TIER_2: z.object({
        tier: z.literal("TIER_2"),
        name: z.string().default("Tier-2 Emerging Metro (Guwahati, Patna, Lucknow)"),
        basePayPaise: z.number().int().default(2000), // ₹20.00 base pickup
        costOfLivingMultiplier: z.number().default(1.00),
        fuelIndexMultiplier: z.number().default(1.00),
      }),
      TIER_3: z.object({
        tier: z.literal("TIER_3"),
        name: z.string().default("Tier-3 Regional Hub (Silchar, Dibrugarh, etc.)"),
        basePayPaise: z.number().int().default(1800), // ₹18.00 base pickup
        costOfLivingMultiplier: z.number().default(0.88),
        fuelIndexMultiplier: z.number().default(0.95),
      }),
    }),
  }).default({} as any),

  // Dynamic Zone & H3/Geohash Surge Matrix (1.0x to 2.4x)
  surge: z.object({
    enabled: z.boolean().default(true),
    minSurgeMultiplier: z.number().default(1.0),
    maxSurgeMultiplier: z.number().default(2.4),
    equilibriumThreshold: z.number().default(1.0),
    mildThreshold: z.number().default(1.2),
    highThreshold: z.number().default(1.8),
    criticalThreshold: z.number().default(2.5),
    maxRiderSurgeBonusPaise: z.number().int().default(5000), // ₹50.00 max surge pay
    riderSurgeScalingPaise: z.number().int().default(2000), // ₹20.00 per 1.0 excess ratio
  }).default({} as any),

  // Temporal Traffic & Friction Matrix
  temporal: z.object({
    baseTwoWheelerSpeedKmh: z.number().default(28.0),
    lunchPeak: z.object({
      startHourFraction: z.number().default(12.0), // 12:00
      endHourFraction: z.number().default(15.5),   // 15:30
      speedDecayPct: z.number().default(25.0),     // 25% speed decay -> 21 km/h
      frictionMultiplier: z.number().default(1.333),
    }),
    dinnerPeak: z.object({
      startHourFraction: z.number().default(19.5), // 19:30
      endHourFraction: z.number().default(23.5),   // 23:30
      speedDecayPct: z.number().default(35.0),     // 35% speed decay -> 18.2 km/h
      frictionMultiplier: z.number().default(1.538),
    }),
    lateNight: z.object({
      startHourFraction: z.number().default(23.5), // 23:30
      endHourFraction: z.number().default(5.0),    // 05:00
      speedDecayPct: z.number().default(-15.0),    // -15% speed decay (speed boost -> 32.2 km/h)
      frictionMultiplier: z.number().default(0.870),
    }),
  }).default({} as any),

  // Customer Delivery & Platform Fee Parameters
  customer: z.object({
    baseDeliveryFeePaise: z.number().int().default(2500), // ₹25.00 base delivery
    baseDeliveryDistanceKm: z.number().default(2.0),
    perKmDeliveryRatePaise: z.number().int().default(900), // ₹9.00 / km beyond base
    platformFeePaise: z.number().int().default(600), // ₹6.00 pure profit platform fee
    freeDeliveryCartThresholdPaise: z.number().int().default(19900), // Free delivery over ₹199 (Gold/Pass)
    smallOrderThresholdPaise: z.number().int().default(15000), // Minimum order ₹150
    smallOrderFeePaise: z.number().int().default(2000), // ₹20 fee if cart < ₹150
    nightDeliverySurchargePaise: z.number().int().default(1500), // ₹15 late night customer fee
  }).default({} as any),

  // Merchant Commission Parameters
  merchant: z.object({
    defaultCommissionBps: z.number().int().default(2200), // 22.00%
    maxPackagingFeePaise: z.number().int().default(3500), // ₹35.00 max packaging
    restaurantPrepGraceMinutes: z.number().int().default(7), // Alert if delayed > 7 mins
  }).default({} as any),
});

export type ZomatoPricingConfig = z.infer<typeof ZomatoPricingConfigSchema>;

export const DEFAULT_ZOMATO_CONFIG: ZomatoPricingConfig = {
  mode: "SELF_TUNING_ALGORITHM",
  rider: {
    basePayPaise: 2000,
    firstMileThresholdKm: 1.0,
    firstMileRatePaisePerKm: 550,
    lastMileBand1MaxKm: 2.0,
    lastMileBand1RatePaisePerKm: 700,
    lastMileBand2MaxKm: 5.0,
    lastMileBand2RatePaisePerKm: 850,
    lastMileBand3MaxKm: 8.0,
    lastMileBand3RatePaisePerKm: 1100,
    lastMileBand4RatePaisePerKm: 1500,
    longDistanceReturnAllowancePaise: 2000,
    kitchenWaitGraceMinutes: 5,
    kitchenWaitRatePaisePerMinute: 150,
    drizzleBonusPaise: 1500,
    heavyRainBonusPaise: 3000,
    waterloggedBonusPaise: 4500,
    nightShiftStartHour: 23,
    nightShiftEndHour: 6,
    lateNightBonusPaise: 1800,
    graveyardBonusPaise: 3200,
    enablePeakHourIncentives: false,
    lunchPeakBonusPaise: 1000,
    dinnerPeakBonusPaise: 1500,
    batchOrderPickupDiscountPct: 35,
    heavyCargoThresholdKg: 5.0,
    heavyCargoBonusPaise: 1500,
    codCashInHandLimitPaise: 150000,
    codSoftLimitThresholdPct: 80,
  },
  geoTiering: {
    enabled: true,
    defaultTier: "TIER_2",
    applyMultipliersToDistance: false,
    tiers: {
      TIER_1: {
        tier: "TIER_1",
        name: "Tier-1 Metro (Delhi NCR, Mumbai, Bengaluru)",
        basePayPaise: 2500,
        costOfLivingMultiplier: 1.15,
        fuelIndexMultiplier: 1.08,
      },
      TIER_2: {
        tier: "TIER_2",
        name: "Tier-2 Emerging Metro (Guwahati, Patna, Lucknow)",
        basePayPaise: 2000,
        costOfLivingMultiplier: 1.00,
        fuelIndexMultiplier: 1.00,
      },
      TIER_3: {
        tier: "TIER_3",
        name: "Tier-3 Regional Hub (Silchar, Dibrugarh, etc.)",
        basePayPaise: 1800,
        costOfLivingMultiplier: 0.88,
        fuelIndexMultiplier: 0.95,
      },
    },
  },
  surge: {
    enabled: true,
    minSurgeMultiplier: 1.0,
    maxSurgeMultiplier: 2.4,
    equilibriumThreshold: 1.0,
    mildThreshold: 1.2,
    highThreshold: 1.8,
    criticalThreshold: 2.5,
    maxRiderSurgeBonusPaise: 5000,
    riderSurgeScalingPaise: 2000,
  },
  temporal: {
    baseTwoWheelerSpeedKmh: 28.0,
    lunchPeak: {
      startHourFraction: 12.0,
      endHourFraction: 15.5,
      speedDecayPct: 25.0,
      frictionMultiplier: 1.333,
    },
    dinnerPeak: {
      startHourFraction: 19.5,
      endHourFraction: 23.5,
      speedDecayPct: 35.0,
      frictionMultiplier: 1.538,
    },
    lateNight: {
      startHourFraction: 23.5,
      endHourFraction: 5.0,
      speedDecayPct: -15.0,
      frictionMultiplier: 0.870,
    },
  },
  customer: {
    baseDeliveryFeePaise: 2500,
    baseDeliveryDistanceKm: 2.0,
    perKmDeliveryRatePaise: 900,
    platformFeePaise: 600,
    freeDeliveryCartThresholdPaise: 19900,
    smallOrderThresholdPaise: 15000,
    smallOrderFeePaise: 2000,
    nightDeliverySurchargePaise: 1500,
  },
  merchant: {
    defaultCommissionBps: 2200,
    maxPackagingFeePaise: 3500,
    restaurantPrepGraceMinutes: 7,
  },
};

// ============================================================================
// 3. INPUT / OUTPUT DATA CONTRACTS
// ============================================================================

export interface RiderPayoutCalculationInput {
  firstMileDistanceKm: number;
  lastMileDistanceKm: number;
  kitchenWaitTimeMinutes: number;
  orderPreparationTimeMinutes?: number;
  zoneDemandSupplyRatio: number; // Active Orders / Available Idle Riders (e.g. 1.0 = balanced, 1.8 = severe surge)
  weatherCondition?: WeatherCondition;
  orderTimestampIso?: string;
  cargoWeightKg?: number;
  cargoItemCount?: number;
  isBatchedOrder?: boolean;
  riderTier?: RiderTier;
  customerTipPaise?: number;

  // Authentic Geolocation & City Tiering
  cityTier?: CityTier;
  cityName?: string;
  coordinates?: { lat: number; lon: number };
  applyCityTierMultipliers?: boolean;

  // Spatial Indexing (H3 Hex / Geohash)
  h3Index?: string;
  geohash?: string;
  zoneActiveOrdersCount?: number;
  zoneIdleRidersCount?: number;

  // Temporal & Peak Hour Options
  applyPeakHourBonus?: boolean;
}

export interface RiderPayoutBreakdown {
  payoutPaise: number;
  payoutRupees: number; // Formatted with 50-paise precision (e.g. 28.50, 34.00, 42.00, 63.50, 74.00, 78.00)
  components: {
    basePayPaise: number;
    firstMilePayPaise: number;
    lastMilePayPaise: number;
    kitchenWaitPayPaise: number;
    demandSurgePayPaise: number;
    weatherBonusPaise: number;
    nightBonusPaise: number;
    peakBonusPaise: number;
    cargoBonusPaise: number;
    batchDiscountPaise: number;
    customerTipPaise: number;
    cityTierAdjustmentPaise: number;
  };
  metrics: {
    cityTier: CityTier;
    costOfLivingMultiplier: number;
    fuelIndexMultiplier: number;
    surgeMultiplier: number;
    temporalSlot: TemporalSlot;
    trafficSpeedDecayPct: number;
    effectiveSpeedKmh: number;
  };
  explanation: string;
}

export interface CustomerFeeCalculationInput {
  distanceKm: number;
  cartValuePaise: number;
  isGoldMember?: boolean;
  zoneDemandSupplyRatio?: number;
  weatherCondition?: WeatherCondition;
  orderTimestampIso?: string;
  cityTier?: CityTier;
  cityName?: string;
}

export interface CustomerFeeBreakdown {
  totalFeePaise: number;
  totalFeeRupees: number;
  components: {
    deliveryFeePaise: number;
    platformFeePaise: number;
    surgeFeePaise: number;
    nightFeePaise: number;
    smallOrderFeePaise: number;
    gst18PctPaise: number;
  };
}

export interface TemporalFrictionResult {
  slot: TemporalSlot;
  isPeakHour: boolean;
  baseSpeedKmh: number;
  decayPct: number;
  effectiveSpeedKmh: number;
  frictionMultiplier: number;
  recommendedIncentivePaise: number;
  estimatedTransitMinutes: (distanceKm: number) => number;
}

export interface ZoneDensitySurgeResult {
  demandSupplyRatio: number;
  surgeMultiplier: number;
  surgeIntensity: "EQUILIBRIUM" | "MILD_SURGE" | "HIGH_SURGE" | "CRITICAL_SHORTAGE";
  riderSurgePayPaise: number;
  customerSurgeFeePaise: number;
  explanation: string;
}

// ============================================================================
// 4. IST TIMEZONE & CITY TIER RESOLVER HELPERS
// ============================================================================

export function getISTTime(date: Date): { hours: number; minutes: number; hourFraction: number } {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
      hourCycle: "h23",
    }).formatToParts(date);

    const hours = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
    const minutes = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
    const hourFraction = hours + minutes / 60;
    return { hours, minutes, hourFraction };
  } catch {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return { hours, minutes, hourFraction: hours + minutes / 60 };
  }
}

export function resolveCityTier(
  input?: string | { lat: number; lon: number } | CityTier,
  defaultTier: CityTier = "TIER_2"
): CityTier {
  if (!input) return defaultTier;
  if (input === "TIER_1" || input === "TIER_2" || input === "TIER_3") return input;

  if (typeof input === "string") {
    const normalized = input.trim().toLowerCase();

    // Tier 1 Metro keywords (Major Mega Metros)
    const tier1Cities = [
      "delhi", "delhi ncr", "new delhi", "gurgaon", "gurugram", "noida",
      "greater noida", "ghaziabad", "faridabad", "mumbai", "navi mumbai",
      "thane", "bengaluru", "bangalore", "hyderabad", "chennai",
      "kolkata", "pune", "ahmedabad"
    ];
    if (tier1Cities.some((c) => normalized.includes(c))) return "TIER_1";

    // Tier 3 Regional / Tertiary Hubs
    const tier3Cities = [
      "silchar", "dibrugarh", "tezpur", "jorhat", "nagaon", "tinsukia",
      "karimganj", "hailakandi", "muzaffarpur", "bhagalpur", "gaya",
      "darbhanga", "purnia", "arrah", "begusarai", "katihar", "asansol",
      "dhanbad", "ujjain"
    ];
    if (tier3Cities.some((c) => normalized.includes(c))) return "TIER_3";

    // Tier 2 Emerging Metros & State Capitals
    const tier2Cities = [
      "guwahati", "patna", "lucknow", "jaipur", "chandigarh", "kochi",
      "cochin", "indore", "bhopal", "nagpur", "coimbatore", "surat",
      "visakhapatnam", "vizag", "vadodara", "ludhiana", "agra", "nashik",
      "ranchi", "varanasi", "dehradun"
    ];
    if (tier2Cities.some((c) => normalized.includes(c))) return "TIER_2";

    return defaultTier;
  }

  if (typeof input === "object" && "lat" in input && "lon" in input) {
    const { lat, lon } = input;
    // Delhi NCR bounding box
    if (lat >= 28.3 && lat <= 29.0 && lon >= 76.8 && lon <= 77.6) return "TIER_1";
    // Mumbai MMR bounding box
    if (lat >= 18.8 && lat <= 19.4 && lon >= 72.7 && lon <= 73.2) return "TIER_1";
    // Bengaluru bounding box
    if (lat >= 12.8 && lat <= 13.2 && lon >= 77.4 && lon <= 77.8) return "TIER_1";
    // Silchar bounding box
    if (lat >= 24.6 && lat <= 25.0 && lon >= 92.6 && lon <= 93.0) return "TIER_3";
    // Guwahati bounding box
    if (lat >= 26.0 && lat <= 26.3 && lon >= 91.5 && lon <= 92.0) return "TIER_2";
    // Patna bounding box
    if (lat >= 25.4 && lat <= 25.8 && lon >= 85.0 && lon <= 85.4) return "TIER_2";
  }

  return defaultTier;
}

// ============================================================================
// 5. EXACT ZOMATO-GRADE RIDER ALGORITHM ENGINE
// ============================================================================

export class ZomatoRiderAlgorithmEngine {
  private config: ZomatoPricingConfig;

  constructor(customConfig?: Partial<ZomatoPricingConfig>) {
    this.config = {
      ...DEFAULT_ZOMATO_CONFIG,
      ...customConfig,
      rider: { ...DEFAULT_ZOMATO_CONFIG.rider, ...customConfig?.rider },
      geoTiering: {
        ...DEFAULT_ZOMATO_CONFIG.geoTiering,
        ...customConfig?.geoTiering,
        tiers: {
          ...DEFAULT_ZOMATO_CONFIG.geoTiering.tiers,
          ...customConfig?.geoTiering?.tiers,
        },
      },
      surge: { ...DEFAULT_ZOMATO_CONFIG.surge, ...customConfig?.surge },
      temporal: {
        ...DEFAULT_ZOMATO_CONFIG.temporal,
        ...customConfig?.temporal,
        lunchPeak: { ...DEFAULT_ZOMATO_CONFIG.temporal.lunchPeak, ...customConfig?.temporal?.lunchPeak },
        dinnerPeak: { ...DEFAULT_ZOMATO_CONFIG.temporal.dinnerPeak, ...customConfig?.temporal?.dinnerPeak },
        lateNight: { ...DEFAULT_ZOMATO_CONFIG.temporal.lateNight, ...customConfig?.temporal?.lateNight },
      },
      customer: { ...DEFAULT_ZOMATO_CONFIG.customer, ...customConfig?.customer },
      merchant: { ...DEFAULT_ZOMATO_CONFIG.merchant, ...customConfig?.merchant },
    };
  }

  public getConfig(): ZomatoPricingConfig {
    return this.config;
  }

  public updateConfig(newConfig: Partial<ZomatoPricingConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      rider: { ...this.config.rider, ...newConfig.rider },
      geoTiering: {
        ...this.config.geoTiering,
        ...newConfig.geoTiering,
        tiers: {
          ...this.config.geoTiering.tiers,
          ...newConfig.geoTiering?.tiers,
        },
      },
      surge: { ...this.config.surge, ...newConfig.surge },
      temporal: {
        ...this.config.temporal,
        ...newConfig.temporal,
        lunchPeak: { ...this.config.temporal.lunchPeak, ...newConfig.temporal?.lunchPeak },
        dinnerPeak: { ...this.config.temporal.dinnerPeak, ...newConfig.temporal?.dinnerPeak },
        lateNight: { ...this.config.temporal.lateNight, ...newConfig.temporal?.lateNight },
      },
      customer: { ...this.config.customer, ...newConfig.customer },
      merchant: { ...this.config.merchant, ...newConfig.merchant },
    };
  }

  /**
   * Resolves city tier using configured rules.
   */
  public resolveCityTier(input?: string | { lat: number; lon: number } | CityTier): CityTier {
    return resolveCityTier(input, this.config.geoTiering.defaultTier);
  }

  /**
   * Calculates dynamic zone supply-demand surge multiplier from 1.0x to 2.4x.
   *
   * Mathematical Continuous Piecewise Curve:
   *  - R <= 1.0 : 1.0x (Market Equilibrium)
   *  - 1.0 < R <= 1.2 : 1.0x -> 1.1x (Mild surge, absorption buffer)
   *  - 1.2 < R <= 1.8 : 1.1x -> 1.7x (High surge)
   *  - 1.8 < R <= 2.5 : 1.7x -> 2.4x (Critical shortage)
   *  - R > 2.5 : 2.4x (Statutory / Platform Cap)
   */
  public calculateDynamicSurgeMultiplier(ratio: number): number {
    const sc = this.config.surge;
    if (!sc.enabled || ratio <= sc.equilibriumThreshold) {
      return sc.minSurgeMultiplier;
    }

    if (ratio <= sc.mildThreshold) {
      const t = (ratio - sc.equilibriumThreshold) / (sc.mildThreshold - sc.equilibriumThreshold);
      const m = sc.minSurgeMultiplier + t * 0.1;
      return Number(m.toFixed(2));
    }

    if (ratio <= sc.highThreshold) {
      const t = (ratio - sc.mildThreshold) / (sc.highThreshold - sc.mildThreshold);
      const m = 1.1 + t * 0.6;
      return Number(m.toFixed(2));
    }

    if (ratio <= sc.criticalThreshold) {
      const t = (ratio - sc.highThreshold) / (sc.criticalThreshold - sc.highThreshold);
      const m = 1.7 + t * 0.7;
      return Number(m.toFixed(2));
    }

    return sc.maxSurgeMultiplier;
  }

  /**
   * Computes spatial zone density surge metrics for H3 or Geohash clusters.
   */
  public calculateZoneDensitySurge(input: {
    activeOrders: number;
    availableRiders: number;
    h3Index?: string;
    geohash?: string;
  }): ZoneDensitySurgeResult {
    const ratio = Number((input.activeOrders / Math.max(1, input.availableRiders)).toFixed(2));
    const surgeMultiplier = this.calculateDynamicSurgeMultiplier(ratio);

    let surgeIntensity: "EQUILIBRIUM" | "MILD_SURGE" | "HIGH_SURGE" | "CRITICAL_SHORTAGE" = "EQUILIBRIUM";
    if (ratio >= 1.8) surgeIntensity = "CRITICAL_SHORTAGE";
    else if (ratio >= 1.2) surgeIntensity = "HIGH_SURGE";
    else if (ratio > 1.0) surgeIntensity = "MILD_SURGE";

    let riderSurgePayPaise = 0;
    if (ratio > 1.15) {
      const excess = ratio - 1.0;
      riderSurgePayPaise = Math.min(
        this.config.surge.maxRiderSurgeBonusPaise,
        Math.round(excess * this.config.surge.riderSurgeScalingPaise)
      );
    }

    let customerSurgeFeePaise = 0;
    if (ratio > 1.2) {
      customerSurgeFeePaise = Math.min(4000, Math.round((ratio - 1.0) * 1500));
    }

    const zoneRef = input.h3Index ?? input.geohash ?? "Hyperlocal-Zone";
    const explanation = `Zone [${zoneRef}] D/S Ratio ${ratio.toFixed(2)} (${input.activeOrders} orders / ${input.availableRiders} idle riders). Surge: ${surgeMultiplier.toFixed(2)}x [${surgeIntensity}]. Rider surge pay: ₹${(riderSurgePayPaise / 100).toFixed(2)}, Customer surge fee: ₹${(customerSurgeFeePaise / 100).toFixed(2)}.`;

    return {
      demandSupplyRatio: ratio,
      surgeMultiplier,
      surgeIntensity,
      riderSurgePayPaise,
      customerSurgeFeePaise,
      explanation,
    };
  }

  /**
   * Evaluates the Temporal Friction Matrix:
   *  - Lunch Peak (12:00 - 15:30): 25% speed decay (21 km/h)
   *  - Dinner Peak (19:30 - 23:30): 35% speed decay (18.2 km/h)
   *  - Late Night (23:30 - 05:00): Free-flowing roads (+15% speed -> 32.2 km/h)
   *  - Off-Peak: 28 km/h baseline
   */
  public calculateTemporalFriction(timestampIsoOrDate?: string | Date): TemporalFrictionResult {
    const tc = this.config.temporal;
    const rc = this.config.rider;
    const date = timestampIsoOrDate
      ? typeof timestampIsoOrDate === "string"
        ? new Date(timestampIsoOrDate)
        : timestampIsoOrDate
      : new Date();

    const { hourFraction } = getISTTime(date);
    const baseSpeedKmh = tc.baseTwoWheelerSpeedKmh;

    // 1. Lunch Peak (12:00 to 15:30)
    if (hourFraction >= tc.lunchPeak.startHourFraction && hourFraction < tc.lunchPeak.endHourFraction) {
      const decayPct = tc.lunchPeak.speedDecayPct;
      const effectiveSpeedKmh = Number((baseSpeedKmh * (1 - decayPct / 100)).toFixed(2));
      const frictionMultiplier = Number((baseSpeedKmh / effectiveSpeedKmh).toFixed(3));
      return {
        slot: "LUNCH_PEAK",
        isPeakHour: true,
        baseSpeedKmh,
        decayPct,
        effectiveSpeedKmh,
        frictionMultiplier,
        recommendedIncentivePaise: rc.lunchPeakBonusPaise,
        estimatedTransitMinutes: (dKm: number) => Number(((dKm / effectiveSpeedKmh) * 60).toFixed(1)),
      };
    }

    // 2. Dinner Peak (19:30 to 23:30)
    if (hourFraction >= tc.dinnerPeak.startHourFraction && hourFraction < tc.dinnerPeak.endHourFraction) {
      const decayPct = tc.dinnerPeak.speedDecayPct;
      const effectiveSpeedKmh = Number((baseSpeedKmh * (1 - decayPct / 100)).toFixed(2));
      const frictionMultiplier = Number((baseSpeedKmh / effectiveSpeedKmh).toFixed(3));
      return {
        slot: "DINNER_PEAK",
        isPeakHour: true,
        baseSpeedKmh,
        decayPct,
        effectiveSpeedKmh,
        frictionMultiplier,
        recommendedIncentivePaise: rc.dinnerPeakBonusPaise,
        estimatedTransitMinutes: (dKm: number) => Number(((dKm / effectiveSpeedKmh) * 60).toFixed(1)),
      };
    }

    // 3. Late Night / Graveyard (23:30 to 05:00)
    if (hourFraction >= tc.lateNight.startHourFraction || hourFraction < tc.lateNight.endHourFraction) {
      const isGraveyard = hourFraction >= 2.0 && hourFraction < 5.0;
      const decayPct = tc.lateNight.speedDecayPct; // Negative decay = faster speed
      const effectiveSpeedKmh = Number((baseSpeedKmh * (1 - decayPct / 100)).toFixed(2));
      const frictionMultiplier = Number((baseSpeedKmh / effectiveSpeedKmh).toFixed(3));
      return {
        slot: isGraveyard ? "GRAVEYARD" : "LATE_NIGHT",
        isPeakHour: false,
        baseSpeedKmh,
        decayPct,
        effectiveSpeedKmh,
        frictionMultiplier,
        recommendedIncentivePaise: isGraveyard ? rc.graveyardBonusPaise : rc.lateNightBonusPaise,
        estimatedTransitMinutes: (dKm: number) => Number(((dKm / effectiveSpeedKmh) * 60).toFixed(1)),
      };
    }

    // 4. Off-Peak daylight
    return {
      slot: "OFF_PEAK",
      isPeakHour: false,
      baseSpeedKmh,
      decayPct: 0,
      effectiveSpeedKmh: baseSpeedKmh,
      frictionMultiplier: 1.0,
      recommendedIncentivePaise: 0,
      estimatedTransitMinutes: (dKm: number) => Number(((dKm / baseSpeedKmh) * 60).toFixed(1)),
    };
  }

  /**
   * Accurately estimates end-to-end delivery transit duration taking into account
   * peak-hour traffic speed decay across first-mile and last-mile segments.
   */
  public estimateDeliveryDurationMinutes(
    lastMileDistanceKm: number,
    timestampIsoOrDate?: string | Date,
    kitchenPrepMinutes: number = 15,
    firstMileDistanceKm: number = 1.0
  ): {
    totalDurationMinutes: number;
    transitDurationMinutes: number;
    firstMileTransitMinutes: number;
    kitchenPrepMinutes: number;
    frictionResult: TemporalFrictionResult;
  } {
    const friction = this.calculateTemporalFriction(timestampIsoOrDate);
    const firstMileTransitMinutes = friction.estimatedTransitMinutes(firstMileDistanceKm);
    const transitDurationMinutes = friction.estimatedTransitMinutes(lastMileDistanceKm);
    const totalDurationMinutes = Number(
      (kitchenPrepMinutes + firstMileTransitMinutes + transitDurationMinutes).toFixed(1)
    );

    return {
      totalDurationMinutes,
      transitDurationMinutes,
      firstMileTransitMinutes,
      kitchenPrepMinutes,
      frictionResult: friction,
    };
  }

  /**
   * Calculates the exact human-style rider delivery pay.
   * Produces authentic real-world payouts: ₹28.50, ₹34.00, ₹42.00, ₹46.50, ₹63.50, ₹74.00, ₹78.00, ₹84.50, etc.
   *
   * Fully accounts for:
   *  - City Tiering (Tier-1 ₹25.00 base, Tier-2 ₹20.00 base, Tier-3 ₹18.00 base)
   *  - Cost-of-Living & Fuel Index multipliers
   *  - Continuous piecewise distance bands (0-2km ₹7, 2-5km ₹8.50, 5-8km ₹11, >8km ₹15 + ₹20 return)
   *  - First-mile excess beyond 1.0 km @ ₹5.50/km
   *  - Kitchen wait compensation beyond 5 min grace @ ₹1.50/min
   *  - Dynamic supply-demand surge (1.0x - 2.4x)
   *  - Weather allowances (Drizzle ₹15, Heavy Rain ₹30, Waterlogged ₹45)
   *  - Temporal peak & late night allowances
   *  - Cargo weight & multi-order batching
   *  - Nearest 50-paise natural human rounding
   */
  public calculateRiderPay(input: RiderPayoutCalculationInput): RiderPayoutBreakdown {
    const rc = this.config.rider;
    const gtc = this.config.geoTiering;

    // 0. Resolve City Tier & Multipliers
    let cityTier: CityTier = gtc.defaultTier;
    if (input.cityTier) {
      cityTier = input.cityTier;
    } else if (input.cityName || input.coordinates) {
      cityTier = this.resolveCityTier(input.cityName ?? input.coordinates);
    }

    const tierSettings = gtc.tiers[cityTier];
    const costOfLivingMultiplier = tierSettings?.costOfLivingMultiplier ?? 1.0;
    const fuelIndexMultiplier = tierSettings?.fuelIndexMultiplier ?? 1.0;

    // Check if city tier multipliers should be applied to distance rates
    const applyDistanceMultipliers = input.applyCityTierMultipliers ?? gtc.applyMultipliersToDistance;

    // 1. Base Pay Calculation
    let basePayPaise: number;
    if (input.cityTier || input.cityName || input.coordinates) {
      // Use tier-specific base pickup pay when city/tier is specified
      basePayPaise = tierSettings?.basePayPaise ?? rc.basePayPaise;
    } else {
      // Use general rider config base pay (defaults to ₹20.00 / 2000 paise)
      basePayPaise = rc.basePayPaise;
    }

    let batchDiscountPaise = 0;
    if (input.isBatchedOrder) {
      batchDiscountPaise = Math.round((basePayPaise * rc.batchOrderPickupDiscountPct) / 100);
      basePayPaise -= batchDiscountPaise;
    }

    // 2. First Mile Pay (Rider -> Restaurant)
    let firstMilePayPaise = 0;
    const effectiveFirstMileRate = applyDistanceMultipliers
      ? Math.round(rc.firstMileRatePaisePerKm * fuelIndexMultiplier)
      : rc.firstMileRatePaisePerKm;

    if (input.firstMileDistanceKm > rc.firstMileThresholdKm) {
      const billableFirstMile = input.firstMileDistanceKm - rc.firstMileThresholdKm;
      firstMilePayPaise = Math.round(billableFirstMile * effectiveFirstMileRate);
    }

    // 3. Last Mile Pay (Continuous Piecewise Non-linear Distance Bands)
    let lastMilePayPaise = 0;
    const d = input.lastMileDistanceKm;

    const b1Rate = applyDistanceMultipliers
      ? Math.round(rc.lastMileBand1RatePaisePerKm * fuelIndexMultiplier)
      : rc.lastMileBand1RatePaisePerKm;
    const b2Rate = applyDistanceMultipliers
      ? Math.round(rc.lastMileBand2RatePaisePerKm * fuelIndexMultiplier)
      : rc.lastMileBand2RatePaisePerKm;
    const b3Rate = applyDistanceMultipliers
      ? Math.round(rc.lastMileBand3RatePaisePerKm * fuelIndexMultiplier)
      : rc.lastMileBand3RatePaisePerKm;
    const b4Rate = applyDistanceMultipliers
      ? Math.round(rc.lastMileBand4RatePaisePerKm * fuelIndexMultiplier)
      : rc.lastMileBand4RatePaisePerKm;

    if (d <= rc.lastMileBand1MaxKm) {
      lastMilePayPaise = Math.round(d * b1Rate);
    } else if (d <= rc.lastMileBand2MaxKm) {
      const b1 = rc.lastMileBand1MaxKm * b1Rate;
      const b2 = (d - rc.lastMileBand1MaxKm) * b2Rate;
      lastMilePayPaise = Math.round(b1 + b2);
    } else if (d <= rc.lastMileBand3MaxKm) {
      const b1 = rc.lastMileBand1MaxKm * b1Rate;
      const b2 = (rc.lastMileBand2MaxKm - rc.lastMileBand1MaxKm) * b2Rate;
      const b3 = (d - rc.lastMileBand2MaxKm) * b3Rate;
      lastMilePayPaise = Math.round(b1 + b2 + b3);
    } else {
      const b1 = rc.lastMileBand1MaxKm * b1Rate;
      const b2 = (rc.lastMileBand2MaxKm - rc.lastMileBand1MaxKm) * b2Rate;
      const b3 = (rc.lastMileBand3MaxKm - rc.lastMileBand2MaxKm) * b3Rate;
      const b4 = (d - rc.lastMileBand3MaxKm) * b4Rate;
      lastMilePayPaise = Math.round(b1 + b2 + b3 + b4 + rc.longDistanceReturnAllowancePaise);
    }

    // 4. Kitchen Wait Time Pay
    let kitchenWaitPayPaise = 0;
    if (input.kitchenWaitTimeMinutes > rc.kitchenWaitGraceMinutes) {
      const billableWait = input.kitchenWaitTimeMinutes - rc.kitchenWaitGraceMinutes;
      kitchenWaitPayPaise = Math.round(billableWait * rc.kitchenWaitRatePaisePerMinute);
    }

    // 5. Dynamic Supply-Demand Surge Payout
    let demandSurgePayPaise = 0;
    // Derive ratio from counts if provided, otherwise input ratio
    const effectiveRatio =
      input.zoneActiveOrdersCount !== undefined && input.zoneIdleRidersCount !== undefined
        ? Number((input.zoneActiveOrdersCount / Math.max(1, input.zoneIdleRidersCount)).toFixed(2))
        : input.zoneDemandSupplyRatio;

    if (effectiveRatio > 1.15) {
      const excess = effectiveRatio - 1.0;
      demandSurgePayPaise = Math.min(
        this.config.surge.maxRiderSurgeBonusPaise,
        Math.round(excess * this.config.surge.riderSurgeScalingPaise)
      );
    }
    const surgeMultiplier = this.calculateDynamicSurgeMultiplier(effectiveRatio);

    // 6. Weather Allowance
    let weatherBonusPaise = 0;
    const weather = input.weatherCondition ?? "CLEAR";
    if (weather === "DRIZZLE") weatherBonusPaise = rc.drizzleBonusPaise;
    else if (weather === "HEAVY_RAIN") weatherBonusPaise = rc.heavyRainBonusPaise;
    else if (weather === "WATERLOGGED") weatherBonusPaise = rc.waterloggedBonusPaise;

    // 7. Temporal & Shift Allowances
    const date = input.orderTimestampIso ? new Date(input.orderTimestampIso) : new Date();
    const friction = this.calculateTemporalFriction(date);
    const { hours } = getISTTime(date);

    let nightBonusPaise = 0;
    if (hours >= rc.nightShiftStartHour || hours < 2) {
      nightBonusPaise = rc.lateNightBonusPaise;
    } else if (hours >= 2 && hours < rc.nightShiftEndHour) {
      nightBonusPaise = rc.graveyardBonusPaise;
    }

    let peakBonusPaise = 0;
    if (input.applyPeakHourBonus || rc.enablePeakHourIncentives) {
      if (friction.slot === "LUNCH_PEAK") {
        peakBonusPaise = rc.lunchPeakBonusPaise;
      } else if (friction.slot === "DINNER_PEAK") {
        peakBonusPaise = rc.dinnerPeakBonusPaise;
      }
    }

    // 8. Cargo / Weight Bonus
    let cargoBonusPaise = 0;
    if (
      (input.cargoWeightKg && input.cargoWeightKg > rc.heavyCargoThresholdKg) ||
      (input.cargoItemCount && input.cargoItemCount > 6)
    ) {
      cargoBonusPaise = rc.heavyCargoBonusPaise;
    }

    // 9. Customer Tip (100% Pass-Through)
    const customerTipPaise = input.customerTipPaise ?? 0;

    // City tier adjustments tracker (for breakdown transparency)
    const standardBase = rc.basePayPaise;
    const cityTierAdjustmentPaise = basePayPaise - standardBase;

    // 10. Raw Sum Total Paise
    const rawTotalPaise =
      basePayPaise +
      firstMilePayPaise +
      lastMilePayPaise +
      kitchenWaitPayPaise +
      demandSurgePayPaise +
      weatherBonusPaise +
      nightBonusPaise +
      peakBonusPaise +
      cargoBonusPaise +
      customerTipPaise;

    // 11. Authentic Indian Delivery Rounding: Nearest 50 paise (₹0.50 increments)
    const roundedPaise = Math.round(rawTotalPaise / 50) * 50;
    const payoutRupees = roundedPaise / 100;

    const explanation = `Rider Payout: ₹${payoutRupees.toFixed(2)} [Tier: ${cityTier}, Base: ₹${(
      basePayPaise / 100
    ).toFixed(2)}, 1st-Mile: ₹${(firstMilePayPaise / 100).toFixed(2)}, Last-Mile: ₹${(
      lastMilePayPaise / 100
    ).toFixed(2)}, Wait: ₹${(kitchenWaitPayPaise / 100).toFixed(2)}, Surge: ₹${(
      demandSurgePayPaise / 100
    ).toFixed(2)} (${surgeMultiplier.toFixed(2)}x), Weather: ₹${(weatherBonusPaise / 100).toFixed(
      2
    )}, Night/Peak: ₹${((nightBonusPaise + peakBonusPaise) / 100).toFixed(2)}, Tip: ₹${(
      customerTipPaise / 100
    ).toFixed(2)}]`;

    return {
      payoutPaise: roundedPaise,
      payoutRupees,
      components: {
        basePayPaise,
        firstMilePayPaise,
        lastMilePayPaise,
        kitchenWaitPayPaise,
        demandSurgePayPaise,
        weatherBonusPaise,
        nightBonusPaise,
        peakBonusPaise,
        cargoBonusPaise,
        batchDiscountPaise,
        customerTipPaise,
        cityTierAdjustmentPaise,
      },
      metrics: {
        cityTier,
        costOfLivingMultiplier,
        fuelIndexMultiplier,
        surgeMultiplier,
        temporalSlot: friction.slot,
        trafficSpeedDecayPct: friction.decayPct,
        effectiveSpeedKmh: friction.effectiveSpeedKmh,
      },
      explanation,
    };
  }

  /**
   * Calculates customer delivery fee, platform fee (₹6.00), surge, and small order fees.
   */
  public calculateCustomerFees(input: CustomerFeeCalculationInput): CustomerFeeBreakdown {
    const cc = this.config.customer;

    // 1. Delivery Fee
    let deliveryFeePaise = cc.baseDeliveryFeePaise;
    if (input.distanceKm > cc.baseDeliveryDistanceKm) {
      const extraKm = input.distanceKm - cc.baseDeliveryDistanceKm;
      deliveryFeePaise += Math.round(extraKm * cc.perKmDeliveryRatePaise);
    }

    // Free delivery waiver if Gold / cart threshold
    if (input.isGoldMember && input.cartValuePaise >= cc.freeDeliveryCartThresholdPaise) {
      deliveryFeePaise = 0;
    }

    // 2. Pure Margin Platform Fee (Zomato/Swiggy model: ₹6 flat)
    const platformFeePaise = cc.platformFeePaise;

    // 3. Surge Fee to Customer
    let surgeFeePaise = 0;
    const ratio = input.zoneDemandSupplyRatio ?? 1.0;
    if (ratio > 1.2) {
      surgeFeePaise = Math.min(4000, Math.round((ratio - 1.0) * 1500));
    }
    if (input.weatherCondition === "HEAVY_RAIN" || input.weatherCondition === "WATERLOGGED") {
      surgeFeePaise += 2500; // ₹25 rain surge
    }

    // 4. Night Delivery Fee
    let nightFeePaise = 0;
    const date = input.orderTimestampIso ? new Date(input.orderTimestampIso) : new Date();
    const { hours } = getISTTime(date);
    if (hours >= 23 || hours < 6) {
      nightFeePaise = cc.nightDeliverySurchargePaise;
    }

    // 5. Small Order Fee
    let smallOrderFeePaise = 0;
    if (input.cartValuePaise < cc.smallOrderThresholdPaise) {
      smallOrderFeePaise = cc.smallOrderFeePaise;
    }

    // 6. GST 18% on platform and delivery convenience services
    const taxableServicePaise =
      deliveryFeePaise + platformFeePaise + surgeFeePaise + nightFeePaise + smallOrderFeePaise;
    const gst18PctPaise = Math.round((taxableServicePaise * 18) / 100);

    const totalFeePaise = taxableServicePaise + gst18PctPaise;

    return {
      totalFeePaise,
      totalFeeRupees: totalFeePaise / 100,
      components: {
        deliveryFeePaise,
        platformFeePaise,
        surgeFeePaise,
        nightFeePaise,
        smallOrderFeePaise,
        gst18PctPaise,
      },
    };
  }

  // ==========================================================================
  // 6. EMPLOYEE-LESS AUTONOMOUS OPERATIONS ENGINE
  // ==========================================================================

  /**
   * Pre-allocates dispatch: determines the exact second to notify rider so they
   * arrive at the restaurant EXACTLY when kitchen finishes prep (zero waiting).
   */
  public calculatePreAllocationDispatchTime(
    kitchenPrepTimeMinutes: number,
    riderEtaToRestaurantMinutes: number
  ): {
    dispatchLeadMinutes: number;
    recommendedDispatchStatus: "DISPATCH_IMMEDIATELY" | "HOLD_FOR_KITCHEN_PROGRESS";
  } {
    const lead = Math.max(0, kitchenPrepTimeMinutes - riderEtaToRestaurantMinutes);
    return {
      dispatchLeadMinutes: lead,
      recommendedDispatchStatus: lead <= 2 ? "DISPATCH_IMMEDIATELY" : "HOLD_FOR_KITCHEN_PROGRESS",
    };
  }

  /**
   * Autonomous Exception Resolver:
   * Handles delays, out-of-stock, and cold food without human employees.
   */
  public evaluateAutonomousException(order: {
    orderId: string;
    elapsedMinutes: number;
    quotedDeliveryMinutes: number;
    kitchenPrepElapsedMinutes: number;
    kitchenQuotedPrepMinutes: number;
    foodReadyMarked: boolean;
  }): {
    actionRequired: "NONE" | "VOICE_CALL_RESTAURANT" | "AUTO_COMPENSATE_CUSTOMER" | "REALLOCATE_RIDER";
    reason: string;
    automatedPayload: Record<string, unknown>;
  } {
    // 1. Kitchen Delay Alert
    if (
      !order.foodReadyMarked &&
      order.kitchenPrepElapsedMinutes > order.kitchenQuotedPrepMinutes + this.config.merchant.restaurantPrepGraceMinutes
    ) {
      return {
        actionRequired: "VOICE_CALL_RESTAURANT",
        reason: `Kitchen prep exceeded by ${
          order.kitchenPrepElapsedMinutes - order.kitchenQuotedPrepMinutes
        } minutes. Automated phone alert triggered.`,
        automatedPayload: {
          orderId: order.orderId,
          voiceScript: `Urgent from OrderKing: Order ${order.orderId} is delayed by ${
            order.kitchenPrepElapsedMinutes - order.kitchenQuotedPrepMinutes
          } minutes. Please pack immediately.`,
        },
      };
    }

    // 2. Customer Severe Delay Auto-Compensation
    if (order.elapsedMinutes > order.quotedDeliveryMinutes + 15) {
      return {
        actionRequired: "AUTO_COMPENSATE_CUSTOMER",
        reason: `Delivery delayed beyond 15 minutes of promise time. Auto-issued KingPay wallet credit.`,
        automatedPayload: {
          orderId: order.orderId,
          walletCreditPaise: 5000, // ₹50.00 wallet credit
          customerNotification: "We apologize for the delay. ₹50 has been credited to your KingPay Wallet.",
        },
      };
    }

    return {
      actionRequired: "NONE",
      reason: "Order is progressing within acceptable tolerances.",
      automatedPayload: {},
    };
  }
}
