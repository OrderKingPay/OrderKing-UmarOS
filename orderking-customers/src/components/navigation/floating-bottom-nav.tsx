import { Link, useRouterState } from "@tanstack/react-router";
import { UtensilsCrossed, GraduationCap, Wallet, Plane, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocationStore } from "@/lib/stores/location";
import { isDeliveryActiveInLocation } from "@/lib/geo/geofence-guard";

export type ActivePlatform = "delivery" | "kingpay" | "travel" | "tutor";

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
  if (!pathname || typeof pathname !== "string") return "delivery";
  const p = pathname.toLowerCase();
  if (
    p.startsWith("/king-pay") ||
    p.startsWith("/earn") ||
    p.startsWith("/wallet") ||
    p.startsWith("/kingpay")
  ) {
    return "kingpay";
  }
  if (p.startsWith("/travel")) {
    return "travel";
  }
  if (p.startsWith("/tutor")) {
    return "tutor";
  }
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

export interface FloatingBottomNavProps {
  className?: string;
  onOpenAi?: () => void;
}

/** Five permanent navigation destinations, without shape-shifting buttons or invented badges. */
export const CUSTOMER_PRIMARY_TABS = [
  { id: "food", label: "Food", to: "/", icon: UtensilsCrossed },
  { id: "learn", label: "Learn", to: "/tutor", icon: GraduationCap },
  { id: "pay", label: "KingPay", to: "/king-pay", icon: Wallet },
  { id: "travel", label: "Travel", to: "/travel", icon: Plane },
  { id: "orders", label: "Orders", to: "/orders", icon: ShoppingBag },
] as const;

export function CustomerFloatingBottomNav({ className }: FloatingBottomNavProps) {
  const pathname = useRouterState({ select: (s) => s?.location?.pathname ?? "/" });
  const location = useLocationStore((s) => s.location);
  const isDeliveryActive = location ? isDeliveryActiveInLocation(location.lat, location.lng, location.cityId) : true;

  const isCurrent = (id: (typeof CUSTOMER_PRIMARY_TABS)[number]["id"]) => {
    if (id === "food") return pathname === "/" || pathname.startsWith("/restaurants") || pathname.startsWith("/menu") || pathname.startsWith("/dining") || pathname.startsWith("/search") || pathname.startsWith("/cart");
    if (id === "learn") return pathname.startsWith("/tutor");
    if (id === "pay") return pathname.startsWith("/king-pay") || pathname.startsWith("/kingpay") || pathname.startsWith("/wallet") || pathname.startsWith("/earn");
    if (id === "travel") return pathname.startsWith("/travel");
    return pathname.startsWith("/orders");
  };
  return (
    <nav aria-label="Main navigation" className={cn("fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-lg px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden", className)}>
      <ul className="grid grid-cols-5 gap-1 rounded-2xl border border-amber-400/40 bg-[#141414]/95 p-2 shadow-lg backdrop-blur-xl" role="list">
        {CUSTOMER_PRIMARY_TABS.map(({ id, label, to, icon: Icon }) => {
          const active = isCurrent(id);
          const tabTitle = id === "food" && !isDeliveryActive ? "Mart / Food (Regional delivery)" : label;
          const displayLabel = id === "food" && !isDeliveryActive ? "Mart/Food" : label;
          return (
            <li key={id} className="min-w-0">
              <Link to={to} preload="intent" aria-current={active ? "page" : undefined} title={tabTitle}
                className={cn("flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-1 text-[10px] font-semibold no-underline transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300", active ? "bg-amber-400 text-slate-950" : "text-stone-200 hover:bg-white/10 hover:text-white")}>
                <div className="relative">
                  <Icon className="size-5" aria-hidden="true" />
                  {id === "food" && !isDeliveryActive && (
                    <span className="absolute -top-1 -right-1 size-1.5 rounded-full bg-amber-400 ring-1 ring-black" title="Mart Delivery Active" />
                  )}
                </div>
                <span className="block w-full truncate text-center">{displayLabel}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
