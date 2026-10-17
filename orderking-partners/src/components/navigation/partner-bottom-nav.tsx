import { Link, useRouterState } from "@tanstack/react-router";
import {
  ChefHat,
  ClipboardList,
  MoreHorizontal,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { useT } from "@/components/use-t";
import { cn } from "@/lib/utils";

interface PartnerBottomNavProps {
  onOpenSpark?: () => void;
  pendingOrdersCount?: number;
}

export function PartnerFloatingBottomNav({
  onOpenSpark: _onOpenSpark,
  pendingOrdersCount = 0,
}: PartnerBottomNavProps) {
  const t = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isOrders = pathname.startsWith("/orders") || pathname === "/";
  const isKds = pathname.startsWith("/kds") || pathname.startsWith("/kitchen");
  const isMenu = pathname.startsWith("/menu");
  const isSettlements = pathname.startsWith("/settlements") || pathname.startsWith("/payouts");
  const isMore =
    pathname.startsWith("/more") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/promotions") ||
    pathname.startsWith("/hours") ||
    pathname.startsWith("/reviews") ||
    pathname.startsWith("/notifications");

  return (
    <nav
      role="navigation"
      aria-label="Order King Partner Navigation"
      className="fixed inset-x-0 bottom-3 sm:bottom-4 z-40 pointer-events-none mx-auto max-w-lg px-3 sm:px-4 md:hidden"
    >
      <div className="pointer-events-auto relative rounded-[28px] bg-slate-900/90 backdrop-blur-2xl border border-slate-700/60 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5),inset_0_1px_1px_0_rgba(255,255,255,0.15)] px-2 pt-1 pb-1.5 transition-all">
        {/* Ambient Top Glow Beam */}
        <div className="absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent pointer-events-none" />

        <ul className="grid grid-cols-5 items-end justify-items-center relative">
          {/* 1. LIVE ORDERS (KOT) - REALTIME AUDIO & PENDING BADGE */}
          <li className="w-full flex justify-center">
            <Link
              to="/orders"
              title={pendingOrdersCount > 0 ? `${pendingOrdersCount} orders waiting for kitchen action` : (t("nav.orders") || "Live Orders")}
              aria-label={t("nav.orders") || "Live Orders"}
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-all duration-300 active:scale-90",
                isOrders ? "text-rose-400 font-extrabold" : "text-slate-400 hover:text-slate-200 font-semibold"
              )}
            >
              <div
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-2xl transition-all duration-300",
                  isOrders ? "bg-rose-500/15 ring-1 ring-rose-500/40 text-rose-400 scale-105" : "group-hover:bg-slate-800"
                )}
              >
                <ClipboardList className="size-5" />
                {pendingOrdersCount > 0 ? (
                  <span className="absolute -top-1 -right-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[8.5px] font-black text-white shadow-md shadow-rose-600/50 animate-pulse">
                    {pendingOrdersCount > 99 ? "99+" : pendingOrdersCount}
                  </span>
                ) : (
                  <span className="absolute top-1 right-1 size-1.5 rounded-full bg-rose-500/80 shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
                )}
              </div>
              <span className="mt-1 text-[10px] sm:text-[10.5px] tracking-tight leading-none">{t("nav.orders") || "Live Orders"}</span>
              {isOrders && <span className="size-1 rounded-full bg-rose-500 mt-1 shadow-[0_0_6px_rgba(244,63,94,1)]" />}
            </Link>
          </li>

          {/* 2. KITCHEN DISPLAY SYSTEM (KDS) - EMERALD ACCENT */}
          <li className="w-full flex justify-center">
            <Link
              to="/kds"
              title="Kitchen Display Station (KDS) Cook Board"
              aria-label={t("nav.kitchen") || "KDS"}
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-all duration-300 active:scale-90",
                isKds ? "text-emerald-400 font-extrabold" : "text-slate-400 hover:text-slate-200 font-semibold"
              )}
            >
              <div
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-2xl transition-all duration-300",
                  isKds ? "bg-emerald-500/15 ring-1 ring-emerald-400/40 text-emerald-400 scale-105" : "group-hover:bg-slate-800"
                )}
              >
                <ChefHat className="size-5" />
              </div>
              <span className="mt-1 text-[10px] sm:text-[10.5px] tracking-tight leading-none">{t("nav.kitchen") || "KDS"}</span>
              {isKds && <span className="size-1 rounded-full bg-emerald-400 mt-1 shadow-[0_0_6px_rgba(16,185,129,1)]" />}
            </Link>
          </li>

          {/* 3. MENU & STOCK MANAGER - 1-TAP IN-STOCK / 86 TOGGLE */}
          <li className="w-full flex justify-center">
            <Link
              to="/menu"
              title="Menu & Stock Manager (1-Tap 86 In-Stock/Out-of-Stock)"
              aria-label={t("nav.menu") || "Menu & Stock"}
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-all duration-300 active:scale-90",
                isMenu ? "text-sky-400 font-extrabold" : "text-slate-400 hover:text-slate-200 font-semibold"
              )}
            >
              <div
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-2xl transition-all duration-300",
                  isMenu ? "bg-sky-500/15 ring-1 ring-sky-400/40 text-sky-400 scale-105" : "group-hover:bg-slate-800"
                )}
              >
                <UtensilsCrossed className="size-5" />
              </div>
              <span className="mt-1 text-[10px] sm:text-[10.5px] tracking-tight leading-none">{t("nav.menu") || "Menu & Stock"}</span>
              {isMenu && <span className="size-1 rounded-full bg-sky-400 mt-1 shadow-[0_0_6px_rgba(56,189,248,1)]" />}
            </Link>
          </li>

          {/* 4. PAYOUTS & SETTLEMENTS - REALTIME UPI DAILY SETTLEMENTS & GST 9(5) */}
          <li className="w-full flex justify-center">
            <Link
              to="/settlements"
              title="Payouts & Realtime UPI Daily Settlements"
              aria-label={t("nav.settlements") || "Payouts"}
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-all duration-300 active:scale-90",
                isSettlements ? "text-teal-400 font-extrabold" : "text-slate-400 hover:text-slate-200 font-semibold"
              )}
            >
              <div
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-2xl transition-all duration-300",
                  isSettlements ? "bg-teal-500/15 ring-1 ring-teal-400/40 text-teal-400 scale-105" : "group-hover:bg-slate-800"
                )}
              >
                <Wallet className="size-5" />
              </div>
              <span className="mt-1 text-[10px] sm:text-[10.5px] tracking-tight leading-none">{t("nav.settlements") || "Payouts"}</span>
              {isSettlements && <span className="size-1 rounded-full bg-teal-400 mt-1 shadow-[0_0_6px_rgba(45,212,191,1)]" />}
            </Link>
          </li>

          {/* 5. MORE - EXPANDED RESTAURANT OPERATIONS, PROMOS & SETTINGS */}
          <li className="w-full flex justify-center">
            <Link
              to="/more"
              title="More Restaurant Hub & Settings"
              aria-label="More Options & Hub"
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-all duration-300 active:scale-90",
                isMore ? "text-amber-400 font-extrabold" : "text-slate-400 hover:text-slate-200 font-semibold"
              )}
            >
              <div
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-2xl transition-all duration-300",
                  isMore ? "bg-amber-500/15 ring-1 ring-amber-400/40 text-amber-400 scale-105" : "group-hover:bg-slate-800"
                )}
              >
                <MoreHorizontal className="size-5" />
              </div>
              <span className="mt-1 text-[10px] sm:text-[10.5px] tracking-tight leading-none">More</span>
              {isMore && <span className="size-1 rounded-full bg-amber-400 mt-1 shadow-[0_0_6px_rgba(245,158,11,1)]" />}
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
