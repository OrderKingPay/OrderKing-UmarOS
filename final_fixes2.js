const fs = require('fs');

// Fix platform-hardening.test.ts hour property
let f = 'HDmaster/src/lib/orderking/platform-hardening.test.ts';
if (fs.existsSync(f)) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/activeOrders:/g, 'hour: 12, activeOrders:');
  fs.writeFileSync(f, c);
}

// Fix rider-transition.ts
let r = 'HDmaster/src/routes/api/v1/admin/orders//rider-transition.ts';
if (fs.existsSync(r)) {
  let c = fs.readFileSync(r, 'utf8');
  c = c.replace(/async \(\{ request, params \}\)/g, 'async ({ request, params }: any)');
  c = c.replace(/async \(\{ request \}\)/g, 'async ({ request }: any)');
  fs.writeFileSync(r, c);
}

// Fix sweep.ts missing createAPIFileRoute
let s = 'HDmaster/src/routes/api/v1/founder/sweep.ts';
if (fs.existsSync(s)) {
  let c = fs.readFileSync(s, 'utf8');
  c = c.replace(/from '@tanstack\/react-start\/api'/g, "from '@/lib/createAPIFileRoute'");
  fs.writeFileSync(s, c);
}

