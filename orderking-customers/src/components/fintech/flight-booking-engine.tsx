import { useState } from "react";
import {
  Plane,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  MapPin,
  Calendar,
  Users,
  Briefcase,
  Clock,
  Luggage,
  Coins,
  TrendingDown,
  CheckCircle2,
  ArrowLeftRight,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPaise } from "@/lib/money";
import {
  searchFlightQuotes,
  type FlightQuote,
  type SovereignETicket,
} from "@/lib/travel/in-app-booking-service";
import { PassengerDrawer } from "./passenger-drawer";
import { SovereignETicketModal } from "./sovereign-eticket-modal";

interface Props {
  walletBalance?: number;
  onDeductWallet?: (amount: number, description: string) => boolean;
  initialFrom?: string;
  initialTo?: string;
}

export function FlightBookingEngine({
  walletBalance = 500000,
  onDeductWallet,
  initialFrom = "New Delhi (DEL)",
  initialTo = "Mumbai (BOM)",
}: Props) {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [departureDate, setDepartureDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [passengersCount, setPassengersCount] = useState(1);
  const [cabinClass, setCabinClass] = useState<"Economy" | "Premium Economy" | "Business">("Economy");

  // Selected quote for drawer
  const [selectedQuote, setSelectedQuote] = useState<FlightQuote | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [confirmedTicket, setConfirmedTicket] = useState<SovereignETicket | null>(null);

  // Live quotes
  const quotes = searchFlightQuotes(from.trim() || "New Delhi (DEL)", to.trim() || "Mumbai (BOM)", departureDate, cabinClass);

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

  const handleOpenBooking = (quote: FlightQuote) => {
    setSelectedQuote(quote);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* Search Bar Card */}
      <div className="relative overflow-hidden rounded-3xl border border-sky-400/30 bg-gradient-to-br from-[#06122E] via-[#0B1A40] to-[#120E33] p-5 sm:p-8 shadow-xl text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-400/30 shadow-md">
              <Plane className="size-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Sovereign Domestic Flight Search
              </h2>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-300">
                <Sparkles className="size-3 text-sky-400" />
                100% In-App Direct Booking · Zero External Redirects
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-emerald-500/20 border border-emerald-400/40 px-3 py-1.5 rounded-full text-emerald-300 text-xs font-extrabold">
            <ShieldCheck className="size-4" />
            <span>₹0 Platform Desk Fee Guaranteed</span>
          </div>
        </div>

        {/* Input Fields Grid with Route Swap */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div className="bg-white/10 p-3 rounded-2xl border border-white/15 focus-within:border-sky-400 transition relative">
            <label htmlFor="flight-search-from" className="text-[10px] font-bold text-slate-300 flex items-center justify-between mb-1 uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><MapPin className="size-3 text-sky-400" /> From City / Code</span>
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
              <MapPin className="size-3 text-sky-400" /> To City / Code
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
              <Calendar className="size-3 text-sky-400" /> Departure Date
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
              <Users className="size-3 text-sky-400" /> Passengers
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
              <Briefcase className="size-3 text-sky-400" /> Cabin Class
            </label>
            <select
              id="flight-search-class"
              value={cabinClass}
              onChange={(e) => setCabinClass(e.target.value as any)}
              className="w-full bg-transparent text-sm font-black outline-none text-white cursor-pointer"
            >
              <option value="Economy" className="bg-slate-900 text-white">Economy</option>
              <option value="Premium Economy" className="bg-slate-900 text-white">Premium Economy</option>
              <option value="Business" className="bg-slate-900 text-white">Business Class</option>
            </select>
          </div>
        </div>

        {/* Quick Date Shortcuts */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400">Quick Dates:</span>
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
          <span className="text-[11px] text-sky-300 font-bold hidden sm:inline">
            Direct airline inventory with instant sovereign PNR issuance
          </span>
        </div>
      </div>

      {/* Live Carrier Quotes & Results List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <span>Available Domestic Flights ({quotes.length})</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              Zero OTA Convenience Markup
            </span>
          </h3>
          <span className="text-xs text-slate-500 font-bold hidden sm:inline">
            Direct Boarding Pass &amp; E-Ticket Issued In-App
          </span>
        </div>

        {quotes.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center space-y-3">
            <div className="size-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mx-auto">
              <Plane className="size-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">No flights matched your specific inputs</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your origin or destination city to major aviation hubs.
            </p>
            <Button
              type="button"
              onClick={() => {
                setFrom("New Delhi (DEL)");
                setTo("Mumbai (BOM)");
              }}
              className="rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs"
            >
              <RotateCcw className="size-3.5 mr-1" /> Reset to Delhi — Mumbai Express
            </Button>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3.5">
          {quotes.map((q) => {
            const totalPaiseSingle = q.baseFarePaise + q.carrierTaxesPaise;
            const totalPaiseAll = totalPaiseSingle * passengersCount;
            const totalOtaPaise = totalPaiseAll + q.otaBenchmarkFeePaise * passengersCount;

            return (
              <div
                key={q.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 hover:border-sky-400 hover:shadow-lg transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Airline & Schedule details */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-sky-100 text-sky-800">
                      {q.carrierName}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-600">
                      Flight {q.serviceNumber}
                    </span>
                    <span className="text-[11px] text-slate-400">·</span>
                    <span className="text-xs text-slate-600">{q.aircraftType}</span>
                    <span className="text-[11px] text-slate-400">·</span>
                    <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {q.stopsDisplay}
                    </span>
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                      {q.seatsAvailable} seats left
                    </span>
                  </div>

                  {/* Route & Times */}
                  <div className="flex items-center gap-4 sm:gap-6 text-sm">
                    <div>
                      <span className="text-xl font-black font-mono text-slate-900 block">{q.departureTime}</span>
                      <span className="text-xs text-slate-500 font-bold">{q.fromCode || q.fromCity}</span>
                      <span className="text-[10px] text-slate-400 block">{q.terminal}</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-slate-400 font-bold">{q.duration}</span>
                      <div className="w-16 sm:w-24 h-0.5 bg-slate-200 relative my-1">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 size-1.5 bg-sky-500 rounded-full" />
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600">Non-Stop</span>
                    </div>

                    <div>
                      <span className="text-xl font-black font-mono text-slate-900 block">{q.arrivalTime}</span>
                      <span className="text-xs text-slate-500 font-bold">{q.toCode || q.toCity}</span>
                      <span className="text-[10px] text-slate-400 block">Arrival Terminal</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                    <span className="flex items-center gap-1">
                      <Luggage className="size-3.5 text-slate-400" />
                      {q.baggageAllowance}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <CheckCircle2 className="size-3.5" /> ₹0 OrderKing Convenience Fee
                    </span>
                    <span className="flex items-center gap-1 text-amber-600 font-bold">
                      <Coins className="size-3.5" /> Earn 24K Gold or Food Cashback
                    </span>
                  </div>
                </div>

                {/* Fare & CTA */}
                <div className="md:border-l md:border-slate-100 md:pl-6 flex flex-row md:flex-col items-end justify-between md:justify-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="flex items-baseline gap-1.5 justify-end">
                      <span className="text-xl sm:text-2xl font-black font-mono text-slate-900">
                        {formatPaise(totalPaiseAll)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      for {passengersCount} traveler{passengersCount > 1 ? "s" : ""}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-extrabold mt-0.5">
                      Save {formatPaise(q.otaBenchmarkFeePaise * passengersCount)} vs OTAs
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => handleOpenBooking(q)}
                    className="h-11 px-6 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs shadow-md shadow-sky-600/20 flex items-center gap-1.5"
                  >
                    Book In-App (₹0 Fee) <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Passenger Drawer */}
      {selectedQuote && (
        <PassengerDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          quote={selectedQuote}
          passengerCount={passengersCount}
          walletBalancePaise={walletBalance}
          onDeductWallet={onDeductWallet}
          travelDate={departureDate}
          onBookingSuccess={(ticket) => {
            setConfirmedTicket(ticket);
          }}
        />
      )}

      {/* Sovereign Digital E-Ticket Modal */}
      {confirmedTicket && (
        <SovereignETicketModal
          ticket={confirmedTicket}
          onClose={() => setConfirmedTicket(null)}
        />
      )}
    </div>
  );
}
