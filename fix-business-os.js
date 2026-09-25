const fs = require('fs');
let file = 'HDmaster/src/lib/orderking/server/business-os.server.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/return ([A-Za-z0-9_]+\.[A-Za-z0-9_]+\(\));/g, 'return  as any;');
fs.writeFileSync(file, content);
