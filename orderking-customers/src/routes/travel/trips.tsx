import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, Clock3, Crown, FileText, Plane, Search, ShieldCheck, TrainFront, XCircle } from "lucide-react";
import { CustomerShell } from "@/components/market/shell";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/travel/trips")({ component: MyTripsPage });
type View = "Upcoming" | "In Transit" | "Completed" | "Cancelled / Refunds";
const FILTERS: View[] = ["Upcoming", "In Transit", "Completed", "Cancelled / Refunds"];

function MyTripsPage() {
  const { user, isPending } = useCurrentUserState();
  const [view, setView] = useState<View>("Upcoming");
  const [pnr, setPnr] = useState("");
  const [flight, setFlight] = useState("");
  const validPnr = /^\d{10}$/.test(pnr.trim());
  const validFlight = /^[A-Z0-9]{2,3}[- ]?\d{1,4}$/i.test(flight.trim());
  return (
    <CustomerShell>
      <div className="min-h-dvh bg-slate-50 px-4 py-6 pb-32 text-slate-900">
        <div className="mx-auto max-w-5xl space-y-5">
          <header className="rounded-3xl border border-amber-300/30 bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 p-6 text-white shadow-xl">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.17em] text-amber-300"><Crown className="size-5" /> OrderKing Travel</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight">My Trips</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-200">Your place for verified bookings, travel documents and updates—once connected to an authorized travel provider.</p>
            <p className="mt-3 flex items-center gap-2 text-xs text-amber-200"><ShieldCheck className="size-4" /> No unverified tickets or confirmation claims</p>
          </header>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="Travel bookings">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold">Booking history</h2>
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
            <div className="mt-4 rounded-2xl bg-slate-50 p-6 text-center">
              <FileText className="mx-auto size-10 text-slate-400" />
              <h3 className="mt-3 font-semibold">No verified {view.toLowerCase()} bookings connected</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                {isPending ? "Checking account..." : !user
                  ? "Sign in to prepare your private trip centre."
                  : "There is no authorized airline, railway, hotel or bus booking ledger connected yet. We will not fabricate a ticket."}
              </p>
              <Link to={user ? "/travel" : "/login"}
                className="mt-4 inline-flex rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white no-underline">
                {user ? "Explore Travel" : "Sign in"}
              </Link>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2" aria-label="Check travel references">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 font-bold"><TrainFront className="size-5 text-emerald-700" /> Train PNR</h2>
              <label htmlFor="trip-pnr" className="mt-3 block text-xs font-medium text-slate-600">10-digit Indian Railways PNR</label>
              <input id="trip-pnr" type="text" inputMode="numeric" maxLength={10} value={pnr} onChange={(e) => setPnr(e.target.value.replace(/\D/g,""))}
                placeholder="Enter your PNR" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600" />
              <p className="mt-2 text-xs text-slate-500">PNR data is not connected to OrderKing. Check the status through the official IRCTC site.</p>
              <a href="https://www.irctc.co.in/nget/train-search" target="_blank" rel="noopener noreferrer"
                className="mt-3 inline-flex rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white no-underline">
                Open official railway portal
              </a>
              {pnr && !validPnr && <p className="mt-2 text-xs text-amber-700">Please enter exactly 10 digits.</p>}
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 font-bold"><Plane className="size-5 text-emerald-700" /> Flight reference</h2>
              <label htmlFor="trip-flight" className="mt-3 block text-xs font-medium text-slate-600">Airline and flight number</label>
              <input id="trip-flight" type="text" maxLength={14} value={flight} onChange={(e) => setFlight(e.target.value.toUpperCase())}
                placeholder="e.g. 6E204, AI805" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600" />
              <p className="mt-2 text-xs text-slate-500">Live flight gates and delay data require a licensed airline/flight-status provider.</p>
              <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-slate-600"><Clock3 className="size-4" /> Live lookup not connected</p>
              {flight && !validFlight && <p className="mt-2 text-xs text-amber-700">Use a valid airline code and flight number.</p>}
            </div>
          </section>

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-600">
            <p className="flex gap-2"><XCircle className="size-4 shrink-0 text-slate-500" />
              E-tickets, GST invoices, check-in links, rescheduling and refund tracking become available only after a verified booking and provider integration.
            </p>
            <Link to="/support" className="mt-2 inline-block font-semibold text-emerald-800 underline">Customer support</Link>
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}
