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
const excludePaths = [
  'routes/travel.tsx',
  'routes/travel/',
  'routes/tutor.tsx',
  'routes/tutor-jobs/',
  'routes/-tutor-jobs.tsx',
  'routes/api/travel/',
  'routes/api/ai/solve.ts',
  'components/travel/',
  'components/tutor/',
  'components/tutor-jobs/',
  'components/education/',
  'lib/travel/',
  'lib/tutor/',
  'lib/career/',
  'components/fintech/flight-booking-engine.tsx',
  'components/fintech/bus-booking-engine.tsx',
  'components/fintech/cab-booking-engine.tsx',
  'components/fintech/hotel-booking-engine.tsx',
  'components/fintech/train-booking-engine.tsx',
  'components/fintech/sovereign-eticket-modal.tsx',
  'components/fintech/sovereign-travel-concierge.tsx',
  'components/fintech/travel-autosuggest.tsx',
  'components/fintech/travel-booking-hub.tsx',
  'components/fintech/travel-category-deck.tsx',
  'components/fintech/travel-catalog-seeds.ts',
  'components/fintech/travelpayouts-white-label.tsx',
  'components/fintech/passenger-drawer.tsx',
  'components/fintech/vip-concierge-modal.tsx',
  'components/skeletons/travel-skeleton.tsx',
  'components/ai/tutor-copilot.tsx',
  'lib/ai/gemini-tutor-solver.ts',
  'lib/server/gemini-tutor-solver.ts',
  'routeTree.gen.ts',
];

console.log('=== Checking files outside targets for travel/tutor references ===');
for (const file of files) {
  const rel = path.relative(custSrc, file).replace(/\\/g, '/');
  if (excludePaths.some(p => rel.startsWith(p) || rel === p)) continue;
  const content = fs.readFileSync(file, 'utf8');
  if (/travel|irctc|amadeus|redbus|AITutor|curriculum-manager/i.test(content)) {
    console.log(`  ${rel}`);
  }
}
