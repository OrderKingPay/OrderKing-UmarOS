import { useEffect, useRef, useState } from "react";
import { postLocationFn } from "@/lib/server/rider-fns";
import {
  computePowerProfile,
  FleetSafetyEngine,
  STANDARD_GPS_INTERVAL_MS,
  LOW_BATTERY_GPS_INTERVAL_MS,
} from "@/lib/fleet/fleet-safety-engine";

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
  baseIntervalMs = STANDARD_GPS_INTERVAL_MS,
  onUpdate?: (pos: GPSPosition) => void,
  _riderId?: string,
  deliveryId?: string | null,
) {
  const lastRef = useRef<GPSPosition | null>(null);
  const [activeIntervalMs, setActiveIntervalMs] = useState(baseIntervalMs);

  // Monitor battery and adjust GPS heartbeat frequency dynamically
  useEffect(() => {
    if (typeof navigator === "undefined") return;

    let cleanup = () => {};

    // Check navigator.getBattery API
    const nav = navigator as any;
    if (typeof nav.getBattery === "function") {
      nav.getBattery().then((battery: any) => {
        const updateFromBattery = () => {
          const profile = computePowerProfile({
            level: battery.level,
            charging: battery.charging,
          });
          FleetSafetyEngine.getInstance().updateBatteryStatus({
            level: battery.level,
            charging: battery.charging,
          });
          setActiveIntervalMs(profile.gpsIntervalMs);
        };

        updateFromBattery();
        battery.addEventListener("levelchange", updateFromBattery);
        battery.addEventListener("chargingchange", updateFromBattery);

        cleanup = () => {
          battery.removeEventListener("levelchange", updateFromBattery);
          battery.removeEventListener("chargingchange", updateFromBattery);
        };
      }).catch(() => {
        // Fallback to base interval
      });
    }

    return () => cleanup();
  }, [baseIntervalMs]);

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
      timeout: activeIntervalMs,
    });

    timer = setInterval(() => {
      navigator.geolocation.getCurrentPosition(sendPosition, () => {}, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: activeIntervalMs,
      });
    }, activeIntervalMs);

    return () => {
      cancelled = true;
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
      if (timer) clearInterval(timer);
    };
  }, [enabled, activeIntervalMs, onUpdate, deliveryId]);

  return lastRef;
}
