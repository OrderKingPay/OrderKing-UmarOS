import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Compass,
  House,
  Plane,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { OrderKingMark } from "@/components/brand/wordmark";
import { useCartStore, cartCount } from "@/lib/stores/cart";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listMyOrders } from "@/lib/server/orders";
import { cn } from "@/lib/utils";

interface FloatingBottomNavProps {
  className?: string;
}

export function CustomerFloatingBottomNav({ className }: FloatingBottomNavProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = useCartStore((s) => s.items);
  const totalCartCount = cartCount(items);
  const { user } = useCurrentUserState();

  // Query live orders to dynamically light up the Orders tab with a live radar pulse
  const { data: ordersData } = useQuery({
    queryKey: ["orders", "active-indicator"],
    queryFn: () => listMyOrders(),
    enabled: Boolean(user),
    staleTime: 15_000,
    refetchInterval: 20_000,
  });

  const activeOrders = (ordersData?.orders ?? []).filter((o) =>
    ["PLACED", "ACCEPTED", "PREPARING", "READY", "RIDER_ASSIGNED", "PICKED_UP", "ON_THE_WAY"].includes(o.status)
  );
  const hasActiveOrder = activeOrders.length > 0;

  // Determine active touchpoint
  const isFoodHome = pathname === "/" || pathname.startsWith("/delivery");
  const isSearch = pathname.startsWith("/search");
  const isKingPay = pathname.startsWith("/king-pay");
  const isTravel = pathname.startsWith("/travel");
  const isOrders = pathname.startsWith("/orders");

  return (
    <nav
      role="navigation"
      aria-label="OrderKing Luxury Navigation"
      className={cn(
        "fixed inset-x-0 bottom-3 sm:bottom-4 z-50 pointer-events-none mx-auto max-w-lg px-3 sm:px-4",
        className
      )}
    >
      <div className="pointer-events-auto relative rounded-[28px] bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_1.5px_0_rgba(255,255,255,0.7)] px-2 pt-1 pb-1.5 transition-all">
        {/* Subtle Ambient Gold Hairline Beam on Top Rim */}
        <div className="absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent pointer-events-none" />

        <ul className="grid grid-cols-5 items-end justify-items-center relative">
          {/* 1. HOME (FOOD & RESTAURANTS) - EMERALD ACCENT */}
          <li className="w-full flex justify-center">
            <Link
              to="/"
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-all duration-300 active:scale-90",
                isFoodHome
                  ? "text-emerald-700 dark:text-emerald-400 font-extrabold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 font-semibold"
              )}
            >
              <div
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-2xl transition-all duration-300",
                  isFoodHome
                    ? "bg-emerald-50 dark:bg-emerald-950/60 shadow-xs ring-1 ring-emerald-500/20 text-emerald-600 dark:text-emerald-400 scale-105"
                    : "group-hover:bg-slate-100 dark:group-hover:bg-slate-900"
                )}
              >
                <House
                  className={cn(
                    "size-5 transition-transform duration-300",
                    isFoodHome ? "scale-110 stroke-[2.4]" : "stroke-[1.8] group-hover:scale-105"
                  )}
                  aria-hidden="true"
                />
                {/* Emerald Delivery Beacon */}
                <span className="absolute -top-1 -right-1 flex size-2 items-center justify-center">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                </span>
              </div>
              <span className="mt-1 text-[10.5px] tracking-tight leading-none">
                Food
              </span>
              {isFoodHome && (
                <span className="size-1 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-1 shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
              )}
            </Link>
          </li>

          {/* 2. SEARCH & CUISINES - SUNSET CORAL ACCENT */}
          <li className="w-full flex justify-center">
            <Link
              to="/search"
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-all duration-300 active:scale-90",
                isSearch
                  ? "text-rose-600 dark:text-rose-400 font-extrabold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 font-semibold"
              )}
            >
              <div
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-2xl transition-all duration-300",
                  isSearch
                    ? "bg-rose-50 dark:bg-rose-950/60 shadow-xs ring-1 ring-rose-500/20 text-rose-600 dark:text-rose-400 scale-105"
                    : "group-hover:bg-slate-100 dark:group-hover:bg-slate-900"
                )}
              >
                <Compass
                  className={cn(
                    "size-5 transition-transform duration-300",
                    isSearch ? "scale-110 stroke-[2.4]" : "stroke-[1.8] group-hover:scale-105"
                  )}
                  aria-hidden="true"
                />
              </div>
              <span className="mt-1 text-[10.5px] tracking-tight leading-none">
                Explore
              </span>
              {isSearch && (
                <span className="size-1 rounded-full bg-rose-600 dark:bg-rose-400 mt-1 shadow-[0_0_6px_rgba(244,63,94,0.9)]" />
              )}
            </Link>
          </li>

          {/* 3. KINGPAY (UPI & GOLD) - ELEVATED 24K SOVEREIGN GOLD VIP CENTERPIECE */}
          <li className="w-full flex justify-center">
            <Link
              to="/king-pay"
              className="group relative -mt-5 sm:-mt-6 flex flex-col items-center justify-center no-underline transition-all duration-300 active:scale-92"
              title="KingPay UPI & Digital Gold"
            >
              {/* Outer Golden Gradient Ring with Radial Halo */}
              <div
                className={cn(
                  "relative p-[2.5px] rounded-[22px] transition-all duration-300 shadow-md",
                  isKingPay
                    ? "bg-gradient-to-tr from-amber-500 via-amber-300 to-yellow-200 shadow-[0_8px_25px_rgba(245,158,11,0.5),0_0_0_1.5px_rgba(245,158,11,0.4)] scale-105"
                    : "bg-gradient-to-tr from-amber-500/80 via-amber-300/80 to-yellow-200/90 shadow-[0_6px_20px_rgba(245,158,11,0.3)] group-hover:scale-105 group-hover:shadow-[0_8px_25px_rgba(245,158,11,0.45)]"
                )}
              >
                {/* Obsidian & Emerald Jewel Interior */}
                <div className="flex size-12 items-center justify-center rounded-[19.5px] bg-gradient-to-b from-gray-950 via-slate-900 to-emerald-950 text-amber-300 shadow-inner">
                  <OrderKingMark className="size-7 filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.7)]" />
                </div>

                {/* Shimmering Gold Pill Tag */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 px-1.5 py-0.2 shadow-xs border border-amber-200">
                  <span className="flex items-center gap-0.5 text-[8.5px] font-black uppercase tracking-wider text-slate-950">
                    <Sparkles className="size-2 text-slate-950" />
                    GOLD
                  </span>
                </div>
              </div>

              {/* Label & Active State Indicator */}
              <span
                className={cn(
                  "mt-1 text-[10.5px] font-black tracking-tight transition-colors leading-none",
                  isKingPay ? "text-amber-700 dark:text-amber-400" : "text-amber-900/90 dark:text-amber-300/90 group-hover:text-amber-700"
                )}
              >
                KingPay
              </span>
              {isKingPay && (
                <span className="size-1 rounded-full bg-amber-500 mt-1 shadow-[0_0_8px_rgba(245,158,11,1)]" />
              )}
            </Link>
          </li>

          {/* 4. TRAVEL (DIRECT TICKETS & STAYS) - ROYAL SAPPHIRE BLUE ACCENT */}
          <li className="w-full flex justify-center">
            <Link
              to="/travel"
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-all duration-300 active:scale-90",
                isTravel
                  ? "text-blue-600 dark:text-blue-400 font-extrabold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 font-semibold"
              )}
            >
              <div
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-2xl transition-all duration-300",
                  isTravel
                    ? "bg-blue-50 dark:bg-blue-950/60 shadow-xs ring-1 ring-blue-500/20 text-blue-600 dark:text-blue-400 scale-105"
                    : "group-hover:bg-slate-100 dark:group-hover:bg-slate-900"
                )}
              >
                <Plane
                  className={cn(
                    "size-5 transition-transform duration-300",
                    isTravel ? "scale-110 stroke-[2.4]" : "stroke-[1.8] group-hover:scale-105"
                  )}
                  aria-hidden="true"
                />
                {/* 0% Fee Micro-Badge */}
                <span className="absolute -top-1 -right-1 rounded-full bg-blue-600 px-1 text-[7.5px] font-black text-white shadow-xs">
                  0%
                </span>
              </div>
              <span className="mt-1 text-[10.5px] tracking-tight leading-none">
                Travel
              </span>
              {isTravel && (
                <span className="size-1 rounded-full bg-blue-600 dark:bg-blue-400 mt-1 shadow-[0_0_6px_rgba(37,99,235,0.9)]" />
              )}
            </Link>
          </li>

          {/* 5. ORDERS (LIVE TRACKING & HISTORY) - RUBY RADAR BEACON ACCENT */}
          <li className="w-full flex justify-center">
            <Link
              to="/orders"
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-all duration-300 active:scale-90",
                isOrders
                  ? "text-rose-600 dark:text-rose-400 font-extrabold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 font-semibold"
              )}
            >
              <div
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-2xl transition-all duration-300",
                  isOrders
                    ? "bg-rose-50 dark:bg-rose-950/60 shadow-xs ring-1 ring-rose-500/20 text-rose-600 dark:text-rose-400 scale-105"
                    : "group-hover:bg-slate-100 dark:group-hover:bg-slate-900"
                )}
              >
                <ShoppingBag
                  className={cn(
                    "size-5 transition-transform duration-300",
                    isOrders ? "scale-110 stroke-[2.4]" : "stroke-[1.8] group-hover:scale-105"
                  )}
                  aria-hidden="true"
                />

                {/* Live Order Radar Pulse or Active Cart Count Indicator */}
                {hasActiveOrder ? (
                  <span className="absolute -top-1 -right-1 flex size-3 items-center justify-center">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-500 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-rose-600 ring-2 ring-white dark:ring-slate-950" />
                  </span>
                ) : totalCartCount > 0 ? (
                  <span className="absolute -top-1 -right-1 flex min-h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-600 px-1 text-[8px] font-black text-white shadow-xs">
                    {totalCartCount}
                  </span>
                ) : null}
              </div>
              <span className="mt-1 text-[10.5px] tracking-tight leading-none">
                Orders
              </span>
              {isOrders && (
                <span className="size-1 rounded-full bg-rose-600 dark:bg-rose-400 mt-1 shadow-[0_0_6px_rgba(225,29,72,0.9)]" />
              )}
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
