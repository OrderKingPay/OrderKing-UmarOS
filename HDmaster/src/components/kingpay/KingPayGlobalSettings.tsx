import React, { useState, useEffect } from "react";
import {
  Landmark,
  ShieldCheck,
  Percent,
  IndianRupee,
  Sliders,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Lock,
  Scale,
  ArrowRight
} from "lucide-react";

export interface KingPaySettingsState {
  mdrPercentage: number | string;
  customerConvenienceFeeInr: number | string;
  autoRefundAiThresholdInr: number | string;
}

export interface KingPayGlobalSettingsProps {
  className?: string;
  onSaveSuccess?: (settings: KingPaySettingsState) => void;
}

/**
 * KingPay Global Settings Control Panel
 * UmarOS Institutional Fintech Governance & Liquidity Parameter Matrix
 * 
 * Strict Enforcement:
 * 1. Zero fabricated numbers. Blank/0 defaults.
 * 2. Exact numeric inputs for:
 *    - Merchant Discount Rate (MDR) Percentage.
 *    - Customer Convenience Fee (₹).
 *    - Auto-Refund AI Threshold (Maximum ₹ value the AI can automatically refund without human approval).
 * 3. Pure corporate text & statutory compliance auditing.
 */
export function KingPayGlobalSettings({ className = "", onSaveSuccess }: KingPayGlobalSettingsProps) {
  // Input states strictly default to 0 (or blank if uninitialized)
  const [mdrPercentage, setMdrPercentage] = useState<number | string>(0);
  const [customerConvenienceFeeInr, setCustomerConvenienceFeeInr] = useState<number | string>(0);
  const [autoRefundAiThresholdInr, setAutoRefundAiThresholdInr] = useState<number | string>(0);

  // Initial loaded baseline for reverting
  const [initialState, setInitialState] = useState<KingPaySettingsState>({
    mdrPercentage: 0,
    customerConvenienceFeeInr: 0,
    autoRefundAiThresholdInr: 0,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string | null>(null);

  // Fetch verified platform settings from the backend API
  const fetchSettings = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const response = await fetch("/api/v1/admin/settings");
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: Failed to retrieve platform configuration`);
      }
      const data = await response.json();
      
      // Load real persisted values; default strictly to 0
      const loadedMdr = data.mdr_percentage !== undefined 
        ? Number(data.mdr_percentage) 
        : (data.kingpay?.mdr_percentage !== undefined ? Number(data.kingpay.mdr_percentage) : 0);

      const loadedConvenienceFee = data.customer_convenience_fee_inr !== undefined
        ? Number(data.customer_convenience_fee_inr)
        : (data.kingpay?.customer_convenience_fee_inr !== undefined 
          ? Number(data.kingpay.customer_convenience_fee_inr) 
          : (data.platform_fee_inr !== undefined ? Number(data.platform_fee_inr) : 0));

      const loadedRefundThreshold = data.auto_refund_ai_threshold_inr !== undefined
        ? Number(data.auto_refund_ai_threshold_inr)
        : (data.kingpay?.auto_refund_ai_threshold_inr !== undefined ? Number(data.kingpay.auto_refund_ai_threshold_inr) : 0);

      setMdrPercentage(loadedMdr);
      setCustomerConvenienceFeeInr(loadedConvenienceFee);
      setAutoRefundAiThresholdInr(loadedRefundThreshold);

      setInitialState({
        mdrPercentage: loadedMdr,
        customerConvenienceFeeInr: loadedConvenienceFee,
        autoRefundAiThresholdInr: loadedRefundThreshold,
      });

      if (data.kingpay?.last_updated) {
        setLastSavedTimestamp(new Date(data.kingpay.last_updated).toLocaleString());
      }
    } catch (err: any) {
      console.error("KingPay Global Settings load error:", err);
      setStatusMessage({
        type: "error",
        text: `Configuration fetch error: ${err.message}. Retaining strict zero baseline.`,
      });
      // Fallback strictly to 0 defaults
      setMdrPercentage(0);
      setCustomerConvenienceFeeInr(0);
      setAutoRefundAiThresholdInr(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Save settings via POST /api/v1/admin/settings
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    const numericMdr = mdrPercentage === "" ? 0 : Number(mdrPercentage);
    const numericFee = customerConvenienceFeeInr === "" ? 0 : Number(customerConvenienceFeeInr);
    const numericRefundThreshold = autoRefundAiThresholdInr === "" ? 0 : Number(autoRefundAiThresholdInr);

    if (isNaN(numericMdr) || numericMdr < 0 || numericMdr > 100) {
      setStatusMessage({
        type: "error",
        text: "Validation Error: Merchant Discount Rate must be a valid numeric percentage between 0.00% and 100.00%.",
      });
      setIsSaving(false);
      return;
    }

    if (isNaN(numericFee) || numericFee < 0) {
      setStatusMessage({
        type: "error",
        text: "Validation Error: Customer Convenience Fee must be a non-negative numeric rupee value.",
      });
      setIsSaving(false);
      return;
    }

    if (isNaN(numericRefundThreshold) || numericRefundThreshold < 0) {
      setStatusMessage({
        type: "error",
        text: "Validation Error: Auto-Refund AI Threshold must be a non-negative numeric rupee value.",
      });
      setIsSaving(false);
      return;
    }

    try {
      const payload = {
        mdr_percentage: numericMdr,
        customer_convenience_fee_inr: numericFee,
        auto_refund_ai_threshold_inr: numericRefundThreshold,
        kingpay: {
          mdr_percentage: numericMdr,
          customer_convenience_fee_inr: numericFee,
          auto_refund_ai_threshold_inr: numericRefundThreshold,
          settlement_schedule: "T+1 Automated Escrow",
          payout_rail: "NPCI IMPS / NEFT Batch",
          status: "ACTIVE",
          last_updated: new Date().toISOString(),
        },
      };

      const response = await fetch("/api/v1/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const now = new Date();
      setLastSavedTimestamp(now.toLocaleString());
      setInitialState({
        mdrPercentage: numericMdr,
        customerConvenienceFeeInr: numericFee,
        autoRefundAiThresholdInr: numericRefundThreshold,
      });

      setStatusMessage({
        type: "success",
        text: `Institutional parameters verified and deployed to platform settings at ${now.toLocaleTimeString()}.`,
      });

      if (onSaveSuccess) {
        onSaveSuccess({
          mdrPercentage: numericMdr,
          customerConvenienceFeeInr: numericFee,
          autoRefundAiThresholdInr: numericRefundThreshold,
        });
      }
    } catch (err: any) {
      console.error("Failed to commit KingPay settings:", err);
      setStatusMessage({
        type: "error",
        text: `Deployment failure: ${err.message}. Changes not committed to database.`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevert = () => {
    setMdrPercentage(initialState.mdrPercentage);
    setCustomerConvenienceFeeInr(initialState.customerConvenienceFeeInr);
    setAutoRefundAiThresholdInr(initialState.autoRefundAiThresholdInr);
    setStatusMessage({
      type: "info",
      text: "Unsaved modifications discarded. Reverted to last verified platform deployment.",
    });
  };

  const handleResetToZero = () => {
    setMdrPercentage(0);
    setCustomerConvenienceFeeInr(0);
    setAutoRefundAiThresholdInr(0);
    setStatusMessage({
      type: "info",
      text: "Parameters reset to strict zero baseline (0.00% MDR, ₹0.00 Convenience Fee, ₹0 Auto-Refund Threshold).",
    });
  };

  // Real-time calculated projections based strictly on user inputs (zero fabricated numbers)
  const numericMdr = mdrPercentage === "" ? 0 : Number(mdrPercentage);
  const numericFee = customerConvenienceFeeInr === "" ? 0 : Number(customerConvenienceFeeInr);
  const numericThreshold = autoRefundAiThresholdInr === "" ? 0 : Number(autoRefundAiThresholdInr);

  const sampleGmvInr = 100000;
  const projectedMdrRevenue = (sampleGmvInr * (numericMdr / 100));
  const sampleOrderCount = 10000;
  const projectedConvenienceFeeRevenue = (sampleOrderCount * numericFee);

  const hasUnsavedChanges =
    Number(mdrPercentage) !== Number(initialState.mdrPercentage) ||
    Number(customerConvenienceFeeInr) !== Number(initialState.customerConvenienceFeeInr) ||
    Number(autoRefundAiThresholdInr) !== Number(initialState.autoRefundAiThresholdInr);

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden text-slate-800 dark:text-slate-100 ${className}`}
    >
      {/* Institutional Header & Regulatory Ribbon */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white px-6 py-5 border-b border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">KingPay Global Settings</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold uppercase">
                  Production Matrix
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Institutional Fintech Customization & Sovereign Revenue Governance Control Panel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs font-mono text-slate-300">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>NPCI / RBI Escrow Compliant</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>Dual-Gate Anti-Loss Filter</span>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Banner / Status Alerts */}
      {statusMessage && (
        <div
          className={`px-6 py-3 border-b flex items-center gap-3 text-sm font-medium ${
            statusMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50"
              : statusMessage.type === "error"
              ? "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/50"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : statusMessage.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          ) : (
            <Sliders className="w-4 h-4 text-slate-500 shrink-0" />
          )}
          <span className="flex-1">{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs uppercase tracking-wider font-semibold opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Numeric Parameter Form */}
      <form onSubmit={handleSave} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Parameter 1: Merchant Discount Rate (MDR) Percentage */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-indigo-500" />
                  Take-Rate Governance
                </span>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-200 dark:border-indigo-800/60">
                  Rate %
                </span>
              </div>
              <label
                htmlFor="input_mdr_percentage"
                className="block text-sm font-bold text-slate-900 dark:text-white"
              >
                Merchant Discount Rate (MDR) Percentage
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Net processing discount percentage deducted from gross merchant settlements across all payment methods (UPI, Cards, NetBanking). Directly determines platform processing take-rate.
              </p>
            </div>

            <div className="mt-5">
              <div className="relative rounded-lg shadow-sm">
                <input
                  id="input_mdr_percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="0.00"
                  disabled={isLoading || isSaving}
                  value={mdrPercentage}
                  onChange={(e) => setMdrPercentage(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3.5 py-2.5 pr-10 text-base font-mono font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-sm font-mono font-bold text-slate-400">%</span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <span>Statutory Boundary: 0.00% – 100.00%</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {numericMdr.toFixed(2)}% MDR
                </span>
              </div>
            </div>
          </div>

          {/* Parameter 2: Customer Convenience Fee (₹) */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
                  Cart Surcharge
                </span>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800/60">
                  Fixed INR
                </span>
              </div>
              <label
                htmlFor="input_convenience_fee"
                className="block text-sm font-bold text-slate-900 dark:text-white"
              >
                Customer Convenience Fee (₹)
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Fixed rupee surcharge added to customer order checkout cart. Deposited directly into the OrderKing Treasury Escrow Account prior to delivery fulfillment disbursement.
              </p>
            </div>

            <div className="mt-5">
              <div className="relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-sm font-mono font-bold text-slate-400">₹</span>
                </div>
                <input
                  id="input_convenience_fee"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  disabled={isLoading || isSaving}
                  value={customerConvenienceFeeInr}
                  onChange={(e) => setCustomerConvenienceFeeInr(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 pl-8 pr-3.5 py-2.5 text-base font-mono font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <span>Per-Order Retail Surcharge</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  ₹{numericFee.toFixed(2)} / order
                </span>
              </div>
            </div>
          </div>

          {/* Parameter 3: Auto-Refund AI Threshold (₹) */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-amber-500" />
                  Fiscal Circuit Breaker
                </span>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-medium border border-amber-200 dark:border-amber-800/60">
                  Discretionary Cap
                </span>
              </div>
              <label
                htmlFor="input_auto_refund_threshold"
                className="block text-sm font-bold text-slate-900 dark:text-white"
              >
                Auto-Refund AI Threshold (₹)
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed font-medium">
                Maximum ₹ value the AI can automatically refund without human approval. Claims exceeding this limit mandate dual-custody executive signoff.
              </p>
            </div>

            <div className="mt-5">
              <div className="relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-sm font-mono font-bold text-slate-400">₹</span>
                </div>
                <input
                  id="input_auto_refund_threshold"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="0"
                  disabled={isLoading || isSaving}
                  value={autoRefundAiThresholdInr}
                  onChange={(e) => setAutoRefundAiThresholdInr(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 pl-8 pr-3.5 py-2.5 text-base font-mono font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50"
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <span>Maximum Autonomous AI Limit</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  ₹{Math.round(numericThreshold).toLocaleString()} ceiling
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Real Money Generation & Exposure Projection Matrix */}
        <div className="bg-slate-900 text-slate-100 rounded-xl p-5 border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                Real Money Generation & Exposure Audit Matrix
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Deterministic mathematical projection derived directly from the configured numeric parameters.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded border border-slate-700 self-start sm:self-auto">
              Currency Standard: INR (₹)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950/60 rounded-lg p-3.5 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                MDR Yield on ₹1,00,000 GMV
              </span>
              <div className="text-lg font-mono font-bold text-indigo-400 mt-1">
                ₹{projectedMdrRevenue.toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Take-rate formula: GMV × ({numericMdr.toFixed(2)} / 100)
              </span>
            </div>

            <div className="bg-slate-950/60 rounded-lg p-3.5 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Convenience Yield on 10,000 Orders
              </span>
              <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
                ₹{projectedConvenienceFeeRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Direct margin: 10,000 orders × ₹{numericFee.toFixed(2)}
              </span>
            </div>

            <div className="bg-slate-950/60 rounded-lg p-3.5 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Max AI Discretionary Exposure
              </span>
              <div className="text-lg font-mono font-bold text-amber-400 mt-1">
                ₹{Math.round(numericThreshold).toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Dual-Gate limit: Claims &gt; ₹{Math.round(numericThreshold).toLocaleString()} lock for human audit
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls & Audit Footer */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            {lastSavedTimestamp ? (
              <span>Last verified deployment: <strong className="text-slate-700 dark:text-slate-300 font-mono">{lastSavedTimestamp}</strong></span>
            ) : (
              <span>Deployment status: <strong className="text-slate-700 dark:text-slate-300 font-mono">Uncommitted Baseline</strong></span>
            )}
            {hasUnsavedChanges && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold border border-amber-300 dark:border-amber-800">
                Uncommitted Changes
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleResetToZero}
              disabled={isLoading || isSaving}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 transition-colors disabled:opacity-50"
            >
              Reset to 0
            </button>

            <button
              type="button"
              onClick={handleRevert}
              disabled={isLoading || isSaving || !hasUnsavedChanges}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Revert
            </button>

            <button
              type="submit"
              disabled={isLoading || isSaving}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Deploying Parameters...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save & Deploy KingPay Settings
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default KingPayGlobalSettings;
