const fs = require('fs');

const portalPath = 'src/lib/orderking/ecosystem-core/restaurant-portal.ts';
let portalCode = fs.readFileSync(portalPath, 'utf8');
portalCode = portalCode.replace('const { daily_total, commission_rate } = stats[0];', 'const { daily_total, commission_rate } = stats[0] as any;');
fs.writeFileSync(portalPath, portalCode);

