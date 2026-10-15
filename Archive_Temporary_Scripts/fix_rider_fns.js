const fs = require('fs');
const file = 'orderking-riders/src/lib/server/rider-fns.ts';
let c = fs.readFileSync(file, 'utf8');
c = c.replace(/valuePaise: o\.total_paise/g, 'expectedPayoutPaise: o.total_paise');
c = c.replace(/orderId: o\.order_id,\r?\n\s*riderId:/g, 'riderId:'); 
c = c.replace(/status: "OPEN",/g, 'status: "OPEN", approxDistanceKm: 0, estimatedTravelKm: 0, estimatedTotalRouteKm: 0, cod: false, codAmountPaise: 0, packageCount: 1, createdAt: new Date().toISOString(), dropArea: "Local",');
fs.writeFileSync(file, c);
