const fs = require('fs');
let f = 'Apps-integration-/src/lib/auth/gates.tsx';
if (fs.existsSync(f)) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/\{\/\* <Navigate to="\/login" \/> \*\/\}/g, '<Navigate to={to as any} />');
  fs.writeFileSync(f, c);
}
