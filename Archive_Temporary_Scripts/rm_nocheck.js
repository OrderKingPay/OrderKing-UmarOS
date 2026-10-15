const fs = require('fs');

function removeNocheck(f) {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf8');
    c = c.replace(/\/\/ @ts-nocheck\n/g, '');
    fs.writeFileSync(f, c);
  }
}

removeNocheck('orderking-customers/src/components/ai/supreme-founder-ai-chat.tsx');
removeNocheck('orderking-customers/src/lib/ai/supreme-founder-ai-core.ts');
removeNocheck('orderking-customers/src/components/fintech/micro-loan-hub.tsx');
removeNocheck('orderking-customers/src/components/market/home-feed.tsx');

removeNocheck('HDmaster/src/lib/auth/server.ts');
removeNocheck('HDmaster/src/lib/db.ts');
removeNocheck('HDmaster/src/lib/orderking/finance/auto-settlement-engine.ts');
removeNocheck('HDmaster/src/lib/orderking/finance/crypto-treasury.ts');
removeNocheck('HDmaster/src/routes/api/v1/admin/orders//rider-transition.ts');

