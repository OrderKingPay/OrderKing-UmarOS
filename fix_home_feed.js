const fs = require('fs');
let c = fs.readFileSync('orderking-customers/src/components/market/home-feed.tsx', 'utf8');
c = c.replace(/import \{ PreferredKitchensAdRow \} from \"@\/components\/market\/preferred-kitchens-ad-row\";/g, '');
c = c.replace(/<PreferredKitchensAdRow \/>/g, '');
fs.writeFileSync('orderking-customers/src/components/market/home-feed.tsx', c, 'utf8');
