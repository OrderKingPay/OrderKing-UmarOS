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
  restaurantId: _restaurantId,
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
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      utterance.volume = volumeLevel / 5;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);

      setLiveAudioConfirm({
        text,
        langName: langMeta?.label ?? langToUse,
        level: volumeLevel,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch {
      setIsSpeaking(false);
    }
  };

  const handleStopAnnouncement = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
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
        `Audio announcement settings saved: ${langMeta?.label} (${langMeta?.native}), Volume Level ${volumeLevel}/5.`,
      );
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "Failed to save soundbox settings");
    } finally {
      setSaving(false);
    }
  };

  const currentLangMeta = INDIAN_LANGUAGE_CATALOG.find((l) => l.code === selectedLang);

  return (
    <Card className="border-gray-200 bg-white p-6 space-y-6 text-gray-900 rounded-2xl shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-100 text-[#E23744]">
            <Radio className="size-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-gray-900 flex items-center gap-2">
              Voice Announcements &amp; Soundbox
            </h2>
            <p className="text-xs text-gray-500">
              Clear voice alerts for new orders and payments in your kitchen's preferred language.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-600 bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">
            Level {volumeLevel}/5 · {currentLangMeta?.label}
          </span>
        </div>
      </div>

      {/* Grid: Voice Announcement Language & Soundbox Audio Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Section 1: Voice Announcement Language Selector */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="size-4 text-[#E23744]" />
                <span className="font-bold text-xs text-gray-900">
                  Announcement Language
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Select the language used for live voice announcements:
            </p>

            {/* Quick Select Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {CORE_SOUNDBOX_LANGUAGES.map((l) => {
                const isSelected = selectedLang === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setSelectedLang(l.code)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${isSelected
                      ? "border-[#E23744] bg-red-50 text-red-900 shadow-xs"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{l.native}</span>
                      {isSelected ? (
                        <CheckCircle2 className="size-3 text-[#E23744]" />
                      ) : null}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{l.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
            <span>Selected Language:</span>
            <span className="font-bold text-gray-900">
              {currentLangMeta?.native} ({currentLangMeta?.label})
            </span>
          </div>
        </div>

        {/* Section 2: Soundbox Audio Volume Slider (Level 1 to 5) */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <Volume2 className="size-4 text-[#E23744]" />
                <span className="font-bold text-xs text-gray-900">Voice Announcement Volume</span>
              </div>
              <span className="text-xs font-bold text-gray-900 bg-white border border-gray-200 px-2.5 py-1 rounded-md shadow-xs">
                Level {volumeLevel} of 5
              </span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Set the voice announcement volume level for your kitchen environment:
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
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#E23744]"
              />
              <div className="grid grid-cols-5 text-center text-[11px] text-gray-400">
                <span className={volumeLevel === 1 ? "text-gray-900 font-bold" : ""}>L1</span>
                <span className={volumeLevel === 2 ? "text-gray-900 font-bold" : ""}>L2</span>
                <span className={volumeLevel === 3 ? "text-gray-900 font-bold" : ""}>L3</span>
                <span className={volumeLevel === 4 ? "text-gray-900 font-bold" : ""}>L4</span>
                <span className={volumeLevel === 5 ? "text-gray-900 font-bold" : ""}>L5</span>
              </div>
            </div>

            {/* Test Amount Selector */}
            <div className="space-y-1.5 pt-1">
              <span className="text-xs text-gray-600 font-medium">Test Order Amount:</span>
              <div className="flex items-center gap-2">
                {[50, 150, 450, 1200].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTestAmount(amt)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${testAmount === amt
                      ? "bg-[#E23744] text-white shadow-xs"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                      }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Test Announcement Action Button */}
          <div className="pt-2 border-t border-gray-200 flex items-center gap-2">
            <Button
              size="sm"
              type="button"
              disabled={isSpeaking}
              onClick={() => handlePlayTestAnnouncement()}
              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold h-10 rounded-xl"
            >
              <Volume2 className="mr-1.5 size-4" />
              Play Test Voice Alert (₹{testAmount})
            </Button>
            {isSpeaking && (
              <Button
                size="sm"
                variant="destructive"
                type="button"
                onClick={handleStopAnnouncement}
                className="text-xs h-10 px-4 rounded-xl"
              >
                <Square className="mr-1.5 size-3.5" /> Stop
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Live Audio Confirmation Banner */}
      {liveAudioConfirm ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs flex items-start gap-2.5 shadow-xs">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-bold text-emerald-800">
              Test Voice Announcement Played
            </div>
            <div className="text-gray-700">
              &quot;{liveAudioConfirm.text}&quot;
            </div>
          </div>
        </div>
      ) : null}

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
          onClick={handleSaveSoundboxSettings}
          className="bg-[#E23744] hover:bg-[#d32f2f] text-white text-xs font-bold px-6 h-10 rounded-xl shadow-xs"
        >
          {saving ? "Saving..." : "Save Soundbox Settings"}
        </Button>
      </div>
    </Card>
  );
}
