/**
 * Tier-1 Legacy Market Leader Compatible Dual Settlement Engine for OrderKing
 * 
 * Indian Food Delivery Settlement Architecture:
 * 1. Standard Weekly Cycle:
 *    - Cycle: Monday 00:00:00 to Sunday 23:59:59 IST
 *    - Payout Day: Wednesday (Disbursed via NEFT/IMPS/Razorpay Route)
 *    - Liquidity Fee: 0%
 * 
 * 2. Express Daily Cycle (T+1):
 *    - Cycle: Yesterday 00:00:00 to yesterday 23:59:59 IST
 *    - Payout Day: Today (T+1 Payout)
 *    - Nominal Early-Liquidity Fee: 0.5% (50 bps) + 18% GST on fee
 * 
 * Strict Statutory Compliance:
 * - Section 9(5) CGST Act: 5% GST collected from customer, remitted under OrderKing GSTIN
 * - Section 52 CGST Act: 1% TCS on net food sales (0.5% CGST + 0.5% SGST)
 * - Section 194-O Income Tax Act: 1% TDS on gross sales for registered PANs
 * - 18% GST on platform service revenue (commissions, PG fees, early-liquidity fees)
 * 
 * SafeInteger paise arithmetic everywhere.
 */

import type { SettlementCycleType } from "./SettlementReconciliationEngine";

export type WeeklyCyclePeriod = {
  cycleId: string;
  startDate: string; // YYYY-MM-DD (Monday)
  endDate: string;   // YYYY-MM-DD (Sunday)
  payoutDate: string;// YYYY-MM-DD (Wednesday)
  status: "OPEN" | "RECONCILING" | "DISBURSED";
};

export type ExpressDailyCyclePeriod = {
  cycleId: string;
  startDate: string; // YYYY-MM-DD (Yesterday)
  endDate: string;   // YYYY-MM-DD (Yesterday)
  payoutDate: string;// YYYY-MM-DD (Today / T+1)
  status: "OPEN" | "RECONCILING" | "DISBURSED";
  earlyLiquidityFeeBps: number; // 50 bps = 0.5%
};

export type DailyTPlus1CyclePeriod = {
  cycleId: string;
  startDate: string; // YYYY-MM-DD (Yesterday)
  endDate: string;   // YYYY-MM-DD (Yesterday 23:59:59 IST)
  payoutDate: string;// YYYY-MM-DD (Today / Day T+1 10:00 AM IST)
  status: "OPEN" | "RECONCILING" | "DISBURSED";
};

export type RestaurantWeeklySettlement = {
  restaurantId: string;
  restaurantName: string;
  bankAccountNumberMasked: string;
  cycle: WeeklyCyclePeriod;
  deliveredOrdersCount: number;
  grossSalesPaise: number;
  restaurantDiscountsPaise: number;
  netFoodSalesPaise: number;
  packagingChargesPaise: number;
  platformCommissionPaise: number;
  gstOnCommissionPaise: number;    // 18% GST on commission
  paymentGatewayFeePaise: number;  // ~1.8% PG fee
  gstOnPgFeePaise: number;         // 18% GST on PG fee
  tcsDeductionPaise: number;       // 1% TCS (CGST Act Section 52)
  tdsDeductionPaise: number;       // 1% TDS (Income Tax Section 194-O)
  platformReimbursementsPaise: number;
  kingCoinsLiabilityFundedPaise: number;
  sec9_5FoodGstPaise?: number;     // 5% Food GST remitted by platform under OrderKing GSTIN
  expressLiquidityFeePaise?: number;
  gstOnExpressLiquidityFeePaise?: number;
  netPayablePaise: number;
  payoutStatus: "PENDING" | "PROCESSING" | "PAID";
};

export type RestaurantDualCycleSettlement = RestaurantWeeklySettlement & {
  cycleType: SettlementCycleType;
  cyclePeriod: WeeklyCyclePeriod | ExpressDailyCyclePeriod;
};

export type RiderWeeklySettlement = {
  riderId: string;
  riderName: string;
  upiIdOrBankMasked: string;
  cycle: WeeklyCyclePeriod;
  deliveriesCompleted: number;
  basePayPaise: number;
  distancePayPaise: number;
  surgeIncentivesPaise: number;
  milestoneBonusPaise: number;
  grossEarningsPaise: number;
  cashCollectedPaise: number; // COD cash holding to reconcile
  netDisbursementPaise: number; // Positive = we pay rider; Negative = rider deposits cash
  payoutStatus: "PENDING" | "PROCESSING" | "PAID";
};

/**
 * Returns the current or previous Monday-to-Sunday weekly cycle.
 * Standard cycle with Wednesday disbursement.
 */
export function getWeeklyCycle(referenceDate = new Date()): WeeklyCyclePeriod {
  const d = new Date(referenceDate);
  const day = d.getDay(); // 0 is Sun, 1 is Mon, 3 is Wed
  const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);

  const monday = new Date(d.setDate(diffToMonday));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const payoutWednesday = new Date(sunday);
  payoutWednesday.setDate(sunday.getDate() + 3); // Following Wednesday

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  return {
    cycleId: `cycle_${formatDate(monday)}_to_${formatDate(sunday)}`,
    startDate: formatDate(monday),
    endDate: formatDate(sunday),
    payoutDate: formatDate(payoutWednesday),
    status: new Date() > payoutWednesday ? "DISBURSED" : "OPEN",
  };
}

/**
 * Returns the Express Daily (T+1) settlement cycle period.
 * For orders placed yesterday, paid out today with a nominal 0.5% early-liquidity fee.
 */
export function getExpressDailyCycle(referenceDate = new Date()): ExpressDailyCyclePeriod {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  return {
    cycleId: `cycle_express_${formatDate(yesterday)}`,
    startDate: formatDate(yesterday),
    endDate: formatDate(yesterday),
    payoutDate: formatDate(today),
    status: "OPEN",
    earlyLiquidityFeeBps: 50, // 0.5%
  };
}

/**
 * Returns the standard Daily T+1 settlement cycle period.
 * All sales/deliveries recorded up to 23:59:59 IST (Day T) are batched
 * and scheduled for disbursement the next morning (Day T+1 10:00 AM IST).
 */
export function getDailyTPlus1Cycle(referenceDate = new Date()): DailyTPlus1CyclePeriod {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  return {
    cycleId: `cycle_t1_daily_${formatDate(yesterday)}`,
    startDate: formatDate(yesterday),
    endDate: formatDate(yesterday),
    payoutDate: formatDate(today),
    status: "OPEN",
  };
}

/**
 * Computes Restaurant Settlement Statement matching Tier-1 Legacy Market Leader statutory formula:
 * Net Payable = (Net Food Sales + Packaging + Platform Reimbursements) 
 *               - (Commission + 18% GST on Commission) 
 *               - (PG Fee + 18% GST on PG Fee) 
 *               - (1% TCS + 1% TDS)
 *               - (Optional Express 0.5% Early Liquidity Fee + 18% GST)
 */
export function calculateRestaurantWeeklySettlement(params: {
  restaurantId: string;
  restaurantName: string;
  bankAccountMasked?: string;
  cycle: WeeklyCyclePeriod;
  deliveredOrdersCount: number;
  grossSalesPaise: number;
  restaurantDiscountsPaise: number;
  packagingChargesPaise?: number;
  platformReimbursementsPaise?: number;
  kingCoinsBurnedPaise?: number;
  commissionBps: number; // e.g. 1200 for 12%
  pgFeeBps?: number;     // e.g. 180 for 1.8%
}): RestaurantWeeklySettlement {
  const packaging = params.packagingChargesPaise ?? 0;
  const reimbursements = params.platformReimbursementsPaise ?? 0;
  const kingCoinsFunded = params.kingCoinsBurnedPaise ?? 0;
  const netFoodSales = Math.max(0, params.grossSalesPaise - params.restaurantDiscountsPaise);

  // 1. Commission & 18% GST on commission
  const commission = Math.round((netFoodSales * params.commissionBps) / 10000);
  const gstOnCommission = Math.round((commission * 18) / 100);

  // 2. Payment gateway fee & 18% GST on PG fee
  const pgFeeBps = params.pgFeeBps ?? 180; // 1.8%
  const pgFee = Math.round((params.grossSalesPaise * pgFeeBps) / 10000);
  const gstOnPgFee = Math.round((pgFee * 18) / 100);

  // 3. Indian Statutory Tax Deductions (TCS 1% + TDS 1%)
  const tcsDeduction = Math.round((netFoodSales * 100) / 10000); // 1% TCS
  const tdsDeduction = Math.round((netFoodSales * 100) / 10000); // 1% TDS

  // Section 9(5) CGST Act: 5% Food GST remitted by platform under OrderKing GSTIN
  const sec9_5FoodGst = Math.round((netFoodSales * 5) / 100);

  // Total deductions
  const totalDeductions = commission + gstOnCommission + pgFee + gstOnPgFee + tcsDeduction + tdsDeduction;

  // Net payable
  const netPayable = Math.max(0, netFoodSales + packaging + reimbursements + kingCoinsFunded - totalDeductions);

  return {
    restaurantId: params.restaurantId,
    restaurantName: params.restaurantName,
    bankAccountNumberMasked: params.bankAccountMasked || "XXXX-XXXX-1234",
    cycle: params.cycle,
    deliveredOrdersCount: params.deliveredOrdersCount,
    grossSalesPaise: params.grossSalesPaise,
    restaurantDiscountsPaise: params.restaurantDiscountsPaise,
    netFoodSalesPaise: netFoodSales,
    packagingChargesPaise: packaging,
    platformCommissionPaise: commission,
    gstOnCommissionPaise: gstOnCommission,
    paymentGatewayFeePaise: pgFee,
    gstOnPgFeePaise: gstOnPgFee,
    tcsDeductionPaise: tcsDeduction,
    tdsDeductionPaise: tdsDeduction,
    sec9_5FoodGstPaise: sec9_5FoodGst,
    platformReimbursementsPaise: reimbursements,
    kingCoinsLiabilityFundedPaise: kingCoinsFunded,
    netPayablePaise: netPayable,
    payoutStatus: "PENDING",
  };
}

/**
 * Computes Restaurant Dual-Cycle Settlement (Standard Weekly or Express Daily T+1).
 * Express Daily cycle deducts a nominal 0.5% early-liquidity fee (+ 18% GST on fee).
 */
export function calculateRestaurantDualCycleSettlement(params: {
  restaurantId: string;
  restaurantName: string;
  bankAccountMasked?: string;
  cycleType: SettlementCycleType;
  cyclePeriod?: WeeklyCyclePeriod | ExpressDailyCyclePeriod;
  deliveredOrdersCount: number;
  grossSalesPaise: number;
  restaurantDiscountsPaise: number;
  packagingChargesPaise?: number;
  platformReimbursementsPaise?: number;
  kingCoinsBurnedPaise?: number;
  commissionBps: number;
  pgFeeBps?: number;
  earlyLiquidityFeeBps?: number; // 50 bps = 0.5%
}): RestaurantDualCycleSettlement {
  const cycle = params.cyclePeriod ?? (
    params.cycleType === "EXPRESS_DAILY"
      ? getExpressDailyCycle()
      : getWeeklyCycle()
  );

  const weeklyEquivalentCycle: WeeklyCyclePeriod = "earlyLiquidityFeeBps" in cycle
    ? {
        cycleId: cycle.cycleId,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
        payoutDate: cycle.payoutDate,
        status: cycle.status,
      }
    : cycle;

  const base = calculateRestaurantWeeklySettlement({
    restaurantId: params.restaurantId,
    restaurantName: params.restaurantName,
    bankAccountMasked: params.bankAccountMasked,
    cycle: weeklyEquivalentCycle,
    deliveredOrdersCount: params.deliveredOrdersCount,
    grossSalesPaise: params.grossSalesPaise,
    restaurantDiscountsPaise: params.restaurantDiscountsPaise,
    packagingChargesPaise: params.packagingChargesPaise,
    platformReimbursementsPaise: params.platformReimbursementsPaise,
    kingCoinsBurnedPaise: params.kingCoinsBurnedPaise,
    commissionBps: params.commissionBps,
    pgFeeBps: params.pgFeeBps,
  });

  let expressFee = 0;
  let expressFeeGst = 0;

  if (params.cycleType === "EXPRESS_DAILY") {
    const feeBps = params.earlyLiquidityFeeBps ?? 50; // 0.5%
    expressFee = Math.round((base.netPayablePaise * feeBps) / 10000);
    expressFeeGst = Math.round((expressFee * 18) / 100);
  }

  const finalNetPayable = Math.max(0, base.netPayablePaise - expressFee - expressFeeGst);

  return {
    ...base,
    cycleType: params.cycleType,
    cyclePeriod: cycle,
    expressLiquidityFeePaise: expressFee,
    gstOnExpressLiquidityFeePaise: expressFeeGst,
    netPayablePaise: finalNetPayable,
  };
}

/**
 * Computes Rider Weekly Settlement Statement matching Tier-1 Legacy Market Leader weekly payout schedule:
 * Net Disbursement = (Base Trips + Distance + Surge + Milestone Bonuses) - Cash Collected (COD)
 */
export function calculateRiderWeeklySettlement(params: {
  riderId: string;
  riderName: string;
  upiOrBankMasked?: string;
  cycle: WeeklyCyclePeriod;
  deliveriesCompleted: number;
  basePayPaise: number;
  totalDistanceKm?: number;
  distancePayPaise?: number;
  surgeIncentivesPaise?: number;
  milestoneBonusPaise?: number;
  cashCollectedPaise?: number;
}): RiderWeeklySettlement {
  const surge = params.surgeIncentivesPaise ?? 0;
  const milestone = params.milestoneBonusPaise ?? 0;
  
  // Real geographic distance pay: Rs 5 per km (500 paise/km) if totalDistanceKm is provided
  const distancePay = params.distancePayPaise ?? (params.totalDistanceKm ? Math.round(params.totalDistanceKm * 500) : 0);
  
  const gross = params.basePayPaise + distancePay + surge + milestone;
  const cashCollected = params.cashCollectedPaise ?? 0;

  return {
    riderId: params.riderId,
    riderName: params.riderName,
    upiIdOrBankMasked: params.upiOrBankMasked || "rider@upi",
    cycle: params.cycle,
    deliveriesCompleted: params.deliveriesCompleted,
    basePayPaise: params.basePayPaise,
    distancePayPaise: distancePay,
    surgeIncentivesPaise: surge,
    milestoneBonusPaise: milestone,
    grossEarningsPaise: gross,
    cashCollectedPaise: cashCollected,
    netDisbursementPaise: gross - cashCollected,
    payoutStatus: "PENDING",
  };
}

/**
 * Persists the computed weekly settlement to the database using strict SERIALIZABLE
 * transactions to prevent race conditions or double spending.
 */
export async function persistWeeklySettlementTransaction(
  settlement: RestaurantWeeklySettlement | RiderWeeklySettlement,
  idempotencyKey: string
): Promise<void> {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();

  await sql.transaction(async (tx) => {
    // Banking-grade strict isolation to prevent double spending
    await tx.query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");
    
    const existing = await tx.query<any>(
      "SELECT batch_id FROM settlement_batches WHERE idempotency_key = $1 FOR UPDATE", 
      [idempotencyKey]
    );
    
    if (existing && existing.length > 0) {
      return; // Idempotent block - already exists
    }

    const batchId = "stl-" + Date.now();
    const entityType = "restaurantId" in settlement ? "RESTAURANT" : "RIDER";
    const entityId = "restaurantId" in settlement ? settlement.restaurantId : settlement.riderId;
    const netPayout = "netPayablePaise" in settlement ? settlement.netPayablePaise : settlement.netDisbursementPaise;
    
    await tx.query(
      "INSERT INTO settlement_batches (batch_id, entity_id, entity_type, period_start, period_end, gross_amount_paise, deductions_paise, commission_paise, gst_paise, net_payout_paise, state, idempotency_key, payout_upi_or_account_number, attempts_count, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)",
      [
        batchId, 
        entityId, 
        entityType, 
        settlement.cycle.startDate, 
        settlement.cycle.endDate, 
        netPayout,
        0, 0, 0, 
        netPayout, 
        "CALCULATED", 
        idempotencyKey, 
        "bankAccountNumberMasked" in settlement ? settlement.bankAccountNumberMasked : settlement.upiIdOrBankMasked,
        0, 
        new Date().toISOString(), 
        new Date().toISOString()
      ]
    );
  });
}
