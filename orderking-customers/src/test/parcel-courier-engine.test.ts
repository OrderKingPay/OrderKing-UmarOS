import { describe, it, expect } from "vitest";
import {
  calculateParcelFare,
  calculateStraightLineDistanceKm,
  calculateEstimatedRoadDistanceKm,
  isNightTimeWindow,
  estimateCourierTransitMinutes,
  PACKAGE_TYPE_CONFIGS,
  BASE_FARE_PAISE,
  PER_KM_RATE_PAISE,
  NIGHT_SURCHARGE_PAISE,
  ROAD_WINDING_FACTOR,
} from "../lib/courier/fare";
import type { PackageType } from "../lib/courier/types";

describe("Porter-Style Local Parcel & Courier Engine", () => {
  describe("1. Package Configurations", () => {
    it("provides the four required package categories", () => {
      const expectedKeys: PackageType[] = ["DOCUMENTS", "FOOD", "KEYS", "HEAVY_BOX"];
      expect(Object.keys(PACKAGE_TYPE_CONFIGS)).toEqual(expect.arrayContaining(expectedKeys));
    });

    it("enforces correct weight capacities and descriptions", () => {
      expect(PACKAGE_TYPE_CONFIGS.DOCUMENTS.maxWeightKg).toBe(3);
      expect(PACKAGE_TYPE_CONFIGS.FOOD.maxWeightKg).toBe(5);
      expect(PACKAGE_TYPE_CONFIGS.KEYS.maxWeightKg).toBe(2);
      expect(PACKAGE_TYPE_CONFIGS.HEAVY_BOX.maxWeightKg).toBe(15);
    });

    it("charges zero handling surcharge on light parcels and ₹20 on heavy boxes", () => {
      expect(PACKAGE_TYPE_CONFIGS.DOCUMENTS.handlingFeePaise).toBe(0);
      expect(PACKAGE_TYPE_CONFIGS.FOOD.handlingFeePaise).toBe(0);
      expect(PACKAGE_TYPE_CONFIGS.KEYS.handlingFeePaise).toBe(0);
      expect(PACKAGE_TYPE_CONFIGS.HEAVY_BOX.handlingFeePaise).toBe(2000); // ₹20.00
    });
  });

  describe("2. Automated Fare Calculator", () => {
    it("calculates exact base fare and distance fare at ₹30 base + ₹10/km", () => {
      // 1.0 km -> Base ₹30 + 1 * ₹10 = ₹40.00 (4,000 paise)
      const res1 = calculateParcelFare({
        distanceKm: 1.0,
        packageType: "DOCUMENTS",
        isNight: false,
      });
      expect(res1.baseFarePaise).toBe(3000);
      expect(res1.distanceFarePaise).toBe(1000);
      expect(res1.handlingFeePaise).toBe(0);
      expect(res1.nightSurchargePaise).toBe(0);
      expect(res1.totalPaise).toBe(4000);
      expect(res1.totalInr).toBe(40);

      // 5.4 km -> Base ₹30 + 5.4 * ₹10 = ₹30 + ₹54 = ₹84.00 (8,400 paise)
      const res5 = calculateParcelFare({
        distanceKm: 5.4,
        packageType: "DOCUMENTS",
        isNight: false,
      });
      expect(res5.baseFarePaise).toBe(3000);
      expect(res5.distanceFarePaise).toBe(5400);
      expect(res5.totalPaise).toBe(8400);
      expect(res5.totalInr).toBe(84);
    });

    it("applies night surcharge of ₹15 during night shifts", () => {
      const resNight = calculateParcelFare({
        distanceKm: 4.0,
        packageType: "KEYS",
        isNight: true,
      });
      // Base: ₹30 + Dist: ₹40 + Night: ₹15 = ₹85.00 (8,500 paise)
      expect(resNight.nightSurchargePaise).toBe(1500);
      expect(resNight.totalPaise).toBe(3000 + 4000 + 1500);
      expect(resNight.totalInr).toBe(85);

      const nightLine = resNight.breakdown.find((b) => b.code === "NIGHT_SURCHARGE");
      expect(nightLine).toBeDefined();
      expect(nightLine?.amountInr).toBe(15);
    });

    it("applies heavy box handling fee cleanly", () => {
      const resHeavy = calculateParcelFare({
        distanceKm: 6.0,
        packageType: "HEAVY_BOX",
        isNight: false,
      });
      // Base: ₹30 + Dist: ₹60 + Handling: ₹20 = ₹110.00 (11,000 paise)
      expect(resHeavy.handlingFeePaise).toBe(2000);
      expect(resHeavy.totalPaise).toBe(11000);
      expect(resHeavy.totalInr).toBe(110);
    });

    it("computes complete multi-surcharge compound fare (Distance + Heavy + Night)", () => {
      const resAll = calculateParcelFare({
        distanceKm: 10.0,
        packageType: "HEAVY_BOX",
        isNight: true,
      });
      // Base: ₹30 + Dist: ₹100 + Handling: ₹20 + Night: ₹15 = ₹165.00 (16,500 paise)
      expect(resAll.baseFarePaise).toBe(3000);
      expect(resAll.distanceFarePaise).toBe(10000);
      expect(resAll.handlingFeePaise).toBe(2000);
      expect(resAll.nightSurchargePaise).toBe(1500);
      expect(resAll.totalPaise).toBe(16500);
      expect(resAll.totalInr).toBe(165);
      expect(resAll.breakdown.length).toBe(4);
    });

    it("enforces a safe minimum distance floor of 0.5 km", () => {
      const resMin = calculateParcelFare({
        distanceKm: 0.1,
        packageType: "FOOD",
        isNight: false,
      });
      expect(resMin.distanceKm).toBe(0.5);
      expect(resMin.distanceFarePaise).toBe(500);
      expect(resMin.totalPaise).toBe(3500);
    });
  });

  describe("3. Geodetic & Road Routing Distance Engine", () => {
    const cp = { lat: 28.6315, lng: 77.2167 }; // Connaught Place
    const southExt = { lat: 28.5684, lng: 77.2215 }; // South Extension

    it("calculates symmetric Haversine straight-line distance", () => {
      const d1 = calculateStraightLineDistanceKm(cp, southExt);
      const d2 = calculateStraightLineDistanceKm(southExt, cp);
      expect(d1).toBeCloseTo(d2, 6);
      // Roughly 7.0 km straight line between CP and South Ex
      expect(d1).toBeGreaterThan(6.5);
      expect(d1).toBeLessThan(7.5);
    });

    it("applies the Indian urban road winding factor (1.30x)", () => {
      const straight = calculateStraightLineDistanceKm(cp, southExt);
      const road = calculateEstimatedRoadDistanceKm(cp, southExt);
      expect(ROAD_WINDING_FACTOR).toBe(1.3);
      expect(road).toBeCloseTo(straight * 1.3, 0);
    });

    it("handles zero distance for identical coordinates", () => {
      const dist = calculateStraightLineDistanceKm(cp, cp);
      expect(dist).toBe(0);
    });
  });

  describe("4. Transit ETA & Night Window Detection", () => {
    it("estimates realistic pickup and total delivery transit times", () => {
      const eta = estimateCourierTransitMinutes(5.0);
      expect(eta.pickupMinutes).toBe(8);
      // 5 km at 20 km/h is 15 minutes transit + 8 mins pickup = 23 mins
      expect(eta.deliveryMinutes).toBeGreaterThanOrEqual(20);
      expect(eta.deliveryMinutes).toBeLessThanOrEqual(25);
    });

    it("identifies 23:00 as night and 14:00 as day", () => {
      const nightDate = new Date("2026-10-21T23:30:00");
      const dayDate = new Date("2026-10-21T14:30:00");
      const earlyMorningDate = new Date("2026-10-21T04:15:00");

      expect(isNightTimeWindow(nightDate)).toBe(true);
      expect(isNightTimeWindow(dayDate)).toBe(false);
      expect(isNightTimeWindow(earlyMorningDate)).toBe(true);
    });
  });
});
