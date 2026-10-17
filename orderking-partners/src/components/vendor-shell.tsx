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
  CalendarDays,
  Flame,
} from "lucide-react";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useClientState } from "@/lib/client-state";
import { can, type Permission } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { useKitchenRushStore } from "@/lib/orders/kitchen-rush";
import { DataBanner } from "./data-banner";
import { OfflineBanner } from "./offline-banner";
import { OrderKingMark } from "./mark";
import { useT } from "./use-t";
import { useVendor } from "./use-vendor";
import { useState, useEffect, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listOrders } from "@/lib/server/api-orders";
import { supabaseCloud } from "@/lib/db-cloud";
import { OrderKingSparkModal } from "./ai/order-king-spark-modal";
import { PartnerFloatingBottomNav } from "./navigation/partner-bottom-nav";
import { OutletStatusPill } from "./outlet/outlet-status-pill";
import { useMerchantBranding } from "@orderking/ui";
import type { AppLanguage } from "@/lib/platform-config";
import { INDIAN_LANGUAGE_CATALOG } from "@/lib/i18n";

export const PRIMARY_NAV = [
  { to: "/dashboard", key: "nav.home", icon: Home, perm: "dashboard.view" as Permission },
  { to: "/orders", key: "nav.orders", icon: ClipboardList, perm: "orders.view" as Permission },
  { to: "/kitchen", key: "nav.kitchen", icon: ChefHat, perm: "kitchen.view" as Permission },
  { to: "/dining", key: "nav.dining", icon: CalendarDays, perm: "orders.view" as Permission },
  { to: "/menu", key: "nav.menu", icon: UtensilsCrossed, perm: "menu.view" as Permission },
  { to: "/settlements", key: "nav.settlements", icon: Wallet, perm: "settlements.view" as Permission },
] as const;

export const MORE_NAV = [
  { to: "/promotions", key: "nav.promotions", icon: Tag, perm: "promotions.view" as Permission },
  { to: "/analytics", key: "nav.analytics", icon: LineChart, perm: "analytics.view" as Permission },
  { to: "/reviews", key: "nav.reviews", icon: Star, perm: "reviews.view" as Permission },
  { to: "/hours", key: "nav.hours", icon: Clock3, perm: "hours.edit" as Permission },
  { to: "/assistant", key: "nav.assistant", icon: Sparkles, perm: "assistant.use" as Permission },
  { to: "/notifications", key: "nav.notifications", icon: Bell, perm: "notifications.view" as Permission },
  { to: "/onboarding", key: "nav.onboarding", icon: Store, perm: "onboarding.edit" as Permission },
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
  const branding = useMerchantBranding();
  const { user, isPending } = useCurrentUserState();
  const vendor = useVendor();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lang = useClientState((s) => s.lang);
  const setLang = useClientState((s) => s.setLang);
  const setRestaurantId = useClientState((s) => s.setRestaurantId);
  const role = vendor.role;
  const primary = PRIMARY_NAV.filter((item) => !role || can(role, item.perm));
  const more = MORE_NAV.filter((item) => !role || can(role, item.perm));
  const [sparkOpen, setSparkOpen] = useState(false);

  const liveOrdersQ = useQuery({
    queryKey: ["orders", vendor.restaurantId, "live"],
    queryFn: () => listOrders({ data: { restaurantId: vendor.restaurantId, scope: "live" } }),
    enabled: Boolean(vendor.restaurantId),
    refetchInterval: 8000,
  });
  const pendingOrdersCount = (liveOrdersQ.data?.orders ?? []).filter(
    (o: any) => ["PLACED", "PENDING"].includes(String(o.state))
  ).length;

  useEffect(() => {
    if (!vendor.restaurantId) return;
    const channel = supabaseCloud
      .channel(`vendor-shell-orders-${vendor.restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${vendor.restaurantId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: ["orders"] });
          void qc.invalidateQueries({ queryKey: ["dashboard"] });
        }
      )
      .subscribe();

    return () => {
      void supabaseCloud.removeChannel(channel);
    };
  }, [vendor.restaurantId, qc]);

  if (isPending) {
    return (
      <div className="min-h-dvh bg-slate-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950 p-6">
        <div className="mx-auto max-w-md space-y-3">
          <div className="font-display text-xl text-slate-50">{branding.appName || t("app.name")}</div>
          <div className="h-10 w-40 animate-pulse rounded-full bg-line" />
          <div className="h-32 animate-pulse rounded-[24px] bg-line" />
          <div className="h-32 animate-pulse rounded-[24px] bg-line" />
        </div>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  return (
    <div className="min-h-dvh bg-slate-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950 text-slate-50 break-words text-wrap">
      <div className="mx-auto flex min-h-dvh max-w-6xl">
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-slate-800/60 p-4 md:flex">
          <div className="mb-6 flex items-center gap-2">
            <OrderKingMark className="size-8 text-chili" />
            <div>
              <div className="font-display text-base leading-tight">{branding.appName || t("app.name")}</div>
              <div className="text-xs text-slate-400">{restaurantName ?? (branding.tagline || t("app.tagline"))}</div>
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto scrollbar-none" aria-label="Partner Navigation">
            <div className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Live Service
            </div>
            {primary.map((item) => (
              <NavLink key={item.to} to={item.to} active={pathname.startsWith(item.to)} icon={item.icon}>
                {t(item.key)}
              </NavLink>
            ))}
            <div className="my-2.5 h-px bg-slate-800/60" />
            <div className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Restaurant Management
            </div>
            {more.map((item) => (
              <NavLink key={item.to} to={item.to} active={pathname.startsWith(item.to)} icon={item.icon}>
                {t(item.key)}
              </NavLink>
            ))}
          </nav>
          <UserButton />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col pb-24 md:pb-0">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-800/60 bg-slate-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950 px-4 py-3 md:px-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 md:hidden">
                <OrderKingMark className="size-7 shrink-0 text-chili" />
                <span className="truncate font-display text-lg">{restaurantName ?? (branding.appName || t("app.name"))}</span>
              </div>
              <h1 className="hidden font-display text-2xl md:block">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Restaurant Outlet Location Switcher */}
              {vendor.memberships.length > 0 && (
                <div className="relative">
                  <select
                    className="h-11 appearance-none rounded-[12px] border border-emerald-500/30 bg-emerald-950/40 backdrop-blur-xl pl-8 pr-7 text-xs font-semibold text-emerald-300 outline-none transition-colors hover:bg-emerald-900/50 hover:border-emerald-500/60 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 max-w-[140px] sm:max-w-[200px] truncate cursor-pointer"
                    value={vendor.restaurantId ?? ""}
                    onChange={(e) => {
                      const newId = e.target.value;
                      if (newId && newId !== vendor.restaurantId) {
                        setRestaurantId(newId);
                        void qc.invalidateQueries();
                      }
                    }}
                    title="Switch Restaurant Location"
                    aria-label="Switch Restaurant Location"
                  >
                    {vendor.memberships.map((m: any) => (
                      <option key={m.restaurantId} value={m.restaurantId} className="bg-slate-900 text-slate-100">
                        {m.restaurantName} ({m.role})
                      </option>
                    ))}
                  </select>
                  <Store className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-emerald-400" />
                </div>
              )}
              <div className="relative">
                <select
                  className="h-11 appearance-none rounded-[12px] border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl pl-9 pr-8 text-xs sm:text-sm outline-none transition-colors hover:bg-slate-800/60 focus:border-chili focus:ring-1 focus:ring-chili"
                  value={lang}
                  onChange={(e) => setLang(e.target.value as AppLanguage)}
                  aria-label={t("settings.language")}
                  title={t("settings.language") || "Select Language"}
                >
                  {INDIAN_LANGUAGE_CATALOG.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.native} ({item.label})
                    </option>
                  ))}
                </select>
                <Languages className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              </div>
              <button
                type="button"
                className="inline-flex h-11 items-center gap-1.5 rounded-[12px] border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-yellow-500/15 px-3 text-xs font-extrabold text-amber-300 hover:text-amber-200 hover:border-amber-400/60 hover:bg-amber-500/25 transition shadow-sm shadow-amber-500/10 cursor-pointer active:scale-95 shrink-0"
                onClick={() => setSparkOpen(true)}
                title="King AI — Restaurant Culinary & Growth Co-Pilot"
                aria-label="Open King AI Assistant"
              >
                <Sparkles className="size-4 text-amber-400 animate-pulse" />
                <span className="tracking-tight">King AI</span>
              </button>
              {/* Merchant Outlet Emergency Pause / Operational Status Pill */}
              <OutletStatusPill
                restaurantId={vendor.restaurantId}
                restaurantName={restaurantName ?? vendor.selected?.restaurantName}
              />
              {/* Merchant Header Kitchen Rush Mode Toggle */}
              <MerchantHeaderRushToggle />
              {(!role || can(role, "notifications.view")) && (
                <Link
                  to="/notifications"
                  className="grid size-11 place-items-center rounded-[12px] border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl transition-colors hover:bg-slate-800/60 shrink-0"
                  aria-label={t("nav.notifications")}
                  title={t("nav.notifications") || "Alerts & Notifications"}
                >
                  <Bell className="size-4" />
                </Link>
              )}
              <div className="hidden md:block">
                <UserButton />
              </div>
            </div>
          </header>

          <main className="flex-1 space-y-4 px-4 py-4 md:px-6">
            <h1 className="font-display text-2xl md:hidden">{title}</h1>
            <div className="space-y-3">
              <OfflineBanner stale={stale} />
              <DataBanner label={dataLabel} />
            </div>
            {children}
          </main>
        </div>
      </div>

      {/* ULTRA-LUXURIOUS FLOATING DOCKED BOTTOM NAVIGATION */}
      <PartnerFloatingBottomNav
        onOpenSpark={() => setSparkOpen(true)}
        pendingOrdersCount={pendingOrdersCount}
      />

      {/* Order King Spark Restaurant AI Modal */}
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
        "flex min-h-11 items-center gap-2 rounded-[12px] px-3 text-sm font-medium transition-colors",
        active ? "bg-chili-soft text-chili-dark font-semibold" : "text-slate-400 hover:bg-slate-800/60 backdrop-blur-xl hover:text-slate-50",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{children}</span>
    </Link>
  );
}

function MerchantHeaderRushToggle() {
  const rush = useKitchenRushStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex h-11 items-center gap-1.5 rounded-[12px] px-3 text-xs font-bold transition shadow-sm cursor-pointer select-none ${
          rush.isActive
            ? "border border-rose-500 bg-rose-500/20 text-rose-300 ring-2 ring-rose-500/40 animate-pulse"
            : "border border-slate-800/60 bg-slate-900/60 text-slate-300 hover:border-amber-500/50 hover:text-amber-300"
        }`}
        title={
          rush.isActive
            ? `Kitchen Rush Mode Active (+${rush.bufferMinutes}m Prep Buffer)`
            : "Activate Kitchen Rush Mode (+10m / +15m)"
        }
        aria-label="Toggle Kitchen Rush Mode"
      >
        <Flame
          className={`size-4 ${rush.isActive ? "text-rose-400 animate-bounce" : "text-amber-400"}`}
        />
        <span className="hidden sm:inline">
          {rush.isActive ? `Rush (+${rush.bufferMinutes}m)` : "Rush Mode"}
        </span>
        <span className="sm:hidden font-mono">
          {rush.isActive ? `+${rush.bufferMinutes}m` : "Rush"}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl text-slate-100 font-sans space-y-1.5 animate-in fade-in duration-100">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Kitchen Rush Buffer</span>
            <span className={rush.isActive ? "text-rose-400 font-mono font-bold" : "text-slate-500"}>
              {rush.isActive ? `+${rush.bufferMinutes}M ACTIVE` : "OFF"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              rush.activate(10);
              setOpen(false);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              rush.isActive && rush.bufferMinutes === 10
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold"
                : "hover:bg-slate-800 text-slate-300"
            }`}
          >
            <span>+10 Mins Prep Buffer</span>
            {rush.isActive && rush.bufferMinutes === 10 && (
              <span className="text-[10px] text-amber-400 font-mono">● Active</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              rush.activate(15);
              setOpen(false);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              rush.isActive && rush.bufferMinutes === 15
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/50 font-bold"
                : "hover:bg-slate-800 text-slate-300"
            }`}
          >
            <span>+15 Mins Prep Buffer</span>
            {rush.isActive && rush.bufferMinutes === 15 && (
              <span className="text-[10px] text-rose-400 font-mono">● Active</span>
            )}
          </button>

          {rush.isActive && (
            <button
              type="button"
              onClick={() => {
                rush.deactivate();
                setOpen(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition mt-1 cursor-pointer"
            >
              Turn Off Rush Mode
            </button>
          )}
        </div>
      )}
    </div>
  );
}

