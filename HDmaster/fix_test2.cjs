const fs = require('fs');
const file = 'src/lib/orderking/platform-hardening.test.ts';
let code = fs.readFileSync(file, 'utf8');

// I will add hour: 12 back to the 6 instances that failed TS2345
code = code.replace(/activeOrders:/g, 'hour: 12, activeOrders:');

fs.writeFileSync(file, code);
