/**
 * UMAR OS - Universal Customization Real-Time Sync Bus
 * Authority: Supreme Universal Systems Architect & Founder Command Plane
 *
 * Mandate:
 * High-performance Server-Sent Events (SSE) Real-Time Sync Bus delivering instant,
 * bidirectional synchronization of all visual tokens, text translations, layouts,
 * and feature flags committed by UniversalCustomizationEngine to all connected apps
 * (Customer App, Partner App, Rider App, KingPay, and UmarOS Admin).
 *
 * Cloudflare Edge Optimization:
 * - 15-second heartbeat ping stream to prevent edge dropouts and proxy buffering.
 * - HTTP GET `/api/sync/customizations/latest` for zero-flicker client hydration.
 * - Non-blocking web streams with graceful backpressure and connection teardown.
 */

import {
  getUniversalCustomizationEngine,
  UniversalCustomizationEngine,
  type CustomizationCommitEvent,
  type UniversalCustomizationState,
} from "./universal-customization-engine";

// ============================================================================
// 1. CONFIGURATION & TYPES
// ============================================================================

export const DEFAULT_HEARTBEAT_INTERVAL_MS = 15_000; // 15 seconds for Cloudflare edge

export interface SseSubscriber {
  id: string;
  controller: ReadableStreamDefaultController<Uint8Array>;
  platform?: string;
  connectedAt: string;
  lastPingAt: string;
}

export interface CustomizationSyncPayload {
  version: number;
  timestamp: string;
  actionType?: string;
  actor?: {
    userId: string;
    role: string;
    name?: string;
  };
  reason?: string;
  state: UniversalCustomizationState;
  cssVariables?: string;
  customerPayload?: ReturnType<UniversalCustomizationEngine["exportCustomerPayload"]>;
  partnerPayload?: ReturnType<UniversalCustomizationEngine["exportPartnerPayload"]>;
  riderPayload?: ReturnType<UniversalCustomizationEngine["exportRiderPayload"]>;
}

export interface SyncBusMetrics {
  activeSubscribers: number;
  totalBroadcasts: number;
  totalPings: number;
  startedAt: string;
  lastBroadcastAt: string | null;
  lastBroadcastVersion: number;
}

// ============================================================================
// 2. REAL-TIME CUSTOMIZATION SYNC BUS CLASS
// ============================================================================

export class CustomizationSyncBus {
  private engine: UniversalCustomizationEngine;
  private subscribers = new Map<string, SseSubscriber>();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatIntervalMs: number = DEFAULT_HEARTBEAT_INTERVAL_MS;
  private unsubscribeEngine: (() => void) | null = null;
  private encoder = new TextEncoder();

  // Telemetry metrics
  private startedAt = new Date().toISOString();
  private totalBroadcasts = 0;
  private totalPings = 0;
  private lastBroadcastAt: string | null = null;
  private lastBroadcastVersion = 1;

  constructor(engine?: UniversalCustomizationEngine, heartbeatIntervalMs = DEFAULT_HEARTBEAT_INTERVAL_MS) {
    this.engine = engine ?? getUniversalCustomizationEngine();
    this.heartbeatIntervalMs = heartbeatIntervalMs;
    this.lastBroadcastVersion = this.engine.getVersion();
    this.bindEngine();
  }

  /**
   * Binds to UniversalCustomizationEngine commit stream
   */
  private bindEngine(): void {
    if (this.unsubscribeEngine) {
      this.unsubscribeEngine();
    }
    this.unsubscribeEngine = this.engine.onCommit((event: CustomizationCommitEvent) => {
      this.broadcastCommit(event);
    });
  }

  public setEngine(engine: UniversalCustomizationEngine): void {
    this.engine = engine;
    this.lastBroadcastVersion = engine.getVersion();
    this.bindEngine();
  }

  public getEngine(): UniversalCustomizationEngine {
    return this.engine;
  }

  public setHeartbeatInterval(intervalMs: number): void {
    this.heartbeatIntervalMs = intervalMs;
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
      if (this.subscribers.size > 0) {
        this.startHeartbeatTimer();
      }
    }
  }

  // --------------------------------------------------------------------------
  // SUBSCRIBER MANAGEMENT
  // --------------------------------------------------------------------------

  public registerSubscriber(
    id: string,
    controller: ReadableStreamDefaultController<Uint8Array>,
    platform?: string
  ): SseSubscriber {
    const subscriber: SseSubscriber = {
      id,
      controller,
      platform,
      connectedAt: new Date().toISOString(),
      lastPingAt: new Date().toISOString(),
    };
    this.subscribers.set(id, subscriber);

    if (!this.heartbeatTimer) {
      this.startHeartbeatTimer();
    }

    return subscriber;
  }

  public removeSubscriber(id: string): boolean {
    const removed = this.subscribers.delete(id);
    if (this.subscribers.size === 0 && this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    return removed;
  }

  public getSubscriber(id: string): SseSubscriber | undefined {
    return this.subscribers.get(id);
  }

  public getSubscribersCount(): number {
    return this.subscribers.size;
  }

  // --------------------------------------------------------------------------
  // SSE FRAME FORMATTING & WRITING
  // --------------------------------------------------------------------------

  public formatSseMessage(event: string, data: unknown, id?: string | number): string {
    let msg = "";
    if (id !== undefined) {
      msg += `id: ${id}\n`;
    }
    if (event) {
      msg += `event: ${event}\n`;
    }
    const serializedData = typeof data === "string" ? data : JSON.stringify(data);
    // Multi-line data fields according to SSE spec
    const lines = serializedData.split("\n");
    for (const line of lines) {
      msg += `data: ${line}\n`;
    }
    msg += "\n";
    return msg;
  }

  private writeToSubscriber(subscriber: SseSubscriber, rawPayload: string): boolean {
    try {
      subscriber.controller.enqueue(this.encoder.encode(rawPayload));
      return true;
    } catch {
      // Controller was closed or errored, remove dead subscriber
      this.removeSubscriber(subscriber.id);
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // BROADCASTS & HEARTBEAT
  // --------------------------------------------------------------------------

  /**
   * Broadcasts a commit event to all connected apps
   */
  public broadcastCommit(event: CustomizationCommitEvent): void {
    this.totalBroadcasts += 1;
    this.lastBroadcastAt = new Date().toISOString();
    this.lastBroadcastVersion = event.version;

    const payload: CustomizationSyncPayload = {
      version: event.version,
      timestamp: event.timestamp,
      actionType: event.actionType,
      actor: event.actor,
      reason: event.reason,
      state: event.state,
      cssVariables: this.engine.generateCssVariables(),
      customerPayload: this.engine.exportCustomerPayload(),
      partnerPayload: this.engine.exportPartnerPayload(),
      riderPayload: this.engine.exportRiderPayload(),
    };

    // Format event for both typed listeners and default onmessage handlers
    const sseEvent =
      this.formatSseMessage("customization:commit", payload, event.version) +
      this.formatSseMessage("update", payload, event.version) +
      this.formatSseMessage("message", payload, event.version);

    for (const subscriber of Array.from(this.subscribers.values())) {
      this.writeToSubscriber(subscriber, sseEvent);
    }
  }

  /**
   * Generates a 15-second heartbeat ping to keep Cloudflare edge and proxies alive
   */
  public sendHeartbeat(): void {
    if (this.subscribers.size === 0) return;

    this.totalPings += 1;
    const now = new Date().toISOString();
    const pingData = {
      type: "ping",
      timestamp: now,
      version: this.engine.getVersion(),
      activeSubscribers: this.subscribers.size,
    };

    // Include named ping event AND keepalive SSE comment (: heartbeat)
    const pingMessage =
      this.formatSseMessage("ping", pingData) +
      `: heartbeat ${now}\n\n`;

    for (const subscriber of Array.from(this.subscribers.values())) {
      subscriber.lastPingAt = now;
      this.writeToSubscriber(subscriber, pingMessage);
    }
  }

  private startHeartbeatTimer(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, this.heartbeatIntervalMs);

    // Prevent blocking Node process exit in CLI/tests
    if (typeof this.heartbeatTimer === "object" && "unref" in this.heartbeatTimer) {
      (this.heartbeatTimer as any).unref();
    }
  }

  // --------------------------------------------------------------------------
  // HTTP HANDLERS (SSE & HYDRATION)
  // --------------------------------------------------------------------------

  /**
   * Handles HTTP GET `/api/sync/customizations/latest` for client hydration
   */
  public handleLatestRequest(request?: Request): Response {
    const url = request ? new URL(request.url) : null;
    const platform = url?.searchParams.get("platform") ?? undefined;

    const payload = {
      success: true,
      version: this.engine.getVersion(),
      timestamp: new Date().toISOString(),
      state: this.engine.getState(),
      cssVariables: this.engine.generateCssVariables(),
      customerPayload: this.engine.exportCustomerPayload(),
      partnerPayload: this.engine.exportPartnerPayload(),
      riderPayload: this.engine.exportRiderPayload(),
      platform,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Customization-Version": String(this.engine.getVersion()),
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  /**
   * Handles HTTP GET `/api/sync/customizations` for persistent SSE stream
   */
  public handleSseRequest(request: Request): Response {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }

    const url = new URL(request.url);
    const platform = url.searchParams.get("platform") ?? undefined;
    const sendInitial = url.searchParams.get("sendInitial") !== "false";
    const subscriberId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    let streamController: ReadableStreamDefaultController<Uint8Array> | null = null;

    const stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        streamController = controller;
        const subscriber = this.registerSubscriber(subscriberId, controller, platform);

        // Send initial handshake / ready frame
        const initialHandshake = {
          status: "connected",
          subscriberId,
          version: this.engine.getVersion(),
          timestamp: new Date().toISOString(),
          heartbeatIntervalMs: this.heartbeatIntervalMs,
        };
        const readyFrame = this.formatSseMessage("ready", initialHandshake);
        this.writeToSubscriber(subscriber, readyFrame);

        // Optionally stream the current snapshot immediately on connect
        if (sendInitial) {
          const snapshotPayload: CustomizationSyncPayload = {
            version: this.engine.getVersion(),
            timestamp: new Date().toISOString(),
            actionType: "INITIAL_SNAPSHOT",
            actor: { userId: "system", role: "SYNC_BUS" },
            reason: "Initial Connection Snapshot",
            state: this.engine.getState(),
            cssVariables: this.engine.generateCssVariables(),
            customerPayload: this.engine.exportCustomerPayload(),
          };
          const snapshotFrame =
            this.formatSseMessage("customization:commit", snapshotPayload, this.engine.getVersion()) +
            this.formatSseMessage("update", snapshotPayload, this.engine.getVersion());
          this.writeToSubscriber(subscriber, snapshotFrame);
        }
      },
      cancel: () => {
        this.removeSubscriber(subscriberId);
      },
    });

    // Handle client disconnect via abort signal
    if (request.signal) {
      request.signal.addEventListener("abort", () => {
        this.removeSubscriber(subscriberId);
        if (streamController) {
          try {
            streamController.close();
          } catch {
            // Already closed
          }
        }
      });
    }

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform, no-store",
        "Connection": "keep-alive",
        // Crucial Cloudflare Edge & Reverse Proxy headers
        "X-Accel-Buffering": "no",
        "Transfer-Encoding": "chunked",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  // --------------------------------------------------------------------------
  // DIAGNOSTICS & TELEMETRY
  // --------------------------------------------------------------------------

  public getMetrics(): SyncBusMetrics {
    return {
      activeSubscribers: this.subscribers.size,
      totalBroadcasts: this.totalBroadcasts,
      totalPings: this.totalPings,
      startedAt: this.startedAt,
      lastBroadcastAt: this.lastBroadcastAt,
      lastBroadcastVersion: this.lastBroadcastVersion,
    };
  }

  /**
   * Resets all active subscriptions and timers (used for clean test tear-down)
   */
  public resetForTesting(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    for (const [id, sub] of this.subscribers.entries()) {
      try {
        sub.controller.close();
      } catch {
        // Ignore
      }
    }
    this.subscribers.clear();
    this.totalBroadcasts = 0;
    this.totalPings = 0;
  }
}

// ============================================================================
// 3. SINGLETON EXPORT & DIRECT HELPERS
// ============================================================================

let globalSyncBus: CustomizationSyncBus | null = null;

export function getCustomizationSyncBus(): CustomizationSyncBus {
  if (!globalSyncBus) {
    globalSyncBus = new CustomizationSyncBus();
  }
  return globalSyncBus;
}

export function setCustomizationSyncBus(bus: CustomizationSyncBus | null): void {
  globalSyncBus = bus;
}

export function handleSseRequest(request: Request): Response {
  return getCustomizationSyncBus().handleSseRequest(request);
}

export function handleLatestRequest(request?: Request): Response {
  return getCustomizationSyncBus().handleLatestRequest(request);
}
