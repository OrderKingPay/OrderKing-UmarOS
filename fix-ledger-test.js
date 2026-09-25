const fs = require('fs');
let file = 'HDmaster/src/lib/orderking/finance/canonical-ledger.test.ts';
let content = fs.readFileSync(file, 'utf8');

// Fix missing await for canonicalLedger methods
content = content.replace(/canonicalLedger\.postTransaction/g, 'await canonicalLedger.postTransaction');
content = content.replace(/canonicalLedger\.verifyLedgerChainIntegrity/g, 'await canonicalLedger.verifyLedgerChainIntegrity');
content = content.replace(/canonicalLedger\.listSettlementBatches/g, 'await canonicalLedger.listSettlementBatches');
content = content.replace(/canonicalLedger\.recordOrderCapture/g, 'await canonicalLedger.captureOrderPayment');

fs.writeFileSync(file, content);
