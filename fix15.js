const fs = require('fs');
let f = 'HDmaster/src/lib/orderking/server/business-os.server.ts';
let c = fs.readFileSync(f, 'utf8');
c = c.replace(/export const getRegisteredAdapters = createServerFn\(\{(.*?)\}\)\.handler\(async \(\) => \{\n\s+await requireFounderAccess\(\);\n\s+return liveOrchestrationEngine\.listRegisteredAdapters\(\);\n\}\);/g, 'export const getRegisteredAdapters = createServerFn({}).handler(async () => {\n  await requireFounderAccess();\n  return liveOrchestrationEngine.listRegisteredAdapters().map(({ executePrompt, ...rest }) => rest);\n});');
fs.writeFileSync(f, c);

let f2 = 'HDmaster/src/lib/engine/ledger.ts';
let c2 = fs.readFileSync(f2, 'utf8');
// Fix: (order as any).total_amount * (order.commission_rate || 0.15) -> Number(order.total_amount) * Number(order.commission_rate || 0.15)
c2 = c2.replace(/Number\(order\.total_amount\) \* \(order\.commission_rate \|\| 0\.15\)/g, 'Number(order.total_amount) * Number(order.commission_rate || 0.15)');
// Fix: Type 'unknown' is not assignable to type 'string | undefined'
c2 = c2.replace(/orderId: order\.id/g, 'orderId: order.id as string');
fs.writeFileSync(f2, c2);
