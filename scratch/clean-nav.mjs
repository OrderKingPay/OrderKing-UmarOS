import fs from 'node:fs';

const file = 'c:/Users/hasan/OrderKing/HDmaster/src/lib/orderking/nav.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\{\s*id:\s*"education",\s*path:\s*"\/app\/education"[\s\S]*?\},\r?\n/g, '');

fs.writeFileSync(file, content, 'utf8');
console.log('Removed education from nav.ts');
