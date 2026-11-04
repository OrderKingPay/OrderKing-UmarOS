/**
 * DAILY BUSINESS SUMMARY & SETTLEMENT LEDGER ENGINE
 * Authentic Tier-1 Legacy Leader Owner Performance & Financial Parity:
 * - Today's Delivered Orders Count
 * - Gross GMV (Paise to INR)
 * - Total Deductions Breakdown:
 *   * Platform Commission (e.g. 2500 bps = 25%)
 *   * GST Breakdown: GST on Services (18%) vs Section 9(5) Food GST (5%)
 *   * Payment Gateway Fees (1.84% + 18% GST)
 * - Net Estimated Payout for Today
 * - Next Settlement Date (T+1 Daily Payout timer to Tomorrow 08:00 AM)
 */

import {
  formatINR,
  mulBps,
  addPaise,
  subPaise,
  STATUTORY_TAX_RATES,
  type Paise,
} from "@/lib/money";

export interface DeliveredOrderInput {
  id: string;
  orderNumber?: string;
  foodValuePaise: Paise;
  packingPaise?: Paise;
  restaurantDiscountPaise?: Paise;
  platformFundedDiscountPaise?: Paise;
  commissionBps?: number;
  paymentMethod?: string;
  isCod?: boolean;
}

export interface DailyBusinessSummary {
  deliveredOrdersCount: number;
  grossGmvPaise: Paise;
  totalFoodValuePaise: Paise;
  totalPackingPaise: Paise;
  totalRestaurantDiscountsPaise: Paise;
  totalPlatformDiscountsPaise: Paise;
  netTaxableSupplyPaise: Paise;

  // Deductions Breakdown
  platformCommissionPaise: Paise;
  commissionGstPaise: Paise; // 18% on Platform Commission (SAC 9985)
  servicesGstTotalPaise: Paise; // Total GST on Services (Commission GST + PG GST)
  sec9_5GstPaise: Paise; // 5% GST Section 9(5) CGST Act 2017 (Platform Liability)
  gatewayFeePaise: Paise; // 1.84% PG Fee
  gatewayFeeGstPaise: Paise; // 18% GST on PG Fee
  totalGatewayFeeWithGstPaise: Paise;
  totalDebitedDeductionsPaise: Paise; // Debited from Merchant: Commission + Commission GST + PG Fee with GST

  // Net Payout
  netEstimatedPayoutPaise: Paise;

  // Settlement Timing
  nextSettlementDate: string; // ISO timestamp (Tomorrow 10:00 AM)
  nextSettlementFormatted: string;
  tPlus1RemainingMs: number;
  tPlus1Countdown: string;
  settlementCycle: "T+1 Express Daily Payout";
}

/**
 * Calculates the exact Tomorrow 10:00 AM timestamp for T+1 Daily Payout.
 * All orders completed up to 12:00 Midnight are compiled and scheduled for bank transfer by 10:00 AM next morning.
 */
export function getNextSettlementTimestamp(refDate: Date = new Date(), targetHour: number = 10): Date {
  const target = new Date(refDate.getTime());
  target.setDate(target.getDate() + 1);
  target.setHours(targetHour, 0, 0, 0);
  return target;
}

/**
 * Formats remaining time until next T+1 daily settlement batch.
 */
export function formatTPlus1Countdown(
  nextSettlementDate: Date,
  refDate: Date = new Date()
): { remainingMs: number; formatted: string } {
  const diffMs = nextSettlementDate.getTime() - refDate.getTime();
  if (diffMs <= 0) {
    return { remainingMs: 0, formatted: "Settlement processing..." };
  }

  const totalMinutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  return {
    remainingMs: diffMs,
    formatted: `${hours}h ${mins}m remaining`,
  };
}

/**
 * Computes authentic Tier-1 Leader Daily Business Performance & Settlement Ledger.
 */
export function calculateDailyBusinessSummary(
  orders: DeliveredOrderInput[],
  options?: {
    defaultCommissionBps?: number;
    refDate?: Date;
  }
): DailyBusinessSummary {
  const refDate = options?.refDate ?? new Date();
  const defaultBps = options?.defaultCommissionBps ?? 2500; // 25% default

  let totalFoodValuePaise: Paise = 0;
  let totalPackingPaise: Paise = 0;
  let totalRestaurantDiscountsPaise: Paise = 0;
  let totalPlatformDiscountsPaise: Paise = 0;
  let platformCommissionPaise: Paise = 0;
  let commissionGstPaise: Paise = 0;
  let sec9_5GstPaise: Paise = 0;
  let gatewayFeePaise: Paise = 0;
  let gatewayFeeGstPaise: Paise = 0;

  for (const o of orders) {
    const food = o.foodValuePaise || 0;
    const pack = o.packingPaise || 0;
    const restDisc = o.restaurantDiscountPaise || 0;
    const platDisc = o.platformFundedDiscountPaise || 0;
    const bps = o.commissionBps !== undefined ? o.commissionBps : defaultBps;

    totalFoodValuePaise = addPaise(totalFoodValuePaise, food);
    totalPackingPaise = addPaise(totalPackingPaise, pack);
    totalRestaurantDiscountsPaise = addPaise(totalRestaurantDiscountsPaise, restDisc);
    totalPlatformDiscountsPaise = addPaise(totalPlatformDiscountsPaise, platDisc);

    // Food + packing minus restaurant funded discount = Net Taxable Supply
    const taxableBase = Math.max(0, food + pack - restDisc);

    // Commercial Platform Commission (on food value)
    const comm = mulBps(taxableBase, bps);
    platformCommissionPaise = addPaise(platformCommissionPaise, comm);

    // 18% GST on Commission (SAC 9985 - Services)
    const commGst = mulBps(comm, STATUTORY_TAX_RATES.COMMISSION_GST_BPS);
    commissionGstPaise = addPaise(commissionGstPaise, commGst);

    // 5% GST Section 9(5) CGST Act 2017 (Platform Liability on Restaurant Services)
    const s95 = mulBps(taxableBase, STATUTORY_TAX_RATES.SEC9_5_FOOD_GST_BPS);
    sec9_5GstPaise = addPaise(sec9_5GstPaise, s95);

    // Payment Gateway Processing Fee (1.84% + 18% GST on non-COD orders)
    if (!o.isCod) {
      const orderTotal = taxableBase + s95;
      const pg = mulBps(orderTotal, STATUTORY_TAX_RATES.PAYMENT_GATEWAY_FEE_BPS);
      const pgGst = mulBps(pg, STATUTORY_TAX_RATES.PAYMENT_GATEWAY_GST_BPS);
      gatewayFeePaise = addPaise(gatewayFeePaise, pg);
      gatewayFeeGstPaise = addPaise(gatewayFeeGstPaise, pgGst);
    }
  }

  const grossGmvPaise = addPaise(totalFoodValuePaise, totalPackingPaise);
  const netTaxableSupplyPaise = Math.max(0, subPaise(grossGmvPaise, totalRestaurantDiscountsPaise));

  const totalGatewayFeeWithGstPaise = addPaise(gatewayFeePaise, gatewayFeeGstPaise);
  const servicesGstTotalPaise = addPaise(commissionGstPaise, gatewayFeeGstPaise);

  // Total debited deductions from merchant: Platform Commission + 18% GST on Commission + Payment Gateway Fees
  const totalDebitedDeductionsPaise = addPaise(
    platformCommissionPaise,
    commissionGstPaise,
    totalGatewayFeeWithGstPaise
  );

  // Net Restaurant Payable
  const netEstimatedPayoutPaise = Math.max(
    0,
    subPaise(netTaxableSupplyPaise, totalDebitedDeductionsPaise)
  );

  const nextSettlementDateObj = getNextSettlementTimestamp(refDate);
  const countdown = formatTPlus1Countdown(nextSettlementDateObj, refDate);

  const nextSettlementFormatted = `${nextSettlementDateObj.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })} at 10:00 AM`;

  return {
    deliveredOrdersCount: orders.length,
    grossGmvPaise,
    totalFoodValuePaise,
    totalPackingPaise,
    totalRestaurantDiscountsPaise,
    totalPlatformDiscountsPaise,
    netTaxableSupplyPaise,
    platformCommissionPaise,
    commissionGstPaise,
    servicesGstTotalPaise,
    sec9_5GstPaise,
    gatewayFeePaise,
    gatewayFeeGstPaise,
    totalGatewayFeeWithGstPaise,
    totalDebitedDeductionsPaise,
    netEstimatedPayoutPaise,
    nextSettlementDate: nextSettlementDateObj.toISOString(),
    nextSettlementFormatted,
    tPlus1RemainingMs: countdown.remainingMs,
    tPlus1Countdown: countdown.formatted,
    settlementCycle: "T+1 Express Daily Payout",
  };
}
