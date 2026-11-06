// @ts-nocheck
/**
 * ORDERKING / KINGPAY FINTECH ARCHITECTURE - SPECIALIST COUNCIL DOMAIN 4
 * Comprehensive Production Verification: NPCI Direct UPI, BharatQR & Section 9(5) Settlement
 * Statutory Entity: OrderKing / KingPay (GSTIN: 18AFXPH9838M1Z9, Assam - 788710)
 */

import { describe, it, expect } from "vitest";
import {
  PRIMARY_FOUNDER_VPA,
  SECONDARY_FOUNDER_VPA,
  SUPPORTED_FOUNDER_VPAS,
  FOUNDER_UPI_VPAS,
  isValidVPA,
  calculateCRC16CCITT,
  generateBharatQRPayload,
  verifyBharatQRChecksum,
  buildNPCIUpiIntentUrl,
  generateAppDeepLink,
  generateAllUPIAppLinks,
  type BharatQRParams,
  type UPIIntentParams,
} from "@orderking/ui";
import {
  calculateSection95DualSplit,
  handleOrderPaymentCallback,
  type OrderPaymentCallbackInput,
} from "../payments/payment-callback-handler";

describe("👑 PRODUCTION NPCI DIRECT UPI, BHARATQR & SECTION 9(5) INTEGRATION", () => {
  /* =========================================================================
   * DELIVERABLE 1: DYNAMIC BHARATQR GENERATION (BINDING TO orderking@ybl & 9395065587@ybl)
   * ========================================================================= */
  describe("Deliverable 1: Dynamic BharatQR Generation Module Binding", () => {
    const testCases = [
      {
        label: "Primary Founder VPA",
        vpa: PRIMARY_FOUNDER_VPA, // orderking@ybl
        amountPaise: 49900, // ₹499.00
        expectedAmountStr: "499.00",
        orderId: "ORDK-FOOD-88210",
      },
      {
        label: "Secondary / Fallback Founder VPA",
        vpa: SECONDARY_FOUNDER_VPA, // 9395065587@ybl
        amountPaise: 125050, // ₹1,250.50
        expectedAmountStr: "1250.50",
        orderId: "ORDK-FOOD-88211",
      },
      {
        label: "Micro-Order (Single Chai / Street Snack)",
        vpa: PRIMARY_FOUNDER_VPA,
        amountPaise: 2500, // ₹25.00
        expectedAmountStr: "25.00",
        orderId: "ORDK-FOOD-88212",
      },
      {
        label: "Large Catering Order",
        vpa: SECONDARY_FOUNDER_VPA,
        amountPaise: 5000000, // ₹50,000.00
        expectedAmountStr: "50000.00",
        orderId: "ORDK-FOOD-88213",
      },
    ];

    for (const tc of testCases) {
      it(`binds exact order amount in integer paise directly to ${tc.vpa} (${tc.label})`, () => {
        expect(SUPPORTED_FOUNDER_VPAS).toContain(tc.vpa);
        expect(isValidVPA(tc.vpa)).toBe(true);

        const params: BharatQRParams = {
          vpa: tc.vpa,
          payeeName: "OrderKingPay",
          amountPaise: tc.amountPaise,
          transactionRef: `OKUPI-${tc.orderId}`,
          transactionNote: `Order ${tc.orderId}`,
          merchantCategoryCode: "5812",
          merchantCity: "Karimganj",
          postalCode: "788710",
        };

        const result = generateBharatQRPayload(params);

        // 1. Verify returned parameters
        expect(result.vpa).toBe(tc.vpa);
        expect(result.amount).toBe(tc.expectedAmountStr);
        expect(result.amountPaise).toBe(tc.amountPaise);
        expect(result.transactionRef).toBe(`OKUPI-${tc.orderId}`);
        expect(result.payeeName).toBe("OrderKingPay");
        expect(result.isDynamic).toBe(true);

        // 2. Verify EMVCo MPM v1.0 standard TLV structure
        const payload = result.emvcoPayload;

        // Tag 00: Payload Format Indicator "01"
        expect(payload).toContain("000201");
        // Tag 01: Point of Initiation Method "12" (Dynamic QR)
        expect(payload).toContain("010212");
        // Tag 26: Merchant Account Info with Sub-tag 00 "in.npci.upi" and Sub-tag 01 VPA
        expect(payload).toContain("in.npci.upi");
        expect(payload).toContain(tc.vpa);
        // Tag 52: MCC 5812
        expect(payload).toContain("52045812");
        // Tag 53: ISO-4217 Currency Code 356 (INR)
        expect(payload).toContain("5303356");
        // Tag 54: Transaction Amount
        const expectedTag54 = `54${tc.expectedAmountStr.length.toString().padStart(2, "0")}${tc.expectedAmountStr}`;
        expect(payload).toContain(expectedTag54);
        // Tag 58: Country Code IN
        expect(payload).toContain("5802IN");
        // Tag 59: Merchant Name
        expect(payload).toContain("OrderKingPay");
        // Tag 60: Merchant City
        expect(payload).toContain("Karimganj");
        // Tag 62: Additional Data (Transaction Reference)
        expect(payload).toContain(`OKUPI-${tc.orderId}`);

        // 3. Verify strict 16-bit CRC-CCITT (Tag 63)
        expect(payload).toMatch(/6304[0-9A-F]{4}$/);
        expect(verifyBharatQRChecksum(payload)).toBe(true);
      });
    }

    it("strictly rejects floating-point paise or negative amounts", () => {
      expect(() =>
        generateBharatQRPayload({
          vpa: PRIMARY_FOUNDER_VPA,
          payeeName: "OrderKingPay",
          amountPaise: 499.55, // Fractional paise forbidden
          transactionRef: "OKUPI-FLOAT-FAIL",
        })
      ).toThrow(/SafeInteger/i);

      expect(() =>
        generateBharatQRPayload({
          vpa: PRIMARY_FOUNDER_VPA,
          payeeName: "OrderKingPay",
          amountPaise: -100, // Negative forbidden
          transactionRef: "OKUPI-NEG-FAIL",
        })
      ).toThrow(/non-negative/i);
    });

    it("detects any data tampering in BharatQR payload via CRC-16 check", () => {
      const valid = generateBharatQRPayload({
        vpa: PRIMARY_FOUNDER_VPA,
        payeeName: "OrderKingPay",
        amountPaise: 75000,
        transactionRef: "OKUPI-TAMPER-TEST",
      });

      expect(verifyBharatQRChecksum(valid.emvcoPayload)).toBe(true);

      // Tamper 1: change 1 digit of amount
      const tamperedAmount = valid.emvcoPayload.replace("750.00", "999.00");
      expect(verifyBharatQRChecksum(tamperedAmount)).toBe(false);

      // Tamper 2: change VPA
      const tamperedVpa = valid.emvcoPayload.replace("orderking@ybl", "hacker@fake");
      expect(verifyBharatQRChecksum(tamperedVpa)).toBe(false);
    });
  });

  /* =========================================================================
   * DELIVERABLE 2: INTENT DEEP-LINKING ACROSS GPAY, PHONEPE & PAYTM
   * ========================================================================= */
  describe("Deliverable 2: Intent Deep-Linking (Google Pay, PhonePe, Paytm)", () => {
    const intentParams: UPIIntentParams = {
      vpa: PRIMARY_FOUNDER_VPA,
      payeeName: "OrderKingPay",
      amountPaise: 34900, // ₹349.00
      transactionRef: "OKUPI-ORD-99104",
      transactionNote: "Biryani Special Combo",
      merchantCategoryCode: "5812",
    };

    it("enforces mandatory transaction reference ('tr') and fails closed when missing", () => {
      expect(() =>
        generateAppDeepLink("gpay", {
          ...intentParams,
          transactionRef: "", // Empty tr
        })
      ).toThrow(/Transaction reference \('tr'\) is strictly mandatory/i);

      expect(() =>
        generateAppDeepLink("phonepe", {
          ...intentParams,
          transactionRef: "   ", // Whitespace tr
        })
      ).toThrow(/Transaction reference \('tr'\) is strictly mandatory/i);
    });

    it("enforces mandatory payee name / order public ID ('pn') and fails closed when missing", () => {
      expect(() =>
        generateAppDeepLink("paytm", {
          ...intentParams,
          payeeName: "", // Empty pn
        })
      ).toThrow(/Payee name \/ order public ID \('pn'\) is strictly mandatory/i);
    });

    it("generates verified Google Pay deep link with mandatory tr, pn, pa, am, and cu=INR", () => {
      const gpayUrl = generateAppDeepLink("gpay", intentParams);

      expect(gpayUrl.startsWith("tez://upi/pay?")).toBe(true);
      expect(gpayUrl).toContain("pa=orderking%40ybl");
      expect(gpayUrl).toContain("pn=OrderKingPay");
      expect(gpayUrl).toContain("tr=OKUPI-ORD-99104");
      expect(gpayUrl).toContain("am=349.00");
      expect(gpayUrl).toContain("cu=INR");
      expect(gpayUrl).toContain("mc=5812");
      expect(gpayUrl).toContain("mode=02");
    });

    it("generates verified PhonePe deep link with mandatory tr, pn, pa, am, and cu=INR", () => {
      const phonepeUrl = generateAppDeepLink("phonepe", intentParams);

      expect(phonepeUrl.startsWith("phonepe://pay?")).toBe(true);
      expect(phonepeUrl).toContain("pa=orderking%40ybl");
      expect(phonepeUrl).toContain("pn=OrderKingPay");
      expect(phonepeUrl).toContain("tr=OKUPI-ORD-99104");
      expect(phonepeUrl).toContain("am=349.00");
      expect(phonepeUrl).toContain("cu=INR");
      expect(phonepeUrl).toContain("mode=02");
    });

    it("generates verified Paytm deep link with mandatory tr, pn, pa, am, and cu=INR", () => {
      const paytmUrl = generateAppDeepLink("paytm", intentParams);

      expect(paytmUrl.startsWith("paytmmp://pay?")).toBe(true);
      expect(paytmUrl).toContain("pa=orderking%40ybl");
      expect(paytmUrl).toContain("pn=OrderKingPay");
      expect(paytmUrl).toContain("tr=OKUPI-ORD-99104");
      expect(paytmUrl).toContain("am=349.00");
      expect(paytmUrl).toContain("cu=INR");
      expect(paytmUrl).toContain("mode=02");
    });

    it("supports switching to secondary founder VPA (9395065587@ybl) across all 3 apps", () => {
      const secondaryParams: UPIIntentParams = {
        ...intentParams,
        vpa: SECONDARY_FOUNDER_VPA,
      };

      const links = generateAllUPIAppLinks(secondaryParams);

      expect(links.gpay).toContain("pa=9395065587%40ybl");
      expect(links.phonepe).toContain("pa=9395065587%40ybl");
      expect(links.paytm).toContain("pa=9395065587%40ybl");
      expect(links.gpay).toContain("tr=OKUPI-ORD-99104");
      expect(links.phonepe).toContain("tr=OKUPI-ORD-99104");
      expect(links.paytm).toContain("tr=OKUPI-ORD-99104");
    });
  });

  /* =========================================================================
   * DELIVERABLE 3: SECTION 9(5) CGST (2.5%) & SGST (2.5%) IN PAYMENT CALLBACK
   * ========================================================================= */
  describe("Deliverable 3: Section 9(5) CGST (2.5%) & SGST (2.5%) Ledger Splits", () => {
    it("calculates exact 2.5% CGST and 2.5% SGST dual split with zero rounding variance", () => {
      // 1. Symmetric even food amount: ₹500 (50,000 paise)
      const evenSplit = calculateSection95DualSplit(50000, 0, false);
      expect(evenSplit.totalSec95TaxPaise).toBe(2500); // 5% of 50000 = 2500 paise
      expect(evenSplit.cgstPaise).toBe(1250); // 2.5%
      expect(evenSplit.sgstPaise).toBe(1250); // 2.5%
      expect(evenSplit.cgstPaise + evenSplit.sgstPaise).toBe(evenSplit.totalSec95TaxPaise);
      expect(evenSplit.gstin).toBe("18AFXPH9838M1Z9");

      // 2. Non-symmetric odd food amount: ₹153.75 (15,375 paise)
      // 5% of 15375 = 768.75 -> round to 769 paise
      const oddSplit = calculateSection95DualSplit(15375, 2000, false); // food 15375 + packaging 2000 = 17375
      // 5% of 17375 = 868.75 -> round to 869 paise
      expect(oddSplit.totalSec95TaxPaise).toBe(869);
      expect(oddSplit.cgstPaise).toBe(Math.floor(869 / 2)); // 434
      expect(oddSplit.sgstPaise).toBe(869 - 434); // 435
      expect(oddSplit.cgstPaise + oddSplit.sgstPaise).toBe(oddSplit.totalSec95TaxPaise);
    });

    it("executes payment callback with immutable double-entry ledger splits", async () => {
      const orderId = `ord_sec95_${Date.now()}`;
      const paymentId = `pay_upi_${Date.now()}`;
      const idempotencyKey = `callback_sec95_${Date.now()}`;

      const foodSubtotalPaise = 60000; // ₹600.00
      const packagingChargePaise = 3000; // ₹30.00
      const deliveryFeePaise = 4500; // ₹45.00
      const customerTipPaise = 2000; // ₹20.00
      const platformFeePaise = 600; // ₹6.00 platform fee

      // Calculated taxes:
      // Food 5% under Section 9(5) = 5% of (60000 + 3000) = 3150 paise
      // Platform 18% GST = 18% of 600 = 108 paise
      const sec95FoodGstPaise = 3150;
      const platformGstPaise = 108;

      const totalAmountPaise =
        foodSubtotalPaise +
        packagingChargePaise +
        deliveryFeePaise +
        customerTipPaise +
        platformFeePaise +
        sec95FoodGstPaise +
        platformGstPaise;

      const callbackInput: OrderPaymentCallbackInput = {
        orderId,
        paymentId,
        paymentMethod: "NPCI_UPI",
        vpa: PRIMARY_FOUNDER_VPA,
        totalAmountPaise,
        foodSubtotalPaise,
        packagingChargePaise,
        deliveryFeePaise,
        platformFeePaise,
        customerTipPaise,
        restaurantId: "rest_sylhet_heritage",
        riderId: "rider_assam_speedy",
        idempotencyKey,
      };

      const result = await handleOrderPaymentCallback(callbackInput);

      // 1. Success assertions
      expect(result.success).toBe(true);
      expect(result.orderId).toBe(orderId);
      expect(result.paymentId).toBe(paymentId);
      expect(result.totalDebitPaise).toBe(totalAmountPaise);
      expect(result.totalCreditPaise).toBe(totalAmountPaise);

      // 2. Exact mathematical balance proof: Debits - Credits === 0
      expect(result.totalDebitPaise - result.totalCreditPaise).toBe(0);

      // 3. Verify Section 9(5) CGST (2.5%) & SGST (2.5%) split in result
      expect(result.sec95Tax.totalSec95TaxPaise).toBe(3150);
      expect(result.sec95Tax.cgstPaise).toBe(1575); // 2.5%
      expect(result.sec95Tax.sgstPaise).toBe(1575); // 2.5%
      expect(result.sec95Tax.cgstPaise + result.sec95Tax.sgstPaise).toBe(3150);

      // 4. Verify individual ledger entries in the posted transaction
      const entries = result.ledgerTransaction.entries;

      const debitEntry = entries.find((e) => e.direction === "DEBIT");
      expect(debitEntry).toBeDefined();
      expect(debitEntry!.account).toBe("BANK_CLEARING");
      expect(debitEntry!.amountPaise).toBe(totalAmountPaise);
      expect(debitEntry!.entityId).toBe(`NPCI_UPI:${PRIMARY_FOUNDER_VPA}`);

      const cgstEntry = entries.find((e) => e.account === "CGST_9_5_LIABILITY");
      expect(cgstEntry).toBeDefined();
      expect(cgstEntry!.direction).toBe("CREDIT");
      expect(cgstEntry!.amountPaise).toBe(1575);
      expect(cgstEntry!.entityId).toContain("18AFXPH9838M1Z9");

      const sgstEntry = entries.find((e) => e.account === "SGST_9_5_LIABILITY");
      expect(sgstEntry).toBeDefined();
      expect(sgstEntry!.direction).toBe("CREDIT");
      expect(sgstEntry!.amountPaise).toBe(1575);
      expect(sgstEntry!.entityId).toContain("18AFXPH9838M1Z9");

      const platformGstEntry = entries.find((e) => e.account === "GST_OUTPUT_LIABILITY");
      expect(platformGstEntry).toBeDefined();
      expect(platformGstEntry!.direction).toBe("CREDIT");
      expect(platformGstEntry!.amountPaise).toBe(platformGstPaise);

      const riderEntry = entries.find((e) => e.account === "RIDER_PAYABLE");
      expect(riderEntry).toBeDefined();
      expect(riderEntry!.amountPaise).toBe(deliveryFeePaise + customerTipPaise); // 6500 paise

      const restaurantEntry = entries.find((e) => e.account === "RESTAURANT_PAYABLE");
      expect(restaurantEntry).toBeDefined();
      expect(restaurantEntry!.amountPaise).toBe(result.netRestaurantPaise);
    });

    it("enforces fail-closed idempotency against duplicate payment callbacks", async () => {
      const orderId = `ord_idem_${Date.now()}`;
      const paymentId = `pay_idem_${Date.now()}`;
      const idempotencyKey = `callback_idem_${Date.now()}`;

      const input: OrderPaymentCallbackInput = {
        orderId,
        paymentId,
        paymentMethod: "BHARAT_QR",
        vpa: SECONDARY_FOUNDER_VPA,
        totalAmountPaise: 25000,
        foodSubtotalPaise: 20000,
        packagingChargePaise: 1000,
        deliveryFeePaise: 3000,
        platformFeePaise: 500,
        customerTipPaise: 0,
        restaurantId: "rest_karimganj_spice",
        riderId: "rider_fast",
        idempotencyKey,
      };

      // First callback execution
      const first = await handleOrderPaymentCallback(input);
      expect(first.success).toBe(true);

      // Second duplicate callback execution with exact same idempotencyKey
      const second = await handleOrderPaymentCallback(input);
      expect(second.success).toBe(true);
      // Returns idempotent transaction without creating a duplicate or unbalancing ledger
      expect(second.totalDebitPaise).toBe(first.totalDebitPaise);
      expect(second.totalCreditPaise).toBe(first.totalCreditPaise);
    });
  });
});
