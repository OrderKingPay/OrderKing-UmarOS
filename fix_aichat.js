const fs = require('fs');
const file = 'orderking-customers/src/components/ai/supreme-founder-ai-chat.tsx';
let c = fs.readFileSync(file, 'utf8');
c = c.replace(/t === "cost_optimization" \|\| /g, '');
c = c.replace(/t === "credential_config" \|\| /g, '');
c = c.replace(/t === "delivery_graph" \|\| /g, '');
fs.writeFileSync(file, c);
