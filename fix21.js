const fs = require('fs');
let f = 'HDmaster/src/routes/index.tsx';
let c = fs.readFileSync(f, 'utf8');
c = c.replace(/AlertCircle, Users/g, 'AlertCircle, Users, ShieldCheck');
fs.writeFileSync(f, c);
