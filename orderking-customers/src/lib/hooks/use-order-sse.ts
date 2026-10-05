import { useEffect, useState } from "react";
import { getOrderTracking } from "@/lib/server/orders";

export type OrderSSEEvent = {
  orderId: string;
  status: string;
  riderLat?: number;
  riderLng?: number;
  eta?: number;
  step?: number;
  timestamp: string;
};

type ConnectionInfo = {
  effectiveType?: string;
  saveData?: boolean;
};

export function useOrderSSE(orderId: string | undefined, onEvent?: (e: OrderSSEEvent) => void) {
  const [lastEvent, setLastEvent] = useState<OrderSSEEvent | null>(null);
  const [connected, setConnected] = useState(false);
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    let stopped = false;
    let timer: number | undefined;

    const connection =
      typeof navigator !== "undefined"
        ? ((navigator as unknown as { connection?: ConnectionInfo }).connection ?? {})
        : {};
    const effectiveType = connection.effectiveType ?? "4g";
    const slow =
      effectiveType === "slow-2g" ||
      effectiveType === "2g" ||
      effectiveType === "3g" ||
      connection.saveData === true;
    setIsSlowNetwork(slow);

    const intervalMs = slow ? 5000 : 2500;

    const poll = async () => {
      try {
        const payload = await getOrderTracking({ data: { orderId } });
        if (stopped) return;

        if (!payload.found) {
          setConnected(false);
          return;
        }

        const event: OrderSSEEvent = {
          orderId: payload.orderId,
          status: payload.status,
          riderLat: payload.riderLat ?? undefined,
          riderLng: payload.riderLng ?? undefined,
          timestamp: payload.lastPingAt ?? new Date().toISOString(),
        };
        setLastEvent(event);
        setConnected(true);
        onEvent?.(event);
      } catch {
        if (!stopped) setConnected(false);
      } finally {
        if (!stopped) timer = window.setTimeout(poll, intervalMs);
      }
    };

    void poll();

    return () => {
      stopped = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [orderId, onEvent]);

  return { lastEvent, connected, isSlowNetwork };
}
