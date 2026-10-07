const fs = require('fs');

let f1 = 'HDmaster/src/lib/orderking/ai/tool-registry.server.ts';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(/\\/g, '\');
fs.writeFileSync(f1, c1);

let f2 = 'HDmaster/src/lib/orderking/ai/universal-tool-fabric.ts';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(/\\/g, '\').replace(/\\\$/g, '\$');
fs.writeFileSync(f2, c2);

let f3 = 'HDmaster/src/lib/orderking/ai/founder-conversational-control.server.ts';
let c3 = fs.readFileSync(f3, 'utf8');
c3 = c3.replace(/\\/g, '\').replace(/\\\$/g, '\$');
fs.writeFileSync(f3, c3);

let f4 = 'HDmaster/src/routes/api/v1/founder/execute.ts';
let c4 = fs.readFileSync(f4, 'utf8');
c4 = c4.replace(/\\/g, '\').replace(/\\\$/g, '\$');
fs.writeFileSync(f4, c4);
