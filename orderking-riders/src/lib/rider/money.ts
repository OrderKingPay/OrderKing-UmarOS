/**
 * OrderKing Money & Tier-1 Algorithmic Payout Matrix
 *
 * Implements 100% of dominant legacy aggregator Indian courier payout algorithms:
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

/** Distance rate allowable boundary: ₹7/km to ₹14/km (Statutory Tier-1 boundary: ₹7-₹12/km) */
export const MIN_DISTANCE_RATE_PER_KM_PAISE = 700; // ₹7/km
export const MAX_DISTANCE_RATE_PER_KM_PAISE = 1400; // ₹14/km

/** Tier-1 Base Pay boundaries: ₹20 to ₹35 depending on zone/tier */
export const MIN_TIER1_BASE_PAY_PAISE = 2000; // ₹20.00
export const MAX_TIER1_BASE_PAY_PAISE = 3500; // ₹35.00

export type CityTier = "TIER_1" | "TIER_2" | "TIER_3" | "TIER_LOCAL";

export interface CityTierPayConfig {
  tier: CityTier;
  name: string;
  pickupFeePaise: number;
  dropFeePaise: number;
  basePayPaise: number; // pickupFeePaise + dropFeePaise
  baseDistanceKm: number;
  defaultRatePerKmPaise: number; // ₹7-₹12/km
  minimumFareFloorPaise: number;
}

/**
 * Dominant Legacy Aggregator Indian City Tier Payout Matrix:
 * - Tier 1 (Metros: Bangalore, Mumbai, Delhi NCR, Hyderabad, Chennai, Kolkata, Pune)
 *   Base Pay: ₹35 (Pickup ₹20 + Drop ₹15) | Floor: ₹35 | Rate: ₹12/km beyond 2km
 * - Tier 2 (Growth Cities: Jaipur, Ahmedabad, Lucknow, Chandigarh, Kochi, Indore, etc.)
 *   Base Pay: ₹30 (Pickup ₹18 + Drop ₹12) | Floor: ₹30 | Rate: ₹11/km beyond 2km
 * - Tier 3 (Emerging Towns & Rest of India)
 *   Base Pay: ₹25 (Pickup ₹15 + Drop ₹10) | Floor: ₹25 | Rate: ₹10/km beyond 2km
 * - Tier Local / Rural Zones:
 *   Base Pay: ₹20 (Pickup ₹12 + Drop ₹8) | Floor: ₹20 | Rate: ₹8.50/km beyond 2km
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
  TIER_LOCAL: {
    tier: "TIER_LOCAL",
    name: "Tier Local / Suburban Zones (Base ₹20)",
    pickupFeePaise: 1200, // ₹12.00
    dropFeePaise: 800, // ₹8.00
    basePayPaise: 2000, // ₹20.00
    baseDistanceKm: 2,
    defaultRatePerKmPaise: 850, // ₹8.50/km
    minimumFareFloorPaise: 2000, // ₹20.00
  },
};

/**
 * Returns the base pay breakdown for a given city tier with optional dynamic platform config overrides.
 */
export function getBasePay(
  cityTier: CityTier = "TIER_1",
  dynamicConfig?: Partial<DynamicPricingConfig> | PlatformConfig | null,
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
  const pricing = dynamicConfig && "pricing" in dynamicConfig && dynamicConfig.pricing
    ? dynamicConfig.pricing
    : (dynamicConfig as Partial<DynamicPricingConfig> | null | undefined);

  const pickupFeePaise = pricing?.pickupFeePaise ?? cfg.pickupFeePaise;
  const dropFeePaise = pricing?.dropFeePaise ?? cfg.dropFeePaise;
  const basePayPaise = pricing?.basePayPaise ?? (pickupFeePaise + dropFeePaise);

  let floorPaise = cfg.minimumFareFloorPaise;
  if (pricing) {
    if (cityTier === "TIER_1" && pricing.tier1BaseFloorPaise !== undefined) {
      floorPaise = pricing.tier1BaseFloorPaise;
    } else if (cityTier === "TIER_2" && pricing.tier2BaseFloorPaise !== undefined) {
      floorPaise = pricing.tier2BaseFloorPaise;
    } else if (cityTier === "TIER_3" && pricing.tier3BaseFloorPaise !== undefined) {
      floorPaise = pricing.tier3BaseFloorPaise;
    } else if (pricing.basePayPaise !== undefined) {
      floorPaise = pricing.basePayPaise;
    }
  }

  const ratePerKmPaise =
    pricing?.defaultRatePerKmPaise ??
    pricing?.distanceSlabs?.slab1RatePerKmPaise ??
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
 * Calculates progressive distance pay strictly according to dominant legacy aggregator payout slabs:
 * - Slab 1 (0.0 to 2.0 km): Included in Base Pay (₹0 extra).
 * - Slab 2 (2.0 to 5.0 km): ₹12.00/km (1,200 paise/km).
 * - Slab 3 (5.0 to 8.0 km): ₹14.00/km (1,400 paise/km).
 * - Slab 4 (> 8.0 km - Long Distance Order / LDO): ₹16.00/km (1,600 paise/km) + ₹20.00 (2,000 paise) flat LDO return bonus.
 */
export function calculateProgressiveDistancePay(
  distanceKm: number,
  config?: ProgressiveDistanceConfig | Partial<DynamicPricingConfig> | PlatformConfig | null,
): ProgressiveDistanceBreakdown {
  const dist = Math.max(0, Number.isFinite(distanceKm) ? distanceKm : 0);

  let progConfig: ProgressiveDistanceConfig | undefined;
  if (config) {
    const pricing = "pricing" in config && config.pricing ? config.pricing : config;
    if ("distanceSlabs" in pricing && pricing.distanceSlabs) {
      const slabs = pricing.distanceSlabs;
      const isSlab1Based = "slab1RatePerKmPaise" in slabs;
      progConfig = {
        slab2RatePerKmPaise: isSlab1Based
          ? slabs.slab1RatePerKmPaise
          : ((slabs as ProgressiveDistanceConfig).slab2RatePerKmPaise ?? SLAB_2_RATE_PER_KM_PAISE),
        slab3RatePerKmPaise: isSlab1Based
          ? slabs.slab2RatePerKmPaise
          : ((slabs as ProgressiveDistanceConfig).slab3RatePerKmPaise ?? SLAB_3_RATE_PER_KM_PAISE),
        slab4RatePerKmPaise: isSlab1Based
          ? slabs.slab3RatePerKmPaise
          : ((slabs as ProgressiveDistanceConfig).slab4RatePerKmPaise ?? SLAB_4_RATE_PER_KM_PAISE),
        ldoBonusPaise: slabs.ldoBonusPaise ?? LDO_RETURN_BONUS_PAISE,
      };
    } else {
      progConfig = config as ProgressiveDistanceConfig;
    }
  }

  const s1Max = progConfig?.slab1MaxKm ?? SLAB_1_MAX_KM;
  const s2Max = progConfig?.slab2MaxKm ?? SLAB_2_MAX_KM;
  const s3Max = progConfig?.slab3MaxKm ?? SLAB_3_MAX_KM;

  const s2Rate = progConfig?.slab2RatePerKmPaise ?? SLAB_2_RATE_PER_KM_PAISE;
  const s3Rate = progConfig?.slab3RatePerKmPaise ?? SLAB_3_RATE_PER_KM_PAISE;
  const s4Rate = progConfig?.slab4RatePerKmPaise ?? SLAB_4_RATE_PER_KM_PAISE;

  const ldoThreshold = progConfig?.ldoThresholdKm ?? LDO_THRESHOLD_KM;
  const ldoBonus = progConfig?.ldoBonusPaise ?? LDO_RETURN_BONUS_PAISE;

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
 * Statutory Tier-1 Progressive Distance Slabs covering 0-3km base distance:
 * - Base 0 to 3.0 km: Covered in base pay (₹0 extra).
 * - Slab 2 (3.0 to 6.0 km): ₹8.50/km (850 paise/km) [Statutory range: ₹7–₹12/km].
 * - Slab 3 (6.0 to 8.0 km): ₹10.50/km (1,050 paise/km) [Statutory range: ₹7–₹12/km].
 * - Slab 4 (> 8.0 km - Long Distance Order / LDO): ₹12.00/km (1,200 paise/km) + ₹20.00 (2,000 paise) flat return bonus.
 */
export const TIER1_PROGRESSIVE_DISTANCE_SLABS_3KM = {
  SLAB_1_BASE: { minKm: 0.0, maxKm: 3.0, ratePerKmPaise: 0 },
  SLAB_2_NEAR: { minKm: 3.0, maxKm: 6.0, ratePerKmPaise: 850 },
  SLAB_3_MID: { minKm: 6.0, maxKm: 8.0, ratePerKmPaise: 1050 },
  SLAB_4_FAR: { minKm: 8.0, maxKm: Infinity, ratePerKmPaise: 1200 },
} as const;

/**
 * Calculates progressive distance pay with base 0–3km covered and ₹7–₹12/km after 3km.
 */
export function calculateTier1ProgressivePay3Km(
  distanceKm: number,
  customRatePerKmPaise?: number,
): ProgressiveDistanceBreakdown {
  const rate = customRatePerKmPaise ?? 850;
  return calculateProgressiveDistancePay(distanceKm, {
    slab1MaxKm: 3.0,
    slab2MaxKm: 6.0,
    slab3MaxKm: 8.0,
    slab2RatePerKmPaise: rate,
    slab3RatePerKmPaise: customRatePerKmPaise !== undefined ? customRatePerKmPaise : 1050,
    slab4RatePerKmPaise: customRatePerKmPaise !== undefined ? customRatePerKmPaise : 1200,
    ldoBonusPaise: LDO_RETURN_BONUS_PAISE,
    ldoThresholdKm: LDO_THRESHOLD_KM,
  });
}

/**
 * Calculates distance pay for kilometers travelled beyond base distance.
 * Distance under base distance (2 km) is covered by base pay.
 */
export function calculateDistancePay(
  distanceKm: number,
  customRatePerKmPaiseOrConfig: number | Partial<DynamicPricingConfig> | PlatformConfig = STATUTORY_DISTANCE_RATE_PER_KM_PAISE,
  baseDistanceKm = STATUTORY_BASE_DISTANCE_KM,
  dynamicSlabs?: ProgressiveDistanceSlabs | ProgressiveDistanceConfig | Partial<DynamicPricingConfig> | PlatformConfig | null,
): {
  totalDistanceKm: number;
  baseDistanceKm: number;
  billableExtraKm: number;
  ratePerKmPaise: number;
  distancePayPaise: number;
  ldoBonusPaise?: number;
} {
  let customRate = typeof customRatePerKmPaiseOrConfig === "number" ? customRatePerKmPaiseOrConfig : STATUTORY_DISTANCE_RATE_PER_KM_PAISE;
  let baseDist = baseDistanceKm;
  let slabsInput = dynamicSlabs;

  if (typeof customRatePerKmPaiseOrConfig === "object" && customRatePerKmPaiseOrConfig !== null) {
    const pricing = "pricing" in customRatePerKmPaiseOrConfig && customRatePerKmPaiseOrConfig.pricing
      ? customRatePerKmPaiseOrConfig.pricing
      : (customRatePerKmPaiseOrConfig as Partial<DynamicPricingConfig>);
    if (pricing.defaultRatePerKmPaise !== undefined) {
      customRate = pricing.defaultRatePerKmPaise;
    }
    if (pricing.distanceSlabs) {
      slabsInput = pricing.distanceSlabs;
    }
  }

  if (slabsInput) {
    const pricing = "pricing" in slabsInput && slabsInput.pricing ? slabsInput.pricing : slabsInput;
    const resolvedSlabs = ("distanceSlabs" in pricing && pricing.distanceSlabs) ? pricing.distanceSlabs : pricing;

    const isSlab1Keyed = "slab1RatePerKmPaise" in resolvedSlabs;
    const s2Rate = isSlab1Keyed
      ? (resolvedSlabs as ProgressiveDistanceSlabs).slab1RatePerKmPaise
      : ((resolvedSlabs as ProgressiveDistanceConfig).slab2RatePerKmPaise ?? SLAB_2_RATE_PER_KM_PAISE);
    const s3Rate = isSlab1Keyed
      ? (resolvedSlabs as ProgressiveDistanceSlabs).slab2RatePerKmPaise
      : ((resolvedSlabs as ProgressiveDistanceConfig).slab3RatePerKmPaise ?? SLAB_3_RATE_PER_KM_PAISE);
    const s4Rate = isSlab1Keyed
      ? (resolvedSlabs as ProgressiveDistanceSlabs).slab3RatePerKmPaise
      : ((resolvedSlabs as ProgressiveDistanceConfig).slab4RatePerKmPaise ?? SLAB_4_RATE_PER_KM_PAISE);
    const ldoBonus = (resolvedSlabs as any).ldoBonusPaise ?? LDO_RETURN_BONUS_PAISE;

    const prog = calculateProgressiveDistancePay(distanceKm, {
      slab1MaxKm: baseDist,
      slab2RatePerKmPaise: s2Rate,
      slab3RatePerKmPaise: s3Rate,
      slab4RatePerKmPaise: s4Rate,
      ldoBonusPaise: ldoBonus,
    });
    return {
      totalDistanceKm: prog.totalDistanceKm,
      baseDistanceKm: baseDist,
      billableExtraKm: prog.billableExtraKm,
      ratePerKmPaise: s2Rate,
      distancePayPaise: prog.totalDistancePayPaise,
      ldoBonusPaise: prog.ldoBonusPaise,
    };
  }

  const dist = Math.max(0, Number.isFinite(distanceKm) ? distanceKm : 0);
  const baseD = Math.max(0, Number.isFinite(baseDist) ? baseDist : STATUTORY_BASE_DISTANCE_KM);
  // Clamp rate between ₹10/km and ₹14/km if user passes custom rate
  const clampedRate = Math.min(
    MAX_DISTANCE_RATE_PER_KM_PAISE,
    Math.max(MIN_DISTANCE_RATE_PER_KM_PAISE, Math.round(customRate)),
  );
  const extraKm = Math.max(0, dist - baseD);
  const distancePayPaise = Math.round(extraKm * clampedRate);

  return {
    totalDistanceKm: dist,
    baseDistanceKm: baseD,
    billableExtraKm: Number(extraKm.toFixed(2)),
    ratePerKmPaise: clampedRate,
    distancePayPaise,
  };
}

// ---------------------------------------------------------------------------
// 3. RESTAURANT WAIT-TIME PAY: EXACTLY ₹1/MIN AFTER 6 MINS GRACE (CAP AT 30 MINS)
// ---------------------------------------------------------------------------

/**
 * Dominant Legacy Aggregator Wait-Time Policy:
 * The timer begins when courier marks 'ARRIVED_AT_RESTAURANT'.
 * First 6 minutes are free grace period.
 * Every subsequent minute is compensated at EXACTLY ₹1/minute (100 paise/min).
 * Safety Cap: Capped at MAX_BILLABLE_WAIT_MINUTES = 30 (cap at ₹30.00 / 3,000 paise)
 * to strictly eliminate runaway financial liability from errant restaurant operations.
 */
export const RESTAURANT_WAIT_GRACE_PERIOD_MINUTES = 6;
/** Tier-1 statutory wait grace threshold: >5 minutes at restaurant pays ₹1.00/min compensation */
export const TIER1_WAIT_GRACE_MINUTES = 5;
export const RESTAURANT_WAIT_PAY_RATE_PER_MIN_PAISE = 100; // ₹1.00 / min
export const MAX_BILLABLE_WAIT_MINUTES = 30; // ₹30.00 (3,000 paise) safety cap
export const MAX_WAIT_PAY_PAISE = 3000; // ₹30.00 (3,000 paise)
export const RESTAURANT_GEOFENCE_RADIUS_METERS = 150; // 150 meters
export const RESTAURANT_GEOFENCE_RADIUS_KM = 0.15; // 0.15 km

export function calculateRestaurantWaitPayPaise(
  waitMinutes: number,
  gracePeriodMinutesOrConfig: number | Partial<DynamicPricingConfig> | PlatformConfig = RESTAURANT_WAIT_GRACE_PERIOD_MINUTES,
  ratePerMinPaise = RESTAURANT_WAIT_PAY_RATE_PER_MIN_PAISE,
  maxBillableMinutes = MAX_BILLABLE_WAIT_MINUTES,
  waitCapPaise?: number,
  dynamicConfig?: Partial<DynamicPricingConfig> | PlatformConfig | null,
): number {
  let grace = typeof gracePeriodMinutesOrConfig === "number" ? gracePeriodMinutesOrConfig : RESTAURANT_WAIT_GRACE_PERIOD_MINUTES;
  let rate = ratePerMinPaise;
  let maxBillable = maxBillableMinutes;
  let cap = waitCapPaise;

  const dynObj = typeof gracePeriodMinutesOrConfig === "object" && gracePeriodMinutesOrConfig !== null
    ? gracePeriodMinutesOrConfig
    : dynamicConfig;

  if (dynObj) {
    const pricing: any = "pricing" in dynObj && dynObj.pricing ? dynObj.pricing : dynObj;
    if (pricing.waitGraceMinutes !== undefined) grace = pricing.waitGraceMinutes;
    if (pricing.waitRatePerMinPaise !== undefined) rate = pricing.waitRatePerMinPaise;
    if (pricing.maxBillableWaitMinutes !== undefined) maxBillable = pricing.maxBillableWaitMinutes;
    if (pricing.waitCapPaise !== undefined) cap = pricing.waitCapPaise;
  }

  const mins = Math.max(0, Number.isFinite(waitMinutes) ? Math.floor(waitMinutes) : 0);
  const finalGrace = Math.max(0, Math.floor(grace));
  const rawBillableMins = Math.max(0, mins - finalGrace);
  const billableMins = Math.min(Math.max(0, Math.floor(maxBillable)), rawBillableMins);
  const rawPay = Math.round(billableMins * Math.max(0, Math.round(rate)));
  if (cap !== undefined && cap > 0) {
    return Math.min(rawPay, Math.round(cap));
  }
  return rawPay;
}

export function calculateRestaurantWaitPay(
  waitMinutes: number,
  gracePeriodMinutesOrConfig: number | Partial<DynamicPricingConfig> | PlatformConfig = RESTAURANT_WAIT_GRACE_PERIOD_MINUTES,
  ratePerMinPaise = RESTAURANT_WAIT_PAY_RATE_PER_MIN_PAISE,
  maxBillableMinutes = MAX_BILLABLE_WAIT_MINUTES,
  waitCapPaise?: number,
  dynamicConfig?: Partial<DynamicPricingConfig> | PlatformConfig | null,
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
  let grace = typeof gracePeriodMinutesOrConfig === "number" ? gracePeriodMinutesOrConfig : RESTAURANT_WAIT_GRACE_PERIOD_MINUTES;
  let rate = ratePerMinPaise;
  let maxBillable = maxBillableMinutes;
  let cap = waitCapPaise;

  const dynObj = typeof gracePeriodMinutesOrConfig === "object" && gracePeriodMinutesOrConfig !== null
    ? gracePeriodMinutesOrConfig
    : dynamicConfig;

  if (dynObj) {
    const pricing: any = "pricing" in dynObj && dynObj.pricing ? dynObj.pricing : dynObj;
    if (pricing.waitGraceMinutes !== undefined) grace = pricing.waitGraceMinutes;
    if (pricing.waitRatePerMinPaise !== undefined) rate = pricing.waitRatePerMinPaise;
    if (pricing.maxBillableWaitMinutes !== undefined) maxBillable = pricing.maxBillableWaitMinutes;
    if (pricing.waitCapPaise !== undefined) cap = pricing.waitCapPaise;
  }

  const mins = Math.max(0, Number.isFinite(waitMinutes) ? Math.floor(waitMinutes) : 0);
  const finalGrace = Math.max(0, Math.floor(grace));
  const rawBillableWaitMinutes = Math.max(0, mins - finalGrace);
  const maxBillableFinal = Math.max(0, Math.floor(maxBillable));
  const billableWaitMinutes = Math.min(maxBillableFinal, rawBillableWaitMinutes);
  let isCapped = rawBillableWaitMinutes > maxBillableFinal;
  const finalRate = Math.max(0, Math.round(rate));
  let waitPayPaise = billableWaitMinutes * finalRate;
  if (cap !== undefined && cap > 0 && waitPayPaise > cap) {
    waitPayPaise = Math.round(cap);
    isCapped = true;
  }

  return {
    totalWaitMinutes: mins,
    gracePeriodMinutes: finalGrace,
    rawBillableWaitMinutes,
    billableWaitMinutes,
    maxBillableWaitMinutes: maxBillableFinal,
    isCapped,
    ratePerMinPaise: finalRate,
    waitPayPaise,
    waitCapPaise: cap !== undefined ? Math.round(cap) : null,
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

/**
 * Exact Tier-1 Kitchen Wait Pay:
 * - Counter wait begins upon courier marking 'ARRIVED_AT_RESTAURANT'.
 * - Starts automatically after 5 minutes grace period.
 * - Paid at ₹1.00/minute (100 paise/minute).
 * - Capped at 30 billable minutes (₹30.00 / 3,000 paise) to strictly eliminate runaway financial liability.
 */
export function calculateTier1KitchenWaitPay(
  waitMinutes: number,
  waitCapPaise: number = MAX_WAIT_PAY_PAISE,
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
  return calculateRestaurantWaitPay(
    waitMinutes,
    TIER1_WAIT_GRACE_MINUTES, // 5 minutes grace
    RESTAURANT_WAIT_PAY_RATE_PER_MIN_PAISE, // 100 paise/min (₹1.00/min)
    MAX_BILLABLE_WAIT_MINUTES, // 30 mins
    waitCapPaise,
  );
}

export function calculateTier1KitchenWaitPayPaise(
  waitMinutes: number,
  waitCapPaise: number = MAX_WAIT_PAY_PAISE,
): number {
  return calculateTier1KitchenWaitPay(waitMinutes, waitCapPaise).waitPayPaise;
}

// ---------------------------------------------------------------------------
// 4. RAIN SURGE & PEAK HOUR SURGE PAY: DYNAMIC MULTIPLIER (₹10 - ₹45 SURGE)
// ---------------------------------------------------------------------------

/** Allowable rain surge bonus range: ₹10 to ₹45 (1000 to 4500 paise) */
export const MIN_RAIN_SURGE_BONUS_PAISE = 1000; // ₹10
export const MAX_RAIN_SURGE_BONUS_PAISE = 4500; // ₹45
export const DEFAULT_RAIN_SURGE_BONUS_PAISE = 2500; // ₹25

/** Statutory Monsoon Surge range: +₹20 to +₹45 (2,000 to 4,500 paise) */
export const MONSOON_SURGE_MIN_PAISE = 2000; // ₹20
export const MONSOON_SURGE_MAX_PAISE = 4500; // ₹45
export const DEFAULT_MONSOON_SURGE_PAISE = 3000; // ₹30

/** Statutory Peak Dinner Surge range: +₹15 to +₹30 (1,500 to 3,000 paise) */
export const PEAK_DINNER_SURGE_MIN_PAISE = 1500; // ₹15
export const PEAK_DINNER_SURGE_MAX_PAISE = 3000; // ₹30
export const DEFAULT_PEAK_DINNER_SURGE_PAISE = 2000; // ₹20

export interface SurgePayCalculationInput {
  baseAndDistancePaise: number;
  isRainSurge?: boolean;
  rainSurgeBonusPaise?: number; // ₹10 - ₹45
  isMonsoonSurge?: boolean;
  monsoonSurgeBonusPaise?: number; // ₹20 - ₹45
  isPeakDinnerSurge?: boolean;
  peakDinnerSurgePaise?: number; // ₹15 - ₹30
  peakMultiplier?: number; // 1.0x - 2.5x
}

export function calculateSurgePay(input: SurgePayCalculationInput): {
  peakMultiplier: number;
  peakMultiplierBoostPaise: number;
  isRainSurge: boolean;
  rainSurgeBonusPaise: number;
  isMonsoonSurge: boolean;
  monsoonSurgeBonusPaise: number;
  isPeakDinnerSurge: boolean;
  peakDinnerSurgePaise: number;
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

  let monsoonSurgeBonusPaise = 0;
  if (input.isMonsoonSurge) {
    const rawBonus = input.monsoonSurgeBonusPaise ?? DEFAULT_MONSOON_SURGE_PAISE;
    monsoonSurgeBonusPaise = Math.min(
      MONSOON_SURGE_MAX_PAISE,
      Math.max(MONSOON_SURGE_MIN_PAISE, Math.round(rawBonus)),
    );
  }

  let peakDinnerSurgePaise = 0;
  if (input.isPeakDinnerSurge) {
    const rawBonus = input.peakDinnerSurgePaise ?? DEFAULT_PEAK_DINNER_SURGE_PAISE;
    peakDinnerSurgePaise = Math.min(
      PEAK_DINNER_SURGE_MAX_PAISE,
      Math.max(PEAK_DINNER_SURGE_MIN_PAISE, Math.round(rawBonus)),
    );
  }

  const effectiveRainSurge = monsoonSurgeBonusPaise > 0 ? monsoonSurgeBonusPaise : rainSurgeBonusPaise;
  const isRain = Boolean(input.isRainSurge || input.isMonsoonSurge);
  const totalSurgePaise = peakMultiplierBoostPaise + effectiveRainSurge + peakDinnerSurgePaise;

  return {
    peakMultiplier,
    peakMultiplierBoostPaise,
    isRainSurge: isRain,
    rainSurgeBonusPaise: effectiveRainSurge,
    isMonsoonSurge: Boolean(input.isMonsoonSurge),
    monsoonSurgeBonusPaise,
    isPeakDinnerSurge: Boolean(input.isPeakDinnerSurge),
    peakDinnerSurgePaise,
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
 * Dominant Legacy Aggregator Stacked / Multi-Order Policy:
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

export interface StackedOrderPayOptions {
  pickupDiscountPct?: number; // e.g. 40% discount (60% paid) or 35% discount (65% paid)
  pickupFeePercentage?: number; // legacy alias e.g. 60%
  dropFeePercentage?: number; // default 100%
  customPickupFeePaise?: number;
  customDropFeePaise?: number;
}

export function calculateStackedOrderPay(
  secondaryOrderCount: number,
  cityTier: CityTier = "TIER_1",
  options?: StackedOrderPayOptions,
): StackedOrderPayBreakdown {
  const count = Math.max(0, Number.isFinite(secondaryOrderCount) ? Math.floor(secondaryOrderCount) : 0);
  const cfg = CITY_TIER_PAY_CONFIGS[cityTier] ?? CITY_TIER_PAY_CONFIGS.TIER_1;

  const pickupFee = options?.customPickupFeePaise ?? cfg.pickupFeePaise;
  const dropFee = options?.customDropFeePaise ?? cfg.dropFeePaise;

  let pickupPct = STACKED_PICKUP_FEE_PERCENTAGE;
  if (options?.pickupDiscountPct !== undefined) {
    pickupPct = Math.max(0, 100 - options.pickupDiscountPct);
  } else if (options?.pickupFeePercentage !== undefined) {
    pickupPct = options.pickupFeePercentage;
  }

  const dropPct = options?.dropFeePercentage ?? STACKED_DROP_FEE_PERCENTAGE;

  const stackedPickupFeePaise = Math.round((pickupFee * pickupPct) / 100);
  const stackedDropFeePaise = Math.round((dropFee * dropPct) / 100);
  const payPerSecondaryOrderPaise = stackedPickupFeePaise + stackedDropFeePaise;
  const totalStackedOrderPayPaise = count * payPerSecondaryOrderPaise;

  return {
    secondaryOrderCount: count,
    cityTier: cfg.tier,
    tierPickupFeePaise: pickupFee,
    tierDropFeePaise: dropFee,
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
  options?: StackedOrderPayOptions,
): number {
  return calculateStackedOrderPay(secondaryOrderCount, cityTier, options).totalStackedOrderPayPaise;
}

// ---------------------------------------------------------------------------
// 7. TIER-1 WEEKLY PAYOUT CYCLE (MON 00:00:00 - SUN 23:59:59 -> WED SETTLEMENT)
// ---------------------------------------------------------------------------

export const TIER1_PAYOUT_SETTLEMENT_DAY = "WEDNESDAY";
export const TIER1_PAYOUT_SETTLEMENT_HOUR_UTC = 15; // 3:00 PM UTC (Wednesday afternoon)
export const TIER1_PAYOUT_SETTLEMENT_HOUR_IST = 14; // 2:00 PM IST (14:00 IST)
export const TIER1_PAYOUT_SETTLEMENT_TIME_IST = "14:00"; // 2:00 PM IST
export const TIER1_PAYOUT_SETTLEMENT_SCHEDULE = "Wednesday 2:00 PM IST";

export interface Tier1WeeklyCycle {
  cycleStart: Date;
  cycleEnd: Date;
  payoutDate: Date;
  cycleStartIso: string;
  cycleEndIso: string;
  payoutDateIso: string;
  formattedCycle: string;
  settlementDay?: string;
  settlementTimeIst?: string;
  settlementSchedule?: string;
}

/**
 * Standardizes Tier-1 dominant legacy aggregator's weekly payout cycle:
 * - Cycle Window: Monday 00:00:00 to Sunday 23:59:59.
 * - Payout Settlement: Automated Wednesday afternoon settlement following cycle close (Wednesday 2:00 PM IST / 15:00 UTC).
 *
 * @param dateInput Target date or timestamp within the cycle (defaults to now)
 * @param options Options flag for UTC or local time calculation
 */
export function getTier1WeeklyCycle(
  dateInput: Date | string | number = new Date(),
  options?: { useUtc?: boolean },
): Tier1WeeklyCycle {
  const d = typeof dateInput === "string" || typeof dateInput === "number"
    ? new Date(dateInput)
    : new Date(dateInput.getTime());

  if (Number.isNaN(d.getTime())) {
    throw new Error("Invalid date provided to getTier1WeeklyCycle");
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
      settlementDay: TIER1_PAYOUT_SETTLEMENT_DAY,
      settlementTimeIst: "14:00 IST (2:00 PM IST)",
      settlementSchedule: TIER1_PAYOUT_SETTLEMENT_SCHEDULE,
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
      settlementDay: TIER1_PAYOUT_SETTLEMENT_DAY,
      settlementTimeIst: "14:00 IST (2:00 PM IST)",
      settlementSchedule: TIER1_PAYOUT_SETTLEMENT_SCHEDULE,
    };
  }
}

// ---------------------------------------------------------------------------
// 8. MASTER TIER-1 ALGORITHMIC PAYOUT BREAKDOWN
// ---------------------------------------------------------------------------

export interface Tier1PayoutInput {
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
  isMonsoonSurge?: boolean;
  monsoonSurgeBonusPaise?: number; // ₹20-₹45
  isPeakDinnerSurge?: boolean;
  peakDinnerSurgePaise?: number; // ₹15-₹30
  peakMultiplier?: number;
  customerTipPaise?: number;
  packageCount?: number;
  stackedOrderCount?: number; // secondary orders in batch
  customFloorPaise?: number;
  dynamicConfig?: DynamicPricingConfig | PlatformConfig | null;
}

export interface Tier1PayoutBreakdown {
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
  isMonsoonSurge?: boolean;
  monsoonSurgeBonusPaise?: number;
  isPeakDinnerSurge?: boolean;
  peakDinnerSurgePaise?: number;
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
 * Calculates complete, end-to-end rider payout conforming 100% to Tier-1 dominant legacy aggregator Indian payout matrix.
 * Guaranteed strictly integer paise calculations throughout.
 */
export function calculateTier1AlgorithmicPayout(input: Tier1PayoutInput): Tier1PayoutBreakdown {
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
  const isSlab1Based = dynamicSlabs && "slab1RatePerKmPaise" in dynamicSlabs;
  const progConfig: ProgressiveDistanceConfig | undefined = dynamicSlabs
    ? {
        ...input.progressiveConfig,
        slab2RatePerKmPaise: isSlab1Based
          ? (dynamicSlabs as ProgressiveDistanceSlabs).slab1RatePerKmPaise
          : ((dynamicSlabs as ProgressiveDistanceConfig).slab2RatePerKmPaise ?? input.progressiveConfig?.slab2RatePerKmPaise),
        slab3RatePerKmPaise: isSlab1Based
          ? (dynamicSlabs as ProgressiveDistanceSlabs).slab2RatePerKmPaise
          : ((dynamicSlabs as ProgressiveDistanceConfig).slab3RatePerKmPaise ?? input.progressiveConfig?.slab3RatePerKmPaise),
        slab4RatePerKmPaise: isSlab1Based
          ? (dynamicSlabs as ProgressiveDistanceSlabs).slab3RatePerKmPaise
          : ((dynamicSlabs as ProgressiveDistanceConfig).slab4RatePerKmPaise ?? input.progressiveConfig?.slab4RatePerKmPaise),
        ldoBonusPaise: dynamicSlabs.ldoBonusPaise ?? input.progressiveConfig?.ldoBonusPaise,
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
  const maxBillableWait =
    input.maxBillableWaitMinutes ??
    (dynPricing as any)?.maxBillableWaitMinutes ??
    MAX_BILLABLE_WAIT_MINUTES;
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

  // 4. Surge Pay (Rain/Monsoon surge bonus + Peak Dinner surge + Peak dynamic multiplier)
  const surgeCalc = calculateSurgePay({
    baseAndDistancePaise,
    isRainSurge: input.isRainSurge,
    rainSurgeBonusPaise: input.rainSurgeBonusPaise,
    isMonsoonSurge: input.isMonsoonSurge,
    monsoonSurgeBonusPaise: input.monsoonSurgeBonusPaise,
    isPeakDinnerSurge: input.isPeakDinnerSurge,
    peakDinnerSurgePaise: input.peakDinnerSurgePaise,
    peakMultiplier: input.peakMultiplier,
  });

  // 5. Stacked / Multi-Package Order Pay:
  // Dominant Legacy Aggregator Standard: 60% of tier pickup fee + 100% of tier drop fee per secondary order (~₹22 - ₹27)
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
    isMonsoonSurge: surgeCalc.isMonsoonSurge,
    monsoonSurgeBonusPaise: surgeCalc.monsoonSurgeBonusPaise,
    isPeakDinnerSurge: surgeCalc.isPeakDinnerSurge,
    peakDinnerSurgePaise: surgeCalc.peakDinnerSurgePaise,
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
 * - Tier-1 Progressive Distance Slabs (when useProgressive is true / enabled)
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

/**
 * Calculates delivery partner payout using SafeInteger paise precision:
 * Base Fare (e.g. ₹30 / 3000 paise) + Distance Incentive (e.g. ₹10/km / 1000 paise/km) + Customer Tip (100% pass-through).
 * Zero floating-point rounding.
 */
export function calculateDeliveryPayoutWithTip(params: {
  baseFarePaise?: number; // e.g. 3000 (₹30.00)
  distanceKm: number;
  distanceRatePerKmPaise?: number; // e.g. 1000 (₹10.00/km)
  tipPaise?: number;
}): {
  baseFarePaise: number;
  distanceKm: number;
  distanceIncentivePaise: number;
  tipPaise: number;
  totalPayoutPaise: number;
} {
  const base = Math.max(0, Math.round(params.baseFarePaise ?? 3000));
  const dist = Math.max(0, Number.isFinite(params.distanceKm) ? params.distanceKm : 0);
  const rate = Math.max(0, Math.round(params.distanceRatePerKmPaise ?? 1000));
  const distanceIncentivePaise = Math.round(dist * rate);
  const tip = Math.max(0, Math.round(params.tipPaise ?? 0));
  const totalPayoutPaise = base + distanceIncentivePaise + tip;
  return {
    baseFarePaise: base,
    distanceKm: dist,
    distanceIncentivePaise,
    tipPaise: tip,
    totalPayoutPaise,
  };
}

// ---------------------------------------------------------------------------
// 10. CLEAN OPERATIONAL TIERS (Bronze, Silver, Gold, Diamond - No Fantasy Jargon)
// ---------------------------------------------------------------------------

export type OperationalTier = "BRONZE" | "SILVER" | "GOLD" | "DIAMOND";

export interface OperationalTierInfo {
  tier: OperationalTier;
  title: string;
  minTripsLifetime: number;
  surgeMultiplier: number;
  fuelCashbackPct: number;
  floatingCashLimitPaise: number;
  priorityDispatch: boolean;
  perks: string[];
}

export const OPERATIONAL_TIERS: Record<OperationalTier, OperationalTierInfo> = {
  BRONZE: {
    tier: "BRONZE",
    title: "Bronze Partner",
    minTripsLifetime: 0,
    surgeMultiplier: 1.0,
    fuelCashbackPct: 2.5,
    floatingCashLimitPaise: 200000, // ₹2,000 threshold
    priorityDispatch: false,
    perks: ["Standard Dispatch", "Weekly Wednesday Payouts", "HPCL 2.5% Fuel Discount", "₹2,000 COD Float Limit"],
  },
  SILVER: {
    tier: "SILVER",
    title: "Silver Partner",
    minTripsLifetime: 50,
    surgeMultiplier: 1.1,
    fuelCashbackPct: 3.0,
    floatingCashLimitPaise: 250000, // ₹2,500 threshold
    priorityDispatch: false,
    perks: ["1.1x Surge Multiplier", "Instant Mid-Shift UPI Clearing", "HPCL 3.0% Fuel Discount", "₹2,500 COD Float Limit"],
  },
  GOLD: {
    tier: "GOLD",
    title: "Gold Partner",
    minTripsLifetime: 200,
    surgeMultiplier: 1.25,
    fuelCashbackPct: 4.0,
    floatingCashLimitPaise: 350000, // ₹3,500 threshold
    priorityDispatch: true,
    perks: ["1.25x Surge Multiplier", "Priority Dispatch Queue", "Free Oil Change Voucher", "HPCL 4.0% Discount", "₹3,500 COD Float Limit"],
  },
  DIAMOND: {
    tier: "DIAMOND",
    title: "Diamond Partner",
    minTripsLifetime: 500,
    surgeMultiplier: 1.5,
    fuelCashbackPct: 5.0,
    floatingCashLimitPaise: 500000, // ₹5,000 threshold
    priorityDispatch: true,
    perks: ["1.5x Surge Multiplier", "Top Priority VIP Dispatch", "Zero Cashout Fees", "Comprehensive Health Cover", "₹5,000 COD Float Limit"],
  },
};

/**
 * Returns the operational tier based on verified lifetime deliveries.
 * Operational tiers strictly use clean real-world logistics titles:
 * Bronze Partner, Silver Partner, Gold Partner, Diamond Partner.
 */
export function getOperationalTier(lifetimeTrips: number): OperationalTierInfo {
  const trips = Math.max(0, Number.isFinite(lifetimeTrips) ? Math.floor(lifetimeTrips) : 0);
  if (trips >= OPERATIONAL_TIERS.DIAMOND.minTripsLifetime) return OPERATIONAL_TIERS.DIAMOND;
  if (trips >= OPERATIONAL_TIERS.GOLD.minTripsLifetime) return OPERATIONAL_TIERS.GOLD;
  if (trips >= OPERATIONAL_TIERS.SILVER.minTripsLifetime) return OPERATIONAL_TIERS.SILVER;
  return OPERATIONAL_TIERS.BRONZE;
}

// ---------------------------------------------------------------------------
// 11. REAL-WORLD COD MANAGEMENT & FLOATING CASH (₹2,000 FLOAT THRESHOLD)
// ---------------------------------------------------------------------------

/** Standard COD Floating Cash Limit: ₹2,000 (200,000 paise) */
export const COD_FLOATING_CASH_LIMIT_INR = 2000;
export const COD_FLOATING_CASH_LIMIT_PAISE = 200000;
export const COD_DEFAULT_TREASURY_VPA = "orderking.treasury@okaxis";

export interface CodPocketBalanceCalculation {
  collectedPaise: number;
  reconciledPaise: number;
  pocketBalancePaise: number;
  limitPaise: number;
  remainingHeadroomPaise: number;
  utilizationPct: number;
  isCodBlocked: boolean;
  canAcceptCod: boolean;
}

/**
 * Calculates real-time COD Floating Cash ("Pocket Balance") and evaluates threshold caps.
 * Strictly maintains 100% SafeInteger paise arithmetic.
 *
 * @param collectedPaise Total cash physically collected by the courier from COD deliveries (in paise)
 * @param reconciledPaise Total cash reconciled via Wednesday payout offset or direct UPI / gateway deposit (in paise)
 * @param limitPaise Configurable floating cash cap in paise (defaults to ₹2,000 = 200,000 paise)
 * @param incomingCodPaise Incoming COD order amount in paise for lookahead pre-dispatch evaluation
 */
export function calculateCodPocketBalance(
  collectedPaise: number,
  reconciledPaise: number,
  limitPaise = COD_FLOATING_CASH_LIMIT_PAISE,
  incomingCodPaise = 0,
): CodPocketBalanceCalculation {
  const collected = Math.max(0, Number.isFinite(collectedPaise) ? Math.round(collectedPaise) : 0);
  const reconciled = Math.max(0, Number.isFinite(reconciledPaise) ? Math.round(reconciledPaise) : 0);
  const incoming = Math.max(0, Number.isFinite(incomingCodPaise) ? Math.round(incomingCodPaise) : 0);
  const balance = Math.max(0, safeSubtract(collected, reconciled));
  const limit = Math.max(10000, Math.round(limitPaise)); // ₹100 floor
  const isBlocked = balance >= limit || (balance + incoming) > limit;
  const remaining = Math.max(0, safeSubtract(limit, balance));
  const utilizationPct = Math.min(100, Math.round((balance / limit) * 100));

  return {
    collectedPaise: collected,
    reconciledPaise: reconciled,
    pocketBalancePaise: balance,
    limitPaise: limit,
    remainingHeadroomPaise: remaining,
    utilizationPct,
    isCodBlocked: isBlocked,
    canAcceptCod: !isBlocked,
  };
}

/**
 * Re-export calculatePocketBalance for backward compatibility across all modules.
 */
export { calculatePocketBalance } from "./discipline.ts";

/**
 * Generates an NPCI-compliant UPI Intent URI for 1-tap instant floating cash deposit.
 */
export function generateUpiDepositIntent(
  amountRupees: number,
  vpa: string = COD_DEFAULT_TREASURY_VPA,
  note = "FloatDeposit",
): string {
  const amt = Math.max(1, Math.round(amountRupees));
  const encodedVpa = encodeURIComponent(vpa.trim().toLowerCase());
  const encodedNote = encodeURIComponent(`${note.trim()}_${Date.now().toString(36)}`);
  return `upi://pay?pa=${encodedVpa}&pn=OrderKing%20Treasury&am=${amt}&cu=INR&tn=${encodedNote}`;
}

/**
 * Generates a dynamic QR code image URL for instant mid-shift UPI float clearing.
 */
export function generateUpiQrUrl(
  amountRupees: number,
  vpa: string = COD_DEFAULT_TREASURY_VPA,
  note = "FloatDeposit",
  size = 200,
): string {
  const intent = generateUpiDepositIntent(amountRupees, vpa, note);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(intent)}`;
}

// ---------------------------------------------------------------------------
// 12. AUTOMATED WEDNESDAY AFTERNOON SETTLEMENT (14:00 IST / 2:00 PM IST)
// ---------------------------------------------------------------------------

/**
 * Calculates the next automated Wednesday afternoon 14:00 IST settlement window.
 * Cycle window: Monday 00:00:00 to Sunday 23:59:59 settled every Wednesday at 14:00 IST.
 */
export function computeNextWednesdaySettlementIst(nowInput: Date | string | number = new Date()): {
  date: Date;
  formattedDate: string;
  hoursRemaining: number;
  timeIst: string;
  scheduleDescription: string;
} {
  const now = typeof nowInput === "string" || typeof nowInput === "number" ? new Date(nowInput) : nowInput;
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffsetMs);

  const istDay = istNow.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 3 = Wed
  const istHours = istNow.getUTCHours();

  let daysUntilWed = (3 - istDay + 7) % 7;
  if (daysUntilWed === 0 && istHours >= 14) {
    daysUntilWed = 7;
  }

  const targetIst = new Date(istNow.getTime());
  targetIst.setUTCDate(istNow.getUTCDate() + daysUntilWed);
  targetIst.setUTCHours(14, 0, 0, 0);

  const targetUtc = new Date(targetIst.getTime() - istOffsetMs);
  const diffMs = Math.max(0, targetUtc.getTime() - now.getTime());
  const hoursRemaining = Math.max(1, Math.round(diffMs / 3_600_000));

  const formattedDate = targetUtc.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return {
    date: targetUtc,
    formattedDate,
    hoursRemaining,
    timeIst: "14:00 IST (2:00 PM IST)",
    scheduleDescription: "Wednesday afternoon at 14:00 IST via automated NEFT/IMPS",
  };
}

/**
 * Calculates the next automated Daily T+1 (Next-Day 10:00 AM – 12:00 PM IST) settlement window.
 * Shift window: 00:00:00 to 23:59:59 IST midnight cutoff with 00:05 AM autonomous reconciliation,
 * and automated banking disbursement executed next day between 10:00 AM and 12:00 PM IST via UPI/IMPS.
 */
export function computeNextDailySettlementIst(nowInput: Date | string | number = new Date()): {
  date: Date;
  formattedDate: string;
  hoursRemaining: number;
  timeIst: string;
  scheduleDescription: string;
  cycleCutoffDescription: string;
} {
  const now = typeof nowInput === "string" || typeof nowInput === "number" ? new Date(nowInput) : nowInput;
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffsetMs);

  const istHours = istNow.getUTCHours();

  // Target next payout window: 10:00 AM IST.
  // If current IST hour is < 10, today's 10:00 AM is the target payout window (for yesterday's shifts).
  // If current IST hour >= 10, tomorrow's 10:00 AM is the target payout window (for today's shifts ending at 23:59:59).
  const targetIst = new Date(istNow.getTime());
  if (istHours >= 10) {
    targetIst.setUTCDate(targetIst.getUTCDate() + 1);
  }
  targetIst.setUTCHours(10, 0, 0, 0);

  const targetUtc = new Date(targetIst.getTime() - istOffsetMs);
  const diffMs = Math.max(0, targetUtc.getTime() - now.getTime());
  const hoursRemaining = Math.max(1, Math.round(diffMs / 3_600_000));

  const formattedDate = targetUtc.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return {
    date: targetUtc,
    formattedDate,
    hoursRemaining,
    timeIst: "10:00 AM – 12:00 PM IST",
    scheduleDescription: "Next-Day Daily Settlement between 10:00 AM & 12:00 PM IST via automated UPI / IMPS",
    cycleCutoffDescription: "Daily 00:00 to 23:59:59 IST midnight cutoff with 00:05 AM autonomous reconciliation",
  };
}

/**
 * Universal settlement window calculator supporting both Daily (T+1) and Weekly Wednesday schedules.
 */
export function computeNextSettlementWindowIst(
  frequency: "daily" | "twice_weekly" | "weekly" = "daily",
  nowInput: Date | string | number = new Date(),
) {
  if (frequency === "weekly") {
    return computeNextWednesdaySettlementIst(nowInput);
  }
  return computeNextDailySettlementIst(nowInput);
}
