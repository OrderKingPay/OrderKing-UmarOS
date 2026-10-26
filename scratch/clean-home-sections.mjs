import fs from 'node:fs';

const filePath = 'c:/Users/hasan/OrderKing/orderking-customers/src/components/sdui/home-sections.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/\{\s*id:\s*"travel_zero_fee"[\s\S]*?\},\r?\n/, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Cleaned home-sections.tsx');
