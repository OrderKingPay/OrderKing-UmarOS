const fs = require('fs');
let c = fs.readFileSync('HDmaster/src/lib/finance/surge-engine.ts', 'utf8');

const clean = c.split('/ /')[0].trim() + '\n';
fs.writeFileSync('HDmaster/src/lib/finance/surge-engine.ts', clean, 'utf8');
