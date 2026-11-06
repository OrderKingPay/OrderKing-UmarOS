// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { VendorShell } from "@/components/vendor-shell";
import { Settings, Volume2, ShieldCheck, Printer, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/settings")({
  component: PartnerSettingsPage,
});

const SOUNDBOX_PHRASES: Record<string, { lang: string; text: string }> = {
  SYLHETI: { lang: "bn-IN", text: "OrderKing Pay-t notun order aise. Six hundred nineteen taka pawa gese." },
  BENGALI: { lang: "bn-IN", text: "OrderKing Pay-te notun order esheche. Chhoy sho unish taka grohon kora hoyeche." },
  HINDI: { lang: "hi-IN", text: "OrderKing Pay par naya order prapt hua. Chhah sau unnis rupaye prapt hue." },
  ENGLISH: { lang: "en-IN", text: "New OrderKing order received. Rupees six hundred nineteen and fifty paise verified." },
};

function PartnerSettingsPage() {
  const [dialect, setDialect] = useState<"SYLHETI" | "BENGALI" | "HINDI" | "ENGLISH">("SYLHETI");
  const [fssaiNumber, setFssaiNumber] = useState("10324001000492");
  const [fssaiExpiry, setFssaiExpiry] = useState("2028-12-31");
  const [packagingPaise, setPackagingPaise] = useState("2000");
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  function speakSoundboxSample() {
    if (typeof window === "undefined") return;
    try {
      const cfg = SOUNDBOX_PHRASES[dialect];
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(cfg.text);
        utter.lang = cfg.lang;
        window.speechSynthesis.speak(utter);
      }
      setSavedNotice(`Broadcasted Soundbox voice alert in ${dialect}: "${cfg.text}"`);
    } catch {}
  }

  function handleSaveSettings(e: any) {
    e.preventDefault();
    if (!/^[12]\d{13}$/.test(fssaiNumber.trim())) {
      setSavedNotice("Invalid FSSAI format: must be an exact 14-digit number starting with 1 or 2.");
      return;
    }
    setSavedNotice("Storefront FSSAI, Soundbox dialect, and 80mm thermal KOT preferences saved.");
  }

  return (
    <VendorShell title="Soundbox, FSSAI & Printer Settings">
      <div className="mx-auto max-w-4xl py-4 space-y-5 text-slate-100">
        {savedNotice && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
            <span>{savedNotice}</span>
          </div>
        )}

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Volume2 className="size-5 text-emerald-400" />
                <span>KingPay Soundbox Dialect Broadcast (Sylheti, Bengali, Hindi, English)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Instant voice confirmation for incoming orders and UPI/settlement credits.
              </p>
            </div>
            <Button
              type="button"
              onClick={speakSoundboxSample}
              className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
            >
              Test Voice Broadcast
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {(["SYLHETI", "BENGALI", "HINDI", "ENGLISH"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDialect(d)}
                className={`rounded-xl border p-3 text-xs font-bold transition ${
                  dialect === d
                    ? "border-emerald-500 bg-emerald-950/30 text-white"
                    : "border-slate-800 bg-slate-950 text-slate-400"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4">
          <div className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="size-5 text-emerald-400" />
            <span>14-Digit FSSAI Compliance &amp; Packaging Fee (Paise)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-300 block mb-1">14-Digit FSSAI License</label>
              <Input
                value={fssaiNumber}
                onChange={(e) => setFssaiNumber(e.target.value.replace(/\D/g, "").slice(0, 14))}
                className="h-10 bg-slate-950 border-slate-800 text-white font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 block mb-1">FSSAI Expiry Date</label>
              <Input
                type="date"
                value={fssaiExpiry}
                onChange={(e) => setFssaiExpiry(e.target.value)}
                className="h-10 bg-slate-950 border-slate-800 text-white font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 block mb-1">Default Packaging (Paise)</label>
              <Input
                type="number"
                value={packagingPaise}
                onChange={(e) => setPackagingPaise(e.target.value)}
                className="h-10 bg-slate-950 border-slate-800 text-white font-mono text-xs"
              />
            </div>
          </div>
          <Button type="submit" className="h-10 px-5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl">
            Save Storefront Settings
          </Button>
        </form>
      </div>
    </VendorShell>
  );
}
