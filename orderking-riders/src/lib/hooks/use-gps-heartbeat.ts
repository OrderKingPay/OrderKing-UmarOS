import { useEffect, useRef, useState } from "react";

type GPSPosition = { lat: number; lng: number; accuracy: number; heading: number | null; speed: number | null; ts: number };

export function useGpsHeartbeat(
  enabled: boolean,
  baseIntervalMs = 20_000,
  onUpdate?: (pos: GPSPosition) => void,
) {
  const lastRef = useRef<GPSPosition | null>(null);

  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !navigator.geolocation) return;
    let watchId: number | undefined;

    const sendPosition = (position: GeolocationPosition) => {
      const pos: GPSPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        ts: position.timestamp,
      };
      lastRef.current = pos;
      onUpdate?.(pos);
    };

    watchId = navigator.geolocation.watchPosition(sendPosition, () => undefined, {
      enableHighAccuracy: true,
      maximumAge: 5_000,
      timeout: Math.max(baseIntervalMs, 5_000),
    });

    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
    };
  }, [enabled, baseIntervalMs, onUpdate]);

  return lastRef;
}
