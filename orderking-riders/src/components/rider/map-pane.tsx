import { geoUrl, googleNavigationUrl, mapsUrl, getActiveNavigationTarget } from "@/lib/rider/maps";
import type { GeoPoint } from "@/lib/rider/types";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Store, Home, Compass } from "lucide-react";

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

function project(p: GeoPoint, all: GeoPoint[]) {
  const valid = all.filter(isValidCoord);
  if (valid.length === 0) return { x: 50, y: 50 };

  const lats = valid.map((x) => x.lat);
  const lngs = valid.map((x) => x.lng);
  const minLat = Math.min(...lats) - 0.008;
  const maxLat = Math.max(...lats) + 0.008;
  const minLng = Math.min(...lngs) - 0.008;
  const maxLng = Math.max(...lngs) + 0.008;

  const latSpan = maxLat - minLat || 0.016;
  const lngSpan = maxLng - minLng || 0.016;

  const rawX = ((p.lng - minLng) / lngSpan) * 100;
  const rawY = (1 - (p.lat - minLat) / latSpan) * 100;

  // Clamp within padded canvas (8% to 92%)
  const x = Math.min(92, Math.max(8, rawX));
  const y = Math.min(92, Math.max(8, rawY));
  return { x, y };
}

export function MapPane({
  pickup,
  drop,
  current,
  pickupLabel,
  dropLabel,
  navigateLabel,
  deliveryState,
}: {
  pickup?: GeoPoint | null;
  drop?: GeoPoint | null;
  current?: GeoPoint | null;
  pickupLabel: string;
  dropLabel: string;
  navigateLabel: string;
  deliveryState?: string | null;
}) {
  const points = [pickup, drop, current].filter(isValidCoord);
  
  // State-aware target resolution
  const { target, isPickup, stageLabel } = getActiveNavigationTarget(pickup, drop, deliveryState);
  const targetLabel = isPickup ? pickupLabel : dropLabel;

  const pickupCoordValid = isValidCoord(pickup);
  const dropCoordValid = isValidCoord(drop);
  const currentCoordValid = isValidCoord(current);

  const pickupProj = pickupCoordValid ? project(pickup, points) : null;
  const dropProj = dropCoordValid ? project(drop, points) : null;
  const currentProj = currentCoordValid ? project(current, points) : null;
  const targetProj = isPickup ? pickupProj : dropProj;

  return (
    <div className="overflow-hidden rounded-xl border border-primary/20 bg-surface shadow-neon glassmorphism">
      {/* Active Phase Pill */}
      {deliveryState ? (
        <div className="flex items-center justify-between border-b border-border/50 bg-black/40 px-3 py-1.5 text-[11px]">
          <span className="flex items-center gap-1.5 font-bold text-primary neon-text">
            <Compass className="size-3.5 animate-spin" style={{ animationDuration: "8s" }} />
            Active Route: {stageLabel}
          </span>
          <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary border border-primary/20">
            Live GPS Telemetry
          </span>
        </div>
      ) : null}

      <div className="relative">
        <svg viewBox="0 0 100 72" className="h-44 w-full" role="img" aria-label="Route Map Visualizer">
          <rect width="100" height="72" className="fill-paper/90" />
          
          {/* Subtle Grid Lines */}
          <g className="stroke-border/40" strokeWidth="0.3">
            {Array.from({ length: 6 }, (_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 12} x2="100" y2={i * 12} />
            ))}
            {Array.from({ length: 8 }, (_, i) => (
              <line key={`v${i}`} x1={i * 12.5} y1="0" x2={i * 12.5} y2="72" />
            ))}
          </g>

          {/* Static Route Path between Pickup and Drop */}
          {pickupProj && dropProj ? (
            <line
              x1={pickupProj.x}
              y1={pickupProj.y}
              x2={dropProj.x}
              y2={dropProj.y}
              className="stroke-muted-foreground/40"
              strokeWidth="1.2"
              strokeDasharray="2 1.5"
            />
          ) : null}

          {/* Active Rider Trajectory Path to current Destination */}
          {currentProj && targetProj ? (
            <line
              x1={currentProj.x}
              y1={currentProj.y}
              x2={targetProj.x}
              y2={targetProj.y}
              className="stroke-primary"
              strokeWidth="1.6"
              strokeDasharray="2 2"
            />
          ) : null}

          {/* Pickup Marker (Restaurant) */}
          {pickupProj ? (
            <g>
              <circle cx={pickupProj.x} cy={pickupProj.y} r="3.2" className="fill-amber-500/20" />
              <circle cx={pickupProj.x} cy={pickupProj.y} r="2.2" className="fill-amber-400 stroke-background" strokeWidth="0.8" />
            </g>
          ) : null}

          {/* Dropoff Marker (Customer) */}
          {dropProj ? (
            <g>
              <circle cx={dropProj.x} cy={dropProj.y} r="3.2" className="fill-accent/20" />
              <circle cx={dropProj.x} cy={dropProj.y} r="2.2" className="fill-accent stroke-background" strokeWidth="0.8" />
            </g>
          ) : null}

          {/* Live Rider Position Marker with Radar Ping */}
          {currentProj ? (
            <g>
              <circle cx={currentProj.x} cy={currentProj.y} r="5" className="fill-primary/20 animate-ping" />
              <circle cx={currentProj.x} cy={currentProj.y} r="2.6" className="fill-primary stroke-background" strokeWidth="0.8" />
            </g>
          ) : null}
        </svg>

        {/* Map Overlay Key Indicator */}
        <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-md bg-black/75 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur-sm border border-border/40">
          <span className="flex items-center gap-1 text-amber-400">
            <span className="size-1.5 rounded-full bg-amber-400" /> Store
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1 text-accent">
            <span className="size-1.5 rounded-full bg-accent" /> Customer
          </span>
          {currentProj ? (
            <>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1 text-primary font-bold">
                <span className="size-1.5 rounded-full bg-primary" /> You
              </span>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 p-3">
        <div className="space-y-0.5 min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-xs text-foreground font-semibold truncate">
            <MapPin className="size-3.5 text-primary shrink-0" />
            <span className="truncate">{pickupLabel}</span>
            <span className="text-muted-foreground">→</span>
            <span className="truncate">{dropLabel}</span>
          </p>
          <p className="text-[10px] text-muted-foreground">
            Target Destination: <span className="text-foreground font-medium">{targetLabel}</span>
          </p>
        </div>

        {target ? (
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Direct Google Maps Turn-by-Turn Navigation */}
            <Button asChild size="sm" className="min-h-9 bg-primary text-black hover:bg-primary/90 font-bold px-3">
              <a href={googleNavigationUrl(target)} target="_blank" rel="noreferrer">
                <Navigation className="size-3.5 mr-1" />
                Navigate
              </a>
            </Button>

            {/* OpenStreetMap Alternative */}
            <Button asChild variant="ghost" size="sm" className="min-h-9 px-2 text-muted-foreground hover:text-foreground">
              <a href={mapsUrl(target, targetLabel)} target="_blank" rel="noreferrer" title="Open Street Map">
                OSM
              </a>
            </Button>
          </div>
        ) : null}

        {target ? <link rel="alternate" href={geoUrl(target)} /> : null}
      </div>
    </div>
  );
}
