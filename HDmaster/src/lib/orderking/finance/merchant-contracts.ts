/**
 * 👑 ORDERKING & KINGPAY MERCHANT CONTRACTS & STATUTORY FINANCIAL ENGINE
 * 
 * Principal Financial Architecture for Indian E-Commerce Commerce:
 * - Negotiated restaurant commission agreements (custom rates from 8% to 35% / 800 to 3500 bps).
 * - Volume-based commission tier discounts with strict 8% floor protection.
 * - Zomato-class weekly settlement cycle (Monday 00:00:00 to Sunday 23:59:59 IST, Wednesday payout).
 * - Statutory Indian tax calculation on merchant statements:
 *   * 5% GST on food orders (collected and remitted by platform under Section 9(5) CGST Act 2017).
 *   * 18% GST on platform commission fee (SAC 9985 / Section 9(1) CGST Act 2017).
 *   * 1% TCS (Tax Collected at Source under Section 52 of CGST Act 2017).
 *   * 1% TDS (Tax Deducted at Source under Section 194-O of Income Tax Act 1961).
 * - Double-entry ledger integration posting reconciled net payable amounts.
 */

import { canonicalLedger, type CanonicalLedger, type LedgerEntry, type LedgerTransaction } from "./canonical-ledger.ts";

/**
 * Statutory Rate Constants (in basis points: 100 bps = 1.00%)
 */
export const STATUTORY_RATES = {
  MIN_COMMISSION_BPS: 800,       // 8.00% statutory platform commission floor
  MAX_COMMISSION_BPS: 3500,      // 35.00% platform commission ceiling
  DEFAULT_COMMISSION_BPS: 1800,  // 18.00% standard negotiated baseline
  FOOD_GST_BPS: 500,             // 5.00% GST on food orders under Section 9(5) CGST Act
  COMMISSION_GST_BPS: 1800,      // 18.00% GST on platform commission fee
  TCS_BPS: 100,                  // 1.00% TCS under Section 52 CGST Act
  TDS_BPS: 100,                  // 1.00% TDS under Section 194-O Income Tax Act
  DEFAULT_PG_FEE_BPS: 180,       // 1.80% payment gateway processing fee
  PG_FEE_GST_BPS: 1800,          // 18.00% GST on payment gateway fee
} as const;

/**
 * Volume-based commission tier discount specification
 */
export interface VolumeCommissionTier {
  tierId: string;
  name: string;
  minWeeklyOrders?: number;
  minWeeklyGrossSalesPaise?: number;
  discountBps: number; // Basis points deducted from base commission rate (e.g. 100 = 1.00%)
  description?: string;
}

/**
 * Standard platform volume tiers available to merchants
 */
export const STANDARD_VOLUME_TIERS: VolumeCommissionTier[] = [
  {
    tierId: "starter",
    name: "Base Tier",
    minWeeklyOrders: 0,
    minWeeklyGrossSalesPaise: 0,
    discountBps: 0,
    description: "Negotiated base commission rate",
  },
  {
    tierId: "silver",
    name: "Silver Volume Tier",
    minWeeklyOrders: 100,
    minWeeklyGrossSalesPaise: 50_000_00, // ₹50,000 GMV
    discountBps: 100, // 1% discount
    description: "100 bps commission discount for >= 100 weekly orders and >= ₹50,000 GMV",
  },
  {
    tierId: "gold",
    name: "Gold Volume Tier",
    minWeeklyOrders: 300,
    minWeeklyGrossSalesPaise: 200_000_00, // ₹2,00,000 GMV
    discountBps: 200, // 2% discount
    description: "200 bps commission discount for >= 300 weekly orders and >= ₹2,00,000 GMV",
  },
  {
    tierId: "platinum",
    name: "Platinum Enterprise Tier",
    minWeeklyOrders: 500,
    minWeeklyGrossSalesPaise: 500_000_00, // ₹5,00,000 GMV
    discountBps: 300, // 3% discount
    description: "300 bps commission discount for >= 500 weekly orders and >= ₹5,00,000 GMV",
  },
];

/**
 * Negotiated restaurant commission agreement contract
 */
export interface MerchantContract {
  contractId: string;
  restaurantId: string;
  restaurantName: string;
  baseCommissionBps: number; // Must be between 800 and 3500 (8% to 35%)
  volumeTiers: VolumeCommissionTier[];
  paymentGatewayFeeBps: number;
  isPgFeeDeducted: boolean;
  packagingRetainedByMerchant: boolean;
  panNumber?: string;
  gstin?: string;
  bankAccountMasked?: string;
  effectiveFrom: string; // ISO date
  effectiveTo?: string; // ISO date
  status: "ACTIVE" | "SUSPENDED" | "TERMINATED" | "DRAFT";
  customTerms?: string;
}

/**
 * Validates and creates a negotiated merchant contract.
 * Enforces negotiated rate bounds between 8% and 35%.
 */
export function createMerchantContract(params: {
  contractId?: string;
  restaurantId: string;
  restaurantName: string;
  baseCommissionBps: number;
  volumeTiers?: VolumeCommissionTier[];
  paymentGatewayFeeBps?: number;
  isPgFeeDeducted?: boolean;
  packagingRetainedByMerchant?: boolean;
  panNumber?: string;
  gstin?: string;
  bankAccountMasked?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  status?: "ACTIVE" | "SUSPENDED" | "TERMINATED" | "DRAFT";
  customTerms?: string;
}): MerchantContract {
  if (
    !Number.isInteger(params.baseCommissionBps) ||
    params.baseCommissionBps < STATUTORY_RATES.MIN_COMMISSION_BPS ||
    params.baseCommissionBps > STATUTORY_RATES.MAX_COMMISSION_BPS
  ) {
    throw new Error(
      `Negotiated commission rate must be an integer between 8% (${STATUTORY_RATES.MIN_COMMISSION_BPS} bps) ` +
      `and 35% (${STATUTORY_RATES.MAX_COMMISSION_BPS} bps). Provided: ${params.baseCommissionBps} bps`
    );
  }

  const tiers = params.volumeTiers ?? STANDARD_VOLUME_TIERS;
  for (const tier of tiers) {
    if (tier.discountBps < 0) {
      throw new Error(`Volume tier discount cannot be negative: ${tier.discountBps} bps`);
    }
  }

  return {
    contractId: params.contractId || `mc_${params.restaurantId}_${Date.now()}`,
    restaurantId: params.restaurantId,
    restaurantName: params.restaurantName,
    baseCommissionBps: params.baseCommissionBps,
    volumeTiers: tiers,
    paymentGatewayFeeBps: params.paymentGatewayFeeBps ?? STATUTORY_RATES.DEFAULT_PG_FEE_BPS,
    isPgFeeDeducted: params.isPgFeeDeducted ?? true,
    packagingRetainedByMerchant: params.packagingRetainedByMerchant ?? true,
    panNumber: params.panNumber,
    gstin: params.gstin,
    bankAccountMasked: params.bankAccountMasked || "XXXX-XXXX-9999",
    effectiveFrom: params.effectiveFrom || new Date().toISOString().split("T")[0],
    effectiveTo: params.effectiveTo,
    status: params.status || "ACTIVE",
    customTerms: params.customTerms,
  };
}

/**
 * Evaluates effective commission rate considering volume tiers.
 * Guarantees that commission rate never drops below the 8% statutory floor.
 */
export function evaluateEffectiveCommissionRate(
  contract: MerchantContract,
  volume: {
    weeklyOrdersCount: number;
    weeklyGrossSalesPaise: number;
  }
): {
  baseCommissionBps: number;
  appliedDiscountBps: number;
  effectiveCommissionBps: number;
  effectiveRatePercent: number;
  appliedTier?: VolumeCommissionTier;
} {
  let highestApplicableTier: VolumeCommissionTier | undefined;
  let maxDiscount = 0;

  for (const tier of contract.volumeTiers) {
    const ordersQualified =
      tier.minWeeklyOrders === undefined || volume.weeklyOrdersCount >= tier.minWeeklyOrders;
    const salesQualified =
      tier.minWeeklyGrossSalesPaise === undefined ||
      volume.weeklyGrossSalesPaise >= tier.minWeeklyGrossSalesPaise;

    // Qualifies if criteria criteria are met
    if (ordersQualified && salesQualified && tier.discountBps >= maxDiscount) {
      maxDiscount = tier.discountBps;
      highestApplicableTier = tier;
    }
  }

  // Enforce 8% statutory floor
  const uncappedRate = contract.baseCommissionBps - maxDiscount;
  const effectiveCommissionBps = Math.max(STATUTORY_RATES.MIN_COMMISSION_BPS, uncappedRate);
  const actualDiscountApplied = contract.baseCommissionBps - effectiveCommissionBps;

  return {
    baseCommissionBps: contract.baseCommissionBps,
    appliedDiscountBps: actualDiscountApplied,
    effectiveCommissionBps,
    effectiveRatePercent: effectiveCommissionBps / 100,
    appliedTier: highestApplicableTier,
  };
}

/**
 * Helper to format Date as local calendar YYYY-MM-DD
 */
function formatCalendarDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Zomato-Class Weekly Settlement Cycle Period
 * Cycle: Monday 00:00:00 to Sunday 23:59:59 IST
 * Payout: Wednesday (exactly 3 days following Sunday closing)
 */
export interface WeeklySettlementCycle {
  cycleId: string;
  startDate: string;  // Monday (YYYY-MM-DD)
  endDate: string;    // Sunday (YYYY-MM-DD)
  payoutDate: string; // Wednesday (YYYY-MM-DD)
  cycleNumber: number;// ISO week number
  year: number;
  status: "OPEN" | "RECONCILING" | "DISBURSED";
}

/**
 * Computes standard Monday-to-Sunday weekly settlement cycle with Wednesday statutory payout.
 */
export function getWeeklySettlementCycle(referenceDate: Date | string = new Date()): WeeklySettlementCycle {
  const d = typeof referenceDate === "string" ? new Date(referenceDate) : new Date(referenceDate.getTime());
  
  const day = d.getDay(); // 0 is Sun, 1 is Mon, 2 is Tue, 3 is Wed, ..., 6 is Sat
  // Shift to Monday (day 1):
  // Sunday (0) -> -6 days
  // Monday (1) -> 0 days
  // Tuesday (2) -> -1 day
  // Wednesday (3) -> -2 days
  // etc.
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const payoutWednesday = new Date(sunday);
  payoutWednesday.setDate(sunday.getDate() + 3); // Following Wednesday
  payoutWednesday.setHours(12, 0, 0, 0);

  // Calculate ISO week number
  const target = new Date(monday.valueOf());
  const dayNr = (monday.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);

  const now = new Date();
  let status: "OPEN" | "RECONCILING" | "DISBURSED" = "OPEN";
  if (now > payoutWednesday) {
    status = "DISBURSED";
  } else if (now > sunday) {
    status = "RECONCILING";
  }

  return {
    cycleId: `cycle_${formatCalendarDate(monday)}_to_${formatCalendarDate(sunday)}`,
    startDate: formatCalendarDate(monday),
    endDate: formatCalendarDate(sunday),
    payoutDate: formatCalendarDate(payoutWednesday),
    cycleNumber: weekNumber,
    year: monday.getFullYear(),
    status,
  };
}

/**
 * Computes previous closed Monday-to-Sunday weekly settlement cycle.
 */
export function getPreviousWeeklySettlementCycle(referenceDate: Date | string = new Date()): WeeklySettlementCycle {
  const d = typeof referenceDate === "string" ? new Date(referenceDate) : new Date(referenceDate.getTime());
  d.setDate(d.getDate() - 7);
  return getWeeklySettlementCycle(d);
}

/**
 * Detailed statutory Indian tax breakdown
 */
export interface StatutoryTaxSchedule {
  // 5% GST on food orders (Section 9(5) CGST Act 2017)
  foodGstSec9_5: {
    rateBps: number;
    taxableValuePaise: number;
    totalTaxPaise: number;
    cgstPaise: number;
    sgstPaise: number;
    igstPaise: number;
    remittedByPlatform: boolean;
    legalSection: string;
  };
  // 18% GST on platform commission fee
  commissionGst18: {
    rateBps: number;
    taxableValuePaise: number;
    totalTaxPaise: number;
    cgstPaise: number;
    sgstPaise: number;
    igstPaise: number;
    sacCode: string;
    legalSection: string;
  };
  // 1% TCS under Section 52 CGST Act 2017
  tcsSec52: {
    rateBps: number;
    taxableValuePaise: number;
    totalTaxPaise: number;
    cgstPaise: number;
    sgstPaise: number;
    igstPaise: number;
    legalSection: string;
    remittanceChannel: string;
  };
  // 1% TDS under Section 194-O Income Tax Act 1961
  tdsSec194O: {
    rateBps: number;
    taxableValuePaise: number;
    totalTaxPaise: number;
    legalSection: string;
    complianceCertificate: string;
  };
  // Payment Gateway fee & 18% GST (if applicable)
  paymentGatewayTax?: {
    feePaise: number;
    pgFeePaise: number;
    rateBps: number;
    gstRateBps: number;
    gstPaise: number;
  };
}

/**
 * Full Zomato-Class Merchant Weekly Settlement Statement
 */
export interface MerchantWeeklySettlementStatement {
  statementId: string;
  contractId: string;
  restaurantId: string;
  restaurantName: string;
  bankAccountMasked: string;
  cycle: WeeklySettlementCycle;
  ordersSummary: {
    deliveredOrdersCount: number;
    cancelledOrdersCount: number;
  };
  commissionDetails: {
    baseCommissionBps: number;
    volumeDiscountBps: number;
    effectiveCommissionBps: number;
    effectiveRatePercent: number;
    appliedTierName?: string;
  };
  financials: {
    grossSalesPaise: number;
    restaurantDiscountsPaise: number;
    netFoodSalesPaise: number;
    packagingChargesPaise: number;
    platformReimbursementsPaise: number;
    totalCreditsPaise: number; // netFood + packaging + reimbursements

    platformCommissionPaise: number;
    commissionGstPaise: number; // 18% GST
    pgFeePaise: number;
    pgFeeGstPaise: number; // 18% GST on PG fee
    tcsDeductionPaise: number; // 1% TCS Sec 52
    tdsDeductionPaise: number; // 1% TDS Sec 194-O
    otherDeductionsPaise: number;
    totalDeductionsPaise: number;

    netPayablePaise: number;
    netPayableInr: number;
  };
  statutoryTaxes: StatutoryTaxSchedule;
  reconciledNetPayoutPaise: number;
  reconciledNetPayoutInr: number;
  payoutStatus: "CALCULATED" | "VALIDATED" | "APPROVED" | "DISBURSED" | "ESCALATED";
  generatedAt: string;
}

/**
 * Parameters for generating merchant weekly settlement statement
 */
export interface GenerateSettlementParams {
  contract: MerchantContract;
  cycle?: WeeklySettlementCycle;
  deliveredOrdersCount: number;
  grossSalesPaise: number;
  restaurantDiscountsPaise: number;
  packagingChargesPaise?: number;
  platformReimbursementsPaise?: number;
  otherDeductionsPaise?: number;
  cancelledOrdersCount?: number;
  referenceDate?: Date | string;
}

/**
 * Computes exact weekly settlement statement for a restaurant merchant.
 * Incorporates negotiated rates, volume tiers, and all statutory Indian taxes.
 */
export function generateMerchantWeeklySettlementStatement(
  params: GenerateSettlementParams
): MerchantWeeklySettlementStatement {
  const { contract } = params;
  const cycle = params.cycle ?? getWeeklySettlementCycle(params.referenceDate ?? new Date());

  const grossSales = Math.max(0, params.grossSalesPaise);
  const discounts = Math.max(0, params.restaurantDiscountsPaise);
  const netFoodSalesPaise = Math.max(0, grossSales - discounts);
  const packaging = params.packagingChargesPaise ?? 0;
  const reimbursements = params.platformReimbursementsPaise ?? 0;
  const otherDeductions = params.otherDeductionsPaise ?? 0;

  // 1. Evaluate Commission Rate with Volume Tiers
  const rateEvaluation = evaluateEffectiveCommissionRate(contract, {
    weeklyOrdersCount: params.deliveredOrdersCount,
    weeklyGrossSalesPaise: grossSales,
  });

  const platformCommissionPaise = Math.round(
    (netFoodSalesPaise * rateEvaluation.effectiveCommissionBps) / 10000
  );

  // 2. 18% GST on Platform Commission
  const commissionGstPaise = Math.round(
    (platformCommissionPaise * STATUTORY_RATES.COMMISSION_GST_BPS) / 10000
  );
  const halfCommissionGst = Math.round(commissionGstPaise / 2);

  // 3. 5% GST on Food Orders under Section 9(5) CGST Act
  // Collected by platform and remitted directly to Government treasury
  const foodGstPaise = Math.round(
    (netFoodSalesPaise * STATUTORY_RATES.FOOD_GST_BPS) / 10000
  );
  const halfFoodGst = Math.round(foodGstPaise / 2);

  // 4. 1% TCS under Section 52 CGST Act
  const tcsDeductionPaise = Math.round(
    (netFoodSalesPaise * STATUTORY_RATES.TCS_BPS) / 10000
  );
  const halfTcs = Math.round(tcsDeductionPaise / 2);

  // 5. 1% TDS under Section 194-O Income Tax Act
  const tdsDeductionPaise = Math.round(
    (netFoodSalesPaise * STATUTORY_RATES.TDS_BPS) / 10000
  );

  // 6. Payment Gateway Fee & 18% GST on PG Fee
  let pgFeePaise = 0;
  let pgFeeGstPaise = 0;
  if (contract.isPgFeeDeducted) {
    pgFeePaise = Math.round((grossSales * contract.paymentGatewayFeeBps) / 10000);
    pgFeeGstPaise = Math.round((pgFeePaise * STATUTORY_RATES.PG_FEE_GST_BPS) / 10000);
  }

  // 7. Aggregations & Net Reconciled Payout
  const totalCreditsPaise = netFoodSalesPaise + packaging + reimbursements;
  const totalDeductionsPaise =
    platformCommissionPaise +
    commissionGstPaise +
    pgFeePaise +
    pgFeeGstPaise +
    tcsDeductionPaise +
    tdsDeductionPaise +
    otherDeductions;

  const netPayablePaise = Math.max(0, totalCreditsPaise - totalDeductionsPaise);

  const statementId = `stmt_${contract.restaurantId}_${cycle.cycleId}`;
  const now = new Date().toISOString();

  const statutoryTaxes: StatutoryTaxSchedule = {
    foodGstSec9_5: {
      rateBps: STATUTORY_RATES.FOOD_GST_BPS,
      taxableValuePaise: netFoodSalesPaise,
      totalTaxPaise: foodGstPaise,
      cgstPaise: halfFoodGst,
      sgstPaise: foodGstPaise - halfFoodGst,
      igstPaise: 0,
      remittedByPlatform: true,
      legalSection: "Section 9(5) of CGST Act 2017",
    },
    commissionGst18: {
      rateBps: STATUTORY_RATES.COMMISSION_GST_BPS,
      taxableValuePaise: platformCommissionPaise,
      totalTaxPaise: commissionGstPaise,
      cgstPaise: halfCommissionGst,
      sgstPaise: commissionGstPaise - halfCommissionGst,
      igstPaise: 0,
      sacCode: "9985",
      legalSection: "Section 9(1) of CGST Act 2017",
    },
    tcsSec52: {
      rateBps: STATUTORY_RATES.TCS_BPS,
      taxableValuePaise: netFoodSalesPaise,
      totalTaxPaise: tcsDeductionPaise,
      cgstPaise: halfTcs,
      sgstPaise: tcsDeductionPaise - halfTcs,
      igstPaise: 0,
      legalSection: "Section 52 of CGST Act 2017",
      remittanceChannel: "GSTR-8",
    },
    tdsSec194O: {
      rateBps: STATUTORY_RATES.TDS_BPS,
      taxableValuePaise: netFoodSalesPaise,
      totalTaxPaise: tdsDeductionPaise,
      legalSection: "Section 194-O of Income Tax Act 1961",
      complianceCertificate: "Form 16A",
    },
    paymentGatewayTax: contract.isPgFeeDeducted
      ? {
          feePaise: pgFeePaise,
          pgFeePaise,
          rateBps: contract.paymentGatewayFeeBps,
          gstRateBps: STATUTORY_RATES.PG_FEE_GST_BPS,
          gstPaise: pgFeeGstPaise,
        }
      : undefined,
  };

  return {
    statementId,
    contractId: contract.contractId,
    restaurantId: contract.restaurantId,
    restaurantName: contract.restaurantName,
    bankAccountMasked: contract.bankAccountMasked || "XXXX-XXXX-9999",
    cycle,
    ordersSummary: {
      deliveredOrdersCount: params.deliveredOrdersCount,
      cancelledOrdersCount: params.cancelledOrdersCount ?? 0,
    },
    commissionDetails: {
      baseCommissionBps: rateEvaluation.baseCommissionBps,
      volumeDiscountBps: rateEvaluation.appliedDiscountBps,
      effectiveCommissionBps: rateEvaluation.effectiveCommissionBps,
      effectiveRatePercent: rateEvaluation.effectiveRatePercent,
      appliedTierName: rateEvaluation.appliedTier?.name,
    },
    financials: {
      grossSalesPaise: grossSales,
      restaurantDiscountsPaise: discounts,
      netFoodSalesPaise,
      packagingChargesPaise: packaging,
      platformReimbursementsPaise: reimbursements,
      totalCreditsPaise,
      platformCommissionPaise,
      commissionGstPaise,
      pgFeePaise,
      pgFeeGstPaise,
      tcsDeductionPaise,
      tdsDeductionPaise,
      otherDeductionsPaise: otherDeductions,
      totalDeductionsPaise,
      netPayablePaise,
      netPayableInr: parseFloat((netPayablePaise / 100).toFixed(2)),
    },
    statutoryTaxes,
    reconciledNetPayoutPaise: netPayablePaise,
    reconciledNetPayoutInr: parseFloat((netPayablePaise / 100).toFixed(2)),
    payoutStatus: "CALCULATED",
    generatedAt: now,
  };
}

/**
 * Generates balanced Double-Entry Ledger entries for the net settlement payout.
 * Debits RESTAURANT_PAYABLE and Credits BANK_CLEARING.
 */
export function generatePayoutLedgerEntries(
  statement: MerchantWeeklySettlementStatement
): LedgerEntry[] {
  if (statement.reconciledNetPayoutPaise === 0) {
    return [];
  }

  return [
    {
      account: "RESTAURANT_PAYABLE",
      direction: "DEBIT",
      amountPaise: statement.reconciledNetPayoutPaise,
      entityId: statement.restaurantId,
      memo: `Settlement payout disburse: ${statement.restaurantName} (Cycle: ${statement.cycle.startDate} to ${statement.cycle.endDate})`,
    },
    {
      account: "BANK_CLEARING",
      direction: "CREDIT",
      amountPaise: statement.reconciledNetPayoutPaise,
      entityId: "BANK_ESCROW",
      memo: `Direct bank payout transfer for batch ${statement.statementId}`,
    },
  ];
}

/**
 * Generates complete statutory double-entry settlement reconciliation journal entries.
 * Mathematically balanced: Debits == Credits to the exact single paise.
 */
export function generateComprehensiveSettlementJournal(
  statement: MerchantWeeklySettlementStatement
): LedgerEntry[] {
  const fin = statement.financials;
  const entries: LedgerEntry[] = [];

  // DEBIT: Restaurant Payable cleared by full credits amount
  if (fin.totalCreditsPaise > 0) {
    entries.push({
      account: "RESTAURANT_PAYABLE",
      direction: "DEBIT",
      amountPaise: fin.totalCreditsPaise,
      entityId: statement.restaurantId,
      memo: `Settlement clearing gross entitlement for ${statement.statementId}`,
    });
  }

  // CREDIT: Platform Commission Fee Revenue
  if (fin.platformCommissionPaise > 0) {
    entries.push({
      account: "PLATFORM_FEE_REVENUE",
      direction: "CREDIT",
      amountPaise: fin.platformCommissionPaise,
      entityId: "PLATFORM_TREASURY",
      memo: `Earned platform commission on ${statement.statementId}`,
    });
  }

  // CREDIT: 18% GST Output Liability on Commission
  if (fin.commissionGstPaise > 0) {
    entries.push({
      account: "GST_OUTPUT_LIABILITY",
      direction: "CREDIT",
      amountPaise: fin.commissionGstPaise,
      entityId: "GOVT_GST_OUTPUT",
      memo: `18% GST liability on commission for ${statement.statementId}`,
    });
  }

  // CREDIT: 1% TCS Liability under Section 52
  if (fin.tcsDeductionPaise > 0) {
    entries.push({
      account: "TCS_PAYABLE_LIABILITY",
      direction: "CREDIT",
      amountPaise: fin.tcsDeductionPaise,
      entityId: "GOVT_TCS_ESCROW",
      memo: `1% TCS withheld under Sec 52 for ${statement.statementId}`,
    });
  }

  // CREDIT: 1% TDS Liability under Section 194-O
  if (fin.tdsDeductionPaise > 0) {
    entries.push({
      account: "TDS_PAYABLE_LIABILITY",
      direction: "CREDIT",
      amountPaise: fin.tdsDeductionPaise,
      entityId: "GOVT_TDS_ESCROW",
      memo: `1% TDS withheld under Sec 194-O for ${statement.statementId}`,
    });
  }

  // CREDIT: Payment Gateway Fee + GST
  const pgTotal = fin.pgFeePaise + fin.pgFeeGstPaise;
  if (pgTotal > 0) {
    entries.push({
      account: "BANK_CLEARING",
      direction: "CREDIT",
      amountPaise: pgTotal,
      entityId: "GATEWAY_ESCROW",
      memo: `Payment gateway fee and tax withheld for ${statement.statementId}`,
    });
  }

  // CREDIT: Other adjustments/penalties if any
  if (fin.otherDeductionsPaise > 0) {
    entries.push({
      account: "PLATFORM_FEE_REVENUE",
      direction: "CREDIT",
      amountPaise: fin.otherDeductionsPaise,
      entityId: "PLATFORM_TREASURY",
      memo: `Other deduction adjustment for ${statement.statementId}`,
    });
  }

  // CREDIT: Net Bank Payout disbursed to restaurant
  if (statement.reconciledNetPayoutPaise > 0) {
    entries.push({
      account: "BANK_CLEARING",
      direction: "CREDIT",
      amountPaise: statement.reconciledNetPayoutPaise,
      entityId: "BANK_ESCROW",
      memo: `Net payout disbursement to merchant for ${statement.statementId}`,
    });
  }

  // Verify mathematical balance
  const totalDebit = entries
    .filter((e) => e.direction === "DEBIT")
    .reduce((sum, e) => sum + e.amountPaise, 0);
  const totalCredit = entries
    .filter((e) => e.direction === "CREDIT")
    .reduce((sum, e) => sum + e.amountPaise, 0);

  if (totalDebit !== totalCredit) {
    throw new Error(
      `Double-entry ledger journal out of balance! Debits: ${totalDebit} paise, Credits: ${totalCredit} paise.`
    );
  }

  return entries;
}

/**
 * Posts merchant settlement disbursement to Canonical Ledger.
 * Integrates with CanonicalLedger's append-only cryptographically linked audit chain.
 */
export async function postMerchantSettlementToLedger(
  statement: MerchantWeeklySettlementStatement,
  ledger: CanonicalLedger = canonicalLedger
): Promise<LedgerTransaction> {
  const entries = generatePayoutLedgerEntries(statement);

  if (entries.length === 0) {
    throw new Error("Cannot post zero-value settlement to ledger.");
  }

  const idempotencyKey = `payout_stl_${statement.restaurantId}_${statement.cycle.cycleId}`;

  return await ledger.postTransaction({
    idempotencyKey,
    eventType: "MERCHANT_SETTLEMENT_DISBURSED",
    entries,
  });
}
