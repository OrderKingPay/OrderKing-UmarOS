import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { VendorShell } from "@/components/vendor-shell";
import { OrderCard, type OrderView } from "@/components/order-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useT } from "@/components/use-t";
import { useVendor } from "@/components/use-vendor";
import { useClientState } from "@/lib/client-state";
import { listOrders } from "@/lib/server/api-orders";
import { isFeatureEnabled } from "@/lib/platform-config";
import { Volume2, VolumeX } from "lucide-react";

export const Route = createFileRoute("/orders")({ component: OrdersPage });

// Global continuous alarm state
let alarmAudioCtx: AudioContext | null = null;
let alarmOscillator: OscillatorNode | null = null;
let alarmGain: GainNode | null = null;
let isAlarmPlaying = false;

function startContinuousAlarm() {
  if (isAlarmPlaying) return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    
    if (!alarmAudioCtx) {
      alarmAudioCtx = new AudioContextClass();
    }
    
    if (alarmAudioCtx.state === 'suspended') {
      alarmAudioCtx.resume();
    }
    
    alarmOscillator = alarmAudioCtx.createOscillator();
    alarmGain = alarmAudioCtx.createGain();
    
    alarmOscillator.type = "square";
    const lfo = alarmAudioCtx.createOscillator();
    lfo.type = "square";
    lfo.frequency.value = 2; // Beeps twice a second
    
    const lfoGain = alarmAudioCtx.createGain();
    lfoGain.gain.value = 800;
    
    lfo.connect(lfoGain);
    lfoGain.connect(alarmOscillator.frequency);
    
    alarmOscillator.frequency.value = 800;
    alarmGain.gain.value = 0.05;
    
    alarmOscillator.connect(alarmGain);
    alarmGain.connect(alarmAudioCtx.destination);
    
    alarmOscillator.start();
    lfo.start();
    
    isAlarmPlaying = true;
  } catch (e) {
    console.error("Failed to start continuous alarm", e);
  }
}

function stopContinuousAlarm() {
  if (!isAlarmPlaying) return;
  try {
    if (alarmOscillator) {
      alarmOscillator.stop();
      alarmOscillator.disconnect();
      alarmOscillator = null;
    }
    if (alarmGain) {
      alarmGain.disconnect();
      alarmGain = null;
    }
    isAlarmPlaying = false;
  } catch (e) {
    console.error("Failed to stop alarm", e);
  }
}

function OrdersPage() {
  const t = useT();
  const vendor = useVendor();
  const qc = useQueryClient();
  const soundOn = useClientState((s) => s.soundOn);
  const setSoundOn = useClientState((s) => s.setSoundOn);
  const [scope, setScope] = useState<"live" | "history">("live");
  const q = useQuery({
    queryKey: ["orders", vendor.restaurantId, scope],
    queryFn: () => listOrders({ data: { restaurantId: vendor.restaurantId, scope } }),
    enabled: Boolean(vendor.restaurantId),
    refetchInterval: scope === "live" ? 3000 : false,
  });

  const pending = q.data?.orders.filter((o: any) => o.state === "PLACED").length ?? 0;
  const prev = useRef(pending);
  useEffect(() => {
    if (scope === "live" && isFeatureEnabled("new_order_sound") && soundOn && pending > 0) {
      startContinuousAlarm();
    } else {
      stopContinuousAlarm();
    }
    prev.current = pending;

    return () => stopContinuousAlarm();
  }, [pending, soundOn, scope]);

  if (!vendor.restaurantId && !vendor.isPending) {
    return (
      <VendorShell title={t("nav.orders")}>
        <Card className="space-y-3">
          <p>{t("onboarding.title")}</p>
          <Button asChild>
            <Link to="/onboarding">{t("common.next")}</Link>
          </Button>
        </Card>
      </VendorShell>
    );
  }

  return (
    <VendorShell
      title={t("nav.orders")}
      dataLabel={q.data?.dataLabel ?? vendor.dataLabel}
      stale={q.isError}
      restaurantName={vendor.selected?.restaurantName}
    >
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant={scope === "live" ? "primary" : "secondary"} onClick={() => setScope("live")}>
            {t("orders.live")}
          </Button>
          <Button variant={scope === "history" ? "primary" : "secondary"} onClick={() => setScope("history")}>
            {t("orders.history")}
          </Button>
        </div>
        {scope === "live" && (
          <Button
            variant="secondary"
            size="icon"
            aria-label={soundOn ? t("kitchen.soundOn") : t("kitchen.soundOff")}
            onClick={() => setSoundOn(!soundOn)}
          >
            {soundOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </Button>
        )}
      </div>
      <div className="grid gap-3">
        {(q.data?.orders.length ?? 0) === 0 ? (
          <Card className="text-sm text-muted">{t("orders.empty")}</Card>
        ) : (
          q.data?.orders.map((o: any) => (
            <OrderCard
              key={o.id}
              order={o as unknown as OrderView}
              restaurantId={vendor.restaurantId}
              dataLabel={q.data?.dataLabel}
              onChanged={() => {
                void qc.invalidateQueries({ queryKey: ["orders"] });
                void qc.invalidateQueries({ queryKey: ["dashboard"] });
              }}
            />
          ))
        )}
      </div>
    </VendorShell>
  );
}
