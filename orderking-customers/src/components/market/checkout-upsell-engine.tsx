import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCartStore, cartKey, toCartItem, type CartItem } from "@/lib/stores/cart";
import { useDietStore } from "@/lib/stores/diet";
import { getCheckoutUpsells, type CheckoutUpsellItem } from "@/lib/server/upsell";
import { formatPaise } from "@/lib/money";
import { Sparkles, Check, Plus, Zap, ShieldCheck, Crown } from "lucide-react";

interface CheckoutUpsellEngineProps {
  restaurantId: string;
  restaurantName: string;
  locale?: string;
  deliveryFeePaise?: number;
  freeDeliveryThresholdPaise?: number;
  currentSubtotalPaise?: number;
}

export function CheckoutUpsellEngine({
  restaurantId,
  restaurantName,
  locale = "en-IN",
  deliveryFeePaise,
  freeDeliveryThresholdPaise = 29900,
  currentSubtotalPaise = 0,
}: CheckoutUpsellEngineProps) {
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQty = useCartStore((s) => s.updateQty);
  const addAddonToItem = useCartStore((s) => s.addAddonToItem);
  const removeAddonFromItem = useCartStore((s) => s.removeAddonFromItem);

  const [lastAddedName, setLastAddedName] = useState<string | null>(null);

  // Extract current cart and diet state for algorithmic targeting
  const cartItemIds = items.map((i) => i.itemId);
  const cartAddonIds = items.flatMap((i) => i.addonIds);
  const dietFilter = useDietStore((s) => s.dietFilter);
  const isVegOnly = dietFilter === "veg";

  // Fetch real algorithmic recommendations from the restaurant catalog
  const { data, isLoading } = useQuery({
    queryKey: ["checkout-upsells", restaurantId, cartItemIds.join(","), cartAddonIds.join(",")],
    enabled: Boolean(restaurantId && items.length > 0),
    queryFn: () =>
      getCheckoutUpsells({
        data: {
          restaurantId,
          cartItemIds,
          cartAddonIds,
          isVegOnly,
        },
      }),
    staleTime: 30_000,
  });

  const upsellItems: CheckoutUpsellItem[] = data?.upsells ?? [];

  // Strictly ZERO Demo data: If no genuine menu items or add-ons exist in the database, render nothing.
  if (!isLoading && upsellItems.length === 0) {
    return null;
  }

  // Calculate progress toward fast delivery
  const diffToFreeDelivery = freeDeliveryThresholdPaise - currentSubtotalPaise;
  const showFreeDeliveryGamification = diffToFreeDelivery > 0 && diffToFreeDelivery <= 15000;
  const freeDeliveryUnlocked = currentSubtotalPaise >= freeDeliveryThresholdPaise && freeDeliveryThresholdPaise > 0;
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentSubtotalPaise / freeDeliveryThresholdPaise) * 100)));

  const handleAddUpsell = (upsell: CheckoutUpsellItem) => {
    if (upsell.type === "addon" && upsell.addonId) {
      // Find the first cart item matching this addon's parent item
      const targetItem = items.find((i) => i.itemId === upsell.itemId);
      if (targetItem) {
        addAddonToItem(targetItem.key, upsell.addonId);
        setLastAddedName(upsell.name);
        setTimeout(() => setLastAddedName(null), 3500);
      }
    } else {
      // Standalone high-margin impulse item (Cold Beverage, Fries, Desserts)
      const newItem: CartItem = toCartItem({
        itemId: upsell.itemId,
        variantId: upsell.variantId ?? null,
        addonIds: [],
        quantity: 1,
        instructions: "",
      });
      addItem(restaurantId, restaurantName, newItem);
      setLastAddedName(upsell.name);
      setTimeout(() => setLastAddedName(null), 3500);
    }
  };

  const isUpsellAdded = (upsell: CheckoutUpsellItem): boolean => {
    if (upsell.type === "addon" && upsell.addonId) {
      return cartAddonIds.includes(upsell.addonId);
    }
    return cartItemIds.includes(upsell.itemId);
  };

  return (
    <section
      aria-label="Royal Chef Pairings Engine"
      className="mt-6 rounded-3xl border border-amber-400/40 bg-gradient-to-br from-amber-500/10 via-white to-amber-50/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-amber-950/20 p-4 sm:p-5 shadow-[0_8px_30px_rgba(245,158,11,0.08)] backdrop-blur-sm"
    >
      {/* Luxury Monetization Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-zinc-950 shadow-md">
            <Crown className="size-5" />
          </div>
          <div>
            <h3 className="font-display text-sm sm:text-base font-black text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
              Chef&apos;s Royal Pairings
              <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-extrabold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                👑 1-Click Add
              </span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Handpicked sides and beverages frequently enjoyed with your meal
            </p>
          </div>
        </div>

        {/* fast delivery Gamification Progress */}
        {showFreeDeliveryGamification && (
          <div className="flex flex-col gap-1 rounded-xl bg-amber-500/15 border border-amber-400/40 px-3 py-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200">
              <Zap className="size-3.5 text-amber-600 fill-amber-500" />
              <span>
                Add <strong className="text-amber-950 dark:text-amber-100">{formatPaise(diffToFreeDelivery, { locale })}</strong> for fast delivery!
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-amber-200/60 dark:bg-zinc-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {freeDeliveryUnlocked && (
          <div className="flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/40 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <Sparkles className="size-3.5 text-emerald-600" />
            <span>🎉 Priority Delivery Unlocked!</span>
          </div>
        )}
      </div>

      {/* AOV Instant Feedback Toast */}
      {lastAddedName && (
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border border-emerald-400/40 px-4 py-2.5 text-xs font-bold text-emerald-900 dark:text-emerald-200 animate-in fade-in slide-in-from-top-1 duration-200">
          <Check className="size-4 text-emerald-600 shrink-0 stroke-[3]" />
          <span>
            Added <strong>{lastAddedName}</strong> to your order • Live bill updated!
          </span>
        </div>
      )}

      {/* Algorithmic Upsell Cards Grid */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {isLoading ? (
          <div className="col-span-2 py-6 text-center text-xs text-zinc-400 font-medium">
            Discovering chef pairings...
          </div>
        ) : (
          upsellItems.map((upsell) => {
            const added = isUpsellAdded(upsell);
            return (
              <div
                key={upsell.id}
                className={`group relative flex items-center justify-between rounded-2xl border p-3.5 transition-all duration-200 ${
                  added
                    ? "border-emerald-400/60 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs"
                    : "border-amber-400/25 bg-gradient-to-b from-white via-zinc-50/60 to-amber-50/15 dark:from-zinc-900 dark:to-zinc-850 hover:border-amber-500/60 hover:shadow-md"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  {/* FSSAI Statutory Food Classification Mark */}
                  <div
                    className={`flex size-4 shrink-0 items-center justify-center rounded-xs border p-0.5 shadow-2xs ${
                      upsell.veg ? "border-emerald-600 bg-white" : "border-rose-600 bg-white"
                    }`}
                    title={upsell.veg ? "100% Pure Vegetarian" : "Non-Vegetarian"}
                  >
                    {upsell.veg ? (
                      <span className="size-2 rounded-full bg-emerald-600" />
                    ) : (
                      <span className="size-0 border-x-[3px] border-b-[6px] border-x-transparent border-b-rose-600" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {upsell.name}
                      </span>
                      {upsell.badge && (
                        <span className="shrink-0 rounded-full bg-amber-500/20 border border-amber-400/40 px-1.5 py-0.2 text-[9px] font-extrabold text-amber-900 dark:text-amber-200">
                          {upsell.badge}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs sm:text-sm font-black tabular-nums text-zinc-950 dark:text-zinc-50">
                        {formatPaise(upsell.pricePaise, { locale })}
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                        {upsell.reason}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 1-Click Action Button */}
                <div className="shrink-0">
                  {added ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (upsell.type === "addon" && upsell.addonId) {
                          const targetItem = items.find((i) => i.itemId === upsell.itemId);
                          if (targetItem) {
                            removeAddonFromItem(targetItem.key, upsell.addonId);
                          }
                        } else {
                          const inCart = items.find((i) => i.itemId === upsell.itemId);
                          if (inCart) {
                            updateQty(inCart.key, inCart.quantity - 1);
                          }
                        }
                      }}
                      className="flex h-8 items-center gap-1 rounded-xl border border-emerald-400/60 bg-emerald-100 dark:bg-emerald-900/40 px-2.5 text-[11px] font-black text-emerald-800 dark:text-emerald-200 shadow-xs hover:bg-emerald-200 active:scale-95 transition"
                    >
                      <Check className="size-3.5 text-emerald-700 dark:text-emerald-300 stroke-[3]" />
                      <span>Added</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAddUpsell(upsell)}
                      className="flex h-8 items-center gap-1 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-zinc-950 px-3 text-[11px] font-black uppercase tracking-wider shadow-[0_4px_12px_rgba(245,158,11,0.35)] active:scale-95 transition cursor-pointer"
                    >
                      <Plus className="size-3.5 stroke-[3]" />
                      <span>ADD</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Trust & Conversion Guarantee Microcopy */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-amber-400/20 pt-3 text-[10px] text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold">
          <ShieldCheck className="size-3.5" />
          1-Click Instant Addition • Live Bill Calculation
        </span>
        <span className="font-medium">Kitchen Fresh • Authentic Menu Rates</span>
      </div>
    </section>
  );
}
