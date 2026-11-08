import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ChefHat, MapPin, Search } from "lucide-react";
import { LocationDialog } from "@/components/market/location-dialog";
import { useLocationStore } from "@/lib/stores/location";

/**
 * Authentic, customer-safe empty state when no restaurants deliver to the current location.
 */
export function RoyalDiscoveryShowcase() {
  const location = useLocationStore((s) => s.location);
  const [locationOpen, setLocationOpen] = useState(false);

  const areaName =
    location?.zoneName ||
    (location?.cityName && location.cityName !== "Locating..." ? location.cityName : "your location");

  return (
    <section
      aria-labelledby="orderking-no-kitchens-heading"
      aria-live="polite"
      className="relative isolate overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 shadow-xs sm:p-8"
    >
      <div className="flex flex-col items-center text-center max-w-md mx-auto">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/60 mb-4">
          <ChefHat className="size-7" />
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600 mb-2">
          <MapPin className="size-3 text-stone-500" />
          <span>{areaName}</span>
        </div>

        <h2 id="orderking-no-kitchens-heading" className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
          No restaurants delivering here yet
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
          We only list restaurants with confirmed menus and live delivery coverage. Change your delivery area to explore available restaurants.
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-2.5 w-full">
          <button
            type="button"
            onClick={() => setLocationOpen(true)}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 text-xs font-bold transition active:scale-95 cursor-pointer"
          >
            <MapPin className="size-3.5" />
            <span>Change location</span>
          </button>
          <Link
            to="/search"
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-stone-300 hover:bg-stone-50 px-4 py-2 text-xs font-bold text-gray-800 no-underline transition active:scale-95"
          >
            <Search className="size-3.5" />
            <span>Search dishes</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
      <LocationDialog open={locationOpen} onOpenChange={setLocationOpen} />
    </section>
  );
}
