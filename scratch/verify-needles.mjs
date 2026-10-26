import fs from 'node:fs';
import path from 'node:path';

const hdmasterSrc = 'c:/Users/hasan/OrderKing/HDmaster/src';
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

const files = walk(hdmasterSrc);
const needles = ['TravelPage', 'EducationDashboard', 'WorkMarketplaceControlCenter', 'travel-skeleton', 'travel-http', 'curriculum-manager', 'ai-tutor', 'jobs-marketplace', 'ai-work-matcher'];

for (const needle of needles) {
  const matches = [];
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes(needle)) {
      matches.push(path.relative(hdmasterSrc, file).replace(/\\/g, '/'));
    }
  }
  console.log(`${needle.padEnd(30)}: ${matches.join(', ')}`);
}
