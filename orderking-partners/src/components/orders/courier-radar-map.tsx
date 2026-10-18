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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface CourierRadarMapProps {
  orderNumber: string;
  orderState: string; // "RIDER_ASSIGNED" | "ARRIVED_AT_OUTLET" | "PICKED_UP" | string
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

  // Dynamic distance & ETA simulation based on state
  const isArrived = orderState === "ARRIVED_AT_OUTLET";
  const isPickedUp = orderState === "PICKED_UP";

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
      // Food picked up, heading to customer
      const interval = setInterval(() => {
        setDistanceMeters((prev) => Math.max(100, prev + 15));
        setSpeedKmh(26);
      }, 4000);
      return () => clearInterval(interval);
    }

    // RIDER_ASSIGNED: moving towards restaurant outlet
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
        return next;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [isArrived, isPickedUp]);

  // Compute interpolated SVG coordinates for rider pin
  // ViewBox is 500 x 280
  // Outlet is positioned at (380, 140)
  // Rider starts at (110, 80) and moves towards (380, 140)
  const outletX = 390;
  const outletY = 140;

  const progressFraction = useMemo(() => {
    if (isArrived) return 0.95;
    if (isPickedUp) return 0.2; // heading towards right or bottom
    // Distance from 800m down to 25m
    const norm = Math.min(1, Math.max(0, 1 - (distanceMeters - 25) / 775));
    return norm;
  }, [distanceMeters, isArrived, isPickedUp]);

  const riderX = isPickedUp
    ? outletX + progressFraction * 80
    : 90 + progressFraction * (outletX - 110);
  const riderY = isPickedUp
    ? outletY + progressFraction * 70
    : 70 + progressFraction * (outletY - 90);

  // Bezier control point for sleek route curve
  const routeCurveX = 220;
  const routeCurveY = 190;

  function handleCallRider() {
    toast.info(`Calling Rider Rajesh Kumar (${riderPhone})...`);
    if (typeof window !== "undefined") {
      window.open(`tel:${riderPhone.replace(/\s+/g, "")}`, "_self");
    }
  }

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
                OrderKing Live Courier Radar
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

        {/* Live Distance & ETA Pills */}
        <div className="flex items-center gap-2">
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

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer"
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
                <span className="hidden sm:inline">Expand Map</span>
                <ChevronDown className="size-3 text-slate-400" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Interactive High-Contrast SVG Vector Radar Map */}
      {isExpanded && (
        <div className="relative h-[220px] sm:h-[260px] w-full bg-gradient-to-b from-slate-950 via-[#071311] to-slate-950 overflow-hidden select-none">
          {/* Tactical Radar Grid Lines & Concentric Radar Rings */}
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

            {/* Dark Corridors / Hyperlocal Street Vector Simulation */}
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

            {/* Concentric Radar Distance Rings centered on Kitchen Outlet (390, 140) */}
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

            {/* Route Waypoint Nodes */}
            <circle cx="150" cy="115" r="2.5" fill="#10b981" opacity="0.7" />
            <circle cx={routeCurveX} cy={routeCurveY} r="3" fill="#34d399" opacity="0.8" />
            <circle cx="310" cy="165" r="2.5" fill="#10b981" opacity="0.7" />

            {/* Outlet Location Pin (Restaurant Coordinates) */}
            <g transform={`translate(${outletX}, ${outletY})`}>
              {/* Restaurant Outer Glow Ring */}
              <circle r="18" fill="#f59e0b" fillOpacity="0.15" />
              <circle r="12" fill="#f59e0b" fillOpacity="0.3" className="animate-pulse" />
              <circle r="7" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
              {/* Outlet HUD Pin Label */}
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
              {/* Animated Emerald Pulse Halos */}
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

              {/* Live Distance & ETA floating tag over Rider */}
              <g transform="translate(-50, -32)">
                <rect x="0" y="0" width="100" height="22" rx="6" fill="#064e3b" fillOpacity="0.95" stroke="#34d399" strokeWidth="1.2" />
                <text x="50" y="14" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  🛵 {distanceMeters < 50 ? "ARRIVED" : `${distanceMeters}m · ${etaMinutes}m ETA`}
                </text>
              </g>
            </g>
          </svg>

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
            <span>CARRIER: ORDERKING FLEET</span>
          </div>

          {/* Bottom Coordinates & Zone Ticker */}
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-slate-400 pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">● HYPERLOCAL RADAR</span>
              <span>ZONE: {customerArea}</span>
            </div>
            <div>
              SAT LOCK: 11 SV · ACCURACY: 99.4%
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

        {/* Action Buttons: Call Rider & Open Handover Modal */}
        <div className="flex items-center gap-2 shrink-0">
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
    </div>
  );
}
