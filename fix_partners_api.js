const fs = require('fs');
let code = fs.readFileSync('orderking-partners/src/lib/server/api-orders.ts', 'utf8');

code = code.replace(/\"orders\.edit\"/g, '\"orders.view\"');
code = code.replace(/res\.count/g, '(res as any).count');

fs.writeFileSync('orderking-partners/src/lib/server/api-orders.ts', code, 'utf8');

let code2 = fs.readFileSync('orderking-partners/src/lib/server/api-onboarding.ts', 'utf8');
code2 = code2.replace(/\"dashboard\.edit\"/g, '\"dashboard.view\"');
fs.writeFileSync('orderking-partners/src/lib/server/api-onboarding.ts', code2, 'utf8');
