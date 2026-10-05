
import { createFileRoute } from "@tanstack/react-router";
import { LiveTrackingMap } from "@/components/tracking/live-tracking-map";
import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useOrderSSE } from "@/lib/hooks/use-order-sse";

type TrackingPosition = { lat: number; lng: number };

export const Route = createFileRoute("/tracking/$dispatchJobId")({
  component: TrackingRoute,
});

function TrackingRoute() {
  const { dispatchJobId } = Route.useParams() as { dispatchJobId: string };
  const [position, setPosition] = useState<TrackingPosition | null>(null);
  const [loading, setLoading] = useState(true);

  const handleEvent = useCallback((event: {
    riderLat?: number;
    riderLng?: number;
  }) => {
    const riderLat = Number(event.riderLat);
    const riderLng = Number(event.riderLng);
    if (Number.isFinite(riderLat) && Number.isFinite(riderLng)) {
      setPosition({ lat: riderLat, lng: riderLng });
      setLoading(false);
    }
  }, []);

  const { lastEvent, connected, isSlowNetwork } = useOrderSSE(dispatchJobId, handleEvent);

  useEffect(() => {
    if (!lastEvent) return;
    if (
      lastEvent.riderLat == null &&
      lastEvent.riderLng == null &&
      !position
    ) {
      setLoading(false);
    }
  }, [lastEvent, position]);

  return (
    <div className="relative w-full h-dvh bg-black flex flex-col">
      <div className="absolute top-0 left-0 w-full p-4 z-10 flex items-center gap-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <Link to="/" className="pointer-events-auto p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur">
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <h1 className="text-white font-semibold text-lg tracking-wide drop-shadow-md">
          Live Tracking <span className="text-primary ml-2 text-sm uppercase">{connected ? "Live" : "Reconnecting"}</span>
        </h1>
      </div>

      <div className="flex-1 w-full relative">
        {position ? (
          <LiveTrackingMap
            dispatchJobId={dispatchJobId}
            initialLat={position.lat}
            initialLng={position.lng}
            riderLat={lastEvent?.riderLat}
            riderLng={lastEvent?.riderLng}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-white/80">
            {loading
              ? "Loading live tracking…"
              : isSlowNetwork
                ? "Network is constrained. Tracking is continuing with low-bandwidth updates."
                : "Live rider location is not available yet. Tracking will start when verified telemetry arrives."}
          </div>
        )}
      </div>
    </div>
  );
}
