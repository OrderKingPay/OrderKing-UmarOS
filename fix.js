const fs = require('fs');
const files = [
  'orderking-customers/src/lib/server/orders.ts',
  'orderking-customers/src/lib/server/hdmaster-order-read.ts',
  'orderking-customers/src/lib/server/hdmaster-orders.ts',
  'orderking-customers/src/lib/server/kingpay.server.ts',
  'orderking-customers/src/lib/server/quote.ts',
  'orderking-customers/src/lib/server/razorpay-order.ts',
  'orderking-customers/src/lib/server/razorpay.server.ts',
  'orderking-customers/src/lib/server/reviews.ts',
  'orderking-customers/src/routes/api/restaurant.ts',
  'orderking-customers/src/routes/api/search.ts',
  'orderking-customers/src/routes/tutor.tsx'
];
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/\.\/\/\s*@ts-ignore\r?\n/g, '\n.');
  c = c.replace(/\/\/\s*@ts-ignore\r?\n/g, '\n');
  fs.writeFileSync(file, c);
}
