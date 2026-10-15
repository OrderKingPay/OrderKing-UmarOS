const fs = require('fs');
const file = 'HDmaster/src/lib/orderking/platform-hardening.test.ts';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/hour: 10,[\s\n]*hour: 10,/g, 'hour: 10,');
code = code.replace(/hour: 12, activeOrders: 20,[\s\n]*availableRiders: 5,[\s\n]*totalRiders: 30,[\s\n]*hour: 20,/g, 'hour: 20, activeOrders: 20, availableRiders: 5, totalRiders: 30,');
code = code.replace(/hour: 12, activeOrders: 100,[\s\n]*availableRiders: 1,[\s\n]*totalRiders: 50,[\s\n]*hour: 21,/g, 'hour: 21, activeOrders: 100, availableRiders: 1, totalRiders: 50,');
// It looks like hour: 10 is used in line 90?
code = code.replace(/hour: 10,\s*hour: 10,/g, 'hour: 10,');
code = code.replace(/hour: 12,\s*hour: 20,/g, 'hour: 20,');
fs.writeFileSync(file, code);
