
const fs = require('fs');
let c = fs.readFileSync('src/lib/server/catalog.ts', 'utf8');
c = c.replace(/\(w: any =>/g, '(w: any) =>');
fs.writeFileSync('src/lib/server/catalog.ts', c);
console.log('Fixed catalog.ts syntax');

