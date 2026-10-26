import { useState } from "react";
import {
  Plane,
  Train,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface SovereignConciergeTrip {
  id: string;
  bookingType: "Train" | "Flight" | "Hotel" | "Bus";
  providerName: string;
  bookingRef: string;
  travelDate: string;
  routeOrLocation: string;
  notes: string;
  createdAt: string;
}

export function SovereignTravelConcierge({
  onSaveTrip,
}: {
  onSaveTrip?: (trip: SovereignConciergeTrip) => void;
} = {}) {
  // PNR Live State
  const [pnrInput, setPnrInput] = useState("");
  const [isQueryingPnr, setIsQueryingPnr] = useState(false);
  const [pnrResult, setPnrResult] = useState<any | null>(null);
  const [pnrError, setPnrError] = useState<string | null>(null);

  // Flight Radar State
  const [flightInput, setFlightInput] = useState("");
  const [isQueryingFlight, setIsQueryingFlight] = useState(false);
  const [flightResult, setFlightResult] = useState<any | null>(null);
  const [flightError, setFlightError] = useState<string | null>(null);

  const handleLookupPnr = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = pnrInput.replace(/\D/g, "");
    if (value.length !== 10) {
      setPnrError("A valid IRCTC PNR must be exactly 10 digits.");
      return;
    }
    setIsQueryingPnr(true);
    setPnrResult(null);
    setPnrError(null);
    try {
      const r = await fetch("/api/travel/pnr-status?pnr=" + encodeURIComponent(value), {
        cache: "no-store",
      });
      const body = await r.json().catch(() => null);
      if (r.ok && body?.source === "verified_provider" && body?.data) {
        setPnrResult(body.data);
      } else {
        setPnrError(
          body?.error || "Indian Railways CRIS charting status is temporarily unavailable upstream."
        );
      }
    } catch {
      setPnrError("Indian Railways CRIS charting status is temporarily unavailable upstream.");
    } finally {
      setIsQueryingPnr(false);
    }
  };

  const handleLookupFlight = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = flightInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (value.length < 3) {
      setFlightError("Enter a valid flight number (e.g. 6E101, AI102 or Charter Tail).");
      return;
    }
    setIsQueryingFlight(true);
    setFlightResult(null);
    setFlightError(null);
    try {
      const r = await fetch(
        "/api/travel/flight-tracker?flightNumber=" + encodeURIComponent(value),
        { cache: "no-store" }
      );
      const body = await r.json().catch(() => null);
      if (r.ok && body?.source === "verified_provider" && body?.data) {
        setFlightResult(body.data);
      } else {
        setFlightError(
          body?.error || "Aviation radar departure feed is temporarily unavailable upstream."
        );
      }
    } catch {
      setFlightError("Aviation radar departure feed is temporarily unavailable upstream.");
    } finally {
      setIsQueryingFlight(false);
    }
  };

  const handleSavePnrToTrips = () => {
    if (!pnrResult) return;
    const trip: SovereignConciergeTrip = {
      id: `trip-${Date.now()}`,
      bookingType: "Train",
      providerName: `${pnrResult.trainNumber || "IRCTC"} ${pnrResult.trainName || "Express"}`.trim(),
      bookingRef: pnrResult.pnr,
      travelDate: pnrResult.boardingDate || new Date().toISOString().split("T")[0],
      routeOrLocation: `${pnrResult.originStationCode || "—"} ➔ ${pnrResult.destinationStationCode || "MMCT"}`,
      notes: `Class: ${pnrResult.journeyClass || "General"}, Chart: ${pnrResult.chartStatus || "Status unavailable"}`,
      createdAt: new Date().toISOString(),
    };
    if (onSaveTrip) {
      onSaveTrip(trip);
    } else {
      try {
        const raw = window.localStorage.getItem("orderking_customer_saved_trips_v1");
        const existing = raw ? JSON.parse(raw) : [];
        window.localStorage.setItem(
          "orderking_customer_saved_trips_v1",
          JSON.stringify([trip, ...existing])
        );
      } catch {}
    }
    toast.success(`Saved PNR ${pnrResult.pnr} to My Trips & Bookings.`);
  };

  const handleSaveFlightToTrips = () => {
    if (!flightResult) return;
    const trip: SovereignConciergeTrip = {
      id: `trip-${Date.now()}`,
      bookingType: "Flight",
      providerName: `${flightResult.carrierName || "Aviation"} (${flightResult.flightNumber})`,
      bookingRef: flightResult.flightNumber,
      travelDate: new Date().toISOString().split("T")[0],
      routeOrLocation: `${flightResult.originIata || "DEL"} ➔ ${flightResult.destinationIata || "BOM"}`,
      notes: `Terminal: ${flightResult.terminal || "T3"}, Gate: ${flightResult.departureGate || "TBA"}`,
      createdAt: new Date().toISOString(),
    };
    if (onSaveTrip) {
      onSaveTrip(trip);
    } else {
      try {
        const raw = window.localStorage.getItem("orderking_customer_saved_trips_v1");
        const existing = raw ? JSON.parse(raw) : [];
        window.localStorage.setItem(
          "orderking_customer_saved_trips_v1",
          JSON.stringify([trip, ...existing])
        );
      } catch {}
    }
    toast.success(`Saved Flight ${flightResult.flightNumber} to My Trips & Bookings.`);
  };

  return (
    <div className="space-y-6 font-sans">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 border border-emerald-500/30 p-5 sm:p-7 text-white shadow-xl">
        <div className="flex items-center gap-2 text-emerald-300 text-xs uppercase font-black tracking-wider"><ShieldCheck className="size-4" /> Official ticket-provider checkout</div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-2">Travel bookings without invented prices</h2>
        <p className="text-sm text-slate-300 mt-2 max-w-2xl">Choose an actual provider to see live availability, final fare, payment and confirmation. OrderKing does not issue railway tickets or guarantee third-party savings, wallet credits or gold rebates.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <a href="https://www.irctc.co.in/nget/train-search" rel="noopener noreferrer" target="_blank" className="rounded-xl bg-emerald-400 px-4 py-2.5 text-slate-950 font-black text-sm no-underline hover:bg-emerald-300">Trains · IRCTC ↗</a>
          <a href="https://www.goindigo.in/" rel="noopener noreferrer" target="_blank" className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white font-bold text-sm no-underline">Flights · IndiGo ↗</a>
          <a href="https://www.redbus.in/" rel="noopener noreferrer" target="_blank" className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white font-bold text-sm no-underline">Buses · redBus ↗</a>
          <a href="https://www.booking.com/" rel="noopener noreferrer" target="_blank" className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white font-bold text-sm no-underline">Hotels · Booking.com ↗</a>
        </div>
        <p className="mt-3 text-[11px] text-slate-400">Provider terms, availability, ticket or reservation issue, refunds and fees apply. These are external booking links, not OrderKing-issued tickets.</p>
      </section>
      {/* Direct 1-Tap IRCTC PNR Status & Live Flight Departure Tracker Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* IRCTC Live PNR */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Train className="size-5" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-900">Direct 1-Tap IRCTC PNR Status</h4>
              <p className="text-xs text-slate-500">Provider-backed PNR enquiry when available</p>
            </div>
          </div>

          <form onSubmit={handleLookupPnr} className="flex gap-2">
            <input
              type="text"
              maxLength={10}
              value={pnrInput}
              onChange={(e) => setPnrInput(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 10-digit PNR"
              className="flex-1 h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono font-bold outline-none focus:border-indigo-600"
            />
            <Button
              type="submit"
              disabled={isQueryingPnr || pnrInput.length !== 10}
              className="h-11 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              {isQueryingPnr ? "Querying..." : "Check Status"}
            </Button>
          </form>

          {pnrError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{pnrError}</span>
            </div>
          )}

          {isQueryingPnr && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-4 space-y-3 animate-pulse">
              <div className="h-4 w-1/3 bg-indigo-200/60 rounded" />
              <div className="h-3 w-1/2 bg-indigo-200/40 rounded" />
              <div className="h-10 w-full bg-indigo-200/30 rounded-xl" />
            </div>
          )}

          {pnrResult && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between font-black text-slate-900">
                <span>{pnrResult.trainNumber || "IRCTC Train"} · {pnrResult.trainName || "Express"}</span>
                <span className="text-[10px] bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full font-bold">
                  {pnrResult.chartStatus || "CONFIRMED"}
                </span>
              </div>
              <p className="text-slate-600">
                {pnrResult.originStationCode || "NDLS"} ➔ {pnrResult.destinationStationCode || "—"} · {pnrResult.journeyClass || "General"}
              </p>
              {Array.isArray(pnrResult?.passengers) && pnrResult.passengers.length > 0 && (
                <div className="pt-2 border-t border-indigo-200/60 space-y-1">
                  {pnrResult.passengers.map((p: any, idx: number) => (
                    <div key={p?.passengerIndex ?? idx} className="flex justify-between items-center text-slate-800 font-medium">
                      <span>Passenger {p?.passengerIndex ?? idx + 1}:</span>
                      <span className="font-mono font-bold text-indigo-950 bg-white px-2 py-0.5 rounded border border-indigo-100">
                        {p?.currentStatus || "Status unavailable"} {p?.berthType ? `(${p.berthType})` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-1 text-[11px] text-slate-500 flex justify-between items-center">
                <span>{pnrResult.expectedDeparturePlatform || "Platform TBA"}</span>
                <span className="font-bold text-emerald-700">Delay: {pnrResult.liveDelayMinutes == null ? "Not reported" : String(pnrResult.liveDelayMinutes) + " mins"}</span>
              </div>
              <div className="pt-2 border-t border-indigo-200/60 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSavePnrToTrips}
                  className="h-8 px-3 rounded-lg border-indigo-300 text-indigo-900 bg-white hover:bg-indigo-100 text-[11px] font-bold"
                >
                  Save PNR to My Trips
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Live Flight Radar Tracker */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Plane className="size-5" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-900">Live Flight Departure Radar</h4>
              <p className="text-xs text-slate-500">Flight details shown only when a verified provider responds</p>
            </div>
          </div>

          <form onSubmit={handleLookupFlight} className="flex gap-2">
            <input
              type="text"
              maxLength={10}
              value={flightInput}
              onChange={(e) => setFlightInput(e.target.value.toUpperCase())}
              placeholder="e.g. 6E101, AI102 or Charter Tail"
              className="flex-1 h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono font-bold outline-none focus:border-cyan-600"
            />
            <Button
              type="submit"
              disabled={isQueryingFlight || flightInput.length < 3}
              className="h-11 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs"
            >
              {isQueryingFlight ? "Radar..." : "Track Flight"}
            </Button>
          </form>

          {flightError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{flightError}</span>
            </div>
          )}

          {isQueryingFlight && (
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50/30 p-4 space-y-3 animate-pulse">
              <div className="h-4 w-1/3 bg-cyan-200/60 rounded" />
              <div className="h-3 w-1/2 bg-cyan-200/40 rounded" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-10 bg-cyan-200/30 rounded-lg" />
                <div className="h-10 bg-cyan-200/30 rounded-lg" />
              </div>
            </div>
          )}

          {flightResult && (
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between font-black text-slate-900">
                <span>{flightResult.flightNumber || "Flight"} · {flightResult.carrierName || "Carrier"}</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                  {flightResult.flightStatus || "Status unavailable"}
                </span>
              </div>
              <p className="text-slate-600">
                {flightResult.originIata || "DEP"} ➔ {flightResult.destinationIata || "ARR"} · {flightResult.terminal || "Terminal TBA"}
              </p>
              <div className="pt-2 border-t border-cyan-200/60 grid grid-cols-2 gap-2 text-slate-800">
                <div className="bg-white p-2 rounded-lg border border-cyan-100">
                  <span className="text-[10px] text-slate-400 block">Boarding Gate</span>
                  <span className="font-black text-sm text-cyan-950">{flightResult.departureGate || "TBA"}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-cyan-100">
                  <span className="text-[10px] text-slate-400 block">Baggage Belt</span>
                  <span className="font-black text-sm text-cyan-950">{flightResult.baggageBelt || "TBA"}</span>
                </div>
              </div>
              <div className="pt-1 text-[11px] text-slate-500 flex justify-between items-center">
                <span>{flightResult.aircraftType || "Aircraft"}</span>
                <span className="font-bold text-emerald-700">Delay: {flightResult.delayMinutes == null ? "Not reported" : String(flightResult.delayMinutes) + "m"}</span>
              </div>
              <div className="pt-2 border-t border-cyan-200/60 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveFlightToTrips}
                  className="h-8 px-3 rounded-lg border-cyan-300 text-cyan-950 bg-white hover:bg-cyan-100 text-[11px] font-bold"
                >
                  Save Flight to My Trips
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
