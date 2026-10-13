"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Volume2,
  Copy,
  Check,
  CheckCircle2,
  Sliders,
  Save,
  RotateCcw,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PromoCopyConfig {
  dishName: string;
  kitchenName: string;
  priceInr: number;
  offerText: string;
  deliveryMins: number;
  dietaryType: "veg" | "non_veg" | "jain";
  language: "en" | "hi" | "bn" | "as";
  orderLink: string;
}

const DEFAULT_PROMO_CONFIG: PromoCopyConfig = {
  dishName: "Hyderabadi Dum Biryani (Full Handi)",
  kitchenName: "OrderKing Partner Kitchen",
  priceInr: 249,
  offerText: "Flat ₹50 OFF + Free Delivery",
  deliveryMins: 25,
  dietaryType: "non_veg",
  language: "en",
  orderLink: "https://orderking.in",
};

const STORAGE_KEY = "orderking_menu_promo_copy_v1";

export function MediaProductionStudio() {
  const [config, setConfig] = useState<PromoCopyConfig>(DEFAULT_PROMO_CONFIG);
  const [savedConfig, setSavedConfig] = useState<PromoCopyConfig>(DEFAULT_PROMO_CONFIG);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = { ...DEFAULT_PROMO_CONFIG, ...JSON.parse(raw) };
        setConfig(parsed);
        setSavedConfig(parsed);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const hasChanges = JSON.stringify(config) !== JSON.stringify(savedConfig);

  const dietaryLabel =
    config.dietaryType === "veg"
      ? "Pure Veg"
      : config.dietaryType === "jain"
      ? "Jain Friendly"
      : "Non-Veg";

  const copyTemplates: Record<
    "en" | "hi" | "bn" | "as",
    { menuDesc: string; whatsappPromo: string; reelScript: string }
  > = {
    en: {
      menuDesc: `${config.dishName} (${dietaryLabel}) — Freshly prepared by ${config.kitchenName} in an FSSAI-verified kitchen and packed in sealed tamper-evident containers. Price: ₹${config.priceInr}.`,
      whatsappPromo: `Hot & Fresh ${config.dishName} from ${config.kitchenName} for just ₹${config.priceInr}!\nOffer: ${config.offerText}\nEstimated delivery in ${config.deliveryMins} mins.\nOrder directly here: ${config.orderLink}`,
      reelScript: `[0-3s] Craving fresh ${config.dishName}?\n[3-10s] Order directly from ${config.kitchenName} at ₹${config.priceInr} with ${config.offerText}.\n[10-15s] Delivered hot in ${config.deliveryMins} mins. Tap the link to order now!`,
    },
    hi: {
      menuDesc: `${config.dishName} (${dietaryLabel}) — ${config.kitchenName} की FSSAI-प्रमाणित रसोई में ताज़ा तैयार और सुरक्षित पैकिंग में। कीमत: ₹${config.priceInr}।`,
      whatsappPromo: `गरमा-गरम ${config.dishName} अब सिर्फ ₹${config.priceInr} में!\nऑफर: ${config.offerText}\nडिलीवरी समय: लगभग ${config.deliveryMins} मिनट।\nअभी ऑर्डर करें: ${config.orderLink}`,
      reelScript: `[0-3s] क्या आपका मन कर रहा है ताज़ा ${config.dishName} खाने का?\n[3-10s] ${config.kitchenName} से सीधे ऑर्डर करें मात्र ₹${config.priceInr} में (${config.offerText})।\n[10-15s] ${config.deliveryMins} मिनट में गरमा-गरम डिलीवरी। अभी लिंक पर क्लिक करें!`,
    },
    bn: {
      menuDesc: `${config.dishName} (${dietaryLabel}) — ${config.kitchenName}-এর FSSAI অনুমোদিত রান্নাঘরে তাজা তৈরি এবং সুরক্ষিত প্যাকিংয়ে পরিবেশিত। মূল্য: ₹${config.priceInr}।`,
      whatsappPromo: `গরম ও তাজা ${config.dishName} মাত্র ₹${config.priceInr}-এ!\nঅফার: ${config.offerText}\nডেলিভারি সময়: প্রায় ${config.deliveryMins} মিনিট।\nএখনই অর্ডার করুন: ${config.orderLink}`,
      reelScript: `[0-3s] গরম ${config.dishName} খেতে ইচ্ছে করছে?\n[3-10s] ${config.kitchenName} থেকে সরাসরি অর্ডার করুন ₹${config.priceInr}-এ (${config.offerText})।\n[10-15s] ${config.deliveryMins} মিনিটে হোম ডেলিভারি। এখনই অর্ডার করুন!`,
    },
    as: {
      menuDesc: `${config.dishName} (${dietaryLabel}) — ${config.kitchenName}-ৰ FSSAI পঞ্জীয়নভুক্ত পাকঘৰত সতেজভাৱে প্ৰস্তুত কৰা হৈছে। মূল্য: ₹${config.priceInr}।`,
      whatsappPromo: `তপত আৰু সতেজ ${config.dishName} মাত্ৰ ₹${config.priceInr} টকাত!\nঅফাৰ: ${config.offerText}\nডেলিভাৰী সময়: প্ৰায় ${config.deliveryMins} মিনিট।\nইয়াত অৰ্ডাৰ কৰক: ${config.orderLink}`,
      reelScript: `[0-3s] সতেজ ${config.dishName} খাবলৈ মন গৈছেনে?\n[3-10s] ${config.kitchenName} ৰ পৰা পোনপটীয়াকৈ ₹${config.priceInr} টকাত অৰ্ডাৰ কৰক (${config.offerText})।\n[10-15s] ${config.deliveryMins} মিনিটত ঘৰতে ডেলিভাৰী পাওক!`,
    },
  };

  const activeCopy = copyTemplates[config.language];

  const handleCopy = (text: string, id: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
    toast.success(`Copied ${label}`);
  };

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setSavedConfig(config);
      toast.success("Menu and promo copy settings saved.");
    } catch {
      setSavedConfig(config);
      toast.success("Promo copy settings updated.");
    }
  };

  const playOrderSoundAlert = (lang: "en" | "hi" | "bn" | "as") => {
    try {
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (!AudioContext) {
        toast.info("Browser audio is not available.");
        return;
      }

      setIsPlayingAudio(true);
      const ctx = new AudioContext();

      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      playTone(587.33, 0, 0.25);
      playTone(880.0, 0.15, 0.4);

      if ("speechSynthesis" in window) {
        const texts: Record<"en" | "hi" | "bn" | "as", { text: string; langTag: string }> = {
          en: {
            text: `New Order Received for ${config.dishName}. Amount Rupees ${config.priceInr}.`,
            langTag: "en-IN",
          },
          hi: {
            text: `नया ऑर्डर प्राप्त हुआ: ₹${config.priceInr} रुपये।`,
            langTag: "hi-IN",
          },
          bn: {
            text: `নতুন অর্ডার এসেছে: ₹${config.priceInr} টাকা।`,
            langTag: "bn-IN",
          },
          as: {
            text: `নতুন অৰ্ডাৰ আহিছে: ₹${config.priceInr} টকা।`,
            langTag: "as-IN",
          },
        };

        const voiceData = texts[lang];
        const utterance = new SpeechSynthesisUtterance(voiceData.text);
        utterance.lang = voiceData.langTag;
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setIsPlayingAudio(false);
      }
    } catch {
      setIsPlayingAudio(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Menu & Promo Copy Generator
            </h2>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              4 Indian Languages
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Generate clear menu descriptions, WhatsApp offer messages, and kitchen audio alerts in English, Hindi, Bengali, and Assamese.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfig(DEFAULT_PROMO_CONFIG)}
              className="text-xs font-semibold gap-1.5 border-slate-300"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-sm"
          >
            <Save className="h-3.5 w-3.5" /> {hasChanges ? "Save Copy" : "Copy Saved"}
          </Button>
        </div>
      </div>

      {/* 1. Current Status / Result & Next Action */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <span className="text-[11px] font-bold uppercase text-slate-500 block">
            Current Status / Result
          </span>
          <p className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            3 Promo Texts Ready
          </p>
          <p className="text-xs text-slate-600 mt-1 truncate">
            Dish: {config.dishName} (₹{config.priceInr})
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <span className="text-[11px] font-bold uppercase text-slate-500 block">
            Selected Language & Tag
          </span>
          <p className="text-xs font-semibold text-slate-900 mt-1 uppercase">
            Language: {config.language} • {dietaryLabel}
          </p>
          <p className="text-xs text-slate-600 mt-1 truncate">
            Offer: {config.offerText}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <span className="text-[11px] font-bold uppercase text-emerald-800 block">
            Next Action
          </span>
          <p className="text-xs font-semibold text-emerald-950 mt-1">
            Enter your dish details on the left and click Copy on any card on the right to paste into your menu or WhatsApp.
          </p>
        </div>
      </div>

      {/* 2. Settings & Customizations + Generated Copy */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Settings & Customizations</h3>
            </div>
            <div className="flex items-center gap-1">
              {(
                [
                  { id: "en", label: "EN" },
                  { id: "hi", label: "हिन्दी" },
                  { id: "bn", label: "বাংলা" },
                  { id: "as", label: "অসমীয়া" },
                ] as const
              ).map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setConfig((p) => ({ ...p, language: lang.id }))}
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    config.language === lang.id
                      ? "bg-emerald-600 text-white"
                      : "bg-white border border-slate-300 text-slate-700"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Dish or Combo Name</label>
              <input
                type="text"
                value={config.dishName}
                onChange={(e) => setConfig((p) => ({ ...p, dishName: e.target.value }))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Restaurant / Kitchen Name</label>
              <input
                type="text"
                value={config.kitchenName}
                onChange={(e) => setConfig((p) => ({ ...p, kitchenName: e.target.value }))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Price (₹ INR)</label>
                <input
                  type="number"
                  min={1}
                  value={config.priceInr}
                  onChange={(e) =>
                    setConfig((p) => ({ ...p, priceInr: Number(e.target.value) || 0 }))
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Delivery Time (Mins)</label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={config.deliveryMins}
                  onChange={(e) =>
                    setConfig((p) => ({ ...p, deliveryMins: Number(e.target.value) || 25 }))
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Special Offer Line</label>
              <input
                type="text"
                value={config.offerText}
                onChange={(e) => setConfig((p) => ({ ...p, offerText: e.target.value }))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Dietary Tag</label>
                <select
                  value={config.dietaryType}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      dietaryType: e.target.value as "veg" | "non_veg" | "jain",
                    }))
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                >
                  <option value="veg">Pure Veg</option>
                  <option value="non_veg">Non-Veg</option>
                  <option value="jain">Jain Friendly</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Order Link</label>
                <input
                  type="text"
                  value={config.orderLink}
                  onChange={(e) => setConfig((p) => ({ ...p, orderLink: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Kitchen Sound Alert Tester */}
          <div className="rounded-xl bg-emerald-950 text-white p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5" /> Test Kitchen Order Voice Alert
              </span>
              <span className="text-[10px] font-mono bg-emerald-900 px-2 py-0.5 rounded text-emerald-200">
                Browser Audio
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/80">
              Preview the loud bell chime and spoken order alert for kitchen staff.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isPlayingAudio}
                onClick={() => playOrderSoundAlert(config.language)}
                className="col-span-2 bg-emerald-700 hover:bg-emerald-600 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Volume2 className="h-3.5 w-3.5" /> Play Alert ({config.language.toUpperCase()})
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Ready-to-Copy Outputs */}
        <div className="lg:col-span-7 space-y-4">
          {[
            {
              id: "menu_desc",
              title: "1. Menu Item Description (FSSAI Compliant)",
              subtitle: "Paste this into your Menu Editor for customer clarity.",
              text: activeCopy.menuDesc,
            },
            {
              id: "wa_promo",
              title: "2. WhatsApp Broadcast & Customer Message",
              subtitle: "Send to opted-in customers on WhatsApp or SMS.",
              text: activeCopy.whatsappPromo,
            },
            {
              id: "reel_script",
              title: "3. Short 15-Second Reel / Status Script",
              subtitle: "Read aloud or add as captions when filming kitchen food videos.",
              text: activeCopy.reelScript,
            },
          ].map((card) => (
            <div
              key={card.id}
              className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{card.title}</h4>
                  <p className="text-[11px] text-slate-500">{card.subtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(card.text, card.id, card.title)}
                  className="flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 shrink-0"
                >
                  {copiedKey === card.id ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-slate-600" />
                  )}
                  <span>{copiedKey === card.id ? "Copied" : "Copy Text"}</span>
                </button>
              </div>
              <pre className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed">
                {card.text}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
