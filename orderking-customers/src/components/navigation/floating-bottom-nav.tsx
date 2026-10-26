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
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ActivePlatform = "delivery" | "kingpay";
export type ActiveVertical = "orderking" | "kingpay";

/**
 * Resolves the active vertical category from current pathname or router state.
 * 100% resilient to null, undefined, or empty path inputs.
 */
export function resolveActiveVertical(
  pathname?: string | null,
  state?: { platform?: string }
): ActiveVertical {
  if (state?.platform) {
        if (state.platform === "kingpay") return "kingpay";
        if (state.platform === "orderking" || state.platform === "delivery") return "orderking";
  }
  if (!pathname || typeof pathname !== "string") return "orderking";
  const p = pathname.toLowerCase();
    if (
    p.startsWith("/king-pay") ||
    p.startsWith("/kingpay") ||
    p.startsWith("/wallet") ||
    p.startsWith("/earn")
  ) {
    return "kingpay";
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
  { id: "vault", label: "Gold Vault", to: "/wallet" },
  { id: "ledger", label: "Passbook", to: "/earn" },
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
    kingpay: {
    id: "passbook",
    label: "Passbook",
    to: "/kingpay/passbook",
    badge: "UPI & Remit",
    icon: Receipt,
  },
  };

export interface FloatingBottomNavProps {
  className?: string;
  onOpenAi?: () => void;
}

/**
 * Dynamic 5-Tab Floating Bottom Navigation
 * [1: OrderKing | 2: Tutor & Jobs | 3: KingPay | 4: Travel | 5: Dynamic History]
 * Tab 5 automatically shifts its label, destination route, and badge according to the active vertical.
 */
/** Three bottom destinations. The right-hand tab follows the active ecosystem. */
export const THREE_TAB_CUSTOMER_NAV = [
  { id: "food", label: "OrderKing", to: "/", icon: UtensilsCrossed },
  { id: "kingpay", label: "KingPay", to: "/kingpay", icon: Wallet },
] as const;

export function CustomerFloatingBottomNav({ className }: FloatingBottomNavProps) {
  const pathname = useRouterState({ select: (s) => s?.location?.pathname ?? "/" });
  const inKingPay = /^\/(?:kingpay|king-pay)(?:\/|$)/.test(pathname);
  const inActivity = pathname.startsWith("/orders") || pathname.startsWith("/kingpay/passbook");
  const inFood = pathname === "/" || ["/delivery", "/r/", "/restaurants", "/menu", "/dining", "/search", "/cart", "/checkout", "/offers", "/rewards"].some((p) => pathname.startsWith(p));
  const activeId = inActivity ? "activity" : inKingPay ? "kingpay" : inFood ? "food" : null;
  const rightTab = inKingPay
    ? { id: "activity", label: "HISTORY", to: "/kingpay/passbook", icon: Receipt }
    : { id: "activity", label: "ORDERS", to: "/orders", icon: ShoppingBag };
  const tabs = [...THREE_TAB_CUSTOMER_NAV, rightTab] as const;

  return (
    <nav
      aria-label="Primary navigation"
      className={cn(
        "pointer-events-none fixed bottom-0 left-0 right-0 z-[70] flex justify-center px-2.5 sm:px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:pb-4",
        className
      )}
    >
      <ul
        role="list"
        data-testid="customer-bottom-nav"
        className="pointer-events-auto grid w-full max-w-lg md:max-w-[560px] grid-cols-3 gap-1.5 sm:gap-2 rounded-[24px] border border-amber-400/60 bg-gradient-to-br from-[#0d111b] via-[#201b18] to-[#181312] p-1.5 sm:p-2 shadow-[0_18px_50px_rgba(15,12,10,0.5),0_0_0_1px_rgba(245,158,11,0.2)] backdrop-blur-2xl overflow-hidden"
      >
        {tabs.map(({ id, label, to, icon: Icon }) => {
          const selected = id === activeId;
          return (
            <li key={id} className="min-w-0">
              <Link
                to={to as any}
                preload="intent"
                aria-label={label}
                aria-current={selected ? "page" : undefined}
                className={cn(
                  "flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-1.5 text-[11px] font-extrabold tracking-tight no-underline transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 sm:min-h-[62px] sm:text-xs",
                  selected ? "bg-gradient-to-br from-[#ffedaf] via-amber-400 to-amber-500 text-slate-950 shadow-[0_4px_20px_rgba(245,158,11,0.32)]" :
                  id === "kingpay" ? "border border-amber-400/50 bg-gradient-to-b from-amber-400/20 to-amber-500/10 text-amber-100 hover:bg-amber-400/25" :
                  "text-stone-200 hover:bg-white/10 hover:text-white",
                  id === "kingpay" && "-translate-y-1 ring-1 ring-amber-400/35"
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                <span className="block w-full truncate text-center leading-tight">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
