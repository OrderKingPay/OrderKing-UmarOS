import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
if (!mapboxToken) {
  throw new Error("Mapbox configuration is missing. Live tracking cannot start without a real token.");
}
mapboxgl.accessToken = mapboxToken;

interface LiveTrackingMapProps {
  dispatchJobId: string;
  initialLat: number;
  initialLng: number;
  riderLat?: number;
  riderLng?: number;
}

function calcBearing(startLat: number, startLng: number, destLat: number, destLng: number) {
  const startLatRad = (startLat * Math.PI) / 180;
  const destLatRad = (destLat * Math.PI) / 180;
  const dLng = ((destLng - startLng) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(dLng);

  return (((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360;
}

export function LiveTrackingMap({ dispatchJobId, initialLat, initialLng, riderLat, riderLng }: LiveTrackingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const latRef = useRef<HTMLDivElement>(null);
  const lngRef = useRef<HTMLDivElement>(null);
  const currentPos = useRef({ lat: initialLat, lng: initialLng });
  const targetPos = useRef({ lat: initialLat, lng: initialLng });
  const animationFrameId = useRef<number | null>(null);
  const startAnimationRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/navigation-night-v1",
      center: [initialLng, initialLat],
      zoom: 15,
      pitch: 45,
    });

    const el = document.createElement("div");
    el.className =
      "w-8 h-8 bg-primary rounded-full border-2 border-white shadow-[0_0_15px_rgba(var(--color-primary),0.8)] flex items-center justify-center";
    el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`;

    marker.current = new mapboxgl.Marker(el)
      .setLngLat([initialLng, initialLat])
      .addTo(map.current);

    return () => {
      if (animationFrameId.current !== null) cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, [initialLat, initialLng]);

  useEffect(() => {
    let lastTime = 0;

    const animateMarker = (time: number) => {
      if (!marker.current) {
        animationFrameId.current = null;
        return;
      }

      const dt = Math.min(time - (lastTime || time), 120);
      lastTime = time;
      const cLat = currentPos.current.lat;
      const cLng = currentPos.current.lng;
      const tLat = targetPos.current.lat;
      const tLng = targetPos.current.lng;
      const deltaLat = tLat - cLat;
      const deltaLng = tLng - cLng;

      if (Math.abs(deltaLat) < 0.000001 && Math.abs(deltaLng) < 0.000001) {
        currentPos.current = { lat: tLat, lng: tLng };
        marker.current.setLngLat([tLng, tLat]);
        map.current?.jumpTo({ center: [tLng, tLat] });
        animationFrameId.current = null;
        return;
      }

      const step = Math.min(1, Math.max(0.08, dt / 650));
      const nextLat = cLat + deltaLat * step;
      const nextLng = cLng + deltaLng * step;
      currentPos.current = { lat: nextLat, lng: nextLng };
      marker.current.setLngLat([nextLng, nextLat]);
      marker.current.setRotation(calcBearing(cLat, cLng, tLat, tLng));
      map.current?.jumpTo({ center: [nextLng, nextLat] });

      if (latRef.current) latRef.current.innerText = nextLat.toFixed(6);
      if (lngRef.current) lngRef.current.innerText = nextLng.toFixed(6);

      animationFrameId.current = requestAnimationFrame(animateMarker);
    };

    startAnimationRef.current = () => {
      if (animationFrameId.current === null) {
        lastTime = 0;
        animationFrameId.current = requestAnimationFrame(animateMarker);
      }
    };

    return () => {
      startAnimationRef.current = null;
      if (animationFrameId.current !== null) cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof riderLat !== "number" || typeof riderLng !== "number") return;
    if (!Number.isFinite(riderLat) || !Number.isFinite(riderLng)) return;
    targetPos.current = { lat: riderLat, lng: riderLng };
    startAnimationRef.current?.();
  }, [riderLat, riderLng]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-white/10 shadow-2xl">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="pointer-events-none absolute left-4 right-4 top-4 flex justify-between">
        <div className="rounded-lg border border-white/10 bg-black/80 p-3 backdrop-blur">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted/80">Live Telemetry</div>
          <div className="flex gap-4">
            <div>
              <div className="text-[10px] text-muted">LATITUDE</div>
              <div ref={latRef} className="font-mono text-sm text-white">{initialLat.toFixed(6)}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted">LONGITUDE</div>
              <div ref={lngRef} className="font-mono text-sm text-white">{initialLng.toFixed(6)}</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-primary/50 bg-primary/20 px-3 py-1.5 text-primary backdrop-blur">
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          <span className="text-xs font-bold tracking-wide">LIVE GPS</span>
        </div>
      </div>
    </div>
  );
}
