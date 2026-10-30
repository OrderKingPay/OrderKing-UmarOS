import { useEffect, useState } from "react";
import { WifiOff, RefreshCw, X } from "lucide-react";

export const DISMISS_STORAGE_KEY = "hdmaster_offline_banner_dismissed";

/**
 * Truth Gate Network Prober for Umar OS / HDmaster.
 * Probes the backend host via active HTTP HEAD/GET requests while respecting navigator.onLine truth.
 */
export async function probeNetwork(timeoutMs = 1500): Promise<boolean> {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const res = await fetch("/api/ping", {
      method: "HEAD",
      cache: "no-store",
      signal: controller?.signal,
    });

    if (res.status === 404) {
      const healthRes = await fetch("/api/health", {
        method: "GET",
        cache: "no-store",
        signal: controller?.signal,
      });
      return healthRes.status >= 200 && healthRes.status < 600;
    }

    return res.status >= 200 && res.status < 600;
  } catch {
    // If active probe failed (proxy blip or cold start), check navigator.onLine as truth fallback
    if (typeof navigator !== "undefined" && navigator.onLine) {
      return true;
    }
    return false;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function OfflineDetector() {
  const [offline, setOffline] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return (
          sessionStorage.getItem(DISMISS_STORAGE_KEY) === "true" ||
          localStorage.getItem(DISMISS_STORAGE_KEY) === "true"
        );
      } catch {
        return false;
      }
    }
    return false;
  });

  const checkConnectivity = async () => {
    if (typeof window === "undefined") return;
    const isOnline = await probeNetwork(2000);
    setOffline(!isOnline);
    if (isOnline) {
      try {
        sessionStorage.removeItem(DISMISS_STORAGE_KEY);
        localStorage.removeItem(DISMISS_STORAGE_KEY);
      } catch {}
      setDismissed(false);
    }
  };

  useEffect(() => {
    void checkConnectivity();
    const onOnline = () => {
      setOffline(false);
      try {
        sessionStorage.removeItem(DISMISS_STORAGE_KEY);
        localStorage.removeItem(DISMISS_STORAGE_KEY);
      } catch {}
      setDismissed(false);
    };
    const onOffline = () => void checkConnectivity();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_STORAGE_KEY, "true");
      localStorage.setItem(DISMISS_STORAGE_KEY, "true");
    } catch {}
  };

  if (!offline || dismissed) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-amber-600/30 bg-amber-950/95 px-4 py-2 text-xs font-semibold text-amber-200 backdrop-blur-md"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="size-4 text-amber-400 shrink-0" />
        <span>Network connection interrupted. Operating in resilient cache mode.</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void checkConnectivity()}
          className="inline-flex items-center gap-1 rounded-lg bg-amber-500/20 border border-amber-400/40 px-2.5 py-1 text-[11px] font-bold text-amber-200 hover:bg-amber-500/30 cursor-pointer"
        >
          <RefreshCw className="size-3" />
          <span>Retry</span>
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-md text-amber-300 hover:text-white hover:bg-amber-800/50 cursor-pointer"
          aria-label="Dismiss offline banner"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
