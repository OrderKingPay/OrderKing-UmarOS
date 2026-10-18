import { Link } from "@tanstack/react-router";
import {
  MapPin,
  Sparkles,
  Clock,
  Crown,
  Plane,
  GraduationCap,
  Store,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  CreditCard,
  Briefcase,
  Train,
} from "lucide-react";
import { useCartStore, cartCount } from "@/lib/stores/cart";
import { useLocationStore } from "@/lib/stores/location";

interface SmartZeroDeliveryFallbackCardProps {
  className?: string;
  cityName?: string;
}

export function SmartZeroDeliveryFallbackCard({
  className = "",
  cityName,
}: SmartZeroDeliveryFallbackCardProps) {
  const storeLocation = useLocationStore((s) => s.location);
  const items = useCartStore((s) => s.items) ?? [];
  const currentCartCount = cartCount(items);

  const currentCity =
    cityName && cityName !== "Locating..."
      ? cityName
      : storeLocation?.zoneName ||
        (storeLocation?.cityName && storeLocation.cityName !== "Locating..."
          ? storeLocation.cityName
          : "your area");

  const now = new Date();
  const hour = now.getHours();
  const isMealHour = hour >= 11 && hour < 22;
  const isNightHour = hour >= 22 || hour < 6;

  return (
    <section
      data-testid="zero-delivery-smart-fallback"
      aria-label="Alternative services in your area"
      className={`relative overflow-hidden rounded-3xl border border-amber-300/80 bg-gradient-to-br from-[#FFFDF9] via-white to-amber-50/60 p-5 sm:p-8 text-center shadow-md ${className}`}
    >
      {/* Background ambient radial aura */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-72 h-72 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-72 h-72 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto space-y-6">
        {/* Badge & Icon */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white shadow-md shadow-amber-500/25">
            <MapPin className="size-7" />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/90 border border-amber-300/80 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-amber-950">
            <Sparkles className="size-3 text-amber-600 fill-amber-500" />
            <span>Active Nationwide Services · Serving {currentCity}</span>
          </span>
        </div>

        {/* Heading & Service Overview */}
        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            OrderKing Services Available in {currentCity}
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 max-w-2xl mx-auto leading-relaxed font-medium">
            Hot food delivery from local restaurants is not currently active in this location. You can order non-perishable regional pantry goods, or use our financial, travel, and learning services below.
          </p>
        </div>

        {/* Hour-Aware Context Alert Strip */}
        <div className="rounded-2xl border border-amber-200/90 bg-white/90 p-3 sm:p-4 text-left flex items-start gap-3 shadow-2xs">
          <div className="size-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5 text-amber-800">
            <Clock className="size-4" />
          </div>
          <div className="text-xs leading-relaxed text-stone-700">
            {isMealHour ? (
              <p>
                <strong className="font-bold text-stone-900">11:00–22:00 Dining Window:</strong> While restaurant food delivery is not serving this address today, you can order authentic non-perishable regional food, traditional spices, and packaged pantry items from Mart with nationwide doorstep delivery.
              </p>
            ) : isNightHour ? (
              <p>
                <strong className="font-bold text-stone-900">22:00–06:00 Night Desk:</strong> Live IRCTC train PNR tracking, outstation cab comparisons, and 24/7 instant zero-fee UPI transfers and mobile recharges are fully active.
              </p>
            ) : (
              <p>
                <strong className="font-bold text-stone-900">Morning Essentials:</strong> Recharge utility accounts, settle pending bills via KingPay UPI, or search for verified subject tutors and verified local job postings.
              </p>
            )}
          </div>
        </div>

        {/* Active Cart Cross-Sell Alert */}
        {currentCartCount > 0 && (
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50/90 p-3.5 sm:p-4 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <ShoppingBag className="size-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-950">
                  {currentCartCount} {currentCartCount === 1 ? "item" : "items"} in your active cart
                </p>
                <p className="text-[11px] text-emerald-800 font-medium">
                  Add Mart essentials with ₹0 extra delivery fee.
                </p>
              </div>
            </div>
            <Link
              to="/search"
              search={{ q: "mart" } as any}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-1.5 transition no-underline shadow-2xs"
            >
              <span>Add Mart Essentials</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        )}

        {/* High-Converting 4 Real Platform Services (2x2 Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-1">
          {/* Service 1: KingPay UPI */}
          <div className="flex flex-col justify-between p-5 rounded-2xl border border-amber-200/90 bg-white hover:border-amber-400 hover:shadow-md transition-all duration-200">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700">
                  <Crown className="size-5" />
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  24/7 NATIONWIDE
                </span>
              </div>
              <h4 className="font-black text-base text-stone-900">
                KingPay UPI &amp; Bill Payments
              </h4>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed font-medium">
                Instant 256-bit zero-fee UPI transfers, mobile recharges, and utility bill payments available 24/7 across India.
              </p>
            </div>
            <Link
              to="/king-pay"
              className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-105 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-xs transition-all no-underline"
            >
              <CreditCard className="size-3.5" />
              <span>Open KingPay UPI</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {/* Service 2: Travel Concierge */}
          <div className="flex flex-col justify-between p-5 rounded-2xl border border-sky-200/90 bg-white hover:border-sky-400 hover:shadow-md transition-all duration-200">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-700">
                  <Plane className="size-5" />
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-100 text-sky-900 border border-sky-300">
                  LIVE TRACKING
                </span>
              </div>
              <h4 className="font-black text-base text-stone-900">
                Travel Concierge &amp; Live PNR
              </h4>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed font-medium">
                Outstation rides, intercity buses, trains with live IRCTC PNR status, and real-time flight tracking.
              </p>
            </div>
            <Link
              to="/travel"
              className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all no-underline"
            >
              <Train className="size-3.5" />
              <span>Explore Travel Concierge</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {/* Service 3: Tutor & Direct Jobs Desk */}
          <div className="flex flex-col justify-between p-5 rounded-2xl border border-purple-200/90 bg-white hover:border-purple-400 hover:shadow-md transition-all duration-200">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/15 text-purple-700">
                  <GraduationCap className="size-5" />
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300">
                  VERIFIED DESK
                </span>
              </div>
              <h4 className="font-black text-base text-stone-900">
                Tutor &amp; Direct Jobs Desk
              </h4>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed font-medium">
                Verified local tutors, skill certification, and direct local job postings with zero intermediary commissions.
              </p>
            </div>
            <Link
              to="/tutor"
              className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all no-underline"
            >
              <Briefcase className="size-3.5" />
              <span>View Tutors &amp; Jobs</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {/* Service 4: Mart / Essentials */}
          <div className="flex flex-col justify-between p-5 rounded-2xl border border-emerald-200/90 bg-white hover:border-emerald-400 hover:shadow-md transition-all duration-200">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700">
                  <Store className="size-5" />
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  NATIONWIDE DELIVERY
                </span>
              </div>
              <h4 className="font-black text-base text-stone-900">
                Mart &amp; Regional Essentials
              </h4>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed font-medium">
                Non-perishable regional food, spices, and groceries delivered anywhere across India with verified tracking.
              </p>
            </div>
            <Link
              to="/search"
              search={{ q: "mart" } as any}
              className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all no-underline"
            >
              <ShoppingBag className="size-3.5" />
              <span>Browse Mart Essentials</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Verification and Trust Footnote */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-[11px] text-stone-500 font-medium">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-emerald-600" />
            <span>256-bit encrypted transactions</span>
          </span>
          <span>·</span>
          <span>Official IRCTC PNR tracking</span>
          <span>·</span>
          <span>Direct verified tutor profiles</span>
          <span>·</span>
          <span>₹0 extra delivery fee with active cart</span>
        </div>
      </div>
    </section>
  );
}
