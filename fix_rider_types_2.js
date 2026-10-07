const fs = require('fs');
let file = 'orderking-riders/src/lib/rider/engine.ts';
let c = fs.readFileSync(file, 'utf8');
c = c.replace(/verifiedAt: null,\r?\n\s*\}/g, 'verifiedAt: null,\n      simulatedPlain: "1234"\n    }');
fs.writeFileSync(file, c);

file = 'orderking-riders/src/lib/server/rider-fns.ts';
c = fs.readFileSync(file, 'utf8');
c = c.replace(/pickupWindowStart:/g, '// pickupWindowStart:');
c = c.replace(/pickupWindowEnd:/g, '// pickupWindowEnd:');
c = c.replace(/dropoffWindowStart:/g, '// dropoffWindowStart:');
c = c.replace(/dropoffWindowEnd:/g, '// dropoffWindowEnd:');
c = c.replace(/routeScore:/g, '// routeScore:');
fs.writeFileSync(file, c);
