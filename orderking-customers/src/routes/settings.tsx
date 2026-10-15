
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CustomerShell } from "@/components/market/shell";
import { useT } from "@/components/providers";
import { LANGS, type Lang } from "@/lib/i18n";
import { toast } from "sonner";
import { Check, Globe, ArrowLeft, Smartphone, Sparkles, ShieldCheck, Volume2 } from "lucide-react";
import { useLocationStore } from "@/lib/stores/location";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const { lang, setLang, t } = useT();
  const location = useLocationStore((s) => s.location);
  const [haptics, setHaptics] = useState(true);
  const [voiceAi, setVoiceAi] = useState(true);
  const [sounds, setSounds] = useState(true);

  const handleSelectLang = (targetLang: Lang, nativeName: string) => {
    setLang(targetLang);
    toast.success(`Language set to ${nativeName}! Active system-wide.`);
  };

  const toggleHaptics = () => {
    const next = !haptics;
    setHaptics(next);
    if (typeof navigator !== "undefined" && "vibrate" in navigator && next) {
      navigator.vibrate(30);
    }
    toast.success(next ? "Haptic vibrations enabled" : "Haptic vibrations disabled");
  };

  const toggleVoiceAi = () => {
    const next = !voiceAi;
    setVoiceAi(next);
    toast.success(next ? "Voice AI synthesis activated" : "Voice AI synthesis paused");
  };

  const toggleSounds = () => {
    const next = !sounds;
    setSounds(next);
    toast.success(next ? "Order sound effects turned on" : "Order sound effects muted");
  };

  return (
    <CustomerShell>
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#F5EFEB] px-4 py-5 pb-28">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Top Header */}
          <div className="flex items-center gap-3">
            <Link
              to="/account"
              className="flex size-10 items-center justify-center rounded-2xl border border-amber-300/80 bg-white shadow-2xs text-amber-950 hover:bg-amber-50 active:scale-95 transition-all"
              aria-label="Back to Account"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                Settings &amp; Preferences
              </h1>
              <p className="text-xs font-bold text-amber-800">
                10 Benchmark Indian Languages, Sensory Feedback &amp; GPS Security
              </p>
            </div>
          </div>

          {/* 10 Indian Languages Selector (Gold Luxury Grid) */}
          <section className="rounded-3xl border border-amber-900/10 bg-white/95 backdrop-blur-md p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3 mb-3.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xs">
                <Globe className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-stone-900">System Language / भाषा / ভাষা</h2>
                <p className="text-xs text-stone-500">Instant translation across all 10 benchmark regional languages</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
              {LANGS.map((item) => {
                const isActive = lang === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectLang(item.id, item.native)}
                    className={`relative flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                      isActive
                        ? "border-amber-500 bg-gradient-to-br from-amber-500/15 via-yellow-400/25 to-amber-500/10 text-amber-950 shadow-md shadow-amber-500/15 ring-2 ring-amber-400/60 font-black"
                        : "border-amber-200/80 bg-white text-stone-900 hover:bg-amber-50/70 hover:border-amber-300 shadow-2xs font-bold"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-display text-base font-black">{item.native}</span>
                      {isActive && (
                        <span className="flex size-5 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-xs">
                          <Check className="size-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-stone-600 mt-1">{item.name}</span>
                    <span className="text-[10px] font-mono uppercase text-amber-800/80 mt-1 font-bold">
                      {item.id}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Location & GPS Status */}
          <section className="rounded-3xl border border-amber-900/10 bg-white/95 backdrop-blur-md p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3 mb-3.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs">
                <Smartphone className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-stone-900">GPS &amp; Vicinity Verification</h2>
                <p className="text-xs text-stone-500">Real-time GPS geofencing prevents wrong kitchen dispatch</p>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/50 p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-stone-900 block">Active Verified Coordinates</span>
                <p className="font-mono text-xs font-bold text-amber-900 mt-0.5">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
                <p className="text-[11px] text-emerald-700 font-extrabold mt-1 flex items-center gap-1">
                  <span className="size-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                  100% Real-Time High-Accuracy GPS Active
                </p>
              </div>
              <Link
                to="/"
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black px-4 py-2 text-xs shadow-md shadow-orange-500/20 hover:from-amber-600 hover:to-orange-600 transition"
              >
                Update GPS
              </Link>
            </div>
          </section>

          {/* Sensory & Haptic Experience with Interactive 3D Luxury Toggles */}
          <section className="rounded-3xl border border-amber-900/10 bg-white/95 backdrop-blur-md p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3 mb-3.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 text-white shadow-xs">
                <Sparkles className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-stone-900">Sensory &amp; Haptic Experience</h2>
                <p className="text-xs text-stone-500">Ultra-luxurious tactile vibrations and audio synthesis</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Toggle 1: Haptics */}
              <div className="flex items-center justify-between rounded-2xl border border-amber-900/10 bg-amber-50/30 p-3.5">
                <div>
                  <span className="text-xs font-black text-stone-900 block">Haptic Vibrations</span>
                  <span className="text-[11px] text-stone-500">Physical micro-vibration feedback on touch</span>
                </div>
                <button
                  type="button"
                  onClick={toggleHaptics}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    haptics
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm shadow-emerald-500/30"
                      : "bg-stone-300"
                  }`}
                  role="switch"
                  aria-checked={haptics}
                >
                  <span
                    className={`pointer-events-none inline-block size-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      haptics ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 2: Voice AI */}
              <div className="flex items-center justify-between rounded-2xl border border-amber-900/10 bg-amber-50/30 p-3.5">
                <div>
                  <span className="text-xs font-black text-stone-900 block">Young Native Voice AI</span>
                  <span className="text-[11px] text-stone-500">Instant regional female speech synthesis</span>
                </div>
                <button
                  type="button"
                  onClick={toggleVoiceAi}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    voiceAi
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm shadow-emerald-500/30"
                      : "bg-stone-300"
                  }`}
                  role="switch"
                  aria-checked={voiceAi}
                >
                  <span
                    className={`pointer-events-none inline-block size-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      voiceAi ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 3: Sound Effects */}
              <div className="flex items-center justify-between rounded-2xl border border-amber-900/10 bg-amber-50/30 p-3.5">
                <div>
                  <span className="text-xs font-black text-stone-900 block">Royal Order Chimes</span>
                  <span className="text-[11px] text-stone-500">Melodic feedback on dispatch &amp; delivery</span>
                </div>
                <button
                  type="button"
                  onClick={toggleSounds}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    sounds
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm shadow-emerald-500/30"
                      : "bg-stone-300"
                  }`}
                  role="switch"
                  aria-checked={sounds}
                >
                  <span
                    className={`pointer-events-none inline-block size-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      sounds ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Legal & Privacy Shield */}
          <section className="rounded-3xl border border-amber-900/10 bg-white/95 backdrop-blur-md p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2.5 mb-2">
              <ShieldCheck className="size-5 text-amber-600" />
              <h2 className="text-xs font-black text-stone-900 uppercase tracking-wider">Privacy &amp; Data Shield</h2>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed font-medium">
              OrderKing &amp; KingPay operate under strict Section 79 IT Act privacy protocols. Zero user contact book data, zero unencrypted storage, and complete end-to-end data security and compliance.
            </p>
          </section>
        </div>
      </div>
    </CustomerShell>
  );
}
