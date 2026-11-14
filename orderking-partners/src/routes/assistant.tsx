import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { VendorShell } from "@/components/vendor-shell";
import { useVendor } from "@/components/use-vendor";
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Paperclip,
  X,
  Loader2,
  CheckCircle2,
  UtensilsCrossed,
  Clock,
  Wallet,
  Scale,
  FileText,
  ChefHat,
  Zap,
  TrendingUp,
  ShieldCheck,
  Store,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { askAssistant } from "@/lib/server/api-more";
import { getMenu, setAvailability } from "@/lib/server/api-menu";
import { quickThrottleKitchen } from "@/lib/server/api-orders";
import {
  orderKingSpark,
  type SparkDisputeCase,
  type SparkDisputeArbitrationDecision,
  type SparkShiftFinancialReconReport,
  type SparkComboRecommendation,
} from "@/lib/ai/order-king-spark";
import { tryExecutePartnerAiCommand } from "@/lib/ai/partner-ai-actions";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";

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

interface WorkstationMessage {
  id: string;
  sender: "user" | "spark";
  text: string;
  timestamp: string;
  attachments?: Array<{ name: string; content: string; type: string }>;
  actionCardType?: "STOCKOUT" | "RUSH" | "RECON" | "DISPUTE" | "COMBOS";
  disputeData?: SparkDisputeArbitrationDecision;
  reconData?: SparkShiftFinancialReconReport;
  comboData?: SparkComboRecommendation[];
}

function AssistantPage() {
  const qc = useQueryClient();
  const vendor = useVendor();
  const activeRestaurantId = vendor.restaurantId;
  const restaurantName = vendor.selected?.restaurantName || "Restaurant Partner";

  const [selectedLang, setSelectedLang] = useState<IndianLanguageSpec>(INDIAN_CONSTITUTIONAL_LANGUAGES[0]);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [inputQuestion, setInputQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<
    Array<{ name: string; content: string; type: string }>
  >([]);

  const [messages, setMessages] = useState<WorkstationMessage[]>(() => [
    {
      id: "spark-welcome",
      sender: "spark",
      text: `Hello Chef! Welcome to King Spark AI Kitchen Assistant for ${restaurantName}. I provide autonomous support for live kitchen operations, 86 dish stockouts, rush prep buffers, dispute arbitrations, and daily T+1 payout reconciliations.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const menuQ = useQuery({
    queryKey: ["menu", activeRestaurantId],
    queryFn: () => getMenu({ data: { restaurantId: activeRestaurantId } }),
    enabled: Boolean(activeRestaurantId),
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleLanguageChange = (code: string) => {
    const lang = INDIAN_CONSTITUTIONAL_LANGUAGES.find((l) => l.code === code) || INDIAN_CONSTITUTIONAL_LANGUAGES[0];
    setSelectedLang(lang);
    toast.success(`Language set to ${lang.nativeName} (${lang.name})`);
  };

  const speakResponse = (text: string) => {
    if (!ttsEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*_#`]/g, "").slice(0, 300);
      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = selectedLang.bcp47;
      utter.rate = 1.0;
      window.speechSynthesis.speak(utter);
    } catch {}
  };

  const toggleVoiceInput = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Voice input is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = selectedLang.bcp47;

      recognition.onstart = () => {
        setIsListening(true);
        toast.info(`Listening in ${selectedLang.nativeName}...`);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join("");
        setInputQuestion(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast.error("Could not capture speech. Please check microphone permissions.");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      toast.error("Failed to start voice recognition.");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 5MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setPendingAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            content: reader.result as string,
            type: file.type || "image/jpeg",
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const handleSendMessage = async (textOverride?: string) => {
    const questionText = (textOverride ?? inputQuestion).trim();
    const currentAttachments = [...pendingAttachments];

    if (!questionText && currentAttachments.length === 0) return;

    const userMsg: WorkstationMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: questionText || "Attached file for analysis.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion("");
    setPendingAttachments([]);
    setIsLoading(true);

    try {
      const menuData = (menuQ.data as any) || {};
      const localContext = {
        restaurantId: activeRestaurantId,
        categories: menuData.categories || [],
        items: menuData.items || [],
        languageCode: selectedLang.code,
        canEditMenu: true,
        canEditAvailability: true,
      };

      const localExec = await tryExecutePartnerAiCommand(questionText, localContext);
      if (localExec.handled && localExec.replyText) {
        const sparkMsg: WorkstationMessage = {
          id: `spark-${Date.now()}`,
          sender: "spark",
          text: localExec.replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, sparkMsg]);
        speakResponse(sparkMsg.text);
        void qc.invalidateQueries({ queryKey: ["menu"] });
        void qc.invalidateQueries({ queryKey: ["orders"] });
        setIsLoading(false);
        return;
      }

      const firstAttachment = currentAttachments[0];
      const res = await askAssistant({
        data: {
          restaurantId: activeRestaurantId,
          question: questionText,
          imageBase64: firstAttachment?.content,
          mimeType: firstAttachment?.type,
        },
      });

      if (res && res.text) {
        const sparkMsg: WorkstationMessage = {
          id: `spark-${Date.now()}`,
          sender: "spark",
          text: res.text,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, sparkMsg]);
        speakResponse(sparkMsg.text);
      } else {
        const fallback = orderKingSpark.handleRestaurantQuery(questionText);
        const sparkMsg: WorkstationMessage = {
          id: `spark-${Date.now()}`,
          sender: "spark",
          text: fallback.text,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, sparkMsg]);
        speakResponse(sparkMsg.text);
      }
    } catch {
      const fallback = orderKingSpark.handleRestaurantQuery(questionText);
      const sparkMsg: WorkstationMessage = {
        id: `spark-${Date.now()}`,
        sender: "spark",
        text: fallback.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, sparkMsg]);
      speakResponse(sparkMsg.text);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStock = async (itemId: string, status: "available" | "sold_out") => {
    if (!activeRestaurantId) return;
    try {
      await setAvailability({
        data: {
          restaurantId: activeRestaurantId,
          itemIds: [itemId],
          status,
          nextAvailableAt: status === "sold_out" ? orderKingSpark.getNextDay06AM().toISOString() : null,
        },
      });
      toast.success(status === "available" ? "Dish restored to In Stock" : "Dish marked Sold Out (86)");
      void qc.invalidateQueries({ queryKey: ["menu"] });
    } catch {
      toast.error("Failed to update dish availability.");
    }
  };

  const handleSetRush = async (mode: "NORMAL" | "RUSH" | "PAUSE" | "RESUME") => {
    if (!activeRestaurantId) return;
    try {
      await quickThrottleKitchen({
        data: {
          restaurantId: activeRestaurantId,
          mode,
        },
      });
      const label =
        mode === "RUSH"
          ? "Kitchen Rush Mode active (35m prep buffer)"
          : mode === "PAUSE"
          ? "Storefront paused"
          : mode === "RESUME"
          ? "Storefront resumed"
          : "Standard prep buffer restored (20m)";
      toast.success(label);
      void qc.invalidateQueries({ queryKey: ["orders"] });
    } catch {
      toast.error("Failed to update kitchen buffer.");
    }
  };

  return (
    <VendorShell title="King Spark AI Partner Assistant">
      <div className="mx-auto max-w-6xl space-y-6 font-sans">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-slate-950 shadow-md shadow-amber-500/20">
              <Sparkles className="size-6 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-black text-gray-900">King Spark Workstation</h2>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  Active
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Autonomous Kitchen Operations, 86 Stockouts, Rush Buffers &amp; Section 9(5) Tax Compliance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Language Selector */}
            <select
              value={selectedLang.code}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="h-10 appearance-none rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-800 outline-none hover:bg-gray-100 cursor-pointer"
            >
              {INDIAN_CONSTITUTIONAL_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName} ({l.name})
                </option>
              ))}
            </select>

            {/* TTS Voice Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !ttsEnabled;
                setTtsEnabled(next);
                if (!next && typeof window !== "undefined" && "speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                }
                toast.info(next ? "Voice speech enabled" : "Voice speech muted");
              }}
              className={cn(
                "flex size-10 items-center justify-center rounded-xl border transition cursor-pointer",
                ttsEnabled
                  ? "border-amber-400 bg-amber-50 text-amber-700"
                  : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"
              )}
              title={ttsEnabled ? "Mute Voice Reading" : "Enable Voice Reading"}
            >
              {ttsEnabled ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Conversational AI Terminal (Col 1 & 2) */}
          <div className="lg:col-span-2 flex flex-col h-[700px] rounded-3xl border border-amber-500/20 bg-[#0B0F19] text-white shadow-xl overflow-hidden">
            {/* Quick Chips */}
            <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 bg-slate-950/80 px-4 py-2.5 scrollbar-none">
              <button
                type="button"
                onClick={() => void handleSendMessage("Show live storefront and kitchen status")}
                className="shrink-0 flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] font-semibold text-slate-200 hover:border-amber-400 transition cursor-pointer"
              >
                <Store className="size-3 text-amber-400" />
                <span>Storefront Status</span>
              </button>
              <button
                type="button"
                onClick={() => void handleSendMessage("Show today's sales and net payout ledger")}
                className="shrink-0 flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] font-semibold text-slate-200 hover:border-emerald-400 transition cursor-pointer"
              >
                <Wallet className="size-3 text-emerald-400" />
                <span>Payout Ledger</span>
              </button>
              <button
                type="button"
                onClick={() => void handleSendMessage("Which dishes are currently out of stock?")}
                className="shrink-0 flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] font-semibold text-slate-200 hover:border-rose-400 transition cursor-pointer"
              >
                <UtensilsCrossed className="size-3 text-rose-400" />
                <span>86 Stock Check</span>
              </button>
              <button
                type="button"
                onClick={() => void handleSendMessage("Recommend high-margin meal combos")}
                className="shrink-0 flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] font-semibold text-slate-200 hover:border-purple-400 transition cursor-pointer"
              >
                <TrendingUp className="size-3 text-purple-400" />
                <span>Menu Intelligence</span>
              </button>
            </div>

            {/* Chat Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn("flex flex-col gap-1.5", m.sender === "user" ? "items-end" : "items-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed",
                      m.sender === "user"
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-medium rounded-tr-xs"
                        : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-xs"
                    )}
                  >
                    {m.attachments && m.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2 pb-2 border-b border-black/10">
                        {m.attachments.map((att, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 rounded-lg bg-black/20 px-2 py-1 text-[10px]">
                            <FileText className="size-3" />
                            <span className="max-w-[120px] truncate">{att.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{m.text}</div>
                  </div>
                  <span className="text-[10px] text-slate-500 px-1">{m.timestamp}</span>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-xs text-amber-300 w-fit">
                  <Loader2 className="size-4 animate-spin text-amber-400" />
                  <span>King Spark is querying verified kitchen data...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Dock */}
            <div className="border-t border-slate-800 bg-[#0F172A] p-3 sm:p-4 space-y-2">
              {pendingAttachments.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {pendingAttachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-slate-900 px-2 py-1 text-xs text-slate-200"
                    >
                      <FileText className="size-3 text-amber-400" />
                      <span className="max-w-[120px] truncate text-[11px]">{att.name}</span>
                      <button
                        type="button"
                        onClick={() => setPendingAttachments((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-400 transition cursor-pointer"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.txt"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                  title="Attach dish photo, menu card or receipt"
                >
                  <Paperclip className="size-4 text-amber-400" />
                </button>

                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={cn(
                    "relative flex size-10 shrink-0 items-center justify-center rounded-xl transition cursor-pointer",
                    isListening
                      ? "bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 ring-4 ring-amber-400/70 shadow-[0_0_20px_rgba(251,191,36,0.8)] animate-pulse"
                      : "border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                  title={isListening ? "Stop Listening" : "Speak your request"}
                >
                  {isListening ? <MicOff className="size-4 animate-bounce" /> : <Mic className="size-4 text-amber-400" />}
                </button>

                <input
                  type="text"
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  placeholder={isListening ? "Listening to your voice..." : `Ask King Spark in ${selectedLang.nativeName} or English...`}
                  className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-400"
                />

                <button
                  type="submit"
                  disabled={(!inputQuestion.trim() && pendingAttachments.length === 0) || isLoading}
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-bold hover:brightness-110 active:scale-95 transition disabled:opacity-40 cursor-pointer shadow-md shadow-amber-500/20"
                >
                  {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Live Kitchen Command Deck (Col 3) */}
          <div className="space-y-6">
            {/* Rush Buffer Panel */}
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="size-4 text-amber-600" />
                  <span className="font-bold text-sm text-gray-900">Kitchen Prep Buffer</span>
                </div>
                <span className="text-xs font-mono text-gray-500">Live KDS Sync</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => void handleSetRush("RUSH")}
                  className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-left hover:bg-amber-100 transition cursor-pointer"
                >
                  <div className="text-xs font-bold text-amber-900">Rush Mode (35m)</div>
                  <div className="text-[10px] text-amber-700">Peak demand buffer</div>
                </button>
                <button
                  type="button"
                  onClick={() => void handleSetRush("NORMAL")}
                  className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-left hover:bg-emerald-100 transition cursor-pointer"
                >
                  <div className="text-xs font-bold text-emerald-900">Standard Prep</div>
                  <div className="text-[10px] text-emerald-700">Reset to 20m normal</div>
                </button>
                <button
                  type="button"
                  onClick={() => void handleSetRush("PAUSE")}
                  className="rounded-2xl border border-rose-200 bg-rose-50/70 p-3 text-left hover:bg-rose-100 transition cursor-pointer"
                >
                  <div className="text-xs font-bold text-rose-900">Pause Storefront</div>
                  <div className="text-[10px] text-rose-700">Pause incoming orders</div>
                </button>
                <button
                  type="button"
                  onClick={() => void handleSetRush("RESUME")}
                  className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3 text-left hover:bg-blue-100 transition cursor-pointer"
                >
                  <div className="text-xs font-bold text-blue-900">Resume Storefront</div>
                  <div className="text-[10px] text-blue-700">Accept live orders</div>
                </button>
              </div>
            </div>

            {/* Quick 86 Stockout Toggle Deck */}
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="size-4 text-[#E23744]" />
                  <span className="font-bold text-sm text-gray-900">1-Tap 86 Stockouts</span>
                </div>
                <span className="text-xs text-gray-500">Live Menu</span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {((menuQ.data as any)?.items || []).slice(0, 8).map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/70 p-2.5 text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-gray-900 truncate">{item.name}</div>
                      <div className="text-[10px] text-gray-500">
                        {item.diet === "VEG" ? "Veg" : "Non-Veg"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => void handleToggleStock(item.id, "sold_out")}
                        className="rounded-lg bg-rose-50 border border-rose-200 px-2 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                      >
                        86 Out
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleStock(item.id, "available")}
                        className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                      >
                        In Stock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Statutory Compliance & Daily Payout Overview */}
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-emerald-600" />
                <span className="font-bold text-sm text-emerald-950">Statutory Tax &amp; Payout Guard</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                5% restaurant GST is remitted directly under Section 9(5) CGST (GSTIN: 18AFXPH9838M1Z9, Assam - 788710). Double-entry paise accounting ensures exact T+1 settlement without platform deductions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </VendorShell>
  );
}
