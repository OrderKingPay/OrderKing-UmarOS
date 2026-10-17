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
  Clock,
  Radio,
  CheckCircle2,
  AlertCircle,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPaise } from "@/lib/money";
import { toast } from "sonner";
import {
  LIVE_BENCHMARK_QUOTES,
  calculateSovereignFareBreakdown,
  type CarrierQuote,
  type RebateDestination,
} from "@/lib/travel/sovereign-travel-engine";

export function SovereignTravelConcierge({
  onSaveTrip,
}: {
  onSaveTrip?: (trip: any) => void;
} = {}) {
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>("fl-6e-204");
  const [passengers, setPassengers] = useState<number>(1);
  const [rebateDest, setRebateDest] = useState<RebateDestination>("24k_gold");

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

  // Booking Feedback State
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const activeQuote: CarrierQuote =
    LIVE_BENCHMARK_QUOTES.find((q) => q.id === selectedQuoteId) ?? LIVE_BENCHMARK_QUOTES[0];

  const breakdown = calculateSovereignFareBreakdown(activeQuote, passengers, rebateDest);

  const handleLookupPnr = async (e: React.FormEvent) => {
    e.preventDefault();
    const value=pnrInput.replace(/\D/g,"");
    if(value.length!==10){setPnrError("A PNR must be 10 digits.");return;}
    setIsQueryingPnr(true);setPnrResult(null);setPnrError(null);
    try{const r=await fetch("/api/travel/pnr-status?pnr="+encodeURIComponent(value),{cache:"no-store"});
      const body=await r.json().catch(()=>null);
      if(r.ok&&body?.source==="verified_provider"&&body?.data)setPnrResult(body.data);
      else setPnrError(body?.error||"Verified PNR status unavailable. Use official railway enquiry.");
    }catch{setPnrError("Verified PNR status unavailable. Use official railway enquiry.");}
    finally{setIsQueryingPnr(false);}
  };
  const handleLookupFlight = async (e: React.FormEvent) => {
    e.preventDefault();
    const value=flightInput.trim().toUpperCase().replace(/[^A-Z0-9]/g,"");
    if(value.length<3){setFlightError("Enter a valid flight number.");return;}
    setIsQueryingFlight(true);setFlightResult(null);setFlightError(null);
    try{const r=await fetch("/api/travel/flight-tracker?flightNumber="+encodeURIComponent(value),{cache:"no-store"});
      const body=await r.json().catch(()=>null);
      if(r.ok&&body?.source==="verified_provider"&&body?.data)setFlightResult(body.data);
      else setFlightError(body?.error||"Verified flight status unavailable. Use your airline.");
    }catch{setFlightError("Verified flight status unavailable. Use your airline.");}
    finally{setIsQueryingFlight(false);}
  };

  const handleSavePnrToTrips = () => {
    if (!pnrResult) return;
    const trip = {
      id: `trip-${Date.now()}`,
      bookingType: "Train" as const,
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
        window.localStorage.setItem("orderking_customer_saved_trips_v1", JSON.stringify([trip, ...existing]));
      } catch {}
    }
    toast.success(`Saved PNR ${pnrResult.pnr} to My Trips & Bookings.`);
  };

  const handleSaveFlightToTrips = () => {
    if (!flightResult) return;
    const trip = {
      id: `trip-${Date.now()}`,
      bookingType: "Flight" as const,
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
        window.localStorage.setItem("orderking_customer_saved_trips_v1", JSON.stringify([trip, ...existing]));
      } catch {}
    }
    toast.success(`Saved Flight ${flightResult.flightNumber} to My Trips & Bookings.`);
  };

  const handleConfirmSovereignBooking = () => {
    toast.info("No live supplier is connected. No booking or payment was made.");
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Hero Banner: Mathematical Superiority */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 border border-emerald-500/30 p-5 sm:p-7 text-white shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-xs font-black text-emerald-300">
              <Sparkles className="size-3.5" /> Illustrative Comparison Only
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Sovereign Travel Engine vs OTA Markups
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              MakeMyTrip and Skyscanner partner OTAs tack on ₹399–₹799 in hidden convenience fees per passenger. OrderKing charges <strong className="text-white">0% Platform Markup</strong> and routes 100% of the carrier rebate directly to you.
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

      {bookingConfirmed && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-50 p-4 text-emerald-950 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-bold">Sovereign Booking Locked &amp; Verified!</p>
              <p className="text-xs text-emerald-800">
                Saved {formatPaise(breakdown.totalCustomerAdvantagePaise)} vs OTAs. 100% partner rebate credited to{" "}
                {rebateDest === "24k_gold" ? `${breakdown.goldMilligramsAccrued} mg 24K Gold` : `${formatPaise(breakdown.foodWalletPaiseAccrued)} Food Wallet`}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBookingConfirmed(false)}
            className="text-xs font-bold text-emerald-700 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4 Direct Booking Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Radio className="size-4 text-emerald-600 animate-pulse" /> Example Fare Options — Not Bookable
          </h3>
          <span className="text-xs font-bold text-slate-500">Sample Fares Only</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {LIVE_BENCHMARK_QUOTES.map((quote) => {
            const isSelected = selectedQuoteId === quote.id;
            return (
              <button
                key={quote.id}
                type="button"
                onClick={() => setSelectedQuoteId(quote.id)}
                className={`text-left rounded-2xl p-4 transition-all border ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-50/60 shadow-md ring-2 ring-emerald-500/30"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-800">
                    {quote.mode === "flight" && <Plane className="size-3.5 text-indigo-600" />}
                    {quote.mode === "train" && <Train className="size-3.5 text-emerald-600" />}
                    {quote.mode === "hotel" && <Building2 className="size-3.5 text-amber-600" />}
                    {quote.mode === "bus" && <Bus className="size-3.5 text-rose-600" />}
                    {quote.serviceNumber}
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Inventory not verified
                  </span>
                </div>

                <h4 className="text-sm font-black text-slate-900 truncate">{quote.carrierName}</h4>
                <p className="text-xs text-slate-500 truncate mt-0.5">{quote.routeDisplay}</p>
                <p className="text-[11px] font-medium text-slate-400 mt-1">
                  {quote.departureTime} ➔ {quote.arrivalTime} · {quote.duration}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-400 line-through mr-1.5">
                      {formatPaise(quote.baseFarePaise + quote.carrierTaxesPaise + quote.otaBenchmarkFeePaise)}
                    </span>
                    <span className="text-base font-black text-slate-900">
                      {formatPaise(quote.baseFarePaise + quote.carrierTaxesPaise)}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                    Save {formatPaise(quote.otaBenchmarkFeePaise)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Net Savings & 100% Rebate Calculator */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600">
              Interactive Mathematics
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">
              Net Savings Calculator &amp; 100% Rebate Distributor
            </h3>
          </div>

          {/* Passenger Count Slider */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl">
            <label htmlFor="passengers-count" className="text-xs font-bold text-slate-600">
              Passengers:
            </label>
            <input
              id="passengers-count"
              type="range"
              min={1}
              max={6}
              value={passengers}
              onChange={(e) => setPassengers(Number(e.target.value))}
              className="accent-emerald-600 cursor-pointer w-24"
            />
            <span className="text-sm font-black text-slate-900 w-4">{passengers}</span>
          </div>
        </div>

        {/* Side-by-Side Comparison Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* OTA Column */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-rose-700">
                Traditional OTA (MakeMyTrip / Skyscanner)
              </span>
              <span className="text-xs text-rose-600 font-bold">Standard Model</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Base Carrier Fare ({passengers} pax):</span>
                <span className="font-mono font-bold">{formatPaise(breakdown.baseFarePaiseTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Aviation &amp; Railway Taxes:</span>
                <span className="font-mono font-bold">{formatPaise(breakdown.taxesPaiseTotal)}</span>
              </div>
              <div className="flex justify-between text-rose-700 font-bold bg-rose-100/70 p-2 rounded-xl">
                <span>OTA Convenience Fee:</span>
                <span className="font-mono">+{formatPaise(activeQuote.otaBenchmarkFeePaise * passengers)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>B2B Partner Rebate:</span>
                <span className="font-medium text-slate-400">0% (Pocketed by OTA)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-rose-200 flex justify-between items-baseline">
              <span className="text-sm font-black text-slate-900">Total Charged:</span>
              <span className="text-xl font-black font-mono text-rose-800">{formatPaise(breakdown.otaGrossPaise)}</span>
            </div>
          </div>

          {/* OrderKing Sovereign Column */}
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50/50 p-4 space-y-2.5 ring-1 ring-emerald-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                OrderKing Sovereign Engine
              </span>
              <span className="text-xs text-emerald-700 font-black bg-emerald-200 px-2 py-0.5 rounded-full">
                0% Markup Desk
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Base Carrier Fare ({passengers} pax):</span>
                <span className="font-mono font-bold">{formatPaise(breakdown.baseFarePaiseTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Aviation &amp; Railway Taxes:</span>
                <span className="font-mono font-bold">{formatPaise(breakdown.taxesPaiseTotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-bold bg-emerald-100/70 p-2 rounded-xl">
                <span>OrderKing Convenience Fee:</span>
                <span className="font-mono font-black text-emerald-700">₹0 (Zero Fee)</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>100% Partner Rebate Passed to You:</span>
                <span className="font-mono">−{formatPaise(breakdown.partnerRebatePaiseTotal)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-200 flex justify-between items-baseline">
              <span className="text-sm font-black text-slate-900">Effective Net Cost:</span>
              <span className="text-xl font-black font-mono text-emerald-900">
                {formatPaise(breakdown.effectiveNetCostPaise)}
              </span>
            </div>
          </div>
        </div>

        {/* Rebate Choice Destination Selector */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
            Choose Your 100% Partner Rebate Destination:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRebateDest("24k_gold")}
              className={`p-3.5 rounded-xl border text-left transition ${
                rebateDest === "24k_gold"
                  ? "border-amber-500 bg-amber-50 shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Coins className="size-4 text-amber-600" />
                <span className="text-xs font-black text-slate-900">Planned Gold Rebate (Inactive)</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Illustrative only: no gold credit or custody account has been activated.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setRebateDest("food_wallet")}
              className={`p-3.5 rounded-xl border text-left transition ${
                rebateDest === "food_wallet"
                  ? "border-emerald-600 bg-emerald-50 shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="size-4 text-emerald-600" />
                <span className="text-xs font-black text-slate-900">Planned Food Rebate (Inactive)</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Illustrative only: no money has been credited to a wallet.
              </p>
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs font-black text-emerald-700">
            <TrendingDown className="size-4" />
            Total Net Advantage: {formatPaise(breakdown.totalCustomerAdvantagePaise)} saved on this journey
          </div>

          <Button
            onClick={handleConfirmSovereignBooking}
            className="w-full sm:w-auto px-8 h-12 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-black text-sm shadow-xl"
          >
            Request Verified Quote (Unavailable) <ArrowRight className="size-4 ml-2" />
          </Button>
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
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
              {pnrError}
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
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
              {flightError}
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
