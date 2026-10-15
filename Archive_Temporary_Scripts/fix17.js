const fs = require('fs');
let f = 'HDmaster/src/lib/orderking/server/business-os.server.ts';
let c = fs.readFileSync(f, 'utf8');
c = c.replace(/as any;/g, ';');
fs.writeFileSync(f, c);
