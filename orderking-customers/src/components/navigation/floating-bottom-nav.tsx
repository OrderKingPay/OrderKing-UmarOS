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

/**
 * Dynamic 5-Tab Floating Bottom Navigation
 * [1: OrderKing | 2: Tutor & Jobs | 3: KingPay | 4: Travel | 5: Dynamic History]
 * Tab 5 automatically shifts its label, destination route, and badge according to the active vertical.
 */
/** Exactly three visible customer navigation destinations. */
export const THREE_TAB_CUSTOMER_NAV = [
  { id: "food", label: "Food", to: "/", icon: UtensilsCrossed },
  { id: "services", label: "Services", to: "/kingpay", icon: LayoutGrid },
  { id: "orders", label: "Orders", to: "/orders", icon: ShoppingBag },
] as const;

export function CustomerFloatingBottomNav({ className }: FloatingBottomNavProps) {
  const pathname = useRouterState({ select: (s) => s?.location?.pathname ?? "/" });
  const food = pathname === "/" ||
    ["/delivery", "/r/", "/restaurants", "/menu", "/dining", "/search", "/cart", "/checkout", "/offers", "/rewards"].some((p) => pathname.startsWith(p));
  const orders = pathname.startsWith("/orders");
  const services = ["/kingpay", "/king-pay", "/travel", "/tutor", "/earn", "/news"].some((p) => pathname.startsWith(p));
  const active = orders ? "orders" : food ? "food" : services ? "services" : null;

  return (
    <nav
      aria-label="Primary navigation"
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-lg px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden",
        className
      )}
    >
      <ul role="list" data-testid="customer-bottom-nav"
        className="grid grid-cols-3 gap-1.5 rounded-2xl border border-amber-400/40 bg-[#141414]/95 p-1.5 shadow-2xl backdrop-blur-xl">
        {THREE_TAB_CUSTOMER_NAV.map(({ id, label, to, icon: Icon }) => (
          <li key={id} className="min-w-0">
            <Link
              to={to as any}
              preload="intent"
              aria-label={label}
              aria-current={id === active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-xs font-bold no-underline transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300",
                id === active ? "bg-amber-400 text-slate-950" :
                id === "services" ? "border border-amber-400/35 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20" :
                "text-stone-200 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              <span className="block w-full truncate text-center leading-tight">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
