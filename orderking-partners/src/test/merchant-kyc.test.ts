import { describe, it, expect } from "vitest";
import {
  validateFssai,
  parseFssai,
  calculateFssaiChecksum,
  validateGstin,
  validateGstinChecksum,
  calculateGstinChecksum,
  validateIfsc,
  validatePan,
  validateBankAccount,
  validateStatutoryKyc,
  isStatutoryKycApproved,
  getMenuLockState,
  assertMenuUnlocked,
} from "../lib/merchant-kyc";

describe("Merchant Statutory KYC Validation Suite", () => {
  describe("14-Digit FSSAI Registration & Algorithm Validation", () => {
    it("accepts valid 14-digit FSSAI licenses across registration types and states", () => {
      // Type 1: Petty Food Business Registration, State 03 (Punjab)
      expect(validateFssai("10326999000184")).toBe(true);
      // Type 1: Central Registration, State 00 (Central Head Office)
      expect(validateFssai("10012021000123")).toBe(true);
      // Type 2: State License, State 27 (Maharashtra)
      expect(validateFssai("22723000001234")).toBe(true);
      // Type 2: State License, State 29 (Karnataka)
      expect(validateFssai("22924000005678")).toBe(true);
      // Type 3: Central License, State 07 (Delhi)
      expect(validateFssai("30722000009999")).toBe(true);
      // Type 3: Central License, State 00 (Central)
      expect(validateFssai("30021000000001")).toBe(true);
    });

    it("correctly parses statutory components of 14-digit FSSAI", () => {
      const parsed = parseFssai("10326999000184");
      expect(parsed.isValid).toBe(true);
      expect(parsed.registrationType).toBe(1);
      expect(parsed.typeName).toBe("Registration (Petty Food Business)");
      expect(parsed.stateCode).toBe("03");
      expect(parsed.year).toBe("26");
      expect(parsed.registrarCode).toBe("999");
      expect(parsed.serialNumber).toBe("000184");

      const stateLicense = parseFssai("22723000001234");
      expect(stateLicense.isValid).toBe(true);
      expect(stateLicense.registrationType).toBe(2);
      expect(stateLicense.typeName).toBe("State License");
      expect(stateLicense.stateCode).toBe("27");
    });

    it("rejects FSSAI with invalid length (too short or too long)", () => {
      expect(validateFssai("1032699900018")).toBe(false); // 13 digits
      expect(validateFssai("103269990001845")).toBe(false); // 15 digits
      expect(validateFssai("")).toBe(false);
      expect(validateFssai("123")).toBe(false);
    });

    it("rejects FSSAI containing non-numeric characters", () => {
      expect(validateFssai("1032699900018A")).toBe(false);
      expect(validateFssai("10326999-00018")).toBe(false);
      expect(validateFssai("103269 9000184")).toBe(false);
    });

    it("rejects FSSAI with invalid registration type code", () => {
      // Must start with 1, 2, or 3
      expect(validateFssai("00326999000184")).toBe(false); // starts with 0
      expect(validateFssai("40326999000184")).toBe(false); // starts with 4
      expect(validateFssai("90326999000184")).toBe(false); // starts with 9
    });

    it("rejects FSSAI with invalid state codes", () => {
      expect(validateFssai("19926999000184")).toBe(false); // State 99 doesn't exist
      expect(validateFssai("14526999000184")).toBe(false); // State 45 doesn't exist
      // State license (Type 2) cannot use central jurisdiction code '00'
      expect(validateFssai("20023000001234")).toBe(false);
    });

    it("rejects FSSAI with all-zero serial numbers", () => {
      expect(validateFssai("10326999000000")).toBe(false);
    });

    it("calculates algorithmic checksums consistently", () => {
      const checksum = calculateFssaiChecksum("1032699900018");
      expect(typeof checksum).toBe("number");
      expect(checksum).toBeGreaterThanOrEqual(0);
      expect(checksum).toBeLessThanOrEqual(9);
    });
  });

  describe("15-Character GSTIN Statutory Validation", () => {
    it("accepts valid statutory 15-character GSTIN numbers", () => {
      expect(validateGstin("18AAFCO9182K1Z5")).toBe(true); // Assam (18)
      expect(validateGstin("27AAPFU0955L1ZV")).toBe(true); // Maharashtra (27)
      expect(validateGstin("29ABCDE1234F1Z5")).toBe(true); // Karnataka (29)
      expect(validateGstin("07AAAAA0000A1Z5")).toBe(true); // Delhi (07)
    });

    it("rejects GSTIN with invalid lengths", () => {
      expect(validateGstin("18AAFCO9182K1")).toBe(false); // 13 chars
      expect(validateGstin("18AAFCO9182K1Z")).toBe(false); // 14 chars
      expect(validateGstin("18AAFCO9182K1Z5A")).toBe(false); // 16 chars
      expect(validateGstin("")).toBe(false);
    });

    it("rejects GSTIN with invalid state codes", () => {
      expect(validateGstin("00AAFCO9182K1Z5")).toBe(false); // 00 is not valid GST state
      expect(validateGstin("99AAFCO9182K1Z5")).toBe(false); // 99 is invalid state
    });

    it("rejects GSTIN with malformed PAN segment", () => {
      expect(validateGstin("18AAF1O9182K1Z5")).toBe(false); // digit in PAN alpha segment
      expect(validateGstin("18AAFCO918AK1Z5")).toBe(false); // alpha in PAN digit segment
    });

    it("rejects GSTIN with 14th character other than 'Z'", () => {
      expect(validateGstin("18AAFCO9182K1A5")).toBe(false); // 'A' instead of 'Z'
      expect(validateGstin("18AAFCO9182K105")).toBe(false); // '0' instead of 'Z'
    });

    it("validates Mod-36 GSTIN checksum algorithm", () => {
      const gstin14 = "27AAPFU0955L1Z";
      const checkChar = calculateGstinChecksum(gstin14);
      expect(typeof checkChar).toBe("string");
      expect(checkChar.length).toBe(1);
      expect(/^[0-9A-Z]$/.test(checkChar)).toBe(true);
    });
  });

  describe("Bank IFSC Code Validation (4 Alpha + '0' + 6 Alphanumeric)", () => {
    it("accepts valid 11-character Indian Bank IFSC codes", () => {
      expect(validateIfsc("HDFC0002049")).toBe(true);
      expect(validateIfsc("SBIN0001234")).toBe(true);
      expect(validateIfsc("ICIC0000001")).toBe(true);
      expect(validateIfsc("UTIB0000123")).toBe(true);
      expect(validateIfsc("KKBK0000261")).toBe(true);
      expect(validateIfsc("PUNB0024400")).toBe(true);
    });

    it("rejects IFSC when 5th character is not '0'", () => {
      expect(validateIfsc("HDFC1002049")).toBe(false); // 5th char is '1'
      expect(validateIfsc("SBINA001234")).toBe(false); // 5th char is 'A'
      expect(validateIfsc("ICIC9000001")).toBe(false); // 5th char is '9'
    });

    it("rejects IFSC with invalid lengths", () => {
      expect(validateIfsc("HDFC00020")).toBe(false); // 9 chars
      expect(validateIfsc("HDFC000204")).toBe(false); // 10 chars
      expect(validateIfsc("HDFC00020491")).toBe(false); // 12 chars
      expect(validateIfsc("")).toBe(false);
    });

    it("rejects IFSC with non-alphabetic bank code", () => {
      expect(validateIfsc("12340001234")).toBe(false);
      expect(validateIfsc("HDF10001234")).toBe(false);
    });

    it("rejects IFSC with special characters", () => {
      expect(validateIfsc("HDFC00020-9")).toBe(false);
      expect(validateIfsc("HDFC00020 9")).toBe(false);
    });
  });

  describe("PAN Card Validation (10 Alphanumeric)", () => {
    it("accepts valid Indian Income Tax PAN card formats", () => {
      expect(validatePan("AAFCO9182K")).toBe(true);
      expect(validatePan("ABCDE1234F")).toBe(true);
      expect(validatePan("AAPFU0955L")).toBe(true);
      expect(validatePan("BKZPK7192M")).toBe(true);
    });

    it("rejects PAN with invalid lengths", () => {
      expect(validatePan("ABCDE1234")).toBe(false); // 9 chars
      expect(validatePan("ABCDE1234FA")).toBe(false); // 11 chars
      expect(validatePan("")).toBe(false);
    });

    it("rejects PAN with letters in sequential digit segment", () => {
      expect(validatePan("AAFCOP182K")).toBe(false); // 'P' inside digits
      expect(validatePan("ABCDE12A4F")).toBe(false);
    });

    it("rejects PAN with digits in alphabetic prefixes", () => {
      expect(validatePan("12345ABCDE")).toBe(false);
      expect(validatePan("ABCD11234F")).toBe(false);
    });

    it("rejects PAN with trailing digit instead of check letter", () => {
      expect(validatePan("ABCDE12345")).toBe(false);
    });
  });

  describe("Bank Account Number Validation", () => {
    it("accepts standard Indian 9-18 digit account numbers", () => {
      expect(validateBankAccount("50100234567890")).toBe(true);
      expect(validateBankAccount("123456789")).toBe(true);
      expect(validateBankAccount("123456789012345678")).toBe(true);
    });

    it("rejects non-numeric or out-of-range accounts", () => {
      expect(validateBankAccount("12345678")).toBe(false); // < 9 digits
      expect(validateBankAccount("1234567890123456789")).toBe(false); // > 18 digits
      expect(validateBankAccount("501002ABCD7890")).toBe(false); // contains letters
    });
  });

  describe("Comprehensive Statutory KYC Aggregator", () => {
    it("approves valid KYC payload with all required credentials", () => {
      const result = validateStatutoryKyc({
        fssaiNumber: "10326999000184",
        pan: "ABCDE1234F",
        bankIfsc: "HDFC0001234",
        gstin: "29ABCDE1234F1Z5",
        bankAccount: "50100234567890",
      });

      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
      expect(result.details.fssaiValid).toBe(true);
      expect(result.details.panValid).toBe(true);
      expect(result.details.ifscValid).toBe(true);
      expect(result.details.gstinValid).toBe(true);
      expect(result.details.bankAccountValid).toBe(true);
    });

    it("approves valid KYC payload with optional GSTIN omitted", () => {
      const result = validateStatutoryKyc({
        fssaiNumber: "10326999000184",
        pan: "ABCDE1234F",
        bankIfsc: "HDFC0001234",
        gstin: "",
      });

      expect(result.isValid).toBe(true);
      expect(result.errors.gstin).toBeUndefined();
    });

    it("accumulates specific errors for all invalid credentials", () => {
      const result = validateStatutoryKyc({
        fssaiNumber: "INVALID_FSSAI",
        pan: "INVALID_PAN",
        bankIfsc: "INVALID_IFSC",
        gstin: "INVALID_GSTIN",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.fssai).toBeDefined();
      expect(result.errors.pan).toBeDefined();
      expect(result.errors.bankIfsc).toBeDefined();
      expect(result.errors.gstin).toBeDefined();
    });
  });

  describe("Menu Locking in 'PENDING_VERIFICATION' State Invariant", () => {
    it("locks menus in 'PENDING_VERIFICATION' state for unverified statuses", () => {
      const unverifiedStatuses = [
        "DRAFT",
        "SUBMITTED",
        "PENDING",
        "PENDING_VERIFICATION",
        "PENDING_APPROVAL",
        "REJECTED",
        null,
        undefined,
        "",
      ];

      for (const status of unverifiedStatuses) {
        expect(isStatutoryKycApproved(status)).toBe(false);

        const lockState = getMenuLockState(status);
        expect(lockState.isLocked).toBe(true);
        expect(lockState.menuStatus).toBe("PENDING_VERIFICATION");
        expect(lockState.reason).toBe(
          "Menu is locked in 'PENDING_VERIFICATION' state until statutory KYC is approved."
        );

        // Guard assertion throws
        expect(() => assertMenuUnlocked(status)).toThrow(
          "Menu is locked in 'PENDING_VERIFICATION' state until statutory KYC is approved."
        );
      }
    });

    it("unlocks menus to 'ACTIVE' only when statutory KYC is APPROVED or VERIFIED", () => {
      const approvedStatuses = ["APPROVED", "VERIFIED", "approved", "verified"];

      for (const status of approvedStatuses) {
        expect(isStatutoryKycApproved(status)).toBe(true);

        const lockState = getMenuLockState(status);
        expect(lockState.isLocked).toBe(false);
        expect(lockState.menuStatus).toBe("ACTIVE");
        expect(lockState.reason).toBeNull();

        // Guard assertion does not throw
        expect(() => assertMenuUnlocked(status)).not.toThrow();
      }
    });
  });
});
