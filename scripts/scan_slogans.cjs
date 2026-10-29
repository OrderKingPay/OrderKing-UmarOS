const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      if (stat && stat.isDirectory()) {
        if (!full.includes('node_modules') && !full.includes('.git') && !full.includes('test') && !full.includes('dist')) {
          results = results.concat(walk(full));
        }
      } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
        if (!full.includes('.test.') && !full.includes('test-') && !full.includes('/test/')) {
          results.push(full);
        }
      }
    });
  } catch (e) {}
  return results;
}

const packages = ['orderking-customers/src', 'orderking-partners/src', 'orderking-riders/src'];
let allFiles = [];
packages.forEach(p => {
  allFiles = allFiles.concat(walk(p));
});

const sloganPatterns = [
  { name: 'Sovereign slogan', re: /\bsovereign\b/i },
  { name: 'Culinary revolution', re: /culinary revolution/i },
  { name: 'Unmatched', re: /\bunmatched\b/i },
  { name: 'World-class', re: /world-class/i },
  { name: 'Zero-downtime', re: /zero-downtime/i },
  { name: 'Secret weapon', re: /secret weapon/i },
  { name: 'Superpower', re: /superpower/i },
  { name: 'Ultra-luxury / Hyper-luxury', re: /(ultra|hyper)-luxury/i },
  { name: '100% free / guaranteed richest', re: /(100% free|guaranteed richest|magic delivery)/i },
  { name: 'Fake discount / promo slogans', re: /(50% off everything|unlimited free food)/i }
];

let hits = [];
allFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
    for (const pat of sloganPatterns) {
      if (pat.re.test(line)) {
        hits.push({ file: f, line: idx + 1, category: pat.name, text: trimmed });
        break;
      }
    }
  });
});

console.log('TOTAL DETECTED SLOGAN OCCURRENCES:', hits.length);
const byCategory = {};
hits.forEach(h => {
  byCategory[h.category] = (byCategory[h.category] || 0) + 1;
});
console.log('BY CATEGORY:', JSON.stringify(byCategory, null, 2));

console.log('\nSAMPLE HITS (Top 25):');
hits.slice(0, 25).forEach(h => {
  console.log(`[${h.category}] ${h.file}:${h.line} -> ${h.text.slice(0, 90)}`);
});
