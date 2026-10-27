import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isPointInPolygon,
  resolveActiveGeofenceMode,
  checkThreatZoneExclusion,
  getIstCurrentTime,
} from "./geo/geofence-guard.ts";
import type { ThreatZonePolygon, PlatformSettings } from "./types.ts";

describe("Dynamic Geofencing & Time-Varying Radius Security Controls", () => {
  it("resolves Day Mode (12.0 km default) during daytime commercial hours (10:00 IST)", () => {
    // 10:00 AM IST is 04:30 AM UTC
    const dateAt10AmIst = new Date("2026-10-27T04:30:00.000Z");
    const result = resolveActiveGeofenceMode(
      {
        dayModeRadiusKm: 12.0,
        eveningModeRadiusKm: 7.5,
        nightModeRadiusKm: 3.5,
        lateNightCodSafetyLockout: true,
      },
      dateAt10AmIst
    );

    assert.equal(result.mode, "DAY");
    assert.equal(result.activeRadiusKm, 12.0);
    assert.equal(result.isLateNightCodLocked, false);
    assert.equal(result.timeString, "10:00");
  });

  it("resolves Evening Rush Mode (7.5 km default) during peak dinner hours (20:00 IST)", () => {
    // 20:00 (8 PM) IST is 14:30 UTC
    const dateAt8PmIst = new Date("2026-10-27T14:30:00.000Z");
    const result = resolveActiveGeofenceMode(
      {
        dayModeRadiusKm: 12.0,
        eveningModeRadiusKm: 7.5,
        nightModeRadiusKm: 3.5,
        lateNightCodSafetyLockout: true,
      },
      dateAt8PmIst
    );

    assert.equal(result.mode, "EVENING_RUSH");
    assert.equal(result.activeRadiusKm, 7.5);
    assert.equal(result.isLateNightCodLocked, false);
    assert.equal(result.timeString, "20:00");
  });

  it("resolves Late-Night Security Mode (3.5 km default) with fail-safe COD lockout (23:30 IST)", () => {
    // 23:30 (11:30 PM) IST is 18:00 UTC
    const dateAt1130PmIst = new Date("2026-10-27T18:00:00.000Z");
    const result = resolveActiveGeofenceMode(
      {
        dayModeRadiusKm: 12.0,
        eveningModeRadiusKm: 7.5,
        nightModeRadiusKm: 3.5,
        lateNightCodSafetyLockout: true,
      },
      dateAt1130PmIst
    );

    assert.equal(result.mode, "LATE_NIGHT");
    assert.equal(result.activeRadiusKm, 3.5);
    assert.equal(result.isLateNightCodLocked, true); // Strict COD Lockout Active
    assert.equal(result.timeString, "23:30");
  });

  it("resolves Late-Night Security Mode at 02:00 AM IST with fail-safe COD lockout", () => {
    // 02:00 AM IST is 20:30 UTC previous day
    const dateAt2AmIst = new Date("2026-10-26T20:30:00.000Z");
    const result = resolveActiveGeofenceMode(
      {
        dayModeRadiusKm: 12.0,
        eveningModeRadiusKm: 7.5,
        nightModeRadiusKm: 3.5,
        lateNightCodSafetyLockout: true,
      },
      dateAt2AmIst
    );

    assert.equal(result.mode, "LATE_NIGHT");
    assert.equal(result.activeRadiusKm, 3.5);
    assert.equal(result.isLateNightCodLocked, true);
    assert.equal(result.timeString, "02:00");
  });

  it("respects founder override when COD lockout is explicitly disabled", () => {
    const dateAt1130PmIst = new Date("2026-10-27T18:00:00.000Z");
    const result = resolveActiveGeofenceMode(
      {
        dayModeRadiusKm: 12.0,
        eveningModeRadiusKm: 7.5,
        nightModeRadiusKm: 3.5,
        lateNightCodSafetyLockout: false,
      },
      dateAt1130PmIst
    );

    assert.equal(result.mode, "LATE_NIGHT");
    assert.equal(result.isLateNightCodLocked, false);
  });
});

describe("Ray-Casting Point-in-Polygon & Threat Zone Security Exclusions", () => {
  const nh37ThreatZone: ThreatZonePolygon = {
    id: "threat_nh37_unlit",
    name: "NH-37 Forest Border Corridor",
    severity: "CRITICAL",
    reason: "Zero street lighting and reported late-night ambushes.",
    polygon: [
      [24.8900, 92.3100],
      [24.9100, 92.3300],
      [24.9050, 92.3600],
      [24.8750, 92.3350],
    ],
    active: true,
    createdAt: "2026-10-27T00:00:00.000Z",
  };

  it("correctly identifies coordinates inside a threat polygon using ray-casting", () => {
    const pointInside: [number, number] = [24.8950, 92.3350];
    const isInside = isPointInPolygon(pointInside, nh37ThreatZone.polygon);
    assert.equal(isInside, true);
  });

  it("correctly identifies coordinates outside a threat polygon", () => {
    const pointOutside: [number, number] = [24.8688, 92.3511]; // Town core
    const isInside = isPointInPolygon(pointOutside, nh37ThreatZone.polygon);
    assert.equal(isInside, false);
  });

  it("fails-closed and flags delivery coordinates within an active threat zone", () => {
    const dangerousCoords = { lat: 24.8950, lng: 92.3350 };
    const check = checkThreatZoneExclusion(dangerousCoords.lat, dangerousCoords.lng, [nh37ThreatZone]);

    assert.equal(check.isExcluded, true);
    assert.equal(check.matchedZone?.id, "threat_nh37_unlit");
    assert.equal(check.matchedZone?.severity, "CRITICAL");
  });

  it("allows delivery coordinates in safe urban sectors outside all threat zones", () => {
    const safeCoords = { lat: 24.8688, lng: 92.3511 }; // Karimganj Station Road
    const check = checkThreatZoneExclusion(safeCoords.lat, safeCoords.lng, [nh37ThreatZone]);

    assert.equal(check.isExcluded, false);
    assert.equal(check.matchedZone, undefined);
  });

  it("ignores threat zones that have been deactivated by the founder", () => {
    const deactivatedZone: ThreatZonePolygon = {
      ...nh37ThreatZone,
      active: false,
    };
    const dangerousCoords = { lat: 24.8950, lng: 92.3350 };
    const check = checkThreatZoneExclusion(dangerousCoords.lat, dangerousCoords.lng, [deactivatedZone]);

    assert.equal(check.isExcluded, false);
  });
});
