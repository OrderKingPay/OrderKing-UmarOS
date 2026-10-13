import { Link, useRouterState } from "@tanstack/react-router";
import {
  ChefHat,
  ClipboardList,
  Home,
  MoreHorizontal,
  Sparkles,
} from "lucide-react";
import { useT } from "@/components/use-t";
import { cn } from "@/lib/utils";

interface PartnerBottomNavProps {
  onOpenSpark: () => void;
  pendingOrdersCount?: number;
}

export function PartnerFloatingBottomNav({
  onOpenSpark,
  pendingOrdersCount = 0,
}: PartnerBottomNavProps) {
  const t = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isHome = pathname.startsWith("/dashboard");
  const isOrders = pathname.startsWith("/orders");
  const isKitchen = pathname.startsWith("/kitchen");
  const isMore = pathname === "/more" || ["/settlements", "/menu", "/analytics", "/settings", "/reviews"].some((p) => pathname.startsWith(p));

  return (
    <nav
      role="navigation"
      aria-label="OrderKing Merchant Navigation"
      className="fixed inset-x-0 bottom-3 sm:bottom-4 z-40 pointer-events-none mx-auto max-w-lg px-3 sm:px-4 md:hidden"
    >
      <div className="pointer-events-auto relative rounded-[28px] bg-slate-900/90 backdrop-blur-2xl border border-slate-700/60 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5),inset_0_1px_1px_0_rgba(255,255,255,0.15)] px-2 pt-1 pb-1.5 transition-all">
        {/* Ambient Top Glow Beam */}
        <div className="absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent pointer-events-none" />

        <ul className="grid grid-cols-5 items-end justify-items-center relative">
          {/* 1. DASHBOARD / HOME */}
          <li className="w-full flex justify-center">
            <Link
              to="/dashboard"
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-all duration-300 active:scale-90",
                isHome ? "text-amber-400 font-extrabold" : "text-slate-400 hover:text-slate-200 font-semibold"
              )}
            >
              <div
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-2xl transition-all duration-300",
                  isHome ? "bg-amber-500/15 ring-1 ring-amber-400/40 text-amber-400 scale-105" : "group-hover:bg-slate-800"
                )}
              >
                <Home className="size-5" />
              </div>
              <span className="mt-1 text-[10.5px] tracking-tight leading-none">{t("nav.home") || "Home"}</span>
              {isHome && <span className="size-1 rounded-full bg-amber-400 mt-1 shadow-[0_0_6px_rgba(245,158,11,1)]" />}
            </Link>
          </li>

          {/* 2. ORDERS (LIVE KOT) - RUBY ALERT BADGE */}
          <li className="w-full flex justify-center">
            <Link
              to="/orders"
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
                  <span className="absolute -top-1 -right-1 flex min-h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-600 px-1 text-[8px] font-black text-white shadow-xs">
                    {pendingOrdersCount}
                  </span>
                ) : (
                  <span className="absolute top-1 right-1 size-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.9)]" />
                )}
              </div>
              <span className="mt-1 text-[10.5px] tracking-tight leading-none">{t("nav.orders") || "Orders"}</span>
              {isOrders && <span className="size-1 rounded-full bg-rose-500 mt-1 shadow-[0_0_6px_rgba(244,63,94,1)]" />}
            </Link>
          </li>

          {/* 3. SPARK AI CENTERPIECE (RESTAURANT CO-PILOT) - GOLD GLOW */}
          <li className="w-full flex justify-center">
            <button
              type="button"
              onClick={onOpenSpark}
              className="group relative -mt-5 sm:-mt-6 flex flex-col items-center justify-center transition-all duration-300 active:scale-92 cursor-pointer"
              title="Open Spark Restaurant AI"
            >
              <div className="relative p-[2.5px] rounded-[22px] bg-gradient-to-tr from-amber-500 via-amber-300 to-yellow-200 shadow-[0_8px_25px_rgba(245,158,11,0.45)] group-hover:scale-105 transition-all duration-300">
                <div className="flex size-12 items-center justify-center rounded-[19.5px] bg-gradient-to-b from-gray-950 via-slate-900 to-black text-amber-300 shadow-inner">
                  <Sparkles className="size-6 text-amber-300 filter drop-shadow-[0_2px_6px_rgba(245,158,11,0.6)]" />
                </div>
              </div>
              <span className="mt-1 text-[10.5px] font-black tracking-tight text-amber-300 leading-none">
                Spark AI
              </span>
            </button>
          </li>

          {/* 4. KITCHEN DISPLAY STATION (KDS) - EMERALD ACCENT */}
          <li className="w-full flex justify-center">
            <Link
              to="/kitchen"
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-all duration-300 active:scale-90",
                isKitchen ? "text-emerald-400 font-extrabold" : "text-slate-400 hover:text-slate-200 font-semibold"
              )}
            >
              <div
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-2xl transition-all duration-300",
                  isKitchen ? "bg-emerald-500/15 ring-1 ring-emerald-400/40 text-emerald-400 scale-105" : "group-hover:bg-slate-800"
                )}
              >
                <ChefHat className="size-5" />
              </div>
              <span className="mt-1 text-[10.5px] tracking-tight leading-none">{t("nav.kitchen") || "Kitchen"}</span>
              {isKitchen && <span className="size-1 rounded-full bg-emerald-400 mt-1 shadow-[0_0_6px_rgba(16,185,129,1)]" />}
            </Link>
          </li>

          {/* 5. MORE STORE MANAGEMENT */}
          <li className="w-full flex justify-center">
            <Link
              to="/more"
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-all duration-300 active:scale-90",
                isMore ? "text-indigo-400 font-extrabold" : "text-slate-400 hover:text-slate-200 font-semibold"
              )}
            >
              <div
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-2xl transition-all duration-300",
                  isMore ? "bg-indigo-500/15 ring-1 ring-indigo-400/40 text-indigo-400 scale-105" : "group-hover:bg-slate-800"
                )}
              >
                <MoreHorizontal className="size-5" />
              </div>
              <span className="mt-1 text-[10.5px] tracking-tight leading-none">{t("nav.more") || "More"}</span>
              {isMore && <span className="size-1 rounded-full bg-indigo-400 mt-1 shadow-[0_0_6px_rgba(99,102,241,1)]" />}
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
