import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowUp, Camera, Check, Copy, FileText, Mic, MicOff, Paperclip, PhoneCall, PhoneOff, Send, ShieldCheck, Sparkles, Utensils, Video, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
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

export const FOOD_SUPPORTED_LANGUAGES: IndianLanguage[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    voiceLang: "en-IN",
    honorific: "Food Lover",
    welcomeMessage:
      "Greetings! I am your OrderKing AI Food Concierge. Craving authentic Royal Biryani, local master chef delicacies, or looking for 0% marked-up dishes? Ask me anything with your voice or text!",
    voiceIntro:
      "Greetings! I am your OrderKing Food Assistant. What delicious dish would you like to enjoy today?",
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    voiceLang: "hi-IN",
    honorific: "हुज़ूर",
    welcomeMessage:
      "प्रणाम हुज़ूर! मैं आपकी आर्डरकिंग फ़ूड असिस्टेंट हूँ। आज आपका क्या खाने का मन है? लज़ीज़ दम बिरयानी, शुद्ध शाकाहारी भोजन या आज की ख़ास डील्स—बोलकर या लिखकर पूछिए!",
    voiceIntro:
      "प्रणाम हुज़ूर! मैं आपकी आर्डरकिंग फ़ूड असिस्टेंट हूँ। आज आपका क्या खाने का मन है?",
  },
  {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    voiceLang: "bn-IN",
    honorific: "মহারাজ",
    welcomeMessage:
      "নমস্কার মহারাজ! আমি আপনার অর্ডারকিং ফুড অ্যাসিস্ট্যান্ট। আজ আপনার কী খেতে ইচ্ছে করছে? সুস্বাদু দম বিরিয়ানি, খাস সিলেটি মাছের ঝোল বা সেরা অফার—আমাকে ভয়েস বা টেক্সটে বলুন!",
    voiceIntro:
      "নমস্কার মহারাজ! আমি আপনার অর্ডারকিং ফুড অ্যাসিস্ট্যান্ট। আজ কী সুস্বাদু খাবার খাবেন?",
  },
  {
    code: "as",
    name: "Assamese",
    nativeName: "অসমীয়া",
    voiceLang: "as-IN",
    honorific: "ডাঙৰীয়া",
    welcomeMessage:
      "নমস্কাৰ ডাঙৰীয়া! মই আপোনাৰ অৰ্ডাৰকিং খাদ্য সহায়িকা। আজি আপুনি কি খাব বিচাৰে? সুস্বাদু বিৰিয়ানী, পৰম্পৰাগত খাদ্য বা আজিৰ অফাৰ—কওক মই সহায় কৰিম।",
    voiceIntro:
      "নমস্কাৰ ডাঙৰীয়া! মই আপোনাৰ অৰ্ডাৰকিং সহায়িকা। কওক আজি কি সুস্বাদু খাদ্য অৰ্ডাৰ কৰিব?",
  },
  {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    voiceLang: "ta-IN",
    honorific: "வணக்கம்",
    welcomeMessage:
      "வணக்கம்! நான் உங்கள் ஆர்டர்கிங் உணவு உதவியாளர். பிரியாணி, சுவையான உணவுகள் அல்லது இன்றைய சலுகைகள் பற்றி குரல் அல்லது உரை மூலம் என்னிடம் கேளுங்கள்!",
    voiceIntro:
      "வணக்கம்! நான் உங்கள் ஆர்டர்கிங் உணவு உதவியாளர். இன்று என்ன உணவு ஆர்டர் செய்ய வேண்டும்?",
  },
  {
    code: "te",
    name: "Telugu",
    nativeName: "తెలుగు",
    voiceLang: "te-IN",
    honorific: "నమస్కారం",
    welcomeMessage:
      "నమస్కారం! నేను మీ ఆర్డర్‌కింగ్ ఫుడ్ అసిస్టెంట్‌ని. బిర్యానీ, రుచికరమైన వంటకాలు లేదా ఆఫర్ల గురించి వాయిస్ లేదా టెక్స్ట్ ద్వారా అడగండి!",
    voiceIntro:
      "నమస్కారం! నేను మీ ఆర్డర్‌కింగ్ ఫుడ్ అసిస్టెంట్‌ని. ఈరోజు ఏమి ఆర్డర్ చేయాలనుకుంటున్నారు?",
  },
  {
    code: "kn",
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    voiceLang: "kn-IN",
    honorific: "ನಮಸ್ಕಾರ",
    welcomeMessage:
      "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಆರ್ಡರ್‌ಕಿಂಗ್ ಆಹಾರ ಸಹಾಯಕ. ಬಿರಿಯಾನಿ, ರುಚಿಕರವಾದ ಅಡುಗೆಗಳು ಅಥವಾ ರಿಯಾಯಿತಿಗಳ ಬಗ್ಗೆ ಧ್ವನಿ ಅಥವಾ ಪಠ್ಯದಲ್ಲಿ ಕೇಳಿ!",
    voiceIntro:
      "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಆರ್ಡರ್‌ಕಿಂಗ್ ಆಹಾರ ಸಹಾಯಕ. ಇಂದು ಯಾವ ಊಟ ಆರ್ಡರ್ ಮಾಡುತ್ತೀರಿ?",
  },
  {
    code: "ml",
    name: "Malayalam",
    nativeName: "മലയാളം",
    voiceLang: "ml-IN",
    honorific: "നമസ്കാരം",
    welcomeMessage:
      "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ ഓർഡർകിംഗ് ഫുഡ് അസിസ്റ്റന്റാണ്. സ്വാദിഷ്ടമായ ബിരിയാണി, സ്പെഷ്യൽ വിഭവങ്ങൾ എന്നിവയ്ക്കായി എന്നോട് ചോദിക്കൂ!",
    voiceIntro:
      "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ ഓർഡർകിംഗ് ഫുഡ് അസിസ്റ്റന്റാണ്. ഇന്ന് എന്താണ് കഴിക്കാൻ ആഗ്രഹിക്കുന്നത്?",
  },
  {
    code: "mr",
    name: "Marathi",
    nativeName: "मराठी",
    voiceLang: "mr-IN",
    honorific: "नमस्कार",
    welcomeMessage:
      "नमस्कार! मी आपली ऑर्डरकिंग फूड सहाय्यक आहे. चविष्ट बिर्याणी, शाकाहारी जेवण किंवा आजच्या खास ऑफर्सबद्दल मला विचारा!",
    voiceIntro:
      "नमस्कार! मी आपली ऑर्डरकिंग फूड सहाय्यक आहे. सांगा आज काय खायची इच्छा आहे?",
  },
  {
    code: "gu",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    voiceLang: "gu-IN",
    honorific: "નમસ્કાર",
    welcomeMessage:
      "નમસ્કાર! હું તમારી ઓર્ડરકિંગ ફૂડ સહાયક છું. સ્વાદિષ્ટ વાનગીઓ, પ્યોર વેજ થાળી કે આજના ડિસ્કાઉન્ટ્સ વિશે મને પૂછો!",
    voiceIntro:
      "નમસ્કાર! હું તમારી ઓર્ડરકિંગ સહાયક છું. કહો આજે શું જમવું છે?",
  },
  {
    code: "pa",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    voiceLang: "pa-IN",
    honorific: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ",
    welcomeMessage:
      "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! ਮੈਂ ਤੁਹਾਡੀ ਆਰਡਰਕਿੰਗ ਫੂਡ ਸਹਾਇਕ ਹਾਂ। ਸਵਾਦੀ ਬਿਰਯਾਨੀ, ਦਾਲ ਮਖਣੀ ਜਾਂ ਅੱਜ ਦੇ ਖਾਸ ਆਫਰਾਂ ਬਾਰੇ ਮੈਨੂੰ ਪੁੱਛੋ!",
    voiceIntro:
      "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! ਮੈਂ ਤੁਹਾਡੀ ਆਰਡਰਕਿੰਗ ਫੂਡ ਸਹਾਇਕ ਹਾਂ। ਦੱਸੋ ਅੱਜ ਕੀ ਖਾਣ ਦਾ ਮਨ ਹੈ?",
  },
  {
    code: "or",
    name: "Odia",
    nativeName: "ଓଡ଼ିଆ",
    voiceLang: "or-IN",
    honorific: "ନମସ୍କାର",
    welcomeMessage:
      "ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କର ଅର୍ଡରକିଙ୍ଗ ଖାଦ୍ୟ ସହାୟିକା। ସୁସ୍ୱାଦୁ ବିରିୟାନୀ, ସ୍ପେଶାଲ ଖାଦ୍ୟ କିମ୍ବା ଆଜିର ଅଫର ବିଷୟରେ ମୋତେ ପଚାରନ୍ତୁ!",
    voiceIntro:
      "ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କର ଅର୍ଡରକିଙ୍ଗ ସହାୟିକା। କୁହନ୍ତୁ ଆଜି କଣ ଅର୍ଡର କରିବେ?",
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

export const FOOD_VOICE_PERSONAS: VoicePersona[] = [
  {
    id: "priya",
    name: "Priya",
    label: "🌸 Priya (Melodious & Motivating)",
    pitch: 1.24,
    rate: 0.95,
    encouragement: "You deserve the most delightful and joyful meal today!",
  },
  {
    id: "rani",
    name: "Rani",
    label: "👑 Rani (Royal & Elegant)",
    pitch: 1.08,
    rate: 0.88,
    encouragement: "It is our absolute royal honor to serve your exquisite palate.",
  },
  {
    id: "aanya",
    name: "Aanya",
    label: "⚡ Aanya (Vibrant & Energetic)",
    pitch: 1.34,
    rate: 1.05,
    encouragement: "Super choice! Let's get something amazingly delicious for you right away!",
  },
  {
    id: "shanti",
    name: "Shanti",
    label: "🕊️ Shanti (Calm & Comforting)",
    pitch: 1.04,
    rate: 0.82,
    encouragement: "Take your time, relax, and nourish yourself with wholesome food.",
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
    type: "SEARCH_BIRYANI" | "SEARCH_VEG" | "TRACK_ORDERS" | "VIEW_OFFERS" | "OPEN_KINGPAY" | "SUBMIT_DISPUTE_CONSENT";
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

export function FoodAiConcierge({
  hideFloatingTrigger = true,
}: {
  hideFloatingTrigger?: boolean;
} = {}) {
  const navigate = useNavigate();
  const { lang: userGeoLang } = useT();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<IndianLanguage>(() => {
    return FOOD_SUPPORTED_LANGUAGES.find((l) => l.code === userGeoLang) || FOOD_SUPPORTED_LANGUAGES[0]!;
  });
  const [selectedPersona, setSelectedPersona] = useState<VoicePersona>(FOOD_VOICE_PERSONAS[0]!);
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

  // Listen for open-food-ai-concierge event from the EcosystemSwitchBar
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-food-ai-concierge", handleOpen);
    return () => window.removeEventListener("open-food-ai-concierge", handleOpen);
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

  // Auto-scroll chat to latest message
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

  // Auto-scroll chat to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Speech synthesis for young, highly attractive native female voice (pitch 1.14, rate 1.04)
  const speakResponse = (text: string, voiceLang: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !voiceEnabled) {
      return;
    }

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
      toast.success("📞 Voice call connected! Speak freely with your AI Concierge.");
      const intro = selectedLang.voiceIntro || selectedLang.welcomeMessage;
      speakResponse(intro, selectedLang.voiceLang);
    }
  };

  // Web Speech Recognition for manual voice chat input with instant speech response
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
          try {
            recognition.stop();
          } catch {
            // ignore
          }
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

  // Deep, Realistic, 100x Problem-Solving Food Delivery Knowledge Engine
  const generateFoodAiReply = (query: string, lang: IndianLanguage): { text: string; action?: any } => {
    const raw = query.toLowerCase();
    const q = raw.replace(/[^a-z0-9\u0900-\u097F\u0980-\u09FF\s]/g, " ").replace(/\s+/g, " ").trim();

    // 1. Delivery Delays / Late Food / Rider Stalled / ETA Guarantee
    if (
      q.includes("late") ||
      q.includes("delay") ||
      q.includes("deri") ||
      q.includes("der") ||
      q.includes("kothay") ||
      q.includes("kahan") ||
      q.includes("pahuncha") ||
      q.includes("stuck") ||
      q.includes("traffic") ||
      q.includes("eta") ||
      q.includes("slow") ||
      q.includes("aayega") ||
      q.includes("aashbe") ||
      q.includes("time") ||
      q.includes("kab")
    ) {
      let replyText = "";
      if (lang.code === "hi") {
        replyText =
          `हुज़ूर, मैं आपकी परेशानी पूरी तरह समझती हूँ। हमारे 'ऑन-टाइम गारंटी' के तहत यदि आपका आर्डर 10 मिनट से अधिक लेट होता है, तो आपके वॉलेट में तुरंत ₹50 का कम्पेन्सेशन क्रेडिट ट्रांसफर कर दिया जाएगा। मैंने राइडर और किचन हेड शेफ़ को प्रायोरिटी अलर्ट भेज दिया है। टिकट #HD-FOOD-DELAY फ़ाउंडर डेस्क पर दर्ज है! ${selectedPersona.encouragement}`;
      } else if (lang.code === "bn") {
        replyText =
          `মহারাজ, খাবারের দেরির জন্য আমি আন্তরিকভাবে দুঃখিত। আমাদের 'অন-টাইম গ্যারান্টি' অনুযায়ী ১০ মিনিটের বেশি দেরি হলে আপনার ওয়ালেটে অবিলম্বে ₹৫০ ক্ষতিপূরণ ক্রেডিট জমা হবে। আমি রাইডার ও শেফকে জরুরি সতর্কতা পাঠিয়েছি। টিকিট #HD-FOOD-DELAY নথিভুক্ত করা হয়েছে! ${selectedPersona.encouragement}`;
      } else {
        replyText =
          `I completely understand your hunger and apologize for the wait! Under OrderKing's Sovereign On-Time Guarantee, if your order is delayed by more than 10 minutes past the promised ETA, you will automatically receive an instant ₹50 compensation credit in your wallet. I have sent an urgent priority dispatch ping to your rider and kitchen head chef right now. Ticket #HD-FOOD-DELAY is logged on the Founder Command Desk! ${selectedPersona.encouragement}`;
      }
      return {
        text: replyText,
        action: { type: "TRACK_ORDERS", label: "📦 Track Live Rider & View ETA" },
      };
    }

    // 2. Missing Items / Wrong Items Delivered / Incomplete Order
    if (
      q.includes("missing") ||
      q.includes("bhul") ||
      q.includes("chhoot") ||
      q.includes("gayab") ||
      q.includes("incomplete") ||
      q.includes("did not receive") ||
      q.includes("wrong") ||
      q.includes("galat") ||
      q.includes("paini") ||
      q.includes("mila nahi") ||
      q.includes("nahi mila") ||
      q.includes("adha") ||
      q.includes("half") ||
      q.includes("chut gaya")
    ) {
      let replyText = "";
      if (lang.code === "hi") {
        replyText =
          `हुज़ूर, यह बहुत गंभीर मामला है। आर्डरकिंग की 'ज़ीरो-पूछताछ नीति' के तहत जो आइटम मिसिंग या ग़लत है, उसका 100% रिफ़ंड आपके किंगपे वॉलेट में तुरंत दिया जाएगा, या 15 मिनट में फ़्री एक्सप्रेस डिलीवरी होगी। कृपया नीचे कैमरा आइकॉन से पैकेट की फ़ोटो भेजें। रेस्टोरेंट को तत्काल पेनल्टी नोटिस भेजा गया है (टिकट #HD-FOOD-MISSING)। ${selectedPersona.encouragement}`;
      } else if (lang.code === "bn") {
        replyText =
          `মহারাজ, খাবারের কোনো অংশ না পাওয়া অত্যন্ত দুঃখজনক। অর্ডারকিং-এর 'জিরো-প্রশ্ন নীতি' অনুযায়ী মিসিং আইটেমের ১০০% টাকা অবিলম্বে আপনার ওয়ালেটে রিফান্ড করা হবে অথবা ১৫ মিনিটে এক্সপ্রেস পুনরায় পাঠানো হবে। নিচে ক্যামেরা ট্যাপ করে রসিদের ছবি দিন। টিকিট #HD-FOOD-MISSING তৈরি হয়েছে। ${selectedPersona.encouragement}`;
      } else {
        replyText =
          `I am so sorry! Under OrderKing's Zero-Interrogation Policy, you will receive a 100% instant refund for the missing dish to your KingPay wallet, or a free priority redelivery within 15 minutes! Please tap the camera icon below to attach a quick photo of your package or receipt. Escalation ticket #HD-FOOD-MISSING has been flagged to the restaurant partner. ${selectedPersona.encouragement}`;
      }
      return {
        text: replyText,
        action: { type: "SUBMIT_DISPUTE_CONSENT", label: "📸 Instant Refund / Free Redelivery" },
      };
    }

    // 3. Cold Food / Spilled / Damaged / Packaging Torn / Hygiene Issue
    if (
      q.includes("cold") ||
      q.includes("thanda") ||
      q.includes("thonda") ||
      q.includes("spill") ||
      q.includes("gir gaya") ||
      q.includes("khul gaya") ||
      q.includes("kharab") ||
      q.includes("damaged") ||
      q.includes("leak") ||
      q.includes("stale") ||
      q.includes("bashi") ||
      q.includes("hair") ||
      q.includes("bal") ||
      q.includes("chul") ||
      q.includes("poka") ||
      q.includes("insect") ||
      q.includes("keeda") ||
      q.includes("hygiene") ||
      q.includes("kacha") ||
      q.includes("kachha") ||
      q.includes("raw") ||
      q.includes("taste")
    ) {
      let replyText = "";
      if (lang.code === "hi") {
        replyText =
          `हुज़ूर, ठंडा या ख़राब खाना पहुँचना हमारे 'रॉयल थर्मल सील' मानकों का सीधा उल्लंघन है। मैं इस पूरे आइटम का 100% रिफ़ंड + ₹100 का अतिरिक्त माफ़ी वाउचर तुरंत मंज़ूर कर रही हूँ। इस रेस्टोरेंट के ख़िलाफ़ तत्काल हाइजीन ऑडिट शुरू कर दिया गया है (टिकट #HD-FOOD-QUALITY)। नीचे क्लेम बटन दबाएँ! ${selectedPersona.encouragement}`;
      } else if (lang.code === "bn") {
        replyText =
          `মহারাজ, ঠান্ডা বা নষ্ট খাবার পৌঁছানো আমাদের থার্মাল ব্যাগের নিয়মের চরম লঙ্ঘন। আমি এই আইটেমের ১০০% সম্পূর্ণ রিফান্ড এবং পরবর্তী অর্ডারের জন্য অতিরিক্ত ₹১০০ ভাউচার অনুমোদন করছি। টিকিট #HD-FOOD-QUALITY-র অধীনে রান্নাঘরের অডিট শুরু হয়েছে। নিচের বোতামে ট্যাপ করুন। ${selectedPersona.encouragement}`;
      } else {
        replyText =
          `This is completely unacceptable and violates our Royal Thermal Seal Standards. Every meal must arrive steaming hot and tamper-sealed. I am authorizing a 100% instant credit refund for this damaged item, plus a ₹100 apology voucher for your next feast! An immediate hygiene and packaging audit has been triggered for this kitchen under ticket #HD-FOOD-QUALITY. Tap below to claim your instant refund! ${selectedPersona.encouragement}`;
      }
      return {
        text: replyText,
        action: { type: "SUBMIT_DISPUTE_CONSENT", label: "🛡️ Claim 100% Refund + ₹100 Voucher" },
      };
    }

    // 4. Order Cancellation / Refund Inquiries
    if (
      q.includes("cancel") ||
      q.includes("cancle") ||
      q.includes("refund") ||
      q.includes("wapas") ||
      q.includes("ferot") ||
      q.includes("band karo") ||
      q.includes("rok do") ||
      q.includes("abort") ||
      q.includes("paisa") ||
      q.includes("taka")
    ) {
      let replyText = "";
      if (lang.code === "hi") {
        replyText =
          `हुज़ूर, यदि आपने पिछले 60 सेकंड में आर्डर दिया है, तो आप 1-टैप में 100% फ़ुल रिफ़ंड के साथ आर्डर कैंसिल कर सकते हैं। यदि शेफ़ ने तैयारी शुरू कर दी है, तो मैं व्यक्तिगत रूप से किचन सुपरवाइज़र से बात करके आर्डर रोकने की कोशिश करूँगी। सभी रिफ़ंड सीधे आपके किंगपे वॉलेट या बैंक में 2 घंटे में वापस आ जाते हैं। टिकट #HD-FOOD-CANCEL दर्ज है। ${selectedPersona.encouragement}`;
      } else if (lang.code === "bn") {
        replyText =
          `মহারাজ, অর্ডার দেওয়ার ৬০ সেকেন্ডের মধ্যে ১-ট্যাপে ১০০% সম্পূর্ণ রিফান্ড সহ অর্ডার বাতিল করতে পারেন। যদি শেফ রান্না শুরু করে থাকেন, তবে আমি সরাসরি কিচেন ইনচার্জের সাথে সমন্বয় করব। রিফান্ডের টাকা আপনার কিংপে ওয়ালেটে অবিলম্বে যোগ হবে। টিকিট #HD-FOOD-CANCEL নথিভুক্ত। ${selectedPersona.encouragement}`;
      } else {
        replyText =
          `If your order was placed within the last 60 seconds, you can cancel it with 1 tap for an instant 100% full refund! If the chef has already begun cooking, I will personally coordinate with the kitchen supervisor to pause preparation. Any approved refund is credited instantly to your KingPay wallet or returned to your source bank within 2 hours. Ticket #HD-FOOD-CANCEL is logged. ${selectedPersona.encouragement}`;
      }
      return {
        text: replyText,
        action: { type: "TRACK_ORDERS", label: "📋 Manage Order & Cancellation" },
      };
    }

    // 5. Biryani / Royal Feasts / Rice Dishes
    if (
      q.includes("biryani") ||
      q.includes("briyani") ||
      q.includes("biriyani") ||
      q.includes("biriyaani") ||
      q.includes("बिरयानी") ||
      q.includes("বিরিয়ানি") ||
      q.includes("dum") ||
      q.includes("khana") ||
      q.includes("khaibo") ||
      q.includes("khabo") ||
      q.includes("bhat") ||
      q.includes("pulao") ||
      q.includes("polao") ||
      q.includes("rice") ||
      q.includes("mutton") ||
      q.includes("chicken") ||
      q.includes("kacchi")
    ) {
      let replyText = "";
      if (lang.code === "hi") {
        replyText =
          `हुज़ूर, हमारी सबसे लोकप्रिय डिश है 'रॉयल दम बिरयानी'। यह 100% असली केसर, 2-साल पुराने बासमती चावल और देसी मसालों से तैयार की जाती है। सीधे रेस्टोरेंट के असली रेट पर 0% मार्कअप के साथ आर्डर करें! ${selectedPersona.encouragement}`;
      } else if (lang.code === "bn") {
        replyText =
          `মহারাজ, আমাদের সবচেয়ে জনপ্রিয় খাবার হল 'রয়্যাল দম বিরিয়ানি'। খাঁটি বাসমতী চাল, কেশর ও সুগন্ধি মসলায় তৈরি। রেস্তোরাঁর আসল দামে ০% অতিরিক্ত মূল্য ছাড়াই উপভোগ করুন! ${selectedPersona.encouragement}`;
      } else {
        replyText =
          `Our signature dish is the Royal Dum Biryani! Prepared with authentic aged basmati rice, slow-cooked tender cuts, and aromatic herbs with 0% menu markup. Direct dine-in restaurant rates guaranteed! ${selectedPersona.encouragement}`;
      }
      return {
        text: replyText,
        action: { type: "SEARCH_BIRYANI", label: "🍗 Explore Royal Biryanis" },
      };
    }

    // 6. Pure Veg / Jain / Halal / Dietary Assurance
    if (
      q.includes("veg") ||
      q.includes("vegetarian") ||
      q.includes("शाकाहारी") ||
      q.includes("shakahari") ||
      q.includes("নিরামিষ") ||
      q.includes("niramish") ||
      q.includes("paneer") ||
      q.includes("panir") ||
      q.includes("dal") ||
      q.includes("thali") ||
      q.includes("jain") ||
      q.includes("halal") ||
      q.includes("no onion") ||
      q.includes("no garlic") ||
      q.includes("sattvic") ||
      q.includes("vegan")
    ) {
      let replyText = "";
      if (lang.code === "hi") {
        replyText =
          `हुज़ूर, हमारे पास 100% शुद्ध शाकाहारी और जैन सर्टिफ़ाइड किचन मौजूद हैं। अलग बर्तन, बिना प्याज़-लहसुन के विकल्प और हरे रंग की सुरक्षा टेप से सील किए गए डिब्बे आपको 100% पवित्रता का भरोसा दिलाते हैं। ${selectedPersona.encouragement}`;
      } else if (lang.code === "bn") {
        replyText =
          `মহারাজ, আমাদের খাঁটি নিরামিষ ও জৈন সার্টিফাইড রান্নাঘর রয়েছে। সম্পূর্ণ আলাদা রান্নার পাত্র, হালাল সার্টিফিকেশন এবং সবুজ রঙের সিকিউরিটি সিল নিশ্চিত করে ১০০% বিশুদ্ধতা। ${selectedPersona.encouragement}`;
      } else {
        replyText =
          `We have dedicated 100% Pure Vegetarian, Jain, and Halal-certified partner kitchens. Prepared with completely segregated cookware, optional no-onion/no-garlic preparations, and green tamper-proof security seals ensuring zero cross-contamination! ${selectedPersona.encouragement}`;
      }
      return {
        text: replyText,
        action: { type: "SEARCH_VEG", label: "🥗 Show Pure Veg & Certified Dishes" },
      };
    }

    // 7. Discounts / Offers / Coupons / 0% Markup vs Zomato & Swiggy
    if (
      q.includes("discount") ||
      q.includes("offer") ||
      q.includes("coupon") ||
      q.includes("markup") ||
      q.includes("sasta") ||
      q.includes("sosta") ||
      q.includes("kam daam") ||
      q.includes("bachat") ||
      q.includes("save") ||
      q.includes("swiggy") ||
      q.includes("zomato") ||
      q.includes("price") ||
      q.includes("कूपन") ||
      q.includes("অফার")
    ) {
      let replyText = "";
      if (lang.code === "hi") {
        replyText =
          `हुज़ूर, ज़ोमैटो और स्विगी रेस्टोरेंट की कीमतों पर 30% तक अतिरिक्त मार्कअप लगाते हैं। आर्डरकिंग पर सभी मेन्यू 0% मार्कअप पर हैं—यानी जो रेट रेस्टोरेंट के मेन्यू कार्ड पर है, वही रेट आपको यहाँ मिलता है! आप प्रति आर्डर ₹150–₹350 बचाते हैं। साथ ही कूपन कोड 'KINGVIP' से फ़्री डिलीवरी और हर आर्डर पर 24K डिजिटल गोल्ड कैशबैक मिलता है! ${selectedPersona.encouragement}`;
      } else if (lang.code === "bn") {
        replyText =
          `মহারাজ, সুইগি বা জোম্যাটোর মতো দাম ৩০% বাড়িয়ে নেওয়া হয় না। অর্ডারকিং-এ ০% মেনু মার্কআপ গ্যারান্টি—রেস্তোরাঁর আসল মেনু কার্ডের দামেই খাবার পাবেন! আপনি প্রতি অর্ডারে ₹১৫০–₹৩৫০ সাশ্রয় করবেন। কুপন 'KINGVIP' দিয়ে ফ্রি ডেলিভারি ও ২৪K গোল্ড ক্যাশব্যাক উপভোগ করুন। ${selectedPersona.encouragement}`;
      } else {
        replyText =
          `Unlike other apps that inflate prices by up to 30%, OrderKing guarantees 0% menu markup—you pay exact offline restaurant dine-in prices! You save ₹150–₹350 on every single meal. Use code 'KINGVIP' for Free Delivery and code 'ROYAL50' for 50% off on your first feasts, plus 24K digital gold cashback on every dish! ${selectedPersona.encouragement}`;
      }
      return {
        text: replyText,
        action: { type: "VIEW_OFFERS", label: "🎁 View All Live Coupons & Gold Deals" },
      };
    }

    // 8. Rider Misconduct / Cash Demands / Unprofessional Behavior
    if (
      q.includes("delivery boy") ||
      q.includes("badtameez") ||
      q.includes("rude") ||
      q.includes("tip") ||
      q.includes("bakhsheesh") ||
      q.includes("extra money") ||
      q.includes("misbehave") ||
      q.includes("shout") ||
      q.includes("jhamela") ||
      q.includes("chanda")
    ) {
      let replyText = "";
      if (lang.code === "hi") {
        replyText =
          `हुज़ूर, आर्डरकिंग में डिलीवरी पार्टनर द्वारा कैश टिप माँगना या अनुचित व्यवहार करना सख्त वर्जित है। मैंने इस राइडर को आपके अकाउंट से हमेशा के लिए अनअसाइन कर दिया है और सिटी ऑपरेशंस को अनुशासनात्मक कार्रवाई के लिए रिपोर्ट #HD-SAFETY-RIDER भेज दी है। हमें इस असुविधा के लिए बेहद खेद है। ${selectedPersona.encouragement}`;
      } else if (lang.code === "bn") {
        replyText =
          `মহারাজ, ডেলিভারি রাইডারের কাছ থেকে কোনো রকম খারাপ ব্যবহার বা অতিরিক্ত বকশিশ দাবি করা সম্পূর্ণ নিষিদ্ধ। আমি এই রাইডারকে অবিলম্বে সরিয়ে দিয়েছি এবং শাস্তিমূলক পদক্ষেপের জন্য রিপোর্ট #HD-SAFETY-RIDER পাঠিয়েছি। ${selectedPersona.encouragement}`;
      } else {
        replyText =
          `OrderKing maintains a strict zero-tolerance policy against unprofessional rider behavior or demands for cash tips. All our delivery partners are fairly compensated above industry benchmarks. I have immediately unassigned this rider from your current and future deliveries, and escalated incident report #HD-SAFETY-RIDER to city operations for urgent disciplinary action. We sincerely apologize! ${selectedPersona.encouragement}`;
      }
      return {
        text: replyText,
        action: { type: "SUBMIT_DISPUTE_CONSENT", label: "⚠️ Escalate to Founder Deck" },
      };
    }

    // 9. KingPay / Wallet / Bill / Challan switch query
    if (
      q.includes("kingpay") ||
      q.includes("pay") ||
      q.includes("wallet") ||
      q.includes("upi") ||
      q.includes("bill") ||
      q.includes("challan") ||
      q.includes("fastag") ||
      q.includes("टাকা") ||
      q.includes("वॉलेट")
    ) {
      return {
        text: `Looking for 1-Tap Zero-Fee UPI payments, custom QR with gifting notes, vehicle police challans, or electricity bills? You can switch directly to King Pay below! ${selectedPersona.encouragement}`,
        action: { type: "OPEN_KINGPAY", label: "👑 Open King Pay" },
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
        text: `I truly admire your incredible drive and ambition to build a massive business and generate real income! However, I must be completely honest with you: I am an AI Food Concierge simulated interface. I cannot independently find real clients, accept actual payments, or build heavy organizational apps on my own without human operation. I am here to showcase this beautiful UI and help you navigate the OrderKing food ecosystem. For real business operations, human expertise is always required! ${selectedPersona.encouragement}`,
        action: { type: "VIEW_OFFERS", label: "👑 View Founder Command Operations" },
      };
    }

    // 11. Empathetic Fuzzy Fallback for Unclear / Mumbled Speech or Ambient Noise
    if (q.length < 4 || q.split(" ").length > 15) {
      return {
        text: `I heard you clearly! Even if your surroundings were noisy, I am right here by your side. Would you like me to find today's hot Royal Dum Biryani, filter 100% Pure Vegetarian meals, track your live delivery, or resolve any order issue? ${selectedPersona.encouragement}`,
        action: { type: "SEARCH_BIRYANI", label: "🍗 Explore Royal Biryanis" },
      };
    }

    // Default polite and motivating food assistance
    return {
      text: `I have carefully noted: "${query}". While I am highly capable within the OrderKing platform, my expertise is purely in food delivery, dispute resolution, and UI assistance! I can instantly find authentic Royal Biryani, explore 100% Pure Veg kitchens, track your live delivery rider with GPS, or claim instant resolution for any delay. I am your loyal digital assistant! ${selectedPersona.encouragement}`,
    };
  };

  const handleSendMessage = (textToSend?: string, isVoice: boolean = false) => {
    const text = (textToSend || inputText).trim();
    if (!text && attachedFiles.length === 0) return;

    // Automatic Language Detection (Zero manual selection required)
    const detectedLangCode = detectLanguage(text, userGeoLang || "en");
    const matchedLang =
      FOOD_SUPPORTED_LANGUAGES.find((l) => l.code === detectedLangCode) || selectedLang;
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
          text: "I have verified your attached evidence. Your ticket is registered securely on the HD Master Founder Review Desk for manual approval and priority resolution.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          consentRequired: true,
          actionPayload: {
            type: "SUBMIT_DISPUTE_CONSENT",
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
        FOOD_SUPPORTED_LANGUAGES.find((l) => l.code === userGeoLang) || FOOD_SUPPORTED_LANGUAGES[0]!;
      const fallbackText = `I am your OrderKing Food Assistant! How can I assist you with your feast, biryani, or order tracking today?`;
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actionPayload: {
          type: "SEARCH_BIRYANI",
          label: "🍗 Explore Royal Dum Biryani",
        },
      };
      setMessages((prev) => [...prev, aiMsg]);
      if (isVoice || callModeRef.current) {
        speakResponse(fallbackText, matchedLang.voiceLang);
      }
      return;
    }

    // When triggered by voice, execute immediately to preserve browser audio activation
    const { text: replyText, action } = generateFoodAiReply(text, matchedLang);
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
    if (action.type === "SUBMIT_DISPUTE_CONSENT") {
      setConsentGiven(true);
      toast.success("Ticket and evidence authorized for Founder Sovereign Review!");
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: "✅ Consent received. Your dispute has been submitted to Founder Review & restaurant partner under IT Act intermediary safe harbor terms.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      return;
    }
    setIsOpen(false);
    if (action.type === "SEARCH_BIRYANI") {
      void navigate({ to: "/search", search: { q: "biryani" } });
    } else if (action.type === "SEARCH_VEG") {
      void navigate({ to: "/search", search: { veg: true } });
    } else if (action.type === "TRACK_ORDERS") {
      void navigate({ to: "/orders" });
    } else if (action.type === "VIEW_OFFERS") {
      void navigate({ to: "/offers" });
    } else if (action.type === "OPEN_KINGPAY") {
      void navigate({ to: "/king-pay" });
    }
  };

  return (
    <>
      {/* FLOATING ORDERKING AI FOOD ASSISTANT BUTTON (BOTTOM RIGHT - HIDDEN BY DEFAULT) */}
      {!hideFloatingTrigger && (
        <div className="fixed bottom-20 right-4 z-40 sm:bottom-6 sm:right-6">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2 rounded-full border-2 border-primary/80 bg-gradient-to-tr from-primary via-emerald-800 to-[#07241C] px-3.5 py-2.5 shadow-[0_6px_25px_rgba(16,185,129,0.45)] transition-all hover:scale-105 active:scale-95 text-white"
            aria-label="Open OrderKing AI Food Assistant"
          >
            {/* Animated Glowing Chef Icon */}
            <div className="relative flex size-8 items-center justify-center rounded-full bg-amber-400 text-slate-950 font-black shadow-md">
              <Utensils className="size-4.5 text-amber-950 animate-bounce" />
              <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-300 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-amber-500" />
              </span>
            </div>

            <div className="text-left pr-1">
              <span className="block text-[11px] font-black uppercase tracking-wider text-amber-300">
                Food AI Voice
              </span>
              <span className="block text-[10px] text-emerald-200 font-medium">
                12 Indian Languages
              </span>
            </div>
          </button>
        </div>
      )}

      {/* FULL FOOD AI VOICE & TEXT CHAT MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md">
          <div className="w-full max-w-lg h-[90vh] max-h-[680px] rounded-3xl border-2 border-primary/50 bg-surface shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-primary via-emerald-900 to-[#07241C] p-3 sm:p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="relative flex size-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-black shadow-md">
                  <Utensils className="size-6 text-amber-950" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-black tracking-tight">
                      OrderKing AI Food Concierge
                    </h3>
                    <span className="rounded-full bg-amber-400 px-2 py-0.2 text-[9px] font-black text-black">
                      0% Markup
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200">
                    Voice &amp; Text in 12 Indian Languages
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleCallMode}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black shadow-md transition ${
                    isCallMode
                      ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse"
                      : "bg-amber-400 hover:bg-amber-300 text-slate-950"
                  }`}
                  title={isCallMode ? "End Voice Call" : "Start Live Voice Call with Priya"}
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
                <button
                  type="button"
                  onClick={() => {
                    if (voiceEnabled) stopSpeaking();
                    setVoiceEnabled(!voiceEnabled);
                  }}
                  className="rounded-full p-2 text-white/80 hover:bg-white/20 transition"
                  title={voiceEnabled ? "Mute Voice" : "Enable Voice"}
                >
                  {voiceEnabled ? <Volume2 className="size-5" /> : <VolumeX className="size-5 text-rose-300" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isCallMode) toggleCallMode();
                    stopSpeaking();
                    setIsOpen(false);
                  }}
                  className="rounded-full p-2 text-white/80 hover:bg-white/20 transition"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Live Continuous Voice Call Mode Banner */}
            {isCallMode && (
              <div className="flex items-center justify-between bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-lg border-b border-emerald-400/30">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex size-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full size-3 bg-emerald-100"></span>
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black tracking-wide flex items-center gap-1.5">
                      <span>🟢 Live Voice Call Connected</span>
                      <span className="text-[10px] font-normal text-emerald-100">(Turn-by-turn auto speaking &amp; listening)</span>
                    </span>
                    <span className="text-[9px] text-emerald-200">
                      {isSpeaking ? "🔊 Priya is speaking..." : isListening ? "🎙️ Listening to your voice..." : "⚡ Ready — speak freely..."}
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

            {/* 1-TAP INSTANT FOOD ACTION RADAR (ZERO TYPING REQUIRED) */}
            <div className="border-b border-border bg-gradient-to-r from-surface via-surface-2 to-surface p-2.5">
              <div className="flex items-center justify-between px-1 mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <span>⚡</span> 1-Tap Quick Feasts (No typing needed)
                </span>
                <span className="text-[9px] font-semibold text-muted">0% Menu Markup</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    void navigate({ to: "/search", search: { q: "biryani" } });
                  }}
                  className="shrink-0 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/5 border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 hover:scale-105 active:scale-95 transition flex items-center gap-1.5 shadow-2xs"
                >
                  <span>🍗</span> Best Dum Biryani
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    void navigate({ to: "/search", search: { veg: true } });
                  }}
                  className="shrink-0 rounded-xl bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:scale-105 active:scale-95 transition flex items-center gap-1.5 shadow-2xs"
                >
                  <span>🥗</span> Pure Veg Thalis
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    void navigate({ to: "/orders" });
                  }}
                  className="shrink-0 rounded-xl bg-gradient-to-r from-blue-500/15 to-indigo-500/5 border border-blue-500/30 px-3 py-1.5 text-xs font-bold text-blue-800 dark:text-blue-300 hover:scale-105 active:scale-95 transition flex items-center gap-1.5 shadow-2xs"
                >
                  <span>⚡</span> Track Active Order
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    void navigate({ to: "/offers" });
                  }}
                  className="shrink-0 rounded-xl bg-gradient-to-r from-rose-500/15 to-pink-500/5 border border-rose-500/30 px-3 py-1.5 text-xs font-bold text-rose-800 dark:text-rose-300 hover:scale-105 active:scale-95 transition flex items-center gap-1.5 shadow-2xs"
                >
                  <span>🏷️</span> Today's Big Offers
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    void navigate({ to: "/king-pay" });
                  }}
                  className="shrink-0 rounded-xl bg-gradient-to-r from-yellow-500/15 to-amber-500/5 border border-yellow-500/30 px-3 py-1.5 text-xs font-bold text-yellow-800 dark:text-yellow-300 hover:scale-105 active:scale-95 transition flex items-center gap-1.5 shadow-2xs"
                >
                  <span>👑</span> Switch to King Pay
                </button>
              </div>
            </div>

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
                          alt="Attached file proof"
                          className="max-h-48 w-full object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <p className="leading-relaxed font-medium whitespace-pre-wrap">{msg.text}</p>
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

                  {/* Consent Routing Card (Safe Harbor - Route to HD Master) */}
                  {msg.consentRequired && !consentGiven && (
                    <div className="mt-2.5 max-w-[90%] rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-foreground space-y-2 shadow-xs">
                      <label className="flex items-start gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={consentGiven}
                          onChange={(e) => setConsentGiven(e.target.checked)}
                          className="mt-0.5 rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-[11px] leading-tight text-foreground/90">
                          I confirm consent to route this ticket and attached files to HD Master Founder Review Desk for manual approval &amp; priority resolution.
                        </span>
                      </label>
                      <Button
                        size="sm"
                        disabled={!consentGiven}
                        onClick={() => handleActionClick({ type: "SUBMIT_DISPUTE_CONSENT", label: "Submit" })}
                        className="w-full text-xs font-bold bg-primary text-white hover:bg-primary/90"
                      >
                        <ShieldCheck className="size-3.5 mr-1" />
                        Confirm Consent &amp; Route to Founder Desk
                      </Button>
                    </div>
                  )}

                  {msg.actionPayload && !msg.consentRequired && (
                    <div className="mt-2">
                      <Button
                        size="sm"
                        onClick={() => handleActionClick(msg.actionPayload!)}
                        className="bg-primary text-white hover:bg-primary/90 text-xs font-bold px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5"
                      >
                        <Sparkles className="size-3.5" />
                        <span>{msg.actionPayload.label}</span>
                      </Button>
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
                  <span>🎙️ Listening in {selectedLang.name}... Speak your question! (Tap mic to stop)</span>
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
            <div className="border-t border-border bg-surface p-3 sm:p-4">
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
                  title="Attach Image, Screenshot, Video or Document"
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

                {/* Voice Microphone Input Button */}
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`flex size-9 items-center justify-center rounded-full transition shrink-0 ${
                    isListening
                      ? "bg-rose-600 text-white animate-pulse shadow-md"
                      : "text-muted hover:bg-surface hover:text-foreground"
                  }`}
                  title="Speak via Microphone"
                >
                  {isListening ? <MicOff className="size-4.5" /> : <Mic className="size-4.5" />}
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onPaste={handlePaste}
                  placeholder={`Ask in ${selectedLang.name}... (e.g. Biryani, late delivery, refunds)`}
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
