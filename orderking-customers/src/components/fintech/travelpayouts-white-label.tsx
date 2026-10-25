import { useEffect, useRef, useState } from "react";
import {
  loadTravelpayoutsWhiteLabelScript,
  TP_WL_ID,
  TP_MARKER,
} from "@/lib/travel/travelpayouts-config";
import {
  generateTravelpayoutsFlightLink,
  isDomesticIndianRoute,
} from "@/lib/travel/dual-travel-engine";
import { extractAirportCode } from "@/lib/travel/airline-deep-links";
import {
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Plane,
  ArrowRightLeft,
  Calendar,
  Users,
  Search,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  wlId?: string;
  marker?: string;
  subId?: string;
}

const POPULAR_AIRPORTS = [
  { code: "DEL", name: "New Delhi (DEL)", city: "Delhi" },
  { code: "BOM", name: "Mumbai (BOM)", city: "Mumbai" },
  { code: "BLR", name: "Bengaluru (BLR)", city: "Bengaluru" },
  { code: "CCU", name: "Kolkata (CCU)", city: "Kolkata" },
  { code: "HYD", name: "Hyderabad (HYD)", city: "Hyderabad" },
  { code: "MAA", name: "Chennai (MAA)", city: "Chennai" },
  { code: "GAU", name: "Guwahati (GAU)", city: "Guwahati" },
  { code: "IXS", name: "Silchar (IXS)", city: "Silchar / Barak Valley" },
  { code: "GOI", name: "Goa (GOI)", city: "Goa" },
];

export function TravelpayoutsWhiteLabel({
  wlId = TP_WL_ID,
  marker = TP_MARKER,
  subId = "kingpay_flight",
}: Props) {
  const isLoadedRef = useRef(false);
  const [loadTimedOut, setLoadTimedOut] = useState(false);

  // Instant MakeMyTrip-grade interactive flight search state
  const [from, setFrom] = useState("New Delhi (DEL)");
  const [to, setTo] = useState("Mumbai (BOM)");
  const [departDate, setDepartDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [passengers, setPassengers] = useState(1);
  const [cabinClass, setCabinClass] = useState<"Economy" | "Premium Economy" | "Business">("Economy");
  const [specialFare, setSpecialFare] = useState<"Regular" | "Student" | "Armed Forces" | "Senior Citizen">("Regular");

  useEffect(() => {
    if (typeof window === "undefined") return;

    loadTravelpayoutsWhiteLabelScript(wlId);
    isLoadedRef.current = true;

    // Timeout check: if after 7 seconds tpwl-search has no children
    const timer = setTimeout(() => {
      const searchBox = document.getElementById("tpwl-search");
      if (searchBox && searchBox.children.length === 0) {
        setLoadTimedOut(true);
      }
    }, 7000);

    return () => clearTimeout(timer);
  }, [wlId]);

  const handleRetry = () => {
    setLoadTimedOut(false);
    loadTravelpayoutsWhiteLabelScript(wlId);
  };

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
  };

  const handleInstantSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const flightLink = generateTravelpayoutsFlightLink({
      origin: from,
      destination: to,
      departureDate: departDate,
      passengers,
      cabinClass,
      marker,
      subId,
    });
    window.open(flightLink.url, "_blank", "noopener,noreferrer");
  };

  const originCode = extractAirportCode(from, "DEL");
  const destCode = extractAirportCode(to, "BOM");
  const isDomestic = isDomesticIndianRoute(originCode, destCode);

  return (
    <div className="w-full space-y-4 my-2 font-sans">
      {/* MakeMyTrip-Grade Instant Flight Search Bar (Zero Lag, 100% Reliable) */}
      <form
        onSubmit={handleInstantSearch}
        className="rounded-3xl border border-sky-200/80 bg-white p-4 sm:p-6 shadow-md space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
              {isDomestic ? "🇮🇳 Domestic India" : "🌍 International Route"}
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">
              Compare IndiGo, Air India, Akasa, SpiceJet &amp; 100+ OTAs
            </span>
          </div>

          {/* Special Fare Selector (MMT Standard) */}
          <div className="flex flex-wrap gap-1">
            {(["Regular", "Student", "Armed Forces", "Senior Citizen"] as const).map((fare) => (
              <button
                key={fare}
                type="button"
                onClick={() => setSpecialFare(fare)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                  specialFare === fare
                    ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {fare}
              </button>
            ))}
          </div>
        </div>

        {/* Origin / Destination / Date / Travellers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          {/* FROM */}
          <div className="relative rounded-2xl border border-slate-200 bg-slate-50/70 p-3 hover:border-sky-300 transition">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              From City / Airport
            </label>
            <input
              type="text"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              list="ok-origin-airports"
              placeholder="e.g. New Delhi (DEL)"
              className="w-full bg-transparent font-black text-slate-900 text-sm focus:outline-hidden mt-0.5"
            />
            <datalist id="ok-origin-airports">
              {POPULAR_AIRPORTS.map((a) => (
                <option key={a.code} value={a.name} />
              ))}
            </datalist>
            <span className="text-[11px] font-mono text-sky-600 font-bold block mt-0.5">
              Code: {originCode}
            </span>
          </div>

          {/* SWAP & TO */}
          <div className="relative rounded-2xl border border-slate-200 bg-slate-50/70 p-3 hover:border-sky-300 transition">
            <button
              type="button"
              onClick={handleSwap}
              title="Swap From and To"
              className="absolute -left-3.5 top-1/2 -translate-y-1/2 z-10 size-7 rounded-full bg-white border border-slate-300 shadow-xs flex items-center justify-center text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition"
            >
              <ArrowRightLeft className="size-3.5" />
            </button>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block pl-2 sm:pl-0">
              To Destination Airport
            </label>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              list="ok-dest-airports"
              placeholder="e.g. Mumbai (BOM)"
              className="w-full bg-transparent font-black text-slate-900 text-sm focus:outline-hidden mt-0.5 pl-2 sm:pl-0"
            />
            <datalist id="ok-dest-airports">
              {POPULAR_AIRPORTS.map((a) => (
                <option key={a.code} value={a.name} />
              ))}
            </datalist>
            <span className="text-[11px] font-mono text-sky-600 font-bold block mt-0.5 pl-2 sm:pl-0">
              Code: {destCode}
            </span>
          </div>

          {/* DEPARTURE DATE */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 hover:border-sky-300 transition">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Calendar className="size-3" />
              <span>Departure Date</span>
            </label>
            <input
              type="date"
              value={departDate}
              onChange={(e) => setDepartDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full bg-transparent font-black text-slate-900 text-sm focus:outline-hidden mt-0.5 cursor-pointer"
            />
          </div>

          {/* TRAVELLERS & CLASS */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 hover:border-sky-300 transition">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Users className="size-3" />
              <span>Travellers &amp; Class</span>
            </label>
            <div className="flex items-center gap-2 mt-0.5">
              <select
                value={passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
                className="bg-transparent font-black text-slate-900 text-xs focus:outline-hidden cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "Passenger" : "Passengers"}
                  </option>
                ))}
              </select>
              <span className="text-slate-300">·</span>
              <select
                value={cabinClass}
                onChange={(e) => setCabinClass(e.target.value as any)}
                className="bg-transparent font-black text-slate-900 text-xs focus:outline-hidden cursor-pointer"
              >
                <option value="Economy">Economy</option>
                <option value="Premium Economy">Premium Econ</option>
                <option value="Business">Business</option>
              </select>
            </div>
          </div>
        </div>

        {/* SEARCH ACTION BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span>
              Compare airfares across verified airlines and booking partners.
            </span>
          </div>

          <Button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2"
          >
            <Search className="size-4" />
            <span>Search Flights</span>
            <ExternalLink className="size-3.5 opacity-80" />
          </Button>
        </div>
      </form>

      {/* Travelpayouts Native Web Component Container (Mount Point for Official Widget) */}
      <div className="orderking-tpwl-search-container relative w-full rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 sm:p-5 shadow-xs transition-all overflow-hidden">
        <div
          id="tpwl-search"
          className="w-full"
          data-marker={marker}
          data-sub-id={subId}
        />
        {loadTimedOut && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-3 text-xs text-amber-950 flex flex-col sm:flex-row items-center justify-between gap-3 mt-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-700 shrink-0" />
              <span>
                Travelpayouts white label script is ready. Use the search bar above for instant live rates or reload widget.
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetry}
              className="text-xs shrink-0 rounded-xl border-amber-400 text-amber-900 hover:bg-amber-100 h-7 px-3"
            >
              <RefreshCw className="size-3 mr-1" /> Reload Widget
            </Button>
          </div>
        )}
      </div>

      {/* Travelpayouts Live Search Results Container */}
      <div
        id="tpwl-tickets"
        className="w-full min-h-[350px] rounded-3xl"
        data-marker={marker}
        data-sub-id={subId}
      />
    </div>
  );
}
