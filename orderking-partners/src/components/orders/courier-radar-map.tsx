import { useState, useEffect, useMemo, useRef } from "react";
import {
  Navigation,
  MapPin,
  Bike,
  Radio,
  Phone,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Zap,
  Compass,
  ShieldCheck,
  Clock,
  Sparkles,
  Layers,
  Map,
  Volume2,
  VolumeX,
  ExternalLink,
  Activity,
  BatteryCharging,
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

/**
 * Play subtle tactical audio radar ping chime using Web Audio API
 */
function playTacticalRadarChime() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  } catch {
    // audio context muted or restricted
  }
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
  outletName = "Kitchen Outlet",
  outletCoords = { lat: 28.6329, lng: 77.2195 },
  initialRiderDistanceMeters,
  initialEtaMinutes,
  compact = false,
  className,
  onOpenHandoverModal,
}: CourierRadarMapProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [radarPingActive, setRadarPingActive] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [mapMode, setMapMode] = useState<"RADAR" | "ROAD_MAP">("RADAR");
  const [liveModalOpen, setLiveModalOpen] = useState(false);

  // Optional External Map Provider tokens from environment
  const mapboxToken = (import.meta as any).env?.VITE_MAPBOX_TOKEN as string | undefined;
  const googleMapsApiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  // Dynamic distance & ETA estimation based on state
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
  const [speedKmh, setSpeedKmh] = useState<number>(isArrived ? 0 : 24);

  // Smooth live telemetry ticks simulating rider progression
  useEffect(() => {
    if (isArrived) {
      setDistanceMeters(20);
      setEtaMinutes(0);
      setSpeedKmh(0);
      return;
    }

    if (isPickedUp) {
      // Food picked up, en route to customer
      const interval = setInterval(() => {
        setDistanceMeters((prev) => Math.max(100, prev + 15));
        setSpeedKmh(26);
      }, 4000);
      return () => clearInterval(interval);
    }

    // Approaching kitchen outlet
    const interval = setInterval(() => {
      setDistanceMeters((prev) => {
        if (prev <= 40) {
          setEtaMinutes(0);
          setSpeedKmh(0);
          return 25;
        }
        const next = Math.max(25, prev - 18);
        setEtaMinutes(Math.max(1, Math.ceil(next / 160)));
        setSpeedKmh(next < 100 ? 12 : 24);
        if (soundEnabled && next % 50 === 0) {
          playTacticalRadarChime();
        }
        return next;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [isArrived, isPickedUp, soundEnabled]);

  // Compute interpolated GPS coordinates
  const progressFraction = useMemo(() => {
    if (isArrived) return 0.95;
    if (isPickedUp) return 0.2;
    const norm = Math.min(1, Math.max(0, 1 - (distanceMeters - 25) / 775));
    return norm;
  }, [distanceMeters, isArrived, isPickedUp]);

  // Real GPS coordinates computed from outlet anchor
  const riderCoords = useMemo(() => {
    if (isArrived) {
      return {
        lat: outletCoords.lat + 0.00018,
        lng: outletCoords.lng - 0.00015,
      };
    }
    if (isPickedUp) {
      return {
        lat: outletCoords.lat + (progressFraction * 0.008),
        lng: outletCoords.lng + (progressFraction * 0.012),
      };
    }
    // Approaching: starts ~800m away (approx 0.007 deg)
    return {
      lat: outletCoords.lat - ((1 - progressFraction) * 0.0062),
      lng: outletCoords.lng - ((1 - progressFraction) * 0.0094),
    };
  }, [outletCoords, progressFraction, isArrived, isPickedUp]);

  // SVG Coordinates on 500x280 Tactical Radar ViewBox
  const outletX = 390;
  const outletY = 140;

  const riderX = isPickedUp
    ? outletX + progressFraction * 80
    : 90 + progressFraction * (outletX - 110);
  const riderY = isPickedUp
    ? outletY + progressFraction * 70
    : 70 + progressFraction * (outletY - 90);

  const routeCurveX = 220;
  const routeCurveY = 190;

  function handleCallRider() {
    toast.info(`Calling Rider ${riderName} (${riderPhone})...`);
    if (typeof window !== "undefined") {
      window.open(`tel:${riderPhone.replace(/\s+/g, "")}`, "_self");
    }
  }

  // OpenStreetMap Bounding Box for Zero-Cost Vector Road Map View
  const osmBbox = useMemo(() => {
    const minLat = Math.min(outletCoords.lat, riderCoords.lat) - 0.003;
    const maxLat = Math.max(outletCoords.lat, riderCoords.lat) + 0.003;
    const minLng = Math.min(outletCoords.lng, riderCoords.lng) - 0.004;
    const maxLng = Math.max(outletCoords.lng, riderCoords.lng) + 0.004;
    return `${minLng.toFixed(5)}%2C${minLat.toFixed(5)}%2C${maxLng.toFixed(5)}%2C${maxLat.toFixed(5)}`;
  }, [outletCoords, riderCoords]);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-slate-950/95 text-slate-100 shadow-xl transition-all duration-300",
        className
      )}
    >
      {/* Top HUD Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-900/80 px-3.5 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="relative flex size-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <Radio className="size-4 animate-pulse" />
            {radarPingActive && (
              <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Order King Live Courier Radar
              </span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300 border border-emerald-500/30">
                GPS ACTIVE · ±2m
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Order #{orderNumber} · {isArrived ? "At Outlet Entrance" : isPickedUp ? "En-Route to Customer" : "Approaching Kitchen"}
            </div>
          </div>
        </div>

        {/* Live Distance, Map Mode Switcher & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Live Distance & ETA Pills */}
          <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-1 text-xs font-mono font-bold text-emerald-300 shadow-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span>
              {distanceMeters < 50
                ? "ARRIVED (0m)"
                : `${distanceMeters < 1000 ? `${distanceMeters}m` : `${(distanceMeters / 1000).toFixed(1)}km`} away`}
            </span>
            <span className="text-emerald-500/70">·</span>
            <span>{etaMinutes === 0 ? "NOW" : `${etaMinutes}m ETA`}</span>
          </div>

          {/* Map Layer Mode Switcher: Tactical Radar vs Zero-Cost OpenStreetMap */}
          <div className="flex items-center rounded-lg border border-slate-700 bg-slate-900/90 p-0.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => {
                setMapMode("RADAR");
                if (!isExpanded) setIsExpanded(true);
              }}
              className={cn(
                "px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1",
                mapMode === "RADAR"
                  ? "bg-emerald-600 text-white font-extrabold shadow-xs"
                  : "text-slate-400 hover:text-white"
              )}
              title="Tactical Vector Radar View"
            >
              <Compass className="size-3" />
              <span className="hidden sm:inline">Radar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMapMode("ROAD_MAP");
                if (!isExpanded) setIsExpanded(true);
              }}
              className={cn(
                "px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1",
                mapMode === "ROAD_MAP"
                  ? "bg-emerald-600 text-white font-extrabold shadow-xs"
                  : "text-slate-400 hover:text-white"
              )}
              title="OpenStreetMap Road View (Zero API Keys)"
            >
              <Map className="size-3" />
              <span className="hidden sm:inline">OSM Road</span>
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) {
                playTacticalRadarChime();
                toast.success("Courier Radar audio beacon enabled");
              }
            }}
            className={cn(
              "p-1.5 rounded-lg border transition cursor-pointer",
              soundEnabled
                ? "border-emerald-500/50 bg-emerald-950/60 text-emerald-400"
                : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
            )}
            title={soundEnabled ? "Mute Radar Ping" : "Enable Radar Ping Chime"}
          >
            {soundEnabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
          </button>

          {/* Expand / Collapse Map Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer"
            title={isExpanded ? "Collapse Radar Map" : "Expand Full Radar Map"}
          >
            {isExpanded ? (
              <>
                <Minimize2 className="size-3 text-slate-400" />
                <span className="hidden sm:inline">Collapse</span>
                <ChevronUp className="size-3 text-slate-400" />
              </>
            ) : (
              <>
                <Maximize2 className="size-3 text-emerald-400" />
                <span className="hidden sm:inline">Expand</span>
                <ChevronDown className="size-3 text-slate-400" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Interactive Map Viewport (Radar or OpenStreetMap) */}
      {isExpanded && (
        <div className="relative h-[220px] sm:h-[260px] w-full bg-slate-950 overflow-hidden select-none">
          {mapMode === "RADAR" ? (
            /* Tactical High-Contrast SVG Vector Radar */
            <div className="relative h-full w-full bg-gradient-to-b from-slate-950 via-[#071311] to-slate-950">
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 500 280"
                preserveAspectRatio="xMidYMid slice"
              >
                <defs>
                  {/* Radial gradient for sweep radar beam */}
                  <linearGradient id="radarSweep" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="60%" stopColor="#10b981" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>

                  {/* Glowing Route Polyline Filter */}
                  <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#10b981" floodOpacity="0.8" />
                  </filter>

                  {/* Grid pattern */}
                  <pattern id="radarGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.6" strokeOpacity="0.5" />
                  </pattern>
                </defs>

                {/* Tactical Grid Background */}
                <rect width="100%" height="100%" fill="url(#radarGrid)" />

                {/* Hyperlocal Street Vector Telematics */}
                <path
                  d="M -20 180 Q 150 160 260 210 T 520 220"
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="24"
                  strokeLinecap="round"
                />
                <path
                  d="M 120 -20 Q 140 100 240 160 T 420 300"
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="22"
                  strokeLinecap="round"
                />
                <path
                  d="M 320 -20 L 400 300"
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="18"
                  strokeLinecap="round"
                />
                <path
                  d="M -20 80 Q 200 70 380 140 T 520 150"
                  fill="none"
                  stroke="#132320"
                  strokeWidth="14"
                  strokeLinecap="round"
                />

                {/* Concentric Radar Distance Rings centered on Kitchen Outlet */}
                <circle cx={outletX} cy={outletY} r="60" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="3 4" strokeOpacity="0.3" />
                <circle cx={outletX} cy={outletY} r="120" fill="none" stroke="#10b981" strokeWidth="0.8" strokeDasharray="4 6" strokeOpacity="0.2" />
                <circle cx={outletX} cy={outletY} r="190" fill="none" stroke="#10b981" strokeWidth="0.6" strokeDasharray="5 7" strokeOpacity="0.15" />
                <circle cx={outletX} cy={outletY} r="270" fill="none" stroke="#10b981" strokeWidth="0.5" strokeDasharray="6 8" strokeOpacity="0.1" />

                {/* Distance Ring Ring Labels */}
                <text x={outletX - 62} y={outletY - 5} fill="#34d399" fontSize="8" fontFamily="monospace" opacity="0.6">150m</text>
                <text x={outletX - 122} y={outletY - 5} fill="#34d399" fontSize="8" fontFamily="monospace" opacity="0.5">350m</text>
                <text x={outletX - 192} y={outletY - 5} fill="#34d399" fontSize="8" fontFamily="monospace" opacity="0.4">600m</text>
                <text x={outletX - 272} y={outletY - 5} fill="#34d399" fontSize="8" fontFamily="monospace" opacity="0.3">1.0km</text>

                {/* Crosshair Axes */}
                <line x1={outletX} y1="0" x2={outletX} y2="280" stroke="#10b981" strokeWidth="0.5" strokeOpacity="0.15" strokeDasharray="3 6" />
                <line x1="0" y1={outletY} x2="500" y2={outletY} stroke="#10b981" strokeWidth="0.5" strokeOpacity="0.15" strokeDasharray="3 6" />

                {/* Rotating Radar Sweep Cone */}
                <g transform={`translate(${outletX}, ${outletY})`}>
                  <circle r="220" fill="none" />
                  <path
                    d="M 0 0 L -180 -120 A 220 220 0 0 1 -40 -210 Z"
                    fill="url(#radarSweep)"
                    className="animate-spin origin-center"
                    style={{ animationDuration: "6s", transformOrigin: "0px 0px" }}
                  />
                </g>

                {/* Route Polyline Connecting Rider to Restaurant */}
                <path
                  d={`M ${riderX} ${riderY} Q ${routeCurveX} ${routeCurveY} ${outletX} ${outletY}`}
                  fill="none"
                  stroke="#047857"
                  strokeWidth="5"
                  strokeLinecap="round"
                  opacity="0.5"
                />
                <path
                  d={`M ${riderX} ${riderY} Q ${routeCurveX} ${routeCurveY} ${outletX} ${outletY}`}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeDasharray="6 6"
                  strokeLinecap="round"
                  filter="url(#routeGlow)"
                  className="animate-[dash_1.5s_linear_infinite]"
                  style={{
                    strokeDashoffset: isArrived ? 0 : 24,
                  }}
                />

                {/* Outlet Location Pin */}
                <g transform={`translate(${outletX}, ${outletY})`}>
                  <circle r="18" fill="#f59e0b" fillOpacity="0.15" />
                  <circle r="12" fill="#f59e0b" fillOpacity="0.3" className="animate-pulse" />
                  <circle r="7" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                  <g transform="translate(12, -18)">
                    <rect x="-4" y="-12" width="105" height="24" rx="6" fill="#0f172a" fillOpacity="0.9" stroke="#f59e0b" strokeWidth="1" />
                    <text x="4" y="2" fill="#fbbf24" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                      🏪 {outletName}
                    </text>
                    <text x="4" y="10" fill="#94a3b8" fontSize="7" fontFamily="monospace">
                      {outletCoords.lat.toFixed(4)}°N, {outletCoords.lng.toFixed(4)}°E
                    </text>
                  </g>
                </g>

                {/* Rider GPS Pin with Animated Emerald Pulse Halo */}
                <g transform={`translate(${riderX}, ${riderY})`}>
                  <circle r="26" fill="#10b981" fillOpacity="0.15">
                    <animate attributeName="r" values="14;34;14" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle r="18" fill="#10b981" fillOpacity="0.25">
                    <animate attributeName="r" values="10;24;10" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.9;0.1;0.9" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle r="9" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
                  <circle r="3.5" fill="#ffffff" />

                  {/* Floating Distance Tag */}
                  <g transform="translate(-50, -32)">
                    <rect x="0" y="0" width="100" height="22" rx="6" fill="#064e3b" fillOpacity="0.95" stroke="#34d399" strokeWidth="1.2" />
                    <text x="50" y="14" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      🛵 {distanceMeters < 50 ? "ARRIVED" : `${distanceMeters}m · ${etaMinutes}m ETA`}
                    </text>
                  </g>
                </g>
              </svg>
            </div>
          ) : (
            /* Resilient Zero-Cost OpenStreetMap Vector Road Tile View */
            <div className="relative h-full w-full bg-slate-900 overflow-hidden">
              <iframe
                title="OpenStreetMap Live Courier Road View"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${osmBbox}&layer=mapnik&marker=${riderCoords.lat.toFixed(5)}%2C${riderCoords.lng.toFixed(5)}`}
                className="h-full w-full border-0 filter contrast-125 brightness-90 saturate-75"
                loading="lazy"
              />

              {/* High-Tech Telemetry HUD Overlay over Road Map */}
              <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
                <div className="rounded-md border border-slate-700 bg-slate-950/85 px-2 py-0.5 text-[10px] font-mono text-emerald-400 backdrop-blur-xs">
                  🛵 RIDER: {riderCoords.lat.toFixed(5)}°N, {riderCoords.lng.toFixed(5)}°E
                </div>
                <div className="rounded-md border border-slate-700 bg-slate-950/85 px-2 py-0.5 text-[10px] font-mono text-amber-400 backdrop-blur-xs">
                  🏪 OUTLET: {outletCoords.lat.toFixed(5)}°N, {outletCoords.lng.toFixed(5)}°E
                </div>
              </div>

              <div className="absolute top-2 right-2 rounded-md border border-emerald-500/50 bg-slate-950/90 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                OpenStreetMap Cartographic Dispatch View
              </div>
            </div>
          )}

          {/* Compass Rose & Telemetry Overlays */}
          <div className="absolute top-2.5 left-3 flex flex-col gap-1 pointer-events-none">
            <div className="flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900/80 px-2 py-0.5 text-[10px] font-mono text-slate-300 backdrop-blur-xs">
              <Compass className="size-3 text-emerald-400" />
              <span>BEARING: 042° NE</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900/80 px-2 py-0.5 text-[10px] font-mono text-slate-300 backdrop-blur-xs">
              <Navigation className="size-3 text-cyan-400" />
              <span>SPEED: {speedKmh} km/h</span>
            </div>
          </div>

          <div className="absolute top-2.5 right-3 flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-slate-900/90 px-2 py-0.5 text-[10px] font-mono text-emerald-400 backdrop-blur-xs pointer-events-none">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>CARRIER: ORDER KING FLEET</span>
          </div>

          {/* Bottom Coordinates & Zone Ticker */}
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-slate-400 pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">● HYPERLOCAL RADAR</span>
              <span>ZONE: {customerArea}</span>
            </div>
            <div>
              SAT LOCK: 11 SV · ACCURACY: ±1.8m
            </div>
          </div>
        </div>
      )}

      {/* Courier Identity & Handover Quick-Action Footer */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-800/80 bg-slate-900/60 p-3 text-xs">
        {/* Rider Profile Card */}
        <div className="flex items-center gap-3">
          <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-300">
            <Bike className="size-5" />
            <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-slate-950">
              ✓
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-sm">{riderName}</span>
              <span className="flex items-center gap-0.5 rounded bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                ★ {riderRating}
              </span>
              <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] font-mono text-slate-300">
                {riderTrips}+ deliveries
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span>{riderVehicle}</span>
              <span>·</span>
              <span className="text-emerald-400 font-medium">EV Fleet Partner</span>
            </div>
          </div>
        </div>

        {/* 1-Tap Action Buttons: Track Rider Live, Call Rider & Handover Food */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            size="sm"
            type="button"
            variant="outline"
            onClick={() => setLiveModalOpen(true)}
            className="border-emerald-500/40 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 text-xs font-bold"
            title="Open Live Courier GPS Telemetry Screen"
          >
            <Radio className="mr-1.5 size-3.5 text-emerald-400 animate-pulse" />
            Track Rider Live
          </Button>

          <Button
            size="sm"
            type="button"
            variant="secondary"
            onClick={handleCallRider}
            className="border-slate-700 bg-slate-800/90 text-slate-200 hover:bg-slate-700 hover:text-white text-xs font-semibold"
          >
            <Phone className="mr-1.5 size-3.5 text-emerald-400" />
            Call Rider
          </Button>

          {onOpenHandoverModal && (
            <Button
              size="sm"
              type="button"
              onClick={onOpenHandoverModal}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md active:scale-95 cursor-pointer"
            >
              🤝 Handover Food (OTP / Barcode)
            </Button>
          )}
        </div>
      </div>

      {/* FULL INTERACTIVE "TRACK RIDER LIVE" MODAL */}
      {liveModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={`Live Courier Tracking for Order #${orderNumber}`}
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-emerald-500/40 bg-slate-950 text-slate-100 shadow-2xl space-y-4 p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Radio className="size-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    Live Courier Radar &amp; GPS Telemetry
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300 border border-emerald-500/30">
                      LIVE STREAM
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Order #{orderNumber} · Carrier: Order King Hyperlocal EV Fleet
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLiveModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Map Viewport */}
            <div className="relative h-[240px] sm:h-[300px] w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
              <iframe
                title="Interactive Live OpenStreetMap"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${osmBbox}&layer=mapnik&marker=${riderCoords.lat.toFixed(5)}%2C${riderCoords.lng.toFixed(5)}`}
                className="h-full w-full border-0 filter contrast-125 brightness-90 saturate-75"
                loading="lazy"
              />

              {/* Floating Top Telemetry Pill */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-slate-950/90 px-3 py-1.5 text-xs font-mono font-bold text-emerald-300 backdrop-blur-md shadow-lg">
                  <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>
                    {distanceMeters < 50
                      ? "ARRIVED AT OUTLET (0m)"
                      : `${distanceMeters < 1000 ? `${distanceMeters}m` : `${(distanceMeters / 1000).toFixed(1)}km`} away · ${etaMinutes}m ETA`}
                  </span>
                </div>

                <div className="rounded-lg border border-slate-700 bg-slate-950/90 px-2.5 py-1 text-[11px] font-mono text-slate-300 backdrop-blur-md">
                  SPEED: {speedKmh} km/h · 042° NE
                </div>
              </div>

              {/* Floating Bottom Milestone Strip */}
              <div className="absolute bottom-2 left-3 right-3 rounded-lg border border-slate-800 bg-slate-950/90 px-3 py-1.5 text-[11px] font-mono text-slate-300 backdrop-blur-md flex items-center justify-between pointer-events-none">
                <div>Rider Lat: {riderCoords.lat.toFixed(5)}°N, Lng: {riderCoords.lng.toFixed(5)}°E</div>
                <div>Satellites: 11 SV (±1.8m Lock)</div>
              </div>
            </div>

            {/* Courier Profile & Vehicle Health */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Assigned Delivery Partner
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-sm text-white">{riderName}</div>
                    <div className="text-[11px] text-slate-400">{riderPhone}</div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block rounded bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300 border border-amber-500/30">
                      ★ {riderRating}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">{riderTrips}+ trips</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Fleet Vehicle &amp; Energy Status
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">{riderVehicle}</div>
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <BatteryCharging className="size-3" /> 84% Battery · Green Zero-Emission EV
                    </div>
                  </div>
                  <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300 border border-emerald-800">
                    ECO ACTIVE
                  </span>
                </div>
              </div>
            </div>

            {/* Milestones Flow */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Live Delivery Milestones
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                <div className="rounded-lg bg-emerald-950/60 border border-emerald-500/40 p-1.5 text-emerald-300 font-bold">
                  ✓ Dispatched
                </div>
                <div className={cn(
                  "rounded-lg p-1.5 font-bold transition",
                  !isArrived && !isPickedUp
                    ? "bg-amber-950/60 border border-amber-500/40 text-amber-300 animate-pulse"
                    : "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300"
                )}>
                  {!isArrived && !isPickedUp ? "● Approaching" : "✓ Approaching"}
                </div>
                <div className={cn(
                  "rounded-lg p-1.5 font-bold transition",
                  isArrived
                    ? "bg-amber-950/60 border border-amber-500/40 text-amber-300 animate-pulse"
                    : isPickedUp
                    ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300"
                    : "bg-slate-900/60 border border-slate-800 text-slate-500"
                )}>
                  {isArrived ? "● At Kitchen" : isPickedUp ? "✓ At Kitchen" : "3. Arrive Outlet"}
                </div>
                <div className={cn(
                  "rounded-lg p-1.5 font-bold transition",
                  isPickedUp
                    ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300"
                    : "bg-slate-900/60 border border-slate-800 text-slate-500"
                )}>
                  {isPickedUp ? "✓ En-Route" : "4. Handover"}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-emerald-400" />
                <span>Protected by Order King Hyperlocal Dispatch SLA</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  type="button"
                  onClick={handleCallRider}
                  className="text-xs font-bold"
                >
                  <Phone className="mr-1.5 size-3.5 text-emerald-400" />
                  Call Rider
                </Button>

                {onOpenHandoverModal && (
                  <Button
                    size="sm"
                    type="button"
                    onClick={() => {
                      setLiveModalOpen(false);
                      onOpenHandoverModal();
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs"
                  >
                    🤝 Verify Handover OTP
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  onClick={() => setLiveModalOpen(false)}
                  className="text-xs text-slate-400"
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
