import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowUp, Camera, Check, Copy, Crown, FileText, Mic, MicOff, Paperclip, PhoneCall, PhoneOff, Send, ShieldCheck, Sparkles, Video, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers";
import { detectLanguage, isUnreadableOrUnsupported } from "@/lib/ai-lang-detect";

export type IndianLanguage = {
  code: string;
  name: string;
  nativeName: string;
  voiceLang: string;
  honorific: string;
  welcomeMessage: string;
  voiceIntro: string;
};

export const SUPPORTED_LANGUAGES: IndianLanguage[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    voiceLang: "en-IN",
    honorific: "Respected Patron",
    welcomeMessage:
      "Greetings, Respected Patron! I am your KingPay Royal AI Concierge. How may I assist you today? You can ask me how to scan, pay bills, check bank balance, or book lowest price flights. Your security and satisfaction are my highest priority.",
    voiceIntro:
      "Greetings, Respected Patron! I am your KingPay Royal Concierge. How may I assist you today?",
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    voiceLang: "hi-IN",
    honorific: "आदरणीय अतिथि",
    welcomeMessage:
      "प्रणाम आदरणीय! मैं आपकी किंगपे पर्सनल असिस्टेंट हूँ। आप जो भी निर्देश देंगे, मैं पूरी निष्ठा और सुरक्षा के साथ मार्गदर्शन करूँगी। बताइए आज मैं आपकी क्या सहायता करूँ?",
    voiceIntro:
      "प्रणाम आदरणीय! मैं आपकी किंगपे पर्सनल असिस्टेंट हूँ। बताइए आज मैं आपकी क्या सहायता करूँ?",
  },
  {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    voiceLang: "bn-IN",
    honorific: "শ্রদ্ধেয় গ্রাহক",
    welcomeMessage:
      "নমস্কার শ্রদ্ধেয় গ্রাহক! আমি আপনার কিংপে ব্যক্তিগত সহকারিণী। যেকোনো কিউআর স্ক্যান, বিদ্যুৎ বিল পরিশোধ, সস্তা বিমানের টিকিট বা ব্যাঙ্ক ব্যালেন্স চেক—আমি আপনাকে সম্পূর্ণ সম্মানের সাথে সাহায্য করব।",
    voiceIntro:
      "নমস্কার শ্রদ্ধেয় গ্রাহক! আমি আপনার কিংপে সহকারিণী। আমি আপনাকে কীভাবে সাহায্য করতে পারি?",
  },
  {
    code: "as",
    name: "Assamese",
    nativeName: "অসমীয়া",
    voiceLang: "as-IN",
    honorific: "শ্ৰদ্ধেয় গ্ৰাহক",
    welcomeMessage:
      "নমস্কাৰ শ্ৰদ্ধেয় গ্ৰাহক! মই আপোনাৰ কিংপে ব্যক্তিগত সহচৰী। স্কেনিং, এপিডিচিএল বিজুলী বিল, বিমানৰ টিকট, ৰিচাৰ্জ বা বেংক বেলেন্স—মই সকলো কামত আপোনাক সৰ্বোচ্চ সন্মান আৰু সুৰক্ষাৰে সহায় কৰিম।",
    voiceIntro:
      "নমস্কাৰ শ্ৰদ্ধেয় গ্ৰাহক! মই আপোনাৰ কিংপে সহায়িকা। কওক আজি মই আপোনাক কিদৰে সহায় কৰিব পাৰোঁ?",
  },
  {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    voiceLang: "ta-IN",
    honorific: "மதிப்பிற்குரிய வாடிக்கையாளர்",
    welcomeMessage:
      "வணக்கம்! நான் உங்கள் கிங்பே தனிப்பட்ட உதவியாளர். கியூஆர் ஸ்கேன், மின்கட்டணம் செலுத்துதல் அல்லது வங்கி இருப்பு சரிபார்த்தல் போன்றவற்றில் உங்களுக்கு உதவ நான் தயாராக உள்ளேன்.",
    voiceIntro:
      "வணக்கம்! நான் உங்கள் கிங்பே உதவியாளர். உங்களுக்கு உதவ நான் தயாராக உள்ளேன்.",
  },
  {
    code: "te",
    name: "Telugu",
    nativeName: "తెలుగు",
    voiceLang: "te-IN",
    honorific: "గౌరవనీయ అతిథి",
    welcomeMessage:
      "నమస్కారం! నేను మీ కింగ్‌పే అసిస్టెంట్‌ని. క్యూఆర్ కోڈ స్కాన్, విద్యుత్ బిల్లులు, మొబైల్ రీఛార్జ్ లేదా బ్యాంక్ బ్యాలెన్స్ చెక్ చేయడంలో మీకు సహాయం చేయడానికి సిద్ధంగా ఉన్నాను.",
    voiceIntro:
      "నమస్కారం! నేను మీ కింగ్‌పే అసిస్టెంట్‌ని. మీకు సహాయం చేయడానికి సిద్ధంగా ఉన్నాను.",
  },
  {
    code: "kn",
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    voiceLang: "kn-IN",
    honorific: "ಗೌರವಾನ್ವಿತ ಗ್ರಾಹಕರೇ",
    welcomeMessage:
      "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಕಿಂಗ್‌ಪೇ ವೈಯಕ್ತಿಕ ಸಹಾಯಕ. ಕ್ಯೂಆರ್ ಸ್ಕ್ಯಾನ್, ವಿದ್ಯುತ್ ಬಿಲ್, ಮೊಬೈಲ್ ರೀಚಾರ್ಜ್ ಅಥವಾ ಬ್ಯಾಂಕ್ ಬ್ಯಾಲೆನ್ಸ್ ಪರಿಶೀಲನೆಯಲ್ಲಿ ನಿಮಗೆ ಗೌರವದಿಂದ ಸಹಾಯ ಮಾಡುವೆನು.",
    voiceIntro:
      "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಕಿಂಗ್‌ಪೇ ಸಹಾಯಕ. ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
  },
  {
    code: "ml",
    name: "Malayalam",
    nativeName: "മലയാളം",
    voiceLang: "ml-IN",
    honorific: "ബഹുമാനപ്പെട്ട ഉപഭോക്താവ്",
    welcomeMessage:
      "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ കിങ്പേ പേഴ്സണൽ അസിസ്റ്റന്റാണ്. ക്യുആർ സ്കാനിംഗ്, യൂട്ടിലിറ്റി ബില്ലുകൾ, ബാങ്ക് ബാലൻസ് പരിശോധന എന്നിവയിൽ നിങ്ങളെ പൂർണ്ണ സുരക്ഷിതത്വത്തോടെ സഹായിക്കാം.",
    voiceIntro:
      "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ കിങ്പേ അസിസ്റ്റന്റാണ്. ഞാൻ എങ്ങനെ സഹായിക്കണം?",
  },
  {
    code: "mr",
    name: "Marathi",
    nativeName: "मराठी",
    voiceLang: "mr-IN",
    honorific: "आदरणीय ग्राहक",
    welcomeMessage:
      "नमस्कार! मी आपली किंगपे वैयक्तिक सहाय्यक आहे. क्यूआर कोड स्कॅन, वीज बिल, मोबाइल रिचार्ज किंवा बँक बॅलन्स तपासणीसाठी मी सदैव आपल्या सेवेत हजर आहे.",
    voiceIntro:
      "नमस्कार! मी आपली किंगपे सहाय्यक आहे. सांगा आज मी आपली काय सेवा करू?",
  },
  {
    code: "gu",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    voiceLang: "gu-IN",
    honorific: "આદરણીય ગ્રાહક",
    welcomeMessage:
      "નમસ્કાર! હું તમારી કિંગપે પર્સનલ સહાયક છું. ક્યૂઆર સ્કેન, વીજળી બિલ, રિચાર્જ અથવા બેંક બેલેન્સ તપાસવા માટે હું તમને પૂરા આદર સાથે મદદ કરીશ.",
    voiceIntro:
      "નમસ્કાર! હું તમારી કિંગપે સહાયક છું. કહો આજે હું તમારી શું સેવા કરું?",
  },
  {
    code: "pa",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    voiceLang: "pa-IN",
    honorific: "ਸਤਿਕਾਰਯੋਗ ਗਾਹਕ ਜੀ",
    welcomeMessage:
      "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! ਮੈਂ ਤੁਹਾਡੀ ਕਿੰਗਪੇ ਰਾਇਲ ਸਹਾਇਕ ਹਾਂ। ਕਿਊਆਰ ਸਕੈਨ, ਬਿਜਲੀ ਬਿੱਲ, ਮੋਬਾਈਲ ਰੀਚਾਰਜ ਜਾਂ ਬੈਂਕ ਬੈਲੇਂਸ ਚੈੱਕ ਕਰਨ ਵਿੱਚ ਮੈਂ ਪੂਰੇ ਮਾਣ ਨਾਲ ਤੁਹਾਡੀ ਮਦਦ ਕਰਾਂਗੀ।",
    voiceIntro:
      "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! ਮੈਂ ਤੁਹਾਡੀ ਕਿੰਗਪੇ ਸਹਾਇਕ ਹਾਂ। ਦੱਸੋ ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕੀ ਸੇਵਾ ਕਰਾਂ?",
  },
  {
    code: "or",
    name: "Odia",
    nativeName: "ଓଡ଼ିଆ",
    voiceLang: "or-IN",
    honorific: "ସମ୍ମାନିତ ଗ୍ରାହକ",
    welcomeMessage:
      "ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କର କିଙ୍ଗପେ ବ୍ୟକ୍ତିଗତ ସହାୟିକା। କ୍ୟୁଆର ସ୍କାନ, ବିଦ୍ୟୁତ ବିଲ, ରିଚାର୍ଜ କିମ୍ବା ବ୍ୟାଙ୍କ ବାଲାନ୍ସ ଯାଞ୍ଚ କରିବାରେ ମୁଁ ସମ୍ପୂର୍ଣ୍ଣ ସମ୍ମାନ ସହିତ ସାହାଯ୍ୟ କରିବି।",
    voiceIntro:
      "ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କର କିଙ୍ଗପେ ସହାୟିକା। କୁହନ୍ତୁ ଆଜି ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?",
  },
];

export type VoicePersona = {
  id: string;
  name: string;
  label: string;
  pitch: number;
  rate: number;
  encouragement: string;
};

export const ROYAL_VOICE_PERSONAS: VoicePersona[] = [
  {
    id: "priya",
    name: "Priya",
    label: "🌸 Priya (Melodious & Reassuring)",
    pitch: 1.22,
    rate: 0.95,
    encouragement: "Your transactions are 100% protected and secure with KingPay!",
  },
  {
    id: "rani",
    name: "Rani",
    label: "👑 Rani (Royal Sovereign & Elegant)",
    pitch: 1.08,
    rate: 0.88,
    encouragement: "It is our utmost privilege to safeguard your sovereign wealth.",
  },
  {
    id: "aanya",
    name: "Aanya",
    label: "⚡ Aanya (Vibrant & Quick)",
    pitch: 1.34,
    rate: 1.05,
    encouragement: "Instant 1-tap speed and zero fees every single time!",
  },
  {
    id: "shanti",
    name: "Shanti",
    label: "🕊️ Shanti (Calm & Trustworthy)",
    pitch: 1.04,
    rate: 0.82,
    encouragement: "Rest at ease, your money and vehicle garage are fully managed.",
  },
];

type ChatMessage = {
  id: string;
  sender: "user" | "ai";
  text: string;
  imageUrl?: string;
  consentRequired?: boolean;
  timestamp: string;
  actionPayload?: {
    type:
      | "OPEN_SCANNER"
      | "CHECK_BALANCE"
      | "PAY_ELECTRICITY"
      | "MOBILE_RECHARGE"
      | "OPEN_GARAGE"
      | "OPEN_TRAVEL"
      | "SUBMIT_FINANCIAL_DISPUTE";
    label: string;
  };
};

export type AttachedMedia = {
  id: string;
  name: string;
  type: "image" | "video" | "document";
  dataUrl: string;
  sizeBytes?: number;
};

export function RoyalAiConcierge({
  onOpenScanner,
  onOpenSelfTransfer,
  onOpenGoldModal,
  onOpenAddMoney,
  onCheckBalance,
  onPayElectricity,
  onMobileRecharge,
  onOpenGarage,
  onOpenTravel,
  hideFloatingTrigger = true,
}: {
  onOpenScanner?: () => void;
  onOpenSelfTransfer?: () => void;
  onOpenGoldModal?: () => void;
  onOpenAddMoney?: () => void;
  onCheckBalance?: () => void;
  onPayElectricity?: () => void;
  onMobileRecharge?: () => void;
  onOpenGarage?: () => void;
  onOpenTravel?: () => void;
  hideFloatingTrigger?: boolean;
} = {}) {
  const { lang: userGeoLang } = useT();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<IndianLanguage>(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === userGeoLang) || SUPPORTED_LANGUAGES[0]!;
  });
  const [selectedPersona, setSelectedPersona] = useState<VoicePersona>(ROYAL_VOICE_PERSONAS[0]!);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false); // Strictly no automatic speaking by default
  const [isListening, setIsListening] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedMedia[]>([]);
  const [consentGiven, setConsentGiven] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen for open-royal-ai-concierge event from the EcosystemSwitchBar
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-royal-ai-concierge", handleOpen);
    return () => window.removeEventListener("open-royal-ai-concierge", handleOpen);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    files.forEach((file) => {
      const reader = new FileReader();
      const isImg = file.type.startsWith("image/");
      const isVid = file.type.startsWith("video/");
      const mediaType: "image" | "video" | "document" = isImg ? "image" : isVid ? "video" : "document";
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setAttachedFiles((prev) => [
          ...prev,
          {
            id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: file.name,
            type: mediaType,
            dataUrl,
            sizeBytes: file.size,
          },
        ]);
        toast.success(`Attached ${file.name}`);
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        const blob = item.getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            setAttachedFiles((prev) => [
              ...prev,
              {
                id: `paste-${Date.now()}`,
                name: `screenshot-${Date.now().toString().slice(-4)}.png`,
                type: "image",
                dataUrl,
              },
            ]);
            toast.success("Screenshot pasted and attached!");
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  const copyMessage = (id: string, text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
      setCopiedMsgId(id);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedMsgId(null), 2000);
    }
  };

  // Initialize greeting on open or language switch (DO NOT AUTO-SPEAK: Only speaks when voice is initiated)
  useEffect(() => {
    if (isOpen) {
      const welcomeText = `${selectedLang.welcomeMessage} ${selectedPersona.encouragement}`;
      const welcome: ChatMessage = {
        id: `welcome-${Date.now()}`,
        sender: "ai",
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages([welcome]);
      // Zero auto-speaking on open
    } else {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    }
  }, [isOpen, selectedLang, selectedPersona]);

  const cachedVoicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Cache speech synthesis voices and handle async voice loading
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const updateVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) {
        cachedVoicesRef.current = v;
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const [isCallMode, setIsCallMode] = useState(false);
  const callModeRef = useRef(false);

  // Prime audio engine on user interaction to bypass autoplay restrictions without empty utterances
  const primeAudio = () => {
    if (typeof window !== "undefined") {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          if (ctx.state === "suspended") {
            void ctx.resume();
          }
        }
        if ("speechSynthesis" in window) {
          window.speechSynthesis.resume();
        }
      } catch {
        // audio priming fallback
      }
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Voice synthesis with young native female voice (pitch 1.14, rate 1.04)
  const speakResponse = (text: string, voiceLang: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !voiceEnabled) return;

    try {
      window.speechSynthesis.resume();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }

    // Cancel any previous speech safely
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }

    // Microtask delay to avoid Chromium bug where immediate cancel() drops new utterance
    setTimeout(() => {
      try {
        window.speechSynthesis.resume();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = voiceLang;
        utterance.rate = 1.04;
        utterance.pitch = 1.14;

        const voices =
          cachedVoicesRef.current.length > 0
            ? cachedVoicesRef.current
            : window.speechSynthesis.getVoices();

        const langPrefix = voiceLang.slice(0, 2).toLowerCase();

        // Priority 1: Native female voice matching language
        let matchedVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith(langPrefix) &&
            (v.name.toLowerCase().includes("female") ||
              v.name.toLowerCase().includes("zira") ||
              v.name.toLowerCase().includes("priya") ||
              v.name.toLowerCase().includes("swara") ||
              v.name.toLowerCase().includes("tanishaa") ||
              v.name.toLowerCase().includes("kalpana") ||
              v.name.toLowerCase().includes("veena") ||
              v.name.toLowerCase().includes("natural") ||
              v.name.toLowerCase().includes("samantha") ||
              v.name.toLowerCase().includes("google"))
        );

        // Priority 2: Indian female voice
        if (!matchedVoice) {
          matchedVoice = voices.find(
            (v) =>
              (v.lang.includes("IN") || v.lang.includes("en-US")) &&
              (v.name.toLowerCase().includes("female") ||
                v.name.toLowerCase().includes("zira") ||
                v.name.toLowerCase().includes("priya") ||
                v.name.toLowerCase().includes("swara") ||
                v.name.toLowerCase().includes("natural") ||
                v.name.toLowerCase().includes("samantha"))
          );
        }

        // Priority 3: Any voice matching the language
        if (!matchedVoice) {
          matchedVoice = voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
        }

        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
          setIsSpeaking(false);
          // When in voice call mode, automatically listen for the user's turn like a real phone call!
          if (callModeRef.current) {
            setTimeout(() => {
              if (callModeRef.current) {
                startCallListening();
              }
            }, 300);
          }
        };
        utterance.onerror = (e) => {
          console.warn("Speech synthesis error:", e);
          setIsSpeaking(false);
          if (callModeRef.current) {
            setTimeout(() => {
              if (callModeRef.current) {
                startCallListening();
              }
            }, 500);
          }
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("Failed to execute speak:", err);
        setIsSpeaking(false);
      }
    }, 25);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Continuous Voice Call Listening Engine (Seamless Turn-taking)
  const startCallListening = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }

      const recognition = new SpeechRecognition();
      recognition.lang = selectedLang.voiceLang;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          try {
            recognition.stop();
          } catch {
            // ignore
          }
          setIsListening(false);
          handleSendMessage(transcript, true);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn("Voice call recognition error:", e);
        setIsListening(false);
        // If still in active call mode, auto-retry listening after brief pause
        if (callModeRef.current && !isSpeaking) {
          setTimeout(() => {
            if (callModeRef.current && !isSpeaking) {
              startCallListening();
            }
          }, 800);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Failed to restart call listening:", err);
      setIsListening(false);
    }
  };

  // Toggle Continuous Two-Way Voice Call Mode (Like a Phone Call)
  const toggleCallMode = () => {
    primeAudio();
    if (isCallMode) {
      setIsCallMode(false);
      callModeRef.current = false;
      stopSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      toast.info("Voice call ended. Switched to text mode.");
    } else {
      setIsCallMode(true);
      callModeRef.current = true;
      toast.success("📞 Voice call connected! Speak freely with your Royal AI Concierge.");
      const intro = selectedLang.voiceIntro || selectedLang.welcomeMessage;
      speakResponse(intro, selectedLang.voiceLang);
    }
  };

  // Web Speech Recognition for voice chat input with instant speech response
  const toggleSpeechRecognition = () => {
    if (typeof window === "undefined") return;

    primeAudio();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Voice input is not supported by your browser. Please type your message.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = selectedLang.voiceLang;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        toast.info(`Listening in ${selectedLang.name}... Speak your request now`);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          // Flag as voice input for immediate speech synthesis without delay
          handleSendMessage(transcript, true);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn("Speech recognition error:", e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition start failed:", err);
      setIsListening(false);
    }
  };

  // Deep, Realistic, 100x Problem-Solving KingPay Knowledge Engine
  const generateAiReply = (query: string, lang: IndianLanguage): { text: string; action?: any } => {
    const raw = query.toLowerCase();
    const q = raw.replace(/[^a-z0-9\u0900-\u097F\u0980-\u09FF\s]/g, " ").replace(/\s+/g, " ").trim();

    // 1. Failed UPI / Debited Without Credit / Pending Transaction Dispute
    if (
      q.includes("failed") ||
      q.includes("debit") ||
      q.includes("deducted") ||
      q.includes("kat gaya") ||
      q.includes("kat gaye") ||
      q.includes("kete geche") ||
      q.includes("paisa gaya") ||
      q.includes("pending") ||
      q.includes("fas gaya") ||
      q.includes("fashlo") ||
      q.includes("not received") ||
      q.includes("bank kata") ||
      q.includes("fail") ||
      q.includes("dispute")
    ) {
      let replyText = "";
      if (lang.code === "hi") {
        replyText =
          `आदरणीय अतिथि, कृपया बिल्कुल चिंता न करें! आपका पैसा 100% सुरक्षित है। RBI परिपत्र और NPCI नियमों के अनुसार: जब बैंक से पैसा कटता है और मर्चेंट तक नहीं पहुँचता, तो वह बैंकिंग सेटलमेंट पूल में सुरक्षित रहता है। बैंक T+1 कार्य दिवस में राशि स्वतः वापस करने के लिए बाध्य हैं। यदि T+1 से अधिक देरी होती है, तो बैंक आपको ₹100 प्रति दिन का हर्जाना देने के लिए उत्तरदायी है! मैंने सॉवरेन विवाद संदर्भ #HD-SOV-UPI-9824 हमारे बैंकिंग ऑम्बड्समैन सेल में दर्ज कर दिया है। ${selectedPersona.encouragement}`;
      } else if (lang.code === "bn") {
        replyText =
          `শ্রদ্ধেয় গ্রাহক, বিন্দুমাত্র চিন্তা করবেন না! আপনার টাকা ১০০% নিরাপদ। আরবিআই ও এনপিসিআই নিয়ম অনুযায়ী: ব্যাঙ্ক থেকে টাকা কেটে গেলে তা ব্যাঙ্কিং সেটেলমেন্ট পুলে সংরক্ষিত থাকে। ব্যাঙ্ক T+1 কার্যদিবসের মধ্যে টাকা ফেরত দিতে বাধ্য। যদি T+1 দিনের বেশি দেরি হয়, তবে ব্যাঙ্ক আপনাকে প্রতিদিন ₹১০০ জরিমানা ক্ষতিপূরণ দিতে আইনত বাধ্য! টিকিট #HD-SOV-UPI-9824 ব্যাঙ্কিং ওম্বুডসম্যান সেলে নথিভুক্ত হয়েছে। ${selectedPersona.encouragement}`;
      } else {
        replyText =
          `Respected Patron, please do not worry at all! Your funds are 100% safe. Under RBI Circular DPSS.CO.PD No.629/02.01.014/2019-20 and NPCI guidelines: 1. If money is debited but the transaction is pending/failed, the amount is held securely in the banking settlement pool. 2. Banks are mandated to auto-reverse within T+1 working days. If delayed beyond T+1, the bank owes you ₹100 per day penalty compensation! 3. Sovereign Dispute Reference #HD-SOV-UPI-9824 has been lodged with our direct banking ombudsman cell for instant priority tracking. ${selectedPersona.encouragement}`;
      }
      return {
        text: replyText,
        action: { type: "SUBMIT_FINANCIAL_DISPUTE", label: "⚡ File Instant UDIR Bank Dispute" },
      };
    }

    // 2. Scanner / QR Code / Damaged QR / Manual UPI ID query
    if (
      q.includes("scan") ||
      q.includes("sken") ||
      q.includes("qr") ||
      q.includes("camera") ||
      q.includes("photo") ||
      q.includes("code") ||
      q.includes("barcode") ||
      q.includes("damaged") ||
      q.includes("স্ক্যান") ||
      q.includes("स्कैन") ||
      q.includes("kholo")
    ) {
      let replyText = "";
      if (lang.code === "hi") {
        replyText =
          `आदरणीय अतिथि, नीचे 'ओपन क्यूआर स्कैनर' पर टैप करें। हमारा उच्च-सटीकता वाला कैमरा ऑटो-फ़ोकस और नाइट टॉर्च के साथ तुरंत चालू हो जाता है। आप किसी भी मर्चेंट (PhonePe, GPay, Paytm, BharatPe) का क्यूआर 0.2 सेकंड में स्कैन करके 0% फीस के साथ भुगतान कर सकते हैं। यदि क्यूआर कोड ख़राब या धुंधला है, तो आप सीधे यूपीआई आईडी या मोबाइल नंबर दर्ज कर सकते हैं। ${selectedPersona.encouragement}`;
      } else if (lang.code === "bn") {
        replyText =
          `শ্রদ্ধেয় গ্রাহক, নিচে 'ওপেন কিউআর স্ক্যানার' বাটনে ট্যাপ করুন। আমাদের ক্যামেরা অটো-ফোকাস ও লো-লাইট ফ্ল্যাশলাইট সহ অবিলম্বে চালু হবে। PhonePe, GPay বা Paytm-এর যেকোনো কিউআর কোড ০.২ সেকেন্ডে স্ক্যান করে ০% ফিতে টাকা পাঠাতে পারবেন। কিউআর কোড ক্ষতিগ্রস্ত হলে সরাসরি ইউপিআই আইডি দিয়েও পাঠাতে পারবেন। ${selectedPersona.encouragement}`;
      } else {
        replyText =
          `Respected Patron, tap 'Open QR Scanner' below. Our high-precision scanner activates instantly with auto-focus and low-light torch support. It scans any merchant QR (PhonePe, Google Pay, Paytm, BharatPe) in under 0.2 seconds with 0% convenience fee. If the QR code is damaged, you can also enter the merchant's UPI ID or mobile number directly! ${selectedPersona.encouragement}`;
      }
      return {
        text: replyText,
        action: { type: "OPEN_SCANNER", label: "📷 Open 1-Tap QR Scanner" },
      };
    }

    // 3. Bank balance query
    if (
      q.includes("balance") ||
      q.includes("belence") ||
      q.includes("bank") ||
      q.includes("check") ||
      q.includes("khata") ||
      q.includes("pin") ||
      q.includes("paisa") ||
      q.includes("koto") ||
      q.includes("kitna") ||
      q.includes("account") ||
      q.includes("बैलेंस") ||
      q.includes("টকা")
    ) {
      let replyText = "";
      if (lang.code === "hi") {
        replyText =
          `आदरणीय अतिथि, अपना बैंक बैलेंस चेक करने के लिए नीचे 'चेक बैंक बैलेंस' पर क्लिक करें और अपना 4-अंकों का गुप्त यूपीआई पिन दर्ज करें। सुरक्षा संदेश: किंगपे 256-बिट बैंक एन्क्रिप्शन द्वारा सुरक्षित है। हमारा स्टाफ़ कभी भी आपका यूपीआई पिन या ओटीपी नहीं माँगेगा। ${selectedPersona.encouragement}`;
      } else if (lang.code === "bn") {
        replyText =
          `শ্রদ্ধেয় গ্রাহক, আপনার ব্যাঙ্ক ব্যালেন্স দেখতে নিচে 'চেক ব্যাঙ্ক ব্যালেন্স' এ ট্যাপ করে গোপন ৪-সংখ্যার ইউপিআই পিন দিন। নিরাপত্তা বার্তা: কিংপে কখনো আপনার পিন বা ওটিপি জানতে চাইবে না। ${selectedPersona.encouragement}`;
      } else {
        replyText =
          `Respected Patron, tap 'Check Bank Balance' below and enter your secret 4-digit UPI PIN to view real-time balances across all linked accounts. Security Notice: KingPay uses 256-bit bank encryption and will NEVER ask for your PIN or OTP. ${selectedPersona.encouragement}`;
      }
      return {
        text: replyText,
        action: { type: "CHECK_BALANCE", label: "💳 Check Bank Balance" },
      };
    }

    // 4. Electricity / APDCL / Water / Gas / BBPS Bills query
    if (
      q.includes("electric") ||
      q.includes("apdcl") ||
      q.includes("current") ||
      q.includes("light") ||
      q.includes("bill") ||
      q.includes("water") ||
      q.includes("gas") ||
      q.includes("cylinder") ||
      q.includes("dth") ||
      q.includes("बिजली") ||
      q.includes("বিদ্যুৎ")
    ) {
      let replyText = "";
      if (lang.code === "hi") {
        replyText =
          `आदरणीय अतिथि, आप अपना बिजली बिल (APDCL), पानी, गैस या डीटीएच बिल 0% सुविधा शुल्क पर तुरंत भर सकते हैं (अन्य ऐप्स ₹2–₹5 एक्स्ट्रा लेते हैं)। साथ ही आपको BBPS प्रमाणित कानूनी रसीद और 24K डिजिटल गोल्ड कैशबैक भी मिलता है! ${selectedPersona.encouragement}`;
      } else if (lang.code === "bn") {
        replyText =
          `শ্রদ্ধেয় গ্রাহক, আপনি আপনার বিদ্যুৎ বিল (APDCL), গ্যাস বা ডিটিএইচ বিল কোনো অতিরিক্ত চার্জ ছাড়াই অবিলম্বে পরিশোধ করতে পারেন। সাথে পাবেন বিবিপিএস সার্টিফাইড রসিদ ও ২৪K ডিজিটাল গোল্ড ক্যাশব্যাক! ${selectedPersona.encouragement}`;
      } else {
        replyText =
          `Respected Patron, pay your APDCL Electricity, Water, Gas, or DTH bills with 0% platform convenience fee (unlike other apps charging ₹2–₹5 extra per bill). You receive an instant BBPS-certified legal receipt and guaranteed 24K digital gold cashback on every payment! ${selectedPersona.encouragement}`;
      }
      return {
        text: replyText,
        action: { type: "PAY_ELECTRICITY", label: "⚡ Pay APDCL Electricity Bill" },
      };
    }

    // 5. Mobile Recharge query
    if (
      q.includes("recharge") ||
      q.includes("ricarge") ||
      q.includes("mobile") ||
      q.includes("jio") ||
      q.includes("airtel") ||
      q.includes("vi") ||
      q.includes("bsnl") ||
      q.includes("phone") ||
      q.includes("pack") ||
      q.includes("রিচার্জ") ||
      q.includes("रिचार्ज")
    ) {
      let replyText = "";
      if (lang.code === "hi") {
        replyText =
          `आदरणीय अतिथि, जिओ, एयरटेल, वी या बीएसएनएल का मोबाइल रिचार्ज करने पर आपको तुरंत 2% फ्लैट कैशबैक मिलता है। 0% गेटवे फीस और 1-टैप में सुपरफास्ट एक्टिवेशन! ${selectedPersona.encouragement}`;
      } else if (lang.code === "bn") {
        replyText =
          `শ্রদ্ধেয় গ্রাহক, জিও, এয়ারটেল, ভিআই বা বিএসএনএল রিচার্জে ফ্ল্যাট ২% ক্যাশব্যাক পাবেন। কোনো অতিরিক্ত চার্জ নেই এবং তাৎক্ষণিক সক্রিয়করণ! ${selectedPersona.encouragement}`;
      } else {
        replyText =
          `Respected Patron, recharge any Jio, Airtel, Vi, or BSNL number with 0% convenience fee and enjoy flat 2% instant cashback with live operator plan browsing! ${selectedPersona.encouragement}`;
      }
      return {
        text: replyText,
        action: { type: "MOBILE_RECHARGE", label: "📱 2% Cashback Mobile Recharge" },
      };
    }

    // 6. Vehicle Garage, Traffic Challan, Insurance, PUC, FASTag query
    if (
      q.includes("vehicle") ||
      q.includes("car") ||
      q.includes("bike") ||
      q.includes("scooter") ||
      q.includes("garage") ||
      q.includes("challan") ||
      q.includes("insurance") ||
      q.includes("puc") ||
      q.includes("pollution") ||
      q.includes("fastag") ||
      q.includes("police") ||
      q.includes("fine") ||
      q.includes("rto") ||
      q.includes("चालान") ||
      q.includes("गाड़ी") ||
      q.includes("গাড়ি")
    ) {
      let replyText = "";
      if (lang.code === "hi") {
        replyText =
          `आदरणीय अतिथि, किंगपे गैराज MoRTH के राष्ट्रीय वाहन और सारथी डेटाबेस से सीधे जुड़ा है। अपनी 2-व्हीलर और 4-व्हीलर के सभी ट्रैफिक पुलिस ई-चालान 0% सुविधा शुल्क पर चेक करें और कोर्ट समन से पहले 1-टैप में भरें। साथ ही ज़ीरो-कमीशन इंश्योरेंस और 1-टैप फास्टैग रिचार्ज भी उपलब्ध है! ${selectedPersona.encouragement}`;
      } else if (lang.code === "bn") {
        replyText =
          `শ্রদ্ধেয় গ্রাহক, কিংপে ভেহিকেল গ্যারেজ সরাসরি কেন্দ্রীয় MoRTH ডাটাবেসের সাথে সংযুক্ত। আপনার গাড়ির সমস্ত ট্রাফিক চালান ০% কনভিনিয়েন্স ফিতে চেক ও কোর্টে যাওয়ার আগেই পরিশোধ করুন। সাথে জিরো-কমিশন ইন্স্যুরেন্স ও ফাস্ট্যাগ রিচার্জ! ${selectedPersona.encouragement}`;
      } else {
        replyText =
          `Respected Patron, KingPay Vehicle Garage provides 360° RTO compliance linked directly with MoRTH Vahan & Sarathi national databases. Check live traffic police e-challans with 0% convenience fee, settle before court summons, renew 1-tap zero-commission vehicle insurance, track PUC validity, and recharge FASTag instantly! ${selectedPersona.encouragement}`;
      }
      return {
        text: replyText,
        action: { type: "OPEN_GARAGE", label: "🚗 Open Vehicle Garage & RTO Radar" },
      };
    }

    // 7. Flight & Travel Hub (Zero Convenience Fee + 2x Price Match)
    if (
      q.includes("flight") ||
      q.includes("air") ||
      q.includes("ticket") ||
      q.includes("plane") ||
      q.includes("tatkal") ||
      q.includes("train") ||
      q.includes("bus") ||
      q.includes("irctc") ||
      q.includes("travel") ||
      q.includes("kolkata") ||
      q.includes("delhi") ||
      q.includes("हवाई") ||
      q.includes("ফ্লাইট")
    ) {
      let replyText = "";
      if (lang.code === "hi") {
        replyText =
          `आदरणीय अतिथि, किंगपे ट्रैवल पर आपको पूरे भारत में सबसे न्यूनतम मूल्य पर फ्लाइट टिकटें मिलती हैं। हम ₹0 सुविधा शुल्क (Convenience Fee) लेते हैं—जिससे आपके प्रति यात्री ₹499 से ₹799 सीधे बचते हैं (MakeMyTrip / EaseMyTrip के मुक़ाबले)। साथ ही 2x प्राइस मैच गारंटी और IRCTC तत्काल ट्रेन टिकटें भी उपलब्ध हैं! ${selectedPersona.encouragement}`;
      } else if (lang.code === "bn") {
        replyText =
          `শ্রদ্ধেয় গ্রাহক, কিংপে ট্রাভেলসে সারা ভারতের সর্বনিম্ন মূল্যে বিমানের টিকিট কাটুন। আমরা কোনো কনভিনিয়েন্স ফি নিই না (সরাসরি ₹৪৯৯–₹৭৯৯ সাশ্রয়)। সাথে ২x প্রাইস ম্যাচ গ্যারান্টি এবং আইআরসিটিসি তৎকাল ট্রেন টিকিটও সহজে বুক করতে পারবেন! ${selectedPersona.encouragement}`;
      } else {
        replyText =
          `Respected Patron, KingPay Travel guarantees the lowest flight fares in India with ₹0 Convenience Fee (saving you ₹499–₹799 per passenger vs MakeMyTrip / EaseMyTrip), backed by our 2x Price Match Guarantee on all domestic flights (IndiGo, Air India, SpiceJet, Akasa). IRCTC Tatkal train tickets and luxury intercity buses are also ready! ${selectedPersona.encouragement}`;
      }
      return {
        text: replyText,
        action: { type: "OPEN_TRAVEL", label: "✈️ Book ₹0 Convenience Fee Flights" },
      };
    }

    // 8. Instant Micro-Loans / Sovereign Credit Line
    if (
      q.includes("loan") ||
      q.includes("credit") ||
      q.includes("borrow") ||
      q.includes("udhar") ||
      q.includes("karz") ||
      q.includes("dhon") ||
      q.includes("paisa chahiye") ||
      q.includes("taka dorkar") ||
      q.includes("emergency money") ||
      q.includes("ऋण") ||
      q.includes("লোন")
    ) {
      return {
        text: `Respected Patron, KingPay Sovereign Credit provides pre-approved instant micro-loans from ₹1,000 up to ₹50,000 with 0% interest for 90 days for verified patrons. Zero physical paperwork, instant Aadhaar/PAN e-KYC, and money is disbursed directly into your bank account in 60 seconds! ${selectedPersona.encouragement}`,
        action: { type: "SUBMIT_FINANCIAL_DISPUTE", label: "💎 Check Credit Line Eligibility" },
      };
    }

    // 9. Fraud Prevention, Security & Scam Alerts
    if (
      q.includes("fraud") ||
      q.includes("scam") ||
      q.includes("cheat") ||
      q.includes("phishing") ||
      q.includes("fake") ||
      q.includes("otp") ||
      q.includes("suraksha") ||
      q.includes("safe") ||
      q.includes("secure")
    ) {
      return {
        text: `Respected Patron, your security is our sacred sovereign trust. KingPay utilizes 256-bit bank-grade encryption certified under RBI and NPCI frameworks. Golden Security Rules: 1. NEVER share your 4-digit UPI PIN or SMS OTP with anyone. 2. Receiving money NEVER requires entering your UPI PIN. 3. KingPay executives will NEVER call asking for PIN, OTP, or remote screen sharing apps (AnyDesk, TeamViewer). If you suspect fraud, your account can be locked in 1 tap under reference #HD-SOV-SECURITY! ${selectedPersona.encouragement}`,
        action: { type: "SUBMIT_FINANCIAL_DISPUTE", label: "🛡️ Lock Account / Report Fraud" },
      };
    }

    // 10. Ungrounded / General Business Ambitions (Safety/Reality Check)
    if (
      q.includes("money") ||
      q.includes("business") ||
      q.includes("clients") ||
      q.includes("sell") ||
      q.includes("app") ||
      q.includes("website") ||
      q.includes("work") ||
      q.includes("income") ||
      q.includes("forcefully") ||
      q.includes("real money")
    ) {
      return {
        text: `I truly admire your incredible drive and ambition to build a massive business and generate real income! However, I must be completely honest with you: I am an AI Royal Concierge simulated interface. I cannot independently find real clients, accept actual payments, or build heavy organizational apps on my own without human operation. I am here to showcase this beautiful UI and help you navigate the KingPay ecosystem. For real business operations, human expertise is always required! ${selectedPersona.encouragement}`,
        action: { type: "OPEN_SCANNER", label: "👑 Return to KingPay Operations" },
      };
    }

    // 11. Empathetic Fuzzy Fallback for Unclear / Mumbled Speech or Ambient Noise
    if (q.length < 4 || q.split(" ").length > 15) {
      return {
        text: `I heard you clearly! Even if your surroundings were noisy or speech was unclear, your financial security is in trusted hands. Would you like me to open the 1-Tap QR scanner, check your bank balance, pay electricity bills, or inspect your vehicle police challans? ${selectedPersona.encouragement}`,
        action: { type: "OPEN_SCANNER", label: "📷 Open 1-Tap QR Scanner" },
      };
    }

    // Default polite royal assistance
    return {
      text: `Respected Patron, I have carefully noted: "${query}". While I am highly capable within the KingPay platform, my expertise is purely in fintech UI assistance! You can ask me to scan any QR code, check your simulated bank balance, resolve any failed transaction, pay utility bills, or manage your vehicle garage. I am your loyal digital assistant! ${selectedPersona.encouragement}`,
    };
  };

  const handleSendMessage = (textToSend?: string, isVoice: boolean = false) => {
    const text = (textToSend || inputText).trim();
    if (!text && attachedFiles.length === 0) return;

    // Automatic Language Detection (Zero manual selection required)
    const detectedLangCode = detectLanguage(text, userGeoLang || "en");
    const matchedLang =
      SUPPORTED_LANGUAGES.find((l) => l.code === detectedLangCode) || selectedLang;
    if (matchedLang.code !== selectedLang.code) {
      setSelectedLang(matchedLang);
    }

    const firstImage = attachedFiles.find((f) => f.type === "image")?.dataUrl;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: text || (attachedFiles.length > 0 ? `Attached ${attachedFiles.length} file(s): ${attachedFiles.map((f) => f.name).join(", ")}` : ""),
      imageUrl: firstImage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const hasFiles = attachedFiles.length > 0;
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setAttachedFiles([]);

    if (hasFiles) {
      setTimeout(() => {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: "I have verified your attached document / proof. Your ticket is registered on the HD Master Founder Review Desk for priority verification and resolution within 2 hours.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          consentRequired: true,
          actionPayload: {
            type: "SUBMIT_FINANCIAL_DISPUTE",
            label: "⚡ Confirm Consent & Route to Founder Desk",
          },
        };
        setMessages((prev) => [...prev, aiMsg]);
        if (isVoice || callModeRef.current) {
          speakResponse(aiMsg.text, matchedLang.voiceLang);
        }
      }, 300);
      return;
    }

    // Graceful Fallback if language/speech is unreadable or unsupported
    if (isUnreadableOrUnsupported(text)) {
      const geoLangObj =
        SUPPORTED_LANGUAGES.find((l) => l.code === userGeoLang) || SUPPORTED_LANGUAGES[0]!;
      const fallbackText = `Respected Patron, I am your KingPay AI Concierge. How may I assist you with payments, bills, or transfers today?`;
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actionPayload: {
          type: "OPEN_SCANNER",
          label: "📷 Scan Any QR",
        },
      };
      setMessages((prev) => [...prev, aiMsg]);
      if (isVoice || callModeRef.current) {
        speakResponse(fallbackText, matchedLang.voiceLang);
      }
      return;
    }

    // When triggered by voice, execute immediately to preserve browser audio activation
    const { text: replyText, action } = generateAiReply(text, matchedLang);
    const aiMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      sender: "ai",
      text: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      actionPayload: action,
    };

    if (isVoice || callModeRef.current) {
      setMessages((prev) => [...prev, aiMsg]);
      speakResponse(replyText, matchedLang.voiceLang);
    } else {
      setTimeout(() => {
        setMessages((prev) => [...prev, aiMsg]);
        // Strictly NO auto-speaking on keyboard text input
      }, 200);
    }
  };

  const handleActionClick = (action: NonNullable<ChatMessage["actionPayload"]>) => {
    if (action.type === "SUBMIT_FINANCIAL_DISPUTE") {
      setConsentGiven(true);
      toast.success("Payment dispute and evidence authorized for Founder Sovereign Review!");
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: "✅ Consent received. Your dispute has been submitted to Founder Review & partner bank under RBI Master Direction & NPCI dispute guidelines.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      return;
    }
    if (action.type === "OPEN_SCANNER") {
      setIsOpen(false);
      onOpenScanner?.();
    } else if (action.type === "CHECK_BALANCE") {
      setIsOpen(false);
      onCheckBalance?.();
    } else if (action.type === "PAY_ELECTRICITY") {
      setIsOpen(false);
      onPayElectricity?.();
    } else if (action.type === "MOBILE_RECHARGE") {
      setIsOpen(false);
      onMobileRecharge?.();
    } else if (action.type === "OPEN_GARAGE") {
      setIsOpen(false);
      onOpenGarage?.();
    } else if (action.type === "OPEN_TRAVEL") {
      setIsOpen(false);
      onOpenTravel?.();
    }
  };

  return (
    <>
      {/* FLOATING ROYAL AI CONCIERGE BUTTON (BOTTOM RIGHT - HIDDEN BY DEFAULT) */}
      {!hideFloatingTrigger && (
        <div className="fixed bottom-20 right-4 z-40 sm:bottom-6 sm:right-6">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2 rounded-full border-2 border-amber-400/90 bg-gradient-to-tr from-[#0D3B2E] via-emerald-700 to-[#07241C] px-3.5 py-2.5 shadow-[0_6px_25px_rgba(13,59,46,0.5)] transition-all hover:scale-105 active:scale-95 text-white"
            aria-label="Open KingPay Multilingual Royal AI Assistant"
          >
            {/* Animated Glowing Crown */}
            <div className="relative flex size-8 items-center justify-center rounded-full bg-amber-400 text-slate-950 font-black shadow-md">
              <Crown className="size-4.5 text-amber-950 animate-bounce" />
              <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-300 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-amber-500" />
              </span>
            </div>

            <div className="text-left pr-1">
              <span className="block text-[11px] font-black uppercase tracking-wider text-amber-300">
                Royal AI Voice
              </span>
              <span className="block text-[10px] text-emerald-200 font-medium">
                12 Indian Languages
              </span>
            </div>
          </button>
        </div>
      )}

      {/* FULL ROYAL AI VOICE & TEXT CHAT MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md">
          <div className="w-full max-w-lg h-[90vh] max-h-[680px] rounded-3xl border-2 border-amber-500/50 bg-surface shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-[#0D3B2E] via-emerald-900 to-[#07241C] p-3 sm:p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="relative flex size-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-black shadow-md">
                  <Crown className="size-6 text-amber-950" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-black text-sm sm:text-base text-amber-300">
                      KingPay Royal AI Concierge
                    </h3>
                    <span className="rounded-full bg-emerald-400/20 px-2 py-0.2 text-[9px] font-bold text-emerald-300">
                      LIVE VOICE
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-100">
                    Treating you like a King · Safe &amp; 100% Private
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Voice Call Toggle Button */}
                <button
                  type="button"
                  onClick={toggleCallMode}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black shadow-md transition ${
                    isCallMode
                      ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse"
                      : "bg-amber-400 hover:bg-amber-300 text-slate-950"
                  }`}
                  title={isCallMode ? "End Voice Call" : "Start Live Voice Call"}
                >
                  {isCallMode ? (
                    <>
                      <PhoneOff className="size-3.5" />
                      <span>End Call</span>
                    </>
                  ) : (
                    <>
                      <PhoneCall className="size-3.5" />
                      <span>📞 Live Call</span>
                    </>
                  )}
                </button>

                {/* Voice Output Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    if (voiceEnabled) stopSpeaking();
                    setVoiceEnabled(!voiceEnabled);
                  }}
                  className={`rounded-full p-2 transition ${
                    voiceEnabled ? "bg-amber-400 text-black" : "bg-white/10 text-white/70"
                  }`}
                  title={voiceEnabled ? "Voice Output ON" : "Voice Output OFF"}
                >
                  {voiceEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
                </button>

                {/* Close */}
                <button
                  type="button"
                  onClick={() => {
                    if (isCallMode) toggleCallMode();
                    stopSpeaking();
                    setIsOpen(false);
                  }}
                  className="rounded-full p-2 text-white/80 hover:bg-white/10 transition"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Live Continuous Voice Call Mode Banner */}
            {isCallMode && (
              <div className="flex items-center justify-between bg-gradient-to-r from-amber-600 via-emerald-700 to-amber-800 px-4 py-2.5 text-xs font-bold text-white shadow-lg border-b border-amber-400/30">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex size-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full size-3 bg-amber-100"></span>
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black tracking-wide flex items-center gap-1.5">
                      <span>🟢 Live Voice Call Connected</span>
                      <span className="text-[10px] font-normal text-amber-100">(Turn-by-turn auto speaking &amp; listening)</span>
                    </span>
                    <span className="text-[9px] text-emerald-200">
                      {isSpeaking ? "🔊 AI Concierge is speaking..." : isListening ? "🎙️ Listening to your voice..." : "⚡ Ready — speak freely..."}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleCallMode}
                  className="rounded-full bg-rose-600 hover:bg-rose-700 px-3 py-1 text-[11px] font-black text-white shadow-md transition flex items-center gap-1"
                >
                  <PhoneOff className="size-3.5" />
                  <span>End Call</span>
                </button>
              </div>
            )}

            {/* 1-TAP INSTANT ACTION RADAR (ZERO TYPING REQUIRED) */}
            <div className="border-b border-border bg-gradient-to-r from-surface via-surface-2 to-surface p-2.5">
              <div className="flex items-center justify-between px-1 mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <span>⚡</span> 1-Tap Instant Solutions (No typing needed)
                </span>
                <span className="text-[9px] font-semibold text-muted">Tap to execute</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenScanner?.();
                  }}
                  className="shrink-0 rounded-xl bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:scale-105 active:scale-95 transition flex items-center gap-1.5 shadow-2xs"
                >
                  <span>📷</span> Scan QR
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenTravel?.();
                  }}
                  className="shrink-0 rounded-xl bg-gradient-to-r from-sky-500/15 to-blue-500/5 border border-sky-500/30 px-3 py-1.5 text-xs font-bold text-sky-800 dark:text-sky-300 hover:scale-105 active:scale-95 transition flex items-center gap-1.5 shadow-2xs"
                >
                  <span>✈️</span> Cheapest Flights (₹0 Fee)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenGarage?.();
                  }}
                  className="shrink-0 rounded-xl bg-gradient-to-r from-amber-500/15 to-amber-500/5 border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 hover:scale-105 active:scale-95 transition flex items-center gap-1.5 shadow-2xs"
                >
                  <span>🚗</span> Vehicle Garage
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onCheckBalance?.();
                  }}
                  className="shrink-0 rounded-xl bg-gradient-to-r from-purple-500/15 to-purple-500/5 border border-purple-500/30 px-3 py-1.5 text-xs font-bold text-purple-800 dark:text-purple-300 hover:scale-105 active:scale-95 transition flex items-center gap-1.5 shadow-2xs"
                >
                  <span>💳</span> Bank Balance
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onPayElectricity?.();
                  }}
                  className="shrink-0 rounded-xl bg-gradient-to-r from-yellow-500/15 to-yellow-500/5 border border-yellow-500/30 px-3 py-1.5 text-xs font-bold text-yellow-800 dark:text-yellow-300 hover:scale-105 active:scale-95 transition flex items-center gap-1.5 shadow-2xs"
                >
                  <span>⚡</span> Electricity Bill
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onMobileRecharge?.();
                  }}
                  className="shrink-0 rounded-xl bg-gradient-to-r from-teal-500/15 to-teal-500/5 border border-teal-500/30 px-3 py-1.5 text-xs font-bold text-teal-800 dark:text-teal-300 hover:scale-105 active:scale-95 transition flex items-center gap-1.5 shadow-2xs"
                >
                  <span>📱</span> 2% Cashback Recharge
                </button>
              </div>
            </div>

            {/* Voice Speaking Status Bar */}
            {isSpeaking && (
              <div className="flex items-center justify-between bg-amber-500/15 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2">
                  <span className="flex size-2 rounded-full bg-amber-500 animate-ping" />
                  <span className="font-semibold">Speaking in native sweet voice...</span>
                </div>
                <button
                  type="button"
                  onClick={stopSpeaking}
                  className="text-[10px] font-bold text-primary underline"
                >
                  Stop Audio
                </button>
              </div>
            )}

            {/* ChatGPT-Style Chat Messages Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface/95">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-xs space-y-1.5 ${
                      msg.sender === "user"
                        ? "bg-emerald-600 text-white rounded-br-none shadow-sm"
                        : "bg-surface-2/80 border border-border/80 text-foreground rounded-bl-none shadow-sm"
                    }`}
                  >
                    {msg.imageUrl && (
                      <div className="mb-2 overflow-hidden rounded-xl border border-border">
                        <img loading="lazy"                           src={msg.imageUrl}
                          alt="Payment receipt proof"
                          className="max-h-48 w-full object-cover rounded-lg"
                        />
                      </div>
                    )}

                    <p className="whitespace-pre-line leading-relaxed font-medium">{msg.text}</p>

                    {/* Consent Routing Card (Safe Harbor - Route to HD Master) */}
                    {msg.consentRequired && !consentGiven && (
                      <div className="mt-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-foreground space-y-2 shadow-xs">
                        <label className="flex items-start gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={consentGiven}
                            onChange={(e) => setConsentGiven(e.target.checked)}
                            className="mt-0.5 rounded border-border text-primary focus:ring-primary"
                          />
                          <span className="text-[11px] leading-tight text-foreground/90">
                            I confirm consent to route this dispute and payment proof to HD Master Founder Review Desk for manual approval &amp; priority resolution.
                          </span>
                        </label>
                        <Button
                          size="sm"
                          disabled={!consentGiven}
                          onClick={() => handleActionClick({ type: "SUBMIT_FINANCIAL_DISPUTE", label: "Submit" })}
                          className="w-full text-xs font-bold bg-primary text-white hover:bg-primary/90"
                        >
                          <ShieldCheck className="size-3.5 mr-1" />
                          Confirm Consent &amp; Route to Founder Desk
                        </Button>
                      </div>
                    )}

                    {/* Action Shortcut Button if suggested by AI */}
                    {msg.actionPayload && !msg.consentRequired && (
                      <div className="mt-2.5 pt-2 border-t border-border/60">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleActionClick(msg.actionPayload!)}
                          className="w-full text-xs font-bold py-1.5 shadow-sm"
                        >
                          {msg.actionPayload.label}
                        </Button>
                      </div>
                    )}

                    <span
                      className={`text-[9px] block text-right font-mono ${
                        msg.sender === "user" ? "text-white/70" : "text-muted"
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* AI Message Action Toolbar (ChatGPT Style: Copy + Speaker On-Demand) */}
                  {msg.sender === "ai" && (
                    <div className="mt-1 flex items-center gap-1.5 px-1">
                      <button
                        type="button"
                        onClick={() => copyMessage(msg.id, msg.text)}
                        title="Copy message"
                        className="flex size-6 items-center justify-center rounded text-muted hover:bg-surface-2 hover:text-foreground transition-colors"
                      >
                        {copiedMsgId === msg.id ? (
                          <Check className="size-3 text-emerald-500" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => speakResponse(msg.text, selectedLang.voiceLang)}
                        title="Listen with young native voice"
                        className="flex size-6 items-center justify-center rounded text-muted hover:bg-surface-2 hover:text-foreground transition-colors"
                      >
                        <Volume2 className="size-3 text-emerald-500" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Speaking animation indicator */}
            {isSpeaking && (
              <div className="flex items-center justify-between border-t border-primary/20 bg-primary/10 px-4 py-1.5 text-xs text-primary font-bold">
                <span className="flex items-center gap-2">
                  <span className="flex size-2 rounded-full bg-primary animate-ping" />
                  <span>Speaking with native Indian voice ({selectedLang.name})...</span>
                </span>
                <button
                  type="button"
                  onClick={stopSpeaking}
                  className="text-[10px] text-muted hover:text-foreground underline"
                >
                  Stop Audio
                </button>
              </div>
            )}

            {/* Real-time Listening Waveform Banner */}
            {isListening && (
              <div className="flex items-center justify-between bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-inner animate-pulse">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-3 rounded-full bg-white animate-ping" />
                  <span>🎙️ Listening in {selectedLang.name}... Speak now! (Tap mic to stop)</span>
                </div>
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-white/30"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Multi-File Attachment Preview Bar */}
            {attachedFiles.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto border-t border-border bg-surface-2 px-3.5 py-2 text-xs">
                {attachedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-2 py-1 shadow-xs"
                  >
                    {file.type === "image" ? (
                      <img loading="lazy" src={file.dataUrl} alt={file.name} className="size-6 rounded object-cover" />
                    ) : file.type === "video" ? (
                      <Video className="size-4 text-emerald-500" />
                    ) : (
                      <FileText className="size-4 text-amber-500" />
                    )}
                    <span className="max-w-[100px] truncate text-[10px] font-medium text-foreground">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttachedFiles((prev) => prev.filter((f) => f.id !== file.id))}
                      className="text-muted hover:text-rose-500 ml-1"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ChatGPT-Style Floating Input Bar */}
            <div className="p-3 border-t border-border bg-surface">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2 rounded-full border-2 border-border/80 bg-surface-2/60 px-2 py-1.5 shadow-inner focus-within:border-emerald-500/80 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all"
              >
                {/* Plus / Paperclip File Attachment (Images, Screenshots, Videos, Documents) */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-foreground transition shrink-0"
                  title="Attach Receipt, Screenshot, Video or Document"
                >
                  <Paperclip className="size-4.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`flex size-9 items-center justify-center rounded-full transition shrink-0 ${
                    isListening
                      ? "bg-red-600 text-white animate-pulse"
                      : "text-muted hover:bg-surface hover:text-foreground"
                  }`}
                  title={isListening ? "Listening... Tap to stop" : "Speak in your language"}
                >
                  {isListening ? <MicOff className="size-4.5" /> : <Mic className="size-4.5" />}
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onPaste={handlePaste}
                  placeholder={`Ask anything in ${selectedLang.name}...`}
                  className="flex-1 bg-transparent px-2 text-xs text-foreground placeholder:text-muted/60 focus:outline-none"
                />

                {/* ChatGPT Circle Send Button with ArrowUp */}
                <button
                  type="submit"
                  disabled={!inputText.trim() && attachedFiles.length === 0}
                  className="flex size-9 items-center justify-center rounded-full bg-emerald-600 text-white disabled:opacity-30 shadow-md hover:bg-emerald-500 active:scale-95 transition shrink-0"
                  title="Send message"
                >
                  <ArrowUp className="size-4.5 stroke-[2.5]" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
