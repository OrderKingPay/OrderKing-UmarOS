const fs = require('fs');
const path = require('path');

function searchDir(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === '.output' || entry.name === '.turbo' || entry.name === '.vinxi') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      searchDir(full, results);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('@ts-ignore') || line.includes('@ts-nocheck')) {
          results.push({ file: full, line: idx + 1, text: line.trim() });
        }
      });
    }
  }
  return results;
}

const apps = ['HDmaster', 'orderking-customers', 'orderking-partners', 'orderking-riders', 'packages/ui'];
for (const app of apps) {
  const hits = searchDir(app);
  console.log(`=== ${app} (${hits.length} hits) ===`);
  hits.forEach(h => console.log(`  ${h.file}:${h.line}  ->  ${h.text}`));
}
