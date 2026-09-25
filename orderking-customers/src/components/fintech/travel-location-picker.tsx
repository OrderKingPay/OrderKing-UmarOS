import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MapPin, Search, TrainFront } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchRailStations, type RailStation } from "./indian-railway-stations";

const POPULAR_FLIGHT_LOCATIONS: TravelLocation[] = [
  { code:"IXS", name:"Silchar Airport", city:"Silchar", country:"India", subtype:"AIRPORT" },
  { code:"GAU", name:"Lokpriya Gopinath Bordoloi International Airport", city:"Guwahati", country:"India", subtype:"AIRPORT" },
  { code:"CCU", name:"Netaji Subhas Chandra Bose International Airport", city:"Kolkata", country:"India", subtype:"AIRPORT" },
  { code:"DEL", name:"Indira Gandhi International Airport", city:"New Delhi", country:"India", subtype:"AIRPORT" },
  { code:"BOM", name:"Chhatrapati Shivaji Maharaj International Airport", city:"Mumbai", country:"India", subtype:"AIRPORT" },
  { code:"BLR", name:"Kempegowda International Airport", city:"Bengaluru", country:"India", subtype:"AIRPORT" },
  { code:"HYD", name:"Rajiv Gandhi International Airport", city:"Hyderabad", country:"India", subtype:"AIRPORT" },
  { code:"MAA", name:"Chennai International Airport", city:"Chennai", country:"India", subtype:"AIRPORT" },
  { code:"AMD", name:"Sardar Vallabhbhai Patel International Airport", city:"Ahmedabad", country:"India", subtype:"AIRPORT" },
  { code:"PNQ", name:"Pune Airport", city:"Pune", country:"India", subtype:"AIRPORT" },
  { code:"GOI", name:"Manohar International Airport", city:"Goa", country:"India", subtype:"AIRPORT" },
  { code:"COK", name:"Cochin International Airport", city:"Kochi", country:"India", subtype:"AIRPORT" },
  { code:"JAI", name:"Jaipur International Airport", city:"Jaipur", country:"India", subtype:"AIRPORT" },
  { code:"LKO", name:"Chaudhary Charan Singh International Airport", city:"Lucknow", country:"India", subtype:"AIRPORT" },
  { code:"PAT", name:"Jay Prakash Narayan International Airport", city:"Patna", country:"India", subtype:"AIRPORT" },
  { code:"DXB", name:"Dubai International Airport", city:"Dubai", country:"United Arab Emirates", subtype:"AIRPORT" },
  { code:"SIN", name:"Singapore Changi Airport", city:"Singapore", country:"Singapore", subtype:"AIRPORT" },
  { code:"BKK", name:"Suvarnabhumi Airport", city:"Bangkok", country:"Thailand", subtype:"AIRPORT" },
  { code:"LHR", name:"Heathrow Airport", city:"London", country:"United Kingdom", subtype:"AIRPORT" },
  { code:"JFK", name:"John F. Kennedy International Airport", city:"New York", country:"United States", subtype:"AIRPORT" },
  { code:"CDG", name:"Charles de Gaulle Airport", city:"Paris", country:"France", subtype:"AIRPORT" },
  { code:"DOH", name:"Hamad International Airport", city:"Doha", country:"Qatar", subtype:"AIRPORT" },
  { code:"RUH", name:"King Khalid International Airport", city:"Riyadh", country:"Saudi Arabia", subtype:"AIRPORT" },
  { code:"JED", name:"King Abdulaziz International Airport", city:"Jeddah", country:"Saudi Arabia", subtype:"AIRPORT" },
  { code:"HND", name:"Haneda Airport", city:"Tokyo", country:"Japan", subtype:"AIRPORT" },
];



export type TravelLocation = {
  code: string;
  name: string;
  city?: string;
  country?: string;
  state?: string;
  subtype?: string;
};

type Props = {
  mode: "FLIGHT" | "TRAIN";
  value: TravelLocation | null;
  onChange: (location: TravelLocation | null) => void;
  label: string;
  placeholder: string;
};

function displayValue(location: TravelLocation) {
  return (location.city || location.name) + " (" + location.code + ")";
}

export function TravelLocationPicker({ mode, value, onChange, label, placeholder }: Props) {
  const [input, setInput] = useState(value ? displayValue(value) : "");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remoteLocations, setRemoteLocations] = useState<TravelLocation[]>([]);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setInput(value ? displayValue(value) : "");
  }, [value?.code, value?.name, value?.city]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    if (mode !== "FLIGHT") return;
    const keyword = input.trim().replace(/\s*\([A-Z0-9]{3,4}\)\s*$/i, "").trim();
    if (keyword.length < 2) {
      setRemoteLocations([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        const baseUrl = (import.meta.env.VITE_HDMASTER_API_BASE_URL || "https://hdmaster.vercel.app").replace(/\/$/, "");
        const query = new URLSearchParams({ mode, keyword });
        const response = await fetch(baseUrl + "/api/v1/travel/locations?" + query.toString(), {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        const data = await response.json();
        if (response.ok && Array.isArray(data.results)) {
          setRemoteLocations(data.results);
        } else {
          setRemoteLocations([]);
        }
      } catch {
        if (!controller.signal.aborted) setRemoteLocations([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [input, mode]);

  const railLocations = useMemo<TravelLocation[]>(() => {
    if (mode !== "TRAIN") return [];
    return searchRailStations(input, 12).map((station: RailStation) => ({
      code: station.code,
      name: station.name,
      city: station.city,
      state: station.state,
      subtype: "TRAIN_STATION_DIRECTORY",
    }));
  }, [input, mode]);

  const popularFlightLocations = useMemo<TravelLocation[]>(() => {
    if (mode !== "FLIGHT") return [];
    const q = input.trim().toLowerCase();
    if (q.length < 1) return POPULAR_FLIGHT_LOCATIONS.slice(0, 12);
    return POPULAR_FLIGHT_LOCATIONS
      .filter((location) =>
        location.code.toLowerCase().includes(q) ||
        location.name.toLowerCase().includes(q) ||
        location.city?.toLowerCase().includes(q) ||
        location.country?.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [input, mode]);

  const suggestions =
    mode === "FLIGHT"
      ? (remoteLocations.length > 0 ? remoteLocations : popularFlightLocations)
      : railLocations;

  const choose = (location: TravelLocation) => {
    onChange(location);
    setInput(displayValue(location));
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative space-y-1">
      <label className="text-[11px] font-bold text-muted uppercase">{label}</label>
      <div className="relative">
        {mode === "FLIGHT" ? (
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted" />
        ) : (
          <TrainFront className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted" />
        )}
        <input
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            onChange(null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          className="w-full rounded-xl border border-border bg-bg py-2 pl-9 pr-9 text-sm font-bold text-fg focus:border-primary focus:outline-none"
        />
        {loading && <Loader2 className="absolute right-3 top-2.5 size-4 animate-spin text-muted" />}
      </div>

      {open && (suggestions.length > 0 || input.trim().length >= 2) && (
        <div className="absolute z-40 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-border bg-surface shadow-2xl">
          {suggestions.length > 0 ? suggestions.map((location) => (
            <button
              key={mode + "-" + location.code + "-" + location.name}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(location)}
              className={cn(
                "flex w-full items-center gap-3 border-b border-border/60 px-3 py-2.5 text-left last:border-0",
                "hover:bg-surface-2 focus:bg-surface-2 focus:outline-none"
              )}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {mode === "FLIGHT" ? <MapPin className="size-4" /> : <TrainFront className="size-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-fg">
                  {location.city || location.name} <span className="font-mono text-muted">({location.code})</span>
                </span>
                <span className="block truncate text-[10px] text-muted">
                  {location.name}{location.state ? " · " + location.state : location.country ? " · " + location.country : ""}
                </span>
              </span>
            </button>
          )) : (
            <div className="px-3 py-4 text-center text-xs text-muted">
              {mode === "FLIGHT"
                ? loading
                  ? "Searching live airports and cities…"
                  : "No airport match found. Try an airport name, city or IATA code."
                : "No station matches in the local station directory."}
            </div>
          )}
        </div>
      )}

      {mode === "TRAIN" && (
        <p className="text-[9px] text-muted">
          Station suggestions are directory data. Live train availability, fares and platform information appear only from an authorized rail provider.
        </p>
      )}
    </div>
  );
}
