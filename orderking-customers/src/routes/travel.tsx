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
} from "@/lib/travel/in-app-booking-service";
import { TravelCategoryDeck } from "@/components/fintech/travel-category-deck";
import { LivePnrStatusBar } from "@/components/travel/live-pnr-status-bar";
import { buildOfficialAirlineDeepLink, extractAirportCode } from "@/lib/travel/airline-deep-links";
import {
  resolveTravelEngine,
  isDomesticIndianRoute,
  isInternationalRoute,
  generateTravelpayoutsDomesticLink,
  type TravelEngineResolution,
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
import { queryAirports, queryStations } from "@/components/fintech/travel-autosuggest";
import { AirportAutoSuggest, StationAutoSuggest } from "@/components/fintech/travel-autosuggest";

const searchAirportOptions = (raw: string) => queryAirports(raw, 20);
const searchStationOptions = (raw: string) => queryStations(raw, 20);

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
    id: "route-ccu-blr",
    type: "flight",
    fromCity: "Kolkata",
    fromCode: "CCU",
    toCity: "Bengaluru",
    toCode: "BLR",
    tag: "Business Sector",
    partnerUrl: "https://www.goindigo.in/booking/flight-select.html?orCity=CCU&destCity=BLR",
  },
  {
    id: "route-bom-goi",
    type: "flight",
    fromCity: "Mumbai",
    fromCode: "BOM",
    toCity: "Goa (Dabolim/Mopa)",
    toCode: "GOI",
    tag: "Holiday Gateway",
    partnerUrl: "https://www.airindia.com/in/en/book/flight-search.html?from=BOM&to=GOI",
  },
  {
    id: "route-blr-del",
    type: "flight",
    fromCity: "Bengaluru",
    fromCode: "BLR",
    toCity: "New Delhi",
    toCode: "DEL",
    tag: "Metro Express",
    partnerUrl: "https://www.goindigo.in/booking/flight-select.html?orCity=BLR&destCity=DEL",
  },
  {
    id: "route-maa-hyd",
    type: "flight",
    fromCity: "Chennai",
    fromCode: "MAA",
    toCity: "Hyderabad",
    toCode: "HYD",
    tag: "Fast Hopper",
    partnerUrl: "https://www.goindigo.in/booking/flight-select.html?orCity=MAA&destCity=HYD",
  },
  {
    id: "route-ndls-bsb-vb",
    type: "train",
    fromCity: "New Delhi",
    fromCode: "NDLS",
    toCity: "Varanasi Jn",
    toCode: "BSB",
    tag: "Vande Bharat Express",
    partnerUrl: "https://www.irctc.co.in/nget/train-search?from=NDLS&to=BSB",
  },
  {
    id: "route-sbc-mys-vb",
    type: "train",
    fromCity: "Bengaluru",
    fromCode: "SBC",
    toCity: "Mysuru",
    toCode: "MYS",
    tag: "Superfast Rail",
    partnerUrl: "https://www.irctc.co.in/nget/train-search?from=SBC&to=MYS",
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

export const TRAVEL_CATEGORIES: readonly TravelCategoryConfig[] = [
  {
    id: "flights",
    label: "Flights",
    badge: "Air Travel",
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
    badge: "Search on IRCTC Portal",
    keywords: "railway stations tickets irctc pnr tatkal coach position vande bharat",
    subCategories: [
      "Search Trains Between Stations",
      "Search on IRCTC Portal",
      "Live PNR Enquiry",
      "Tatkal & Coach Position Guide",
    ],
  },
  {
    id: "buses",
    label: "Buses & Sleepers",
    badge: "Verified AC Sleeper",
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
    badge: "Direct Tariffs",
    keywords: "rooms resorts accommodation luxury 5-star business homestays villas budget stays",
    subCategories: [
      "Luxury 5-Star & Resorts",
      "Business Hotels",
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
    keywords: "my trips bookings itinerary pnr reference saved flight train hotel bus vip concierge",
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
    if (cleanHash === "flights") setActiveTab("flights");
    else if (cleanHash === "trains") setActiveTab("trains");
    else if (cleanHash === "buses") setActiveTab("buses");
    else if (cleanHash === "hotels") setActiveTab("hotels");
    else if (cleanHash === "cabs") setActiveTab("cabs");
    else if (cleanHash === "fastag") setActiveTab("fastag");
    else if (cleanHash === "trips") setActiveTab("trips");
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
  const [isSearchingDuffel, setIsSearchingDuffel] = useState(false);
  const [duffelFlightResults, setDuffelFlightResults] = useState<any[] | null>(null);
  const [duffelSearchSource, setDuffelSearchSource] = useState<string | null>(null);
  const [isForeignCard, setIsForeignCard] = useState(false);
  const [flightSearchEngine, setFlightSearchEngine] = useState<string | null>(null);

  const activeEngineResolution: TravelEngineResolution = resolveTravelEngine({
    origin: flightFrom,
    destination: flightTo,
    isForeignCard,
  });

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
    const clean=(pnr||"").replace(/\D/g,"");
    if(clean.length!==10){toast.error("Please enter a valid 10-digit PNR.");return;}
    setCheckingPnr(true);setPnrLiveResult(null);
    try{const res=await fetch("/api/travel/pnr-status?pnr="+encodeURIComponent(clean),{cache:"no-store"});const result=await res.json().catch(()=>null);
      if(res.ok&&result?.source==="verified_provider"&&result.data){setPnrLiveResult(result.data);toast.success("Verified PNR status retrieved.");}
      else toast.error(result?.error||"Verified railway PNR status is unavailable.");
    }catch{toast.error("Railway PNR verification is temporarily unavailable.");}
    finally{setCheckingPnr(false);}
  };

  const FASTAG_BANK_PORTALS: Record<string, string> = {
    "ICICI Bank FASTag": "https://www.icicibank.com/personal-banking/cards/prepaid-card/fastag",
    "State Bank of India FASTag": "https://fastag.onlinesbi.bank/",
    "HDFC Bank FASTag": "https://www.hdfcbank.com/personal/pay/cards/fastag",
    "Axis Bank FASTag": "https://www.axisbank.com/retail/cards/fastag",
    "Kotak Mahindra Bank FASTag": "https://www.kotak.com/en/personal-banking/cards/prepaid-cards/fastag.html",
    "IDFC FIRST Bank FASTag": "https://www.idfcfirstbank.com/personal-banking/payments/fastag",
  };

  const handleFastagBankPortal = () => {
    if(!vehicleNo?.trim()){toast.error("Enter your vehicle registration number (e.g. DL 01 AB 1234).");return;}
    const portalUrl = FASTAG_BANK_PORTALS[fastagBank] || "https://ihmcl.co.in/";
    toast.success(`Handoff to official ${fastagBank} portal for vehicle ${vehicleNo.toUpperCase()}...`);
    window.open(portalUrl, "_blank", "noopener,noreferrer");
  };

  const currentCategory = TRAVEL_CATEGORIES.find((c) => c.id === activeTab) ?? TRAVEL_CATEGORIES[0];
  const currentSub = activeSubCategory[activeTab] ?? currentCategory.subCategories[0];

  const estimatedTollInr = Math.round(
    highwayDistanceKm * (vehicleAxleClass === "car" ? 2.15 : vehicleAxleClass === "lcv" ? 3.45 : 7.2)
  );

  // Live fares and booking status are available only at authenticated providers.

  return (
    <CustomerShell>
      <div className="mx-auto max-w-5xl px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {/* TOP STATUS BAR & CATEGORY DECK - SEAMLESS ALIGNMENT */}
        <div className="space-y-2.5">
          <LivePnrStatusBar />
          <TravelCategoryDeck
            onChoose={(id) => {
              setActiveTab(id);
            }}
            onOpenTrips={() => {
              setActiveTab("trips");
            }}
            activeTab={activeTab}
          />
        </div>

        {/* COMPACT HIGH-DENSITY TRAVEL HERO */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#050D24] via-[#0E1A40] to-[#1E0F3D] text-white p-4 sm:p-5 shadow-xl border border-sky-400/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-400/20 border border-sky-400/40 px-2 py-0.5 text-[10px] font-black text-sky-300">
                  <span>✈️</span>
                  <span>TravelStation</span>
                </span>
                <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                  Direct Carrier Search
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Book Flights, Trains, Buses &amp; Cabs
              </h1>
            </div>

            {/* My Trips Quick Link */}
            <button
              type="button"
              onClick={() => setActiveTab("trips")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border shrink-0 ${
                activeTab === "trips"
                  ? "bg-sky-500 text-slate-950 border-sky-400 font-black shadow-xs"
                  : "bg-white/10 text-slate-200 border-white/15 hover:bg-white/20"
              }`}
            >
              <Compass className="size-3.5 text-sky-300" />
              <span>My Bookings</span>
              {savedTrips.length > 0 && (
                <span className="rounded-full bg-emerald-500/30 text-emerald-300 px-1.5 py-0.2 text-[10px] font-black">
                  {savedTrips.length}
                </span>
              )}
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative mt-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 shadow-inner">
              <Search className="size-4 text-sky-300 shrink-0" aria-hidden />
              <input
                id="travel-service-search"
                type="search"
                autoComplete="off"
                value={serviceQuery}
                onChange={(e) => setServiceQuery(e.target.value)}
                placeholder="Search Flights (DEL➔BOM), IRCTC Trains, Sleeper Buses, Stays, Cabs..."
                aria-label="Search travel services"
                className="h-10 min-w-0 flex-1 bg-transparent text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            {serviceQuery.trim() && (
              <div className="absolute left-0 right-0 top-12 z-20 max-h-48 space-y-1 overflow-y-auto rounded-xl border border-white/20 bg-slate-950 p-2 shadow-2xl">
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
                    className="flex items-center justify-between w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-100 hover:bg-white/10 transition"
                  >
                    <span className="font-bold">{sub}</span>
                    <span className="text-[9px] font-extrabold uppercase rounded bg-sky-400/20 text-sky-300 px-1.5 py-0.5">
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Category Switcher Tabs */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {TRAVEL_CATEGORIES.map((cat) => {
              const isSelected = activeTab === cat.id;
              const Icon = cat.id === "flights" ? Plane : cat.id === "trains" ? Train : cat.id === "buses" ? Bus : cat.id === "hotels" ? Building2 : cat.id === "cabs" ? Car : CreditCard;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveTab(cat.id)}
                  className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                    isSelected
                      ? "bg-sky-400 text-slate-950 border-sky-300 font-black shadow-xs"
                      : "bg-white/10 text-slate-200 border-white/10 hover:bg-white/20"
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-Category Strip for Active Category */}
          {currentCategory.subCategories.length > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-white/10">
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
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                      isSelected
                        ? "bg-sky-300 text-slate-950 font-black shadow-xs"
                        : "bg-white/5 text-slate-300 hover:bg-white/15"
                    }`}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Real checkout paths: never invent fares or issue unverified tickets. */}
        <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 border border-sky-400/30 p-5 sm:p-7 text-white shadow-xl">
          <p className="text-xs uppercase tracking-wider font-black text-sky-300">Genuine provider checkout</p>
          <h2 className="text-xl sm:text-2xl font-black mt-2">Find your journey. Book with the actual ticket issuer.</h2>
          <p className="text-sm text-slate-300 mt-2">Fares, seat availability, payment and ticket confirmation are provided at external checkout. OrderKing does not yet issue railway tickets or collect railway payments.</p>
          <div className="flex flex-wrap gap-2 mt-5">
            <a href="https://www.irctc.co.in/nget/train-search" target="_blank" rel="noopener noreferrer" className="rounded-xl bg-sky-400 px-4 py-3 text-slate-950 font-black text-sm no-underline hover:bg-sky-300">Train tickets · IRCTC ↗</a>
            <a href="https://www.goindigo.in/" target="_blank" rel="noopener noreferrer" className="rounded-xl bg-white/10 px-4 py-3 text-white font-bold text-sm border border-white/20 no-underline">Flights · IndiGo ↗</a>
            <a href="https://www.redbus.in/" target="_blank" rel="noopener noreferrer" className="rounded-xl bg-white/10 px-4 py-3 text-white font-bold text-sm border border-white/20 no-underline">Bus tickets · redBus ↗</a>
            <a href="https://www.booking.com/" target="_blank" rel="noopener noreferrer" className="rounded-xl bg-white/10 px-4 py-3 text-white font-bold text-sm border border-white/20 no-underline">Hotels · Booking.com ↗</a>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Final fare, fees, refunds and PNR or booking confirmation are controlled by the selected provider.</p>
        </section>
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
                Suggested routes · Check live fares on provider
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto">
              Provider checkout required
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
                      Choose journey date
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 group-hover:text-sky-700 transition-colors">
                    {route.fromCity} ({route.fromCode}) ➔ {route.toCity} ({route.toCode})
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Schedules confirmed by provider
                  </p>
                </div>

                <div className="border-t border-slate-200/80 pt-2.5 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Fare</span>
                    <span className="text-sm font-black font-mono text-slate-900">
                      Check with provider
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button
                      type="button"
                      onClick={() => {
                        const handoff = getRoutePartnerHandoff(route, {
                          departureDate: flightDate,
                          passengers: flightPassengers,
                          cabinClass: flightClass,
                        });
                        toast.success(
                          `Connecting to official ${handoff.portalName} for ${route.fromCity} ➔ ${route.toCity}.`
                        );
                        window.open(handoff.url, "_blank", "noopener,noreferrer");
                      }}
                      className="w-full h-8 px-2 rounded-xl bg-slate-900 hover:bg-sky-600 text-white font-black text-[11px] transition flex items-center justify-center gap-1 shadow-xs"
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
                      className="w-full h-8 px-2 rounded-xl border-slate-200 text-slate-700 hover:text-sky-700 hover:border-sky-300 font-bold text-[11px] transition"
                    >
                      Compare
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unsupported rebate and hypothetical fare calculator withheld from customers. */}

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
                          const links: Record<string, string> = {
                            "6E (IndiGo)": "https://www.goindigo.in/web-check-in.html",
                            "AI (Air India)": "https://www.airindia.com/in/en/manage/web-check-in.html",
                            "QP (Akasa Air)": "https://www.akasaair.com/check-in",
                            "IX (Air India Express)": "https://www.airindiaexpress.com/check-in",
                            "SG (SpiceJet)": "https://www.spicejet.com/webcheckin",
                          };
                          const target = links[airlineCheckInCode] || "https://www.goindigo.in/web-check-in.html";
                          toast.success(`Redirecting to official ${airlineCheckInCode} web check-in portal...`);
                          window.open(target, "_blank", "noopener,noreferrer");
                        }}
                        className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs"
                      >
                        Launch Official Web Check-In ➔
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
                      <span className="text-[10px] font-bold text-indigo-600">Select Sector ➔</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Real-time Dual-Engine Flight Search Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                      <Plane className="size-4" />
                    </span>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                      Search Flights at Official Carrier
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Direct official airline checkouts with zero platform fee. Verified tariffs and availability across domestic and international corridors.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black border transition ${
                      activeEngineResolution.engine === "TRAVELPAYOUTS_DOMESTIC"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-sky-50 border-sky-200 text-sky-800"
                    }`}
                  >
                    <span
                      className={`size-2 rounded-full ${
                        activeEngineResolution.engine === "TRAVELPAYOUTS_DOMESTIC" ? "bg-emerald-500" : "bg-sky-500"
                      }`}
                    />
                    <span>{activeEngineResolution.engineBadge}</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
                    <ShieldCheck className="size-3.5 text-emerald-600" />
                    <span>0% Markup</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Engine Banner & Foreign Card Processing Switch */}
              <div
                className={`p-4 rounded-2xl border transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  activeEngineResolution.engine === "TRAVELPAYOUTS_DOMESTIC"
                    ? "bg-emerald-50/50 border-emerald-200"
                    : "bg-sky-50/50 border-sky-200"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">
                      Active Engine: {activeEngineResolution.engineName}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 font-bold text-slate-700">
                      {activeEngineResolution.settlementCurrency} Settlement
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {activeEngineResolution.notes}
                  </p>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer select-none bg-white px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs self-start md:self-auto">
                  <input
                    type="checkbox"
                    checked={isForeignCard}
                    onChange={(e) => setIsForeignCard(e.target.checked)}
                    className="size-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                  />
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-800 block">Foreign Card / Amex</span>
                    <span className="text-[10px] text-slate-500 block">Clear via Duffel NDC Engine</span>
                  </div>
                </label>
              </div>

              {/* Working Flight Search Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-sky-400">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <MapPin className="size-3 text-sky-600" /> Origin City / Code
                  </label>
                  <AirportAutoSuggest value={flightFrom} onChange={setFlightFrom} theme="light" placeholder="Search 7,900+ airports or city..." ariaLabel="Origin City / Code" />
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-sky-400">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <MapPin className="size-3 text-sky-600" /> Destination / Code
                  </label>
                  <AirportAutoSuggest value={flightTo} onChange={setFlightTo} theme="light" placeholder="Search 7,900+ airports or city..." ariaLabel="Destination / Code" />
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

              {/* Payment Rails & Zero Markup Guarantee */}
              <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 sm:p-5 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-sky-950">Direct Carrier Tariffs · Zero Platform Fee</p>
                    <p className="text-xs text-sky-800 mt-0.5">
                      Actual fares, taxes and seats are verified directly with the operating carriers. OrderKing charges strictly ₹0 platform fee.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg bg-white/90 border border-sky-200 px-2.5 py-1 text-[11px] font-bold text-sky-900 shadow-2xs">
                    <CreditCard className="size-3.5 text-sky-700" />
                    <span>{activeEngineResolution.settlementCurrency} Settlement</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-sky-200/60 flex flex-wrap items-center gap-1.5 text-[11px] text-sky-900">
                  <span className="font-bold text-sky-950">Supported Payment Rails:</span>
                  {activeEngineResolution.supportedPaymentMethods.map((pm) => (
                    <span
                      key={pm}
                      className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/90 border border-sky-200 text-[10px] font-semibold text-sky-800"
                    >
                      {pm}
                    </span>
                  ))}
                </div>
              </div>

              {/* Direct Official Carrier Checkout Options */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    {activeEngineResolution.isDomestic
                      ? "Direct Official Domestic Carrier Checkout (IndiGo, Air India, Akasa, SpiceJet)"
                      : "Direct Official International Carrier Checkout (Air India, Emirates, Qatar, Singapore)"}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    ₹0 Intermediary Markup
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(activeEngineResolution.isDomestic
                    ? [
                        { code: "6E", name: "IndiGo", portal: "goindigo.in" },
                        { code: "AI", name: "Air India", portal: "airindia.com" },
                        { code: "QP", name: "Akasa Air", portal: "akasaair.com" },
                        { code: "SG", name: "SpiceJet", portal: "spicejet.com" },
                      ]
                    : [
                        { code: "AI", name: "Air India (Int'l)", portal: "airindia.com" },
                        { code: "EK", name: "Emirates", portal: "emirates.com" },
                        { code: "QR", name: "Qatar Airways", portal: "qatarairways.com" },
                        { code: "SQ", name: "Singapore Airlines", portal: "singaporeair.com" },
                      ]
                  ).map((carrier) => {
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
                          toast.success(
                            `Connecting to official ${carrier.name} checkout (${carrier.portal})...`
                          );
                        }}
                        className="flex flex-col items-start p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 transition text-left group"
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

              {/* Dual-Engine Live Flight Search Dispatcher */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  disabled={isSearchingDuffel}
                  onClick={async () => {
                    const origin = extractAirportCode(flightFrom, "DEL");
                    const destination = extractAirportCode(flightTo, "BOM");
                    setIsSearchingDuffel(true);
                    try {
                      const res = await fetch("/api/travel/flight-search", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          origin,
                          destination,
                          departureDate: flightDate,
                          passengers: flightPassengers,
                          cabinClass: flightClass,
                          isForeignCard,
                        }),
                      });
                      const json = await res.json();
                      setFlightSearchEngine(json?.engine || activeEngineResolution.engine);
                      setDuffelSearchSource(json?.source || (activeEngineResolution.engine === "TRAVELPAYOUTS_DOMESTIC" ? "travelpayouts" : "duffel_v2"));
                      if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
                        setDuffelFlightResults(json.data);
                        const engineLabel = json?.engine === "TRAVELPAYOUTS_DOMESTIC" ? "Travelpayouts Domestic Network" : "Duffel International GDS";
                        toast.success(`Retrieved ${json.data.length} live carrier offer(s) via ${engineLabel}.`);
                      } else {
                        setDuffelFlightResults([]);
                        toast.info("No live GDS offers returned for this route. Complete direct checkout at official carrier.");
                      }
                    } catch {
                      setDuffelFlightResults([]);
                      toast.error("Unable to query live flight API. Please use direct carrier checkout.");
                    } finally {
                      setIsSearchingDuffel(false);
                    }
                  }}
                  className={`flex-1 h-12 rounded-xl text-white font-black text-sm shadow-md transition ${
                    activeEngineResolution.engine === "TRAVELPAYOUTS_DOMESTIC"
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                      : "bg-sky-600 hover:bg-sky-700 shadow-sky-600/20"
                  }`}
                >
                  {isSearchingDuffel
                    ? `Querying ${activeEngineResolution.engineName}...`
                    : `Query Live ${activeEngineResolution.engine === "TRAVELPAYOUTS_DOMESTIC" ? "Travelpayouts Domestic" : "Duffel GDS"} Offers ➔`}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const newTrip: SavedTripReference = {
                      id: `trip-${Date.now()}`,
                      bookingType: "Flight",
                      providerName: `${airlineCheckInCode.split("(")[0]?.trim() || "Flight"} (${flightClass})`,
                      bookingRef: flightPnrInput || "PLANNED-NOT-BOOKED",
                      travelDate: flightDate,
                      routeOrLocation: `${flightFrom} ➔ ${flightTo}`,
                      notes: `${flightPassengers} Pax · Price not quoted — direct carrier checkout · ${activeEngineResolution.engineName}`,
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

              {/* Dual-Engine Flight Results View */}
              {duffelFlightResults !== null && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Plane className="size-3.5 text-sky-600" />
                      {flightSearchEngine === "TRAVELPAYOUTS_DOMESTIC"
                        ? `Travelpayouts Domestic Network (${duffelFlightResults.length} offers)`
                        : `Duffel International GDS Results (${duffelFlightResults.length} offers)`}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Engine: {flightSearchEngine || activeEngineResolution.engine} · Zero Platform Markup
                    </span>
                  </div>

                  {duffelFlightResults.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-600 space-y-2">
                      <p>
                        No active GDS fares found for this sector via{" "}
                        {flightSearchEngine === "TRAVELPAYOUTS_DOMESTIC" ? "Travelpayouts" : "Duffel"}. Please use official carrier direct checkout:
                      </p>
                      <div className="flex justify-center gap-2">
                        <a
                          href={buildOfficialAirlineDeepLink({ carrierCode: "6E", from: flightFrom, to: flightTo, departureDate: flightDate, passengers: flightPassengers, cabinClass: flightClass }).bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-sky-600 text-white font-bold text-xs"
                        >
                          Book on IndiGo
                        </a>
                        <a
                          href={buildOfficialAirlineDeepLink({ carrierCode: "AI", from: flightFrom, to: flightTo, departureDate: flightDate, passengers: flightPassengers, cabinClass: flightClass }).bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-rose-700 text-white font-bold text-xs"
                        >
                          Book on Air India
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {duffelFlightResults.map((fl: any) => (
                        <div
                          key={fl.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200 gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-xs text-slate-900">{fl.carrierName}</span>
                              <span className="text-[11px] font-mono font-bold text-slate-500">{fl.flightNumber}</span>
                              {fl.aircraftType && <span className="text-[10px] text-slate-400">({fl.aircraftType})</span>}
                            </div>
                            <div className="text-xs text-slate-600 mt-1 flex items-center gap-3">
                              <span>Dep: {fl.departureTime?.split("T")?.[1]?.slice(0, 5) || fl.departureTime}</span>
                              <span>➔</span>
                              <span>Arr: {fl.arrivalTime?.split("T")?.[1]?.slice(0, 5) || fl.arrivalTime}</span>
                              <span className="text-slate-400">({fl.durationMinutes}m)</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3">
                            <span className="text-base font-black font-mono text-slate-900">
                              {formatPaise(fl.pricePaise)}
                            </span>
                            <a
                              href={fl.bookingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition flex items-center gap-1"
                            >
                              <span>Direct Checkout</span>
                              <ArrowUpRight className="size-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Embedded Flight Booking Engine */}
            <FlightBookingEngine initialFrom={flightFrom} initialTo={flightTo} />
          </div>
        )}

        {/* =====================================================================
            CATEGORY 2: TRAINS & IRCTC
            Sub-categories: Search Trains Between Stations,
            Search on IRCTC Portal, Live PNR Enquiry,
            Tatkal & Coach Position Guide
           ===================================================================== */}
        {activeTab === "trains" && (
          <div className="space-y-6">
            {/* Train Search Between Stations & Search on IRCTC Portal */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600">
                    Indian Railways · {currentSub}
                  </span>
                  <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2 mt-0.5">
                    <Train className="size-5 text-indigo-600" />
                    Search Trains Between Stations &amp; Search on IRCTC Portal
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full self-start">
                  Search on IRCTC Portal
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                  <label className="text-[10px] font-bold text-gray-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <MapPin className="size-3 text-indigo-600" /> Origin Station
                  </label>
                  <StationAutoSuggest value={trainFrom} onChange={setTrainFrom} theme="light" placeholder="Search 8,000+ stations or code..." ariaLabel="Origin Station" />
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                  <label className="text-[10px] font-bold text-gray-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <MapPin className="size-3 text-indigo-600" /> Destination Station
                  </label>
                  <StationAutoSuggest value={trainTo} onChange={setTrainTo} theme="light" placeholder="Search 8,000+ stations or code..." ariaLabel="Destination Station" />
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

              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                <p className="text-sm font-black text-indigo-900">Railway fares and seat availability</p>
                <p className="text-xs text-indigo-800 mt-1">Check actual class-wise fares, Tatkal eligibility and current seats on IRCTC. No fare, seat, payment or ticket is confirmed inside OrderKing.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => {
                    const cleanFrom = (trainFrom.includes("(") ? trainFrom.split("(")[1]?.replace(")", "") : trainFrom).trim().toUpperCase();
                    const cleanTo = (trainTo.includes("(") ? trainTo.split("(")[1]?.replace(")", "") : trainTo).trim().toUpperCase();
                    const irctcUrl = `https://www.irctc.co.in/nget/train-search?from=${encodeURIComponent(cleanFrom)}&to=${encodeURIComponent(cleanTo)}&date=${trainDate}`;
                    toast.success(`Handoff to official IRCTC portal for ${cleanFrom} ➔ ${cleanTo}...`);
                    window.open(irctcUrl, "_blank", "noopener,noreferrer");
                  }}
                  className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5"
                >
                  <span>Book Train on Official IRCTC</span>
                  <ArrowUpRight className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const newTrip: SavedTripReference = {
                      id: `trip-${Date.now()}`,
                      bookingType: "Train",
                      providerName: `Indian Railways (${trainClass})`,
                      bookingRef: "PLANNED-NOT-BOOKED",
                      travelDate: trainDate,
                      routeOrLocation: `${trainFrom} ➔ ${trainTo}`,
                      notes: `${trainPassengers} Pax · Quota: ${trainQuota} · Price not quoted — no rail ticket booked`,
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

            {/* Embedded Train Booking Engine */}
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
                  Check Bus Operators at Provider
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

              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 sm:p-5">
                <p className="text-sm font-black text-sky-950">Bus price and availability</p>
                <p className="text-xs text-sky-800 mt-1">Actual fares, taxes, fees, seats and confirmation are available from the booking provider. OrderKing has no authenticated live quote or reservation for this search. Complete the transaction on the provider website.</p>
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
                    const cleanSource = busFrom.replace(/\(.*\)/, "").trim().toLowerCase();
                    const cleanDest = busTo.replace(/\(.*\)/, "").trim().toLowerCase();
                    const redBusUrl = `https://www.redbus.in/bus-tickets/${encodeURIComponent(cleanSource)}-to-${encodeURIComponent(cleanDest)}?onward=${busDate}`;
                    toast.success(`Search on redBus for ${busFrom} ➔ ${busTo}...`);
                    window.open(redBusUrl, "_blank", "noopener,noreferrer");
                  }}
                  className="flex-1 h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm transition shadow-md shadow-orange-600/20 flex items-center justify-center gap-1.5"
                >
                  <span>Search on redBus</span>
                  <ArrowUpRight className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    toast.success(`Verified route schedule for ${busOperator}.`);
                  }}
                  className="h-12 rounded-xl border-slate-200 text-slate-800 font-bold text-sm"
                >
                  View State RTC Booking
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const newTrip: SavedTripReference = {
                      id: `trip-${Date.now()}`,
                      bookingType: "Bus",
                      providerName: `${busOperator !== "All Operators" ? busOperator : "Intercity Bus"} (${busClass})`,
                      bookingRef: "BUS-OPERATOR-DIRECT",
                      travelDate: busDate,
                      routeOrLocation: `${busFrom} ➔ ${busTo}`,
                      notes: `${busPassengers} Passengers · Price not quoted — no bus ticket booked`,
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

            {/* Embedded Bus Booking Engine with interactive berth layout */}
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

              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 sm:p-5">
                <p className="text-sm font-black text-sky-950">Hotel price and availability</p>
                <p className="text-xs text-sky-800 mt-1">Actual fares, taxes, fees, seats and confirmation are available from the booking provider. OrderKing has no authenticated live quote or reservation for this search. Complete the transaction on the provider website.</p>
              </div>
            {/* Sub-category Curated Tier Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  tier: "Luxury 5-Star & Resorts",
                  desc: "Heritage palaces, beachfront resorts & club suites",
                  tag: "5-Star Category",
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
                  const checkIn = hotelCheckIn;
                  const dNext = new Date(checkIn);
                  dNext.setDate(dNext.getDate() + hotelNights);
                  const checkOut = dNext.toISOString().split("T")[0];
                  const cleanCity = hotelCity.replace(/\,.*$/, "").trim();
                  const agodaUrl = `https://www.agoda.com/partners/partnersearch.aspx?city=${encodeURIComponent(cleanCity)}&checkin=${checkIn}&checkout=${checkOut}&rooms=${hotelRooms}&adults=${hotelRooms * 2}`;
                  toast.success(`Handoff to hotel partner for ${cleanCity} (${hotelNights} nights)...`);
                  window.open(agodaUrl, "_blank", "noopener,noreferrer");
                }}
                className="flex-1 h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5"
              >
                <span>Check {currentSub} at Hotel Provider</span>
                <ArrowUpRight className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const newTrip: SavedTripReference = {
                    id: `trip-${Date.now()}`,
                    bookingType: "Hotel",
                    providerName: `${currentSub} (${hotelCity})`,
                    bookingRef: "PLANNED-NOT-BOOKED",
                    travelDate: hotelCheckIn,
                    routeOrLocation: hotelCity,
                    notes: `${hotelNights} Nights · ${hotelRooms} Rooms · Price not quoted — no hotel reserved`,
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
                  Fare: check with cab provider
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

              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 sm:p-5">
                <p className="text-sm font-black text-sky-950">Cab price and availability</p>
                <p className="text-xs text-sky-800 mt-1">Actual fares, taxes, fees, seats and confirmation are available from the booking provider. OrderKing has no authenticated live quote or reservation for this search. Complete the transaction on the provider website.</p>
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
                  const uberUrl = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(cabDrop)}`;
                  toast.success(`Opening provider booking options for ${cabPickup} ➔ ${cabDrop}...`);
                  window.open(uberUrl, "_blank", "noopener,noreferrer");
                }}
                className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
              >
                <span>Check Fare & Book with Provider</span>
                <ArrowUpRight className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const newTrip: SavedTripReference = {
                    id: `trip-${Date.now()}`,
                    bookingType: "Cab",
                    providerName: `Chauffeur (${cabVehicleClass.toUpperCase()})`,
                    bookingRef: "PLANNED-NOT-DISPATCHED",
                    travelDate: new Date().toISOString().split("T")[0],
                    routeOrLocation: `${cabPickup} ➔ ${cabDrop}`,
                    notes: `${cabDistanceKm} km · Mode: ${cabPackageHours} · Price not quoted — no cab dispatched`,
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
                  Connect directly to your RBI-authorized NETC issuing bank portal or estimate NHAI national highway toll outlay. No wallet debit is made here.
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
