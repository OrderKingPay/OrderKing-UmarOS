const fs = require('fs');
let file = 'HDmaster/src/lib/orderking/ai/tool-registry.server.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/verify: \(output\) => typeof output.users/g, "verify: (output: any) => typeof output.users");
content = content.replace(/verify: \(output\) => typeof output.totalVolume/g, "verify: (output: any) => typeof output.totalVolume");
content = content.replace(/verify: \(output\) => Array.isArray\(output.exceptions\)/g, "verify: (output: any) => Array.isArray(output.exceptions)");
content = content.replace(/verify: \(output\) => typeof output.count/g, "verify: (output: any) => typeof output.count");
content = content.replace(/verify: \(output\) => typeof output.refundsPrepared/g, "verify: (output: any) => typeof output.refundsPrepared");

fs.writeFileSync(file, content);
