import { useEffect, useState } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";

export function OfflineDetector() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Active network connectivity probe
  const probeNetwork = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch("/api/health", {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal,
      }).catch(() => null);
      clearTimeout(timeoutId);

      if (res && (res.ok || res.status < 500)) {
        return true;
      }
    } catch {
      // Ignore network errors during probe
    }
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  };

  useEffect(() => {
    let isMounted = true;

    const checkAndSetOnline = async () => {
      const isReachable = await probeNetwork();
      if (!isMounted) return;

      if (isReachable) {
        setOnline((prev) => {
          if (!prev) {
            setWasOffline(true);
            setTimeout(() => {
              if (isMounted) setWasOffline(false);
            }, 3000);
          }
          return true;
        });
      } else {
        setOnline(false);
      }
    };

    const handleOnline = () => {
      checkAndSetOnline();
    };

    const handleOffline = () => {
      setOnline(false);
    };

    // Initial probe
    checkAndSetOnline();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Periodic auto-recovery probe every 10s when offline
    const interval = setInterval(() => {
      if (!online) {
        checkAndSetOnline();
      }
    }, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [online]);

  const handleRetry = async () => {
    setIsChecking(true);
    const isReachable = await probeNetwork();
    setIsChecking(false);

    if (isReachable) {
      setOnline(true);
      setWasOffline(true);
      setTimeout(() => setWasOffline(false), 3000);
    } else {
      // If still unreachable, try a soft location reload
      window.location.reload();
    }
  };

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
    <div className="fixed inset-x-0 top-0 z-[9999] flex items-center justify-between gap-3 bg-amber-600/95 px-4 py-1.5 text-xs font-semibold text-white shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-2 mx-auto">
        <WifiOff className="size-3.5 shrink-0 animate-pulse text-amber-200" />
        <span>You are offline — Operating in Local Zero-Lag Cache Mode</span>
        <button
          type="button"
          onClick={handleRetry}
          disabled={isChecking}
          className="inline-flex items-center gap-1 rounded bg-white/20 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-white/30 transition disabled:opacity-50 ml-2"
        >
          <RefreshCw className={`size-3 ${isChecking ? "animate-spin" : ""}`} />
          <span>{isChecking ? "Checking..." : "Retry"}</span>
        </button>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-amber-200 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-white/10 transition"
        title="Dismiss banner"
      >
        ✕
      </button>
    </div>
  );
}
