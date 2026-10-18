import { describe, it, expect, vi } from "vitest";
import {
  calcBearing,
  haversineDistanceMeters,
  matchNearestRidersFallback,
  matchNearestRiders,
  POSTGIS_MATCH_NEAREST_RIDERS_SQL,
  type CandidateRiderSpatial,
} from "../lib/spatial-tracking.ts";
import {
  DeadLetterQueueManager,
  calculateDlqBackoff,
} from "../lib/realtime/dlq.ts";

describe("Live Telematics: Geodesic Bearing & Spatial PostGIS Queries", () => {
  describe("calcBearing (Great Circle Forward Azimuth)", () => {
    it("calculates cardinal bearings accurately", () => {
      // Due North: from equator to north pole (or (0,0) to (1,0)) -> 0°
      const north = calcBearing({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
      expect(north).toBeCloseTo(0, 1);

      // Due East: (0,0) to (0,1) -> 90°
      const east = calcBearing({ lat: 0, lng: 0 }, { lat: 0, lng: 1 });
      expect(east).toBeCloseTo(90, 1);

      // Due South: (1,0) to (0,0) -> 180°
      const south = calcBearing({ lat: 1, lng: 0 }, { lat: 0, lng: 0 });
      expect(south).toBeCloseTo(180, 1);

      // Due West: (0,1) to (0,0) -> 270°
      const west = calcBearing({ lat: 0, lng: 0 }, { lat: 0, lng: -1 });
      expect(west).toBeCloseTo(270, 1);
    });

    it("supports four-number parameter overload signature", () => {
      const bearing = calcBearing(0, 0, 10, 10);
      expect(bearing).toBeGreaterThan(0);
      expect(bearing).toBeLessThan(90);
    });

    it("supports alternative coordinate property names (latitude/longitude)", () => {
      const bearing = calcBearing(
        { latitude: 24.8688, longitude: 92.3511 },
        { latitude: 24.8700, longitude: 92.3550 }
      );
      expect(bearing).toBeGreaterThan(0);
      expect(bearing).toBeLessThan(360);
    });

    it("returns 0 for identical start and destination coordinates", () => {
      const bearing = calcBearing({ lat: 24.8688, lng: 92.3511 }, { lat: 24.8688, lng: 92.3511 });
      expect(bearing).toBe(0);
    });
  });

  describe("haversineDistanceMeters", () => {
    it("calculates accurate spherical distances in meters", () => {
      // Known distance between Karimganj and nearby landmark
      const p1 = { lat: 24.8688, lng: 92.3511 };
      const p2 = { lat: 24.8788, lng: 92.3511 }; // ~1.11 km due north
      const dist = haversineDistanceMeters(p1, p2);
      expect(dist).toBeGreaterThan(1000);
      expect(dist).toBeLessThan(1200);
    });
  });

  describe("matchNearestRidersFallback (ST_DWithin & ST_Distance)", () => {
    const pickup = { lat: 24.8688, lng: 92.3511 };

    const candidates: CandidateRiderSpatial[] = [
      {
        riderId: "rider-close",
        userId: "user-1",
        lat: 24.8700,
        lng: 92.3520, // ~160m away
        status: "ONLINE",
        kycStatus: "VERIFIED",
      },
      {
        riderId: "rider-mid",
        userId: "user-2",
        lat: 24.8850,
        lng: 92.3600, // ~2km away
        status: "ONLINE",
        kycStatus: "VERIFIED",
      },
      {
        riderId: "rider-far",
        userId: "user-3",
        lat: 24.9900,
        lng: 92.4500, // ~16km away (out of 5km radius)
        status: "ONLINE",
        kycStatus: "VERIFIED",
      },
      {
        riderId: "rider-offline",
        userId: "user-4",
        lat: 24.8700,
        lng: 92.3520,
        status: "OFFLINE",
        kycStatus: "VERIFIED",
      },
      {
        riderId: "rider-unverified",
        userId: "user-5",
        lat: 24.8700,
        lng: 92.3520,
        status: "ONLINE",
        kycStatus: "PENDING",
      },
    ];

    it("filters candidates within maxRadiusMeters (ST_DWithin)", () => {
      const matches = matchNearestRidersFallback(pickup, candidates, 5000);
      const riderIds = matches.map((m) => m.riderId);
      expect(riderIds).toContain("rider-close");
      expect(riderIds).toContain("rider-mid");
      expect(riderIds).not.toContain("rider-far");
      expect(riderIds).not.toContain("rider-offline");
      expect(riderIds).not.toContain("rider-unverified");
    });

    it("sorts matches ascending by distance (ST_Distance)", () => {
      const matches = matchNearestRidersFallback(pickup, candidates, 5000);
      expect(matches.length).toBe(2);
      expect(matches[0].riderId).toBe("rider-close");
      expect(matches[1].riderId).toBe("rider-mid");
      expect(matches[0].distanceMeters).toBeLessThan(matches[1].distanceMeters);
      expect(matches[0].bearingToPickup).toBeGreaterThanOrEqual(0);
    });

    it("respects maxLimit constraint", () => {
      const matches = matchNearestRidersFallback(pickup, candidates, 5000, 1);
      expect(matches.length).toBe(1);
      expect(matches[0].riderId).toBe("rider-close");
    });
  });

  describe("matchNearestRiders with database query & fallback", () => {
    it("calls dbQueryFn with match_nearest_riders SQL when available", async () => {
      const mockQuery = vi.fn().mockResolvedValue([
        {
          rider_id: "r-mock-1",
          user_id: "u-mock-1",
          distance_meters: 450,
          lat: 24.8700,
          lng: 92.3520,
          status: "ONLINE",
          kyc_status: "VERIFIED",
        },
      ]);

      const results = await matchNearestRiders(
        { lat: 24.8688, lng: 92.3511 },
        { dbQueryFn: mockQuery }
      );

      expect(mockQuery).toHaveBeenCalledOnce();
      expect(results.length).toBe(1);
      expect(results[0].riderId).toBe("r-mock-1");
      expect(results[0].distanceMeters).toBe(450);
    });

    it("falls back cleanly to TypeScript spatial algorithm on db error", async () => {
      const failingQuery = vi.fn().mockRejectedValue(new Error("Connection refused"));

      const fallbackCandidates: CandidateRiderSpatial[] = [
        {
          riderId: "rider-fallback",
          userId: "user-fb",
          lat: 24.8700,
          lng: 92.3520,
          status: "ONLINE",
          kycStatus: "VERIFIED",
        },
      ];

      const results = await matchNearestRiders(
        { lat: 24.8688, lng: 92.3511 },
        { dbQueryFn: failingQuery, fallbackCandidates }
      );

      expect(results.length).toBe(1);
      expect(results[0].riderId).toBe("rider-fallback");
    });

    it("verifies POSTGIS_MATCH_NEAREST_RIDERS_SQL contains ST_DWithin and ST_Distance", () => {
      expect(POSTGIS_MATCH_NEAREST_RIDERS_SQL).toContain("ST_DWithin");
      expect(POSTGIS_MATCH_NEAREST_RIDERS_SQL).toContain("ST_Distance");
      expect(POSTGIS_MATCH_NEAREST_RIDERS_SQL).toContain("match_nearest_riders");
    });
  });

  describe("DeadLetterQueueManager: Exponential Backoff & Durability", () => {
    it("computes exponential backoff with jitter correctly", () => {
      const delay0 = calculateDlqBackoff(0, { baseDelayMs: 1000, jitterFactor: 0 });
      const delay1 = calculateDlqBackoff(1, { baseDelayMs: 1000, jitterFactor: 0 });
      const delay2 = calculateDlqBackoff(2, { baseDelayMs: 1000, jitterFactor: 0 });

      expect(delay0).toBe(1000);
      expect(delay1).toBe(2000);
      expect(delay2).toBe(4000);
    });

    it("enqueues failed events and transitions them through retries to resolution", async () => {
      const dlq = new DeadLetterQueueManager<{ orderId: string }>("dispatch_dlq", {
        baseDelayMs: 50,
        maxRetries: 3,
        jitterFactor: 0,
      });

      const entry = dlq.enqueue({ orderId: "ord-test-1" }, "Simulated timeout");
      expect(entry.status).toBe("PENDING");
      expect(entry.retryCount).toBe(0);

      // Successfully process retry
      const result = await dlq.processRetries(async () => true);
      expect(result.resolved).toBe(1);
      expect(dlq.getStats().total).toBe(0);
    });

    it("transitions entry to FAILED when maxRetries is exhausted", async () => {
      const dlq = new DeadLetterQueueManager<{ orderId: string }>("test_dlq", {
        baseDelayMs: 10,
        maxRetries: 2,
        jitterFactor: 0,
      });

      const entry = dlq.enqueue({ orderId: "ord-fail-1" }, "Fatal network issue");

      // Attempt 1: fails, schedules retry
      await dlq.processRetries(async () => false, Date.now());
      expect(entry.status).toBe("RETRYING");
      expect(entry.retryCount).toBe(1);

      // Fast forward past nextRetryAt and attempt 2: fails, reaches maxRetries (2) -> FAILED
      await dlq.processRetries(async () => false, entry.nextRetryAt + 100);
      expect(entry.status).toBe("FAILED");
      expect(entry.retryCount).toBe(2);
      expect(dlq.getStats().failed).toBe(1);
    });
  });
});
