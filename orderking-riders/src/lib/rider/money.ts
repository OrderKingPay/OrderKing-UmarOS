/**
 * OrderKing Money & Zomato Algorithmic Payout Matrix
 *
 * Implements 100% of Zomato's Indian courier payout algorithms:
 * 1. Base Pay (Pickup fee + Drop fee) by city tier (Tier 1/2/3).
 * 2. Progressive Distance Slabs:
 *    - Slab 1 (0.0 to 2.0 km): Included in Base Pay (₹0 extra).
 *    - Slab 2 (2.0 to 5.0 km): ₹12.00/km (1,200 paise/km).
 *    - Slab 3 (5.0 to 8.0 km): ₹14.00/km (1,400 paise/km).
 *    - Slab 4 (> 8.0 km - Long Distance Order / LDO): ₹16.00/km (1,600 paise/km) + ₹20.00 (2,000 paise) flat LDO return bonus.
 * 3. Stacked / Multi-Package Order Pay:
 *    - 60% of tier pickup fee + 100% of tier drop fee (~₹22 to ₹27 per secondary order).
 * 4. Restaurant Wait-Time Pay with Safety Cap:
 *    - EXACTLY ₹1/minute after first 6 minutes grace period upon marking 'ARRIVED_AT_RESTAURANT'.
 *    - Capped at MAX_BILLABLE_WAIT_MINUTES = 30 (cap at ₹30.00 / 3,000 paise) to eliminate runaway liability.
 * 5. Rain Surge & Peak Hour Pay: dynamic multiplier & ₹10 - ₹45 surge bonus.
 * 6. Customer Tips: 100% direct pass-through with zero platform deductions.
 * 7. Standardized Weekly Payout Cycle:
 *    - Monday 00:00:00 to Sunday 23:59:59 with automated Wednesday afternoon settlement.
 *
 * All internal currency calculations use integer paise to strictly eliminate floating-point drift.
 */

import type { DynamicPricingConfig, PlatformConfig, ProgressiveDistanceSlabs } from "./types.ts";

export const PAISE_PER_RUPEE = 100;

export function paise(rupees: number): number {
  return Math.round(rupees * PAISE_PER_RUPEE);
}

export function toPaise(rupees: number): number {
  return Math.round(rupees * PAISE_PER_RUPEE);
}

export function fromPaise(paiseAmount: number): number {
  return paiseAmount / PAISE_PER_RUPEE;
}

export function formatPaise(amountPaise: number, locale = "en-IN"): string {
  const sign = amountPaise < 0 ? "-" : "";
  const abs = Math.abs(amountPaise);
  const rupees = Math.floor(abs / 100);
  const frac = abs % 100;
  const grouped = rupees.toLocaleString(locale);
  return `${sign}₹${grouped}.${String(frac).padStart(2, "0")}`;
}

export function assertNonNegativePaise(amountPaise: number): void {
  if (!Number.isInteger(amountPaise) || amountPaise < 0) {
    throw new Error("Amount must be a non-negative integer (paise)");
  }
}

export function sumPaise(lines: ReadonlyArray<{ amountPaise: number }>): number {
  return lines.reduce((acc, l) => acc + Math.round(l.amountPaise), 0);
}

export function safeAdd(...values: number[]): number {
  return values.reduce((sum, v) => sum + Math.round(v), 0);
}

export function safeSubtract(a: number, b: number): number {
  return Math.round(a) - Math.round(b);
}

// ---------------------------------------------------------------------------
// 1. STATUTORY BASE CONSTANTS & CITY TIERS (Tier 1 / Tier 2 / Tier 3)
// ---------------------------------------------------------------------------

/** Statutory minimum base fare floor: ₹35 (3,500 paise) */
export const STATUTORY_BASE_FARE_PAISE = 3500;

/** Distance included in the base fare: 2 km */
export const STATUTORY_BASE_DISTANCE_KM = 2;

/** Standard distance rate beyond base distance: ₹12/km (1,200 paise/km) */
export const STATUTORY_DISTANCE_RATE_PER_KM_PAISE = 1200;

/** Distance rate allowable boundary: ₹10/km to ₹14/km */
export const MIN_DISTANCE_RATE_PER_KM_PAISE = 1000; // ₹10/km
export const MAX_DISTANCE_RATE_PER_KM_PAISE = 1400; // ₹14/km

export type CityTier = "TIER_1" | "TIER_2" | "TIER_3";

export interface CityTierPayConfig {
  tier: CityTier;
  name: string;
  pickupFeePaise: number;
  dropFeePaise: number;
  basePayPaise: number; // pickupFeePaise + dropFeePaise
  baseDistanceKm: number;
  defaultRatePerKmPaise: number; // ₹10-₹14/km
  minimumFareFloorPaise: number;
}

/**
 * Zomato's Indian City Tier Payout Matrix:
 * - Tier 1 (Metros: Bangalore, Mumbai, Delhi NCR, Hyderabad, Chennai, Kolkata, Pune)
 *   Base Pay: ₹35 (Pickup ₹20 + Drop ₹15) | Floor: ₹35 | Rate: ₹12/km beyond 2km
 * - Tier 2 (Growth Cities: Jaipur, Ahmedabad, Lucknow, Chandigarh, Kochi, Indore, etc.)
 *   Base Pay: ₹30 (Pickup ₹18 + Drop ₹12) | Floor: ₹30 | Rate: ₹11/km beyond 2km
 * - Tier 3 (Emerging Towns & Rest of India)
 *   Base Pay: ₹25 (Pickup ₹15 + Drop ₹10) | Floor: ₹25 | Rate: ₹10/km beyond 2km
 */
export const CITY_TIER_PAY_CONFIGS: Record<CityTier, CityTierPayConfig> = {
  TIER_1: {
    tier: "TIER_1",
    name: "Tier 1 Metros (BLR, BOM, DEL-NCR, HYD, MAA, CCU, PNQ)",
    pickupFeePaise: 2000, // ₹20.00
    dropFeePaise: 1500, // ₹15.00
    basePayPaise: 3500, // ₹35.00
    baseDistanceKm: 2,
    defaultRatePerKmPaise: 1200, // ₹12.00/km
    minimumFareFloorPaise: 3500, // ₹35.00
  },
  TIER_2: {
    tier: "TIER_2",
    name: "Tier 2 Growth Cities (JAI, AMD, LKO, IXC, COK, IDR, CJB, NAG)",
    pickupFeePaise: 1800, // ₹18.00
    dropFeePaise: 1200, // ₹12.00
    basePayPaise: 3000, // ₹30.00
    baseDistanceKm: 2,
    defaultRatePerKmPaise: 1100, // ₹11.00/km
    minimumFareFloorPaise: 3000, // ₹30.00
  },
  TIER_3: {
    tier: "TIER_3",
    name: "Tier 3 Emerging Towns & Rest of India",
    pickupFeePaise: 1500, // ₹15.00
    dropFeePaise: 1000, // ₹10.00
    basePayPaise: 2500, // ₹25.00
    baseDistanceKm: 2,
    defaultRatePerKmPaise: 1000, // ₹10.00/km
    minimumFareFloorPaise: 2500, // ₹25.00
  },
};

/**
 * Returns the base pay breakdown for a given city tier with optional dynamic platform config overrides.
 */
export function getBasePay(
  cityTier: CityTier = "TIER_1",
  dynamicConfig?: Partial<DynamicPricingConfig> | null,
): {
  tier: CityTier;
  pickupFeePaise: number;
  dropFeePaise: number;
  basePayPaise: number;
  baseDistanceKm: number;
  floorPaise: number;
  ratePerKmPaise: number;
} {
  const cfg = CITY_TIER_PAY_CONFIGS[cityTier] ?? CITY_TIER_PAY_CONFIGS.TIER_1;
  const pickupFeePaise = dynamicConfig?.pickupFeePaise ?? cfg.pickupFeePaise;
  const dropFeePaise = dynamicConfig?.dropFeePaise ?? cfg.dropFeePaise;
  const basePayPaise = dynamicConfig?.basePayPaise ?? (pickupFeePaise + dropFeePaise);

  let floorPaise = cfg.minimumFareFloorPaise;
  if (dynamicConfig) {
    if (cityTier === "TIER_1" && dynamicConfig.tier1BaseFloorPaise !== undefined) {
      floorPaise = dynamicConfig.tier1BaseFloorPaise;
    } else if (cityTier === "TIER_2" && dynamicConfig.tier2BaseFloorPaise !== undefined) {
      floorPaise = dynamicConfig.tier2BaseFloorPaise;
    } else if (cityTier === "TIER_3" && dynamicConfig.tier3BaseFloorPaise !== undefined) {
      floorPaise = dynamicConfig.tier3BaseFloorPaise;
    } else if (dynamicConfig.basePayPaise !== undefined) {
      floorPaise = dynamicConfig.basePayPaise;
    }
  }

  const ratePerKmPaise =
    dynamicConfig?.defaultRatePerKmPaise ??
    dynamicConfig?.distanceSlabs?.slab1RatePerKmPaise ??
    cfg.defaultRatePerKmPaise;

  return {
    tier: cfg.tier,
    pickupFeePaise,
    dropFeePaise,
    basePayPaise,
    baseDistanceKm: cfg.baseDistanceKm,
    floorPaise,
    ratePerKmPaise,
  };
}

// ---------------------------------------------------------------------------
// 2. DISTANCE PAY & PROGRESSIVE DISTANCE SLABS (SLAB 1 - 4 + LDO RETURN BONUS)
// ---------------------------------------------------------------------------

/** Slab 1 threshold: 0.0 to 2.0 km (Included in Base Pay) */
export const SLAB_1_MAX_KM = 2.0;

/** Slab 2 threshold: 2.0 to 5.0 km (₹12.00/km) */
export const SLAB_2_MAX_KM = 5.0;
export const SLAB_2_RATE_PER_KM_PAISE = 1200; // ₹12.00/km

/** Slab 3 threshold: 5.0 to 8.0 km (₹14.00/km) */
export const SLAB_3_MAX_KM = 8.0;
export const SLAB_3_RATE_PER_KM_PAISE = 1400; // ₹14.00/km

/** Slab 4 threshold: > 8.0 km (₹16.00/km + ₹20.00 LDO return bonus) */
export const SLAB_4_RATE_PER_KM_PAISE = 1600; // ₹16.00/km

/** Long Distance Order (LDO) constants (> 8.0 km threshold) */
export const LDO_THRESHOLD_KM = 8.0;
export const LDO_RETURN_BONUS_PAISE = 2000; // ₹20.00 (2,000 paise) flat return bonus

export const PROGRESSIVE_DISTANCE_SLABS = {
  SLAB_1: { minKm: 0.0, maxKm: 2.0, ratePerKmPaise: 0 },
  SLAB_2: { minKm: 2.0, maxKm: 5.0, ratePerKmPaise: 1200 },
  SLAB_3: { minKm: 5.0, maxKm: 8.0, ratePerKmPaise: 1400 },
  SLAB_4: { minKm: 8.0, maxKm: Infinity, ratePerKmPaise: 1600 },
} as const;

export interface ProgressiveDistanceConfig {
  slab1MaxKm?: number;
  slab2MaxKm?: number;
  slab3MaxKm?: number;
  slab2RatePerKmPaise?: number;
  slab3RatePerKmPaise?: number;
  slab4RatePerKmPaise?: number;
  ldoBonusPaise?: number;
  ldoThresholdKm?: number;
}

export interface ProgressiveDistanceBreakdown {
  totalDistanceKm: number;
  slab1Km: number;
  slab1PayPaise: number;
  slab2Km: number;
  slab2RatePerKmPaise: number;
  slab2PayPaise: number;
  slab3Km: number;
  slab3RatePerKmPaise: number;
  slab3PayPaise: number;
  slab4Km: number;
  slab4RatePerKmPaise: number;
  slab4PayPaise: number;
  isLdo: boolean;
  ldoBonusPaise: number;
  totalDistancePayPaise: number;
  distancePayPaise: number;
  billableExtraKm: number;
}

/**
 * Calculates progressive distance pay strictly according to Zomato's actual payout slabs:
 * - Slab 1 (0.0 to 2.0 km): Included in Base Pay (₹0 extra).
 * - Slab 2 (2.0 to 5.0 km): ₹12.00/km (1,200 paise/km).
 * - Slab 3 (5.0 to 8.0 km): ₹14.00/km (1,400 paise/km).
 * - Slab 4 (> 8.0 km - Long Distance Order / LDO): ₹16.00/km (1,600 paise/km) + ₹20.00 (2,000 paise) flat LDO return bonus.
 */
export function calculateProgressiveDistancePay(
  distanceKm: number,
  config?: ProgressiveDistanceConfig,
): ProgressiveDistanceBreakdown {
  const dist = Math.max(0, Number.isFinite(distanceKm) ? distanceKm : 0);

  const s1Max = config?.slab1MaxKm ?? SLAB_1_MAX_KM;
  const s2Max = config?.slab2MaxKm ?? SLAB_2_MAX_KM;
  const s3Max = config?.slab3MaxKm ?? SLAB_3_MAX_KM;

  const s2Rate = config?.slab2RatePerKmPaise ?? SLAB_2_RATE_PER_KM_PAISE;
  const s3Rate = config?.slab3RatePerKmPaise ?? SLAB_3_RATE_PER_KM_PAISE;
  const s4Rate = config?.slab4RatePerKmPaise ?? SLAB_4_RATE_PER_KM_PAISE;

  const ldoThreshold = config?.ldoThresholdKm ?? LDO_THRESHOLD_KM;
  const ldoBonus = config?.ldoBonusPaise ?? LDO_RETURN_BONUS_PAISE;

  // Slab 1: 0.0 to 2.0 km -> ₹0 extra
  const slab1Km = Math.min(dist, s1Max);
  const slab1PayPaise = 0;

  // Slab 2: 2.0 to 5.0 km -> ₹12.00/km
  const slab2Km = dist > s1Max ? Math.min(dist, s2Max) - s1Max : 0;
  const slab2PayPaise = Math.round(slab2Km * s2Rate);

  // Slab 3: 5.0 to 8.0 km -> ₹14.00/km
  const slab3Km = dist > s2Max ? Math.min(dist, s3Max) - s2Max : 0;
  const slab3PayPaise = Math.round(slab3Km * s3Rate);

  // Slab 4: > 8.0 km -> ₹16.00/km
  const slab4Km = dist > s3Max ? dist - s3Max : 0;
  const slab4PayPaise = Math.round(slab4Km * s4Rate);

  // LDO flat return bonus: ₹20.00 (2,000 paise) triggered when > 8.0 km
  const isLdo = dist > ldoThreshold;
  const ldoBonusPaise = isLdo ? ldoBonus : 0;

  const totalDistancePayPaise =
    slab1PayPaise + slab2PayPaise + slab3PayPaise + slab4PayPaise + ldoBonusPaise;
  const billableExtraKm = Number(Math.max(0, dist - s1Max).toFixed(2));

  return {
    totalDistanceKm: dist,
    slab1Km: Number(slab1Km.toFixed(2)),
    slab1PayPaise,
    slab2Km: Number(slab2Km.toFixed(2)),
    slab2RatePerKmPaise: s2Rate,
    slab2PayPaise,
    slab3Km: Number(slab3Km.toFixed(2)),
    slab3RatePerKmPaise: s3Rate,
    slab3PayPaise,
    slab4Km: Number(slab4Km.toFixed(2)),
    slab4RatePerKmPaise: s4Rate,
    slab4PayPaise,
    isLdo,
    ldoBonusPaise,
    totalDistancePayPaise,
    distancePayPaise: totalDistancePayPaise,
    billableExtraKm,
  };
}

/**
 * Calculates distance pay for kilometers travelled beyond base distance.
 * Distance under base distance (2 km) is covered by base pay.
 */
export function calculateDistancePay(
  distanceKm: number,
  customRatePerKmPaise = STATUTORY_DISTANCE_RATE_PER_KM_PAISE,
  baseDistanceKm = STATUTORY_BASE_DISTANCE_KM,
  dynamicSlabs?: ProgressiveDistanceSlabs | ProgressiveDistanceConfig | null,
): {
  totalDistanceKm: number;
  baseDistanceKm: number;
  billableExtraKm: number;
  ratePerKmPaise: number;
  distancePayPaise: number;
  ldoBonusPaise?: number;
} {
  if (dynamicSlabs) {
    const s2Rate =
      "slab1RatePerKmPaise" in dynamicSlabs
        ? dynamicSlabs.slab1RatePerKmPaise
        : (dynamicSlabs.slab2RatePerKmPaise ?? SLAB_2_RATE_PER_KM_PAISE);
    const s3Rate =
      "slab2RatePerKmPaise" in dynamicSlabs
        ? dynamicSlabs.slab2RatePerKmPaise
        : (dynamicSlabs.slab3RatePerKmPaise ?? SLAB_3_RATE_PER_KM_PAISE);
    const s4Rate =
      "slab3RatePerKmPaise" in dynamicSlabs
        ? dynamicSlabs.slab3RatePerKmPaise
        : (dynamicSlabs.slab4RatePerKmPaise ?? SLAB_4_RATE_PER_KM_PAISE);
    const ldoBonus = dynamicSlabs.ldoBonusPaise ?? LDO_RETURN_BONUS_PAISE;

    const prog = calculateProgressiveDistancePay(distanceKm, {
      slab1MaxKm: baseDistanceKm,
      slab2RatePerKmPaise: s2Rate,
      slab3RatePerKmPaise: s3Rate,
      slab4RatePerKmPaise: s4Rate,
      ldoBonusPaise: ldoBonus,
    });
    return {
      totalDistanceKm: prog.totalDistanceKm,
      baseDistanceKm,
      billableExtraKm: prog.billableExtraKm,
      ratePerKmPaise: s2Rate,
      distancePayPaise: prog.totalDistancePayPaise,
      ldoBonusPaise: prog.ldoBonusPaise,
    };
  }

  const dist = Math.max(0, Number.isFinite(distanceKm) ? distanceKm : 0);
  const baseDist = Math.max(0, Number.isFinite(baseDistanceKm) ? baseDistanceKm : STATUTORY_BASE_DISTANCE_KM);
  // Clamp rate between ₹10/km and ₹14/km if user passes custom rate
  const clampedRate = Math.min(
    MAX_DISTANCE_RATE_PER_KM_PAISE,
    Math.max(MIN_DISTANCE_RATE_PER_KM_PAISE, Math.round(customRatePerKmPaise)),
  );
  const extraKm = Math.max(0, dist - baseDist);
  const distancePayPaise = Math.round(extraKm * clampedRate);

  return {
    totalDistanceKm: dist,
    baseDistanceKm: baseDist,
    billableExtraKm: Number(extraKm.toFixed(2)),
    ratePerKmPaise: clampedRate,
    distancePayPaise,
  };
}

// ---------------------------------------------------------------------------
// 3. RESTAURANT WAIT-TIME PAY: EXACTLY ₹1/MIN AFTER 6 MINS GRACE (CAP AT 30 MINS)
// ---------------------------------------------------------------------------

/**
 * Zomato Wait-Time Policy:
 * The timer begins when courier marks 'ARRIVED_AT_RESTAURANT'.
 * First 6 minutes are free grace period.
 * Every subsequent minute is compensated at EXACTLY ₹1/minute (100 paise/min).
 * Safety Cap: Capped at MAX_BILLABLE_WAIT_MINUTES = 30 (cap at ₹30.00 / 3,000 paise)
 * to strictly eliminate runaway financial liability from errant restaurant operations.
 */
export const RESTAURANT_WAIT_GRACE_PERIOD_MINUTES = 6;
export const RESTAURANT_WAIT_PAY_RATE_PER_MIN_PAISE = 100; // ₹1.00 / min
export const MAX_BILLABLE_WAIT_MINUTES = 30; // ₹30.00 (3,000 paise) safety cap
export const MAX_WAIT_PAY_PAISE = 3000; // ₹30.00 (3,000 paise)

export function calculateRestaurantWaitPayPaise(
  waitMinutes: number,
  gracePeriodMinutes = RESTAURANT_WAIT_GRACE_PERIOD_MINUTES,
  ratePerMinPaise = RESTAURANT_WAIT_PAY_RATE_PER_MIN_PAISE,
  maxBillableMinutes = MAX_BILLABLE_WAIT_MINUTES,
  waitCapPaise?: number,
): number {
  const mins = Math.max(0, Number.isFinite(waitMinutes) ? Math.floor(waitMinutes) : 0);
  const grace = Math.max(0, Math.floor(gracePeriodMinutes));
  const rawBillableMins = Math.max(0, mins - grace);
  const billableMins = Math.min(Math.max(0, Math.floor(maxBillableMinutes)), rawBillableMins);
  const rawPay = Math.round(billableMins * Math.max(0, Math.round(ratePerMinPaise)));
  if (waitCapPaise !== undefined && waitCapPaise > 0) {
    return Math.min(rawPay, Math.round(waitCapPaise));
  }
  return rawPay;
}

export function calculateRestaurantWaitPay(
  waitMinutes: number,
  gracePeriodMinutes = RESTAURANT_WAIT_GRACE_PERIOD_MINUTES,
  ratePerMinPaise = RESTAURANT_WAIT_PAY_RATE_PER_MIN_PAISE,
  maxBillableMinutes = MAX_BILLABLE_WAIT_MINUTES,
  waitCapPaise?: number,
): {
  totalWaitMinutes: number;
  gracePeriodMinutes: number;
  rawBillableWaitMinutes: number;
  billableWaitMinutes: number;
  maxBillableWaitMinutes: number;
  isCapped: boolean;
  ratePerMinPaise: number;
  waitPayPaise: number;
  waitCapPaise: number | null;
} {
  const mins = Math.max(0, Number.isFinite(waitMinutes) ? Math.floor(waitMinutes) : 0);
  const grace = Math.max(0, Math.floor(gracePeriodMinutes));
  const rawBillableWaitMinutes = Math.max(0, mins - grace);
  const maxBillable = Math.max(0, Math.floor(maxBillableMinutes));
  const billableWaitMinutes = Math.min(maxBillable, rawBillableWaitMinutes);
  let isCapped = rawBillableWaitMinutes > maxBillable;
  const rate = Math.max(0, Math.round(ratePerMinPaise));
  let waitPayPaise = billableWaitMinutes * rate;
  if (waitCapPaise !== undefined && waitCapPaise > 0 && waitPayPaise > waitCapPaise) {
    waitPayPaise = Math.round(waitCapPaise);
    isCapped = true;
  }

  return {
    totalWaitMinutes: mins,
    gracePeriodMinutes: grace,
    rawBillableWaitMinutes,
    billableWaitMinutes,
    maxBillableWaitMinutes: maxBillable,
    isCapped,
    ratePerMinPaise: rate,
    waitPayPaise,
    waitCapPaise: waitCapPaise !== undefined ? Math.round(waitCapPaise) : null,
  };
}

export function calculateWaitTimeMinutes(
  arrivedRestaurantAt: string | number | Date | null | undefined,
  pickedUpAtOrNow: string | number | Date | null | undefined = Date.now(),
): number {
  if (!arrivedRestaurantAt) return 0;
  const startMs = new Date(arrivedRestaurantAt).getTime();
  const endMs = pickedUpAtOrNow ? new Date(pickedUpAtOrNow).getTime() : Date.now();
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) return 0;
  return Math.floor((endMs - startMs) / 60000);
}

// ---------------------------------------------------------------------------
// 4. RAIN SURGE & PEAK HOUR SURGE PAY: DYNAMIC MULTIPLIER (₹10 - ₹45 SURGE)
// ---------------------------------------------------------------------------

/** Allowable rain surge bonus range: ₹10 to ₹45 (1000 to 4500 paise) */
export const MIN_RAIN_SURGE_BONUS_PAISE = 1000; // ₹10
export const MAX_RAIN_SURGE_BONUS_PAISE = 4500; // ₹45
export const DEFAULT_RAIN_SURGE_BONUS_PAISE = 2500; // ₹25

export interface SurgePayCalculationInput {
  baseAndDistancePaise: number;
  isRainSurge?: boolean;
  rainSurgeBonusPaise?: number; // ₹10 - ₹45
  peakMultiplier?: number; // 1.0x - 2.5x
}

export function calculateSurgePay(input: SurgePayCalculationInput): {
  peakMultiplier: number;
  peakMultiplierBoostPaise: number;
  isRainSurge: boolean;
  rainSurgeBonusPaise: number;
  totalSurgePaise: number;
} {
  const basePaise = Math.max(0, Math.round(input.baseAndDistancePaise));
  const peakMultiplier = Number.isFinite(input.peakMultiplier) ? Math.max(1.0, input.peakMultiplier!) : 1.0;
  const peakMultiplierBoostPaise = Math.round(basePaise * Math.max(0, peakMultiplier - 1.0));

  let rainSurgeBonusPaise = 0;
  if (input.isRainSurge) {
    const rawBonus = input.rainSurgeBonusPaise ?? DEFAULT_RAIN_SURGE_BONUS_PAISE;
    rainSurgeBonusPaise = Math.min(
      MAX_RAIN_SURGE_BONUS_PAISE,
      Math.max(MIN_RAIN_SURGE_BONUS_PAISE, Math.round(rawBonus)),
    );
  }

  const totalSurgePaise = peakMultiplierBoostPaise + rainSurgeBonusPaise;

  return {
    peakMultiplier,
    peakMultiplierBoostPaise,
    isRainSurge: Boolean(input.isRainSurge),
    rainSurgeBonusPaise,
    totalSurgePaise,
  };
}

// ---------------------------------------------------------------------------
// 5. CUSTOMER TIPS: 100% DIRECT PASS-THROUGH (ZERO PLATFORM DEDUCTION)
// ---------------------------------------------------------------------------

/**
 * Customer tips are strictly 100% pass-through with zero platform deductions.
 * OrderKing never charges commission, convenience, or payment fees on tips.
 */
export function calculateCustomerTipPassThrough(tipPaise: number): {
  grossTipPaise: number;
  platformDeductionPaise: 0;
  netTipPassThroughPaise: number;
  passThroughPercentage: 100;
} {
  const sanitizedTip = Math.max(0, Number.isFinite(tipPaise) ? Math.round(tipPaise) : 0);
  return {
    grossTipPaise: sanitizedTip,
    platformDeductionPaise: 0,
    netTipPassThroughPaise: sanitizedTip,
    passThroughPercentage: 100,
  };
}

// ---------------------------------------------------------------------------
// 6. STACKED / MULTI-PACKAGE ORDER PAY (60% PICKUP + 100% DROP FEE)
// ---------------------------------------------------------------------------

/**
 * Zomato Stacked / Multi-Order Policy:
 * Couriers assigned a secondary order in a stacked route earn:
 * - 60% of tier pickup fee (restaurant pickup already coordinated)
 * - 100% of tier drop fee (distinct customer destination)
 * Yields ~₹22 to ~₹27 per secondary order:
 * - Tier 1: 60% of ₹20 (1200) + 100% of ₹15 (1500) = ₹27 (2,700 paise)
 * - Tier 2: 60% of ₹18 (1080) + 100% of ₹12 (1200) = ₹22.80 (2,280 paise)
 * - Tier 3: 60% of ₹15 (900)  + 100% of ₹10 (1000) = ₹19 (1,900 paise)
 */
export const STACKED_PICKUP_FEE_PERCENTAGE = 60; // 60%
export const STACKED_DROP_FEE_PERCENTAGE = 100; // 100%

export interface StackedOrderPayBreakdown {
  secondaryOrderCount: number;
  cityTier: CityTier;
  tierPickupFeePaise: number;
  tierDropFeePaise: number;
  stackedPickupFeePaise: number;
  stackedDropFeePaise: number;
  payPerSecondaryOrderPaise: number;
  totalStackedOrderPayPaise: number;
  stackedPayPaise: number;
}

export function calculateStackedOrderPay(
  secondaryOrderCount: number,
  cityTier: CityTier = "TIER_1",
): StackedOrderPayBreakdown {
  const count = Math.max(0, Number.isFinite(secondaryOrderCount) ? Math.floor(secondaryOrderCount) : 0);
  const cfg = CITY_TIER_PAY_CONFIGS[cityTier] ?? CITY_TIER_PAY_CONFIGS.TIER_1;

  const stackedPickupFeePaise = Math.round((cfg.pickupFeePaise * STACKED_PICKUP_FEE_PERCENTAGE) / 100);
  const stackedDropFeePaise = Math.round((cfg.dropFeePaise * STACKED_DROP_FEE_PERCENTAGE) / 100);
  const payPerSecondaryOrderPaise = stackedPickupFeePaise + stackedDropFeePaise;
  const totalStackedOrderPayPaise = count * payPerSecondaryOrderPaise;

  return {
    secondaryOrderCount: count,
    cityTier: cfg.tier,
    tierPickupFeePaise: cfg.pickupFeePaise,
    tierDropFeePaise: cfg.dropFeePaise,
    stackedPickupFeePaise,
    stackedDropFeePaise,
    payPerSecondaryOrderPaise,
    totalStackedOrderPayPaise,
    stackedPayPaise: totalStackedOrderPayPaise,
  };
}

export function calculateStackedOrderPayPaise(
  secondaryOrderCount: number,
  cityTier: CityTier = "TIER_1",
): number {
  return calculateStackedOrderPay(secondaryOrderCount, cityTier).totalStackedOrderPayPaise;
}

// ---------------------------------------------------------------------------
// 7. ZOMATO WEEKLY PAYOUT CYCLE (MON 00:00:00 - SUN 23:59:59 -> WED SETTLEMENT)
// ---------------------------------------------------------------------------

export const ZOMATO_PAYOUT_SETTLEMENT_DAY = "WEDNESDAY";
export const ZOMATO_PAYOUT_SETTLEMENT_HOUR_UTC = 15; // 3:00 PM UTC (Wednesday afternoon)

export interface ZomatoWeeklyCycle {
  cycleStart: Date;
  cycleEnd: Date;
  payoutDate: Date;
  cycleStartIso: string;
  cycleEndIso: string;
  payoutDateIso: string;
  formattedCycle: string;
}

/**
 * Standardizes Zomato's weekly payout cycle:
 * - Cycle Window: Monday 00:00:00 to Sunday 23:59:59.
 * - Payout Settlement: Automated Wednesday afternoon settlement following cycle close.
 *
 * @param dateInput Target date or timestamp within the cycle (defaults to now)
 * @param options Options flag for UTC or local time calculation
 */
export function getZomatoWeeklyCycle(
  dateInput: Date | string | number = new Date(),
  options?: { useUtc?: boolean },
): ZomatoWeeklyCycle {
  const d = typeof dateInput === "string" || typeof dateInput === "number"
    ? new Date(dateInput)
    : new Date(dateInput.getTime());

  if (Number.isNaN(d.getTime())) {
    throw new Error("Invalid date provided to getZomatoWeeklyCycle");
  }

  const isIsoStringWithZ = typeof dateInput === "string" && (dateInput.endsWith("Z") || dateInput.includes("+00:00"));
  const useUtc = options?.useUtc ?? (typeof dateInput === "string" ? isIsoStringWithZ : true);

  if (useUtc) {
    const day = d.getUTCDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
    const diffToMonday = day === 0 ? 6 : day - 1;

    const start = new Date(d.getTime());
    start.setUTCDate(d.getUTCDate() - diffToMonday);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(start.getTime());
    end.setUTCDate(start.getUTCDate() + 6);
    end.setUTCHours(23, 59, 59, 999);

    const payout = new Date(start.getTime());
    payout.setUTCDate(start.getUTCDate() + 9); // Following Wednesday (+9 days from Monday)
    payout.setUTCHours(15, 0, 0, 0); // Wednesday afternoon settlement (3:00 PM UTC)

    return {
      cycleStart: start,
      cycleEnd: end,
      payoutDate: payout,
      cycleStartIso: start.toISOString(),
      cycleEndIso: end.toISOString(),
      payoutDateIso: payout.toISOString(),
      formattedCycle: `${start.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)}`,
    };
  } else {
    const day = d.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;

    const start = new Date(d.getTime());
    start.setDate(d.getDate() - diffToMonday);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start.getTime());
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const payout = new Date(start.getTime());
    payout.setDate(start.getDate() + 9);
    payout.setHours(15, 0, 0, 0);

    return {
      cycleStart: start,
      cycleEnd: end,
      payoutDate: payout,
      cycleStartIso: start.toISOString(),
      cycleEndIso: end.toISOString(),
      payoutDateIso: payout.toISOString(),
      formattedCycle: `${start.toLocaleDateString("en-IN")} to ${end.toLocaleDateString("en-IN")}`,
    };
  }
}

// ---------------------------------------------------------------------------
// 8. MASTER ZOMATO ALGORITHMIC PAYOUT BREAKDOWN
// ---------------------------------------------------------------------------

export interface ZomatoPayoutInput {
  distanceKm: number;
  cityTier?: CityTier;
  customRatePerKmPaise?: number; // ₹10-₹14/km (legacy flat override)
  useProgressiveDistance?: boolean; // defaults to true unless customRatePerKmPaise passed
  progressiveConfig?: ProgressiveDistanceConfig;
  waitMinutes?: number;
  arrivedRestaurantAt?: string | number | Date | null;
  pickedUpAt?: string | number | Date | null;
  maxBillableWaitMinutes?: number; // defaults to MAX_BILLABLE_WAIT_MINUTES (30)
  waitGraceMinutes?: number;
  waitRatePerMinPaise?: number;
  waitCapPaise?: number;
  distanceSlabs?: ProgressiveDistanceSlabs;
  isRainSurge?: boolean;
  rainSurgeBonusPaise?: number; // ₹10-₹45
  peakMultiplier?: number;
  customerTipPaise?: number;
  packageCount?: number;
  stackedOrderCount?: number; // secondary orders in batch
  customFloorPaise?: number;
  dynamicConfig?: DynamicPricingConfig | PlatformConfig | null;
}

export interface ZomatoPayoutBreakdown {
  cityTier: CityTier;
  pickupFeePaise: number;
  dropFeePaise: number;
  basePayPaise: number;
  distanceKm: number;
  billableExtraKm: number;
  ratePerKmPaise: number;
  distancePayPaise: number;
  baseAndDistancePaise: number;
  isLdo: boolean;
  ldoBonusPaise: number;
  progressiveDistance?: ProgressiveDistanceBreakdown;
  waitMinutes: number;
  billableWaitMinutes: number;
  rawBillableWaitMinutes?: number;
  isWaitCapped: boolean;
  waitTimePayPaise: number;
  isRainSurge: boolean;
  rainSurgeBonusPaise: number;
  peakMultiplier: number;
  peakMultiplierBoostPaise: number;
  totalSurgePaise: number;
  secondaryOrderCount: number;
  stackedOrderPayPaise: number;
  multiPackageBonusPaise: number; // backward-compatibility alias
  customerTipPaise: number;
  floorPaise: number;
  isFloorEnforced: boolean;
  subtotalBeforeTipPaise: number;
  totalPayoutPaise: number;
}

/**
 * Calculates complete, end-to-end rider payout conforming 100% to Zomato's Indian payout matrix.
 * Guaranteed strictly integer paise calculations throughout.
 */
export function calculateZomatoAlgorithmicPayout(input: ZomatoPayoutInput): ZomatoPayoutBreakdown {
  const dynPricing: DynamicPricingConfig | undefined = input.dynamicConfig
    ? ("pricing" in input.dynamicConfig && input.dynamicConfig.pricing
        ? input.dynamicConfig.pricing
        : (input.dynamicConfig as DynamicPricingConfig))
    : undefined;

  const tier = input.cityTier ?? dynPricing?.cityTier ?? "TIER_1";
  const tierConfig = CITY_TIER_PAY_CONFIGS[tier] ?? CITY_TIER_PAY_CONFIGS.TIER_1;

  // 1. Base Pay (Pickup + Drop) with optional dynamic overrides
  const basePayInfo = getBasePay(tier, dynPricing);
  const pickupFeePaise = basePayInfo.pickupFeePaise;
  const dropFeePaise = basePayInfo.dropFeePaise;
  const basePayPaise = basePayInfo.basePayPaise;

  // 2. Distance Pay: Progressive Slabs (Slab 1-4 + LDO) or Legacy Flat Rate
  let distancePayPaise = 0;
  let billableExtraKm = 0;
  let ratePerKm = input.customRatePerKmPaise ?? basePayInfo.ratePerKmPaise ?? tierConfig.defaultRatePerKmPaise;
  let isLdo = false;
  let ldoBonusPaise = 0;
  let progressiveDistance: ProgressiveDistanceBreakdown | undefined;

  const dynamicSlabs = input.distanceSlabs ?? dynPricing?.distanceSlabs;
  const progConfig: ProgressiveDistanceConfig | undefined = dynamicSlabs
    ? {
        ...input.progressiveConfig,
        slab2RatePerKmPaise: dynamicSlabs.slab1RatePerKmPaise,
        slab3RatePerKmPaise: dynamicSlabs.slab2RatePerKmPaise,
        slab4RatePerKmPaise: dynamicSlabs.slab3RatePerKmPaise,
        ldoBonusPaise: dynamicSlabs.ldoBonusPaise,
      }
    : input.progressiveConfig;

  const shouldUseProgressive = input.useProgressiveDistance ?? (input.customRatePerKmPaise === undefined);

  if (shouldUseProgressive) {
    const prog = calculateProgressiveDistancePay(input.distanceKm, progConfig);
    progressiveDistance = prog;
    distancePayPaise = prog.totalDistancePayPaise;
    billableExtraKm = prog.billableExtraKm;
    isLdo = prog.isLdo;
    ldoBonusPaise = prog.ldoBonusPaise;
    if (prog.slab4Km > 0) ratePerKm = prog.slab4RatePerKmPaise;
    else if (prog.slab3Km > 0) ratePerKm = prog.slab3RatePerKmPaise;
    else if (prog.slab2Km > 0) ratePerKm = prog.slab2RatePerKmPaise;
    else ratePerKm = tierConfig.defaultRatePerKmPaise;
  } else {
    const distCalc = calculateDistancePay(input.distanceKm, ratePerKm, tierConfig.baseDistanceKm, dynamicSlabs);
    distancePayPaise = distCalc.distancePayPaise;
    billableExtraKm = distCalc.billableExtraKm;
    ratePerKm = distCalc.ratePerKmPaise;
    if (distCalc.ldoBonusPaise) {
      ldoBonusPaise = distCalc.ldoBonusPaise;
      isLdo = true;
    }
  }
  const baseAndDistancePaise = basePayPaise + distancePayPaise;

  // 3. Restaurant Wait-Time Pay (EXACTLY ₹1/min after grace, with optional safety cap)
  let waitMins = 0;
  if (input.arrivedRestaurantAt) {
    waitMins = calculateWaitTimeMinutes(input.arrivedRestaurantAt, input.pickedUpAt);
  } else if (input.waitMinutes !== undefined) {
    waitMins = Math.max(0, Math.floor(input.waitMinutes));
  }
  const maxBillableWait = input.maxBillableWaitMinutes ?? MAX_BILLABLE_WAIT_MINUTES;
  const graceMins = input.waitGraceMinutes ?? dynPricing?.waitGraceMinutes ?? RESTAURANT_WAIT_GRACE_PERIOD_MINUTES;
  const waitRate = input.waitRatePerMinPaise ?? dynPricing?.waitRatePerMinPaise ?? RESTAURANT_WAIT_PAY_RATE_PER_MIN_PAISE;
  const waitCap = input.waitCapPaise ?? dynPricing?.waitCapPaise;
  const waitCalc = calculateRestaurantWaitPay(
    waitMins,
    graceMins,
    waitRate,
    maxBillableWait,
    waitCap,
  );

  // 4. Surge Pay (Rain surge bonus + Peak dynamic multiplier)
  const surgeCalc = calculateSurgePay({
    baseAndDistancePaise,
    isRainSurge: input.isRainSurge,
    rainSurgeBonusPaise: input.rainSurgeBonusPaise,
    peakMultiplier: input.peakMultiplier,
  });

  // 5. Stacked / Multi-Package Order Pay:
  // Zomato Standard: 60% of tier pickup fee + 100% of tier drop fee per secondary order (~₹22 - ₹27)
  let secondaryOrderCount = 0;
  if (input.stackedOrderCount !== undefined) {
    secondaryOrderCount = Math.max(0, Math.floor(input.stackedOrderCount));
  } else if (input.packageCount && input.packageCount > 1) {
    secondaryOrderCount = Math.max(0, Math.floor(input.packageCount - 1));
  }
  const stackedCalc = calculateStackedOrderPay(secondaryOrderCount, tier);
  const stackedOrderPayPaise = stackedCalc.totalStackedOrderPayPaise;
  const multiPackageBonusPaise = stackedOrderPayPaise;

  // 6. Subtotal before tip
  const rawDeliveryFarePaise =
    baseAndDistancePaise +
    waitCalc.waitPayPaise +
    surgeCalc.totalSurgePaise +
    stackedOrderPayPaise;

  // Enforce statutory minimum floor
  const floorPaise = input.customFloorPaise ?? basePayInfo.floorPaise;
  const deliveryFareAfterFloorPaise = Math.max(floorPaise, rawDeliveryFarePaise);
  const isFloorEnforced = rawDeliveryFarePaise < floorPaise;

  // 7. Customer Tip (100% direct pass-through, zero deduction)
  const tipCalc = calculateCustomerTipPassThrough(input.customerTipPaise ?? 0);

  // 8. Total Payout (all integer paise)
  const totalPayoutPaise = deliveryFareAfterFloorPaise + tipCalc.netTipPassThroughPaise;

  return {
    cityTier: tier,
    pickupFeePaise,
    dropFeePaise,
    basePayPaise,
    distanceKm: input.distanceKm,
    billableExtraKm,
    ratePerKmPaise: ratePerKm,
    distancePayPaise,
    baseAndDistancePaise,
    isLdo,
    ldoBonusPaise,
    progressiveDistance,
    waitMinutes: waitCalc.totalWaitMinutes,
    billableWaitMinutes: waitCalc.billableWaitMinutes,
    rawBillableWaitMinutes: waitCalc.rawBillableWaitMinutes,
    isWaitCapped: waitCalc.isCapped,
    waitTimePayPaise: waitCalc.waitPayPaise,
    isRainSurge: surgeCalc.isRainSurge,
    rainSurgeBonusPaise: surgeCalc.rainSurgeBonusPaise,
    peakMultiplier: surgeCalc.peakMultiplier,
    peakMultiplierBoostPaise: surgeCalc.peakMultiplierBoostPaise,
    totalSurgePaise: surgeCalc.totalSurgePaise,
    secondaryOrderCount,
    stackedOrderPayPaise,
    multiPackageBonusPaise,
    customerTipPaise: tipCalc.netTipPassThroughPaise,
    floorPaise,
    isFloorEnforced,
    subtotalBeforeTipPaise: deliveryFareAfterFloorPaise,
    totalPayoutPaise,
  };
}

// ---------------------------------------------------------------------------
// 9. BACKWARDS-COMPATIBLE STATUTORY WRAPPERS
// ---------------------------------------------------------------------------

/**
 * Calculates rider payout enforcing statutory ₹35 base fare floor (3,500 paise).
 *
 * Supports both:
 * - Zomato's Progressive Distance Slabs (when useProgressive is true / enabled)
 * - Statutory flat distance rate (₹12/km beyond 2km) for 100% backwards compatibility
 *   with existing dispatch & lifecycle tests.
 *
 * @param distanceKm Total route distance in kilometers
 * @param customRateOrOptions Distance rate in paise/km OR options object with useProgressiveSlabs
 * @param baseDistanceKm Base distance included in base fare (defaults to 2 km)
 * @param useProgressiveExplicit Explicit boolean flag to enforce progressive distance slabs
 * @returns Total calculated payout in paise (guaranteed >= 3500 paise)
 */
export function calculateRiderPayout(
  distanceKm: number,
  customRateOrOptions?: number | { useProgressiveSlabs?: boolean; baseDistanceKm?: number },
  baseDistanceKm = STATUTORY_BASE_DISTANCE_KM,
  useProgressiveExplicit?: boolean,
): number {
  const dist = Math.max(0, Number.isFinite(distanceKm) ? distanceKm : 0);

  let useProgressive = false;
  let customRate = STATUTORY_DISTANCE_RATE_PER_KM_PAISE;
  let baseDist = baseDistanceKm;

  if (typeof customRateOrOptions === "object" && customRateOrOptions !== null) {
    useProgressive = Boolean(customRateOrOptions.useProgressiveSlabs);
    if (customRateOrOptions.baseDistanceKm !== undefined) {
      baseDist = customRateOrOptions.baseDistanceKm;
    }
  } else if (typeof customRateOrOptions === "boolean") {
    useProgressive = customRateOrOptions;
  } else if (typeof customRateOrOptions === "number") {
    customRate = customRateOrOptions;
    if (useProgressiveExplicit !== undefined) {
      useProgressive = useProgressiveExplicit;
    }
  } else if (useProgressiveExplicit !== undefined) {
    useProgressive = useProgressiveExplicit;
  }

  if (useProgressive) {
    const prog = calculateProgressiveDistancePay(dist);
    const totalPaise = STATUTORY_BASE_FARE_PAISE + prog.totalDistancePayPaise;
    return Math.max(STATUTORY_BASE_FARE_PAISE, totalPaise);
  }

  const extraKm = Math.max(0, dist - baseDist);
  const distanceFarePaise = Math.round(extraKm * customRate);
  const totalPaise = STATUTORY_BASE_FARE_PAISE + distanceFarePaise;
  return Math.max(STATUTORY_BASE_FARE_PAISE, totalPaise);
}

/**
 * Strictly enforces the statutory minimum floor of ₹35 (3,500 paise) on any payout.
 */
export function enforcePayoutFloor(amountPaise: number, floorPaise = STATUTORY_BASE_FARE_PAISE): number {
  const amount = Number.isFinite(amountPaise) ? Math.round(amountPaise) : floorPaise;
  return Math.max(floorPaise, amount);
}
