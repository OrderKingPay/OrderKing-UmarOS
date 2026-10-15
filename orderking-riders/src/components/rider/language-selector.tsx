import { Globe } from "lucide-react";
import { useI18n } from "@/lib/rider/i18n-context";
import { setLocaleFn } from "@/lib/server/rider-fns";
import type { LocaleCode } from "@/lib/rider/types";
import { cn } from "@/lib/utils";

export type RiderLanguageEntry = {
  code: LocaleCode;
  nativeLabel: string;
  englishName: string;
  regionGroup?: string;
};

export const RIDER_LANGUAGES: ReadonlyArray<RiderLanguageEntry> = [
  { code: "en", nativeLabel: "English", englishName: "English" },
  { code: "hi", nativeLabel: "हिन्दी", englishName: "Hindi" },
  { code: "bn", nativeLabel: "বাংলা", englishName: "Bengali" },
  { code: "gu", nativeLabel: "ગુજરાતી", englishName: "Gujarati" },
  { code: "kn", nativeLabel: "ಕನ್ನಡ", englishName: "Kannada" },
  { code: "ml", nativeLabel: "മലയാളം", englishName: "Malayalam" },
  { code: "mr", nativeLabel: "मराठी", englishName: "Marathi" },
  { code: "pa", nativeLabel: "ਪੰਜਾਬੀ", englishName: "Punjabi" },
  { code: "ta", nativeLabel: "தமிழ்", englishName: "Tamil" },
  { code: "te", nativeLabel: "తెలుగు", englishName: "Telugu" },
];

export function LanguageSelector({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { locale, setLocale, t } = useI18n();

  function handleLanguageChange(nextLocale: LocaleCode) {
    setLocale(nextLocale);
    void setLocaleFn({ data: { locale: nextLocale } }).catch(() => undefined);
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50",
        className,
      )}
    >
      <Globe className="size-3.5 shrink-0 text-emerald-700" aria-hidden="true" />
      {!compact && (
        <span className="hidden text-[11px] font-medium text-slate-500 sm:inline">
          Language:
        </span>
      )}
      <select
        value={locale}
        onChange={(e) => handleLanguageChange(e.target.value as LocaleCode)}
        aria-label={t("language")}
        className="cursor-pointer bg-transparent pr-1 text-xs font-bold text-slate-900 outline-none"
      >
        {RIDER_LANGUAGES.map((lang) => (
          <option
            key={lang.code}
            value={lang.code}
            className="bg-white text-slate-900 font-medium"
          >
            {compact
              ? `${lang.nativeLabel} · ${lang.englishName}`
              : `${lang.nativeLabel} (${lang.englishName})`}
          </option>
        ))}
      </select>
    </div>
  );
}
