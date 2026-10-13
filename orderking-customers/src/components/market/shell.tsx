import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ClipboardList,
  House,
  Search,
  ShoppingBag,
  UserRound,
  Wallet,
  Globe,
  MapPin,
  ChevronDown,
  Compass,
  GraduationCap,
  Plane,
  Briefcase,
  Building2,
  Luggage,
  Sparkles,
  Crown,
} from "lucide-react";
import { useState, useEffect, lazy, Suspense } from "react";
import { Wordmark, OrderKingMark } from "@/components/brand/wordmark";

const LazyLocationDialog = lazy(() =>
  import("@/components/market/location-dialog").then((m) => ({ default: m.LocationDialog }))
);
const LazyLanguageSelectorModal = lazy(() =>
  import("@/components/common/language-selector-modal").then((m) => ({ default: m.LanguageSelectorModal }))
);
const LazyCustomerConciergeDrawer = lazy(() =>
  import("@/components/ai/customer-concierge-drawer").then((m) => ({ default: m.CustomerConciergeDrawer }))
);
import { useBrand, useT } from "@/components/providers";
import { cartCount, useCartStore } from "@/lib/stores/cart";
import { useLocationStore } from "@/lib/stores/location";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { cn } from "@/lib/utils";
import { DeviceAvatar } from "@/components/common/device-avatar";
import { isDeliveryActiveInLocation } from "@/lib/geo/geofence-guard";
import { formatPaise } from "@/lib/money";

export function CustomerShell({
  children,
  onSearch,
}: {
  children: React.ReactNode;
  onSearch?: () => void;
}) {
  const { t, lang, setLang } = useT();
  const { brand } = useBrand();
  const location = useLocationStore((s) => s.location);
  const isDeliveryActive = isDeliveryActiveInLocation(location.lat, location.lng, location.cityId);
  const items = useCartStore((s) => s.items);
  const count = cartCount(items);
  const cartSubtotal = useCartStore((s) =>
    s.items.reduce((acc, it) => acc + (it.variantId ? 0 : 0) + it.quantity * 100, 0)
  );
  const path = useRouterState({ select: (s) => s.location.pathname });
  const currentHash = useRouterState({ select: (s) => s.location.hash });
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [locOpen, setLocOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [conciergeOpen, setConciergeOpen] = useState(false);

  useEffect(() => {
    // Strictly enforce light mode in DOM
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.backgroundColor = "#FFFFFF";
      document.documentElement.style.colorScheme = "light";
    }
  }, []);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-white text-gray-900 pb-20 md:max-w-5xl">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:bg-white focus:px-3 focus:py-2 focus:text-black focus:shadow-md"
      >
        {t("a11y.skip")}
      </a>

      {/* Pristine Zomato-style Light Mode Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 pt-[max(0.6rem,env(safe-area-inset-top))] pb-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between gap-2">
          {/* Location Picker */}
          <button
            type="button"
            onClick={() => setLocOpen(true)}
            className="flex items-center gap-2 text-left group min-w-0 max-w-[65%]"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-[#E23744]">
              <MapPin className="size-5 text-[#E23744]" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-sm sm:text-base text-gray-900 tracking-tight truncate group-hover:text-[#E23744] transition-colors">
                  {location.cityName || location.zoneName || "Current Location"}
                </span>
                <ChevronDown className="size-3.5 text-gray-400 group-hover:text-[#E23744] shrink-0" />
              </div>
              <span className="text-[11px] text-gray-500 font-medium truncate">
                {location.label || location.line1 || "Select delivery location"}
              </span>
            </div>
          </button>

          {/* Right Header Utilities: Crown Wallet immediately left of Profile/Sign-in at far right */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Crown Wallet Entry (opens separated Verified vs Promotional Credits view) */}
            <Link
              to="/earn"
              className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full bg-gradient-to-r from-amber-500/10 via-amber-400/20 to-yellow-500/10 border border-amber-400/70 text-amber-950 text-xs font-black shadow-xs hover:border-amber-500 hover:shadow-amber-500/20 transition active:scale-95 no-underline group"
              title="Crown Wallet & Promotional Credits"
            >
              <Crown className="size-4 shrink-0 text-amber-800" aria-hidden />
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="text-[11px] font-black tracking-tight text-amber-950">Crown Wallet</span>
                <span className="text-[9px] font-semibold text-emerald-900">Cash unverified · Credits inactive</span>
              </span>
            </Link>

            {/* Profile & Sign-In strictly at far right */}
            {isPending ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
            ) : user ? (
              <Link
                to="/account"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:ring-2 hover:ring-amber-400 transition no-underline text-gray-900"
                title="Your Profile & Account"
              >
                <DeviceAvatar userId={user.id} name={user.displayName} />
                <span className="text-xs font-bold text-gray-800 hidden sm:inline">Profile</span>
              </Link>
            ) : (
              <SignedOut>
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 rounded-full border border-amber-400/70 bg-gradient-to-r from-emerald-950 to-slate-900 px-3 py-1.5 text-amber-200 shadow-sm no-underline transition hover:border-amber-300 hover:shadow-md"
                  aria-label="Sign in or join OrderKing"
                >
                  <Crown className="size-4 shrink-0" aria-hidden />
                  <span className="text-[11px] font-black">Join</span>
                </Link>
              </SignedOut>
            )}
          </div>
        </div>

        {path === "/" && (
          <button type="button" onClick={() => setConciergeOpen(true)}
            aria-label="Open OrderKing AI Concierge"
            className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-950 px-3 py-2.5 text-left text-white shadow-sm transition hover:border-amber-400 hover:shadow-md">
            <OrderKingMark className="size-10" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold tracking-tight text-amber-200">OrderKing</span>
              <span className="block truncate text-[11px] text-emerald-100">Tap for AI concierge &amp; delivery support</span>
            </span>
            <Sparkles className="size-5 text-amber-300" aria-hidden />
          </button>
        )}

        {/* Food search is shown only in Delivery; each other service has its own search. */}
        {path !== "/search" && !["/tutor", "/travel", "/orders", "/support", "/earn"].some((prefix) => path.startsWith(prefix)) && (
          <div className="mt-2.5">
            <button
              type="button"
              onClick={() => (onSearch ? onSearch() : void navigate({ to: "/search" }))}
              className="w-full flex h-11 items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-white hover:border-gray-300 px-3.5 text-left text-gray-400 transition-all shadow-xs"
            >
              <Search className="size-4 shrink-0 text-[#E23744]" aria-hidden />
              <span className="text-xs sm:text-sm text-gray-500 font-medium truncate">
                Restaurant name, cuisine, or a dish...
              </span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main id="main" className="flex-1 w-full">
        {children}
      </main>

      {/* Floating View Cart Bar */}
      {isDeliveryActive && count > 0 && path !== "/cart" && path !== "/checkout" ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-16 z-40 flex justify-center px-4">
          <Link
            to="/cart"
            className="pointer-events-auto flex min-h-12 w-full max-w-lg items-center justify-between rounded-xl bg-[#E23744] hover:bg-[#c92f3b] px-4 py-3 text-white no-underline shadow-xl transition-all active:scale-98 md:max-w-2xl font-bold"
          >
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-white/20 text-xs font-extrabold">
                {count}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-white/90">
                {count === 1 ? t("cart.item") : t("cart.items")} added
              </span>
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-bold">
              <ShoppingBag className="size-4" aria-hidden />
              {t("cart.view")}
            </span>
          </Link>
        </div>
      ) : null}

      {/* ULTRA-LUXURIOUS STICKY BOTTOM NAVIGATION BAR */}
      <nav
        aria-label={brand.appName}
        className="fixed bottom-0 left-0 right-0 w-full z-50 bg-white/95 backdrop-blur-2xl border-t border-slate-200/80 shadow-[0_-12px_40px_rgba(0,0,0,0.08)] pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        {/* Subtle Luxury Top Accent Beam */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent pointer-events-none" />

        <ul className="mx-auto grid max-w-lg grid-cols-5 items-end justify-items-center relative px-2 pt-2">
          {/* 1. Delivery — food ordering is the primary destination */}
          <NavItem to="/" icon={House} label="Delivery" active={path === "/"} />

          {/* 2. Tutor & Jobs */}
          <NavItem to="/tutor" icon={GraduationCap} label="Tutor & Jobs" active={path.startsWith("/tutor")} />

          {/* 3. King Pay / OrderKing */}
          <KingPayCenterItem
            active={path.startsWith("/king-pay")}
            isKingPayPage={false}
          />

          {/* 4. Travel */}
          <NavItem to="/travel" icon={Plane} label="Travel" active={path.startsWith("/travel")} />

          {/* 5. Contextual action: show food orders in Delivery, Jobs in Tutor, Hotels in Travel, AI Support in Support */}
          {path.startsWith("/tutor") ? (
            <NavItem to="/tutor" hash="jobs" icon={Briefcase} label="Jobs" active={currentHash.replace(/^#/, "") === "jobs"} />
          ) : path.startsWith("/travel") ? (
            <NavItem to="/travel/trips" icon={Luggage} label="My Trips" active={path.startsWith("/travel/trips")} />
          ) : path.startsWith("/support") ? (
            <NavItem to="/support" icon={ClipboardList} label="AI Support" active={path.startsWith("/support")} />
          ) : (
            <NavItem to="/orders" icon={ClipboardList} label="Orders" active={path.startsWith("/orders")} />
          )}
        </ul>
      </nav>

      {conciergeOpen && (
        <Suspense fallback={null}>
          <LazyCustomerConciergeDrawer open={conciergeOpen} onClose={() => setConciergeOpen(false)} area="food" />
        </Suspense>
      )}
      {locOpen ? (
        <Suspense fallback={null}>
          <LazyLocationDialog open={locOpen} onOpenChange={setLocOpen} />
        </Suspense>
      ) : null}
      {langOpen ? (
        <Suspense fallback={null}>
          <LazyLanguageSelectorModal
            isOpen={langOpen}
            onClose={() => setLangOpen(false)}
            selectedCode={lang}
            onSelectLanguage={(l) => {
              setLang(l.code as any);
            }}
          />
        </Suspense>
      ) : null}
    </div>
  );
}

function KingPayCenterItem({ active, isKingPayPage }: { active: boolean; isKingPayPage: boolean }) {
  if (isKingPayPage) {
    return (
      <li className="w-full flex justify-center">
        <Link
          to="/"
          className="flex flex-col items-center justify-center no-underline relative transition-all -mt-4 sm:-mt-5 group"
          title="Back to Food Delivery"
        >
          <div className="relative p-[2.5px] rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-300 to-yellow-200 shadow-[0_6px_20px_rgba(245,158,11,0.45)] transition-all duration-300 group-hover:scale-105 group-active:scale-95">
            <div className="flex size-11 sm:size-12 items-center justify-center rounded-[13px] bg-gradient-to-b from-gray-950 via-slate-900 to-black text-amber-300 shadow-inner">
              <span className="text-xl sm:text-2xl filter drop-shadow-[0_2px_6px_rgba(245,158,11,0.6)]">
                🍔
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center mt-1">
            <span className="text-[10px] sm:text-[11px] font-black tracking-tight text-amber-900 flex items-center gap-0.5 group-hover:text-amber-700">
              OrderKing
            </span>
          </div>
        </Link>
      </li>
    );
  }

  return (
    <li className="w-full flex justify-center">
      <Link
        to="/king-pay"
        className="flex flex-col items-center justify-center no-underline relative transition-all -mt-4 sm:-mt-5 group"
        title="Open KingPay"
      >
        <div
          className={cn(
            "relative p-[2.5px] rounded-2xl transition-all duration-300 shadow-md",
            active
              ? "bg-gradient-to-tr from-amber-500 via-amber-300 to-yellow-200 shadow-amber-500/40 scale-105"
              : "bg-gradient-to-tr from-amber-400/90 via-amber-200/90 to-yellow-100 shadow-amber-500/20 group-hover:scale-105 group-hover:shadow-amber-500/35"
          )}
        >
          <div className="flex size-11 sm:size-12 items-center justify-center rounded-[13px] bg-gradient-to-b from-gray-950 via-slate-900 to-black text-amber-300 shadow-inner">
            <span className="text-xl sm:text-2xl filter drop-shadow-[0_2px_6px_rgba(245,158,11,0.6)]">
              👑
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center mt-1">
          <span
            className={cn(
              "text-[10px] sm:text-[11px] font-black tracking-tight transition-colors",
              active ? "text-amber-800" : "text-amber-900/80 group-hover:text-amber-700"
            )}
          >
            King Pay
          </span>
          {active && <span className="size-1 rounded-full bg-amber-500 mt-0.5 shadow-xs" />}
        </div>
      </Link>
    </li>
  );
}

function NavItem({
  to,
  hash,
  icon: Icon,
  label,
  active,
  badge,
}: {
  to: string;
  hash?: string;
  icon: typeof House;
  label: string;
  active: boolean;
  badge?: number | string;
}) {
  return (
    <li className="w-full flex justify-center">
      <Link
        to={to}
        hash={hash}
        className={cn(
          "flex flex-col items-center justify-center gap-0.5 text-[10px] sm:text-[11px] no-underline relative transition-all py-1 w-full group",
          active
            ? "text-[#E23744] font-black"
            : "text-slate-500 hover:text-slate-900 font-semibold"
        )}
      >
        <div
          className={cn(
            "relative flex items-center justify-center size-8 sm:size-8.5 rounded-xl transition-all duration-200",
            active
              ? "bg-red-50 text-[#E23744] shadow-xs"
              : "text-slate-500 group-hover:text-slate-800 group-hover:bg-slate-50"
          )}
        >
          <Icon
            className={cn(
              "size-5 transition-transform duration-200",
              active ? "scale-110 stroke-[2.4]" : "stroke-[1.8] group-hover:scale-105"
            )}
            aria-hidden
          />
          {badge !== undefined && (
            <span className="absolute -right-1 -top-1 flex min-h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber-400 px-1 text-[8px] font-extrabold text-black shadow-xs">
              {badge}
            </span>
          )}
        </div>
        <div className="flex flex-col items-center">
          <span className="text-center truncate w-full px-0.5 tracking-tight leading-none mt-0.5">
            {label}
          </span>
          {active && <span className="size-1 rounded-full bg-[#E23744] mt-1 shadow-xs" />}
        </div>
      </Link>
    </li>
  );
}
