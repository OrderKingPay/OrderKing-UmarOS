import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/assistant")({ component: AssistantPage });

export type IndianLanguageSpec = {
  code: string;
  bcp47: string;
  name: string;
  nativeName: string;
  region: string;
  greeting: string;
  statusHeader: string;
  payoutHeader: string;
  menuHeader: string;
};

/**
 * 10 Official Benchmark Languages.
 */
export const INDIAN_CONSTITUTIONAL_LANGUAGES: readonly IndianLanguageSpec[] = [
  {
    code: "en",
    bcp47: "en-IN",
    name: "English",
    nativeName: "English",
    region: "Pan-India",
    greeting: "Order King Kitchen Desk & Partner Assistant Partner",
    statusHeader: "Live Kitchen & Storefront Status",
    payoutHeader: "Verified Direct Payout & Earnings Ledger",
    menuHeader: "Menu Studio & Kitchen Quality",
  },
  {
    code: "hi",
    bcp47: "hi-IN",
    name: "Hindi",
    nativeName: "हिन्दी",
    region: "North & Central India",
    greeting: "ऑर्डर किंग और Partner Assistant किचन साथी",
    statusHeader: "लाइव किचन और स्टोरफ्रंट स्थिति",
    payoutHeader: "सत्यापित प्रत्यक्ष पेआउट और आय लेजर",
    menuHeader: "मेनू स्टूडियो और किचन गुणवत्ता",
  },
  {
    code: "bn",
    bcp47: "bn-IN",
    name: "Bengali",
    nativeName: "বাংলা",
    region: "West Bengal & Tripura",
    greeting: "অর্ডার কিং ও Partner Assistant কিচেন পার্টনার",
    statusHeader: "লাইভ কিচেন ও স্টোরফ্রন্ট স্থিতি",
    payoutHeader: "যাচাইকৃত সরাসরি পেআউট ও আয় লেজার",
    menuHeader: "মেনু স্টুডিও ও কিচেন মান",
  },
  {
    code: "gu",
    bcp47: "gu-IN",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    region: "Gujarat & DNHDD",
    greeting: "ઓર્ડર કિંગ અને Partner Assistant કિચન પાર્ટનર",
    statusHeader: "લાઇવ કિચન અને સ્ટોરફ્રન્ટ સ્થિતિ",
    payoutHeader: "ચકાસાયેલ સીધી ચુકવણી અને કમાણી ખાતાવહી",
    menuHeader: "મેનુ સ્ટુડિયો અને કિચન ગુણવત્તા",
  },
  {
    code: "kn",
    bcp47: "kn-IN",
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    region: "Karnataka",
    greeting: "ಆರ್ಡರ್ ಕಿಂಗ್ ಮತ್ತು Partner Assistant ಕಿಚನ್ ಪಾರ್ಟ್ನರ್",
    statusHeader: "ಲೈವ್ ಕಿಚನ್ ಮತ್ತು ಸ್ಟೋರ್‌ಫ್ರಂಟ್ ಸ್ಥಿತಿ",
    payoutHeader: "ಪರಿಶೀಲಿಸಿದ ನೇರ ಪಾವತಿ ಮತ್ತು ಗಳಿಕೆ ಲೆಡ್ಜರ್",
    menuHeader: "ಮೆನು ಸ್ಟುಡಿಯೋ ಮತ್ತು ಕಿಚನ್ ಗುಣಮಟ್ಟ",
  },
  {
    code: "ml",
    bcp47: "ml-IN",
    name: "Malayalam",
    nativeName: "മലയാളം",
    region: "Kerala & Lakshadweep",
    greeting: "ഓർഡർ കിംഗ് & Partner Assistant കിച്ചൺ പാർട്ണർ",
    statusHeader: "ലൈവ് കിച്ചൺ & സ്റ്റോർഫ്രണ്ട് നില",
    payoutHeader: "പരിശോധിച്ച നേരിട്ടുള്ള പേഔട്ടും വരുമാന ലെഡ്ജറും",
    menuHeader: "മെനു സ്റ്റുഡിയോ & കിച്ചൺ ഗുണനിലവാരം",
  },
  {
    code: "mr",
    bcp47: "mr-IN",
    name: "Marathi",
    nativeName: "मराठी",
    region: "Maharashtra & Goa",
    greeting: "ऑर्डर किंग आणि Partner Assistant किचन पार्टनर",
    statusHeader: "थेट किचन आणि स्टोअरफ्रंट स्थिती",
    payoutHeader: "सत्यापित थेट पेआउट आणि कमाई लेजर",
    menuHeader: "मेनू स्टुडिओ आणि किचन गुणवत्ता",
  },
  {
    code: "pa",
    bcp47: "pa-IN",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    region: "Punjab & Chandigarh",
    greeting: "ਆਰਡਰ ਕਿੰਗ ਅਤੇ Partner Assistant ਕਿਚਨ ਪਾਰਟਨਰ",
    statusHeader: "ਲਾਈਵ ਕਿਚਨ ਅਤੇ ਸਟੋਰਫਰੰਟ ਸਥਿਤੀ",
    payoutHeader: "ਪ੍ਰਮਾਣਿਤ ਸਿੱਧੀ ਅਦਾਇਗੀ ਅਤੇ ਕਮਾਈ ਖਾਤਾ",
    menuHeader: "ਮੀਨੂ ਸਟੂਡੀਓ ਅਤੇ ਕਿਚਨ ਕੁਆਲਿਟੀ",
  },
  {
    code: "ta",
    bcp47: "ta-IN",
    name: "Tamil",
    nativeName: "தமிழ்",
    region: "Tamil Nadu & Puducherry",
    greeting: "ஆர்டர் கிங் & Partner Assistant கிச்சன் பார்ட்னர்",
    statusHeader: "நேரடி சமையலறை மற்றும் கடை நிலை",
    payoutHeader: "சரிபார்க்கப்பட்ட நேரடி வருவாய் லெட்ஜர்",
    menuHeader: "மெனு ஸ்டுடியோ மற்றும் சமையலறை தரம்",
  },
  {
    code: "te",
    bcp47: "te-IN",
    name: "Telugu",
    nativeName: "తెలుగు",
    region: "Andhra Pradesh & Telangana",
    greeting: "ఆర్డర్ కింగ్ & Partner Assistant కిచెన్ పార్ట్నర్",
    statusHeader: "లైవ్ కిచెన్ & స్టోర్‌ఫ్రంట్ స్థితి",
    payoutHeader: "ధృవీకరించబడిన ప్రత్యక్ష చెల్లింపు మరియు ఆదాయాల లెడ్జర్",
    menuHeader: "మెనూ స్టూడియో & కిచెన్ నాణ్యత",
  },
] as const;

function AssistantPage() {
  return <Navigate to="/support" replace />;
}
