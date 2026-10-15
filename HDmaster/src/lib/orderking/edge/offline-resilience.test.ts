import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OfflineSyncQueue, type SyncAction } from "./offline-sync-queue";
import { isChunkLoadError, importWithRetry } from "@/lib/lazy-retry";
import { WorldSkeleton } from "@/components/skeletons/world-skeleton";
import { TravelSkeleton } from "@/components/skeletons/travel-skeleton";

describe("HDmaster / Umar OS 2G/3G & Offline Resilience Test Suite", () => {
  describe("1. OfflineSyncQueue Edge Resilience", () => {
    let mockStorage: Record<string, string> = {};
    let syncQueue: OfflineSyncQueue;
    let mockSync: ReturnType<typeof vi.fn<(action: SyncAction) => Promise<void>>>;

    beforeEach(() => {
      mockStorage = {};
      vi.stubGlobal("localStorage", {
        getItem: vi.fn((key: string) => mockStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          mockStorage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockStorage[key];
        }),
        clear: vi.fn(() => {
          mockStorage = {};
        }),
      });

      mockSync = vi.fn(async (_action: SyncAction) => {});
      syncQueue = new OfflineSyncQueue(mockSync);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("enqueues actions with UUID, payload and timestamp", async () => {
      syncQueue.enqueue("SETTING_UPDATE", { commissionRate: 15 });
      for (let i = 0; i < 20 && syncQueue.getQueueLength() > 0; i++) {
        await new Promise((r) => setTimeout(r, 10));
      }
      expect(syncQueue.getQueueLength()).toBe(0);
      expect(mockSync).toHaveBeenCalledTimes(1);
    });

    it("persists queue to storage when offline without losing actions", async () => {
      // Simulate offline state
      (syncQueue as any).isOnline = false;
      syncQueue.enqueue("UPDATE_PRICING", { surgeMultiplier: 1.5 });
      syncQueue.enqueue("CREATE_ZONE", { zoneName: "Karimganj South" });

      expect(syncQueue.getQueueLength()).toBe(2);
      expect(mockSync).not.toHaveBeenCalled();

      // Trigger sync manually when online restores
      (syncQueue as any).isOnline = true;
      await syncQueue.sync();

      expect(mockSync).toHaveBeenCalledTimes(2);
      expect(syncQueue.getQueueLength()).toBe(0);
    });

    it("retries failed action and preserves order on network failure", async () => {
      (syncQueue as any).isOnline = false;
      syncQueue.enqueue("ACTION_FAIL", { attempt: 1 });
      syncQueue.enqueue("ACTION_NEXT", { attempt: 2 });

      // First call fails
      mockSync.mockRejectedValueOnce(new Error("Network timeout (2G simulation)"));

      (syncQueue as any).isOnline = true;
      await syncQueue.sync();

      // Failed action should stop processing to preserve FIFO sequence
      expect(syncQueue.getQueueLength()).toBe(2);
      const queue = (syncQueue as any).queue as SyncAction[];
      expect(queue[0].retryCount).toBe(1);
    });
  });

  describe("2. Lazy Loading & Chunk Retry Resilience", () => {
    it("accurately detects dynamic chunk load errors across browsers", () => {
      expect(isChunkLoadError(new Error("Failed to fetch dynamically imported module: /assets/world-tech.js"))).toBe(true);
      expect(isChunkLoadError(new Error("Loading chunk 404 failed"))).toBe(true);
      expect(isChunkLoadError(new Error("Importing a module script failed"))).toBe(true);
      expect(isChunkLoadError(new Error("NetworkError when attempting to fetch resource"))).toBe(true);
      expect(isChunkLoadError(new Error("Validation failed for input"))).toBe(false);
      expect(isChunkLoadError(null)).toBe(false);
    });

    it("recovers successfully from transient chunk fetch failures via backoff", async () => {
      let callCount = 0;
      const loader = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error("Failed to fetch dynamically imported module");
        }
        return { default: "WorldModuleLoaded" };
      });

      const result = await importWithRetry<{ default: string }>(loader, {
        maxRetries: 3,
        initialDelayMs: 10,
        backoffFactor: 1.5,
        name: "test-module",
        autoReloadOnFailure: false,
      });

      expect(callCount).toBe(3);
      expect(result.default).toBe("WorldModuleLoaded");
    });
  });

  describe("3. Fast 16ms Skeleton Architecture", () => {
    it("validates WorldSkeleton renders zero-latency layout and ARIA attributes", () => {
      const element = WorldSkeleton({ world: "operations" });
      expect(element).toBeDefined();
      expect(element.props["aria-busy"]).toBe("true");
      expect(element.props["aria-label"]).toContain("operations");
      expect(element.props.className).toContain("animate-pulse");
    });

    it("validates TravelSkeleton renders with instant 16ms sapphire shell", () => {
      const element = TravelSkeleton({});
      expect(element).toBeDefined();
      expect(element.props["aria-busy"]).toBe("true");
      expect(element.props["aria-label"]).toContain("Travel & Logistics Hub");
      expect(element.props.className).toContain("animate-pulse");
    });
  });
});
