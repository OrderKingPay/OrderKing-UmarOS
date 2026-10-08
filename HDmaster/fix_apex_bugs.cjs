const fs = require('fs');

// Fix vector-search.ts
const vsFile = 'src/lib/orderking/data/vector-search.ts';
let vsCode = fs.readFileSync(vsFile, 'utf8');
vsCode = vsCode.replace('const embedding = response.embeddings[0].values;', 'const embedding = response.embeddings?.[0]?.values;');
vsCode = vsCode.replace('if (!embedding) {', 'if (!embedding || embedding.length === 0) {');
fs.writeFileSync(vsFile, vsCode);

// Fix qa-orchestrator.ts
const qaFile = 'src/lib/orderking/qa/qa-orchestrator.ts';
let qaCode = fs.readFileSync(qaFile, 'utf8');
qaCode = qaCode.replace('const sql = getSql();', 'const sql = await getSql();');
// Ensure any remaining sql(...) calls are awaited properly if needed, but the error is the variable initialization.
fs.writeFileSync(qaFile, qaCode);
