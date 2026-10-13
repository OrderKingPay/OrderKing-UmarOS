import { useState, useEffect } from "react";
import {
  Settings,
  DollarSign,
  CheckCircle2,
  Shield,
  RefreshCw,
  Save,
  Calculator,
} from "lucide-react";

interface CustomPricingRates {
  commissionPct: number;
  minOrderInr: number;
  deliveryFeeInr: number;
  rainFeeInr: number;
  riderBasePayInr: number;
  gstPct: number;
  payoutDay: string;
  walletCashbackPct: number;
}

const DEFAULT_RATES: CustomPricingRates = {
  commissionPct: 18,
  minOrderInr: 149,
  deliveryFeeInr: 40,
  rainFeeInr: 20,
  riderBasePayInr: 30,
  gstPct: 5,
  payoutDay: "Daily (T+1)",
  walletCashbackPct: 2,
};

const STORAGE_KEY = "orderking_central_pricing_settings";

export function CentralPricingSwitch() {
  const [pricingState, setPricingState] = useState({
    orderKing: "standard",
    kingPay: "standard",
    aiTutor: "standard",
  });

  const [customRates, setCustomRates] =
    useState<CustomPricingRates>(DEFAULT_RATES);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [activeNotice, setActiveNotice] = useState<string | null>(null);

  // Calculator (Test Your Rates) state
  const [testOrderFoodInr, setTestOrderFoodInr] = useState<number>(350);
  const [includeRainSurge, setIncludeRainSurge] = useState<boolean>(false);

  const pricingModels = [
    { id: "standard", label: "Standard" },
    { id: "increase", label: "Peak Surge" },
    { id: "decrease", label: "Discounted" },
    { id: "free", label: "Free (0%)" },
    { id: "trial", label: "Trial" },
  ];

  const tierSpecs: Record<
    string,
    Record<string, { badge: string; detail: string; commPct?: number }>
  > = {
    orderKing: {
      standard: {
        badge: `${customRates.commissionPct}% Standard Commission`,
        detail: "Normal restaurant commission and standard delivery fee.",
        commPct: customRates.commissionPct,
      },
      increase: {
        badge: "25% Peak Commission",
        detail: "Higher rate during busy dinner or rain hours.",
        commPct: 25,
      },
      decrease: {
        badge: "14% Low Commission",
        detail: "Reduced fee for high-volume partner restaurants.",
        commPct: 14,
      },
      free: {
        badge: "0% Commission",
        detail: "Zero commission promo for onboarding new restaurants.",
        commPct: 0,
      },
      trial: {
        badge: "14-Day Free Trial",
        detail: "Two-week free trial before standard rates start.",
        commPct: 0,
      },
    },
    kingPay: {
      standard: {
        badge: "1.85% Payment Fee",
        detail: "Standard payment gateway and settlement rate.",
      },
      increase: {
        badge: "2.25% Priority Payout",
        detail: "Fast priority settlement during peak hours.",
      },
      decrease: {
        badge: "1.20% Volume Rate",
        detail: "Lower payment fee for high-volume restaurants.",
      },
      free: {
        badge: "0% Payment Fee",
        detail: "Free payment processing for promotional partners.",
      },
      trial: {
        badge: "30-Day Free Trial",
        detail: "First month with zero payment processing fee.",
      },
    },
    aiTutor: {
      standard: {
        badge: "Standard Support",
        detail: "Normal helpdesk and partner guide access.",
      },
      increase: {
        badge: "Priority Support",
        detail: "Dedicated fast response for busy restaurants.",
      },
      decrease: {
        badge: "Basic Support",
        detail: "Low-cost self-service guide mode.",
      },
      free: {
        badge: "Free Access",
        detail: "Included free for all active partners.",
      },
      trial: {
        badge: "14-Day Full Trial",
        detail: "Full support features for new partners.",
      },
    },
  };

  const products = [
    {
      id: "orderKing",
      name: "OrderKing Food Delivery",
      description: "Restaurant commission percentage and customer delivery fees.",
    },
    {
      id: "kingPay",
      name: "King Pay Gateway",
      description: "Payment processing fee and daily restaurant bank payouts.",
    },
    {
      id: "aiTutor",
      name: "Partner Help & Training",
      description: "Automated onboarding and support for restaurants and riders.",
    },
  ];

  // Load saved custom pricing from localStorage + /api/v1/admin/settings
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.pricingState) setPricingState(parsed.pricingState);
        if (parsed.customRates)
          setCustomRates({ ...DEFAULT_RATES, ...parsed.customRates });
        if (parsed.lastUpdated) setLastUpdated(parsed.lastUpdated);
      }
    } catch {
      // Ignore storage errors
    }

    fetch("/api/v1/admin/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((serverData) => {
        if (serverData?.central_pricing) {
          if (serverData.central_pricing.pricingState) {
            setPricingState(serverData.central_pricing.pricingState);
          }
          if (serverData.central_pricing.customRates) {
            setCustomRates({
              ...DEFAULT_RATES,
              ...serverData.central_pricing.customRates,
            });
          }
        }
      })
      .catch(() => {
        // Offline fallback
      });
  }, []);

  const persistAllSettings = async (
    nextPricingState: typeof pricingState,
    nextRates: CustomPricingRates,
    noticePrefix: string
  ) => {
    setIsSaving(true);
    const timestamp = new Date().toLocaleTimeString("en-IN", { hour12: false });
    setLastUpdated(timestamp);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          pricingState: nextPricingState,
          customRates: nextRates,
          lastUpdated: timestamp,
        })
      );

      const res = await fetch("/api/v1/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          central_pricing: {
            pricingState: nextPricingState,
            customRates: nextRates,
            lastUpdated: new Date().toISOString(),
          },
        }),
      });

      if (res.ok) {
        setActiveNotice(`${noticePrefix} (Saved to server at ${timestamp})`);
      } else {
        setActiveNotice(`${noticePrefix} (Saved locally at ${timestamp})`);
      }
    } catch {
      setActiveNotice(
        `${noticePrefix} (Saved locally on device at ${timestamp})`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const updatePricing = (product: string, model: string) => {
    const nextState = { ...pricingState, [product]: model };
    setPricingState(nextState);

    let nextRates = { ...customRates };
    if (product === "orderKing") {
      const tierComm = tierSpecs.orderKing[model]?.commPct;
      if (tierComm !== undefined) {
        nextRates = { ...nextRates, commissionPct: tierComm };
        setCustomRates(nextRates);
      }
    }

    const productName =
      products.find((p) => p.id === product)?.name || product;
    const modelLabel =
      pricingModels.find((m) => m.id === model)?.label || model;
    persistAllSettings(
      nextState,
      nextRates,
      `Set ${productName} to ${modelLabel}`
    );
  };

  const resetAllToStandard = () => {
    const nextState = {
      orderKing: "standard",
      kingPay: "standard",
      aiTutor: "standard",
    };
    setPricingState(nextState);
    setCustomRates(DEFAULT_RATES);
    persistAllSettings(
      nextState,
      DEFAULT_RATES,
      "Reset all fees to Standard defaults"
    );
  };

  // Calculator math
  const activeDeliveryFee =
    customRates.deliveryFeeInr +
    (includeRainSurge ? customRates.rainFeeInr : 0);
  const foodGstInr = (testOrderFoodInr * customRates.gstPct) / 100;
  const customerTotalBillInr =
    testOrderFoodInr + foodGstInr + activeDeliveryFee;
  const commissionEarnedInr =
    (testOrderFoodInr * customRates.commissionPct) / 100;
  const founderGrossInflowInr = commissionEarnedInr + activeDeliveryFee;
  const founderNetProfitInr =
    founderGrossInflowInr - customRates.riderBasePayInr;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm w-full">
      {/* 1. Simple Plain English Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Commission & Delivery Fees
              </h2>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
                Live Rates
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Choose preset fee tiers or customize exact commission, delivery, rain, and rider rates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {activeNotice && (
            <div className="flex items-center gap-1.5 text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{activeNotice}</span>
            </div>
          )}
          <button
            type="button"
            onClick={resetAllToStandard}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset to Standard</span>
          </button>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* 2. Top 3-Box Summary: Live Result + Action Needed + Customize & Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Box 1: Live Result */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-800">
              Live Result
            </div>
            <div className="text-base font-black text-slate-900 mt-1">
              {customRates.commissionPct}% Commission • ₹{customRates.deliveryFeeInr} Delivery
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Min order: ₹{customRates.minOrderInr} • Rain fee: +₹{customRates.rainFeeInr} • Rider pay: ₹{customRates.riderBasePayInr}.
            </p>
          </div>

          {/* Box 2: Action Needed */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-800">
              Action Needed
            </div>
            <div className="text-sm font-bold text-slate-900 mt-1">
              Pick a quick tier below or click Customize & Settings to set exact ₹/Percentages.
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {lastUpdated
                ? `Last saved at ${lastUpdated} IST.`
                : "Using standard default rates."}
            </p>
          </div>

          {/* Box 3: Customize & Settings Button */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600">
                Customize & Settings
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Edit commission %, min order ₹, rain fee ₹, rider pay ₹, and GST %.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCustomizeOpen(!isCustomizeOpen)}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>
                {isCustomizeOpen ? "Hide Custom Rates" : "Customize & Settings"}
              </span>
            </button>
          </div>
        </div>

        {/* Expandable Full Customization Panel */}
        {isCustomizeOpen && (
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Custom Commission, Delivery & Tax Rules
              </h3>
              <p className="text-xs text-slate-600">
                Enter your exact numbers below and click Save Custom Rates.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-slate-800">
                  Commission %
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Fee charged on food subtotal.
                </p>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={customRates.commissionPct}
                  onChange={(e) =>
                    setCustomRates({
                      ...customRates,
                      commissionPct: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono font-bold"
                />
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-slate-800">
                  Min Order (₹)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Minimum cart value required.
                </p>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={customRates.minOrderInr}
                  onChange={(e) =>
                    setCustomRates({
                      ...customRates,
                      minOrderInr: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono font-bold"
                />
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-slate-800">
                  Delivery Fee (₹)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Normal customer delivery fee.
                </p>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={customRates.deliveryFeeInr}
                  onChange={(e) =>
                    setCustomRates({
                      ...customRates,
                      deliveryFeeInr: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono font-bold"
                />
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-slate-800">
                  Rain Fee (₹)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Extra delivery charge in rain.
                </p>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={customRates.rainFeeInr}
                  onChange={(e) =>
                    setCustomRates({
                      ...customRates,
                      rainFeeInr: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono font-bold"
                />
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-slate-800">
                  Rider Base Pay (₹)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Base payout per order to rider.
                </p>
                <input
                  type="number"
                  min="10"
                  step="5"
                  value={customRates.riderBasePayInr}
                  onChange={(e) =>
                    setCustomRates({
                      ...customRates,
                      riderBasePayInr: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono font-bold"
                />
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-slate-800">
                  Food GST % (Sec 9(5))
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Statutory GST on restaurant food.
                </p>
                <input
                  type="number"
                  min="0"
                  max="28"
                  step="0.5"
                  value={customRates.gstPct}
                  onChange={(e) =>
                    setCustomRates({
                      ...customRates,
                      gstPct: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono font-bold"
                />
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-slate-800">
                  Payout Day
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Restaurant bank transfer schedule.
                </p>
                <select
                  value={customRates.payoutDay}
                  onChange={(e) =>
                    setCustomRates({
                      ...customRates,
                      payoutDay: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold bg-white"
                >
                  <option value="Daily (T+1)">Daily (T+1)</option>
                  <option value="Every Monday">Every Monday</option>
                  <option value="Every Wednesday">Every Wednesday</option>
                  <option value="Every Friday">Every Friday</option>
                </select>
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-slate-800">
                  Wallet Cashback %
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Cashback on KingPay checkout.
                </p>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  value={customRates.walletCashbackPct}
                  onChange={(e) =>
                    setCustomRates({
                      ...customRates,
                      walletCashbackPct: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCustomRates(DEFAULT_RATES)}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-100"
              >
                Reset Numbers
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() =>
                  persistAllSettings(
                    pricingState,
                    customRates,
                    "Saved custom commission and delivery fees"
                  )
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? "Saving..." : "Save Custom Rates"}</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. Quick Preset Tier Switches */}
        <div className="grid gap-4">
          {products.map((product) => {
            const currentModel =
              pricingState[product.id as keyof typeof pricingState];
            const spec = tierSpecs[product.id]?.[currentModel] || {
              badge: "Standard Tier",
              detail: "Default rate.",
            };

            return (
              <div
                key={product.id}
                className="bg-slate-50/70 rounded-xl p-5 border border-slate-200 hover:border-slate-300 transition-all shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-md">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-slate-900 text-base font-bold">
                      {product.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600">{product.description}</p>

                  <div className="inline-flex items-center gap-2 pt-1">
                    <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800">
                      {spec.badge}
                    </span>
                    <span className="text-xs text-slate-500 hidden sm:inline">
                      — {spec.detail}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-start lg:items-end gap-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    Choose Fee Mode
                  </span>
                  <div className="flex bg-slate-200/80 rounded-xl p-1 border border-slate-300 overflow-x-auto w-full lg:w-auto">
                    {pricingModels.map((model) => {
                      const isSelected = currentModel === model.id;
                      return (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => updatePricing(product.id, model.id)}
                          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                            isSelected
                              ? "bg-slate-900 text-white shadow-xs font-bold"
                              : "text-slate-700 hover:text-slate-900 hover:bg-white/60"
                          }`}
                        >
                          {model.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. Interactive Calculator (Test Your Rates) */}
        <div className="p-5 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                Calculator (Test Your Rates)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Slide the food value or toggle rain fee to see customer bill and founder profit.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-mono bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeRainSurge}
                onChange={(e) => setIncludeRainSurge(e.target.checked)}
                className="accent-emerald-500"
              />
              <span>Include Rain Fee (+₹{customRates.rainFeeInr})</span>
            </label>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-300">Sample Food Basket Value:</span>
              <span className="text-emerald-400 font-bold">
                ₹{testOrderFoodInr}
              </span>
            </div>
            <input
              type="range"
              min="100"
              max="1500"
              step="25"
              value={testOrderFoodInr}
              onChange={(e) => setTestOrderFoodInr(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">
                Customer Total Bill
              </span>
              <div className="text-base font-bold text-white mt-1">
                ₹{customerTotalBillInr.toFixed(2)}
              </div>
              <span className="text-slate-500 text-[10px]">
                Food + {customRates.gstPct}% GST + ₹{activeDeliveryFee} Delivery
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">
                Commission ({customRates.commissionPct}%)
              </span>
              <div className="text-base font-bold text-emerald-400 mt-1">
                +₹{commissionEarnedInr.toFixed(2)}
              </div>
              <span className="text-slate-500 text-[10px]">
                Earned from restaurant
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">
                Rider Base Pay
              </span>
              <div className="text-base font-bold text-rose-400 mt-1">
                −₹{customRates.riderBasePayInr.toFixed(2)}
              </div>
              <span className="text-slate-500 text-[10px]">
                Paid to delivery partner
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">
                Your Net Profit
              </span>
              <div className="text-base font-bold text-emerald-400 mt-1">
                ₹{founderNetProfitInr.toFixed(2)}
              </div>
              <span className="text-slate-500 text-[10px]">
                (Commission + Delivery) − Rider Pay
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-500" />
            <span>FOUNDER ADMIN ACCESS</span>
          </div>
          <div>CGST SEC 9(5) & TDS SEC 194-O COMPLIANT</div>
        </div>
      </div>
    </div>
  );
}
