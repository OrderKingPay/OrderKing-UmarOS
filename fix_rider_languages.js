
const fs = require("fs");
const path = "orderking-riders/src/lib/rider/i18n.ts";
let content = fs.readFileSync(path, "utf8");

// Add basic strings for other languages
const newLangs = `
  hi: { ...STRINGS.en, brandTag: "पार्टनर", signIn: "साइन इन करें", goOnline: "ऑनलाइन जाएं" },
  te: { ...STRINGS.en, brandTag: "భాగస్వామి", signIn: "సైన్ ఇన్ చేయండి", goOnline: "ఆన్‌లైన్‌కి వెళ్లండి" },
  ta: { ...STRINGS.en, brandTag: "கூட்டாளர்", signIn: "உள்நுழைக", goOnline: "ஆன்லைனில் செல்லவும்" },
  mr: { ...STRINGS.en, brandTag: "भागीदार", signIn: "साइन इन करा", goOnline: "ऑनलाइन जा" },
  gu: { ...STRINGS.en, brandTag: "ભાગીદાર", signIn: "સાઇન ઇન કરો", goOnline: "ઓનલાઇન જાઓ" },
  kn: { ...STRINGS.en, brandTag: "ಪಾಲುದಾರ", signIn: "ಸೈನ್ ಇನ್ ಮಾಡಿ", goOnline: "ಆನ್‌ಲೈನ್‌ಗೆ ಹೋಗಿ" },
  ml: { ...STRINGS.en, brandTag: "പങ്കാളി", signIn: "സൈൻ ഇൻ ചെയ്യുക", goOnline: "ഓൺലൈനിൽ പോകുക" },
  pa: { ...STRINGS.en, brandTag: "ਭਾਈਵਾਲ", signIn: "ਸਾਈਨ ਇਨ ਕਰੋ", goOnline: "ਆਨਲਾਈਨ ਜਾਓ" },
  or: { ...STRINGS.en, brandTag: "ଅଂଶୀଦାର", signIn: "ସାଇନ୍ ଇନ୍ କରନ୍ତୁ", goOnline: "ଅନଲାଇନ୍ ଯାଆନ୍ତୁ" },
  as: { ...STRINGS.en, brandTag: "অংশীদাৰ", signIn: "ছাইন ইন কৰক", goOnline: "অনলাইনলৈ যাওক" },
  ur: { ...STRINGS.en, brandTag: "پارٹنر", signIn: "سائن ان کریں", goOnline: "آن لائن جائیں" },
`;

// Insert after bn block
content = content.replace(/(bn: \{[\s\S]*?\},)/, `$1\n${newLangs}`);

// Add language names
const newNames = `
  hi: "हिंदी",
  te: "తెలుగు",
  ta: "தமிழ்",
  mr: "मराठी",
  gu: "ગુજરાતી",
  kn: "ಕನ್ನಡ",
  ml: "മലയാളം",
  pa: "ਪੰਜਾਬੀ",
  or: "ଓଡ଼ିଆ",
  as: "অসমীয়া",
  ur: "اردو",
`;

content = content.replace(/(bn: "বাংলা",)/, `$1\n${newNames}`);

fs.writeFileSync(path, content, "utf8");
console.log("Rider languages added");

