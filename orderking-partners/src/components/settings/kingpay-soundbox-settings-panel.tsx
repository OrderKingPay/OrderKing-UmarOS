import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { INDIAN_LANGUAGE_CATALOG } from "@/lib/i18n";
import type { AppLanguage } from "@/lib/platform-config";
import { buildSoundboxSpeechAlert } from "@/components/KingPaySoundboxEngine";
import {
  Volume2,
  Radio,
  Square,
  CheckCircle2,
  Globe,
} from "lucide-react";

export interface KingpaySoundboxSettingsPanelProps {
  restaurantId?: string;
}

// 10 Mandatory food-tech benchmark announcement languages
const CORE_SOUNDBOX_LANGUAGES: {
  code: AppLanguage;
  label: string;
  native: string;
  sampleAmount: number;
}[] = [
  { code: "en", label: "English", native: "English", sampleAmount: 450 },
  { code: "hi", label: "Hindi", native: "हिन्दी", sampleAmount: 450 },
  { code: "bn", label: "Bengali", native: "বাংলা", sampleAmount: 450 },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી", sampleAmount: 450 },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ", sampleAmount: 450 },
  { code: "ml", label: "Malayalam", native: "മലയാളം", sampleAmount: 450 },
  { code: "mr", label: "Marathi", native: "मराठी", sampleAmount: 450 },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ", sampleAmount: 450 },
  { code: "ta", label: "Tamil", native: "தமிழ்", sampleAmount: 450 },
  { code: "te", label: "Telugu", native: "తెలుగు", sampleAmount: 450 },
];

export function KingpaySoundboxSettingsPanel({
  restaurantId,
}: KingpaySoundboxSettingsPanelProps) {
  // 1. Voice Announcement Language Selector
  const [selectedLang, setSelectedLang] = useState<AppLanguage>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ok_soundbox_lang") as AppLanguage | null;
      if (saved && INDIAN_LANGUAGE_CATALOG.some((l) => l.code === saved)) {
        return saved;
      }
    }
    return "hi"; // Hindi default
  });

  // 2. Soundbox Audio Volume Slider (Level 1 to 5)
  const [volumeLevel, setVolumeLevel] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ok_soundbox_volume");
      if (saved) return Math.min(5, Math.max(1, Number(saved)));
    }
    return 4; // Level 4 standard
  });

  const [testAmount, setTestAmount] = useState<number>(450);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [liveAudioConfirm, setLiveAudioConfirm] = useState<{
    text: string;
    langName: string;
    level: number;
    timestamp: string;
  } | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlayTestAnnouncement = (langToUse = selectedLang, amt = testAmount) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setLiveAudioConfirm({
        text: "SpeechSynthesis API unavailable in current environment.",
        langName: langToUse,
        level: volumeLevel,
        timestamp: new Date().toLocaleTimeString(),
      });
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const text = buildSoundboxSpeechAlert(langToUse, amt);
      const bcp47 =
        INDIAN_LANGUAGE_CATALOG.find((l) => l.code === langToUse)?.bcp47 ?? "en-IN";
      const langMeta = INDIAN_LANGUAGE_CATALOG.find((l) => l.code === langToUse);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = bcp47;
      // Volume level 1 to 5 mapped to 0.2 to 1.0
      utterance.volume = Math.max(0.2, Math.min(1.0, volumeLevel / 5));
      utterance.rate = 0.95;
      utterance.pitch = 1.05;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);

      setLiveAudioConfirm({
        text,
        langName: `${langMeta?.native ?? langToUse} (${langMeta?.label ?? langToUse})`,
        level: volumeLevel,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      console.error("Test announcement failed", err);
      setIsSpeaking(false);
    }
  };

  const handleStopAnnouncement = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const handleSaveSoundboxSettings = () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("ok_soundbox_lang", selectedLang);
        localStorage.setItem("ok_soundbox_volume", String(volumeLevel));
      }
      const langMeta = INDIAN_LANGUAGE_CATALOG.find((l) => l.code === selectedLang);
      setSaveMsg(
        `KingPay Soundbox Audio Announcement Engine saved: Voice Language: ${langMeta?.label} (${langMeta?.native}), Volume Level: ${volumeLevel}/5.`,
      );
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "Failed to save soundbox settings");
    } finally {
      setSaving(false);
    }
  };

  const currentLangMeta = INDIAN_LANGUAGE_CATALOG.find((l) => l.code === selectedLang);

  return (
    <Card className="border-slate-800 bg-slate-900/80 p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Radio className="size-5" />
            </div>
            {isSpeaking && (
              <span className="absolute -top-1 -right-1 flex size-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-3 bg-emerald-500" />
              </span>
            )}
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
              KingPay Soundbox Audio Announcement Engine
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                INSTANT AUDIO ALERTS
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Instant, crystal-clear voice announcements upon UPI and KingPay order settlements in your team&apos;s preferred regional language.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded">
            LEVEL {volumeLevel}/5 · {currentLangMeta?.label.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Grid: Voice Announcement Language & Soundbox Audio Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Section 1: Voice Announcement Language Selector */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Globe className="size-4 text-emerald-400" />
                <span className="font-bold text-sm text-white">
                  Voice Announcement Language
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                10 CORE LANGUAGES
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Select the primary voice announcement language broadcast over the KingPay Soundbox counter terminal:
            </p>

            {/* Quick Select Buttons for 10 Mandated Languages */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {CORE_SOUNDBOX_LANGUAGES.map((l) => {
                const isSelected = selectedLang === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setSelectedLang(l.code)}
                    className={`p-2 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500/15 text-white shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                        : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{l.native}</span>
                      {isSelected ? (
                        <CheckCircle2 className="size-3 text-emerald-400" />
                      ) : null}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{l.label}</div>
                  </button>
                );
              })}
            </div>

            {/* Comprehensive All-India Language Dropdown */}
            <div className="pt-1 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-400">All 10 Official Languages:</span>
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value as AppLanguage)}
                className="h-8 rounded-lg border border-slate-800 bg-slate-900 px-2.5 text-xs font-semibold text-emerald-300 outline-none focus:border-emerald-500"
              >
                {INDIAN_LANGUAGE_CATALOG.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.native} ({item.label} · {item.region})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Active Voice Language:</span>
            <span className="font-mono text-emerald-400 font-bold">
              {currentLangMeta?.native} ({currentLangMeta?.label})
            </span>
          </div>
        </div>

        {/* Section 2: Soundbox Audio Volume Slider (Level 1 to 5) */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Volume2 className="size-4 text-emerald-400" />
                <span className="font-bold text-sm text-white">Soundbox Audio Volume</span>
              </div>
              <span className="text-sm font-bold font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded">
                Level {volumeLevel} of 5
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Adjust hardware output volume for different kitchen and cashier environments (from quiet cafe to noisy rush hours):
            </p>

            {/* Volume Slider: Level 1 to 5 */}
            <div className="space-y-2 pt-1">
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={volumeLevel}
                onChange={(e) => setVolumeLevel(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="grid grid-cols-5 text-center text-[10px] font-mono text-slate-400">
                <span className={volumeLevel === 1 ? "text-emerald-400 font-bold" : ""}>
                  L1 (20%)
                </span>
                <span className={volumeLevel === 2 ? "text-emerald-400 font-bold" : ""}>
                  L2 (40%)
                </span>
                <span className={volumeLevel === 3 ? "text-emerald-400 font-bold" : ""}>
                  L3 (60%)
                </span>
                <span className={volumeLevel === 4 ? "text-emerald-400 font-bold" : ""}>
                  L4 (80%)
                </span>
                <span className={volumeLevel === 5 ? "text-emerald-400 font-bold" : ""}>
                  L5 (100%)
                </span>
              </div>
            </div>

            {/* Environment Recommendation Pill */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 text-xs flex items-center justify-between">
              <span className="text-slate-400">Environment Preset:</span>
              <span className="font-semibold text-slate-200">
                {volumeLevel === 1 && "Quiet Cafe / Reception Counter"}
                {volumeLevel === 2 && "Indoor Casual Dining"}
                {volumeLevel === 3 && "Standard Restaurant Dining Hall"}
                {volumeLevel === 4 && "Bustling Open Kitchen & Counter (Default)"}
                {volumeLevel === 5 && "High-Noise Rush Hour / High-Volume Kitchen"}
              </span>
            </div>

            {/* Test Amount Selector */}
            <div className="space-y-1.5 pt-1">
              <span className="text-xs text-slate-300 font-medium">Test Order Amount:</span>
              <div className="flex items-center gap-1.5">
                {[50, 150, 450, 1200, 2500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTestAmount(amt)}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition ${
                      testAmount === amt
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Test Announcement Action Button */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
            <Button
              size="sm"
              type="button"
              disabled={isSpeaking}
              onClick={() => handlePlayTestAnnouncement()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
            >
              <Volume2 className="mr-1.5 size-4" />
              Play Test Announcement (₹{testAmount})
            </Button>
            {isSpeaking && (
              <Button
                size="sm"
                variant="destructive"
                type="button"
                onClick={handleStopAnnouncement}
                className="text-xs"
              >
                <Square className="mr-1 size-3" /> Stop
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Live Audio Confirmation Banner */}
      {liveAudioConfirm ? (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-400 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-bold text-emerald-300 flex items-center gap-2">
              <span>Live Soundbox Audio Confirmation</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded">
                AT {liveAudioConfirm.timestamp}
              </span>
            </div>
            <div className="text-slate-200">
              Broadcasted: &quot;<span className="text-white font-semibold">{liveAudioConfirm.text}</span>&quot;
            </div>
            <div className="text-[11px] text-emerald-400/80 font-mono">
              Language: {liveAudioConfirm.langName} · Volume: Level {liveAudioConfirm.level}/5
            </div>
          </div>
        </div>
      ) : null}

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
          onClick={handleSaveSoundboxSettings}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4"
        >
          {saving ? "Saving Soundbox Settings..." : "Save KingPay Soundbox Settings"}
        </Button>
      </div>
    </Card>
  );
}
