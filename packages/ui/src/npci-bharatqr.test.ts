import { describe, it } from "node:test";
import assert from "node:assert/strict";
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
} from "./npci-bharatqr.ts";

describe("Production NPCI Direct UPI & BharatQR Integration Engine", () => {
  describe("1. Direct Founder VPAs", () => {
    it("binds primary founder VPA to orderking@ybl", () => {
      assert.equal(PRIMARY_FOUNDER_VPA, "orderking@ybl");
      assert.equal(isValidVPA(PRIMARY_FOUNDER_VPA), true);
    });

    it("binds secondary founder VPA to 9395065587@ybl", () => {
      assert.equal(SECONDARY_FOUNDER_VPA, "9395065587@ybl");
      assert.equal(isValidVPA(SECONDARY_FOUNDER_VPA), true);
    });

    it("contains both active founder VPAs in supported list", () => {
      assert.equal(SUPPORTED_FOUNDER_VPAS.includes("orderking@ybl"), true);
      assert.equal(SUPPORTED_FOUNDER_VPAS.includes("9395065587@ybl"), true);
    });
  });

  describe("2. BharatQR EMVCo MPM v1.0 Generation", () => {
    it("generates standards-compliant payload with 16-bit CRC-CCITT for primary VPA", () => {
      const qr = generateBharatQRPayload({
        vpa: PRIMARY_FOUNDER_VPA,
        payeeName: "OrderKingPay",
        amountPaise: 49900, // ₹499.00
        transactionRef: "OKUPI-9921",
        transactionNote: "Food Delivery",
      });

      assert.equal(qr.amountPaise, 49900);
      assert.equal(qr.amount, "499.00");
      assert.equal(qr.vpa, "orderking@ybl");
      assert.equal(qr.emvcoPayload.startsWith("000201010212"), true);
      assert.equal(qr.emvcoPayload.includes("orderking@ybl"), true);
      assert.equal(qr.emvcoPayload.includes("5406499.00"), true);
      assert.equal(verifyBharatQRChecksum(qr.emvcoPayload), true);
    });

    it("generates valid payload for secondary founder VPA", () => {
      const qr = generateBharatQRPayload({
        vpa: SECONDARY_FOUNDER_VPA,
        payeeName: "OrderKingPay",
        amountPaise: 125000, // ₹1,250.00
        transactionRef: "OKUPI-CATER-1",
      });

      assert.equal(qr.amountPaise, 125000);
      assert.equal(qr.amount, "1250.00");
      assert.equal(qr.vpa, "9395065587@ybl");
      assert.equal(verifyBharatQRChecksum(qr.emvcoPayload), true);
    });

    it("strictly rejects non-safe-integer or negative paise amounts", () => {
      assert.throws(
        () =>
          generateBharatQRPayload({
            vpa: PRIMARY_FOUNDER_VPA,
            payeeName: "OrderKingPay",
            amountPaise: 499.5, // Float invalid!
            transactionRef: "FLOAT-TEST",
          }),
        /SafeInteger/i
      );

      assert.throws(
        () =>
          generateBharatQRPayload({
            vpa: PRIMARY_FOUNDER_VPA,
            payeeName: "OrderKingPay",
            amountPaise: -100, // Negative invalid!
            transactionRef: "NEG-TEST",
          }),
        /non-negative SafeInteger/i
      );
    });

    it("detects any bit corruption or tampering via CRC-16 failure", () => {
      const qr = generateBharatQRPayload({
        vpa: PRIMARY_FOUNDER_VPA,
        payeeName: "OrderKingPay",
        amountPaise: 29900,
        transactionRef: "OKUPI-CRC",
      });

      assert.equal(verifyBharatQRChecksum(qr.emvcoPayload), true);

      // Corrupt 1 character in payload body
      const tampered = qr.emvcoPayload.replace("299.00", "999.00");
      assert.equal(verifyBharatQRChecksum(tampered), false);
    });
  });

  describe("3. Universal UPI Deep-Linking & Intent Routing", () => {
    const params = {
      vpa: PRIMARY_FOUNDER_VPA,
      payeeName: "OrderKingPay",
      amountInRupees: 350.0,
      currency: "INR" as const,
      transactionRef: "TXN-OK-1029",
      transactionNote: "Biryani Feast",
    };

    it("constructs canonical upi://pay URI", () => {
      const uri = buildNPCIUpiIntentUrl(params);
      assert.equal(uri.startsWith("upi://pay?"), true);
      assert.equal(uri.includes("pa=orderking%40ybl"), true);
      assert.equal(uri.includes("pn=OrderKingPay"), true);
      assert.equal(uri.includes("am=350.00"), true);
      assert.equal(uri.includes("cu=INR"), true);
      assert.equal(uri.includes("tr=TXN-OK-1029"), true);
    });

    it("generates dedicated deep links for GPay, PhonePe, and Paytm", () => {
      const gpay = generateAppDeepLink("gpay", params);
      const phonepe = generateAppDeepLink("phonepe", params);
      const paytm = generateAppDeepLink("paytm", params);

      assert.equal(gpay.startsWith("tez://upi/pay?"), true);
      assert.equal(phonepe.startsWith("phonepe://pay?"), true);
      assert.equal(paytm.startsWith("paytmmp://pay?"), true);
    });

    it("fails closed when mandatory transaction reference 'tr' is missing", () => {
      assert.throws(
        () =>
          generateAppDeepLink("gpay", {
            ...params,
            transactionRef: "",
          }),
        /Transaction reference \('tr'\) is strictly mandatory/i
      );
    });

    it("fails closed when mandatory payee name 'pn' is missing", () => {
      assert.throws(
        () =>
          generateAppDeepLink("phonepe", {
            ...params,
            payeeName: "   ",
          }),
        /Payee name \/ order public ID \('pn'\) is strictly mandatory/i
      );
    });

    it("generates all links bundle simultaneously", () => {
      const bundle = generateAllUPIAppLinks(params);
      assert.equal(typeof bundle.gpay, "string");
      assert.equal(typeof bundle.phonepe, "string");
      assert.equal(typeof bundle.paytm, "string");
      assert.equal(typeof bundle.universal, "string");
      assert.equal(bundle.universal.startsWith("upi://pay?"), true);
    });
  });
});
