import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  UtensilsCrossed,
  Store,
  Search,
  ShoppingBag,
  Receipt,
  Compass,
  Plane,
  Train,
  Car,
  Ticket,
  Sparkles,
  BookOpen,
  Briefcase,
  Bookmark,
  CheckCircle2,
  CreditCard,
  Users,
  Coins,
  FileText,
  HelpCircle,
  Crown,
  Flame,
} from "lucide-react";
import { useCartStore, cartCount } from "@/lib/stores/cart";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listMyOrders } from "@/lib/server/orders";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

export type ActivePlatform = "delivery" | "kingpay" | "travel" | "tutor";

export function resolvePlatformContext(pathname?: string | null): ActivePlatform {
  if (!pathname || typeof pathname !== "string") return "delivery";
  const p = pathname.toLowerCase();
  if (
    p.startsWith("/king-pay") ||
    p.startsWith("/earn") ||
    p.startsWith("/wallet") ||
    p.startsWith("/kingpay")
  ) {
    return "kingpay";
  }
  if (p.startsWith("/travel")) {
    return "travel";
  }
  if (p.startsWith("/tutor")) {
    return "tutor";
  }
  return "delivery";
}

function hapticTap() {
  try {
    if (typeof window !== "undefined" && typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate([12, 30, 18]);
    }
  } catch {
    /* silent on unsupported devices */
  }
}

interface FloatingBottomNavProps {
  className?: string;
}

export function CustomerFloatingBottomNav({ className }: FloatingBottomNavProps) {
  const pathname = (useRouterState({ select: (s) => s?.location?.pathname ?? "" }) ?? "") as string;
  const hash = (useRouterState({ select: (s) => s?.location?.hash ?? "" }) ?? "") as string;
  const cleanHash = (hash || "").replace(/^#/, "").toLowerCase();
  const searchTab = (useRouterState({
    select: (s) => {
      const search = s?.location?.search as Record<string, unknown> | undefined;
      return typeof search?.tab === "string" ? search.tab : "";
    },
  }) ?? "") as string;

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

  const [careerAppCount, setCareerAppCount] = useState<number>(0);
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem("orderking_job_applications_v1");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setCareerAppCount(parsed.length);
        }
      }
    } catch {
      // safe fallback
    }
  }, [pathname]);

  const activePlatform = resolvePlatformContext(pathname);
  const onTap = useCallback(() => hapticTap(), []);

  return (
    <nav
      role="navigation"
      aria-label="OrderKing Contextual Platform Dock"
      className={cn(
        "fixed inset-x-0 bottom-2 sm:bottom-3.5 z-50 pointer-events-none mx-auto w-full max-w-lg px-2 sm:px-3 select-none",
        className
      )}
    >
      {/* ─── DYNAMIC PRISMATIC AMBIENT GLOW ─── */}
      <div
        className="absolute -inset-1.5 rounded-[36px] opacity-85 blur-2xl pointer-events-none -z-10 transition-all duration-700"
        style={{
          background:
            activePlatform === "travel"
              ? "radial-gradient(ellipse at center, rgba(14,165,233,0.7) 0%, rgba(37,99,235,0.3) 50%, transparent 80%)"
              : activePlatform === "tutor"
              ? "radial-gradient(ellipse at center, rgba(168,85,247,0.7) 0%, rgba(99,102,241,0.3) 50%, transparent 80%)"
              : activePlatform === "kingpay"
              ? "radial-gradient(ellipse at center, rgba(245,158,11,0.7) 0%, rgba(217,119,6,0.3) 50%, transparent 80%)"
              : "radial-gradient(ellipse at center, rgba(16,185,129,0.7) 0%, rgba(245,158,11,0.3) 50%, transparent 80%)",
        }}
      />

      {/* ─── ULTRA-LUXURY OBSIDIAN JEWEL DOCK ─── */}
      <div
        className="pointer-events-auto relative overflow-visible rounded-[30px] sm:rounded-[34px] px-1.5 sm:px-2 pt-2 pb-1.5 transition-all duration-300 transform-gpu"
        style={{
          background:
            "linear-gradient(135deg, rgba(15,16,20,0.96) 0%, rgba(26,22,17,0.95) 50%, rgba(12,13,16,0.97) 100%)",
          backdropFilter: "blur(32px) saturate(2.4)",
          WebkitBackdropFilter: "blur(32px) saturate(2.4)",
          border:
            activePlatform === "travel"
              ? "1.5px solid rgba(14, 165, 233, 0.6)"
              : activePlatform === "tutor"
              ? "1.5px solid rgba(168, 85, 247, 0.6)"
              : activePlatform === "kingpay"
              ? "1.5px solid rgba(245, 158, 11, 0.7)"
              : "1.5px solid rgba(16, 185, 129, 0.6)",
          boxShadow: [
            "0 28px 70px -10px rgba(0,0,0,0.85)",
            "0 14px 34px -5px rgba(0,0,0,0.4)",
            "inset 0 1.5px 2px rgba(255,255,255,0.25)",
            "inset 0 -2px 4px rgba(0,0,0,0.5)",
          ].join(","),
        }}
      >
        {/* Specular Edge Top Rim */}
        <div className="absolute top-0 inset-x-6 sm:inset-x-10 h-[2px] bg-gradient-to-r from-transparent via-amber-300 to-transparent pointer-events-none drop-shadow-[0_1px_4px_rgba(245,158,11,1)]" />

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PLATFORM 1: FOOD DELIVERY NAVIGATION [Dishes, Kitchens, Search, Cart, Orders] */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activePlatform === "delivery" && (
          <ul className="grid grid-cols-5 items-end justify-items-center relative w-full m-0 p-0 list-none">
            {/* 1. DISHES / HOME */}
            <li className="w-full flex justify-center">
              <Link
                to="/"
                preload="intent"
                onClick={onTap}
                className={cn(
                  "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu",
                  pathname === "/" ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
                )}
                title="Food & Dishes"
              >
                <div
                  className={cn(
                    "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300",
                    pathname === "/"
                      ? "bg-gradient-to-br from-amber-400 via-emerald-600 to-teal-900 text-white border-2 border-amber-300 shadow-[0_8px_24px_rgba(16,185,129,0.7)]"
                      : "bg-gradient-to-b from-stone-900/95 to-stone-950/95 text-emerald-300/90 border border-emerald-500/30"
                  )}
                >
                  <UtensilsCrossed className="size-5 stroke-[2.3]" />
                </div>
                <span className={cn("mt-1 text-[9px] sm:text-[10px] font-black truncate", pathname === "/" ? "text-emerald-300" : "text-stone-300")}>
                  Dishes
                </span>
                <span className="text-[6.5px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 text-emerald-950 bg-emerald-300">
                  FOOD
                </span>
              </Link>
            </li>

            {/* 2. KITCHENS / DINING OUT */}
            <li className="w-full flex justify-center">
              <Link
                to="/dining"
                preload="intent"
                onClick={onTap}
                className={cn(
                  "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu",
                  pathname.startsWith("/dining") ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
                )}
                title="Kitchens & VIP Dining"
              >
                <div
                  className={cn(
                    "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300",
                    pathname.startsWith("/dining")
                      ? "bg-gradient-to-br from-rose-500 via-pink-600 to-rose-950 text-white border-2 border-rose-300 shadow-[0_8px_24px_rgba(244,63,94,0.7)]"
                      : "bg-gradient-to-b from-stone-900/95 to-stone-950/95 text-rose-300/90 border border-rose-500/30"
                  )}
                >
                  <Store className="size-5 stroke-[2.3]" />
                </div>
                <span className={cn("mt-1 text-[9px] sm:text-[10px] font-black truncate", pathname.startsWith("/dining") ? "text-rose-300" : "text-stone-300")}>
                  Kitchens
                </span>
                <span className="text-[6.5px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 text-rose-950 bg-rose-300">
                  DINING
                </span>
              </Link>
            </li>

            {/* 3. SEARCH (CENTERPIECE) */}
            <li className="w-full flex justify-center">
              <Link
                to="/search"
                preload="intent"
                onClick={onTap}
                className="group relative -mt-5 sm:-mt-6 flex flex-col items-center justify-center no-underline transition-all duration-300 active:scale-95 transform-gpu"
                title="Search Cuisines & Dishes"
              >
                <div
                  className={cn(
                    "relative p-[3px] rounded-[22px] transition-all duration-300 transform-gpu",
                    pathname.startsWith("/search")
                      ? "scale-110 shadow-[0_12px_32px_rgba(245,158,11,0.8)] border border-amber-300"
                      : "shadow-[0_8px_24px_rgba(0,0,0,0.6)] border border-amber-400/40"
                  )}
                  style={{
                    background: "linear-gradient(135deg, #FFF9D2 0%, #F59E0B 40%, #78350F 100%)",
                  }}
                >
                  <div className="flex size-[46px] sm:size-[50px] items-center justify-center rounded-[18px] bg-stone-950 text-amber-300 shadow-inner">
                    <Search className="size-6 stroke-[2.5]" />
                  </div>
                </div>
                <span className="mt-1 text-[9px] sm:text-[10px] font-black text-amber-300">
                  Search
                </span>
              </Link>
            </li>

            {/* 4. CART */}
            <li className="w-full flex justify-center">
              <Link
                to="/cart"
                preload="intent"
                onClick={onTap}
                className={cn(
                  "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu",
                  pathname.startsWith("/cart") ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
                )}
                title="Active Cart"
              >
                <div
                  className={cn(
                    "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300",
                    pathname.startsWith("/cart")
                      ? "bg-gradient-to-br from-amber-400 via-orange-500 to-amber-950 text-white border-2 border-amber-300 shadow-[0_8px_24px_rgba(245,158,11,0.7)]"
                      : "bg-gradient-to-b from-stone-900/95 to-stone-950/95 text-amber-300/90 border border-amber-500/30"
                  )}
                >
                  <ShoppingBag className="size-5 stroke-[2.3]" />
                  {totalCartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-black text-white border border-white">
                      {totalCartCount}
                    </span>
                  )}
                </div>
                <span className={cn("mt-1 text-[9px] sm:text-[10px] font-black truncate", pathname.startsWith("/cart") ? "text-amber-300" : "text-stone-300")}>
                  Cart
                </span>
                <span className="text-[6.5px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 text-amber-950 bg-amber-300">
                  CHECKOUT
                </span>
              </Link>
            </li>

            {/* 5. ORDERS */}
            <li className="w-full flex justify-center">
              <Link
                to="/orders"
                preload="intent"
                onClick={onTap}
                className={cn(
                  "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu",
                  pathname.startsWith("/orders") ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
                )}
                title="Past & Live Orders"
              >
                <div
                  className={cn(
                    "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300",
                    pathname.startsWith("/orders")
                      ? "bg-gradient-to-br from-rose-500 via-red-600 to-rose-950 text-white border-2 border-rose-300 shadow-[0_8px_24px_rgba(225,29,72,0.7)]"
                      : "bg-gradient-to-b from-stone-900/95 to-stone-950/95 text-rose-300/90 border border-rose-500/30"
                  )}
                >
                  <Receipt className="size-5 stroke-[2.3]" />
                  {hasActiveOrder && (
                    <span className="absolute -top-1 -right-1 flex size-3">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-80" />
                      <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500 border border-white" />
                    </span>
                  )}
                </div>
                <span className={cn("mt-1 text-[9px] sm:text-[10px] font-black truncate", pathname.startsWith("/orders") ? "text-rose-300" : "text-stone-300")}>
                  Orders
                </span>
                <span className="text-[6.5px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 text-rose-950 bg-rose-300">
                  STATUS
                </span>
              </Link>
            </li>
          </ul>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PLATFORM 2: TRAVELSTATION NAVIGATION [Compare, Flights, Trains, Cabs, My Trips] */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activePlatform === "travel" && (
          <ul className="grid grid-cols-5 items-end justify-items-center relative w-full m-0 p-0 list-none">
            {/* 1. COMPARE OVERVIEW */}
            <li className="w-full flex justify-center">
              <Link
                to="/travel"
                preload="intent"
                onClick={onTap}
                className={cn(
                  "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu",
                  pathname === "/travel" && !cleanHash ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
                )}
                title="Fare Comparison"
              >
                <div
                  className={cn(
                    "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300",
                    pathname === "/travel" && !cleanHash
                      ? "bg-gradient-to-br from-cyan-400 via-sky-600 to-blue-950 text-white border-2 border-cyan-300 shadow-[0_8px_24px_rgba(14,165,233,0.7)]"
                      : "bg-gradient-to-b from-stone-900/95 to-stone-950/95 text-cyan-300/90 border border-cyan-500/30"
                  )}
                >
                  <Compass className="size-5 stroke-[2.3]" />
                </div>
                <span className="mt-1 text-[9px] sm:text-[10px] font-black text-cyan-300">Compare</span>
                <span className="text-[6.5px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 text-cyan-950 bg-cyan-300">₹0 FEE</span>
              </Link>
            </li>

            {/* 2. FLIGHTS */}
            <li className="w-full flex justify-center">
              <Link
                to="/travel"
                hash="flights"
                preload="intent"
                onClick={onTap}
                className={cn(
                  "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu",
                  cleanHash === "flights" ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
                )}
                title="Domestic & International Flights"
              >
                <div
                  className={cn(
                    "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300",
                    cleanHash === "flights"
                      ? "bg-gradient-to-br from-sky-400 via-blue-600 to-indigo-950 text-white border-2 border-sky-300 shadow-[0_8px_24px_rgba(56,189,248,0.7)]"
                      : "bg-gradient-to-b from-stone-900/95 to-stone-950/95 text-sky-300/90 border border-sky-500/30"
                  )}
                >
                  <Plane className="size-5 stroke-[2.3]" />
                </div>
                <span className="mt-1 text-[9px] sm:text-[10px] font-black text-sky-300">Flights</span>
                <span className="text-[6.5px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 text-sky-950 bg-sky-300">AIRLINES</span>
              </Link>
            </li>

            {/* 3. TRAINS / IRCTC */}
            <li className="w-full flex justify-center">
              <Link
                to="/travel"
                hash="trains"
                preload="intent"
                onClick={onTap}
                className={cn(
                  "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu",
                  cleanHash === "trains" ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
                )}
                title="Indian Railways & IRCTC"
              >
                <div
                  className={cn(
                    "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300",
                    cleanHash === "trains"
                      ? "bg-gradient-to-br from-indigo-400 via-indigo-600 to-purple-950 text-white border-2 border-indigo-300 shadow-[0_8px_24px_rgba(99,102,241,0.7)]"
                      : "bg-gradient-to-b from-stone-900/95 to-stone-950/95 text-indigo-300/90 border border-indigo-500/30"
                  )}
                >
                  <Train className="size-5 stroke-[2.3]" />
                </div>
                <span className="mt-1 text-[9px] sm:text-[10px] font-black text-indigo-300">Trains</span>
                <span className="text-[6.5px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 text-indigo-950 bg-indigo-300">IRCTC</span>
              </Link>
            </li>

            {/* 4. CABS */}
            <li className="w-full flex justify-center">
              <Link
                to="/travel"
                hash="cabs"
                preload="intent"
                onClick={onTap}
                className={cn(
                  "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu",
                  cleanHash === "cabs" ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
                )}
                title="Airport & Outstation Cabs"
              >
                <div
                  className={cn(
                    "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300",
                    cleanHash === "cabs"
                      ? "bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-950 text-white border-2 border-amber-300 shadow-[0_8px_24px_rgba(245,158,11,0.7)]"
                      : "bg-gradient-to-b from-stone-900/95 to-stone-950/95 text-amber-300/90 border border-amber-500/30"
                  )}
                >
                  <Car className="size-5 stroke-[2.3]" />
                </div>
                <span className="mt-1 text-[9px] sm:text-[10px] font-black text-amber-300">Cabs</span>
                <span className="text-[6.5px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 text-amber-950 bg-amber-300">RIDES</span>
              </Link>
            </li>

            {/* 5. MY TRIPS */}
            <li className="w-full flex justify-center">
              <Link
                to="/travel/trips"
                preload="intent"
                onClick={onTap}
                className={cn(
                  "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu",
                  pathname.startsWith("/travel/trips") ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
                )}
                title="Saved Trips & Bookings"
              >
                <div
                  className={cn(
                    "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300",
                    pathname.startsWith("/travel/trips")
                      ? "bg-gradient-to-br from-emerald-400 via-teal-600 to-slate-950 text-white border-2 border-emerald-300 shadow-[0_8px_24px_rgba(16,185,129,0.7)]"
                      : "bg-gradient-to-b from-stone-900/95 to-stone-950/95 text-emerald-300/90 border border-emerald-500/30"
                  )}
                >
                  <Ticket className="size-5 stroke-[2.3]" />
                </div>
                <span className="mt-1 text-[9px] sm:text-[10px] font-black text-emerald-300">My Trips</span>
                <span className="text-[6.5px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 text-emerald-950 bg-emerald-300">SAVED</span>
              </Link>
            </li>
          </ul>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PLATFORM 3: TUTOR & ACADEMY NAVIGATION [Ask AI, Subjects, Career Jobs, Saved] */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activePlatform === "tutor" && (
          <ul className="grid grid-cols-5 items-end justify-items-center relative w-full m-0 p-0 list-none">
            {/* 1. ASK AI */}
            <li className="w-full flex justify-center">
              <Link
                to="/tutor"
                preload="intent"
                onClick={onTap}
                className={cn(
                  "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu",
                  pathname === "/tutor" && !cleanHash ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
                )}
                title="Ask AI Doubt Clearance"
              >
                <div
                  className={cn(
                    "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300",
                    pathname === "/tutor" && !cleanHash
                      ? "bg-gradient-to-br from-indigo-500 via-purple-600 to-slate-900 text-white border-2 border-indigo-300 shadow-[0_8px_24px_rgba(99,102,241,0.7)]"
                      : "bg-gradient-to-b from-stone-900/95 to-stone-950/95 text-indigo-300/90 border border-indigo-500/30"
                  )}
                >
                  <Sparkles className="size-5 stroke-[2.3]" />
                </div>
                <span className="mt-1 text-[9px] sm:text-[10px] font-black text-indigo-300">Ask AI</span>
                <span className="text-[6.5px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 text-indigo-950 bg-indigo-300">DOUBTS</span>
              </Link>
            </li>

            {/* 2. SUBJECTS / SYLLABUS */}
            <li className="w-full flex justify-center">
              <Link
                to="/tutor"
                hash="subjects"
                preload="intent"
                onClick={onTap}
                className={cn(
                  "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu",
                  cleanHash === "subjects" ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
                )}
                title="CBSE & NCERT Syllabus"
              >
                <div
                  className={cn(
                    "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300",
                    cleanHash === "subjects"
                      ? "bg-gradient-to-br from-purple-500 via-pink-600 to-indigo-950 text-white border-2 border-purple-300 shadow-[0_8px_24px_rgba(168,85,247,0.7)]"
                      : "bg-gradient-to-b from-stone-900/95 to-stone-950/95 text-purple-300/90 border border-purple-500/30"
                  )}
                >
                  <BookOpen className="size-5 stroke-[2.3]" />
                </div>
                <span className="mt-1 text-[9px] sm:text-[10px] font-black text-purple-300">Subjects</span>
                <span className="text-[6.5px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 text-purple-950 bg-purple-300">NCERT</span>
              </Link>
            </li>

            {/* 3. CAREER JOBS (CENTERPIECE) */}
            <li className="w-full flex justify-center">
              <Link
                to="/tutor"
                hash="careers"
                preload="intent"
                onClick={onTap}
                className="group relative -mt-5 sm:-mt-6 flex flex-col items-center justify-center no-underline transition-all duration-300 active:scale-95 transform-gpu"
                title="Hyperlocal & Remote Jobs"
              >
                <div
                  className={cn(
                    "relative p-[3px] rounded-[22px] transition-all duration-300 transform-gpu",
                    cleanHash === "careers"
                      ? "scale-110 shadow-[0_12px_32px_rgba(168,85,247,0.8)] border border-purple-300"
                      : "shadow-[0_8px_24px_rgba(0,0,0,0.6)] border border-purple-400/40"
                  )}
                  style={{
                    background: "linear-gradient(135deg, #F3E8FF 0%, #A855F7 40%, #581C87 100%)",
                  }}
                >
                  <div className="flex size-[46px] sm:size-[50px] items-center justify-center rounded-[18px] bg-stone-950 text-purple-300 shadow-inner">
                    <Briefcase className="size-6 stroke-[2.5]" />
                  </div>
                </div>
                <span className="mt-1 text-[9px] sm:text-[10px] font-black text-purple-300">
                  Jobs
                </span>
              </Link>
            </li>

            {/* 4. SAVED SOLUTIONS */}
            <li className="w-full flex justify-center">
              <Link
                to="/tutor"
                hash="saved"
                preload="intent"
                onClick={onTap}
                className={cn(
                  "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu",
                  cleanHash === "saved" ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
                )}
                title="Saved Notes & Solutions"
              >
                <div
                  className={cn(
                    "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300",
                    cleanHash === "saved"
                      ? "bg-gradient-to-br from-indigo-400 via-blue-600 to-slate-900 text-white border-2 border-indigo-300 shadow-[0_8px_24px_rgba(99,102,241,0.7)]"
                      : "bg-gradient-to-b from-stone-900/95 to-stone-950/95 text-indigo-300/90 border border-indigo-500/30"
                  )}
                >
                  <Bookmark className="size-5 stroke-[2.3]" />
                </div>
                <span className="mt-1 text-[9px] sm:text-[10px] font-black text-indigo-300">Saved</span>
                <span className="text-[6.5px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 text-indigo-950 bg-indigo-300">NOTES</span>
              </Link>
            </li>

            {/* 5. APPLICATIONS TRACKING */}
            <li className="w-full flex justify-center">
              <Link
                to="/tutor"
                hash="my-jobs"
                preload="intent"
                onClick={onTap}
                className={cn(
                  "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu",
                  cleanHash === "my-jobs" ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
                )}
                title="Application Tracking"
              >
                <div
                  className={cn(
                    "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300",
                    cleanHash === "my-jobs"
                      ? "bg-gradient-to-br from-emerald-500 via-teal-600 to-slate-900 text-white border-2 border-emerald-300 shadow-[0_8px_24px_rgba(16,185,129,0.7)]"
                      : "bg-gradient-to-b from-stone-900/95 to-stone-950/95 text-emerald-300/90 border border-emerald-500/30"
                  )}
                >
                  <CheckCircle2 className="size-5 stroke-[2.3]" />
                  {careerAppCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex size-4 items-center justify-center rounded-full bg-purple-600 text-[8px] font-black text-white border border-white">
                      {careerAppCount}
                    </span>
                  )}
                </div>
                <span className="mt-1 text-[9px] sm:text-[10px] font-black text-emerald-300">Applied</span>
                <span className="text-[6.5px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 text-emerald-950 bg-emerald-300">STATUS</span>
              </Link>
            </li>
          </ul>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PLATFORM 4: KINGPAY FINTECH NAVIGATION [Terminal, Split Bill, Vault, Ledger, Help] */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activePlatform === "kingpay" && (
          <ul className="grid grid-cols-5 items-end justify-items-center relative w-full m-0 p-0 list-none">
            {/* 1. PAY TERMINAL */}
            <li className="w-full flex justify-center">
              <Link
                to="/king-pay"
                preload="intent"
                onClick={onTap}
                className={cn(
                  "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu",
                  pathname === "/king-pay" && !cleanHash && !searchTab ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
                )}
                title="UPI Payments Terminal"
              >
                <div
                  className={cn(
                    "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300",
                    pathname === "/king-pay" && !cleanHash && !searchTab
                      ? "bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-950 text-white border-2 border-amber-300 shadow-[0_8px_24px_rgba(245,158,11,0.7)]"
                      : "bg-gradient-to-b from-stone-900/95 to-stone-950/95 text-amber-300/90 border border-amber-500/30"
                  )}
                >
                  <CreditCard className="size-5 stroke-[2.3]" />
                </div>
                <span className="mt-1 text-[9px] sm:text-[10px] font-black text-amber-300">Terminal</span>
                <span className="text-[6.5px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 text-amber-950 bg-amber-300">PAY</span>
              </Link>
            </li>

            {/* 2. SPLIT BILL */}
            <li className="w-full flex justify-center">
              <Link
                to="/king-pay"
                hash="split"
                preload="intent"
                onClick={onTap}
                className={cn(
                  "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu",
                  cleanHash === "split" ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
                )}
                title="Group Bill Split"
              >
                <div
                  className={cn(
                    "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300",
                    cleanHash === "split"
                      ? "bg-gradient-to-br from-orange-400 via-amber-500 to-stone-950 text-white border-2 border-orange-300 shadow-[0_8px_24px_rgba(249,115,22,0.7)]"
                      : "bg-gradient-to-b from-stone-900/95 to-stone-950/95 text-orange-300/90 border border-orange-500/30"
                  )}
                >
                  <Users className="size-5 stroke-[2.3]" />
                </div>
                <span className="mt-1 text-[9px] sm:text-[10px] font-black text-orange-300">Split Bill</span>
                <span className="text-[6.5px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 text-orange-950 bg-orange-300">GROUPS</span>
              </Link>
            </li>

            {/* 3. VAULT / EARN (CENTERPIECE) */}
            <li className="w-full flex justify-center">
              <Link
                to="/earn"
                preload="intent"
                onClick={onTap}
                className="group relative -mt-5 sm:-mt-6 flex flex-col items-center justify-center no-underline transition-all duration-300 active:scale-95 transform-gpu"
                title="KingPay Vault & Rewards"
              >
                <div
                  className={cn(
                    "relative p-[3px] rounded-[22px] transition-all duration-300 transform-gpu",
                    pathname.startsWith("/earn")
                      ? "scale-110 shadow-[0_12px_32px_rgba(245,158,11,0.8)] border border-amber-300"
                      : "shadow-[0_8px_24px_rgba(0,0,0,0.6)] border border-amber-400/40"
                  )}
                  style={{
                    background: "linear-gradient(135deg, #FEF08A 0%, #F59E0B 40%, #78350F 100%)",
                  }}
                >
                  <div className="flex size-[46px] sm:size-[50px] items-center justify-center rounded-[18px] bg-stone-950 text-amber-300 shadow-inner">
                    <Coins className="size-6 stroke-[2.5]" />
                  </div>
                </div>
                <span className="mt-1 text-[9px] sm:text-[10px] font-black text-amber-300">
                  Vault
                </span>
              </Link>
            </li>

            {/* 4. LEDGER / PASSBOOK */}
            <li className="w-full flex justify-center">
              <Link
                to="/king-pay"
                search={{ tab: "passbook" }}
                hash="passbook"
                preload="intent"
                onClick={onTap}
                className={cn(
                  "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu",
                  searchTab === "passbook" || cleanHash === "passbook" ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
                )}
                title="Passbook & Receipts"
              >
                <div
                  className={cn(
                    "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300",
                    searchTab === "passbook" || cleanHash === "passbook"
                      ? "bg-gradient-to-br from-emerald-400 via-teal-500 to-amber-950 text-white border-2 border-emerald-300 shadow-[0_8px_24px_rgba(16,185,129,0.7)]"
                      : "bg-gradient-to-b from-stone-900/95 to-stone-950/95 text-emerald-300/90 border border-emerald-500/30"
                  )}
                >
                  <FileText className="size-5 stroke-[2.3]" />
                </div>
                <span className="mt-1 text-[9px] sm:text-[10px] font-black text-emerald-300">Ledger</span>
                <span className="text-[6.5px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 text-emerald-950 bg-emerald-300">HISTORY</span>
              </Link>
            </li>

            {/* 5. SUPPORT */}
            <li className="w-full flex justify-center">
              <Link
                to="/support"
                preload="intent"
                onClick={onTap}
                className={cn(
                  "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu",
                  pathname.startsWith("/support") ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
                )}
                title="24/7 Support Desk"
              >
                <div
                  className={cn(
                    "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300",
                    pathname.startsWith("/support")
                      ? "bg-gradient-to-br from-sky-400 via-blue-500 to-slate-900 text-white border-2 border-sky-300 shadow-[0_8px_24px_rgba(14,165,233,0.7)]"
                      : "bg-gradient-to-b from-stone-900/95 to-stone-950/95 text-sky-300/90 border border-sky-500/30"
                  )}
                >
                  <HelpCircle className="size-5 stroke-[2.3]" />
                </div>
                <span className="mt-1 text-[9px] sm:text-[10px] font-black text-sky-300">Help</span>
                <span className="text-[6.5px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 text-sky-950 bg-sky-300">24/7</span>
              </Link>
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
}
