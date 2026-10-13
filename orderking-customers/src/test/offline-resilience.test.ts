import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  NetworkMonitor,
  OfflineResilienceEngine,
  DuplicateMutationError,
  calculateBackoffWithJitter,
  type NetworkStatus,
  type QueuedMutation,
} from "../lib/network/offline-resilience.ts";

describe("OrderKing Offline Resilience & Network Adaptability Engine", () => {
  // Mock window event target for clean isolation
  class MockWindowTarget {
    private listeners: Record<string, Array<(e: any) => void>> = {};

    addEventListener(event: string, fn: (e: any) => void) {
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }
      this.listeners[event].push(fn);
    }

    removeEventListener(event: string, fn: (e: any) => void) {
      if (this.listeners[event]) {
        this.listeners[event] = this.listeners[event].filter((f) => f !== fn);
      }
    }

    dispatchEvent(type: string) {
      const fns = this.listeners[type] || [];
      for (const fn of fns) {
        fn({ type });
      }
    }
  }

  describe("1. Online/offline event handling", () => {
    let mockWin: MockWindowTarget;
    let monitor: NetworkMonitor;

    beforeEach(() => {
      mockWin = new MockWindowTarget();
      monitor = new NetworkMonitor({
        targetWindow: mockWin as unknown as Window,
        initialOnline: true,
        initialEffectiveType: "4g",
      });
    });

    afterEach(() => {
      monitor.destroy();
    });

    it("should initialize with correct online status", () => {
      expect(monitor.isOnline()).toBe(true);
      const status = monitor.getStatus();
      expect(status.isOnline).toBe(true);
      expect(status.effectiveType).toBe("4g");
    });

    it("should update online status when window offline and online events fire", () => {
      const statusUpdates: NetworkStatus[] = [];
      monitor.subscribe((status) => {
        statusUpdates.push(status);
      });

      // Dispatch 'offline'
      mockWin.dispatchEvent("offline");
      expect(monitor.isOnline()).toBe(false);
      expect(monitor.getStatus().isOnline).toBe(false);

      // Dispatch 'online'
      mockWin.dispatchEvent("online");
      expect(monitor.isOnline()).toBe(true);
      expect(monitor.getStatus().isOnline).toBe(true);

      expect(statusUpdates).toHaveLength(2);
      expect(statusUpdates[0].isOnline).toBe(false);
      expect(statusUpdates[1].isOnline).toBe(true);
    });

    it("should allow programmatic setOnline changes and notify subscribers", () => {
      let latestStatus: NetworkStatus = monitor.getStatus();
      const unsubscribe = monitor.subscribe((status) => {
        latestStatus = status;
      });

      monitor.setOnline(false);
      expect(monitor.isOnline()).toBe(false);
      expect(latestStatus.isOnline).toBe(false);

      monitor.setOnline(true);
      expect(monitor.isOnline()).toBe(true);
      expect(latestStatus.isOnline).toBe(true);

      unsubscribe();
      monitor.setOnline(false);
      // latestStatus should not change after unsubscribe
      expect(latestStatus.isOnline).toBe(true);
    });

    it("should perform latency ping and record measured latencyMs", async () => {
      const pingMonitor = new NetworkMonitor({
        customPingFn: async () => 42,
        initialOnline: false,
      });

      const latency = await pingMonitor.ping();
      expect(latency).toBe(42);
      expect(pingMonitor.isOnline()).toBe(true);
      expect(pingMonitor.getStatus().latencyMs).toBe(42);
      pingMonitor.destroy();
    });

    it("should handle ping failure gracefully and set latency to null", async () => {
      const pingMonitor = new NetworkMonitor({
        customPingFn: async () => {
          throw new Error("Network unreachable");
        },
        initialOnline: true,
      });

      const latency = await pingMonitor.ping();
      expect(latency).toBeNull();
      expect(pingMonitor.isOnline()).toBe(false);
      expect(pingMonitor.getStatus().latencyMs).toBe(null);
      pingMonitor.destroy();
    });
  });

  describe("2. Enqueuing mutations and preserving idempotency keys", () => {
    let engine: OfflineResilienceEngine;
    let monitor: NetworkMonitor;

    beforeEach(() => {
      monitor = new NetworkMonitor({ initialOnline: false });
      engine = new OfflineResilienceEngine({
        monitor,
        defaultMaxRetries: 4,
      });
    });

    afterEach(() => {
      engine.destroy();
    });

    it("should enqueue a mutation and preserve the exact idempotencyKey", () => {
      const testKey = "idemp_order_create_778899";
      const mutation = engine.enqueue({
        idempotencyKey: testKey,
        endpoint: "/api/orders/place",
        payload: {
          items: [{ dishId: "dish_biryani_01", quantity: 2, priceRupees: 250 }],
          deliveryAddress: "HSR Layout, Bengaluru",
        },
        method: "POST",
        headers: { "X-Client-App": "OrderKing-Customer-Web" },
      });

      expect(mutation.idempotencyKey).toBe(testKey);
      expect(mutation.endpoint).toBe("/api/orders/place");
      expect(mutation.method).toBe("POST");
      expect(mutation.retryCount).toBe(0);
      expect(mutation.maxRetries).toBe(4);
      expect(mutation.status).toBe("pending");
      expect(mutation.headers["X-Client-App"]).toBe("OrderKing-Customer-Web");

      // Verify mutation is safely preserved in queuedMutations
      expect(engine.queuedMutations).toHaveLength(1);
      expect(engine.queuedMutations[0].idempotencyKey).toBe(testKey);
      expect(engine.hasMutation(testKey)).toBe(true);
      expect(engine.getMutation(testKey)?.id).toBe(mutation.id);
    });

    it("should preserve multiple distinct mutations in FIFO queue order", () => {
      const key1 = "idemp_item_add_1";
      const key2 = "idemp_item_add_2";
      const key3 = "idemp_item_add_3";

      engine.enqueue({ idempotencyKey: key1, endpoint: "/api/cart/add", payload: { item: 1 } });
      engine.enqueue({ idempotencyKey: key2, endpoint: "/api/cart/add", payload: { item: 2 } });
      engine.enqueue({ idempotencyKey: key3, endpoint: "/api/cart/add", payload: { item: 3 } });

      const queued = engine.queuedMutations;
      expect(queued).toHaveLength(3);
      expect(queued[0].idempotencyKey).toBe(key1);
      expect(queued[1].idempotencyKey).toBe(key2);
      expect(queued[2].idempotencyKey).toBe(key3);
    });
  });

  describe("3. Safe replay of queued mutations with retry backoff", () => {
    it("should not execute pending mutations when offline", async () => {
      const mockExecutor = vi.fn().mockResolvedValue({ success: true });
      const monitor = new NetworkMonitor({ initialOnline: false });
      const engine = new OfflineResilienceEngine({
        monitor,
        executor: mockExecutor,
      });

      engine.enqueue({
        idempotencyKey: "idemp_offline_skip",
        endpoint: "/api/rider/location",
        payload: { lat: 12.9716, lng: 77.5946 },
      });

      const replayResult = await engine.replayQueue();
      expect(replayResult.skipped).toBe(true);
      expect(replayResult.processed).toBe(0);
      expect(mockExecutor).not.toHaveBeenCalled();

      const mutation = engine.getMutation("idemp_offline_skip");
      expect(mutation?.status).toBe("pending");
      expect(mutation?.retryCount).toBe(0);

      engine.destroy();
    });

    it("should replay mutations when online and calculate exponential backoff with jitter on failure", async () => {
      let attempts = 0;
      const mockExecutor = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts === 1) {
          throw new Error("503 Service Unavailable");
        }
        return { orderId: "ord_success_999", status: "CONFIRMED" };
      });

      const monitor = new NetworkMonitor({ initialOnline: true });
      const engine = new OfflineResilienceEngine({
        monitor,
        executor: mockExecutor,
        baseDelayMs: 200,
        maxDelayMs: 5000,
        jitterFactor: 0.1,
        defaultMaxRetries: 3,
        randomFn: () => 0.5, // Deterministic jitter for testing
      });

      const key = "idemp_retry_backoff_test";
      engine.enqueue({
        idempotencyKey: key,
        endpoint: "/api/orders/confirm",
        payload: { orderId: "ord_draft_101" },
      });

      // First replay: attempts execution, fails with 503, enters retry backoff
      const firstReplay = await engine.replayQueue();
      expect(firstReplay.processed).toBe(1);
      expect(firstReplay.succeeded).toBe(0);

      const failedOnceMutation = engine.getMutation(key);
      expect(failedOnceMutation?.retryCount).toBe(1);
      expect(failedOnceMutation?.status).toBe("pending"); // Ready for retry
      expect(failedOnceMutation?.error).toBe("503 Service Unavailable");
      expect(typeof failedOnceMutation?.nextRetryAt).toBe("number");

      // Verify backoff calculation logic:
      // retryCount = 1, baseDelay = 200 * 2^0 = 200. jitter = 0.5 * 0.1 * 200 = 10 -> total 210ms
      const expectedBackoff = calculateBackoffWithJitter(1, 200, 5000, 0.1, () => 0.5);
      expect(expectedBackoff).toBe(210);

      // Second replay: attempts again and succeeds
      const secondReplay = await engine.replayQueue();
      expect(secondReplay.processed).toBe(1);
      expect(secondReplay.succeeded).toBe(1);

      const completedMutation = engine.getMutation(key);
      expect(completedMutation?.status).toBe("completed");
      expect(completedMutation?.response).toEqual({
        orderId: "ord_success_999",
        status: "CONFIRMED",
      });
      expect(completedMutation?.error).toBeNull();

      engine.destroy();
    });

    it("should mark mutation as failed when maxRetries is exceeded", async () => {
      const mockExecutor = vi.fn().mockRejectedValue(new Error("Persistent 500 Internal Error"));
      const monitor = new NetworkMonitor({ initialOnline: true });
      const engine = new OfflineResilienceEngine({
        monitor,
        executor: mockExecutor,
        defaultMaxRetries: 2,
      });

      const key = "idemp_fail_test";
      engine.enqueue({
        idempotencyKey: key,
        endpoint: "/api/payment/verify",
        payload: { paymentId: "pay_test_01" },
        maxRetries: 2,
      });

      // Attempt 1 -> retryCount = 1, status = pending
      await engine.replayQueue();
      expect(engine.getMutation(key)?.retryCount).toBe(1);
      expect(engine.getMutation(key)?.status).toBe("pending");

      // Attempt 2 -> retryCount = 2 (reaches maxRetries: 2) -> status = failed
      const result = await engine.replayQueue();
      expect(result.failed).toBe(1);
      expect(engine.getMutation(key)?.retryCount).toBe(2);
      expect(engine.getMutation(key)?.status).toBe("failed");
      expect(engine.getMutation(key)?.error).toBe("Persistent 500 Internal Error");

      engine.destroy();
    });

    it("should automatically trigger replayQueue when connectivity is restored", async () => {
      const mockExecutor = vi.fn().mockResolvedValue({ ok: true });
      const monitor = new NetworkMonitor({ initialOnline: false });
      const engine = new OfflineResilienceEngine({
        monitor,
        executor: mockExecutor,
        autoReplayOnOnline: true,
      });

      engine.enqueue({
        idempotencyKey: "idemp_auto_replay",
        endpoint: "/api/telemetry/heartbeat",
        payload: { deviceId: "rider_device_42" },
      });

      expect(mockExecutor).not.toHaveBeenCalled();

      // Trigger online transition
      monitor.setOnline(true);

      // Allow async auto-replay promise resolution
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockExecutor).toHaveBeenCalledTimes(1);
      expect(engine.getMutation("idemp_auto_replay")?.status).toBe("completed");

      engine.destroy();
    });
  });

  describe("4. Rejection of duplicate mutations", () => {
    let engine: OfflineResilienceEngine;

    beforeEach(() => {
      engine = new OfflineResilienceEngine({
        monitor: new NetworkMonitor({ initialOnline: false }),
      });
    });

    afterEach(() => {
      engine.destroy();
    });

    it("should reject enqueuing a mutation with an existing idempotencyKey", () => {
      const duplicateKey = "idemp_checkout_cart_88";

      // First enqueue must succeed
      const firstMutation = engine.enqueue({
        idempotencyKey: duplicateKey,
        endpoint: "/api/checkout",
        payload: { totalPaise: 49900 },
      });
      expect(firstMutation.idempotencyKey).toBe(duplicateKey);

      // Duplicate enqueue with same key must throw DuplicateMutationError
      expect(() => {
        engine.enqueue({
          idempotencyKey: duplicateKey,
          endpoint: "/api/checkout",
          payload: { totalPaise: 59900 }, // different payload still rejected
        });
      }).toThrow(DuplicateMutationError);

      // Verify queue length remains 1
      expect(engine.queuedMutations).toHaveLength(1);
      expect(engine.queuedMutations[0].payload).toEqual({ totalPaise: 49900 });
    });

    it("should throw a descriptive error when idempotencyKey is invalid or empty", () => {
      expect(() => {
        engine.enqueue({
          idempotencyKey: "",
          endpoint: "/api/test",
          payload: {},
        });
      }).toThrow(/non-empty string idempotencyKey/);
    });
  });

  describe("5. Data-saver activation on 2G network simulation", () => {
    let monitor: NetworkMonitor;
    let engine: OfflineResilienceEngine;

    beforeEach(() => {
      monitor = new NetworkMonitor({
        initialOnline: true,
        initialEffectiveType: "4g",
        initialSaveData: false,
      });
      engine = new OfflineResilienceEngine({ monitor });
    });

    afterEach(() => {
      engine.destroy();
    });

    it("should have data-saver inactive on 4G networks by default", () => {
      monitor.setEffectiveType("4g");
      expect(engine.isDataSaverActive()).toBe(false);

      const delivery = engine.getImageDeliveryOptions(
        "https://orderking.in/images/dishes/butter_chicken.jpg",
        { width: 800, quality: 90 }
      );

      expect(delivery.isDownsampled).toBe(false);
      expect(delivery.isLowResPlaceholder).toBe(false);
      expect(delivery.quality).toBe(90);
      expect(delivery.width).toBe(800);
      expect(delivery.fetchPriority).toBe("auto");
      expect(delivery.optimizedUrl).not.toContain("lowres=1");
    });

    it("should activate data-saver mode on 2G network simulation", () => {
      // Simulate switching to 2G connection
      monitor.setEffectiveType("2g");
      expect(engine.isDataSaverActive()).toBe(true);

      const delivery = engine.getImageDeliveryOptions(
        "https://orderking.in/images/dishes/butter_chicken.jpg",
        { width: 800, lowResQuality: 25 }
      );

      expect(delivery.isDownsampled).toBe(true);
      expect(delivery.isLowResPlaceholder).toBe(true);
      expect(delivery.quality).toBe(25);
      expect(delivery.width).toBe(400); // 50% width downsampled
      expect(delivery.fetchPriority).toBe("low");
      expect(delivery.optimizedUrl).toContain("q=25");
      expect(delivery.optimizedUrl).toContain("lowres=1");
      expect(delivery.optimizedUrl).toContain("w=400");
    });

    it("should activate data-saver mode on slow-2g network simulation", () => {
      monitor.setEffectiveType("slow-2g");
      expect(engine.isDataSaverActive()).toBe(true);

      const delivery = engine.getImageDeliveryOptions("/assets/hero_banner.png");
      expect(delivery.isDownsampled).toBe(true);
      expect(delivery.isLowResPlaceholder).toBe(true);
      expect(delivery.quality).toBe(30); // default low-res quality
      expect(delivery.optimizedUrl).toContain("lowres=1");
    });

    it("should activate data-saver mode if client has saveData flag enabled", () => {
      monitor.setEffectiveType("4g"); // Even on 4G
      monitor.setSaveData(true); // User turned on data saver in mobile browser settings

      expect(engine.isDataSaverActive()).toBe(true);

      const delivery = engine.getImageDeliveryOptions(
        "https://orderking.in/assets/restaurant_cover.webp"
      );
      expect(delivery.isDownsampled).toBe(true);
      expect(delivery.isLowResPlaceholder).toBe(true);
      expect(delivery.optimizedUrl).toContain("lowres=1");
    });

    it("should allow programmatic data saver override", () => {
      monitor.setEffectiveType("4g");
      monitor.setDataSaverOverride(true);
      expect(engine.isDataSaverActive()).toBe(true);

      monitor.setDataSaverOverride(false);
      monitor.setEffectiveType("2g");
      // Explicit override to false takes precedence
      expect(engine.isDataSaverActive()).toBe(false);

      monitor.setDataSaverOverride(null);
      // Reset back to automatic: 2G causes data-saver to be true
      expect(engine.isDataSaverActive()).toBe(true);
    });
  });
});
