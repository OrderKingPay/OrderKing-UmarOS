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

  const activeTabs = isSuperApp ? superAppTabs : foodTabs;

  return (
    <nav
      aria-label="Primary navigation"
      className={cn(
        "pointer-events-none fixed bottom-0 left-0 right-0 z-[70] flex items-center justify-center px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] md:pb-4 transform-gpu will-change-transform [contain:paint]",
        className
      )}
    >
      <div className="flex items-center gap-2 sm:gap-2.5 w-full max-w-lg md:max-w-[560px] justify-center">
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
          className="pointer-events-auto flex size-12 sm:size-13 items-center justify-center rounded-full bg-gradient-to-tr from-[#B85D19] via-[#E85D04] to-[#F48C06] text-white shadow-[0_6px_20px_rgba(232,93,4,0.45)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer shrink-0 border border-white/40 transform-gpu will-change-transform"
        >
          <Sparkles className="size-5 sm:size-6 drop-shadow-xs" />
        </button>

        {/* Floating 3-Tab Glassmorphism Dock */}
        <ul
          role="list"
          data-testid="customer-bottom-nav"
          className="pointer-events-auto grid flex-1 grid-cols-3 gap-1 rounded-[28px] border border-stone-200/90 bg-white/95 dark:bg-[#141721]/95 dark:border-white/10 p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-2xl overflow-hidden transform-gpu will-change-transform [contain:paint] min-h-[58px] sm:min-h-[62px]"
        >
          {activeTabs.map((tab) => {
            const { id, label, to, icon: Icon } = tab;
            const selected = "selected" in tab ? Boolean(tab.selected) : id === (inActivity ? "activity" : inAccount ? "account" : "food");
            return (
              <li key={id} className="min-w-0">
                <Link
                  to={to as any}
                  preload="intent"
                  aria-label={label}
                  aria-current={selected ? "page" : undefined}
                  className={cn(
                    "flex min-h-[50px] sm:min-h-[54px] flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1 text-[11px] font-black tracking-tight no-underline transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:text-xs transform-gpu will-change-transform",
                    selected
                      ? "bg-[#1c1d22] text-white shadow-md ring-1 ring-black/10 dark:bg-white dark:text-black"
                      : "text-stone-600 hover:bg-stone-100/70 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-white"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4.5 sm:size-5 shrink-0 transition-transform duration-200",
                      selected && id === "delivery" && "text-[#E85D04] fill-[#E85D04]/20",
                      !selected && id === "dining" && "text-purple-600",
                      selected && "scale-105"
                    )}
                    aria-hidden="true"
                  />
                  <span className="block w-full truncate text-center leading-tight">
                    <span className="xs:hidden">
                      {id === "activity"
                        ? (isSuperApp ? "Bookings" : "Orders")
                        : (tab as any).displayLabel || label}
                    </span>
                    <span className="hidden xs:inline">
                      {(tab as any).displayLabel || label}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
