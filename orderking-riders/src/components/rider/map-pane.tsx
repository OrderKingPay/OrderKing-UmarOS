import { useCallback, useState } from "react";
import { googleNavigationUrl, mapsUrl, getActiveNavigationTarget } from "@/lib/rider/maps";
import { haversineKm } from "@/lib/rider/eta";
import type { GeoPoint } from "@/lib/rider/types";
import { Button } from "@/components/ui/button";
import {
  Compass,
  LocateFixed,
  MapPin,
  Navigation,
  Radio,
  TrendingUp,
} from "lucide-react";

export interface DemandHotspot {
  id: string;
  name: string;
  surgeMultiplier: number;
  demandLevel: "VERY_HIGH" | "HIGH" | "NORMAL";
  activeRestaurants: number;
  lat: number;
  lng: number;
}

function isValidCoord(p?: GeoPoint | null): p is GeoPoint {
  return Boolean(
    p &&
    typeof p.lat === "number" &&
    typeof p.lng === "number" &&
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng) &&
    (p.lat !== 0 || p.lng !== 0),
  );
}

function buildOsmEmbedUrl(center: GeoPoint, delta = 0.012): string {
  const minLng = (center.lng - delta).toFixed(6);
  const minLat = (center.lat - delta * 0.72).toFixed(6);
  const maxLng = (center.lng + delta).toFixed(6);
  const maxLat = (center.lat + delta * 0.72).toFixed(6);
  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${center.lat.toFixed(6)}%2C${center.lng.toFixed(6)}`;
}

export function MapPane({
  pickup,
  drop,
  current,
  pickupLabel,
  dropLabel,
  navigateLabel = "Navigate",
  deliveryState,
  mode = "delivery",
  hotspots = [],
  onRecenter,
}: {
  pickup?: GeoPoint | null;
  drop?: GeoPoint | null;
  current?: GeoPoint | null;
  pickupLabel?: string;
  dropLabel?: string;
  navigateLabel?: string;
  deliveryState?: string | null;
  mode?: "delivery" | "heatmap";
  initialHeatmap?: boolean;
  hotspots?: ReadonlyArray<DemandHotspot>;
  onRecenter?: () => void;
}) {
  const [localGps, setLocalGps] = useState<(GeoPoint & { accuracyM?: number }) | null>(null);
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const isDeliveryMode = mode === "delivery" && Boolean(pickup || drop || deliveryState);

  const { target, isPickup, stageLabel } = getActiveNavigationTarget(
    pickup ?? null,
    drop ?? null,
    deliveryState ?? null,
  );
  const targetLabel = isPickup ? pickupLabel || "Pickup Restaurant" : dropLabel || "Customer Location";

  const activeCurrent = isValidCoord(current) ? current : isValidCoord(localGps) ? localGps : null;
  const activeTarget = isValidCoord(target) ? target : null;
  const mapCenter = activeTarget ?? activeCurrent ?? (isValidCoord(pickup) ? pickup : null) ?? (isValidCoord(drop) ? drop : null);

  const distanceToTargetKm =
    activeCurrent && activeTarget
      ? Math.round(haversineKm(activeCurrent, activeTarget) * 10) / 10
      : null;

  const routeTotalKm =
    isValidCoord(pickup) && isValidCoord(drop)
      ? Math.round(haversineKm(pickup, drop) * 10) / 10
      : null;

  const handleRecenter = useCallback(() => {
    onRecenter?.();
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setGpsError("Device GPS unavailable");
      return;
    }
    setLocating(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocalGps({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: Math.round(pos.coords.accuracy || 0),
        });
        setLocating(false);
      },
      (err) => {
        setGpsError(err.message || "GPS permission denied");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    );
  }, [onRecenter]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
      {/* Top Map Phase & GPS Bar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3.5 py-2 text-xs">
        {deliveryState ? (
          <span className="flex items-center gap-1.5 font-bold text-[#E23744]">
            <Compass className="size-3.5" />
            <span>{stageLabel}</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 font-bold text-foreground">
            <Radio className="size-3.5 text-emerald-500" />
            <span>Live GPS Map</span>
          </span>
        )}

        <div className="flex items-center gap-2">
          {distanceToTargetKm !== null && (
            <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-bold text-primary">
              {distanceToTargetKm.toFixed(1)} km
            </span>
          )}
          <button
            type="button"
            onClick={handleRecenter}
            disabled={locating}
            title="Refresh & Recenter GPS"
            aria-label="Refresh & Recenter GPS"
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-muted transition disabled:opacity-50"
          >
            <LocateFixed className={`size-3.5 ${locating ? "animate-spin text-primary" : ""}`} />
            <span>{locating ? "Locating..." : "GPS"}</span>
          </button>
        </div>
      </div>

      {/* Live Interactive OpenStreetMap Canvas */}
      <div className="relative bg-muted/30">
        {mapCenter ? (
          <iframe
            key={`${mapCenter.lat.toFixed(4)}_${mapCenter.lng.toFixed(4)}`}
            title="Live OrderKing Delivery Map"
            src={buildOsmEmbedUrl(mapCenter)}
            className="h-52 sm:h-60 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="flex h-44 flex-col items-center justify-center gap-2 p-4 text-center text-xs text-muted-foreground">
            <LocateFixed className="size-6 text-muted-foreground/70" />
            <p className="font-semibold text-foreground">
              {gpsError ? `GPS Error: ${gpsError}` : "Waiting for live GPS signal"}
            </p>
            <Button type="button" size="sm" variant="outline" onClick={handleRecenter} disabled={locating}>
              {locating ? "Acquiring GPS..." : "Acquire Live GPS"}
            </Button>
          </div>
        )}

        {/* Live Telemetry Coordinates Pill */}
        {activeCurrent && (
          <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-2 rounded-lg bg-white/95 dark:bg-card/95 px-2.5 py-1 text-[10px] font-mono text-foreground shadow-xs border border-border">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span>
              {activeCurrent.lat.toFixed(5)}, {activeCurrent.lng.toFixed(5)}
            </span>
            {localGps?.accuracyM ? (
              <span className="text-muted-foreground">±{localGps.accuracyM}m</span>
            ) : null}
          </div>
        )}
      </div>

      {/* Bottom Route & Navigation Bar */}
      {isDeliveryMode ? (
        <div className="flex items-center justify-between gap-2 p-3 border-t border-border bg-card">
          <div className="space-y-0.5 min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-xs text-foreground font-semibold truncate">
              <MapPin className="size-3.5 text-[#E23744] shrink-0" />
              <span className="truncate">{pickupLabel || "Restaurant"}</span>
              <span className="text-muted-foreground">&rarr;</span>
              <span className="truncate">{dropLabel || "Customer"}</span>
            </p>
            <p className="text-[11px] text-muted-foreground">
              Destination: <strong className="text-foreground">{targetLabel}</strong>
              {routeTotalKm !== null ? ` · Route ${routeTotalKm.toFixed(1)} km` : ""}
            </p>
          </div>

          {activeTarget ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-3">
                <a href={googleNavigationUrl(activeTarget)} target="_blank" rel="noreferrer">
                  <Navigation className="size-3.5 mr-1" />
                  {navigateLabel}
                </a>
              </Button>
              <Button asChild variant="outline" size="sm" className="px-2 text-muted-foreground hover:text-foreground">
                <a href={mapsUrl(activeTarget, targetLabel)} target="_blank" rel="noreferrer" title="OpenStreetMap">
                  Map
                </a>
              </Button>
            </div>
          ) : null}
        </div>
      ) : hotspots.length > 0 ? (
        <div className="p-3 border-t border-border bg-card space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-bold text-foreground">
              <TrendingUp className="size-3.5 text-[#E23744]" />
              <span>Active Demand Zones</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {hotspots.map((spot) => (
              <a
                key={spot.id}
                href={googleNavigationUrl({ lat: spot.lat, lng: spot.lng })}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-border bg-card p-2 space-y-1 transition hover:border-primary/40"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-foreground truncate">
                    {spot.name}
                  </span>
                  <span className="font-mono font-bold text-[11px] text-[#E23744]">
                    {spot.surgeMultiplier}x
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{spot.activeRestaurants} active</span>
                  <span>Navigate</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-t border-border bg-card text-xs">
          <span className="text-muted-foreground">
            {activeCurrent
              ? `GPS Locked (${activeCurrent.lat.toFixed(4)}, ${activeCurrent.lng.toFixed(4)})`
              : "Tap GPS above to lock device location"}
          </span>
          {activeCurrent && (
            <a
              href={mapsUrl(activeCurrent, "Current Location")}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-primary hover:underline"
            >
              Open Map
            </a>
          )}
        </div>
      )}
    </div>
  );
}
