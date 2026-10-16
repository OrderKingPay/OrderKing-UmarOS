/**
 * UMAR OS - Supreme Rider Dynamic Trust, Risk Scoring & Polite Anti-Theft Shield Engine
 * Location: HDmaster/src/lib/orderking/fleet/rider-trust-engine.ts
 *
 * Core Pillars:
 * 1. Dynamic Floating Cash Limits (Tiers 1-4: Bronze ₹1,500 to Diamond ₹8,000-₹10,000)
 * 2. Silent Anti-Theft & Loss-Prevention Risk Scoring (0-100 Trust Score based on
 *    settlement punctuality, post-collection cancellations, GPS consistency, and disputes)
 * 3. Human-First, Dignified, Polite Messaging (Zero punitive or accusatory words)
 * 4. Founder Manual Override Controls (Custom limits, force locks/unlocks, grace periods)
 * 5. Instant UPI Settlement Rail & Deep Links
 */

import { z } from "zod";

// ============================================================================
// 1. FORBIDDEN WORDS GUARD (POLITE, NON-OFFENSIVE HUMAN-FIRST ENFORCEMENT)
// ============================================================================

export const FORBIDDEN_WORDS = [
  "theft",
  "fraud",
  "suspect",
  "penalty",
  "penalties",
  "criminal",
  "defaulter",
  "cheat",
  "suspicious",
  "punish",
  "punishment",
  "blacklisted",
  "blacklist",
] as const;

/**
 * Validates that any rider-facing or customer-facing text completely avoids
 * negative, punitive, or offensive phrasing.
 */
export function validatePoliteMessage(message: string): { valid: boolean; violation?: string } {
  const normalized = message.toLowerCase();
  for (const word of FORBIDDEN_WORDS) {
    // Regex matching word boundary
    const regex = new RegExp(`\\b${word}\\b`, "i");
    if (regex.test(normalized)) {
      return { valid: false, violation: word };
    }
  }
  return { valid: true };
}

// ============================================================================
// 2. CONFIGURATION SCHEMAS (UMAR OS TUNABLE)
// ============================================================================

export const RiderTierConfigSchema = z.object({
  tier: z.enum(["BRONZE", "SILVER", "GOLD", "DIAMOND"]),
  displayName: z.string(),
  minCompletedOrders: z.number().int().nonnegative(),
  maxCompletedOrders: z.number().int().positive().optional(),
  requiredOnTimeSettlementRatePct: z.number().min(0).max(100),
  maxAllowedSettlementDelays: z.number().int().nonnegative(),
  maxAllowedDisputes: z.number().int().nonnegative(),
  baseLimitPaise: z.number().int().positive(),
  maxLimitPaise: z.number().int().positive(),
  perks: z.array(z.string()).default([]),
});

export type RiderTierConfig = z.infer<typeof RiderTierConfigSchema>;

export const DEFAULT_TIERS = {
  bronze: {
    tier: "BRONZE" as const,
    displayName: "Bronze Partner (Beginner)",
    minCompletedOrders: 0,
    maxCompletedOrders: 20,
    requiredOnTimeSettlementRatePct: 0,
    maxAllowedSettlementDelays: 0,
    maxAllowedDisputes: 999,
    baseLimitPaise: 150000, // ₹1,500.00
    maxLimitPaise: 150000, // ₹1,500.00
    perks: ["Starter Daily Cash Wallet", "Standard Dispatch Access"],
  },
  silver: {
    tier: "SILVER" as const,
    displayName: "Silver Partner (Reliable)",
    minCompletedOrders: 21,
    maxCompletedOrders: 100,
    requiredOnTimeSettlementRatePct: 100,
    maxAllowedSettlementDelays: 0,
    maxAllowedDisputes: 1,
    baseLimitPaise: 300000, // ₹3,000.00
    maxLimitPaise: 300000, // ₹3,000.00
    perks: ["Expanded ₹3,000 Daily Cash Wallet", "Priority Dispatch Queue"],
  },
  gold: {
    tier: "GOLD" as const,
    displayName: "Gold Partner (High-Performer)",
    minCompletedOrders: 101,
    maxCompletedOrders: 300,
    requiredOnTimeSettlementRatePct: 98,
    maxAllowedSettlementDelays: 1,
    maxAllowedDisputes: 0, // Zero disputes
    baseLimitPaise: 500000, // ₹5,000.00
    maxLimitPaise: 500000, // ₹5,000.00
    perks: ["Premium ₹5,000 Daily Cash Wallet", "High-Value Order Priority", "Fuel Subsidy Bonus"],
  },
  diamond: {
    tier: "DIAMOND" as const,
    displayName: "Diamond Partner (Master Partner)",
    minCompletedOrders: 301,
    requiredOnTimeSettlementRatePct: 98, // > 98%
    maxAllowedSettlementDelays: 2,
    maxAllowedDisputes: 0,
    baseLimitPaise: 800000, // ₹8,000.00
    maxLimitPaise: 1000000, // ₹10,000.00
    perks: [
      "Executive ₹8,000 - ₹10,000 Daily Cash Wallet",
      "Apex Dispatch Priority",
      "Instant Weekly Cashout Perks",
    ],
  },
};

export const DEFAULT_WEIGHTS = {
  settlementPunctuality: 35,
  cancellationIntegrity: 25,
  gpsConsistency: 20,
  disputeIntegrity: 20,
};

export const RiderTrustConfigSchema = z.object({
  // Tiers Setup
  tiers: z.object({
    bronze: RiderTierConfigSchema.default(DEFAULT_TIERS.bronze),
    silver: RiderTierConfigSchema.default(DEFAULT_TIERS.silver),
    gold: RiderTierConfigSchema.default(DEFAULT_TIERS.gold),
    diamond: RiderTierConfigSchema.default(DEFAULT_TIERS.diamond),
  }).default(DEFAULT_TIERS),

  // Risk Scoring Component Weights (Must sum to 100)
  weights: z.object({
    settlementPunctuality: z.number().min(0).max(100).default(35),
    cancellationIntegrity: z.number().min(0).max(100).default(25),
    gpsConsistency: z.number().min(0).max(100).default(20),
    disputeIntegrity: z.number().min(0).max(100).default(20),
  }).default(DEFAULT_WEIGHTS),

  // Settlement Cutoff & Overdue Thresholds
  settlementCutoffHours: z.number().positive().default(24), // Strict 24h cutoff
  softWarningThresholdPct: z.number().min(50).max(95).default(80), // 80% soft warning
  hardLockThresholdPct: z.number().min(95).max(110).default(100), // 100% hard lock

  // Trust Score Boundaries
  trustScoreDepressedLimit: z.number().min(0).max(100).default(60), // Under 60 falls back to base limit
  trustScoreLockLimit: z.number().min(0).max(100).default(40), // Under 40 locks COD to prepaid-only

  // Fallback Base Limit when Trust Score is Depressed (<60)
  depressedFallbackLimitPaise: z.number().int().positive().default(150000), // ₹1,500.00

  // Standard UPI Settlement Gateway
  defaultUpiVpa: z.string().default("orderking.fleet@axisbank"),
  merchantName: z.string().default("OrderKing Cash Settlement"),
});

export type RiderTrustConfig = z.infer<typeof RiderTrustConfigSchema>;

export const DEFAULT_RIDER_TRUST_CONFIG: RiderTrustConfig = RiderTrustConfigSchema.parse({});

// ============================================================================
// 3. STATS & METRICS DATA CONTRACTS
// ============================================================================

export type RiderTierLevel = "BRONZE" | "SILVER" | "GOLD" | "DIAMOND";

export interface RiderHistoricalStats {
  riderId: string;
  completedOrders: number;
  totalSettlementsCount: number;
  onTimeSettlementCount: number;
  settlementDelaysCount: number; // Settlements exceeding 24h cutoff
  disputeCount: number;
  cancellationsAfterCollectionCount: number;
  totalCashOrdersCount: number;
  activePendingOverdueHours?: number; // Hours since oldest un-settled cash collection
}

export interface RiderBehaviorMetrics {
  riderId: string;
  // 1. Settlement Punctuality (<24h Cutoff)
  totalCashCollections: number;
  onTimeSettlements: number;
  delayedSettlements: number;
  activePendingOverdueHours?: number;

  // 2. Post-Collection Cancellations
  cashOrdersCollected: number;
  cancellationsAfterCashCollected: number;

  // 3. GPS & Telemetry Integrity
  totalGpsCheckpoints: number;
  verifiedGpsCheckpoints: number;
  unverifiedOrAnomalousCheckpoints?: number;

  // 4. Customer Dispute History
  totalCustomerCashTransactions: number;
  disputedCashTransactions: number;
}

export interface TrustScoreBreakdown {
  settlementPunctualityScore: number; // 0 to 35
  cancellationIntegrityScore: number; // 0 to 25
  gpsConsistencyScore: number; // 0 to 20
  disputeIntegrityScore: number; // 0 to 20
  totalScore: number; // 0 to 100
  factors: {
    onTimeSettlementPct: number;
    cancellationAfterCollectionPct: number;
    gpsIntegrityPct: number;
    disputeRatePct: number;
    activeOverdueHours: number;
  };
  narrative: string;
}

// ============================================================================
// 4. FOUNDER MANUAL OVERRIDE CONTRACT
// ============================================================================

export interface FounderManualOverride {
  customLimitPaise?: number; // e.g. 1500000 paise (₹15,000)
  forceCodLock?: boolean; // Founder locks COD (Prepaid-only)
  forceCodUnlock?: boolean; // Founder unlocks COD regardless of threshold
  gracePeriodUntil?: string | Date; // Grace window ISO or Date
  graceHeadroomPaise?: number; // Extra headroom allowed during grace period
  overrideReason: string;
  overriddenBy: string;
  appliedAt: string | Date;
}

// ============================================================================
// 5. EVALUATION RESULT & POLITE NOTIFICATIONS
// ============================================================================

export type CashLimitThresholdState =
  | "NORMAL"
  | "SOFT_WARNING"
  | "HARD_LOCK"
  | "SAFE_HOLD_PREPAID_ONLY";

export interface PoliteNotification {
  title: string;
  message: string;
  dignifiedStatusBadge: string;
  actionRequired?: string;
  upiDeepLink?: string;
  severity: "INFO" | "ADVISORY" | "SAFE_HOLD";
}

export interface RiderCashLimitEvaluation {
  riderId: string;
  tier: RiderTierLevel;
  tierDisplayName: string;
  trustScore: number;
  scoreBreakdown: TrustScoreBreakdown;

  // State flags
  isScoreDepressed: boolean; // true if trustScore < 60
  isPrepaidOnlyForced: boolean; // true if trustScore < 40 or founder forceCodLock
  isGracePeriodActive: boolean;

  // Limits (all in integer paise)
  tierBaseLimitPaise: number;
  tierMaxLimitPaise: number;
  effectiveLimitPaise: number;
  currentCashInHandPaise: number;
  remainingCashCapacityPaise: number;
  utilizationPct: number;

  // Dispatch Decisions
  canAcceptCod: boolean;
  canAcceptPrepaid: boolean;
  thresholdState: CashLimitThresholdState;

  // Polite, Non-Offensive UI Messaging
  politeNotification: PoliteNotification;
  founderOverride?: FounderManualOverride;

  evaluatedAt: string;
}

export interface CanAcceptOrderResult {
  allowed: boolean;
  isCod: boolean;
  codAmountPaise: number;
  currentCashInHandPaise: number;
  projectedCashInHandPaise: number;
  effectiveLimitPaise: number;
  reason: string;
  politeMessage: string;
  actionRequired?: string;
  upiSettlementUri?: string;
}

// ============================================================================
// 6. CORE LOGIC FUNCTIONS
// ============================================================================

/**
 * Calculates Rider Tier based on historical delivery statistics.
 *
 * Tier 1 (Bronze): 0-20 orders, 0 settlement delays -> ₹1,500
 * Tier 2 (Silver): 21-100 orders, 100% on-time settlement -> ₹3,000
 * Tier 3 (Gold): 101-300 orders, zero disputes -> ₹5,000
 * Tier 4 (Diamond): 300+ orders, >98% on-time -> ₹8,000 - ₹10,000
 */
export function calculateRiderTier(
  stats: RiderHistoricalStats,
  config: RiderTrustConfig = DEFAULT_RIDER_TRUST_CONFIG
): {
  tier: RiderTierLevel;
  displayName: string;
  baseLimitPaise: number;
  maxLimitPaise: number;
  allocatedLimitPaise: number;
  perks: string[];
} {
  const { completedOrders, settlementDelaysCount, disputeCount, onTimeSettlementCount, totalSettlementsCount } = stats;

  const onTimeRatePct =
    totalSettlementsCount > 0 ? (onTimeSettlementCount / totalSettlementsCount) * 100 : 100;

  // Tier 4: Diamond (300+ completed orders, >98% on-time)
  if (
    completedOrders > 300 &&
    onTimeRatePct >= config.tiers.diamond.requiredOnTimeSettlementRatePct &&
    disputeCount <= config.tiers.diamond.maxAllowedDisputes &&
    settlementDelaysCount <= config.tiers.diamond.maxAllowedSettlementDelays
  ) {
    const isExemplaryDiamond =
      completedOrders >= 500 || (onTimeRatePct >= 99.5 && disputeCount === 0);

    const allocatedLimitPaise = isExemplaryDiamond
      ? config.tiers.diamond.maxLimitPaise // ₹10,000
      : config.tiers.diamond.baseLimitPaise; // ₹8,000

    return {
      tier: "DIAMOND",
      displayName: config.tiers.diamond.displayName,
      baseLimitPaise: config.tiers.diamond.baseLimitPaise,
      maxLimitPaise: config.tiers.diamond.maxLimitPaise,
      allocatedLimitPaise,
      perks: config.tiers.diamond.perks,
    };
  }

  // Tier 3: Gold (101-300 completed orders, zero disputes, >=98% on-time)
  if (
    completedOrders >= 101 &&
    disputeCount === 0 &&
    onTimeRatePct >= config.tiers.gold.requiredOnTimeSettlementRatePct &&
    settlementDelaysCount <= config.tiers.gold.maxAllowedSettlementDelays
  ) {
    return {
      tier: "GOLD",
      displayName: config.tiers.gold.displayName,
      baseLimitPaise: config.tiers.gold.baseLimitPaise,
      maxLimitPaise: config.tiers.gold.maxLimitPaise,
      allocatedLimitPaise: config.tiers.gold.baseLimitPaise, // ₹5,000
      perks: config.tiers.gold.perks,
    };
  }

  // Tier 2: Silver (21-100 completed orders, 100% on-time settlement, 0 settlement delays)
  if (
    completedOrders >= 21 &&
    settlementDelaysCount === 0 &&
    onTimeRatePct >= config.tiers.silver.requiredOnTimeSettlementRatePct &&
    disputeCount <= config.tiers.silver.maxAllowedDisputes
  ) {
    return {
      tier: "SILVER",
      displayName: config.tiers.silver.displayName,
      baseLimitPaise: config.tiers.silver.baseLimitPaise,
      maxLimitPaise: config.tiers.silver.maxLimitPaise,
      allocatedLimitPaise: config.tiers.silver.baseLimitPaise, // ₹3,000
      perks: config.tiers.silver.perks,
    };
  }

  // Tier 1: Bronze (0-20 orders, default starter tier)
  return {
    tier: "BRONZE",
    displayName: config.tiers.bronze.displayName,
    baseLimitPaise: config.tiers.bronze.baseLimitPaise,
    maxLimitPaise: config.tiers.bronze.maxLimitPaise,
    allocatedLimitPaise: config.tiers.bronze.baseLimitPaise, // ₹1,500
    perks: config.tiers.bronze.perks,
  };
}

/**
 * Calculates Silent Anti-Theft & Loss-Prevention Risk Scoring (0 to 100).
 *
 * Scoring Components:
 * 1. Settlement Punctuality (Cutoff <24h): Max 35 points
 * 2. Cancellation Integrity After Cash Collection: Max 25 points
 * 3. GPS Consistency & Telemetry Integrity: Max 20 points
 * 4. Customer Dispute History: Max 20 points
 */
export function calculateTrustScore(
  metrics: RiderBehaviorMetrics,
  config: RiderTrustConfig = DEFAULT_RIDER_TRUST_CONFIG
): TrustScoreBreakdown {
  const { weights } = config;
  const activeOverdue = metrics.activePendingOverdueHours ?? 0;

  // 1. Settlement Punctuality Component (0-35 points)
  const totalSettlements = metrics.totalCashCollections;
  const onTimeRate =
    totalSettlements > 0 ? metrics.onTimeSettlements / totalSettlements : 1.0;
  const onTimeSettlementPct = Math.round(onTimeRate * 100);

  let punctualityScore = onTimeRate * weights.settlementPunctuality;

  // Deduct if there is an active overdue settlement exceeding 24h
  if (activeOverdue > 24) {
    const overdueHoursPastCutoff = activeOverdue - 24;
    // Gradual deduction: 1 point per 2 hours overdue beyond cutoff
    const overdueDeduction = Math.min(weights.settlementPunctuality, Math.ceil(overdueHoursPastCutoff / 2));
    punctualityScore = Math.max(0, punctualityScore - overdueDeduction);
  }
  const settlementPunctualityScore = Math.round(Math.max(0, Math.min(weights.settlementPunctuality, punctualityScore)));

  // 2. Cancellation Integrity After Cash Collection (0-25 points)
  const cashCollectedCount = metrics.cashOrdersCollected;
  const postCollectionCancels = metrics.cancellationsAfterCashCollected;
  const cancellationAfterCollectionPct =
    cashCollectedCount > 0 ? (postCollectionCancels / cashCollectedCount) * 100 : 0;

  let cancellationScore = weights.cancellationIntegrity;
  if (postCollectionCancels > 0) {
    // Each post-collection cancellation significantly impacts integrity
    const penaltyPerCancellation = 12.5; // 2 cancellations wipe out score
    cancellationScore = Math.max(0, cancellationScore - postCollectionCancels * penaltyPerCancellation);
  }
  const cancellationIntegrityScore = Math.round(Math.max(0, Math.min(weights.cancellationIntegrity, cancellationScore)));

  // 3. GPS Consistency (0-20 points)
  const totalCheckpoints = metrics.totalGpsCheckpoints;
  const verifiedCheckpoints = metrics.verifiedGpsCheckpoints;
  const gpsIntegrityRate =
    totalCheckpoints > 0 ? verifiedCheckpoints / totalCheckpoints : 1.0;
  const gpsIntegrityPct = Math.round(gpsIntegrityRate * 100);

  let gpsScore = gpsIntegrityRate * weights.gpsConsistency;
  if (metrics.unverifiedOrAnomalousCheckpoints && metrics.unverifiedOrAnomalousCheckpoints > 0) {
    const anomalyDeduction = metrics.unverifiedOrAnomalousCheckpoints * 2.0;
    gpsScore = Math.max(0, gpsScore - anomalyDeduction);
  }
  const gpsConsistencyScore = Math.round(Math.max(0, Math.min(weights.gpsConsistency, gpsScore)));

  // 4. Customer Dispute Integrity (0-20 points)
  const totalCustTx = metrics.totalCustomerCashTransactions;
  const disputes = metrics.disputedCashTransactions;
  const disputeRatePct = totalCustTx > 0 ? (disputes / totalCustTx) * 100 : 0;

  let disputeScore = weights.disputeIntegrity;
  if (disputes > 0) {
    // Each dispute deducts 10 points
    disputeScore = Math.max(0, disputeScore - disputes * 10);
  }
  const disputeIntegrityScore = Math.round(Math.max(0, Math.min(weights.disputeIntegrity, disputeScore)));

  // Total Composite Trust Score (0 to 100)
  const totalScore = Math.min(
    100,
    Math.max(
      0,
      settlementPunctualityScore +
        cancellationIntegrityScore +
        gpsConsistencyScore +
        disputeIntegrityScore
    )
  );

  const narrative =
    totalScore >= 80
      ? "Exemplary partner trust profile. All reliability signals healthy."
      : totalScore >= 60
        ? "Good partner reliability. Routine settlement adherence recommended."
        : totalScore >= 40
          ? "Moderate trust score adjustment. Daily Cash Wallet set to starter baseline."
          : "Trust score adjustment active. Account switched to Prepaid-Only mode for balance sync.";

  return {
    settlementPunctualityScore,
    cancellationIntegrityScore,
    gpsConsistencyScore,
    disputeIntegrityScore,
    totalScore,
    factors: {
      onTimeSettlementPct,
      cancellationAfterCollectionPct: Math.round(cancellationAfterCollectionPct * 10) / 10,
      gpsIntegrityPct,
      disputeRatePct: Math.round(disputeRatePct * 10) / 10,
      activeOverdueHours: activeOverdue,
    },
    narrative,
  };
}

/**
 * Generates UPI Deep Link / Intent URL for instant settlement.
 */
export function generateUpiSettlementUri(params: {
  vpa?: string;
  merchantName?: string;
  amountPaise: number;
  riderId: string;
  referenceId?: string;
}): string {
  const vpa = params.vpa ?? DEFAULT_RIDER_TRUST_CONFIG.defaultUpiVpa;
  const merchant = encodeURIComponent(params.merchantName ?? DEFAULT_RIDER_TRUST_CONFIG.merchantName);
  const rupees = (params.amountPaise / 100).toFixed(2);
  const ref = params.referenceId ?? `SETTLE_${params.riderId}_${Date.now()}`;
  const note = encodeURIComponent(`OrderKing Daily Cash Settlement ${params.riderId}`);

  return `upi://pay?pa=${vpa}&pn=${merchant}&am=${rupees}&cu=INR&tn=${note}&tr=${ref}`;
}

/**
 * Generates dignified, polite, non-punitive UI messages conforming strictly
 * to the requirement:
 * - Warning at 80%: 'Quick reminder: Your daily cash limit is nearly reached. Deposit via UPI anytime to keep taking cash orders.'
 * - Hard Lock at 100%: 'Daily Cash Limit reached. Settle collected cash via UPI to unlock your next cash trip. (Prepaid trips remain open!).'
 */
export function generatePoliteNotification(params: {
  thresholdState: CashLimitThresholdState;
  remainingPaise: number;
  currentCashInHandPaise: number;
  effectiveLimitPaise: number;
  trustScore: number;
  isGracePeriodActive: boolean;
  riderId: string;
  upiVpa?: string;
}): PoliteNotification {
  const { thresholdState, remainingPaise, effectiveLimitPaise, currentCashInHandPaise, riderId, upiVpa } = params;
  const remainingRupees = Math.max(0, Math.floor(remainingPaise / 100));
  const cashInHandRupees = Math.floor(currentCashInHandPaise / 100);

  const settlementUri = generateUpiSettlementUri({
    vpa: upiVpa,
    amountPaise: currentCashInHandPaise,
    riderId,
  });

  if (thresholdState === "SAFE_HOLD_PREPAID_ONLY") {
    return {
      title: "Cash Limit Safe Hold",
      message:
        "Cash Limit Safe Hold: Your account is currently in Prepaid-Only mode. Settle collected cash via UPI to unlock your next cash trip. (Prepaid trips remain open!).",
      dignifiedStatusBadge: "Prepaid Trips Active",
      actionRequired: "Settle collected cash balance via UPI to restore cash trip availability.",
      upiDeepLink: settlementUri,
      severity: "SAFE_HOLD",
    };
  }

  if (thresholdState === "HARD_LOCK") {
    return {
      title: "Daily Cash Limit Reached",
      message:
        "Daily Cash Limit reached. Settle collected cash via UPI to unlock your next cash trip. (Prepaid trips remain open!).",
      dignifiedStatusBadge: "Prepaid Trips Open",
      actionRequired: `Quick UPI settlement of ₹${cashInHandRupees.toLocaleString("en-IN")} restores instant cash trips.`,
      upiDeepLink: settlementUri,
      severity: "SAFE_HOLD",
    };
  }

  if (thresholdState === "SOFT_WARNING") {
    return {
      title: "Quick UPI Settlement Reminder",
      message:
        "Quick reminder: Your daily cash limit is nearly reached. Deposit via UPI anytime to keep taking cash orders.",
      dignifiedStatusBadge: `₹${remainingRupees.toLocaleString("en-IN")} Remaining`,
      actionRequired: "Deposit via UPI anytime to refresh your Daily Cash Wallet capacity.",
      upiDeepLink: settlementUri,
      severity: "ADVISORY",
    };
  }

  // Normal state
  return {
    title: "Daily Cash Wallet Active",
    message: `Daily Cash Wallet Threshold: ₹${remainingRupees.toLocaleString("en-IN")} capacity available for cash orders. Keep up the great work!`,
    dignifiedStatusBadge: "Cash & Prepaid Active",
    severity: "INFO",
  };
}

/**
 * Checks whether an active founder grace period is currently running.
 */
export function isGracePeriodCurrentlyActive(override?: FounderManualOverride, now: Date = new Date()): boolean {
  if (!override?.gracePeriodUntil) return false;
  const graceDate =
    typeof override.gracePeriodUntil === "string"
      ? new Date(override.gracePeriodUntil)
      : override.gracePeriodUntil;
  return now.getTime() <= graceDate.getTime();
}

/**
 * Comprehensive Evaluation of Rider Cash Limit, Trust Score, and Threshold Status.
 */
export function evaluateRiderCashLimit(params: {
  stats: RiderHistoricalStats;
  metrics: RiderBehaviorMetrics;
  currentCashInHandPaise: number;
  override?: FounderManualOverride;
  config?: RiderTrustConfig;
  evaluationDate?: Date;
}): RiderCashLimitEvaluation {
  const config = params.config ?? DEFAULT_RIDER_TRUST_CONFIG;
  const now = params.evaluationDate ?? new Date();

  // 1. Calculate Tier
  const tierInfo = calculateRiderTier(params.stats, config);

  // 2. Calculate Trust Score (0-100)
  const scoreBreakdown = calculateTrustScore(params.metrics, config);
  const trustScore = scoreBreakdown.totalScore;

  // Check Trust Score conditions
  const isScoreDepressed = trustScore < config.trustScoreDepressedLimit && trustScore >= config.trustScoreLockLimit;
  const isPrepaidOnlyScore = trustScore < config.trustScoreLockLimit;

  // 3. Determine Base Limit and Effective Limit
  let effectiveLimitPaise = tierInfo.allocatedLimitPaise;

  // If score is depressed (40 <= score < 60), limit scales back to base limit (₹1,500)
  if (isScoreDepressed) {
    effectiveLimitPaise = config.depressedFallbackLimitPaise; // 150,000 paise
  }

  // Check founder override
  const override = params.override;
  const isGraceActive = isGracePeriodCurrentlyActive(override, now);

  if (override?.customLimitPaise !== undefined && override.customLimitPaise > 0) {
    effectiveLimitPaise = override.customLimitPaise;
  }

  // If grace period provides extra headroom
  if (isGraceActive && override?.graceHeadroomPaise && override.graceHeadroomPaise > 0) {
    effectiveLimitPaise += override.graceHeadroomPaise;
  }

  // 4. Calculate Utilization and Remaining Capacity
  const currentCashInHandPaise = Math.max(0, params.currentCashInHandPaise);
  const remainingCashCapacityPaise = Math.max(0, effectiveLimitPaise - currentCashInHandPaise);
  const utilizationPct =
    effectiveLimitPaise > 0 ? (currentCashInHandPaise / effectiveLimitPaise) * 100 : 100;

  // 5. Determine Threshold State & Permissions
  let thresholdState: CashLimitThresholdState = "NORMAL";
  let canAcceptCod = true;
  const canAcceptPrepaid = true; // Prepaid trips ALWAYS remain open!
  let isPrepaidOnlyForced = false;

  if (override?.forceCodLock) {
    thresholdState = "SAFE_HOLD_PREPAID_ONLY";
    canAcceptCod = false;
    isPrepaidOnlyForced = true;
  } else if (override?.forceCodUnlock) {
    // Founder override explicitly bypasses lock
    thresholdState = "NORMAL";
    canAcceptCod = true;
    isPrepaidOnlyForced = false;
  } else if (isPrepaidOnlyScore) {
    // Trust score < 40 forces prepaid-only
    thresholdState = "SAFE_HOLD_PREPAID_ONLY";
    canAcceptCod = false;
    isPrepaidOnlyForced = true;
  } else if (utilizationPct >= config.hardLockThresholdPct) {
    // 100% or greater hard lock
    thresholdState = "HARD_LOCK";
    canAcceptCod = false;
  } else if (utilizationPct >= config.softWarningThresholdPct) {
    // 80% to 99.9% soft warning
    thresholdState = "SOFT_WARNING";
    canAcceptCod = true;
  } else {
    thresholdState = "NORMAL";
    canAcceptCod = true;
  }

  // 6. Generate Polite Notification
  const politeNotification = generatePoliteNotification({
    thresholdState,
    remainingPaise: remainingCashCapacityPaise,
    currentCashInHandPaise,
    effectiveLimitPaise,
    trustScore,
    isGracePeriodActive: isGraceActive,
    riderId: params.stats.riderId,
    upiVpa: config.defaultUpiVpa,
  });

  // Verify notification has no forbidden words
  const validation = validatePoliteMessage(politeNotification.message);
  if (!validation.valid) {
    console.warn(`[RiderTrustEngine] Warning: forbidden word '${validation.violation}' detected in generated notification.`);
  }

  return {
    riderId: params.stats.riderId,
    tier: tierInfo.tier,
    tierDisplayName: tierInfo.displayName,
    trustScore,
    scoreBreakdown,
    isScoreDepressed,
    isPrepaidOnlyForced,
    isGracePeriodActive: isGraceActive,
    tierBaseLimitPaise: tierInfo.baseLimitPaise,
    tierMaxLimitPaise: tierInfo.maxLimitPaise,
    effectiveLimitPaise,
    currentCashInHandPaise,
    remainingCashCapacityPaise,
    utilizationPct: Math.round(utilizationPct * 10) / 10,
    canAcceptCod,
    canAcceptPrepaid,
    thresholdState,
    politeNotification,
    founderOverride: override,
    evaluatedAt: now.toISOString(),
  };
}

/**
 * Evaluates whether a rider can accept a specific dispatched order (COD or Prepaid).
 */
export function canRiderAcceptOrder(
  evaluation: RiderCashLimitEvaluation,
  order: { isCod: boolean; codAmountPaise?: number }
): CanAcceptOrderResult {
  const codAmount = order.isCod ? (order.codAmountPaise ?? 0) : 0;
  const projectedCash = evaluation.currentCashInHandPaise + codAmount;

  // 1. Prepaid Orders are ALWAYS open!
  if (!order.isCod) {
    return {
      allowed: true,
      isCod: false,
      codAmountPaise: 0,
      currentCashInHandPaise: evaluation.currentCashInHandPaise,
      projectedCashInHandPaise: evaluation.currentCashInHandPaise,
      effectiveLimitPaise: evaluation.effectiveLimitPaise,
      reason: "Prepaid orders are always available and never restricted by cash wallet limits.",
      politeMessage: "Prepaid order accepted. Safe travels on this trip!",
    };
  }

  // 2. COD Orders: Check if COD is disabled on evaluation
  if (!evaluation.canAcceptCod) {
    return {
      allowed: false,
      isCod: true,
      codAmountPaise: codAmount,
      currentCashInHandPaise: evaluation.currentCashInHandPaise,
      projectedCashInHandPaise: projectedCash,
      effectiveLimitPaise: evaluation.effectiveLimitPaise,
      reason: evaluation.politeNotification.message,
      politeMessage: evaluation.politeNotification.message,
      actionRequired: evaluation.politeNotification.actionRequired,
      upiSettlementUri: evaluation.politeNotification.upiDeepLink,
    };
  }

  // 3. COD Orders: Check if adding this order's cash would breach the effective limit
  if (projectedCash > evaluation.effectiveLimitPaise) {
    // If founder grace period is active, allow up to effective limit + grace headroom if applicable
    const excessRupees = Math.ceil((projectedCash - evaluation.effectiveLimitPaise) / 100);
    const orderRupees = Math.floor(codAmount / 100);
    const remainingRupees = Math.floor(evaluation.remainingCashCapacityPaise / 100);

    const settlementUri = generateUpiSettlementUri({
      amountPaise: evaluation.currentCashInHandPaise,
      riderId: evaluation.riderId,
    });

    return {
      allowed: false,
      isCod: true,
      codAmountPaise: codAmount,
      currentCashInHandPaise: evaluation.currentCashInHandPaise,
      projectedCashInHandPaise: projectedCash,
      effectiveLimitPaise: evaluation.effectiveLimitPaise,
      reason: `Cash order of ₹${orderRupees} exceeds remaining Daily Cash Wallet capacity of ₹${remainingRupees}.`,
      politeMessage:
        "Daily Cash Limit reached. Settle collected cash via UPI to unlock your next cash trip. (Prepaid trips remain open!).",
      actionRequired: `Quick UPI settlement of collected cash balance unlocks this order.`,
      upiSettlementUri: settlementUri,
    };
  }

  // Order allowed!
  return {
    allowed: true,
    isCod: true,
    codAmountPaise: codAmount,
    currentCashInHandPaise: evaluation.currentCashInHandPaise,
    projectedCashInHandPaise: projectedCash,
    effectiveLimitPaise: evaluation.effectiveLimitPaise,
    reason: "Order within Daily Cash Wallet Threshold capacity.",
    politeMessage: `Cash order accepted. Current capacity: ₹${Math.floor((evaluation.effectiveLimitPaise - projectedCash) / 100)} remaining after drop.`,
  };
}

// ============================================================================
// 7. RIDER TRUST ENGINE CLASS (STATEFUL UMAR OS FLEET COMPONENT)
// ============================================================================

export interface RiderTrustState {
  riderId: string;
  stats: RiderHistoricalStats;
  metrics: RiderBehaviorMetrics;
  currentCashInHandPaise: number;
  founderOverride?: FounderManualOverride;
  lastSettlementAt?: string;
  lastCollectionAt?: string;
}

export class RiderTrustEngine {
  private config: RiderTrustConfig;
  private riderStates: Map<string, RiderTrustState> = new Map();

  constructor(initialConfig?: Partial<RiderTrustConfig>) {
    this.config = initialConfig
      ? RiderTrustConfigSchema.parse({ ...DEFAULT_RIDER_TRUST_CONFIG, ...initialConfig })
      : DEFAULT_RIDER_TRUST_CONFIG;
  }

  /**
   * Returns active configuration.
   */
  public getConfig(): RiderTrustConfig {
    return this.config;
  }

  /**
   * Updates configuration dynamically at runtime (UmarOS Tunable).
   */
  public updateConfig(newConfig: Partial<RiderTrustConfig>): void {
    const mergedTiers = newConfig.tiers
      ? { ...this.config.tiers, ...newConfig.tiers }
      : this.config.tiers;
    const mergedWeights = newConfig.weights
      ? { ...this.config.weights, ...newConfig.weights }
      : this.config.weights;

    this.config = RiderTrustConfigSchema.parse({
      ...this.config,
      ...newConfig,
      tiers: mergedTiers,
      weights: mergedWeights,
    });
  }

  /**
   * Registers or updates a rider's profile state.
   */
  public registerRider(state: RiderTrustState): void {
    this.riderStates.set(state.riderId, state);
  }

  /**
   * Retrieves a rider's state or initializes default starter profile.
   */
  public getRiderState(riderId: string): RiderTrustState {
    const existing = this.riderStates.get(riderId);
    if (existing) return existing;

    const defaultState: RiderTrustState = {
      riderId,
      stats: {
        riderId,
        completedOrders: 0,
        totalSettlementsCount: 0,
        onTimeSettlementCount: 0,
        settlementDelaysCount: 0,
        disputeCount: 0,
        cancellationsAfterCollectionCount: 0,
        totalCashOrdersCount: 0,
      },
      metrics: {
        riderId,
        totalCashCollections: 0,
        onTimeSettlements: 0,
        delayedSettlements: 0,
        cashOrdersCollected: 0,
        cancellationsAfterCashCollected: 0,
        totalGpsCheckpoints: 0,
        verifiedGpsCheckpoints: 0,
        totalCustomerCashTransactions: 0,
        disputedCashTransactions: 0,
      },
      currentCashInHandPaise: 0,
    };

    this.riderStates.set(riderId, defaultState);
    return defaultState;
  }

  /**
   * Evaluates cash limit and trust score for a rider.
   */
  public evaluateRider(riderId: string, evaluationDate?: Date): RiderCashLimitEvaluation {
    const state = this.getRiderState(riderId);
    return evaluateRiderCashLimit({
      stats: state.stats,
      metrics: state.metrics,
      currentCashInHandPaise: state.currentCashInHandPaise,
      override: state.founderOverride,
      config: this.config,
      evaluationDate,
    });
  }

  /**
   * Checks if rider can accept an order.
   */
  public checkOrderAcceptance(
    riderId: string,
    order: { isCod: boolean; codAmountPaise?: number }
  ): CanAcceptOrderResult {
    const evaluation = this.evaluateRider(riderId);
    return canRiderAcceptOrder(evaluation, order);
  }

  /**
   * Records a cash collection event upon successful order drop.
   */
  public recordCashCollection(
    riderId: string,
    amountPaise: number,
    collectedAt: Date = new Date()
  ): RiderCashLimitEvaluation {
    const state = this.getRiderState(riderId);
    state.currentCashInHandPaise += amountPaise;
    state.stats.totalCashOrdersCount += 1;
    state.stats.completedOrders += 1;
    state.metrics.cashOrdersCollected += 1;
    state.metrics.totalCustomerCashTransactions += 1;
    state.lastCollectionAt = collectedAt.toISOString();

    return this.evaluateRider(riderId, collectedAt);
  }

  /**
   * Records a cash settlement event via UPI.
   */
  public recordCashSettlement(params: {
    riderId: string;
    settledAmountPaise: number;
    isOnTime: boolean; // Settled within 24 hours of collection
    settledAt?: Date;
  }): { evaluation: RiderCashLimitEvaluation; politeReceipt: string } {
    const state = this.getRiderState(params.riderId);
    const now = params.settledAt ?? new Date();

    // Reduce cash in hand
    state.currentCashInHandPaise = Math.max(0, state.currentCashInHandPaise - params.settledAmountPaise);
    state.stats.totalSettlementsCount += 1;
    state.metrics.totalCashCollections += 1;

    if (params.isOnTime) {
      state.stats.onTimeSettlementCount += 1;
      state.metrics.onTimeSettlements += 1;
    } else {
      state.stats.settlementDelaysCount += 1;
      state.metrics.delayedSettlements += 1;
    }

    state.lastSettlementAt = now.toISOString();

    const evaluation = this.evaluateRider(params.riderId, now);
    const settledRupees = Math.floor(params.settledAmountPaise / 100);

    const politeReceipt = `Quick UPI Settlement Confirmed: ₹${settledRupees.toLocaleString(
      "en-IN"
    )} received safely. Your Daily Cash Wallet capacity has been refreshed.`;

    return {
      evaluation,
      politeReceipt,
    };
  }

  /**
   * Applies a Founder Manual Override to a rider.
   */
  public setFounderOverride(riderId: string, override: FounderManualOverride): RiderCashLimitEvaluation {
    const state = this.getRiderState(riderId);
    state.founderOverride = override;
    return this.evaluateRider(riderId);
  }

  /**
   * Clears any active Founder Manual Override.
   */
  public clearFounderOverride(riderId: string): RiderCashLimitEvaluation {
    const state = this.getRiderState(riderId);
    delete state.founderOverride;
    return this.evaluateRider(riderId);
  }
}
