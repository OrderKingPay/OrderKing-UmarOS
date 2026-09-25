const fs = require('fs');
let file = 'HDmaster/src/lib/orderking/finance/canonical-ledger.test.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/test\("([^"]+)", \(\) => \{/g, 'test("", async () => {');
fs.writeFileSync(file, content);
