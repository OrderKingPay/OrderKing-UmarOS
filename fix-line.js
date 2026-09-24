const fs = require('fs');
const path = 'C:/Users/hasan/OrderKing/HDmaster/src/lib/orderking/ai/supreme-founder-ai-core.ts';
let lines = fs.readFileSync(path, 'utf8').split('\n');
lines[334] = 'export async function parseFounderQuery(query: string, founderUpiVpa: string = "orderking@okhdfcbank"): Promise<{';
fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log("Fixed line 334.");
