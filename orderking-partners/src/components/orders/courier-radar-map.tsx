import { useState, useMemo } from "react";
import {
  Bike,
  Phone,
  Maximize2,
  Minimize2,
  Clock,
  CheckCircle2,
  Star,
  X,
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
  riderCoords?: { lat: number; lng: number } | null;
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
  riderName,
  riderPhone,
  riderVehicle = "Dispatch Vehicle",
  riderRating,
  riderTrips,
  outletName = "Restaurant Outlet",
  outletCoords = { lat: 28.6329, lng: 77.2195 },
  riderCoords = null,
  initialRiderDistanceMeters,
  initialEtaMinutes,
  compact = false,
  className,
  onOpenHandoverModal,
}: CourierRadarMapProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [liveModalOpen, setLiveModalOpen] = useState(false);

  const isReadyUnassigned = orderState === "READY";
  const isArrived = orderState === "ARRIVED_AT_OUTLET";
  const isPickedUp = ["PICKED_UP", "ON_THE_WAY"].includes(orderState);

  const displayRiderName =
    riderName || (isReadyUnassigned ? "Awaiting Rider Assignment" : "Assigned Delivery Partner");

  const hasLiveGps = Boolean(
    riderCoords && Number.isFinite(riderCoords.lat) && Number.isFinite(riderCoords.lng)
  );
  const markerCoords = hasLiveGps && riderCoords ? riderCoords : outletCoords;

  const hasLiveDistance =
    typeof initialRiderDistanceMeters === "number" && Number.isFinite(initialRiderDistanceMeters);
  const hasLiveEta = typeof initialEtaMinutes === "number" && Number.isFinite(initialEtaMinutes);

  function handleCallRider() {
    if (!riderPhone) {
      toast.info("Delivery partner contact will appear once a rider accepts dispatch.");
      return;
    }
    toast.info(`Calling delivery partner ${displayRiderName} (${riderPhone})...`);
    if (typeof window !== "undefined") {
      window.open(`tel:${riderPhone.replace(/\s+/g, "")}`, "_self");
    }
  }

  const osmBbox = useMemo(() => {
    const minLat = Math.min(outletCoords.lat, markerCoords.lat) - 0.003;
    const maxLat = Math.max(outletCoords.lat, markerCoords.lat) + 0.003;
    const minLng = Math.min(outletCoords.lng, markerCoords.lng) - 0.004;
    const maxLng = Math.max(outletCoords.lng, markerCoords.lng) + 0.004;
    return `${minLng.toFixed(5)}%2C${minLat.toFixed(5)}%2C${maxLng.toFixed(5)}%2C${maxLat.toFixed(5)}`;
  }, [outletCoords, markerCoords]);

  const statusText = isArrived
    ? "Arrived at outlet"
    : isPickedUp
      ? "Out for delivery to customer"
      : isReadyUnassigned
        ? "Searching nearby riders"
        : "On the way to outlet";

  const telemetrySummary = isArrived
    ? "At Outlet"
    : hasLiveDistance && hasLiveEta
      ? `${
          initialRiderDistanceMeters! < 1000
            ? `${Math.round(initialRiderDistanceMeters!)}m`
            : `${(initialRiderDistanceMeters! / 1000).toFixed(1)}km`
        } · ${Math.round(initialEtaMinutes!)}m ETA`
      : hasLiveGps
        ? "Live GPS Active"
        : statusText;

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
              Order #{orderNumber} · {customerArea || outletName}
            </div>
          </div>
        </div>

        {/* Distance & ETA Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-800 shadow-xs">
            <Clock className="size-3.5 text-[#E23744]" />
            <span>{telemetrySummary}</span>
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
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${osmBbox}&layer=mapnik&marker=${markerCoords.lat.toFixed(5)}%2C${markerCoords.lng.toFixed(5)}`}
            className="h-full w-full border-0"
            loading="lazy"
          />

          {/* Floating Location Overlay */}
          <div className="absolute top-2.5 left-3 flex flex-col gap-1.5 pointer-events-none">
            <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-gray-800 shadow-sm backdrop-blur-xs">
              <span
                className={cn(
                  "size-2 rounded-full",
                  hasLiveGps || isArrived ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                )}
              />
              <span>
                {isArrived
                  ? `At ${outletName}`
                  : hasLiveGps
                    ? `Live GPS · ${telemetrySummary}`
                    : `Outlet: ${outletName} · ${statusText}`}
              </span>
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
              <span className="font-bold text-gray-900 text-sm">{displayRiderName}</span>
              {riderRating != null && (
                <span className="flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                  <Star className="size-3 fill-amber-500 text-amber-500" /> {riderRating}
                </span>
              )}
              {riderTrips != null && (
                <span className="text-[11px] text-gray-500">
                  {riderTrips}+ deliveries
                </span>
              )}
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
                    Delivery Partner Location
                  </h3>
                  <p className="text-xs text-gray-500">
                    Order #{orderNumber} · {customerArea || outletName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLiveModalOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                aria-label="Close live tracking map"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="relative h-[260px] sm:h-[320px] w-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-100">
              <iframe
                title="Interactive Road Map"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${osmBbox}&layer=mapnik&marker=${markerCoords.lat.toFixed(5)}%2C${markerCoords.lng.toFixed(5)}`}
                className="h-full w-full border-0"
                loading="lazy"
              />

              <div className="absolute top-3 left-3 flex items-center gap-2 rounded-xl border border-gray-200 bg-white/95 px-3 py-1.5 text-xs font-bold text-gray-800 shadow-md backdrop-blur-xs">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    hasLiveGps || isArrived ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  )}
                />
                <span>{telemetrySummary}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div>
                <div className="font-bold text-sm text-gray-900">{displayRiderName}</div>
                <div className="text-xs text-gray-500">
                  {riderVehicle}
                  {riderPhone ? ` · ${riderPhone}` : ""}
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
