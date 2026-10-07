const fs = require('fs');
const file = 'HDmaster/src/lib/orderking/platform-hardening.test.ts';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/hour: \d+, activeOrders:/g, 'activeOrders:');
fs.writeFileSync(file, code);
