import { describe, it, expect } from "vitest";
import {
  ALL_UTILITY_BILLERS,
  UTILITY_CATEGORIES,
  type UtilityBiller,
} from "../components/fintech/utilities-bill-engine";
import { buildNPCIUpiIntentUrl, isValidVPA } from "../lib/payments/npci-upi-intent";

describe("Utilities Bill Payments Engine Specification Suite", () => {
  describe("1. Category Grid Integrity", () => {
    it("contains all 6 mandatory Indian utility categories", () => {
      const categoryIds = UTILITY_CATEGORIES.map((c) => c.id);
      expect(categoryIds).toContain("electricity");
      expect(categoryIds).toContain("mobile");
      expect(categoryIds).toContain("dth");
      expect(categoryIds).toContain("fastag");
      expect(categoryIds).toContain("lpg");
      expect(categoryIds).toContain("water");
    });

    it("verifies Electricity category covers APDCL Assam and State Discoms", () => {
      const elecCategory = UTILITY_CATEGORIES.find((c) => c.id === "electricity");
      expect(elecCategory).toBeDefined();
      expect(elecCategory?.sublabel).toContain("APDCL Assam");

      const electricityBillers = ALL_UTILITY_BILLERS.filter((b) => b.category === "electricity");
      const apdcl = electricityBillers.find((b) => b.code === "APDCL");
      expect(apdcl).toBeDefined();
      expect(apdcl?.state).toBe("Assam");

      // Verifies presence of major state discoms
      const codes = electricityBillers.map((b) => b.code);
      expect(codes).toContain("BESCOM");
      expect(codes).toContain("TSSPDCL");
      expect(codes).toContain("TANGEDCO");
      expect(codes).toContain("MSEDCL");
    });

    it("verifies Mobile Prepaid & Postpaid covers Jio, Airtel, Vi, and BSNL", () => {
      const mobileBillers = ALL_UTILITY_BILLERS.filter((b) => b.category === "mobile");
      const codes = mobileBillers.map((b) => b.code);
      expect(codes).toContain("JIO");
      expect(codes).toContain("AIRTEL");
      expect(codes).toContain("VI");
      expect(codes).toContain("BSNL");
    });

    it("verifies DTH & Cable covers Tata Play, Airtel, and Sun Direct", () => {
      const dthBillers = ALL_UTILITY_BILLERS.filter((b) => b.category === "dth");
      const codes = dthBillers.map((b) => b.code);
      expect(codes).toContain("TATAPLAY");
      expect(codes).toContain("AIRTELDTH");
      expect(codes).toContain("SUNDIRECT");
    });

    it("verifies FASTag covers NETC All Banks", () => {
      const fastagBillers = ALL_UTILITY_BILLERS.filter((b) => b.category === "fastag");
      expect(fastagBillers.length).toBeGreaterThanOrEqual(4);
      const codes = fastagBillers.map((b) => b.code);
      expect(codes).toContain("ICICIFASTAG");
      expect(codes).toContain("HDFCFASTAG");
      expect(codes).toContain("SBIFASTAG");
    });

    it("verifies LPG Cylinder covers Indane, Bharat, and HP Gas", () => {
      const lpgBillers = ALL_UTILITY_BILLERS.filter((b) => b.category === "lpg");
      const codes = lpgBillers.map((b) => b.code);
      expect(codes).toContain("INDANE");
      expect(codes).toContain("BHARATGAS");
      expect(codes).toContain("HPGAS");
    });

    it("verifies Water & Municipal covers municipal boards across states", () => {
      const waterBillers = ALL_UTILITY_BILLERS.filter((b) => b.category === "water");
      expect(waterBillers.length).toBeGreaterThanOrEqual(3);
      const states = waterBillers.map((b) => b.state);
      expect(states).toContain("Assam");
      expect(states).toContain("Delhi");
    });
  });

  describe("2. Live Search & Filtering", () => {
    function filterBillers(query: string): UtilityBiller[] {
      const q = query.trim().toLowerCase();
      if (!q) return ALL_UTILITY_BILLERS;
      return ALL_UTILITY_BILLERS.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.state.toLowerCase().includes(q) ||
          b.code.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q)
      );
    }

    it("immediately filters APDCL when searching 'APDCL'", () => {
      const results = filterBillers("APDCL");
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].code).toBe("APDCL");
      expect(results[0].name).toContain("Assam Power Distribution");
    });

    it("immediately returns Assam utilities when searching 'Assam'", () => {
      const results = filterBillers("Assam");
      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.some((b) => b.code === "APDCL")).toBe(true);
      expect(results.some((b) => b.code === "GMCWATER")).toBe(true);
    });

    it("filters FASTag providers when searching 'FASTag'", () => {
      const results = filterBillers("FASTag");
      expect(results.length).toBeGreaterThanOrEqual(4);
      results.forEach((b) => {
        expect(b.category).toBe("fastag");
      });
    });

    it("filters LPG providers when searching 'Indane'", () => {
      const results = filterBillers("Indane");
      expect(results.length).toBe(1);
      expect(results[0].code).toBe("INDANE");
      expect(results[0].category).toBe("lpg");
    });
  });

  describe("3. UPI & Payment Routing Verification", () => {
    it("generates valid NPCI UPI intent with MCC 4900 (Utilities) and valid VPA", () => {
      const vpa = "9395065587@ybl";
      expect(isValidVPA(vpa)).toBe(true);

      const intentUrl = buildNPCIUpiIntentUrl({
        vpa,
        payeeName: "OrderKing Utilities",
        amountInRupees: 850,
        currency: "INR",
        transactionRef: "UTIL-APDCL-123456",
        transactionNote: "APDCL 1002345678",
        merchantCategoryCode: "4900",
        mode: "02",
      });

      expect(intentUrl.startsWith("upi://pay?")).toBe(true);
      expect(intentUrl).toContain("pa=9395065587%40ybl");
      expect(intentUrl).toContain("pn=OrderKing%20Utilities");
      expect(intentUrl).toContain("am=850.00");
      expect(intentUrl).toContain("cu=INR");
      expect(intentUrl).toContain("mc=4900");
      expect(intentUrl).toContain("mode=02");
    });
  });

  describe("4. Pure Design & Slogan Purge Invariants", () => {
    it("guarantees no banned slogans in category names or sublabels", () => {
      const bannedSubstrings = [
        "0% surcharge",
        "zero orderking platform markup",
        "npci bharat",
        "daily utilities",
      ];

      UTILITY_CATEGORIES.forEach((cat) => {
        const text = `${cat.label} ${cat.sublabel}`.toLowerCase();
        bannedSubstrings.forEach((slogan) => {
          expect(text).not.toContain(slogan);
        });
      });

      ALL_UTILITY_BILLERS.forEach((biller) => {
        const text = `${biller.name} ${biller.code}`.toLowerCase();
        bannedSubstrings.forEach((slogan) => {
          expect(text).not.toContain(slogan);
        });
      });
    });
  });
});
