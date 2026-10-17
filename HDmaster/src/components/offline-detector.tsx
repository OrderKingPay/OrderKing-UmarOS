import { useEffect, useState, useCallback, useRef } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";

export const DISMISS_STORAGE_KEY = "hdmaster_offline_banner_dismissed";

/**
 * Truth Gate Active Network Connectivity Probe
 * Never falsely triggers offline when the user is online.
 * Probes zero-cost /api/ping (or fallback /api/health) with a lightweight HEAD/GET check.
 */
export async function probeNetwork(timeoutMs: number = 3000): Promise<boolean> {
  // If the browser natively reports offline, check if probe can disprove it
  const isNavOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Try /api/ping first (zero-cost static 200 pong)
      let res = await fetch("/api/ping", {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal,
      }).catch(() => null);

      // Fallback to /api/health or root origin probe if /api/ping is not yet deployed
      if (!res || res.status === 404) {
        res = await fetch("/api/health", {
          method: "HEAD",
          cache: "no-store",
          signal: controller.signal,
        }).catch(() => null);
      }

      // Any HTTP response code (200, 204, 304, 400, 404, 500) confirms active network connectivity to the server
      if (res && res.status > 0) {
        return true;
      }
    } finally {
      clearTimeout(timeoutId);
    }
  } catch {
    // Network error during probe
  }

  // If active probe failed or timed out, but navigator says online, trust online state
  // (Prevents transient edge cold-starts or backend timeouts from false-alarming as offline)
  return isNavOnline;
}

export function OfflineDetector() {
  // Offline banner permanently silenced: operating strictly in silent zero-lag mode
  return null;
}

