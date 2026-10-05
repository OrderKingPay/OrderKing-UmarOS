import { useEffect, useRef, useState } from "react";
import { postLocationFn } from "@/lib/server/rider-fns";

type GPSPosition = { lat: number; lng: number; accuracy: number; heading: number | null; speed: number | null; ts: number };

export function useGpsHeartbeat(enabled: boolean, baseIntervalMs = 2_000, onUpdate?: (pos: GPSPosition) => void, riderId?: string) {
  const lastRef = useRef<GPSPosition | null>(null);

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return;
    let watchId: number | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;

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

      if (riderId) {
        try {
          await postLocationFn({
            data: {
              lat: pos.lat,
              lng: pos.lng,
              accuracyM: pos.accuracy,
              deliveryId: null,
            },
          });
        } catch {
          // Location persistence is retried by the next heartbeat/reconnect.
        }
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
        timeout: baseIntervalMs 
      });
    }, baseIntervalMs);

    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
      if (timer) clearInterval(timer);
    };
  }, [enabled, baseIntervalMs, riderId]);

  return lastRef;
}
