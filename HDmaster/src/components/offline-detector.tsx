import { useEffect, useState } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";

export function OfflineDetector() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      setWasOffline(true);
      const timer = setTimeout(() => setWasOffline(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setOnline(false);
    };

    setOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online && !wasOffline) return null;

  if (online && wasOffline) {
    return (
      <div className="fixed inset-x-0 top-0 z-[9999] flex items-center justify-center gap-2 bg-emerald-600 px-4 py-2 text-center text-xs font-bold text-white shadow-lg animate-in slide-in-from-top duration-300">
        <Wifi className="size-4 shrink-0" />
        <span>Network Restored — Connected to Umar OS Live Stream</span>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 top-0 z-[9999] flex items-center justify-center gap-3 bg-amber-600/95 px-4 py-2 text-center text-xs font-semibold text-white shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-1.5">
        <WifiOff className="size-4 shrink-0 animate-pulse text-amber-200" />
        <span>You are offline — Operating in Local Zero-Lag Cache Mode</span>
      </div>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-1 rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-white/30 transition"
      >
        <RefreshCw className="size-3" />
        <span>Retry</span>
      </button>
    </div>
  );
}
