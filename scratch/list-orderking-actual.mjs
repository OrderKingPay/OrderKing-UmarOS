import fs from 'fs';
import path from 'path';

const cwd = process.cwd();
const libPath = path.resolve(cwd, 'HDmaster/src/lib/orderking');
const entries = fs.readdirSync(libPath, { withFileTypes: true });
const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);
const files = entries.filter(e => e.isFile()).map(e => e.name);

console.log('DIRECTORIES in HDmaster/src/lib/orderking (' + dirs.length + '):');
console.log(dirs);

console.log('\nFILES in HDmaster/src/lib/orderking (' + files.length + '):');
console.log(files);
