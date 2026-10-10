
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ClipboardList, House, QrCode, Search, ShoppingBag, UserRound, Wallet, Zap, GraduationCap, Globe, Gift, Headset, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { Wordmark } from "@/components/brand/wordmark";
import { LocationDialog } from "@/components/market/location-dialog";
import { LanguageSelectorModal, ALL_INDIAN_LANGUAGES } from "@/components/common/language-selector-modal";
import { useBrand, useT } from "@/components/providers";
import { cartCount, useCartStore } from "@/lib/stores/cart";
import { useLocationStore } from "@/lib/stores/location";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { cn } from "@/lib/utils";
import { isDeliveryActiveInLocation } from "@/lib/geo/geofence-guard";import { useThemeStore } from "@/lib/stores/theme";

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
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [locOpen, setLocOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    // If empty on first load, initialize with system preference
    const saved = localStorage.getItem("theme-storage");
    if (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.add("dark"); document.documentElement.style.backgroundColor = "#000000";
    }
  }, []);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-zinc-950 pb-24 md:max-w-5xl transition-colors duration-300">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:bg-surface focus:px-3 focus:py-2"
      >
        {t("a11y.skip")}
      </a>
      <header className="sticky top-0 z-30 bg-zinc-950 border-b border-zinc-800 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="shrink-0 max-w-[50%]">
            <Wordmark />
            <span className="block text-[10px] font-medium tracking-wide text-zinc-400 break-words text-wrap">
              {isDeliveryActive ? "Culinary Excellence" : "Secure Payments"}
            </span>
          </div>

          {/* 👑 DYNAMIC TRAVEL & Pay PILL */}
            <Link
              to="/king-pay"
              className="group flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/30 transition-all active:scale-95 hover:scale-105 no-underline ml-auto border border-white/20"
            >
              <span className="text-sm drop-shadow-md">👑</span>
              <span className="text-sm drop-shadow-md">✈️</span>
              <span className="text-sm drop-shadow-md">🏨</span>
              <span className="text-sm drop-shadow-md">🚆</span>
            </Link>

          <div className="flex items-center gap-2 shrink-0">
            {/* Share/Promotion */}
            <Link
              to="/rewards"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white hover:bg-zinc-800"
              aria-label="Share & Earn"
            >
              <Gift className="h-4 w-4" />
            </Link>


            
            <button
              type="button"
              onClick={() => setLangOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-muted hover:text-fg"
              aria-label="Change Language"
            >
              <Globe className="h-4 w-4" />
            </button>
            
            {isPending ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-surface-2" />
            ) : user ? (
              <SignedIn>
                <UserButton />
              </SignedIn>
            ) : (
              <SignedOut>
                <Link to="/login" className="text-sm font-medium text-primary ml-1">
                  {t("common.signIn")}
                </Link>
              </SignedOut>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={() => setLocOpen(true)}
            className={`flex h-11 min-w-0 max-w-[40%] items-center justify-center rounded-full px-3 text-left shrink-0 border ${
              isDeliveryActive
                ? "bg-surface border-border hover:bg-surface-2 transition-colors"
                : "bg-zinc-900 border-zinc-800"
            }`}
          >
            <div className="flex flex-col min-w-0 w-full">
              <span className="text-[9px] uppercase tracking-wide text-zinc-400 font-medium truncate">
                {isDeliveryActive ? t("home.deliveringTo") : "Payments"}
              </span>
              <span className="text-xs font-medium truncate text-white">
                {isDeliveryActive ? location.label : location.cityName || location.label}
              </span>
            </div>
          </button>
          
          {path !== "/search" ? (
            <button
              type="button"
              onClick={() => (onSearch ? onSearch() : void navigate({ to: "/search" }))}
              className="flex h-11 flex-1 min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-left text-slate-300 hover:bg-white/10 transition-colors shadow-sm"
            >
              <Search className="size-4 shrink-0 text-primary" aria-hidden />
              <span className="text-xs truncate">
                {isDeliveryActive ? t("home.searchPlaceholder") : "Search payments..."}
              </span>
            </button>
          ) : (
             <div className="flex-1" />
          )}
        </div>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
      {isDeliveryActive && count > 0 && path !== "/cart" && path !== "/checkout" ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-20 z-30 flex justify-center px-4">
          <Link
            to="/cart"
            className="pointer-events-auto flex min-h-12 w-full max-w-lg items-center justify-between rounded-[var(--radius-xl)] bg-primary px-4 text-primary-fg no-underline shadow-md md:max-w-5xl"
          >
            <span>
              {count} {count === 1 ? t("cart.item") : t("cart.items")}
            </span>
            <span className="inline-flex items-center gap-2">
              <ShoppingBag className="size-4" aria-hidden />
              {t("cart.view")}
            </span>
          </Link>
        </div>
      ) : null}
                  {!path.startsWith("/king-pay") ? (
        <nav
            aria-label={brand.appName}
            className="fixed bottom-4 left-4 right-4 z-40 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-md overflow-hidden"
          >
            <ul className="mx-auto grid max-w-lg grid-cols-5 items-center justify-items-center relative px-2 py-1">
            <NavItem to="/" icon={House} label="Home" active={path === "/"} colorClass="text-white" />
            <NavItem to="/orders" icon={ClipboardList} label="Orders" active={path.startsWith("/orders")} colorClass="text-white" />
            
            
            <li className="relative -top-2 flex w-full justify-center">
              <Link
                to="/king-pay"
                className={cn(
                  "group relative flex h-14 w-14 flex-col items-center justify-center rounded-full border-4 border-zinc-950 text-xs no-underline shadow-lg transition-all active:scale-95",
                  path.startsWith("/king-pay")
                    ? "bg-white text-black"
                    : "bg-zinc-800 text-white hover:bg-zinc-700"
                )}
              >
                <Wallet className="h-5 w-5" />
                <span className="text-[10px] font-medium mt-1">Pay</span>
                {!path.startsWith("/king-pay") && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 border border-zinc-950 text-[10px] font-bold text-white shadow-sm">
                    1
                  </span>
                )}
              </Link>
            </li>
            
            <NavItem to="/tutor" icon={GraduationCap} label="AI Tutor" active={path.startsWith("/tutor")} colorClass="text-white" />
            <NavItem to="/account" icon={UserRound} label="Profile" active={path.startsWith("/account")} colorClass="text-white" />
          </ul>
        </nav>
      ) : (
        <div className="fixed bottom-6 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <Link
            to="/"
            className="pointer-events-auto flex items-center justify-center gap-3 w-full max-w-sm rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-rose-600 px-6 py-4 text-lg font-black text-white shadow-[0_10px_40px_rgba(249,115,22,0.5)] active:scale-95 transition-all no-underline border-2 border-white/20 hover:brightness-110"
            style={{ animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}
          >
            <span className="text-2xl drop-shadow-lg">🍔</span>
            <span className="drop-shadow-md uppercase tracking-wide text-center leading-tight">Craving Food?<br/><span className="text-[11px] opacity-90">Tap to Order Now!</span></span>
            <span className="text-2xl drop-shadow-lg">🍕</span>
          </Link>
        </div>
      )}
      <LocationDialog open={locOpen} onOpenChange={setLocOpen} />
      <LanguageSelectorModal
        isOpen={langOpen}
        onClose={() => setLangOpen(false)}
        selectedCode={lang}
        onSelectLanguage={(l) => {
          setLang(l.code as any);
        }}
      />
    </div>
  );
}

function NavItem({
    to,
    icon: Icon,
    label,
    active,
    badge,
    colorClass
  }: {
    to: string;
    icon: typeof House;
    label: string;
    active: boolean;
    badge?: number | string;
    colorClass?: string;
  }) {
    return (
      <li className="w-full flex justify-center py-2">
        <Link
          to={to}
          className={cn(
            "flex flex-col items-center justify-center gap-1 text-[10px] sm:text-[11px] no-underline relative transition-colors",
            active ? (colorClass || "text-emerald-400") + " font-black drop-shadow-md scale-105" : "text-slate-300 hover:text-white font-medium",
          )}
      >
        <div className="relative flex items-center justify-center h-6 w-6">
          <Icon className={cn("size-5 sm:size-5.5 transition-transform", active && "scale-110")} aria-hidden />
          {badge !== undefined && (
            <span className="absolute -right-2 -top-1 flex min-h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white shadow-xs">
              {badge}
            </span>
          )}
        </div>
        <span className="text-center truncate w-full px-0.5">{label}</span>
      </Link>
    </li>
  );
}
