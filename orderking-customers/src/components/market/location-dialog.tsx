import * as Dialog from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  MapPin,
  Crosshair,
  Search,
  Sparkles,
  Check,
  Building2,
  Home as HomeIcon,
  Briefcase,
  X,
  ChevronRight,
  Crown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useT } from "@/components/providers";
import { listZones } from "@/lib/server/catalog";
import { useLocationStore, type SelectedLocation, type SavedAddress } from "@/lib/stores/location";
import { distanceKm } from "@/lib/geo";
import { trackAnalytics } from "@/lib/server/quote";
import { cn } from "@/lib/utils";

export interface MetroHub {
  city: string;
  cityId: string;
  badge: string;
  gradient: string;
  areas: {
    name: string;
    zoneId: string;
    tag: string;
    lat: number;
    lng: number;
  }[];
}

export const POPULAR_METRO_HUBS: MetroHub[] = [
  {
    city: "Delhi NCR",
    cityId: "del",
    badge: "Imperial Capital",
    gradient: "from-amber-500 to-orange-500",
    areas: [
      { name: "Connaught Place", zoneId: "del-cp", tag: "Mughlai & Chaat", lat: 28.6315, lng: 77.2167 },
      { name: "Hauz Khas", zoneId: "del-hk", tag: "Cafes & Global Bistro", lat: 28.5494, lng: 77.2001 },
      { name: "CyberHub Gurugram", zoneId: "del-ggn", tag: "Craft Grills & Sushi", lat: 28.4952, lng: 77.0895 },
      { name: "Sector 18 Noida", zoneId: "del-noida", tag: "Street Treats & Bakery", lat: 28.5708, lng: 77.3261 },
    ],
  },
  {
    city: "Mumbai",
    cityId: "mum",
    badge: "Coastal Metropolis",
    gradient: "from-blue-500 to-indigo-600",
    areas: [
      { name: "Bandra West", zoneId: "mum-bandra", tag: "Coastal, Seafood & Cafes", lat: 19.0600, lng: 72.8336 },
      { name: "Juhu", zoneId: "mum-juhu", tag: "Street Food & Fine Dine", lat: 19.1075, lng: 72.8263 },
      { name: "Colaba", zoneId: "mum-colaba", tag: "Heritage Cafes & Deli", lat: 18.9067, lng: 72.8147 },
      { name: "Powai", zoneId: "mum-powai", tag: "Gourmet Cloud Kitchens", lat: 19.1176, lng: 72.9060 },
    ],
  },
  {
    city: "Bengaluru",
    cityId: "blr",
    badge: "Garden Silicon City",
    gradient: "from-emerald-500 to-teal-600",
    areas: [
      { name: "Koramangala", zoneId: "blr-kor", tag: "Craft Burgers & Microbreweries", lat: 12.9352, lng: 77.6245 },
      { name: "Indiranagar", zoneId: "blr-ind", tag: "Artisanal Bakeries & Pan-Asian", lat: 12.9784, lng: 77.6408 },
      { name: "HSR Layout", zoneId: "blr-hsr", tag: "Healthy Bowls & South Indian", lat: 12.9121, lng: 77.6446 },
      { name: "Whitefield", zoneId: "blr-wf", tag: "Continental & Woodfired Pizza", lat: 12.9698, lng: 77.7500 },
    ],
  },
  {
    city: "Kolkata",
    cityId: "kolkata",
    badge: "City of Joy & Royal Feast",
    gradient: "from-rose-500 to-pink-600",
    areas: [
      { name: "Park Street", zoneId: "kol-park", tag: "Awadhi Biryani & Kathi Rolls", lat: 22.5510, lng: 88.3533 },
      { name: "Salt Lake Sector V", zoneId: "kol-saltlake", tag: "Cloud Kitchens & Quick Meals", lat: 22.5804, lng: 88.4378 },
      { name: "New Town", zoneId: "kol-newtown", tag: "Thalis & North Indian Specials", lat: 22.5867, lng: 88.4754 },
      { name: "Ballygunge", zoneId: "kol-bally", tag: "Authentic Bengali Cuisine", lat: 22.5280, lng: 88.3650 },
    ],
  },
  {
    city: "Hyderabad",
    cityId: "hyd",
    badge: "Nizami Culinary Heritage",
    gradient: "from-amber-600 to-yellow-600",
    areas: [
      { name: "Jubilee Hills", zoneId: "hyd-jubilee", tag: "Nizami Dum Biryani & Kebabs", lat: 17.4319, lng: 78.4073 },
      { name: "Banjara Hills", zoneId: "hyd-banjara", tag: "Fine Dining & Irani Chai", lat: 17.4156, lng: 78.4350 },
      { name: "Hitec City", zoneId: "hyd-hitec", tag: "Fast Gourmet & Asian Bowls", lat: 17.4474, lng: 78.3762 },
      { name: "Gachibowli", zoneId: "hyd-gachi", tag: "Late Night Delivery & Rolls", lat: 17.4401, lng: 78.3489 },
    ],
  },
  {
    city: "Pune",
    cityId: "pun",
    badge: "Cultural Capital of West",
    gradient: "from-purple-500 to-indigo-500",
    areas: [
      { name: "Koregaon Park", zoneId: "pun-kp", tag: "Bistros, Truffles & Desserts", lat: 18.5362, lng: 73.8940 },
      { name: "Baner", zoneId: "pun-baner", tag: "Maharashtrian Thalis & Burgers", lat: 18.5590, lng: 73.7868 },
      { name: "Viman Nagar", zoneId: "pun-vn", tag: "Student Hub & Street Delicacies", lat: 18.5679, lng: 73.9143 },
    ],
  },
  {
    city: "Chennai",
    cityId: "chn",
    badge: "Coastal Gateway",
    gradient: "from-teal-500 to-emerald-600",
    areas: [
      { name: "Nungambakkam", zoneId: "chn-nungam", tag: "Traditional Chettinad & Seafood", lat: 13.0604, lng: 80.2405 },
      { name: "Anna Nagar", zoneId: "chn-anna", tag: "Gourmet Grills & Filter Kaapi", lat: 13.0850, lng: 80.2101 },
      { name: "T. Nagar", zoneId: "chn-tnagar", tag: "Pure Veg Tiffin & Sweets", lat: 13.0418, lng: 80.2341 },
    ],
  },
];

export function LocationDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { t } = useT();
  const currentLocation = useLocationStore((s) => s.location);
  const setLocation = useLocationStore((s) => s.setLocation);
  const savedAddresses = useLocationStore((s) => s.savedAddresses);
  const selectSavedAddress = useLocationStore((s) => s.selectSavedAddress);

  const { data: zonesData } = useQuery({
    queryKey: ["zones"],
    queryFn: () => listZones(),
    staleTime: 1000 * 60 * 10,
  });

  const [locating, setLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMetroCity, setSelectedMetroCity] = useState<string>("Delhi NCR");

  const pickLocation = (loc: SelectedLocation) => {
    setLocation(loc);
    void trackAnalytics({
      data: { name: "location_selected", payload: { zoneId: loc.zoneId, cityId: loc.cityId } },
    });
    toast.success(`Delivery address set to ${loc.label || loc.cityName}`);
    onOpenChange(false);
  };

  const useGeo = async () => {
    if (!navigator.geolocation) {
      toast.error(t("location.geoDenied"));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };

        // 1. Live reverse geocode to real locality and city via BigDataCloud client API
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${here.lat}&longitude=${here.lng}&localityLanguage=en`
          );
          if (res.ok) {
            const geo = await res.json();
            const locality = geo.locality || geo.city || geo.principalSubdivision || "Local Area";
            const city = geo.city || geo.principalSubdivision || "India";
            const state = geo.principalSubdivision || "";
            const country = geo.countryName || "India";
            const label = locality !== city && city ? `${locality}, ${city}` : locality;
            const lineParts = [locality, city, state, country].filter(Boolean);
            const line1 = lineParts.filter((v, i, a) => a.indexOf(v) === i).join(", ");

            const zones = zonesData?.zones ?? [];
            const nearbyZone = zones.find((z) => distanceKm(here, { lat: z.lat, lng: z.lng }) <= 25);

            setLocating(false);
            pickLocation({
              cityId: nearbyZone ? nearbyZone.cityId : (geo.city || "in").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8),
              cityName: city,
              zoneId: nearbyZone ? nearbyZone.id : `geo-${locality.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
              zoneName: locality,
              label: label,
              line1: line1,
              lat: here.lat,
              lng: here.lng,
            });
            return;
          }
        } catch {
          // Network issue or offline: fallback to catalog zones or regional centroids
        }

        // 2. Check catalog zones if nearby (within 50 km)
        const zones = zonesData?.zones ?? [];
        if (zones.length > 0) {
          const nearest = [...zones].sort(
            (a, b) => distanceKm(here, { lat: a.lat, lng: a.lng }) - distanceKm(here, { lat: b.lat, lng: b.lng }),
          )[0]!;
          if (distanceKm(here, { lat: nearest.lat, lng: nearest.lng }) <= 50) {
            setLocating(false);
            pickLocation({
              cityId: nearest.cityId,
              cityName: nearest.cityName,
              zoneId: nearest.id,
              zoneName: nearest.name,
              label: nearest.name,
              line1: nearest.name,
              lat: here.lat,
              lng: here.lng,
            });
            return;
          }
        }

        // 3. Intelligent regional geographic resolution
        let resolvedCity = "Local Area";
        let resolvedZone = "Current Location";
        if (here.lat >= 24.0 && here.lat <= 26.5 && here.lng >= 91.5 && here.lng <= 94.0) {
          resolvedCity = "Assam";
          resolvedZone = "Barak Valley / Karimganj";
        } else if (here.lat >= 28.3 && here.lat <= 28.9 && here.lng >= 76.8 && here.lng <= 77.5) {
          resolvedCity = "Delhi NCR";
          resolvedZone = "Central Delhi";
        } else if (here.lat >= 18.8 && here.lat <= 19.3 && here.lng >= 72.7 && here.lng <= 73.1) {
          resolvedCity = "Mumbai";
          resolvedZone = "Mumbai Suburban";
        } else if (here.lat >= 12.8 && here.lat <= 13.2 && here.lng >= 77.4 && here.lng <= 77.8) {
          resolvedCity = "Bengaluru";
          resolvedZone = "Bengaluru Urban";
        } else if (here.lat >= 22.4 && here.lat <= 22.8 && here.lng >= 88.2 && here.lng <= 88.6) {
          resolvedCity = "Kolkata";
          resolvedZone = "Greater Kolkata";
        }

        setLocating(false);
        pickLocation({
          cityId: resolvedCity.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8),
          cityName: resolvedCity,
          zoneId: `geo-${resolvedZone.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          zoneName: resolvedZone,
          label: `${resolvedZone}, ${resolvedCity}`,
          line1: `${resolvedZone}, ${resolvedCity}, India`,
          lat: here.lat,
          lng: here.lng,
        });
      },
      () => {
        setLocating(false);
        toast.info("Using Connaught Place, New Delhi as default culinary zone.");
        pickLocation({
          cityId: "del",
          cityName: "New Delhi",
          zoneId: "del-cp",
          zoneName: "Connaught Place",
          label: "Connaught Place, New Delhi",
          line1: "Inner Circle, Connaught Place, New Delhi",
          lat: 28.6315,
          lng: 77.2167,
        });
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  // Filter metro hubs or areas based on search query
  const filteredAreas = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    const matches: { area: string; city: string; tag: string; cityId: string; zoneId: string; lat: number; lng: number }[] = [];

    for (const hub of POPULAR_METRO_HUBS) {
      for (const a of hub.areas) {
        if (
          a.name.toLowerCase().includes(q) ||
          hub.city.toLowerCase().includes(q) ||
          a.tag.toLowerCase().includes(q)
        ) {
          matches.push({
            area: a.name,
            city: hub.city,
            tag: a.tag,
            cityId: hub.cityId,
            zoneId: a.zoneId,
            lat: a.lat,
            lng: a.lng,
          });
        }
      }
    }
    return matches;
  }, [searchQuery]);

  const activeHub =
    POPULAR_METRO_HUBS.find((h) => h.city === selectedMetroCity) || POPULAR_METRO_HUBS[0]!;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-md transition-all animate-in fade-in duration-200" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-[32px] bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#F5EFEB] p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl border-t border-amber-300/40 md:inset-auto md:left-1/2 md:top-1/2 md:w-[32rem] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl md:border md:border-amber-300/60 select-none">
          {/* Header Bar */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-amber-900/10">
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 shadow-[0_4px_14px_rgba(245,158,11,0.35)] border border-amber-200">
                <Crown className="size-5 fill-slate-950" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300/60 leading-none">
                  Sovereign Delivery Hub
                </span>
                <Dialog.Title className="text-xl font-black tracking-tight text-gray-950 mt-0.5">
                  Choose Your Food Zone
                </Dialog.Title>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex size-8 items-center justify-center rounded-full bg-stone-200/60 hover:bg-stone-300 text-stone-700 transition active:scale-95 cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="size-4" />
            </button>
          </div>

          <p className="mt-2 text-xs text-stone-600 leading-relaxed font-medium">
            Explore authentic kitchens with <span className="font-bold text-amber-900">authentic menus</span> and <span className="font-bold text-emerald-800">direct chef delivery</span>.
          </p>

          {/* 1-Tap High-Accuracy GPS Auto-Detect Button */}
          <button
            type="button"
            onClick={() => void useGeo()}
            disabled={locating}
            className="mt-4 flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-4 py-3.5 text-white shadow-[0_6px_20px_rgba(5,150,105,0.3)] hover:shadow-[0_8px_25px_rgba(5,150,105,0.4)] transition-all active:scale-[0.98] cursor-pointer border border-emerald-400/50 group"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-white/20 text-white shadow-inner group-hover:rotate-12 transition-transform">
                <Crosshair className={cn("size-5", locating && "animate-spin")} />
              </div>
              <div className="text-left">
                <span className="text-xs sm:text-sm font-black tracking-tight block text-white">
                  {locating ? "Detecting Precise GPS Location..." : "Use Current GPS Location"}
                </span>
                <span className="text-[10px] text-emerald-100 font-semibold block">
                  Auto-detects nearest cloud kitchens in your radius
                </span>
              </div>
            </div>
            <span className="flex size-6 items-center justify-center rounded-full bg-white/20 text-white">
              <ChevronRight className="size-3.5 stroke-[3]" />
            </span>
          </button>

          {/* Live Search Input */}
          <div className="relative mt-3.5">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400 pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search area (e.g. Connaught Place, Bandra, Koramangala)..."
              className="h-11 rounded-2xl border-amber-300/70 bg-white/90 pl-10 pr-3.5 text-xs font-semibold text-stone-900 shadow-2xs focus:border-amber-500 focus:ring-2 focus:ring-amber-400/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Search Results if user is searching */}
          {filteredAreas !== null ? (
            <div className="mt-4 space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-stone-500">
                Matching Dining Areas ({filteredAreas.length})
              </span>
              {filteredAreas.length === 0 ? (
                /* Zero Dead-Ends Location Fallback */
                <div className="rounded-2xl border border-amber-300/80 bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-white p-4 shadow-sm space-y-3.5 animate-in fade-in duration-200">
                  <div className="flex items-start gap-2.5">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-900 border border-amber-300/60 font-bold">
                      📍
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-amber-950 uppercase tracking-tight">
                        Zero Dead-Ends Delivery Assistance
                      </h4>
                      <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                        Direct 25-minute hyper-local delivery is currently expanding to{" "}
                        <span className="font-bold text-stone-900 font-mono">"{searchQuery}"</span>.
                        Here are the <strong>3 nearest active culinary hubs</strong> delivering to your zone:
                      </p>
                    </div>
                  </div>

                  {/* 3 Nearest Active Culinary Hubs with KM distance */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-900/80 block">
                      Recommended Active Culinary Hubs
                    </span>
                    {(() => {
                      // Estimate reference coordinates
                      const pincodeDigits = searchQuery.replace(/\D/g, "");
                      let refLat = currentLocation?.lat ?? 28.6315;
                      let refLng = currentLocation?.lng ?? 77.2167;

                      if (pincodeDigits.length >= 2) {
                        const prefix = pincodeDigits.slice(0, 2);
                        if (prefix === "11") { refLat = 28.6139; refLng = 77.2090; }
                        else if (prefix === "12" || prefix === "13") { refLat = 28.4595; refLng = 77.0266; }
                        else if (prefix === "20") { refLat = 28.5355; refLng = 77.3910; }
                        else if (prefix === "40") { refLat = 19.0760; refLng = 72.8777; }
                        else if (prefix === "41") { refLat = 18.5204; refLng = 73.8567; }
                        else if (prefix === "50") { refLat = 17.3850; refLng = 78.4867; }
                        else if (prefix === "56") { refLat = 12.9716; refLng = 77.5946; }
                        else if (prefix === "60") { refLat = 13.0827; refLng = 80.2707; }
                        else if (prefix === "70") { refLat = 22.5726; refLng = 88.3639; }
                        else if (prefix === "78") { refLat = 26.1445; refLng = 91.7362; }
                      }

                      // Flatten all areas with computed distances
                      const allAreas = POPULAR_METRO_HUBS.flatMap((hub) =>
                        hub.areas.map((a) => {
                          const dist = distanceKm({ lat: refLat, lng: refLng }, { lat: a.lat, lng: a.lng });
                          return {
                            ...a,
                            city: hub.city,
                            cityId: hub.cityId,
                            distanceKm: dist,
                          };
                        })
                      );

                      // Sort and pick top 3 nearest
                      const nearestThree = allAreas.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 3);

                      return nearestThree.map((hub) => (
                        <button
                          key={`${hub.cityId}-${hub.zoneId}`}
                          type="button"
                          onClick={() =>
                            pickLocation({
                              cityId: hub.cityId,
                              cityName: hub.city,
                              zoneId: hub.zoneId,
                              zoneName: hub.name,
                              label: `${hub.name}, ${hub.city}`,
                              line1: `${hub.name}, ${hub.city} (${hub.distanceKm.toFixed(1)} km from ${searchQuery})`,
                              lat: hub.lat,
                              lng: hub.lng,
                            })
                          }
                          className="flex w-full items-center justify-between rounded-xl border border-amber-300/80 bg-white/95 p-2.5 text-left hover:border-amber-500 hover:bg-amber-100/40 transition shadow-2xs active:scale-[0.99] cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <MapPin className="size-4 text-emerald-600 shrink-0" />
                            <div>
                              <p className="text-xs font-black text-gray-950 flex items-center gap-1.5">
                                <span>{hub.name}</span>
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-1.5 py-0.2 rounded-full border border-amber-200">
                                  {hub.distanceKm < 1 ? "<1 km" : `${hub.distanceKm.toFixed(1)} km`}
                                </span>
                              </p>
                              <p className="text-[10px] text-stone-500">{hub.city} · {hub.tag}</p>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 shrink-0">
                            Select Hub →
                          </span>
                        </button>
                      ));
                    })()}
                  </div>

                  {/* Pre-Scheduled Orders & Packaged Pantry Delivery Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-amber-200/80">
                    <button
                      type="button"
                      onClick={() => {
                        const defaultHub = POPULAR_METRO_HUBS[0]!.areas[0]!;
                        pickLocation({
                          cityId: POPULAR_METRO_HUBS[0]!.cityId,
                          cityName: POPULAR_METRO_HUBS[0]!.city,
                          zoneId: defaultHub.zoneId,
                          zoneName: defaultHub.name,
                          label: `Pre-Scheduled: ${searchQuery}`,
                          line1: `Pre-scheduled courier slot to ${searchQuery}`,
                          lat: defaultHub.lat,
                          lng: defaultHub.lng,
                        });
                        toast.success(`Pre-Scheduled delivery enabled for ${searchQuery}! Orders will be dispatched in next scheduled batch.`);
                      }}
                      className="flex flex-col items-start p-2.5 rounded-xl border border-amber-400/80 bg-amber-50/70 hover:bg-amber-100/80 text-left transition shadow-2xs cursor-pointer group"
                    >
                      <span className="text-[11px] font-black text-amber-950 flex items-center gap-1">
                        <span>📅</span> Pre-Schedule Feast
                      </span>
                      <span className="text-[9.5px] text-stone-600 mt-0.5 leading-snug">
                        Schedule future bulk orders & catering slots from nearest active hubs.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const defaultHub = POPULAR_METRO_HUBS[0]!.areas[0]!;
                        pickLocation({
                          cityId: POPULAR_METRO_HUBS[0]!.cityId,
                          cityName: POPULAR_METRO_HUBS[0]!.city,
                          zoneId: defaultHub.zoneId,
                          zoneName: defaultHub.name,
                          label: `Packaged Pantry: ${searchQuery}`,
                          line1: `Ambient Pantry Delivery to ${searchQuery}`,
                          lat: defaultHub.lat,
                          lng: defaultHub.lng,
                        });
                        toast.success(`Switched to Packaged Pantry Delivery for ${searchQuery}! Courier dispatch active.`);
                      }}
                      className="flex flex-col items-start p-2.5 rounded-xl border border-emerald-400/80 bg-emerald-50/70 hover:bg-emerald-100/80 text-left transition shadow-2xs cursor-pointer group"
                    >
                      <span className="text-[11px] font-black text-emerald-950 flex items-center gap-1">
                        <span>📦</span> Packaged Pantry Delivery
                      </span>
                      <span className="text-[9.5px] text-stone-600 mt-0.5 leading-snug">
                        Direct pan-India delivery of artisanal masalas, tea, coffee & snacks.
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {filteredAreas.map((m) => (
                    <button
                      key={`${m.cityId}-${m.zoneId}`}
                      type="button"
                      onClick={() =>
                        pickLocation({
                          cityId: m.cityId,
                          cityName: m.city,
                          zoneId: m.zoneId,
                          zoneName: m.area,
                          label: `${m.area}, ${m.city}`,
                          line1: `${m.area}, ${m.city}`,
                          lat: m.lat,
                          lng: m.lng,
                        })
                      }
                      className="flex w-full items-center justify-between rounded-xl border border-amber-200/80 bg-white p-3 text-left hover:border-amber-400 hover:bg-amber-50/60 transition shadow-2xs active:scale-[0.99] cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin className="size-4 text-[#E23744] shrink-0" />
                        <div>
                          <p className="text-xs font-black text-gray-950">{m.area}</p>
                          <p className="text-[10.5px] text-stone-500">{m.city} · {m.tag}</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-stone-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Saved Addresses Section (if available) */}
              {savedAddresses.length > 0 && (
                <div className="mt-4 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 flex items-center gap-1">
                    <HomeIcon className="size-3 text-amber-700" /> Saved Addresses
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {savedAddresses.slice(0, 2).map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          selectSavedAddress(a.id);
                          onOpenChange(false);
                          toast.success(`Switched to ${a.title} (${a.area})`);
                        }}
                        className="flex flex-col items-start p-2.5 rounded-xl border border-amber-200/80 bg-white/90 hover:border-amber-400 hover:bg-amber-50/50 transition text-left shadow-2xs active:scale-95 cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 w-full">
                          {a.tag === "HOME" ? (
                            <HomeIcon className="size-3.5 text-amber-700 shrink-0" />
                          ) : (
                            <Briefcase className="size-3.5 text-blue-700 shrink-0" />
                          )}
                          <span className="text-xs font-black text-stone-900 truncate">{a.title}</span>
                          {currentLocation?.addressId === a.id && (
                            <span className="ml-auto size-2 rounded-full bg-emerald-500" />
                          )}
                        </div>
                        <span className="text-[10.5px] text-stone-500 truncate w-full mt-0.5">
                          {a.area}, {a.cityName}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Metro Cities Carousel Strip */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-black uppercase tracking-wider text-amber-900/80 flex items-center gap-1">
                    <Sparkles className="size-3 text-amber-600" /> Popular Food Metros
                  </span>
                  <span className="text-[10px] font-bold text-stone-500">PAN-India Active</span>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                  {POPULAR_METRO_HUBS.map((hub) => {
                    const isSelected = selectedMetroCity === hub.city;
                    return (
                      <button
                        key={hub.city}
                        type="button"
                        onClick={() => setSelectedMetroCity(hub.city)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all shadow-2xs shrink-0 select-none cursor-pointer active:scale-95",
                          isSelected
                            ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white border border-amber-500 shadow-[0_2px_8px_rgba(245,158,11,0.35)]"
                            : "bg-white hover:bg-amber-50 text-stone-800 border border-amber-200/80"
                        )}
                      >
                        <span>{hub.city}</span>
                        {isSelected && <Check className="size-3 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Areas inside selected Metro Hub */}
              <div className="mt-3 rounded-2xl border border-amber-200/80 bg-white/95 p-3.5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-stone-100">
                  <span className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                    <Building2 className="size-3.5 text-amber-700" />
                    {activeHub.city} Food Neighborhoods
                  </span>
                  <span className="text-[9.5px] font-extrabold uppercase tracking-wide text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                    {activeHub.badge}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {activeHub.areas.map((area) => {
                    const isCurrent =
                      currentLocation?.cityName?.toLowerCase().includes(activeHub.city.toLowerCase()) &&
                      currentLocation?.label?.toLowerCase().includes(area.name.toLowerCase());

                    return (
                      <button
                        key={area.zoneId}
                        type="button"
                        onClick={() =>
                          pickLocation({
                            cityId: activeHub.cityId,
                            cityName: activeHub.city,
                            zoneId: area.zoneId,
                            zoneName: area.name,
                            label: `${area.name}, ${activeHub.city}`,
                            line1: `${area.name}, ${activeHub.city}`,
                            lat: area.lat,
                            lng: area.lng,
                          })
                        }
                        className={cn(
                          "flex flex-col items-start p-2.5 rounded-xl border text-left transition-all active:scale-[0.98] cursor-pointer shadow-2xs",
                          isCurrent
                            ? "border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500"
                            : "border-stone-200/80 bg-[#FFFDF9] hover:border-amber-400 hover:bg-amber-50/60"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-black text-gray-950 truncate">{area.name}</span>
                          {isCurrent ? (
                            <span className="flex items-center gap-1 text-[9px] font-black text-emerald-800 bg-emerald-200/80 px-1.5 py-0.2 rounded-full">
                              Active
                            </span>
                          ) : (
                            <span className="text-[9px] font-black text-amber-800 bg-amber-100/70 px-1.5 py-0.2 rounded-full">
                              25m
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-stone-500 font-medium mt-0.5 truncate w-full">
                          {area.tag}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Bottom Security Assurance */}
          <div className="mt-4 pt-3 border-t border-amber-900/10 flex items-center justify-between text-[10.5px] text-stone-500 font-semibold">
            <span className="flex items-center gap-1 text-emerald-800">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              100% FSSAI-Licensed Partner Kitchens
            </span>
            <span className="text-amber-900 font-bold">Direct Kitchen Menu</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
