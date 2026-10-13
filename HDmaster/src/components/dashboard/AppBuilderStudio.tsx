"use client";

import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Download,
  Copy,
  Check,
  CheckCircle2,
  Sliders,
  Link2,
  Save,
  RotateCcw,
  FileCode,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PwaAppConfig {
  appName: string;
  shortName: string;
  domainUrl: string;
  supportPhone: string;
  themeColor: string;
  backgroundColor: string;
  defaultCity: string;
  deliveryRadiusKm: number;
  minOrderInr: number;
  freeDeliveryAboveInr: number;
  packagingFeeInr: number;
  enableUpiCheckout: boolean;
  enableCashOnDelivery: boolean;
  showFssaiBadge: boolean;
}

const DEFAULT_PWA_CONFIG: PwaAppConfig = {
  appName: "OrderKing Food Delivery",
  shortName: "OrderKing",
  domainUrl: "https://orderking.in",
  supportPhone: "+919876543210",
  themeColor: "#059669",
  backgroundColor: "#ffffff",
  defaultCity: "Bengaluru",
  deliveryRadiusKm: 8,
  minOrderInr: 149,
  freeDeliveryAboveInr: 399,
  packagingFeeInr: 15,
  enableUpiCheckout: true,
  enableCashOnDelivery: true,
  showFssaiBadge: true,
};

const STORAGE_KEY = "orderking_pwa_app_config_v1";

export function AppBuilderStudio() {
  const [config, setConfig] = useState<PwaAppConfig>(DEFAULT_PWA_CONFIG);
  const [savedConfig, setSavedConfig] = useState<PwaAppConfig>(DEFAULT_PWA_CONFIG);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = { ...DEFAULT_PWA_CONFIG, ...JSON.parse(raw) };
        setConfig(parsed);
        setSavedConfig(parsed);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const hasChanges = JSON.stringify(config) !== JSON.stringify(savedConfig);
  const cleanDomain = (config.domainUrl || "https://orderking.in").replace(/\/+$/, "");

  const links = [
    {
      id: "customer_pwa",
      label: "Customer Ordering Link",
      url: `${cleanDomain}/?city=${encodeURIComponent(config.defaultCity)}`,
      desc: "Share on WhatsApp or Instagram bio so customers can order directly.",
    },
    {
      id: "merchant_pwa",
      label: "Restaurant Partner Link",
      url: `${cleanDomain}/restaurant`,
      desc: "Send to kitchen owners to manage menu items, prices, and live orders.",
    },
    {
      id: "rider_pwa",
      label: "Delivery Partner Link",
      url: `${cleanDomain}/rider`,
      desc: "Send to delivery riders to accept trips and view pickup locations.",
    },
    {
      id: "whatsapp_direct",
      label: "WhatsApp Click-to-Order",
      url: `https://wa.me/${config.supportPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
        `Hi ${config.shortName}, I would like to place a food order.`
      )}`,
      desc: "Direct WhatsApp chat link for customer support or phone orders.",
    },
  ];

  const manifestJson = JSON.stringify(
    {
      name: config.appName,
      short_name: config.shortName,
      start_url: "/?source=pwa",
      display: "standalone",
      background_color: config.backgroundColor,
      theme_color: config.themeColor,
      orientation: "portrait",
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    },
    null,
    2
  );

  const handleCopy = (text: string, id: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success(`Copied ${label}`);
  };

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setSavedConfig(config);
      toast.success("App settings and PWA links saved.");
    } catch {
      setSavedConfig(config);
      toast.success("App settings updated.");
    }
  };

  const handleDownloadManifest = () => {
    const blob = new Blob([manifestJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "manifest.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded manifest.json file.");
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-emerald-600" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              App Config & PWA Links
            </h2>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Ready to Share
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Configure your mobile web app settings, order rules, and shareable links for customers, kitchens, and riders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfig(DEFAULT_PWA_CONFIG)}
              className="text-xs font-semibold gap-1.5 border-slate-300"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadManifest}
            className="text-xs font-semibold gap-1.5 border-slate-300"
          >
            <Download className="h-3.5 w-3.5" /> Download manifest.json
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-sm"
          >
            <Save className="h-3.5 w-3.5" /> {hasChanges ? "Save Config" : "Config Saved"}
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
            {config.shortName} PWA Configured
          </p>
          <p className="text-xs text-slate-600 mt-1 truncate">
            Domain: {cleanDomain} ({config.deliveryRadiusKm} km radius)
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <span className="text-[11px] font-bold uppercase text-slate-500 block">
            Checkout & Delivery Rules
          </span>
          <p className="text-xs font-semibold text-slate-900 mt-1">
            Min Order: ₹{config.minOrderInr} • Free Delivery: ₹{config.freeDeliveryAboveInr}+
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Packaging: ₹{config.packagingFeeInr} • UPI: {config.enableUpiCheckout ? "On" : "Off"}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <span className="text-[11px] font-bold uppercase text-emerald-800 block">
            Next Action
          </span>
          <p className="text-xs font-semibold text-emerald-950 mt-1">
            Copy your Customer Ordering Link below and paste it into your Instagram bio and WhatsApp status.
          </p>
        </div>
      </div>

      {/* 2. Shareable App Links */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Link2 className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">Shareable App Links</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {links.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{item.label}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(item.url, item.id, item.label)}
                    className="flex items-center gap-1 rounded-lg bg-white border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    {copiedId === item.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-slate-500" />
                    )}
                    <span>{copiedId === item.id ? "Copied" : "Copy Link"}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{item.desc}</p>
              </div>
              <code className="block truncate rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-mono text-emerald-800">
                {item.url}
              </code>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Settings & Customizations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Settings & Customizations</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Full App Name</label>
              <input
                type="text"
                value={config.appName}
                onChange={(e) => setConfig((p) => ({ ...p, appName: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Home Screen Short Name</label>
              <input
                type="text"
                value={config.shortName}
                onChange={(e) => setConfig((p) => ({ ...p, shortName: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Primary Website Domain</label>
              <input
                type="text"
                value={config.domainUrl}
                onChange={(e) => setConfig((p) => ({ ...p, domainUrl: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Support WhatsApp Number</label>
              <input
                type="text"
                value={config.supportPhone}
                onChange={(e) => setConfig((p) => ({ ...p, supportPhone: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Default City</label>
              <input
                type="text"
                value={config.defaultCity}
                onChange={(e) => setConfig((p) => ({ ...p, defaultCity: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Max Delivery Radius (km)</label>
              <input
                type="number"
                min={1}
                max={50}
                value={config.deliveryRadiusKm}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, deliveryRadiusKm: Number(e.target.value) || 5 }))
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Minimum Order (₹)</label>
              <input
                type="number"
                min={0}
                value={config.minOrderInr}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, minOrderInr: Number(e.target.value) || 0 }))
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Free Delivery Above (₹)</label>
              <input
                type="number"
                min={0}
                value={config.freeDeliveryAboveInr}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, freeDeliveryAboveInr: Number(e.target.value) || 0 }))
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-5 pt-3 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={config.enableUpiCheckout}
                onChange={(e) => setConfig((p) => ({ ...p, enableUpiCheckout: e.target.checked }))}
                className="rounded border-slate-300 text-emerald-600"
              />
              <span>Enable Instant UPI Checkout</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={config.enableCashOnDelivery}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, enableCashOnDelivery: e.target.checked }))
                }
                className="rounded border-slate-300 text-emerald-600"
              />
              <span>Allow Cash on Delivery</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showFssaiBadge}
                onChange={(e) => setConfig((p) => ({ ...p, showFssaiBadge: e.target.checked }))}
                className="rounded border-slate-300 text-emerald-600"
              />
              <span>Show Mandatory 14-Digit FSSAI License on Receipts</span>
            </label>
          </div>
        </div>

        {/* PWA Manifest Output */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-slate-950 text-slate-100 p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <FileCode className="h-4 w-4" /> Generated PWA manifest.json
              </span>
              <button
                type="button"
                onClick={() => handleCopy(manifestJson, "manifest_json", "manifest.json")}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1"
              >
                {copiedId === "manifest_json" ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                <span>{copiedId === "manifest_json" ? "Copied" : "Copy JSON"}</span>
              </button>
            </div>
            <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
              {manifestJson}
            </pre>
          </div>

          <p className="text-[11px] text-slate-400 border-t border-slate-800 pt-3">
            Place this file in your website&apos;s <code className="text-emerald-400">/public/manifest.json</code> folder so customers can install {config.shortName} on their phone home screen.
          </p>
        </div>
      </div>
    </div>
  );
}
