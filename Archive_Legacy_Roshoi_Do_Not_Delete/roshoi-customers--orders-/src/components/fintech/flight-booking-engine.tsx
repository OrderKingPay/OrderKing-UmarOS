import { useState } from "react";
import {
  Plane,
  Calendar,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Award,
  Download,
  Share2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Info,
  Clock,
  Luggage,
  Utensils,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export type Airport = {
  code: string;
  city: string;
  name: string;
  country: string;
  nearbyHub?: string;
  isInternational?: boolean;
};

export const POPULAR_AIRPORTS: Airport[] = [
  { code: "IXS", city: "Silchar", name: "Kumbhirgram Airport", country: "India" },
  { code: "GAU", city: "Guwahati", name: "Lokpriya Gopinath Bordoloi Intl", country: "India" },
  { code: "CCU", city: "Kolkata", name: "Netaji Subhash Chandra Bose Intl", country: "India" },
  { code: "DEL", city: "New Delhi", name: "Indira Gandhi International", country: "India" },
  { code: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji Maharaj Intl", country: "India" },
  { code: "BLR", city: "Bengaluru", name: "Kempegowda International", country: "India" },
  { code: "HYD", city: "Hyderabad", name: "Rajiv Gandhi International", country: "India" },
  { code: "MAA", city: "Chennai", name: "Chennai International", country: "India" },
  { code: "DXB", city: "Dubai", name: "Dubai International", country: "UAE", isInternational: true },
  { code: "BKK", city: "Bangkok", name: "Suvarnabhumi Airport", country: "Thailand", isInternational: true },
  { code: "SIN", city: "Singapore", name: "Singapore Changi Airport", country: "Singapore", isInternational: true },
  { code: "LHR", city: "London", name: "Heathrow Airport", country: "UK", isInternational: true },
];

export type ConcessionFareType = "regular" | "student" | "defence" | "senior" | "corporate";

export type FlightResult = {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: "Non-stop" | "1 Stop" | "2 Stops";
  layoverCity?: string;
  baseFare: number;
  taxes: number;
  kingPayPrice: number; // Wholesale GDS Net + ₹0 Convenience Fee
  competitorPrice: number; // MakeMyTrip / EaseMyTrip (includes ₹499 fee + markups)
  savingsAmount: number;
  isSplitTicket?: boolean;
  isHiddenCity?: boolean;
  concessionAvailable?: boolean;
  cabinBaggage: string;
  checkInBaggage: string;
  mealIncluded: boolean;
};

type Props = {
  walletBalance: number;
  onDeductWallet: (amount: number, description: string) => boolean;
};

export function FlightBookingEngine({ walletBalance, onDeductWallet }: Props) {
  // Search state
  const [tripType, setTripType] = useState<"one_way" | "round_trip">("one_way");
  const [originAirport, setOriginAirport] = useState<string>("IXS");
  const [destinationAirport, setDestinationAirport] = useState<string>("CCU");
  const [departureDate, setDepartureDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]!
  );
  const [passengers, setPassengers] = useState<number>(1);
  const [concession, setConcession] = useState<ConcessionFareType>("regular");
  const [enableSplitTicket, setEnableSplitTicket] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Booking Modal State
  const [selectedFlight, setSelectedFlight] = useState<FlightResult | null>(null);
  const [addTravelInsurance, setAddTravelInsurance] = useState<boolean>(true);
  const [addMeal, setAddMeal] = useState<boolean>(false);
  const [addExtraBaggage, setAddExtraBaggage] = useState<boolean>(false);
  const [passengerName, setPassengerName] = useState<string>("Hasan Choudhury");
  const [passengerAge, setPassengerAge] = useState<string>("28");
  const [passengerGender, setPassengerGender] = useState<"Male" | "Female" | "Other">("Male");
  const [contactMobile, setContactMobile] = useState<string>("9876543210");
  const [isBooking, setIsBooking] = useState<boolean>(false);

  // Confirmed e-Ticket Modal
  const [confirmedTicket, setConfirmedTicket] = useState<{
    pnr: string;
    flight: FlightResult;
    passenger: string;
    totalPaid: number;
    savings: number;
    qrToken: string;
  } | null>(null);

  // Generate realistic flight results based on origin & destination
  const generateFlightResults = (): FlightResult[] => {
    const isDomestic =
      !POPULAR_AIRPORTS.find((a) => a.code === originAirport)?.isInternational &&
      !POPULAR_AIRPORTS.find((a) => a.code === destinationAirport)?.isInternational;

    let baseA = 2450;
    let baseB = 2950;
    let baseC = 3400;

    if (!isDomestic) {
      baseA = 12500;
      baseB = 14800;
      baseC = 16200;
    } else if (
      (originAirport === "DEL" && destinationAirport === "BOM") ||
      (originAirport === "BOM" && destinationAirport === "DEL")
    ) {
      baseA = 3100;
      baseB = 3650;
      baseC = 4100;
    }

    // Apply concession discounts
    let concessionMultiplier = 1.0;
    if (concession === "student") concessionMultiplier = 0.85; // 15% off base
    if (concession === "defence") concessionMultiplier = 0.5; // 50% off base
    if (concession === "senior") concessionMultiplier = 0.5; // 50% off base

    const taxes = isDomestic ? 450 : 2200;

    const calcKingPay = (base: number) => Math.round(base * concessionMultiplier + taxes);
    const calcCompetitor = (kpPrice: number) => kpPrice + 499 + 350; // ₹499 convenience fee + ₹350 OTA retail markup

    return [
      {
        id: "fl_1",
        airline: "IndiGo",
        airlineCode: "6E",
        flightNumber: "6E-2084",
        departureAirport: originAirport,
        arrivalAirport: destinationAirport,
        departureTime: "07:30 AM",
        arrivalTime: "08:45 AM",
        duration: "1h 15m",
        stops: "Non-stop",
        baseFare: Math.round(baseA * concessionMultiplier),
        taxes,
        kingPayPrice: calcKingPay(baseA),
        competitorPrice: calcCompetitor(calcKingPay(baseA)),
        savingsAmount: calcCompetitor(calcKingPay(baseA)) - calcKingPay(baseA),
        cabinBaggage: "7 kg",
        checkInBaggage: concession === "student" ? "25 kg (Student +10kg)" : "15 kg",
        mealIncluded: concession === "corporate",
      },
      {
        id: "fl_2",
        airline: "Air India",
        airlineCode: "AI",
        flightNumber: "AI-754",
        departureAirport: originAirport,
        arrivalAirport: destinationAirport,
        departureTime: "11:15 AM",
        arrivalTime: "12:35 PM",
        duration: "1h 20m",
        stops: "Non-stop",
        baseFare: Math.round(baseB * concessionMultiplier),
        taxes,
        kingPayPrice: calcKingPay(baseB),
        competitorPrice: calcCompetitor(calcKingPay(baseB)),
        savingsAmount: calcCompetitor(calcKingPay(baseB)) - calcKingPay(baseB),
        cabinBaggage: "7 kg",
        checkInBaggage: concession === "student" ? "25 kg (Student +10kg)" : "15 kg",
        mealIncluded: true,
      },
      {
        id: "fl_3",
        airline: "Akasa Air",
        airlineCode: "QP",
        flightNumber: "QP-1492",
        departureAirport: originAirport,
        arrivalAirport: destinationAirport,
        departureTime: "03:40 PM",
        arrivalTime: "05:00 PM",
        duration: "1h 20m",
        stops: "Non-stop",
        baseFare: Math.round(baseC * concessionMultiplier),
        taxes,
        kingPayPrice: calcKingPay(baseC),
        competitorPrice: calcCompetitor(calcKingPay(baseC)),
        savingsAmount: calcCompetitor(calcKingPay(baseC)) - calcKingPay(baseC),
        cabinBaggage: "7 kg",
        checkInBaggage: concession === "student" ? "25 kg (Student +10kg)" : "15 kg",
        mealIncluded: false,
      },
      // Split-ticket / Skiplagged special deal
      ...(enableSplitTicket
        ? [
            {
              id: "fl_split",
              airline: "Smart Split-PNR (IndiGo + SpiceJet)",
              airlineCode: "SPLIT",
              flightNumber: "6E-312 / SG-881",
              departureAirport: originAirport,
              arrivalAirport: destinationAirport,
              departureTime: "06:15 AM",
              arrivalTime: "09:30 AM",
              duration: "3h 15m",
              stops: "1 Stop" as const,
              layoverCity: originAirport === "IXS" ? "Guwahati (GAU)" : "Kolkata (CCU)",
              baseFare: Math.round(baseA * 0.8 * concessionMultiplier),
              taxes: Math.round(taxes * 0.9),
              kingPayPrice: Math.round((baseA * 0.8 * concessionMultiplier + taxes * 0.9)),
              competitorPrice: calcCompetitor(calcKingPay(baseA)) + 650,
              savingsAmount:
                calcCompetitor(calcKingPay(baseA)) + 650 -
                Math.round(baseA * 0.8 * concessionMultiplier + taxes * 0.9),
              isSplitTicket: true,
              cabinBaggage: "7 kg",
              checkInBaggage: "15 kg",
              mealIncluded: false,
            },
          ]
        : []),
    ];
  };

  const flightResults = generateFlightResults();

  const handleSearch = () => {
    if (originAirport === destinationAirport) {
      toast.error("Origin and destination airports cannot be the same.");
      return;
    }
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      toast.success(
        `✈️ Found 4 flights with Guaranteed Lowest Fares & ₹0 Convenience Fee!`
      );
    }, 450);
  };

  const handleBookFlight = () => {
    if (!selectedFlight) return;

    let totalAmount = selectedFlight.kingPayPrice * passengers;
    if (addTravelInsurance) totalAmount += 199 * passengers;
    if (addMeal) totalAmount += 250 * passengers;
    if (addExtraBaggage) totalAmount += 950 * passengers;

    if (walletBalance < totalAmount) {
      toast.error(
        `Insufficient wallet balance. Total payable is ₹${totalAmount}. Please top up your KingPay wallet.`
      );
      return;
    }

    setIsBooking(true);

    setTimeout(() => {
      const ok = onDeductWallet(
        totalAmount,
        `Confirmed Flight Ticket: ${selectedFlight.airlineCode}-${selectedFlight.flightNumber} (${selectedFlight.departureAirport}➔${selectedFlight.arrivalAirport})`
      );

      if (ok) {
        const pnr = `KP${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        setConfirmedTicket({
          pnr,
          flight: selectedFlight,
          passenger: passengerName,
          totalPaid: totalAmount,
          savings: selectedFlight.savingsAmount * passengers + 499, // includes waived convenience fee
          qrToken: `BOARDING-PASS-${pnr}-${selectedFlight.departureAirport}-${selectedFlight.arrivalAirport}`,
        });
        toast.success(`🎉 Flight Confirmed! PNR: ${pnr}. Boarding Pass Ready!`);
      }

      setIsBooking(false);
      setSelectedFlight(null);
    }, 1100);
  };

  return (
    <div className="space-y-6 text-fg">
      {/* 1. HERO BANNER: PLANET'S LOWEST PRICE FLIGHT GUARANTEE */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/50 bg-gradient-to-br from-[#0A1628] via-[#112544] to-[#070D18] p-5 sm:p-7 text-white shadow-2xl">
        {/* Glow Effects */}
        <div className="absolute -top-20 -right-20 size-60 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 size-52 rounded-full bg-amber-500/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-black text-cyan-300 ring-1 ring-cyan-400/40">
              <Sparkles className="size-3.5 text-amber-400 animate-spin" />
              <span>GDS Direct Wholesale Rates · ₹0 Convenience Fee</span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight">
              Fly Anywhere at the{" "}
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-200 bg-clip-text text-transparent">
                Planet&apos;s Lowest Price
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Bypass retail OTA markups. We stream live GDS consolidator wholesale fares with{" "}
              <span className="font-bold text-emerald-400">₹0 Convenience Fee</span> (saving you ₹499–₹799 per ticket vs MakeMyTrip / EaseMyTrip) + instant Split-Ticketing optimizer.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <CheckCircle2 className="size-4" />
                <span>₹0 Convenience Fee Always</span>
              </span>
              <span className="flex items-center gap-1 text-amber-300 font-bold">
                <Award className="size-4" />
                <span>2x Difference Price Match Guarantee</span>
              </span>
              <span className="flex items-center gap-1 text-cyan-300 font-bold">
                <ShieldCheck className="size-4" />
                <span>Instant PNR &amp; DGCA Protected</span>
              </span>
            </div>
          </div>

          {/* Real-Time Live Savings Badge */}
          <div className="rounded-2xl border border-amber-400/40 bg-gradient-to-b from-amber-500/15 to-surface/40 p-4 text-center space-y-1 shadow-lg shrink-0">
            <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
              Average Traveler Savings
            </span>
            <p className="font-mono text-3xl font-black text-white">
              ₹850 – ₹2,400
            </p>
            <p className="text-[11px] text-emerald-400 font-semibold">
              Per Booking with KingPay
            </p>
          </div>
        </div>
      </div>

      {/* 2. FLIGHT SEARCH COCKPIT */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4">
        {/* Trip Type & Concession Fare Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
          {/* Trip Type */}
          <div className="flex items-center gap-1 rounded-xl bg-surface-2 p-1 border border-border/60 text-xs font-bold">
            <button
              type="button"
              onClick={() => setTripType("one_way")}
              className={`rounded-lg px-3 py-1.5 transition ${
                tripType === "one_way"
                  ? "bg-primary text-white shadow-xs"
                  : "text-muted hover:text-fg"
              }`}
            >
              One Way
            </button>
            <button
              type="button"
              onClick={() => setTripType("round_trip")}
              className={`rounded-lg px-3 py-1.5 transition ${
                tripType === "round_trip"
                  ? "bg-primary text-white shadow-xs"
                  : "text-muted hover:text-fg"
              }`}
            >
              Round Trip
            </button>
          </div>

          {/* Concession Fare Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold scrollbar-none">
            <span className="text-muted text-[11px] mr-1">Special Fare:</span>
            {[
              { id: "regular", label: "Regular", icon: "✈️" },
              { id: "student", label: "Student (15% Off + 10kg)", icon: "🎓" },
              { id: "defence", label: "Armed Forces (50% Off)", icon: "🪖" },
              { id: "senior", label: "Senior Citizen (50% Off)", icon: "🧓" },
              { id: "corporate", label: "Corporate SME", icon: "💼" },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setConcession(c.id as ConcessionFareType)}
                className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 transition ${
                  concession === c.id
                    ? "bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-400 font-bold"
                    : "bg-surface-2 text-muted border border-border/60 hover:text-fg"
                }`}
              >
                <span>{c.icon}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Airport Selectors & Date Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Origin */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted uppercase">From Airport:</label>
            <select
              value={originAirport}
              onChange={(e) => setOriginAirport(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm font-bold text-fg focus:border-primary focus:outline-none"
            >
              {POPULAR_AIRPORTS.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.city} ({a.code}) - {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Destination */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted uppercase">To Airport:</label>
            <select
              value={destinationAirport}
              onChange={(e) => setDestinationAirport(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm font-bold text-fg focus:border-primary focus:outline-none"
            >
              {POPULAR_AIRPORTS.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.city} ({a.code}) - {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Departure Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted uppercase">Departure Date:</label>
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm font-bold text-fg focus:border-primary focus:outline-none"
            />
          </div>

          {/* Passengers & Search Button */}
          <div className="flex items-end gap-2">
            <div className="w-24 space-y-1">
              <label className="text-[11px] font-bold text-muted uppercase">Seats:</label>
              <select
                value={passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm font-bold text-fg focus:border-primary focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? "Adult" : "Adults"}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="flex-1 bg-primary text-white hover:bg-primary/90 font-bold py-2 text-sm rounded-xl shadow-md h-10"
            >
              {isSearching ? "Finding Lowest Rates..." : "Search Lowest Fares ➔"}
            </Button>
          </div>
        </div>

        {/* Split-Ticketing Optimizer Toggle */}
        <div className="flex items-center justify-between rounded-xl bg-surface-2 p-3 text-xs border border-border/60">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <div>
              <span className="font-bold text-fg">Split-Ticketing &amp; Hidden-City Radar</span>
              <p className="text-[10px] text-muted">
                Analyzes multi-airline combinations and layover splits to beat single round-trip fares.
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enableSplitTicket}
              onChange={(e) => setEnableSplitTicket(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-muted/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>
      </div>

      {/* 3. FLIGHT RESULTS MATRIX (WITH DIRECT COMPARISON) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-fg">
            Available Flights for {originAirport} ➔ {destinationAirport} ({flightResults.length} options)
          </span>
          <span className="text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="size-3.5" />
            <span>Convenience Fee: ₹0 (Waived for You)</span>
          </span>
        </div>

        <div className="space-y-3">
          {flightResults.map((flight) => (
            <div
              key={flight.id}
              className={`relative overflow-hidden rounded-2xl border transition-all p-4 sm:p-5 ${
                flight.isSplitTicket
                  ? "border-emerald-500/60 bg-gradient-to-r from-emerald-500/5 via-surface to-surface shadow-md"
                  : "border-border bg-surface hover:border-primary/50 shadow-sm"
              }`}
            >
              {flight.isSplitTicket && (
                <div className="absolute top-0 right-0 rounded-bl-xl bg-emerald-600 px-3 py-0.5 text-[10px] font-black text-white uppercase tracking-wider shadow-sm">
                  ⚡ Smart Split-Ticket Deal (Lowest Price)
                </div>
              )}

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Airline & Flight Details */}
                <div className="flex items-center gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-surface-2 border border-border text-lg font-black text-primary shadow-xs">
                    {flight.airlineCode === "SPLIT" ? "⚡" : flight.airlineCode}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-fg">{flight.airline}</h4>
                      <span className="font-mono text-xs text-muted">#{flight.flightNumber}</span>
                      {concession !== "regular" && (
                        <span className="rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 text-[9px] font-bold">
                          {concession.toUpperCase()} UNLOCKED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted mt-1">
                      <span className="flex items-center gap-1">
                        <Luggage className="size-3.5" />
                        <span>Cabin: {flight.cabinBaggage} · Check-in: {flight.checkInBaggage}</span>
                      </span>
                      {flight.mealIncluded && (
                        <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                          <Utensils className="size-3.5" />
                          <span>Meal Included</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Departure / Arrival Timeline */}
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div>
                    <p className="font-mono text-base font-black text-fg">{flight.departureTime}</p>
                    <p className="text-[11px] font-semibold text-muted">{flight.departureAirport}</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-mono text-muted">{flight.duration}</span>
                    <div className="w-16 h-0.5 bg-border relative my-1">
                      <Plane className="size-3 text-primary absolute -top-1.5 left-1/2 -translate-x-1/2" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600">{flight.stops}</span>
                    {flight.layoverCity && (
                      <span className="text-[9px] text-muted">via {flight.layoverCity}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-mono text-base font-black text-fg">{flight.arrivalTime}</p>
                    <p className="text-[11px] font-semibold text-muted">{flight.arrivalAirport}</p>
                  </div>
                </div>

                {/* Price Matrix Comparison & Booking Action */}
                <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-border/60">
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-[11px] text-muted line-through">
                        ₹{flight.competitorPrice.toLocaleString("en-IN")}
                      </span>
                      <span className="rounded bg-rose-500/10 text-rose-600 px-1.5 py-0.2 text-[10px] font-bold">
                        Save ₹{flight.savingsAmount}
                      </span>
                    </div>
                    <p className="font-mono text-2xl font-black text-fg">
                      ₹{flight.kingPayPrice.toLocaleString("en-IN")}
                    </p>
                    <span className="text-[10px] text-emerald-600 font-bold block">
                      ⚡ ₹0 Convenience Fee
                    </span>
                  </div>

                  <Button
                    onClick={() => setSelectedFlight(flight)}
                    className="bg-primary text-white hover:bg-primary/90 font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shrink-0"
                  >
                    Book Lowest ➔
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. BOOKING & CHECKOUT MODAL */}
      {selectedFlight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border-2 border-amber-500/40 bg-surface p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✈️</span>
                <div>
                  <h3 className="font-display font-bold text-base text-fg">Confirm Flight Booking</h3>
                  <p className="text-[11px] text-muted">
                    {selectedFlight.airline} ({selectedFlight.flightNumber}) · {selectedFlight.departureAirport} ➔ {selectedFlight.arrivalAirport}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFlight(null)}
                className="rounded-full p-1 text-muted hover:bg-surface-2 transition text-lg"
              >
                ✕
              </button>
            </div>

            {/* Passenger Information */}
            <div className="space-y-3 rounded-xl border border-border/80 bg-surface-2 p-3.5 text-xs">
              <span className="font-bold text-fg block">Primary Passenger Details:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-muted block mb-1">Full Name (As on Govt ID):</label>
                  <input
                    type="text"
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-bg px-2.5 py-1.5 text-xs font-semibold text-fg"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <div className="w-20">
                    <label className="text-[10px] font-bold text-muted block mb-1">Age:</label>
                    <input
                      type="number"
                      value={passengerAge}
                      onChange={(e) => setPassengerAge(e.target.value)}
                      className="w-full rounded-lg border border-border bg-bg px-2.5 py-1.5 text-xs font-semibold text-fg"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-muted block mb-1">Gender:</label>
                    <select
                      value={passengerGender}
                      onChange={(e) => setPassengerGender(e.target.value as any)}
                      className="w-full rounded-lg border border-border bg-bg px-2.5 py-1.5 text-xs font-semibold text-fg"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted block mb-1">Mobile for Instant SMS &amp; WhatsApp Ticket:</label>
                <input
                  type="tel"
                  value={contactMobile}
                  onChange={(e) => setContactMobile(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg px-2.5 py-1.5 text-xs font-mono font-semibold text-fg"
                />
              </div>
            </div>

            {/* High-Margin Cross-Sell Add-ons */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-fg block">Optional Trip Protection &amp; Comfort:</span>

              {/* 1. Travel Insurance (High Margin for Platform) */}
              <label className="flex items-center justify-between rounded-xl border border-border/80 bg-surface-2 p-3 cursor-pointer hover:border-primary transition">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={addTravelInsurance}
                    onChange={(e) => setAddTravelInsurance(e.target.checked)}
                    className="size-4 rounded text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="font-bold text-fg">Digit Travel Protection Shield (+₹199)</span>
                    <p className="text-[10px] text-muted">
                      ₹5,00,000 emergency medical + ₹10,000 delay reimbursement + lost baggage cover.
                    </p>
                  </div>
                </div>
                <span className="rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 text-[10px]">
                  Recommended
                </span>
              </label>

              {/* 2. Hot Meal */}
              <label className="flex items-center justify-between rounded-xl border border-border/80 bg-surface-2 p-3 cursor-pointer hover:border-primary transition">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={addMeal}
                    onChange={(e) => setAddMeal(e.target.checked)}
                    className="size-4 rounded text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="font-bold text-fg">Inflight Hot Meal &amp; Beverage (+₹250)</span>
                    <p className="text-[10px] text-muted">Chef-curated fresh hot meal on board.</p>
                  </div>
                </div>
              </label>

              {/* 3. Extra Baggage */}
              <label className="flex items-center justify-between rounded-xl border border-border/80 bg-surface-2 p-3 cursor-pointer hover:border-primary transition">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={addExtraBaggage}
                    onChange={(e) => setAddExtraBaggage(e.target.checked)}
                    className="size-4 rounded text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="font-bold text-fg">Extra 5 kg Prepaid Baggage (+₹950)</span>
                    <p className="text-[10px] text-muted">Save 50% vs airport counter baggage rates.</p>
                  </div>
                </div>
              </label>
            </div>

            {/* Price Breakdown */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 text-xs space-y-2">
              <div className="flex justify-between text-muted">
                <span>Base Fare ({passengers} Passenger{passengers > 1 ? "s" : ""}):</span>
                <span className="font-mono">₹{(selectedFlight.baseFare * passengers).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Airport Taxes &amp; Security:</span>
                <span className="font-mono">₹{(selectedFlight.taxes * passengers).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Convenience Fee:</span>
                <span>₹0 (100% Waived)</span>
              </div>
              {addTravelInsurance && (
                <div className="flex justify-between text-muted">
                  <span>Digit Travel Insurance:</span>
                  <span className="font-mono">+₹{199 * passengers}</span>
                </div>
              )}
              {addMeal && (
                <div className="flex justify-between text-muted">
                  <span>Inflight Meal:</span>
                  <span className="font-mono">+₹{250 * passengers}</span>
                </div>
              )}
              {addExtraBaggage && (
                <div className="flex justify-between text-muted">
                  <span>Extra Baggage:</span>
                  <span className="font-mono">+₹{950 * passengers}</span>
                </div>
              )}
              <div className="border-t border-border/60 pt-2 flex justify-between items-center font-bold text-sm">
                <span className="text-fg">Total Payable:</span>
                <span className="font-mono text-lg text-primary">
                  ₹{(
                    selectedFlight.kingPayPrice * passengers +
                    (addTravelInsurance ? 199 * passengers : 0) +
                    (addMeal ? 250 * passengers : 0) +
                    (addExtraBaggage ? 950 * passengers : 0)
                  ).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* 1-Tap Payment Button */}
            <div className="space-y-2 pt-2">
              <Button
                onClick={handleBookFlight}
                disabled={isBooking}
                className="w-full bg-primary text-white hover:bg-primary/90 font-bold text-sm py-3 rounded-xl shadow-lg"
              >
                {isBooking ? (
                  "Confirming Ticket via GDS..."
                ) : (
                  `⚡ 1-Tap Pay & Confirm via KingPay Wallet (Bal: ₹${walletBalance})`
                )}
              </Button>
              <p className="text-[10px] text-center text-muted">
                Zero payment gateway fee. 100% instant refund if flight is cancelled by airline.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. CONFIRMED E-TICKET MODAL */}
      {confirmedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl border-2 border-emerald-500/50 bg-gradient-to-br from-surface to-surface-2 p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <div className="size-14 rounded-full bg-emerald-500/20 text-emerald-600 text-2xl flex items-center justify-center mx-auto shadow-inner">
                ✓
              </div>
              <h3 className="font-display font-black text-xl text-fg">Flight Ticket Confirmed!</h3>
              <p className="text-xs text-muted">Boarding pass generated and sent to WhatsApp</p>
            </div>

            {/* Digital Boarding Pass Ticket */}
            <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-surface p-4 text-xs space-y-3 relative shadow-md">
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                <div>
                  <span className="text-[9px] uppercase font-bold text-muted block">Airline</span>
                  <span className="font-bold text-fg text-sm">{confirmedTicket.flight.airline}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold text-muted block">PNR Number</span>
                  <span className="font-mono font-black text-base text-primary tracking-widest">
                    {confirmedTicket.pnr}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xl font-black text-fg">
                    {confirmedTicket.flight.departureAirport}
                  </span>
                  <p className="text-[10px] text-muted">{confirmedTicket.flight.departureTime}</p>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-mono text-muted">{confirmedTicket.flight.duration}</span>
                  <Plane className="size-4 text-primary my-0.5" />
                  <span className="text-[9px] font-bold text-emerald-600">Confirmed</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xl font-black text-fg">
                    {confirmedTicket.flight.arrivalAirport}
                  </span>
                  <p className="text-[10px] text-muted">{confirmedTicket.flight.arrivalTime}</p>
                </div>
              </div>

              <div className="border-t border-border/60 pt-2 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-muted block">Passenger</span>
                  <span className="font-bold text-fg">{confirmedTicket.passenger}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-muted block">Total Paid (0 Fee)</span>
                  <span className="font-mono font-bold text-fg">₹{confirmedTicket.totalPaid.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Simulated QR Code for Boarding Gate */}
              <div className="rounded-xl bg-surface-2 p-3 text-center space-y-1 border border-border">
                <div className="size-24 mx-auto bg-white p-1.5 rounded-lg shadow-xs flex items-center justify-center">
                  <Ticket className="size-16 text-slate-800" />
                </div>
                <span className="text-[10px] font-mono text-muted block">Gate Barcode: {confirmedTicket.qrToken}</span>
              </div>
            </div>

            {/* Savings Callout */}
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-center text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              🎉 You saved ₹{confirmedTicket.savings.toLocaleString("en-IN")} on this booking vs other travel apps!
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                onClick={() => {
                  toast.success("e-Ticket PDF downloaded to your device!");
                }}
                className="w-full bg-primary text-white font-bold text-xs py-2.5 rounded-xl shadow"
              >
                <Download className="size-3.5 mr-1.5" />
                Download e-Ticket &amp; Boarding Pass
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  const msg = `✈️ My flight from ${confirmedTicket.flight.departureAirport} to ${confirmedTicket.flight.arrivalAirport} is confirmed on KingPay! PNR: ${confirmedTicket.pnr}. Booked at the planet's lowest price with ₹0 convenience fee!`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
                }}
                className="w-full text-xs font-semibold border-border"
              >
                <Share2 className="size-3.5 mr-1.5" />
                Share on WhatsApp
              </Button>

              <Button
                variant="ghost"
                onClick={() => setConfirmedTicket(null)}
                className="w-full text-xs"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
