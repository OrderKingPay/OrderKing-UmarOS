const fs = require('fs');
let f = 'HDmaster/src/lib/orderking/server/business-os.server.ts';
let c = fs.readFileSync(f, 'utf8');
c = c.replace(/return liveOrchestrationEngine\.listRegisteredAdapters\(\);/g, 'return liveOrchestrationEngine.listRegisteredAdapters().map(({ executePrompt, ...rest }) => rest) as any;');
fs.writeFileSync(f, c);
