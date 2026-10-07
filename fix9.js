const fs = require('fs');
let f = 'HDmaster/src/lib/orderking/finance/crypto-treasury.ts';
if (fs.existsSync(f)) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/intent\[0\]\.amount/g, '(intent[0] as any).amount');
  fs.writeFileSync(f, c);
}
