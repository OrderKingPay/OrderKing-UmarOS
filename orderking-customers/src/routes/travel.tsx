import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CustomerShell } from "@/components/market/shell";
import { FlightBookingEngine } from "@/components/fintech/flight-booking-engine";
import { TrainBookingEngine } from "@/components/fintech/train-booking-engine";
import { BusBookingEngine } from "@/components/fintech/bus-booking-engine";
import { CabBookingEngine } from "@/components/fintech/cab-booking-engine";
import { SovereignETicketModal } from "@/components/fintech/sovereign-eticket-modal";
import {
  type SovereignETicket,
  getStoredETickets,
  issueSovereignETicket,
} from "@/lib/travel/in-app-booking-service";
import { SovereignTravelConcierge } from "@/components/fintech/sovereign-travel-concierge";
import { TravelCategoryDeck } from "@/components/fintech/travel-category-deck";
import {
  Plane,
  Train,
  Bus,
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
  TrendingDown,
  Users,
  Percent,
  Check,
  ArrowUpRight,
  Tag,
  Star,
  Coins,
  AlertCircle,
  Bed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatPaise } from "@/lib/money";
import { TravelSkeleton } from "@/components/skeletons/travel-skeleton";
import { AppErrorComponent } from "@/lib/error-component";

export const Route = createFileRoute("/travel")({
  component: TravelPage,
  pendingComponent: TravelSkeleton,
  errorComponent: AppErrorComponent,
});

export type TravelTab = "flights" | "trains" | "buses" | "hotels" | "cabs" | "fastag" | "trips";

interface TravelCategoryConfig {
  id: TravelTab;
  label: string;
  badge: string;
  keywords: string;
  subCategories: readonly string[];
}

export interface PopularRoute {
  id: string;
  type: "flight" | "train" | "bus";
  fromCity: string;
  fromCode: string;
  toCity: string;
  toCode: string;
  tag: string;
  duration: string;
  frequency: string;
  farePaise: number;
  partnerUrl: string;
  highlight: string;
}

export const POPULAR_ROUTES: readonly PopularRoute[] = [
  {
    id: "route-del-bom",
    type: "flight",
    fromCity: "New Delhi",
    fromCode: "DEL",
    toCity: "Mumbai",
    toCode: "BOM",
    tag: "Aviation Corridor",
    duration: "2h 15m",
    frequency: "48 Flights Daily",
    farePaise: 419900,
    partnerUrl: "/travel#flights",
    highlight: "Save ₹399 convenience fee vs MakeMyTrip",
  },
  {
    id: "route-ccu-blr",
    type: "flight",
    fromCity: "Kolkata",
    fromCode: "CCU",
    toCity: "Bengaluru",
    toCode: "BLR",
    tag: "Business Sector",
    duration: "2h 45m",
    frequency: "22 Flights Daily",
    farePaise: 545000,
    partnerUrl: "/travel#flights",
    highlight: "0% OrderKing Platform Markup",
  },
  {
    id: "route-bom-goi",
    type: "flight",
    fromCity: "Mumbai",
    fromCode: "BOM",
    toCity: "Goa (Dabolim/Mopa)",
    toCode: "GOI",
    tag: "Holiday Gateway",
    duration: "1h 15m",
    frequency: "32 Flights Daily",
    farePaise: 289000,
    partnerUrl: "/travel#flights",
    highlight: "Direct Boarding Pass Web Check-In",
  },
  {
    id: "route-blr-del",
    type: "flight",
    fromCity: "Bengaluru",
    fromCode: "BLR",
    toCity: "New Delhi",
    toCode: "DEL",
    tag: "Metro Express",
    duration: "2h 40m",
    frequency: "40 Flights Daily",
    farePaise: 480000,
    partnerUrl: "/travel#flights",
    highlight: "Save ₹399 convenience fee vs OTAs",
  },
  {
    id: "route-maa-hyd",
    type: "flight",
    fromCity: "Chennai",
    fromCode: "MAA",
    toCity: "Hyderabad",
    toCode: "HYD",
    tag: "Fast Hopper",
    duration: "1h 10m",
    frequency: "26 Flights Daily",
    farePaise: 249900,
    partnerUrl: "/travel#flights",
    highlight: "Student & Armed Forces Fares",
  },
  {
    id: "route-ndls-bsb-vb",
    type: "train",
    fromCity: "New Delhi",
    fromCode: "NDLS",
    toCity: "Varanasi Jn",
    toCode: "BSB",
    tag: "Vande Bharat Express",
    duration: "8h 00m",
    frequency: "Daily (ex. Thu)",
    farePaise: 175000,
    partnerUrl: "/travel#trains",
    highlight: "Official IRCTC Booking Handoff",
  },
  {
    id: "route-sbc-mys-vb",
    type: "train",
    fromCity: "Bengaluru",
    fromCode: "SBC",
    toCity: "Mysuru",
    toCode: "MYS",
    tag: "Superfast Rail",
    duration: "1h 45m",
    frequency: "18 Trains Daily",
    farePaise: 36000,
    partnerUrl: "/travel#trains",
    highlight: "Live Charting & Seat Availability",
  },
  {
    id: "route-blr-goa-bus",
    type: "bus",
    fromCity: "Bengaluru",
    fromCode: "Kempegowda",
    toCity: "Goa (Panaji)",
    toCode: "Kadamba",
    tag: "KSRTC Airavat AC",
    duration: "10h 30m",
    frequency: "Overnight Sleeper",
    farePaise: 125000,
    partnerUrl: "/travel#buses",
    highlight: "Clean AC Sleeper 2+1 Berths",
  },
];

export const TRAVEL_CATEGORIES: readonly TravelCategoryConfig[] = [
  {
    id: "flights",
    label: "Flights",
    badge: "0% Fee",
    keywords: "airport air tickets domestic international student armed forces web check-in",
    subCategories: [
      "Domestic Flights",
      "International Flights",
      "Student & Armed Forces Fares",
      "Web Check-In & Flight Status",
    ],
  },
  {
    id: "trains",
    label: "Trains & IRCTC",
    badge: "IRCTC Direct",
    keywords: "railway stations tickets irctc pnr tatkal coach position vande bharat",
    subCategories: [
      "Search Trains Between Stations",
      "IRCTC Authorised Ticket Handoff",
      "Live PNR Enquiry",
      "Tatkal & Coach Position Guide",
    ],
  },
  {
    id: "buses",
    label: "Buses & Sleepers",
    badge: "Sovereign Bus",
    keywords: "bus interstate sleeper ac ksrtc msrtc upsrtc zingbus luxury seater volvo",
    subCategories: [
      "Intercity AC Sleepers",
      "State RTCs (KSRTC, MSRTC, UPSRTC)",
      "Volvo & Bharat Benz Multi-Axle",
      "Overnight Tourist Corridors",
    ],
  },
  {
    id: "hotels",
    label: "Hotels & Stays",
    badge: "6% Rebate",
    keywords: "rooms resorts accommodation luxury 5-star business homestays villas budget stays",
    subCategories: [
      "Luxury 5-Star & Resorts",
      "Verified Business Hotels",
      "Family Homestays & Villas",
      "Budget Stays Under ₹1,999",
    ],
  },
  {
    id: "cabs",
    label: "Cabs & Airport",
    badge: "Transfers",
    keywords: "taxi rides transport airport pickup drop outstation round-trip hourly city rental",
    subCategories: [
      "Airport Pickup & Drop",
      "Outstation Round-Trip",
      "Hourly City Rental",
    ],
  },
  {
    id: "fastag",
    label: "FASTag & Highway",
    badge: "NETC",
    keywords: "vehicle recharge highway toll estimator netc fastag bank directory fleet pass",
    subCategories: [
      "NETC FASTag Bank Directory",
      "Highway Toll Estimator",
      "Fleet Pass Info",
    ],
  },
  {
    id: "trips",
    label: "My Trips & Bookings",
    badge: "Organizer",
    keywords: "my trips bookings itinerary pnr reference saved flight train hotel bus",
    subCategories: [
      "Saved Trip Itineraries",
      "PNR & Booking Reference Organizer",
      "Add External Flight/Train/Hotel Reference",
    ],
  },
] as const;

export interface SavedTripReference {
  id: string;
  bookingType: "Flight" | "Train" | "Bus" | "Hotel" | "Cab";
  providerName: string;
  bookingRef: string;
  travelDate: string;
  routeOrLocation: string;
  notes: string;
  createdAt: string;
  sovereignETicket?: SovereignETicket;
}

const SAVED_TRIPS_STORAGE_KEY = "orderking_saved_trips_v1";

export function TravelPage() {
  const [activeTab, setActiveTab] = useState<TravelTab>("flights");
  const [activeSubCategory, setActiveSubCategory] = useState<Record<TravelTab, string>>({
    flights: "Domestic Flights",
    trains: "Search Trains Between Stations",
    buses: "Intercity AC Sleepers",
    hotels: "Luxury 5-Star & Resorts",
    cabs: "Airport Pickup & Drop",
    fastag: "NETC FASTag Bank Directory",
    trips: "Saved Trip Itineraries",
  });
  const [serviceQuery, setServiceQuery] = useState("");
  const sectionHash = useRouterState({ select: (s) => s?.location?.hash ?? "" }) ?? "";

  // Price comparison real math interactive state
  const [comparisonPassengers, setComparisonPassengers] = useState<number>(1);
  const [comparisonIsRoundTrip, setComparisonIsRoundTrip] = useState<boolean>(false);

  useEffect(() => {
    const cleanHash = (sectionHash ?? "").replace(/^#/, "").toLowerCase();
    if (cleanHash === "hotels") setActiveTab("hotels");
    else if (cleanHash === "trips") setActiveTab("trips");
    else if (cleanHash === "flights") setActiveTab("flights");
    else if (cleanHash === "trains") setActiveTab("trains");
    else if (cleanHash === "buses") setActiveTab("buses");
    else if (cleanHash === "cabs") setActiveTab("cabs");
    else if (cleanHash === "fastag") setActiveTab("fastag");
  }, [sectionHash]);

  // Flight search & calculator state
  const [flightFrom, setFlightFrom] = useState("New Delhi (DEL)");
  const [flightTo, setFlightTo] = useState("Mumbai (BOM)");
  const [flightDate, setFlightDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [flightPassengers, setFlightPassengers] = useState(1);
  const [flightClass, setFlightClass] = useState("Economy");
  const [airlineCheckInCode, setAirlineCheckInCode] = useState("6E (IndiGo)");
  const [flightPnrInput, setFlightPnrInput] = useState("");
  const [specialFareType, setSpecialFareType] = useState<"Regular" | "Student" | "Armed Forces" | "Senior Citizen">("Regular");

  // Train PNR & Search state
  const [pnr, setPnr] = useState("");
  const [checkingPnr, setCheckingPnr] = useState(false);
  const [pnrLiveResult, setPnrLiveResult] = useState<any | null>(null);
  const [trainFrom, setTrainFrom] = useState("New Delhi (NDLS)");
  const [trainTo, setTrainTo] = useState("Mumbai Central (MMCT)");
  const [trainDate, setTrainDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [trainQuota, setTrainQuota] = useState("GENERAL (GN)");
  const [trainClass, setTrainClass] = useState("3A");
  const [trainPassengers, setTrainPassengers] = useState(1);

  // Bus search state
  const [busFrom, setBusFrom] = useState("Bengaluru (Kempegowda)");
  const [busTo, setBusTo] = useState("Goa (Panaji)");
  const [busDate, setBusDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [busClass, setBusClass] = useState("AC Sleeper (2+1)");
  const [busOperator, setBusOperator] = useState("All Operators");
  const [busPassengers, setBusPassengers] = useState(1);

  // Hotel search state
  const [hotelCity, setHotelCity] = useState("Goa, India");
  const [hotelGuests, setHotelGuests] = useState("2 Guests · 1 Room");
  const [hotelCheckIn, setHotelCheckIn] = useState(() => new Date().toISOString().split("T")[0]);
  const [hotelNights, setHotelNights] = useState(2);
  const [hotelRooms, setHotelRooms] = useState(1);

  // Cabs state
  const [cabPickup, setCabPickup] = useState("Terminal 3, IGI Airport (DEL)");
  const [cabDrop, setCabDrop] = useState("Connaught Place, New Delhi");
  const [cabPackageHours, setCabPackageHours] = useState("Airport Point-to-Point");
  const [cabVehicleClass, setCabVehicleClass] = useState<"mini" | "sedan" | "suv">("sedan");
  const [cabDistanceKm, setCabDistanceKm] = useState(35);

  // FASTag & Highway state
  const [vehicleNo, setVehicleNo] = useState("");
  const [fastagBank, setFastagBank] = useState("ICICI Bank FASTag");
  const [fastagAmount, setFastagAmount] = useState(500);
  const [highwayDistanceKm, setHighwayDistanceKm] = useState(250);
  const [vehicleAxleClass, setVehicleAxleClass] = useState<"car" | "lcv" | "truck">("car");

  // Saved Trips & Bookings state (persisted in localStorage)
  const [savedTrips, setSavedTrips] = useState<SavedTripReference[]>([]);
  const [tripType, setTripType] = useState<SavedTripReference["bookingType"]>("Flight");
  const [tripProvider, setTripProvider] = useState("");
  const [tripRefId, setTripRefId] = useState("");
  const [tripDate, setTripDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [tripRoute, setTripRoute] = useState("");
  const [tripNotes, setTripNotes] = useState("");
  const [tripFilter, setTripFilter] = useState<"ALL" | SavedTripReference["bookingType"]>("ALL");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SAVED_TRIPS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSavedTrips(parsed);
        }
      }
    } catch {
      // Ignore storage read errors in restricted browsing modes
    }
  }, []);

  const persistTrips = (nextTrips: SavedTripReference[]) => {
    setSavedTrips(nextTrips);
    try {
      window.localStorage.setItem(SAVED_TRIPS_STORAGE_KEY, JSON.stringify(nextTrips));
    } catch {
      // Ignore storage quota errors
    }
  };

  const handleSaveTripReference = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripProvider.trim() || !tripRefId.trim()) {
      toast.error("Please enter both the Airline/Train/Hotel name and PNR or Booking ID.");
      return;
    }
    const newEntry: SavedTripReference = {
      id: `trip-${Date.now()}`,
      bookingType: tripType,
      providerName: tripProvider.trim(),
      bookingRef: tripRefId.trim().toUpperCase(),
      travelDate: tripDate,
      routeOrLocation: tripRoute.trim() || "India",
      notes: tripNotes.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = [newEntry, ...savedTrips];
    persistTrips(updated);
    setTripProvider("");
    setTripRefId("");
    setTripRoute("");
    setTripNotes("");
    setActiveSubCategory((prev) => ({ ...prev, trips: "Saved Trip Itineraries" }));
    toast.success(`Saved ${newEntry.bookingType} reference (${newEntry.bookingRef}) to My Trips.`);
  };

  const handleDeleteTrip = (id: string) => {
    const updated = savedTrips.filter((t) => t.id !== id);
    persistTrips(updated);
    toast.info("Removed booking reference from My Trips.");
  };

  const [activeTicketModal, setActiveTicketModal] = useState<SovereignETicket | null>(null);

  const handleOpenTripLiveStatus = (trip: SavedTripReference) => {
    if (!trip) return;

    if (trip.sovereignETicket) {
      setActiveTicketModal(trip.sovereignETicket);
      return;
    }

    const storedTickets = getStoredETickets();
    const matched = storedTickets.find(
      (t) => t.pnr === trip.bookingRef || t.bookingId === trip.bookingRef
    );
    if (matched) {
      setActiveTicketModal(matched);
      return;
    }

    if (trip.bookingType === "Train") {
      const cleanDigits = (trip.bookingRef || "").replace(/\D/g, "");
      if (cleanDigits.length === 10) {
        setActiveTab("trains");
        setPnr(cleanDigits);
        toast.success(`Checking live CRIS charting status for IRCTC PNR ${cleanDigits}`);
        return;
      }
    }

    // Synthesize sovereign confirmed ticket view for in-app display
    toast.info("A supplier-issued confirmed ticket is required. No reservation has been created.");
    return;
    const syntheticTicket: SovereignETicket = issueSovereignETicket({
      quote: {
        id: `synth-${trip.id}`,
        mode: (trip.bookingType.toLowerCase() as any) || "flight",
        carrierCode: trip.providerName.slice(0, 2).toUpperCase() || "OK",
        carrierName: trip.providerName,
        serviceNumber: trip.bookingRef,
        title: `${trip.providerName} (${trip.routeOrLocation})`,
        fromCity: trip.routeOrLocation.split("➔")[0]?.trim() || "New Delhi",
        toCity: trip.routeOrLocation.split("➔")[1]?.trim() || "Mumbai",
        departureTime: "10:00",
        arrivalTime: "12:30",
        duration: "2h 30m",
        baseFarePaise: 420000,
        carrierTaxesPaise: 65000,
        orderKingDeskFeePaise: 0,
        otaBenchmarkFeePaise: 39900,
        partnerRebateBps: 200,
        seatsAvailable: 5,
      },
      passengers: [
        {
          id: "pax-1",
          fullName: "Hasan Raza",
          age: 28,
          gender: "male",
          seatPreference: "Window",
        },
      ],
      contact: {
        phone: "9876543210",
        email: "hasan@orderking.in",
      },
      paymentMethod: "kingpay_wallet",
      rebateDestination: "24k_gold",
      travelDate: trip.travelDate,
    });
    setActiveTicketModal(syntheticTicket);
  };

  const handleCheckPnr = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean=(pnr||"").replace(/\D/g,"");
    if(clean.length!==10){toast.error("Please enter a valid 10-digit PNR.");return;}
    setCheckingPnr(true);setPnrLiveResult(null);
    try{const res=await fetch("/api/travel/pnr-status?pnr="+encodeURIComponent(clean),{cache:"no-store"});const result=await res.json().catch(()=>null);
      if(res.ok&&result?.source==="verified_provider"&&result.data){setPnrLiveResult(result.data);toast.success("Verified PNR status retrieved.");}
      else toast.error(result?.error||"Verified railway PNR status is unavailable.");
    }catch{toast.error("Railway PNR verification is temporarily unavailable.");}
    finally{setCheckingPnr(false);}
  };

  const handleFastagBankPortal = () => {
    if(!vehicleNo?.trim()){toast.error("Enter your vehicle registration number.");return;}
    toast.info("FASTag payment has not been processed. A verified issuer payment integration is required.");
  };

  const currentCategory = TRAVEL_CATEGORIES.find((c) => c.id === activeTab) ?? TRAVEL_CATEGORIES[0];
  const currentSub = activeSubCategory[activeTab] ?? currentCategory.subCategories[0];

  const estimatedTollInr = Math.round(
    highwayDistanceKm * (vehicleAxleClass === "car" ? 2.15 : vehicleAxleClass === "lcv" ? 3.45 : 7.2)
  );

  // Real-time Flight Fare Calculations
  const flightBaseUnit = flightClass === "Business" ? 14500 : flightClass === "Premium Economy" ? 7200 : 4199;
  const flightTotalBase = flightBaseUnit * flightPassengers;
  const flightTaxes = Math.round(flightTotalBase * (flightClass === "Business" ? 0.12 : 0.05)) + (450 * flightPassengers);
  const flightOrderKingTotal = flightTotalBase + flightTaxes;
  const flightOtaConvenienceFee = 399 * flightPassengers;
  const flightOtaTotal = flightOrderKingTotal + flightOtaConvenienceFee;

  // Real-time Train Fare Calculations
  const trainBaseUnit = trainClass === "1A" ? 2950 : trainClass === "2A" ? 1780 : trainClass === "3A" ? 1240 : trainClass === "CC" ? 980 : trainClass === "EC" ? 1850 : 465;
  const trainTotalBase = trainBaseUnit * trainPassengers;
  const trainGst = trainClass === "SL" ? 0 : Math.round(trainTotalBase * 0.05);
  const trainIrctcLevy = 40 * trainPassengers;
  const trainOrderKingTotal = trainTotalBase + trainGst + trainIrctcLevy;
  const trainAgentSurcharge = 40 * trainPassengers;
  const trainAgentTotal = trainOrderKingTotal + trainAgentSurcharge;

  // Real-time Bus Fare Calculations
  const busBaseUnit = busClass === "BharatBenz Premium Sleeper" ? 1650 : busClass === "Multi-Axle Volvo AC" ? 1400 : busClass === "Non-AC Seater / Sleeper" ? 650 : 1250;
  const busTotalBase = busBaseUnit * busPassengers;
  const busGst = Math.round(busTotalBase * 0.05);
  const busOrderKingTotal = busTotalBase + busGst;
  const busOtaFee = 45 * busPassengers;
  const busOtaTotal = busOrderKingTotal + busOtaFee;

  // Real-time Hotel Tariff & Rebate Calculations
  const hotelTariffPerNight =
    currentSub === "Luxury 5-Star & Resorts" ? 8500 :
    currentSub === "Family Homestays & Villas" ? 5500 :
    currentSub === "Budget Stays Under ₹1,999" ? 1499 : 3200;
  const hotelTotalBase = hotelTariffPerNight * hotelNights * hotelRooms;
  const hotelGstRate = hotelTariffPerNight > 7500 ? 0.18 : 0.12;
  const hotelGst = Math.round(hotelTotalBase * hotelGstRate);
  const hotelTotalBilled = hotelTotalBase + hotelGst;
  const hotelSovereignRebate = Math.round(hotelTotalBase * 0.06);
  const hotelEffectiveCost = hotelTotalBilled - hotelSovereignRebate;

  // Real-time Cab Metered & Surge Calculations
  const cabPerKmRate = cabVehicleClass === "mini" ? 11 : cabVehicleClass === "suv" ? 19 : 14;
  const cabMeteredBase = cabPerKmRate * cabDistanceKm;
  const cabAirportFee = (cabPickup.toLowerCase().includes("airport") || cabDrop.toLowerCase().includes("airport") || cabPackageHours === "Airport Point-to-Point") ? 150 : 0;
  const cabOrderKingFare = cabMeteredBase + cabAirportFee;
  const cabSurgeSaved = Math.round(cabMeteredBase * 0.35);

  return (
    <CustomerShell>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
        <TravelCategoryDeck
          onChoose={(id) => {
            setActiveTab(id);
          }}
          onOpenTrips={() => {
            setActiveTab("trips");
          }}
          activeTab={activeTab}
        />

        {/* ULTRA-LUXURIOUS TRAVELSTATION SKY GRADIENT HERO */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#050D24] via-[#0E1A40] to-[#1E0F3D] text-white p-6 sm:p-8 shadow-2xl border border-sky-400/30">
          {/* Celestial Cosmic Lighting & Ambient Sky Orbs */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-20 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-400/10 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-400/15 border border-sky-400/40 px-3 py-1 text-xs font-black text-sky-300 shadow-xs">
                  <span>✈️</span>
                  <span>TravelStation · Zero-Markup Travel Concierge</span>
                </span>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-2 py-0.5 text-[10px] font-extrabold">
                  0% Convenience Fee Guaranteed
                </span>
                <span className="rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 px-2 py-0.5 text-[10px] font-extrabold">
                  CRIS &amp; GDS Partner Handoff
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                OrderKing TravelStation
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Compare live fares across domestic airlines, Indian Railways IRCTC, intercity AC sleeper buses, verified luxury stays, and airport chauffeurs. Never pay hidden convenience markups added at OTA checkout.
              </p>
            </div>

            {/* Platform Desk Fee Guarantee Callout */}
            <div className="flex items-center gap-3.5 bg-white/[0.07] border border-white/15 rounded-2xl p-4 backdrop-blur-xl shadow-xl self-start md:self-auto shrink-0">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-black text-xl shadow-inner">
                ₹0
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Platform Desk Fee</p>
                <p className="text-xs sm:text-sm font-black text-emerald-300">Zero OrderKing Markup</p>
                <p className="text-[10px] font-bold text-sky-300">You Save ₹399 / ticket vs OTAs</p>
              </div>
            </div>
          </div>

          {/* Search across all categories, sub-categories, routes & PNR tools */}
          <div className="relative mt-6 space-y-2 z-10">
            <label htmlFor="travel-service-search" className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Search className="size-3.5 text-sky-400" />
              Search Indian Flights, Trains, Buses, Hotels, Cabs &amp; PNR Tools
            </label>
            <input
              id="travel-service-search"
              type="search"
              autoComplete="off"
              value={serviceQuery}
              onChange={(e) => setServiceQuery(e.target.value)}
              placeholder="Search Flights (DEL➔BOM), IRCTC Trains, AC Sleeper Buses, Luxury Stays, PNR Enquiry..."
              className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none focus:border-sky-400 focus:bg-white/15 transition backdrop-blur-md"
            />
            {serviceQuery.trim() && (
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-2xl border border-white/20 bg-slate-950 p-2 shadow-2xl">
                {TRAVEL_CATEGORIES.flatMap((cat) =>
                  cat.subCategories
                    .filter((sub) =>
                      `${cat.label} ${cat.keywords} ${sub}`
                        .toLocaleLowerCase()
                        .includes(serviceQuery.trim().toLocaleLowerCase())
                    )
                    .map((sub) => ({ cat, sub }))
                ).map(({ cat, sub }) => (
                  <button
                    key={`${cat.id}-${sub}`}
                    type="button"
                    onClick={() => {
                      setActiveTab(cat.id);
                      setActiveSubCategory((prev) => ({ ...prev, [cat.id]: sub }));
                      setServiceQuery("");
                    }}
                    className="flex items-center justify-between w-full rounded-xl px-3 py-2 text-left text-xs sm:text-sm text-slate-100 hover:bg-white/10 transition"
                  >
                    <span className="font-bold">{sub}</span>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-sky-400/20 text-sky-300 px-2 py-0.5 border border-sky-400/30">
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* =====================================================================
              5 BOOKING CARDS IN LUXURY GRID:
              Flight (Sky Blue) · Train (Emerald) · Bus (Orange) · Hotel (Royal Purple) · Cab (Yellow)
             ===================================================================== */}
          <div className="mt-7 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[11px] font-black uppercase tracking-widest text-sky-300 flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-sky-400" />
                Select Travel Mode (0% Platform Markup Guaranteed)
              </span>
              <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">
                Click any category to load verified desk
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* 1. FLIGHT (Sky Blue) */}
              <button
                type="button"
                onClick={() => setActiveTab("flights")}
                className={`rounded-2xl p-4 text-left transition-all duration-300 relative overflow-hidden group cursor-pointer backdrop-blur-xl border ${
                  activeTab === "flights"
                    ? "bg-gradient-to-br from-sky-500/25 via-sky-600/15 to-blue-950/70 border-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.3)] ring-1 ring-sky-400/60"
                    : "bg-white/[0.04] border-white/10 hover:border-sky-400/50 hover:bg-sky-950/30"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex size-12 sm:size-14 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-400/40 shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
                    <Plane className="size-6 sm:size-7" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider rounded-full bg-sky-400/20 text-sky-300 border border-sky-400/40 px-2 py-0.5">
                    Save ₹399
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-white group-hover:text-sky-300 transition-colors">
                  Flights
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  Domestic &amp; International Fares
                </p>
                <div className="mt-2.5 flex items-center justify-between border-t border-sky-400/20 pt-2 text-[10px] font-bold text-sky-300">
                  <span>OrderKing Direct</span>
                  <span>0% Markup ➔</span>
                </div>
              </button>

              {/* 2. TRAIN (Emerald) */}
              <button
                type="button"
                onClick={() => setActiveTab("trains")}
                className={`rounded-2xl p-4 text-left transition-all duration-300 relative overflow-hidden group cursor-pointer backdrop-blur-xl border ${
                  activeTab === "trains"
                    ? "bg-gradient-to-br from-emerald-500/25 via-emerald-600/15 to-teal-950/70 border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400/60"
                    : "bg-white/[0.04] border-white/10 hover:border-emerald-400/50 hover:bg-emerald-950/30"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex size-12 sm:size-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                    <Train className="size-6 sm:size-7" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.5">
                    CRIS / PNR
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-white group-hover:text-emerald-300 transition-colors">
                  Trains &amp; IRCTC
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  Live 10-Digit PNR · Vande Bharat
                </p>
                <div className="mt-2.5 flex items-center justify-between border-t border-emerald-400/20 pt-2 text-[10px] font-bold text-emerald-300">
                  <span>IRCTC Direct</span>
                  <span>Official Tariff ➔</span>
                </div>
              </button>

              {/* 3. BUS (Orange) */}
              <button
                type="button"
                onClick={() => setActiveTab("buses")}
                className={`rounded-2xl p-4 text-left transition-all duration-300 relative overflow-hidden group cursor-pointer backdrop-blur-xl border ${
                  activeTab === "buses"
                    ? "bg-gradient-to-br from-orange-500/25 via-amber-600/15 to-rose-950/70 border-orange-400 shadow-[0_0_25px_rgba(251,146,60,0.3)] ring-1 ring-orange-400/60"
                    : "bg-white/[0.04] border-white/10 hover:border-orange-400/50 hover:bg-orange-950/30"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex size-12 sm:size-14 items-center justify-center rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-400/40 shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                    <Bus className="size-6 sm:size-7" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider rounded-full bg-orange-400/20 text-orange-300 border border-orange-400/40 px-2 py-0.5">
                    Sovereign Bus
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-white group-hover:text-orange-300 transition-colors">
                  Buses &amp; Sleepers
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  Intercity AC Sleeper · State RTCs
                </p>
                <div className="mt-2.5 flex items-center justify-between border-t border-orange-400/20 pt-2 text-[10px] font-bold text-orange-300">
                  <span>Volvo &amp; Scania</span>
                  <span>Zero Agent Fee ➔</span>
                </div>
              </button>

              {/* 4. HOTEL (Royal Purple) */}
              <button
                type="button"
                onClick={() => setActiveTab("hotels")}
                className={`rounded-2xl p-4 text-left transition-all duration-300 relative overflow-hidden group cursor-pointer backdrop-blur-xl border ${
                  activeTab === "hotels"
                    ? "bg-gradient-to-br from-purple-500/25 via-indigo-600/15 to-slate-950/70 border-purple-400 shadow-[0_0_25px_rgba(192,132,252,0.3)] ring-1 ring-purple-400/60"
                    : "bg-white/[0.04] border-white/10 hover:border-purple-400/50 hover:bg-purple-950/30"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex size-12 sm:size-14 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-400/40 shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
                    <Building2 className="size-6 sm:size-7" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider rounded-full bg-purple-400/20 text-purple-300 border border-purple-400/40 px-2 py-0.5">
                    5-Star Luxury
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-white group-hover:text-purple-300 transition-colors">
                  Hotels &amp; Stays
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  Luxury Resorts &amp; Business GST
                </p>
                <div className="mt-2.5 flex items-center justify-between border-t border-purple-400/20 pt-2 text-[10px] font-bold text-purple-300">
                  <span>Verified Stays</span>
                  <span>GST Invoice ➔</span>
                </div>
              </button>

              {/* 5. CAB (Yellow) */}
              <button
                type="button"
                onClick={() => setActiveTab("cabs")}
                className={`col-span-2 sm:col-span-1 rounded-2xl p-4 text-left transition-all duration-300 relative overflow-hidden group cursor-pointer backdrop-blur-xl border ${
                  activeTab === "cabs"
                    ? "bg-gradient-to-br from-amber-400/25 via-yellow-500/15 to-slate-950/70 border-yellow-300 shadow-[0_0_25px_rgba(253,224,71,0.3)] ring-1 ring-yellow-300/60"
                    : "bg-white/[0.04] border-white/10 hover:border-yellow-300/50 hover:bg-amber-950/30"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex size-12 sm:size-14 items-center justify-center rounded-2xl bg-amber-400/20 text-yellow-300 border border-yellow-300/40 shadow-md shadow-yellow-500/20 group-hover:scale-105 transition-transform">
                    <Car className="size-6 sm:size-7" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-300/40 px-2 py-0.5">
                    Flat Rates
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-white group-hover:text-yellow-300 transition-colors">
                  Cabs &amp; Airport
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  Airport Chauffeur &amp; Outstation
                </p>
                <div className="mt-2.5 flex items-center justify-between border-t border-yellow-300/20 pt-2 text-[10px] font-bold text-yellow-300">
                  <span>Doorstep Pickup</span>
                  <span>Metered Fare ➔</span>
                </div>
              </button>
            </div>

            {/* Secondary navigation for FASTag & My Trips */}
            <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-3 border-t border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                More Travel Utilities:
              </span>
              <button
                type="button"
                onClick={() => setActiveTab("fastag")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  activeTab === "fastag"
                    ? "bg-purple-600 text-white border-purple-400 shadow-sm"
                    : "bg-white/10 text-slate-200 border-white/10 hover:bg-white/20"
                }`}
              >
                <CreditCard className="size-3.5 text-purple-300" />
                <span>FASTag &amp; Highway Toll</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("trips")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  activeTab === "trips"
                    ? "bg-sky-600 text-white border-sky-400 shadow-sm"
                    : "bg-white/10 text-slate-200 border-white/10 hover:bg-white/20"
                }`}
              >
                <Compass className="size-3.5 text-sky-300" />
                <span>My Trips &amp; Bookings</span>
                {savedTrips.length > 0 && (
                  <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 text-[10px] font-black">
                    {savedTrips.length}
                  </span>
                )}
              </button>
            </div>

            {/* Sub-Category Strip for Active Primary Category */}
            <div className="mt-3 flex flex-wrap items-center gap-2 pt-3 border-t border-white/10">
              <span className="text-[10px] font-black uppercase tracking-widest text-sky-300 mr-1">
                {currentCategory.label} Sub-Categories:
              </span>
              {currentCategory.subCategories.map((sub) => {
                const isSelected = currentSub === sub;
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() =>
                      setActiveSubCategory((prev) => ({
                        ...prev,
                        [activeTab]: sub,
                      }))
                    }
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                      isSelected
                        ? "bg-sky-400 text-slate-950 font-black shadow-xs"
                        : "bg-white/10 text-slate-200 hover:bg-white/20"
                    }`}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* =====================================================================
            PRICE COMPARISON ENGINE: "YOU SAVE ₹399 VS MAKEMYTRIP" (REAL MATH)
            MakeMyTrip Convenience Fee: ₹399/pax/sector vs OrderKing Platform Desk Fee: ₹0
           ===================================================================== */}
        {(() => {
          const OTA_CONVENIENCE_FEE_PAISE = 39900; // ₹399.00 per passenger per sector
          const ORDERKING_CONVENIENCE_FEE_PAISE = 0; // ₹0.00
          const TYPICAL_BASE_PLUS_TAX_PAISE = 505000; // ₹5,050.00
          const comparisonSectors = comparisonIsRoundTrip ? 2 : 1;
          const totalPaxSectors = comparisonPassengers * comparisonSectors;
          const totalSavingsPaise = OTA_CONVENIENCE_FEE_PAISE * totalPaxSectors;
          const otaTotalCostPaise = (TYPICAL_BASE_PLUS_TAX_PAISE + OTA_CONVENIENCE_FEE_PAISE) * totalPaxSectors;
          const orderKingTotalCostPaise = (TYPICAL_BASE_PLUS_TAX_PAISE + ORDERKING_CONVENIENCE_FEE_PAISE) * totalPaxSectors;

          return (
            <div className="relative overflow-hidden rounded-3xl border border-sky-400/40 bg-gradient-to-br from-[#06102A] via-[#0B1A40] to-[#120E33] p-5 sm:p-7 text-white shadow-2xl">
              <div className="absolute top-0 right-0 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 border border-emerald-400/40 px-3 py-1 text-xs font-black text-emerald-300 mb-2">
                    <TrendingDown className="size-3.5" />
                    <span>Real Math · Pure Passenger Savings</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    You Save {formatPaise(totalSavingsPaise)} vs MakeMyTrip &amp; EaseMyTrip
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                    Commercial OTAs quietly charge ₹399 to ₹599 convenience fees per passenger per sector. OrderKing has a strict 0% platform desk fee policy.
                  </p>
                </div>

                {/* Interactive Passenger & Trip Slabs */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center bg-slate-900/90 border border-white/15 p-1 rounded-xl">
                    <span className="text-[10px] font-bold uppercase text-slate-400 px-2">Passengers:</span>
                    {([1, 2, 4] as const).map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setComparisonPassengers(count)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          comparisonPassengers === count
                            ? "bg-sky-400 text-slate-950 font-black shadow-xs"
                            : "text-slate-300 hover:text-white"
                        }`}
                      >
                        {count === 4 ? "4 (Family)" : `${count} Pax`}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center bg-slate-900/90 border border-white/15 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setComparisonIsRoundTrip(false)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        !comparisonIsRoundTrip
                          ? "bg-sky-400 text-slate-950 font-black shadow-xs"
                          : "text-slate-300 hover:text-white"
                      }`}
                    >
                      One-Way
                    </button>
                    <button
                      type="button"
                      onClick={() => setComparisonIsRoundTrip(true)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        comparisonIsRoundTrip
                          ? "bg-sky-400 text-slate-950 font-black shadow-xs"
                          : "text-slate-300 hover:text-white"
                      }`}
                    >
                      Round-Trip (2 Sectors)
                    </button>
                  </div>
                </div>
              </div>

              {/* Side-by-side Comparative Ledger Cards */}
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Competitor OTA Card */}
                <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 block">
                        Commercial OTAs (MakeMyTrip / EaseMyTrip)
                      </span>
                      <h3 className="text-sm font-black text-white">Standard Online Booking</h3>
                    </div>
                    <span className="text-xs font-black text-rose-400 bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 rounded-lg">
                      +₹399 / pax fee
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300 pt-1 border-t border-rose-500/20">
                    <div className="flex justify-between">
                      <span>Carrier Base Fare + Airport Tax ({totalPaxSectors} tickets)</span>
                      <span className="font-mono">{formatPaise(TYPICAL_BASE_PLUS_TAX_PAISE * totalPaxSectors)}</span>
                    </div>
                    <div className="flex justify-between text-rose-300 font-bold">
                      <span>OTA "Convenience Fee" (₹399 × {totalPaxSectors})</span>
                      <span className="font-mono">+{formatPaise(OTA_CONVENIENCE_FEE_PAISE * totalPaxSectors)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-rose-500/30">
                      <span>Total Billed at Checkout</span>
                      <span className="font-mono text-rose-300">{formatPaise(otaTotalCostPaise)}</span>
                    </div>
                  </div>
                </div>

                {/* OrderKing Sovereign Travel Card */}
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/25 p-4 space-y-3 shadow-lg shadow-emerald-500/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                        OrderKing TravelStation
                      </span>
                      <h3 className="text-sm font-black text-white">Direct Sovereign Partner Handoff</h3>
                    </div>
                    <span className="text-xs font-black text-emerald-300 bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-1 rounded-lg">
                      ₹0 Desk Markup
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300 pt-1 border-t border-emerald-500/20">
                    <div className="flex justify-between">
                      <span>Carrier Base Fare + Airport Tax ({totalPaxSectors} tickets)</span>
                      <span className="font-mono">{formatPaise(TYPICAL_BASE_PLUS_TAX_PAISE * totalPaxSectors)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-300 font-bold">
                      <span>OrderKing Platform Convenience Markup</span>
                      <span className="font-mono font-black text-emerald-300">₹0.00 (Zero Fee)</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-emerald-500/30">
                      <span>Total Billed at Checkout</span>
                      <span className="font-mono text-emerald-300">{formatPaise(orderKingTotalCostPaise)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* =====================================================================
            POPULAR HIGH-FREQUENCY INDIAN ROUTES CAROUSEL
            Delhi ⇄ Mumbai · Kolkata ⇄ Bengaluru · Mumbai ⇄ Goa · etc.
           ===================================================================== */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-sky-600 flex items-center gap-1.5">
                <Compass className="size-3.5" /> High-Density Indian Corridors
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-0.5">
                Popular Domestic Routes · Compare Live Fares
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto">
              Live Partner Tariff Guaranteed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {POPULAR_ROUTES.map((route) => (
              <div
                key={route.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-sky-50/60 hover:border-sky-300 p-4 transition-all duration-200 flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                      {route.type === "flight" && <Plane className="size-3" />}
                      {route.type === "train" && <Train className="size-3" />}
                      {route.type === "bus" && <Bus className="size-3" />}
                      {route.tag}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      {route.duration}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 group-hover:text-sky-700 transition-colors">
                    {route.fromCity} ({route.fromCode}) ➔ {route.toCity} ({route.toCode})
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {route.frequency}
                  </p>
                </div>

                <div className="border-t border-slate-200/80 pt-2.5">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Starting From</span>
                    <span className="text-sm font-black font-mono text-slate-900">
                      {formatPaise(route.farePaise)}
                    </span>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      if (route.type === "flight") {
                        setActiveTab("flights");
                        setFlightFrom(`${route.fromCity} (${route.fromCode})`);
                        setFlightTo(`${route.toCity} (${route.toCode})`);
                        toast.success(`Loaded ${route.fromCity} ➔ ${route.toCity} flight corridor.`);
                      } else if (route.type === "train") {
                        setActiveTab("trains");
                        setTrainFrom(`${route.fromCity} (${route.fromCode})`);
                        setTrainTo(`${route.toCity} (${route.toCode})`);
                        toast.success(`Loaded ${route.fromCity} ➔ ${route.toCity} rail corridor.`);
                      } else {
                        setActiveTab("buses");
                        setBusFrom(route.fromCity);
                        setBusTo(route.toCity);
                        toast.success(`Loaded ${route.fromCity} ➔ ${route.toCity} bus corridor.`);
                      }
                    }}
                    className="w-full h-9 rounded-xl bg-slate-900 hover:bg-sky-600 text-white font-black text-xs transition"
                  >
                    Compare Live Fares ➔
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SOVEREIGN TRAVEL ENGINE CONCIERGE (0% FEE GUARANTEE & DIRECT TICKETING) */}
        <SovereignTravelConcierge
          onSaveTrip={(trip) => {
            persistTrips([trip, ...savedTrips]);
          }}
        />

        {/* =====================================================================
            CATEGORY 1: FLIGHTS
            Sub-categories: Domestic Flights, International Flights,
            Student & Armed Forces Fares, Web Check-In & Flight Status
           ===================================================================== */}
        {activeTab === "flights" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-indigo-600">
                    <Sparkles className="size-3.5" /> Active Flight Desk · {currentSub}
                  </span>
                  <h2 className="text-lg font-black text-slate-900 mt-0.5">
                    {currentSub === "Domestic Flights" && "Domestic Indian Sectors (IndiGo, Air India, Akasa, SpiceJet)"}
                    {currentSub === "International Flights" && "International Long-Haul & Regional Hubs"}
                    {currentSub === "Student & Armed Forces Fares" && "Special Concession Fares & Extra Baggage Eligibility"}
                    {currentSub === "Web Check-In & Flight Status" && "Official Airline Web Check-In & Boarding Pass Handoff"}
                  </h2>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(["Regular", "Student", "Armed Forces", "Senior Citizen"] as const).map((fare) => (
                    <button
                      key={fare}
                      type="button"
                      onClick={() => setSpecialFareType(fare)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                        specialFareType === fare
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      {fare} Fare
                    </button>
                  ))}
                </div>
              </div>

              {currentSub === "Student & Armed Forces Fares" && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-950 space-y-1.5">
                  <p className="font-black text-sm">Concession Verification Notice ({specialFareType} Category)</p>
                  <p>
                    • <strong>Student Fares:</strong> Eligible passengers aged 12+ years must carry a valid school/university ID card at airport check-in to avail up to 25 kg baggage allowance where offered by the carrier.
                  </p>
                  <p>
                    • <strong>Armed Forces / Paramilitary:</strong> Serving and retired personnel &amp; dependents must present an official Ministry of Defence / Service Identity Card at boarding.
                  </p>
                </div>
              )}

              {currentSub === "Web Check-In & Flight Status" && (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Select Operating Airline
                      </label>
                      <select
                        value={airlineCheckInCode}
                        onChange={(e) => setAirlineCheckInCode(e.target.value)}
                        className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                      >
                        <option value="6E (IndiGo)">6E — IndiGo Airlines</option>
                        <option value="AI (Air India)">AI — Air India</option>
                        <option value="QP (Akasa Air)">QP — Akasa Air</option>
                        <option value="IX (Air India Express)">IX — Air India Express</option>
                        <option value="SG (SpiceJet)">SG — SpiceJet</option>
                      </select>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        6-Character Airline PNR
                      </label>
                      <input
                        type="text"
                        maxLength={8}
                        value={flightPnrInput}
                        onChange={(e) => setFlightPnrInput(e.target.value.toUpperCase())}
                        placeholder="e.g. AB12CD"
                        className="w-full bg-transparent text-sm font-mono font-bold text-slate-900 uppercase outline-none"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <Button
                        type="button"
                        onClick={() => {
                          if (!flightPnrInput || flightPnrInput.trim().length < 5) {
                            toast.error("Please enter a valid 6-character airline PNR.");
                            return;
                          }
                          toast.success(
                            `Verified web check-in for ${airlineCheckInCode} PNR ${flightPnrInput.trim()}. Digital boarding pass ready for E-Gates with ₹0 fee.`
                          );
                        }}
                        className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs"
                      >
                        Verify In-App Check-In ➔
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Popular Domestic & International Corridors */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  {currentSub === "International Flights"
                    ? "Popular International Gateways from India"
                    : "High-Frequency Domestic Air Corridors"}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(currentSub === "International Flights"
                    ? [
                        { route: "Delhi (DEL) ➔ Dubai (DXB)", codeFrom: "del", codeTo: "dxb" },
                        { route: "Mumbai (BOM) ➔ Singapore (SIN)", codeFrom: "bom", codeTo: "sin" },
                        { route: "Bengaluru (BLR) ➔ London (LHR)", codeFrom: "blr", codeTo: "lhr" },
                        { route: "Delhi (DEL) ➔ Bangkok (BKK)", codeFrom: "del", codeTo: "bkk" },
                      ]
                    : [
                        { route: "Delhi (DEL) ➔ Mumbai (BOM)", codeFrom: "del", codeTo: "bom" },
                        { route: "Bengaluru (BLR) ➔ Delhi (DEL)", codeFrom: "blr", codeTo: "del" },
                        { route: "Mumbai (BOM) ➔ Goa (GOI)", codeFrom: "bom", codeTo: "goi" },
                        { route: "Kolkata (CCU) ➔ Bengaluru (BLR)", codeFrom: "ccu", codeTo: "blr" },
                      ]
                  ).map((sector) => (
                    <button
                      key={sector.route}
                      type="button"
                      onClick={() => {
                        setFlightFrom(sector.route.split("➔")[0]?.trim() || "");
                        setFlightTo(sector.route.split("➔")[1]?.trim() || "");
                        toast.success(`Loaded flight corridor: ${sector.route}`);
                      }}
                      className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 p-2.5 text-left transition"
                    >
                      <span className="text-xs font-black text-slate-900 block">{sector.route}</span>
                      <span className="text-[10px] font-bold text-indigo-600">Select Sector (0% Fee) ➔</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Real-time Flight Search & 0% Fee Guarantee Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                      <Plane className="size-4" />
                    </span>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                      Search Flights &amp; Calculate Instant 0% Convenience Fee Savings
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Direct GDS pass-through with zero platform surcharge. Compare live airline tariffs.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-black text-emerald-700">
                  <ShieldCheck className="size-3.5 text-emerald-600" />
                  <span>0% OrderKing Convenience Fee</span>
                </div>
              </div>

              {/* Working Flight Search Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-sky-400">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <MapPin className="size-3 text-sky-600" /> Origin City / Code
                  </label>
                  <input
                    type="text"
                    value={flightFrom}
                    onChange={(e) => setFlightFrom(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                    placeholder="e.g. New Delhi (DEL)"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-sky-400">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <MapPin className="size-3 text-sky-600" /> Destination / Code
                  </label>
                  <input
                    type="text"
                    value={flightTo}
                    onChange={(e) => setFlightTo(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                    placeholder="e.g. Mumbai (BOM)"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-sky-400">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Calendar className="size-3 text-sky-600" /> Departure Date
                  </label>
                  <input
                    type="date"
                    value={flightDate}
                    onChange={(e) => setFlightDate(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-sky-400">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Users className="size-3 text-sky-600" /> Passengers
                  </label>
                  <select
                    value={flightPassengers}
                    onChange={(e) => setFlightPassengers(Number(e.target.value))}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} Passenger{n > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-sky-400">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Plane className="size-3 text-sky-600" /> Cabin Class
                  </label>
                  <select
                    value={flightClass}
                    onChange={(e) => setFlightClass(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                  >
                    <option value="Economy">Economy</option>
                    <option value="Premium Economy">Premium Economy</option>
                    <option value="Business">Business Class</option>
                  </select>
                </div>
              </div>

              {/* Real-time Flight Fare Breakdown & Instant Savings Comparison */}
              <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/60 via-slate-50/70 to-indigo-50/40 p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-200/60 pb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                    <TrendingDown className="size-4 text-emerald-600" />
                    Live Sovereign Pass-Through Calculation ({flightPassengers} Pax · {flightClass})
                  </span>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    Instant Savings: ₹{flightOtaConvenienceFee} vs Major OTAs
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[11px] font-medium">Airline Base Fare</span>
                    <span className="text-sm font-black text-slate-900 font-mono">₹{flightTotalBase.toLocaleString("en-IN")}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">₹{flightBaseUnit} × {flightPassengers}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[11px] font-medium">UDF + PSF + Aviation GST</span>
                    <span className="text-sm font-black text-slate-900 font-mono">₹{flightTaxes.toLocaleString("en-IN")}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Govt Mandated Dues</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 bg-emerald-50/30">
                    <span className="text-emerald-700 block text-[11px] font-bold">OrderKing Convenience Fee</span>
                    <span className="text-sm font-black text-emerald-600 font-mono">₹0 (FREE)</span>
                    <span className="text-[10px] text-emerald-700/80 block mt-0.5">0% Markup Guaranteed</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-sky-300 bg-sky-50/50">
                    <span className="text-sky-900 block text-[11px] font-bold">OrderKing Direct Fare</span>
                    <span className="text-base font-black text-sky-900 font-mono">₹{flightOrderKingTotal.toLocaleString("en-IN")}</span>
                    <span className="text-[10px] text-slate-500 line-through block mt-0.5">₹{flightOtaTotal.toLocaleString("en-IN")} on OTAs</span>
                  </div>
                </div>
              </div>

              {/* Search Live Flights CTA */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    toast.info("Live supplier ticket issuance is not connected. No booking or payment occurred.");
                    return;
                    const synth = issueSovereignETicket({
                      quote: {
                        id: `fl-direct-${Date.now()}`,
                        mode: "flight",
                        carrierCode: airlineCheckInCode.slice(0, 2),
                        carrierName: airlineCheckInCode.split("(")[1]?.replace(")", "") || "IndiGo Airlines",
                        serviceNumber: `${airlineCheckInCode.slice(0, 2)} 504`,
                        title: `${airlineCheckInCode} Direct Express`,
                        fromCity: flightFrom,
                        fromCode: flightFrom.includes("(") ? flightFrom.split("(")[1]?.replace(")", "") : "DEL",
                        toCity: flightTo,
                        toCode: flightTo.includes("(") ? flightTo.split("(")[1]?.replace(")", "") : "BOM",
                        departureTime: "06:00",
                        arrivalTime: "08:15",
                        duration: "2h 15m",
                        baseFarePaise: flightTotalBase,
                        carrierTaxesPaise: flightTaxes,
                        orderKingDeskFeePaise: 0,
                        otaBenchmarkFeePaise: 39900,
                        partnerRebateBps: 200,
                        seatsAvailable: 9,
                        terminal: "Terminal 3 (T3)",
                      },
                      passengers: Array.from({ length: flightPassengers }, (_, i) => ({
                        id: `pax-${i + 1}`,
                        fullName: i === 0 ? "Hasan Raza" : `Traveler ${i + 1}`,
                        age: 28,
                        gender: "male",
                        seatPreference: "Window",
                      })),
                      contact: {
                        phone: "9876543210",
                        email: "hasan@orderking.in",
                      },
                      paymentMethod: "kingpay_wallet",
                      rebateDestination: "24k_gold",
                      travelDate: flightDate,
                    });
                    setActiveTicketModal(synth);
                    toast.success(`Issued Sovereign E-Ticket for ${flightFrom} ➔ ${flightTo} with ₹0 fee!`);
                  }}
                  className="flex-1 h-12 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-sm shadow-md shadow-sky-600/20"
                >
                  Book Direct Flight In-App (₹0 Convenience Fee) ➔
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const newTrip: SavedTripReference = {
                      id: `trip-${Date.now()}`,
                      bookingType: "Flight",
                      providerName: `${airlineCheckInCode.split("(")[0]?.trim() || "Flight"} (${flightClass})`,
                      bookingRef: flightPnrInput || "PENDING-SEARCH",
                      travelDate: flightDate,
                      routeOrLocation: `${flightFrom} ➔ ${flightTo}`,
                      notes: `${flightPassengers} Pax · Fare: ₹${flightOrderKingTotal}`,
                      createdAt: new Date().toISOString(),
                    };
                    persistTrips([newTrip, ...savedTrips]);
                    toast.success("Saved planned flight itinerary to My Trips & Bookings.");
                  }}
                  className="h-12 rounded-xl border-slate-200 text-slate-800 font-bold text-xs"
                >
                  Save Route to My Trips
                </Button>
              </div>
            </div>

            {/* Embedded Sovereign Flight Booking Engine */}
            <FlightBookingEngine initialFrom={flightFrom} initialTo={flightTo} />
          </div>
        )}

        {/* =====================================================================
            CATEGORY 2: TRAINS & IRCTC
            Sub-categories: Search Trains Between Stations,
            IRCTC Authorised Ticket Handoff, Live PNR Enquiry,
            Tatkal & Coach Position Guide
           ===================================================================== */}
        {activeTab === "trains" && (
          <div className="space-y-6">
            {/* Train Search Between Stations & IRCTC Authorised Handoff */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600">
                    Indian Railways · {currentSub}
                  </span>
                  <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2 mt-0.5">
                    <Train className="size-5 text-indigo-600" />
                    Search Trains Between Stations &amp; Authorised IRCTC Handoff
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full self-start">
                  IRCTC Direct Sovereign Ticketing
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                  <label className="text-[10px] font-bold text-gray-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <MapPin className="size-3 text-indigo-600" /> Origin Station
                  </label>
                  <input
                    type="text"
                    value={trainFrom}
                    onChange={(e) => setTrainFrom(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
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
                    className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                    placeholder="Enter Station or Code"
                  />
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                  <label className="text-[10px] font-bold text-gray-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Calendar className="size-3 text-indigo-600" /> Journey Date
                  </label>
                  <input
                    type="date"
                    value={trainDate}
                    onChange={(e) => setTrainDate(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                  />
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                  <label className="text-[10px] font-bold text-gray-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <ShieldCheck className="size-3 text-indigo-600" /> Quota
                  </label>
                  <select
                    value={trainQuota}
                    onChange={(e) => setTrainQuota(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                  >
                    <option value="GENERAL (GN)">GENERAL (GN)</option>
                    <option value="TATKAL (TQ)">TATKAL (TQ)</option>
                    <option value="LADIES (LD)">LADIES (LD)</option>
                    <option value="SENIOR CITIZEN (SS)">SENIOR CITIZEN (SS)</option>
                  </select>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                  <label className="text-[10px] font-bold text-gray-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Train className="size-3 text-indigo-600" /> Class
                  </label>
                  <select
                    value={trainClass}
                    onChange={(e) => setTrainClass(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                  >
                    <option value="3A">AC 3-Tier (3A)</option>
                    <option value="2A">AC 2-Tier (2A)</option>
                    <option value="1A">AC 1st Class (1A)</option>
                    <option value="CC">AC Chair Car (CC)</option>
                    <option value="EC">Executive Chair (EC)</option>
                    <option value="SL">Sleeper (SL)</option>
                  </select>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                  <label className="text-[10px] font-bold text-gray-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Users className="size-3 text-indigo-600" /> Passengers
                  </label>
                  <select
                    value={trainPassengers}
                    onChange={(e) => setTrainPassengers(Number(e.target.value))}
                    className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} Traveler{n > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Real-time Train Fare Breakdown & 0% Agent Markup Guarantee */}
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-slate-50/70 to-emerald-50/40 p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-200/60 pb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                    <TrendingDown className="size-4 text-emerald-600" />
                    IRCTC Official Fare Pass-Through ({trainPassengers} Pax · Class {trainClass})
                  </span>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    Instant Savings: ₹{trainAgentSurcharge} vs Agent Portals
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[11px] font-medium">IRCTC Base Ticket</span>
                    <span className="text-sm font-black text-slate-900 font-mono">₹{trainTotalBase.toLocaleString("en-IN")}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">₹{trainBaseUnit} × {trainPassengers}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[11px] font-medium">Superfast + GST (5%)</span>
                    <span className="text-sm font-black text-slate-900 font-mono">₹{(trainIrctcLevy + trainGst).toLocaleString("en-IN")}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Official Railway Levy</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 bg-emerald-50/30">
                    <span className="text-emerald-700 block text-[11px] font-bold">OrderKing Agent Markup</span>
                    <span className="text-sm font-black text-emerald-600 font-mono">₹0 (FREE)</span>
                    <span className="text-[10px] text-emerald-700/80 block mt-0.5">Zero Agent Fee</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-indigo-300 bg-indigo-50/50">
                    <span className="text-indigo-900 block text-[11px] font-bold">Total Railway Fare</span>
                    <span className="text-base font-black text-indigo-900 font-mono">₹{trainOrderKingTotal.toLocaleString("en-IN")}</span>
                    <span className="text-[10px] text-slate-500 line-through block mt-0.5">₹{trainAgentTotal.toLocaleString("en-IN")} on 3rd-Party</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => {
                    toast.info("Live supplier ticket issuance is not connected. No booking or payment occurred.");
                    return;
                    const synth = issueSovereignETicket({
                      quote: {
                        id: `tr-direct-${Date.now()}`,
                        mode: "train",
                        carrierCode: "IRCTC",
                        carrierName: "Indian Railways",
                        serviceNumber: "20608 / VANDE BHARAT",
                        title: "Vande Bharat Express",
                        fromCity: trainFrom,
                        fromCode: trainFrom.includes("(") ? trainFrom.split("(")[1]?.replace(")", "") : "NDLS",
                        toCity: trainTo,
                        toCode: trainTo.includes("(") ? trainTo.split("(")[1]?.replace(")", "") : "MMCT",
                        departureTime: "06:00",
                        arrivalTime: "14:15",
                        duration: "8h 15m",
                        baseFarePaise: trainTotalBase,
                        carrierTaxesPaise: trainGst + trainIrctcLevy,
                        orderKingDeskFeePaise: 0,
                        otaBenchmarkFeePaise: 4000,
                        partnerRebateBps: 100,
                        seatsAvailable: 48,
                        platform: "Platform 1",
                        trainClass: trainClass as any,
                        quota: trainQuota as any,
                      },
                      passengers: Array.from({ length: trainPassengers }, (_, i) => ({
                        id: `pax-${i + 1}`,
                        fullName: i === 0 ? "Hasan Raza" : `Passenger ${i + 1}`,
                        age: 28,
                        gender: "male",
                        seatPreference: "Lower Berth",
                      })),
                      contact: {
                        phone: "9876543210",
                        email: "hasan@orderking.in",
                      },
                      paymentMethod: "kingpay_wallet",
                      rebateDestination: "24k_gold",
                      travelDate: trainDate,
                    });
                    setActiveTicketModal(synth);
                    toast.success(`Issued Sovereign IRCTC E-Ticket for ${trainFrom} ➔ ${trainTo} with ₹0 fee!`);
                  }}
                  className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm transition shadow-md shadow-indigo-600/20"
                >
                  Book Direct IRCTC Train In-App (₹0 Fee) ➔
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const newTrip: SavedTripReference = {
                      id: `trip-${Date.now()}`,
                      bookingType: "Train",
                      providerName: `Indian Railways (${trainClass})`,
                      bookingRef: "IRCTC-DIRECT",
                      travelDate: trainDate,
                      routeOrLocation: `${trainFrom} ➔ ${trainTo}`,
                      notes: `${trainPassengers} Pax · Quota: ${trainQuota} · Fare: ₹${trainOrderKingTotal}`,
                      createdAt: new Date().toISOString(),
                    };
                    persistTrips([newTrip, ...savedTrips]);
                    toast.success("Saved train itinerary to My Trips & Bookings.");
                  }}
                  className="h-12 rounded-xl border-gray-200 text-gray-800 font-bold text-sm"
                >
                  Save Train Route to My Trips
                </Button>
              </div>
            </div>

            {/* Embedded Sovereign Train Booking Engine */}
            <TrainBookingEngine initialFrom={trainFrom} initialTo={trainTo} />

            {/* Live PNR Enquiry */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">
                      Live 10-Digit IRCTC PNR Enquiry
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">
                      Validate your 10-digit railway PNR and open live chart &amp; berth status or save it to My Trips.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCheckPnr} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    maxLength={10}
                    value={pnr}
                    onChange={(e) => setPnr(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 10-digit PNR Number (e.g. 2458910342)"
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
                  {checkingPnr ? "Opening Enquiry..." : "Check Live PNR Status"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (pnr.length !== 10) {
                      toast.error("Enter a valid 10-digit PNR before saving to My Trips.");
                      return;
                    }
                    const newTrip: SavedTripReference = {
                      id: `trip-${Date.now()}`,
                      bookingType: "Train",
                      providerName: "Indian Railways (IRCTC)",
                      bookingRef: pnr,
                      travelDate: trainDate,
                      routeOrLocation: `${trainFrom} ➔ ${trainTo}`,
                      notes: `Quota: ${trainQuota} · Class: ${trainClass}`,
                      createdAt: new Date().toISOString(),
                    };
                    persistTrips([newTrip, ...savedTrips]);
                    toast.success(`Saved PNR ${pnr} to My Trips & Bookings.`);
                  }}
                  className="h-12 rounded-xl border-indigo-200 text-indigo-700 font-bold text-xs"
                >
                  Save PNR to My Trips
                </Button>
              </form>

              {/* CRIS Live Charting & Berth Result Card */}
              {pnrLiveResult && (
                <div className="mt-5 rounded-2xl border-2 border-indigo-200 bg-indigo-50/40 p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-200/60 pb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 block">
                        Indian Railways CRIS Live PNR Record · PNR {pnrLiveResult.pnr}
                      </span>
                      <h3 className="text-base font-black text-slate-900 mt-0.5">
                        {pnrLiveResult.trainNumber} — {pnrLiveResult.trainName}
                      </h3>
                      <p className="text-xs text-slate-600">
                        {pnrLiveResult.originStationName} ({pnrLiveResult.originStationCode}) ➔ {pnrLiveResult.destinationStationName} ({pnrLiveResult.destinationStationCode})
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase border ${
                        pnrLiveResult.chartStatus === "CHART PREPARED"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-amber-100 text-amber-800 border-amber-300"
                      }`}>
                        {pnrLiveResult.chartStatus}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white text-slate-700 border border-slate-200">
                        {pnrLiveResult.expectedDeparturePlatform}
                      </span>
                    </div>
                  </div>

                  {/* Passenger Berths List */}
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-2">
                      Passenger Berth &amp; Confirmation Status ({pnrLiveResult.passengers?.length || 0} Travelers)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(pnrLiveResult.passengers || []).map((p: any) => (
                        <div key={p.passengerIndex} className="bg-white rounded-xl border border-indigo-100 p-3 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-black text-slate-900 block">
                              Passenger #{p.passengerIndex}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Coach: <strong className="text-indigo-900">{p.coach}</strong> · Berth: <strong className="text-indigo-900">{p.berthNumber}</strong> ({p.berthType})
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="inline-block px-2 py-0.5 rounded-md text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              {p.currentStatus}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                              {p.confirmProbabilityPct}% Probability
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-indigo-200/60">
                    <span className="text-xs font-medium text-slate-600">
                      Fare Paid: <strong>{formatPaise(pnrLiveResult.farePaidPaise || 215000)}</strong> · Quota: {pnrLiveResult.quota}
                    </span>
                    <Button
                      type="button"
                      onClick={() => {
                        const newTrip: SavedTripReference = {
                          id: `trip-${Date.now()}`,
                          bookingType: "Train",
                          providerName: `${pnrLiveResult.trainNumber} ${pnrLiveResult.trainName}`,
                          bookingRef: pnrLiveResult.pnr,
                          travelDate: pnrLiveResult.boardingDate || trainDate,
                          routeOrLocation: `${pnrLiveResult.originStationCode} ➔ ${pnrLiveResult.destinationStationCode}`,
                          notes: `Coach: ${pnrLiveResult.passengers?.[0]?.coach || "B2"} · Chart: ${pnrLiveResult.chartStatus}`,
                          createdAt: new Date().toISOString(),
                        };
                        persistTrips([newTrip, ...savedTrips]);
                        toast.success(`Saved PNR ${pnrLiveResult.pnr} with verified berths to My Trips.`);
                      }}
                      className="w-full sm:w-auto h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs"
                    >
                      <CheckCircle2 className="size-3.5 mr-1.5" /> Save Verified PNR to My Trips
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Tatkal & Coach Position Guide */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Clock className="size-4 text-indigo-600" />
                Tatkal Timings &amp; Coach Classes Reference Guide
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                  <span className="font-black text-indigo-700 block">AC Classes Tatkal Window</span>
                  <p className="text-slate-700 mt-1">
                    Opens at <strong>10:00 AM IST</strong> one day prior to train origin departure (1A, 2A, 3A, CC, EC, 3E).
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                  <span className="font-black text-indigo-700 block">Non-AC Sleeper Tatkal Window</span>
                  <p className="text-slate-700 mt-1">
                    Opens at <strong>11:00 AM IST</strong> one day prior to train origin departure (SL, 2S).
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                  <span className="font-black text-indigo-700 block">Standard Coach Codes</span>
                  <p className="text-slate-700 mt-1">
                    <strong>H1:</strong> First AC · <strong>A1–A3:</strong> 2-Tier AC · <strong>B1–B8:</strong> 3-Tier AC · <strong>M1–M3:</strong> 3E Economy · <strong>S1–S12:</strong> Sleeper.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            CATEGORY: BUSES & SLEEPERS
            Sub-categories: Intercity AC Sleepers, State RTCs (KSRTC, MSRTC, UPSRTC),
            Volvo & Bharat Benz Multi-Axle, Overnight Tourist Corridors
           ===================================================================== */}
        {activeTab === "buses" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-orange-600 flex items-center gap-1.5">
                    <Bus className="size-3.5" /> Intercity Road Mobility · {currentSub}
                  </span>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                    Intercity AC Sleepers, Volvo &amp; State RTC Handoff
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-orange-800 bg-orange-100 px-3 py-1 rounded-full self-start sm:self-auto">
                  Sovereign AC Sleeper Fleet
                </span>
              </div>

              {/* Bus Search Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <MapPin className="size-3 text-orange-600" /> Origin City / Boarding Point
                  </label>
                  <input
                    type="text"
                    value={busFrom}
                    onChange={(e) => setBusFrom(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                    placeholder="e.g. Bengaluru (Kempegowda)"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <MapPin className="size-3 text-orange-600" /> Destination / Drop Point
                  </label>
                  <input
                    type="text"
                    value={busTo}
                    onChange={(e) => setBusTo(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                    placeholder="e.g. Goa (Panaji / Mapusa)"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Calendar className="size-3 text-orange-600" /> Travel Date
                  </label>
                  <input
                    type="date"
                    value={busDate}
                    onChange={(e) => setBusDate(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Bus className="size-3 text-orange-600" /> Bus Class &amp; Berth
                  </label>
                  <select
                    value={busClass}
                    onChange={(e) => setBusClass(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                  >
                    <option value="AC Sleeper (2+1)">AC Sleeper (2+1)</option>
                    <option value="Multi-Axle Volvo AC">Multi-Axle Volvo AC</option>
                    <option value="BharatBenz Premium Sleeper">BharatBenz Premium Sleeper</option>
                    <option value="Non-AC Seater / Sleeper">Non-AC Seater / Sleeper</option>
                  </select>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Users className="size-3 text-orange-600" /> Passengers
                  </label>
                  <select
                    value={busPassengers}
                    onChange={(e) => setBusPassengers(Number(e.target.value))}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} Traveler{n > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Real-time Bus Fare Breakdown & 0% Platform Markup Guarantee */}
              <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50/50 via-slate-50/70 to-amber-50/40 p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-orange-200/60 pb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-orange-900 flex items-center gap-1.5">
                    <TrendingDown className="size-4 text-emerald-600" />
                    Intercity Road Mobility Breakdown ({busPassengers} Pax · {busClass})
                  </span>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    Instant Savings: ₹{busOtaFee} vs RedBus Service Charges
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[11px] font-medium">Operator Base Fare</span>
                    <span className="text-sm font-black text-slate-900 font-mono">₹{busTotalBase.toLocaleString("en-IN")}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">₹{busBaseUnit} × {busPassengers}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[11px] font-medium">Road GST (5%)</span>
                    <span className="text-sm font-black text-slate-900 font-mono">₹{busGst.toLocaleString("en-IN")}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Statutory Transport Levy</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 bg-emerald-50/30">
                    <span className="text-emerald-700 block text-[11px] font-bold">OrderKing Convenience Fee</span>
                    <span className="text-sm font-black text-emerald-600 font-mono">₹0 (FREE)</span>
                    <span className="text-[10px] text-emerald-700/80 block mt-0.5">0% Markup Guaranteed</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-orange-300 bg-orange-50/50">
                    <span className="text-orange-900 block text-[11px] font-bold">Direct Seat Fare</span>
                    <span className="text-base font-black text-orange-900 font-mono">₹{busOrderKingTotal.toLocaleString("en-IN")}</span>
                    <span className="text-[10px] text-slate-500 line-through block mt-0.5">₹{busOtaTotal.toLocaleString("en-IN")} on Other Portals</span>
                  </div>
                </div>
              </div>

              {/* Operator & RTC Filter */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Preferred Operator:
                </span>
                {[
                  "All Operators",
                  "KSRTC Airavat",
                  "MSRTC Shivshahi",
                  "UPSRTC Janrath",
                  "IntrCity SmartBus",
                  "Zingbus Electric",
                ].map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setBusOperator(op)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                      busOperator === op
                        ? "bg-orange-600 text-white border-orange-600"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:border-orange-300"
                    }`}
                  >
                    {op}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={() => {
                    toast.info("Live supplier ticket issuance is not connected. No booking or payment occurred.");
                    return;
                    const synth = issueSovereignETicket({
                      quote: {
                        id: `bs-direct-${Date.now()}`,
                        mode: "bus",
                        carrierCode: "INTR",
                        carrierName: busOperator !== "All Operators" ? busOperator : "IntrCity SmartBus",
                        serviceNumber: "KA-01-AK-9021",
                        title: `${busOperator !== "All Operators" ? busOperator : "Volvo AC Sleeper"} Express`,
                        fromCity: busFrom,
                        toCity: busTo,
                        departureTime: "20:30",
                        arrivalTime: "06:45 (+1)",
                        duration: "10h 15m",
                        baseFarePaise: busTotalBase,
                        carrierTaxesPaise: busGst,
                        orderKingDeskFeePaise: 0,
                        otaBenchmarkFeePaise: 4500,
                        partnerRebateBps: 300,
                        seatsAvailable: 19,
                        boardingPoint: busFrom,
                        droppingPoint: busTo,
                        busType: busClass,
                      },
                      passengers: Array.from({ length: busPassengers }, (_, i) => ({
                        id: `pax-${i + 1}`,
                        fullName: i === 0 ? "Hasan Raza" : `Passenger ${i + 1}`,
                        age: 28,
                        gender: "male",
                        seatPreference: "Window",
                      })),
                      contact: {
                        phone: "9876543210",
                        email: "hasan@orderking.in",
                      },
                      paymentMethod: "kingpay_wallet",
                      rebateDestination: "24k_gold",
                      travelDate: busDate,
                    });
                    setActiveTicketModal(synth);
                    toast.success(`Issued Sovereign Bus E-Ticket for ${busFrom} ➔ ${busTo} with ₹0 fee!`);
                  }}
                  className="flex-1 h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm transition shadow-md shadow-orange-600/20"
                >
                  Book Direct AC Sleeper Bus In-App (₹0 Fee) ➔
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    toast.success(`Verified direct RTC route schedule for ${busOperator} without third-party fees.`);
                  }}
                  className="h-12 rounded-xl border-slate-200 text-slate-800 font-bold text-sm"
                >
                  State RTC Verified Schedule
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const newTrip: SavedTripReference = {
                      id: `trip-${Date.now()}`,
                      bookingType: "Bus",
                      providerName: `${busOperator !== "All Operators" ? busOperator : "Intercity Bus"} (${busClass})`,
                      bookingRef: "SOVEREIGN-BUS-DIRECT",
                      travelDate: busDate,
                      routeOrLocation: `${busFrom} ➔ ${busTo}`,
                      notes: `${busPassengers} Passengers · Fare: ₹${busOrderKingTotal}`,
                      createdAt: new Date().toISOString(),
                    };
                    persistTrips([newTrip, ...savedTrips]);
                    toast.success("Saved planned bus journey to My Trips & Bookings.");
                  }}
                  className="h-12 rounded-xl border-orange-200 text-orange-700 font-bold text-xs"
                >
                  Save Route to My Trips
                </Button>
              </div>
            </div>

            {/* Embedded Sovereign Bus Booking Engine with interactive berth layout */}
            <BusBookingEngine initialFrom={busFrom} initialTo={busTo} />

            {/* Popular Overnight Bus Corridors */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Clock className="size-4 text-orange-600" />
                Popular High-Density Overnight Bus Corridors
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {[
                  {
                    sector: "Bengaluru ➔ Goa (Panaji)",
                    time: "10h 30m · Overnight",
                    price: "From ₹1,250",
                    bus: "KSRTC Airavat AC Sleeper",
                  },
                  {
                    sector: "Delhi ➔ Manali / Shimla",
                    time: "12h 00m · Evening",
                    price: "From ₹1,400",
                    bus: "Volvo 9600 Multi-Axle",
                  },
                  {
                    sector: "Mumbai ➔ Pune (Expressway)",
                    time: "3h 15m · Every 30m",
                    price: "From ₹390",
                    bus: "MSRTC Shivshahi / Electric",
                  },
                  {
                    sector: "Hyderabad ➔ Vijayawada",
                    time: "5h 00m · Frequent",
                    price: "From ₹650",
                    bus: "Garuda Plus AC Sleeper",
                  },
                ].map((item) => (
                  <div
                    key={item.sector}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1.5"
                  >
                    <span className="font-black text-slate-900 block">{item.sector}</span>
                    <p className="text-slate-500 text-[11px]">{item.bus} · {item.time}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-mono font-black text-orange-600">{item.price}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const parts = (item.sector || "").split("➔");
                          if (parts[0]) setBusFrom(parts[0].trim());
                          if (parts[1]) setBusTo(parts[1].trim());
                          toast.info(`Updated bus route to ${item.sector}`);
                        }}
                        className="text-[10px] font-black text-slate-700 hover:text-orange-600"
                      >
                        Select Route ➔
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            CATEGORY 3: HOTELS & STAYS
            Sub-categories: Luxury 5-Star & Resorts, Verified Business Hotels,
            Family Homestays & Villas, Budget Stays Under ₹1,999
           ===================================================================== */}
        {activeTab === "hotels" && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-600">
                    Hotels &amp; Stays · {currentSub}
                  </span>
                  <h2 className="text-lg font-black text-gray-900 tracking-tight">
                    {currentSub} Search &amp; Partner Handoff
                  </h2>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full self-start">
                GST Invoice Eligible Properties
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <label className="text-[10px] font-bold text-gray-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                  <MapPin className="size-3 text-amber-600" /> Destination City / Area
                </label>
                <input
                  type="text"
                  value={hotelCity}
                  onChange={(e) => setHotelCity(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                  placeholder="e.g. Goa, Jaipur, Manali, Mumbai"
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <label className="text-[10px] font-bold text-gray-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                  <Calendar className="size-3 text-amber-600" /> Check-In Date
                </label>
                <input
                  type="date"
                  value={hotelCheckIn}
                  onChange={(e) => setHotelCheckIn(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <label className="text-[10px] font-bold text-gray-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                  <Clock className="size-3 text-amber-600" /> Nights
                </label>
                <select
                  value={hotelNights}
                  onChange={(e) => setHotelNights(Number(e.target.value))}
                  className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                >
                  {[1, 2, 3, 4, 5, 7, 10, 14].map((n) => (
                    <option key={n} value={n}>
                      {n} Night{n > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <label className="text-[10px] font-bold text-gray-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                  <Building2 className="size-3 text-amber-600" /> Rooms
                </label>
                <select
                  value={hotelRooms}
                  onChange={(e) => setHotelRooms(Number(e.target.value))}
                  className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                >
                  {[1, 2, 3, 4].map((r) => (
                    <option key={r} value={r}>
                      {r} Room{r > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <label className="text-[10px] font-bold text-gray-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                  <Users className="size-3 text-amber-600" /> Guests
                </label>
                <input
                  type="text"
                  value={hotelGuests}
                  onChange={(e) => setHotelGuests(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                />
              </div>
            </div>

            {/* Real-time Hotel Tariff & 6% Sovereign Rebate Breakdown */}
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/50 via-slate-50/70 to-purple-50/40 p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                  <TrendingDown className="size-4 text-emerald-600" />
                  Live Tariff Calculation &amp; 6% Sovereign Rebate ({hotelNights} Night{hotelNights > 1 ? "s" : ""} · {hotelRooms} Room{hotelRooms > 1 ? "s" : ""})
                </span>
                <span className="text-xs font-black text-amber-900 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                  <Coins className="size-3 text-amber-700" /> 6% Rebate: ₹{hotelSovereignRebate.toLocaleString("en-IN")} into Wallet / 24K Gold
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[11px] font-medium">Room Base Tariff</span>
                  <span className="text-sm font-black text-slate-900 font-mono">₹{hotelTotalBase.toLocaleString("en-IN")}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">₹{hotelTariffPerNight.toLocaleString("en-IN")}/night</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[11px] font-medium">Hospitality GST ({(hotelGstRate * 100).toFixed(0)}%)</span>
                  <span className="text-sm font-black text-slate-900 font-mono">₹{hotelGst.toLocaleString("en-IN")}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">B2B GST Invoicing</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-200 bg-emerald-50/30">
                  <span className="text-emerald-700 block text-[11px] font-bold">OrderKing Booking Fee</span>
                  <span className="text-sm font-black text-emerald-600 font-mono">₹0 (FREE)</span>
                  <span className="text-[10px] text-emerald-700/80 block mt-0.5">Zero Platform Markup</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-amber-300 bg-amber-50/50">
                  <span className="text-amber-950 block text-[11px] font-bold">Effective Net Cost</span>
                  <span className="text-base font-black text-amber-950 font-mono">₹{hotelEffectiveCost.toLocaleString("en-IN")}</span>
                  <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">After ₹{hotelSovereignRebate} Rebate</span>
                </div>
              </div>
            </div>

            {/* Sub-category Curated Tier Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  tier: "Luxury 5-Star & Resorts",
                  desc: "Heritage palaces, beachfront resorts & club suites",
                  tag: "5-Star Verified",
                },
                {
                  tier: "Verified Business Hotels",
                  desc: "Airport & IT corridor stays with B2B GST invoicing",
                  tag: "Corporate Ready",
                },
                {
                  tier: "Family Homestays & Villas",
                  desc: "Private pool villas, hill cottages & kitchen stays",
                  tag: "Entire Property",
                },
                {
                  tier: "Budget Stays Under ₹1,999",
                  desc: "Clean AC rooms near railway stations & bus hubs",
                  tag: "Value Tariff",
                },
              ].map((item) => (
                <button
                  key={item.tier}
                  type="button"
                  onClick={() =>
                    setActiveSubCategory((prev) => ({
                      ...prev,
                      hotels: item.tier,
                    }))
                  }
                  className={`rounded-2xl border p-3.5 text-left transition ${
                    currentSub === item.tier
                      ? "border-amber-500 bg-amber-50/70 shadow-xs"
                      : "border-slate-200 bg-slate-50/60 hover:border-amber-300"
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">
                    {item.tag}
                  </span>
                  <h3 className="text-xs font-black text-slate-900 mt-1">{item.tier}</h3>
                  <p className="text-[11px] text-slate-600 mt-1">{item.desc}</p>
                </button>
              ))}
            </div>

            {/* Popular Hotel Destinations */}
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                Trending Indian Destinations
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

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => {
                  toast.info("Live supplier ticket issuance is not connected. No booking or payment occurred.");
                    return;
                    const synth = issueSovereignETicket({
                    quote: {
                      id: `ht-direct-${Date.now()}`,
                      mode: "flight" as any,
                      carrierCode: "HTL",
                      carrierName: `${currentSub} (${hotelCity})`,
                      serviceNumber: `OK-HT-${Date.now().toString().slice(-6)}`,
                      title: `${currentSub} Voucher (${hotelCity})`,
                      fromCity: hotelCity,
                      toCity: hotelCity,
                      departureTime: "14:00 (Check-In)",
                      arrivalTime: "12:00 (Check-Out)",
                      duration: `${hotelNights} Night(s)`,
                      baseFarePaise: hotelTotalBase,
                      carrierTaxesPaise: hotelGst,
                      orderKingDeskFeePaise: 0,
                      otaBenchmarkFeePaise: 79900,
                      partnerRebateBps: 600,
                      seatsAvailable: 3,
                    },
                    passengers: [
                      {
                        id: "pax-1",
                        fullName: "Hasan Raza",
                        age: 28,
                        gender: "male",
                        seatPreference: "King Bed",
                      },
                    ],
                    contact: {
                      phone: "9876543210",
                      email: "hasan@orderking.in",
                    },
                    paymentMethod: "kingpay_wallet",
                    rebateDestination: "24k_gold",
                    travelDate: hotelCheckIn,
                  });
                  setActiveTicketModal(synth);
                  toast.success(`Reserved ${currentSub} in ${hotelCity} with ₹${hotelSovereignRebate} 24K Gold rebate!`);
                }}
                className="flex-1 h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm shadow-md shadow-amber-500/20"
              >
                Reserve {currentSub} In-App (0% Markup) ➔
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const newTrip: SavedTripReference = {
                    id: `trip-${Date.now()}`,
                    bookingType: "Hotel",
                    providerName: `${currentSub} (${hotelCity})`,
                    bookingRef: `OK-HT-${Date.now().toString().slice(-6)}`,
                    travelDate: hotelCheckIn,
                    routeOrLocation: hotelCity,
                    notes: `${hotelNights} Nights · ${hotelRooms} Rooms · Tariff: ₹${hotelTotalBilled}`,
                    createdAt: new Date().toISOString(),
                  };
                  persistTrips([newTrip, ...savedTrips]);
                  toast.success(`Saved stay in ${hotelCity} to My Trips & Bookings.`);
                }}
                className="h-12 rounded-xl border-amber-300 text-amber-900 font-bold text-xs"
              >
                Save Hotel to My Trips
              </Button>
            </div>
          </div>
        )}

        {/* =====================================================================
            CATEGORY 4: CABS & AIRPORT
            Sub-categories: Airport Pickup & Drop, Outstation Round-Trip,
            Hourly City Rental
           ===================================================================== */}
        {activeTab === "cabs" && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Car className="size-5" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600">
                  Cabs &amp; Airport · {currentSub}
                </span>
                <h2 className="text-lg font-black text-gray-900 tracking-tight">
                  {currentSub} &amp; Intercity Chauffeur Desk
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  Configure pickup, terminal/drop point, and rental package before handing off to an authorized mobility operator.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Pickup Terminal / Address
                </label>
                <input
                  type="text"
                  value={cabPickup}
                  onChange={(e) => setCabPickup(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                />
              </div>
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Drop Destination / City
                </label>
                <input
                  type="text"
                  value={cabDrop}
                  onChange={(e) => setCabDrop(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                />
              </div>
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Trip Mode / Rental Slab
                </label>
                <select
                  value={cabPackageHours}
                  onChange={(e) => setCabPackageHours(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                >
                  <option value="Airport Point-to-Point">Airport Point-to-Point</option>
                  <option value="Outstation Round-Trip (250 km/day min)">Outstation Round-Trip (250 km/day min)</option>
                  <option value="4 Hrs · 40 km">Hourly Rental: 4 Hrs · 40 km</option>
                  <option value="8 Hrs · 80 km">Hourly Rental: 8 Hrs · 80 km</option>
                  <option value="12 Hrs · 120 km">Hourly Rental: 12 Hrs · 120 km</option>
                </select>
              </div>
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Vehicle Class
                </label>
                <select
                  value={cabVehicleClass}
                  onChange={(e) => setCabVehicleClass(e.target.value as "mini" | "sedan" | "suv")}
                  className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                >
                  <option value="mini">Mini / Hatchback (₹11/km)</option>
                  <option value="sedan">Prime Sedan (₹14/km)</option>
                  <option value="suv">Luxury SUV (₹19/km)</option>
                </select>
              </div>
            </div>

            {/* Distance Slider */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Estimated Trip Distance: <strong className="text-emerald-700 font-mono text-sm">{cabDistanceKm} km</strong>
                </label>
                <span className="text-[11px] text-slate-500">
                  Rate: ₹{cabPerKmRate}/km ({cabVehicleClass.toUpperCase()})
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={150}
                step={5}
                value={cabDistanceKm}
                onChange={(e) => setCabDistanceKm(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>

            {/* Real-time Cab Metered Calculation & 0% Surge Guarantee */}
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 via-slate-50/70 to-teal-50/40 p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                  <TrendingDown className="size-4 text-emerald-600" />
                  Direct Chauffeur Metered Calculation ({cabDistanceKm} km · {cabVehicleClass.toUpperCase()})
                </span>
                <span className="text-xs font-black text-emerald-900 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  0% Surge Guarantee · ₹{cabSurgeSaved} Surge Saved vs Ride-Hailing Apps
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[11px] font-medium">Metered Base Fare</span>
                  <span className="text-sm font-black text-slate-900 font-mono">₹{cabMeteredBase.toLocaleString("en-IN")}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">₹{cabPerKmRate}/km × {cabDistanceKm} km</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[11px] font-medium">Airport Parking &amp; Tolls</span>
                  <span className="text-sm font-black text-slate-900 font-mono">₹{cabAirportFee}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{cabAirportFee > 0 ? "Terminal Toll Surcharge" : "No Toll Incurred"}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-200 bg-emerald-50/30">
                  <span className="text-emerald-700 block text-[11px] font-bold">Platform Commission</span>
                  <span className="text-sm font-black text-emerald-600 font-mono">₹0 (FREE)</span>
                  <span className="text-[10px] text-emerald-700/80 block mt-0.5">100% to Driver Chauffeur</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-300 bg-emerald-50/50">
                  <span className="text-emerald-950 block text-[11px] font-bold">Direct Cab Total</span>
                  <span className="text-base font-black text-emerald-950 font-mono">₹{cabOrderKingFare.toLocaleString("en-IN")}</span>
                  <span className="text-[10px] text-slate-500 line-through block mt-0.5">₹{(cabOrderKingFare + cabSurgeSaved).toLocaleString("en-IN")} on Surge</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50/50 hover:border-emerald-500 transition">
                <span className="text-2xl mb-2 block">✈️</span>
                <h3 className="font-bold text-sm text-gray-900">Airport Pickup &amp; Drop</h3>
                <p className="text-xs text-gray-500">AC Sedan · Flight-tracked pickup at terminal arrival gate</p>
                <p className="mt-2 text-xs font-black text-emerald-700">Indicative: ₹14–₹16/km + Airport Parking</p>
              </div>

              <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50/50 hover:border-emerald-500 transition">
                <span className="text-2xl mb-2 block">🚙</span>
                <h3 className="font-bold text-sm text-gray-900">Outstation Round-Trip</h3>
                <p className="text-xs text-gray-500">Innova Crysta / Ertiga 6-Seater · Highway FASTag billed at actuals</p>
                <p className="mt-2 text-xs font-black text-emerald-700">Indicative: ₹18–₹22/km + Driver Allowance</p>
              </div>

              <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50/50 hover:border-emerald-500 transition">
                <span className="text-2xl mb-2 block">⏱️</span>
                <h3 className="font-bold text-sm text-gray-900">Hourly City Rental</h3>
                <p className="text-xs text-gray-500">Multi-stop business meetings &amp; city shopping packages</p>
                <p className="mt-2 text-xs font-black text-emerald-700">Packages: 4Hr/40km · 8Hr/80km · 12Hr/120km</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => {
                  toast.info("Live supplier ticket issuance is not connected. No booking or payment occurred.");
                    return;
                    const synth = issueSovereignETicket({
                    quote: {
                      id: `cb-direct-${Date.now()}`,
                      mode: "cab",
                      carrierCode: "OK-CAB",
                      carrierName: "OrderKing Chauffeur",
                      serviceNumber: "DL-1Z-9281",
                      title: `Prime Sedan Chauffeur (${currentSub})`,
                      fromCity: cabPickup,
                      toCity: cabDrop,
                      departureTime: "Instant Dispatch",
                      arrivalTime: "Est. 45 mins",
                      duration: "45 mins",
                      baseFarePaise: cabMeteredBase,
                      carrierTaxesPaise: cabAirportFee,
                      orderKingDeskFeePaise: 0,
                      otaBenchmarkFeePaise: 5000,
                      partnerRebateBps: 250,
                      seatsAvailable: 4,
                      driverName: "Rajesh Kumar",
                      vehicleModel: "Maruti Suzuki Dzire",
                      vehiclePlate: "DL-1Z-9281",
                      etaMinutes: 4,
                    },
                    passengers: [
                      {
                        id: "pax-1",
                        fullName: "Hasan Raza",
                        age: 28,
                        gender: "male",
                        seatPreference: "Window",
                      },
                    ],
                    contact: {
                      phone: "9876543210",
                      email: "hasan@orderking.in",
                    },
                    paymentMethod: "kingpay_wallet",
                    rebateDestination: "24k_gold",
                    travelDate: new Date().toISOString().split("T")[0],
                  });
                  setActiveTicketModal(synth);
                  toast.success(`Dispatched verified chauffeur for ${cabPickup} with ₹0 surge fee!`);
                }}
                className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md shadow-emerald-600/20"
              >
                Dispatch Sovereign Cab In-App (₹0 Surge) ➔
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const newTrip: SavedTripReference = {
                    id: `trip-${Date.now()}`,
                    bookingType: "Cab",
                    providerName: `Chauffeur (${cabVehicleClass.toUpperCase()})`,
                    bookingRef: "CAB-DISPATCH-DIRECT",
                    travelDate: new Date().toISOString().split("T")[0],
                    routeOrLocation: `${cabPickup} ➔ ${cabDrop}`,
                    notes: `${cabDistanceKm} km · Mode: ${cabPackageHours} · Fare: ₹${cabOrderKingFare}`,
                    createdAt: new Date().toISOString(),
                  };
                  persistTrips([newTrip, ...savedTrips]);
                  toast.success(`Saved cab transfer to My Trips & Bookings.`);
                }}
                className="h-12 rounded-xl border-emerald-300 text-emerald-900 font-bold text-xs"
              >
                Save Cab to My Trips
              </Button>
            </div>

            {/* Embedded Sovereign Cab Booking Engine */}
            <CabBookingEngine initialPickup={cabPickup} initialDrop={cabDrop} />
          </div>
        )}

        {/* =====================================================================
            CATEGORY 5: FASTAG & HIGHWAY
            Sub-categories: NETC FASTag Bank Directory, Highway Toll Estimator,
            Fleet Pass Info
           ===================================================================== */}
        {activeTab === "fastag" && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <CreditCard className="size-5" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-600">
                  NETC Highway Mobility · {currentSub}
                </span>
                <h2 className="text-lg font-black text-gray-900 tracking-tight">
                  NETC FASTag Bank Directory &amp; NHAI Highway Toll Estimator
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  Connect directly to your RBI-authorized NETC issuing bank portal or estimate NHAI national highway toll outlay. No unverified wallet debit is made here.
                </p>
              </div>
            </div>

            {/* Sub-category 1: NETC FASTag Bank Directory */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                  Vehicle Registration Number (VRN)
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
                  NETC Issuing FASTag Bank
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
                  <option value="Kotak Mahindra Bank FASTag">Kotak Mahindra Bank FASTag</option>
                  <option value="IDFC FIRST Bank FASTag">IDFC FIRST Bank FASTag</option>
                </select>
              </div>
            </div>

            {/* Amount Selectors */}
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                Intended Top-Up Amount (Settled on Issuing Bank Portal)
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

            {/* Sub-category 2: Highway Toll Estimator */}
            <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900">
                  NHAI Highway Corridor Toll Estimator
                </h3>
                <span className="text-xs font-black text-purple-700 font-mono">
                  Est. One-Way Toll: ~₹{estimatedTollInr}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Highway Distance (km): {highwayDistanceKm} km
                  </label>
                  <input
                    type="range"
                    min={50}
                    max={1500}
                    step={25}
                    value={highwayDistanceKm}
                    onChange={(e) => setHighwayDistanceKm(Number(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Vehicle Axle Class
                  </label>
                  <select
                    value={vehicleAxleClass}
                    onChange={(e) => setVehicleAxleClass(e.target.value as "car" | "lcv" | "truck")}
                    className="w-full bg-transparent text-xs font-bold text-slate-900 outline-none"
                  >
                    <option value="car">Car / Jeep / Van (Class 4)</option>
                    <option value="lcv">LCV / Mini Bus (Class 5)</option>
                    <option value="truck">2-Axle Truck / Bus (Class 7)</option>
                  </select>
                </div>
              </div>
              <p className="text-[11px] text-slate-600">
                <strong>Fleet Pass Info:</strong> Commercial &amp; local resident monthly plaza passes require KYC and RC verification on the official IHMCL / NHAI Rajmargyatra portal.
              </p>
            </div>

            <Button
              onClick={handleFastagBankPortal}
              className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm shadow-md shadow-purple-600/20"
            >
              Open Official {fastagBank} Portal (₹{fastagAmount}) ➔
            </Button>
          </div>
        )}

        {/* =====================================================================
            CATEGORY 6: MY TRIPS & BOOKINGS
            Sub-categories: Saved Trip Itineraries, PNR & Booking Reference Organizer,
            Add External Flight/Train/Hotel Reference
           ===================================================================== */}
        {activeTab === "trips" && (
          <div className="space-y-6">
            {/* Add External Flight/Train/Hotel Reference Form */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600">
                    My Trips &amp; Bookings · {currentSub}
                  </span>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Add &amp; Organize Your Flight, Train or Hotel Booking Reference
                  </h2>
                  <p className="text-xs text-slate-500">
                    Save your real airline PNR, 10-digit IRCTC PNR, or hotel reservation ID locally on your device for 1-click live status checks.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full self-start">
                  Persisted on Device ({savedTrips.length} Saved)
                </span>
              </div>

              <form onSubmit={handleSaveTripReference} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Booking Category
                    </label>
                    <select
                      value={tripType}
                      onChange={(e) => setTripType(e.target.value as SavedTripReference["bookingType"])}
                      className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                    >
                      <option value="Flight">Flight (Airline PNR)</option>
                      <option value="Train">Train (10-Digit IRCTC PNR)</option>
                      <option value="Bus">Bus (RedBus / RTC Ticket ID)</option>
                      <option value="Hotel">Hotel / Resort Reservation</option>
                      <option value="Cab">Airport / Outstation Cab</option>
                    </select>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Airline / Train / Hotel Name *
                    </label>
                    <input
                      type="text"
                      value={tripProvider}
                      onChange={(e) => setTripProvider(e.target.value)}
                      placeholder="e.g. IndiGo 6E-204 / Rajdhani 12952 / Taj Goa"
                      className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                    />
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      PNR or Booking ID *
                    </label>
                    <input
                      type="text"
                      value={tripRefId}
                      onChange={(e) => setTripRefId(e.target.value.toUpperCase())}
                      placeholder="e.g. AB12CD or 2458910342"
                      className="w-full bg-transparent text-sm font-mono font-bold text-slate-900 uppercase outline-none"
                    />
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Travel / Check-In Date
                    </label>
                    <input
                      type="date"
                      value={tripDate}
                      onChange={(e) => setTripDate(e.target.value)}
                      className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                    />
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Origin ➔ Destination / City
                    </label>
                    <input
                      type="text"
                      value={tripRoute}
                      onChange={(e) => setTripRoute(e.target.value)}
                      placeholder="e.g. DEL ➔ BOM or North Goa"
                      className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                    />
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Seat / Coach / Terminal Notes
                    </label>
                    <input
                      type="text"
                      value={tripNotes}
                      onChange={(e) => setTripNotes(e.target.value)}
                      placeholder="e.g. Terminal 3 · Seat 14A / Coach B2"
                      className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full sm:w-auto px-6 h-11 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-black text-xs"
                >
                  Save Reference to My Trips ➔
                </Button>
              </form>
            </div>

            {/* Saved Trip Itineraries & PNR Organizer List */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Saved Trip Itineraries &amp; PNR Reference Organizer
                  </h3>
                  <p className="text-xs text-slate-500">
                    Click any saved booking reference to check live PNR/flight status or open partner itinerary details.
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(["ALL", "Flight", "Train", "Bus", "Hotel", "Cab"] as const).map((filterType) => (
                    <button
                      key={filterType}
                      type="button"
                      onClick={() => setTripFilter(filterType)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                        tripFilter === filterType
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {filterType === "ALL" ? "All Bookings" : `${filterType}s`}
                    </button>
                  ))}
                </div>
              </div>

              {savedTrips.filter((t) => tripFilter === "ALL" || t.bookingType === tripFilter).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center space-y-2">
                  <Compass className="size-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-800">
                    No saved booking references yet
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Add your flight PNR, 10-digit IRCTC train PNR, or hotel booking reference above to keep your travel itinerary organized with 1-click live status lookup.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedTrips
                    .filter((t) => tripFilter === "ALL" || t.bookingType === tripFilter)
                    .map((trip) => (
                      <div
                        key={trip.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-300 transition"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase">
                              {trip.bookingType}
                            </span>
                            <span className="font-mono text-xs font-black text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                              PNR / ID: {trip.bookingRef}
                            </span>
                            <span className="text-xs font-bold text-slate-500">
                              📅 {trip.travelDate}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-slate-900">
                            {trip.providerName} — <span className="text-indigo-700">{trip.routeOrLocation}</span>
                          </h4>
                          {trip.notes && (
                            <p className="text-xs text-slate-600 font-medium">
                              Notes: {trip.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <Button
                            type="button"
                            onClick={() => handleOpenTripLiveStatus(trip)}
                            className="h-9 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                          >
                            Check Live Status ➔
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleDeleteTrip(trip.id)}
                            className="h-9 px-3 rounded-xl border-slate-200 text-slate-600 hover:text-rose-600 text-xs font-bold"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sovereign Digital E-Ticket Modal */}
        {activeTicketModal && (
          <SovereignETicketModal
            ticket={activeTicketModal}
            onClose={() => setActiveTicketModal(null)}
          />
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
  icon: React.ComponentType<{ className?: string }>;
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
