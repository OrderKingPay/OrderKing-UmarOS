"use client";

import React, { useState } from "react";
import {
  Video,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Languages,
  Film,
  Sparkles,
  Download,
  Copy,
  Clock,
  Radio,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Bell,
  Waves,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface StoryboardScene {
  sceneNumber: number;
  durationSeconds: number;
  title: string;
  visualPrompt: string;
  voiceover: {
    en: string;
    hi: string;
    bn: string;
    as: string;
  };
}

const DEFAULT_STORYBOARD: StoryboardScene[] = [
  {
    sceneNumber: 1,
    durationSeconds: 3,
    title: "Scene 1: The Midnight Craving",
    visualPrompt: "Close-up cinematic 4k shot of steaming handi biryani garnished with saffron and fried onions at midnight, warm amber lighting.",
    voiceover: {
      en: "Midnight hunger striking again? Don't settle for cold leftovers.",
      hi: "आधी रात को लगी है ज़ोर की भूख? अब समझौता क्यों करना?",
      bn: "মধ্যরাতে হঠাৎ খিদে পেয়েছে? বাসি খাবার আর নয়।",
      as: "মাজনিশা বৰকৈ ভোক লাগিছে নেকি? ঠাণ্ডা খোৱা বন্ধ কৰক।",
    },
  },
  {
    sceneNumber: 2,
    durationSeconds: 4,
    title: "Scene 2: Instant Hyperlocal Dispatch",
    visualPrompt: "Rider on electric smart scooter picking up sealed insulated thermal bag, digital dashboard showing 12 mins ETA.",
    voiceover: {
      en: "OrderKing partners with top local kitchens to deliver boiling hot food in under 15 minutes.",
      hi: "ऑर्डरकिंग लाता है गरमा-गरम खाना मात्र १५ मिनट में, सीधे आपकी पसंदीदा रसोई से।",
      bn: "অর্ডারকিং আপনার পছন্দের রেস্তোরাঁ থেকে গরম খাবার ১৫ মিনিটের মধ্যে পৌঁছে দেয়।",
      as: "অৰ্ডাৰকিঙে আপোনাৰ প্ৰিয় ৰান্ধনীশালৰ পৰা ১৫ মিনিটৰ ভিতৰতে তপত খাদ্য আনে।",
    },
  },
  {
    sceneNumber: 3,
    durationSeconds: 3,
    title: "Scene 3: Zero-Failure KingPay Soundbox",
    visualPrompt: "Customer tapping UPI on KingPay Soundbox. Instant green light strobe and loud crystal chime confirmation.",
    voiceover: {
      en: "Pay with one tap using KingPay UPI — zero merchant commission, instant rewards.",
      hi: "किंगपे यूपीआई से करें एक टैप में भुगतान — जीरो मर्चेंट कमीशन और तुरंत कैशबैक।",
      bn: "কিংপে ইউপিআই দিয়ে এক ট্যাপে পেমেন্ট করুন — শূন্য কমিশন এবং নিশ্চিত ক্যাশব্যাক।",
      as: "কিংপে ইউপিআইৰে মাত্ৰ এটা টেপতে পৰিশোধ কৰক — কোনো মাচুল নাই, নিশ্চিত পুৰস্কাৰ।",
    },
  },
  {
    sceneNumber: 4,
    durationSeconds: 2,
    title: "Scene 4: Call to Action",
    visualPrompt: "Bold animated emerald crest: OrderKing app download QR code and ₹100 first-order voucher.",
    voiceover: {
      en: "Download OrderKing now. First delivery free!",
      hi: "अभी डाउनलोड करें ऑर्डरकिंग। पहली डिलीवरी बिल्कुल मुफ्त!",
      bn: "এখনই ডাউনলোড করুন অর্ডারকিং। প্রথম ডেলিভারি একদম ফ্রি!",
      as: "এতিয়াই ডাউনলোড কৰক অৰ্ডাৰকিং। প্ৰথম ডেলিভাৰী সম্পূৰ্ণ বিনামূলীয়া!",
    },
  },
];

export function MediaProductionStudio() {
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "hi" | "bn" | "as">("hi");
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isPlayingSoundbox, setIsPlayingSoundbox] = useState(false);
  const [storyboard, setStoryboard] = useState<StoryboardScene[]>(DEFAULT_STORYBOARD);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const activeScene = storyboard[activeSceneIndex];

  // Web Audio API Soundbox hardware chime synthesizer
  const playSoundboxChime = (lang: "en" | "hi" | "bn" | "as") => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        toast.info("Audio API not supported in this browser.");
        return;
      }

      setIsPlayingSoundbox(true);
      const ctx = new AudioContext();

      // Soundbox signature chime (two bell tones: 587 Hz (D5) -> 880 Hz (A5))
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

        gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      playTone(587.33, 0, 0.25);
      playTone(880.0, 0.15, 0.4);

      // Speech synthesis for hardware voice prompt
      setTimeout(() => {
        if ("speechSynthesis" in window) {
          const texts: Record<string, { text: string; langTag: string }> = {
            en: { text: "KingPay: Received two hundred and fifty rupees.", langTag: "en-IN" },
            hi: { text: "किंगपे पर दो सौ पचास रुपये प्राप्त हुए।", langTag: "hi-IN" },
            bn: { text: "কিংপে-তে দুইশত পঞ্চাশ টাকা প্রাপ্ত হলো।", langTag: "bn-IN" },
            as: { text: "কিংপেত দুশ পঞ্চাশ টকা লাভ কৰা হ'ল।", langTag: "as-IN" },
          };

          const voiceData = texts[lang];
          const utterance = new SpeechSynthesisUtterance(voiceData.text);
          utterance.lang = voiceData.langTag;
          utterance.rate = 1.0;
          utterance.pitch = 1.05;
          utterance.onend = () => setIsPlayingSoundbox(false);
          utterance.onerror = () => setIsPlayingSoundbox(false);

          window.speechSynthesis.speak(utterance);
        } else {
          setIsPlayingSoundbox(false);
        }
      }, 500);

      toast.success(`Soundbox Chime Broadcast: [${lang.toUpperCase()}] ₹250.00`);
    } catch (e: any) {
      setIsPlayingSoundbox(false);
      toast.error("Audio playback error: " + e.message);
    }
  };

  const handleGenerateScript = () => {
    if (!prompt.trim()) {
      toast.error("Please enter a campaign topic prompt.");
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      toast.success("Synthesized 4-scene multilingual video campaign!");
    }, 900);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-emerald-600" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Universal Video & Audio Studio (DEMO C)
            </h2>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full">
              STORYBOARD & SOUNDBOX DSP
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Multilingual viral video production and KingPay hardware acoustic synthesizer supporting English, Hindi, Bengali, and Assamese.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="bg-white border border-slate-300 rounded-xl p-1 flex items-center gap-1 shadow-sm">
            <button
              onClick={() => setSelectedLanguage("en")}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                selectedLanguage === "en" ? "bg-emerald-600 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setSelectedLanguage("hi")}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                selectedLanguage === "hi" ? "bg-emerald-600 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setSelectedLanguage("bn")}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                selectedLanguage === "bn" ? "bg-emerald-600 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              বাংলা
            </button>
            <button
              onClick={() => setSelectedLanguage("as")}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                selectedLanguage === "as" ? "bg-emerald-600 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              অসমীয়া
            </button>
          </div>
        </div>
      </div>

      {/* Script Prompt Bar */}
      <div className="p-6 border-b border-slate-200 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. 15-second viral Instagram Reel for Durga Puja sweets delivery with 10-minute guarantee..."
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-sans"
          />
          <Button
            onClick={handleGenerateScript}
            disabled={isGenerating}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl gap-2 shadow-sm"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Synthesizing...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" /> Generate Storyboard
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Studio Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
        {/* Left Side: Scene Sequencer */}
        <div className="lg:col-span-5 border-r border-slate-200 bg-slate-50/60 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Film className="h-4 w-4 text-emerald-600" /> Storyboard Timeline (12s Total)
            </span>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
              4 SCENES
            </span>
          </div>

          <div className="space-y-3">
            {storyboard.map((scene, idx) => (
              <div
                key={scene.sceneNumber}
                onClick={() => setActiveSceneIndex(idx)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  activeSceneIndex === idx
                    ? "bg-white border-emerald-500 shadow-sm ring-1 ring-emerald-500"
                    : "bg-white/60 border-slate-200 hover:bg-white text-slate-600"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-slate-900">
                    {scene.title}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {scene.durationSeconds}s
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  {scene.voiceover[selectedLanguage]}
                </p>
              </div>
            ))}
          </div>

          {/* Soundbox Acoustic Testing Box */}
          <div className="mt-6 pt-6 border-t border-slate-200 bg-emerald-950 p-5 rounded-xl text-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-emerald-400" />
                <span className="font-bold text-xs font-mono uppercase tracking-wider text-emerald-300">
                  KingPay Soundbox Hardware DSP
                </span>
              </div>
              <span className="text-[9px] font-mono bg-emerald-900 px-2 py-0.5 rounded text-emerald-300 border border-emerald-700">
                LIVE WEB AUDIO
              </span>
            </div>

            <p className="text-xs text-emerald-200/80">
              Trigger real-time acoustic chime and spoken payment confirmation for merchant hardware terminals.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => playSoundboxChime("en")}
                disabled={isPlayingSoundbox}
                className="bg-emerald-800 hover:bg-emerald-700 p-2.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Volume2 className="h-3.5 w-3.5 text-emerald-400" /> English Chime
              </button>
              <button
                onClick={() => playSoundboxChime("hi")}
                disabled={isPlayingSoundbox}
                className="bg-emerald-800 hover:bg-emerald-700 p-2.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Volume2 className="h-3.5 w-3.5 text-emerald-400" /> हिन्दी आवाज़
              </button>
              <button
                onClick={() => playSoundboxChime("bn")}
                disabled={isPlayingSoundbox}
                className="bg-emerald-800 hover:bg-emerald-700 p-2.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Volume2 className="h-3.5 w-3.5 text-emerald-400" /> বাংলা ভয়েস
              </button>
              <button
                onClick={() => playSoundboxChime("as")}
                disabled={isPlayingSoundbox}
                className="bg-emerald-800 hover:bg-emerald-700 p-2.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Volume2 className="h-3.5 w-3.5 text-emerald-400" /> অসমীয়া
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Active Scene Preview & Subtitle Inspector */}
        <div className="lg:col-span-7 p-6 flex flex-col justify-between bg-white">
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 font-mono">
                Active Scene View ({activeScene.title})
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                TARGET ASPECT: 9:16 VERTICAL REEL
              </span>
            </div>

            {/* Visual Direction Card */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold">
                <Film className="h-4 w-4" /> VISUAL DIRECTION & CINEMATOGRAPHY
              </div>
              <p className="text-sm font-sans text-slate-200 leading-relaxed">
                "{activeScene.visualPrompt}"
              </p>
            </div>

            {/* Subtitle Teleprompter in 4 Languages */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono block">
                Multilingual Subtitle Tracks
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className={`p-4 rounded-xl border ${selectedLanguage === 'en' ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] font-mono font-bold text-slate-500 block mb-1">ENGLISH (en-IN)</span>
                  <p className="text-xs text-slate-800 font-medium">{activeScene.voiceover.en}</p>
                </div>

                <div className={`p-4 rounded-xl border ${selectedLanguage === 'hi' ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] font-mono font-bold text-slate-500 block mb-1">HINDI (hi-IN)</span>
                  <p className="text-xs text-slate-800 font-medium">{activeScene.voiceover.hi}</p>
                </div>

                <div className={`p-4 rounded-xl border ${selectedLanguage === 'bn' ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] font-mono font-bold text-slate-500 block mb-1">BENGALI (bn-IN)</span>
                  <p className="text-xs text-slate-800 font-medium">{activeScene.voiceover.bn}</p>
                </div>

                <div className={`p-4 rounded-xl border ${selectedLanguage === 'as' ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] font-mono font-bold text-slate-500 block mb-1">ASSAMESE (as-IN)</span>
                  <p className="text-xs text-slate-800 font-medium">{activeScene.voiceover.as}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-500">
            <span>BITRATE: 1080x1920 (60 FPS)</span>
            <span>AUDIO CODEC: AAC-LC 320 KBPS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
