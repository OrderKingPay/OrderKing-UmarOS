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
  { name: 'mock', regex: /\b(mock)\b/i },
  { name: 'fake', regex: /\b(fake)\b/i },
  { name: 'dummy', regex: /\b(dummy)\b/i },
  { name: 'sample', regex: /\b(sample)\b/i },
  { name: 'lorem', regex: /\b(lorem|ipsum)\b/i },
  { name: 'todo-fixme', regex: /\b(TODO|FIXME)\b/ }
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
        // Ignore comments
        if (/^(\/\/|\/\*|\*)/.test(trimmed)) return;
        // Ignore anti-fake / zero-mock guards and comments
        if (/anti-fake|antiFake|purgeFake|zero-mock|zero fake/i.test(trimmed)) return;

        for (const { name, regex } of patterns) {
          if (regex.test(trimmed)) {
            // Only report if it appears to be inside a string literal or JSX text
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
console.log('Total UI mock/fake/dummy matches found:', found.length);
found.forEach((m) => {
  console.log(`[${m.name}] ${m.file}:${m.line}: ${m.text.substring(0, 140)}`);
});
