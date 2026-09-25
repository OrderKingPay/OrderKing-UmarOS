import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MapPin, Search, TrainFront } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchRailStations, type RailStation } from "./indian-railway-stations";

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
    const keyword = input.trim();
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

  const suggestions = mode === "FLIGHT" ? remoteLocations : railLocations;

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
                ? loading ? "Searching airports and cities…" : "No live airport matches returned. Search by city, airport name or IATA code."
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
