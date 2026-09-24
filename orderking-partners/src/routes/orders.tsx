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

function playKitchenBell() {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    const now = ctx.currentTime;
    playNote(783.99, now, 0.25);
    playNote(1046.5, now + 0.18, 0.4);
    playNote(783.99, now + 0.45, 0.25);
    playNote(1046.5, now + 0.63, 0.5);
  } catch {
    /* ignore audio context restrictions */
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
    if (scope === "live" && isFeatureEnabled("new_order_sound") && soundOn && pending > prev.current) {
      playKitchenBell();
    }
    prev.current = pending;
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
