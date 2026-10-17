import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  UtensilsCrossed,
  GraduationCap,
  Plane,
  ShoppingBag,
  Crown,
  Sparkles,
  Zap,
  Briefcase,
  Flame,
} from "lucide-react";
import { useCartStore, cartCount } from "@/lib/stores/cart";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listMyOrders } from "@/lib/server/orders";
import { cn } from "@/lib/utils";
import { useCallback } from "react";

interface FloatingBottomNavProps {
  className?: string;
}

/** Trigger crisp tactile haptic pulse on supported devices */
function hapticTap() {
  try {
    if (typeof window !== "undefined" && typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate([12, 30, 18]);
    }
  } catch {
    /* silent on unsupported devices / browser security restrictions */
  }
}

export function CustomerFloatingBottomNav({ className }: FloatingBottomNavProps) {
  const pathname = useRouterState({ select: (s) => s?.location?.pathname ?? "" }) ?? "";
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

  const isDelivery =
    pathname === "/" ||
    pathname.startsWith("/delivery") ||
    pathname.startsWith("/restaurants") ||
    pathname.startsWith("/menu") ||
    pathname.startsWith("/r/");
  const isTutorJobs = pathname.startsWith("/tutor");
  const isKingPay =
    pathname.startsWith("/king-pay") ||
    pathname.startsWith("/earn") ||
    pathname.startsWith("/wallet") ||
    pathname.startsWith("/kingpay-wallet");
  const isTravel = pathname.startsWith("/travel");
  const isOrders = pathname.startsWith("/orders");

  const onTap = useCallback(() => hapticTap(), []);

  return (
    <nav
      role="navigation"
      aria-label="OrderKing Primary Navigation"
      className={cn(
        "fixed inset-x-0 bottom-2 sm:bottom-3.5 z-50 pointer-events-none mx-auto w-full max-w-lg px-2 sm:px-3 select-none",
        className
      )}
    >
      {/* ─── DYNAMIC PRISMATIC JEWEL AURA (AMBIENT FLOOR ILLUMINATION) ─── */}
      <div
        className="absolute -inset-1.5 rounded-[36px] opacity-90 blur-2xl pointer-events-none -z-10 transition-all duration-700"
        style={{
          background: isKingPay
            ? "radial-gradient(ellipse at 50% 60%, rgba(245,158,11,0.75) 0%, rgba(217,119,6,0.35) 45%, transparent 75%)"
            : isDelivery
            ? "radial-gradient(ellipse at 12% 60%, rgba(16,185,129,0.7) 0%, rgba(245,158,11,0.3) 45%, transparent 75%)"
            : isTutorJobs
            ? "radial-gradient(ellipse at 32% 60%, rgba(99,102,241,0.7) 0%, rgba(168,85,247,0.35) 45%, transparent 75%)"
            : isTravel
            ? "radial-gradient(ellipse at 68% 60%, rgba(14,165,233,0.7) 0%, rgba(37,99,235,0.35) 45%, transparent 75%)"
            : isOrders
            ? "radial-gradient(ellipse at 88% 60%, rgba(225,29,72,0.7) 0%, rgba(244,63,94,0.35) 45%, transparent 75%)"
            : "radial-gradient(ellipse at center, rgba(245,158,11,0.5) 0%, rgba(16,185,129,0.25) 35%, rgba(225,29,72,0.25) 65%, transparent 80%)",
        }}
      />

      {/* Secondary Multi-Layer Prismatic Spectral Floor Glow */}
      <div
        className="absolute -bottom-2 inset-x-8 h-7 rounded-full opacity-60 blur-xl pointer-events-none -z-10"
        style={{
          background:
            "linear-gradient(90deg, rgba(16,185,129,0.45) 0%, rgba(99,102,241,0.45) 25%, rgba(245,158,11,0.75) 50%, rgba(14,165,233,0.45) 75%, rgba(225,29,72,0.45) 100%)",
        }}
      />

      {/* ─── SUPREME ULTRA-LUXURY 3D GLASSMORPHIC DOCK ─── */}
      <div
        className="pointer-events-auto relative overflow-visible rounded-[30px] sm:rounded-[34px] px-1.5 sm:px-2 pt-2 pb-1.5 transition-all duration-300"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,253,248,0.96) 50%, rgba(255,255,255,0.98) 100%)",
          backdropFilter: "blur(32px) saturate(2.2)",
          WebkitBackdropFilter: "blur(32px) saturate(2.2)",
          border: "1.5px solid rgba(245, 158, 11, 0.45)",
          boxShadow: [
            "0 26px 65px -10px rgba(15,23,42,0.28)",
            "0 14px 32px -5px rgba(245,158,11,0.28)",
            "inset 0 2px 2px rgba(255,255,255,1)",
            "inset 0 -2px 3px rgba(245,158,11,0.18)",
          ].join(","),
        }}
      >
        {/* Specular Gold Refraction Beam - Top Rim */}
        <div className="absolute top-0 inset-x-6 sm:inset-x-10 h-[2px] bg-gradient-to-r from-transparent via-amber-300 via-amber-400/95 to-transparent pointer-events-none drop-shadow-[0_1px_3px_rgba(245,158,11,0.9)]" />
        
        {/* Subtle Bottom Metallic Bevel Line */}
        <div className="absolute bottom-0 inset-x-8 h-[1px] bg-gradient-to-r from-emerald-400/40 via-amber-400/60 to-rose-400/40 pointer-events-none" />

        <ul className="grid grid-cols-5 items-end justify-items-center relative w-full m-0 p-0 list-none">
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* 1. DELIVERY TAB (3D Amber-Gold Cloche with Emerald Aura)        */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <li className="w-full flex justify-center">
            <Link
              to="/"
              preload="intent"
              onClick={onTap}
              className={cn(
                "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu",
                isDelivery ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
              )}
              title="OrderKing Food Delivery"
            >
              {/* 3D Raised Cloche Jewel Button */}
              <div
                className={cn(
                  "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300 transform-gpu",
                  isDelivery
                    ? "bg-gradient-to-br from-amber-400 via-emerald-600 to-teal-900 text-white border-2 border-amber-300 shadow-[0_8px_24px_rgba(16,185,129,0.65),0_2px_10px_rgba(245,158,11,0.5),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(4,120,87,0.8)]"
                    : "bg-gradient-to-b from-amber-50 to-emerald-100/70 text-emerald-900 border border-emerald-300/70 shadow-[0_3px_8px_rgba(16,185,129,0.18),inset_0_1px_1.5px_rgba(255,255,255,0.9)] group-hover:bg-emerald-100"
                )}
              >
                {/* 3D Cloche & Hot Platter Graphic */}
                <div className="relative flex items-center justify-center">
                  <UtensilsCrossed
                    className={cn(
                      "size-5 transition-transform duration-200",
                      isDelivery
                        ? "stroke-[2.6] drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
                        : "stroke-[2.2] text-emerald-900 group-hover:scale-105"
                    )}
                    aria-hidden="true"
                  />
                  {/* Floating Golden Flame/Spark */}
                  <Flame
                    className={cn(
                      "absolute -top-2 -right-1.5 size-3 transition-all duration-200",
                      isDelivery
                        ? "text-amber-300 fill-amber-300 drop-shadow-[0_1px_6px_rgba(245,158,11,1)]"
                        : "text-amber-500 fill-amber-400/80"
                    )}
                    aria-hidden="true"
                  />
                </div>

                {/* 3D Radar Beacon (Live Fresh Kitchen Dispatch) */}
                <span className="absolute -top-1 -right-1 flex size-3">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-80" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-gradient-to-tr from-emerald-500 to-amber-300 border border-white shadow-[0_0_8px_rgba(16,185,129,1)]" />
                </span>
              </div>

              {/* Tab Title: Delivery */}
              <span
                className={cn(
                  "mt-1 text-[9px] sm:text-[10px] leading-tight tracking-tight transition-colors truncate max-w-full px-0.5 text-center",
                  isDelivery ? "font-black text-emerald-950 drop-shadow-[0_0.5px_0_rgba(16,185,129,0.3)]" : "font-black text-stone-700"
                )}
              >
                Delivery
              </span>

              {/* Sub-Pill: FOOD */}
              <span
                className={cn(
                  "text-[6.5px] sm:text-[7px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 shadow-2xs border transition-all",
                  isDelivery
                    ? "text-emerald-950 bg-gradient-to-r from-amber-300 to-emerald-300 border-emerald-400/80 shadow-[0_1px_4px_rgba(16,185,129,0.3)]"
                    : "text-emerald-800 bg-emerald-100/90 border-emerald-300/60"
                )}
              >
                FOOD
              </span>

              {/* 3D Tactile Neon Under-Pill Light */}
              <div className="h-[3.5px] w-7 sm:w-8 mt-0.5 flex items-center justify-center">
                {isDelivery ? (
                  <span className="h-full w-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 shadow-[0_0_14px_rgba(16,185,129,1)]" />
                ) : (
                  <span className="h-full w-0 rounded-full bg-transparent transition-all duration-300" />
                )}
              </div>
            </Link>
          </li>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* 2. TUTOR & JOBS TAB (3D Sapphire-Indigo Graduation Cap & Spark) */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <li className="w-full flex justify-center">
            <Link
              to="/tutor"
              preload="intent"
              onClick={onTap}
              className={cn(
                "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu",
                isTutorJobs ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
              )}
              title="AI Tutor & High-Paying Jobs"
            >
              {/* 3D Raised Sapphire-Amethyst Jewel */}
              <div
                className={cn(
                  "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300 transform-gpu",
                  isTutorJobs
                    ? "bg-gradient-to-br from-indigo-500 via-purple-600 to-slate-900 text-white border-2 border-indigo-300 shadow-[0_8px_24px_rgba(99,102,241,0.65),0_2px_10px_rgba(168,85,247,0.5),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(79,70,229,0.8)]"
                    : "bg-gradient-to-b from-indigo-50 to-purple-100/70 text-indigo-900 border border-indigo-300/70 shadow-[0_3px_8px_rgba(99,102,241,0.18),inset_0_1px_1.5px_rgba(255,255,255,0.9)] group-hover:bg-indigo-100"
                )}
              >
                <div className="relative flex items-center justify-center">
                  <GraduationCap
                    className={cn(
                      "size-5 transition-transform duration-200",
                      isTutorJobs
                        ? "stroke-[2.6] drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                        : "stroke-[2.2] text-indigo-900 group-hover:scale-105"
                    )}
                    aria-hidden="true"
                  />
                  {/* AI Spark Icon */}
                  <Sparkles
                    className={cn(
                      "absolute -top-2 -right-1.5 size-3 transition-all duration-200",
                      isTutorJobs
                        ? "text-yellow-300 fill-yellow-300 drop-shadow-[0_1px_6px_rgba(234,179,8,1)]"
                        : "text-purple-500 fill-purple-400/80"
                    )}
                    aria-hidden="true"
                  />
                </div>

                {/* 3D Embossed EARN / JOBS Badge */}
                <span className="absolute -top-1.5 -right-2 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-1.5 py-[0.5px] text-[6.5px] font-black text-white shadow-[0_3px_8px_rgba(99,102,241,0.6)] border border-white/90 tracking-wider uppercase">
                  JOBS
                </span>
              </div>

              {/* Tab Title: Tutor & Jobs */}
              <span
                className={cn(
                  "mt-1 text-[8.5px] sm:text-[9.5px] leading-tight tracking-tight transition-colors truncate max-w-full px-0.5 text-center",
                  isTutorJobs ? "font-black text-indigo-950 drop-shadow-[0_0.5px_0_rgba(99,102,241,0.3)]" : "font-black text-stone-700"
                )}
              >
                Tutor &amp; Jobs
              </span>

              {/* Sub-Pill: LEARN */}
              <span
                className={cn(
                  "text-[6.5px] sm:text-[7px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 shadow-2xs border transition-all",
                  isTutorJobs
                    ? "text-indigo-950 bg-gradient-to-r from-purple-200 to-indigo-300 border-indigo-400/80 shadow-[0_1px_4px_rgba(99,102,241,0.3)]"
                    : "text-indigo-800 bg-indigo-100/90 border-indigo-300/60"
                )}
              >
                LEARN
              </span>

              {/* 3D Tactile Neon Under-Pill Light */}
              <div className="h-[3.5px] w-7 sm:w-8 mt-0.5 flex items-center justify-center">
                {isTutorJobs ? (
                  <span className="h-full w-full rounded-full bg-gradient-to-r from-indigo-400 via-fuchsia-300 to-purple-500 shadow-[0_0_14px_rgba(99,102,241,1)]" />
                ) : (
                  <span className="h-full w-0 rounded-full bg-transparent transition-all duration-300" />
                )}
              </div>
            </Link>
          </li>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* 3. KING PAY TAB (CENTERPIECE: ELEVATED 3D REGAL IMPERIAL CROWN) */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <li className="w-full flex justify-center">
            <Link
              to="/king-pay"
              preload="intent"
              onClick={onTap}
              className="group relative -mt-7 sm:-mt-8 flex flex-col items-center justify-center no-underline transition-all duration-300 active:scale-95 transform-gpu"
              title="King Pay UPI & 24K Sovereign Gold"
            >
              {/* 24K Gold Sovereign Beveled Frame with Pulse Ring */}
              <div
                className={cn(
                  "relative p-[4px] sm:p-[4.5px] rounded-[26px] sm:rounded-[28px] transition-all duration-300 transform-gpu",
                  isKingPay
                    ? "scale-115 shadow-[0_18px_45px_rgba(245,158,11,0.85),0_0_0_3.5px_rgba(251,191,36,0.8),inset_0_2px_4px_rgba(255,255,255,0.95)]"
                    : "shadow-[0_12px_32px_rgba(245,158,11,0.55),0_0_0_2px_rgba(245,158,11,0.45),inset_0_1.5px_2px_rgba(255,255,255,0.9)] group-hover:scale-105 group-hover:shadow-[0_16px_38px_rgba(245,158,11,0.7)]"
                )}
                style={{
                  background:
                    "linear-gradient(135deg, #FFF9D2 0%, #F59E0B 20%, #FFE680 40%, #D97706 65%, #78350F 100%)",
                }}
              >
                {/* Obsidian Core with 3D Embossed Imperial Crown */}
                <div className="flex size-[52px] sm:size-[58px] items-center justify-center rounded-[22px] sm:rounded-[24px] bg-gradient-to-b from-stone-950 via-[#18130e] to-amber-950 text-amber-300 shadow-[inset_0_3px_10px_rgba(0,0,0,0.95)] relative overflow-hidden border border-amber-400/50">
                  {/* Diagonal Specular Sheen Beam */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-300/25 to-transparent pointer-events-none" />
                  
                  <Crown className="size-7 sm:size-8 text-amber-300 fill-amber-400/60 drop-shadow-[0_2px_16px_rgba(245,158,11,1)] stroke-[2.4]" />
                </div>

                {/* 3D 24K GOLD Crown Sovereign Badge */}
                <div
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-[1.5px] shadow-[0_3px_10px_rgba(0,0,0,0.4)] border border-amber-100"
                  style={{
                    background: "linear-gradient(90deg, #F59E0B, #FEF08A, #F59E0B)",
                  }}
                >
                  <span className="flex items-center gap-1 text-[7px] sm:text-[8px] font-black uppercase tracking-wider text-stone-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]">
                    <Crown className="size-2 text-stone-950 fill-stone-950" />
                    24K GOLD
                  </span>
                </div>

                {/* UPI INSTANT 0% FEE Badge */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2.5 py-[1px] shadow-[0_3px_8px_rgba(0,0,0,0.3)] border border-amber-400 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[7px] sm:text-[7.5px] font-black text-amber-950 tracking-wider">UPI INSTANT</span>
                </div>
              </div>

              {/* Centerpiece Title: King Pay */}
              <span className="mt-1 text-[9px] sm:text-[10.5px] font-black tracking-tight leading-tight text-amber-950 group-hover:text-amber-900 drop-shadow-[0_0.5px_0_rgba(245,158,11,0.3)]">
                King Pay
              </span>

              {/* Sub-Pill: 0% FEE */}
              <span
                className={cn(
                  "text-[6.5px] sm:text-[7px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 shadow-2xs border transition-all",
                  isKingPay
                    ? "text-amber-950 bg-gradient-to-r from-yellow-300 to-amber-300 border-amber-400/80 shadow-[0_1px_4px_rgba(245,158,11,0.4)]"
                    : "text-amber-800 bg-amber-100/90 border-amber-300/60"
                )}
              >
                0% FEE
              </span>

              {/* 3D Tactile 24K Gold Bar Indicator */}
              <div className="h-[3.5px] w-9 sm:w-10 mt-0.5 flex items-center justify-center">
                {isKingPay ? (
                  <span className="h-full w-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 shadow-[0_0_16px_rgba(245,158,11,1)]" />
                ) : (
                  <span className="h-full w-0 rounded-full bg-transparent transition-all duration-300" />
                )}
              </div>
            </Link>
          </li>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* 4. TRAVEL TAB (3D Emerald-Teal to Sapphire Jetliner)            */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <li className="w-full flex justify-center">
            <Link
              to="/travel"
              preload="intent"
              onClick={onTap}
              className={cn(
                "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu",
                isTravel ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
              )}
              title="Sovereign Travel, Flights & Luxury Stays"
            >
              {/* 3D Raised Sapphire-Teal Jewel */}
              <div
                className={cn(
                  "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300 transform-gpu",
                  isTravel
                    ? "bg-gradient-to-br from-cyan-500 via-blue-600 to-slate-900 text-white border-2 border-cyan-300 shadow-[0_8px_24px_rgba(14,165,233,0.65),0_2px_10px_rgba(37,99,235,0.5),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(2,132,199,0.8)]"
                    : "bg-gradient-to-b from-sky-50 to-cyan-100/70 text-sky-900 border border-sky-300/70 shadow-[0_3px_8px_rgba(14,165,233,0.18),inset_0_1px_1.5px_rgba(255,255,255,0.9)] group-hover:bg-sky-100"
                )}
              >
                <Plane
                  className={cn(
                    "size-5 transition-transform duration-200 -rotate-12",
                    isTravel
                      ? "stroke-[2.6] drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                      : "stroke-[2.2] text-sky-900 group-hover:scale-105"
                  )}
                  aria-hidden="true"
                />

                {/* 3D Aviation 0% FEE Banner */}
                <span className="absolute -top-1.5 -right-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-1.5 py-[0.5px] text-[6.5px] font-black text-white shadow-[0_3px_8px_rgba(14,165,233,0.6)] border border-white/90 tracking-wider uppercase">
                  TRIPS
                </span>
              </div>

              {/* Tab Title: Travel */}
              <span
                className={cn(
                  "mt-1 text-[9px] sm:text-[10px] leading-tight tracking-tight transition-colors truncate max-w-full px-0.5 text-center",
                  isTravel ? "font-black text-sky-950 drop-shadow-[0_0.5px_0_rgba(14,165,233,0.3)]" : "font-black text-stone-700"
                )}
              >
                Travel
              </span>

              {/* Sub-Pill: TRIPS */}
              <span
                className={cn(
                  "text-[6.5px] sm:text-[7px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 shadow-2xs border transition-all",
                  isTravel
                    ? "text-sky-950 bg-gradient-to-r from-cyan-200 to-sky-300 border-sky-400/80 shadow-[0_1px_4px_rgba(14,165,233,0.3)]"
                    : "text-sky-800 bg-sky-100/90 border-sky-300/60"
                )}
              >
                STAYS
              </span>

              {/* 3D Tactile Neon Under-Pill Light */}
              <div className="h-[3.5px] w-7 sm:w-8 mt-0.5 flex items-center justify-center">
                {isTravel ? (
                  <span className="h-full w-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 shadow-[0_0_14px_rgba(14,165,233,1)]" />
                ) : (
                  <span className="h-full w-0 rounded-full bg-transparent transition-all duration-300" />
                )}
              </div>
            </Link>
          </li>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* 5. ORDERS TAB (3D Ruby-Rose Parcel with Live Radar Beacon)      */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <li className="w-full flex justify-center">
            <Link
              to="/orders"
              preload="intent"
              onClick={onTap}
              className={cn(
                "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu",
                isOrders ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
              )}
              title="My Orders & Real-Time Tracking"
            >
              {/* 3D Raised Ruby Jewel */}
              <div
                className={cn(
                  "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300 transform-gpu",
                  isOrders
                    ? "bg-gradient-to-br from-rose-500 via-red-600 to-rose-950 text-white border-2 border-rose-300 shadow-[0_8px_24px_rgba(225,29,72,0.65),0_2px_10px_rgba(190,18,60,0.5),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(159,18,57,0.8)]"
                    : "bg-gradient-to-b from-rose-50 to-red-100/70 text-rose-900 border border-rose-300/70 shadow-[0_3px_8px_rgba(225,29,72,0.18),inset_0_1px_1.5px_rgba(255,255,255,0.9)] group-hover:bg-rose-100"
                )}
              >
                <ShoppingBag
                  className={cn(
                    "size-5 transition-transform duration-200",
                    isOrders
                      ? "stroke-[2.6] drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                      : "stroke-[2.2] text-rose-900 group-hover:scale-105"
                  )}
                  aria-hidden="true"
                />

                {/* 3D Tactile Radar Ping (Active Order) or Cart Count Pill */}
                {hasActiveOrder ? (
                  <span className="absolute -top-1 -right-1 flex size-3.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-500 opacity-80" />
                    <span className="relative inline-flex size-3.5 rounded-full bg-rose-600 border-[1.5px] border-white shadow-[0_0_12px_rgba(225,29,72,1)]" />
                  </span>
                ) : totalCartCount > 0 ? (
                  <span className="absolute -top-1.5 -right-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-rose-700 px-1 text-[8.5px] font-black text-white shadow-[0_2px_6px_rgba(225,29,72,0.6)] border border-white">
                    {totalCartCount}
                  </span>
                ) : null}
              </div>

              {/* Tab Title: Orders */}
              <span
                className={cn(
                  "mt-1 text-[9px] sm:text-[10px] leading-tight tracking-tight transition-colors truncate max-w-full px-0.5 text-center",
                  isOrders ? "font-black text-rose-950 drop-shadow-[0_0.5px_0_rgba(225,29,72,0.3)]" : "font-black text-stone-700"
                )}
              >
                Orders
              </span>

              {/* Sub-Pill: TRACK */}
              <span
                className={cn(
                  "text-[6.5px] sm:text-[7px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 shadow-2xs border transition-all",
                  isOrders
                    ? "text-rose-950 bg-gradient-to-r from-rose-200 to-pink-300 border-rose-400/80 shadow-[0_1px_4px_rgba(225,29,72,0.3)]"
                    : "text-rose-800 bg-rose-100/90 border-rose-300/60"
                )}
              >
                TRACK
              </span>

              {/* 3D Tactile Neon Under-Pill Light */}
              <div className="h-[3.5px] w-7 sm:w-8 mt-0.5 flex items-center justify-center">
                {isOrders ? (
                  <span className="h-full w-full rounded-full bg-gradient-to-r from-rose-400 via-pink-300 to-red-500 shadow-[0_0_14px_rgba(225,29,72,1)]" />
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
