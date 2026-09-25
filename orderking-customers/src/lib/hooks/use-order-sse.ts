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
    let source: EventSource | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let pollingTimer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    async function pollFallback() {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/orders/${orderId}/status`, { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as OrderSSEEvent;
          setLastEvent(data);
          onEvent?.(data);
          setConnected(true);
        }
      } catch {
        setConnected(false);
      }
    }

    function connect() {
      if (cancelled) return;
      try {
        source = new EventSource(`/api/orders/${orderId}/stream`);
        source.onopen = () => {
          setConnected(true);
          setIsSlowNetwork(false);
          retryRef.current = 0;
          if (pollingTimer) {
            clearInterval(pollingTimer);
            pollingTimer = null;
          }
        };
        source.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data) as OrderSSEEvent;
            setLastEvent(data);
            onEvent?.(data);
          } catch {
            /* ignore malformed events */
          }
        };
        source.onerror = () => {
          setConnected(false);
          source?.close();
          retryRef.current = Math.min(retryRef.current + 1, 5);
          if (retryRef.current >= 3) {
            setIsSlowNetwork(true);
            if (!pollingTimer) {
              void pollFallback();
              pollingTimer = setInterval(() => void pollFallback(), 8000);
            }
          }
          const jitter = Math.floor(Math.random() * 1000);
          timer = setTimeout(connect, 1000 * Math.pow(2, retryRef.current) + jitter);
        };
      } catch {
        setIsSlowNetwork(true);
        if (!pollingTimer) {
          void pollFallback();
          pollingTimer = setInterval(() => void pollFallback(), 8000);
        }
      }
    }

    connect();
    return () => {
      cancelled = true;
      source?.close();
      if (timer) clearTimeout(timer);
      if (pollingTimer) clearInterval(pollingTimer);
    };
  }, [orderId]);

  return { lastEvent, connected, isSlowNetwork };
}
