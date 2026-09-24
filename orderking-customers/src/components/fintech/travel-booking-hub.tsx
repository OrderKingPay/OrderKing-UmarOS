import { useState } from "react";
import {
  Plane,
  Train,
  Bus,
  Car,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Award,
  Clock,
  MapPin,
  ArrowRight,
  TrendingDown,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlightBookingEngine } from "@/components/fintech/flight-booking-engine";
import { toast } from "sonner";

export type TravelTab = "flights" | "trains" | "buses" | "cabs";

type Props = {
  walletBalance: number;
  onDeductWallet: (amount: number, description: string) => boolean;
  defaultTab?: TravelTab;
};

export function TravelBookingHub({
  walletBalance,
  onDeductWallet,
  defaultTab = "flights",
}: Props) {
  const [activeTab, setActiveTab] = useState<TravelTab>(defaultTab);

  // Train search state
  const [trainOrigin, setTrainOrigin] = useState("SCL - Silchar");
  const [trainDest, setTrainDest] = useState("SDAH - Sealdah / Kolkata");
  const [trainDate, setTrainDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]!
  );
  const [trainClass, setTrainClass] = useState("3A");

  // Bus search state
  const [busOrigin, setBusOrigin] = useState("Silchar");
  const [busDest, setBusDest] = useState("Guwahati");

  // Cab search state
  const [cabOrigin, setCabOrigin] = useState("Silchar Airport (IXS)");
  const [cabDest, setCabDest] = useState("Silchar Town / NIT Silchar");

  // Train booking engine
  const handleBookTrain = (trainName: string, fare: number, status: string) => {
    if (walletBalance < fare) {
      toast.error(`Insufficient balance. Please add money to KingPay.`);
      return;
    }
    const ok = onDeductWallet(fare, `IRCTC Train Ticket: ${trainName} (${status})`);
    if (ok) {
      const pnr = `IR${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      toast.success(`🎉 IRCTC Train Ticket Confirmed! PNR: ${pnr}. ₹0 Gateway Fee charged!`);
    }
  };

  // Bus booking engine
  const handleBookBus = (busOperator: string, fare: number) => {
    if (walletBalance < fare) {
      toast.error(`Insufficient balance. Please add money to KingPay.`);
      return;
    }
    const ok = onDeductWallet(fare, `Bus Ticket: ${busOperator}`);
    if (ok) {
      toast.success(`🎉 Bus Seat Confirmed with ${busOperator}! ₹0 Convenience Fee.`);
    }
  };

  // Cab booking engine
  const handleBookCab = (cabType: string, fare: number) => {
    if (walletBalance < fare) {
      toast.error(`Insufficient balance. Please add money to KingPay.`);
      return;
    }
    const ok = onDeductWallet(fare, `Prepaid Cab Booking: ${cabType}`);
    if (ok) {
      toast.success(`🚖 Cab Confirmed! Driver assigned with Zero Surge Guarantee.`);
    }
  };

  return (
    <div className="space-y-6 text-fg">
      {/* Top Travel Navigation Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "flights", label: "Flights", icon: "✈️", badge: "Planet's Lowest" },
          { id: "trains", label: "Trains (IRCTC)", icon: "🚆", badge: "Tatkal AI Radar" },
          { id: "buses", label: "Buses", icon: "🚌", badge: "0 Fee" },
          { id: "cabs", label: "Cabs & Transfers", icon: "🚖", badge: "Zero Surge" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as TravelTab)}
            className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 font-display text-xs font-bold transition shadow-xs ${
              activeTab === tab.id
                ? "bg-primary text-white shadow-md ring-2 ring-primary/20 scale-[1.02]"
                : "bg-surface border border-border/80 text-muted hover:text-fg hover:bg-surface-2"
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            <span>{tab.label}</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[9px] font-extrabold ${
                activeTab === tab.id
                  ? "bg-white/20 text-white"
                  : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              }`}
            >
              {tab.badge}
            </span>
          </button>
        ))}
      </div>

      {/* 1. FLIGHTS TAB */}
      {activeTab === "flights" && (
        <FlightBookingEngine
          walletBalance={walletBalance}
          onDeductWallet={onDeductWallet}
        />
      )}

      {/* 2. TRAINS TAB (IRCTC TATKAL RADAR) */}
      {activeTab === "trains" && (
        <div className="space-y-5">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/50 bg-gradient-to-br from-[#061B14] via-[#0A2E22] to-[#04120D] p-5 sm:p-6 text-white shadow-xl">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-300">
                <Sparkles className="size-3.5 text-amber-400" />
                <span>IRCTC Authorized · AI Tatkal Confirmation Radar</span>
              </div>
              <h2 className="font-display text-2xl font-black">
                Book Train Tickets with{" "}
                <span className="text-emerald-400">Zero Payment Gateway Fee</span>
              </h2>
              <p className="text-xs text-slate-300 max-w-xl">
                Avoid external payment gateway charges. Check historical AI confirmation probability on waitlisted seats and book Tatkal in seconds.
              </p>
            </div>
          </div>

          {/* Search Card */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-muted uppercase block mb-1">From Station:</label>
                <select
                  value={trainOrigin}
                  onChange={(e) => setTrainOrigin(e.target.value)}
                  className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-xs font-bold text-fg"
                >
                  <option value="SCL - Silchar">SCL - Silchar</option>
                  <option value="GHY - Guwahati">GHY - Guwahati</option>
                  <option value="SDAH - Sealdah">SDAH - Sealdah</option>
                  <option value="NDLS - New Delhi">NDLS - New Delhi</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted uppercase block mb-1">To Station:</label>
                <select
                  value={trainDest}
                  onChange={(e) => setTrainDest(e.target.value)}
                  className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-xs font-bold text-fg"
                >
                  <option value="SDAH - Sealdah / Kolkata">SDAH - Sealdah / Kolkata</option>
                  <option value="GHY - Guwahati">GHY - Guwahati</option>
                  <option value="SCL - Silchar">SCL - Silchar</option>
                  <option value="NDLS - New Delhi">NDLS - New Delhi</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted uppercase block mb-1">Date:</label>
                <input
                  type="date"
                  value={trainDate}
                  onChange={(e) => setTrainDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-xs font-bold text-fg"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted uppercase block mb-1">Class:</label>
                <select
                  value={trainClass}
                  onChange={(e) => setTrainClass(e.target.value)}
                  className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-xs font-bold text-fg"
                >
                  <option value="SL">Sleeper (SL)</option>
                  <option value="3A">AC 3 Tier (3A)</option>
                  <option value="2A">AC 2 Tier (2A)</option>
                  <option value="1A">AC 1st Class (1A)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-3">
            {[
              {
                id: "tr_1",
                name: "Kanchanjunga Express (13174)",
                departure: "09:15 AM (Silchar)",
                arrival: "07:20 PM (Sealdah)",
                duration: "34h 05m",
                status: "AVAILABLE 42",
                prob: "100% Guaranteed",
                fare: 1485,
              },
              {
                id: "tr_2",
                name: "Silchar - Sealdah Special (05639)",
                departure: "01:40 PM (Silchar)",
                arrival: "11:30 PM (Sealdah)",
                duration: "33h 50m",
                status: "RAC 8",
                prob: "96% Confirmation Probability (AI)",
                fare: 1540,
              },
              {
                id: "tr_3",
                name: "Poorvottar Sampark Kranti (14037)",
                departure: "06:50 PM (Silchar)",
                arrival: "12:35 PM (New Delhi)",
                duration: "41h 45m",
                status: "WL 14",
                prob: "88% Confirmation Probability (AI)",
                fare: 2150,
              },
            ].map((train) => (
              <div
                key={train.id}
                className="rounded-2xl border border-border bg-surface p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-fg">{train.name}</h4>
                    <span className="rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 text-[10px]">
                      {train.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-1">
                    {train.departure} ➔ {train.arrival} ({train.duration})
                  </p>
                  <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                    ⚡ {train.prob}
                  </span>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/60">
                  <div className="text-right">
                    <p className="font-mono text-xl font-black text-fg">₹{train.fare}</p>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      ₹0 PG Surcharge
                    </span>
                  </div>
                  <Button
                    onClick={() => handleBookTrain(train.name, train.fare, train.status)}
                    className="bg-primary text-white font-bold text-xs px-4 py-2 rounded-xl"
                  >
                    Book Now ➔
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. BUSES TAB */}
      {activeTab === "buses" && (
        <div className="space-y-5">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/50 bg-gradient-to-br from-[#1C1204] via-[#2E1D06] to-[#120B02] p-5 sm:p-6 text-white shadow-xl">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-black text-amber-300">
                <Sparkles className="size-3.5" />
                <span>3,500+ Bus Operators · Guaranteed Lowest Seat Price</span>
              </div>
              <h2 className="font-display text-2xl font-black">
                Intercity Luxury &amp; Sleeper Buses
              </h2>
              <p className="text-xs text-slate-300 max-w-xl">
                Direct integration with state road transport (ASTC, WBTC) and top private operators (Greenline, Royal Tour, Zingbus) with ₹0 convenience fee.
              </p>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-3">
            {[
              {
                id: "bus_1",
                operator: "Greenline Travels (Volvo 9600 Multi-Axle Sleeper)",
                route: "Silchar (ISBT) ➔ Guwahati (Paltan Bazar)",
                departure: "08:00 PM",
                arrival: "05:30 AM",
                fare: 850,
                rating: "4.8 ★",
                amenities: "AC · Blanket · USB Charging · Live GPS",
              },
              {
                id: "bus_2",
                operator: "ASTC Royal BharatBenz AC Seater/Sleeper",
                route: "Silchar (ISBT) ➔ Guwahati (ISBT)",
                departure: "07:30 PM",
                arrival: "05:00 AM",
                fare: 680,
                rating: "4.6 ★",
                amenities: "Govt Certified · Punctual · Sanitized",
              },
              {
                id: "bus_3",
                operator: "Network Travels Mercedes AC Sleeper",
                route: "Silchar (Rangirkhari) ➔ Shillong ➔ Guwahati",
                departure: "09:00 PM",
                arrival: "06:15 AM",
                fare: 920,
                rating: "4.9 ★",
                amenities: "Water Bottle · Emergency SOS · CCTV",
              },
            ].map((b) => (
              <div
                key={b.id}
                className="rounded-2xl border border-border bg-surface p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-fg">{b.operator}</h4>
                    <span className="rounded bg-amber-500/15 text-amber-800 dark:text-amber-200 font-bold px-1.5 py-0.2 text-[10px]">
                      {b.rating}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">{b.route}</p>
                  <p className="text-[10px] text-muted flex items-center gap-2 mt-1">
                    <Clock className="size-3 text-primary" />
                    <span>Departs: {b.departure} · Arrives: {b.arrival}</span>
                  </p>
                  <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                    {b.amenities}
                  </span>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/60">
                  <div className="text-right">
                    <p className="font-mono text-xl font-black text-fg">₹{b.fare}</p>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      ₹0 Convenience Fee
                    </span>
                  </div>
                  <Button
                    onClick={() => handleBookBus(b.operator, b.fare)}
                    className="bg-primary text-white font-bold text-xs px-4 py-2 rounded-xl"
                  >
                    Select Seat ➔
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. CABS TAB */}
      {activeTab === "cabs" && (
        <div className="space-y-5">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-cyan-500/50 bg-gradient-to-br from-[#061820] via-[#0A2835] to-[#040F15] p-5 sm:p-6 text-white shadow-xl">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-black text-cyan-300">
                <ShieldCheck className="size-3.5" />
                <span>Verified Drivers · Zero Surge Guarantee Always</span>
              </div>
              <h2 className="font-display text-2xl font-black">
                Airport &amp; Intercity Outstation Cabs
              </h2>
              <p className="text-xs text-slate-300 max-w-xl">
                Fixed transparent pricing with zero peak hour surges. Doorstep pickup and airport drops.
              </p>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-3">
            {[
              {
                id: "cab_1",
                type: "Sedan (Dzire / Etios AC)",
                capacity: "4 Passengers + 2 Bags",
                pickup: cabOrigin,
                drop: cabDest,
                fare: 750,
                eta: "5 mins away",
              },
              {
                id: "cab_2",
                type: "SUV (Innova Crysta / Ertiga AC)",
                capacity: "6-7 Passengers + 4 Bags",
                pickup: cabOrigin,
                drop: cabDest,
                fare: 1250,
                eta: "8 mins away",
              },
              {
                id: "cab_3",
                type: "Outstation Special (Guwahati ➔ Silchar 1-Way)",
                capacity: "Dedicated Intercity Cab with Toll Included",
                pickup: "Guwahati Airport",
                drop: "Silchar Town",
                fare: 4800,
                eta: "Advance Booking Ready",
              },
            ].map((cab) => (
              <div
                key={cab.id}
                className="rounded-2xl border border-border bg-surface p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-fg">{cab.type}</h4>
                    <span className="rounded bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold px-2 py-0.5 text-[10px]">
                      {cab.eta}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">{cab.capacity}</p>
                  <p className="text-[10px] text-muted flex items-center gap-1 mt-1">
                    <MapPin className="size-3 text-primary" />
                    <span>{cab.pickup} ➔ {cab.drop}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/60">
                  <div className="text-right">
                    <p className="font-mono text-xl font-black text-fg">₹{cab.fare}</p>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      Zero Surge Guaranteed
                    </span>
                  </div>
                  <Button
                    onClick={() => handleBookCab(cab.type, cab.fare)}
                    className="bg-primary text-white font-bold text-xs px-4 py-2 rounded-xl"
                  >
                    Confirm Cab ➔
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statutory Price Match Guarantee Footer Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-center space-y-1.5">
        <div className="flex items-center justify-center gap-2 text-amber-800 dark:text-amber-200 font-bold text-xs">
          <Award className="size-4 text-amber-500" />
          <span>Planet&apos;s Lowest Price Guarantee Promise</span>
        </div>
        <p className="text-[11px] text-muted max-w-xl mx-auto">
          If you find a cheaper public flight, train, or bus ticket price anywhere on Earth within 24 hours of booking, KingPay will beat it and credit{" "}
          <span className="font-bold text-primary">2x the difference</span> in King Coins to your wallet.
        </p>
      </div>
    </div>
  );
}

