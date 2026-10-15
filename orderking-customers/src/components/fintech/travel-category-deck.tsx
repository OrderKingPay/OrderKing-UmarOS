import { useState } from "react";
import { BusFront, CarFront, ChevronDown, ChevronRight, Compass, Hotel, Plane, ShieldCheck, TrainFront } from "lucide-react";
import { Link } from "@tanstack/react-router";

type Category = "flights" | "trains" | "hotels" | "buses" | "cabs" | "packages";
type Item = { name: string; detail: string };
type TravelGroup = { id: Category; name: string; icon: typeof Plane; options: Item[]; connected: boolean };
const OPTIONS: TravelGroup[] = [
  { id:"flights",name:"Flights",icon:Plane,connected:false,options:[
    {name:"One-Way",detail:"Search route and departure"}, {name:"Round-Trip",detail:"Dates and cabin options"},
    {name:"Multi-City",detail:"Complex itineraries need provider integration"},
    {name:"Domestic Deals",detail:"No verified fare deal connected"},
    {name:"International",detail:"Partner airfare feed required"},
    {name:"Special Fares",detail:"Provider eligibility is required"},
    {name:"Web Check-In",detail:"Use your airline's official portal"},
  ]},
  { id:"trains",name:"Trains & Rail",icon:TrainFront,connected:false,options:[
    {name:"Book Train Tickets",detail:"IRCTC authorization required"},
    {name:"10-digit PNR Status",detail:"Official source only"},
    {name:"Train Running Status",detail:"Live feed not connected"},
    {name:"Seat Availability & Tatkal",detail:"Carrier data required"},
    {name:"Vande Bharat / Rajdhani / Shatabdi",detail:"Choose a station search"},
    {name:"Coach & Berth Map",detail:"Carrier layout feed required"},
  ]},
  { id:"hotels",name:"Hotels & Stays",icon:Hotel,connected:false,options:[
    {name:"5-Star & Heritage",detail:"Filter by verified listing when connected"},
    {name:"Value & Business",detail:"Compare rooms and cancellation terms"},
    {name:"Hourly Stays",detail:"Only properties with verified policies"},
    {name:"Villas & Homestays",detail:"Property availability feed required"},
    {name:"Pilgrimage Stays",detail:"Respect local property rules"},
    {name:"Couple-Friendly",detail:"Verify eligibility with the property"},
  ]},
  { id:"buses",name:"Buses & Sleepers",icon:BusFront,connected:false,options:[
    {name:"AC Sleeper",detail:"Operator feed required"},
    {name:"State RTC",detail:"ASTC, WBSTC, MSRTC, KSRTC, UPSRTC"},
    {name:"Overnight Intercity",detail:"Confirmed seats only with ticket provider"},
    {name:"Top-Rated Operators",detail:"Verified operator reviews required"},
  ]},
  { id:"cabs",name:"Cabs & Rentals",icon:CarFront,connected:false,options:[
    {name:"Airport Transfer",detail:"Confirmed provider required"},
    {name:"Outstation One-Way",detail:"Compare eligible routes"},
    {name:"Outstation Return",detail:"Verified local prices required"},
    {name:"Hourly City Rental",detail:"2–12h options subject to operator"},
    {name:"Self-Drive",detail:"Driver eligibility and insurance required"},
  ]},
  { id:"packages",name:"Packages & Travel Help",icon:Compass,connected:false,options:[
    {name:"Holiday Packages",detail:"Tour operator connection required"},
    {name:"Weekend Getaways",detail:"Explore ideas before booking"},
    {name:"Visa Concierge",detail:"Authorized advisor required"},
    {name:"Travel Insurance",detail:"Licensed insurer required"},
    {name:"Forex & Cards",detail:"Regulated provider required"},
  ]},
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
  const current = OPTIONS.find((v) => v.id === selected) ?? OPTIONS[0];

  return (
    <section aria-label="Travel category and subcategory explorer"
      className="overflow-hidden rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">Plan your journey</h2>
          <p className="mt-1 text-xs text-slate-500">Choose a category, then a service. We show only confirmed provider status.</p>
        </div>
        {onOpenTrips ? (
          <button
            type="button"
            onClick={onOpenTrips}
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold transition flex items-center gap-1 ${
              activeTab === "trips"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-emerald-900 text-white hover:bg-emerald-800"
            }`}
          >
            My Trips <ChevronRight className="inline size-3" />
          </button>
        ) : (
          <Link to="/travel/trips" className="shrink-0 rounded-full bg-emerald-900 px-3 py-2 text-xs font-bold text-white no-underline flex items-center gap-1">
            My Trips <ChevronRight className="inline size-3" />
          </Link>
        )}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {OPTIONS.map((v) => {
          const Icon = v.icon;
          return (
            <button key={v.id} type="button" aria-pressed={selected === v.id}
              onClick={() => {
                setSelected(v.id);
                setSub("");
                if (v.id === "flights" || v.id === "trains" || v.id === "hotels" || v.id === "cabs" || v.id === "buses") {
                  onChoose(v.id);
                }
              }}
              className={"flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border p-2 text-center text-[11px] font-bold transition " +
                (selected === v.id ? "border-emerald-700 bg-emerald-900 text-white" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-400")}>
              <Icon className="size-5" /> {v.name}
            </button>
          );
        })}
      </div>
      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <h3 className="text-sm font-bold text-slate-900">Explore {current?.name || "Travel"}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {(current?.options || []).map((item) => (
            <button key={item.name} type="button" aria-pressed={sub === item.name}
              onClick={() => setSub(sub === item.name ? "" : item.name)}
              className={"rounded-full border px-3 py-2 text-xs font-semibold transition " +
                (sub === item.name ? "border-emerald-800 bg-emerald-800 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-400")}>
              {item.name}
            </button>
          ))}
        </div>
        {sub && (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-white p-3 text-xs text-emerald-900" role="status">
            <ShieldCheck className="mr-1 inline size-4" />
            {current?.options?.find((item) => item.name === sub)?.detail || "Carrier verification in progress"}. Live booking and fare confirmation require an approved partner.
          </p>
        )}
      </div>
    </section>
  );
}
