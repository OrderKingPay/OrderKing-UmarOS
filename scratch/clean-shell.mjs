import fs from 'node:fs';

const file = 'c:/Users/hasan/OrderKing/HDmaster/src/components/command/shell.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/pathname\.startsWith\("\/app\/travel"\)\s*\|\|\r?\n/g, '');
content = content.replace(/pathname\.startsWith\("\/app\/education"\)\s*\|\|\r?\n/g, '');
content = content.replace(/pathname\.startsWith\("\/app\/jobs"\)\s*\|\|\r?\n/g, '');

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated shell.tsx');
