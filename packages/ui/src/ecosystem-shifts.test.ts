import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ECOSYSTEM_SHIFTS,
  CANONICAL_THREAT_ZONES,
  getCurrentEcosystemShift,
  getShiftRemainingMinutes,
  isDistanceAllowedForShift,
  checkThreatZoneIntersections,
  evaluateRiderSafetyZone,
  calculateHaversineKm,
} from "./ecosystem-shifts.ts";

describe("Sovereign Ecosystem Shifts & Threat Zones Specification", () => {
  it("enforces exact shift delivery radius boundaries (Day: 12km, Evening: 7.5km, Late-Night: 3.5km)", () => {
    assert.equal(ECOSYSTEM_SHIFTS.DAY.maxRadiusKm, 12.0);
    assert.equal(ECOSYSTEM_SHIFTS.EVENING.maxRadiusKm, 7.5);
    assert.equal(ECOSYSTEM_SHIFTS.LATE_NIGHT.maxRadiusKm, 3.5);
  });

  it("identifies DAY shift between 06:00 and 18:00 IST", () => {
    // 12:00 PM IST is 06:30 UTC
    const noonUtc = new Date("2026-10-27T06:30:00Z");
    const shift = getCurrentEcosystemShift(noonUtc);
    assert.equal(shift.type, "DAY");
    assert.equal(shift.maxRadiusKm, 12.0);

    // 10km is allowed during day (within 12km)
    const check10 = isDistanceAllowedForShift(10.0, noonUtc);
    assert.equal(check10.allowed, true);

    // 13km is blocked during day (> 12km)
    const check13 = isDistanceAllowedForShift(13.0, noonUtc);
    assert.equal(check13.allowed, false);
    assert.equal(check13.blockerCode, "EXCEEDS_MAX_RADIUS");
  });

  it("identifies EVENING shift between 18:00 and 23:00 IST", () => {
    // 20:00 (8:00 PM) IST is 14:30 UTC
    const eveningUtc = new Date("2026-10-27T14:30:00Z");
    const shift = getCurrentEcosystemShift(eveningUtc);
    assert.equal(shift.type, "EVENING");
    assert.equal(shift.maxRadiusKm, 7.5);

    // 6.5km is allowed during evening
    const check65 = isDistanceAllowedForShift(6.5, eveningUtc);
    assert.equal(check65.allowed, true);

    // 8.5km is blocked during evening (> 7.5km)
    const check85 = isDistanceAllowedForShift(8.5, eveningUtc);
    assert.equal(check85.allowed, false);
    assert.equal(check85.blockerCode, "EVENING_DISTANCE_LIMIT");
  });

  it("identifies LATE_NIGHT shift between 23:00 and 06:00 IST (with midnight rollover)", () => {
    // 01:00 AM IST is 19:30 UTC previous day
    const nightUtc = new Date("2026-10-26T19:30:00Z");
    const shift = getCurrentEcosystemShift(nightUtc);
    assert.equal(shift.type, "LATE_NIGHT");
    assert.equal(shift.maxRadiusKm, 3.5);

    // 3.0km is allowed during late night
    const check30 = isDistanceAllowedForShift(3.0, nightUtc);
    assert.equal(check30.allowed, true);

    // 4.5km is blocked during late night curfew (> 3.5km)
    const check45 = isDistanceAllowedForShift(4.5, nightUtc);
    assert.equal(check45.allowed, false);
    assert.equal(check45.blockerCode, "NIGHT_SAFETY_CURFEW");
  });

  it("calculates accurate remaining shift minutes", () => {
    // 17:00 IST (11:30 UTC) -> 60 minutes remaining in Day shift
    const t1700Utc = new Date("2026-10-27T11:30:00Z");
    const mins = getShiftRemainingMinutes(t1700Utc);
    assert.equal(mins, 60);
  });

  it("detects threat zone intersections and curfew exclusion perimeters", () => {
    // Coordinates right inside the NH-8 Unlit Bypass (24.8410, 92.3850)
    const bypassLat = 24.8410;
    const bypassLng = 92.3850;

    // During DAY, NH-8 bypass is NOT enforced as exclusion
    const dayUtc = new Date("2026-10-27T06:30:00Z");
    const dayThreats = checkThreatZoneIntersections(bypassLat, bypassLng, dayUtc);
    assert.equal(dayThreats.some(t => t.id === "threat_nh_bypass_unlit"), false);

    // During EVENING, NH-8 bypass is strictly enforced as an EXCLUSION_CURFEW
    const eveningUtc = new Date("2026-10-27T14:30:00Z");
    const eveningThreats = checkThreatZoneIntersections(bypassLat, bypassLng, eveningUtc);
    assert.equal(eveningThreats.some(t => t.id === "threat_nh_bypass_unlit"), true);

    // Evaluate comprehensive rider safety
    const evalResult = evaluateRiderSafetyZone(bypassLat, bypassLng, 5.0, eveningUtc);
    assert.equal(evalResult.inThreatZone, true);
    assert.equal(evalResult.isCurfewExclusion, true);
    assert.equal(evalResult.orderAllowed, false);
    assert.match(evalResult.rejectionReason!, /safety exclusion zone/);
  });

  it("calculates Haversine distance with high fidelity", () => {
    // Karimganj station to Banga Bazar (~3.5km)
    const dist = calculateHaversineKm(24.8688, 92.3511, 24.8450, 92.3750);
    assert.ok(dist >= 3.0 && dist <= 4.0);
  });
});
