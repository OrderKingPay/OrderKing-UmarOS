const fs = require('fs');
const file = 'HDmaster/src/lib/orderking/platform-hardening.test.ts';
let code = fs.readFileSync(file, 'utf8');

// I will just use string replacement on the exact text.
const badString = \      hour: 12, activeOrders: 5,
      availableRiders: 15,
      totalRiders: 20,
      hour: 10,\;
const goodString = \      activeOrders: 5,
      availableRiders: 15,
      totalRiders: 20,
      hour: 10,\;

code = code.replace(badString, goodString);
fs.writeFileSync(file, code);
