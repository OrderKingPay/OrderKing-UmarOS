import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Search,
  ShoppingBag,
  MapPin,
  ChevronDown,
  Crown,
  Languages,
  UtensilsCrossed,
  Plane,
  GraduationCap,
  Briefcase,
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
  { id: "food", name: "Food", icon: UtensilsCrossed, iconGradient: "from-amber-400 to-orange-700", to: "/",
    match: (p: string) => p === "/" || ["/delivery", "/r/", "/search", "/cart", "/checkout", "/dining", "/offers"].some((v) => p.startsWith(v)) },
  { id: "kingpay", name: "KingPay", icon: Crown, iconGradient: "from-yellow-400 to-amber-700", to: "/kingpay",
    match: (p: string) => ["/kingpay", "/king-pay", "/travel", "/tutor", "/news", "/earn"].some((v) => p.startsWith(v)) },
  { id: "orders", name: "Orders & Passes", icon: ShoppingBag, iconGradient: "from-rose-500 to-rose-800", to: "/orders",
    match: (p: string) => p.startsWith("/orders") },
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
  const { dietFilter, setDietFilter } = useDietStore();

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
  const hasSearchRow = path === "/" ||
    ["/restaurants", "/menu", "/r/", "/dining", "/cart"].some((prefix) => path.startsWith(prefix));

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-[#FCFAF7] text-gray-900 pb-28 md:max-w-5xl">
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

          {/* Row 1 Center: Sovereign Top Navigation (Travel, AI Tutor, Jobs) matching visual screenshot */}
          <nav aria-label="OrderKing Sovereign Services" className="hidden sm:flex items-center gap-1.5 md:gap-2">
            <Link
              to="/travel"
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold transition shadow-2xs no-underline",
                path.startsWith("/travel")
                  ? "border-amber-500 bg-amber-50 text-amber-950 font-black shadow-xs ring-1 ring-amber-400"
                  : "border-amber-300/80 bg-white/90 hover:bg-amber-50/80 text-gray-800 hover:border-amber-400"
              )}
            >
              <Plane className="size-3.5 text-amber-600" />
              <span>Travel</span>
            </Link>
            <Link
              to="/tutor"
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold transition shadow-2xs no-underline",
                path.startsWith("/tutor")
                  ? "border-amber-500 bg-amber-50 text-amber-950 font-black shadow-xs ring-1 ring-amber-400"
                  : "border-amber-300/80 bg-white/90 hover:bg-amber-50/80 text-gray-800 hover:border-amber-400"
              )}
            >
              <GraduationCap className="size-3.5 text-amber-600" />
              <span>AI Tutor</span>
            </Link>
            <Link
              to="/tutor-jobs"
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold transition shadow-2xs no-underline",
                path.startsWith("/tutor-jobs")
                  ? "border-amber-500 bg-amber-50 text-amber-950 font-black shadow-xs ring-1 ring-amber-400"
                  : "border-amber-300/80 bg-white/90 hover:bg-amber-50/80 text-gray-800 hover:border-amber-400"
              )}
            >
              <Briefcase className="size-3.5 text-amber-600" />
              <span>Jobs</span>
            </Link>
          </nav>

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

            {/* Crowns Wallet Luxury Pill (Replaces Mic / AI Support button) - Direct link to KingPay */}
            <Link
              to="/kingpay"
              className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-950 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-400/60 text-amber-300 hover:border-amber-300 shadow-2xs hover:shadow-xs transition-all active:scale-95 shrink-0 no-underline cursor-pointer"
              title="OrderKing Crowns Wallet & KingPay"
              aria-label="Crowns Wallet"
            >
              <Crown className="size-3.5 text-amber-300 fill-amber-400/30" />
              <span className="text-[10.5px] font-black uppercase tracking-tight text-amber-300 hidden xs:inline">
                Crowns
              </span>
            </Link>

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

        {/* ROW 2: Luxury search bar (glassmorphism, golden focus ring) + Pure Veg/All toggle */}
        {hasSearchRow && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button type="button" onClick={() => setConciergeOpen(true)}
                className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-amber-400/80 bg-stone-950 text-amber-300 shadow-sm hover:bg-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 sm:size-10"
                aria-label="Open AI assistant" title="AI assistant"><Sparkles className="size-4" aria-hidden="true" /></button>

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

              <div role="group" aria-label="Food preference" className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={() => setDietFilter("veg")} aria-pressed={dietFilter === "veg"}
                  title="Vegetarian restaurants only" className={cn("flex min-h-9 items-center justify-center rounded-xl border px-2 text-[11px] font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 sm:min-h-10",dietFilter === "veg" ? "border-emerald-700 bg-emerald-700 text-white" : "border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50")}>Veg</button>
                <button type="button" onClick={() => setDietFilter("all")} aria-pressed={dietFilter === "all"}
                  title="All restaurants" className={cn("flex min-h-9 items-center justify-center rounded-xl border px-2 text-[11px] font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 sm:min-h-10",dietFilter === "all" ? "border-amber-500 bg-stone-950 text-amber-200" : "border-amber-200 bg-white text-stone-700 hover:bg-amber-50")}>All</button>
              </div>
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


      {/* Floating View Cart & 1-Tap Checkout Bar */}
      {count > 0 && path !== "/cart" && path !== "/checkout" ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-20 z-40 flex flex-col items-center justify-center px-4 gap-1.5">
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
