import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Plane, TrainFront, MapPin, Check, Search } from "lucide-react";
import airportCatalog from "./airports.json";
import stationCatalog from "./stations.json";

export interface AirportItem {
  code: string;
  name: string;
  city: string;
  country: string;
  isInternational?: boolean;
}

export interface StationItem {
  code: string;
  name: string;
  city: string;
}

const TOP_AIRPORTS: readonly string[] = ["DEL", "BOM", "BLR", "HYD", "CCU", "MAA", "GAU", "GOI", "AMD", "COK"];
const TOP_STATIONS: readonly string[] = ["NDLS", "CSMT", "HWH", "SBC", "MAS", "GHY", "SCL", "PNBE", "ADI", "CNB"];

/**
 * Filter & rank airports based on query
 */
export function queryAirports(rawQuery: string, limit = 8): AirportItem[] {
  const clean = rawQuery.replace(/\s*\([A-Z]{3}\).*$/, "").trim().toLowerCase();
  if (!clean) {
    return (airportCatalog as AirportItem[])
      .filter((a) => TOP_AIRPORTS.includes(a.code))
      .slice(0, limit);
  }

  const scored: { item: AirportItem; score: number }[] = [];

  for (const a of airportCatalog as AirportItem[]) {
    if (!a.code) continue;
    const codeLower = a.code.toLowerCase();
    const cityLower = (a.city || "").toLowerCase();
    const nameLower = (a.name || "").toLowerCase();

    let score = 0;
    if (codeLower === clean) score = 100;
    else if (codeLower.startsWith(clean)) score = 90;
    else if (cityLower.startsWith(clean)) score = 80;
    else if (cityLower.includes(clean)) score = 65;
    else if (nameLower.startsWith(clean)) score = 50;
    else if (nameLower.includes(clean)) score = 35;
    else if (codeLower.includes(clean)) score = 25;

    if (score > 0) {
      // Prioritize Indian domestic hubs if tie
      if (a.country === "IN" || a.country === "India") score += 5;
      scored.push({ item: a, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.item);
}

/**
 * Filter & rank train stations based on query
 */
export function queryStations(rawQuery: string, limit = 8): StationItem[] {
  const clean = rawQuery.replace(/\s*\([A-Z0-9]{2,5}\).*$/, "").trim().toLowerCase();
  if (!clean) {
    return (stationCatalog as StationItem[])
      .filter((s) => TOP_STATIONS.includes(s.code))
      .slice(0, limit);
  }

  const scored: { item: StationItem; score: number }[] = [];

  for (const s of stationCatalog as StationItem[]) {
    if (!s.code) continue;
    const codeLower = s.code.toLowerCase();
    const nameLower = (s.name || "").toLowerCase();
    const cityLower = (s.city || "").toLowerCase();

    let score = 0;
    if (codeLower === clean) score = 100;
    else if (codeLower.startsWith(clean)) score = 90;
    else if (nameLower.startsWith(clean)) score = 80;
    else if (cityLower.startsWith(clean)) score = 75;
    else if (nameLower.includes(clean)) score = 60;
    else if (cityLower.includes(clean)) score = 45;
    else if (codeLower.includes(clean)) score = 30;

    if (score > 0) {
      scored.push({ item: s, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.item);
}

interface AutoSuggestProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  theme?: "dark" | "light";
  className?: string;
  inputClassName?: string;
  onSelect?: (formatted: string) => void;
}

/**
 * Human-style Floating Auto-suggest for Flights / Airports
 */
export function AirportAutoSuggest({
  value,
  onChange,
  placeholder = "Search airport, city or code (e.g. Del, Gau)...",
  ariaLabel = "Airport Search",
  theme = "dark",
  className = "",
  inputClassName = "",
  onSelect,
}: AutoSuggestProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => queryAirports(value), [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleSelect = useCallback(
    (airport: AirportItem) => {
      const formatted = `${airport.city} (${airport.code})`;
      onChange(formatted);
      onSelect?.(formatted);
      setIsOpen(false);
      inputRef.current?.blur();
    },
    [onChange, onSelect]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions[highlightIndex]) {
        handleSelect(suggestions[highlightIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const isDark = theme === "dark";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightIndex(0);
          }}
          onFocus={() => {
            setIsOpen(true);
            setHighlightIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          role="combobox"
          autoComplete="off"
          className={
            inputClassName ||
            (isDark
              ? "w-full h-10 px-3 pr-8 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-bold focus:border-amber-400 outline-none transition placeholder:text-slate-500"
              : "w-full h-10 px-3 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:border-sky-500 outline-none transition placeholder:text-slate-400")
          }
        />
        <Plane
          className={`size-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${
            isDark ? "text-amber-400/70" : "text-sky-600/70"
          }`}
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          role="listbox"
          className={`absolute left-0 right-0 z-50 mt-1 max-h-72 overflow-y-auto rounded-2xl p-1.5 shadow-2xl border backdrop-blur-md transition-all animate-in fade-in zoom-in-95 duration-100 ${
            isDark
              ? "bg-slate-950/95 border-slate-700 text-white shadow-black/60 divide-y divide-slate-800/40"
              : "bg-white/95 border-slate-200 text-slate-900 shadow-slate-400/30 divide-y divide-slate-100"
          }`}
        >
          <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider flex items-center justify-between text-muted-foreground opacity-60">
            <span>Airports &amp; Cities</span>
            <span>1-Tap Select</span>
          </div>

          {suggestions.map((airport, idx) => {
            const isHighlighted = idx === highlightIndex;
            const isSelected = value.includes(`(${airport.code})`);

            return (
              <button
                key={airport.code + airport.name}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(airport);
                }}
                onMouseEnter={() => setHighlightIndex(idx)}
                className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between gap-2.5 transition text-xs cursor-pointer ${
                  isHighlighted
                    ? isDark
                      ? "bg-amber-400/15 text-amber-200"
                      : "bg-sky-50 text-sky-900"
                    : isDark
                    ? "hover:bg-slate-800/60 text-slate-200"
                    : "hover:bg-slate-50 text-slate-800"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`font-mono font-black text-[11px] px-2 py-0.5 rounded-md border shrink-0 ${
                      isDark
                        ? "bg-amber-400/20 text-amber-300 border-amber-400/30"
                        : "bg-sky-100 text-sky-800 border-sky-200"
                    }`}
                  >
                    {airport.code}
                  </span>
                  <div className="truncate">
                    <p className="font-bold truncate text-xs">
                      {airport.city}
                      <span className="opacity-60 font-normal ml-1">· {airport.country}</span>
                    </p>
                    <p className="text-[10px] opacity-70 truncate font-medium">
                      {airport.name}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <Check
                    className={`size-3.5 shrink-0 ${
                      isDark ? "text-amber-400" : "text-sky-600"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Human-style Floating Auto-suggest for Railway Stations
 */
export function StationAutoSuggest({
  value,
  onChange,
  placeholder = "Search station or code (e.g. NDLS, Sil, HWH)...",
  ariaLabel = "Station Search",
  theme = "dark",
  className = "",
  inputClassName = "",
  onSelect,
}: AutoSuggestProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => queryStations(value), [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleSelect = useCallback(
    (station: StationItem) => {
      const formatted = `${station.name} (${station.code})`;
      onChange(formatted);
      onSelect?.(formatted);
      setIsOpen(false);
      inputRef.current?.blur();
    },
    [onChange, onSelect]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions[highlightIndex]) {
        handleSelect(suggestions[highlightIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const isDark = theme === "dark";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightIndex(0);
          }}
          onFocus={() => {
            setIsOpen(true);
            setHighlightIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          role="combobox"
          autoComplete="off"
          className={
            inputClassName ||
            (isDark
              ? "w-full h-10 px-3 pr-8 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-bold focus:border-amber-400 outline-none transition placeholder:text-slate-500"
              : "w-full h-10 px-3 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:border-indigo-500 outline-none transition placeholder:text-slate-400")
          }
        />
        <TrainFront
          className={`size-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${
            isDark ? "text-amber-400/70" : "text-indigo-600/70"
          }`}
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          role="listbox"
          className={`absolute left-0 right-0 z-50 mt-1 max-h-72 overflow-y-auto rounded-2xl p-1.5 shadow-2xl border backdrop-blur-md transition-all animate-in fade-in zoom-in-95 duration-100 ${
            isDark
              ? "bg-slate-950/95 border-slate-700 text-white shadow-black/60 divide-y divide-slate-800/40"
              : "bg-white/95 border-slate-200 text-slate-900 shadow-slate-400/30 divide-y divide-slate-100"
          }`}
        >
          <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider flex items-center justify-between text-muted-foreground opacity-60">
            <span>IRCTC Rail Stations</span>
            <span>1-Tap Select</span>
          </div>

          {suggestions.map((station, idx) => {
            const isHighlighted = idx === highlightIndex;
            const isSelected = value.includes(`(${station.code})`);

            return (
              <button
                key={station.code + station.name}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(station);
                }}
                onMouseEnter={() => setHighlightIndex(idx)}
                className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between gap-2.5 transition text-xs cursor-pointer ${
                  isHighlighted
                    ? isDark
                      ? "bg-amber-400/15 text-amber-200"
                      : "bg-indigo-50 text-indigo-900"
                    : isDark
                    ? "hover:bg-slate-800/60 text-slate-200"
                    : "hover:bg-slate-50 text-slate-800"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`font-mono font-black text-[11px] px-2 py-0.5 rounded-md border shrink-0 ${
                      isDark
                        ? "bg-amber-400/20 text-amber-300 border-amber-400/30"
                        : "bg-indigo-100 text-indigo-800 border-indigo-200"
                    }`}
                  >
                    {station.code}
                  </span>
                  <div className="truncate">
                    <p className="font-bold truncate text-xs">{station.name}</p>
                    <p className="text-[10px] opacity-70 truncate font-medium">
                      {station.city}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <Check
                    className={`size-3.5 shrink-0 ${
                      isDark ? "text-amber-400" : "text-indigo-600"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
