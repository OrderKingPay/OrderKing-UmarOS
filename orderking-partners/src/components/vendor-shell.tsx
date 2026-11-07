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
  GraduationCap,
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
  { to: "/orders", key: "nav.orders", icon: ClipboardList, perm: "orders.view" as Permission },
  { to: "/kds", key: "nav.kitchen", icon: ChefHat, perm: "kitchen.view" as Permission },
  { to: "/menu", key: "nav.menu", icon: UtensilsCrossed, perm: "menu.view" as Permission },
  { to: "/settlements", key: "nav.settlements", icon: Wallet, perm: "settlements.view" as Permission },
  { to: "/more", key: "nav.more", icon: MoreHorizontal, perm: "dashboard.view" as Permission },
] as const;

export const MORE_NAV = [
  { to: "/dashboard", key: "nav.home", icon: Home, perm: "dashboard.view" as Permission },
  { to: "/dining", key: "nav.dining", icon: CalendarDays, perm: "orders.view" as Permission },
  { to: "/promotions", key: "nav.promotions", icon: Tag, perm: "promotions.view" as Permission },
  { to: "/analytics", key: "nav.analytics", icon: LineChart, perm: "analytics.view" as Permission },
  { to: "/reviews", key: "nav.reviews", icon: Star, perm: "reviews.view" as Permission },
  { to: "/hours", key: "nav.hours", icon: Clock3, perm: "hours.edit" as Permission },
  { to: "/academy", key: "nav.academy", icon: GraduationCap, perm: "dashboard.view" as Permission },
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
      <div className="min-h-dvh bg-[#F4F5F7] p-6 text-gray-900 font-sans">
        <div className="mx-auto max-w-md space-y-3">
          <div className="font-display text-xl text-gray-900">{branding.appName || t("app.name")}</div>
          <div className="h-10 w-40 animate-pulse rounded-full bg-gray-200" />
          <div className="h-32 animate-pulse rounded-2xl bg-gray-200" />
          <div className="h-32 animate-pulse rounded-2xl bg-gray-200" />
        </div>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  return (
    <div className="min-h-dvh bg-[#F4F5F7] text-gray-900 font-sans">
      <div className="mx-auto flex min-h-dvh max-w-7xl">
        {/* Left Navigation Sidebar */}
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-gray-200 bg-white p-4 md:flex shadow-xs">
          <div className="mb-6 flex items-center gap-3 px-2">
            <OrderKingMark className="size-8 text-[#E23744]" />
            <div>
              <div className="font-display text-lg font-black leading-tight text-gray-900">
                {branding.appName || t("app.name")}
              </div>
              <div className="text-xs text-gray-500 truncate max-w-[150px]">
                {restaurantName ?? (branding.tagline || t("app.tagline"))}
              </div>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto scrollbar-none" aria-label="Partner Navigation">
            <div className="px-3 pt-1 pb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Live Operations
            </div>
            {primary.map((item) => (
              <NavLink key={item.to} to={item.to} active={pathname.startsWith(item.to)} icon={item.icon}>
                {t(item.key)}
              </NavLink>
            ))}
            <div className="my-2.5 h-px bg-gray-100" />
            <div className="px-3 pt-1 pb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Restaurant Management
            </div>
            {more.map((item) => (
              <NavLink key={item.to} to={item.to} active={pathname.startsWith(item.to)} icon={item.icon}>
                {t(item.key)}
              </NavLink>
            ))}
          </nav>
          <div className="pt-3 border-t border-gray-100">
            <UserButton />
          </div>
        </aside>

        {/* Main Content Viewport */}
        <div className="flex min-w-0 flex-1 flex-col pb-24 md:pb-0">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-gray-200 bg-white/95 backdrop-blur-md px-4 py-3 md:px-6 shadow-xs">
            <div className="flex items-center gap-3 min-w-[200px] max-w-[420px] shrink-0">
              <div className="flex items-center gap-2 md:hidden">
                <OrderKingMark className="size-7 shrink-0 text-[#E23744]" />
                <span className="truncate font-display text-base font-bold text-gray-900">
                  {restaurantName || "Restaurant Partner"}
                </span>
              </div>
              <div className="hidden md:flex flex-col min-w-0">
                <h1 className="font-display text-lg lg:text-xl font-black whitespace-nowrap truncate text-gray-900">
                  {title || restaurantName || "Restaurant Partner Console"}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink min-w-0 overflow-x-auto scrollbar-none">
              {/* Restaurant Outlet Location Switcher */}
              {vendor.memberships.length > 0 && (
                <div className="relative">
                  <select
                    className="h-11 appearance-none rounded-xl border border-gray-200 bg-gray-50 pl-8 pr-7 text-xs font-semibold text-gray-800 outline-none transition-colors hover:bg-gray-100 focus:border-[#E23744] focus:ring-1 focus:ring-[#E23744] max-w-[140px] sm:max-w-[200px] truncate cursor-pointer"
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
                      <option key={m.restaurantId} value={m.restaurantId} className="bg-white text-gray-900">
                        {m.restaurantName || "Outlet"} ({m.role})
                      </option>
                    ))}
                  </select>
                  <Store className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-500" />
                </div>
              )}

              {/* Language Switcher */}
              <div className="relative">
                <select
                  className="h-11 appearance-none rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-8 text-xs sm:text-sm text-gray-800 outline-none transition-colors hover:bg-gray-100 focus:border-[#E23744] focus:ring-1 focus:ring-[#E23744]"
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
                <Languages className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
              </div>

              {/* Assistant Button */}
              <button
                type="button"
                className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition shadow-xs cursor-pointer active:scale-95 shrink-0"
                onClick={() => setSparkOpen(true)}
                title="Restaurant Partner Assistant"
                aria-label="Open Partner Assistant"
              >
                <Sparkles className="size-4 text-gray-500" />
                <span className="tracking-tight">Assistant</span>
              </button>

              {/* Outlet Online / Offline / Paused Toggle Pill */}
              <OutletStatusPill
                restaurantId={vendor.restaurantId}
                restaurantName={restaurantName ?? vendor.selected?.restaurantName}
              />

              {/* Kitchen Rush Mode Toggle */}
              <MerchantHeaderRushToggle />

              {/* Notifications */}
              {(!role || can(role, "notifications.view")) && (
                <Link
                  to="/notifications"
                  className="grid size-11 place-items-center rounded-xl border border-gray-200 bg-gray-50 transition-colors hover:bg-gray-100 shrink-0 text-gray-700"
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

          <main className="flex-1 space-y-4 px-4 py-5 md:px-6">
            <h1 className="font-display text-2xl font-black text-gray-900 md:hidden">{title}</h1>
            <div className="space-y-3">
              <OfflineBanner stale={stale} />
              <DataBanner label={dataLabel} />
            </div>
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Floating Action Button (FAB) for King AI */}
      <button
        type="button"
        onClick={() => setSparkOpen(true)}
        aria-label="Open King AI Assistant"
        title="King AI — Restaurant Culinary & Growth Co-Pilot"
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full border border-amber-400 bg-amber-400 px-4 py-2.5 text-gray-900 font-black shadow-xl transition hover:scale-105 active:scale-95 md:hidden"
      >
        <Sparkles className="size-4 text-gray-900 animate-pulse" />
        <span className="text-xs font-black tracking-tight">King AI</span>
      </button>

      {/* Docked Mobile Bottom Navigation */}
      <PartnerFloatingBottomNav
        onOpenSpark={() => setSparkOpen(true)}
        pendingOrdersCount={pendingOrdersCount}
      />

      {/* King AI Assistant Modal */}
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
        "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors",
        active
          ? "bg-red-50 text-[#E23744] font-bold border-l-4 border-[#E23744]"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
      )}
    >
      <Icon className="size-4.5 shrink-0" />
      <span className="truncate">{children}</span>
    </Link>
  );
}

function MerchantHeaderRushToggle() {
  const rush = useKitchenRushStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative font-sans">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition shadow-xs cursor-pointer select-none ${
          rush.isActive
            ? "border border-rose-300 bg-rose-50 text-rose-800 ring-2 ring-rose-400/30"
            : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
        }`}
        title={
          rush.isActive
            ? `Kitchen Rush Mode Active (+${rush.bufferMinutes}m Prep Buffer)`
            : "Activate Kitchen Rush Mode (+10m / +15m)"
        }
        aria-label="Toggle Kitchen Rush Mode"
      >
        <Flame
          className={`size-4 ${rush.isActive ? "text-rose-600 animate-bounce" : "text-amber-500"}`}
        />
        <span className="hidden sm:inline">
          {rush.isActive ? `Rush (+${rush.bufferMinutes}m)` : "Rush Mode"}
        </span>
        <span className="sm:hidden font-mono">
          {rush.isActive ? `+${rush.bufferMinutes}m` : "Rush"}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-gray-200 bg-white p-2.5 shadow-2xl text-gray-900 font-sans space-y-1.5 animate-in fade-in duration-100">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
            <span>Kitchen Rush Buffer</span>
            <span className={rush.isActive ? "text-rose-600 font-bold" : "text-gray-400"}>
              {rush.isActive ? `+${rush.bufferMinutes}M ACTIVE` : "OFF"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              rush.activate(10);
              setOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              rush.isActive && rush.bufferMinutes === 10
                ? "bg-amber-50 text-amber-900 border border-amber-300 font-bold"
                : "hover:bg-gray-50 text-gray-700"
            }`}
          >
            <span>+10 Mins Prep Buffer</span>
            {rush.isActive && rush.bufferMinutes === 10 && (
              <span className="text-[10px] text-amber-600 font-bold">● Active</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              rush.activate(15);
              setOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              rush.isActive && rush.bufferMinutes === 15
                ? "bg-rose-50 text-rose-900 border border-rose-300 font-bold"
                : "hover:bg-gray-50 text-gray-700"
            }`}
          >
            <span>+15 Mins Prep Buffer</span>
            {rush.isActive && rush.bufferMinutes === 15 && (
              <span className="text-[10px] text-rose-600 font-bold">● Active</span>
            )}
          </button>

          {rush.isActive && (
            <button
              type="button"
              onClick={() => {
                rush.deactivate();
                setOpen(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-800 transition mt-1 cursor-pointer"
            >
              Turn Off Rush Mode
            </button>
          )}
        </div>
      )}
    </div>
  );
}
