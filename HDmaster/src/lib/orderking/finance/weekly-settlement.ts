/**
 * Zomato / Swiggy Compatible Weekly Settlement Engine for Order King
 * Standard Indian Food Delivery Cycle:
 * - Cycle: Monday 00:00:00 to Sunday 23:59:59 IST
 * - Payout Day: Wednesday (Disbursed via NEFT/IMPS/Razorpay Route)
 */

export type WeeklyCyclePeriod = {
  cycleId: string;
  startDate: string; // YYYY-MM-DD (Monday)
  endDate: string;   // YYYY-MM-DD (Sunday)
  payoutDate: string;// YYYY-MM-DD (Wednesday)
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
  netPayablePaise: number;
  payoutStatus: "PENDING" | "PROCESSING" | "PAID";
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
 * Computes Restaurant Weekly Settlement Statement matching Zomato's exact tax & commission formula:
 * Net Payable = (Net Food Sales + Packaging + Platform Reimbursements) 
 *               - (Commission + 18% GST on Commission) 
 *               - (PG Fee + 18% GST on PG Fee) 
 *               - (1% TCS + 1% TDS)
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

  // Total deductions
  const totalDeductions = commission + gstOnCommission + pgFee + gstOnPgFee + tcsDeduction + tdsDeduction;

  // Net payable
  const netPayable = Math.max(0, netFoodSales + packaging + reimbursements - totalDeductions);

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
    platformReimbursementsPaise: reimbursements,
    netPayablePaise: netPayable,
    payoutStatus: "PENDING",
  };
}

/**
 * Computes Rider Weekly Settlement Statement matching Zomato's weekly payout schedule:
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
