import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { CustomerShell } from "@/components/market/shell";
import { SovereignETicketModal } from "@/components/fintech/sovereign-eticket-modal";
import { TravelQuotationModal } from "@/components/fintech/travel-quotation-modal";
import { CabBookingEngine } from "@/components/fintech/cab-booking-engine";
import {
  type SovereignETicket,
  getStoredETickets,
} from "@/lib/travel/in-app-booking-service";
import {
  buildOfficialAirlineDeepLink,
  extractAirportCode,
} from "@/lib/travel/airline-deep-links";
import type {
  FlightOption,
  TrainOption,
  BusOption,
  HotelOption,
} from "@/lib/travel/types";
import {
  Plane,
  Train,
  Bus,
  Building2,
  Car,
  ShieldCheck,
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
  Crown,
  Globe,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/utils";
import { TravelSkeleton } from "@/components/skeletons/travel-skeleton";
import { AppErrorComponent } from "@/lib/error-component";
import { AirportAutoSuggest, StationAutoSuggest } from "@/components/fintech/travel-autosuggest";

export const Route = createFileRoute("/travel/")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: (search.tab as string) || undefined,
  }),
  component: TravelPage,
  pendingComponent: TravelSkeleton,
  errorComponent: AppErrorComponent,
});

export type TravelTab = "flights" | "trains" | "buses" | "hotels" | "cabs" | "fastag" | "trips" | "pilgrimage";

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
    tag: "Mumbai Tejas Rajdhani",
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
    id: "route-mmct-asr-paschim",
    type: "train",
    fromCity: "Mumbai Central",
    fromCode: "MMCT",
    toCity: "Amritsar via NDLS",
    toCode: "ASR",
    tag: "Paschim Superfast Express",
    partnerUrl: "https://www.irctc.co.in/nget/train-search?from=MMCT&to=ASR",
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
  bookingType: "Flight" | "Train" | "Bus" | "Hotel" | "Cab" | "Tour";
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
  { code: "6E", name: "IndiGo", portal: "goindigo.in", color: "sky" },
  { code: "AI", name: "Air India", portal: "airindia.com", color: "rose" },
  { code: "QP", name: "Akasa Air", portal: "akasaair.com", color: "orange" },
  { code: "SG", name: "SpiceJet", portal: "spicejet.com", color: "amber" },
];

export function TravelPage() {
  const searchTab = useRouterState({ select: (s) => (s?.location?.search as any)?.tab }) as unknown as string | undefined;
  const sectionHash = (useRouterState({ select: (s) => s?.location?.hash }) as unknown as string) ?? "";

  const [activeTab, setActiveTab] = useState<TravelTab>(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const raw = (sp.get("tab") || window.location.hash.replace(/^#/, "")).toLowerCase();
      if (raw === "hotels") return "hotels";
      if (raw === "trains") return "trains";
      if (raw === "buses") return "buses";
      if (raw === "cabs") return "cabs";
      if (raw === "trips") return "trips";
      if (raw === "pilgrimage" || raw === "tours" || raw === "holiday" || raw === "holidays" || raw === "umrah") return "pilgrimage";
    }
    return "flights";
  });

  useEffect(() => {
    const tabParam = (searchTab || "").toLowerCase();
    const cleanHash = (sectionHash ?? "").replace(/^#/, "").toLowerCase();
    const target = tabParam || cleanHash;
    if (target === "flights") setActiveTab("flights");
    else if (target === "trains") setActiveTab("trains");
    else if (target === "buses") setActiveTab("buses");
    else if (target === "hotels") setActiveTab("hotels");
    else if (target === "cabs") setActiveTab("cabs");
    else if (target === "trips") setActiveTab("trips");
    else if (target === "pilgrimage" || target === "tours" || target === "holiday" || target === "holidays" || target === "umrah") setActiveTab("pilgrimage");
  }, [sectionHash, searchTab]);

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

  // Live Search Results State
  const [flightOffers, setFlightOffers] = useState<FlightOption[]>([]);
  const [flightsLoading, setFlightsLoading] = useState(false);
  const [flightsSearched, setFlightsSearched] = useState(false);
  const [flightSource, setFlightSource] = useState<string | null>(null);

  const [trainOffers, setTrainOffers] = useState<TrainOption[]>([]);
  const [trainsLoading, setTrainsLoading] = useState(false);
  const [trainsSearched, setTrainsSearched] = useState(false);
  const [pnrOfficialUrl, setPnrOfficialUrl] = useState<string | null>(null);

  const [busOffers, setBusOffers] = useState<BusOption[]>([]);
  const [busesLoading, setBusesLoading] = useState(false);
  const [busesSearched, setBusesSearched] = useState(false);

  const [hotelOffers, setHotelOffers] = useState<HotelOption[]>([]);
  const [hotelsLoading, setHotelsLoading] = useState(false);
  const [hotelsSearched, setHotelsSearched] = useState(false);

  // Cab Search State
  const [cabPickup] = useState("Terminal 3, IGI Airport (DEL)");
  const [cabDrop] = useState("Connaught Place, New Delhi");

  // Holiday Tours & Spiritual Tour Desk State
  const [toursSubCategory, setToursSubCategory] = useState<"holidays" | "pilgrimage">("holidays");
  const [pilgrimSearchQuery, setPilgrimSearchQuery] = useState("");
  const [spiritualFaithSelection, setSpiritualFaithSelection] = useState<"ISLAMIC" | "SANATAN" | "SIKH" | "CHRISTIAN" | null>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("orderking_faith_tradition") as any) || null;
    }
    return null;
  });
  const [spiritualCircuitFilter, setSpiritualCircuitFilter] = useState<"ALL" | "ISLAMIC" | "SANATAN" | "LEISURE">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("orderking_spiritual_circuit") as any) || "ALL";
    }
    return "ALL";
  });

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
  const [quotationModal, setQuotationModal] = useState<{ isOpen: boolean; category?: "UMRAH" | "TRAIN" | "FLIGHT" | "PILGRIMAGE" | "HOLIDAY"; destination?: string; origin?: string } | null>(null);

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

  const handleLaunchFlightSearch = useCallback(async () => {
    const origin = extractAirportCode(flightFrom, "DEL");
    const destination = extractAirportCode(flightTo, "BOM");
    setFlightsLoading(true);
    setFlightsSearched(true);
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
        }),
      });
      const json = await res.json().catch(() => null);
      const list = Array.isArray(json?.data) ? (json.data as FlightOption[]) : [];
      setFlightOffers(list);
      setFlightSource(json?.source || null);
      if (list.length > 0) {
        toast.success(`Found ${list.length} live flights from ${origin} to ${destination}.`);
      } else {
        toast.info(`No live GDS offers returned for ${origin} -> ${destination}. Use official airline portals below.`);
      }
    } catch {
      setFlightOffers([]);
      toast.error("Flight search service unavailable. Please use official airline portals below.");
    } finally {
      setFlightsLoading(false);
    }
  }, [flightFrom, flightTo, flightDate, flightPassengers, flightClass]);

  const handleSearchTrains = useCallback(async () => {
    const fromCode = extractAirportCode(trainFrom, "NDLS");
    const toCode = extractAirportCode(trainTo, "MMCT");
    setTrainsLoading(true);
    setTrainsSearched(true);
    try {
      const quotaCode = trainQuota.includes("TQ") ? "TQ" : trainQuota.includes("LD") ? "LD" : "GN";
      const res = await fetch("/api/travel/train-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromStation: fromCode,
          toStation: toCode,
          travelDate: trainDate,
          quota: quotaCode,
        }),
      });
      const json = await res.json().catch(() => null);
      const list = Array.isArray(json?.data) ? (json.data as TrainOption[]) : [];
      setTrainOffers(list);
      if (list.length > 0) {
        toast.success(`Loaded ${list.length} trains for ${fromCode} to ${toCode}.`);
      } else {
        toast.info(`Use official IRCTC portal for live ${fromCode} -> ${toCode} seat availability.`);
      }
    } catch {
      setTrainOffers([]);
      toast.error("Rail API unreachable. Use official IRCTC portal below.");
    } finally {
      setTrainsLoading(false);
    }
  }, [trainFrom, trainTo, trainDate, trainQuota]);

  const handleSearchHotels = useCallback(async () => {
    setHotelsLoading(true);
    setHotelsSearched(true);
    try {
      const checkInObj = new Date(hotelCheckIn);
      checkInObj.setDate(checkInObj.getDate() + Math.max(1, hotelNights));
      const checkOutDate = checkInObj.toISOString().split("T")[0];
      const guestsMatch = hotelGuests.match(/\d+/);
      const guestCount = guestsMatch ? Number(guestsMatch[0]) : 2;

      const res = await fetch("/api/travel/hotel-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityOrLocation: hotelCity.trim() || "Goa",
          checkInDate: hotelCheckIn,
          checkOutDate,
          guests: guestCount,
          rooms: hotelRooms,
        }),
      });
      const json = await res.json().catch(() => null);
      const list = Array.isArray(json?.data) ? (json.data as HotelOption[]) : [];
      setHotelOffers(list);
      if (list.length > 0) {
        toast.success(`Loaded ${list.length} properties in ${hotelCity || "India"}.`);
      } else {
        toast.info(`No live hotel API inventory returned for ${hotelCity}. Use partner search or request a quote.`);
      }
    } catch {
      setHotelOffers([]);
      toast.error("Hotel search unavailable. Try partner checkout or request a quote.");
    } finally {
      setHotelsLoading(false);
    }
  }, [hotelCity, hotelCheckIn, hotelNights, hotelGuests, hotelRooms]);

  const handleSearchBuses = useCallback(async () => {
    const cleanSource = busFrom.replace(/\(.*\)/, "").trim();
    const cleanDest = busTo.replace(/\(.*\)/, "").trim();
    setBusesLoading(true);
    setBusesSearched(true);
    try {
      const res = await fetch("/api/travel/bus-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceCity: cleanSource,
          destinationCity: cleanDest,
          journeyDate: busDate,
          busType: busClass,
        }),
      });
      const json = await res.json().catch(() => null);
      const list = Array.isArray(json?.data) ? (json.data as BusOption[]) : [];
      setBusOffers(list);
      if (list.length > 0) {
        toast.success(`Found ${list.length} live buses from ${cleanSource} to ${cleanDest}.`);
      } else {
        toast.info(`Opening redBus is recommended for live ${cleanSource} -> ${cleanDest} seats.`);
      }
    } catch {
      setBusOffers([]);
      toast.error("Bus API unavailable. Use redBus direct search below.");
    } finally {
      setBusesLoading(false);
    }
  }, [busFrom, busTo, busDate, busClass]);

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
    setPnrOfficialUrl(null);
    try {
      const res = await fetch("/api/travel/pnr-status?pnr=" + encodeURIComponent(String(clean ?? "")), { cache: "no-store" });
      const result = await res.json().catch(() => null);
      if (res.ok && result?.source === "verified_provider" && result.data) {
        setPnrLiveResult(result.data);
        toast.success("Verified CRIS PNR status retrieved.");
      } else {
        setPnrOfficialUrl(result?.officialPortalUrl || `https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html?pnrno=${clean}`);
        toast.error(result?.error || "Verified railway PNR status is temporarily unavailable.");
      }
    } catch {
      setPnrOfficialUrl(`https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html?pnrno=${clean}`);
      toast.error("Railway PNR verification service is temporarily unreachable.");
    } finally {
      setCheckingPnr(false);
    }
  };

  return (
    <CustomerShell maxWidth="max-w-7xl">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4 sm:py-6 space-y-6">

        {/* Authoritative Single Travel Desk Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white border border-slate-800 shadow-xl">
          <div>
            <div className="inline-flex flex-wrap items-center gap-1.5 text-xs font-black uppercase tracking-wider text-orange-400 mb-1">
              <span className="inline-flex items-center gap-1">
                <Crown className="size-3.5 text-orange-400" /> OrderKing Travel · Travel King Desk (GSTIN: 18AFXPH9838M1Z9)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Flights, Trains, Hotels, Buses &amp; Holiday Tours
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Search and book domestic and international flights, IRCTC train tickets, luxury hotels, and holiday packages.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setQuotationModal({ isOpen: true, category: "UMRAH" })}
              className="shrink-0 rounded-2xl px-3.5 py-2.5 text-xs font-black transition flex items-center gap-1.5 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-300 hover:to-orange-400 text-slate-950 shadow-md cursor-pointer"
            >
              <Compass className="size-3.5" />
              <span>Direct Quotation Desk (Umrah / Trains)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("trips")}
              className={`shrink-0 rounded-2xl px-4 py-2.5 text-xs font-black transition flex items-center gap-2 border self-start sm:self-auto ${activeTab === "trips"
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
        </div>

        {/* AUTHORITATIVE SINGLE TRAVEL DESK */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm space-y-6">

          {/* ─── CORE HUB: 4 TRAVEL TILES ─── */}
          <div className="space-y-3 pb-3 border-b border-slate-100">
            {/* Row 1: The 4 Travel Tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
              {/* Tile 1: Flights */}
              <button
                type="button"
                onClick={() => setActiveTab("flights")}
                className={cn(
                  "group rounded-2xl border p-3 sm:p-4 text-left transition-all duration-200 active:scale-[0.98] flex flex-col justify-between min-h-[96px] sm:min-h-[104px] cursor-pointer",
                  activeTab === "flights"
                    ? "border-sky-500 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white shadow-md ring-2 ring-sky-400"
                    : "border-slate-200 bg-slate-50 hover:bg-white hover:border-sky-300 text-slate-800"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "size-9 sm:size-10 rounded-xl flex items-center justify-center transition shrink-0",
                    activeTab === "flights" ? "bg-sky-400/20 text-sky-300 border border-sky-400/30" : "bg-sky-100 text-sky-600"
                  )}>
                    <Plane className="size-4.5 sm:size-5" />
                  </div>
                  <ChevronRight className={cn("size-4 transition", activeTab === "flights" ? "text-sky-300" : "text-slate-400 group-hover:text-sky-600")} />
                </div>
                <div className="min-w-0 mt-2">
                  <span className={cn("text-xs sm:text-sm font-black truncate block", activeTab === "flights" ? "text-white" : "text-slate-950")}>
                    Flights
                  </span>
                  <span className={cn("text-[10px] sm:text-[11px] truncate block mt-0.5", activeTab === "flights" ? "text-sky-200/80" : "text-slate-500")}>
                    Domestic &amp; International
                  </span>
                </div>
              </button>

              {/* Tile 2: Trains */}
              <button
                type="button"
                onClick={() => setActiveTab("trains")}
                className={cn(
                  "group rounded-2xl border p-3 sm:p-4 text-left transition-all duration-200 active:scale-[0.98] flex flex-col justify-between min-h-[96px] sm:min-h-[104px] cursor-pointer",
                  activeTab === "trains"
                    ? "border-indigo-500 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white shadow-md ring-2 ring-indigo-400"
                    : "border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 text-slate-800"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "size-9 sm:size-10 rounded-xl flex items-center justify-center transition shrink-0",
                    activeTab === "trains" ? "bg-indigo-400/20 text-indigo-300 border border-indigo-400/30" : "bg-indigo-100 text-indigo-600"
                  )}>
                    <Train className="size-4.5 sm:size-5" />
                  </div>
                  <ChevronRight className={cn("size-4 transition", activeTab === "trains" ? "text-indigo-300" : "text-slate-400 group-hover:text-indigo-600")} />
                </div>
                <div className="min-w-0 mt-2">
                  <span className={cn("text-xs sm:text-sm font-black truncate block", activeTab === "trains" ? "text-white" : "text-slate-950")}>
                    Trains
                  </span>
                  <span className={cn("text-[10px] sm:text-[11px] truncate block mt-0.5", activeTab === "trains" ? "text-indigo-200/80" : "text-slate-500")}>
                    IRCTC Trains &amp; PNR Status
                  </span>
                </div>
              </button>

              {/* Tile 3: Hotels */}
              <button
                type="button"
                onClick={() => setActiveTab("hotels")}
                className={cn(
                  "group rounded-2xl border p-3 sm:p-4 text-left transition-all duration-200 active:scale-[0.98] flex flex-col justify-between min-h-[96px] sm:min-h-[104px] cursor-pointer",
                  activeTab === "hotels"
                    ? "border-orange-500 bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 text-white shadow-md ring-2 ring-orange-400"
                    : "border-slate-200 bg-slate-50 hover:bg-white hover:border-orange-300 text-slate-800"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "size-9 sm:size-10 rounded-xl flex items-center justify-center transition shrink-0",
                    activeTab === "hotels" ? "bg-orange-400/20 text-orange-300 border border-orange-400/30" : "bg-orange-100 text-orange-600"
                  )}>
                    <Building2 className="size-4.5 sm:size-5" />
                  </div>
                  <ChevronRight className={cn("size-4 transition", activeTab === "hotels" ? "text-orange-300" : "text-slate-400 group-hover:text-orange-600")} />
                </div>
                <div className="min-w-0 mt-2">
                  <span className={cn("text-xs sm:text-sm font-black truncate block", activeTab === "hotels" ? "text-white" : "text-slate-950")}>
                    Hotels
                  </span>
                  <span className={cn("text-[10px] sm:text-[11px] truncate block mt-0.5", activeTab === "hotels" ? "text-orange-200/80" : "text-slate-500")}>
                    Hotels &amp; Resorts Worldwide
                  </span>
                </div>
              </button>

              {/* Tile 4: Tours */}
              <button
                type="button"
                onClick={() => setActiveTab("pilgrimage")}
                className={cn(
                  "group rounded-2xl border p-3 sm:p-4 text-left transition-all duration-200 active:scale-[0.98] flex flex-col justify-between min-h-[96px] sm:min-h-[104px] cursor-pointer",
                  activeTab === "pilgrimage"
                    ? "border-emerald-500 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white shadow-md ring-2 ring-emerald-400"
                    : "border-slate-200 bg-slate-50 hover:bg-white hover:border-emerald-300 text-slate-800"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "size-9 sm:size-10 rounded-xl flex items-center justify-center transition shrink-0",
                    activeTab === "pilgrimage" ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30" : "bg-emerald-100 text-emerald-600"
                  )}>
                    <Compass className="size-4.5 sm:size-5" />
                  </div>
                  <ChevronRight className={cn("size-4 transition", activeTab === "pilgrimage" ? "text-emerald-300" : "text-slate-400 group-hover:text-emerald-600")} />
                </div>
                <div className="min-w-0 mt-2">
                  <span className={cn("text-xs sm:text-sm font-black truncate block", activeTab === "pilgrimage" ? "text-white" : "text-slate-950")}>
                    Holiday Tours
                  </span>
                  <span className={cn("text-[10px] sm:text-[11px] truncate block mt-0.5", activeTab === "pilgrimage" ? "text-emerald-200/80" : "text-slate-500")}>
                    World &amp; Domestic Destinations
                  </span>
                </div>
              </button>
            </div>

            {/* Row 2: Travel Modes (Buses, Cabs, My Trips) */}
            <div className="flex gap-2 overflow-x-auto pt-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab("buses")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border",
                  activeTab === "buses"
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                )}
              >
                <Bus className="size-3.5 text-orange-500" />
                <span>Buses &amp; Sleepers</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("cabs")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border",
                  activeTab === "cabs"
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                )}
              >
                <Car className="size-3.5 text-emerald-500" />
                <span>Cabs &amp; Airport</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("trips")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border",
                  activeTab === "trips"
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                )}
              >
                <Compass className="size-3.5 text-purple-500" />
                <span>My Trips ({savedTrips.length})</span>
              </button>
            </div>
          </div>

          {/* =====================================================================
              CATEGORY 1: FLIGHTS (INDIAN DOMESTIC CARRIERS + IN-APP WORKFLOW)
             ===================================================================== */}
          {activeTab === "flights" && (
            <div className="space-y-6">

              {/* Concession Fare Selector */}
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
                        className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${specialFareType === fare
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
                  Direct Airline Portal Redirect · Zero Markup
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
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer"
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

              {/* Primary Flight Search Action */}
              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  disabled={flightsLoading}
                  onClick={handleLaunchFlightSearch}
                  className="w-full sm:w-auto h-11 px-6 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs shadow-md shadow-sky-600/20 flex items-center justify-center gap-2"
                >
                  {flightsLoading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                  {flightsLoading ? "Searching Live Airlines..." : "Search Live Flights"}
                </Button>
              </div>

              {/* High-Frequency Corridors Quick Shortcuts */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  High-Frequency Domestic Air Corridors
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: "Delhi (DEL) to Mumbai (BOM)", from: "New Delhi (DEL)", to: "Mumbai (BOM)" },
                    { label: "Bengaluru (BLR) to Delhi (DEL)", from: "Bengaluru (BLR)", to: "New Delhi (DEL)" },
                    { label: "Mumbai (BOM) to Goa (GOI)", from: "Mumbai (BOM)", to: "Goa (GOI)" },
                    { label: "Kolkata (CCU) to Bengaluru (BLR)", from: "Kolkata (CCU)", to: "Bengaluru (BLR)" },
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
                      <span className="text-[10px] font-bold text-sky-600">Load Route</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* LIVE FLIGHT RESULTS (Real GDS / Travelpayouts / Direct Carrier Portals) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Plane className="size-4 text-sky-600" />
                    <span>
                      {flightsLoading
                        ? "Fetching Live Airline Fares..."
                        : `Live Flight Offers (${flightOffers.length})`}
                    </span>
                    {flightSource && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {flightSource === "duffel_v2" ? "Duffel GDS" : flightSource === "travelpayouts" ? "Travelpayouts" : flightSource}
                      </span>
                    )}
                  </h3>
                  <span className="text-xs text-slate-500 font-bold hidden sm:inline">
                    {extractAirportCode(flightFrom, "DEL")} to {extractAirportCode(flightTo, "BOM")}
                  </span>
                </div>

                {flightsLoading ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-xs font-bold text-slate-600 flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin text-sky-600" />
                    <span>Querying live airline availability and fare feed...</span>
                  </div>
                ) : flightOffers.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {flightOffers.map((flight) => {
                      const depTime = flight.departureTime.includes("T") ? flight.departureTime.slice(11, 16) : flight.departureTime;
                      const arrTime = flight.arrivalTime.includes("T") ? flight.arrivalTime.slice(11, 16) : flight.arrivalTime;
                      const hrs = Math.floor(flight.durationMinutes / 60);
                      const mins = flight.durationMinutes % 60;
                      const originCode = extractAirportCode(flightFrom, "DEL");
                      const destCode = extractAirportCode(flightTo, "BOM");
                      return (
                        <div
                          key={flight.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-sky-300 hover:shadow-md transition p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-md font-black text-xs bg-slate-900 text-white">
                                {flight.carrierCode} — {flight.carrierName}
                              </span>
                              <span className="font-mono text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                                {flight.flightNumber}
                              </span>
                              {flight.aircraftType && (
                                <span className="text-xs text-slate-500">· {flight.aircraftType}</span>
                              )}
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                {flight.directStops === 0 ? "Non-Stop" : `${flight.directStops} Stop`}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 text-sm">
                              <div>
                                <span className="text-lg font-black font-mono text-slate-900">{depTime}</span>
                                <span className="text-xs text-slate-500 block font-bold">{originCode}</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="text-[10px] text-slate-400 font-bold">{hrs}h {mins}m</span>
                                <div className="w-16 h-0.5 bg-slate-300 my-1 relative">
                                  <span className="size-1.5 rounded-full bg-sky-600 absolute right-0 -top-0.5" />
                                </div>
                              </div>
                              <div>
                                <span className="text-lg font-black font-mono text-slate-900">{arrTime}</span>
                                <span className="text-xs text-slate-500 block font-bold">{destCode}</span>
                              </div>
                            </div>

                            {flight.baggageAllowance && (
                              <p className="text-[11px] text-slate-500">
                                Baggage: <strong>{flight.baggageAllowance}</strong>
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col md:items-end justify-between gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
                            <div>
                              <span className="text-[10px] text-slate-500 block">Live Supplier Fare</span>
                              <span className="text-xl font-black font-mono text-slate-900">
                                {flight.pricePaise > 0 ? formatPaise(flight.pricePaise) : "Check airline portal"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <a
                                href={flight.bookingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => {
                                  toast.success(`Opening ${flight.carrierName} checkout...`);
                                }}
                                className="h-10 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs shadow-md shadow-sky-600/20 inline-flex items-center gap-1.5 transition"
                              >
                                <span>Book on {flight.carrierName}</span>
                                <ExternalLink className="size-3.5" />
                              </a>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setQuotationModal({
                                    isOpen: true,
                                    category: "FLIGHT",
                                    origin: originCode,
                                    destination: destCode,
                                  });
                                }}
                                className="h-10 px-3 rounded-xl border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold"
                              >
                                Request Quote
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-slate-900">
                        {flightsSearched
                          ? `No live airline inventory feed returned for ${extractAirportCode(flightFrom, "DEL")} -> ${extractAirportCode(flightTo, "BOM")}.`
                          : "Search live fares above or open direct carrier portals below."}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Use the official airline portals below for real-time schedules and seat inventory, or request a concierge quote.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setQuotationModal({
                          isOpen: true,
                          category: "FLIGHT",
                          origin: extractAirportCode(flightFrom, "DEL"),
                          destination: extractAirportCode(flightTo, "BOM"),
                        });
                      }}
                      className="h-9 px-3.5 rounded-xl border-slate-200 hover:bg-white text-slate-800 text-xs font-bold shrink-0"
                    >
                      Request Flight Quote
                    </Button>
                  </div>
                )}
              </div>

              {/* Direct Official Carrier Checkout Cards */}
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
                        <span className="text-[9px] font-bold text-sky-700 mt-1 bg-sky-50 px-1.5 py-0.5 rounded">
                          Official Tariff
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
                      Launch Web Check-In
                    </Button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* =====================================================================
              CATEGORY 2: TRAINS (RAJDHANI, VANDE BHARAT, PASCHIM + 1A/2A/3A/SL)
             ===================================================================== */}
          {activeTab === "trains" && (
            <div className="space-y-6">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600">
                    Indian Railways PRS Network · Official Schedules
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                    Tejas Rajdhani, Vande Bharat &amp; Paschim Superfast Express
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full self-start">
                  Official IRCTC Portal Handoff · ₹0 Markup
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
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer"
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
                    <option value="1A">First AC (1A)</option>
                    <option value="2A">AC 2-Tier (2A)</option>
                    <option value="3A">AC 3-Tier (3A)</option>
                    <option value="SL">Sleeper Class (SL)</option>
                    <option value="EC">Executive Chair (EC)</option>
                    <option value="CC">AC Chair Car (CC)</option>
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

              {/* Primary Train Search Action */}
              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  disabled={trainsLoading}
                  onClick={handleSearchTrains}
                  className="w-full sm:w-auto h-11 px-6 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-black text-xs shadow-md shadow-indigo-700/20 flex items-center justify-center gap-2"
                >
                  {trainsLoading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                  {trainsLoading ? "Checking Rail Feeds..." : "Search Official Railway Schedules"}
                </Button>
              </div>

              {/* LIVE RAIL SEARCH / DIRECT OFFICIAL IRCTC PORTAL */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Train className="size-4 text-indigo-600" />
                    <span>Indian Railways Direct Booking</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-bold hidden sm:inline">
                    {extractAirportCode(trainFrom, "NDLS")} to {extractAirportCode(trainTo, "MMCT")}
                  </span>
                </div>

                {trainOffers.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3.5">
                    {trainOffers.map((trainItem) => (
                      <div
                        key={trainItem.trainNumber}
                        className="rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-indigo-300 hover:shadow-md transition p-4 sm:p-5 space-y-3.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-md font-black text-xs bg-indigo-900 text-white">
                                {trainItem.trainNumber}
                              </span>
                              <h4 className="text-base font-black text-slate-900">
                                {trainItem.trainName}
                              </h4>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm self-start sm:self-auto">
                            <div>
                              <span className="text-lg font-black font-mono text-slate-900">{trainItem.departureTime}</span>
                              <span className="text-xs text-slate-500 block font-bold">{trainItem.fromStation}</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] text-slate-400 font-bold">{Math.floor(trainItem.durationMinutes / 60)}h {trainItem.durationMinutes % 60}m</span>
                              <div className="w-16 h-0.5 bg-slate-300 my-1" />
                            </div>
                            <div>
                              <span className="text-lg font-black font-mono text-slate-900">{trainItem.arrivalTime}</span>
                              <span className="text-xs text-slate-500 block font-bold">{trainItem.toStation}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-slate-400">Official IRCTC Direct Ticket Availability</span>
                          <a
                            href={`https://www.irctc.co.in/nget/train-search?from=${trainItem.fromStation}&to=${trainItem.toStation}&date=${trainDate}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                          >
                            <span>Open on IRCTC Portal</span>
                            <ExternalLink className="size-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-indigo-50/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-black text-slate-900">
                        {trainsSearched
                          ? `IRCTC direct authentication is required for live seat availability (${extractAirportCode(trainFrom, "NDLS")} -> ${extractAirportCode(trainTo, "MMCT")}).`
                          : "Live berth inventory and Tatkal booking open directly on IRCTC."}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        Open IRCTC for live trains, classes ({trainClass}), and real-time fares with zero synthetic schedules.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <a
                        href={`https://www.irctc.co.in/nget/train-search?from=${encodeURIComponent(extractAirportCode(trainFrom, "NDLS"))}&to=${encodeURIComponent(extractAirportCode(trainTo, "MMCT"))}&date=${encodeURIComponent(trainDate)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 px-4 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-black text-xs inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <span>Open IRCTC Portal</span>
                        <ExternalLink className="size-3.5" />
                      </a>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setQuotationModal({
                            isOpen: true,
                            category: "TRAIN",
                            origin: extractAirportCode(trainFrom, "NDLS"),
                            destination: extractAirportCode(trainTo, "MMCT"),
                          });
                        }}
                        className="h-10 px-3 rounded-xl border-slate-200 hover:bg-white text-slate-800 text-xs font-bold"
                      >
                        Request Rail Quote
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Live 10-Digit IRCTC PNR Status Bar */}
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

                {pnrOfficialUrl && !pnrLiveResult && (
                  <div className="rounded-xl border border-indigo-200 bg-white p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-slate-700">
                      Indian Railways requires government captcha verification for direct PNR lookup.
                    </span>
                    <a
                      href={pnrOfficialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shrink-0"
                    >
                      <span>Open Official IndianRail PNR Portal</span>
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                )}

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
                          {pnrLiveResult.originStationCode} to {pnrLiveResult.destinationStationCode}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase border self-start ${pnrLiveResult.chartStatus === "CHART PREPARED"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-orange-100 text-orange-900 border-orange-300"
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
                          routeOrLocation: `${pnrLiveResult.originStationCode} to ${pnrLiveResult.destinationStationCode}`,
                          notes: `Coach: ${pnrLiveResult.passengers?.[0]?.coach || "B2"} · Status: ${pnrLiveResult.chartStatus}`,
                          createdAt: new Date().toISOString(),
                        };
                        persistTrips([newTrip, ...savedTrips]);
                        toast.success(`Saved verified PNR ${pnrLiveResult.pnr} to My Trips.`);
                      }}
                      className="w-full sm:w-auto h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    >
                      Save Verified PNR to My Trips
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
                  • <strong>AC Classes (1A, 2A, 3A, CC, EC):</strong> Window opens at <strong>10:00 AM IST</strong> one day prior to origin train departure.
                </p>
                <p className="text-slate-600">
                  • <strong>Non-AC Sleeper (SL, 2S):</strong> Window opens at <strong>11:00 AM IST</strong> one day prior to departure.
                </p>
              </div>

            </div>
          )}

          {/* =====================================================================
              CATEGORY 3: HOTELS & RESORTS WORLDWIDE
             ===================================================================== */}
          {activeTab === "hotels" && (
            <div className="space-y-6">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-orange-600">
                    Hotels &amp; Accommodations
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                    Book Hotels &amp; Resorts Worldwide
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-orange-900 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full self-start">
                  Direct Hotel Portals &amp; Concierge Quotes
                </span>
              </div>

              {/* Working Hotel Search Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-orange-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <MapPin className="size-3 text-orange-600" /> Destination City / Area
                  </label>
                  <input
                    type="text"
                    value={hotelCity}
                    onChange={(e) => setHotelCity(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                    placeholder="e.g. Mumbai, Goa, Delhi, Dubai, Udaipur"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-orange-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Calendar className="size-3 text-orange-600" /> Check-In Date
                  </label>
                  <input
                    type="date"
                    value={hotelCheckIn}
                    onChange={(e) => setHotelCheckIn(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-orange-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Clock className="size-3 text-orange-600" /> Nights
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

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-orange-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Building2 className="size-3 text-orange-600" /> Rooms
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

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-orange-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Users className="size-3 text-orange-600" /> Guests
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

              {/* Primary Stays Search Action */}
              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  disabled={hotelsLoading}
                  onClick={handleSearchHotels}
                  className="w-full sm:w-auto h-11 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-slate-950 font-black text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-2"
                >
                  {hotelsLoading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                  {hotelsLoading ? "Searching Live Stays..." : "Search Live Hotels"}
                </Button>
              </div>

              {/* LIVE ACCOMMODATIONS (Real Aggregator Feed / Booking.com Direct Search) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Building2 className="size-4 text-orange-600" />
                    <span>
                      {hotelsLoading
                        ? "Fetching Properties..."
                        : `Live Accommodations (${hotelOffers.length})`}
                    </span>
                  </h3>
                  <span className="text-xs text-slate-500 font-bold hidden sm:inline">
                    Live Availability &amp; Rates
                  </span>
                </div>

                {hotelsLoading ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-xs font-bold text-slate-600 flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin text-orange-600" />
                    <span>Querying hotel availability in {hotelCity || "India"}...</span>
                  </div>
                ) : hotelOffers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hotelOffers.map((hotel) => (
                      <div
                        key={hotel.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-orange-300 hover:shadow-md transition p-4 sm:p-5 flex flex-col justify-between gap-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 block">
                                {hotel.city}
                              </span>
                              <h4 className="text-base font-black text-slate-900 mt-0.5">
                                {hotel.hotelName}
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5">{hotel.address}</p>
                            </div>
                            {hotel.starRating > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-950 font-bold text-[10px] shrink-0">
                                {hotel.starRating}-Star Hotel
                              </span>
                            )}
                          </div>

                          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                            <span className="text-xs font-bold text-slate-900 block">{hotel.roomType}</span>
                          </div>
                        </div>

                        <div className="border-t border-slate-200/80 pt-3 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-xs text-slate-400 block">Nightly Rate</span>
                            <span className="text-lg font-black font-mono text-slate-900">
                              {hotel.nightlyRatePaise > 0 ? formatPaise(hotel.nightlyRatePaise) : "Check live rate"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={hotel.bookingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => {
                                toast.info(`Checking live room rates for ${hotel.hotelName}...`);
                              }}
                              className="h-10 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-slate-950 font-black text-xs shadow-md shadow-orange-500/20 inline-flex items-center gap-1.5 transition"
                            >
                              <span>Check Live Rates</span>
                              <ExternalLink className="size-3.5" />
                            </a>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setQuotationModal({
                                  isOpen: true,
                                  category: "HOLIDAY",
                                  destination: `${hotel.hotelName}, ${hotel.city}`,
                                });
                              }}
                              className="h-10 px-3 rounded-xl border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold"
                            >
                              Request Quote
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-orange-50/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-black text-slate-900">
                        {hotelsSearched
                          ? `No live API hotel offers returned for ${hotelCity || "destination"}.`
                          : "Search live stays above or open partner checkout for instant room inventory."}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        Compare verified room tariffs directly on Booking.com or request a concierge hotel booking quote.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <a
                        href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotelCity || "Goa")}&checkin=${encodeURIComponent(hotelCheckIn)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <span>Search Booking.com</span>
                        <ExternalLink className="size-3.5" />
                      </a>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setQuotationModal({
                            isOpen: true,
                            category: "HOLIDAY",
                            destination: hotelCity || "India",
                          });
                        }}
                        className="h-10 px-3 rounded-xl border-slate-200 hover:bg-white text-slate-800 text-xs font-bold"
                      >
                        Request Hotel Quote
                      </Button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* =====================================================================
              CATEGORY 4: BUSES & SLEEPERS
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
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer"
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

              {/* Action Buttons: Live Bus API Search + redBus Handoff + Save */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="button"
                  disabled={busesLoading}
                  onClick={handleSearchBuses}
                  className="h-12 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm flex items-center justify-center gap-2"
                >
                  {busesLoading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                  <span>{busesLoading ? "Searching Buses..." : "Search Live Buses"}</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    const cleanSource = busFrom.replace(/\(.*\)/, "").trim().toLowerCase();
                    const cleanDest = busTo.replace(/\(.*\)/, "").trim().toLowerCase();
                    const redBusUrl = `https://www.redbus.in/bus-tickets/${encodeURIComponent(String(cleanSource ?? ""))}-to-${encodeURIComponent(String(cleanDest ?? ""))}?onward=${busDate}`;
                    toast.success(`Opening redBus tickets for ${busFrom} to ${busTo}...`);
                    window.open(redBusUrl, "_blank", "noopener,noreferrer");
                  }}
                  className="flex-1 h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm shadow-md shadow-orange-600/20 flex items-center justify-center gap-2"
                >
                  <Bus className="size-4" />
                  <span>Search on redBus</span>
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
                      routeOrLocation: `${busFrom} to ${busTo}`,
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

              {busesSearched && (
                <div className="space-y-3 pt-2">
                  {busOffers.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {busOffers.map((bus) => (
                        <div
                          key={bus.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <h4 className="text-sm font-black text-slate-900">{bus.operatorName}</h4>
                            <p className="text-xs text-slate-500">
                              {bus.busType} · {bus.departureTime} to {bus.arrivalTime}
                              {bus.availableSeats > 0 ? ` · ${bus.availableSeats} seats left` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-black font-mono text-slate-900">
                              {bus.farePaise > 0 ? formatPaise(bus.farePaise) : "Check on redBus"}
                            </span>
                            <a
                              href={bus.bookingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-9 px-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs inline-flex items-center gap-1"
                            >
                              <span>Book Seat</span>
                              <ExternalLink className="size-3.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
                      No direct RedBus B2B operator inventory feed active. Use <strong>Search on redBus</strong> above for live seat selection.
                    </p>
                  )}
                </div>
              )}

            </div>
          )}

          {/* =====================================================================
              CATEGORY 5: CABS & AIRPORT
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
                  PostgreSQL Live Cab Dispatch · UPI &amp; Cash
                </span>
              </div>

              <CabBookingEngine initialPickup={cabPickup} initialDrop={cabDrop} />
            </div>
          )}

          {/* =====================================================================
              CATEGORY 7: HOLIDAY TOURS & VACATION PACKAGES
             ===================================================================== */}
          {activeTab === "pilgrimage" && (
            <div className="space-y-6">

              {/* Holiday Tours & Travel Packages Header */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 text-white border border-slate-800 shadow-lg">
                <div className="relative z-10 max-w-2xl space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] font-black uppercase tracking-wider text-slate-300">
                    <Compass className="size-3.5 text-orange-400" /> Holiday Tours
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Holiday Tours
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    National, international, and religious tour packages.
                  </p>
                </div>

                {/* Sub-Category Navigation Bar */}
                <div className="relative z-10 mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setToursSubCategory("holidays")}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border",
                      toursSubCategory === "holidays"
                        ? "bg-orange-400 text-slate-950 border-orange-300 shadow-md scale-102"
                        : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                    )}
                  >
                    <Globe className="size-3.5" />
                    <span>National &amp; International</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setToursSubCategory("pilgrimage")}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border",
                      toursSubCategory === "pilgrimage"
                        ? "bg-orange-400 text-slate-950 border-orange-300 shadow-md scale-102"
                        : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                    )}
                  >
                    <Compass className="size-3.5" />
                    <span>Religious</span>
                  </button>
                </div>
              </div>

              {/* ─── SUB-VIEW 1: NATIONAL & INTERNATIONAL TOURS (DEFAULT) ─── */}
              {toursSubCategory === "holidays" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200">
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Globe className="size-5 text-sky-600" />
                        <span>National &amp; International Tours</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Domestic and international holiday itineraries arranged via direct concierge quotation.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setQuotationModal({
                          isOpen: true,
                          category: "HOLIDAY",
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-orange-300 text-xs font-bold transition active:scale-95 shadow-sm cursor-pointer shrink-0"
                    >
                      <Compass className="size-3.5 text-orange-400" />
                      <span>+ Customize My Trip</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      {
                        id: "pkg-dubai-5d",
                        title: "Dubai 5D/4N Luxury Oasis Tour",
                        destination: "Dubai & Abu Dhabi (UAE)",
                        duration: "4 Nights / 5 Days",
                        category: "International Leisure",
                        badgeColor: "bg-sky-600",
                        image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&auto=format&fit=crop&q=80",
                        inclusions: [
                          "Return Flights via Emirates / IndiGo",
                          "5-Star Marina Hotel with Daily Breakfast",
                          "Desert Safari with Dune Bashing & BBQ",
                          "Burj Khalifa 124th Floor Observation Deck",
                        ],
                        publishedMrp: 5900000,
                        orderkingPrice: 4800000,
                        departureCity: "All Major Indian Airports",
                      },
                      {
                        id: "pkg-bangkok-5d",
                        title: "Bangkok & Pattaya Tropical Escape",
                        destination: "Bangkok & Pattaya (Thailand)",
                        duration: "4 Nights / 5 Days",
                        category: "International Leisure",
                        badgeColor: "bg-emerald-600",
                        image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&auto=format&fit=crop&q=80",
                        inclusions: [
                          "Return Flights to Bangkok (BKK)",
                          "4-Star Beachfront Hotel with Breakfast",
                          "Coral Island Speedboat Tour & Lunch",
                          "Chaophraya Princess River Dinner Cruise",
                        ],
                        publishedMrp: 4600000,
                        orderkingPrice: 3850000,
                        departureCity: "Delhi / Kolkata / Mumbai / Bengaluru",
                      },
                      {
                        id: "pkg-swiss-6d",
                        title: "Switzerland & Alps Alpine Dream",
                        destination: "Zurich, Lucerne & Interlaken",
                        duration: "5 Nights / 6 Days",
                        category: "Europe Luxury",
                        badgeColor: "bg-blue-600",
                        image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=600&auto=format&fit=crop&q=80",
                        inclusions: [
                          "Return Flights via Swiss / Lufthansa",
                          "Swiss Travel Pass (Trains & Mountain Transit)",
                          "Mount Titlis Glacier Excursion with Rotair",
                          "Lake Lucerne Cruise & 4-Star Scenic Stay",
                        ],
                        publishedMrp: 18500000,
                        orderkingPrice: 14500000,
                        departureCity: "Delhi / Mumbai / Bengaluru",
                      },
                      {
                        id: "pkg-bali-6d",
                        title: "Bali Island Paradise & Villa Retreat",
                        destination: "Seminyak & Ubud (Bali)",
                        duration: "5 Nights / 6 Days",
                        category: "Island Getaway",
                        badgeColor: "bg-teal-600",
                        image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&auto=format&fit=crop&q=80",
                        inclusions: [
                          "Return Flights to Denpasar (DPS)",
                          "Private Pool Villa in Ubud + Resort Stay",
                          "Nusa Penida Island Speedboat Day Tour",
                          "Kintamani Volcano & Traditional Spa Session",
                        ],
                        publishedMrp: 6800000,
                        orderkingPrice: 5400000,
                        departureCity: "Delhi / Mumbai / Kolkata / Chennai",
                      },
                      {
                        id: "pkg-kashmir-6d",
                        title: "Kashmir Valley Paradise (Srinagar & Gulmarg)",
                        destination: "Srinagar, Gulmarg & Pahalgam",
                        duration: "5 Nights / 6 Days",
                        category: "Mountain Escape",
                        badgeColor: "bg-indigo-600",
                        image: "https://images.unsplash.com/photo-1566837945700-30057527ade0?w=600&auto=format&fit=crop&q=80",
                        inclusions: [
                          "Return Flights to Srinagar (SXR)",
                          "Luxury Dal Lake Houseboat Stay",
                          "Gulmarg Gondola Phase 1 & 2 Passes",
                          "Private Chauffeur AC Vehicle",
                        ],
                        publishedMrp: 3400000,
                        orderkingPrice: 2650000,
                        departureCity: "All Major Indian Airports",
                      },
                      {
                        id: "pkg-goa-4d",
                        title: "Goa Beachfront & Sun Splash Luxury Resort",
                        destination: "North & South Goa",
                        duration: "3 Nights / 4 Days",
                        category: "Coastal Leisure",
                        badgeColor: "bg-orange-600",
                        image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&auto=format&fit=crop&q=80",
                        inclusions: [
                          "Return Flights to Goa (GOI / GOX)",
                          "4-Star Candolim Beachfront Resort",
                          "Sunset Mandovi River Cruise with Dinner",
                          "Private Airport Transfers Included",
                        ],
                        publishedMrp: 2100000,
                        orderkingPrice: 1450000,
                        departureCity: "All Major Indian Airports",
                      },
                      {
                        id: "pkg-shillong-meghalaya-4d",
                        title: "Shillong & Meghalaya Northeast Escapes",
                        destination: "Guwahati, Shillong & Cherrapunji",
                        duration: "3 Nights / 4 Days",
                        category: "Northeast Flagship",
                        badgeColor: "bg-violet-600",
                        image: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=600&auto=format&fit=crop&q=80",
                        inclusions: [
                          "Private Chauffeur Pickup from GAU / Silchar",
                          "Umiam Lake & Nohkalikai Waterfalls Sightseeing",
                          "Dawki Crystal Clear Umngot River Boat Ride",
                          "Eco-Resort Stay in Shillong Pine Woods",
                        ],
                        publishedMrp: 2200000,
                        orderkingPrice: 1650000,
                        departureCity: "Assam / Northeast / Kolkata",
                      },
                      {
                        id: "pkg-kerala-5d",
                        title: "Kerala Backwaters & Munnar Hills Luxury Tour",
                        destination: "Cochin, Munnar & Alleppey",
                        duration: "4 Nights / 5 Days",
                        category: "Nature & Backwaters",
                        badgeColor: "bg-emerald-700",
                        image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&auto=format&fit=crop&q=80",
                        inclusions: [
                          "Return Flights to Kochi (COK)",
                          "Private Alleppey Houseboat with All Meals",
                          "Tea Estate & Eravikulam National Park",
                          "Private AC Vehicle for Complete Circuit",
                        ],
                        publishedMrp: 2900000,
                        orderkingPrice: 2200000,
                        departureCity: "All Major Indian Airports",
                      },
                      {
                        id: "pkg-kaziranga-4d",
                        title: "Kaziranga Wildlife Safari & Tea Estate",
                        destination: "Kaziranga & Jorhat (Assam)",
                        duration: "3 Nights / 4 Days",
                        category: "Wildlife & Heritage",
                        badgeColor: "bg-orange-700",
                        image: "https://images.unsplash.com/photo-1575550959106-5a7defe28b56?w=600&auto=format&fit=crop&q=80",
                        inclusions: [
                          "Private Jeep Safari in Central & Western Ranges",
                          "Heritage Tea Planter's Bungalow Stay",
                          "One-Horned Rhino & Wildlife Views",
                          "Chauffeur Transfers from Guwahati / Jorhat",
                        ],
                        publishedMrp: 2500000,
                        orderkingPrice: 1850000,
                        departureCity: "Assam / Northeast / Kolkata",
                      },
                    ].map((pkg) => (
                      <div
                        key={pkg.id}
                        className="group flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-4 shadow-xs hover:shadow-lg transition-all"
                      >
                        <div className="space-y-3">
                          <div className="relative h-40 rounded-2xl overflow-hidden shadow-inner">
                            <img
                              src={pkg.image}
                              alt={pkg.title}
                              className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                            <div className="absolute top-2 left-2 flex items-center gap-1">
                              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase text-white ${pkg.badgeColor}`}>
                                {pkg.category}
                              </span>
                              <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-slate-900/80 text-white">
                                {pkg.duration}
                              </span>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 leading-snug group-hover:text-orange-700 transition-colors">
                              {pkg.title}
                            </h4>
                            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="size-3 text-orange-500 shrink-0" />
                              {pkg.destination}
                            </span>
                          </div>
                          <ul className="space-y-1 text-[11px] text-slate-600 bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                            {pkg.inclusions.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <CheckCircle2 className="size-3 text-emerald-500 shrink-0 mt-0.5" />
                                <span className="truncate">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
                          <div className="flex items-baseline justify-between">
                            <div>
                              <span className="text-xs font-black text-slate-700">
                                Custom Quotation · Concierge Pricing
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500">
                              {pkg.departureCity}
                            </span>
                          </div>
                          <Button
                            type="button"
                            onClick={() => {
                              setQuotationModal({
                                isOpen: true,
                                category: "HOLIDAY",
                                destination: pkg.destination,
                              });
                            }}
                            className="w-full h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition active:scale-98"
                          >
                            Request Package Quote
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ─── SUB-VIEW 2: RELIGIOUS TOURS (FILTERED BY RELIGION) ─── */}
              {toursSubCategory === "pilgrimage" && (
                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6 text-white shadow-lg space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                          <Compass className="size-5 text-orange-400" />
                          <span>Religious Tours</span>
                        </h3>
                        <p className="text-xs text-slate-400 max-w-2xl">
                          Select your religion to show relevant tour itineraries.
                        </p>
                      </div>

                      {spiritualFaithSelection && (
                        <button
                          type="button"
                          onClick={() => {
                            setSpiritualFaithSelection(null);
                            if (typeof window !== "undefined") {
                              localStorage.removeItem("orderking_faith_tradition");
                            }
                            toast.info("Religion selection cleared.");
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition active:scale-95 shrink-0 cursor-pointer"
                        >
                          <Compass className="size-3 text-orange-300" />
                          <span>Change Religion</span>
                        </button>
                      )}
                    </div>

                    {/* Neutral Religion Selection Gate: Displayed when no religion is selected */}
                    {!spiritualFaithSelection && (
                      <div className="pt-2">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2.5">
                          Select Religion:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            {
                              id: "ISLAMIC",
                              label: "Muslim",
                              sub: "Umrah, Ziyarat & Holy Sites",
                              color: "from-emerald-950/80 to-emerald-900/60 border-emerald-500/40 hover:border-emerald-400 text-emerald-300",
                            },
                            {
                              id: "SANATAN",
                              label: "Hindu",
                              sub: "Kashi, Ayodhya, Kamakhya & Char Dham",
                              color: "from-orange-950/80 to-orange-900/60 border-orange-500/40 hover:border-orange-400 text-orange-300",
                            },
                            {
                              id: "SIKH",
                              label: "Sikh",
                              sub: "Golden Temple & Sri Hemkund",
                              color: "from-blue-950/80 to-indigo-900/60 border-blue-500/40 hover:border-blue-400 text-blue-300",
                            },
                            {
                              id: "CHRISTIAN",
                              label: "Christian",
                              sub: "Old Goa Shrines & Heritage",
                              color: "from-purple-950/80 to-violet-900/60 border-purple-500/40 hover:border-purple-400 text-purple-300",
                            },
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                const faith = item.id as any;
                                setSpiritualFaithSelection(faith);
                                if (typeof window !== "undefined") {
                                  localStorage.setItem("orderking_faith_tradition", faith);
                                }
                                toast.success(`Viewing ${item.label} tour itineraries`);
                              }}
                              className={`p-3.5 rounded-2xl border bg-gradient-to-br ${item.color} text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md flex flex-col justify-between min-h-[92px]`}
                            >
                              <Compass className="size-5" />
                              <div>
                                <span className="text-xs font-black block leading-tight text-white">{item.label}</span>
                                <span className="text-[10px] opacity-75 block mt-0.5">{item.sub}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Filtered Packages */}
                  {spiritualFaithSelection && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">
                      {[
                        // ISLAMIC PACKAGES
                        {
                          id: "pkg-umrah-budget-15d",
                          title: "Umrah 15-Day Economy Saver Pilgrimage",
                          destination: "Makkah & Madinah (Saudi Arabia)",
                          duration: "14 Nights / 15 Days",
                          category: "Islamic Pilgrimage",
                          faith: "ISLAMIC",
                          badgeColor: "bg-emerald-700",
                          image: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=600&auto=format&fit=crop&q=80",
                          inclusions: [
                            "Return Flights: Direct CCU / GAU / DEL to JED",
                            "7 Nights in Makkah (Walking Distance to Haram)",
                            "7 Nights in Madinah (Near Masjid an-Nabawi)",
                            "Umrah Visa & Comprehensive Medical Insurance",
                            "Dedicated AC Bus Ziyarat & Multilingual Guide",
                          ],
                          publishedMrp: 9200000,
                          orderkingPrice: 7850000,
                          departureCity: "Guwahati / Kolkata / Delhi",
                        },
                        {
                          id: "pkg-umrah-15d",
                          title: "Umrah 15-Day Makkah Clock Tower 5-Star Journey",
                          destination: "Makkah & Madinah (Saudi Arabia)",
                          duration: "14 Nights / 15 Days",
                          category: "Islamic Pilgrimage",
                          faith: "ISLAMIC",
                          badgeColor: "bg-emerald-600",
                          image: "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=600&auto=format&fit=crop&q=80",
                          inclusions: [
                            "Direct Flights: CCU / GAU / DEL to JED / MED",
                            "5 Nights in Makkah (5-Star Clock Tower Haram Facing)",
                            "5 Nights in Madinah (Near Prophet's Mosque)",
                            "Rawdah Permit & E-Visa VIP Processing",
                            "Private Chauffeur AC Coach Ziyarat & Full Board Buffet",
                          ],
                          publishedMrp: 13500000,
                          orderkingPrice: 11800000,
                          departureCity: "Guwahati / Kolkata / Delhi",
                        },

                        // SANATAN HINDU PACKAGES
                        {
                          id: "pkg-kashi-ayodhya-4d",
                          title: "Sacred Kashi Vishwanath & Ayodhya Ram Mandir VIP Express",
                          destination: "Varanasi, Ayodhya & Prayagraj",
                          duration: "3 Nights / 4 Days",
                          category: "Sacred Hindu Circuit",
                          faith: "SANATAN",
                          badgeColor: "bg-orange-600",
                          image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=600&auto=format&fit=crop&q=80",
                          inclusions: [
                            "Express Vande Bharat / Rajdhani Rail Berths Included",
                            "Ram Janmabhoomi VIP Darshan Pass & Prasad",
                            "Kashi Vishwanath Corridor VIP Aarti Darshan",
                            "Private Ganga Aarti Boat Ride at Dashashwamedh Ghat",
                            "Heritage Haveli Stay with Pure Satvik Meals",
                          ],
                          publishedMrp: 2400000,
                          orderkingPrice: 1850000,
                          departureCity: "Delhi / Patna / Guwahati",
                        },
                        {
                          id: "pkg-kamakhya-sacred",
                          title: "Maa Kamakhya Devi Temple VIP Darshan & Brahmaputra Yatra",
                          destination: "Guwahati & Nilachal Hills (Assam)",
                          duration: "2 Nights / 3 Days",
                          category: "Sacred Hindu Circuit",
                          faith: "SANATAN",
                          badgeColor: "bg-orange-600",
                          image: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=600&auto=format&fit=crop&q=80",
                          inclusions: [
                            "VIP Temple Entry Pass for Maa Kamakhya Devi",
                            "Private Chauffeur Pickup from Sribhumi / Silchar / Guwahati",
                            "Sunset Luxury Brahmaputra River Cruise with Aarti",
                            "Satvik Dining & Heritage Riverside Resort",
                          ],
                          publishedMrp: 1800000,
                          orderkingPrice: 1250000,
                          departureCity: "Assam / Northeast / Bengal",
                        },
                        {
                          id: "pkg-chardham-yatra",
                          title: "Maha Char Dham Yatra (Kedarnath, Badrinath, Gangotri)",
                          destination: "Uttarakhand Sacred Himalayan Circuit",
                          duration: "9 Nights / 10 Days",
                          category: "Sacred Hindu Circuit",
                          faith: "SANATAN",
                          badgeColor: "bg-orange-700",
                          image: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=600&auto=format&fit=crop&q=80",
                          inclusions: [
                            "Helicopter Shuttle Assistance for Kedarnath",
                            "VIP Puja Booking & Temple Corridor Passes",
                            "All Road Transfers in Luxury AC Innova",
                            "Pure Satvik Organic Vegetarian Meals",
                          ],
                          publishedMrp: 4200000,
                          orderkingPrice: 3250000,
                          departureCity: "Dehradun / Haridwar / Delhi",
                        },

                        // SIKH PACKAGES
                        {
                          id: "pkg-amritsar-golden",
                          title: "Amritsar Golden Temple & Sri Harmandir Sahib Yatra",
                          destination: "Amritsar, Punjab",
                          duration: "2 Nights / 3 Days",
                          category: "Sikh Gurdwara Circuit",
                          faith: "SIKH",
                          badgeColor: "bg-blue-600",
                          image: "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?w=600&auto=format&fit=crop&q=80",
                          inclusions: [
                            "Heritage Haveli Stay near Golden Temple",
                            "VIP Palki Sahib Seva Assistance",
                            "Wagah Border Retreat Ceremony VIP Passes",
                            "Guru Ka Langar & Sacred Kada Prasad",
                          ],
                          publishedMrp: 1600000,
                          orderkingPrice: 1150000,
                          departureCity: "Delhi / Chandigarh / Guwahati",
                        },

                        // CHRISTIAN PACKAGES
                        {
                          id: "pkg-old-goa-churches",
                          title: "Old Goa Basilica of Bom Jesus & Heritage Shrines",
                          destination: "Velha Goa & Panaji",
                          duration: "3 Nights / 4 Days",
                          category: "Christian Heritage",
                          faith: "CHRISTIAN",
                          badgeColor: "bg-purple-600",
                          image: "https://images.unsplash.com/photo-1548625361-16a73562a981?w=600&auto=format&fit=crop&q=80",
                          inclusions: [
                            "Guided Tour of Basilica of Bom Jesus & Se Cathedral",
                            "Heritage Portuguese Quarter Fontainhas Walk",
                            "St. Francis Xavier Relics Sacred Viewing",
                            "Riverside Boutique Stay with Daily Breakfast",
                          ],
                          publishedMrp: 1850000,
                          orderkingPrice: 1350000,
                          departureCity: "Goa / Mumbai / Bengaluru",
                        },
                      ]
                        .filter((pkg) => pkg.faith === spiritualFaithSelection)
                        .map((pkg) => (
                          <div
                            key={pkg.id}
                            className="group flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs hover:shadow-xl transition-all duration-300"
                          >
                            <div className="space-y-3">
                              <div className="relative h-44 rounded-2xl overflow-hidden shadow-inner">
                                <img
                                  src={pkg.image}
                                  alt={pkg.title}
                                  className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  loading="lazy"
                                />
                                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase text-white shadow-xs ${pkg.badgeColor}`}>
                                    {pkg.category}
                                  </span>
                                  <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-slate-900/80 text-white backdrop-blur-xs">
                                    {pkg.duration}
                                  </span>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-base font-black text-slate-900 leading-snug group-hover:text-orange-700 transition-colors">
                                  {pkg.title}
                                </h4>
                                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-1">
                                  <MapPin className="size-3 text-orange-500 shrink-0" />
                                  {pkg.destination}
                                </span>
                              </div>

                              <ul className="space-y-1 text-xs text-slate-600 bg-slate-50 rounded-2xl p-3 border border-slate-100">
                                {pkg.inclusions.map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5">
                                    <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
                              <div className="flex items-baseline justify-between">
                                <div>
                                  <span className="text-xs font-black text-slate-700">
                                    Custom Quotation · Concierge Pricing
                                  </span>
                                  <span className="text-[10px] text-slate-500 block font-medium">
                                    Departure: {pkg.departureCity}
                                  </span>
                                </div>
                              </div>

                              <Button
                                type="button"
                                onClick={() => {
                                  setQuotationModal({
                                    isOpen: true,
                                    category: spiritualFaithSelection === "ISLAMIC" ? "UMRAH" : "PILGRIMAGE",
                                    destination: pkg.destination,
                                  });
                                }}
                                className="w-full h-11 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-900 text-white font-black text-xs shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
                              >
                                <Crown className="size-4 text-orange-200" />
                                <span>Request Tour Quote</span>
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

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
                      className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${tripFilter === filterType
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
                      className="w-full bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer"
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
                      placeholder="e.g. DEL to BOM"
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
                  Save Reference to My Trips
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
                            <span className="text-xs font-bold text-slate-500 inline-flex items-center gap-1">
                              <Calendar className="size-3.5 text-slate-400" /> {trip.travelDate}
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
                            Live Status
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
                    {route.fromCity} ({route.fromCode}) to {route.toCity} ({route.toCode})
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Direct official portal
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
                      toast.success(`Connecting to official ${handoff.portalName} for ${route.fromCity} to ${route.toCity}...`);
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
                        toast.success(`Loaded ${route.fromCity} to ${route.toCity} sector.`);
                      } else if (route.type === "train") {
                        setActiveTab("trains");
                        setTrainFrom(`${route.fromCity} (${route.fromCode})`);
                        setTrainTo(`${route.toCity} (${route.toCode})`);
                        toast.success(`Loaded ${route.fromCity} to ${route.toCity} rail.`);
                      } else {
                        setActiveTab("buses");
                        setBusFrom(route.fromCity);
                        setBusTo(route.toCity);
                        toast.success(`Loaded ${route.fromCity} to ${route.toCity} bus.`);
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

        {quotationModal?.isOpen && (
          <TravelQuotationModal
            isOpen={quotationModal.isOpen}
            initialCategory={quotationModal.category}
            initialDestination={quotationModal.destination}
            initialOrigin={quotationModal.origin}
            onClose={() => setQuotationModal(null)}
          />
        )}

      </div>
    </CustomerShell>
  );
}
