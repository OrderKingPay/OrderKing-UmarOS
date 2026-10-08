const fs = require('fs');
const file = 'src/lib/orderking/platform-hardening.test.ts';
let code = fs.readFileSync(file, 'utf8');

// The issue is multiple instances of 'hour'.
// Just regex replace all of them.
code = code.replace(/hour:\s*\d+,/g, ''); 

fs.writeFileSync(file, code);
