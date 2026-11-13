
import { useI18n } from "@/lib/rider/i18n-context";
import { LOCALE_LABELS } from "@/lib/rider/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LocaleCode } from "@/lib/rider/types";

export function LanguageSelector() {
  const { locale, setLocale } = useI18n();
  
  return (
    <Select value={locale} onValueChange={(val: any) => setLocale(val as LocaleCode)}>
      <SelectTrigger className="w-[140px] border-orange-500/20 bg-orange-500/5 text-orange-500 focus:ring-orange-500/20">
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent className="bg-slate-900 border-orange-500/20 text-slate-200">
        {(Object.keys(LOCALE_LABELS) as LocaleCode[]).map((code) => (
          <SelectItem key={code} value={code} className="hover:bg-orange-500/10 focus:bg-orange-500/10 cursor-pointer">
            {LOCALE_LABELS[code]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

