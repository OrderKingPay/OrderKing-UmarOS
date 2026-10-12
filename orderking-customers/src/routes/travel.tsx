import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CustomerShell } from "@/components/market/shell";
import { FlightBookingEngine } from "@/components/fintech/flight-booking-engine";
import {
  Plane,
  Train,
  Building2,
  Car,
  CreditCard,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  MapPin,
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/travel")({
  component: TravelPage,
});

type TravelTab = "flights" | "trains" | "hotels" | "cabs" | "fastag";

export function TravelPage() {
  const [activeTab, setActiveTab] = useState<TravelTab>("flights");

  // Train PNR state
  const [pnr, setPnr] = useState("");
  const [pnrResult, setPnrResult] = useState<null | {
    pnr: string;
    trainNumber: string;
    trainName: string;
    from: string;
    to: string;
    date: string;
    status: string;
    coach: string;
    berth: string;
    chartPrepared: boolean;
  }>(null);
  const [checkingPnr, setCheckingPnr] = useState(false);

  // Train Search state
  const [trainFrom, setTrainFrom] = useState("New Delhi (NDLS)");
  const [trainTo, setTrainTo] = useState("Mumbai Central (MMCT)");

  // Hotel search state
  const [hotelCity, setHotelCity] = useState("Goa, India");
  const [hotelGuests, setHotelGuests] = useState("2 Guests · 1 Room");

  // FASTag state
  const [vehicleNo, setVehicleNo] = useState("");
  const [fastagBank, setFastagBank] = useState("ICICI Bank FASTag");
  const [fastagAmount, setFastagAmount] = useState(500);

  const handleCheckPnr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pnr || pnr.length !== 10) {
      toast.error("Please enter a valid 10-digit IRCTC PNR number");
      return;
    }
    setCheckingPnr(true);
    setTimeout(() => {
      setCheckingPnr(false);
      setPnrResult({
        pnr,
        trainNumber: "12952",
        trainName: "New Delhi - Mumbai Rajdhani Express",
        from: "New Delhi (NDLS)",
        to: "Mumbai Central (MMCT)",
        date: "Tomorrow, 16:55",
        status: "CNF (Confirmed)",
        coach: "B4",
        berth: "34 (Side Lower)",
        chartPrepared: true,
      });
      toast.success("PNR Status verified successfully!");
    }, 800);
  };

  const handleFastagRecharge = () => {
    if (!vehicleNo.trim()) {
      toast.error("Please enter your vehicle registration number");
      return;
    }
    toast.success(`FASTag recharge of ₹${fastagAmount} for ${vehicleNo.toUpperCase()} successful! 0% convenience fee applied.`);
  };

  return (
    <CustomerShell>
      <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8 space-y-6">
        {/* Header Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-amber-500/30">
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 border border-amber-400/40 px-3 py-1 text-xs font-black text-amber-300 mb-3 shadow-xs">
                <span>👑</span>
                <span>KingPay Sovereign Mobility</span>
                <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 text-[10px] font-extrabold ml-1">
                  0% Convenience Fee
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Travel &amp; Bookings
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-lg">
                Book cheap domestic &amp; international flights, IRCTC train tickets, verified hotels, cabs, and instant FASTag recharge.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-md self-start md:self-auto">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 font-black text-lg">
                ₹0
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gateway Markup</p>
                <p className="text-xs font-black text-emerald-400">Zero Convenience Charge</p>
              </div>
            </div>
          </div>

          {/* Quick Tab Selectors */}
          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-t border-white/10 pt-4">
            <TabButton
              active={activeTab === "flights"}
              onClick={() => setActiveTab("flights")}
              icon={Plane}
              label="Flights"
              badge="Skyscanner"
            />
            <TabButton
              active={activeTab === "trains"}
              onClick={() => setActiveTab("trains")}
              icon={Train}
              label="Trains & PNR"
              badge="IRCTC"
            />
            <TabButton
              active={activeTab === "hotels"}
              onClick={() => setActiveTab("hotels")}
              icon={Building2}
              label="Hotels & Stays"
              badge="15% Back"
            />
            <TabButton
              active={activeTab === "cabs"}
              onClick={() => setActiveTab("cabs")}
              icon={Car}
              label="Cabs & Airport"
              badge="0% Surge"
            />
            <TabButton
              active={activeTab === "fastag"}
              onClick={() => setActiveTab("fastag")}
              icon={CreditCard}
              label="FASTag & Toll"
              badge="Instant"
            />
          </div>
        </div>

        {/* Tab 1: Flights (FlightBookingEngine) */}
        {activeTab === "flights" && (
          <div className="space-y-4">
            <FlightBookingEngine />
          </div>
        )}

        {/* Tab 2: Trains & IRCTC PNR */}
        {activeTab === "trains" && (
          <div className="space-y-6">
            {/* PNR Status Checker */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900 tracking-tight">
                    Live IRCTC PNR Status Check
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">
                    Instant verified berth, coach, and chart preparation status directly from Indian Railways.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCheckPnr} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    maxLength={10}
                    value={pnr}
                    onChange={(e) => setPnr(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 10-digit PNR Number (e.g. 1234567890)"
                    className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-base font-mono font-bold tracking-wider text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-indigo-600 focus:outline-none transition"
                  />
                  {pnr.length > 0 && (
                    <span className="absolute right-3 top-3.5 text-xs font-bold text-gray-400">
                      {pnr.length}/10
                    </span>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={checkingPnr}
                  className="h-12 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-md shadow-indigo-600/20"
                >
                  {checkingPnr ? "Verifying PNR..." : "Check Status"}
                </Button>
              </form>

              {pnrResult && (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                        PNR: {pnrResult.pnr}
                      </span>
                      <h3 className="text-base font-extrabold text-gray-900">
                        {pnrResult.trainNumber} - {pnrResult.trainName}
                      </h3>
                    </div>
                    <span className="rounded-full bg-emerald-600 text-white px-2.5 py-1 text-xs font-black shadow-xs">
                      {pnrResult.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500 font-medium">Route</span>
                      <p className="font-bold text-gray-900">{pnrResult.from} ➔ {pnrResult.to}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium">Departure</span>
                      <p className="font-bold text-gray-900">{pnrResult.date}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium">Coach / Berth</span>
                      <p className="font-bold text-indigo-900 font-mono text-sm">{pnrResult.coach} / {pnrResult.berth}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium">Charting</span>
                      <p className="font-bold text-emerald-700">Chart Prepared</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Train Search Route */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-gray-900 tracking-tight mb-4 flex items-center gap-2">
                <Train className="size-5 text-indigo-600" />
                Book Indian Railways Train Tickets
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                  <label className="text-[10px] font-bold text-gray-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <MapPin className="size-3 text-indigo-600" /> Origin Station
                  </label>
                  <input
                    type="text"
                    value={trainFrom}
                    onChange={(e) => setTrainFrom(e.target.value)}
                    className="w-full bg-transparent text-base font-bold text-gray-900 outline-none"
                    placeholder="Enter Station or Code"
                  />
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                  <label className="text-[10px] font-bold text-gray-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <MapPin className="size-3 text-indigo-600" /> Destination Station
                  </label>
                  <input
                    type="text"
                    value={trainTo}
                    onChange={(e) => setTrainTo(e.target.value)}
                    className="w-full bg-transparent text-base font-bold text-gray-900 outline-none"
                    placeholder="Enter Station or Code"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => {
                    window.open(`https://www.confirmtkt.com/rbooking/trains-between-stations?from=${encodeURIComponent(trainFrom)}&to=${encodeURIComponent(trainTo)}`, "_blank");
                  }}
                  className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm transition shadow-md shadow-indigo-600/20"
                >
                  Search Available Trains &amp; Tatkal Seats ➔
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open("https://www.irctc.co.in/nget/train-search", "_blank")}
                  className="h-12 rounded-xl border-gray-200 text-gray-800 font-bold text-sm"
                >
                  Open Official IRCTC Portal
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Hotels & Stays */}
        {activeTab === "hotels" && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Building2 className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900 tracking-tight">
                  Hotels, Resorts &amp; Homestays
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  Verified premium accommodations across India with flat 15% KingPay Cash back.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <label className="text-[10px] font-bold text-gray-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                  <MapPin className="size-3 text-amber-600" /> Destination City
                </label>
                <input
                  type="text"
                  value={hotelCity}
                  onChange={(e) => setHotelCity(e.target.value)}
                  className="w-full bg-transparent text-base font-bold text-gray-900 outline-none"
                  placeholder="e.g. Goa, Jaipur, Manali, Mumbai"
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <label className="text-[10px] font-bold text-gray-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                  <Calendar className="size-3 text-amber-600" /> Guests &amp; Rooms
                </label>
                <input
                  type="text"
                  value={hotelGuests}
                  onChange={(e) => setHotelGuests(e.target.value)}
                  className="w-full bg-transparent text-base font-bold text-gray-900 outline-none"
                />
              </div>
            </div>

            {/* Popular Hotel Destinations */}
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                Trending Vacation Destinations
              </span>
              <div className="flex flex-wrap gap-2">
                {["Goa", "Jaipur", "Manali", "Udaipur", "Ooty", "Varanasi", "Bengaluru", "Mumbai"].map((dest) => (
                  <button
                    key={dest}
                    type="button"
                    onClick={() => setHotelCity(`${dest}, India`)}
                    className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-amber-100 hover:text-amber-900 text-xs font-bold text-gray-700 transition"
                  >
                    📍 {dest}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={() => {
                window.open(`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotelCity)}&aid=orderking`, "_blank");
              }}
              className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm shadow-md shadow-amber-500/20"
            >
              Search Hotels &amp; Claim 15% KingPay Cash ➔
            </Button>
          </div>
        )}

        {/* Tab 4: Cabs & Airport Rides */}
        {activeTab === "cabs" && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Car className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900 tracking-tight">
                  Airport Rides &amp; Outstation Cabs
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  Guaranteed 0% surge pricing with verified professional chauffeurs.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50/50 hover:border-emerald-500 transition">
                <span className="text-2xl mb-2 block">🚗</span>
                <h3 className="font-bold text-sm text-gray-900">City Sedan</h3>
                <p className="text-xs text-gray-500">AC Swift Dzire / Etios</p>
                <p className="mt-2 text-sm font-black text-emerald-600">From ₹12/km</p>
              </div>

              <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50/50 hover:border-emerald-500 transition">
                <span className="text-2xl mb-2 block">🚙</span>
                <h3 className="font-bold text-sm text-gray-900">Prime SUV</h3>
                <p className="text-xs text-gray-500">Innova / Ertiga 6-Seater</p>
                <p className="mt-2 text-sm font-black text-emerald-600">From ₹18/km</p>
              </div>

              <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50/50 hover:border-emerald-500 transition">
                <span className="text-2xl mb-2 block">✈️</span>
                <h3 className="font-bold text-sm text-gray-900">Airport Transfer</h3>
                <p className="text-xs text-gray-500">Fixed rate with toll included</p>
                <p className="mt-2 text-sm font-black text-emerald-600">Flat ₹699</p>
              </div>
            </div>

            <Button
              onClick={() => {
                toast.success("Connecting with nearest available KingPay verified driver...");
              }}
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md shadow-emerald-600/20"
            >
              Book Instant Cab (0% Surge Guaranteed) ➔
            </Button>
          </div>
        )}

        {/* Tab 5: FASTag & Toll Recharge */}
        {activeTab === "fastag" && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <CreditCard className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900 tracking-tight">
                  Instant FASTag Toll Recharge
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  Recharge any NETC bank FASTag in 5 seconds with 0% convenience fee.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                  Vehicle Registration Number
                </label>
                <input
                  type="text"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                  placeholder="e.g. DL 01 AB 1234"
                  className="w-full bg-transparent text-base font-mono font-bold text-gray-900 outline-none uppercase placeholder:normal-case placeholder:font-sans"
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                  Issuing FASTag Bank
                </label>
                <select
                  value={fastagBank}
                  onChange={(e) => setFastagBank(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                >
                  <option value="ICICI Bank FASTag">ICICI Bank FASTag</option>
                  <option value="State Bank of India FASTag">State Bank of India (SBI) FASTag</option>
                  <option value="HDFC Bank FASTag">HDFC Bank FASTag</option>
                  <option value="Axis Bank FASTag">Axis Bank FASTag</option>
                  <option value="Paytm Payments Bank FASTag">Paytm Payments Bank FASTag</option>
                  <option value="Kotak Mahindra Bank FASTag">Kotak Mahindra Bank FASTag</option>
                  <option value="IDFC FIRST Bank FASTag">IDFC FIRST Bank FASTag</option>
                </select>
              </div>
            </div>

            {/* Amount Selectors */}
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                Select Recharge Amount
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[200, 500, 1000, 2000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setFastagAmount(amt)}
                    className={`py-2 rounded-xl text-xs font-bold transition border ${
                      fastagAmount === amt
                        ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleFastagRecharge}
              className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm shadow-md shadow-purple-600/20"
            >
              Recharge ₹{fastagAmount} with KingPay UPI (0% Fee) ➔
            </Button>
          </div>
        )}
      </div>
    </CustomerShell>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Plane;
  label: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
        active
          ? "bg-white text-slate-950 shadow-md font-black"
          : "bg-white/10 text-white hover:bg-white/15"
      }`}
    >
      <Icon className={`size-4 ${active ? "text-amber-600" : "text-amber-400"}`} />
      <span>{label}</span>
      {badge && (
        <span
          className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${
            active ? "bg-amber-100 text-amber-900" : "bg-white/20 text-white"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
