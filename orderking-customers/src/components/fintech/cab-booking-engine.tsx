import { useState } from "react";
import {
  Car,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  Star,
  Zap,
  CheckCircle2,
  Coins,
  TrendingDown,
  Navigation,
  ArrowLeftRight,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPaise } from "@/lib/money";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  searchCabQuotes,
  type CabQuote,
  type SovereignETicket,
} from "@/lib/travel/in-app-booking-service";
import { PassengerDrawer } from "./passenger-drawer";
import { SovereignETicketModal } from "./sovereign-eticket-modal";

interface Props {
  walletBalance?: number;
  onDeductWallet?: (amount: number, description: string) => boolean;
  initialPickup?: string;
  initialDrop?: string;
}

export function CabBookingEngine({
  walletBalance = 0,
  onDeductWallet,
  initialPickup = "Terminal 3, IGI Airport (DEL)",
  initialDrop = "Connaught Place, New Delhi",
}: Props) {
  const { user } = useCurrentUserState();
  const navigate = useNavigate();
  const [pickup, setPickup] = useState(initialPickup);
  const [drop, setDrop] = useState(initialDrop);
  const [category, setCategory] = useState<"City Taxi" | "Airport Transfer" | "Intercity One-Way" | "Hourly Rental">("Airport Transfer");
  const [travelDate, setTravelDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [pickupTime, setPickupTime] = useState("10:00");

  const [selectedQuote, setSelectedQuote] = useState<CabQuote | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [confirmedTicket, setConfirmedTicket] = useState<SovereignETicket | null>(null);

  // Live cab quotes
  const quotes = searchCabQuotes(pickup.trim() || "Terminal 3, IGI Airport (DEL)", drop.trim() || "Connaught Place, New Delhi", category);

  const handleSwapLocations = () => {
    const temp = pickup;
    setPickup(drop);
    setDrop(temp);
  };

  const handleOpenBooking = (quote: CabQuote) => {
    if (!user) {
      toast.error("Authentication required: Please sign in to book cabs.");
      navigate({ to: "/login" });
      return;
    }
    setSelectedQuote(quote);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* Search Bar Card */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-br from-[#1C1304] via-[#2A1D07] to-[#120F03] p-5 sm:p-8 shadow-xl text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/30 shadow-md">
              <Car className="size-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                On-Demand Airport &amp; City Cabs
              </h2>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <Sparkles className="size-3 text-amber-400" />
                Actual fares and driver availability require an authorized provider
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-emerald-500/20 border border-emerald-400/40 px-3 py-1.5 rounded-full text-emerald-300 text-xs font-extrabold">
            <ShieldCheck className="size-4" />
            <span>Final price confirmed by cab provider</span>
          </div>
        </div>

        {/* Category Pill Switcher */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(["Airport Transfer", "City Taxi", "Intercity One-Way", "Hourly Rental"] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${
                category === cat
                  ? "bg-amber-400 text-slate-950 shadow-md"
                  : "bg-white/10 text-slate-200 hover:bg-white/20 border border-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Input Fields Grid with Location Swap */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div className="bg-white/10 p-3 rounded-2xl border border-white/15 focus-within:border-amber-400 transition relative">
            <label htmlFor="cab-search-pickup" className="text-[10px] font-bold text-slate-300 flex items-center justify-between mb-1 uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><MapPin className="size-3 text-amber-400" /> Pickup Location</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id="cab-search-pickup"
                type="text"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="w-full bg-transparent text-sm font-black outline-none text-white placeholder:text-slate-400"
                placeholder="e.g. Airport Terminal 3"
              />
              <button
                type="button"
                onClick={handleSwapLocations}
                title="Swap Pickup & Drop"
                className="size-7 rounded-lg bg-white/10 hover:bg-amber-500/30 text-amber-300 border border-white/10 flex items-center justify-center shrink-0 transition"
              >
                <ArrowLeftRight className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="bg-white/10 p-3 rounded-2xl border border-white/15 focus-within:border-amber-400 transition">
            <label htmlFor="cab-search-drop" className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
              <Navigation className="size-3 text-amber-400" /> Drop Location
            </label>
            <input
              id="cab-search-drop"
              type="text"
              value={drop}
              onChange={(e) => setDrop(e.target.value)}
              className="w-full bg-transparent text-sm font-black outline-none text-white placeholder:text-slate-400"
              placeholder="e.g. Connaught Place"
            />
          </div>

          <div className="bg-white/10 p-3 rounded-2xl border border-white/15 focus-within:border-amber-400 transition">
            <label htmlFor="cab-search-date" className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
              <Calendar className="size-3 text-amber-400" /> Date
            </label>
            <input
              id="cab-search-date"
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className="w-full bg-transparent text-sm font-black outline-none text-white"
            />
          </div>

          <div className="bg-white/10 p-3 rounded-2xl border border-white/15 focus-within:border-amber-400 transition">
            <label htmlFor="cab-search-time" className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
              <Clock className="size-3 text-amber-400" /> Pickup Time
            </label>
            <input
              id="cab-search-time"
              type="time"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="w-full bg-transparent text-sm font-black outline-none text-white"
            />
          </div>
        </div>
      </div>

      {/* Live Cab Fleet Options */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <span>Verified Driver Fleet ({quotes.length})</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              Transparent Flat Fares
            </span>
          </h3>
          <span className="text-xs text-slate-500 font-bold hidden sm:inline">
            Live driver inventory not connected
          </span>
        </div>

        {quotes.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center space-y-3">
            <div className="size-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Car className="size-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Live cab availability is not connected</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Use a verified cab provider to see actual driver availability and fares.
            </p>
            <Button
              type="button"
              onClick={() => {
                setPickup("Terminal 3, IGI Airport (DEL)");
                setDrop("Connaught Place, New Delhi");
                setCategory("Airport Transfer");
              }}
              className="rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
            >
              <RotateCcw className="size-3.5 mr-1" /> Reset to Airport Transfer
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quotes.map((q) => {
            const totalFare = q.baseFarePaise + q.carrierTaxesPaise;

            return (
              <div
                key={q.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 hover:border-amber-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900">
                      {q.vehicleType}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      ETA {q.etaMinutes} mins
                    </span>
                  </div>

                  <h4 className="text-base font-black text-slate-900">
                    {q.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">{q.vehicleModel} · Up to {q.seatingCapacity} Passengers</p>

                  {/* Driver dispatch badge */}
                  <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{q.driverName}</span>
                      <span className="text-slate-500 text-[11px] font-mono">{q.vehiclePlate}</span>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                        <Star className="size-3 fill-amber-500" /> {q.driverRating}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                  <div>
                    <span className="text-xl font-black font-mono text-slate-900 block">
                      {formatPaise(totalFare)}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold block">
                      Save ₹{(q.otaBenchmarkFeePaise / 100).toFixed(0)} vs Rideshare Surge
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(drop)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => toast.success(`Opening Uber dispatch for ${pickup} ➔ ${drop}...`)}
                      className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-md inline-flex items-center gap-1.5 no-underline transition"
                    >
                      <span>Uber</span>
                      <ArrowRight className="size-3.5" />
                    </a>
                    <a
                      href="https://www.olacabs.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => toast.success(`Opening Ola Cabs dispatch...`)}
                      className="h-10 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 no-underline transition"
                    >
                      <span>Ola</span>
                      <ArrowRight className="size-3.5" />
                    </a>
                  </div>
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
          passengerCount={1}
          walletBalancePaise={walletBalance}
          onDeductWallet={onDeductWallet}
          travelDate={travelDate}
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
