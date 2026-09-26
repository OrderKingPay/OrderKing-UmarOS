import { useEffect, useRef, useState } from "react";

type GPSPosition = { lat: number; lng: number; accuracy: number; heading: number | null; speed: number | null; ts: number };

export function useGpsHeartbeat(enabled: boolean, baseIntervalMs = 5_000, onUpdate?: (pos: GPSPosition) => void) {
  const lastRef = useRef<GPSPosition | null>(null);
  const [intervalMs, setIntervalMs] = useState(baseIntervalMs);
  const [highAccuracy, setHighAccuracy] = useState(true);

  // Battery Manager Hook
  useEffect(() => {
    if (!('getBattery' in navigator)) return;
    let battery: any;

    const updateBatteryStatus = () => {
      if (!battery) return;
      const isLow = battery.level <= 0.20 && !battery.charging;
      const isCritical = battery.level <= 0.10 && !battery.charging;
      
      // Exponential backoff multiplier based on battery
      if (isCritical) {
        setIntervalMs(baseIntervalMs * 6); // 30s
        setHighAccuracy(false); // Save battery
      } else if (isLow) {
        setIntervalMs(baseIntervalMs * 2); // 10s
        setHighAccuracy(false);
      } else {
        setIntervalMs(baseIntervalMs);
        setHighAccuracy(true);
      }
    };

    (navigator as any).getBattery().then((b: any) => {
      battery = b;
      updateBatteryStatus();
      battery.addEventListener('levelchange', updateBatteryStatus);
      battery.addEventListener('chargingchange', updateBatteryStatus);
    });

    return () => {
      if (battery) {
        battery.removeEventListener('levelchange', updateBatteryStatus);
        battery.removeEventListener('chargingchange', updateBatteryStatus);
      }
    };
  }, [baseIntervalMs]);

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
      enableHighAccuracy: highAccuracy,
      maximumAge: intervalMs,
      timeout: intervalMs + 5000,
    });

    timer = setInterval(() => {
      navigator.geolocation.getCurrentPosition(sendPosition, () => {}, { 
        enableHighAccuracy: highAccuracy, 
        maximumAge: intervalMs, 
        timeout: intervalMs 
      });
    }, intervalMs);

    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
      if (timer) clearInterval(timer);
    };
  }, [enabled, intervalMs, highAccuracy]);

  return lastRef;
}
