import React from 'react';
import { useLocation } from '@tanstack/react-router';

export function NextGenSeo({ config }: { config: any }) {
  const location = useLocation();
  const currentUrl = `https://orderking.in${location.pathname}`;
  
  const segments = location.pathname.split('/').filter(Boolean);
  let city = 'India';
  
  if (segments.length > 0 && (segments[0] === 'delivery' || segments[0] === 'city')) {
    city = segments[1] ? segments[1].replace(/-/g, ' ') : city;
    city = city.charAt(0).toUpperCase() + city.slice(1);
  }

  const dynamicTitle = `Best Food Delivery in ${city} | OrderKing`;
  const dynamicDescription = `Order from top restaurants in ${city}. Get fast delivery, exclusive deals, and premium perks with King Pass.`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FoodEstablishment",
        "name": "OrderKing Local Delivery",
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
      <link rel="canonical" href={currentUrl} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={dynamicTitle} />
      <meta property="og:description" content={dynamicDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={config?.brand?.ogImageUrl || "/logo.jpg"} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={dynamicTitle} />
      <meta name="twitter:description" content={dynamicDescription} />
      <meta name="twitter:image" content={config?.brand?.ogImageUrl || "/logo.jpg"} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </>
  );
}
