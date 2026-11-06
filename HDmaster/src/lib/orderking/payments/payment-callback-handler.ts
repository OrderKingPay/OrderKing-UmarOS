// @ts-nocheck
/**
 * ORDERKING / KINGPAY FINTECH ARCHITECTURE
 * Immutable Production Payment Callback Handler & Section 9(5) Tax Settlement
 * Statutory Entity: OrderKing / KingPay (GSTIN: 18AFXPH9838M1Z9, Assam - 788710)
 *
 * SPECIFICATION COMPLIANCE:
 * 1. Double-Entry Canonical Ledger: Sum(Debits) - Sum(Credits) === 0 paise strictly enforced.
 * 2. Section 9(5) CGST Act 2017: 5% Food GST dual split:
 *    - 2.5% CGST (Central Government Treasury)
 *    - 2.5% SGST (Assam State Government Treasury)
 *    - Inadmissible for Input Tax Credit (ITC blocked) per Notif 17/2021
 * 3. Section 9(1) CGST Act: 18% GST on platform service charges and commissions (SAC 9985)
 * 4. Sovereign Direct NPCI UPI VPAs: 'orderking@ybl' and '9395065587@ybl'
 */

import { canonicalLedger, type LedgerEntry, type LedgerTransaction } from "../finance/canonical-ledger";

export interface OrderPaymentCallbackInput {
  orderId: string;
  paymentId: string;
  gatewayOrderId?: string;
  paymentMethod: "NPCI_UPI" | "DIRECT_UPI" | "BHARAT_QR" | "RAZORPAY" | "KING_PAY" | "CARD" | "COD";
  vpa?: string;
  totalAmountPaise: number;
  foodSubtotalPaise: number;
  packagingChargePaise?: number;
  deliveryFeePaise?: number;
  platformFeePaise?: number;
  customerTipPaise?: number;
  restaurantId: string;
  riderId?: string;
  customerId?: string;
  idempotencyKey: string;
  isInterstate?: boolean;
  notes?: string;
}

export interface Section95DualTaxSplit {
  totalSec95TaxPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  rateBps: number;
  isInterstate: boolean;
  gstin: string;
}

export interface PaymentCallbackExecutionResult {
  success: boolean;
  transactionId: string;
  orderId: string;
  paymentId: string;
  totalDebitPaise: number;
  totalCreditPaise: number;
  netRestaurantPaise: number;
  riderPayoutPaise: number;
  platformFeePaise: number;
  platformGstPaise: number;
  sec95Tax: Section95DualTaxSplit;
  ledgerTransaction: LedgerTransaction;
}

/**
 * Calculates statutory Section 9(5) CGST (2.5%) and SGST (2.5%) dual tax split in integer paise.
 * Guarantees zero-float rounding drift by asserting integer arithmetic.
 */
export function calculateSection95DualSplit(
  foodSubtotalPaise: number,
  packagingChargePaise = 0,
  isInterstate = false
): Section95DualTaxSplit {
  if (!Number.isSafeInteger(foodSubtotalPaise) || foodSubtotalPaise < 0) {
    throw new Error(`Invalid foodSubtotalPaise: ${foodSubtotalPaise}`);
  }
  if (!Number.isSafeInteger(packagingChargePaise) || packagingChargePaise < 0) {
    throw new Error(`Invalid packagingChargePaise: ${packagingChargePaise}`);
  }

  const taxablePaise = foodSubtotalPaise + packagingChargePaise;
  // 5% statutory tax = 500 bps
  const totalSec95TaxPaise = Math.round((taxablePaise * 500) / 10000);

  if (isInterstate) {
    return {
      totalSec95TaxPaise,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: totalSec95TaxPaise,
      rateBps: 500,
      isInterstate: true,
      gstin: "18AFXPH9838M1Z9",
    };
  }

  // Intra-state (Assam): 2.5% CGST (250 bps) + 2.5% SGST (250 bps)
  const cgstPaise = Math.floor(totalSec95TaxPaise / 2);
  const sgstPaise = totalSec95TaxPaise - cgstPaise;

  // Invariant assertion: exact zero-variance split
  if (cgstPaise + sgstPaise !== totalSec95TaxPaise) {
    throw new Error(`Mathematical drift in Section 9(5) split: ${cgstPaise} + ${sgstPaise} !== ${totalSec95TaxPaise}`);
  }

  return {
    totalSec95TaxPaise,
    cgstPaise,
    sgstPaise,
    igstPaise: 0,
    rateBps: 500,
    isInterstate: false,
    gstin: "18AFXPH9838M1Z9",
  };
}

/**
 * Production Payment Callback Handler:
 * Executes immutable double-entry ledger capture splitting Section 9(5) CGST (2.5%) and SGST (2.5%)
 * with SHA-256 audit chaining and fail-closed idempotency.
 */
export async function handleOrderPaymentCallback(
  input: OrderPaymentCallbackInput
): Promise<PaymentCallbackExecutionResult> {
  const {
    orderId,
    paymentId,
    totalAmountPaise,
    foodSubtotalPaise,
    packagingChargePaise = 0,
    deliveryFeePaise = 0,
    platformFeePaise = 0,
    customerTipPaise = 0,
    restaurantId,
    riderId,
    customerId,
    idempotencyKey,
    isInterstate = false,
  } = input;

  if (!Number.isSafeInteger(totalAmountPaise) || totalAmountPaise <= 0) {
    throw new Error(`Total amount must be a positive SafeInteger: ${totalAmountPaise}`);
  }

  // 1. Calculate Section 9(5) 5% Food GST Dual Split (2.5% CGST + 2.5% SGST)
  const sec95Tax = calculateSection95DualSplit(
    foodSubtotalPaise,
    packagingChargePaise,
    isInterstate
  );

  // 2. Calculate 18% GST on Platform Fee (SAC 9985)
  const platformGstPaise = Math.round((platformFeePaise * 1800) / 10000);

  // 3. Calculate Rider Total Payout (Delivery fee + 100% pass-through customer tip)
  const riderPayoutPaise = deliveryFeePaise + customerTipPaise;

  // 4. Calculate Net Restaurant Payable (Gross Food + Packaging - Platform Deductions - Sec 9(5) Tax remitted by platform)
  const grossFoodPaise = foodSubtotalPaise + packagingChargePaise;
  const netRestaurantPaise = totalAmountPaise - (
    riderPayoutPaise +
    platformFeePaise +
    platformGstPaise +
    sec95Tax.totalSec95TaxPaise
  );

  if (netRestaurantPaise < 0) {
    throw new Error(`Calculated net restaurant payable cannot be negative: ${netRestaurantPaise} paise`);
  }

  // 5. Determine Debit Account (Clearing)
  let debitAccount: "BANK_CLEARING" | "CUSTOMER_WALLET" | "CUSTOMER_CASH_IN" = "BANK_CLEARING";
  let debitEntityId = "GATEWAY:CLEARING";
  let debitMemo = `Online customer payment for order #${orderId}`;

  const resolvedVpa = input.vpa || "orderking@ybl";

  if (input.paymentMethod === "NPCI_UPI" || input.paymentMethod === "DIRECT_UPI" || input.paymentMethod === "BHARAT_QR") {
    debitAccount = "BANK_CLEARING";
    debitEntityId = `NPCI_UPI:${resolvedVpa}`;
    debitMemo = `Direct NPCI UPI collection via ${resolvedVpa} for order #${orderId}`;
  } else if (input.paymentMethod === "KING_PAY") {
    debitAccount = "CUSTOMER_WALLET";
    debitEntityId = customerId || "KINGPAY_USER_WALLET";
    debitMemo = `KingPay wallet payment debit for order #${orderId}`;
  } else if (input.paymentMethod === "COD") {
    debitAccount = "CUSTOMER_CASH_IN";
    debitEntityId = riderId || "RIDER_POCKET_HOLDING";
    debitMemo = `Rider doorstep cash collection for order #${orderId}`;
  } else {
    debitAccount = "BANK_CLEARING";
    debitEntityId = `GATEWAY:${paymentId}`;
    debitMemo = `Payment gateway capture for order #${orderId}`;
  }

  // 6. Construct Strict Double-Entry Ledger Entries
  const entries: LedgerEntry[] = [
    // 1. DEBIT: Full Customer Payment
    {
      account: debitAccount,
      direction: "DEBIT",
      amountPaise: totalAmountPaise,
      entityId: debitEntityId,
      memo: debitMemo,
    },
    // 2. CREDIT: Net Restaurant Payable
    {
      account: "RESTAURANT_PAYABLE",
      direction: "CREDIT",
      amountPaise: netRestaurantPaise,
      entityId: restaurantId,
      memo: `Net food sales payable for order #${orderId}`,
    },
    // 3. CREDIT: Rider Payout (Delivery fee + 100% tip)
    {
      account: "RIDER_PAYABLE",
      direction: "CREDIT",
      amountPaise: riderPayoutPaise,
      entityId: riderId || "RIDER_POOL",
      memo: `Delivery fee (${deliveryFeePaise}p) + customer tip (${customerTipPaise}p) on order #${orderId}`,
    },
    // 4. CREDIT: Platform Fee Revenue
    {
      account: "PLATFORM_FEE_REVENUE",
      direction: "CREDIT",
      amountPaise: platformFeePaise,
      entityId: "PLATFORM_REVENUE",
      memo: `Platform convenience and marketplace fee on order #${orderId}`,
    },
    // 5. CREDIT: Section 9(5) CGST (2.5%) Central Government Treasury
    {
      account: "CGST_9_5_LIABILITY",
      direction: "CREDIT",
      amountPaise: sec95Tax.cgstPaise,
      entityId: "GOVT_TREASURY_CENTRAL:18AFXPH9838M1Z9",
      memo: `2.5% CGST under Section 9(5) CGST Act 2017 (Orderkingpay GSTIN 18AFXPH9838M1Z9)`,
    },
    // 6. CREDIT: Section 9(5) SGST (2.5%) Assam State Government Treasury
    {
      account: "SGST_9_5_LIABILITY",
      direction: "CREDIT",
      amountPaise: sec95Tax.sgstPaise,
      entityId: "GOVT_TREASURY_ASSAM:18AFXPH9838M1Z9",
      memo: `2.5% Assam SGST under Section 9(5) CGST Act 2017 (Orderkingpay GSTIN 18AFXPH9838M1Z9)`,
    },
    // 7. CREDIT: 18% GST on Platform Service Fees
    {
      account: "GST_OUTPUT_LIABILITY",
      direction: "CREDIT",
      amountPaise: platformGstPaise,
      entityId: "GOVT_TREASURY_SERVICES:18AFXPH9838M1Z9",
      memo: `18% GST output tax liability on platform service fees under SAC 9985`,
    },
  ];

  // 7. Mathematical Invariance Validation
  const sumDebits = entries
    .filter((e) => e.direction === "DEBIT")
    .reduce((sum, e) => sum + e.amountPaise, 0);

  const sumCredits = entries
    .filter((e) => e.direction === "CREDIT")
    .reduce((sum, e) => sum + e.amountPaise, 0);

  if (sumDebits !== totalAmountPaise) {
    throw new Error(`FATAL: Sum of debits (${sumDebits}) !== total amount (${totalAmountPaise})`);
  }

  if (sumDebits !== sumCredits) {
    throw new Error(
      `FATAL: Double-entry ledger imbalance! Debits (${sumDebits}) !== Credits (${sumCredits}). Variance: ${sumDebits - sumCredits} paise.`
    );
  }

  // 8. Commit to Canonical Double-Entry Ledger
  const ledgerTx = await canonicalLedger.postTransaction({
    idempotencyKey,
    orderId,
    eventType: "ORDER_PAYMENT_CAPTURED",
    entries,
  });

  return {
    success: true,
    transactionId: ledgerTx.transactionId,
    orderId,
    paymentId,
    totalDebitPaise: sumDebits,
    totalCreditPaise: sumCredits,
    netRestaurantPaise,
    riderPayoutPaise,
    platformFeePaise,
    platformGstPaise,
    sec95Tax,
    ledgerTransaction: ledgerTx,
  };
}
