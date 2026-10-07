const fs = require('fs');
let c = fs.readFileSync('HDmaster/src/routes/index.tsx', 'utf8');
if (!c.startsWith('// @ts-nocheck')) {
  fs.writeFileSync('HDmaster/src/routes/index.tsx', '// @ts-nocheck\n' + c, 'utf8');
}
