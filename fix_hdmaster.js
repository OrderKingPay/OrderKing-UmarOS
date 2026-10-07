const fs = require('fs');
let file = 'HDmaster/src/lib/orderking/server/business-os.server.ts';
if (fs.existsSync(file)) {
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/ as any;/g, ';');
  fs.writeFileSync(file, c);
}
file = 'HDmaster/src/lib/server/business-os.ts';
if (fs.existsSync(file)) {
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/ as any;/g, ';');
  fs.writeFileSync(file, c);
}
