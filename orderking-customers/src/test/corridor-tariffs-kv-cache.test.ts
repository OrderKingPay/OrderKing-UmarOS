import { describe, it, expect, beforeEach } from "vitest";
import {
  TOP_50_DOMESTIC_CORRIDORS,
  computeCorridorTariff,
  getCorridorTariff,
  getAllTopCorridors,
  warmCorridorCache,
  clearInMemoryEdgeCache,
  CACHE_TTL_SECONDS,
  SWR_SECONDS,
  type CloudflareKvNamespace,
  type CloudflareEdgeEnv,
} from "@/lib/travel/corridor-tariffs-cache";

describe("👑 Cloudflare KV Edge Caching for Domestic Corridors (Mandate 183f728c)", () => {
  beforeEach(() => {
    clearInMemoryEdgeCache();
  });
  it("should define exactly 50 unique high-density domestic corridors", () => {
    expect(TOP_50_DOMESTIC_CORRIDORS.length).toBe(50);

    const ids = new Set<string>();
    for (const c of TOP_50_DOMESTIC_CORRIDORS) {
      expect(c.id).toMatch(/^[A-Z]{3}-[A-Z]{3}$/);
      expect(c.origCode).toBe(c.id.split("-")[0]);
      expect(c.destCode).toBe(c.id.split("-")[1]);
      expect(c.distanceKm).toBeGreaterThan(0);
      expect(c.mrpPaise).toBeGreaterThan(0);
      expect(c.tboNetPaise).toBeGreaterThan(0);
      expect(c.carriers.length).toBeGreaterThan(0);
      expect(ids.has(c.id)).toBe(false);
      ids.add(c.id);
    }
  });

  it("should contain flagship corridors: DEL-BOM, CCU-GAU, and BLR-DEL", () => {
    const corridorIds = TOP_50_DOMESTIC_CORRIDORS.map((c) => c.id);
    expect(corridorIds).toContain("DEL-BOM");
    expect(corridorIds).toContain("CCU-GAU");
    expect(corridorIds).toContain("BLR-DEL");
    expect(corridorIds).toContain("BOM-GOI");
    expect(corridorIds).toContain("DEL-GAU");
    expect(corridorIds).toContain("DEL-SXR");
  });

  it("should enforce strict integer paise arithmetic with zero float leaks", () => {
    for (const cfg of TOP_50_DOMESTIC_CORRIDORS) {
      const tariff = computeCorridorTariff(cfg);

      // Integer paise integrity
      expect(Number.isInteger(tariff.sovereign.tboNetRatePaise)).toBe(true);
      expect(Number.isInteger(tariff.sovereign.publishedAirlineMrpPaise)).toBe(true);
      expect(Number.isInteger(tariff.sovereign.convenienceFeePaise)).toBe(true);
      expect(tariff.sovereign.convenienceFeePaise).toBe(0); // Zero fee invariant
      expect(Number.isInteger(tariff.sovereign.customerRebatePaise)).toBe(true);
      expect(Number.isInteger(tariff.sovereign.founderMarginPaise)).toBe(true);
      expect(Number.isInteger(tariff.sovereign.founderNetRetainedPaise)).toBe(true);
      expect(Number.isInteger(tariff.sovereign.effectiveCustomerPricePaise)).toBe(true);
      expect(Number.isInteger(tariff.sovereign.totalSavingsVersusMmtPaise)).toBe(true);

      // Competitors integer paise
      expect(Number.isInteger(tariff.competitors.makeMyTripPaise)).toBe(true);
      expect(Number.isInteger(tariff.competitors.easeMyTripPaise)).toBe(true);
      expect(Number.isInteger(tariff.competitors.cleartripPaise)).toBe(true);
      expect(Number.isInteger(tariff.competitors.competitorAveragePaise)).toBe(true);

      // Business logic assertions
      expect(tariff.sovereign.tboNetRatePaise).toBeLessThan(tariff.sovereign.publishedAirlineMrpPaise);
      expect(tariff.sovereign.founderMarginPaise).toBe(
        tariff.sovereign.publishedAirlineMrpPaise - tariff.sovereign.tboNetRatePaise
      );
      expect(tariff.sovereign.customerRebateBps).toBe(200); // 2%
      expect(tariff.sovereign.customerRebatePaise).toBe(
        Math.round((tariff.sovereign.publishedAirlineMrpPaise * 200) / 10000)
      );
      expect(tariff.sovereign.goldMilligramsEarned).toBeGreaterThan(0);
      expect(tariff.sovereign.totalSavingsVersusMmtPaise).toBeGreaterThan(0);
    }
  });

  it("should serve corridor tariffs under 50ms without hitting origin database", async () => {
    // Warm the cache first
    await warmCorridorCache();

    const start = performance.now();
    const result = await getCorridorTariff("DEL", "BOM");
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(50); // Under 50ms mandate
    expect(result.tariff.corridorId).toBe("DEL-BOM");
    expect(result.tariff.origin.code).toBe("DEL");
    expect(result.tariff.destination.code).toBe("BOM");
    expect(result.tariff.sovereign.tboNetRatePaise).toBe(384900);
    expect(result.tariff.competitors.makeMyTripPaise).toBe(419900 + 44900);
  });

  it("should batch-serve all 50 domestic corridors under 50ms from cache", async () => {
    await warmCorridorCache();

    const start = performance.now();
    const result = await getAllTopCorridors();
    const duration = performance.now() - start;

    expect(result.total).toBe(50);
    expect(result.tariffs.length).toBe(50);
    expect(duration).toBeLessThan(50); // Under 50ms total batch latency
  });

  it("should integrate with Cloudflare KV namespace and obey 15-minute TTL & SWR", async () => {
    const store = new Map<string, string>();
    const mockKv: CloudflareKvNamespace = {
      get: async (key: string, type: "json" | "text") => {
        const val = store.get(key);
        if (!val) return null;
        return type === "json" ? JSON.parse(val) : val;
      },
      put: async (key: string, value: string) => {
        store.set(key, value);
      },
      delete: async (key: string) => {
        store.delete(key);
      },
    };

    const env: CloudflareEdgeEnv = {
      CORRIDOR_TARIFFS_KV: mockKv,
    };

    // 1. Initial lookup -> MISS, populates KV
    const miss = await getCorridorTariff("CCU", "GAU", env);
    expect(miss.tariff.corridorId).toBe("CCU-GAU");
    expect(store.has("tariff:CCU-GAU")).toBe(true);

    // 2. Second lookup -> KV HIT
    const hit = await getCorridorTariff("CCU", "GAU", env);
    expect(hit.cacheStatus).toBe("HIT");
    expect(hit.tariff.cacheMeta.source).toBe("CLOUDFLARE_EDGE_KV");
    expect(hit.tariff.cacheMeta.isStale).toBe(false);

    // 3. Stale window simulation (age = 16 minutes > 900s TTL, but < 24h SWR)
    const stored = JSON.parse(store.get("tariff:CCU-GAU")!);
    stored.cachedAtEpochMs = Date.now() - 16 * 60 * 1000; // 16 min ago
    store.set("tariff:CCU-GAU", JSON.stringify(stored));

    const swr = await getCorridorTariff("CCU", "GAU", env);
    expect(swr.cacheStatus).toBe("STALE");
    expect(swr.tariff.cacheMeta.isStale).toBe(true);
    expect(swr.tariff.corridorId).toBe("CCU-GAU");
  });
});
