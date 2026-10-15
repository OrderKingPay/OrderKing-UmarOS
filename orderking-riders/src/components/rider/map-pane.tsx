import { useState } from "react";
import { geoUrl, googleNavigationUrl, mapsUrl, getActiveNavigationTarget } from "@/lib/rider/maps";
import type { GeoPoint } from "@/lib/rider/types";
import { Button } from "@/components/ui/button";
import {
  Compass,
  Flame,
  Layers,
  LocateFixed,
  MapPin,
  Navigation,
  Radio,
  Store,
  TrendingUp,
} from "lucide-react";

export interface DemandHotspot {
  id: string;
  name: string;
  surgeMultiplier: number;
  demandLevel: "VERY_HIGH" | "HIGH" | "NORMAL";
  activeRestaurants: number;
  x: number; // 0-100 relative on canvas
  y: number; // 0-72 relative on canvas
}

const DEFAULT_DEMAND_HOTSPOTS: ReadonlyArray<DemandHotspot> = [
  {
    id: "hotspot_station",
    name: "Station Road & Junction",
    surgeMultiplier: 1.4,
    demandLevel: "VERY_HIGH",
    activeRestaurants: 14,
    x: 42,
    y: 28,
  },
  {
    id: "hotspot_bazaar",
    name: "Central Market & Main Bazaar",
    surgeMultiplier: 1.3,
    demandLevel: "VERY_HIGH",
    activeRestaurants: 11,
    x: 65,
    y: 42,
  },
  {
    id: "hotspot_hospital",
    name: "Civil Hospital & College Rd",
    surgeMultiplier: 1.2,
    demandLevel: "HIGH",
    activeRestaurants: 8,
    x: 25,
    y: 52,
  },
  {
    id: "hotspot_bypass",
    name: "Bypass Highway Food Court",
    surgeMultiplier: 1.1,
    demandLevel: "NORMAL",
    activeRestaurants: 6,
    x: 78,
    y: 20,
  },
];

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
  if (valid.length === 0) return { x: 50, y: 36 };

  const lats = valid.map((x) => x.lat);
  const lngs = valid.map((x) => x.lng);
  const minLat = Math.min(...lats) - 0.008;
  const maxLat = Math.max(...lats) + 0.008;
  const minLng = Math.min(...lngs) - 0.008;
  const maxLng = Math.max(...lngs) + 0.008;

  const latSpan = maxLat - minLat || 0.016;
  const lngSpan = maxLng - minLng || 0.016;

  const rawX = ((p.lng - minLng) / lngSpan) * 100;
  const rawY = (1 - (p.lat - minLat) / latSpan) * 72;

  // Clamp within padded canvas (8% to 92%)
  const x = Math.min(92, Math.max(8, rawX));
  const y = Math.min(64, Math.max(8, rawY));
  return { x, y };
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
  initialHeatmap = true,
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
}) {
  const [heatmapEnabled, setHeatmapEnabled] = useState(initialHeatmap);
  const [recenterCount, setRecenterCount] = useState(0);

  const isDeliveryMode = mode === "delivery" && Boolean(pickup || drop || deliveryState);
  const points = [pickup, drop, current].filter(isValidCoord);

  // State-aware target resolution
  const { target, isPickup, stageLabel } = getActiveNavigationTarget(
    pickup ?? null,
    drop ?? null,
    deliveryState ?? null
  );
  const targetLabel = isPickup ? pickupLabel || "Pickup Restaurant" : dropLabel || "Customer Location";

  const pickupCoordValid = isValidCoord(pickup);
  const dropCoordValid = isValidCoord(drop);
  const currentCoordValid = isValidCoord(current);

  const pickupProj = pickupCoordValid ? project(pickup, points) : null;
  const dropProj = dropCoordValid ? project(drop, points) : null;
  const currentProj = currentCoordValid
    ? project(current, points)
    : { x: 50, y: 36 };
  const targetProj = isPickup ? pickupProj : dropProj;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#1E283D] bg-[#0E121B] shadow-[0_15px_35px_rgba(0,0,0,0.5)]">
      {/* Top Header / Map Phase Banner */}
      <div className="flex items-center justify-between border-b border-[#1E283D] bg-gradient-to-r from-[#121723] via-[#0E121B] to-[#121723] px-3.5 py-2 text-xs">
        {deliveryState ? (
          <span className="flex items-center gap-1.5 font-bold text-[#e5a93c]">
            <Compass className="size-3.5 animate-spin" style={{ animationDuration: "8s" }} />
            <span>Active Route: {stageLabel}</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 font-bold text-foreground">
            <Radio className="size-3.5 text-emerald-400 animate-pulse" />
            <span>Live Demand Radar &amp; Heatmap</span>
          </span>
        )}

        <div className="flex items-center gap-1.5">
          {/* Heatmap Toggle Button */}
          <button
            type="button"
            onClick={() => setHeatmapEnabled((v) => !v)}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
              heatmapEnabled
                ? "bg-amber-500/20 text-[#e5a93c] border border-amber-500/40"
                : "bg-muted/40 text-muted-foreground border border-border/50 hover:bg-muted"
            }`}
          >
            <Flame className={`size-3.5 ${heatmapEnabled ? "text-[#e5a93c]" : "text-muted-foreground"}`} />
            <span>{heatmapEnabled ? "Heatmap ON" : "Heatmap OFF"}</span>
          </button>

          {/* Recenter Button */}
          <button
            type="button"
            onClick={() => setRecenterCount((c) => c + 1)}
            title="Recenter GPS"
            className="rounded-lg border border-border/50 bg-muted/40 p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <LocateFixed className="size-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Map Canvas */}
      <div className="relative bg-[#090B10]">
        <svg
          viewBox="0 0 100 72"
          className="h-48 sm:h-56 w-full"
          role="img"
          aria-label="OrderKing Live Partner Route & Heatmap Visualizer"
        >
          <defs>
            {/* Heatmap Thermal Gradients */}
            <radialGradient id="heat_surge_high" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.75" />
              <stop offset="45%" stopColor="#f59e0b" stopOpacity="0.45" />
              <stop offset="80%" stopColor="#2563eb" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#090b10" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="heat_surge_medium" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.65" />
              <stop offset="55%" stopColor="#2563eb" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#090b10" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="heat_radar_pulse" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
              <stop offset="70%" stopColor="#10b981" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Dark Obsidian Grid Background */}
          <rect width="100" height="72" fill="#090B10" />

          {/* Subtle Map Roads & Grid System */}
          <g stroke="#1A2234" strokeWidth="0.35">
            {Array.from({ length: 7 }, (_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 12} x2="100" y2={i * 12} />
            ))}
            {Array.from({ length: 9 }, (_, i) => (
              <line key={`v${i}`} x1={i * 12.5} y1="0" x2={i * 12.5} y2="72" />
            ))}
            {/* Primary Arterial Road Lines */}
            <path
              d="M 0 36 Q 30 20 50 36 T 100 36"
              fill="none"
              stroke="#243048"
              strokeWidth="0.8"
            />
            <path
              d="M 45 0 Q 55 35 45 72"
              fill="none"
              stroke="#243048"
              strokeWidth="0.8"
            />
          </g>

          {/* REAL HEATMAP THERMAL OVERLAY LAYER */}
          {heatmapEnabled && (
            <g className="transition-opacity duration-500">
              {DEFAULT_DEMAND_HOTSPOTS.map((h) => (
                <g key={h.id}>
                  {/* Outer Heat Halo */}
                  <circle
                    cx={h.x}
                    cy={h.y}
                    r={h.demandLevel === "VERY_HIGH" ? 18 : 13}
                    fill={h.demandLevel === "VERY_HIGH" ? "url(#heat_surge_high)" : "url(#heat_surge_medium)"}
                  />
                  {/* Hotspot Core Pin */}
                  <circle
                    cx={h.x}
                    cy={h.y}
                    r="1.8"
                    fill={h.demandLevel === "VERY_HIGH" ? "#ef4444" : "#f59e0b"}
                    stroke="#090B10"
                    strokeWidth="0.5"
                  />
                  {/* Surge Multiplier Tag */}
                  <text
                    x={h.x}
                    y={h.y - 3}
                    textAnchor="middle"
                    fill="#F8FAFC"
                    fontSize="2.4"
                    fontWeight="bold"
                    className="select-none filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                  >
                    {h.surgeMultiplier}x
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* ACTIVE DELIVERY ROUTE PATH */}
          {isDeliveryMode && pickupProj && dropProj ? (
            <line
              x1={pickupProj.x}
              y1={pickupProj.y}
              x2={dropProj.x}
              y2={dropProj.y}
              stroke="#64748B"
              strokeWidth="1.2"
              strokeDasharray="2 1.5"
            />
          ) : null}

          {/* ACTIVE TRAJECTORY PATH TO TARGET */}
          {isDeliveryMode && currentProj && targetProj ? (
            <line
              x1={currentProj.x}
              y1={currentProj.y}
              x2={targetProj.x}
              y2={targetProj.y}
              stroke="#e5a93c"
              strokeWidth="1.6"
              strokeDasharray="2.5 1.5"
            />
          ) : null}

          {/* RESTAURANT PICKUP MARKER */}
          {isDeliveryMode && pickupProj ? (
            <g>
              <circle cx={pickupProj.x} cy={pickupProj.y} r="3.4" fill="rgba(245, 158, 11, 0.25)" />
              <circle cx={pickupProj.x} cy={pickupProj.y} r="2.2" fill="#F59E0B" stroke="#08090C" strokeWidth="0.6" />
            </g>
          ) : null}

          {/* CUSTOMER DROPOFF MARKER */}
          {isDeliveryMode && dropProj ? (
            <g>
              <circle cx={dropProj.x} cy={dropProj.y} r="3.4" fill="rgba(37, 99, 235, 0.25)" />
              <circle cx={dropProj.x} cy={dropProj.y} r="2.2" fill="#2563EB" stroke="#08090C" strokeWidth="0.6" />
            </g>
          ) : null}

          {/* LIVE RIDER POSITION MARKER WITH RADAR WAVES */}
          {currentProj ? (
            <g>
              {/* Radar Scanning Ring */}
              <circle cx={currentProj.x} cy={currentProj.y} r="6.5" fill="url(#heat_radar_pulse)" className="animate-ping" />
              <circle cx={currentProj.x} cy={currentProj.y} r="3.8" fill="rgba(16, 185, 129, 0.25)" />
              {/* Inner Position Dot */}
              <circle cx={currentProj.x} cy={currentProj.y} r="2.2" fill="#10B981" stroke="#F8FAFC" strokeWidth="0.7" />
            </g>
          ) : null}
        </svg>

        {/* Map Overlay Key Indicator */}
        <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-lg bg-black/85 px-2.5 py-1 text-[10px] text-muted-foreground backdrop-blur-md border border-[#1E283D]">
          {isDeliveryMode ? (
            <>
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <span className="size-1.5 rounded-full bg-amber-400" /> Kitchen
              </span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1 text-blue-400 font-semibold">
                <span className="size-1.5 rounded-full bg-blue-500" /> Customer
              </span>
              <span className="text-border">|</span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1 text-red-400 font-semibold">
                <span className="size-1.5 rounded-full bg-red-500" /> Peak Surge
              </span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <span className="size-1.5 rounded-full bg-amber-400" /> High Demand
              </span>
              <span className="text-border">|</span>
            </>
          )}
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <span className="size-1.5 rounded-full bg-emerald-400" /> You
          </span>
        </div>
      </div>

      {/* Bottom Route / Hotspot Actions Bar */}
      {isDeliveryMode ? (
        <div className="flex items-center justify-between gap-2 p-3 border-t border-[#1E283D] bg-[#0E121B]">
          <div className="space-y-0.5 min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-xs text-foreground font-semibold truncate">
              <MapPin className="size-3.5 text-[#e5a93c] shrink-0" />
              <span className="truncate">{pickupLabel || "Restaurant"}</span>
              <span className="text-muted-foreground">→</span>
              <span className="truncate">{dropLabel || "Customer"}</span>
            </p>
            <p className="text-[10px] text-muted-foreground">
              Heading to: <strong className="text-foreground">{targetLabel}</strong>
            </p>
          </div>

          {target ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <Button asChild size="sm" className="bg-[#e5a93c] text-black hover:bg-[#d49b2e] font-bold px-3">
                <a href={googleNavigationUrl(target)} target="_blank" rel="noreferrer">
                  <Navigation className="size-3.5 mr-1" />
                  {navigateLabel}
                </a>
              </Button>
              <Button asChild variant="ghost" size="sm" className="px-2 text-muted-foreground hover:text-foreground">
                <a href={mapsUrl(target, targetLabel)} target="_blank" rel="noreferrer" title="Open Street Map">
                  OSM
                </a>
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        /* Standby Heatmap Surge Recommendations Bar */
        <div className="p-3 border-t border-[#1E283D] bg-[#0E121B] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-bold text-foreground">
              <TrendingUp className="size-3.5 text-[#e5a93c]" />
              <span>Nearby High-Demand Surge Hotspots</span>
            </span>
            <span className="text-[11px] font-semibold text-emerald-400">
              Live Fleet Dispatches Active
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {DEFAULT_DEMAND_HOTSPOTS.map((spot) => (
              <div
                key={spot.id}
                className="rounded-xl border border-[#1E283D] bg-[#121723] p-2 space-y-1 transition hover:border-amber-500/40"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-muted-foreground truncate">
                    {spot.name.split("&")[0]}
                  </span>
                  <span className="font-mono font-bold text-[11px] text-red-400">
                    {spot.surgeMultiplier}x
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-300">
                  <span>{spot.activeRestaurants} Outlets</span>
                  <span className="text-[#e5a93c] font-semibold">
                    {spot.demandLevel === "VERY_HIGH" ? "🔥 Surge" : "⚡ High"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
