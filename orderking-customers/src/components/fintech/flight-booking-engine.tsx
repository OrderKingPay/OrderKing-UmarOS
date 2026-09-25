import { useState } from "react";
import {
  Plane,
  Calendar,
  Users,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Info,
  Clock,
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

import ALL_AIRPORTS_DATA from "./airports.json";

export const POPULAR_AIRPORTS: Airport[] = ALL_AIRPORTS_DATA as Airport[];

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
  providerId: string;
  rawProviderData: any;
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

export function FlightBookingEngine(_props: Props) {
  // Search state
  const [originAirport, setOriginAirport] = useState<string>("IXS");
  const [destinationAirport, setDestinationAirport] = useState<string>("CCU");
  const [departureDate, setDepartureDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]!
  );
  const [passengers, setPassengers] = useState<number>(1);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [originSearch, setOriginSearch] = useState<string>("Silchar (IXS)");
  const [destinationSearch, setDestinationSearch] = useState<string>("Kolkata (CCU)");
  const [searchError, setSearchError] = useState<string | null>(null);

  // Booking Modal State
  const [selectedFlight, setSelectedFlight] = useState<FlightResult | null>(null);
  const [passengerName, setPassengerName] = useState<string>("");
  const [passengerAge, setPassengerAge] = useState<string>("");
  const [passengerGender, setPassengerGender] = useState<"Male" | "Female" | "Other">("Male");
  const [contactMobile, setContactMobile] = useState<string>("");
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [flightResults, setFlightResults] = useState<FlightResult[]>([]);

  // Confirmed e-Ticket Modal
  const [confirmedTicket, setConfirmedTicket] = useState<{
    bookingId?: string;
    pnr?: string;
    flight: FlightResult;
    passenger: string;
  } | null>(null);

  const resolveAirport = (value: string): Airport | undefined => {
    const normalized = value.trim().toLowerCase();
    return POPULAR_AIRPORTS.find(
      (airport) =>
        airport.code.toLowerCase() === normalized ||
        airport.city.toLowerCase() === normalized ||
        `${airport.city} (${airport.code})`.toLowerCase() === normalized ||
        airport.name.toLowerCase() === normalized
    );
  };

  const formatDuration = (isoDuration?: string): string => {
    if (!isoDuration) return "Supplier duration";
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
    if (!match) return isoDuration;
    const hours = match[1] ? `${match[1]}h ` : "";
    const minutes = match[2] ? `${match[2]}m` : "";
    return `${hours}${minutes}`.trim();
  };

  const handleSearch = async () => {
    const origin = resolveAirport(originSearch);
    const destination = resolveAirport(destinationSearch);

    if (!origin || !destination) {
      setSearchError("Select a valid airport from the search suggestions.");
      toast.error("Please choose valid airports.");
      return;
    }
    if (origin.code === destination.code) {
      setSearchError("Origin and destination cannot be the same.");
      toast.error("Origin and destination cannot be the same.");
      return;
    }

    setOriginAirport(origin.code);
    setDestinationAirport(destination.code);
    setSearchError(null);
    setIsSearching(true);
    setFlightResults([]);

    try {
      const baseUrl = (import.meta.env.VITE_HDMASTER_API_BASE_URL || "https://hdmaster.vercel.app").replace(/\/$/, "");
      const params = new URLSearchParams({
        mode: "FLIGHT",
        origin: origin.code,
        destination: destination.code,
        date: departureDate,
        passengers: String(passengers),
      });
      const res = await fetch(`${baseUrl}/api/v1/travel/search?${params.toString()}`, {
        headers: { Accept: "application/json" },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.details || data?.error || `Travel search failed (${res.status})`);
      }

      if (!Array.isArray(data.results) || data.results.length === 0) {
        const details = Array.isArray(data.errors) && data.errors.length
          ? data.errors.map((e: any) => e.details || e.error).filter(Boolean).join("; ")
          : "The configured live flight provider returned no offers.";
        setSearchError(`No live flights found. ${details}`);
        toast.error("No live flight results were returned. No dummy results were shown.");
        return;
      }

      const mapped = data.results.map((r: any) => {
        const segments = Array.isArray(r.rawProviderData?.itineraries?.[0]?.segments)
          ? r.rawProviderData.itineraries[0].segments
          : [];
        const firstSegment = segments[0];
        const lastSegment = segments[segments.length - 1];
        const total = Number(r.price?.amount || 0);
        const base = Number(r.rawProviderData?.price?.base || total);
        const taxes = Math.max(0, total - base);
        const stopsCount = Math.max(0, segments.length - 1);

        return {
          id: String(r.id),
          providerId: String(r.providerId || "amadeus_flight"),
          rawProviderData: r.rawProviderData,
          airline: String(r.carrier?.name || r.carrier?.code || "Airline"),
          airlineCode: String(r.carrier?.code || "—"),
          flightNumber: String(firstSegment?.number || "—"),
          departureAirport: String(firstSegment?.departure?.iataCode || r.origin?.code),
          arrivalAirport: String(lastSegment?.arrival?.iataCode || r.destination?.code),
          departureTime: new Date(r.departureTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          arrivalTime: new Date(r.arrivalTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          duration: formatDuration(r.rawProviderData?.itineraries?.[0]?.duration),
          stops: stopsCount === 0 ? "Non-stop" : stopsCount === 1 ? "1 Stop" : "2 Stops",
          baseFare: base,
          taxes,
          kingPayPrice: total,
          competitorPrice: 0,
          savingsAmount: 0,
          cabinBaggage: "Supplier fare rules",
          checkInBaggage: "Supplier fare rules",
          mealIncluded: false,
        } as FlightResult;
      });

      setFlightResults(mapped);
      toast.success(`Live supplier search returned ${mapped.length} flight offer(s).`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Live flight search failed.";
      setSearchError(message);
      toast.error(message);
    } finally {
      setIsSearching(false);
    }
  };
  const handleBookFlight = async () => {
    if (!selectedFlight?.rawProviderData || !selectedFlight.providerId) {
      toast.error("This offer cannot be booked because a genuine provider offer is missing.");
      return;
    }
    if (!passengerName.trim() || !contactMobile.trim()) {
      toast.error("Enter the passenger name and contact mobile before booking.");
      return;
    }

    setIsBooking(true);
    try {
      const baseUrl = (import.meta.env.VITE_HDMASTER_API_BASE_URL || "https://hdmaster.vercel.app").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/api/v1/travel/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          resultId: selectedFlight.id,
          providerId: selectedFlight.providerId,
          rawProviderData: selectedFlight.rawProviderData,
          passengerDetails: [{
            name: { firstName: passengerName.trim().split(/\s+/)[0] || passengerName.trim(), lastName: passengerName.trim().split(/\s+/).slice(1).join(" ") || undefined },
            gender: passengerGender.toUpperCase(),
            contact: { phone: contactMobile.trim() },
          }],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || data?.message || "The live travel provider did not confirm the booking.");
      }
      setConfirmedTicket({
        bookingId: data.bookingId,
        pnr: data.pnr,
        flight: selectedFlight,
        passenger: passengerName.trim(),
      });
      toast.success(data.pnr ? `Provider booking confirmed. PNR: ${data.pnr}` : "Provider booking confirmed.");
      setSelectedFlight(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Live travel booking failed.");
    } finally {
      setIsBooking(false);
    }
  };
  return (
    <div className="space-y-6 text-fg">
      {/* 1. LIVE FLIGHT SEARCH */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 sm:p-7 shadow-sm">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary ring-1 ring-primary/20">
            <Sparkles className="size-3.5" />
            <span>Live supplier search</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-fg">Search real-time flight offers</h2>
          <p className="text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
            Airports are searchable by city, airport name or IATA code. Results are shown only when the configured travel provider returns live offers; no fallback or fabricated fare is shown.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1"><CheckCircle2 className="size-4 text-emerald-600" /> Live provider response required</span>
            <span className="flex items-center gap-1"><ShieldCheck className="size-4 text-primary" /> No fake PNR / savings</span>
          </div>
        </div>
      </div>

      {/* 2. FLIGHT SEARCH COCKPIT */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div>
            <span className="text-xs font-bold text-fg">One-way live supplier search</span>
            <p className="text-[10px] text-muted">Round-trip and special-fare pricing will be enabled only when supported by the connected provider.</p>
          </div>
        </div>

        {/* Airport Selectors & Date Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Origin */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted uppercase">From Airport:</label>
            <input
              list="orderking-airports"
              value={originSearch}
              onChange={(e) => {
                setOriginSearch(e.target.value);
                const airport = resolveAirport(e.target.value);
                if (airport) setOriginAirport(airport.code);
              }}
              placeholder="Search airport, city or IATA code"
              className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm font-bold text-fg focus:border-primary focus:outline-none"
              aria-label="Search origin airport"
            />
          </div>

          {/* Destination */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted uppercase">To Airport:</label>
            <input
              list="orderking-airports"
              value={destinationSearch}
              onChange={(e) => {
                setDestinationSearch(e.target.value);
                const airport = resolveAirport(e.target.value);
                if (airport) setDestinationAirport(airport.code);
              }}
              placeholder="Search airport, city or IATA code"
              className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm font-bold text-fg focus:border-primary focus:outline-none"
              aria-label="Search destination airport"
            />
          </div>

          <datalist id="orderking-airports">
            {POPULAR_AIRPORTS.map((a) => (
              <option key={a.code} value={`${a.city} (${a.code})`}>
                {a.name}, {a.country}
              </option>
            ))}
          </datalist>

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
              {isSearching ? "Searching live supplier..." : "Search Live Flights ➔"}
            </Button>
          </div>
        </div>

        <div className="rounded-xl bg-surface-2 p-3 text-xs border border-border/60">
          <div className="flex items-start gap-2">
            <Info className="size-4 text-primary mt-0.5 shrink-0" />
            <p className="text-[10px] text-muted">
              Results are supplied by the configured live travel provider. Split-ticket, hidden-city, competitor-price and savings figures are not fabricated here.
            </p>
          </div>
        </div>
      </div>

      {/* 3. FLIGHT RESULTS MATRIX (WITH DIRECT COMPARISON) */}
      {searchError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 text-xs text-rose-700 dark:text-rose-300">
          {searchError}
        </div>
      )}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-fg">
            Available Flights for {originAirport} ➔ {destinationAirport} ({flightResults.length} options)
          </span>
          <span className="text-muted text-[10px]">Live provider results only</span>
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

                {/* Supplier Price & Booking Action */}
                <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-border/60">
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wide text-muted">Live supplier total</p>
                    <p className="font-mono text-2xl font-black text-fg">
                      {flight.kingPayPrice.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                    </p>
                  </div>

                  <Button
                    onClick={() => setSelectedFlight(flight)}
                    className="bg-primary text-white hover:bg-primary/90 font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shrink-0"
                  >
                    Continue ➔
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

            <div className="rounded-xl border border-border bg-surface-2 p-3 text-xs">
              <span className="font-bold text-fg block">Supplier price</span>
              <p className="text-[10px] text-muted mt-1">The amount below comes from the live supplier offer. Ancillaries such as insurance, meals and extra baggage are not fabricated by this flow.</p>
            </div>

            {/* Live Supplier Price */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 text-xs space-y-2">
              <div className="flex justify-between text-muted">
                <span>Live supplier fare ({passengers} passenger{passengers > 1 ? "s" : ""}):</span>
                <span className="font-mono">{selectedFlight.kingPayPrice.toLocaleString("en-IN", { style: "currency", currency: "INR" })}</span>
              </div>
              <div className="border-t border-border/60 pt-2 text-[10px] text-muted">
                No platform fee, discount or ancillary amount is asserted here unless it is returned by a verified integration.
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Button
                onClick={handleBookFlight}
                disabled={isBooking}
                className="w-full bg-primary text-white hover:bg-primary/90 font-bold text-sm py-3 rounded-xl shadow-lg"
              >
                {isBooking ? "Submitting genuine provider booking..." : "Confirm with live travel provider"}
              </Button>
              <p className="text-[10px] text-center text-muted">
                No wallet is debited by this screen. A booking is reported confirmed only after the configured supplier returns success.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. CONFIRMED BOOKING MODAL */}

      {confirmedTicket && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md overflow-y-auto">

          <div className="w-full max-w-md rounded-3xl border-2 border-emerald-500/50 bg-gradient-to-br from-surface to-surface-2 p-5 sm:p-6 shadow-2xl space-y-4">

            <div className="text-center space-y-2">

              <div className="size-14 rounded-full bg-emerald-500/20 text-emerald-600 text-2xl flex items-center justify-center mx-auto shadow-inner">✓</div>

              <h3 className="font-display font-black text-xl text-fg">Provider Booking Confirmed</h3>

              <p className="text-xs text-muted">Shown only after the configured live travel provider returned success.</p>

            </div>



            <div className="rounded-2xl border border-primary/30 bg-surface p-4 text-xs space-y-3">

              <div className="flex items-center justify-between border-b border-border/60 pb-3">

                <div>

                  <span className="text-[9px] uppercase font-bold text-muted block">Airline / Provider</span>

                  <span className="font-bold text-fg text-sm">{confirmedTicket.flight.airline} · {confirmedTicket.flight.airlineCode}</span>

                </div>

                <div className="text-right">

                  <span className="text-[9px] uppercase font-bold text-muted block">PNR</span>

                  <span className="font-mono font-black text-base text-primary tracking-widest">{confirmedTicket.pnr || "Not returned"}</span>

                </div>

              </div>



              <div className="flex items-center justify-between">

                <div>

                  <span className="font-mono text-xl font-black text-fg">{confirmedTicket.flight.departureAirport}</span>

                  <p className="text-[10px] text-muted">{confirmedTicket.flight.departureTime}</p>

                </div>

                <Plane className="size-4 text-primary" />

                <div className="text-right">

                  <span className="font-mono text-xl font-black text-fg">{confirmedTicket.flight.arrivalAirport}</span>

                  <p className="text-[10px] text-muted">{confirmedTicket.flight.arrivalTime}</p>

                </div>

              </div>



              <div className="border-t border-border/60 pt-3">

                <span className="text-[9px] text-muted block">Passenger</span>

                <span className="font-bold text-fg">{confirmedTicket.passenger}</span>

              </div>



              {confirmedTicket.bookingId && (

                <div className="border-t border-border/60 pt-3">

                  <span className="text-[9px] text-muted block">Provider Booking ID</span>

                  <span className="font-mono font-bold text-fg break-all">{confirmedTicket.bookingId}</span>

                </div>

              )}

            </div>



            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-[10px] text-muted">

              No fake boarding pass, QR code, competitor savings or payment receipt is generated by this screen. Those require verified supplier/payment integrations.

            </div>



            <Button variant="ghost" onClick={() => setConfirmedTicket(null)} className="w-full text-xs">Done</Button>

          </div>

        </div>

      )}
    </div>
  );
}
