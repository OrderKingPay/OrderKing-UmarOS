/**
 * UMAR OS - Universal Customization Real-Time Sync Client
 * Authority: Supreme Universal Systems Architect & Founder Command Plane
 *
 * Mandate:
 * High-performance, lightweight client-side Server-Sent Events (SSE) listener
 * and hydration utility for all OrderKing frontend applications.
 *
 * Capabilities:
 * 1. Initial hydration via HTTP GET `/api/sync/customizations/latest` (zero-flicker).
 * 2. Real-time persistent SSE stream listening for live commits from UmarOS.
 * 3. 15-second Cloudflare edge heartbeat tracking and silent TCP dropout watchdog.
 * 4. Automatic exponential-backoff reconnection and state re-synchronization.
 * 5. Automatic DOM CSS variable injection for live, instantaneous theme updates.
 * 6. Ergonomic React hook `useCustomizationSync()` for seamless UI reactivity.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  DEFAULT_CUSTOMIZATION_STATE,
  injectCssVariables,
  type DynamicCustomizationState,
  type StyleSettableElement,
} from "./customization-provider";

// ============================================================================
// 1. TYPES & INTERFACES
// ============================================================================

export type SyncConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "error";

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
  state: DynamicCustomizationState;
  cssVariables?: string;
  customerPayload?: Record<string, unknown>;
  partnerPayload?: Record<string, unknown>;
  riderPayload?: Record<string, unknown>;
  platform?: string;
  success?: boolean;
}

export interface HeartbeatData {
  type?: string;
  timestamp: string;
  version?: number;
  activeSubscribers?: number;
  receivedAt: Date;
  latencyMs?: number;
  raw?: unknown;
}

export interface SyncClientOptions {
  /**
   * Base URL or endpoint for the SSE route.
   * @default "/api/sync/customizations"
   */
  url?: string;

  /**
   * HTTP endpoint for initial hydration.
   * @default "/api/sync/customizations/latest"
   */
  latestUrl?: string;

  /**
   * Target platform for tailored payload delivery.
   * @default "customer_app"
   */
  platform?: string;

  /**
   * Whether to automatically connect immediately upon instantiation.
   * @default true
   */
  autoConnect?: boolean;

  /**
   * Whether to fetch the latest state via HTTP GET before or alongside connecting.
   * @default true
   */
  hydrateInitially?: boolean;

  /**
   * Whether to automatically reconnect when connection drops.
   * @default true
   */
  autoReconnect?: boolean;

  /**
   * Initial delay in milliseconds before reconnection attempt.
   * @default 2000
   */
  reconnectDelayMs?: number;

  /**
   * Maximum backoff delay in milliseconds.
   * @default 30000
   */
  maxReconnectDelayMs?: number;

  /**
   * Watchdog timeout in milliseconds. If no ping or message is received within this window,
   * the client treats the connection as silently dropped and reconnects.
   * @default 35000 (2x 15s server ping + 5s buffer)
   */
  heartbeatTimeoutMs?: number;

  /**
   * Automatically inject updated design tokens into the DOM (`document.documentElement.style`).
   * @default true
   */
  autoInjectCss?: boolean;

  /**
   * Optional custom DOM element for CSS variable injection.
   */
  targetElement?: StyleSettableElement | null;

  /**
   * Optional custom EventSource implementation (e.g. for Node.js / unit tests).
   */
  EventSourceImpl?: any;

  /**
   * Optional custom fetch implementation.
   */
  fetchImpl?: typeof fetch;

  /**
   * Callback invoked whenever a new customization version is committed and synced.
   */
  onUpdate?: (payload: CustomizationSyncPayload) => void;

  /**
   * Callback invoked on every 15-second heartbeat ping from Cloudflare edge.
   */
  onHeartbeat?: (heartbeat: HeartbeatData) => void;

  /**
   * Callback invoked on connection status changes.
   */
  onStatusChange?: (status: SyncConnectionStatus) => void;

  /**
   * Callback invoked on connection or parsing errors.
   */
  onError?: (error: Error) => void;
}

// ============================================================================
// 2. HTTP INITIAL HYDRATION UTILITY
// ============================================================================

/**
 * Performs immediate HTTP GET `/api/sync/customizations/latest` for zero-flicker hydration.
 */
export async function fetchLatestCustomization(
  options: {
    latestUrl?: string;
    platform?: string;
    autoInjectCss?: boolean;
    targetElement?: StyleSettableElement | null;
    fetchImpl?: typeof fetch;
  } = {}
): Promise<CustomizationSyncPayload> {
  const fetchFn = options.fetchImpl ?? (typeof fetch !== "undefined" ? fetch : undefined);
  if (!fetchFn) {
    throw new Error("[SyncClient] No fetch implementation available for hydration.");
  }

  const endpoint = options.latestUrl ?? "/api/sync/customizations/latest";
  const url = new URL(endpoint, typeof window !== "undefined" ? window.location.origin : "http://localhost");
  if (options.platform) {
    url.searchParams.set("platform", options.platform);
  }

  const response = await fetchFn(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache",
    },
  });

  if (!response.ok) {
    throw new Error(`[SyncClient] Hydration failed with status ${response.status}: ${response.statusText}`);
  }

  const data = (await response.json()) as CustomizationSyncPayload;

  if (options.autoInjectCss !== false && data.state) {
    injectCssVariables(data.state, options.targetElement);
  }

  return data;
}

// ============================================================================
// 3. PERSISTENT SSE CLIENT CLASS
// ============================================================================

export class CustomizationSyncClient {
  private options: Required<
    Omit<
      SyncClientOptions,
      | "targetElement"
      | "EventSourceImpl"
      | "fetchImpl"
      | "onUpdate"
      | "onHeartbeat"
      | "onStatusChange"
      | "onError"
    >
  > & {
    targetElement?: StyleSettableElement | null;
    EventSourceImpl?: any;
    fetchImpl?: typeof fetch;
    onUpdate?: (payload: CustomizationSyncPayload) => void;
    onHeartbeat?: (heartbeat: HeartbeatData) => void;
    onStatusChange?: (status: SyncConnectionStatus) => void;
    onError?: (error: Error) => void;
  };

  private eventSource: any | null = null;
  private status: SyncConnectionStatus = "idle";
  private currentState: DynamicCustomizationState | null = null;
  private currentVersion = 1;
  private lastHeartbeat: HeartbeatData | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private watchdogTimer: ReturnType<typeof setTimeout> | null = null;
  private isExplicitlyClosed = false;

  // Event listener registry
  private listeners: {
    update: Set<(payload: CustomizationSyncPayload) => void>;
    heartbeat: Set<(heartbeat: HeartbeatData) => void>;
    status: Set<(status: SyncConnectionStatus) => void>;
    error: Set<(error: Error) => void>;
  } = {
    update: new Set(),
    heartbeat: new Set(),
    status: new Set(),
    error: new Set(),
  };

  constructor(options: SyncClientOptions = {}) {
    this.options = {
      url: options.url ?? "/api/sync/customizations",
      latestUrl: options.latestUrl ?? "/api/sync/customizations/latest",
      platform: options.platform ?? "customer_app",
      autoConnect: options.autoConnect ?? true,
      hydrateInitially: options.hydrateInitially ?? true,
      autoReconnect: options.autoReconnect ?? true,
      reconnectDelayMs: options.reconnectDelayMs ?? 2000,
      maxReconnectDelayMs: options.maxReconnectDelayMs ?? 30000,
      heartbeatTimeoutMs: options.heartbeatTimeoutMs ?? 35000,
      autoInjectCss: options.autoInjectCss ?? true,
      targetElement: options.targetElement,
      EventSourceImpl: options.EventSourceImpl,
      fetchImpl: options.fetchImpl,
      onUpdate: options.onUpdate,
      onHeartbeat: options.onHeartbeat,
      onStatusChange: options.onStatusChange,
      onError: options.onError,
    };

    if (this.options.onUpdate) this.listeners.update.add(this.options.onUpdate);
    if (this.options.onHeartbeat) this.listeners.heartbeat.add(this.options.onHeartbeat);
    if (this.options.onStatusChange) this.listeners.status.add(this.options.onStatusChange);
    if (this.options.onError) this.listeners.error.add(this.options.onError);

    if (this.options.autoConnect) {
      this.connect();
    }
  }

  // --------------------------------------------------------------------------
  // GETTERS & STATUS
  // --------------------------------------------------------------------------

  public getStatus(): SyncConnectionStatus {
    return this.status;
  }

  public getState(): DynamicCustomizationState | null {
    return this.currentState;
  }

  public getVersion(): number {
    return this.currentVersion;
  }

  public getLastHeartbeat(): HeartbeatData | null {
    return this.lastHeartbeat;
  }

  public isConnected(): boolean {
    return this.status === "connected";
  }

  private setStatus(newStatus: SyncConnectionStatus): void {
    if (this.status === newStatus) return;
    this.status = newStatus;
    for (const listener of this.listeners.status) {
      try {
        listener(newStatus);
      } catch (err) {
        console.error("[SyncClient] Status listener error:", err);
      }
    }
  }

  // --------------------------------------------------------------------------
  // SUBSCRIPTION MANAGEMENT
  // --------------------------------------------------------------------------

  public on(event: "update", handler: (payload: CustomizationSyncPayload) => void): () => void;
  public on(event: "heartbeat", handler: (heartbeat: HeartbeatData) => void): () => void;
  public on(event: "status", handler: (status: SyncConnectionStatus) => void): () => void;
  public on(event: "error", handler: (error: Error) => void): () => void;
  public on(event: string, handler: any): () => void {
    const set = (this.listeners as any)[event];
    if (set) {
      set.add(handler);
      return () => set.delete(handler);
    }
    return () => {};
  }

  public off(event: string, handler: any): void {
    const set = (this.listeners as any)[event];
    if (set) {
      set.delete(handler);
    }
  }

  // --------------------------------------------------------------------------
  // CONNECTION LIFECYCLE
  // --------------------------------------------------------------------------

  /**
   * Establishes connection to the Server-Sent Events sync bus
   */
  public async connect(): Promise<void> {
    this.isExplicitlyClosed = false;

    // Optional initial hydration before or in parallel with stream
    if (this.options.hydrateInitially && !this.currentState) {
      try {
        await this.hydrate();
      } catch (err: any) {
        // Hydration error is non-fatal; the SSE stream will still deliver state
        this.emitError(err instanceof Error ? err : new Error(String(err)));
      }
    }

    if (this.eventSource) {
      this.closeEventSource();
    }

    this.setStatus("connecting");

    const resolvedES =
      this.options.EventSourceImpl ??
      (typeof EventSource !== "undefined" ? EventSource : null);

    if (!resolvedES) {
      const err = new Error(
        "[SyncClient] EventSource is not supported in this runtime and no polyfill was provided."
      );
      this.setStatus("error");
      this.emitError(err);
      return;
    }

    try {
      const endpointUrl = new URL(
        this.options.url,
        typeof window !== "undefined" ? window.location.origin : "http://localhost"
      );
      if (this.options.platform) {
        endpointUrl.searchParams.set("platform", this.options.platform);
      }
      endpointUrl.searchParams.set("clientVersion", String(this.currentVersion));

      const es = new resolvedES(endpointUrl.toString());
      this.eventSource = es;

      es.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus("connected");
        this.resetWatchdogTimer();
      };

      // 1. Ready Handshake
      es.addEventListener("ready", (evt: any) => {
        this.resetWatchdogTimer();
        try {
          const readyData = JSON.parse(evt.data);
          if (readyData.version && readyData.version > this.currentVersion) {
            this.currentVersion = readyData.version;
          }
        } catch {
          // Handshake payload was plain or non-JSON
        }
      });

      // 2. Customization Commit & Update Events
      const handleCommitEvent = (evt: any) => {
        this.resetWatchdogTimer();
        try {
          const payload = (typeof evt.data === "string" ? JSON.parse(evt.data) : evt.data) as CustomizationSyncPayload;
          this.handlePayload(payload);
        } catch (err: any) {
          this.emitError(new Error(`Failed to parse SSE payload: ${err.message}`));
        }
      };

      es.addEventListener("customization:commit", handleCommitEvent);
      es.addEventListener("update", handleCommitEvent);
      es.onmessage = handleCommitEvent;

      // 3. 15-second Cloudflare Edge Heartbeat Ping
      const handlePingEvent = (evt: any) => {
        this.resetWatchdogTimer();
        try {
          const data = typeof evt.data === "string" ? JSON.parse(evt.data) : evt.data;
          const pingTime = data?.timestamp ? new Date(data.timestamp).getTime() : Date.now();
          const latencyMs = Math.max(0, Date.now() - pingTime);

          const heartbeat: HeartbeatData = {
            type: "ping",
            timestamp: data?.timestamp || new Date().toISOString(),
            version: data?.version,
            activeSubscribers: data?.activeSubscribers,
            receivedAt: new Date(),
            latencyMs,
            raw: data,
          };
          this.lastHeartbeat = heartbeat;
          for (const listener of this.listeners.heartbeat) {
            try {
              listener(heartbeat);
            } catch (err) {
              console.error("[SyncClient] Heartbeat listener error:", err);
            }
          }
        } catch {
          // Ignore heartbeat parse failures
        }
      };

      es.addEventListener("ping", handlePingEvent);
      es.addEventListener("heartbeat", handlePingEvent);

      // 4. Connection Error & Reconnect
      es.onerror = (errEvent: any) => {
        this.closeEventSource();
        if (this.isExplicitlyClosed) return;

        const error = new Error("[SyncClient] SSE connection error or edge disconnect");
        this.emitError(error);

        if (this.options.autoReconnect) {
          this.scheduleReconnect();
        } else {
          this.setStatus("error");
        }
      };

      this.resetWatchdogTimer();
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.setStatus("error");
      this.emitError(error);
      if (this.options.autoReconnect && !this.isExplicitlyClosed) {
        this.scheduleReconnect();
      }
    }
  }

  /**
   * Closes the active SSE connection and stops all watchdog and reconnect timers.
   */
  public disconnect(): void {
    this.isExplicitlyClosed = true;
    this.clearTimers();
    this.closeEventSource();
    this.setStatus("disconnected");
  }

  /**
   * Forces an immediate re-fetch of latest state via HTTP.
   */
  public async hydrate(): Promise<CustomizationSyncPayload> {
    const payload = await fetchLatestCustomization({
      latestUrl: this.options.latestUrl,
      platform: this.options.platform,
      autoInjectCss: this.options.autoInjectCss,
      targetElement: this.options.targetElement,
      fetchImpl: this.options.fetchImpl,
    });
    this.handlePayload(payload);
    return payload;
  }

  // --------------------------------------------------------------------------
  // PAYLOAD PROCESSING & DOM INJECTION
  // --------------------------------------------------------------------------

  private handlePayload(payload: CustomizationSyncPayload): void {
    if (!payload || !payload.state) return;

    this.currentState = payload.state;
    if (payload.version !== undefined) {
      this.currentVersion = payload.version;
    }

    if (this.options.autoInjectCss) {
      injectCssVariables(payload.state, this.options.targetElement);
    }

    for (const listener of this.listeners.update) {
      try {
        listener(payload);
      } catch (err) {
        console.error("[SyncClient] Update listener error:", err);
      }
    }
  }

  private emitError(error: Error): void {
    for (const listener of this.listeners.error) {
      try {
        listener(error);
      } catch (err) {
        console.error("[SyncClient] Error listener error:", err);
      }
    }
  }

  // --------------------------------------------------------------------------
  // WATCHDOG & RECONNECT ENGINE
  // --------------------------------------------------------------------------

  private resetWatchdogTimer(): void {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
    }
    if (this.options.heartbeatTimeoutMs <= 0 || this.isExplicitlyClosed) return;

    this.watchdogTimer = setTimeout(() => {
      // 35s passed without a heartbeat or frame -> dead TCP socket
      if (this.status === "connected" && !this.isExplicitlyClosed) {
        this.closeEventSource();
        this.emitError(new Error("[SyncClient] Heartbeat timeout: edge connection silently stalled."));
        if (this.options.autoReconnect) {
          this.scheduleReconnect();
        }
      }
    }, this.options.heartbeatTimeoutMs);

    if (typeof this.watchdogTimer === "object" && "unref" in this.watchdogTimer) {
      (this.watchdogTimer as any).unref();
    }
  }

  private scheduleReconnect(): void {
    if (this.isExplicitlyClosed) return;
    this.setStatus("reconnecting");

    this.reconnectAttempts += 1;
    // Exponential backoff with jitter: delay * (1.5 ^ attempts)
    const factor = Math.min(Math.pow(1.5, this.reconnectAttempts - 1), 15);
    const calculatedDelay = Math.min(
      this.options.reconnectDelayMs * factor,
      this.options.maxReconnectDelayMs
    );
    const jitter = Math.random() * Math.min(500, this.options.reconnectDelayMs * 0.25);
    const finalDelay = Math.floor(calculatedDelay + jitter);

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, finalDelay);

    if (typeof this.reconnectTimer === "object" && "unref" in this.reconnectTimer) {
      (this.reconnectTimer as any).unref();
    }
  }

  private closeEventSource(): void {
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {
        // Ignore close errors
      }
      this.eventSource = null;
    }
  }

  private clearTimers(): void {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

// ============================================================================
// 4. CLIENT FACTORY FUNCTION
// ============================================================================

export function createCustomizationSyncClient(options: SyncClientOptions = {}): CustomizationSyncClient {
  return new CustomizationSyncClient(options);
}

// ============================================================================
// 5. REACT HOOK: useCustomizationSync()
// ============================================================================

export interface UseCustomizationSyncResult {
  state: DynamicCustomizationState;
  version: number;
  status: SyncConnectionStatus;
  isConnected: boolean;
  lastHeartbeat: HeartbeatData | null;
  error: Error | null;
  reconnect: () => void;
  refresh: () => Promise<CustomizationSyncPayload>;
}

/**
 * React hook to synchronize component trees in real time with UmarOS live customization commits.
 */
export function useCustomizationSync(options: SyncClientOptions = {}): UseCustomizationSyncResult {
  const [state, setState] = useState<DynamicCustomizationState>(
    DEFAULT_CUSTOMIZATION_STATE
  );
  const [version, setVersion] = useState<number>(1);
  const [status, setStatus] = useState<SyncConnectionStatus>("idle");
  const [lastHeartbeat, setLastHeartbeat] = useState<HeartbeatData | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const clientRef = useRef<CustomizationSyncClient | null>(null);

  useEffect(() => {
    const client = new CustomizationSyncClient({
      ...options,
      autoConnect: true,
      onUpdate: (payload) => {
        setState(payload.state);
        setVersion(payload.version);
        setError(null);
        options.onUpdate?.(payload);
      },
      onHeartbeat: (hb) => {
        setLastHeartbeat(hb);
        options.onHeartbeat?.(hb);
      },
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
        options.onStatusChange?.(newStatus);
      },
      onError: (err) => {
        setError(err);
        options.onError?.(err);
      },
    });

    clientRef.current = client;

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [
    options.url,
    options.latestUrl,
    options.platform,
    options.autoInjectCss,
    options.heartbeatTimeoutMs,
  ]);

  const reconnect = useCallback(() => {
    clientRef.current?.connect();
  }, []);

  const refresh = useCallback(async () => {
    if (!clientRef.current) {
      return fetchLatestCustomization(options);
    }
    return clientRef.current.hydrate();
  }, [options]);

  return {
    state,
    version,
    status,
    isConnected: status === "connected",
    lastHeartbeat,
    error,
    reconnect,
    refresh,
  };
}
