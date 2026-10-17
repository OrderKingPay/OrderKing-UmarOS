/**
 * UMAR OS - Supreme Fleet Operations & Autonomous Dispatch Engine
 * Authority: Supreme Rider Fleet Operations & Employee-less Automation Specialist
 * Model: Tier-1 Hyper-Local Autonomous Fleet Dispatch Parity
 *
 * Core Pillars:
 * 1. Autonomous Dispatch Pre-Allocation:
 *    - Real-time Kitchen Preparation Time (KPT) prediction synchronization.
 *    - Target 0 idle minutes for riders at restaurants.
 * 2. Multi-Order Batching Logic:
 *    - Co-located pickup radius and adjacent drop clustering.
 *    - 35% pickup discount on the 2nd base while preserving rider drop incentives.
 * 3. COD Floating Cash Safety Lock:
 *    - Strict ₹1,500 cash-in-hand safety limit.
 *    - ₹1,200 (80%) automated UPI deposit warning prompt.
 *    - ₹1,500 (100%) hard lock prohibiting new COD orders until settled via Razorpay/UPI payout rail.
 * 4. Autonomous Exception Handling (100% Employee-less):
 *    - Kitchen Delay: Food prep exceeding promise time by >7 mins triggers automated AI voice IVR call.
 *    - SLA Delivery Breach: Orders delayed >15 mins beyond quoted ETA automatically credit ₹50 to KingPay wallet.
 *    - Rider Tier Gamification: Bronze, Silver, Gold, Diamond tiers based on Acceptance Rate (>90%),
 *      Completion Rate (>95%), and On-Time Delivery (>92%) unlocking priority dispatch and weekly milestone bonuses
 *      (e.g. 50 orders = ₹1,200 bonus).
 * 5. Full Universal Customization:
 *    - All thresholds, fees, bonuses, and operational limits are dynamically tunable at runtime from UmarOS.
 */

import { z } from "zod";

// ============================================================================
// 1. UNIVERSAL CONFIGURATION SCHEMA (UMAROS TUNABLE)
// ============================================================================

export const RiderTierRequirementsSchema = z.object({
  minAcceptanceRatePct: z.number().min(0).max(100),
  minCompletionRatePct: z.number().min(0).max(100),
  minOnTimeDeliveryRatePct: z.number().min(0).max(100),
  priorityDispatchMultiplier: z.number().min(1.0).max(3.0),
  surgeBonusMultiplier: z.number().min(1.0).max(3.0),
});

export const WeeklyMilestoneBonusSchema = z.object({
  targetOrders: z.number().int().positive(),
  bonusPaise: z.number().int().nonnegative(), // e.g. 50 orders = 120000 paise (₹1,200)
  title: z.string(),
});

export const ZomatoFleetConfigSchema = z.object({
  mode: z.enum(["MANUAL_OVERRIDE", "AUTONOMOUS_UMAROS"]).default("AUTONOMOUS_UMAROS"),

  // 1. Dispatch Pre-Allocation & KPT Synchronization
  dispatch: z.object({
    urbanTrafficSpeedKmph: z.number().min(5).max(60).default(20.0), // 20 km/h average city transit speed
    immediateDispatchLeadThresholdMinutes: z.number().min(0).default(2.0), // Dispatch immediately if lead <= 2 mins
    bufferTargetIdleMinutes: z.number().min(0).default(0.0), // Exact 0 idle minutes target
  }).default({} as any),

  // 2. Multi-Order Batching Logic
  batching: z.object({
    maxBatchOrders: z.number().int().min(2).max(4).default(2),
    batchPickupDiscountPct: z.number().min(0).max(100).default(35), // 35% discount on 2nd base pickup
    maxPickupDistanceMeters: z.number().min(0).default(500), // Max 500m between co-located pickups
    maxDropDistanceMeters: z.number().min(0).default(2000), // Max 2.0 km between adjacent drop locations
    maxBatchTimeDiffMinutes: z.number().min(0).default(10), // Max 10 min food readiness delta
    maxCargoWeightKg: z.number().min(1).default(15.0), // Max 15 kg total cargo
    preserveDropIncentives: z.boolean().default(true), // Always preserve full drop incentives
    dropIncentiveBonusPaise: z.number().int().default(1500), // ₹15.00 drop incentive per order
  }).default({} as any),

  // 3. COD Floating Cash Safety Lock
  codSafety: z.object({
    cashInHandLimitPaise: z.number().int().default(150000), // ₹1,500.00 hard lock limit
    softWarningThresholdPct: z.number().min(1).max(99).default(80), // 80% soft warning = ₹1,200.00
    upiVpaPayee: z.string().default("orderking.fleet@axisbank"),
    merchantName: z.string().default("OrderKing Cash Settlement"),
    settlementRail: z.enum(["RAZORPAY_UPI", "INSTANT_UPI", "BANK_IMPS"]).default("RAZORPAY_UPI"),
  }).default({} as any),

  // 4. Autonomous Exception Handling (Employee-less)
  exceptions: z.object({
    kitchenDelayGraceMinutes: z.number().int().default(7), // Delay > 7 mins triggers AI voice IVR call
    kitchenIvrLanguage: z.string().default("hi-IN,en-IN"),
    slaDeliveryBreachGraceMinutes: z.number().int().default(15), // Delay > 15 mins beyond ETA
    slaBreachWalletCreditPaise: z.number().int().default(5000), // ₹50.00 KingPay credit
    stationaryAlertThresholdMinutes: z.number().int().default(8), // Rider idle alert
  }).default({} as any),

  // 5. Rider Payout Parameters (Integer Paise)
  payout: z.object({
    basePayPaise: z.number().int().default(2000), // ₹20.00 base pickup pay
    firstMileThresholdKm: z.number().default(1.0), // First 1.0 km included free in base
    firstMileRatePaisePerKm: z.number().int().default(550), // ₹5.50 / km for first-mile excess
    lastMileRatePaisePerKm: z.number().int().default(700), // ₹7.00 / km last mile
    kitchenWaitGraceMinutes: z.number().int().default(5), // First 5 mins wait free
    kitchenWaitRatePaisePerMinute: z.number().int().default(150), // ₹1.50 per min wait fee
  }).default({} as any),

  // 6. Rider Tier Gamification & Milestones
  tiers: z.object({
    bronze: RiderTierRequirementsSchema.default({
      minAcceptanceRatePct: 0,
      minCompletionRatePct: 0,
      minOnTimeDeliveryRatePct: 0,
      priorityDispatchMultiplier: 1.0,
      surgeBonusMultiplier: 1.0,
    }),
    silver: RiderTierRequirementsSchema.default({
      minAcceptanceRatePct: 85,
      minCompletionRatePct: 90,
      minOnTimeDeliveryRatePct: 88,
      priorityDispatchMultiplier: 1.15,
      surgeBonusMultiplier: 1.1,
    }),
    gold: RiderTierRequirementsSchema.default({
      minAcceptanceRatePct: 90,
      minCompletionRatePct: 95,
      minOnTimeDeliveryRatePct: 92,
      priorityDispatchMultiplier: 1.30,
      surgeBonusMultiplier: 1.25,
    }),
    diamond: RiderTierRequirementsSchema.default({
      minAcceptanceRatePct: 95,
      minCompletionRatePct: 98,
      minOnTimeDeliveryRatePct: 95,
      priorityDispatchMultiplier: 1.50,
      surgeBonusMultiplier: 1.4,
    }),
  }).default({} as any),

  // Weekly Milestone Bonuses
  weeklyMilestones: z.array(WeeklyMilestoneBonusSchema).default([
    { targetOrders: 30, bonusPaise: 50000, title: "Starter Streak (30 Orders)" }, // ₹500
    { targetOrders: 50, bonusPaise: 120000, title: "Super Champion (50 Orders)" }, // ₹1,200
    { targetOrders: 75, bonusPaise: 200000, title: "Elite Centurion (75 Orders)" }, // ₹2,000
    { targetOrders: 100, bonusPaise: 300000, title: "Legendary Dynamo (100 Orders)" }, // ₹3,000
  ]),
});

export type ZomatoFleetConfig = z.infer<typeof ZomatoFleetConfigSchema>;

export const DEFAULT_FLEET_CONFIG: ZomatoFleetConfig = {
  mode: "AUTONOMOUS_UMAROS",
  dispatch: {
    urbanTrafficSpeedKmph: 20.0,
    immediateDispatchLeadThresholdMinutes: 2.0,
    bufferTargetIdleMinutes: 0.0,
  },
  batching: {
    maxBatchOrders: 2,
    batchPickupDiscountPct: 35,
    maxPickupDistanceMeters: 500,
    maxDropDistanceMeters: 2000,
    maxBatchTimeDiffMinutes: 10,
    maxCargoWeightKg: 15.0,
    preserveDropIncentives: true,
    dropIncentiveBonusPaise: 1500,
  },
  codSafety: {
    cashInHandLimitPaise: 150000, // ₹1,500.00
    softWarningThresholdPct: 80, // ₹1,200.00
    upiVpaPayee: "orderking.fleet@axisbank",
    merchantName: "OrderKing Cash Settlement",
    settlementRail: "RAZORPAY_UPI",
  },
  exceptions: {
    kitchenDelayGraceMinutes: 7,
    kitchenIvrLanguage: "hi-IN,en-IN",
    slaDeliveryBreachGraceMinutes: 15,
    slaBreachWalletCreditPaise: 5000, // ₹50.00
    stationaryAlertThresholdMinutes: 8,
  },
  payout: {
    basePayPaise: 2000,
    firstMileThresholdKm: 1.0,
    firstMileRatePaisePerKm: 550,
    lastMileRatePaisePerKm: 700,
    kitchenWaitGraceMinutes: 5,
    kitchenWaitRatePaisePerMinute: 150,
  },
  tiers: {
    bronze: {
      minAcceptanceRatePct: 0,
      minCompletionRatePct: 0,
      minOnTimeDeliveryRatePct: 0,
      priorityDispatchMultiplier: 1.0,
      surgeBonusMultiplier: 1.0,
    },
    silver: {
      minAcceptanceRatePct: 85,
      minCompletionRatePct: 90,
      minOnTimeDeliveryRatePct: 88,
      priorityDispatchMultiplier: 1.15,
      surgeBonusMultiplier: 1.1,
    },
    gold: {
      minAcceptanceRatePct: 90,
      minCompletionRatePct: 95,
      minOnTimeDeliveryRatePct: 92,
      priorityDispatchMultiplier: 1.30,
      surgeBonusMultiplier: 1.25,
    },
    diamond: {
      minAcceptanceRatePct: 95,
      minCompletionRatePct: 98,
      minOnTimeDeliveryRatePct: 95,
      priorityDispatchMultiplier: 1.50,
      surgeBonusMultiplier: 1.4,
    },
  },
  weeklyMilestones: [
    { targetOrders: 30, bonusPaise: 50000, title: "Starter Streak (30 Orders)" },
    { targetOrders: 50, bonusPaise: 120000, title: "Super Champion (50 Orders)" },
    { targetOrders: 75, bonusPaise: 200000, title: "Elite Centurion (75 Orders)" },
    { targetOrders: 100, bonusPaise: 300000, title: "Legendary Dynamo (100 Orders)" },
  ],
};

// ============================================================================
// 2. MATHEMATICAL HELPERS (HAVERSINE & DISTANCE)
// ============================================================================

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

/**
 * Calculates accurate great-circle distance between two GPS coordinates using Haversine formula.
 * @returns distance in meters
 */
export function calculateHaversineDistanceMeters(c1: GeoCoordinate, c2: GeoCoordinate): number {
  const R = 6371000; // Earth radius in meters
  const lat1 = (c1.latitude * Math.PI) / 180;
  const lat2 = (c2.latitude * Math.PI) / 180;
  const deltaLat = ((c2.latitude - c1.latitude) * Math.PI) / 180;
  const deltaLon = ((c2.longitude - c1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// ============================================================================
// 3. TYPES & CONTRACTS
// ============================================================================

export type RiderTier = "BRONZE" | "SILVER" | "GOLD" | "DIAMOND";

export interface PreAllocationInput {
  orderId: string;
  orderConfirmedAt: Date | string;
  predictedKptMinutes: number; // Kitchen Preparation Time (e.g. 18.0 min)
  riderEtaMinutes: number; // Travel time from rider's current GPS to restaurant (e.g. 5.0 min)
  currentTime?: Date | string;
}

export interface PreAllocationPlan {
  orderId: string;
  predictedKptMinutes: number;
  riderEtaMinutes: number;
  foodReadyTimestamp: string;
  targetRiderArrivalTimestamp: string;
  optimalDispatchTimestamp: string;
  minutesUntilDispatch: number;
  expectedRiderIdleMinutes: number; // Evaluated at arrival: target is 0
  status: "DISPATCH_IMMEDIATELY" | "HOLD_FOR_KITCHEN_PROGRESS";
  dispatchLog: string;
}

export interface BatchOrderInput {
  id: string;
  restaurantId: string;
  restaurantName?: string;
  pickupLocation: GeoCoordinate;
  dropoffLocation: GeoCoordinate;
  readyTimeExpected: Date | string;
  cargoWeightKg?: number;
  lastMileDistanceKm: number;
  firstMileDistanceKm?: number;
}

export interface BatchPricingBreakdown {
  orderId: string;
  basePayPaise: number;
  basePayDiscountPaise: number;
  dropIncentivePaise: number;
  lastMilePayPaise: number;
  totalOrderPayoutPaise: number;
  totalOrderPayoutRupees: number;
}

export interface BatchingEvaluationResult {
  isBatchable: boolean;
  rejectionReasons: string[];
  orders: [BatchOrderInput, BatchOrderInput];
  pickupDistanceMeters: number;
  dropDistanceMeters: number;
  timeGapMinutes: number;
  combinedWeightKg: number;
  pricing?: {
    order1: BatchPricingBreakdown;
    order2: BatchPricingBreakdown;
    totalRiderPayoutPaise: number;
    totalRiderPayoutRupees: number;
    platformBaseDiscountPaise: number;
    platformBaseDiscountRupees: number;
    explanation: string;
  };
}

export interface CodEvaluationInput {
  riderId: string;
  currentCashInHandPaise: number;
  incomingOrder?: {
    orderId: string;
    isCod: boolean;
    codAmountPaise: number;
  };
}

export interface CodSafetyStatus {
  riderId: string;
  currentCashInHandPaise: number;
  currentCashInHandRupees: number;
  cashLimitPaise: number;
  softLimitPaise: number;
  utilizationPercentage: number;
  lockStatus: "UNLOCKED" | "DEPOSIT_PROMPT_TRIGGERED" | "COD_LOCKED";
  canAcceptCodOrders: boolean;
  canAcceptPrepaidOrders: boolean;
  canAcceptIncomingOrder: boolean;
  actionRequired: "NONE" | "TRIGGER_DEPOSIT_PROMPT" | "MANDATORY_UPI_DEPOSIT";
  settlementLink?: string;
  promptMessage?: string;
  rejectionReason?: string;
  evaluationLog: string;
}

export interface CodSettlementResult {
  settlementId: string;
  riderId: string;
  previousCashPaise: number;
  depositedAmountPaise: number;
  newCashInHandPaise: number;
  newCashInHandRupees: number;
  settlementRail: string;
  isUnlocked: boolean;
  newLockStatus: "UNLOCKED" | "DEPOSIT_PROMPT_TRIGGERED" | "COD_LOCKED";
  receiptTimestamp: string;
}

export interface AutonomousExceptionInput {
  orderId: string;
  restaurantId: string;
  restaurantManagerPhone: string;
  customerPhone?: string;
  elapsedOrderMinutes: number; // Minutes since customer placed order
  quotedDeliveryMinutes: number; // Promise time quoted to customer (e.g. 35 mins)
  kitchenPrepElapsedMinutes: number; // Minutes since kitchen started prep
  kitchenQuotedPrepMinutes: number; // Quoted prep time (e.g. 15 mins)
  foodReadyMarked: boolean;
  riderAssigned: boolean;
  riderCurrentStatus?: "TRANSIT_TO_RESTAURANT" | "WAITING_AT_RESTAURANT" | "TRANSIT_TO_CUSTOMER" | "DELIVERED";
  riderStationaryMinutes?: number;
}

export interface AutonomousExceptionResolution {
  orderId: string;
  actionRequired: "NONE" | "AI_VOICE_IVR_CALL" | "AUTO_COMPENSATE_CUSTOMER" | "RIDER_STATIONARY_WARNING";
  severity: "INFO" | "WARNING" | "P0_CRITICAL";
  reason: string;
  payload: {
    target?: string;
    phoneNumber?: string;
    ivrScript?: string;
    ivrLanguage?: string;
    walletCreditPaise?: number;
    walletCreditRupees?: number;
    customerNotification?: string;
    automatedAuditTrail?: string;
  };
  resolutionTimestamp: string;
}

export interface RiderPerformanceStats {
  riderId: string;
  acceptanceRatePct: number; // e.g. 94.5%
  completionRatePct: number; // e.g. 97.2%
  onTimeDeliveryRatePct: number; // e.g. 93.8%
  weeklyCompletedOrders: number; // e.g. 52
}

export interface RiderTierEvaluation {
  riderId: string;
  tier: RiderTier;
  acceptanceRatePct: number;
  completionRatePct: number;
  onTimeDeliveryRatePct: number;
  priorityDispatchMultiplier: number;
  surgeBonusMultiplier: number;
  weeklyMilestoneBonusAwarded: {
    totalBonusPaise: number;
    totalBonusRupees: number;
    achievedMilestones: Array<{
      targetOrders: number;
      bonusPaise: number;
      title: string;
    }>;
  };
  nextTierRequirements?: {
    nextTier: RiderTier;
    gapAcceptanceRate: number;
    gapCompletionRate: number;
    gapOnTimeDeliveryRate: number;
  };
}

// ============================================================================
// 4. SUPREME ZOMATO FLEET ENGINE IMPLEMENTATION
// ============================================================================

export class ZomatoFleetEngine {
  private config: ZomatoFleetConfig;

  constructor(customConfig?: Partial<ZomatoFleetConfig>) {
    this.config = {
      ...DEFAULT_FLEET_CONFIG,
      ...customConfig,
      dispatch: { ...DEFAULT_FLEET_CONFIG.dispatch, ...customConfig?.dispatch },
      batching: { ...DEFAULT_FLEET_CONFIG.batching, ...customConfig?.batching },
      codSafety: { ...DEFAULT_FLEET_CONFIG.codSafety, ...customConfig?.codSafety },
      exceptions: { ...DEFAULT_FLEET_CONFIG.exceptions, ...customConfig?.exceptions },
      payout: { ...DEFAULT_FLEET_CONFIG.payout, ...customConfig?.payout },
      tiers: { ...DEFAULT_FLEET_CONFIG.tiers, ...customConfig?.tiers },
      weeklyMilestones: customConfig?.weeklyMilestones ?? DEFAULT_FLEET_CONFIG.weeklyMilestones,
    };
  }

  // ==========================================================================
  // CONFIGURATION & UMAROS DIALS
  // ==========================================================================

  public getConfig(): ZomatoFleetConfig {
    return this.config;
  }

  public updateConfig(newConfig: Partial<ZomatoFleetConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      dispatch: { ...this.config.dispatch, ...newConfig.dispatch },
      batching: { ...this.config.batching, ...newConfig.batching },
      codSafety: { ...this.config.codSafety, ...newConfig.codSafety },
      exceptions: { ...this.config.exceptions, ...newConfig.exceptions },
      payout: { ...this.config.payout, ...newConfig.payout },
      tiers: { ...this.config.tiers, ...newConfig.tiers },
      weeklyMilestones: newConfig.weeklyMilestones ?? this.config.weeklyMilestones,
    };
  }

  public resetToDefaults(): void {
    this.config = JSON.parse(JSON.stringify(DEFAULT_FLEET_CONFIG));
  }

  // ==========================================================================
  // 1. AUTONOMOUS DISPATCH PRE-ALLOCATION (0 IDLE MINUTES TARGET)
  // ==========================================================================

  /**
   * Computes the exact second to notify and page the delivery partner so that
   * their arrival at the merchant kitchen coincides exactly with food packaging.
   *
   * Mathematical Model:
   * Target Food Ready Timestamp = Order Confirmed At + Predicted KPT
   * Target Rider Arrival Timestamp = Target Food Ready Timestamp
   * Optimal Dispatch Notification Timestamp = Target Rider Arrival - Rider ETA
   * Minutes Until Dispatch = (Optimal Dispatch Timestamp - Current Time) in minutes
   *
   * When rider is notified at Optimal Dispatch Timestamp, their wait time is:
   * Idle Minutes = max(0, Rider Arrival Time - Actual Food Ready Time) = 0.0 minutes!
   */
  public calculateDispatchPreAllocation(input: PreAllocationInput): PreAllocationPlan {
    const orderConfirmedTime = new Date(input.orderConfirmedAt).getTime();
    const currentTime = input.currentTime ? new Date(input.currentTime).getTime() : Date.now();

    const kptMs = input.predictedKptMinutes * 60 * 1000;
    const riderEtaMs = input.riderEtaMinutes * 60 * 1000;

    const foodReadyTimestampMs = orderConfirmedTime + kptMs;
    // Rider arrival should coincide exactly with food packing:
    const targetRiderArrivalMs = foodReadyTimestampMs;
    const optimalDispatchMs = targetRiderArrivalMs - riderEtaMs;

    const msUntilDispatch = optimalDispatchMs - currentTime;
    const minutesUntilDispatch = Math.round((msUntilDispatch / (60 * 1000)) * 100) / 100;

    // Evaluate idle time if dispatched at optimal timing:
    // If dispatched on time, rider travel time equals remaining food prep time => 0 idle min.
    const expectedRiderIdleMinutes = Math.max(
      0,
      Math.round((input.riderEtaMinutes - input.predictedKptMinutes) * 100) / 100
    );

    const isImmediate = minutesUntilDispatch <= this.config.dispatch.immediateDispatchLeadThresholdMinutes;
    const status: "DISPATCH_IMMEDIATELY" | "HOLD_FOR_KITCHEN_PROGRESS" = isImmediate
      ? "DISPATCH_IMMEDIATELY"
      : "HOLD_FOR_KITCHEN_PROGRESS";

    const dispatchLog = isImmediate
      ? `[Autonomous Dispatch] Order #${input.orderId}: Paging rider immediately. ETA to restaurant (${input.riderEtaMinutes}m) matches remaining KPT (${input.predictedKptMinutes}m). Expected idle: 0 min.`
      : `[Autonomous Dispatch] Order #${input.orderId}: Holding dispatch for ${minutesUntilDispatch.toFixed(
          1
        )}m. Food prep in progress (${input.predictedKptMinutes}m KPT). Rider ETA is ${
          input.riderEtaMinutes
        }m. Pre-allocating notification at ${new Date(optimalDispatchMs).toISOString()}.`;

    return {
      orderId: input.orderId,
      predictedKptMinutes: input.predictedKptMinutes,
      riderEtaMinutes: input.riderEtaMinutes,
      foodReadyTimestamp: new Date(foodReadyTimestampMs).toISOString(),
      targetRiderArrivalTimestamp: new Date(targetRiderArrivalMs).toISOString(),
      optimalDispatchTimestamp: new Date(optimalDispatchMs).toISOString(),
      minutesUntilDispatch,
      expectedRiderIdleMinutes,
      status,
      dispatchLog,
    };
  }

  // ==========================================================================
  // 2. MULTI-ORDER BATCHING LOGIC
  // ==========================================================================

  /**
   * Merges co-located pickup orders with adjacent drop locations:
   * - Validates pickup proximity (<= maxPickupDistanceMeters, default 500m or same restaurant).
   * - Validates drop proximity (<= maxDropDistanceMeters, default 2000m).
   * - Validates prep synchronization (<= maxBatchTimeDiffMinutes, default 10m).
   * - Applies 35% pickup discount on 2nd base pay while strictly preserving rider drop incentives.
   */
  public evaluateOrderBatching(order1: BatchOrderInput, order2: BatchOrderInput): BatchingEvaluationResult {
    const bc = this.config.batching;
    const pc = this.config.payout;
    const rejectionReasons: string[] = [];

    // 1. Pickup Co-Location Check
    const sameRestaurant = order1.restaurantId === order2.restaurantId;
    const pickupDistanceMeters = sameRestaurant
      ? 0
      : calculateHaversineDistanceMeters(order1.pickupLocation, order2.pickupLocation);

    if (!sameRestaurant && pickupDistanceMeters > bc.maxPickupDistanceMeters) {
      rejectionReasons.push(
        `Pickup distance of ${pickupDistanceMeters}m exceeds co-location limit of ${bc.maxPickupDistanceMeters}m.`
      );
    }

    // 2. Adjacent Drop-off Check
    const dropDistanceMeters = calculateHaversineDistanceMeters(order1.dropoffLocation, order2.dropoffLocation);
    if (dropDistanceMeters > bc.maxDropDistanceMeters) {
      rejectionReasons.push(
        `Drop distance of ${dropDistanceMeters}m exceeds adjacency threshold of ${bc.maxDropDistanceMeters}m.`
      );
    }

    // 3. Time Synchronization Check
    const t1 = new Date(order1.readyTimeExpected).getTime();
    const t2 = new Date(order2.readyTimeExpected).getTime();
    const timeGapMinutes = Math.abs(t1 - t2) / (60 * 1000);
    if (timeGapMinutes > bc.maxBatchTimeDiffMinutes) {
      rejectionReasons.push(
        `Food ready time delta of ${timeGapMinutes.toFixed(1)}m exceeds maximum allowed batch delta of ${
          bc.maxBatchTimeDiffMinutes
        }m.`
      );
    }

    // 4. Cargo Weight Limit Check
    const weight1 = order1.cargoWeightKg ?? 2.0;
    const weight2 = order2.cargoWeightKg ?? 2.0;
    const combinedWeightKg = weight1 + weight2;
    if (combinedWeightKg > bc.maxCargoWeightKg) {
      rejectionReasons.push(
        `Combined cargo weight of ${combinedWeightKg}kg exceeds maximum safe rider payload of ${bc.maxCargoWeightKg}kg.`
      );
    }

    const isBatchable = rejectionReasons.length === 0;

    if (!isBatchable) {
      return {
        isBatchable: false,
        rejectionReasons,
        orders: [order1, order2],
        pickupDistanceMeters,
        dropDistanceMeters,
        timeGapMinutes,
        combinedWeightKg,
      };
    }

    // Calculate Batched Rider Payout with 35% base pickup discount on 2nd order:
    // Order 1: Full Base Pay + Full Drop Incentive + Last Mile Pay
    const order1BasePayPaise = pc.basePayPaise;
    const order1LastMilePayPaise = Math.round(order1.lastMileDistanceKm * pc.lastMileRatePaisePerKm);
    const order1DropIncentivePaise = bc.preserveDropIncentives ? bc.dropIncentiveBonusPaise : 0;
    const order1TotalPaise = order1BasePayPaise + order1LastMilePayPaise + order1DropIncentivePaise;

    // Order 2: 35% Pickup Discount on Base Pay, but 100% PRESERVED drop incentive!
    const discountPct = bc.batchPickupDiscountPct;
    const order2BaseDiscountPaise = Math.round((pc.basePayPaise * discountPct) / 100);
    const order2BasePayPaise = pc.basePayPaise - order2BaseDiscountPaise;
    const order2LastMilePayPaise = Math.round(order2.lastMileDistanceKm * pc.lastMileRatePaisePerKm);
    const order2DropIncentivePaise = bc.preserveDropIncentives ? bc.dropIncentiveBonusPaise : 0;
    const order2TotalPaise = order2BasePayPaise + order2LastMilePayPaise + order2DropIncentivePaise;

    const totalRiderPayoutPaise = order1TotalPaise + order2TotalPaise;
    const platformBaseDiscountPaise = order2BaseDiscountPaise;

    const explanation = `Batched Order: 1st Base ₹${(order1BasePayPaise / 100).toFixed(2)}, 2nd Base ₹${(
      order2BasePayPaise / 100
    ).toFixed(2)} (${discountPct}% pickup discount applied). Rider drop incentives (₹${(
      order1DropIncentivePaise / 100
    ).toFixed(2)} + ₹${(order2DropIncentivePaise / 100).toFixed(
      2
    )}) 100% PRESERVED. Platform saved ₹${(platformBaseDiscountPaise / 100).toFixed(2)}.`;

    return {
      isBatchable: true,
      rejectionReasons: [],
      orders: [order1, order2],
      pickupDistanceMeters,
      dropDistanceMeters,
      timeGapMinutes,
      combinedWeightKg,
      pricing: {
        order1: {
          orderId: order1.id,
          basePayPaise: order1BasePayPaise,
          basePayDiscountPaise: 0,
          dropIncentivePaise: order1DropIncentivePaise,
          lastMilePayPaise: order1LastMilePayPaise,
          totalOrderPayoutPaise: order1TotalPaise,
          totalOrderPayoutRupees: order1TotalPaise / 100,
        },
        order2: {
          orderId: order2.id,
          basePayPaise: order2BasePayPaise,
          basePayDiscountPaise: order2BaseDiscountPaise,
          dropIncentivePaise: order2DropIncentivePaise,
          lastMilePayPaise: order2LastMilePayPaise,
          totalOrderPayoutPaise: order2TotalPaise,
          totalOrderPayoutRupees: order2TotalPaise / 100,
        },
        totalRiderPayoutPaise,
        totalRiderPayoutRupees: totalRiderPayoutPaise / 100,
        platformBaseDiscountPaise,
        platformBaseDiscountRupees: platformBaseDiscountPaise / 100,
        explanation,
      },
    };
  }

  // ==========================================================================
  // 3. COD FLOATING CASH SAFETY LOCK
  // ==========================================================================

  /**
   * Enforces strict ₹1,500 cash-in-hand limit:
   * - At ₹1,200 (80% soft limit), triggers automated UPI deposit prompt.
   * - At ₹1,500 (100% hard limit), locks rider from receiving new COD orders until settled via Razorpay/UPI payout rail.
   * - If incoming order is COD and would breach ₹1,500, it is rejected for this rider.
   */
  public evaluateCodSafetyLock(input: CodEvaluationInput): CodSafetyStatus {
    const cs = this.config.codSafety;
    const cashPaise = input.currentCashInHandPaise;
    const limitPaise = cs.cashInHandLimitPaise; // 150000 paise = ₹1,500
    const softLimitPaise = Math.round((limitPaise * cs.softWarningThresholdPct) / 100); // 120000 paise = ₹1,200
    const utilizationPct = Math.round((cashPaise / limitPaise) * 1000) / 10;

    const settlementAmountPaise = Math.max(0, cashPaise - 30000); // Suggest leaving ₹300 petty change or full remittance
    const settlementAmountRupees = (cashPaise / 100).toFixed(2);
    const upiLink = `upi://pay?pa=${cs.upiVpaPayee}&pn=${encodeURIComponent(
      cs.merchantName
    )}&am=${settlementAmountRupees}&cu=INR&tn=CashSettlement_${input.riderId}`;

    let lockStatus: "UNLOCKED" | "DEPOSIT_PROMPT_TRIGGERED" | "COD_LOCKED" = "UNLOCKED";
    let canAcceptCodOrders = true;
    let canAcceptPrepaidOrders = true;
    let canAcceptIncomingOrder = true;
    let actionRequired: "NONE" | "TRIGGER_DEPOSIT_PROMPT" | "MANDATORY_UPI_DEPOSIT" = "NONE";
    let promptMessage: string | undefined = undefined;
    let rejectionReason: string | undefined = undefined;
    let evaluationLog = "";

    // 1. Hard Lock: Cash >= Limit (₹1,500)
    if (cashPaise >= limitPaise) {
      lockStatus = "COD_LOCKED";
      canAcceptCodOrders = false;
      canAcceptPrepaidOrders = true; // Rider can STILL deliver prepaid/UPI orders!
      actionRequired = "MANDATORY_UPI_DEPOSIT";
      promptMessage = `SAFETY LOCK ACTIVE: Cash-in-hand (₹${(cashPaise / 100).toFixed(
        2
      )}) reached maximum allowed limit of ₹${(limitPaise / 100).toFixed(
        2
      )}. New COD orders are locked. Remit immediately via UPI.`;
      evaluationLog = `[COD Safety] Rider ${input.riderId} LOCKED: Cash ₹${(cashPaise / 100).toFixed(
        2
      )} reached 100% threshold (₹1,500). Restricted to Prepaid only.`;
    }
    // 2. Soft Warning: Cash >= 80% (₹1,200)
    else if (cashPaise >= softLimitPaise) {
      lockStatus = "DEPOSIT_PROMPT_TRIGGERED";
      canAcceptCodOrders = true;
      canAcceptPrepaidOrders = true;
      actionRequired = "TRIGGER_DEPOSIT_PROMPT";
      promptMessage = `DEPOSIT WARNING: Cash-in-hand is ₹${(cashPaise / 100).toFixed(
        2
      )} (${utilizationPct}% of ₹${(limitPaise / 100).toFixed(
        2
      )} limit). Deposit now via UPI to avoid COD dispatch freeze.`;
      evaluationLog = `[COD Safety] Rider ${input.riderId} WARNING: Cash ₹${(cashPaise / 100).toFixed(
        2
      )} reached ${utilizationPct}% (>=80% warning threshold). Prompting UPI deposit.`;
    } else {
      lockStatus = "UNLOCKED";
      canAcceptCodOrders = true;
      canAcceptPrepaidOrders = true;
      actionRequired = "NONE";
      evaluationLog = `[COD Safety] Rider ${input.riderId} NOMINAL: Cash ₹${(cashPaise / 100).toFixed(
        2
      )} (${utilizationPct}% of limit). COD enabled.`;
    }

    // 3. Evaluate Incoming Order Feasibility
    if (input.incomingOrder) {
      if (input.incomingOrder.isCod) {
        if (!canAcceptCodOrders) {
          canAcceptIncomingOrder = false;
          rejectionReason = `Rider ${input.riderId} is COD-locked. Cannot assign COD order #${input.incomingOrder.orderId}.`;
        } else {
          const projectedCashPaise = cashPaise + input.incomingOrder.codAmountPaise;
          if (projectedCashPaise > limitPaise) {
            canAcceptIncomingOrder = false;
            rejectionReason = `Order #${input.incomingOrder.orderId} COD amount (₹${(
              input.incomingOrder.codAmountPaise / 100
            ).toFixed(2)}) would breach ₹${(limitPaise / 100).toFixed(2)} limit. Projected cash: ₹${(
              projectedCashPaise / 100
            ).toFixed(2)}.`;
          }
        }
      }
    }

    return {
      riderId: input.riderId,
      currentCashInHandPaise: cashPaise,
      currentCashInHandRupees: cashPaise / 100,
      cashLimitPaise: limitPaise,
      softLimitPaise,
      utilizationPercentage: utilizationPct,
      lockStatus,
      canAcceptCodOrders,
      canAcceptPrepaidOrders,
      canAcceptIncomingOrder,
      actionRequired,
      settlementLink: actionRequired !== "NONE" ? upiLink : undefined,
      promptMessage,
      rejectionReason,
      evaluationLog,
    };
  }

  /**
   * Settles rider cash via Razorpay/UPI payout rail and restores COD dispatch privileges.
   */
  public settleRiderCash(
    riderId: string,
    currentCashInHandPaise: number,
    depositedAmountPaise: number,
    rail = "RAZORPAY_UPI"
  ): CodSettlementResult {
    const newCashInHandPaise = Math.max(0, currentCashInHandPaise - depositedAmountPaise);
    const limitPaise = this.config.codSafety.cashInHandLimitPaise;
    const softLimitPaise = Math.round((limitPaise * this.config.codSafety.softWarningThresholdPct) / 100);

    let newLockStatus: "UNLOCKED" | "DEPOSIT_PROMPT_TRIGGERED" | "COD_LOCKED" = "UNLOCKED";
    if (newCashInHandPaise >= limitPaise) {
      newLockStatus = "COD_LOCKED";
    } else if (newCashInHandPaise >= softLimitPaise) {
      newLockStatus = "DEPOSIT_PROMPT_TRIGGERED";
    } else {
      newLockStatus = "UNLOCKED";
    }

    const isUnlocked = newLockStatus !== "COD_LOCKED";

    return {
      settlementId: `settle_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      riderId,
      previousCashPaise: currentCashInHandPaise,
      depositedAmountPaise,
      newCashInHandPaise,
      newCashInHandRupees: newCashInHandPaise / 100,
      settlementRail: rail,
      isUnlocked,
      newLockStatus,
      receiptTimestamp: new Date().toISOString(),
    };
  }

  // ==========================================================================
  // 4. AUTONOMOUS EXCEPTION HANDLING (EMPLOYEE-LESS)
  // ==========================================================================

  /**
   * Completely employee-less exception resolution:
   * 1. Kitchen Delay: When food prep exceeds promise time by >7 mins,
   *    trigger automated AI voice IVR call to restaurant kitchen manager.
   * 2. SLA Delivery Breach: When order is delayed >15 mins beyond quoted ETA,
   *    automatically credit customer's KingPay wallet with ₹50 and notify customer without human intervention.
   * 3. Rider Stationary Alert: When rider stops for >8 mins during transit.
   */
  public evaluateAutonomousExceptions(input: AutonomousExceptionInput): AutonomousExceptionResolution {
    const ec = this.config.exceptions;

    // 1. Kitchen Delay Check (> 7 mins grace)
    if (
      !input.foodReadyMarked &&
      input.kitchenPrepElapsedMinutes > input.kitchenQuotedPrepMinutes + ec.kitchenDelayGraceMinutes
    ) {
      const delayMinutes = input.kitchenPrepElapsedMinutes - input.kitchenQuotedPrepMinutes;
      const ivrScript = `Urgent alert from OrderKing Autonomous Fleet Engine. Order #${input.orderId} kitchen prep has exceeded promised time by ${delayMinutes} minutes. Delivery partner is on site or approaching. Please expedite food packaging immediately. Press 1 when packed.`;

      return {
        orderId: input.orderId,
        actionRequired: "AI_VOICE_IVR_CALL",
        severity: "P0_CRITICAL",
        reason: `Kitchen prep exceeded by ${delayMinutes} minutes (> ${ec.kitchenDelayGraceMinutes}m grace). Automated outbound AI IVR call initiated to restaurant kitchen manager.`,
        payload: {
          target: "RESTAURANT_KITCHEN_MANAGER",
          phoneNumber: input.restaurantManagerPhone,
          ivrScript,
          ivrLanguage: ec.kitchenIvrLanguage,
          automatedAuditTrail: `[Autonomous AI IVR] Placed outbound voice call to ${input.restaurantManagerPhone} for order #${input.orderId}.`,
        },
        resolutionTimestamp: new Date().toISOString(),
      };
    }

    // 2. SLA Delivery Breach Check (> 15 mins delay beyond quoted ETA)
    if (input.elapsedOrderMinutes > input.quotedDeliveryMinutes + ec.slaDeliveryBreachGraceMinutes) {
      const breachMinutes = input.elapsedOrderMinutes - input.quotedDeliveryMinutes;
      const creditPaise = ec.slaBreachWalletCreditPaise;
      const creditRupees = creditPaise / 100;
      const notification = `We sincerely apologize for the delay of ${breachMinutes} minutes on order #${input.orderId}. ₹${creditRupees.toFixed(
        2
      )} has been credited instantly to your KingPay Wallet.`;

      return {
        orderId: input.orderId,
        actionRequired: "AUTO_COMPENSATE_CUSTOMER",
        severity: "P0_CRITICAL",
        reason: `Delivery breached promised ETA by ${breachMinutes} minutes (> ${ec.slaDeliveryBreachGraceMinutes}m SLA threshold). Automated ₹${creditRupees.toFixed(
          2
        )} KingPay wallet compensation issued to customer.`,
        payload: {
          target: "CUSTOMER_KINGPAY_WALLET",
          phoneNumber: input.customerPhone,
          walletCreditPaise: creditPaise,
          walletCreditRupees: creditRupees,
          customerNotification: notification,
          automatedAuditTrail: `[Autonomous KingPay Ledger] Auto-credited ₹${creditRupees.toFixed(
            2
          )} to customer wallet for SLA breach on order #${input.orderId}.`,
        },
        resolutionTimestamp: new Date().toISOString(),
      };
    }

    // 3. Rider Stationary / Mid-Transit Delay Check
    if (
      input.riderStationaryMinutes &&
      input.riderStationaryMinutes >= ec.stationaryAlertThresholdMinutes &&
      input.riderCurrentStatus === "TRANSIT_TO_CUSTOMER"
    ) {
      return {
        orderId: input.orderId,
        actionRequired: "RIDER_STATIONARY_WARNING",
        severity: "WARNING",
        reason: `Rider has been stationary for ${input.riderStationaryMinutes} minutes during active customer transit. Automated status check dispatched.`,
        payload: {
          target: "RIDER_APP",
          automatedAuditTrail: `[Autonomous Telematics] Sent app telemetry ping and safety confirmation prompt to rider on order #${input.orderId}.`,
        },
        resolutionTimestamp: new Date().toISOString(),
      };
    }

    // Nominal
    return {
      orderId: input.orderId,
      actionRequired: "NONE",
      severity: "INFO",
      reason: "Order and fleet operations are executing within acceptable SLA parameters.",
      payload: {},
      resolutionTimestamp: new Date().toISOString(),
    };
  }

  // ==========================================================================
  // 5. RIDER TIER GAMIFICATION & MILESTONE BONUSES
  // ==========================================================================

  /**
   * Evaluates rider tier based on:
   * - Acceptance Rate (AR > 90% for Gold)
   * - Completion Rate (CR > 95% for Gold)
   * - On-Time Delivery Rate (OTD > 92% for Gold)
   * Unlocks priority dispatch multiplier and weekly milestone bonuses (e.g. 50 orders = ₹1,200 bonus).
   */
  public evaluateRiderTier(stats: RiderPerformanceStats): RiderTierEvaluation {
    const tc = this.config.tiers;
    let tier: RiderTier = "BRONZE";

    // Tier Evaluation Ladder (Diamond -> Gold -> Silver -> Bronze)
    if (
      stats.acceptanceRatePct >= tc.diamond.minAcceptanceRatePct &&
      stats.completionRatePct >= tc.diamond.minCompletionRatePct &&
      stats.onTimeDeliveryRatePct >= tc.diamond.minOnTimeDeliveryRatePct
    ) {
      tier = "DIAMOND";
    } else if (
      stats.acceptanceRatePct >= tc.gold.minAcceptanceRatePct &&
      stats.completionRatePct >= tc.gold.minCompletionRatePct &&
      stats.onTimeDeliveryRatePct >= tc.gold.minOnTimeDeliveryRatePct
    ) {
      tier = "GOLD";
    } else if (
      stats.acceptanceRatePct >= tc.silver.minAcceptanceRatePct &&
      stats.completionRatePct >= tc.silver.minCompletionRatePct &&
      stats.onTimeDeliveryRatePct >= tc.silver.minOnTimeDeliveryRatePct
    ) {
      tier = "SILVER";
    } else {
      tier = "BRONZE";
    }

    const tierConfig =
      tier === "DIAMOND"
        ? tc.diamond
        : tier === "GOLD"
        ? tc.gold
        : tier === "SILVER"
        ? tc.silver
        : tc.bronze;

    // Calculate Eligible Weekly Milestone Bonuses
    const achievedMilestones: Array<{ targetOrders: number; bonusPaise: number; title: string }> = [];
    let totalBonusPaise = 0;

    for (const milestone of this.config.weeklyMilestones) {
      if (stats.weeklyCompletedOrders >= milestone.targetOrders) {
        achievedMilestones.push(milestone);
        totalBonusPaise += milestone.bonusPaise;
      }
    }

    // Determine Gap to Next Tier
    let nextTierRequirements: RiderTierEvaluation["nextTierRequirements"] = undefined;
    if (tier === "BRONZE") {
      nextTierRequirements = {
        nextTier: "SILVER",
        gapAcceptanceRate: Math.max(0, tc.silver.minAcceptanceRatePct - stats.acceptanceRatePct),
        gapCompletionRate: Math.max(0, tc.silver.minCompletionRatePct - stats.completionRatePct),
        gapOnTimeDeliveryRate: Math.max(0, tc.silver.minOnTimeDeliveryRatePct - stats.onTimeDeliveryRatePct),
      };
    } else if (tier === "SILVER") {
      nextTierRequirements = {
        nextTier: "GOLD",
        gapAcceptanceRate: Math.max(0, tc.gold.minAcceptanceRatePct - stats.acceptanceRatePct),
        gapCompletionRate: Math.max(0, tc.gold.minCompletionRatePct - stats.completionRatePct),
        gapOnTimeDeliveryRate: Math.max(0, tc.gold.minOnTimeDeliveryRatePct - stats.onTimeDeliveryRatePct),
      };
    } else if (tier === "GOLD") {
      nextTierRequirements = {
        nextTier: "DIAMOND",
        gapAcceptanceRate: Math.max(0, tc.diamond.minAcceptanceRatePct - stats.acceptanceRatePct),
        gapCompletionRate: Math.max(0, tc.diamond.minCompletionRatePct - stats.completionRatePct),
        gapOnTimeDeliveryRate: Math.max(0, tc.diamond.minOnTimeDeliveryRatePct - stats.onTimeDeliveryRatePct),
      };
    }

    return {
      riderId: stats.riderId,
      tier,
      acceptanceRatePct: stats.acceptanceRatePct,
      completionRatePct: stats.completionRatePct,
      onTimeDeliveryRatePct: stats.onTimeDeliveryRatePct,
      priorityDispatchMultiplier: tierConfig.priorityDispatchMultiplier,
      surgeBonusMultiplier: tierConfig.surgeBonusMultiplier,
      weeklyMilestoneBonusAwarded: {
        totalBonusPaise,
        totalBonusRupees: totalBonusPaise / 100,
        achievedMilestones,
      },
      nextTierRequirements,
    };
  }

  // ==========================================================================
  // 6. UMAROS EXPORT & DIAL BINDINGS
  // ==========================================================================

  /**
   * Generates real-time parameter descriptors for UmarOS graphical sliders and dashboard dials.
   */
  public exportForUmarOS() {
    return {
      metadata: {
        engine: "ZomatoFleetEngine",
        version: "2.0.0",
        governance: "UMAR_OS_AUTONOMOUS",
      },
      dials: [
        {
          key: "dispatch.urbanTrafficSpeedKmph",
          label: "Urban Transit Speed (km/h)",
          currentValue: this.config.dispatch.urbanTrafficSpeedKmph,
          min: 10,
          max: 45,
          step: 1,
        },
        {
          key: "batching.batchPickupDiscountPct",
          label: "Batch 2nd Base Pickup Discount (%)",
          currentValue: this.config.batching.batchPickupDiscountPct,
          min: 10,
          max: 50,
          step: 5,
        },
        {
          key: "codSafety.cashInHandLimitPaise",
          label: "COD Cash-in-Hand Safety Lock Limit (₹)",
          currentValue: this.config.codSafety.cashInHandLimitPaise / 100,
          min: 500,
          max: 5000,
          step: 100,
        },
        {
          key: "codSafety.softWarningThresholdPct",
          label: "COD Soft Warning Threshold (%)",
          currentValue: this.config.codSafety.softWarningThresholdPct,
          min: 50,
          max: 95,
          step: 5,
        },
        {
          key: "exceptions.kitchenDelayGraceMinutes",
          label: "Kitchen Delay Grace Before AI Voice Call (mins)",
          currentValue: this.config.exceptions.kitchenDelayGraceMinutes,
          min: 3,
          max: 15,
          step: 1,
        },
        {
          key: "exceptions.slaDeliveryBreachGraceMinutes",
          label: "Delivery SLA Breach Grace Before Auto-Refund (mins)",
          currentValue: this.config.exceptions.slaDeliveryBreachGraceMinutes,
          min: 10,
          max: 30,
          step: 1,
        },
        {
          key: "exceptions.slaBreachWalletCreditPaise",
          label: "SLA Delay Customer Wallet Credit (₹)",
          currentValue: this.config.exceptions.slaBreachWalletCreditPaise / 100,
          min: 20,
          max: 200,
          step: 10,
        },
      ],
      activeConfig: this.config,
    };
  }
}
