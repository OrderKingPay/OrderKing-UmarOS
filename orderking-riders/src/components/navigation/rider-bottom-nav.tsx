import { Link, useRouterState } from "@tanstack/react-router";
import {
  Banknote,
  Bike,
  History,
  House,
  ShieldAlert,
} from "lucide-react";
import { useI18n } from "@/lib/rider/i18n-context";
import { cn } from "@/lib/utils";

interface RiderBottomNavProps {
  isDutyOnline?: boolean;
}

export function RiderFloatingBottomNav({ isDutyOnline = true }: RiderBottomNavProps) {
  const { t } = useI18n();
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      role="navigation"
      aria-label="OrderKing Rider Navigation"
      className="fixed inset-x-0 bottom-3 sm:bottom-4 z-40 pointer-events-none mx-auto max-w-lg px-3 sm:px-4 lg:hidden"
    >
      <div className="pointer-events-auto relative rounded-[28px] bg-card/95 backdrop-blur-2xl border border-border shadow-[0_20px_50px_-10px_rgba(0,0,0,0.18),inset_0_1px_1px_0_rgba(255,255,255,0.4)] px-2 pt-1 pb-1.5 transition-all">
        {/* Subtle Ambient Emerald Beam if Online */}
        <div
          className={cn(
            "absolute top-0 inset-x-8 h-[1.5px] transition-colors pointer-events-none",
            isDutyOnline
              ? "bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent"
              : "bg-gradient-to-r from-transparent via-slate-400/30 to-transparent"
          )}
        />

        <ul className="grid grid-cols-5 items-end justify-items-center relative">
          {/* 1. DUTY / HOME - EMERALD RADAR */}
          <li className="w-full flex justify-center">
            <Link
              to="/"
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-all duration-300 active:scale-90",
                path === "/" ? "text-emerald-600 dark:text-emerald-400 font-extrabold" : "text-muted-foreground font-semibold"
              )}
            >
              <div
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-2xl transition-all duration-300",
                  path === "/" ? "bg-emerald-50 dark:bg-emerald-950/60 ring-1 ring-emerald-500/20 text-emerald-600 scale-105" : "group-hover:bg-muted"
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
              <span className="mt-1 text-[10.5px] tracking-tight leading-none">{t("home") || "Home"}</span>
              {path === "/" && <span className="size-1 rounded-full bg-emerald-500 mt-1 shadow-[0_0_6px_rgba(16,185,129,1)]" />}
            </Link>
          </li>

          {/* 2. EARNINGS - 24K GOLD ACCENT */}
          <li className="w-full flex justify-center">
            <Link
              to="/earnings"
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-all duration-300 active:scale-90",
                path === "/earnings" ? "text-amber-600 dark:text-amber-400 font-extrabold" : "text-muted-foreground font-semibold"
              )}
            >
              <div
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-2xl transition-all duration-300",
                  path === "/earnings" ? "bg-amber-50 dark:bg-amber-950/60 ring-1 ring-amber-500/20 text-amber-600 scale-105" : "group-hover:bg-muted"
                )}
              >
                <Banknote className="size-5" />
              </div>
              <span className="mt-1 text-[10.5px] tracking-tight leading-none">{t("earnings") || "Earnings"}</span>
              {path === "/earnings" && <span className="size-1 rounded-full bg-amber-500 mt-1 shadow-[0_0_6px_rgba(245,158,11,1)]" />}
            </Link>
          </li>

          {/* 3. SOS SAFETY BEACON - RUBY EMERGENCY CENTERPIECE */}
          <li className="w-full flex justify-center">
            <Link
              to="/safety"
              className="group relative -mt-5 sm:-mt-6 flex flex-col items-center justify-center no-underline transition-all duration-300 active:scale-92"
              title="Rider Emergency SOS Guard"
            >
              <div className="relative p-[2.5px] rounded-[22px] bg-gradient-to-tr from-rose-600 via-red-500 to-rose-400 shadow-[0_8px_25px_rgba(225,29,72,0.45)] group-hover:scale-105 transition-all duration-300">
                <div className="flex size-12 items-center justify-center rounded-[19.5px] bg-gradient-to-b from-gray-950 via-slate-900 to-black text-rose-400 shadow-inner">
                  <ShieldAlert className="size-6 filter drop-shadow-[0_2px_6px_rgba(225,29,72,0.8)]" />
                </div>
              </div>
              <span className="mt-1 text-[10.5px] font-black tracking-tight text-rose-600 dark:text-rose-400 leading-none">
                SOS Guard
              </span>
            </Link>
          </li>

          {/* 4. HISTORY / TRIPS */}
          <li className="w-full flex justify-center">
            <Link
              to="/history"
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-all duration-300 active:scale-90",
                path === "/history" ? "text-primary font-extrabold" : "text-muted-foreground font-semibold"
              )}
            >
              <div
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-2xl transition-all duration-300",
                  path === "/history" ? "bg-primary/10 ring-1 ring-primary/20 text-primary scale-105" : "group-hover:bg-muted"
                )}
              >
                <History className="size-5" />
              </div>
              <span className="mt-1 text-[10.5px] tracking-tight leading-none">{t("history") || "History"}</span>
              {path === "/history" && <span className="size-1 rounded-full bg-primary mt-1" />}
            </Link>
          </li>

          {/* 5. PROFILE / FLEET KYC */}
          <li className="w-full flex justify-center">
            <Link
              to="/profile"
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-all duration-300 active:scale-90",
                path === "/profile" ? "text-primary font-extrabold" : "text-muted-foreground font-semibold"
              )}
            >
              <div
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-2xl transition-all duration-300",
                  path === "/profile" ? "bg-primary/10 ring-1 ring-primary/20 text-primary scale-105" : "group-hover:bg-muted"
                )}
              >
                <Bike className="size-5" />
              </div>
              <span className="mt-1 text-[10.5px] tracking-tight leading-none">{t("profile") || "Profile"}</span>
              {path === "/profile" && <span className="size-1 rounded-full bg-primary mt-1" />}
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
