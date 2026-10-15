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
      navigator.vibrate(12);
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

  const isFoodHome =
    pathname === "/" ||
    pathname.startsWith("/delivery") ||
    pathname.startsWith("/restaurants") ||
    pathname.startsWith("/menu");
  const isTutorJobs = pathname.startsWith("/tutor");
  const isKingPay = pathname.startsWith("/king-pay") || pathname.startsWith("/earn") || pathname.startsWith("/wallet");
  const isTravel = pathname.startsWith("/travel");
  const isTrips = pathname.startsWith("/travel/trips");
  const isOrders = pathname.startsWith("/orders") || isTrips;

  const onTap = useCallback(() => hapticTap(), []);

  return (
    <nav
      role="navigation"
      aria-label="OrderKing Primary Navigation"
      className={cn(
        "fixed inset-x-0 bottom-1.5 sm:bottom-3 z-50 pointer-events-none mx-auto w-full max-w-lg px-2 sm:px-3 select-none",
        className
      )}
    >
      {/* ─── Dynamic Jewel Aura (Prismatic Ambient Floor Glow) ─── */}
      <div
        className="absolute -inset-[3px] rounded-[32px] opacity-75 blur-lg pointer-events-none -z-10 transition-opacity duration-500"
        style={{
          background: isKingPay
            ? "radial-gradient(ellipse at center, rgba(245,158,11,0.55) 0%, rgba(217,119,6,0.2) 55%, transparent 75%)"
            : isFoodHome
            ? "radial-gradient(ellipse at 15% 50%, rgba(16,185,129,0.5) 0%, rgba(245,158,11,0.2) 50%, transparent 80%)"
            : isTutorJobs
            ? "radial-gradient(ellipse at 35% 50%, rgba(168,85,247,0.5) 0%, rgba(245,158,11,0.2) 50%, transparent 80%)"
            : isTravel
            ? "radial-gradient(ellipse at 65% 50%, rgba(37,99,235,0.5) 0%, rgba(245,158,11,0.2) 50%, transparent 80%)"
            : "radial-gradient(ellipse at 85% 50%, rgba(225,29,72,0.5) 0%, rgba(245,158,11,0.2) 50%, transparent 80%)",
        }}
      />

      {/* ─── Ultra-Luxury 3D Glassmorphic Floating Island ─── */}
      <div
        className="pointer-events-auto relative overflow-visible rounded-[28px] sm:rounded-[30px] px-1.5 sm:px-2 pt-1.5 pb-1 transition-all duration-300"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(255,253,248,0.96) 50%, rgba(255,255,255,0.97) 100%)",
          backdropFilter: "blur(28px) saturate(2)",
          WebkitBackdropFilter: "blur(28px) saturate(2)",
          border: "1px solid rgba(245, 158, 11, 0.35)",
          boxShadow: [
            "0 24px 60px -12px rgba(15,23,42,0.22)",
            "0 10px 25px -5px rgba(245,158,11,0.2)",
            "inset 0 1.5px 2px rgba(255,255,255,1)",
            "inset 0 -1.5px 2px rgba(245,158,11,0.12)",
          ].join(","),
        }}
      >
        {/* Specular Gold Refraction Beam - Top Edge */}
        <div className="absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/95 to-transparent pointer-events-none" />
        {/* Nano Specular Base Refraction */}
        <div className="absolute bottom-0 inset-x-6 h-[1px] bg-gradient-to-r from-emerald-400/30 via-amber-400/50 to-rose-400/30 pointer-events-none" />

        <ul className="grid grid-cols-5 items-end justify-items-center relative w-full m-0 p-0 list-none">
          {/* ━━━ TAB 1: EMERALD FOOD DELIVERY ━━━ */}
          <li className="w-full flex justify-center">
            <Link
              to="/"
              preload="intent"
              onClick={onTap}
              className={cn(
                "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-200 transform-gpu",
                isFoodHome ? "scale-[1.04]" : "active:scale-95 hover:opacity-90"
              )}
              title="Food Delivery"
            >
              {/* 3D Raised Emerald Jewel */}
              <div
                className={cn(
                  "relative flex size-9 sm:size-10 items-center justify-center rounded-2xl transition-all duration-300 transform-gpu",
                  isFoodHome
                    ? "bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-700 text-white border border-emerald-300/90 shadow-[0_6px_20px_rgba(16,185,129,0.55),0_2px_4px_rgba(5,150,105,0.4),inset_0_1.5px_1px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(4,120,87,0.5)]"
                    : "bg-gradient-to-b from-emerald-50 to-emerald-100/70 text-emerald-800 border border-emerald-300/60 shadow-[0_2px_6px_rgba(16,185,129,0.12),inset_0_1px_1px_rgba(255,255,255,0.85)] group-hover:bg-emerald-100"
                )}
              >
                <UtensilsCrossed
                  className={cn(
                    "size-[18px] transition-transform duration-200",
                    isFoodHome
                      ? "stroke-[2.6] drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                      : "stroke-[2.2] text-emerald-800 group-hover:scale-105"
                  )}
                  aria-hidden="true"
                />

                {/* 3D Emerald Pulse Beacon (Live Kitchens & Delivery) */}
                <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500 border border-white shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
                </span>
              </div>

              {/* Tab Title */}
              <span
                className={cn(
                  "mt-1 text-[8.5px] sm:text-[10px] leading-tight tracking-tight transition-colors truncate max-w-full px-0.5 text-center",
                  isFoodHome ? "font-black text-emerald-950" : "font-bold text-emerald-900/80"
                )}
              >
                Food
              </span>

              {/* 3D Tactile Neon Indicator Bar */}
              <div className="h-[3.5px] w-6 sm:w-7 mt-0.5 flex items-center justify-center">
                {isFoodHome ? (
                  <span className="h-full w-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 shadow-[0_0_12px_rgba(16,185,129,1)]" />
                ) : (
                  <span className="h-full w-0 rounded-full bg-transparent transition-all duration-300" />
                )}
              </div>
            </Link>
          </li>

          {/* ━━━ TAB 2: AMETHYST TUTOR & JOBS ━━━ */}
          <li className="w-full flex justify-center">
            <Link
              to="/tutor"
              preload="intent"
              onClick={onTap}
              className={cn(
                "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-200 transform-gpu",
                isTutorJobs ? "scale-[1.04]" : "active:scale-95 hover:opacity-90"
              )}
              title="Tutor & Jobs Marketplace"
            >
              {/* 3D Raised Amethyst Jewel */}
              <div
                className={cn(
                  "relative flex size-9 sm:size-10 items-center justify-center rounded-2xl transition-all duration-300 transform-gpu",
                  isTutorJobs
                    ? "bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-800 text-white border border-purple-300/90 shadow-[0_6px_20px_rgba(147,51,234,0.55),0_2px_4px_rgba(107,33,168,0.4),inset_0_1.5px_1px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(88,28,135,0.5)]"
                    : "bg-gradient-to-b from-purple-50 to-fuchsia-100/70 text-purple-800 border border-purple-300/60 shadow-[0_2px_6px_rgba(147,51,234,0.12),inset_0_1px_1px_rgba(255,255,255,0.85)] group-hover:bg-purple-100"
                )}
              >
                <GraduationCap
                  className={cn(
                    "size-[18px] transition-transform duration-200",
                    isTutorJobs
                      ? "stroke-[2.6] drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                      : "stroke-[2.2] text-purple-800 group-hover:scale-105"
                  )}
                  aria-hidden="true"
                />

                {/* 3D Embossed EARN Highlight Badge */}
                <span className="absolute -top-1.5 -right-2.5 rounded-full bg-gradient-to-r from-fuchsia-600 via-pink-500 to-amber-400 px-[6px] py-[1px] text-[6.5px] font-black text-white shadow-[0_3px_8px_rgba(217,70,239,0.55)] border border-white/90 tracking-wider uppercase">
                  EARN
                </span>
              </div>

              {/* Tab Title */}
              <span
                className={cn(
                  "mt-1 text-[8.5px] sm:text-[10px] leading-tight tracking-tight transition-colors truncate max-w-full px-0.5 text-center",
                  isTutorJobs ? "font-black text-purple-950" : "font-bold text-purple-900/80"
                )}
              >
                Tutor
              </span>

              {/* 3D Tactile Neon Indicator Bar */}
              <div className="h-[3.5px] w-6 sm:w-7 mt-0.5 flex items-center justify-center">
                {isTutorJobs ? (
                  <span className="h-full w-full rounded-full bg-gradient-to-r from-purple-400 via-fuchsia-300 to-indigo-500 shadow-[0_0_12px_rgba(168,85,247,1)]" />
                ) : (
                  <span className="h-full w-0 rounded-full bg-transparent transition-all duration-300" />
                )}
              </div>
            </Link>
          </li>

          {/* ━━━ TAB 3: KINGPAY — 24K GOLD SOVEREIGN CENTERPIECE ━━━ */}
          <li className="w-full flex justify-center">
            <Link
              to="/king-pay"
              preload="intent"
              onClick={onTap}
              className="group relative -mt-6 sm:-mt-7 flex flex-col items-center justify-center no-underline transition-all duration-300 active:scale-95 transform-gpu"
              title="KingPay UPI & 24K Digital Gold"
            >
              {/* 24K Gold Sovereign Beveled Frame */}
              <div
                className={cn(
                  "relative p-[3.5px] sm:p-[4px] rounded-[24px] sm:rounded-[26px] transition-all duration-300 transform-gpu",
                  isKingPay
                    ? "scale-[1.14] shadow-[0_14px_36px_rgba(245,158,11,0.7),0_0_0_3px_rgba(251,191,36,0.6),inset_0_2px_4px_rgba(255,255,255,0.95)]"
                    : "shadow-[0_10px_28px_rgba(245,158,11,0.48),0_0_0_1.5px_rgba(245,158,11,0.35),inset_0_1.5px_2px_rgba(255,255,255,0.85)] group-hover:scale-105 group-hover:shadow-[0_12px_32px_rgba(245,158,11,0.6)]"
                )}
                style={{
                  background:
                    "linear-gradient(135deg, #FFF099 0%, #F59E0B 22%, #FFEAA7 45%, #D97706 70%, #92400E 100%)",
                }}
              >
                {/* Obsidian Jewel Core with 3D Embossed Crown */}
                <div className="flex size-[48px] sm:size-[54px] items-center justify-center rounded-[21px] sm:rounded-[22px] bg-gradient-to-b from-stone-950 via-[#191612] to-amber-950 text-amber-300 shadow-[inset_0_3px_8px_rgba(0,0,0,0.85)] relative overflow-hidden border border-amber-400/30">
                  {/* Diagonal Specular Sheen */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-300/15 to-transparent pointer-events-none" />
                  <Crown className="size-6 sm:size-7 text-amber-300 fill-amber-400/40 drop-shadow-[0_2px_12px_rgba(245,158,11,1)] stroke-[2.3]" />
                </div>

                {/* 3D 24K GOLD Sovereign Badge */}
                <div
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-[1.5px] shadow-[0_2px_6px_rgba(0,0,0,0.3)] border border-amber-100"
                  style={{
                    background: "linear-gradient(90deg, #F59E0B, #FDE68A, #F59E0B)",
                  }}
                >
                  <span className="flex items-center gap-0.5 text-[6.5px] sm:text-[7.5px] font-black uppercase tracking-wider text-stone-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">
                    <Crown className="size-2 text-stone-950 fill-stone-950" />
                    24K GOLD
                  </span>
                </div>

                {/* UPI Instant Badge */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/95 px-1.5 py-[0.5px] shadow-sm border border-amber-300/80">
                  <span className="text-[6.5px] font-black text-amber-950 tracking-wider">UPI</span>
                </div>
              </div>

              {/* Centerpiece Title */}
              <span className="mt-1 text-[9.5px] sm:text-[10.5px] font-black tracking-tight leading-tight text-amber-950 group-hover:text-amber-900">
                KingPay
              </span>

              {/* 3D Tactile 24K Gold Bar Indicator */}
              <div className="h-[3.5px] w-8 sm:w-9 mt-0.5 flex items-center justify-center">
                {isKingPay ? (
                  <span className="h-full w-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 shadow-[0_0_14px_rgba(245,158,11,1)]" />
                ) : (
                  <span className="h-full w-0 rounded-full bg-transparent transition-all duration-300" />
                )}
              </div>
            </Link>
          </li>

          {/* ━━━ TAB 4: SAPPHIRE TRAVEL & STAYS ━━━ */}
          <li className="w-full flex justify-center">
            <Link
              to="/travel"
              preload="intent"
              onClick={onTap}
              className={cn(
                "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-200 transform-gpu",
                isTravel && !isTrips ? "scale-[1.04]" : "active:scale-95 hover:opacity-90"
              )}
              title="Travel Flights & Luxury Stays"
            >
              {/* 3D Raised Sapphire Jewel */}
              <div
                className={cn(
                  "relative flex size-9 sm:size-10 items-center justify-center rounded-2xl transition-all duration-300 transform-gpu",
                  isTravel && !isTrips
                    ? "bg-gradient-to-br from-blue-500 via-indigo-600 to-sky-700 text-white border border-blue-300/90 shadow-[0_6px_20px_rgba(37,99,235,0.55),0_2px_4px_rgba(29,78,216,0.4),inset_0_1.5px_1px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(30,58,138,0.5)]"
                    : "bg-gradient-to-b from-sky-50 to-blue-100/70 text-blue-800 border border-blue-300/60 shadow-[0_2px_6px_rgba(37,99,235,0.12),inset_0_1px_1px_rgba(255,255,255,0.85)] group-hover:bg-blue-100"
                )}
              >
                <Plane
                  className={cn(
                    "size-[18px] transition-transform duration-200 -rotate-12",
                    isTravel && !isTrips
                      ? "stroke-[2.6] drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                      : "stroke-[2.2] text-blue-800 group-hover:scale-105"
                  )}
                  aria-hidden="true"
                />

                {/* 3D Aviation 0% FEE Banner */}
                <span className="absolute -top-1.5 -right-2.5 rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 px-[6px] py-[1px] text-[6.5px] font-black text-white shadow-[0_3px_8px_rgba(37,99,235,0.55)] border border-white/90 tracking-wider uppercase">
                  0% FEE
                </span>
              </div>

              {/* Tab Title */}
              <span
                className={cn(
                  "mt-1 text-[8.5px] sm:text-[10px] leading-tight tracking-tight transition-colors truncate max-w-full px-0.5 text-center",
                  isTravel && !isTrips ? "font-black text-blue-950" : "font-bold text-blue-900/80"
                )}
              >
                Travel
              </span>

              {/* 3D Tactile Neon Indicator Bar */}
              <div className="h-[3.5px] w-6 sm:w-7 mt-0.5 flex items-center justify-center">
                {isTravel && !isTrips ? (
                  <span className="h-full w-full rounded-full bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-500 shadow-[0_0_12px_rgba(37,99,235,1)]" />
                ) : (
                  <span className="h-full w-0 rounded-full bg-transparent transition-all duration-300" />
                )}
              </div>
            </Link>
          </li>

          {/* ━━━ TAB 5: RUBY ORDERS / TRIPS ━━━ */}
          <li className="w-full flex justify-center">
            <Link
              to={isTravel ? "/travel/trips" : "/orders"}
              preload="intent"
              onClick={onTap}
              className={cn(
                "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-200 transform-gpu",
                isOrders ? "scale-[1.04]" : "active:scale-95 hover:opacity-90"
              )}
              title={isTravel ? "My Trips & Boarding Passes" : "My Orders & Tracking"}
            >
              {/* 3D Raised Ruby Jewel */}
              <div
                className={cn(
                  "relative flex size-9 sm:size-10 items-center justify-center rounded-2xl transition-all duration-300 transform-gpu",
                  isOrders
                    ? "bg-gradient-to-br from-rose-500 via-red-600 to-rose-800 text-white border border-rose-300/90 shadow-[0_6px_20px_rgba(225,29,72,0.55),0_2px_4px_rgba(190,18,60,0.4),inset_0_1.5px_1px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(159,18,57,0.5)]"
                    : "bg-gradient-to-b from-rose-50 to-red-100/70 text-rose-800 border border-rose-300/60 shadow-[0_2px_6px_rgba(225,29,72,0.12),inset_0_1px_1px_rgba(255,255,255,0.85)] group-hover:bg-rose-100"
                )}
              >
                {isTravel ? (
                  <Ticket
                    className={cn(
                      "size-[18px] transition-transform duration-200",
                      isOrders
                        ? "stroke-[2.6] drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                        : "stroke-[2.2] text-rose-800 group-hover:scale-105"
                    )}
                    aria-hidden="true"
                  />
                ) : (
                  <ShoppingBag
                    className={cn(
                      "size-[18px] transition-transform duration-200",
                      isOrders
                        ? "stroke-[2.6] drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                        : "stroke-[2.2] text-rose-800 group-hover:scale-105"
                    )}
                    aria-hidden="true"
                  />
                )}

                {/* 3D Tactile Radar Beacon / Live Orders Indicator */}
                {hasActiveOrder ? (
                  <span className="absolute -top-1 -right-1 flex size-3.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-500 opacity-75" />
                    <span className="relative inline-flex size-3 rounded-full bg-rose-600 border-[1.5px] border-white shadow-[0_0_8px_rgba(225,29,72,1)]" />
                  </span>
                ) : totalCartCount > 0 ? (
                  <span className="absolute -top-1.5 -right-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-rose-600 px-1 text-[8px] font-black text-white shadow-md border border-white/90">
                    {totalCartCount}
                  </span>
                ) : null}
              </div>

              {/* Tab Title */}
              <span
                className={cn(
                  "mt-1 text-[8.5px] sm:text-[10px] leading-tight tracking-tight transition-colors truncate max-w-full px-0.5 text-center",
                  isOrders ? "font-black text-rose-950" : "font-bold text-rose-900/80"
                )}
              >
                {isTravel ? "Trips" : "Orders"}
              </span>

              {/* 3D Tactile Neon Indicator Bar */}
              <div className="h-[3.5px] w-6 sm:w-7 mt-0.5 flex items-center justify-center">
                {isOrders ? (
                  <span className="h-full w-full rounded-full bg-gradient-to-r from-rose-400 via-pink-300 to-red-500 shadow-[0_0_12px_rgba(225,29,72,1)]" />
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
