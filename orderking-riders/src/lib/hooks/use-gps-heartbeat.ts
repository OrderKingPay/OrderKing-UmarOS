import { useEffect, useRef } from "react";
import { supabase } from "../db-cloud";

type GPSPosition = {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  ts: number;
};

type NetworkConnection = {
  effectiveType?: string;
  saveData?: boolean;
};

function distanceMeters(a: GPSPosition | null, b: GPSPosition): number {
  if (!a) return Number.POSITIVE_INFINITY;
  const earthRadiusM = 6_371_000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusM * Math.asin(Math.sqrt(h));
}

function getLocationProfile(baseIntervalMs: number) {
  const connection =
    typeof navigator !== "undefined"
      ? ((navigator as unknown as { connection?: NetworkConnection }).connection ?? {})
      : {};
  const effectiveType = connection.effectiveType ?? "4g";
  const slow = effectiveType === "slow-2g" || effectiveType === "2g";
  const constrained = slow || effectiveType === "3g" || connection.saveData === true;

  return {
    maximumAgeMs: constrained ? (slow ? 15_000 : 8_000) : 3_000,
    timeoutMs: constrained ? 12_000 : 8_000,
    persistEveryMs: constrained ? (slow ? 15_000 : 10_000) : 6_000,
    persistDistanceM: constrained ? 10 : 5,
    highAccuracy: !slow,
  };
}

export function useGpsHeartbeat(
  enabled: boolean,
  baseIntervalMs = 2_000,
  onUpdate?: (pos: GPSPosition) => void,
  riderId?: string,
) {
  const lastRef = useRef<GPSPosition | null>(null);

  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !navigator.geolocation) return;

    let watchId: number | undefined;
    let lastPersisted: GPSPosition | null = null;
    let lastPersistAt = 0;
    let stopped = false;
    const profile = getLocationProfile(baseIntervalMs);
    const channel = riderId ? supabase.channel("rider_gps") : null;

    if (channel) void channel.subscribe();

    async function sendPosition(position: GeolocationPosition) {
      if (stopped) return;

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

      if (!riderId || !channel) return;

      if (navigator.onLine) {
        void channel.send({
          type: "broadcast",
          event: "gps_update",
          payload: { riderId, pos },
        });
      }

      const now = Date.now();
      const movedM = distanceMeters(lastPersisted, pos);
      const shouldPersist =
        navigator.onLine &&
        (lastPersisted === null ||
          now - lastPersistAt >= profile.persistEveryMs ||
          movedM >= profile.persistDistanceM);

      if (!shouldPersist) return;

      lastPersistAt = now;
      lastPersisted = pos;

      void supabase
        .from("rider_locations")
        .insert({
          rider_id: riderId,
          lat: pos.lat,
          lng: pos.lng,
          accuracy: pos.accuracy,
          heading: pos.heading,
          speed: pos.speed,
          ts: new Date(pos.ts).toISOString(),
        })
        .then(() => undefined);
    }

    // One GPS source only: watchPosition already schedules fresh fixes.
    // This avoids the previous duplicate watch + interval traffic/battery drain.
    watchId = navigator.geolocation.watchPosition(
      sendPosition,
      () => undefined,
      {
        enableHighAccuracy: profile.highAccuracy,
        maximumAge: profile.maximumAgeMs,
        timeout: profile.timeoutMs,
      },
    );

    return () => {
      stopped = true;
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [enabled, baseIntervalMs, riderId, onUpdate]);

  return lastRef;
}
