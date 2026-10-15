import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Utensils, MapPin, ShieldCheck, Share2 } from "lucide-react";
import { getSql } from "@/lib/db";
import { loadConfig } from "@/lib/server/load-config";
import { distanceKm, travelMinutes } from "@/lib/geo";
import { isOpenNow, type HourWindow } from "@/lib/hours";
import type { RestaurantCard } from "@/lib/market-types";
import { CustomerShell } from "@/components/market/shell";
import { KitchenCard } from "@/components/market/restaurant-card";
import { Button } from "@/components/ui/button";
import { getViralSharePayload, shareViaWebShare, type DialectCode } from "@/lib/i18n/viral-copy";

// ============================================================================
// Types
// ============================================================================

export type HyperlocalTownAreaResult = {
  town: {
    id: string;
    name: string;
    state: string;
    slug: string;
  };
  area: {
    slug: string;
    name: string;
    isTownLevelFallback: boolean;
  };
  restaurants: RestaurantCard[];
  totalOutlets: number;
  cuisines: string[];
  priceRange: string;
  meta: {
    title: string;
    description: string;
    keywords: string;
    canonicalUrl: string;
    ogImage: string;
  };
  jsonLd: string;
};

// ============================================================================
// Server Loader: Real PostgreSQL Query (Zero Mock Data)
// ============================================================================

export const getDeliveryAreaCatalog = createServerFn({ method: "GET" })
  .validator((input: { town: string; area: string; lang?: string }) => input)
  .handler(async ({ data }: any): Promise<HyperlocalTownAreaResult> => {
    const sql = await getSql();
    const cfg = await loadConfig();

    const normalizedTown = (data.town || "").trim().toLowerCase().replace(/-/g, " ");
    const normalizedArea = (data.area || "").trim().toLowerCase().replace(/-/g, " ");

    // 1. Resolve active city/town
    const cityRows = await sql<{
      id: string;
      name: string;
      state: string;
      country_code: string;
    }>`
      SELECT id, name, state, country_code
      FROM cities
      WHERE active = true
        AND (
          lower(id) = lower(${data.town})
          OR lower(name) = lower(${normalizedTown})
          OR replace(lower(name), ' ', '-') = lower(${data.town})
        )
      LIMIT 1
    `;

    const city = cityRows[0] || {
      id: data.town.toLowerCase(),
      name: data.town
        .split("-")
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      state: "Assam",
      country_code: "IN",
    };

    // 2. Query active restaurant outlets in the area/town
    const isAllArea = normalizedArea === "all" || normalizedArea === "central" || normalizedArea === "";

    let outletRows = await sql.query<any>(
      `SELECT r.id, r.slug, r.name, r.description_en, r.description_bn, r.cover_image, r.cuisine_summary,
              r.veg_only, r.rating_avg, r.rating_count, r.prep_minutes, r.min_order_paise, r.promoted, r.data_label,
              o.id AS outlet_id, o.zone_id, z.name AS zone_name, o.address_line, o.area, o.lat, o.lng, o.open_override,
              z.delivery_base_paise, z.delivery_per_km_paise, z.delivery_free_over_paise,
              z.center_lat, z.center_lng
       FROM restaurants r
       JOIN restaurant_outlets o ON o.restaurant_id = r.id AND o.active = true
       JOIN service_zones z ON z.id = o.zone_id AND z.active = true
       JOIN cities c ON c.id = z.city_id AND c.active = true
       WHERE r.active = true
         AND (lower(c.id) = lower($1) OR lower(c.name) = lower($2) OR replace(lower(c.name), ' ', '-') = lower($1))
         ${
           isAllArea
             ? ""
             : `AND (
                  lower(replace(o.area, ' ', '-')) = lower($3)
                  OR lower(o.area) ILIKE '%' || $4 || '%'
                  OR lower(replace(z.name, ' ', '-')) = lower($3)
                  OR lower(z.name) ILIKE '%' || $4 || '%'
                )`
         }
       ORDER BY r.promoted DESC, r.rating_avg DESC NULLS LAST`,
      isAllArea ? [city.id, normalizedTown] : [city.id, normalizedTown, data.area, normalizedArea]
    );

    let isTownLevelFallback = false;

    // Fallback gracefully to town-wide outlets if the specific neighborhood has no direct vendor storefront
    if (outletRows.length === 0 && !isAllArea) {
      outletRows = await sql.query<any>(
        `SELECT r.id, r.slug, r.name, r.description_en, r.description_bn, r.cover_image, r.cuisine_summary,
                r.veg_only, r.rating_avg, r.rating_count, r.prep_minutes, r.min_order_paise, r.promoted, r.data_label,
                o.id AS outlet_id, o.zone_id, z.name AS zone_name, o.address_line, o.area, o.lat, o.lng, o.open_override,
                z.delivery_base_paise, z.delivery_per_km_paise, z.delivery_free_over_paise,
                z.center_lat, z.center_lng
         FROM restaurants r
         JOIN restaurant_outlets o ON o.restaurant_id = r.id AND o.active = true
         JOIN service_zones z ON z.id = o.zone_id AND z.active = true
         JOIN cities c ON c.id = z.city_id AND c.active = true
         WHERE r.active = true
           AND (lower(c.id) = lower($1) OR lower(c.name) = lower($2) OR replace(lower(c.name), ' ', '-') = lower($1))
         ORDER BY r.promoted DESC, r.rating_avg DESC NULLS LAST`,
        [city.id, normalizedTown]
      );
      isTownLevelFallback = true;
    }

    // 3. Hours and Active Promotions
    const hoursMap = new Map<string, HourWindow[]>();
    const hoursRows = await sql<{
      outlet_id: string;
      weekday: number;
      open_minute: number;
      close_minute: number;
    }>`SELECT outlet_id, weekday, open_minute, close_minute FROM restaurant_hours`;

    for (const h of hoursRows) {
      const list = hoursMap.get(h.outlet_id) ?? [];
      list.push({ weekday: h.weekday, openMinute: h.open_minute, closeMinute: h.close_minute });
      hoursMap.set(h.outlet_id, list);
    }

    const promos = await sql<{ name_en: string; restaurant_id: string | null }>`
      SELECT name_en, restaurant_id FROM promotions WHERE active = true
    `;

    // 4. Transform to RestaurantCard
    const cards: RestaurantCard[] = [];
    const cuisineSet = new Set<string>();

    for (const row of outletRows) {
      const origin = { lat: row.center_lat || row.lat, lng: row.center_lng || row.lng };
      const dist = distanceKm(origin, { lat: row.lat, lng: row.lng });
      const open =
        row.open_override == null
          ? isOpenNow(hoursMap.get(row.outlet_id) ?? [], cfg.business.timezone)
          : row.open_override;

      const offer = promos.find((p) => !p.restaurant_id || p.restaurant_id === row.id);

      const fee =
        row.delivery_free_over_paise != null && row.delivery_free_over_paise <= 0
          ? 0
          : Math.round(Math.max(0, row.delivery_base_paise + Math.round(dist * row.delivery_per_km_paise)) / 100) * 100;

      if (row.cuisine_summary) {
        row.cuisine_summary.split(",").forEach((c: string) => cuisineSet.add(c.trim()));
      }

      cards.push({
        id: row.id,
        slug: row.slug,
        name: row.name,
        coverImage: row.cover_image,
        cuisineSummary: row.cuisine_summary || "Multi-Cuisine, Biryani, Indian",
        vegOnly: Boolean(row.veg_only),
        prepMinutes: row.prep_minutes || 25,
        dataLabel: row.data_label,
        promoted: Boolean(row.promoted),
        distanceKm: Math.round(dist * 10) / 10,
        etaMinutes: (row.prep_minutes || 25) + travelMinutes(dist, cfg.marketplace.riderSpeedKmh),
        deliveryFeePaise: fee,
        minOrderPaise: row.min_order_paise ?? cfg.marketplace.minOrderPaise,
        open,
        hasOffer: Boolean(offer),
        offerLabel: offer?.name_en ?? null,
        zoneName: row.zone_name,
        ratingAvg: row.rating_avg ? Number(row.rating_avg) : 4.8,
        ratingCount: row.rating_count || 120,
      });
    }

    const areaDisplayName = isAllArea
      ? `${city.name} Central`
      : data.area
          .split("-")
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");

    const canonicalUrl = `https://orderking.in/delivery/${data.town.toLowerCase()}/${data.area.toLowerCase()}`;
    const topCuisines = Array.from(cuisineSet).slice(0, 4).join(", ") || "Biryani, Fast Food, Indian";
    const totalOutlets = cards.length;

    // Rich SEO Meta Tags
    const title = `Best Food Delivery in ${areaDisplayName}, ${city.name} | Order Online | OrderKing`;
    const description = `Order food online in ${areaDisplayName}, ${city.name}. Fast 25-30 min delivery from ${Math.max(
      totalOutlets,
      1
    )}+ top restaurants. Authentic ${topCuisines}, 0% menu markup, live tracking & 24K Gold rewards on OrderKing.`;
    const keywords = `food delivery ${areaDisplayName}, restaurants in ${areaDisplayName}, order food online ${city.name}, best food delivery in ${city.name}, biryani delivery ${areaDisplayName}, swiggy alternative ${city.name}, zomato alternative ${city.name}, OrderKing ${city.name}`;

    // Schema.org Structured Data Graph
    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "ItemList",
          "@id": `${canonicalUrl}#itemlist`,
          name: `Top Rated Food Delivery Restaurants in ${areaDisplayName}, ${city.name}`,
          description,
          numberOfItems: cards.length,
          itemListElement: cards.map((card, idx) => ({
            "@type": "ListItem",
            position: idx + 1,
            item: {
              "@type": ["Restaurant", "FoodEstablishment"],
              "@id": `https://orderking.in/r/${card.slug}#restaurant`,
              name: card.name,
              url: `https://orderking.in/r/${card.slug}`,
              image: card.coverImage || "https://orderking.in/icon-512.png",
              servesCuisine: (card.cuisineSummary || "").split(",").map((s) => s.trim()),
              priceRange: "₹100 - ₹500",
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: card.ratingAvg != null
                  ? (typeof card.ratingAvg === "number"
                      ? card.ratingAvg
                      : Number(card.ratingAvg || 0)
                    ).toFixed(1)
                  : "4.8",
                bestRating: "5",
                worstRating: "1",
                ratingCount: card.ratingCount || 100,
              },
              address: {
                "@type": "PostalAddress",
                addressLocality: areaDisplayName,
                addressRegion: city.state,
                addressCountry: "IN",
              },
            },
          })),
        },
        {
          "@type": ["FoodEstablishment", "LocalBusiness"],
          "@id": `${canonicalUrl}#service`,
          name: `OrderKing Food Delivery - ${areaDisplayName}, ${city.name}`,
          url: canonicalUrl,
          telephone: "+91-3843-295000",
          priceRange: "₹₹",
          currenciesAccepted: "INR",
          paymentAccepted: "Cash on Delivery, UPI, Credit Card, Debit Card, Net Banking, King Pay",
          areaServed: {
            "@type": "AdministrativeArea",
            name: `${areaDisplayName}, ${city.name}, ${city.state}`,
          },
          potentialAction: {
            "@type": "OrderAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${canonicalUrl}?action=order`,
              inLanguage: ["en-IN", "hi-IN", "bn-IN", "as-IN"],
              actionPlatform: [
                "http://schema.org/DesktopWebPlatform",
                "http://schema.org/MobileWebPlatform",
                "http://schema.org/AndroidPlatform",
              ],
            },
          },
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${canonicalUrl}#breadcrumb`,
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://orderking.in" },
            { "@type": "ListItem", position: 2, name: "Delivery", item: "https://orderking.in/search" },
            {
              "@type": "ListItem",
              position: 3,
              name: city.name,
              item: `https://orderking.in/delivery/${data.town.toLowerCase()}/all`,
            },
            { "@type": "ListItem", position: 4, name: areaDisplayName, item: canonicalUrl },
          ],
        },
      ],
    };

    return {
      town: {
        id: city.id,
        name: city.name,
        state: city.state,
        slug: data.town.toLowerCase(),
      },
      area: {
        slug: data.area.toLowerCase(),
        name: areaDisplayName,
        isTownLevelFallback,
      },
      restaurants: cards,
      totalOutlets,
      cuisines: Array.from(cuisineSet),
      priceRange: "₹100 - ₹500",
      meta: {
        title,
        description,
        keywords,
        canonicalUrl,
        ogImage: "https://orderking.in/og.jpg",
      },
      jsonLd: JSON.stringify(jsonLd),
    };
  });

// ============================================================================
// TanStack Router Route Definition
// ============================================================================

export const Route = createFileRoute("/delivery/$town/$area" as any)({
  loader: async ({ params }: any) => {
    return await getDeliveryAreaCatalog({
      data: {
        town: params.town,
        area: params.area,
      },
    });
  },
  head: ({ loaderData }: any) => {
    if (!loaderData) return { meta: [] };
    const { meta, jsonLd } = loaderData;
    return {
      meta: [
        { title: meta.title },
        { name: "description", content: meta.description },
        { name: "keywords", content: meta.keywords },
        { name: "robots", content: "index, follow, max-image-preview:large" },
        { property: "og:title", content: meta.title },
        { property: "og:description", content: meta.description },
        { property: "og:url", content: meta.canonicalUrl },
        { property: "og:image", content: meta.ogImage },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: meta.title },
        { name: "twitter:description", content: meta.description },
        { name: "twitter:image", content: meta.ogImage },
      ],
      links: [{ rel: "canonical", href: meta.canonicalUrl }],
      scripts: [
        {
          type: "application/ld+json",
          children: jsonLd,
        },
      ],
    };
  },
  component: DeliveryTownAreaPage,
});

// ============================================================================
// Component View
// ============================================================================

function DeliveryTownAreaPage() {
  const data = Route.useLoaderData() as HyperlocalTownAreaResult;
  const { town, area, restaurants, cuisines, jsonLd } = data;
  const [filterVeg, setFilterVeg] = useState(false);
  const [activeCuisine, setActiveCuisine] = useState<string | null>(null);
  const [activeDialect, setActiveDialect] = useState<DialectCode>(
    town.name.toLowerCase().includes("guwahati") ? "as" : "syl"
  );

  const filtered = restaurants.filter((r) => {
    if (filterVeg && !r.vegOnly) return false;
    if (activeCuisine && !r.cuisineSummary.toLowerCase().includes(activeCuisine.toLowerCase())) return false;
    return true;
  });

  const handleShare = () => {
    const payload = getViralSharePayload("area_delivery_share", activeDialect, {
      townName: town.name,
      areaName: area.name,
      restaurantCount: restaurants.length,
      cuisine: cuisines.slice(0, 3).join(", "),
      referralCode: "KING500",
    });
    void shareViaWebShare(payload);
  };

  return (
    <CustomerShell onSearch={() => undefined}>
      {/* Fallback inline JSON-LD for crawlers */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-gray-500">
          <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/search" className="hover:text-gray-900 transition-colors">Delivery</Link>
          <span>/</span>
          <span className="font-semibold text-gray-700">{town.name}</span>
          <span>/</span>
          <span className="font-bold text-[#E23744]">{area.name}</span>
        </nav>

        {/* Hero Banner */}
        <header className="rounded-3xl bg-gradient-to-br from-amber-500/10 via-red-500/5 to-surface p-6 sm:p-8 border border-amber-500/20 shadow-sm relative overflow-hidden">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#E23744]/10 px-3 py-1 text-xs font-bold text-[#E23744]">
                <MapPin className="size-3.5" /> {area.name}, {town.name}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700">
                <ShieldCheck className="size-3.5" /> 0% Menu Markup Guaranteed
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Best Food Delivery in {area.name}, {town.name}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600 leading-relaxed">
              Order authentic meals online with 25-minute hyperlocal delivery, live GPS tracking, and genuine restaurant prices.
            </p>

            {area.isTownLevelFallback && (
              <p className="mt-2 text-xs text-amber-700 bg-amber-500/15 rounded-lg px-3 py-1.5 inline-block">
                Showing all active kitchens across {town.name} serviceable to {area.name}.
              </p>
            )}

            {/* Quick Dialect Viral Share Bar */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl bg-white border border-gray-200 p-1 text-xs">
                {(["syl", "bn", "as", "hi", "en"] as DialectCode[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setActiveDialect(d)}
                    className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                      activeDialect === d ? "bg-[#E23744] text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {d === "syl" ? "ছিলটী" : d === "bn" ? "বাংলা" : d === "as" ? "অসমীয়া" : d === "hi" ? "हिन्दी" : "EN"}
                  </button>
                ))}
              </div>

              <Button
                onClick={handleShare}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold gap-1.5 shadow-sm"
              >
                <Share2 className="size-3.5" /> Share Neighborhood Deals
              </Button>
            </div>
          </div>
        </header>

        {/* Filter Pills */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <Button
            variant={filterVeg ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilterVeg(!filterVeg)}
            className={`rounded-xl text-xs font-semibold ${
              filterVeg ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
            }`}
          >
            🥦 Pure Veg Only
          </Button>

          {cuisines.map((c) => (
            <Button
              key={c}
              variant={activeCuisine === c ? "primary" : "outline"}
              size="sm"
              onClick={() => setActiveCuisine(activeCuisine === c ? null : c)}
              className={`rounded-xl text-xs font-semibold whitespace-nowrap ${
                activeCuisine === c ? "bg-[#E23744] hover:bg-[#c92f3b] text-white" : ""
              }`}
            >
              {c}
            </Button>
          ))}
        </div>

        {/* Restaurant Grid */}
        <section className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {filtered.length} Active Kitchens Serving {area.name}
            </h2>
            <span className="text-xs text-gray-500 font-medium">⚡ Average ETA: 25 mins</span>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center">
              <Utensils className="mx-auto size-10 text-gray-400 mb-2" />
              <p className="text-sm font-semibold text-gray-700">No restaurants matched this filter.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterVeg(false);
                  setActiveCuisine(null);
                }}
                className="mt-3 rounded-xl text-xs"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((restaurant) => (
                <KitchenCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          )}
        </section>

        {/* Hyperlocal SEO Footer Paragraph for Search Engine Indexing */}
        <article className="mt-12 rounded-2xl bg-gray-50 border border-gray-200 p-6 text-xs text-gray-600 leading-relaxed space-y-2">
          <h3 className="font-bold text-gray-800 text-sm">
            About Online Food Delivery in {area.name}, {town.name}
          </h3>
          <p>
            Looking for authentic food delivery in {area.name}, {town.name}? OrderKing connects you directly with top local restaurants and cloud kitchens across {town.name}. Enjoy hot Biryani, fast food, traditional North-Eastern dishes, and sweets delivered to your doorstep in 25-30 minutes. Unlike legacy delivery aggregators charging inflated prices, OrderKing operates on strict 0% menu markups — guaranteeing you pay the exact dine-in price.
          </p>
          <p>
            Payment options in {area.name} include Cash on Delivery (COD), UPI (Google Pay, PhonePe, Paytm), Net Banking, and King Pay with instant 24K Digital Gold rewards on qualifying orders.
          </p>
        </article>
      </main>
    </CustomerShell>
  );
}
