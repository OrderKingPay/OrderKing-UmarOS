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
        className="sticky top-0 z-50 flex items-center justify-between gap-2 border-b border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-900 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <WifiOff className="size-4 text-rose-600 shrink-0" />
          <span>
            Kitchen Wi-Fi / Mobile Network Offline. Live orders and KOT actions are queued safely in offline local storage.
          </span>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded bg-rose-600 hover:bg-rose-700 px-2.5 py-1 text-[11px] font-bold text-white transition shrink-0"
        >
          Reconnect
        </button>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex items-center justify-between gap-2 border-b border-orange-200 bg-orange-50 px-4 py-1.5 text-xs font-semibold text-orange-950 shadow-xs"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-3.5 text-orange-600 shrink-0" />
        <span>
          Slow Network (2G / EDGE) Detected. Kitchen portal is operating in low-latency cached mode.
        </span>
      </div>
      <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded">
        Low-Bandwidth Mode
      </span>
    </div>
  );
}
