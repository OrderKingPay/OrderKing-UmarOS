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
  Calculator,
  Settings,
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

const STORAGE_KEY = "orderking_kingpay_settings";

export function KingPayGlobalSettings({
  className = "",
  onSaveSuccess,
}: KingPayGlobalSettingsProps) {
  // Core 3 settings (strictly default to 0 until loaded)
  const [mdrPercentage, setMdrPercentage] = useState<number | string>(0);
  const [customerConvenienceFeeInr, setCustomerConvenienceFeeInr] = useState<
    number | string
  >(0);
  const [autoRefundAiThresholdInr, setAutoRefundAiThresholdInr] = useState<
    number | string
  >(0);

  // Additional customizable King Pay settings
  const [payoutDay, setPayoutDay] = useState<string>("Daily (T+1)");
  const [walletCashbackPct, setWalletCashbackPct] = useState<number>(2);
  const [minPayoutInr, setMinPayoutInr] = useState<number>(100);
  const [tdsSec194OPct, setTdsSec194OPct] = useState<number>(0.1);
  const [feeGstPct, setFeeGstPct] = useState<number>(18);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState<boolean>(false);

  // Calculator (Test Your Rates) state
  const [testOrderCount, setTestOrderCount] = useState<number>(500);
  const [testOrderValueInr, setTestOrderValueInr] = useState<number>(400);

  // Initial loaded baseline for reverting
  const [initialState, setInitialState] = useState<KingPaySettingsState>({
    mdrPercentage: 0,
    customerConvenienceFeeInr: 0,
    autoRefundAiThresholdInr: 0,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string | null>(
    null
  );

  // Load settings from localStorage and /api/v1/admin/settings
  const fetchSettings = async () => {
    setIsLoading(true);
    setStatusMessage(null);

    // First check localStorage for saved customization
    let localLoaded = false;
    try {
      const savedRaw = localStorage.getItem(STORAGE_KEY);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (parsed.mdrPercentage !== undefined)
          setMdrPercentage(Number(parsed.mdrPercentage));
        if (parsed.customerConvenienceFeeInr !== undefined)
          setCustomerConvenienceFeeInr(Number(parsed.customerConvenienceFeeInr));
        if (parsed.autoRefundAiThresholdInr !== undefined)
          setAutoRefundAiThresholdInr(Number(parsed.autoRefundAiThresholdInr));
        if (parsed.payoutDay) setPayoutDay(parsed.payoutDay);
        if (parsed.walletCashbackPct !== undefined)
          setWalletCashbackPct(Number(parsed.walletCashbackPct));
        if (parsed.minPayoutInr !== undefined)
          setMinPayoutInr(Number(parsed.minPayoutInr));
        if (parsed.tdsSec194OPct !== undefined)
          setTdsSec194OPct(Number(parsed.tdsSec194OPct));
        if (parsed.feeGstPct !== undefined)
          setFeeGstPct(Number(parsed.feeGstPct));
        if (parsed.lastUpdated) setLastSavedTimestamp(parsed.lastUpdated);
        localLoaded = true;
      }
    } catch {
      // Ignore localStorage parse errors
    }

    try {
      const response = await fetch("/api/v1/admin/settings");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();

      const loadedMdr =
        data.mdr_percentage !== undefined
          ? Number(data.mdr_percentage)
          : data.kingpay?.mdr_percentage !== undefined
          ? Number(data.kingpay.mdr_percentage)
          : 0;

      const loadedConvenienceFee =
        data.customer_convenience_fee_inr !== undefined
          ? Number(data.customer_convenience_fee_inr)
          : data.kingpay?.customer_convenience_fee_inr !== undefined
          ? Number(data.kingpay.customer_convenience_fee_inr)
          : data.platform_fee_inr !== undefined
          ? Number(data.platform_fee_inr)
          : 0;

      const loadedRefundThreshold =
        data.auto_refund_ai_threshold_inr !== undefined
          ? Number(data.auto_refund_ai_threshold_inr)
          : data.kingpay?.auto_refund_ai_threshold_inr !== undefined
          ? Number(data.kingpay.auto_refund_ai_threshold_inr)
          : 0;

      setMdrPercentage(loadedMdr);
      setCustomerConvenienceFeeInr(loadedConvenienceFee);
      setAutoRefundAiThresholdInr(loadedRefundThreshold);

      if (data.kingpay?.payout_day) setPayoutDay(data.kingpay.payout_day);
      if (data.kingpay?.wallet_cashback_pct !== undefined)
        setWalletCashbackPct(Number(data.kingpay.wallet_cashback_pct));
      if (data.kingpay?.min_payout_inr !== undefined)
        setMinPayoutInr(Number(data.kingpay.min_payout_inr));

      setInitialState({
        mdrPercentage: loadedMdr,
        customerConvenienceFeeInr: loadedConvenienceFee,
        autoRefundAiThresholdInr: loadedRefundThreshold,
      });

      if (data.kingpay?.last_updated) {
        setLastSavedTimestamp(
          new Date(data.kingpay.last_updated).toLocaleString()
        );
      }
    } catch {
      if (!localLoaded) {
        setMdrPercentage(0);
        setCustomerConvenienceFeeInr(0);
        setAutoRefundAiThresholdInr(0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Save settings to localStorage + POST /api/v1/admin/settings
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    const numericMdr = mdrPercentage === "" ? 0 : Number(mdrPercentage);
    const numericFee =
      customerConvenienceFeeInr === "" ? 0 : Number(customerConvenienceFeeInr);
    const numericRefundThreshold =
      autoRefundAiThresholdInr === "" ? 0 : Number(autoRefundAiThresholdInr);

    if (isNaN(numericMdr) || numericMdr < 0 || numericMdr > 100) {
      setStatusMessage({
        type: "error",
        text: "Payment Fee (MDR %) must be a number between 0% and 100%.",
      });
      setIsSaving(false);
      return;
    }

    if (isNaN(numericFee) || numericFee < 0) {
      setStatusMessage({
        type: "error",
        text: "Customer Convenience Fee must be ₹0 or higher.",
      });
      setIsSaving(false);
      return;
    }

    if (isNaN(numericRefundThreshold) || numericRefundThreshold < 0) {
      setStatusMessage({
        type: "error",
        text: "Instant Refund Limit must be ₹0 or higher.",
      });
      setIsSaving(false);
      return;
    }

    const now = new Date();
    const formattedTime = now.toLocaleString();

    // Always persist to localStorage first
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          mdrPercentage: numericMdr,
          customerConvenienceFeeInr: numericFee,
          autoRefundAiThresholdInr: numericRefundThreshold,
          payoutDay,
          walletCashbackPct,
          minPayoutInr,
          tdsSec194OPct,
          feeGstPct,
          lastUpdated: formattedTime,
        })
      );
    } catch {
      // Ignore storage errors
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
          payout_day: payoutDay,
          wallet_cashback_pct: walletCashbackPct,
          min_payout_inr: minPayoutInr,
          tds_sec_194o_pct: tdsSec194OPct,
          fee_gst_pct: feeGstPct,
          settlement_schedule: payoutDay,
          payout_rail: "NPCI IMPS / NEFT",
          status: "ACTIVE",
          last_updated: now.toISOString(),
        },
      };

      const response = await fetch("/api/v1/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      setLastSavedTimestamp(formattedTime);
      setInitialState({
        mdrPercentage: numericMdr,
        customerConvenienceFeeInr: numericFee,
        autoRefundAiThresholdInr: numericRefundThreshold,
      });

      if (response.ok) {
        setStatusMessage({
          type: "success",
          text: `King Pay rules saved to database and local storage at ${now.toLocaleTimeString()}.`,
        });
      } else {
        setStatusMessage({
          type: "success",
          text: `King Pay rules saved locally on this device at ${now.toLocaleTimeString()}.`,
        });
      }

      if (onSaveSuccess) {
        onSaveSuccess({
          mdrPercentage: numericMdr,
          customerConvenienceFeeInr: numericFee,
          autoRefundAiThresholdInr: numericRefundThreshold,
        });
      }
    } catch {
      setLastSavedTimestamp(formattedTime);
      setInitialState({
        mdrPercentage: numericMdr,
        customerConvenienceFeeInr: numericFee,
        autoRefundAiThresholdInr: numericRefundThreshold,
      });
      setStatusMessage({
        type: "success",
        text: `King Pay rules saved locally on this device (offline mode) at ${now.toLocaleTimeString()}.`,
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
      text: "Changes undone and restored to your last saved values.",
    });
  };

  const handleResetToZero = () => {
    setMdrPercentage(0);
    setCustomerConvenienceFeeInr(0);
    setAutoRefundAiThresholdInr(0);
    setStatusMessage({
      type: "info",
      text: "All fees reset to 0. Click Save to apply.",
    });
  };

  const numericMdr = mdrPercentage === "" ? 0 : Number(mdrPercentage);
  const numericFee =
    customerConvenienceFeeInr === "" ? 0 : Number(customerConvenienceFeeInr);
  const numericThreshold =
    autoRefundAiThresholdInr === "" ? 0 : Number(autoRefundAiThresholdInr);

  // Calculator math based on test sliders and current rates
  const testTotalGmvInr = testOrderCount * testOrderValueInr;
  const calcMdrEarningsInr = testTotalGmvInr * (numericMdr / 100);
  const calcConvenienceEarningsInr = testOrderCount * numericFee;
  const calcTotalKingPayRevenueInr =
    calcMdrEarningsInr + calcConvenienceEarningsInr;

  const hasUnsavedChanges =
    Number(mdrPercentage) !== Number(initialState.mdrPercentage) ||
    Number(customerConvenienceFeeInr) !==
      Number(initialState.customerConvenienceFeeInr) ||
    Number(autoRefundAiThresholdInr) !==
      Number(initialState.autoRefundAiThresholdInr);

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden text-slate-800 dark:text-slate-100 ${className}`}
    >
      {/* 1. Simple Plain English Header */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white px-6 py-5 border-b border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  King Pay Rules
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold uppercase">
                  Live Payment Rules
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Set payment gateway fees, cart fees, instant refund limits, and payout days.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs font-mono text-slate-300">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>RBI & Tax Sec 194-O Compliant</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`px-6 py-3 border-b flex items-center gap-3 text-sm font-medium ${
            statusMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200"
              : statusMessage.type === "error"
              ? "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-200"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : statusMessage.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <Sliders className="w-4 h-4 text-slate-500 shrink-0" />
          )}
          <span className="flex-1">{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs uppercase tracking-wider font-semibold opacity-70 hover:opacity-100"
          >
            Close
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="p-6 space-y-6">
        {/* 2. Top 3-Box Summary: Live Result + Action Needed + Customize & Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Box 1: Live Result */}
          <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-4">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Live Result
            </div>
            <div className="text-base font-black text-slate-900 dark:text-white mt-1">
              {numericMdr.toFixed(2)}% Fee • ₹{numericFee.toFixed(2)} Cart Fee
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Instant refund cap: ₹{Math.round(numericThreshold)} • Payouts: {payoutDay}.
            </p>
          </div>

          {/* Box 2: Action Needed */}
          <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Action Needed
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
              {hasUnsavedChanges
                ? "Click Save King Pay Rules below to apply your changes."
                : "Review your payment fees or test them in the calculator."}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {lastSavedTimestamp
                ? `Last saved: ${lastSavedTimestamp}`
                : "Using default ₹0 baseline until you save."}
            </p>
          </div>

          {/* Box 3: Customize & Settings Button */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Customize & Settings
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Customize payout day, wallet cashback %, GST %, and minimum payout ₹.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCustomizeOpen(!isCustomizeOpen)}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-900 dark:bg-emerald-600 text-white hover:bg-slate-800 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>
                {isCustomizeOpen ? "Hide Extra Settings" : "Customize & Settings"}
              </span>
            </button>
          </div>
        </div>

        {/* 3. Main 3 King Pay Fee Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Input 1: Payment Fee (MDR %) */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold uppercase text-slate-500 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-indigo-500" />
                  Payment Gateway Fee
                </span>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-medium">
                  MDR %
                </span>
              </div>
              <label
                htmlFor="input_mdr_percentage"
                className="block text-sm font-bold text-slate-900 dark:text-white"
              >
                Payment Fee (MDR %)
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Percentage deducted from restaurant payouts to cover UPI and card processing.
              </p>
            </div>

            <div className="mt-4">
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
                  className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3.5 py-2.5 pr-10 text-base font-mono font-semibold text-slate-900 dark:text-white"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-sm font-mono font-bold text-slate-400">
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Input 2: Customer Convenience Fee (₹) */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold uppercase text-slate-500 flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
                  Checkout Fee
                </span>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">
                  Fixed ₹
                </span>
              </div>
              <label
                htmlFor="input_convenience_fee"
                className="block text-sm font-bold text-slate-900 dark:text-white"
              >
                Customer Convenience Fee (₹)
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Fixed rupee fee added to the customer&apos;s order bill at checkout.
              </p>
            </div>

            <div className="mt-4">
              <div className="relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-sm font-mono font-bold text-slate-400">
                    ₹
                  </span>
                </div>
                <input
                  id="input_convenience_fee"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="0.00"
                  disabled={isLoading || isSaving}
                  value={customerConvenienceFeeInr}
                  onChange={(e) => setCustomerConvenienceFeeInr(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 pl-8 pr-3.5 py-2.5 text-base font-mono font-semibold text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Input 3: Instant Refund Limit (₹) */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold uppercase text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  Refund Safety Cap
                </span>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                  Max ₹
                </span>
              </div>
              <label
                htmlFor="input_auto_refund_threshold"
                className="block text-sm font-bold text-slate-900 dark:text-white"
              >
                Instant Refund Limit (₹)
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Maximum refund amount approved automatically without manual founder review.
              </p>
            </div>

            <div className="mt-4">
              <div className="relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-sm font-mono font-bold text-slate-400">
                    ₹
                  </span>
                </div>
                <input
                  id="input_auto_refund_threshold"
                  type="number"
                  step="10"
                  min="0"
                  placeholder="0"
                  disabled={isLoading || isSaving}
                  value={autoRefundAiThresholdInr}
                  onChange={(e) => setAutoRefundAiThresholdInr(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 pl-8 pr-3.5 py-2.5 text-base font-mono font-semibold text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Expandable Additional King Pay Customization Controls */}
        {isCustomizeOpen && (
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Extra Payout & Cashback Settings
              </h3>
              <p className="text-xs text-slate-500">
                Customize restaurant payout schedules, wallet cashback %, and statutory tax rates.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Payout Day
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  When restaurants get paid.
                </p>
                <select
                  value={payoutDay}
                  onChange={(e) => setPayoutDay(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-semibold"
                >
                  <option value="Daily (T+1)">Daily (T+1)</option>
                  <option value="Every Monday">Every Monday</option>
                  <option value="Every Wednesday">Every Wednesday</option>
                  <option value="Every Friday">Every Friday</option>
                </select>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Wallet Cashback %
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Cashback on KingPay orders.
                </p>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  value={walletCashbackPct}
                  onChange={(e) => setWalletCashbackPct(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-mono font-bold"
                />
              </div>

              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Min Payout (₹)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Minimum balance for bank transfer.
                </p>
                <input
                  type="number"
                  min="1"
                  step="50"
                  value={minPayoutInr}
                  onChange={(e) => setMinPayoutInr(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-mono font-bold"
                />
              </div>

              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  TDS % (Sec 194-O)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Statutory e-commerce tax deduction.
                </p>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={tdsSec194OPct}
                  onChange={(e) => setTdsSec194OPct(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-mono font-bold"
                />
              </div>

              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  GST on Fees %
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  GST applied on platform service fees.
                </p>
                <input
                  type="number"
                  min="0"
                  max="28"
                  step="1"
                  value={feeGstPct}
                  onChange={(e) => setFeeGstPct(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. Interactive Calculator (Test Your Rates) */}
        <div className="bg-slate-900 text-slate-100 rounded-xl p-5 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                Calculator (Test Your Rates)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Adjust test order volume to see how much King Pay earns from your fee rules above.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/60 rounded-lg p-3.5 border border-slate-800">
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-300">Test Daily Orders:</span>
                <span className="text-emerald-400 font-bold">
                  {testOrderCount.toLocaleString()} orders
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="5000"
                step="50"
                value={testOrderCount}
                onChange={(e) => setTestOrderCount(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="bg-slate-950/60 rounded-lg p-3.5 border border-slate-800">
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-300">Average Order Bill (₹):</span>
                <span className="text-emerald-400 font-bold">
                  ₹{testOrderValueInr}
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="1500"
                step="50"
                value={testOrderValueInr}
                onChange={(e) => setTestOrderValueInr(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950/60 rounded-lg p-3.5 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase block">
                Payment Fee Earnings ({numericMdr.toFixed(2)}%)
              </span>
              <div className="text-lg font-mono font-bold text-indigo-400 mt-1">
                ₹{calcMdrEarningsInr.toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                On ₹{testTotalGmvInr.toLocaleString()} total order value
              </span>
            </div>

            <div className="bg-slate-950/60 rounded-lg p-3.5 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase block">
                Convenience Fee Earnings (₹{numericFee.toFixed(2)})
              </span>
              <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
                ₹{calcConvenienceEarningsInr.toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Across {testOrderCount.toLocaleString()} customer orders
              </span>
            </div>

            <div className="bg-slate-950/60 rounded-lg p-3.5 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase block">
                Total King Pay Fee Earnings
              </span>
              <div className="text-lg font-mono font-bold text-amber-400 mt-1">
                ₹{calcTotalKingPayRevenueInr.toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Combined payment + cart fee income
              </span>
            </div>
          </div>
        </div>

        {/* 5. Save & Reset Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            {lastSavedTimestamp ? (
              <span>
                Last saved:{" "}
                <strong className="text-slate-700 dark:text-slate-300 font-mono">
                  {lastSavedTimestamp}
                </strong>
              </span>
            ) : (
              <span>
                Status:{" "}
                <strong className="text-slate-700 dark:text-slate-300 font-mono">
                  Default ₹0 Baseline
                </strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleResetToZero}
              disabled={isLoading || isSaving}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-300 transition-colors disabled:opacity-50"
            >
              Reset to 0
            </button>

            <button
              type="button"
              onClick={handleRevert}
              disabled={isLoading || isSaving || !hasUnsavedChanges}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-300 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Undo
            </button>

            <button
              type="submit"
              disabled={isLoading || isSaving}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Saving Rules...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save King Pay Rules
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
