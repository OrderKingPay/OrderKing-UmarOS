const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('dist') && !file.includes('.temp') && !file.includes('.pnpm')) {
        results = results.concat(walk(file));
      }
    } else {
      if (/\.(ts|tsx|js|jsx|md|json)$/.test(file)) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('C:/Users/hasan/OrderKing');
let count = 0;

for (const file of files) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    // Only replace Umar OS or UmarOS or Omar
    // Let's do a safe replace of 'Umar OS' to 'Umar OS' and 'UmarOS' to 'UmarOS'
    // Also lowercase umar_os to umar_os, etc.
    let newContent = content
      .replace(/Umar OS/g, 'Umar OS')
      .replace(/UmarOS/g, 'UmarOS')
      .replace(/umar_os/g, 'umar_os')
      .replace(/getUmarOS/g, 'getUmarOS')
      .replace(/Umar /g, 'Umar ');
      
    if (content !== newContent) {
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(`Updated: ${file}`);
      count++;
    }
  } catch (e) {
    // skip
  }
}

console.log(`Replaced in ${count} files.`);
