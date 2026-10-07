const fs = require('fs');
const file = 'HDmaster/src/lib/orderking/ai/tool-registry.server.ts';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/verify: \(output\) => typeof/g, 'verify: (output: any) => typeof');
code = code.replace(/verify: \(output\) => Array.isArray/g, 'verify: (output: any) => Array.isArray');
fs.writeFileSync(file, code);
