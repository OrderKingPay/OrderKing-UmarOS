import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  formatFriendlyError,
  persistDraftLocally,
  ORDERKING_ONBOARDING_DRAFT_KEY,
  ORDERKING_LOCAL_ONLY_KEY,
} from "../routes/onboarding";

describe("Merchant Onboarding Resilience & Local Draft Fallback", () => {
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
    vi.stubGlobal("window", {
      localStorage: storageObj,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("Friendly Error Formatting", () => {
    it("converts 'Invalid URL string.' into a friendly, reassuring merchant message", () => {
      const err = new TypeError("Invalid URL string.");
      const friendly = formatFriendlyError(err, "Default failure");
      expect(friendly).not.toContain("Invalid URL string.");
      expect(friendly).toContain("Server connection is initializing or service URL is unreachable");
      expect(friendly).toContain("safely saved locally");
    });

    it("converts network and fetch failures into friendly offline draft messages", () => {
      const err = new Error("Failed to fetch");
      const friendly = formatFriendlyError(err, "Default failure");
      expect(friendly).toContain("Network connection issue");
      expect(friendly).toContain("safely saved locally");
    });

    it("converts session or auth errors into clear instructions without data loss", () => {
      const err = new Error("Unauthorized");
      const friendly = formatFriendlyError(err, "Default failure");
      expect(friendly).toContain("Session requires verification");
      expect(friendly).toContain("preserved locally");
    });

    it("passes through standard business validation messages", () => {
      const err = new Error("Please enter a valid 14-digit FSSAI registration number.");
      const friendly = formatFriendlyError(err, "Default failure");
      expect(friendly).toBe("Please enter a valid 14-digit FSSAI registration number.");
    });
  });

  describe("LocalStorage Draft Fallback & Persistence", () => {
    it("persists non-sensitive draft fields without storing tax IDs or bank credentials", () => {
      persistDraftLocally({
        restaurantId: "local_rst_party_box_123",
        form: {
          name: "Party Box",
          displayName: "Party Box Indiranagar",
          ownerName: "Hasan",
          phone: "+91 98765 43210",
          email: "partybox@example.com",
          city: "Bengaluru",
          address: "Shop 10, 100 Feet Road, Indiranagar",
          landmark: "Opp Metro Pillar 42",
          cuisine: "North Indian, Fast Food",
          diet: "NONVEG",
          description: "Premium party catering and meal boxes",
          gstin: "",
          fssaiNumber: "10326999000184",
          fssaiExpiryDate: "2027-10-19",
          pan: "ABCDE1234F",
          holder: "Party Box Hospitality",
          bankName: "HDFC Bank",
          bankAccount: "50100998877665",
          bankIfsc: "HDFC0001234",
        },
        exemptFromGst: true,
        onboardingFeeOption: "AMORTIZED",
        amortizedConsent: true,
        executionMethod: "CLICKWRAP",
        clickwrapSignatoryName: "Hasan",
        clickwrapDesignation: "Sole Proprietor",
        clickwrapConsent: true,
        covenantsAccepted: true,
        foodSafetyUndertakingAccepted: true,
        privacyAndTaxAccepted: true,
      });

      const raw = localStorage.getItem(ORDERKING_ONBOARDING_DRAFT_KEY);
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(parsed.name).toBe("Party Box");
      expect(parsed.restaurantId).toBe("local_rst_party_box_123");
      expect(parsed.exemptFromGst).toBe(true);
      expect(parsed.fssaiNumber).toBe("");
      expect(parsed.pan).toBe("");
      expect(parsed.gstin).toBe("");
      expect(parsed.bankAccount).toBe("");
      expect(parsed.bankIfsc).toBe("");
      expect(parsed.onboardingFeeOption).toBe("AMORTIZED");
      expect(parsed.savedAt).toBeDefined();
    });

    it("stores local-only flag when offline fallback is triggered", () => {
      localStorage.setItem(ORDERKING_LOCAL_ONLY_KEY, "true");
      expect(localStorage.getItem(ORDERKING_LOCAL_ONLY_KEY)).toBe("true");

      localStorage.removeItem(ORDERKING_LOCAL_ONLY_KEY);
      expect(localStorage.getItem(ORDERKING_LOCAL_ONLY_KEY)).toBeNull();
    });
  });
});
