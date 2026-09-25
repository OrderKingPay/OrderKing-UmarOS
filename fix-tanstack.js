const fs = require('fs');
let file = 'HDmaster/src/lib/orderking/server/business-os.server.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/@tanstack\/start/g, '@tanstack/react-start');

fs.writeFileSync(file, content);
