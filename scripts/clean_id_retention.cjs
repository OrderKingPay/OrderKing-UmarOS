const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'orderking-customers', 'src', 'routes', 'orders', '$id.tsx');
let c = fs.readFileSync(file, 'utf8');
const target = `        {/* POST-ORDER RETENTION ROULETTE GAMIFICATION WHEEL */}
        {order.status === "DELIVERED" && (
          
        )}`;

c = c.replace(/\r\n/g, '\n');
const targetNorm = target.replace(/\r\n/g, '\n');
if (c.includes(targetNorm)) {
  c = c.replace(targetNorm, '');
  c = c.replace(/\n/g, '\r\n');
  fs.writeFileSync(file, c, 'utf8');
  console.log('Cleaned empty retention roulette block successfully');
} else {
  console.log('Could not find target block');
}
