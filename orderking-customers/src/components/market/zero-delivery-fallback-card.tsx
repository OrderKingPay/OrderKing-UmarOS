import { Link } from "@tanstack/react-router";
import { Utensils, QrCode, Bike, Sparkles, MapPin, ArrowRight, ShieldCheck } from "lucide-react";

interface SmartZeroDeliveryFallbackCardProps {
  className?: string;
  cityName?: string;
}

export function SmartZeroDeliveryFallbackCard({
  className = "",
  cityName,
}: SmartZeroDeliveryFallbackCardProps) {
  return (
    <div
      data-testid="zero-delivery-smart-fallback"
      className={`relative overflow-hidden rounded-3xl border border-amber-300/80 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/80 p-6 sm:p-8 text-center shadow-lg ${className}`}
    >
      {/* Background ambient radial aura */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 rounded-full bg-orange-400/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto space-y-4">
        {/* Badge & Icon */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white shadow-md shadow-amber-500/25">
            <MapPin className="size-7" />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300/80 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-950">
            <Sparkles className="size-3 text-amber-600 fill-amber-500" />
            <span>Expanding Fast{cityName ? ` · ${cityName}` : ""}</span>
          </span>
        </div>

        {/* Heading & Mandated Fallback Copy */}
        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            Food Delivery arriving soon in your area!
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto leading-relaxed font-medium">
            Food Delivery arriving soon in your area! In the meantime, explore instant table booking with dining privileges, split restaurant bills with KingPay UPI, or join our courier delivery fleet.
          </p>
        </div>

        {/* High-Margin Revenue Action Deck */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-left">
          {/* Action 1: Dining Out */}
          <Link
            to="/dining"
            className="group flex flex-col justify-between p-4 rounded-2xl border border-amber-200/90 bg-white hover:border-amber-400 hover:shadow-md transition-all duration-200 no-underline"
          >
            <div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 mb-2.5 group-hover:scale-105 transition-transform">
                <Utensils className="size-5" />
              </div>
              <h4 className="font-black text-sm text-stone-900 group-hover:text-amber-800 transition-colors">
                VIP Dining Privileges
              </h4>
              <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                Reserve tables at top verified restaurants with zero markups.
              </p>
            </div>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-black text-amber-700 group-hover:gap-1.5 transition-all">
              Book Table <ArrowRight className="size-3.5" />
            </span>
          </Link>

          {/* Action 2: KingPay Bill Split */}
          <Link
            to="/king-pay"
            className="group flex flex-col justify-between p-4 rounded-2xl border border-amber-200/90 bg-white hover:border-amber-400 hover:shadow-md transition-all duration-200 no-underline"
          >
            <div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 mb-2.5 group-hover:scale-105 transition-transform">
                <QrCode className="size-5" />
              </div>
              <h4 className="font-black text-sm text-stone-900 group-hover:text-emerald-800 transition-colors">
                KingPay UPI &amp; Bill Split
              </h4>
              <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                Generate BharatQR, split bills with friends, and track expenses.
              </p>
            </div>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-black text-emerald-700 group-hover:gap-1.5 transition-all">
              Launch KingPay <ArrowRight className="size-3.5" />
            </span>
          </Link>

          {/* Action 3: Join Courier Fleet */}
          <Link
            to="/join-fleet"
            className="group flex flex-col justify-between p-4 rounded-2xl border border-amber-200/90 bg-white hover:border-amber-400 hover:shadow-md transition-all duration-200 no-underline"
          >
            <div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/15 text-orange-700 mb-2.5 group-hover:scale-105 transition-transform">
                <Bike className="size-5" />
              </div>
              <h4 className="font-black text-sm text-stone-900 group-hover:text-orange-800 transition-colors">
                Join Delivery Fleet
              </h4>
              <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                Earn daily payouts, monsoon bonuses, and zero commission cuts.
              </p>
            </div>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-black text-orange-700 group-hover:gap-1.5 transition-all">
              Apply as Rider <ArrowRight className="size-3.5" />
            </span>
          </Link>
        </div>

        {/* Regulatory & Direct Privileges Trust Strip */}
        <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-stone-500 font-medium">
          <ShieldCheck className="size-3.5 text-emerald-600" />
          <span>FSSAI Certified Direct Partner Kitchens · 100% RBI Escrow Settlement</span>
        </div>
      </div>
    </div>
  );
}
