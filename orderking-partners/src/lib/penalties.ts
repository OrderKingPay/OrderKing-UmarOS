/**
 * Merchant Behavioral Penalty System & Operational Circuit Breaker
 * Enforces strict financial penalties and operational protections:
 * 1. Merchant-Initiated Order Cancellation: 100% order food value or ₹150–₹500 fixed tier debited from merchant ledger.
 * 2. KPT Delay Penalty: Kitchen prep exceeding promised KPT by >10 minutes charges ₹5/min (500 paise/min) delay penalty to compensate waiting rider.
 * 3. Customer Quality & Missing Item Chargebacks: 100% item value debited + ₹50 dispute handling fee when verified with proof.
 * 4. Auto-pause circuit breaker: 3 consecutive missed orders (60s ring timeout) automatically sets kitchen status to temporarily offline/busy.
 * 
 * All monetary calculations use SafeInteger paise math (100 paise = 1 INR).
 */

import { assertPaise, addPaise, subPaise, formatINR, type Paise, MoneyError } from "./money.ts";

// ============================================================================
// 1. Merchant-Initiated Order Cancellation Penalties
// ============================================================================

export const CANCELLATION_PENALTY_CONFIG = {
  /** Fixed tier 1: Low / Standard off-peak cancellation penalty: ₹150.00 (15,000 paise) */
  TIER_1_STANDARD_PAISE: 15000,
  /** Fixed tier 2: Peak / High-demand cancellation penalty: ₹300.00 (30,000 paise) */
  TIER_2_PEAK_PAISE: 30000,
  /** Fixed tier 3: Chronic / Repeated cancellation penalty: ₹500.00 (50,000 paise) */
  TIER_3_CHRONIC_PAISE: 50000,
  /** Absolute minimum fixed tier allowed: ₹150.00 */
  MIN_FIXED_TIER_PAISE: 15000,
  /** Absolute maximum fixed tier allowed: ₹500.00 */
  MAX_FIXED_TIER_PAISE: 50000,
} as const;

export type CancellationPenaltyTier = "TIER_1_STANDARD" | "TIER_2_PEAK" | "TIER_3_CHRONIC";

export type CancellationDebitMode =
  | "MAX_OF_FOOD_OR_TIER" // Higher of 100% food value or fixed tier (default production policy)
  | "FOOD_VALUE_100"      // Strictly 100% of order food value
  | "FIXED_TIER";         // Strictly the fixed tier amount (₹150 to ₹500)

export interface MerchantCancellationInput {
  orderId: string;
  restaurantId: string;
  foodValuePaise: Paise;
  tier?: CancellationPenaltyTier;
  customFixedTierPaise?: Paise;
  debitMode?: CancellationDebitMode;
  cancellationReason?: string;
  cancelledByUserId?: string;
}

export interface MerchantCancellationResult {
  orderId: string;
  restaurantId: string;
  foodValuePaise: Paise;
  fixedTierPaise: Paise;
  penaltyDebitedPaise: Paise;
  debitMode: CancellationDebitMode;
  reasonCode: "MERCHANT_CANCELLATION_PENALTY";
  description: string;
  appliedAt: string;
}

export function calculateMerchantCancellationPenalty(
  input: MerchantCancellationInput
): MerchantCancellationResult {
  const food = assertPaise(input.foodValuePaise, "foodValuePaise");
  if (food < 0) throw new MoneyError("Food value cannot be negative");

  let fixedTier: Paise;
  if (input.customFixedTierPaise !== undefined) {
    const custom = assertPaise(input.customFixedTierPaise, "customFixedTierPaise");
    if (custom < CANCELLATION_PENALTY_CONFIG.MIN_FIXED_TIER_PAISE || custom > CANCELLATION_PENALTY_CONFIG.MAX_FIXED_TIER_PAISE) {
      throw new MoneyError(
        `Fixed tier penalty must be between ${formatINR(CANCELLATION_PENALTY_CONFIG.MIN_FIXED_TIER_PAISE)} and ${formatINR(CANCELLATION_PENALTY_CONFIG.MAX_FIXED_TIER_PAISE)} (₹150 to ₹500)`
      );
    }
    fixedTier = custom;
  } else {
    switch (input.tier) {
      case "TIER_2_PEAK":
        fixedTier = CANCELLATION_PENALTY_CONFIG.TIER_2_PEAK_PAISE;
        break;
      case "TIER_3_CHRONIC":
        fixedTier = CANCELLATION_PENALTY_CONFIG.TIER_3_CHRONIC_PAISE;
        break;
      case "TIER_1_STANDARD":
      default:
        fixedTier = CANCELLATION_PENALTY_CONFIG.TIER_1_STANDARD_PAISE;
        break;
    }
  }

  const mode = input.debitMode ?? "MAX_OF_FOOD_OR_TIER";
  let penaltyPaise: Paise;
  switch (mode) {
    case "FOOD_VALUE_100":
      penaltyPaise = food;
      break;
    case "FIXED_TIER":
      penaltyPaise = fixedTier;
      break;
    case "MAX_OF_FOOD_OR_TIER":
    default:
      penaltyPaise = Math.max(food, fixedTier);
      break;
  }

  return {
    orderId: input.orderId,
    restaurantId: input.restaurantId,
    foodValuePaise: food,
    fixedTierPaise: fixedTier,
    penaltyDebitedPaise: penaltyPaise,
    debitMode: mode,
    reasonCode: "MERCHANT_CANCELLATION_PENALTY",
    description: `Merchant-initiated cancellation debit of ${formatINR(penaltyPaise)} (${mode === "MAX_OF_FOOD_OR_TIER" ? "Max of food value or tier" : mode}) on order ${input.orderId}`,
    appliedAt: new Date().toISOString(),
  };
}

// ============================================================================
// 2. Kitchen Preparation Time (KPT) Delay Penalty
// ============================================================================

export const KPT_PENALTY_CONFIG = {
  /** Maximum grace buffer beyond promised KPT before penalty accrues: 10 minutes */
  GRACE_PERIOD_MINUTES: 10,
  /** Penalty charged per minute of excess delay: ₹5.00/min (500 paise/min) */
  PENALTY_PER_MINUTE_PAISE: 500,
  /** 100% of delay penalty is routed to compensate the waiting delivery rider */
  COMPENSATION_TARGET: "WAITING_RIDER" as const,
} as const;

export interface KptDelayPenaltyInput {
  orderId: string;
  restaurantId: string;
  promisedKptMinutes: number;
  actualPrepMinutes: number;
  riderAssignedId?: string;
  customRatePerMinutePaise?: Paise;
}

export interface KptDelayPenaltyResult {
  orderId: string;
  restaurantId: string;
  promisedKptMinutes: number;
  actualPrepMinutes: number;
  delayMinutes: number;
  graceBufferMinutes: number;
  billableDelayMinutes: number;
  ratePerMinutePaise: Paise;
  penaltyDebitedPaise: Paise;
  riderCompensationPaise: Paise;
  isPenaltyApplicable: boolean;
  compensationTarget: "WAITING_RIDER";
  reasonCode: "KPT_DELAY_PENALTY";
  description: string;
  calculatedAt: string;
}

export function calculateKptDelayPenalty(input: KptDelayPenaltyInput): KptDelayPenaltyResult {
  const promised = Math.max(1, Math.round(input.promisedKptMinutes));
  const actual = Math.max(0, Math.round(input.actualPrepMinutes));
  const delayMinutes = Math.max(0, actual - promised);
  const grace = KPT_PENALTY_CONFIG.GRACE_PERIOD_MINUTES;

  const isPenaltyApplicable = delayMinutes > grace;
  const billableDelayMinutes = isPenaltyApplicable ? delayMinutes - grace : 0;
  const rate = input.customRatePerMinutePaise !== undefined
    ? assertPaise(input.customRatePerMinutePaise, "customRatePerMinutePaise")
    : KPT_PENALTY_CONFIG.PENALTY_PER_MINUTE_PAISE;

  const penaltyPaise = billableDelayMinutes * rate;
  assertPaise(penaltyPaise, "penaltyPaise");

  return {
    orderId: input.orderId,
    restaurantId: input.restaurantId,
    promisedKptMinutes: promised,
    actualPrepMinutes: actual,
    delayMinutes,
    graceBufferMinutes: grace,
    billableDelayMinutes,
    ratePerMinutePaise: rate,
    penaltyDebitedPaise: penaltyPaise,
    riderCompensationPaise: penaltyPaise, // 100% passed through to waiting rider
    isPenaltyApplicable,
    compensationTarget: "WAITING_RIDER",
    reasonCode: "KPT_DELAY_PENALTY",
    description: isPenaltyApplicable
      ? `KPT exceeded by ${delayMinutes}m (>10m grace threshold). Debited ${billableDelayMinutes}m × ${formatINR(rate)}/m = ${formatINR(penaltyPaise)} to compensate waiting rider.`
      : `KPT delay within acceptable 10m grace buffer (${delayMinutes}m delay). Zero penalty debited.`,
    calculatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// 3. Customer Quality & Missing Item Chargebacks
// ============================================================================

export const CHARGEBACK_CONFIG = {
  /** Dispute handling fee debited on verified customer quality/missing item complaints: ₹50.00 (5,000 paise) */
  DISPUTE_HANDLING_FEE_PAISE: 5000,
} as const;

export type DisputeCategory =
  | "MISSING_ITEM"
  | "WRONG_ITEM"
  | "QUALITY_SPOILED"
  | "QUALITY_FOREIGN_OBJECT"
  | "PACKAGING_SPILLAGE"
  | "INCORRECT_PORTION";

export interface CustomerDisputeChargebackInput {
  disputeId: string;
  orderId: string;
  restaurantId: string;
  category: DisputeCategory;
  itemValuePaise: Paise;
  isVerifiedWithProof: boolean;
  proofDocumentUrls?: string[];
  investigationNotes?: string;
}

export interface CustomerDisputeChargebackResult {
  disputeId: string;
  orderId: string;
  restaurantId: string;
  category: DisputeCategory;
  itemValuePaise: Paise;
  disputeHandlingFeePaise: Paise;
  totalDebitedPaise: Paise;
  isVerifiedWithProof: boolean;
  isDebited: boolean;
  reasonCode: "CUSTOMER_QUALITY_CHARGEBACK" | "MISSING_ITEM_CHARGEBACK";
  description: string;
  processedAt: string;
}

export function calculateCustomerDisputeChargeback(
  input: CustomerDisputeChargebackInput
): CustomerDisputeChargebackResult {
  const itemValue = assertPaise(input.itemValuePaise, "itemValuePaise");
  if (itemValue < 0) throw new MoneyError("Item value cannot be negative");

  const reasonCode = input.category === "MISSING_ITEM"
    ? "MISSING_ITEM_CHARGEBACK"
    : "CUSTOMER_QUALITY_CHARGEBACK";

  if (!input.isVerifiedWithProof) {
    return {
      disputeId: input.disputeId,
      orderId: input.orderId,
      restaurantId: input.restaurantId,
      category: input.category,
      itemValuePaise: itemValue,
      disputeHandlingFeePaise: 0,
      totalDebitedPaise: 0,
      isVerifiedWithProof: false,
      isDebited: false,
      reasonCode,
      description: `Dispute ${input.disputeId} pending verification. No ledger debit applied without verified photographic proof.`,
      processedAt: new Date().toISOString(),
    };
  }

  const handlingFee = CHARGEBACK_CONFIG.DISPUTE_HANDLING_FEE_PAISE;
  const totalDebited = addPaise(itemValue, handlingFee);

  return {
    disputeId: input.disputeId,
    orderId: input.orderId,
    restaurantId: input.restaurantId,
    category: input.category,
    itemValuePaise: itemValue,
    disputeHandlingFeePaise: handlingFee,
    totalDebitedPaise: totalDebited,
    isVerifiedWithProof: true,
    isDebited: true,
    reasonCode,
    description: `Verified ${input.category.toLowerCase().replace(/_/g, " ")} complaint with proof. Debited 100% item value (${formatINR(itemValue)}) + ₹50 dispute handling fee (${formatINR(handlingFee)}) = ${formatINR(totalDebited)}.`,
    processedAt: new Date().toISOString(),
  };
}

// ============================================================================
// 4. Auto-Pause Circuit Breaker (Missed Orders & Ring Timeout)
// ============================================================================

export const CIRCUIT_BREAKER_CONFIG = {
  /** Ring timeout before an incoming order is marked as missed: 60 seconds */
  RING_TIMEOUT_SECONDS: 60,
  /** Consecutive missed orders before kitchen circuit breaker triggers: 3 orders */
  CONSECUTIVE_MISSED_THRESHOLD: 3,
  /** Status set when circuit breaker triggers */
  TRIGGERED_STATUS: "TEMPORARILY_OFFLINE_BUSY" as const,
} as const;

export interface MissedOrderEvent {
  orderId: string;
  missedAt: string;
  timeoutSeconds: number;
}

export interface KitchenCircuitBreakerState {
  restaurantId: string;
  consecutiveMissedCount: number;
  isCircuitBroken: boolean;
  circuitBrokenAt: string | null;
  kitchenStatus: "ONLINE" | "TEMPORARILY_OFFLINE_BUSY";
  history: MissedOrderEvent[];
  lastResetAt: string | null;
}

/**
 * State container for in-memory and distributed kitchen circuit breakers.
 * Prevents operational cascading failures when kitchen staff is unresponsive.
 */
export class KitchenCircuitBreakerManager {
  private states = new Map<string, KitchenCircuitBreakerState>();

  private getState(restaurantId: string): KitchenCircuitBreakerState {
    let state = this.states.get(restaurantId);
    if (!state) {
      state = {
        restaurantId,
        consecutiveMissedCount: 0,
        isCircuitBroken: false,
        circuitBrokenAt: null,
        kitchenStatus: "ONLINE",
        history: [],
        lastResetAt: new Date().toISOString(),
      };
      this.states.set(restaurantId, state);
    }
    return state;
  }

  /**
   * Registers a missed order event (60s ring timeout).
   * Automatically trips circuit breaker and sets kitchen to temporarily offline/busy on 3rd consecutive missed order.
   */
  public registerMissedOrder(
    restaurantId: string,
    orderId: string,
    timeoutSeconds: number = CIRCUIT_BREAKER_CONFIG.RING_TIMEOUT_SECONDS
  ): {
    state: KitchenCircuitBreakerState;
    circuitTripped: boolean;
    alertMessage: string | null;
  } {
    const state = this.getState(restaurantId);
    state.consecutiveMissedCount += 1;
    state.history.push({
      orderId,
      missedAt: new Date().toISOString(),
      timeoutSeconds,
    });

    let circuitTripped = false;
    let alertMessage: string | null = null;

    if (state.consecutiveMissedCount >= CIRCUIT_BREAKER_CONFIG.CONSECUTIVE_MISSED_THRESHOLD) {
      state.isCircuitBroken = true;
      state.kitchenStatus = CIRCUIT_BREAKER_CONFIG.TRIGGERED_STATUS;
      state.circuitBrokenAt = new Date().toISOString();
      circuitTripped = true;
      alertMessage = `CIRCUIT BREAKER TRIGGERED: Kitchen automatically set to TEMPORARILY OFFLINE/BUSY after ${state.consecutiveMissedCount} consecutive missed orders (${timeoutSeconds}s ring timeout). Immediate partner attention required.`;
    }

    return { state, circuitTripped, alertMessage };
  }

  /**
   * Resets the circuit breaker when the merchant accepts an incoming order or acknowledges alert.
   */
  public recordOrderAccepted(restaurantId: string): KitchenCircuitBreakerState {
    const state = this.getState(restaurantId);
    state.consecutiveMissedCount = 0;
    state.lastResetAt = new Date().toISOString();
    return state;
  }

  /**
   * Merchant or admin explicitly resumes kitchen operations.
   */
  public resumeKitchen(restaurantId: string): KitchenCircuitBreakerState {
    const state = this.getState(restaurantId);
    state.consecutiveMissedCount = 0;
    state.isCircuitBroken = false;
    state.circuitBrokenAt = null;
    state.kitchenStatus = "ONLINE";
    state.lastResetAt = new Date().toISOString();
    return state;
  }

  /**
   * Gets current circuit breaker state for a restaurant.
   */
  public getStatus(restaurantId: string): KitchenCircuitBreakerState {
    return this.getState(restaurantId);
  }

  /**
   * Clears all states (used in test isolation).
   */
  public resetAll(): void {
    this.states.clear();
  }
}

/** Global singleton instance */
export const kitchenCircuitBreaker = new KitchenCircuitBreakerManager();
