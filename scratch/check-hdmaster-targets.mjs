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
const targets = ['education', 'jobs', 'travel', 'dev', 'events'];

for (const t of targets) {
  console.log(`\n=== References to "${t}" in HDmaster/src ===`);
  for (const file of files) {
    const rel = path.relative(hdmasterSrc, file).replace(/\\/g, '/');
    if (
      rel.startsWith(`lib/orderking/${t}/`) ||
      rel.startsWith(`components/${t}/`) ||
      rel.startsWith(`routes/v1/${t}/`)
    ) {
      continue;
    }
    const content = fs.readFileSync(file, 'utf8');
    if (
      content.includes(`/${t}'`) ||
      content.includes(`/${t}"`) ||
      content.includes(`/${t}/`) ||
      content.includes(`/${t}.`) ||
      content.includes(`@/components/${t}`) ||
      content.includes(`@/lib/orderking/${t}`)
    ) {
      console.log(`  ${rel}`);
    }
  }
}
