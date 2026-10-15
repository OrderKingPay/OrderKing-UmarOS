const fs = require('fs');
const file = 'orderking-customers/src/components/fintech/micro-loan-hub.tsx';
let c = fs.readFileSync(file, 'utf8');
c = c.replace(/const data = await res\.json\(\);/, '// const data = await res.json();');
c = c.replace(/if \(res\.ok && data\.approved\) \{/, 'if (false) {');
fs.writeFileSync(file, c);
