"use client";

import React, { useState, useEffect } from "react";
import {
  Palette,
  Download,
  Copy,
  Check,
  CheckCircle2,
  Sliders,
  Crown,
  Shield,
  Zap,
  UtensilsCrossed,
  Save,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BrandBannerConfig {
  aspectRatio: "1:1" | "16:9" | "9:16";
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  headline: string;
  tagline: string;
  promoBadge: string;
  fssaiText: string;
  selectedIcon: "crown" | "shield" | "zap" | "utensils";
}

const DEFAULT_BANNER_CONFIG: BrandBannerConfig = {
  aspectRatio: "1:1",
  primaryColor: "#059669",
  accentColor: "#d97706",
  backgroundColor: "#0f172a",
  headline: "OrderKing Direct",
  tagline: "Fresh from local kitchens to your doorstep",
  promoBadge: "FREE DELIVERY ABOVE ₹399",
  fssaiText: "100% FSSAI Verified Kitchens",
  selectedIcon: "crown",
};

const STORAGE_KEY = "orderking_brand_banner_config_v1";

export function DesignStudio() {
  const [config, setConfig] = useState<BrandBannerConfig>(DEFAULT_BANNER_CONFIG);
  const [savedConfig, setSavedConfig] = useState<BrandBannerConfig>(DEFAULT_BANNER_CONFIG);
  const [copiedSvg, setCopiedSvg] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = { ...DEFAULT_BANNER_CONFIG, ...JSON.parse(raw) };
        setConfig(parsed);
        setSavedConfig(parsed);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const hasChanges = JSON.stringify(config) !== JSON.stringify(savedConfig);

  const generateSvg = (c: BrandBannerConfig) => {
    const width = c.aspectRatio === "16:9" ? 800 : c.aspectRatio === "9:16" ? 450 : 600;
    const height = c.aspectRatio === "16:9" ? 450 : c.aspectRatio === "9:16" ? 800 : 600;

    let iconPath = "";
    if (c.selectedIcon === "crown") {
      iconPath = `<path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" fill="${c.accentColor}" stroke="${c.accentColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    } else if (c.selectedIcon === "shield") {
      iconPath = `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="${c.primaryColor}" opacity="0.3"/><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="${c.accentColor}" stroke-width="2" fill="none"/>`;
    } else if (c.selectedIcon === "zap") {
      iconPath = `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="${c.accentColor}" stroke="${c.accentColor}" stroke-width="2"/>`;
    } else {
      iconPath = `<path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8Z" stroke="${c.primaryColor}" stroke-width="2" fill="none"/><path d="M15 15 3.3 3.3" stroke="${c.accentColor}" stroke-width="2"/><path d="m2 16 6 6" stroke="${c.accentColor}" stroke-width="2"/><path d="m7 21 5-5" stroke="${c.accentColor}" stroke-width="2"/>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background: ${c.backgroundColor};">
  <defs>
    <linearGradient id="gradText" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c.primaryColor}" />
      <stop offset="100%" stop-color="${c.accentColor}" />
    </linearGradient>
  </defs>

  <circle cx="${width / 2}" cy="${height * 0.34}" r="${Math.min(width, height) * 0.17}" fill="${c.primaryColor}" opacity="0.15" />
  <circle cx="${width / 2}" cy="${height * 0.34}" r="${Math.min(width, height) * 0.14}" stroke="${c.accentColor}" stroke-width="2" stroke-dasharray="6,6" fill="none" opacity="0.5" />

  <g transform="translate(${width / 2 - 36}, ${height * 0.34 - 36}) scale(3)">
    ${iconPath}
  </g>

  <text x="${width / 2}" y="${height * 0.62}" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="${Math.min(width, height) * 0.065}px" fill="url(#gradText)" text-anchor="middle">
    ${c.headline.toUpperCase()}
  </text>

  <text x="${width / 2}" y="${height * 0.70}" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="${Math.min(width, height) * 0.033}px" fill="#cbd5e1" text-anchor="middle">
    ${c.tagline}
  </text>

  <rect x="${width / 2 - 140}" y="${height * 0.76}" width="280" height="36" rx="18" fill="${c.primaryColor}" />
  <text x="${width / 2}" y="${height * 0.76 + 23}" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="13px" fill="#ffffff" text-anchor="middle">
    ${c.promoBadge}
  </text>

  <text x="${width / 2}" y="${height - 28}" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="12px" fill="#94a3b8" text-anchor="middle">
    ${c.fssaiText}
  </text>

  <rect x="16" y="16" width="${width - 32}" height="${height - 32}" rx="20" fill="none" stroke="${c.primaryColor}" stroke-width="1.5" opacity="0.35" />
</svg>`;
  };

  const activeSvg = generateSvg(config);

  const handleCopySvg = () => {
    navigator.clipboard.writeText(activeSvg);
    setCopiedSvg(true);
    setTimeout(() => setCopiedSvg(null as unknown as boolean), 2000);
    toast.success("Banner SVG copied to clipboard.");
  };

  const handleDownloadSvg = () => {
    const blob = new Blob([activeSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `orderking_banner_${config.aspectRatio.replace(":", "x")}.svg`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded SVG banner file.");
  };

  const handleSaveTheme = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setSavedConfig(config);
      toast.success("Brand colors and banner saved.");
    } catch {
      setSavedConfig(config);
      toast.success("Brand colors updated.");
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-emerald-600" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Brand Colors & Banner Designer
            </h2>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Instant SVG Export
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Customize your brand colors, offer headline, and download ready-to-post banners for WhatsApp, Instagram, or your website.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfig(DEFAULT_BANNER_CONFIG)}
              className="text-xs font-semibold gap-1.5 border-slate-300"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopySvg}
            className="text-xs font-semibold gap-1.5 border-slate-300"
          >
            {copiedSvg ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedSvg ? "Copied" : "Copy SVG"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadSvg}
            className="text-xs font-semibold gap-1.5 border-slate-300"
          >
            <Download className="h-3.5 w-3.5" /> Download SVG
          </Button>
          <Button
            size="sm"
            onClick={handleSaveTheme}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-sm"
          >
            <Save className="h-3.5 w-3.5" /> {hasChanges ? "Save Brand Theme" : "Theme Saved"}
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
            {config.aspectRatio} Banner Ready
          </p>
          <p className="text-xs text-slate-600 mt-1 truncate">
            Headline: &ldquo;{config.headline}&rdquo;
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <span className="text-[11px] font-bold uppercase text-slate-500 block">
            Active Brand Palette
          </span>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1.5 text-xs font-mono text-slate-800">
              <span className="h-3.5 w-3.5 rounded-full border border-slate-300" style={{ backgroundColor: config.primaryColor }} />
              {config.primaryColor}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-mono text-slate-800">
              <span className="h-3.5 w-3.5 rounded-full border border-slate-300" style={{ backgroundColor: config.accentColor }} />
              {config.accentColor}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <span className="text-[11px] font-bold uppercase text-emerald-800 block">
            Next Action
          </span>
          <p className="text-xs font-semibold text-emerald-950 mt-1">
            Pick a preset or edit the text below, then click Download SVG to use on your storefront or social posts.
          </p>
        </div>
      </div>

      {/* 2. Quick Templates */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-700">Quick Templates:</span>
        <button
          type="button"
          onClick={() =>
            setConfig((p) => ({
              ...p,
              headline: "Hyderabadi Dum Biryani",
              tagline: "Freshly cooked in sealed handi",
              promoBadge: "FLAT ₹75 OFF FIRST ORDER",
              primaryColor: "#059669",
              accentColor: "#f59e0b",
              selectedIcon: "crown",
            }))
          }
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700"
        >
          Biryani Special
        </button>
        <button
          type="button"
          onClick={() =>
            setConfig((p) => ({
              ...p,
              headline: "Weekend Family Combo",
              tagline: "Zero surge fee • Direct kitchen prices",
              promoBadge: "FREE DELIVERY ABOVE ₹399",
              primaryColor: "#2563eb",
              accentColor: "#f97316",
              selectedIcon: "utensils",
            }))
          }
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700"
        >
          Weekend Family Offer
        </button>
        <button
          type="button"
          onClick={() =>
            setConfig((p) => ({
              ...p,
              headline: "Partner With OrderKing",
              tagline: "Fair merchant terms & fast bank payouts",
              promoBadge: "JOIN OUR VERIFIED NETWORK",
              primaryColor: "#0f766e",
              accentColor: "#eab308",
              selectedIcon: "shield",
            }))
          }
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700"
        >
          Restaurant Partner Invite
        </button>
      </div>

      {/* 3. Settings & Customizations + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Sliders className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Settings & Customizations</h3>
          </div>

          {/* Banner Shape */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Banner Size</label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "1:1", label: "1:1 Square" },
                  { id: "16:9", label: "16:9 Web Banner" },
                  { id: "9:16", label: "9:16 Story/Status" },
                ] as const
              ).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setConfig((p) => ({ ...p, aspectRatio: r.id }))}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold border ${
                    config.aspectRatio === r.id
                      ? "bg-emerald-50 border-emerald-400 text-emerald-900 font-bold"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Main Headline</label>
              <input
                type="text"
                value={config.headline}
                onChange={(e) => setConfig((p) => ({ ...p, headline: e.target.value }))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Subtitle</label>
              <input
                type="text"
                value={config.tagline}
                onChange={(e) => setConfig((p) => ({ ...p, tagline: e.target.value }))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Offer Pill Text</label>
              <input
                type="text"
                value={config.promoBadge}
                onChange={(e) => setConfig((p) => ({ ...p, promoBadge: e.target.value }))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Footer Compliance Line</label>
              <input
                type="text"
                value={config.fssaiText}
                onChange={(e) => setConfig((p) => ({ ...p, fssaiText: e.target.value }))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Primary</label>
              <input
                type="color"
                value={config.primaryColor}
                onChange={(e) => setConfig((p) => ({ ...p, primaryColor: e.target.value }))}
                className="w-full h-9 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Accent</label>
              <input
                type="color"
                value={config.accentColor}
                onChange={(e) => setConfig((p) => ({ ...p, accentColor: e.target.value }))}
                className="w-full h-9 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Background</label>
              <input
                type="color"
                value={config.backgroundColor}
                onChange={(e) => setConfig((p) => ({ ...p, backgroundColor: e.target.value }))}
                className="w-full h-9 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
              />
            </div>
          </div>

          {/* Icon */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Center Icon</label>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { id: "crown", icon: Crown },
                  { id: "shield", icon: Shield },
                  { id: "zap", icon: Zap },
                  { id: "utensils", icon: UtensilsCrossed },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setConfig((p) => ({ ...p, selectedIcon: item.id }))}
                    className={`p-2.5 rounded-lg border flex items-center justify-center ${
                      config.selectedIcon === item.id
                        ? "bg-emerald-50 border-emerald-400 text-emerald-800"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Banner Preview */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-slate-950 p-6 flex flex-col items-center justify-center min-h-[420px]">
          <div
            className={`w-full max-w-[400px] shadow-xl rounded-2xl overflow-hidden border border-slate-800 ${
              config.aspectRatio === "16:9"
                ? "aspect-video max-w-[480px]"
                : config.aspectRatio === "9:16"
                ? "aspect-[9/16] max-w-[270px]"
                : "aspect-square"
            }`}
            dangerouslySetInnerHTML={{ __html: activeSvg }}
          />
          <p className="text-xs text-slate-400 mt-4">
            Live vector preview — scales cleanly to any screen size.
          </p>
        </div>
      </div>
    </div>
  );
}
