import { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  Bike,
  Phone,
  Maximize2,
  Minimize2,
  Clock,
  Store,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface CourierRadarMapProps {
  orderNumber: string;
  orderState: string; // "READY" | "RIDER_ASSIGNED" | "ARRIVED_AT_OUTLET" | "PICKED_UP" | "ON_THE_WAY" | string
  customerArea?: string | null;
  riderName?: string;
  riderPhone?: string;
  riderVehicle?: string;
  riderRating?: number;
  riderTrips?: number;
  outletName?: string;
  outletCoords?: { lat: number; lng: number };
  initialRiderDistanceMeters?: number;
  initialEtaMinutes?: number;
  compact?: boolean;
  className?: string;
  onOpenHandoverModal?: () => void;
}

export function CourierRadarMap({
  orderNumber,
  orderState,
  customerArea = "Customer Delivery",
  riderName = "Rajesh Kumar",
  riderPhone = "+91 98765 43210",
  riderVehicle = "Hero Electric DL-01-EQ-3841",
  riderRating = 4.92,
  riderTrips = 1420,
  outletName = "Restaurant Outlet",
  outletCoords = { lat: 28.6329, lng: 77.2195 },
  initialRiderDistanceMeters,
  initialEtaMinutes,
  compact = false,
  className,
  onOpenHandoverModal,
}: CourierRadarMapProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [liveModalOpen, setLiveModalOpen] = useState(false);

  const isArrived = orderState === "ARRIVED_AT_OUTLET";
  const isPickedUp = ["PICKED_UP", "ON_THE_WAY"].includes(orderState);

  const defaultDistance = isArrived ? 25 : isPickedUp ? 1200 : 350;
  const defaultEta = isArrived ? 0 : isPickedUp ? 7 : 2;

  const [distanceMeters, setDistanceMeters] = useState<number>(
    initialRiderDistanceMeters ?? defaultDistance
  );
  const [etaMinutes, setEtaMinutes] = useState<number>(
    initialEtaMinutes ?? defaultEta
  );

  useEffect(() => {
    if (isArrived) {
      setDistanceMeters(20);
      setEtaMinutes(0);
      return;
    }

    if (isPickedUp) {
      const interval = setInterval(() => {
        setDistanceMeters((prev) => Math.max(100, prev + 15));
      }, 5000);
      return () => clearInterval(interval);
    }

    const interval = setInterval(() => {
      setDistanceMeters((prev) => {
        if (prev <= 40) {
          setEtaMinutes(0);
          return 25;
        }
        const next = Math.max(25, prev - 18);
        setEtaMinutes(Math.max(1, Math.ceil(next / 160)));
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isArrived, isPickedUp]);

  const progressFraction = useMemo(() => {
    if (isArrived) return 0.95;
    if (isPickedUp) return 0.2;
    const norm = Math.min(1, Math.max(0, 1 - (distanceMeters - 25) / 775));
    return norm;
  }, [distanceMeters, isArrived, isPickedUp]);

  const riderCoords = useMemo(() => {
    if (isArrived) {
      return {
        lat: outletCoords.lat + 0.00018,
        lng: outletCoords.lng - 0.00015,
      };
    }
    if (isPickedUp) {
      return {
        lat: outletCoords.lat + progressFraction * 0.008,
        lng: outletCoords.lng + progressFraction * 0.012,
      };
    }
    return {
      lat: outletCoords.lat - (1 - progressFraction) * 0.0062,
      lng: outletCoords.lng - (1 - progressFraction) * 0.0094,
    };
  }, [outletCoords, progressFraction, isArrived, isPickedUp]);

  function handleCallRider() {
    toast.info(`Calling delivery partner ${riderName} (${riderPhone})...`);
    if (typeof window !== "undefined") {
      window.open(`tel:${riderPhone.replace(/\s+/g, "")}`, "_self");
    }
  }

  const osmBbox = useMemo(() => {
    const minLat = Math.min(outletCoords.lat, riderCoords.lat) - 0.003;
    const maxLat = Math.max(outletCoords.lat, riderCoords.lat) + 0.003;
    const minLng = Math.min(outletCoords.lng, riderCoords.lng) - 0.004;
    const maxLng = Math.max(outletCoords.lng, riderCoords.lng) + 0.004;
    return `${minLng.toFixed(5)}%2C${minLat.toFixed(5)}%2C${maxLng.toFixed(5)}%2C${maxLat.toFixed(5)}`;
  }, [outletCoords, riderCoords]);

  const statusText = isArrived
    ? "Arrived at outlet"
    : isPickedUp
      ? "Out for delivery to customer"
      : "On the way to outlet";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-sm transition-all",
        className
      )}
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/70 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-red-50 text-[#E23744] border border-red-100">
            <Bike className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-900">
                Delivery Partner Tracking
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                  isArrived
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : isPickedUp
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                )}
              >
                {statusText}
              </span>
            </div>
            <div className="text-[11px] text-gray-500">
              Order #{orderNumber} · {customerArea}
            </div>
          </div>
        </div>

        {/* Distance & ETA Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-800 shadow-xs">
            <Clock className="size-3.5 text-[#E23744]" />
            <span>
              {isArrived
                ? "At Outlet"
                : `${distanceMeters < 1000 ? `${distanceMeters}m` : `${(distanceMeters / 1000).toFixed(1)}km`} · ${etaMinutes}m ETA`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition shadow-xs"
            title={isExpanded ? "Collapse Map" : "Expand Map"}
          >
            {isExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
        </div>
      </div>

      {/* Interactive Map Viewport */}
      {isExpanded && (
        <div className="relative h-[200px] sm:h-[240px] w-full bg-gray-100 overflow-hidden select-none border-b border-gray-100">
          <iframe
            title="Delivery Partner Live Road Map"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${osmBbox}&layer=mapnik&marker=${riderCoords.lat.toFixed(5)}%2C${riderCoords.lng.toFixed(5)}`}
            className="h-full w-full border-0"
            loading="lazy"
          />

          {/* Floating Location Overlay */}
          <div className="absolute top-2.5 left-3 flex flex-col gap-1.5 pointer-events-none">
            <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-gray-800 shadow-sm backdrop-blur-xs">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Rider Location: {isArrived ? "At Restaurant" : `${distanceMeters}m away`}</span>
            </div>
          </div>

          <div className="absolute top-2.5 right-3 pointer-events-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLiveModalOpen(true)}
              className="border-gray-200 bg-white/95 hover:bg-white text-gray-800 text-[11px] font-semibold h-7 px-2.5 rounded-lg shadow-sm backdrop-blur-xs"
            >
              <Maximize2 className="mr-1 size-3" />
              Full Map
            </Button>
          </div>
        </div>
      )}

      {/* Delivery Partner Profile & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 text-xs bg-white">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 border border-gray-200">
            <Bike className="size-5 text-[#E23744]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm">{riderName}</span>
              <span className="flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                ★ {riderRating}
              </span>
              <span className="text-[11px] text-gray-500">
                {riderTrips}+ deliveries
              </span>
            </div>
            <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
              <span>{riderVehicle}</span>
              <span>·</span>
              <span className="text-gray-600 font-medium">OrderKing Delivery Fleet</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            size="sm"
            type="button"
            variant="outline"
            onClick={handleCallRider}
            className="border-gray-300 bg-white text-gray-800 hover:bg-gray-50 text-xs font-semibold h-9 px-3 rounded-xl shadow-xs"
          >
            <Phone className="mr-1.5 size-3.5 text-emerald-600" />
            Call Delivery Partner
          </Button>

          {onOpenHandoverModal && (
            <Button
              size="sm"
              type="button"
              onClick={onOpenHandoverModal}
              className="bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs"
            >
              <CheckCircle2 className="mr-1.5 size-3.5" />
              Handover Order
            </Button>
          )}
        </div>
      </div>

      {/* Full Map Modal */}
      {liveModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label={`Live Tracking for Order #${orderNumber}`}
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-gray-200 bg-white text-gray-900 shadow-2xl space-y-4 p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-red-50 text-[#E23744] border border-red-100">
                  <Bike className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Live Delivery Partner Location
                  </h3>
                  <p className="text-xs text-gray-500">
                    Order #{orderNumber} · {customerArea}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLiveModalOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              >
                ✕
              </button>
            </div>

            <div className="relative h-[260px] sm:h-[320px] w-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-100">
              <iframe
                title="Interactive Road Map"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${osmBbox}&layer=mapnik&marker=${riderCoords.lat.toFixed(5)}%2C${riderCoords.lng.toFixed(5)}`}
                className="h-full w-full border-0"
                loading="lazy"
              />

              <div className="absolute top-3 left-3 flex items-center gap-2 rounded-xl border border-gray-200 bg-white/95 px-3 py-1.5 text-xs font-bold text-gray-800 shadow-md backdrop-blur-xs">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  {isArrived
                    ? "Rider arrived at outlet"
                    : `${distanceMeters < 1000 ? `${distanceMeters}m` : `${(distanceMeters / 1000).toFixed(1)}km`} away · ${etaMinutes}m ETA`}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div>
                <div className="font-bold text-sm text-gray-900">{riderName}</div>
                <div className="text-xs text-gray-500">
                  {riderVehicle} · {riderPhone}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCallRider}
                  className="border-gray-300 bg-white text-gray-800 hover:bg-gray-50 text-xs font-semibold h-10 px-4 rounded-xl"
                >
                  <Phone className="mr-1.5 size-3.5 text-emerald-600" />
                  Call Rider
                </Button>
                <Button
                  size="sm"
                  onClick={() => setLiveModalOpen(false)}
                  className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold h-10 px-4 rounded-xl"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
