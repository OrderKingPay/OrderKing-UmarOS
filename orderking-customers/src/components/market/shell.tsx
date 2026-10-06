
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
      useThemeStore.getState().setTheme("dark");
    }
  }, []);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-bg pb-24 md:max-w-5xl transition-colors duration-300">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:bg-surface focus:px-3 focus:py-2"
      >
        {t("a11y.skip")}
      </a>
      <header className="sticky top-0 z-30 border-b border-border bg-bg/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="shrink-0 max-w-[50%]">
            <Wordmark />
            <span className="block text-[10px] font-medium tracking-wide text-primary/80 break-words text-wrap">
              {isDeliveryActive ? "Have It Your Way" : "King Pay · Sovereign UPI Across India 👑"}
            </span>
          </div>

          {/* 👑 DYNAMIC 3D KINGPAY & ZERO-FEE PROMOTION PILL */}
          <Link
            to="/king-pay"
            className="group flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/15 via-yellow-500/20 to-emerald-500/15 border border-amber-400/50 hover:border-amber-300 text-[10px] sm:text-[11px] font-bold text-slate-200 transition-all active:scale-95 hover:scale-105 shadow-[0_2px_12px_rgba(245,158,11,0.2)] no-underline mx-auto truncate"
          >
            <span className="text-xs shrink-0">👑</span>
            <span className="font-display font-black text-amber-400 whitespace-nowrap">
              KingPay
            </span>
            <span className="text-emerald-400 font-extrabold whitespace-nowrap">
              0% Fee · ₹40 Cash
            </span>
            <span className="hidden sm:inline text-amber-300 font-mono shrink-0">
              ⚡ 15m
            </span>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            {/* Share/Promotion */}
            <Link
              to="/rewards"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
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
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-muted hover:text-fg"
              aria-label="Toggle Theme"
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
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
                : "bg-amber-500/10 border-amber-400/40"
            }`}
          >
            <div className="flex flex-col min-w-0 w-full">
              <span className="text-[9px] uppercase tracking-wide text-muted font-bold truncate">
                {isDeliveryActive ? t("home.deliveringTo") : "👑 King Pay"}
              </span>
              <span className="text-xs font-bold truncate text-fg">
                {isDeliveryActive ? location.label : location.cityName || location.label}
              </span>
            </div>
          </button>
          
          {path !== "/search" ? (
            <button
              type="button"
              onClick={() => (onSearch ? onSearch() : void navigate({ to: "/search" }))}
              className="flex h-11 flex-1 min-w-0 items-center gap-2 rounded-full border border-border bg-surface px-4 text-left text-muted hover:bg-surface-2 transition-colors shadow-sm"
            >
              <Search className="size-4 shrink-0 text-primary" aria-hidden />
              <span className="text-xs truncate">
                {isDeliveryActive ? t("home.searchPlaceholder") : "Search King Pay, Bills..."}
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
          className="fixed bottom-4 left-4 right-4 z-40 rounded-3xl border border-black/5 bg-white/80 pb-0 backdrop-blur-lg shadow-[0_8px_32px_rgba(0,0,0,0.08)] overflow-hidden"
        >
          <ul className="mx-auto grid grid-cols-5 items-center justify-items-center relative px-2">
            <NavItem to="/" icon={House} label="Home" active={path === "/"} />
            <NavItem to="/orders" icon={ClipboardList} label="Orders" active={path.startsWith("/orders")} />
            
            {/* 👑 Glowing KingPay Tab */}
            <li className="relative -top-2 flex w-full justify-center">
              <Link
                to="/king-pay"
                className={cn(
                  "group relative flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-full border-2 text-xs no-underline shadow-md transition-all active:scale-95",
                  path.startsWith("/king-pay")
                    ? "border-amber-400 bg-gradient-to-br from-amber-400 to-yellow-600 text-white shadow-[0_0_15px_rgba(251,191,36,0.4)]"
                    : "border-transparent bg-gradient-to-br from-amber-100 to-amber-200 text-amber-900 shadow-[0_0_10px_rgba(251,191,36,0.2)] hover:border-amber-300"
                )}
              >
                <span className="text-lg leading-none">👑</span>
                <span className="text-[8px] font-black tracking-tight leading-none">KingPay</span>
                {!path.startsWith("/king-pay") && (
                  <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white shadow-sm">
                    1
                  </span>
                )}
              </Link>
            </li>
            <NavItem to="/tutor" icon={GraduationCap} label="AI Tutor" active={path.startsWith("/tutor")} />
            <NavItem to="/account" icon={UserRound} label="Profile" active={path.startsWith("/account")} />
          </ul>
        </nav>
      ) : (
        <div className="fixed bottom-4 left-4 right-4 z-40 flex justify-center pointer-events-none">
          <Link
            to="/"
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-xl active:scale-95 transition-transform border border-slate-700 no-underline"
          >
            <House className="size-4" />
            Back to Order King
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
}: {
  to: string;
  icon: typeof House;
  label: string;
  active: boolean;
  badge?: number | string;
}) {
  return (
    <li className="w-full flex justify-center py-2">
      <Link
        to={to}
        className={cn(
          "flex flex-col items-center justify-center gap-1 text-[10px] sm:text-xs no-underline relative transition-colors",
          active ? "text-primary font-bold" : "text-slate-500 hover:text-slate-700 font-medium",
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
