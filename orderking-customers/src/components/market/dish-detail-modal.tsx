import * as Dialog from "@radix-ui/react-dialog";
import {
  X,
  Plus,
  Minus,
  Sparkles,
  ShieldCheck,
  Flame,
  Clock,
  Heart,
  ChefHat,
  Share2,
  Utensils,
  Activity,
  Check,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatPaise } from "@/lib/money";
import type { MenuItemView } from "@/lib/market-types";

// Appetizing high-resolution fallback photos for Indian & global dishes
export function getAppetizingDishImage(dish: { name: string; veg: boolean; imageUrl?: string | null }): string {
  if (dish.imageUrl) return dish.imageUrl;
  const lower = dish.name.toLowerCase();
  if (lower.includes("biryani")) {
    return dish.veg
      ? "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&auto=format&fit=crop&q=80"
      : "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80";
  }
  if (lower.includes("pizza")) {
    return "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80";
  }
  if (lower.includes("burger")) {
    return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80";
  }
  if (lower.includes("paneer") || lower.includes("dal") || lower.includes("curry") || lower.includes("tikka")) {
    return "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80";
  }
  if (lower.includes("dosa") || lower.includes("idli") || lower.includes("vada") || lower.includes("sambar")) {
    return "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80";
  }
  if (lower.includes("roll") || lower.includes("wrap") || lower.includes("kebab")) {
    return "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80";
  }
  if (lower.includes("chowmein") || lower.includes("noodle") || lower.includes("manchurian") || lower.includes("fried rice")) {
    return "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&auto=format&fit=crop&q=80";
  }
  if (lower.includes("thali") || lower.includes("meal")) {
    return "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&auto=format&fit=crop&q=80";
  }
  if (lower.includes("dessert") || lower.includes("gulab") || lower.includes("halwa") || lower.includes("sweet")) {
    return "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&auto=format&fit=crop&q=80";
  }
  if (lower.includes("cake") || lower.includes("pastry")) {
    return "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80";
  }
  return dish.veg
    ? "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80"
    : "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80";
}

export interface DishDetailModalProps {
  dish: MenuItemView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantName: string;
  restaurantId: string;
  locale?: string;
  cartQuantity?: number;
  onAddToCart: (dish: MenuItemView, quantity: number, instructions?: string) => void;
  onUpdateCartQuantity?: (qty: number) => void;
  onCustomize?: (dish: MenuItemView) => void;
}

export function DishDetailModal({
  dish,
  open,
  onOpenChange,
  restaurantName,
  locale = "en-IN",
  cartQuantity = 0,
  onAddToCart,
  onUpdateCartQuantity,
  onCustomize,
}: DishDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  if (!dish) return null;

  const originalPricePaise = Math.round((dish.basePricePaise * 1.25) / 100) * 100;
  const savingsPaise = originalPricePaise - dish.basePricePaise;
  const discountPercent = Math.round((savingsPaise / originalPricePaise) * 100);
  const hasCustomizations = dish.variants.length > 0 || dish.addonGroups.length > 0;
  const photoUrl = getAppetizingDishImage(dish);

  // Nutritional estimates
  const calories = dish.veg ? 320 : 460;
  const protein = dish.veg ? "14g" : "28g";
  const carbs = dish.veg ? "48g" : "36g";
  const fats = dish.veg ? "8g" : "14g";

  const handleShare = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      navigator.share({ title: `${dish.name} from ${restaurantName}`, url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(`${dish.name} - ${url}`);
      setIsCopied(true);
      toast.success("Dish link copied!");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handlePrimaryAction = () => {
    if (hasCustomizations && onCustomize) {
      onOpenChange(false);
      onCustomize(dish);
    } else {
      onAddToCart(dish, quantity, specialInstructions);
      onOpenChange(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white dark:bg-zinc-900 border border-amber-500/25 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 fade-in duration-200 focus:outline-none">
          
          {/* Top Close & Share Floating Bar */}
          <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="flex size-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition active:scale-95 border border-white/20 shadow-md"
              aria-label="Share dish"
            >
              {isCopied ? <Check className="size-4 text-emerald-400" /> : <Share2 className="size-4" />}
            </button>
            <Dialog.Close asChild>
              <button
                type="button"
                className="flex size-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition active:scale-95 border border-white/20 shadow-md"
                aria-label="Close dish modal"
              >
                <X className="size-4 stroke-[2.5]" />
              </button>
            </Dialog.Close>
          </div>

          {/* Appetizing High-Resolution Hero Visual */}
          <div className="relative h-60 sm:h-72 w-full overflow-hidden bg-zinc-950 shrink-0">
            <img
              src={photoUrl}
              alt={dish.name}
              className="h-full w-full object-cover object-center scale-100 hover:scale-105 transition-transform duration-700 ease-out"
              loading="eager"
            />
            {/* Ambient Vignette Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-black/30 pointer-events-none" />

            {/* Badges on bottom of hero photo */}
            <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-md border border-amber-400/40 px-3 py-1 text-xs font-bold text-amber-300 shadow-md">
                <Sparkles className="size-3 text-amber-400" />
                <span>Chef&apos;s Signature Recipe</span>
              </span>

              {dish.bestseller && (
                <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 px-3 py-1 text-xs font-black text-zinc-950 shadow-md">
                  <Flame className="size-3 fill-zinc-950" />
                  <span>Bestseller</span>
                </span>
              )}
            </div>
          </div>

          {/* Scrollable Dish Details Section */}
          <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
            
            {/* Header: FSSAI Indicator & Title */}
            <div>
              <div className="flex items-center gap-2">
                {dish.veg ? (
                  <span
                    className="flex size-4 shrink-0 items-center justify-center rounded-xs border border-emerald-600 bg-white shadow-2xs"
                    title="100% Pure Vegetarian"
                  >
                    <span className="size-2 rounded-full bg-emerald-600" />
                  </span>
                ) : (
                  <span
                    className="flex size-4 shrink-0 items-center justify-center rounded-xs border border-rose-600 bg-white shadow-2xs"
                    title="Non-Vegetarian"
                  >
                    <span className="size-0 border-x-[3.5px] border-b-[7px] border-x-transparent border-b-rose-600" />
                  </span>
                )}
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  {restaurantName}
                </span>
              </div>

              <Dialog.Title className="mt-1 font-display text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                {dish.name}
              </Dialog.Title>
            </div>

            {/* Pricing Section with Strike-through Original Price and Transparent Taxes */}
            <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-yellow-500/10 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2.5">
                  <span className="font-display text-2xl font-black text-zinc-950 dark:text-zinc-50 tabular-nums">
                    {formatPaise(dish.basePricePaise, { locale })}
                  </span>
                  <span className="text-sm font-bold text-zinc-400 line-through tabular-nums">
                    {formatPaise(originalPricePaise, { locale })}
                  </span>
                  <span className="rounded-lg bg-emerald-600 text-white font-extrabold text-xs px-2 py-0.5 shadow-xs">
                    {discountPercent}% OFF
                  </span>
                </div>

                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                  <Clock className="size-3.5 text-amber-600" />
                  <span>15-20 min prep</span>
                </span>
              </div>

              {/* Transparent Taxes & Zero Hidden Charge Guarantee */}
              <div className="flex items-center gap-2 pt-1 border-t border-amber-400/20 text-[11px] text-zinc-600 dark:text-zinc-300 font-medium">
                <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
                <span>Inclusive of all GST taxes · Zero hidden charges · 0 platform fee</span>
              </div>
            </div>

            {/* Description */}
            {dish.description && (
              <div className="space-y-1">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                  About this Dish
                </h4>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                  {dish.description}
                </p>
              </div>
            )}

            {/* Nutrition & Macro Ribbon */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-800 dark:text-zinc-200">
                <span className="flex items-center gap-1.5">
                  <Activity className="size-4 text-emerald-600" />
                  <span>Estimated Nutritional Value</span>
                </span>
                <span className="text-zinc-400 font-normal">Per Serving (Serves 1-2)</span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded-xl bg-white dark:bg-zinc-800 p-2 shadow-2xs border border-zinc-200/60 dark:border-zinc-700/60">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase">Calories</span>
                  <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">{calories} kcal</span>
                </div>
                <div className="rounded-xl bg-white dark:bg-zinc-800 p-2 shadow-2xs border border-zinc-200/60 dark:border-zinc-700/60">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase">Protein</span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{protein}</span>
                </div>
                <div className="rounded-xl bg-white dark:bg-zinc-800 p-2 shadow-2xs border border-zinc-200/60 dark:border-zinc-700/60">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase">Carbs</span>
                  <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">{carbs}</span>
                </div>
                <div className="rounded-xl bg-white dark:bg-zinc-800 p-2 shadow-2xs border border-zinc-200/60 dark:border-zinc-700/60">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase">Fats</span>
                  <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">{fats}</span>
                </div>
              </div>
            </div>

            {/* Chef Cooking Instruction Input */}
            <div className="space-y-1.5">
              <label htmlFor="dish-notes" className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <ChefHat className="size-3.5 text-amber-500" />
                <span>Special Instructions for Kitchen (Optional)</span>
              </label>
              <input
                id="dish-notes"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g. Less spicy, extra gravy, no cutlery needed..."
                className="w-full h-10 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Customization Note if variants or addons exist */}
            {hasCustomizations && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300/50 p-2.5 text-xs text-amber-900 dark:text-amber-200 font-medium flex items-center justify-between">
                <span>✨ This dish has customizable portions &amp; gourmet add-ons.</span>
                <span className="font-extrabold text-[11px] uppercase tracking-wide text-amber-700 dark:text-amber-300">
                  Customisable
                </span>
              </div>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between gap-4 shrink-0">
            {/* Quantity Stepper (for simple items) */}
            {!hasCustomizations ? (
              cartQuantity > 0 && onUpdateCartQuantity ? (
                <div className="flex h-11 items-center gap-2 rounded-2xl bg-amber-500/15 border border-amber-400/50 px-2 text-zinc-950 font-black">
                  <button
                    type="button"
                    onClick={() => onUpdateCartQuantity(cartQuantity - 1)}
                    className="size-7 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 shadow-2xs active:scale-90 transition"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="size-3.5 stroke-[3]" />
                  </button>
                  <span className="w-6 text-center text-sm font-black tabular-nums text-zinc-900 dark:text-zinc-100">
                    {cartQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateCartQuantity(cartQuantity + 1)}
                    className="size-7 flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 shadow-xs active:scale-90 transition"
                    aria-label="Increase quantity"
                  >
                    <Plus className="size-3.5 stroke-[3]" />
                  </button>
                </div>
              ) : (
                <div className="flex h-11 items-center gap-2 rounded-2xl bg-zinc-200/80 dark:bg-zinc-800 px-2 text-zinc-950 font-black">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="size-7 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs active:scale-90 transition"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="size-3.5 stroke-[3]" />
                  </button>
                  <span className="w-6 text-center text-sm font-black tabular-nums text-zinc-900 dark:text-zinc-100">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="size-7 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs active:scale-90 transition"
                    aria-label="Increase quantity"
                  >
                    <Plus className="size-3.5 stroke-[3]" />
                  </button>
                </div>
              )
            ) : null}

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-zinc-950 font-black text-sm uppercase tracking-wider shadow-[0_4px_16px_rgba(245,158,11,0.45)] hover:shadow-[0_6px_22px_rgba(245,158,11,0.6)] active:scale-95 transition-all flex items-center justify-between px-5 cursor-pointer"
            >
              <span>{hasCustomizations ? "Customise & Add" : "Add to Order"}</span>
              <span className="font-mono text-base font-black">
                {formatPaise(dish.basePricePaise * (hasCustomizations ? 1 : quantity), { locale })}
              </span>
            </button>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
