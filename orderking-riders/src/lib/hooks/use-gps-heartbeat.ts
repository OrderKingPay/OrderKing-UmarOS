import { useEffect, useRef, useState } from "react";
import { supabase } from "../db-cloud";

type GPSPosition = { lat: number; lng: number; accuracy: number; heading: number | null; speed: number | null; ts: number };

export function useGpsHeartbeat(enabled: boolean, baseIntervalMs = 5_000, onUpdate?: (pos: GPSPosition) => void, riderId?: string) {
  const lastRef = useRef<GPSPosition | null>(null);

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return;
    let watchId: number | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;

    const channel = supabase.channel('rider_gps');
    channel.subscribe();

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
        // Send to realtime channel
        channel.send({
          type: 'broadcast',
          event: 'gps_update',
          payload: { riderId, pos }
        });

        // Insert into database
        await supabase.from('rider_locations').insert([
          { rider_id: riderId, lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy, heading: pos.heading, speed: pos.speed, ts: new Date(pos.ts).toISOString() }
        ]).select();
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
      supabase.removeChannel(channel);
    };
  }, [enabled, baseIntervalMs, riderId]);

  return lastRef;
}
