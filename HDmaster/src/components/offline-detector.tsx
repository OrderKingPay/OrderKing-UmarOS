import { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";

export const DISMISS_STORAGE_KEY = "hdmaster_offline_banner_dismissed";

export async function probeNetwork(timeoutMs: number = 1000): Promise<boolean> {
  const isOnlineNavigator = typeof navigator !== "undefined" ? navigator.onLine : true;

  try {
    let controller: AbortController | undefined;
    let timer: any;
    if (typeof AbortController !== "undefined") {
      controller = new AbortController();
      timer = setTimeout(() => controller?.abort(), timeoutMs);
    }

    try {
      const res = await fetch("/api/ping", {
        method: "HEAD",
        cache: "no-store",
        signal: controller?.signal,
      });
      if (res.status === 404) {
        await fetch("/api/health", {
          method: "GET",
          cache: "no-store",
          signal: controller?.signal,
        });
      }
      return true;
    } finally {
      if (timer) clearTimeout(timer);
    }
  } catch {
    if (isOnlineNavigator) {
      return true;
    }
    return false;
  }
}

export function OfflineDetector() {
  const [offline, setOffline] = useState(false);

  const checkConnectivity = async () => {
    if (typeof window === "undefined") return;
    const isReachable = await probeNetwork(1500);
    setOffline(!isReachable);
  };

  useEffect(() => {
    void checkConnectivity();
    const onOnline = () => setOffline(false);
    const onOffline = () => void checkConnectivity();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-orange-600/30 bg-orange-950/95 px-4 py-2 text-xs font-semibold text-orange-200 backdrop-blur-md"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="size-4 text-orange-400 shrink-0" />
        <span>Network connection interrupted. Operating in resilient cache mode.</span>
      </div>
      <button
        type="button"
        onClick={() => void checkConnectivity()}
        className="inline-flex items-center gap-1 rounded-lg bg-orange-500/20 border border-orange-400/40 px-2.5 py-1 text-[11px] font-bold text-orange-200 hover:bg-orange-500/30 cursor-pointer"
      >
        <RefreshCw className="size-3" />
        <span>Retry</span>
      </button>
    </div>
  );
}
