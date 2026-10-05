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
  riderId?: string,
  deliveryId?: string | null,
) {
  const lastRef = useRef<GPSPosition | null>(null);

  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !navigator.geolocation || !riderId) return;

    let watchId: number | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;
    let stopped = false;

    const sendPosition = async (position: GeolocationPosition) => {
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

      if (stopped) return;

      try {
        await postLocationFn({
          data: {
            lat: pos.lat,
            lng: pos.lng,
            accuracyM: Number.isFinite(pos.accuracy) ? pos.accuracy : null,
            deliveryId: deliveryId ?? null,
          },
        });
      } catch {
        // The server is authoritative. A rejected/stale/unauthorized ping is not
        // treated as a successful location update.
      }
    };

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        void sendPosition(position);
      },
      () => undefined,
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: Math.max(baseIntervalMs, 5_000),
      },
    );

    timer = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          void sendPosition(position);
        },
        () => undefined,
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: Math.max(baseIntervalMs, 5_000),
        },
      );
    }, baseIntervalMs);

    return () => {
      stopped = true;
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
      if (timer) clearInterval(timer);
    };
  }, [enabled, baseIntervalMs, onUpdate, riderId, deliveryId]);

  return lastRef;
}
