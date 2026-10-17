import { Link, useRouterState } from "@tanstack/react-router";
import {
  Banknote,
  Building2,
  House,
  Navigation,
  UserCheck,
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
  const isEarningsActive = path === "/earnings" || path === "/wallet" || path === "/cash";
  const isPayoutsActive = path === "/settlements" || path === "/payouts";
  const isProfileActive = path === "/profile" || path === "/onboarding" || path === "/benefits";

  return (
    <nav
      role="navigation"
      aria-label="Order King Fleet Partner Navigation"
      className="fixed inset-x-0 bottom-2.5 sm:bottom-4 z-40 pointer-events-none mx-auto max-w-lg px-2.5 sm:px-4 lg:hidden"
    >
      <div className="pointer-events-auto relative rounded-[28px] bg-card/95 backdrop-blur-2xl border border-border shadow-[0_20px_50px_-10px_rgba(0,0,0,0.18),inset_0_1px_1px_0_rgba(255,255,255,0.4)] px-1.5 pt-1.5 pb-2 transition-all">
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
          {/* 1. DUTY - Online/Offline status radar, incoming order dispatch */}
          <li className="w-full flex justify-center">
            <Link
              to="/"
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-all duration-300 active:scale-90",
                isDutyActive
                  ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
                  : "text-muted-foreground font-semibold",
              )}
            >
              <div
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-2xl transition-all duration-300",
                  isDutyActive
                    ? "bg-emerald-50 dark:bg-emerald-950/60 ring-1 ring-emerald-500/20 text-emerald-600 scale-105"
                    : "group-hover:bg-muted",
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
                {t("duty") || "Duty"}
              </span>
              {isDutyActive && (
                <span className="size-1 rounded-full bg-emerald-500 mt-1 shadow-[0_0_6px_rgba(16,185,129,1)]" />
              )}
            </Link>
          </li>

          {/* 2. TRIPS - Active navigation, completed trips, distance logs */}
          <li className="w-full flex justify-center">
            <Link
              to="/trips"
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-all duration-300 active:scale-90",
                isTripsActive
                  ? "text-blue-600 dark:text-blue-400 font-extrabold"
                  : "text-muted-foreground font-semibold",
              )}
            >
              <div
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-2xl transition-all duration-300",
                  isTripsActive
                    ? "bg-blue-50 dark:bg-blue-950/60 ring-1 ring-blue-500/20 text-blue-600 scale-105"
                    : "group-hover:bg-muted",
                )}
              >
                <Navigation className="size-5" />
              </div>
              <span className="mt-1 text-[10.5px] tracking-tight leading-none">
                {t("trips") || "Trips"}
              </span>
              {isTripsActive && (
                <span className="size-1 rounded-full bg-blue-500 mt-1 shadow-[0_0_6px_rgba(59,130,246,1)]" />
              )}
            </Link>
          </li>

          {/* 3. EARNINGS - Delivery fee breakdown, tips & COD ledger */}
          <li className="w-full flex justify-center">
            <Link
              to="/earnings"
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-all duration-300 active:scale-90",
                isEarningsActive
                  ? "text-amber-600 dark:text-amber-400 font-extrabold"
                  : "text-muted-foreground font-semibold",
              )}
            >
              <div
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-2xl transition-all duration-300",
                  isEarningsActive
                    ? "bg-amber-50 dark:bg-amber-950/60 ring-1 ring-amber-500/20 text-amber-600 scale-105"
                    : "group-hover:bg-muted",
                )}
              >
                <Banknote className="size-5" />
              </div>
              <span className="mt-1 text-[10.5px] tracking-tight leading-none">
                {t("earnings") || "Earnings"}
              </span>
              {isEarningsActive && (
                <span className="size-1 rounded-full bg-amber-500 mt-1 shadow-[0_0_6px_rgba(245,158,11,1)]" />
              )}
            </Link>
          </li>

          {/* 4. PAYOUTS - Direct bank transfers, weekly settlements & GST */}
          <li className="w-full flex justify-center">
            <Link
              to="/settlements"
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-all duration-300 active:scale-90",
                isPayoutsActive
                  ? "text-indigo-600 dark:text-indigo-400 font-extrabold"
                  : "text-muted-foreground font-semibold",
              )}
            >
              <div
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-2xl transition-all duration-300",
                  isPayoutsActive
                    ? "bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-500/20 text-indigo-600 scale-105"
                    : "group-hover:bg-muted",
                )}
              >
                <Building2 className="size-5" />
              </div>
              <span className="mt-1 text-[10.5px] tracking-tight leading-none">
                {t("payouts") || "Payouts"}
              </span>
              {isPayoutsActive && (
                <span className="size-1 rounded-full bg-indigo-500 mt-1 shadow-[0_0_6px_rgba(99,102,241,1)]" />
              )}
            </Link>
          </li>

          {/* 5. PROFILE - Rider KYC, vehicle details, ratings & emergency contacts */}
          <li className="w-full flex justify-center">
            <Link
              to="/profile"
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-all duration-300 active:scale-90",
                isProfileActive
                  ? "text-primary font-extrabold"
                  : "text-muted-foreground font-semibold",
              )}
            >
              <div
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-2xl transition-all duration-300",
                  isProfileActive
                    ? "bg-primary/10 ring-1 ring-primary/20 text-primary scale-105"
                    : "group-hover:bg-muted",
                )}
              >
                <UserCheck className="size-5" />
              </div>
              <span className="mt-1 text-[10.5px] tracking-tight leading-none">
                {t("profile") || "Profile"}
              </span>
              {isProfileActive && (
                <span className="size-1 rounded-full bg-primary mt-1" />
              )}
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
