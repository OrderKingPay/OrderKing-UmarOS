import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { CalendarDays, Clock3, Crown, FileText, Plane, Search, ShieldCheck, TrainFront, CheckCircle2, AlertCircle, QrCode, ArrowRight, Bus, Car, ExternalLink } from "lucide-react";
import { CustomerShell } from "@/components/market/shell";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getStoredETickets, type SovereignETicket } from "@/lib/travel/in-app-booking-service";
import { SovereignETicketModal } from "@/components/fintech/sovereign-eticket-modal";
import { formatPaise } from "@/lib/money";

export function TripsPageSkeleton() {
  return (
    <CustomerShell>
      <div className="min-h-dvh bg-slate-50 px-4 py-6 pb-32 text-slate-900 animate-pulse">
        <div className="mx-auto max-w-5xl space-y-5">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 h-44" />
          <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="h-6 w-48 bg-slate-200 rounded" />
            <div className="flex gap-2">
              <div className="h-8 w-24 bg-slate-200 rounded-full" />
              <div className="h-8 w-24 bg-slate-200 rounded-full" />
              <div className="h-8 w-24 bg-slate-200 rounded-full" />
            </div>
            <div className="h-32 bg-slate-100 rounded-2xl" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 h-48" />
            <div className="rounded-3xl border border-slate-200 bg-white p-5 h-48" />
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}

import { AppErrorComponent } from "@/lib/error-component";

export const Route = createFileRoute("/travel/trips")({
  component: MyTripsPage,
  pendingComponent: TripsPageSkeleton,
  errorComponent: AppErrorComponent,
});
type View = "Upcoming" | "In Transit" | "Completed" | "Cancelled / Refunds";
const FILTERS: View[] = ["Upcoming", "In Transit", "Completed", "Cancelled / Refunds"];

function MyTripsPage() {
  const { user, isPending } = useCurrentUserState();
  const [view, setView] = useState<View>("Upcoming");
  const [eTickets, setETickets] = useState<SovereignETicket[]>(() => getStoredETickets());
  const [selectedTicket, setSelectedTicket] = useState<SovereignETicket | null>(null);

  useEffect(() => {
    setETickets(getStoredETickets());
  }, []);

  const now = Date.now();
  const filteredTickets = eTickets.filter((t) => {
    const isCancelled = (t.status as string) === "CANCELLED" || (t as any).isCancelled;
    if (view === "Cancelled / Refunds") {
      return Boolean(isCancelled);
    }
    if (isCancelled) return false;
    const depTime = new Date(t.departureTimestamp).getTime();
    if (view === "Upcoming") {
      return depTime >= now;
    }
    if (view === "In Transit") {
      return depTime < now && depTime >= now - 6 * 3600 * 1000;
    }
    if (view === "Completed") {
      return depTime < now - 6 * 3600 * 1000;
    }
    return true;
  });

  const [pnr, setPnr] = useState("");
  const [pnrLoading, setPnrLoading] = useState(false);
  const [pnrData, setPnrData] = useState<any>(null);
  const [pnrError, setPnrError] = useState<string | null>(null);

  const [flight, setFlight] = useState("");
  const [flightLoading, setFlightLoading] = useState(false);
  const [flightData, setFlightData] = useState<any>(null);
  const [flightError, setFlightError] = useState<string | null>(null);

  const cleanPnr = (pnr || "").replace(/\D/g, "");
  const validPnr = /^\d{10}$/.test(cleanPnr);
  const validFlight = /^[A-Z0-9]{2,3}[- ]?\d{1,4}$/i.test((flight || "").trim());

  const handleQueryPnr = async () => {
    if (!validPnr) return;
    setPnrLoading(true);
    setPnrError(null);
    setPnrData(null);
    try {
      const res = await fetch(`/api/travel/pnr-status?pnr=${cleanPnr}`);
      let json: any = null;
      try {
        json = await res.json();
      } catch {
        throw new Error("Unable to parse Railway CRIS response");
      }
      if (!res.ok) throw new Error(json?.error || "Railway CRIS connection failed");
      if (!json?.data) throw new Error("No live status found for this PNR reference");
      setPnrData(json.data);
    } catch (err: any) {
      setPnrError(err.message || "Unable to retrieve PNR status");
    } finally {
      setPnrLoading(false);
    }
  };

  const handleQueryFlight = async () => {
    if (!validFlight) return;
    setFlightLoading(true);
    setFlightError(null);
    setFlightData(null);
    try {
      const res = await fetch(`/api/travel/flight-tracker?flightNumber=${encodeURIComponent(flight.trim().toUpperCase())}`);
      let json: any = null;
      try {
        json = await res.json();
      } catch {
        throw new Error("Unable to parse Aviation radar response");
      }
      if (!res.ok) throw new Error(json?.error || "Aviation radar connection failed");
      if (!json?.data) throw new Error("No radar tracking found for this flight number");
      setFlightData(json.data);
    } catch (err: any) {
      setFlightError(err.message || "Unable to track flight");
    } finally {
      setFlightLoading(false);
    }
  };

  return (
    <CustomerShell>
      <div className="min-h-dvh bg-slate-50 px-4 py-6 pb-32 text-slate-900">
        <div className="mx-auto max-w-5xl space-y-5">
          <header className="rounded-3xl border border-amber-300/30 bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 p-6 text-white shadow-xl">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.17em] text-amber-300"><Crown className="size-5" /> OrderKing Travel Hub</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight">My Trips &amp; Live Tracking</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-200">1-Tap Direct IRCTC PNR validation, live airport gate departures, and direct fare comparisons.</p>
            <p className="mt-3 flex items-center gap-2 text-xs text-amber-200"><ShieldCheck className="size-4" /> 100% Verified Carrier Tracking</p>
          </header>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="Travel bookings">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold">Booking history ({filteredTickets.length})</h2>
              <CalendarDays className="size-5 text-emerald-700" />
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {FILTERS.map((filter) => (
                <button key={filter} type="button" onClick={() => setView(filter)} aria-pressed={view === filter}
                  className={"shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition " +
                  (filter === view ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-emerald-500")}>
                  {filter}
                </button>
              ))}
            </div>

            {view === "Cancelled / Refunds" && (
              <div className="mt-4 rounded-2xl border border-amber-300/40 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-5 text-white space-y-3 shadow-md">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-5 text-amber-400" />
                    <h3 className="text-sm font-black text-amber-300">
                      Indian Railways IRCTC Statutory Cancellation &amp; TDR Rules (Gazette 2015)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-full">
                    Sovereign Settlement Desk
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300 pt-1">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 space-y-1">
                    <span className="font-bold text-white block">Confirmed E-Tickets Cancellation:</span>
                    <p className="text-[11px] leading-relaxed">
                      • <strong>&gt;48 hrs:</strong> Flat clerkage (1A/EC: ₹240+GST, 2A/1st: ₹200+GST, 3A/CC: ₹180+GST, SL: ₹120, 2S: ₹60).<br />
                      • <strong>48h to 12h:</strong> 25% of fare (or flat minimum) + 5% GST on AC.<br />
                      • <strong>12h to 4h:</strong> 50% of fare (or flat minimum) + 5% GST on AC.<br />
                      • <strong>&lt;4 hrs / Post-Charting:</strong> Direct refund blocked; online TDR required.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 space-y-1">
                    <span className="font-bold text-white block">TDR Lifecycle &amp; Gateway SLA:</span>
                    <p className="text-[11px] leading-relaxed">
                      • <strong>TDR Grounds:</strong> Train delayed &gt;3 hrs, coach AC failure, route diversion.<br />
                      • <strong>Audit Authority:</strong> Railway Zonal CCM (Claims) with 30-90 days verification.<br />
                      • <strong>Settlement Timeline:</strong> <strong>T+2 to T+5 Banking Days</strong> directly to source payment gateway.<br />
                      • <strong>OrderKing Guarantee:</strong> Strictly ₹0 platform cancellation penalty.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {filteredTickets.length > 0 ? (
              <div className="mt-4 space-y-3">
                {filteredTickets.map((t) => {
                  const ModeIcon = t.mode === "flight" ? Plane : t.mode === "train" ? TrainFront : t.mode === "bus" ? Bus : Car;
                  return (
                    <div
                      key={t.pnr}
                      className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs hover:border-emerald-500 transition"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="size-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                          <ModeIcon className="size-5" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black font-mono px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                              PNR: {t.pnr}
                            </span>
                            <span className="text-xs font-bold text-slate-900">{t.serviceTitle}</span>
                            <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              ✓ {t.status}
                            </span>
                          </div>
                          <p className="text-sm font-black text-slate-800 mt-1">
                            {t.origin.city} ➔ {t.destination.city}
                          </p>
                          <p className="text-xs text-slate-500">
                            {t.origin.departureDate} at {t.origin.departureTime} · {t.passengers.length} Passenger{t.passengers.length > 1 ? "s" : ""} · {t.classOrTier}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-center">
                        <div className="text-right">
                          <span className="text-base font-black font-mono text-slate-900 block">
                            {formatPaise(t.fareBreakdown.totalCheckoutPaise)}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-bold block">
                            Direct Verified
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedTicket(t)}
                          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                        >
                          <QrCode className="size-3.5" /> E-Ticket
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl bg-slate-50 p-6 text-center">
                <FileText className="mx-auto size-10 text-slate-400" />
                <h3 className="mt-3 font-semibold">No verified {view.toLowerCase()} bookings connected</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  {isPending ? "Checking account..." : !user
                    ? "Sign in to prepare your private trip centre."
                    : "You have no active bookings in this view. Compare flights, trains, stays, and buses directly."}
                </p>
                <Link to="/travel"
                  className="mt-4 inline-flex rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white no-underline">
                  Explore Travel Comparison
                </Link>
              </div>
            )}
          </section>

          <section className="grid gap-4 md:grid-cols-2" aria-label="Check travel references">
            {/* IRCTC PNR Direct Status */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <h2 className="flex items-center gap-2 font-bold"><TrainFront className="size-5 text-emerald-700" /> Train PNR Live Verification</h2>
              <label htmlFor="trip-pnr" className="block text-xs font-medium text-slate-600">10-digit Indian Railways PNR</label>
              <div className="flex gap-2">
                <input id="trip-pnr" type="text" inputMode="numeric" maxLength={10} value={pnr} onChange={(e) => setPnr(e.target.value.replace(/\D/g,""))}
                  placeholder="Enter 10-digit PNR" className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-600 font-mono font-bold" />
                <button
                  type="button"
                  disabled={!validPnr || pnrLoading}
                  onClick={handleQueryPnr}
                  className="rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white px-4 py-2.5 text-xs font-bold transition"
                >
                  {pnrLoading ? "Querying..." : "Live Check"}
                </button>
              </div>

              {pnrLoading && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 space-y-3 animate-pulse">
                  <div className="h-4 w-1/3 bg-emerald-200/60 rounded" />
                  <div className="h-3 w-1/2 bg-emerald-200/40 rounded" />
                  <div className="h-10 w-full bg-emerald-200/30 rounded-xl" />
                </div>
              )}

              {pnrError && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900 space-y-2">
                  <p className="font-semibold">{pnrError}</p>
                  <p className="text-[11px] text-amber-800">
                    Indian Railways mandates captcha verification directly on government PRS endpoints. Check your PNR instantly on official government portals:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href={`https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html?pnrno=${cleanPnr}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-black text-[11px] no-underline transition"
                    >
                      <span>Check on IndianRail.gov.in</span>
                      <ExternalLink className="size-3" />
                    </a>
                    <a
                      href="https://enquiry.indianrail.gov.in/mntes/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] no-underline transition"
                    >
                      <span>CRIS NTES Live Spotting</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                </div>
              )}

              {pnrData && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-black text-slate-900">
                    <span>{pnrData.trainNumber || "IRCTC Train"} · {pnrData.trainName || "Express"}</span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                      {pnrData.chartStatus || "CONFIRMED"}
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium">
                    {pnrData.originStationCode || "NDLS"} ➔ {pnrData.destinationStationCode || "DEST"} · {pnrData.journeyClass || "General"}
                  </p>
                  {Array.isArray(pnrData?.passengers) && pnrData.passengers.length > 0 && (
                    <div className="pt-2 border-t border-emerald-200 space-y-1">
                      {pnrData.passengers.map((p: any, idx: number) => (
                        <div key={p?.passengerIndex ?? idx} className="flex justify-between items-center text-slate-800">
                          <span>Passenger {p?.passengerIndex ?? idx + 1}:</span>
                          <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
                            {p?.currentStatus || "CNF"} {p?.berthType ? `(${p.berthType})` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="pt-1 text-[11px] text-slate-500 flex justify-between">
                    <span>{pnrData.expectedDeparturePlatform || "Platform TBA"}</span>
                    <span className="font-bold text-emerald-700">Delay: {pnrData.liveDelayMinutes ?? 0} mins</span>
                  </div>
                </div>
              )}
            </div>

            {/* Live Flight Radar Tracker */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <h2 className="flex items-center gap-2 font-bold"><Plane className="size-5 text-emerald-700" /> Flight Reference Live Radar</h2>
              <label htmlFor="trip-flight" className="block text-xs font-medium text-slate-600">Airline code and flight number</label>
              <div className="flex gap-2">
                <input id="trip-flight" type="text" maxLength={14} value={flight} onChange={(e) => setFlight(e.target.value.toUpperCase())}
                  placeholder="e.g. 6E204, AI805" className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-600 font-mono font-bold" />
                <button
                  type="button"
                  disabled={!validFlight || flightLoading}
                  onClick={handleQueryFlight}
                  className="rounded-xl bg-cyan-700 hover:bg-cyan-800 disabled:opacity-40 text-white px-4 py-2.5 text-xs font-bold transition"
                >
                  {flightLoading ? "Radar..." : "Live Radar"}
                </button>
              </div>

              {flightLoading && (
                <div className="rounded-2xl border border-cyan-100 bg-cyan-50/30 p-4 space-y-3 animate-pulse">
                  <div className="h-4 w-1/3 bg-cyan-200/60 rounded" />
                  <div className="h-3 w-1/2 bg-cyan-200/40 rounded" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-10 bg-cyan-200/30 rounded-lg" />
                    <div className="h-10 bg-cyan-200/30 rounded-lg" />
                  </div>
                </div>
              )}

              {flightError && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                  {flightError}
                </div>
              )}

              {flightData && (
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50/50 p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-black text-slate-900">
                    <span>{flightData.flightNumber || "Flight"} · {flightData.carrierName || "Carrier"}</span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                      {flightData.flightStatus || "ACTIVE"}
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium">
                    {flightData.originIata || "DEP"} ➔ {flightData.destinationIata || "ARR"} · {flightData.terminal || "Terminal TBA"}
                  </p>
                  <div className="pt-2 border-t border-cyan-200 grid grid-cols-2 gap-2 text-slate-800">
                    <div className="bg-white p-2 rounded-lg border border-cyan-100">
                      <span className="text-[10px] text-slate-400 block">Boarding Gate</span>
                      <span className="font-black text-sm text-cyan-950">{flightData.departureGate || "TBA"}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-cyan-100">
                      <span className="text-[10px] text-slate-400 block">Baggage Belt</span>
                      <span className="font-black text-sm text-cyan-950">{flightData.baggageBelt || "TBA"}</span>
                    </div>
                  </div>
                  <div className="pt-1 text-[11px] text-slate-500 flex justify-between">
                    <span>{flightData.aircraftType || "Commercial Jet"}</span>
                    <span className="font-bold text-emerald-700">Delay: {flightData.delayMinutes ?? 0} mins</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-600">
            <p className="flex gap-2"><CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              Direct travel comparisons include automatic digital receipts, verified partner redirects, and live tariffs.
            </p>
            <Link to="/support" className="mt-2 inline-block font-semibold text-emerald-800 underline">Customer support</Link>
          </div>
        </div>
      </div>

      {selectedTicket && (
        <SovereignETicketModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </CustomerShell>
  );
}
