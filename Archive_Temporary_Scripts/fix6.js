const fs = require('fs');
let f = 'orderking-customers/src/components/market/home-feed.tsx';
let h = fs.readFileSync(f, 'utf8');
h = h.split('<PreferredKitchensAdRow className="my-1" />').join('null');
fs.writeFileSync(f, h);
