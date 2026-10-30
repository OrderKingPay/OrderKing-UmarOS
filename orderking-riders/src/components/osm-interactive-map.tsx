import { useEffect, useRef, useState } from "react";
import { LocateFixed, Plus, Minus, Navigation } from "lucide-react";
export interface MapMarkerItem {
  id: string;
  lat: number;
  lng: number;
  label: string;
  sublabel?: string;
  color?: string;
  type?: "customer" | "partner" | "rider" | "hub";
}
interface OsmInteractiveMapProps {
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  markers?: MapMarkerItem[];
  interactivePin?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
  className?: string;
  height?: string;
  darkTheme?: boolean;
}
export function OsmInteractiveMap({
  centerLat = 26.1445,
  centerLng = 91.7362,
  zoom: initialZoom = 14,
  markers = [],
  interactivePin = false,
  onLocationSelect,
  className = "",
  height = "320px",
  darkTheme = false,
}: OsmInteractiveMapProps) {
  const [lat, setLat] = useState(Number.isFinite(centerLat) ? centerLat : 26.1445);
  const [lng, setLng] = useState(Number.isFinite(centerLng) ? centerLng : 91.7362);
  const [zoom, setZoom] = useState(initialZoom);
  const [locating, setLocating] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (Number.isFinite(centerLat) && Number.isFinite(centerLng)) {
      setLat(centerLat);
      setLng(centerLng);
    }
  }, [centerLat, centerLng]);
  const locateViaGps = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextLat = pos.coords.latitude;
        const nextLng = pos.coords.longitude;
        setLat(nextLat);
        setLng(nextLng);
        setZoom(16);
        setLocating(false);
        onLocationSelect?.(nextLat, nextLng);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };
  // Calculate bounding box from center & zoom for OpenStreetMap embed + interactive overlay
  const span = 360 / Math.pow(2, zoom);
  const minLon = (lng - span * 0.9).toFixed(6);
  const maxLon = (lng + span * 0.9).toFixed(6);
  const minLat = (lat - span * 0.55).toFixed(6);
  const maxLat = (lat + span * 0.55).toFixed(6);
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik&marker=${lat.toFixed(6)}%2C${lng.toFixed(6)}`;
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactivePin || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = 0.5 - (e.clientY - rect.top) / rect.height;
    const nextLat = Number((lat + relY * span * 0.85).toFixed(6));
    const nextLng = Number((lng + relX * span * 1.4).toFixed(6));
    setLat(nextLat);
    setLng(nextLng);
    onLocationSelect?.(nextLat, nextLng);
  };
  return (
    <div
      ref={containerRef}
      style={{ height }}
      className={`relative w-full overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900 select-none ${className}`}
    >
      <iframe
        title="OrderKing Live Street Map"
        src={osmEmbedUrl}
        className={`h-full w-full border-0 ${darkTheme ? "invert-[0.88] hue-rotate-180 contrast-105" : ""}`}
        loading="lazy"
      />
      {interactivePin && (
        <div
          onClick={handleMapClick}
          title="Click anywhere on the map to move delivery pin"
          className="absolute inset-0 z-10 cursor-crosshair bg-transparent"
        />
      )}
      {/* Custom markers overlay */}
      {markers.length > 0 && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-20 flex max-w-[75%] flex-wrap gap-1.5">
          {markers.slice(0, 6).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setLat(m.lat);
                setLng(m.lng);
                onLocationSelect?.(m.lat, m.lng);
              }}
              className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-950/90 px-2.5 py-1 text-[11px] font-semibold text-white shadow-md backdrop-blur-md hover:border-amber-400"
            >
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: m.color || "#f59e0b" }}
              />
              <span className="truncate max-w-[140px]">{m.label}</span>
              {m.sublabel && <span className="text-[10px] text-slate-400">({m.sublabel})</span>}
            </button>
          ))}
        </div>
      )}
      {/* Map Controls */}
      <div className="absolute right-3 top-3 z-20 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={locateViaGps}
          className="flex size-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-950/90 text-amber-400 shadow-md hover:bg-slate-900"
          title="Locate my current GPS position"
        >
          <LocateFixed className={`size-4 ${locating ? "animate-spin" : ""}`} />
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(18, z + 1))}
          className="flex size-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-950/90 text-white shadow-md hover:bg-slate-900"
          title="Zoom in"
        >
          <Plus className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(5, z - 1))}
          className="flex size-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-950/90 text-white shadow-md hover:bg-slate-900"
          title="Zoom out"
        >
          <Minus className="size-4" />
        </button>
      </div>
      {/* Live Coordinates Pill */}
      <div className="pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-950/85 px-2.5 py-1 text-[11px] font-medium text-slate-200 backdrop-blur-md">
        <Navigation className="size-3 text-emerald-400" />
        <span>
          {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
        </span>
      </div>
    </div>
  );
}
