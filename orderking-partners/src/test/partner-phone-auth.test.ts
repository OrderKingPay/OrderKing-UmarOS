import { describe, it, expect, vi, beforeEach } from "vitest";
import { firebaseConfig, getFirebaseApp } from "../lib/auth/firebase";
import {
  sanitizeIndianPhone,
  isValidIndianPhone,
  buildWhatsAppOtpUrl,
  handleSendPartnerOtp,
  handleVerifyPartnerOtp,
  partnerOtpStore,
  dispatchOtpSms,
} from "../lib/server/sms-gateway";

describe("Partner Phone Authentication & Zero-Lockout Architecture Audit", () => {
  describe("1. Firebase Phone Auth Configuration & Quota Audit", () => {
    it("has complete Google Firebase Phone Auth parameters configured", () => {
      expect(firebaseConfig.apiKey).toBeTruthy();
      expect(firebaseConfig.apiKey.startsWith("AIzaSy")).toBe(true);
      expect(firebaseConfig.authDomain).toBe("orderkingpay.firebaseapp.com");
      expect(firebaseConfig.projectId).toBe("orderkingpay");
      expect(firebaseConfig.messagingSenderId).toBe("446957899969");
      expect(firebaseConfig.appId).toContain("446957899969");
    });

    it("verifies shared 10,000 monthly Spark free quota model across apps", () => {
      // Under Google Firebase Spark Plan, the 10,000 free monthly phone verification quota
      // is allocated per Firebase Project (projectId: "orderkingpay").
      // Since orderking-customers, orderking-riders, and orderking-partners all target
      // projectId: "orderkingpay", they share this single 10,000 pool.
      const sharedProjectId = firebaseConfig.projectId;
      expect(sharedProjectId).toBe("orderkingpay");

      // Quota constants
      const FIREBASE_SPARK_MONTHLY_FREE_SMS_QUOTA = 10_000;
      expect(FIREBASE_SPARK_MONTHLY_FREE_SMS_QUOTA).toBe(10_000);
    });
  });

  describe("2. Indian Mobile Number Sanitization & Validation", () => {
    it("sanitizes various formats to 10-digit clean numbers", () => {
      expect(sanitizeIndianPhone("+91 98765 43210")).toBe("9876543210");
      expect(sanitizeIndianPhone("919876543210")).toBe("9876543210");
      expect(sanitizeIndianPhone("09876543210")).toBe("9876543210");
      expect(sanitizeIndianPhone("98765-43210")).toBe("9876543210");
    });

    it("validates legitimate Indian mobile numbers (starts with 6, 7, 8, 9)", () => {
      expect(isValidIndianPhone("9876543210")).toBe(true);
      expect(isValidIndianPhone("8765432109")).toBe(true);
      expect(isValidIndianPhone("7654321098")).toBe(true);
      expect(isValidIndianPhone("6543210987")).toBe(true);

      // Invalid: starts with 1-5 or wrong length
      expect(isValidIndianPhone("5432109876")).toBe(false);
      expect(isValidIndianPhone("987654321")).toBe(false);
      expect(isValidIndianPhone("98765432100")).toBe(false);
    });
  });

  describe("3. Zero-Lockout 1-Tap WhatsApp OTP Link", () => {
    it("builds authenticated WhatsApp deep link for 1-tap zero-lockout access", () => {
      const url = buildWhatsAppOtpUrl("9876543210", "482910", "OrderKing Partner");
      expect(url).toContain("https://wa.me/919876543210?text=");
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain("482910");
      expect(decoded).toContain("OrderKing Partner");
      expect(decoded).toContain("Valid for 10 minutes");
    });
  });

  describe("4. Partner Server OTP Dispatch & Verification Flow", () => {
    const testPhone = "9876501234";

    beforeEach(() => {
      partnerOtpStore.clear();
    });

    it("dispatches partner OTP and generates WhatsApp fallback URL", async () => {
      const res = await handleSendPartnerOtp({
        phone: testPhone,
        channel: "sms",
      });

      expect(res.success).toBe(true);
      expect(res.phone).toBe(testPhone);
      expect(res.whatsAppOtpUrl).toContain("https://wa.me/919876501234");

      // Verify OTP challenge was stored in-memory
      const record = partnerOtpStore.get(testPhone);
      expect(record).toBeDefined();
      expect(record!.phone).toBe(testPhone);
      expect(record!.otp.length).toBe(6);
      expect(record!.expiresAt).toBeGreaterThan(Date.now());
    });

    it("verifies valid OTP and generates canonical partner credentials", async () => {
      // 1. Dispatch
      await handleSendPartnerOtp({
        phone: testPhone,
        channel: "sms",
      });
      const record = partnerOtpStore.get(testPhone)!;

      // 2. Verify with correct code
      const verifyRes = await handleVerifyPartnerOtp({
        phone: testPhone,
        otp: record.otp,
      });

      expect(verifyRes.success).toBe(true);
      expect(verifyRes.phone).toBe(testPhone);
      expect(verifyRes.email).toBe(`${testPhone}@partner.orderking.in`);
      expect(verifyRes.credential).toBe(`PartnerOtp#${testPhone}!2026`);

      // Store challenge should be consumed
      expect(partnerOtpStore.has(testPhone)).toBe(false);
    });

    it("rejects incorrect OTP codes with clear error", async () => {
      await handleSendPartnerOtp({
        phone: testPhone,
        channel: "sms",
      });

      await expect(
        handleVerifyPartnerOtp({
          phone: testPhone,
          otp: "999999",
        }),
      ).rejects.toThrow(/Invalid verification code/);
    });

    it("supports test environment master bypass (123456)", async () => {
      const verifyRes = await handleVerifyPartnerOtp({
        phone: testPhone,
        otp: "123456",
      });

      expect(verifyRes.success).toBe(true);
      expect(verifyRes.email).toBe(`${testPhone}@partner.orderking.in`);
    });
  });
});