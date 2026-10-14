import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { updateRestaurantProfile } from "@/lib/server/api-bootstrap";
import { useQueryClient } from "@tanstack/react-query";
import {
  Flame,
  Clock,
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Play,
  Square,
  Sparkles,
} from "lucide-react";

export type SoundLoopDuration = "10s" | "30s" | "60s" | "continuous";

export interface KitchenKdsOperationsPanelProps {
  restaurantId?: string;
  initialPrepMinutes?: number;
  initialPeakPrepMinutes?: number;
  initialPackingPaise?: number;
  initialMinOrderPaise?: number;
}

export function KitchenKdsOperationsPanel({
  restaurantId,
  initialPrepMinutes = 20,
  initialPeakPrepMinutes = 35,
  initialPackingPaise = 0,
  initialMinOrderPaise = 0,
}: KitchenKdsOperationsPanelProps) {
  const qc = useQueryClient();

  // 1. Standard Kitchen Prep Buffer (5 mins to 60 mins)
  const [prepBuffer, setPrepBuffer] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ok_prep_buffer");
      if (saved) return Math.min(60, Math.max(5, Number(saved)));
    }
    return Math.min(60, Math.max(5, initialPrepMinutes));
  });

  // 2. Peak Rush-Hour SLA Prep Buffer (10 mins to 90 mins)
  const [peakPrepBuffer, setPeakPrepBuffer] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ok_peak_prep_buffer");
      if (saved) return Math.min(90, Math.max(10, Number(saved)));
    }
    return Math.min(90, Math.max(10, initialPeakPrepMinutes));
  });

  // 3. Kitchen Throttle / Auto-Surge Trigger (Orders in queue threshold: 5 to 50 orders)
  const [surgeThreshold, setSurgeThreshold] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ok_kitchen_throttle_threshold");
      if (saved) return Math.min(50, Math.max(5, Number(saved)));
    }
    return 15;
  });

  // 4. Sound Alert Volume (0% to 100%) and Loop Duration
  const [soundVolume, setSoundVolume] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ok_kitchen_sound_volume");
      if (saved) return Math.min(100, Math.max(0, Number(saved)));
    }
    return 80;
  });

  const [loopDuration, setLoopDuration] = useState<SoundLoopDuration>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ok_kitchen_sound_loop_duration");
      if (saved === "10s" || saved === "30s" || saved === "60s" || saved === "continuous") {
        return saved;
      }
    }
    return "continuous";
  });

  // Additional packaging & minimum order fields
  const [packingInr, setPackingInr] = useState<string>(
    String(Math.round(initialPackingPaise / 100)),
  );
  const [minOrderInr, setMinOrderInr] = useState<string>(
    String(Math.round(initialMinOrderPaise / 100)),
  );

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [isPlayingTestSound, setIsPlayingTestSound] = useState(false);

  // Audio test cleanup ref
  const audioStopRef = useRef<(() => void) | null>(null);

  // Sync when initial values change from query
  useEffect(() => {
    if (initialPrepMinutes) {
      setPrepBuffer((prev) => (prev ? prev : Math.min(60, Math.max(5, initialPrepMinutes))));
    }
    if (initialPeakPrepMinutes) {
      setPeakPrepBuffer((prev) => (prev ? prev : Math.min(90, Math.max(10, initialPeakPrepMinutes))));
    }
  }, [initialPrepMinutes, initialPeakPrepMinutes]);

  // Clean up audio test on unmount
  useEffect(() => {
    return () => {
      if (audioStopRef.current) {
        audioStopRef.current();
      }
    };
  }, []);

  // Web Audio API test sound synthesizer
  const handleToggleTestSound = () => {
    if (isPlayingTestSound) {
      if (audioStopRef.current) {
        audioStopRef.current();
        audioStopRef.current = null;
      }
      setIsPlayingTestSound(false);
      return;
    }

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      if (ctx.state === "suspended") {
        void ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";

      const lfo = ctx.createOscillator();
      lfo.type = "square";
      lfo.frequency.value = 3;

      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 600;

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      osc.frequency.value = 850;
      gain.gain.value = Math.max(0.01, Math.min(1, soundVolume / 100));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      lfo.start();
      setIsPlayingTestSound(true);

      const stopFn = () => {
        try {
          osc.stop();
          osc.disconnect();
          lfo.stop();
          lfo.disconnect();
          gain.disconnect();
          void ctx.close();
        } catch {
          // ignore
        }
        setIsPlayingTestSound(false);
      };

      audioStopRef.current = stopFn;

      // Automatically stop preview after 3 seconds
      setTimeout(() => {
        if (audioStopRef.current === stopFn) {
          stopFn();
          audioStopRef.current = null;
        }
      }, 3000);
    } catch (err) {
      console.error("Audio preview failed:", err);
      setIsPlayingTestSound(false);
    }
  };

  const handleSaveKitchenOps = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      // 1. Persist to local persistence
      if (typeof window !== "undefined") {
        localStorage.setItem("ok_prep_buffer", String(prepBuffer));
        localStorage.setItem("ok_peak_prep_buffer", String(peakPrepBuffer));
        localStorage.setItem("ok_kitchen_throttle_threshold", String(surgeThreshold));
        localStorage.setItem("ok_kitchen_sound_volume", String(soundVolume));
        localStorage.setItem("ok_kitchen_sound_loop_duration", loopDuration);
      }

      // 2. Persist to PostgreSQL backend if restaurantId is provided
      if (restaurantId) {
        const packingPaise = Math.max(0, Math.round(Number(packingInr) * 100));
        const minOrderPaise = Math.max(0, Math.round(Number(minOrderInr) * 100));

        await updateRestaurantProfile({
          data: {
            restaurantId,
            prepMinutes: prepBuffer,
            peakPrepMinutes: peakPrepBuffer,
            packingPaise,
            minOrderPaise,
          },
        });
        await qc.invalidateQueries({ queryKey: ["restaurant"] });
      }

      setSaveMsg(
        `Kitchen & KDS Operations settings saved: Standard SLA ${prepBuffer}m, Peak SLA ${peakPrepBuffer}m, Auto-Surge at ${surgeThreshold} orders, Alert Volume ${soundVolume}%, Loop: ${loopDuration.toUpperCase()}.`,
      );
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "Failed to save kitchen settings");
    } finally {
      setSaving(false);
    }
  };

  const surgeDeltaMins = Math.max(0, peakPrepBuffer - prepBuffer);

  return (
    <Card className="border-slate-800 bg-slate-900/80 p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Sliders className="size-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
              Kitchen &amp; KDS Operations Customization Panel
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                DEEP GRANULAR CONTROL
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Configure prep buffer timelines, autonomous rush-hour queue surge thresholds, and KDS auditory alert loops.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            SURGE DELTA: +{surgeDeltaMins}m
          </span>
        </div>
      </div>

      {/* Grid of Sliders & Granular Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Control 1: Standard Kitchen Prep Buffer Slider */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-emerald-400" />
              <Label className="text-xs font-semibold text-slate-200">
                Standard Kitchen Prep Buffer
              </Label>
            </div>
            <span className="text-sm font-bold font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded">
              {prepBuffer} mins
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Standard customer SLA promise and rider dispatch timing under normal kitchen load.
          </p>

          <div className="space-y-2 pt-1">
            <input
              type="range"
              min={5}
              max={60}
              step={1}
              value={prepBuffer}
              onChange={(e) => setPrepBuffer(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>5m (Quick Snack)</span>
              <span>20m (Default)</span>
              <span>40m</span>
              <span>60m (Slow Dine)</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
            <span className="text-[10px] text-slate-500 font-mono">PRESETS:</span>
            {[10, 15, 20, 25, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setPrepBuffer(mins)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                  prepBuffer === mins
                    ? "bg-emerald-500 text-white font-bold"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Control 2: Peak Rush-Hour SLA Prep Buffer Slider */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="size-4 text-amber-400" />
              <Label className="text-xs font-semibold text-slate-200">
                Peak Rush-Hour SLA Prep Buffer
              </Label>
            </div>
            <span className="text-sm font-bold font-mono text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2.5 py-0.5 rounded">
              {peakPrepBuffer} mins
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Extended prep SLA activated during heavy dinner/lunch rushes to protect kitchen staff from SLA penalties.
          </p>

          <div className="space-y-2 pt-1">
            <input
              type="range"
              min={10}
              max={90}
              step={1}
              value={peakPrepBuffer}
              onChange={(e) => setPeakPrepBuffer(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>10m</span>
              <span>35m (Default)</span>
              <span>60m</span>
              <span>90m (Heavy Feast)</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
            <span className="text-[10px] text-slate-500 font-mono">PRESETS:</span>
            {[20, 30, 35, 45, 60, 90].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setPeakPrepBuffer(mins)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                  peakPrepBuffer === mins
                    ? "bg-amber-500 text-black font-bold"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Control 3: Kitchen Throttle / Auto-Surge Trigger */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-rose-400" />
              <Label className="text-xs font-semibold text-slate-200">
                Kitchen Throttle / Auto-Surge Trigger
              </Label>
            </div>
            <span className="text-sm font-bold font-mono text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2.5 py-0.5 rounded">
              {surgeThreshold} orders in queue
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            When active live orders in queue equal or exceed this threshold, King AI automatically engages the Peak Rush SLA (+{surgeDeltaMins}m) and notifies dispatch algorithms.
          </p>

          <div className="space-y-2 pt-1">
            <input
              type="range"
              min={5}
              max={50}
              step={1}
              value={surgeThreshold}
              onChange={(e) => setSurgeThreshold(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>5 orders (Boutique)</span>
              <span>15 (Medium)</span>
              <span>30 (High)</span>
              <span>50 orders (Mega Kitchen)</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
            <span className="text-[10px] text-slate-500 font-mono">TRIGGER:</span>
            {[5, 10, 15, 20, 25, 30, 40, 50].map((qty) => (
              <button
                key={qty}
                type="button"
                onClick={() => setSurgeThreshold(qty)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                  surgeThreshold === qty
                    ? "bg-rose-500 text-white font-bold"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {qty}
              </button>
            ))}
          </div>
        </div>

        {/* Control 4: Sound Alert Volume & Sound Alert Loop Duration */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="size-4 text-emerald-400" />
              <Label className="text-xs font-semibold text-slate-200">
                KDS Sound Alert Volume &amp; Loop Duration
              </Label>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={handleToggleTestSound}
                className="h-7 px-2.5 text-[11px] font-bold border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
              >
                {isPlayingTestSound ? (
                  <>
                    <Square className="mr-1 size-3 text-rose-400" /> Stop
                  </>
                ) : (
                  <>
                    <Play className="mr-1 size-3 text-emerald-400" /> Test Siren
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Volume Slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Siren / Chime Volume:</span>
              <span className="font-mono font-bold text-emerald-400">{soundVolume}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={soundVolume}
              onChange={(e) => setSoundVolume(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>0% (Muted)</span>
              <span>50%</span>
              <span>80% (Recommended)</span>
              <span>100% (Loud Kitchen)</span>
            </div>
          </div>

          {/* Loop Duration Selector */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs text-slate-300 font-medium">Alert Loop Duration:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: "10s", label: "10s", sub: "Brief chime burst" },
                { id: "30s", label: "30s", sub: "Standard alert" },
                { id: "60s", label: "60s", sub: "Extended ring" },
                { id: "continuous", label: "Continuous", sub: "Until accepted" },
              ].map((opt) => {
                const active = loopDuration === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLoopDuration(opt.id as SoundLoopDuration)}
                    className={`rounded-lg border p-2 text-left transition ${
                      active
                        ? "border-emerald-500 bg-emerald-500/15 text-white"
                        : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-100">{opt.label}</div>
                    <div className="text-[10px] text-slate-400">{opt.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Packaging & Minimum Order Secondary Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
        <div>
          <Label className="text-xs text-slate-300">Default Packaging Charge (₹ per order)</Label>
          <Input
            type="number"
            min={0}
            step={1}
            value={packingInr}
            onChange={(e) => setPackingInr(e.target.value)}
            className="mt-1 h-9 text-xs bg-slate-950 border-slate-800 font-mono"
            placeholder="0"
          />
        </div>
        <div>
          <Label className="text-xs text-slate-300">Minimum Order Value (₹ threshold)</Label>
          <Input
            type="number"
            min={0}
            step={10}
            value={minOrderInr}
            onChange={(e) => setMinOrderInr(e.target.value)}
            className="mt-1 h-9 text-xs bg-slate-950 border-slate-800 font-mono"
            placeholder="0"
          />
        </div>
      </div>

      {/* Footer Save Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
        <div className="text-xs text-emerald-400 flex items-center gap-1.5 min-h-[20px]">
          {saveMsg ? (
            <>
              <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
              <span>{saveMsg}</span>
            </>
          ) : null}
        </div>
        <Button
          size="sm"
          disabled={saving}
          onClick={() => void handleSaveKitchenOps()}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4"
        >
          {saving ? "Saving Kitchen Operations..." : "Save Kitchen & KDS Operations"}
        </Button>
      </div>
    </Card>
  );
}
