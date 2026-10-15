const fs = require('fs');
const files = [
  'orderking-riders/src/components/rider/delivery-actions.tsx',
  'orderking-riders/src/lib/rider/engine.ts',
  'orderking-riders/src/lib/server/assistant.ts',
  'orderking-riders/src/lib/server/rider-fns.ts'
];
for (const file of files) {
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/\/\/\s*@ts-nocheck\r?\n/g, '');
  fs.writeFileSync(file, c);
}
