import fs from 'node:fs';
import path from 'node:path';

const custSrc = 'c:/Users/hasan/OrderKing/orderking-customers/src';
const inspectFiles = [
  'components/ai/customer-concierge-drawer.tsx',
  'components/ai/royal-ai-concierge.tsx',
  'components/fintech/kingpay-finance-search.tsx',
  'components/fintech/kingpay-shell.tsx',
  'components/market/service-shortcuts.tsx',
  'routes/account/index.tsx',
  'routes/earn.tsx',
  'routes/king-pay.tsx',
  'routes/kingpay/index.tsx',
  'routes/__root.tsx',
];

for (const f of inspectFiles) {
  const full = path.join(custSrc, f);
  if (!fs.existsSync(full)) continue;
  const lines = fs.readFileSync(full, 'utf8').split('\n');
  console.log(`\n=== ${f} ===`);
  lines.forEach((line, idx) => {
    if (/travel|irctc|tutor/i.test(line)) {
      console.log(`  L${idx + 1}: ${line.trim()}`);
    }
  });
}
