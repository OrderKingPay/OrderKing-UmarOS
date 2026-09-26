import { createFileRoute } from "@tanstack/react-router";
import { LiveTrackingMap } from "@/components/tracking/live-tracking-map";
import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/tracking/$dispatchJobId" as any)({
  component: TrackingRoute,
});

function TrackingRoute() {
  const { dispatchJobId } = Route.useParams() as any;

  return (
    <div className="relative w-full h-dvh bg-black flex flex-col">
      <div className="absolute top-0 left-0 w-full p-4 z-10 flex items-center gap-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <Link to="/" className="pointer-events-auto p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur">
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <h1 className="text-white font-semibold text-lg tracking-wide drop-shadow-md">
          Live Tracking <span className="text-primary ml-2 text-sm uppercase">60 FPS Sync</span>
        </h1>
      </div>

      <div className="flex-1 w-full relative">
        <LiveTrackingMap 
          dispatchJobId={dispatchJobId} 
          initialLat={37.7749} 
          initialLng={-122.4194} 
        />
      </div>
    </div>
  );
}
