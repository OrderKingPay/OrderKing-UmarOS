const fs = require('fs');
const file = 'HDmaster/src/lib/orderking/platform-hardening.test.ts';
let code = fs.readFileSync(file, 'utf8');
code = code.replace('hour: 12, activeOrders: 5,\\n      availableRiders: 15,\\n      totalRiders: 20,\\n      hour: 10,', 'activeOrders: 5,\\n      availableRiders: 15,\\n      totalRiders: 20,\\n      hour: 10,');
fs.writeFileSync(file, code);
