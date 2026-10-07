const fs = require('fs');
let c = fs.readFileSync('orderking-customers/src/lib/i18n/index.ts', 'utf8');

c = c.replace(/export type Lang =[^;]+;/, 'export type Lang = "en" | "hi" | "bn" | "as" | "ta" | "te";');

c = c.replace(/export const LANGS: \{ id: Lang; name: string; native: string \}\[\] = \[[^\]]+\];/, 
export const LANGS: { id: Lang; name: string; native: string }[] = [
  { id: "en", name: "English", native: "English" },
  { id: "hi", name: "Hindi", native: "हिन्दी" },
  { id: "bn", name: "Bengali", native: "বাংলা" },
  { id: "as", name: "Assamese", native: "অসমীয়া" },
  { id: "ta", name: "Tamil", native: "தமிழ்" },
  { id: "te", name: "Telugu", native: "తెలుగు" },
];);

fs.writeFileSync('orderking-customers/src/lib/i18n/index.ts', c, 'utf8');

let m = fs.readFileSync('orderking-customers/src/components/common/language-selector-modal.tsx', 'utf8');

m = m.replace(/export const ALL_INDIAN_LANGUAGES: IndianLanguageOption\[\] = \[[^\]]+\];/,
export const ALL_INDIAN_LANGUAGES: IndianLanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", voiceLang: "en-IN", region: "Pan-India", greeting: "Hello & Welcome" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", voiceLang: "hi-IN", region: "North & Central India", greeting: "नमस्ते" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", voiceLang: "bn-IN", region: "West Bengal, Assam & Tripura", greeting: "নমস্কার" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া", voiceLang: "as-IN", region: "Assam & Northeast", greeting: "নমস্কাৰ" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", voiceLang: "ta-IN", region: "Tamil Nadu & Puducherry", greeting: "வணக்கம்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", voiceLang: "te-IN", region: "Andhra Pradesh & Telangana", greeting: "నమస్కారం" }
];);

m = m.replace(/12 Sovereign Indian Languages Supported/g, "6 Sovereign Indian Languages Supported");

fs.writeFileSync('orderking-customers/src/components/common/language-selector-modal.tsx', m, 'utf8');

