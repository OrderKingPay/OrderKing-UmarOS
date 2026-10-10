import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCartStore, cartKey, toCartItem, type CartItem } from "@/lib/stores/cart";
import { getCheckoutUpsells, type CheckoutUpsellItem } from "@/lib/server/upsell";
import { formatPaise } from "@/lib/money";
import { Sparkles, Check, Plus, Coffee, Zap, ShieldCheck } from "lucide-react";

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
  freeDeliveryThresholdPaise = 29900, // ₹299 typical free delivery tier
  currentSubtotalPaise = 0,
}: CheckoutUpsellEngineProps) {
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQty = useCartStore((s) => s.updateQty);
  const addAddonToItem = useCartStore((s) => s.addAddonToItem);
  const removeAddonFromItem = useCartStore((s) => s.removeAddonFromItem);

  const [lastAddedName, setLastAddedName] = useState<string | null>(null);

  // Extract current cart state for algorithmic targeting
  const cartItemIds = items.map((i) => i.itemId);
  const cartAddonIds = items.flatMap((i) => i.addonIds);
  const isVegOnly = items.length > 0 && !items.some((i) => i.instructions?.includes("non-veg"));

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

  // Calculate AOV threshold toward Free Delivery
  const diffToFreeDelivery = freeDeliveryThresholdPaise - currentSubtotalPaise;
  const showFreeDeliveryGamification =
    diffToFreeDelivery > 0 && diffToFreeDelivery <= 15000; // within ₹150

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
      aria-label="1-Click Checkout Upsell Engine"
      className="mt-6 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm"
    >
      {/* Monetization Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 tracking-tight flex items-center gap-1.5">
              1-Click Pairings & Add-ons
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60 uppercase tracking-wider">
                AOV Maximizer
              </span>
            </h3>
            <p className="text-xs text-zinc-500">
              High-margin favorites frequently ordered with this meal
            </p>
          </div>
        </div>

        {/* Free Delivery Gamification Progress Bar */}
        {showFreeDeliveryGamification && (
          <div className="mt-2 sm:mt-0 flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 border border-amber-200/80">
            <Zap className="h-3.5 w-3.5 text-amber-600" />
            <span>
              Add{" "}
              <strong className="text-amber-800">
                {formatPaise(diffToFreeDelivery, { locale })}
              </strong>{" "}
              more to unlock Free Delivery!
            </span>
          </div>
        )}
      </div>

      {/* AOV Instant Feedback Toast */}
      {lastAddedName && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-900 animate-in fade-in slide-in-from-top-1 duration-200">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            Added <strong>{lastAddedName}</strong> to order • Average Order Value boosted!
          </span>
        </div>
      )}

      {/* Algorithmic Upsell Cards Grid */}
      <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {isLoading ? (
          <div className="col-span-2 py-6 text-center text-xs text-zinc-400">
            Finding chef pairings...
          </div>
        ) : (
          upsellItems.map((upsell) => {
            const added = isUpsellAdded(upsell);
            return (
              <div
                key={upsell.id}
                className={`relative flex items-center justify-between rounded-xl border p-3 transition-all ${
                  added
                    ? "border-emerald-300 bg-emerald-50/30 shadow-xs"
                    : "border-zinc-200 bg-white hover:border-emerald-300 hover:shadow-xs"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  {/* Veg / Non-Veg Indicator */}
                  <div
                    className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-xs border p-0.5 ${
                      upsell.veg ? "border-emerald-600" : "border-red-600"
                    }`}
                    title={upsell.veg ? "Vegetarian" : "Non-Vegetarian"}
                  >
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${
                        upsell.veg ? "bg-emerald-600" : "bg-red-600"
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-xs font-bold text-zinc-900">
                        {upsell.name}
                      </span>
                      {upsell.badge && (
                        <span className="shrink-0 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-700">
                          {upsell.badge}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold text-emerald-700">
                        {formatPaise(upsell.pricePaise, { locale })}
                      </span>
                      <span className="text-[10px] text-zinc-500 truncate">
                        {upsell.reason}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 1-Click Action Button */}
                <div className="shrink-0">
                  {added ? (
                    <div className="flex items-center gap-1">
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
                        className="flex h-7 items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-100/70 px-2 text-[11px] font-bold text-emerald-800 transition hover:bg-emerald-200 active:scale-95"
                      >
                        <Check className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Added</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAddUpsell(upsell)}
                      className="flex h-7 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-[11px] font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Trust & Conversion Guarantee Microcopy */}
      <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1 text-emerald-700 font-medium">
          <ShieldCheck className="h-3 w-3" />
          1-Click Instant Addition • Live Bill Update
        </span>
        <span>Zero Demo listings • Fresh from kitchen</span>
      </div>
    </section>
  );
}
