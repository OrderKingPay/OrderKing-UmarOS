/**
 * Dynamic Surge Pricing Engine — Zomato-parity dynamic pricing based on
 * supply-demand imbalance, time-of-day, weather conditions, and zone capacity.
 *
 * All monetary values are in integer paise. Surge multipliers are basis points (bps).
 * 10000 bps = 1.0x (no surge). 15000 bps = 1.5x surge.
 *
 * @module surge-pricing
 */

export type SurgeFactors = {
  /** Active unfulfilled orders in the zone */
  activeOrders: number;
  /** Available online riders in the zone */
  availableRiders: number;
  /** Total zone rider capacity (all registered riders for zone) */
  totalRiders: number;
  /** Current hour (0-23) */
  hour: number;
  /** Is it raining / bad weather? */
  badWeather?: boolean;
  /** Zone base delivery fee in paise */
  baseDeliveryFeePaise: number;
  /** Zone base minimum order in paise */
  baseMinOrderPaise: number;
  /** Average zone prep time in minutes (from restaurant data) */
  avgPrepMinutes?: number;
};

export type SurgeResult = {
  /** Surge multiplier in basis points (10000 = 1.0x, 15000 = 1.5x) */
  surgeBps: number;
  /** Human readable label */
  surgeLabel: string;
  /** Adjusted delivery fee in paise */
  adjustedDeliveryFeePaise: number;
  /** Factors that contributed to surge */
  factors: string[];
  /** Supply-demand ratio (riders / orders). Below 1.0 = undersupply */
  supplyDemandRatio: number;
  /** Whether surge is active */
  active: boolean;
};

// Peak hour windows (India standard)
const PEAK_LUNCH = [11, 12, 13, 14] as const;
const PEAK_DINNER = [19, 20, 21, 22] as const;
const LATE_NIGHT = [23, 0, 1, 2] as const;

// Configurable caps
const MAX_SURGE_BPS = 25000; // 2.5x max
const MIN_SURGE_BPS = 10000; // 1.0x floor (no negative surge)
const DEMAND_CRITICAL_THRESHOLD = 0.5; // riders/orders ratio below this = critical
const DEMAND_TIGHT_THRESHOLD = 1.0;
const DEMAND_COMFORTABLE_THRESHOLD = 2.0;

export function calculateSurge(factors: SurgeFactors): SurgeResult {
  let surgeBps = 10000; // Start at 1.0x
  const reasons: string[] = [];

  // 1. Supply-Demand Imbalance (strongest factor)
  const effectiveOrders = Math.max(factors.activeOrders, 1);
  const supplyDemandRatio = factors.availableRiders / effectiveOrders;

  if (supplyDemandRatio < DEMAND_CRITICAL_THRESHOLD) {
    surgeBps += 5000; // +0.5x
    reasons.push("CRITICAL_UNDERSUPPLY");
  } else if (supplyDemandRatio < DEMAND_TIGHT_THRESHOLD) {
    surgeBps += 3000; // +0.3x
    reasons.push("TIGHT_SUPPLY");
  } else if (supplyDemandRatio < DEMAND_COMFORTABLE_THRESHOLD) {
    surgeBps += 1000; // +0.1x
    reasons.push("MODERATE_DEMAND");
  }

  // 2. Peak Hour Multiplier
  const hour = factors.hour;
  if ((PEAK_LUNCH as readonly number[]).includes(hour) || (PEAK_DINNER as readonly number[]).includes(hour)) {
    surgeBps += 1500; // +0.15x
    reasons.push("PEAK_HOURS");
  } else if ((LATE_NIGHT as readonly number[]).includes(hour)) {
    surgeBps += 2000; // +0.2x
    reasons.push("LATE_NIGHT");
  }

  // 3. Weather Surcharge
  if (factors.badWeather) {
    surgeBps += 2000; // +0.2x
    reasons.push("BAD_WEATHER");
  }

  // 4. Low Rider Utilization (if too few riders are even online)
  const riderOnlineRate = factors.totalRiders > 0 ? factors.availableRiders / factors.totalRiders : 0;
  if (riderOnlineRate < 0.3 && factors.totalRiders > 5) {
    surgeBps += 1500; // +0.15x
    reasons.push("LOW_RIDER_ONLINE_RATE");
  }

  // 5. Prep time pressure (if kitchens are slow, delivery takes longer)
  if (factors.avgPrepMinutes && factors.avgPrepMinutes > 25) {
    surgeBps += 500; // +0.05x
    reasons.push("HIGH_PREP_TIME");
  }

  // Clamp to bounds
  surgeBps = Math.min(MAX_SURGE_BPS, Math.max(MIN_SURGE_BPS, surgeBps));

  // Calculate adjusted delivery fee
  const adjustedDeliveryFeePaise = Math.round((factors.baseDeliveryFeePaise * surgeBps) / 10000);

  // Human-readable label
  const multiplier = surgeBps / 10000;
  const surgeLabel = surgeBps <= 10000
    ? "No surge"
    : surgeBps <= 12000
      ? `Low surge (${multiplier.toFixed(1)}x)`
      : surgeBps <= 16000
        ? `Moderate surge (${multiplier.toFixed(1)}x)`
        : `High surge (${multiplier.toFixed(1)}x)`;

  return {
    surgeBps,
    surgeLabel,
    adjustedDeliveryFeePaise,
    factors: reasons,
    supplyDemandRatio: Math.round(supplyDemandRatio * 100) / 100,
    active: surgeBps > 10000,
  };
}

/**
 * Calculate surge for a specific zone using platform data.
 * This is the main entry point called from server actions and AI tools.
 */
export function surgeForZone(zoneData: {
  activeOrders: number;
  availableRiders: number;
  totalRiders: number;
  baseDeliveryFeePaise: number;
  baseMinOrderPaise: number;
  badWeather?: boolean;
  avgPrepMinutes?: number;
}): SurgeResult {
  return calculateSurge({
    ...zoneData,
    hour: new Date().getHours(),
  });
}

/**
 * Batch calculate surge across all zones (for dispatch dashboard).
 */
export function surgeForAllZones(
  zones: Array<{
    zoneId: string;
    activeOrders: number;
    availableRiders: number;
    totalRiders: number;
    baseDeliveryFeePaise: number;
    baseMinOrderPaise: number;
    badWeather?: boolean;
  }>
): Array<{ zoneId: string } & SurgeResult> {
  return zones.map((z) => ({
    zoneId: z.zoneId,
    ...surgeForZone(z),
  }));
}
