const fs = require('fs');
const file = 'HDmaster/src/lib/orderking/security/system-diagnostics.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'const ledgerHealth = this.checkLedgerHealth();',
  'const ledgerHealth = await this.checkLedgerHealth();'
);
content = content.replace(
  'public generateSystemDiagnosticReport(): SystemDiagnosticReport {',
  'public async generateSystemDiagnosticReport(): Promise<SystemDiagnosticReport> {'
);

fs.writeFileSync(file, content);
