import { Link } from "@tanstack/react-router";
import {
  Utensils,
  Bike,
  Sparkles,
  MapPin,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Train,
  CreditCard,
  Users,
} from "lucide-react";

interface SmartZeroDeliveryFallbackCardProps {
  className?: string;
  cityName?: string;
}

export function SmartZeroDeliveryFallbackCard({
  className = "",
  cityName,
}: SmartZeroDeliveryFallbackCardProps) {
  const currentCity = cityName && cityName !== "Locating..." ? cityName : "your sector";

  return (
    <div
      data-testid="zero-delivery-smart-fallback"
      className={`relative overflow-hidden rounded-3xl border border-amber-300/80 bg-gradient-to-br from-[#FFFDF9] via-white to-amber-50/60 p-6 sm:p-8 text-center shadow-lg ${className}`}
    >
      {/* Background ambient radial aura */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-72 h-72 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-72 h-72 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-6">
        {/* Badge & Icon */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white shadow-md shadow-amber-500/25">
            <MapPin className="size-7" />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/90 border border-amber-300/80 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-amber-950">
            <Sparkles className="size-3 text-amber-600 fill-amber-500" />
            <span>High-Utility Platform Services Active · Expanding to {currentCity}</span>
          </span>
        </div>

        {/* Heading & Service Overview */}
        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            OrderKing Core Services Available in {currentCity}
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 max-w-2xl mx-auto leading-relaxed font-medium">
            While on-demand rider dispatch is expanding in your immediate pincode, you can instantly use KingPay UPI &amp; Bill Splitting, check live IRCTC train PNR status with 0% convenience fees, or join our delivery fleet.
          </p>
        </div>

        {/* High-Converting Real Platform Services */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-left">
          {/* Service 1: KingPay UPI & Bill Splitting */}
          <div className="flex flex-col justify-between p-5 rounded-2xl border border-violet-200/90 bg-white hover:border-violet-400 hover:shadow-md transition-all duration-200">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-700">
                  <QrCode className="size-5" />
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-violet-100 text-violet-900 border border-violet-300">
                  0% UPI CHARGES
                </span>
              </div>
              <h4 className="font-black text-base text-stone-900">
                KingPay UPI &amp; Split Bills
              </h4>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                Scan any merchant QR, transfer money instantly via NPCI UPI intent, and split group food &amp; travel bills with friends seamlessly.
              </p>
            </div>
            <Link
              to="/king-pay"
              className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-105 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all no-underline"
            >
              <span>Open KingPay UPI</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {/* Service 2: IRCTC PNR Status & Train Live Tracker */}
          <div className="flex flex-col justify-between p-5 rounded-2xl border border-emerald-200/90 bg-white hover:border-emerald-400 hover:shadow-md transition-all duration-200">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700">
                  <Train className="size-5" />
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  0% CONVENIENCE FEE
                </span>
              </div>
              <h4 className="font-black text-base text-stone-900">
                IRCTC PNR Status &amp; Travel
              </h4>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                Check official 10-digit Indian Railways PNR status, coach berths, and train running positions. Sovereign travel engine with zero hidden markups.
              </p>
            </div>
            <Link
              to="/travel"
              className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all no-underline"
            >
              <span>Check IRCTC PNR Status</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {/* Service 3: Courier Fleet & Rider Openings */}
          <div className="flex flex-col justify-between p-5 rounded-2xl border border-amber-200/90 bg-white hover:border-amber-400 hover:shadow-md transition-all duration-200">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700">
                  <Bike className="size-5" />
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  HIRING PARTNERS
                </span>
              </div>
              <h4 className="font-black text-base text-stone-900">
                Join Delivery Fleet &amp; Earn
              </h4>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                Become an OrderKing delivery partner in your city. Daily direct UPI bank payouts, weather hardship bonuses, and 100% customer tips.
              </p>
            </div>
            <Link
              to="/join-fleet"
              className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-105 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all no-underline"
            >
              <span>Apply for Fleet Openings</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Regulatory & Direct Privileges Trust Strip */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-[11px] text-stone-500 font-medium">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-emerald-600" />
            <span>100% FSSAI Certified Kitchens</span>
          </span>
          <span>·</span>
          <span>NPCI Compliant UPI Rails</span>
          <span>·</span>
          <span>Official IRCTC PNR Verification</span>
        </div>
      </div>
    </div>
  );
}
