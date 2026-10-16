import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_UMAROS_CONFIG,
  STORAGE_KEY,
  CHANNEL_NAME,
  POLL_INTERVAL_MS,
  mergeConfig,
  loadCachedConfig,
  saveCachedConfig,
  fetchUmarOsLiveConfigSnapshot,
  broadcastUmarOsConfigUpdate,
  setSharedSupabaseClient,
  type UmarOsCustomizationConfig,
} from "./supabase-sync-client.ts";

// In-memory mock for localStorage in Node test environment
class MockLocalStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

describe("UMAR OS Supabase Realtime & Polling Fallback Sync Client", () => {
  const originalLocalStorage = globalThis.localStorage;
  const originalFetch = globalThis.fetch;
  let mockStorage: MockLocalStorage;

  beforeEach(() => {
    mockStorage = new MockLocalStorage();
    Object.defineProperty(globalThis, "localStorage", {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
    setSharedSupabaseClient(null);
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
    globalThis.fetch = originalFetch;
    setSharedSupabaseClient(null);
  });

  describe("Constants & Baseline Validation", () => {
    it("exports correct Realtime channel name and 10s fallback interval", () => {
      assert.strictEqual(CHANNEL_NAME, "umaros-config");
      assert.strictEqual(POLL_INTERVAL_MS, 10000);
      assert.strictEqual(STORAGE_KEY, "orderking_umaros_live_config_v1");
    });

    it("provides production defaults for India ecosystem", () => {
      assert.strictEqual(DEFAULT_UMAROS_CONFIG.brand.appName, "OrderKing");
      assert.strictEqual(DEFAULT_UMAROS_CONFIG.economics.platformFeePaise, 600); // ₹6
      assert.strictEqual(DEFAULT_UMAROS_CONFIG.economics.smallCartThresholdPaise, 14900); // ₹149
      assert.strictEqual(DEFAULT_UMAROS_CONFIG.features.vipGoldPassEnabled, true);
      assert.strictEqual(DEFAULT_UMAROS_CONFIG.features.diningOutEnabled, true);
    });
  });

  describe("mergeConfig()", () => {
    it("returns base config if patch is null or undefined", () => {
      const merged = mergeConfig(DEFAULT_UMAROS_CONFIG, null);
      assert.deepStrictEqual(merged, DEFAULT_UMAROS_CONFIG);

      const mergedUndefined = mergeConfig(DEFAULT_UMAROS_CONFIG, undefined);
      assert.deepStrictEqual(mergedUndefined, DEFAULT_UMAROS_CONFIG);
    });

    it("merges partial brand updates while preserving unchanged brand fields", () => {
      const patch: Partial<UmarOsCustomizationConfig> = {
        version: 5,
        brand: {
          appName: "OrderKing Express",
          primaryColor: "#FF0055",
          accentColor: "#00E599",
          logoUrl: "/logo-express.png",
          supportPhone: "+919999999999",
          supportWhatsApp: "+919999999999",
        },
      };

      const merged = mergeConfig(DEFAULT_UMAROS_CONFIG, patch);
      assert.strictEqual(merged.version, 5);
      assert.strictEqual(merged.brand.appName, "OrderKing Express");
      assert.strictEqual(merged.brand.primaryColor, "#FF0055");
      // Economics and features are preserved from base
      assert.strictEqual(merged.economics.platformFeePaise, 600);
      assert.strictEqual(merged.features.vipGoldPassEnabled, true);
    });

    it("merges dynamic monsoon surge and economic overrides", () => {
      const patch: Partial<UmarOsCustomizationConfig> = {
        economics: {
          ...DEFAULT_UMAROS_CONFIG.economics,
          platformFeePaise: 1000, // ₹10
          monsoonAlertActive: true,
          monsoonBannerText: "Heavy Mumbai monsoon rains active. Safe delivery in progress.",
          surgeMultiplier: 1.5,
        },
      };

      const merged = mergeConfig(DEFAULT_UMAROS_CONFIG, patch);
      assert.strictEqual(merged.economics.platformFeePaise, 1000);
      assert.strictEqual(merged.economics.monsoonAlertActive, true);
      assert.strictEqual(merged.economics.surgeMultiplier, 1.5);
      assert.strictEqual(merged.brand.appName, "OrderKing");
    });

    it("supports hybrid SDUI designTokens palette mapping to brand colors", () => {
      const sduiPatch = {
        version: 3,
        designTokens: {
          palette: {
            primary: "#123456",
            accent: "#654321",
          },
        },
      };

      const merged = mergeConfig(DEFAULT_UMAROS_CONFIG, sduiPatch as any);
      assert.strictEqual(merged.version, 3);
      assert.strictEqual(merged.brand.primaryColor, "#123456");
      assert.strictEqual(merged.brand.accentColor, "#654321");
    });
  });

  describe("loadCachedConfig() & saveCachedConfig()", () => {
    it("returns DEFAULT_UMAROS_CONFIG when cache is empty", () => {
      const config = loadCachedConfig();
      assert.deepStrictEqual(config, DEFAULT_UMAROS_CONFIG);
    });

    it("persists and reloads config via localStorage", () => {
      const modified: UmarOsCustomizationConfig = {
        ...DEFAULT_UMAROS_CONFIG,
        version: 42,
        brand: {
          ...DEFAULT_UMAROS_CONFIG.brand,
          appName: "OrderKing Bangalore",
          primaryColor: "#059669",
        },
      };

      saveCachedConfig(modified);
      const reloaded = loadCachedConfig();

      assert.strictEqual(reloaded.version, 42);
      assert.strictEqual(reloaded.brand.appName, "OrderKing Bangalore");
      assert.strictEqual(reloaded.brand.primaryColor, "#059669");
    });

    it("recovers gracefully from malformed JSON in localStorage", () => {
      mockStorage.setItem(STORAGE_KEY, "INVALID_NON_JSON_DATA{{{");
      const fallback = loadCachedConfig();
      assert.deepStrictEqual(fallback, DEFAULT_UMAROS_CONFIG);
    });
  });

  describe("Fallback HTTP Polling & Snapshot Hydration", () => {
    it("fetches snapshot from /api/sync/customizations/latest and merges correctly", async () => {
      const serverPayload = {
        success: true,
        version: 9,
        config: {
          version: 9,
          updatedAt: new Date().toISOString(),
          brand: {
            primaryColor: "#9333EA",
          },
          economics: {
            monsoonAlertActive: true,
            monsoonBannerText: "Delhi NCR rain alert.",
          },
        },
      };

      globalThis.fetch = (async (url: string | URL | Request) => {
        assert.ok(String(url).includes("/api/sync/customizations/latest"));
        return {
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => serverPayload,
        } as unknown as Response;
      }) as typeof fetch;

      const snapshot = await fetchUmarOsLiveConfigSnapshot();
      assert.ok(snapshot !== null);
      assert.strictEqual(snapshot.version, 9);
      assert.strictEqual(snapshot.brand.primaryColor, "#9333EA");
      assert.strictEqual(snapshot.economics.monsoonAlertActive, true);
      assert.strictEqual(snapshot.economics.monsoonBannerText, "Delhi NCR rain alert.");
      assert.strictEqual(snapshot.features.vipGoldPassEnabled, true);
    });

    it("handles non-200 HTTP responses gracefully returning null", async () => {
      globalThis.fetch = (async () => {
        return {
          ok: false,
          status: 503,
          headers: new Headers(),
          json: async () => ({ error: "Service Unavailable" }),
        } as unknown as Response;
      }) as typeof fetch;

      const snapshot = await fetchUmarOsLiveConfigSnapshot();
      assert.strictEqual(snapshot, null);
    });

    it("handles network failure or fetch exceptions cleanly", async () => {
      globalThis.fetch = (async () => {
        throw new Error("Network connection dropped");
      }) as typeof fetch;

      const snapshot = await fetchUmarOsLiveConfigSnapshot();
      assert.strictEqual(snapshot, null);
    });
  });

  describe("broadcastUmarOsConfigUpdate()", () => {
    it("persists to HTTP endpoint when Supabase client is not configured", async () => {
      let postedBody: any = null;

      globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
        assert.ok(String(url).includes("/api/sync/customizations/latest"));
        assert.strictEqual(init?.method, "POST");
        postedBody = JSON.parse(String(init?.body));
        return {
          ok: true,
          status: 200,
        } as unknown as Response;
      }) as typeof fetch;

      const updatePayload: Partial<UmarOsCustomizationConfig> = {
        version: 12,
        brand: {
          ...DEFAULT_UMAROS_CONFIG.brand,
          primaryColor: "#DC2626",
        },
      };

      const result = await broadcastUmarOsConfigUpdate(updatePayload);
      assert.strictEqual(result.broadcasted, false); // Supabase offline
      assert.strictEqual(result.persisted, true); // Edge API persisted
      assert.strictEqual(postedBody.version, 12);
      assert.strictEqual(postedBody.brand.primaryColor, "#DC2626");
    });

    it("broadcasts via Supabase Realtime channel when client is connected", async () => {
      let broadcastSent = false;
      let channelRemoved = false;

      const mockChannel = {
        subscribe: (cb: (status: string) => void) => {
          setTimeout(() => cb("SUBSCRIBED"), 10);
          return mockChannel;
        },
        send: async (msg: { type: string; event: string; payload: any }) => {
          if (msg.type === "broadcast" && msg.event === "CONFIG_UPDATED") {
            broadcastSent = true;
          }
          return "ok";
        },
      };

      const mockSupabase = {
        channel: (name: string) => {
          assert.strictEqual(name, CHANNEL_NAME);
          return mockChannel;
        },
        removeChannel: async () => {
          channelRemoved = true;
        },
      } as any;

      setSharedSupabaseClient(mockSupabase);

      globalThis.fetch = (async () => ({
        ok: true,
        status: 200,
      })) as any;

      const result = await broadcastUmarOsConfigUpdate({ version: 99 });
      assert.strictEqual(result.broadcasted, true);
      assert.strictEqual(result.persisted, true);
      assert.strictEqual(broadcastSent, true);
      assert.strictEqual(channelRemoved, true);
    });
  });
});
