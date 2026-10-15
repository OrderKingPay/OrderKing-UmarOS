const fs = require('fs');
const content = import { useI18n } from \"@/lib/rider/i18n-context\";
import { LOCALE_LABELS } from \"@/lib/rider/i18n\";
import type { LocaleCode } from \"@/lib/rider/types\";

export function LanguageSelector() {
  const { locale, setLocale } = useI18n();
  
  return (
    <select 
      value={locale} 
      onChange={(e) => setLocale(e.target.value as LocaleCode)}
      className=\"w-[140px] px-3 py-2 rounded-md border border-amber-500/20 bg-amber-500/5 text-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-sm\"
    >
      {(Object.keys(LOCALE_LABELS) as LocaleCode[]).map((code) => (
        <option key={code} value={code} className=\"bg-slate-900 text-slate-200\">
          {LOCALE_LABELS[code]}
        </option>
      ))}
    </select>
  );
}
;
fs.writeFileSync('orderking-riders/src/components/language-selector.tsx', content, 'utf8');
