/**
 * UMAR OS - Universal Supabase Realtime & Polling Fallback Sync Client
 * Authority: Supreme Universal Systems Architect & Founder Command Plane
 *
 * Mandate:
 * High-performance, lightweight Supabase Realtime broadcast subscriber (<200ms)
 * with automatic resilient 10-second HTTP polling fallback on `/api/sync/customizations/latest`
 * for all OrderKing client apps (Customer, Partner, Rider, UmarOS/HDmaster).
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient, SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";

export interface UmarOsCustomizationConfig {
  version: number;
  updatedAt: string;
  brand: {
    appName: string;
    primaryColor: string;
    accentColor: string;
    logoUrl: string;
    supportPhone: string;
    supportWhatsApp: string;
  };
  economics: {
    platformFeePaise: number;
    smallCartThresholdPaise: number;
    smallCartFeePaise: number;
    packagingFeeCapPaise: number;
    packagingFeeMaxPercent: number;
    cgstSection9_5Percent: number;
    platformGstPercent: number;
    tcsPercent: number;
    tdsPercent: number;
    defaultCommissionPercent: number;
    surgeMultiplier: number;
    monsoonAlertActive: boolean;
    monsoonBannerText: string;
  };
  features: {
    vipGoldPassEnabled: boolean;
    diningOutEnabled: boolean;
    groupOrderingEnabled: boolean;
    codEnabled: boolean;
    kingPayOneClickEnabled: boolean;
  };
}

export const DEFAULT_UMAROS_CONFIG: UmarOsCustomizationConfig = {
  version: 1,
  updatedAt: new Date(0).toISOString(),
  brand: {
    appName: "OrderKing",
    primaryColor: "#E23744",
    accentColor: "#10B981",
    logoUrl: "/logo.jpg",
    supportPhone: "+918000000000",
    supportWhatsApp: "+918000000000",
  },
  economics: {
    platformFeePaise: 600, // ₹6.00
    smallCartThresholdPaise: 14900, // ₹149.00
    smallCartFeePaise: 3000, // ₹30.00
    packagingFeeCapPaise: 3500, // ₹35.00
    packagingFeeMaxPercent: 10,
    cgstSection9_5Percent: 5,
    platformGstPercent: 18,
    tcsPercent: 1,
    tdsPercent: 0.1,
    defaultCommissionPercent: 22,
    surgeMultiplier: 1.0,
    monsoonAlertActive: false,
    monsoonBannerText: "Heavy rain in your area. Delivery partners are riding safely; slight delays possible.",
  },
  features: {
    vipGoldPassEnabled: true,
    diningOutEnabled: true,
    groupOrderingEnabled: true,
    codEnabled: true,
    kingPayOneClickEnabled: true,
  },
};

export const STORAGE_KEY = "orderking_umaros_live_config_v1";
export const CHANNEL_NAME = "umaros-config";
export const POLL_INTERVAL_MS = 10000;

function readEnv(key: string): string | undefined {
  try {
    if (typeof import.meta !== "undefined" && (import.meta as unknown as { env?: Record<string, string> }).env?.[key]) {
      return (import.meta as unknown as { env: Record<string, string> }).env[key];
    }
  } catch {
    // Ignore import.meta access errors in non-Vite environments
  }
  try {
    if (typeof process !== "undefined" && process.env?.[key]) {
      return process.env[key];
    }
  } catch {
    // Ignore process.env access errors in browser-only environments
  }
  return undefined;
}

let sharedSupabaseClient: SupabaseClient | null = null;

export function getSupabaseRealtimeClient(): SupabaseClient | null {
  if (sharedSupabaseClient) return sharedSupabaseClient;

  const supabaseUrl =
    readEnv("VITE_SUPABASE_URL") ||
    readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey =
    readEnv("VITE_SUPABASE_ANON_KEY") ||
    readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("your-project.supabase.co")) {
    return null;
  }

  sharedSupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return sharedSupabaseClient;
}

export function setSharedSupabaseClient(client: SupabaseClient | null): void {
  sharedSupabaseClient = client;
}

export function loadCachedConfig(): UmarOsCustomizationConfig {
  if (typeof window === "undefined" && typeof globalThis.localStorage === "undefined") {
    return DEFAULT_UMAROS_CONFIG;
  }
  try {
    const storage = typeof window !== "undefined" ? window.localStorage : globalThis.localStorage;
    if (!storage) return DEFAULT_UMAROS_CONFIG;
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_UMAROS_CONFIG;
    const parsed = JSON.parse(raw) as Partial<UmarOsCustomizationConfig>;
    return mergeConfig(DEFAULT_UMAROS_CONFIG, parsed);
  } catch {
    return DEFAULT_UMAROS_CONFIG;
  }
}

export function saveCachedConfig(config: UmarOsCustomizationConfig): void {
  if (typeof window === "undefined" && typeof globalThis.localStorage === "undefined") {
    return;
  }
  try {
    const storage = typeof window !== "undefined" ? window.localStorage : globalThis.localStorage;
    if (!storage) return;
    storage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore quota errors
  }
}

export function mergeConfig(
  base: UmarOsCustomizationConfig,
  patch?: Partial<UmarOsCustomizationConfig> | any | null
): UmarOsCustomizationConfig {
  if (!patch) return base;

  // Handle hybrid SDUI / DynamicCustomizationState format if passed
  const brandPatch = patch.brand
    ? patch.brand
    : patch.designTokens?.palette
    ? {
        primaryColor: patch.designTokens.palette.primary,
        accentColor: patch.designTokens.palette.accent,
      }
    : {};

  return {
    version: typeof patch.version === "number" ? patch.version : base.version,
    updatedAt: patch.updatedAt || patch.timestamp || new Date().toISOString(),
    brand: { ...base.brand, ...brandPatch },
    economics: { ...base.economics, ...(patch.economics || {}) },
    features: { ...base.features, ...(patch.features || {}) },
  };
}

/**
 * Broadcasts a new configuration payload from UmarOS (HDmaster) to all connected apps
 * via Supabase Realtime AND persists it to the edge API endpoint.
 */
export async function broadcastUmarOsConfigUpdate(
  nextConfig: Partial<UmarOsCustomizationConfig>,
  apiEndpoint = "/api/sync/customizations/latest"
): Promise<{ broadcasted: boolean; persisted: boolean }> {
  let broadcasted = false;
  let persisted = false;

  const client = getSupabaseRealtimeClient();
  if (client) {
    try {
      const channel = client.channel(CHANNEL_NAME);
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Channel subscribe timeout")), 4000);
        channel.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            clearTimeout(timeout);
            resolve();
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            clearTimeout(timeout);
            reject(new Error(`Channel error: ${status}`));
          }
        });
      });

      const sendStatus = await channel.send({
        type: "broadcast",
        event: "CONFIG_UPDATED",
        payload: nextConfig,
      });
      broadcasted = sendStatus === "ok";
      await client.removeChannel(channel);
    } catch {
      broadcasted = false;
    }
  }

  if (typeof fetch !== "undefined") {
    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextConfig),
      });
      persisted = res.ok;
    } catch {
      persisted = false;
    }
  }

  return { broadcasted, persisted };
}

export interface UseUmarOsLiveConfigResult {
  config: UmarOsCustomizationConfig;
  connectionState: "REALTIME_CONNECTED" | "POLLING_FALLBACK" | "CONNECTING";
  lastSyncedAt: string | null;
  forceRefresh: () => Promise<void>;
  state: UmarOsCustomizationConfig;
  isSynced: boolean;
  status: "connected" | "reconnecting" | "connecting" | "idle";
  error: Error | null;
}

/**
 * Standalone snapshot fetcher for SSR loaders, hydration, and fallback polling.
 */
export async function fetchUmarOsLiveConfigSnapshot(
  pollUrl = "/api/sync/customizations/latest"
): Promise<UmarOsCustomizationConfig | null> {
  if (typeof fetch === "undefined") return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(pollUrl, {
      method: "GET",
      headers: { Accept: "application/json", "Cache-Control": "no-cache" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return null;

    const data = await res.json();
    const payload = (data?.config || data?.data || data?.state || data) as Partial<UmarOsCustomizationConfig>;
    if (payload && (payload.brand || payload.economics || payload.features || payload.version)) {
      return mergeConfig(DEFAULT_UMAROS_CONFIG, payload);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Drop-in hook for Customer, Partner, Rider, and UmarOS apps.
 * Connects to `supabase.channel('umaros-config')` for <200ms broadcast sync
 * and automatically falls back to 10s HTTP polling on `/api/sync/customizations/latest`
 * if Supabase Realtime disconnects or is unconfigured on Cloudflare Pages.
 */
export function useUmarOsLiveConfig(
  options?: {
    pollUrl?: string;
    latestUrl?: string;
    url?: string;
    initialConfig?: Partial<UmarOsCustomizationConfig>;
    platform?: string;
    autoInjectCss?: boolean;
    autoConnect?: boolean;
    [key: string]: unknown;
  }
): UseUmarOsLiveConfigResult {
  const rawUrl = options?.latestUrl || options?.pollUrl || options?.url || "/api/sync/customizations/latest";
  const pollUrl = rawUrl.endsWith("/api/sync/customizations") ? `${rawUrl}/latest` : rawUrl;

  const [config, setConfig] = useState<UmarOsCustomizationConfig>(() =>
    mergeConfig(loadCachedConfig(), options?.initialConfig)
  );
  const [connectionState, setConnectionState] = useState<
    "REALTIME_CONNECTED" | "POLLING_FALLBACK" | "CONNECTING"
  >("CONNECTING");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const applyIncomingConfig = useCallback((incoming: Partial<UmarOsCustomizationConfig>) => {
    setConfig((prev) => {
      const merged = mergeConfig(prev, incoming);
      saveCachedConfig(merged);
      if (typeof document !== "undefined") {
        document.documentElement.style.setProperty("--ok-primary", merged.brand.primaryColor);
        document.documentElement.style.setProperty("--ok-accent", merged.brand.accentColor);
      }
      return merged;
    });
    setLastSyncedAt(new Date().toISOString());
  }, []);

  const fetchLatestSnapshot = useCallback(async () => {
    if (typeof window === "undefined" && typeof fetch === "undefined") return;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(pollUrl, {
        method: "GET",
        headers: { Accept: "application/json", "Cache-Control": "no-cache" },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) return;
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) return;

      const data = await res.json();
      const payload = (data?.config || data?.data || data?.state || data) as Partial<UmarOsCustomizationConfig>;
      if (payload && (payload.brand || payload.economics || payload.features || payload.version)) {
        if (isMountedRef.current) {
          applyIncomingConfig(payload);
        }
      }
    } catch {
      // Silent fallback to cached config when offline or endpoint not mounted
    }
  }, [pollUrl, applyIncomingConfig]);

  const startPollingFallback = useCallback(() => {
    if (pollTimerRef.current) return;
    setConnectionState("POLLING_FALLBACK");
    void fetchLatestSnapshot();
    pollTimerRef.current = setInterval(() => {
      void fetchLatestSnapshot();
    }, POLL_INTERVAL_MS);
  }, [fetchLatestSnapshot]);

  const stopPollingFallback = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void fetchLatestSnapshot();

    const client = getSupabaseRealtimeClient();
    if (!client) {
      startPollingFallback();
      return () => {
        isMountedRef.current = false;
        stopPollingFallback();
      };
    }

    const channel = client
      .channel(CHANNEL_NAME)
      .on("broadcast", { event: "CONFIG_UPDATED" }, (event) => {
        if (!isMountedRef.current) return;
        const payload = event.payload as Partial<UmarOsCustomizationConfig>;
        if (payload) {
          applyIncomingConfig(payload);
        }
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "umaros_customizations" },
        (change) => {
          if (!isMountedRef.current) return;
          const nextRow = change.new as { config_json?: Partial<UmarOsCustomizationConfig> };
          if (nextRow?.config_json) {
            applyIncomingConfig(nextRow.config_json);
          }
        }
      )
      .subscribe((status) => {
        if (!isMountedRef.current) return;
        if (status === "SUBSCRIBED") {
          stopPollingFallback();
          setConnectionState("REALTIME_CONNECTED");
        } else if (
          status === "CLOSED" ||
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT"
        ) {
          startPollingFallback();
        }
      });

    channelRef.current = channel;

    const handleOnline = () => {
      void fetchLatestSnapshot();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
    }

    return () => {
      isMountedRef.current = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
      }
      stopPollingFallback();
      if (channelRef.current && client) {
        void client.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [applyIncomingConfig, fetchLatestSnapshot, startPollingFallback, stopPollingFallback]);

  return {
    config,
    connectionState,
    lastSyncedAt,
    forceRefresh: fetchLatestSnapshot,
    state: config,
    isSynced: connectionState === "REALTIME_CONNECTED",
    status:
      connectionState === "REALTIME_CONNECTED"
        ? "connected"
        : connectionState === "CONNECTING"
        ? "connecting"
        : "reconnecting",
    error: null,
  };
}