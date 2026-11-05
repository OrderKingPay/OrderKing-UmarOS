/**
 * Integer-Paise Statutory Tax, FSSAI Compliance & Merchant T+1 Settlement Engine (statutory-tax-settlement-engine.ts)
 * Entity: Orderkingpay | GSTIN: 18AFXPH9838M1Z9 (Assam - 788710)
 *
 * Statutory Rules Enforced:
 * - Zero IEEE-754 floating-point math for currency: all inputs and outputs are safe integers in paise (₹1.00 = 100 paise).
 * - Half-even (banker's) or deterministic integer rounding in basis points (10000 bps = 100%).
 * - Section 9(5) CGST Act: 5% GST on restaurant food services (2.5% CGST = 250 bps, 2.5% SGST = 250 bps) collected & remitted by ECO.
 * - Platform Commission: Configurable 15% to 22% (1500 to 2200 bps) + 18% GST on platform commission (1800 bps).
 * - Section 194-O Income Tax Act: 0.1% TDS (10 bps) deducted on gross merchant food + packaging sales.
 * - Section 52 CGST Act: 1.0% Net GST TCS (100 bps) where applicable on net taxable merchant supplies.
 * - 14-digit FSSAI registration/license verification & automated expiry blocking.
 * - AES-256-GCM authenticated encryption for PII/bank account numbers & 90-day GPS auto-purge filter (DPDP Act 2023).
 */

import crypto from 'node:crypto';

export interface StatutorySettlementInput {
  orderId: string;
  merchantId: string;
  merchantFssaiNumber: string;
  merchantFssaiValidUntilIso: string;
  foodSubtotalPaise: number;
  packagingFeePaise: number;
  deliveryFeePaise: number;
  surgeFeePaise: number;
  platformCommissionBps: number; // Must be between 1500 (15.00%) and 2200 (22.00%)
  paymentGatewayFeeBps?: number; // Default 200 bps (2.00%)
  riderBasePayoutPaise: number;
  riderSurgeIncentivePaise: number;
  settlementCycleDate?: string; // T+1 date string YYYY-MM-DD
}

export interface StatutoryLedgerEntry {
  accountType:
    | 'CUSTOMER_ESCROW_DEBIT'
    | 'ECO_SEC9_5_CGST_PAYABLE'
    | 'ECO_SEC9_5_SGST_PAYABLE'
    | 'PLATFORM_COMMISSION_REVENUE'
    | 'GST_ON_PLATFORM_COMMISSION'
    | 'INCOME_TAX_TDS_194O_PAYABLE'
    | 'GST_TCS_SEC52_PAYABLE'
    | 'PAYMENT_GATEWAY_FEE_EXPENSE'
    | 'RIDER_FLEET_PAYABLE'
    | 'MERCHANT_NET_SETTLEMENT_PAYABLE';
  direction: 'DEBIT' | 'CREDIT';
  amountPaise: number;
}

export interface StatutorySettlementBreakdown {
  orderId: string;
  merchantId: string;
  grossMerchantSupplyPaise: number; // foodSubtotalPaise + packagingFeePaise
  sec95CgstPaise: number; // 2.5% of grossMerchantSupplyPaise
  sec95SgstPaise: number; // 2.5% of grossMerchantSupplyPaise
  sec95TotalGstPaise: number;
  customerTotalCollectedPaise: number;
  platformCommissionBps: number;
  platformCommissionPaise: number;
  gstOnCommissionPaise: number; // 18% on platformCommissionPaise
  tdsSec194OPaise: number; // 0.1% (10 bps) on grossMerchantSupplyPaise
  tcsSec52Paise: number; // 1.0% (100 bps) on grossMerchantSupplyPaise
  paymentGatewayFeePaise: number;
  riderTotalPayoutPaise: number;
  merchantNetPayablePaise: number;
  tPlusOneSettlementDate: string;
  ledgerEntries: StatutoryLedgerEntry[];
  doubleEntryBalanced: boolean;
}

/**
 * Deterministic basis-points multiplication using integer math:
 * round((amountPaise * bps) / 10000)
 */
export function multiplyBasisPointsPaise(amountPaise: number, bps: number): number {
  if (!Number.isSafeInteger(amountPaise) || amountPaise < 0) {
    throw new Error(`INVALID_PAISE_INTEGER: ${amountPaise}`);
  }
  if (!Number.isSafeInteger(bps) || bps < 0) {
    throw new Error(`INVALID_BPS_INTEGER: ${bps}`);
  }
  const numerator = BigInt(amountPaise) * BigInt(bps);
  const quotient = numerator / 10000n;
  const remainder = numerator % 10000n;
  const rounded = remainder >= 5000n ? quotient + 1n : quotient;
  return Number(rounded);
}

/**
 * Validates 14-digit FSSAI license/registration number and checks expiry status.
 * First digit must be 1 (Central/State License) or 2 (Registration), followed by 2-digit state code and 11 digits.
 */
export function verifyMerchantFssaiCompliance(
  fssaiNumber: string,
  validUntilIso: string,
  referenceDate: Date = new Date()
): {
  isValidFormat: boolean;
  isExpired: boolean;
  canAcceptOrders: boolean;
  licenseTier: 'LICENSE_1' | 'REGISTRATION_2' | 'INVALID';
  stateCode: string;
  reason?: string;
} {
  const clean = String(fssaiNumber || '').trim();
  if (!/^[12]\d{13}$/.test(clean)) {
    return {
      isValidFormat: false,
      isExpired: false,
      canAcceptOrders: false,
      licenseTier: 'INVALID',
      stateCode: '',
      reason: 'FSSAI number must be an exact 14-digit numeric string starting with 1 (License) or 2 (Registration).',
    };
  }

  const expiryMs = Date.parse(validUntilIso);
  if (Number.isNaN(expiryMs)) {
    return {
      isValidFormat: true,
      isExpired: true,
      canAcceptOrders: false,
      licenseTier: clean.startsWith('1') ? 'LICENSE_1' : 'REGISTRATION_2',
      stateCode: clean.slice(1, 3),
      reason: 'FSSAI expiry date is invalid or missing.',
    };
  }

  const isExpired = expiryMs <= referenceDate.getTime();
  return {
    isValidFormat: true,
    isExpired,
    canAcceptOrders: !isExpired,
    licenseTier: clean.startsWith('1') ? 'LICENSE_1' : 'REGISTRATION_2',
    stateCode: clean.slice(1, 3),
    reason: isExpired ? 'FSSAI license has expired. Storefront is automatically blocked from accepting live orders.' : undefined,
  };
}

/**
 * Computes T+1 settlement date in YYYY-MM-DD format.
 */
export function computeTPlusOneDate(orderDate: Date = new Date()): string {
  const next = new Date(orderDate.getTime() + 24 * 60 * 60 * 1000);
  return next.toISOString().slice(0, 10);
}

/**
 * Computes full statutory tax & merchant T+1 settlement breakdown in integer paise.
 */
export function computeStatutoryOrderSettlement(
  input: StatutorySettlementInput,
  now: Date = new Date()
): StatutorySettlementBreakdown {
  const fssaiStatus = verifyMerchantFssaiCompliance(
    input.merchantFssaiNumber,
    input.merchantFssaiValidUntilIso,
    now
  );
  if (!fssaiStatus.canAcceptOrders) {
    throw new Error(`FSSAI_COMPLIANCE_BLOCK: ${fssaiStatus.reason}`);
  }

  const intFields: Array<[string, number]> = [
    ['foodSubtotalPaise', input.foodSubtotalPaise],
    ['packagingFeePaise', input.packagingFeePaise],
    ['deliveryFeePaise', input.deliveryFeePaise],
    ['surgeFeePaise', input.surgeFeePaise],
    ['riderBasePayoutPaise', input.riderBasePayoutPaise],
    ['riderSurgeIncentivePaise', input.riderSurgeIncentivePaise],
  ];

  for (const [field, val] of intFields) {
    if (!Number.isSafeInteger(val) || val < 0) {
      throw new Error(`NON_INTEGER_PAISE_REJECTED: Field "${field}" must be a non-negative integer in paise, received ${val}.`);
    }
  }

  if (
    !Number.isSafeInteger(input.platformCommissionBps) ||
    input.platformCommissionBps < 1500 ||
    input.platformCommissionBps > 2200
  ) {
    throw new Error(
      `INVALID_COMMISSION_BPS: Platform commission must be between 1500 bps (15%) and 2200 bps (22%), received ${input.platformCommissionBps}.`
    );
  }

  const grossMerchantSupplyPaise = input.foodSubtotalPaise + input.packagingFeePaise;

  // Section 9(5) GST: 2.5% CGST (250 bps) + 2.5% SGST (250 bps) on restaurant supply
  const sec95CgstPaise = multiplyBasisPointsPaise(grossMerchantSupplyPaise, 250);
  const sec95SgstPaise = multiplyBasisPointsPaise(grossMerchantSupplyPaise, 250);
  const sec95TotalGstPaise = sec95CgstPaise + sec95SgstPaise;

  // Customer Total Collected in Escrow
  const customerTotalCollectedPaise =
    grossMerchantSupplyPaise + sec95TotalGstPaise + input.deliveryFeePaise + input.surgeFeePaise;

  // Platform Commission (15-22%) + 18% GST on Commission
  const platformCommissionPaise = multiplyBasisPointsPaise(
    grossMerchantSupplyPaise,
    input.platformCommissionBps
  );
  const gstOnCommissionPaise = multiplyBasisPointsPaise(platformCommissionPaise, 1800);

  // Statutory Deductions on Merchant Gross Supply:
  // 1) Sec 194-O TDS @ 0.1% (10 bps)
  // 2) Sec 52 GST TCS @ 1.0% (100 bps)
  const tdsSec194OPaise = multiplyBasisPointsPaise(grossMerchantSupplyPaise, 10);
  const tcsSec52Paise = multiplyBasisPointsPaise(grossMerchantSupplyPaise, 100);

  // Payment Gateway Fee (default 200 bps = 2.0% on customerTotalCollectedPaise)
  const pgBps = input.paymentGatewayFeeBps ?? 200;
  const paymentGatewayFeePaise = multiplyBasisPointsPaise(customerTotalCollectedPaise, pgBps);

  // Net Payable to Merchant in T+1 Batch
  const totalMerchantDeductionsPaise =
    platformCommissionPaise + gstOnCommissionPaise + tdsSec194OPaise + tcsSec52Paise + paymentGatewayFeePaise;
  const merchantNetPayablePaise = grossMerchantSupplyPaise - totalMerchantDeductionsPaise;

  if (merchantNetPayablePaise < 0) {
    throw new Error('NEGATIVE_MERCHANT_SETTLEMENT: Deductions exceed gross merchant supply.');
  }

  const riderTotalPayoutPaise = input.riderBasePayoutPaise + input.riderSurgeIncentivePaise;

  // Construct Double-Entry Ledger Lines for Merchant & Statutory Escrow Allocation
  const ledgerEntries: StatutoryLedgerEntry[] = [
    {
      accountType: 'CUSTOMER_ESCROW_DEBIT',
      direction: 'DEBIT',
      amountPaise: grossMerchantSupplyPaise + sec95TotalGstPaise,
    },
    {
      accountType: 'ECO_SEC9_5_CGST_PAYABLE',
      direction: 'CREDIT',
      amountPaise: sec95CgstPaise,
    },
    {
      accountType: 'ECO_SEC9_5_SGST_PAYABLE',
      direction: 'CREDIT',
      amountPaise: sec95SgstPaise,
    },
    {
      accountType: 'PLATFORM_COMMISSION_REVENUE',
      direction: 'CREDIT',
      amountPaise: platformCommissionPaise,
    },
    {
      accountType: 'GST_ON_PLATFORM_COMMISSION',
      direction: 'CREDIT',
      amountPaise: gstOnCommissionPaise,
    },
    {
      accountType: 'INCOME_TAX_TDS_194O_PAYABLE',
      direction: 'CREDIT',
      amountPaise: tdsSec194OPaise,
    },
    {
      accountType: 'GST_TCS_SEC52_PAYABLE',
      direction: 'CREDIT',
      amountPaise: tcsSec52Paise,
    },
    {
      accountType: 'PAYMENT_GATEWAY_FEE_EXPENSE',
      direction: 'CREDIT',
      amountPaise: paymentGatewayFeePaise,
    },
    {
      accountType: 'MERCHANT_NET_SETTLEMENT_PAYABLE',
      direction: 'CREDIT',
      amountPaise: merchantNetPayablePaise,
    },
  ];

  const totalDebits = ledgerEntries
    .filter((e) => e.direction === 'DEBIT')
    .reduce((acc, e) => acc + e.amountPaise, 0);

  const totalCredits = ledgerEntries
    .filter((e) => e.direction === 'CREDIT')
    .reduce((acc, e) => acc + e.amountPaise, 0);

  return {
    orderId: input.orderId,
    merchantId: input.merchantId,
    grossMerchantSupplyPaise,
    sec95CgstPaise,
    sec95SgstPaise,
    sec95TotalGstPaise,
    customerTotalCollectedPaise,
    platformCommissionBps: input.platformCommissionBps,
    platformCommissionPaise,
    gstOnCommissionPaise,
    tdsSec194OPaise,
    tcsSec52Paise,
    paymentGatewayFeePaise,
    riderTotalPayoutPaise,
    merchantNetPayablePaise,
    tPlusOneSettlementDate: input.settlementCycleDate || computeTPlusOneDate(now),
    ledgerEntries,
    doubleEntryBalanced: totalDebits === totalCredits,
  };
}

/**
 * AES-256-GCM Authenticated Encryption for PII & Bank Settlement Credentials (DPDP Act 2023).
 */
export function encryptSensitivePiiAes256Gcm(plaintext: string, key32BytesHex: string): string {
  const key = Buffer.from(key32BytesHex, 'hex');
  if (key.length !== 32) {
    throw new Error('AES_256_GCM_KEY_ERROR: Key must be 32 bytes (64 hex characters).');
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptSensitivePiiAes256Gcm(payload: string, key32BytesHex: string): string {
  const key = Buffer.from(key32BytesHex, 'hex');
  if (key.length !== 32) {
    throw new Error('AES_256_GCM_KEY_ERROR: Key must be 32 bytes (64 hex characters).');
  }
  const [ivHex, tagHex, dataHex] = String(payload || '').split(':');
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error('AES_256_GCM_PAYLOAD_MALFORMED');
  }
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

/**
 * DPDP Act 2023 90-Day GPS Telemetry Auto-Purge Filter & 72-Month Financial Retention Enforcer.
 */
export function enforceDataRetentionPolicies<
  T extends { recordedAtIso: string; recordType: 'GPS_TELEMETRY' | 'FINANCIAL_LEDGER' }
>(records: T[], now: Date = new Date()): { retained: T[]; purgedCount: number } {
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  const seventyTwoMonthsMs = 72 * 30.4375 * 24 * 60 * 60 * 1000;
  const retained: T[] = [];
  let purgedCount = 0;

  for (const rec of records) {
    const ageMs = now.getTime() - Date.parse(rec.recordedAtIso);
    if (rec.recordType === 'GPS_TELEMETRY' && ageMs > ninetyDaysMs) {
      purgedCount++;
    } else if (rec.recordType === 'FINANCIAL_LEDGER' && ageMs > seventyTwoMonthsMs) {
      purgedCount++;
    } else {
      retained.push(rec);
    }
  }

  return { retained, purgedCount };
}
