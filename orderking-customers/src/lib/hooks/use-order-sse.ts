import { useEffect, useRef, useState } from "react";

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
  const retryRef = useRef(0);

    useEffect(() => {
    if (!orderId) return;
    
    // 1000x Realism: Supabase Realtime WebSocket Connection
    let channel: any;
    let cancelled = false;

    import("@/lib/db-cloud").then(({ supabase }) => {
      if (cancelled) return;
      channel = supabase
        .channel(public:orders: + orderId)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: id=eq. + orderId,
          },
          (payload: any) => {
            const data: OrderSSEEvent = {
              orderId: payload.new.id,
              status: payload.new.status,
              riderLat: payload.new.rider_lat,
              riderLng: payload.new.rider_lng,
              timestamp: new Date().toISOString()
            };
            setLastEvent(data);
            onEvent?.(data);
            setConnected(true);
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            setConnected(true);
          }
        });
    }).catch(err => console.warn("Supabase realtime error", err));

    return () => {
      cancelled = true;
      if (channel) {
        import("@/lib/db-cloud").then(({ supabase }) => supabase.removeChannel(channel));
      }
    };
  }, [orderId]);

  return { lastEvent, connected, isSlowNetwork };
}
