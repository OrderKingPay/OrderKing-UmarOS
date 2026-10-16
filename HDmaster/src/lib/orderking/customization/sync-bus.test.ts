import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CustomizationSyncBus,
  DEFAULT_HEARTBEAT_INTERVAL_MS,
  type CustomizationSyncPayload,
} from "./sync-bus";
import {
  DEFAULT_UNIVERSAL_CUSTOMIZATION,
  UniversalCustomizationEngine,
} from "./universal-customization-engine";
import {
  CustomizationSyncClient,
  fetchLatestCustomization,
  createCustomizationSyncClient,
} from "@orderking/ui";

describe("Real-Time Cross-App Sync Bus (Server-Sent Events / SSE)", () => {
  let engine: UniversalCustomizationEngine;
  let syncBus: CustomizationSyncBus;

  const founderActor = {
    userId: "founder_umar_01",
    role: "SUPREME_FOUNDER",
    name: "Founder Umar",
  };

  beforeEach(() => {
    engine = new UniversalCustomizationEngine();
    syncBus = new CustomizationSyncBus(engine, 100); // 100ms for fast test runs
  });

  afterEach(() => {
    syncBus.resetForTesting();
  });

  // ==========================================================================
  // 1. ENGINE COMMIT NOTIFICATIONS
  // ==========================================================================
  describe("UniversalCustomizationEngine Commit Stream", () => {
    it("notifies listeners on palette color change", () => {
      const commitEvents: any[] = [];
      const unsubscribe = engine.onCommit((evt) => commitEvents.push(evt));

      engine.updatePaletteColor("primary", "#006A4E", founderActor, "Green rebrand");

      expect(commitEvents.length).toBe(1);
      expect(commitEvents[0].version).toBe(2);
      expect(commitEvents[0].actionType).toBe("UPDATE_COLOR");
      expect(commitEvents[0].state.designTokens.palette.primary).toBe("#006A4E");
      expect(commitEvents[0].actor.userId).toBe("founder_umar_01");

      unsubscribe();
    });

    it("notifies listeners on text override change", () => {
      const commitEvents: any[] = [];
      const unsubscribe = engine.subscribe((evt) => commitEvents.push(evt));

      engine.setTextOverride(
        {
          elementId: "hero.title",
          platform: "customer_app",
          route: "/",
          translations: { en: "Quick Bites" },
          visibility: "visible",
        },
        founderActor,
        "Update title"
      );

      expect(commitEvents.length).toBe(1);
      expect(commitEvents[0].version).toBe(2);
      expect(commitEvents[0].actionType).toBe("UPDATE_TEXT");
      expect(commitEvents[0].state.textOverrides["hero.title"].translations.en).toBe("Quick Bites");

      unsubscribe();
    });

    it("notifies listeners on batch commit", () => {
      const commitEvents: any[] = [];
      engine.subscribe((evt) => commitEvents.push(evt));

      engine.commit(
        founderActor,
        "Batch toggle festival flags",
        "BATCH_UPDATE",
        "all",
        "festival",
        (draft) => {
          draft.featureSwitches["festival_mode"] = true;
        }
      );

      expect(commitEvents.length).toBe(1);
      expect(commitEvents[0].version).toBe(2);
      expect(commitEvents[0].state.featureSwitches["festival_mode"]).toBe(true);
    });

    it("stops notifying after unsubscription", () => {
      const commitEvents: any[] = [];
      const unsubscribe = engine.subscribe((evt) => commitEvents.push(evt));

      engine.updatePaletteColor("primary", "#111111", founderActor, "Change 1");
      expect(commitEvents.length).toBe(1);

      unsubscribe();

      engine.updatePaletteColor("primary", "#222222", founderActor, "Change 2");
      expect(commitEvents.length).toBe(1); // No new events received
    });
  });

  // ==========================================================================
  // 2. HTTP GET /api/sync/customizations/latest HYDRATION
  // ==========================================================================
  describe("HTTP GET /api/sync/customizations/latest Hydration Route", () => {
    it("returns HTTP 200 with full canonical customization state and Cloudflare headers", async () => {
      const req = new Request("https://orderking.com/api/sync/customizations/latest");
      const res = syncBus.handleLatestRequest(req);

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("application/json");
      expect(res.headers.get("Cache-Control")).toBe("no-cache, no-store, must-revalidate");
      expect(res.headers.get("X-Customization-Version")).toBe("1");

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.version).toBe(1);
      expect(body.state).toBeDefined();
      expect(body.state.designTokens.palette.primary).toBe("#E23744");
      expect(body.cssVariables).toContain("--color-primary: #E23744;");
      expect(body.customerPayload).toBeDefined();
      expect(body.customerPayload.sha256).toBeDefined();
    });

    it("reflects updated version and tokens in hydration payload", async () => {
      engine.updatePaletteColor("primary", "#FF5722", founderActor, "Vibrant Orange");

      const res = syncBus.handleLatestRequest();
      const body = await res.json();

      expect(body.version).toBe(2);
      expect(body.state.designTokens.palette.primary).toBe("#FF5722");
      expect(body.cssVariables).toContain("--color-primary: #FF5722;");
      expect(res.headers.get("X-Customization-Version")).toBe("2");
    });
  });

  // ==========================================================================
  // 3. SERVER-SENT EVENTS (SSE) STREAMING & CLOUDFLARE RESILIENCE
  // ==========================================================================
  describe("Server-Sent Events (SSE) Route & Cloudflare Edge Resilience", () => {
    it("returns streaming text/event-stream with Cloudflare edge bypass headers", async () => {
      const req = new Request("https://orderking.com/api/sync/customizations?platform=customer_app");
      const res = syncBus.handleSseRequest(req);

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/event-stream");
      expect(res.headers.get("Cache-Control")).toBe("no-cache, no-transform, no-store");
      expect(res.headers.get("Connection")).toBe("keep-alive");
      expect(res.headers.get("X-Accel-Buffering")).toBe("no");
      expect(res.body).toBeInstanceOf(ReadableStream);

      expect(syncBus.getSubscribersCount()).toBe(1);
    });

    it("streams initial ready handshake and snapshot frame upon connection", async () => {
      const req = new Request("https://orderking.com/api/sync/customizations?sendInitial=true");
      const res = syncBus.handleSseRequest(req);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      const chunk1 = await reader.read();
      const text1 = decoder.decode(chunk1.value);
      expect(text1).toContain("event: ready");
      expect(text1).toContain('"status":"connected"');
      expect(text1).toContain('"version":1');

      const chunk2 = await reader.read();
      const text2 = decoder.decode(chunk2.value);
      expect(text2).toContain("event: customization:commit");
      expect(text2).toContain('"actionType":"INITIAL_SNAPSHOT"');

      reader.cancel();
    });

    it("streams live updates when engine commits a new version", async () => {
      const req = new Request("https://orderking.com/api/sync/customizations?sendInitial=false");
      const res = syncBus.handleSseRequest(req);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      // Read initial ready event
      const initialChunk = await reader.read();
      expect(decoder.decode(initialChunk.value)).toContain("event: ready");

      // Commit live update
      engine.updatePaletteColor("primary", "#8B5CF6", founderActor, "Royal Violet");

      // Read streamed live update
      const updateChunk = await reader.read();
      const updateText = decoder.decode(updateChunk.value);

      expect(updateText).toContain("event: customization:commit");
      expect(updateText).toContain("id: 2");
      expect(updateText).toContain('"version":2');
      expect(updateText).toContain('"actionType":"UPDATE_COLOR"');
      expect(updateText).toContain("#8B5CF6");

      reader.cancel();
    });

    it("generates 15s heartbeat pings to maintain persistent connection through Cloudflare edge", async () => {
      const req = new Request("https://orderking.com/api/sync/customizations?sendInitial=false");
      const res = syncBus.handleSseRequest(req);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      await reader.read(); // Read ready event

      // Trigger heartbeat ping
      syncBus.sendHeartbeat();

      const pingChunk = await reader.read();
      const pingText = decoder.decode(pingChunk.value);

      expect(pingText).toContain("event: ping");
      expect(pingText).toContain('"type":"ping"');
      expect(pingText).toContain('"activeSubscribers":1');
      expect(pingText).toContain(": heartbeat");

      reader.cancel();
    });

    it("cleans up subscriber upon client abort or cancel", async () => {
      const abortController = new AbortController();
      const req = new Request("https://orderking.com/api/sync/customizations", {
        signal: abortController.signal,
      });

      const res = syncBus.handleSseRequest(req);
      expect(syncBus.getSubscribersCount()).toBe(1);

      // Simulate client navigation away / network disconnect
      abortController.abort();

      // Wait a tick for abort handler
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(syncBus.getSubscribersCount()).toBe(0);
    });
  });

  // ==========================================================================
  // 4. CLIENT SSE LISTENER UTILITY (@orderking/ui/sync-client)
  // ==========================================================================
  describe("Lightweight Client SSE Listener Utility (packages/ui/src/sync-client.ts)", () => {
    it("fetchLatestCustomization hydrates client state and injects CSS variables", async () => {
      const mockElement = {
        style: {
          properties: {} as Record<string, string>,
          setProperty(name: string, value: string) {
            this.properties[name] = value;
          },
          getPropertyValue(name: string) {
            return this.properties[name] || "";
          },
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          version: 5,
          timestamp: new Date().toISOString(),
          state: {
            ...DEFAULT_UNIVERSAL_CUSTOMIZATION,
            version: 5,
            designTokens: {
              ...DEFAULT_UNIVERSAL_CUSTOMIZATION.designTokens,
              palette: {
                ...DEFAULT_UNIVERSAL_CUSTOMIZATION.designTokens.palette,
                primary: "#E11D48",
              },
            },
          },
        }),
      });

      const payload = await fetchLatestCustomization({
        latestUrl: "https://api.orderking.com/api/sync/customizations/latest",
        fetchImpl: mockFetch as any,
        targetElement: mockElement as any,
      });

      expect(payload.version).toBe(5);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.orderking.com/api/sync/customizations/latest",
        expect.anything()
      );
      expect(mockElement.style.getPropertyValue("--color-primary")).toBe("#E11D48");
    });

    it("CustomizationSyncClient connects to EventSource and triggers onUpdate", async () => {
      // Mock EventSource implementation
      class MockEventSource {
        public url: string;
        public onopen: (() => void) | null = null;
        public onmessage: ((evt: any) => void) | null = null;
        public onerror: ((evt: any) => void) | null = null;
        public listeners = new Map<string, Set<(evt: any) => void>>();
        public closed = false;

        constructor(url: string) {
          this.url = url;
          setTimeout(() => this.onopen?.(), 5);
        }

        addEventListener(event: string, handler: (evt: any) => void) {
          if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
          }
          this.listeners.get(event)!.add(handler);
        }

        removeEventListener(event: string, handler: (evt: any) => void) {
          this.listeners.get(event)?.delete(handler);
        }

        dispatchEvent(event: string, data: any) {
          const handlers = this.listeners.get(event);
          if (handlers) {
            for (const h of handlers) h({ data: JSON.stringify(data) });
          }
          if (event === "message" && this.onmessage) {
            this.onmessage({ data: JSON.stringify(data) });
          }
        }

        close() {
          this.closed = true;
        }
      }

      let activeMockES: MockEventSource | null = null;
      const MockESConstructor = function (url: string) {
        activeMockES = new MockEventSource(url);
        return activeMockES;
      } as any;

      const receivedUpdates: any[] = [];
      const receivedHeartbeats: any[] = [];
      const statusChanges: string[] = [];

      const client = new CustomizationSyncClient({
        url: "/api/sync/customizations",
        platform: "customer_app",
        hydrateInitially: false,
        autoConnect: true,
        EventSourceImpl: MockESConstructor,
        onUpdate: (payload) => receivedUpdates.push(payload),
        onHeartbeat: (hb) => receivedHeartbeats.push(hb),
        onStatusChange: (status) => statusChanges.push(status),
      });

      // Wait for connect
      await new Promise((r) => setTimeout(r, 10));
      expect(client.isConnected()).toBe(true);
      expect(statusChanges).toContain("connected");

      // Simulate incoming live update from UmarOS
      const updatePayload: CustomizationSyncPayload = {
        version: 3,
        timestamp: new Date().toISOString(),
        actionType: "UPDATE_COLOR",
        state: {
          ...DEFAULT_UNIVERSAL_CUSTOMIZATION,
          version: 3,
          designTokens: {
            ...DEFAULT_UNIVERSAL_CUSTOMIZATION.designTokens,
            palette: {
              ...DEFAULT_UNIVERSAL_CUSTOMIZATION.designTokens.palette,
              primary: "#10B981",
            },
          },
        },
      };

      activeMockES!.dispatchEvent("customization:commit", updatePayload);

      expect(receivedUpdates.length).toBe(1);
      expect(receivedUpdates[0].version).toBe(3);
      expect(client.getVersion()).toBe(3);
      expect(client.getState()?.designTokens.palette.primary).toBe("#10B981");

      // Simulate incoming 15s heartbeat ping
      activeMockES!.dispatchEvent("ping", {
        type: "ping",
        timestamp: new Date().toISOString(),
        version: 3,
        activeSubscribers: 10,
      });

      expect(receivedHeartbeats.length).toBe(1);
      expect(receivedHeartbeats[0].version).toBe(3);
      expect(client.getLastHeartbeat()).toBeDefined();

      client.disconnect();
      expect(client.getStatus()).toBe("disconnected");
      expect(activeMockES!.closed).toBe(true);
    });

    it("automatically attempts reconnection when EventSource connection errors", async () => {
      let instanceCount = 0;
      class FlakyEventSource {
        public onopen: (() => void) | null = null;
        public onerror: ((evt: any) => void) | null = null;
        public listeners = new Map<string, Set<(evt: any) => void>>();
        public closed = false;

        constructor() {
          instanceCount += 1;
          setTimeout(() => {
            if (instanceCount === 1) {
              // First connection errors immediately
              this.onerror?.({ message: "Network timeout" });
            } else {
              // Second connection succeeds
              this.onopen?.();
            }
          }, 5);
        }

        addEventListener(event: string, handler: (evt: any) => void) {
          if (!this.listeners.has(event)) this.listeners.set(event, new Set());
          this.listeners.get(event)!.add(handler);
        }
        removeEventListener() {}
        close() {
          this.closed = true;
        }
      }

      const client = new CustomizationSyncClient({
        url: "/api/sync/customizations",
        hydrateInitially: false,
        autoReconnect: true,
        reconnectDelayMs: 20, // Rapid reconnect for test
        EventSourceImpl: FlakyEventSource as any,
      });

      // Wait for error and reconnect cycle to complete
      let attempts = 0;
      while (client.getStatus() !== "connected" && attempts < 30) {
        await new Promise((r) => setTimeout(r, 20));
        attempts++;
      }

      expect(instanceCount).toBeGreaterThanOrEqual(2);
      expect(client.getStatus()).toBe("connected");

      client.disconnect();
    });
  });
});
