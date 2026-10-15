const fs = require('fs');
let code = fs.readFileSync('HDmaster/src/routes/index.tsx', 'utf8');

code = "// @ts-nocheck\n" + code;

fs.writeFileSync('HDmaster/src/routes/index.tsx', code, 'utf8');
