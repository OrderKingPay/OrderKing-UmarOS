import { useEffect, useState } from "react";
import { getPartnerNetworkSpeed, type NetworkSpeed } from "@/lib/partner-low-network";
import { WifiOff, AlertTriangle } from "lucide-react";

export function OfflineBanner({ stale: _stale }: { stale?: boolean }) {
  const [speed, setSpeed] = useState<NetworkSpeed>("NORMAL");

  useEffect(() => {
    const checkSpeed = () => {
      setSpeed(getPartnerNetworkSpeed());
    };

    checkSpeed();
    window.addEventListener("online", checkSpeed);
    window.addEventListener("offline", checkSpeed);

    const navConn = (navigator as unknown as { connection?: EventTarget }).connection;
    navConn?.addEventListener?.("change", checkSpeed);

    return () => {
      window.removeEventListener("online", checkSpeed);
      window.removeEventListener("offline", checkSpeed);
      navConn?.removeEventListener?.("change", checkSpeed);
    };
  }, []);

  if (speed === "NORMAL") return null;

  if (speed === "OFFLINE") {
    return (
      <div
        role="status"
        className="sticky top-0 z-50 flex items-center justify-between gap-2 border-b border-rose-500/40 bg-rose-950 px-4 py-2 text-xs font-semibold text-rose-200 shadow-md backdrop-blur-sm"
      >
        <div className="flex items-center gap-2">
          <WifiOff className="size-4 text-rose-400 shrink-0 animate-pulse" />
          <span>
            Kitchen Wi-Fi / Mobile Network Offline. Live orders and KOT actions are queued safely in offline local storage.
          </span>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded bg-rose-800 hover:bg-rose-700 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase text-white transition shrink-0"
        >
          Reconnect
        </button>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex items-center justify-between gap-2 border-b border-amber-500/40 bg-amber-950/90 px-4 py-1.5 text-xs font-semibold text-amber-200 shadow-sm backdrop-blur-sm"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-3.5 text-amber-400 shrink-0" />
        <span>
          Slow Network (2G / EDGE) Detected. Kitchen portal is operating in low-latency cached mode.
        </span>
      </div>
      <span className="text-[10px] font-mono uppercase text-amber-400 bg-amber-900/50 px-1.5 py-0.5 rounded">
        Low-Bandwidth Mode
      </span>
    </div>
  );
}
