import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  ChefHat,
  ClipboardList,
  Clock3,
  Home,
  Languages,
  LineChart,
  MoreHorizontal,
  Settings,
  Sparkles,
  Store,
  UtensilsCrossed,
  Wallet,
  Star,
  Tag,
} from "lucide-react";
import { useState, type ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useClientState } from "@/lib/client-state";
import { can, type Permission } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { DataBanner } from "./data-banner";
import { OfflineBanner } from "./offline-banner";
import { OrderKingMark } from "./mark";
import { useT } from "./use-t";
import { useVendor } from "./use-vendor";
import { OrderKingSparkModal } from "./ai/order-king-spark-modal";
import type { AppLanguage } from "@/lib/platform-config";

export const PRIMARY_NAV = [
  { to: "/dashboard", key: "nav.home", icon: Home, perm: "dashboard.view" as Permission },
  { to: "/orders", key: "nav.orders", icon: ClipboardList, perm: "orders.view" as Permission },
  { to: "/kitchen", key: "nav.kitchen", icon: ChefHat, perm: "kitchen.view" as Permission },
  { to: "/menu", key: "nav.menu", icon: UtensilsCrossed, perm: "menu.view" as Permission },
] as const;

export const MORE_NAV = [
  { to: "/promotions", key: "nav.promotions", icon: Tag, perm: "promotions.view" as Permission },
  { to: "/settlements", key: "nav.settlements", icon: Wallet, perm: "settlements.view" as Permission },
  { to: "/analytics", key: "nav.analytics", icon: LineChart, perm: "analytics.view" as Permission },
  { to: "/reviews", key: "nav.reviews", icon: Star, perm: "reviews.view" as Permission },
  { to: "/hours", key: "nav.hours", icon: Clock3, perm: "hours.edit" as Permission },
  { to: "/assistant", key: "nav.assistant", icon: Sparkles, perm: "assistant.use" as Permission },
  { to: "/notifications", key: "nav.notifications", icon: Bell, perm: "notifications.view" as Permission },
  { to: "/onboarding", key: "nav.onboarding", icon: Store, perm: "onboarding.edit" as Permission },
  { to: "/support", key: "nav.support", icon: ClipboardList, perm: "settings.view" as Permission },
  { to: "/settings", key: "nav.settings", icon: Settings, perm: "settings.view" as Permission },
] as const;

export function VendorShell({
  children,
  title,
  dataLabel,
  stale,
  restaurantName,
}: {
  children: ReactNode;
  title: string;
  dataLabel?: string | null;
  stale?: boolean;
  restaurantName?: string;
}) {
  const t = useT();
  const { user, isPending } = useCurrentUserState();
  const vendor = useVendor();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lang = useClientState((s) => s.lang);
  const setLang = useClientState((s) => s.setLang);
  const role = vendor.role;
  const primary = PRIMARY_NAV.filter((item) => !role || can(role, item.perm));
  const more = MORE_NAV.filter((item) => !role || can(role, item.perm));
  const mobilePrimary = (primary.length >= 4 ? primary : [...primary, ...more]).slice(0, 4);

  const [sparkOpen, setSparkOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.getElementById('vendor-main-scroll');
      if (scrollContainer) {
        setScrolled(scrollContainer.scrollTop > 10);
      }
    };
    const el = document.getElementById('vendor-main-scroll');
    el?.addEventListener('scroll', handleScroll, { passive: true });
    return () => el?.removeEventListener('scroll', handleScroll);
  }, []);

  if (isPending) {
    return (
      <div className="min-h-dvh bg-bg p-6 flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-4"
        >
          <OrderKingMark className="size-16 text-fuchsia-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
          <div className="h-1.5 w-32 bg-amber-500/20 rounded-full overflow-hidden">
             <motion.div 
               animate={{ x: ["-100%", "200%"] }} 
               transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
               className="h-full w-1/2 bg-amber-500 rounded-full"
             />
          </div>
        </motion.div>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  return (
    <div className="flex h-dvh overflow-hidden bg-[#030303] text-white break-words text-wrap selection:bg-fuchsia-500/30">
      
      {/* 100x PREMIUM SIDEBAR (DESKTOP) */}
      <aside className="relative z-30 hidden h-dvh w-[260px] shrink-0 flex-col border-r border-white/10 bg-black/40 backdrop-blur-3xl md:flex">
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-r-3xl">
           <div className="absolute -top-[10%] -left-[20%] w-[140%] h-[40%] bg-gradient-to-br from-fuchsia-500/10 to-cyan-600/5 blur-[80px]" />
        </div>

        <div className="relative z-10 flex h-20 items-center gap-3 px-6 shrink-0 border-b border-white/10">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.3)] backdrop-blur-md">
            <OrderKingMark className="size-6 text-fuchsia-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-lg font-bold tracking-tight bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent">{t("app.name")}</div>
            <div className="truncate text-[10px] font-semibold uppercase tracking-widest text-amber-500">{restaurantName ?? t("app.tagline")}</div>
          </div>
        </div>

        <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6 scrollbar-hide">
          <nav className="flex flex-col gap-1.5" aria-label="Main">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Core Engine</div>
            {primary.map((item) => (
              <NavLink key={item.to} to={item.to} active={pathname.startsWith(item.to)} icon={item.icon}>
                {t(item.key)}
              </NavLink>
            ))}
            
            <div className="my-6 px-3">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Growth & Ops</div>
            {more.map((item) => (
              <NavLink key={item.to} to={item.to} active={pathname.startsWith(item.to)} icon={item.icon}>
                {t(item.key)}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="relative z-10 shrink-0 border-t border-white/10 p-4 bg-black/50 backdrop-blur-xl">
          <UserButton />
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        
        {/* PREMIUM TOP HEADER */}
        <header 
          className={cn(
            "sticky top-0 z-20 flex min-h-[4.5rem] shrink-0 items-center justify-between gap-4 px-4 transition-all duration-300 md:px-8",
            scrolled 
              ? "bg-[#0a0a0a]/80 backdrop-blur-3xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] border-b border-white/10" 
              : "bg-transparent border-b border-transparent pt-2"
          )}
        >
          <div className="min-w-0 flex-1 flex items-center gap-3">
            <div className="flex items-center gap-3 md:hidden">
              <OrderKingMark className="size-8 shrink-0 text-amber-500 drop-shadow-md" />
              <span className="truncate font-display text-xl font-bold">{restaurantName ?? t("app.name")}</span>
            </div>
            <motion.h1 
               initial={false}
               animate={{ opacity: scrolled ? 1 : 0, y: scrolled ? 0 : 10 }}
               className="hidden truncate font-display text-2xl font-bold md:block text-white"
            >
               {title}
            </motion.h1>
          </div>
          
          <div className="flex shrink-0 items-center gap-2.5">
            <div className="relative hidden sm:block">
              <select
                className="h-10 appearance-none rounded-xl border border-white/10 bg-white/5 pl-10 pr-8 text-xs font-medium outline-none backdrop-blur-xl transition-all hover:bg-white/10 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 text-white cursor-pointer shadow-sm"
                value={lang}
                onChange={(e) => setLang(e.target.value as AppLanguage)}
                aria-label={t("settings.language")}
              >
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
                <option value="bn">বাংলা</option>
                <option value="te">తెలుగు</option>
                <option value="ta">தமிழ்</option>
              </select>
              <Languages className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              className="group relative inline-flex h-10 items-center gap-2 overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-4 text-xs font-bold text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)] transition-all hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]"
              onClick={() => setSparkOpen(true)}
            >
              <div className="absolute inset-0 bg-amber-500/20 opacity-0 transition-opacity group-hover:opacity-100" />
              <Sparkles className="relative z-10 size-4 text-amber-500" />
              <span className="relative z-10 hidden sm:inline">Spark AI</span>
            </motion.button>

            {(!role || can(role, "notifications.view")) && (
              <Link
                to="/notifications"
                className="relative flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl transition-all hover:bg-white/10 hover:shadow-md"
                aria-label={t("nav.notifications")}
              >
                <Bell className="size-4.5 text-zinc-300" />
                <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-black animate-pulse" />
              </Link>
            )}
            
            <div className="hidden md:block">
              <div className="h-10 w-10 overflow-hidden rounded-xl border border-white/10 shadow-sm transition-transform hover:scale-105">
                <UserButton />
              </div>
            </div>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <main 
          id="vendor-main-scroll" 
          className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-24 pt-4 md:px-8 md:pb-8"
        >
          <div className="mx-auto max-w-7xl">
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: !scrolled ? 1 : 0.3, y: 0 }}
              className="mb-6 font-display text-4xl font-extrabold tracking-tight md:block hidden text-white"
            >
              {title}
            </motion.h1>
            <h1 className="mb-4 font-display text-3xl font-bold tracking-tight md:hidden">{title}</h1>
            
            <div className="mb-8 space-y-3">
              <OfflineBanner stale={stale} />
              <DataBanner label={dataLabel} />
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                 key={pathname}
                 initial={{ opacity: 0, y: 15 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -15 }}
                 transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                 {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* PREMIUM MOBILE BOTTOM NAVIGATION */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-white/10 bg-[#0a0a0a]/90 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:hidden"
        aria-label="Mobile"
      >
        {mobilePrimary.map((item) => (
          <MobileNavLink 
            key={item.to} 
            to={item.to} 
            icon={item.icon} 
            label={t(item.key)} 
            active={pathname.startsWith(item.to)} 
          />
        ))}
        <MobileNavLink 
          to="/more" 
          icon={MoreHorizontal} 
          label={t("nav.more")} 
          active={pathname === "/more" || more.some((m) => pathname.startsWith(m.to))} 
        />
      </nav>

      <OrderKingSparkModal isOpen={sparkOpen} onClose={() => setSparkOpen(false)} />
    </div>
  );
}

function NavLink({
  to,
  active,
  icon: Icon,
  children,
}: {
  to: string;
  active: boolean;
  icon: typeof Home;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group relative flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm font-semibold transition-all duration-300",
        active 
          ? "bg-fuchsia-600 text-white shadow-[0_4px_20px_rgba(217,70,239,0.4)]" 
          : "text-zinc-400 hover:bg-white/5 hover:text-white",
      )}
    >
      <Icon className={cn("size-5 transition-transform duration-300", active ? "scale-110" : "group-hover:scale-110")} />
      <span>{children}</span>
      {active && (
        <motion.div 
          layoutId="active-nav-indicator"
          className="absolute -left-1.5 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.5)]" 
        />
      )}
    </Link>
  );
}

function MobileNavLink({
  to,
  icon: Icon,
  label,
  active
}: {
  to: string;
  icon: typeof Home;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className="group flex min-h-14 flex-col items-center justify-center gap-1 no-underline"
    >
      <div className={cn(
        "flex items-center justify-center rounded-xl p-2 transition-all duration-300",
        active ? "bg-fuchsia-600 text-white scale-110 shadow-[0_4px_15px_rgba(217,70,239,0.4)]" : "text-zinc-400"
      )}>
        <Icon className="size-[22px]" strokeWidth={active ? 2.5 : 2} />
      </div>
      <span className={cn(
        "text-[10px] font-semibold tracking-wide transition-all",
        active ? "text-fuchsia-400" : "text-zinc-500"
      )}>
        {label}
      </span>
    </Link>
  );
}
