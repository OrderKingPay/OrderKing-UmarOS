import { useState, useMemo, useCallback } from "react";
import {
  isServiceable,
  isPointInPolygon,
  haversineDistance,
  calculateBearing,
  distanceToPolygonBoundaryKm,
  normalizePolygonDefinition,
  DEFAULT_SCHEDULE_WINDOWS,
  DEFAULT_SOVEREIGN_ZONES,
  type ServiceZone,
  type ServiceScheduleWindow,
  type ServiceabilityConfig,
  type ServiceabilityResult,
  type ZoneTier,
  type ScheduleType,
  type EmergencyLevel,
  type LatLng,
} from "@/lib/orderking/geo/geofencing";
import {
  Shield,
  MapPin,
  Clock,
  AlertTriangle,
  Zap,
  CheckCircle2,
  XCircle,
  Compass,
  Crosshair,
  Layers,
  Radio,
  Sun,
  Moon,
  Sunset,
  Copy,
  Check,
  RotateCcw,
  Navigation,
  Sliders,
  Flame,
  Globe,
  Plus,
  Trash2,
  Activity,
} from "lucide-react";

interface TestLocationPreset {
  name: string;
  lat: number;
  lng: number;
  expectedTier: string;
  description: string;
}

const TEST_PRESETS: TestLocationPreset[] = [
  {
    name: "Sribhumi / Karimganj Station Hub",
    lat: 24.8688,
    lng: 92.3511,
    expectedTier: "CORE",
    description: "High-density retail, station road & core restaurant cluster",
  },
  {
    name: "Karimganj Civil Hospital (Safe Haven)",
    lat: 24.869,
    lng: 92.35,
    expectedTier: "SAFE_HAVEN",
    description: "24x7 Sovereign emergency health and medical supply perimeter",
  },
  {
    name: "Greater Metro Ring (Banga Bazar)",
    lat: 24.845,
    lng: 92.375,
    expectedTier: "METRO",
    description: "Extended residential & commercial arterial expansion",
  },
  {
    name: "Suburban Outskirts (Patharkandi Rd)",
    lat: 24.815,
    lng: 92.305,
    expectedTier: "SUBURBAN",
    description: "Semi-urban fringe corridor (daytime only delivery)",
  },
  {
    name: "External Border Area (Inactive)",
    lat: 25.12,
    lng: 92.65,
    expectedTier: "OUTSIDE",
    description: "Beyond delivery boundary (>25km from hub, King Pay only)",
  },
];

export function DynamicGeofenceManager() {
  // --- Zones & Schedules State ---
  const [zones, setZones] = useState<ServiceZone[]>(DEFAULT_SOVEREIGN_ZONES);
  const [schedules] = useState<ServiceScheduleWindow[]>(DEFAULT_SCHEDULE_WINDOWS);

  // --- Simulated Time & Day State ---
  const [simulatedHour, setSimulatedHour] = useState<number>(14); // 2:00 PM default
  const [simulatedMinute, setSimulatedMinute] = useState<number>(0);
  const [simulatedDayOfWeek, setSimulatedDayOfWeek] = useState<number>(3); // Wednesday (1=Mon ... 0=Sun)
  const [useCurrentSystemTime, setUseCurrentSystemTime] = useState<boolean>(false);

  // --- Emergency Protocol State ---
  const [emergencyActive, setEmergencyActive] = useState<boolean>(false);
  const [emergencyLevel, setEmergencyLevel] = useState<EmergencyLevel>("CRITICAL_FREEZE");
  const [freezeAllDeliveries, setFreezeAllDeliveries] = useState<boolean>(false);
  const [emergencyReason, setEmergencyReason] = useState<string>(
    "Heavy Monsoon Flash Flood & Road Inundation Advisory"
  );
  const [excludedZoneIds, setExcludedZoneIds] = useState<string[]>([]);

  // --- Point-in-Polygon Testing State ---
  const [testLat, setTestLat] = useState<number>(24.8688);
  const [testLng, setTestLng] = useState<number>(92.3511);
  const [copiedGeoJson, setCopiedGeoJson] = useState<boolean>(false);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(zones[0]?.id || null);

  // Calculate simulated date object
  const simulatedDate = useMemo(() => {
    if (useCurrentSystemTime) return new Date();
    const d = new Date();
    // Adjust day of week (0 = Sunday, 1 = Monday ...)
    const currentDay = d.getDay();
    const dayDiff = simulatedDayOfWeek - currentDay;
    d.setDate(d.getDate() + dayDiff);
    d.setHours(simulatedHour, simulatedMinute, 0, 0);
    return d;
  }, [useCurrentSystemTime, simulatedHour, simulatedMinute, simulatedDayOfWeek]);

  // Build configuration
  const serviceabilityConfig: ServiceabilityConfig = useMemo(() => {
    return {
      zones,
      schedules,
      emergencyOverride: emergencyActive
        ? {
            active: true,
            level: emergencyLevel,
            freezeAllDeliveries,
            reason: emergencyReason,
            affectedZoneIds: excludedZoneIds,
          }
        : undefined,
    };
  }, [zones, schedules, emergencyActive, emergencyLevel, freezeAllDeliveries, emergencyReason, excludedZoneIds]);

  // Run Serviceability Check
  const result: ServiceabilityResult = useMemo(() => {
    return isServiceable(
      { lat: testLat, lng: testLng },
      simulatedDate,
      serviceabilityConfig
    );
  }, [testLat, testLng, simulatedDate, serviceabilityConfig]);

  // Compute bearing and distance to hub center
  const hubStats = useMemo(() => {
    const hubCenter = { lat: 24.8688, lng: 92.3511 };
    const dist = haversineDistance({ lat: testLat, lng: testLng }, hubCenter, "km");
    const bearing = calculateBearing(hubCenter, { lat: testLat, lng: testLng });
    return {
      distanceKm: Math.round(dist * 100) / 100,
      bearingDeg: Math.round(bearing),
    };
  }, [testLat, testLng]);

  // Compass cardinal direction
  const cardinalDirection = useMemo(() => {
    const b = hubStats.bearingDeg;
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const idx = Math.round(b / 45) % 8;
    return directions[idx];
  }, [hubStats.bearingDeg]);

  // Toggle zone exclusion under emergency
  const toggleZoneExclusion = (zoneId: string) => {
    setExcludedZoneIds((prev) =>
      prev.includes(zoneId) ? prev.filter((id) => id !== zoneId) : [...prev, zoneId]
    );
  };

  // Preset selector
  const handleSelectPreset = (preset: TestLocationPreset) => {
    setTestLat(preset.lat);
    setTestLng(preset.lng);
  };

  // Copy GeoJSON
  const copyGeoJson = () => {
    const featureCollection = {
      type: "FeatureCollection",
      features: zones.map((z) => {
        const rings = normalizePolygonDefinition(z.polygon);
        const coordinates = rings.map((r) => [
          ...r.outer.map((p) => [p.lng, p.lat]),
          // Close the loop
          [r.outer[0].lng, r.outer[0].lat],
        ]);
        return {
          type: "Feature",
          properties: {
            id: z.id,
            name: z.name,
            tier: z.tier,
            allowedSchedules: z.allowedSchedules,
          },
          geometry: {
            type: "Polygon",
            coordinates,
          },
        };
      }),
    };

    navigator.clipboard.writeText(JSON.stringify(featureCollection, null, 2));
    setCopiedGeoJson(true);
    setTimeout(() => setCopiedGeoJson(false), 2500);
  };

  // Reset to default
  const handleResetDefaults = () => {
    setZones(DEFAULT_SOVEREIGN_ZONES);
    setEmergencyActive(false);
    setFreezeAllDeliveries(false);
    setExcludedZoneIds([]);
    setSimulatedHour(14);
    setSimulatedMinute(0);
    setTestLat(24.8688);
    setTestLng(92.3511);
  };

  // Bounding box for SVG radar view
  const mapBounds = useMemo(() => {
    // Collect all points
    const points: LatLng[] = [];
    zones.forEach((z) => {
      const rings = normalizePolygonDefinition(z.polygon);
      rings.forEach((r) => r.outer.forEach((p) => points.push(p)));
    });
    points.push({ lat: testLat, lng: testLng });

    if (points.length === 0) {
      return { minLat: 24.8, maxLat: 25.0, minLng: 92.2, maxLng: 92.5 };
    }

    const minLat = Math.min(...points.map((p) => p.lat)) - 0.01;
    const maxLat = Math.max(...points.map((p) => p.lat)) + 0.01;
    const minLng = Math.min(...points.map((p) => p.lng)) - 0.01;
    const maxLng = Math.max(...points.map((p) => p.lng)) + 0.01;

    return { minLat, maxLat, minLng, maxLng };
  }, [zones, testLat, testLng]);

  // Convert lat/lng to SVG percentage coords (0-100)
  const toSvgCoords = useCallback(
    (lat: number, lng: number) => {
      const latSpan = mapBounds.maxLat - mapBounds.minLat || 0.001;
      const lngSpan = mapBounds.maxLng - mapBounds.minLng || 0.001;
      // In SVG: y=0 is top (maxLat), y=100 is bottom (minLat)
      const x = ((lng - mapBounds.minLng) / lngSpan) * 100;
      const y = ((mapBounds.maxLat - lat) / latSpan) * 100;
      return { x, y };
    },
    [mapBounds]
  );

  // SVG click handler to set coordinate
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    const latSpan = mapBounds.maxLat - mapBounds.minLat;
    const lngSpan = mapBounds.maxLng - mapBounds.minLng;

    const newLat = mapBounds.maxLat - clickY * latSpan;
    const newLng = mapBounds.minLng + clickX * lngSpan;

    setTestLat(parseFloat(newLat.toFixed(5)));
    setTestLng(parseFloat(newLng.toFixed(5)));
  };

  const getTierColor = (tier: ZoneTier) => {
    switch (tier) {
      case "core":
        return { stroke: "#10b981", fill: "rgba(16, 185, 129, 0.18)", badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
      case "metro":
        return { stroke: "#3b82f6", fill: "rgba(59, 130, 246, 0.14)", badge: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
      case "suburban":
        return { stroke: "#f59e0b", fill: "rgba(245, 158, 11, 0.12)", badge: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
      case "safe_haven":
        return { stroke: "#ec4899", fill: "rgba(236, 72, 153, 0.22)", badge: "bg-pink-500/20 text-pink-400 border-pink-500/30" };
      default:
        return { stroke: "#64748b", fill: "rgba(100, 116, 139, 0.15)", badge: "bg-slate-500/20 text-slate-400 border-slate-500/30" };
    }
  };

  return (
    <div className="w-full rounded-2xl bg-slate-950 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Sovereign Geofence & Serviceability Dispatch Engine
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                UMAR OS v4.2
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Ray-Casting point-in-polygon containment, great-circle Haversine navigation, and midnight rollover dispatch scheduling.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={copyGeoJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors"
          >
            {copiedGeoJson ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">GeoJSON Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Export GeoJSON</span>
              </>
            )}
          </button>

          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Visual Radar & Serviceability Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Vector Radar Canvas (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="relative rounded-xl bg-slate-900/90 border border-slate-800 p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                Live Spatial Projection Radar (Click anywhere to simulate GPS point)
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {zones.length} active zones • {result.currentScheduleType.toUpperCase()}
              </span>
            </div>

            {/* SVG Visual Canvas */}
            <div className="relative w-full aspect-video rounded-lg bg-slate-950/80 border border-slate-800/80 overflow-hidden cursor-crosshair">
              {/* Grid Background */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, #6366f1 1px, transparent 1px), linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)",
                  backgroundSize: "20px 20px, 40px 40px, 40px 40px",
                }}
              />

              <svg
                className="w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                onClick={handleSvgClick}
              >
                {/* Render Zone Polygons */}
                {zones.map((zone) => {
                  const rings = normalizePolygonDefinition(zone.polygon);
                  const colors = getTierColor(zone.tier);
                  const isExcluded =
                    emergencyActive &&
                    (freezeAllDeliveries || excludedZoneIds.includes(zone.id));

                  return rings.map((ring, rIdx) => {
                    const pointsStr = ring.outer
                      .map((p) => {
                        const { x, y } = toSvgCoords(p.lat, p.lng);
                        return `${x},${y}`;
                      })
                      .join(" ");

                    return (
                      <polygon
                        key={`${zone.id}-${rIdx}`}
                        points={pointsStr}
                        fill={isExcluded ? "rgba(239, 68, 68, 0.15)" : colors.fill}
                        stroke={isExcluded ? "#ef4444" : colors.stroke}
                        strokeWidth={zone.id === selectedZoneId ? "1.5" : "0.9"}
                        strokeDasharray={isExcluded ? "2 2" : "none"}
                        className="transition-all duration-300"
                      />
                    );
                  });
                })}

                {/* Simulated Target GPS Point */}
                {(() => {
                  const pt = toSvgCoords(testLat, testLng);
                  const isInside = result.serviceable;
                  const dotColor = isInside ? "#10b981" : "#ef4444";

                  return (
                    <g>
                      {/* Outer pulse */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="3.5"
                        fill="none"
                        stroke={dotColor}
                        strokeWidth="0.8"
                        className="animate-ping origin-center opacity-75"
                      />
                      {/* Core target dot */}
                      <circle cx={pt.x} cy={pt.y} r="2" fill={dotColor} stroke="#ffffff" strokeWidth="0.6" />
                      {/* Crosshairs */}
                      <line x1={pt.x - 4} y1={pt.y} x2={pt.x + 4} y2={pt.y} stroke={dotColor} strokeWidth="0.4" />
                      <line x1={pt.x} y1={pt.y - 4} x2={pt.x} y2={pt.y + 4} stroke={dotColor} strokeWidth="0.4" />
                    </g>
                  );
                })()}
              </svg>

              {/* Radar Legend Overlay */}
              <div className="absolute bottom-2 left-2 flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] backdrop-blur-sm">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Core Hub
                </span>
                <span className="flex items-center gap-1 text-blue-400">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> Metro
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Suburban
                </span>
                <span className="flex items-center gap-1 text-pink-400">
                  <span className="w-2 h-2 rounded-full bg-pink-500" /> Safe Haven
                </span>
              </div>

              {/* Coordinates Pill */}
              <div className="absolute top-2 right-2 px-2 py-1 rounded bg-slate-900/90 border border-slate-800 font-mono text-[10px] text-slate-300">
                {testLat.toFixed(4)}°N, {testLng.toFixed(4)}°E
              </div>
            </div>

            {/* Location Presets Quick Bar */}
            <div className="mt-3 space-y-1.5">
              <label className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Crosshair className="w-3.5 h-3.5 text-indigo-400" /> Quick Simulation Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TEST_PRESETS.map((preset) => {
                  const isCurrent =
                    Math.abs(testLat - preset.lat) < 0.001 &&
                    Math.abs(testLng - preset.lng) < 0.001;

                  return (
                    <button
                      key={preset.name}
                      onClick={() => handleSelectPreset(preset)}
                      className={`text-left p-2 rounded-lg border text-xs transition-all ${
                        isCurrent
                          ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300"
                          : "bg-slate-950/60 border-slate-800 hover:bg-slate-800/60 text-slate-300"
                      }`}
                    >
                      <div className="font-medium truncate">{preset.name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <span className="font-mono text-slate-500">[{preset.expectedTier}]</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Coordinate Inputs */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Target Latitude (°N)</label>
              <input
                type="number"
                step="0.0001"
                value={testLat}
                onChange={(e) => setTestLat(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Target Longitude (°E)</label>
              <input
                type="number"
                step="0.0001"
                value={testLng}
                onChange={(e) => setTestLng(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Decision Diagnostics & Calculations (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Main Serviceability Decision Card */}
          <div
            className={`rounded-xl border p-5 transition-all ${
              result.serviceable
                ? "bg-emerald-950/30 border-emerald-500/40"
                : "bg-rose-950/30 border-rose-500/40"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                {result.serviceable ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-400" />
                )}
                <div>
                  <h3 className="font-bold text-sm tracking-wide">
                    {result.serviceable ? "DISPATCH SERVICEABLE" : "DISPATCH INACTIVE"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Reason: <span className="font-mono text-slate-200">{result.reasonCode}</span>
                  </p>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border uppercase ${
                  result.serviceable
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                }`}
              >
                {result.serviceable ? "Active 15m" : "Suspended"}
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              {result.details}
            </p>

            {/* Diagnostic Metrics Matrix */}
            <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Matched Zone</span>
                <span className="font-medium text-slate-200 truncate block">
                  {result.matchedZone?.name || "None (Outside)"}
                </span>
                {result.matchedZone && (
                  <span className="text-[10px] text-indigo-400 uppercase mt-0.5 block">
                    Tier: {result.matchedZone.tier}
                  </span>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Schedule Window</span>
                <span className="font-medium text-slate-200 truncate block">
                  {result.activeSchedule?.name || "Closed Window"}
                </span>
                <span className="text-[10px] text-emerald-400 mt-0.5 block">
                  Type: {result.currentScheduleType}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Hub Distance (Haversine)</span>
                <span className="font-medium text-slate-200">
                  {hubStats.distanceKm} km
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Bearing / Azimuth</span>
                <span className="font-medium text-slate-200">
                  {hubStats.bearingDeg}° ({cardinalDirection})
                </span>
              </div>
            </div>

            {/* Boundary Distance if Outside */}
            {result.reasonCode === "OUTSIDE_GEOFENCE" && result.distanceToNearestZoneBoundaryKm !== undefined && (
              <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Customer is <strong>{result.distanceToNearestZoneBoundaryKm} km</strong> outside nearest polygon ({result.nearestZone?.name}).
                </span>
              </div>
            )}
          </div>

          {/* Time & Shift Simulator */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Temporal Dispatch Simulator
              </span>
              <button
                onClick={() => setUseCurrentSystemTime(!useCurrentSystemTime)}
                className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                  useCurrentSystemTime
                    ? "bg-indigo-600/30 border-indigo-500/50 text-indigo-300"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
              >
                {useCurrentSystemTime ? "Using Live Clock" : "Manual Simulation"}
              </button>
            </div>

            {!useCurrentSystemTime && (
              <div className="space-y-3 pt-1">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Simulated Time of Day</span>
                    <span className="font-mono text-slate-200 font-semibold">
                      {String(simulatedHour).padStart(2, "0")}:{String(simulatedMinute).padStart(2, "0")}
                      {simulatedHour >= 22 || simulatedHour < 4 ? " (Late Night Rollover)" : ""}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="23"
                    value={simulatedHour}
                    onChange={(e) => setSimulatedHour(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                    <span>00:00 (Midnight)</span>
                    <span>06:00 (Day)</span>
                    <span>18:00 (Eve)</span>
                    <span>22:00 (Night)</span>
                    <span>23:59</span>
                  </div>
                </div>

                {/* Day of week buttons */}
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1.5">Day of Week</span>
                  <div className="grid grid-cols-7 gap-1">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName, idx) => (
                      <button
                        key={dayName}
                        onClick={() => setSimulatedDayOfWeek(idx)}
                        className={`py-1 text-[10px] font-medium rounded border transition-colors ${
                          simulatedDayOfWeek === idx
                            ? "bg-indigo-600 text-white border-indigo-500"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800"
                        }`}
                      >
                        {dayName}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Shift Selector Pills */}
            <div className="flex items-center gap-1.5 pt-1">
              <button
                onClick={() => {
                  setSimulatedHour(12);
                  setSimulatedMinute(0);
                  setUseCurrentSystemTime(false);
                }}
                className="flex-1 py-1 px-2 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-[11px] text-slate-300 flex items-center justify-center gap-1"
              >
                <Sun className="w-3 h-3 text-amber-400" /> Daytime
              </button>
              <button
                onClick={() => {
                  setSimulatedHour(19);
                  setSimulatedMinute(30);
                  setUseCurrentSystemTime(false);
                }}
                className="flex-1 py-1 px-2 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-[11px] text-slate-300 flex items-center justify-center gap-1"
              >
                <Sunset className="w-3 h-3 text-orange-400" /> Evening
              </button>
              <button
                onClick={() => {
                  setSimulatedHour(2);
                  setSimulatedMinute(30);
                  setUseCurrentSystemTime(false);
                }}
                className="flex-1 py-1 px-2 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-[11px] text-slate-300 flex items-center justify-center gap-1"
              >
                <Moon className="w-3 h-3 text-indigo-400" /> 02:30 AM
              </button>
            </div>
          </div>

          {/* Emergency Weather & Road Restriction Command Box */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                Emergency Weather & Road Protocols
              </span>
              <button
                onClick={() => setEmergencyActive(!emergencyActive)}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition-all ${
                  emergencyActive
                    ? "bg-rose-500/30 text-rose-300 border-rose-500/50"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
              >
                {emergencyActive ? "OVERRIDE ENGAGED" : "NORMAL PROTOCOL"}
              </button>
            </div>

            {emergencyActive && (
              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-300 font-medium">Critical Fleet Freeze</label>
                  <input
                    type="checkbox"
                    checked={freezeAllDeliveries}
                    onChange={(e) => setFreezeAllDeliveries(e.target.checked)}
                    className="w-4 h-4 accent-rose-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Reason for Override</label>
                  <input
                    type="text"
                    value={emergencyReason}
                    onChange={(e) => setEmergencyReason(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* Exclude Specific Zones */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Selective Zone Exclusions</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {zones.map((zone) => {
                      const isExcluded = excludedZoneIds.includes(zone.id);
                      return (
                        <button
                          key={zone.id}
                          onClick={() => toggleZoneExclusion(zone.id)}
                          className={`text-left p-1.5 rounded border text-[11px] transition-colors truncate ${
                            isExcluded
                              ? "bg-rose-950/60 border-rose-500/60 text-rose-300"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800"
                          }`}
                        >
                          {zone.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Geofence Zone Registry Table */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Active Geofence Zone Registry ({zones.length} Zones)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Ray-Casting Boundary Guard Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800">
              <tr>
                <th className="px-4 py-2.5">Zone Name</th>
                <th className="px-4 py-2.5">Tier</th>
                <th className="px-4 py-2.5">Boundary Vertices</th>
                <th className="px-4 py-2.5">Allowed Schedules</th>
                <th className="px-4 py-2.5">Current Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {zones.map((zone) => {
                const rings = normalizePolygonDefinition(zone.polygon);
                const vertexCount = rings[0]?.outer.length || 0;
                const colors = getTierColor(zone.tier);
                const isMatch = result.matchedZone?.id === zone.id;
                const isExcluded =
                  emergencyActive &&
                  (freezeAllDeliveries || excludedZoneIds.includes(zone.id));

                return (
                  <tr
                    key={zone.id}
                    onClick={() => setSelectedZoneId(zone.id)}
                    className={`cursor-pointer transition-colors ${
                      isMatch
                        ? "bg-indigo-950/40 text-indigo-200"
                        : "hover:bg-slate-800/40"
                    }`}
                  >
                    <td className="px-4 py-2.5 font-sans font-medium text-slate-200 flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: colors.stroke }}
                      />
                      {zone.name}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${colors.badge}`}>
                        {zone.tier.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-400">
                      {vertexCount} coordinates
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 font-sans">
                      {zone.allowedSchedules?.join(", ") || "All"}
                    </td>
                    <td className="px-4 py-2.5 font-sans">
                      {isExcluded ? (
                        <span className="text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Suspended
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Live
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DynamicGeofenceManager;
