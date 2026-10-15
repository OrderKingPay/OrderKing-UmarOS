const fs = require('fs');
const f = 'HDmaster/src/routes/api/v1/admin/orders/$orderId/rider-transition.ts';
let c = fs.readFileSync(f, 'utf8');
c = c.replace(/async \(\{\s*request,\s*params\s*\}\)/g, 'async ({ request, params }: any)');
fs.writeFileSync(f, c);
