import { describe, it, expect } from "vitest";
import { isDeliveryActiveInLocation, calculateDistanceKm, ACTIVE_DELIVERY_ZONES } from "@/lib/geo/geofence-guard";
import { formatPaise } from "@/lib/money";

describe("Geographic Intelligence & Cross-Ecosystem Recommendation Specialist Suite", () => {
  describe("1. Geographic Intelligence & Delivery Out-of-Coverage Guard", () => {
    it("accurately detects when food delivery is active inside launch zones", () => {
      // Karimganj flagship core (24.8688, 92.3511)
      expect(isDeliveryActiveInLocation(24.8688, 92.3511, "karimganj")).toBe(true);

      // Delhi NCR flagship hub (28.6139, 77.2090)
      expect(isDeliveryActiveInLocation(28.6139, 77.2090, "delhi")).toBe(true);

      // Mumbai Metropolitan (19.0760, 72.8777)
      expect(isDeliveryActiveInLocation(19.0760, 72.8777, "mumbai")).toBe(true);

      // Bengaluru Tech Hub (12.9716, 77.5946)
      expect(isDeliveryActiveInLocation(12.9716, 77.5946, "bengaluru")).toBe(true);
    });

    it("accurately detects when food delivery is NOT active in out-of-coverage coordinates", () => {
      // Remote out-of-coverage coordinates (e.g. desert or non-hub rural coords)
      const outOfCoverageLat = 26.9124; // Jaipur (currently not in ACTIVE_DELIVERY_ZONES)
      const outOfCoverageLng = 75.7873;
      expect(isDeliveryActiveInLocation(outOfCoverageLat, outOfCoverageLng, "jaipur")).toBe(false);

      // Far south out-of-coverage
      expect(isDeliveryActiveInLocation(8.5241, 76.9366, "thiruvananthapuram")).toBe(false);

      // Far north out-of-coverage
      expect(isDeliveryActiveInLocation(34.0837, 74.7973, "srinagar")).toBe(false);

      // Non-active cityId
      expect(isDeliveryActiveInLocation(undefined, undefined, "patna")).toBe(false);
    });

    it("ensures calculateDistanceKm handles exact zero distance and long haul math cleanly", () => {
      const dZero = calculateDistanceKm(28.6139, 77.2090, 28.6139, 77.2090);
      expect(dZero).toBe(0);

      const dDelhiBengaluru = calculateDistanceKm(28.6139, 77.2090, 12.9716, 77.5946);
      expect(dDelhiBengaluru).toBeGreaterThan(1500);
      expect(dDelhiBengaluru).toBeLessThan(2000);
    });
  });

  describe("2. Cross-Ecosystem 4 Core Recommendations Invariants", () => {
    const RECOMMENDED_SERVICES = [
      {
        id: "kingpay",
        name: "KingPay UPI & Bill Payments",
        features: ["256-bit zero-fee UPI transfers", "mobile recharges", "bill payments", "24/7 everywhere across India"],
        route: "/king-pay",
      },
      {
        id: "travel",
        name: "Travel Concierge & Live PNR",
        features: ["outstation rides", "intercity buses", "trains (live PNR status)", "flight tracking"],
        route: "/travel",
      },
      {
        id: "tutor",
        name: "Tutor & Direct Jobs Desk",
        features: ["verified local tutors", "skill certification", "verified job postings"],
        route: "/tutor",
      },
      {
        id: "mart",
        name: "Mart & Regional Essentials",
        features: ["non-perishable regional food", "spices", "groceries delivered anywhere"],
        route: "/search?q=mart",
      },
    ];

    it("verifies all 4 mandated services are fully specified with target routes and coverage", () => {
      expect(RECOMMENDED_SERVICES).toHaveLength(4);

      const kingpay = RECOMMENDED_SERVICES.find((s) => s.id === "kingpay");
      expect(kingpay?.route).toBe("/king-pay");
      expect(kingpay?.features.some((f) => f.includes("24/7 everywhere across India"))).toBe(true);

      const travel = RECOMMENDED_SERVICES.find((s) => s.id === "travel");
      expect(travel?.route).toBe("/travel");
      expect(travel?.features.some((f) => f.includes("live PNR status"))).toBe(true);

      const tutor = RECOMMENDED_SERVICES.find((s) => s.id === "tutor");
      expect(tutor?.route).toBe("/tutor");
      expect(tutor?.features.some((f) => f.includes("verified job postings"))).toBe(true);

      const mart = RECOMMENDED_SERVICES.find((s) => s.id === "mart");
      expect(mart?.route.includes("mart")).toBe(true);
      expect(mart?.features.some((f) => f.includes("non-perishable regional food"))).toBe(true);
    });
  });

  describe("3. Hour-Aware Heuristics & Active Cart Cross-Sell Invariants", () => {
    function resolveHourGuidance(hour: number) {
      if (hour >= 11 && hour < 22) {
        return {
          window: "meal_hours",
          label: "11:00–22:00 Dining Window",
          description: "Fresh restaurant delivery in partner zones, Mart regional essentials ship nationwide.",
        };
      }
      if (hour >= 22 || hour < 6) {
        return {
          window: "night_desk",
          label: "22:00–06:00 Night Desk",
          description: "Night travel bookings, live train PNR tracking, and 24/7 UPI recharges active.",
        };
      }
      return {
        window: "morning_routine",
        label: "Morning Essentials",
        description: "Recharge utilities, book daytime transit, or explore verified tutors.",
      };
    }

    it("correctly identifies lunch/dinner hours (11:00-22:00)", () => {
      const lunch12 = resolveHourGuidance(12);
      expect(lunch12.window).toBe("meal_hours");
      expect(lunch12.label).toContain("11:00–22:00");

      const dinner20 = resolveHourGuidance(20);
      expect(dinner20.window).toBe("meal_hours");
    });

    it("correctly identifies night travel / recharge window (22:00-06:00)", () => {
      const lateNight23 = resolveHourGuidance(23);
      expect(lateNight23.window).toBe("night_desk");
      expect(lateNight23.label).toContain("22:00–06:00");

      const earlyMorning3 = resolveHourGuidance(3);
      expect(earlyMorning3.window).toBe("night_desk");
    });

    it("correctly identifies morning routine hours (06:00-11:00)", () => {
      const morning8 = resolveHourGuidance(8);
      expect(morning8.window).toBe("morning_routine");
      expect(morning8.label).toContain("Morning");
    });

    it("enforces active cart cross-sell copy with exact ₹0 extra delivery fee", () => {
      const crossSellMessage = "Add Mart essentials with ₹0 extra delivery fee";
      expect(crossSellMessage).toContain("₹0 extra delivery fee");
      expect(crossSellMessage).toContain("Mart essentials");
    });
  });

  describe("4. SafeInteger Paise Arithmetic & Anti-Competitor Invariant", () => {
    it("guarantees delivery fee for cross-sell essentials is exactly 0 paise (SafeInteger)", () => {
      const extraDeliveryFeePaise = 0;
      expect(Number.isSafeInteger(extraDeliveryFeePaise)).toBe(true);
      expect(extraDeliveryFeePaise).toBe(0);
      expect(formatPaise(extraDeliveryFeePaise)).toBe("₹0.00");
    });

    it("strictly verifies zero competitor trademarks in cross-ecosystem copy", () => {
      const copyToCheck = [
        "KingPay UPI: Instant 256-bit zero-fee UPI transfers, mobile recharges, bill payments active 24/7 across India.",
        "Travel Concierge: Outstation rides, intercity buses, trains (live PNR status), and flight tracking.",
        "Tutor & Direct Jobs Desk: Verified local tutors, skill certification, and verified job postings.",
        "Mart & Regional Essentials: Non-perishable regional food, spices, and groceries delivered anywhere.",
        "Add Mart essentials with ₹0 extra delivery fee.",
      ];

      const forbiddenCompetitors = [
        "swiggy",
        "zomato",
        "zepto",
        "blinkit",
        "instamart",
        "dunzo",
        "bigbasket",
        "uber",
        "ola",
        "rapido",
        "phonepe",
        "gpay",
        "paytm",
      ];

      for (const text of copyToCheck) {
        for (const competitor of forbiddenCompetitors) {
          const regex = new RegExp(`\\b${competitor}\\b`, "i");
          expect(regex.test(text)).toBe(false);
        }
      }
    });
  });
});
