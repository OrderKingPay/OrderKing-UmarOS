import { describe, it, expect } from "vitest";
import {
  validateIndianMobile,
  buildFast2SmsOTPPayload,
  buildWhatsAppFailoverLink,
  buildWebOtpOptions,
  validateFSSAI,
  validateGSTIN,
  validatePAN,
  validateIFSC,
  verifyPennyDrop,
  computePartnerContractSchedule,
} from "../features/kyc/MerchantKYCVerification";

describe("MerchantKYCVerification - OrderKing Restaurant Onboarding Standards", () => {
  describe("Phone & Telecom Authentication", () => {
    it("validates 10-digit Indian mobile numbers starting with 6, 7, 8, or 9", () => {
      const valid = validateIndianMobile("9395065587");
      expect(valid.isValid).toBe(true);
      expect(valid.code).toBe("VALID_PHONE");
      expect(valid.metadata?.formatted).toBe("+91 93950 65587");

      const validWithPrefix = validateIndianMobile("+91 8822334455");
      expect(validWithPrefix.isValid).toBe(true);
      expect(validWithPrefix.metadata?.raw).toBe("8822334455");

      const invalidStart = validateIndianMobile("5512345678");
      expect(invalidStart.isValid).toBe(false);
      expect(invalidStart.code).toBe("INVALID_PHONE");

      const tooShort = validateIndianMobile("98765");
      expect(tooShort.isValid).toBe(false);
    });

    it("builds genuine Fast2SMS carrier payload", () => {
      const payload = buildFast2SmsOTPPayload("9395065587", "492018", "FAST2SMS_KEY_TEST");
      expect(payload.route).toBe("q");
      expect(payload.authorization).toBe("FAST2SMS_KEY_TEST");
      expect(payload.numbers).toBe("9395065587");
      expect(payload.message).toContain("492018");
      expect(payload.message).toContain("OrderKing Partner");
    });

    it("builds WhatsApp Business failover link", () => {
      const link = buildWhatsAppFailoverLink("9395065587", "881299");
      expect(link).toContain("wa.me/919395065587");
      expect(link).toContain("881299");
    });

    it("generates WebOTP Credential API options", () => {
      const opts = buildWebOtpOptions();
      expect(opts).toBeDefined();
      expect((opts as any).otp?.transport).toEqual(["sms"]);
    });
  });

  describe("FSSAI FoSCoS Statutory Verification", () => {
    it("validates authentic 14-digit FSSAI licenses across Registration, State, and Central tiers", () => {
      // 1. Petty Registration (Digit 1 = '1', State = '18' Assam)
      const fssai1 = validateFSSAI("11823001000123");
      expect(fssai1.isValid).toBe(true);
      expect(fssai1.code).toBe("FSSAI_VALID");
      expect(fssai1.metadata?.licenseType).toContain("Petty Registration");

      // 2. State License (Digit 1 = '2', State = '18' Assam)
      const fssai2 = validateFSSAI("21822002000456");
      expect(fssai2.isValid).toBe(true);
      expect(fssai2.metadata?.licenseType).toContain("State License");

      // 3. Central License (Digit 1 = '3', State = '00' Central)
      const fssai3 = validateFSSAI("30021003000789");
      expect(fssai3.isValid).toBe(true);
      expect(fssai3.metadata?.licenseType).toContain("Central License");
    });

    it("rejects invalid FSSAI license digits and non-existent state codes", () => {
      // Less than 14 digits
      expect(validateFSSAI("11823").isValid).toBe(false);

      // Invalid first digit (must be 1, 2, or 3)
      const invalidType = validateFSSAI("41823001000123");
      expect(invalidType.isValid).toBe(false);
      expect(invalidType.code).toBe("INVALID_TYPE");

      // Invalid state code (> 38)
      const invalidState = validateFSSAI("19923001000123");
      expect(invalidState.isValid).toBe(false);
      expect(invalidState.code).toBe("INVALID_STATE");
    });

    it("tracks FSSAI expiry status with warning thresholds", () => {
      // Expired license
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const expired = validateFSSAI("11823001000123", yesterday);
      expect(expired.isValid).toBe(false);
      expect(expired.code).toBe("FSSAI_EXPIRED");

      // Expiring soon (10 days remaining)
      const in10Days = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
      const expiringSoon = validateFSSAI("11823001000123", in10Days);
      expect(expiringSoon.isValid).toBe(true);
      expect(expiringSoon.code).toBe("FSSAI_EXPIRING_SOON");

      // Active (200 days remaining)
      const in200Days = new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString();
      const active = validateFSSAI("11823001000123", in200Days);
      expect(active.isValid).toBe(true);
      expect(active.code).toBe("FSSAI_VALID");
    });
  });

  describe("GSTIN & PAN Verification", () => {
    it("validates and categorizes authentic 15-character GSTIN", () => {
      // Regular restaurant GSTIN in Assam (18)
      const gstinRegular = validateGSTIN("18ABCDE1234F1Z5");
      expect(gstinRegular.isValid).toBe(true);
      expect(gstinRegular.metadata?.statePrefix).toBe("18");
      expect(gstinRegular.metadata?.pan).toBe("ABCDE1234F");
      expect(gstinRegular.metadata?.category).toBe("REGULAR_RESTAURANT_5");

      // Invalid GSTIN format
      const invalidGstin = validateGSTIN("18INVALIDGST");
      expect(invalidGstin.isValid).toBe(false);
    });

    it("validates 10-character PAN and extracts entity type", () => {
      // Proprietor PAN (4th character 'P')
      const panProp = validatePAN("ABCPD1234F");
      expect(panProp.isValid).toBe(true);
      expect(panProp.metadata?.entityType).toContain("Proprietorship");
      expect(panProp.metadata?.isProprietor).toBe(true);

      // Company PAN (4th character 'C')
      const panComp = validatePAN("XYZCA9999K");
      expect(panComp.isValid).toBe(true);
      expect(panComp.metadata?.entityType).toContain("Company");
      expect(panComp.metadata?.isProprietor).toBe(false);

      // Invalid PAN
      expect(validatePAN("ABC123").isValid).toBe(false);
    });
  });

  describe("Bank Account & Penny-Drop Verification", () => {
    it("validates RBI-compliant IFSC format", () => {
      expect(validateIFSC("SBIN0000001")).toBe(true);
      expect(validateIFSC("HDFC0001234")).toBe(true);
      expect(validateIFSC("YESB0000123")).toBe(true);

      expect(validateIFSC("INVALID")).toBe(false);
      expect(validateIFSC("SBIN1000001")).toBe(false); // 5th char must be 0
    });

    it("executes ₹1.00 automated penny-drop credit test simulation with authentic UTR", async () => {
      const res = await verifyPennyDrop("123456789012", "HDFC0001234", "Barak Valley Hospitality");

      expect(res.success).toBe(true);
      expect(res.amountCreditedPaise).toBe(100); // ₹1.00 = 100 paise
      expect(res.utrNumber.length).toBe(16);
      expect(res.utrNumber.startsWith("PDRP")).toBe(true);
      expect(res.accountNumberMasked).toBe("XXXXXX9012");
      expect(res.nameMatchConfidence).toBeGreaterThanOrEqual(85);
      expect(res.beneficiaryName).toBe("BARAK VALLEY HOSPITALITY");
    });
  });

  describe("Partner Contract Terms & Commission Schedules", () => {
    it("computes standard, exclusive, and cloud kitchen commission schedules", () => {
      const standardSchedule = computePartnerContractSchedule(22.0, true, 99900);
      expect(standardSchedule.commissionRatePercent).toBe(22.0);
      expect(standardSchedule.onboardingFeeTotalPaise).toBe(99900); // ₹999.00
      expect(standardSchedule.onboardingFeePerCyclePaise).toBe(33300); // ₹333.00 amortized
      expect(standardSchedule.paymentGatewayFeePercent).toBe(1.84);
      expect(standardSchedule.tcsSection52Percent).toBe(1.0);
      expect(standardSchedule.tdsSection194OPercent).toBe(0.1);

      const noPanSchedule = computePartnerContractSchedule(18.0, false, 149900);
      expect(noPanSchedule.commissionRatePercent).toBe(18.0);
      expect(noPanSchedule.onboardingFeeTotalPaise).toBe(149900); // ₹1,499.00
      expect(noPanSchedule.tdsSection194OPercent).toBe(1.0); // 1.0% TDS without PAN
    });
  });
});
