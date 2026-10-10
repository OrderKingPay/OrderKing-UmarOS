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
} from "lucide-react";
import { useState, useEffect, lazy, Suspense } from "react";
import { Wordmark } from "@/components/brand/wordmark";

const LazyLocationDialog = lazy(() =>
  import("@/components/market/location-dialog").then((m) => ({ default: m.LocationDialog }))
);
const LazyLanguageSelectorModal = lazy(() =>
  import("@/components/common/language-selector-modal").then((m) => ({ default: m.LanguageSelectorModal }))
);
import { useBrand, useT } from "@/components/providers";
import { cartCount, useCartStore } from "@/lib/stores/cart";
import { useLocationStore } from "@/lib/stores/location";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { cn } from "@/lib/utils";
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
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [locOpen, setLocOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

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

          {/* Right Header Utilities: Language, Pay & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              to="/king-pay"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold shadow-xs hover:bg-amber-100 transition active:scale-95 no-underline"
              title="King Pay"
            >
              <span>👑</span>
              <span className="hidden sm:inline text-[11px]">Pay</span>
            </Link>

            <button
              type="button"
              onClick={() => setLangOpen(true)}
              className="flex size-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition"
              aria-label="Change Language"
            >
              <Globe className="h-4 w-4" />
            </button>

            {isPending ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
            ) : user ? (
              <SignedIn>
                <UserButton />
              </SignedIn>
            ) : (
              <SignedOut>
                <Link
                  to="/login"
                  className="rounded-full bg-[#E23744] hover:bg-[#c92f3b] text-white px-3 py-1 text-xs font-bold transition shadow-xs no-underline"
                >
                  {t("common.signIn")}
                </Link>
              </SignedOut>
            )}
          </div>
        </div>

        {/* Clean Zomato Search Bar */}
        {path !== "/search" && (
          <div className="mt-2.5">
            <button
              type="button"
              onClick={() => (onSearch ? onSearch() : void navigate({ to: "/search" }))}
              className="w-full flex h-11 items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-white hover:border-gray-300 px-3.5 text-left text-gray-400 transition-all shadow-xs"
            >
              <Search className="size-4 shrink-0 text-[#E23744]" aria-hidden />
              <span className="text-xs sm:text-sm text-gray-500 font-medium truncate">
                {isDeliveryActive ? "Restaurant name, cuisine, or a dish..." : "Search payments..."}
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

      {/* STRICTLY FIXED BOTTOM NAVIGATION BAR */}
      <nav
        aria-label={brand.appName}
        className="fixed bottom-0 left-0 right-0 w-full z-50 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5 items-center justify-items-center relative px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <NavItem to="/" icon={House} label="Delivery" active={path === "/"} />
          <NavItem to="/search" icon={Compass} label="Dining" active={path.startsWith("/search")} />
          <NavItem to="/king-pay" icon={Wallet} label="King Pay" active={path.startsWith("/king-pay")} badge="👑" />
          <NavItem to="/orders" icon={ClipboardList} label="Orders" active={path.startsWith("/orders")} />
          <NavItem to="/account" icon={UserRound} label="Profile" active={path.startsWith("/account")} />
        </ul>
      </nav>

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

function NavItem({
  to,
  icon: Icon,
  label,
  active,
  badge,
}: {
  to: string;
  icon: typeof House;
  label: string;
  active: boolean;
  badge?: number | string;
}) {
  return (
    <li className="w-full flex justify-center">
      <Link
        to={to}
        className={cn(
          "flex flex-col items-center justify-center gap-0.5 text-[11px] no-underline relative transition-all py-1 w-full",
          active
            ? "text-[#E23744] font-extrabold scale-105"
            : "text-gray-500 hover:text-gray-900 font-medium"
        )}
      >
        <div className="relative flex items-center justify-center h-6 w-6">
          <Icon
            className={cn("size-5 transition-transform", active ? "scale-110 stroke-[2.4]" : "stroke-[1.8]")}
            aria-hidden
          />
          {badge !== undefined && (
            <span className="absolute -right-2.5 -top-1.5 flex min-h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber-400 px-1 text-[8px] font-bold text-black shadow-xs">
              {badge}
            </span>
          )}
        </div>
        <span className="text-center truncate w-full px-0.5 tracking-tight">{label}</span>
      </Link>
    </li>
  );
}
