const fs = require('fs');

const content = fs.readFileSync('orderking-riders/src/lib/rider/i18n.ts', 'utf8');

const additionalStrings = `
  hi: {
    signIn: "साइन इन करें",
    goOnline: "ऑनलाइन जाएं",
    goOffline: "ऑफ़लाइन जाएं",
    todayEarnings: "आज की कमाई"
  },
  te: {
    signIn: "సైన్ ఇన్ చేయండి",
    goOnline: "ఆన్‌లైన్‌కు వెళ్లండి",
    goOffline: "ఆఫ్‌లైన్‌కు వెళ్లండి",
    todayEarnings: "నేటి ఆదాయం"
  },
  ta: {
    signIn: "உள்நுழைய",
    goOnline: "ஆன்லைனில் செல்",
    goOffline: "ஆஃப்லைனில் செல்",
    todayEarnings: "இன்றைய வருமானம்"
  },
  mr: {
    signIn: "साइन इन करा",
    goOnline: "ऑनलाइन जा",
    goOffline: "ऑफलाइन जा",
    todayEarnings: "आजची कमाई"
  },
  gu: {
    signIn: "સાઇન ઇન કરો",
    goOnline: "ઓનલાઈન જાઓ",
    goOffline: "ઓફલાઈન જાઓ",
    todayEarnings: "આજની કમાણી"
  },
  kn: {
    signIn: "ಸೈನ್ ಇನ್ ಮಾಡಿ",
    goOnline: "ಆನ್‌ಲೈನ್ ಹೋಗಿ",
    goOffline: "ಆಫ್‌ಲೈನ್ ಹೋಗಿ",
    todayEarnings: "ಇಂದಿನ ಗಳಿಕೆ"
  },
  ml: {
    signIn: "സൈൻ ഇൻ ചെയ്യുക",
    goOnline: "ഓൺലൈനിൽ പോകുക",
    goOffline: "ഓഫ്‌ലൈനിൽ പോകുക",
    todayEarnings: "ഇന്നത്തെ വരുമാനം"
  },
  pa: {
    signIn: "ਸਾਈਨ ਇਨ ਕਰੋ",
    goOnline: "ਆਨਲਾਈਨ ਜਾਓ",
    goOffline: "ਆਫਲਾਈਨ ਜਾਓ",
    todayEarnings: "ਅੱਜ ਦੀ ਕਮਾਈ"
  },
  or: {
    signIn: "ସାଇନ୍ ଇନ୍ କରନ୍ତୁ",
    goOnline: "ଅନ୍ଲାଇନ୍ ଯାଆନ୍ତୁ",
    goOffline: "ଅଫଲାଇନ୍ ଯାଆନ୍ତୁ",
    todayEarnings: "ଆଜିର ରୋଜଗାର"
  },
  as: {
    signIn: "ছাইন ইন কৰক",
    goOnline: "অনলাইনলৈ যাওক",
    goOffline: "অফলাইনলৈ যাওক",
    todayEarnings: "আজিৰ উপাৰ্জন"
  },
  ur: {
    signIn: "سائن ان کریں",
    goOnline: "آن لائن جائیں",
    goOffline: "آف لائن جائیں",
    todayEarnings: "آج کی کمائی"
  }
`;

const bottomPart = `
export type MessageKey = keyof typeof STRINGS.en;

export function t(locale: LocaleCode, key: MessageKey): string {
  const pack = (STRINGS as any)[locale] || STRINGS.en;
  return pack[key] ?? STRINGS.en[key];
}

export const LOCALE_LABELS: Record<LocaleCode, string> = {
  en: "English",
  bn: "বাংলা",
  hi: "हिन्दी",
  te: "తెలుగు",
  ta: "தமிழ்",
  mr: "मराठी",
  gu: "ગુજરાતી",
  kn: "ಕನ್ನಡ",
  ml: "മലയാളം",
  pa: "ਪੰਜਾਬੀ",
  or: "ଓଡ଼ିଆ",
  as: "অসমীয়া",
  ur: "اردو"
};
`;

let newContent = content.replace(/} as const;[\s\S]+$/, '  ' + additionalStrings.trim() + '\n} as const;\n\n' + bottomPart.trim() + '\n');
fs.writeFileSync('orderking-riders/src/lib/rider/i18n.ts', newContent);
