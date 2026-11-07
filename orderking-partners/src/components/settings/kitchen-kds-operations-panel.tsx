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
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Play,
  Square,
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
      const saved = localStorage.getItem("ok_kitchen_sound_loop_duration") as SoundLoopDuration | null;
      if (saved && ["10s", "30s", "60s", "continuous"].includes(saved)) {
        return saved;
      }
    }
    return "30s";
  });

  // 5. Packaging Charges and Minimum Order Threshold
  const [packingInr, setPackingInr] = useState<string>(() =>
    initialPackingPaise > 0 ? String(Math.round(initialPackingPaise / 100)) : "0"
  );
  const [minOrderInr, setMinOrderInr] = useState<string>(() =>
    initialMinOrderPaise > 0 ? String(Math.round(initialMinOrderPaise / 100)) : "0"
  );

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [isPlayingTestSound, setIsPlayingTestSound] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const testOscillatorRef = useRef<OscillatorNode | null>(null);

  useEffect(() => {
    return () => {
      if (testOscillatorRef.current) {
        try {
          testOscillatorRef.current.stop();
        } catch {}
      }
      if (audioContextRef.current) {
        void audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const handleToggleTestSound = () => {
    if (isPlayingTestSound) {
      if (testOscillatorRef.current) {
        try {
          testOscillatorRef.current.stop();
        } catch {}
        testOscillatorRef.current = null;
      }
      setIsPlayingTestSound(false);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime((soundVolume / 100) * 0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);

      testOscillatorRef.current = osc;
      setIsPlayingTestSound(true);

      setTimeout(() => {
        setIsPlayingTestSound(false);
      }, 500);
    } catch {
      setIsPlayingTestSound(false);
    }
  };

  const handleSaveKitchenOps = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("ok_prep_buffer", String(prepBuffer));
        localStorage.setItem("ok_peak_prep_buffer", String(peakPrepBuffer));
        localStorage.setItem("ok_kitchen_throttle_threshold", String(surgeThreshold));
        localStorage.setItem("ok_kitchen_sound_volume", String(soundVolume));
        localStorage.setItem("ok_kitchen_sound_loop_duration", loopDuration);
      }

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
        `Kitchen timings saved: Standard prep ${prepBuffer}m, Rush prep ${peakPrepBuffer}m.`,
      );
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "Failed to save kitchen settings");
    } finally {
      setSaving(false);
    }
  };

  const surgeDeltaMins = Math.max(0, peakPrepBuffer - prepBuffer);

  return (
    <Card className="border-gray-200 bg-white p-6 space-y-6 text-gray-900 rounded-2xl shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-100 text-[#E23744]">
            <Sliders className="size-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-gray-900 flex items-center gap-2">
              Kitchen Preparation Timings
            </h2>
            <p className="text-xs text-gray-500">
              Configure standard and rush hour preparation times, alert sounds, and packing charges.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-gray-600 bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">
            Rush Buffer: +{surgeDeltaMins} mins
          </span>
        </div>
      </div>

      {/* Grid of Sliders & Granular Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Control 1: Standard Kitchen Prep Buffer Slider */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-[#E23744]" />
              <Label className="text-xs font-bold text-gray-800">
                Standard Kitchen Prep Time
              </Label>
            </div>
            <span className="text-xs font-bold text-gray-900 bg-white border border-gray-200 px-2.5 py-1 rounded-md shadow-xs">
              {prepBuffer} mins
            </span>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">
            Standard delivery promise shown to customers during normal kitchen operations.
          </p>

          <div className="space-y-2 pt-1">
            <input
              type="range"
              min={5}
              max={60}
              step={1}
              value={prepBuffer}
              onChange={(e) => setPrepBuffer(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#E23744]"
            />
            <div className="flex justify-between text-[11px] text-gray-400">
              <span>5m</span>
              <span>20m (Default)</span>
              <span>40m</span>
              <span>60m</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto scrollbar-none">
            <span className="text-[10px] text-gray-400 font-semibold uppercase">Presets:</span>
            {[10, 15, 20, 25, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setPrepBuffer(mins)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  prepBuffer === mins
                    ? "bg-[#E23744] text-white shadow-xs"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Control 2: Peak Rush-Hour SLA Prep Buffer Slider */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="size-4 text-amber-600" />
              <Label className="text-xs font-bold text-gray-800">
                Peak Rush-Hour Prep Time
              </Label>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md shadow-xs">
              {peakPrepBuffer} mins
            </span>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">
            Extended preparation time used during peak lunch and dinner rushes.
          </p>

          <div className="space-y-2 pt-1">
            <input
              type="range"
              min={10}
              max={90}
              step={1}
              value={peakPrepBuffer}
              onChange={(e) => setPeakPrepBuffer(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
            <div className="flex justify-between text-[11px] text-gray-400">
              <span>10m</span>
              <span>35m (Default)</span>
              <span>60m</span>
              <span>90m</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto scrollbar-none">
            <span className="text-[10px] text-gray-400 font-semibold uppercase">Presets:</span>
            {[20, 30, 35, 45, 60, 90].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setPeakPrepBuffer(mins)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  peakPrepBuffer === mins
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Control 3: Kitchen Surge Threshold */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-gray-600" />
              <Label className="text-xs font-bold text-gray-800">
                Rush Mode Trigger Threshold
              </Label>
            </div>
            <span className="text-xs font-bold text-gray-800 bg-white border border-gray-200 px-2.5 py-1 rounded-md shadow-xs">
              {surgeThreshold} orders
            </span>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">
            When active pending orders reach this number, rush prep time is automatically engaged.
          </p>

          <div className="space-y-2 pt-1">
            <input
              type="range"
              min={5}
              max={50}
              step={1}
              value={surgeThreshold}
              onChange={(e) => setSurgeThreshold(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-800"
            />
            <div className="flex justify-between text-[11px] text-gray-400">
              <span>5 orders</span>
              <span>15 (Medium)</span>
              <span>30 (High)</span>
              <span>50 orders</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto scrollbar-none">
            <span className="text-[10px] text-gray-400 font-semibold uppercase">Trigger:</span>
            {[5, 10, 15, 20, 25, 30, 40, 50].map((qty) => (
              <button
                key={qty}
                type="button"
                onClick={() => setSurgeThreshold(qty)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  surgeThreshold === qty
                    ? "bg-gray-900 text-white shadow-xs"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {qty}
              </button>
            ))}
          </div>
        </div>

        {/* Control 4: Sound Alert Volume & Sound Alert Loop Duration */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="size-4 text-[#E23744]" />
              <Label className="text-xs font-bold text-gray-800">
                Order Alert Chime &amp; Duration
              </Label>
            </div>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={handleToggleTestSound}
              className="h-8 px-3 text-xs font-semibold border-gray-200 bg-white hover:bg-gray-100 text-gray-700"
            >
              {isPlayingTestSound ? (
                <>
                  <Square className="mr-1.5 size-3 text-red-600" /> Stop
                </>
              ) : (
                <>
                  <Play className="mr-1.5 size-3 text-[#E23744]" /> Test Chime
                </>
              )}
            </Button>
          </div>

          {/* Volume Slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Alert Volume:</span>
              <span className="font-bold text-gray-900">{soundVolume}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={soundVolume}
              onChange={(e) => setSoundVolume(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#E23744]"
            />
          </div>

          {/* Loop Duration Selector */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs text-gray-600 font-medium">Alert Duration:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "10s", label: "10s", sub: "Short burst" },
                { id: "30s", label: "30s", sub: "Standard" },
                { id: "60s", label: "60s", sub: "Extended" },
                { id: "continuous", label: "Continuous", sub: "Until accepted" },
              ].map((opt) => {
                const active = loopDuration === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLoopDuration(opt.id as SoundLoopDuration)}
                    className={`rounded-xl border p-2.5 text-left transition ${
                      active
                        ? "border-[#E23744] bg-red-50 text-red-900 font-bold"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[10px] text-gray-500">{opt.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Packaging & Minimum Order Secondary Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
        <div>
          <Label className="text-xs font-semibold text-gray-700">Packaging Charge per Delivery Order (₹)</Label>
          <Input
            type="number"
            min={0}
            step={1}
            value={packingInr}
            onChange={(e) => setPackingInr(e.target.value)}
            className="mt-1 h-10 text-xs bg-white border-gray-300 text-gray-900 focus:border-[#E23744]"
            placeholder="0"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-gray-700">Minimum Delivery Order Value (₹)</Label>
          <Input
            type="number"
            min={0}
            step={10}
            value={minOrderInr}
            onChange={(e) => setMinOrderInr(e.target.value)}
            className="mt-1 h-10 text-xs bg-white border-gray-300 text-gray-900 focus:border-[#E23744]"
            placeholder="0"
          />
        </div>
      </div>

      {/* Footer Save Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
        <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 min-h-[20px]">
          {saveMsg ? (
            <>
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              <span>{saveMsg}</span>
            </>
          ) : null}
        </div>
        <Button
          size="sm"
          disabled={saving}
          onClick={() => void handleSaveKitchenOps()}
          className="bg-[#E23744] hover:bg-[#d32f2f] text-white text-xs font-bold px-6 h-10 rounded-xl shadow-xs"
        >
          {saving ? "Saving..." : "Save Kitchen Operations"}
        </Button>
      </div>
    </Card>
  );
}
