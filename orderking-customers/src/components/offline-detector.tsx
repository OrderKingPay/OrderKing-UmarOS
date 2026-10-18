
import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineDetector() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex items-center justify-center gap-2 border-b border-amber-600/30 bg-amber-950 px-4 py-2 text-center text-xs font-semibold text-amber-200 shadow-md backdrop-blur-sm"
    >
      <WifiOff className="size-4 text-amber-400 shrink-0 animate-pulse" />
      <span>
        No Internet Connection. OrderKing is operating in resilient low-network offline cache mode.
      </span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="ml-2 rounded bg-amber-800/80 hover:bg-amber-700 px-2 py-0.5 text-[10px] uppercase font-bold text-white transition"
      >
        Retry
      </button>
    </div>
  );
}

