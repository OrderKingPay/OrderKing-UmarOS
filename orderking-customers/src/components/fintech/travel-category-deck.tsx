import { useState, useEffect } from "react";
import { BusFront, CarFront, ChevronRight, Compass, Hotel, Plane, ShieldCheck, TrainFront } from "lucide-react";
import { Link } from "@tanstack/react-router";

type Category = "flights" | "trains" | "hotels" | "buses" | "cabs" | "packages";
type Item = { name: string; detail: string };
type TravelGroup = { id: Category; name: string; icon: typeof Plane; options: Item[]; connected: boolean };

const OPTIONS: TravelGroup[] = [
  {
    id: "flights",
    name: "Flights",
    icon: Plane,
    connected: true,
    options: [
      { name: "Domestic Flights", detail: "IndiGo, Air India, Akasa & SpiceJet with 0% platform fee" },
      { name: "International", detail: "Direct & connecting long-haul sectors with live GDS fares" },
      { name: "Student & Defence", detail: "Concession fares with eligible baggage allowance" },
      { name: "Web Check-In", detail: "Official airline web check-in & boarding pass retrieval" },
      { name: "Round-Trip", detail: "Multi-sector air itineraries with zero convenience markup" },
    ],
  },
  {
    id: "trains",
    name: "Trains & Rail",
    icon: TrainFront,
    connected: true,
    options: [
      { name: "Search Trains", detail: "Official Indian Railways train schedules & seat availability" },
      { name: "10-Digit PNR Status", detail: "CRIS live charting & confirmation probability" },
      { name: "Vande Bharat Express", detail: "Premium high-speed superfast rail network" },
      { name: "Tatkal & Premium Tatkal", detail: "Official morning Tatkal quota timing guide" },
      { name: "Coach & Berth Map", detail: "Rake composition, coach position & berth layouts" },
    ],
  },
  {
    id: "hotels",
    name: "Hotels & Stays",
    icon: Hotel,
    connected: true,
    options: [
      { name: "5-Star & Heritage", detail: "Curated luxury hotels, Taj & Oberoi palace stays" },
      { name: "Verified Business", detail: "Corporate hotels with GST invoice billing support" },
      { name: "Family Homestays", detail: "Private pool villas and serviced family accommodations" },
      { name: "Budget Stays", detail: "Value stays under ₹1,999 near transport hubs" },
    ],
  },
  {
    id: "buses",
    name: "Buses & Sleepers",
    icon: BusFront,
    connected: true,
    options: [
      { name: "AC Sleepers", detail: "2+1 multi-axle luxury sleeper interstate coaches" },
      { name: "State RTCs", detail: "KSRTC, MSRTC, UPSRTC & GSRTC official bus services" },
      { name: "Volvo & BharatBenz", detail: "Premium road travel with verified onboard amenities" },
      { name: "Overnight Corridors", detail: "Express overnight tourist and business routes" },
    ],
  },
  {
    id: "cabs",
    name: "Cabs & Rentals",
    icon: CarFront,
    connected: true,
    options: [
      { name: "Airport Transfer", detail: "Fixed-rate flight-tracked airport pickup & drop" },
      { name: "Outstation Round-Trip", detail: "Dedicated chauffeur sedans & SUVs billed at actuals" },
      { name: "Hourly City Rental", detail: "Flexible 4h/40km, 8h/80km & 12h/120km packages" },
    ],
  },
  {
    id: "packages",
    name: "Highway & Charters",
    icon: Compass,
    connected: true,
    options: [
      { name: "NETC FASTag", detail: "Official bank FASTag recharge portal directory" },
      { name: "Highway Toll Estimator", detail: "NHAI national toll plaza outlay calculations" },
      { name: "VIP Jet Charters", detail: "Private aviation & executive helicopter concierge" },
    ],
  },
];

export function TravelCategoryDeck({
  onChoose,
  onOpenTrips,
  activeTab,
}: {
  onChoose: (id: "flights" | "trains" | "hotels" | "cabs" | "buses") => void;
  onOpenTrips?: () => void;
  activeTab?: string;
}) {
  const [selected, setSelected] = useState<Category>(
    activeTab && (["flights", "trains", "hotels", "buses", "cabs"] as const).includes(activeTab as any)
      ? (activeTab as Category)
      : "flights"
  );
  const [sub, setSub] = useState<string>("");

  useEffect(() => {
    if (activeTab && (["flights", "trains", "hotels", "buses", "cabs"] as const).includes(activeTab as any)) {
      setSelected(activeTab as Category);
    }
  }, [activeTab]);

  const current = OPTIONS.find((v) => v.id === selected) ?? OPTIONS[0];

  const handleSelectCategory = (catId: Category) => {
    setSelected(catId);
    setSub("");
    if (catId === "flights" || catId === "trains" || catId === "hotels" || catId === "cabs" || catId === "buses") {
      onChoose(catId);
    }
  };

  return (
    <section
      aria-label="Travel Category Explorer"
      className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-5 shadow-xs"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Travel Categories &amp; Services
            </h2>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-black text-emerald-700 hidden sm:inline-flex">
              0% Intermediary Fee
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare live tariffs across airlines, Indian Railways, intercity buses and stays.
          </p>
        </div>
        {onOpenTrips ? (
          <button
            type="button"
            onClick={onOpenTrips}
            className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition flex items-center gap-1.5 border ${
              activeTab === "trips"
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <span>My Bookings</span>
            <ChevronRight className="size-3.5" />
          </button>
        ) : (
          <Link
            to="/travel/trips"
            className="shrink-0 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white no-underline flex items-center gap-1.5"
          >
            <span>My Bookings</span>
            <ChevronRight className="size-3.5" />
          </Link>
        )}
      </div>

      <div className="mt-3.5 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {OPTIONS.map((v) => {
          const Icon = v.icon;
          const isSelected = selected === v.id;
          return (
            <button
              key={v.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handleSelectCategory(v.id)}
              className={`flex min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-xl border p-2 text-center text-xs font-bold transition ${
                isSelected
                  ? "border-sky-600 bg-slate-900 text-white shadow-xs"
                  : "border-slate-200 bg-slate-50/80 text-slate-700 hover:border-sky-400 hover:bg-sky-50/50"
              }`}
            >
              <Icon className={`size-4.5 ${isSelected ? "text-sky-300" : "text-slate-600"}`} />
              <span className="leading-tight">{v.name}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
            {current?.name} Quick Options
          </span>
          <span className="text-[10px] font-bold text-sky-600">
            Click to configure sector
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(current?.options || []).map((item) => {
            const isSubSelected = sub === item.name;
            return (
              <button
                key={item.name}
                type="button"
                aria-pressed={isSubSelected}
                onClick={() => {
                  setSub(isSubSelected ? "" : item.name);
                  if (selected === "flights" || selected === "trains" || selected === "hotels" || selected === "cabs" || selected === "buses") {
                    onChoose(selected);
                  }
                }}
                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                  isSubSelected
                    ? "border-sky-600 bg-sky-600 text-white shadow-xs font-bold"
                    : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50/40"
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </div>
        {sub && (
          <div className="mt-2.5 rounded-lg border border-sky-200 bg-sky-50/60 p-2.5 text-xs text-sky-950 flex items-start gap-2" role="status">
            <ShieldCheck className="size-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-black text-sky-900">{sub}:</strong>{" "}
              <span>{current?.options?.find((item) => item.name === sub)?.detail}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
