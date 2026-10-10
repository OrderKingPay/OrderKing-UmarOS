import React, { useState, useEffect } from "react";
import {
  Palette,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sun,
  Moon,
  Smartphone,
  Sliders,
  RotateCcw,
  Square,
  Circle,
  ShoppingBag,
  Star,
  Flame,
  ChevronRight,
  ShieldCheck,
  Send,
} from "lucide-react";
import {
  loadCustomerUiSettingsFn,
  saveCustomerUiSettingsFn,
} from "@/lib/orderking/actions";

export interface CustomerUiSettingsState {
  primaryColor: string;
  radiusPx: number;
  themeMode: "light" | "dark";
}

const PRESET_COLORS = [
  { name: "OrderKing Crimson", hex: "#E23744", desc: "Zomato-grade high conversion appetite red" },
  { name: "Royal Emerald", hex: "#0D3B2E", desc: "Institutional dark green heritage brand" },
  { name: "Electric Indigo", hex: "#4F46E5", desc: "Modern hyper-tech digital native" },
  { name: "Sunset Amber", hex: "#EA580C", desc: "Vibrant warm citrus & quick commerce" },
  { name: "Sapphire Blue", hex: "#2563EB", desc: "Fintech reliability & KingPay loyalty" },
  { name: "Teal Vanguard", hex: "#0D9488", desc: "Fresh organic groceries & farm-to-fork" },
  { name: "Midnight Obsidian", hex: "#0F172A", desc: "Ultra-luxury premium dining club" },
  { name: "Ruby Rose", hex: "#E11D48", desc: "Energetic urban dining & nightlife" },
];

interface Props {
  config?: any;
  onSave?: (updates: any) => Promise<boolean | void>;
  saving?: boolean;
}

export function CustomerAppUiSettings({ config, onSave, saving: parentSaving }: Props) {
  const [settings, setSettings] = useState<CustomerUiSettingsState>({
    primaryColor: "#E23744",
    radiusPx: 16,
    themeMode: "light",
  });
  const [initialSettings, setInitialSettings] = useState<CustomerUiSettingsState>({
    primaryColor: "#E23744",
    radiusPx: 16,
    themeMode: "light",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hexInputError, setHexInputError] = useState(false);

  // Load live DB settings on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchSettings() {
      try {
        setLoading(true);
        // Try server function first
        let loaded: CustomerUiSettingsState | null = null;
        try {
          const res = await loadCustomerUiSettingsFn();
          if (res && res.ok && res.data) {
            loaded = {
              primaryColor: res.data.primaryColor || "#E23744",
              radiusPx: res.data.radiusPx !== undefined ? Number(res.data.radiusPx) : 16,
              themeMode: res.data.themeMode === "dark" ? "dark" : "light",
            };
          }
        } catch {
          // Fallback to REST endpoint
          const resp = await fetch("/api/v1/admin/settings");
          if (resp.ok) {
            const data = await resp.json();
            if (data?.brand) {
              loaded = {
                primaryColor: data.brand.primaryColor || "#E23744",
                radiusPx: data.brand.radiusPx !== undefined ? Number(data.brand.radiusPx) : 16,
                themeMode: data.brand.themeMode === "dark" ? "dark" : "light",
              };
            }
          }
        }

        if (isMounted && loaded) {
          setSettings(loaded);
          setInitialSettings(loaded);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage("Failed to load settings from Supabase database: " + err.message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (config?.brand) {
      const init = {
        primaryColor: config.brand.primaryColor || "#E23744",
        radiusPx: config.brand.radiusPx !== undefined ? Number(config.brand.radiusPx) : 16,
        themeMode: (config.brand.themeMode === "dark" ? "dark" : "light") as "light" | "dark",
      };
      setSettings(init);
      setInitialSettings(init);
      setLoading(false);
    } else {
      fetchSettings();
    }

    return () => {
      isMounted = false;
    };
  }, [config]);

  // Color change handler with Hex validation
  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSettings((prev) => ({ ...prev, primaryColor: val }));
    const isValidHex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val);
    setHexInputError(!isValidHex);
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings((prev) => ({ ...prev, primaryColor: e.target.value.toUpperCase() }));
    setHexInputError(false);
  };

  const selectPreset = (hex: string) => {
    setSettings((prev) => ({ ...prev, primaryColor: hex }));
    setHexInputError(false);
  };

  const toggleRadius = (isSharp: boolean) => {
    setSettings((prev) => ({ ...prev, radiusPx: isSharp ? 0 : 16 }));
  };

  const toggleTheme = (mode: "light" | "dark") => {
    setSettings((prev) => ({ ...prev, themeMode: mode }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveSuccess(false);
      setErrorMessage(null);

      // Validate Hex
      if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(settings.primaryColor)) {
        setErrorMessage("Please specify a valid 3 or 6 digit hex color (e.g. #E23744)");
        setSaving(false);
        return;
      }

      if (onSave) {
        await onSave({ brand: settings });
      } else {
        // Try server function first
        let saved = false;
        try {
          const res = await saveCustomerUiSettingsFn({ data: { settings } });
          if (res && res.ok) saved = true;
        } catch {
          // Fallback to REST endpoint
          const resp = await fetch("/api/v1/admin/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ brand: settings }),
          });
          if (resp.ok) saved = true;
        }

        if (!saved) {
          throw new Error("Unable to save UI settings to platform_settings");
        }
      }

      setInitialSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to persist UI settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(initialSettings);
    setHexInputError(false);
    setErrorMessage(null);
  };

  const isSharp = settings.radiusPx === 0;
  const isDark = settings.themeMode === "dark";
  const hasChanges =
    settings.primaryColor.toUpperCase() !== initialSettings.primaryColor.toUpperCase() ||
    settings.radiusPx !== initialSettings.radiusPx ||
    settings.themeMode !== initialSettings.themeMode;

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    Customer App UI Settings Matrix
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <ShieldCheck className="h-3 w-3" /> Live Production Sync
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visual control matrix for the Founder to alter the customer mobile application instantly without engineering deployments.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasChanges && (
              <button
                type="button"
                onClick={handleReset}
                disabled={saving || parentSaving}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition border border-slate-200"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Discard
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || parentSaving || hexInputError}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
            >
              {saving || parentSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Synchronizing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Publish to Customer App
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {saveSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-medium text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Customer App UI settings successfully updated in PostgreSQL database. All customer instances will reflect these changes immediately.</span>
          </div>
        )}
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-medium text-red-800 animate-in fade-in">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Controls Matrix (Left) + Real-time Mobile Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Controls Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Setting 1: Primary Brand Color Picker */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-xs font-mono">1</span>
                  Primary Brand Color
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Controls buttons, accent icons, badges, cart triggers, and highlights across the customer app.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                  {settings.primaryColor.toUpperCase()}
                </span>
                <div
                  className="h-6 w-6 rounded-lg border border-slate-300 shadow-inner"
                  style={{ backgroundColor: settings.primaryColor }}
                />
              </div>
            </div>

            {/* Inputs: Native Color Picker + Hex Input */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <label className="relative flex items-center justify-center cursor-pointer">
                  <input
                    type="color"
                    value={settings.primaryColor.startsWith("#") ? settings.primaryColor : "#E23744"}
                    onChange={handleColorPickerChange}
                    className="sr-only"
                    id="color-picker-input"
                  />
                  <div
                    className="h-10 w-12 rounded-xl border border-slate-300 shadow-sm cursor-pointer hover:scale-105 transition flex items-center justify-center"
                    style={{ backgroundColor: settings.primaryColor }}
                  >
                    <Sliders className="h-4 w-4 text-white drop-shadow" />
                  </div>
                </label>

                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-xs font-mono text-slate-400 font-bold">#</span>
                  <input
                    type="text"
                    value={settings.primaryColor.replace(/^#/, "")}
                    onChange={(e) => handleHexChange({ ...e, target: { ...e.target, value: "#" + e.target.value.replace(/^#/, "") } })}
                    placeholder="E23744"
                    maxLength={7}
                    className={`w-full pl-7 pr-3 py-2 text-xs font-mono font-bold uppercase rounded-xl border ${
                      hexInputError
                        ? "border-red-400 focus:ring-red-300 text-red-600"
                        : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-200"
                    } focus:outline-none focus:ring-2 bg-slate-50 text-slate-900 transition`}
                  />
                </div>
              </div>

              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                RGB / HEX HEXADECIMAL
              </span>
            </div>

            {/* Curated Institutional Brand Swatches */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Executive Presets
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESET_COLORS.map((preset) => {
                  const isSelected = settings.primaryColor.toUpperCase() === preset.hex.toUpperCase();
                  return (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => selectPreset(preset.hex)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left transition ${
                        isSelected
                          ? "border-slate-900 bg-slate-50 ring-2 ring-slate-900/10"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div
                        className="h-4 w-4 rounded-md shrink-0 border border-black/10"
                        style={{ backgroundColor: preset.hex }}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-800 truncate">
                          {preset.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">{preset.hex}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Setting 2: Component Border Radius */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-xs font-mono">2</span>
                  Component Border Radius
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Controls the geometry of buttons, cards, dialogs, image thumbnails, and category pills.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                {isSharp ? "0px (Sharp)" : `${settings.radiusPx}px (Rounded)`}
              </span>
            </div>

            {/* Segmented Toggle for Sharp vs Rounded */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Sharp Corners (0px) */}
              <button
                type="button"
                onClick={() => toggleRadius(true)}
                className={`p-4 text-left border rounded-xl transition relative ${
                  isSharp
                    ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-none border-2 border-slate-800 bg-white flex items-center justify-center">
                      <Square className="h-3.5 w-3.5 text-slate-800" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Sharp Corners</div>
                      <div className="text-[10px] font-mono text-slate-500">0px Corner Radius</div>
                    </div>
                  </div>
                  {isSharp && (
                    <span className="h-4 w-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 mt-2.5 leading-relaxed">
                  Brutalist, architectural precision. All buttons, food cards, modals, and input controls render with razor-sharp 90-degree corners.
                </p>
              </button>

              {/* Rounded Corners (16px) */}
              <button
                type="button"
                onClick={() => toggleRadius(false)}
                className={`p-4 text-left border rounded-xl transition relative ${
                  !isSharp
                    ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-xl border-2 border-slate-800 bg-white flex items-center justify-center">
                      <Circle className="h-3.5 w-3.5 text-slate-800" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Rounded Corners</div>
                      <div className="text-[10px] font-mono text-slate-500">16px Soft Geometry</div>
                    </div>
                  </div>
                  {!isSharp && (
                    <span className="h-4 w-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 mt-2.5 leading-relaxed">
                  Smooth, ergonomic curves. Tailored for mobile touch targets, soft container elevation, and approachable culinary browsing.
                </p>
              </button>
            </div>

            {/* Fine Tuning Slider */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-4">
              <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">Fine-tune radius:</span>
              <input
                type="range"
                min={0}
                max={24}
                step={4}
                value={settings.radiusPx}
                onChange={(e) => setSettings((prev) => ({ ...prev, radiusPx: Number(e.target.value) }))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-slate-800 w-12 text-right">
                {settings.radiusPx}px
              </span>
            </div>
          </div>

          {/* Setting 3: Light / Dark Mode Forced Override */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-xs font-mono">3</span>
                  Light / Dark Mode Forced Override
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unconditionally enforces canvas background, surface contrast, and typography mode for all customer app visitors.
                </p>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                  isDark
                    ? "bg-slate-900 text-white border-slate-800"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}
              >
                {isDark ? "DARK MODE FORCED" : "LIGHT MODE FORCED"}
              </span>
            </div>

            {/* Segmented Mode Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Forced Light Mode */}
              <button
                type="button"
                onClick={() => toggleTheme("light")}
                className={`p-4 text-left border rounded-xl transition ${
                  !isDark
                    ? "border-emerald-600 bg-amber-50/40 ring-2 ring-emerald-500/20"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center border border-amber-200">
                      <Sun className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Forced Light Mode</div>
                      <div className="text-[10px] text-slate-500">Crisp daytime white canvas</div>
                    </div>
                  </div>
                  {!isDark && (
                    <span className="h-4 w-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 mt-2.5">
                  Clean #FFFFFF paper canvas, high sunlight readability, crisp slate text contrast. Best for daytime food delivery.
                </p>
              </button>

              {/* Forced Dark Mode */}
              <button
                type="button"
                onClick={() => toggleTheme("dark")}
                className={`p-4 text-left border rounded-xl transition ${
                  isDark
                    ? "border-emerald-600 bg-slate-900 text-white ring-2 ring-emerald-500/20"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-slate-800 text-indigo-300 flex items-center justify-center border border-slate-700">
                      <Moon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                        Forced Dark Mode
                      </div>
                      <div className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        Deep #0F172A OLED contrast
                      </div>
                    </div>
                  </div>
                  {isDark && (
                    <span className="h-4 w-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                  )}
                </div>
                <p className={`text-[11px] mt-2.5 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  Deep nocturnal styling, reduced glare for late-night food cravings, battery-saving OLED contrast for midnight orders.
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Live Device Simulator Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Live Customer App Simulator
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                REAL-TIME REFLECTION
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-4">
              Real-time rendering of the mobile client applying your current Primary Color, Border Radius, and Theme Mode.
            </p>

            {/* Mobile Device Frame */}
            <div className="mx-auto max-w-[320px] rounded-[36px] p-3 bg-slate-900 shadow-2xl border-4 border-slate-800 relative">
              {/* Speaker Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 h-4 w-24 bg-slate-950 rounded-full z-20 flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-700" />
              </div>

              {/* Mobile Screen Canvas */}
              <div
                className={`overflow-hidden transition-colors duration-200 relative pt-7 pb-4 px-3 flex flex-col gap-3 min-h-[500px] text-left select-none ${
                  isDark ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900"
                }`}
                style={{
                  borderRadius: isSharp ? "0px" : "28px",
                  fontFamily: "Montserrat, -apple-system, sans-serif",
                }}
              >
                {/* Mobile App Bar */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-2.5 w-2.5"
                        style={{
                          backgroundColor: settings.primaryColor,
                          borderRadius: isSharp ? "0px" : "999px",
                        }}
                      />
                      <span className="text-xs font-black tracking-tight">OrderKing</span>
                    </div>
                    <div className="text-[9px] text-slate-400">Sector 62, Noida • Express 18m</div>
                  </div>
                  <div
                    className="p-1.5 relative border"
                    style={{
                      borderRadius: isSharp ? "0px" : "8px",
                      borderColor: isDark ? "#334155" : "#E2E8F0",
                      backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                    }}
                  >
                    <ShoppingBag className="h-3.5 w-3.5 text-slate-400" />
                    <span
                      className="absolute -top-1 -right-1 h-3.5 w-3.5 text-[8px] font-bold text-white flex items-center justify-center"
                      style={{
                        backgroundColor: settings.primaryColor,
                        borderRadius: isSharp ? "0px" : "999px",
                      }}
                    >
                      2
                    </span>
                  </div>
                </div>

                {/* Search Bar */}
                <div
                  className="px-2.5 py-1.5 border flex items-center justify-between text-[10px]"
                  style={{
                    borderRadius: isSharp ? "0px" : "8px",
                    borderColor: isDark ? "#334155" : "#E2E8F0",
                    backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
                    color: isDark ? "#94A3B8" : "#64748B",
                  }}
                >
                  <span>Search "Dum Biryani, Shawarma"...</span>
                  <span className="text-[9px]">🔍</span>
                </div>

                {/* Promo Hero Card */}
                <div
                  className="p-3 text-white relative overflow-hidden"
                  style={{
                    backgroundColor: settings.primaryColor,
                    borderRadius: isSharp ? "0px" : `${settings.radiusPx}px`,
                  }}
                >
                  <div className="relative z-10 space-y-1">
                    <span className="inline-block px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-black/20 rounded">
                      Zero Surge Guarantee
                    </span>
                    <div className="text-sm font-extrabold leading-tight">
                      Flat 25% Off Local Biryanis
                    </div>
                    <div className="text-[9px] opacity-90">
                      Cooked fresh & delivered in 22 mins.
                    </div>
                  </div>
                </div>

                {/* Category Pills with Current Radius */}
                <div className="flex gap-1.5 overflow-x-hidden pt-0.5">
                  {["All", "Biryani", "Burgers", "Rolls"].map((cat, i) => (
                    <div
                      key={cat}
                      className="px-2.5 py-1 text-[9px] font-bold border transition-all"
                      style={{
                        borderRadius: isSharp ? "0px" : `${Math.min(settings.radiusPx, 12)}px`,
                        backgroundColor: i === 0 ? settings.primaryColor : isDark ? "#1E293B" : "#F1F5F9",
                        color: i === 0 ? "#FFFFFF" : isDark ? "#CBD5E1" : "#475569",
                        borderColor: i === 0 ? settings.primaryColor : isDark ? "#334155" : "#E2E8F0",
                      }}
                    >
                      {cat}
                    </div>
                  ))}
                </div>

                {/* Food Item Card */}
                <div
                  className="p-2.5 border transition-all space-y-2"
                  style={{
                    borderRadius: isSharp ? "0px" : `${settings.radiusPx}px`,
                    borderColor: isDark ? "#334155" : "#E2E8F0",
                    backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                  }}
                >
                  <div className="flex gap-2">
                    {/* Item Image Mockup */}
                    <div
                      className="h-16 w-16 bg-slate-300 shrink-0 flex items-center justify-center text-xs font-bold text-slate-600"
                      style={{
                        borderRadius: isSharp ? "0px" : `${Math.min(settings.radiusPx, 8)}px`,
                        backgroundColor: isDark ? "#334155" : "#E2E8F0",
                      }}
                    >
                      🍗
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-500 font-bold">
                          BESTSELLER
                        </span>
                        <div className="flex items-center text-[9px] font-bold text-amber-500">
                          <Star className="h-2.5 w-2.5 fill-current" /> 4.8
                        </div>
                      </div>
                      <div className="text-xs font-bold truncate mt-0.5">
                        Lucknowi Chicken Biryani
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Fragrant saffron rice with tender chicken
                      </div>
                      <div className="text-xs font-black mt-1">₹299</div>
                    </div>
                  </div>

                  {/* Primary CTA Button */}
                  <button
                    type="button"
                    className="w-full py-1.5 px-3 text-xs font-bold text-white flex items-center justify-center gap-1 shadow-sm transition active:scale-95"
                    style={{
                      backgroundColor: settings.primaryColor,
                      borderRadius: isSharp ? "0px" : `${settings.radiusPx}px`,
                    }}
                  >
                    <span>Add to Cart • ₹299</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>

                {/* KingPay Wallet Widget */}
                <div
                  className="p-2 border flex items-center justify-between text-[10px]"
                  style={{
                    borderRadius: isSharp ? "0px" : `${Math.min(settings.radiusPx, 8)}px`,
                    borderColor: isDark ? "#334155" : "#E2E8F0",
                    backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px]">⚡</span>
                    <div>
                      <div className="font-bold text-[9px]">KingPay Instant Checkout</div>
                      <div className="text-[8px] text-slate-400">Save 5% cashback on this order</div>
                    </div>
                  </div>
                  <span
                    className="text-[9px] font-bold"
                    style={{ color: settings.primaryColor }}
                  >
                    Apply
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 text-center text-xs">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-mono">Theme Mode</div>
                <div className="font-bold text-slate-800 capitalize mt-0.5">{settings.themeMode}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-mono">Corner Radius</div>
                <div className="font-bold text-slate-800 mt-0.5">{isSharp ? "Sharp (0px)" : `${settings.radiusPx}px`}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-mono">Primary Color</div>
                <div className="font-bold font-mono text-slate-800 mt-0.5">{settings.primaryColor}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
