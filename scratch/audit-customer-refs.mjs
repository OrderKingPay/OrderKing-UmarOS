import fs from 'node:fs';
import path from 'node:path';

const root = 'c:/Users/hasan/OrderKing';

function getAppFiles(appDir) {
  let res = [];
  const fullAppDir = path.join(root, appDir);
  if (!fs.existsSync(fullAppDir)) return res;
  function walk(curr) {
    for (const ent of fs.readdirSync(curr, { withFileTypes: true })) {
      const p = path.join(curr, ent.name);
      if (ent.isDirectory()) {
        if (!['node_modules', '.git', 'dist', '.wrangler', '.tanstack', '.output'].includes(ent.name)) {
          walk(p);
        }
      } else if (/\.(tsx?|jsx?|mjs|cjs)$/.test(ent.name)) {
        res.push(p);
      }
    }
  }
  walk(fullAppDir);
  return res;
}

const customerFiles = getAppFiles('orderking-customers/src');
console.log('Customer files referencing travel, tutor, jobs:');
for (const file of customerFiles) {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');
  const matches = [];
  if (content.includes('travel') || content.includes('Travel')) matches.push('travel');
  if (content.includes('tutor') || content.includes('Tutor')) matches.push('tutor');
  if (content.includes('AIWorkMatcher') || content.includes('jobs-marketplace')) matches.push('jobs');
  if (matches.length > 0) {
    console.log(`  ${rel} (${matches.join(', ')})`);
  }
}
