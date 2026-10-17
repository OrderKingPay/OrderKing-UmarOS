import { useEffect, useState } from "react";
import { flushRiderOfflineQueue, registerDefaultRiderExecutor } from "@/lib/rider/rider-low-network";
import { deliveryActionFn } from "@/lib/server/rider-fns";

export function OfflineDetector() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const riderExecutor = async (action: any) => {
      if (action.action === "DUTY_TOGGLE") return;
      await deliveryActionFn({
        data: {
          deliveryId: action.deliveryId,
          action: action.action as any,
          idempotencyKey: action.idempotencyKey,
          ...(action.payload as any),
        },
      });
    };

    registerDefaultRiderExecutor(riderExecutor);

    const flushQueue = () => {
      void flushRiderOfflineQueue(riderExecutor);
    };

    const on = () => {
      setOnline(true);
      flushQueue();
    };
    const off = () => setOnline(false);

    setOnline(navigator.onLine);
    if (navigator.onLine) {
      flushQueue();
    }
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return null;
}

