const fs = require('fs');
const path = require('path');

const excludeDirs = ['node_modules', '.git', 'dist', '.next', '.pnpm', '.temp'];
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!excludeDirs.some(ex => file.includes(ex))) {
        results = results.concat(walk(file));
      }
    } else {
      if (/\.(ts|tsx)$/.test(file)) {
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
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content;

    // These regexes only replace text inside JSX tags (or typical UI string bounds) without destroying state keys if possible,
    // actually, let's just do a plain replace of these problematic phrases exactly.

    const replacements = [
      [/100x Realism/ig, 'High-Fidelity'],
      [/1000x Realism/ig, 'High-Fidelity'],
      [/100x/g, 'Advanced'],
      [/1000x/g, 'Advanced'],
      [/Supreme type fastest/ig, 'Ultra-Fast'],
      [/Forceful realism/ig, 'High-Fidelity'],
      [/Supreme level/ig, 'Enterprise Grade'],
      [/missile type/ig, 'High_Performance'],
      [/missile category/ig, 'High_Performance'],
      [/supreme/ig, 'core'],
    ];

    // Wait, replacing 'supreme' with 'core' globally might break imports like 'supreme-founder-ai-core'.
    // Let's only do exact phrases found in the codebase.
    const preciseReplacements = [
      [/(100x|1000x) Realism/ig, 'High-Fidelity'],
      [/100x more perfections/ig, 'Enterprise Quality'],
      [/forceful realism/ig, 'High-Fidelity'],
      [/supreme level/ig, 'Enterprise level'],
      [/missile type/ig, 'High_Performance'],
      [/missile category/ig, 'High_Performance'],
      [/(?<=[>\s"'])100x(?=[\s<"'])/g, 'High_Performance'] // only standalone 100x
    ];

    for (let [pattern, replacement] of preciseReplacements) {
      newContent = newContent.replace(pattern, replacement);
    }
    
    if (content !== newContent) {
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(`Updated leaked words in: ${file}`);
      count++;
    }
  } catch (e) {
    // skip
  }
}
console.log(`Cleaned up ${count} files.`);

