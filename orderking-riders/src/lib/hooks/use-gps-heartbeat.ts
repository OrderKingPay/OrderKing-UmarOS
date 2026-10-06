import { useEffect, useRef } from "react";
import { postLocationFn } from "@/lib/server/rider-fns";

type GPSPosition = {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  ts: number;
};

export function useGpsHeartbeat(
  enabled: boolean,
  baseIntervalMs = 2_000,
  onUpdate?: (pos: GPSPosition) => void,
  _riderId?: string,
  deliveryId?: string | null,
) {
  const lastRef = useRef<GPSPosition | null>(null);

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return;

    let watchId: number | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;
    let cancelled = false;

    async function sendPosition(position: GeolocationPosition) {
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

      if (cancelled) return;
      try {
        await postLocationFn({
          data: {
            lat: pos.lat,
            lng: pos.lng,
            accuracyM: Number.isFinite(pos.accuracy) ? pos.accuracy : null,
            deliveryId: deliveryId ?? null,
          },
        });
      } catch (error) {
        console.warn("OrderKing GPS heartbeat failed", error);
      }
    }

    watchId = navigator.geolocation.watchPosition(sendPosition, () => {}, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: baseIntervalMs,
    });

    timer = setInterval(() => {
      navigator.geolocation.getCurrentPosition(sendPosition, () => {}, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: baseIntervalMs,
      });
    }, baseIntervalMs);

    return () => {
      cancelled = true;
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
      if (timer) clearInterval(timer);
    };
  }, [enabled, baseIntervalMs, onUpdate, deliveryId]);

  return lastRef;
}
