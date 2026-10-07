const fs = require('fs');
const file = 'orderking-customers/src/components/market/home-feed.tsx';
let c = fs.readFileSync(file, 'utf8');
c = c.replace(/<PreferredKitchensAdRow \/>/g, '{/* <PreferredKitchensAdRow /> */}');
fs.writeFileSync(file, c);
