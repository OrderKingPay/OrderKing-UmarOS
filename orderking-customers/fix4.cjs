
const fs = require('fs');
let c = fs.readFileSync('src/lib/viral-growth.ts', 'utf8');
c = c.replace(/navigator\.share \?/g, 'typeof navigator.share === unction ?'.replace(//g, String.fromCharCode(39)));
fs.writeFileSync('src/lib/viral-growth.ts', c);

