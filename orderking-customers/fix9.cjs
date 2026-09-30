
const fs = require('fs');

let content = fs.readFileSync('src/lib/viral-growth.test.ts', 'utf8');
content = 'declare const assert: any;\ndeclare const it: any;\ndeclare const describe: any;\n' + content;
fs.writeFileSync('src/lib/viral-growth.test.ts', content);

content = fs.readFileSync('src/routes/cart.tsx', 'utf8');
content = content.replace(/\(p\)/g, '(p: any)').replace(/ p =>/g, ' (p: any) =>');
fs.writeFileSync('src/routes/cart.tsx', content);

content = fs.readFileSync('src/routes/orders/$id.tsx', 'utf8');
content = content.replace(/\(it\)/g, '(it: any)').replace(/ it =>/g, ' (it: any) =>');
fs.writeFileSync('src/routes/orders/$id.tsx', content);

content = fs.readFileSync('src/test/founder-conversational.test.ts', 'utf8');
content = content.replace(/res ===/g, '(res as any) ===');
fs.writeFileSync('src/test/founder-conversational.test.ts', content);

