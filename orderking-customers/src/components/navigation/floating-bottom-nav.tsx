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
  LayoutGrid,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ActivePlatform = "delivery" | "kingpay" | "travel" | "tutor";
export type ActiveVertical = "orderking" | "tutor-jobs" | "kingpay" | "travel";

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
  if (p.startsWith("/tutor-jobs") || p.startsWith("/tutor")) return "tutor-jobs";
  if (p.startsWith("/king-pay") || p.startsWith("/kingpay") || p.startsWith("/wallet") || p.startsWith("/earn")) return "kingpay";
  if (p.startsWith("/travel")) return "travel";
  return "orderking";
}

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

export const CUSTOMER_PRIMARY_TABS = [
  { id: "food", label: "Order", to: "/", icon: UtensilsCrossed },
  { id: "dining", label: "Go Out", to: "/dining", icon: UtensilsCrossed },
  { id: "orders", label: "Orders", to: "/orders", icon: ShoppingBag },
  { id: "account", label: "Account", to: "/account", icon: User },
] as const;

export const DYNAMIC_PRIMARY_TABS = CUSTOMER_PRIMARY_TABS;

export interface DynamicHistoryTabConfig {
  id: string;
  label: string;
  to: string;
  badge: string;
  icon: typeof ShoppingBag;
}

export const DYNAMIC_HISTORY_CONFIG: Record<ActiveVertical, DynamicHistoryTabConfig> = {
  orderking: { id: "orders", label: "Orders", to: "/orders", badge: "", icon: ShoppingBag },
  "tutor-jobs": { id: "orders", label: "Orders", to: "/orders", badge: "", icon: ShoppingBag },
  kingpay: { id: "orders", label: "Orders", to: "/orders", badge: "", icon: ShoppingBag },
  travel: { id: "orders", label: "Orders", to: "/orders", badge: "", icon: ShoppingBag },
};

export interface FloatingBottomNavProps {
  className?: string;
  onOpenAi?: () => void;
}

export const THREE_TAB_CUSTOMER_NAV = [
  { id: "food", label: "Order", to: "/", icon: UtensilsCrossed },
  { id: "dining", label: "Go Out", to: "/dining", icon: UtensilsCrossed },
] as const;

export function CustomerFloatingBottomNav({ className }: FloatingBottomNavProps) {
  const pathname = (useRouterState({ select: (s) => s?.location?.pathname }) as unknown as string) ?? "/";
  const activeId = pathname.startsWith("/dining")
    ? "dining"
    : pathname.startsWith("/orders")
      ? "orders"
      : pathname.startsWith("/account") || pathname.startsWith("/profile") || pathname.startsWith("/settings") || pathname.startsWith("/travel") || pathname.startsWith("/tutor")
        ? "account"
        : "food";

  const tabs = [
    { id: "food", label: "Order", to: "/", icon: UtensilsCrossed },
    { id: "dining", label: "Go Out", to: "/dining", icon: UtensilsCrossed },
    { id: "orders", label: "Orders", to: "/orders", icon: ClipboardList },
    { id: "account", label: "Account", to: "/account", icon: User },
  ] as const;

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
        className="pointer-events-auto grid w-full max-w-lg grid-cols-4 gap-1 rounded-2xl border border-stone-200 bg-white p-1 shadow-lg"
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
                  "flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[11px] font-semibold no-underline",
                  selected ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
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