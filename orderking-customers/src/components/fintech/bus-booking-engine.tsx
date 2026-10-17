import { useState } from "react";
import {
  Bus,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  MapPin,
  Calendar,
  Tag,
  Clock,
  Wifi,
  Zap,
  CheckCircle2,
  Coins,
  TrendingDown,
  Users,
  ArrowLeftRight,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPaise } from "@/lib/money";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  searchBusQuotes,
  type BusQuote,
  type BusSeatBerth,
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

export function BusBookingEngine({
  walletBalance = 0,
  onDeductWallet,
  initialFrom = "Bengaluru (Kempegowda)",
  initialTo = "Goa (Panaji)",
}: Props) {
  const { user } = useCurrentUserState();
  const navigate = useNavigate();
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [journeyDate, setJourneyDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedDeck, setSelectedDeck] = useState<"lower" | "upper">("lower");

  // Selected quote and seats state
  const [activeQuoteId, setActiveQuoteId] = useState<string>("bs-intrcity-volvo");
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>(["L1"]);

  const [drawerQuote, setDrawerQuote] = useState<BusQuote | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [confirmedTicket, setConfirmedTicket] = useState<SovereignETicket | null>(null);

  // Live quotes
  const quotes = searchBusQuotes(from.trim() || "Bengaluru (Kempegowda)", to.trim() || "Goa (Panaji)", journeyDate);
  const currentQuote = quotes.find((q) => q.id === activeQuoteId) || quotes[0];

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

  const handleToggleSeat = (seat: BusSeatBerth) => {
    if (!seat.isAvailable) return;
    if (selectedSeatIds.includes(seat.id)) {
      if (selectedSeatIds.length === 1) return; // Keep at least 1 seat
      setSelectedSeatIds(selectedSeatIds.filter((id) => id !== seat.id));
    } else {
      if (selectedSeatIds.length >= 6) return; // max 6
      setSelectedSeatIds([...selectedSeatIds, seat.id]);
    }
  };

  const handleStartBooking = (quote: BusQuote) => {
    if (!user) {
      toast.error("Authentication required: Please sign in to book your bus tickets.");
      navigate({ to: "/login" });
      return;
    }
    setDrawerQuote(quote);
    setIsDrawerOpen(true);
  };

  const currentDeckSeats = currentQuote ? currentQuote.seats.filter((s) => s.deck === selectedDeck) : [];

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
                Sovereign Intercity AC Sleeper Buses
              </h2>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-300">
                <Sparkles className="size-3 text-rose-400" />
                Volvo Multi-Axle · Scania Diamond · NueGo Electric · 0% OTA Markups
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-emerald-500/20 border border-emerald-400/40 px-3 py-1.5 rounded-full text-emerald-300 text-xs font-extrabold">
            <ShieldCheck className="size-4" />
            <span>₹0 Booking Surcharge Guaranteed</span>
          </div>
        </div>

        {/* Input Fields Grid with Route Swap */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 items-end">
          <div className="bg-white/10 p-3 rounded-2xl border border-white/15 focus-within:border-rose-400 transition relative">
            <label htmlFor="bus-search-from" className="text-[10px] font-bold text-slate-300 flex items-center justify-between mb-1 uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><MapPin className="size-3 text-rose-400" /> Leaving From</span>
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
              <MapPin className="size-3 text-rose-400" /> Going To
            </label>
            <input
              id="bus-search-to"
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full bg-transparent text-sm font-black outline-none text-white placeholder:text-slate-400"
              placeholder="e.g. Goa (Panaji)"
            />
          </div>

          <div className="bg-white/10 p-3 rounded-2xl border border-white/15 focus-within:border-rose-400 transition">
            <label htmlFor="bus-search-date" className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
              <Calendar className="size-3 text-rose-400" /> Date of Journey
            </label>
            <input
              id="bus-search-date"
              type="date"
              value={journeyDate}
              onChange={(e) => setJourneyDate(e.target.value)}
              className="w-full bg-transparent text-sm font-black outline-none text-white"
            />
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
              onClick={() => handleSetQuickDate(2)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition"
            >
              Weekend
            </button>
          </div>
          <span className="text-[11px] text-rose-300 font-bold hidden sm:inline">
            Direct Volvo &amp; Scania Multi-Axle with interactive berth mapping
          </span>
        </div>
      </div>

      {quotes.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center space-y-3">
          <div className="size-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
            <Bus className="size-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900">No luxury sleeper buses found for this route</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Please check city names or reset to the premier Bengaluru — Goa Volvo line.
          </p>
          <Button
            type="button"
            onClick={() => {
              setFrom("Bengaluru (Kempegowda)");
              setTo("Goa (Panaji)");
            }}
            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
          >
            <RotateCcw className="size-3.5 mr-1" /> Reset to Bengaluru — Goa Volvo
          </Button>
        </div>
      )}

      {/* Main Bus Section: Quotes + Interactive Seat Layout Selector */}
      {quotes.length > 0 && currentQuote && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Quotes list */}
        <div className="lg:col-span-2 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900">
              Verified Luxury Buses ({quotes.length})
            </h3>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full">
              ₹0 RedBus Convenience Fee
            </span>
          </div>

          {quotes.map((q) => {
            const isSelected = q.id === currentQuote.id;
            const singleTotal = q.baseFarePaise + q.carrierTaxesPaise;

            return (
              <div
                key={q.id}
                onClick={() => setActiveQuoteId(q.id)}
                className={`rounded-3xl border p-5 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "border-rose-500 bg-rose-50/20 shadow-md ring-1 ring-rose-400/50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800">
                        {q.operatorName}
                      </span>
                      <span className="text-xs font-bold text-slate-600 font-mono">
                        {q.serviceNumber}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-slate-900 mt-1">
                      {q.title}
                    </h4>
                    <p className="text-xs text-slate-500">{q.busType}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xl font-black font-mono text-slate-900 block">
                      {formatPaise(singleTotal)}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-extrabold block">
                      Save ₹{(q.otaBenchmarkFeePaise / 100).toFixed(0)} vs RedBus
                    </span>
                  </div>
                </div>

                {/* Schedule timeline */}
                <div className="flex items-center gap-4 text-xs text-slate-700 py-2 border-y border-slate-100">
                  <div>
                    <span className="text-sm font-black font-mono text-slate-900 block">{q.departureTime}</span>
                    <span className="text-[11px] text-slate-500">{q.boardingPoint}</span>
                  </div>
                  <div className="flex-1 text-center font-bold text-slate-400 text-[10px]">
                    {q.duration} · Overnight
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black font-mono text-slate-900 block">{q.arrivalTime}</span>
                    <span className="text-[11px] text-slate-500">{q.droppingPoint}</span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    {q.amenities.slice(0, 3).map((a, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                        ✓ {a}
                      </span>
                    ))}
                  </div>

                  <Button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartBooking(q);
                    }}
                    className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs"
                  >
                    {user ? "Select Seats & Book In-App ➔" : "Sign in to Book ➔"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Col: Interactive Seat Layout Selector */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 block">
                  Interactive Layout
                </span>
                <h3 className="text-sm font-black text-slate-900">
                  Sleeper Berth Selector
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700">
                {selectedSeatIds.length} Berth{selectedSeatIds.length > 1 ? "s" : ""}
              </span>
            </div>

            {/* Deck Switcher */}
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectedDeck("lower")}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  selectedDeck === "lower"
                    ? "bg-white text-slate-900 shadow-xs font-black"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Lower Berth Deck
              </button>
              <button
                type="button"
                onClick={() => setSelectedDeck("upper")}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  selectedDeck === "upper"
                    ? "bg-white text-slate-900 shadow-xs font-black"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Upper Berth Deck
              </button>
            </div>

            {/* Visual Bus Interior Sleeper Layout Grid */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1">
                <span>Driver End (Front)</span>
                <span>Steering ✇</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {currentDeckSeats.map((seat) => {
                  const isChosen = selectedSeatIds.includes(seat.id);
                  const isAvailable = seat.isAvailable;

                  return (
                    <button
                      key={seat.id}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => handleToggleSeat(seat)}
                      className={`h-16 rounded-xl border p-2 flex flex-col justify-between text-left transition-all ${
                        !isAvailable
                          ? "bg-slate-200/80 border-slate-300 text-slate-400 cursor-not-allowed opacity-60"
                          : isChosen
                          ? "bg-rose-600 border-rose-700 text-white shadow-md ring-2 ring-rose-400/60"
                          : "bg-white border-slate-200 hover:border-rose-300 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-black font-mono">{seat.id}</span>
                        {seat.isWindow && (
                          <span className={`text-[9px] font-extrabold ${isChosen ? "text-rose-200" : "text-sky-600"}`}>
                            Win
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold">
                        {!isAvailable ? "Booked" : isChosen ? "Selected" : "Available"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200 text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded-md bg-white border border-slate-300" />
                  Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded-md bg-rose-600" />
                  Selected
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded-md bg-slate-200" />
                  Sold
                </span>
              </div>
            </div>

            {/* Selected Summary Card */}
            <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-3.5 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600">Selected Berths:</span>
                <span className="font-mono font-black text-rose-700">
                  {selectedSeatIds.join(", ")}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600">Total Billed (0% Fee):</span>
                <span className="font-mono font-black text-slate-900 text-sm">
                  {formatPaise((currentQuote.baseFarePaise + currentQuote.carrierTaxesPaise) * selectedSeatIds.length)}
                </span>
              </div>
              <Button
                type="button"
                onClick={() => handleStartBooking(currentQuote)}
                className="w-full h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/25"
              >
                {user ? "Proceed to In-App Checkout ➔" : "Sign in to Book In-App ➔"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Passenger Drawer */}
      {drawerQuote && (
        <PassengerDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          quote={drawerQuote}
          passengerCount={selectedSeatIds.length}
          walletBalancePaise={walletBalance}
          onDeductWallet={onDeductWallet}
          travelDate={journeyDate}
          selectedSeats={selectedSeatIds}
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
