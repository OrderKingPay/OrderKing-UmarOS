
const fs = require('fs');

let content = fs.readFileSync('src/routes/r/$slug.tsx', 'utf8');
content = content.replace(/onAddClick\(it: any\)/g, 'onAddClick(it)');
fs.writeFileSync('src/routes/r/$slug.tsx', content);

console.log('Fixed.');

