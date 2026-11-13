import { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
export function OfflineDetector() {
  const [offline, setOffline] = useState(false);
  const checkConnectivity = async () => {
    if (typeof window === "undefined") return;
    if (navigator.onLine) {
      setOffline(false);
      return;
    }
    try {
      const res = await fetch(window.location.origin + "/manifest.json", {
        method: "HEAD",
        cache: "no-store",
      });
      if (res.ok) {
        setOffline(false);
        return;
      }
    } catch {}
    setOffline(true);
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
