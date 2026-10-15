/**
 * DYNAMIC KITCHEN PREPARATION TIME (KPT) & RIDER DISPATCH SYNCHRONIZATION ENGINE
 *
 * Implements real-time, non-linear cooking duration prediction based on:
 * 1. Kitchen Active Ticket Load (burners, assembly counter backlog, rush-hour queuing)
 * 2. Dish Complexity Metrics (quick assembly vs deep-fry vs tandoor vs dum biryani)
 * 3. Historical Preparation Speed & Merchant SLA compliance
 *
 * Synchronizes with the Rider Dispatch Algorithm to trigger partner assignment
 * so that the courier arrives at the kitchen within minutes of food packaging,
 * eliminating unpaid courier idle wait time and preventing customer food cooldown.
 *
 * Monetary amounts use SafeInteger paise math exclusively.
 */

export type DishComplexityTier = "LOW" | "MEDIUM" | "HIGH" | "COMPLEX";

export interface ItemComplexityInput {
  itemId: string;
  name: string;
  quantity: number;
  category?: string;
  basePrepMinutes?: number;
  complexityTier?: DishComplexityTier;
  isVegetarian?: boolean;
}

export interface KitchenLoadSnapshot {
  restaurantId: string;
  activeTicketCount: number; // Active orders currently in CONFIRMED / PREPARING
  activeItemsInQueue: number; // Total number of individual items being prepared
  nominalStationCapacity?: number; // Default 6 concurrent tickets per chef brigade
  isRushHour?: boolean;
  isKitchenThrottled?: boolean;
}

export interface HistoricalSpeedProfile {
  restaurantId: string;
  speedMultiplier: number; // Ratio: actual_prep / promised_prep (e.g. 0.85 = fast, 1.0 = normal, 1.25 = slower)
  avgPrepMinutesHistorical: number; // Rolling average historical prep time
  rollingSampleCount: number; // Number of historical orders sampled
  rushHourDelayMinutes?: number; // Extra delay observed during rush windows
}

export interface DynamicKptCalculationInput {
  orderId: string;
  orderNumber: string;
  restaurantId: string;
  orderPlacedAt: string | Date;
  items: ItemComplexityInput[];
  kitchenLoad: KitchenLoadSnapshot;
  speedProfile?: HistoricalSpeedProfile;
  restaurantBaselinePrepMinutes?: number; // Configured baseline SLA (e.g. 20m)
  restaurantPeakPrepMinutes?: number; // Configured peak SLA (e.g. 35m)
  pickupLocation: { lat: number; lng: number };
  dropLocation?: { lat: number; lng: number };
  estimatedCourierTransitMinutes?: number; // Estimated rider travel time to restaurant (default: 8-12m)
}

export interface DynamicKptResult {
  orderId: string;
  orderNumber: string;
  restaurantId: string;
  calculatedKptMinutes: number;
  baseItemPrepMinutes: number;
  complexityScore: number;
  queueLoadMultiplier: number;
  historicalSpeedFactor: number;
  orderAcceptedAt: string;
  expectedReadyAt: string;
  optimalDispatchTriggerAt: string;
  targetCourierArrivalAt: string;
  estimatedCourierTransitMinutes: number;
  shouldDispatchNow: boolean;
  estimatedCourierIdleWaitMinutes: number;
  calculationBreakdown: {
    dominantItemName: string;
    totalItemCount: number;
    activeTicketsBacklog: number;
    stationCapacity: number;
    surgeApplied: boolean;
  };
}

export interface KptDispatchNotificationEvent {
  eventType: "KPT_DISPATCH_TRIGGER";
  orderId: string;
  orderNumber: string;
  restaurantId: string;
  pickupLocation: { lat: number; lng: number };
  dropLocation?: { lat: number; lng: number };
  calculatedKptMinutes: number;
  expectedReadyAt: string;
  optimalDispatchTriggerAt: string;
  shouldDispatchNow: boolean;
  transitBufferMinutes: number;
  notifiedAt: string;
}

/**
 * Infer complexity tier from dish category and name if not explicitly specified.
 */
export function inferDishComplexity(name: string, category?: string): { tier: DishComplexityTier; defaultPrepMinutes: number } {
  const normalized = `${category ?? ""} ${name}`.toLowerCase();

  // COMPLEX: Handi dum biryani, whole tandoor platters, baked lasagnas, gourmet steaks/roasts
  if (
    normalized.includes("biryani") ||
    normalized.includes("dum") ||
    normalized.includes("handi") ||
    normalized.includes("platter") ||
    normalized.includes("roast") ||
    normalized.includes("slow cook")
  ) {
    return { tier: "COMPLEX", defaultPrepMinutes: 30 };
  }

  // HIGH: Tandoori items, deep-fried chicken/fish, sizzlers, hand-stretched pizzas, curries requiring reduction
  if (
    normalized.includes("tandoor") ||
    normalized.includes("tikka") ||
    normalized.includes("kebab") ||
    normalized.includes("pizza") ||
    normalized.includes("fried") ||
    normalized.includes("sizzler") ||
    normalized.includes("gravy")
  ) {
    return { tier: "HIGH", defaultPrepMinutes: 22 };
  }

  // LOW: Beverages, shakes, salads, fresh juices, pre-made sweets, cold desserts, rotis/breads only
  if (
    normalized.includes("shake") ||
    normalized.includes("juice") ||
    normalized.includes("salad") ||
    normalized.includes("drink") ||
    normalized.includes("lassi") ||
    normalized.includes("ice cream") ||
    normalized.includes("sweet") ||
    normalized.includes("gulab jamun") ||
    normalized.includes("water") ||
    normalized.includes("soda")
  ) {
    return { tier: "LOW", defaultPrepMinutes: 8 };
  }

  // MEDIUM: Standard curries, fried rice, noodles, rolls, burgers, sandwiches, dal
  return { tier: "MEDIUM", defaultPrepMinutes: 15 };
}

/**
 * Calculate multi-item aggregate cooking time with parallel kitchen throughput modeling.
 */
export function calculateItemsPreparationTime(items: ItemComplexityInput[]): {
  basePrepMinutes: number;
  dominantItemName: string;
  complexityScore: number;
  totalQuantity: number;
} {
  if (items.length === 0) {
    return { basePrepMinutes: 15, dominantItemName: "Standard Order", complexityScore: 1.0, totalQuantity: 1 };
  }

  let dominantPrep = 0;
  let dominantName = items[0]?.name ?? "Dish";
  let totalWeightedPrep = 0;
  let totalQuantity = 0;

  for (const item of items) {
    const qty = Math.max(1, Math.floor(item.quantity || 1));
    totalQuantity += qty;

    const inferred = inferDishComplexity(item.name, item.category);
    const itemPrep = item.basePrepMinutes && item.basePrepMinutes > 0 ? item.basePrepMinutes : inferred.defaultPrepMinutes;

    const multiplierByTier: Record<DishComplexityTier, number> = {
      LOW: 0.8,
      MEDIUM: 1.0,
      HIGH: 1.35,
      COMPLEX: 1.75,
    };
    const tier = item.complexityTier ?? inferred.tier;
    const tierMultiplier = multiplierByTier[tier];

    if (itemPrep > dominantPrep) {
      dominantPrep = itemPrep;
      dominantName = item.name;
    }

    totalWeightedPrep += itemPrep * tierMultiplier * qty;
  }

  // Parallel cooking assumption:
  // In a standard kitchen brigade, the slowest item (dominant prep) dictates the minimum timeline.
  // Additional items can be prepared concurrently on parallel burners, adding fractional marginal time.
  // Marginal time scaling: +20% for each additional distinct item above dominant item, dampened logarithmically.
  const additionalItemsCount = Math.max(0, totalQuantity - 1);
  const parallelismDampener = 1 + 0.22 * Math.log2(1 + additionalItemsCount);
  const basePrep = Math.round(dominantPrep * parallelismDampener);

  const avgItemPrep = totalWeightedPrep / Math.max(1, totalQuantity);
  const normalizedComplexityScore = Math.min(2.5, Math.max(0.7, avgItemPrep / 15));

  return {
    basePrepMinutes: Math.max(5, basePrep),
    dominantItemName: dominantName,
    complexityScore: parseFloat(normalizedComplexityScore.toFixed(2)),
    totalQuantity,
  };
}

/**
 * Calculate the Queue Load Multiplier based on concurrent active tickets and kitchen capacity.
 */
export function calculateQueueMultiplier(load: KitchenLoadSnapshot): { multiplier: number; surgeApplied: boolean } {
  const nominalCapacity = Math.max(1, load.nominalStationCapacity ?? 6);
  const activeTickets = Math.max(0, load.activeTicketCount);

  // If kitchen has low load (<= 2 tickets), zero queue penalty
  if (activeTickets <= 2) {
    return { multiplier: 1.0, surgeApplied: false };
  }

  // Moderate load within capacity: linear mild gradient
  if (activeTickets <= nominalCapacity) {
    const extraTickets = activeTickets - 2;
    const buffer = 1.0 + (extraTickets / nominalCapacity) * 0.35;
    return { multiplier: parseFloat(buffer.toFixed(2)), surgeApplied: false };
  }

  // Surge / Backlog: Active tickets exceed nominal station capacity
  const overloadTickets = activeTickets - nominalCapacity;
  // Non-linear queue congestion curve
  const overloadImpact = 1.35 + overloadTickets * 0.12;
  const surgeMultiplier = Math.min(2.5, overloadImpact);

  return {
    multiplier: parseFloat(surgeMultiplier.toFixed(2)),
    surgeApplied: true,
  };
}

/**
 * Calculate the Historical Speed Factor.
 */
export function calculateHistoricalSpeedFactor(profile?: HistoricalSpeedProfile): number {
  if (!profile || profile.rollingSampleCount < 3) {
    return 1.0; // Baseline when insufficient historical data
  }

  // Bound speed factor between 0.75 (exceptionally fast high-turnover kitchen) and 1.40 (historically sluggish kitchen)
  const clamped = Math.min(1.4, Math.max(0.75, profile.speedMultiplier));
  return parseFloat(clamped.toFixed(2));
}

/**
 * MASTER DYNAMIC KPT CALCULATION & COURIER DISPATCH SYNCHRONIZATION
 */
export function calculateDynamicKpt(input: DynamicKptCalculationInput): DynamicKptResult {
  const orderAcceptedDate = input.orderPlacedAt instanceof Date ? input.orderPlacedAt : new Date(input.orderPlacedAt);
  const orderAcceptedTimestamp = isNaN(orderAcceptedDate.getTime()) ? Date.now() : orderAcceptedDate.getTime();

  // 1. Dish Complexity & Base Prep
  const itemAnalysis = calculateItemsPreparationTime(input.items);

  // 2. Kitchen Active Ticket Load
  const { multiplier: queueMultiplier, surgeApplied } = calculateQueueMultiplier(input.kitchenLoad);

  // 3. Historical Preparation Speed
  const historicalSpeedFactor = calculateHistoricalSpeedFactor(input.speedProfile);

  // 4. Combined KPT Math
  // Calculated minutes = Base Prep * Queue Multiplier * Historical Speed Factor
  let rawKpt = itemAnalysis.basePrepMinutes * queueMultiplier * historicalSpeedFactor;

  // Add rush hour buffer if flagged in load
  if (input.kitchenLoad.isRushHour) {
    rawKpt += 4;
  }

  // Respect merchant baseline/peak SLAs as sensible boundaries if provided
  const minBound = 5;
  const maxBound = Math.max(45, (input.restaurantPeakPrepMinutes ?? 35) + 15);
  const calculatedKptMinutes = Math.min(maxBound, Math.max(minBound, Math.round(rawKpt)));

  // 5. Timestamps
  const expectedReadyTimestamp = orderAcceptedTimestamp + calculatedKptMinutes * 60_000;
  const expectedReadyAt = new Date(expectedReadyTimestamp).toISOString();

  // 6. Courier Arrival Synchronization (Minimizing Courier Idle Wait Time)
  // Standard courier travel time from assignment to kitchen is estimated (default 10 mins).
  const transitMinutes = Math.min(
    25,
    Math.max(4, Math.round(input.estimatedCourierTransitMinutes ?? 10))
  );

  // We want the courier to arrive EXACTLY when food is packed.
  // Therefore, the ideal dispatch trigger timestamp is:
  // optimalDispatchTriggerAt = expectedReadyTimestamp - (transitMinutes * 60_000)
  const optimalDispatchTriggerTimestamp = expectedReadyTimestamp - transitMinutes * 60_000;
  const optimalDispatchTriggerAt = new Date(optimalDispatchTriggerTimestamp).toISOString();

  const nowTimestamp = Date.now();
  const shouldDispatchNow = nowTimestamp >= optimalDispatchTriggerTimestamp;

  // Expected courier arrival if dispatched at the optimal trigger time:
  const targetCourierArrivalTimestamp = shouldDispatchNow
    ? nowTimestamp + transitMinutes * 60_000
    : expectedReadyTimestamp;
  const targetCourierArrivalAt = new Date(targetCourierArrivalTimestamp).toISOString();

  // Calculate estimated courier idle wait time:
  // If dispatched at optimal time, wait time is virtually 0 (target arrival matches ready time).
  // If dispatched prematurely (e.g. at order accepted time), wait time = calculatedKptMinutes - transitMinutes.
  const prematureWait = Math.max(0, calculatedKptMinutes - transitMinutes);
  const estimatedCourierIdleWaitMinutes = shouldDispatchNow
    ? Math.max(0, Math.round((expectedReadyTimestamp - targetCourierArrivalTimestamp) / 60_000))
    : 0;

  return {
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    restaurantId: input.restaurantId,
    calculatedKptMinutes,
    baseItemPrepMinutes: itemAnalysis.basePrepMinutes,
    complexityScore: itemAnalysis.complexityScore,
    queueLoadMultiplier: queueMultiplier,
    historicalSpeedFactor,
    orderAcceptedAt: new Date(orderAcceptedTimestamp).toISOString(),
    expectedReadyAt,
    optimalDispatchTriggerAt,
    targetCourierArrivalAt,
    estimatedCourierTransitMinutes: transitMinutes,
    shouldDispatchNow,
    estimatedCourierIdleWaitMinutes,
    calculationBreakdown: {
      dominantItemName: itemAnalysis.dominantItemName,
      totalItemCount: itemAnalysis.totalQuantity,
      activeTicketsBacklog: input.kitchenLoad.activeTicketCount,
      stationCapacity: input.kitchenLoad.nominalStationCapacity ?? 6,
      surgeApplied,
    },
  };
}

/**
 * Generates the live event payload to notify the rider dispatch algorithm
 * when the kitchen reaches its optimal dispatch trigger window.
 */
export function buildKptDispatchNotification(result: DynamicKptResult, pickupLocation: { lat: number; lng: number }, dropLocation?: { lat: number; lng: number }): KptDispatchNotificationEvent {
  return {
    eventType: "KPT_DISPATCH_TRIGGER",
    orderId: result.orderId,
    orderNumber: result.orderNumber,
    restaurantId: result.restaurantId,
    pickupLocation,
    dropLocation,
    calculatedKptMinutes: result.calculatedKptMinutes,
    expectedReadyAt: result.expectedReadyAt,
    optimalDispatchTriggerAt: result.optimalDispatchTriggerAt,
    shouldDispatchNow: result.shouldDispatchNow,
    transitBufferMinutes: result.estimatedCourierTransitMinutes,
    notifiedAt: new Date().toISOString(),
  };
}
