/**
 * Safe money helpers & Zomato Indian Payout Matrix — all values in integer paise.
 * Never use floating point for currency arithmetic.
 */

export const PAISE_PER_RUPEE = 100;

export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function fromPaise(paise: number): number {
  return paise / 100;
}

export function paise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function formatPaise(paise: number, locale = "en-IN"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(fromPaise(paise));
}

export function safeAdd(...values: number[]): number {
  return values.reduce((sum, v) => sum + Math.round(v), 0);
}

export function safeSubtract(a: number, b: number): number {
  return Math.round(a) - Math.round(b);
}

export function percentOf(paise: number, bps: number): number {
  return Math.round((paise * bps) / 10000);
}

// ---------------------------------------------------------------------------
// Zomato Indian Payout Matrix (City Tiers, Distance, Wait-Time, Surge, Tips)
// ---------------------------------------------------------------------------

export const STATUTORY_BASE_FARE_PAISE = 3500;
export const STATUTORY_BASE_DISTANCE_KM = 2;
export const STATUTORY_DISTANCE_RATE_PER_KM_PAISE = 1200;
export const MIN_DISTANCE_RATE_PER_KM_PAISE = 1000; // ₹10/km
export const MAX_DISTANCE_RATE_PER_KM_PAISE = 1400; // ₹14/km

export const RESTAURANT_WAIT_GRACE_PERIOD_MINUTES = 6;
export const RESTAURANT_WAIT_PAY_RATE_PER_MIN_PAISE = 100; // ₹1.00/min

export const MIN_RAIN_SURGE_BONUS_PAISE = 1000; // ₹10
export const MAX_RAIN_SURGE_BONUS_PAISE = 4500; // ₹45
export const DEFAULT_RAIN_SURGE_BONUS_PAISE = 2500; // ₹25

export type CityTier = "TIER_1" | "TIER_2" | "TIER_3";

export interface CityTierPayConfig {
  tier: CityTier;
  name: string;
  pickupFeePaise: number;
  dropFeePaise: number;
  basePayPaise: number;
  baseDistanceKm: number;
  defaultRatePerKmPaise: number;
  minimumFareFloorPaise: number;
}

export const CITY_TIER_PAY_CONFIGS: Record<CityTier, CityTierPayConfig> = {
  TIER_1: {
    tier: "TIER_1",
    name: "Tier 1 Metros (BLR, BOM, DEL-NCR, HYD, MAA, CCU, PNQ)",
    pickupFeePaise: 2000, // ₹20
    dropFeePaise: 1500, // ₹15
    basePayPaise: 3500, // ₹35
    baseDistanceKm: 2,
    defaultRatePerKmPaise: 1200, // ₹12/km
    minimumFareFloorPaise: 3500,
  },
  TIER_2: {
    tier: "TIER_2",
    name: "Tier 2 Growth Cities (JAI, AMD, LKO, IXC, COK, IDR, CJB, NAG)",
    pickupFeePaise: 1800, // ₹18
    dropFeePaise: 1200, // ₹12
    basePayPaise: 3000, // ₹30
    baseDistanceKm: 2,
    defaultRatePerKmPaise: 1100, // ₹11/km
    minimumFareFloorPaise: 3000,
  },
  TIER_3: {
    tier: "TIER_3",
    name: "Tier 3 Emerging Towns & Rest of India",
    pickupFeePaise: 1500, // ₹15
    dropFeePaise: 1000, // ₹10
    basePayPaise: 2500, // ₹25
    baseDistanceKm: 2,
    defaultRatePerKmPaise: 1000, // ₹10/km
    minimumFareFloorPaise: 2500,
  },
};

export function getBasePay(cityTier: CityTier = "TIER_1"): {
  tier: CityTier;
  pickupFeePaise: number;
  dropFeePaise: number;
  basePayPaise: number;
  baseDistanceKm: number;
  floorPaise: number;
  ratePerKmPaise: number;
} {
  const cfg = CITY_TIER_PAY_CONFIGS[cityTier] ?? CITY_TIER_PAY_CONFIGS.TIER_1;
  return {
    tier: cfg.tier,
    pickupFeePaise: cfg.pickupFeePaise,
    dropFeePaise: cfg.dropFeePaise,
    basePayPaise: cfg.basePayPaise,
    baseDistanceKm: cfg.baseDistanceKm,
    floorPaise: cfg.minimumFareFloorPaise,
    ratePerKmPaise: cfg.defaultRatePerKmPaise,
  };
}

export function calculateDistancePay(
  distanceKm: number,
  customRatePerKmPaise = STATUTORY_DISTANCE_RATE_PER_KM_PAISE,
  baseDistanceKm = STATUTORY_BASE_DISTANCE_KM,
): {
  totalDistanceKm: number;
  baseDistanceKm: number;
  billableExtraKm: number;
  ratePerKmPaise: number;
  distancePayPaise: number;
} {
  const dist = Math.max(0, Number.isFinite(distanceKm) ? distanceKm : 0);
  const baseDist = Math.max(0, Number.isFinite(baseDistanceKm) ? baseDistanceKm : STATUTORY_BASE_DISTANCE_KM);
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

export function calculateRestaurantWaitPayPaise(
  waitMinutes: number,
  gracePeriodMinutes = RESTAURANT_WAIT_GRACE_PERIOD_MINUTES,
  ratePerMinPaise = RESTAURANT_WAIT_PAY_RATE_PER_MIN_PAISE,
): number {
  const mins = Math.max(0, Number.isFinite(waitMinutes) ? Math.floor(waitMinutes) : 0);
  const grace = Math.max(0, Math.floor(gracePeriodMinutes));
  const billableMins = Math.max(0, mins - grace);
  return Math.round(billableMins * Math.max(0, Math.round(ratePerMinPaise)));
}

export function calculateRestaurantWaitPay(
  waitMinutes: number,
  gracePeriodMinutes = RESTAURANT_WAIT_GRACE_PERIOD_MINUTES,
  ratePerMinPaise = RESTAURANT_WAIT_PAY_RATE_PER_MIN_PAISE,
): {
  totalWaitMinutes: number;
  gracePeriodMinutes: number;
  billableWaitMinutes: number;
  ratePerMinPaise: number;
  waitPayPaise: number;
} {
  const mins = Math.max(0, Number.isFinite(waitMinutes) ? Math.floor(waitMinutes) : 0);
  const grace = Math.max(0, Math.floor(gracePeriodMinutes));
  const billableWaitMinutes = Math.max(0, mins - grace);
  const waitPayPaise = billableWaitMinutes * Math.max(0, Math.round(ratePerMinPaise));

  return {
    totalWaitMinutes: mins,
    gracePeriodMinutes: grace,
    billableWaitMinutes,
    ratePerMinPaise: Math.round(ratePerMinPaise),
    waitPayPaise,
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

export function calculateSurgePay(input: {
  baseAndDistancePaise: number;
  isRainSurge?: boolean;
  rainSurgeBonusPaise?: number;
  peakMultiplier?: number;
}): {
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

export interface ZomatoPayoutInput {
  distanceKm: number;
  cityTier?: CityTier;
  customRatePerKmPaise?: number;
  waitMinutes?: number;
  arrivedRestaurantAt?: string | number | Date | null;
  pickedUpAt?: string | number | Date | null;
  isRainSurge?: boolean;
  rainSurgeBonusPaise?: number;
  peakMultiplier?: number;
  customerTipPaise?: number;
  packageCount?: number;
  customFloorPaise?: number;
}

export function calculateZomatoAlgorithmicPayout(input: ZomatoPayoutInput) {
  const tier = input.cityTier ?? "TIER_1";
  const tierConfig = CITY_TIER_PAY_CONFIGS[tier] ?? CITY_TIER_PAY_CONFIGS.TIER_1;

  const pickupFeePaise = tierConfig.pickupFeePaise;
  const dropFeePaise = tierConfig.dropFeePaise;
  const basePayPaise = pickupFeePaise + dropFeePaise;

  const ratePerKm = input.customRatePerKmPaise ?? tierConfig.defaultRatePerKmPaise;
  const distCalc = calculateDistancePay(input.distanceKm, ratePerKm, tierConfig.baseDistanceKm);
  const distancePayPaise = distCalc.distancePayPaise;
  const baseAndDistancePaise = basePayPaise + distancePayPaise;

  let waitMins = 0;
  if (input.arrivedRestaurantAt) {
    waitMins = calculateWaitTimeMinutes(input.arrivedRestaurantAt, input.pickedUpAt);
  } else if (input.waitMinutes !== undefined) {
    waitMins = Math.max(0, Math.floor(input.waitMinutes));
  }
  const waitCalc = calculateRestaurantWaitPay(waitMins, RESTAURANT_WAIT_GRACE_PERIOD_MINUTES, RESTAURANT_WAIT_PAY_RATE_PER_MIN_PAISE);

  const surgeCalc = calculateSurgePay({
    baseAndDistancePaise,
    isRainSurge: input.isRainSurge,
    rainSurgeBonusPaise: input.rainSurgeBonusPaise,
    peakMultiplier: input.peakMultiplier,
  });

  const multiPackageBonusPaise = (input.packageCount && input.packageCount > 1) ? 500 : 0;

  const rawDeliveryFarePaise =
    baseAndDistancePaise +
    waitCalc.waitPayPaise +
    surgeCalc.totalSurgePaise +
    multiPackageBonusPaise;

  const floorPaise = input.customFloorPaise ?? tierConfig.minimumFareFloorPaise;
  const deliveryFareAfterFloorPaise = Math.max(floorPaise, rawDeliveryFarePaise);
  const isFloorEnforced = rawDeliveryFarePaise < floorPaise;

  const tipCalc = calculateCustomerTipPassThrough(input.customerTipPaise ?? 0);
  const totalPayoutPaise = deliveryFareAfterFloorPaise + tipCalc.netTipPassThroughPaise;

  return {
    cityTier: tier,
    pickupFeePaise,
    dropFeePaise,
    basePayPaise,
    distanceKm: distCalc.totalDistanceKm,
    billableExtraKm: distCalc.billableExtraKm,
    ratePerKmPaise: distCalc.ratePerKmPaise,
    distancePayPaise,
    baseAndDistancePaise,
    waitMinutes: waitCalc.totalWaitMinutes,
    billableWaitMinutes: waitCalc.billableWaitMinutes,
    waitTimePayPaise: waitCalc.waitPayPaise,
    isRainSurge: surgeCalc.isRainSurge,
    rainSurgeBonusPaise: surgeCalc.rainSurgeBonusPaise,
    peakMultiplier: surgeCalc.peakMultiplier,
    peakMultiplierBoostPaise: surgeCalc.peakMultiplierBoostPaise,
    totalSurgePaise: surgeCalc.totalSurgePaise,
    multiPackageBonusPaise,
    customerTipPaise: tipCalc.netTipPassThroughPaise,
    floorPaise,
    isFloorEnforced,
    subtotalBeforeTipPaise: deliveryFareAfterFloorPaise,
    totalPayoutPaise,
  };
}

export function calculateRiderPayout(
  distanceKm: number,
  customRatePerKmPaise = STATUTORY_DISTANCE_RATE_PER_KM_PAISE,
  baseDistanceKm = STATUTORY_BASE_DISTANCE_KM,
): number {
  const dist = Math.max(0, Number.isFinite(distanceKm) ? distanceKm : 0);
  const extraKm = Math.max(0, dist - baseDistanceKm);
  const distanceFarePaise = Math.round(extraKm * customRatePerKmPaise);
  const totalPaise = STATUTORY_BASE_FARE_PAISE + distanceFarePaise;
  return Math.max(STATUTORY_BASE_FARE_PAISE, totalPaise);
}

export function enforcePayoutFloor(amountPaise: number, floorPaise = STATUTORY_BASE_FARE_PAISE): number {
  const amount = Number.isFinite(amountPaise) ? Math.round(amountPaise) : floorPaise;
  return Math.max(floorPaise, amount);
}
