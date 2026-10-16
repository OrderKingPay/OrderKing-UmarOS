import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  Navigation,
  Compass,
  MapPin,
  Layers,
  ExternalLink,
  ShieldCheck,
  Zap,
  RotateCcw,
  Plus,
  Minus,
  Maximize2,
} from "lucide-react";
import { supabase } from "@/lib/db-cloud";

// ============================================================================
// 1. GEODETIC & INDIAN ROAD DISTANCE MATHEMATICS (HAVERSINE × 1.35)
// ============================================================================

export const EARTH_RADIUS_KM = 6371;
export const INDIAN_ROAD_FACTOR = 1.35; // Standard Indian city road winding factor

/**
 * Calculates standard Great-Circle Haversine distance between two coordinates in kilometers.
 */
export function calculateHaversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Calculates realistic Indian road distance by applying the road winding factor (1.35).
 * Grounded in empirical Indian urban delivery routing benchmarks.
 */
export function calculateIndianRoadDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  windingFactor = INDIAN_ROAD_FACTOR
): number {
  return calculateHaversineDistance(lat1, lng1, lat2, lng2) * windingFactor;
}

/**
 * Computes forward azimuth / bearing in degrees [0, 360) between two coordinates.
 */
export function calculateBearing(
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number
): number {
  const startLatRad = (startLat * Math.PI) / 180;
  const destLatRad = (destLat * Math.PI) / 180;
  const dLng = ((destLng - startLng) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(dLng);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * Computes estimated time of arrival (ETA) in minutes based on two-wheeler urban traffic.
 * Default average speed: 22 km/h in Indian urban density.
 */
export function calculateETA(distanceKm: number, avgSpeedKmh = 22): number {
  if (distanceKm <= 0.05) return 1;
  return Math.max(2, Math.round((distanceKm / avgSpeedKmh) * 60));
}

/**
 * Direct Google Maps Turn-by-Turn two-wheeler web deep link.
 */
export function getGoogleMapsTwoWheelerDeepLink(destLat: number, destLng: number): string {
  const safeLat = Number(destLat) || 0;
  const safeLng = Number(destLng) || 0;
  return `https://www.google.com/maps/dir/?api=1&destination=${safeLat},${safeLng}&travelmode=two-wheeler`;
}

/**
 * Native Android Google Navigation intent for two-wheelers (`mode=b`).
 */
export function getGoogleMapsTwoWheelerIntent(destLat: number, destLng: number): string {
  const safeLat = Number(destLat) || 0;
  const safeLng = Number(destLng) || 0;
  return `google.navigation:q=${safeLat},${safeLng}&mode=b`;
}

// ============================================================================
// 2. SLIPPY MAP TILE MATH (EPSG:3857 WEB MERCATOR - 0 API KEYS)
// ============================================================================

export function latLngToWorldPx(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const scale = 256 * Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * scale;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale;
  return { x, y };
}

export function worldPxToLatLng(x: number, y: number, zoom: number): { lat: number; lng: number } {
  const scale = 256 * Math.pow(2, zoom);
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat, lng };
}

export type TileProvider = "carto_voyager" | "osm";

/**
 * Returns free tile URLs for OpenStreetMap or Carto Voyager with zero API keys required.
 */
export function getTileUrl(x: number, y: number, zoom: number, provider: TileProvider): string {
  const maxTile = Math.pow(2, zoom);
  const wrappedX = ((x % maxTile) + maxTile) % maxTile;
  if (y < 0 || y >= maxTile) {
    return "";
  }
  if (provider === "carto_voyager") {
    const subdomains = ["a", "b", "c", "d"];
    const sub = subdomains[Math.abs(wrappedX + y) % subdomains.length];
    return `https://${sub}.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${wrappedX}/${y}.png`;
  }
  return `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png`;
}

// ============================================================================
// 3. COMPONENT INTERFACES
// ============================================================================

export interface ResilientLiveMapProps {
  orderId?: string;
  dispatchJobId?: string;
  status?: string;
  restaurantName?: string;
  restaurantLat?: number;
  restaurantLng?: number;
  deliveryLat?: number;
  deliveryLng?: number;
  initialRiderLat?: number;
  initialRiderLng?: number;
  riderName?: string;
  riderVehicle?: string;
  deliveryAddress?: string;
  riderProgressOverride?: number;
  etaOverride?: number;
  etaMinutes?: number;
  className?: string;

  // Object-style coordinates support
  restaurant?: { lat: number; lng: number; label?: string };
  customer?: { lat: number; lng: number; label?: string };
  rider?: { lat: number; lng: number; label?: string };
}

// ============================================================================
// 4. RESILIENT LIVE MAP COMPONENT (FAIL-SAFE ZERO API KEYS MAP)
// ============================================================================

export function ResilientLiveMap({
  orderId = "demo-order",
  dispatchJobId,
  status = "ON_THE_WAY",
  restaurantName = "Restaurant Kitchen",
  restaurantLat = 22.5726,
  restaurantLng = 88.3639,
  deliveryLat = 22.585,
  deliveryLng = 88.375,
  initialRiderLat,
  initialRiderLng,
  riderName = "Delivery Partner",
  riderVehicle = "Electric Two-Wheeler",
  deliveryAddress = "Customer Delivery Point",
  riderProgressOverride,
  etaOverride,
  etaMinutes,
  className = "",
  restaurant,
  customer,
  rider,
}: ResilientLiveMapProps) {
  const effectiveJobId = dispatchJobId || orderId;

  // Resolve effective coordinates (supporting both flat props & nested object props)
  const effRestaurantLat = restaurant?.lat ?? restaurantLat;
  const effRestaurantLng = restaurant?.lng ?? restaurantLng;
  const effRestaurantName = restaurant?.label ?? restaurantName;

  const effDeliveryLat = customer?.lat ?? deliveryLat;
  const effDeliveryLng = customer?.lng ?? deliveryLng;
  const effDeliveryAddress = customer?.label ?? deliveryAddress;

  const effRiderName = rider?.label ?? riderName;
  const effEtaOverride = etaMinutes ?? etaOverride;

  // Initial rider location defaults between restaurant and customer
  const initialRider = useMemo(() => {
    return {
      lat: rider?.lat ?? initialRiderLat ?? (effRestaurantLat + (effDeliveryLat - effRestaurantLat) * 0.35),
      lng: rider?.lng ?? initialRiderLng ?? (effRestaurantLng + (effDeliveryLng - effRestaurantLng) * 0.35),
    };
  }, [rider?.lat, rider?.lng, initialRiderLat, initialRiderLng, effRestaurantLat, effRestaurantLng, effDeliveryLat, effDeliveryLng]);

  // Viewport camera state
  const [zoom, setZoom] = useState(15);
  const [center, setCenter] = useState<{ lat: number; lng: number }>(initialRider);
  const [tileProvider, setTileProvider] = useState<TileProvider>("carto_voyager");
  const [followRider, setFollowRider] = useState(true);

  // Live Telemetry Readout State
  const [telemetry, setTelemetry] = useState({
    currentLat: initialRider.lat,
    currentLng: initialRider.lng,
    bearing: 45,
    indianRoadKm: calculateIndianRoadDistance(initialRider.lat, initialRider.lng, effDeliveryLat, effDeliveryLng),
    straightKm: calculateHaversineDistance(initialRider.lat, initialRider.lng, effDeliveryLat, effDeliveryLng),
    etaMinutes: effEtaOverride ?? calculateETA(calculateIndianRoadDistance(initialRider.lat, initialRider.lng, effDeliveryLat, effDeliveryLng)),
    fpsActive: true,
  });

  // Smooth 60fps Interpolation Refs
  const currentPosRef = useRef<{ lat: number; lng: number }>({ ...initialRider });
  const targetPosRef = useRef<{ lat: number; lng: number }>({ ...initialRider });
  const bearingRef = useRef<number>(45);
  const animFrameIdRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 600, height: 350 });

  // Dragging / Pan Interaction State
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startCenterX: number; startCenterY: number }>({
    mouseX: 0,
    mouseY: 0,
    startCenterX: 0,
    startCenterY: 0,
  });

  // Track container dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(280, rect.width),
          height: Math.max(240, rect.height),
        });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Update target coordinates based on status & overrides
  useEffect(() => {
    if (status === "DELIVERED") {
      targetPosRef.current = { lat: effDeliveryLat, lng: effDeliveryLng };
      return;
    }

    if (riderProgressOverride !== undefined) {
      const p = Math.max(0, Math.min(1, riderProgressOverride));
      targetPosRef.current = {
        lat: effRestaurantLat + (effDeliveryLat - effRestaurantLat) * p,
        lng: effRestaurantLng + (effDeliveryLng - effRestaurantLng) * p,
      };
      return;
    }

    // Default simulation step along corridor if live stream isn't firing
    const interval = setInterval(() => {
      const prev = targetPosRef.current;
      const dLat = effDeliveryLat - prev.lat;
      const dLng = effDeliveryLng - prev.lng;
      const distRemaining = Math.sqrt(dLat * dLat + dLng * dLng);
      if (distRemaining < 0.0003) {
        targetPosRef.current = { lat: effDeliveryLat, lng: effDeliveryLng };
        return;
      }
      // Advance slightly toward customer
      const step = 0.00025;
      targetPosRef.current = {
        lat: prev.lat + (dLat / distRemaining) * step,
        lng: prev.lng + (dLng / distRemaining) * step,
      };
    }, 3500);

    return () => clearInterval(interval);
  }, [status, riderProgressOverride, effRestaurantLat, effRestaurantLng, effDeliveryLat, effDeliveryLng]);

  // Real-time Supabase telemetry listener
  useEffect(() => {
    if (!supabase || !effectiveJobId) return;

    try {
      const channel = supabase
        .channel(`public:resilient_dispatch:${effectiveJobId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `id=eq.${effectiveJobId}`,
          },
          (payload: any) => {
            const { rider_lat, rider_lng } = payload.new || {};
            if (rider_lat && rider_lng) {
              targetPosRef.current = { lat: Number(rider_lat), lng: Number(rider_lng) };
            }
          }
        )
        .subscribe();

      return () => {
        void supabase.removeChannel(channel);
      };
    } catch {
      // Graceful fallback to simulated position stream
    }
  }, [effectiveJobId]);

  // 60 FPS RequestAnimationFrame Linear Interpolation Loop
  useEffect(() => {
    let lastTime = performance.now();
    let frameCounter = 0;

    const animate = (time: number) => {
      const dt = Math.min(time - lastTime, 100);
      lastTime = time;

      const cLat = currentPosRef.current.lat;
      const cLng = currentPosRef.current.lng;
      const tLat = targetPosRef.current.lat;
      const tLng = targetPosRef.current.lng;

      // Smooth linear interpolation factor (~60fps calibrated)
      const lerpFactor = Math.min(1, 0.06 * (dt / 16.67));

      if (Math.abs(tLat - cLat) > 0.000005 || Math.abs(tLng - cLng) > 0.000005) {
        const nextBearing = calculateBearing(cLat, cLng, tLat, tLng);
        bearingRef.current = nextBearing;
      }

      const nextLat = cLat + (tLat - cLat) * lerpFactor;
      const nextLng = cLng + (tLng - cLng) * lerpFactor;

      currentPosRef.current = { lat: nextLat, lng: nextLng };

      // Update state for HUD and UI (throttled to ~15fps state update for React, while canvas/ref remains 60fps)
      frameCounter++;
      if (frameCounter % 4 === 0) {
        const straight = calculateHaversineDistance(nextLat, nextLng, deliveryLat, deliveryLng);
        const road = straight * INDIAN_ROAD_FACTOR;
        const eta = etaOverride ?? calculateETA(road);

        setTelemetry({
          currentLat: nextLat,
          currentLng: nextLng,
          bearing: bearingRef.current,
          indianRoadKm: road,
          straightKm: straight,
          etaMinutes: status === "DELIVERED" ? 0 : eta,
          fpsActive: true,
        });

        if (followRider && !isDraggingRef.current) {
          setCenter({ lat: nextLat, lng: nextLng });
        }
      }

      animFrameIdRef.current = requestAnimationFrame(animate);
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [effDeliveryLat, effDeliveryLng, effEtaOverride, followRider, status]);

  // Convert World Mercator pixels to Screen Pixels
  const centerWorld = useMemo(() => {
    return latLngToWorldPx(center.lat, center.lng, zoom);
  }, [center.lat, center.lng, zoom]);

  const worldToScreen = useCallback(
    (lat: number, lng: number) => {
      const pt = latLngToWorldPx(lat, lng, zoom);
      return {
        x: dimensions.width / 2 + (pt.x - centerWorld.x),
        y: dimensions.height / 2 + (pt.y - centerWorld.y),
      };
    },
    [centerWorld, dimensions.width, dimensions.height, zoom]
  );

  // Compute bounding tile grid for visible viewport
  const visibleTiles = useMemo(() => {
    const halfW = dimensions.width / 2;
    const halfH = dimensions.height / 2;

    const minPx = centerWorld.x - halfW;
    const maxPx = centerWorld.x + halfW;
    const minPy = centerWorld.y - halfH;
    const maxPy = centerWorld.y + halfH;

    const minTx = Math.floor(minPx / 256);
    const maxTx = Math.floor(maxPx / 256);
    const minTy = Math.floor(minPy / 256);
    const maxTy = Math.floor(maxPy / 256);

    const tiles: { key: string; x: number; y: number; left: number; top: number; url: string }[] = [];

    for (let tx = minTx; tx <= maxTx; tx++) {
      for (let ty = minTy; ty <= maxTy; ty++) {
        const left = halfW + (tx * 256 - centerWorld.x);
        const top = halfH + (ty * 256 - centerWorld.y);
        const url = getTileUrl(tx, ty, zoom, tileProvider);
        if (url) {
          tiles.push({
            key: `${zoom}-${tx}-${ty}-${tileProvider}`,
            x: tx,
            y: ty,
            left,
            top,
            url,
          });
        }
      }
    }
    return tiles;
  }, [centerWorld, dimensions.width, dimensions.height, zoom, tileProvider]);

  // Screen coordinates for overlay elements
  const restaurantScreen = worldToScreen(effRestaurantLat, effRestaurantLng);
  const deliveryScreen = worldToScreen(effDeliveryLat, effDeliveryLng);
  const riderScreen = worldToScreen(telemetry.currentLat, telemetry.currentLng);

  // Pan interaction handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("a")) {
      return;
    }
    isDraggingRef.current = true;
    setFollowRider(false);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startCenterX: centerWorld.x,
      startCenterY: centerWorld.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;

    const newCenterX = dragStartRef.current.startCenterX - dx;
    const newCenterY = dragStartRef.current.startCenterY - dy;

    const newCoord = worldPxToLatLng(newCenterX, newCenterY, zoom);
    setCenter(newCoord);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe no-op
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(18, z + 1));
    } else if (e.deltaY > 0) {
      setZoom((z) => Math.max(12, z - 1));
    }
  };

  const handleRecenterRider = () => {
    setFollowRider(true);
    setCenter({ lat: telemetry.currentLat, lng: telemetry.currentLng });
  };

  const handleFitBounds = () => {
    setFollowRider(false);
    const midLat = (effRestaurantLat + effDeliveryLat) / 2;
    const midLng = (effRestaurantLng + effDeliveryLng) / 2;
    setCenter({ lat: midLat, lng: midLng });
    setZoom(14);
  };

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl border border-amber-400/50 bg-stone-950 shadow-xl select-none ${className}`}
      style={{ height: "380px" }}
    >
      {/* Interactive Tile Canvas / Viewport */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        className="absolute inset-0 cursor-grab active:cursor-grabbing overflow-hidden bg-[#e8e0d8]"
        tabIndex={0}
        role="region"
        aria-label="Resilient OpenStreetMap Telemetry Map"
      >
        {/* Render Free Slippy Tiles (Carto Voyager or OSM) */}
        {visibleTiles.map((tile) => (
          <img
            key={tile.key}
            src={tile.url}
            alt=""
            loading="eager"
            decoding="async"
            draggable={false}
            className="absolute pointer-events-none transition-opacity duration-300"
            style={{
              left: `${tile.left}px`,
              top: `${tile.top}px`,
              width: "256px",
              height: "256px",
            }}
          />
        ))}

        {/* SVG Route Trajectory Vector Overlay */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={dimensions.width}
          height={dimensions.height}
        >
          {/* Base Planned Corridor Path (Dashed Amber) */}
          <line
            x1={restaurantScreen.x}
            y1={restaurantScreen.y}
            x2={deliveryScreen.x}
            y2={deliveryScreen.y}
            stroke="#F59E0B"
            strokeWidth="5"
            strokeDasharray="6 6"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* Active Travel Progress Line (Solid Emerald) */}
          <line
            x1={restaurantScreen.x}
            y1={restaurantScreen.y}
            x2={riderScreen.x}
            y2={riderScreen.y}
            stroke="#10B981"
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.95"
          />
        </svg>

        {/* 🍳 Restaurant Marker */}
        <div
          className="absolute pointer-events-none transition-transform duration-75"
          style={{
            left: `${restaurantScreen.x}px`,
            top: `${restaurantScreen.y}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="flex flex-col items-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg border-2 border-white ring-2 ring-amber-400/50">
              🍳
            </div>
            <span className="mt-1 max-w-[110px] truncate rounded-md bg-stone-900/90 px-1.5 py-0.5 text-[9px] font-bold text-amber-200 shadow-sm border border-amber-400/30">
              {effRestaurantName}
            </span>
          </div>
        </div>

        {/* 🏠 Customer Delivery Marker */}
        <div
          className="absolute pointer-events-none transition-transform duration-75"
          style={{
            left: `${deliveryScreen.x}px`,
            top: `${deliveryScreen.y}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="flex flex-col items-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-lg border-2 border-white ring-2 ring-rose-400/50 animate-bounce">
              📍
            </div>
            <span className="mt-1 max-w-[110px] truncate rounded-md bg-stone-900/90 px-1.5 py-0.5 text-[9px] font-bold text-rose-200 shadow-sm border border-rose-400/30">
              {effDeliveryAddress}
            </span>
          </div>
        </div>

        {/* 🛵 60FPS Smooth Animated Rider Marker with Dynamic Bearing */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${riderScreen.x}px`,
            top: `${riderScreen.y}px`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* Radar Ripple Effect */}
          <div className="absolute -inset-4 rounded-full bg-emerald-400/30 animate-ping" />
          <div className="absolute -inset-2 rounded-full bg-emerald-500/20 animate-pulse" />

          {/* Rotating Two-Wheeler Icon */}
          <div
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white border-2 border-white shadow-2xl transition-transform duration-100 ease-out"
            style={{ transform: `rotate(${telemetry.bearing}deg)` }}
          >
            <span className="text-lg">🛵</span>
          </div>

          <div className="mt-1.5 flex justify-center">
            <span className="rounded-full bg-emerald-950/90 border border-emerald-400/40 px-2 py-0.5 text-[9px] font-black text-emerald-300 shadow-md uppercase tracking-wider">
              {effRiderName}
            </span>
          </div>
        </div>
      </div>

      {/* TOP HUD: Live Telemetry & Road Distance Overlay */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between pointer-events-none z-10 gap-2">
        {/* Left Telemetry Card */}
        <div className="rounded-2xl border border-stone-800/80 bg-stone-950/90 backdrop-blur-md p-3 text-white shadow-2xl pointer-events-auto">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <span>Live Telemetry</span>
              <span className="text-[9px] font-normal text-stone-400">(Zero API Keys)</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
            <div>
              <span className="text-[10px] text-stone-400 block font-sans">INDIAN ROAD DIST</span>
              <span className="text-emerald-400 font-bold text-sm">
                {telemetry.indianRoadKm.toFixed(2)} km
              </span>
              <span className="text-[9px] text-stone-500 block">Haversine × 1.35</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-400 block font-sans">ESTIMATED ARRIVAL</span>
              <span className="text-amber-300 font-bold text-sm">
                {status === "DELIVERED" ? "Delivered" : `~${telemetry.etaMinutes} mins`}
              </span>
              <span className="text-[9px] text-stone-500 block">2-Wheeler Speed</span>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-stone-800/80 flex items-center gap-3 text-[10px] text-stone-400 font-mono">
            <span>LAT: {telemetry.currentLat.toFixed(6)}</span>
            <span>LNG: {telemetry.currentLng.toFixed(6)}</span>
          </div>
        </div>

        {/* Right Badges & Tile Selector */}
        <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-[10px] font-bold text-emerald-300 backdrop-blur-md shadow-lg">
            <Zap className="size-3 text-emerald-400 fill-emerald-400 animate-pulse" />
            <span>60 FPS LERP</span>
          </div>

          <div className="flex rounded-xl border border-stone-800 bg-stone-950/90 p-0.5 text-[10px] font-bold text-stone-300 backdrop-blur-md shadow-lg">
            <button
              type="button"
              onClick={() => setTileProvider("carto_voyager")}
              className={`px-2 py-0.5 rounded-lg transition ${
                tileProvider === "carto_voyager" ? "bg-amber-500 text-stone-950 font-black shadow-xs" : "hover:text-white"
              }`}
            >
              Carto
            </button>
            <button
              type="button"
              onClick={() => setTileProvider("osm")}
              className={`px-2 py-0.5 rounded-lg transition ${
                tileProvider === "osm" ? "bg-amber-500 text-stone-950 font-black shadow-xs" : "hover:text-white"
              }`}
            >
              OSM
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION BAR: Map Controls & Direct Google Maps Two-Wheeler Deep Link */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        {/* Direct Google Maps Deep Link Button */}
        <div className="pointer-events-auto">
          <a
            href={getGoogleMapsTwoWheelerDeepLink(effDeliveryLat, effDeliveryLng)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 px-3.5 py-2 text-xs font-black text-stone-950 shadow-xl shadow-amber-500/25 transition-all active:scale-95 border border-amber-300 no-underline cursor-pointer"
          >
            <span className="text-sm">🛵</span>
            <span>Open Two-Wheeler Nav (Google Maps)</span>
            <ExternalLink className="size-3 stroke-[2.5]" />
          </a>
        </div>

        {/* Viewport Zoom & Recenter Controls */}
        <div className="flex items-center gap-1.5 rounded-2xl border border-stone-800 bg-stone-950/90 backdrop-blur-md p-1 pointer-events-auto shadow-xl">
          <button
            type="button"
            onClick={handleRecenterRider}
            title="Recenter on Delivery Rider"
            className={`p-1.5 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800 transition ${
              followRider ? "text-emerald-400 bg-emerald-500/20" : ""
            }`}
          >
            <RotateCcw className="size-4" />
          </button>
          <button
            type="button"
            onClick={handleFitBounds}
            title="Fit Entire Route"
            className="p-1.5 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800 transition"
          >
            <Maximize2 className="size-4" />
          </button>
          <div className="h-4 w-px bg-stone-800 mx-0.5" />
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(18, z + 1))}
            title="Zoom In"
            className="p-1.5 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800 transition"
          >
            <Plus className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(12, z - 1))}
            title="Zoom Out"
            className="p-1.5 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800 transition"
          >
            <Minus className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}