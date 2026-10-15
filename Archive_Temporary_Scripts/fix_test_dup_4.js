const fs = require('fs');
const file = 'HDmaster/src/lib/orderking/platform-hardening.test.ts';
let code = fs.readFileSync(file, 'utf8');

// The regex I used earlier:
// code = code.replace(/hour: \d+, activeOrders:/g, 'activeOrders:');
// This stripped out the initial hour: \d+ from all test cases!
// I need to put it back for those tests.

code = code.replace(/activeOrders: 20,/g, 'hour: 12, activeOrders: 20,');
code = code.replace(/activeOrders: 100,/g, 'hour: 12, activeOrders: 100,');
code = code.replace(/activeOrders: 5,/g, 'hour: 12, activeOrders: 5,');
code = code.replace(/activeOrders: 2,/g, 'hour: 12, activeOrders: 2,');
code = code.replace(/activeOrders: 15,/g, 'hour: 12, activeOrders: 15,');

fs.writeFileSync(file, code);
