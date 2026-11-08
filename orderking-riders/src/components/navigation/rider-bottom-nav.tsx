import { Link, useRouterState } from "@tanstack/react-router";
import {
  Banknote,
  House,
  ReceiptText,
  UserCheck,
  Wallet,
} from "lucide-react";
import { useI18n } from "@/lib/rider/i18n-context";
import { cn } from "@/lib/utils";

interface RiderBottomNavProps {
  isDutyOnline?: boolean;
}

export function RiderFloatingBottomNav({ isDutyOnline = true }: RiderBottomNavProps) {
  const { t } = useI18n();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const isDutyActive = path === "/" || path === "/duty";
  const isTripsActive = path === "/trips" || path === "/history" || path.startsWith("/delivery");
  const isPocketActive = path === "/cash" || path === "/wallet";
  const isEarningsActive = path === "/earnings" || path === "/settlements" || path === "/payouts";
  const isProfileActive = path === "/profile" || path === "/onboarding" || path === "/benefits";

  return (
    <nav
      role="navigation"
      aria-label="Delivery Partner Navigation"
      className="fixed inset-x-0 bottom-2.5 sm:bottom-4 z-40 pointer-events-none mx-auto max-w-md px-2.5 sm:px-4"
    >
      <div className="pointer-events-auto relative rounded-[28px] bg-white/95 backdrop-blur-2xl border border-gray-200 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.12),inset_0_1px_1px_0_rgba(255,255,255,0.8)] px-1.5 pt-1.5 pb-2 transition-all">
        {/* Subtle Ambient Emerald Beam if Online */}
        <div
          className={cn(
            "absolute top-0 inset-x-8 h-[1.5px] transition-colors pointer-events-none",
            isDutyOnline
              ? "bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent"
              : "bg-gradient-to-r from-transparent via-slate-400/30 to-transparent",
          )}
        />

        {/* 5 DEDICATED BENCHMARK FLEET TABS */}
        <ul className="grid grid-cols-5 items-center justify-items-center relative">
          {/* 1. DUTY */}
          <li className="w-full flex justify-center">
            <Link
              to="/"
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-all duration-300 active:scale-90",
                isDutyActive
                  ? "text-emerald-600 font-extrabold"
                  : "text-gray-500 font-semibold",
              )}
            >
              <div
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-2xl transition-all duration-300",
                  isDutyActive
                    ? "bg-emerald-50 ring-1 ring-emerald-500/20 text-emerald-600 scale-105"
                    : "group-hover:bg-gray-100",
                )}
              >
                <House className="size-5" />
                {isDutyOnline && (
                  <span className="absolute -top-1 -right-1 flex size-2.5 items-center justify-center">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                  </span>
                )}
              </div>
              <span className="mt-1 text-[10.5px] tracking-tight leading-none">
                Duty
              </span>
              {isDutyActive && (
                <span className="size-1 rounded-full bg-emerald-500 mt-1 shadow-[0_0_6px_rgba(16,185,129,1)]" />
              )}
            </Link>
          </li>

          {/* 2. ORDERS */}
          <li className="w-full flex justify-center">
            <Link
              to="/history"
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-all duration-300 active:scale-90",
                isTripsActive
                  ? "text-[#E23744] font-extrabold"
                  : "text-gray-500 font-semibold",
              )}
            >
              <div
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-2xl transition-all duration-300",
                  isTripsActive
                    ? "bg-red-50 ring-1 ring-red-500/20 text-[#E23744] scale-105"
                    : "group-hover:bg-gray-100",
                )}
              >
                <ReceiptText className="size-5" />
              </div>
              <span className="mt-1 text-[10.5px] tracking-tight leading-none">
                Orders
              </span>
              {isTripsActive && (
                <span className="size-1 rounded-full bg-[#E23744] mt-1 shadow-[0_0_6px_rgba(226,55,68,1)]" />
              )}
            </Link>
          </li>

          {/* 3. POCKET */}
          <li className="w-full flex justify-center">
            <Link
              to="/cash"
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-all duration-300 active:scale-90",
                isPocketActive
                  ? "text-blue-600 font-extrabold"
                  : "text-gray-500 font-semibold",
              )}
            >
              <div
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-2xl transition-all duration-300",
                  isPocketActive
                    ? "bg-blue-50 ring-1 ring-blue-500/20 text-blue-600 scale-105"
                    : "group-hover:bg-gray-100",
                )}
              >
                <Wallet className="size-5" />
              </div>
              <span className="mt-1 text-[10.5px] tracking-tight leading-none">
                Pocket
              </span>
              {isPocketActive && (
                <span className="size-1 rounded-full bg-blue-500 mt-1 shadow-[0_0_6px_rgba(59,130,246,1)]" />
              )}
            </Link>
          </li>

          {/* 4. EARNINGS */}
          <li className="w-full flex justify-center">
            <Link
              to="/earnings"
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-all duration-300 active:scale-90",
                isEarningsActive
                  ? "text-amber-600 font-extrabold"
                  : "text-gray-500 font-semibold",
              )}
            >
              <div
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-2xl transition-all duration-300",
                  isEarningsActive
                    ? "bg-amber-50 ring-1 ring-amber-500/20 text-amber-600 scale-105"
                    : "group-hover:bg-gray-100",
                )}
              >
                <Banknote className="size-5" />
              </div>
              <span className="mt-1 text-[10.5px] tracking-tight leading-none">
                Earnings
              </span>
              {isEarningsActive && (
                <span className="size-1 rounded-full bg-amber-500 mt-1 shadow-[0_0_6px_rgba(245,158,11,1)]" />
              )}
            </Link>
          </li>

          {/* 5. MORE */}
          <li className="w-full flex justify-center">
            <Link
              to="/profile"
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-all duration-300 active:scale-90",
                isProfileActive
                  ? "text-[#E23744] font-extrabold"
                  : "text-gray-500 font-semibold",
              )}
            >
              <div
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-2xl transition-all duration-300",
                  isProfileActive
                    ? "bg-red-50 ring-1 ring-red-500/20 text-[#E23744] scale-105"
                    : "group-hover:bg-gray-100",
                )}
              >
                <UserCheck className="size-5" />
              </div>
              <span className="mt-1 text-[10.5px] tracking-tight leading-none">
                More
              </span>
              {isProfileActive && (
                <span className="size-1 rounded-full bg-[#E23744] mt-1" />
              )}
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
