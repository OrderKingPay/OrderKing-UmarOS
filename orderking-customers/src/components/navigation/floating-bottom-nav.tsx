import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  UtensilsCrossed,
  GraduationCap,
  Plane,
  ShoppingBag,
  Ticket,
  Crown,
} from "lucide-react";
import { useCartStore, cartCount } from "@/lib/stores/cart";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listMyOrders } from "@/lib/server/orders";
import { cn } from "@/lib/utils";
import { useCallback } from "react";

interface FloatingBottomNavProps {
  className?: string;
}

/** Trigger crisp haptic pulse on supported devices */
function hapticTap() {
  try {
    if (typeof window !== "undefined" && typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(10);
    }
  } catch {
    /* silent on unsupported devices / browser security restrictions */
  }
}

export function CustomerFloatingBottomNav({ className }: FloatingBottomNavProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = useCartStore((s) => s.items);
  const totalCartCount = cartCount(items);
  const { user } = useCurrentUserState();

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

  const isFoodHome = pathname === "/" || pathname.startsWith("/delivery");
  const isTutorJobs = pathname.startsWith("/tutor");
  const isKingPay = pathname.startsWith("/king-pay") || pathname.startsWith("/earn");
  const isTravel = pathname.startsWith("/travel");
  const isOrders = pathname.startsWith("/orders");
  const isTrips = pathname.startsWith("/travel/trips");

  const onTap = useCallback(() => hapticTap(), []);

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className={cn(
        "fixed inset-x-0 bottom-1.5 sm:bottom-3 z-50 pointer-events-none mx-auto w-full max-w-lg px-1.5 sm:px-3",
        className
      )}
    >
      {/* ─── Ambient Iridescent Glow Ring (Backdrop Aura) ─── */}
      <div
        className="absolute -inset-[2px] rounded-[30px] opacity-75 blur-md pointer-events-none -z-10 animate-pulse"
        style={{
          background:
            "linear-gradient(90deg, rgba(16,185,129,0.3) 0%, rgba(168,85,247,0.3) 25%, rgba(245,158,11,0.45) 50%, rgba(37,99,235,0.3) 75%, rgba(225,29,72,0.3) 100%)",
        }}
      />

      {/* ─── Ultra-Luxury Glassmorphism Island ─── */}
      <div
        className="pointer-events-auto relative overflow-visible rounded-[26px] sm:rounded-[28px] px-1 sm:px-1.5 pt-1.5 pb-1 transition-all duration-500 border border-amber-300/30"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(255,253,248,0.95) 50%, rgba(255,255,255,0.96) 100%)",
          backdropFilter: "blur(28px) saturate(1.9)",
          WebkitBackdropFilter: "blur(28px) saturate(1.9)",
          boxShadow: [
            "0 20px 60px -10px rgba(15,23,42,0.18)",
            "0 8px 24px -4px rgba(245,158,11,0.15)",
            "0 0 0 1px rgba(245,158,11,0.25)",
            "inset 0 1px 2px rgba(255,255,255,1)",
            "inset 0 -1px 2px rgba(245,158,11,0.08)",
          ].join(","),
        }}
      >
        {/* Ambient Gold Beam - Top Edge */}
        <div className="absolute top-0 inset-x-6 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/90 to-transparent pointer-events-none" />
        {/* Subtle Spectrum Bottom Glow */}
        <div className="absolute bottom-0 inset-x-4 h-[1px] bg-gradient-to-r from-emerald-400/40 via-amber-400/50 to-rose-400/40 pointer-events-none" />

        <ul className="grid grid-cols-5 items-end justify-items-center relative w-full">
          {/* ━━━ 1. FOOD DELIVERY ━━━ Emerald Food Gradient */}
          <li className="w-full flex justify-center">
            <Link
              to="/"
              onClick={onTap}
              className={cn(
                "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-transform duration-200",
                isFoodHome ? "scale-[1.02]" : "active:scale-90"
              )}
            >
              <div
                className={cn(
                  "relative flex size-9 sm:size-10 items-center justify-center rounded-2xl transition-all duration-300 border",
                  isFoodHome
                    ? "bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-white border-emerald-300/80 shadow-[0_4px_16px_rgba(16,185,129,0.5),inset_0_1px_1px_rgba(255,255,255,0.7)] scale-105"
                    : "bg-gradient-to-br from-emerald-500/15 via-teal-500/15 to-emerald-600/10 text-emerald-800 border-emerald-300/60 shadow-sm group-hover:bg-emerald-500/25 group-hover:border-emerald-400/80"
                )}
              >
                <UtensilsCrossed
                  className={cn(
                    "size-[17px] sm:size-[18px] transition-all duration-200",
                    isFoodHome ? "stroke-[2.6] drop-shadow-sm" : "stroke-[2.1] group-hover:scale-110"
                  )}
                  aria-hidden="true"
                />
                {/* Live green pulse beacon */}
                <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500 border border-white shadow-sm" />
                </span>
              </div>

              <span
                className={cn(
                  "mt-1 text-[8px] sm:text-[9.5px] leading-tight tracking-tight transition-colors truncate max-w-full px-0.5 text-center",
                  isFoodHome ? "font-black text-emerald-950" : "font-extrabold text-emerald-800/80"
                )}
              >
                Food
              </span>

              {/* Animated Gradient Bar Indicator */}
              <div className="h-[3.5px] w-6 sm:w-7 mt-0.5 flex items-center justify-center">
                {isFoodHome ? (
                  <span className="h-full w-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.95)] animate-pulse" />
                ) : (
                  <span className="h-full w-0 rounded-full bg-transparent transition-all duration-300" />
                )}
              </div>
            </Link>
          </li>

          {/* ━━━ 2. TUTOR & JOBS ━━━ Amethyst Tutor Gradient */}
          <li className="w-full flex justify-center">
            <Link
              to="/tutor"
              onClick={onTap}
              className={cn(
                "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-transform duration-200",
                isTutorJobs ? "scale-[1.02]" : "active:scale-90"
              )}
            >
              <div
                className={cn(
                  "relative flex size-9 sm:size-10 items-center justify-center rounded-2xl transition-all duration-300 border",
                  isTutorJobs
                    ? "bg-gradient-to-br from-purple-500 via-fuchsia-600 to-indigo-700 text-white border-purple-300/80 shadow-[0_4px_16px_rgba(168,85,247,0.5),inset_0_1px_1px_rgba(255,255,255,0.7)] scale-105"
                    : "bg-gradient-to-br from-purple-500/15 via-fuchsia-500/15 to-indigo-600/10 text-purple-800 border-purple-300/60 shadow-sm group-hover:bg-purple-500/25 group-hover:border-purple-400/80"
                )}
              >
                <GraduationCap
                  className={cn(
                    "size-[17px] sm:size-[18px] transition-all duration-200",
                    isTutorJobs ? "stroke-[2.6] drop-shadow-sm" : "stroke-[2.1] group-hover:scale-110"
                  )}
                  aria-hidden="true"
                />
                {/* EARN badge */}
                <span className="absolute -top-1.5 -right-2 rounded-full bg-gradient-to-r from-fuchsia-600 via-pink-500 to-purple-600 px-[5px] py-[0.5px] text-[6.5px] font-black text-white shadow-md border border-white/60 tracking-wider">
                  EARN
                </span>
              </div>

              <span
                className={cn(
                  "mt-1 text-[8px] sm:text-[9.5px] leading-tight tracking-tight transition-colors truncate max-w-full px-0.5 text-center",
                  isTutorJobs ? "font-black text-purple-950" : "font-extrabold text-purple-800/80"
                )}
              >
                Tutor
              </span>

              {/* Animated Gradient Bar Indicator */}
              <div className="h-[3.5px] w-6 sm:w-7 mt-0.5 flex items-center justify-center">
                {isTutorJobs ? (
                  <span className="h-full w-full rounded-full bg-gradient-to-r from-purple-400 via-fuchsia-300 to-indigo-500 shadow-[0_0_10px_rgba(168,85,247,0.95)] animate-pulse" />
                ) : (
                  <span className="h-full w-0 rounded-full bg-transparent transition-all duration-300" />
                )}
              </div>
            </Link>
          </li>

          {/* ━━━ 3. KINGPAY ━━━ 24K Gold Sovereign Flagship Centerpiece */}
          <li className="w-full flex justify-center">
            <Link
              to="/king-pay"
              onClick={onTap}
              className="group relative -mt-6 sm:-mt-7 flex flex-col items-center justify-center no-underline transition-all duration-300 active:scale-[0.92]"
              title="KingPay UPI & 24K Digital Gold"
            >
              {/* Elevated 24K Golden Sovereign Ring */}
              <div
                className={cn(
                  "relative p-[3px] sm:p-[3.5px] rounded-[22px] sm:rounded-[24px] transition-all duration-500",
                  isKingPay
                    ? "scale-[1.12] shadow-[0_10px_35px_rgba(245,158,11,0.65),0_0_0_3px_rgba(251,191,36,0.5),inset_0_1px_3px_rgba(255,255,255,0.9)]"
                    : "shadow-[0_8px_24px_rgba(245,158,11,0.4),0_0_0_1.5px_rgba(245,158,11,0.3)] group-hover:scale-105 group-hover:shadow-[0_10px_30px_rgba(245,158,11,0.55)]"
                )}
                style={{
                  background:
                    "linear-gradient(135deg, #FFD700 0%, #FFA500 25%, #FFF8DC 50%, #FFD700 75%, #B8860B 100%)",
                }}
              >
                {/* Obsidian Jewel Core with Crown Emblem */}
                <div className="flex size-[46px] sm:size-[52px] items-center justify-center rounded-[19px] sm:rounded-[20px] bg-gradient-to-b from-gray-950 via-slate-900 to-amber-950 text-amber-300 shadow-inner relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-400/10 to-transparent pointer-events-none" />
                  <Crown className="size-6 sm:size-7 text-amber-300 fill-amber-400/35 drop-shadow-[0_2px_10px_rgba(245,158,11,0.95)] stroke-[2.2]" />
                </div>

                {/* 24K GOLD Badge */}
                <div
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-[1.5px] shadow-md border border-amber-200/80"
                  style={{
                    background: "linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)",
                  }}
                >
                  <span className="flex items-center gap-0.5 text-[6.5px] sm:text-[7.5px] font-black uppercase tracking-wider text-slate-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">
                    <Crown className="size-2 text-slate-950 fill-slate-950" />
                    24K GOLD
                  </span>
                </div>

                {/* UPI Badge */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-1.5 py-[0.5px] shadow-sm border border-amber-300/60">
                  <span className="text-[6px] font-black text-amber-900 tracking-wider">UPI</span>
                </div>
              </div>

              <span className="mt-1 text-[9px] sm:text-[10px] font-black tracking-tight leading-tight text-amber-950 group-hover:text-amber-900">
                KingPay
              </span>

              {/* Animated 24K Gold Bar Indicator */}
              <div className="h-[3.5px] w-7 sm:w-8 mt-0.5 flex items-center justify-center">
                {isKingPay ? (
                  <span className="h-full w-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-[0_0_12px_rgba(245,158,11,1)] animate-pulse" />
                ) : (
                  <span className="h-full w-0 rounded-full bg-transparent transition-all duration-300" />
                )}
              </div>
            </Link>
          </li>

          {/* ━━━ 4. TRAVEL & STAYS ━━━ Sapphire Travel Gradient */}
          <li className="w-full flex justify-center">
            <Link
              to="/travel"
              onClick={onTap}
              className={cn(
                "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-transform duration-200",
                isTravel ? "scale-[1.02]" : "active:scale-90"
              )}
            >
              <div
                className={cn(
                  "relative flex size-9 sm:size-10 items-center justify-center rounded-2xl transition-all duration-300 border",
                  isTravel
                    ? "bg-gradient-to-br from-blue-500 via-indigo-600 to-sky-600 text-white border-blue-300/80 shadow-[0_4px_16px_rgba(37,99,235,0.5),inset_0_1px_1px_rgba(255,255,255,0.7)] scale-105"
                    : "bg-gradient-to-br from-blue-500/15 via-sky-500/15 to-indigo-600/10 text-blue-800 border-blue-300/60 shadow-sm group-hover:bg-blue-500/25 group-hover:border-blue-400/80"
                )}
              >
                <Plane
                  className={cn(
                    "size-[17px] sm:size-[18px] transition-all duration-200",
                    isTravel ? "stroke-[2.6] drop-shadow-sm" : "stroke-[2.1] group-hover:scale-110"
                  )}
                  aria-hidden="true"
                />
                {/* 0% FEE badge */}
                <span className="absolute -top-1.5 -right-2 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 px-[5px] py-[0.5px] text-[6.5px] font-black text-white shadow-md border border-white/60 tracking-wider">
                  0% FEE
                </span>
              </div>

              <span
                className={cn(
                  "mt-1 text-[8px] sm:text-[9.5px] leading-tight tracking-tight transition-colors truncate max-w-full px-0.5 text-center",
                  isTravel ? "font-black text-blue-950" : "font-extrabold text-blue-800/80"
                )}
              >
                Travel
              </span>

              {/* Animated Gradient Bar Indicator */}
              <div className="h-[3.5px] w-6 sm:w-7 mt-0.5 flex items-center justify-center">
                {isTravel && !isTrips ? (
                  <span className="h-full w-full rounded-full bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-500 shadow-[0_0_10px_rgba(37,99,235,0.95)] animate-pulse" />
                ) : (
                  <span className="h-full w-0 rounded-full bg-transparent transition-all duration-300" />
                )}
              </div>
            </Link>
          </li>

          {/* ━━━ 5. ORDERS / TRIPS ━━━ Ruby Orders Gradient */}
          <li className="w-full flex justify-center">
            <Link
              to={isTravel ? "/travel/trips" : "/orders"}
              onClick={onTap}
              className={cn(
                "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-transform duration-200",
                isOrders || isTrips ? "scale-[1.02]" : "active:scale-90"
              )}
            >
              <div
                className={cn(
                  "relative flex size-9 sm:size-10 items-center justify-center rounded-2xl transition-all duration-300 border",
                  isOrders || isTrips
                    ? "bg-gradient-to-br from-rose-500 via-red-600 to-pink-700 text-white border-rose-300/80 shadow-[0_4px_16px_rgba(225,29,72,0.5),inset_0_1px_1px_rgba(255,255,255,0.7)] scale-105"
                    : "bg-gradient-to-br from-rose-500/15 via-red-500/15 to-pink-600/10 text-rose-800 border-rose-300/60 shadow-sm group-hover:bg-rose-500/25 group-hover:border-rose-400/80"
                )}
              >
                {isTravel ? (
                  <Ticket
                    className={cn(
                      "size-[17px] sm:size-[18px] transition-all duration-200",
                      isTrips ? "stroke-[2.6] drop-shadow-sm" : "stroke-[2.1] group-hover:scale-110"
                    )}
                    aria-hidden="true"
                  />
                ) : (
                  <ShoppingBag
                    className={cn(
                      "size-[17px] sm:size-[18px] transition-all duration-200",
                      isOrders ? "stroke-[2.6] drop-shadow-sm" : "stroke-[2.1] group-hover:scale-110"
                    )}
                    aria-hidden="true"
                  />
                )}

                {/* Live Order Radar or Cart Count */}
                {hasActiveOrder ? (
                  <span className="absolute -top-0.5 -right-0.5 flex size-3">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-500 opacity-60" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-rose-600 ring-[1.5px] ring-white shadow-sm" />
                  </span>
                ) : totalCartCount > 0 ? (
                  <span className="absolute -top-1 -right-1.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-red-600 px-1 text-[8px] font-black text-white shadow-md border border-white/60">
                    {totalCartCount}
                  </span>
                ) : null}
              </div>

              <span
                className={cn(
                  "mt-1 text-[8px] sm:text-[9.5px] leading-tight tracking-tight transition-colors truncate max-w-full px-0.5 text-center",
                  isOrders || isTrips ? "font-black text-rose-950" : "font-extrabold text-rose-800/80"
                )}
              >
                {isTravel ? "Trips" : "Orders"}
              </span>

              {/* Animated Gradient Bar Indicator */}
              <div className="h-[3.5px] w-6 sm:w-7 mt-0.5 flex items-center justify-center">
                {isOrders || isTrips ? (
                  <span className="h-full w-full rounded-full bg-gradient-to-r from-rose-400 via-pink-300 to-red-500 shadow-[0_0_10px_rgba(225,29,72,0.95)] animate-pulse" />
                ) : (
                  <span className="h-full w-0 rounded-full bg-transparent transition-all duration-300" />
                )}
              </div>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
