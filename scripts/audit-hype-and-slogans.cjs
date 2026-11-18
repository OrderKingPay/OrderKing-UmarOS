const fs = require('fs');
const path = require('path');

const packages = [
  'orderking-customers/src',
  'orderking-partners/src',
  'orderking-riders/src',
  'HDmaster/src/components'
];

const patterns = [
  { name: 'cutting-edge', regex: /cutting[- ]edge/i },
  { name: 'next-gen', regex: /next[- ]gen/i },
  { name: 'state-of-the-art', regex: /state[- ]of[- ]the[- ]art/i },
  { name: 'best-in-class', regex: /best[- ]in[- ]class/i },
  { name: 'best-in-the', regex: /best in the/i },
  { name: 'dominate', regex: /\bdominate\b/i },
  { name: 'insane', regex: /\binsane\b/i },
  { name: 'unbelievable', regex: /\bunbelievable\b/i },
  { name: 'super-fast', regex: /super[- ]fast/i },
  { name: 'lightning-fast', regex: /lightning[- ]fast/i },
  { name: 'magic', regex: /\bmagic\b/i },
  { name: 'disrupt', regex: /\bdisrupt(ive|ing)?\b/i },
  { name: 'guaranteed', regex: /\bguaranteed\b/i }
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
        // Ignore imports, type declarations, comments
        if (/^(\/\/|\/\*|\*|import\s|export type|interface\s)/.test(trimmed)) return;
        if (/className=/.test(trimmed) && !/>.*</.test(trimmed)) return;
        if (/anti-fake|antiFake|purgeFake|zero-mock/i.test(trimmed)) return;

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
console.log('Total UI matches found:', found.length);
found.forEach((m) => {
  console.log(`[${m.name}] ${m.file}:${m.line}: ${m.text.substring(0, 130)}`);
});
