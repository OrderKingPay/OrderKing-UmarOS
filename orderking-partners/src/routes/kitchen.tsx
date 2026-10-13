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
import { getSoundboxStatus, activateSoundbox } from "@/lib/server/api-finance";
import { isFeatureEnabled, type AppLanguage } from "@/lib/platform-config";
import { INDIAN_LANGUAGE_CATALOG } from "@/lib/i18n";
import { supabaseCloud } from "@/lib/db-cloud";
import { BellOff, BellRing, ChefHat, Volume2, VolumeX } from "lucide-react";
import { KingPaySoundboxEngine } from "@/components/KingPaySoundboxEngine";

export const Route = createFileRoute("/kitchen")({ component: KitchenPage });

const COLS = [
  { state: "PLACED", key: "kitchen.new", label: "New" },
  { state: "ACCEPTED", key: "kitchen.accepted", label: "Accepted" },
  { state: "PREPARING", key: "kitchen.preparing", label: "Preparing" },
  { state: "READY", key: "kitchen.ready", label: "Ready" },
  { state: "RIDER_ASSIGNED", key: "kitchen.pickup", label: "Handover" },
] as const;

function getVoiceBcp47(lang: AppLanguage): string {
  return INDIAN_LANGUAGE_CATALOG.find((item) => item.code === lang)?.bcp47 ?? "en-IN";
}

function buildLocalizedVoiceAlert(lang: AppLanguage, shortId: string, amountRs: number): string {
  switch (lang) {
    case "hi":
    case "mai":
    case "ne":
    case "kok":
    case "doi":
    case "brx":
    case "sa":
    case "sd":
      return `ऑर्डर किंग किचन अलर्ट: नया ऑर्डर नंबर ${shortId} प्राप्त हुआ है। कुल राशि ${amountRs} रुपये।`;
    case "bn":
    case "mni":
      return `অর্ডার কিং কিচেন অ্যালার্ট: নতুন অর্ডার নম্বর ${shortId} এসেছে। মোট মূল্য ${amountRs} টাকা।`;
    case "te":
      return `ఆర్డర్ కింగ్ కిచెన్ అలర్ట్: కొత్త ఆర్డర్ నంబర్ ${shortId} వచ్చింది. మొత్తం విలువ ${amountRs} రూపాయలు.`;
    case "ta":
      return `ஆர்டர் கிங் கிச்சன் அலர்ட்: புதிய ஆர்டர் எண் ${shortId} வந்துள்ளது. மொத்த தொகை ${amountRs} ரூபாய்.`;
    case "mr":
      return `ऑर्डर किंग किचन अलर्ट: नवीन ऑर्डर क्रमांक ${shortId} प्राप्त झाली आहे. एकूण रक्कम ${amountRs} रुपये.`;
    case "gu":
      return `ઓર્ડર કિંગ કિચન એલર્ટ: નવો ઓર્ડર નંબર ${shortId} મળ્યો છે. કુલ રકમ ${amountRs} રૂપિયા.`;
    case "kn":
      return `ಆರ್ಡರ್ ಕಿಂಗ್ ಕಿಚನ್ ಅಲರ್ಟ್: ಹೊಸ ಆರ್ಡರ್ ಸಂಖ್ಯೆ ${shortId} ಬಂದಿದೆ. ಒಟ್ಟು ಮೊತ್ತ ${amountRs} ರೂಪಾಯಿ.`;
    case "ml":
      return `ഓർഡർ കിംഗ് കിച്ചൻ അലേർട്ട്: പുതിയ ഓർഡർ നമ്പർ ${shortId} ലഭിച്ചു. ആകെ തുക ${amountRs} രൂപ.`;
    case "pa":
      return `ਆਰਡਰ ਕਿੰਗ ਕਿਚਨ ਅਲਰਟ: ਨਵਾਂ ਆਰਡਰ ਨੰਬਰ ${shortId} ਪ੍ਰਾਪਤ ਹੋਇਆ ਹੈ। ਕੁੱਲ ਰਕਮ ${amountRs} ਰੁਪਏ।`;
    case "or":
      return `ଅର୍ଡର କିଙ୍ଗ କିଚେନ ଆଲର୍ଟ: ନୂଆ ଅର୍ଡର ନମ୍ବର ${shortId} ଆସିଛି। ମୋଟ ମୂଲ୍ୟ ${amountRs} ଟଙ୍କା।`;
    case "as":
      return `অৰ্ডাৰ কিং কিচেন এলাৰ্ট: নতুন অৰ্ডাৰ নম্বৰ ${shortId} লাভ কৰা হৈছে। মুঠ মূল্য ${amountRs} টকা।`;
    case "ur":
    case "ks":
      return `آرڈر کنگ کچن الرٹ: نیا آرڈر نمبر ${shortId} موصول ہوا ہے۔ کل رقم ${amountRs} روپے۔`;
    default:
      return `OrderKing Kitchen Alert: New order #${shortId} received. Order value ₹${amountRs}.`;
  }
}

// Global continuous alarm state
let alarmAudioCtx: AudioContext | null = null;
let alarmOscillator: OscillatorNode | null = null;
let alarmGain: GainNode | null = null;
let isAlarmPlaying = false;

function startContinuousAlarm() {
  if (isAlarmPlaying) return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!alarmAudioCtx) {
      alarmAudioCtx = new AudioContextClass();
    }

    if (alarmAudioCtx.state === "suspended") {
      void alarmAudioCtx.resume();
    }

    alarmOscillator = alarmAudioCtx.createOscillator();
    alarmGain = alarmAudioCtx.createGain();

    alarmOscillator.type = "square";
    const lfo = alarmAudioCtx.createOscillator();
    lfo.type = "square";
    lfo.frequency.value = 2;

    const lfoGain = alarmAudioCtx.createGain();
    lfoGain.gain.value = 800;

    lfo.connect(lfoGain);
    lfoGain.connect(alarmOscillator.frequency);

    alarmOscillator.frequency.value = 800;
    alarmGain.gain.value = 1.0;

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

function speakKitchenOrder(orderId: string, totalPaise: number, lang: AppLanguage = "en") {
  try {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const amountRs = Math.round(totalPaise / 100);
    const shortId = orderId.slice(-4).toUpperCase();
    const text = buildLocalizedVoiceAlert(lang, shortId, amountRs);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getVoiceBcp47(lang);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  } catch {
    /* ignore speech synthesis errors */
  }
}

function matchesColumn(orderState: string, colState: (typeof COLS)[number]["state"]): boolean {
  if (colState === "PLACED") return ["PLACED", "PENDING"].includes(orderState);
  if (colState === "ACCEPTED") return ["ACCEPTED", "CONFIRMED"].includes(orderState);
  if (colState === "RIDER_ASSIGNED") {
    return ["RIDER_ASSIGNED", "PICKED_UP", "ON_THE_WAY"].includes(orderState);
  }
  return orderState === colState;
}

function KitchenPage() {
  const t = useT();
  const vendor = useVendor();
  const qc = useQueryClient();
  const lang = useClientState((s) => s.lang);
  const soundOn = useClientState((s) => s.soundOn);
  const setSoundOn = useClientState((s) => s.setSoundOn);

  const soundboxQuery = useQuery({
    queryKey: ["soundbox", vendor.restaurantId],
    queryFn: () => getSoundboxStatus({ data: { restaurantId: vendor.restaurantId } }),
    enabled: Boolean(vendor.restaurantId),
  });

  const q = useQuery({
    queryKey: ["orders", vendor.restaurantId, "live"],
    queryFn: () => listOrders({ data: { restaurantId: vendor.restaurantId, scope: "live" } }),
    enabled: Boolean(vendor.restaurantId),
  });

  useEffect(() => {
    if (!vendor.restaurantId) return;
    const channel = supabaseCloud
      .channel(`orders-${vendor.restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${vendor.restaurantId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: ["orders", vendor.restaurantId, "live"] });
        },
      )
      .subscribe();

    return () => {
      void supabaseCloud.removeChannel(channel);
    };
  }, [vendor.restaurantId, qc]);

  const allOrders = q.data?.orders ?? [];
  const pending = allOrders.filter((o: any) => matchesColumn(String(o.state), "PLACED")).length;
  const prev = useRef(pending);

  useEffect(() => {
    if (isFeatureEnabled("new_order_sound") && soundOn && pending > 0) {
      startContinuousAlarm();

      if (pending > prev.current) {
        const latest = allOrders.find((o: any) => matchesColumn(String(o.state), "PLACED"));
        if (latest) {
          speakKitchenOrder(latest.id, latest.prices?.customerTotalPaise ?? 0, lang);
        }
      }
    } else {
      stopContinuousAlarm();
    }
    prev.current = pending;

    return () => stopContinuousAlarm();
  }, [pending, soundOn, allOrders, lang]);

  return (
    <VendorShell
      title={t("kitchen.title")}
      dataLabel={q.data?.dataLabel ?? vendor.dataLabel}
      stale={q.isError}
      restaurantName={vendor.selected?.restaurantName}
    >
      {/* KDS Operational Summary Bar */}
      <Card className="border-slate-800 bg-slate-900/90 p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ChefHat className="size-5 text-emerald-400 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                  Kitchen Display System (KDS) — Live Queue Telemetry
                </h2>
                <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                  {q.data ? `SYNCED ${new Date(q.data.serverTime).toLocaleTimeString()}` : "SYNCING"}
                </span>
                <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                  VOICE: {getVoiceBcp47(lang)}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Self-service audio hardware diagnostics, 23-language voice alerts, real-time stage counters, and 1-tap order progression.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => stopContinuousAlarm()}
              className="text-xs border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              <BellOff className="mr-1.5 size-3.5 text-amber-400" />
              Silence Alarm
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                playKitchenBell();
                speakKitchenOrder("KOT-8421", 45000, lang);
              }}
              className="text-xs border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              <BellRing className="mr-1.5 size-3.5 text-emerald-400" />
              Test Speaker ({lang.toUpperCase()})
            </Button>
            <Button
              size="sm"
              variant={soundOn ? "primary" : "secondary"}
              aria-label={soundOn ? t("kitchen.soundOn") : t("kitchen.soundOff")}
              onClick={() => setSoundOn(!soundOn)}
              className="text-xs"
            >
              {soundOn ? (
                <>
                  <Volume2 className="mr-1.5 size-3.5" /> Siren ON
                </>
              ) : (
                <>
                  <VolumeX className="mr-1.5 size-3.5" /> Siren Muted
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Column Stage Counts */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-800">
          {COLS.map((col) => {
            const count = allOrders.filter((o: any) => matchesColumn(String(o.state), col.state)).length;
            const isUrgent = col.state === "PLACED" && count > 0;
            return (
              <div
                key={col.state}
                className={`rounded-lg border px-3 py-2 flex items-center justify-between ${
                  isUrgent
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                    : "border-slate-800 bg-slate-950/70 text-slate-300"
                }`}
              >
                <span className="text-xs font-medium">{col.label}</span>
                <span className="font-mono text-sm font-bold tabular">{count}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* King Pay Merchant Soundbox Software */}
      <Card className="border border-primary/30 bg-primary/5 p-4 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📢</span>
            <div>
              {soundboxQuery.data?.active ? (
                <>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-foreground">King Pay Voice Soundbox Active</h3>
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                      Enterprise Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Zero physical hardware cost. Announces incoming orders and UPI payments aloud across all 23 supported Indian languages.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-foreground">King Pay Voice Soundbox</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Activate to announce incoming orders and UPI payments aloud across all 23 supported Indian languages.
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            {!soundboxQuery.data?.active && (
              <Button
                size="sm"
                onClick={async () => {
                  await activateSoundbox({ data: { restaurantId: vendor.restaurantId } });
                  void qc.invalidateQueries({ queryKey: ["soundbox", vendor.restaurantId] });
                }}
                className="shrink-0 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Activate Voice Soundbox
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                playKitchenBell();
                speakKitchenOrder("KOT-8421", 45000, lang);
              }}
              className="shrink-0 text-xs font-medium"
            >
              🔊 Test Voice Announcement
            </Button>
          </div>
        </div>
        {soundboxQuery.data?.active && (
          <div className="mt-4 pt-3 border-t border-emerald-500/20">
            <KingPaySoundboxEngine merchantId={vendor.restaurantId} />
          </div>
        )}
      </Card>

      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0">
        {COLS.map((col) => {
          const items = allOrders.filter((o: any) => matchesColumn(String(o.state), col.state));
          return (
            <section
              key={col.state}
              className="w-[min(86vw,22rem)] shrink-0 snap-start space-y-2 lg:w-auto lg:min-w-0"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-wide">{t(col.key)}</h2>
                <span className="tabular text-sm text-slate-400">{items.length}</span>
              </div>
              {items.length === 0 ? (
                <Card className="text-sm text-slate-400">{t("kitchen.empty")}</Card>
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
