import { describe, it, expect } from "vitest";
import {
  isPointInPolygon,
  isPointOnPolygonBoundary,
  haversineDistance,
  calculateBearing,
  isServiceable,
  isTimeInWindow,
  isOvernightRollover,
  distanceToPolygonBoundaryKm,
  normalizePolygonDefinition,
  DEFAULT_SCHEDULE_WINDOWS,
  DEFAULT_SOVEREIGN_ZONES,
  type ServiceZone,
  type ServiceScheduleWindow,
  type ServiceabilityConfig,
  type GeoJSONPolygon,
  type GeoJSONMultiPolygon,
  type PolygonRings,
} from "./geofencing";

describe("Geofencing & Ray-Casting Algorithm", () => {
  // A square polygon: (0,0) to (10,10) in [lat, lng]
  const squarePolygon = [
    { lat: 0, lng: 0 },
    { lat: 0, lng: 10 },
    { lat: 10, lng: 10 },
    { lat: 10, lng: 0 },
  ];

  it("identifies points strictly inside a polygon", () => {
    expect(isPointInPolygon({ lat: 5, lng: 5 }, squarePolygon)).toBe(true);
    expect(isPointInPolygon({ lat: 1, lng: 1 }, squarePolygon)).toBe(true);
    expect(isPointInPolygon({ lat: 9, lng: 9 }, squarePolygon)).toBe(true);
  });

  it("identifies points strictly outside a polygon", () => {
    expect(isPointInPolygon({ lat: 15, lng: 5 }, squarePolygon)).toBe(false);
    expect(isPointInPolygon({ lat: -2, lng: 5 }, squarePolygon)).toBe(false);
    expect(isPointInPolygon({ lat: 5, lng: 15 }, squarePolygon)).toBe(false);
    expect(isPointInPolygon({ lat: 5, lng: -5 }, squarePolygon)).toBe(false);
  });

  it("handles points on polygon boundary and vertices", () => {
    // Vertex
    expect(isPointOnPolygonBoundary({ lat: 0, lng: 0 }, squarePolygon)).toBe(true);
    expect(isPointInPolygon({ lat: 0, lng: 0 }, squarePolygon)).toBe(true);

    // Edge
    expect(isPointOnPolygonBoundary({ lat: 5, lng: 0 }, squarePolygon)).toBe(true);
    expect(isPointInPolygon({ lat: 5, lng: 0 }, squarePolygon)).toBe(true);
    expect(isPointOnPolygonBoundary({ lat: 0, lng: 5 }, squarePolygon)).toBe(true);
    expect(isPointInPolygon({ lat: 0, lng: 5 }, squarePolygon)).toBe(true);

    // Point clearly inside is NOT on the boundary
    expect(isPointOnPolygonBoundary({ lat: 5, lng: 5 }, squarePolygon)).toBe(false);
  });

  it("supports array of [lat, lng] tuples", () => {
    const tuplePolygon: [number, number][] = [
      [24.8, 92.3],
      [24.8, 92.4],
      [24.9, 92.4],
      [24.9, 92.3],
    ];

    expect(isPointInPolygon([24.85, 92.35], tuplePolygon)).toBe(true);
    expect(isPointInPolygon([25.0, 92.35], tuplePolygon)).toBe(false);
  });

  it("supports complex polygons with holes (interior excluded)", () => {
    // Outer: 0..10, Hole: 4..6
    const polygonWithHole: PolygonRings = {
      outer: [
        { lat: 0, lng: 0 },
        { lat: 0, lng: 10 },
        { lat: 10, lng: 10 },
        { lat: 10, lng: 0 },
      ],
      holes: [
        [
          { lat: 4, lng: 4 },
          { lat: 4, lng: 6 },
          { lat: 6, lng: 6 },
          { lat: 6, lng: 4 },
        ],
      ],
    };

    // Inside outer and outside hole -> true
    expect(isPointInPolygon({ lat: 2, lng: 2 }, polygonWithHole)).toBe(true);
    expect(isPointInPolygon({ lat: 8, lng: 8 }, polygonWithHole)).toBe(true);

    // Inside the hole -> false
    expect(isPointInPolygon({ lat: 5, lng: 5 }, polygonWithHole)).toBe(false);
  });

  it("supports GeoJSON Polygon and MultiPolygon inputs", () => {
    // GeoJSON uses [longitude, latitude]
    const geoJsonPoly: GeoJSONPolygon = {
      type: "Polygon",
      coordinates: [
        [
          [92.3, 24.8],
          [92.4, 24.8],
          [92.4, 24.9],
          [92.3, 24.9],
          [92.3, 24.8],
        ],
      ],
    };

    expect(isPointInPolygon({ lat: 24.85, lng: 92.35 }, geoJsonPoly)).toBe(true);
    expect(isPointInPolygon({ lat: 24.75, lng: 92.35 }, geoJsonPoly)).toBe(false);

    const geoJsonMultiPoly: GeoJSONMultiPolygon = {
      type: "MultiPolygon",
      coordinates: [
        [
          [
            [92.0, 24.0],
            [92.1, 24.0],
            [92.1, 24.1],
            [92.0, 24.1],
            [92.0, 24.0],
          ],
        ],
        [
          [
            [93.0, 25.0],
            [93.1, 25.0],
            [93.1, 25.1],
            [93.0, 25.1],
            [93.0, 25.0],
          ],
        ],
      ],
    };

    expect(isPointInPolygon({ lat: 24.05, lng: 92.05 }, geoJsonMultiPoly)).toBe(true);
    expect(isPointInPolygon({ lat: 25.05, lng: 93.05 }, geoJsonMultiPoly)).toBe(true);
    expect(isPointInPolygon({ lat: 24.5, lng: 92.5 }, geoJsonMultiPoly)).toBe(false);
  });
});

describe("Haversine Distance & Bearing Calculations", () => {
  it("calculates great-circle distance accurately", () => {
    // 1 degree latitude is approx 111.19 km
    const dist = haversineDistance({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    expect(dist).toBeGreaterThan(110);
    expect(dist).toBeLessThan(112);

    // Distance in meters
    const distM = haversineDistance({ lat: 0, lng: 0 }, { lat: 0.01, lng: 0 }, "m");
    expect(distM).toBeGreaterThan(1100);
    expect(distM).toBeLessThan(1120);

    // Same point distance is 0
    expect(haversineDistance({ lat: 24.86, lng: 92.35 }, { lat: 24.86, lng: 92.35 })).toBe(0);
  });

  it("calculates forward azimuth bearing accurately", () => {
    // Due North: bearing ~ 0 degrees
    const northBearing = calculateBearing({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    expect(Math.round(northBearing)).toBe(0);

    // Due East: bearing ~ 90 degrees
    const eastBearing = calculateBearing({ lat: 0, lng: 0 }, { lat: 0, lng: 1 });
    expect(Math.round(eastBearing)).toBe(90);

    // Due South: bearing ~ 180 degrees
    const southBearing = calculateBearing({ lat: 1, lng: 0 }, { lat: 0, lng: 0 });
    expect(Math.round(southBearing)).toBe(180);

    // Due West: bearing ~ 270 degrees
    const westBearing = calculateBearing({ lat: 0, lng: 1 }, { lat: 0, lng: 0 });
    expect(Math.round(westBearing)).toBe(270);
  });

  it("calculates distance to nearest polygon boundary", () => {
    const polygon = [
      { lat: 24.8, lng: 92.3 },
      { lat: 24.8, lng: 92.4 },
      { lat: 24.9, lng: 92.4 },
      { lat: 24.9, lng: 92.3 },
    ];

    // Point north of polygon boundary
    const dist = distanceToPolygonBoundaryKm({ lat: 25.0, lng: 92.35 }, polygon);
    expect(dist).toBeGreaterThan(10);
    expect(dist).toBeLessThan(12);
  });
});

describe("Dynamic Time-Based Serviceability Engine", () => {
  const testZones: ServiceZone[] = [
    {
      id: "core_zone",
      name: "Sribhumi Central Hub",
      tier: "core",
      polygon: [
        { lat: 24.85, lng: 92.34 },
        { lat: 24.85, lng: 92.36 },
        { lat: 24.88, lng: 92.36 },
        { lat: 24.88, lng: 92.34 },
      ],
      allowedSchedules: ["daytime", "evening", "late_night"],
    },
    {
      id: "metro_zone",
      name: "Greater Metro Ring",
      tier: "metro",
      polygon: [
        { lat: 24.83, lng: 92.32 },
        { lat: 24.83, lng: 92.38 },
        { lat: 24.90, lng: 92.38 },
        { lat: 24.90, lng: 92.32 },
      ],
      allowedSchedules: ["daytime", "evening"],
    },
    {
      id: "suburban_zone",
      name: "Outskirts Suburban Area",
      tier: "suburban",
      polygon: [
        { lat: 24.80, lng: 92.28 },
        { lat: 24.80, lng: 92.42 },
        { lat: 24.93, lng: 92.42 },
        { lat: 24.93, lng: 92.28 },
      ],
      allowedSchedules: ["daytime"],
      activeDaysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri only
    },
  ];

  const testConfig: ServiceabilityConfig = {
    zones: testZones,
    schedules: DEFAULT_SCHEDULE_WINDOWS,
  };

  // Test Points
  const corePoint = { lat: 24.865, lng: 92.35 };       // Inside core_zone
  const metroPoint = { lat: 24.84, lng: 92.33 };       // Inside metro_zone only
  const suburbanPoint = { lat: 24.81, lng: 92.30 };    // Inside suburban_zone only
  const outsidePoint = { lat: 25.50, lng: 93.00 };     // Far away

  describe("Daytime Schedule (06:00 to 18:00 - Wide City Coverage)", () => {
    // 2026-10-14 is a Wednesday (day 3) at 12:00 PM
    const wednesdayNoon = new Date("2026-10-14T12:00:00");

    it("services core, metro, and suburban tiers during daytime", () => {
      const coreRes = isServiceable(corePoint, wednesdayNoon, testConfig);
      expect(coreRes.serviceable).toBe(true);
      expect(coreRes.reasonCode).toBe("SERVICEABLE");
      expect(coreRes.currentScheduleType).toBe("daytime");
      expect(coreRes.matchedZone?.id).toBe("core_zone");

      const metroRes = isServiceable(metroPoint, wednesdayNoon, testConfig);
      expect(metroRes.serviceable).toBe(true);
      expect(metroRes.matchedZone?.id).toBe("metro_zone");

      const suburbanRes = isServiceable(suburbanPoint, wednesdayNoon, testConfig);
      expect(suburbanRes.serviceable).toBe(true);
      expect(suburbanRes.matchedZone?.id).toBe("suburban_zone");
    });

    it("rejects locations outside all geofences with distance to nearest zone", () => {
      const outRes = isServiceable(outsidePoint, wednesdayNoon, testConfig);
      expect(outRes.serviceable).toBe(false);
      expect(outRes.reasonCode).toBe("OUTSIDE_GEOFENCE");
      expect(outRes.nearestZone).toBeDefined();
      expect(outRes.distanceToNearestZoneBoundaryKm).toBeGreaterThan(0);
    });
  });

  describe("Evening Schedule (18:00 to 22:00 - Core Urban Fleet)", () => {
    const eveningTime = new Date("2026-10-14T19:30:00"); // 7:30 PM

    it("services core and metro zones, but deactivates suburban outskirts", () => {
      const coreRes = isServiceable(corePoint, eveningTime, testConfig);
      expect(coreRes.serviceable).toBe(true);
      expect(coreRes.currentScheduleType).toBe("evening");

      const metroRes = isServiceable(metroPoint, eveningTime, testConfig);
      expect(metroRes.serviceable).toBe(true);

      const suburbanRes = isServiceable(suburbanPoint, eveningTime, testConfig);
      expect(suburbanRes.serviceable).toBe(false);
      expect(suburbanRes.reasonCode).toBe("ZONE_INACTIVE_SCHEDULE");
    });
  });

  describe("Late-Night Schedule (22:00 to 04:00 - Safe Zones & Midnight Rollover)", () => {
    it("handles pre-midnight window (e.g. 23:30)", () => {
      const latePreMidnight = new Date("2026-10-14T23:30:00");

      const coreRes = isServiceable(corePoint, latePreMidnight, testConfig);
      expect(coreRes.serviceable).toBe(true);
      expect(coreRes.currentScheduleType).toBe("late_night");

      const metroRes = isServiceable(metroPoint, latePreMidnight, testConfig);
      expect(metroRes.serviceable).toBe(false);
      expect(metroRes.reasonCode).toBe("ZONE_INACTIVE_SCHEDULE");

      const suburbanRes = isServiceable(suburbanPoint, latePreMidnight, testConfig);
      expect(suburbanRes.serviceable).toBe(false);
      expect(suburbanRes.reasonCode).toBe("ZONE_INACTIVE_SCHEDULE");
    });

    it("handles post-midnight wrap-around window (e.g. 02:45 AM)", () => {
      const latePostMidnight = new Date("2026-10-15T02:45:00");

      expect(isTimeInWindow(latePostMidnight, "22:00", "04:00")).toBe(true);
      expect(isOvernightRollover(latePostMidnight, "22:00", "04:00")).toBe(true);

      const coreRes = isServiceable(corePoint, latePostMidnight, testConfig);
      expect(coreRes.serviceable).toBe(true);
      expect(coreRes.currentScheduleType).toBe("late_night");

      const metroRes = isServiceable(metroPoint, latePostMidnight, testConfig);
      expect(metroRes.serviceable).toBe(false);
      expect(metroRes.reasonCode).toBe("ZONE_INACTIVE_SCHEDULE");
    });

    it("closes service after late-night cutoff before morning restart (e.g. 04:45 AM)", () => {
      const earlyMorningClosed = new Date("2026-10-15T04:45:00");

      const res = isServiceable(corePoint, earlyMorningClosed, testConfig);
      expect(res.serviceable).toBe(false);
      expect(res.reasonCode).toBe("ZONE_INACTIVE_SCHEDULE");
      expect(res.currentScheduleType).toBe("closed");
    });
  });

  describe("Day-of-Week Schedule Restrictions", () => {
    // 2026-10-18 is a Sunday (day 0)
    const sundayNoon = new Date("2026-10-18T12:00:00");

    it("enforces day-of-week active restrictions on suburban zone (weekday only)", () => {
      const subRes = isServiceable(suburbanPoint, sundayNoon, testConfig);
      expect(subRes.serviceable).toBe(false);
      expect(subRes.reasonCode).toBe("ZONE_DAY_RESTRICTED");

      // Core zone has no day restriction and should remain active
      const coreRes = isServiceable(corePoint, sundayNoon, testConfig);
      expect(coreRes.serviceable).toBe(true);
    });
  });

  describe("Emergency Weather & Road Restriction Overrides", () => {
    const normalDaytime = new Date("2026-10-14T12:00:00");

    it("triggers critical freeze shutting down all delivery activity instantly", () => {
      const emergencyConfig: ServiceabilityConfig = {
        ...testConfig,
        emergencyOverride: {
          active: true,
          level: "CRITICAL_FREEZE",
          freezeAllDeliveries: true,
          reason: "Category 5 Cyclone Warning and Severe Urban Flooding",
        },
      };

      const coreRes = isServiceable(corePoint, normalDaytime, emergencyConfig);
      expect(coreRes.serviceable).toBe(false);
      expect(coreRes.reasonCode).toBe("EMERGENCY_FREEZE");
      expect(coreRes.details).toContain("Cyclone Warning");

      const metroRes = isServiceable(metroPoint, normalDaytime, emergencyConfig);
      expect(metroRes.serviceable).toBe(false);
      expect(metroRes.reasonCode).toBe("EMERGENCY_FREEZE");
    });

    it("isolates and suspends specific affected zones while keeping others active", () => {
      const partialEmergencyConfig: ServiceabilityConfig = {
        ...testConfig,
        emergencyOverride: {
          active: true,
          level: "ORANGE",
          freezeAllDeliveries: false,
          reason: "Major Pipeline Burst on Ring Road",
          affectedZoneIds: ["metro_zone"],
        },
      };

      // Metro zone should be rejected under emergency restriction
      const metroRes = isServiceable(metroPoint, normalDaytime, partialEmergencyConfig);
      expect(metroRes.serviceable).toBe(false);
      expect(metroRes.reasonCode).toBe("ZONE_EMERGENCY_RESTRICTED");
      expect(metroRes.details).toContain("Pipeline Burst");

      // Core zone should remain serviceable
      const coreRes = isServiceable(corePoint, normalDaytime, partialEmergencyConfig);
      expect(coreRes.serviceable).toBe(true);
      expect(coreRes.reasonCode).toBe("SERVICEABLE");
    });
  });
});
