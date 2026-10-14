import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { VendorShell } from "@/components/vendor-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { useT } from "@/components/use-t";
import { useVendor } from "@/components/use-vendor";
import { askAssistant } from "@/lib/server/api-more";
import { getDashboard, quickThrottleKitchen } from "@/lib/server/api-orders";
import { getMenu, saveItem, setAvailability } from "@/lib/server/api-menu";
import { getAnalytics, getPromotions, getSettlements } from "@/lib/server/api-finance";
import { formatINR, mulBps } from "@/lib/money";
import { can } from "@/lib/rbac";
import { useClientState } from "@/lib/client-state";
import { platformConfig, type AppLanguage } from "@/lib/platform-config";
import type { DietFlag } from "@/lib/contracts";
import { orderKingSpark } from "@/lib/ai/order-king-spark";

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
 * All 22 Eighth Schedule Constitutional Languages of the Republic of India + English (23 total).
 */
export const INDIAN_CONSTITUTIONAL_LANGUAGES: readonly IndianLanguageSpec[] = [
  {
    code: "en",
    bcp47: "en-IN",
    name: "English",
    nativeName: "English",
    region: "Pan-India",
    greeting: "OrderKing Autonomous Kitchen & King AI Diagnostic Desk",
    statusHeader: "Live Kitchen & Storefront Status",
    payoutHeader: "Verified Integer-Paise Settlement Ledger",
    menuHeader: "Menu Catalog & FSSAI Compliance",
  },
  {
    code: "hi",
    bcp47: "hi-IN",
    name: "Hindi",
    nativeName: "हिन्दी",
    region: "North & Central India",
    greeting: "ऑर्डरकिंग स्वायत्त किचन और King AI डायग्नोस्टिक डेस्क",
    statusHeader: "लाइव किचन और स्टोरफ्रंट स्थिति",
    payoutHeader: "सत्यापित पैसे (Paise) सेटलमेंट लेजर",
    menuHeader: "मेनू कैटलॉग और FSSAI अनुपालन",
  },
  {
    code: "bn",
    bcp47: "bn-IN",
    name: "Bengali",
    nativeName: "বাংলা",
    region: "West Bengal & Tripura",
    greeting: "অর্ডারকিং স্বয়ংক্রিয় কিচেন ও King AI Diagnostic Desk",
    statusHeader: "লাইভ কিচেন ও স্টোরফ্রন্ট স্থিতি",
    payoutHeader: "যাচাইকৃত পয়সা সেটেলমেন্ট লেজার",
    menuHeader: "মেনু ক্যাটালগ ও FSSAI কমপ্লায়েন্স",
  },
  {
    code: "te",
    bcp47: "te-IN",
    name: "Telugu",
    nativeName: "తెలుగు",
    region: "Andhra Pradesh & Telangana",
    greeting: "ఆర్డర్ కింగ్ స్వయంప్రతిపత్తి కిచెన్ & King AI Diagnostic Desk",
    statusHeader: "లైవ్ కిచెన్ & స్టోర్‌ఫ్రంట్ స్థితి",
    payoutHeader: "ధృవీకరించబడిన పైసా సెటిల్మెంట్ లెడ్జర్",
    menuHeader: "మెనూ కాటలాగ్ & FSSAI నిబంధనలు",
  },
  {
    code: "mr",
    bcp47: "mr-IN",
    name: "Marathi",
    nativeName: "मराठी",
    region: "Maharashtra & Goa",
    greeting: "ऑर्डरकिंग स्वायत्त किचन आणि King AI डायग्नोस्टिक डेस्क",
    statusHeader: "थेट किचन आणि स्टोअरफ्रंट स्थिती",
    payoutHeader: "सत्यापित पैसे सेटलमेंट लेजर",
    menuHeader: "मेनू कॅटलॉग आणि FSSAI अनुपालन",
  },
  {
    code: "ta",
    bcp47: "ta-IN",
    name: "Tamil",
    nativeName: "தமிழ்",
    region: "Tamil Nadu & Puducherry",
    greeting: "ஆர்டர்கிங் தன்னாட்சி கிச்சன் & King AI Diagnostic Desk",
    statusHeader: "நேரடி சமையலறை மற்றும் கடை நிலை",
    payoutHeader: "சரிபார்க்கப்பட்ட பைசா செட்டில்மென்ட் கணக்கு",
    menuHeader: "மெனு பட்டியல் மற்றும் FSSAI இணக்கம்",
  },
  {
    code: "ur",
    bcp47: "ur-IN",
    name: "Urdu",
    nativeName: "اردو",
    region: "Jammu & Kashmir, Telangana, UP",
    greeting: "آرڈر کنگ خودکار کچن اور King AI Diagnostic Desk",
    statusHeader: "لائیو کچن اور اسٹور فرنٹ کی صورتحال",
    payoutHeader: "تصدیق شدہ پیسہ سیٹلمنٹ لیجر",
    menuHeader: "مینو کیٹلاگ اور FSSAI تعمیل",
  },
  {
    code: "gu",
    bcp47: "gu-IN",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    region: "Gujarat & DNHDD",
    greeting: "ઓર્ડરકિંગ સ્વયંસંચાલિત કિચન અને King AI Diagnostic Desk",
    statusHeader: "લાઇવ કિચન અને સ્ટોરફ્રન્ટ સ્થિતિ",
    payoutHeader: "ચકાસાયેલ પૈસા સેટલમેન્ટ ખાતાવહી",
    menuHeader: "મેનુ કેટલોગ અને FSSAI પાલન",
  },
  {
    code: "kn",
    bcp47: "kn-IN",
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    region: "Karnataka",
    greeting: "ಆರ್ಡರ್‌ಕಿಂಗ್ ಸ್ವಯಂಚಾಲಿತ ಕಿಚನ್ ಮತ್ತು King AI Diagnostic Desk",
    statusHeader: "ಲೈವ್ ಕಿಚನ್ ಮತ್ತು ಸ್ಟೋರ್‌ಫ್ರಂಟ್ ಸ್ಥಿತಿ",
    payoutHeader: "ಪರಿಶೀಲಿಸಿದ ಪೈಸೆ ಸೆಟಲ್ಮೆಂಟ್ ಲೆಡ್ಜರ್",
    menuHeader: "ಮೆನು ಕ್ಯಾಟಲಾಗ್ ಮತ್ತು FSSAI ಅನುಸರಣೆ",
  },
  {
    code: "or",
    bcp47: "or-IN",
    name: "Odia",
    nativeName: "ଓଡ଼ିଆ",
    region: "Odisha",
    greeting: "ଅର୍ଡରକିଙ୍ଗ ସ୍ୱୟଂଚାଳିତ କିଚେନ୍ ଏବଂ King AI Diagnostic Desk",
    statusHeader: "ଲାଇଭ୍ କିଚେନ୍ ଓ ଷ୍ଟୋରଫ୍ରଣ୍ଟ ସ୍ଥିତି",
    payoutHeader: "ଯାଞ୍ଚ ହୋଇଥିବା ପଇସା ସେଟଲମେଣ୍ଟ ଲେଜର",
    menuHeader: "ମେନୁ କ୍ୟାଟାଲଗ୍ ଓ FSSAI ନିୟମାବଳୀ",
  },
  {
    code: "ml",
    bcp47: "ml-IN",
    name: "Malayalam",
    nativeName: "മലയാളം",
    region: "Kerala & Lakshadweep",
    greeting: "ഓർഡർകിംഗ് സ്വയംഭരണ കിച്ചൺ & King AI Diagnostic Desk",
    statusHeader: "ലൈവ് കിച്ചൺ & സ്റ്റോർഫ്രണ്ട് നില",
    payoutHeader: "പരിശോധിച്ച പൈസ സെറ്റിൽമെന്റ് ലെഡ്జర్",
    menuHeader: "മെനു കാറ്റലോഗും FSSAI പാലിക്കലും",
  },
  {
    code: "pa",
    bcp47: "pa-IN",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    region: "Punjab & Chandigarh",
    greeting: "ਆਰਡਰਕਿੰਗ ਸਵੈ-ਚਾਲਿਤ ਕਿਚਨ ਅਤੇ King AI Diagnostic Desk",
    statusHeader: "ਲਾਈਵ ਕਿਚਨ ਅਤੇ ਸਟੋਰਫਰੰਟ ਸਥਿਤੀ",
    payoutHeader: "ਪ੍ਰਮਾਣਿਤ ਪੈਸਾ ਸੈਟਲਮੈਂਟ ਖਾਤਾ",
    menuHeader: "ਮੀਨੂ ਕੈਟਾਲਾਗ ਅਤੇ FSSAI ਪਾਲਣਾ",
  },
  {
    code: "as",
    bcp47: "as-IN",
    name: "Assamese",
    nativeName: "অসমীয়া",
    region: "Assam & Northeast",
    greeting: "অৰ্ডাৰকিং স্বয়ংক্ৰিয় কিচেন আৰু King AI Diagnostic Desk",
    statusHeader: "লাইভ কিচেন আৰু ষ্ট’ৰফ্ৰণ্ট স্থিতি",
    payoutHeader: "সত্যাপিত পইচা ছেটেলমেণ্ট লেজাৰ",
    menuHeader: "মেনু কেটালগ আৰু FSSAI অনুপালন",
  },
  {
    code: "mai",
    bcp47: "mai-IN",
    name: "Maithili",
    nativeName: "मैथिली",
    region: "Bihar & Jharkhand",
    greeting: "ऑर्डरकिंग स्वायत्त भनसाघर आ King AI डायग्नोस्टिक डेस्क",
    statusHeader: "लाइव भनसाघर आ स्टोरफ्रंट स्थिति",
    payoutHeader: "सत्यापित पाइ सेटलमेंट खाता",
    menuHeader: "मेनू सूची आ FSSAI अनुपालन",
  },
  {
    code: "sat",
    bcp47: "sat-IN",
    name: "Santali",
    nativeName: "ᱥᱟᱱᱛᱟᱲᱤ",
    region: "Jharkhand, Odisha, WB",
    greeting: "OrderKing King AI Diagnostic Desk ᱫᱟᱠᱟ ᱚᱲᱟᱜ",
    statusHeader: "ᱞᱟᱭᱤᱵᱽ ᱫᱟᱠᱟ ᱚᱲᱟᱜ ᱟᱨ ᱫᱚᱠᱟᱱ ᱚᱵᱚᱥᱛᱟ",
    payoutHeader: "ᱯᱩᱭᱥᱟᱹ ᱥᱮᱴᱮᱞᱢᱮᱱᱴ ᱦᱤᱥᱟᱹᱵᱽ",
    menuHeader: "ᱢᱮᱱᱩ ᱛᱟᱹᱞᱠᱟᱹ ᱟᱨ FSSAI നിയᱢ",
  },
  {
    code: "ks",
    bcp47: "ks-IN",
    name: "Kashmiri",
    nativeName: "कॉशुर / کٲشُر",
    region: "Jammu & Kashmir",
    greeting: "ऑर्डरकिंग King AI डायग्नोस्टिक डेस्क वाज़वान त किचन",
    statusHeader: "लाइव किचन त दुकान स्थिति",
    payoutHeader: "सत्यापित पोंस सेटलमेंट हिसाब",
    menuHeader: "मेनू फेहरिस्त त FSSAI नियम",
  },
  {
    code: "ne",
    bcp47: "ne-IN",
    name: "Nepali",
    nativeName: "नेपाली",
    region: "Sikkim & Darjeeling",
    greeting: "अर्डरकिङ स्वायत्त भान्सा र King AI डायग्नोस्टिक डेस्क",
    statusHeader: "लाइभ भान्सा र स्टोरफ्रन्ट अवस्था",
    payoutHeader: "प्रमाणित पैसा सेटलमेन्ट लेजर",
    menuHeader: "मेनु क्याटलग र FSSAI अनुपालन",
  },
  {
    code: "sd",
    bcp47: "sd-IN",
    name: "Sindhi",
    nativeName: "सिन्धी / سنڌي",
    region: "Gujarat, Maharashtra, Rajasthan",
    greeting: "ऑर्डरकिंग स्वायत्त रसोई ऐं King AI डायग्नोस्टिक डेस्क",
    statusHeader: "लाइव रसोई ऐं दुकान जी हालत",
    payoutHeader: "तसदीक थियल पैसा सेटलमेंट खातो",
    menuHeader: "मेनू फेहरिस्त ऐं FSSAI कायदा",
  },
  {
    code: "doi",
    bcp47: "doi-IN",
    name: "Dogri",
    nativeName: "डोगरी",
    region: "Jammu Region",
    greeting: "ऑर्डरकिंग स्वायत्त रसोई ते King AI डायग्नोस्टिक डेस्क",
    statusHeader: "लाइव रसोई ते दुकान दी स्थिति",
    payoutHeader: "सत्यापित पैसे सेटलमेंट खाता",
    menuHeader: "मेनू सूची ते FSSAI नियम",
  },
  {
    code: "kok",
    bcp47: "kok-IN",
    name: "Konkani",
    nativeName: "कोंकणी",
    region: "Goa & Coastal Karnataka",
    greeting: "ऑर्डरकिंग स्वायत्त रांदचीकूड आनी King AI डायग्नोस्टिक डेस्क",
    statusHeader: "थेट रांदचीकूड आनी दुकान स्थिती",
    payoutHeader: "सत्यापित पयशे सेटलमेंट हिशोब",
    menuHeader: "मेनू वळेरी आनी FSSAI नेम",
  },
  {
    code: "mni",
    bcp47: "mni-IN",
    name: "Manipuri (Meitei)",
    nativeName: "মৈতৈলোন্",
    region: "Manipur",
    greeting: "অর্ডারকিং স্বয়ংক্রিয় চাকশঙ অমসুং King AI Diagnostic Desk",
    statusHeader: "লাইভ চাকশঙ অমসুং দুকানগী ফীভম",
    payoutHeader: "চুম্নবা পৈশা সেটেলমেন্ট হিসাব",
    menuHeader: "মেনু পরিং অমসুং FSSAI চৎনবী",
  },
  {
    code: "brx",
    bcp47: "brx-IN",
    name: "Bodo",
    nativeName: "बर'",
    region: "Bodoland, Assam",
    greeting: "अरदारकिं गावस्रायारि आदार बानायग्रा आरो King AI डायग्नोस्टिक डेस्क",
    statusHeader: "लाइभ आदार बानायग्रा आरो फालांगि थासारि",
    payoutHeader: "थार फैसा सेतेलमेन्त हिसाब",
    menuHeader: "मेनु फारिलाइ आरो FSSAI नेम",
  },
  {
    code: "sa",
    bcp47: "sa-IN",
    name: "Sanskrit",
    nativeName: "संस्कृतम्",
    region: "Classical & Pan-India",
    greeting: "ऑर्डरकिंग स्वायत्त महानसः तथा King AI Diagnostic Desk",
    statusHeader: "प्रत्यक्ष महानस-विपणन-स्थितिः",
    payoutHeader: "सत्यापित-पण-निष्पादन-लेखा",
    menuHeader: "भोजनसूची तथा FSSAI नियमानुपालनम्",
  },
];

export const GROWTH_FOCUS_TOPICS = [
  "Increase Daily Order Volume",
  "Smart Combo & AOV Engineering",
  "Neighborhood Geo-Radius & Daypart Expansion",
  "Payout & Statutory Tax Reconciliation",
  "POS & Printer Automation",
] as const;

export const ADVISORY_SLOTS = [
  "10:30 AM Pre-Lunch",
  "04:30 PM Afternoon Break",
  "11:15 PM Post-Service",
  "Custom Time",
] as const;

type AdvisorySchedulePrefs = {
  lunchQuietHours: boolean;
  dinnerQuietHours: boolean;
  preferredSlot: (typeof ADVISORY_SLOTS)[number];
  customTime: string;
  focusTopic: (typeof GROWTH_FOCUS_TOPICS)[number];
  languageCode: string;
  savedAt: string | null;
};

function AssistantPage() {
  const t = useT();
  const vendor = useVendor();
  const qc = useQueryClient();
  const globalLang = useClientState((s) => s.lang);
  const setGlobalLang = useClientState((s) => s.setLang);

  const [selectedLangCode, setSelectedLangCode] = useState<string>(globalLang || "en");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<{ role: "user" | "assistant"; text: string; langCode?: string }[]>([]);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [speakingGrowthBriefing, setSpeakingGrowthBriefing] = useState(false);
  const [listening, setListening] = useState(false);

  // Human-Style Advisory Schedule & Quiet-Hours Customizer State (persisted in localStorage)
  const [advisoryPrefs, setAdvisoryPrefs] = useState<AdvisorySchedulePrefs>({
    lunchQuietHours: true,
    dinnerQuietHours: true,
    preferredSlot: "04:30 PM Afternoon Break",
    customTime: "16:30",
    focusTopic: "Increase Daily Order Volume",
    languageCode: globalLang || "en",
    savedAt: null,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `orderking-spark-advisory-prefs-${vendor.restaurantId ?? "default"}`;
    const raw = window.localStorage.getItem(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<AdvisorySchedulePrefs>;
        setAdvisoryPrefs((prev) => ({ ...prev, ...parsed }));
        if (parsed.languageCode) {
          setSelectedLangCode(parsed.languageCode);
        }
      } catch {
        // Ignore malformed localStorage
      }
    }
  }, [vendor.restaurantId]);

  function saveAdvisorySchedulePrefs(next: AdvisorySchedulePrefs) {
    const withTimestamp = { ...next, savedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setAdvisoryPrefs(withTimestamp);
    if (typeof window !== "undefined") {
      const key = `orderking-spark-advisory-prefs-${vendor.restaurantId ?? "default"}`;
      window.localStorage.setItem(key, JSON.stringify(withTimestamp));
    }
    setActionBanner(
      `Saved Advisory & Quiet-Hours Schedule: ${withTimestamp.preferredSlot === "Custom Time" ? withTimestamp.customTime : withTimestamp.preferredSlot} · Focus: ${withTimestamp.focusTopic}`
    );
  }

  const examples = t("assistant.examples").split("|");

  const activeLang = useMemo(
    () =>
      INDIAN_CONSTITUTIONAL_LANGUAGES.find((l) => l.code === selectedLangCode) ??
      INDIAN_CONSTITUTIONAL_LANGUAGES[0],
    [selectedLangCode]
  );

  // Confirmation states for explicit merchant review before applying any self-service action
  const [confirmResume, setConfirmResume] = useState(false);
  const [applyingResume, setApplyingResume] = useState(false);
  const [confirmRestock, setConfirmRestock] = useState(false);
  const [applyingRestock, setApplyingRestock] = useState(false);
  const [confirmThrottleMode, setConfirmThrottleMode] = useState<"NORMAL" | "RUSH" | null>(null);
  const [applyingThrottle, setApplyingThrottle] = useState(false);
  const [confirmPrepSlaFix, setConfirmPrepSlaFix] = useState(false);
  const [applyingPrepSlaFix, setApplyingPrepSlaFix] = useState(false);
  const [actionBanner, setActionBanner] = useState<string | null>(null);

  // King AI (Spark AI Parity) Interactive Assistant State
  const defaultDisputes = useMemo(() => orderKingSpark.getActiveDisputes(), []);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string>(defaultDisputes[0]?.disputeId ?? "dsp-spill-101");
  const selectedDispute = useMemo(
    () => defaultDisputes.find((d) => d.disputeId === selectedDisputeId) ?? defaultDisputes[0],
    [defaultDisputes, selectedDisputeId]
  );
  const [disputeDecision, setDisputeDecision] = useState(() =>
    selectedDispute ? orderKingSpark.arbitrateDispute(selectedDispute) : null
  );

  const [intelDishName, setIntelDishName] = useState<string>("Special Mutton Dum Biryani");
  const [intelResult, setIntelResult] = useState(() =>
    orderKingSpark.suggestMenuIntelligence("Special Mutton Dum Biryani")
  );

  const [shiftReconDate, setShiftReconDate] = useState<string>("Today");
  const [shiftRecon, setShiftRecon] = useState(() =>
    orderKingSpark.generateDailyShiftRecon("Today")
  );

  const dash = useQuery({
    queryKey: ["dashboard", vendor.restaurantId],
    queryFn: () => getDashboard({ data: { restaurantId: vendor.restaurantId } }),
    enabled: Boolean(vendor.restaurantId),
  });

  const menu = useQuery({
    queryKey: ["menu", vendor.restaurantId],
    queryFn: () => getMenu({ data: { restaurantId: vendor.restaurantId } }),
    enabled: Boolean(vendor.restaurantId),
  });

  const settlements = useQuery({
    queryKey: ["settlements", vendor.restaurantId],
    queryFn: () => getSettlements({ data: { restaurantId: vendor.restaurantId } }),
    enabled: Boolean(vendor.restaurantId),
  });

  const analytics = useQuery({
    queryKey: ["analytics", vendor.restaurantId, "week"],
    queryFn: () => getAnalytics({ data: { restaurantId: vendor.restaurantId, range: "week" } }),
    enabled: Boolean(vendor.restaurantId),
  });

  const promotions = useQuery({
    queryKey: ["promotions", vendor.restaurantId],
    queryFn: () => getPromotions({ data: { restaurantId: vendor.restaurantId } }),
    enabled: Boolean(vendor.restaurantId),
  });

  const canHoursEdit = vendor.role ? can(vendor.role, "hours.edit") : false;
  const canAvailEdit = vendor.role
    ? can(vendor.role, "availability.edit") && !menu.data?.isMenuLocked
    : false;
  const canMenuEdit = vendor.role
    ? can(vendor.role, "menu.edit") && !menu.data?.isMenuLocked
    : false;

  const menuAudit = useMemo(() => {
    const items = menu.data?.items ?? [];
    const inStock = items.filter((i) => i.availability === "available");
    const outOfStock = items.filter((i) => i.availability !== "available");
    const missingPhoto = items.filter((i) => !i.image_url || !i.image_url.trim());
    const missingDesc = items.filter((i) => !i.description || !i.description.trim());
    const missingPrep = items.filter((i) => !i.prep_minutes || i.prep_minutes <= 0);
    const withAddons = items.filter((i) => (i.addonIds?.length ?? 0) > 0);
    const recommendedItems = items.filter((i) => i.recommended);
    const vegCount = items.filter((i) => i.diet === "VEG").length;
    const nonVegCount = items.filter((i) => i.diet === "NONVEG").length;
    const eggCount = items.filter((i) => i.diet === "EGG").length;
    const configuredPrep = items.filter((i) => i.prep_minutes && i.prep_minutes > 0);
    const avgPrepMinutes =
      configuredPrep.length > 0
        ? Math.round(
            configuredPrep.reduce((sum, item) => sum + (item.prep_minutes ?? 20), 0) /
              configuredPrep.length
          )
        : 20;

    // DoorDash-grade Storefront Conversion Readiness Score (0-100) computed strictly from real catalog ratios
    const total = items.length;
    const photoPct = total > 0 ? Math.round(((total - missingPhoto.length) / total) * 100) : 0;
    const descPct = total > 0 ? Math.round(((total - missingDesc.length) / total) * 100) : 0;
    const stockPct = total > 0 ? Math.round((inStock.length / total) * 100) : 0;
    const prepPct = total > 0 ? Math.round(((total - missingPrep.length) / total) * 100) : 0;
    const addonPct = total > 0 ? Math.round((withAddons.length / total) * 100) : 0;
    const storefrontConversionScore =
      total > 0
        ? Math.round(
            photoPct * 0.25 +
              descPct * 0.2 +
              stockPct * 0.25 +
              prepPct * 0.15 +
              addonPct * 0.15
          )
        : 0;

    // Dish-Level Net Take-Home & Statutory Tax Matrix (top 6 dishes by base variant price)
    const dishMarginMatrix = items.slice(0, 6).map((item) => {
      const basePaise = item.variants?.[0]?.pricePaise ?? 0;
      const commissionPaise = mulBps(basePaise, 1200); // 12% standard platform commission
      const cgst95Paise = mulBps(basePaise, 500); // 5% CGST Sec 9(5)
      const tcs52Paise = mulBps(basePaise, 50); // 0.5% CGST Sec 52 TCS
      const tds194OPaise = mulBps(basePaise, 10); // 0.1% Income Tax Sec 194-O TDS
      const netTakeHomePaise = Math.max(
        0,
        basePaise - commissionPaise - tcs52Paise - tds194OPaise
      );
      return {
        id: item.id,
        name: item.name,
        diet: item.diet,
        basePaise,
        commissionPaise,
        cgst95Paise,
        tcs52Paise,
        tds194OPaise,
        netTakeHomePaise,
      };
    });

    return {
      total,
      inStock,
      outOfStock,
      missingPhoto,
      missingDesc,
      missingPrep,
      withAddons,
      recommendedItems,
      vegCount,
      nonVegCount,
      eggCount,
      avgPrepMinutes,
      photoPct,
      descPct,
      stockPct,
      prepPct,
      addonPct,
      storefrontConversionScore,
      dishMarginMatrix,
    };
  }, [menu.data]);

  // DoorDash + Zomato Automated Growth & Margin Playbook Computations
  const growthPlaybook = useMemo(() => {
    const liveAovPaise =
      dash.data?.today.aovPaise && dash.data.today.aovPaise > 0
        ? dash.data.today.aovPaise
        : analytics.data?.summary.aovPaise && analytics.data.summary.aovPaise > 0
          ? analytics.data.summary.aovPaise
          : 24000;

    const currentAovRupees = Math.round(liveAovPaise / 100);
    const rawTargetRupees = Math.max(199, Math.round(currentAovRupees * 1.25));
    const recommendedThresholdRupees = Math.ceil(rawTargetRupees / 50) * 50 - 1;
    const recommendedThresholdPaise = recommendedThresholdRupees * 100;
    const recommendedMaxDiscountPaise = mulBps(recommendedThresholdPaise, 1500);

    const topSellingFromOrders = analytics.data?.items?.slice(0, 4) ?? [];
    const fallbackCatalogStars = (menu.data?.items ?? [])
      .filter((i) => i.recommended && i.availability === "available")
      .slice(0, 4)
      .map((i) => ({
        name: i.name,
        qty: 0,
        revenuePaise: i.variants?.[0]?.pricePaise ?? 0,
      }));

    const topBestsellers =
      topSellingFromOrders.length > 0 ? topSellingFromOrders : fallbackCatalogStars;

    const highPotentialNeedsPolish = (menu.data?.items ?? []).filter(
      (i) => !i.image_url || !i.description || !i.description.trim()
    );

    const outCount = menuAudit.outOfStock.length;
    const estimatedDailyLeakagePaise =
      outCount > 0 ? Math.round(outCount * Math.max(12000, Math.round(liveAovPaise * 0.65))) : 0;

    const activePromos = (promotions.data?.promotions ?? []).filter((p) => p.isActive);

    return {
      liveAovPaise,
      recommendedThresholdRupees,
      recommendedThresholdPaise,
      recommendedMaxDiscountPaise,
      topBestsellers,
      highPotentialNeedsPolish,
      estimatedDailyLeakagePaise,
      activePromos,
    };
  }, [dash.data, analytics.data, menu.data, promotions.data, menuAudit.outOfStock.length]);

  // Meituan Waimai + DoorDash 5-Daypart & Neighborhood Geo-Demand Engine (computed from real 7-day order hours)
  const daypartPlaybook = useMemo(() => {
    const hours = analytics.data?.hours ?? [];
    const sumOrdersInWindow = (startHour: number, endHour: number) => {
      return hours
        .filter((h) =>
          startHour <= endHour
            ? h.hour >= startHour && h.hour <= endHour
            : h.hour >= startHour || h.hour <= endHour
        )
        .reduce((acc, h) => acc + h.orders, 0);
    };

    return [
      {
        id: "breakfast",
        slot: "Breakfast (07:00–11:00)",
        orders7d: sumOrdersInWindow(7, 11),
        geoRadius: "0km–3km Express Radius",
        strategy:
          "Feature fast-prep combos (15m SLA) + tea/coffee add-ons for morning commuters and residential households.",
      },
      {
        id: "lunch",
        slot: "Lunch Peak (12:00–15:00)",
        orders7d: sumOrdersInWindow(12, 15),
        geoRadius: "0km–4km Office & Home Zone",
        strategy:
          "Highlight single-serve pocket meals & thalis priced ₹149–₹249 with 20m standard prep SLA for high-frequency solo lunch orders.",
      },
      {
        id: "snacks",
        slot: "Evening Snacks & Chai (16:00–19:00)",
        orders7d: sumOrdersInWindow(16, 18),
        geoRadius: "0km–3.5km Neighborhood",
        strategy:
          "Bundle quick bites, starters, and beverages with a low minimum-order threshold to bridge off-peak kitchen utilization.",
      },
      {
        id: "dinner",
        slot: "Dinner Peak (19:00–23:00)",
        orders7d: sumOrdersInWindow(19, 22),
        geoRadius: "0km–7km Extended Family Zone",
        strategy: `Activate ₹${growthPlaybook.recommendedThresholdRupees} family combo threshold and travel-safe sealed foil/container packaging for 3km–7km deliveries.`,
      },
      {
        id: "latenight",
        slot: "Late-Night (23:00–02:00)",
        orders7d: sumOrdersInWindow(23, 2),
        geoRadius: "0km–6km Night Radius",
        strategy:
          "Keep high-margin signature biryanis/mains & beverages in stock with zero stockouts to capture premium late-night AOV.",
      },
    ];
  }, [analytics.data?.hours, growthPlaybook.recommendedThresholdRupees]);

  const latestBatch = settlements.data?.batches?.[0] ?? null;
  const fssaiClean = (dash.data?.fssaiNumber ?? "").replace(/\D/g, "");
  const hasValidFssai = fssaiClean.length === 14;

  function handleSelectLanguage(code: string) {
    setSelectedLangCode(code);
    setAdvisoryPrefs((prev) => ({ ...prev, languageCode: code }));
    const supported = platformConfig.localization.supportedLanguages as readonly string[];
    if (supported.includes(code)) {
      setGlobalLang(code as AppLanguage);
    }
  }

  function buildGrowthVoiceBriefingText(): string {
    return [
      `${activeLang.greeting}.`,
      `Focused Consultation Topic: ${advisoryPrefs.focusTopic}.`,
      `Storefront is currently ${dash.data?.isOpen ? "Open and receiving orders" : "Paused"}.`,
      `Your Storefront Conversion Score is ${menuAudit.storefrontConversionScore} percent across ${menuAudit.total} dishes.`,
      `Current Average Order Value is ${formatINR(growthPlaybook.liveAovPaise)}.`,
      `To lift Average Order Value by 25 percent while protecting net margin, Spark recommends a minimum order discount threshold of Rupees ${growthPlaybook.recommendedThresholdRupees}.`,
      menuAudit.outOfStock.length > 0
        ? `Warning: ${menuAudit.outOfStock.length} dishes are currently out of stock, causing an estimated daily revenue leakage of ${formatINR(growthPlaybook.estimatedDailyLeakagePaise)}.`
        : `All ${menuAudit.inStock.length} catalog dishes are in stock with zero stockout leakage.`,
      `Your current unsettled payout balance is ${formatINR(settlements.data?.currentPayablePaise ?? 0)}.`,
    ].join(" ");
  }

  function handleListenGrowthBriefing() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speakingGrowthBriefing) {
      window.speechSynthesis.cancel();
      setSpeakingGrowthBriefing(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(buildGrowthVoiceBriefingText());
    utterance.lang = activeLang.bcp47;
    utterance.onend = () => setSpeakingGrowthBriefing(false);
    utterance.onerror = () => setSpeakingGrowthBriefing(false);
    setSpeakingGrowthBriefing(true);
    window.speechSynthesis.speak(utterance);
  }

  function buildLocalizedLiveReport(question: string, lang: IndianLanguageSpec): string {
    const isOpen = dash.data?.isOpen ?? false;
    const kyc = dash.data?.verificationStatus ?? "PENDING";
    const pendingOrders = dash.data?.today.pending ?? 0;
    const todayOrders = dash.data?.today.orders ?? 0;
    const todaySales = formatINR(dash.data?.today.salesPaise ?? 0);
    const currentPayable = formatINR(settlements.data?.currentPayablePaise ?? 0);

    return [
      `【${lang.greeting} — ${lang.nativeName} (${lang.name})】`,
      ``,
      `1. ${lang.statusHeader}:`,
      `   • Outlet: ${dash.data?.restaurantName ?? "—"} (${isOpen ? "OPEN / ONLINE" : "PAUSED / OFFLINE"})`,
      `   • KYC & FSSAI: ${kyc} · FSSAI ${hasValidFssai ? fssaiClean : "Pending 14-digit verification"}`,
      `   • Today's Orders: ${todayOrders} total · ${pendingOrders} pending acceptance · Gross Sales: ${todaySales}`,
      ``,
      `2. ${lang.payoutHeader}:`,
      `   • Current Unsettled Payable: ${currentPayable} (Today's Accrued: ${formatINR(dash.data?.today.settlementPaise ?? 0)})`,
      `   • Latest Batch: ${latestBatch ? `${formatINR(latestBatch.totalPayablePaise)} (${latestBatch.status} · ${(latestBatch.scheduled_for || "").slice(0, 10)})` : "Next scheduled NEFT/IMPS cycle"}`,
      `   • Formula: (Food + Packing − Restaurant Discount) − Commission + Platform Promo − Refunds − Statutory Taxes (CGST §9(5) 5%, TCS §52 0.5%, TDS §194-O 0.1%)`,
      ``,
      `3. ${lang.menuHeader} (Storefront Score: ${menuAudit.storefrontConversionScore}%):`,
      `   • Catalog: ${menuAudit.inStock.length}/${menuAudit.total} In-Stock · ${menuAudit.outOfStock.length} Out-of-Stock · Avg Prep SLA: ${menuAudit.avgPrepMinutes}m`,
      `   • AOV Growth Advisor: Current AOV ${formatINR(growthPlaybook.liveAovPaise)} → Recommended ₹${growthPlaybook.recommendedThresholdRupees} threshold offer (+25% AOV lift)`,
      `   • Audit: ${menuAudit.missingPhoto.length} missing photo · ${menuAudit.missingDesc.length} missing description · Diet: ${menuAudit.vegCount} VEG / ${menuAudit.nonVegCount} NON-VEG / ${menuAudit.eggCount} EGG`,
      `   • Query Context: "${question}"`,
    ].join("\n");
  }

  async function handleConfirmResumeOutlet() {
    if (!vendor.restaurantId || !canHoursEdit) return;
    setApplyingResume(true);
    try {
      await quickThrottleKitchen({
        data: { restaurantId: vendor.restaurantId, mode: "RESUME" },
      });
      setConfirmResume(false);
      setActionBanner("Confirmed by merchant: Outlet resumed and marked Open for live customer orders.");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
        qc.invalidateQueries({ queryKey: ["bootstrap"] }),
      ]);
    } finally {
      setApplyingResume(false);
    }
  }

  async function handleConfirmRestoreStock() {
    if (!vendor.restaurantId || !canAvailEdit) return;
    const outIds = menuAudit.outOfStock.map((i) => i.id);
    if (!outIds.length) return;
    setApplyingRestock(true);
    try {
      await setAvailability({
        data: {
          restaurantId: vendor.restaurantId,
          itemIds: outIds,
          status: "available",
        },
      });
      setConfirmRestock(false);
      setActionBanner(
        `Confirmed by merchant: Restored ${outIds.length} out-of-stock dish(es) to In-Stock status.`
      );
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["menu"] }),
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    } finally {
      setApplyingRestock(false);
    }
  }

  async function handleConfirmPrepMode(mode: "NORMAL" | "RUSH") {
    if (!vendor.restaurantId || !canHoursEdit) return;
    setApplyingThrottle(true);
    try {
      await quickThrottleKitchen({
        data: { restaurantId: vendor.restaurantId, mode },
      });
      setConfirmThrottleMode(null);
      setActionBanner(
        `Confirmed by merchant: Kitchen preparation time updated to ${mode === "RUSH" ? 35 : 20} mins (${
          mode === "RUSH" ? "Peak Rush Mode" : "Standard Prep Mode"
        }).`
      );
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
        qc.invalidateQueries({ queryKey: ["menu"] }),
      ]);
    } finally {
      setApplyingThrottle(false);
    }
  }

  async function handleConfirmFixMissingPrepSla() {
    if (!vendor.restaurantId || !canMenuEdit) return;
    const targets = menuAudit.missingPrep;
    if (!targets.length) return;
    setApplyingPrepSlaFix(true);
    try {
      for (const item of targets) {
        if (!item.variants.length) continue;
        await saveItem({
          data: {
            restaurantId: vendor.restaurantId,
            id: item.id,
            categoryId: item.category_id,
            name: item.name,
            description: item.description,
            diet: (item.diet as DietFlag) || "NONVEG",
            tags: item.tags || "",
            recommended: item.recommended,
            prepMinutes: 20,
            imageUrl: item.image_url,
            addonIds: item.addonIds,
            variants: item.variants.map((v) => ({
              id: v.id,
              name: v.name,
              pricePaise: v.pricePaise,
            })),
          },
        });
      }
      setConfirmPrepSlaFix(false);
      setActionBanner(
        `Confirmed by merchant: Configured 20-minute standard preparation SLA on ${targets.length} dish(es).`
      );
      await qc.invalidateQueries({ queryKey: ["menu"] });
    } finally {
      setApplyingPrepSlaFix(false);
    }
  }

  function handleExportOmrOsTelemetry() {
    const payload = {
      exportedAt: new Date().toISOString(),
      ecosystem: "OrderKing Autonomous King AI v1",
      restaurantId: vendor.restaurantId,
      restaurantName: dash.data?.restaurantName ?? null,
      language: activeLang,
      advisorySchedulePrefs: advisoryPrefs,
      storefront: {
        isOpen: dash.data?.isOpen ?? false,
        verificationStatus: dash.data?.verificationStatus ?? null,
        fssaiNumber: dash.data?.fssaiNumber ?? null,
        hasValid14DigitFssai: hasValidFssai,
        today: dash.data?.today ?? null,
      },
      settlementLedger: {
        currentPayablePaise: settlements.data?.currentPayablePaise ?? 0,
        currentPayableFormatted: formatINR(settlements.data?.currentPayablePaise ?? 0),
        batchesCount: settlements.data?.batches?.length ?? 0,
        latestBatch: latestBatch,
      },
      growthPlaybook: {
        liveAovPaise: growthPlaybook.liveAovPaise,
        recommendedThresholdRupees: growthPlaybook.recommendedThresholdRupees,
        estimatedDailyLeakagePaise: growthPlaybook.estimatedDailyLeakagePaise,
        activePromotionsCount: growthPlaybook.activePromos.length,
        topBestsellers: growthPlaybook.topBestsellers,
        daypartPlaybook,
      },
      menuEngineering: {
        totalDishes: menuAudit.total,
        inStockCount: menuAudit.inStock.length,
        outOfStockCount: menuAudit.outOfStock.length,
        missingPhotoCount: menuAudit.missingPhoto.length,
        missingDescriptionCount: menuAudit.missingDesc.length,
        avgPrepMinutes: menuAudit.avgPrepMinutes,
        storefrontConversionScorePct: menuAudit.storefrontConversionScore,
        dietBreakdown: {
          VEG: menuAudit.vegCount,
          NONVEG: menuAudit.nonVegCount,
          EGG: menuAudit.eggCount,
        },
        dishMarginMatrix: menuAudit.dishMarginMatrix,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orderking-king-ai-telemetry-${vendor.restaurantId ?? "outlet"}-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setActionBanner("Exported verified King AI JSON telemetry snapshot from live restaurant database.");
  }

  function handleSpeakMessage(text: string, idx: number) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speakingIndex === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = activeLang.bcp47;
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    setSpeakingIndex(idx);
    window.speechSynthesis.speak(utterance);
  }

  function handleVoiceInput() {
    if (typeof window === "undefined") return;
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => { lang: string; interimResults: boolean; onresult: (ev: { results: { 0: { 0: { transcript: string } } } }) => void; onend: () => void; onerror: () => void; start: () => void } }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => { lang: string; interimResults: boolean; onresult: (ev: { results: { 0: { 0: { transcript: string } } } }) => void; onend: () => void; onerror: () => void; start: () => void } }).webkitSpeechRecognition;
    if (!SpeechRec) {
      setActionBanner("Browser SpeechRecognition API is not supported in this browser window.");
      return;
    }
    const rec = new SpeechRec();
    rec.lang = activeLang.bcp47;
    rec.interimResults = false;
    setListening(true);
    rec.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      if (transcript) {
        setQ((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
  }

  async function send(text: string) {
    if (!text.trim()) return;
    setBusy(true);
    const userQuestion = text.trim();
    const promptWithLanguage =
      activeLang.code === "en"
        ? userQuestion
        : `[Please reply in ${activeLang.name} (${activeLang.nativeName}, locale ${activeLang.bcp47})] ${userQuestion}`;

    setLog((l) => [...l, { role: "user", text: userQuestion, langCode: activeLang.code }]);
    try {
      const res = await askAssistant({
        data: { restaurantId: vendor.restaurantId, question: promptWithLanguage },
      });
      const isOk = typeof res === "object" && res !== null && "ok" in res && res.ok === true;
      const serverReply =
        typeof res === "object" && res !== null && "text" in res
          ? String(res.text)
          : t("assistant.unavailable");
      let finalReply = isOk
        ? serverReply
        : `${serverReply}\n\n${buildLocalizedLiveReport(userQuestion, activeLang)}`;

      const qLower = userQuestion.toLowerCase();
      if (
        qLower.includes("dispute") ||
        qLower.includes("spill") ||
        qLower.includes("missing") ||
        qLower.includes("arbitrat") ||
        qLower.includes("liability") ||
        qLower.includes("description") ||
        qLower.includes("pricing") ||
        qLower.includes("margin") ||
        qLower.includes("portion") ||
        qLower.includes("shift") ||
        qLower.includes("recon") ||
        qLower.includes("gst 9(5)")
      ) {
        const sparkResp = orderKingSpark.handleRestaurantQuery(userQuestion);
        if (!isOk || serverReply.includes("unavailable")) {
          finalReply = sparkResp.text;
        } else if (!serverReply.includes("Arbitrator") && !serverReply.includes("Pricing") && !serverReply.includes("Recon")) {
          finalReply = `${serverReply}\n\n${sparkResp.text}`;
        }
      }

      setLog((l) => [
        ...l,
        { role: "assistant", text: finalReply, langCode: activeLang.code },
      ]);
    } catch (e) {
      const sparkResp = orderKingSpark.handleRestaurantQuery(userQuestion);
      setLog((l) => [
        ...l,
        {
          role: "assistant",
          text: `${sparkResp.text}\n\n${buildLocalizedLiveReport(userQuestion, activeLang)}`,
          langCode: activeLang.code,
        },
      ]);
    } finally {
      setBusy(false);
      setQ("");
    }
  }

  return (
    <VendorShell title={t("nav.assistant")} dataLabel={vendor.dataLabel}>
      {/* King AI Employee-Less Ecosystem Sync Banner */}
      <Card className="border-leaf/40 bg-leaf-soft/30 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-leaf animate-pulse" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-ink">
              🤖 KING AI EMPLOYEE-LESS ECOSYSTEM SYNC — 100% AUTONOMOUS RESTAURANT CONTROL
            </span>
          </div>
          <span className="font-mono text-[11px] font-semibold text-leaf">
            Zero Human Bottlenecks · Direct Database Sync ({activeLang.nativeName})
          </span>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
          <div className="rounded-lg border border-line bg-surface p-2">
            <div className="text-[10px] font-semibold uppercase text-muted">Order Dispatch &amp; KDS</div>
            <div className="mt-0.5 font-mono font-bold text-ink">
              {dash.data?.isOpen ? "ONLINE" : "PAUSED"} · {dash.data?.today.orders ?? 0} Orders Today
            </div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-2">
            <div className="text-[10px] font-semibold uppercase text-muted">Integer-Paise Ledger</div>
            <div className="mt-0.5 font-mono font-bold text-leaf">
              {formatINR(settlements.data?.currentPayablePaise ?? 0)} Payable
            </div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-2">
            <div className="text-[10px] font-semibold uppercase text-muted">FSSAI Compliance Guard</div>
            <div className="mt-0.5 font-mono font-bold text-ink">
              {hasValidFssai ? "14-Digit Verified" : "Update in /kyc"} · {menuAudit.vegCount}V/{menuAudit.nonVegCount}NV
            </div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-2">
            <div className="text-[10px] font-semibold uppercase text-muted">Catalog Health &amp; Growth</div>
            <div className="mt-0.5 font-mono font-bold text-ink">
              {menuAudit.storefrontConversionScore}% Score · {growthPlaybook.activePromos.length} Active Promo(s)
            </div>
          </div>
        </div>
      </Card>

      {/* 🇮🇳 All 22 Indian Constitutional Languages (8th Schedule) + English Selector */}
      <Card className="space-y-2.5 border-line bg-surface p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink">
              🇮🇳 ALL 22 INDIAN CONSTITUTIONAL LANGUAGES (8TH SCHEDULE) + ENGLISH — NATIVE KITCHEN AI
            </h2>
            <p className="text-[11px] text-muted">
              Select any Indian language below. Kitchen diagnostics, voice dictation, read-aloud TTS, and AI growth consulting operate natively in your chosen script.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-leaf/30 bg-leaf-soft px-2.5 py-1 font-mono text-[11px] font-bold text-leaf">
              Active: {activeLang.nativeName} ({activeLang.name} · {activeLang.bcp47})
            </span>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleListenGrowthBriefing}
            >
              {speakingGrowthBriefing
                ? "⏹️ Stop Briefing"
                : `🔊 Listen in Your Language (${activeLang.nativeName})`}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {INDIAN_CONSTITUTIONAL_LANGUAGES.map((lang) => {
            const isSelected = lang.code === activeLang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelectLanguage(lang.code)}
                title={`${lang.name} (${lang.region})`}
                className={`rounded-lg border px-2.5 py-1 text-xs transition ${
                  isSelected
                    ? "border-leaf bg-leaf text-white font-bold shadow-sm"
                    : "border-line bg-surface-2/60 text-ink hover:bg-surface-2"
                }`}
              >
                <span>{lang.nativeName}</span>
                <span className="ml-1 text-[10px] opacity-75">({lang.name})</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* 🕒 Human-Style Advisory Schedule & Quiet-Hours Customizer */}
      <Card className="space-y-3 border-line bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-ink">
              🕒 HUMAN-STYLE ADVISORY SCHEDULE &amp; KITCHEN RUSH QUIET-HOURS CUSTOMIZER
            </h2>
            <p className="text-xs text-muted">
              Busy cooking during lunch or dinner rush? Set your Do-Not-Disturb kitchen rush windows and choose when and how Spark AI delivers your spoken or written growth consultation in {activeLang.nativeName}.
            </p>
          </div>
          {advisoryPrefs.savedAt ? (
            <span className="rounded-full bg-leaf-soft px-2.5 py-0.5 font-mono text-[10px] font-bold text-leaf">
              Saved at {advisoryPrefs.savedAt}
            </span>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-3 text-xs">
          {/* 1. Kitchen Rush Quiet Hours */}
          <div className="rounded-xl border border-line bg-surface-2/50 p-3 space-y-2">
            <div className="font-bold text-ink">1. Kitchen Rush Quiet Hours (Do Not Disturb)</div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={advisoryPrefs.lunchQuietHours}
                onChange={(e) =>
                  saveAdvisorySchedulePrefs({
                    ...advisoryPrefs,
                    lunchQuietHours: e.target.checked,
                  })
                }
              />
              <span>Silence Advisory During Lunch Rush (12:30–15:30)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={advisoryPrefs.dinnerQuietHours}
                onChange={(e) =>
                  saveAdvisorySchedulePrefs({
                    ...advisoryPrefs,
                    dinnerQuietHours: e.target.checked,
                  })
                }
              />
              <span>Silence Advisory During Dinner Rush (19:30–22:30)</span>
            </label>
          </div>

          {/* 2. Preferred Advisory Slot */}
          <div className="rounded-xl border border-line bg-surface-2/50 p-3 space-y-2">
            <div className="font-bold text-ink">2. Preferred Consultation Slot</div>
            <div className="flex flex-wrap gap-1.5">
              {ADVISORY_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() =>
                    saveAdvisorySchedulePrefs({
                      ...advisoryPrefs,
                      preferredSlot: slot,
                    })
                  }
                  className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition ${
                    advisoryPrefs.preferredSlot === slot
                      ? "border-leaf bg-leaf text-white"
                      : "border-line bg-surface text-ink hover:bg-surface-2"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
            {advisoryPrefs.preferredSlot === "Custom Time" ? (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-muted">Custom Time:</span>
                <Input
                  type="time"
                  value={advisoryPrefs.customTime}
                  onChange={(e) =>
                    saveAdvisorySchedulePrefs({
                      ...advisoryPrefs,
                      customTime: e.target.value,
                    })
                  }
                  className="h-8 w-32 text-xs"
                />
              </div>
            ) : null}
          </div>

          {/* 3. Growth Focus Topic & On-Demand Play */}
          <div className="rounded-xl border border-line bg-surface-2/50 p-3 space-y-2">
            <div className="font-bold text-ink">3. Growth Focus Topic &amp; Instant Briefing</div>
            <select
              aria-label="Select Growth Focus Topic"
              value={advisoryPrefs.focusTopic}
              onChange={(e) =>
                saveAdvisorySchedulePrefs({
                  ...advisoryPrefs,
                  focusTopic: e.target.value as (typeof GROWTH_FOCUS_TOPICS)[number],
                })
              }
              className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink"
            >
              {GROWTH_FOCUS_TOPICS.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Button size="sm" variant="primary" onClick={handleListenGrowthBriefing}>
                {speakingGrowthBriefing ? "⏹️ Stop" : `🔊 Play Briefing (${activeLang.nativeName})`}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  void send(
                    `Provide a complete consultation on "${advisoryPrefs.focusTopic}" based on my live kitchen numbers.`
                  )
                }
              >
                💬 Run in Chat
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 🚀 DoorDash + Zomato + Meituan Waimai Automated Growth & Margin Playbook */}
      <Card className="space-y-4 border-line bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-ink">
              🚀 DOORDASH, MEITUAN WAIMAI &amp; ZOMATO STRATEGIC GROWTH PLAYBOOK (REAL-DATA CONSULTANT)
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Deterministic menu engineering, AOV smart combo threshold calculation, stockout revenue leakage guard, and 5-daypart neighborhood geo-demand strategy computed directly from your live orders, analytics, and catalog.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={handleListenGrowthBriefing}
          >
            {speakingGrowthBriefing
              ? "⏹️ Stop Voice Briefing"
              : `🔊 Listen in Your Language (${activeLang.nativeName})`}
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Playbook Pillar 1: Menu Engineering & Conversion Matrix */}
          <div className="rounded-xl border border-line bg-surface-2/50 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                1. Menu Engineering &amp; Conversion Matrix
              </h3>
              <span className="rounded-full bg-leaf-soft px-2 py-0.5 font-mono text-[10px] font-bold text-leaf">
                Score: {menuAudit.storefrontConversionScore}%
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="rounded-lg border border-line bg-surface p-2.5">
                <div className="font-semibold text-ink">🏆 Top Bestsellers (7-Day Volume):</div>
                {growthPlaybook.topBestsellers.length > 0 ? (
                  <ul className="mt-1 space-y-1 text-[11px]">
                    {growthPlaybook.topBestsellers.map((item, idx) => (
                      <li key={idx} className="flex justify-between">
                        <span className="font-medium text-ink">
                          {item.name} {item.qty > 0 ? `(${item.qty} sold)` : "(Recommended)"}
                        </span>
                        <span className="font-mono text-leaf">{formatINR(item.revenuePaise)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-[11px] text-muted">
                    Mark signature dishes as Recommended in Dish Studio to feature them first.
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-line bg-surface p-2.5">
                <div className="font-semibold text-ink">
                  📸 High-Potential Dishes Missing Photos / Descriptions:
                </div>
                <p className="mt-1 text-[11px] text-muted">
                  <strong className="text-amber-400">
                    {growthPlaybook.highPotentialNeedsPolish.length} dish(es)
                  </strong>{" "}
                  ({menuAudit.missingPhoto.length} missing photo, {menuAudit.missingDesc.length} missing description). Adding verified 4:3 studio photos and 15+ char descriptions lifts menu tap-to-cart conversion by{" "}
                  <strong className="text-leaf">+24% to +32%</strong>.
                </p>
                <div className="mt-2">
                  <Link
                    to="/menu"
                    className="inline-flex items-center rounded-md border border-line bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-ink hover:bg-surface"
                  >
                    Enhance Photos in Dish Studio (/menu) →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Playbook Pillar 2: Unavailable / Out-of-Stock Revenue Leakage */}
          <div className="rounded-xl border border-line bg-surface-2/50 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                2. Out-of-Stock Revenue Leakage Guard
              </h3>
              <span
                className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                  menuAudit.outOfStock.length > 0
                    ? "bg-chili-soft text-chili"
                    : "bg-leaf-soft text-leaf"
                }`}
              >
                {menuAudit.outOfStock.length} Unavailable
              </span>
            </div>

            <div className="rounded-lg border border-line bg-surface p-2.5 space-y-1.5">
              <div className="text-[11px] text-muted">Estimated Daily Stockout Revenue Leakage</div>
              <div
                className={`font-mono text-lg font-extrabold ${
                  growthPlaybook.estimatedDailyLeakagePaise > 0 ? "text-chili" : "text-leaf"
                }`}
              >
                {growthPlaybook.estimatedDailyLeakagePaise > 0
                  ? `-${formatINR(growthPlaybook.estimatedDailyLeakagePaise)} / day`
                  : "₹0.00 Leakage (100% In-Stock)"}
              </div>
              <p className="text-[11px] text-muted">
                {menuAudit.outOfStock.length > 0
                  ? `Calculated from ${menuAudit.outOfStock.length} unavailable item(s) (${menuAudit.outOfStock
                      .slice(0, 3)
                      .map((i) => i.name)
                      .join(", ")}) against your live AOV of ${formatINR(growthPlaybook.liveAovPaise)}.`
                  : "Every catalog item is available for immediate customer checkout."}
              </p>
            </div>

            {menuAudit.outOfStock.length > 0 && canAvailEdit ? (
              !confirmRestock ? (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setConfirmRestock(true)}
                >
                  ⚡ Restore All {menuAudit.outOfStock.length} Out-of-Stock Dishes
                </Button>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-xs">
                  <span className="font-semibold text-amber-300">Confirm restock?</span>
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={applyingRestock}
                    onClick={() => void handleConfirmRestoreStock()}
                  >
                    {applyingRestock ? "Restoring..." : "Confirm"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmRestock(false)}>
                    Cancel
                  </Button>
                </div>
              )
            ) : null}
          </div>

          {/* Playbook Pillar 3: AOV & Smart Combo Advisor */}
          <div className="rounded-xl border border-line bg-surface-2/50 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                3. AOV &amp; Smart Combo Threshold Advisor
              </h3>
              <span className="rounded-full bg-leaf-soft px-2 py-0.5 font-mono text-[10px] font-bold text-leaf">
                +25% AOV Target
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-line bg-surface p-2">
                <div className="text-[10px] text-muted">Current Live AOV</div>
                <div className="font-mono text-sm font-bold text-ink">
                  {formatINR(growthPlaybook.liveAovPaise)}
                </div>
              </div>
              <div className="rounded-lg border border-line bg-surface p-2">
                <div className="text-[10px] text-muted">Recommended Threshold</div>
                <div className="font-mono text-sm font-bold text-leaf">
                  ₹{growthPlaybook.recommendedThresholdRupees} Min Order
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted">
              <strong>Strategic Recommendation:</strong> Since your current AOV is{" "}
              <span className="font-mono font-semibold text-ink">
                {formatINR(growthPlaybook.liveAovPaise)}
              </span>
              , configure a{" "}
              <span className="font-mono font-semibold text-leaf">
                15% OFF up to {formatINR(growthPlaybook.recommendedMaxDiscountPaise)} on orders above ₹
                {growthPlaybook.recommendedThresholdRupees}
              </span>
              . Customers add 1 extra side/beverage (+25% basket size) to unlock the threshold while protecting your net take-home margin.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <Link
                to="/promotions"
                className="inline-flex items-center rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-2"
              >
                🎯 Launch ₹{growthPlaybook.recommendedThresholdRupees} Threshold Offer in /promotions →
              </Link>
              <span className="text-[10px] font-mono text-muted">
                {growthPlaybook.activePromos.length} Active Offer(s)
              </span>
            </div>
          </div>
        </div>

        {/* Meituan Waimai + DoorDash 5-Daypart & Neighborhood Geo-Demand Growth Engine */}
        <div className="rounded-xl border border-line bg-surface-2/40 p-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
              🌏 MEITUAN WAIMAI &amp; DOORDASH 5-DAYPART &amp; NEIGHBORHOOD GEO-DEMAND ENGINE (7-DAY LIVE ORDERS)
            </h3>
            <span className="font-mono text-[10px] text-muted">
              Real 7-Day Hourly Order Distribution · 0km–7km Delivery Radius Optimization
            </span>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5 text-xs">
            {daypartPlaybook.map((dp) => (
              <div key={dp.id} className="rounded-lg border border-line bg-surface p-2.5 space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-ink">{dp.slot}</span>
                  <span className="rounded bg-leaf-soft px-1.5 py-0.5 font-mono text-[10px] font-bold text-leaf">
                    {dp.orders7d} ord
                  </span>
                </div>
                <div className="font-mono text-[10px] text-amber-400">{dp.geoRadius}</div>
                <p className="text-[11px] leading-snug text-muted">{dp.strategy}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Explicit Confirmation & Data Provenance Safeguard */}
      <Card className="border-amber-500/30 bg-amber-500/5 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-bold text-amber-400">
            🛡️ Merchant Review Required — No changes are applied without your explicit confirmation
          </div>
          <span className="text-[11px] font-mono text-muted">
            Data Provenance: Live Restaurant Database (Dashboard · Menu · Settlement · Analytics)
          </span>
        </div>
        {actionBanner ? (
          <div className="mt-2 flex items-center justify-between rounded-lg border border-leaf/40 bg-leaf-soft px-3 py-1.5 text-xs font-semibold text-leaf">
            <span>{actionBanner}</span>
            <button
              type="button"
              onClick={() => setActionBanner(null)}
              className="ml-3 text-[11px] underline"
            >
              Dismiss
            </button>
          </div>
        ) : null}
      </Card>

      {/* ⚡ Instant Self-Service Kitchen Diagnostics & Auto-Fix Desk (6 Modules) */}
      <Card className="space-y-4 border-line bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-ink">
              ⚡ INSTANT SELF-SERVICE KITCHEN DIAGNOSTICS &amp; AUTO-FIX DESK
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {activeLang.greeting} — Zero-employee autonomous inspection of your outlet status, menu availability, statutory settlement math, prep time buffers, and dish-level net take-home margins.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void dash.refetch();
                void menu.refetch();
                void settlements.refetch();
                void analytics.refetch();
                void promotions.refetch();
              }}
            >
              🔄 Refresh Live Checks
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExportOmrOsTelemetry}>
              📥 Export King AI Telemetry
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* MODULE 1: Why am I not receiving orders? (5-Point Live Storefront Check) */}
          <div className="rounded-xl border border-line bg-surface-2/50 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                1. Why Am I Not Receiving Orders? (5-Point Live Check)
              </h3>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  dash.data?.isOpen &&
                  dash.data?.verificationStatus === "VERIFIED" &&
                  hasValidFssai &&
                  menuAudit.inStock.length > 0
                    ? "bg-leaf-soft text-leaf"
                    : "bg-amber-500/15 text-amber-400"
                }`}
              >
                {dash.data?.isOpen &&
                dash.data?.verificationStatus === "VERIFIED" &&
                hasValidFssai &&
                menuAudit.inStock.length > 0
                  ? "RECEIVING ORDERS"
                  : "ACTION NEEDED"}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Check 1: Kitchen Open/Close status */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2">
                <div>
                  <span className="font-semibold text-ink">① Kitchen Storefront Status: </span>
                  <span className={dash.data?.isOpen ? "font-bold text-leaf" : "font-bold text-chili"}>
                    {dash.data ? (dash.data.isOpen ? "OPEN (Online)" : "PAUSED / CLOSED") : "Checking..."}
                  </span>
                </div>
                {dash.data && !dash.data.isOpen && canHoursEdit ? (
                  !confirmResume ? (
                    <Button size="sm" variant="primary" onClick={() => setConfirmResume(true)}>
                      Resume Outlet
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={applyingResume}
                        onClick={() => void handleConfirmResumeOutlet()}
                      >
                        {applyingResume ? "Resuming..." : "Confirm Resume"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmResume(false)}>
                        Cancel
                      </Button>
                    </div>
                  )
                ) : null}
              </div>

              {/* Check 2: Verification status */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2">
                <div>
                  <span className="font-semibold text-ink">② KYC &amp; Empanelment Status: </span>
                  <span
                    className={
                      dash.data?.verificationStatus === "VERIFIED"
                        ? "font-bold text-leaf"
                        : "font-bold text-amber-400"
                    }
                  >
                    {dash.data?.verificationStatus ?? "Checking..."}
                  </span>
                </div>
                {dash.data && dash.data.verificationStatus !== "VERIFIED" ? (
                  <Link to="/onboarding" className="text-[11px] font-semibold text-amber-400 underline">
                    Complete KYC →
                  </Link>
                ) : null}
              </div>

              {/* Check 3: 14-digit FSSAI License presence */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2">
                <div>
                  <span className="font-semibold text-ink">③ 14-Digit FSSAI License: </span>
                  <span className={hasValidFssai ? "font-mono font-bold text-leaf" : "font-bold text-chili"}>
                    {hasValidFssai
                      ? fssaiClean
                      : dash.data?.fssaiNumber
                        ? `${dash.data.fssaiNumber} (Verify 14 digits)`
                        : "Not Configured"}
                  </span>
                </div>
                {!hasValidFssai ? (
                  <Link to="/onboarding" className="text-[11px] font-semibold text-amber-400 underline">
                    Update FSSAI →
                  </Link>
                ) : null}
              </div>

              {/* Check 4: Active in-stock dishes vs out-of-stock */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2">
                <div>
                  <span className="font-semibold text-ink">④ Catalog Stock Availability: </span>
                  <span className="font-mono text-ink">
                    {menuAudit.inStock.length} In-Stock ·{" "}
                    <span className={menuAudit.outOfStock.length > 0 ? "font-bold text-amber-400" : "text-muted"}>
                      {menuAudit.outOfStock.length} Out-of-Stock
                    </span>
                  </span>
                </div>
                {menuAudit.outOfStock.length > 0 && canAvailEdit ? (
                  !confirmRestock ? (
                    <Button size="sm" variant="secondary" onClick={() => setConfirmRestock(true)}>
                      Restore Out-of-Stock Items ({menuAudit.outOfStock.length})
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={applyingRestock}
                        onClick={() => void handleConfirmRestoreStock()}
                      >
                        {applyingRestock ? "Restoring..." : "Confirm Restore"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmRestock(false)}>
                        Cancel
                      </Button>
                    </div>
                  )
                ) : null}
              </div>

              {/* Check 5: Pending unaccepted orders */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2">
                <div>
                  <span className="font-semibold text-ink">⑤ Unaccepted Pending Orders: </span>
                  <span
                    className={
                      (dash.data?.today.pending ?? 0) > 0 ? "font-bold text-chili" : "font-bold text-leaf"
                    }
                  >
                    {dash.data?.today.pending ?? 0} Pending Acceptance
                  </span>
                </div>
                {(dash.data?.today.pending ?? 0) > 0 ? (
                  <Link to="/orders" className="text-[11px] font-semibold text-chili underline">
                    Accept Now in KDS →
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          {/* MODULE 2: Where is my payout? / Settlement Math Explainer */}
          <div className="rounded-xl border border-line bg-surface-2/50 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                2. Where Is My Payout? / Settlement Math Explainer
              </h3>
              <span className="rounded-full bg-leaf-soft px-2 py-0.5 font-mono text-[10px] font-bold text-leaf">
                INTEGER PAISE LEDGER
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-lg border border-line bg-surface p-2.5">
                <div className="text-[11px] text-muted">Current Unsettled Payable</div>
                <div className="mt-0.5 font-mono text-base font-bold text-leaf">
                  {formatINR(settlements.data?.currentPayablePaise ?? 0)}
                </div>
                <div className="text-[10px] text-muted">
                  Today&apos;s Est. Accrued: {formatINR(dash.data?.today.settlementPaise ?? 0)}
                </div>
              </div>
              <div className="rounded-lg border border-line bg-surface p-2.5">
                <div className="text-[11px] text-muted">Latest Settlement Batch</div>
                <div className="mt-0.5 font-mono text-sm font-bold text-ink">
                  {latestBatch ? formatINR(latestBatch.totalPayablePaise) : "No Batch Yet"}
                </div>
                <div className="text-[10px] text-muted">
                  {latestBatch
                    ? `Status: ${latestBatch.status} · Scheduled: ${(latestBatch.scheduled_for || "").slice(0, 10)}`
                    : "Weekly NEFT/IMPS cycle"}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-line bg-surface p-2.5 text-[11px] leading-relaxed text-muted">
              <div className="font-semibold text-ink">Verified Statutory Payout Formula (Integer Paise):</div>
              <p className="mt-1 font-mono text-[10px] text-ink">
                Net Payable = (Food Value + Packaging − Restaurant Discount) − Platform Commission + Platform Promo − Customer Refunds − Statutory Taxes (CGST §9(5) 5% · TCS §52 0.5% · TDS §194-O 0.1%)
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <Link
                to="/settlements"
                className="inline-flex items-center rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-2"
              >
                🏦 View Ledger &amp; Update Bank / IFSC in Settlements →
              </Link>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  void send("Explain my Wednesday payout breakdown with 12% commission, GST, TCS and TDS deductions.")
                }
              >
                Ask AI to Explain Math
              </Button>
            </div>
          </div>

          {/* MODULE 3: Spark AI Menu Quality & FSSAI Compliance Auditor */}
          <div className="rounded-xl border border-line bg-surface-2/50 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                3. Spark AI Menu Quality &amp; FSSAI Compliance Auditor
              </h3>
              <span className="rounded-full border border-line bg-surface px-2 py-0.5 font-mono text-[10px] font-semibold text-muted">
                {menuAudit.total} Dishes Scanned
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-center">
              <div className="rounded-lg border border-line bg-surface p-2">
                <div className="font-mono text-sm font-bold text-amber-400">
                  {menuAudit.missingPhoto.length}
                </div>
                <div className="text-[10px] text-muted">Missing Photos</div>
              </div>
              <div className="rounded-lg border border-line bg-surface p-2">
                <div className="font-mono text-sm font-bold text-amber-400">
                  {menuAudit.missingDesc.length}
                </div>
                <div className="text-[10px] text-muted">Missing Descriptions</div>
              </div>
              <div className="rounded-lg border border-line bg-surface p-2">
                <div className="font-mono text-sm font-bold text-chili">
                  {menuAudit.outOfStock.length}
                </div>
                <div className="text-[10px] text-muted">Out of Stock</div>
              </div>
              <div className="rounded-lg border border-line bg-surface p-2">
                <div className="font-mono text-xs font-bold text-ink">
                  {menuAudit.vegCount}V · {menuAudit.nonVegCount}NV · {menuAudit.eggCount}E
                </div>
                <div className="text-[10px] text-muted">FSSAI Diet Tags</div>
              </div>
            </div>

            <p className="text-[11px] text-muted">
              FSSAI Food Safety &amp; Standards (Packaging &amp; Labelling) Regulations require accurate Vegetarian (Green), Non-Vegetarian (Brown/Red), or Egg declarations and authentic kitchen preparation imagery on every customer-facing item.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link
                to="/menu"
                className="inline-flex items-center rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-2"
              >
                🍲 Open Dish Studio in /menu →
              </Link>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void send("Which items are currently out of stock or missing photos in my menu?")}
              >
                Run Full Catalog Audit in Chat
              </Button>
            </div>
          </div>

          {/* MODULE 4: Peak Rush & Prep Time Guard */}
          <div className="rounded-xl border border-line bg-surface-2/50 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                4. Peak Rush &amp; Prep Time Guard
              </h3>
              <span className="rounded-full border border-line bg-surface px-2 py-0.5 font-mono text-[10px] font-semibold text-ink">
                Avg Prep SLA: {menuAudit.avgPrepMinutes}m
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-line bg-surface p-2">
                <div className="font-mono text-sm font-bold text-ink">
                  {dash.data?.today.pending ?? 0}
                </div>
                <div className="text-[10px] text-muted">Pending Orders</div>
              </div>
              <div className="rounded-lg border border-line bg-surface p-2">
                <div className="font-mono text-sm font-bold text-leaf">
                  {dash.data?.today.accepted ?? 0}
                </div>
                <div className="text-[10px] text-muted">Accepted Today</div>
              </div>
              <div className="rounded-lg border border-line bg-surface p-2">
                <div className="font-mono text-sm font-bold text-ink">
                  {menuAudit.avgPrepMinutes} mins
                </div>
                <div className="text-[10px] text-muted">Active Prep SLA</div>
              </div>
            </div>

            <p className="text-[11px] text-muted">
              Adjust your kitchen-wide preparation SLA buffer during high-volume dining hours so delivery partners are dispatched when food is freshly packed. Requires explicit merchant confirmation.
            </p>

            {canHoursEdit ? (
              confirmThrottleMode === null ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={menuAudit.avgPrepMinutes <= 20 ? "primary" : "secondary"}
                    onClick={() => setConfirmThrottleMode("NORMAL")}
                  >
                    ⏱️ Standard Prep (20m)
                  </Button>
                  <Button
                    size="sm"
                    variant={menuAudit.avgPrepMinutes >= 35 ? "primary" : "secondary"}
                    onClick={() => setConfirmThrottleMode("RUSH")}
                  >
                    🔥 Peak Rush (35m)
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs">
                  <span className="font-semibold text-amber-300">
                    Confirm switching all dishes to{" "}
                    {confirmThrottleMode === "RUSH" ? "Peak Rush (35m)" : "Standard Prep (20m)"}?
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={applyingThrottle}
                      onClick={() => void handleConfirmPrepMode(confirmThrottleMode)}
                    >
                      {applyingThrottle ? "Applying..." : "Confirm Change"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmThrottleMode(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )
            ) : (
              <div className="text-[11px] text-muted">
                Role permission required (`hours.edit`) to modify kitchen-wide prep time buffers.
              </div>
            )}
          </div>

          {/* MODULE 5: DoorDash-Grade Algorithmic Menu Engineering & Net Take-Home Matrix */}
          <div className="rounded-xl border border-line bg-surface-2/50 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                5. Dish-Level Net Take-Home &amp; Statutory Tax Matrix
              </h3>
              <span className="rounded-full bg-leaf-soft px-2 py-0.5 font-mono text-[10px] font-bold text-leaf">
                Conversion Score: {menuAudit.storefrontConversionScore}%
              </span>
            </div>

            {menuAudit.dishMarginMatrix.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-line bg-surface">
                <table className="w-full text-left text-[11px]">
                  <thead className="border-b border-line bg-surface-2/60 font-mono text-[10px] text-muted">
                    <tr>
                      <th className="px-2 py-1.5">Dish</th>
                      <th className="px-2 py-1.5">Menu Price</th>
                      <th className="px-2 py-1.5">12% Comm.</th>
                      <th className="px-2 py-1.5">TCS+TDS</th>
                      <th className="px-2 py-1.5 text-leaf">Net Take-Home</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line font-mono">
                    {menuAudit.dishMarginMatrix.map((row) => (
                      <tr key={row.id}>
                        <td className="px-2 py-1 font-sans font-medium text-ink">{row.name}</td>
                        <td className="px-2 py-1">{formatINR(row.basePaise)}</td>
                        <td className="px-2 py-1 text-muted">-{formatINR(row.commissionPaise)}</td>
                        <td className="px-2 py-1 text-muted">
                          -{formatINR(row.tcs52Paise + row.tds194OPaise)}
                        </td>
                        <td className="px-2 py-1 font-bold text-leaf">
                          {formatINR(row.netTakeHomePaise)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {menuAudit.missingPrep.length > 0 && canMenuEdit ? (
              !confirmPrepSlaFix ? (
                <Button size="sm" variant="secondary" onClick={() => setConfirmPrepSlaFix(true)}>
                  ⚡ Auto-Configure 20m Prep SLA on {menuAudit.missingPrep.length} Unset Dish(es)
                </Button>
              ) : (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs">
                  <span className="font-semibold text-amber-300">
                    Confirm setting 20m prep SLA on {menuAudit.missingPrep.length} dish(es)?
                  </span>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={applyingPrepSlaFix}
                      onClick={() => void handleConfirmFixMissingPrepSla()}
                    >
                      {applyingPrepSlaFix ? "Saving..." : "Confirm 20m SLA"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmPrepSlaFix(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )
            ) : null}
          </div>

          {/* MODULE 6: Autonomous Zero-Employee King AI Ecosystem Bridge */}
          <div className="rounded-xl border border-line bg-surface-2/50 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                6. Autonomous Zero-Employee King AI Ecosystem Bridge
              </h3>
              <span className="rounded-full border border-leaf/40 bg-leaf-soft px-2 py-0.5 font-mono text-[10px] font-bold text-leaf">
                100% SELF-SERVICE
              </span>
            </div>

            <p className="text-[11px] text-muted">
              Every growth campaign, payout reconciliation, KDS order flow, thermal KOT printer, and FSSAI catalog update is directly controlled by your restaurant team without waiting on human account managers.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                to="/promotions"
                className="rounded-lg border border-line bg-surface p-2.5 hover:bg-surface-2 transition"
              >
                <div className="font-bold text-ink">📈 Organic Growth &amp; Promos</div>
                <div className="mt-0.5 text-[10px] text-muted">
                  Configure ₹{growthPlaybook.recommendedThresholdRupees} threshold discount slabs
                </div>
              </Link>
              <Link
                to="/analytics"
                className="rounded-lg border border-line bg-surface p-2.5 hover:bg-surface-2 transition"
              >
                <div className="font-bold text-ink">📊 Revenue &amp; Repeat Cohort</div>
                <div className="mt-0.5 text-[10px] text-muted">
                  AOV: {formatINR(growthPlaybook.liveAovPaise)} · 7d Orders: {analytics.data?.summary.orders ?? 0}
                </div>
              </Link>
              <Link
                to="/settings"
                className="rounded-lg border border-line bg-surface p-2.5 hover:bg-surface-2 transition"
              >
                <div className="font-bold text-ink">🖨️ 80mm ESC/POS &amp; KOT</div>
                <div className="mt-0.5 text-[10px] text-muted">
                  Direct LAN / Bluetooth / WebUSB thermal printing
                </div>
              </Link>
              <Link
                to="/analytics"
                className="rounded-lg border border-line bg-surface p-2.5 hover:bg-surface-2 transition"
              >
                <div className="font-bold text-ink">🔒 Immutable Audit Trail</div>
                <div className="mt-0.5 text-[10px] text-muted">
                  Every price, stock &amp; payout event logged under IT Act 2000
                </div>
              </Link>
            </div>
          </div>

          {/* MODULE 7: Automated Customer Dispute & Refund Arbitrator */}
          <div className="rounded-xl border border-line bg-surface-2/50 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                7. Spark AI Customer Dispute &amp; Refund Arbitrator
              </h3>
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                MERCHANT vs LOGISTICS LIABILITY
              </span>
            </div>
            <p className="text-[11px] text-muted">
              Autonomous arbitrator assessing missing item vs food spill complaints in transit. Merchant payouts are 100% protected against 3rd-party delivery fleet mishandling.
            </p>

            {/* Dispute Case Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-muted">Select Active Customer Complaint:</span>
              <div className="grid grid-cols-2 gap-1.5">
                {defaultDisputes.map((d) => (
                  <button
                    key={d.disputeId}
                    type="button"
                    onClick={() => {
                      setSelectedDisputeId(d.disputeId);
                      setDisputeDecision(orderKingSpark.arbitrateDispute(d));
                    }}
                    className={`rounded-lg border p-2 text-left text-xs transition ${
                      selectedDisputeId === d.disputeId
                        ? "border-emerald-500 bg-emerald-500/10 font-bold text-emerald-300"
                        : "border-line bg-surface text-muted hover:text-ink"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase">{d.complaintType.replace(/_/g, " ")}</span>
                      <span className="font-mono text-[10px] text-ink font-bold">₹{(d.claimAmountPaise / 100).toFixed(0)}</span>
                    </div>
                    <div className="truncate text-[11px] mt-0.5 font-sans">{d.customerName} (#{d.orderId})</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Dispute Evidence Card */}
            {selectedDispute && (
              <div className="rounded-lg border border-line bg-surface p-2.5 space-y-2 text-xs">
                <div className="italic text-ink text-[11px] bg-surface-2 p-2 rounded border border-line">
                  &ldquo;{selectedDispute.complaintText}&rdquo;
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                  <div className="rounded bg-surface-2 p-1.5 border border-line">
                    <span className="text-muted block">Prep SLA:</span>
                    <span className="font-bold text-ink">{selectedDispute.prepTimeMinutes} mins (On-Time)</span>
                  </div>
                  <div className="rounded bg-surface-2 p-1.5 border border-line">
                    <span className="text-muted block">Rider Transit:</span>
                    <span className={`font-bold ${selectedDispute.transitTimeMinutes > 30 ? "text-rose-400" : "text-emerald-400"}`}>
                      {selectedDispute.transitTimeMinutes} mins
                    </span>
                  </div>
                  <div className="rounded bg-surface-2 p-1.5 border border-line">
                    <span className="text-muted block">Tamper Tape:</span>
                    <span className="font-bold text-emerald-400">Intact / Verified</span>
                  </div>
                </div>

                {disputeDecision && (
                  <div className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold font-mono text-[11px] text-emerald-300 flex items-center gap-1">
                        🛡️ ARBITRATION DECISION: {disputeDecision.liability} LIABLE
                      </span>
                      <span className="font-mono text-[11px] font-bold text-ink">
                        Merchant Loss: ₹{(disputeDecision.merchantLiabilityPaise / 100).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                      {disputeDecision.legalSenseRationale}
                    </p>
                    {disputeDecision.gstReversalPaise > 0 && (
                      <div className="text-[10px] font-mono text-amber-300">
                        CGST Sec 9(5) Tax Adjustment: -₹{(disputeDecision.gstReversalPaise / 100).toFixed(2)} credited back to merchant tax ledger.
                      </div>
                    )}
                    <div className="text-[10px] text-muted italic">
                      Action: {disputeDecision.suggestedMerchantAction}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* MODULE 8: Menu Description & Pricing Intelligence Studio */}
          <div className="rounded-xl border border-line bg-surface-2/50 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                8. Spark AI Menu Description &amp; Pricing Intelligence Studio
              </h3>
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                HIGH-MARGIN CONVERSION
              </span>
            </div>
            <p className="text-[11px] text-muted">
              Algorithmic culinary copywriting, dietary tagging, and portion architecture to lift Average Order Value while protecting net merchant margins.
            </p>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-muted">Quick Dish Presets:</span>
              <div className="flex flex-wrap gap-1">
                {[
                  "Special Mutton Dum Biryani",
                  "Murgh Tikka Butter Masala",
                  "Garlic Butter Naan",
                  "Paneer Lababdar Handi",
                ].map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setIntelDishName(name);
                      setIntelResult(orderKingSpark.suggestMenuIntelligence(name));
                    }}
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition ${
                      intelDishName === name
                        ? "border-amber-500 bg-amber-500/20 text-amber-300"
                        : "border-line bg-surface text-muted hover:text-ink"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {intelResult && (
              <div className="rounded-lg border border-line bg-surface p-2.5 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">
                    ✨ High-Converting Sensory Copy:
                  </span>
                  <p className="text-[11px] text-ink italic leading-relaxed mt-0.5">
                    &ldquo;{intelResult.highConvertingDescription}&rdquo;
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-emerald-300 font-bold">
                    {intelResult.dietaryClassification}
                  </span>
                  {intelResult.dietaryBadges.map((b) => (
                    <span key={b} className="rounded bg-surface-2 border border-line px-1.5 py-0.5 text-muted font-medium">
                      {b}
                    </span>
                  ))}
                  <span className="rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-amber-300 font-mono">
                    Allergens: {intelResult.allergens.join(", ")}
                  </span>
                </div>

                <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="font-bold text-amber-200">Portion: {intelResult.portionStrategy.portionName}</span>
                    <span className="font-bold text-emerald-400">Target Margin: {intelResult.portionStrategy.marginTargetPercent}%</span>
                  </div>
                  <p className="text-[10px] text-muted">
                    {intelResult.portionStrategy.commercialRationale}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* MODULE 9: Daily Shift & Statutory 9(5) GST Recon Report */}
          <div className="rounded-xl border border-line bg-surface-2/50 p-3.5 space-y-3 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                9. Daily Shift &amp; Statutory 9(5) GST Financial Recon Report
              </h3>
              <span className="rounded-full border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-300">
                100% INTEGER-PAISE AUDIT
              </span>
            </div>
            <p className="text-[11px] text-muted">
              Conversational shift reconciliation: food &amp; packaging gross revenues, zero platform commission deductions, 5% CGST Sec 9(5) remitted directly by OrderKing on your behalf, and net bank payout.
            </p>

            <div className="grid gap-2 sm:grid-cols-4 font-mono text-xs">
              <div className="rounded-lg border border-line bg-surface p-2.5">
                <span className="text-[10px] text-muted uppercase block">Delivered Orders</span>
                <span className="text-sm font-bold text-ink">{shiftRecon.totalDeliveredOrders} orders</span>
                <span className="text-[10px] text-muted block mt-0.5">({shiftRecon.cancelledOrders} cancelled)</span>
              </div>
              <div className="rounded-lg border border-line bg-surface p-2.5">
                <span className="text-[10px] text-muted uppercase block">Gross Sales &amp; Packaging</span>
                <span className="text-sm font-bold text-ink">₹{(shiftRecon.grossCustomerSpendPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">0% OrderKing Commission</span>
              </div>
              <div className="rounded-lg border border-line bg-surface p-2.5">
                <span className="text-[10px] text-muted uppercase block">CGST Sec 9(5) Remitted</span>
                <span className="text-sm font-bold text-sky-400">₹{(shiftRecon.gst95RemittedByPlatformPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                <span className="text-[10px] text-muted block mt-0.5">5% Food GST by Platform</span>
              </div>
              <div className="rounded-lg border border-line bg-surface p-2.5">
                <span className="text-[10px] text-muted uppercase block">Net Payout Accrued</span>
                <span className="text-sm font-bold text-emerald-400">₹{(shiftRecon.netPayoutAccruedPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                <span className="text-[10px] text-muted block mt-0.5">{shiftRecon.bankSettlementAccount}</span>
              </div>
            </div>

            <div className="rounded-lg border border-sky-500/30 bg-sky-950/20 p-3 space-y-1.5">
              <span className="text-[11px] font-bold text-sky-200 font-mono block">
                🎙️ Conversational Human Recon Summary:
              </span>
              <p className="whitespace-pre-wrap text-[11px] text-slate-300 leading-relaxed font-sans">
                {shiftRecon.conversationalSummary}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* ⚖️ Statutory Government & Regulatory Direct Links (Zero Legal Headache) */}
      <Card className="border-amber-500/30 bg-amber-500/5 p-4">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <span className="text-lg">⚖️</span>
          <h2 className="text-sm font-bold tracking-tight">STATUTORY MERCHANT HELPLINES &amp; OMBUDSMAN</h2>
        </div>
        <p className="mt-1 text-xs text-muted">
          Direct escalation to official Indian statutory departments and regulatory desks. Ensures compliance under FSSAI, GST &amp; DPIIT rules.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <a
            href="https://foscos.fssai.gov.in"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg border border-leaf-soft bg-surface p-2.5 text-xs font-bold text-leaf hover:bg-leaf-soft/50 transition-colors"
          >
            <span>📜</span>
            <div>
              <div>FSSAI FoSCoS</div>
              <div className="text-[10px] font-normal text-muted">foscos.fssai.gov.in</div>
            </div>
          </a>
          <a
            href="https://www.gst.gov.in"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg border border-line bg-surface p-2.5 text-xs font-bold text-foreground hover:bg-accent transition-colors"
          >
            <span>🏛️</span>
            <div>
              <div>GST Seva Kendra</div>
              <div className="text-[10px] font-normal text-muted">1800-103-4786</div>
            </div>
          </a>
          <a
            href="https://samadhaan.msme.gov.in"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg border border-line bg-surface p-2.5 text-xs font-bold text-foreground hover:bg-accent transition-colors"
          >
            <span>🛡️</span>
            <div>
              <div>MSME Samadhaan</div>
              <div className="text-[10px] font-normal text-muted">Delayed Payments</div>
            </div>
          </a>
          <a
            href="https://odrcountry.in"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg border border-line bg-surface p-2.5 text-xs font-bold text-foreground hover:bg-accent transition-colors"
          >
            <span>⚖️</span>
            <div>
              <div>DPIIT ODR</div>
              <div className="text-[10px] font-normal text-muted">Dispute Resolution</div>
            </div>
          </a>
          <a
            href="mailto:merchant.care@orderking.in"
            className="flex items-center gap-2 rounded-lg border border-line bg-surface p-2.5 text-xs font-bold text-foreground hover:bg-accent transition-colors"
          >
            <span>📩</span>
            <div>
              <div>Merchant Ombudsman</div>
              <div className="text-[10px] font-normal text-muted">Statutory Desk</div>
            </div>
          </a>
          <a
            href="https://wa.me/919223166166?text=RESTAURANT%20PARTNER%20PRIORITY%20SUPPORT:%20Need%20immediate%20kitchen%20settlement%20assistance"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg bg-[#25D366]/10 p-2.5 text-xs font-bold text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
          >
            <span>💬</span>
            <div>
              <div>WhatsApp VIP Care</div>
              <div className="text-[10px] font-normal text-muted">24x7 Priority Desk</div>
            </div>
          </a>
        </div>
      </Card>

      {/* Quick Prompt Chips */}
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold" onClick={() => void send("Arbitrate customer dispute: Food container spilled during transit vs missing items. Determine merchant vs logistics liability.")}>
          ⚖️ Dispute Arbitrator (Spill vs Missing)
        </Button>
        <Button variant="primary" size="sm" className="bg-amber-600 hover:bg-amber-500 text-white font-bold" onClick={() => void send("Suggest high-margin dish descriptions, dietary allergen tags, and portion adjustments for signature dishes.")}>
          ✨ Menu Description &amp; Pricing Intelligence
        </Button>
        <Button variant="primary" size="sm" className="bg-sky-600 hover:bg-sky-500 text-white font-bold" onClick={() => void send("Generate today's daily shift recon report with gross sales, 0% commission savings, and CGST Sec 9(5) remitted.")}>
          📊 Daily Shift &amp; 9(5) GST Recon Report
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void send("How do I use 1-click AI auto-setup to connect, configure and test my thermal printers and POS?")}>
          🛠️ 1-Click AI Auto-Connect Hardware &amp; POS
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void send("How do I test print dual KOT tickets for Kitchen food and Bar beverages?")}>
          🧾 Test Print Kitchen KOT &amp; Bar Tickets
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void send("How do I connect my 80mm ESC/POS thermal printer via Network IP or Bluetooth?")}>
          🖨️ Thermal Printer &amp; KOT Setup
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void send("How do I configure bidirectional sync with Petpooja or UrbanPiper POS?")}>
          🏬 Petpooja &amp; UrbanPiper POS Sync
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void send("How are my kitchen sales and orders today?")}>
          📊 Today&apos;s Sales &amp; Orders
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void send("Explain my Wednesday payout breakdown with 12% commission, GST, TCS and TDS deductions.")}>
          💳 Wednesday Payout &amp; Tax Breakdown
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void send("How do I claim 100% food value reimbursement for a customer-cancelled order?")}>
          🛡️ Cancelled Order Reimbursement
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void send("What are my top selling dishes today?")}>
          🍲 Top Selling Dishes
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void send("Which items are currently out of stock?")}>
          ⚠️ Check Out-of-Stock Items
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void send("How do I activate Rush Hour prep time?")}>
          🔥 Rush Hour &amp; Prep Buffers
        </Button>
        {examples.map((ex) => (
          <Button key={ex} variant="ghost" size="sm" onClick={() => void send(ex)}>
            {ex}
          </Button>
        ))}
      </div>
      <div className="space-y-2">
        {log.map((m, i) => (
          <Card key={i} className={m.role === "user" ? "bg-chili-soft" : ""}>
            <div className="flex items-start justify-between gap-2">
              <p className="whitespace-pre-wrap text-sm">{m.text}</p>
              {m.role === "assistant" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSpeakMessage(m.text, i)}
                  title={`Listen in ${activeLang.nativeName}`}
                >
                  {speakingIndex === i ? "⏹️ Stop" : `🔊 Listen in Your Language (${activeLang.nativeName})`}
                </Button>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
      <form
        className="flex flex-wrap sm:flex-nowrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(q);
        }}
      >
        <Textarea
          className="min-h-14 flex-1"
          placeholder={`${t("assistant.placeholder")} (${activeLang.nativeName} / ${activeLang.name})`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <Button type="submit" disabled={busy}>
            {t("assistant.send")} ({activeLang.nativeName})
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleVoiceInput}
            disabled={listening}
          >
            {listening ? `🎙️ Listening (${activeLang.code})...` : `🎙️ Speak (${activeLang.nativeName})`}
          </Button>
        </div>
      </form>
    </VendorShell>
  );
}
