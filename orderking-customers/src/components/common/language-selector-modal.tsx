import { useState } from "react";
import { Check, Globe, Search, Sparkles, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type IndianLanguageOption = {
  code: string;
  name: string;
  nativeName: string;
  voiceLang: string;
  region: string;
  greeting: string;
};

export const ALL_INDIAN_LANGUAGES: IndianLanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", voiceLang: "en-IN", region: "Pan-India", greeting: "Hello & Welcome" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", voiceLang: "hi-IN", region: "North & Central India", greeting: "नमस्ते" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", voiceLang: "bn-IN", region: "West Bengal, Assam & Tripura", greeting: "নমস্কার" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া", voiceLang: "as-IN", region: "Assam & Northeast", greeting: "নমস্কাৰ" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", voiceLang: "ta-IN", region: "Tamil Nadu & Puducherry", greeting: "வணக்கம்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", voiceLang: "te-IN", region: "Andhra Pradesh & Telangana", greeting: "నమస్కారం" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", voiceLang: "kn-IN", region: "Karnataka", greeting: "ನಮಸ್ಕಾರ" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", voiceLang: "ml-IN", region: "Kerala & Lakshadweep", greeting: "നമസ്കാരം" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", voiceLang: "mr-IN", region: "Maharashtra & Goa", greeting: "नमस्कार" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", voiceLang: "gu-IN", region: "Gujarat", greeting: "નમસ્તે" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", voiceLang: "pa-IN", region: "Punjab & Delhi NCR", greeting: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", voiceLang: "or-IN", region: "Odisha", greeting: "ନମସ୍କାର" },
];

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCode: string;
  onSelectLanguage: (lang: IndianLanguageOption) => void;
}

export function LanguageSelectorModal({
  isOpen,
  onClose,
  selectedCode,
  onSelectLanguage,
}: LanguageSelectorModalProps) {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filtered = ALL_INDIAN_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(search.toLowerCase()) ||
      l.region.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-border/80 bg-surface p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-xs">
              <Globe className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-fg tracking-tight">Select Language / ভাষা</h3>
              <p className="text-xs text-muted">12 Sovereign Indian Languages Supported</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted hover:bg-surface-2 hover:text-fg transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Clean Search Input (No side-by-side button clutter) */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search language or state..."
            className="w-full rounded-xl border border-border bg-surface-2 pl-9 pr-4 py-2 text-xs font-medium text-fg focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-fg"
            >
              Clear
            </button>
          )}
        </div>

        {/* Clean Structured Language Grid */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
          {filtered.map((lang) => {
            const isSelected = selectedCode === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  onSelectLanguage(lang);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-150 ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/40"
                    : "border-border/70 bg-surface-2/40 hover:bg-surface-2 hover:border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-8 items-center justify-center rounded-lg text-xs font-bold ${
                      isSelected
                        ? "bg-primary text-white"
                        : "bg-surface-2 border border-border text-muted"
                    }`}
                  >
                    {lang.code.toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-fg">{lang.nativeName}</span>
                      <span className="text-xs text-muted">({lang.name})</span>
                    </div>
                    <p className="text-[10px] text-muted">{lang.greeting} · {lang.region}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isSelected && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary text-white text-xs">
                      <Check className="size-3 stroke-[3]" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-8 text-center text-xs text-muted">
              No matching languages found for "{search}"
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-border/60 text-center">
          <p className="text-[11px] text-muted flex items-center justify-center gap-1">
            <Sparkles className="size-3 text-amber-500" />
            <span>AI Voice Concierge automatically responds in your selected language</span>
          </p>
        </div>
      </div>
    </div>
  );
}
