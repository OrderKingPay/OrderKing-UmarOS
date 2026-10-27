import { describe, it, expect } from "vitest";
import {
  parseIstTime,
  getActiveShift,
  isPointInPolygon,
  evaluateHazardLocation,
  evaluateDeliveryRadius,
  HAZARD_ZONES,
  type GeoPoint,
} from "../lib/geo/dynamic-radius";

describe("Time-Based Dynamic Radius & Geofencing Architecture", () => {
  // Helper to create exact IST dates for tests
  // Note: UTC is 5 hours 30 minutes behind IST (UTC = IST - 5:30)
  function makeIstDate(hours: number, minutes: number): Date {
    // 2026-10-27 in UTC
    const d = new Date(Date.UTC(2026, 9, 27, 0, 0, 0));
    // Set UTC time corresponding to the target IST time (hours, minutes)
    // IST = UTC + 5:30 -> UTC = IST - 5:30
    const totalIstMinutes = hours * 60 + minutes;
    const totalUtcMinutes = totalIstMinutes - 330; // 5*60 + 30 = 330
    d.setUTCMinutes(totalUtcMinutes);
    return d;
  }

  describe("1. Authentic IST (Asia/Kolkata) Time Calculations", () => {
    it("parses morning 06:00 IST accurately", () => {
      const d = makeIstDate(6, 0);
      const ist = parseIstTime(d);
      expect(ist.hours).toBe(6);
      expect(ist.minutes).toBe(0);
      expect(ist.totalMinutes).toBe(360);
      expect(ist.formattedTime).toBe("06:00 IST");
    });

    it("parses evening rush 18:30 IST accurately", () => {
      const d = makeIstDate(18, 30);
      const ist = parseIstTime(d);
      expect(ist.hours).toBe(18);
      expect(ist.minutes).toBe(30);
      expect(ist.totalMinutes).toBe(1110);
      expect(ist.formattedTime).toBe("18:30 IST");
    });

    it("parses late-night 22:30 IST accurately", () => {
      const d = makeIstDate(22, 30);
      const ist = parseIstTime(d);
      expect(ist.hours).toBe(22);
      expect(ist.minutes).toBe(30);
      expect(ist.totalMinutes).toBe(1350);
      expect(ist.formattedTime).toBe("22:30 IST");
    });

    it("parses midnight 00:00 IST accurately", () => {
      const d = makeIstDate(0, 0);
      const ist = parseIstTime(d);
      expect(ist.hours).toBe(0);
      expect(ist.minutes).toBe(0);
      expect(ist.totalMinutes).toBe(0);
      expect(ist.formattedTime).toBe("00:00 IST");
    });
  });

  describe("2. Shift Boundaries & Operational Policies", () => {
    it("Day Shift (06:00 to 18:30 IST): 12.0 km radius, 45 min max ETA, COD enabled", () => {
      const dMidDay = makeIstDate(12, 15);
      const shift = getActiveShift(dMidDay);

      expect(shift.type).toBe("DAY_SHIFT");
      expect(shift.maxRadiusKm).toBe(12.0);
      expect(shift.maxEtaMinutes).toBe(45);
      expect(shift.codEnabled).toBe(true);
    });

    it("boundary at 06:00 IST enters Day Shift", () => {
      const d0600 = makeIstDate(6, 0);
      expect(getActiveShift(d0600).type).toBe("DAY_SHIFT");
    });

    it("boundary at 18:29 IST remains in Day Shift", () => {
      const d1829 = makeIstDate(18, 29);
      expect(getActiveShift(d1829).type).toBe("DAY_SHIFT");
    });

    it("Evening Rush (18:30 to 22:30 IST): 7.5 km radius, 35 min max ETA, high velocity", () => {
      const dRush = makeIstDate(20, 0);
      const shift = getActiveShift(dRush);

      expect(shift.type).toBe("EVENING_RUSH");
      expect(shift.maxRadiusKm).toBe(7.5);
      expect(shift.maxEtaMinutes).toBe(35);
      expect(shift.codEnabled).toBe(true);
    });

    it("boundary at 18:30 IST enters Evening Rush", () => {
      const d1830 = makeIstDate(18, 30);
      expect(getActiveShift(d1830).type).toBe("EVENING_RUSH");
    });

    it("boundary at 22:29 IST remains in Evening Rush", () => {
      const d2229 = makeIstDate(22, 29);
      expect(getActiveShift(d2229).type).toBe("EVENING_RUSH");
    });

    it("Late-Night Security (22:30 to 06:00 IST): 3.5 km radius, 25 min max ETA, COD disabled", () => {
      const dLate = makeIstDate(23, 45);
      const shift = getActiveShift(dLate);

      expect(shift.type).toBe("LATE_NIGHT_SECURITY");
      expect(shift.maxRadiusKm).toBe(3.5);
      expect(shift.maxEtaMinutes).toBe(25);
      expect(shift.codEnabled).toBe(false); // Mandatory prepaid digital
    });

    it("boundary at 22:30 IST enters Late-Night Security", () => {
      const d2230 = makeIstDate(22, 30);
      expect(getActiveShift(d2230).type).toBe("LATE_NIGHT_SECURITY");
    });

    it("boundary at 05:59 IST remains in Late-Night Security", () => {
      const d0559 = makeIstDate(5, 59);
      expect(getActiveShift(d0559).type).toBe("LATE_NIGHT_SECURITY");
    });
  });

  describe("3. Ray-Casting Point-in-Polygon (Jordan Curve Theorem)", () => {
    const squarePoly: GeoPoint[] = [
      { lat: 10, lng: 10 },
      { lat: 10, lng: 20 },
      { lat: 20, lng: 20 },
      { lat: 20, lng: 10 },
    ];

    it("identifies points strictly inside the polygon", () => {
      expect(isPointInPolygon({ lat: 15, lng: 15 }, squarePoly)).toBe(true);
      expect(isPointInPolygon({ lat: 11, lng: 19 }, squarePoly)).toBe(true);
    });

    it("identifies points outside the polygon", () => {
      expect(isPointInPolygon({ lat: 5, lng: 15 }, squarePoly)).toBe(false);
      expect(isPointInPolygon({ lat: 25, lng: 15 }, squarePoly)).toBe(false);
      expect(isPointInPolygon({ lat: 15, lng: 5 }, squarePoly)).toBe(false);
      expect(isPointInPolygon({ lat: 15, lng: 25 }, squarePoly)).toBe(false);
    });

    it("handles complex non-convex concave polygons", () => {
      // L-shaped polygon
      const lShape: GeoPoint[] = [
        { lat: 0, lng: 0 },
        { lat: 0, lng: 10 },
        { lat: 5, lng: 10 },
        { lat: 5, lng: 5 },
        { lat: 10, lng: 5 },
        { lat: 10, lng: 0 },
      ];
      // Point inside bottom arm
      expect(isPointInPolygon({ lat: 2, lng: 8 }, lShape)).toBe(true);
      // Point inside vertical stem
      expect(isPointInPolygon({ lat: 8, lng: 2 }, lShape)).toBe(true);
      // Point in the cut-out corner (outside)
      expect(isPointInPolygon({ lat: 8, lng: 8 }, lShape)).toBe(false);
    });
  });

  describe("4. Hazard Zone Blacklist Evaluation", () => {
    it("flags Kushiyara River border marsh sector as CRITICAL_BLOCKED", () => {
      // Center of Kushiyara River polygon: ~24.885, 92.350
      const pointInRiverbed = { lat: 24.885, lng: 92.350 };
      const result = evaluateHazardLocation(pointInRiverbed);

      expect(result.inHazardZone).toBe(true);
      expect(result.zone?.id).toBe("kushiyara_unlit_riverbank");
      expect(result.severity).toBe("CRITICAL_BLOCKED");
      expect(result.canDeliver).toBe(false);
      expect(result.codAllowed).toBe(false);
      expect(result.advisory).toContain("strictly prohibited");
    });

    it("flags Yamuna Khadar floodplain sector as CRITICAL_BLOCKED", () => {
      // Center of Yamuna Khadar polygon: ~28.665, 77.260
      const pointInFloodplain = { lat: 28.665, lng: 77.260 };
      const result = evaluateHazardLocation(pointInFloodplain);

      expect(result.inHazardZone).toBe(true);
      expect(result.zone?.id).toBe("yamuna_khadar_floodplain");
      expect(result.severity).toBe("CRITICAL_BLOCKED");
      expect(result.canDeliver).toBe(false);
    });

    it("flags Outer Freight Expressway as WARNING_NO_COD", () => {
      // Center of freight corridor: ~28.525, 77.310
      const pointInCorridor = { lat: 28.525, lng: 77.310 };
      const result = evaluateHazardLocation(pointInCorridor);

      expect(result.inHazardZone).toBe(true);
      expect(result.zone?.id).toBe("delhi_freight_expressway_unlit");
      expect(result.severity).toBe("WARNING_NO_COD");
      expect(result.canDeliver).toBe(true); // Delivery allowed
      expect(result.codAllowed).toBe(false); // But COD disabled
      expect(result.advisory).toContain("Cash on Delivery is suspended");
    });

    it("validates safe city zones as SAFE with delivery and COD permitted", () => {
      // Connaught Place Inner Circle: 28.6315, 77.2167
      const cpPoint = { lat: 28.6315, lng: 77.2167 };
      const result = evaluateHazardLocation(cpPoint);

      expect(result.inHazardZone).toBe(false);
      expect(result.zone).toBeNull();
      expect(result.severity).toBe("SAFE");
      expect(result.canDeliver).toBe(true);
      expect(result.codAllowed).toBe(true);
      expect(result.advisory).toBeNull();
    });
  });

  describe("5. End-to-End Delivery Radius & Security Evaluation", () => {
    // Connaught Place center
    const cpOrigin: GeoPoint = { lat: 28.6315, lng: 77.2167 };

    // Outlet 2.0 km away (e.g. Bengali Market ~28.627, 77.234)
    const outlet2km: GeoPoint = { lat: 28.6270, lng: 77.2340 };

    // Outlet 5.5 km away (e.g. Lajpat Nagar ~28.570, 77.240)
    const outlet5km: GeoPoint = { lat: 28.5800, lng: 77.2250 };

    // Outlet 9.5 km away (e.g. Nehru Place ~28.549, 77.253)
    const outlet9km: GeoPoint = { lat: 28.5500, lng: 77.2500 };

    // Outlet 15.0 km away (e.g. Noida Sector 18 ~28.570, 77.320)
    const outlet15km: GeoPoint = { lat: 28.5700, lng: 77.3300 };

    it("Day Shift (12.0 km radius): allows 2km, 5km, and 9km outlets; blocks 15km outlet", () => {
      const dDay = makeIstDate(14, 0);

      const eval2km = evaluateDeliveryRadius(cpOrigin, outlet2km, { date: dDay });
      expect(eval2km.allowed).toBe(true);
      expect(eval2km.withinRadius).toBe(true);
      expect(eval2km.codAllowed).toBe(true);

      const eval9km = evaluateDeliveryRadius(cpOrigin, outlet9km, { date: dDay });
      expect(eval9km.allowed).toBe(true);
      expect(eval9km.withinRadius).toBe(true);

      const eval15km = evaluateDeliveryRadius(cpOrigin, outlet15km, { date: dDay });
      expect(eval15km.allowed).toBe(false);
      expect(eval15km.withinRadius).toBe(false);
      expect(eval15km.rejectionReason).toContain("Day Shift");
    });

    it("Evening Rush (7.5 km radius): allows 2km and 5km outlets; blocks 9km outlet due to traffic velocity compression", () => {
      const dRush = makeIstDate(19, 30);

      const eval5km = evaluateDeliveryRadius(cpOrigin, outlet5km, { date: dRush });
      expect(eval5km.allowed).toBe(true);
      expect(eval5km.withinRadius).toBe(true);

      const eval9km = evaluateDeliveryRadius(cpOrigin, outlet9km, { date: dRush });
      expect(eval9km.allowed).toBe(false);
      expect(eval9km.withinRadius).toBe(false);
      expect(eval9km.rejectionReason).toContain("Evening Rush");
    });

    it("Late-Night Security (3.5 km radius): allows 2km outlet; blocks 5km outlet; disables COD everywhere", () => {
      const dLate = makeIstDate(23, 30);

      const eval2km = evaluateDeliveryRadius(cpOrigin, outlet2km, { date: dLate });
      expect(eval2km.allowed).toBe(true);
      expect(eval2km.withinRadius).toBe(true);
      expect(eval2km.codAllowed).toBe(false); // COD strictly disabled at late night
      expect(eval2km.warningMessage).toContain("Late-Night Security");

      const eval5km = evaluateDeliveryRadius(cpOrigin, outlet5km, { date: dLate });
      expect(eval5km.allowed).toBe(false);
      expect(eval5km.withinRadius).toBe(false);
      expect(eval5km.rejectionReason).toContain("Late-Night Security");
    });

    it("immediately halts delivery when customer is in a CRITICAL_BLOCKED hazard sector", () => {
      const riverbedOrigin: GeoPoint = { lat: 24.885, lng: 92.350 };
      const karimganjOutlet: GeoPoint = { lat: 24.8688, lng: 92.3511 };

      const evalResult = evaluateDeliveryRadius(riverbedOrigin, karimganjOutlet);
      expect(evalResult.allowed).toBe(false);
      expect(evalResult.originHazard.severity).toBe("CRITICAL_BLOCKED");
      expect(evalResult.rejectionReason).toContain("strictly prohibited");
    });

    it("allows delivery but disables COD when customer is in a WARNING_NO_COD sector", () => {
      const freightCorridorOrigin: GeoPoint = { lat: 28.525, lng: 77.310 };
      const nearbyOutlet: GeoPoint = { lat: 28.530, lng: 77.300 }; // ~1.5 km away

      const dDay = makeIstDate(12, 0);
      const evalResult = evaluateDeliveryRadius(freightCorridorOrigin, nearbyOutlet, { date: dDay });

      expect(evalResult.allowed).toBe(true);
      expect(evalResult.codAllowed).toBe(false); // COD suspended
      expect(evalResult.warningMessage).toContain("Cash on Delivery is suspended");
    });
  });
});
