import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ClipboardList, House, QrCode, Search, ShoppingBag, UserRound, Wallet, Zap, GraduationCap, Globe, Navigation, ChevronDown, Bell, Sparkles, Leaf, Bot } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wordmark } from "@/components/brand/wordmark";
import { LocationDialog } from "@/components/market/location-dialog";
import { LanguageSelectorModal } from "@/components/common/language-selector-modal";
import { useBrand, useT } from "@/components/providers";
import { cartCount, useCartStore } from "@/lib/stores/cart";
import { useLocationStore } from "@/lib/stores/location";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { cn } from "@/lib/utils";
import { isDeliveryActiveInLocation } from "@/lib/geo/geofence-guard";

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
  const [scrolled, setScrolled] = useState(false);
  const [vegMode, setVegMode] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-[#030303] text-white pb-24 md:max-w-5xl selection:bg-fuchsia-500/30">
      {/* GLOBAL PREMIUM BACKGROUNDS (Kept subtle for content readability) */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-fuchsia-500/5 blur-[120px]" />
         <div className="absolute top-[20%] right-[-10%] h-[50%] w-[30%] rounded-full bg-cyan-500/5 blur-[100px]" />
      </div>

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] focus:px-3 focus:py-2"
      >
        {t("a11y.skip")}
      </a>

      {/* 100x PREMIUM HEADER - DYNAMIC ISLAND STYLE */}
      <header 
        className={cn(
          "sticky top-0 z-40 transition-all duration-300 ease-in-out px-3 pt-[max(0.75rem,env(safe-area-inset-top))]",
          scrolled ? "py-2" : "py-3"
        )}
      >
        <motion.div 
          layout
          className={cn(
            "relative mx-auto flex flex-col gap-3 rounded-3xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden",
            scrolled 
              ? "bg-[#0a0a0a]/80 backdrop-blur-3xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-white/10 px-4 py-3" 
              : "bg-transparent px-2"
          )}
        >
          {scrolled && (
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          )}

          <div className="flex items-center justify-between gap-3 relative z-10">
            {/* BRAND & TAGLINE */}
            <div className="shrink-0 max-w-[50%] group">
              <div className="transition-transform group-hover:scale-[1.02] active:scale-95 duration-300 origin-left">
                 <Wordmark />
              </div>
              <AnimatePresence>
                {!scrolled && (
                  <motion.span 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="block text-[10px] font-medium tracking-wide text-primary/80 break-words text-wrap mt-0.5"
                  >
                    {isDeliveryActive ? "Have it your way, King 👑" : "King Pay · Sovereign UPI Across India 👑"}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* THE KINGPAY 3D PILL */}
            {!isDeliveryActive && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/king-pay"
                  className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 via-amber-400/20 to-orange-500/10 border border-amber-500/30 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] text-[11px] font-bold text-slate-800 dark:text-slate-200 transition-all no-underline backdrop-blur-md"
                >
                  <span className="text-[10px] shrink-0">👑</span>
                  <span className="font-display font-black bg-gradient-to-br from-amber-600 to-orange-500 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent whitespace-nowrap">
                    KingPay
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold whitespace-nowrap">
                    0% Fee
                  </span>
                </Link>
              </motion.div>
            )}

            {/* AVATAR & CONTROLS */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setLangOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors backdrop-blur-md border border-white/10 shadow-sm"
                aria-label="Change Language"
              >
                <Globe className="h-4 w-4" />
              </button>
              {isPending ? (
                <div className="h-9 w-9 animate-pulse rounded-full bg-white/10 backdrop-blur-md border border-white/10" />
              ) : user ? (
                <SignedIn>
                  <div className="shadow-lg rounded-full overflow-hidden border border-white/10 transition-transform hover:scale-105 active:scale-95">
                     <UserButton />
                  </div>
                </SignedIn>
              ) : (
                <SignedOut>
                  <Link to="/login" className="flex h-9 items-center px-4 rounded-full bg-white text-black text-sm font-bold shadow-md transition-transform hover:scale-105 active:scale-95 hover:bg-zinc-200">
                    {t("common.signIn")}
                  </Link>
                </SignedOut>
              )}
            </div>
          </div>

          {/* DYNAMIC SEARCH & LOCATION BAR */}
          <AnimatePresence>
            {!scrolled && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="flex flex-col gap-3 relative z-10"
              >
                <button
                  type="button"
                  onClick={() => setLocOpen(true)}
                  className={cn(
                    "group flex min-h-12 w-full items-center justify-between rounded-2xl px-4 text-left transition-all hover:bg-white/5 mt-1",
                    isDeliveryActive
                      ? "bg-[#0a0a0a] border border-white/10 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                      : "bg-amber-500/5 border border-amber-400/30"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Navigation className="h-4 w-4" />
                    </div>
                    <span className="flex-1 min-w-0 pr-2">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 break-words text-wrap">
                        {isDeliveryActive ? t("home.deliveringTo") : "👑 King Pay Sovereign Territory"}
                      </span>
                      <span className="block text-sm font-semibold text-white break-words text-wrap truncate">
                        {isDeliveryActive ? location.label : `${location.cityName || location.label} · 0% UPI Active`}
                      </span>
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-y-0.5" />
                </button>

                {path !== "/search" && (
                  <div className="flex items-center w-full gap-2 h-14">
                    {/* Left (20%): AI Support Assistant */}
                    <button type="button" className="flex-[0.2] h-full flex items-center justify-center rounded-2xl border border-white/10 bg-[#0a0a0a] hover:bg-white/5 transition-all shadow-sm text-zinc-300 hover:text-white">
                      <Sparkles className="size-5" />
                    </button>
                    
                    {/* Center (60%): Massive Search Bar */}
                    <button
                      type="button"
                      onClick={() => (onSearch ? onSearch() : void navigate({ to: "/search" }))}
                      className="flex-[0.6] h-full flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0a0a0a] backdrop-blur-xl px-4 text-left shadow-[0_2px_10px_rgba(0,0,0,0.3)] transition-all hover:shadow-[0_4px_15px_rgba(0,0,0,0.5)] hover:bg-white/5"
                    >
                      <Search className="size-5 text-primary/70 shrink-0" aria-hidden />
                      <span className="text-sm font-medium text-zinc-400 truncate">
                        {isDeliveryActive ? t("home.searchPlaceholder") : "Search King Pay UPI..."}
                      </span>
                    </button>
                    
                    {/* Right (20%): Veg Mode Toggle */}
                    <button 
                      type="button" 
                      onClick={() => setVegMode(!vegMode)}
                      className={cn(
                        "flex-[0.2] h-full flex items-center justify-center rounded-2xl border transition-all shadow-sm",
                        vegMode ? "bg-green-500/10 border-green-500/30 text-green-500" : "border-white/10 bg-[#0a0a0a] hover:bg-white/5 text-zinc-400"
                      )}
                    >
                      <Leaf className="size-5" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </header>

      <main id="main" className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
           <motion.div
             key={path}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
           >
             {children}
           </motion.div>
        </AnimatePresence>
      </main>

      {/* FLOATING ACTION CART */}
      <AnimatePresence>
        {isDeliveryActive && count > 0 && path !== "/cart" && path !== "/checkout" && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4"
          >
            <Link
              to="/cart"
              className="pointer-events-auto flex min-h-14 w-full max-w-[300px] md:max-w-[400px] items-center justify-between rounded-full bg-[#0a0a0a] px-5 text-white shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-transform hover:scale-105 active:scale-95 no-underline border border-white/10 backdrop-blur-xl"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 dark:bg-black/10">
                  <span className="text-sm font-bold">{count}</span>
                </div>
                <span className="font-semibold tracking-wide">
                  {count === 1 ? t("cart.item") : t("cart.items")} Added
                </span>
              </div>
              <span className="inline-flex items-center gap-2 font-bold uppercase tracking-wider text-[10px] bg-white/10 dark:bg-black/10 px-3 py-1.5 rounded-full">
                {t("cart.view")} <ChevronDown className="size-3 -rotate-90" />
              </span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PREMIUM GLASS BOTTOM NAVIGATION */}
      <nav
        aria-label={brand.appName}
        className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none"
      >
        <div className="mx-auto max-w-md md:max-w-xl pointer-events-auto">
          <div className="rounded-[2rem] border border-white/10 bg-[#0a0a0a]/90 backdrop-blur-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.6)] p-2">
            {isDeliveryActive ? (
              <ul className="grid grid-cols-4 items-center">
                <NavItem to="/" icon={House} label={t("common.home")} active={path === "/"} />
                <NavItem to="/orders" icon={ClipboardList} label={t("common.orders")} active={path.startsWith("/orders")} />
                <NavItem to="/king-pay" icon={Zap} label="King Pay" active={path.startsWith("/king-pay")} highlight={true} />
                <NavItem to="/account" icon={UserRound} label={t("common.account")} active={path.startsWith("/account")} />
              </ul>
            ) : (
              <ul className="grid grid-cols-5 items-center">
                <NavItem to="/king-pay" icon={Wallet} label="King Pay" active={path === "/" || path === "/king-pay"} highlight={true} />
                <NavItem to="/tutor" icon={GraduationCap} label="Tutor" active={path.startsWith("/tutor")} highlight={true} badge="Free" />
                <NavItem to="/king-pay?scan=true" icon={QrCode} label="Scan & Pay" active={false} />
                <NavItem to="/orders" icon={ClipboardList} label="Passbook" active={path.startsWith("/orders")} />
                <NavItem to="/account" icon={UserRound} label={t("common.account")} active={path.startsWith("/account")} />
              </ul>
            )}
          </div>
        </div>
      </nav>

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
        className="group relative flex min-h-[3.5rem] flex-col items-center justify-center gap-1 text-[10px] no-underline w-full"
      >
        <div className={cn(
          "relative flex items-center justify-center rounded-xl p-2 transition-all duration-300",
          active 
            ? "bg-fuchsia-500/20 text-fuchsia-400 shadow-md scale-110 border border-fuchsia-500/30" 
            : highlight
              ? "bg-fuchsia-500/10 text-fuchsia-400 hover:bg-fuchsia-500/20"
              : "text-zinc-500 hover:bg-white/5 hover:text-white"
        )}>
          <Icon className={cn("size-[22px]", active && "drop-shadow-sm")} aria-hidden strokeWidth={active ? 2.5 : 2} />
          
          {badge !== undefined && (
            <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-black">
              {badge}
            </span>
          )}
          {highlight && badge === undefined && !active && (
            <span className="absolute right-0 top-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-black animate-pulse" />
          )}
        </div>
        
        <span className={cn(
          "text-center break-words text-wrap px-0.5 font-medium tracking-wide transition-all",
          active ? "text-fuchsia-400 opacity-100 font-bold drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]" : "text-zinc-500 opacity-70 group-hover:text-zinc-300 group-hover:opacity-100"
        )}>
          {label}
        </span>
      </Link>
    </li>
  );
}
