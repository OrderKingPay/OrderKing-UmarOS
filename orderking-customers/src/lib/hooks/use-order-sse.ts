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

  useEffect(() => {
    if (!orderId) return;
    
    let channel: any;
    let cancelled = false;

    import("@/lib/db-cloud").then(({ supabase }) => {
      if (cancelled) return;
      channel = supabase
        .channel(`public:orders:${orderId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: `id=eq.${orderId}`,
          },
          (payload: any) => {
            const raw = payload.new || {};
            const rawStatus = raw.status || raw.state || "";
            const data: OrderSSEEvent = {
              orderId: raw.id || orderId,
              status: String(rawStatus).toUpperCase(),
              riderLat: raw.rider_lat ?? raw.current_lat,
              riderLng: raw.rider_lng ?? raw.current_lng,
              timestamp: new Date().toISOString(),
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
