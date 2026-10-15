import { useState, useEffect, useMemo, useCallback } from "react";
import {
  DEFAULT_ALGORITHM_SETTINGS,
  type AlgorithmSettingsConfig,
} from "@/lib/orderking/cms-connectors";
import {
  loadAlgorithmSettingsFn,
  saveAlgorithmSettingsFn,
} from "@/lib/orderking/actions";
import {
  SlidersHorizontal,
  Compass,
  Zap,
  Clock,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Calculator,
  Bike,
  Truck,
} from "lucide-react";

interface AlgorithmSettingsProps {
  /** Optional callback after saving */
  onSaveSuccess?: (settings: AlgorithmSettingsConfig) => void;
  /** Compact embedded mode (e.g. within EcosystemCMS) */
  compact?: boolean;
}

export interface ExtendedDispatchRules extends AlgorithmSettingsConfig {
  perKmRateInr: number;
  riderBasePayoutInr: number;
  riderWaitPayPerMinInr: number;
  riderFreeWaitMinutes: number;
  freeDeliveryMinOrderInr: number;
  enableFreeDeliveryThreshold: boolean;
  maxBatchOrdersPerRider: number;
  autoAssignNearestRider: boolean;
  weatherDelayBufferMinutes: number;
}

const STORAGE_KEY = "orderking_dispatch_rules_v1";

const DEFAULT_EXTENDED_RULES: ExtendedDispatchRules = {
  ...DEFAULT_ALGORITHM_SETTINGS,
  perKmRateInr: 12,
  riderBasePayoutInr: 35,
  riderPickupFeeInr: 20,
  riderDropFeeInr: 15,
  riderWaitPayPerMinInr: 1,
  riderFreeWaitMinutes: 6,
  riderRainSurgeBonusInr: 25,
  activeCityTier: "TIER_1",
  freeDeliveryMinOrderInr: 399,
  enableFreeDeliveryThreshold: true,
  maxBatchOrdersPerRider: 2,
  autoAssignNearestRider: true,
  weatherDelayBufferMinutes: 10,
};

export function AlgorithmSettings({ onSaveSuccess, compact = false }: AlgorithmSettingsProps) {
  const [settings, setSettings] = useState<ExtendedDispatchRules>(DEFAULT_EXTENDED_RULES);
  const [savedSettings, setSavedSettings] = useState<ExtendedDispatchRules>(DEFAULT_EXTENDED_RULES);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      let merged: ExtendedDispatchRules = { ...DEFAULT_EXTENDED_RULES };

      // 1. Read saved extended rules from localStorage
      try {
        const localRaw = localStorage.getItem(STORAGE_KEY);
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          merged = { ...merged, ...parsed };
        }
      } catch {
        // Ignore localStorage parse errors
      }

      // 2. Try server function
      let loadedCore: Partial<ExtendedDispatchRules> | null = null;
      try {
        const res = await loadAlgorithmSettingsFn();
        if (res && res.ok && res.data) {
          loadedCore = {
            maxDeliveryRadiusKm: Number(res.data.maxDeliveryRadiusKm) || merged.maxDeliveryRadiusKm,
            baseDeliveryFeeInr: Number(res.data.baseDeliveryFeeInr) ?? merged.baseDeliveryFeeInr,
            surgeMultiplierCap: Number(res.data.surgeMultiplierCap) || merged.surgeMultiplierCap,
            kitchenPrepBufferMinutes:
              Number(res.data.kitchenPrepBufferMinutes) || merged.kitchenPrepBufferMinutes,
          };
        }
      } catch {
        // Fallback to REST API
        const apiRes = await fetch("/api/v1/admin/settings");
        if (apiRes.ok) {
          const json = await apiRes.json();
          if (json.algorithm) {
            loadedCore = {
              ...json.algorithm,
              maxDeliveryRadiusKm:
                Number(json.algorithm.maxDeliveryRadiusKm) || merged.maxDeliveryRadiusKm,
              baseDeliveryFeeInr:
                Number(json.algorithm.baseDeliveryFeeInr) ?? merged.baseDeliveryFeeInr,
              surgeMultiplierCap:
                Number(json.algorithm.surgeMultiplierCap) || merged.surgeMultiplierCap,
              kitchenPrepBufferMinutes:
                Number(json.algorithm.kitchenPrepBufferMinutes) || merged.kitchenPrepBufferMinutes,
            };
          }
        }
      }

      if (loadedCore) {
        merged = { ...merged, ...loadedCore };
      }

      setSettings(merged);
      setSavedSettings(merged);
    } catch (err) {
      console.error("Failed to load dispatch rules:", err);
      setErrorMessage("Could not load saved rules from server. Showing current local settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(savedSettings);
  }, [settings, savedSettings]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    setErrorMessage(null);

    try {
      // 1. Save full customization to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch {
        // Ignore storage errors
      }

      const corePayload: AlgorithmSettingsConfig = {
        maxDeliveryRadiusKm: settings.maxDeliveryRadiusKm,
        baseDeliveryFeeInr: settings.baseDeliveryFeeInr,
        surgeMultiplierCap: settings.surgeMultiplierCap,
        kitchenPrepBufferMinutes: settings.kitchenPrepBufferMinutes,
      };

      // 2. Save via server function
      let serverSaved = false;
      try {
        const res = await saveAlgorithmSettingsFn({ data: { algorithm: corePayload } });
        if (res && res.ok) {
          serverSaved = true;
        }
      } catch {
        // Fallback to direct REST API below
      }

      // 3. Also sync full settings object to REST endpoint
      try {
        const apiRes = await fetch("/api/v1/admin/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer dev_founder_secret",
          },
          body: JSON.stringify({
            algorithm: settings,
            max_delivery_radius_km: settings.maxDeliveryRadiusKm,
            base_delivery_fee_inr: settings.baseDeliveryFeeInr,
            surge_multiplier_cap: settings.surgeMultiplierCap,
            kitchen_prep_buffer_mins: settings.kitchenPrepBufferMinutes,
          }),
        });
        if (apiRes.ok) serverSaved = true;
      } catch {
        // Handled by serverSaved check
      }

      if (!serverSaved) {
        throw new Error("Could not reach the settings server.");
      }

      setSavedSettings(settings);
      setSaveMessage("Saved! Your new delivery fees, radius, and dispatch rules are now active.");
      onSaveSuccess?.(corePayload);
    } catch (err) {
      console.error("Failed to save delivery rules:", err);
      setErrorMessage(`Save error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToSaved = () => {
    setSettings(savedSettings);
    setErrorMessage(null);
    setSaveMessage(null);
  };

  const handleRestoreDefaults = () => {
    setSettings(DEFAULT_EXTENDED_RULES);
    setErrorMessage(null);
    setSaveMessage(null);
  };

  // Simple, honest math for a sample 3 km order
  const sampleMath = useMemo(() => {
    const sampleDistanceKm = 3;
    const customerDeliveryFee =
      settings.baseDeliveryFeeInr + sampleDistanceKm * settings.perKmRateInr;
    const maxBusyHourFee = Math.round(customerDeliveryFee * settings.surgeMultiplierCap);
    const riderPayFor10MinWait =
      settings.riderBasePayoutInr +
      Math.max(0, 10 - settings.riderFreeWaitMinutes) * settings.riderWaitPayPerMinInr;

    return {
      sampleDistanceKm,
      customerDeliveryFee,
      maxBusyHourFee,
      riderPayFor10MinWait,
    };
  }, [settings]);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-slate-500">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 animate-spin text-emerald-600" />
          <span className="text-sm font-medium">Loading delivery and dispatch rules...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${compact ? "pt-2" : ""}`}>
      {/* Header & Summary Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-emerald-600" />
              Delivery &amp; Dispatch Rules
            </h2>
            <p className="text-xs text-slate-600">
              Set how far you deliver, how much customers pay for delivery, and how riders get assigned and paid.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleRestoreDefaults}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Defaults
            </button>

            {hasChanges && (
              <button
                type="button"
                onClick={handleResetToSaved}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Undo Changes
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Activity className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save Rules (1-Click)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Clear Current Result & What Action To Take */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Current Result
            </div>
            <p className="text-xs font-semibold text-slate-900 mt-1">
              Delivering up to {settings.maxDeliveryRadiusKm} km, starting fee ₹
              {settings.baseDeliveryFeeInr} (+₹{settings.perKmRateInr}/km), max prep time{" "}
              {settings.kitchenPrepBufferMinutes} mins, and rider wait pay ₹
              {settings.riderWaitPayPerMinInr}/min.
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50/60 border border-emerald-200 p-3.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              What Action To Take
            </div>
            <p className="text-xs font-medium text-emerald-950 mt-1">
              {hasChanges
                ? "You changed one or more delivery rules—click 'Save Rules (1-Click)' to apply them to all new orders."
                : "Adjust any slider or number box below and click 'Save Rules (1-Click)' to update live order pricing."}
            </p>
          </div>
        </div>

        {saveMessage && (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{saveMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveMessage(null)}
              className="text-emerald-700 font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Main 4 Rules Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* RULE 1: Maximum Delivery Radius (km) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">1. Max Delivery Radius (km)</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Customers farther than this distance from a restaurant cannot place a delivery order.
              </p>
            </div>

            <div className="flex items-center rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5">
              <input
                type="number"
                min="1"
                max="50"
                step="0.5"
                value={settings.maxDeliveryRadiusKm}
                onChange={(e) => {
                  const val = Math.min(50, Math.max(1, parseFloat(e.target.value) || 1));
                  setSettings((prev) => ({ ...prev, maxDeliveryRadiusKm: val }));
                }}
                className="w-14 bg-transparent text-right font-mono text-sm font-bold text-blue-700 focus:outline-none"
              />
              <span className="ml-1 font-mono text-xs text-blue-700">km</span>
            </div>
          </div>

          <input
            type="range"
            min="1.0"
            max="50.0"
            step="0.5"
            value={settings.maxDeliveryRadiusKm}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, maxDeliveryRadiusKm: parseFloat(e.target.value) }))
            }
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Quick pick:</span>
              {[5, 10, 15, 25, 35].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSettings((prev) => ({ ...prev, maxDeliveryRadiusKm: preset }))}
                  className={`rounded-lg px-2 py-0.5 border text-[11px] font-semibold cursor-pointer ${
                    settings.maxDeliveryRadiusKm === preset
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {preset} km
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RULE 2: Base Delivery Fee (₹) & Per-Km Rate */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">2. Starting Delivery Fee (₹)</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                The base delivery fee charged on every order before adding per-kilometer distance charges.
              </p>
            </div>

            <div className="flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5">
              <span className="mr-0.5 font-mono text-sm font-bold text-emerald-700">₹</span>
              <input
                type="number"
                min="0"
                max="150"
                step="1"
                value={settings.baseDeliveryFeeInr}
                onChange={(e) => {
                  const val = Math.min(150, Math.max(0, parseInt(e.target.value, 10) || 0));
                  setSettings((prev) => ({ ...prev, baseDeliveryFeeInr: val }));
                }}
                className="w-12 bg-transparent text-right font-mono text-sm font-bold text-emerald-700 focus:outline-none"
              />
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="150"
            step="1"
            value={settings.baseDeliveryFeeInr}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, baseDeliveryFeeInr: parseInt(e.target.value, 10) }))
            }
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-emerald-600"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Quick pick:</span>
              {[0, 20, 30, 40, 50].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSettings((prev) => ({ ...prev, baseDeliveryFeeInr: preset }))}
                  className={`rounded-lg px-2 py-0.5 border text-[11px] font-semibold cursor-pointer ${
                    settings.baseDeliveryFeeInr === preset
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  ₹{preset}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 font-medium">Extra per km (₹):</span>
              <input
                type="number"
                min="0"
                max="50"
                value={settings.perKmRateInr}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    perKmRateInr: Math.max(0, Number(e.target.value) || 0),
                  }))
                }
                className="w-14 px-2 py-0.5 text-xs font-mono font-bold rounded border border-slate-300 bg-white text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* RULE 3: Surge Multiplier Cap */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  3. Busy-Hour Price Limit (1.0x – 3.0x)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Set to 1.0x for zero surge pricing ever, or allow a small cap during heavy rain.
              </p>
            </div>

            <div className="flex items-center rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5">
              <input
                type="number"
                min="1.0"
                max="3.0"
                step="0.1"
                value={settings.surgeMultiplierCap}
                onChange={(e) => {
                  const val = Math.min(3.0, Math.max(1.0, parseFloat(e.target.value) || 1.0));
                  setSettings((prev) => ({
                    ...prev,
                    surgeMultiplierCap: Math.round(val * 10) / 10,
                  }));
                }}
                className="w-12 bg-transparent text-right font-mono text-sm font-bold text-amber-700 focus:outline-none"
              />
              <span className="ml-0.5 font-mono text-xs text-amber-700">x</span>
            </div>
          </div>

          <input
            type="range"
            min="1.0"
            max="3.0"
            step="0.1"
            value={settings.surgeMultiplierCap}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setSettings((prev) => ({
                ...prev,
                surgeMultiplierCap: Math.round(val * 10) / 10,
              }));
            }}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-amber-600"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Quick pick:</span>
              {[1.0, 1.2, 1.5, 2.0].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSettings((prev) => ({ ...prev, surgeMultiplierCap: preset }))}
                  className={`rounded-lg px-2 py-0.5 border text-[11px] font-semibold cursor-pointer ${
                    settings.surgeMultiplierCap === preset
                      ? "border-amber-600 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {preset === 1.0 ? "1.0x (No Surge)" : `${preset.toFixed(1)}x`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RULE 4: Max Kitchen Prep Time (minutes) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  4. Max Kitchen Prep Time (mins)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                How many minutes kitchens get to cook an order before a rider arrives for pickup.
              </p>
            </div>

            <div className="flex items-center rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5">
              <input
                type="number"
                min="5"
                max="60"
                step="1"
                value={settings.kitchenPrepBufferMinutes}
                onChange={(e) => {
                  const val = Math.min(60, Math.max(5, parseInt(e.target.value, 10) || 5));
                  setSettings((prev) => ({ ...prev, kitchenPrepBufferMinutes: val }));
                }}
                className="w-12 bg-transparent text-right font-mono text-sm font-bold text-purple-700 focus:outline-none"
              />
              <span className="ml-1 font-mono text-xs text-purple-700">min</span>
            </div>
          </div>

          <input
            type="range"
            min="5"
            max="60"
            step="1"
            value={settings.kitchenPrepBufferMinutes}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                kitchenPrepBufferMinutes: parseInt(e.target.value, 10),
              }))
            }
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-purple-600"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Quick pick:</span>
              {[10, 15, 20, 25, 30].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() =>
                    setSettings((prev) => ({ ...prev, kitchenPrepBufferMinutes: preset }))
                  }
                  className={`rounded-lg px-2 py-0.5 border text-[11px] font-semibold cursor-pointer ${
                    settings.kitchenPrepBufferMinutes === preset
                      ? "border-purple-600 bg-purple-50 text-purple-700"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {preset}m
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Rider Pay, Wait Pay & Free Delivery Rules */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Bike className="h-4 w-4 text-emerald-600" />
            5. Rider Wait Pay, Batching &amp; Free Delivery Rules
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Customize how much riders earn when waiting at kitchens and when customers get free delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              City Tier Matrix
            </label>
            <p className="text-[11px] text-slate-500">
              Dominant Legacy Aggregator Indian courier payout tier.
            </p>
            <select
              value={settings.activeCityTier ?? "TIER_1"}
              onChange={(e) => {
                const tier = e.target.value as "TIER_1" | "TIER_2" | "TIER_3";
                if (tier === "TIER_1") {
                  setSettings((prev) => ({
                    ...prev,
                    activeCityTier: tier,
                    riderPickupFeeInr: 20,
                    riderDropFeeInr: 15,
                    riderBasePayoutInr: 35,
                    perKmRateInr: 12,
                  }));
                } else if (tier === "TIER_2") {
                  setSettings((prev) => ({
                    ...prev,
                    activeCityTier: tier,
                    riderPickupFeeInr: 18,
                    riderDropFeeInr: 12,
                    riderBasePayoutInr: 30,
                    perKmRateInr: 11,
                  }));
                } else {
                  setSettings((prev) => ({
                    ...prev,
                    activeCityTier: tier,
                    riderPickupFeeInr: 15,
                    riderDropFeeInr: 10,
                    riderBasePayoutInr: 25,
                    perKmRateInr: 10,
                  }));
                }
              }}
              className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-900"
            >
              <option value="TIER_1">Tier 1 Metros (Base ₹35, ₹12/km)</option>
              <option value="TIER_2">Tier 2 Growth (Base ₹30, ₹11/km)</option>
              <option value="TIER_3">Tier 3 Towns (Base ₹25, ₹10/km)</option>
            </select>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Rider Pickup Fee (₹)
            </label>
            <p className="text-[11px] text-slate-500">
              Restaurant parcel pickup collection fee.
            </p>
            <input
              type="number"
              min="5"
              max="100"
              value={settings.riderPickupFeeInr ?? 20}
              onChange={(e) => {
                const p = Math.max(0, Number(e.target.value) || 0);
                setSettings((prev) => ({
                  ...prev,
                  riderPickupFeeInr: p,
                  riderBasePayoutInr: p + (prev.riderDropFeeInr ?? 15),
                }));
              }}
              className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white text-slate-900"
            />
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Rider Drop Fee (₹)
            </label>
            <p className="text-[11px] text-slate-500">
              Customer doorstep delivery completion fee.
            </p>
            <input
              type="number"
              min="5"
              max="100"
              value={settings.riderDropFeeInr ?? 15}
              onChange={(e) => {
                const d = Math.max(0, Number(e.target.value) || 0);
                setSettings((prev) => ({
                  ...prev,
                  riderDropFeeInr: d,
                  riderBasePayoutInr: (prev.riderPickupFeeInr ?? 20) + d,
                }));
              }}
              className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white text-slate-900"
            />
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Rider Base Pay per Order (₹)
            </label>
            <p className="text-[11px] text-slate-500">
              Minimum guaranteed base fare floor (Pickup + Drop).
            </p>
            <input
              type="number"
              min="10"
              max="200"
              value={settings.riderBasePayoutInr}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  riderBasePayoutInr: Math.max(10, Number(e.target.value) || 10),
                }))
              }
              className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white text-slate-900"
            />
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Distance Rate beyond 2km (₹/km)
            </label>
            <p className="text-[11px] text-slate-500">
              Dominant Legacy Aggregator distance rate bracket: ₹10 - ₹14/km.
            </p>
            <input
              type="number"
              min="10"
              max="14"
              step="0.5"
              value={settings.perKmRateInr}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  perKmRateInr: Math.min(14, Math.max(10, Number(e.target.value) || 10)),
                }))
              }
              className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white text-slate-900"
            />
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Kitchen Wait Pay Rate (₹/min)
            </label>
            <p className="text-[11px] text-slate-500">
              Paid to rider after {settings.riderFreeWaitMinutes} mins grace period.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="20"
                step="0.25"
                value={settings.riderWaitPayPerMinInr}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    riderWaitPayPerMinInr: Math.max(0, Number(e.target.value) || 0),
                  }))
                }
                className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white text-slate-900"
              />
              <span className="text-xs font-mono text-slate-500 shrink-0">₹/min</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Kitchen Wait Grace Period (mins)
            </label>
            <p className="text-[11px] text-slate-500">
              Free wait minutes before wait pay accrues (default 6 mins).
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="30"
                step="1"
                value={settings.riderFreeWaitMinutes}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    riderFreeWaitMinutes: Math.max(0, Number(e.target.value) || 0),
                  }))
                }
                className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white text-slate-900"
              />
              <span className="text-xs font-mono text-slate-500 shrink-0">mins</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Rain Surge Bonus (₹)
            </label>
            <p className="text-[11px] text-slate-500">
              Flat rain surge bonus per delivery (₹10 - ₹45).
            </p>
            <input
              type="number"
              min="10"
              max="45"
              step="5"
              value={settings.riderRainSurgeBonusInr ?? 25}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  riderRainSurgeBonusInr: Math.min(45, Math.max(10, Number(e.target.value) || 10)),
                }))
              }
              className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white text-slate-900"
            />
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Free Delivery Minimum Order (₹)
              </label>
              <input
                type="checkbox"
                checked={settings.enableFreeDeliveryThreshold}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    enableFreeDeliveryThreshold: e.target.checked,
                  }))
                }
                className="rounded accent-emerald-600 h-4 w-4"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Orders above this amount get free delivery automatically.
            </p>
            <input
              type="number"
              min="99"
              max="2000"
              step="10"
              disabled={!settings.enableFreeDeliveryThreshold}
              value={settings.freeDeliveryMinOrderInr}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  freeDeliveryMinOrderInr: Math.max(0, Number(e.target.value) || 0),
                }))
              }
              className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white text-slate-900 disabled:opacity-50"
            />
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Max Orders per Rider Trip
            </label>
            <p className="text-[11px] text-slate-500">
              How many orders a single rider can carry at the same time.
            </p>
            <select
              value={settings.maxBatchOrdersPerRider}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  maxBatchOrdersPerRider: Number(e.target.value),
                }))
              }
              className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-900"
            >
              <option value={1}>1 Order only (Fastest direct delivery)</option>
              <option value={2}>Up to 2 Orders (Standard batching)</option>
              <option value={3}>Up to 3 Orders (Busy hour batching)</option>
            </select>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Bad Weather Extra Time (mins)
            </label>
            <p className="text-[11px] text-slate-500">
              Extra minutes added to customer delivery ETA during rain.
            </p>
            <input
              type="number"
              min="0"
              max="45"
              value={settings.weatherDelayBufferMinutes}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  weatherDelayBufferMinutes: Math.max(0, Number(e.target.value) || 0),
                }))
              }
              className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white text-slate-900"
            />
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800">Auto-Assign Nearest Rider</div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Automatically sends new orders to the closest available rider.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoAssignNearestRider}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    autoAssignNearestRider: e.target.checked,
                  }))
                }
                className="rounded accent-emerald-600 h-4 w-4"
              />
              <span className="text-xs font-bold text-emerald-700">
                {settings.autoAssignNearestRider ? "Enabled (Automatic)" : "Disabled (Manual)"}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Simple Live Order Example Preview */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-800 mb-3">
          <Truck className="h-4 w-4 text-emerald-600" />
          How These Rules Work on a Sample 3 km Order
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl bg-white p-3 border border-slate-200">
            <div className="text-[10px] font-bold uppercase text-slate-400">1. Distance Check</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              Up to {settings.maxDeliveryRadiusKm} km allowed
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Orders beyond {settings.maxDeliveryRadiusKm} km are blocked at checkout.
            </div>
          </div>

          <div className="rounded-xl bg-white p-3 border border-slate-200">
            <div className="text-[10px] font-bold uppercase text-slate-400">
              2. Normal 3 km Fee
            </div>
            <div className="text-sm font-bold text-emerald-700 mt-0.5">
              ₹{sampleMath.customerDeliveryFee}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              ₹{settings.baseDeliveryFeeInr} base + (3 km × ₹{settings.perKmRateInr}/km).
            </div>
          </div>

          <div className="rounded-xl bg-white p-3 border border-slate-200">
            <div className="text-[10px] font-bold uppercase text-slate-400">
              3. Max Busy-Hour Fee
            </div>
            <div className="text-sm font-bold text-amber-700 mt-0.5">
              ₹{sampleMath.maxBusyHourFee} ({settings.surgeMultiplierCap.toFixed(1)}x cap)
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Never exceeds {settings.surgeMultiplierCap.toFixed(1)}x even in peak rain.
            </div>
          </div>

          <div className="rounded-xl bg-white p-3 border border-slate-200">
            <div className="text-[10px] font-bold uppercase text-slate-400">
              4. Rider Pay (10m Wait)
            </div>
            <div className="text-sm font-bold text-purple-700 mt-0.5">
              ₹{sampleMath.riderPayFor10MinWait}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              ₹{settings.riderBasePayoutInr} base + wait pay at ₹{settings.riderWaitPayPerMinInr}/min.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
