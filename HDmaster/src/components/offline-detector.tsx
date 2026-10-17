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
  const [online, setOnline] = useState<boolean>(() => {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  });
  const [wasOffline, setWasOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Persistent dismissal across route transitions and page refreshes
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return (
        sessionStorage.getItem(DISMISS_STORAGE_KEY) === "true" ||
        localStorage.getItem(DISMISS_STORAGE_KEY) === "true"
      );
    } catch {
      return false;
    }
  });

  const isMountedRef = useRef(true);

  const checkAndSetOnline = useCallback(async () => {
    const isReachable = await probeNetwork();
    if (!isMountedRef.current) return;

    if (isReachable) {
      setOnline((prev) => {
        if (!prev) {
          setWasOffline(true);
          setTimeout(() => {
            if (isMountedRef.current) setWasOffline(false);
          }, 3000);
        }
        return true;
      });
    } else {
      setOnline(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // Graceful online auto-dismissal when network restores
    const handleOnline = () => {
      setOnline(true);
      setIsChecking(false);
      setWasOffline(true);

      // Clear persistent dismiss lock so future genuine disconnections notify
      try {
        sessionStorage.removeItem(DISMISS_STORAGE_KEY);
        localStorage.removeItem(DISMISS_STORAGE_KEY);
      } catch {
        // Storage access safe
      }

      setTimeout(() => {
        if (isMountedRef.current) setWasOffline(false);
      }, 3000);
    };

    const handleOffline = () => {
      // When offline event fires, verify via active probe before alarming
      checkAndSetOnline();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial passive probe — only run if navigator indicates offline
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      checkAndSetOnline();
    }

    // Periodic check ONLY when offline to auto-recover when back online
    const interval = setInterval(() => {
      if (!online) {
        checkAndSetOnline();
      }
    }, 15000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [online, checkAndSetOnline]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_STORAGE_KEY, "true");
      localStorage.setItem(DISMISS_STORAGE_KEY, "true");
    } catch {
      // Storage access safe
    }
  };

  const handleRetry = async () => {
    setIsChecking(true);
    const isReachable = await probeNetwork(3500);
    setIsChecking(false);

    if (isReachable) {
      setOnline(true);
      setWasOffline(true);
      try {
        sessionStorage.removeItem(DISMISS_STORAGE_KEY);
        localStorage.removeItem(DISMISS_STORAGE_KEY);
      } catch {}
      setTimeout(() => {
        if (isMountedRef.current) setWasOffline(false);
      }, 3000);
    } else {
      // Soft location reload if truly disconnected
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }
  };

  // If dismissed or genuinely online with no restore toast pending, render nothing
  if (dismissed || (online && !wasOffline)) return null;

  if (online && wasOffline) {
    return (
      <div className="fixed inset-x-0 top-0 z-[9999] flex items-center justify-center gap-2 bg-emerald-600 px-4 py-1.5 text-center text-xs font-bold text-white shadow-lg animate-in slide-in-from-top duration-300">
        <Wifi className="size-4 shrink-0" />
        <span>Network Restored — Connected to Umar OS Live Stream</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[9999] flex items-center justify-between gap-3 bg-amber-600/95 px-4 py-1.5 text-xs font-semibold text-white shadow-xl backdrop-blur-md"
    >
      <div className="flex items-center gap-2 mx-auto">
        <WifiOff className="size-3.5 shrink-0 animate-pulse text-amber-200" />
        <span>You are offline — Operating in Local Zero-Lag Cache Mode</span>
        <button
          type="button"
          onClick={handleRetry}
          disabled={isChecking}
          className="inline-flex items-center gap-1 rounded bg-white/20 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-white/30 transition disabled:opacity-50 ml-2 cursor-pointer"
        >
          <RefreshCw className={`size-3 ${isChecking ? "animate-spin" : ""}`} />
          <span>{isChecking ? "Checking..." : "Retry"}</span>
        </button>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="text-amber-200 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-white/10 transition cursor-pointer"
        title="Dismiss banner"
        aria-label="Dismiss banner"
      >
        ✕
      </button>
    </div>
  );
}
