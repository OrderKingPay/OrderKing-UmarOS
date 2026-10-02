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
  riderProgressOverride?: number;
  etaOverride?: number;
};

export function LiveDeliveryMap({
  status,
  restaurantName,
  restaurantLat,
  restaurantLng,
  deliveryLat,
  deliveryLng,
  riderName = "Delivery Partner",
  riderVehicle = "Motorcycle",
  riderProgressOverride,
  etaOverride,
}: LiveDeliveryMapProps) {
  const isActiveDelivery = ["RIDER_ASSIGNED", "PICKED_UP", "ON_THE_WAY"].includes(status);
  const isDelivered = status === "DELIVERED";

  const hasVerifiedCoordinates =
    typeof restaurantLat === "number" &&
    typeof restaurantLng === "number" &&
    typeof deliveryLat === "number" &&
    typeof deliveryLng === "number";

  const hasVerifiedProgress = typeof riderProgressOverride === "number";
  const currentProgress = hasVerifiedProgress
    ? Math.min(0.95, Math.max(0, riderProgressOverride))
    : null;

  if (!isActiveDelivery && !isDelivered) {
    return null;
  }

  const etaMinutes = isDelivered ? 0 : etaOverride ?? null;
  const showLivePosition = !isDelivered && hasVerifiedCoordinates && currentProgress !== null;

  return (
    <div className="mt-6 overflow-hidden rounded-[var(--radius-xl)] border border-primary/20 bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border bg-primary/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={
              "relative flex h-3 w-3 " +
              (hasVerifiedCoordinates ? "" : "opacity-50")
            }
            aria-hidden="true"
          >
            <span
              className={
                "relative inline-flex h-3 w-3 rounded-full " +
                (hasVerifiedCoordinates ? "bg-success" : "bg-muted")
              }
            />
          </span>
          <span className="text-sm font-semibold text-fg">
            {hasVerifiedCoordinates ? "Live GPS Tracking" : "Live location unavailable"}
          </span>
        </div>
        <span className="text-xs font-medium text-muted">
          {isDelivered
            ? "Delivered"
            : etaMinutes !== null
              ? "ETA: ~" + etaMinutes + " mins"
              : "Waiting for verified ETA"}
        </span>
      </div>

      <div
        className="relative h-44 w-full bg-zinc-900/95 p-4 text-white"
        aria-label={
          hasVerifiedCoordinates
            ? "Verified delivery tracking"
            : "Delivery tracking waiting for verified location data"
        }
      >
        <div className="absolute left-8 right-8 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-zinc-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-success transition-all duration-700 ease-out"
            style={{
              width:
                (isDelivered
                  ? 100
                  : currentProgress !== null
                    ? currentProgress * 100
                    : 0) + "%",
            }}
          />
        </div>

        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md">
            🍳
          </div>
          <span className="mt-1 block max-w-[70px] truncate text-[10px] font-medium text-zinc-300">
            {restaurantName}
          </span>
        </div>

        {showLivePosition ? (
          <div
            className="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-out"
            style={{ left: "calc(2rem + " + currentProgress * 75 + "%)" }}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-success text-white shadow-lg">
              🛵
            </div>
            <span className="mt-1 block -translate-x-3 text-[10px] font-bold text-success-light">
              Rider
            </span>
          </div>
        ) : null}

        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-center">
          <div
            className={
              "flex h-8 w-8 items-center justify-center rounded-full text-white shadow-md " +
              (isDelivered ? "bg-success" : "bg-zinc-600")
            }
          >
            📍
          </div>
          <span className="mt-1 block max-w-[70px] truncate text-[10px] font-medium text-zinc-300">
            You
          </span>
        </div>
      </div>

      {!isDelivered && !hasVerifiedCoordinates ? (
        <div className="border-t border-border bg-amber-500/5 px-4 py-3 text-xs text-muted">
          Rider location will appear here after verified tracking data is received.
          No simulated movement is shown.
        </div>
      ) : null}

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
          {riderPhone ? (
            <a
              href={"tel:" + riderPhone}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20"
              title="Call Partner"
              aria-label="Call delivery partner"
            >
              📞
            </a>
          ) : (
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/10 text-muted"
              title="Partner phone unavailable"
              aria-label="Partner phone unavailable"
            >
              📞
            </span>
          )}

          <a
            href="tel:112"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20"
            title="Emergency services"
            aria-label="Call emergency services"
          >
            🛡️
          </a>
        </div>
      </div>
    </div>
  );
}
