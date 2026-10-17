import { Link } from "@tanstack/react-router";
import {
  Utensils,
  Bike,
  Sparkles,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Plane,
  ExternalLink,
} from "lucide-react";

interface SmartZeroDeliveryFallbackCardProps {
  className?: string;
  cityName?: string;
}

export function SmartZeroDeliveryFallbackCard({
  className = "",
  cityName,
}: SmartZeroDeliveryFallbackCardProps) {
  const currentCity = cityName && cityName !== "Locating..." ? cityName : "your area";

  return (
    <div
      data-testid="zero-delivery-smart-fallback"
      className={`relative overflow-hidden rounded-3xl border border-amber-300/80 bg-gradient-to-br from-[#FFFDF9] via-white to-amber-50/60 p-6 sm:p-8 text-center shadow-lg ${className}`}
    >
      {/* Background ambient radial aura */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-72 h-72 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-72 h-72 rounded-full bg-sky-400/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto space-y-6">
        {/* Badge & Icon */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white shadow-md shadow-amber-500/25">
            <MapPin className="size-7" />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/90 border border-amber-300/80 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-950">
            <Sparkles className="size-3 text-amber-600 fill-amber-500" />
            <span>0 places delivering right now · Expanding to {currentCity}</span>
          </span>
        </div>

        {/* Heading & Smart Monetization Fallback Copy */}
        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            Food Delivery arriving soon in {currentCity}!
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 max-w-2xl mx-auto leading-relaxed font-medium">
            While on-demand rider dispatch is launching in your zone, experience verified culinary privileges with table reservations, join our courier fleet, or explore travel portals with zero markups.
          </p>
        </div>

        {/* 3 High-Converting Monetization Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-left">
          {/* Pillar 1: Reserve a Table with Dining Out */}
          <div className="flex flex-col justify-between p-5 rounded-2xl border border-sky-200/90 bg-white hover:border-sky-400 hover:shadow-md transition-all duration-200">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-700">
                  <Utensils className="size-5" />
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300">
                  0% INVENTORY RISK
                </span>
              </div>
              <h4 className="font-black text-base text-stone-900">
                Reserve a Table with Dining Out
              </h4>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                Direct links to dining experiences where the platform earns convenience fees with zero food inventory risk. Enjoy table reservations and chef seating.
              </p>
            </div>
            <Link
              to="/dining"
              className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all no-underline"
            >
              <span>Reserve a Table</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {/* Pillar 2: Earn with Order King */}
          <div className="flex flex-col justify-between p-5 rounded-2xl border border-amber-200/90 bg-white hover:border-amber-400 hover:shadow-md transition-all duration-200">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700">
                  <Bike className="size-5" />
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  RIDER ONBOARDING
                </span>
              </div>
              <h4 className="font-black text-base text-stone-900">
                Earn with Order King
              </h4>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                Recruiting delivery partners in new zones. Earn daily payouts, monsoon hardship bonuses, and keep 100% of customer tips as a courier partner.
              </p>
            </div>
            <Link
              to="/join-fleet"
              className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-105 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all no-underline"
            >
              <span>Join Courier Fleet</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {/* Pillar 3: Travel & Flight Concierge */}
          <div className="flex flex-col justify-between p-5 rounded-2xl border border-emerald-200/90 bg-white hover:border-emerald-400 hover:shadow-md transition-all duration-200">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700">
                  <Plane className="size-5" />
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  AFFILIATE PORTALS
                </span>
              </div>
              <h4 className="font-black text-base text-stone-900">
                Travel &amp; Flight Concierge
              </h4>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                Clean direct affiliate deep-links earning affiliate revenue without any fake booking engines or mock PNRs. Real carrier fare comparisons.
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                to="/travel"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all no-underline"
              >
                <span>Travel Hub &amp; Flights</span>
                <ArrowRight className="size-3.5" />
              </Link>
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <a
                  href="https://www.skyscanner.co.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100/70 py-1.5 text-[11px] font-bold text-emerald-900 transition-colors no-underline"
                >
                  <span>Skyscanner</span>
                  <ExternalLink className="size-3 text-emerald-700" />
                </a>
                <a
                  href="https://www.makemytrip.com/flights/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100/70 py-1.5 text-[11px] font-bold text-emerald-900 transition-colors no-underline"
                >
                  <span>MakeMyTrip</span>
                  <ExternalLink className="size-3 text-emerald-700" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Regulatory & Direct Privileges Trust Strip */}
        <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-stone-500 font-medium">
          <ShieldCheck className="size-3.5 text-emerald-600" />
          <span>FSSAI Certified Direct Partner Kitchens · Verified Table Bookings · Official Affiliate Direct Links</span>
        </div>
      </div>
    </div>
  );
}
