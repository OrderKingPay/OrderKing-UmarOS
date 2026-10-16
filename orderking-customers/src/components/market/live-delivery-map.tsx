import { useState, useEffect, Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { ExternalLink, Layers, Navigation, Sparkles } from "lucide-react";
import { formatPaise } from "@/lib/money";
import { lazyWithRetry } from "@/lib/lazy-retry";
import { ErrorBoundary } from "@/components/error-boundary";

const LazyLiveTrackingMap = lazyWithRetry(
  () => import("@/components/tracking/live-tracking-map"),
  "LiveTrackingMap"
);
import { ResilientLiveMap } from "@/components/tracking/resilient-live-map";

const hasMapboxToken = Boolean(
  typeof import.meta !== "undefined" && import.meta.env?.VITE_MAPBOX_TOKEN
);

export type LiveDeliveryMapProps = {
  status: string;
  restaurantName: string;
  orderId?: string;
  dispatchJobId?: string;
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
  orderId,
  dispatchJobId,
  restaurantLat = 22.5726,
  restaurantLng = 88.3639,
  deliveryLat = 22.585,
  deliveryLng = 88.375,
  riderName = "Delivery Partner",
  riderVehicle = "Electric Scooter",
  deliveryAddress = "Customer Location",
  riderProgressOverride,
  etaOverride,
}: LiveDeliveryMapProps) {
  const [riderProgress, setRiderProgress] = useState(0.35);
  const [viewMode, setViewMode] = useState<"3d_vector" | "2d_route">("3d_vector");

  const effectiveJobId = dispatchJobId || orderId || "demo-job";
  const isActiveDelivery = ["RIDER_ASSIGNED", "PICKED_UP", "ON_THE_WAY"].includes(status);
  const isDelivered = status === "DELIVERED";

  // Simulate smooth GPS heartbeat movement along route
  useEffect(() => {
    if (!isActiveDelivery || riderProgressOverride !== undefined) return;
    const interval = setInterval(() => {
      setRiderProgress((prev) => (prev >= 0.95 ? 0.95 : prev + 0.05));
    }, 4000);
    return () => clearInterval(interval);
  }, [isActiveDelivery, riderProgressOverride]);

  const currentProgress = riderProgressOverride !== undefined ? Math.min(0.95, riderProgressOverride) : riderProgress;

  if (!isActiveDelivery && !isDelivered) {
    return null;
  }

  // Estimated arrival based on status & progress
  const etaMinutes = isDelivered ? 0 : (etaOverride ?? Math.max(2, Math.round((1 - currentProgress) * 22)));

  return (
    <div className="mt-6 overflow-hidden rounded-[var(--radius-xl)] border border-amber-400/50 bg-surface shadow-md">
      {/* Live Map Header with 3D/2D Mode Toggle and Fullscreen Link */}
      <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-amber-500/10 via-surface to-emerald-500/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
          </span>
          <div>
            <span className="text-sm font-extrabold text-fg flex items-center gap-1.5">
              <span>Live 3D Telemetry &amp; Vector Tracking</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-black text-emerald-700 dark:text-emerald-300 uppercase">
                60 FPS
              </span>
            </span>
            <p className="text-[10px] text-muted">Real-time GPS coordinates &amp; scooter interpolation</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode switch */}
          <div className="flex rounded-lg border border-border bg-surface-2 p-0.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setViewMode("3d_vector")}
              className={`px-2 py-0.5 rounded-md transition ${
                viewMode === "3d_vector" ? "bg-amber-500 text-white shadow-2xs" : "text-muted hover:text-fg"
              }`}
            >
              3D Map
            </button>
            <button
              type="button"
              onClick={() => setViewMode("2d_route")}
              className={`px-2 py-0.5 rounded-md transition ${
                viewMode === "2d_route" ? "bg-amber-500 text-white shadow-2xs" : "text-muted hover:text-fg"
              }`}
            >
              Route
            </button>
          </div>

          <span className="text-xs font-black text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg">
            {isDelivered ? "Delivered" : `ETA: ~${etaMinutes} mins`}
          </span>
        </div>
      </div>

      {/* Main Map Viewport */}
      {viewMode === "3d_vector" ? (
        hasMapboxToken ? (
          <div className="relative h-64 sm:h-72 w-full bg-zinc-950">
            <ErrorBoundary inline sectionName="3D Live Telemetry Map">
              <Suspense
                fallback={
                  <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-950 text-white/70 animate-pulse">
                    <div className="size-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-xs font-mono uppercase tracking-widest text-emerald-400">Loading Satellite Mapbox 3D…</p>
                  </div>
                }
              >
                <LazyLiveTrackingMap
                  dispatchJobId={effectiveJobId}
                  initialLat={restaurantLat}
                  initialLng={restaurantLng}
                />
              </Suspense>
            </ErrorBoundary>

            {/* Fullscreen CTA Overlay Link */}
            {effectiveJobId && (
              <div className="absolute bottom-3 right-3 z-10">
                <Link
                  to="/tracking/$dispatchJobId"
                  params={{ dispatchJobId: effectiveJobId }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-xs font-black text-white shadow-lg shadow-orange-500/30 hover:brightness-110 active:scale-95 transition-all no-underline"
                >
                  <Navigation className="size-3.5 stroke-[2.5]" />
                  <span>Open Fullscreen 3D Map</span>
                  <ExternalLink className="size-3" />
                </Link>
              </div>
            )}
          </div>
        ) : (
          <ResilientLiveMap
            restaurant={{ lat: restaurantLat, lng: restaurantLng, label: restaurantName }}
            customer={{ lat: deliveryLat, lng: deliveryLng, label: deliveryAddress }}
            rider={{
              lat: restaurantLat + (deliveryLat - restaurantLat) * currentProgress,
              lng: restaurantLng + (deliveryLng - restaurantLng) * currentProgress,
              label: riderName,
            }}
            status={status}
            etaMinutes={etaMinutes}
          />
        )
      ) : (
        /* 2D Vector Route Simulation */
        <div className="relative h-44 w-full bg-surface/95 p-4 text-fg">
          {/* Road Track Line */}
          <div className="absolute left-8 right-8 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-stone-300 dark:bg-stone-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-1000 ease-out"
              style={{ width: `${isDelivered ? 100 : currentProgress * 100}%` }}
            />
          </div>

          {/* Restaurant Pin */}
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white shadow-md">
              🍳
            </div>
            <span className="mt-1 block max-w-[70px] truncate text-[10px] text-muted font-medium">
              {restaurantName}
            </span>
          </div>

          {/* Rider Live Moving Marker */}
          {!isDelivered && (
            <div
              className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-out"
              style={{ left: `calc(2rem + ${currentProgress * 75}%)` }}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white shadow-lg animate-bounce">
                🛵
              </div>
              <span className="mt-1 block -translate-x-3 text-[10px] font-bold text-emerald-600">
                Rider
              </span>
            </div>
          )}

          {/* Destination Customer Pin */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-white shadow-md ${
                isDelivered ? "bg-emerald-600" : "bg-stone-700"
              }`}
            >
              📍
            </div>
            <span className="mt-1 block max-w-[70px] truncate text-[10px] text-muted font-medium">
              You
            </span>
          </div>
        </div>
      )}

      {/* Rider Partner Contact Card */}
      <div className="flex items-center justify-between p-4 bg-surface-2/40 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/15 text-lg">
            🛵
          </div>
          <div>
            <p className="font-bold text-xs text-fg">{riderName}</p>
            <p className="text-[11px] text-muted">{riderVehicle} • Verified Partner</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {effectiveJobId && (
            <Link
              to="/tracking/$dispatchJobId"
              params={{ dispatchJobId: effectiveJobId }}
              className="inline-flex items-center gap-1 rounded-xl bg-surface border border-border px-3 py-1.5 text-xs font-semibold text-fg hover:bg-surface-2 transition no-underline"
            >
              <span>Satellite View</span>
              <ExternalLink className="size-3 text-muted" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
