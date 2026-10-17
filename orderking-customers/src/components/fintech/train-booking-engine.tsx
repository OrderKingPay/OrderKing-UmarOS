import { useState } from "react";
import {
  Train,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  MapPin,
  Calendar,
  Tag,
  Clock,
  Utensils,
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
  searchTrainQuotes,
  type TrainQuote,
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

export function TrainBookingEngine({
  walletBalance = 0,
  onDeductWallet,
  initialFrom = "New Delhi (NDLS)",
  initialTo = "Mumbai Central (MMCT)",
}: Props) {
  const { user } = useCurrentUserState();
  const navigate = useNavigate();
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [journeyDate, setJourneyDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [quota, setQuota] = useState<"GENERAL (GN)" | "TATKAL (TQ)" | "LADIES (LD)">("GENERAL (GN)");
  const [trainClass, setTrainClass] = useState<"1A" | "2A" | "3A" | "CC" | "EC" | "SL">("3A");
  const [passengersCount, setPassengersCount] = useState(1);

  // Selected quote for drawer
  const [selectedQuote, setSelectedQuote] = useState<TrainQuote | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [confirmedTicket, setConfirmedTicket] = useState<SovereignETicket | null>(null);

  // Live quotes
  const quotes = searchTrainQuotes(from.trim() || "New Delhi (NDLS)", to.trim() || "Mumbai Central (MMCT)", journeyDate, quota, trainClass);

  const handleSwapStations = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const handleSetQuickDate = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setJourneyDate(d.toISOString().split("T")[0]);
  };

  const handleOpenBooking = (quote: TrainQuote) => {
    if (!user) {
      toast.error("Authentication required: Please sign in to book train tickets.");
      navigate({ to: "/login" });
      return;
    }
    setSelectedQuote(quote);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* Search Bar Card */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-400/30 bg-gradient-to-br from-[#080E29] via-[#0E1540] to-[#1A0D36] p-5 sm:p-8 shadow-xl text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 shadow-md">
              <Train className="size-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Sovereign Indian Railways &amp; IRCTC Direct
              </h2>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                <Sparkles className="size-3 text-indigo-400" />
                Vande Bharat · Tejas Rajdhani · Shatabdi Express · Zero Extra Markup
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-emerald-500/20 border border-emerald-400/40 px-3 py-1.5 rounded-full text-emerald-300 text-xs font-extrabold">
            <ShieldCheck className="size-4" />
            <span>₹0 Platform Booking Surcharge</span>
          </div>
        </div>

        {/* Input Fields Grid with Station Swap */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div className="bg-white/10 p-3 rounded-2xl border border-white/15 focus-within:border-indigo-400 transition relative">
            <label htmlFor="train-search-from" className="text-[10px] font-bold text-slate-300 flex items-center justify-between mb-1 uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><MapPin className="size-3 text-indigo-400" /> From Station</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id="train-search-from"
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full bg-transparent text-sm font-black outline-none text-white placeholder:text-slate-400"
                placeholder="e.g. New Delhi (NDLS)"
              />
              <button
                type="button"
                onClick={handleSwapStations}
                title="Swap From & To Stations"
                className="size-7 rounded-lg bg-white/10 hover:bg-indigo-500/30 text-indigo-300 border border-white/10 flex items-center justify-center shrink-0 transition"
              >
                <ArrowLeftRight className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="bg-white/10 p-3 rounded-2xl border border-white/15 focus-within:border-indigo-400 transition">
            <label htmlFor="train-search-to" className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
              <MapPin className="size-3 text-indigo-400" /> To Station
            </label>
            <input
              id="train-search-to"
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full bg-transparent text-sm font-black outline-none text-white placeholder:text-slate-400"
              placeholder="e.g. Mumbai Central (MMCT)"
            />
          </div>

          <div className="bg-white/10 p-3 rounded-2xl border border-white/15 focus-within:border-indigo-400 transition">
            <label htmlFor="train-search-date" className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
              <Calendar className="size-3 text-indigo-400" /> Journey Date
            </label>
            <input
              id="train-search-date"
              type="date"
              value={journeyDate}
              onChange={(e) => setJourneyDate(e.target.value)}
              className="w-full bg-transparent text-sm font-black outline-none text-white"
            />
          </div>

          <div className="bg-white/10 p-3 rounded-2xl border border-white/15 focus-within:border-indigo-400 transition">
            <label htmlFor="train-search-quota" className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
              <Tag className="size-3 text-indigo-400" /> Quota
            </label>
            <select
              id="train-search-quota"
              value={quota}
              onChange={(e) => setQuota(e.target.value as any)}
              className="w-full bg-transparent text-sm font-black outline-none text-white cursor-pointer"
            >
              <option value="GENERAL (GN)" className="bg-slate-900 text-white">General (GN)</option>
              <option value="TATKAL (TQ)" className="bg-slate-900 text-white">Tatkal (TQ)</option>
              <option value="LADIES (LD)" className="bg-slate-900 text-white">Ladies (LD)</option>
            </select>
          </div>

          <div className="bg-white/10 p-3 rounded-2xl border border-white/15 focus-within:border-indigo-400 transition">
            <label htmlFor="train-search-class" className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
              <Train className="size-3 text-indigo-400" /> Class
            </label>
            <select
              id="train-search-class"
              value={trainClass}
              onChange={(e) => setTrainClass(e.target.value as any)}
              className="w-full bg-transparent text-sm font-black outline-none text-white cursor-pointer"
            >
              <option value="1A" className="bg-slate-900 text-white">AC 1st Class (1A)</option>
              <option value="2A" className="bg-slate-900 text-white">AC 2 Tier (2A)</option>
              <option value="3A" className="bg-slate-900 text-white">AC 3 Tier (3A)</option>
              <option value="CC" className="bg-slate-900 text-white">AC Chair Car (CC)</option>
              <option value="EC" className="bg-slate-900 text-white">Exec Chair Car (EC)</option>
              <option value="SL" className="bg-slate-900 text-white">Sleeper (SL)</option>
            </select>
          </div>
        </div>

        {/* Passengers count helper & quick dates */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">Travelers:</span>
            {[1, 2, 4, 6].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPassengersCount(n)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  passengersCount === n
                    ? "bg-indigo-500 text-white font-black"
                    : "bg-white/10 text-slate-200 hover:bg-white/20"
                }`}
              >
                {n} Pax
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400">Date:</span>
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
              Tomorrow (Tatkal)
            </button>
          </div>
        </div>
      </div>

      {/* Live Carrier Quotes & Results List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <span>Available Trains &amp; Live Seat Counts ({quotes.length})</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              Live Charting &amp; Platform Status
            </span>
          </h3>
          <span className="text-xs text-slate-500 font-bold hidden sm:inline">
            Official Fare Without Agent Commissions
          </span>
        </div>

        {quotes.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center space-y-3">
            <div className="size-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto">
              <Train className="size-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">No trains found for this station pair</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Please check your station codes or reset to the main trunk line.
            </p>
            <Button
              type="button"
              onClick={() => {
                setFrom("New Delhi (NDLS)");
                setTo("Mumbai Central (MMCT)");
              }}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              <RotateCcw className="size-3.5 mr-1" /> Reset to NDLS — MMCT (Rajdhani)
            </Button>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3.5">
          {quotes.map((q) => {
            const totalPaiseSingle = q.baseFarePaise + q.carrierTaxesPaise;
            const totalPaiseAll = totalPaiseSingle * passengersCount;

            return (
              <div
                key={q.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 hover:border-indigo-400 hover:shadow-lg transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Train schedule & seat status */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                      {q.serviceNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {q.title}
                    </span>
                    <span className="text-[11px] text-slate-400">·</span>
                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                      {q.availabilityStatus}
                    </span>
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      Class: {q.trainClass}
                    </span>
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                      {q.quota}
                    </span>
                  </div>

                  {/* Route & Times */}
                  <div className="flex items-center gap-4 sm:gap-6 text-sm">
                    <div>
                      <span className="text-xl font-black font-mono text-slate-900 block">{q.departureTime}</span>
                      <span className="text-xs text-slate-500 font-bold">{q.fromCode || q.fromCity}</span>
                      <span className="text-[10px] text-indigo-600 font-bold block">{q.platform}</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-slate-400 font-bold">{q.duration}</span>
                      <div className="w-16 sm:w-24 h-0.5 bg-slate-200 relative my-1">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 size-1.5 bg-indigo-500 rounded-full" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">Superfast</span>
                    </div>

                    <div>
                      <span className="text-xl font-black font-mono text-slate-900 block">{q.arrivalTime}</span>
                      <span className="text-xs text-slate-500 font-bold">{q.toCode || q.toCity}</span>
                      <span className="text-[10px] text-slate-400 block">Arrival Station</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                    <span className="flex items-center gap-1">
                      <Utensils className="size-3.5 text-slate-400" />
                      {q.pantryAvailable ? "Pantry & Meals Available" : "Pantry en route"}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <CheckCircle2 className="size-3.5" /> ₹0 OrderKing Service Fee
                    </span>
                    <span className="flex items-center gap-1 text-amber-600 font-bold">
                      <Coins className="size-3.5" /> 24K Gold or Food Cashback
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
                      for {passengersCount} traveler{passengersCount > 1 ? "s" : ""} ({q.trainClass})
                    </div>
                    <div className="text-[10px] text-emerald-700 font-extrabold mt-0.5">
                      Save ₹{(q.otaBenchmarkFeePaise * passengersCount) / 100} Agent Fee
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => handleOpenBooking(q)}
                    className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                  >
                    {user ? (
                      <>Book In-App (₹0 Fee) <ArrowRight className="size-4" /></>
                    ) : (
                      <>Sign in to Book <ArrowRight className="size-4" /></>
                    )}
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
          travelDate={journeyDate}
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
