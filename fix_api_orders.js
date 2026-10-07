const fs = require('fs');
const file = 'orderking-partners/src/lib/server/api-orders.ts';
let c = fs.readFileSync(file, 'utf8');
c = c.replace(/AND restaurant_id = \$\{ctx\.restaurantId\};/g, 'AND restaurant_id =  RETURNING id;');
c = c.replace(/res\.count === 0/g, 'res.length === 0');
fs.writeFileSync(file, c);
