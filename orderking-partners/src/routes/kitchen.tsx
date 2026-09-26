import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
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

export const Route = createFileRoute("/kitchen")({ component: KitchenPage });

const COLS = [
  { state: "PLACED", key: "kitchen.new" },
  { state: "ACCEPTED", key: "kitchen.accepted" },
  { state: "PREPARING", key: "kitchen.preparing" },
  { state: "READY", key: "kitchen.ready" },
  { state: "RIDER_ASSIGNED", key: "kitchen.pickup" },
] as const;

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
    lfoGain.gain.value = 800; // Modulation depth
    
    lfo.connect(lfoGain);
    lfoGain.connect(alarmOscillator.frequency);
    
    alarmOscillator.frequency.value = 800; // Base frequency
    
    alarmGain.gain.value = 0.05; // Master volume
    
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

function playKitchenBell() {
  startContinuousAlarm();
  setTimeout(stopContinuousAlarm, 1000);
}

function speakKitchenOrder(orderId: string, totalPaise: number) {
  try {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const amountRs = Math.round(totalPaise / 100);
    const shortId = orderId.slice(-4).toUpperCase();
    const text = `OrderKing: New order #${shortId} received! Total amount ₹${amountRs} paid via KingPay.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  } catch {
    /* ignore speech synthesis errors */
  }
}

function KitchenPage() {
  const t = useT();
  const vendor = useVendor();
  const qc = useQueryClient();
  const soundOn = useClientState((s) => s.soundOn);
  const setSoundOn = useClientState((s) => s.setSoundOn);
  const q = useQuery({
    queryKey: ["orders", vendor.restaurantId, "live"],
    queryFn: () => listOrders({ data: { restaurantId: vendor.restaurantId, scope: "live" } }),
    enabled: Boolean(vendor.restaurantId),
    refetchInterval: 3000,
  });
  const pending = q.data?.orders.filter((o: any) => o.state === "PLACED").length ?? 0;
  const prev = useRef(pending);
  useEffect(() => {
    if (isFeatureEnabled("new_order_sound") && soundOn && pending > 0) {
      startContinuousAlarm();
      
      // Still speak once if a new order arrives
      if (pending > prev.current) {
        const latest = q.data?.orders.find((o: any) => o.state === "PLACED");
        if (latest) {
          speakKitchenOrder(latest.id, latest.prices?.customerTotalPaise ?? 0);
        }
      }
    } else {
      stopContinuousAlarm();
    }
    prev.current = pending;
    
    return () => stopContinuousAlarm();
  }, [pending, soundOn, q.data?.orders]);

  return (
    <VendorShell
      title={t("kitchen.title")}
      dataLabel={q.data?.dataLabel ?? vendor.dataLabel}
      stale={q.isError}
      restaurantName={vendor.selected?.restaurantName}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{q.data ? `Updated ${new Date(q.data.serverTime).toLocaleTimeString()}` : t("common.loading")}</p>
        <Button
          variant="secondary"
          size="icon"
          aria-label={soundOn ? t("kitchen.soundOn") : t("kitchen.soundOff")}
          onClick={() => setSoundOn(!soundOn)}
        >
          {soundOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
        </Button>
      </div>

      {/* King Pay Merchant Soundbox Software (₹99/mo) */}
      <Card className="border border-primary/30 bg-primary/5 p-4 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📢</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-foreground">King Pay AI Soundbox Active</h3>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  ₹99/mo Active
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Zero physical hardware cost. Announces incoming orders and King Pay UPI payments aloud in Bengali, Hindi, and English.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              playKitchenBell();
              speakKitchenOrder("TEST-8421", 45000);
            }}
            className="shrink-0 text-xs font-medium"
          >
            🔊 Test Voice Announcement
          </Button>
        </div>
      </Card>

      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0">
        {COLS.map((col) => {
          const items = (q.data?.orders ?? []).filter((o: any) =>
            col.state === "RIDER_ASSIGNED"
              ? ["RIDER_ASSIGNED", "PICKED_UP", "ON_THE_WAY"].includes(o.state)
              : o.state === col.state,
          );
          return (
            <section key={col.state} className="w-[min(86vw,22rem)] shrink-0 snap-start space-y-2 lg:w-auto lg:min-w-0">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-wide">{t(col.key)}</h2>
                <span className="tabular text-sm text-muted">{items.length}</span>
              </div>
              {items.length === 0 ? (
                <Card className="text-sm text-muted">{t("kitchen.empty")}</Card>
              ) : (
                items.map((o: any) => (
                  <OrderCard
                    key={o.id}
                    large
                    order={o as unknown as OrderView}
                    restaurantId={vendor.restaurantId}
                    dataLabel={q.data?.dataLabel}
                    onChanged={() => void qc.invalidateQueries({ queryKey: ["orders"] })}
                  />
                ))
              )}
            </section>
          );
        })}
      </div>
    </VendorShell>
  );
}
