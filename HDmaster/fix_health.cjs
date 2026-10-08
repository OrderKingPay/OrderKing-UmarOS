const fs = require('fs');
const file = 'src/lib/orderking/observability/health-monitor.server.ts';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/const sql = getSql\(\);/g, 'const sql = await getSql();');
fs.writeFileSync(file, code);
