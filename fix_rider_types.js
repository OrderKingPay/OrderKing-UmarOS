const fs = require('fs');
const file = 'orderking-riders/src/lib/server/rider-fns.ts';
let c = fs.readFileSync(file, 'utf8');
c = c.replace(/expectedDistanceM:/g, '// expectedDistanceM:');
c = c.replace(/expectedEtaSeconds:/g, '// expectedEtaSeconds:');
fs.writeFileSync(file, c);
