const fs = require('fs');
let content = fs.readFileSync('sync-vercel-env-v2.cjs', 'utf8');
content = content.replace(/production preview development/g, '"production,preview,development"');
fs.writeFileSync('sync-vercel-env-v2.cjs', content, 'utf8');
