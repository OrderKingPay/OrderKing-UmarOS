const fs = require('fs');
const path = require('path');

const packages = ['HDmaster/src', 'orderking-customers/src', 'orderking-partners/src', 'orderking-riders/src', 'packages/ui/src'];

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        walk(full, fileList);
      }
    } else if (/\.(tsx|ts)$/.test(file)) {
      fileList.push(full);
    }
  }
  return fileList;
}

const audit = {
  dummyWords: [],
  slogans: [],
  emptyButtons: [],
  disabledOrNoop: [],
  deadLinks: []
};

for (const pkg of packages) {
  const fullPkg = path.resolve(__dirname, '..', pkg);
  const files = walk(fullPkg);
  for (const f of files) {
    if (f.includes('.test.') || f.includes('tests/')) continue;
    const rel = path.relative(path.resolve(__dirname, '..'), f);
    const content = fs.readFileSync(f, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = line.trim();

      // Check dummy/mock/fake (excluding input placeholder= or test/anti-fake)
      if (/\b(dummy|fake|mock|placeholder)\b/i.test(trimmed)) {
        if (!/placeholder\s*=/i.test(trimmed) && !/anti-fake/i.test(trimmed) && !/replace/i.test(trimmed)) {
          audit.dummyWords.push({ file: rel, line: lineNum, text: trimmed });
        }
      }

      // Check slogans, marketing hype
      if (/\b(world-class|unmatched|revolutionary|magical|miracle|best in|slogan|tagline)\b/i.test(trimmed)) {
        audit.slogans.push({ file: rel, line: lineNum, text: trimmed });
      }

      // Check for empty button or action handlers
      if (/onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/.test(trimmed) || /onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*undefined\s*\}/.test(trimmed)) {
        audit.emptyButtons.push({ file: rel, line: lineNum, text: trimmed });
      }

      // Check dead links e.g. href="#" or to="#"
      if (/(href|to)\s*=\s*["']#["']/.test(trimmed)) {
        audit.deadLinks.push({ file: rel, line: lineNum, text: trimmed });
      }
    });
  }
}

console.log('=== AUDIT RESULTS ===');
console.log('Dummy/Mock words:', audit.dummyWords.length);
audit.dummyWords.forEach(w => console.log(`  [DUMMY] ${w.file}:${w.line}: ${w.text.substring(0, 100)}`));

console.log('\nSlogans / Marketing Hype:', audit.slogans.length);
audit.slogans.forEach(s => console.log(`  [SLOGAN] ${s.file}:${s.line}: ${s.text.substring(0, 100)}`));

console.log('\nEmpty Buttons:', audit.emptyButtons.length);
audit.emptyButtons.forEach(b => console.log(`  [EMPTY-BTN] ${b.file}:${b.line}: ${b.text.substring(0, 100)}`));

console.log('\nDead Links (href="#" or to="#"):', audit.deadLinks.length);
audit.deadLinks.forEach(l => console.log(`  [DEAD-LINK] ${l.file}:${l.line}: ${l.text.substring(0, 100)}`));
