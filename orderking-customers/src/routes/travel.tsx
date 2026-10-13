import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CustomerShell } from "@/components/market/shell";
import { FlightBookingEngine } from "@/components/fintech/flight-booking-engine";
import { SovereignTravelConcierge } from "@/components/fintech/sovereign-travel-concierge";
import { TravelCategoryDeck } from "@/components/fintech/travel-category-deck";
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

type TravelTab = "flights" | "trains" | "hotels" | "cabs" | "fastag" | "trips";

interface TravelCategoryConfig {
  id: TravelTab;
  label: string;
  badge: string;
  keywords: string;
  subCategories: readonly string[];
}

export const TRAVEL_CATEGORIES: readonly TravelCategoryConfig[] = [
  {
    id: "flights",
    label: "Flights",
    badge: "Skyscanner",
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
    badge: "IRCTC",
    keywords: "railway stations tickets irctc pnr tatkal coach position vande bharat",
    subCategories: [
      "Search Trains Between Stations",
      "IRCTC Authorised Ticket Handoff",
      "Live PNR Enquiry",
      "Tatkal & Coach Position Guide",
    ],
  },
  {
    id: "hotels",
    label: "Hotels & Stays",
    badge: "Explore",
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
    keywords: "my trips bookings itinerary pnr reference saved flight train hotel",
    subCategories: [
      "Saved Trip Itineraries",
      "PNR & Booking Reference Organizer",
      "Add External Flight/Train/Hotel Reference",
    ],
  },
] as const;

export interface SavedTripReference {
  id: string;
  bookingType: "Flight" | "Train" | "Hotel" | "Cab";
  providerName: string;
  bookingRef: string;
  travelDate: string;
  routeOrLocation: string;
  notes: string;
  createdAt: string;
}

const SAVED_TRIPS_STORAGE_KEY = "orderking_saved_trips_v1";

function buildPartnerUrl(baseUrl: string, extraParams?: Record<string, string>): string {
  const url = new URL(baseUrl);
  if (extraParams) {
    Object.entries(extraParams).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
  }
  // Attribution is descriptive only until a verified provider supplies an authorized partner ID.
  // Do not invent an affiliate identifier or promise commission for a third-party handoff.
  url.searchParams.set("utm_source", "orderking");
  return url.toString();
}

export function TravelPage() {
  const [activeTab, setActiveTab] = useState<TravelTab>("flights");
  const [activeSubCategory, setActiveSubCategory] = useState<Record<TravelTab, string>>({
    flights: "Domestic Flights",
    trains: "Search Trains Between Stations",
    hotels: "Luxury 5-Star & Resorts",
    cabs: "Airport Pickup & Drop",
    fastag: "NETC FASTag Bank Directory",
    trips: "Saved Trip Itineraries",
  });
  const [serviceQuery, setServiceQuery] = useState("");
  const sectionHash = useRouterState({ select: (s) => s.location.hash });

  useEffect(() => {
    const cleanHash = sectionHash.replace(/^#/, "").toLowerCase();
    if (cleanHash === "hotels") setActiveTab("hotels");
    else if (cleanHash === "trips") setActiveTab("trips");
    else if (cleanHash === "flights") setActiveTab("flights");
    else if (cleanHash === "trains") setActiveTab("trains");
    else if (cleanHash === "cabs") setActiveTab("cabs");
    else if (cleanHash === "fastag") setActiveTab("fastag");
  }, [sectionHash]);

  // Flight auxiliary state
  const [airlineCheckInCode, setAirlineCheckInCode] = useState("6E (IndiGo)");
  const [flightPnrInput, setFlightPnrInput] = useState("");
  const [specialFareType, setSpecialFareType] = useState<"Regular" | "Student" | "Armed Forces" | "Senior Citizen">("Regular");

  // Train PNR & Search state
  const [pnr, setPnr] = useState("");
  const [checkingPnr, setCheckingPnr] = useState(false);
  const [trainFrom, setTrainFrom] = useState("New Delhi (NDLS)");
  const [trainTo, setTrainTo] = useState("Mumbai Central (MMCT)");
  const [trainDate, setTrainDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [trainQuota, setTrainQuota] = useState("GENERAL (GN)");

  // Hotel search state
  const [hotelCity, setHotelCity] = useState("Goa, India");
  const [hotelGuests, setHotelGuests] = useState("2 Guests · 1 Room");
  const [hotelCheckIn, setHotelCheckIn] = useState(() => new Date().toISOString().split("T")[0]);

  // Cabs state
  const [cabPickup, setCabPickup] = useState("Terminal 3, IGI Airport (DEL)");
  const [cabDrop, setCabDrop] = useState("Connaught Place, New Delhi");
  const [cabPackageHours, setCabPackageHours] = useState("4 Hrs · 40 km");

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

  const handleOpenTripLiveStatus = (trip: SavedTripReference) => {
    if (trip.bookingType === "Train") {
      const cleanDigits = trip.bookingRef.replace(/\D/g, "");
      const targetUrl = cleanDigits.length === 10
        ? buildPartnerUrl("https://www.confirmtkt.com/pnr-status", { pnr: cleanDigits })
        : buildPartnerUrl("https://www.irctc.co.in/nget/train-search");
      window.open(targetUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if (trip.bookingType === "Hotel") {
      const targetUrl = buildPartnerUrl("https://www.booking.com/searchresults.html", {
        ss: `${trip.providerName} ${trip.routeOrLocation}`.trim(),
      });
      window.open(targetUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if (trip.bookingType === "Flight") {
      const targetUrl = buildPartnerUrl("https://www.skyscanner.co.in/", {
        ref: trip.bookingRef,
      });
      window.open(targetUrl, "_blank", "noopener,noreferrer");
      return;
    }
    const targetUrl = buildPartnerUrl("https://www.uber.com/in/en/");
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  const handleCheckPnr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pnr || pnr.length !== 10) {
      toast.error("Please enter a valid 10-digit IRCTC PNR number");
      return;
    }
    setCheckingPnr(true);
    const partnerUrl = buildPartnerUrl("https://www.confirmtkt.com/pnr-status", {
      pnr,
    });
    window.open(partnerUrl, "_blank", "noopener,noreferrer");
    setCheckingPnr(false);
    toast.info(`Opened live railway PNR enquiry for PNR ${pnr}. Direct in-app IRCTC PNR API requires railway partner activation.`);
  };

  const handleFastagBankPortal = () => {
    if (!vehicleNo.trim()) {
      toast.error("Please enter your vehicle registration number");
      return;
    }
    const issuerPortals: Record<string, string> = {
      "ICICI Bank FASTag": "https://www.icicibank.com/personal-banking/cards/prepaid-card/fastag",
      "State Bank of India FASTag": "https://fastag.bank.sbi/",
      "HDFC Bank FASTag": "https://www.hdfcbank.com/personal/pay/bill-payments/fastag",
      "Axis Bank FASTag": "https://www.axisbank.com/retail/cards/fastag",
      "Kotak Mahindra Bank FASTag": "https://www.kotak.com/en/personal-banking/cards/prepaid-card/fastag.html",
      "IDFC FIRST Bank FASTag": "https://www.idfcfirstbank.com/personal-banking/fastag",
    };
    const portal = issuerPortals[fastagBank] || "https://www.npci.org.in/what-we-do/netc-fastag/product-overview";
    window.open(buildPartnerUrl(portal, { vrn: vehicleNo.trim().toUpperCase(), amount: String(fastagAmount) }), "_blank", "noopener,noreferrer");
    toast.info(
      `Opened official ${fastagBank} portal for vehicle ${vehicleNo.toUpperCase()} (₹${fastagAmount}). Direct in-app NETC BBPS settlement requires NPCI biller activation.`
    );
  };

  const currentCategory = TRAVEL_CATEGORIES.find((c) => c.id === activeTab) ?? TRAVEL_CATEGORIES[0];
  const currentSub = activeSubCategory[activeTab];

  const estimatedTollInr = Math.round(
    highwayDistanceKm * (vehicleAxleClass === "car" ? 2.15 : vehicleAxleClass === "lcv" ? 3.45 : 7.2)
  );

  return (
    <CustomerShell>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
        <TravelCategoryDeck onChoose={setActiveTab} />

        {/* OrderKing Travel & Stays Header Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-amber-500/30">
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 border border-amber-400/40 px-3 py-1 text-xs font-black text-amber-300 mb-3 shadow-xs">
                <span>✈️</span>
                <span>TravelKing · Stays &amp; Flights Hub</span>
                <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 text-[10px] font-extrabold ml-1">
                  Direct Partner Handoff
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                TravelKing · Flights, Stays &amp; Trips
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-xl">
                Compare flights, Indian Railways trains, verified stays, airport transfers, and NETC highway tools, or organize your live PNR and booking references in one place.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md self-start md:self-auto">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 font-black text-lg">
                ₹0
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Platform Desk Fee</p>
                <p className="text-xs font-black text-emerald-400">Zero OrderKing Convenience Markup</p>
              </div>
            </div>
          </div>

          {/* Search across all 6 primary categories and sub-categories */}
          <div className="relative mt-5 space-y-2">
            <label htmlFor="travel-service-search" className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Search className="size-3.5 text-amber-400" />
              Search Travel Categories, Sub-Categories &amp; PNR Tools
            </label>
            <input
              id="travel-service-search"
              type="search"
              autoComplete="off"
              value={serviceQuery}
              onChange={(e) => setServiceQuery(e.target.value)}
              placeholder="Search Domestic Flights, Live PNR Enquiry, Luxury 5-Star, My Trips..."
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none focus:border-amber-400"
            />
            {serviceQuery.trim() && (
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-white/20 bg-slate-900 p-1.5 shadow-xl">
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
                    className="flex items-center justify-between w-full rounded-lg px-3 py-2 text-left text-xs sm:text-sm text-slate-100 hover:bg-white/10 transition"
                  >
                    <span className="font-bold">{sub}</span>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-amber-400/20 text-amber-300 px-2 py-0.5">
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 6 Primary Travel Category Tabs */}
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
              label="Trains & IRCTC"
              badge="IRCTC"
            />
            <TabButton
              active={activeTab === "hotels"}
              onClick={() => setActiveTab("hotels")}
              icon={Building2}
              label="Hotels & Stays"
              badge="Stays"
            />
            <TabButton
              active={activeTab === "cabs"}
              onClick={() => setActiveTab("cabs")}
              icon={Car}
              label="Cabs & Airport"
              badge="Transfers"
            />
            <TabButton
              active={activeTab === "fastag"}
              onClick={() => setActiveTab("fastag")}
              icon={CreditCard}
              label="FASTag & Highway"
              badge="NETC"
            />
            <TabButton
              active={activeTab === "trips"}
              onClick={() => setActiveTab("trips")}
              icon={Compass}
              label="My Trips & Bookings"
              badge={savedTrips.length > 0 ? `${savedTrips.length} Saved` : "Organizer"}
            />
          </div>

          {/* Sub-Category Strip for Active Primary Category */}
          <div className="mt-3 flex flex-wrap items-center gap-2 pt-3 border-t border-white/10">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 mr-1">
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
                      ? "bg-amber-400 text-slate-950 font-black shadow-xs"
                      : "bg-white/10 text-slate-200 hover:bg-white/20"
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        </div>

        {/* SOVEREIGN TRAVEL ENGINE CONCIERGE (0% FEE GUARANTEE & DIRECT TICKETING) */}
        <SovereignTravelConcierge />

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
                          const portals: Record<string, string> = {
                            "6E (IndiGo)": "https://www.goindigo.in/web-check-in.html",
                            "AI (Air India)": "https://www.airindia.com/in/en/manage/web-check-in.html",
                            "QP (Akasa Air)": "https://www.akasaair.com/en/check-in",
                            "IX (Air India Express)": "https://www.airindiaexpress.com/checkin-home",
                            "SG (SpiceJet)": "https://www.spicejet.com/",
                          };
                          const target = portals[airlineCheckInCode] || "https://www.goindigo.in/web-check-in.html";
                          window.open(
                            buildPartnerUrl(target, { pnr: flightPnrInput.trim() }),
                            "_blank",
                            "noopener,noreferrer"
                          );
                        }}
                        className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs"
                      >
                        Open Airline Check-In ➔
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
                        window.open(
                          buildPartnerUrl(
                            `https://www.skyscanner.co.in/transport/flights/${sector.codeFrom}/${sector.codeTo}/`,
                            { fareType: specialFareType }
                          ),
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }}
                      className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 p-2.5 text-left transition"
                    >
                      <span className="text-xs font-black text-slate-900 block">{sector.route}</span>
                      <span className="text-[10px] font-bold text-indigo-600">Compare Live Fares ➔</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <FlightBookingEngine />
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
                  IRCTC / ConfirmTkt Partner Attribution
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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
                    <ShieldCheck className="size-3 text-indigo-600" /> Booking Quota
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
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => {
                    window.open(
                      buildPartnerUrl("https://www.confirmtkt.com/rbooking/trains-between-stations", {
                        from: trainFrom,
                        to: trainTo,
                        date: trainDate,
                        quota: trainQuota,
                      }),
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }}
                  className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm transition shadow-md shadow-indigo-600/20"
                >
                  Search Trains Between Stations ➔
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    window.open(
                      buildPartnerUrl("https://www.irctc.co.in/nget/train-search"),
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                  className="h-12 rounded-xl border-gray-200 text-gray-800 font-bold text-sm"
                >
                  IRCTC Authorised Ticket Handoff
                </Button>
              </div>
            </div>

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
                      notes: `Quota: ${trainQuota}`,
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <Calendar className="size-3 text-amber-600" /> Guests &amp; Rooms
                </label>
                <input
                  type="text"
                  value={hotelGuests}
                  onChange={(e) => setHotelGuests(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                />
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
                  window.open(
                    buildPartnerUrl("https://www.booking.com/searchresults.html", {
                      ss: `${hotelCity} ${currentSub}`,
                      checkin: hotelCheckIn,
                    }),
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
                className="flex-1 h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm shadow-md shadow-amber-500/20"
              >
                Explore {currentSub} in {hotelCity} ➔
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  window.open(
                    buildPartnerUrl("https://www.uber.com/in/en/ride/", {
                      pickup: cabPickup,
                      drop: cabDrop,
                      mode: currentSub,
                    }),
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
                className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md shadow-emerald-600/20"
              >
                Open Partner Cab Dispatch ({currentSub}) ➔
              </Button>
            </div>
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
                  {(["ALL", "Flight", "Train", "Hotel", "Cab"] as const).map((filterType) => (
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
