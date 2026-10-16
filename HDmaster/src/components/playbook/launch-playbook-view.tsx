import React, { useState, useEffect, useMemo } from "react";
import {
  DEFAULT_CLUSTER_CONFIG,
  FIVE_DAY_CUMULATIVE_QUOTAS,
  COMMERCIAL_TIERS,
  RESTAURANT_WALK_IN_SCRIPT,
  OBJECTION_COUNTERS,
  RIDER_RECRUITMENT_CONFIG,
  CUSTOMER_LAUNCH_PLAN,
  FIVE_DAY_STREET_TIMETABLE,
  LAUNCH_CASH_ENVELOPE,
  calculateLaunchEconomics,
  calculateRiderShiftPayout,
  compareMerchantNetPayout,
  formatPaiseToInr,
  formatInrWhole,
  type MerchantCategory,
} from "@/lib/orderking/playbook/hyperlocal-launch-5day";
import {
  Calculator,
  Copy,
  Check,
  CheckCircle2,
  Bike,
  Store,
  Users,
  Calendar,
  Wallet,
  ShieldCheck,
  AlertTriangle,
  QrCode,
  MessageSquare,
  Clock,
  Printer,
  ChevronRight,
  Sparkles,
  RefreshCw,
  TrendingUp,
  MapPin,
  Flame,
  ArrowRight,
  Info,
} from "lucide-react";

const STORAGE_KEY_CHECKLIST = "orderking_hyperlocal_launch_checklist_v1";

export function LaunchPlaybookView() {
  const [activeTab, setActiveTab] = useState<
    "calculator" | "battlecard" | "riders" | "customers" | "timetable" | "ledger"
  >("calculator");

  // Calculator State
  const [calcSubtotalRupees, setCalcSubtotalRupees] = useState<number>(300);
  const [calcCategory, setCalcCategory] = useState<MerchantCategory>("STANDALONE_RESTAURANT");
  const [calcDistanceKm, setCalcDistanceKm] = useState<number>(4.0);
  const [calcDeliveryFeeRupees, setCalcDeliveryFeeRupees] = useState<number>(29);
  const [calcDiscountRupees, setCalcDiscountRupees] = useState<number>(40);
  const [calcWeatherSurge, setCalcWeatherSurge] = useState<boolean>(false);

  // Rider Simulator State
  const [simCompletedOrders, setSimCompletedOrders] = useState<number>(8);
  const [simDayNumber, setSimDayNumber] = useState<number>(2);

  // Script Language State
  const [scriptLang, setScriptLang] = useState<"hinglish" | "english">("hinglish");

  // Timetable Selected Day
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);

  // Cash Envelope Budget Mode
  const [budgetMode, setBudgetMode] = useState<"lean" | "standard" | "scale">("standard");

  // Copy Feedback State
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Persistent Checklist State
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHECKLIST);
      if (saved) {
        setCheckedTasks(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Failed to read launch checklist from localStorage", e);
    }
  }, []);

  const toggleTask = (taskId: string) => {
    setCheckedTasks((prev) => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      try {
        localStorage.setItem(STORAGE_KEY_CHECKLIST, JSON.stringify(next));
      } catch (e) {
        console.warn("Failed to persist launch checklist", e);
      }
      return next;
    });
  };

  const resetChecklist = () => {
    if (window.confirm("Reset all 5-day operational checklist progress?")) {
      setCheckedTasks({});
      try {
        localStorage.removeItem(STORAGE_KEY_CHECKLIST);
      } catch (e) {
        console.warn("Failed to clear launch checklist", e);
      }
    }
  };

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 2000);
  };

  // Economics Calculations
  const selectedTier = COMMERCIAL_TIERS[calcCategory];
  const orderEconomics = useMemo(() => {
    return calculateLaunchEconomics({
      foodSubtotalPaise: Math.round(calcSubtotalRupees * 100),
      commissionRateBps: selectedTier.commissionBps,
      deliveryDistanceKm: calcDistanceKm,
      customerDeliveryFeePaise: Math.round(calcDeliveryFeeRupees * 100),
      customerDiscountPaise: Math.round(calcDiscountRupees * 100),
      weatherSurgePaise: calcWeatherSurge ? 1500 : 0,
    });
  }, [
    calcSubtotalRupees,
    selectedTier,
    calcDistanceKm,
    calcDeliveryFeeRupees,
    calcDiscountRupees,
    calcWeatherSurge,
  ]);

  const merchantComparison = useMemo(() => {
    return compareMerchantNetPayout(
      Math.round(calcSubtotalRupees * 100),
      selectedTier.commissionBps,
      3000 // Zomato 30%
    );
  }, [calcSubtotalRupees, selectedTier]);

  const riderShiftOutput = useMemo(() => {
    const deliveries = Array(simCompletedOrders).fill({
      distanceKm: calcDistanceKm,
      weatherSurge: calcWeatherSurge,
    });
    return calculateRiderShiftPayout({
      shiftHours: 8,
      completedDeliveries: deliveries,
      dayNumber: simDayNumber,
    });
  }, [simCompletedOrders, calcDistanceKm, calcWeatherSurge, simDayNumber]);

  // Overall Checklist Completion Stats
  const totalChecklistItemsCount = useMemo(() => {
    let count = 0;
    for (const day of FIVE_DAY_STREET_TIMETABLE) {
      count += day.schedule.length + day.endOfDayReconciliationAudit.length;
    }
    return count;
  }, []);

  const completedChecklistItemsCount = useMemo(() => {
    return Object.values(checkedTasks).filter(Boolean).length;
  }, [checkedTasks]);

  const checklistProgressPct = totalChecklistItemsCount > 0
    ? Math.round((completedChecklistItemsCount / totalChecklistItemsCount) * 100)
    : 0;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-16 font-sans text-slate-900">
      {/* Supreme Executive Launch Command Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white p-6 sm:p-8 shadow-2xl border border-emerald-900/40">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ground-Truth Hyperlocal Launch Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              5-Day Hyperlocal Launch Playbook
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Precision operational framework: Onboard 20 restaurants, recruit 15 delivery partners, and acquire 500 local customer leads inside a dense 3km urban cluster.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono text-emerald-300">
              <span className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1 rounded-lg border border-emerald-800/40">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                Cluster: {DEFAULT_CLUSTER_CONFIG.name}
              </span>
              <span className="bg-slate-900/80 px-3 py-1 rounded-lg border border-emerald-800/40">
                1km Core → 3.5km Perimeter
              </span>
              <span className="bg-slate-900/80 px-3 py-1 rounded-lg border border-emerald-800/40 text-amber-300 font-bold">
                Budget: ₹65k–₹95k Ledger
              </span>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-3.5 text-center shadow-lg">
              <Store className="w-5 h-5 mx-auto text-emerald-400 mb-1" />
              <div className="text-2xl font-black text-white">20</div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Restaurants</div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Live + Printed</div>
            </div>
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-3.5 text-center shadow-lg">
              <Bike className="w-5 h-5 mx-auto text-amber-400 mb-1" />
              <div className="text-2xl font-black text-white">15</div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Riders</div>
              <div className="text-[10px] text-amber-400 font-mono mt-0.5">₹500 Floor</div>
            </div>
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-3.5 text-center shadow-lg">
              <Users className="w-5 h-5 mx-auto text-cyan-400 mb-1" />
              <div className="text-2xl font-black text-white">500</div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Customers</div>
              <div className="text-[10px] text-cyan-400 font-mono mt-0.5">LOCAL40 Opt-ins</div>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-6 pt-6 border-t border-emerald-900/40">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              5-Day Field Execution Progress: {completedChecklistItemsCount} of {totalChecklistItemsCount} Milestones
            </span>
            <span className="font-bold text-emerald-400">{checklistProgressPct}% Complete</span>
          </div>
          <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden border border-slate-700/50">
            <div
              className="bg-gradient-to-r from-emerald-500 to-amber-400 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${checklistProgressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("calculator")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
            activeTab === "calculator"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Launch Economics Calculator</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("battlecard")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
            activeTab === "battlecard"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
          }`}
        >
          <Store className="w-4 h-4" />
          <span>15-Min Restaurant Battlecard</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("riders")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
            activeTab === "riders"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
          }`}
        >
          <Bike className="w-4 h-4" />
          <span>Rider Recruitment & Retention</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("customers")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
            activeTab === "customers"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Customer Launch & Broadcasts</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("timetable")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
            activeTab === "timetable"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>5-Day Street Timetable</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ledger")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
            activeTab === "ledger"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Launch Cash Envelope (₹85k)</span>
        </button>
      </div>

      {/* TAB 1: LAUNCH ECONOMICS CALCULATOR */}
      {activeTab === "calculator" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Controls Panel */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-600" />
                  Order Economics Parameters
                </h3>
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Exact Paise Precision
                </span>
              </div>

              {/* Merchant Category Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-600">
                  Merchant Category & Rate Card
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["STANDALONE_RESTAURANT", "CLOUD_KITCHEN", "ANCHOR_RESTAURANT"] as MerchantCategory[]).map(
                    (cat) => {
                      const tier = COMMERCIAL_TIERS[cat];
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCalcCategory(cat)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            calcCategory === cat
                              ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-sm"
                              : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-700"
                          }`}
                        >
                          <div className="text-xs font-bold">{tier.commissionPct}%</div>
                          <div className="text-[10px] text-slate-500 truncate">{tier.name}</div>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Food Subtotal Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono uppercase text-slate-600">Food Basket Subtotal:</span>
                  <span className="font-black text-slate-900 text-sm font-mono">₹{calcSubtotalRupees}</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={1500}
                  step={10}
                  value={calcSubtotalRupees}
                  onChange={(e) => setCalcSubtotalRupees(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>₹100 (Snack)</span>
                  <span>₹300 (Astra Baseline)</span>
                  <span>₹1500 (Family Feast)</span>
                </div>
              </div>

              {/* Delivery Distance Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono uppercase text-slate-600">Road Delivery Distance:</span>
                  <span className="font-black text-slate-900 text-sm font-mono">{calcDistanceKm.toFixed(1)} km</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={6.0}
                  step={0.5}
                  value={calcDistanceKm}
                  onChange={(e) => setCalcDistanceKm(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0.5 km (Hyperlocal)</span>
                  <span>2.0 km (Core)</span>
                  <span>4.0 km (Perimeter)</span>
                </div>
              </div>

              {/* Customer Delivery Fee & Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono uppercase text-slate-600">
                    Customer Delivery Fee
                  </label>
                  <select
                    value={calcDeliveryFeeRupees}
                    onChange={(e) => setCalcDeliveryFeeRupees(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900"
                  >
                    <option value={0}>₹0 (Free Promo)</option>
                    <option value={20}>₹20 (Tier-2)</option>
                    <option value={29}>₹29 (Standard)</option>
                    <option value={39}>₹39 (Surge)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono uppercase text-slate-600">
                    Launch Promo Discount
                  </label>
                  <select
                    value={calcDiscountRupees}
                    onChange={(e) => setCalcDiscountRupees(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900"
                  >
                    <option value={0}>₹0 (No Discount)</option>
                    <option value={20}>₹20 (Referral)</option>
                    <option value={40}>₹40 (LOCAL40 Launch)</option>
                    <option value={60}>₹60 (Aggressive)</option>
                  </select>
                </div>
              </div>

              {/* Weather Surge Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50/70">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Heavy Rain / Weather Surge</div>
                    <div className="text-[11px] text-slate-500">+₹15 direct to rider payout</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCalcWeatherSurge(!calcWeatherSurge)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    calcWeatherSurge ? "bg-amber-600" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                      calcWeatherSurge ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Results & Side-by-Side Breakdown Panel */}
            <div className="lg:col-span-7 space-y-6">
              {/* Core Output Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Card 1: Merchant Net Payout */}
                <div className="bg-emerald-950 text-white rounded-3xl p-5 border border-emerald-800 shadow-md">
                  <div className="flex items-center justify-between text-emerald-400 text-xs font-mono uppercase mb-1">
                    <span>Merchant Payout</span>
                    <Store className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black text-white">
                    {formatPaiseToInr(orderEconomics.netMerchantPayablePaise)}
                  </div>
                  <div className="text-xs text-emerald-300 mt-1">
                    T+1 Settlement after {selectedTier.commissionPct}% commission & tax
                  </div>
                </div>

                {/* Card 2: Rider Payout */}
                <div className="bg-amber-950 text-white rounded-3xl p-5 border border-amber-800 shadow-md">
                  <div className="flex items-center justify-between text-amber-400 text-xs font-mono uppercase mb-1">
                    <span>Rider Compensation</span>
                    <Bike className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black text-white">
                    {formatPaiseToInr(orderEconomics.riderGrossPayoutPaise)}
                  </div>
                  <div className="text-xs text-amber-300 mt-1">
                    Base ₹25 + {formatPaiseToInr(orderEconomics.riderDistanceFarePaise)} dist {calcWeatherSurge ? "+ ₹15 surge" : ""}
                  </div>
                </div>

                {/* Card 3: Platform Contribution Margin */}
                <div
                  className={`rounded-3xl p-5 border shadow-md text-white ${
                    orderEconomics.platformContributionMarginPaise >= 0
                      ? "bg-slate-900 border-slate-800"
                      : "bg-rose-950 border-rose-800"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono uppercase mb-1 text-slate-400">
                    <span>Platform Margin</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black">
                    {formatPaiseToInr(orderEconomics.platformContributionMarginPaise)}
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    {orderEconomics.platformMarginPctOfFood}% contribution on food
                  </div>
                </div>
              </div>

              {/* Side-by-Side Merchant Savings Comparison vs Zomato */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Merchant Direct Bank Benefit: OrderKing vs Zomato (30%)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Transparent math proving why owners sign with OrderKing
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold border border-emerald-200">
                      +{formatPaiseToInr(merchantComparison.merchantSavingsPerOrderPaise)} / order
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-900 text-sm">Zomato / Swiggy (30%)</div>
                    <div className="flex justify-between text-slate-600">
                      <span>Order Subtotal:</span>
                      <span>{formatPaiseToInr(merchantComparison.orderSubtotalPaise)}</span>
                    </div>
                    <div className="flex justify-between text-rose-600">
                      <span>Commission (30%):</span>
                      <span>-₹{(calcSubtotalRupees * 0.3).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-rose-600">
                      <span>GST (18% on Comm):</span>
                      <span>-₹{(calcSubtotalRupees * 0.3 * 0.18).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-rose-600">
                      <span>TDS 194-O (0.1%):</span>
                      <span>-₹{(calcSubtotalRupees * 0.001).toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                      <span>Net Merchant Payout:</span>
                      <span className="text-rose-700">
                        {formatPaiseToInr(merchantComparison.competitorNetPayoutPaise)}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                    <div className="font-bold text-emerald-950 text-sm">OrderKing ({selectedTier.commissionPct}%)</div>
                    <div className="flex justify-between text-slate-700">
                      <span>Order Subtotal:</span>
                      <span>{formatPaiseToInr(merchantComparison.orderSubtotalPaise)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700">
                      <span>Commission ({selectedTier.commissionPct}%):</span>
                      <span>-{formatPaiseToInr(orderEconomics.merchantCommissionPaise)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700">
                      <span>GST (18% on Comm):</span>
                      <span>-{formatPaiseToInr(orderEconomics.gstOnCommissionPaise)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700">
                      <span>TDS 194-O (0.1%):</span>
                      <span>-{formatPaiseToInr(orderEconomics.tdsSection194OPaise)}</span>
                    </div>
                    <div className="pt-2 border-t border-emerald-300 flex justify-between font-bold text-emerald-950">
                      <span>Net Merchant Payout:</span>
                      <span className="text-emerald-800 text-sm">
                        {formatPaiseToInr(merchantComparison.orderKingNetPayoutPaise)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-emerald-200" />
                    Projected 30-Day Merchant Extra Profit (300 orders):
                  </span>
                  <span className="font-black text-sm text-amber-300">
                    +{formatPaiseToInr(merchantComparison.projectedMonthlySavings300OrdersPaise)}
                  </span>
                </div>
              </div>

              {/* Rider Shift Simulator */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Bike className="w-4 h-4 text-amber-600" />
                      8-Hour Rider Shift Floor Guarantee Simulator
                    </h4>
                    <p className="text-xs text-slate-500">
                      Calculates order earnings vs ₹500 floor guarantee & Day 4+ kit recovery
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mono">Simulate Day:</span>
                    <select
                      value={simDayNumber}
                      onChange={(e) => setSimDayNumber(Number(e.target.value))}
                      className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-bold"
                    >
                      <option value={1}>Day 1 (No Kit Ded.)</option>
                      <option value={2}>Day 2 (No Kit Ded.)</option>
                      <option value={3}>Day 3 (No Kit Ded.)</option>
                      <option value={4}>Day 4 (₹50 Kit Ded.)</option>
                      <option value={5}>Day 5 (₹50 Kit Ded.)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono uppercase text-slate-600">Orders Delivered in 8-Hour Shift:</span>
                    <span className="font-black text-slate-900 text-sm font-mono">{simCompletedOrders} deliveries</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    step={1}
                    value={simCompletedOrders}
                    onChange={(e) => setSimCompletedOrders(Number(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-slate-500 text-[10px] uppercase">Order Earnings</div>
                    <div className="text-sm font-bold text-slate-900">
                      {formatPaiseToInr(riderShiftOutput.grossOrderEarningsPaise)}
                    </div>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="text-amber-800 text-[10px] uppercase">Floor Top-Up</div>
                    <div className="text-sm font-bold text-amber-900">
                      {formatPaiseToInr(riderShiftOutput.guaranteeTopUpPaise)}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-slate-500 text-[10px] uppercase">Kit Deduction</div>
                    <div className="text-sm font-bold text-rose-600">
                      -{formatPaiseToInr(riderShiftOutput.kitDeductionAppliedPaise)}
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="text-emerald-800 text-[10px] uppercase">Net Take-Home</div>
                    <div className="text-sm font-black text-emerald-900">
                      {formatPaiseToInr(riderShiftOutput.netTakeHomePayoutPaise)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 15-MINUTE RESTAURANT BATTLECARD */}
      {activeTab === "battlecard" && (
        <div className="space-y-6">
          {/* Commercial Tiers Card Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["STANDALONE_RESTAURANT", "CLOUD_KITCHEN", "ANCHOR_RESTAURANT"] as MerchantCategory[]).map(
              (cat) => {
                const tier = COMMERCIAL_TIERS[cat];
                return (
                  <div
                    key={cat}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          {tier.category}
                        </span>
                        <span className="text-2xl font-black text-slate-900">{tier.commissionPct}%</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mb-1">{tier.name}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed mb-3">{tier.keySellingPoint}</p>
                    </div>
                    <div className="pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500 space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-700">
                        <Check className="w-3.5 h-3.5" />
                        <span>{tier.settlementTerms}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-700">
                        <Check className="w-3.5 h-3.5" />
                        <span>Onboarding: ₹0 / Compulsion: Zero</span>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>

          {/* Script Header with Language Switcher */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  The 15-Minute Founder Walk-in Script (3:30 PM Window)
                </h3>
                <p className="text-xs text-slate-500">
                  Strictly timed 4-stage walk-in choreography executed right after the lunch rush
                </p>
              </div>
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setScriptLang("hinglish")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    scriptLang === "hinglish"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Natural Hinglish
                </button>
                <button
                  type="button"
                  onClick={() => setScriptLang("english")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    scriptLang === "english"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Standard English
                </button>
              </div>
            </div>

            {/* 4 Stages */}
            <div className="space-y-4">
              {RESTAURANT_WALK_IN_SCRIPT.map((stage, idx) => {
                const scriptText = scriptLang === "hinglish" ? stage.hinglishScript : stage.englishScript;
                const copyId = `script-stage-${idx}`;
                return (
                  <div
                    key={stage.stage}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{stage.stage}</h4>
                        <span className="text-[11px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          {stage.timeRangeMinutes}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(copyId, scriptText)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all shadow-sm"
                      >
                        {copiedKey === copyId ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copy Script</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 font-medium italic">{stage.goal}</p>

                    <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                      {scriptText}
                    </div>

                    <div className="text-[11px] font-mono text-amber-800 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200 flex items-center gap-2">
                      <Info className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{stage.fieldActionNote}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3 Core Field Objection Counters */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div>
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                The 3 Critical Objections That Decide Your Conversion Rate
              </h3>
              <p className="text-xs text-slate-500">
                Ground-tested counters with hard operational commitments
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {OBJECTION_COUNTERS.map((obj) => {
                const responseScript = scriptLang === "hinglish" ? obj.founderResponseHinglish : obj.founderResponseEnglish;
                const copyId = `obj-copy-${obj.id}`;
                return (
                  <div
                    key={obj.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        "{obj.objectionTitle}"
                      </h4>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(copyId, responseScript)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all shadow-sm"
                      >
                        {copiedKey === copyId ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copy Counter</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">Root Concern:</span> {obj.merchantPainPoint}
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                      {responseScript}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                        <span className="font-bold block text-[10px] uppercase text-emerald-700">Operational SLA:</span>
                        {obj.operationalCommitment}
                      </div>
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                        <span className="font-bold block text-[10px] uppercase text-amber-700">Physical Field Move:</span>
                        {obj.fieldMove}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RIDER RECRUITMENT & RETENTION */}
      {activeTab === "riders" && (
        <div className="space-y-6">
          {/* Rider Roster & Pay Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500 uppercase">
                <span>Daily Floor Guarantee</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">₹500 / day</div>
              <p className="text-xs text-slate-600">
                Minimum gross guaranteed payout for an 8-hour shift or 4 completed deliveries with &gt;=90% acceptance.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500 uppercase">
                <span>Per-Delivery Pay Formula</span>
                <Bike className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">₹25 + ₹8.50/km</div>
              <p className="text-xs text-slate-600">
                ₹25 base + ₹8.50/km (&gt;2km) + ₹15 weather surge + ₹8.50/km on long pickups (&gt;1km).
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500 uppercase">
                <span>₹0 Upfront Kit Deduction</span>
                <Wallet className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">₹50 / day from Day 4</div>
              <p className="text-xs text-slate-600">
                ₹0 upfront. ₹1,200 deluxe kit amortized at ₹50/day from Day 4 onwards ONLY on days exceeding floor.
              </p>
            </div>
          </div>

          {/* 15-Rider Fleet Shift Roster Breakdown */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  15-Partner Shift Roster Distribution
                </h3>
                <p className="text-xs text-slate-500">
                  Disciplined allocation preventing idle floor burn while maintaining 100% order pickup readiness
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                Total Fleet: 15 Verified Partners
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
                <div className="text-amber-800 text-[10px] uppercase font-bold">Lunch Primary Cadre</div>
                <div className="text-2xl font-black text-amber-950">
                  {RIDER_RECRUITMENT_CONFIG.shiftRoster15.lunchPrimaryRiders} Riders
                </div>
                <div className="text-[11px] text-slate-600">11:30 AM – 03:30 PM shift coverage</div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                <div className="text-emerald-800 text-[10px] uppercase font-bold">Dinner Primary Cadre</div>
                <div className="text-2xl font-black text-emerald-950">
                  {RIDER_RECRUITMENT_CONFIG.shiftRoster15.dinnerPrimaryRiders} Riders
                </div>
                <div className="text-[11px] text-slate-600">06:30 PM – 10:30 PM peak coverage</div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1">
                <div className="text-indigo-800 text-[10px] uppercase font-bold">Peak Standby Reserves</div>
                <div className="text-2xl font-black text-indigo-950">
                  {RIDER_RECRUITMENT_CONFIG.shiftRoster15.peakReserves} Riders
                </div>
                <div className="text-[11px] text-slate-600">Rain / surge / unassigned order failover</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 space-y-1">
                <div className="text-slate-700 text-[10px] uppercase font-bold">Flexible Floating Backup</div>
                <div className="text-2xl font-black text-slate-950">
                  {RIDER_RECRUITMENT_CONFIG.shiftRoster15.flexibleFloatingBackup} Rider
                </div>
                <div className="text-[11px] text-slate-600">Captain's mobile backup & courier relief</div>
              </div>
            </div>
          </div>

          {/* Chai Stall / Petrol Pump Recruitment Script */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-600" />
                  Chai Stall & Petrol Pump Pitch Script (3:00–5:00 PM Window)
                </h3>
                <p className="text-xs text-slate-500">
                  Direct conversational pitch to working gig riders during their afternoon idle window
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    "rider-pitch",
                    scriptLang === "hinglish"
                      ? RIDER_RECRUITMENT_CONFIG.pitchScriptHinglish
                      : RIDER_RECRUITMENT_CONFIG.pitchScriptEnglish
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all shadow-sm self-start sm:self-auto"
              >
                {copiedKey === "rider-pitch" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Pitch Script</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed font-sans">
              {scriptLang === "hinglish"
                ? RIDER_RECRUITMENT_CONFIG.pitchScriptHinglish
                : RIDER_RECRUITMENT_CONFIG.pitchScriptEnglish}
            </div>

            {/* Target Locations & KYC Checklists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
                  Top Ground Sourcing Locations
                </span>
                <ul className="space-y-1.5 text-slate-600">
                  {RIDER_RECRUITMENT_CONFIG.targetLocations.map((loc, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <ChevronRight className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{loc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
                  Mandatory KYC & Safety Checklist
                </span>
                <ul className="space-y-1.5 text-slate-600">
                  {RIDER_RECRUITMENT_CONFIG.kycVerificationChecklist.map((kyc, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{kyc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CUSTOMER LAUNCH & VIRAL COPY */}
      {activeTab === "customers" && (
        <div className="space-y-6">
          {/* Promo Offer Header Card */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-700/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-mono font-bold">
                <Sparkles className="w-3.5 h-3.5" /> Launch Offer: Code {CUSTOMER_LAUNCH_PLAN.promotionalOffer.couponCode}
              </div>
              <h3 className="text-2xl sm:text-3xl font-black">
                ₹40 FLAT OFF + Free Delivery on First 2 Orders
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
                Minimum order value ₹149. Hard capped at the first 100 eligible local orders (₹4,000 launch budget envelope).
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-400/40 text-center shrink-0">
              <div className="text-xs font-mono text-slate-400 uppercase">Redemption Cap</div>
              <div className="text-3xl font-black text-amber-400 font-mono">100 Orders</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Budget Cap: ₹4,000</div>
            </div>
          </div>

          {/* WhatsApp Broadcast Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Direct WhatsApp */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  Customer Direct WhatsApp Broadcast Copy
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      "wa-direct",
                      CUSTOMER_LAUNCH_PLAN.whatsAppBroadcastCopy.customerDirectHinglish
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all shadow-sm"
                >
                  {copiedKey === "wa-direct" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy WhatsApp</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200 text-xs text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                {CUSTOMER_LAUNCH_PLAN.whatsAppBroadcastCopy.customerDirectHinglish}
              </div>
            </div>

            {/* Merchant / Rider Referral WhatsApp */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-amber-600" />
                  Rider & Counter Referral Invite Copy
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      "wa-referral",
                      CUSTOMER_LAUNCH_PLAN.whatsAppBroadcastCopy.merchantRiderReferralHinglish
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all shadow-sm"
                >
                  {copiedKey === "wa-referral" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Referral</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200 text-xs text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                {CUSTOMER_LAUNCH_PLAN.whatsAppBroadcastCopy.merchantRiderReferralHinglish}
              </div>
            </div>
          </div>

          {/* QR Tent Card & Table Display Copy */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Printer className="w-4 h-4 text-emerald-600" />
                  Physical Acrylic Table Tent & Counter QR Display Copy
                </h4>
                <p className="text-xs text-slate-500">
                  Placed directly on dining tables and takeaway billing counters
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    "qr-tent",
                    `${CUSTOMER_LAUNCH_PLAN.qrTentCardCopy.tableTentHeadline}\n\n${CUSTOMER_LAUNCH_PLAN.qrTentCardCopy.tableTentBody}\n\nStaff 15s Script: ${CUSTOMER_LAUNCH_PLAN.qrTentCardCopy.staff15SecScript}`
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all shadow-sm"
              >
                {copiedKey === "qr-tent" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Tent Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Tent Card Headline:</span>
                <div className="text-sm font-extrabold text-slate-900">
                  {CUSTOMER_LAUNCH_PLAN.qrTentCardCopy.tableTentHeadline}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {CUSTOMER_LAUNCH_PLAN.qrTentCardCopy.tableTentBody}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                <span className="text-[10px] font-mono uppercase text-emerald-800 font-bold">
                  Cashier 15-Second Pitch Script:
                </span>
                <div className="text-xs font-bold text-emerald-950 italic">
                  "{CUSTOMER_LAUNCH_PLAN.qrTentCardCopy.staff15SecScript}"
                </div>
                <div className="text-[11px] text-slate-600">
                  Ask cashier to mention this to every customer paying their dine-in or takeaway bill.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: 5-DAY STREET TIMETABLE & PERSISTENT CHECKLIST */}
      {activeTab === "timetable" && (
        <div className="space-y-6">
          {/* Day Selector Navigation */}
          <div className="grid grid-cols-5 gap-2">
            {FIVE_DAY_STREET_TIMETABLE.map((day) => {
              const isSelected = selectedDayNumber === day.dayNumber;
              const quota = FIVE_DAY_CUMULATIVE_QUOTAS.find((q) => q.day === day.dayNumber);
              return (
                <button
                  key={day.dayNumber}
                  type="button"
                  onClick={() => setSelectedDayNumber(day.dayNumber)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? "bg-emerald-600 text-white border-emerald-700 shadow-md scale-[1.02]"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="text-xs font-black uppercase tracking-wider">Day {day.dayNumber}</div>
                  <div className={`text-[11px] font-mono mt-1 ${isSelected ? "text-emerald-100" : "text-slate-500"}`}>
                    {quota?.cumulativeRestaurants} rest · {quota?.cumulativeRiders} riders
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Day View */}
          {(() => {
            const currentDay = FIVE_DAY_STREET_TIMETABLE.find((d) => d.dayNumber === selectedDayNumber)!;
            const currentQuota = FIVE_DAY_CUMULATIVE_QUOTAS.find((q) => q.day === selectedDayNumber)!;

            return (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="text-xs font-mono uppercase text-emerald-700 font-bold mb-1">
                      Day {currentDay.dayNumber} Operational Architecture
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900">{currentDay.dayTitle}</h3>
                    <p className="text-xs text-slate-600 mt-1 max-w-2xl">{currentDay.primaryStrategicObjective}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={resetChecklist}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-700 transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reset Checklist</span>
                    </button>
                  </div>
                </div>

                {/* Day Quotas Banner */}
                <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center font-mono">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Cumulative Restaurants</div>
                    <div className="text-xl font-black text-emerald-700">
                      {currentQuota.cumulativeRestaurants} / 20
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Cumulative Riders</div>
                    <div className="text-xl font-black text-amber-600">
                      {currentQuota.cumulativeRiders} / 15
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Cumulative Leads</div>
                    <div className="text-xl font-black text-cyan-600">
                      {currentQuota.cumulativeCustomerLeads} / 500
                    </div>
                  </div>
                </div>

                {/* Hour-by-Hour Operational Timetable */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm uppercase font-mono tracking-wider">
                    Hour-by-Hour Field Timetable & Action Checklist
                  </h4>

                  {currentDay.schedule.map((slot, idx) => {
                    const taskId = `day-${currentDay.dayNumber}-slot-${idx}`;
                    const isDone = Boolean(checkedTasks[taskId]);

                    return (
                      <div
                        key={taskId}
                        onClick={() => toggleTask(taskId)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                          isDone
                            ? "bg-emerald-50/50 border-emerald-300 text-slate-700"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <button
                          type="button"
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border transition-all ${
                            isDone
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isDone && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>

                        <div className="flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {slot.timeSlot}
                            </span>
                            <span
                              className={`text-sm font-bold ${
                                isDone ? "line-through text-slate-500" : "text-slate-900"
                              }`}
                            >
                              {slot.taskTitle}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded ml-auto">
                              Owner: {slot.ownerRole}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{slot.operationalDetail}</p>
                          <div className="text-[11px] font-mono text-slate-500 pt-1">
                            <span className="font-semibold text-slate-700">Deliverable:</span> {slot.deliverable}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Nightly Audit Verification */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm uppercase font-mono tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    End-of-Day Reconciliation & Audit Protocol
                  </h4>
                  <div className="space-y-2">
                    {currentDay.endOfDayReconciliationAudit.map((audit, i) => {
                      const auditId = `day-${currentDay.dayNumber}-audit-${i}`;
                      const isDone = Boolean(checkedTasks[auditId]);

                      return (
                        <div
                          key={auditId}
                          onClick={() => toggleTask(auditId)}
                          className={`p-3 rounded-xl border text-xs flex items-center gap-3 cursor-pointer transition-all ${
                            isDone
                              ? "bg-emerald-50/60 border-emerald-300 text-slate-700"
                              : "bg-slate-50/60 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <button
                            type="button"
                            className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-all ${
                              isDone
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>
                          <span className={isDone ? "line-through text-slate-400 font-mono" : "font-mono text-slate-700"}>
                            {audit}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 6: LAUNCH CASH ENVELOPE & LEDGER */}
      {activeTab === "ledger" && (
        <div className="space-y-6">
          {/* Envelope Summary Header */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Wallet className="w-6 h-6 text-emerald-600" />
                  Launch Cash Envelope & 5-Day Working Ledger
                </h3>
                <p className="text-xs text-slate-500">
                  Strictly accounted capital reserves covering fleet guarantees, physical kits, subsidies, and field staff
                </p>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setBudgetMode("lean")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                    budgetMode === "lean"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Lean (₹65,000)
                </button>
                <button
                  type="button"
                  onClick={() => setBudgetMode("standard")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                    budgetMode === "standard"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Standard (₹85,000)
                </button>
                <button
                  type="button"
                  onClick={() => setBudgetMode("scale")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                    budgetMode === "scale"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Buffer (₹95,000)
                </button>
              </div>
            </div>

            {/* Total Budget Callout */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-mono uppercase text-emerald-400 font-bold">
                  {budgetMode.toUpperCase()} 5-DAY ALLOCATED WORKING CAPITAL
                </div>
                <div className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1">
                  {formatInrWhole(
                    budgetMode === "lean"
                      ? LAUNCH_CASH_ENVELOPE.summary.leanTotalPaise
                      : budgetMode === "scale"
                      ? LAUNCH_CASH_ENVELOPE.summary.scaleTotalPaise
                      : LAUNCH_CASH_ENVELOPE.summary.standardTotalPaise
                  )}
                </div>
              </div>
              <div className="text-right text-xs font-mono text-slate-300">
                <div>Fleet Floor Commitment: ₹37,500</div>
                <div>Contingency & Food Loss: ₹10,000</div>
              </div>
            </div>

            {/* Itemized Ledger Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Line Item</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Basis & Quota</th>
                    <th className="py-3 px-4 text-right">Budget</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {LAUNCH_CASH_ENVELOPE.items.map((item) => {
                    const amountPaise =
                      budgetMode === "lean"
                        ? item.leanBudgetPaise
                        : budgetMode === "scale"
                        ? item.scaleBudgetPaise
                        : item.standardBudgetPaise;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{item.item}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{item.notes}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[10px] text-slate-600">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 text-xs font-mono">{item.basis}</td>
                        <td className="py-3.5 px-4 text-right font-black font-mono text-slate-900 text-sm">
                          {formatInrWhole(amountPaise)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Crucial Financial Warning Notice */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1 font-mono">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Critical Unit Economics & Fleet Discipline Warning
              </div>
              <p className="leading-relaxed">
                At an average ₹42 rider payout, covering ₹37,500 entirely through per-order earnings would require roughly 893 completed deliveries. A 5-day launch with 25–60 real orders will NOT self-fund 75 guaranteed shifts. Therefore, recruit 15 riders, but stagger and activate paid shifts strictly in accordance with live demand!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
