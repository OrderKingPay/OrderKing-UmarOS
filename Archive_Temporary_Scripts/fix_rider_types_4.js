const fs = require('fs');
const file = 'orderking-riders/src/lib/server/rider-fns.ts';
let c = fs.readFileSync(file, 'utf8');
c = c.replace(/pickupVerification: "none"/g, 'pickupVerification: "code"');
c = c.replace(/await e\.getStore\(\)\.insertOffer\(\{/g, 'await e.getStore().insertOffer({\n                  pickupLocation: {lat:0, lng:0}, dropLocation: {lat:0, lng:0},');
fs.writeFileSync(file, c);
