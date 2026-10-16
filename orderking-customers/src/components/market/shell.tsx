import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Search,
  ShoppingBag,
  MapPin,
  ChevronDown,
  Crown,
  Gift,
  Mic,
} from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { OrderKingMark } from "@/components/brand/wordmark";
import { resilientLazy, ModalErrorBoundary } from "@/components/common/resilient-lazy";
import { ErrorBoundary } from "@/components/error-boundary";

const LazyLocationDialog = resilientLazy(
  () => import("@/components/market/location-dialog").then((m) => ({ default: m.LocationDialog })),
  "Location Selector"
);
const LazyLanguageSelectorModal = resilientLazy(
  () => import("@/components/common/language-selector-modal").then((m) => ({ default: m.LanguageSelectorModal })),
  "Language Selector"
);
const LazyCustomerConciergeDrawer = resilientLazy(
  () => import("@/components/ai/customer-concierge-drawer").then((m) => ({ default: m.CustomerConciergeDrawer })),
  "AI Concierge"
);
const LazyExpiringViralShareModal = resilientLazy(
  () => import("@/components/growth/expiring-viral-share-modal").then((m) => ({ default: m.ExpiringViralShareModal })),
  "Gift Share Reward"
);
import { VipGoldPassHub } from "@/components/market/vip-gold-pass-hub";
import { CustomerFloatingBottomNav } from "@/components/navigation/floating-bottom-nav";
import { useDietStore } from "@/lib/stores/diet";
import { useBrand, useT } from "@/components/providers";
import { cartCount, useCartStore } from "@/lib/stores/cart";
import { useLocationStore } from "@/lib/stores/location";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SignedOut } from "@/lib/auth/gates";
import { cn } from "@/lib/utils";
import { DeviceAvatar } from "@/components/common/device-avatar";
import { isDeliveryActiveInLocation } from "@/lib/geo/geofence-guard";

const SEARCH_PLACEHOLDERS = [
  "Biryani near you...",
  "Pizza cravings?",
  "What are you hungry for?",
  "Hot dosas & thalis...",
  "Burgers & rolls...",
];

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
  const isDeliveryActive = location ? isDeliveryActiveInLocation(location.lat, location.lng, location.cityId) : true;
  const items = useCartStore((s) => s.items) ?? [];
  const count = cartCount(items);
  const path = useRouterState({ select: (s) => s.location?.pathname }) || "";
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [locOpen, setLocOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [conciergeOpen, setConciergeOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [vipPassOpen, setVipPassOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchPlaceholderIndex, setSearchPlaceholderIndex] = useState(0);
  const { dietFilter, toggleVeg } = useDietStore();

  useEffect(() => {
    let isMounted = true;
    const handleScroll = () => {
      if (isMounted && typeof window !== "undefined") {
        setIsScrolled(window.scrollY > 8);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      isMounted = false;
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(() => {
      if (isMounted) {
        setSearchPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
      }
    }, 2800);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    // Strictly enforce light mode in DOM
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.backgroundColor = "#FCFAF7";
      document.documentElement.style.colorScheme = "light";
    }
  }, []);

  const currentPlaceholder =
    SEARCH_PLACEHOLDERS[searchPlaceholderIndex % SEARCH_PLACEHOLDERS.length] || "What are you hungry for?";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-[#FCFAF7] text-gray-900 pb-20 md:max-w-5xl">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:bg-white focus:px-3 focus:py-2 focus:text-black focus:shadow-md"
      >
        {t("a11y.skip")}
      </a>

      {/* Pristine Ultra-Luxury Header */}
      <header
        className={cn(
          "sticky top-0 z-40 bg-gradient-to-b from-[#FFFDF9]/95 via-[#FAF6F0]/95 to-[#F5EFEB]/90 backdrop-blur-md px-3 sm:px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2.5 space-y-2 transition-all duration-300",
          isScrolled
            ? "border-b border-amber-900/15 shadow-[0_6px_24px_rgba(40,25,10,0.08)]"
            : "border-b border-amber-900/5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
        )}
      >
        {/* ROW 1: Brand + AI Support (Left) | Gift Share (Center) | Crown Wallet + Join (Right) */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          {/* Row 1 Left: OrderKing crown logo + 'Prestige' gold badge + 1-tap AI Support mic button with pulse ring */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link to="/" className="flex items-center gap-1.5 no-underline group shrink-0">
              <div className="relative">
                <OrderKingMark className="size-8 sm:size-9 transition-transform duration-300 group-hover:scale-105 drop-shadow-2xs" />
                <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-amber-400 ring-2 ring-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-black tracking-tight text-gray-950 leading-none">
                  OrderKing
                </span>
                <span className="inline-flex items-center gap-0.5 text-[8.5px] font-black uppercase tracking-widest text-amber-800 bg-gradient-to-r from-amber-100 via-amber-200/90 to-yellow-100 px-1.5 py-0.2 rounded-xs border border-amber-300/70 leading-none mt-0.5 shadow-2xs">
                  <Crown className="size-2 text-amber-700" />
                  Prestige
                </span>
              </div>
            </Link>

            {/* 1-Tap AI Support Mic Button with Pulse Ring */}
            <div className="relative shrink-0">
              <span className="absolute -inset-0.5 rounded-full bg-amber-400/40 animate-ping pointer-events-none" />
              <button
                type="button"
                onClick={() => setConciergeOpen(true)}
                className="relative flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-gradient-to-r from-slate-950 via-slate-900 to-black text-amber-300 border border-amber-400/80 shadow-[0_2px_8px_rgba(245,158,11,0.25)] hover:border-amber-300 hover:shadow-[0_2px_12px_rgba(245,158,11,0.35)] transition-all active:scale-95"
                title="1-Tap AI Support Concierge"
                aria-label="Open 24x7 AI Support"
              >
                <Mic className="size-3 text-amber-300 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-tight text-amber-200">
                  AI Support
                </span>
              </button>
            </div>
          </div>

          {/* Row 1 Center: Gift share button with 7-DAY countdown timer badge, golden shimmer */}
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="relative overflow-hidden flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/15 via-yellow-400/30 to-amber-500/15 border border-amber-400/70 text-amber-950 text-xs font-black shadow-[0_2px_8px_rgba(245,158,11,0.12)] hover:border-amber-500 hover:shadow-[0_2px_12px_rgba(245,158,11,0.25)] transition-all active:scale-95 shrink-0 group"
            title="Share with friends & get ₹50 (7-Day Expiry)"
          >
            {/* Golden shimmer sweep */}
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-amber-200/50 to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-out" />
            <Gift className="size-3.5 text-amber-800 shrink-0 group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-[10.5px] font-black text-amber-950 hidden xs:inline tracking-tight">
              Gift ₹50
            </span>
            <span className="inline-flex items-center gap-0.5 text-[8.5px] font-black bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-full px-1.5 py-0.5 uppercase tracking-wider leading-none shadow-2xs">
              7-DAY
            </span>
          </button>

          {/* Row 1 Right: 24K Gold Crown Wallet gem icon + VIP Pass + Join/Profile button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* VIP Gold Pass Crown Trigger */}
            <button
              type="button"
              onClick={() => setVipPassOpen(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 border border-amber-500/80 text-amber-950 text-xs font-black shadow-[0_2px_8px_rgba(245,158,11,0.25)] hover:shadow-[0_2px_14px_rgba(245,158,11,0.4)] transition-all active:scale-95 cursor-pointer group"
              title="OrderKing VIP Gold Pass"
            >
              <Crown className="size-3 text-amber-900 fill-amber-700 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-tight hidden xs:inline">
                VIP Gold
              </span>
            </button>

            {/* 24K Gold Crown Wallet Gem */}
            <Link
              to="/earn"
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400/25 via-yellow-300/40 to-amber-500/25 border border-amber-400 text-amber-950 text-xs font-black shadow-[0_2px_8px_rgba(245,158,11,0.2)] hover:shadow-[0_2px_14px_rgba(245,158,11,0.35)] transition-all active:scale-95 no-underline group"
              title="Crown Wallet & 24K Gold Credits"
            >
              <div className="flex size-4 items-center justify-center rounded-full bg-amber-400/40 group-hover:scale-110 transition-transform">
                <Crown className="size-3 text-amber-800 shrink-0 drop-shadow-2xs" />
              </div>
              <span className="text-[10.5px] font-black text-amber-950 hidden sm:inline">
                Crown Wallet
              </span>
              <span className="text-[8.5px] font-black bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 rounded-full px-1.5 py-0.5 leading-none shadow-2xs border border-amber-300">
                24K
              </span>
            </Link>

            {/* Profile & Sign-In */}
            {isPending ? (
              <div className="h-7 w-7 animate-pulse rounded-full bg-amber-100" />
            ) : user ? (
              <Link
                to="/account"
                className="flex items-center gap-1 p-1 rounded-full border border-amber-200 bg-white/80 hover:bg-amber-50 transition no-underline text-gray-900 shadow-2xs"
                title="Your Profile & Account"
              >
                <DeviceAvatar userId={user.id} name={user.displayName} />
              </Link>
            ) : (
              <SignedOut>
                <Link
                  to="/login"
                  className="flex items-center gap-1 rounded-full border border-amber-400/80 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-2.5 py-1 text-amber-300 shadow-xs no-underline transition hover:border-amber-300 active:scale-95"
                  aria-label="Sign in or join OrderKing"
                >
                  <Crown className="size-3 text-amber-300" aria-hidden />
                  <span className="text-[10px] font-black uppercase tracking-wider">Join</span>
                </Link>
              </SignedOut>
            )}
          </div>
        </div>

        {/* ROW 2: Compact location pill (emerald) + Luxury search bar (glassmorphism, golden focus ring) + Pure Veg/All toggle */}
        {path !== "/search" && !["/tutor", "/travel", "/orders", "/support", "/earn"].some((prefix) => path.startsWith(prefix)) && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Compact Location Pill (Emerald) */}
            <button
              type="button"
              onClick={() => setLocOpen(true)}
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-emerald-50/90 hover:bg-emerald-100/90 border border-emerald-200/90 text-emerald-950 text-xs font-bold shrink-0 max-w-[125px] sm:max-w-[155px] shadow-2xs transition-all active:scale-95"
              title="Change delivery location"
            >
              <MapPin className="size-3.5 text-emerald-600 shrink-0" />
              <span className="truncate text-[11px] font-black text-emerald-950">
                {location?.cityName || "Locating..."}
              </span>
              <ChevronDown className="size-3 text-emerald-600/70 shrink-0" />
            </button>

            {/* Luxury Center Search (Glassmorphism, golden focus ring) */}
            <button
              type="button"
              onClick={() => (onSearch ? onSearch() : void navigate({ to: "/search" }))}
              className="flex-1 flex h-9 items-center gap-2 rounded-xl border border-amber-300/60 bg-white/70 backdrop-blur-md hover:bg-white hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-amber-400 px-3 text-left text-gray-400 transition-all shadow-[0_2px_8px_rgba(245,158,11,0.05)] min-w-0 group"
            >
              <Search className="size-3.5 shrink-0 text-amber-600 group-hover:scale-110 transition-transform" aria-hidden />
              <div className="relative flex-1 h-4 overflow-hidden">
                <span
                  key={searchPlaceholderIndex}
                  className="absolute inset-0 text-xs text-gray-500 font-medium truncate transition-all duration-300"
                >
                  {currentPlaceholder}
                </span>
              </div>
            </button>

            {/* Pure Veg / All Switch */}
            <button
              type="button"
              onClick={toggleVeg}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-black transition-all shadow-2xs shrink-0 select-none active:scale-95",
                dietFilter === "veg"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-[0_2px_10px_rgba(5,150,105,0.3)] ring-1 ring-emerald-500"
                  : "bg-white/80 hover:bg-white text-gray-700 border-amber-200/80 hover:border-emerald-300"
              )}
              title={dietFilter === "veg" ? "Pure Veg Only is ACTIVE" : "Show All Restaurants"}
            >
              <span className={cn(
                "size-3 rounded-xs border flex items-center justify-center p-0.5 transition-colors",
                dietFilter === "veg" ? "border-white bg-white" : "border-emerald-600 bg-white"
              )}>
                <span className="size-1.5 rounded-full bg-emerald-600" />
              </span>
              <span className="text-[11px] font-black tracking-tight">
                {dietFilter === "veg" ? "Pure Veg" : "All"}
              </span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main id="main" className="flex-1 w-full">
        <ErrorBoundary sectionName="Page Content">
          {children}
        </ErrorBoundary>
      </main>

      {/* Floating View Cart Bar positioned safely above the floating luxury dock */}
      {isDeliveryActive && count > 0 && path !== "/cart" && path !== "/checkout" ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-20 z-40 flex justify-center px-4">
          <Link
            to="/cart"
            className="pointer-events-auto flex min-h-12 w-full max-w-md items-center justify-between rounded-2xl bg-gradient-to-r from-[#E23744] to-[#C92F3B] px-4 py-3 text-white no-underline shadow-[0_12px_30px_rgba(226,55,68,0.35)] transition-all active:scale-98 font-bold border border-white/20"
          >
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-white/20 text-xs font-extrabold">
                {count}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-white/95">
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

      {/* ULTRA-LUXURIOUS FLOATING DOCKED BOTTOM NAVIGATION */}
      <CustomerFloatingBottomNav />

      {conciergeOpen ? (
        <ModalErrorBoundary onClose={() => setConciergeOpen(false)} componentName="AI Support Concierge">
          <Suspense fallback={null}>
            <LazyCustomerConciergeDrawer open={conciergeOpen} onClose={() => setConciergeOpen(false)} area="food" />
          </Suspense>
        </ModalErrorBoundary>
      ) : null}
      {shareOpen ? (
        <ModalErrorBoundary onClose={() => setShareOpen(false)} componentName="Gift Share Modal">
          <Suspense fallback={null}>
            <LazyExpiringViralShareModal open={shareOpen} onClose={() => setShareOpen(false)} />
          </Suspense>
        </ModalErrorBoundary>
      ) : null}
      {locOpen ? (
        <ModalErrorBoundary onClose={() => setLocOpen(false)} componentName="Location Picker">
          <Suspense fallback={null}>
            <LazyLocationDialog open={locOpen} onOpenChange={setLocOpen} />
          </Suspense>
        </ModalErrorBoundary>
      ) : null}
      {langOpen ? (
        <ModalErrorBoundary onClose={() => setLangOpen(false)} componentName="Language Selector">
          <Suspense fallback={null}>
            <LazyLanguageSelectorModal
              isOpen={langOpen}
              onClose={() => setLangOpen(false)}
              selectedCode={lang}
              onSelectLanguage={(l: any) => {
                setLang(l.code as any);
              }}
            />
          </Suspense>
        </ModalErrorBoundary>
      ) : null}
      {vipPassOpen ? (
        <VipGoldPassHub isOpen={vipPassOpen} onClose={() => setVipPassOpen(false)} />
      ) : null}
    </div>
  );
}
