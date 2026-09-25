const fs = require('fs');
const file = 'orderking-customers/src/lib/server/razorpay.server.ts';
let content = fs.readFileSync(file, 'utf8');

// Fix synchronous calls
content = content.replace(/const ledgerTx = canonicalLedger\.captureOrderPayment\(\{/g, 'const ledgerTx = await canonicalLedger.captureOrderPayment({');

fs.writeFileSync(file, content);
