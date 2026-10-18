import { Link, useRouterState } from "@tanstack/react-router";
import {
  ShoppingBag,
  Sparkles,
  Clock,
  ArrowRight,
  MapPin,
  Crown,
  Plane,
  GraduationCap,
  Store,
} from "lucide-react";
import { useCartStore, cartCount } from "@/lib/stores/cart";
import { useLocationStore } from "@/lib/stores/location";
import { isDeliveryActiveInLocation } from "@/lib/geo/geofence-guard";
import { cn } from "@/lib/utils";

interface ContextualCrossSellBarProps {
  className?: string;
}

/**
 * Hour-aware heuristics and contextual cross-sell bar:
 * - 11:00-22:00: Lunch / dinner service alerts & Mart pantry recommendations
 * - 22:00-06:00: Night travel concierge, live PNR tracking, and 24/7 instant UPI/recharge recommendations
 * - 06:00-11:00: Morning utilities, transit, and learning desk recommendations
 * - Active Cart cross-sell: "Add Mart essentials with ₹0 extra delivery fee"
 * - Inactive Delivery location: Proactive guidance to KingPay UPI, Travel, Tutor & Jobs, and Mart
 */
export function ContextualCrossSellBar({ className = "" }: ContextualCrossSellBarProps) {
  const location = useLocationStore((s) => s.location);
  const items = useCartStore((s) => s.items) ?? [];
  const count = cartCount(items);
  const path = useRouterState({ select: (s) => s.location?.pathname }) || "";

  const isDeliveryActive = location
    ? isDeliveryActiveInLocation(location.lat, location.lng, location.cityId)
    : true;

  const cityName =
    location?.zoneName ||
    (location?.cityName && location.cityName !== "Locating..."
      ? location.cityName
      : "your area");

  const now = new Date();
  const hour = now.getHours();
  const isMealHour = hour >= 11 && hour < 22;
  const isNightHour = hour >= 22 || hour < 6;

  // Do not show on focused transactional screens like checkout
  if (path === "/checkout") return null;

  return (
    <aside
      aria-label="Service updates and recommendations"
      data-testid="contextual-cross-sell-bar"
      className={cn(
        "w-full text-xs font-medium transition-all select-none border-b",
        !isDeliveryActive
          ? "bg-amber-50/90 border-amber-200/80 text-amber-950"
          : count > 0
          ? "bg-emerald-50/90 border-emerald-200/80 text-emerald-950"
          : isNightHour
          ? "bg-slate-900 text-stone-200 border-slate-800"
          : "bg-white/80 border-amber-100 text-stone-800",
        className
      )}
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        {/* Left Side: Intelligent Context Message */}
        <div className="flex items-center gap-2 min-w-0">
          {!isDeliveryActive ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="flex size-2 rounded-full bg-amber-500 animate-pulse" />
              <MapPin className="size-3.5 text-amber-700 shrink-0" />
            </div>
          ) : count > 0 ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
              <ShoppingBag className="size-3.5 text-emerald-700 shrink-0" />
            </div>
          ) : isNightHour ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <Clock className="size-3.5 text-sky-400 shrink-0" />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 shrink-0">
              <Sparkles className="size-3.5 text-amber-600 shrink-0" />
            </div>
          )}

          <div className="text-[11px] sm:text-xs leading-tight truncate">
            {!isDeliveryActive ? (
              <span>
                <strong className="font-bold text-amber-900">Food delivery not in {cityName}</strong>
                <span className="text-amber-800/90 hidden sm:inline">
                  {" "}— KingPay UPI, Travel, Tutor &amp; Jobs, and Mart are active nationwide.
                </span>
              </span>
            ) : count > 0 ? (
              <span>
                <strong className="font-bold text-emerald-900">
                  {count} {count === 1 ? "item" : "items"} in cart
                </strong>
                <span className="text-emerald-800/90">
                  {" "}— Add Mart essentials with ₹0 extra delivery fee.
                </span>
              </span>
            ) : isMealHour ? (
              <span>
                <strong className="font-bold text-stone-900">Lunch &amp; dinner hours:</strong>
                <span className="text-stone-600">
                  {" "}Fresh orders active in partner zones · Non-perishable regional foods ship nationwide.
                </span>
              </span>
            ) : isNightHour ? (
              <span>
                <strong className="font-bold text-sky-200">Night service active:</strong>
                <span className="text-stone-300">
                  {" "}24/7 KingPay UPI recharges, live IRCTC train PNR tracking, and outstation rides.
                </span>
              </span>
            ) : (
              <span>
                <strong className="font-bold text-stone-900">Morning routine:</strong>
                <span className="text-stone-600">
                  {" "}Instant bill payments, travel bookings, and direct tutor connections active across India.
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Quick Action Pills */}
        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto max-w-full pb-0.5 sm:pb-0 scrollbar-none">
          {!isDeliveryActive ? (
            <>
              <Link
                to="/king-pay"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-amber-300 hover:border-amber-400 text-stone-900 text-[10.5px] font-bold shadow-2xs no-underline transition"
              >
                <Crown className="size-3 text-amber-600" />
                <span>KingPay UPI</span>
              </Link>
              <Link
                to="/travel"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-amber-300 hover:border-amber-400 text-stone-900 text-[10.5px] font-bold shadow-2xs no-underline transition"
              >
                <Plane className="size-3 text-sky-600" />
                <span>Travel Concierge</span>
              </Link>
              <Link
                to="/tutor"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-amber-300 hover:border-amber-400 text-stone-900 text-[10.5px] font-bold shadow-2xs no-underline transition"
              >
                <GraduationCap className="size-3 text-purple-600" />
                <span>Tutor &amp; Jobs</span>
              </Link>
              <Link
                to="/search"
                search={{ q: "mart" } as any}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-600 text-white hover:bg-amber-700 text-[10.5px] font-bold shadow-2xs no-underline transition"
              >
                <Store className="size-3" />
                <span>Mart Essentials</span>
              </Link>
            </>
          ) : count > 0 ? (
            <Link
              to="/search"
              search={{ q: "mart" } as any}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[10.5px] font-bold shadow-2xs no-underline transition active:scale-95"
            >
              <Store className="size-3" />
              <span>Browse Mart (₹0 delivery fee)</span>
              <ArrowRight className="size-3" />
            </Link>
          ) : isNightHour ? (
            <>
              <Link
                to="/travel"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-200 text-[10.5px] font-bold shadow-2xs no-underline transition"
              >
                <Plane className="size-3 text-sky-400" />
                <span>Train PNR &amp; Travel</span>
              </Link>
              <Link
                to="/king-pay"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10.5px] font-bold shadow-2xs no-underline transition"
              >
                <Crown className="size-3 text-slate-950" />
                <span>24/7 UPI &amp; Recharge</span>
              </Link>
            </>
          ) : (
            <Link
              to="/search"
              search={{ q: "mart" } as any}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100/80 hover:bg-amber-200/80 border border-amber-300 text-amber-950 text-[10.5px] font-bold no-underline transition"
            >
              <Store className="size-3 text-amber-800" />
              <span>Mart Essentials</span>
              <ArrowRight className="size-3" />
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
