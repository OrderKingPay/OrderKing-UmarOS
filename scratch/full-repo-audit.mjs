import fs from 'node:fs';
import path from 'node:path';

const root = 'c:/Users/hasan/OrderKing';

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    if (['node_modules', '.git', 'dist', '.wrangler', '.tanstack', 'scratch'].includes(ent.name)) {
      continue;
    }
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(full, fileList);
    } else if (/\.(tsx?|jsx?|mjs|cjs|json|html|css)$/.test(ent.name)) {
      fileList.push(full);
    }
  }
  return fileList;
}

const allFiles = walk(root);
console.log(`Found ${allFiles.length} files to scan in repository.`);

const patterns = {
  amadeus: /amadeus/i,
  irctc: /irctc/i,
  redbus: /redbus/i,
  aiTutor: /AITutor|curriculum-manager/i,
  workMatcher: /AIWorkMatcher|jobs-marketplace/i,
  namaste: /namaste|namaskar/i,
  fakeMockRev: /mockGross|mockFood|184000/i,
};

const hits = {};
for (const key of Object.keys(patterns)) {
  hits[key] = [];
}

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  for (const [key, regex] of Object.entries(patterns)) {
    if (regex.test(content)) {
      hits[key].push(path.relative(root, file).replace(/\\/g, '/'));
    }
  }
}

for (const [key, files] of Object.entries(hits)) {
  console.log(`\n=== HIT: ${key} (${files.length} occurrences) ===`);
  files.forEach(f => console.log('  ' + f));
}
