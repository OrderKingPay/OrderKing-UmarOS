import React from 'react';
import { useLocation } from '@tanstack/react-router';

export function NextGenSeo({ config }: { config: any }) {
  const location = useLocation();
  const currentUrl = `https://orderking.in${location.pathname}`;
  
  const segments = location.pathname.split('/').filter(Boolean);
  let city = 'India';
  let isRestaurant = false;
  let restaurantName = '';

  if (segments.length > 0 && (segments[0] === 'delivery' || segments[0] === 'city')) {
    city = segments[1] ? segments[1].replace(/-/g, ' ') : city;
    city = city.charAt(0).toUpperCase() + city.slice(1);
  } else if (segments.length > 1 && segments[0] === 'r') {
    isRestaurant = true;
    restaurantName = segments[1]
      .split('-')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  const dynamicTitle = isRestaurant
    ? `${restaurantName} - Food Delivery Near Me | Order Online | OrderKing`
    : `Best Food Delivery in ${city} | OrderKing`;

  const dynamicDescription = isRestaurant
    ? `Order food online from ${restaurantName}. Fast 30-min food delivery near me, live order tracking, discounts and best offers on OrderKing.`
    : `Order from top restaurants in ${city}. Get fast delivery, exclusive deals, and premium perks with King Pass.`;

  const dynamicKeywords = isRestaurant
    ? `${restaurantName}, ${restaurantName} menu, ${restaurantName} online order, food delivery near me, order food online near me, restaurants near me, 30 min food delivery, OrderKing`
    : `food delivery near me, order food online, best food delivery, restaurants near me, food delivery in ${city}, OrderKing`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      ...(isRestaurant
        ? [
            {
              "@type": ["Restaurant", "FoodEstablishment"],
              "name": restaurantName,
              "url": currentUrl,
              "image": config?.brand?.ogImageUrl || "https://orderking.in/logo.jpg",
              "telephone": "+91-9999999999",
              "priceRange": "₹₹",
              "servesCuisine": "Indian, Fast Food, Multi-Cuisine",
              "currenciesAccepted": "INR",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "IN"
              },
              "potentialAction": {
                "@type": "OrderAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": `${currentUrl}?action=order`,
                  "inLanguage": ["en-IN", "hi-IN", "bn-IN"],
                  "actionPlatform": [
                    "http://schema.org/DesktopWebPlatform",
                    "http://schema.org/MobileWebPlatform",
                    "http://schema.org/AndroidPlatform",
                    "http://schema.org/IOSPlatform"
                  ]
                },
                "deliveryMethod": ["http://purl.org/goodrelations/v1#DeliveryModeOwnFleet"]
              }
            }
          ]
        : []),
      {
        "@type": "FoodEstablishment",
        "name": isRestaurant ? restaurantName : "OrderKing Local Delivery",
        "image": config?.brand?.ogImageUrl || "https://orderking.in/logo.jpg",
        "url": currentUrl,
        "telephone": "+91-9999999999",
        "priceRange": "₹₹",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": city,
          "addressCountry": "IN"
        },
        "servesCuisine": "Indian, Fast Food, Global, Local"
      },
      {
        "@type": "WebSite",
        "url": "https://orderking.in",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://orderking.in/search?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "Product",
        "name": "King Pass",
        "description": "Unlimited Free Food Delivery and Premium Perks across India.",
        "brand": {
          "@type": "Brand",
          "name": "OrderKing"
        },
        "offers": {
          "@type": "Offer",
          "priceCurrency": "INR",
          "price": "199",
          "availability": "https://schema.org/InStock"
        }
      }
    ]
  };

  return (
    <>
      <title>{dynamicTitle}</title>
      <meta name="description" content={dynamicDescription} />
      <meta name="keywords" content={dynamicKeywords} />
      <link rel="canonical" href={currentUrl} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={dynamicTitle} />
      <meta property="og:description" content={dynamicDescription} />
      <meta property="og:type" content={isRestaurant ? "restaurant.restaurant" : "website"} />
      <meta property="og:image" content={config?.brand?.ogImageUrl || "/logo.jpg"} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={dynamicTitle} />
      <meta name="twitter:description" content={dynamicDescription} />
      <meta name="twitter:image" content={config?.brand?.ogImageUrl || "/logo.jpg"} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </>
  );
}
