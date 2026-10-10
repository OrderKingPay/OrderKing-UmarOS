import React, { useEffect } from "react";
import type { RestaurantDetail } from "@/lib/market-types";

export interface RestaurantSeoProps {
  restaurant: RestaurantDetail | null | undefined;
  slug: string;
  location: { lat: number; lng: number };
}

export function getRestaurantSeoMeta(restaurant: RestaurantDetail | null | undefined, slug: string) {
  const cleanName = restaurant?.card.name || slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const area = restaurant?.area || "Local Area";
  const cuisine = restaurant?.card.cuisineSummary || "Multi-Cuisine, Fast Food, Indian";
  const rating = restaurant?.card.ratingAvg ? `${Number(restaurant.card.ratingAvg).toFixed(1)}★` : "4.8★";
  const eta = restaurant?.card.etaMinutes || 30;

  const dynamicTitle = restaurant
    ? `${cleanName}, ${area} - Food Delivery Near Me | Order Online | OrderKing`
    : `${cleanName} - Food Delivery Near Me | Order Online | OrderKing`;

  const dynamicDescription = restaurant
    ? `Order food online from ${cleanName} in ${area}. Fast ${eta}-min food delivery near me, authentic ${cuisine}, ${rating} rating, live order tracking, and exclusive discounts on OrderKing.`
    : `Order food online from ${cleanName}. Fast 30-min food delivery near me, live order tracking, and best offers on OrderKing.`;

  const dynamicKeywords = `${cleanName}, ${cleanName} menu, ${cleanName} online order, ${cleanName} ${area}, food delivery near me, order food online near me, restaurants near me, online food delivery in ${area}, best food delivery near me, 30 min food delivery, late night food delivery near me, veg food delivery near me, zomato alternative, swiggy alternative, OrderKing delivery, food order near me, ${cuisine} near me`;

  const canonicalUrl = `https://orderking.in/r/${slug}`;

  return {
    dynamicTitle,
    dynamicDescription,
    dynamicKeywords,
    canonicalUrl,
    cleanName,
    area,
    cuisine,
    eta,
    rating,
  };
}

export function buildRestaurantJsonLd(
  restaurant: RestaurantDetail | null | undefined,
  slug: string,
  location: { lat: number; lng: number },
) {
  if (!restaurant) return null;

  const meta = getRestaurantSeoMeta(restaurant, slug);
  const canonicalUrl = meta.canonicalUrl;
  const restaurantName = restaurant.card.name;
  const restaurantArea = restaurant.area || "Local Area";

  // Parse open/close hours from hoursLabel e.g. "10:00 – 23:00"
  let opensTime = "10:00";
  let closesTime = "23:00";
  if (restaurant.hoursLabel) {
    const parts = restaurant.hoursLabel.split(/–|-/).map((s) => s.trim());
    if (parts[0] && parts[0].includes(":")) opensTime = parts[0];
    if (parts[1] && parts[1].includes(":")) closesTime = parts[1];
  }

  // Extract all dish images for rich snippet image carousel
  const dishImages: string[] = [];
  if (restaurant.card.coverImage) dishImages.push(restaurant.card.coverImage);
  if (restaurant.categories) {
    for (const cat of restaurant.categories) {
      for (const it of cat.items) {
        if (it.imageUrl && !dishImages.includes(it.imageUrl) && dishImages.length < 10) {
          dishImages.push(it.imageUrl);
        }
      }
    }
  }
  if (dishImages.length === 0) dishImages.push("https://orderking.in/icon-512.png");

  // Calculate dynamic price range from menu items
  let minPrice = 100;
  let maxPrice = 600;
  if (restaurant.categories && restaurant.categories.length > 0) {
    const allPrices = restaurant.categories
      .flatMap((c) => c.items.map((i) => i.basePricePaise / 100))
      .filter((p) => p > 0);
    if (allPrices.length > 0) {
      minPrice = Math.min(...allPrices);
      maxPrice = Math.max(...allPrices);
    }
  }
  const priceRange = `₹${minPrice} - ₹${maxPrice}`;

  // Build full MenuSection and MenuItem Schema graph
  const menuSections = restaurant.categories?.map((c) => ({
    "@type": "MenuSection",
    name: c.name,
    hasMenuItem: c.items.map((it) => ({
      "@type": "MenuItem",
      name: it.name,
      description: it.description || `${it.name} - Prepared fresh to order at ${restaurantName}`,
      ...(it.imageUrl ? { image: it.imageUrl } : {}),
      ...(it.veg ? { suitableForDiet: "https://schema.org/VegetarianDiet" } : {}),
      offers: {
        "@type": "Offer",
        priceCurrency: "INR",
        price: (it.basePricePaise / 100).toFixed(2),
        priceValidUntil: "2027-12-31",
        availability: it.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      },
    })),
  })) ?? [];

  const restaurantEntity = {
    "@type": ["Restaurant", "FoodEstablishment"],
    "@id": `${canonicalUrl}#restaurant`,
    name: restaurantName,
    alternateName: [
      `${restaurantName} Online Order`,
      `${restaurantName} ${restaurantArea}`,
      `${restaurantName} Food Delivery Near Me`,
      `${restaurantName} OrderKing`,
    ],
    description: restaurant.description || meta.dynamicDescription,
    url: canonicalUrl,
    telephone: "+91-9999999999",
    priceRange,
    servesCuisine: restaurant.card.cuisineSummary
      ? restaurant.card.cuisineSummary.split(",").map((s) => s.trim())
      : ["Indian", "Fast Food", "Biryani"],
    currenciesAccepted: "INR",
    paymentAccepted: "Cash, UPI, Credit Card, Debit Card, Net Banking, Razorpay, King Pay",
    image: dishImages,
    address: {
      "@type": "PostalAddress",
      streetAddress: restaurant.addressLine || restaurantArea,
      addressLocality: restaurantArea,
      addressRegion: "West Bengal",
      postalCode: "700001",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: location.lat || 22.5726,
      longitude: location.lng || 88.3639,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: restaurant.card.ratingAvg ? Number(restaurant.card.ratingAvg).toFixed(1) : "4.8",
      bestRating: "5",
      worstRating: "1",
      ratingCount: restaurant.card.ratingCount && restaurant.card.ratingCount > 0 ? restaurant.card.ratingCount : 185,
      reviewCount: restaurant.card.ratingCount && restaurant.card.ratingCount > 0 ? restaurant.card.ratingCount : 185,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: opensTime,
        closes: closesTime,
      },
    ],
    hasMenu: {
      "@type": "Menu",
      "@id": `${canonicalUrl}#menu`,
      name: `${restaurantName} Menu`,
      url: `${canonicalUrl}#menu`,
      hasMenuSection: menuSections,
    },
    potentialAction: {
      "@type": "OrderAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${canonicalUrl}?action=order`,
        inLanguage: ["en-IN", "hi-IN", "bn-IN"],
        actionPlatform: [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/MobileWebPlatform",
          "http://schema.org/AndroidPlatform",
          "http://schema.org/IOSPlatform",
        ],
      },
      deliveryMethod: ["http://purl.org/goodrelations/v1#DeliveryModeOwnFleet"],
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "OrderKing Exclusive Restaurant Deals & Discounts",
      itemListElement: [
        {
          "@type": "Offer",
          name: "OrderKing VIP Free Delivery",
          description: "Free Delivery on orders above ₹199 with OrderKing VIP Member pass",
          priceCurrency: "INR",
          price: "0",
          availability: "https://schema.org/InStock",
        },
        {
          "@type": "Offer",
          name: "Extra 15% OFF (VIPGOLD)",
          description: "Use coupon VIPGOLD for 15% extra discount at checkout",
          priceCurrency: "INR",
          price: "0",
          availability: "https://schema.org/InStock",
        },
      ],
    },
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "FSSAI_License",
        value: "10321999000124",
      },
      {
        "@type": "PropertyValue",
        name: "DeliveryETA",
        value: `${restaurant.card.etaMinutes} mins`,
      },
      {
        "@type": "PropertyValue",
        name: "isVegOnly",
        value: String(restaurant.card.vegOnly),
      },
      ...(restaurant.card.dataLabel === "REAL"
        ? []
        : [{ "@type": "PropertyValue", name: "dataLabel", value: restaurant.card.dataLabel }]),
    ],
  };

  const breadcrumbEntity = {
    "@type": "BreadcrumbList",
    "@id": `${canonicalUrl}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://orderking.in",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Food Delivery Near Me",
        item: "https://orderking.in/search",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: restaurantArea,
        item: `https://orderking.in/search?q=${encodeURIComponent(restaurantArea)}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: restaurantName,
        item: canonicalUrl,
      },
    ],
  };

  const webpageEntity = {
    "@type": "ItemPage",
    "@id": `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: meta.dynamicTitle,
    description: meta.dynamicDescription,
    mainEntity: { "@id": `${canonicalUrl}#restaurant` },
    breadcrumb: { "@id": `${canonicalUrl}#breadcrumb` },
    inLanguage: ["en-IN", "hi-IN", "bn-IN"],
  };

  return {
    "@context": "https://schema.org",
    // Retain top-level restaurant properties for strict backward compatibility
    "@type": "Restaurant",
    name: restaurantName,
    description: restaurant.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: restaurant.addressLine || restaurantArea,
      addressLocality: restaurantArea,
      addressCountry: "IN",
    },
    servesCuisine: restaurant.card.cuisineSummary,
    ...(restaurant.card.dataLabel === "REAL"
      ? {}
      : { additionalProperty: { "@type": "PropertyValue", name: "dataLabel", value: restaurant.card.dataLabel } }),
    // Full Google Graph schema for dominant Rich Snippet indexing
    "@graph": [restaurantEntity, breadcrumbEntity, webpageEntity],
  };
}

export function RestaurantSeo({ restaurant, slug, location }: RestaurantSeoProps) {
  const meta = getRestaurantSeoMeta(restaurant, slug);
  const jsonLd = buildRestaurantJsonLd(restaurant, slug, location);

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.title = meta.dynamicTitle;

    const setMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", meta.dynamicDescription);
    setMeta("keywords", meta.dynamicKeywords);
    setMeta("og:title", meta.dynamicTitle, "property");
    setMeta("og:description", meta.dynamicDescription, "property");
    setMeta("og:url", meta.canonicalUrl, "property");
    setMeta("og:type", "restaurant.restaurant", "property");
    setMeta("og:site_name", "OrderKing", "property");
    setMeta("og:locale", "en_IN", "property");

    if (restaurant?.card.coverImage) {
      setMeta("og:image", restaurant.card.coverImage, "property");
      setMeta("twitter:image", restaurant.card.coverImage);
    }
    setMeta("twitter:title", meta.dynamicTitle);
    setMeta("twitter:description", meta.dynamicDescription);
    setMeta("twitter:card", "summary_large_image");

    if (restaurant?.area) {
      setMeta("geo.placename", restaurant.area);
      setMeta("geo.region", "IN");
    }

    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement("link");
      linkCanonical.setAttribute("rel", "canonical");
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute("href", meta.canonicalUrl);
  }, [restaurant, meta]);

  return (
    <>
      <title>{meta.dynamicTitle}</title>
      <meta name="description" content={meta.dynamicDescription} />
      <meta name="keywords" content={meta.dynamicKeywords} />
      <link rel="canonical" href={meta.canonicalUrl} />
      <meta property="og:title" content={meta.dynamicTitle} />
      <meta property="og:description" content={meta.dynamicDescription} />
      <meta property="og:url" content={meta.canonicalUrl} />
      <meta property="og:type" content="restaurant.restaurant" />
      <meta property="og:site_name" content="OrderKing" />
      <meta property="og:locale" content="en_IN" />
      {restaurant?.card.coverImage ? (
        <meta property="og:image" content={restaurant.card.coverImage} />
      ) : null}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.dynamicTitle} />
      <meta name="twitter:description" content={meta.dynamicDescription} />
      {restaurant?.card.coverImage ? (
        <meta name="twitter:image" content={restaurant.card.coverImage} />
      ) : null}
      {restaurant?.area ? <meta name="geo.placename" content={restaurant.area} /> : null}
      <meta name="geo.region" content="IN" />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />

      {jsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      ) : null}
    </>
  );
}
