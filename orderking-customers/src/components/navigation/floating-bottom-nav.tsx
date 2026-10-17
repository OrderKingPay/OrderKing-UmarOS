import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  UtensilsCrossed,
  Flame,
  Wine,
  Utensils,
  Crown,
  Sparkles,
  ShoppingBag,
  Receipt,
  Bike,
} from "lucide-react";
import { useCartStore, cartCount } from "@/lib/stores/cart";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listMyOrders } from "@/lib/server/orders";
import { cn } from "@/lib/utils";
import { useCallback } from "react";

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
      navigator.vibrate([14, 32, 18]);
    }
  } catch {
    /* silent on unsupported devices */
  }
}

export interface FloatingBottomNavProps {
  className?: string;
  onOpenAi?: () => void;
}

/**
 * 👑 ULTRA-LUXURIOUS 3D FOOD SUPER-APP DOCKED BOTTOM NAVIGATION
 * 
 * Unbundled & Dedicated 5-Tab Food Architecture:
 * 1. Delivery (`/` or `/delivery`) — Utensils & Flame icon, Emerald platter glow.
 * 2. Dine-In (`/dining`) — Wine & Utensils icon, Sapphire glow, table booking & FSSAI dine-in menus.
 * 3. King AI Concierge (Centerpiece) — Raised 3D 24K Gold Crown with ambient pulsing glow, micro-spring haptics.
 * 4. Cart & Bag (`/cart`) — ShoppingBag with live cart badge counter (`cartCount`).
 * 5. Orders & Live Track (`/orders`) — Receipt / Bike with live radar pulse.
 */
export function CustomerFloatingBottomNav({ className, onOpenAi }: FloatingBottomNavProps) {
  const pathname = (useRouterState({ select: (s) => s?.location?.pathname ?? "" }) ?? "") as string;
  const navigate = useNavigate();

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

  const onTap = useCallback(() => hapticTap(), []);

  const handleAiClick = (e: React.MouseEvent) => {
    e.preventDefault();
    hapticTap();
    if (onOpenAi) {
      onOpenAi();
    } else {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("open-customer-concierge"));
        window.dispatchEvent(new CustomEvent("open-food-ai-concierge"));
      }
      void navigate({ to: "/search", search: { q: "AI Food Concierge" } as any });
    }
  };

  const isDeliveryActive =
    pathname === "/" ||
    pathname.startsWith("/delivery") ||
    pathname.startsWith("/r/") ||
    (pathname.startsWith("/search") && !pathname.includes("dining"));

  const isDiningActive = pathname.startsWith("/dining");

  const isAiActive =
    pathname.startsWith("/ai-craving") ||
    (pathname.startsWith("/search") && pathname.includes("AI Food Concierge"));

  const isCartActive = pathname.startsWith("/cart") || pathname.startsWith("/checkout");

  const isOrdersActive = pathname.startsWith("/orders") || pathname.startsWith("/tracking");

  return (
    <nav
      role="navigation"
      aria-label="OrderKing Food Super-App Dock"
      className={cn(
        "fixed inset-x-0 bottom-2 sm:bottom-3.5 z-50 pointer-events-none mx-auto w-full max-w-lg px-2 sm:px-3 select-none",
        className
      )}
    >
      {/* ─── DYNAMIC PRISMATIC EMERALD & 24K GOLD AMBIENT GLOW ─── */}
      <div
        className="absolute -inset-1.5 rounded-[36px] opacity-75 blur-2xl pointer-events-none -z-10 transition-all duration-700"
        style={{
          background:
            isDiningActive
              ? "radial-gradient(ellipse at center, rgba(37,99,235,0.65) 0%, rgba(14,165,233,0.3) 50%, transparent 80%)"
              : isOrdersActive
              ? "radial-gradient(ellipse at center, rgba(225,29,72,0.65) 0%, rgba(245,158,11,0.25) 50%, transparent 80%)"
              : isCartActive
              ? "radial-gradient(ellipse at center, rgba(245,158,11,0.7) 0%, rgba(234,88,12,0.3) 50%, transparent 80%)"
              : "radial-gradient(ellipse at center, rgba(16,185,129,0.7) 0%, rgba(245,158,11,0.35) 50%, transparent 80%)",
        }}
      />

      {/* ─── ULTRA-LUXURY OBSIDIAN JEWEL FOOD DOCK ─── */}
      <div
        className="pointer-events-auto relative overflow-visible rounded-[30px] sm:rounded-[34px] px-1.5 sm:px-2 pt-2 pb-1.5 transition-all duration-300 transform-gpu"
        style={{
          background:
            "linear-gradient(135deg, rgba(15,16,20,0.96) 0%, rgba(26,22,17,0.95) 50%, rgba(12,13,16,0.97) 100%)",
          backdropFilter: "blur(32px) saturate(2.4)",
          WebkitBackdropFilter: "blur(32px) saturate(2.4)",
          border: "1.5px solid rgba(245, 158, 11, 0.45)",
          boxShadow: [
            "0 28px 70px -10px rgba(0,0,0,0.85)",
            "0 14px 34px -5px rgba(0,0,0,0.4)",
            "inset 0 1.5px 2px rgba(255,255,255,0.25)",
            "inset 0 -2px 4px rgba(0,0,0,0.5)",
          ].join(","),
        }}
      >
        {/* Specular Edge Top Rim (24K Gold Sheen) */}
        <div className="absolute top-0 inset-x-6 sm:inset-x-10 h-[2px] bg-gradient-to-r from-transparent via-amber-300 to-transparent pointer-events-none drop-shadow-[0_1px_4px_rgba(245,158,11,1)]" />

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* DEDICATED 3D FOOD SUPER-APP 5-TAB NAVIGATION DOCK */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <ul className="grid grid-cols-5 items-end justify-items-center relative w-full m-0 p-0 list-none">
          {/* ─── TAB 1: DELIVERY (Utensils & Flame, Emerald Platter Glow) ─── */}
          <li className="w-full flex justify-center">
            <Link
              to="/"
              preload="intent"
              onClick={onTap}
              className={cn(
                "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu",
                isDeliveryActive ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
              )}
              title="Chef Delivery (0% Markup)"
              aria-label="Delivery"
            >
              {isDeliveryActive && (
                <motion.div
                  layoutId="activeDockGlow"
                  className="absolute inset-0 -top-1 rounded-2xl bg-emerald-500/10 blur-sm pointer-events-none -z-10"
                  transition={{ type: "spring", stiffness: 450, damping: 28 }}
                />
              )}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                className={cn(
                  "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300",
                  isDeliveryActive
                    ? "bg-gradient-to-br from-amber-400 via-emerald-600 to-teal-950 text-white border-2 border-emerald-300 shadow-[0_8px_24px_rgba(16,185,129,0.7),0_0_12px_rgba(52,211,153,0.5)]"
                    : "bg-gradient-to-b from-stone-900/95 to-stone-950/95 text-emerald-300/85 border border-emerald-500/30 group-hover:border-emerald-400/50"
                )}
              >
                <div className="relative flex items-center justify-center">
                  <UtensilsCrossed className="size-5 stroke-[2.3]" />
                  <Flame className="absolute -top-1.5 -right-2 size-3 text-amber-400 fill-amber-400 animate-pulse drop-shadow-[0_1px_4px_rgba(245,158,11,0.8)]" />
                </div>
              </motion.div>
              <span
                className={cn(
                  "mt-1 text-[9px] sm:text-[10px] font-black truncate tracking-tight",
                  isDeliveryActive ? "text-emerald-300 drop-shadow-[0_1px_6px_rgba(16,185,129,0.5)]" : "text-stone-300"
                )}
              >
                Delivery
              </span>
              <span className="text-[6.5px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 text-emerald-950 bg-emerald-300 shadow-2xs">
                0% MARKUP
              </span>
            </Link>
          </li>

          {/* ─── TAB 2: DINE-IN (Wine & Utensils, Sapphire Glow, FSSAI Menus) ─── */}
          <li className="w-full flex justify-center">
            <Link
              to="/dining"
              preload="intent"
              onClick={onTap}
              className={cn(
                "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu",
                isDiningActive ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
              )}
              title="VIP Dine-In & Table Booking"
              aria-label="Dine-In"
            >
              {isDiningActive && (
                <motion.div
                  layoutId="activeDockGlow"
                  className="absolute inset-0 -top-1 rounded-2xl bg-sky-500/10 blur-sm pointer-events-none -z-10"
                  transition={{ type: "spring", stiffness: 450, damping: 28 }}
                />
              )}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                className={cn(
                  "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300",
                  isDiningActive
                    ? "bg-gradient-to-br from-sky-400 via-blue-600 to-indigo-950 text-white border-2 border-sky-300 shadow-[0_8px_24px_rgba(37,99,235,0.75),0_0_14px_rgba(56,189,248,0.5)]"
                    : "bg-gradient-to-b from-stone-900/95 to-stone-950/95 text-sky-300/85 border border-sky-500/30 group-hover:border-sky-400/50"
                )}
              >
                <div className="relative flex items-center justify-center">
                  <Wine className="size-5 stroke-[2.3]" />
                  <Utensils className="absolute -top-1 -right-2 size-2.5 text-sky-300" />
                </div>
              </motion.div>
              <span
                className={cn(
                  "mt-1 text-[9px] sm:text-[10px] font-black truncate tracking-tight",
                  isDiningActive ? "text-sky-300 drop-shadow-[0_1px_6px_rgba(37,99,235,0.5)]" : "text-stone-300"
                )}
              >
                Dine-In
              </span>
              <span className="text-[6.5px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 text-sky-950 bg-sky-300 shadow-2xs">
                VIP TABLE
              </span>
            </Link>
          </li>

          {/* ─── TAB 3 (CENTERPIECE): KING AI CONCIERGE (Raised 3D 24K Gold Crown) ─── */}
          <li className="w-full flex justify-center">
            <motion.button
              type="button"
              onClick={handleAiClick}
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.92, y: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="group relative -mt-5 sm:-mt-6 flex flex-col items-center justify-center cursor-pointer select-none no-underline outline-none transform-gpu"
              title="King AI Food & Craving Concierge"
              aria-label="Open King AI Concierge"
            >
              <div
                className={cn(
                  "relative p-[3px] rounded-[24px] transition-all duration-300 transform-gpu",
                  isAiActive
                    ? "scale-105 shadow-[0_14px_36px_rgba(245,158,11,0.85),0_0_24px_rgba(251,191,36,0.5)] border border-amber-200"
                    : "shadow-[0_10px_30px_rgba(245,158,11,0.65),0_0_18px_rgba(251,191,36,0.35)] border border-amber-300/60"
                )}
                style={{
                  background: "linear-gradient(135deg, #FFFBEB 0%, #F59E0B 40%, #B45309 80%, #78350F 100%)",
                }}
              >
                {/* Ambient 24K Gold Pulsing Halo */}
                <span className="absolute -inset-1 rounded-[26px] bg-amber-400/35 animate-pulse pointer-events-none blur-xs" />

                <div className="relative flex size-[48px] sm:size-[52px] items-center justify-center rounded-[20px] bg-gradient-to-br from-stone-950 via-[#18130d] to-stone-950 text-amber-300 shadow-inner border border-amber-300/40 group-hover:border-amber-300 transition-colors">
                  <div className="relative flex items-center justify-center">
                    <Crown className="size-6 text-amber-300 fill-amber-400/30 stroke-[2.4] drop-shadow-[0_2px_8px_rgba(245,158,11,0.9)]" />
                    <Sparkles
                      className="absolute -top-1 -right-1.5 size-3 text-yellow-200 animate-spin"
                      style={{ animationDuration: "6s" }}
                    />
                  </div>
                </div>
              </div>
              <span className="mt-1 text-[9px] sm:text-[10px] font-black text-amber-300 tracking-tight flex items-center gap-0.5 drop-shadow-[0_1px_6px_rgba(245,158,11,0.6)]">
                King AI
              </span>
              <span className="text-[6.5px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 text-amber-950 bg-amber-300 shadow-xs">
                CONCIERGE
              </span>
            </motion.button>
          </li>

          {/* ─── TAB 4: CART & BAG (ShoppingBag with Live Badge Counter) ─── */}
          <li className="w-full flex justify-center">
            <Link
              to="/cart"
              preload="intent"
              onClick={onTap}
              className={cn(
                "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu",
                isCartActive ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
              )}
              title="Food Cart & Checkout"
              aria-label={`Cart with ${totalCartCount} items`}
            >
              {isCartActive && (
                <motion.div
                  layoutId="activeDockGlow"
                  className="absolute inset-0 -top-1 rounded-2xl bg-amber-500/10 blur-sm pointer-events-none -z-10"
                  transition={{ type: "spring", stiffness: 450, damping: 28 }}
                />
              )}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                className={cn(
                  "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300",
                  isCartActive
                    ? "bg-gradient-to-br from-amber-400 via-orange-500 to-amber-950 text-white border-2 border-amber-300 shadow-[0_8px_24px_rgba(245,158,11,0.7),0_0_12px_rgba(251,191,36,0.5)]"
                    : "bg-gradient-to-b from-stone-900/95 to-stone-950/95 text-amber-300/85 border border-amber-500/30 group-hover:border-amber-400/50"
                )}
              >
                <ShoppingBag className="size-5 stroke-[2.3]" />
                <AnimatePresence>
                  {totalCartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1.5 -right-2 flex size-4 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-[8px] font-black text-white border border-white shadow-xs"
                    >
                      {totalCartCount > 99 ? "99+" : totalCartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
              <span
                className={cn(
                  "mt-1 text-[9px] sm:text-[10px] font-black truncate tracking-tight",
                  isCartActive ? "text-amber-300 drop-shadow-[0_1px_6px_rgba(245,158,11,0.5)]" : "text-stone-300"
                )}
              >
                Cart
              </span>
              <span className="text-[6.5px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 text-amber-950 bg-amber-300 shadow-2xs">
                BAG
              </span>
            </Link>
          </li>

          {/* ─── TAB 5: ORDERS & LIVE TRACK (Receipt/Bike with Live Radar Pulse) ─── */}
          <li className="w-full flex justify-center">
            <Link
              to="/orders"
              preload="intent"
              onClick={onTap}
              className={cn(
                "group relative flex flex-col items-center justify-center py-0.5 w-full text-center no-underline transition-all duration-300 transform-gpu",
                isOrdersActive ? "scale-110 -translate-y-0.5" : "active:scale-95 hover:opacity-95"
              )}
              title="Orders & Live Rider Radar Track"
              aria-label="Orders and Live Tracking"
            >
              {isOrdersActive && (
                <motion.div
                  layoutId="activeDockGlow"
                  className="absolute inset-0 -top-1 rounded-2xl bg-rose-500/10 blur-sm pointer-events-none -z-10"
                  transition={{ type: "spring", stiffness: 450, damping: 28 }}
                />
              )}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                className={cn(
                  "relative flex size-10 sm:size-11 items-center justify-center rounded-2xl transition-all duration-300",
                  isOrdersActive
                    ? "bg-gradient-to-br from-rose-500 via-red-600 to-rose-950 text-white border-2 border-rose-300 shadow-[0_8px_24px_rgba(225,29,72,0.7),0_0_12px_rgba(244,63,94,0.5)]"
                    : "bg-gradient-to-b from-stone-900/95 to-stone-950/95 text-rose-300/85 border border-rose-500/30 group-hover:border-rose-400/50"
                )}
              >
                {hasActiveOrder ? (
                  <Bike className="size-5 stroke-[2.3] text-emerald-300 animate-pulse" />
                ) : (
                  <Receipt className="size-5 stroke-[2.3]" />
                )}

                {/* Live Radar Pulse Indicator */}
                {hasActiveOrder && (
                  <span className="absolute -top-1.5 -right-1.5 flex size-3.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-80" />
                    <span className="relative inline-flex size-3.5 rounded-full bg-emerald-500 border border-white shadow-xs" />
                  </span>
                )}
              </motion.div>
              <span
                className={cn(
                  "mt-1 text-[9px] sm:text-[10px] font-black truncate tracking-tight",
                  isOrdersActive ? "text-rose-300 drop-shadow-[0_1px_6px_rgba(225,29,72,0.5)]" : "text-stone-300"
                )}
              >
                Orders
              </span>
              <span
                className={cn(
                  "text-[6.5px] font-black tracking-widest uppercase px-1.5 py-[0.5px] rounded-full mt-0.5 shadow-2xs",
                  hasActiveOrder
                    ? "text-emerald-950 bg-emerald-300 font-extrabold animate-pulse"
                    : "text-rose-950 bg-rose-300"
                )}
              >
                {hasActiveOrder ? "LIVE RADAR" : "TRACK"}
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
