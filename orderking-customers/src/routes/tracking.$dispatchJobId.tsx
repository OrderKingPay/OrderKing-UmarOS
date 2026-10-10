
import { lazy, Suspense, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/db-cloud";

const LazyLiveTrackingMap = lazy(() =>
  import("@/components/tracking/live-tracking-map").then((m) => ({ default: m.LiveTrackingMap }))
);

function TrackingMapSkeleton() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-950 text-white/70 animate-pulse">
      <div className="h-10 w-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-xs font-mono uppercase tracking-widest text-emerald-400">Connecting Satellite Telemetry…</p>
      <p className="text-[11px] text-zinc-500 mt-1">Streaming dispatch vector over 3G network</p>
    </div>
  );
}

type TrackingPosition = { lat: number; lng: number };

export const Route = createFileRoute("/tracking/$dispatchJobId")({
  component: TrackingRoute,
});

function TrackingRoute() {
  const { dispatchJobId } = Route.useParams() as { dispatchJobId: string };
  const [position, setPosition] = useState<TrackingPosition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadInitialPosition = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("orders")
        .select("rider_lat,rider_lng,restaurant_lat,restaurant_lng")
        .eq("id", dispatchJobId)
        .maybeSingle();

      if (cancelled) return;

      const riderLat = Number(data?.rider_lat);
      const riderLng = Number(data?.rider_lng);
      const restaurantLat = Number(data?.restaurant_lat);
      const restaurantLng = Number(data?.restaurant_lng);

      if (Number.isFinite(riderLat) && Number.isFinite(riderLng)) {
        setPosition({ lat: riderLat, lng: riderLng });
      } else if (Number.isFinite(restaurantLat) && Number.isFinite(restaurantLng)) {
        setPosition({ lat: restaurantLat, lng: restaurantLng });
      } else {
        setPosition(null);
      }

      setLoading(false);
    };

    void loadInitialPosition();
    return () => {
      cancelled = true;
    };
  }, [dispatchJobId]);

  return (
    <div className="relative w-full h-dvh bg-black flex flex-col">
      <div className="absolute top-0 left-0 w-full p-4 z-10 flex items-center gap-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <Link to="/" className="pointer-events-auto p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur">
          <ArrowLeft className="w-5 h-5 text-fg" />
        </Link>
        <h1 className="text-fg font-semibold text-lg tracking-wide drop-shadow-md">
          Live Tracking <span className="text-primary ml-2 text-sm uppercase">Live Realtime</span>
        </h1>
      </div>

      <div className="flex-1 w-full relative">
        {position ? (
          <Suspense fallback={<TrackingMapSkeleton />}>
            <LazyLiveTrackingMap
              dispatchJobId={dispatchJobId}
              initialLat={position.lat}
              initialLng={position.lng}
            />
          </Suspense>
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-fg/80">
            {loading
              ? "Loading live tracking…"
              : "Live rider location is not available yet. Tracking will start when verified telemetry arrives."}
          </div>
        )}
      </div>
    </div>
  );
}
