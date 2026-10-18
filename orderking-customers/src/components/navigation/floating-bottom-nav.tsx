import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  UtensilsCrossed,
  GraduationCap,
  Plane,
  ShoppingBag,
  Crown,
  Sparkles,
  Flame,
  Receipt,
  Ticket,
  Briefcase,
} from "lucide-react";
import { useCartStore, cartCount } from "@/lib/stores/cart";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listMyOrders } from "@/lib/server/orders";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

export type ActivePlatform = "delivery" | "kingpay" | "travel" | "tutor";

/**
 * Resolves the active platform ecosystem context from the pathname.
 * Fully guarded against null, undefined, and malformed state.
 */
export function resolvePlatformContext(
  pathname?: string | null,
  state?: { platform?: string }
): ActivePlatform {
  if (state?.platform && ["delivery", "kingpay", "travel", "tutor"].includes(state.platform)) {
    return state.platform as ActivePlatform;
  }
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

export const BENCHMARK_FOOD_TABS = [
  { id: "delivery", label: "Delivery", to: "/" },
  { id: "dining", label: "Dining Out", to: "/dining" },
  { id: "search", label: "Search", to: "/search" },
  { id: "cart", label: "Cart", to: "/cart" },
  { id: "orders", label: "Orders", to: "/orders" },
];

export const BENCHMARK_KINGPAY_TABS = [
  { id: "terminal", label: "Terminal", to: "/king-pay" },
  { id: "split", label: "Split Bill", to: "/king-pay?tab=split" },
  { id: "vault", label: "Gold Vault", to: "/wallet" },
  { id: "ledger", label: "Passbook", to: "/earn" },
  { id: "support", label: "Assistance", to: "/king-pay/assist" },
];

export const BENCHMARK_TRAVEL_TABS = [
  { id: "compare", label: "Compare", to: "/travel" },
  { id: "flights", label: "Flights", to: "/travel?tab=flights" },
  { id: "trains", label: "Trains", to: "/travel?tab=trains" },
  { id: "cabs", label: "Cabs", to: "/travel?tab=cabs" },
  { id: "trips", label: "My Trips", to: "/travel/trips" },
];

export const BENCHMARK_TUTOR_TABS = [
  { id: "ask-ai", label: "Ask AI", to: "/tutor" },
  { id: "subjects", label: "Curriculum", to: "/tutor?tab=subjects" },
  { id: "jobs", label: "Jobs", to: "/tutor?tab=jobs" },
  { id: "saved", label: "Saved", to: "/tutor?tab=saved" },
  { id: "applied", label: "Applications", to: "/tutor?tab=applied" },
];

export interface FloatingBottomNavProps {
  className?: string;
  onOpenAi?: () => void;
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
  // Guarded router state selectors with zero-crash fallbacks
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

  // Active orders radar query
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

  // Track submitted career applications count for Tutor contextual badge
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

  // Dynamic Platform Resolution
  const activePlatform = resolvePlatformContext(pathname);

  // Active Tab States for Primary Tabs 1 - 4
  const isDeliveryActive =
    pathname === "/" ||
    pathname.startsWith("/delivery") ||
    pathname.startsWith("/restaurants") ||
    pathname.startsWith("/menu") ||
    pathname.startsWith("/r/");

  const isTutorJobsActive =
    pathname.startsWith("/tutor") &&
    cleanHash !== "my-jobs" &&
    cleanHash !== "my-applications" &&
    cleanHash !== "saved-jobs" &&
    searchTab !== "my-applications";

  const isKingPayActive =
    (pathname.startsWith("/king-pay") ||
      pathname.startsWith("/earn") ||
      pathname.startsWith("/wallet") ||
      pathname.startsWith("/kingpay-wallet")) &&
    searchTab !== "passbook" &&
    cleanHash !== "passbook" &&
    pathname !== "/king-pay/passbook";

  const isTravelActive =
    pathname.startsWith("/travel") && !pathname.startsWith("/travel/trips");

  // Dynamic 5th Tab Active State
  const isFifthTabActive =
    activePlatform === "kingpay"
      ? (pathname.startsWith("/king-pay") && (searchTab === "passbook" || cleanHash === "passbook")) ||
        pathname === "/king-pay/passbook"
      : activePlatform === "travel"
      ? pathname.startsWith("/travel/trips")
      : activePlatform === "tutor"
      ? pathname.startsWith("/tutor") &&
        (cleanHash === "my-jobs" ||
          cleanHash === "my-applications" ||
          cleanHash === "saved-jobs" ||
          searchTab === "my-applications")
      : pathname.startsWith("/orders");

  const onTap = useCallback(() => hapticTap(), []);

  return (
    <nav
      role="navigation"
      aria-label="OrderKing Dynamic Platform Dock"
      className={cn(
        "fixed inset-x-0 bottom-2 sm:bottom-3.5 z-50 pointer-events-none mx-auto w-full max-w-lg px-2 sm:px-3 select-none md:hidden",
        className
      )}
    >
      {/* ─── DYNAMIC PRISMATIC JEWEL AURA (AMBIENT FLOOR ILLUMINATION) ─── */}
      <div
        className="absolute -inset-1.5 rounded-[36px] opacity-90 blur-2xl pointer-events-none -z-10 transition-all duration-700"
        style={{
          background: isFifthTabActive
            ? activePlatform === "kingpay"
              ? "radial-gradient(ellipse at 88% 60%, rgba(245,158,11,0.85) 0%, rgba(217,119,6,0.4) 45%, transparent 75%)"
              : activePlatform === "travel"
              ? "radial-gradient(ellipse at 88% 60%, rgba(14,165,233,0.85) 0%, rgba(37,99,235,0.4) 45%, transparent 75%)"
              : activePlatform === "tutor"
              ? "radial-gradient(ellipse at 88% 60%, rgba(168,85,247,0.85) 0%, rgba(99,102,241,0.4) 45%, transparent 75%)"
              : "radial-gradient(ellipse at 88% 60%, rgba(225,29,72,0.85) 0%, rgba(244,63,94,0.4) 45%, transparent 75%)"
            : isKingPayActive
            ? "radial-gradient(ellipse at 50% 60%, rgba(245,158,11,0.85) 0%, rgba(217,119,6,0.4) 45%, transparent 75%)"
            : isDeliveryActive
            ? "radial-gradient(ellipse at 12% 60%, rgba(16,185,129,0.8) 0%, rgba(245,158,11,0.3) 45%, transparent 75%)"
            : isTutorJobsActive
            ? "radial-gradient(ellipse at 32% 60%, rgba(99,102,241,0.8) 0%, rgba(168,85,247,0.4) 45%, transparent 75%)"
            : isTravelActive
            ? "radial-gradient(ellipse at 68% 60%, rgba(14,165,233,0.8) 0%, rgba(37,99,235,0.4) 45%, transparent 75%)"
            : "radial-gradient(ellipse at center, rgba(245,158,11,0.6) 0%, rgba(16,185,129,0.3) 35%, rgba(225,29,72,0.3) 65%, transparent 80%)",
        }}
      />

      {/* Secondary Multi-Layer Prismatic Spectral Floor Glow */}
      <div
        className="absolute -bottom-2 inset-x-8 h-7 rounded-full opacity-65 blur-xl pointer-events-none -z-10"
        style={{
          background:
            "linear-gradient(90deg, rgba(16,185,129,0.5) 0%, rgba(99,102,241,0.5) 25%, rgba(245,158,11,0.8) 50%, rgba(14,165,233,0.5) 75%, rgba(225,29,72,0.5) 100%)",
        }}
      />

      {/* ─── SUPREME ULTRA-LUXURY 3D OBSIDIAN & KING PAY DOCK ─── */}
      <div
        className="pointer-events-auto relative overflow-visible rounded-[30px] sm:rounded-[34px] px-1.5 sm:px-2 pt-2 pb-1.5 transition-all duration-300 transform-gpu"
        style={{
          background:
            "linear-gradient(135deg, rgba(15,16,20,0.96) 0%, rgba(26,22,17,0.95) 50%, rgba(12,13,16,0.97) 100%)",
          backdropFilter: "blur(32px) saturate(2.4)",
          WebkitBackdropFilter: "blur(32px) saturate(2.4)",
          border: "1.5px solid rgba(245, 158, 11, 0.6)",
          boxShadow: [
            "0 28px 70px -10px rgba(0,0,0,0.85)",
            "0 14px 34px -5px rgba(245,158,11,0.35)",
            "inset 0 1.5px 2px rgba(254,240,138,0.75)",
            "inset 0 -2px 4px rgba(180,83,9,0.45)",
            "inset 0 0 16px rgba(0,0,0,0.8)",
          ].join(","),
        }}
      >
        {/* Specular 24K Gold Refraction Beam - Top Rim */}
        <div className="absolute top-0 inset-x-6 sm:inset-x-10 h-[2px] bg-gradient-to-r from-transparent via-amber-300 via-amber-400 to-transparent pointer-events-none drop-shadow-[0_1px_4px_rgba(245,158,11,1)]" />

        {/* Bottom Sovereign Metallic Bevel Line */}
        <div className="absolute bottom-0 inset-x-8 h-[1px] bg-gradient-to-r from-emerald-500/40 via-amber-400/80 to-cyan-500/40 pointer-events-none" />

        <ul className="grid grid-cols-5 items-end justify-items-center relative w-full m-0 p-0 list-none">
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* 1. DELIVERY TAB (3D Amber-Gold Cloche with Emerald Platter)     */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <li className="w-full flex justify-center">
            <Link
              to="/"
              preload="intent"
              onClick={onTap}
              className={cn(
                "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu will-change-transform",
                isDeliveryActive ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
              )}
              title="OrderKing Food Delivery & Cloud Kitchens"
            >
              {/* 3D Raised Cloche Jewel Button */}
              <div
                className={cn(
                  "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300 transform-gpu",
                  isDeliveryActive
                    ? "bg-gradient-to-br from-amber-400 via-emerald-600 to-teal-900 text-white border-2 border-amber-300 shadow-[0_8px_24px_rgba(16,185,129,0.7),0_2px_10px_rgba(245,158,11,0.5),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(4,120,87,0.8)]"
                    : "bg-gradient-to-b from-stone-900/95 to-stone-950/95 text-emerald-300/90 border border-emerald-500/30 shadow-[0_3px_8px_rgba(0,0,0,0.6),inset_0_1px_1.5px_rgba(255,255,255,0.12)] group-hover:border-emerald-400/60"
                )}
              >
                {/* 3D Cloche & Hot Platter Graphic */}
                <div className="relative flex items-center justify-center">
                  <UtensilsCrossed
                    className={cn(
                      "size-5 transition-transform duration-200",
                      isDeliveryActive
                        ? "stroke-[2.6] drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
                        : "stroke-[2.2] text-emerald-300 group-hover:scale-105"
                    )}
                    aria-hidden="true"
                  />
                  {/* Floating Golden Flame/Spark */}
                  <Flame
                    className={cn(
                      "absolute -top-2 -right-1.5 size-3 transition-all duration-200",
                      isDeliveryActive
                        ? "text-amber-300 fill-amber-300 drop-shadow-[0_1px_6px_rgba(245,158,11,1)]"
                        : "text-amber-400 fill-amber-400/80"
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
                  "mt-1 text-[9px] sm:text-[10px] leading-tight tracking-tight transition-colors truncate max-w-full px-0.5 text-center font-black",
                  isDeliveryActive
                    ? "text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                    : "text-stone-300 group-hover:text-emerald-300"
                )}
              >
                Delivery
              </span>

              {/* Sub-Pill: FOOD */}
              <span
                className={cn(
                  "text-[6.5px] sm:text-[7px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 shadow-2xs border transition-all",
                  isDeliveryActive
                    ? "text-emerald-950 bg-gradient-to-r from-amber-300 to-emerald-300 border-emerald-400/80 shadow-[0_1px_4px_rgba(16,185,129,0.3)]"
                    : "text-emerald-300/90 bg-emerald-950/70 border-emerald-500/30"
                )}
              >
                FOOD
              </span>

              {/* 3D Tactile Neon Under-Pill Light */}
              <div className="h-[3.5px] w-7 sm:w-8 mt-0.5 flex items-center justify-center">
                {isDeliveryActive ? (
                  <span className="h-full w-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 shadow-[0_0_14px_rgba(16,185,129,1)]" />
                ) : (
                  <span className="h-full w-0 rounded-full bg-transparent transition-all duration-300" />
                )}
              </div>
            </Link>
          </li>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* 2. TUTOR & JOBS TAB (3D Sapphire-Amethyst Cap & AI Spark)       */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <li className="w-full flex justify-center">
            <Link
              to="/tutor"
              preload="intent"
              onClick={onTap}
              className={cn(
                "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu will-change-transform",
                isTutorJobsActive ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
              )}
              title="AI Tutor & High-Paying Jobs"
            >
              {/* 3D Raised Sapphire-Amethyst Jewel */}
              <div
                className={cn(
                  "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300 transform-gpu",
                  isTutorJobsActive
                    ? "bg-gradient-to-br from-indigo-500 via-purple-600 to-slate-900 text-white border-2 border-indigo-300 shadow-[0_8px_24px_rgba(99,102,241,0.7),0_2px_10px_rgba(168,85,247,0.5),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(79,70,229,0.8)]"
                    : "bg-gradient-to-b from-stone-900/95 to-stone-950/95 text-indigo-300/90 border border-indigo-500/30 shadow-[0_3px_8px_rgba(0,0,0,0.6),inset_0_1px_1.5px_rgba(255,255,255,0.12)] group-hover:border-indigo-400/60"
                )}
              >
                <div className="relative flex items-center justify-center">
                  <GraduationCap
                    className={cn(
                      "size-5 transition-transform duration-200",
                      isTutorJobsActive
                        ? "stroke-[2.6] drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                        : "stroke-[2.2] text-indigo-300 group-hover:scale-105"
                    )}
                    aria-hidden="true"
                  />
                  {/* AI Spark Icon */}
                  <Sparkles
                    className={cn(
                      "absolute -top-2 -right-1.5 size-3 transition-all duration-200",
                      isTutorJobsActive
                        ? "text-yellow-300 fill-yellow-300 drop-shadow-[0_1px_6px_rgba(234,179,8,1)]"
                        : "text-purple-400 fill-purple-400/80"
                    )}
                    aria-hidden="true"
                  />
                </div>

                {/* 3D Embossed JOBS Badge */}
                <span className="absolute -top-1.5 -right-2 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-1.5 py-[0.5px] text-[6.5px] font-black text-white shadow-[0_3px_8px_rgba(99,102,241,0.6)] border border-white/90 tracking-wider uppercase">
                  JOBS
                </span>
              </div>

              {/* Tab Title: Tutor & Jobs */}
              <span
                className={cn(
                  "mt-1 text-[8.5px] sm:text-[9.5px] leading-tight tracking-tight transition-colors truncate max-w-full px-0.5 text-center font-black",
                  isTutorJobsActive
                    ? "text-indigo-300 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                    : "text-stone-300 group-hover:text-indigo-300"
                )}
              >
                Tutor &amp; Jobs
              </span>

              {/* Sub-Pill: LEARN */}
              <span
                className={cn(
                  "text-[6.5px] sm:text-[7px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 shadow-2xs border transition-all",
                  isTutorJobsActive
                    ? "text-indigo-950 bg-gradient-to-r from-purple-200 to-indigo-300 border-indigo-400/80 shadow-[0_1px_4px_rgba(99,102,241,0.3)]"
                    : "text-indigo-300/90 bg-indigo-950/70 border-indigo-500/30"
                )}
              >
                LEARN
              </span>

              {/* 3D Tactile Neon Under-Pill Light */}
              <div className="h-[3.5px] w-7 sm:w-8 mt-0.5 flex items-center justify-center">
                {isTutorJobsActive ? (
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
              className="group relative -mt-7 sm:-mt-8 flex flex-col items-center justify-center no-underline transition-all duration-300 active:scale-95 transform-gpu will-change-transform"
              title="King Pay UPI & 24K Sovereign Gold"
            >
              {/* 24K Gold Sovereign Beveled Frame with Pulse Ring */}
              <div
                className={cn(
                  "relative p-[4px] sm:p-[4.5px] rounded-[26px] sm:rounded-[28px] transition-all duration-300 transform-gpu",
                  isKingPayActive
                    ? "scale-115 shadow-[0_18px_45px_rgba(245,158,11,0.85),0_0_0_3.5px_rgba(251,191,36,0.8),inset_0_2px_4px_rgba(255,255,255,0.95)]"
                    : "shadow-[0_12px_32px_rgba(245,158,11,0.55),0_0_0_2px_rgba(245,158,11,0.45),inset_0_1.5px_2px_rgba(255,255,255,0.9)] group-hover:scale-105 group-hover:shadow-[0_16px_38px_rgba(245,158,11,0.7)]"
                )}
                style={{
                  background:
                    "linear-gradient(135deg, #FFF9D2 0%, #F59E0B 20%, #FFE680 40%, #D97706 65%, #78350F 100%)",
                }}
              >
                {/* Obsidian Core with 3D Embossed Imperial Crown */}
                <div className="flex size-11 sm:size-12 items-center justify-center rounded-[22px] sm:rounded-[24px] bg-gradient-to-b from-stone-950 via-[#18130e] to-amber-950 text-amber-300 shadow-[inset_0_3px_10px_rgba(0,0,0,0.95)] relative overflow-hidden border border-amber-400/50">
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

                {/* TOOLS SERVICES Badge */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-stone-950 px-2.5 py-[1px] shadow-[0_3px_8px_rgba(0,0,0,0.5)] border border-amber-400 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[7px] sm:text-[7.5px] font-black text-amber-300 tracking-wider">UPI INSTANT</span>
                </div>
              </div>

              {/* Centerpiece Title: King Pay */}
              <span className="mt-1 text-[9px] sm:text-[10.5px] font-black tracking-tight leading-tight text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]">
                King Pay
              </span>

              {/* Sub-Pill: 0% FEE */}
              <span
                className={cn(
                  "text-[6.5px] sm:text-[7px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 shadow-2xs border transition-all",
                  isKingPayActive
                    ? "text-amber-950 bg-gradient-to-r from-yellow-300 to-amber-300 border-amber-400/80 shadow-[0_1px_4px_rgba(245,158,11,0.4)]"
                    : "text-amber-300/90 bg-amber-950/70 border-amber-500/30"
                )}
              >
                0% FEE
              </span>

              {/* 3D Tactile 24K Gold Bar Indicator */}
              <div className="h-[3.5px] w-9 sm:w-10 mt-0.5 flex items-center justify-center">
                {isKingPayActive ? (
                  <span className="h-full w-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 shadow-[0_0_16px_rgba(245,158,11,1)]" />
                ) : (
                  <span className="h-full w-0 rounded-full bg-transparent transition-all duration-300" />
                )}
              </div>
            </Link>
          </li>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* 4. TRAVEL TAB (3D Sapphire-Teal Jetliner with STAYS Badge)       */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <li className="w-full flex justify-center">
            <Link
              to="/travel"
              preload="intent"
              onClick={onTap}
              className={cn(
                "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu will-change-transform",
                isTravelActive ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
              )}
              title="Sovereign Travel, Flights & Luxury Stays"
            >
              {/* 3D Raised Sapphire-Teal Jewel */}
              <div
                className={cn(
                  "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300 transform-gpu",
                  isTravelActive
                    ? "bg-gradient-to-br from-cyan-500 via-blue-600 to-slate-900 text-white border-2 border-cyan-300 shadow-[0_8px_24px_rgba(14,165,233,0.7),0_2px_10px_rgba(37,99,235,0.5),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(2,132,199,0.8)]"
                    : "bg-gradient-to-b from-stone-900/95 to-stone-950/95 text-cyan-300/90 border border-cyan-500/30 shadow-[0_3px_8px_rgba(0,0,0,0.6),inset_0_1px_1.5px_rgba(255,255,255,0.12)] group-hover:border-cyan-400/60"
                )}
              >
                <Plane
                  className={cn(
                    "size-5 transition-transform duration-200 -rotate-12",
                    isTravelActive
                      ? "stroke-[2.6] drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                      : "stroke-[2.2] text-cyan-300 group-hover:scale-105"
                  )}
                  aria-hidden="true"
                />

                {/* 3D Aviation TRIPS Banner */}
                <span className="absolute -top-1.5 -right-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-1.5 py-[0.5px] text-[6.5px] font-black text-white shadow-[0_3px_8px_rgba(14,165,233,0.6)] border border-white/90 tracking-wider uppercase">
                  TRIPS
                </span>
              </div>

              {/* Tab Title: Travel */}
              <span
                className={cn(
                  "mt-1 text-[9px] sm:text-[10px] leading-tight tracking-tight transition-colors truncate max-w-full px-0.5 text-center font-black",
                  isTravelActive
                    ? "text-sky-300 drop-shadow-[0_0_8px_rgba(14,165,233,0.6)]"
                    : "text-stone-300 group-hover:text-cyan-300"
                )}
              >
                Travel
              </span>

              {/* Sub-Pill: STAYS */}
              <span
                className={cn(
                  "text-[6.5px] sm:text-[7px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 shadow-2xs border transition-all",
                  isTravelActive
                    ? "text-sky-950 bg-gradient-to-r from-cyan-200 to-sky-300 border-sky-400/80 shadow-[0_1px_4px_rgba(14,165,233,0.3)]"
                    : "text-cyan-300/90 bg-cyan-950/70 border-cyan-500/30"
                )}
              >
                STAYS
              </span>

              {/* 3D Tactile Neon Under-Pill Light */}
              <div className="h-[3.5px] w-7 sm:w-8 mt-0.5 flex items-center justify-center">
                {isTravelActive ? (
                  <span className="h-full w-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 shadow-[0_0_14px_rgba(14,165,233,1)]" />
                ) : (
                  <span className="h-full w-0 rounded-full bg-transparent transition-all duration-300" />
                )}
              </div>
            </Link>
          </li>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* 5. CONTEXTUAL DYNAMIC 5TH TAB (DYNAMIC PLATFORM MORPH ENGINE)    */}
          {/*    • Food Delivery  -> "Food Orders" (/orders)                 */}
          {/*    • KingPay        -> "Passbook"    (/king-pay?tab=passbook)  */}
          {/*    • Travel         -> "My Trips"    (/travel/trips)           */}
          {/*    • Tutor & Jobs   -> "My Career"   (/tutor#my-jobs)          */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <li className="w-full flex justify-center">
            {activePlatform === "kingpay" ? (
              /* ─── 5A. KINGPAY CONTEXT: PASSBOOK & UTR LEDGER ─── */
              <Link
                to="/king-pay"
                search={{ tab: "passbook" }}
                hash="passbook"
                preload="intent"
                onClick={onTap}
                className={cn(
                  "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu will-change-transform",
                  isFifthTabActive ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
                )}
                title="KingPay Passbook, Statements & UTR Records"
              >
                {/* 3D Raised 24K Gold Passbook Jewel */}
                <div
                  className={cn(
                    "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300 transform-gpu",
                    isFifthTabActive
                      ? "bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-950 text-white border-2 border-amber-300 shadow-[0_8px_24px_rgba(245,158,11,0.7),0_2px_10px_rgba(217,119,6,0.5),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(180,83,9,0.8)]"
                      : "bg-gradient-to-b from-stone-900/95 to-stone-950/95 text-amber-300/90 border border-amber-500/30 shadow-[0_3px_8px_rgba(0,0,0,0.6),inset_0_1px_1.5px_rgba(255,255,255,0.12)] group-hover:border-amber-400/60"
                  )}
                >
                  <Receipt
                    className={cn(
                      "size-5 transition-transform duration-200",
                      isFifthTabActive
                        ? "stroke-[2.6] drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                        : "stroke-[2.2] text-amber-300 group-hover:scale-105"
                    )}
                    aria-hidden="true"
                  />

                  {/* 3D Sovereign UTR Badge */}
                  <span className="absolute -top-1.5 -right-2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-1.5 py-[0.5px] text-[6.5px] font-black text-stone-950 shadow-[0_3px_8px_rgba(245,158,11,0.6)] border border-amber-100 tracking-wider uppercase">
                    UTR
                  </span>
                </div>

                {/* Dynamic Title */}
                <span
                  className={cn(
                    "mt-1 text-[9px] sm:text-[10px] leading-tight tracking-tight transition-colors truncate max-w-full px-0.5 text-center font-black",
                    isFifthTabActive
                      ? "text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]"
                      : "text-stone-300 group-hover:text-amber-300"
                  )}
                >
                  Passbook
                </span>

                {/* Sub-Pill: LEDGER */}
                <span
                  className={cn(
                    "text-[6.5px] sm:text-[7px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 shadow-2xs border transition-all",
                    isFifthTabActive
                      ? "text-amber-950 bg-gradient-to-r from-yellow-300 to-amber-300 border-amber-400/80 shadow-[0_1px_4px_rgba(245,158,11,0.4)]"
                      : "text-amber-300/90 bg-amber-950/70 border-amber-500/30"
                  )}
                >
                  LEDGER
                </span>

                {/* 3D Tactile Neon Under-Pill Light */}
                <div className="h-[3.5px] w-7 sm:w-8 mt-0.5 flex items-center justify-center">
                  {isFifthTabActive ? (
                    <span className="h-full w-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 shadow-[0_0_14px_rgba(245,158,11,1)]" />
                  ) : (
                    <span className="h-full w-0 rounded-full bg-transparent transition-all duration-300" />
                  )}
                </div>
              </Link>
            ) : activePlatform === "travel" ? (
              /* ─── 5B. TRAVEL CONTEXT: MY TRIPS & BOARDING PASSES ─── */
              <Link
                to="/travel/trips"
                preload="intent"
                onClick={onTap}
                className={cn(
                  "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu will-change-transform",
                  isFifthTabActive ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
                )}
                title="My Trips, PNR Desk & Sovereign Boarding Passes"
              >
                {/* 3D Raised Sapphire-Azure Ticket Jewel */}
                <div
                  className={cn(
                    "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300 transform-gpu",
                    isFifthTabActive
                      ? "bg-gradient-to-br from-cyan-400 via-sky-600 to-blue-950 text-white border-2 border-cyan-300 shadow-[0_8px_24px_rgba(14,165,233,0.7),0_2px_10px_rgba(37,99,235,0.5),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(2,132,199,0.8)]"
                      : "bg-gradient-to-b from-stone-900/95 to-stone-950/95 text-cyan-300/90 border border-cyan-500/30 shadow-[0_3px_8px_rgba(0,0,0,0.6),inset_0_1px_1.5px_rgba(255,255,255,0.12)] group-hover:border-cyan-400/60"
                  )}
                >
                  <Ticket
                    className={cn(
                      "size-5 transition-transform duration-200 rotate-12",
                      isFifthTabActive
                        ? "stroke-[2.6] drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                        : "stroke-[2.2] text-cyan-300 group-hover:scale-105"
                    )}
                    aria-hidden="true"
                  />

                  {/* 3D PNR Desk Badge */}
                  <span className="absolute -top-1.5 -right-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-1.5 py-[0.5px] text-[6.5px] font-black text-white shadow-[0_3px_8px_rgba(14,165,233,0.6)] border border-cyan-100 tracking-wider uppercase">
                    PNR
                  </span>
                </div>

                {/* Dynamic Title */}
                <span
                  className={cn(
                    "mt-1 text-[9px] sm:text-[10px] leading-tight tracking-tight transition-colors truncate max-w-full px-0.5 text-center font-black",
                    isFifthTabActive
                      ? "text-cyan-300 drop-shadow-[0_0_8px_rgba(14,165,233,0.7)]"
                      : "text-stone-300 group-hover:text-cyan-300"
                  )}
                >
                  My Trips
                </span>

                {/* Sub-Pill: PNR DESK */}
                <span
                  className={cn(
                    "text-[6.5px] sm:text-[7px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 shadow-2xs border transition-all",
                    isFifthTabActive
                      ? "text-sky-950 bg-gradient-to-r from-cyan-200 to-sky-300 border-sky-400/80 shadow-[0_1px_4px_rgba(14,165,233,0.3)]"
                      : "text-cyan-300/90 bg-cyan-950/70 border-cyan-500/30"
                  )}
                >
                  PNR DESK
                </span>

                {/* 3D Tactile Neon Under-Pill Light */}
                <div className="h-[3.5px] w-7 sm:w-8 mt-0.5 flex items-center justify-center">
                  {isFifthTabActive ? (
                    <span className="h-full w-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 shadow-[0_0_14px_rgba(14,165,233,1)]" />
                  ) : (
                    <span className="h-full w-0 rounded-full bg-transparent transition-all duration-300" />
                  )}
                </div>
              </Link>
            ) : activePlatform === "tutor" ? (
              /* ─── 5C. TUTOR & JOBS CONTEXT: MY CAREER & APPLICATIONS ─── */
              <Link
                to="/tutor"
                hash="my-jobs"
                preload="intent"
                onClick={onTap}
                className={cn(
                  "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu will-change-transform",
                  isFifthTabActive ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
                )}
                title="My Career, Saved Jobs & Application Tracking"
              >
                {/* 3D Raised Amethyst-Indigo Briefcase Jewel */}
                <div
                  className={cn(
                    "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300 transform-gpu",
                    isFifthTabActive
                      ? "bg-gradient-to-br from-purple-500 via-indigo-600 to-slate-900 text-white border-2 border-purple-300 shadow-[0_8px_24px_rgba(168,85,247,0.7),0_2px_10px_rgba(99,102,241,0.5),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(79,70,229,0.8)]"
                      : "bg-gradient-to-b from-stone-900/95 to-stone-950/95 text-purple-300/90 border border-purple-500/30 shadow-[0_3px_8px_rgba(0,0,0,0.6),inset_0_1px_1.5px_rgba(255,255,255,0.12)] group-hover:border-purple-400/60"
                  )}
                >
                  <Briefcase
                    className={cn(
                      "size-5 transition-transform duration-200",
                      isFifthTabActive
                        ? "stroke-[2.6] drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                        : "stroke-[2.2] text-purple-300 group-hover:scale-105"
                    )}
                    aria-hidden="true"
                  />

                  {/* 3D Career / Application Count Badge */}
                  {careerAppCount > 0 ? (
                    <span className="absolute -top-1.5 -right-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-700 px-1 text-[8px] font-black text-white shadow-[0_2px_6px_rgba(168,85,247,0.7)] border border-white">
                      {careerAppCount}
                    </span>
                  ) : (
                    <span className="absolute -top-1.5 -right-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 px-1.5 py-[0.5px] text-[6.5px] font-black text-white shadow-[0_3px_8px_rgba(168,85,247,0.6)] border border-purple-100 tracking-wider uppercase">
                      APPLY
                    </span>
                  )}
                </div>

                {/* Dynamic Title */}
                <span
                  className={cn(
                    "mt-1 text-[8.5px] sm:text-[9.5px] leading-tight tracking-tight transition-colors truncate max-w-full px-0.5 text-center font-black",
                    isFifthTabActive
                      ? "text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.7)]"
                      : "text-stone-300 group-hover:text-purple-300"
                  )}
                >
                  My Career
                </span>

                {/* Sub-Pill: TRACK */}
                <span
                  className={cn(
                    "text-[6.5px] sm:text-[7px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 shadow-2xs border transition-all",
                    isFifthTabActive
                      ? "text-purple-950 bg-gradient-to-r from-purple-200 to-indigo-300 border-purple-400/80 shadow-[0_1px_4px_rgba(168,85,247,0.3)]"
                      : "text-purple-300/90 bg-purple-950/70 border-purple-500/30"
                  )}
                >
                  TRACK
                </span>

                {/* 3D Tactile Neon Under-Pill Light */}
                <div className="h-[3.5px] w-7 sm:w-8 mt-0.5 flex items-center justify-center">
                  {isFifthTabActive ? (
                    <span className="h-full w-full rounded-full bg-gradient-to-r from-purple-400 via-fuchsia-300 to-indigo-500 shadow-[0_0_14px_rgba(168,85,247,1)]" />
                  ) : (
                    <span className="h-full w-0 rounded-full bg-transparent transition-all duration-300" />
                  )}
                </div>
              </Link>
            ) : (
              /* ─── 5D. FOOD DELIVERY CONTEXT (DEFAULT): FOOD ORDERS ─── */
              <Link
                to="/orders"
                preload="intent"
                onClick={onTap}
                className={cn(
                  "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu will-change-transform",
                  isFifthTabActive ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
                )}
                title="Food Orders & Real-Time Kitchen Dispatch Tracking"
              >
                {/* 3D Raised Ruby Jewel */}
                <div
                  className={cn(
                    "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300 transform-gpu",
                    isFifthTabActive
                      ? "bg-gradient-to-br from-rose-500 via-red-600 to-rose-950 text-white border-2 border-rose-300 shadow-[0_8px_24px_rgba(225,29,72,0.7),0_2px_10px_rgba(190,18,60,0.5),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(159,18,57,0.8)]"
                      : "bg-gradient-to-b from-stone-900/95 to-stone-950/95 text-rose-300/90 border border-rose-500/30 shadow-[0_3px_8px_rgba(0,0,0,0.6),inset_0_1px_1.5px_rgba(255,255,255,0.12)] group-hover:border-rose-400/60"
                  )}
                >
                  <ShoppingBag
                    className={cn(
                      "size-5 transition-transform duration-200",
                      isFifthTabActive
                        ? "stroke-[2.6] drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                        : "stroke-[2.2] text-rose-300 group-hover:scale-105"
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

                {/* Dynamic Title */}
                <span
                  className={cn(
                    "mt-1 text-[9px] sm:text-[10px] leading-tight tracking-tight transition-colors truncate max-w-full px-0.5 text-center font-black",
                    isFifthTabActive
                      ? "text-rose-300 drop-shadow-[0_0_8px_rgba(225,29,72,0.7)]"
                      : "text-stone-300 group-hover:text-rose-300"
                  )}
                >
                  Food Orders
                </span>

                {/* Sub-Pill: TRACK */}
                <span
                  className={cn(
                    "text-[6.5px] sm:text-[7px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 shadow-2xs border transition-all",
                    isFifthTabActive
                      ? "text-rose-950 bg-gradient-to-r from-rose-200 to-pink-300 border-rose-400/80 shadow-[0_1px_4px_rgba(225,29,72,0.3)]"
                      : "text-rose-300/90 bg-rose-950/70 border-rose-500/30"
                  )}
                >
                  TRACK
                </span>

                {/* 3D Tactile Neon Under-Pill Light */}
                <div className="h-[3.5px] w-7 sm:w-8 mt-0.5 flex items-center justify-center">
                  {isFifthTabActive ? (
                    <span className="h-full w-full rounded-full bg-gradient-to-r from-rose-400 via-pink-300 to-red-500 shadow-[0_0_14px_rgba(225,29,72,1)]" />
                  ) : (
                    <span className="h-full w-0 rounded-full bg-transparent transition-all duration-300" />
                  )}
                </div>
              </Link>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}
