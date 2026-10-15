const fs = require('fs');
let f = 'orderking-customers/src/components/market/home-feed.tsx';
if (fs.existsSync(f)) {
  let c = fs.readFileSync(f, 'utf8');
  if (!c.includes('PreferredKitchensAdRow')) {
    c = c.replace(/import \{ KitchenCard \} from "\.\/kitchen-card";/, 'import { KitchenCard } from "./kitchen-card";\nimport { PreferredKitchensAdRow } from "@/components/market/preferred-kitchens-ad-row";');
    c = c.replace(/\{!\(isGeoActive\) \? \(/, '{!q && !veg && !openNow && !category ? <PreferredKitchensAdRow className="my-1" /> : null}\n\n      {/* RESTAURANT SUGGESTIONS: STRICTLY GATED BY 100% ACCURATE REAL-TIME GEO-LOCATION */}\n      {!isGeoActive ? (');
    fs.writeFileSync(f, c);
  }
}
