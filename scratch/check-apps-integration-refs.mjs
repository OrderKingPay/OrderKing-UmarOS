import fs from 'node:fs';
import path from 'node:path';

const root = 'c:/Users/hasan/OrderKing';
const dirs = ['HDmaster', 'orderking-customers', 'orderking-partners', 'orderking-riders', 'packages'];

let found = 0;
for (const dir of dirs) {
  function walk(curr) {
    if (!fs.existsSync(curr)) return;
    for (const ent of fs.readdirSync(curr, { withFileTypes: true })) {
      const p = path.join(curr, ent.name);
      if (ent.isDirectory()) {
        if (!['node_modules', '.git', 'dist', '.wrangler', '.tanstack'].includes(ent.name)) {
          walk(p);
        }
      } else if (/\.(tsx?|jsx?|mjs|cjs)$/.test(ent.name)) {
        const text = fs.readFileSync(p, 'utf8');
        if (text.includes('Apps-integration') || text.includes('apps-integration')) {
          console.log('REF IN:', path.relative(root, p));
          found++;
        }
      }
    }
  }
  walk(path.join(root, dir));
}
console.log('Total refs to Apps-integration:', found);
