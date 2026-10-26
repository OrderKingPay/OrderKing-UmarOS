import fs from 'node:fs';
import path from 'node:path';

const custSrc = 'c:/Users/hasan/OrderKing/orderking-customers/src';
function walk(dir) {
  let res = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (!['node_modules', '.git', 'dist', '.wrangler', '.tanstack', '.output'].includes(ent.name)) {
        res = res.concat(walk(full));
      }
    } else if (/\.(tsx?|jsx?|mjs|cjs)$/.test(ent.name)) {
      res.push(full);
    }
  }
  return res;
}

const files = walk(custSrc);
const targets = [
  'flight-booking-engine',
  'bus-booking-engine',
  'cab-booking-engine',
  'hotel-booking-engine',
  'train-booking-engine',
  'sovereign-eticket-modal',
  'sovereign-travel-concierge',
  'travel-autosuggest',
  'travel-booking-hub',
  'travel-category-deck',
  'travel-catalog-seeds',
  'travelpayouts-white-label',
  'passenger-drawer',
  'travel-skeleton',
  'tutor-copilot',
  'gemini-tutor-solver',
  'lib/travel',
  'lib/tutor',
  'lib/career',
];

for (const t of targets) {
  const matches = [];
  for (const file of files) {
    const rel = path.relative(custSrc, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes(t)) {
      matches.push(rel);
    }
  }
  console.log(`${t.padEnd(30)}: ${matches.join(', ')}`);
}
