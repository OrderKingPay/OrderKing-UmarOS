import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Search,
  ShoppingBag,
  MapPin,
  ChevronDown,
  Crown,
  Languages,
  Mic,
  UtensilsCrossed,
  Plane,
  GraduationCap,
  Wine,
  Sparkles,
} from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { OrderKingMark } from "@/components/brand/wordmark";
import { resilientLazy, ModalErrorBoundary } from "@/components/common/resilient-lazy";
import { ErrorBoundary } from "@/components/error-boundary";
import { OneTapCheckoutDrawer } from "@/components/market/one-tap-checkout-drawer";

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
import { CustomerFloatingBottomNav } from "@/components/navigation/floating-bottom-nav";
import { UltraLuxuryEcosystemFooter } from "@/components/market/ultra-luxury-ecosystem-footer";
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

export const SOVEREIGN_ECOSYSTEM_TABS = [
  {
    id: "food",
    name: "Food",
    badge: "",
    badgeColor: "bg-emerald-500/20 text-emerald-800 border-emerald-400/50",
    icon: UtensilsCrossed,
    iconGradient: "from-amber-400 via-emerald-500 to-teal-800",
    to: "/",
    match: (p: string) => p === "/" || p.startsWith("/r/") || p.startsWith("/cart") || p.startsWith("/search"),
  },
  {
    id: "kingpay",
    name: "KingPay",
    badge: "",
    badgeColor: "bg-amber-500/25 text-amber-900 border-amber-400/60",
    icon: Crown,
    iconGradient: "from-yellow-400 via-amber-500 to-amber-700",
    to: "/king-pay",
    match: (p: string) => p.startsWith("/king-pay"),
  },
  {
    id: "travel",
    name: "Travel",
    badge: "",
    badgeColor: "bg-sky-500/20 text-sky-900 border-sky-400/50",
    icon: Plane,
    iconGradient: "from-sky-400 via-blue-500 to-indigo-800",
    to: "/travel",
    match: (p: string) => p.startsWith("/travel"),
  },
  {
    id: "tutor",
    name: "Tutor",
    badge: "",
    badgeColor: "bg-purple-500/20 text-purple-900 border-purple-400/50",
    icon: GraduationCap,
    iconGradient: "from-indigo-400 via-purple-500 to-purple-800",
    to: "/tutor",
    match: (p: string) => p.startsWith("/tutor"),
  },
  {
    id: "dining",
    name: "Dining",
    badge: "",
    badgeColor: "bg-rose-500/20 text-rose-900 border-rose-400/50",
    icon: Wine,
    iconGradient: "from-rose-400 via-pink-500 to-rose-800",
    to: "/dining",
    match: (p: string) => p.startsWith("/dining"),
  },
];

export const POPULAR_INDIAN_DISH_CHIPS = [
  { name: "Biryani", query: "Biryani", emoji: "🍚", hindi: "बिरयानी", bengali: "বিরিয়ানি" },
  { name: "Momos", query: "Momos", emoji: "🥟", hindi: "मोमोज", bengali: "মোমো" },
  { name: "Butter Chicken", query: "Butter Chicken", emoji: "🍗", hindi: "बटर चिकन", bengali: "বাটার চিকেন" },
  { name: "Dosa", query: "Dosa", emoji: "🥞", hindi: "दोसा", bengali: "দোসা" },
  { name: "Paneer", query: "Paneer", emoji: "🧀", hindi: "पनीर", bengali: "পনির" },
  { name: "Thali", query: "Thali", emoji: "🍽️", hindi: "थाली", bengali: "থালি" },
  { name: "Rolls", query: "Rolls", emoji: "🌯", hindi: "काठी रोल", bengali: "কাঠি রোল" },
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
  const [oneTapDrawerOpen, setOneTapDrawerOpen] = useState(false);
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
        {/* ROW 1: Authentic Indian Food Delivery Header: Logo + Delivery Address (Left) | Language + AI Support + Cart + Profile (Right) */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-3">
          {/* Row 1 Left: OrderKing logo + Delivery Address Selector */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <Link to="/" className="flex items-center gap-1.5 no-underline group shrink-0">
              <div className="relative">
                <OrderKingMark className="size-8 sm:size-9 transition-transform duration-300 group-hover:scale-105 drop-shadow-2xs" />
                <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <span className="text-base sm:text-lg font-black tracking-tight text-gray-950 leading-none hidden xs:inline">
                OrderKing
              </span>
            </Link>

            {/* Delivery Address Selector (Location Pin with current address e.g. "Connaught Place, New Delhi", clicking opens address picker) */}
            <button
              type="button"
              onClick={() => setLocOpen(true)}
              className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-amber-100/50 border border-transparent hover:border-amber-200/80 text-left transition-all max-w-[130px] xs:max-w-[170px] sm:max-w-[220px] group cursor-pointer"
              title="Change delivery location"
              aria-label="Select delivery address"
            >
              <div className="relative shrink-0 flex items-center justify-center">
                <MapPin className="size-3.5 sm:size-4 text-amber-600 group-hover:scale-110 transition-transform" />
                <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-0.5 leading-tight">
                  <span className="text-xs font-black text-gray-900 truncate">
                    {location?.zoneName || (location?.cityName && location.cityName !== "Locating..." ? location.cityName : "Connaught Place")}
                  </span>
                  <ChevronDown className="size-3 text-gray-500 shrink-0 group-hover:translate-y-0.5 transition-transform" />
                </div>
                <span className="text-[10px] text-gray-500 truncate hidden xs:block leading-tight">
                  {location?.cityName && location.cityName !== "Locating..." ? `${location.cityName}, India` : "Select location"}
                </span>
              </div>
            </button>
          </div>

          {/* Row 1 Right: 1-Tap Language + 1-Tap AI Support + Cart Icon with Counter + User Profile / Sign In */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* 1-Tap Language selector (English, Hindi, Bengali, etc.) */}
            <button
              type="button"
              onClick={() => setLangOpen(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/80 hover:bg-amber-50 border border-amber-200/80 text-gray-800 text-xs font-bold shadow-2xs hover:border-amber-300 transition-all active:scale-95 shrink-0 cursor-pointer"
              title="Change Language (English, हिन्दी, বাংলা, etc.)"
              aria-label="Select language"
            >
              <Languages className="size-3.5 text-amber-700" />
              <span className="text-[11px] font-black uppercase text-amber-950">
                {lang === "hi" ? "हिन्दी" : lang === "bn" ? "বাংলা" : (lang as string) === "as" ? "অসমীয়া" : "EN"}
              </span>
            </button>

            {/* 1-Tap AI Support button */}
            <div className="relative shrink-0">
              <span className="absolute -inset-0.5 rounded-xl bg-amber-400/40 animate-ping pointer-events-none" />
              <button
                type="button"
                onClick={() => setConciergeOpen(true)}
                className="relative flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-black text-amber-300 border border-amber-400/80 shadow-[0_2px_8px_rgba(245,158,11,0.25)] hover:border-amber-300 hover:shadow-[0_2px_12px_rgba(245,158,11,0.35)] transition-all active:scale-95 cursor-pointer"
                title="1-Tap AI Support Concierge"
                aria-label="Open 24x7 AI Support"
              >
                <Mic className="size-3 text-amber-300 animate-pulse" />
                <span className="text-[10px] sm:text-[10.5px] font-black uppercase tracking-tight text-amber-200 hidden xs:inline">
                  AI Support
                </span>
              </button>
            </div>

            {/* Cart icon with badge counter (redirecting to /cart or opening drawer) */}
            <Link
              to="/cart"
              className="relative flex items-center justify-center p-1.5 sm:p-2 rounded-xl bg-white/80 hover:bg-amber-50 border border-amber-200/80 text-gray-800 shadow-2xs hover:border-amber-400 transition-all active:scale-95 shrink-0 no-underline cursor-pointer"
              title="Shopping Cart"
              aria-label={`Cart with ${count} items`}
            >
              <ShoppingBag className="size-4 text-gray-900" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 flex min-w-4 h-4 px-1 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-[9px] font-black text-white shadow-2xs ring-1 ring-white">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>

            {/* User profile avatar / "Sign In" button */}
            {isPending ? (
              <div className="size-7 sm:size-8 animate-pulse rounded-full bg-amber-100 shrink-0" />
            ) : user ? (
              <Link
                to="/account"
                className="flex items-center p-0.5 rounded-full border border-amber-200/90 bg-white/90 hover:bg-amber-50 transition no-underline text-gray-900 shadow-2xs shrink-0"
                title="Your Profile & Account"
                aria-label="Account and Profile"
              >
                <DeviceAvatar userId={user.id} name={user.displayName} />
              </Link>
            ) : (
              <SignedOut>
                <Link
                  to="/login"
                  className="flex items-center gap-1 rounded-xl border border-amber-400/80 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-2 sm:px-2.5 py-1 text-amber-300 shadow-2xs no-underline transition hover:border-amber-300 active:scale-95 shrink-0"
                  aria-label="Sign in"
                >
                  <span className="text-[10.5px] font-black uppercase tracking-wider">Sign In</span>
                </Link>
              </SignedOut>
            )}
          </div>
        </div>

        {/* ROW 1.5: Sovereign Ecosystem Horizontal Tabs (Food, KingPay, Travel, AI Tutor, VIP Dining) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none select-none">
          {SOVEREIGN_ECOSYSTEM_TABS.map((tab) => {
            const isActive = tab.match(path);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.id}
                to={tab.to}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black transition-all shrink-0 no-underline active:scale-95 border",
                  isActive
                    ? "bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-amber-200 border-amber-400/80 shadow-[0_2px_10px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/50"
                    : "bg-white/80 hover:bg-white text-gray-700 border-amber-200/70 hover:border-amber-400/60 shadow-2xs"
                )}
              >
                <div className={cn("flex size-4.5 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-2xs", tab.iconGradient)}>
                  <Icon className="size-3" />
                </div>
                <span className="text-[11px] font-black">{tab.name}</span>
                <span className={cn("text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full border leading-none shadow-2xs", tab.badgeColor)}>
                  {tab.badge || null}
                </span>
              </Link>
            );
          })}
        </div>

        {/* ROW 2: Luxury search bar (glassmorphism, golden focus ring) + Pure Veg/All toggle */}
        {path !== "/search" && !["/tutor", "/travel", "/orders", "/support", "/earn"].some((prefix) => path.startsWith(prefix)) && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Luxury Center Search (Glassmorphism, golden focus ring) */}
              <button
                type="button"
                onClick={() => (onSearch ? onSearch() : void navigate({ to: "/search" }))}
                className="flex-1 flex h-9 sm:h-10 items-center gap-2 rounded-xl sm:rounded-2xl border border-amber-300/60 bg-white/80 backdrop-blur-md hover:bg-white hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-amber-400 px-3 sm:px-3.5 text-left text-gray-400 transition-all shadow-[0_2px_8px_rgba(245,158,11,0.05)] min-w-0 group cursor-pointer"
              >
                <Search className="size-3.5 sm:size-4 shrink-0 text-amber-600 group-hover:scale-110 transition-transform" aria-hidden />
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
                  "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border text-xs font-black transition-all shadow-2xs shrink-0 select-none active:scale-95 cursor-pointer",
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

            {/* ROW 3: Zero-Typing Smart Autocorrect Quick Dish Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 pb-0.5 scrollbar-none select-none">
              <span className="text-[9.5px] font-black uppercase tracking-wider text-amber-900/70 shrink-0 flex items-center gap-0.5 pr-0.5">
                <Sparkles className="size-2.5 text-amber-600" />
                <span>Instant:</span>
              </span>
              {POPULAR_INDIAN_DISH_CHIPS.map((chip) => (
                <button
                  key={chip.name}
                  type="button"
                  onClick={() => void navigate({ to: "/search", search: { q: chip.query } as any })}
                  className="inline-flex items-center gap-1 rounded-full bg-white/90 hover:bg-amber-50/90 border border-amber-200/80 hover:border-amber-400 px-2 py-0.5 text-[10.5px] font-bold text-gray-800 shadow-2xs shrink-0 transition-all active:scale-95 cursor-pointer group"
                  title={`Zero-Typing Search: ${chip.name} (${chip.hindi} / ${chip.bengali})`}
                >
                  <span className="text-[11px] group-hover:scale-110 transition-transform">{chip.emoji}</span>
                  <span className="font-black text-gray-950">{chip.name}</span>
                  <span className="text-[9px] text-amber-800/80 font-medium hidden sm:inline">· {chip.hindi}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main id="main" className="flex-1 w-full">
        <ErrorBoundary sectionName="Page Content">
          {children}
        </ErrorBoundary>
      </main>

      {/* ULTRA-LUXURY 3D ECOSYSTEM PORTAL & FOOTER */}
      {path !== "/" ? <UltraLuxuryEcosystemFooter /> : null}

      {/* Floating View Cart & 1-Tap Checkout Bar */}
      {isDeliveryActive && count > 0 && path !== "/cart" && path !== "/checkout" ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-20 z-40 flex justify-center px-4">
          <div className="pointer-events-auto flex min-h-12 w-full max-w-md items-center justify-between rounded-2xl bg-gradient-to-r from-slate-950 via-[#18130d] to-slate-950 px-3.5 py-2.5 text-white shadow-[0_12px_36px_rgba(0,0,0,0.45)] transition-all font-bold border border-amber-400/60 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 text-slate-950 text-xs font-black shadow-md">
                {count}
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-wider text-amber-200 leading-none">
                  {count === 1 ? t("cart.item") : t("cart.items")} added
                </span>
                <span className="text-[10px] text-stone-400 font-medium mt-0.5">
                  View final total in your cart
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setOneTapDrawerOpen(true)}
                className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 px-3 py-1.5 text-xs font-black text-slate-950 shadow-md hover:brightness-105 active:scale-95 transition-all border border-amber-200 cursor-pointer"
              >
                <Crown className="size-3.5 fill-slate-950" />
                <span>1-Tap Pay</span>
              </button>

              <Link
                to="/cart"
                className="flex items-center gap-1 rounded-xl bg-white/15 hover:bg-white/25 px-2.5 py-1.5 text-xs font-bold text-white border border-white/20 transition-all no-underline"
              >
                <ShoppingBag className="size-3.5" aria-hidden />
                <span>{t("cart.view")}</span>
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {/* ULTRA-LUXURIOUS FLOATING DOCKED BOTTOM NAVIGATION */}
      <CustomerFloatingBottomNav />

      {/* 1-TAP CHECKOUT DRAWER */}
      {oneTapDrawerOpen && (
        <OneTapCheckoutDrawer open={oneTapDrawerOpen} onClose={() => setOneTapDrawerOpen(false)} />
      )}

      {conciergeOpen ? (
        <ModalErrorBoundary onClose={() => setConciergeOpen(false)} componentName="AI Support Concierge">
          <Suspense fallback={null}>
            <LazyCustomerConciergeDrawer open={conciergeOpen} onClose={() => setConciergeOpen(false)} area="food" />
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
    </div>
  );
}
