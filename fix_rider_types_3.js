const fs = require('fs');
const file = 'orderking-riders/src/lib/server/rider-fns.ts';
let c = fs.readFileSync(file, 'utf8');
c = c.replace(/await e\.getStore\(\)\.insertDelivery\(\{/g, 'await e.getStore().insertDelivery({\n                pickupLocation: {lat:0, lng:0}, dropLocation: {lat:0, lng:0}, packageCount: 1, cod: false, codAmountPaise: 0, pickupVerification: "none", pickupCode: "0000", otpRequired: false, arrivedRestaurantAt: null, expectedReadyAt: null, pickedUpAt: null, arrivedCustomerAt: null, deliveredAt: null, waitStartedAt: null, contactAttempts: 0, cancelReason: null, failReason: null, updatedAt: o.offered_at,');
c = c.replace(/offeredAt: o\.offered_at,/g, '// offeredAt: o.offered_at,');
fs.writeFileSync(file, c);
