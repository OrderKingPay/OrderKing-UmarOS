// Supreme Voice Engine (v2.0 Supreme)
// Web Audio DSP Chain, 100% Realistic Young Female Vocal Personas, 
// Multi-Language Synthesis & Recognition, Full-Duplex Auto-Turn-Taking

export type VoicePersonaId = "aria" | "priya" | "ananya" | "zara";

export type VoicePersona = {
  id: VoicePersonaId;
  name: string;
  tagline: string;
  pitch: number; // 1.16 - 1.24 for young attractive natural female timbre
  rate: number; // 1.02 - 1.08 for crisp, engaging executive tempo
  recommendedLanguages: string[];
  preferredVoiceNames: string[];
  vocalAuraColor: string;
  dspProfile: {
    presenceGainDb: number;
    airShelfDb: number;
    lowCutHz: number;
  };
};

export type SupportedLanguage = {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  greetingText: string;
};

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: "en-IN", name: "Indian English", nativeName: "English (India)", flag: "🇮🇳", greetingText: "Hello Founder, I am ready to close deals and build applications with you." },
  { code: "bn-IN", name: "Bengali (Kolkata/Barak/Sylheti)", nativeName: "বাংলা (ভারত / সিলেট)", flag: "🇮🇳", greetingText: "নমস্কার ফাউন্ডার, আমি আপনার সাথে ক্লায়েন্ট আনা এবং বড় অ্যাপস বানানোর জন্য তৈরি আছি।" },
  { code: "hi-IN", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", greetingText: "नमस्ते फाउंडर, मैं क्लाइंट्स क्लोज़ करने और आपके लिए रियल इनकम जनरेट करने के लिए तैयार हूँ।" },
  { code: "as-IN", name: "Assamese", nativeName: "অসমীয়া", flag: "🇮🇳", greetingText: "নমস্কাৰ ফাউণ্ডাৰ, মই ব্যৱসায়িক চুক্তি আৰু এপ্লিকেচন নিৰ্মাণৰ বাবে সাজু আছোঁ।" },
  { code: "ur-IN", name: "Urdu", nativeName: "اردو", flag: "🇮🇳", greetingText: "آداب فاؤنڈر، میں کلائنٹس اور پروجیکٹس کو حتمی شکل دینے کے لیے مکمل تیار ہوں۔" },
  { code: "en-US", name: "US English", nativeName: "English (US)", flag: "🇺🇸", greetingText: "Welcome Founder. Sovereign autonomous executive intelligence is online." },
  { code: "en-GB", name: "British English", nativeName: "English (UK)", flag: "🇬🇧", greetingText: "Good day Founder. Ready to acquire high-value contracts and scaffold enterprise systems." },
  { code: "es-ES", name: "Spanish", nativeName: "Español", flag: "🇪🇸", greetingText: "Hola Fundador. Estoy lista para conseguir clientes y construir aplicaciones de alto valor." },
  { code: "fr-FR", name: "French", nativeName: "Français", flag: "🇫🇷", greetingText: "Bonjour Fondateur. Je suis prête à convertir des contrats et développer des architectures." },
  { code: "ar-SA", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", greetingText: "أهلاً بك يا مؤسس. أنا جاهزة للحصول على عملاء متميزين وتحقيق أرباح حقيقية." },
  { code: "de-DE", name: "German", nativeName: "Deutsch", flag: "🇩🇪", greetingText: "Hallo Gründer. Bereit für Enterprise-Architekturen und profitable Kundenverträge." },
  { code: "zh-CN", name: "Mandarin Chinese", nativeName: "中文 (普通话)", flag: "🇨🇳", greetingText: "创始人您好，我已准备好为您拓展高端企业客户并交付大型软件系统。" },
  { code: "ja-JP", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", greetingText: "ファウンダー、準備が整いました。クライアントの獲得と大規模アプリの構築を実行します。" },
  { code: "ta-IN", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳", greetingText: "வணக்கம் ஃபவுண்டர், பெரிய திட்டங்களை உருவாக்கி ஒப்பந்தங்களை முடிக்க நான் தயார்." },
  { code: "te-IN", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳", greetingText: "నమస్కారం ఫౌండర్, క్లయింట్లను ఆకర్షించడానికి మరియు యాప్‌లను రూపొందించడానికి నేను సిద్ధంగా ఉన్నాను." },
];

export const VOICE_PERSONAS: Record<VoicePersonaId, VoicePersona> = {
  aria: {
    id: "aria",
    name: "Aria",
    tagline: "Global Tech Executive · Charismatic, clear & highly persuasive",
    pitch: 1.18,
    rate: 1.05,
    recommendedLanguages: ["en-US", "en-GB", "en-IN", "es-ES", "fr-FR", "de-DE"],
    preferredVoiceNames: ["Aria", "Jenny", "Samantha", "Victoria", "Google US English", "Natural"],
    vocalAuraColor: "#F59E0B", // Amber Gold
    dspProfile: {
      presenceGainDb: 3.2,
      airShelfDb: 2.4,
      lowCutHz: 120,
    },
  },
  priya: {
    id: "priya",
    name: "Priya",
    tagline: "Indian Founder Voice · Crisp bilingual Hindi & English deal-closer",
    pitch: 1.20,
    rate: 1.06,
    recommendedLanguages: ["en-IN", "hi-IN", "ur-IN", "te-IN", "ta-IN"],
    preferredVoiceNames: ["Priya", "Veena", "Heera", "Kavya", "Google हिन्दी", "Google UK English Female"],
    vocalAuraColor: "#10B981", // Emerald
    dspProfile: {
      presenceGainDb: 3.5,
      airShelfDb: 2.0,
      lowCutHz: 130,
    },
  },
  ananya: {
    id: "ananya",
    name: "Ananya",
    tagline: "Bengal & Northeast Sovereign · Warm, melodious Bengali & Sylheti native",
    pitch: 1.22,
    rate: 1.04,
    recommendedLanguages: ["bn-IN", "as-IN", "en-IN"],
    preferredVoiceNames: ["Ananya", "Tanisha", "Google বাংলা", "Natural Bengali", "Veena"],
    vocalAuraColor: "#06B6D4", // Cyan
    dspProfile: {
      presenceGainDb: 3.8,
      airShelfDb: 2.6,
      lowCutHz: 140,
    },
  },
  zara: {
    id: "zara",
    name: "Zara",
    tagline: "International Multilingual Strategist · Sophisticated & resonant",
    pitch: 1.16,
    rate: 1.02,
    recommendedLanguages: ["en-GB", "es-ES", "fr-FR", "de-DE", "ar-SA", "zh-CN", "ja-JP"],
    preferredVoiceNames: ["Sonia", "Zira", "Amelie", "Lucia", "Kyoko", "Google UK English Female"],
    vocalAuraColor: "#8B5CF6", // Purple / Violet
    dspProfile: {
      presenceGainDb: 2.8,
      airShelfDb: 3.0,
      lowCutHz: 110,
    },
  },
};

// Web Audio DSP Engine Singleton for Broadcast Quality Sound
class SupremeWebAudioDsp {
  private ctx: AudioContext | null = null;
  private presenceFilter: BiquadFilterNode | null = null;
  private airShelf: BiquadFilterNode | null = null;
  private lowCutFilter: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode | null = null;

  public init() {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === "suspended") {
        void this.ctx.resume();
      }

      // Initialize DSP nodes if not yet created
      if (!this.presenceFilter) {
        // High-pass filter to remove rumble (< 120Hz)
        this.lowCutFilter = this.ctx.createBiquadFilter();
        this.lowCutFilter.type = "highpass";
        this.lowCutFilter.frequency.setValueAtTime(120, this.ctx.currentTime);

        // Vocal presence peak filter (~3.2 kHz for speech intelligibility & sparkle)
        this.presenceFilter = this.ctx.createBiquadFilter();
        this.presenceFilter.type = "peaking";
        this.presenceFilter.frequency.setValueAtTime(3200, this.ctx.currentTime);
        this.presenceFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);
        this.presenceFilter.gain.setValueAtTime(3.2, this.ctx.currentTime);

        // High shelf filter (~8.0 kHz for airy high-end intimacy)
        this.airShelf = this.ctx.createBiquadFilter();
        this.airShelf.type = "highshelf";
        this.airShelf.frequency.setValueAtTime(8000, this.ctx.currentTime);
        this.airShelf.gain.setValueAtTime(2.2, this.ctx.currentTime);

        // Dynamic Range Compressor (Broadcast Radio / Podcast warmth & proximity effect)
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-24, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

        // Audio Frequency Analyser for 3D Visualizer Orb
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 128;
        this.analyser.smoothingTimeConstant = 0.8;

        // Chain together: LowCut -> Presence -> AirShelf -> Compressor -> Analyser -> Destination
        this.lowCutFilter.connect(this.presenceFilter);
        this.presenceFilter.connect(this.airShelf);
        this.airShelf.connect(this.compressor);
        this.compressor.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
      }
    } catch (e) {
      console.warn("[SupremeWebAudioDsp] Init warning:", e);
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public applyDspProfile(profile: VoicePersona["dspProfile"]) {
    if (!this.ctx || !this.presenceFilter || !this.airShelf || !this.lowCutFilter) return;
    try {
      const now = this.ctx.currentTime;
      this.lowCutFilter.frequency.setTargetAtTime(profile.lowCutHz, now, 0.1);
      this.presenceFilter.gain.setTargetAtTime(profile.presenceGainDb, now, 0.1);
      this.airShelf.gain.setTargetAtTime(profile.airShelfDb, now, 0.1);
    } catch (e) {
      // Ignore audio parameter errors
    }
  }

  // Realistic Ringback & Notification Tones synthesized natively
  public playTone(type: "call_ring" | "call_connected" | "call_ended" | "interruption_ping" | "success_chime") {
    if (typeof window === "undefined") return;
    this.init();
    if (!this.ctx) return;

    try {
      const ctx = this.ctx;
      const now = ctx.currentTime;

      if (type === "call_ring") {
        // Dual-tone PBX ringing (440Hz + 480Hz) with phone cadencing
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.setValueAtTime(0.08, now + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.95);
        osc2.stop(now + 0.95);
      } else if (type === "call_connected") {
        // Warm rising chord (C5 -> E5 -> G5)
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.12, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.35);
        });
      } else if (type === "call_ended") {
        // Soft declining tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.exponentialRampToValueAtTime(329.63, now + 0.28);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.32);
      } else if (type === "interruption_ping") {
        // Crisp soft chime acknowledging founder's voice
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === "success_chime") {
        // Golden harmonic chord
        [523.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + i * 0.05);
          gain.gain.setValueAtTime(0.1, now + i * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.05);
          osc.stop(now + i * 0.05 + 0.4);
        });
      }
    } catch (e) {
      // Audio autoplay policy
    }
  }
}

export const supremeAudioDsp = new SupremeWebAudioDsp();

// Best Voice Finder Heuristics
export function selectBestBrowserVoice(
  voices: SpeechSynthesisVoice[],
  persona: VoicePersona,
  targetLangCode: string
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  const langPrefix = targetLangCode.slice(0, 2).toLowerCase();

  // 1. Look for preferred names matching target language
  for (const pref of persona.preferredVoiceNames) {
    const match = voices.find(
      (v) =>
        v.lang.toLowerCase().startsWith(langPrefix) &&
        v.name.toLowerCase().includes(pref.toLowerCase())
    );
    if (match) return match;
  }

  // 2. Look for natural/neural/female voices in matching language
  const naturalMatch = voices.find(
    (v) =>
      v.lang.toLowerCase().startsWith(langPrefix) &&
      (v.name.toLowerCase().includes("natural") ||
        v.name.toLowerCase().includes("online") ||
        v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("neural"))
  );
  if (naturalMatch) return naturalMatch;

  // 3. Look for any matching language voice
  const langMatch = voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
  if (langMatch) return langMatch;

  // 4. Fallback: Any English natural female voice
  const fallback = voices.find(
    (v) =>
      v.lang.toLowerCase().startsWith("en") &&
      (v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("zira") ||
        v.name.toLowerCase().includes("samantha") ||
        v.name.toLowerCase().includes("jenny"))
  );

  return fallback || voices[0] || null;
}

// Heuristic Language Detector from input query
export function detectSpokenOrTextLanguage(text: string): string {
  const t = text.toLowerCase();

  // Bengali Unicode or common phonetics
  if (
    /[\u0980-\u09FF]/.test(text) ||
    /\b(kemon|bhalo|apnar|ami|korbo|taka|lagbe|shuru|hoise|kisu|kichu|amader|apni)\b/i.test(text)
  ) {
    return "bn-IN";
  }

  // Hindi Devanagari or common Hinglish
  if (
    /[\u0900-\u097F]/.test(text) ||
    /\b(namaste|kaise|karna|chahiye|paise|karo|aapka|bhai|shukriya|mujhe|kamana|hoga)\b/i.test(text)
  ) {
    return "hi-IN";
  }

  // Assamese specific keywords
  if (/\b(axom|bhal|namaskar|lagibo)\b/i.test(text)) {
    return "as-IN";
  }

  // Spanish
  if (/\b(hola|buenos|gracias|por favor|dinero|amigo|proyecto)\b/i.test(text)) {
    return "es-ES";
  }

  // French
  if (/\b(bonjour|merci|argent|projet|développer|développement)\b/i.test(text)) {
    return "fr-FR";
  }

  // Arabic
  if (/[\u0600-\u06FF]/.test(text) || /\b(marhaban|shukran|mashrooa)\b/i.test(text)) {
    return "ar-SA";
  }

  // German
  if (/\b(hallo|danke|projekt|geld|machen|wir)\b/i.test(text)) {
    return "de-DE";
  }

  // Chinese
  if (/[\u4E00-\u9FFF]/.test(text)) {
    return "zh-CN";
  }

  // Japanese
  if (/[\u3040-\u30FF]/.test(text)) {
    return "ja-JP";
  }

  // Default to Indian English
  return "en-IN";
}
