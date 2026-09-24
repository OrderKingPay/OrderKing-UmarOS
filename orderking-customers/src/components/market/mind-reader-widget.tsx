import { useState } from "react";
import { toast } from "sonner";
import { useCartStore } from "@/lib/stores/cart";
import { toCartItem } from "@/lib/cart-logic";
import { formatPaise } from "@/lib/money";
import { getMarketContext } from "@/lib/server/dynamic-sort";

type QuickDish = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  dishName: string;
  pricePaise: number;
  isVeg: boolean;
  etaMinutes: number;
  tag: string;
  icon: string;
  description: string;
};

const POPULAR_DISHES: QuickDish[] = [
  {
    id: "dish_mutton_biryani",
    restaurantId: "rst_biryani",
    restaurantName: "Station Biryani House",
    dishName: "Royal Dum Mutton Biryani (Special Handi)",
    pricePaise: 38000,
    isVeg: false,
    etaMinutes: 25,
    tag: "Bestseller",
    icon: "🍗",
    description: "Aromatic slow-cooked basmati with tender mutton and saffron.",
  },
  {
    id: "dish_fish_thali",
    restaurantId: "rst_fish",
    restaurantName: "Surma Fish Kitchen",
    dishName: "Traditional Bengali Fish Thali (Rohu / Katla)",
    pricePaise: 26000,
    isVeg: false,
    etaMinutes: 20,
    tag: "Homestyle",
    icon: "🐟",
    description: "Steamed rice, dal, aloo bhaja, and authentic mustard fish curry.",
  },
  {
    id: "dish_butter_paneer",
    restaurantId: "rst_thali",
    restaurantName: "Central Thali Ghar",
    dishName: "Butter Paneer Bowl with Jeera Rice",
    pricePaise: 21000,
    isVeg: true,
    etaMinutes: 18,
    tag: "Top Rated",
    icon: "🍛",
    description: "Rich cashew-tomato gravy paired with fragrant cumin basmati.",
  },
  {
    id: "dish_chicken_roll",
    restaurantId: "rst_rolls",
    restaurantName: "Roll Factory",
    dishName: "Double Egg Chicken Kathi Roll",
    pricePaise: 12000,
    isVeg: false,
    etaMinutes: 15,
    tag: "Pocket Friendly",
    icon: "🌯",
    description: "Crispy flaky paratha wrapped with juicy spiced chicken and onions.",
  },
  {
    id: "dish_kurkure_momo",
    restaurantId: "rst_momo",
    restaurantName: "Barak Momo Hut",
    dishName: "Crispy Kurkure Chicken Momos (8 Pcs)",
    pricePaise: 14000,
    isVeg: false,
    etaMinutes: 16,
    tag: "Snack Rush",
    icon: "🥟",
    description: "Crunchy golden fried momos served with spicy red chili chutney.",
  },
  {
    id: "dish_special_tea",
    restaurantId: "rst_tea",
    restaurantName: "Tea Leaf Cafe",
    dishName: "Kadak Assam Masala Chai with Samosa Duo",
    pricePaise: 6000,
    isVeg: true,
    etaMinutes: 12,
    tag: "Under ₹99",
    icon: "☕",
    description: "Freshly brewed garden Assam tea served with 2 crispy hot samosas.",
  },
];

export function MindReaderWidget() {
  const [market] = useState(() => getMarketContext());
  const cart = useCartStore();

  const handleQuickAdd = (dish: QuickDish) => {
    const item = toCartItem({
      itemId: dish.id,
      variantId: null,
      addonIds: [],
      quantity: 1,
      instructions: "",
    });
    cart.addItem(dish.restaurantId, dish.restaurantName, item);
    toast.success(`Added ${dish.dishName} to your cart!`);
  };

  return (
    <section aria-label="What Are You Craving" className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-surface to-surface p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/70 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-white text-base shadow-xs">
              👑
            </span>
            <h2 className="font-display font-bold text-lg text-fg tracking-tight">
              {market.headline}
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold text-primary">
              {market.badge}
            </span>
          </div>
          <p className="text-xs text-muted">
            {market.subheadline}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-muted border border-border/60">
            <span>✨ 0% Menu Markup</span>
          </span>
        </div>
      </div>

      {/* Quick Bestseller Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {POPULAR_DISHES.slice(0, 3).map((dish) => (
          <div
            key={dish.id}
            className="flex flex-col justify-between rounded-xl border border-border bg-surface p-3.5 shadow-xs hover:border-primary/40 hover:shadow-sm transition space-y-2.5"
          >
            <div className="space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{dish.icon}</span>
                  <div>
                    <h3 className="font-bold text-xs text-fg line-clamp-1 leading-snug">
                      {dish.dishName}
                    </h3>
                    <p className="text-[10px] text-muted">{dish.restaurantName}</p>
                  </div>
                </div>
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary flex-shrink-0">
                  {dish.tag}
                </span>
              </div>

              <p className="text-[11px] text-muted line-clamp-2">
                {dish.description}
              </p>

              <div className="flex items-center justify-between text-xs font-mono pt-1">
                <span className="font-bold text-fg">
                  {formatPaise(dish.pricePaise)}
                </span>
                <span className="text-[10px] text-muted font-sans">
                  ⏱️ {dish.etaMinutes} mins
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleQuickAdd(dish)}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white py-1.5 text-xs font-bold shadow-xs transition active:scale-98"
            >
              <span>⚡ Quick Add</span>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
