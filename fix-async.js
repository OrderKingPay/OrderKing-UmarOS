const fs = require('fs');

// Fix system-diagnostics.ts
let file = 'HDmaster/src/lib/orderking/security/system-diagnostics.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'public static runFullDiagnostics(): SystemDiagnosticsReport {',
  'public static async runFullDiagnostics(): Promise<SystemDiagnosticsReport> {'
);
content = content.replace(
  'const financeHealth = this.checkLedgerHealth();',
  'const financeHealth = await this.checkLedgerHealth();'
);
fs.writeFileSync(file, content);

// Fix ai-workforce-orchestrator.ts
file = 'HDmaster/src/lib/orderking/ai/ai-workforce-orchestrator.ts';
content = fs.readFileSync(file, 'utf8');
content = content.replace(
  'const integrity = canonicalLedger.verifyLedgerChainIntegrity();',
  'const integrity = await canonicalLedger.verifyLedgerChainIntegrity();'
);
content = content.replace(
  'const integrityStatus = integrity.isValid',
  'const integrityStatus = integrity.isValid'
);
fs.writeFileSync(file, content);
