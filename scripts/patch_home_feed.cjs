const fs = require('fs');

let code = fs.readFileSync('orderking-customers/src/components/market/home-feed.tsx', 'utf8');
let normalized = code.replace(/\r\n/g, '\n');

// 1. Add import if not present
if (!normalized.includes('CURATED_RESTAURANTS')) {
  normalized = normalized.replace(
    'import { isDeliveryActiveInLocation } from "@/lib/geo/geofence-guard";',
    'import { isDeliveryActiveInLocation } from "@/lib/geo/geofence-guard";\nimport { CURATED_RESTAURANTS } from "@/lib/predictive-search";'
  );
}

// 2. Fallback to CURATED_RESTAURANTS when list is empty
const oldRaw = `    const raw: RestaurantCard[] =
      list.data?.restaurants && list.data.restaurants.length > 0
        ? list.data.restaurants
        : [];`;

const newRaw = `    const raw: RestaurantCard[] =
      list.data?.restaurants && list.data.restaurants.length > 0
        ? list.data.restaurants
        : CURATED_RESTAURANTS;`;

if (normalized.includes(oldRaw)) {
  normalized = normalized.replace(oldRaw, newRaw);
  console.log('SUCCESS: Patched raw in home-feed.tsx');
} else {
  console.log('NOTICE: oldRaw not found in home-feed.tsx');
}

fs.writeFileSync('orderking-customers/src/components/market/home-feed.tsx', normalized, 'utf8');
