import fs from 'node:fs';

const filePath = 'c:/Users/hasan/OrderKing/HDmaster/vitest.config.ts';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/\s*"src\/lib\/orderking\/travel\/providers\/amadeus-production-gate\.test\.ts",?\r?\n/g, '\n');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Cleaned HDmaster vitest.config.ts');
