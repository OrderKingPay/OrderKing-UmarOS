const fs = require('fs');
const file = 'HDmaster/src/lib/orderking/ai/ai-workforce-orchestrator.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'const audit = canonicalLedger.verifyLedgerChainIntegrity();',
  'const audit = await canonicalLedger.verifyLedgerChainIntegrity();'
);
fs.writeFileSync(file, content);
