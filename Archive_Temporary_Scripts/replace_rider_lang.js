const fs = require('fs');
let c = fs.readFileSync('orderking-riders/src/lib/rider/i18n.ts', 'utf8');

c = c.replace(/export const LOCALE_LABELS: Record<LocaleCode, string> = \{[^]+?\};/, 
export const LOCALE_LABELS: Record<LocaleCode, string> = {
  en: "English",
  bn: "বাংলা"
};);

c = c.replace(/export type LocaleCode = [^;]+;/, 'export type LocaleCode = "en" | "bn";');

fs.writeFileSync('orderking-riders/src/lib/rider/i18n.ts', c, 'utf8');
