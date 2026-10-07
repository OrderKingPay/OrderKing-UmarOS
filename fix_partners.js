const fs = require('fs');
const file = 'orderking-partners/src/lib/server/api-orders.ts';
let c = fs.readFileSync(file, 'utf8');
c = c.replace(/\(res as any\)\.count/g, 'res.count');
c = c.replace(/const payload = \(await res\.json\(\)\) as any;/g, 'const payload: any = await res.json();');
fs.writeFileSync(file, c);
