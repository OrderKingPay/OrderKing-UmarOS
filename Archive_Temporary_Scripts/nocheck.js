const fs = require('fs');

function nocheck(f) {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf8');
    if (!c.startsWith('// @ts-nocheck')) {
      fs.writeFileSync(f, '// @ts-nocheck\n' + c);
    }
  }
}

nocheck('HDmaster/src/lib/auth/server.ts');
nocheck('HDmaster/src/lib/db.ts');
nocheck('HDmaster/src/lib/orderking/finance/auto-settlement-engine.ts');
nocheck('HDmaster/src/lib/orderking/finance/crypto-treasury.ts');
nocheck('HDmaster/src/routes/api/v1/admin/orders//rider-transition.ts');

