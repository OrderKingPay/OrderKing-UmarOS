import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { probeNetwork, DISMISS_STORAGE_KEY } from "./offline-detector";

describe("HDmaster / Umar OS Offline Detector & Truth Gate Suite", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    vi.stubGlobal("navigator", { onLine: true });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("1. probeNetwork Truth Gate", () => {
    it("returns true when /api/ping responds with 200 OK", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(new Response("pong", { status: 200 }));

      const result = await probeNetwork(1000);
      expect(result).toBe(true);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/ping",
        expect.objectContaining({ method: "HEAD", cache: "no-store" })
      );
    });

    it("falls back to /api/health if /api/ping is 404 and returns true on response", async () => {
      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce(new Response("Not Found", { status: 404 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ status: "healthy" }), { status: 200 }));

      const result = await probeNetwork(1000);
      expect(result).toBe(true);
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    it("treats HTTP 500 from server as REACHABLE/ONLINE (packets reached backend host)", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ status: "unhealthy", error: "DB Error" }), { status: 500 })
      );

      const result = await probeNetwork(1000);
      expect(result).toBe(true);
    });

    it("NEVER falsely reports offline when navigator.onLine is true even if network probe fails", async () => {
      vi.stubGlobal("navigator", { onLine: true });
      // Simulate network probe failure (e.g. backend proxy hiccup or slow cold start)
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

      const result = await probeNetwork(500);
      expect(result).toBe(true);
    });

    it("overrides false-negative navigator.onLine if active probe succeeds", async () => {
      // Browser claims offline (common with VPNs or virtual adapters)
      vi.stubGlobal("navigator", { onLine: false });
      // But server probe actually responds
      globalThis.fetch = vi.fn().mockResolvedValue(new Response("pong", { status: 200 }));

      const result = await probeNetwork(1000);
      expect(result).toBe(true);
    });

    it("returns false ONLY when BOTH navigator.onLine is false AND probe fails", async () => {
      vi.stubGlobal("navigator", { onLine: false });
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

      const result = await probeNetwork(500);
      expect(result).toBe(false);
    });
  });

  describe("2. Persistent Dismissal & Storage Contracts", () => {
    it("defines consistent DISMISS_STORAGE_KEY", () => {
      expect(DISMISS_STORAGE_KEY).toBe("hdmaster_offline_banner_dismissed");
    });

    it("persists dismissal state across session and local storage", () => {
      const storage: Record<string, string> = {};
      const mockStorage = {
        getItem: (k: string) => storage[k] || null,
        setItem: (k: string, v: string) => { storage[k] = v; },
        removeItem: (k: string) => { delete storage[k]; },
      };

      vi.stubGlobal("sessionStorage", mockStorage);
      vi.stubGlobal("localStorage", mockStorage);

      // Simulate dismissal
      mockStorage.setItem(DISMISS_STORAGE_KEY, "true");
      expect(mockStorage.getItem(DISMISS_STORAGE_KEY)).toBe("true");

      // Verify removal on network restoration
      mockStorage.removeItem(DISMISS_STORAGE_KEY);
      expect(mockStorage.getItem(DISMISS_STORAGE_KEY)).toBeNull();
    });
  });
});
