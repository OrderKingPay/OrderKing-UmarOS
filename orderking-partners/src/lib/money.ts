/**
 * Integer-paise money. Never use floating-point for INR amounts.
 * 1 rupee = 100 paise. All persisted financial values are integer paise.
 */

export type Paise = number;

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MoneyError";
  }
}

export function assertPaise(value: unknown, label = "amount"): Paise {
  if (typeof value !== "number" || !Number.isInteger(value) || !Number.isSafeInteger(value)) {
    throw new MoneyError(`${label} must be a safe integer number of paise`);
  }
  return value;
}

export function paise(value: number): Paise {
  return assertPaise(value);
}

/** Convert a rupee decimal collected at an input boundary into paise. */
export function rupeesToPaise(rupees: number): Paise {
  if (!Number.isFinite(rupees)) throw new MoneyError("rupees must be finite");
  return Math.round(rupees * 100);
}

export function paiseToRupeeParts(amount: Paise): { sign: string; rupees: number; paise: number } {
  const v = assertPaise(amount);
  const sign = v < 0 ? "-" : "";
  const abs = Math.abs(v);
  return { sign, rupees: Math.floor(abs / 100), paise: abs % 100 };
}

export function formatINR(amount: Paise): string {
  const { sign, rupees, paise: p } = paiseToRupeeParts(amount);
  return `${sign}₹${rupees.toLocaleString("en-IN")}.${String(p).padStart(2, "0")}`;
}

export function addPaise(...amounts: Paise[]): Paise {
  let total = 0;
  for (const a of amounts) {
    total += assertPaise(a);
    if (!Number.isSafeInteger(total)) throw new MoneyError("paise overflow");
  }
  return total;
}

export function subPaise(left: Paise, right: Paise): Paise {
  const result = assertPaise(left) - assertPaise(right);
  if (!Number.isSafeInteger(result)) throw new MoneyError("paise overflow");
  return result;
}

export function mulBps(amount: Paise, bps: number): Paise {
  assertPaise(amount, "amount");
  if (!Number.isInteger(bps)) throw new MoneyError("bps must be an integer");
  // Round half away from zero on the paise result of amount * bps / 10000.
  const prod = amount * bps;
  if (!Number.isSafeInteger(prod)) throw new MoneyError("commission overflow");
  const abs = Math.abs(prod);
  const q = Math.floor(abs / 10000);
  const r = abs % 10000;
  const rounded = q + (r >= 5000 ? 1 : 0);
  return prod < 0 ? -rounded : rounded;
}

export function percentOf(amount: Paise, percent: number): Paise {
  if (!Number.isInteger(percent)) throw new MoneyError("percent must be an integer");
  return mulBps(amount, percent * 100);
}

/**
 * Standard delivery commission tiers & negotiated take-rates.
 * Standard delivery is 28% (2800 bps) to properly fund delivery partner logistics.
 * Dine-in commission remains 0% (sovereign ordering).
 * Enterprise/growth tiers allow negotiated commission between 18% and 35%.
 */
export const DELIVERY_COMMISSION_TIERS = {
  DINE_IN: 0,
  ENTERPRISE: 1800,
  GROWTH: 2200,
  STANDARD: 2500,
  FULL_SERVICE: 2800,
} as const;

export type DeliveryCommissionTierKey = keyof typeof DELIVERY_COMMISSION_TIERS;

export interface DeliveryCommissionTierMeta {
  key: DeliveryCommissionTierKey;
  bps: number;
  percentage: number;
  label: string;
  description: string;
}

export const DELIVERY_COMMISSION_TIER_LIST: readonly DeliveryCommissionTierMeta[] = [
  {
    key: "DINE_IN",
    bps: DELIVERY_COMMISSION_TIERS.DINE_IN,
    percentage: 0,
    label: "0% Dine-In Sovereign",
    description: "0% commission for dine-in & customer pickup (self-fulfillment)",
  },
  {
    key: "ENTERPRISE",
    bps: DELIVERY_COMMISSION_TIERS.ENTERPRISE,
    percentage: 18,
    label: "18% Enterprise Tier",
    description: "18% negotiated high-volume brand commission",
  },
  {
    key: "GROWTH",
    bps: DELIVERY_COMMISSION_TIERS.GROWTH,
    percentage: 22,
    label: "22% Growth Partner",
    description: "22% multi-outlet growth partner commission",
  },
  {
    key: "STANDARD",
    bps: DELIVERY_COMMISSION_TIERS.STANDARD,
    percentage: 25,
    label: "25% Standard Delivery",
    description: "25% standard marketplace delivery commission",
  },
  {
    key: "FULL_SERVICE",
    bps: DELIVERY_COMMISSION_TIERS.FULL_SERVICE,
    percentage: 28,
    label: "28% Full Service (Default)",
    description: "28% standard industry full-service delivery with dedicated rider fleet",
  },
] as const;

export const STATUTORY_TAX_RATES = {
  /** 18% GST on Platform Commission (SAC 9985 / Section 9(1) CGST Act 2017) */
  COMMISSION_GST_BPS: 1800,
  COMMISSION_CGST_BPS: 900,
  COMMISSION_SGST_BPS: 900,

  /** 5% GST on Restaurant Services (Section 9(5) CGST Act 2017) - Platform Liability remitted to Govt */
  SEC9_5_FOOD_GST_BPS: 500,
  SEC9_5_CGST_BPS: 250,
  SEC9_5_SGST_BPS: 250,

  /** 1% TCS under Section 52 of CGST Act 2017 on net taxable supply */
  TCS_SEC52_BPS: 100,
  TCS_CGST_BPS: 50,
  TCS_SGST_BPS: 50,

  /** 1% TDS under Section 194-O of Income Tax Act 1961 on gross sales */
  TDS_SEC194_O_BPS: 100,

  /** Express Daily Cycle (T+1) nominal early-liquidity fee: 0.5% (50 bps) */
  EXPRESS_DAILY_EARLY_LIQUIDITY_FEE_BPS: 50,

  /** Standard Payment Gateway processing fee: 1.84% (184 bps) */
  PAYMENT_GATEWAY_FEE_BPS: 184,
  PAYMENT_GATEWAY_GST_BPS: 1800,

  /** Amortized recurring platform onboarding fee per batch/cycle (₹99.00 = 9900 paise) */
  AMORTIZED_ONBOARDING_FEE_PAISE: 9900,

  /** One-Time Direct Settlement platform onboarding fee (₹499.00 = 49900 paise) */
  ONE_TIME_ONBOARDING_FEE_PAISE: 49900,
} as const;

export const PAYMENT_GATEWAY_CONFIG = {
  FEE_BPS: 184, // 184 bps = 1.84% Payment gateway processing fee
  GST_BPS: 1800, // 1800 bps = 18.00% GST on Payment gateway fee
} as const;

export function calculatePaymentGatewayFee(grossTransactionPaise: Paise): {
  pgFeeBasePaise: Paise;
  pgFeeGstPaise: Paise;
  totalPgFeePaise: Paise;
} {
  const base = mulBps(grossTransactionPaise, PAYMENT_GATEWAY_CONFIG.FEE_BPS);
  const gst = mulBps(base, PAYMENT_GATEWAY_CONFIG.GST_BPS);
  return {
    pgFeeBasePaise: base,
    pgFeeGstPaise: gst,
    totalPgFeePaise: addPaise(base, gst),
  };
}

export type SettlementCycleType = "STANDARD_WEEKLY" | "EXPRESS_DAILY";

export const ONBOARDING_FEE_CONFIG = {
  /** Option A: Zero Upfront Barrier / Default: ₹99/month for 6 months */
  AMORTIZED_MONTHLY_FEE_PAISE: 9900, // ₹99.00
  AMORTIZED_DURATION_MONTHS: 6,
  TOTAL_AMORTIZED_FEE_PAISE: 59400, // ₹594.00 (6 * ₹99)

  /** Option B: One-Time Direct Settlement: ₹499 */
  ONE_TIME_SETTLEMENT_PAISE: 49900, // ₹499.00

  DEFAULT_OPTION: "AMORTIZED" as const,
  OPTION_A_LABEL:
    "Amortized Monthly Deduction of ₹99/month for 6 months (Deducted automatically from weekly payout batches)",
  OPTION_B_LABEL: "One-Time Direct Settlement of ₹499",
} as const;

export type OnboardingFeeOption = "AMORTIZED" | "ONE_TIME";

export interface OnboardingFeeDetails {
  option: OnboardingFeeOption;
  label: string;
  totalAmountPaise: Paise;
  monthlyDeductionPaise: Paise;
  durationMonths: number;
  isAmortized: boolean;
  deductionMechanism: string;
}

export function getOnboardingFeeDetails(option: OnboardingFeeOption = "AMORTIZED"): OnboardingFeeDetails {
  if (option === "ONE_TIME") {
    return {
      option: "ONE_TIME",
      label: ONBOARDING_FEE_CONFIG.OPTION_B_LABEL,
      totalAmountPaise: ONBOARDING_FEE_CONFIG.ONE_TIME_SETTLEMENT_PAISE,
      monthlyDeductionPaise: 0,
      durationMonths: 1,
      isAmortized: false,
      deductionMechanism: "One-time direct deduction from initial settlement payout batch",
    };
  }
  return {
    option: "AMORTIZED",
    label: ONBOARDING_FEE_CONFIG.OPTION_A_LABEL,
    totalAmountPaise: ONBOARDING_FEE_CONFIG.TOTAL_AMORTIZED_FEE_PAISE,
    monthlyDeductionPaise: ONBOARDING_FEE_CONFIG.AMORTIZED_MONTHLY_FEE_PAISE,
    durationMonths: ONBOARDING_FEE_CONFIG.AMORTIZED_DURATION_MONTHS,
    isAmortized: true,
    deductionMechanism: "Deducted automatically from weekly payout batches",
  };
}

export function calculateOnboardingCycleDeduction(
  option: OnboardingFeeOption,
  completedCycles: number
): Paise {
  if (option === "ONE_TIME") {
    return completedCycles === 0 ? ONBOARDING_FEE_CONFIG.ONE_TIME_SETTLEMENT_PAISE : 0;
  }
  return completedCycles < ONBOARDING_FEE_CONFIG.AMORTIZED_DURATION_MONTHS
    ? ONBOARDING_FEE_CONFIG.AMORTIZED_MONTHLY_FEE_PAISE
    : 0;
}

export type SettlementBreakdown = {
  // Order Credits & Base Values
  foodValuePaise: Paise;
  packingPaise: Paise;
  grossSalesPaise: Paise;
  restaurantDiscountPaise: Paise;
  netTaxableSupplyPaise: Paise;
  platformFundedDiscountPaise: Paise;

  // Settlement Cycle
  cycleType: SettlementCycleType;

  // Commercial Commission
  commissionPaise: Paise;

  // Payment Gateway Fee & 18% GST (SAC 9985)
  gatewayFeePaise: Paise;
  gatewayFeeGstPaise: Paise;

  // Penalties & Dispute Adjustments
  penaltiesPaise: Paise;

  // Statutory Tax Deductions Debited from Restaurant
  commissionGstPaise: Paise;
  commissionCgstPaise: Paise;
  commissionSgstPaise: Paise;
  tcsSec52Paise: Paise;
  tcsCgstPaise: Paise;
  tcsSgstPaise: Paise;
  tdsSec194OPaise: Paise;

  // Statutory Platform Tax Liability (remitted directly by platform to Govt under Sec 9(5) CGST Act; NOT debited from restaurant)
  sec9_5GstPaise: Paise;
  sec9_5CgstPaise: Paise;
  sec9_5SgstPaise: Paise;
  platformLiabilitySec9_5Paise: Paise;

  // Express Daily Cycle (T+1) Early Liquidity Fee (0.5% + 18% GST)
  expressEarlyLiquidityFeePaise: Paise;
  expressEarlyLiquidityFeeGstPaise: Paise;

  // Amortized Onboarding Fee (₹99.00 / 9900 paise recurring deduction per batch/cycle)
  amortizedOnboardingFeePaise: Paise;

  // Other Permitted Deductions & Adjustments
  otherDeductionsPaise: Paise;
  otherDeductionsCode: string | null;
  refundAdjustmentPaise: Paise;

  // Total Debited Deductions (excludes Sec 9(5) platform liability)
  totalDeductionsPaise: Paise;

  // Net Restaurant Payable (NRP) in integer paise
  restaurantPayablePaise: Paise;
  netRestaurantPayablePaise: Paise;
};

export type ComputeRestaurantPayableInput = {
  foodValuePaise: Paise;
  packingPaise: Paise;
  restaurantDiscountPaise: Paise;
  platformFundedDiscountPaise: Paise;
  commissionBps?: number;
  commissionPaise?: Paise;
  cycleType?: SettlementCycleType;
  gatewayFeePaise?: Paise;
  gatewayFeeBps?: number;
  penaltiesPaise?: Paise;
  earlyLiquidityFeeBps?: number;
  otherDeductionsPaise?: Paise;
  otherDeductionsCode?: string | null;
  refundAdjustmentPaise?: Paise;
  // Statutory and commercial options (enabled by default)
  applyGstOnCommission?: boolean;
  applySec9_5Gst?: boolean;
  applyTcsSec52?: boolean;
  applyTdsSec194O?: boolean;
  applyOnboardingFee?: boolean;
  amortizedOnboardingFeePaise?: Paise;
  commissionGstBps?: number;
  sec9_5GstBps?: number;
  tcsSec52Bps?: number;
  tdsSec194OBps?: number;
  isTableQrOrder?: boolean;
  orderType?: "DELIVERY" | "DINE_IN" | "TABLE_QR" | "PICKUP";
  applyPaymentGatewayPassThrough?: boolean;
};

/**
 * Computes Indian statutory settlement and Net Restaurant Payable (NRP).
 * Handles:
 * - Food Value & Packaging Charges (+ credit)
 * - Restaurant-Funded Discounts (- debit to derive Net Taxable Supply)
 * - Platform Commission (- debit; strictly 0% for Table QR dine-in orders)
 * - 18% GST on Platform Commission (- debit, 9% CGST + 9% SGST)
 * - Payment Gateway Fees (184 bps = 1.84% + 18% GST) (- debit when passed through)
 * - Penalties & Merchant Deductions (- debit)
 * - CGST Act Section 9(5) 5% GST calculation (tracked and recorded as platform liability remitted directly to Govt, not debited from restaurant payable)
 * - TCS under Section 52 of CGST Act (1% on net taxable supply) (- debit)
 * - TDS under Section 194-O of Income Tax Act (1% on gross sales) (- debit)
 * - Express Daily (T+1) early liquidity fee (0.5% + 18% GST) (- debit when cycleType = "EXPRESS_DAILY")
 * - Amortized Onboarding Fee (₹99.00 / 9900 paise recurring deduction per batch/cycle) (- debit)
 * - Platform-Funded Promotional Subsidies (+ credit)
 * - Other Permitted Deductions (with mandatory reason code) (- debit)
 * - Refund Adjustments (+/-)
 * - Net Restaurant Payable (NRP) in integer paise with ZERO floating-point rounding drift.
 */
export function computeRestaurantPayable(input: ComputeRestaurantPayableInput): SettlementBreakdown {
  const food = assertPaise(input.foodValuePaise, "foodValuePaise");
  const packing = assertPaise(input.packingPaise, "packingPaise");
  const restDisc = assertPaise(input.restaurantDiscountPaise, "restaurantDiscountPaise");
  const platDisc = assertPaise(
    input.platformFundedDiscountPaise,
    "platformFundedDiscountPaise",
  );
  const other = assertPaise(input.otherDeductionsPaise ?? 0, "otherDeductionsPaise");
  const penalties = assertPaise(input.penaltiesPaise ?? 0, "penaltiesPaise");
  const refund = assertPaise(input.refundAdjustmentPaise ?? 0, "refundAdjustmentPaise");
  const cycleType: SettlementCycleType = input.cycleType ?? "STANDARD_WEEKLY";
  const isTableQr = input.isTableQrOrder === true || input.orderType === "TABLE_QR" || input.orderType === "DINE_IN";

  if (other !== 0 && !input.otherDeductionsCode) {
    throw new MoneyError("other deductions require an explicit reason code");
  }

  // 1. Gross Sales (Food Value & Packaging Charges are credits to restaurant)
  const grossSales = addPaise(food, packing);

  // 2. Net Taxable Supply (Food Value + Packaging - Restaurant-Funded Discounts)
  const netTaxableSupply = subPaise(grossSales, restDisc);
  const taxableBase = netTaxableSupply < 0 ? 0 : netTaxableSupply;

  // 3. Platform Commission (- debit)
  // Enforce 0% dine-in commission on Table QR orders
  const effectiveCommissionBps = isTableQr ? 0 : (input.commissionBps ?? 0);
  if (input.commissionBps !== undefined && !isTableQr) {
    if (!Number.isInteger(input.commissionBps)) {
      throw new MoneyError("commissionBps must be an integer");
    }
    if (input.commissionBps < 0) {
      throw new MoneyError("commissionBps cannot be negative");
    }
  }

  const commission = isTableQr
    ? 0
    : input.commissionPaise !== undefined
      ? assertPaise(input.commissionPaise, "commissionPaise")
      : mulBps(taxableBase, effectiveCommissionBps);

  // 4. 18% GST on Platform Commission (- debit, 9% CGST + 9% SGST)
  const commGstBps = input.commissionGstBps ?? STATUTORY_TAX_RATES.COMMISSION_GST_BPS;
  const commissionGst = input.applyGstOnCommission === false || isTableQr ? 0 : mulBps(commission, commGstBps);
  const commissionCgst = Math.floor(commissionGst / 2);
  const commissionSgst = subPaise(commissionGst, commissionCgst);

  // 5. Payment Gateway Processing Fee & 18% GST (184 bps = 1.84% + 18% GST)
  let gatewayFee = 0;
  let gatewayFeeGst = 0;
  if (input.gatewayFeePaise !== undefined) {
    gatewayFee = assertPaise(input.gatewayFeePaise, "gatewayFeePaise");
  } else if (input.gatewayFeeBps !== undefined) {
    gatewayFee = mulBps(grossSales, input.gatewayFeeBps);
  } else if (input.applyPaymentGatewayPassThrough === true) {
    gatewayFee = mulBps(grossSales, PAYMENT_GATEWAY_CONFIG.FEE_BPS);
  }
  if (gatewayFee > 0) {
    gatewayFeeGst = mulBps(gatewayFee, STATUTORY_TAX_RATES.PAYMENT_GATEWAY_GST_BPS);
  }

  // 6. CGST Act Section 9(5) 5% GST calculation (tracked and recorded as platform liability remitted directly to Govt, not debited from restaurant payable)
  const sec9_5Bps = input.sec9_5GstBps ?? STATUTORY_TAX_RATES.SEC9_5_FOOD_GST_BPS;
  const sec9_5Gst = input.applySec9_5Gst === false ? 0 : mulBps(taxableBase, sec9_5Bps);
  const sec9_5Cgst = Math.floor(sec9_5Gst / 2);
  const sec9_5Sgst = subPaise(sec9_5Gst, sec9_5Cgst);
  const platformLiabilitySec9_5 = sec9_5Gst;

  // 7. TCS under Section 52 of CGST Act (1% on net taxable supply) (- debit)
  const tcsBps = input.tcsSec52Bps ?? STATUTORY_TAX_RATES.TCS_SEC52_BPS;
  const tcsSec52 = input.applyTcsSec52 === false ? 0 : mulBps(taxableBase, tcsBps);
  const tcsCgst = Math.floor(tcsSec52 / 2);
  const tcsSgst = subPaise(tcsSec52, tcsCgst);

  // 8. TDS under Section 194-O of Income Tax Act (1% on gross sales) (- debit)
  const tdsBps = input.tdsSec194OBps ?? STATUTORY_TAX_RATES.TDS_SEC194_O_BPS;
  const tdsBase = grossSales < 0 ? 0 : grossSales;
  const tdsSec194O = input.applyTdsSec194O === false ? 0 : mulBps(tdsBase, tdsBps);

  // 9. Amortized Onboarding Fee (₹99.00 / 9900 paise recurring deduction per batch/cycle) (- debit)
  let onboardingFee = 0;
  if (input.amortizedOnboardingFeePaise !== undefined) {
    onboardingFee = assertPaise(input.amortizedOnboardingFeePaise, "amortizedOnboardingFeePaise");
  } else if (input.applyOnboardingFee === true) {
    onboardingFee = STATUTORY_TAX_RATES.AMORTIZED_ONBOARDING_FEE_PAISE;
  }

  // 10. Express Daily (T+1) Early Liquidity Fee (0.5% + 18% GST)
  let expressFee = 0;
  let expressFeeGst = 0;
  if (cycleType === "EXPRESS_DAILY") {
    const preliminaryNet = Math.max(
      0,
      grossSales -
        restDisc +
        platDisc -
        (commission + commissionGst + gatewayFee + gatewayFeeGst + penalties + other + tcsSec52 + tdsSec194O + onboardingFee) +
        refund
    );
    const expressBps = input.earlyLiquidityFeeBps ?? STATUTORY_TAX_RATES.EXPRESS_DAILY_EARLY_LIQUIDITY_FEE_BPS;
    expressFee = mulBps(preliminaryNet, expressBps);
    expressFeeGst = mulBps(expressFee, STATUTORY_TAX_RATES.COMMISSION_GST_BPS);
  }

  // Total debited deductions (note: Section 9(5) is platform liability, NOT debited from restaurant)
  const totalDeductions = addPaise(
    commission,
    commissionGst,
    gatewayFee,
    gatewayFeeGst,
    penalties,
    tcsSec52,
    tdsSec194O,
    expressFee,
    expressFeeGst,
    onboardingFee,
    other,
  );

  // Net Restaurant Payable (NRP) in integer paise with ZERO floating-point rounding drift
  const payable = addPaise(
    grossSales,
    -restDisc,
    platDisc,
    -totalDeductions,
    refund,
  );

  return {
    foodValuePaise: food,
    packingPaise: packing,
    grossSalesPaise: grossSales,
    restaurantDiscountPaise: restDisc,
    netTaxableSupplyPaise: netTaxableSupply,
    platformFundedDiscountPaise: platDisc,
    cycleType,
    commissionPaise: commission,
    gatewayFeePaise: gatewayFee,
    gatewayFeeGstPaise: gatewayFeeGst,
    penaltiesPaise: penalties,
    commissionGstPaise: commissionGst,
    commissionCgstPaise: commissionCgst,
    commissionSgstPaise: commissionSgst,
    sec9_5GstPaise: sec9_5Gst,
    sec9_5CgstPaise: sec9_5Cgst,
    sec9_5SgstPaise: sec9_5Sgst,
    platformLiabilitySec9_5Paise: platformLiabilitySec9_5,
    tcsSec52Paise: tcsSec52,
    tcsCgstPaise: tcsCgst,
    tcsSgstPaise: tcsSgst,
    tdsSec194OPaise: tdsSec194O,
    expressEarlyLiquidityFeePaise: expressFee,
    expressEarlyLiquidityFeeGstPaise: expressFeeGst,
    amortizedOnboardingFeePaise: onboardingFee,
    otherDeductionsPaise: other,
    otherDeductionsCode: input.otherDeductionsCode ?? null,
    refundAdjustmentPaise: refund,
    totalDeductionsPaise: totalDeductions,
    restaurantPayablePaise: payable,
    netRestaurantPayablePaise: payable,
  };
}
