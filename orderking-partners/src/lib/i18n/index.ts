import { platformConfig, type AppLanguage } from "@/lib/platform-config";
import { bn } from "./bn";
import { hi } from "./hi";
import { te } from "./te";
import { ta } from "./ta";
import { en, type MessageKeySource, type MessageTree } from "./en";

export type { AppLanguage, MessageTree };

export const INDIAN_LANGUAGE_CATALOG: {
  code: AppLanguage;
  label: string;
  native: string;
  region: string;
  bcp47: string;
}[] = [
  { code: "en", label: "English", native: "English", region: "Pan-India", bcp47: "en-IN" },
  { code: "hi", label: "Hindi", native: "हिन्दी", region: "North & Central India", bcp47: "hi-IN" },
  { code: "bn", label: "Bengali", native: "বাংলা", region: "West Bengal & Tripura", bcp47: "bn-IN" },
  { code: "te", label: "Telugu", native: "తెలుగు", region: "Telangana & Andhra Pradesh", bcp47: "te-IN" },
  { code: "mr", label: "Marathi", native: "मराठी", region: "Maharashtra", bcp47: "mr-IN" },
  { code: "ta", label: "Tamil", native: "தமிழ்", region: "Tamil Nadu & Puducherry", bcp47: "ta-IN" },
  { code: "ur", label: "Urdu", native: "اردو", region: "Jammu, Kashmir & Deccan", bcp47: "ur-IN" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી", region: "Gujarat", bcp47: "gu-IN" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ", region: "Karnataka", bcp47: "kn-IN" },
  { code: "ml", label: "Malayalam", native: "മലയാളം", region: "Kerala", bcp47: "ml-IN" },
  { code: "or", label: "Odia", native: "ଓଡ଼ିଆ", region: "Odisha", bcp47: "or-IN" },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ", region: "Punjab & Chandigarh", bcp47: "pa-IN" },
  { code: "as", label: "Assamese", native: "অসমীয়া", region: "Assam & Northeast", bcp47: "as-IN" },
  { code: "mai", label: "Maithili", native: "मैथिली", region: "Mithila (Bihar)", bcp47: "hi-IN" },
  { code: "sat", label: "Santali", native: "ᱥᱟᱱᱛᱟᱲᱤ", region: "Jharkhand, Odisha & Bengal", bcp47: "en-IN" },
  { code: "ks", label: "Kashmiri", native: "कॉशुर", region: "Kashmir Valley", bcp47: "ur-IN" },
  { code: "ne", label: "Nepali", native: "नेपाली", region: "Sikkim & Gorkhaland", bcp47: "ne-IN" },
  { code: "sd", label: "Sindhi", native: "सिन्धी", region: "Gujarat, Maharashtra & Rajasthan", bcp47: "hi-IN" },
  { code: "kok", label: "Konkani", native: "कोंकणी", region: "Goa & Konkan Coast", bcp47: "mr-IN" },
  { code: "doi", label: "Dogri", native: "डोगरी", region: "Jammu & Himachal", bcp47: "hi-IN" },
  { code: "mni", label: "Manipuri", native: "মৈতৈলোন্", region: "Manipur", bcp47: "bn-IN" },
  { code: "brx", label: "Bodo", native: "बड़ो", region: "Bodoland (Assam)", bcp47: "hi-IN" },
  { code: "sa", label: "Sanskrit", native: "संस्कृतम्", region: "Classical Pan-India", bcp47: "hi-IN" },
];

// Regional navigation & core operational overrides for scheduled languages without separate files
const regionalNavOverrides: Partial<Record<AppLanguage, Record<string, any>>> = {
  mr: {
    nav: { home: "मुख्यपृष्ठ", orders: "ऑर्डर्स", kitchen: "किचन", menu: "मेनू", more: "अधिक", promotions: "ऑफर्स", settlements: "सेटलमेंट", analytics: "विश्लेषण", reviews: "रिव्ह्यू", notifications: "सूचना", assistant: "सहाय्यक", hours: "वेळा", settings: "सेटिंग्ज", onboarding: "रेस्टॉरंट प्रोफाइल" },
  },
  gu: {
    nav: { home: "હોમ", orders: "ઓર્ડર્સ", kitchen: "કિચન", menu: "મેનુ", more: "વધુ", promotions: "ઓફર્સ", settlements: "સેટલમેન્ટ", analytics: "એનાલિટિક્સ", reviews: "રિવ્યુ", notifications: "નોટિફિકેશન", assistant: "સહાયક", hours: "સમય", settings: "સેટિંગ્સ", onboarding: "રેસ્ટોરન્ટ પ્રોફાઇલ" },
  },
  kn: {
    nav: { home: "ಮುಖಪುಟ", orders: "ಆರ್ಡರ್‌ಗಳು", kitchen: "ಅಡುಗೆಮನೆ", menu: "ಮೆನು", more: "ಇನ್ನಷ್ಟು", promotions: "ಆಫರ್‌ಗಳು", settlements: "ಸೆಟಲ್ಮೆಂಟ್", analytics: "ವಿಶ್ಲೇಷಣೆ", reviews: "ವಿಮರ್ಶೆಗಳು", notifications: "ಸೂಚನೆಗಳು", assistant: "ಸಹಾಯಕ", hours: "ಸಮಯ", settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು", onboarding: "ರೆಸ್ಟೋರೆಂಟ್ ಪ್ರೊಫೈಲ್" },
  },
  ml: {
    nav: { home: "ഹോം", orders: "ഓർഡറുകൾ", kitchen: "അടുക്കള", menu: "മെനു", more: "കൂടുതൽ", promotions: "ഓഫറുകൾ", settlements: "സെറ്റിൽമെന്റ്", analytics: "അനലിറ്റിക്സ്", reviews: "റിവ്യൂകൾ", notifications: "അറിയിപ്പുകൾ", assistant: "അസിസ്റ്റന്റ്", hours: "സമയം", settings: "സെറ്റിംഗ്സ്", onboarding: "റെസ്റ്റോറന്റ് പ്രൊഫൈൽ" },
  },
  pa: {
    nav: { home: "ਮੁੱਖ ਪੰਨਾ", orders: "ਆਰਡਰ", kitchen: "ਰਸੋਈ", menu: "ਮੇਨੂ", more: "ਹੋਰ", promotions: "ਆਫ਼ਰਾਂ", settlements: "ਸੈਟਲਮੈਂਟ", analytics: "ਐਨਾਲਿਟਿਕਸ", reviews: "ਰੀਵਿਊ", notifications: "ਸੂਚਨਾਵਾਂ", assistant: "ਸਹਾਇਕ", hours: "ਸਮਾਂ", settings: "ਸੈਟਿੰਗਾਂ", onboarding: "ਰੈਸਟੋਰੈਂਟ ਪ੍ਰੋਫਾਈਲ" },
  },
  or: {
    nav: { home: "ହୋମ୍", orders: "ଅର୍ଡର", kitchen: "ରୋଷେଇ", menu: "ମେନୁ", more: "ଅଧିକ", promotions: "ଅଫର୍", settlements: "ସେଟଲମେଣ୍ଟ", analytics: "ଆନାଲିଟିକ୍ସ", reviews: "ରିଭ୍ୟୁ", notifications: "ସୂଚନା", assistant: "ସହାୟକ", hours: "ସମୟ", settings: "ସେଟିଂସ୍", onboarding: "ରେଷ୍ଟୁରାଣ୍ଟ ପ୍ରୋଫାଇଲ୍" },
  },
  as: {
    nav: { home: "হোম", orders: "অৰ্ডাৰ", kitchen: "পাকঘৰ", menu: "মেনু", more: "অধিক", promotions: "অফাৰ", settlements: "ছেটেলমেণ্ট", analytics: "বিশ্লেষণ", reviews: "ৰিভিউ", notifications: "জাননী", assistant: "সহায়ক", hours: "সময়", settings: "ছেটিংছ", onboarding: "ৰেষ্টুৰেণ্ট প্ৰফাইল" },
  },
  ur: {
    nav: { home: "ہوم", orders: "آرڈرز", kitchen: "کچن", menu: "مینو", more: "مزید", promotions: "آفرز", settlements: "سیٹلمنٹ", analytics: "تجزیہ", reviews: "جائزے", notifications: "اطلاعات", assistant: "معاون", hours: "اوقات", settings: "ترتیبات", onboarding: "ریسٹورنٹ پروفائل" },
  },
  mai: hi,
  ne: hi,
  kok: hi,
  doi: hi,
  brx: hi,
  sa: hi,
  sd: hi,
  ks: hi,
  mni: bn,
  sat: en,
};

const dictionaries: Record<string, any> = {
  en,
  bn,
  hi,
  te,
  ta,
  ...regionalNavOverrides,
};

type Leaves<T, P extends string = ""> = T extends string
  ? P
  : {
      [K in keyof T & string]: Leaves<T[K], P extends "" ? K : `${P}.${K}`>;
    }[keyof T & string];

export type MessageKey = Leaves<MessageKeySource>;

function lookup(tree: unknown, path: string): string | undefined {
  let cur: unknown = tree;
  for (const part of path.split(".")) {
    if (typeof cur !== "object" || cur == null) return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

export function translate(
  lang: AppLanguage,
  key: MessageKey | string,
  vars?: Record<string, string | number>,
): string {
  const dict = dictionaries[lang] ?? dictionaries[platformConfig.localization.defaultLanguage];
  let text = lookup(dict, key) ?? lookup(hi, key) ?? lookup(en, key) ?? key;
  if (lang === "en") {
    text = lookup(en, key) ?? key;
  }
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}

export const dictionariesForAdmin = dictionaries;
