
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Heart, Leaf } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CustomizeDialog } from "@/components/market/customize-dialog";
import { CustomerShell } from "@/components/market/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBrand, useT } from "@/components/providers";
import { getRestaurant } from "@/lib/server/catalog";
import { trackAnalytics } from "@/lib/server/quote";
import { toggleFavourite } from "@/lib/server/account";
import { formatPaise } from "@/lib/money";
import type { MenuItemView } from "@/lib/market-types";
import { cartKey, useCartStore, type CartItem } from "@/lib/stores/cart";
import { useLocationStore } from "@/lib/stores/location";
import { useCurrentUser } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/r/$slug")({ component: RestaurantPage });

function RestaurantPage() {
  const { slug } = Route.useParams();
  const { t, lang } = useT();
  const { brand } = useBrand();
  const locale = lang === "bn" ? "bn-IN" : "en-IN";
  const location = useLocationStore((s) => s.location);
  const user = useCurrentUser();
  const addItem = useCartStore((s) => s.addItem);
  const favouriteMutation = useMutation({
    mutationFn: () => toggleFavourite({ data: { restaurantId: restaurant?.card.id ?? "" } }),
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not update favourites."),
    onSuccess: (result) => toast.success(result.favourite ? "Added to favourites." : "Removed from favourites."),
  });
  const replaceAndAdd = useCartStore((s) => s.replaceAndAdd);
  const [custom, setCustom] = useState<MenuItemView | null>(null);
  const [replaceWith, setReplaceWith] = useState<{ name: string; line: CartItem } | null>(null);
  const [menuQ, setMenuQ] = useState("");
  const [dietFilter, setDietFilter] = useState<"ALL" | "VEG" | "NON_VEG" | "BESTSELLER">("ALL");

  const detail = useQuery({
    queryKey: ["restaurant", slug, location.lat, location.lng, lang],
    queryFn: () => getRestaurant({ data: { slug, lat: location.lat, lng: location.lng, lang } }),
  });

  const restaurant = detail.data?.restaurant;
  useEffect(() => {
    if (restaurant) void trackAnalytics({ data: { name: "restaurant_view", payload: { slug } } });
  }, [restaurant, slug]);

  const add = (restId: string, restName: string, line: CartItem) => {
    const result = addItem(restId, restName, line);
    if (result === "replace") setReplaceWith({ name: restName, line });
    else toast.success(t("common.added"));
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

  const jsonLd = restaurant
    ? {
        "@context": "https://schema.org",
        "@type": "Restaurant",
        name: restaurant.card.name,
        description: restaurant.description,
        address: {
          "@type": "PostalAddress",
          streetAddress: restaurant.addressLine,
          addressLocality: restaurant.area,
          addressCountry: "IN",
        },
        servesCuisine: restaurant.card.cuisineSummary,
        ...(restaurant.card.dataLabel === "REAL"
          ? {}
          : { additionalProperty: { "@type": "PropertyValue", name: "dataLabel", value: restaurant.card.dataLabel } }),
      }
    : null;

  return (
    <CustomerShell>
      {detail.isPending ? (
        <div className="p-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="mt-4 h-8 w-2/3" />
        </div>
      ) : detail.isError ? (
        <p className="p-4">
          <button type="button" className="text-primary" onClick={() => void detail.refetch()}>
            {t("common.retry")}
          </button>
        </p>
      ) : !restaurant ? (
        <p className="p-4 text-muted">{t("common.empty")}</p>
      ) : (
        <article>
          {jsonLd ? (
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
          ) : null}
          <div className="relative aspect-[16/9] bg-surface-2">
            {restaurant.card.coverImage ? (
              <img loading="lazy" src={restaurant.card.coverImage} alt="" className="h-full w-full object-cover" />
            ) : null}
            <div className="absolute left-3 top-3 flex gap-1">
              {restaurant.card.dataLabel !== "REAL" ? <Badge tone="warn">{t("common.sample")}</Badge> : null}
              {restaurant.card.promoted ? <Badge>{t("common.ad")}</Badge> : null}
            </div>
          </div>
          <div className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-3xl">{restaurant.card.name}</h1>
                <p className="mt-1 text-sm text-muted">{restaurant.card.cuisineSummary}</p>
              </div>
              {user ? (
                <button
                  type="button"
                  className="grid size-11 place-items-center rounded-full bg-surface"
                  aria-label={t("account.favourites")}
                  disabled={favouriteMutation.isPending || !restaurant}
                  onClick={() => favouriteMutation.mutate()}
                >
                  <Heart className="size-5" />
                </button>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-muted">{restaurant.description}</p>
            <p className="mt-2 text-sm text-muted">
              {t("restaurant.eta", { n: restaurant.card.etaMinutes })} ·{" "}
              {t("restaurant.delivery", { fee: formatPaise(restaurant.card.deliveryFeePaise, { locale }) })} ·{" "}
              {t("restaurant.minOrder", { amount: formatPaise(restaurant.card.minOrderPaise, { locale }) })}
            </p>
            <p className="text-sm text-muted">
              {restaurant.area} · {restaurant.hoursLabel}
            </p>
            {restaurant.card.dataLabel !== "REAL" ? (
              <p className="mt-2 text-sm text-warn">{t("restaurant.sampleNotice")}</p>
            ) : null}
            {!restaurant.card.open ? <p className="mt-2 text-sm text-danger">{t("restaurant.closedNotice")}</p> : null}

            <input
              value={menuQ}
              onChange={(e) => setMenuQ(e.target.value)}
              placeholder={t("restaurant.searchMenu")}
              className="mt-4 min-h-11 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm"
            />
            {/* Zomato-style Diet Filter Pills & Group Order */}
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setDietFilter(dietFilter === "VEG" ? "ALL" : "VEG")}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  dietFilter === "VEG"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                    : "border-border bg-surface text-muted hover:border-emerald-500"
                }`}
              >
                <span className="flex size-3.5 items-center justify-center rounded-sm border border-emerald-600 bg-white">
                  <span className="size-1.5 rounded-full bg-emerald-600" />
                </span>
                Veg
              </button>

              <button
                type="button"
                onClick={() => setDietFilter(dietFilter === "NON_VEG" ? "ALL" : "NON_VEG")}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  dietFilter === "NON_VEG"
                    ? "border-rose-600 bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200"
                    : "border-border bg-surface text-muted hover:border-rose-500"
                }`}
              >
                <span className="flex size-3.5 items-center justify-center rounded-sm border border-rose-600 bg-white">
                  <span className="size-0 border-x-[3px] border-b-[6px] border-x-transparent border-b-rose-600" />
                </span>
                Non-Veg
              </button>

              <button
                type="button"
                onClick={() => setDietFilter(dietFilter === "BESTSELLER" ? "ALL" : "BESTSELLER")}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  dietFilter === "BESTSELLER"
                    ? "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                    : "border-border bg-surface text-muted hover:border-amber-500"
                }`}
              >
                <span>⭐</span>
                Bestseller
              </button>

              <button
                type="button"
                onClick={() => {
                  const url = typeof window !== "undefined" ? window.location.href : "";
                  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
                    void navigator.share({
                      title: restaurant.card.name,
                      text: `View ${restaurant.card.name} on OrderKing`,
                      url,
                    }).catch(() => undefined);
                    return;
                  }
                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                    void navigator.clipboard.writeText(url);
                    toast.success("Restaurant link copied.");
                  }
                }}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                <span>↗</span>
                Share Restaurant
              </button>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto border-y border-border bg-bg px-4 py-2">
            {restaurant.categories.map((c: any) => (
              <a key={c.id} href={`#${c.id}`} className="shrink-0 rounded-full bg-surface px-3 py-2 text-sm text-fg no-underline">
                {c.name}
              </a>
            ))}
          </nav>
          {restaurant.categories.map((c: any) => {
            const filteredItems = c.items.filter((it: any) => {
              if (menuQ && !it.name.toLowerCase().includes(menuQ.toLowerCase())) return false;
              if (dietFilter === "VEG" && !it.veg) return false;
              if (dietFilter === "NON_VEG" && it.veg) return false;
              if (dietFilter === "BESTSELLER" && !it.bestseller) return false;
              return true;
            });
            if (!filteredItems.length) return null;
            return (
              <section key={c.id} id={c.id} className="px-4 py-5">
                <h2 className="mb-3 font-display text-xl">{c.name} ({filteredItems.length})</h2>
                <ul className="space-y-3">
                  {filteredItems.map((it: any) => (
                    <li key={it.id} className="flex gap-3 rounded-[var(--radius-lg)] bg-surface p-3">
                      {it.imageUrl ? (
                        <img loading="lazy" src={it.imageUrl} alt="" className="size-20 rounded-[var(--radius-sm)] object-cover" />
                      ) : (
                        <div className="size-20 rounded-[var(--radius-sm)] bg-surface-2" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {/* FSSAI Standard Food Dot Symbol */}
                          {it.veg ? (
                            <span className="flex size-4 shrink-0 items-center justify-center rounded-sm border border-emerald-600 bg-white" title="Pure Veg">
                              <span className="size-2 rounded-full bg-emerald-600" />
                            </span>
                          ) : (
                            <span className="flex size-4 shrink-0 items-center justify-center rounded-sm border border-rose-600 bg-white" title="Non-Veg">
                              <span className="size-0 border-x-[3.5px] border-b-[7px] border-x-transparent border-b-rose-600" />
                            </span>
                          )}
                          <p className="font-medium">{it.name}</p>
                          {it.bestseller ? <Badge>{t("restaurant.bestseller")}</Badge> : null}
                        </div>
                        <p className="line-clamp-2 text-sm text-muted">{it.description}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                          {it.veg ? (
                            <span className="text-[10px] text-emerald-600 font-semibold">🌱 Vegetarian</span>
                          ) : null}
                        </div>
                        <p className="mt-1.5 tabular-nums text-sm font-semibold">{formatPaise(it.basePricePaise, { locale })}</p>
                      </div>
                      {it.available ? (
                        <Button size="sm" variant="outline" onClick={() => onAddClick(it)}>
                          {it.variants.length || it.addonGroups.length ? t("restaurant.customise") : t("restaurant.add")}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted">{t("restaurant.unavailable")}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
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
        </article>
      )}
      {replaceWith && restaurant ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-fg/40 p-4 md:place-items-center">
          <div className="w-full max-w-md rounded-[var(--radius-xl)] bg-surface p-5">
            <h2 className="font-display text-xl">{t("cart.replaceTitle")}</h2>
            <p className="mt-2 text-sm text-muted">{t("cart.replaceBody", { name: replaceWith.name })}</p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setReplaceWith(null)}>
                {t("cart.keep")}
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  replaceAndAdd(restaurant.card.id, restaurant.card.name, replaceWith.line);
                  setReplaceWith(null);
                  toast.success(t("common.added"));
                }}
              >
                {t("cart.replace")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      <span className="sr-only">{brand.appName}</span>
    </CustomerShell>
  );
}
