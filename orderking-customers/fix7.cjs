
const fs = require('fs');
let c = fs.readFileSync('src/lib/server/catalog.ts', 'utf8');
c = c.replace(/\.map\(w: any\) =>/g, '.map((w: any) =>');
c = c.replace(/\.filter\(w: any\) =>/g, '.filter((w: any) =>');
fs.writeFileSync('src/lib/server/catalog.ts', c);

