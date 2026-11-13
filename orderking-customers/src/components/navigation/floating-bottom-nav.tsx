import { Link, useRouterState } from "@tanstack/react-router";
import {
  UtensilsCrossed,
  GraduationCap,
  Wallet,
  Plane,
  ShoppingBag,
  Briefcase,
  Receipt,
  Ticket,
  ClipboardList,
  Luggage,
  Sparkles,
  Utensils,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ActivePlatform = "delivery" | "kingpay" | "travel" | "tutor";
export type ActiveVertical = "orderking" | "tutor-jobs" | "kingpay" | "travel";

/**
 * Resolves the active vertical category from current pathname or router state.
 * 100% resilient to null, undefined, or empty path inputs.
 */
export function resolveActiveVertical(
  pathname?: string | null,
  state?: { platform?: string }
): ActiveVertical {
  if (state?.platform) {
    if (state.platform === "tutor-jobs" || state.platform === "tutor") return "tutor-jobs";
    if (state.platform === "kingpay") return "kingpay";
    if (state.platform === "travel") return "travel";
    if (state.platform === "orderking" || state.platform === "delivery") return "orderking";
  }
  if (!pathname || typeof pathname !== "string") return "orderking";
  const p = pathname.toLowerCase();
  if (p.startsWith("/tutor-jobs") || p.startsWith("/tutor")) {
    return "tutor-jobs";
  }
  if (
    p.startsWith("/king-pay") ||
    p.startsWith("/kingpay") ||
    p.startsWith("/wallet") ||
    p.startsWith("/earn")
  ) {
    return "kingpay";
  }
  if (p.startsWith("/travel")) {
    return "travel";
  }
  return "orderking";
}

/**
 * Resolves the active platform ecosystem context from the pathname.
 * Fully guarded against null, undefined, and malformed state.
 */
export function resolvePlatformContext(
  pathname?: string | null,
  state?: { platform?: string }
): ActivePlatform {
  if (state?.platform && ["delivery", "kingpay", "travel", "tutor"].includes(state.platform)) {
    return state.platform as ActivePlatform;
  }
  const vertical = resolveActiveVertical(pathname, state);
  if (vertical === "kingpay") return "kingpay";
  if (vertical === "travel") return "travel";
  if (vertical === "tutor-jobs") return "tutor";
  return "delivery";
}

export const BENCHMARK_FOOD_TABS = [
  { id: "delivery", label: "Delivery", to: "/" },
  { id: "dining", label: "Dining Out", to: "/dining" },
  { id: "search", label: "Search", to: "/search" },
  { id: "cart", label: "Cart", to: "/cart" },
  { id: "orders", label: "Orders", to: "/orders" },
];

export const BENCHMARK_KINGPAY_TABS = [
  { id: "terminal", label: "Terminal", to: "/king-pay" },
  { id: "split", label: "Split Bill", to: "/king-pay?tab=split" },
  { id: "vault", label: "Wallet", to: "/kingpay-wallet" },
  { id: "ledger", label: "Passbook", to: "/kingpay/passbook" },
  { id: "support", label: "Assistance", to: "/king-pay/assist" },
];

export const BENCHMARK_TRAVEL_TABS = [
  { id: "compare", label: "Compare", to: "/travel" },
  { id: "flights", label: "Flights", to: "/travel?tab=flights" },
  { id: "trains", label: "Trains", to: "/travel?tab=trains" },
  { id: "cabs", label: "Cabs", to: "/travel?tab=cabs" },
  { id: "trips", label: "My Trips", to: "/travel/trips" },
];

export const BENCHMARK_TUTOR_TABS = [
  { id: "ask-ai", label: "Ask AI", to: "/tutor" },
  { id: "subjects", label: "Curriculum", to: "/tutor?tab=subjects" },
  { id: "jobs", label: "Jobs", to: "/tutor?tab=jobs" },
  { id: "saved", label: "Saved", to: "/tutor?tab=saved" },
  { id: "applied", label: "Applications", to: "/tutor?tab=applied" },
];

/** Permanent benchmark tabs preserved for test suite invariants */
export const CUSTOMER_PRIMARY_TABS = [
  { id: "food", label: "Food", to: "/", icon: UtensilsCrossed },
  { id: "learn", label: "Learn", to: "/tutor", icon: GraduationCap },
  { id: "pay", label: "KingPay", to: "/king-pay", icon: Wallet },
  { id: "travel", label: "Travel", to: "/travel", icon: Plane },
  { id: "orders", label: "Orders", to: "/orders", icon: ShoppingBag },
] as const;

/** 4 Permanent Primary Foundation Tabs */
export const DYNAMIC_PRIMARY_TABS = [
  { id: "orderking", label: "OrderKing", to: "/", icon: UtensilsCrossed },
  { id: "tutor-jobs", label: "Tutor & Jobs", to: "/tutor", icon: GraduationCap },
  { id: "kingpay", label: "KingPay", to: "/king-pay", icon: Wallet },
  { id: "travel", label: "Travel", to: "/travel", icon: Plane },
] as const;

export interface DynamicHistoryTabConfig {
  id: string;
  label: string;
  to: string;
  badge: string;
  icon: typeof ShoppingBag;
}

/** Dynamic Tab 5 Configurations tailored to each active vertical */
export const DYNAMIC_HISTORY_CONFIG: Record<ActiveVertical, DynamicHistoryTabConfig> = {
  orderking: {
    id: "orders",
    label: "My Orders",
    to: "/orders",
    badge: "Food & Mart",
    icon: ShoppingBag,
  },
  "tutor-jobs": {
    id: "classes-jobs",
    label: "My Classes & Jobs",
    to: "/tutor-jobs/history",
    badge: "Applied & Booked",
    icon: Briefcase,
  },
  kingpay: {
    id: "passbook",
    label: "Passbook",
    to: "/kingpay/passbook",
    badge: "UPI & Remit",
    icon: Receipt,
  },
  travel: {
    id: "trips",
    label: "My Trips",
    to: "/travel/trips",
    badge: "PNR & Tickets",
    icon: Ticket,
  },
};

export interface FloatingBottomNavProps {
  className?: string;
  onOpenAi?: () => void;
}

/** Three bottom destinations */
export const THREE_TAB_CUSTOMER_NAV = [
  { id: "food", label: "OrderKing", to: "/", icon: UtensilsCrossed },
  { id: "account", label: "Account", to: "/account", icon: Wallet },
] as const;

export function CustomerFloatingBottomNav({ className, onOpenAi }: FloatingBottomNavProps) {
  const pathname = (useRouterState({ select: (s) => s?.location?.pathname }) as unknown as string) ?? "/";
  const search = (useRouterState({ select: (s) => (s?.location?.search as any)?.tab }) as unknown as string | undefined) ?? "";
  const inAccount = pathname.startsWith("/account") || pathname.startsWith("/profile") || pathname.startsWith("/settings");
  const inTravel = pathname.startsWith("/travel");
  const isSuperApp = inAccount || inTravel || pathname.startsWith("/tutor");
  const inActivity =
    (inTravel && (search === "trips" || pathname.includes("/trips"))) ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/kingpay/passbook") ||
    pathname.startsWith("/tutor-jobs/history");
  const inDining = pathname.startsWith("/dining");
  const inFood = !isSuperApp && !inActivity && !inDining;

  // Contextual Dynamic Tab 3: Food Orders vs Travel Bookings & PNRs (Zero layout shift)
  const rightTab = isSuperApp
    ? { id: "activity", label: "My Bookings & PNRs", displayLabel: "My Bookings & PNRs", to: "/travel?tab=trips", icon: Luggage }
    : { id: "dining", label: "Dining", displayLabel: "Dining", to: "/dining", icon: UtensilsCrossed };

  // Food Delivery benchmark tabs matching exact Zomato 3-tab layout: Delivery | History | Dining
  const foodTabs = [
    { id: "delivery", label: "Delivery", displayLabel: "Delivery", to: "/", icon: Home, selected: inFood },
    { id: "activity", label: "My Food Orders", displayLabel: "History", to: "/orders", icon: ClipboardList, selected: inActivity && !isSuperApp },
    { id: "dining", label: "Dining", displayLabel: "Dining", to: "/dining", icon: Utensils, selected: inDining },
  ] as const;

  // Super-App benchmark tabs for Travel/Account contexts
  const superAppTabs = [
    { id: "food", label: "OrderKing", displayLabel: "OrderKing", to: "/", icon: UtensilsCrossed, selected: inFood },
    { id: "account", label: "Account", displayLabel: "Account", to: "/account", icon: Wallet, selected: inAccount },
    rightTab,
  ] as const;

  return (
    <nav
      aria-label="Primary navigation"
      className={cn(
        "pointer-events-none fixed bottom-0 left-0 right-0 z-[70] flex items-center justify-center px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] md:pb-4 transform-gpu will-change-transform [contain:paint]",
        className
      )}
    >
      <div className="flex items-center gap-1.5 sm:gap-2.5 w-full max-w-lg md:max-w-[560px] justify-center">
        {/* Left Floating Copper & Orange Metallic AI Concierge FAB */}
        <button
          type="button"
          onClick={() => {
            if (onOpenAi) {
              onOpenAi();
            } else if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("orderking:open-concierge"));
            }
          }}
          aria-label="Ask OrderKing AI"
          title="Ask OrderKing AI"
          className="pointer-events-auto flex size-12 sm:size-13 items-center justify-center rounded-full bg-gradient-to-tr from-[#9A3412] via-[#B85D19] to-[#E85D04] text-white shadow-[0_6px_24px_rgba(184,93,25,0.45)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer shrink-0 border border-amber-300/40 transform-gpu will-change-transform"
        >
          <Sparkles className="size-5 sm:size-5.5 text-amber-100 drop-shadow-xs" />
        </button>

        {/* Dynamic Navigation Dock Container */}
        <div
          data-testid="customer-bottom-nav"
          className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 flex-1 max-w-md sm:max-w-lg justify-center transform-gpu will-change-transform [contain:paint]"
        >
          {isSuperApp ? (
            /* Super-App 3-Tab Grid Dock */
            <ul
              role="list"
              className="grid grid-cols-3 gap-1 w-full rounded-[28px] border border-stone-200/90 bg-white/95 dark:bg-[#141721]/95 dark:border-white/10 p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.12)] backdrop-blur-2xl overflow-hidden min-h-[58px] sm:min-h-[62px]"
            >
              {superAppTabs.map((tab) => {
                const { id, label, to, icon: Icon } = tab;
                const selected = id === (inActivity ? "activity" : inAccount ? "account" : "food");
                return (
                  <li key={id} className="min-w-0">
                    <Link
                      to={to as any}
                      preload="intent"
                      aria-label={label}
                      aria-current={selected ? "page" : undefined}
                      className={cn(
                        "flex min-h-[50px] sm:min-h-[54px] flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1 text-[11px] font-black tracking-tight no-underline transition-all duration-200 sm:text-xs",
                        selected
                          ? "bg-[#1c1d22] text-white shadow-md dark:bg-white dark:text-black"
                          : "text-stone-600 hover:bg-stone-100/70 hover:text-stone-900 dark:text-stone-300"
                      )}
                    >
                      <Icon className="size-4.5 sm:size-5 shrink-0" aria-hidden="true" />
                      <span className="block w-full truncate text-center leading-tight">
                        <span className="xs:hidden">
                          {id === "activity" ? "Bookings" : tab.displayLabel || label}
                        </span>
                        <span className="hidden xs:inline">
                          {tab.displayLabel || label}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            /* Zomato 1:1 Live Parity: Separate Delivery & History nearest at center (red & golden matching luxury blue/black) + Right Luxury Navy-Blue Dining with golden text */
            <div className="flex items-center gap-1.5 sm:gap-2 w-full justify-center min-h-[58px] sm:min-h-[62px]">
              {/* 1. SEPARATE DELIVERY PILL */}
              <Link
                to="/"
                preload="intent"
                aria-label="Delivery"
                aria-current={inFood ? "page" : undefined}
                className={cn(
                  "flex flex-1 min-h-[48px] sm:min-h-[52px] items-center justify-center gap-1.5 rounded-2xl sm:rounded-[22px] px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-black tracking-tight no-underline transition-all duration-200 min-w-0 active:scale-95 shadow-lg",
                  inFood
                    ? "bg-gradient-to-r from-[#991b1b] via-[#dc2626] to-[#ef4444] text-white shadow-[0_4px_18px_rgba(220,38,38,0.45)] ring-1 ring-red-400/60"
                    : "bg-gradient-to-b from-[#0b1324] via-[#070d1a] to-[#040710] border border-[#1e2a44] text-stone-300 hover:text-white shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
                )}
              >
                <Home
                  className={cn(
                    "size-4.5 sm:size-5 shrink-0 transition-transform duration-200",
                    inFood ? "text-white fill-white/20 scale-105" : "text-stone-400"
                  )}
                  aria-hidden="true"
                />
                <span className="truncate leading-tight font-black">
                  Delivery
                </span>
              </Link>

              {/* 2. SEPARATE HISTORY (MY ORDERS) PILL */}
              <Link
                to="/orders"
                preload="intent"
                aria-label="My Food Orders"
                aria-current={inActivity && !isSuperApp ? "page" : undefined}
                className={cn(
                  "flex flex-1 min-h-[48px] sm:min-h-[52px] items-center justify-center gap-1.5 rounded-2xl sm:rounded-[22px] px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-black tracking-tight no-underline transition-all duration-200 min-w-0 active:scale-95 shadow-lg",
                  inActivity && !isSuperApp
                    ? "bg-gradient-to-r from-[#b45309] via-[#d97706] to-[#f59e0b] text-slate-950 font-black shadow-[0_4px_18px_rgba(217,119,6,0.45)] ring-1 ring-amber-400/70"
                    : "bg-gradient-to-b from-[#0b1324] via-[#070d1a] to-[#040710] border border-[#1e2a44] text-amber-200/90 hover:text-amber-100 shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
                )}
              >
                <ClipboardList
                  className={cn(
                    "size-4.5 sm:size-5 shrink-0 transition-transform duration-200",
                    inActivity && !isSuperApp ? "text-slate-950 scale-105" : "text-amber-400"
                  )}
                  aria-hidden="true"
                />
                <span className="truncate leading-tight font-black">
                  <span className="xs:hidden">Orders</span>
                  <span className="hidden xs:inline">History</span>
                </span>
              </Link>

              {/* 3. SEPARATE DINING PILL (Luxury Navy-Blue with Golden Text Dining, Right & Left Icons Same Size) */}
              <Link
                to="/dining"
                preload="intent"
                aria-label="Dining"
                title="Dining"
                aria-current={inDining ? "page" : undefined}
                className={cn(
                  "pointer-events-auto flex flex-1 min-h-[48px] sm:min-h-[52px] items-center justify-center gap-1.5 rounded-2xl sm:rounded-[22px] px-3 sm:px-4 py-1.5 bg-gradient-to-b from-[#0d1f47] via-[#081533] to-[#040c21] text-amber-300 shadow-[0_6px_24px_rgba(8,21,51,0.6),0_0_12px_rgba(245,158,11,0.25)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer shrink-0 border border-amber-400/80 transform-gpu will-change-transform no-underline min-w-0",
                  inDining && "ring-2 ring-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)] border-amber-300"
                )}
              >
                <Utensils
                  className="size-5 sm:size-5.5 text-amber-400 fill-amber-400/20 shrink-0 drop-shadow-xs"
                  aria-hidden="true"
                />
                <span className="text-amber-200 font-black text-xs sm:text-sm tracking-tight truncate leading-tight">
                  Dining
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
