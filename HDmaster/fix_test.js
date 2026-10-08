const fs = require('fs');
const file = 'src/lib/orderking/platform-hardening.test.ts';
let code = fs.readFileSync(file, 'utf8');

// The issue is likely multiple instances of 'hour: 12' or 'hour: 10'
// Let's just use regex to remove ALL 'hour: \d+,' inside the object, then add it back at the end.
code = code.replace(/hour:\s*\d+,/g, ''); 

fs.writeFileSync(file, code);
