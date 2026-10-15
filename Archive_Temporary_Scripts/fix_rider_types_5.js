const fs = require('fs');
const file = 'orderking-riders/src/lib/server/rider-fns.ts';
let c = fs.readFileSync(file, 'utf8');
c = c.replace(/pickupVerification: "code"/g, 'pickupVerification: "ORDER_CODE"');
fs.writeFileSync(file, c);
