/**
 * OrderKing Core - Supreme Rider Wallet, Accounting & Onboarding Economics Engine
 * Authority: Supreme Rider Wallet, Accounting & Onboarding Economics Specialist
 * Model: Tier-1 Operational Parity (Indian Hyper-Local Micro-Ledger Mechanics)
 *
 * Mathematical Foundations:
 * 1. Integer Paise Precision:
 *    - All monetary calculations are performed strictly in integer Paise (1 INR = 100 Paise).
 *    - Zero IEEE 754 floating-point drift, zero rounding loss, 100% balanced ledger invariant.
 *
 * 2. Dual-Pocket Settlement & Netting Mechanics:
 *    - Prepaid Orders:
 *      * Cash collected from customer = 0.
 *      * Rider delivery payout credited directly to Withdrawable Earnings wallet (+payoutPaise).
 *    - COD (Cash on Delivery) Orders & Instant Netting:
 *      * Customer hands physical cash to rider = orderCashPaise.
 *      * Rider earns delivery payout = payoutPaise.
 *      * Gross physical floating cash received = +orderCashPaise.
 *      * Net Deposit Due to Platform:
 *        Net Deposit Due = max(0, orderCashPaise - payoutPaise - existingWithdrawableWalletPaise)
 *      * Earnings Offset:
 *        Offset Applied = min(orderCashPaise, payoutPaise + existingWithdrawableWalletPaise)
 *        New Withdrawable Earnings = (existingWithdrawableWalletPaise + payoutPaise) - Offset Applied
 *      * Total rider net wealth gain = EXACTLY payoutPaise in all mathematical branches.
 *
 * 3. Onboarding Kit & Advance Deduction Engine:
 *    - Modes:
 *      1) 'ZERO_UPFRONT': Rider starts with ₹0 advance. Kit fee (e.g. ₹1,200) is deducted in daily micro-installments (e.g. ₹50/day) from earnings.
 *      2) 'UPFRONT_PAID': Paid upfront at onboarding (₹0 remaining kit liability).
 *      3) 'FOUNDER_NEGOTIATED_WAIVER': Founder waives full or partial kit fee for strategic fleet acquisition.
 *    - Automated 'PREPAID_FIRST' Safety Flag:
 *      * Locks new/unvetted riders to Prepaid orders only until trust threshold (e.g. 10 completed orders or kit paid) is met.
 *
 * 4. Early Payout / Instant Cashout Engine:
 *    - Instant earnings withdrawal before standard weekly payout cycle.
 *    - Platform levies a flat convenience fee (e.g. ₹10.00 / 1,000 paise).
 *    - Net rider disbursement = requestedPaise - convenienceFeePaise.
 *    - Founder platform revenue = +convenienceFeePaise.
 */

import { z } from "zod";

// ============================================================================
// 1. CONFIGURATION SCHEMAS & DEFAULTS
// ============================================================================

export type OnboardingMode = "ZERO_UPFRONT" | "UPFRONT_PAID" | "FOUNDER_NEGOTIATED_WAIVER";

export const OnboardingKitConfigSchema = z.object({
  kitMode: z.enum(["ZERO_UPFRONT", "UPFRONT_PAID", "FOUNDER_NEGOTIATED_WAIVER"]).default("ZERO_UPFRONT"),
  totalKitFeePaise: z.number().int().nonnegative().default(120000), // Default ₹1,200.00 kit cost (Bag + 2 T-shirts + Raincoat)
  waivedFeePaise: z.number().int().nonnegative().default(0), // Waived amount in FOUNDER_NEGOTIATED_WAIVER mode
  upfrontPaidPaise: z.number().int().nonnegative().default(0), // Upfront paid amount in UPFRONT_PAID mode
  dailyInstallmentPaise: z.number().int().positive().default(5000), // ₹50.00 / day default deduction
  minOrdersBeforeCodUnlock: z.number().int().nonnegative().default(10), // 10 prepaid orders threshold to unlock COD
  minKitRepaidPctBeforeCodUnlock: z.number().min(0).max(100).default(0), // Optional kit repayment % threshold
});

export type OnboardingKitConfig = z.infer<typeof OnboardingKitConfigSchema>;

export const EarlyPayoutConfigSchema = z.object({
  enabled: z.boolean().default(true),
  flatFeePaise: z.number().int().nonnegative().default(1000), // Flat ₹10.00 convenience fee
  percentageFeeBasisPoints: z.number().int().nonnegative().default(0), // Optional variable fee (e.g. 100 bps = 1%)
  minCashoutAmountPaise: z.number().int().positive().default(10000), // Minimum cashout ₹100.00
  maxDailyCashouts: z.number().int().positive().default(3), // Max 3 instant withdrawals per calendar day
});

export type EarlyPayoutConfig = z.infer<typeof EarlyPayoutConfigSchema>;

export const RiderCodLimitsConfigSchema = z.object({
  cashInHandLimitPaise: z.number().int().positive().default(150000), // ₹1,500.00 hard lock threshold
  softWarningLimitPaise: z.number().int().positive().default(120000), // ₹1,200.00 (80%) soft warning threshold
  upiVpaPayee: z.string().default("orderking.fleet@axisbank"),
  merchantName: z.string().default("OrderKing Rider Cash Settlement"),
});

export type RiderCodLimitsConfig = z.infer<typeof RiderCodLimitsConfigSchema>;

export const ZomatoRiderWalletConfigSchema = z.object({
  onboarding: OnboardingKitConfigSchema.default({} as any),
  earlyPayout: EarlyPayoutConfigSchema.default({} as any),
  codLimits: RiderCodLimitsConfigSchema.default({} as any),
});

export type ZomatoRiderWalletConfig = z.infer<typeof ZomatoRiderWalletConfigSchema>;

export const DEFAULT_RIDER_WALLET_CONFIG: ZomatoRiderWalletConfig = {
  onboarding: {
    kitMode: "ZERO_UPFRONT",
    totalKitFeePaise: 120000, // ₹1,200
    waivedFeePaise: 0,
    upfrontPaidPaise: 0,
    dailyInstallmentPaise: 5000, // ₹50
    minOrdersBeforeCodUnlock: 10,
    minKitRepaidPctBeforeCodUnlock: 0,
  },
  earlyPayout: {
    enabled: true,
    flatFeePaise: 1000, // ₹10
    percentageFeeBasisPoints: 0,
    minCashoutAmountPaise: 10000, // ₹100
    maxDailyCashouts: 3,
  },
  codLimits: {
    cashInHandLimitPaise: 150000, // ₹1,500
    softWarningLimitPaise: 120000, // ₹1,200
    upiVpaPayee: "orderking.fleet@axisbank",
    merchantName: "OrderKing Rider Cash Settlement",
  },
};

// ============================================================================
// 2. LEDGER SCHEMAS & DATA STRUCTURES
// ============================================================================

export type LedgerAccount =
  | "WITHDRAWABLE_EARNINGS"
  | "FLOATING_CASH_LIABILITY"
  | "KIT_RECEIVABLE"
  | "PLATFORM_REVENUE";

export type LedgerEntryType =
  | "ORDER_PAYOUT_PREPAID"
  | "ORDER_COD_COLLECTION"
  | "ORDER_COD_NETTING_OFFSET"
  | "COD_CASH_DEPOSIT_UPI"
  | "KIT_INSTALLMENT_DEDUCTION"
  | "KIT_UPFRONT_PAYMENT"
  | "KIT_FOUNDER_WAIVER"
  | "EARLY_CASHOUT_WITHDRAWAL"
  | "EARLY_CASHOUT_FEE_PLATFORM"
  | "WEEKLY_PAYOUT_DISBURSEMENT"
  | "MANUAL_CREDIT_ADJUSTMENT"
  | "MANUAL_DEBIT_ADJUSTMENT";

export interface LedgerEntry {
  id: string;
  riderId: string;
  timestamp: string;
  type: LedgerEntryType;
  orderId?: string;
  debitPaise: number;
  creditPaise: number;
  account: LedgerAccount;
  resultingBalancePaise: number;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface RiderOnboardingState {
  mode: OnboardingMode;
  totalKitFeePaise: number;
  waivedFeePaise: number;
  upfrontPaidPaise: number;
  totalRepaidPaise: number;
  remainingKitLiabilityPaise: number;
  dailyInstallmentPaise: number;
  minOrdersBeforeCodUnlock: number;
  minKitRepaidPctBeforeCodUnlock: number;
  isKitFullyPaid: boolean;
}

export interface RiderWalletState {
  riderId: string;
  withdrawableEarningsPaise: number; // Positive balance available for withdrawal / offset
  floatingCashPaise: number; // Net cash-in-hand liability owed to platform
  lifetimeEarningsPaise: number;
  lifetimeCashCollectedPaise: number;
  lifetimeCashDepositedPaise: number;
  lifetimeInstantCashoutsPaise: number;
  lifetimeConvenienceFeesPaidPaise: number;
  completedDeliveriesCount: number;
  completedPrepaidCount: number;
  completedCodCount: number;
  isPrepaidFirstLocked: boolean; // True when restricted to prepaid orders only
  prepaidFirstUnlockReason?: string;
  isCodLockedDueToLimit: boolean; // True when floatingCashPaise >= cashInHandLimitPaise
  onboarding: RiderOnboardingState;
  dailyCashoutCount: number;
  lastCashoutDate?: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 3. PURE DETERMINISTIC MATHEMATICAL EQUATIONS
// ============================================================================

/**
 * COD Instant Netting Equation:
 * Calculates the exact net deposit due to the platform for a COD order.
 *
 * Formula:
 * Net Deposit Due = max(0, orderCashPaise - payoutPaise - existingWithdrawableWalletPaise)
 */
export function calculateNetDepositDue(
  orderCashPaise: number,
  payoutPaise: number,
  existingWithdrawableWalletPaise: number
): number {
  if (orderCashPaise < 0 || payoutPaise < 0 || existingWithdrawableWalletPaise < 0) {
    throw new Error("Mathematical arguments for net deposit due must be non-negative integers");
  }
  const netDue = orderCashPaise - payoutPaise - existingWithdrawableWalletPaise;
  return Math.max(0, netDue);
}

/**
 * COD Netting Balances Engine:
 * Deterministically computes the full balance transitions and offset breakdown
 * for an incoming COD order.
 *
 * Mathematical Invariant:
 * Rider Net Gain = payoutPaise (Exact to the single Paise, 0 rounding error).
 */
export interface CodNettingCalculation {
  orderCashPaise: number;
  payoutPaise: number;
  existingWithdrawableWalletPaise: number;
  existingFloatingCashPaise: number;
  totalAvailableEarningsPaise: number; // existingWithdrawableWalletPaise + payoutPaise
  offsetAppliedPaise: number; // Amount of earnings instantly offset against customer cash
  netDepositDueToPlatformPaise: number; // max(0, orderCash - payout - existing)
  newWithdrawableEarningsPaise: number;
  newFloatingCashPaise: number;
  floatingCashAddedPaise: number; // Net addition to floating cash liability
  isAbsorbedEntirelyByEarnings: boolean;
}

export function calculateCodNettingBalances(params: {
  orderCashPaise: number;
  payoutPaise: number;
  existingWithdrawableWalletPaise: number;
  existingFloatingCashPaise: number;
}): CodNettingCalculation {
  const {
    orderCashPaise,
    payoutPaise,
    existingWithdrawableWalletPaise,
    existingFloatingCashPaise,
  } = params;

  if (
    orderCashPaise < 0 ||
    payoutPaise < 0 ||
    existingWithdrawableWalletPaise < 0 ||
    existingFloatingCashPaise < 0
  ) {
    throw new Error("All balance arguments must be non-negative integer paise");
  }

  const totalAvailableEarningsPaise = existingWithdrawableWalletPaise + payoutPaise;
  const netDepositDueToPlatformPaise = Math.max(0, orderCashPaise - totalAvailableEarningsPaise);

  // Offset applied from earnings against the collected cash
  const offsetAppliedPaise = Math.min(orderCashPaise, totalAvailableEarningsPaise);

  // Remaining withdrawable earnings after offsetting cash
  const newWithdrawableEarningsPaise = totalAvailableEarningsPaise - offsetAppliedPaise;

  // Net floating cash added to rider's liability to platform
  const floatingCashAddedPaise = netDepositDueToPlatformPaise;
  const newFloatingCashPaise = existingFloatingCashPaise + floatingCashAddedPaise;

  const isAbsorbedEntirelyByEarnings = netDepositDueToPlatformPaise === 0;

  return {
    orderCashPaise,
    payoutPaise,
    existingWithdrawableWalletPaise,
    existingFloatingCashPaise,
    totalAvailableEarningsPaise,
    offsetAppliedPaise,
    netDepositDueToPlatformPaise,
    newWithdrawableEarningsPaise,
    newFloatingCashPaise,
    floatingCashAddedPaise,
    isAbsorbedEntirelyByEarnings,
  };
}

/**
 * Early Payout / Instant Cashout Equation:
 * Calculates net rider payout after convenience fee and platform revenue.
 *
 * Formula:
 * Convenience Fee = flatFeePaise + round((requestedPaise * percentageFeeBasisPoints) / 10000)
 * Net Rider Payout = requestedPaise - Convenience Fee
 * Platform Revenue = Convenience Fee
 */
export interface EarlyPayoutCalculation {
  requestedPaise: number;
  flatFeePaise: number;
  percentageFeePaise: number;
  convenienceFeePaise: number;
  netRiderDisbursedPaise: number;
  platformRevenuePaise: number;
  isAllowed: boolean;
  rejectReason?: string;
}

export function calculateEarlyPayoutNetting(
  requestedPaise: number,
  walletWithdrawablePaise: number,
  config: EarlyPayoutConfig = DEFAULT_RIDER_WALLET_CONFIG.earlyPayout
): EarlyPayoutCalculation {
  if (requestedPaise <= 0) {
    return {
      requestedPaise,
      flatFeePaise: config.flatFeePaise,
      percentageFeePaise: 0,
      convenienceFeePaise: 0,
      netRiderDisbursedPaise: 0,
      platformRevenuePaise: 0,
      isAllowed: false,
      rejectReason: "Requested cashout amount must be greater than zero",
    };
  }

  if (requestedPaise < config.minCashoutAmountPaise) {
    return {
      requestedPaise,
      flatFeePaise: config.flatFeePaise,
      percentageFeePaise: 0,
      convenienceFeePaise: 0,
      netRiderDisbursedPaise: 0,
      platformRevenuePaise: 0,
      isAllowed: false,
      rejectReason: `Requested amount ₹${(requestedPaise / 100).toFixed(2)} is below minimum cashout threshold ₹${(config.minCashoutAmountPaise / 100).toFixed(2)}`,
    };
  }

  if (requestedPaise > walletWithdrawablePaise) {
    return {
      requestedPaise,
      flatFeePaise: config.flatFeePaise,
      percentageFeePaise: 0,
      convenienceFeePaise: 0,
      netRiderDisbursedPaise: 0,
      platformRevenuePaise: 0,
      isAllowed: false,
      rejectReason: `Insufficient withdrawable earnings balance (Available: ₹${(walletWithdrawablePaise / 100).toFixed(2)}, Requested: ₹${(requestedPaise / 100).toFixed(2)})`,
    };
  }

  const percentageFeePaise = Math.round(
    (requestedPaise * config.percentageFeeBasisPoints) / 10000
  );
  const convenienceFeePaise = config.flatFeePaise + percentageFeePaise;

  if (convenienceFeePaise >= requestedPaise) {
    return {
      requestedPaise,
      flatFeePaise: config.flatFeePaise,
      percentageFeePaise,
      convenienceFeePaise,
      netRiderDisbursedPaise: 0,
      platformRevenuePaise: convenienceFeePaise,
      isAllowed: false,
      rejectReason: `Convenience fee (₹${(convenienceFeePaise / 100).toFixed(2)}) equals or exceeds requested cashout (₹${(requestedPaise / 100).toFixed(2)})`,
    };
  }

  const netRiderDisbursedPaise = requestedPaise - convenienceFeePaise;

  return {
    requestedPaise,
    flatFeePaise: config.flatFeePaise,
    percentageFeePaise,
    convenienceFeePaise,
    netRiderDisbursedPaise,
    platformRevenuePaise: convenienceFeePaise,
    isAllowed: true,
  };
}

/**
 * Onboarding Kit Micro-Installment Deduction Equation:
 * Calculates micro-deduction amount from daily withdrawable earnings.
 */
export interface KitInstallmentCalculation {
  remainingKitLiabilityPaise: number;
  availableWithdrawablePaise: number;
  standardInstallmentPaise: number;
  actualDeductionPaise: number;
  newRemainingLiabilityPaise: number;
  newWithdrawablePaise: number;
  isKitFullyPaidAfter: boolean;
}

export function calculateKitInstallmentDeduction(params: {
  remainingKitLiabilityPaise: number;
  availableWithdrawablePaise: number;
  standardInstallmentPaise: number;
  allowPartial?: boolean;
}): KitInstallmentCalculation {
  const {
    remainingKitLiabilityPaise,
    availableWithdrawablePaise,
    standardInstallmentPaise,
    allowPartial = true,
  } = params;

  if (remainingKitLiabilityPaise <= 0) {
    return {
      remainingKitLiabilityPaise: 0,
      availableWithdrawablePaise,
      standardInstallmentPaise,
      actualDeductionPaise: 0,
      newRemainingLiabilityPaise: 0,
      newWithdrawablePaise: availableWithdrawablePaise,
      isKitFullyPaidAfter: true,
    };
  }

  const desiredDeduction = Math.min(remainingKitLiabilityPaise, standardInstallmentPaise);

  let actualDeductionPaise = 0;
  if (availableWithdrawablePaise >= desiredDeduction) {
    actualDeductionPaise = desiredDeduction;
  } else if (allowPartial && availableWithdrawablePaise > 0) {
    actualDeductionPaise = availableWithdrawablePaise;
  } else {
    actualDeductionPaise = 0;
  }

  const newRemainingLiabilityPaise = remainingKitLiabilityPaise - actualDeductionPaise;
  const newWithdrawablePaise = availableWithdrawablePaise - actualDeductionPaise;
  const isKitFullyPaidAfter = newRemainingLiabilityPaise === 0;

  return {
    remainingKitLiabilityPaise,
    availableWithdrawablePaise,
    standardInstallmentPaise,
    actualDeductionPaise,
    newRemainingLiabilityPaise,
    newWithdrawablePaise,
    isKitFullyPaidAfter,
  };
}

/**
 * PREPAID_FIRST Lock Evaluation:
 * Determines if a new rider is restricted to prepaid deliveries or has met
 * the trust and onboarding milestone required to unlock COD orders.
 */
export function evaluatePrepaidFirstStatus(params: {
  mode: OnboardingMode;
  completedDeliveriesCount: number;
  remainingKitLiabilityPaise: number;
  totalKitFeePaise: number;
  minOrdersBeforeCodUnlock: number;
  minKitRepaidPctBeforeCodUnlock: number;
}): { isLocked: boolean; reason: string } {
  const {
    mode,
    completedDeliveriesCount,
    remainingKitLiabilityPaise,
    totalKitFeePaise,
    minOrdersBeforeCodUnlock,
    minKitRepaidPctBeforeCodUnlock,
  } = params;

  // Upfront paid riders have cleared financial trust upfront
  if (mode === "UPFRONT_PAID") {
    return {
      isLocked: false,
      reason: "UPFRONT_PAID mode: Kit fee settled upfront; COD enabled immediately",
    };
  }

  // Founder waiver overrides financial hurdle
  if (mode === "FOUNDER_NEGOTIATED_WAIVER" && remainingKitLiabilityPaise === 0) {
    return {
      isLocked: false,
      reason: "FOUNDER_NEGOTIATED_WAIVER mode: Kit fee 100% waived; COD enabled",
    };
  }

  // Zero-upfront or partial liability: Check completed delivery milestones
  if (completedDeliveriesCount < minOrdersBeforeCodUnlock) {
    return {
      isLocked: true,
      reason: `PREPAID_FIRST active: Completed ${completedDeliveriesCount}/${minOrdersBeforeCodUnlock} prepaid deliveries required for COD authorization`,
    };
  }

  // Check optional repayment % requirement
  if (minKitRepaidPctBeforeCodUnlock > 0 && totalKitFeePaise > 0) {
    const repaidPaise = totalKitFeePaise - remainingKitLiabilityPaise;
    const repaidPct = Math.floor((repaidPaise * 100) / totalKitFeePaise);
    if (repaidPct < minKitRepaidPctBeforeCodUnlock) {
      return {
        isLocked: true,
        reason: `PREPAID_FIRST active: Kit repayment at ${repaidPct}% (Threshold: ${minKitRepaidPctBeforeCodUnlock}%)`,
      };
    }
  }

  return {
    isLocked: false,
    reason: `Trust threshold satisfied: ${completedDeliveriesCount} completed deliveries; COD unlocked`,
  };
}

// ============================================================================
// 4. WALLET LIFECYCLE & TRANSACTION ENGINES
// ============================================================================

export function createInitialRiderWallet(
  riderId: string,
  options: Partial<OnboardingKitConfig> = {}
): { state: RiderWalletState; initialEntries: LedgerEntry[] } {
  const cfg = OnboardingKitConfigSchema.parse(options);
  const now = new Date().toISOString();

  let waivedFeePaise = 0;
  let upfrontPaidPaise = 0;
  let remainingKitLiabilityPaise = cfg.totalKitFeePaise;
  let isKitFullyPaid = false;

  const initialEntries: LedgerEntry[] = [];

  if (cfg.kitMode === "UPFRONT_PAID") {
    upfrontPaidPaise = cfg.totalKitFeePaise;
    remainingKitLiabilityPaise = 0;
    isKitFullyPaid = true;

    initialEntries.push({
      id: `led_${riderId}_upfront_init`,
      riderId,
      timestamp: now,
      type: "KIT_UPFRONT_PAYMENT",
      debitPaise: 0,
      creditPaise: upfrontPaidPaise,
      account: "KIT_RECEIVABLE",
      resultingBalancePaise: 0,
      description: `Rider paid onboarding kit fee ₹${(upfrontPaidPaise / 100).toFixed(2)} upfront`,
      metadata: { kitMode: cfg.kitMode },
    });
  } else if (cfg.kitMode === "FOUNDER_NEGOTIATED_WAIVER") {
    waivedFeePaise = cfg.waivedFeePaise > 0 ? cfg.waivedFeePaise : cfg.totalKitFeePaise;
    remainingKitLiabilityPaise = Math.max(0, cfg.totalKitFeePaise - waivedFeePaise);
    isKitFullyPaid = remainingKitLiabilityPaise === 0;

    initialEntries.push({
      id: `led_${riderId}_waiver_init`,
      riderId,
      timestamp: now,
      type: "KIT_FOUNDER_WAIVER",
      debitPaise: 0,
      creditPaise: waivedFeePaise,
      account: "KIT_RECEIVABLE",
      resultingBalancePaise: remainingKitLiabilityPaise,
      description: `Founder granted ₹${(waivedFeePaise / 100).toFixed(2)} kit fee waiver`,
      metadata: { kitMode: cfg.kitMode, waivedFeePaise },
    });
  } else {
    // ZERO_UPFRONT: Rider starts with ₹0 advance. Kit fee liability recorded.
    initialEntries.push({
      id: `led_${riderId}_kit_liability_init`,
      riderId,
      timestamp: now,
      type: "MANUAL_DEBIT_ADJUSTMENT",
      debitPaise: cfg.totalKitFeePaise,
      creditPaise: 0,
      account: "KIT_RECEIVABLE",
      resultingBalancePaise: cfg.totalKitFeePaise,
      description: `Onboarding kit issued on ZERO_UPFRONT terms. Total liability ₹${(cfg.totalKitFeePaise / 100).toFixed(2)}`,
      metadata: { dailyInstallmentPaise: cfg.dailyInstallmentPaise },
    });
  }

  const { isLocked, reason } = evaluatePrepaidFirstStatus({
    mode: cfg.kitMode,
    completedDeliveriesCount: 0,
    remainingKitLiabilityPaise,
    totalKitFeePaise: cfg.totalKitFeePaise,
    minOrdersBeforeCodUnlock: cfg.minOrdersBeforeCodUnlock,
    minKitRepaidPctBeforeCodUnlock: cfg.minKitRepaidPctBeforeCodUnlock,
  });

  const state: RiderWalletState = {
    riderId,
    withdrawableEarningsPaise: 0,
    floatingCashPaise: 0,
    lifetimeEarningsPaise: 0,
    lifetimeCashCollectedPaise: 0,
    lifetimeCashDepositedPaise: 0,
    lifetimeInstantCashoutsPaise: 0,
    lifetimeConvenienceFeesPaidPaise: 0,
    completedDeliveriesCount: 0,
    completedPrepaidCount: 0,
    completedCodCount: 0,
    isPrepaidFirstLocked: isLocked,
    prepaidFirstUnlockReason: reason,
    isCodLockedDueToLimit: false,
    onboarding: {
      mode: cfg.kitMode,
      totalKitFeePaise: cfg.totalKitFeePaise,
      waivedFeePaise,
      upfrontPaidPaise,
      totalRepaidPaise: upfrontPaidPaise,
      remainingKitLiabilityPaise,
      dailyInstallmentPaise: cfg.dailyInstallmentPaise,
      minOrdersBeforeCodUnlock: cfg.minOrdersBeforeCodUnlock,
      minKitRepaidPctBeforeCodUnlock: cfg.minKitRepaidPctBeforeCodUnlock,
      isKitFullyPaid,
    },
    dailyCashoutCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  return { state, initialEntries };
}

/**
 * Process Prepaid Order Settlement:
 * Cash collected from customer = 0.
 * Rider payout credited directly to withdrawable earnings wallet (+payoutPaise).
 */
export interface PrepaidSettlementResult {
  updatedWallet: RiderWalletState;
  ledgerEntries: LedgerEntry[];
  unlockedCodThisOrder: boolean;
}

export function processPrepaidOrderSettlement(params: {
  wallet: RiderWalletState;
  orderId: string;
  payoutPaise: number;
  config?: OnboardingKitConfig;
  timestamp?: string;
}): PrepaidSettlementResult {
  const { wallet, orderId, payoutPaise, timestamp } = params;
  const cfg = params.config ?? DEFAULT_RIDER_WALLET_CONFIG.onboarding;
  const now = timestamp ?? new Date().toISOString();

  if (payoutPaise < 0) {
    throw new Error("Payout paise cannot be negative");
  }

  const newWithdrawable = wallet.withdrawableEarningsPaise + payoutPaise;
  const newLifetimeEarnings = wallet.lifetimeEarningsPaise + payoutPaise;
  const newCompletedCount = wallet.completedDeliveriesCount + 1;
  const newPrepaidCount = wallet.completedPrepaidCount + 1;

  const minOrders =
    wallet.onboarding.minOrdersBeforeCodUnlock ??
    cfg.minOrdersBeforeCodUnlock;
  const minKitRepaidPct =
    wallet.onboarding.minKitRepaidPctBeforeCodUnlock ??
    cfg.minKitRepaidPctBeforeCodUnlock;

  // Check PREPAID_FIRST auto-unlock
  const { isLocked: stillLocked, reason } = evaluatePrepaidFirstStatus({
    mode: wallet.onboarding.mode,
    completedDeliveriesCount: newCompletedCount,
    remainingKitLiabilityPaise: wallet.onboarding.remainingKitLiabilityPaise,
    totalKitFeePaise: wallet.onboarding.totalKitFeePaise,
    minOrdersBeforeCodUnlock: minOrders,
    minKitRepaidPctBeforeCodUnlock: minKitRepaidPct,
  });

  const unlockedCodThisOrder = wallet.isPrepaidFirstLocked && !stillLocked;

  const entry: LedgerEntry = {
    id: `led_${wallet.riderId}_ord_${orderId}_prepaid`,
    riderId: wallet.riderId,
    timestamp: now,
    type: "ORDER_PAYOUT_PREPAID",
    orderId,
    debitPaise: 0,
    creditPaise: payoutPaise,
    account: "WITHDRAWABLE_EARNINGS",
    resultingBalancePaise: newWithdrawable,
    description: `Prepaid order ${orderId} delivered. Payout ₹${(payoutPaise / 100).toFixed(2)} credited to earnings.`,
    metadata: {
      orderId,
      orderType: "PREPAID",
      customerCashCollectedPaise: 0,
    },
  };

  const updatedWallet: RiderWalletState = {
    ...wallet,
    withdrawableEarningsPaise: newWithdrawable,
    lifetimeEarningsPaise: newLifetimeEarnings,
    completedDeliveriesCount: newCompletedCount,
    completedPrepaidCount: newPrepaidCount,
    isPrepaidFirstLocked: stillLocked,
    prepaidFirstUnlockReason: reason,
    updatedAt: now,
  };

  return {
    updatedWallet,
    ledgerEntries: [entry],
    unlockedCodThisOrder,
  };
}

/**
 * Process COD Order Accounting & Netting Mechanics:
 * - Customer pays Cash to Rider = orderCashPaise.
 * - Rider earns payout = payoutPaise.
 * - Platform instantly offsets delivery payout against collected cash:
 *   Net Deposit Due = max(0, orderCashPaise - payoutPaise - existingWithdrawableWalletPaise).
 * - Exact paise calculation: Zero rounding errors, 100% balanced ledger.
 */
export interface CodSettlementResult {
  updatedWallet: RiderWalletState;
  ledgerEntries: LedgerEntry[];
  netting: CodNettingCalculation;
  isCodLimitBreached: boolean;
  isSoftWarningActive: boolean;
}

export function processCodOrderSettlement(params: {
  wallet: RiderWalletState;
  orderId: string;
  orderCashPaise: number;
  payoutPaise: number;
  codLimits?: RiderCodLimitsConfig;
  timestamp?: string;
}): CodSettlementResult {
  const { wallet, orderId, orderCashPaise, payoutPaise, timestamp } = params;
  const codLimits = params.codLimits ?? DEFAULT_RIDER_WALLET_CONFIG.codLimits;
  const now = timestamp ?? new Date().toISOString();

  if (orderCashPaise < 0 || payoutPaise < 0) {
    throw new Error("Order cash and payout paise must be non-negative");
  }

  // Pre-dispatch safety check enforcement:
  if (wallet.isPrepaidFirstLocked) {
    throw new Error(
      `Dispatch Violation: Rider ${wallet.riderId} is restricted to PREPAID_FIRST orders (${wallet.prepaidFirstUnlockReason})`
    );
  }
  if (wallet.isCodLockedDueToLimit) {
    throw new Error(
      `Dispatch Violation: Rider ${wallet.riderId} is hard-locked from COD due to floating cash exceeding limit (Current: ₹${(wallet.floatingCashPaise / 100).toFixed(2)})`
    );
  }

  // Compute exact netting
  const netting = calculateCodNettingBalances({
    orderCashPaise,
    payoutPaise,
    existingWithdrawableWalletPaise: wallet.withdrawableEarningsPaise,
    existingFloatingCashPaise: wallet.floatingCashPaise,
  });

  const ledgerEntries: LedgerEntry[] = [];

  // Entry 1: Record Rider Delivery Payout to Withdrawable Earnings
  ledgerEntries.push({
    id: `led_${wallet.riderId}_ord_${orderId}_payout`,
    riderId: wallet.riderId,
    timestamp: now,
    type: "ORDER_PAYOUT_PREPAID",
    orderId,
    debitPaise: 0,
    creditPaise: payoutPaise,
    account: "WITHDRAWABLE_EARNINGS",
    resultingBalancePaise: wallet.withdrawableEarningsPaise + payoutPaise,
    description: `COD order ${orderId} delivered: Delivery payout ₹${(payoutPaise / 100).toFixed(2)} credited to earnings`,
    metadata: { orderId, payoutPaise, orderType: "COD" },
  });

  // Entry 2: Record Cash Collection to Floating Cash Liability
  ledgerEntries.push({
    id: `led_${wallet.riderId}_ord_${orderId}_cash_col`,
    riderId: wallet.riderId,
    timestamp: now,
    type: "ORDER_COD_COLLECTION",
    orderId,
    debitPaise: 0,
    creditPaise: orderCashPaise,
    account: "FLOATING_CASH_LIABILITY",
    resultingBalancePaise: wallet.floatingCashPaise + orderCashPaise,
    description: `COD order ${orderId} collected: ₹${(orderCashPaise / 100).toFixed(2)} physical cash received from customer`,
    metadata: { orderCashPaise, orderId },
  });

  // Entry 3 & 4: Record Instant Netting Offset (Dual Pocket)
  if (netting.offsetAppliedPaise > 0) {
    ledgerEntries.push({
      id: `led_${wallet.riderId}_ord_${orderId}_netting_cash`,
      riderId: wallet.riderId,
      timestamp: now,
      type: "ORDER_COD_NETTING_OFFSET",
      orderId,
      debitPaise: netting.offsetAppliedPaise,
      creditPaise: 0,
      account: "FLOATING_CASH_LIABILITY",
      resultingBalancePaise: netting.newFloatingCashPaise,
      description: `Instant netting offset: ₹${(netting.offsetAppliedPaise / 100).toFixed(2)} offset against customer cash liability. Net deposit due: ₹${(netting.netDepositDueToPlatformPaise / 100).toFixed(2)}`,
      metadata: {
        offsetAppliedPaise: netting.offsetAppliedPaise,
        netDepositDueToPlatformPaise: netting.netDepositDueToPlatformPaise,
      },
    });

    ledgerEntries.push({
      id: `led_${wallet.riderId}_ord_${orderId}_netting_earnings`,
      riderId: wallet.riderId,
      timestamp: now,
      type: "ORDER_COD_NETTING_OFFSET",
      orderId,
      debitPaise: netting.offsetAppliedPaise,
      creditPaise: 0,
      account: "WITHDRAWABLE_EARNINGS",
      resultingBalancePaise: netting.newWithdrawableEarningsPaise,
      description: `Instant netting offset: ₹${(netting.offsetAppliedPaise / 100).toFixed(2)} deducted from withdrawable wallet against customer cash retained`,
      metadata: {
        offsetAppliedPaise: netting.offsetAppliedPaise,
        withdrawableBalanceAfter: netting.newWithdrawableEarningsPaise,
      },
    });
  }

  const isCodLimitBreached = netting.newFloatingCashPaise >= codLimits.cashInHandLimitPaise;
  const isSoftWarningActive = netting.newFloatingCashPaise >= codLimits.softWarningLimitPaise;

  const updatedWallet: RiderWalletState = {
    ...wallet,
    withdrawableEarningsPaise: netting.newWithdrawableEarningsPaise,
    floatingCashPaise: netting.newFloatingCashPaise,
    lifetimeEarningsPaise: wallet.lifetimeEarningsPaise + payoutPaise,
    lifetimeCashCollectedPaise: wallet.lifetimeCashCollectedPaise + orderCashPaise,
    completedDeliveriesCount: wallet.completedDeliveriesCount + 1,
    completedCodCount: wallet.completedCodCount + 1,
    isCodLockedDueToLimit: isCodLimitBreached,
    updatedAt: now,
  };

  return {
    updatedWallet,
    ledgerEntries,
    netting,
    isCodLimitBreached,
    isSoftWarningActive,
  };
}

/**
 * Process COD Cash Deposit via UPI / Razorpay:
 * When rider deposits cash back to platform, reducing floating cash liability.
 * Any excess deposited over floating cash liability is credited to Withdrawable Earnings!
 */
export interface CodDepositResult {
  updatedWallet: RiderWalletState;
  ledgerEntries: LedgerEntry[];
  settledDebtPaise: number;
  excessCreditedToEarningsPaise: number;
  codLockLifted: boolean;
}

export function processCodDeposit(params: {
  wallet: RiderWalletState;
  depositPaise: number;
  paymentRef: string;
  rail?: "RAZORPAY_UPI" | "INSTANT_UPI" | "BANK_IMPS";
  codLimits?: RiderCodLimitsConfig;
  timestamp?: string;
}): CodDepositResult {
  const { wallet, depositPaise, paymentRef, timestamp } = params;
  const codLimits = params.codLimits ?? DEFAULT_RIDER_WALLET_CONFIG.codLimits;
  const now = timestamp ?? new Date().toISOString();

  if (depositPaise <= 0) {
    throw new Error("Deposit amount must be strictly greater than 0 paise");
  }

  const existingFloating = wallet.floatingCashPaise;
  let settledDebtPaise = 0;
  let excessCreditedToEarningsPaise = 0;
  let newFloating = 0;
  let newWithdrawable = wallet.withdrawableEarningsPaise;

  if (depositPaise <= existingFloating) {
    settledDebtPaise = depositPaise;
    newFloating = existingFloating - depositPaise;
  } else {
    // Deposit exceeds debt: debt drops to 0, excess credited to earnings
    settledDebtPaise = existingFloating;
    excessCreditedToEarningsPaise = depositPaise - existingFloating;
    newFloating = 0;
    newWithdrawable += excessCreditedToEarningsPaise;
  }

  const ledgerEntries: LedgerEntry[] = [];

  // Debt clearance entry
  ledgerEntries.push({
    id: `led_${wallet.riderId}_dep_${paymentRef}_clearing`,
    riderId: wallet.riderId,
    timestamp: now,
    type: "COD_CASH_DEPOSIT_UPI",
    debitPaise: settledDebtPaise,
    creditPaise: 0,
    account: "FLOATING_CASH_LIABILITY",
    resultingBalancePaise: newFloating,
    description: `Rider deposited ₹${(settledDebtPaise / 100).toFixed(2)} via UPI (${paymentRef}) clearing floating cash liability.`,
    metadata: { paymentRef, rail: params.rail ?? "RAZORPAY_UPI" },
  });

  // Excess overpayment entry if any
  if (excessCreditedToEarningsPaise > 0) {
    ledgerEntries.push({
      id: `led_${wallet.riderId}_dep_${paymentRef}_excess`,
      riderId: wallet.riderId,
      timestamp: now,
      type: "MANUAL_CREDIT_ADJUSTMENT",
      debitPaise: 0,
      creditPaise: excessCreditedToEarningsPaise,
      account: "WITHDRAWABLE_EARNINGS",
      resultingBalancePaise: newWithdrawable,
      description: `Excess deposit of ₹${(excessCreditedToEarningsPaise / 100).toFixed(2)} credited to withdrawable earnings wallet`,
      metadata: { paymentRef },
    });
  }

  const codLockLifted = wallet.isCodLockedDueToLimit && newFloating < codLimits.cashInHandLimitPaise;

  const updatedWallet: RiderWalletState = {
    ...wallet,
    floatingCashPaise: newFloating,
    withdrawableEarningsPaise: newWithdrawable,
    lifetimeCashDepositedPaise: wallet.lifetimeCashDepositedPaise + depositPaise,
    isCodLockedDueToLimit: newFloating >= codLimits.cashInHandLimitPaise,
    updatedAt: now,
  };

  return {
    updatedWallet,
    ledgerEntries,
    settledDebtPaise,
    excessCreditedToEarningsPaise,
    codLockLifted,
  };
}

/**
 * Process Onboarding Kit Micro-Installment Deduction:
 * Deducts daily micro-installment from rider's withdrawable earnings.
 */
export interface KitDeductionResult {
  updatedWallet: RiderWalletState;
  ledgerEntries: LedgerEntry[];
  deductedPaise: number;
  remainingLiabilityPaise: number;
  isKitFullyPaid: boolean;
  unlockedCodThisDeduction: boolean;
}

export function processKitInstallmentDeduction(params: {
  wallet: RiderWalletState;
  customInstallmentPaise?: number;
  allowPartial?: boolean;
  config?: OnboardingKitConfig;
  timestamp?: string;
}): KitDeductionResult {
  const { wallet, customInstallmentPaise, allowPartial = true, timestamp } = params;
  const cfg = params.config ?? DEFAULT_RIDER_WALLET_CONFIG.onboarding;
  const now = timestamp ?? new Date().toISOString();

  const standardInstallment = customInstallmentPaise ?? wallet.onboarding.dailyInstallmentPaise;

  const deduction = calculateKitInstallmentDeduction({
    remainingKitLiabilityPaise: wallet.onboarding.remainingKitLiabilityPaise,
    availableWithdrawablePaise: wallet.withdrawableEarningsPaise,
    standardInstallmentPaise: standardInstallment,
    allowPartial,
  });

  if (deduction.actualDeductionPaise === 0) {
    return {
      updatedWallet: wallet,
      ledgerEntries: [],
      deductedPaise: 0,
      remainingLiabilityPaise: wallet.onboarding.remainingKitLiabilityPaise,
      isKitFullyPaid: wallet.onboarding.isKitFullyPaid,
      unlockedCodThisDeduction: false,
    };
  }

  const newTotalRepaid = wallet.onboarding.totalRepaidPaise + deduction.actualDeductionPaise;

  const entry: LedgerEntry = {
    id: `led_${wallet.riderId}_kit_deduct_${Date.now()}`,
    riderId: wallet.riderId,
    timestamp: now,
    type: "KIT_INSTALLMENT_DEDUCTION",
    debitPaise: deduction.actualDeductionPaise,
    creditPaise: 0,
    account: "WITHDRAWABLE_EARNINGS",
    resultingBalancePaise: deduction.newWithdrawablePaise,
    description: `Micro-installment deducted for onboarding kit: ₹${(deduction.actualDeductionPaise / 100).toFixed(2)}. Remaining liability: ₹${(deduction.newRemainingLiabilityPaise / 100).toFixed(2)}`,
    metadata: {
      remainingKitLiabilityPaise: deduction.newRemainingLiabilityPaise,
      isFullyPaid: deduction.isKitFullyPaidAfter,
    },
  };

  const minOrders =
    wallet.onboarding.minOrdersBeforeCodUnlock ??
    cfg.minOrdersBeforeCodUnlock;
  const minKitRepaidPct =
    wallet.onboarding.minKitRepaidPctBeforeCodUnlock ??
    cfg.minKitRepaidPctBeforeCodUnlock;

  // Re-check PREPAID_FIRST
  const { isLocked: stillLocked, reason } = evaluatePrepaidFirstStatus({
    mode: wallet.onboarding.mode,
    completedDeliveriesCount: wallet.completedDeliveriesCount,
    remainingKitLiabilityPaise: deduction.newRemainingLiabilityPaise,
    totalKitFeePaise: wallet.onboarding.totalKitFeePaise,
    minOrdersBeforeCodUnlock: minOrders,
    minKitRepaidPctBeforeCodUnlock: minKitRepaidPct,
  });

  const unlockedCodThisDeduction = wallet.isPrepaidFirstLocked && !stillLocked;

  const updatedWallet: RiderWalletState = {
    ...wallet,
    withdrawableEarningsPaise: deduction.newWithdrawablePaise,
    isPrepaidFirstLocked: stillLocked,
    prepaidFirstUnlockReason: reason,
    onboarding: {
      ...wallet.onboarding,
      totalRepaidPaise: newTotalRepaid,
      remainingKitLiabilityPaise: deduction.newRemainingLiabilityPaise,
      isKitFullyPaid: deduction.isKitFullyPaidAfter,
    },
    updatedAt: now,
  };

  return {
    updatedWallet,
    ledgerEntries: [entry],
    deductedPaise: deduction.actualDeductionPaise,
    remainingLiabilityPaise: deduction.newRemainingLiabilityPaise,
    isKitFullyPaid: deduction.isKitFullyPaidAfter,
    unlockedCodThisDeduction,
  };
}

/**
 * Process Early Payout / Instant Cashout Engine:
 * Instant earnings withdrawal before weekly cycle for a flat convenience fee (e.g. ₹10.00 / 1,000 paise).
 * Returns net rider payout and founder platform revenue earned.
 */
export interface EarlyPayoutResult {
  updatedWallet: RiderWalletState;
  ledgerEntries: LedgerEntry[];
  calculation: EarlyPayoutCalculation;
}

export function processEarlyPayout(params: {
  wallet: RiderWalletState;
  requestedPaise: number;
  config?: Partial<EarlyPayoutConfig>;
  timestamp?: string;
}): EarlyPayoutResult {
  const { wallet, requestedPaise, timestamp } = params;
  const cfg = EarlyPayoutConfigSchema.parse({
    ...DEFAULT_RIDER_WALLET_CONFIG.earlyPayout,
    ...params.config,
  });
  const now = timestamp ?? new Date().toISOString();
  const todayStr = now.slice(0, 10);

  // Reset daily cashout counter if new calendar day
  const dailyCount = wallet.lastCashoutDate === todayStr ? wallet.dailyCashoutCount : 0;

  if (dailyCount >= cfg.maxDailyCashouts) {
    throw new Error(
      `Instant Cashout Limit Reached: Maximum ${cfg.maxDailyCashouts} daily cashouts allowed per calendar day.`
    );
  }

  const calc = calculateEarlyPayoutNetting(
    requestedPaise,
    wallet.withdrawableEarningsPaise,
    cfg
  );

  if (!calc.isAllowed) {
    throw new Error(`Instant Cashout Rejected: ${calc.rejectReason}`);
  }

  const newWithdrawable = wallet.withdrawableEarningsPaise - requestedPaise;
  const ledgerEntries: LedgerEntry[] = [];

  // Entry 1: Rider Wallet Withdrawal Debit
  ledgerEntries.push({
    id: `led_${wallet.riderId}_cashout_${Date.now()}_req`,
    riderId: wallet.riderId,
    timestamp: now,
    type: "EARLY_CASHOUT_WITHDRAWAL",
    debitPaise: requestedPaise,
    creditPaise: 0,
    account: "WITHDRAWABLE_EARNINGS",
    resultingBalancePaise: newWithdrawable,
    description: `Instant Cashout withdrawal: ₹${(requestedPaise / 100).toFixed(2)} debited. Net rider payout: ₹${(calc.netRiderDisbursedPaise / 100).toFixed(2)}`,
    metadata: {
      requestedPaise,
      netRiderDisbursedPaise: calc.netRiderDisbursedPaise,
      convenienceFeePaise: calc.convenienceFeePaise,
    },
  });

  // Entry 2: Platform Convenience Fee Revenue
  ledgerEntries.push({
    id: `led_${wallet.riderId}_cashout_${Date.now()}_fee`,
    riderId: wallet.riderId,
    timestamp: now,
    type: "EARLY_CASHOUT_FEE_PLATFORM",
    debitPaise: 0,
    creditPaise: calc.convenienceFeePaise,
    account: "PLATFORM_REVENUE",
    resultingBalancePaise: calc.convenienceFeePaise,
    description: `Founder platform revenue earned from instant cashout convenience fee: ₹${(calc.convenienceFeePaise / 100).toFixed(2)}`,
    metadata: {
      flatFeePaise: calc.flatFeePaise,
      percentageFeePaise: calc.percentageFeePaise,
    },
  });

  const updatedWallet: RiderWalletState = {
    ...wallet,
    withdrawableEarningsPaise: newWithdrawable,
    lifetimeInstantCashoutsPaise: wallet.lifetimeInstantCashoutsPaise + requestedPaise,
    lifetimeConvenienceFeesPaidPaise:
      wallet.lifetimeConvenienceFeesPaidPaise + calc.convenienceFeePaise,
    dailyCashoutCount: dailyCount + 1,
    lastCashoutDate: todayStr,
    updatedAt: now,
  };

  return {
    updatedWallet,
    ledgerEntries,
    calculation: calc,
  };
}

/**
 * Process Standard Weekly Settlement Cycle:
 * In Tier-1 weekly payout model, weekly payouts (e.g. Tuesday midnight) disburse
 * all remaining withdrawable earnings directly to the rider's bank account with ₹0 fee.
 */
export interface WeeklySettlementResult {
  updatedWallet: RiderWalletState;
  ledgerEntries: LedgerEntry[];
  disbursedPaise: number;
}

export function processWeeklySettlement(params: {
  wallet: RiderWalletState;
  timestamp?: string;
}): WeeklySettlementResult {
  const { wallet, timestamp } = params;
  const now = timestamp ?? new Date().toISOString();

  const balanceToDisburse = wallet.withdrawableEarningsPaise;
  if (balanceToDisburse <= 0) {
    return {
      updatedWallet: wallet,
      ledgerEntries: [],
      disbursedPaise: 0,
    };
  }

  const entry: LedgerEntry = {
    id: `led_${wallet.riderId}_weekly_disburse_${Date.now()}`,
    riderId: wallet.riderId,
    timestamp: now,
    type: "WEEKLY_PAYOUT_DISBURSEMENT",
    debitPaise: balanceToDisburse,
    creditPaise: 0,
    account: "WITHDRAWABLE_EARNINGS",
    resultingBalancePaise: 0,
    description: `Standard weekly settlement cycle payout: ₹${(balanceToDisburse / 100).toFixed(2)} transferred to bank account (Zero convenience fee).`,
    metadata: {
      disbursedPaise: balanceToDisburse,
      settlementCycle: "STANDARD_WEEKLY",
    },
  };

  const updatedWallet: RiderWalletState = {
    ...wallet,
    withdrawableEarningsPaise: 0,
    dailyCashoutCount: 0,
    updatedAt: now,
  };

  return {
    updatedWallet,
    ledgerEntries: [entry],
    disbursedPaise: balanceToDisburse,
  };
}

/**
 * Dispatch Eligibility Gatekeeper:
 * Determines if rider can receive a new order based on order type, PREPAID_FIRST flag,
 * and COD cash-in-hand limit.
 */
export interface DispatchEligibilityResult {
  allowed: boolean;
  reason?: string;
  isSoftWarning: boolean;
  softWarningMessage?: string;
}

export function canRiderAcceptOrder(
  wallet: RiderWalletState,
  orderType: "PREPAID" | "COD",
  codLimits: RiderCodLimitsConfig = DEFAULT_RIDER_WALLET_CONFIG.codLimits
): DispatchEligibilityResult {
  if (orderType === "PREPAID") {
    return {
      allowed: true,
      isSoftWarning: false,
    };
  }

  // COD Order validations:
  if (wallet.isPrepaidFirstLocked) {
    return {
      allowed: false,
      reason: `PREPAID_FIRST RESTRICTION: Rider must complete initial prepaid orders before receiving COD orders (${wallet.prepaidFirstUnlockReason ?? "Trust building phase"}).`,
      isSoftWarning: false,
    };
  }

  if (wallet.isCodLockedDueToLimit || wallet.floatingCashPaise >= codLimits.cashInHandLimitPaise) {
    return {
      allowed: false,
      reason: `COD FLOATING CASH HARD LOCK: Rider has ₹${(wallet.floatingCashPaise / 100).toFixed(2)} cash-in-hand (Limit: ₹${(codLimits.cashInHandLimitPaise / 100).toFixed(2)}). Must deposit via UPI to unlock.`,
      isSoftWarning: false,
    };
  }

  const isSoftWarning = wallet.floatingCashPaise >= codLimits.softWarningLimitPaise;
  const softWarningMessage = isSoftWarning
    ? `COD SOFT WARNING: Floating cash is ₹${(wallet.floatingCashPaise / 100).toFixed(2)} (Approaching ₹${(codLimits.cashInHandLimitPaise / 100).toFixed(2)} limit). Please deposit soon via UPI.`
    : undefined;

  return {
    allowed: true,
    reason: undefined,
    isSoftWarning,
    softWarningMessage,
  };
}

/**
 * Double-Entry Ledger Integrity Audit Engine:
 * Validates that all ledger transactions sum up with exact precision
 * and match the current state balances with zero drift.
 */
export interface LedgerAuditReport {
  isValid: boolean;
  riderId: string;
  totalWithdrawableCreditsPaise: number;
  totalWithdrawableDebitsPaise: number;
  calculatedWithdrawablePaise: number;
  actualWithdrawablePaise: number;
  totalFloatingCashCreditsPaise: number;
  totalFloatingCashDebitsPaise: number;
  calculatedFloatingCashPaise: number;
  actualFloatingCashPaise: number;
  totalPlatformRevenuePaise: number;
  errors: string[];
}

export function verifyLedgerIntegrity(
  wallet: RiderWalletState,
  entries: LedgerEntry[]
): LedgerAuditReport {
  let withdrawableCredits = 0;
  let withdrawableDebits = 0;
  let floatingCashCredits = 0;
  let floatingCashDebits = 0;
  let platformRevenue = 0;
  const errors: string[] = [];

  for (const entry of entries) {
    if (entry.riderId !== wallet.riderId) continue;

    if (entry.account === "WITHDRAWABLE_EARNINGS") {
      withdrawableCredits += entry.creditPaise;
      withdrawableDebits += entry.debitPaise;
    } else if (entry.account === "FLOATING_CASH_LIABILITY") {
      floatingCashCredits += entry.creditPaise;
      floatingCashDebits += entry.debitPaise;
    } else if (entry.account === "PLATFORM_REVENUE") {
      platformRevenue += entry.creditPaise;
    }
  }

  const calculatedWithdrawable = withdrawableCredits - withdrawableDebits;
  const calculatedFloating = floatingCashCredits - floatingCashDebits;

  if (calculatedWithdrawable !== wallet.withdrawableEarningsPaise) {
    errors.push(
      `Withdrawable balance mismatch: Calculated ${calculatedWithdrawable} vs Wallet State ${wallet.withdrawableEarningsPaise}`
    );
  }

  if (calculatedFloating !== wallet.floatingCashPaise) {
    errors.push(
      `Floating cash balance mismatch: Calculated ${calculatedFloating} vs Wallet State ${wallet.floatingCashPaise}`
    );
  }

  return {
    isValid: errors.length === 0,
    riderId: wallet.riderId,
    totalWithdrawableCreditsPaise: withdrawableCredits,
    totalWithdrawableDebitsPaise: withdrawableDebits,
    calculatedWithdrawablePaise: calculatedWithdrawable,
    actualWithdrawablePaise: wallet.withdrawableEarningsPaise,
    totalFloatingCashCreditsPaise: floatingCashCredits,
    totalFloatingCashDebitsPaise: floatingCashDebits,
    calculatedFloatingCashPaise: calculatedFloating,
    actualFloatingCashPaise: wallet.floatingCashPaise,
    totalPlatformRevenuePaise: platformRevenue,
    errors,
  };
}

// ============================================================================
// 5. MASTER ZOMATO RIDER WALLET ENGINE (ORCHESTRATOR CLASS)
// ============================================================================

export class ZomatoRiderWalletEngine {
  private config: ZomatoRiderWalletConfig;
  private wallets: Map<string, RiderWalletState> = new Map();
  private ledger: LedgerEntry[] = [];

  constructor(config: Partial<ZomatoRiderWalletConfig> = {}) {
    this.config = ZomatoRiderWalletConfigSchema.parse({
      ...DEFAULT_RIDER_WALLET_CONFIG,
      ...config,
    });
  }

  public getConfig(): ZomatoRiderWalletConfig {
    return JSON.parse(JSON.stringify(this.config));
  }

  public updateConfig(newConfig: Partial<ZomatoRiderWalletConfig>): void {
    this.config = ZomatoRiderWalletConfigSchema.parse({
      ...this.config,
      ...newConfig,
    });
  }

  /**
   * Register and initialize a new rider wallet
   */
  public registerRider(
    riderId: string,
    onboardingOverride?: Partial<OnboardingKitConfig>
  ): RiderWalletState {
    const kitConfig = {
      ...this.config.onboarding,
      ...onboardingOverride,
    };
    const { state, initialEntries } = createInitialRiderWallet(riderId, kitConfig);
    this.wallets.set(riderId, state);
    this.ledger.push(...initialEntries);
    return state;
  }

  public getWallet(riderId: string): RiderWalletState {
    const wallet = this.wallets.get(riderId);
    if (!wallet) {
      throw new Error(`Rider wallet not found for riderId: ${riderId}`);
    }
    return wallet;
  }

  public getLedger(riderId?: string): LedgerEntry[] {
    if (!riderId) {
      return [...this.ledger];
    }
    return this.ledger.filter((e) => e.riderId === riderId);
  }

  /**
   * Process a prepaid order delivery settlement
   */
  public settlePrepaidOrder(
    riderId: string,
    orderId: string,
    payoutPaise: number,
    timestamp?: string
  ): PrepaidSettlementResult {
    const wallet = this.getWallet(riderId);
    const result = processPrepaidOrderSettlement({
      wallet,
      orderId,
      payoutPaise,
      config: this.config.onboarding,
      timestamp,
    });
    this.wallets.set(riderId, result.updatedWallet);
    this.ledger.push(...result.ledgerEntries);
    return result;
  }

  /**
   * Process a COD order delivery settlement with automatic instant netting
   */
  public settleCodOrder(
    riderId: string,
    orderId: string,
    orderCashPaise: number,
    payoutPaise: number,
    timestamp?: string
  ): CodSettlementResult {
    const wallet = this.getWallet(riderId);
    const result = processCodOrderSettlement({
      wallet,
      orderId,
      orderCashPaise,
      payoutPaise,
      codLimits: this.config.codLimits,
      timestamp,
    });
    this.wallets.set(riderId, result.updatedWallet);
    this.ledger.push(...result.ledgerEntries);
    return result;
  }

  /**
   * Process COD cash deposit via UPI/Razorpay
   */
  public depositCodCash(
    riderId: string,
    depositPaise: number,
    paymentRef: string,
    rail?: "RAZORPAY_UPI" | "INSTANT_UPI" | "BANK_IMPS",
    timestamp?: string
  ): CodDepositResult {
    const wallet = this.getWallet(riderId);
    const result = processCodDeposit({
      wallet,
      depositPaise,
      paymentRef,
      rail,
      codLimits: this.config.codLimits,
      timestamp,
    });
    this.wallets.set(riderId, result.updatedWallet);
    this.ledger.push(...result.ledgerEntries);
    return result;
  }

  /**
   * Process daily onboarding kit micro-installment deduction
   */
  public deductKitInstallment(
    riderId: string,
    customAmountPaise?: number,
    allowPartial = true,
    timestamp?: string
  ): KitDeductionResult {
    const wallet = this.getWallet(riderId);
    const result = processKitInstallmentDeduction({
      wallet,
      customInstallmentPaise: customAmountPaise,
      allowPartial,
      config: this.config.onboarding,
      timestamp,
    });
    this.wallets.set(riderId, result.updatedWallet);
    this.ledger.push(...result.ledgerEntries);
    return result;
  }

  /**
   * Request instant cashout / early payout before weekly cycle
   */
  public requestEarlyPayout(
    riderId: string,
    requestedPaise: number,
    timestamp?: string
  ): EarlyPayoutResult {
    const wallet = this.getWallet(riderId);
    const result = processEarlyPayout({
      wallet,
      requestedPaise,
      config: this.config.earlyPayout,
      timestamp,
    });
    this.wallets.set(riderId, result.updatedWallet);
    this.ledger.push(...result.ledgerEntries);
    return result;
  }

  /**
   * Process weekly standard cycle bank transfer
   */
  public processWeeklySettlement(riderId: string, timestamp?: string): WeeklySettlementResult {
    const wallet = this.getWallet(riderId);
    const result = processWeeklySettlement({ wallet, timestamp });
    this.wallets.set(riderId, result.updatedWallet);
    this.ledger.push(...result.ledgerEntries);
    return result;
  }

  /**
   * Check if rider can accept an incoming order dispatch
   */
  public checkDispatchEligibility(
    riderId: string,
    orderType: "PREPAID" | "COD"
  ): DispatchEligibilityResult {
    const wallet = this.getWallet(riderId);
    return canRiderAcceptOrder(wallet, orderType, this.config.codLimits);
  }

  /**
   * Run ledger audit verification on rider account
   */
  public auditRiderLedger(riderId: string): LedgerAuditReport {
    const wallet = this.getWallet(riderId);
    const riderEntries = this.getLedger(riderId);
    return verifyLedgerIntegrity(wallet, riderEntries);
  }

  /**
   * Get total founder platform revenue earned across all riders from early payout fees
   */
  public getTotalPlatformEarlyPayoutRevenuePaise(): number {
    return this.ledger
      .filter((e) => e.type === "EARLY_CASHOUT_FEE_PLATFORM")
      .reduce((acc, curr) => acc + curr.creditPaise, 0);
  }
}

// ============================================================================
// 6. CURRENCY FORMATTING UTILITIES
// ============================================================================

export function formatPaiseToInr(paise: number): string {
  const rupees = (paise / 100).toFixed(2);
  return `₹${rupees}`;
}

export function formatPaiseToRupeesString(paise: number): string {
  return (paise / 100).toFixed(2);
}
