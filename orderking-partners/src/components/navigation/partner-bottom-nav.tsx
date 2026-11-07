import { Link, useRouterState } from "@tanstack/react-router";
import {
  ChefHat,
  ClipboardList,
  MoreHorizontal,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { useT } from "@/components/use-t";
import { cn } from "@/lib/utils";

interface PartnerBottomNavProps {
  onOpenSpark?: () => void;
  pendingOrdersCount?: number;
}

export function PartnerFloatingBottomNav({
  pendingOrdersCount = 0,
}: PartnerBottomNavProps) {
  const t = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isOrders = pathname.startsWith("/orders") || pathname === "/";
  const isKds = pathname.startsWith("/kds") || pathname.startsWith("/kitchen");
  const isMenu = pathname.startsWith("/menu");
  const isSettlements = pathname.startsWith("/settlements") || pathname.startsWith("/payouts");
  const isMore =
    pathname.startsWith("/more") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/promotions") ||
    pathname.startsWith("/hours") ||
    pathname.startsWith("/reviews") ||
    pathname.startsWith("/notifications");

  return (
    <nav
      role="navigation"
      aria-label="Order King Partner Navigation"
      className="fixed inset-x-0 bottom-0 z-40 bg-white border-t border-gray-200 shadow-sm md:hidden"
    >
      <div className="mx-auto max-w-lg px-2 py-1.5">
        <ul className="grid grid-cols-5 items-center justify-items-center">
          {/* 1. ORDERS */}
          <li className="w-full flex justify-center">
            <Link
              to="/orders"
              title={pendingOrdersCount > 0 ? `${pendingOrdersCount} orders waiting for action` : (t("nav.orders") || "Orders")}
              aria-label={t("nav.orders") || "Orders"}
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-colors",
                isOrders ? "text-[#E23744] font-bold" : "text-gray-500 hover:text-gray-900 font-medium"
              )}
            >
              <div className="relative flex size-7 items-center justify-center">
                <ClipboardList className="size-5" />
                {pendingOrdersCount > 0 && (
                  <span className="absolute -top-1 -right-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#E23744] px-1 text-[9px] font-bold text-white shadow-xs">
                    {pendingOrdersCount > 99 ? "99+" : pendingOrdersCount}
                  </span>
                )}
              </div>
              <span className="mt-1 text-[11px] tracking-tight leading-none">{t("nav.orders") || "Orders"}</span>
            </Link>
          </li>

          {/* 2. KITCHEN / KDS */}
          <li className="w-full flex justify-center">
            <Link
              to="/kds"
              title="Kitchen Display System"
              aria-label={t("nav.kitchen") || "Kitchen"}
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-colors",
                isKds ? "text-[#E23744] font-bold" : "text-gray-500 hover:text-gray-900 font-medium"
              )}
            >
              <div className="relative flex size-7 items-center justify-center">
                <ChefHat className="size-5" />
              </div>
              <span className="mt-1 text-[11px] tracking-tight leading-none">{t("nav.kitchen") || "Kitchen"}</span>
            </Link>
          </li>

          {/* 3. MENU */}
          <li className="w-full flex justify-center">
            <Link
              to="/menu"
              title="Menu & Stock"
              aria-label={t("nav.menu") || "Menu"}
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-colors",
                isMenu ? "text-[#E23744] font-bold" : "text-gray-500 hover:text-gray-900 font-medium"
              )}
            >
              <div className="relative flex size-7 items-center justify-center">
                <UtensilsCrossed className="size-5" />
              </div>
              <span className="mt-1 text-[11px] tracking-tight leading-none">{t("nav.menu") || "Menu"}</span>
            </Link>
          </li>

          {/* 4. SETTLEMENTS */}
          <li className="w-full flex justify-center">
            <Link
              to="/settlements"
              title="Settlements & Payouts"
              aria-label={t("nav.settlements") || "Payouts"}
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-colors",
                isSettlements ? "text-[#E23744] font-bold" : "text-gray-500 hover:text-gray-900 font-medium"
              )}
            >
              <div className="relative flex size-7 items-center justify-center">
                <Wallet className="size-5" />
              </div>
              <span className="mt-1 text-[11px] tracking-tight leading-none">{t("nav.settlements") || "Payouts"}</span>
            </Link>
          </li>

          {/* 5. MORE */}
          <li className="w-full flex justify-center">
            <Link
              to="/more"
              title="More"
              aria-label="More"
              className={cn(
                "group relative flex flex-col items-center justify-center py-1 w-full text-center no-underline transition-colors",
                isMore ? "text-[#E23744] font-bold" : "text-gray-500 hover:text-gray-900 font-medium"
              )}
            >
              <div className="relative flex size-7 items-center justify-center">
                <MoreHorizontal className="size-5" />
              </div>
              <span className="mt-1 text-[11px] tracking-tight leading-none">More</span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
