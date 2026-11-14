import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  AlertCircle,
  UtensilsCrossed,
  Clock,
  Wallet,
  Scale,
  FileText,
  ChefHat,
  Zap,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Flame,
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
import { useVendor } from "@/components/use-vendor";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";

export interface OrderKingSparkModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  restaurantId?: string;
  initialQuestion?: string;
}

export interface SparkDialect {
  code: string;
  name: string;
  nativeName: string;
  voiceLang: string;
  greeting: string;
  placeholder: string;
}

export const SPARK_DIALECTS: SparkDialect[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    voiceLang: "en-IN",
    greeting: "Welcome to King Spark! I am your autonomous Kitchen Operations & Financial AI. How may I assist your kitchen today?",
    placeholder: "Ask about live orders, stock 86, rush prep, disputes, or daily payout...",
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    voiceLang: "hi-IN",
    greeting: "किंग स्पार्क में आपका स्वागत है! मैं आपका किचन ऑपरेशंस और वित्तीय AI साथी हूँ। आज किचन में क्या मदद करूँ?",
    placeholder: "ऑर्डर, 86 स्टॉक, रश मोड, विवाद या आज के पेआउट के बारे में पूछें...",
  },
  {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    voiceLang: "bn-IN",
    greeting: "কিং স্পার্কে স্বাগতম! আমি আপনার কিচেন অপারেশনস এবং পেমেন্ট AI সহকারী। আজ কীভাবে সাহায্য করতে পারি?",
    placeholder: "অর্ডার, স্টক বন্ধ, কিচেন রাশ বা দৈনিক পেআউট সম্পর্কে জানতে চান...",
  },
  {
    code: "as",
    name: "Assamese",
    nativeName: "অসমীয়া",
    voiceLang: "as-IN",
    greeting: "কিং স্পাৰ্কলৈ স্বাগতম! মই আপোনাৰ ৰান্ধনীশালৰ কাম-কাজ আৰু বিত্তীয় AI সহায়ক। আজি কেনেদৰে সহায় কৰিব পাৰোঁ?",
    placeholder: "অৰ্ডাৰ, ষ্টক আউট, কিচেন ৰাশ বা দৈনিক পেআউটৰ বিষয়ে সোধক...",
  },
  {
    code: "gu",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    voiceLang: "gu-IN",
    greeting: "કિંગ સ્પાર્કમાં આપનું સ્વાગત છે! હું તમારો કિચન ઑપરેશન્સ અને નાણાકીય AI સહાયક છું.",
    placeholder: "ઓર્ડર, સ્ટોક, રશ મોડ અથવા દૈનિક ચુકવણી વિશે પૂછો...",
  },
  {
    code: "mr",
    name: "Marathi",
    nativeName: "मराठी",
    voiceLang: "mr-IN",
    greeting: "किंग स्पार्क मध्ये आपले स्वागत आहे! मी आपला किचन ऑपरेशन्स आणि आर्थिक AI सहाय्यक आहे.",
    placeholder: "ऑर्डर्स, स्टॉक, रश मोड किंवा आजच्या पेआउटबद्दल विचारा...",
  },
  {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    voiceLang: "ta-IN",
    greeting: "கிங் ஸ்பார்க்கிற்கு வரவேற்கிறோம்! நான் உங்கள் சமையலறை செயல்பாடுகள் மற்றும் நிதி AI உதவியாளர்.",
    placeholder: "ஆர்டர்கள், ஸ்டாக், ரஷ் பயன்முறை அல்லது தினசரி செலுத்துதல் பற்றி கேளுங்கள்...",
  },
  {
    code: "te",
    name: "Telugu",
    nativeName: "తెలుగు",
    voiceLang: "te-IN",
    greeting: "కింగ్ స్పార్క్‌కి స్వాగతం! నేను మీ కిచెన్ ఆపరేషన్స్ మరియు ఫైనాన్షియల్ AI సహాయకుడిని.",
    placeholder: "ఆర్డర్లు, స్టాక్, రష్ మోడ్ లేదా రోజువారీ చెల్లింపుల గురించి అడగండి...",
  },
  {
    code: "kn",
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    voiceLang: "kn-IN",
    greeting: "ಕಿಂಗ್ ಸ್ಪಾರ್ಕ್‌ಗೆ ಸುಸ್ವಾಗತ! ನಾನು ನಿಮ್ಮ ಕಿಚನ್ ಕಾರ್ಯಾಚರಣೆ ಮತ್ತು ಹಣಕಾಸು AI ಸಹಾಯಕ.",
    placeholder: "ಆರ್ಡರ್‌ಗಳು, ಸ್ಟಾಕ್, ರಶ್ ಮೋಡ್ ಅಥವಾ ದೈನಂದಿನ ಪಾವತಿಗಳ ಬಗ್ಗೆ ಕೇಳಿ...",
  },
  {
    code: "ml",
    name: "Malayalam",
    nativeName: "മലയാളം",
    voiceLang: "ml-IN",
    greeting: "കിംഗ് സ്പാർക്കിലേക്ക് സ്വാഗതം! ഞാൻ നിങ്ങളുടെ കിച്ചൺ പ്രവർത്തനങ്ങളുടെയും സാമ്പത്തിക AI അസിസ്റ്റന്റാണ്.",
    placeholder: "ഓർഡറുകൾ, സ്റ്റോക്ക്, റഷ് മോഡ് അല്ലെങ്കിൽ പ്രതിദിന പേഔട്ട് എന്നിവയെക്കുറിച്ച് ചോദിക്കുക...",
  },
  {
    code: "pa",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    voiceLang: "pa-IN",
    greeting: "ਕਿੰਗ ਸਪਾਰਕ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ! ਮੈਂ ਤੁਹਾਡਾ ਕਿਚਨ ਓਪਰੇਸ਼ਨ ਅਤੇ ਵਿੱਤੀ AI ਸਹਾਇਕ ਹਾਂ।",
    placeholder: "ਆਰਡਰ, ਸਟਾਕ, ਰਸ਼ ਮੋਡ ਜਾਂ ਰੋਜ਼ਾਨਾ ਅਦਾਇਗੀ ਬਾਰੇ ਪੁੱਛੋ...",
  },
];

interface ChatMessage {
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

export function OrderKingSparkModal({
  isOpen = false,
  onClose,
  restaurantId: propRestaurantId,
  initialQuestion,
}: OrderKingSparkModalProps) {
  const qc = useQueryClient();
  const vendor = useVendor();
  const activeRestaurantId = propRestaurantId || vendor.restaurantId;
  const restaurantName = vendor.selected?.restaurantName || "Kitchen Desk";

  const [selectedLang, setSelectedLang] = useState<SparkDialect>(SPARK_DIALECTS[0]);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [inputQuestion, setInputQuestion] = useState(initialQuestion || "");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<
    Array<{ name: string; content: string; type: string }>
  >([]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "spark-welcome",
      sender: "spark",
      text: SPARK_DIALECTS[0].greeting,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load menu items for stockout actions
  const menuQ = useQuery({
    queryKey: ["menu", activeRestaurantId],
    queryFn: () => getMenu({ data: { restaurantId: activeRestaurantId } }),
    enabled: Boolean(activeRestaurantId && isOpen),
  });

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  // Update greeting when language changes
  const handleLanguageChange = (code: string) => {
    const dialect = SPARK_DIALECTS.find((d) => d.code === code) || SPARK_DIALECTS[0];
    setSelectedLang(dialect);
    toast.success(`Language switched to ${dialect.nativeName} (${dialect.name})`);
  };

  // Text to Speech
  const speakResponse = (text: string) => {
    if (!ttsEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*_#`]/g, "").slice(0, 300);
      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = selectedLang.voiceLang;
      utter.rate = 1.0;
      window.speechSynthesis.speak(utter);
    } catch {}
  };

  // Speech to Text (Voice Recognition)
  const toggleVoiceInput = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Voice input is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
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
      recognition.lang = selectedLang.voiceLang;

      recognition.onstart = () => {
        setIsListening(true);
        toast.info(`Listening in ${selectedLang.nativeName}... Speak your command.`);
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

  // File Upload Handling
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

  // Dispatch and Handle Messages
  const handleSendMessage = async (textOverride?: string) => {
    const questionText = (textOverride ?? inputQuestion).trim();
    const currentAttachments = [...pendingAttachments];

    if (!questionText && currentAttachments.length === 0) return;

    const userMsg: ChatMessage = {
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
      // 1. Check local autonomous action dispatcher first (zero latency)
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
        const sparkMsg: ChatMessage = {
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

      // 2. Call server askAssistant (Gemini 2.5 Flash + PostgreSQL live snapshot)
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
        const sparkMsg: ChatMessage = {
          id: `spark-${Date.now()}`,
          sender: "spark",
          text: res.text,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, sparkMsg]);
        speakResponse(sparkMsg.text);
      } else {
        // Fallback to orderKingSpark local query handler
        const fallback = orderKingSpark.handleRestaurantQuery(questionText);
        const sparkMsg: ChatMessage = {
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
      const sparkMsg: ChatMessage = {
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

  // Quick Action: 1-Tap Stockout (86)
  const triggerStockoutAction = () => {
    const sparkMsg: ChatMessage = {
      id: `spark-stockout-${Date.now()}`,
      sender: "spark",
      text: "Select any dish below to instantly mark it as Sold Out (86) or restore it to Available stock. Active on customer apps in real time.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      actionCardType: "STOCKOUT",
    };
    setMessages((prev) => [...prev, sparkMsg]);
    speakResponse(sparkMsg.text);
  };

  // Quick Action: Kitchen Rush Mode
  const triggerRushModeAction = () => {
    const sparkMsg: ChatMessage = {
      id: `spark-rush-${Date.now()}`,
      sender: "spark",
      text: "Kitchen rush buffer controls: Adjust your preparation time buffer to prevent late order penalties during peak dinner or lunch hours.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      actionCardType: "RUSH",
    };
    setMessages((prev) => [...prev, sparkMsg]);
    speakResponse(sparkMsg.text);
  };

  // Quick Action: Daily Shift Financial Recon
  const triggerReconAction = () => {
    const recon = orderKingSpark.generateDailyShiftRecon("Today");
    const sparkMsg: ChatMessage = {
      id: `spark-recon-${Date.now()}`,
      sender: "spark",
      text: `Daily Shift & Financial Recon Report Generated:\nDelivered Orders: ${recon.totalDeliveredOrders} | Gross Sales: ${formatINR(recon.grossCustomerSpendPaise)}\nPlatform Commission: ₹0.00 (0%)\nStatutory GST Sec 9(5): ${formatINR(recon.gst95RemittedByPlatformPaise)}\nNet Bank Payout: ${formatINR(recon.netPayoutAccruedPaise)} (T+1 Daily Deposit)`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      actionCardType: "RECON",
      reconData: recon,
    };
    setMessages((prev) => [...prev, sparkMsg]);
    speakResponse(sparkMsg.text);
  };

  // Quick Action: Dispute Arbitration
  const triggerDisputeAction = () => {
    const sampleDispute: SparkDisputeCase = {
      disputeId: `disp-${Date.now()}`,
      orderId: "ORD-9421",
      customerName: "Rahul Sharma",
      complaintType: "FOOD_SPILL",
      complaintText: "Curry container arrived crushed and spilled inside delivery bag.",
      claimAmountPaise: 38000,
      prepTimeMinutes: 18,
      transitTimeMinutes: 38,
      spillPhotoSubmitted: true,
      sealIntactReported: true,
    };
    const decision = orderKingSpark.arbitrateDispute(sampleDispute);
    const sparkMsg: ChatMessage = {
      id: `spark-dispute-${Date.now()}`,
      sender: "spark",
      text: `Dispute Case #ORD-9421 Arbitrated:\n• Finding: ${decision.legalSenseRationale}\n• Merchant Liability: ₹0.00 (Protected)\n• Logistics Liability: ${formatINR(decision.logisticsLiabilityPaise)}\n• Statutory GST Reversal: ${formatINR(decision.gstReversalPaise)} under Section 9(5) CGST.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      actionCardType: "DISPUTE",
      disputeData: decision,
    };
    setMessages((prev) => [...prev, sparkMsg]);
    speakResponse(sparkMsg.text);
  };

  // Quick Action: Menu Combos & Intelligence
  const triggerCombosAction = () => {
    const rawItems = (menuQ.data as any)?.items || [];
    const sparkItems = rawItems.map((i: any) => ({
      id: i.id,
      name: i.name,
      category: "Main Course",
      pricePaise: 24000,
      isAvailable: true,
      preparationMinutes: i.prep_minutes || 20,
      totalOrdersToday: 8,
      diet: i.diet || "NONVEG",
    }));

    const combos = orderKingSpark.generateComboRecommendations(sparkItems);
    const sparkMsg: ChatMessage = {
      id: `spark-combos-${Date.now()}`,
      sender: "spark",
      text: "Menu Intelligence: Here are high-converting combo pairings recommended from your active dishes to expand Average Order Value (AOV):",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      actionCardType: "COMBOS",
      comboData: combos,
    };
    setMessages((prev) => [...prev, sparkMsg]);
    speakResponse(sparkMsg.text);
  };

  // Apply Stockout directly from Card
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
      toast.error("Failed to update item availability.");
    }
  };

  // Apply Rush Mode directly from Card
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
      toast.error("Failed to update kitchen prep buffer.");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="King Spark AI Kitchen Assistant"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="relative flex h-[92dvh] sm:h-[86vh] w-full max-w-2xl flex-col rounded-t-3xl sm:rounded-3xl border border-amber-500/30 bg-[#0B0F19] text-white shadow-2xl overflow-hidden font-sans">
        {/* Luxury Gold & Obsidian Header */}
        <header className="flex items-center justify-between border-b border-amber-500/20 bg-gradient-to-r from-[#111827] via-[#0F172A] to-[#111827] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-slate-950 shadow-md shadow-amber-500/20">
              <Sparkles className="size-5 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-black tracking-wide text-white">
                  King Spark AI
                </span>
                <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  Kitchen Operations
                </span>
              </div>
              <div className="text-xs text-slate-400 truncate max-w-[200px]">
                {restaurantName}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <select
              value={selectedLang.code}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="h-8 appearance-none rounded-xl border border-amber-500/30 bg-slate-900 px-2.5 text-xs font-semibold text-amber-200 outline-none hover:border-amber-400 cursor-pointer"
              title="Select Regional Indian Language"
            >
              {SPARK_DIALECTS.map((d) => (
                <option key={d.code} value={d.code} className="bg-slate-900 text-white">
                  {d.nativeName} ({d.name})
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
                toast.info(next ? "Voice speech synthesis enabled" : "Voice speech muted");
              }}
              className={cn(
                "flex size-8 items-center justify-center rounded-xl border transition cursor-pointer",
                ttsEnabled
                  ? "border-amber-400 bg-amber-400/20 text-amber-300 shadow-xs"
                  : "border-slate-700 bg-slate-900 text-slate-400 hover:text-white"
              )}
              title={ttsEnabled ? "Mute Voice Reading" : "Enable Voice Reading"}
              aria-label={ttsEnabled ? "Mute Voice" : "Enable Voice"}
            >
              {ttsEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </button>

            {/* Close Button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                aria-label="Close Assistant"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </header>

        {/* 1-Tap Quick Action Chips */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800/80 bg-slate-950/60 px-4 py-2 scrollbar-none">
          <button
            type="button"
            onClick={triggerStockoutAction}
            className="shrink-0 flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-[11px] font-bold text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
          >
            <UtensilsCrossed className="size-3 text-rose-400" />
            <span>86 Item (Sold Out)</span>
          </button>
          <button
            type="button"
            onClick={triggerRushModeAction}
            className="shrink-0 flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-300 hover:bg-amber-500/20 transition cursor-pointer"
          >
            <Zap className="size-3 text-amber-400" />
            <span>Rush Mode (+15m)</span>
          </button>
          <button
            type="button"
            onClick={triggerReconAction}
            className="shrink-0 flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20 transition cursor-pointer"
          >
            <Wallet className="size-3 text-emerald-400" />
            <span>Today's Shift Recon</span>
          </button>
          <button
            type="button"
            onClick={triggerDisputeAction}
            className="shrink-0 flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-bold text-blue-300 hover:bg-blue-500/20 transition cursor-pointer"
          >
            <Scale className="size-3 text-blue-400" />
            <span>Dispute &amp; Spills</span>
          </button>
          <button
            type="button"
            onClick={triggerCombosAction}
            className="shrink-0 flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-[11px] font-bold text-purple-300 hover:bg-purple-500/20 transition cursor-pointer"
          >
            <TrendingUp className="size-3 text-purple-400" />
            <span>Menu Intelligence</span>
          </button>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn("flex flex-col gap-1.5", m.sender === "user" ? "items-end" : "items-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed",
                  m.sender === "user"
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-medium rounded-tr-xs shadow-md shadow-amber-500/10"
                    : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-xs shadow-sm"
                )}
              >
                {/* Attachments preview if user sent any */}
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

                <div className="whitespace-pre-wrap font-sans">{m.text}</div>

                {/* INTERACTIVE CARD: 1-Tap Stockout (86) */}
                {m.actionCardType === "STOCKOUT" && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                    <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                      <UtensilsCrossed className="size-3.5" />
                      <span>Live Menu Availability Toggles:</span>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {((menuQ.data as any)?.items || []).slice(0, 6).map((item: any) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-2 text-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-semibold text-white truncate">{item.name}</div>
                            <div className="text-[10px] text-slate-400">
                              {item.diet === "VEG" ? "Veg" : "Non-Veg"}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleStock(item.id, "sold_out")}
                              className="rounded-lg bg-rose-500/20 border border-rose-500/40 px-2.5 py-1 text-[10px] font-bold text-rose-300 hover:bg-rose-500/30 transition cursor-pointer"
                            >
                              86 (Sold Out)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStock(item.id, "available")}
                              className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-[10px] font-bold text-emerald-300 hover:bg-emerald-500/30 transition cursor-pointer"
                            >
                              In Stock
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* INTERACTIVE CARD: Rush Prep Mode */}
                {m.actionCardType === "RUSH" && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                    <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                      <Zap className="size-3.5" />
                      <span>Select Kitchen Buffer:</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSetRush("RUSH")}
                        className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-2 text-left hover:bg-amber-500/20 transition cursor-pointer"
                      >
                        <div className="text-xs font-bold text-amber-300">Rush Mode (35m)</div>
                        <div className="text-[10px] text-slate-400">Peak demand buffer</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetRush("NORMAL")}
                        className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-2 text-left hover:bg-emerald-500/20 transition cursor-pointer"
                      >
                        <div className="text-xs font-bold text-emerald-300">Standard (20m)</div>
                        <div className="text-[10px] text-slate-400">Normal prep buffer</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetRush("PAUSE")}
                        className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-2 text-left hover:bg-rose-500/20 transition cursor-pointer"
                      >
                        <div className="text-xs font-bold text-rose-300">Pause Storefront</div>
                        <div className="text-[10px] text-slate-400">Pause incoming orders</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetRush("RESUME")}
                        className="rounded-xl border border-blue-500/40 bg-blue-500/10 p-2 text-left hover:bg-blue-500/20 transition cursor-pointer"
                      >
                        <div className="text-xs font-bold text-blue-300">Resume Storefront</div>
                        <div className="text-[10px] text-slate-400">Accept live orders</div>
                      </button>
                    </div>
                  </div>
                )}

                {/* INTERACTIVE CARD: Dispute Decision */}
                {m.actionCardType === "DISPUTE" && m.disputeData && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 rounded-xl bg-slate-950/80 p-3">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-300">Arbitration Decision</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[9px] font-black uppercase",
                          m.disputeData.liability === "LOGISTICS"
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            : m.disputeData.liability === "MERCHANT"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        )}
                      >
                        {m.disputeData.liability} LIABLE
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300">{m.disputeData.legalSenseRationale}</div>
                    <div className="grid grid-cols-2 gap-2 pt-1 text-[10px]">
                      <div className="rounded-lg bg-slate-900 p-2 border border-slate-800">
                        <span className="text-slate-400">Merchant Charge:</span>
                        <div className="font-bold text-white">
                          {formatINR(m.disputeData.merchantLiabilityPaise)}
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-900 p-2 border border-slate-800">
                        <span className="text-slate-400">Sec 9(5) Tax Reversal:</span>
                        <div className="font-bold text-emerald-400">
                          {formatINR(m.disputeData.gstReversalPaise)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* INTERACTIVE CARD: Daily Shift Recon */}
                {m.actionCardType === "RECON" && m.reconData && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 rounded-xl bg-slate-950/80 p-3">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                      <span>Shift Settlement Summary ({m.reconData.shiftDate})</span>
                      <span className="text-emerald-400 font-mono">T+1 Bank Transfer</span>
                    </div>
                    <div className="space-y-1 text-[10px]">
                      <div className="flex justify-between text-slate-300">
                        <span>Delivered Orders:</span>
                        <span className="font-bold text-white">{m.reconData.totalDeliveredOrders} orders</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Gross Food &amp; Packaging:</span>
                        <span className="font-bold text-white">
                          {formatINR(m.reconData.grossCustomerSpendPaise)}
                        </span>
                      </div>
                      <div className="flex justify-between text-emerald-400">
                        <span>Platform Commission:</span>
                        <span className="font-bold">₹0.00 (0%)</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>5% CGST Sec 9(5) (Remitted):</span>
                        <span className="font-bold text-amber-300">
                          {formatINR(m.reconData.gst95RemittedByPlatformPaise)}
                        </span>
                      </div>
                      <div className="pt-1.5 border-t border-slate-800 flex justify-between text-xs font-black text-emerald-400">
                        <span>Net Bank Payout Accrued:</span>
                        <span>{formatINR(m.reconData.netPayoutAccruedPaise)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* INTERACTIVE CARD: Recommended Combos */}
                {m.actionCardType === "COMBOS" && m.comboData && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                    {m.comboData.map((combo) => (
                      <div
                        key={combo.id}
                        className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-2.5 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold text-white">
                          <span className="truncate">{combo.name}</span>
                          <span className="text-purple-300">{formatINR(combo.bundlePricePaise)}</span>
                        </div>
                        <div className="text-[10px] text-slate-300">{combo.description}</div>
                        <div className="flex items-center justify-between text-[10px] pt-1 text-slate-400">
                          <span>Margin: {combo.merchantGrossMarginPercent}%</span>
                          <span className="text-emerald-400 font-bold">
                            +{combo.projectedAovLiftPercent}% AOV Lift
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <span className="text-[10px] text-slate-500 px-1">{m.timestamp}</span>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-xs text-amber-300 w-fit">
              <Loader2 className="size-4 animate-spin text-amber-400" />
              <span>King Spark is analyzing kitchen data...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Dock */}
        <footer className="border-t border-slate-800 bg-[#0F172A] p-3 sm:p-4 space-y-2">
          {/* Pending Attachments Strip */}
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
            {/* Attachment Button */}
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
              title="Attach photo of dish, physical bill, or menu card"
              aria-label="Attach File"
            >
              <Paperclip className="size-4 text-amber-400" />
            </button>

            {/* Microphone Button with Pulsating Amber Glow */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={cn(
                "relative flex size-10 shrink-0 items-center justify-center rounded-xl transition cursor-pointer",
                isListening
                  ? "bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 ring-4 ring-amber-400/70 shadow-[0_0_20px_rgba(251,191,36,0.8)] animate-pulse"
                  : "border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
              title={isListening ? "Stop Listening" : "Speak in your language (Voice Concierge)"}
              aria-label={isListening ? "Stop listening" : "Activate voice input"}
            >
              {isListening ? (
                <MicOff className="size-4 animate-bounce" />
              ) : (
                <Mic className="size-4 text-amber-400" />
              )}
            </button>

            {/* Question Input */}
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder={isListening ? "Listening to your voice..." : selectedLang.placeholder}
              className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-400"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={(!inputQuestion.trim() && pendingAttachments.length === 0) || isLoading}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-bold hover:brightness-110 active:scale-95 transition disabled:opacity-40 cursor-pointer shadow-md shadow-amber-500/20"
              aria-label="Send message"
            >
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </button>
          </form>

          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-3 text-emerald-400" />
              <span>Section 9(5) CGST Dual-Bucket Compliance (Assam - 788710)</span>
            </span>
            <span>T+1 Direct Bank Deposit</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
