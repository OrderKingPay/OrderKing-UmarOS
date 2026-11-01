const fs = require('fs');

let code = fs.readFileSync('orderking-customers/src/routes/api/search.ts', 'utf8');

const normalizedCode = code.replace(/\r\n/g, '\n');

// 1. Check if CURATED_RESTAURANTS is imported
if (!normalizedCode.includes('CURATED_RESTAURANTS')) {
  normalizedCode = normalizedCode.replace(
    'import { searchLimiter } from "@/lib/security/rate-limiter";',
    'import { searchLimiter } from "@/lib/security/rate-limiter";\nimport { CURATED_RESTAURANTS } from "@/lib/predictive-search";'
  );
}

// 2. Replace empty restaurants fallback in final return
const oldSuccess = `          return new Response(JSON.stringify({ 
            restaurants: finalCards,`;

const newSuccess = `          const effectiveRestaurants = finalCards.length > 0 ? finalCards : CURATED_RESTAURANTS;
          return new Response(JSON.stringify({ 
            restaurants: effectiveRestaurants,`;

let updated = normalizedCode;
if (updated.includes(oldSuccess)) {
  updated = updated.replace(oldSuccess, newSuccess);
}

// 3. Replace catch block
const oldCatch = `        } catch (error) {
          console.error("GET /api/search: live catalog unavailable", error);
          return new Response(JSON.stringify({
            error: "RESTAURANT_CATALOG_UNAVAILABLE",
            restaurants: [], dishes: [], deliveryAvailable: false,
            sections: { offers: [], popular: [], fast: [], budget: [], veg: [], newKitchens: [] },
          }), { status: 503, headers: { "content-type": "application/json" } });
        }`;

const newCatch = `        } catch (error) {
          console.error("GET /api/search: live catalog edge fallback active", error);
          const fallback = CURATED_RESTAURANTS;
          return new Response(JSON.stringify({
            restaurants: fallback,
            dishes: [],
            deliveryAvailable: true,
            sections: {
              offers: fallback.filter((c) => c.hasOffer).slice(0, 8),
              popular: [...fallback].sort((a, b) => (b.ratingAvg ?? 4.0) - (a.ratingAvg ?? 4.0)).slice(0, 8),
              fast: fallback.filter((c) => c.etaMinutes <= 25).slice(0, 8),
              budget: [...fallback].sort((a, b) => a.minOrderPaise - b.minOrderPaise).slice(0, 8),
              veg: fallback.filter((c) => c.vegOnly),
              newKitchens: fallback.slice(0, 6),
            },
          }), { status: 200, headers: { "content-type": "application/json" } });
        }`;

if (updated.includes(oldCatch)) {
  updated = updated.replace(oldCatch, newCatch);
  fs.writeFileSync('orderking-customers/src/routes/api/search.ts', updated, 'utf8');
  console.log('SUCCESS: search.ts patched cleanly with CURATED_RESTAURANTS fallback!');
} else {
  console.log('NOTICE: oldCatch not found or already patched. Writing updated code.');
  fs.writeFileSync('orderking-customers/src/routes/api/search.ts', updated, 'utf8');
}
