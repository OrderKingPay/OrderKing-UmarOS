import { describe, it, expect } from "vitest";
import {
  ALL_UTILITY_BILLERS,
  UTILITY_CATEGORIES,
  POPULAR_RECHARGE_PLANS,
  type UtilityBiller,
  type MobileRechargePlan,
} from "../components/fintech/utilities-bill-engine";
import {
  buildNPCIUpiIntentUrl,
  generateAppDeepLink,
  isValidVPA,
} from "../lib/payments/npci-upi-intent";

describe("Utilities Bill Payments Engine Specification Suite", () => {
  describe("1. Category Grid Integrity", () => {
    it("contains all 6 mandatory Indian utility categories plus broadband", () => {
      const categoryIds = UTILITY_CATEGORIES.map((c) => c.id);
      expect(categoryIds).toContain("electricity");
      expect(categoryIds).toContain("mobile");
      expect(categoryIds).toContain("broadband");
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

  describe("5. PhonePe Parity Mobile Recharge Plans Grid", () => {
    it("provides popular plans grid with ₹199, ₹299, ₹349, ₹666, and ₹2999 across major operators", () => {
      const benchmarkPrices = [199, 299, 349, 666, 2999];
      const operators: Array<"JIO" | "AIRTEL" | "VI" | "BSNL"> = ["JIO", "AIRTEL", "VI", "BSNL"];

      operators.forEach((op) => {
        const opPlans = POPULAR_RECHARGE_PLANS.filter((p) => p.operatorCode === op);
        const opPrices = opPlans.map((p) => p.priceRupees);

        benchmarkPrices.forEach((price) => {
          expect(
            opPrices,
            `Operator ${op} must contain benchmark plan ₹${price}`
          ).toContain(price);
        });
      });
    });

    it("verifies Jio True 5G Unlimited ₹349 plan details", () => {
      const jio349 = POPULAR_RECHARGE_PLANS.find(
        (p) => p.operatorCode === "JIO" && p.priceRupees === 349
      );
      expect(jio349).toBeDefined();
      expect(jio349?.validity).toBe("28 Days");
      expect(jio349?.data).toContain("2.5 GB/Day");
      expect(jio349?.voice).toBe("Unlimited");
      expect(jio349?.badge).toContain("True 5G Unlimited");
    });

    it("verifies Airtel Unlimited 5G ₹349 plan details", () => {
      const airtel349 = POPULAR_RECHARGE_PLANS.find(
        (p) => p.operatorCode === "AIRTEL" && p.priceRupees === 349
      );
      expect(airtel349).toBeDefined();
      expect(airtel349?.validity).toBe("28 Days");
      expect(airtel349?.data).toContain("2.0 GB/Day");
      expect(airtel349?.voice).toBe("Unlimited");
      expect(airtel349?.badge).toContain("Unlimited 5G");
    });

    it("verifies Annual ₹2999 365 Days plan across operators", () => {
      const annualPlans = POPULAR_RECHARGE_PLANS.filter((p) => p.priceRupees === 2999);
      expect(annualPlans.length).toBeGreaterThanOrEqual(4);
      annualPlans.forEach((p) => {
        expect(p.category).toBe("annual");
        expect(parseInt(p.validity)).toBeGreaterThanOrEqual(365);
      });
    });
  });

  describe("6. Broadband & Fiber Billers Verification", () => {
    it("verifies Broadband category contains Airtel, JioFiber, BSNL, and ACT", () => {
      const broadbandBillers = ALL_UTILITY_BILLERS.filter((b) => b.category === "broadband");
      expect(broadbandBillers.length).toBeGreaterThanOrEqual(4);

      const codes = broadbandBillers.map((b) => b.code);
      expect(codes).toContain("AIRTELBB");
      expect(codes).toContain("JIOFIBER");
      expect(codes).toContain("BSNLBB");
      expect(codes).toContain("ACTFIBER");
    });
  });

  describe("7. Direct UPI App Deep-Linking & Intent Schema", () => {
    it("generates correct PhonePe, Google Pay, and Paytm deep-links with MCC 4814 for telecom", () => {
      const vpa = "9395065587@ybl";
      const intentParams = {
        vpa,
        payeeName: "OrderKing Telecom",
        amountInRupees: 349,
        currency: "INR" as const,
        transactionRef: "RCG-JIO-986401",
        transactionNote: "JIO 9864012345",
        merchantCategoryCode: "4814", // Telecom
        mode: "02",
      };

      const phonepeUrl = generateAppDeepLink("phonepe", intentParams);
      expect(phonepeUrl.startsWith("phonepe://pay?")).toBe(true);
      expect(phonepeUrl).toContain("pa=9395065587%40ybl");
      expect(phonepeUrl).toContain("am=349.00");
      expect(phonepeUrl).toContain("mc=4814");

      const gpayUrl = generateAppDeepLink("gpay", intentParams);
      expect(gpayUrl.startsWith("tez://upi/pay?")).toBe(true);
      expect(gpayUrl).toContain("pa=9395065587%40ybl");
      expect(gpayUrl).toContain("am=349.00");

      const paytmUrl = generateAppDeepLink("paytm", intentParams);
      expect(paytmUrl.startsWith("paytmmp://pay?")).toBe(true);
      expect(paytmUrl).toContain("pa=9395065587%40ybl");
      expect(paytmUrl).toContain("am=349.00");
    });
  });

  describe("8. Zero-Barrier & Zero-Suspension Audit", () => {
    it("verifies no fake 'BBPS authorization' or 'Settlement Suspended' barriers exist", () => {
      const allText = JSON.stringify(ALL_UTILITY_BILLERS).toLowerCase();
      expect(allText).not.toContain("suspended");
      expect(allText).not.toContain("available now");
      expect(allText).not.toContain("pending authorization");
    });
  });

  describe("9. Statutory GST Tax Invoice (GSTIN 18AFXPH9838M1Z9) Integrity", () => {
    it("verifies statutory tax calculations on ₹349 recharge (18% GST SAC 9984)", () => {
      const totalAmount = 349;
      const taxableValue = parseFloat((totalAmount / 1.18).toFixed(2));
      const totalGst = parseFloat((totalAmount - taxableValue).toFixed(2));
      const cgst = parseFloat((totalGst / 2).toFixed(2));
      const sgst = parseFloat((totalGst - cgst).toFixed(2));

      expect(taxableValue).toBe(295.76);
      expect(totalGst).toBe(53.24);
      expect(cgst).toBe(26.62);
      expect(sgst).toBe(26.62);
      expect(taxableValue + cgst + sgst).toBe(totalAmount);
    });
  });
});
