
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CustomerShell } from "@/components/market/shell";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listMyOrders, reorderItems } from "@/lib/server/orders";
import { formatPaise } from "@/lib/money";
import type { OrderStatus } from "@/lib/orders/state";
import { useCartStore } from "@/lib/stores/cart";
import { CartConflictModal } from "@/components/market/cart-conflict-modal";
import { OrdersPageSkeleton } from "@/components/skeletons/route-skeletons";
import { AppErrorComponent } from "@/lib/error-component";

export const Route = createFileRoute("/orders/")({
  component: OrdersPage,
  pendingComponent: OrdersPageSkeleton,
  errorComponent: AppErrorComponent,
});

function statusKey(status: OrderStatus): string {
  const map: Partial<Record<OrderStatus, string>> = {
    PLACED: "orders.placed",
    ACCEPTED: "orders.accepted",
    PREPARING: "orders.preparing",
    READY: "orders.ready",
    RIDER_ASSIGNED: "orders.riderAssigned",
    PICKED_UP: "orders.pickedUp",
    ON_THE_WAY: "orders.onTheWay",
    DELIVERED: "orders.delivered",
    REJECTED: "orders.rejected",
    CANCELLED: "orders.cancelled",
    CANCELLED_BY_CUSTOMER: "orders.cancelled",
    REFUNDED: "orders.refunded",
    FAILED_PAYMENT: "orders.failed",
    DELIVERY_FAILED: "orders.deliveryFailed",
  };
  return map[status] ?? "orders.placed";
}

function OrdersPage() {
  const { t, lang } = useT();
  const locale = lang === "bn" ? "bn-IN" : "en-IN";
  const { user, isPending } = useCurrentUserState();
  const [orderQuery, setOrderQuery] = useState("");
  const navigate = useNavigate();
  const cart = useCartStore();
  const [reorderConflict, setReorderConflict] = useState<{
    restaurantId: string;
    restaurantName: string;
    lines: any[];
  } | null>(null);

  const handleReorder = async (orderId: string) => {
    try {
      const res = await reorderItems({ data: { orderId } });
      const currentRestaurantId = cart.restaurantId;
      const hasItems = cart.items.length > 0;
      if (hasItems && currentRestaurantId && currentRestaurantId !== res.restaurantId) {
        setReorderConflict(res);
      } else {
        cart.replaceCart(res.restaurantId, res.restaurantName, res.lines);
        toast.success("Items from past order added to cart!");
        void navigate({ to: "/checkout" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reorder");
    }
  };

  const orders = useQuery({
    queryKey: ["orders"],
    queryFn: () => listMyOrders(),
    enabled: Boolean(user),
  });

  if (isPending) {
    return (
      <CustomerShell>
        <div className="min-h-screen bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#F5EFEB] p-6 space-y-4 animate-pulse">
          <div className="h-9 w-1/3 bg-gradient-to-r from-amber-100 via-amber-200/70 to-amber-100 rounded-2xl" />
          <div className="h-28 bg-gradient-to-r from-amber-100/80 via-amber-200/50 to-amber-100/80 rounded-3xl border border-amber-200/50" />
          <div className="h-28 bg-gradient-to-r from-amber-100/80 via-amber-200/50 to-amber-100/80 rounded-3xl border border-amber-200/50" />
        </div>
      </CustomerShell>
    );
  }

  const list = orders.data?.orders ?? [];
  const normalizedQuery = orderQuery.trim().toLocaleLowerCase();
  const matchingOrders = normalizedQuery
    ? list.filter((o) =>
        (o.restaurantName + " " + o.itemPreview + " " + o.status)
          .toLocaleLowerCase()
          .includes(normalizedQuery)
      )
    : list;
  const active = matchingOrders.filter((o) => !["DELIVERED", "CANCELLED", "CANCELLED_BY_CUSTOMER", "REJECTED", "REFUNDED", "FAILED_PAYMENT"].includes(o.status));
  const past = matchingOrders.filter((o) => !active.includes(o));

  return (
    <CustomerShell>
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#F5EFEB] px-4 py-4 pb-24">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Orders &amp; Passes
            </h1>
            <p className="mt-0.5 text-xs font-medium text-stone-500">
              Track food orders, tickets and your activity
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 border border-stone-200 px-3 py-1 text-xs font-bold text-stone-700">
            <span>{list.length} Orders</span>
          </span>
        </div>

        <nav aria-label="Tickets and activity" className="mt-4 grid grid-cols-3 gap-2">
          <Link to="/travel/trips" className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl border border-amber-200 bg-white p-2 text-center text-stone-800 no-underline shadow-sm hover:bg-amber-50">
            <span className="text-xl" aria-hidden="true">🎫</span><span className="text-[11px] font-extrabold">Travel passes</span>
          </Link>
          <Link to="/tutor-jobs/history" className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl border border-amber-200 bg-white p-2 text-center text-stone-800 no-underline shadow-sm hover:bg-amber-50">
            <span className="text-xl" aria-hidden="true">💼</span><span className="text-[11px] font-extrabold">Jobs & learning</span>
          </Link>
          <Link to="/kingpay/passbook" className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl border border-amber-200 bg-white p-2 text-center text-stone-800 no-underline shadow-sm hover:bg-amber-50">
            <span className="text-xl" aria-hidden="true">🧾</span><span className="text-[11px] font-extrabold">Passbook</span>
          </Link>
        </nav>

        {/* Search Input Bar */}
        <div className="mt-4">
          <div className="relative flex items-center rounded-2xl border border-amber-300/80 bg-white/95 p-1.5 shadow-sm">
            <span className="pl-3 text-amber-600 text-sm">🔍</span>
            <input
              id="order-history-search"
              type="search"
              autoComplete="off"
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
              placeholder="Search by restaurant, dish, or status..."
              aria-label="Search orders"
              className="h-10 w-full border-none bg-transparent px-2.5 text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none"
            />
            {orderQuery && (
              <button
                type="button"
                onClick={() => setOrderQuery("")}
                className="pr-2 text-xs font-bold text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {orders.isError ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center">
            <p className="text-sm font-bold text-rose-700">Failed to load orders.</p>
            <button
              type="button"
              className="mt-2 text-xs font-black text-rose-800 underline uppercase tracking-wider"
              onClick={() => void orders.refetch()}
            >
              {t("common.retry")} ↻
            </button>
          </div>
        ) : !list.length ? (
          <div className="mt-8 rounded-3xl border border-amber-300/50 bg-white/95 backdrop-blur-md p-8 text-center shadow-[0_12px_40px_rgba(245,158,11,0.08)]">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-800 shadow-inner">
              <span className="text-3xl">🍲</span>
            </div>
            <h2 className="mt-4 font-display text-2xl font-black text-stone-900">{t("orders.empty")}</h2>
            <p className="mt-1 text-sm text-stone-600 max-w-xs mx-auto leading-relaxed">{t("orders.emptyHint")}</p>
            <div className="mt-6">
              <Button className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-extrabold px-6 py-2.5 rounded-2xl shadow-lg shadow-orange-500/25 hover:from-amber-600 hover:to-orange-600 transition-all" asChild>
                <Link to="/">{t("cart.browse")}</Link>
              </Button>
            </div>
          </div>
        ) : normalizedQuery && matchingOrders.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/50 p-6 text-center">
            <p className="text-sm font-bold text-stone-700" role="status">No orders match &ldquo;{orderQuery}&rdquo;.</p>
            <button
              type="button"
              onClick={() => setOrderQuery("")}
              className="mt-2 text-xs font-bold text-amber-800 underline"
            >
              Clear search filter
            </button>
          </div>
        ) : (
          <>
            {/* Active Orders Section */}
            {active.length ? (
              <section className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex size-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full size-3 bg-emerald-500" />
                  </span>
                  <h2 className="text-xs font-black uppercase tracking-wider text-emerald-900">
                    {t("orders.active")} ({active.length})
                  </h2>
                </div>

                <ul className="space-y-3.5">
                  {active.map((o) => (
                    <li key={o.id}>
                      <Link
                        to="/orders/$id"
                        params={{ id: o.id }}
                        className="block rounded-3xl border-2 border-amber-400/80 bg-gradient-to-br from-white via-amber-50/40 to-yellow-50/30 p-4 shadow-[0_8px_30px_rgba(245,158,11,0.15)] no-underline transition-all hover:shadow-[0_12px_40px_rgba(245,158,11,0.25)] hover:scale-[1.01] group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-400 text-white shadow-md shadow-amber-400/30 text-xl group-hover:scale-105 transition-transform">
                              🛵
                            </div>
                            <div>
                              <p className="font-extrabold text-base text-stone-900 leading-snug">
                                {o.restaurantName}
                              </p>
                              <p className="text-xs text-stone-500 mt-0.5">
                                #{o.publicId}
                              </p>
                            </div>
                          </div>
                          <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-[11px] font-black text-white uppercase tracking-wider shadow-xs">
                            {t(statusKey(o.status))}
                          </span>
                        </div>

                        {/* Mini Timeline Progress Indicator */}
                        <div className="mt-3.5 rounded-xl border border-amber-200/80 bg-white/80 p-2.5">
                          <div className="flex items-center justify-between text-[11px] font-bold text-amber-950 mb-1.5">
                            <span>Status: {t(statusKey(o.status))}</span>
                            <span className="tabular-nums font-black text-amber-900">
                              {formatPaise(o.totalPaise, { locale })}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-amber-100">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 rounded-full transition-all duration-500"
                              style={{
                                width: ["PLACED", "ACCEPTED"].includes(o.status)
                                  ? "25%"
                                  : ["PREPARING", "READY"].includes(o.status)
                                    ? "50%"
                                    : ["RIDER_ASSIGNED", "PICKED_UP", "ON_THE_WAY"].includes(o.status)
                                      ? "80%"
                                      : "100%",
                              }}
                            />
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-amber-900/10">
                          <span className="text-[11px] text-stone-500 font-medium">
                            Tap to view live tracking &amp; OTP
                          </span>
                          <span className="text-xs font-black text-amber-800 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                            Live Tracking ➔
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* Past Orders Section */}
            {past.length ? (
              <section className="mt-7">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-stone-400 text-sm">📜</span>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                    {t("orders.past")} ({past.length})
                  </h2>
                </div>

                <ul className="space-y-3">
                  {past.map((o) => {
                    const isDelivered = o.status === "DELIVERED";
                    const isCancelled = ["CANCELLED", "REJECTED", "FAILED_PAYMENT"].includes(o.status);

                    return (
                      <li key={o.id}>
                        <Link
                          to="/orders/$id"
                          params={{ id: o.id }}
                          className="block rounded-2xl border border-amber-900/10 bg-white/95 backdrop-blur-md p-4 text-stone-900 no-underline shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(212,175,55,0.12)] hover:border-amber-300 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-800 border border-amber-200 text-lg">
                                🍽️
                              </div>
                              <div>
                                <p className="font-extrabold text-sm text-stone-900 group-hover:text-amber-800 transition-colors">
                                  {o.restaurantName}
                                </p>
                                <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
                                  {o.itemPreview || "Order details"}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                isDelivered
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : isCancelled
                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {t(statusKey(o.status))}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between border-t border-amber-900/5 pt-2">
                            <div className="flex items-center gap-2">
                              <span className="font-black tabular-nums text-stone-900 text-sm">
                                {formatPaise(o.totalPaise, { locale })}
                              </span>
                              {isDelivered && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    void handleReorder(o.id);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-zinc-950 font-black text-xs px-2.5 py-1 shadow-xs transition active:scale-95 cursor-pointer"
                                >
                                  <span>🔁</span>
                                  <span>Reorder</span>
                                </button>
                              )}
                            </div>
                            <span className="text-xs font-bold text-amber-800 group-hover:underline">
                              View Receipt ➔
                            </span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}
          </>
        )}

        <CartConflictModal
          isOpen={Boolean(reorderConflict)}
          currentRestaurantName={cart.restaurantName}
          newRestaurantName={reorderConflict?.restaurantName || "this restaurant"}
          onCancel={() => setReorderConflict(null)}
          onConfirm={() => {
            if (reorderConflict) {
              cart.replaceCart(reorderConflict.restaurantId, reorderConflict.restaurantName, reorderConflict.lines);
              setReorderConflict(null);
              toast.success("Items from past order added to cart!");
              void navigate({ to: "/checkout" });
            }
          }}
        />
      </div>
    </CustomerShell>
  );
}
