import { readFileSync } from "node:fs";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  ORDERKING_ONBOARDING_DRAFT_KEY,
  persistDraftLocally,
} from "../routes/onboarding";
import {
  validateStation5CommercialContract,
  validateDigitalExecution,
} from "../lib/merchant-kyc";

describe("Restaurant Onboarding Revolution - Instant 60s Activation (Zomato Equivalent)", () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    const storageObj = {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = String(value);
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        mockStorage = {};
      },
    };
    vi.stubGlobal("localStorage", storageObj);
    vi.stubGlobal("window", { localStorage: storageObj });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("never fabricates an FSSAI expiry date for an unknown certificate", () => {
    const source = readFileSync(new URL("../routes/onboarding.tsx", import.meta.url), "utf8");
    expect(source).not.toContain("Auto-defaults to 1 year");
    expect(source).not.toContain("fssaiExpiry = defaultExpiryStr");
    expect(source).toContain("Enter the actual FSSAI certificate expiry before submitting for review.");
  });
  describe("Zero SMS OTP Dependency & Frictionless Station 5 Activation", () => {
    it("satisfies Station 5 commercial contract completely via 1-click legal agreement without any SMS OTP", () => {
      // Simulating user clicking the single 1-click legal checkbox:
      // "I agree to the OrderKing Partner Terms, FSSAI Food Safety Declaration, and Merchant Agreement"
      const covenantsAccepted = true;
      const foodSafetyUndertakingAccepted = true;
      const privacyAndTaxAccepted = true;
      const clickwrapConsent = true;
      const amortizedConsent = true;
      const executionMethod = "CLICKWRAP";
      const ownerName = "Vikram Sharma";

      const validation = validateStation5CommercialContract({
        covenantViewerAccepted: covenantsAccepted,
        foodSafetyUndertakingAccepted: foodSafetyUndertakingAccepted,
        privacyAndTaxAccepted: privacyAndTaxAccepted,
        fssaiNumber: "10020011000123",
        onboardingFeeChoice: {
          option: "AMORTIZED",
          amortizedConsent,
        },
        digitalExecution: {
          method: executionMethod,
          signatoryName: ownerName,
          signatoryDesignation: "Sole Proprietor / Authorized Signatory",
          timestamp: new Date().toISOString(),
          ipAddress: "103.216.201.45",
          covenantsAccepted: clickwrapConsent,
        },
      });

      expect(validation.isValid).toBe(true);
      expect(Object.keys(validation.errors).length).toBe(0);
      expect(validation.details.covenantsValid).toBe(true);
      expect(validation.details.foodSafetyValid).toBe(true);
      expect(validation.details.privacyAndTaxValid).toBe(true);
      expect(validation.details.digitalExecution.isValid).toBe(true);
      expect(validation.details.digitalExecution.method).toBe("CLICKWRAP");
      // Zero requirement for UIDAI OTP
      expect(validation.details.digitalExecution.auditDetails?.signatureType).toContain("Clickwrap Electronic Signature");
    });

    it("persists draft locally with CLICKWRAP executionMethod and auto-filled signatory name", () => {
      persistDraftLocally({
        restaurantId: "rest_quick_punjabi_dhaba",
        form: {
          name: "Punjab Grill Express",
          displayName: "Punjab Grill Express Cyber Hub",
          ownerName: "Harpreet Singh",
          phone: "+91 98111 22334",
          email: "orders@punjabgrillexpress.com",
          city: "Gurugram",
          address: "Shop 12, Cyber Hub, DLF Phase 2",
          landmark: "Near Tower 8",
          cuisine: "North Indian, Tandoori",
          diet: "NONVEG",
          description: "Authentic tandoori platters and gravies",
          gstin: "06AABCP1234F1Z9",
          fssaiNumber: "10020011000123",
          fssaiExpiryDate: "2027-12-31",
          pan: "AABCP1234F",
          holder: "Harpreet Singh",
          bankName: "ICICI Bank",
          bankAccount: "000405001234",
          bankIfsc: "ICIC0000004",
        },
        exemptFromGst: false,
        onboardingFeeOption: "AMORTIZED",
        amortizedConsent: true,
        executionMethod: "CLICKWRAP",
        clickwrapSignatoryName: "Harpreet Singh",
        clickwrapDesignation: "Sole Proprietor / Authorized Signatory",
        clickwrapConsent: true,
        covenantsAccepted: true,
        foodSafetyUndertakingAccepted: true,
        privacyAndTaxAccepted: true,
      });

      const raw = localStorage.getItem(ORDERKING_ONBOARDING_DRAFT_KEY);
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(parsed.executionMethod).toBe("CLICKWRAP");
      expect(parsed.clickwrapSignatoryName).toBe("Harpreet Singh");
      expect(parsed.clickwrapConsent).toBe(true);
      expect(parsed.covenantsAccepted).toBe(true);
      expect(parsed.foodSafetyUndertakingAccepted).toBe(true);
      expect(parsed.privacyAndTaxAccepted).toBe(true);
    });

    it("verifies clickwrap digital execution requires only name, timestamp, and IP without any OTP", () => {
      const exec = validateDigitalExecution({
        method: "CLICKWRAP",
        signatoryName: "Sunita Roy",
        signatoryDesignation: "Authorized Signatory",
        timestamp: new Date().toISOString(),
        ipAddress: "103.216.201.45",
        covenantsAccepted: true,
      });

      expect(exec.isValid).toBe(true);
      expect(exec.method).toBe("CLICKWRAP");
      expect(exec.auditDetails?.signatoryName).toBe("Sunita Roy");
      expect(exec.auditDetails?.signatureType).toBe("IT Act 2000 §10A Clickwrap Electronic Signature");
    });
  });
});
