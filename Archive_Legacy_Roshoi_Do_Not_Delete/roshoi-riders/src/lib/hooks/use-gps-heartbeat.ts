import { useEffect, useRef } from "react";

type GPSPosition = { lat: number; lng: number; accuracy: number; heading: number | null; speed: number | null; ts: number };

export function useGpsHeartbeat(enabled: boolean, intervalMs = 10_000, onUpdate?: (pos: GPSPosition) => void) {
  const lastRef = useRef<GPSPosition | null>(null);

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return;
    let watchId: number | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;

    function sendPosition(position: GeolocationPosition) {
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
    }

    watchId = navigator.geolocation.watchPosition(sendPosition, () => {}, {
      enableHighAccuracy: true,
      maximumAge: intervalMs,
      timeout: 15_000,
    });

    timer = setInterval(() => {
      navigator.geolocation.getCurrentPosition(sendPosition, () => {}, { enableHighAccuracy: true, timeout: 10_000 });
    }, intervalMs);

    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
      if (timer) clearInterval(timer);
    };
  }, [enabled, intervalMs]);

  return lastRef;
}
