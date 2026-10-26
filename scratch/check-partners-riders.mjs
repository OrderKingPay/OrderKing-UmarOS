import fs from 'node:fs';
import path from 'node:path';

const root = 'c:/Users/hasan/OrderKing';
function checkDir(sub) {
  const dir = path.join(root, sub);
  if (!fs.existsSync(dir)) return;
  function walk(curr) {
    for (const ent of fs.readdirSync(curr, { withFileTypes: true })) {
      const full = path.join(curr, ent.name);
      if (ent.isDirectory()) {
        if (!['node_modules', '.git', 'dist', '.wrangler', '.tanstack', '.output'].includes(ent.name)) {
          walk(full);
        }
      } else if (/\.(tsx?|jsx?|mjs|cjs)$/.test(ent.name)) {
        const text = fs.readFileSync(full, 'utf8');
        if (/amadeus|irctc|redbus|AITutor|curriculum-manager|AIWorkMatcher|jobs-marketplace/i.test(text)) {
          console.log(`HIT in ${sub}:`, path.relative(root, full));
        }
      }
    }
  }
  walk(dir);
}

checkDir('orderking-partners/src');
checkDir('orderking-riders/src');
console.log('Done checking partners and riders.');
