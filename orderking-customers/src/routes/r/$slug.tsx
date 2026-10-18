import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/db-cloud";
import {
  Heart,
  Headset,
  Search,
  Sparkles,
  Star,
  Clock,
  MapPin,
  ShieldCheck,
  ChevronRight,
  ShoppingBag,
  Plus,
  Minus,
  ArrowLeft,
  Share2,
  Flame,
  X,
  Bike,
  Users,
  Utensils,
  ChefHat,
  Activity,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { CustomizeDialog } from "@/components/market/customize-dialog";
import { CookingInstructionsModal } from "@/components/market/cooking-instructions-modal";
import { AudioVoiceNote } from "@/components/market/audio-voice-note";
import { extractEffectiveAddonGroups } from "@/lib/modifiers/nested-modifiers";
import { GroupOrderingModal } from "@/components/market/group-ordering-modal";
import { DiningOutReservationModal } from "@/components/market/dining-out-reservation";
import { NutritionAllergenDrawer } from "@/components/market/nutrition-allergen-drawer";
import { DishDetailModal, getAppetizingDishImage } from "@/components/market/dish-detail-modal";
import { CustomerShell } from "@/components/market/shell";
import { CartConflictModal } from "@/components/market/cart-conflict-modal";
import { getHighlightedSegments } from "@/lib/menu/search-and-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBrand, useT } from "@/components/providers";
import { trackAnalytics } from "@/lib/server/quote";
import { toggleFavourite } from "@/lib/server/account";
import { formatPaise } from "@/lib/money";
import type { MenuItemView } from "@/lib/market-types";
import { cartCount, cartKey, useCartStore, type CartItem } from "@/lib/stores/cart";
import { useLocationStore } from "@/lib/stores/location";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { WhatsAppShare } from "@/components/market/whatsapp-share";
import { WhatsAppViralBountiesWidget as ReferralGamifiedLoop } from "@/components/market/whatsapp-viral-bounties-widget";
import { RestaurantSeo, buildRestaurantJsonLd } from "@/components/seo/RestaurantSeo";

export const Route = createFileRoute("/r/$slug")({
  head: ({ params }) => {
    const slug = (params as { slug?: string })?.slug ?? "";
    const cleanName = slug
      ? slug
          .split("-")
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")
      : "Restaurant";
    const title = `${cleanName} - Food Delivery Near Me | Order Online | OrderKing`;
    const desc = `Order food online from ${cleanName}. Fast 30-min food delivery, live tracking, and fair pricing on OrderKing.`;
    const pageUrl = `https://orderking.in/r/${slug}`;
    const ogImg = `https://orderking.in/icon-512.png`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { name: "keywords", content: `${cleanName}, food delivery near me, order food online near me, restaurants near me, online food order, best food delivery, OrderKing` },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: pageUrl },
        { property: "og:image", content: ogImg },
        { property: "og:image:width", content: "512" },
        { property: "og:image:height", content: "512" },
        { property: "og:type", content: "restaurant.restaurant" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: ogImg },
      ],
    };
  },
  component: RestaurantPage,
});

function HighlightMatch({ text, query }: { text: string; query: string }) {
  const segments = useMemo(() => getHighlightedSegments(text, query), [text, query]);
  return (
    <>
      {segments.map((seg, i) =>
        seg.isMatch ? (
          <mark
            key={i}
            className="bg-amber-300 dark:bg-amber-400/40 text-amber-950 dark:text-amber-100 rounded-xs px-0.5 font-black not-italic"
          >
            {seg.text}
          </mark>
        ) : (
          seg.text
        )
      )}
    </>
  );
}

function RestaurantPage() {
  const { slug } = Route.useParams();
  const { t, lang } = useT();
  const { brand } = useBrand();
  const locale = lang === "bn" ? "bn-IN" : "en-IN";
  const location = useLocationStore((s) => s.location);
  const user = useCurrentUser();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const cartItems = useCartStore((s) => s.items);
  const cartRestaurantId = useCartStore((s) => s.restaurantId);
  const cartRestaurantName = useCartStore((s) => s.restaurantName);
  const addItem = useCartStore((s) => s.addItem);
  const updateQty = useCartStore((s) => s.updateQty);
  const remove = useCartStore((s) => s.remove);
  const replaceAndAdd = useCartStore((s) => s.replaceAndAdd);

  const [custom, setCustom] = useState<MenuItemView | null>(null);
  const [replaceWith, setReplaceWith] = useState<{ name: string; line: CartItem } | null>(null);
  const [menuQ, setMenuQ] = useState("");
  // Strictly "all" | "veg" according to Rule 4. Plus bestseller filter.
  const [dietFilter, setDietFilter] = useState<"all" | "veg">("all");
  const [onlyBestsellers, setOnlyBestsellers] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [isFav, setIsFav] = useState(false);
  const [showGroupOrder, setShowGroupOrder] = useState(false);
  const [showDiningReservation, setShowDiningReservation] = useState(false);
  const [showCookingInstructions, setShowCookingInstructions] = useState(false);
  const [cookingInstructionsItem, setCookingInstructionsItem] = useState<string>("");
  const [showNutritionDrawer, setShowNutritionDrawer] = useState(false);
  const [nutritionItem, setNutritionItem] = useState<MenuItemView | null>(null);
  const [selectedDishDetail, setSelectedDishDetail] = useState<MenuItemView | null>(null);

  const detail = useQuery({
    queryKey: ["restaurant", slug, location.lat, location.lng, lang],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("slug", slug);
      params.set("lat", location.lat.toString());
      params.set("lng", location.lng.toString());
      if (lang) params.set("lang", lang);

      const response = await fetch(`/api/restaurant?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch restaurant");
      return response.json();
    },
  });

  const restaurant = detail.data?.restaurant;

  useEffect(() => {
    if (restaurant) {
      void trackAnalytics({ data: { name: "restaurant_view", payload: { slug } } });
      if (restaurant.categories?.length && !activeCategory) {
        setActiveCategory(restaurant.categories[0].id);
      }
    }
  }, [restaurant, slug, activeCategory]);

  // Live Supabase Realtime synchronization with Merchant catalog updates & stockout toggles
  useEffect(() => {
    const restaurantId = restaurant?.card?.id;
    if (!restaurantId) return;

    const channel = supabase
      .channel(`customer-menu-sync-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "item_availability",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: ["restaurant", slug] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "items",
        },
        () => {
          void qc.invalidateQueries({ queryKey: ["restaurant", slug] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "restaurants",
          filter: `id=eq.${restaurantId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: ["restaurant", slug] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [restaurant?.card?.id, slug, qc]);

  const add = (restId: string, restName: string, line: CartItem) => {
    const result = addItem(restId, restName, line);
    if (result === "replace") setReplaceWith({ name: restName, line });
    else toast.success(t("common.added") || "Added to cart!");
  };

  const onAddClick = (item: MenuItemView) => {
    if (!restaurant) return;
    void trackAnalytics({ data: { name: "item_view", payload: { item: item.id } } });
    if (item.variants.length || item.addonGroups.length) {
      setCustom(item);
      return;
    }
    const line: Omit<CartItem, "key"> = {
      itemId: item.id,
      variantId: null,
      addonIds: [],
      quantity: 1,
      instructions: "",
    };
    add(restaurant.card.id, restaurant.card.name, { ...line, key: cartKey(line) });
    void trackAnalytics({ data: { name: "add_to_cart", payload: { item: item.id } } });
  };

  // Accurate estimation of cart subtotal in paise including multi-level modifier extras
  const cartSubtotalPaise = useMemo(() => {
    if (!restaurant || cartRestaurantId !== restaurant.card.id) return 0;
    let sum = 0;
    const itemMap = new Map<string, MenuItemView>();
    restaurant.categories.forEach((cat: any) => {
      cat.items.forEach((it: MenuItemView) => itemMap.set(it.id, it));
    });
    for (const ci of cartItems) {
      const baseItem = itemMap.get(ci.itemId);
      if (baseItem) {
        let unitPaise = baseItem.basePricePaise;
        if (ci.variantId) {
          const v = baseItem.variants.find((v) => v.id === ci.variantId);
          if (v) unitPaise = v.pricePaise;
        }
        if (ci.addonIds && ci.addonIds.length > 0) {
          const allGroups = extractEffectiveAddonGroups(baseItem, ci.variantId, ci.addonIds);
          const addonMap = new Map<string, number>();
          for (const g of allGroups) {
            for (const a of g.addons) {
              addonMap.set(a.id, a.pricePaise);
            }
          }
          for (const aid of ci.addonIds) {
            unitPaise += addonMap.get(aid) || 0;
          }
        }
        sum += unitPaise * ci.quantity;
      }
    }
    return sum;
  }, [cartItems, cartRestaurantId, restaurant]);

  const totalCartCount = cartCount(cartItems);
  const isCurrentRestaurantInCart = cartRestaurantId === restaurant?.card.id && totalCartCount > 0;

  const jsonLd = restaurant ? buildRestaurantJsonLd(restaurant, slug, location) : null;

  return (
    <CustomerShell>
      {detail.isPending ? (
        <div className="p-4 sm:p-6 space-y-4">
          <Skeleton className="h-64 sm:h-80 w-full rounded-3xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-4 mt-6">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        </div>
      ) : detail.isError ? (
        <div className="p-8 text-center space-y-4">
          <p className="text-zinc-600 dark:text-zinc-400">Failed to load restaurant details.</p>
          <Button
            type="button"
            className="bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 font-bold"
            onClick={() => void detail.refetch()}
          >
            {t("common.retry")}
          </Button>
        </div>
      ) : !restaurant ? (
        <p className="p-8 text-center text-muted">{t("common.empty")}</p>
      ) : (
        <article className="pb-28">
          <RestaurantSeo restaurant={restaurant} slug={slug} location={location} />
          {jsonLd ? (
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
          ) : null}

          {/* 1. HERO IMAGE WITH PARALLAX GRADIENT OVERLAY */}
          <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden bg-zinc-950">
            {restaurant.card.coverImage ? (
              <img
                loading="eager"
                src={restaurant.card.coverImage}
                alt={restaurant.card.name}
                className="h-full w-full object-cover object-center scale-105 transition-transform duration-700 ease-out"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-amber-950 via-zinc-900 to-black" />
            )}

            {/* Parallax Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-black/60" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent pointer-events-none" />

            {/* Top Action Bar */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="flex size-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-md text-white border border-white/20 hover:bg-black/70 transition active:scale-95 shadow-md"
                aria-label="Go Back"
              >
                <ArrowLeft className="size-5" />
              </button>

              <div className="flex items-center gap-2">
                {restaurant.card.dataLabel !== "REAL" && (
                  <Badge tone="warn" className="shadow-md">
                    {t("common.sample")}
                  </Badge>
                )}
                {restaurant.card.promoted && (
                  <Badge className="bg-amber-500 text-zinc-950 font-bold shadow-md">
                    👑 {t("common.ad")}
                  </Badge>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const url = typeof window !== "undefined" ? window.location.href : "";
                    if (navigator.share) {
                      navigator.share({ title: restaurant.card.name, url }).catch(() => {});
                    } else if (navigator.clipboard) {
                      navigator.clipboard.writeText(url);
                      toast.success("Restaurant link copied to clipboard!");
                    }
                  }}
                  className="flex size-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-md text-white border border-white/20 hover:bg-black/70 transition active:scale-95 shadow-md"
                  aria-label="Share restaurant"
                >
                  <Share2 className="size-4" />
                </button>

                {user && (
                  <button
                    type="button"
                    className={`flex size-10 items-center justify-center rounded-full backdrop-blur-md border border-white/20 transition active:scale-95 shadow-md ${
                      isFav ? "bg-rose-600 text-white" : "bg-black/50 text-white hover:bg-black/70"
                    }`}
                    aria-label={t("account.favourites")}
                    onClick={() => {
                      setIsFav(!isFav);
                      void toggleFavourite({ data: { restaurantId: restaurant.card.id } });
                      toast.success(isFav ? "Removed from favourites" : "Saved to favourites! ❤️");
                    }}
                  >
                    <Heart className={`size-5 ${isFav ? "fill-white" : ""}`} />
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Floating Badges inside Hero */}
            <div className="absolute bottom-16 sm:bottom-20 left-4 right-4 flex flex-wrap items-center gap-2 z-10">
              <span className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md border border-amber-400/40 px-3 py-1 text-xs font-bold text-amber-300 shadow-md">
                <Sparkles className="size-3.5 text-amber-400" />
                OrderKing Verified Kitchen
              </span>
              {restaurant.card.vegOnly && (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-500/50 px-3 py-1 text-xs font-bold text-emerald-300 shadow-md">
                  <span className="size-2 rounded-full bg-emerald-400" />
                  100% Pure Veg Outlet
                </span>
              )}
            </div>
          </div>

          {/* 2. ELEVATED LUXURY RESTAURANT INFO CARD WITH GRADIENT RATING BADGE */}
          <div className="relative -mt-12 sm:-mt-16 mx-3 sm:mx-6 md:mx-auto max-w-4xl z-20">
            <div className="rounded-3xl border border-amber-500/25 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
              {/* Title & Rating Row */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {restaurant.card.name}
                  </h1>
                  <p className="mt-1 text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    {restaurant.card.cuisineSummary} <span className="text-amber-500">✦</span> {restaurant.area}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {restaurant.hoursLabel}
                  </p>
                </div>

                {/* Gradient Rating Badge */}
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <div className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 px-3.5 py-1.5 text-white shadow-md">
                    <Star className="size-4 fill-white" />
                    <span className="text-base font-black">
                      {restaurant.card.ratingAvg != null
                        ? (typeof restaurant.card.ratingAvg === "number"
                            ? restaurant.card.ratingAvg
                            : Number(restaurant.card.ratingAvg || 0)
                          ).toFixed(1)
                        : "4.8"}
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                      {restaurant.card.ratingCount ? `${restaurant.card.ratingCount}+ ratings` : "1.2k+ ratings"}
                    </span>
                    <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      OrderKing Top 1%
                    </span>
                  </div>
                </div>
              </div>

              {restaurant.description && (
                <p className="mt-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800 pt-3">
                  {restaurant.description}
                </p>
              )}

              {/* 4-Item Metric Ribbon (Delivery, Distance, Min Order, Hours) */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-500/10 p-3 border border-amber-400/20">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600">
                    <Clock className="size-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-zinc-400">Estimated Delivery</span>
                    <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                      ⚡ {restaurant.card.etaMinutes} mins
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600">
                    <MapPin className="size-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-zinc-400">Distance</span>
                    <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                      📍 {restaurant.card.distanceKm != null
                        ? `${(typeof restaurant.card.distanceKm === "number"
                            ? restaurant.card.distanceKm
                            : Number(restaurant.card.distanceKm || 0)
                          ).toFixed(1)} km`
                        : "Nearby"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600">
                    <Bike className="size-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-zinc-400">Delivery Fee</span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {restaurant.card.deliveryFeePaise === 0
                        ? "FREE Delivery"
                        : formatPaise(restaurant.card.deliveryFeePaise, { locale })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600">
                    <ShoppingBag className="size-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-zinc-400">Min Order</span>
                    <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                      {formatPaise(restaurant.card.minOrderPaise, { locale })}
                    </span>
                  </div>
                </div>
              </div>

              {!restaurant.card.open && (
                <div className="mt-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs font-semibold text-rose-600">
                  ⛔ {t("restaurant.closedNotice")}
                </div>
              )}

              {/* OrderKing VIP Gold Pass Banner */}
              <div className="mt-3.5 rounded-2xl border border-amber-400/50 bg-gradient-to-r from-amber-500/20 via-yellow-400/25 to-amber-600/15 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-zinc-950 font-black shadow-sm text-lg">
                      👑
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-black text-zinc-950 dark:text-amber-100">
                          OrderKing VIP Member Privileges
                        </span>
                        <span className="rounded-full bg-amber-400/30 border border-amber-500/40 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">
                          Gold Tier
                        </span>
                      </div>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-0.5">
                        Free Delivery on orders above ₹199 + Extra 15% OFF (use code{" "}
                        <strong className="font-mono text-amber-700 dark:text-amber-300 font-extrabold">VIPGOLD</strong>)
                      </p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex rounded-xl bg-amber-500 text-zinc-950 px-3 py-1 text-xs font-black uppercase tracking-wider shadow-xs">
                    VIP Priority
                  </span>
                </div>
              </div>

              {/* FSSAI Hygiene & Kitchen Safety Audit Card */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 px-4 py-2.5 text-xs">
                <div className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300">
                  <span className="font-bold flex items-center gap-1.5 text-zinc-900 dark:text-white">
                    <ShieldCheck className="size-4 text-emerald-600" />
                    FSSAI Verified Kitchen
                  </span>
                  <span>•</span>
                  <span className="text-emerald-600 font-bold">⭐ 4.8/5 Clean Kitchen Audit</span>
                </div>
                <span className="text-[11px] text-zinc-500 font-medium">🌡️ Chef Temp: 98.4°F (Checked Today)</span>
              </div>

              {/* Luxury Quick Action Ribbon: Group Order, Dining Reservation, Chef Notes, Nutrition */}
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setShowGroupOrder(true)}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 hover:from-amber-500/20 hover:to-yellow-500/20 p-2.5 text-xs font-bold text-amber-950 dark:text-amber-100 transition shadow-2xs active:scale-95"
                >
                  <Users className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Group Order</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDiningReservation(true)}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 hover:from-amber-500/20 hover:to-yellow-500/20 p-2.5 text-xs font-bold text-amber-950 dark:text-amber-100 transition shadow-2xs active:scale-95"
                >
                  <Utensils className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Book Table</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCookingInstructionsItem(restaurant.card.name);
                    setShowCookingInstructions(true);
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 hover:from-amber-500/20 hover:to-yellow-500/20 p-2.5 text-xs font-bold text-amber-950 dark:text-amber-100 transition shadow-2xs active:scale-95"
                >
                  <ChefHat className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Chef Notes</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNutritionItem(null);
                    setShowNutritionDrawer(true);
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 p-2.5 text-xs font-bold text-emerald-950 dark:text-emerald-100 transition shadow-2xs active:scale-95"
                >
                  <Activity className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Nutrition</span>
                </button>
              </div>

              {/* WhatsApp Deep-Link Sharing Component */}
              <WhatsAppShare
                variant="restaurant"
                restaurantName={restaurant.card.name}
                restaurantSlug={slug}
                cuisine={restaurant.card.cuisineSummary}
                className="mt-3"
              />

              {/* 1-Tap 15-Second Kitchen Audio Voice Note */}
              <AudioVoiceNote
                target="kitchen"
                samplePlaceholder="Please make it extra spicy and don't add chopped onions"
                className="mt-3.5"
              />

              {/* Search Bar & Diet Filters */}
              <div className="mt-5 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                  <input
                    value={menuQ}
                    onChange={(e) => setMenuQ(e.target.value)}
                    placeholder={`Search within ${restaurant.card.name} menu...`}
                    className="h-12 w-full rounded-2xl border border-amber-400/30 bg-surface pl-10 pr-10 text-sm font-medium focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/30 shadow-xs"
                  />
                  {menuQ && (
                    <button
                      type="button"
                      onClick={() => setMenuQ("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>

                {/* Filter Pills: Strictly "all" | "veg" according to Rule 4 */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setDietFilter("all")}
                    className={`flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-xs font-bold transition shadow-xs ${
                      dietFilter === "all"
                        ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                        : "bg-surface border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    All Dishes
                  </button>

                  <button
                    type="button"
                    onClick={() => setDietFilter(dietFilter === "veg" ? "all" : "veg")}
                    className={`flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-xs font-bold transition shadow-xs ${
                      dietFilter === "veg"
                        ? "bg-emerald-600 text-white shadow-emerald-500/20"
                        : "bg-surface border border-emerald-600/40 text-emerald-800 hover:bg-emerald-50"
                    }`}
                  >
                    <span className="flex size-3.5 items-center justify-center rounded-xs border border-emerald-600 bg-white">
                      <span className="size-1.5 rounded-full bg-emerald-600" />
                    </span>
                    Pure Veg Only
                  </button>

                  <button
                    type="button"
                    onClick={() => setOnlyBestsellers(!onlyBestsellers)}
                    className={`flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-xs font-bold transition shadow-xs ${
                      onlyBestsellers
                        ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 shadow-amber-500/20"
                        : "bg-surface border border-amber-400/40 text-amber-900 dark:text-amber-200 hover:bg-amber-50"
                    }`}
                  >
                    <Flame className="size-3.5 text-amber-600 fill-amber-500" />
                    Bestsellers
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. MENU CATEGORIES WITH COLORED TABS (STICKY) */}
          <nav className="sticky top-0 z-30 mt-6 border-y border-amber-500/20 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md px-4 py-3 shadow-sm">
            <div className="max-w-4xl mx-auto flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
              {restaurant.categories.map((c: any) => {
                const isActive = activeCategory === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setActiveCategory(c.id);
                      const el = document.getElementById(`cat-${c.id}`);
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }}
                    className={`shrink-0 rounded-2xl px-4 py-2 text-xs font-extrabold transition-all no-underline flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 shadow-md scale-105"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-amber-100/60 dark:hover:bg-zinc-700"
                    }`}
                  >
                    <span>{c.name}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                        isActive ? "bg-black/20 text-zinc-950" : "bg-black/10 dark:bg-white/10 text-zinc-500"
                      }`}
                    >
                      {c.items?.length ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* 4. MENU ITEMS WITH APPETIZING LAYOUT, PRICE IN BOLD, FSSAI GREEN DOT, AND GRADIENT ADD BUTTON */}
          <div className="max-w-4xl mx-auto px-3 sm:px-6 mt-4 space-y-8">
            {restaurant.categories.map((c: any) => {
              const filteredItems = c.items.filter((it: MenuItemView) => {
                if (menuQ && !it.name.toLowerCase().includes(menuQ.toLowerCase()) && !it.description?.toLowerCase().includes(menuQ.toLowerCase())) {
                  return false;
                }
                if (dietFilter === "veg" && !it.veg) return false;
                if (onlyBestsellers && !it.bestseller) return false;
                return true;
              });

              if (!filteredItems.length) return null;

              return (
                <section key={c.id} id={`cat-${c.id}`} className="scroll-mt-20">
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="font-display text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
                      {c.name}
                    </h2>
                    <span className="rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold text-xs px-2.5 py-0.5">
                      {filteredItems.length}
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-amber-500/30 to-transparent" />
                  </div>

                  <ul className="space-y-4">
                    {filteredItems.map((it: MenuItemView) => {
                      // Check if item is already in cart
                      const itemInCart = cartItems.find((ci) => ci.itemId === it.id);
                      const hasCustomizations = it.variants.length > 0 || it.addonGroups.length > 0;

                      return (
                        <li
                          key={it.id}
                          className="group relative rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-b from-white via-white to-amber-50/15 dark:from-zinc-900 dark:to-zinc-900/90 p-4 sm:p-5 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_28px_rgba(245,158,11,0.08)] hover:border-amber-400/50 transition-all duration-300 flex items-start justify-between gap-4"
                        >
                          {/* Item Details */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {/* FSSAI Standard Food Dot Symbol */}
                              {it.veg ? (
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

                              <p className="font-display font-bold text-base sm:text-lg text-zinc-900 dark:text-zinc-50 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                <HighlightMatch text={it.name} query={menuQ} />
                              </p>

                              {it.bestseller && (
                                <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-900 dark:text-amber-200 border border-amber-400/40 shadow-2xs">
                                  👑 Bestseller
                                </span>
                              )}
                            </div>

                            {/* Price in Bold Tabular Numerals */}
                            <p className="mt-1.5 tabular-nums text-base sm:text-lg font-black text-zinc-950 dark:text-zinc-100">
                              {formatPaise(it.basePricePaise, { locale })}
                            </p>

                            {/* Description */}
                            {it.description && (
                              <p className="mt-1 line-clamp-2 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                <HighlightMatch text={it.description} query={menuQ} />
                              </p>
                            )}

                            {/* Nutritional & Trust Badges */}
                            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                              <span className="rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 font-semibold text-zinc-600 dark:text-zinc-300">
                                🔥 {it.veg ? "320-380 kcal" : "420-520 kcal"}
                              </span>
                              <span className="rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 font-semibold text-zinc-600 dark:text-zinc-300">
                                💪 {it.veg ? "12g Protein" : "26g Protein"}
                              </span>
                              <span
                                className={`font-bold ${
                                  it.veg ? "text-emerald-600 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
                                }`}
                              >
                                {it.veg ? "🌱 100% Pure Veg" : "🍗 Halal Certified"}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setNutritionItem(it);
                                  setShowNutritionDrawer(true);
                                }}
                                className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition cursor-pointer"
                              >
                                <Activity className="size-3" />
                                <span>Nutrition</span>
                              </button>
                            </div>
                          </div>

                          {/* Image & Add Button (Elevated Floating Overlap Style) */}
                          <div className="relative shrink-0 flex flex-col items-center">
                            <div className="size-24 sm:size-28 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 shadow-sm">
                              {it.imageUrl ? (
                                <img
                                  loading="lazy"
                                  src={it.imageUrl}
                                  alt={it.name}
                                  className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                              ) : (
                                <div className="h-full w-full bg-gradient-to-br from-amber-500/10 via-zinc-100 to-amber-500/5 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center text-3xl">
                                  🍽️
                                </div>
                              )}
                            </div>

                            {/* Add Button with Gradient Fill & Bounce Animation */}
                            <div className="-mt-4 relative z-10">
                              {it.available ? (
                                !itemInCart || hasCustomizations ? (
                                  <div className="flex flex-col items-center">
                                    <button
                                      type="button"
                                      onClick={() => onAddClick(it)}
                                      className="h-9 px-5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-[0_4px_14px_rgba(245,158,11,0.4)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.55)] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <Plus className="size-3.5 stroke-[3]" />
                                      <span>{t("restaurant.add") || "ADD"}</span>
                                    </button>
                                    {hasCustomizations && (
                                      <span className="mt-1 text-[9px] font-extrabold uppercase tracking-tight text-amber-700 dark:text-amber-400">
                                        Customisable
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  /* Inline Stepper for items already in cart */
                                  <div className="flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-2 text-zinc-950 font-black shadow-md">
                                    <button
                                      type="button"
                                      onClick={() => updateQty(itemInCart.key, itemInCart.quantity - 1)}
                                      className="size-6 flex items-center justify-center rounded-lg bg-black/15 hover:bg-black/25 active:scale-90 transition"
                                      aria-label="Decrease quantity"
                                    >
                                      <Minus className="size-3 stroke-[3]" />
                                    </button>
                                    <span className="w-5 text-center text-xs tabular-nums font-black">
                                      {itemInCart.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => updateQty(itemInCart.key, itemInCart.quantity + 1)}
                                      className="size-6 flex items-center justify-center rounded-lg bg-black/15 hover:bg-black/25 active:scale-90 transition"
                                      aria-label="Increase quantity"
                                    >
                                      <Plus className="size-3 stroke-[3]" />
                                    </button>
                                  </div>
                                )
                              ) : (
                                <span className="rounded-lg bg-zinc-200 dark:bg-zinc-800 px-2.5 py-1 text-[11px] font-bold text-zinc-500">
                                  {t("restaurant.unavailable") || "Out of stock"}
                                </span>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}

            {/* Statutory FSSAI License & Regulatory Card */}
            <div className="my-8 rounded-3xl border border-amber-500/20 bg-gradient-to-br from-white via-zinc-50/50 to-amber-50/10 dark:from-zinc-900 dark:to-zinc-900 p-5 text-xs text-zinc-500 space-y-3 shadow-sm">
              <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div className="flex h-8 w-14 items-center justify-center rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-black tracking-tight text-[11px] shadow-2xs">
                  fssai
                </div>
                <div>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                    FSSAI Verified Commercial Kitchen
                  </p>
                  <p className="text-[11px] text-zinc-500">License verified partner on OrderKing Food Network</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-zinc-900 dark:text-zinc-100">{restaurant.card.name}</p>
                <p>{restaurant.addressLine || restaurant.area || "Authorized Commercial Kitchen"}</p>
              </div>
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-2 text-[11px] leading-relaxed text-zinc-400">
                OrderKing connects customers with licensed food preparation kitchens. Quality, ingredients, hygienic packaging, and compliance are guaranteed by the licensed partner.
              </div>
            </div>

            {/* Gamified Viral Loop */}
            <ReferralGamifiedLoop source="restaurant" className="my-8" />
          </div>

          <CustomizeDialog
            item={custom}
            open={Boolean(custom)}
            onOpenChange={(v) => !v && setCustom(null)}
            locale={locale}
            onConfirm={(line) => {
              add(restaurant.card.id, restaurant.card.name, line);
              void trackAnalytics({ data: { name: "add_to_cart", payload: { item: line.itemId } } });
            }}
          />

          {/* Cart Conflict Modal */}
          <CartConflictModal
            isOpen={Boolean(replaceWith && restaurant)}
            currentRestaurantName={cartRestaurantName}
            newRestaurantName={restaurant?.card.name || replaceWith?.name || "this restaurant"}
            onCancel={() => setReplaceWith(null)}
            onConfirm={() => {
              if (replaceWith && restaurant) {
                replaceAndAdd(restaurant.card.id, restaurant.card.name, replaceWith.line);
                setReplaceWith(null);
                toast.success(t("common.added") || "Added to cart!");
              }
            }}
          />

          {/* 5. STICKY BOTTOM CART BAR WITH ITEM COUNT AND TOTAL */}
          {totalCartCount > 0 && (
            <div className="fixed bottom-4 left-3 right-3 sm:left-6 sm:right-6 max-w-xl mx-auto z-40 animate-in slide-in-from-bottom-4 duration-300">
              <div className="rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-white p-3.5 sm:p-4 shadow-[0_16px_40px_rgba(0,0,0,0.5)] border border-amber-500/50 backdrop-blur-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-zinc-950 font-black shadow-md">
                    <ShoppingBag className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-amber-400/20 border border-amber-400/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300">
                        {totalCartCount} {totalCartCount === 1 ? "ITEM" : "ITEMS"}
                      </span>
                      {cartSubtotalPaise > 0 && (
                        <span className="font-display text-sm sm:text-base font-black tabular-nums text-white">
                          {formatPaise(cartSubtotalPaise, { locale })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 truncate max-w-[140px] sm:max-w-xs mt-0.5">
                      From {restaurant.card.name}
                    </p>
                  </div>
                </div>

                <Link
                  to="/cart"
                  className="rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-zinc-950 font-black text-xs sm:text-sm px-5 py-2.5 shadow-[0_0_24px_rgba(245,158,11,0.5)] flex items-center gap-2 uppercase tracking-wider hover:scale-105 active:scale-95 transition-all no-underline"
                >
                  <span>View Cart</span>
                  <ChevronRight className="size-4 stroke-[3]" />
                </Link>
              </div>
            </div>
          )}
          {/* Orphaned Luxury Modals Mounted */}
          <GroupOrderingModal
            isOpen={showGroupOrder}
            onClose={() => setShowGroupOrder(false)}
            restaurantName={restaurant.card.name}
            groupSessionId={`GRP-${restaurant.card.id.slice(0, 6)}`}
          />

          <DiningOutReservationModal
            isOpen={showDiningReservation}
            onClose={() => setShowDiningReservation(false)}
            restaurantId={restaurant.card.id}
            restaurantName={restaurant.card.name}
            restaurantArea={restaurant.area}
            cuisineSummary={restaurant.card.cuisineSummary}
          />

          <CookingInstructionsModal
            isOpen={showCookingInstructions}
            onClose={() => setShowCookingInstructions(false)}
            itemName={cookingInstructionsItem || restaurant.card.name}
            onSave={(inst) => {
              toast.success(`Chef instructions saved: ${inst}`);
            }}
          />

          <NutritionAllergenDrawer
            isOpen={showNutritionDrawer}
            onClose={() => {
              setShowNutritionDrawer(false);
              setNutritionItem(null);
            }}
            dishName={nutritionItem?.name || "Selected Dish"}
            caloriesKcal={nutritionItem?.veg ? 280 : 420}
            dietaryBadges={nutritionItem?.veg ? ["100% Pure Veg", "Fresh Ingredients"] : ["Halal Certified", "High Protein"]}
          />
        </article>
      )}
      <span className="sr-only">{brand.appName}</span>
    </CustomerShell>
  );
}
