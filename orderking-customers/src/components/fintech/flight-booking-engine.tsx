import { useState, useEffect, useCallback } from "react";
import {
  Plane,
  ShieldCheck,
  MapPin,
  Calendar,
  Users,
  Briefcase,
  Luggage,
  Coins,
  CheckCircle2,
  ArrowLeftRight,
  Search,
  ExternalLink,
  ArrowUpRight,
  Globe,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPaise } from "@/lib/money";
import { toast } from "sonner";
import type { FlightOption } from "@/lib/travel/types";
import {
  buildOfficialAirlineDeepLink,
  extractAirportCode,
  isDomesticIndianRoute,
} from "@/lib/travel/airline-deep-links";
import {
  loadTravelpayoutsWhiteLabelScript,
  TP_WL_ID,
  TP_MARKER,
} from "@/lib/travel/travelpayouts-config";
import { TravelpayoutsWhiteLabel } from "./travelpayouts-white-label";

interface Props {
  walletBalance?: number;
  onDeductWallet?: (amount: number, description: string) => boolean;
  initialFrom?: string;
  initialTo?: string;
  showWhiteLabel?: boolean;
}

const OFFICIAL_CARRIERS = [
  { code: "6E", name: "IndiGo", portal: "goindigo.in" },
  { code: "AI", name: "Air India", portal: "airindia.com" },
  { code: "QP", name: "Akasa Air", portal: "akasaair.com" },
  { code: "SG", name: "SpiceJet", portal: "spicejet.com" },
];

function formatFlightTime(value: string): string {
  if (!value) return "--:--";
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (!isNaN(d.getTime())) {
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  return value.slice(11, 16) || value;
}

function formatDurationMinutes(mins: number): string {
  if (!Number.isFinite(mins) || mins <= 0) return "Direct";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function FlightBookingEngine({
  walletBalance = 0,
  initialFrom = "New Delhi (DEL)",
  initialTo = "Mumbai (BOM)",
  showWhiteLabel = false,
}: Props) {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [departureDate, setDepartureDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [passengersCount, setPassengersCount] = useState(1);
  const [cabinClass, setCabinClass] = useState<"Economy" | "Premium Economy" | "Business">("Economy");

  const [offers, setOffers] = useState<FlightOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState<string>("");
  const [hasSearched, setHasSearched] = useState(false);

  const originCode = extractAirportCode(from, "DEL");
  const destinationCode = extractAirportCode(to, "BOM");

  const runLiveFlightSearch = useCallback(async () => {
    if (!originCode || !destinationCode || originCode === destinationCode) {
      setSearchError("Origin and destination airport codes must be valid and different.");
      setOffers([]);
      return;
    }
    setLoading(true);
    setSearchError(null);
    setHasSearched(true);
    try {
      const res = await fetch("/api/travel/flight-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: originCode,
          destination: destinationCode,
          departureDate,
          passengers: passengersCount,
          cabinClass: cabinClass === "Business" ? "BUSINESS" : "ECONOMY",
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setOffers([]);
        setSearchError(json?.error || "Unable to fetch live airline fares.");
        return;
      }
      setOffers(Array.isArray(json?.data) ? json.data : []);
      setSourceName(String(json?.source || "carrier_direct_gds"));
    } catch {
      setOffers([]);
      setSearchError("Network error while querying live flight API.");
    } finally {
      setLoading(false);
    }
  }, [originCode, destinationCode, departureDate, passengersCount, cabinClass]);

  useEffect(() => {
    loadTravelpayoutsWhiteLabelScript();
    void runLiveFlightSearch();
  }, [runLiveFlightSearch]);

  const handleSwapRoute = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const handleSetQuickDate = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setDepartureDate(d.toISOString().split("T")[0]);
  };

  return (
    <div className="space-y-6 text-slate-900">
      {showWhiteLabel && (
        <TravelpayoutsWhiteLabel wlId={TP_WL_ID} marker={TP_MARKER} subId="kingpay_flight" />
      )}

      {/* Search Bar Card */}
      <div className="relative overflow-hidden rounded-3xl border border-sky-400/30 bg-gradient-to-br from-[#06122E] via-[#0B1A40] to-[#120E33] p-5 sm:p-8 shadow-xl text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-400/30 shadow-md">
              <Plane className="size-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Flights · Direct Airline Booking
              </h2>
              <p className="text-xs font-semibold text-sky-300">
                {originCode} to {destinationCode} · Official carrier checkout
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {walletBalance > 0 && (
              <div className="flex items-center gap-1.5 bg-orange-500/20 border border-orange-400/40 px-3 py-1.5 rounded-full text-orange-300 text-xs font-extrabold">
                <Coins className="size-4" />
                <span>KingPay: {formatPaise(walletBalance)}</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 px-3 py-1.5 rounded-full text-emerald-300 text-xs font-extrabold">
              <ShieldCheck className="size-4" />
              <span>Official Carrier Links</span>
            </div>
          </div>
        </div>

        {/* Route Type Indicator */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {isDomesticIndianRoute(originCode, destinationCode) ? (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 px-3 py-1 text-xs font-bold text-emerald-300">
              <span className="size-2 rounded-full bg-emerald-400" />
              Domestic India · INR Direct Airline Checkout
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 border border-sky-400/30 px-3 py-1 text-xs font-bold text-sky-300">
              <Globe className="size-3.5 text-sky-400" />
              International · Duffel / GDS Live Search
            </div>
          )}
        </div>

        {/* Input Fields Grid with Route Swap */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-end">
          <div className="bg-white/10 p-3 rounded-2xl border border-white/15 focus-within:border-sky-400 transition relative">
            <label htmlFor="flight-search-from" className="text-[10px] font-bold text-slate-300 flex items-center justify-between mb-1 uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><MapPin className="size-3 text-sky-400" /> From</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id="flight-search-from"
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full bg-transparent text-sm font-black outline-none text-white placeholder:text-slate-400"
                placeholder="e.g. New Delhi (DEL)"
              />
              <button
                type="button"
                onClick={handleSwapRoute}
                title="Swap Origin & Destination"
                className="size-7 rounded-lg bg-white/10 hover:bg-sky-500/30 text-sky-300 border border-white/10 flex items-center justify-center shrink-0 transition"
              >
                <ArrowLeftRight className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="bg-white/10 p-3 rounded-2xl border border-white/15 focus-within:border-sky-400 transition">
            <label htmlFor="flight-search-to" className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
              <MapPin className="size-3 text-sky-400" /> To
            </label>
            <input
              id="flight-search-to"
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full bg-transparent text-sm font-black outline-none text-white placeholder:text-slate-400"
              placeholder="e.g. Mumbai (BOM)"
            />
          </div>

          <div className="bg-white/10 p-3 rounded-2xl border border-white/15 focus-within:border-sky-400 transition">
            <label htmlFor="flight-search-date" className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
              <Calendar className="size-3 text-sky-400" /> Departure
            </label>
            <input
              id="flight-search-date"
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="w-full bg-transparent text-sm font-black outline-none text-white"
            />
          </div>

          <div className="bg-white/10 p-3 rounded-2xl border border-white/15 focus-within:border-sky-400 transition">
            <label htmlFor="flight-search-passengers" className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
              <Users className="size-3 text-sky-400" /> Travelers
            </label>
            <select
              id="flight-search-passengers"
              value={passengersCount}
              onChange={(e) => setPassengersCount(Number(e.target.value))}
              className="w-full bg-transparent text-sm font-black outline-none text-white cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n} className="bg-slate-900 text-white">
                  {n} Passenger{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white/10 p-3 rounded-2xl border border-white/15 focus-within:border-sky-400 transition">
            <label htmlFor="flight-search-class" className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
              <Briefcase className="size-3 text-sky-400" /> Cabin
            </label>
            <select
              id="flight-search-class"
              value={cabinClass}
              onChange={(e) => setCabinClass(e.target.value as "Economy" | "Premium Economy" | "Business")}
              className="w-full bg-transparent text-sm font-black outline-none text-white cursor-pointer"
            >
              <option value="Economy" className="bg-slate-900 text-white">Economy</option>
              <option value="Premium Economy" className="bg-slate-900 text-white">Premium Economy</option>
              <option value="Business" className="bg-slate-900 text-white">Business</option>
            </select>
          </div>

          <Button
            type="button"
            disabled={loading}
            onClick={() => void runLiveFlightSearch()}
            className="h-[58px] rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-1.5"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            <span>{loading ? "Searching..." : "Search Flights"}</span>
          </Button>
        </div>

        {/* Quick Date Shortcuts & Direct Portals Row */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400">Dates:</span>
            <button
              type="button"
              onClick={() => handleSetQuickDate(0)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleSetQuickDate(1)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => handleSetQuickDate(3)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition"
            >
              In 3 Days
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-slate-400 font-bold hidden md:inline">
              Airlines:
            </span>
            {OFFICIAL_CARRIERS.map((carrier) => {
              const link = buildOfficialAirlineDeepLink({
                carrierCode: carrier.code,
                from,
                to,
                departureDate,
                passengers: passengersCount,
                cabinClass,
              });
              return (
                <a
                  key={carrier.code}
                  href={link.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/30 text-[11px] font-bold flex items-center gap-1 transition"
                >
                  <span>{carrier.name}</span>
                  <ExternalLink className="size-2.5 opacity-70" />
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Carrier Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <span>Live Flights ({offers.length})</span>
            {sourceName && offers.length > 0 && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                {sourceName.replace(/_/g, " ")}
              </span>
            )}
          </h3>
        </div>

        {loading && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-600 flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin text-sky-600" />
            <span>Checking live carrier inventory for {originCode} to {destinationCode}...</span>
          </div>
        )}

        {!loading && searchError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
            {searchError}
          </div>
        )}

        {!loading && hasSearched && offers.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                <Plane className="size-5" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                  No live aggregator fares returned for {originCode} to {destinationCode}
                </h4>
                <p className="text-xs text-slate-500">
                  Open the official airline portal below with your exact date and passenger count pre-filled.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {OFFICIAL_CARRIERS.map((carrier) => {
                const deepLink = buildOfficialAirlineDeepLink({
                  carrierCode: carrier.code,
                  from: originCode,
                  to: destinationCode,
                  departureDate,
                  passengers: passengersCount,
                  cabinClass,
                });
                return (
                  <a
                    key={carrier.code}
                    href={deepLink.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => toast.success(`Opening ${carrier.name} (${carrier.portal})...`)}
                    className="flex flex-col justify-between p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-sky-400 hover:shadow-sm transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-slate-900">{carrier.name}</span>
                      <ExternalLink className="size-3.5 text-sky-600" />
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 mt-1">{carrier.portal}</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {!loading && offers.length > 0 && (
          <div className="grid grid-cols-1 gap-3.5">
            {offers.map((q) => {
              const totalPaiseAll = (q.pricePaise || 0) * passengersCount;
              const deepLink = buildOfficialAirlineDeepLink({
                carrierCode: q.carrierCode,
                from: originCode,
                to: destinationCode,
                departureDate,
                passengers: passengersCount,
                cabinClass,
              });
              const checkoutHref = q.bookingUrl || deepLink.bookingUrl;

              return (
                <div
                  key={q.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 hover:border-sky-400 hover:shadow-lg transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-sky-100 text-sky-800">
                        {q.carrierName}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-600">
                        {q.flightNumber}
                      </span>
                      {q.aircraftType && (
                        <span className="text-xs text-slate-600">· {q.aircraftType}</span>
                      )}
                      <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {q.directStops === 0 ? "Non-Stop" : `${q.directStops} Stop${q.directStops > 1 ? "s" : ""}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6 text-sm">
                      <div>
                        <span className="text-xl font-black font-mono text-slate-900 block">
                          {formatFlightTime(q.departureTime)}
                        </span>
                        <span className="text-xs text-slate-500 font-bold">{originCode}</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-slate-400 font-bold">
                          {formatDurationMinutes(q.durationMinutes)}
                        </span>
                        <div className="w-16 sm:w-24 h-0.5 bg-slate-200 relative my-1">
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 size-1.5 bg-sky-500 rounded-full" />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600">
                          {q.directStops === 0 ? "Direct" : `${q.directStops} Stop`}
                        </span>
                      </div>

                      <div>
                        <span className="text-xl font-black font-mono text-slate-900 block">
                          {formatFlightTime(q.arrivalTime)}
                        </span>
                        <span className="text-xs text-slate-500 font-bold">{destinationCode}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                      {q.baggageAllowance && (
                        <span className="flex items-center gap-1">
                          <Luggage className="size-3.5 text-slate-400" />
                          {q.baggageAllowance}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-emerald-600 font-bold">
                        <CheckCircle2 className="size-3.5" /> Live API Fare
                      </span>
                    </div>
                  </div>

                  <div className="md:border-l md:border-slate-100 md:pl-6 flex flex-row md:flex-col items-end justify-between md:justify-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 block">
                        {totalPaiseAll > 0 ? formatPaise(totalPaiseAll) : "Live Fare"}
                      </span>
                      <div className="text-[11px] text-slate-400">
                        {passengersCount} traveler{passengersCount > 1 ? "s" : ""}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col gap-2 items-end sm:items-center md:items-end w-full md:w-auto">
                      <a
                        href={checkoutHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => toast.success(`Redirecting to ${q.carrierName} checkout...`)}
                        className="inline-flex items-center justify-center gap-1.5 h-11 px-5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs shadow-md transition w-full sm:w-auto text-center"
                      >
                        <span>Book Now</span>
                        <ExternalLink className="size-3.5 shrink-0" />
                      </a>
                      <a
                        href={deepLink.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-sky-700 transition-colors"
                      >
                        <span>Open {deepLink.portalName}</span>
                        <ArrowUpRight className="size-3" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
