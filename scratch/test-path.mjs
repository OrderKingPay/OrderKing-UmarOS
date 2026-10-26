import fs from 'fs';
import path from 'path';

const cwd = process.cwd();
console.log('Current working directory:', cwd);
const libPath = path.resolve(cwd, 'HDmaster/src/lib/orderking');
console.log('Resolved libPath:', libPath);
console.log('Exists:', fs.existsSync(libPath));
if (fs.existsSync(libPath)) {
  const list = fs.readdirSync(libPath);
  console.log('Total dirs in libPath:', list.length);
  console.log('First 10:', list.slice(0, 10));
}
