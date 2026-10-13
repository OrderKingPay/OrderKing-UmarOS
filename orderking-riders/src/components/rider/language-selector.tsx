import { Globe } from "lucide-react";
import { useI18n } from "@/lib/rider/i18n-context";
import { setLocaleFn } from "@/lib/server/rider-fns";
import type { LocaleCode } from "@/lib/rider/types";
import { cn } from "@/lib/utils";

export type RiderLanguageEntry = {
  code: LocaleCode;
  nativeLabel: string;
  englishName: string;
  regionGroup: "Primary & Pan-India" | "East & North-East India" | "South & West India" | "North & Classical Scheduled";
};

export const RIDER_LANGUAGES: ReadonlyArray<RiderLanguageEntry> = [
  // Primary & Pan-India
  { code: "en", nativeLabel: "English", englishName: "English", regionGroup: "Primary & Pan-India" },
  { code: "hi", nativeLabel: "हिन्दी", englishName: "Hindi", regionGroup: "Primary & Pan-India" },
  { code: "ur", nativeLabel: "اردو", englishName: "Urdu", regionGroup: "Primary & Pan-India" },

  // East & North-East India
  { code: "bn", nativeLabel: "বাংলা", englishName: "Bengali", regionGroup: "East & North-East India" },
  { code: "as", nativeLabel: "অসমীয়া", englishName: "Assamese", regionGroup: "East & North-East India" },
  { code: "or", nativeLabel: "ଓଡ଼ିଆ", englishName: "Odia", regionGroup: "East & North-East India" },
  { code: "mai", nativeLabel: "मैथिली", englishName: "Maithili", regionGroup: "East & North-East India" },
  { code: "sat", nativeLabel: "ᱥᱟᱱᱛᱟᱲᱤ", englishName: "Santali", regionGroup: "East & North-East India" },
  { code: "mni", nativeLabel: "মৈতৈলোন্", englishName: "Manipuri", regionGroup: "East & North-East India" },
  { code: "brx", nativeLabel: "बड़ो", englishName: "Bodo", regionGroup: "East & North-East India" },
  { code: "ne", nativeLabel: "नेपाली", englishName: "Nepali", regionGroup: "East & North-East India" },

  // South & West India
  { code: "te", nativeLabel: "తెలుగు", englishName: "Telugu", regionGroup: "South & West India" },
  { code: "ta", nativeLabel: "தமிழ்", englishName: "Tamil", regionGroup: "South & West India" },
  { code: "mr", nativeLabel: "मराठी", englishName: "Marathi", regionGroup: "South & West India" },
  { code: "gu", nativeLabel: "ગુજરાતી", englishName: "Gujarati", regionGroup: "South & West India" },
  { code: "kn", nativeLabel: "ಕನ್ನಡ", englishName: "Kannada", regionGroup: "South & West India" },
  { code: "ml", nativeLabel: "മലയാളം", englishName: "Malayalam", regionGroup: "South & West India" },
  { code: "kok", nativeLabel: "कोंकणी", englishName: "Konkani", regionGroup: "South & West India" },

  // North & Classical Scheduled
  { code: "pa", nativeLabel: "ਪੰਜਾਬੀ", englishName: "Punjabi", regionGroup: "North & Classical Scheduled" },
  { code: "ks", nativeLabel: "कॉशुर", englishName: "Kashmiri", regionGroup: "North & Classical Scheduled" },
  { code: "sd", nativeLabel: "सिन्धी", englishName: "Sindhi", regionGroup: "North & Classical Scheduled" },
  { code: "doi", nativeLabel: "डोगरी", englishName: "Dogri", regionGroup: "North & Classical Scheduled" },
  { code: "sa", nativeLabel: "संस्कृतम्", englishName: "Sanskrit", regionGroup: "North & Classical Scheduled" },
];

const REGION_GROUPS: ReadonlyArray<RiderLanguageEntry["regionGroup"]> = [
  "Primary & Pan-India",
  "East & North-East India",
  "South & West India",
  "North & Classical Scheduled",
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
          🌐 23 Languages:
        </span>
      )}
      <select
        value={locale}
        onChange={(e) => handleLanguageChange(e.target.value as LocaleCode)}
        aria-label={t("language")}
        className="cursor-pointer bg-transparent pr-1 text-xs font-bold text-slate-900 outline-none"
      >
        {REGION_GROUPS.map((group) => (
          <optgroup key={group} label={group} className="bg-white text-slate-500 font-semibold">
            {RIDER_LANGUAGES.filter((l) => l.regionGroup === group).map((lang) => (
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
          </optgroup>
        ))}
      </select>
    </div>
  );
}
