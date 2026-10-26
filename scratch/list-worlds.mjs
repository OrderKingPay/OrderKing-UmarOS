import fs from 'node:fs';

const content = fs.readFileSync('c:/Users/hasan/OrderKing/HDmaster/src/routes/index.tsx', 'utf8');
const regex = /{\s*id:\s*["']([^"']+)["'],\s*number:\s*(\d+),\s*navLabel:\s*["']([^"']+)["']/g;
let m;
while ((m = regex.exec(content)) !== null) {
  console.log(`World ${m[2]}: id="${m[1]}", label="${m[3]}"`);
}
