import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Clock, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

export type ActivePlatform = "delivery" | "kingpay" | "travel" | "tutor";
export type ActiveVertical = "orderking" | "tutor-jobs" | "kingpay" | "travel";

export function resolveActiveVertical(pathname?: string | null): ActiveVertical {
  if (!pathname) return "orderking";
  return "orderking";
}

export function resolvePlatformContext(): ActivePlatform {
  return "delivery";
}

export const BENCHMARK_FOOD_TABS = [
  { id: "delivery", label: "Delivery", to: "/" },
  { id: "history", label: "History", to: "/orders" },
  { id: "dining", label: "Dining", to: "/dining" },
];

export const BENCHMARK_KINGPAY_TABS = BENCHMARK_FOOD_TABS;
export const BENCHMARK_TRAVEL_TABS = BENCHMARK_FOOD_TABS;
export const BENCHMARK_TUTOR_TABS = BENCHMARK_FOOD_TABS;

export const CUSTOMER_PRIMARY_TABS = [
  { id: "delivery", label: "Delivery", to: "/", icon: Home },
  { id: "history", label: "History", to: "/orders", icon: Clock },
  { id: "dining", label: "Dining", to: "/dining", icon: UtensilsCrossed },
] as const;

export const DYNAMIC_PRIMARY_TABS = CUSTOMER_PRIMARY_TABS;
export const THREE_TAB_CUSTOMER_NAV = CUSTOMER_PRIMARY_TABS;

export interface DynamicHistoryTabConfig {
  id: string;
  label: string;
  to: string;
  badge: string;
  icon: typeof Home;
}

export const DYNAMIC_HISTORY_CONFIG = {
  orderking: { id: "history", label: "History", to: "/orders", badge: "", icon: Clock },
  "tutor-jobs": { id: "history", label: "History", to: "/orders", badge: "", icon: Clock },
  kingpay: { id: "history", label: "History", to: "/orders", badge: "", icon: Clock },
  travel: { id: "history", label: "History", to: "/orders", badge: "", icon: Clock },
};

export interface FloatingBottomNavProps {
  className?: string;
}

export function CustomerFloatingBottomNav({ className }: FloatingBottomNavProps) {
  const pathname = (useRouterState({ select: (s) => s?.location?.pathname }) as unknown as string) ?? "/";
  const activeId = pathname.startsWith("/orders")
    ? "history"
    : pathname.startsWith("/dining")
      ? "dining"
      : "delivery";

  const tabs = [
    { id: "delivery", label: "Delivery", to: "/", icon: Home },
    { id: "history", label: "History", to: "/orders", icon: Clock },
    { id: "dining", label: "Dining", to: "/dining", icon: UtensilsCrossed },
  ] as const;

  return (
    <nav
      aria-label="Primary navigation"
      className={cn(
        "pointer-events-none fixed bottom-0 left-0 right-0 z-[70] flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        className
      )}
    >
      <ul
        role="list"
        data-testid="customer-bottom-nav"
        className="pointer-events-auto grid w-full max-w-md grid-cols-3 gap-1 rounded-full bg-zinc-900 p-1.5 shadow-xl"
      >
        {tabs.map(({ id, label, to, icon: Icon }) => {
          const selected = id === activeId;
          return (
            <li key={id}>
              <Link
                to={to as any}
                preload="intent"
                aria-label={label}
                aria-current={selected ? "page" : undefined}
                className={cn(
                  "flex min-h-[48px] items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold no-underline",
                  selected ? "bg-white text-zinc-950" : "text-zinc-300"
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}