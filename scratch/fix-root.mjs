import fs from 'node:fs';

const filePath = 'c:/Users/hasan/OrderKing/orderking-customers/src/routes/__root.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const danglingRegex = /\n\s+data-noptimize="1"[\s\S]*?\n\s*\);\r?\n\s*\}\r?\n/;
content = content.replace(danglingRegex, '\n\n');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed dangling script tag in __root.tsx');
