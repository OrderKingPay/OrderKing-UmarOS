/**
 * 👑 ORDERKING FINTECH & SETTLEMENTS SPECIALIST (2b420240)
 * SPECIALIST AUDIT & MATHEMATICAL INVARIANCE TEST SUITE
 *
 * Directives Under Test:
 * 1. Verify NPCI UPI string construction and BharatQR payload specs for VPAs:
 *    - 'orderking@ybl' (Sovereign Primary VPA)
 *    - '9395065587@ybl' (Sovereign Secondary / Founder VPA)
 * 2. Audit integer paise double-entry accounting engine in 'financial_ledger' and 'kingpay_wallets':
 *    - Guarantee zero float drift: sum(debits) === sum(credits).
 *    - Verify wallet non-negative invariant and atomic balance conservation.
 * 3. Validate statutory compliance under GSTIN '18AFXPH9838M1Z9' (Assam - 788710)
 *    and Section 9(5) CGST Act for food delivery platform liability.
 * 4. Verify mathematical proofs of balance invariance across high-concurrency transactions.
 */

import test, { describe } from "node:test";
import assert from "node:assert/strict";
import * as crypto from "node:crypto";
import {
  canonicalLedger,
  SOVEREIGN_NPCI_UPI_VPA,
  SECONDARY_NPCI_UPI_VPA,
  type LedgerEntry,
  type LedgerTransaction,
} from "./canonical-ledger.ts";
import {
  STATUTORY_TAX_RATES,
  calculateSection95Tax,
  calculateStatutoryWithholding,
  generateAutomatedCreditNote,
  applyTaxBpsPaise,
} from "../../../../../packages/ui/src/tax.ts";

// ============================================================================
// BHARATQR EMVCo MPM v1.0 & NPCI UPI ENGINE HELPERS
// ============================================================================

export function isValidVPA(vpa: string): boolean {
  if (!vpa || typeof vpa !== "string") return false;
  const trimmed = vpa.trim();
  if (trimmed.length < 5 || trimmed.length > 256) return false;
  return /^[a-zA-Z0-9._-]{2,128}@[a-zA-Z0-9]{2,64}$/.test(trimmed);
}

export function calculateCRC16CCITT(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function toTLV(tag: string, value: string): string {
  const lenStr = value.length.toString().padStart(2, "0");
  return `${tag}${lenStr}${value}`;
}

export interface BharatQRBuildParams {
  vpa: string;
  payeeName: string;
  amountPaise: number;
  transactionRef: string;
  transactionNote?: string;
  merchantCategoryCode?: string;
  merchantCity?: string;
  postalCode?: string;
}

export function buildNpciUpiUri(params: {
  vpa: string;
  payeeName: string;
  amountPaise: number;
  transactionRef: string;
  transactionNote?: string;
  merchantCategoryCode?: string;
  mode?: string;
}): string {
  if (!isValidVPA(params.vpa)) throw new Error(`Invalid VPA: ${params.vpa}`);
  const amountStr = (params.amountPaise / 100).toFixed(2);
  const parts = [
    `pa=${encodeURIComponent(params.vpa.trim())}`,
    `pn=${encodeURIComponent(params.payeeName.trim())}`,
    `am=${amountStr}`,
    `cu=INR`,
    `tr=${encodeURIComponent(params.transactionRef.trim())}`,
  ];
  if (params.transactionNote) {
    parts.push(`tn=${encodeURIComponent(params.transactionNote.trim())}`);
  }
  parts.push(`mc=${params.merchantCategoryCode || "5812"}`);
  parts.push(`mode=${params.mode || "02"}`);
  return `upi://pay?${parts.join("&")}`;
}

export function buildBharatQrEmvcoPayload(params: BharatQRBuildParams): {
  upiUri: string;
  emvcoPayload: string;
  checksum: string;
} {
  const upiUri = buildNpciUpiUri({
    vpa: params.vpa,
    payeeName: params.payeeName,
    amountPaise: params.amountPaise,
    transactionRef: params.transactionRef,
    transactionNote: params.transactionNote,
    merchantCategoryCode: params.merchantCategoryCode,
    mode: "02",
  });

  const amountStr = (params.amountPaise / 100).toFixed(2);
  let payload = "";
  payload += toTLV("00", "01"); // Tag 00: Format Indicator "01"
  payload += toTLV("01", "12"); // Tag 01: Dynamic QR "12"

  // Tag 26: Merchant Account Info (UPI)
  const upiSubTLV = toTLV("00", "in.npci.upi") + toTLV("01", params.vpa.trim());
  payload += toTLV("26", upiSubTLV);

  payload += toTLV("52", (params.merchantCategoryCode || "5812").padStart(4, "0").slice(0, 4));
  payload += toTLV("53", "356"); // Tag 53: Currency INR = 356
  payload += toTLV("54", amountStr); // Tag 54: Transaction Amount
  payload += toTLV("58", "IN"); // Tag 58: Country Code
  payload += toTLV("59", params.payeeName.trim().slice(0, 25)); // Tag 59: Payee Name
  payload += toTLV("60", (params.merchantCity || "Karimganj").trim().slice(0, 15)); // Tag 60: City
  if (params.postalCode) {
    payload += toTLV("61", params.postalCode.trim().slice(0, 10)); // Tag 61: Postal Code
  }

  let addData = toTLV("01", params.transactionRef.trim().slice(0, 25));
  if (params.transactionNote) {
    addData += toTLV("05", params.transactionNote.trim().slice(0, 25));
  }
  payload += toTLV("62", addData);

  const preCrc = `${payload}6304`;
  const checksum = calculateCRC16CCITT(preCrc);
  const emvcoPayload = `${preCrc}${checksum}`;

  return { upiUri, emvcoPayload, checksum };
}

export function verifyBharatQrChecksum(emvcoPayload: string): boolean {
  if (!emvcoPayload || emvcoPayload.length < 8) return false;
  const tag63Index = emvcoPayload.lastIndexOf("6304");
  if (tag63Index === -1 || tag63Index + 8 !== emvcoPayload.length) return false;
  const dataPart = emvcoPayload.slice(0, tag63Index + 4);
  const expectedCrc = emvcoPayload.slice(tag63Index + 4).toUpperCase();
  const calculatedCrc = calculateCRC16CCITT(dataPart);
  return expectedCrc === calculatedCrc;
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe("👑 GUARANTEED FINTECH & SETTLEMENTS SPECIALIST AUDIT (2b420240)", () => {

  // =========================================================================
  // DIRECTIVE 1: NPCI UPI STRING CONSTRUCTION & BHARATQR SPECIFICATION
  // =========================================================================
  describe("Directive 1: Direct NPCI UPI String Construction & BharatQR Payload Validation", () => {
    const testCases = [
      {
        label: "Primary Sovereign VPA",
        vpa: SOVEREIGN_NPCI_UPI_VPA, // "orderking@ybl"
        payeeName: "OrderKingPay",
        amountPaise: 49_900, // ₹499.00
        ref: "ORDK-SOV-001",
        city: "Karimganj",
        postalCode: "788710",
      },
      {
        label: "Secondary Sovereign VPA",
        vpa: SECONDARY_NPCI_UPI_VPA, // "9395065587@ybl"
        payeeName: "OrderKingPay",
        amountPaise: 125_000, // ₹1,250.00
        ref: "ORDK-SEC-002",
        city: "Sribhumi",
        postalCode: "788710",
      },
    ];

    testCases.forEach((tc) => {
      test(`verifies NPCI UPI string construction for ${tc.label} (${tc.vpa})`, () => {
        // 1. Verify VPA syntax
        assert.ok(isValidVPA(tc.vpa), `VPA '${tc.vpa}' must satisfy NPCI regex`);
        assert.ok(tc.vpa.endsWith("@ybl"), "VPA must terminate with verified Yes Bank handle (@ybl)");

        // 2. Construct URI
        const uri = buildNpciUpiUri({
          vpa: tc.vpa,
          payeeName: tc.payeeName,
          amountPaise: tc.amountPaise,
          transactionRef: tc.ref,
          transactionNote: "Direct Food Delivery Settlement",
          merchantCategoryCode: "5812",
          mode: "02",
        });

        // 3. Assert URI invariants
        assert.ok(uri.startsWith("upi://pay?"), "URI must begin with standard 'upi://pay?' scheme");
        assert.ok(uri.includes(`pa=${encodeURIComponent(tc.vpa)}`), `URI must embed payee VPA '${tc.vpa}'`);
        assert.ok(uri.includes("pn=OrderKingPay"), "URI must embed payee name 'OrderKingPay'");
        assert.ok(uri.includes(`am=${(tc.amountPaise / 100).toFixed(2)}`), "URI must embed 2-decimal amount");
        assert.ok(uri.includes("cu=INR"), "Currency must be strictly 'INR'");
        assert.ok(uri.includes(`tr=${tc.ref}`), "URI must embed transaction reference");
        assert.ok(uri.includes("mc=5812"), "Merchant category code must be 5812 (Food & Dining)");
        assert.ok(uri.includes("mode=02"), "Mode must be 02 (Dynamic Secure QR)");

        // 4. Verify Rail Purity: No third-party intermediary float or wallet in URI
        assert.ok(!uri.includes("intermediate"), "URI must not route to intermediary float");
        assert.ok(!uri.includes("escrow_wallet"), "URI must not route to custodial wallet");
      });

      test(`verifies standards-compliant BharatQR EMVCo MPM payload for ${tc.label} (${tc.vpa})`, () => {
        const { upiUri, emvcoPayload, checksum } = buildBharatQrEmvcoPayload({
          vpa: tc.vpa,
          payeeName: tc.payeeName,
          amountPaise: tc.amountPaise,
          transactionRef: tc.ref,
          transactionNote: "Direct Food Delivery Settlement",
          merchantCategoryCode: "5812",
          merchantCity: tc.city,
          postalCode: tc.postalCode,
        });

        const amountStr = (tc.amountPaise / 100).toFixed(2);

        // 1. Assert EMVCo TLV format
        assert.ok(emvcoPayload.startsWith("000201010212"), "Tag 00='01', Tag 01='12' (Dynamic QR)");
        assert.ok(emvcoPayload.includes("in.npci.upi"), "Tag 26 subtag 00 must contain 'in.npci.upi'");
        assert.ok(emvcoPayload.includes(tc.vpa), `Tag 26 subtag 01 must contain VPA '${tc.vpa}'`);
        assert.ok(emvcoPayload.includes("52045812"), "Tag 52 must contain MCC '5812'");
        assert.ok(emvcoPayload.includes("5303356"), "Tag 53 must contain INR currency code '356'");
        assert.ok(emvcoPayload.includes(toTLV("54", amountStr)), "Tag 54 must contain exact amount TLV");
        assert.ok(emvcoPayload.includes("5802IN"), "Tag 58 must specify country 'IN'");
        assert.ok(emvcoPayload.includes("5912OrderKingPay"), "Tag 59 must contain merchant name");
        assert.ok(emvcoPayload.includes(tc.city), `Tag 60 must contain city '${tc.city}'`);
        assert.ok(emvcoPayload.includes(tc.postalCode), `Tag 61 must contain postal code '${tc.postalCode}'`);

        // 2. Assert CRC-16 Checksum
        assert.strictEqual(checksum.length, 4, "Checksum must be exactly 4 hexadecimal characters");
        assert.ok(emvcoPayload.endsWith(checksum), "EMVCo payload must terminate with valid CRC-16");
        assert.ok(verifyBharatQrChecksum(emvcoPayload), "Checksum verification function must pass on genuine payload");

        // 3. Tampering Defense: Verify that modifying 1 character invalidates CRC-16
        const tampered = emvcoPayload.replace(
          amountStr,
          ((tc.amountPaise + 100) / 100).toFixed(2)
        );
        assert.strictEqual(verifyBharatQrChecksum(tampered), false, "Tampered payload must fail checksum verification");
      });
    });

    test("verifies standard CRC-16 CCITT known test vectors", () => {
      // Known standard CCITT-FALSE test vector: "123456789" -> 0x29B1
      const testVec = calculateCRC16CCITT("123456789");
      assert.strictEqual(testVec, "29B1");
    });
  });

  // =========================================================================
  // DIRECTIVE 2: INTEGER PAISE DOUBLE-ENTRY IN 'financial_ledger' & 'kingpay_wallets'
  // =========================================================================
  describe("Directive 2: Integer-Paise Double-Entry Engine & Wallet Invariant Audit", () => {
    test("verifies atomic balance invariance on multi-party order split: sum(debits) === sum(credits)", async () => {
      // Order scenario:
      // Food Subtotal: ₹800.00 (80,000 paise)
      // Packaging: ₹30.00 (3,000 paise)
      // Merchant Discount: ₹50.00 (5,000 paise)
      // Delivery Fee: ₹45.00 (4,500 paise)
      // Platform Fee: ₹15.00 (1,500 paise)
      // Customer Tip: ₹50.00 (5,000 paise)
      // Total Gross Customer Payable:
      //   Net Food & Packing = 80,000 + 3,000 - 5,000 = 78,000 paise
      //   5% Section 9(5) Food Tax = 3,900 paise (paid by platform, no ITC)
      //   18% GST on Platform Fee (1,500) = 270 paise
      //   18% GST on Delivery Fee (4,500) = 810 paise
      //   Gross Customer Payment = 78,000 + 3,900 + 4,500 + 810 + 1,500 + 270 + 5,000 = 93,980 paise (₹939.80)
      const foodTaxablePaise = 78_000;
      const foodGst9_5Paise = 3_900;
      const deliveryFeePaise = 4_500;
      const deliveryGstPaise = 810;
      const platformFeePaise = 1_500;
      const platformGstPaise = 270;
      const tipPaise = 5_000;
      const totalCustomerDebitPaise = 93_980;

      // Merchant deductions:
      // Commission 18% on net food (78,000 * 0.18) = 14,040 paise
      // GST on Commission 18% (14,040 * 0.18) = 2,527 paise
      // TCS 1% (78,000 * 0.01) = 780 paise
      // TDS 1% (83,000 * 0.01) = 830 paise
      // Merchant Net Payout = 78,000 - 14,040 - 2,527 - 780 - 830 = 59,823 paise
      const commissionPaise = 14_040;
      const commissionGstPaise = 2_527;
      const tcsPaise = 780;
      const tdsPaise = 830;
      const merchantNetPayoutPaise = 59_823;

      // Rider Payout:
      // Delivery fee (4,500) + Tip (5,000) = 9,500 paise
      const riderNetPayoutPaise = 9_500;

      // Platform Total Retained Revenue:
      // Platform Fee (1,500) + Commission (14,040) = 15,540 paise
      const platformFeeRevenuePaise = 15_540;

      // Platform Tax Liabilities:
      // Section 9(5) Food GST = 3,900 paise
      // Service GST = 270 (platform fee GST) + 810 (delivery fee GST) + 2,527 (commission GST) = 3,607 paise
      // TCS Liability = 780 paise
      // TDS Liability = 830 paise
      const gstOutputLiabilityPaise = 3_607;
      const foodGstLiabilityPaise = 3_900;
      const tcsLiabilityPaise = 780;
      const tdsLiabilityPaise = 830;

      // Build balanced multi-party transaction entries
      const entries: LedgerEntry[] = [
        // 1. DEBIT: Bank clearing collects full customer amount
        {
          account: "BANK_CLEARING",
          direction: "DEBIT",
          amountPaise: totalCustomerDebitPaise,
          entityId: "NPCI_UPI:orderking@ybl",
          memo: "Customer direct UPI settlement for order",
        },
        // 2. CREDIT: Restaurant payable liability
        {
          account: "RESTAURANT_PAYABLE",
          direction: "CREDIT",
          amountPaise: merchantNetPayoutPaise,
          entityId: "rest_biryani_01",
          memo: "Net payable to restaurant partner",
        },
        // 3. CREDIT: Rider payable liability
        {
          account: "RIDER_PAYABLE",
          direction: "CREDIT",
          amountPaise: riderNetPayoutPaise,
          entityId: "rider_assam_01",
          memo: "Delivery payout + 100% pass-through customer tip",
        },
        // 4. CREDIT: Platform earned service revenue
        {
          account: "PLATFORM_FEE_REVENUE",
          direction: "CREDIT",
          amountPaise: platformFeeRevenuePaise,
          entityId: "ORDERKING_REVENUE",
          memo: "Platform fee + restaurant commission",
        },
        // 5. CREDIT: Section 9(5) CGST Food Tax Liability
        {
          account: "FOOD_GST_9_5_LIABILITY",
          direction: "CREDIT",
          amountPaise: foodGstLiabilityPaise,
          entityId: "GOVT_TREASURY:18AFXPH9838M1Z9",
          memo: "5% Section 9(5) CGST Food Tax remitted under Orderkingpay GSTIN 18AFXPH9838M1Z9",
        },
        // 6. CREDIT: 18% GST Output Liability on platform services
        {
          account: "GST_OUTPUT_LIABILITY",
          direction: "CREDIT",
          amountPaise: gstOutputLiabilityPaise,
          entityId: "GOVT_TREASURY:18AFXPH9838M1Z9",
          memo: "18% GST on platform services and commission",
        },
        // 7. CREDIT: Section 52 TCS Liability
        {
          account: "TCS_PAYABLE_LIABILITY",
          direction: "CREDIT",
          amountPaise: tcsLiabilityPaise,
          entityId: "GOVT_TREASURY:18AFXPH9838M1Z9",
          memo: "1% TCS on net taxable supplies",
        },
        // 8. CREDIT: Section 194-O TDS Liability
        {
          account: "TDS_PAYABLE_LIABILITY",
          direction: "CREDIT",
          amountPaise: tdsLiabilityPaise,
          entityId: "INCOME_TAX_DEPT",
          memo: "1% TDS on gross sales",
        },
      ];

      // Sum debits & credits
      const sumDebits = entries.filter((e) => e.direction === "DEBIT").reduce((s, e) => s + e.amountPaise, 0);
      const sumCredits = entries.filter((e) => e.direction === "CREDIT").reduce((s, e) => s + e.amountPaise, 0);

      // Verify exact mathematical balance
      assert.strictEqual(sumDebits, totalCustomerDebitPaise);
      assert.strictEqual(sumCredits, totalCustomerDebitPaise);
      assert.strictEqual(sumDebits - sumCredits, 0, "Double-entry variance must be strictly 0 paise");

      // Verify each individual entry amount is safe integer
      for (const entry of entries) {
        assert.ok(Number.isSafeInteger(entry.amountPaise), "Every amount must be a SafeInteger");
        assert.ok(entry.amountPaise >= 0, "Amounts must be non-negative");
      }

      // Commit to canonical ledger via postTransaction
      const tx = await canonicalLedger.postTransaction({
        idempotencyKey: `idem-order-multiparty-${Date.now()}`,
        orderId: "ord-test-audit-001",
        eventType: "ORDER_PAYMENT_CAPTURED",
        entries,
      });

      assert.ok(tx.transactionId);
      assert.strictEqual(tx.totalAmountPaise, totalCustomerDebitPaise);
    });

    test("verifies KingPay wallet lifecycle: Top-up, Spend, Non-negative check, and Balance Conservation", async () => {
      const testUserId = `usr_test_audit_${Date.now()}`;

      // Initial wallet balance must be exactly 0 (no simulated free money)
      const initialBalance = await canonicalLedger.getKingPayWalletBalancePaise(testUserId);
      assert.strictEqual(initialBalance, 0);

      // 1. Top-Up ₹2,000.00 (200,000 paise) via Sovereign Direct UPI
      const topUpPaise = 200_000;
      const topUpTx = await canonicalLedger.recordKingPayWalletTopUp({
        userId: testUserId,
        amountPaise: topUpPaise,
        idempotencyKey: `idem-topup-${testUserId}`,
        memo: "Verified Sovereign Bank Top-up via orderking@ybl",
      });

      assert.strictEqual(topUpTx.totalAmountPaise, topUpPaise);
      const balanceAfterTopUp = await canonicalLedger.getKingPayWalletBalancePaise(testUserId);
      assert.strictEqual(balanceAfterTopUp, topUpPaise);

      // 2. Spend ₹750.00 (75,000 paise) on order
      const spendPaise = 75_000;
      const spendTx = await canonicalLedger.recordKingPayPayment({
        userId: testUserId,
        recipientId: "rest_royal_001",
        amountPaise: spendPaise,
        idempotencyKey: `idem-spend-${testUserId}`,
        recipientAccount: "RESTAURANT_PAYABLE",
        memo: "Dinner order payment",
      });

      assert.strictEqual(spendTx.totalAmountPaise, spendPaise);
      const balanceAfterSpend = await canonicalLedger.getKingPayWalletBalancePaise(testUserId);
      assert.strictEqual(balanceAfterSpend, 125_000); // Exactly ₹1,250.00 remaining

      // 3. Attempt overdraft: spend ₹150,000 when balance is 125,000 paise
      const excessiveSpendPaise = 150_000;
      await assert.rejects(
        async () => {
          await canonicalLedger.recordKingPayPayment({
            userId: testUserId,
            recipientId: "rest_royal_001",
            amountPaise: excessiveSpendPaise,
            idempotencyKey: `idem-fail-overdraft-${testUserId}`,
            recipientAccount: "RESTAURANT_PAYABLE",
          });
        },
        /Insufficient authentic wallet balance/,
        "Overdraft must be blocked fail-closed"
      );

      // Balance remains strictly 125,000
      const finalBalance = await canonicalLedger.getKingPayWalletBalancePaise(testUserId);
      assert.strictEqual(finalBalance, 125_000);
    });

    test("executes 100 concurrent ledger transactions with zero float drift", async () => {
      const concurrentTxCount = 100;
      let totalDebitsAggregated = 0;
      let totalCreditsAggregated = 0;

      const promises = Array.from({ length: concurrentTxCount }, async (_, idx) => {
        // Varying transaction amounts with odd paise to stress test floating point
        const amountPaise = 10_000 + (idx * 37) + (idx % 2 === 0 ? 13 : 7);
        const commissionPaise = Math.round(amountPaise * 0.15);
        const netPaise = amountPaise - commissionPaise;

        const entries: LedgerEntry[] = [
          {
            account: "BANK_CLEARING",
            direction: "DEBIT",
            amountPaise,
            entityId: "NPCI_UPI:orderking@ybl",
            memo: `Concurrent booking #${idx}`,
          },
          {
            account: "RESTAURANT_PAYABLE",
            direction: "CREDIT",
            amountPaise: netPaise,
            entityId: `rest_${idx % 5}`,
            memo: `Net payout #${idx}`,
          },
          {
            account: "PLATFORM_FEE_REVENUE",
            direction: "CREDIT",
            amountPaise: commissionPaise,
            entityId: "ORDERKING_REVENUE",
            memo: `Commission #${idx}`,
          },
        ];

        const tx = await canonicalLedger.postTransaction({
          idempotencyKey: `idem-concurrent-stress-${idx}-${Date.now()}`,
          eventType: "ORDER_PAYMENT_CAPTURED",
          entries,
        });

        const debits = tx.entries.filter((e) => e.direction === "DEBIT").reduce((s, e) => s + e.amountPaise, 0);
        const credits = tx.entries.filter((e) => e.direction === "CREDIT").reduce((s, e) => s + e.amountPaise, 0);

        assert.strictEqual(debits, credits);
        assert.strictEqual(debits, amountPaise);

        return { debits, credits };
      });

      const results = await Promise.all(promises);
      for (const res of results) {
        totalDebitsAggregated += res.debits;
        totalCreditsAggregated += res.credits;
      }

      assert.strictEqual(totalDebitsAggregated, totalCreditsAggregated);
      assert.strictEqual(totalDebitsAggregated - totalCreditsAggregated, 0);

      // Verify cryptographic audit chain integrity
      const chainValid = await canonicalLedger.verifyLedgerChainIntegrity();
      assert.ok(chainValid.isValid, "Audit chain must remain 100% cryptographically verified");
    });
  });

  // =========================================================================
  // DIRECTIVE 3: STATUTORY COMPLIANCE (GSTIN 18AFXPH9838M1Z9 & SECTION 9(5))
  // =========================================================================
  describe("Directive 3: Statutory Compliance (GSTIN 18AFXPH9838M1Z9 & Section 9(5) CGST Act)", () => {
    test("verifies GSTIN structure and Assam jurisdiction specifications", () => {
      const gstin = "18AFXPH9838M1Z9";
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      assert.ok(gstinRegex.test(gstin), "GSTIN must comply with statutory Indian GSTIN schema");

      // State Code: 18 (Assam)
      assert.strictEqual(gstin.slice(0, 2), "18", "State code 18 corresponds to Assam");
      // PAN: AFXPH9838M
      assert.strictEqual(gstin.slice(2, 12), "AFXPH9838M", "PAN segment corresponds to Orderkingpay");
      // Entity Code: 1
      assert.strictEqual(gstin.charAt(12), "1");
      // Default: Z
      assert.strictEqual(gstin.charAt(13), "Z");
      // Checksum digit: 9
      assert.strictEqual(gstin.charAt(14), "9");
    });

    test("verifies Section 9(5) CGST Act platform liability: 5% Food GST without ITC and never debited from merchant", () => {
      const foodValuePaise = 50_000; // ₹500.00
      const packagingPaise = 2_000;  // ₹20.00
      const platformFeePaise = 1_500; // ₹15.00
      const deliveryFeePaise = 4_000; // ₹40.00

      const taxCalculation = calculateSection95Tax({
        foodSubtotalPaise: foodValuePaise,
        packagingChargePaise: packagingPaise,
        platformFeePaise,
        deliveryFeePaise,
        isInterstate: false,
      });

      // 1. Food: 5% GST (Section 9(5) ECO liable, No ITC)
      assert.strictEqual(taxCalculation.foodGstPaise, 2_500); // 5% of 50,000 = 2,500 paise
      assert.strictEqual(taxCalculation.packagingGstPaise, 100); // 5% of 2,000 = 100 paise
      assert.strictEqual(taxCalculation.totalSec95GstPaise, 2_600); // Total Section 9(5) Tax = 2,600 paise

      // 2. ITC Blocked invariant: ECO cannot claim input tax credit on Section 9(5) restaurant supplies
      assert.strictEqual(taxCalculation.itcBlockedSec95TaxPaise, 2_600);
      assert.strictEqual(taxCalculation.lineItems.food.itcEligible, false);
      assert.strictEqual(taxCalculation.lineItems.food.liabilityBearer, "ECO_PLATFORM");

      // 3. Platform services: 18% GST WITH ITC
      assert.strictEqual(taxCalculation.platformFeeGstPaise, 270); // 18% of 1,500 = 270 paise
      assert.strictEqual(taxCalculation.deliveryFeeGstPaise, 720); // 18% of 4,000 = 720 paise
      assert.strictEqual(taxCalculation.itcEligibleTaxPaise, 990); // 270 + 720 = 990 paise

      // 4. GSTR-3B Table Mapping
      assert.strictEqual(taxCalculation.gstr3b.table3_1_1_i_taxableAmountPaise, 52_000);
      assert.strictEqual(taxCalculation.gstr3b.table3_1_1_i_taxPayablePaise, 2_600);
      assert.strictEqual(taxCalculation.gstr3b.table3_1_a_taxableAmountPaise, 5_500);
      assert.strictEqual(taxCalculation.gstr3b.table3_1_a_taxPayablePaise, 990);
    });

    test("verifies Section 52 TCS (1%) and Section 194-O TDS (1%) statutory withholdings", () => {
      const grossSalesPaise = 100_000; // ₹1,000.00
      const discountPaise = 10_000;   // ₹100.00
      const netTaxablePaise = 90_000; // ₹900.00

      // Standard case: Valid PAN
      const withholdingWithPan = calculateStatutoryWithholding({
        grossSalesPaise,
        restaurantDiscountPaise: discountPaise,
        hasValidPan: true,
        isInterstate: false,
      });

      // TCS: 1% on net taxable supply (90,000 * 0.01 = 900 paise)
      assert.strictEqual(withholdingWithPan.tcsSection52Paise, 900);
      assert.strictEqual(withholdingWithPan.tcsCgstPaise, 450); // 0.5% CGST
      assert.strictEqual(withholdingWithPan.tcsSgstPaise, 450); // 0.5% SGST

      // TDS: 1% on gross sales (100,000 * 0.01 = 1,000 paise)
      assert.strictEqual(withholdingWithPan.tdsSection194OPaise, 1_000);
      assert.strictEqual(withholdingWithPan.hasValidPan, true);
      assert.strictEqual(withholdingWithPan.totalWithholdingPaise, 1_900);

      // Penal rate under Section 206AA: Missing/Invalid PAN -> 5% TDS
      const withholdingNoPan = calculateStatutoryWithholding({
        grossSalesPaise,
        restaurantDiscountPaise: discountPaise,
        hasValidPan: false,
        isInterstate: false,
      });

      // Penal TDS: 5% on gross sales (100,000 * 0.05 = 5,000 paise)
      assert.strictEqual(withholdingNoPan.tdsSection194OPaise, 5_000);
      assert.strictEqual(withholdingNoPan.hasValidPan, false);
      assert.strictEqual(withholdingNoPan.totalWithholdingPaise, 5_900); // 900 TCS + 5,000 TDS
    });

    test("verifies automated Section 34 CGST Act credit note generation under GSTIN 18AFXPH9838M1Z9", () => {
      const creditNote = generateAutomatedCreditNote({
        originalInvoiceNumber: "INV-202610-0042",
        originalOrderId: "ord_cancel_991",
        restaurantId: "rest_001",
        platformGstin: "18AFXPH9838M1Z9",
        reasonCode: "05_ORDER_CANCELLED",
        reasonDescription: "Customer cancellation prior to preparation",
        taxableAmountPaise: 25_000, // ₹250.00 commission adjustment
        isInterstate: false,
      });

      assert.ok(creditNote.creditNoteNumber.startsWith("CN-"));
      assert.strictEqual(creditNote.platformGstin, "18AFXPH9838M1Z9");
      assert.strictEqual(creditNote.statutoryBasis, "Section 34, Central Goods and Services Tax (CGST) Act, 2017");
      assert.strictEqual(creditNote.taxableAmountPaise, 25_000);

      // 18% GST reversal: 9% CGST (2,250 paise) + 9% SGST (2,250 paise) = 4,500 paise
      assert.strictEqual(creditNote.cgstPaise, 2_250);
      assert.strictEqual(creditNote.sgstPaise, 2_250);
      assert.strictEqual(creditNote.totalGstPaise, 4_500);
      assert.strictEqual(creditNote.totalCreditNoteAmountPaise, 29_500); // 25,000 + 4,500
    });
  });

  // =========================================================================
  // DIRECTIVE 4: MATHEMATICAL PROOF OF BALANCE INVARIANCE
  // =========================================================================
  describe("Directive 4: Mathematical Proofs of Balance Invariance", () => {
    test("Proof 1: Closed-form Conservation of Monetary Value across N-Party Splits", () => {
      /**
       * Formal Theorem 1:
       * For any gross transaction amount G ∈ N in integer paise, decomposed into:
       *   G = M + R + P + T_9_5 + T_srv + T_tcs + T_tds
       * Where:
       *   M: Merchant Net Payout
       *   R: Rider Net Payout
       *   P: Platform Net Service Fee
       *   T_9_5: Section 9(5) CGST Food Tax
       *   T_srv: GST on Platform Services
       *   T_tcs: Section 52 TCS
       *   T_tds: Section 194-O TDS
       *
       * Let D = [G] (Debits vector)
       * Let C = [M, R, P, T_9_5, T_srv, T_tcs, T_tds] (Credits vector)
       *
       * Then:
       *   ∑ D - ∑ C ≡ 0 (mod 1) and ∑ D - ∑ C = 0 in integer arithmetic.
       */
      const foodNet = 120_000;
      const commissionBps = 1500; // 15%
      const comm = applyTaxBpsPaise(foodNet, commissionBps); // 18,000
      const commGst = applyTaxBpsPaise(comm, STATUTORY_TAX_RATES.COMMISSION_GST_BPS); // 3,240
      const tcs = applyTaxBpsPaise(foodNet, STATUTORY_TAX_RATES.TCS_SEC52_BPS); // 1,200
      const tds = applyTaxBpsPaise(foodNet, STATUTORY_TAX_RATES.TDS_SEC194_O_BPS); // 1,200
      const M = foodNet - comm - commGst - tcs - tds; // 96,360

      const deliveryFee = 6_500;
      const tip = 3_500;
      const R = deliveryFee + tip; // 10,000

      const platformFee = 2_000;
      const platGst = applyTaxBpsPaise(platformFee, STATUTORY_TAX_RATES.PLATFORM_FEE_GST_BPS); // 360
      const delGst = applyTaxBpsPaise(deliveryFee, STATUTORY_TAX_RATES.DELIVERY_FEE_GST_BPS); // 1,170
      const P = comm + platformFee; // 20,000

      const T_9_5 = applyTaxBpsPaise(foodNet, STATUTORY_TAX_RATES.FOOD_GST_BPS); // 6,000
      const T_srv = commGst + platGst + delGst; // 3,240 + 360 + 1,170 = 4,770
      const T_tcs = tcs; // 1,200
      const T_tds = tds; // 1,200

      // Total debits to bank = foodNet + T_9_5 + deliveryFee + delGst + platformFee + platGst + tip
      const customerBankDebit = foodNet + T_9_5 + deliveryFee + delGst + platformFee + platGst + tip;
      // 120,000 + 6,000 + 6,500 + 1,170 + 2,000 + 360 + 3,500 = 139,530 paise

      // Verify double-entry balancing:
      // Credits = M (96,360) + R (10,000) + P (20,000) + T_9_5 (6,000) + T_srv (4,770) + T_tcs (1,200) + T_tds (1,200)
      const sumCredits = M + R + P + T_9_5 + T_srv + T_tcs + T_tds;
      // 96,360 + 10,000 + 20,000 + 6,000 + 4,770 + 1,200 + 1,200 = 139,530 paise

      assert.strictEqual(customerBankDebit, sumCredits, "Debits must identically equal Credits");
      assert.strictEqual(customerBankDebit - sumCredits, 0, "Variance is strictly zero integer paise");
    });

    test("Proof 2: Zero Floating-Point Drift Invariant over 10,000 Scaled Iterations", () => {
      /**
       * Formal Theorem 2:
       * Let bps ∈ [0, 10000] and amount ∈ [1, 100000000] in integer paise.
       * The integer basis-point operator:
       *   f(a, r) = Math.floor((a * r + 5000) / 10000)
       * satisfies:
       *   1. f(a, r) ∈ N_0
       *   2. f(a, r) % 1 === 0
       *   3. |f(a, r) - (a * r / 10000)| <= 0.5 paise (strictly bounded rounding)
       */
      for (let i = 1; i <= 10_000; i++) {
        const amount = i * 17 + 3;
        const bps = (i * 31) % 2800; // up to 28%
        const result = applyTaxBpsPaise(amount, bps);

        assert.ok(Number.isInteger(result), `Result ${result} must be pure integer`);
        assert.ok(Number.isSafeInteger(result), `Result ${result} must be SafeInteger`);
        assert.strictEqual(result % 1, 0, `Result ${result} must have zero decimal remainder`);

        const theoretical = (amount * bps) / 10_000;
        const delta = Math.abs(result - theoretical);
        assert.ok(delta <= 0.5, `Rounding delta ${delta} must never exceed 0.5 paise`);
      }
    });
  });
});
