const fs = require('fs');
let f = 'HDmaster/src/lib/orderking/server/business-os.server.ts';
let c = fs.readFileSync(f, 'utf8');
c = c.replace('// @ts-nocheck\n', '');
c = c.replace('export const getBusinessOsSnapshot: any = ', 'export const getBusinessOsSnapshot = ');
fs.writeFileSync(f, c);
