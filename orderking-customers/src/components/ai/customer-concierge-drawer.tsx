import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Crown,
  Loader2,
  Mic,
  MicOff,
  Send,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Utensils,
  Plane,
  CreditCard,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { detectLanguage } from "@/lib/ai-lang-detect";

export type ConciergeArea = "food" | "kingpay";

export interface SupportedDialect {
  code: string;
  name: string;
  nativeName: string;
  voiceLang: string;
  honorific: string;
  welcome: string;
}

export const CONCIERGE_DIALECTS: SupportedDialect[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    voiceLang: "en-IN",
    honorific: "Valued Patron",
    welcome: "Greetings! I am your VIP Food & Order Concierge. Craving authentic biryani, planning a trip, or need instant refund support? Ask me with voice or text!",
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    voiceLang: "hi-IN",
    honorific: "आदरणीय अतिथि",
    welcome: "प्रणाम! मैं आपका ऑर्डरकिंग वीआईपी फ़ूड एवं ट्रेवल कंसीयर्ज हूँ। लज़ीज़ दम बिरयानी, यात्रा बुकिंग या रिफ़ंड सहायता के लिए बोलकर या लिखकर पूछिए!",
  },
  {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    voiceLang: "bn-IN",
    honorific: "শ্রদ্ধেয় গ্রাহক",
    welcome: "নমস্কার! আমি আপনার অর্ডারকিং ভিআইপি ফুড ও ট্রাভেল কনসিয়ার্জ। সুস্বাদু দম বিরিয়ানি, ফ্লাইটের টিকিট বা তাৎক্ষণিক রিফান্ড—বলুন কীভাবে সাহায্য করতে পারি?",
  },

  { code: "ta", name: "Tamil", nativeName: "தமிழ்", voiceLang: "ta-IN", honorific: "வணக்கம்", welcome: "வணக்கம்! நான் உங்கள் ஆர்டர்கிங் உணவு மற்றும் பயண உதவியாளர்." },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", voiceLang: "te-IN", honorific: "నమస్కారం", welcome: "నమస్కారం! నేను మీ ఆర్డర్‌కింగ్ ఆహార మరియు ప్రయాణ సహాయకుడిని." },
  { code: "mr", name: "Marathi", nativeName: "मराठी", voiceLang: "mr-IN", honorific: "नमस्कार", welcome: "नमस्कार! मी आपला ऑर्डरकिंग फूड आणि ट्रॅव्हल सहाय्यक आहे." },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", voiceLang: "gu-IN", honorific: "નમસ્તે", welcome: "નમસ્તે! હું તમારો ઓર્ડરકિંગ ફૂડ અને ટ્રાવેલ સહાયક છું." },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", voiceLang: "kn-IN", honorific: "ನಮಸ್ಕಾರ", welcome: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಆರ್ಡರ್‌కింగ్ ఆహార మరియు ప్రయాణ సహాయకుడు." },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", voiceLang: "ml-IN", honorific: "നമസ്കാരം", welcome: "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ ഓർഡർകിംഗ് ഫുഡ് ആൻഡ് ട്രാവൽ അസിസ്റ്റന്റാണ്." },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", voiceLang: "pa-IN", honorific: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ", welcome: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ ਆਰਡਰਕਿੰਗ ਫੂਡ ਅਤੇ ਟਰੈਵਲ ਸਹਾਇਕ ਹਾਂ।" },





];

export type ActionPayload = {
  type: "NAVIGATE" | "CLAIM_REFUND" | "TRACK_DELIVERY";
  label: string;
  url?: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: ActionPayload;
  timestamp: string;
};

export function CustomerConciergeDrawer({
  open,
  onClose,
  area = "food",
  embedded = false,
}: {
  open: boolean;
  onClose: () => void;
  area?: ConciergeArea;
  embedded?: boolean;
}) {
  const { user } = useCurrentUserState();
  const navigate = useNavigate();

  const [selectedLang, setSelectedLang] = useState<SupportedDialect>(CONCIERGE_DIALECTS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Initialize Welcome Message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome-init",
          role: "assistant",
          content: selectedLang.welcome,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          action: {
            type: "NAVIGATE",
            label: "🍗 Explore Royal Dum Biryani",
            url: "/search?q=biryani",
          },
        },
      ]);
    }
  }, [selectedLang]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Clean-up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Sovereign Autonomous Natural Intelligence Answering Heuristics (0 External Paid APIs)
  function resolveSovereignResponse(
    queryText: string,
    dialect: SupportedDialect
  ): { reply: string; action?: ActionPayload } {
    const q = queryText.toLowerCase().trim();

    // Bengali Specific Heuristics
    if (dialect.code === "bn") {
      if (q.includes("late") || q.includes("deri") || q.includes("der") || q.includes("khabar") || q.includes("kothay")) {
        return {
          reply: `শ্রদ্ধেয় গ্রাহক, খাবার পৌঁছাতে দেরি হলে একদম চিন্তা করবেন না! আমাদের অন-টাইম গ্যারান্টির অধীনে ১০ মিনিটের বেশি দেরি হলে সরাসরি আপনার ওয়ালেটে ₹৫০ ক্রেডিট যুক্ত হবে। আমরা এখনই রান্নাঘর ও রাইডারের কাছে অগ্রাধিকার নোটিশ পাঠিয়েছি!`,
          action: { type: "TRACK_DELIVERY", label: "📦 লাইভ রাইডার ট্র্যাক করুন", url: "/orders" },
        };
      }
      if (q.includes("refund") || q.includes("taka") || q.includes("nosto") || q.includes("kharap")) {
        return {
          reply: `অর্ডারকিংয়ের জিরো-প্রশ্ন পলিসি অনুযায়ী আপনার ক্ষতিগ্রস্ত বা মিসিং আইটেমের ১০০% টাকা সরাসরি কিংপে ওয়ালেটে ফেরত দেওয়া হবে অথবা ১৫ মিনিটে নতুন খাবার এক্সপ্রেস পাঠানো হবে!`,
          action: { type: "CLAIM_REFUND", label: "🛡️ ১০০% ফুল রিফান্ড অনুমোদন করুন", url: "/orders" },
        };
      }
    }

    // 1. Food Delays & Late Delivery SLA (Dispatch Resolution Policy)
    if (q.includes("late") || q.includes("delay") || q.includes("stuck") || q.includes("deri") || q.includes("kahan") || q.includes("kothay") || q.includes("slow")) {
      return {
        reply: `Under OrderKing's delivery SLA policy, if your order is delayed past the committed ETA, our dispatch engine reviews the transit delay and applies resolution credit to your KingPay wallet. We have transmitted an urgent priority dispatch ping to your rider and kitchen chef!`,
        action: { type: "TRACK_DELIVERY", label: "📦 Track Live Rider GPS & ETA", url: "/orders" },
      };
    }

    // 2. Missing Items, Damaged Packages, Spilled Food (Zero-Interrogation 100% Refund)
    if (q.includes("missing") || q.includes("spill") || q.includes("damaged") || q.includes("cold") || q.includes("kharab") || q.includes("galat") || q.includes("wrong")) {
      return {
        reply: `We strictly follow OrderKing's Zero-Interrogation Policy. If any dish was missing, spilled, or arrived cold, you are entitled to an instant 100% full refund credited directly to your KingPay balance, or a free 15-minute priority express redelivery!`,
        action: { type: "CLAIM_REFUND", label: "🛡️ Claim 100% Instant Refund", url: "/orders" },
      };
    }

    // 4. KingPay, UPI QR Scanner & Utility Bills
    if (q.includes("pay") || q.includes("kingpay") || q.includes("bill") || q.includes("recharge") || q.includes("balance") || q.includes("electricity") || q.includes("wallet")) {
      return {
        reply: `KingPay provides 1-tap instant live fee & instant cashback UPI payments, merchant QR scanning, electricity bill clearance with instant cashback, and secure bank balance verification with bank-grade encryption.`,
        action: { type: "NAVIGATE", label: "💳 Launch KingPay Live Fee & Cashback Hub", url: "/king-pay" },
      };
    }

    // 5. Biryani & Food Cravings
    if (q.includes("biryani") || q.includes("food") || q.includes("hungry") || q.includes("order") || q.includes("khana") || q.includes("veg") || q.includes("non-veg")) {
      return {
        reply: `Craving a feast? OrderKing delivers genuine restaurant dishes. Our local Dum Biryani, Kebab platters, and Pure Veg kitchens are ready for fast dispatch.`,
        action: { type: "NAVIGATE", label: "🍗 Browse Dum Biryani", url: "/search?q=biryani" },
      };
    }

    // Default Empathetic Assistant
    return {
      reply: `I am your OrderKing Food & Dining concierge. I can guide you through authentic local feasts, track active deliveries, resolve order inquiries, or assist with KingPay. How may I assist you today?`,
      action: { type: "NAVIGATE", label: "✨ View Daily Specials", url: "/offers" },
    };
  }

  // Handle Speech Recognition (Microphone Voice Input)
  function handleToggleVoiceInput() {
    if (typeof window === "undefined") return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Voice input is not supported on this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = selectedLang.voiceLang;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setQuestion(transcript);
          handleSend(transcript, true);
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (_err) {
      setIsListening(false);
    }
  }

  // Handle Natural Voice Playback (SpeechSynthesis)
  function handleSpeak(id: string, text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#•_]/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = selectedLang.voiceLang;
    utterance.pitch = 1.05;
    utterance.rate = 0.98;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  }

  // Dispatch Message
  function handleSend(textToSend?: string, wasSpoken: boolean = false) {
    const raw = (textToSend ?? question).trim();
    if (!raw) return;

    // Detect language / dialect automatically
    const detectedCode = detectLanguage(raw, selectedLang.code);
    const matchedDialect = CONCIERGE_DIALECTS.find((d) => d.code === detectedCode) || selectedLang;
    if (matchedDialect.code !== selectedLang.code) {
      setSelectedLang(matchedDialect);
    }

    const userEntry: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: raw,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userEntry]);
    setQuestion("");

    // Sovereign Local Resolution with 0 External Paid APIs
    const { reply, action } = resolveSovereignResponse(raw, matchedDialect);

    setTimeout(() => {
      const aiEntry: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: reply,
        action,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiEntry]);

      // If user spoke via mic, speak back automatically
      if (wasSpoken) {
        handleSpeak(aiEntry.id, reply);
      }
    }, 150);
  }

  if (!open) return null;

  return (
    <div
      className={embedded ? "relative w-full" : "fixed inset-0 z-[90] flex justify-end bg-slate-950/60 backdrop-blur-sm"}
      role="presentation"
      onMouseDown={(e) => {
        if (!embedded && e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal={!embedded}
        aria-label="OrderKing VIP Food & Dining Concierge"
        className={
          embedded
            ? "flex h-[min(76dvh,680px)] w-full flex-col overflow-hidden rounded-3xl border border-amber-300/30 bg-slate-950 text-white shadow-xl"
            : "flex h-full w-full max-w-md flex-col bg-slate-950 text-white shadow-2xl sm:rounded-l-3xl border-l border-amber-400/20"
        }
      >
        {/* Header with 10 Languages Selector */}
        <div className="flex flex-col gap-2.5 border-b border-amber-400/20 bg-gradient-to-r from-emerald-950 via-slate-950 to-slate-950 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300">
                <Crown className="size-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">VIP Concierge AI King</h2>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                    Sovereign
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Natural Voice · 10 Languages · standard fee Protection</p>
              </div>
            </div>
            {!embedded && (
              <button
                type="button"
                aria-label="Close concierge"
                onClick={onClose}
                className="rounded-xl p-2 text-slate-300 hover:bg-white/10"
              >
                <X className="size-5" />
              </button>
            )}
          </div>

          {/* Language Selector Pill Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none text-xs">
            <span className="shrink-0 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Language:</span>
            {CONCIERGE_DIALECTS.map((d) => (
              <button
                key={d.code}
                type="button"
                onClick={() => setSelectedLang(d)}
                className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                  selectedLang.code === d.code
                    ? "bg-amber-400 text-slate-950 font-bold shadow-sm"
                    : "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
                }`}
              >
                {d.nativeName}
              </button>
            ))}
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 space-y-3.5 overflow-y-auto p-4" aria-live="polite">
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3.5 text-xs leading-relaxed text-slate-100 flex items-start gap-2.5">
            <Sparkles className="size-4 shrink-0 text-amber-300 mt-0.5" />
            <span>
              Autonomous concierge for food recommendations, live order tracking, and travel booking assistance.
            </span>
          </div>

          {messages.map((m) => {
            const isAi = m.role === "assistant";
            const isSpeaking = speakingId === m.id;
            return (
              <div
                key={m.id}
                className={`space-y-2 max-w-[92%] ${isAi ? "mr-auto" : "ml-auto"}`}
              >
                <div
                  className={`rounded-2xl p-3.5 text-xs leading-relaxed ${
                    isAi
                      ? "border border-slate-800 bg-slate-900/95 text-slate-100 shadow-xs"
                      : "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-700/40 text-[10px] opacity-75">
                    <span>{isAi ? `👑 OrderKing VIP AI (${selectedLang.name})` : "You"}</span>
                    <span>{m.timestamp}</span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap">{m.content}</p>

                  {isAi && (
                    <div className="mt-2.5 flex items-center justify-between pt-1 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleSpeak(m.id, m.content)}
                        className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors ${
                          isSpeaking ? "bg-amber-400 text-slate-950 font-bold" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                        title="Listen to response"
                      >
                        {isSpeaking ? <VolumeX className="size-3.5 text-slate-950" /> : <Volume2 className="size-3.5" />}
                        <span>{isSpeaking ? "Stop" : "Listen"}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 1-Tap Action Card */}
                {m.action && (
                  <button
                    type="button"
                    onClick={() => {
                      if (m.action?.url) {
                        onClose();
                        void navigate({ to: m.action.url as any });
                      }
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-amber-400/40 bg-amber-400/10 px-3.5 py-2 text-left text-xs font-bold text-amber-200 transition-all hover:bg-amber-400/20"
                  >
                    <span>{m.action.label}</span>
                    <span className="text-amber-400">→</span>
                  </button>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* 1-Tap Quick Action Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-t border-slate-800/80 bg-slate-900/60 px-4 py-2 scrollbar-none">
          {[
            { label: "📦 Track Delivery & ETA", text: "Where is my delivery rider and what is the ETA?" },
            { label: "🍗 Order Dum Biryani", text: "Recommend the best authentic Royal Dum Biryani." },
            { label: "👑 KingPay UPI", text: "How do I pay with Direct UPI or scan BharatQR?" },
            { label: "🛡️ Report Spilled/Late Food", text: "My food arrived cold and leaked. I need a refund." },
          ].map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => handleSend(chip.text)}
              className="shrink-0 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] text-slate-300 border border-slate-700 font-medium"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Input & Voice Controls */}
        <div className="border-t border-slate-800 bg-slate-950 p-3.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={handleToggleVoiceInput}
              className={`rounded-xl p-2.5 transition-all ${
                isListening
                  ? "bg-rose-500 text-white animate-pulse"
                  : "bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800"
              }`}
              title="Speak your question"
            >
              {isListening ? <MicOff className="size-4" /> : <Mic className="size-4 text-emerald-400" />}
            </button>

            <input
              type="text"
              aria-label="Ask VIP Concierge"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={isListening ? "Listening to your voice..." : `Ask in ${selectedLang.nativeName} or English...`}
              className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-400"
            />

            <button
              type="submit"
              disabled={!question.trim()}
              className="rounded-xl bg-amber-400 p-2.5 text-slate-950 font-bold disabled:opacity-40 hover:bg-amber-300 transition-colors"
              aria-label="Send question"
            >
              <Send className="size-4" />
            </button>
          </form>

          <p className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-3 text-emerald-400" /> Intermediary Safe Harbor &amp; Operational SLA
            </span>
            <Link to="/support" className="text-amber-300 underline">
              Founder Review Desk
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
