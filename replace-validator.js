const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('dist') && !file.includes('.next')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('C:/Users/hasan/OrderKing/orderking-customers/src').concat(walk('C:/Users/hasan/OrderKing/orderking-partners/src'));
let changed = 0;
for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('inputValidator(')) {
        const newContent = content.replace(/inputValidator\(/g, 'validator(');
        fs.writeFileSync(file, newContent, 'utf8');
        changed++;
        console.log('Updated', file);
    }
}
console.log('Total files changed:', changed);
