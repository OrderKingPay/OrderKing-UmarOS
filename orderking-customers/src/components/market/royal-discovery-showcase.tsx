import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ChefHat, Crown, MapPin, Search, ShieldCheck } from "lucide-react";
import { LocationDialog } from "@/components/market/location-dialog";
import { useLocationStore } from "@/lib/stores/location";

/**
 * Real, customer-safe empty state. Never substitute invented restaurants,
 * ratings, prices, delivery ETAs or coupon entitlements for unavailable data.
 */
export function RoyalDiscoveryShowcase() {
  const location = useLocationStore((s) => s.location);
  const [locationOpen, setLocationOpen] = useState(false);

  const areaName =
    location?.zoneName ||
    (location?.cityName && location.cityName !== "Locating..." ? location.cityName : "your area");

  return (
    <section
      aria-labelledby="orderking-no-kitchens-heading"
      aria-live="polite"
      className="relative isolate overflow-hidden rounded-[30px] border border-amber-400/30 bg-gradient-to-br from-[#0B1019] via-[#16141C] to-[#39260D] p-5 text-white shadow-[0_16px_45px_rgba(28,20,9,0.14)] sm:p-8"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 size-64 rounded-full bg-amber-400/15 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-16 size-72 rounded-full bg-rose-500/10 blur-3xl" />
      <div className="relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-200">
            <Crown aria-hidden="true" className="size-4" />
            OrderKing Food Discovery
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200">
            <MapPin aria-hidden="true" className="size-3.5" />
            {areaName}
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-amber-300/40 bg-gradient-to-br from-amber-300/25 to-yellow-700/10 shadow-lg">
            <ChefHat aria-hidden="true" className="size-7 text-amber-200" />
          </div>
          <div className="max-w-2xl">
            <h2 id="orderking-no-kitchens-heading" className="text-xl font-black tracking-tight text-white sm:text-2xl">
              No restaurants are available for ordering here yet.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">
              We only show kitchens when their real menus and ordering availability have been confirmed.
              You can change your delivery area or explore cuisines without placing an unavailable order.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-amber-200/90">
              No prices, offers, estimated delivery times or restaurant ratings are shown without real source data.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setLocationOpen(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-yellow-400 px-5 py-2.5 text-sm font-extrabold text-slate-950 transition-transform hover:brightness-110 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-100"
          >
            <MapPin aria-hidden="true" className="size-4" />
            Change delivery area
          </button>
          <Link
            to="/search"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/[0.08] px-5 py-2.5 text-sm font-bold text-white no-underline transition-colors hover:bg-white/[0.14] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-100"
          >
            <Search aria-hidden="true" className="size-4" />
            Explore cuisines
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        <div className="mt-6 grid gap-3 border-t border-white/15 pt-5 sm:grid-cols-2">
          <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-300">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber-200" />
            Restaurant details and menu prices must come from participating merchants.
          </p>
          <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-300">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber-200" />
            Checkout becomes available only where actual fulfilment is supported.
          </p>
        </div>
      </div>
      <LocationDialog open={locationOpen} onOpenChange={setLocationOpen} />
    </section>
  );
}
