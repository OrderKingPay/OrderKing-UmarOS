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
  Train,
  GraduationCap,
  Briefcase,
  Sparkles,
  User,
  Package,
  CreditCard,
  Wallet,
  Settings,
  LogOut,
  Mic,
} from "lucide-react";
import { useState, useEffect, useRef, Suspense } from "react";
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
const LazyVoiceSearchDialog = resilientLazy(
  () => import("@/components/market/voice-search-dialog").then((m) => ({ default: m.VoiceSearchDialog })),
  "Voice Search"
);
import { CustomerFloatingBottomNav } from "@/components/navigation/floating-bottom-nav";
import { useDietStore } from "@/lib/stores/diet";
import { useBrand, useT } from "@/components/providers";
import { cartCount, useCartStore } from "@/lib/stores/cart";
import { useLocationStore } from "@/lib/stores/location";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SignedOut } from "@/lib/auth/gates";
import { setPhoneSession, signOut } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { DeviceAvatar } from "@/components/common/device-avatar";
import { isDeliveryActiveInLocation } from "@/lib/geo/geofence-guard";

const SEARCH_PLACEHOLDERS = [
  "rolls",
  "game night",
  "Restaurant name or a dish...",
  "biryani",
  "pizza",
  "momos",
];

export const SOVEREIGN_ECOSYSTEM_TABS = [
  {
    id: "food", name: "Food Delivery", icon: UtensilsCrossed, iconGradient: "from-orange-500 to-[#C2410C]", to: "/",
    match: (p: string) => p === "/" || ["/delivery", "/r/", "/search", "/cart", "/checkout", "/dining", "/offers"].some((v) => p.startsWith(v))
  },
  {
    id: "tutor", name: "King Tutor", icon: GraduationCap, iconGradient: "from-emerald-400 to-emerald-700", to: "/tutor",
    match: (p: string) => p.startsWith("/tutor") && !p.startsWith("/tutor-jobs")
  },
  {
    id: "jobs", name: "King Job", icon: Briefcase, iconGradient: "from-purple-400 to-purple-700", to: "/tutor-jobs",
    match: (p: string) => p.startsWith("/tutor-jobs")
  },
  {
    id: "travel", name: "Travel", icon: Plane, iconGradient: "from-sky-400 to-sky-700", to: "/travel",
    match: (p: string) => p.startsWith("/travel")
  },
  {
    id: "kingpay", name: "KingPay", icon: Wallet, iconGradient: "from-[#B85D19] to-[#C2410C]", to: "/kingpay",
    match: (p: string) => ["/kingpay", "/king-pay", "/news", "/earn"].some((v) => p.startsWith(v))
  },
  {
    id: "orders", name: "Orders & Passes", icon: ShoppingBag, iconGradient: "from-rose-500 to-rose-800", to: "/orders",
    match: (p: string) => p.startsWith("/orders")
  },
];

export const PLATFORM_ECOSYSTEM_TABS = SOVEREIGN_ECOSYSTEM_TABS;

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
  maxWidth,
  dark: explicitDark,
}: {
  children: React.ReactNode;
  onSearch?: () => void;
  maxWidth?: string;
  dark?: boolean;
}) {
  const { t, lang, setLang } = useT();
  const { brand } = useBrand();
  const location = useLocationStore((s) => s.location);
  const isDeliveryActive = location ? isDeliveryActiveInLocation(location.lat, location.lng, location.cityId) : true;
  const items = useCartStore((s) => s.items) ?? [];
  const count = cartCount(items);
  const path = useRouterState({ select: (s) => s.location?.pathname }) || "";
  const isDark = explicitDark ?? (
    path.startsWith("/tutor") ||
    path.startsWith("/tutor-jobs") ||
    path.startsWith("/kingpay") ||
    path.startsWith("/king-pay")
  );
  const effectiveMaxWidth = maxWidth || "max-w-7xl";
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [locOpen, setLocOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [conciergeOpen, setConciergeOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [oneTapDrawerOpen, setOneTapDrawerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchPlaceholderIndex, setSearchPlaceholderIndex] = useState(0);
  const { dietFilter, setDietFilter } = useDietStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [userMenuOpen]);

  useEffect(() => {
    const handleOpenConcierge = () => setConciergeOpen(true);
    window.addEventListener("orderking:open-concierge", handleOpenConcierge);
    return () => window.removeEventListener("orderking:open-concierge", handleOpenConcierge);
  }, []);

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
    if (typeof document !== "undefined") {
      const prevHtmlBg = document.documentElement.style.backgroundColor;
      const prevBodyBg = document.body.style.backgroundColor;
      if (isDark) {
        document.documentElement.classList.add("dark");
        document.documentElement.style.backgroundColor = "#080a10";
        document.body.style.backgroundColor = "#080a10";
        document.documentElement.style.colorScheme = "dark";
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.style.backgroundColor = "#FCFAF7";
        document.body.style.backgroundColor = "#FCFAF7";
        document.documentElement.style.colorScheme = "light";
      }
      return () => {
        document.documentElement.style.backgroundColor = prevHtmlBg || "#FCFAF7";
        document.body.style.backgroundColor = prevBodyBg || "#FCFAF7";
      };
    }
  }, [isDark]);

  const currentPlaceholder =
    SEARCH_PLACEHOLDERS[searchPlaceholderIndex % SEARCH_PLACEHOLDERS.length] || "What are you hungry for?";
  const isKingPayDomain = path.startsWith("/travel") || path.startsWith("/kingpay") || path.startsWith("/king-pay");
  const hasSearchRow = path === "/" ||
    ["/restaurants", "/menu", "/r/", "/dining", "/cart"].some((prefix) => path.startsWith(prefix));

  return (
    <div className={cn("w-full min-h-dvh flex flex-col transition-colors duration-200", isDark ? "bg-[#080a10] text-slate-100" : "bg-[#FCFAF7] text-gray-900")}>
      <div className={cn("mx-auto flex min-h-dvh w-full flex-col pb-28", effectiveMaxWidth)}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:bg-white focus:px-3 focus:py-2 focus:text-black focus:shadow-md"
        >
          {t("a11y.skip")}
        </a>

        {/* Pristine Ultra-Luxury Header */}
        <header
          className={cn(
            "sticky top-0 z-40 backdrop-blur-md px-3 sm:px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2.5 space-y-2 transition-all duration-300 transform-gpu will-change-[transform,background-color] [contain:paint]",
            isDark
              ? isScrolled
                ? "bg-[#0b0f19]/95 border-b border-white/10 shadow-[0_6px_24px_rgba(0,0,0,0.4)] text-white"
                : "bg-[#080a10]/90 border-b border-white/5 text-white"
              : isScrolled
                ? "bg-gradient-to-b from-[#FFFDF9]/95 via-[#FAF6F0]/95 to-[#F5EFEB]/90 border-b border-orange-950/15 shadow-[0_6px_24px_rgba(184,93,25,0.08)] text-gray-900"
                : "bg-gradient-to-b from-[#FFFDF9]/95 via-[#FAF6F0]/95 to-[#F5EFEB]/90 border-b border-orange-950/5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] text-gray-900"
          )}
        >
          {/* ROW 1: Authentic Indian Food Delivery Header: Logo + Delivery Address (Left) | Language + AI Support + Cart + Profile (Right) */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-3">
            {/* Row 1 Left: OrderKing or KingPay Logo (context-aware) + Delivery Address Selector */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              <Link to="/" className="flex items-center gap-1.5 no-underline group shrink-0">
                <div className="relative">
                  <OrderKingMark className="size-8 sm:size-9 transition-transform duration-300 group-hover:scale-105 drop-shadow-2xs" />
                  <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <span className={cn("text-base sm:text-lg font-black tracking-tight leading-none hidden xs:inline", isDark ? "text-white" : "text-gray-950")}>
                  OrderKing
                </span>
              </Link>

              {/* Delivery Address Selector (Location Pin): strictly for food delivery, hidden on KingPay/Travel */}
              {!isKingPayDomain && (
                <button
                  type="button"
                  onClick={() => setLocOpen(true)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-transparent transition-all max-w-[130px] xs:max-w-[170px] sm:max-w-[220px] group cursor-pointer",
                    isDark ? "hover:bg-white/10 hover:border-white/15 text-slate-200" : "hover:bg-orange-100/50 hover:border-orange-200/80 text-gray-900"
                  )}
                  title="Change delivery location"
                  aria-label="Select delivery address"
                >
                  <div className="relative shrink-0 flex items-center justify-center">
                    <MapPin className="size-3.5 sm:size-4 text-[#E85D04] group-hover:scale-110 transition-transform" />
                    <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-0.5 leading-tight">
                      <span className={cn("text-xs font-black truncate", isDark ? "text-white" : "text-gray-950")}>
                        {location?.zoneName && !["Current GPS Position", "Current Location", "Detected Location"].includes(location.zoneName) ? location.zoneName : location?.cityName && !["Locating...", "Current GPS Position"].includes(location.cityName) ? location.cityName : "Select Location"}
                      </span>
                      <ChevronDown className="size-3 text-gray-500 shrink-0 group-hover:translate-y-0.5 transition-transform" />
                    </div>
                    <span className="text-[10px] text-gray-500 truncate hidden xs:block leading-tight">
                      {location?.cityName && !["Locating...", "Current GPS Position"].includes(location.cityName) ? `${location.cityName}, India` : "Select location"}
                    </span>
                  </div>
                </button>
              )}
            </div>

            {/* Row 1 Center: Fork & Spoon "Food" and KingPay Symbol Pill '✈️ 🚆 🎓' */}
            <nav aria-label="OrderKing Core Navigation" className="flex items-center gap-1.5 sm:gap-2 shrink-0 py-0.5">
              {/* Minimal Micro-Pill 1: Food Delivery */}
              <Link
                to="/"
                title="OrderKing Food Delivery"
                aria-label="OrderKing Food Delivery"
                className={cn(
                  "inline-flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full border text-xs font-black transition-all shadow-[0_2px_4px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.2)] active:scale-95 no-underline shrink-0 cursor-pointer",
                  path === "/" || path.startsWith("/r/") || path.startsWith("/delivery") || path.startsWith("/dining")
                    ? isDark
                      ? "border-orange-500 bg-gradient-to-b from-orange-600/30 to-[#B85D19]/25 text-orange-200 ring-1 ring-orange-400/50 shadow-[0_0_12px_rgba(232,93,4,0.25)]"
                      : "border-orange-500 bg-gradient-to-b from-orange-100 to-orange-50 text-orange-950 ring-1 ring-orange-400 shadow-[0_2px_8px_rgba(232,93,4,0.2)]"
                    : isDark
                      ? "border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 hover:border-orange-400/40"
                      : "border-slate-200 bg-white/90 hover:bg-orange-50/80 text-gray-800 hover:border-orange-400/60"
                )}
              >
                <UtensilsCrossed className="size-3.5 sm:size-4 shrink-0" aria-hidden="true" />
                <span className="hidden md:inline text-[11px] font-black uppercase tracking-tight">Food</span>
              </Link>

              {/* KingPay Mode: Travel & AI Tutor */}
              <Link
                to="/travel"
                title="KingPay Super-App (Flights, Trains, AI Tutor)"
                aria-label="Flights, Trains, AI Tutor"
                className={cn(
                  "inline-flex items-center justify-center px-3 py-1.5 rounded-full border text-xs font-black transition-all shadow-[0_2px_4px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.2)] active:scale-95 no-underline shrink-0 cursor-pointer",
                  isKingPayDomain || path.startsWith("/tutor")
                    ? isDark
                      ? "border-sky-400 bg-gradient-to-b from-sky-500/30 to-indigo-600/20 text-sky-200 ring-1 ring-sky-400/50 shadow-[0_0_12px_rgba(14,165,233,0.25)]"
                      : "border-sky-500 bg-gradient-to-b from-sky-100 to-indigo-100 text-sky-950 ring-1 ring-sky-400 shadow-[0_2px_8px_rgba(14,165,233,0.2)]"
                    : isDark
                      ? "border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 hover:border-sky-400/40"
                      : "border-slate-200 bg-white/90 hover:bg-sky-50/80 text-gray-800 hover:border-sky-400/60"
                )}
              >
                <span className="inline-flex items-center gap-1.5 leading-none select-none" aria-hidden="true">
                  <Plane className="size-3.5 shrink-0" />
                  <Train className="size-3.5 shrink-0" />
                  <GraduationCap className="size-3.5 shrink-0" />
                </span>
              </Link>
            </nav>

            {/* Row 1 Right: 1-Tap Language + 1-Tap AI Support + Cart Icon with Counter + User Profile / Sign In */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Language Selector */}
              <button
                type="button"
                onClick={() => setLangOpen(true)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95 shrink-0 cursor-pointer border",
                  isDark
                    ? "bg-white/10 hover:bg-white/20 border-white/15 text-slate-200"
                    : "bg-white/80 hover:bg-orange-50 border-orange-200/80 text-gray-800 hover:border-orange-300"
                )}
                title="Change Language"
                aria-label="Select language"
              >
                <Languages className={cn("size-3.5", isDark ? "text-orange-400" : "text-[#B85D19]")} />
                <span className={cn("text-[11px] font-black uppercase", isDark ? "text-orange-300" : "text-orange-950")}>
                  {lang === "hi" ? "हिन्दी" : lang === "bn" ? "বাংলা" : (lang as string) === "as" ? "অসমীয়া" : "EN"}
                </span>
              </button>

              {/* Copper Pass VIP Pill (Beating Zomato Gold with Luxury Copper & Sunset Orange) */}
              <Link
                to="/rewards"
                className="flex items-center justify-center px-2 sm:px-2.5 py-1 rounded-full border border-orange-500/50 bg-gradient-to-r from-[#B85D19] via-[#E85D04] to-[#C2410C] text-white text-[9.5px] font-black uppercase tracking-tight shadow-[0_2px_8px_rgba(232,93,4,0.35)] hover:brightness-110 active:scale-95 no-underline shrink-0 cursor-pointer"
                title="OrderKing Copper Pass"
              >
                <span>COPPER ₹1</span>
              </Link>

              {/* Gold Crown Wallet - Direct link to KingPay */}
              <Link
                to="/kingpay"
                className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-950 bg-gradient-to-r from-[#B85D19]/35 via-[#E85D04]/25 to-[#9A3412]/30 border border-orange-500/70 text-orange-200 hover:border-orange-400 shadow-2xs hover:shadow-[0_0_12px_rgba(232,93,4,0.25)] transition-all active:scale-95 shrink-0 no-underline cursor-pointer"
                title="OrderKing Gold Crown Wallet &amp; KingPay"
                aria-label="Gold Crown Wallet"
              >
                <Crown className="size-3.5 text-orange-400 fill-orange-500" />
                <span className="text-[10.5px] font-black uppercase tracking-tight text-orange-300 hidden xs:inline">
                  Wallet
                </span>
              </Link>

              {/* Cart icon with badge counter (redirecting to /cart or opening drawer) - strictly for food delivery, hidden on KingPay/Travel */}
              {!isKingPayDomain && (
                <Link
                  to="/cart"
                  className={cn(
                    "relative flex items-center justify-center p-1.5 sm:p-2 rounded-xl shadow-2xs transition-all active:scale-95 shrink-0 no-underline cursor-pointer border",
                    isDark
                      ? "bg-white/10 hover:bg-white/20 border-white/15 text-white"
                      : "bg-white/80 hover:bg-orange-50 border-orange-200/80 text-gray-800 hover:border-orange-400"
                  )}
                  title="Shopping Cart"
                  aria-label={`Cart with ${count} items`}
                >
                  <ShoppingBag className={cn("size-4", isDark ? "text-white" : "text-gray-900")} />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 flex min-w-4 h-4 px-1 items-center justify-center rounded-full bg-gradient-to-r from-[#B85D19] via-[#E85D04] to-[#C2410C] text-[9px] font-black text-white shadow-2xs ring-1 ring-white">
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </Link>
              )}

              {/* User profile avatar / standard top-right user menu with fallback avatar */}
              {isPending ? (
                <div className="size-7 sm:size-8 animate-pulse rounded-full bg-orange-100 shrink-0" />
              ) : user ? (
                <div className="relative shrink-0" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className={cn(
                      "flex items-center gap-1 p-0.5 rounded-full border transition no-underline shadow-2xs shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-400/50",
                      isDark
                        ? "border-orange-500/60 bg-slate-900 hover:bg-slate-800 text-white"
                        : "border-orange-300/90 bg-white/95 hover:bg-orange-50 hover:border-orange-400 text-gray-900"
                    )}
                    title="Your Profile & Account Menu"
                    aria-label="Account and Profile Menu"
                    aria-expanded={userMenuOpen}
                  >
                    <DeviceAvatar
                      userId={user.id}
                      name={user.displayName}
                      imageUrl={user.profileImageUrl}
                      profileImageUrl={user.profileImageUrl}
                    />
                    <ChevronDown className={cn("size-3 text-orange-700 transition-transform duration-200 hidden xs:block mr-0.5", userMenuOpen && "rotate-180")} />
                  </button>

                  {/* Standard Top-Right User Menu Dropdown */}
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-orange-900/10 bg-white/95 backdrop-blur-xl shadow-xl shadow-orange-950/10 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      {/* User Identity Header with Clean Avatar & Fallback */}
                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-r from-orange-50/90 via-stone-50 to-orange-50/70 border border-orange-200/60 mb-1.5">
                        <DeviceAvatar
                          userId={user.id}
                          name={user.displayName}
                          imageUrl={user.profileImageUrl}
                          profileImageUrl={user.profileImageUrl}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-black text-gray-950 truncate">
                            {user.displayName || "Valued Customer"}
                          </span>
                          <span className="text-[10px] text-gray-500 truncate">
                            {user.primaryEmail || "Authenticated Patron"}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-orange-800 mt-0.5">
                            <Crown className="size-2.5 fill-[#E85D04] text-[#B85D19]" /> Verified Patron
                          </span>
                        </div>
                      </div>

                      {/* Menu Navigation Links */}
                      <div className="space-y-0.5 text-xs font-semibold text-gray-700">
                        <Link
                          to="/account"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-orange-50 hover:text-orange-950 transition no-underline"
                        >
                          <User className="size-4 text-[#E85D04]" />
                          <span>Profile &amp; Addresses</span>
                        </Link>

                        <Link
                          to="/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-orange-50 hover:text-orange-950 transition no-underline"
                        >
                          <Package className="size-4 text-[#E85D04]" />
                          <span>My Orders &amp; Passes</span>
                        </Link>

                        <Link
                          to="/kingpay"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-orange-50 hover:text-orange-950 transition no-underline"
                        >
                          <CreditCard className="size-4 text-[#E85D04]" />
                          <span>KingPay &amp; Crowns</span>
                        </Link>

                        <Link
                          to="/tutor"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-orange-50 hover:text-orange-950 transition no-underline"
                        >
                          <GraduationCap className="size-4 text-[#E85D04]" />
                          <span>King Tutor &amp; Solutions</span>
                        </Link>

                        <Link
                          to="/tutor-jobs"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-orange-50 hover:text-orange-950 transition no-underline"
                        >
                          <Briefcase className="size-4 text-[#E85D04]" />
                          <span>King Job &amp; Careers</span>
                        </Link>

                        <Link
                          to="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-orange-50 hover:text-orange-950 transition no-underline border-b border-gray-100 pb-2 mb-1"
                        >
                          <Settings className="size-4 text-[#E85D04]" />
                          <span>Preferences</span>
                        </Link>

                        <Link
                          to="/login"
                          onClick={(e) => { e.preventDefault(); setUserMenuOpen(false); setPhoneSession(null); void signOut("/").catch(() => { window.location.href = "/"; }); }} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-700 hover:text-rose-900 transition no-underline font-bold"
                        >
                          <LogOut className="size-4 text-rose-500" />
                          <span>Sign Out</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <SignedOut>
                  <Link
                    to="/login"
                    className="flex items-center gap-1 rounded-xl border border-orange-500/80 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-2 sm:px-2.5 py-1 text-orange-300 shadow-2xs no-underline transition hover:border-orange-400 active:scale-95 shrink-0"
                    aria-label="Sign in"
                  >
                    <span className="text-[10.5px] font-black uppercase tracking-wider">Sign In</span>
                  </Link>
                </SignedOut>
              )}
            </div>
          </div>

        {/* ROW 2: Zomato 1:1 Search Bar + Voice Mic + VEG MODE Switch */}
        {hasSearchRow && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              {/* Center Search (Glassmorphism, rounded pill) */}
              <button
                type="button"
                onClick={() => (onSearch ? onSearch() : void navigate({ to: "/search" }))}
                className="flex-1 flex h-10 sm:h-11 items-center gap-2.5 rounded-2xl border border-stone-200/90 bg-stone-100/90 backdrop-blur-md hover:bg-white hover:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 px-3.5 text-left text-gray-500 transition-all shadow-2xs min-w-0 group cursor-pointer"
              >
                <Search className="size-4 shrink-0 text-stone-500 group-hover:scale-110 transition-transform" aria-hidden />
                <div className="relative flex-1 h-4 overflow-hidden">
                  <span
                    key={searchPlaceholderIndex}
                    className="absolute inset-0 text-xs sm:text-sm text-stone-600 font-medium truncate transition-all duration-300"
                  >
                    {currentPlaceholder.includes("...")
                      ? currentPlaceholder
                      : `Search "${currentPlaceholder}"`}
                  </span>
                </div>
              </button>

              {/* Microphone Voice Search Button */}
              <button
                type="button"
                onClick={() => setVoiceOpen(true)}
                className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 shadow-2xs transition-all active:scale-95 cursor-pointer"
                aria-label="Search with voice"
                title="Search with voice"
              >
                <Mic className="size-4" />
              </button>

              {/* VEG MODE Toggle Switch (1:1 with Zomato live screenshot) */}
              <div
                role="group"
                aria-label="Food preference"
                className="flex flex-col items-center justify-center shrink-0 pl-1 select-none"
              >
                <span className="text-[8px] font-black uppercase tracking-wider text-emerald-950 leading-none">VEG</span>
                <span className="text-[8px] font-black uppercase tracking-wider text-emerald-800 leading-tight">MODE</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={dietFilter === "veg"}
                  onClick={() => setDietFilter(dietFilter === "veg" ? "all" : "veg")}
                  className={cn(
                    "mt-0.5 relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    dietFilter === "veg" ? "bg-emerald-600" : "bg-stone-300"
                  )}
                  title={dietFilter === "veg" ? "Switch to All Mode" : "Switch to Veg Mode"}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                      dietFilter === "veg" ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </button>
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
        {count > 0 && !isKingPayDomain && path !== "/cart" && path !== "/checkout" ? (
          <div className="pointer-events-none fixed inset-x-0 bottom-20 z-40 flex flex-col items-center justify-center px-4 gap-1.5">
            <div className="pointer-events-auto flex min-h-12 w-full max-w-md items-center justify-between rounded-2xl bg-gradient-to-r from-stone-950 via-[#1c130d] to-stone-950 px-3.5 py-2.5 text-white shadow-[0_12px_36px_rgba(0,0,0,0.45)] transition-all font-bold border border-orange-500/60 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-xl bg-gradient-to-br from-[#B85D19] via-[#E85D04] to-[#C2410C] text-white text-xs font-black shadow-md">
                  {count}
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-wider text-orange-200 leading-none">
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
                  className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#B85D19] via-[#E85D04] to-[#C2410C] px-3 py-1.5 text-xs font-black text-white shadow-md hover:brightness-105 active:scale-95 transition-all border border-orange-400/40 cursor-pointer"
                >
                  <Crown className="size-3.5 fill-white text-white" />
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
      <CustomerFloatingBottomNav onOpenAi={() => setConciergeOpen(true)} />

        {/* 1-TAP CHECKOUT DRAWER */}
        {oneTapDrawerOpen && (
          <OneTapCheckoutDrawer open={oneTapDrawerOpen} onClose={() => setOneTapDrawerOpen(false)} />
        )}

      {voiceOpen ? (
        <ModalErrorBoundary onClose={() => setVoiceOpen(false)} componentName="Voice Search">
          <Suspense fallback={null}>
            <LazyVoiceSearchDialog
              isOpen={voiceOpen}
              onClose={() => setVoiceOpen(false)}
              onSearch={(query: string) => {
                setVoiceOpen(false);
                void navigate({ to: "/search", search: { q: query } });
              }}
            />
          </Suspense>
        </ModalErrorBoundary>
      ) : null}

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
    </div>
  );
}
