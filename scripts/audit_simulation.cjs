const fs = require('fs');
const path = require('path');
const dirs = ['HDmaster/src', 'orderking-customers/src', 'orderking-partners/src', 'orderking-riders/src', 'packages/ui/src'];

function search(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'dist') search(full);
    } else if (/\.(tsx|ts)$/.test(f) && !f.includes('.test.')) {
      const code = fs.readFileSync(full, 'utf8');
      const lines = code.split('\n');
      lines.forEach((l, idx) => {
        if (/\b(simulate|simulation|simulated)\b/i.test(l)) {
          console.log(path.relative(path.resolve(__dirname, '..'), full) + ':' + (idx+1) + ': ' + l.trim().substring(0, 110));
        }
      });
    }
  }
}
dirs.forEach(d => search(path.resolve(__dirname, '..', d)));
