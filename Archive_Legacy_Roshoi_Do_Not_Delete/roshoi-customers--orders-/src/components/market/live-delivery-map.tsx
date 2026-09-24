import { useState, useEffect } from "react";
import { formatPaise } from "@/lib/money";

export type LiveDeliveryMapProps = {
  status: string;
  restaurantName: string;
  restaurantLat?: number;
  restaurantLng?: number;
  deliveryLat?: number;
  deliveryLng?: number;
  riderName?: string;
  riderPhone?: string;
  riderVehicle?: string;
  deliveryAddress?: string;
};

export function LiveDeliveryMap({
  status,
  restaurantName,
  riderName = "Delivery Partner",
  riderVehicle = "Motorcycle",
  deliveryAddress = "Customer Location",
}: LiveDeliveryMapProps) {
  const [riderProgress, setRiderProgress] = useState(0.35);

  const isActiveDelivery = ["RIDER_ASSIGNED", "PICKED_UP", "ON_THE_WAY"].includes(status);
  const isDelivered = status === "DELIVERED";

  // Simulate smooth GPS heartbeat movement along route
  useEffect(() => {
    if (!isActiveDelivery) return;
    const interval = setInterval(() => {
      setRiderProgress((prev) => (prev >= 0.95 ? 0.95 : prev + 0.05));
    }, 4000);
    return () => clearInterval(interval);
  }, [isActiveDelivery]);

  if (!isActiveDelivery && !isDelivered) {
    return null;
  }

  // Estimated arrival based on status & progress
  const etaMinutes = isDelivered ? 0 : Math.max(2, Math.round((1 - riderProgress) * 22));

  return (
    <div className="mt-6 overflow-hidden rounded-[var(--radius-xl)] border border-primary/20 bg-surface shadow-sm">
      {/* Live Map Header */}
      <div className="flex items-center justify-between border-b border-border bg-primary/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-success"></span>
          </span>
          <span className="text-sm font-semibold text-fg">Live GPS Tracking</span>
        </div>
        <span className="text-xs font-medium text-muted">
          {isDelivered ? "Delivered" : `ETA: ~${etaMinutes} mins`}
        </span>
      </div>

      {/* Vector Live Route Simulation */}
      <div className="relative h-44 w-full bg-zinc-900/95 p-4 text-white">
        {/* Road Track Line */}
        <div className="absolute left-8 right-8 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-zinc-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-success transition-all duration-1000 ease-out"
            style={{ width: `${isDelivered ? 100 : riderProgress * 100}%` }}
          />
        </div>

        {/* Restaurant Pin */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md">
            🍳
          </div>
          <span className="mt-1 block max-w-[70px] truncate text-[10px] text-zinc-300 font-medium">
            {restaurantName}
          </span>
        </div>

        {/* Rider Live Moving Marker */}
        {!isDelivered && (
          <div
            className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-out"
            style={{ left: `calc(2rem + ${riderProgress * 75}%)` }}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-success text-white shadow-lg">
              🛵
            </div>
            <span className="mt-1 block -translate-x-3 text-[10px] font-bold text-success-light">
              Rider
            </span>
          </div>
        )}

        {/* Destination Customer Pin */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-center">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-white shadow-md ${isDelivered ? "bg-success" : "bg-zinc-600"}`}>
            📍
          </div>
          <span className="mt-1 block max-w-[70px] truncate text-[10px] text-zinc-300 font-medium">
            You
          </span>
        </div>
      </div>

      {/* Rider Partner Contact Card */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted/20 text-lg">
            👤
          </div>
          <div>
            <p className="font-semibold text-fg">{riderName}</p>
            <p className="text-xs text-muted">{riderVehicle} • Verified Partner</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20"
            title="Call Partner"
            onClick={() => alert(`Calling rider: ${riderName}`)}
          >
            📞
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20"
            title="Safety Emergency SOS"
            onClick={() => alert("Emergency SOS triggered. OrderKing support dispatched.")}
          >
            🛡️
          </button>
        </div>
      </div>
    </div>
  );
}
