import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { CustomerShell } from "@/components/market/shell";
import {
  Plane,
  Train,
  Bus,
  Building2,
  Car,
  Compass,
  MapPin,
  Calendar,
  Search,
  ExternalLink,
  ChevronRight,
  ArrowLeftRight,
  ShieldCheck,
  Clock,
  Ticket,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TravelSkeleton } from "@/components/skeletons/travel-skeleton";
import { AppErrorComponent } from "@/lib/error-component";
import { AirportAutoSuggest, StationAutoSuggest } from "@/components/fintech/travel-autosuggest";
import { TravelpayoutsWhiteLabel } from "@/components/fintech/travelpayouts-white-label";
import { buildOfficialAirlineDeepLink, extractAirportCode } from "@/lib/travel/airline-deep-links";

export const Route = createFileRoute("/travel/")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: (search.tab as string) || undefined,
  }),
  component: TravelPage,
  pendingComponent: TravelSkeleton,
  errorComponent: AppErrorComponent,
});

export type TravelTab = "flights" | "trains" | "hotels" | "buses" | "cabs" | "trips";

export interface SavedTripReference {
  id: string;
  bookingType: "flight" | "train" | "bus" | "hotel" | "cab";
  providerName: string;
  bookingRef: string;
  travelDate: string;
  routeOrLocation: string;
  notes?: string;
  createdAt: string;
}

const SAVED_TRIPS_STORAGE_KEY = "orderking_saved_trips_v1";

const OFFICIAL_AIRLINES = [
  { code: "6E", name: "IndiGo", portal: "goindigo.in", logoBg: "bg-blue-900" },
  { code: "AI", name: "Air India", portal: "airindia.com", logoBg: "bg-red-800" },
  { code: "QP", name: "Akasa Air", portal: "akasaair.com", logoBg: "bg-orange-600" },
  { code: "SG", name: "SpiceJet", portal: "spicejet.com", logoBg: "bg-red-600" },
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
  }, [searchTab, sectionHash]);

  // Flight search state
  const [flightFrom, setFlightFrom] = useState("New Delhi (DEL)");
  const [flightTo, setFlightTo] = useState("Mumbai (BOM)");
  const [flightDate, setFlightDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [flightPassengers, setFlightPassengers] = useState(1);
  const [flightCabin, setFlightCabin] = useState<"Economy" | "Premium Economy" | "Business">("Economy");

  // Train search state
  const [trainFrom, setTrainFrom] = useState("New Delhi (NDLS)");
  const [trainTo, setTrainTo] = useState("Mumbai Central (MMCT)");
  const [trainDate, setTrainDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [trainQuota, setTrainQuota] = useState("GENERAL (GN)");
  const [trainClass, setTrainClass] = useState("All Classes");

  // Hotel search state
  const [hotelCity, setHotelCity] = useState("Goa, India");
  const [hotelCheckIn, setHotelCheckIn] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [hotelCheckOut, setHotelCheckOut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  });
  const [hotelGuests, setHotelGuests] = useState("2 Guests · 1 Room");

  // Bus search state
  const [busFrom, setBusFrom] = useState("Guwahati");
  const [busTo, setBusTo] = useState("Silchar");
  const [busDate, setBusDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });

  // Saved trips
  const [savedTrips, setSavedTrips] = useState<SavedTripReference[]>([]);
  const [showAddTripModal, setShowAddTripModal] = useState(false);
  const [newTripType, setNewTripType] = useState<SavedTripReference["bookingType"]>("flight");
  const [newTripProvider, setNewTripProvider] = useState("");
  const [newTripRef, setNewTripRef] = useState("");
  const [newTripDate, setNewTripDate] = useState(flightDate);
  const [newTripRoute, setNewTripRoute] = useState("");
  const [newTripNotes, setNewTripNotes] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SAVED_TRIPS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSavedTrips(parsed);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const persistTrips = (trips: SavedTripReference[]) => {
    setSavedTrips(trips);
    try {
      window.localStorage.setItem(SAVED_TRIPS_STORAGE_KEY, JSON.stringify(trips));
    } catch {
      // Ignore quota errors
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

  const handleOpenIrctc = () => {
    const fromCode = trainFrom.match(/\(([A-Z0-9]+)\)/)?.[1] || trainFrom.trim();
    const toCode = trainTo.match(/\(([A-Z0-9]+)\)/)?.[1] || trainTo.trim();
    const url = `https://www.irctc.co.in/nget/train-search?from=${encodeURIComponent(fromCode)}&to=${encodeURIComponent(toCode)}&date=${trainDate}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("Opening official IRCTC portal for live train booking");
  };

  const handleOpenRedBus = () => {
    const fromClean = busFrom.trim().toLowerCase().replace(/\s+/g, "-");
    const toClean = busTo.trim().toLowerCase().replace(/\s+/g, "-");
    const url = `https://www.redbus.in/bus-tickets/${fromClean}-to-${toClean}?date=${busDate}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("Opening redBus portal for live intercity bus tickets");
  };

  const handleOpenHotels = () => {
    const cleanCity = hotelCity.replace(/,.*$/, "").trim();
    const url = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(cleanCity)}&checkin=${hotelCheckIn}&checkout=${hotelCheckOut}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success(`Searching live accommodations in ${cleanCity}`);
  };

  const handleSaveTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTripProvider.trim() || !newTripRef.trim()) {
      toast.error("Please enter provider name and PNR/Booking ID");
      return;
    }
    const trip: SavedTripReference = {
      id: `trip-${Date.now()}`,
      bookingType: newTripType,
      providerName: newTripProvider.trim(),
      bookingRef: newTripRef.trim().toUpperCase(),
      travelDate: newTripDate,
      routeOrLocation: newTripRoute.trim() || "India",
      notes: newTripNotes.trim(),
      createdAt: new Date().toISOString(),
    };
    persistTrips([trip, ...savedTrips]);
    setNewTripProvider("");
    setNewTripRef("");
    setNewTripRoute("");
    setNewTripNotes("");
    setShowAddTripModal(false);
    toast.success("Trip reference saved to your local device");
  };

  const handleDeleteTrip = (id: string) => {
    persistTrips(savedTrips.filter((t) => t.id !== id));
    toast.success("Trip removed");
  };

  // Resolve airline deep links for selected route
  const airlineLinks = useMemo(() => {
    return OFFICIAL_AIRLINES.map((carrier) => {
      const link = buildOfficialAirlineDeepLink({
        carrierCode: carrier.code,
        from: flightFrom,
        to: flightTo,
        departureDate: flightDate,
        passengers: flightPassengers,
        cabinClass: flightCabin,
      });
      return { ...carrier, link };
    });
  }, [flightFrom, flightTo, flightDate, flightPassengers, flightCabin]);

  return (
    <CustomerShell>
      <div className="min-h-screen bg-slate-100 text-slate-900 pb-24">
        {/* Header Banner */}
        <div className="bg-slate-900 !text-white border-b border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2 !text-white">
              <Plane className="size-6 text-sky-400 shrink-0" />
              <span className="!text-white">Travel &amp; Ticketing</span>
            </h1>
            <p className="text-xs sm:text-sm !text-slate-200 mt-1">
              Search live domestic and international flights, IRCTC train schedules, verified hotels, and buses.
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
          {/* Navigation Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {[
              { id: "flights" as TravelTab, label: "Flights", icon: Plane, color: "text-sky-500", desc: "Domestic & Global" },
              { id: "trains" as TravelTab, label: "Trains", icon: Train, color: "text-indigo-500", desc: "IRCTC Official" },
              { id: "hotels" as TravelTab, label: "Hotels", icon: Building2, color: "text-amber-500", desc: "Live Bookings" },
              { id: "buses" as TravelTab, label: "Buses", icon: Bus, color: "text-orange-500", desc: "Intercity Routes" },
              { id: "cabs" as TravelTab, label: "Cabs", icon: Car, color: "text-emerald-500", desc: "Uber & Ola" },
              { id: "trips" as TravelTab, label: "My Trips", icon: Ticket, color: "text-purple-500", desc: `${savedTrips.length} Saved` },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex flex-col justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer min-h-[88px]",
                    isActive
                      ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-800"
                      : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Icon className={cn("size-5", isActive ? "text-white" : tab.color)} />
                    <ChevronRight className={cn("size-4 transition", isActive ? "text-white" : "text-slate-400")} />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-black block">{tab.label}</span>
                    <span className={cn("text-[10px] block mt-0.5", isActive ? "text-slate-300" : "text-slate-500")}>
                      {tab.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* =====================================================================
              TAB 1: FLIGHTS
             ===================================================================== */}
          {activeTab === "flights" && (
            <div className="space-y-6">
              {/* Flight Search Controls */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 focus-within:border-sky-500 focus-within:bg-white transition relative">
                    <label className="text-[10px] font-bold text-slate-500 flex items-center justify-between uppercase tracking-wider mb-1">
                      <span className="flex items-center gap-1"><MapPin className="size-3 text-sky-600" /> From City / Code</span>
                      <button
                        type="button"
                        onClick={handleSwapFlightRoute}
                        title="Swap Route"
                        className="size-5 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-sky-600 transition cursor-pointer"
                      >
                        <ArrowLeftRight className="size-3" />
                      </button>
                    </label>
                    <AirportAutoSuggest
                      value={flightFrom}
                      onChange={setFlightFrom}
                      theme="light"
                      placeholder="Origin airport or city..."
                      ariaLabel="Origin Airport"
                    />
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 focus-within:border-sky-500 focus-within:bg-white transition">
                    <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                      <MapPin className="size-3 text-sky-600" /> To Destination / Code
                    </label>
                    <AirportAutoSuggest
                      value={flightTo}
                      onChange={setFlightTo}
                      theme="light"
                      placeholder="Destination airport or city..."
                      ariaLabel="Destination Airport"
                    />
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 focus-within:border-sky-500 focus-within:bg-white transition">
                    <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                      <Calendar className="size-3 text-sky-600" /> Departure Date
                    </label>
                    <input
                      type="date"
                      value={flightDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setFlightDate(e.target.value)}
                      className="w-full text-xs font-bold text-slate-900 bg-transparent outline-none cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 focus-within:border-sky-500 focus-within:bg-white transition">
                    <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                      <Users className="size-3 text-sky-600" /> Passengers
                    </label>
                    <select
                      value={flightPassengers}
                      onChange={(e) => setFlightPassengers(Number(e.target.value))}
                      className="w-full text-xs font-bold text-slate-900 bg-transparent outline-none cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>{n} {n === 1 ? "Passenger" : "Passengers"}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 focus-within:border-sky-500 focus-within:bg-white transition">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                      Cabin Class
                    </label>
                    <select
                      value={flightCabin}
                      onChange={(e) => setFlightCabin(e.target.value as any)}
                      className="w-full text-xs font-bold text-slate-900 bg-transparent outline-none cursor-pointer"
                    >
                      <option value="Economy">Economy</option>
                      <option value="Premium Economy">Premium Economy</option>
                      <option value="Business">Business</option>
                    </select>
                  </div>
                </div>

                {/* Direct Official Carrier Deep Links */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Book Directly on Official Airlines:
                  </span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {airlineLinks.map((item) => (
                      <a
                        key={item.code}
                        href={item.link.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition text-slate-900 no-underline group"
                      >
                        <div className="flex items-center gap-2">
                          <span className={cn("size-6 rounded-md text-[10px] font-black text-white flex items-center justify-center", item.logoBg)}>
                            {item.code}
                          </span>
                          <span className="text-xs font-bold">{item.name}</span>
                        </div>
                        <ExternalLink className="size-3.5 text-slate-400 group-hover:text-slate-900 transition" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Embedded Live Travelpayouts Meta-Search Engine */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Plane className="size-4 text-sky-600" />
                  <span>Live Airfare Comparison</span>
                </h3>
                <TravelpayoutsWhiteLabel />
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 2: TRAINS (OFFICIAL IRCTC PORTAL INTEGRATION)
             ===================================================================== */}
          {activeTab === "trains" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-5">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Train className="size-5 text-indigo-600" />
                  <span>Indian Railways (IRCTC) Schedules &amp; Booking</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Indian Railways reservations and e-tickets are issued directly through the official IRCTC portal.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition relative">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center justify-between uppercase tracking-wider mb-1">
                    <span className="flex items-center gap-1"><MapPin className="size-3 text-indigo-600" /> From Station</span>
                    <button
                      type="button"
                      onClick={handleSwapTrainRoute}
                      title="Swap Stations"
                      className="size-5 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                    >
                      <ArrowLeftRight className="size-3" />
                    </button>
                  </label>
                  <StationAutoSuggest
                    value={trainFrom}
                    onChange={setTrainFrom}
                    theme="light"
                    placeholder="Origin railway station..."
                    ariaLabel="Origin Station"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <MapPin className="size-3 text-indigo-600" /> To Station
                  </label>
                  <StationAutoSuggest
                    value={trainTo}
                    onChange={setTrainTo}
                    theme="light"
                    placeholder="Destination railway station..."
                    ariaLabel="Destination Station"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Calendar className="size-3 text-indigo-600" /> Journey Date
                  </label>
                  <input
                    type="date"
                    value={trainDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setTrainDate(e.target.value)}
                    className="w-full text-xs font-bold text-slate-900 bg-transparent outline-none cursor-pointer"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                    Quota
                  </label>
                  <select
                    value={trainQuota}
                    onChange={(e) => setTrainQuota(e.target.value)}
                    className="w-full text-xs font-bold text-slate-900 bg-transparent outline-none cursor-pointer"
                  >
                    <option value="GENERAL (GN)">General (GN)</option>
                    <option value="TATKAL (TQ)">Tatkal (TQ)</option>
                    <option value="LADIES (LD)">Ladies (LD)</option>
                    <option value="SENIOR CITIZEN (SS)">Senior Citizen (SS)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Button
                  type="button"
                  onClick={handleOpenIrctc}
                  className="w-full sm:w-auto h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Train className="size-4" />
                  <span>Search &amp; Book on Official IRCTC</span>
                  <ExternalLink className="size-3.5" />
                </Button>

                <a
                  href="https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto h-11 px-5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition no-underline"
                >
                  <Search className="size-3.5 text-slate-500" />
                  <span>Official PNR Status Enquiry</span>
                  <ExternalLink className="size-3 text-slate-400" />
                </a>
              </div>

              {/* Regulatory Notice */}
              <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="size-4 text-indigo-600" /> Official Indian Railways Guidelines
                </div>
                <p className="text-[11px] text-indigo-800/80 leading-relaxed">
                  Indian Railways PRS e-tickets are issued exclusively through authorized IRCTC portals (irctc.co.in) to guarantee authentic reservation charts and valid journey PNRs.
                </p>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 3: HOTELS (LIVE ACCOMMODATION SEARCH)
             ===================================================================== */}
          {activeTab === "hotels" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-5">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Building2 className="size-5 text-amber-600" />
                  <span>Hotels &amp; Accommodations</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Search live availability and verified rates across resorts, luxury properties, and business hotels worldwide.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 focus-within:border-amber-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <MapPin className="size-3 text-amber-600" /> Destination City / Area
                  </label>
                  <input
                    type="text"
                    value={hotelCity}
                    onChange={(e) => setHotelCity(e.target.value)}
                    placeholder="e.g. Goa, Mumbai, Delhi, Jaipur..."
                    className="w-full text-xs font-bold text-slate-900 bg-transparent outline-none"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 focus-within:border-amber-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Calendar className="size-3 text-amber-600" /> Check-in Date
                  </label>
                  <input
                    type="date"
                    value={hotelCheckIn}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setHotelCheckIn(e.target.value)}
                    className="w-full text-xs font-bold text-slate-900 bg-transparent outline-none cursor-pointer"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 focus-within:border-amber-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Calendar className="size-3 text-amber-600" /> Check-out Date
                  </label>
                  <input
                    type="date"
                    value={hotelCheckOut}
                    min={hotelCheckIn}
                    onChange={(e) => setHotelCheckOut(e.target.value)}
                    className="w-full text-xs font-bold text-slate-900 bg-transparent outline-none cursor-pointer"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 focus-within:border-amber-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Users className="size-3 text-amber-600" /> Guests &amp; Rooms
                  </label>
                  <select
                    value={hotelGuests}
                    onChange={(e) => setHotelGuests(e.target.value)}
                    className="w-full text-xs font-bold text-slate-900 bg-transparent outline-none cursor-pointer"
                  >
                    <option value="1 Guest · 1 Room">1 Guest · 1 Room</option>
                    <option value="2 Guests · 1 Room">2 Guests · 1 Room</option>
                    <option value="3 Guests · 1 Room">3 Guests · 1 Room</option>
                    <option value="4 Guests · 2 Rooms">4 Guests · 2 Rooms</option>
                  </select>
                </div>
              </div>

              <div>
                <Button
                  type="button"
                  onClick={handleOpenHotels}
                  className="w-full sm:w-auto h-11 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Search className="size-4" />
                  <span>Search Verified Hotels in {hotelCity.replace(/,.*$/, "")}</span>
                  <ExternalLink className="size-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 4: BUSES (INTERCITY BUSES VIA REDBUS)
             ===================================================================== */}
          {activeTab === "buses" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-5">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Bus className="size-5 text-orange-500" />
                  <span>Intercity Bus Tickets (redBus)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Compare AC Volvo, sleeper, and state transport buses across major Indian highways.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 focus-within:border-orange-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <MapPin className="size-3 text-orange-500" /> From City
                  </label>
                  <input
                    type="text"
                    value={busFrom}
                    onChange={(e) => setBusFrom(e.target.value)}
                    placeholder="Departure city..."
                    className="w-full text-xs font-bold text-slate-900 bg-transparent outline-none"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 focus-within:border-orange-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <MapPin className="size-3 text-orange-500" /> To Destination
                  </label>
                  <input
                    type="text"
                    value={busTo}
                    onChange={(e) => setBusTo(e.target.value)}
                    placeholder="Arrival city..."
                    className="w-full text-xs font-bold text-slate-900 bg-transparent outline-none"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 focus-within:border-orange-500 focus-within:bg-white transition">
                  <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Calendar className="size-3 text-orange-500" /> Travel Date
                  </label>
                  <input
                    type="date"
                    value={busDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setBusDate(e.target.value)}
                    className="w-full text-xs font-bold text-slate-900 bg-transparent outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <Button
                  type="button"
                  onClick={handleOpenRedBus}
                  className="w-full sm:w-auto h-11 px-6 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Bus className="size-4" />
                  <span>Search Buses on redBus</span>
                  <ExternalLink className="size-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 5: CABS (UBER & OLA OFFICIAL BOOKING)
             ===================================================================== */}
          {activeTab === "cabs" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-5">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Car className="size-5 text-emerald-500" />
                  <span>Airport &amp; City Cabs</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Book direct on-demand airport transfers, city rides, and outstation trips via official partners.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a
                  href="https://m.uber.com/looking"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition text-slate-900 no-underline group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-black text-white text-[10px] font-black">UBER</span>
                      <h4 className="text-sm font-bold">Uber City &amp; Airport Cabs</h4>
                    </div>
                    <p className="text-xs text-slate-500">Fast on-demand pickups, upfront fares, and cashless rides.</p>
                  </div>
                  <ExternalLink className="size-4 text-slate-400 group-hover:text-slate-900 transition" />
                </a>

                <a
                  href="https://book.olacabs.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition text-slate-900 no-underline group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-yellow-400 text-black text-[10px] font-black">OLA</span>
                      <h4 className="text-sm font-bold">Ola City &amp; Outstation</h4>
                    </div>
                    <p className="text-xs text-slate-500">Micro, Mini, Prime, and Outstation cab rentals across India.</p>
                  </div>
                  <ExternalLink className="size-4 text-slate-400 group-hover:text-slate-900 transition" />
                </a>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 6: MY TRIPS (SAVED PNRs & REFERENCES)
             ===================================================================== */}
          {activeTab === "trips" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <Ticket className="size-5 text-purple-600" />
                    <span>My Saved Trips &amp; PNRs</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Save and track your upcoming flight, train, and bus booking references locally on your device.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setShowAddTripModal(true)}
                  className="h-9 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>Add PNR / Trip</span>
                </Button>
              </div>

              {savedTrips.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl space-y-2">
                  <Ticket className="size-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">No saved bookings yet</p>
                  <p className="text-[11px] text-slate-400">
                    After booking on an official portal (IRCTC, IndiGo, redBus), save your PNR here for easy reference.
                  </p>
                  <Button
                    type="button"
                    onClick={() => setShowAddTripModal(true)}
                    className="mt-2 h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
                  >
                    Add Your First Trip
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedTrips.map((trip) => (
                    <div
                      key={trip.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:shadow-xs transition space-y-2 flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                            {trip.bookingType} · {trip.providerName}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteTrip(trip.id)}
                            className="text-slate-400 hover:text-red-600 transition cursor-pointer p-1"
                            title="Delete Trip"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                        <h4 className="text-sm font-black font-mono text-slate-900 pt-1">
                          PNR / Ref: {trip.bookingRef}
                        </h4>
                        <p className="text-xs text-slate-600 font-medium">{trip.routeOrLocation}</p>
                        <p className="text-[11px] text-slate-400">Date: {trip.travelDate}</p>
                        {trip.notes && (
                          <p className="text-[11px] text-slate-500 italic pt-1">{trip.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Trip Modal */}
              {showAddTripModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
                  <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-black text-slate-900">Save Booking Reference</h3>
                      <button
                        type="button"
                        onClick={() => setShowAddTripModal(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <form onSubmit={handleSaveTrip} className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Booking Type
                        </label>
                        <select
                          value={newTripType}
                          onChange={(e) => setNewTripType(e.target.value as any)}
                          className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-800 bg-white outline-none"
                        >
                          <option value="flight">Flight</option>
                          <option value="train">Train</option>
                          <option value="bus">Bus</option>
                          <option value="hotel">Hotel</option>
                          <option value="cab">Cab</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Provider Name
                        </label>
                        <input
                          type="text"
                          required
                          value={newTripProvider}
                          onChange={(e) => setNewTripProvider(e.target.value)}
                          placeholder="e.g. IRCTC, IndiGo, Air India, redBus..."
                          className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs text-slate-900 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          PNR / Booking ID
                        </label>
                        <input
                          type="text"
                          required
                          value={newTripRef}
                          onChange={(e) => setNewTripRef(e.target.value)}
                          placeholder="e.g. 2451239870 or 6E-ABCDEF"
                          className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-mono font-bold text-slate-900 outline-none uppercase"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Travel Date
                        </label>
                        <input
                          type="date"
                          value={newTripDate}
                          onChange={(e) => setNewTripDate(e.target.value)}
                          className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs text-slate-900 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Route or Location
                        </label>
                        <input
                          type="text"
                          value={newTripRoute}
                          onChange={(e) => setNewTripRoute(e.target.value)}
                          placeholder="e.g. DEL -> BOM or Goa Resort"
                          className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs text-slate-900 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Notes (Optional)
                        </label>
                        <input
                          type="text"
                          value={newTripNotes}
                          onChange={(e) => setNewTripNotes(e.target.value)}
                          placeholder="e.g. Seat 14B, Terminal 3"
                          className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs text-slate-900 outline-none"
                        />
                      </div>

                      <div className="pt-2 flex justify-end gap-2">
                        <Button
                          type="submit"
                          className="w-full h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                        >
                          Save Trip
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </CustomerShell>
  );
}
