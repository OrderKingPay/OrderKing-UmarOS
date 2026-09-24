const fs = require('fs');
const path = 'C:/Users/hasan/OrderKing/HDmaster/src/lib/orderking/ai/supreme-founder-ai-core.ts';
let lines = fs.readFileSync(path, 'utf8').split('\n');
lines[383] = '}> {';
fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log("Fixed line 384.");
