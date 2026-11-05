import { useEffect, useRef, useState } from "react";
import { quadPartySyncClient, type QuadPartyOrderPayload } from "@orderking/ui";

export type OrderSSEEvent = {
  orderId: string;
  status: string;
  riderLat?: number;
  riderLng?: number;
  eta?: number;
  step?: number;
  timestamp: string;
};

export function useOrderSSE(orderId: string | undefined, onEvent?: (e: OrderSSEEvent) => void) {
  const [lastEvent, setLastEvent] = useState<OrderSSEEvent | null>(null);
  const [connected, setConnected] = useState(false);
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!orderId) return;

    let channel: any;
    let cancelled = false;

    // 1. Instant Quad-Party WebSocket Subscription (< 5ms local, < 100ms edge)
    const unsubscribeQuad = quadPartySyncClient.subscribe(
      { role: "customer", orderId },
      (event: QuadPartyOrderPayload) => {
        const data: OrderSSEEvent = {
          orderId: event.orderId,
          status: event.status,
          riderLat: event.riderLat,
          riderLng: event.riderLng,
          timestamp: event.timestamp || new Date().toISOString(),
        };
        setLastEvent(data);
        onEventRef.current?.(data);
        setConnected(true);
      }
    );

    // 2. Supabase Realtime Postgres Changes Subscription
    import("@/lib/db-cloud")
      .then(({ supabase }) => {
        if (cancelled) return;
        channel = supabase
          .channel(`public:orders:${orderId}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "orders",
              filter: `id=eq.${orderId}`,
            },
            (payload: any) => {
              const status = payload.new.status || payload.new.state || "PLACED";
              const data: OrderSSEEvent = {
                orderId: payload.new.id,
                status,
                riderLat: payload.new.rider_lat ? parseFloat(payload.new.rider_lat) : undefined,
                riderLng: payload.new.rider_lng ? parseFloat(payload.new.rider_lng) : undefined,
                timestamp: new Date().toISOString(),
              };
              setLastEvent(data);
              onEventRef.current?.(data);
              setConnected(true);
            }
          )
          .subscribe((status: string) => {
            if (status === "SUBSCRIBED") {
              setConnected(true);
            }
          });
      })
      .catch((err) => console.warn("[useOrderSSE] Supabase realtime fallback warning:", err));

    return () => {
      cancelled = true;
      unsubscribeQuad();
      if (channel) {
        import("@/lib/db-cloud").then(({ supabase }) => supabase.removeChannel(channel));
      }
    };
  }, [orderId]);

  return { lastEvent, connected, isSlowNetwork };
}
