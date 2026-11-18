const fs = require('fs');
const path = require('path');

const packages = [
  'orderking-customers/src',
  'orderking-partners/src',
  'orderking-riders/src',
  'HDmaster/src/components',
  'HDmaster/src/routes'
];

const patterns = [
  { name: 'coming-soon', regex: /coming soon/i },
  { name: 'under-development', regex: /under development/i },
  { name: 'suspended', regex: /\bsuspended\b/i },
  { name: 'settlement-hold', regex: /settlement hold/i },
  { name: 'collection-suspended', regex: /collection suspended/i },
  { name: 'gateway-pending', regex: /gateway pending/i },
  { name: 'authorization-pending', regex: /authorization pending/i }
];

let found = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (f !== 'node_modules' && f !== 'dist' && f !== '.git') walk(p);
    } else if (/\.(tsx|jsx)$/.test(f) && !f.includes('.test.') && !f.includes('tests/')) {
      const content = fs.readFileSync(p, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (/^(\/\/|\/\*|\*)/.test(trimmed)) return;

        for (const { name, regex } of patterns) {
          if (regex.test(trimmed)) {
            if (/[>"'`]/.test(trimmed)) {
              found.push({ file: path.relative(process.cwd(), p), line: idx + 1, name, text: trimmed });
              break;
            }
          }
        }
      });
    }
  }
}

packages.forEach(p => walk(path.resolve(process.cwd(), p)));
console.log('Total matches found:', found.length);
found.forEach((m) => {
  console.log(`[${m.name}] ${m.file}:${m.line}: ${m.text.substring(0, 140)}`);
});
