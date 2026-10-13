"use client";

import React, { useState } from "react";
import {
  Palette,
  Sparkles,
  Download,
  Copy,
  Check,
  Layers,
  Image as ImageIcon,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Crown,
  Shield,
  Zap,
  ShoppingBag,
  UtensilsCrossed,
  FileCode,
  Flame,
  Layout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface GeneratedDesign {
  id: string;
  title: string;
  aspectRatio: "1:1" | "16:9" | "9:16";
  category: "food" | "branding" | "campaign";
  svgContent: string;
}

export function DesignStudio() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16">("1:1");
  const [primaryColor, setPrimaryColor] = useState("#059669"); // Emerald
  const [accentColor, setAccentColor] = useState("#d97706"); // Amber
  const [headline, setHeadline] = useState("OrderKing Gold");
  const [tagline, setTagline] = useState("India's Fastest Food Delivery");
  const [selectedIcon, setSelectedIcon] = useState<"crown" | "shield" | "zap" | "utensils">("crown");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedSvg, setCopiedSvg] = useState(false);

  // Generate SVG markup based on interactive states
  const generateSvg = (
    ratio: "1:1" | "16:9" | "9:16",
    title: string,
    sub: string,
    pColor: string,
    aColor: string,
    icon: string
  ) => {
    const width = ratio === "16:9" ? 800 : ratio === "9:16" ? 450 : 600;
    const height = ratio === "16:9" ? 450 : ratio === "9:16" ? 800 : 600;

    let iconPath = "";
    if (icon === "crown") {
      iconPath = `<path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" fill="${aColor}" stroke="${aColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    } else if (icon === "shield") {
      iconPath = `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="${pColor}" opacity="0.3"/><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="${aColor}" stroke-width="2"/>`;
    } else if (icon === "zap") {
      iconPath = `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="${aColor}" stroke="${aColor}" stroke-width="2"/>`;
    } else {
      iconPath = `<path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8Z" stroke="${pColor}" stroke-width="2"/><path d="M15 15 3.3 3.3" stroke="${aColor}" stroke-width="2"/><path d="m2 16 6 6" stroke="${aColor}" stroke-width="2"/><path d="m7 21 5-5" stroke="${aColor}" stroke-width="2"/>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background: radial-gradient(circle at 50% 30%, #0f172a 0%, #020617 100%);">
  <defs>
    <linearGradient id="gradText" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${pColor}" />
      <stop offset="100%" stop-color="${aColor}" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Ambient Glow Ring -->
  <circle cx="${width / 2}" cy="${height * 0.38}" r="${Math.min(width, height) * 0.22}" fill="${pColor}" opacity="0.15" filter="url(#glow)" />
  <circle cx="${width / 2}" cy="${height * 0.38}" r="${Math.min(width, height) * 0.18}" stroke="${aColor}" stroke-width="2" stroke-dasharray="6,6" fill="none" opacity="0.4" />

  <!-- Central Symbol -->
  <g transform="translate(${width / 2 - 36}, ${height * 0.38 - 36}) scale(3)">
    ${iconPath}
  </g>

  <!-- Typography -->
  <text x="${width / 2}" y="${height * 0.68}" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="${Math.min(width, height) * 0.07}px" fill="url(#gradText)" text-anchor="middle" letter-spacing="1">
    ${title.toUpperCase()}
  </text>

  <text x="${width / 2}" y="${height * 0.76}" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="${Math.min(width, height) * 0.035}px" fill="#94a3b8" text-anchor="middle" letter-spacing="0.5">
    ${sub}
  </text>

  <!-- Seal / Border -->
  <rect x="16" y="16" width="${width - 32}" height="${height - 32}" rx="20" fill="none" stroke="${pColor}" stroke-width="1.5" opacity="0.3" />
</svg>`;
  };

  const activeSvg = generateSvg(
    aspectRatio,
    headline,
    tagline,
    primaryColor,
    accentColor,
    selectedIcon
  );

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error("Please enter a design prompt.");
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      setHeadline(prompt.slice(0, 24));
      setTagline("Engineered by UMAR OS Design Studio");
      setIsGenerating(false);
      toast.success("Graphic canvas re-synthesized!");
    }, 800);
  };

  const handleCopySvg = () => {
    navigator.clipboard.writeText(activeSvg);
    setCopiedSvg(true);
    setTimeout(() => setCopiedSvg(false), 2000);
    toast.success("SVG vector code copied to clipboard!");
  };

  const handleDownloadSvg = () => {
    const blob = new Blob([activeSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `orderking_${headline.toLowerCase().replace(/\s+/g, "_")}.svg`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded SVG vector asset.");
  };

  const handleApplyToCms = () => {
    toast.success("Vector banner pushed to Ecosystem CMS Media Vault.");
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-emerald-600" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Universal Image & Design Studio (DEMO B)
            </h2>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full">
              VECTOR SVG & CREATIVE ENGINE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Generative vector design studio for food commerce, restaurant branding, and high-conversion marketing collateral.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopySvg}
            className="text-xs font-semibold gap-1.5 border-slate-300"
          >
            {copiedSvg ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-600" />}
            {copiedSvg ? "Copied" : "Copy SVG"}
          </Button>
          <Button
            size="sm"
            onClick={handleDownloadSvg}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-sm"
          >
            <Download className="h-3.5 w-3.5" /> Download SVG
          </Button>
        </div>
      </div>

      {/* Main Studio Controls */}
      <div className="p-6 border-b border-slate-200 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Royal Lucknowi Biryani Festival Banner with Copper Handi and Saffron Glow..."
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-sans"
          />
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl gap-2 shadow-sm"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Synthesizing...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" /> Generate Design
              </>
            )}
          </Button>
        </div>

        {/* Quick Style Presets */}
        <div className="flex items-center gap-2 overflow-x-auto text-[11px] font-mono text-slate-500">
          <span className="font-bold text-slate-700 shrink-0">STYLES:</span>
          <button
            onClick={() => {
              setHeadline("Hyderabadi Dum Biryani");
              setTagline("Slow cooked in sealed copper handi");
              setPrimaryColor("#059669");
              setAccentColor("#f59e0b");
              setSelectedIcon("crown");
            }}
            className="px-3 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 shrink-0"
          >
            Biryani Master
          </button>
          <button
            onClick={() => {
              setHeadline("Midnight Quick-Bites");
              setTagline("12-minute lightning delivery");
              setPrimaryColor("#6366f1");
              setAccentColor("#ec4899");
              setSelectedIcon("zap");
            }}
            className="px-3 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 shrink-0"
          >
            Midnight Flash
          </button>
          <button
            onClick={() => {
              setHeadline("KingPay Sovereign Merchant");
              setTagline("0% MDR Instant Bank Settlements");
              setPrimaryColor("#0f766e");
              setAccentColor("#eab308");
              setSelectedIcon("shield");
            }}
            className="px-3 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 shrink-0"
          >
            KingPay Trust Crest
          </button>
        </div>
      </div>

      {/* Canvas Workspace & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
        {/* Left Side: Parameters Form */}
        <div className="lg:col-span-4 border-r border-slate-200 bg-slate-50/60 p-6 space-y-6">
          {/* Aspect Ratio Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2 font-mono">
              Aspect Ratio Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setAspectRatio("1:1")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1 transition-colors ${
                  aspectRatio === "1:1"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <div className="w-4 h-4 border-2 border-current rounded-sm"></div>
                <span>1:1 Square</span>
              </button>
              <button
                onClick={() => setAspectRatio("16:9")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1 transition-colors ${
                  aspectRatio === "16:9"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <div className="w-5 h-3 border-2 border-current rounded-sm"></div>
                <span>16:9 Banner</span>
              </button>
              <button
                onClick={() => setAspectRatio("9:16")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1 transition-colors ${
                  aspectRatio === "9:16"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <div className="w-3 h-5 border-2 border-current rounded-sm"></div>
                <span>9:16 Story</span>
              </button>
            </div>
          </div>

          {/* Headline & Tagline Inputs */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1 font-mono">
                Main Headline Text
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-sans"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1 font-mono">
                Subtitle / Value Proposition
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-sans"
              />
            </div>
          </div>

          {/* Color Matrix */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1 font-mono">
                Primary Glow
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                />
                <span className="text-xs font-mono text-slate-600">{primaryColor}</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1 font-mono">
                Accent Gold
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                />
                <span className="text-xs font-mono text-slate-600">{accentColor}</span>
              </div>
            </div>
          </div>

          {/* Emblem Icon Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2 font-mono">
              Emblem Seal Icon
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setSelectedIcon("crown")}
                className={`p-2.5 rounded-xl border flex items-center justify-center transition-colors ${
                  selectedIcon === "crown"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Crown className="h-4 w-4" />
              </button>
              <button
                onClick={() => setSelectedIcon("shield")}
                className={`p-2.5 rounded-xl border flex items-center justify-center transition-colors ${
                  selectedIcon === "shield"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Shield className="h-4 w-4" />
              </button>
              <button
                onClick={() => setSelectedIcon("zap")}
                className={`p-2.5 rounded-xl border flex items-center justify-center transition-colors ${
                  selectedIcon === "zap"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Zap className="h-4 w-4" />
              </button>
              <button
                onClick={() => setSelectedIcon("utensils")}
                className={`p-2.5 rounded-xl border flex items-center justify-center transition-colors ${
                  selectedIcon === "utensils"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <UtensilsCrossed className="h-4 w-4" />
              </button>
            </div>
          </div>

          <Button
            onClick={handleApplyToCms}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl gap-2 shadow-sm"
          >
            <Layers className="h-3.5 w-3.5 text-emerald-400" /> Apply to Ecosystem CMS
          </Button>
        </div>

        {/* Right Side: Live SVG Canvas */}
        <div className="lg:col-span-8 bg-slate-950 p-8 flex flex-col items-center justify-center min-h-[500px]">
          <div
            className={`w-full max-w-[420px] transition-all duration-300 shadow-2xl rounded-2xl overflow-hidden border border-slate-800 ${
              aspectRatio === "16:9"
                ? "aspect-video"
                : aspectRatio === "9:16"
                ? "aspect-[9/16] max-w-[300px]"
                : "aspect-square"
            }`}
            dangerouslySetInnerHTML={{ __html: activeSvg }}
          />

          <div className="mt-6 flex items-center gap-6 text-[11px] font-mono text-slate-500">
            <span>FORMAT: SCALABLE VECTOR GRAPHICS (SVG)</span>
            <span>COLOR SPACE: sRGB</span>
            <span>SCALE: INFINITE (LOSSLESS)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
