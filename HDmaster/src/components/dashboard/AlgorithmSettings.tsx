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
  Info,
  Database,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  ShieldCheck,
  Activity,
  Calculator,
} from "lucide-react";

interface AlgorithmSettingsProps {
  /** Optional callback after saving */
  onSaveSuccess?: (settings: AlgorithmSettingsConfig) => void;
  /** Compact embedded mode (e.g. within EcosystemCMS) */
  compact?: boolean;
}

export function AlgorithmSettings({ onSaveSuccess, compact = false }: AlgorithmSettingsProps) {
  // Current edited values
  const [settings, setSettings] = useState<AlgorithmSettingsConfig>(DEFAULT_ALGORITHM_SETTINGS);
  // Last saved values from database
  const [savedSettings, setSavedSettings] = useState<AlgorithmSettingsConfig>(DEFAULT_ALGORITHM_SETTINGS);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load from backend
  const loadSettings = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      // 1. Try server function
      const res = await loadAlgorithmSettingsFn();
      if (res && res.ok && res.data) {
        setSettings(res.data);
        setSavedSettings(res.data);
        setLoading(false);
        return;
      }

      // 2. Fallback to REST API
      const apiRes = await fetch("/api/v1/admin/settings");
      if (apiRes.ok) {
        const json = await apiRes.json();
        if (json.algorithm) {
          const loaded: AlgorithmSettingsConfig = {
            maxDeliveryRadiusKm: Number(json.algorithm.maxDeliveryRadiusKm) || DEFAULT_ALGORITHM_SETTINGS.maxDeliveryRadiusKm,
            baseDeliveryFeeInr: Number(json.algorithm.baseDeliveryFeeInr) || DEFAULT_ALGORITHM_SETTINGS.baseDeliveryFeeInr,
            surgeMultiplierCap: Number(json.algorithm.surgeMultiplierCap) || DEFAULT_ALGORITHM_SETTINGS.surgeMultiplierCap,
            kitchenPrepBufferMinutes: Number(json.algorithm.kitchenPrepBufferMinutes) || DEFAULT_ALGORITHM_SETTINGS.kitchenPrepBufferMinutes,
          };
          setSettings(loaded);
          setSavedSettings(loaded);
        }
      }
    } catch (err) {
      console.error("Failed to load algorithm settings:", err);
      setErrorMessage("Unable to sync live engine parameters. Using local baseline fallback.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Track if changes have been made
  const hasChanges = useMemo(() => {
    return (
      settings.maxDeliveryRadiusKm !== savedSettings.maxDeliveryRadiusKm ||
      settings.baseDeliveryFeeInr !== savedSettings.baseDeliveryFeeInr ||
      settings.surgeMultiplierCap !== savedSettings.surgeMultiplierCap ||
      settings.kitchenPrepBufferMinutes !== savedSettings.kitchenPrepBufferMinutes
    );
  }, [settings, savedSettings]);

  // Save to database
  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    setErrorMessage(null);

    try {
      // 1. Save via server function
      const res = await saveAlgorithmSettingsFn({ data: { algorithm: settings } });
      if (res && res.ok && res.data) {
        setSavedSettings(res.data);
        setSettings(res.data);
        setSaveMessage(`Algorithmic matrix updated in PostgreSQL platform_settings at ${new Date().toLocaleTimeString()}`);
        onSaveSuccess?.(res.data);
        setTimeout(() => setSaveMessage(null), 5000);
        return;
      }

      // 2. Fallback to direct REST API
      const apiRes = await fetch("/api/v1/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer dev_founder_secret",
        },
        body: JSON.stringify({
          algorithm: settings,
          max_delivery_radius_km: settings.maxDeliveryRadiusKm,
          base_delivery_fee_inr: settings.baseDeliveryFeeInr,
          surge_multiplier_cap: settings.surgeMultiplierCap,
          kitchen_prep_buffer_mins: settings.kitchenPrepBufferMinutes,
        }),
      });

      if (!apiRes.ok) {
        const errorJson = await apiRes.json().catch(() => ({}));
        throw new Error(errorJson.error || `HTTP ${apiRes.status}`);
      }

      setSavedSettings(settings);
      setSaveMessage(`Algorithmic matrix published to engine core at ${new Date().toLocaleTimeString()}`);
      onSaveSuccess?.(settings);
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (err) {
      console.error("Failed to save algorithm settings:", err);
      setErrorMessage(`Persistence failure: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToSaved = () => {
    setSettings(savedSettings);
    setErrorMessage(null);
  };

  const handleRestoreDefaults = () => {
    setSettings(DEFAULT_ALGORITHM_SETTINGS);
  };

  // Operational Math Derivations (Live telemetry model)
  const mathDerivations = useMemo(() => {
    const r = settings.maxDeliveryRadiusKm;
    const baseFee = settings.baseDeliveryFeeInr;
    const cap = settings.surgeMultiplierCap;
    const buffer = settings.kitchenPrepBufferMinutes;

    // Serviceable geographic circular envelope
    const coverageAreaSqKm = Math.PI * r * r;
    // Estimated max transit duration at 28 km/h average speed in urban/semi-urban terrain
    const maxTransitMins = Math.round((r / 28) * 60);
    // Baseline rider payment floor in OrderKing (₹25.00)
    const riderFloor = 25.0;
    // Platform base margin per delivery
    const netBaseMargin = baseFee - riderFloor;
    // Peak surge tariff ceiling on base component
    const peakSurgeTariff = baseFee * cap;
    // Rider dispatch offset (time before food ready to emit dispatch ticket)
    const dispatchTicketOffset = Math.max(0, buffer - 8);

    return {
      coverageAreaSqKm: coverageAreaSqKm.toFixed(1),
      maxTransitMins,
      riderFloor: riderFloor.toFixed(2),
      netBaseMargin: netBaseMargin.toFixed(2),
      peakSurgeTariff: peakSurgeTariff.toFixed(2),
      dispatchTicketOffset,
    };
  }, [settings]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-slate-400">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 animate-spin text-emerald-400" />
          <span className="font-mono text-sm tracking-wide">CONNECTING TO OPERATIONAL MATH ENGINE...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Matrix Header & Governance Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-mono font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                UMAROS ENGINE CORE
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-0.5 text-xs font-mono text-slate-300">
                DISPATCH & TARIFF MATRIX
              </span>
              {hasChanges && (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-mono text-amber-400">
                  UNSAVED EDITS
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-emerald-400" />
              Algorithmic Settings Matrix
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Deterministic parameters governing OrderKing autonomous rider dispatch, surge limits, delivery boundaries, and prep synchronization.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleRestoreDefaults}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-mono text-slate-300 hover:bg-slate-700 hover:text-white transition"
              title="Reset parameters to factory standard defaults"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Defaults
            </button>

            {hasChanges && (
              <button
                type="button"
                onClick={handleResetToSaved}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-mono text-slate-300 hover:bg-slate-700 hover:text-white transition"
                title="Discard unsaved changes and revert to database values"
              >
                Revert
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-mono font-semibold transition shadow-lg ${
                hasChanges
                  ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20 cursor-pointer"
                  : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
              }`}
            >
              {saving ? (
                <>
                  <Activity className="h-3.5 w-3.5 animate-spin" />
                  PERSISTING...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  PUBLISH MATRIX
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feedback Notifications */}
        {saveMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-mono text-emerald-400 animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{saveMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-mono text-rose-400 animate-fadeIn">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* The 4 Exact Sliders Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* SLIDER 1: Maximum Delivery Radius (km) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg hover:border-slate-700 transition">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-blue-500/10 p-1.5 text-blue-400 border border-blue-500/20">
                  <Compass className="h-4 w-4" />
                </div>
                <h3 className="font-mono text-sm font-semibold text-white">
                  Maximum Delivery Radius (km)
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Hard spatial perimeter envelope for restaurant discovery and autonomous rider routing.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-right">
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
                  className="w-16 bg-transparent text-right font-mono text-base font-bold text-blue-400 focus:outline-none"
                />
                <span className="ml-1 font-mono text-xs text-blue-400/80">km</span>
              </div>
            </div>
          </div>

          {/* Interactive Range Slider */}
          <div className="mt-6 space-y-2">
            <input
              type="range"
              min="1.0"
              max="50.0"
              step="0.5"
              value={settings.maxDeliveryRadiusKm}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setSettings((prev) => ({ ...prev, maxDeliveryRadiusKm: val }));
              }}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-blue-500 focus:outline-none"
            />
            <div className="flex justify-between font-mono text-[10px] text-slate-500">
              <span>1.0 km (Urban Core)</span>
              <span>15.0 km</span>
              <span>25.0 km (Default)</span>
              <span>50.0 km (Regional Max)</span>
            </div>
          </div>

          {/* Presets & Impact Model */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
              <span className="text-slate-500">Presets:</span>
              {[5, 12, 25, 35].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSettings((prev) => ({ ...prev, maxDeliveryRadiusKm: preset }))}
                  className={`rounded px-1.5 py-0.5 border text-[10px] transition ${
                    settings.maxDeliveryRadiusKm === preset
                      ? "border-blue-500/50 bg-blue-500/20 text-blue-300"
                      : "border-slate-800 bg-slate-800/50 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {preset}km
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="text-slate-400">
                Area: <strong className="text-slate-200">{mathDerivations.coverageAreaSqKm} km²</strong>
              </span>
              <span className="text-slate-400">
                Max ETA: <strong className="text-slate-200">~{mathDerivations.maxTransitMins}m</strong>
              </span>
            </div>
          </div>
        </div>

        {/* SLIDER 2: Base Delivery Fee (₹) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg hover:border-slate-700 transition">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-emerald-500/10 p-1.5 text-emerald-400 border border-emerald-500/20">
                  <Calculator className="h-4 w-4" />
                </div>
                <h3 className="font-mono text-sm font-semibold text-white">
                  Base Delivery Fee (₹)
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Fixed entry tariff billed to consumer prior to per-kilometer distance tiers.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-right">
                <span className="mr-0.5 font-mono text-sm text-emerald-400">₹</span>
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
                  className="w-14 bg-transparent text-right font-mono text-base font-bold text-emerald-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Interactive Range Slider */}
          <div className="mt-6 space-y-2">
            <input
              type="range"
              min="0"
              max="150"
              step="1"
              value={settings.baseDeliveryFeeInr}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setSettings((prev) => ({ ...prev, baseDeliveryFeeInr: val }));
              }}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-emerald-500 focus:outline-none"
            />
            <div className="flex justify-between font-mono text-[10px] text-slate-500">
              <span>₹0 (Zero Base)</span>
              <span>₹25 (Floor)</span>
              <span>₹35 (Standard)</span>
              <span>₹150 (Premium)</span>
            </div>
          </div>

          {/* Presets & Impact Model */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
              <span className="text-slate-500">Presets:</span>
              {[0, 25, 35, 50, 75].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSettings((prev) => ({ ...prev, baseDeliveryFeeInr: preset }))}
                  className={`rounded px-1.5 py-0.5 border text-[10px] transition ${
                    settings.baseDeliveryFeeInr === preset
                      ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                      : "border-slate-800 bg-slate-800/50 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  ₹{preset}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="text-slate-400">
                Paise: <strong className="text-slate-200">{Math.round(settings.baseDeliveryFeeInr * 100)}p</strong>
              </span>
              <span className="text-slate-400">
                Margin vs Rider Base: <strong className={parseFloat(mathDerivations.netBaseMargin) >= 0 ? "text-emerald-400" : "text-rose-400"}>
                  {parseFloat(mathDerivations.netBaseMargin) >= 0 ? `+₹${mathDerivations.netBaseMargin}` : `₹${mathDerivations.netBaseMargin}`}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* SLIDER 3: Surge Multiplier Cap (1.0x - 3.0x) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg hover:border-slate-700 transition">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-amber-500/10 p-1.5 text-amber-400 border border-amber-500/20">
                  <Zap className="h-4 w-4" />
                </div>
                <h3 className="font-mono text-sm font-semibold text-white">
                  Surge Multiplier Cap (1.0x - 3.0x)
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Asymptotic upper bound limit for dynamic demand surge throttling during peak demand.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-right">
                <input
                  type="number"
                  min="1.0"
                  max="3.0"
                  step="0.1"
                  value={settings.surgeMultiplierCap}
                  onChange={(e) => {
                    const val = Math.min(3.0, Math.max(1.0, parseFloat(e.target.value) || 1.0));
                    setSettings((prev) => ({ ...prev, surgeMultiplierCap: Math.round(val * 10) / 10 }));
                  }}
                  className="w-14 bg-transparent text-right font-mono text-base font-bold text-amber-400 focus:outline-none"
                />
                <span className="ml-0.5 font-mono text-xs text-amber-400">x</span>
              </div>
            </div>
          </div>

          {/* Interactive Range Slider */}
          <div className="mt-6 space-y-2">
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.1"
              value={settings.surgeMultiplierCap}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setSettings((prev) => ({ ...prev, surgeMultiplierCap: Math.round(val * 10) / 10 }));
              }}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-amber-500 focus:outline-none"
            />
            <div className="flex justify-between font-mono text-[10px] text-slate-500">
              <span>1.0x (No Surge)</span>
              <span>1.5x (Moderate)</span>
              <span>2.0x (Standard Cap)</span>
              <span>3.0x (Peak Storm Ceiling)</span>
            </div>
          </div>

          {/* Presets & Impact Model */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
              <span className="text-slate-500">Presets:</span>
              {[1.0, 1.3, 1.5, 2.0, 2.5, 3.0].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSettings((prev) => ({ ...prev, surgeMultiplierCap: preset }))}
                  className={`rounded px-1.5 py-0.5 border text-[10px] transition ${
                    settings.surgeMultiplierCap === preset
                      ? "border-amber-500/50 bg-amber-500/20 text-amber-300"
                      : "border-slate-800 bg-slate-800/50 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {preset.toFixed(1)}x
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="text-slate-400">
                Peak Base Fee: <strong className="text-amber-300">₹{mathDerivations.peakSurgeTariff}</strong>
              </span>
              <span className="text-slate-400">
                Elasticity: <strong className="text-slate-200">+{Math.round((settings.surgeMultiplierCap - 1) * 100)}%</strong>
              </span>
            </div>
          </div>
        </div>

        {/* SLIDER 4: Average Kitchen Prep Time Buffer (minutes) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg hover:border-slate-700 transition">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-purple-500/10 p-1.5 text-purple-400 border border-purple-500/20">
                  <Clock className="h-4 w-4" />
                </div>
                <h3 className="font-mono text-sm font-semibold text-white">
                  Average Kitchen Prep Time Buffer (minutes)
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Temporal dispatch window offset synchronizing rider pickup ETA with food readiness.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-right">
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
                  className="w-14 bg-transparent text-right font-mono text-base font-bold text-purple-400 focus:outline-none"
                />
                <span className="ml-1 font-mono text-xs text-purple-400/80">min</span>
              </div>
            </div>
          </div>

          {/* Interactive Range Slider */}
          <div className="mt-6 space-y-2">
            <input
              type="range"
              min="5"
              max="60"
              step="1"
              value={settings.kitchenPrepBufferMinutes}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setSettings((prev) => ({ ...prev, kitchenPrepBufferMinutes: val }));
              }}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-purple-500 focus:outline-none"
            />
            <div className="flex justify-between font-mono text-[10px] text-slate-500">
              <span>5 min (QSR Express)</span>
              <span>15 min (Standard)</span>
              <span>30 min (Gourmet)</span>
              <span>60 min (Banquet Max)</span>
            </div>
          </div>

          {/* Presets & Impact Model */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
              <span className="text-slate-500">Presets:</span>
              {[8, 12, 15, 20, 25, 35].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSettings((prev) => ({ ...prev, kitchenPrepBufferMinutes: preset }))}
                  className={`rounded px-1.5 py-0.5 border text-[10px] transition ${
                    settings.kitchenPrepBufferMinutes === preset
                      ? "border-purple-500/50 bg-purple-500/20 text-purple-300"
                      : "border-slate-800 bg-slate-800/50 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {preset}m
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="text-slate-400">
                Dispatch Offset: <strong className="text-slate-200">+{mathDerivations.dispatchTicketOffset}m</strong>
              </span>
              <span className="text-slate-400">
                Rider Idle Target: <strong className="text-emerald-400">&lt; 3.0m</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Math & Engine Equation Matrix (Pure Corporate UI) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <Cpu className="h-4 w-4 text-emerald-400" />
            OPERATIONAL LOGISTICS & TARIFF EXECUTION FORMULA
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Database className="h-3.5 w-3.5 text-slate-500" />
            TABLE: platform_settings (JSONB)
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-slate-300">
          <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800/80 space-y-1">
            <div className="text-[10px] text-slate-500">SPATIAL RADAR FILTER</div>
            <div className="text-slate-100 font-semibold">ST_DWithin(r, p, {settings.maxDeliveryRadiusKm * 1000}m)</div>
            <div className="text-[11px] text-slate-400">Orders beyond {settings.maxDeliveryRadiusKm}km rejected at checkout.</div>
          </div>

          <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800/80 space-y-1">
            <div className="text-[10px] text-slate-500">DELIVERY TARIFF T(d)</div>
            <div className="text-slate-100 font-semibold">₹{settings.baseDeliveryFeeInr} + (₹8.00 × d)</div>
            <div className="text-[11px] text-slate-400">Base fee floors customer quote. Distance increments per km.</div>
          </div>

          <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800/80 space-y-1">
            <div className="text-[10px] text-slate-500">DYNAMIC SURGE CLAMP</div>
            <div className="text-slate-100 font-semibold">min(S_real, {settings.surgeMultiplierCap.toFixed(1)}x)</div>
            <div className="text-[11px] text-slate-400">Tariff multiplier capped at {settings.surgeMultiplierCap.toFixed(1)}x maximum ceiling.</div>
          </div>

          <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800/80 space-y-1">
            <div className="text-[10px] text-slate-500">DISPATCH SYNCHRONIZATION</div>
            <div className="text-slate-100 font-semibold">|t_transit - {settings.kitchenPrepBufferMinutes}m| × 1.5</div>
            <div className="text-[11px] text-slate-400">Minimizes rider kitchen wait while avoiding cold food handoffs.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
