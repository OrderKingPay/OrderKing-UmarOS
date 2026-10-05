
import { createFileRoute, Link } from "@tanstack/react-router";
import { CustomerShell } from "@/components/market/shell";
import { useT } from "@/components/providers";
import { LANGS, type Lang } from "@/lib/i18n";
import { toast } from "sonner";
import { Check, Globe, ArrowLeft, Sliders, Smartphone, Sparkles, ShieldCheck } from "lucide-react";
import { useLocationStore } from "@/lib/stores/location";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const { lang, setLang, t } = useT();
  const location = useLocationStore((s) => s.location);

  const handleSelectLang = (targetLang: Lang, nativeName: string) => {
    setLang(targetLang);
    toast.success(`Language set to ${nativeName}! Active system-wide.`);
  };

  return (
    <CustomerShell>
      <div className="px-4 py-5 max-w-2xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center gap-3">
          <Link
            to="/account"
            className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] text-white hover:bg-white/5 transition"
            aria-label="Back to Account"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Settings &amp; Preferences</h1>
            <p className="text-xs text-zinc-400">Customize language, experience &amp; system parameters</p>
          </div>
        </div>

        {/* 12 Indian Languages Selector (Clean Professional Design) */}
        <section className="rounded-2xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-4 sm:p-5 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Globe className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">System Language / भाषा / ভাষা</h2>
              <p className="text-xs text-zinc-400">Select from 12 Indian languages for the entire app</p>
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
                  className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all active:scale-[0.98] ${
                    isActive
                      ? "border-primary bg-primary/5 text-primary shadow-[0_0_15px_rgba(255,255,255,0.05)] ring-1 ring-primary"
                      : "border-white/10 bg-white/5/40 text-white hover:bg-white/5 hover:border-white/10/80"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-display text-base font-bold">{item.native}</span>
                    {isActive && (
                      <span className="flex size-4 items-center justify-center rounded-full bg-primary text-black font-bold shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)] hover:shadow-[0_0_25px_rgba(var(--primary-rgb),0.8)] transition-all">
                        <Check className="size-2.5" />
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-400 mt-0.5">{item.name}</span>
                  <span className="text-[10px] font-mono uppercase text-zinc-400/70 mt-1">
                    {item.id}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Location & GPS Status */}
        <section className="rounded-2xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-4 sm:p-5 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Smartphone className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">GPS &amp; Vicinity Verification</h2>
              <p className="text-xs text-zinc-400">Real-time GPS prevents wrong kitchen orders</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5/30 p-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-white block">Active Coordinates</span>
              <p className="font-mono text-xs text-zinc-400 mt-0.5">
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </p>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                ● 100% Real-Time GPS Active
              </p>
            </div>
            <Link
              to="/"
              className="rounded-lg border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] px-3 py-1.5 text-xs font-medium text-white hover:bg-white/5 transition"
            >
              Update GPS
            </Link>
          </div>
        </section>

        {/* Haptic & Audio Experience */}
        <section className="rounded-2xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-4 sm:p-5 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Sensory &amp; Haptic Experience</h2>
              <p className="text-xs text-zinc-400">Ultra-premium 3D switches and tactile vibrations</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-white/5/30 p-3">
              <div>
                <span className="text-xs font-semibold text-white block">Haptic Vibrations</span>
                <span className="text-[11px] text-zinc-400">Physical feedback on button press &amp; switch</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Enabled
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white/5/30 p-3">
              <div>
                <span className="text-xs font-semibold text-white block">Young Native Voice AI</span>
                <span className="text-[11px] text-zinc-400">Instant female speech synthesis in all 12 languages</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
          </div>
        </section>

        {/* Legal & Privacy Shield */}
        <section className="rounded-2xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-4 sm:p-5 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-2.5 mb-2">
            <ShieldCheck className="size-4 text-primary" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Privacy &amp; Data Shield</h2>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            OrderKing &amp; KingPay operate under strict Section 79 IT Act privacy protocols. Zero user contact book data, zero unencrypted storage, and complete end-to-end fintech sovereignty.
          </p>
        </section>
      </div>
    </CustomerShell>
  );
}
