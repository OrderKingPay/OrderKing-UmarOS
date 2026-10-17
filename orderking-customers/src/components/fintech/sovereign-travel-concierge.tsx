import { useState } from "react";
import {
  Plane,
  Train,
  Building2,
  Bus,
  ShieldCheck,
  Sparkles,
  Coins,
  UtensilsCrossed,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Copy,
  Share2,
  Compass,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPaise } from "@/lib/money";
import { toast } from "sonner";

export interface SovereignConciergeTrip {
  id: string;
  bookingType: "Train" | "Flight" | "Hotel" | "Bus";
  providerName: string;
  bookingRef: string;
  travelDate: string;
  routeOrLocation: string;
  notes: string;
  createdAt: string;
}

interface BenchmarkCategory {
  id: "flight_domestic" | "flight_intl" | "train_express" | "hotel_luxury" | "intercity_bus";
  label: string;
  sublabel: string;
  icon: typeof Plane;
  defaultBaseInr: number;
  taxRatePercent: number;
  otaBenchmarkFeeInr: number;
  carrierRebateBps: number;
}

const BENCHMARK_CATEGORIES: BenchmarkCategory[] = [
  {
    id: "flight_domestic",
    label: "Domestic Flight",
    sublabel: "Indigo, Air India, Akasa Air",
    icon: Plane,
    defaultBaseInr: 4500,
    taxRatePercent: 5,
    otaBenchmarkFeeInr: 499,
    carrierRebateBps: 200, // 2.0%
  },
  {
    id: "flight_intl",
    label: "International Flight",
    sublabel: "Emirates, Singapore Air, Qatar",
    icon: Compass,
    defaultBaseInr: 28000,
    taxRatePercent: 5,
    otaBenchmarkFeeInr: 799,
    carrierRebateBps: 250, // 2.5%
  },
  {
    id: "train_express",
    label: "Premium Train",
    sublabel: "Vande Bharat, Tejas & Rajdhani",
    icon: Train,
    defaultBaseInr: 1850,
    taxRatePercent: 5,
    otaBenchmarkFeeInr: 40,
    carrierRebateBps: 100, // 1.0%
  },
  {
    id: "hotel_luxury",
    label: "5-Star Hotel",
    sublabel: "Taj, Oberoi, ITC, Marriott",
    icon: Building2,
    defaultBaseInr: 8500,
    taxRatePercent: 18,
    otaBenchmarkFeeInr: 699,
    carrierRebateBps: 500, // 5.0%
  },
  {
    id: "intercity_bus",
    label: "Intercity Bus",
    sublabel: "IntrCity SmartBus, Volvo AC",
    icon: Bus,
    defaultBaseInr: 1200,
    taxRatePercent: 5,
    otaBenchmarkFeeInr: 65,
    carrierRebateBps: 300, // 3.0%
  },
];

export function SovereignTravelConcierge({
  onSaveTrip,
}: {
  onSaveTrip?: (trip: SovereignConciergeTrip) => void;
} = {}) {
  // Calculator State
  const [selectedCategory, setSelectedCategory] = useState<BenchmarkCategory["id"]>("flight_domestic");
  const [customFareInr, setCustomFareInr] = useState<number>(4500);
  const [passengers, setPassengers] = useState<number>(1);
  const [rebateDest, setRebateDest] = useState<"24k_gold" | "food_wallet">("24k_gold");

  // PNR Live State
  const [pnrInput, setPnrInput] = useState("");
  const [isQueryingPnr, setIsQueryingPnr] = useState(false);
  const [pnrResult, setPnrResult] = useState<any | null>(null);
  const [pnrError, setPnrError] = useState<string | null>(null);

  // Flight Radar State
  const [flightInput, setFlightInput] = useState("");
  const [isQueryingFlight, setIsQueryingFlight] = useState(false);
  const [flightResult, setFlightResult] = useState<any | null>(null);
  const [flightError, setFlightError] = useState<string | null>(null);

  const activeCategory =
    BENCHMARK_CATEGORIES.find((c) => c.id === selectedCategory) ?? BENCHMARK_CATEGORIES[0];

  // Mathematical SafeInteger Paise Calculations
  const fareInr = Math.max(100, Number.isFinite(customFareInr) ? customFareInr : activeCategory.defaultBaseInr);
  const baseFarePaise = Math.round(fareInr * 100);
  const count = Math.max(1, Math.min(10, Math.floor(passengers)));

  const baseFarePaiseTotal = baseFarePaise * count;
  const taxesPaiseTotal = Math.round((baseFarePaiseTotal * activeCategory.taxRatePercent) / 100);
  const otaFeePaiseTotal = Math.round(activeCategory.otaBenchmarkFeeInr * 100) * count;
  const otaGrossPaise = baseFarePaiseTotal + taxesPaiseTotal + otaFeePaiseTotal;

  const orderKingDeskFeePaise = 0; // Sovereign mandate: Strictly 0 paise
  const orderKingGrossPaise = baseFarePaiseTotal + taxesPaiseTotal + orderKingDeskFeePaise;
  const instantCashSavingsPaise = otaFeePaiseTotal;

  // Wholesale partner rebate: floor((baseFarePaiseTotal * carrierRebateBps) / 10,000)
  const partnerRebatePaiseTotal = Math.floor(
    (baseFarePaiseTotal * activeCategory.carrierRebateBps) / 10_000
  );

  // 24K Gold Milligram accrual at ₹7,450 / gram
  const goldRatePerGramRupees = 7450;
  const goldMilligramsAccrued = Math.round(
    ((partnerRebatePaiseTotal / 100) / goldRatePerGramRupees) * 1000
  );

  const effectiveNetCostPaise = orderKingGrossPaise - partnerRebatePaiseTotal;
  const totalCustomerAdvantagePaise = otaGrossPaise - effectiveNetCostPaise;

  const handleLookupPnr = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = pnrInput.replace(/\D/g, "");
    if (value.length !== 10) {
      setPnrError("A valid IRCTC PNR must be exactly 10 digits.");
      return;
    }
    setIsQueryingPnr(true);
    setPnrResult(null);
    setPnrError(null);
    try {
      const r = await fetch("/api/travel/pnr-status?pnr=" + encodeURIComponent(value), {
        cache: "no-store",
      });
      const body = await r.json().catch(() => null);
      if (r.ok && body?.source === "verified_provider" && body?.data) {
        setPnrResult(body.data);
      } else {
        setPnrError(
          body?.error || "Indian Railways CRIS charting status is temporarily unavailable upstream."
        );
      }
    } catch {
      setPnrError("Indian Railways CRIS charting status is temporarily unavailable upstream.");
    } finally {
      setIsQueryingPnr(false);
    }
  };

  const handleLookupFlight = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = flightInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (value.length < 3) {
      setFlightError("Enter a valid flight number (e.g. 6E204, AI805).");
      return;
    }
    setIsQueryingFlight(true);
    setFlightResult(null);
    setFlightError(null);
    try {
      const r = await fetch(
        "/api/travel/flight-tracker?flightNumber=" + encodeURIComponent(value),
        { cache: "no-store" }
      );
      const body = await r.json().catch(() => null);
      if (r.ok && body?.source === "verified_provider" && body?.data) {
        setFlightResult(body.data);
      } else {
        setFlightError(
          body?.error || "Aviation radar departure feed is temporarily unavailable upstream."
        );
      }
    } catch {
      setFlightError("Aviation radar departure feed is temporarily unavailable upstream.");
    } finally {
      setIsQueryingFlight(false);
    }
  };

  const handleSavePnrToTrips = () => {
    if (!pnrResult) return;
    const trip: SovereignConciergeTrip = {
      id: `trip-${Date.now()}`,
      bookingType: "Train",
      providerName: `${pnrResult.trainNumber || "IRCTC"} ${pnrResult.trainName || "Express"}`.trim(),
      bookingRef: pnrResult.pnr,
      travelDate: pnrResult.boardingDate || new Date().toISOString().split("T")[0],
      routeOrLocation: `${pnrResult.originStationCode || "NDLS"} ➔ ${pnrResult.destinationStationCode || "MMCT"}`,
      notes: `Class: ${pnrResult.journeyClass || "General"}, Chart: ${pnrResult.chartStatus || "CONFIRMED"}`,
      createdAt: new Date().toISOString(),
    };
    if (onSaveTrip) {
      onSaveTrip(trip);
    } else {
      try {
        const raw = window.localStorage.getItem("orderking_customer_saved_trips_v1");
        const existing = raw ? JSON.parse(raw) : [];
        window.localStorage.setItem(
          "orderking_customer_saved_trips_v1",
          JSON.stringify([trip, ...existing])
        );
      } catch {}
    }
    toast.success(`Saved PNR ${pnrResult.pnr} to My Trips & Bookings.`);
  };

  const handleSaveFlightToTrips = () => {
    if (!flightResult) return;
    const trip: SovereignConciergeTrip = {
      id: `trip-${Date.now()}`,
      bookingType: "Flight",
      providerName: `${flightResult.carrierName || "Aviation"} (${flightResult.flightNumber})`,
      bookingRef: flightResult.flightNumber,
      travelDate: new Date().toISOString().split("T")[0],
      routeOrLocation: `${flightResult.originIata || "DEL"} ➔ ${flightResult.destinationIata || "BOM"}`,
      notes: `Terminal: ${flightResult.terminal || "T3"}, Gate: ${flightResult.departureGate || "TBA"}`,
      createdAt: new Date().toISOString(),
    };
    if (onSaveTrip) {
      onSaveTrip(trip);
    } else {
      try {
        const raw = window.localStorage.getItem("orderking_customer_saved_trips_v1");
        const existing = raw ? JSON.parse(raw) : [];
        window.localStorage.setItem(
          "orderking_customer_saved_trips_v1",
          JSON.stringify([trip, ...existing])
        );
      } catch {}
    }
    toast.success(`Saved Flight ${flightResult.flightNumber} to My Trips & Bookings.`);
  };

  const handleCopyBreakdown = () => {
    const text = `OrderKing Sovereign Travel Breakdown:\nCategory: ${activeCategory.label}\nPassengers: ${count}\nBase Fare: ${formatPaise(baseFarePaiseTotal)}\nStatutory Taxes: ${formatPaise(taxesPaiseTotal)}\nLegacy OTA Markup Fee: ${formatPaise(otaFeePaiseTotal)}\nOrderKing Platform Fee: ₹0.00 (0%)\n100% Partner Wholesale Rebate: ${formatPaise(partnerRebatePaiseTotal)}\nEffective Net Cost: ${formatPaise(effectiveNetCostPaise)}\nTotal Customer Advantage: ${formatPaise(totalCustomerAdvantagePaise)}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
      toast.success("Fare comparison breakdown copied to clipboard.");
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 24K Gold Sovereign Travel Utility Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 border border-emerald-500/30 p-5 sm:p-7 text-white shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-xs font-black text-emerald-300">
              <Sparkles className="size-3.5" /> Direct Carrier Net &amp; 0% Desk Fee Guarantee
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Sovereign Travel Utility Hub
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Dominant legacy aggregators tack on ₹399–₹799 in hidden convenience fees per passenger. OrderKing charges <strong className="text-white">0% Platform Markup</strong> and passes 100% of carrier wholesale rebates directly to you in 24K gold or food cashback.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shrink-0 flex items-center gap-4">
            <div className="size-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 font-black text-xl">
              ₹0
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">OrderKing Desk Fee</p>
              <p className="text-sm font-black text-emerald-400">0% Markup · Pure Carrier Net</p>
            </div>
          </div>
        </div>
      </div>

      {/* Honest 0% Platform Desk Fee Comparison Calculator */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-emerald-600" />
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600">
                Live Mathematical Comparison
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">
              0% Platform Desk Fee Comparison Calculator
            </h3>
          </div>

          {/* Passenger Count Slider */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl">
            <label htmlFor="sovereign-pax-count" className="text-xs font-bold text-slate-600">
              Passengers:
            </label>
            <input
              id="sovereign-pax-count"
              type="range"
              min={1}
              max={8}
              value={passengers}
              onChange={(e) => setPassengers(Number(e.target.value))}
              className="accent-emerald-600 cursor-pointer w-24"
            />
            <span className="text-sm font-black text-slate-900 w-4">{passengers}</span>
          </div>
        </div>

        {/* Category Mode Switcher */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {BENCHMARK_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setCustomFareInr(cat.defaultBaseInr);
                }}
                className={`p-3 rounded-2xl border text-left transition ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Icon
                    className={`size-4 ${
                      isSelected ? "text-emerald-700" : "text-slate-600"
                    }`}
                  />
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                    {(cat.carrierRebateBps / 100).toFixed(1)}% Rebate
                  </span>
                </div>
                <p className="text-xs font-black text-slate-900 truncate">{cat.label}</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{cat.sublabel}</p>
              </button>
            );
          })}
        </div>

        {/* Fare Input Modifier */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <label htmlFor="custom-fare-input" className="text-xs font-black text-slate-800 block">
              Base Ticket / Room Fare per Unit (₹)
            </label>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Calculated in strict safe integer paise without floating point drift
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-500">₹</span>
            <input
              id="custom-fare-input"
              type="number"
              min={100}
              max={1000000}
              step={100}
              value={customFareInr}
              onChange={(e) => setCustomFareInr(Math.max(100, Number(e.target.value) || 0))}
              className="w-32 h-10 px-3 rounded-xl border border-slate-300 bg-white font-mono font-bold text-sm text-slate-900 focus:border-emerald-600 outline-none"
            />
          </div>
        </div>

        {/* Side-by-Side Comparison Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Legacy OTA Column */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-rose-700">
                Dominant Legacy Aggregator
              </span>
              <span className="text-[10px] text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded-full">
                With Convenience Markups
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Base Carrier Fare ({count} pax):</span>
                <span className="font-mono font-bold">{formatPaise(baseFarePaiseTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Statutory Taxes ({activeCategory.taxRatePercent}% GST):</span>
                <span className="font-mono font-bold">{formatPaise(taxesPaiseTotal)}</span>
              </div>
              <div className="flex justify-between text-rose-700 font-bold bg-rose-100/70 p-2.5 rounded-xl">
                <span>Aggregator Desk / Convenience Fee:</span>
                <span className="font-mono">+{formatPaise(otaFeePaiseTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Wholesale Partner Rebate:</span>
                <span className="font-medium text-slate-400">0% (Pocketed by Aggregator)</span>
              </div>
            </div>

            <div className="pt-3 border-t border-rose-200 flex justify-between items-baseline">
              <span className="text-sm font-black text-slate-900">Total Charged:</span>
              <span className="text-xl font-black font-mono text-rose-800">{formatPaise(otaGrossPaise)}</span>
            </div>
          </div>

          {/* OrderKing Sovereign Column */}
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50/50 p-5 space-y-3 ring-1 ring-emerald-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                OrderKing Sovereign Desk
              </span>
              <span className="text-[10px] text-emerald-800 font-black bg-emerald-200 px-2 py-0.5 rounded-full">
                0% Markup Guarantee
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Base Carrier Fare ({count} pax):</span>
                <span className="font-mono font-bold">{formatPaise(baseFarePaiseTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Statutory Taxes ({activeCategory.taxRatePercent}% GST):</span>
                <span className="font-mono font-bold">{formatPaise(taxesPaiseTotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-bold bg-emerald-100/70 p-2.5 rounded-xl">
                <span>OrderKing Convenience Fee:</span>
                <span className="font-mono font-black text-emerald-700">₹0 (Zero Fee)</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>100% Partner Wholesale Rebate:</span>
                <span className="font-mono">−{formatPaise(partnerRebatePaiseTotal)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-emerald-200 flex justify-between items-baseline">
              <span className="text-sm font-black text-slate-900">Effective Net Cost:</span>
              <span className="text-xl font-black font-mono text-emerald-900">
                {formatPaise(effectiveNetCostPaise)}
              </span>
            </div>
          </div>
        </div>

        {/* Rebate Choice Destination Selector */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
            Choose Your 100% Partner Wholesale Rebate Credit:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRebateDest("24k_gold")}
              className={`p-3.5 rounded-xl border text-left transition ${
                rebateDest === "24k_gold"
                  ? "border-amber-500 bg-amber-50 shadow-xs ring-1 ring-amber-400/30"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Coins className="size-4 text-amber-600" />
                <span className="text-xs font-black text-slate-900">24K Sovereign Physical Vault Gold</span>
              </div>
              <p className="text-xs text-amber-900 font-bold mt-1">
                Accrues: {goldMilligramsAccrued} mg 24K Pure Gold (@ ₹{goldRatePerGramRupees}/g)
              </p>
            </button>

            <button
              type="button"
              onClick={() => setRebateDest("food_wallet")}
              className={`p-3.5 rounded-xl border text-left transition ${
                rebateDest === "food_wallet"
                  ? "border-emerald-600 bg-emerald-50 shadow-xs ring-1 ring-emerald-400/30"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="size-4 text-emerald-600" />
                <span className="text-xs font-black text-slate-900">Instant Dining &amp; Food Wallet</span>
              </div>
              <p className="text-xs text-emerald-900 font-bold mt-1">
                Credits: {formatPaise(partnerRebatePaiseTotal)} Instant Wallet Balance
              </p>
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs font-black text-emerald-700">
            <TrendingDown className="size-4 shrink-0" />
            <span>Total Customer Advantage: {formatPaise(totalCustomerAdvantagePaise)} saved on this journey</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyBreakdown}
              className="flex-1 sm:flex-initial h-11 px-4 rounded-xl border-slate-300 text-slate-800 text-xs font-bold"
            >
              <Copy className="size-3.5 mr-1.5" /> Copy Analysis
            </Button>
          </div>
        </div>
      </div>

      {/* Direct 1-Tap IRCTC PNR Status & Live Flight Departure Tracker Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* IRCTC Live PNR */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Train className="size-5" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-900">Direct 1-Tap IRCTC PNR Status</h4>
              <p className="text-xs text-slate-500">Live Indian Railways CRIS chart &amp; berth validation</p>
            </div>
          </div>

          <form onSubmit={handleLookupPnr} className="flex gap-2">
            <input
              type="text"
              maxLength={10}
              value={pnrInput}
              onChange={(e) => setPnrInput(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 10-digit PNR"
              className="flex-1 h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono font-bold outline-none focus:border-indigo-600"
            />
            <Button
              type="submit"
              disabled={isQueryingPnr || pnrInput.length !== 10}
              className="h-11 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              {isQueryingPnr ? "Querying..." : "Check Status"}
            </Button>
          </form>

          {pnrError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{pnrError}</span>
            </div>
          )}

          {isQueryingPnr && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-4 space-y-3 animate-pulse">
              <div className="h-4 w-1/3 bg-indigo-200/60 rounded" />
              <div className="h-3 w-1/2 bg-indigo-200/40 rounded" />
              <div className="h-10 w-full bg-indigo-200/30 rounded-xl" />
            </div>
          )}

          {pnrResult && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between font-black text-slate-900">
                <span>{pnrResult.trainNumber || "IRCTC Train"} · {pnrResult.trainName || "Express"}</span>
                <span className="text-[10px] bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full font-bold">
                  {pnrResult.chartStatus || "CONFIRMED"}
                </span>
              </div>
              <p className="text-slate-600">
                {pnrResult.originStationCode || "NDLS"} ➔ {pnrResult.destinationStationCode || "DEST"} · {pnrResult.journeyClass || "General"}
              </p>
              {Array.isArray(pnrResult?.passengers) && pnrResult.passengers.length > 0 && (
                <div className="pt-2 border-t border-indigo-200/60 space-y-1">
                  {pnrResult.passengers.map((p: any, idx: number) => (
                    <div key={p?.passengerIndex ?? idx} className="flex justify-between items-center text-slate-800 font-medium">
                      <span>Passenger {p?.passengerIndex ?? idx + 1}:</span>
                      <span className="font-mono font-bold text-indigo-950 bg-white px-2 py-0.5 rounded border border-indigo-100">
                        {p?.currentStatus || "CNF"} {p?.berthType ? `(${p.berthType})` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-1 text-[11px] text-slate-500 flex justify-between items-center">
                <span>{pnrResult.expectedDeparturePlatform || "Platform TBA"}</span>
                <span className="font-bold text-emerald-700">Delay: {pnrResult.liveDelayMinutes ?? 0} mins</span>
              </div>
              <div className="pt-2 border-t border-indigo-200/60 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSavePnrToTrips}
                  className="h-8 px-3 rounded-lg border-indigo-300 text-indigo-900 bg-white hover:bg-indigo-100 text-[11px] font-bold"
                >
                  Save PNR to My Trips
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Live Flight Radar Tracker */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Plane className="size-5" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-900">Live Flight Departure Radar</h4>
              <p className="text-xs text-slate-500">Live gate, terminal, and departure tracking</p>
            </div>
          </div>

          <form onSubmit={handleLookupFlight} className="flex gap-2">
            <input
              type="text"
              maxLength={10}
              value={flightInput}
              onChange={(e) => setFlightInput(e.target.value.toUpperCase())}
              placeholder="e.g. 6E204, AI805"
              className="flex-1 h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono font-bold outline-none focus:border-cyan-600"
            />
            <Button
              type="submit"
              disabled={isQueryingFlight || flightInput.length < 3}
              className="h-11 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs"
            >
              {isQueryingFlight ? "Radar..." : "Track Flight"}
            </Button>
          </form>

          {flightError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{flightError}</span>
            </div>
          )}

          {isQueryingFlight && (
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50/30 p-4 space-y-3 animate-pulse">
              <div className="h-4 w-1/3 bg-cyan-200/60 rounded" />
              <div className="h-3 w-1/2 bg-cyan-200/40 rounded" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-10 bg-cyan-200/30 rounded-lg" />
                <div className="h-10 bg-cyan-200/30 rounded-lg" />
              </div>
            </div>
          )}

          {flightResult && (
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between font-black text-slate-900">
                <span>{flightResult.flightNumber || "Flight"} · {flightResult.carrierName || "Carrier"}</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                  {flightResult.flightStatus || "ACTIVE"}
                </span>
              </div>
              <p className="text-slate-600">
                {flightResult.originIata || "DEP"} ➔ {flightResult.destinationIata || "ARR"} · {flightResult.terminal || "Terminal TBA"}
              </p>
              <div className="pt-2 border-t border-cyan-200/60 grid grid-cols-2 gap-2 text-slate-800">
                <div className="bg-white p-2 rounded-lg border border-cyan-100">
                  <span className="text-[10px] text-slate-400 block">Boarding Gate</span>
                  <span className="font-black text-sm text-cyan-950">{flightResult.departureGate || "TBA"}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-cyan-100">
                  <span className="text-[10px] text-slate-400 block">Baggage Belt</span>
                  <span className="font-black text-sm text-cyan-950">{flightResult.baggageBelt || "TBA"}</span>
                </div>
              </div>
              <div className="pt-1 text-[11px] text-slate-500 flex justify-between items-center">
                <span>{flightResult.aircraftType || "Aircraft"}</span>
                <span className="font-bold text-emerald-700">Delay: {flightResult.delayMinutes ?? 0}m</span>
              </div>
              <div className="pt-2 border-t border-cyan-200/60 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveFlightToTrips}
                  className="h-8 px-3 rounded-lg border-cyan-300 text-cyan-950 bg-white hover:bg-cyan-100 text-[11px] font-bold"
                >
                  Save Flight to My Trips
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
