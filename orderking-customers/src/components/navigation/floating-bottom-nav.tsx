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
  Sparkles,
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

export const DYNAMIC_PRIMARY_TABS = [
  { id: "orderking", label: "OrderKing", to: "/", icon: UtensilsCrossed },
  { id: "tutor-jobs", label: "Tutor & Jobs", to: "/tutor", icon: GraduationCap },
  { id: "kingpay", label: "KingPay", to: "/king-pay", icon: Wallet },
  { id: "travel", label: "Travel", to: "/travel", icon: Plane },
] as const;

export const CUSTOMER_PRIMARY_TABS = [
  { id: "orderking", label: "Food", to: "/", icon: UtensilsCrossed },
  { id: "tutor-jobs", label: "Learn", to: "/tutor", icon: GraduationCap },
  { id: "kingpay", label: "KingPay", to: "/king-pay", icon: Wallet },
  { id: "travel", label: "Travel", to: "/travel", icon: Plane },
  { id: "orders", label: "Orders", to: "/orders", icon: ShoppingBag },
] as const;

export interface DynamicHistoryTabConfig {
  id: string;
  label: string;
  to: string;
  badge: string;
  icon: typeof ShoppingBag;
}

export const DYNAMIC_HISTORY_CONFIG: Record<ActiveVertical, DynamicHistoryTabConfig> = {
  orderking: { id: "orders", label: "My Orders", to: "/orders", badge: "Food & Mart", icon: ShoppingBag },
  "tutor-jobs": { id: "orders", label: "My Classes & Jobs", to: "/tutor-jobs/history", badge: "Applied & Booked", icon: ShoppingBag },
  kingpay: { id: "orders", label: "Passbook", to: "/kingpay/passbook", badge: "UPI & Remit", icon: ShoppingBag },
  travel: { id: "orders", label: "My Trips", to: "/travel/trips", badge: "PNR & Tickets", icon: ShoppingBag },
};

export interface FloatingBottomNavProps {
  className?: string;
  onOpenAi?: () => void;
}

export const THREE_TAB_CUSTOMER_NAV = [
  { id: "delivery", label: "Delivery", to: "/", icon: UtensilsCrossed },
  { id: "history", label: "History", to: "/orders", icon: ShoppingBag },
  { id: "dining", label: "Dining", to: "/dining", icon: UtensilsCrossed },
] as const;

export function CustomerFloatingBottomNav({ className, onOpenAi }: FloatingBottomNavProps) {
  const pathname = (useRouterState({ select: (s) => s?.location?.pathname }) as unknown as string) ?? "/";
  const search = (useRouterState({ select: (s) => (s?.location?.search as any)?.tab }) as unknown as string | undefined) ?? "";
  const inKingPay = /^\/(?:kingpay|king-pay)(?:\/|$)/.test(pathname);
  const inTravel = pathname.startsWith("/travel");
  const isSuperApp = inKingPay || inTravel || pathname.startsWith("/tutor") || pathname.startsWith("/tutor-jobs");
  const inDining = pathname.startsWith("/dining");
  const inActivity =
    (inTravel && (search === "trips" || pathname.includes("/trips"))) ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/kingpay/passbook") ||
    pathname.startsWith("/tutor-jobs/history");
  const inFood = !isSuperApp && !inActivity && !inDining;
  const activeId = inDining ? "dining" : inActivity ? "activity" : inKingPay ? "kingpay" : inFood ? "delivery" : isSuperApp ? "kingpay" : "delivery";

  // Contextual Dynamic Tab 3: Food Orders vs Travel Bookings & PNRs (Zero layout shift)
  const rightTab = isSuperApp
    ? { id: "activity", label: "My Bookings & PNRs", microLabel: "Bookings", to: "/travel?tab=trips", icon: Luggage }
    : { id: "activity", label: "My Food Orders", microLabel: "Orders", to: "/orders", icon: ClipboardList };

  const tabs = [
    { id: "delivery", label: "Delivery", microLabel: "Delivery", to: "/", icon: UtensilsCrossed },
    { id: "dining", label: "Dining", microLabel: "Dining", to: "/dining", icon: UtensilsCrossed },
    rightTab,
  ] as const;

  return (
    <nav
      aria-label="Primary navigation"
      className={cn(
        "pointer-events-none fixed bottom-0 left-0 right-0 z-[70] flex items-center justify-center gap-2 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] md:pb-4 transform-gpu will-change-transform [contain:paint]",
        className
      )}
    >
      {/* Zomato Parity Left Jewel FAB (AI Voice & Ordering Concierge) */}
      <button
        type="button"
        onClick={onOpenAi}
        aria-label="Open AI Assistant"
        className="pointer-events-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 text-white shadow-[0_4px_16px_rgba(244,63,94,0.4)] transition-all hover:scale-105 active:scale-95 focus:outline-none"
      >
        <Sparkles className="size-5 text-white" aria-hidden="true" />
      </button>

      {/* Zomato Parity Center Floating Pill (Delivery | Dining | Activity) */}
      <ul
        role="list"
        data-testid="customer-bottom-nav"
        className="pointer-events-auto grid w-full max-w-lg md:max-w-[560px] grid-cols-3 gap-1 rounded-full border border-stone-200/80 bg-white/95 px-2 py-1 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md transform-gpu"
      >
        {tabs.map(({ id, label, microLabel, to, icon: Icon }) => {
          const selected = id === activeId;
          return (
            <li key={id} className="min-w-0">
              <Link
                to={to as any}
                preload="intent"
                aria-label={label}
                aria-current={selected ? "page" : undefined}
                className={cn(
                  "flex min-h-[58px] sm:min-h-[62px] flex-col items-center justify-center gap-1 rounded-full px-2 py-1.5 text-xs font-semibold no-underline transition-all",
                  selected
                    ? "bg-stone-900 text-white shadow-xs"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="block w-full text-center leading-none truncate">
                  <span className="xs:hidden">{microLabel}</span>
                  <span className="hidden xs:inline">{label}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
