import React, { useState, useEffect } from "react";
import {
  Palette,
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
  ChevronRight,
  Send,
  LayoutGrid,
  Navigation,
  Eye,
  EyeOff,
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

export interface BottomTabItem {
  id: string;
  label: string;
  enabled: boolean;
}

export interface HomeSectionItem {
  id: string;
  title: string;
  enabled: boolean;
}

export interface ExtendedCustomerUiConfig extends CustomerUiSettingsState {
  secondaryColor: string;
  appHeaderTitle: string;
  searchPlaceholder: string;
  promoBannerTitle: string;
  promoBannerSubtitle: string;
  promoBannerBadge: string;
  showCartBadge: boolean;
  compactFoodCards: boolean;
  bottomTabs: BottomTabItem[];
  homeSections: HomeSectionItem[];
}

const STORAGE_KEY = "orderking_customer_app_ui_v1";

const DEFAULT_EXTENDED_SETTINGS: ExtendedCustomerUiConfig = {
  primaryColor: "#E23744",
  secondaryColor: "#0D9488",
  radiusPx: 16,
  themeMode: "light",
  appHeaderTitle: "OrderKing",
  searchPlaceholder: "Search biryani, burgers, or local kitchens...",
  promoBannerTitle: "Flat 25% Off Local Kitchens",
  promoBannerSubtitle: "Freshly cooked meals delivered straight to your door.",
  promoBannerBadge: "No Surge Fee",
  showCartBadge: true,
  compactFoodCards: false,
  bottomTabs: [
    { id: "home", label: "Home", enabled: true },
    { id: "search", label: "Search", enabled: true },
    { id: "orders", label: "Orders", enabled: true },
    { id: "wallet", label: "KingPay", enabled: true },
    { id: "profile", label: "Account", enabled: true },
  ],
  homeSections: [
    { id: "searchBar", title: "Top Search Bar", enabled: true },
    { id: "promoBanner", title: "Top Offer Banner", enabled: true },
    { id: "categories", title: "Food Category Buttons", enabled: true },
    { id: "featured", title: "Popular Near You", enabled: true },
    { id: "walletStrip", title: "KingPay Instant Checkout Strip", enabled: true },
  ],
};

const PRESET_COLORS = [
  { name: "Crimson Red", hex: "#E23744", desc: "Classic food delivery red" },
  { name: "Forest Green", hex: "#0D3B2E", desc: "Clean dark green look" },
  { name: "Royal Blue", hex: "#2563EB", desc: "High-trust payment blue" },
  { name: "Warm Orange", hex: "#EA580C", desc: "Bright fast-food orange" },
  { name: "Fresh Teal", hex: "#0D9488", desc: "Fresh grocery & kitchen teal" },
  { name: "Indigo Purple", hex: "#4F46E5", desc: "Modern bold purple" },
  { name: "Midnight Slate", hex: "#0F172A", desc: "Minimal dark ink" },
  { name: "Ruby Pink", hex: "#E11D48", desc: "Vibrant dessert & cafe pink" },
];

interface Props {
  config?: any;
  onSave?: (updates: any) => Promise<boolean | void>;
  saving?: boolean;
}

export function CustomerAppUiSettings({ config, onSave, saving: parentSaving }: Props) {
  const [settings, setSettings] = useState<ExtendedCustomerUiConfig>(DEFAULT_EXTENDED_SETTINGS);
  const [initialSettings, setInitialSettings] = useState<ExtendedCustomerUiConfig>(DEFAULT_EXTENDED_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hexInputError, setHexInputError] = useState(false);

  // Load saved settings from localStorage, props, or database on mount
  useEffect(() => {
    let isMounted = true;

    async function fetchSettings() {
      try {
        setLoading(true);
        let merged: ExtendedCustomerUiConfig = { ...DEFAULT_EXTENDED_SETTINGS };

        // 1. Check localStorage first for full extended customization
        try {
          const rawLocal = localStorage.getItem(STORAGE_KEY);
          if (rawLocal) {
            const parsedLocal = JSON.parse(rawLocal);
            merged = {
              ...merged,
              ...parsedLocal,
              bottomTabs: Array.isArray(parsedLocal.bottomTabs)
                ? parsedLocal.bottomTabs
                : DEFAULT_EXTENDED_SETTINGS.bottomTabs,
              homeSections: Array.isArray(parsedLocal.homeSections)
                ? parsedLocal.homeSections
                : DEFAULT_EXTENDED_SETTINGS.homeSections,
            };
          }
        } catch {
          // Ignore localStorage parse issues
        }

        // 2. Load core brand settings from server function or REST API
        let serverBrand: Partial<ExtendedCustomerUiConfig> | null = null;
        try {
          const res = await loadCustomerUiSettingsFn();
          if (res && res.ok && res.data) {
            serverBrand = {
              primaryColor: res.data.primaryColor || merged.primaryColor,
              radiusPx: res.data.radiusPx !== undefined ? Number(res.data.radiusPx) : merged.radiusPx,
              themeMode: res.data.themeMode === "dark" ? "dark" : "light",
            };
          }
        } catch {
          const resp = await fetch("/api/v1/admin/settings");
          if (resp.ok) {
            const data = await resp.json();
            if (data?.brand) {
              serverBrand = {
                ...data.brand,
                primaryColor: data.brand.primaryColor || merged.primaryColor,
                radiusPx: data.brand.radiusPx !== undefined ? Number(data.brand.radiusPx) : merged.radiusPx,
                themeMode: data.brand.themeMode === "dark" ? "dark" : "light",
              };
            }
          }
        }

        if (serverBrand) {
          merged = { ...merged, ...serverBrand };
        }

        if (isMounted) {
          setSettings(merged);
          setInitialSettings(merged);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage("Could not load saved app look settings: " + (err?.message || "Unknown error"));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (config?.brand) {
      let localOverrides: Partial<ExtendedCustomerUiConfig> = {};
      try {
        const rawLocal = localStorage.getItem(STORAGE_KEY);
        if (rawLocal) localOverrides = JSON.parse(rawLocal);
      } catch {
        // Ignore
      }
      const init: ExtendedCustomerUiConfig = {
        ...DEFAULT_EXTENDED_SETTINGS,
        ...localOverrides,
        ...config.brand,
        primaryColor: config.brand.primaryColor || localOverrides.primaryColor || "#E23744",
        radiusPx:
          config.brand.radiusPx !== undefined
            ? Number(config.brand.radiusPx)
            : localOverrides.radiusPx ?? 16,
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

  const handleHexChange = (val: string) => {
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

  const updateBottomTab = (id: string, updates: Partial<BottomTabItem>) => {
    setSettings((prev) => ({
      ...prev,
      bottomTabs: prev.bottomTabs.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  };

  const updateHomeSection = (id: string, updates: Partial<HomeSectionItem>) => {
    setSettings((prev) => ({
      ...prev,
      homeSections: prev.homeSections.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveSuccess(false);
      setErrorMessage(null);

      if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(settings.primaryColor)) {
        setErrorMessage("Please enter a valid 3 or 6 digit hex color (for example, #E23744).");
        setSaving(false);
        return;
      }

      // 1. Always persist full customization to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch {
        // Ignore storage quota errors
      }

      const coreSettings: CustomerUiSettingsState = {
        primaryColor: settings.primaryColor,
        radiusPx: settings.radiusPx,
        themeMode: settings.themeMode,
      };

      if (onSave) {
        await onSave({ brand: settings });
      } else {
        let saved = false;
        try {
          const res = await saveCustomerUiSettingsFn({ data: { settings: coreSettings } });
          if (res && res.ok) saved = true;
        } catch {
          // Fallback to REST endpoint
        }

        try {
          const resp = await fetch("/api/v1/admin/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ brand: settings }),
          });
          if (resp.ok) saved = true;
        } catch {
          // Handled below
        }

        if (!saved) {
          throw new Error("Could not save Customer App settings to the server.");
        }
      }

      setInitialSettings(settings);
      setSaveSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save Customer App look settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(initialSettings);
    setHexInputError(false);
    setErrorMessage(null);
    setSaveSuccess(false);
  };

  const handleRestoreDefaults = () => {
    setSettings(DEFAULT_EXTENDED_SETTINGS);
    setHexInputError(false);
    setErrorMessage(null);
    setSaveSuccess(false);
  };

  const isSharp = settings.radiusPx === 0;
  const isDark = settings.themeMode === "dark";
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings);

  const enabledTabsCount = settings.bottomTabs.filter((t) => t.enabled).length;
  const enabledSectionsCount = settings.homeSections.filter((s) => s.enabled).length;

  const isSectionEnabled = (id: string) =>
    settings.homeSections.find((s) => s.id === id)?.enabled ?? true;
  const getSectionTitle = (id: string) =>
    settings.homeSections.find((s) => s.id === id)?.title || "";

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Customer App Look &amp; Layout
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Pick your app colors, button shapes, home screen sections, and bottom menu tabs in one place.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleRestoreDefaults}
              disabled={saving || parentSaving}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition border border-slate-200"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Defaults
            </button>
            {hasChanges && (
              <button
                type="button"
                onClick={handleReset}
                disabled={saving || parentSaving}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition border border-slate-200"
              >
                Undo Changes
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || parentSaving || hexInputError}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {saving || parentSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Save App Look (1-Click)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Clear Current Result & What Action To Take Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Current Result
            </div>
            <p className="text-xs font-semibold text-slate-900 mt-1">
              Primary color is <span className="font-mono">{settings.primaryColor}</span>,{" "}
              {isDark ? "Dark Mode" : "Light Mode"} is active, corners are set to{" "}
              {settings.radiusPx}px, with {enabledSectionsCount} home sections and {enabledTabsCount} bottom tabs shown.
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50/60 border border-emerald-200 p-3.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              What Action To Take
            </div>
            <p className="text-xs font-medium text-emerald-950 mt-1">
              {hasChanges
                ? "You have unsaved changes—check the phone preview on the right and click 'Save App Look (1-Click)' to apply."
                : "Adjust any color, corner slider, home section, or tab label below, then click 'Save App Look (1-Click)'."}
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-xs font-medium text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Saved! Your new Customer App look and layout are now live.</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveSuccess(false)}
              className="text-emerald-700 hover:underline font-bold"
            >
              Dismiss
            </button>
          </div>
        )}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-medium text-red-800">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
          Loading Customer App look settings...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Controls Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Primary & Secondary Brand Colors */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">1. App Colors</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Choose the main button color and secondary highlight color for your app.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    {settings.primaryColor.toUpperCase()}
                  </span>
                  <div
                    className="h-6 w-6 rounded-lg border border-slate-300"
                    style={{ backgroundColor: settings.primaryColor }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Main Button &amp; Banner Color
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="relative flex items-center justify-center cursor-pointer shrink-0">
                      <input
                        type="color"
                        value={settings.primaryColor.startsWith("#") ? settings.primaryColor : "#E23744"}
                        onChange={handleColorPickerChange}
                        className="sr-only"
                      />
                      <div
                        className="h-10 w-12 rounded-xl border border-slate-300 shadow-sm flex items-center justify-center"
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
                        onChange={(e) => handleHexChange("#" + e.target.value.replace(/^#/, ""))}
                        placeholder="E23744"
                        maxLength={7}
                        className={`w-full pl-7 pr-3 py-2 text-xs font-mono font-bold uppercase rounded-xl border ${
                          hexInputError
                            ? "border-red-400 text-red-600"
                            : "border-slate-300 focus:border-emerald-500"
                        } bg-slate-50 text-slate-900 focus:outline-none`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Secondary Badge Color
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="relative flex items-center justify-center cursor-pointer shrink-0">
                      <input
                        type="color"
                        value={settings.secondaryColor.startsWith("#") ? settings.secondaryColor : "#0D9488"}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, secondaryColor: e.target.value.toUpperCase() }))
                        }
                        className="sr-only"
                      />
                      <div
                        className="h-10 w-12 rounded-xl border border-slate-300 shadow-sm flex items-center justify-center"
                        style={{ backgroundColor: settings.secondaryColor }}
                      >
                        <Sliders className="h-4 w-4 text-white drop-shadow" />
                      </div>
                    </label>
                    <input
                      type="text"
                      value={settings.secondaryColor}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, secondaryColor: e.target.value.toUpperCase() }))
                      }
                      placeholder="#0D9488"
                      maxLength={7}
                      className="w-full px-3 py-2 text-xs font-mono font-bold uppercase rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Quick Color Presets
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESET_COLORS.map((preset) => {
                    const isSelected = settings.primaryColor.toUpperCase() === preset.hex.toUpperCase();
                    return (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => selectPreset(preset.hex)}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? "border-slate-900 bg-slate-50 ring-2 ring-slate-900/10"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div
                          className="h-4 w-4 rounded-md shrink-0 border border-black/10"
                          style={{ backgroundColor: preset.hex }}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-800 truncate">{preset.name}</div>
                          <div className="text-[10px] font-mono text-slate-400">{preset.hex}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. Corner Shape & Card Density */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">2. Button &amp; Card Corner Shape</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Make buttons and food cards sharp and square or smooth and rounded.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                  {isSharp ? "0px (Square)" : `${settings.radiusPx}px (Rounded)`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => toggleRadius(true)}
                  className={`p-4 text-left border rounded-xl transition cursor-pointer ${
                    isSharp
                      ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Square className="h-4 w-4 text-slate-800" />
                      <span className="text-xs font-bold text-slate-900">Sharp Square Corners (0px)</span>
                    </div>
                    {isSharp && <span className="text-xs font-bold text-emerald-600">✓</span>}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1.5">
                    Clean 90-degree edges on all cards, pictures, and buttons.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => toggleRadius(false)}
                  className={`p-4 text-left border rounded-xl transition cursor-pointer ${
                    !isSharp
                      ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Circle className="h-4 w-4 text-slate-800" />
                      <span className="text-xs font-bold text-slate-900">Rounded Corners (16px)</span>
                    </div>
                    {!isSharp && <span className="text-xs font-bold text-emerald-600">✓</span>}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1.5">
                    Soft friendly curves on all food cards and checkout buttons.
                  </p>
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-4">
                <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                  Exact corner roundness:
                </span>
                <input
                  type="range"
                  min={0}
                  max={24}
                  step={2}
                  value={settings.radiusPx}
                  onChange={(e) => setSettings((prev) => ({ ...prev, radiusPx: Number(e.target.value) }))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <span className="text-xs font-mono font-bold text-slate-800 w-12 text-right">
                  {settings.radiusPx}px
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.compactFoodCards}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, compactFoodCards: e.target.checked }))
                    }
                    className="rounded accent-emerald-600 h-4 w-4"
                  />
                  Use compact food cards (fits more dishes on small screens)
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showCartBadge}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, showCartBadge: e.target.checked }))
                    }
                    className="rounded accent-emerald-600 h-4 w-4"
                  />
                  Show top-right shopping bag badge
                </label>
              </div>
            </div>

            {/* 3. Light or Dark Screen Theme */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">3. Light or Dark App Background</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Set whether customers see a bright white background or a dark night background.
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg border bg-slate-100 text-slate-800 border-slate-200">
                  {isDark ? "Dark Mode" : "Light Mode"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => toggleTheme("light")}
                  className={`p-4 text-left border rounded-xl transition cursor-pointer ${
                    !isDark
                      ? "border-emerald-600 bg-amber-50/40 ring-2 ring-emerald-500/20"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4 text-amber-600" />
                      <span className="text-xs font-bold text-slate-900">Light Mode (Daytime White)</span>
                    </div>
                    {!isDark && <span className="text-xs font-bold text-emerald-600">✓</span>}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1.5">
                    Bright white background that is easy to read outdoors in daylight.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => toggleTheme("dark")}
                  className={`p-4 text-left border rounded-xl transition cursor-pointer ${
                    isDark
                      ? "border-emerald-600 bg-slate-900 text-white ring-2 ring-emerald-500/20"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4 text-indigo-400" />
                      <span className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                        Dark Mode (Night Black)
                      </span>
                    </div>
                    {isDark && <span className="text-xs font-bold text-emerald-400">✓</span>}
                  </div>
                  <p className={`text-[11px] mt-1.5 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    Dark background that reduces eye strain for late-night food orders.
                  </p>
                </button>
              </div>
            </div>

            {/* 4. Home Screen Sections & Text Customization */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4 text-emerald-600" />
                    4. Home Screen Sections &amp; Header Text
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Turn home screen blocks on or off and edit the exact titles customers see.
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-600">
                  {enabledSectionsCount} of {settings.homeSections.length} shown
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    App Top Header Name
                  </label>
                  <input
                    type="text"
                    value={settings.appHeaderTitle}
                    onChange={(e) => setSettings((prev) => ({ ...prev, appHeaderTitle: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Search Box Prompt
                  </label>
                  <input
                    type="text"
                    value={settings.searchPlaceholder}
                    onChange={(e) => setSettings((prev) => ({ ...prev, searchPlaceholder: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                {settings.homeSections.map((sec) => (
                  <div
                    key={sec.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50/70"
                  >
                    <div className="flex items-center gap-2.5 flex-1">
                      <button
                        type="button"
                        onClick={() => updateHomeSection(sec.id, { enabled: !sec.enabled })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                          sec.enabled
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {sec.enabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        {sec.enabled ? "ON" : "OFF"}
                      </button>
                      <input
                        type="text"
                        value={sec.title}
                        onChange={(e) => updateHomeSection(sec.id, { title: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-900"
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{sec.id}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Bottom Navigation Bar Tabs */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-emerald-600" />
                    5. Bottom Menu Bar Tabs
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Show or hide bottom navigation buttons and rename their labels.
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-600">
                  {enabledTabsCount} active tabs
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {settings.bottomTabs.map((tab) => (
                  <div
                    key={tab.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <button
                      type="button"
                      onClick={() => updateBottomTab(tab.id, { enabled: !tab.enabled })}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                        tab.enabled ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {tab.enabled ? "SHOWN" : "HIDDEN"}
                    </button>
                    <input
                      type="text"
                      value={tab.label}
                      onChange={(e) => updateBottomTab(tab.id, { label: e.target.value })}
                      className="flex-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-900"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Live Phone Preview Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Customer Phone Preview
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  LIVE PREVIEW
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-4">
                Shows exactly how your colors, corners, sections, and bottom tabs look on a customer phone.
              </p>

              {/* Phone Frame */}
              <div className="mx-auto max-w-[320px] rounded-[36px] p-3 bg-slate-900 shadow-xl border-4 border-slate-800 relative">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 h-3.5 w-20 bg-slate-950 rounded-full z-20" />

                <div
                  className={`overflow-hidden transition-colors duration-200 relative pt-6 pb-3 px-3 flex flex-col justify-between min-h-[510px] text-left select-none ${
                    isDark ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900"
                  }`}
                  style={{
                    borderRadius: isSharp ? "0px" : "26px",
                  }}
                >
                  <div className="space-y-2.5">
                    {/* App Header */}
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
                          <span className="text-xs font-black tracking-tight">
                            {settings.appHeaderTitle || "OrderKing"}
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-400">Sribhumi • 20 mins delivery</div>
                      </div>
                      {settings.showCartBadge && (
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
                      )}
                    </div>

                    {/* Search Bar */}
                    {isSectionEnabled("searchBar") && (
                      <div
                        className="px-2.5 py-1.5 border flex items-center justify-between text-[10px]"
                        style={{
                          borderRadius: isSharp ? "0px" : "8px",
                          borderColor: isDark ? "#334155" : "#E2E8F0",
                          backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
                          color: isDark ? "#94A3B8" : "#64748B",
                        }}
                      >
                        <span className="truncate">{settings.searchPlaceholder}</span>
                        <span className="text-[9px]">🔍</span>
                      </div>
                    )}

                    {/* Promo Hero Banner */}
                    {isSectionEnabled("promoBanner") && (
                      <div
                        className="p-3 text-white relative overflow-hidden"
                        style={{
                          backgroundColor: settings.primaryColor,
                          borderRadius: isSharp ? "0px" : `${settings.radiusPx}px`,
                        }}
                      >
                        <div className="space-y-1">
                          <span
                            className="inline-block px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded"
                            style={{ backgroundColor: settings.secondaryColor }}
                          >
                            {settings.promoBannerBadge}
                          </span>
                          <div className="text-xs font-extrabold leading-tight">
                            {settings.promoBannerTitle}
                          </div>
                          <div className="text-[9px] opacity-90">{settings.promoBannerSubtitle}</div>
                        </div>
                      </div>
                    )}

                    {/* Categories */}
                    {isSectionEnabled("categories") && (
                      <div className="flex gap-1.5 overflow-x-hidden pt-0.5">
                        {["All", "Biryani", "Burgers", "Momos"].map((cat, i) => (
                          <div
                            key={cat}
                            className="px-2.5 py-1 text-[9px] font-bold border"
                            style={{
                              borderRadius: isSharp ? "0px" : `${Math.min(settings.radiusPx, 12)}px`,
                              backgroundColor:
                                i === 0 ? settings.primaryColor : isDark ? "#1E293B" : "#F1F5F9",
                              color: i === 0 ? "#FFFFFF" : isDark ? "#CBD5E1" : "#475569",
                              borderColor:
                                i === 0 ? settings.primaryColor : isDark ? "#334155" : "#E2E8F0",
                            }}
                          >
                            {cat}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Featured Food Card */}
                    {isSectionEnabled("featured") && (
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold opacity-80">
                          {getSectionTitle("featured")}
                        </div>
                        <div
                          className={`${settings.compactFoodCards ? "p-2" : "p-2.5"} border space-y-2`}
                          style={{
                            borderRadius: isSharp ? "0px" : `${settings.radiusPx}px`,
                            borderColor: isDark ? "#334155" : "#E2E8F0",
                            backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                          }}
                        >
                          <div className="flex gap-2">
                            <div
                              className={`${
                                settings.compactFoodCards ? "h-12 w-12" : "h-14 w-14"
                              } shrink-0 flex items-center justify-center text-xs font-bold`}
                              style={{
                                borderRadius: isSharp ? "0px" : `${Math.min(settings.radiusPx, 8)}px`,
                                backgroundColor: isDark ? "#334155" : "#E2E8F0",
                              }}
                            >
                              🍗
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span
                                  className="text-[8px] px-1 py-0.2 rounded font-bold text-white"
                                  style={{ backgroundColor: settings.secondaryColor }}
                                >
                                  FRESH
                                </span>
                                <div className="flex items-center text-[9px] font-bold text-amber-500">
                                  <Star className="h-2.5 w-2.5 fill-current" /> 4.8
                                </div>
                              </div>
                              <div className="text-xs font-bold truncate mt-0.5">
                                Special Chicken Biryani
                              </div>
                              <div className="text-xs font-black mt-0.5">₹240</div>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="w-full py-1.5 px-3 text-[11px] font-bold text-white flex items-center justify-center gap-1"
                            style={{
                              backgroundColor: settings.primaryColor,
                              borderRadius: isSharp ? "0px" : `${settings.radiusPx}px`,
                            }}
                          >
                            <span>Add to Cart • ₹240</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* KingPay Strip */}
                    {isSectionEnabled("walletStrip") && (
                      <div
                        className="p-2 border flex items-center justify-between text-[10px]"
                        style={{
                          borderRadius: isSharp ? "0px" : `${Math.min(settings.radiusPx, 8)}px`,
                          borderColor: isDark ? "#334155" : "#E2E8F0",
                          backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
                        }}
                      >
                        <div className="font-bold text-[9px] truncate">
                          ⚡ {getSectionTitle("walletStrip")}
                        </div>
                        <span
                          className="text-[9px] font-bold shrink-0"
                          style={{ color: settings.primaryColor }}
                        >
                          1-Tap Pay
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Navigation Bar */}
                  <div
                    className="mt-3 pt-2 border-t flex items-center justify-around"
                    style={{
                      borderColor: isDark ? "#1E293B" : "#E2E8F0",
                    }}
                  >
                    {settings.bottomTabs
                      .filter((t) => t.enabled)
                      .map((tab, idx) => (
                        <div key={tab.id} className="flex flex-col items-center">
                          <div
                            className="h-1.5 w-1.5 rounded-full mb-0.5"
                            style={{
                              backgroundColor:
                                idx === 0
                                  ? settings.primaryColor
                                  : isDark
                                  ? "#475569"
                                  : "#CBD5E1",
                            }}
                          />
                          <span
                            className="text-[9px] font-bold"
                            style={{
                              color:
                                idx === 0
                                  ? settings.primaryColor
                                  : isDark
                                  ? "#94A3B8"
                                  : "#64748B",
                            }}
                          >
                            {tab.label}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
