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
  validateAadhaar,
  validateVerhoeff,
  calculateVerhoeffChecksum,
  validateAadhaarOtp,
  validateOnboardingFeeChoice,
  validateDigitalExecution,
  validateFoodSafetyUndertaking,
  validateStation5CommercialContract,
} from "../lib/merchant-kyc";
import {
  ONBOARDING_FEE_CONFIG,
  getOnboardingFeeDetails,
  calculateOnboardingCycleDeduction,
  STATUTORY_TAX_RATES,
} from "../lib/money";

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

  describe("Station 5: Commercial Contract & Digital Execution Validation Suite", () => {
    describe("Onboarding Fee Payment Options & Amortization Configuration", () => {
      it("accepts Option A (Amortized ₹99/mo for 6 months) with explicit partner consent", () => {
        const result = validateOnboardingFeeChoice({
          option: "AMORTIZED",
          amortizedConsent: true,
        });

        expect(result.isValid).toBe(true);
        expect(result.option).toBe("AMORTIZED");
        expect(result.monthlyDeductionPaise).toBe(9900); // ₹99.00
        expect(result.totalAmountPaise).toBe(59400); // ₹594.00 (6 * ₹99)
        expect(result.durationMonths).toBe(6);
        expect(result.isAmortized).toBe(true);
        expect(result.deductionMechanism).toBe("Deducted automatically from weekly payout batches");
        expect(result.error).toBeUndefined();
      });

      it("rejects Option A when amortized monthly deduction consent is missing", () => {
        const resultWithoutConsent = validateOnboardingFeeChoice({
          option: "AMORTIZED",
          amortizedConsent: false,
        });

        expect(resultWithoutConsent.isValid).toBe(false);
        expect(resultWithoutConsent.error).toContain("Option A requires explicit consent");
        expect(resultWithoutConsent.isAmortized).toBe(true);
        expect(resultWithoutConsent.monthlyDeductionPaise).toBe(9900);
      });

      it("accepts Option B (One-Time Direct Settlement of ₹499) without recurring fee", () => {
        const result = validateOnboardingFeeChoice({
          option: "ONE_TIME",
        });

        expect(result.isValid).toBe(true);
        expect(result.option).toBe("ONE_TIME");
        expect(result.monthlyDeductionPaise).toBe(0);
        expect(result.totalAmountPaise).toBe(49900); // ₹499.00
        expect(result.durationMonths).toBe(1);
        expect(result.isAmortized).toBe(false);
        expect(result.deductionMechanism).toContain("One-time direct deduction");
      });

      it("rejects invalid or unsupported onboarding fee options", () => {
        const result = validateOnboardingFeeChoice({
          option: "ANNUAL_SUBSCRIPTION",
        });

        expect(result.isValid).toBe(false);
        expect(result.error).toContain("Must select either 'AMORTIZED' (Option A) or 'ONE_TIME' (Option B)");
      });

      it("verifies money helper getOnboardingFeeDetails matches statutory descriptions", () => {
        const optA = getOnboardingFeeDetails("AMORTIZED");
        expect(optA.option).toBe("AMORTIZED");
        expect(optA.monthlyDeductionPaise).toBe(ONBOARDING_FEE_CONFIG.AMORTIZED_MONTHLY_FEE_PAISE);
        expect(optA.totalAmountPaise).toBe(ONBOARDING_FEE_CONFIG.TOTAL_AMORTIZED_FEE_PAISE);
        expect(optA.label).toBe(
          "Amortized Monthly Deduction of ₹99/month for 6 months (Deducted automatically from weekly payout batches)"
        );

        const optB = getOnboardingFeeDetails("ONE_TIME");
        expect(optB.option).toBe("ONE_TIME");
        expect(optB.monthlyDeductionPaise).toBe(0);
        expect(optB.totalAmountPaise).toBe(ONBOARDING_FEE_CONFIG.ONE_TIME_SETTLEMENT_PAISE);
        expect(optB.label).toBe("One-Time Direct Settlement of ₹499");

        // Statutory tax rates sync
        expect(STATUTORY_TAX_RATES.AMORTIZED_ONBOARDING_FEE_PAISE).toBe(9900);
        expect(STATUTORY_TAX_RATES.ONE_TIME_ONBOARDING_FEE_PAISE).toBe(49900);
      });

      it("calculates amortized batch deductions across 6 monthly cycles with zero drift", () => {
        // Amortized: Exactly ₹99.00 (9900 paise) for cycles 0 to 5, then 0 paise for cycle 6 onwards
        for (let cycle = 0; cycle < 6; cycle++) {
          const deduction = calculateOnboardingCycleDeduction("AMORTIZED", cycle);
          expect(deduction).toBe(9900);
        }
        expect(calculateOnboardingCycleDeduction("AMORTIZED", 6)).toBe(0);
        expect(calculateOnboardingCycleDeduction("AMORTIZED", 12)).toBe(0);
      });

      it("calculates one-time direct settlement on first cycle only", () => {
        expect(calculateOnboardingCycleDeduction("ONE_TIME", 0)).toBe(49900);
        expect(calculateOnboardingCycleDeduction("ONE_TIME", 1)).toBe(0);
        expect(calculateOnboardingCycleDeduction("ONE_TIME", 2)).toBe(0);
      });
    });

    describe("Fast Clickwrap e-Sign Execution (IT Act 2000 §10A)", () => {
      it("approves valid Clickwrap e-Sign payload with signatory, timestamp, and IP address", () => {
        const payload = {
          method: "CLICKWRAP" as const,
          signatoryName: "Rajesh Kumar",
          signatoryDesignation: "Sole Proprietor",
          timestamp: new Date().toISOString(),
          ipAddress: "103.216.201.45",
          covenantsAccepted: true,
        };

        const result = validateDigitalExecution(payload);
        expect(result.isValid).toBe(true);
        expect(result.method).toBe("CLICKWRAP");
        expect(result.auditDetails?.signatoryName).toBe("Rajesh Kumar");
        expect(result.auditDetails?.identifier).toBe("103.216.201.45");
        expect(result.auditDetails?.signatureType).toContain("IT Act 2000 §10A");
      });

      it("rejects Clickwrap e-Sign when authorized signatory name is missing or too short", () => {
        const resultEmpty = validateDigitalExecution({
          method: "CLICKWRAP",
          signatoryName: "  ",
          timestamp: new Date().toISOString(),
          ipAddress: "103.216.201.45",
          covenantsAccepted: true,
        });

        expect(resultEmpty.isValid).toBe(false);
        expect(resultEmpty.errors.signatoryName).toBeDefined();

        const resultShort = validateDigitalExecution({
          method: "CLICKWRAP",
          signatoryName: "R",
          timestamp: new Date().toISOString(),
          ipAddress: "103.216.201.45",
          covenantsAccepted: true,
        });

        expect(resultShort.isValid).toBe(false);
        expect(resultShort.errors.signatoryName).toBeDefined();
      });

      it("rejects Clickwrap e-Sign when client IP address is missing", () => {
        const result = validateDigitalExecution({
          method: "CLICKWRAP",
          signatoryName: "Rajesh Kumar",
          timestamp: new Date().toISOString(),
          ipAddress: "",
          covenantsAccepted: true,
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.ipAddress).toBeDefined();
      });

      it("rejects Clickwrap e-Sign when timestamp is invalid or unparseable", () => {
        const result = validateDigitalExecution({
          method: "CLICKWRAP",
          signatoryName: "Rajesh Kumar",
          timestamp: "NOT_A_DATE",
          ipAddress: "127.0.0.1",
          covenantsAccepted: true,
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.timestamp).toBeDefined();
      });

      it("rejects Clickwrap e-Sign when mandatory covenants are unaccepted", () => {
        const result = validateDigitalExecution({
          method: "CLICKWRAP",
          signatoryName: "Rajesh Kumar",
          timestamp: new Date().toISOString(),
          ipAddress: "127.0.0.1",
          covenantsAccepted: false,
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.covenantsAccepted).toBeDefined();
      });
    });

    describe("Aadhaar e-Sign with UIDAI OTP Verification", () => {
      it("validates authentic 12-digit Aadhaar numbers using UIDAI Verhoeff algorithm", () => {
        // Construct valid 12-digit Aadhaar numbers using Verhoeff checksum
        const bases = ["54321098765", "29876543210", "38472910563", "91827364501"];
        for (const base of bases) {
          const check = calculateVerhoeffChecksum(base);
          const fullAadhaar = `${base}${check}`;
          expect(validateVerhoeff(fullAadhaar)).toBe(true);
          expect(validateAadhaar(fullAadhaar)).toBe(true);
        }
      });

      it("rejects Aadhaar starting with '0' or '1' per UIDAI format specifications", () => {
        // UIDAI does not assign numbers starting with 0 or 1
        const check0 = calculateVerhoeffChecksum("01234567890");
        expect(validateAadhaar(`01234567890${check0}`)).toBe(false);

        const check1 = calculateVerhoeffChecksum("12345678901");
        expect(validateAadhaar(`12345678901${check1}`)).toBe(false);
      });

      it("rejects Aadhaar with invalid length or non-numeric characters", () => {
        expect(validateAadhaar("5432109876")).toBe(false); // 10 digits
        expect(validateAadhaar("54321098765")).toBe(false); // 11 digits
        expect(validateAadhaar("5432109876521")).toBe(false); // 13 digits
        expect(validateAadhaar("54321098765A")).toBe(false); // contains letter
        expect(validateAadhaar("")).toBe(false);
      });

      it("rejects Aadhaar with corrupted Verhoeff checksum", () => {
        const base = "54321098765";
        const validCheck = calculateVerhoeffChecksum(base);
        const corruptedCheck = (validCheck + 1) % 10;
        expect(validateAadhaar(`${base}${corruptedCheck}`)).toBe(false);
      });

      it("rejects repetitive trivial Aadhaar patterns", () => {
        expect(validateAadhaar("222222222222")).toBe(false);
        expect(validateAadhaar("333333333333")).toBe(false);
      });

      it("validates 6-digit Aadhaar OTP format and rejects invalid formats", () => {
        expect(validateAadhaarOtp("123456")).toBe(true);
        expect(validateAadhaarOtp("987654")).toBe(true);
        expect(validateAadhaarOtp("12345")).toBe(false); // 5 digits
        expect(validateAadhaarOtp("1234567")).toBe(false); // 7 digits
        expect(validateAadhaarOtp("12345A")).toBe(false); // letters
        expect(validateAadhaarOtp("000000")).toBe(false); // all zeroes
        expect(validateAadhaarOtp("")).toBe(false);
      });

      it("approves valid Aadhaar e-Sign payload with verified OTP and masks Aadhaar in audit trail", () => {
        const base = "54321098765";
        const check = calculateVerhoeffChecksum(base);
        const aadhaar = `${base}${check}`;

        const payload = {
          method: "AADHAAR_ESIGN" as const,
          aadhaarNumber: aadhaar,
          otp: "583921",
          otpVerified: true,
          signatoryName: "Rajesh Kumar",
          timestamp: new Date().toISOString(),
          transactionId: "UIDAI-ESIGN-88921-TXN",
          covenantsAccepted: true,
        };

        const result = validateDigitalExecution(payload);
        expect(result.isValid).toBe(true);
        expect(result.method).toBe("AADHAAR_ESIGN");
        expect(result.auditDetails?.signatoryName).toBe("Rajesh Kumar");
        // Must mask first 8 digits as XXXX-XXXX for DPDP compliance
        expect(result.auditDetails?.identifier).toBe(`XXXX-XXXX-${aadhaar.slice(8, 12)}`);
        expect(result.auditDetails?.signatureType).toContain("UIDAI / CDAC ESP");
      });

      it("rejects Aadhaar e-Sign when OTP verification is false", () => {
        const base = "54321098765";
        const check = calculateVerhoeffChecksum(base);
        const aadhaar = `${base}${check}`;

        const payload = {
          method: "AADHAAR_ESIGN" as const,
          aadhaarNumber: aadhaar,
          otp: "583921",
          otpVerified: false, // Not verified
          timestamp: new Date().toISOString(),
          covenantsAccepted: true,
        };

        const result = validateDigitalExecution(payload);
        expect(result.isValid).toBe(false);
        expect(result.errors.otpVerified).toContain("must be successfully verified");
      });
    });

    describe("Food Safety, Hygiene & Allergen Undertaking Binding Covenant", () => {
      it("approves Food Safety undertaking when partner accepts binding covenant", () => {
        const result = validateFoodSafetyUndertaking(true, "10326999000184");
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it("rejects Food Safety undertaking when consent is false", () => {
        const result = validateFoodSafetyUndertaking(false, "10326999000184");
        expect(result.isValid).toBe(false);
        expect(result.error).toContain("Acceptance of the FSSAI Food Safety");
      });

      it("rejects Food Safety undertaking when accompanied by invalid FSSAI number", () => {
        const result = validateFoodSafetyUndertaking(true, "INVALID_FSSAI");
        expect(result.isValid).toBe(false);
        expect(result.error).toContain("valid 14-digit FSSAI license");
      });
    });

    describe("Comprehensive Station 5 Commercial Contract Aggregator", () => {
      it("approves full contract execution with Option A amortized fee and Clickwrap e-Sign", () => {
        const result = validateStation5CommercialContract({
          covenantViewerAccepted: true,
          foodSafetyUndertakingAccepted: true,
          privacyAndTaxAccepted: true,
          fssaiNumber: "10326999000184",
          onboardingFeeChoice: {
            option: "AMORTIZED",
            amortizedConsent: true,
          },
          digitalExecution: {
            method: "CLICKWRAP",
            signatoryName: "Rajesh Kumar",
            signatoryDesignation: "Managing Director",
            timestamp: new Date().toISOString(),
            ipAddress: "103.216.201.45",
            covenantsAccepted: true,
          },
        });

        expect(result.isValid).toBe(true);
        expect(Object.keys(result.errors).length).toBe(0);
        expect(result.details.covenantsValid).toBe(true);
        expect(result.details.foodSafetyValid).toBe(true);
        expect(result.details.privacyAndTaxValid).toBe(true);
        expect(result.details.onboardingFee.isAmortized).toBe(true);
        expect(result.details.digitalExecution.method).toBe("CLICKWRAP");
      });

      it("approves full contract execution with Option B one-time fee and Aadhaar e-Sign", () => {
        const base = "29876543210";
        const check = calculateVerhoeffChecksum(base);
        const aadhaar = `${base}${check}`;

        const result = validateStation5CommercialContract({
          covenantViewerAccepted: true,
          foodSafetyUndertakingAccepted: true,
          privacyAndTaxAccepted: true,
          fssaiNumber: "10326999000184",
          onboardingFeeChoice: {
            option: "ONE_TIME",
          },
          digitalExecution: {
            method: "AADHAAR_ESIGN",
            aadhaarNumber: aadhaar,
            otp: "654321",
            otpVerified: true,
            signatoryName: "Sunita Verma",
            timestamp: new Date().toISOString(),
            covenantsAccepted: true,
          },
        });

        expect(result.isValid).toBe(true);
        expect(Object.keys(result.errors).length).toBe(0);
        expect(result.details.onboardingFee.isAmortized).toBe(false);
        expect(result.details.digitalExecution.method).toBe("AADHAAR_ESIGN");
      });

      it("accumulates specific errors when covenants, fee consent, or digital signatures are invalid", () => {
        const result = validateStation5CommercialContract({
          covenantViewerAccepted: false,
          foodSafetyUndertakingAccepted: false,
          privacyAndTaxAccepted: false,
          onboardingFeeChoice: {
            option: "AMORTIZED",
            amortizedConsent: false, // Missing consent
          },
          digitalExecution: {
            method: "CLICKWRAP",
            signatoryName: "", // Missing signatory
            timestamp: "INVALID_TIME",
            ipAddress: "",
            covenantsAccepted: false,
          },
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.covenants).toBeDefined();
        expect(result.errors.foodSafety).toBeDefined();
        expect(result.errors.privacyAndTax).toBeDefined();
        expect(result.errors.onboardingFee).toBeDefined();
        expect(result.errors.signatoryName).toBeDefined();
        expect(result.errors.ipAddress).toBeDefined();
      });
    });
  });
});
