import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/lib/db-cloud";

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
if (!mapboxToken) {
  throw new Error("Mapbox configuration is missing. Live tracking cannot start without a real token.");
}
mapboxgl.accessToken = mapboxToken;

interface LiveTrackingMapProps {
  dispatchJobId: string;
  initialLat: number;
  initialLng: number;
}

// Haversine distance for basic distance calculation if needed
function calcBearing(startLat: number, startLng: number, destLat: number, destLng: number) {
  const startLatRad = (startLat * Math.PI) / 180;
  const destLatRad = (destLat * Math.PI) / 180;
  const dLng = ((destLng - startLng) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(dLng);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

export function LiveTrackingMap({ dispatchJobId, initialLat, initialLng }: LiveTrackingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  
  const latRef = useRef<HTMLDivElement>(null);
  const lngRef = useRef<HTMLDivElement>(null);

  // For animation
  const currentPos = useRef<{ lat: number; lng: number }>({ lat: initialLat, lng: initialLng });
  const targetPos = useRef<{ lat: number; lng: number }>({ lat: initialLat, lng: initialLng });
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return; // initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [initialLng, initialLat],
      zoom: 15,
      pitch: 45,
    });

    const el = document.createElement('div');
    el.className = 'w-8 h-8 bg-primary rounded-full border-2 border-white shadow-[0_0_15px_rgba(var(--color-primary),0.8)] flex items-center justify-center';
    el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`;

    marker.current = new mapboxgl.Marker(el)
      .setLngLat([initialLng, initialLat])
      .addTo(map.current);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      map.current?.remove();
    };
  }, [initialLat, initialLng]);

  useEffect(() => {
    // 60fps interpolation loop
    let lastTime = performance.now();

    const animateMarker = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;

      const cLat = currentPos.current.lat;
      const cLng = currentPos.current.lng;
      const tLat = targetPos.current.lat;
      const tLng = targetPos.current.lng;

      // Linear interpolation factor (adjust for smoothness)
      const lerpFactor = 0.05 * (dt / 16); 

      // Calculate bearing before moving
      let bearing = 0;
      if (Math.abs(tLat - cLat) > 0.00001 || Math.abs(tLng - cLng) > 0.00001) {
        bearing = calcBearing(cLat, cLng, tLat, tLng);
        marker.current?.setRotation(bearing);
      }

      const nextLat = cLat + (tLat - cLat) * lerpFactor;
      const nextLng = cLng + (tLng - cLng) * lerpFactor;

      currentPos.current = { lat: nextLat, lng: nextLng };
      marker.current?.setLngLat([nextLng, nextLat]);
      
      if (latRef.current) latRef.current.innerText = nextLat.toFixed(6);
      if (lngRef.current) lngRef.current.innerText = nextLng.toFixed(6);

      // Keep map centered on marker smoothly
      map.current?.easeTo({
        center: [nextLng, nextLat],
        duration: 0, 
      });

      animationFrameId.current = requestAnimationFrame(animateMarker);
    };

    animationFrameId.current = requestAnimationFrame(animateMarker);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  useEffect(() => {
    // Subscribe to Supabase realtime
    const channel = supabase
      .channel(`public:dispatch_jobs:${dispatchJobId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "dispatch_jobs",
          filter: `id=eq.${dispatchJobId}`,
        },
        (payload: any) => {
          const { rider_lat, rider_lng } = payload.new;
          if (rider_lat && rider_lng) {
            targetPos.current = { lat: rider_lat, lng: rider_lng };
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dispatchJobId]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-white/10 shadow-2xl">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* HUD Overlay */}
      <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
        <div className="bg-black/80 backdrop-blur border border-white/10 rounded-lg p-3">
          <div className="text-xs text-muted/80 font-semibold uppercase tracking-wider mb-1">Live Telemetry</div>
          <div className="flex gap-4">
            <div>
              <div className="text-[10px] text-muted">LATITUDE</div>
              <div ref={latRef} className="text-sm font-mono text-white">
                {initialLat.toFixed(6)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted">LONGITUDE</div>
              <div ref={lngRef} className="text-sm font-mono text-white">
                {initialLng.toFixed(6)}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-primary/20 backdrop-blur border border-primary/50 text-primary px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-bold tracking-wide">60 FPS SYNC</span>
        </div>
      </div>
    </div>
  );
}
