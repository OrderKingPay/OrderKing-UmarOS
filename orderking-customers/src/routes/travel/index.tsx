import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CustomerShell } from "@/components/market/shell";
import { SovereignETicketModal } from "@/components/fintech/sovereign-eticket-modal";
import {
  type SovereignETicket,
  getStoredETickets,
} from "@/lib/travel/in-app-booking-service";
import { buildOfficialAirlineDeepLink, extractAirportCode } from "@/lib/travel/airline-deep-links";
import {
  generateTravelpayoutsFlightLink,
  generateTravelpayoutsHotelLink,
  generateRedBusDomesticLink,
  generateTravelpayoutsDomesticLink,
} from "@/lib/travel/dual-travel-engine";
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
  ArrowLeftRight,
  MapPin,
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  Compass,
  Users,
  ArrowUpRight,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatPaise } from "@/lib/money";
import { TravelSkeleton } from "@/components/skeletons/travel-skeleton";
import { AppErrorComponent } from "@/lib/error-component";
import { AirportAutoSuggest, StationAutoSuggest } from "@/components/fintech/travel-autosuggest";
import { TP_MARKER, TP_WL_ID } from "@/lib/travel/travelpayouts-config";

export const Route = createFileRoute("/travel/")({
  component: TravelPage,
  pendingComponent: TravelSkeleton,
  errorComponent: AppErrorComponent,
});

export type TravelTab = "flights" | "trains" | "buses" | "hotels" | "cabs" | "fastag" | "trips";

export interface PopularRoute {
  id: string;
  type: "flight" | "train" | "bus";
  fromCity: string;
  fromCode: string;
  toCity: string;
  toCode: string;
  tag: string;
  partnerUrl: string;
}

export function getRoutePartnerHandoff(
  route: PopularRoute,
  opts?: { departureDate?: string; passengers?: number; cabinClass?: string; carrierCode?: string }
): {
  url: string;
  partnerName: string;
  portalName: string;
} {
  const departureDate = opts?.departureDate || new Date().toISOString().split("T")[0];
  const passengers = opts?.passengers || 1;
  const cabinClass = opts?.cabinClass || "Economy";
  const carrierCode = (opts?.carrierCode || "6E").toUpperCase();

  if (route.type === "flight") {
    const deepLink = buildOfficialAirlineDeepLink({
      carrierCode,
      from: route.fromCode,
      to: route.toCode,
      departureDate,
      passengers,
      cabinClass,
    });
    return {
      url: deepLink.bookingUrl,
      partnerName: deepLink.carrierName,
      portalName: deepLink.portalName,
    };
  }

  if (route.type === "train") {
    const cleanFrom = route.fromCode.replace(/[^A-Za-z]/g, "").toUpperCase();
    const cleanTo = route.toCode.replace(/[^A-Za-z]/g, "").toUpperCase();
    return {
      url: `https://www.irctc.co.in/nget/train-search?from=${cleanFrom}&to=${cleanTo}&date=${departureDate}`,
      partnerName: "IRCTC Official Rail",
      portalName: "irctc.co.in",
    };
  }

  const sourceCity = route.fromCity.replace(/\(.*\)/, "").trim();
  const destCity = route.toCity.replace(/\(.*\)/, "").trim();
  return {
    url: `https://www.redbus.in/bus-tickets/${encodeURIComponent(sourceCity.toLowerCase())}-to-${encodeURIComponent(destCity.toLowerCase())}`,
    partnerName: "Search on redBus",
    portalName: "redbus.in",
  };
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
    partnerUrl: "https://www.goindigo.in/booking/flight-select.html?orCity=DEL&destCity=BOM",
  },
  {
    id: "route-blr-del",
    type: "flight",
    fromCity: "Bengaluru",
    fromCode: "BLR",
    toCity: "New Delhi",
    toCode: "DEL",
    tag: "Metro Air",
    partnerUrl: "https://www.goindigo.in/booking/flight-select.html?orCity=BLR&destCity=DEL",
  },
  {
    id: "route-bom-goi",
    type: "flight",
    fromCity: "Mumbai",
    fromCode: "BOM",
    toCity: "Goa (Dabolim)",
    toCode: "GOI",
    tag: "Coastal Leisure",
    partnerUrl: "https://www.goindigo.in/booking/flight-select.html?orCity=BOM&destCity=GOI",
  },
  {
    id: "route-ccu-blr",
    type: "flight",
    fromCity: "Kolkata",
    fromCode: "CCU",
    toCity: "Bengaluru",
    toCode: "BLR",
    tag: "Business Route",
    partnerUrl: "https://www.goindigo.in/booking/flight-select.html?orCity=CCU&destCity=BLR",
  },
  {
    id: "route-ndls-mmct-raj",
    type: "train",
    fromCity: "New Delhi",
    fromCode: "NDLS",
    toCity: "Mumbai Central",
    toCode: "MMCT",
    tag: "Rajdhani Express",
    partnerUrl: "https://www.irctc.co.in/nget/train-search?from=NDLS&to=MMCT",
  },
  {
    id: "route-ndls-hwh-raj",
    type: "train",
    fromCity: "New Delhi",
    fromCode: "NDLS",
    toCity: "Howrah",
    toCode: "HWH",
    tag: "Howrah Rajdhani",
    partnerUrl: "https://www.irctc.co.in/nget/train-search?from=NDLS&to=HWH",
  },
  {
    id: "route-sbc-mas-vb",
    type: "train",
    fromCity: "Bengaluru",
    fromCode: "SBC",
    toCity: "Chennai Central",
    toCode: "MAS",
    tag: "Vande Bharat Express",
    partnerUrl: "https://www.irctc.co.in/nget/train-search?from=SBC&to=MAS",
  },
  {
    id: "route-blr-goa-bus",
    type: "bus",
    fromCity: "Bengaluru",
    fromCode: "Kempegowda",
    toCity: "Goa (Panaji)",
    toCode: "Kadamba",
    tag: "KSRTC Airavat AC",
    partnerUrl: "https://www.redbus.in/bus-tickets/bengaluru-to-goa",
  },
];

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

const OFFICIAL_AIRLINES = [
  { code: "6E", name: "IndiGo", portal: "goindigo.in" },
  { code: "AI", name: "Air India", portal: "airindia.com" },
  { code: "QP", name: "Akasa Air", portal: "akasaair.com" },
  { code: "SG", name: "SpiceJet", portal: "spicejet.com" },
];

export function TravelPage() {
  const [activeTab, setActiveTab] = useState<TravelTab>("flights");
  const sectionHash = useRouterState({ select: (s) => s?.location?.hash ?? "" }) ?? "";

  useEffect(() => {
    const cleanHash = (sectionHash ?? "").replace(/^#/, "").toLowerCase();
    if (cleanHash === "flights") setActiveTab("flights");
    else if (cleanHash === "trains") setActiveTab("trains");
    else if (cleanHash === "buses") setActiveTab("buses");
    else if (cleanHash === "hotels") setActiveTab("hotels");
    else if (cleanHash === "cabs") setActiveTab("cabs");
    else if (cleanHash === "trips") setActiveTab("trips");
  }, [sectionHash]);

  // Flight Search State
  const [flightFrom, setFlightFrom] = useState("New Delhi (DEL)");
  const [flightTo, setFlightTo] = useState("Mumbai (BOM)");
  const [flightDate, setFlightDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [flightPassengers, setFlightPassengers] = useState(1);
  const [flightClass, setFlightClass] = useState("Economy");
  const [specialFareType, setSpecialFareType] = useState<"Regular" | "Student" | "Armed Forces" | "Senior Citizen">("Regular");
  const [airlineCheckInCode, setAirlineCheckInCode] = useState("6E (IndiGo)");
  const [flightPnrInput, setFlightPnrInput] = useState("");

  // Train Search State
  const [trainFrom, setTrainFrom] = useState("New Delhi (NDLS)");
  const [trainTo, setTrainTo] = useState("Mumbai Central (MMCT)");
  const [trainDate, setTrainDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [trainQuota, setTrainQuota] = useState("GENERAL (GN)");
  const [trainClass, setTrainClass] = useState("3A");
  const [trainPassengers, setTrainPassengers] = useState(1);
  const [pnr, setPnr] = useState("");
  const [checkingPnr, setCheckingPnr] = useState(false);
  const [pnrLiveResult, setPnrLiveResult] = useState<any | null>(null);

  // Bus Search State
  const [busFrom, setBusFrom] = useState("Bengaluru (Kempegowda)");
  const [busTo, setBusTo] = useState("Goa (Panaji)");
  const [busDate, setBusDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [busClass, setBusClass] = useState("AC Sleeper (2+1)");
  const [busOperator, setBusOperator] = useState("All Operators");
  const [busPassengers, setBusPassengers] = useState(1);

  // Hotel Search State
  const [hotelCity, setHotelCity] = useState("Goa, India");
  const [hotelGuests, setHotelGuests] = useState("2 Guests · 1 Room");
  const [hotelCheckIn, setHotelCheckIn] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [hotelNights, setHotelNights] = useState(2);
  const [hotelRooms, setHotelRooms] = useState(1);

  // Cab Search State
  const [cabPickup, setCabPickup] = useState("Terminal 3, IGI Airport (DEL)");
  const [cabDrop, setCabDrop] = useState("Connaught Place, New Delhi");
  const [cabPackageHours, setCabPackageHours] = useState("Airport Point-to-Point");
  const [cabVehicleClass, setCabVehicleClass] = useState<"mini" | "sedan" | "suv">("sedan");
  const [cabDistanceKm, setCabDistanceKm] = useState(35);

  // Saved Trips State (persisted in localStorage)
  const [savedTrips, setSavedTrips] = useState<SavedTripReference[]>([]);
  const [tripType, setTripType] = useState<SavedTripReference["bookingType"]>("Flight");
  const [tripProvider, setTripProvider] = useState("");
  const [tripRefId, setTripRefId] = useState("");
  const [tripDate, setTripDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [tripRoute, setTripRoute] = useState("");
  const [tripNotes, setTripNotes] = useState("");
  const [tripFilter, setTripFilter] = useState<"ALL" | SavedTripReference["bookingType"]>("ALL");
  const [activeTicketModal, setActiveTicketModal] = useState<SovereignETicket | null>(null);

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
      // Ignore storage read errors
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

  const handleSwapFlightRoute = () => {
    const temp = flightFrom;
    setFlightFrom(flightTo);
    setFlightTo(temp);
  };

  const handleSwapTrainRoute = () => {
    const temp = trainFrom;
    setTrainFrom(trainTo);
    setTrainTo(temp);
  };

  const handleLaunchFlightSearch = () => {
    const link = generateTravelpayoutsFlightLink({
      origin: flightFrom,
      destination: flightTo,
      departureDate: flightDate,
      passengers: flightPassengers,
      cabinClass: flightClass,
      marker: TP_MARKER,
      subId: "kingpay_travel_desk",
    });
    toast.success(`Opening Travelpayouts / Aviasales live fare search for ${flightFrom} ➔ ${flightTo}...`);
    window.open(link.url, "_blank", "noopener,noreferrer");
  };

  const handleSaveTripReference = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripProvider.trim() || !tripRefId.trim()) {
      toast.error("Please enter both the provider name and PNR or Booking ID.");
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
    persistTrips([newEntry, ...savedTrips]);
    setTripProvider("");
    setTripRefId("");
    setTripRoute("");
    setTripNotes("");
    toast.success(`Saved ${newEntry.bookingType} reference (${newEntry.bookingRef}) to My Trips.`);
  };

  const handleDeleteTrip = (id: string) => {
    const updated = savedTrips.filter((t) => t.id !== id);
    persistTrips(updated);
    toast.info("Removed booking reference from My Trips.");
  };

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
        toast.success(`Checking live CRIS status for IRCTC PNR ${cleanDigits}`);
        return;
      }
    }

    if (trip.bookingType === "Flight") {
      setActiveTab("flights");
      setFlightPnrInput(trip.bookingRef);
      toast.success(`Loaded flight booking reference ${trip.bookingRef} to check status.`);
      return;
    }

    toast.info(`Viewing saved ${trip.bookingType} itinerary reference (${trip.bookingRef}).`);
  };

  const handleCheckPnr = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = (pnr || "").replace(/\D/g, "");
    if (clean.length !== 10) {
      toast.error("Please enter a valid 10-digit Indian Railways PNR.");
      return;
    }
    setCheckingPnr(true);
    setPnrLiveResult(null);
    try {
      const res = await fetch("/api/travel/pnr-status?pnr=" + encodeURIComponent(clean), { cache: "no-store" });
      const result = await res.json().catch(() => null);
      if (res.ok && result?.source === "verified_provider" && result.data) {
        setPnrLiveResult(result.data);
        toast.success("Verified CRIS PNR status retrieved.");
      } else {
        toast.error(result?.error || "Verified railway PNR status is temporarily unavailable.");
      }
    } catch {
      toast.error("Railway PNR verification service is temporarily unreachable.");
    } finally {
      setCheckingPnr(false);
    }
  };

  const originCode = extractAirportCode(flightFrom, "DEL");
  const destCode = extractAirportCode(flightTo, "BOM");

  return (
    <CustomerShell maxWidth="max-w-7xl">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4 sm:py-6 space-y-6">
        
        {/* Authoritative Single Travel Desk Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white border border-slate-800 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-sky-400 mb-1">
              <Sparkles className="size-3.5" /> Official Travel Desk
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Flights, Trains, Hotels, Buses &amp; Cabs
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Direct official airline portals, IRCTC rail search, redBus coaches and verified hotel tariffs with zero intermediary markup.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("trips")}
            className={`shrink-0 rounded-2xl px-4 py-2.5 text-xs font-black transition flex items-center gap-2 border self-start sm:self-auto ${
              activeTab === "trips"
                ? "bg-sky-500 text-slate-950 border-sky-400 shadow-md"
                : "bg-white/10 text-white border-white/20 hover:bg-white/20"
            }`}
          >
            <span>My Bookings</span>
            {savedTrips.length > 0 && (
              <span className="bg-sky-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {savedTrips.length}
              </span>
            )}
            <ChevronRight className="size-3.5" />
          </button>
        </div>

        {/* AUTHORITATIVE SINGLE TRAVEL DESK */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm space-y-6">
          
          {/* CATEGORY SWITCHER TABS */}
          <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-100 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab("flights")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all ${
                activeTab === "flights"
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Plane className="size-4 text-sky-400" />
              <span>Flights</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("trains")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all ${
                activeTab === "trains"
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Train className="size-4 text-indigo-400" />
              <span>Trains &amp; IRCTC</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("hotels")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all ${
                activeTab === "hotels"
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Building2 className="size-4 text-amber-400" />
              <span>Hotels &amp; Stays</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("buses")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all ${
                activeTab === "buses"
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Bus className="size-4 text-orange-400" />
              <span>Buses &amp; Sleepers</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("cabs")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all ${
                activeTab === "cabs"
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Car className="size-4 text-emerald-400" />
              <span>Cabs &amp; Airport</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("trips")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all ${
                activeTab === "trips"
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Compass className="size-4 text-purple-400" />
              <span>My Trips ({savedTrips.length})</span>
            </button>
          </div>

          {/* =====================================================================
              CATEGORY 1: FLIGHTS (ONE AUTHORITATIVE FORM)
             ===================================================================== */}
          {activeTab === "flights" && (
            <div className="space-y-6">
              
              {/* Special Fare Selector */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Concession Category:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(["Regular", "Student", "Armed Forces", "Senior Citizen"] as const).map((fare) => (
                      <button
                        key={fare}
                        type="button"
                        onClick={() => setSpecialFareType(fare)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${
                          specialFareType === fare
                            ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {fare}
                      </button>
                    ))}
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Direct Airline Tariffs · 0% Desk Markup
                </span>
              </div>

              {/* Working Search Inputs with Real IATA Autocomplete */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-sky-500 focus-within:bg-white transition relative">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center justify-between uppercase tracking-wider mb-1">
                    <span className="flex items-center gap-1"><MapPin className="size-3 text-sky-600" /> From City / Code</span>
                    <button
                      type="button"
                      onClick={handleSwapFlightRoute}
                      title="Swap Route"
                      className="size-5 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-sky-600 transition"
                    >
                      <ArrowLeftRight className="size-3" />
                    </button>
                  </label>
                  <AirportAutoSuggest
                    value={flightFrom}
                    onChange={setFlightFrom}
                    theme="light"
                    placeholder="Search 7,900+ airports or city..."
                    ariaLabel="Origin Airport"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-sky-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <MapPin className="size-3 text-sky-600" /> To Destination / Code
                  </label>
                  <AirportAutoSuggest
                    value={flightTo}
                    onChange={setFlightTo}
                    theme="light"
                    placeholder="Search 7,900+ airports or city..."
                    ariaLabel="Destination Airport"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-sky-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Calendar className="size-3 text-sky-600" /> Departure Date
                  </label>
                  <input
                    type="date"
                    value={flightDate}
                    onChange={(e) => setFlightDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-sky-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Users className="size-3 text-sky-600" /> Passengers
                  </label>
                  <select
                    value={flightPassengers}
                    onChange={(e) => setFlightPassengers(Number(e.target.value))}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} Passenger{n > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-sky-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Plane className="size-3 text-sky-600" /> Cabin Class
                  </label>
                  <select
                    value={flightClass}
                    onChange={(e) => setFlightClass(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer"
                  >
                    <option value="Economy">Economy</option>
                    <option value="Premium Economy">Premium Economy</option>
                    <option value="Business">Business Class</option>
                  </select>
                </div>
              </div>

              {/* High-Frequency Corridors Quick Shortcuts */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  High-Frequency Domestic Air Corridors
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: "Delhi (DEL) ⇄ Mumbai (BOM)", from: "New Delhi (DEL)", to: "Mumbai (BOM)" },
                    { label: "Bengaluru (BLR) ⇄ Delhi (DEL)", from: "Bengaluru (BLR)", to: "New Delhi (DEL)" },
                    { label: "Mumbai (BOM) ⇄ Goa (GOI)", from: "Mumbai (BOM)", to: "Goa (GOI)" },
                    { label: "Kolkata (CCU) ⇄ Bengaluru (BLR)", from: "Kolkata (CCU)", to: "Bengaluru (BLR)" },
                  ].map((corridor) => (
                    <button
                      key={corridor.label}
                      type="button"
                      onClick={() => {
                        setFlightFrom(corridor.from);
                        setFlightTo(corridor.to);
                        toast.success(`Loaded corridor: ${corridor.label}`);
                      }}
                      className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 p-2.5 text-left transition"
                    >
                      <span className="text-xs font-black text-slate-900 block truncate">{corridor.label}</span>
                      <span className="text-[10px] font-bold text-sky-600">Load Route ➔</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons: Primary Search + Save */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="button"
                  onClick={handleLaunchFlightSearch}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-black text-sm shadow-md shadow-sky-600/20 flex items-center justify-center gap-2"
                >
                  <Search className="size-4" />
                  <span>Search Flights on Travelpayouts / Aviasales ↗</span>
                  <ExternalLink className="size-3.5 opacity-80" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const newTrip: SavedTripReference = {
                      id: `trip-${Date.now()}`,
                      bookingType: "Flight",
                      providerName: `Flight (${flightClass})`,
                      bookingRef: flightPnrInput || "PLANNED-ROUTE",
                      travelDate: flightDate,
                      routeOrLocation: `${flightFrom} ➔ ${flightTo}`,
                      notes: `${flightPassengers} Pax · Class: ${flightClass} · Special Fare: ${specialFareType}`,
                      createdAt: new Date().toISOString(),
                    };
                    persistTrips([newTrip, ...savedTrips]);
                    toast.success("Saved planned flight route to My Trips & Bookings.");
                  }}
                  className="h-12 rounded-xl border-slate-200 text-slate-800 font-bold text-xs"
                >
                  Save Route to My Trips
                </Button>
              </div>

              {/* Direct Official Carrier Checkout Options */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Direct Official Domestic Carrier Portals
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Official Airline Checkouts
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {OFFICIAL_AIRLINES.map((carrier) => {
                    const deepLink = buildOfficialAirlineDeepLink({
                      carrierCode: carrier.code,
                      from: flightFrom,
                      to: flightTo,
                      departureDate: flightDate,
                      passengers: flightPassengers,
                      cabinClass: flightClass,
                    });
                    return (
                      <a
                        key={carrier.code}
                        href={deepLink.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          toast.success(`Opening official ${carrier.name} booking portal (${carrier.portal})...`);
                        }}
                        className="flex flex-col items-start p-3 rounded-2xl border border-slate-200 bg-slate-50/80 hover:bg-sky-50 hover:border-sky-300 transition text-left group"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-black text-slate-900 group-hover:text-sky-700">
                            {carrier.name}
                          </span>
                          <ArrowUpRight className="size-3 text-slate-400 group-hover:text-sky-600" />
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {carrier.portal}
                        </span>
                        <span className="text-[9px] font-bold text-emerald-700 mt-1 bg-emerald-50 px-1.5 py-0.5 rounded">
                          0% Markup Direct
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Web Check-In Bar */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-sky-600" /> Official Web Check-In &amp; Boarding Pass
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Opens 48h to 60m before departure
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Operating Airline
                    </label>
                    <select
                      value={airlineCheckInCode}
                      onChange={(e) => setAirlineCheckInCode(e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-slate-900 outline-none"
                    >
                      <option value="6E (IndiGo)">6E — IndiGo Airlines</option>
                      <option value="AI (Air India)">AI — Air India</option>
                      <option value="QP (Akasa Air)">QP — Akasa Air</option>
                      <option value="SG (SpiceJet)">SG — SpiceJet</option>
                    </select>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      6-Character Airline PNR
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      value={flightPnrInput}
                      onChange={(e) => setFlightPnrInput(e.target.value.toUpperCase())}
                      placeholder="e.g. AB12CD"
                      className="w-full bg-transparent text-xs font-mono font-bold text-slate-900 uppercase outline-none"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={() => {
                        const links: Record<string, string> = {
                          "6E (IndiGo)": "https://www.goindigo.in/web-check-in.html",
                          "AI (Air India)": "https://www.airindia.com/in/en/manage/web-check-in.html",
                          "QP (Akasa Air)": "https://www.akasaair.com/check-in",
                          "SG (SpiceJet)": "https://www.spicejet.com/webcheckin",
                        };
                        const target = links[airlineCheckInCode] || "https://www.goindigo.in/web-check-in.html";
                        toast.success(`Connecting to official ${airlineCheckInCode} web check-in portal...`);
                        window.open(target, "_blank", "noopener,noreferrer");
                      }}
                      className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs"
                    >
                      Launch Web Check-In ➔
                    </Button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* =====================================================================
              CATEGORY 2: TRAINS (ONE AUTHORITATIVE FORM + LIVE PNR)
             ===================================================================== */}
          {activeTab === "trains" && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600">
                    Indian Railways PRS Network
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                    Search Trains Between Stations &amp; Check Live PNR
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full self-start">
                  Official IRCTC Handoff
                </span>
              </div>

              {/* Working Station Search Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition relative">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center justify-between uppercase tracking-wider mb-1">
                    <span className="flex items-center gap-1"><MapPin className="size-3 text-indigo-600" /> Origin Station</span>
                    <button
                      type="button"
                      onClick={handleSwapTrainRoute}
                      title="Swap Stations"
                      className="size-5 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition"
                    >
                      <ArrowLeftRight className="size-3" />
                    </button>
                  </label>
                  <StationAutoSuggest
                    value={trainFrom}
                    onChange={setTrainFrom}
                    theme="light"
                    placeholder="Search 8,000+ stations or code..."
                    ariaLabel="Origin Station"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <MapPin className="size-3 text-indigo-600" /> Destination Station
                  </label>
                  <StationAutoSuggest
                    value={trainTo}
                    onChange={setTrainTo}
                    theme="light"
                    placeholder="Search 8,000+ stations or code..."
                    ariaLabel="Destination Station"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Calendar className="size-3 text-indigo-600" /> Journey Date
                  </label>
                  <input
                    type="date"
                    value={trainDate}
                    onChange={(e) => setTrainDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <ShieldCheck className="size-3 text-indigo-600" /> Quota
                  </label>
                  <select
                    value={trainQuota}
                    onChange={(e) => setTrainQuota(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer"
                  >
                    <option value="GENERAL (GN)">GENERAL (GN)</option>
                    <option value="TATKAL (TQ)">TATKAL (TQ)</option>
                    <option value="LADIES (LD)">LADIES (LD)</option>
                    <option value="SENIOR CITIZEN (SS)">SENIOR CITIZEN (SS)</option>
                  </select>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Train className="size-3 text-indigo-600" /> Class
                  </label>
                  <select
                    value={trainClass}
                    onChange={(e) => setTrainClass(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer"
                  >
                    <option value="3A">AC 3-Tier (3A)</option>
                    <option value="2A">AC 2-Tier (2A)</option>
                    <option value="1A">AC 1st Class (1A)</option>
                    <option value="CC">AC Chair Car (CC)</option>
                    <option value="EC">Executive Chair (EC)</option>
                    <option value="SL">Sleeper (SL)</option>
                  </select>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Users className="size-3 text-indigo-600" /> Passengers
                  </label>
                  <select
                    value={trainPassengers}
                    onChange={(e) => setTrainPassengers(Number(e.target.value))}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} Traveler{n > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* High-Frequency Train Corridors */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Popular Superfast &amp; Vande Bharat Express Routes
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: "NDLS ⇄ MMCT (Mumbai Rajdhani)", from: "New Delhi (NDLS)", to: "Mumbai Central (MMCT)" },
                    { label: "NDLS ⇄ HWH (Howrah Rajdhani)", from: "New Delhi (NDLS)", to: "Howrah (HWH)" },
                    { label: "SBC ⇄ MAS (Vande Bharat)", from: "Bengaluru (SBC)", to: "Chennai Central (MAS)" },
                    { label: "NDLS ⇄ BSB (Vande Bharat)", from: "New Delhi (NDLS)", to: "Varanasi (BSB)" },
                  ].map((corridor) => (
                    <button
                      key={corridor.label}
                      type="button"
                      onClick={() => {
                        setTrainFrom(corridor.from);
                        setTrainTo(corridor.to);
                        toast.success(`Loaded rail sector: ${corridor.label}`);
                      }}
                      className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 p-2.5 text-left transition"
                    >
                      <span className="text-xs font-black text-slate-900 block truncate">{corridor.label}</span>
                      <span className="text-[10px] font-bold text-indigo-600">Select Sector ➔</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons: IRCTC Handoff + Save */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => {
                    const cleanFrom = (trainFrom.includes("(") ? trainFrom.split("(")[1]?.replace(")", "") : trainFrom).trim().toUpperCase();
                    const cleanTo = (trainTo.includes("(") ? trainTo.split("(")[1]?.replace(")", "") : trainTo).trim().toUpperCase();
                    const irctcUrl = `https://www.irctc.co.in/nget/train-search?from=${encodeURIComponent(cleanFrom)}&to=${encodeURIComponent(cleanTo)}&date=${trainDate}`;
                    toast.success(`Connecting to official IRCTC portal for ${cleanFrom} ➔ ${cleanTo}...`);
                    window.open(irctcUrl, "_blank", "noopener,noreferrer");
                  }}
                  className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
                >
                  <Train className="size-4" />
                  <span>Book Train on Official IRCTC ↗</span>
                  <ExternalLink className="size-3.5 opacity-80" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const newTrip: SavedTripReference = {
                      id: `trip-${Date.now()}`,
                      bookingType: "Train",
                      providerName: `Indian Railways (${trainClass})`,
                      bookingRef: "PLANNED-ROUTE",
                      travelDate: trainDate,
                      routeOrLocation: `${trainFrom} ➔ ${trainTo}`,
                      notes: `${trainPassengers} Pax · Class: ${trainClass} · Quota: ${trainQuota}`,
                      createdAt: new Date().toISOString(),
                    };
                    persistTrips([newTrip, ...savedTrips]);
                    toast.success("Saved planned train journey to My Trips & Bookings.");
                  }}
                  className="h-12 rounded-xl border-slate-200 text-slate-800 font-bold text-xs"
                >
                  Save Train Route to My Trips
                </Button>
              </div>

              {/* Live 10-Digit IRCTC PNR Enquiry Bar */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Live 10-Digit IRCTC PNR Enquiry
                    </h3>
                    <p className="text-xs text-slate-500">
                      Direct CRIS railway reservation lookup for berth confirmation, coach position &amp; chart preparation status.
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
                      placeholder="Enter 10-digit PNR Number (e.g. 2458910342)"
                      className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-mono font-bold tracking-wider text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none transition"
                    />
                    {pnr.length > 0 && (
                      <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">
                        {pnr.length}/10
                      </span>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={checkingPnr}
                    className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
                  >
                    {checkingPnr ? "Checking CRIS..." : "Check Live PNR Status"}
                  </Button>
                </form>

                {/* Live CRIS PNR Status Result */}
                {pnrLiveResult && (
                  <div className="rounded-2xl border border-indigo-200 bg-white p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-2.5">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700">
                          CRIS Live Record · PNR {pnrLiveResult.pnr}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 mt-0.5">
                          {pnrLiveResult.trainNumber} — {pnrLiveResult.trainName}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {pnrLiveResult.originStationCode} ➔ {pnrLiveResult.destinationStationCode}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase border self-start ${
                        pnrLiveResult.chartStatus === "CHART PREPARED"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-amber-100 text-amber-800 border-amber-300"
                      }`}>
                        {pnrLiveResult.chartStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(pnrLiveResult.passengers || []).map((p: any) => (
                        <div key={p.passengerIndex} className="bg-slate-50 rounded-xl border border-slate-200 p-2.5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-black text-slate-900 block">Passenger #{p.passengerIndex}</span>
                            <span className="text-[11px] text-slate-500">
                              Coach: <strong className="text-indigo-900">{p.coach}</strong> · Berth: <strong className="text-indigo-900">{p.berthNumber}</strong>
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-md font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {p.currentStatus}
                          </span>
                        </div>
                      ))}
                    </div>

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
                          notes: `Coach: ${pnrLiveResult.passengers?.[0]?.coach || "B2"} · Status: ${pnrLiveResult.chartStatus}`,
                          createdAt: new Date().toISOString(),
                        };
                        persistTrips([newTrip, ...savedTrips]);
                        toast.success(`Saved verified PNR ${pnrLiveResult.pnr} to My Trips.`);
                      }}
                      className="w-full sm:w-auto h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    >
                      Save Verified PNR to My Trips ➔
                    </Button>
                  </div>
                )}
              </div>

              {/* Tatkal Guide */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-2 text-xs">
                <span className="font-black text-slate-900 flex items-center gap-1.5">
                  <Clock className="size-3.5 text-indigo-600" /> Tatkal Booking Timings &amp; Guidelines
                </span>
                <p className="text-slate-600">
                  • <strong>AC Classes (1A, 2A, 3A, CC, EC, 3E):</strong> Booking window opens at <strong>10:00 AM IST</strong> one day prior to train origin departure date.
                </p>
                <p className="text-slate-600">
                  • <strong>Non-AC Sleeper (SL, 2S):</strong> Booking window opens at <strong>11:00 AM IST</strong> one day prior to departure.
                </p>
              </div>

            </div>
          )}

          {/* =====================================================================
              CATEGORY 3: HOTELS & STAYS (ONE AUTHORITATIVE FORM)
             ===================================================================== */}
          {activeTab === "hotels" && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-600">
                    Hotels &amp; Stays Across India
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                    Search Hotels with Verified Tariffs &amp; Direct Provider Handoff
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full self-start">
                  GST Invoicing Supported
                </span>
              </div>

              {/* Working Hotel Search Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-amber-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <MapPin className="size-3 text-amber-600" /> Destination City / Area
                  </label>
                  <input
                    type="text"
                    value={hotelCity}
                    onChange={(e) => setHotelCity(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                    placeholder="e.g. Goa, Jaipur, Manali, Mumbai"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-amber-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Calendar className="size-3 text-amber-600" /> Check-In Date
                  </label>
                  <input
                    type="date"
                    value={hotelCheckIn}
                    onChange={(e) => setHotelCheckIn(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-amber-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Clock className="size-3 text-amber-600" /> Nights
                  </label>
                  <select
                    value={hotelNights}
                    onChange={(e) => setHotelNights(Number(e.target.value))}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 7, 10, 14].map((n) => (
                      <option key={n} value={n}>
                        {n} Night{n > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-amber-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Building2 className="size-3 text-amber-600" /> Rooms
                  </label>
                  <select
                    value={hotelRooms}
                    onChange={(e) => setHotelRooms(Number(e.target.value))}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer"
                  >
                    {[1, 2, 3, 4].map((r) => (
                      <option key={r} value={r}>
                        {r} Room{r > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-amber-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Users className="size-3 text-amber-600" /> Guests
                  </label>
                  <input
                    type="text"
                    value={hotelGuests}
                    onChange={(e) => setHotelGuests(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                    placeholder="e.g. 2 Guests"
                  />
                </div>
              </div>

              {/* Trending Destinations Shortcuts */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Popular Indian Destinations
                </span>
                <div className="flex flex-wrap gap-2">
                  {["Goa", "Jaipur", "Manali", "Udaipur", "Ooty", "Varanasi", "Bengaluru", "Mumbai"].map((dest) => (
                    <button
                      key={dest}
                      type="button"
                      onClick={() => {
                        setHotelCity(`${dest}, India`);
                        toast.success(`Selected destination: ${dest}`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 text-xs font-bold text-slate-700 transition"
                    >
                      📍 {dest}
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct Booking Actions (Agoda, Booking.com, Hotellook) */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => {
                    const checkIn = hotelCheckIn;
                    const dNext = new Date(checkIn);
                    dNext.setDate(dNext.getDate() + hotelNights);
                    const checkOut = dNext.toISOString().split("T")[0];
                    const hotelLink = generateTravelpayoutsHotelLink({
                      cityOrLocation: hotelCity,
                      checkInDate: checkIn,
                      checkOutDate: checkOut,
                      nights: hotelNights,
                      rooms: hotelRooms,
                      partner: "agoda",
                      subId: "kingpay_hotels",
                    });
                    toast.success(`Opening Agoda for ${hotelLink.cleanCity} (${hotelNights} nights)...`);
                    window.open(hotelLink.url, "_blank", "noopener,noreferrer");
                  }}
                  className="flex-1 min-w-[180px] h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5"
                >
                  <span>Book on Agoda (Tracked)</span>
                  <ArrowUpRight className="size-4" />
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    const checkIn = hotelCheckIn;
                    const dNext = new Date(checkIn);
                    dNext.setDate(dNext.getDate() + hotelNights);
                    const checkOut = dNext.toISOString().split("T")[0];
                    const hotelLink = generateTravelpayoutsHotelLink({
                      cityOrLocation: hotelCity,
                      checkInDate: checkIn,
                      checkOutDate: checkOut,
                      nights: hotelNights,
                      rooms: hotelRooms,
                      partner: "booking_com",
                      subId: "kingpay_hotels",
                    });
                    toast.success(`Opening Booking.com for ${hotelLink.cleanCity} (${hotelNights} nights)...`);
                    window.open(hotelLink.url, "_blank", "noopener,noreferrer");
                  }}
                  className="flex-1 min-w-[180px] h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5"
                >
                  <span>Book on Booking.com (Tracked)</span>
                  <ArrowUpRight className="size-4" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const checkIn = hotelCheckIn;
                    const dNext = new Date(checkIn);
                    dNext.setDate(dNext.getDate() + hotelNights);
                    const checkOut = dNext.toISOString().split("T")[0];
                    const hotelLink = generateTravelpayoutsHotelLink({
                      cityOrLocation: hotelCity,
                      checkInDate: checkIn,
                      checkOutDate: checkOut,
                      nights: hotelNights,
                      rooms: hotelRooms,
                      partner: "hotellook",
                      subId: "kingpay_hotels",
                    });
                    toast.success("Comparing hotel tariffs across 70+ OTAs on Hotellook...");
                    window.open(hotelLink.url, "_blank", "noopener,noreferrer");
                  }}
                  className="h-12 rounded-xl border-amber-300 text-amber-950 font-bold text-xs hover:bg-amber-50"
                >
                  Hotellook Meta-Search ↗
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const newTrip: SavedTripReference = {
                      id: `trip-${Date.now()}`,
                      bookingType: "Hotel",
                      providerName: `Hotel Stay (${hotelCity})`,
                      bookingRef: "PLANNED-RESERVATION",
                      travelDate: hotelCheckIn,
                      routeOrLocation: hotelCity,
                      notes: `${hotelNights} Nights · ${hotelRooms} Rooms · Guests: ${hotelGuests}`,
                      createdAt: new Date().toISOString(),
                    };
                    persistTrips([newTrip, ...savedTrips]);
                    toast.success(`Saved planned stay in ${hotelCity} to My Trips.`);
                  }}
                  className="h-12 rounded-xl border-slate-200 text-slate-800 font-bold text-xs"
                >
                  Save Stay to My Trips
                </Button>
              </div>

            </div>
          )}

          {/* =====================================================================
              CATEGORY 4: BUSES & SLEEPERS (ONE AUTHORITATIVE FORM)
             ===================================================================== */}
          {activeTab === "buses" && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-orange-600">
                    Intercity Buses &amp; Sleeper Coaches
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                    AC Sleepers, Volvo, BharatBenz &amp; State RTC Services
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-orange-800 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full self-start">
                  redBus &amp; State RTC Handoff
                </span>
              </div>

              {/* Working Bus Search Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-orange-500 focus-within:bg-white transition">
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

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-orange-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <MapPin className="size-3 text-orange-600" /> Destination City / Drop Point
                  </label>
                  <input
                    type="text"
                    value={busTo}
                    onChange={(e) => setBusTo(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                    placeholder="e.g. Goa (Panaji)"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-orange-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Calendar className="size-3 text-orange-600" /> Travel Date
                  </label>
                  <input
                    type="date"
                    value={busDate}
                    onChange={(e) => setBusDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-orange-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Bus className="size-3 text-orange-600" /> Bus Class &amp; Berth
                  </label>
                  <select
                    value={busClass}
                    onChange={(e) => setBusClass(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer"
                  >
                    <option value="AC Sleeper (2+1)">AC Sleeper (2+1)</option>
                    <option value="Multi-Axle Volvo AC">Multi-Axle Volvo AC</option>
                    <option value="BharatBenz Premium Sleeper">BharatBenz Premium Sleeper</option>
                    <option value="Non-AC Seater / Sleeper">Non-AC Seater / Sleeper</option>
                  </select>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-orange-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Users className="size-3 text-orange-600" /> Passengers
                  </label>
                  <select
                    value={busPassengers}
                    onChange={(e) => setBusPassengers(Number(e.target.value))}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} Traveler{n > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Operator Shortcuts */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Operator:
                </span>
                {[
                  "All Operators",
                  "KSRTC Airavat",
                  "MSRTC Shivshahi",
                  "UPSRTC Janrath",
                  "IntrCity SmartBus",
                  "Zingbus",
                ].map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setBusOperator(op)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
                      busOperator === op
                        ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {op}
                  </button>
                ))}
              </div>

              {/* Action Buttons: redBus Handoff + Save */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => {
                    const cleanSource = busFrom.replace(/\(.*\)/, "").trim().toLowerCase();
                    const cleanDest = busTo.replace(/\(.*\)/, "").trim().toLowerCase();
                    const redBusUrl = `https://www.redbus.in/bus-tickets/${encodeURIComponent(cleanSource)}-to-${encodeURIComponent(cleanDest)}?onward=${busDate}`;
                    toast.success(`Opening redBus tickets for ${busFrom} ➔ ${busTo}...`);
                    window.open(redBusUrl, "_blank", "noopener,noreferrer");
                  }}
                  className="flex-1 h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm shadow-md shadow-orange-600/20 flex items-center justify-center gap-2"
                >
                  <Bus className="size-4" />
                  <span>Search on redBus ↗</span>
                  <ExternalLink className="size-3.5 opacity-80" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const newTrip: SavedTripReference = {
                      id: `trip-${Date.now()}`,
                      bookingType: "Bus",
                      providerName: `${busOperator !== "All Operators" ? busOperator : "Intercity Bus"} (${busClass})`,
                      bookingRef: "PLANNED-BUS-JOURNEY",
                      travelDate: busDate,
                      routeOrLocation: `${busFrom} ➔ ${busTo}`,
                      notes: `${busPassengers} Passengers · Class: ${busClass}`,
                      createdAt: new Date().toISOString(),
                    };
                    persistTrips([newTrip, ...savedTrips]);
                    toast.success("Saved planned bus journey to My Trips & Bookings.");
                  }}
                  className="h-12 rounded-xl border-slate-200 text-slate-800 font-bold text-xs"
                >
                  Save Bus Route to My Trips
                </Button>
              </div>

            </div>
          )}

          {/* =====================================================================
              CATEGORY 5: CABS & AIRPORT (ONE AUTHORITATIVE FORM)
             ===================================================================== */}
          {activeTab === "cabs" && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600">
                    Chauffeur &amp; Airport Mobility
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                    Airport Pickup, Outstation Round-Trip &amp; City Rentals
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full self-start">
                  Verified Chauffeur Services
                </span>
              </div>

              {/* Working Cab Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-emerald-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Pickup Terminal / Address
                  </label>
                  <input
                    type="text"
                    value={cabPickup}
                    onChange={(e) => setCabPickup(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                    placeholder="e.g. Terminal 3, IGI Airport (DEL)"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-emerald-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Drop Destination / City
                  </label>
                  <input
                    type="text"
                    value={cabDrop}
                    onChange={(e) => setCabDrop(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                    placeholder="e.g. Connaught Place, New Delhi"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-emerald-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Trip Mode / Slab
                  </label>
                  <select
                    value={cabPackageHours}
                    onChange={(e) => setCabPackageHours(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer"
                  >
                    <option value="Airport Point-to-Point">Airport Point-to-Point</option>
                    <option value="Outstation Round-Trip">Outstation Round-Trip (250 km/day)</option>
                    <option value="4 Hrs · 40 km">Hourly Rental: 4 Hrs · 40 km</option>
                    <option value="8 Hrs · 80 km">Hourly Rental: 8 Hrs · 80 km</option>
                    <option value="12 Hrs · 120 km">Hourly Rental: 12 Hrs · 120 km</option>
                  </select>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-emerald-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Vehicle Class
                  </label>
                  <select
                    value={cabVehicleClass}
                    onChange={(e) => setCabVehicleClass(e.target.value as "mini" | "sedan" | "suv")}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer"
                  >
                    <option value="mini">Mini / Hatchback (~₹11/km)</option>
                    <option value="sedan">Prime Sedan (~₹14/km)</option>
                    <option value="suv">Luxury SUV (~₹19/km)</option>
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
                    Billed at actual odometer reading
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

              {/* Action Buttons: Uber/Chauffeur Handoff + Save */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => {
                    const uberUrl = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(cabDrop)}`;
                    toast.success(`Opening provider checkout for ${cabPickup} ➔ ${cabDrop}...`);
                    window.open(uberUrl, "_blank", "noopener,noreferrer");
                  }}
                  className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  <Car className="size-4" />
                  <span>Check Fare &amp; Book with Provider ↗</span>
                  <ExternalLink className="size-3.5 opacity-80" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const newTrip: SavedTripReference = {
                      id: `trip-${Date.now()}`,
                      bookingType: "Cab",
                      providerName: `Chauffeur (${cabVehicleClass.toUpperCase()})`,
                      bookingRef: "PLANNED-CAB",
                      travelDate: new Date().toISOString().split("T")[0],
                      routeOrLocation: `${cabPickup} ➔ ${cabDrop}`,
                      notes: `${cabDistanceKm} km · Mode: ${cabPackageHours}`,
                      createdAt: new Date().toISOString(),
                    };
                    persistTrips([newTrip, ...savedTrips]);
                    toast.success("Saved cab journey to My Trips & Bookings.");
                  }}
                  className="h-12 rounded-xl border-slate-200 text-slate-800 font-bold text-xs"
                >
                  Save Cab to My Trips
                </Button>
              </div>

            </div>
          )}

          {/* =====================================================================
              CATEGORY 6: MY TRIPS & BOOKINGS ORGANIZER
             ===================================================================== */}
          {activeTab === "trips" && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-purple-600">
                    Saved Travel Records
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                    My Trips, PNRs &amp; Booking References
                  </h2>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(["ALL", "Flight", "Train", "Bus", "Hotel", "Cab"] as const).map((filterType) => (
                    <button
                      key={filterType}
                      type="button"
                      onClick={() => setTripFilter(filterType)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${
                        tripFilter === filterType
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {filterType === "ALL" ? "All Bookings" : `${filterType}s`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add New Booking Reference Form */}
              <form onSubmit={handleSaveTripReference} className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                <span className="text-xs font-black text-slate-900 block">
                  Add New Booking Reference for 1-Click Live Tracking
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Type
                    </label>
                    <select
                      value={tripType}
                      onChange={(e) => setTripType(e.target.value as any)}
                      className="w-full bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer"
                    >
                      <option value="Flight">Flight</option>
                      <option value="Train">Train</option>
                      <option value="Bus">Bus</option>
                      <option value="Hotel">Hotel</option>
                      <option value="Cab">Cab</option>
                    </select>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Carrier / Provider Name *
                    </label>
                    <input
                      type="text"
                      value={tripProvider}
                      onChange={(e) => setTripProvider(e.target.value)}
                      placeholder="e.g. IndiGo / IRCTC / Taj Goa"
                      className="w-full bg-transparent text-xs font-bold text-slate-900 outline-none"
                    />
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      PNR or Booking ID *
                    </label>
                    <input
                      type="text"
                      value={tripRefId}
                      onChange={(e) => setTripRefId(e.target.value.toUpperCase())}
                      placeholder="e.g. AB12CD or 2458910342"
                      className="w-full bg-transparent text-xs font-mono font-bold text-slate-900 uppercase outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Travel Date
                    </label>
                    <input
                      type="date"
                      value={tripDate}
                      onChange={(e) => setTripDate(e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-slate-900 outline-none"
                    />
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Sector / City
                    </label>
                    <input
                      type="text"
                      value={tripRoute}
                      onChange={(e) => setTripRoute(e.target.value)}
                      placeholder="e.g. DEL ➔ BOM"
                      className="w-full bg-transparent text-xs font-bold text-slate-900 outline-none"
                    />
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Notes (Seat / Berth / Room)
                    </label>
                    <input
                      type="text"
                      value={tripNotes}
                      onChange={(e) => setTripNotes(e.target.value)}
                      placeholder="e.g. Seat 14A / Coach B2"
                      className="w-full bg-transparent text-xs font-bold text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                >
                  Save Reference to My Trips ➔
                </Button>
              </form>

              {/* Saved Trips List */}
              {savedTrips.filter((t) => tripFilter === "ALL" || t.bookingType === tripFilter).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center space-y-2">
                  <Compass className="size-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-800">
                    No saved booking references yet
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Save your flight PNR, 10-digit IRCTC train PNR, or hotel booking reference to track live status in one tap.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {savedTrips
                    .filter((t) => tripFilter === "ALL" || t.bookingType === tripFilter)
                    .map((trip) => (
                      <div
                        key={trip.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-300 transition"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase">
                              {trip.bookingType}
                            </span>
                            <span className="font-mono text-xs font-black text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                              {trip.bookingRef}
                            </span>
                            <span className="text-xs font-bold text-slate-500">
                              📅 {trip.travelDate}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-slate-900">
                            {trip.providerName} — <span className="text-indigo-700">{trip.routeOrLocation}</span>
                          </h4>
                          {trip.notes && (
                            <p className="text-xs text-slate-600">
                              Notes: {trip.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            type="button"
                            onClick={() => handleOpenTripLiveStatus(trip)}
                            className="h-9 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                          >
                            Live Status ➔
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
          )}

        </div>

        {/* HIGH-FREQUENCY CORRIDORS & GENUINE CHECKOUT ASSURANCE */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-sky-600 flex items-center gap-1.5">
                <Compass className="size-3.5" /> High-Density Indian Corridors
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                Popular Intercity Routes &amp; Direct Provider Handoff
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto">
              Real Provider Portals
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {POPULAR_ROUTES.map((route) => (
              <div
                key={route.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-sky-50/60 hover:border-sky-300 p-4 transition flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                      {route.type === "flight" && <Plane className="size-3" />}
                      {route.type === "train" && <Train className="size-3" />}
                      {route.type === "bus" && <Bus className="size-3" />}
                      {route.tag}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 group-hover:text-sky-700 transition-colors">
                    {route.fromCity} ({route.fromCode}) ➔ {route.toCity} ({route.toCode})
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Direct verified checkout
                  </p>
                </div>

                <div className="border-t border-slate-200/80 pt-2.5 flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      const handoff = getRoutePartnerHandoff(route, {
                        departureDate: flightDate,
                        passengers: flightPassengers,
                        cabinClass: flightClass,
                      });
                      toast.success(`Connecting to official ${handoff.portalName} for ${route.fromCity} ➔ ${route.toCity}...`);
                      window.open(handoff.url, "_blank", "noopener,noreferrer");
                    }}
                    className="flex-1 h-8 px-2 rounded-xl bg-slate-900 hover:bg-sky-600 text-white font-bold text-xs transition flex items-center justify-center gap-1 shadow-xs"
                  >
                    <span>Book Direct</span>
                    <ArrowUpRight className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (route.type === "flight") {
                        setActiveTab("flights");
                        setFlightFrom(`${route.fromCity} (${route.fromCode})`);
                        setFlightTo(`${route.toCity} (${route.toCode})`);
                        toast.success(`Loaded ${route.fromCity} ➔ ${route.toCity} sector.`);
                      } else if (route.type === "train") {
                        setActiveTab("trains");
                        setTrainFrom(`${route.fromCity} (${route.fromCode})`);
                        setTrainTo(`${route.toCity} (${route.toCode})`);
                        toast.success(`Loaded ${route.fromCity} ➔ ${route.toCity} rail.`);
                      } else {
                        setActiveTab("buses");
                        setBusFrom(route.fromCity);
                        setBusTo(route.toCity);
                        toast.success(`Loaded ${route.fromCity} ➔ ${route.toCity} bus.`);
                      }
                    }}
                    className="h-8 px-2.5 rounded-xl border-slate-200 text-slate-700 hover:text-sky-700 hover:border-sky-300 font-bold text-xs"
                  >
                    Select
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Digital E-Ticket Modal */}
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
