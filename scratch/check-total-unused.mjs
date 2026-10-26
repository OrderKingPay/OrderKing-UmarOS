import fs from 'fs';
import path from 'path';

const hdmaster = 'C:/Users/hasan/OrderKing/HDmaster';
const libOrderKing = path.join(hdmaster, 'src/lib/orderking');
const srcDir = path.join(hdmaster, 'src');

function getAllFiles(dir, exts = ['.ts', '.tsx', '.js', '.jsx']) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name !== 'node_modules' && item.name !== '.git' && item.name !== 'dist' && item.name !== 'orderking') {
        files = files.concat(getAllFiles(p, exts));
      }
    } else if (exts.includes(path.extname(item.name))) {
      files.push(p);
    }
  }
  return files;
}

const allOtherSrcFiles = getAllFiles(srcDir);
const allOtherSrcContent = allOtherSrcFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');

const modules = fs.readdirSync(libOrderKing, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

const usedInSrc = [];
const completelyUnused = [];

for (const mod of modules) {
  const pattern = new RegExp(`['"](@/lib/orderking/|\\.\\./|\\./)${mod}(/|['"])`, 'g');
  if (allOtherSrcContent.match(pattern)) {
    usedInSrc.push(mod);
  } else {
    // Check if any other orderking module imports it
    let importedByAnyOrderking = false;
    for (const otherMod of modules) {
      if (otherMod === mod) continue;
      const otherDir = path.join(libOrderKing, otherMod);
      const otherFiles = getAllFiles(otherDir);
      for (const of of otherFiles) {
        const c = fs.readFileSync(of, 'utf8');
        if (c.includes(`/${mod}/`) || c.includes(`/${mod}'`) || c.includes(`/${mod}"`)) {
          importedByAnyOrderking = true;
          break;
        }
      }
      if (importedByAnyOrderking) break;
    }
    if (importedByAnyOrderking) {
      usedInSrc.push(`${mod} (internal orderking ref)`);
    } else {
      completelyUnused.push(mod);
    }
  }
}

console.log(`Used / Referenced modules: ${usedInSrc.length}`);
console.log(`Completely UNREFERENCED anywhere in HDmaster (dead code): ${completelyUnused.length}`);
console.log('Dead code directories:');
console.log(completelyUnused);
