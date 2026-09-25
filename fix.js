const fs = require('fs');
const file = 'HDmaster/src/lib/orderking/finance/canonical-ledger.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\"\/g, '\').replace(/\\"/g, '\');
fs.writeFileSync(file, content);
