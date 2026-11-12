import { useState, useEffect, useCallback } from "react";
import {
  Bus,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Calendar,
  ArrowLeftRight,
  Search,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPaise } from "@/lib/money";
import { toast } from "sonner";
import type { BusOption } from "@/lib/travel/types";

interface Props {
  walletBalance?: number;
  onDeductWallet?: (amount: number, description: string) => boolean;
  initialFrom?: string;
  initialTo?: string;
}

function cleanCityName(raw: string): string {
  return raw.replace(/\(.*\)/, "").trim();
}

export function BusBookingEngine({
  initialFrom = "Bengaluru (Kempegowda)",
  initialTo = "Goa (Panaji)",
}: Props) {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [journeyDate, setJourneyDate] = useState(() => new Date().toISOString().split("T")[0]);

  const [buses, setBuses] = useState<BusOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const sourceCity = cleanCityName(from) || "Bengaluru";
  const destinationCity = cleanCityName(to) || "Goa";
  const redBusDeepLink = `https://www.redbus.in/bus-tickets/${encodeURIComponent(sourceCity.toLowerCase())}-to-${encodeURIComponent(destinationCity.toLowerCase())}?onward=${journeyDate}`;

  const runLiveBusSearch = useCallback(async () => {
    if (!sourceCity || !destinationCity || sourceCity.toLowerCase() === destinationCity.toLowerCase()) {
      setSearchError("Source city and destination city must be valid and different.");
      setBuses([]);
      return;
    }
    setLoading(true);
    setSearchError(null);
    setHasSearched(true);
    try {
      const res = await fetch("/api/travel/bus-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceCity,
          destinationCity,
          journeyDate,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setBuses([]);
        setSearchError(json?.error || "Unable to search bus inventory.");
        return;
      }
      setBuses(Array.isArray(json?.data) ? json.data : []);
    } catch {
      setBuses([]);
      setSearchError("Network error while querying live bus API.");
    } finally {
      setLoading(false);
    }
  }, [sourceCity, destinationCity, journeyDate]);

  useEffect(() => {
    void runLiveBusSearch();
  }, [runLiveBusSearch]);

  const handleSwapRoute = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const handleSetQuickDate = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setJourneyDate(d.toISOString().split("T")[0]);
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* Search Bar Card */}
      <div className="relative overflow-hidden rounded-3xl border border-rose-400/30 bg-gradient-to-br from-[#1C0614] via-[#2A0A1C] to-[#120626] p-5 sm:p-8 shadow-xl text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-400/30 shadow-md">
              <Bus className="size-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Buses &amp; Intercity Coaches
              </h2>
              <p className="text-xs font-semibold text-rose-300">
                {sourceCity} to {destinationCity} · redBus &amp; operator booking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-emerald-500/20 border border-emerald-400/40 px-3 py-1.5 rounded-full text-emerald-300 text-xs font-extrabold">
            <ShieldCheck className="size-4" />
            <span>Direct Operator Booking</span>
          </div>
        </div>

        {/* Input Fields Grid with Route Swap */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div className="bg-white/10 p-3 rounded-2xl border border-white/15 focus-within:border-rose-400 transition relative">
            <label htmlFor="bus-search-from" className="text-[10px] font-bold text-slate-300 flex items-center justify-between mb-1 uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><MapPin className="size-3 text-rose-400" /> From City</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id="bus-search-from"
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full bg-transparent text-sm font-black outline-none text-white placeholder:text-slate-400"
                placeholder="e.g. Bengaluru"
              />
              <button
                type="button"
                onClick={handleSwapRoute}
                title="Swap From & To Locations"
                className="size-7 rounded-lg bg-white/10 hover:bg-rose-500/30 text-rose-300 border border-white/10 flex items-center justify-center shrink-0 transition"
              >
                <ArrowLeftRight className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="bg-white/10 p-3 rounded-2xl border border-white/15 focus-within:border-rose-400 transition">
            <label htmlFor="bus-search-to" className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
              <MapPin className="size-3 text-rose-400" /> To City
            </label>
            <input
              id="bus-search-to"
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full bg-transparent text-sm font-black outline-none text-white placeholder:text-slate-400"
              placeholder="e.g. Goa"
            />
          </div>

          <div className="bg-white/10 p-3 rounded-2xl border border-white/15 focus-within:border-rose-400 transition">
            <label htmlFor="bus-search-date" className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
              <Calendar className="size-3 text-rose-400" /> Journey Date
            </label>
            <input
              id="bus-search-date"
              type="date"
              value={journeyDate}
              onChange={(e) => setJourneyDate(e.target.value)}
              className="w-full bg-transparent text-sm font-black outline-none text-white"
            />
          </div>

          <Button
            type="button"
            disabled={loading}
            onClick={() => void runLiveBusSearch()}
            className="h-[58px] rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs shadow-lg flex items-center justify-center gap-1.5"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            <span>{loading ? "Searching..." : "Search Buses"}</span>
          </Button>
        </div>

        {/* Quick Date Shortcuts */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
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
              onClick={() => handleSetQuickDate(2)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition"
            >
              Weekend
            </button>
          </div>
          <a
            href={redBusDeepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-300 hover:text-white transition"
          >
            <span>Open on redBus</span>
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>

      {loading && (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-600 flex items-center justify-center gap-2">
          <Loader2 className="size-4 animate-spin text-rose-600" />
          <span>Checking live bus operators for {sourceCity} to {destinationCity}...</span>
        </div>
      )}

      {!loading && searchError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
          {searchError}
        </div>
      )}

      {!loading && hasSearched && buses.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="size-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <Bus className="size-5" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900">
                No live API bus schedules returned for {sourceCity} to {destinationCity}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                View real-time seat layouts and state RTC / private coaches on redBus for {journeyDate}.
              </p>
            </div>
          </div>
          <a
            href={redBusDeepLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => toast.success(`Opening redBus for ${sourceCity} to ${destinationCity}...`)}
            className="h-11 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs inline-flex items-center justify-center gap-1.5 no-underline shrink-0 transition"
          >
            <span>Search on redBus</span>
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      )}

      {!loading && buses.length > 0 && (
        <div className="space-y-3.5">
          <h3 className="text-base font-black text-slate-900">
            Live Buses ({buses.length})
          </h3>
          {buses.map((q) => (
            <div
              key={q.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 hover:border-rose-400 hover:shadow-md transition-all duration-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 inline-block mb-1">
                    {q.operatorName}
                  </span>
                  <p className="text-xs text-slate-600 font-semibold">{q.busType}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xl font-black font-mono text-slate-900 block">
                    {q.farePaise > 0 ? formatPaise(q.farePaise) : "Live Fare"}
                  </span>
                  {q.availableSeats > 0 && (
                    <span className="text-[11px] font-bold text-emerald-700">
                      {q.availableSeats} seats left
                    </span>
                  )}
                </div>
              </div>

              {(q.departureTime || q.arrivalTime) && (
                <div className="flex items-center gap-4 text-xs text-slate-700 py-2 border-y border-slate-100">
                  <div>
                    <span className="text-sm font-black font-mono text-slate-900 block">
                      {q.departureTime || "--:--"}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {q.boardingPoints?.[0] || sourceCity}
                    </span>
                  </div>
                  <div className="flex-1 text-center font-bold text-slate-400 text-[10px]">
                    {q.durationMinutes > 0
                      ? `${Math.floor(q.durationMinutes / 60)}h ${q.durationMinutes % 60}m`
                      : "Direct"}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black font-mono text-slate-900 block">
                      {q.arrivalTime || "--:--"}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {q.droppingPoints?.[0] || destinationCity}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-3 flex items-center justify-end">
                <a
                  href={q.bookingUrl || redBusDeepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => toast.success(`Opening ${q.operatorName} on redBus...`)}
                  className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs inline-flex items-center gap-1.5 no-underline transition"
                >
                  <span>Select Seats on redBus</span>
                  <ArrowRight className="size-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
