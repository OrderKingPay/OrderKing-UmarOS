import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ClipboardList, House, QrCode, Search, ShoppingBag, UserRound, Wallet, Zap } from "lucide-react";
import { useState } from "react";
import { Wordmark } from "@/components/brand/wordmark";
import { LocationDialog } from "@/components/market/location-dialog";
import { useBrand, useT } from "@/components/providers";
import { cartCount, useCartStore } from "@/lib/stores/cart";
import { useLocationStore } from "@/lib/stores/location";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { cn } from "@/lib/utils";
import { FoodAiConcierge } from "@/components/ai/food-ai-concierge";
import { isDeliveryActiveInLocation } from "@/lib/geo/geofence-guard";

export function CustomerShell({
  children,
  onSearch,
}: {
  children: React.ReactNode;
  onSearch?: () => void;
}) {
  const { t } = useT();
  const { brand } = useBrand();
  const location = useLocationStore((s) => s.location);
  const isDeliveryActive = isDeliveryActiveInLocation(location.lat, location.lng, location.cityId);
  const items = useCartStore((s) => s.items);
  const count = cartCount(items);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [locOpen, setLocOpen] = useState(false);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-bg pb-24 md:max-w-5xl">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:bg-surface focus:px-3 focus:py-2"
      >
        {t("a11y.skip")}
      </a>
      <header className="sticky top-0 z-30 border-b border-border bg-bg/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="shrink-0">
            <Wordmark />
            <span className="block text-[10px] font-medium tracking-wide text-primary/80">
              {isDeliveryActive ? "Have it your way, King 👑" : "King Pay · Sovereign UPI Across India 👑"}
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
            {isPending ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-surface-2" />
            ) : user ? (
              <SignedIn>
                <UserButton />
              </SignedIn>
            ) : (
              <SignedOut>
                <Link to="/login" className="text-sm font-medium text-primary">
                  {t("common.signIn")}
                </Link>
              </SignedOut>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setLocOpen(true)}
          className={`mt-3 flex min-h-11 w-full items-center justify-between rounded-[var(--radius-lg)] px-3 text-left ${
            isDeliveryActive
              ? "bg-surface"
              : "bg-amber-500/10 border border-amber-400/40"
          }`}
        >
          <span>
            <span className="block text-xs uppercase tracking-wide text-muted">
              {isDeliveryActive ? t("home.deliveringTo") : "👑 King Pay Sovereign Territory"}
            </span>
            <span className="block font-medium">
              {isDeliveryActive ? location.label : `${location.cityName || location.label} · 0% UPI Active`}
            </span>
          </span>
          <span className="text-sm text-primary">{t("home.changeLocation")}</span>
        </button>
        {path !== "/search" && (
          <button
            type="button"
            onClick={() => (onSearch ? onSearch() : void navigate({ to: "/search" }))}
            className="mt-2 flex min-h-11 w-full items-center gap-2 rounded-[var(--radius-lg)] border border-border bg-surface px-3 text-left text-muted"
          >
            <Search className="size-4" aria-hidden />
            {isDeliveryActive ? t("home.searchPlaceholder") : "Search King Pay UPI, Bills, Recharges & Flights..."}
          </button>
        )}
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
      <nav
        aria-label={brand.appName}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      >
        {isDeliveryActive ? (
          <ul className="mx-auto grid max-w-lg grid-cols-5 items-center md:max-w-5xl relative">
            <NavItem to="/" icon={House} label={t("common.home")} active={path === "/"} />
            <NavItem to="/search" icon={Search} label={t("common.search")} active={path.startsWith("/search")} />
            <NavItem
              to="/cart"
              icon={ShoppingBag}
              label={t("common.cart")}
              active={path.startsWith("/cart")}
              badge={count > 0 ? count : undefined}
            />
            <NavItem to="/orders" icon={ClipboardList} label={t("common.orders")} active={path.startsWith("/orders")} />
            <NavItem to="/account" icon={UserRound} label={t("common.account")} active={path.startsWith("/account")} />
          </ul>
        ) : (
          <ul className="mx-auto grid max-w-lg grid-cols-4 items-center md:max-w-5xl relative">
            <NavItem to="/king-pay" icon={Wallet} label="King Pay" active={path === "/" || path === "/king-pay"} highlight={true} />
            <NavItem to="/king-pay?scan=true" icon={QrCode} label="Scan & Pay" active={false} />
            <NavItem to="/orders" icon={ClipboardList} label="Passbook" active={path.startsWith("/orders")} />
            <NavItem to="/account" icon={UserRound} label={t("common.account")} active={path.startsWith("/account")} />
          </ul>
        )}
      </nav>
      {/* Floating Assistive Food AI Voice Concierge (Only when delivery active) */}
      {isDeliveryActive && <FoodAiConcierge />}
      <LocationDialog open={locOpen} onOpenChange={setLocOpen} />
    </div>
  );
}

function NavItem({
  to,
  icon: Icon,
  label,
  active,
  highlight,
  badge,
}: {
  to: string;
  icon: typeof House;
  label: string;
  active: boolean;
  highlight?: boolean;
  badge?: number | string;
}) {
  return (
    <li>
      <Link
        to={to}
        className={cn(
          "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs no-underline relative",
          active
            ? "text-primary font-semibold"
            : highlight
              ? "text-primary/90 font-medium"
              : "text-muted",
        )}
      >
        <div className="relative">
          <Icon className={cn("size-5", highlight && "text-primary")} aria-hidden />
          {badge !== undefined && (
            <span className="absolute -right-2.5 -top-1.5 flex min-size-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white shadow-xs">
              {badge}
            </span>
          )}
          {highlight && badge === undefined && (
            <span className="absolute -right-2 -top-1 size-2 rounded-full bg-emerald-500 ring-2 ring-surface animate-pulse" />
          )}
        </div>
        <span>{label}</span>
      </Link>
    </li>
  );
}
